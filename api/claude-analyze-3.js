/**
 * Vercel Serverless Function: /api/claude-analyze-3
 * micro 전용 3차 호출 — 항상 스트리밍 (micro only)
 * 담당: sixSystems(D5~D7) · plan90days
 *
 * stream: true → SSE 청크 누적 → 완성 후 반환
 * max_tokens: 16000
 *
 * CDN TTFB 타임아웃 방지: Claude 응답 확인 즉시 200 OK 헤더 전송
 * → 브라우저/Cloudflare가 TTFB(첫 바이트) 기준으로 연결 유지
 */

// ⚠ 정적 require — @vercel/nft 의존성 추적에 포함되어야 한다 (동적 import 금지)
const CS = require('../lib/claude-stream');

const ANTHROPIC_BASE = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL   = 'claude-sonnet-4-6';
const MAX_TOKENS     = 16000;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { systemPrompt, userPrompt } = req.body || {};
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY 미설정' });
  if (!userPrompt) return res.status(400).json({ error: '필수 파라미터 누락 (userPrompt)' });

  const claudeHeaders = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  };

  console.log(`[3차-micro] 스트리밍 시작 (max_tokens=${MAX_TOKENS}, maxDuration=300)`);

  res.writeHead(200, { 'Content-Type': 'application/json' });

    let out;
    try {
      out = await CS.runWithContinuation({
        apiKey,
        model: CLAUDE_MODEL,
        system: systemPrompt,
        maxTokens: MAX_TOKENS,
        messages: [{ role: 'user', content: userPrompt }],
        label: '3차-micro',
      });
    } catch (err) {
      console.log(`[ERROR] 3차-micro 호출 실패: ${err.message}`);
      return res.end(JSON.stringify({ error: err.message }));
    }

    console.log(`[3차-micro] 완료: turns=${out.turns}, 누적 output_tokens=${out.totalTokens}, text_len=${out.text.length}`);

    if (!out.ok)   return res.end(JSON.stringify({ error: out.error }));
    if (!out.text) return res.end(JSON.stringify({ error: 'Claude 응답에서 텍스트를 추출할 수 없습니다.' }));
    return res.end(JSON.stringify({ text: out.text }));
};
