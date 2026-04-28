/**
 * Vercel Serverless Function: /api/claude-analyze
 * Claude API 서버사이드 프록시 — web_search 도구 포함
 *
 * 브라우저 직접 호출(CORS 제약) 대신 서버를 경유하여:
 *   1. web_search_20250305 도구로 실시간 업종 트렌드 조회
 *   2. claude-sonnet-4-6 최신 모델 사용 (knowledge cutoff Aug 2025)
 *   3. stop_reason === 'tool_use' 다중 턴 처리
 *
 * Request:  POST { apiKey, systemPrompt, userPrompt }
 * Response: { text }  or  { error }
 */

const ANTHROPIC_BASE = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL   = 'claude-sonnet-4-6';
const MAX_TOKENS     = 8000;
const MAX_TURNS      = 10;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { apiKey, systemPrompt, userPrompt } = req.body || {};
  if (!apiKey || !userPrompt) {
    return res.status(400).json({ error: '필수 파라미터 누락 (apiKey, userPrompt)' });
  }

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-beta': 'web-search-2025-03-05',
  };

  const tools = [{
    type: 'web_search_20250305',
    name: 'web_search',
    max_uses: 5,
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

    // 이번 턴의 텍스트 누적
    const turnText = content.filter(b => b.type === 'text').map(b => b.text).join('');
    if (turnText) finalText += turnText;

    // 정상 종료
    if (data.stop_reason === 'end_turn') break;

    // web_search 도구 호출 — 다중 턴 처리
    // Anthropic 서버가 검색을 실행하고 결과를 제공함
    // 클라이언트는 tool_result 메시지로 응답해야 다음 턴이 진행됨
    if (data.stop_reason === 'tool_use') {
      messages.push({ role: 'assistant', content });

      const toolResults = content
        .filter(b => b.type === 'tool_use')
        .map(b => ({
          type: 'tool_result',
          tool_use_id: b.id,
          content: b.type === 'web_search_20250305'
            ? []  // web_search: Anthropic이 결과 채움
            : [{ type: 'text', text: '(결과 없음)' }],
        }));

      if (toolResults.length) {
        messages.push({ role: 'user', content: toolResults });
      }
      continue;
    }

    // 예상치 못한 stop_reason 시 중단
    break;
  }

  if (!finalText) {
    return res.status(500).json({ error: 'Claude 응답에서 텍스트를 추출할 수 없습니다.' });
  }

  return res.json({ text: finalText });
};
