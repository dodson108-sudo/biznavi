/**
 * lib/claude-stream.js — Claude 스트리밍 호출 + 절단 이어쓰기(continuation) 공용 모듈
 *
 * ⚠ api/ 하위에 두지 않는다. Vercel이 api/*.js를 엔드포인트로 인식하기 때문이다.
 *    각 함수 파일에서 정적 require('../lib/claude-stream')로 참조해야
 *    @vercel/nft 의존성 추적에 포함된다. 동적 import·경로 조합 금지.
 *
 * 절단(truncation) 판정 원칙:
 *   파싱 실패에는 두 종류가 있다 — ① 잘려서 실패 ② 애초에 JSON이 아니라서 실패.
 *   ①은 이어쓰기가 답이지만 ②는 이어쓰기를 하면 더 망가진다(엉뚱한 내용이 덧붙음).
 *   따라서 괄호·문자열 균형을 세어 둘을 구분한 뒤에만 continuation을 태운다.
 */

const ANTHROPIC_BASE = 'https://api.anthropic.com/v1/messages';

const MAX_CONTINUATIONS = 2;   // 무한 루프·토큰 폭주 방지

/* ── JSON 정리·판정 ──────────────────────────────────────────── */

/** 코드펜스와 앞뒤 설명문을 제거하고 첫 '{' 이후를 반환 (절단 판별을 위해 뒤는 자르지 않는다) */
function jsonCandidate(text) {
  let t = String(text == null ? '' : text);
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fence && fence[1].indexOf('{') !== -1) t = fence[1];
  const s = t.indexOf('{');
  return s === -1 ? '' : t.slice(s);
}

function repairTrailingComma(str) {
  return str.replace(/,\s*([}\]])/g, '$1');
}

/** 정리 후 파싱 시도 — 성공하면 { ok:true, value } */
function tryParseJson(text) {
  const cand = jsonCandidate(text);
  if (!cand) return { ok: false };
  const e = cand.lastIndexOf('}');
  const raw = e === -1 ? cand : cand.slice(0, e + 1);
  try { return { ok: true, value: JSON.parse(raw) }; } catch (_) {}
  try { return { ok: true, value: JSON.parse(repairTrailingComma(raw)) }; } catch (_) {}
  return { ok: false };
}

/** 문자열·이스케이프를 존중하며 괄호 균형을 센다 */
function scanStructure(s) {
  let curly = 0, square = 0, inStr = false, esc = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (esc) { esc = false; continue; }
    if (inStr) {
      if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '{') curly++;
    else if (ch === '}') curly--;
    else if (ch === '[') square++;
    else if (ch === ']') square--;
  }
  return { curly, square, inStr };
}

/**
 * 'ok'         — 정리만으로 파싱됨. continuation 불필요
 * 'truncated'  — 괄호 미닫힘 또는 문자열 미종료. continuation 대상
 * 'malformed'  — 괄호는 균형인데 파싱 실패. 절단이 아닌 형식 오류 → continuation 금지
 * 'empty'      — JSON 시작('{')이 아예 없음 → continuation 금지
 */
function diagnoseJson(text) {
  if (tryParseJson(text).ok) return 'ok';
  const cand = jsonCandidate(text);
  if (!cand) return 'empty';
  const st = scanStructure(cand);
  if (st.curly > 0 || st.square > 0 || st.inStr) return 'truncated';
  return 'malformed';
}

/* ── 스트리밍 단일 호출 ──────────────────────────────────────── */

/** SSE를 읽어 텍스트를 조립한다. @returns {{text, stopReason, outputTokens, streamError}} */
async function readStream(claudeRes) {
  const reader = claudeRes.body.getReader();
  const decoder = new TextDecoder();
  let sseBuffer = '', text = '', stopReason = null, outputTokens = 0, streamError = null;

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
            text += evt.delta.text;
          } else if (evt.type === 'message_delta') {
            stopReason   = evt.delta?.stop_reason;
            outputTokens = evt.usage?.output_tokens || outputTokens;
          } else if (evt.type === 'error') {
            // ⚠ 스트림 중간 오류 — 무시하면 부분 텍스트가 성공으로 반환된다
            streamError = evt.error?.message || 'stream error';
          }
        } catch (_) {}
      }
    }
  } finally {
    reader.releaseLock();
  }
  return { text, stopReason, outputTokens, streamError };
}

async function streamOnce({ apiKey, model, system, maxTokens, messages }) {
  const claudeRes = await fetch(ANTHROPIC_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, system: system || '', stream: true, messages }),
  });
  if (!claudeRes.ok) {
    let msg = `Claude API 오류 (${claudeRes.status})`;
    try { const e = await claudeRes.json(); msg = e.error?.message || msg; } catch (_) {}
    const err = new Error(msg);
    err.status = claudeRes.status;
    throw err;
  }
  return readStream(claudeRes);
}

/* ── 이어쓰기 ────────────────────────────────────────────────── */

/**
 * 이어쓰기용 messages 구성 — assistant prefill 방식.
 * 누적 텍스트를 마지막 assistant 메시지로 넣으면 Claude가 "그 메시지를 이어서" 작성하므로
 * 앞부분을 다시 쓰는 중복이 구조적으로 발생하지 않는다.
 * (뒤에 user 메시지를 붙이면 새 assistant 턴이 시작돼 앞부분을 반복할 수 있다)
 * ⚠ Anthropic은 prefill 끝의 공백을 허용하지 않으므로 trimEnd 한다.
 */
function buildContinuationMessages(baseMessages, accumulated) {
  return baseMessages.concat([{ role: 'assistant', content: accumulated.replace(/\s+$/, '') }]);
}

/** 겹치는 꼬리를 제거한 chunk를 반환 (단독 사용 금지 — joinContinuation을 통해서만 쓴다) */
function stripOverlap(accumulated, chunk) {
  if (!chunk) return '';
  const maxProbe = Math.min(200, accumulated.length, chunk.length);
  for (let n = maxProbe; n >= 20; n--) {
    if (accumulated.slice(-n) === chunk.slice(0, n)) return chunk.slice(n);
  }
  return chunk;
}

/**
 * 이어쓰기 조각을 안전하게 결합한다.
 * ⚠ 겹침 제거를 무조건 적용하면 안 된다. 반복되는 정상 텍스트(같은 문구·같은 문자의 연속)를
 *    겹침으로 오인해 잘라내면 오히려 JSON이 깨진다. (실제로 검증에서 이 버그가 잡혔다)
 * prefill 방식에서는 중복이 원칙적으로 발생하지 않으므로 그대로 잇는 것이 기본이고,
 * 그 결과가 파싱되지 않을 때만 겹침 제거본을 후보로 시도한다.
 */
function joinContinuation(accumulated, chunk) {
  if (!chunk) return accumulated;
  const direct = accumulated + chunk;
  if (tryParseJson(direct).ok) return direct;
  const stripped = accumulated + stripOverlap(accumulated, chunk);
  if (stripped !== direct && tryParseJson(stripped).ok) return stripped;
  return direct;   // 아직 절단 중 — 다음 턴에서 이어진다
}

/**
 * 스트리밍 호출 + 필요 시 최대 2회 이어쓰기.
 * @returns {{ ok:true, text, turns, totalTokens } | { ok:false, error, reason, text, turns, totalTokens }}
 */
async function runWithContinuation({ apiKey, model, system, maxTokens, messages, label }) {
  const tag = label || 'claude';
  let accumulated = '';
  let totalTokens = 0;
  let turns = 0;

  let r = await streamOnce({ apiKey, model, system, maxTokens, messages });
  turns++;
  accumulated += r.text;
  totalTokens += r.outputTokens || 0;

  for (let n = 1; n <= MAX_CONTINUATIONS; n++) {
    const diag = diagnoseJson(accumulated);

    // stop_reason이 max_tokens면 판별 없이 절단 확정
    const isTruncated = r.stopReason === 'max_tokens' || diag === 'truncated';

    if (diag === 'ok' && r.stopReason !== 'max_tokens') break;

    if (!isTruncated) {
      // 괄호가 균형인데 파싱 실패 = 형식 오류. 이어쓰기하면 상황이 악화되므로 즉시 중단
      console.log(`[${tag}] 형식 오류(절단 아님) — continuation 생략, diag=${diag}`);
      return {
        ok: false, reason: diag, text: accumulated, turns, totalTokens,
        error: diag === 'empty'
          ? 'AI 응답에 JSON이 포함되지 않았습니다.'
          : 'AI 응답 형식이 올바르지 않습니다 (절단 아님).',
      };
    }

    console.log(`[${tag}] continuation 발동 — turn=${n}, 누적 output_tokens=${totalTokens}, stop_reason=${r.stopReason}, diag=${diag}`);

    r = await streamOnce({
      apiKey, model, system, maxTokens,
      messages: buildContinuationMessages(messages, accumulated),
    });
    turns++;
    accumulated = joinContinuation(accumulated, r.text);
    totalTokens += r.outputTokens || 0;
  }

  if (tryParseJson(accumulated).ok) {
    return { ok: true, text: accumulated, turns, totalTokens };
  }

  console.log(`[ERROR] ${tag} continuation ${MAX_CONTINUATIONS}회 후에도 미완성 — 누적 tokens=${totalTokens}, turns=${turns}`);
  return {
    ok: false, reason: 'truncated', text: accumulated, turns, totalTokens,
    error: `max_tokens 초과 — 이어쓰기 ${MAX_CONTINUATIONS}회 후에도 응답이 완성되지 않았습니다.`,
  };
}

module.exports = {
  ANTHROPIC_BASE,
  MAX_CONTINUATIONS,
  jsonCandidate,
  tryParseJson,
  scanStructure,
  diagnoseJson,
  readStream,
  streamOnce,
  buildContinuationMessages,
  stripOverlap,
  joinContinuation,
  runWithContinuation,
};
