/**
 * Vercel Serverless Function: /api/claude-analyze-3
 * micro 전용 3차 호출 — 항상 스트리밍 (micro only)
 * 담당: sixSystems(D5~D7) · plan90days
 *
 * stream: true → SSE 청크 누적 → 완성 후 반환
 * max_tokens: 16000
 */

const ANTHROPIC_BASE = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL   = 'claude-sonnet-4-6';
const MAX_TOKENS     = 8000;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { systemPrompt, userPrompt } = req.body || {};
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY 미설정' });
  if (!userPrompt) return res.status(400).json({ error: '필수 파라미터 누락 (userPrompt)' });

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  };

  console.log(`[3차-micro] 스트리밍 시작 (max_tokens=${MAX_TOKENS}, maxDuration=300)`);

  let claudeRes;
  try {
    claudeRes = await fetch(ANTHROPIC_BASE, {
      method: 'POST',
      headers,
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

  console.log(`[3차-micro] 스트리밍 완료: stop_reason=${stopReason}, output_tokens=${outputTokens}, text_len=${fullText.length}`);

  if (stopReason === 'max_tokens') {
    console.log(`[ERROR] 3차-micro max_tokens 초과 — output_tokens: ${outputTokens}`);
    return res.status(500).json({ error: 'max_tokens 초과 — 3차 응답 절단됨 (JSON 불완전)' });
  }
  if (!fullText) {
    return res.status(500).json({ error: 'Claude 3차 응답에서 텍스트를 추출할 수 없습니다.' });
  }
  return res.json({ text: fullText });
};
