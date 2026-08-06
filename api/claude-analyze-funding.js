/**
 * Vercel Serverless Function: /api/claude-analyze-funding
 * 정책자금 진단 전용 — AI 실행 로드맵 단일 호출
 *
 * 경영진단(claude-analyze-1/2/3)과 달리 출력량이 적어 3분할이 불필요하다.
 * stream: true — CDN TTFB 타임아웃 방지를 위해 Claude 응답 확인 즉시 200 헤더를 보낸다
 * (2026-05-26 b681af2와 동일한 패턴).
 *
 * 요청:  POST { systemPrompt, userPrompt }
 * 응답:  { text } 또는 { error }
 */

const ANTHROPIC_BASE = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL   = 'claude-sonnet-4-6';
const MAX_TOKENS     = 6000;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { systemPrompt, userPrompt } = req.body || {};
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey)     return res.status(500).json({ error: 'ANTHROPIC_API_KEY 미설정' });
  if (!userPrompt) return res.status(400).json({ error: '필수 파라미터 누락 (userPrompt)' });

  let claudeRes;
  try {
    claudeRes = await fetch(ANTHROPIC_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: MAX_TOKENS,
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

  // CDN TTFB 타임아웃 방지 — 응답 확인 즉시 200 OK 헤더 전송
  res.writeHead(200, { 'Content-Type': 'application/json' });

  const reader = claudeRes.body.getReader();
  const decoder = new TextDecoder();
  let sseBuffer = '';
  let fullText = '';
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

  console.log(`[funding] 완료: stop_reason=${stopReason}, output_tokens=${outputTokens}, text_len=${fullText.length}`);

  if (stopReason === 'max_tokens') {
    return res.end(JSON.stringify({ error: 'max_tokens 초과 — 응답이 절단되었습니다 (JSON 불완전)' }));
  }
  if (!fullText) {
    return res.end(JSON.stringify({ error: 'Claude 응답이 비어 있습니다' }));
  }

  return res.end(JSON.stringify({ text: fullText }));
};
