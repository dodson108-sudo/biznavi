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

// ⚠ 정적 require — @vercel/nft 의존성 추적에 포함되어야 한다 (동적 import 금지)
const CS = require('../lib/claude-stream');

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

    res.writeHead(200, { 'Content-Type': 'application/json' });

    let out;
    try {
      out = await CS.runWithContinuation({
        apiKey,
        model: CLAUDE_MODEL,
        system: systemPrompt,
        maxTokens: MAX_TOKENS_DEFAULT,
        messages: [{ role: 'user', content: userPrompt }],
        label: '2차-micro',
      });
    } catch (err) {
      console.log(`[ERROR] 2차-micro 호출 실패: ${err.message}`);
      return res.end(JSON.stringify({ error: err.message }));
    }

    console.log(`[2차-micro] 완료: turns=${out.turns}, 누적 output_tokens=${out.totalTokens}, text_len=${out.text.length}`);

    if (!out.ok)   return res.end(JSON.stringify({ error: out.error }));
    if (!out.text) return res.end(JSON.stringify({ error: 'Claude 응답에서 텍스트를 추출할 수 없습니다.' }));
    return res.end(JSON.stringify({ text: out.text }));
  }

  // ── SME/일반 모드: 단일 요청 + 절단 시 이어쓰기(최대 2회) ────────────────
  const messages = [{ role: 'user', content: userPrompt }];
  let finalText = '';
  let totalTokens = 0;
  let contCount = 0;

  for (let attempt = 0; attempt <= CS.MAX_CONTINUATIONS; attempt++) {
    let claudeRes;
    try {
      claudeRes = await fetch(ANTHROPIC_BASE, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: MAX_TOKENS_DEFAULT,
          system: systemPrompt || '',
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
    const turnText = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    finalText = CS.joinContinuation(finalText, turnText);
    totalTokens += data.usage?.output_tokens || 0;

    const diag = CS.diagnoseJson(finalText);
    if (diag === 'ok' && data.stop_reason !== 'max_tokens') break;

    // 절단이 아닌 형식 오류에 이어쓰기를 돌리면 상황이 악화된다
    if (data.stop_reason !== 'max_tokens' && diag !== 'truncated') {
      console.log(`[2차-sme] 형식 오류(절단 아님) — continuation 생략, diag=${diag}`);
      return res.status(500).json({
        error: diag === 'empty'
          ? 'AI 응답에 JSON이 포함되지 않았습니다.'
          : 'AI 응답 형식이 올바르지 않습니다 (절단 아님).',
      });
    }

    if (attempt === CS.MAX_CONTINUATIONS) break;
    contCount++;
    console.log(`[2차-sme] continuation 발동 — turn=${contCount}, 누적 output_tokens=${totalTokens}, stop_reason=${data.stop_reason}, diag=${diag}`);
    const prefill = { role: 'assistant', content: finalText.replace(/\s+$/, '') };
    const last = messages[messages.length - 1];
    if (last && last.role === 'assistant') messages[messages.length - 1] = prefill;
    else messages.push(prefill);
  }

  if (!finalText) {
    return res.status(500).json({ error: 'Claude 2차 응답에서 텍스트를 추출할 수 없습니다.' });
  }
  if (CS.diagnoseJson(finalText) !== 'ok') {
    console.log(`[ERROR] 2차-sme continuation ${contCount}회 후에도 미완성 — 누적 tokens=${totalTokens}`);
    return res.status(500).json({ error: 'max_tokens 초과 — 2차 응답 절단됨 (JSON 불완전)' });
  }
  return res.json({ text: finalText });
};
