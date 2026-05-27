# /fix-ai-error — AI 분석 버튼 클릭 시 오류 진단·수정

BizNavi에서 "AI 분석 시작" 버튼 클릭 후 발생하는 오류를 단계별로 진단하고 수정한다.

## 오류 유형별 진단 트리

```
AI 분석 버튼 클릭
    │
    ├─ 로딩 화면에서 멈춤(504) ──────────────────────────────────────────┐
    │   "AI 분석 중 오류: API 호출 실패 (504)"                           │
    │                                                                    │
    │   진단 1. Vercel 로그 확인                                         │
    │     → Vercel 대시보드 → biznavi → Logs → "TIMING" 검색            │
    │                                                                    │
    │   진단 2. 원인 판별                                                 │
    │     ┌ [TIMING] 1차 완료 없음 → 1차 함수 타임아웃                   │
    │     ├ [TIMING] 2차 완료 없음 → 2차 함수 타임아웃                   │
    │     └ web_search 턴이 3회↑  → 웹검색이 시간 주범                  │
    │                                                                    │
    │   수정 체크리스트                                                   │
    │     □ vercel.json maxDuration 확인                                 │
    │       - claude-analyze-1.js: 300 (Pro 플랜 최대값)                 │
    │       - claude-analyze-2.js: 300                                   │
    │     □ Vercel 플랜 확인 (무료=60초 한계, Pro=300초)                 │
    │     □ web_search max_uses: 1 이하인지 확인                         │
    │       파일: api/claude-analyze-1.js → max_uses: 1                 │
    │                                                                    │
    └─ 분석 완료 후 오류 팝업 ───────────────────────────────────────────┘
        "1차 분석 JSON 파싱 실패" 또는 "2차 실행플랜 JSON 파싱 실패"

        진단 1. 오류 메시지의 첫 글자 확인
          → { 로 시작하면: JSON은 생성됐으나 파싱 실패
          → 다른 문자 시작: Claude가 코드블록이나 설명문 포함

        진단 2. Vercel 로그에서 stop_reason 확인
          → stop_reason=max_tokens: 토큰 초과로 JSON 절단
          → stop_reason=end_turn:  JSON 완성됐으나 파싱 로직 문제

        수정 체크리스트
          □ stop_reason=max_tokens 인 경우
            파일: api/claude-analyze-1.js → MAX_TOKENS: 16000
            파일: api/claude-analyze-2.js → MAX_TOKENS: 16000
            (claude-sonnet-4-6 최대값 = 16384)

          □ stop_reason=end_turn 인 경우 (파싱 로직 버그)
            파일: js/ai-engine.js → extractJSON() 확인
            - repairJSON(): trailing comma 제거 작동하는지 확인
            - 코드블록 그리디 추출 작동하는지 확인
```

---

## 현재 설정값 (정상 기준)

| 파일 | 설정 | 정상값 |
|------|------|--------|
| `api/claude-analyze-1.js` | MAX_TOKENS | 16000 |
| `api/claude-analyze-2.js` | MAX_TOKENS | 16000 |
| `api/claude-analyze-1.js` | web_search max_uses | 1 |
| `vercel.json` claude-analyze-1 | maxDuration | 300 |
| `vercel.json` claude-analyze-2 | maxDuration | 300 |

---

## 구조 설명 (변경 이력)

```
변경 전 (단일 함수):
  클라이언트 → /api/claude-analyze (1차+2차 합산, 60초 한계)
                 → 504 타임아웃 반복 발생

변경 후 (분리 함수):
  클라이언트 → /api/claude-analyze-1 (1차: web_search + SWOT·전략)
             → /api/claude-analyze-2 (2차: KPI·로드맵·6시스템)
                 → 각각 독립 300초 한도 적용
```

**핵심 변경 이유:**
- Claude API 1회 호출 = 30~60초 소요 (응답 품질 높을수록 증가)
- 2회 순차 호출 + web_search = 합산 3~5분 정상 소요
- 단일 함수에서는 합산 시간이 한 함수의 maxDuration을 초과
- 분리 후 각 함수가 독립 타이머 → 합산 제한 없음

---

## extractJSON 파싱 로직 (js/ai-engine.js)

Claude가 JSON을 반환할 때 발생하는 3가지 문제와 대응:

| 문제 | 예시 | 대응 |
|------|------|------|
| Trailing comma | `{"a":1,}` | repairJSON()으로 자동 제거 |
| 코드블록 감쌈 | ` ```json {...} ``` ` | 그리디 정규식으로 전체 추출 |
| JSON 절단 | `{"kpi":[{"metric":"...` | max_tokens 16000으로 방지 |

---

---

## micro 전용 — CDN TTFB "Failed to fetch"

Vercel 로그는 성공인데 클라이언트에서 "Failed to fetch" 발생하는 경우.

**원인**: Claude SSE 스트리밍을 서버에서 60~120초 누적 후 전송 → Cloudflare CDN이 TTFB(첫 바이트) 기준으로 연결 끊음

**해당 파일**: `api/claude-analyze-1.js` (noSearch 분기) / `api/claude-analyze-2.js` (noSearch 분기) / `api/claude-analyze-3.js`

**수정**: `claudeRes.ok` 확인 직후 즉시 200 헤더 전송
```javascript
if (!claudeRes.ok) { return res.status(...).json({ error: ... }); }
// ↓ 이 줄 추가
res.writeHead(200, { 'Content-Type': 'application/json' });
// ... SSE 루프 ...
return res.end(JSON.stringify({ text: fullText }));   // json() 사용 불가
```

> 자세한 내용: `/fix-micro` 스킬 참고

---

## 빠른 수정 명령어

```powershell
# 로컬 테스트 실행
$env:DART_API_KEY="fe33283e3bacd8d0bc0e060b9e224ddce18ac10d"
vercel dev

# Vercel 실시간 로그 확인
vercel logs biznavi --follow

# 수정 후 배포
git add -A && git commit -m "fix: AI 오류 수정" && git push origin main
```
