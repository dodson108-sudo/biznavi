/**
 * Vercel Serverless Function: /api/claude-analyze-1
 * 1차 호출 전용 — web_search 포함 (실시간 업종 트렌드·경쟁사·정부지원사업 조회)
 * 담당: executiveSummary · SWOT · STP · 4P · keyStrategies · specializedAnalysis
 */

const ANTHROPIC_BASE = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL   = 'claude-sonnet-4-6';
const MAX_TOKENS     = 8000;
const MAX_TURNS      = 10;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const T_START = Date.now();
  console.log('[TIMING] 1차 호출 시작');

  const { systemPrompt, userPrompt } = req.body || {};
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY 미설정' });
  if (!userPrompt) return res.status(400).json({ error: '필수 파라미터 누락 (userPrompt)' });

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-beta': 'web-search-2025-03-05',
  };

  // 1차: web_search 1회 허용 (실시간 업종 트렌드 반영)
  const tools = [{
    type: 'web_search_20250305',
    name: 'web_search',
    max_uses: 1,
  }];

  const messages = [{ role: 'user', content: userPrompt }];
  let finalText = '';

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    console.log(`[TIMING] 1차 — 턴 ${turn + 1} 시작 (+${Date.now() - T_START}ms)`);
    let claudeRes;
    try {
      claudeRes = await fetch(ANTHROPIC_BASE, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: MAX_TOKENS,
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

    const data = await claudeRes.json();
    const content = data.content || [];

    const turnText = content.filter(b => b.type === 'text').map(b => b.text).join('');
    if (turnText) finalText += turnText;

    console.log(`[TIMING] 1차 — 턴 ${turn + 1} 완료 (+${Date.now() - T_START}ms, stop_reason=${data.stop_reason})`);

    if (data.stop_reason === 'end_turn') break;

    if (data.stop_reason === 'tool_use') {
      messages.push({ role: 'assistant', content });
      const toolResults = content
        .filter(b => b.type === 'tool_use')
        .map(b => ({
          type: 'tool_result',
          tool_use_id: b.id,
          content: [],
        }));
      if (toolResults.length) messages.push({ role: 'user', content: toolResults });
      continue;
    }

    break;
  }

  if (!finalText) {
    console.log(`[TIMING] 1차 — 응답 없음. 총 소요: ${Date.now() - T_START}ms`);
    return res.status(500).json({ error: 'Claude 1차 응답에서 텍스트를 추출할 수 없습니다.' });
  }

  console.log(`[TIMING] 1차 완료 — 총 소요: ${Date.now() - T_START}ms`);
  return res.json({ text: finalText });
};
