/**
 * Vercel Serverless Function: /api/claude-analyze-2
 * 2차 호출 전용 — web_search 없음
 *
 * micro 모드 (noSearch=true):
 *   stream: true → SSE 청크 누적 → 완성 후 반환, max_tokens: 16000
 *   담당: keyStrategies · fourP · specializedAnalysis · kpi · roadmap · sixSystems(D1~D4)
 *
 * SME/일반 모드 (noSearch=false):
 *   기존 단일 요청 방식, max_tokens: 16000
 *   담당: kpi · roadmap · sixSystems · plan90days · leanCanvas
 */

const ANTHROPIC_BASE     = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL       = 'claude-sonnet-4-6';
const MAX_TOKENS_DEFAULT = 16000;

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

  // ── micro 모드: 스트리밍 ──────────────────────────────────────────────────
  if (noSearch) {
    console.log(`[2차-micro] 스트리밍 시작 (max_tokens=${MAX_TOKENS_DEFAULT})`);

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
        sseBuffer = lines.pop();

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

    console.log(`[2차-micro] 스트리밍 완료: stop_reason=${stopReason}, output_tokens=${outputTokens}, text_len=${fullText.length}`);

    if (stopReason === 'max_tokens') {
      console.log(`[ERROR] 2차-micro max_tokens 초과 — output_tokens: ${outputTokens}`);
      return res.status(500).json({ error: 'max_tokens 초과 — 2차 응답 절단됨 (JSON 불완전)' });
    }
    if (!fullText) {
      return res.status(500).json({ error: 'Claude 2차 응답에서 텍스트를 추출할 수 없습니다.' });
    }
    return res.json({ text: fullText });
  }

  // ── SME/일반 모드: 기존 단일 요청 ────────────────────────────────────────
  let claudeRes;
  try {
    claudeRes = await fetch(ANTHROPIC_BASE, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: MAX_TOKENS_DEFAULT,
        system: systemPrompt || '',
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

  const data = await claudeRes.json();
  if (data.stop_reason === 'max_tokens') {
    console.log(`[ERROR] 2차-sme max_tokens 초과 — output_tokens: ${data.usage?.output_tokens}`);
    return res.status(500).json({ error: 'max_tokens 초과 — 2차 응답 절단됨 (JSON 불완전)' });
  }

  const finalText = (data.content || [])
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('');

  if (!finalText) {
    return res.status(500).json({ error: 'Claude 2차 응답에서 텍스트를 추출할 수 없습니다.' });
  }
  return res.json({ text: finalText });
};
