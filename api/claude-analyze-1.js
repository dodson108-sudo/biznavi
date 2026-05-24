/**
 * Vercel Serverless Function: /api/claude-analyze-1
 * 1차 호출 전용 — web_search 포함 (실시간 업종 트렌드·경쟁사·정부지원사업 조회)
 * 담당: executiveSummary · SWOT · STP · 4P · keyStrategies · specializedAnalysis
 */

const ANTHROPIC_BASE     = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL       = 'claude-sonnet-4-6';
const MAX_TOKENS_DEFAULT = 16000;
const MAX_TOKENS_MICRO   = 2000;
const MAX_TURNS          = 10;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  // noSearch: micro 모드에서 web_search 비활성화 → 1차 300초 타임아웃 방지
  const { systemPrompt, userPrompt, noSearch, maxTokens } = req.body || {};
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY 미설정' });
  if (!userPrompt) return res.status(400).json({ error: '필수 파라미터 누락 (userPrompt)' });

  const useSearch = !noSearch;
  const resolvedMaxTokens = maxTokens || (noSearch ? MAX_TOKENS_MICRO : MAX_TOKENS_DEFAULT);

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    ...(useSearch && { 'anthropic-beta': 'web-search-2025-03-05' }),
  };

  // web_search: noSearch=true(micro)일 때 생략 → turn 1회로 완료
  const tools = useSearch ? [{
    type: 'web_search_20250305',
    name: 'web_search',
    max_uses: 1,
  }] : undefined;

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
          max_tokens: resolvedMaxTokens,
          system: systemPrompt || '',
          ...(tools && { tools }),
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

    if (data.stop_reason === 'end_turn') break;

    if (data.stop_reason === 'max_tokens') {
      console.log(`[ERROR] 1차 max_tokens 초과 — JSON 절단. output_tokens: ${data.usage?.output_tokens}`);
      return res.status(500).json({ error: 'max_tokens 초과 — 1차 응답 절단됨 (JSON 불완전)' });
    }

    if (data.stop_reason === 'pause_turn') {
      // 서버 도구(web_search) 내부 루프 한계 도달 — 대화 이어서 전송
      messages.push({ role: 'assistant', content });
      messages.push({ role: 'user', content: [{ type: 'text', text: 'continue' }] });
      continue;
    }

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
    return res.status(500).json({ error: 'Claude 1차 응답에서 텍스트를 추출할 수 없습니다.' });
  }

  return res.json({ text: finalText });
};
