/**
 * Vercel Serverless Function: /api/claude-analyze-1
 * 1차 호출 전용
 *
 * micro 모드 (noSearch=true):
 *   stream: true → SSE 청크 누적 → 전체 텍스트 조립 후 반환
 *   max_tokens: 16000 (스트리밍이므로 타임아웃 無, 절단 없이 완성 보장)
 *
 * SME/일반 모드 (noSearch=false):
 *   기존 방식 유지 — web_search 1회 포함, tool_use 루프
 *   max_tokens: 16000
 */

const ANTHROPIC_BASE     = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL       = 'claude-sonnet-4-6';
const MAX_TOKENS_DEFAULT = 16000;
const MAX_TURNS          = 10;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { systemPrompt, userPrompt, noSearch } = req.body || {};
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY 미설정' });
  if (!userPrompt) return res.status(400).json({ error: '필수 파라미터 누락 (userPrompt)' });

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  };

  // ──────────────────────────────────────────────────────────────────────────
  // micro 모드: stream:true → SSE 청크 누적 → 완성 후 반환
  // ──────────────────────────────────────────────────────────────────────────
  if (noSearch) {
    console.log(`[1차-micro] 스트리밍 시작 (max_tokens=${MAX_TOKENS_DEFAULT})`);

    let claudeRes;
    try {
      claudeRes = await fetch(ANTHROPIC_BASE, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: MAX_TOKENS_DEFAULT,
          system: systemPrompt || '',
          stream: true,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });
    } catch (netErr) {
      return res.status(502).json({ error: 'Claude API 연결 실패: ' + netErr.message });
    }

    if (!claudeRes.ok) {
      let msg = `Claude API 오류 (${claudeRes.status})`;
      try { const e = await claudeRes.json(); msg = e.error?.message || msg; } catch (_) {}
      return res.status(claudeRes.status).json({ error: msg });
    }

    // CDN TTFB 타임아웃 방지: Claude 응답 확인 즉시 200 OK 헤더 전송
    res.writeHead(200, { 'Content-Type': 'application/json' });

    // SSE 스트림 읽기 → 텍스트 조립
    const reader = claudeRes.body.getReader();
    const decoder = new TextDecoder();
    let sseBuffer = '';
    let fullText  = '';
    let stopReason = null;
    let outputTokens = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split('\n');
        sseBuffer = lines.pop(); // 미완성 줄 보관

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === '[DONE]') continue;
          try {
            const evt = JSON.parse(raw);
            if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
              fullText += evt.delta.text;
            } else if (evt.type === 'message_delta') {
              stopReason   = evt.delta?.stop_reason;
              outputTokens = evt.usage?.output_tokens;
            }
          } catch (_) {}
        }
      }
    } finally {
      reader.releaseLock();
    }

    console.log(`[1차-micro] 스트리밍 완료: stop_reason=${stopReason}, output_tokens=${outputTokens}, text_len=${fullText.length}`);
    console.log(`[1차-micro] 앞200자: ${fullText.substring(0, 200).replace(/\n/g, '↵')}`);
    console.log(`[1차-micro] 뒤200자: ${fullText.slice(-200).replace(/\n/g, '↵')}`);

    if (stopReason === 'max_tokens') {
      console.log(`[ERROR] 1차-micro max_tokens 초과 — output_tokens: ${outputTokens}`);
      return res.end(JSON.stringify({ error: 'max_tokens 초과 — 1차 응답 절단됨 (JSON 불완전)' }));
    }
    if (!fullText) {
      return res.end(JSON.stringify({ error: 'Claude 1차 응답에서 텍스트를 추출할 수 없습니다.' }));
    }
    return res.end(JSON.stringify({ text: fullText }));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SME/일반 모드: 기존 방식 (web_search 1회 + tool_use 루프)
  // ──────────────────────────────────────────────────────────────────────────
  headers['anthropic-beta'] = 'web-search-2025-03-05';

  const tools = [{
    type: 'web_search_20250305',
    name: 'web_search',
    max_uses: 1,
  }];

  const messages = [{ role: 'user', content: userPrompt }];
  let finalText = '';

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    let claudeRes;
    try {
      claudeRes = await fetch(ANTHROPIC_BASE, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: MAX_TOKENS_DEFAULT,
          system: systemPrompt || '',
          tools,
          messages,
        }),
      });
    } catch (netErr) {
      return res.status(502).json({ error: 'Claude API 연결 실패: ' + netErr.message });
    }

    if (!claudeRes.ok) {
      let msg = `Claude API 오류 (${claudeRes.status})`;
      try { const e = await claudeRes.json(); msg = e.error?.message || msg; } catch (_) {}
      return res.status(claudeRes.status).json({ error: msg });
    }

    const data    = await claudeRes.json();
    const content = data.content || [];

    const turnText = content.filter(b => b.type === 'text').map(b => b.text).join('');
    if (turnText) finalText += turnText;

    console.log(`[1차-sme] turn=${turn} stop_reason=${data.stop_reason} output_tokens=${data.usage?.output_tokens}`);

    if (data.stop_reason === 'end_turn') break;

    if (data.stop_reason === 'max_tokens') {
      console.log(`[ERROR] 1차-sme max_tokens 초과 — output_tokens: ${data.usage?.output_tokens}`);
      return res.status(500).json({ error: 'max_tokens 초과 — 1차 응답 절단됨 (JSON 불완전)' });
    }

    if (data.stop_reason === 'pause_turn') {
      messages.push({ role: 'assistant', content });
      messages.push({ role: 'user', content: [{ type: 'text', text: 'continue' }] });
      continue;
    }

    if (data.stop_reason === 'tool_use') {
      messages.push({ role: 'assistant', content });
      const toolResults = content
        .filter(b => b.type === 'tool_use')
        .map(b => ({ type: 'tool_result', tool_use_id: b.id, content: [] }));
      if (toolResults.length) messages.push({ role: 'user', content: toolResults });
      continue;
    }

    break;
  }

  if (!finalText) {
    return res.status(500).json({ error: 'Claude 1차 응답에서 텍스트를 추출할 수 없습니다.' });
  }
  return res.json({ text: finalText });
};
