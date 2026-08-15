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

// ⚠ 정적 require — @vercel/nft 의존성 추적에 포함되어야 한다 (동적 import 금지)
const CS = require('../lib/claude-stream');

const ANTHROPIC_BASE     = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL       = 'claude-sonnet-4-6';
const MAX_TOKENS_DEFAULT = 16000;
const MAX_TURNS          = 10;
const MAX_TOTAL_TURNS    = 8;   // tool_use + continuation 합계 상한 (호출 폭증 방지)

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

    // CDN TTFB 타임아웃 방지: 요청 직전 200 OK 헤더 전송
    res.writeHead(200, { 'Content-Type': 'application/json' });

    let out;
    try {
      out = await CS.runWithContinuation({
        apiKey,
        model: CLAUDE_MODEL,
        system: systemPrompt,
        maxTokens: MAX_TOKENS_DEFAULT,
        messages: [{ role: 'user', content: userPrompt }],
        label: '1차-micro',
      });
    } catch (err) {
      console.log(`[ERROR] 1차-micro 호출 실패: ${err.message}`);
      return res.end(JSON.stringify({ error: err.message }));
    }

    console.log(`[1차-micro] 완료: turns=${out.turns}, 누적 output_tokens=${out.totalTokens}, text_len=${out.text.length}`);
    console.log(`[1차-micro] 뒤200자: ${out.text.slice(-200).replace(/\n/g, '↵')}`);

    if (!out.ok) return res.end(JSON.stringify({ error: out.error }));
    if (!out.text) return res.end(JSON.stringify({ error: 'Claude 1차 응답에서 텍스트를 추출할 수 없습니다.' }));
    return res.end(JSON.stringify({ text: out.text }));
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
  let totalTokens = 0;
  let contCount = 0;   // continuation 횟수 — tool_use turn과 별도로 최대 2회

  for (let turn = 0; turn < Math.min(MAX_TURNS, MAX_TOTAL_TURNS); turn++) {
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
    // prefill 이어쓰기에서 모델이 꼬리를 되풀이하는 경우를 방어
    if (turnText) finalText = CS.joinContinuation(finalText, turnText);

    totalTokens += data.usage?.output_tokens || 0;
    console.log(`[1차-sme] turn=${turn} stop_reason=${data.stop_reason} output_tokens=${data.usage?.output_tokens}`);

    if (data.stop_reason === 'end_turn') break;

    if (data.stop_reason === 'max_tokens') {
      // 절단 확정 — 이어쓰기(assistant prefill)로 최대 2회 복구 시도
      if (contCount >= CS.MAX_CONTINUATIONS || turn >= MAX_TOTAL_TURNS - 1) {
        console.log(`[ERROR] 1차-sme continuation ${contCount}회 후에도 미완성 — 누적 tokens=${totalTokens}`);
        return res.status(500).json({ error: 'max_tokens 초과 — 1차 응답 절단됨 (JSON 불완전)' });
      }
      contCount++;
      console.log(`[1차-sme] continuation 발동 — turn=${contCount}, 누적 output_tokens=${totalTokens}`);
      // assistant prefill — 연속 continuation 시 assistant 메시지가 겹치지 않도록 교체한다
      const prefill = { role: 'assistant', content: finalText.replace(/\s+$/, '') };
      const last = messages[messages.length - 1];
      if (last && last.role === 'assistant' && typeof last.content === 'string') messages[messages.length - 1] = prefill;
      else messages.push(prefill);
      continue;
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

  // stop_reason에 의존하지 않는 최종 완성 검사 — 스트림/루프가 조용히 끊긴 경우를 잡는다
  const diag = CS.diagnoseJson(finalText);
  if (diag !== 'ok') {
    console.log(`[ERROR] 1차-sme 미완성 응답 — diag=${diag}, continuation=${contCount}회, 누적 tokens=${totalTokens}`);
    return res.status(500).json({
      error: diag === 'truncated'
        ? 'max_tokens 초과 — 1차 응답 절단됨 (JSON 불완전)'
        : 'AI 응답 형식이 올바르지 않습니다 (절단 아님).',
    });
  }
  return res.json({ text: finalText });
};
