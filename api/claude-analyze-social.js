/**
 * Vercel Serverless Function: /api/claude-analyze-social
 * 사회적경제 조직(사회적기업·협동조합·소셜벤처) 전용 — AI 실행 계획 단일 호출
 *
 * 경영진단(claude-analyze-1/2/3)과 달리 3분할하지 않는다.
 *   - 사회적경제 리포트 9섹션은 SWOT·STP·4P·린캔버스를 쓰지 않으므로 생성할 내용이 적다
 *   - 기존에는 사회적기업이 micro 경로(3회 호출 · 각 max_tokens 16000)를 탔고,
 *     생성된 결과 대부분을 renderSocial()이 버리고 있었다
 *   - web_search를 쓰지 않는다 (속도 저하 원인이며 이 출력에는 불필요)
 *
 * ⚠ api/claude-analyze-1/2/3.js 는 경영진단이 사용 중이므로 건드리지 않는다.
 *
 * runWithContinuation 적용 — 절단 시 assistant prefill로 이어쓰기(최대 2회).
 * ⚠ 정적 require여야 @vercel/nft 의존성 추적에 lib/claude-stream.js가 포함된다.
 *
 * 요청:  POST { systemPrompt, userPrompt }
 * 응답:  { text } 또는 { error }
 */

const { runWithContinuation } = require('../lib/claude-stream');

const CLAUDE_MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS   = 6000;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { systemPrompt, userPrompt } = req.body || {};
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey)     return res.status(500).json({ error: 'ANTHROPIC_API_KEY 미설정' });
  if (!userPrompt) return res.status(400).json({ error: '필수 파라미터 누락 (userPrompt)' });

  let r;
  try {
    r = await runWithContinuation({
      apiKey,
      model:     CLAUDE_MODEL,
      system:    systemPrompt || '',
      maxTokens: MAX_TOKENS,
      messages:  [{ role: 'user', content: userPrompt }],
      label:     'social',
    });
  } catch (netErr) {
    return res.status(502).json({ error: 'Claude API 연결 실패: ' + netErr.message });
  }

  console.log(
    `[social] 완료: ok=${r.ok}, turns=${r.turns}, output_tokens=${r.totalTokens}, text_len=${(r.text || '').length}`
  );

  if (!r.ok) {
    return res.status(200).json({ error: r.error || 'AI 응답을 완성하지 못했습니다.' });
  }
  if (!r.text) {
    return res.status(200).json({ error: 'Claude 응답이 비어 있습니다' });
  }

  return res.status(200).json({ text: r.text });
};
