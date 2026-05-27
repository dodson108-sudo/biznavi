# /fix-micro — 소상공인(micro) 모드 오류 진단·수정

bizScale='micro' 전용 기능에서 반복 발생한 버그 패턴과 수정법.

---

## 증상별 진단 트리

```
소상공인 모드 오류
    │
    ├─ AI 분석 중 "Failed to fetch" ────────────────────────────────────┐
    │   (로딩 "보고서 통합 완성 중" 또는 1~3차 단계에서 발생)            │
    │                                                                   │
    │   Vercel 로그 확인 → 1차·2차·3차 모두 SUCCESS 표시               │
    │   → Vercel은 성공인데 클라이언트에 응답이 안 옴                   │
    │   → CDN(Cloudflare) TTFB 타임아웃이 원인                         │
    │                                                                   │
    │   원인: Claude SSE 스트리밍을 60~120초 서버에서 누적 후           │
    │         한꺼번에 전송 → Cloudflare가 첫 바이트 없음으로 연결 끊음 │
    │                                                                   │
    │   수정 체크리스트 (3개 파일 모두 적용)                            │
    │     파일: api/claude-analyze-1.js (micro noSearch 분기)           │
    │     파일: api/claude-analyze-2.js (micro noSearch 분기)           │
    │     파일: api/claude-analyze-3.js (micro 전용)                    │
    │                                                                   │
    │     위치: if (!claudeRes.ok) { ... } 블록 바로 다음               │
    │     수정: res.writeHead(200, { 'Content-Type':'application/json' }) 추가
    │     완료: res.end(JSON.stringify({ text: fullText }))             │
    │     오류: res.end(JSON.stringify({ error: '...' }))               │
    │                                                                   │
    │   주의: res.status(xxx).json() 방식 사용 불가                     │
    │         writeHead 후에는 res.end() 만 사용                        │
    └───────────────────────────────────────────────────────────────────┘
    │
    ├─ 3차 AI 분석 504 타임아웃 ─────────────────────────────────────────┐
    │   "AI 분석 중 오류: API 호출 실패 (504)"                           │
    │   로딩 "D5~D7·정부지원 처방 (3차)" 단계에서 멈춤                  │
    │                                                                   │
    │   원인: vercel.json claude-analyze-3.js maxDuration 부족           │
    │         D5~D7 + plan90days 스트리밍 = 60초 이상 소요               │
    │                                                                   │
    │   수정: vercel.json                                                │
    │     { "src": "api/claude-analyze-3.js", "maxDuration": 300 }     │
    │   확인: 현재 정상값 = 300                                         │
    └───────────────────────────────────────────────────────────────────┘
    │
    ├─ D1~D7 레이더차트에서 특정 영역이 "미입력" ────────────────────────┐
    │   (특히 D1 경영진단이 항상 0점·미입력으로 표시)                   │
    │                                                                   │
    │   원인: wizard.js _calcMicroDomainScores() 인덱스 버그             │
    │         buckets[i] (0-indexed: 0~6)를 생성하지만                  │
    │         실제 key는 diag-micro-container_1_X ~ _7_X (1-indexed)    │
    │         → idx=1이 buckets[1]=D2로 잘못 매핑, buckets[0]=D1 미입력 │
    │         → idx=7은 buckets[7]=없음 → D7도 누락                    │
    │                                                                   │
    │   수정: js/wizard.js _calcMicroDomainScores()                     │
    │     buckets[i]   → buckets[i + 1]  (forEach 생성 라인)           │
    │     buckets[i]   → buckets[i + 1]  (result 생성 forEach 라인)    │
    │                                                                   │
    │   확인 방법: diagScores 키 형식 확인                               │
    │     renderDiagModule('diag-micro-container', ...)                 │
    │     → scoreKey = containerId + '_' + item.id                     │
    │     → item.id = '1_1' 형식 (DiagMicro schema.items key)          │
    │     → scoreKey = 'diag-micro-container_1_1' (1-indexed)          │
    └───────────────────────────────────────────────────────────────────┘
    │
    ├─ AI 분석 결과 JSON 절단 (D5~D7 또는 plan90days 누락) ──────────────┐
    │   3차 분석 완료 메시지 나왔는데 대시보드에서 일부 섹션 빈칸        │
    │   Vercel 로그: stop_reason=max_tokens                             │
    │                                                                   │
    │   수정: api/claude-analyze-3.js                                   │
    │     const MAX_TOKENS = 16000   ← 반드시 이 값 유지               │
    │   확인: claude-sonnet-4-6 최대 = 16384                            │
    └───────────────────────────────────────────────────────────────────┘
    │
    └─ diag-reveal 화면이 "5대 역량 프로파일" 그대로 표시 ───────────────┐
        (소상공인인데 SME 5대 역량 텍스트로 나옴)                        │
                                                                       │
        원인: index.html 정적 텍스트 + wizard.js 동적 업데이트 미연결   │
                                                                       │
        수정: index.html에 id 확인                                      │
          <h3 id="drProfileTitle">...</h3>                             │
          <p  id="drProfileDesc">...</p>                               │
                                                                       │
        확인: wizard.js showDiagReveal() 안에 아래 코드 있는지          │
          if (isMicro) {                                               │
            elProfileTitle.textContent = '📊 7대 영역 진단 프로파일';  │
            elProfileDesc.textContent  = '소상공인 7대 분야...';       │
          }                                                            │
        └───────────────────────────────────────────────────────────────┘
```

---

## 현재 설정값 (정상 기준)

| 파일 | 설정 | 정상값 |
|------|------|--------|
| `api/claude-analyze-1.js` | MAX_TOKENS_DEFAULT | 16000 |
| `api/claude-analyze-2.js` | MAX_TOKENS_DEFAULT | 16000 |
| `api/claude-analyze-3.js` | MAX_TOKENS | 16000 |
| `vercel.json` claude-analyze-1 | maxDuration | 300 |
| `vercel.json` claude-analyze-2 | maxDuration | 300 |
| `vercel.json` claude-analyze-3 | maxDuration | 300 |

---

## micro 3차 호출 구조 (변경 이력)

```
[micro AI 분석 3분할 흐름]

1차 (claude-analyze-1.js, noSearch=true)
  → 7개 최소 필드: executiveSummary, lifecycleStage, swot, stp, tam, sam, som
  → stream: true, MAX_TOKENS: 16000

2차 (claude-analyze-2.js, noSearch=true)
  → keyStrategies, fourP, specializedAnalysis, kpi, roadmap, D1~D4 처방
  → stream: true, MAX_TOKENS: 16000

3차 (claude-analyze-3.js, 항상 micro 전용)
  → D5~D7 처방 + plan90days
  → stream: true, MAX_TOKENS: 16000, maxDuration: 300
```

---

## CDN TTFB 수정 패턴 (코드 스니펫)

```javascript
// api/claude-analyze-X.js — micro 스트리밍 분기 공통 패턴
if (!claudeRes.ok) {
  let msg = `Claude API 오류 (${claudeRes.status})`;
  try { const e = await claudeRes.json(); msg = e.error?.message || msg; } catch (_) {}
  return res.status(claudeRes.status).json({ error: msg });
}

// ★ 핵심: claudeRes.ok 확인 직후 즉시 200 전송 (CDN TTFB 방지)
res.writeHead(200, { 'Content-Type': 'application/json' });

// SSE 스트림 누적 ...
// (reader.read() 루프)

// 완료 후 전송 (res.json() 사용 불가 — writeHead 후에는 res.end만)
return res.end(JSON.stringify({ text: fullText }));
// 오류 시:
return res.end(JSON.stringify({ error: '...' }));
```

---

## _calcMicroDomainScores 인덱스 수정 패턴 (코드 스니펫)

```javascript
// js/wizard.js — _calcMicroDomainScores()
// ❌ 틀린 코드 (0-indexed: buckets[0]~[6], key는 _1_~_7_)
MICRO_DOMAINS.forEach(function(d, i) {
  buckets[i] = { ... };        // 버그!
});
MICRO_DOMAINS.forEach(function(_, i) {
  var b = buckets[i];          // 버그!
});

// ✅ 올바른 코드 (1-indexed: buckets[1]~[7], key와 일치)
MICRO_DOMAINS.forEach(function(d, i) {
  buckets[i + 1] = { ... };   // 수정
});
MICRO_DOMAINS.forEach(function(_, i) {
  var b = buckets[i + 1];     // 수정
});
// idx = key에서 추출한 숫자 (1~7) → buckets[idx] 그대로 사용
```

---

## micro 관련 주요 파일 위치

| 역할 | 파일 |
|------|------|
| micro 진단 스키마 (7대 분야 35항목) | `js/diagnosis/diagnosis-micro.js` |
| micro 7대 영역 점수 계산 | `js/wizard.js` → `_calcMicroDomainScores()` |
| micro 역량 프로파일 렌더링 | `js/wizard.js` → `showDiagReveal()` |
| micro 1차 AI 프롬프트 | `js/ai-engine.js` → `buildPrompt1()` micro 분기 |
| micro 2차 AI 프롬프트 | `js/ai-engine.js` → `_buildPrompt2Micro()` |
| micro 3차 AI 프롬프트 | `js/ai-engine.js` → `_buildPrompt3Micro()` |
| 로딩 레이블 4단계 | `js/wizard.js` → `animateLoading(isMicro)` |
| 대시보드 생애주기 섹션 | `js/dashboard.js` → `renderLifecycle()` |
| 대시보드 상권 STP 섹션 | `js/dashboard.js` → `renderMarketMicro()` |

---

## 빠른 수정 명령어

```powershell
# 로컬 테스트
$env:DART_API_KEY="fe33283e3bacd8d0bc0e060b9e224ddce18ac10d"
vercel dev
# → http://localhost:3000 → 소상공인 모드로 진단 실행

# Vercel 실시간 로그 (CDN 타임아웃 진단)
vercel logs biznavi --follow

# 수정 후 배포
git add api/ js/wizard.js js/ai-engine.js && git commit -m "fix: micro 오류 수정" && git push origin main
```
