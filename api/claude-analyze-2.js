/**
 * Vercel Serverless Function: /api/claude-analyze-2
 * 2차 호출 전용 — web_search 없음 (실행플랜은 내부 데이터로 충분)
 * 담당: kpi · roadmap · sixSystems · plan90days · leanCanvas
 */

const ANTHROPIC_BASE = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL   = 'claude-sonnet-4-6';
const MAX_TOKENS     = 16000;

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

  let claudeRes;
  try {
    claudeRes = await fetch(ANTHROPIC_BASE, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: MAX_TOKENS,
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
    console.log(`[ERROR] 2차 max_tokens 초과 — JSON 절단. output_tokens: ${data.usage?.output_tokens}`);
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
