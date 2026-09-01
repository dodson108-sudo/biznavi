# BizNavi AI 프로젝트

## 배포 상태 (2026-06-05 최신)

- **GitHub**: `https://github.com/dodson108-sudo/biznavi.git` — 최신 커밋: fix: 직접입력 시 placeholder 미갱신 2가지 수정 (c317c03)
- **Vercel**: GitHub 연동 자동 배포 중 (main 브랜치 push 시 자동 빌드), 서울 리전(icn1) 적용, **Pro 플랜** 운영 중
- **브랜치**: `main` (단일 브랜치 운영)

---

## 최근 수정 이력 (2026-09-01) — 사회적경제 리포트 2차: 전용 AI 단일 호출 연결 + 속도 개선

### ① ⚠ 원인 정정 — "sme 경로·web_search 사용"이 아니다
초기 진단은 "사회적기업이 sme 경로를 타서 web_search까지 쓴다"였으나 **사실이 아니다.**
`callClaude()`의 분기는 `_isMicro = formData.bizScale === 'micro'`인데
**사회적기업은 `bizScale`이 `micro`**이므로 실제로는 **micro 경로**(`noSearch: true`)를 탔다.
정확한 서술: **micro 경로 · noSearch · 3회 순차 호출(1/2/3차) · 각 `max_tokens` 16000.**
→ web_search는 쓰지 않았지만 **3회 호출·최대 48000토큰**과
**생성 결과(SWOT·STP·4P·D1~D7 처방)를 `renderSocial()`이 전부 버리는** 낭비 구조는 그대로였다.
잘못된 원인이 기록에 남으면 나중에 오판을 부르므로 명시해 둔다.

### ② `api/claude-analyze-social.js` 신설 — 단일 호출
- `runWithContinuation` 적용(절단 시 assistant prefill 이어쓰기 최대 2회). **정적 `require('../lib/claude-stream')`** 여야 `@vercel/nft` 의존성 추적에 포함된다
- `max_tokens: 6000`(경영진단 16000 대비 축소) · **web_search 미사용** · 3분할 없음
- `vercel.json`: `{ "regions": ["icn1"], "maxDuration": 120 }`
- ⚠ `api/claude-analyze-1/2/3.js`는 **미변경**(경영진단이 사용 중)

**프롬프트 입력**: 조직 기본정보 + `d.socialPrompt`(`DiagSocial.buildPromptSummary()` 원문) + `detectCrossWarnings()` 전체 + `GovSupport.buildPromptBlock()`
- ⚠ 점수 블록을 다시 작성하지 않고 **`socialPrompt`를 그대로 쓴다.** 그쪽이 해석 지침("SVI 예상 점수를 추정하지 마라" 등)까지 담고 있어 여기서 다시 쓰면 중복이 된다. `_buildSocialScoreBlock()`은 fallback 전용
- ⚠ 경고 `msg`는 **완성된 판정 문장**이다. "재해석·재판정 금지"를 프롬프트에 명시하고, AI에게는 "어떤 순서로 어떻게 해소할 것인가"만 요구한다

**출력**: `priority[3~5]` (order·action·why·how) / `plan90[3]` (month·focus·tasks) / `cautions[2~4]`

**시스템 프롬프트 제약**: 진단에 없는 문제 생성 금지 · 미응답 정보 서술 금지 · 금액/한도/비율 수치 금지 · **SWOT·STP·4P·린캔버스 등 프레임워크 이름 금지**(사회적경제 조직은 규모상 소기업 수준이라 그 틀이 맞지 않는다) · 단정 표현 금지
+ 사회적기업 고유 맥락 5종: 미션과 수익의 균형 / 공공 발주 의존 위험 / 보조금 종료 대비 / 조직 지속성 / 제도 활용도

### ③ 속도 개선 — diag-reveal 유지 + 백그라운드 호출 (지시 정정)
⚠ **당초 지시는 "renderSocial로 즉시 전환"이었으나 그러면 `diag-reveal`을 건너뛰게 된다.**
거기엔 8영역 레이더차트·도메인 해설·진단유형 카드·KOSIS 생존율이 있고 전부 AI 없이 즉시 계산된다.

채택한 흐름:
```
진단 완료 → (AI 대기 없음) showDiagReveal → show('diag-reveal')
          ↘ 동시에 백그라운드로 callSocialPlan() 시작
[사용자가 레이더차트를 읽는 시간 = AI 생성 시간]
[클릭] → renderSocial → sec-social-action은 이미 done 이거나 로딩 중
```
→ **사용자가 화면을 읽는 시간이 곧 대기 시간**이 되어 체감 대기가 사실상 사라진다.

**경쟁 조건 방어** — `_socialReqId` 카운터:
- 요청마다 `++_socialReqId`로 id를 발급하고, 응답 도착 시 `reqId !== _socialReqId`면 **결과를 버린다**
- `restart()`(새 분석)에서도 `_socialReqId++` → 진행 중이던 응답이 새 화면에 꽂히지 않는다
- **백그라운드 실패를 `diag-reveal`에 띄우지 않는다.** 그 시점의 사용자는 레이더차트를 보고 있다. 에러는 대시보드의 `sec-social-action`에서만 표시한다
- 사용자가 즉시 클릭하든 오래 머물든 동작한다 — 상태(`loading`/`done`/`error`)를 `Dashboard` 모듈에 저장하고 `renderSocialAction()`이 읽는 구조라 진입 시점과 무관하다

### ④ `sec-social-action` 렌더링 — 자리표시자 교체
`Dashboard.renderSocialPlan(state, plan)` 신설. 진단 경고 나열(즉시)은 그대로 두고 하단만 3상태로 바뀐다.
- `loading` → 스피너 + "위 진단 결과는 지금 바로 확인하실 수 있습니다"
- `done` → **먼저 해야 할 일**(번호 카드 · action 굵게 / 왜 / 어떻게) + **90일 실행 계획**(1·2·3개월차 3열 그리드, 골드 강조) + 주의 박스
- `error` → 에러 박스 + `[다시 시도]`(`App.retrySocialPlan()` — **AI만 재호출**, 진단 재계산 없음)
- ⚠ **`fakeAnalysis` 계열 가짜 데이터를 쓰지 않는다.** 진단 결과는 이미 확보돼 있으므로 AI 섹션만 생략한다

### ⑤ 기존 경로 차단
- `App.runAnalysis()`에서 `_isSocialData(data)`면 **`callClaude()`를 호출하지 않고** 전용 경로로 분기 후 `return`
- 판정은 `fd.isSocialOrg` 파생 플래그 사용(문자열 배열 재정의 금지). 플래그가 없는 레거시 데이터는 `orgType !== 'general'` fallback
- `proceedToSolution()`의 `if (!_pendingResult) return` 가드를 사회적경제 경로에서 우회 — AI 결과 없이도 9섹션이 렌더링되어야 한다
- **`ai-engine.js` `buildPrompt1()`의 socialPrompt 주입 분기 제거** — `buildPrompt1`의 유일한 호출자가 `callClaude()`이고 그 경로를 차단했으므로 도달 불가능한 죽은 코드가 됐다. **`d.socialPrompt` 자체는 `_buildSocialPrompt()`의 입력으로 계속 쓴다**

### ⑥ 예상 응답 시간
| 항목 | 이전 (micro 3회) | 이번 (단일) |
|---|---|---|
| API 호출 | 3회 순차 | **1회** |
| max_tokens 상한 | 16000 × 3 = 48000 | **6000** |
| 사용자가 기다리는 구간 | AI 전체 완료까지 | **없음**(진단 화면 먼저) |
- 출력 토큰이 대략 1/8 수준이고 순차 호출이 사라지므로 **AI 자체 소요는 이전의 1/5~1/8 수준**으로 추정된다
- 다만 체감상 더 중요한 것은 ③이다 — **사용자는 AI를 기다리지 않는다.** 레이더차트를 읽고 넘어올 즈음이면 대개 완료돼 있다
- ⚠ 실제 API로 측정하지는 않았다(토큰 소모). 위는 호출 횟수·토큰 상한 기반 추정치다

### ⑦ 검증 (Node DOM + fetch 스텁, 42/42 통과)
| 항목 | 결과 |
|---|---|
| 엔드포인트 | `/api/claude-analyze-social` 호출 · **`claude-analyze-1/2/3` 미호출** ✓ |
| 프롬프트 | 제약 4종·맥락 5종 포함 · 경고 원문 포함 · `socialPrompt` 포함 · 지원사업 블록 포함 · **금액 수치 0건** ✓ |
| 선행 렌더 | `runAnalysis`가 AI를 기다리지 않고 반환 · diag-reveal 활성 · dashboard 숨김 · 레이더차트 렌더됨 ✓ |
| 로딩 중 진입 | 스피너 표시 · **나머지 8섹션은 정상 렌더** ✓ |
| 완료 후 | 자동 갱신 · priority 카드 · 90일 3개월 · cautions · 자리표시자 문구 소멸 ✓ |
| AI 실패 | `sec-social-action`만 에러 + 다시 시도 · **가짜 데이터 없음** · 나머지 7섹션 정상 · **`analysis-error` 전체 화면으로 안 넘어감** ✓ |
| 경쟁 조건 | 낡은 응답이 새 화면에 꽂히지 않음(로딩 상태 유지) ✓ |
| **회귀** | sme·micro 모두 `claude-analyze-1/2` 호출 유지 · `claude-analyze-social` 미호출 ✓ |
| 설정 | `vercel.json` icn1·120초 · **1/2/3차 maxDuration 300 불변** · `claude-analyze-1.js` 미변경 ✓ |

### ⑧ 캐시버스팅
`index.html` 로컬 `?v=` 49곳 전부 `20260817b`

### ⑨ 남은 이슈
1. **사회적경제 AI 결과가 이력에 저장되지 않는다.** `HistoryTracker.save(data, null)`로 호출하므로 `priority`·`plan90`이 스냅샷에 남지 않는다.
   현재 `HistoryTracker`는 **도메인 점수 비교·이슈 태그만 렌더링**하고 전체 리포트를 복원하는 기능이 없으므로 **지금 당장 깨지는 것은 없다.**
   다만 향후 "지난번 진단 결과 다시 보기"를 만들면 사회적경제만 AI 부분이 비게 된다. 그때 스냅샷 스키마에 필드를 추가해야 한다(이번엔 구조 미변경).
2. **`api/claude-analyze-funding.js`도 절단 시 그냥 실패한다.** `runWithContinuation`을 쓰지 않고 `stop_reason === 'max_tokens'`면 에러를 반환할 뿐이다.
   `max_tokens: 6000`이라 정책자금 출력량 기준으로 절단 가능성은 낮지만, 신설 social API와 동일하게 `runWithContinuation`으로 교체하는 것이 일관적이다. **이번에는 수정하지 않았다**(정책자금 경로 무영향 제약).

---

## 최근 수정 이력 (2026-09-01) — 진단 진행률·탭 라벨 문항 수 오류 수정

**`.diag-item`을 DOM 전역에서 세어 미사용 컨테이너(다른 경로용)의 문항까지 합산되던 문제.**
sme 경로에서 실제 36문항이 **76**으로 표시됐다.

### ① 재현 — 76의 정체를 정확히 특정했다
```
사회적기업 진단 → (새 분석) → sme 재진단
  diag-common-container   20문항
  diag-social-container   40문항  ← 이전 경로 잔존
  diag-industry-container 16문항
  ─────────────────────────────
  전역 합계 76  ← 보고값과 일치
```
- `loadDiagnosisUI()`는 미사용 컨테이너를 `classList.add('hidden')`만 하고 **`innerHTML`을 비우지 않았다.** `reset()`도 `diagScores`만 비우고 컨테이너는 손대지 않았다
- **단일 경로만 실행한 세션에서는 원래도 정확했다.** 경로 전환 시에만 터지는 버그이며, 컨테이너가 3개(common/micro/social)로 늘면서 오차가 커졌다
- ⚠ `diagTab-common` 안에 **common / micro / social 3개가 형제로 공존**하는 구조가 원인이다

### ② 수정 — 활성 컨테이너 기준으로 통일
`_activeContainers`(모듈 스코프) 신설. `loadDiagnosisUI()`가 매번 갱신한다.

| 헬퍼 | 역할 |
|---|---|
| `_countDiagItems(ids)` | `#컨테이너 .diag-item:not([data-signal-only])` 스코프 카운트 |
| `_countDoneScores()` | `diagScores` 키를 **활성 접두어로 한정**해 카운트 |
| `_clearInactiveContainers()` | 이번 경로에 없는 컨테이너 `innerHTML=''` |
| `_clearAllDiagContainers()` | `reset()`용 전체 비우기 |

- **분모(DOM)와 분자(diagScores)의 범위를 일치**시켰다. 어긋나면 전 문항을 채워도 100%가 되지 않는다
- `updateDiagProgress()` · `validate(2)` · 탭 라벨 · 배너가 **전부 같은 함수**를 쓴다
- `industryData`가 없는 업종(매핑 미지원)에서도 이전 렌더가 남던 문제를 함께 처리 — 활성 목록에 넣지 않아 자동으로 비워지고 탭 버튼도 숨긴다
- `loadDiagnosisUI()` 말미의 진행률 표시를 `'0 / N'` 고정에서 **`updateDiagProgress()` 호출**로 교체(`restoreScores()` 뒤). 저장된 점수를 갖고 step2에 재진입해도 0으로 보이던 문제가 함께 해소된다

### ③ 하드코딩 문항 수 제거 — 실제 렌더 결과에서 파생
| 위치 | 기존(하드코딩) | 실제 |
|---|---|---|
| 업종 탭 라벨 | `특화 진단 (5문항)` | **16문항** (18개 모듈 전수: 4영역×4문항) |
| 공통 탭 라벨 | `기본 경영 진단 (8문항)` | **20문항** |
| 사회적기업 배너 | `8대 영역 40문항 + 업종 특화 5문항` | 40 + **16** |

- 2026-04-27에 업종 진단을 5문항으로 줄였다가 2026-05-17 v2.0 재작성에서 16문항으로 되돌아갔는데 **라벨만 `(5문항)`으로 남아 있었다**
- `_cntSuffix(n)` — **n이 0이면 숫자를 붙이지 않는다.** 잘못된 숫자를 보여주느니 빼는 편이 낫다

### ④ ⚠ 기준 통일 — signal-only 제외 쪽을 택했다
공통 진단은 화면에 **21개**가 보이지만 그중 **DX 탐지 1문항은 `_signalOnly`**로 점수에 반영되지 않는다(2026-04-30 도입).
**진행률 분모·탭 라벨 모두 `:not([data-signal-only])` 기준(20)으로 통일했다.**
필수가 아닌 문항을 분모에 넣으면 100% 달성이 구조적으로 불가능해지기 때문이다.
→ **sme = 20 + 16 = 36**, micro = 35 + 16 = 51, 사회적기업 = 40 + 16 = 56

### ⑤ 검증 (Node DOM 스텁, 35/35 통과)
| 항목 | 결과 |
|---|---|
| 단일 경로 | sme **36** / micro **51** / 사회적기업 **56** ✓ |
| 경로 전환 (reset 경유) | 사회적기업 56 → reset(컨테이너 전부 빔) → sme **36** (76 아님) ✓ |
| 경로 전환 (reset 없이) | `loadDiagnosisUI` 재호출만으로도 36 · social 컨테이너 자동 정리 ✓ |
| 전 문항 응답 | 세 경로 모두 **정확히 100%** + `validate(2)` 통과 ✓ |
| 탭 라벨 | 공통 20/35/40 · 업종 16 · **라벨 합 = 진행률 분모** ✓ |
| 배너 | 40문항 + 16문항, `5문항` 표기 소멸 ✓ |
| 미지원 업종 | 이전 업종 문항 잔존 0 · 탭 숨김 · 진행률 20 ✓ |
| 잔존 점수 | 사회적기업 10개 응답 후 sme 전환 → **done 0** (미합산) ✓ |
| **회귀** | micro 35문항 `D1_1→D7_5` · social 40문항 `s1_1→s8_5` · 점수 키 접두어 전부 동일 ✓ |

### ⑥ 캐시버스팅
`index.html` 로컬 `?v=` 49곳 전부 `20260817a`

### ⑦ 남은 이슈 — 잔존 `diagScores`가 AI로 전달될 수 있다 (이번엔 손대지 않음)
`done` 계산은 활성 접두어로 한정했지만 **`diagScores` 자체는 정리하지 않았다.**
- 경로가 바뀌는데 `reset()`을 거치지 않는 흐름이 있다: **step1에서 직원 수를 고친 뒤 `analyzeBiz()` 재실행** → biz-context → `startDiagnosis()` → `loadDiagnosisUI()`. 이때 `diagScores`에 이전 경로 점수가 남는다
- `DiagMicro/DiagSocial.calcScores()`·`_calcMicroDomainScores()`는 **접두어로 필터**하므로 안전하다. 그러나 **`CrossContext`는 접두어 무관으로 전 키를 훑으므로** 이전 경로 점수가 교차 경고를 오발동시킬 수 있다
- **판단: 이번엔 삭제하지 않았다.** `loadDiagnosisUI()`는 호출 시점에 DOM 값이 아직 확정되지 않았을 수 있고, 경로 판정이 한 번이라도 어긋나면 **사용자 응답이 되돌릴 수 없이 삭제된다.** 진행률 오류는 표시 문제지만 응답 삭제는 데이터 손실이다
- **다음 수정 시 권장**: `diagScores`를 지우지 말고 **`collectAllScores()`가 활성 접두어만 반환**하도록 좁히는 쪽이 안전하다(데이터는 보존, AI 전달만 차단)

---

## 최근 수정 이력 (2026-08-31) — 사회적경제 전용 리포트 화면 신설 (1차: 9섹션, AI 미연결)

**진단은 S1~S8으로 바뀌었는데 결과 리포트는 중소기업용 13섹션(SWOT·STP·4P·린캔버스·6가지시스템)이 그대로 나왔다.**
40문항을 묻고 **S5(조직·거버넌스)·S7(인증·제도)·S8(디지털) 15문항 결과는 리포트에서 아예 다뤄지지 않았다.**

### ① 설계 원칙 — 수미쌍관
**진단에서 물은 8개 영역은 리포트에서 모두 다뤄져야 한다.** 묻고 안 쓰는 문항은 응답자의 시간을 낭비시킨다.
SWOT·STP·4P·린캔버스는 쓰지 않는다 — 사회적경제 조직은 규모상 소기업 수준이라 그 틀이 맞지 않는다.

### ② 9섹션 — 목차 라벨은 프레임워크 이름 대신 사장님이 읽는 말로
| 섹션 id | 목차 라벨 | 대응 진단 영역 |
|---|---|---|
| `sec-social-summary` | 한눈에 보기 | 총점 + 취약 Top3 + CRITICAL·HIGH 경고 |
| `sec-social-status` | 우리 조직 현재 상태 | **S1~S8 전 영역** |
| `sec-social-mission` | 미션과 사업이 맞물리나 | S1 + S2 |
| `sec-social-revenue` | 어디서 돈이 들어오나 | S3 + S6 |
| `sec-social-profit` | 수익 구조 점검 | S4 |
| `sec-social-org` | 조직이 버틸 수 있나 | S5 + S8 |
| `sec-social-system` | 제도를 제대로 쓰고 있나 | S7 |
| `sec-social-action` | 무엇부터 할 것인가 | 경고 전체 (레벨순) |
| `sec-gov` | 정부지원사업 | **기존 섹션 재사용 — 미변경** |

### ③ 키 체계 — 앱에 8영역 키가 두 벌 있다
- `wizard.js _calcSocialDomainScores()` → **`s1~s8`** (diag-reveal 레이더차트 전용)
- `DiagSocial.calcScores()` → **`mission`·`value_biz`·…** (`domain.key`, `pct`·`total` 포함)

**리포트는 `DiagSocial.calcScores()`(`fd.scaleScores`)를 정본으로 쓴다.** 양쪽 다 고치지 않았다.
⚠ 매핑 테이블을 dashboard.js에 **하드코딩하지 않는다** — `DiagSocial.DOMAINS`가 `{id:'s1', key:'mission'}`을 둘 다 갖고 있으므로 `_socialDomainList()`가 **런타임에 파생**한다. 하드코딩하면 협동조합 전용 모듈(DiagCoop) 추가 시 또 복제해야 하고, 영역이 바뀌면 한쪽만 고쳐 조용히 깨진다. DiagSocial 미로드 시 빈 배열을 반환해 예외는 나지 않는다.

### ④ `isSocialOrg` 파생 플래그 신설 — 배열 3중 복제 방지
`_isSocialOrg()`는 wizard.js 클로저 내부라 dashboard.js에서 접근할 수 없다.
`SOCIAL_ORG_TYPES` 배열을 세 번째로 복제하는 대신 **`collect()`가 `data.isSocialOrg`(boolean)를 실어 보낸다.**
판정 기준은 wizard.js 한 곳에만 둔다.
- dashboard.js `_isSocialFd(fd)`: 플래그가 boolean이면 그대로 사용, 없으면(레거시·이력 스냅샷) **배열 복제 없이 `orgType !== 'general'`** 로 판단
- `SOCIAL_DOMAIN_EXPLAIN`도 복제하지 않고 **`Wizard.SOCIAL_DOMAIN_EXPLAIN`을 export해 읽는다**

### ⑤ 렌더 진입점 — `renderSocial(fd)` 신설
- ⚠ **`render(data, fd, isDemo)`를 재사용하지 않는다.** 그쪽은 `data.executiveSummary`·`swot`·`stp`를 DOM에 직접 밀어넣는 단일 거대 함수라 AI 데이터가 없는 1차에서는 깨진다
- `renderFunding()`과 동일한 **keep 화이트리스트** 패턴 — `SOCIAL_ONLY_SECTIONS + ['sec-gov']`만 표시
- `render()` 진입부에서 `_isSocialFd(fd)`면 `renderSocial(fd)` 호출 후 **early return**
- `render()`에 `SOCIAL_ONLY_SECTIONS` 숨김 블록 추가 (social → general 재진입 시 잔상 방지)
- `buildNav(isMicro, isFunding)` → **`(isMicro, isFunding, isSocial)`** 로 확장, `isSocial`을 맨 앞 분기로. 기존 호출 2곳은 무영향

### ⑥ 섹션별 처리에서 판단이 갈린 지점
- **⑤ 수익 구조** — `winning_but_losing`("수주는 하는데 남는 게 없는" 구조)이 이 화면의 핵심이므로 문항표보다 **앞에 별도 강조 박스**(`.soc-headline-warn`)로 배치
- **⑦ 제도** — ⚠ **인증 만료 경고·갱신 절차 안내를 넣지 않았다.** 실무 확인 결과 갱신을 놓쳐 자격을 잃는 사례가 거의 없어 값이 낮다. 대신 **활용도**에 집중: SVI 측정 여부(`s7_2`) / 자격은 있는데 못 쓰는 제도(`s3_4` 우선구매·`s3_3` 조달등록·`s7_3` 중간지원조직·`s7_5` 지배구조) / 다음 단계 인증 검토(`s7_1` 기준)
- **⑧ 실행** — 1차는 경고를 `CRITICAL → HIGH → MEDIUM` 순 나열만. `AI 실행 계획은 준비 중` 자리표시자를 두었다. AI 우선순위·90일 플랜은 2차
- 경고 code→섹션 매핑(`SOCIAL_WARN_SECTION`)에 없는 code도 **⑧에는 전부 나온다** → 새 규칙이 추가돼도 화면에서 사라지지 않는다

### ⑦ D. 소상공인 목차 라벨 정리 (함께 처리)
`Executive Summary → 한눈에 보기` / `생애주기 진단 → 우리 가게 지금 단계` / `상권 STP · 시장규모 → 우리 동네 손님과 시장` / `7대 영역 처방 → 영역별 처방` / `90일 실행 로드맵 → 90일 실행 계획`.
⚠ **`href`(섹션 id)·순서·내용은 미변경.** sme 목차 13개는 손대지 않았다.

### ⑧ 검증 (Node DOM 스텁, 39/39 통과)
**수미쌍관을 코드로 확인** — `DiagSocial.DOMAINS` 8개가 실제로 어느 섹션에 렌더링되는지 `data-domain` 속성으로 출력:

| ID | 영역 | 렌더링 섹션 |
|---|---|---|
| S1 | 미션·사회적 성과 | status + mission |
| S2 | 사업의 사회가치 지향성 | status + mission |
| S3 | 공공조달·판로 | status + revenue |
| S4 | 재정·원가구조 | status + profit |
| S5 | 조직·거버넌스 | status + org |
| S6 | 마케팅·브랜딩·품질 | status + revenue |
| S7 | 인증·제도·ESG | status + system |
| S8 | 디지털·AX | status + org |

**누락 0. 진단 40문항 라벨이 전부 리포트 HTML에 등장하는 것도 확인했다.**

| 케이스 | 결과 |
|---|---|
| `social_enterprise` | 목차 9개·섹션 9개 · 8섹션 본문 전부 채워짐 · SWOT/린캔버스 숨김 ✓ |
| 전 문항 1점 | 경고 12건 발동 · CRITICAL 2건이 ①과 지정 섹션에 표시 · **msg 원문 그대로** · ①에 MEDIUM 미표시 · ⑧ 레벨순 정렬 ✓ |
| S7 문구 검사 | **만료·갱신 절차 표현 0건** ✓ |
| **회귀** micro | 목차 7개 href·순서 동일, 라벨만 변경 · 사회적경제 8섹션 숨김 · micro 전용 섹션 표시 유지 ✓ |
| **회귀** sme | 목차 13개 **완전 동일** · 라벨 미변경 ✓ |
| **회귀** 정책자금 | 목차 5개 동일 ✓ |
| `isSocialOrg` 부재 | `orgType` fallback 진입 ✓ / **협동조합도 자동 적용** ✓ |
| 중복 검사 | s1↔key 하드코딩 없음 · `SOCIAL_ORG_TYPES` 3중 복제 없음 · `SOCIAL_DOMAIN_EXPLAIN` 복제 없음 ✓ |

### ⑨ 캐시버스팅
`index.html` 로컬 `?v=` 49곳 전부 `20260808b`

### ⑩ 2차 예정 (이번에 만들지 않음)
- `sec-social-action`에 AI 우선순위 과제 + 90일 실행 캘린더 연결
- 전용 프롬프트는 `ai-engine.js`에 별도 분기로 (이번에 `ai-engine.js`·`api/`는 건드리지 않았다)

---

## 최근 수정 이력 (2026-08-16) — 사회적기업 결과 화면이 일반 기업 것으로 나오던 문제 수정

**진단 문항은 S1~S8으로 정상 교체됐으나 결과 화면 3곳이 `orgType`을 전혀 모르고 있었다.**
문항만 바꾸고 결과 화면을 확인하지 않아 생긴 누락이다.

### ① 원인 — 분기 축이 `bizScale` 하나뿐이었다
`showDiagReveal()`의 유일한 분기가 `isMicro = (data.bizScale === 'micro')`인데,
**사회적기업도 `bizScale`은 `micro`**이므로 micro 분기로 빠진다.
`_calcMicroDomainScores()`는 `/^diag-micro-container_(\d)_/`로 찾는데 실제 점수 키는
`diag-social-container_s1_1` 형태라 **하나도 매칭되지 않아 전 영역 0점** → 차트가 비고 해설 카드가 사라진다.

### ② A. 레이더차트 — `_calcSocialDomainScores()` 신설
- 정규식 `/^diag-social-container_s(\d)_/`, 8영역, 반환 형식은 `_calcMicroDomainScores`와 동일(`{key:{label,avg,color}}`)
- **분기 순서: `_isSocialOrg(orgType)` → `bizScale === 'micro'` → 그 외.** ⚠ orgType을 먼저 두지 않으면 영원히 micro로 빠진다. `isMicro`도 `!isSocial &&`로 막았다
- `SOCIAL_DOMAIN_EXPLAIN` 신설 — **키를 `s1`~`s8`로 맞춰야 한다.** `explainMap[key]` 조회 방식이라 키가 어긋나면 해설 카드가 조용히 빈다
- 섹션 타이틀 `📊 사회적기업 8대 영역 프로파일` + "8개 영역은 균등 배점이며 **SVI 예상 점수가 아니다**" 명시
- 진단유형 카드 `🤝 사회적기업 8대 영역 진단` + preview 6건(S1·S3·S4·S5·S6·S7). 보조 유형은 비움(micro와 동일)
- micro D1 미입력 진행 잠금은 `isMicro` 분기 안이라 사회적기업에 적용되지 않음 — 의도된 동작

### ③ B. 정부지원사업 — `orgType` 태그 + 사회적경제 사업 5건 신설
- **기존 PROGRAMS 29개 중 사회적경제 관련 0건**이었다(전수 확인). 409~410행의 `social_enterprise`/`social_venture`는 `INDUSTRY_LABEL` 역매핑일 뿐 사업 항목이 아니다
- 신설 5건(전부 `orgType: 'social'`, **금액 수치 없음**): `se_growth`(사회적기업 육성사업) · `se_fiscal`(재정지원 — 일자리창출·사업개발비) · `coop_support`(협동조합 활성화) · `svf_loan`(사회가치연대기금) · `se_market`(판로지원 — 공공기관 우선구매·e-store36.5)
- `match()` 로직:
  | 조건 | 처리 |
  |---|---|
  | `p.orgType === 'social'` + 사회적경제 기업 | **+4 (최우선)** |
  | `p.orgType === 'social'` + 일반 기업 | **제외**(감점 아님) — 신청 자격이 없는 사업 노출은 오정보다 |
  | 사회적경제 기업 + `VC_TRACK_IDS`(`tips`·`fintech_support`) | 제외. ⚠ **`social_venture`는 제외하지 않는다**(실제 대상이 될 수 있음) |
- `orgType` 미지정(레거시 호출)은 `'general'`로 취급 → 기존 동작 그대로
- 판정 목록(`SOCIAL_ORG_TYPES`)은 wizard.js와 같은 값을 **gov-support.js 내부에 복제**했다 — 모듈 간 의존을 만들지 않기 위함

### ④ C. 동종업계 비교 — 지시와 실제 구조가 달라 분리 처리
"동종업계 비교"에 해당하는 박스가 **2개**이고 성격이 다르다.
- **`#drSurvivalBox`(KOSIS 생존율)** — `data.industryKey` 기준이라 실제로 IT 업종 생존율이 나온다. **(b) 채택**: 유지하되 `ℹ️ 일반 {업종} 기준이며 사회적기업 특성은 반영되지 않았습니다` 안내를 박스 상단에 명시. 통계청 실측치이고 사회적기업도 같은 시장에서 폐업하므로 정보 가치가 있다
- **`#drPatternBox`(PatternDB)** — 지적된 것과 달리 **IT 지표와 비교되고 있지 않았다.** 이미 모든 경로에서 고정값을 표시 중(아래 남은 이슈). 이번엔 **사회적기업 경로에서만 `display:none`** 처리하고 소상공인 경로는 손대지 않았다

### ⑤ 검증 (Node DOM 스텁, 33/33 통과)
| 케이스 | 결과 |
|---|---|
| `social_enterprise` + S1~S8 점수 | 8영역 산출 · 키 `s1~s8` · **0점 영역 없음** · s3 부분 저점 2.8 정확 반영 ✓ |
| 화면 요소 | 타이틀 8대 영역 · 진단유형 사회적기업 · **해설 카드 8건 전부 본문 채워짐** · 점수 바 8건 · PatternDB 숨김 ✓ |
| gov-support (사회적기업) | 상위 5개가 전부 사회적경제 사업 · **TIPS·핀테크 제외** ✓ |
| gov-support (소셜벤처) | **TIPS 포함**(제외 안 함) ✓ |
| **회귀** `general`+`restaurant` | 사회적경제 사업 미노출 · 6건 유지 · 외식업 스마트화 포함 · orgType 미지정도 동일 ✓ |
| **회귀** micro+general | 키 `d1~d7` · 타이틀 7대 영역 · **PatternDB 숨기지 않음** ✓ |
| **회귀** sme | 5대 역량 · 보조 유형 표시 · 5축 ✓ |
| 금액 하드코딩 | 신설 5건에 억원·만원·% 표기 **0건** ✓ |

### ⑥ 캐시버스팅
`index.html` 로컬 `?v=` **49곳** 전부 `20260808a`.
⚠ `js/gov-support.js`는 `?v=` 자체가 없던 파일이라 **이번에 새로 부여**했다(48 → 49곳). `?v=` 없는 파일을 수정하면 반드시 새로 붙여야 캐시가 갱신된다

### ⑦ 남은 이슈 — PatternDB(`#drPatternBox`)가 모든 경로에서 무의미한 값 표시 중
**사회적기업만의 문제가 아니라 소상공인 경로에서도 이미 깨져 있다.** 원인 2가지:
1. `pattern-db.js`가 `domainScores.finance / hr / bm / differentiation` 키를 읽는데
   **micro는 `d1~d7`, 사회적기업은 `s1~s8`** 키를 쓴다. 전부 `undefined`가 되어
   `?.avg || 3` 으로 **기본값 3점(중립) 고정**이 된다
2. `diagData.industry`는 `#industry` select 제거(2026-04-17) 이후 **항상 빈 문자열**이므로
   `INDUSTRY_CONTEXT`가 **`local_service`로 고정**된다. `industryKey`를 써야 한다
→ 결과적으로 **어떤 사용자든 동일한 고정값이 표시된다.**
수정 시 **PatternDB 4축과 D1~D7 / S1~S8의 매핑 설계가 선행**되어야 하며,
리포트 구조 개편 작업과 함께 다루는 것이 적절하다. 임시 매핑은 나중에 다시 뜯어야 한다
- 협동조합·소셜벤처 **전용 진단지**는 여전히 미완. 이번 수정은 전부 `_isSocialOrg()` 기준이므로 전용 모듈이 생기면 자동 적용된다

---

## 최근 수정 이력 (2026-08-16) — 사회적기업 진단이 발동하지 않던 문제 수정 (orgType 분리)

**사회적기업 진단지를 만들어 놓고도 실제로는 한 번도 발동하지 않고 있었다.**
실사용 테스트에서 사회적경제기업이 `knowledge_it`(지식서비스·IT)으로 판별돼 일반 진단(8+5문항)이 그대로 나왔다.

### ① 원인 — `analyze-biz.js`가 `social_enterprise`를 반환할 수 없다
- `_detectOrgType()`은 `industryKey === 'social_enterprise'`일 때만 발동하는데, **`api/analyze-biz.js`에 `social_enterprise`라는 값 자체가 존재하지 않는다**(전수 확인). AI 업종분석이 이 값을 반환할 방법이 없으므로 판별 로직이 **구조적으로 무효**였다
- 근본 판단: **사회적기업은 업종이 아니라 조직 형태다.** 도로시앤컴퍼니는 업종상 컨설팅업이 맞고 사회적기업은 그 위에 얹힌 법적 지위다 → AI가 판별할 것이 아니라 사용자가 직접 선택해야 한다

### ② `orgTypeSelect` 신설 — biz-context 화면
- 위치: `#biz-context-content`(업종 판별 결과) **바로 아래**. `.biz-ctx-orgtype` 블록 + `#orgTypeSelect`
- 선택지 4종: `general`(기본) / `social_enterprise` / `cooperative` / `social_venture`
- ⚠ **step1이 아니라 biz-context에 둔 이유**: step1 필드는 사업자등록증 기재사항이고 OCR 자동입력 대상이다. 법적 지위를 여기 섞으면 OCR 흐름과 충돌한다. 업종 판별 결과를 본 뒤 "그 위에 사회적기업"을 얹는 순서가 자연스럽다
- ⚠ **정책자금 경로에서는 숨긴다** — `showBizContext()` 말미에서 `_purpose === 'funding'`이면 `#orgTypeBlock`을 `display:none`. **biz-context는 정책자금 경로도 거치므로**(startFundingDiagnosis → step1 → analyzeBiz → biz-context → step5) 숨기지 않으면 step5 인증 체크박스와 중복 질문이 된다
- `cooperative`·`social_venture`는 전용 모듈이 없어 **선택 시 confirm** — 확인하면 S1~S8을 적용하되 **orgType 값은 선택값 그대로 유지**(전용 모듈 신설 시 자동 전환), 취소하면 `general`로 원복
- 이벤트는 HTML `onchange`가 아니라 **`DOMContentLoaded` 리스너**로 등록 (2026-06-05 c317c03 캐시 문제 재발 방지)

### ③ `_detectOrgType()` — 사용자 선택 우선
```js
const sel = document.getElementById('orgTypeSelect')?.value || '';
if (sel) return sel;
return industryKey === 'social_enterprise' ? 'social_enterprise' : 'general';  // 레거시 fallback
```
- **`industryKey`는 건드리지 않았다.** 컨설팅업 사회적기업 = `industryKey:'knowledge_it'` + `orgType:'social_enterprise'`가 정확한 상태다. `INDUSTRY_MAP`·업종 판별 로직 미변경
- `SOCIAL_ORG_TYPES = ['social_enterprise','cooperative','social_venture']` + `_isSocialOrg()` 헬퍼 신설

### ④ ⚠ 지시에 없던 충돌 3건 — 함께 수정 (이게 없으면 화면에서만 동작한다)
| 지점 | 문제 | 조치 |
|---|---|---|
| `ai-engine.js:1286` | `d.orgType === 'social_enterprise'` 단일 비교 → **협동조합 선택 시 socialPrompt가 AI에 전달되지 않고 micro 분기로 빠짐** | 3종 포함 조건으로 확장 |
| `wizard.js collect()` | 동일 단일 비교 → `scaleScores`가 DiagSocial이 아닌 **DiagMicro로 계산됨** | `_isSocialOrg()`로 교체 |
| `wizard.js reset()` | `_orgType` 미초기화 → "새 분석" 시 잔상 | `_orgType='general'` + select·배너 초기화 추가 |

### ⑤ 업종 특화 탭 — **a-1(숨김) 폐기, b안(유지) 채택**
- **기존 a-1의 근거가 이번 수정으로 소멸했다.** 과거엔 `industryKey === 'social_enterprise'`였으므로 업종 탭이 렌더링하던 것이 `INDUSTRY_SOCIAL_ENTERPRISE`(9문항, S1~S8과 내용 중복)였다. 이제 industryKey가 실제 업종이므로 업종 탭은 **컨설팅업 특화 5문항**을 렌더링하고 중복이 0이다
- `industryData = isSocial ? null : ...` → 조건 제거, 탭 버튼 `display:none` → 항상 노출
- `_tabOrder()`는 **함수를 남기되 항상 `TAB_ORDER` 반환**(사용처 4곳 미변경). 점수 키가 `diag-industry-container_*`로 분리되어 `DiagSocial.calcScores()`(`diag-social-container_` 접두어만 수집)에 섞이지 않음 — 확인 완료
- 결과: 사회적기업 = **40 + 5 = 45문항**

### ⑥ 진단 유형 배너 — `#diag-type-banner` (step2 상단)
- `🤝 사회적기업 전용 진단 (8대 영역 40문항) + 업종 특화 5문항`
- 협동조합·소셜벤처는 `전용 진단 준비 중 — 사회적기업 진단(공통 항목)으로 진행합니다` 부기
- **일반 기업은 배너를 표시하지 않는다**(기존 화면 그대로)

### ⑦ 검증 (Node DOM 스텁, 32/32 통과)
| 케이스 | 결과 |
|---|---|
| 사회적기업 + `knowledge_it` | `orgType:'social_enterprise'` · **`industryKey:'knowledge_it'` 유지** · `bizScale:'micro'` 유지 · socialPrompt 생성 · scaleScores 8영역 ✓ |
| 협동조합 | `orgType:'cooperative'` **선택값 유지** + socialPrompt 생성(S1~S8 차용) · microPrompt 미생성 ✓ |
| 소셜벤처 | 동일 ✓ |
| **일반 기업 회귀** (`restaurant`/micro) | `orgType:'general'` · socialPrompt 미생성 · **microPrompt 생성** · 배너 숨김 · 탭 레이블 기존 유지 ✓ |
| `orgTypeSelect` DOM 부재 | industryKey fallback 정상 동작 ✓ |
| `loadDiagnosisUI` 렌더 | 예외 없음 · **업종 탭 노출 유지** · 업종 5문항 + S1~S8 동시 렌더 ✓ |
| ai-engine 분기 | cooperative → 주입 / general → 미주입 ✓ |

### ⑧ 캐시버스팅
`index.html` 로컬 `?v=` 48곳 전부 `20260807c`

### ⑨ 남은 이슈
- 협동조합·소셜벤처 **전용 진단지(40문항 수준) 신설**은 여전히 미완. 신설 시 `_isSocialOrg()` 분기에서 `orgType`별로 모듈만 갈아끼우면 된다 (선택값을 보존해 둔 이유)
- `js/diagnosis/industry/social_enterprise.js`(9문항)·`social_venture.js`(41줄)는 `INDUSTRY_MAP['사회적기업']` 경로로만 도달 가능한 상태로 남아 있음

---

## 최근 수정 이력 (2026-08-07) — 사회적기업 전용 진단지 신설 (S1~S8 40문항)

**기존 `social_enterprise.js`는 3영역 9문항뿐이고, 공통 진단(D1~D7 35문항)이 그대로 붙어
사회적기업에 "테이블 회전율"·"재방문율" 같은 무관한 문항이 나오고 있었다.** (실사용 리포트에서 확인)

### ① `js/diagnosis/diagnosis-social.js` 신설 — `DiagSocial`
- **S1 미션·사회적 성과 / S2 사업의 사회가치 지향성 / S3 공공조달·판로 / S4 재정·원가구조 / S5 조직·거버넌스 / S6 마케팅·브랜딩·품질 / S7 인증·제도·ESG / S8 디지털·AX** — 8영역 × 5문항 = **40문항**
- 근거: 한국사회적기업진흥원 **SVI(사회적가치지표) 14개 지표** 프레임 (사회적/경제적/혁신 성과)
- ⚠ **SVI 실제 배점(사회적 60 / 경제적 30 / 혁신 10)을 따르지 않는다.** BizNavi는 SVI 점수를 예측하는 도구가 아니라 **준비도를 진단하는 도구**다. SVI를 흉내내면 진흥원 실제 결과와 달라 신뢰 문제가 생긴다 → **8영역 균등 배점 `weight: 0.125`**
- ⚠ **S3(공공조달·판로)는 SVI에 없는 축**이다. 지역기반 사회적기업 매출의 실체이며, **SVI는 가치 창출은 보되 수익 구조는 보지 않기 때문에** 별도로 둔다
- `buildPromptSummary()`에 해석 지침 명시: "SVI 예상 점수·등급을 추정하지 마라 / 8영역은 균등 배점이므로 SVI 배점에 맞춰 재가중하지 마라"

### ② 스키마는 `diagnosis-micro.js`와 완전 동일
- `DOMAINS: { id, key, label, icon, desc, weight }` / `ITEMS: { label, question, scale[5], ai_trigger:{threshold, warning} }`
- ⚠ **`scale`은 1~5 다섯 단계 전부 작성**했다. `_scaleToAnchors()`가 `anchors[s.score] = s.desc`로 그대로 매핑하므로 **1/3/5만 주면 2점·4점 앵커가 비어 렌더링이 성글어진다**
- 서술은 추상어 대신 구체적 행동으로 작성 (예: `'연 1회 결산 때만 사업별로 나눠보고 개별 수주 판단에는 쓰지 않음'`)
- 점수 키 접두어 **`diag-social-container_`** — micro와 키 충돌 방지. `collectAllScores()`는 `diagScores`의 모든 키를 접두어 무관하게 수집하므로 **수정 불필요**(확인 완료)
- `window` + `module.exports` **듀얼 익스포트**(CrossContext 패턴) — Node 스모크 테스트 가능
- `detectCrossWarnings()` 교차 규칙 **11개** (CRITICAL 2 / HIGH 5 / MEDIUM 4)
  - `public_lock_in`(공공의존+민간판로 없음) · `winning_but_losing`(공헌이익 미산출+공공수주 높음) · `subsidy_cliff`(지원금 의존+BEP 모름) · `mission_drift_risk` · `formal_shell` 등

### ③ `orgType` 플래그 신설 — **`bizScale`은 건드리지 않았다**
- ⚠ `bizScale`에 `'social'`을 추가하지 않았다. **`FundingRules`가 `bizScale === 'micro'` 기준으로 중진공 소상공인 제외(융자제한 9호)를 판정**하므로 값을 바꾸면 그 로직이 깨진다
- `wizard.js` 모듈 스코프에 `let _orgType`, `_detectOrgType(industryKey)` 추가
- `collect()`: **후반부에서 최종 `data.industryKey`(정책자금 override 반영) 기준으로 `data.orgType` 확정**
- 사회적기업이어도 `bizScale`은 `micro`/`sme` 그대로 유지됨 (검증 완료)

### ④ 진단 UI 분기 — C안 **a-1** 채택
- `social_enterprise.js`(9문항)는 **로드하지 않는다.** S1~S8과 내용이 크게 중복(`se_1_1`↔`s1_1`, `se_1_2`↔`s1_3`, `se_1_3`↔`s1_4` 등)
- ⚠ 두 모듈은 **물리적으로 다른 탭**(`diag-industry-container` vs 공통 탭)이라 "중복 문항 제거"(b안)는 두 파일 교차 편집이 필요하고 남는 문항이 3개뿐
- **업종 탭 자체를 숨긴다** — `industryData = null` 처리 + `diagTabBtn-industry`를 `display:none`. 그냥 로드만 끊으면 **탭 버튼은 있는데 내용이 없는 빈 탭**이 된다
- `TAB_ORDER`(const)는 그대로 두고 **`_tabOrder()` 런타임 분기**로 처리 — 사회적기업이면 `['common']`, 그 외는 기존 `['common','industry']`. 사용처 4곳(`goStep`·`prevDiagTab`·`updateDiagTabUI`) 교체
- 탭 레이블: `🤝 사회적기업 8대 영역 (40문항)`

### ⑤ 점수·AI 전달
- `collect()` 후반부: `orgType === 'social_enterprise'`면 `DiagSocial.calcScores()` → **`data.scaleScores`**(micro/sme와 동일한 자리) + `data.socialWarnings` + `data.socialPrompt`
- `ai-engine.js buildPrompt1()`: `d.orgType === 'social_enterprise' && d.socialPrompt`를 **micro/sme 분기보다 앞에** 배치 (규모와 무관하게 S1~S8 사용)
- 대시보드는 신규 렌더링을 만들지 않았다. `scaleScores` 구조가 micro와 동일해 기존 표시 로직이 그대로 동작한다

### ⑥ 검증 (Node, 28/28 통과)
| 항목 | 결과 |
|---|---|
| 모듈 구조 | 8영역 · 40문항 · 영역당 5문항 · weight 0.125 균등(합계 1.0) ✓ |
| scale 전수 검사 | **40문항 전부 1~5 다섯 단계 + 서술 10자 이상** ✓ |
| `calcScores` | 전 문항 1점→20 / 3점→60 / 5점→100. 영역 원점수 5·15·25점(25점 만점) ✓ |
| 교차경고 | 3점 → **0건** / 1점 → **11건**(CRITICAL 2 포함) ✓ |
| 지시 예시 3건 | `public_lock_in`·`winning_but_losing`·`svi_gap` 전부 정확 발동 ✓ |
| `orgType` 판별 | 사회적기업 → `social_enterprise`, **`bizScale`은 `micro` 유지** ✓ |
| **일반 업종 회귀** | `restaurant` → `orgType: 'general'`, `microPrompt` 생성, `scaleScores` **7영역**, `socialPrompt` 미생성 ✓ |

### ⑦ 캐시버스팅
`index.html` 로컬 `?v=` **48곳**(신규 스크립트 포함) 전부 `20260807b`

---

## 최근 수정 이력 (2026-08-07) — 경영진단 1차 max_tokens 절단 수정 + fakeAnalysis 호출 차단

### ⚠ 진단 정정 — 관찰된 에러는 `max_tokens` 감지 경로에서 나온 것이 아니다
사용자가 본 문구는 **"1차 분석 JSON 파싱 실패: {"executiveSummary":"…"**, 즉 API가 **200 OK로 성공 반환**한 뒤 `extractJSON`이 실패한 경우다.
세 API 파일 모두 `stop_reason === 'max_tokens'`를 이미 감지해 에러를 반환하고 있었으므로, **절단이 감지되지 않은 채 잘린 텍스트가 성공으로 반환**된 것이다. 원인 후보 3가지:
1. **스트리밍 중 `stop_reason` 미수신** — `stopReason`은 SSE `message_delta`에서만 채워진다. 그 전에 스트림이 끊기면 `null` → 검사 통과 → 부분 텍스트가 성공 반환 (가장 유력)
2. **SSE `error` 이벤트 무시** — 스트림 중간 오류를 처리하는 코드가 없었다
3. **sme 루프의 마지막 `break`** — `stop_reason`이 4종(end_turn/max_tokens/pause_turn/tool_use) 중 어느 것도 아니면 부분 텍스트를 성공 반환

→ **continuation만으로는 이 증상이 재발한다.** 완성 판정을 `stop_reason`이 아니라 **결과물(JSON 파싱 가능 여부)** 기준으로 바꾼 것이 실질적 수정이다.

### ① `lib/claude-stream.js` 신설 (공용 모듈)
- ⚠ **`api/` 하위에 두지 않는다** — Vercel이 `api/*.js`를 엔드포인트로 인식한다. `vercel.json`의 `functions`가 파일을 명시 열거하는 방식이라 `lib/`는 함수로 잡히지 않으며, 각 함수에서 **정적 `require('../lib/claude-stream')`** 로 참조해야 `@vercel/nft` 의존성 추적에 포함된다(동적 import·경로 조합 금지)
- `diagnoseJson(text)` → `'ok'` / `'truncated'` / `'malformed'` / `'empty'` 4상태
  - **파싱 실패에는 두 종류가 있다**: ① 잘려서 실패 ② 애초에 JSON이 아니라서 실패. ①은 이어쓰기가 답이지만 **②에 이어쓰기를 돌리면 엉뚱한 내용이 덧붙어 상황이 악화된다**
  - 판별: 코드펜스·앞뒤 설명문 제거 후 파싱 → 실패 시 **문자열·이스케이프를 존중하며 괄호 균형**을 센다. 미닫힘/문자열 미종료 → `truncated`, 균형인데 실패 → `malformed`
- `runWithContinuation()` — 스트리밍 호출 + **최대 2회** 이어쓰기. `stop_reason === 'max_tokens'`면 판별 없이 바로 continuation
- SSE `error` 이벤트 처리 추가

### ② 이어쓰기는 assistant prefill 방식
- 누적 텍스트를 **마지막 assistant 메시지**로 넣으면 Claude가 그 메시지를 이어서 쓰므로 **앞부분 반복이 구조적으로 발생하지 않는다**
- (지시받은 "assistant + user 메시지" 방식은 새 assistant 턴을 시작시켜 앞부분을 반복할 수 있어 채택하지 않음. 중복 방지 요구를 더 확실히 만족하는 쪽을 택함)
- 연속 continuation 시 assistant 메시지가 두 번 연달아 들어가지 않도록 **교체**한다
- Anthropic은 prefill 끝 공백을 허용하지 않으므로 `trimEnd`

### ③ ⚠ 검증에서 잡힌 실제 버그 — `stripOverlap` 무조건 적용 금지
- 초기 구현은 겹침을 무조건 제거했는데, **반복되는 정상 텍스트**(같은 문자·문구의 연속)를 겹침으로 오인해 **정상 내용을 최대 200자 잘라내 JSON을 깨뜨렸다** (스모크 케이스 2·3에서 발견)
- **수정**: `joinContinuation()` — 기본은 그냥 잇고(prefill이므로 중복이 원칙적으로 없음), **그 결과가 파싱되지 않을 때만** 겹침 제거본을 후보로 시도
- 불변식은 "바이트 동일"이 아니라 **"유효한 JSON"** 이다. 파싱되는 한 직접 연결을 채택한다(과잉 제거로 인한 조용한 내용 손실이 더 나쁘다)

### ④ 적용 범위
| 경로 | 처리 |
|---|---|
| 1차 micro / 2차 micro / 3차 | `runWithContinuation()` 사용 |
| **1차 sme (web_search tool_use 루프)** | 루프 내 개별 적용. **continuation은 tool_use turn과 별도로 최대 2회**, 전체 turn 합계 상한 `MAX_TOTAL_TURNS = 8` |
| 2차 sme (단일 요청) | 단일 요청 + 최대 2회 이어쓰기로 재작성 |
| **정책자금(`claude-analyze-funding.js`)** | **미변경** — 이미 실패 처리가 되어 있음 |
- 세 경로 모두 **반환 직전 `diagnoseJson()` 최종 검사** 추가 → `stop_reason`을 못 받아도 절단이면 에러로 잡힌다
- `max_tokens` 값 자체는 올리지 않았다 (비용·응답시간 증가, 근본 해결 아님)

### ⑤ fakeAnalysis 호출 경로 차단 (수정 2 — 더 중요)
- **실제 분석이 실패했는데 그럴듯한 가짜 보고서가 나오면 사용자가 자기 회사 분석으로 오인한다.** 정책자금에서 이미 제거한 방식을 경영진단에도 적용
- `app.js` catch: `alert` + `AIEngine.fakeAnalysis()` 제거 → **`analysis-error` 전용 화면**
  - 원인별 문구 변환: `max_tokens` 계열 → "분석 내용이 길어 생성이 중단되었습니다" / 네트워크·타임아웃 → "서버 응답이 지연되었습니다" / 그 외 → "일시적인 오류가 발생했습니다"
  - **원본 에러 메시지(JSON 조각 포함)는 `console.error`로만** — 화면에 노출하지 않는다
  - `[다시 시도]`(같은 입력으로 재분석) + `[입력 수정]`(위저드 STEP 4 복귀)
- ⚠ `fakeAnalysis` 함수 자체와 `isDemo` 배지 로직은 **삭제하지 않았다** (호출 경로만 차단)

### ⑥ 검증 (Node, Anthropic SSE 모의 — 16/16 통과)
`max_tokens`를 문자 수로 강제 제한하는 가짜 Claude로 절단을 재현했다.

| continuation 7건 | 결과 |
|---|---|
| 절단 없음 | 1회로 완성 ✓ |
| 1회 절단 | continuation 1회로 복구, **중복 0자** ✓ |
| 2회 절단 | continuation 2회로 복구, **중복 0자** ✓ |
| 3회 필요 | 상한(2회) 초과 → 실패 반환 + `[ERROR]` 로그 ✓ |
| 꼬리 반복 모델 | 결과가 유효한 JSON ✓ |
| 형식 오류(표 반환) | **continuation 생략**, 즉시 실패 ✓ |
| JSON 없음 | **continuation 생략** ✓ |

| `diagnoseJson` 9건 | 결과 |
|---|---|
| 완전한 JSON / 코드펜스 / 앞 설명문 / trailing comma | 전부 `ok` ✓ |
| 중괄호 미닫힘 / 문자열 미종료 / 배열 미닫힘 | 전부 `truncated` ✓ |
| 괄호 균형인데 파싱 실패 | `malformed` ✓ |
| JSON 아님 | `empty` ✓ |

### ⑦ 남은 이슈
- **협동조합·소셜벤처 전용 진단지도 동일 수준(40문항)으로 신설 예정.** `social_venture.js`는 현재 **41줄 부실 모듈** 상태이며, 협동조합은 전용 모듈 자체가 없다. 사회적기업과 마찬가지로 `orgType` 분기를 확장하는 방식이 될 것
- **`fakeAnalysis` / `_fakeByConsultingType` / `_fakeSpecialized` 약 1,530줄이 호출 경로 차단 후 죽은 코드가 됨.** `isDemo`는 `render(data, fd, isDemo)` 시그니처에 남아 있어 함께 정리 필요. **별도 커밋으로 진행 예정** (지금 섞으면 문제 발생 시 continuation 버그인지 삭제 부작용인지 구분이 안 됨)
- 실제 Anthropic API로 절단을 재현하는 테스트는 하지 않았다(토큰 소모). 재현하려면 `MAX_TOKENS_DEFAULT`를 임시로 500 등으로 낮추고 `vercel dev`로 1회 실행하면 된다

### ⑧ 캐시버스팅
`index.html` 로컬 `?v=` 47곳 전부 `20260807a`

---

## 최근 수정 이력 (2026-08-06) — ⚠ 제조업 영위 문항 오진 수정 (실사용 오진 발생)

**실제 산출물에서 음식점업 사업자가 '직접 영위함'을 선택해 중진공이 "제조업 예외로 대상 포함"으로 잘못 판정됐다.**
신청 자격이 없는 사업자에게 중진공 신청을 안내하는 오진.

### ① 원인 — 문항이 주관적 해석을 유발
- 기존 문구 "제조·가공 공정을 직접 영위하십니까?" → 음식점은 조리·가공을 하므로 '예'가 자연스러운 답
- 그러나 정책자금의 제조업은 **표준산업분류 C(10~34)** 이며, 음식점업은 **I(56) 숙박·음식점업**으로 제조업이 아님

### ② 수정 1 — 판단 기준을 '행위'에서 '서류 기재'로 변경
- 라벨: **"사업자등록증의 업태에 '제조업'이 기재되어 있습니까?"**
- hint: 표준산업분류 C(10~34) 기준임을 명시 + "음식점·카페의 조리, 미용실 시술, 건설 시공 등은 제조업에 해당하지 않습니다"
- 선택지: `업태에 제조업 기재됨` / `기재되어 있지 않음` / `모름` (value는 `yes`/`no`/`unknown` 유지 — 판정 로직 호환)
- **핵심**: '공정을 하느냐'는 주관적 해석이 개입하지만, '서류에 뭐라고 적혀 있느냐'는 확인 가능한 사실이다

### ③ 수정 2 — 명백한 비제조 업종의 '제조업' 응답에 재확인 경고
- `KOSMES_NON_MFG_INDUSTRIES` 신설 (9개 업종 + 한국어 라벨):
  `restaurant` · `local_service` · `wholesale` · `medical` · `finance` · `education` · `media` · `logistics` · `construction`
  - ⚠ `gov-support.js`의 `INDUSTRY_LABEL`에 의존하지 않도록 **이 코드 경로가 닿는 9개 라벨만 모듈 내부에 보유**(자립성 유지)
- 해당 업종 + `isManufacturing === 'yes'` → 통과시키되 재확인 유도:
  ```
  eligible: true, eligibilityUncertain: true,
  exceptionBy: '제조업 영위 (재확인 필요)', exceptionLabel: '제조업 예외 (확인 필요)',
  warning: '업종이 {라벨}(으)로 판별되었는데 제조업 영위로 응답하셨습니다. …'
  ```
- **`eligible`을 `false`로 바꾸지 않는다** — 실제로 음식점을 하면서 별도로 제조업을 등록한 경우가 있을 수 있으므로 단정하지 않고 재확인을 강하게 유도
- `evaluate()`의 agency 객체에 `warning` 필드 추가

### ④ 화면 — 경고 박스 + 주황 배지
- `dashboard.js`: `a.warning`이 있으면 기관 카드 **상단에 `.fa-warning` 경고 박스**
- 배지는 `.fv-exception`(파랑) 대신 **`.fv-exception-warn`(주황)** 으로 구분

### ⑤ AI 프롬프트 반영
- `_SYSTEM_FUNDING` 제약 추가: "기관에 `[⚠ 재확인 필요]` 경고가 붙어 있으면 그 확인 과제를 `priority`의 1번으로 배치하고, 확인이 끝나지 않은 상태에서 그 기관 신청을 전제한 계획을 세우지 마라"
- `_buildVerdictBlock()`이 `warning`을 `[⚠ 재확인 필요]` 라인으로 프롬프트에 주입

### ⑥ 검증 (Node, 지시 3케이스 + 회귀 6건)
| 케이스 | 결과 |
|---|---|
| `restaurant` + `yes` | `eligible: true` · `uncertain: true` · **warning 있음** ✓ |
| `mfg_parts` + `yes` | `eligible: true` · `uncertain: false` · warning 없음 ✓ |
| `restaurant` + `no` | `eligible: false` (기존과 동일) ✓ |
| `fashion` + `yes` | 비제조 목록에 없어 정상 예외 통과 ✓ |
| `fashion` / `mfg_parts` + `unknown` | 기존 업종 기반 로직 그대로 ✓ |
| `construction` + `yes` | 경고 발동 ✓ |
| `sme` 규모 | 게이트 자체를 안 타므로 경고 없음 ✓ |

### ⑦ 후속 수정 (해결됨) — `certs` 검사를 `isManufacturing` 분기보다 앞으로
- **문제**: `restaurant` + `제조업 기재됨` + 사회적경제 인증 조합에서 불필요한 제조업 재확인 경고가 뜨고, `exceptionLabel`도 `'제조업 예외'`로 잘못 표시됐다
- **판단 근거**: 비제조 경고의 목적은 *"자격이 없는데 있다고 오해해 헛수고하는 것"* 을 막는 것이다. **사회적경제 인증으로 이미 자격이 확정된 기업에는 그 위험이 존재하지 않는다.** 경고는 불안만 준다
- **수정**: `_kosmesEligibility` 분기 순서를 `bizScale → **certs** → isManufacturing('yes'/'no') → unknown` 으로 변경. ②③의 순서만 교체하고 나머지 로직은 미변경
  - certs 분기는 `isManufacturing` 값과 무관하게 **확정 반환**하며 `warning`을 붙이지 않는다
- **검증 (11/11 통과)**

  | 케이스 | 결과 |
  |---|---|
  | `restaurant`+`yes`+협동조합 | `사회적경제 예외` · uncertain false · **warning 없음** ✓ |
  | `restaurant`+`yes`+인증 없음 | `제조업 예외 (확인 필요)` · warning 있음 (기존 유지) ✓ |
  | `mfg_parts`+`yes`+인증 없음 | `제조업 예외` · warning 없음 (기존 유지) ✓ |
  | **`restaurant`+`no`+협동조합** | `사회적경제 예외` — **인증 예외가 먼저 걸림** ✓ |
  | `restaurant`+`no`+인증 없음 | `eligible: false` (기존 유지) ✓ |
  | 회귀 6건 (`unknown` 경로·업종 충돌 안내·`sme` 게이트 미진입) | 전부 기존 동작 유지 ✓ |

### ⑧ 캐시버스팅
`index.html` 로컬 `?v=` 47곳 전부 `20260806a` → ⑦ 수정으로 `20260806b`

---

## 최근 수정 이력 (2026-08-06) — 정책자금 진단 5단계 2차: AI 실행 로드맵 연결

**판정 결과를 먼저 렌더링한 뒤 AI를 호출하므로 AI 실패 시에도 판정은 온전히 표시된다.**
`exceptionBy` 배지 추가로 중진공 예외 적용 사유를 화면에 노출.

### ① `api/claude-analyze-funding.js` 신설 (단일 호출)
- 정책자금은 출력량이 적어 `claude-analyze-1/2/3` 3분할이 불필요 → **단일 호출**
- `stream: true`, `max_tokens: 6000`, `res.writeHead(200)` 즉시 전송(CDN TTFB 타임아웃 방지, b681af2 패턴 동일)
- `vercel.json`: `{ "regions": ["icn1"], "maxDuration": 120 }`
- **기존 `claude-analyze-1/2/3.js`는 미변경**

### ② `api/claude-analyze.js` 삭제 — 죽은 파일 정리
- 저장소 전수 검사 결과 **런타임 참조 0건** (자기 파일 헤더 · `vercel.json` · CLAUDE.md/스킬 문서 기록뿐, JS·HTML 참조 없음)
- 파일 삭제 + `vercel.json`의 `maxDuration: 300` 항목 제거
- ⚠ 이 파일을 재활용하지 않고 신규 생성한 이유: `max_tokens: 8000`, 경영진단용 프롬프트 구조라 용도 불일치

### ③ ai-engine.js — 별도 함수 `callFundingRoadmap()` 신설 (기존 로직 미변경)
**내부 분기가 아니라 별도 함수로 간 이유 3가지**:
1. `callClaude()`는 1차→2차(→3차) 순차 호출 + `FIRST_PASS_KEYS` 보호 병합이 한 몸이라, 내부 분기 시 early-return이 흐름 앞에 끼어 함수가 두 관심사를 갖게 됨
2. `apiCall()`의 엔드포인트가 `_callLabel` 삼항이라 라벨 추가 시 **기존 삼항을 수정**해야 함
3. 호출부(`runAnalysis` vs `checkFundingInput`)와 실패 처리 요구가 이미 완전히 분리돼 있음
- `_SYSTEM_FUNDING` — 제약 6종 명시: 단정 표현 금지 / 예상 승인액·금리·한도 제시 금지 / 판정에 없는 결격 사유 생성 금지 / `unknownItems`는 "확인 필요"로만 / 신보·기보 언급 금지 / 미응답 정보를 있는 것처럼 서술 금지
- `_buildVerdictBlock()` — 판정 결과를 텍스트로 직렬화. **`findings`의 `message`는 이미 근거 조항이 포함된 완성 문장이므로 AI가 재해석·재판정하지 않도록 "재판정 금지"를 프롬프트에 명시**
- `_buildFundingPrompt()` — 기업 기본 정보 + 판정 결과 + `GovSupport.buildPromptBlock()`
  - **업종은 한국어 라벨로 전달** (영문 키를 그대로 넣으면 AI가 업종을 인식하지 못함) → `gov-support.js`의 `INDUSTRY_LABEL`을 export해 사용
- `_extractJSONFunding()` — `callClaude` 내부 `extractJSON`과 동일 로직을 복제(기존 중첩 함수는 그대로 둠)
- 출력: `{ situation, priority[3~5], prepare90[3], cautions[] }`

### ④ 화면 — `sec-funding-roadmap` 신설 + 섹션 순서 정정
- ⚠ **1차의 실수 수정**: 정책자금 섹션을 `sec-gov` **뒤**에 넣어 화면 순서가 `지원사업 매칭 → 판정 요약 → …` 로 목차와 어긋나 있었음
- `sec-gov` **앞**으로 이동 + 로드맵 섹션 추가 → 최종 순서 **판정 요약 → 기관별 상세 → 실행 로드맵 → 준비 서류 → 지원사업 매칭**
- `sec-gov` 자체는 이동하지 않아 **경영진단 경로 섹션 순서 불변**(정책자금 4섹션은 general 모드에서 `display:none`)
- `renderFundingRoadmap(state, roadmap)` — `'loading'` / `'error'` / `'done'` 3상태
- `buildNav` funding 분기에 로드맵 링크 추가, `FUNDING_ONLY_SECTIONS`·`allSecIds` 확장

### ⑤ `exceptionBy` 배지화 (1차 보완)
- ⚠ **정정**: `exceptionBy`는 이미 `.fa-exception` 초록 한 줄로 **렌더링되고 있었다.** "계산은 되지만 표시되지 않는다"는 전제는 사실이 아니었음 → 실제 작업은 위치·형태 변경
- `_kosmesEligibility`에 **`exceptionLabel`** 추가 (배지용 짧은 라벨). `exceptionBy` 전문은 유지 — 프롬프트·로그에서 정확한 표현이 필요
  | `exceptionBy` | `exceptionLabel` |
  |---|---|
  | `제조업 영위` / `제조업 영위 예외 (업종 기준)` | `제조업 예외` |
  | `(예비)사회적기업·협동조합·마을기업·소셜벤처 예외` | `사회적경제 예외` |
- 기관명 옆 배지로 `"제조업 예외로 대상 포함"` 표시. **정보성이므로 파랑 계열**(`.fv-exception`)로 verdict 배지와 시각적 위계 구분, `title` 속성에 전문 노출
- 기존 `.fa-exception` 줄 제거

### ⑥ 실패 처리 — 이번 작업의 핵심
1. `validate(5)` → `collect()` → **판정 화면 먼저 렌더링**(AI 응답을 기다리지 않음) → `show('dashboard')`
2. 그 다음 `_loadFundingRoadmap(data)` 호출, 로드맵 섹션은 로딩 스피너
3. 성공 → `renderFundingRoadmap('done', roadmap)`
4. **실패 → 로드맵 섹션에만** "AI 실행 로드맵 생성에 실패했습니다. 위 판정 결과는 정상적으로 확인하실 수 있습니다." + **[다시 시도]** 버튼(`App.retryFundingRoadmap()` — AI만 재호출, 판정 재계산 없음)
- **가짜 데이터(fakeAnalysis 계열)를 사용하지 않는다.** 전체 화면이 에러로 대체되지 않는다

### ⑦ 검증 (Node, fetch 스텁)
| 항목 | 결과 |
|---|---|
| 섹션 DOM 순서 | 정책자금 4섹션이 `sec-gov` 앞 ✓ / 전부 기본 숨김 ✓ / **경영진단 경로 15섹션 순서 불변** ✓ |
| `exceptionLabel` 3종 | 제조업 응답·사회적경제 인증·업종 기준 전부 정확 매핑 ✓ |
| 엔드포인트 | `/api/claude-analyze-funding` ✓ |
| JSON 파싱 | 코드펜스 + trailing comma 응답도 파싱 ✓ |
| userPrompt | 판정 findings·재판정 금지·GovSupport 블록·부채비율·규모 전부 포함 ✓ / **업종 = "외식 및 휴게음식업"(한국어)** ✓ |
| systemPrompt | 제약 5종 문구 전부 포함 ✓ |
| API 실패 | `throw` 전파 확인 → 호출부에서 로드맵 섹션만 error 처리 ✓ |

### ⑧ 캐시버스팅
`index.html` 로컬 `?v=` 47곳 전부 `20260802a`

---

## 최근 수정 이력 (2026-08-02) — 정책자금 진단 5단계 1차: 전용 결과 화면

**판정 결과를 화면에 출력.** AI 프롬프트(B)는 화면 검증 후 2차로 분리 진행.
`clear` 항목을 접힘 상태로 함께 표시해 남은 과제 수를 명확히 한다.

### ① `_INCLUDE_CLEAR_FINDINGS = true` 전환 + clear 문구 8건
- **전환 이유**: 빨간 경고만 잔뜩 보이면 사용자가 "나는 안 되나 보다" 하고 포기한다. 통과 항목을 함께 보여주면 남은 과제가 몇 개인지 명확해져 행동으로 이어진다
- **판정 로직 영향 없음(사전 확인 완료)**: `_verdictOf()`는 `some(blocked)`/`some(conditional||unknown)` 기반, `blockedCount` 등은 status 필터, `unknownItems`는 unknown만 수집 → 전부 무영향. 유일한 변화는 `findings` 배열에 clear 항목이 추가되는 것
- `message.clear`가 없던 8개 규칙에 문구 추가. **작성 원칙: 사용자 응답을 그대로 확인해주는 형태**
  - 좋은 예 `'국세·지방세 체납이 없다고 응답하셨습니다.'` / 나쁜 예 `'체납 사실이 확인되지 않았습니다.'`(앱이 조회한 것처럼 읽힘)
  - clear여도 `source`·`sourceUrl`은 동일하게 표시
- 휴폐업 규칙 2건의 `severity`에 `clear → 'low'` 분기 추가 (통과 항목이 노란 막대로 보이던 문제)

### ② `kind: 'verdict' | 'reference'` 필드 도입
- `semas_closure_history`만 `'reference'`. **통과/결격 집계에서 제외** — 결격 판정 항목이 아닌 참고 항목이 섞이면 "점검 N개"의 의미가 흐려진다
- 화면에서는 기관 카드 하단 **"참고 사항"** 영역으로 분리 표시
- 결과: 소진공 findings 7건 = **점검 6건(verdict) + 참고 1건(reference)**

### ③ `[앱에서 자동 판정 불가]` 표기 + severity `low` 고정
- 대상 3개: `semas_industry` · `kosmes_industry` · `kosmes_debt_ratio` (구조상 절대 `clear`를 반환하지 않는 규칙)
- 사용자가 "왜 항상 확인 필요지?"라고 느끼는 원인은 **앱이 판정을 못 하는 항목과 실제로 문제가 있는 항목이 구분되지 않아서**다 → 메시지 문두에 명시
- 실제 결격 가능성이 아니라 확인 안내이므로 `severity: 'low'` **고정** (`restrictedBiz === 'yes'`여도 low 유지 — 이전에는 high로 올렸음)

### ④ 화면 — 전용 3섹션 + sec-gov 재사용
- `index.html`: `#sec-funding-summary` · `#sec-funding-agency` · `#sec-funding-docs` 추가 (기본 `display:none`)
- `buildNav(isMicro, isFunding)`: **세 번째 분기만 추가**, 기존 micro/sme 삼항 미변경. funding은 4링크(판정 요약·기관별 상세·준비 서류·지원사업 매칭)
- **`Dashboard.renderFunding(fd)` 별도 진입점 신설** — `render(data, fd, isDemo)`는 첫 인자로 AI 결과를 기대하므로 재사용하지 않는다. 억지 재사용으로 경영진단 경로를 깨뜨리지 않기 위함
- `render()`에 정책자금 3섹션을 항상 숨기는 코드 추가 (funding → general 재진입 시 잔상 방지)
- `initScrollReveal()`의 `allSecIds`에 3섹션 추가 (display 필터가 있어 general 모드 무영향)
- **판정 요약**: 한 줄 헤드라인(신청 가능/어려움/해당 없음) + 기관별 `점검 6개 · 통과 5 · 확인 필요 1` **분모 명시** + `unknownItems` 강조 박스
- **기관별 상세**: verdict 배지(결격/확인 필요/결격 없음/대상 아님 + "확인 시 대상 가능"), severity별 좌측 색 막대(high 빨강·medium 노랑·low 회색), **항목마다 근거 `source`+`sourceUrl` 표시(필수)**, `remedy` 별도 줄, clear는 `<details>` 접힘("통과한 항목 N개 보기"), reference는 "참고 사항" 영역
  - `eligible: false`면 `notEligibleReason`만 표시하고 findings 미렌더
  - 카드 하단 제도상 한도 안내 — **구체 금액 수치 없음**, 기관 URL 링크
- **준비 서류**: 기관 공통 6종 + 응답 기반 추가(체납 yes → 징수유예 서류 / certs 보유 → 인증서 강조 / isManufacturing yes → 공장등록증) + 하단 고지

### ⑤ 버튼 연결
`App.checkFundingInput()` → `validate(5)` → `collect()` → **`Dashboard.renderFunding(data)` + `show('dashboard')`**.
정책자금은 진단 점수·레이더차트가 없으므로 **diag-reveal을 거치지 않는다.** `fundingVerdict`가 없으면 alert 후 중단(가짜 데이터 미사용).

### ⑥ 검증 (Node)
| 항목 | 결과 |
|---|---|
| 소진공 집계 | findings 7건 = verdict 6 + reference 1 → "점검 6개 · 통과 5 · 확인 필요 1" ✓ |
| 빈 메시지 전수 검사 | micro/sme × none/yes/unknown 전 조합 → **빈 메시지 0건** ✓ |
| 자동 판정 불가 3규칙 | 전부 `severity: low` + 메시지 문두에 표기 ✓ |
| `restrictedBiz: 'yes'` | `semas_industry`·`kosmes_industry` 여전히 `low` 고정 ✓ |
| verdict·카운트 회귀 | clear 포함 전후 `verdict`/`blockedCount`/`unknownItems`/`recommendedOrder` 전부 동일 ✓ |

### ⑦ 캐시버스팅
`index.html` 로컬 `?v=` 47곳 전부 `20260801d`

### 2차 예정 (B — AI 실행 로드맵)
- `ai-engine.js`에 `d.purpose === 'funding'` 전용 프롬프트 분기 (단일 호출, 3분할 API 미사용)
- 출력: `situation` / `priority[]` / `prepare90[]` / `cautions[]`
- 시스템 프롬프트 제약: 단정 표현 금지, 예상 승인액·금리 제시 금지, 판정에 없는 결격 사유 생성 금지, unknownItems는 "확인 필요"로만 언급, 지원 한도 금액 언급 금지
- **AI 실패 시 판정 결과는 정상 표시하고 AI 섹션만 생략** + "AI 실행 로드맵 생성에 실패했습니다. 판정 결과는 아래에서 확인하실 수 있습니다. [다시 시도]"

---

## 최근 수정 이력 (2026-08-01) — 정책자금 진단 2단계-보완: step5 정밀 입력 필드 추가

**데이터로 확정 가능한 항목을 '확인 필요(conditional)'로 넘기지 않는다.**
4단계 FundingRules 구현 결과 데이터 부족으로 확정 판정이 불가능했던 3건을, 사용자에게 직접 물어 확정 판정으로 전환.
`employees` 구간 문자열의 5인/10인 경계 문제와 `fashion`·`agri_food`의 제조업 판별 모호성을 사용자 직접 응답으로 해소.

### ① index.html — step5 최상단에 '🧭 기본 정보 확인' 섹션 신설 (전부 선택 입력)
- **업종 확인·수정**: `#fundIndustryDetected`(AI 판별 결과 한국어 표시) + `#fundIndustryOverride` select
  - **19개 라벨** 전부 제공 (`INDUSTRY_MAP` 기본 17개 + 사회적기업·소셜벤처). `'소셜벤쳐'` 오타 alias만 제외
  - 사회적기업·협동조합·소셜벤처는 **중진공 융자제한 9호 예외와 직결**되므로 선택지에서 빠지면 예외 적용 기회를 놓친다 → hint로 명시
- **`fundEmployeeCount`**: 상시근로자 수 숫자 직접 입력. **`0`은 유효값(대표자 1인 사업장), 미입력은 `null`** — 반드시 구분
- **`fundIsManufacturing`**: 제조·가공 공정 직접 영위 여부 (`yes`/`no`/`unknown`)
- **`fundCurrentStatus`**: 현재 정상 영업 여부 (`active`/`closed`/`unknown`)
- 기존 `fundClosureHist`는 **삭제하지 않고** 라벨을 "(참고용)"으로 변경 + "현재 상태는 '기본 정보 확인' 응답이 판정에 사용됩니다" 안내 추가
- ⚠ step1의 `employees`(구간 문자열)는 **미변경** — 경영진단 경로가 계속 사용

### ② wizard.js
- `INDUSTRY_LABEL_BY_KEY` — `INDUSTRY_MAP` 역매핑 (먼저 등록된 라벨 우선 → alias 자동 제외)
- `updateFundIndustryDisplay()` — `goStep(5)` 진입 시 호출. `aiIndustryKey`가 비면 "업종이 판별되지 않았습니다. 직접 선택해 주세요."
- `collect().fundingData` += `employeeCount`(number|null) · `isManufacturing` · `currentStatus`
- **`industryKey` override**: `_purpose === 'funding'` 일 때만 `fundIndustryOverride` 우선 적용. **경영진단 경로 업종 판별에는 영향 없음**
- 신규 3필드는 전부 선택 입력 — `validate(5)` 필수 검사(결격요건 7문항)는 그대로

### ③ funding-rules.js — 3개 규칙을 확정 판정으로 전환
- **`semas_scale`**: `employeeCount`가 숫자면 **확정 판정**(`clear`/`blocked`), 없으면 기존 구간 문자열 로직으로 fallback
  - 기준: 제조·건설·운수·광업 10인 미만 / 그 외 5인 미만 (`_semasLimit()`)
  - 메시지에 "직전 사업연도 평균 인원 기준이며, 신청 시점 4대보험 가입자 수도 함께 검토됩니다" 참고 문구 병기
- **`_kosmesEligibility`**: 판정 우선순위 재정렬
  1. `isManufacturing === 'yes'` → **industryKey와 무관하게** `eligible: true` (`exceptionBy: '제조업 영위'`)
  2. 사회적경제 인증 → `eligible: true`
  3. `isManufacturing === 'no'` → 제조업 예외 미적용. `industryKey`가 제조업이면 "업종은 제조업으로 판별되었으나 직접 영위하지 않는다고 응답 — 응답이 정확한지 확인" 덧붙임
  4. `'unknown'` → 기존 업종 기반 로직 (`mfg_parts`·`food_mfg` eligible / `fashion`·`agri_food` uncertain)
- **`semas_closure`·`kosmes_closure`**: 판정 기준을 `closureHist`(과거 이력) → **`currentStatus`(현재 상태)** 로 변경
  - `closed` → `blocked`/`high` / `active` → `clear` / `unknown` → `unknown`
- **`semas_closure_history` 신설** (소진공에만 1건): 과거 이력을 `conditional`/**`severity: 'low'`** 참고 항목으로 분리
  - 중진공은 소상공인이면 대부분 not_eligible로 걸러져 findings가 비므로, 참고 항목만 덩그러니 붙으면 혼란 → 소진공에만 배치
- **`_INCLUDE_CLEAR_FINDINGS = false`** 상수 도입: `clear` 항목은 현재 findings에서 제외하되, **각 규칙의 `message.clear`/`detail(clear)` 문자열은 미리 작성해 둠** → 5단계에서 상수만 `true`로 바꾸면 "요건 충족" 표시가 바로 동작

### ④ 검증 (Node 스모크 — 5개 지정 케이스 + 회귀 4건 전부 통과)
| 케이스 | 결과 |
|---|---|
| restaurant / 4명 / active | `semas_scale` **clear**, `semas_closure` **clear** ✓ |
| restaurant / **5명** | `semas_scale` **blocked/high** ("5명으로 5인 미만 초과") ✓ |
| mfg_parts / 8명 | `semas_scale` **clear** (제조업 10인 미만 기준) ✓ |
| fashion / `isManufacturing:'yes'` | 중진공 **`eligible: true`**, `exceptionBy: '제조업 영위'` ✓ |
| restaurant / `employeeCount: null` | 구간 fallback → **conditional/low** ✓ |
| `employeeCount: 0` | clear (0과 null 구분 확인) ✓ |
| `closed` + `closureHist:'yes'` | `semas_closure` blocked/high + `semas_closure_history` conditional/low 공존 ✓ |
| mfg_parts / `isManufacturing:'no'` | not_eligible + 업종-응답 충돌 안내 문구 출력 ✓ |

### ⑤ 캐시버스팅
`index.html` 로컬 `?v=` 47곳 전부 `20260801c`

---

## 최근 수정 이력 (2026-08-01) — 정책자금 진단 4단계: FundingRules 모듈 신설 (기관 선별 + 결격 판정)

`js/diagnosis/funding-rules.js` 신설. **기관 선별(소진공·중진공) 후 기관별 결격 판정.**
판정은 `blocked` / `conditional` / `clear` / `unknown` **4상태**이며 **`unknown`을 `clear`로 처리하지 않는다.**
근거: 소진공 `ols.semas.or.kr` 지원 제외업종 표, 중진공 2026 융자제한기업 15개 항목.
**대시보드 출력·AI 프롬프트는 5단계이므로 미구현.** 신보·기보는 범위 밖.

### ① 모듈 구조 (cross-context.js와 동일한 IIFE + 듀얼 익스포트)
- `AGENCIES` — semas(소진공) / kosmes(중진공) 2곳
- `EXCLUDED_INDUSTRIES_SEMAS` — 소진공 제외업종 38항목 `{ code, name, exceptions[] }`
- `INDUSTRY_WATCH` — industryKey → 해당 업종에서 확인이 필요한 제외업종 코드
- `RULES` — 소진공 6개 + 중진공 8개 규칙
- `evaluate(fundingData, context)` → `{ agencies[], unknownItems[], recommendedOrder[] }`
- `window.FundingRules` + `module.exports` 듀얼 익스포트 (Node 스모크 테스트 가능)

### ② ⚠ industryKey로 제외업종을 자동 판정하지 않는다
BizNavi의 `industryKey`(16종)는 **표준산업분류 코드가 아니다.** 제외업종 표는 자동 결격 판정에 쓰지 않고
`semas_industry`·`kosmes_industry` 규칙에서 **항상 `conditional`** 을 반환하며 "확인 필요" 안내 + 예외 조항 제시용으로만 사용한다.
`_watchText()`가 업종별 주의 항목과 예외를 함께 출력한다 (예: 안마시술소 → 시각장애인 운영 안마원은 예외).

### ③ 소진공 규모 요건 — 구간 문자열의 경계값 문제
`employees`는 숫자가 아니라 **구간 문자열**(`'1~5명'`, `'6~10명'` …)이라 5인/10인 경계를 확정할 수 없다.
- `'1~5명'` → `conditional` + **severity `low`** ("정확히 5인이면 제외되므로 확인 필요" — 확인 요청 수준의 문구, 경고성 표현 없음)
- `'6~10명'` → 제조·건설·운수·광업(`mfg_parts`·`food_mfg`·`construction`·`logistics`)이면 `conditional`, 그 외 `blocked`
- `'11~50명'` 이상 → `blocked` (severity `high`) / 값 없음 → `unknown`
- `findings`에 **`severity: 'high'|'medium'|'low'`** 필드 추가 — 5단계 화면에서 표시 강도 구분용

### ④ 중진공 기관 자격 게이트 (융자제한 9호) — `eligible` + `eligibilityUncertain` 2단 구분
소상공인은 원칙 제외. 예외 인정 범위를 **보수적으로** 잡았다.
- `certs`에 (예비)사회적기업·협동조합·마을기업·소셜벤처 판별기업 중 하나 → `eligible: true`
- `mfg_parts`·`food_mfg`만 '제조업 영위' 예외 인정 → `eligible: true`
- `fashion`·`agri_food`는 제조 영위 여부가 모호 → `eligible: false, eligibilityUncertain: **true**` + "제조 공정을 직접 영위하면 예외 대상일 수 있음"
- 그 외 소상공인 → `eligible: false, eligibilityUncertain: false`
- 모든 not_eligible 사유 끝에 공통 문구: "혁신성장·초격차·신산업 분야 영위 기업, 소상공인 유예기업도 예외 대상이므로 해당 여부를 중진공에 확인할 것"
- **`eligibilityUncertain: true`여도 중진공 개별 규칙은 평가하지 않는다** — 자격 미확정 상태에서 부채비율 경고를 띄우는 것은 오진

### ⑤ 단정 금지 원칙이 규칙에 박혀 있는 지점
- `kosmes_marginal`(11호): 수집 데이터로 **'2년 연속 적자'·'3년 연속 이자보상배율'을 알 수 없으므로 절대 `blocked`로 단정하지 않고 `conditional`**. 자본잠식 단독·영업적자 단독도 각각 `conditional`
- `kosmes_debt_ratio`(10호): **별표5의 업종별 수치가 앱에 없으므로 임의 기준을 만들지 않는다.** 산출된 부채비율만 표시하고 대조는 중진공 공고로 넘김. `foundedYear`가 있으면 업력을 계산해 "업력 7년 미만 적용 예외" 안내에 반영(자동 적용은 하지 않음)
- `semas_tax_arrears`: 체납이어도 `blocked`가 아니라 `conditional` (국세징수법 압류·매각 유예 등 예외 조항 존재). 반면 `kosmes_tax_arrears`는 예외 조항이 없어 `blocked`
- `semas_closure`·`kosmes_closure`: 현행 문항이 '최근 5년 내 이력'을 묻고 있어 **현재 상태와 다르므로** `blocked` 처리하지 않음
- `verdict`: blocked 1개 이상 → `blocked` / conditional·unknown 있으면 → `review` / 전부 clear → `clear`

### ⑥ 연결
- `index.html` — `js/diagnosis/funding-rules.js?v=20260801b` 추가 (cross-context.js 다음)
- `wizard.js collect()` — `_purpose === 'funding'` 일 때만 `data.fundingVerdict = FundingRules.evaluate(...)`. `typeof FundingRules === 'undefined'` + try/catch 이중 방어
- `App.checkFundingInput()` — `console.log(fundingData / fundingVerdict)` + `alert('판정 완료. 결과 화면은 5단계에서 구현 예정입니다.')`

### ⑦ 검증 (Node 스모크 테스트 4케이스 — 전부 기대와 일치)
| 케이스 | 결과 |
|---|---|
| restaurant/micro/1~5명/체납 yes | 소진공 `review`(체납 `conditional` + 예외 안내) / 중진공 `eligible:false, uncertain:false` ✓ |
| restaurant/micro/`certs:['협동조합·마을기업']` | 중진공 **`eligible: true`** (`exceptionBy` 표시) ✓ |
| fashion/micro/인증 없음 | 중진공 `eligible:false` + **`uncertain: true`** ✓ |
| mfg_parts/sme/11~50명/전부 unknown/자본 250억 | 소진공 `blocked`(규모, severity high) / 중진공 `kosmes_prime` **`blocked`**(200억 초과) / `unknownItems` 10건 수집 ✓ |
| `evaluate(undefined, undefined)` | 예외 없이 agencies 2건 반환, unknownItems 12건 ✓ |

### 개선 대기 항목
- **`employees`가 구간 문자열이라 소상공인 5인/10인 경계를 확정할 수 없다. 정책자금 경로에서는 정확한 상시근로자 수를 숫자로 입력받는 필드 추가 검토.**
- `recommendedOrder`는 `eligible` 기관만 담되 `verdict: 'blocked'` 기관도 포함된다(순위만 뒤로). 5단계 화면에서 blocked 기관을 어떻게 표시할지 판단 필요
- `unknownItems`는 label 기준 dedup이라 소진공·중진공의 동일 쟁점이 각각 별도 항목으로 잡힌다(라벨이 다르기 때문)

---

## 최근 수정 이력 (2026-08-01) — 정책자금 진단 3단계: 정부지원사업 데이터 소스 3중 중복 정리

### ① 정부지원사업 데이터 소스를 `js/gov-support.js` 단일 마스터로 통합
- 기존: `api/bizinfo.js` FALLBACK_PROGRAMS 10개 + `js/gov-support.js` PROGRAMS 26개가 **7개 중복**, 금액 필드명도 불일치(`amount` vs `support`)
- 중복 7건: 창업도약패키지·중소기업 정책자금·수출 바우처·R&D 과제·스마트 제조혁신·온라인 판로·고용창출 장려금
- **고유 3건만 gov-support.js에 병합** (`soho_smart` 소상공인 스마트화 / `soho_consulting` 소상공인 경영컨설팅 / `untact_voucher` 비대면 서비스 바우처) → PROGRAMS 26 → **29개**

### ② 구체 금액·마감일 표기 전면 제거 — `support` → `supportType`
- **매년 바뀌는 수치를 하드코딩하면 그 자체가 오정보다.** 앱은 '어떤 사업이 맞는지'만 판별하고 구체 수치는 주관기관 공고로 넘긴다
- 29개 전 항목 `support` → `supportType`으로 필드명 변경 + 금액·비율 삭제
  - `'최대 1억원 (정부 50% 매칭)'` → `'설비 도입비 매칭 지원'`
  - `'최대 3,000만원 바우처'` → `'바우처 형태 지원'`
  - `'무료 (전문가 5~10회 파견)'` → `'전문가 파견 컨설팅'`
- `period`는 병합 3건에만 `'수시'`/`'정기 공고'` 수준으로 부여 (기존 26개는 period 필드 자체가 없었음)
- `GovSupport.DISCLAIMER` 상수 export — **섹션 상단 1회 + AI 프롬프트 1회만** 표시 (카드마다 반복은 노이즈)
  - 문구가 **상시 지원사업 전용**임이 드러나게 작성. 실시간 공고 영역에는 붙이지 않는다
- `buildPromptBlock()`에 "구체적인 금액·비율·마감일을 지어내지 말 것" 지침 추가
- 소비처 수정: `dashboard.js:339` `💰 ${p.support}` → `🎁 ${p.supportType}`

### ③ ⚠ `#industry` select 제거 이후 GovSupport 업종 매칭이 항상 실패하던 문제 수정
- `#industry` select 제거(2026-04-17) 이후 **`collect()`의 `d.industry`는 항상 빈 문자열**
- `GovSupport.match()`가 `d.industry`만 읽어 업종 점수(+2)가 `'all'` 태그 사업에만 부여됨
  → **HACCP·외식업 스마트화·스마트 건설 등 업종 특화 사업이 아무에게도 매칭되지 않고 있었다** (기능이 죽어 있던 상태)
- **수정**: `INDUSTRY_LABEL` 역매핑(영문 키 → 한국어 라벨) 추가 후 `d.industry || INDUSTRY_LABEL[d.industryKey] || ''` 로 읽음
  - 역매핑 19개 키는 `wizard.js INDUSTRY_MAP`을 그대로 반전한 값. 대조 결과 **불일치·누락 0건** (gov-support가 쓰는 라벨 12개 + `all` 전부 INDUSTRY_MAP에 존재)
  - PROGRAMS의 `industry` 태그(한국어)는 미변경 — 최소 변경 원칙
- `industryKey`도 비어 있으면 **업종 필터를 적용하지 않고 전 항목에 동점 부여** (빈 결과 방지)

### ④ step4 govSupport 체크박스 → 매칭 필터 연결 (`getInterestTags` 재작성)
- 기존은 **if/else 조기 return 체인**이라 복수 선택 시 첫 카테고리만 반영됐고, 체크박스 6개 중 **'창업·성장 지원'·'정책 자금 융자' 2개는 매핑이 아예 없어 `[]` 반환**. 코드의 `'전반'` 분기는 어떤 체크박스에도 없는 사문화 값
- **수정**: `Set` 누적 방식으로 재작성, 배열·문자열 입력 모두 허용
  - `'창업'|'성장'` → `fund`,`marketing` / `'정책 자금'|'정책자금'|'융자'` → `fund` 추가, `'전반'` 분기 제거
- 미선택 시 `[]` 반환 → 관심분야 필터 미적용(전체 반환)은 현행 유지

### ⑤ `api/bizinfo.js` — 실시간 조회 전용으로 축소
- `FALLBACK_PROGRAMS`(10개) + `scoreProgram()` 삭제
- 키 없음 → `{ ok: false, reason: 'no_api_key', programs: [] }` / 조회 실패·0건 → `{ ok: false, reason: 'api_error', programs: [] }`
- 성공 시 `{ ok: true, status: 'api', programs, total }`
- **실시간 API가 안 되는데 오래된 하드코딩 데이터를 실시간인 것처럼 보여주지 않는다** (fakeAnalysis와 동일한 문제)
- 실시간 공고의 `amount`(`item.sprtLmt`)는 **조회 시점 기관 공고값이므로 유지** — 하드코딩 수치와 성격이 다름

### ⑥ `js/app.js` — 소스 전환
- `GovSupport.match(data)`를 **먼저 확보**(항상 동작하는 기반) → `data.govPrograms` / `window._govPrograms`
- `/api/bizinfo` 병행 호출, `ok === true` 일 때만 `data.bizinfoPrograms` 주입. `ok:false`·예외는 **조용히 생략**(사용자에게 에러 미노출)
- `typeof GovSupport === 'undefined'` 및 `try/catch` 이중 방어

### ⑦ `#drBizinfoBox` 재사용 — 새 섹션 신설 없이 박스가 사라지지 않게
- 실시간 있으면 `실시간` 배지, 없으면 `GovSupport.match()` 결과를 `상시 지원사업 · 공고 확인 필요` 배지로 표시 + DISCLAIMER
- 기존 카드 마크업 재사용을 위해 `supportType` → `amount` 슬롯에 정규화 (금액이 아니라 **지원 형태**가 들어감 — 주석 명기)
- fallback 삭제로 박스가 통째로 사라지던 회귀를 방지

### ⑧ 검증 (Node 스모크 테스트)
| 항목 | 결과 |
|---|---|
| 업종 역매핑 (restaurant + 디지털 관심) | '외식업 스마트화 지원사업'이 매칭 결과에 등장 ✓ (수정 전에는 불가능) |
| 업종 정보 전무 | 결과 6건 — 빈 배열 안 됨 ✓ |
| 복수 선택 (디지털+수출) | 스마트공장 7점 / 수출 바우처·KOTRA 6점 — 양쪽 태그 모두 반영 ✓ |
| '창업·성장 지원' | 창업도약패키지·정책자금·컨설팅 등 6건이 관심분야 가점(3점) 획득 ✓ |
| '정책 자금 융자' | 정책자금 융자·소상공인 정책자금 등 4건 가점 ✓ |
| 금액 표기 잔존 | `supportType` 내 억원·만원·% 표기 **0건** / 남은 `support:` 필드 **0건** ✓ |
| 병합 3건 | 3개 모두 존재, 실매칭 결과에도 등장 ✓ |

### ⑨ 캐시버스팅
`index.html` 로컬 `?v=` 46곳 전부 `20260731d` → 이후 ⑩ 수정으로 `20260801a`

### ⑩ `match()` 업종 점수 차등화 (배포 완료) — 후속 수정
- **문제**: 업종 점수가 `정확 매칭 == 범용('all') == +2`로 동일해서, 외식업으로 진단해도 '외식업 스마트화 지원사업'(6점)과 범용 사업들(6점)이 **동점**이 되고 `slice(0, 6)`에서 **배열 앞쪽의 범용 사업만 남아** 업종 특화 사업이 노출되지 않았다. 실제 화면에서 6개 전부 범용 사업이었음
  - ③에서 역매핑으로 업종 값을 살렸지만, 점수 배분이 평평해 **효과가 화면에 드러나지 않던 상태**
- **수정**: 정확 매칭 **+3** / 범용 `'all'` **+1** / 불일치 **0** 으로 차등화
  - 업종 미상(`industry === ''`)이면 기존대로 전 항목 동점(**+1**) → 특정 사업 탈락 방지
- **동점 정렬 보완**: `점수 내림차순 → 업종 정확 매칭 우선(_industryExact) → 이름 순(localeCompare 'ko')`
  → **PROGRAMS 배열 선언 순서에 결과가 좌우되지 않는다**
- PROGRAMS의 `industry` 태그 자체는 미변경
- **검증**

  | 케이스 | 결과 |
  |---|---|
  | `restaurant` / micro / 디지털 | 상위 4개가 전부 업종 정확 매칭. **외식업 스마트화 3위(7점)** ✓ (수정 전 미노출) |
  | `food_mfg` / micro / 관심분야 미선택 | 상위 6개 전부 업종 정확 매칭. **식품 HACCP 4위(4점)** ✓ |
  | 업종 미상 | 6건 반환, 빈 배열 아님 ✓ |
  | `mfg_parts` / sme / 디지털+수출 | 스마트공장 8점 1위, 상위 5개가 업종 정확 매칭 ✓ |

### 남은 과제
- `#drBizinfoBox`의 `.bizinfo-amount` 슬롯이 상시 사업에서는 '지원 형태'를 담는 의미 불일치 — 클래스 분리는 4~5단계 대시보드 작업 시 정리
- `ai-engine.js` 섹션11은 실시간 공고만 참조. 실시간이 없으면 `(지원사업 데이터 없음 — 웹 검색으로 보완)`이 출력되지만, `GovSupport.buildPromptBlock()`이 별도 섹션으로 이미 주입하므로 프롬프트 정보 손실은 없음

---

## 최근 수정 이력 (2026-07-31) — 정책자금 진단 2단계: step5 진단 문항 13개 구성

1단계에서 만든 `step5` 스켈레톤에 문항을 채웠다. **판정 로직·트랙 라우팅·대시보드·AI 프롬프트는 4~5단계로 미구현.**

### ① index.html — step5 문항 3섹션
- 카드 상단 안내문(결격 사유 반려 경고 + 미저장 고지 + "모르면 '모름' 선택") 추가
- **섹션1 결격 요건 7문항 (필수)** — 전부 3지선다 라디오 `해당 없음 / 해당됨 / 모름`
  `fundTaxArrears` `fundCapitalImpair` `fundCreditIssue` `fundClosureHist` `fundRestrictedBiz` `fundPriorSupport` `fundOverdue`
  - **id는 감싸는 `.form-group`에, `name`은 라디오 그룹에** 부여 (라디오 3개에 같은 id를 줄 수 없으므로) → validate 실패 시 id로 스크롤·하이라이트
  - value를 `none`/`yes`/`unknown` 영문으로 직접 지정해 collect() 정규화를 불필요하게 함
- **섹션2 보유 자산 2문항 (선택)** — 체크박스 복수선택 `fundCerts`(12개) / `fundIP`(6개), 기존 `.gov-check-group`·`.gov-check-item`·`.gov-check-label` 재사용
- **섹션3 재무 정보 4문항 (선택)** — `fundAssetTotal` `fundDebtTotal` `fundEquityTotal` `fundOpProfit` (`type="number"`, 단위 백만원, required 없음)
  - `#fundDebtRatio` 표시 전용 div 신설 — 부채·자본 모두 입력 시 부채비율 실시간 표시
- 버튼 → `App.checkFundingInput()` (runAnalysis 미연결)
- **연매출은 step1 `#revenue`를 재사용**하고 step5에 중복 생성하지 않음

### ② js/wizard.js — fundingData / validate(5) / 인터랙션
- `collect()` 리터럴 안에 **`fundingData` 하위 객체** 추가. **미입력을 기본값으로 채우지 않는 것이 핵심 원칙**:
  | 구분 | 미응답 | 명시적 응답 |
  |---|---|---|
  | 라디오 7개 | `'unknown'` (절대 `'none'` 아님) | `'none'` / `'yes'` / `'unknown'` |
  | 체크박스 2개 | `[]` (응답하지 않음) | `['해당 없음']` (명시적 미보유) |
  | 숫자 4개 | `null` | `0`도 유효값 (0 ≠ null) |
  - `debtRatio`: 부채·자본 모두 있고 자본 > 0일 때만 숫자, 그 외 `null`
  - `revenue`: step1 원문 문자열 그대로, 빈 값이면 `null`. **파싱·정규화하지 않음**
- `_fundNum(id)` / `_fundDebtRatio(debt, equity)` / `_onFundCheckToggle()` / `updateFundDebtRatio()` 헬퍼 + `FUND_ELIG_ITEMS` 상수 추가
- **`validate(5)` 신설** — 결격요건 7문항 선택 여부만 검사('모름'도 정상 입력). 미선택 시 `.fund-invalid` 하이라이트 + 첫 항목으로 `scrollIntoView` + 누락 항목명 나열 alert
- **'해당 없음' 배타 처리** — '해당 없음' 체크 시 같은 그룹 전부 해제, 다른 항목 체크 시 '해당 없음' 해제. `fundCerts`·`fundIP` 양쪽 적용
  - 모순 입력(`['벤처기업','해당 없음']`)을 입력 단계에서 차단해 4단계 판정 로직의 예외 처리 부담을 없앰
- 이벤트는 **HTML `oninput` 속성이 아니라 `DOMContentLoaded` 리스너로 등록** (2026-06-05 c317c03 캐시 문제 재발 방지)

### ③ js/app.js — `checkFundingInput()` 신설 (export 포함)
`validate(5)` → `console.table(collect().fundingData)` → alert. **의도적으로 `runAnalysis()` 미연결** (빈 진단점수로 Claude API 호출 시 토큰만 소모)

### ④ css/style.css — 신규 클래스 5개, 파일 끝에 추가만
`.fund-radio-row` `.fund-radio-opt` `.fund-ratio-box` `.form-group.fund-invalid` + 모바일 1열 미디어쿼리. **기존 선택자 미변경**

### ⑤ 검증 (Node DOM 스텁)
| 시나리오 | 결과 |
|---|---|
| 미입력 상태 | 라디오 7개 전부 `unknown`, `certs`/`ip` `[]`, 숫자 4개 `null`, `validate(5)` false |
| 결격 7선택 + 부채700·자본500 | `debtRatio: 140`, `opProfit: -80`, `revenue: '3억'`(원문), `validate(5)` true |
| 자본 -100 / 0 | `debtRatio: null`, 표시 "자본잠식 상태로 부채비율 산출 불가" |
| 영업이익 0 입력 | `opProfit: 0` 유지 (미입력 `null`과 구분됨) |
| 결격 2개 누락 | `validate(5)` false + 누락 항목명 나열 alert |
| '해당 없음' 배타 | 일반 2개 → '해당 없음' 체크 시 2개 해제 / 일반 재체크 시 '해당 없음' 해제 ✓ |

### ⑥ 캐시버스팅
`index.html` 로컬 `?v=` **46곳 전부 `20260731c`** (외부 CDN 제외)

---

## 최근 수정 이력 (2026-07-31) — collect() 조기 return으로 진단 데이터가 AI에 미전달되던 버그 수정 ⚠ 중대

정책자금 진단 2단계 작업 중 발견. **CROSS_RULES 33개 + micro/sme 규모별 진단 결과가 AI 분석에 전혀 반영되지 않고 있었음.**

### ① 근본 원인 — `collect()` 조기 return
- `js/wizard.js collect()`가 `return { … };` 로 **객체 리터럴을 즉시 반환**하고 종료
- 그 뒤 53줄(`scaleScores` 계산 / `microWarnings`·`microPrompt` / `smeWarnings`·`smePrompt` / `CrossContext` 블록 / `return data;`)은 **도달 불가(unreachable)** 였고, `data` 변수는 선언조차 없어 도달해도 ReferenceError
- 결과: `ai-engine.js:1286~1292`가 참조하는 `d.microPrompt` / `d.smePrompt` / `d.crossPrompt` 가 **항상 undefined** → 프롬프트에 아무것도 주입되지 않음
- **수정**: `return {` → `const data = {` 로 변경, 맨 끝 `return data;` 가 최종 반환이 되도록 복구

### ② `collectAllScores()` 신설 — DOM 수집 금지
- 죽은 코드가 호출하던 `collectAllScores`는 **저장소 어디에도 존재하지 않는 미선언 식별자**였음
  (`collectAllScores ? … : {}` 는 undefined 체크가 아니라 **ReferenceError를 던짐** — 살리는 순간 collect() 전체가 예외로 중단됐을 것)
- ⚠ **진단 점수는 DOM이 아니라 `diagScores` 객체에만 존재한다.** `setScore()`가 `diagScores[key] = {score, memo}` 로만 저장하고, `type="hidden"` 입력은 하나도 만들지 않는다
- 따라서 기존 CrossContext 블록의 `document.querySelectorAll('[id^="diag-"]')` 수집은 **항상 빈 객체 `{}`** 를 반환했음 (`diag-item-*`·컨테이너는 div라 `.value`가 없음) → 이 방식도 함께 폐기
- 신설 `collectAllScores()`: `diagScores` → `{ 'diag-micro-container_1_3': 3, … }` **평면 숫자 맵** 반환 (0점·미입력 제외)
  - `DiagMicro.calcScores` / `DiagSme.calcScores` / `CrossContext.buildScoreMap`(`Number(val)`) 모두 평면 숫자를 기대하므로 `{score,memo}` 객체를 넘기면 NaN으로 전부 탈락함
- micro / sme / CrossContext **세 곳이 이 함수를 공유**. CrossContext는 BM 프록시 주입으로 맵을 변형하므로 `Object.assign({}, allScores)` 사본(`crossScores`)을 사용

### ③ 빈 스코어의 실제 증상 — 허위 발동이 아니라 '전면 무력화' (기록 정확성 중요)
`cross-context.js:600`의 룰 평가부가
```js
return score !== null && score <= trigger.threshold;
```
이므로 **키가 없으면 `null` → 조건 자체가 false → 규칙이 아예 발동하지 않는다.**
빈 스코어가 CRITICAL 경고를 무더기로 **허위 발동시키는 것이 아니라**, CROSS_RULES 전체가 조용히 무력화되는 것이 정확한 증상이다. (초기 진단 중 "허위 발동" 추정이 있었으나 사실이 아님 — 잘못된 원인을 기록하면 나중에 오판을 부르므로 명시해 둠)

### ④ `bizScale` 후반부 덮어쓰기 삭제 — 2026-05-15 버그 재발 방지
- 죽은 코드에 `const bizScale = g('bizScale') || g('bizScaleSelect') || 'micro';` 재계산 + `data.bizScale = bizScale;` 덮어쓰기가 있었음
- 리터럴 내부 계산은 explicit 없을 때 `employees`로 추론(`'1~5명'`·공백 → micro, **그 외 sme**)하는데, 후반부는 **무조건 `'micro'`** → 직원 6명 이상 기업이 micro로 오분류
- 이는 CLAUDE.md 2026-05-15 ①에서 고친 *"bizScale 미추론 → micro 모드 출력 → keyStrategies 누락"* 버그의 **정확한 재발**
- **수정**: 후반부 재계산·덮어쓰기 2줄 모두 삭제, `const bizScale = data.bizScale || 'micro'` 로 리터럴 계산값을 그대로 사용

### ⑤ DiagSme는 현재 비활성 — 별도 작업 필요
- `diagnosis-sme.js`는 `scores['diag-sme-container_*']` 키를 기대하지만, **`diag-sme-container`는 diagnosis-sme.js 안에만 존재**하고 index.html·`loadDiagnosisUI()` 어디에서도 렌더링되지 않음
- 그대로 살리면 `smePrompt`가 **전 항목 0점("0점 (위험)")** 인 허위 요약이 되므로 가드 적용:
  ```js
  else if (bizScale === 'sme' && window.DiagSme &&
           Object.keys(allScores).some(k => k.startsWith('diag-sme-container_')))
  ```
- **미해결 과제**: `diag-sme-container` 렌더링 연결 (별도 작업으로 분리)

### ⑥ 검증 (Node DOM 스텁 스모크 테스트)
micro 35문항을 동일 점수로 채워 `Wizard.collect()` 실행:

| 입력 | scaleScores.total | microPrompt | crossPrompt | microWarnings | crossWarnings |
|---|---|---|---|---|---|
| 전 항목 3점 | 60 | 353자 | 생성됨 | 0 | 0 |
| 전 항목 1점 | 20 | 1794자 | 생성됨 | 6 | 12 |

점수에 따라 경고 수가 실제로 변동 → 파이프라인 정상 연결 확인 (수정 전에는 전부 undefined)

### ⑦ 캐시버스팅 일괄 갱신
- `index.html`의 로컬 `?v=` **46곳 전부 `20260731b`로 통일** (외부 CDN 제외)
- 참고: `js/gov-support.js`·`js/industry-trends.js`·`js/diagnosis/cross-context.js`·`js/diagnosis/diagnosis-micro.js`·`js/diagnosis/diagnosis-sme.js`·`js/diagnosis/startup.js`·`js/ticker.js` 7개는 **`?v=` 자체가 없음** — 이 파일들을 수정할 때는 `?v=`를 새로 붙여야 캐시가 갱신됨

### 검증 방법 (배포 후 브라우저 콘솔 — 소상공인 모드로 진단 완료 상태)
```js
const d = Wizard.collect();
console.log({ bizScale: d.bizScale, hasScaleScores: !!d.scaleScores,
              hasMicroPrompt: !!d.microPrompt, hasCrossPrompt: !!d.crossPrompt,
              warnCount: (d.crossWarnings||[]).length });
console.log(d.crossPrompt);
```

---

## 최근 수정 이력 (2026-07-30) — 정책자금 진단 1단계: 진입점·purpose 플래그·step5 스켈레톤 추가

세 번째 진입 경로(재무분석 / 경영전략 진단 / **정책자금 진단**) 중 정책자금 진단의 **뼈대만** 구축.
문항·판정 로직·대시보드 섹션·AI 프롬프트는 이번 단계에서 **의도적으로 미구현**.

### ① js/wizard.js — purpose 플래그 + step5 라우팅
- 모듈 스코프 `let _purpose = 'general';` 추가 (`'general'` | `'funding'`)
- `setPurpose(p)` / `getPurpose()` 추가 → `return { ... }` export 목록에 등록
- `reset()`: `_purpose = 'general'` 초기화 + 숨김 배열에 `'step5'` 추가
- `collect()`: 반환 객체 최상단에 `purpose: _purpose || 'general'` 필드 추가
- `goStep(n)`: 진입부에 `if (_purpose === 'funding' && n === 2) n = 5;` — step2·3·4를 건너뛰고 step5로 리다이렉트 (`loadDiagnosisUI()` 미호출)
- `updateStepUI(n)`: `_restoreStepIndicator()` 헬퍼 신설 → **목적과 무관하게 먼저 general 기준(3단계)으로 무조건 원복**한 뒤, `_purpose === 'funding'`일 때만 2단계 표시로 덮어씀
  - funding: `l2` → '정책자금 진단', `c3`의 부모 `.step-ind`·`ln2` → `display:none`, `n===5`를 2번째 인디케이터 active로 매핑, 진행률 `n===1?50:100`
  - general: 기존 루프(`i<=4`) + `33/66/100` **완전 무수정** (시각 동작 100% 동일)

### ② js/app.js — 진입점
- `startFundingDiagnosis()` 신설: `Wizard.reset()` → `Wizard.setPurpose('funding')` → `Wizard.goStep(1)`(인디케이터 재도색) → `show('wizard')`
  - `reset()`이 `_purpose='general'`로 초기화하므로 **setPurpose는 반드시 reset 이후** 호출해야 함
- `startDiagnosis()`: biz-context 숨긴 직후 `Wizard.getPurpose() === 'funding'`이면 `Wizard.goStep(5)` 후 early return — `loadDiagnosisUI`·`updateRiskPlaceholder`·`goToStep2FromBm` 미실행. general 경로는 기존 코드 그대로
- `return { ... }` export 목록에 `startFundingDiagnosis` 추가

### ③ index.html
- `step4` 다음에 `<div id="step5" class="wiz-card hidden">` 신설 — 제목 + "2단계에서 문항 추가 예정" + `← 이전`(`App.backToStep1()`) + `분석 시작 → (준비중)`(alert placeholder)
  - **`App.runAnalysis()`에 연결하지 않음** — `validate(4)`(problems·goals)를 통과시키면 빈 diagScores로 실제 Claude API가 호출되어 토큰만 소모됨
- 히어로 CTA(74~78줄)에 `💰 정책자금 진단 시작하기` 버튼 1개 추가 (155·354줄 랜딩 영역은 미접촉)

### 핵심 제약 (id 명명 규칙)
`goStep(n)`은 `document.getElementById('step' + n)`으로 화면을 찾으므로 **새 단계 id는 숫자 형식 필수** → `step-funding`이 아니라 `step5`

### 1단계 알려진 한계 (2단계에서 처리)
- step5의 `← 이전`은 `App.backToStep1()` → `Wizard.reset()`을 호출하므로 **`_purpose`가 `'general'`로 리셋**됨. 정책자금 진단으로 되돌아오려면 랜딩 버튼을 다시 눌러야 함
- `updateStepUI()` general 분기의 `i<=4` 루프·`ln3` 참조는 DOM에 `c4`·`ln3`이 없어 죽은 코드지만, 기존 동작 보존 최우선으로 **의도적으로 미정리**

---

## 최근 수정 이력 (2026-06-04~05) — 업종별 placeholder 동적 업데이트 + inferIndustryFromType 버그 수정

### ① 업종별 주요제품·핵심강점·고객문제 placeholder 동적 업데이트 (배포 완료) — 커밋 6c42f25
- `_BIZ_PLACEHOLDERS`: 16개 업종 × 3개 필드(products·coreStrength·customerProblem) 예시 맵 추가
- `updateBizPlaceholders(industryKey)`: 업종 추론 완료 시 해당 업종 맞춤 예시로 placeholder 즉시 교체
- `onIndustryChange()`: `updateBizPlaceholders` + `updateRiskPlaceholder` 함께 호출

### ② inferIndustryFromType 연쇄 버그 수정 4건 (배포 완료) — 커밋 ba37c3e~c317c03
- **1차** (ba37c3e): `id="industry"` SELECT 미존재로 early return — `industrySelect` 의존 제거, `aiIndustryKey` 직접 세팅
- **2차** (6827fb5): `id="bizInferResult"` 미존재로 early return — `resultEl` optional 처리
- **3차** (20c897a): OCR 자동입력 후 `inferIndustryFromType()` 미호출 — `handleOcrUpload()` fill 완료 후 명시적 호출 추가
- **4차** (c4248a0): `BIZ_TYPE_MAP.industry`가 한국어 레이블(`'외식 및 휴게음식업'`)인데 `_BIZ_PLACEHOLDERS` 키는 영문(`restaurant`) — `INDUSTRY_MAP[topIndustry]`로 변환 후 호출
- **5차** (c317c03): HTML `oninput` 캐시 문제 + `!elProducts.value` 가드 차단 — `DOMContentLoaded`에서 직접 이벤트 리스너 등록, 가드 제거하여 항상 갱신

### 핵심 동작 흐름 (완성)
```
업태/종목 입력(직접·OCR) → inferIndustryFromType()
  → BIZ_TYPE_MAP 키워드 스코어링
  → topIndustry(한국어) → INDUSTRY_MAP → topKey(영문)
  → aiIndustryKey 저장
  → updateBizPlaceholders(topKey) → 3개 필드 placeholder 교체
  → updateRiskPlaceholder(topKey) → 외부리스크 예시 교체
```

---

## 업종별 맞춤 진단 v2.0 완성 (2026-05-27)

### 업종 그룹 5개
- food: 외식업 (기본값)
- beauty: 미용·뷰티
- retail: 소매·판매
- edu_service: 서비스·학원
- pro_service: 전문서비스

### 완료 작업
1차: 질문 텍스트·용어 치환 (D2_5·D3_2 완전 교체 포함)
2차: BARS 1~5점 척도 + ai_trigger 경고 메시지 업종별 분기
3차·4차: D1~D4·D7 7일 액션 플랜 업종별 분기 (총 140개)

### 불변 항목
- D5·D6 전체 (자금·세무·폐업 — 업종 무관 공통)
- food 그룹 기존 텍스트 100% 유지
- 키값 D1_1~D7_5 변경 없음

### 핵심 함수
- DiagMicro.getSchema(industryGroup)
- DiagMicro.getActionPlan(domainKey, industryGroup)
- DiagMicro.buildPromptSummary(allScores, industryGroup)

---

## 최근 수정 이력 (2026-05-27) — 소상공인 진단 업종 그룹별 용어 치환 + BARS scale 업종 분기

### ① /fix-js-edit 스킬 신규 생성 (배포 완료) — 커밋 37278a2
- `.claude/commands/fix-js-edit.md` 신규: JS 파일 편집 반복 실패(old_string not found) 진단·수정 스킬
- 증상별 원인: Read 미실행 / anchor 불일치(공백·한글 인코딩) / 중복 문자열
- 대형 파일 패턴: Grep → offset Read → Edit (wizard.js·ai-engine.js 2000줄+)
- `fix-ai-error.md`, `fix-pdf.md`에서 `/fix-micro`와 중복된 CDN TTFB·PDF 공란 섹션 제거

### ② diagnosis-micro.js 업종 그룹별 용어 치환 맵 (1차 — label·question) (배포 완료) — 커밋 d590d60
- `INDUSTRY_GROUP_MAP`: 16개 업종 키 → 5그룹 매핑 (food/beauty/retail/edu_service/pro_service)
- `GROUP_LABELS`: 그룹별 한국어 레이블
- `INDUSTRY_WORDING`: 4그룹 × ~14항목 label·question 오버라이드
  - food-전용 항목 완전 교체: `2_5` (Work Triangle → 그룹별 작업 동선), `3_2` (밀키트 → 그룹별 패키지)
  - D5·D6 절대 미접촉
- `getGroup(industryKey)`, `getSchema(industryGroup)` API 추가
- `buildPromptSummary()`: `[업종 그룹]` 라인 AI 프롬프트 주입

### ③ wizard.js micro 진단 업종 그룹 연동 (배포 완료) — 커밋 27a2b3b
- `loadDiagnosisUI()`: `DiagMicro.getGroup(industryKey)` → `_diagMicroToAreas(DiagMicro, microGroup)` 전달
- `_diagMicroToAreas(diagMicro, industryGroup)`: 파라미터 추가 → `getSchema(industryGroup)` 호출
- `collect()`: `DiagMicro.getGroup(data.industryKey)` → `buildPromptSummary(allScores, microGroup)` 전달

### ④ diagnosis-micro.js BARS scale 1~5 + ai_trigger warning_msg 업종별 분기 (배포 완료) — 커밋 6014eee
- **적용 항목**: 4그룹 × 3항목 = scale 12개 배열 / 4그룹 × 2항목 = warning_msg 8개
  - `1_3` (Prime Cost): beauty·retail·edu_service·pro_service 각 scale 5단계 + warning_msg
  - `1_4` (ACM): beauty·retail·edu_service·pro_service 각 scale 5단계 + warning_msg
  - `2_4` (편차 통제): beauty·retail·edu_service·pro_service 각 scale 5단계
- **getSchema() deep-merge**: `ai_trigger` 오버라이드 시 기존 `threshold·warning` 보존, `warning_msg` 추가
  - `merged.ai_trigger = Object.assign({}, ITEMS[key].ai_trigger, overrides[key].ai_trigger)`
- food 그룹 기존 텍스트 100% 유지, D5·D6 미접촉

### ⑤ diagnosis-micro.js ACTION_PLAN_7DAY 업종 그룹별 분기 3차 (배포 완료) — 커밋 120be37
- `ACTION_PLAN_7DAY_BY_GROUP` 상수 추가: 2개 도메인 × 4그룹 × 7일 = 56개 액션 항목
  - `profit_ops` (D1 경영진단): beauty·retail·edu_service·pro_service 각 7일 플랜
  - `place_seo` (D2 점포환경): beauty·retail·edu_service·pro_service 각 7일 플랜
- `DOMAIN_TO_ACTION_KEY`: 도메인 ID `'1'`→`profit_ops`, `'2'`→`place_seo` 매핑
- `getActionPlan(domainKey, industryGroup)`: 그룹별 플랜 반환, 없으면 `null` (food → base fallback)
- `buildPromptSummary()` 수정: 취약 도메인 D1·D2는 그룹 전용 7일 플랜, D3~D7은 `ACTION_PLAN_7DAY` 단일 액션 fallback
- food 그룹 `ACTION_PLAN_7DAY` 100% 유지, D5·D6 미접촉

### ⑥ diagnosis-micro.js ACTION_PLAN_7DAY D3·D4·D7 업종 그룹별 분기 4차 (배포 완료) — 커밋 c85f4a3
- `ACTION_PLAN_7DAY_BY_GROUP`에 3개 도메인 추가: 3개 도메인 × 4그룹 × 7일 = 84개 액션 항목
  - `multichannel` (D3 다채널 판로): beauty·retail·edu_service·pro_service 각 7일 플랜
  - `smart_dx` (D4 스마트DX): beauty·retail·edu_service·pro_service 각 7일 플랜
  - `sns_ai` (D7 SNS·생성형AI): beauty·retail·edu_service·pro_service 각 7일 플랜
- `DOMAIN_TO_ACTION_KEY` 확장: `'3'`→`multichannel`, `'4'`→`smart_dx`, `'7'`→`sns_ai` 추가
- D1~D4·D7 총 5개 도메인 × 4그룹 × 7일 = 140개 그룹별 액션 플랜 완성
- food 그룹 `ACTION_PLAN_7DAY` 100% 유지, D5·D6 미접촉

---

## 최근 수정 이력 (2026-05-26) — micro 역량 프로파일 D1~D7 교체 + Failed to fetch 근본 수정

### ① 3차-micro 504 타임아웃 수정 (배포 완료) — 커밋 105aa7f
- **원인**: `claude-analyze-3.js` maxDuration=60초, D5~D7+plan90days 스트리밍이 60초 초과
- **수정**: `vercel.json` claude-analyze-3.js maxDuration 60 → 300
- **수정**: `claude-analyze-3.js` MAX_TOKENS 16000 → 8000 (이후 다시 16000으로 상향)

### ② micro 대시보드 신규 섹션 추가 (배포 완료) — 커밋 5fb2459
- `sec-lifecycle` (생애주기 진단 — 창업기/생존기/성장기/성숙기/전환기 시각화) 추가
- `sec-market-micro` (상권 STP + TAM/SAM/SOM 3카드) 추가
- `buildNav(isMicro)` micro 전용 7링크로 교체
- `sec-six-systems` micro에서 "7대 영역 처방 (D1~D7)"으로 제목 동적 변경
- `sec-lean-canvas` micro에서 smeOnly에 포함 (leanCanvas 미생성)
- CSS: lifecycle-stage-banner/steps + tsm-grid (TAM=골드·SAM=블루·SOM=그린) 추가

### ③ micro 역량 프로파일 D1~D7 레이더차트 교체 (배포 완료) — 커밋 dadad52
- `MICRO_DOMAIN_EXPLAIN`: D1~D7 해설 카드 7개 추가
- `_calcMicroDomainScores()`: `diag-micro-container_X_Y` 키 파싱 → D1~D7 점수 계산
- `showDiagReveal()`: `isMicro` 분기 추가
  - micro: 7개 축 레이더차트 + D1~D7 점수 바 + "소상공인 7대 영역 진단" 고정
  - SME: 기존 5대 역량 도메인 유지

### ④ claude-analyze-3.js MAX_TOKENS 8000 → 16000 (배포 완료) — 커밋 5885672
- 소상공인 내용 대폭 수정 시 D5~D7+plan90days JSON 절단 방지

### ⑤ micro 스트리밍 CDN TTFB 타임아웃 방지 — Failed to fetch 근본 수정 (배포 완료) — 커밋 b681af2
- **근본 원인**: Claude SSE 누적(60~120초) 동안 브라우저에 아무것도 안 보내다가 한꺼번에 응답 → Cloudflare CDN이 TTFB 기준으로 연결 끊음 → "Failed to fetch"
- Vercel 로그에서는 1~3차 모두 성공으로 표시되지만 응답이 클라이언트에 미전달
- **수정**: `claudeRes.ok` 확인 직후 `res.writeHead(200, {'Content-Type':'application/json'})` 즉시 전송
- 이후 SSE 누적 완료 시 `res.end(JSON.stringify({text: fullText}))` 전송
- `claude-analyze-1.js` / `claude-analyze-2.js` / `claude-analyze-3.js` 모두 적용

---

## 최근 수정 이력 (2026-05-25) — micro 전 구간 스트리밍 전환 + SYSTEM 지침 경량화

### ① micro 1차 스트리밍 전환 (배포 완료) — 커밋 c18d83d
- **원인**: max_tokens=2000으로도 SYSTEM의 executiveSummary 5-label 지침만으로 토큰이 부족 → max_tokens 초과 반복
- **수정**: `claude-analyze-1.js` micro 분기(`noSearch=true`) → `stream:true`, max_tokens:16000, SSE 청크 누적 방식으로 전환
- 스트리밍 경로: `response.body.getReader()` + `TextDecoder` → `content_block_delta.text_delta` 누적 → 완성 후 반환

### ② micro 2차·3차도 동일 스트리밍 전환 (배포 완료) — 커밋 08e9baa
- `claude-analyze-2.js`: `noSearch=true` 분기에 스트리밍 추가 (micro 전용 라우팅 신호로 재활용)
- `claude-analyze-3.js`: micro 전용 함수이므로 항상 스트리밍, max_tokens:16000
- `ai-engine.js`: `_opts2: { noSearch: true }` (streaming 트리거), 3차 opts `{}` (서버에서 항상 스트리밍)

### ③ SYSTEM 상수 micro 1차 과잉 생성 유발 지침 제거 (배포 완료) — 커밋 22ff99e
- **원인**: 스트리밍 16000으로도 `stop_reason=max_tokens, output_tokens=16000` → SYSTEM에 sixSystems·plan90days JSON 템플릿이 있어 Claude가 1차에서도 전부 생성
- **제거 항목 3개**:
  - `[인과사슬 3축 진단]` 블록 17줄 — executiveSummary·SWOT 상세 서술 강제
  - `[executiveSummary 출력 포맷 지침]` 12줄 — 5-label 구조 강제
  - `sixSystems` 7항목 + `plan90days` 3항목 JSON 템플릿 — 1차 호출인데도 생성 유도
- `[사업 규모별 모드 분기]` micro 7단계 상세 설명 → 1줄 요약으로 축소
- `buildPrompt1()` micro 분기 맨 앞에 강제 규칙 추가:
  `[1차 호출 절대 규칙] 너는 지금 1차 호출이다. 아래 7개 필드만 JSON으로 출력하고 절대 다른 내용을 추가하지 마라: executiveSummary, lifecycleStage, swot, stp, tam, sam, som`

---

## 최근 수정 이력 (2026-05-24) — micro 3차 구조 재설계 + 1차 JSON 절단 수정 완결

### ⑥ micro 1차 SWOT/STP 키 불일치 수정 (배포 완료) — 커밋 c38cc6a
- **원인**: 1차 JSON 템플릿이 `S/W/O/T` 키, `segment` 키를 사용했으나 dashboard.js는 `strengths/weaknesses/opportunities/threats`, `segmentation` 키를 기대함 → 대시보드 SWOT·STP 렌더링 공백
- **수정**: `buildPrompt1()` micro 분기 JSON 예시 → `strengths/weaknesses/opportunities/threats` + `segmentation`
- **수정**: `_buildPrompt2Micro()` SWOT 참조 → `r1.swot.S[0]` → `r1.swot.strengths[0]` / `r1.swot.W[0]` → `r1.swot.weaknesses[0]`

### ⑤ micro 1차 JSON 절단 수정 (배포 완료) — 커밋 3b6e4be
- **원인**: 1차가 executiveSummary·SWOT(6개씩)·STP·fourP·keyStrategies·specializedAnalysis 전부 요청 → 3000 토큰 초과로 JSON 중간 절단
- **수정**: 1차 출력을 7개 최소 필드만으로 축소 (executiveSummary 3줄, lifecycleStage 1줄, swot 각 1개, stp 1줄씩, tam/sam/som)
- **수정**: `claude-analyze-1.js` `MAX_TOKENS_MICRO` 8000 → 2000
- **수정**: keyStrategies·fourP·specializedAnalysis 전부 2차로 이동

### ④ micro 모드 3차 호출 구조 재설계 (배포 완료) — 커밋 99f824c
- `api/claude-analyze-3.js` 신규: D5~D7 처방 + plan90days (maxDuration:60)
- `vercel.json`: claude-analyze-3.js 등록 (icn1, 60초)
- `_SYSTEM_EXEC_MICRO_2` → D1~D4+KPI+로드맵+전략, `_SYSTEM_EXEC_MICRO_3` → D5~D7+plan90days
- `callClaude()`: micro 3차 호출 + mergedSixSystems(D1~D4+D5~D7) 7개 병합

---

## 최근 수정 이력 (2026-05-24) — micro 모드 504 타임아웃 수정 + 3차 호출 재설계 (이전 기록)

### ① micro 모드 1차 호출 504 타임아웃 근본 수정 (배포 완료) — 커밋 a46eab4
- **원인**: `claude-analyze-1`의 `web_search` tool_use → 검색 → pause_turn/continue 루프 3턴 × ~100초 = 300초 초과
- **수정**: `noSearch: true` 파라미터 → micro 1차에서 web_search 완전 비활성화 → 단일 Anthropic 턴으로 완료
- `api/claude-analyze-1.js`: `noSearch`/`maxTokens` 파라미터 수신 구조 추가
- `ai-engine.js callClaude()`: micro 1차 `{ noSearch: true, maxTokens: 8000 }` 전달

### ② micro 모드 3차 호출 구조 재설계 (배포 완료) — 커밋 99f824c
- **설계**: 1차(전략) + 2차(D1~D4+KPI+로드맵) + 3차(D5~D7+plan90days) 3분할
- `api/claude-analyze-3.js` 신규: micro 전용 3차 함수 (maxDuration:60, max_tokens:4000)
- `vercel.json`: `claude-analyze-3.js` 등록 (icn1, 60초)
- `ai-engine.js`:
  - `_SYSTEM_EXEC_MICRO` → `_SYSTEM_EXEC_MICRO_2`(D1~D4+KPI+로드맵) + `_SYSTEM_EXEC_MICRO_3`(D5~D7+plan90days) 분리
  - `_buildPrompt2Micro()`: D1~D4 집중 프롬프트로 교체
  - `_buildPrompt3Micro()` 신규: D5~D7 처방 + 90일 캘린더 + govSupport
  - `apiCall()`: `'3차'` → `/api/claude-analyze-3` 엔드포인트 추가
  - `callClaude()`: micro 3차 호출 추가 + `mergedSixSystems = [...D1~D4, ...D5~D7]` 7개 병합
  - micro 1차 maxTokens: 8000 → 3000 (응답 시간 단축)
- `wizard.js animateLoading(isMicro)`: micro 모드 로딩 레이블 4단계 동적 변경
  - `생애주기·전략 분석 (1차)` → `D1~D4 경영진단 처방 (2차)` → `D5~D7·정부지원 처방 (3차)` → `보고서 통합 완성 중`
- `app.js`: `animateLoading(data.bizScale === 'micro')` 전달

---

## 최근 수정 이력 (2026-05-23) — 소상공인 전용 AI 7단계 프롬프트 교체

### ① ai-engine.js 소상공인 전용 AI 2차 프롬프트 7단계 구조 (배포 완료) — 커밋 fc09ceb
- `_SYSTEM_EXEC_MICRO` 신규: 소상공인 2차 시스템 프롬프트 (leanCanvas 생략, D1~D7 7항목)
  - `lifecycleStage` + `kpi` + `roadmap(3단계)` + `sixSystems(D1~D7)` + `plan90days` 5개 필드
  - 각 D영역별 action은 무료·저비용 도구 + 소상공인진흥공단 지원사업 중심
- `buildPrompt1` 소상공인 모드 1차 추가 지침: `lifecycleStage` 필드, STP 포지셔닝 맵, executiveSummary 레이블
- `_buildPrompt2Micro()` 신규: 소상공인 전용 2차 사용자 프롬프트
  - D1~D7 처방 지침, 90일 액션 무료도구 우선, govSupport 소상공인진흥공단·지자체 포함
- `buildPrompt2`: micro 시 `_buildPrompt2Micro()` 분기
- `callClaude`: `bizScale === 'micro'` 시 `_SYSTEM_EXEC_MICRO` 사용 (기존 `_SYSTEM_EXEC` 대체)

---

## 최근 수정 이력 (2026-05-22) — 소상공인 7대 영역 진단 v2.0 완성

### ① diagnosis-micro.js 7대 영역 35항목 전면 교체 (배포 완료) — 커밋 ba7d54b
- 기존 3영역 15항목 → 7대 영역 35항목 전면 재설계
- D1 경영진단·손익분석 / D2 점포환경·PLACE SEO / D3 다채널 판로
  D4 스마트DX / D5 운영자금·ESG보증 / D6 사업정리·폐업세무 / D7 SNS·생성형AI
- 출처: knowledge_base/소상공인_오퍼레이션_고도화_및_디지털_전환_DX_을_위한_7대.txt
- 5점 BARS 척도 + ai_trigger + ACTION_PLAN_7DAY 7일 린 액션 연결

### ② cross-context.js 소상공인 교차 트리거 13개 추가 (배포 완료) — 커밋 a533921
- CRITICAL 5개: 프라임코스트+ACM, 계좌혼용+현금위기, BEP미관리, 외식+플레이스, 생활서비스+리뷰
- HIGH 6개: 프랜차이즈+OHI+D2C, DX+오너의존, 디지털고립, 노동법+세무, DX투자낭비, 조리편차+PrimeCost
- MEDIUM 2개: ACM+AI마케팅, 패키징+단일채널
- bizScale 필터 + diag-micro-container_ 키 패턴 추가

### ③ wizard.js bizScale 주입 패치 (배포 완료) — 커밋 dc4e92e
- CrossContext 호출 시 bizScale 4번째 인수로 전달
- detectCrossWarnings(): rule.bizScale 불일치 규칙 skip → micro 규칙 오발동 방지

### ④ CrossContext micro 추가 규칙 4개 (배포 완료) — 커밋 a533921
- HIGH: micro_dx_investment_wasted (DX ROI없음+데이터미활용), micro_ops_margin_collapse (테이블회전율+PrimeCost)
- MEDIUM: micro_acm_marketing_mismatch (ACM분류+AI콘텐츠), micro_packaging_channel_gap (패키징+단일채널)
- 총 CROSS_RULES: 34개, micro 규칙 13개

### ⑤ DiagMicro 7대 분야 진단 탭 렌더링 연결 (배포 완료, 테스트 완료) — 커밋 720b3de
- index.html: diagTab-common 안에 diag-micro-container 추가 (hidden 기본)
- wizard.js loadDiagnosisUI(): bizScale 감지 → isMicro=true 시 diag-micro-container 렌더, diag-common-container 숨김
- wizard.js _diagMicroToAreas(): DiagMicro.getSchema() → renderDiagModule 호환 포맷 변환
- 탭 레이블 → '🏪 소상공인 7대 분야 (35문항)', score key = diag-micro-container_X_Y → calcScores() 정상 연동

---

## 최근 수정 이력 (2026-05-19 오후) — XBRL 재무분석 개선 4건

### ① XBRL 계정명 매칭 강화 + 분기보고서 rcept_no 수정 (배포 완료) — 커밋 f8d498f
- `_parseXbrl()` 계정명 후보 추가: `Cash`, `FinishedGoods`, `Merchandise`, `BorrowingsFromFinancialInstitutions`, `LongTermBorrowings`, `CostOfRevenues`
- `_supplementWithXbrl()` 분기/반기 키워드 분기 추가 — 기존에 항상 `사업보고서` rcept_no만 사용하던 버그 수정
- 분기: `분기보고서` 키워드로 해당 연도 제출 파일 우선 탐색, 없으면 `사업보고서` fallback

### ② XBRL 파일명 기준 연도 자동 보정 (배포 완료) — 커밋 255087a
- 근본 원인: 분기→사업보고서 fallback 시 `_parseXbrl(xml, 2026)` 호출하지만 실제 XBRL은 `entity_2025-12-31.xbrl` → 연도 불일치 → 전부 null
- 수정: `xbrlEntry.entryName.match(/(\d{4})-\d{2}-\d{2}/)` 로 파일명에서 연도 추출 → `_parseXbrl(xml, xbrlYear)` 사용

### ③ 당좌자산 파생계산 + 전년도매출액 자동입력 (배포 완료) — 커밋 846473d
- 당좌자산: IFRS 기업은 별도 항목 없음 → `유동자산 - 재고자산` 파생 계산 자동 주입
- 전년도매출액: `getPrev()` 함수 추가 (`frmtrm_amount` 전용) + `prevRevenue` 필드 → `finance-wizard.js` `_setField('fin_prev_revenue')` 연결

### ④ /fix-dart 스킬 업데이트 — 커밋 ea487eb
- 오늘 발견된 4개 패턴 추가: XBRL year 불일치 / 분기 rcept_no 버그 / 당좌자산 파생 / 전년도매출액 매핑

---

## 최근 수정 이력 (2026-05-19 오전) — CrossContext 한글-영문 ID 매핑 버그 수정

### ① cross-context.js — detectCrossWarnings() ID 정규화 추가 (배포 완료)
- `data.bizModel`은 한국어 레이블(`'프랜차이즈'`)을 저장하지만 CROSS_RULES는 영문 ID(`'franchise'`) 사용 → 항상 매칭 실패하던 근본 버그 수정
- `BM_ID_MAP` (12개 BM), `INDUSTRY_ID_MAP` (16개 업종) 룩업 테이블을 `detectCrossWarnings()` 진입부에 추가
- 함수 시작에서 `industryId = INDUSTRY_ID_MAP[industryId] || industryId` 정규화 → `buildPromptSummary()`도 내부 호출이므로 자동 적용
- 커밋: `9f67067`

### ② wizard.js — CrossContext 블록 fallback 체인 확장 + BM 프록시 주입 (배포 완료)
- `industryId` 추출: `data.industryKey || data.industry || data.industryName || ''`
- `bmId` 추출: `data.bizModel || data.bm || data.bizModelName || ''`
- `TAB_ORDER = ['common', 'industry']`로 BM 탭 제거 → `diag-bm-container_*` DOM 요소 없음 → BM 트리거 키 점수 수집 불가 버그 수정
- BM 탭 없을 때 common 도메인 평균값으로 BM 프록시 주입: area1·2 → domain3(BM역량), area3 → domain2(인력운영), area4 → domain4(미래역량)
- 커밋: `9f67067`

---

## 최근 수정 이력 (2026-05-18) — BM 진단 시스템 v2.0 완성 + 렌더링 버그 수정

### ① 나머지 BM 진단 파일 9개 v2.0 전면 교체 (배포 완료)
- 교체 파일: `b2b_saas.js` · `b2c_sub.js` · `b2b_solution.js` · `b2c_commerce.js` · `platform.js` · `franchise.js` · `mfg_dist.js` · `service.js` · `etc.js`
- 신규 포맷: `BM_XXX` 변수명, 4 areas × 4 items, `scale:[{score:1~5,desc}]`, `ai_trigger`, `ai_analysis` 배열
- 커밋: `998087b`

### ② ai-engine.js BM 변수명 통일 (배포 완료)
- `bizModelVarMap` 내 `BIZMODEL_XXX` → `BM_XXX` 12개 전체 교체
- 커밋: `233726b`

### ③ wizard.js v2.0 포맷 렌더링 5개 버그 수정 (배포 완료)
- `_diagCommonToAreas()` 헬퍼 추가 — DiagCommon.getSchema() 결과를 renderDiagModule 호환 포맷으로 변환
- `loadDiagnosisUI()` — COMMON_DIAGNOSIS → DiagCommon 우선 분기 추가
- `renderDiagModule` — `data.label||data.title`, `area.label||area.title` fallback 추가
- `_renderItemHtml` — `item.question||item.label||item.text` fallback 추가
- `_scaleToAnchors()` 헬퍼 추가 — `scale:[{score,desc}]` → `anchors:{1:'...',5:'...'}` 변환
- 커밋: `04f1749`

### ④ cross-context.js v2.0 전면 교체 (배포 완료)
- CrossContext v2.0 IIFE 모듈 — 20개 CROSS_RULES (업종×BM 핵심 조합)
- CRITICAL 9개 규칙: restaurant×franchise, export_sme×usage_based, medical×advertising 등
- HIGH 11개 규칙: knowledge_it×b2b_saas, fashion×b2c_commerce, logistics×platform 등
- Public API: `detectCrossWarnings(industryId, bmId, diagScores)` · `buildPromptSummary()` · `getRulesFor()` · `getStats()`
- 커밋: `1050f44`

---

## 최근 수정 이력 (2026-05-17) — 진단 모듈 v2.0 전면 재설계

### ① 규모별 전용 진단 모듈 신규 구축 (배포 완료)
- `js/diagnosis/common.js` v2.0 전면 개편 — DiagCommon IIFE, 5 domains × 4 items, `buildPromptSummary()` 추가
- `js/diagnosis/diagnosis-micro.js` 신규 — DiagMicro IIFE, 소상공인(bizScale='micro') 전용
  - 3 도메인: 로컬SEO(0.35) · 메뉴엔지니어링(0.35) · 위임시스템(0.30)
  - ACTION_PLAN_7DAY, calcScores, detectCrossWarnings, buildPromptSummary, getSchema
- `js/diagnosis/diagnosis-sme.js` 신규 — DiagSme IIFE, 소기업(bizScale='sme') 전용
  - 4 도메인: process_cost(0.28) · backoffice_dx(0.25) · org_talent(0.22) · scaleup_radar(0.25)
  - G_1~G_6 Scale-up 6대 축 radar (S_SEO, S_AI, S_CF, S_PCR, S_SD, S_ESG)

### ② 연동 수정 3파일 (배포 완료)
- `index.html` — script 태그에 diagnosis-micro.js · diagnosis-sme.js 추가
- `wizard.js collect()` 말미 — bizScale 감지 후 DiagMicro/DiagSme 호출, `data.microPrompt`/`data.smePrompt` 주입
- `ai-engine.js buildPrompt1()` — `return \`` → `let prompt = \`` 구조 변경 후 common/micro/sme 프롬프트 append

### ③ 업종 진단 파일 v2.0 전면 교체 (배포 완료)
- 교체 파일: `logistics.js` · `energy.js` · `agri_food.js` · `export_sme.js`
- 신규 포맷: top-level `label/icon/description` + 4 areas × 4 items + `ai_analysis` 배열
- `scale:[{score:1~5, desc}]` 구조, `ai_trigger:{threshold, warning}` 항목별 AI 경보 설계
- `window.INDUSTRY_XXX` + `module.exports` 듀얼 익스포트

### ④ BM 진단 파일 v2.0 전면 교체 (배포 완료)
- 교체 파일: `usage_based.js` · `advertising.js` · `deeptech.js`
- 변수명 `BIZMODEL_XXX` → `BM_XXX` 통일, 신규 포맷 동일 적용
  - `BM_USAGE_BASED`: 종량제 (과금 설계·사용자 확장·Margin·이탈관리 4영역)
  - `BM_ADVERTISING`: 광고 기반 (오디언스·인벤토리·광고주·UX균형 4영역)
  - `BM_DEEPTECH`: 딥테크·바이오 (IP·R&D·자금조달·사업화 4영역)

---

## 다음 세션 예정 작업

### 1순위: 소상공인 AI 분석 end-to-end 실전 테스트 (⚠ 테스트 대기 중)
- biznavi.vercel.app에서 소상공인 모드로 실제 분석 1회 실행
- 1차: 7개 필드만 응답 확인 (executiveSummary·lifecycleStage·swot·stp·tam·sam·som), max_tokens 초과 없어야 함
- 2차: keyStrategies·fourP·D1~D4 + KPI(5개) + 로드맵(3단계) 정상 출력 확인
- 3차: D5~D7 + plan90days(3개월, govSupport 포함) 정상 출력 확인
- 대시보드: renderSixSystems 7항목(D1~D7) 카드 정상 표시 확인
- SWOT strengths/weaknesses/opportunities/threats 렌더링 확인
- 로딩 스텝 레이블 micro 4단계 정상 표시 확인

### 2순위: reference-db.js 데이터 업그레이드
- `knowledge_base/industry_full_benchmarks.csv` 기준 수치 갱신
- `small_biz_cost_guide.csv` 소상공인 비용 구조 프롬프트 반영

### 3순위: 진단 시스템 end-to-end 실전 테스트
- biznavi.vercel.app에서 업종×BM 조합 3종 이상 실제 진단 실행
- v2.0 렌더링(scale → BARS) 정상 출력, cross-context 경보 카드 표시 확인

---

## 최근 수정 이력 (2026-05-15) — DART 분기보고서 탐색 + 대시보드 버그 수정

### ① 핵심전략 섹션 누락 버그 수정 (배포 완료)
- **원인**: `bizScale` 숨김 input이 OCR 콜백에서만 세팅 → 일반 입력 시 항상 `''` → AI 프롬프트에 `bizScale: '미입력'` 전달 → micro 모드 출력(sixSystems 중심), keyStrategies 누락
- **수정**: `wizard.js collect()` — `bizScale` 자동 추론 추가
  ```js
  const explicit = g('bizScale') || g('bizScaleSelect');
  if (explicit) return explicit;
  const emp = g('employees');
  return (!emp || emp === '1~5명') ? 'micro' : 'sme';
  ```

### ② BM역량 항상 빈칸 버그 수정 (배포 완료)
- **원인**: `TAB_ORDER = ['common', 'industry']`로 bizmodel 탭 제거 후 `diag-bizmodel-container_*` 키가 존재하지 않아 `domains.bm.scores = []` → 0점 표시
- **수정**: `wizard.js calcDomainScores()` — `3_2`(차별화 요소) 점수를 BM역량 proxy로 공유
  ```js
  } else if (key === 'diag-common-container_3_2' || key.startsWith('diag-common-container_5_')) {
    domains.differentiation.scores.push(s);
    domains.bm.scores.push(s); // bizmodel 탭 제거 보완
  ```

---

## 오늘 작업 (2026-07-18)

- 작업 요약:
  - `js/diagnosis/industry/social_enterprise.js` 추가 — 사회적기업 진단 모듈
  - `js/diagnosis/industry/social_venture.js` 추가 — 소셜벤처 진단 모듈
  - `js/wizard.js`에 `INDUSTRY_MAP`, `INDUSTRY_BM_MAP`, `BIZ_TYPE_MAP` 항목 및 `industryVarMap` 등록 추가
  - `index.html`에 두-컬럼 레이아웃(`aside#chatPane` / `main.wizard-content`) 및 스크립트 태그 추가
  - `css/style.css`에 채팅 패널 스타일 추가
- 배포:
  - GitHub에 커밋 및 `main` 브랜치로 푸시됨
  - Vercel로 자동 배포 트리거됨 — https://biznavi.vercel.app 에서 파일 서빙 확인됨
- 확인 방법:
  - 브라우저 DevTools Console에서 아래 한 줄 실행:
    console.log(!!window.INDUSTRY_SOCIAL_ENTERPRISE, !!window.INDUSTRY_SOCIAL_VENTURE, document.getElementById('aiIndustryKey')?.value);
- 비고:
  - 채팅은 현재 플레이스홀더이며, 백엔드 AI 연동은 별도 작업 필요


### ③ DART 최신 보고서 자동 탐색 구현 (배포 완료)
- `api/dart-lookup.js` — `REPRT_CODE_MAP` 추가, 명시적 6단계 탐색 순서로 교체
- `finData`에 `reprtCode`, `reprtName` 저장 → result 객체에 포함
- `_supplementWithXbrl()` — `reprtCode` 파라미터 추가, XBRL URL에 적용
- `js/finance-wizard.js` — DART 결과 상단에 `📋 2025년 사업보고서 기준` 초록 배지 표시
- `css/style.css` — `.dart-reprt-badge` 스타일 추가 (초록 계열)

### ④ DART 탐색 순서 재설계 (배포 완료)
- **배경**: 이전 구조는 `bsns_year=2026` 전체(8호출) 실패 후 2025 연간만 fallback → "최신 분기 우선" 의도가 이전 연도에 미적용
- **DART `bsns_year` 의미**: 보고 대상 회계연도 (제출 연도 아님) — 2026 Q1은 오늘(5/15) 마감, 나머지 2026 보고서는 미래
- **새 탐색 순서**:
  1. `bsns_year=2026, 11013` — 오늘 마감 Q1, 있으면 최신
  2. `bsns_year=2025, 11011` — 완성도 최우선 연간 (대부분 여기서 결정)
  3. `bsns_year=2025, 11014` — 3분기
  4. `bsns_year=2025, 11012` — 반기
  5. `bsns_year=2025, 11013` — 1분기
  6. `bsns_year=2024, 11011` — 최후 fallback
- **효과**: 불필요 API 호출 8개 → 최대 2개(CFS/OFS)로 감소

---

## 최근 수정 이력 (2026-05-13) — AI 버그 수정 + knowledge_base 구축

### ① AI 분석 end-to-end 버그 수정 (배포 완료)
- C-3: `api/claude-analyze-1.js` `stop_reason === 'max_tokens'` 시 500 에러 반환
- W-4: `api/claude-analyze-2.js` 동일 처리 (로그만 찍던 것 → 500 에러 반환)
- C-2: `dashboard.js:491` `(data.executiveSummary || '').replace(...)` null 가드
- W-1: `ai-engine.js:1497` `digital_strategy` 템플릿 리터럴 백틱 수정 (`'..${co}..'` → `` `..${co}..` ``)

### ② pause_turn 핸들링 추가 (배포 완료)
- `api/claude-analyze-1.js`: `stop_reason === 'pause_turn'` 시 `'continue'` 전송 후 루프 재진행
- stop_reason 처리 체계 완성: `end_turn` / `max_tokens` / `pause_turn` / `tool_use`

### ③ W-2·W-3·W-5·S-2 수정 (배포 완료)
- W-2: `js/ai-engine.js` growth/structure/innovation/cx_strategy kpi 8개 → 10개 확장
- W-3: `js/wizard.js:1079` validate(2) `|| 13` fallback 제거 + DOM 0개 시 alert 가드
- W-5: `js/wizard.js:1930` dDay 음수 → "마감" 뱃지, 0 → "D-Day" 뱃지 처리
- W-5: `css/style.css` `.bizinfo-dday.expired` 회색 뱃지 스타일 추가
- S-2: `api/claude-analyze-1.js`, `claude-analyze-2.js` `[TIMING]` console.log + `T_START` 전부 제거

### ④ knowledge_base 폴더 구축 (배포 완료)
- `knowledge_base/12개사업모델진단.pdf` — 12개 BM 진단 설계 원본
- `knowledge_base/16개업종진단.pdf` — 16개 업종 진단 설계 원본
- `knowledge_base/industry_full_benchmarks.csv` — 18개 업종 재무 벤치마크 (영업이익률·부채비율 등)
- `knowledge_base/small_biz_cost_guide.csv` — 10개 업종 소상공인 비용 구조 (임대료·인건비·원가 비중)
- CLAUDE.md 작업 규칙: "AI 진단 로직 수정 시 → knowledge_base PDF 우선 참조" 추가

---

## 최근 수정 이력 (2026-05-13 오후) — 실전 테스트 후 UI/UX 개선

### ① 대시보드 상단 헤더 가려짐 수정 (배포 완료)
- `css/dashboard.css:7` `#dashboard` `padding-top: 40px` → `80px`
- 원인: ID 선택자 특이도가 `.has-nav` 클래스 선택자보다 높아 네비(60px) 덮어쓰기 → 20px 겹침
- 수정: 네비 60px + 여백 20px = 80px 확보

### ② Executive Summary 가독성 개선 (배포 완료)
- `js/ai-engine.js` SYSTEM 프롬프트 `[executiveSummary 출력 포맷 지침]` 섹션 추가
  - 전문 경영 용어 단독 사용 금지 → 쉬운 설명으로 직접 서술
  - 5개 레이블 구조 강제: `[운영현황]` `[핵심위험]` `[차별화포인트]` `[시장기회]` `[즉시과제]`
  - 각 항목에 구체적 수치·근거 포함 의무화
- `js/dashboard.js` execSummary 렌더링에 `[레이블]` 패턴 → `.es-label` bold 강조 추가
  - `.replace(/\[([^\]]+)\]/g, '<strong class="es-label">[$1]</strong>')`
- `css/dashboard.css` `.es-label { color: var(--gold); font-weight: 700; }` 추가

---

## 다음 세션 예정 작업

### 1순위: Executive Summary 개선 결과 실전 테스트
- 5개 레이블 구조 정상 출력, 골드 bold 강조 확인

### 2순위: reference-db.js 데이터 업그레이드
- `js/reference-db.js` 벤치마크 수치를 `knowledge_base/industry_full_benchmarks.csv` 기준으로 갱신
- 소상공인 비용 구조 데이터 (`small_biz_cost_guide.csv`) 프롬프트 반영 검토

### 3순위: CORS 보안 강화
- API 키 노출 방지 추가 검토

---

## 최근 수정 이력 (2026-05-12 추가) — QA·CSS 정리

### ① print.css .rpt-cover 정리 (배포 완료)
- `break-after: page` → `break-after: avoid` (JS 주입과 일치)
- `height: 257mm; box-sizing: border-box` CSS에 명시 추가
- `print.css?v=20260506a` → `?v=20260512a` 버전 갱신

### ② --teal CSS 변수 제거 (배포 완료)
- `style.css:18` `--teal: #F5C030` 정의 삭제
- `dashboard.css` 6곳 `var(--teal)` → `var(--gold)` 치환 (시각 변화 없음 — 동일 색상)

### ③ QA CRITICAL 수정 — bizinfo industryKey 버그 (배포 완료)
- `app.js:190` `industryKey: data.industry || ''` → `data.industryKey || data.industry || ''`
- 근본 원인: `id="industry"` select 제거 후 `data.industry`가 항상 `''` → 기업마당 업종 매칭 무력화
- QA WARNING 2건(CORS 와일드카드·tool_result 빈 배열)은 즉시 수정 보류

---

## 최근 수정 이력 (2026-05-12) — 생존율 인사이트 구현 (4순위 D)

### ① INDUSTRY_CLOSURE_CAUSES 상수 추가
- 16개 업종 × 3도메인(재무·인력·BM) 폐업 원인 상수 추가
- js/ai-engine.js 또는 js/pattern-db.js에 위치

### ② _buildSurvivalInsights() 헬퍼 함수 추가 (+97줄)
- 시나리오 1·2·3·6 통합 처리
- 인사이트 예시 (외식업·창업 8년·재무 2.1점):
  - 3년 생존율 31.2% — 전체 평균(39.6%) 대비 21% 낮은 고난이도 업종
  - 업력 8년 — 5년 생존율 21% 기준 상위 생존 코호트 진입 확인
  - ⚠ 생존 역설 경고: 7년 이상 운영 + 고위험 업종 조합
  - 재무역량(2.1점) — "식재료비·임대료 현금흐름 압박" 폐업 원인과 직접 일치
  - ⚠ 긴급 생존 모드 강제 적용

### ③ 섹션13 교체 (js/ai-engine.js — buildPrompt1())
- 기존 22줄 KOSIS 블록 → _buildSurvivalInsights() 1줄 호출로 단순화
- 기존 긴급 모드 블록 내부 통합 완료

### ④ app.js
- 수정 불필요 (167줄에 data.domainScores = _domScores 이미 존재)

---

## 최근 수정 이력 (2026-05-09) — extractJSON 개선 + 스킬 시스템 구축

### ① extractJSON 4단계 파싱 + trailing comma 수리 (배포 완료)
- `repairJSON()`: Claude가 자주 생성하는 trailing comma 자동 제거
- `extractJSON()`: 직접파싱 → 수리 → 코드블록그리디 → 코드블록수리 4단계
- `claude-analyze-2.js`: stop_reason + output_tokens 로깅 추가

### ② 2차 JSON 파싱 실패 해결 (배포 완료)
- 원인: 대규모 기업(중소기업급) 분석 시 kpi+roadmap+sixSystems 합산 토큰 초과
- claude-analyze-2 max_tokens: 12000 → 16000

### ③ BizNavi 반복 오류 스킬 시스템 구축 (배포 완료)
- `.claude/commands/` 폴더 신규 생성
- 7개 스킬 파일 생성 (47개 과거 버그 패턴 수록)

| 스킬 | 대상 오류 |
|------|----------|
| `/fix-ai-error` | AI 분석 504·JSON 파싱 실패 |
| `/fix-ai-engine` | AI 엔진 로직 버그 (키 충돌·consultingType 등) |
| `/fix-wizard` | 위저드 화면전환·버튼 버그 |
| `/fix-dart` | DART 조회·재무분석 버그 |
| `/fix-pdf` | PDF 표지·출력 버그 |
| `/qa` | qa-reviewer 에이전트 검증 호출 |
| `/wrap-up` | 세션 마무리 일괄 처리 |

---

## 최근 수정 이력 (2026-05-08) — 504 타임아웃 근본 해결 + 시스템 프롬프트 QA

### ① _SYSTEM_EXEC 2차 호출 동기화 (배포 완료)
- `const _SYSTEM_EXEC` 페르소나: "맥킨지·BCG 20년" → "30년 카드/금융 경영지도사" (SYSTEM과 일치)
- `_SYSTEM_EXEC` keyMetrics 슬롯: 재방문율(인과사슬 1축)·ROAS(인과사슬 2축) 필수 포함 지시 추가
- qa-reviewer 검증 결과 WARNING 2건 수정

### ② vercel.json maxDuration 전체 정비 (배포 완료)
- `bok-avg`, `biz-lookup`, `analyze-biz`, `kosis-survival`, `bizinfo`: 기본 10초 → 30초
- `claude-analyze` 계열: Pro 플랜 확인 후 **60 → 300초**로 상향

### ③ claude-analyze 1차·2차 함수 분리 — 504 근본 해결 (배포 완료)

#### api/claude-analyze-1.js (신규)
- 1차 호출 전용: executiveSummary·SWOT·STP·4P·keyStrategies·specializedAnalysis
- web_search 1회 포함 (실시간 업종 트렌드·정부지원사업 조회)
- maxDuration: 300초, max_tokens: 16000

#### api/claude-analyze-2.js (신규)
- 2차 호출 전용: kpi·roadmap·sixSystems·plan90days·leanCanvas
- web_search 없음 (실행플랜은 1차 전략 기반 내부 생성)
- maxDuration: 300초, max_tokens: 12000

#### js/ai-engine.js
- `apiCall(_callLabel)`: `'1차'` → `/api/claude-analyze-1`, `'2차'` → `/api/claude-analyze-2`
- 각 호출 왕복 시간 `[TIMING]` 로그 추가

#### 근본 원인 요약
- 기존 `claude-analyze.js` 단일 함수에서 1차+2차 순차 실행 → 합산 60초 초과
- Vercel Pro 플랜임에도 `maxDuration: 60` 고정이어서 Pro 한도(300초) 미적용 상태였음
- 함수 분리 + maxDuration 300 적용으로 완전 해결

### ④ 1차 JSON 파싱 실패 해결 (배포 완료)
- 원인: 새 시스템 프롬프트(30년 경력 노하우 5개 섹션) 추가로 응답 생성 공간 부족 → JSON 중간 절단
- claude-analyze-1: max_tokens 8000 → 16000
- claude-analyze-2: max_tokens 8000 → 12000

---

## 최근 수정 이력 (2026-05-07) — QA 버그 수정 + fakeAnalysis 완성

### ① apiKey UI 완전 제거 — 서버 환경변수 전환 후속 정리 (배포 완료)

#### js/app.js
- `mode`, `apiKey` 상태 변수 제거 (localStorage 의존 제거)
- 제거된 함수: `showModal()`, `closeModal()`, `setMode()`, `confirmKey()`, `saveApiKey()`, `showApiModal()`, `fillSavedKey()`
- `runAnalysis()`: 항상 `AIEngine.callClaude(data)` 직접 호출 (`mode === 'demo'` 분기 제거)
- `_pendingIsDemo`: 에러 fallback 시에만 `true` (이전: demo 모드 시 true)
- 진단 이력 저장: demo 여부 무관하게 항상 `HistoryTracker.save()` 호출

#### index.html
- `apiModal` div 전체 제거 (API 키 입력 모달)
- STEP 4 `wiz-api-box` 제거 (API 키 입력란 + 확인 버튼)
- 위저드 nav "⚙ API 설정" 버튼 + `nav-actions` wrapper 제거

#### js/wizard.js
- `App.fillSavedKey` 호출 제거 (goStep 내)

---

### ② industryVarMap 키 영문화 + 4개 업종 추가 (배포 완료)

#### js/ai-engine.js — buildInsightsSummary()
- **근본 버그**: 기존 12개 항목이 한국어 키('제조업', '식품/음료')로 등록되어 있었으나 함수 호출 시 영문 키(aiIndustryKey: 'mfg_parts', 'logistics')가 전달 → 항상 미매칭 (dead code)
- **수정**: 전체 16개 항목을 영문 industryKey로 교체
  ```
  'mfg_parts', 'food_mfg', 'local_service', 'wholesale', 'restaurant',
  'knowledge_it', 'construction', 'medical', 'finance', 'education',
  'fashion', 'media', 'logistics', 'energy', 'agri_food', 'export_sme'
  ```
- bizModelVarMap은 Korean 키 그대로 유지 (d.bizModel이 한국어 레이블이므로 정상)

---

### ③ Object.assign 키 충돌 방지 (배포 완료)

#### js/ai-engine.js — callClaude() 2차 호출 병합
- **문제**: `Object.assign({}, result1, result2)` → 2차 응답이 1차 핵심 키(SWOT·전략 등)를 덮어씀
- **수정**: 1차 전용 키 보호 후 병합
  ```js
  const FIRST_PASS_KEYS = ['executiveSummary', 'swot', 'stp', 'fourP', 'keyStrategies', 'specializedAnalysis'];
  const r2Clean = Object.fromEntries(
    Object.entries(result2).filter(([k]) => !FIRST_PASS_KEYS.includes(k))
  );
  return Object.assign({}, result1, r2Clean);
  ```

---

### ④ fakeAnalysis 4개 컨설팅 유형 데이터 완성 (배포 완료)

#### js/ai-engine.js — _fakeByConsultingType()
기존 `return {}` 상태였던 4개 유형 완전 구현:

| 유형 | 핵심 전략 방향 |
|------|---------------|
| `growth_strategy` | LTV 극대화, 신규 채널 개척, 단가 상향, 반복 매출 모델 |
| `structure_strategy` | SOP 매뉴얼화, R&R 위임, 채용·온보딩, 대표 의존도 감소 |
| `innovation_strategy` | 고객 불만 기반 혁신, 린 MVP 검증, 파트너십, 정부 R&D 연계 |
| `cx_strategy` | 고객 여정 맵, NPS 측정, 온보딩, 컴플레인 기준, 재구매 루틴 |

각 유형 구조: keyStrategies×6(`[진단][방침][행동]`) + kpi×8 + sixSystems×6(상태 배지+액션 3+지원사업) + plan90days×3

---

### ⑤ 에이전트 도구 추가 (배포 완료)

#### .claude/agents/fullstack-engineer.md
- tools에 `WebSearch`, `WebFetch` 추가
- 이유: Vercel API 변경사항·npm 패키지 문서·Node.js 버전 호환성 등 외부 레퍼런스 조회 대응

---

## 최근 수정 이력 (2026-05-06) — 재무분석 PDF 리포트 완성

### ① NICE BizINFO 수준 재무분석 보고서 출력 구현 (배포 완료)

#### js/finance-wizard.js — renderReport() 전면 재작성
- 기존 단순 테이블 → NICE BizINFO 스타일 10개 섹션 구조
- `sHdr(num, title, sub)`: 섹션 헤더 헬퍼 (번호 배지 + 제목 + 영문 부제)
- `aBlock(areaKey)`: 평가(현황) → 진단(원인) → 처방(대안) 3단 서술 블록
- `_buildOpinionPara(areaKey, r, d)`: 5개 비율군별 자동 서술 문단 생성
  - 유동성·안전성·수익성·활동성·성장성 각각 비율값·산업평균 비교 → 진단 텍스트 자동 생성
- `_buildFinalOpinion(r, d, sc, score, gradeLbl)`: 종합 의견 문단 (등급·핵심 취약점·개선 방향)
- `_buildImprovements(r, d)`: 우선순위별 개선 권고 항목 리스트
- 10개 섹션: 표지·재무현황요약·재무상태표·손익계산서·유동성·안전성·수익성·활동성·성장성·종합의견

#### css/style.css — nice-* 클래스 ~180줄 추가
- `.nice-sec-hdr`, `.nice-sec-num`: 섹션 헤더 (네이비 번호 배지)
- `.nice-kv-grid`, `.nice-kv-card`: 재무현황 카드 그리드
- `.nice-score-bar`: 종합 점수 바
- `.nice-def-table`, `.nice-ratio-table`: 비율 정의·비교 테이블
- `.nice-analysis`, `.nice-analysis-row`: 평가/진단/처방 서술 블록

---

### ② PDF 표지 2페이지 넘침 완전 수정 (배포 완료) — 5개 원인 동시 해결

#### 원인 분석
1. **print.css 캐시** — 버전 파라미터 없어 브라우저가 구버전 서빙 → `?v=20260506a` 추가
2. **height 수학 버그** — `height:255mm + padding:8mm×2 = 271mm > 259mm(A4)` → `box-sizing:border-box + height:257mm`
3. **style.css 충돌** — `@media print .rpt-cover { background:#1A2340 !important }` 잔재 → 삭제
4. **캐시 근본 해결** — `printPdf()`에서 `window.print()` 직전 `<style>` 태그 DOM 직접 주입 (캐시 완전 무력화)
5. **이중 페이지브레이크** — `.rpt-cover { break-after:page }` + `.rpt-page { break-before:page }` 동시 적용 → `break-after:avoid`로 변경

#### 표지 HTML inline 스타일 → CSS 클래스 전환
- 기존: `<div style="color:#F5C030;...">` 형태 (print에서 색상 오버라이드 불가)
- 수정: `.rpt-cover-logo`, `.rpt-cover-tagline`, `.rpt-cover-subtitle`, `.rpt-cover-company`, `.rpt-cover-ind` 클래스 사용
- print.css에 각 클래스 인쇄용 색상 명시 (흰 배경 대응)

---

## 최근 수정 이력 (2026-04-30) — 5대 외부 데이터 연동 완료

### ① 통계청 KOSIS 업종 생존율 연동 (배포 완료)

#### api/kosis-survival.js (신규)
- 기업생멸행정통계 2022 확정치 16개 업종 fallback 내장
- KOSIS_API_KEY 선택 (없으면 fallback 자동 동작)
- 반환: `{ y1, y3, y5, risk('폐업 고위험'/'주의 필요'/'상대적 안정'), name, source }`
- INDUSTRY_TO_KSIC: BizNavi 16개 업종 키 → KSIC 대분류 코드 매핑

#### 연동 흐름
- `app.js` runAnalysis()에서 `Promise.allSettled` 병렬 선조회 (AI 호출 전)
- `data.survivalData` → `buildPrompt1()` 섹션13에 KOSIS 블록 주입 → SWOT 위협·전략에 반영
- `wizard.js` showDiagReveal() → `#drSurvivalBox` 카드 렌더링 (diag-reveal 화면)

---

### ② 기업마당 정부지원사업 실시간 매칭 (배포 완료)

#### api/bizinfo.js (신규)
- 10개 curated fallback 프로그램 내장 (소상공인스마트화·경영컨설팅·창업도약패키지·정책자금 등)
- BIZINFO_API_KEY 선택 (없으면 fallback 자동 동작)
- scoreProgram(): 업종 키워드 + 규모 매칭 → 관련도 점수 → 상위 5개 반환
- 반환: `{ programs[{ name, amount, dday, url, summary, score }] }`

#### 연동 흐름
- runAnalysis()에서 KOSIS와 동시 선조회 (Promise.allSettled)
- `data.bizinfoPrograms` → `buildPrompt1()` 섹션11에 기업마당 블록 주입 → 로드맵 1단계에 반영
- `wizard.js` showDiagReveal() → `#drBizinfoBox` 지원사업 카드 렌더링

---

### ③ 재무 시뮬레이션 엔진 — BEP·현금흐름 계산기 (배포 완료)

#### js/bep-simulator.js (신규)
- `BepSim.init(d)`: 재무분석 결과로 초기값 자동 설정
  - monthlyRev = revenue/12, varRatio = costOfSales/revenue (0.3~0.9 클램핑)
  - fixedCost = laborCost/12 + revenue/12×0.15 (DART 미제공 항목 추정)
- 5개 range 슬라이더 실시간 연동 (월매출·변동비율·고정비·초기투자·현금잔액)
- 4개 결과 카드: BEP 금액·달성률·런웨이·월순이익 (수준별 색상 bep-pos/warn/neg)
- 6개월 현금흐름: 테이블 + Canvas 바 차트 (양=초록, 음=빨강)
- `finance-wizard.js`에서 대시보드 렌더 후 `BepSim.init(d)` 호출

---

### ④ 진단 패턴 DB — 소상공인 실태조사 기반 (배포 완료)

#### js/pattern-db.js (신규)
- PatternDB 모듈: `match()`, `renderDiagReveal()`, `buildPromptBlock()`
- 4대 아키타입 (도메인 점수 조건 기반):
  - `finance_crisis`: finance < 2.5 → 34.2% 비중, 52.8% 3년 폐업률
  - `market_weak`: (bm+diff)/2 < 2.5 → 28.7% 비중, 44.1% 폐업률
  - `growth_stall`: 평균 2.5~3.5 → 29.4% 비중, 28.3% 폐업률
  - `strength_build`: 평균 ≥ 3.5 → 7.7% 비중, 12.1% 폐업률
- INDUSTRY_CONTEXT: 16개 업종별 평균월매출·BEP범위·주요폐업트리거·디지털효과·성공시그널
- AGE_CONTEXT: 창업기(0~2년)·성장기(3~5년)·안정기(6~10년)·확장기(10+년)
- `renderDiagReveal()`: `#drPatternBox`에 아키타입 배지 + 동종업 통계 + 상위3 액션 렌더링
- `buildPromptBlock()`: AI 프롬프트 섹션12 주입

---

### ⑤ 분기별 진단 이력 추적 — localStorage (Firebase 마이그레이션 대비) (배포 완료)

#### js/history-tracker.js (신규)
- HistoryTracker 모듈: `save()`, `loadPrev()`, `loadAll()`, `renderCompare()`, `renderPanel()`
- `_storage` 인터페이스 추상화 → Firebase 교체 시 이 객체만 Firestore 호출로 교체
- 스냅샷 구조: `{ id, savedAt, quarter(YYYY-Qx), company, domainScores(flattened avg), consultingType, topIssues, execSummary(200자) }`
- 최대 20개, 같은 분기+회사명 → 덮어쓰기
- `renderCompare()`: `#drHistoryBox` 이전 분기 대비 도메인 ▲▼ 비교 바 + 컨설팅 유형 변화
- `renderPanel()`: 우상단 "📋 이력" 버튼 → 슬라이드 드로어 (회사별 그룹, 미니 바, 이슈 태그)

#### app.js 추가
- 실제 AI 분석 완료 후 자동 저장: `HistoryTracker.save(data, result)` (데모 제외)
- `openHistory()` / `closeHistory()`: 드로어 오버레이 토글

#### 공통 인프라 수정
- `js/ai-engine.js`: buildPrompt1()에 섹션 11(기업마당)·12(패턴DB)·13(KOSIS) 추가
- `vercel.json`: kosis-survival.js·bizinfo.js 함수 등록 (icn1 리전)
- `css/style.css`: surv-*·bizinfo-*·bep-*·pat-*·hist-* 스타일 일괄 추가

---

## 최근 수정 이력 (2026-04-30) — 히어로·UI

### 히어로 가독성 강화 — 마스터카드 코리아 스타일 (배포 완료)

#### js/hero-bg.js 오버레이 강화
- 방향: `160deg` 평면 → `125deg` 대각선 (좌하단→우상단)
- 강도: 텍스트 영역(좌) .94 완전 불투명 → 우측 .50 사진 노출
- 효과: 텍스트는 완전 보호, 우측에 사진 배경 일부 시각적 노출

#### css/landing.css 히어로 텍스트 개선
- `.lp-hero-h1`: `#F0F2F8` → `#FFFFFF` + `text-shadow:0 2px 8px rgba(0,0,0,.65),0 6px 32px rgba(0,0,0,.45)`
- `.lp-hero-sub`: opacity `.82`→`.92`, weight `500`→`600`, text-shadow 2중 강화
- `.lp-hero-badge`: `backdrop-filter:blur(8px)` + 테두리/배경 강화
- `.lp-hero-stats`: 배경 `rgba(5,8,20,.55)` (이전 `.04`), `blur(16px)`
- `.lp-stat-label`: opacity `.35`→`.55`

### 히어로 배경 시간대별 사진 슬라이드쇼 (배포 완료)

#### js/hero-bg.js (신규)
- 낮(06~17시) / 밤(18~05시) 이미지 세트 각 3장 (Unsplash 무료)
  - day: 소규모 팀 미팅·카페 비즈니스·스마트폰 비즈니스 여성
  - night: 다크 모던 오피스·화면 앞 집중 업무·야간 미팅
- A/B 두 레이어 크로스페이드 (1.8s ease), 8초 간격 자동 전환
- 랜덤 시작 인덱스, 이미지 로드 실패 시 다음 이미지 fallback
- 탭 숨김 시 인터벌 중지, 복귀 시 재개 (visibility API)
- 초기화 시 `#hero-canvas` opacity:0 → display:none (이미지로 대체)

#### index.html hero 섹션 재편
- `#hero-bg-a`, `#hero-bg-b`: 배경 이미지 레이어 (z-index:0, opacity 전환)
- `#hero-overlay`: 오버레이 그라디언트 레이어 (z-index:1)
- `#lp-hero::before/::after`: 격자 패턴·골드 글로우 (z-index:2)
- `.hero-content-wrap`: 콘텐츠 래퍼 (position:relative; z-index:3) — 배경 위에 표시 보장

#### css/landing.css 추가
- `.hero-bg-layer`: absolute·inset:0·opacity:0·background-size:cover
- `.hero-overlay-layer`: absolute·inset:0·pointer-events:none·z-index:1
- `.hero-content-wrap`: position:relative·z-index:3·flex column center

---

### Dynamic Common Core — 업종별 공통 질문 문구 오버라이드 (배포 완료)

### Dynamic Common Core — 업종별 공통 질문 문구 오버라이드 (배포 완료)

#### js/wizard.js 추가
- `COMMON_WORDING_MAP`: 11개 업종 × `1_3` 재구매 항목 업종별 호칭 교체
  - 제조(mfg_parts/food_mfg/wholesale/export_sme/logistics): 재발주율·재주문율
  - 외식(restaurant)/생활서비스(local_service): 재방문율
  - IT(knowledge_it): 갱신율/Retention Rate
  - 의료(medical)/교육(education): 재등록율
  - 건설(construction): 재계약율·수의계약율
  - 각 업종 `1_1`·`1_2`에 `benchRef` (업종 평균 + 양호 기준) 주입
- `NUMERIC_BENCH_REF_DEFAULT`: 업종 매핑 없는 경우 중소기업 평균 fallback
- `DX_DETECT_ITEM`: 공통 진단 끝에 1문항 추가 (점수 미반영, 전략 시그널 수집)
  - `_signalOnly: true` → `data-signal-only` 속성 → 진행률·검증에서 자동 제외
- `_applyIndustryWording(diagData, industryKey)`: 데이터 오버라이드 함수
- `_injectDxDetect(diagData)`: DX 탐지 영역 주입 함수
- `loadDiagnosisUI()`: 창업 초기 제외하고 두 함수 적용
- `_renderNumeric()`: `item.benchRef` 있으면 골드 박스(평균/양호 기준/출처) 렌더링
- `updateDiagProgress()` + `validateCurrentTab()`: signal-only 항목 자동 제외
- `collect()`: `dxSignal` ('analog'|'digital_ready'|'') + `ceoDependencySignal` (boolean) 추가
  - `ceoDependencySignal`: `3_1점수 ≤ 2 AND 직원수 > 1` 복합 조건

#### js/ai-engine.js 수정
- `buildPrompt1()`: DX·대표의존도 시그널 블록 추가
  - `dxSignal === 'analog'`: SWOT 위협 + sixSystems 자동 주입 지시
  - `ceoDependencySignal`: sixSystems[operations] 1순위 + SOP 위임 체계 액션

#### css/style.css 추가
- `.diag-signal-badge`: DX 탐지 인라인 뱃지 (연파랑)
- `.diag-signal-item`: DX 탐지 카드 좌측 연파랑 테두리
- `.diag-bench-ref`: 업종 평균 참고값 박스 (골드 테두리)
- `.bench-avg` / `.bench-good` / `.bench-src`: 참고값 내부 강조 스타일

#### 현재 미완성
- `growth_strategy`, `structure_strategy`, `innovation_strategy`, `cx_strategy` — `_fakeByConsultingType()`에서 여전히 `return {}` (기본 fakeAnalysis 데이터 표시)

---

## 최근 수정 이력 (2026-04-29)

### _fakeByConsultingType 전체 유형 특화 완료 (배포 완료)

#### js/ai-engine.js 수정
- `finance_strategy`: kpi(10개)·sixSystems(6개)·plan90days(3개) 추가 (기존 keyStrategies만 있었음)
- `differentiation_strategy` (신규): USP·해자(Moat)·ROI증명·니치시장 전략 + 완전한 실행 데이터
- `marketing_strategy` (신규): StoryBrand·콘텐츠 루틴·리드육성·디지털채널 최적화 + 완전한 실행 데이터
- `hr_strategy` (신규): R&R 명확화·매뉴얼화·성과체계·채용·eNPS + 완전한 실행 데이터
- `pivot_strategy` (신규): 현황진단·잔존역량·런웨이 확보·MVP검증·재피벗 + 완전한 실행 데이터
- 모든 유형: keyStrategies(6개)·kpi(10개)·sixSystems(6개)·plan90days(3개) 완전 구성

#### 현재 미완성 (growth_strategy, structure_strategy, innovation_strategy, cx_strategy)
- 위 4개 유형은 여전히 `return {}` — 기본 fakeAnalysis 데이터로 표시됨

---

### Phase 3: AI 분석 2회 호출 분할 (배포 완료)

#### js/ai-engine.js 구조 변경
- `buildPrompt()` → `buildPrompt1()`: 1차 호출 사용자 프롬프트 (SWOT·전략 6개 섹션)
  - 끝에 "★ 1차 호출 응답 범위" 지시어 추가 → kpi/roadmap/sixSystems 제외 강제
- `buildPrompt2(d, r1)` 신규: 2차 호출 사용자 프롬프트
  - r1.keyStrategies를 참조하여 KPI·로드맵이 전략과 일관성 유지
  - _ctGuidance 포함, 웹검색 지시어 (정부지원사업 특화)
- `_SYSTEM_EXEC` 신규: 2차 전용 시스템 프롬프트 (KPI·로드맵·6시스템·90일플랜·린캔버스 5개 JSON 템플릿)
- `callClaude()` 재작성: 2회 순차 호출 + `Object.assign(result1, result2)` 병합
  - `apiCall()` 헬퍼: /api/claude-analyze 공통 호출
  - `extractJSON()` 헬퍼: JSON 파싱 로직 공통화

#### 로딩 화면 업데이트 (index.html + wizard.js)
- 스텝 텍스트: "SWOT 분석 중" → "1차 진단·전략 분석" / "KPI·실행플랜 작성 (2차)"
- `animateLoading()`: 고정 700ms → 가변 딜레이 (3000/5000/5000ms — 실제 2회 API 호출 시간 반영)

#### 효과
- 8000 토큰을 전체 섹션에 분산 → 1차 4000+α (전략 깊이) + 2차 4000+α (실행 깊이)
- 2차 호출이 1차 keyStrategies를 참고 → KPI·로드맵·6시스템이 전략과 일관성 유지

---

### Phase 2: Claude web_search 실시간 데이터 연동 (배포 완료)

#### api/claude-analyze.js (신규) — Vercel 서버사이드 Claude API 프록시
- `web_search_20250305` 도구 포함 — Anthropic이 실시간 웹 검색을 서버에서 실행
- 모델 `claude-sonnet-4-6` 으로 업그레이드 (knowledge cutoff Aug 2025, 기존 Oct 2024 → +10개월)
- 다중 턴 처리 루프 (stop_reason: 'tool_use' 시 tool_result로 응답 반복, 최대 10턴)
- `maxDuration: 60초` (웹 검색 포함 시 응답 지연 대비)

#### js/ai-engine.js callClaude() 전환
- 기존: 브라우저 → Anthropic API 직접 (CORS 우회 헤더 의존)
- 변경: 브라우저 → `/api/claude-analyze` → Anthropic API (서버사이드 프록시)

#### js/ai-engine.js buildPrompt() 섹션10 추가 — 웹 검색 지시어
- 업종 2025~2026 시장 동향 검색 → SWOT 기회·위협에 직접 반영
- 경쟁사 현황 검색 → 포지셔닝·차별화 전략에 반영
- 정부지원사업 2025 검색 → 로드맵에 지원사업 신청 일정 포함

---

### Reference DB + Chain of Consulting 통합 (배포 완료)

#### js/reference-db.js 신규 (ReferenceDB 모듈)
- 16개 업종 벤치마크 준거 데이터 (한국은행 기업경영분석 2023, 소상공인진흥공단 2023, 통계청 기업생멸통계 2023)
- 업종별 핵심 재무 지표: 영업이익률·부채비율·매출성장률·3/5년 생존율·디지털화율
- 업종별 특화 KPI: 건설(수주성공률·원가초과율·외주비율), IT(이탈률·가동률·RFP수주율), 외식(식재료비율·좌석회전율·1인건비), 제조(설비가동률·불량률·납기준수율), 의료(재방문율·비급여비율·예약완료율) 등
- `buildPromptBlock(industryKey)`: AI 프롬프트용 구조화 텍스트 자동 생성
- `getBench(industryKey)`: 원시 벤치마크 객체 반환
- `evalMargin(industryKey, actual)`: 실제값 vs 벤치마크 수준 평가 (high/ok/warn/danger)

#### js/ai-engine.js buildPrompt() 통합
- 섹션9 추가: `ReferenceDB.buildPromptBlock()` 호출 → AI가 실제 업종 평균 수치와 비교하여 진단·전략 제시
- IndustryTrends(8-1) → GovSupport(8-2) → **ReferenceDB(9)** → buildCausalChain → _ctGuidance 순서

#### buildCausalChain() — Chain of Consulting (이전 세션 완료)
- 5개 도메인 점수 + 업종×BM 패턴으로 인과관계 내러티브 자동 생성
- 건설(흑자도산 구조), IT/SaaS(ARR 누적 실패), 외식(박마진×운영취약), 물류(고정비×공차율), 의료·교육·생활서비스(재방문율 붕괴) 등 특화 시나리오

---

### consultingType 사전계산 + 진단유형별 솔루션 특화

#### 핵심 버그 수정: consultingType 순서 역전 문제
- **문제**: `showDiagReveal(data)` (AI 호출 후)에서 consultingType을 결정 → AI 프롬프트에 항상 `'미확인'`으로 전달
- **수정 위치**: `app.js runAnalysis()` — `Wizard.collect()` 직후, AI 호출 전에 삽입
  ```js
  const _domScores = Wizard.calcDomainScores(data.diagScores || {});
  const _ctResult  = Wizard.classifyConsultingType(_domScores);
  data.consultingType = _ctResult?.primary || '';
  data.consultingTypeSecondary = _ctResult?.secondary || '';
  ```
- **효과**: 진단 유형이 AI 프롬프트에 실제로 반영됨

#### buildPrompt 강화: _ctGuidance() 헬퍼 추가 (ai-engine.js)
- 컨설팅 유형별 상세 지침을 전체 프롬프트에 주입 (SWOT·keyStrategies·KPI·6시스템·90일플랜 전체 반영 지시)
- 구현된 유형: `digital_strategy`, `finance_strategy`, `growth_strategy`, `differentiation_strategy`, `hr_strategy`, `marketing_strategy`

#### fakeAnalysis 유형별 특화: _fakeByConsultingType() 추가 (ai-engine.js)
- `digital_strategy`: keyStrategies(6개)·KPI(10개)·sixSystems(6개)·plan90days(3개) 전면 디지털 전환 특화
  - CRM 도입·온라인 마케팅·업무 자동화·데이터 대시보드·디지털 판매 채널·디지털 역량 강화
  - 각 sixSystem: 현재 아날로그 문제 → 디지털 도구명·비용 포함 즉시 실행 액션
- `finance_strategy`: keyStrategies(6개) 재무 특화 (BEP·현금흐름·수익성·비용·자금조달·대시보드)
- 구조: `Object.assign(base, _fakeByConsultingType(...))` — 반드시 마지막에 오버라이드

#### 기타
- `.diag-item-text` font-size: 14px → 16px (진단 질문 가독성 향상)

---

## 최근 수정 이력 (2026-04-28)

### 위저드 흐름 버그 수정 + Step4 개선

#### 버그 수정
- **OCR 이미지 압축**: Canvas 기반 압축(max 1200px, JPEG 85%) → Vercel 4.5MB 제한 해결
- **OCR maxDuration 45초** + AbortController 40초 타임아웃 추가
- **개업연도 파싱**: 날짜형(20101116) → 앞 4자리만 사용 (wizard.js + analyze-biz.js)
- **Step2 "이전" 버튼**: `goStep(1)` → biz-context 확인 화면으로 복귀 (`prevDiagTab()` 수정)
- **"정보 수정" 빈화면**: `Wizard.goStep(1)` → `Wizard.reset()` 호출로 수정 (`app.js backToStep1()`)
- **validate 오류**: `validate(3)` → `validate(4)` (Step3 제거된 새 흐름 반영)
- **Step4 "이전" 버튼**: `App.goStep(3)` → `App.goStep(2)` 수정

#### Step4 개선
- **업종별 리스크 placeholder**: `Wizard.updateRiskPlaceholder(industryKey)` — 16개 업종 각각 맞춤 예시 자동 적용
- **기타참고사항**: 소상공인 실정에 맞는 예시 텍스트 (원맨구조, 핵심직원 퇴사 등)
- **notes 필드**: placeholder → 라벨 아래 p.hint로 항상 표시

### UI 고도화 6개 항목

#### 1. diag-reveal 세로 레이아웃 전환
- 2열 가로(레이더+유형) → 3섹션 세로 스크롤
- 섹션1: 📊 5대 역량 프로파일 (레이더 차트 + 점수 바 + **도메인별 해설 카드**)
  - 각 도메인: 무엇을 측정하는지 + 현재 점수에 따른 구체적 조언
  - `DOMAIN_EXPLAIN` 상수 (wizard.js) + `#drDomainGuide` DOM 주입
- 섹션2: 🎯 진단 컨설팅 유형 (설명 텍스트 포함)
- 섹션3: 💡 제안 솔루션 미리보기 (설명 텍스트 포함)

#### 2. 경영진단 분석 강화 (dashboard.js)
- 기존: 점수 pill + 취약 경고 배지
- 추가: **영역별 상세 분석 카드** (`AREA_INSIGHTS` + `diag-area-cards`)
  - 재무건전성/조직·인력/고객·매출/경영역량/업종특화/사업모델 각각
  - 점수 구간(high/ok/low)별 구체적 유지·개선 방향 제안 문장

#### 3. fakeAnalysis 요약 개선 (ai-engine.js)
- 기존: 입력값 단순 삽입
- 개선: 진단 점수 분석 → 취약 영역·강점 영역 명시 + 3단계 로드맵 방향 제시

#### 4. 기타 UI 개선
- step-badge 폰트: 11px → 13px (모든 스텝 통일)
- 기타참고사항: placeholder → p.hint 라벨 아래 항상 표시

#### 다음 세션 예정 작업
- 테스트 후 버그 수정
- AI 분석 2회 호출 분할 (1차: 진단·전략방향, 2차: 실행플랜)
- 소상공인/소기업 출력 분리 강화
- OCR 추가 안정화 테스트

---

## 최근 수정 이력 (2026-04-27)

### 경영전략 진단 문항 전면 리설계 — 65문항 → 13문항

#### 핵심 변경
- **common.js**: 20문항(5영역×4개) → 8문항(3영역: 사업성과·운영역량·경쟁력)
  - 수치 기반 3개(매출성장률·영업이익률·재구매율) + BARS 4개 + mixed 1개
  - 진단 시간 18분 → 약 5분으로 단축
- **16개 업종 파일 전면 재작성**: 각 16~20문항 → 각 5문항(업종 핵심만)
  - 수치 기반 1~2개 포함(업종별 핵심 KPI)
  - 쉬운 한국어, 영어 약어 풀네임 병기 유지
- **BM 진단 탭 제거**: `TAB_ORDER = ['common', 'industry']` 2탭으로 단순화
  - BM은 추론으로만 사용(UI에서 탭 제거)
- **총 진단 문항**: 65문항 → 13문항 (공통 8 + 업종 5)

---

## 최근 수정 이력 (2026-04-26)

### XBRL 파싱 완전 수정 + DART 확인화면 전 계정 표시

#### XBRL getVal 핵심 버그 수정 (api/dart-lookup.js)
- `new RegExp('[\\w-]*')` → `[\w-]*` 백슬래시 손실 버그 → 네임스페이스 prefix 매칭 실패
- **수정**: `indexOf` 기반 문자열 탐색으로 완전 교체 (`new RegExp` 제거)
- **K-GAAP 날짜 컨텍스트 대응**: `CFY{year}` 외에 `String(year)` 패턴 추가
  → K-GAAP 날짜 기반 contextRef (`D20240101T20241231` 등) 지원
- `xsi:nil` 자기닫힘 태그(`/>`) 건너뜀 처리 추가
- XBRL 추출 항목 확대: `payable`(매입채무), `borrowings`(차입금) 추가
  → `TradeAndOtherCurrentPayables`, `Borrowings`, `ShortTermBorrowings` 등

#### XBRL 보완 파이프라인 실제 작동 확인
- 빛과전자(KOSDAQ): cash/inventory/tangibleAssets/receivable/payable/borrowings/costOfSales/grossProfit/interestExpense 모두 추출 ✓
- 대한광통신(KOSPI): cash/inventory/tangibleAssets/borrowings/costOfSales/grossProfit/interestExpense 추출 ✓
- `laborCost`: IFRS 기능별 표시 상장사는 손익계산서에 인건비 항목 없음 — 구조적 한계 (null 정상)

#### DART 확인 화면 전 계정 표시 (js/finance-wizard.js)
- Step1 DART 조회 결과: 매출액·자산총계 2개 → 재무상태표·손익계산서 **전 계정 2열 그리드**
- 금액 형식: `1,394억원` (천단위 콤마)
- 미조회 항목: `N/A` 흐린 이탤릭 표시
- 합계 행(자산·부채·자본·매출·순이익): 굵은 초록 강조

#### Step2 재무입력 필드 개선 (index.html + js/finance-wizard.js)
- `type="number"` → `type="text" inputmode="numeric"` (22개 필드 전환)
- `_setField()`: null → `el.value=''` + `el.placeholder='N/A'`, 값 있으면 천단위 콤마 적용
- `_fmtComma()`: regex 기반 천단위 포맷 (`toLocaleString` 의존 제거)
- blur/focus 이벤트: 편집 시 콤마 제거, 이탈 시 콤마 재적용
- `_collectData()`: `.replace(/,/g,'')` 후 parseFloat — 콤마 있어도 정상 계산
- **미완료**: Step2 입력 필드 콤마/N/A 표시 — 배포는 됐으나 브라우저 캐시 등 이슈로 다음 세션에 재확인

#### 다음 세션 예정 작업
- Step2 천단위 콤마 + N/A placeholder 표시 재확인 (Ctrl+Shift+R 후 테스트)
- 사업자등록증 OCR 수정 (api/ocr-scan.js 확인)

---

## 최근 수정 이력 (2026-04-25)

### XBRL 재무데이터 보완 + 금융업 계정명 fallback + 섹션별 레이더 차트

#### XBRL 구현 (api/dart-lookup.js)
- `_parseXbrl(xml, year)`: XBRL ZIP 파싱 → 현금·재고·유형자산·매출채권·매출총이익·이자비용·인건비 추출
- `_supplementWithXbrl()`: fnlttSinglAcnt 누락값을 XBRL로 보완 (null만 채움, 기존값 덮어쓰지 않음)
- XBRL context 매칭: 3월·6월 결산법인 대응 (year, year+1 허용)
- 방어 코드: AbortController 타임아웃(list.json 15초, XBRL 20초), ZIP 5MB 초과 시 스킵
- `vercel.json`: `maxDuration: 45` 설정

#### 금융업(카드·은행·캐피탈) 계정명 fallback
- 하나카드 등 금융회사는 IAS 1.54 예외로 유동/비유동 구분 없음 — 아래 대체 계정 추가
  - `revenue`: 이자수익·순영업수익·영업수익합계
  - `grossProfit`: 순이자손익
  - `cash`: 현금및예치금
  - `receivable`: 상각후원가측정금융자산(카드채권)
  - `borrowings`: 차입부채

#### 재무분석 섹션별 레이더 차트 (js/finance-wizard.js)
- 유동성·안전성·수익성·활동성·생산성·성장성 각 섹션 카드 안에 개별 레이더 차트 삽입
- 차트(왼쪽 230px) + 테이블(오른쪽) 2열 레이아웃, 모바일은 1열
- `_getSectionAxes(data)`: 섹션 데이터 → 0~100 정규화 (50=산업평균)
  - LOW_IS_GOOD 항목(부채비율 등): 역방향 정규화 → 레이더 위 = 항상 좋음
- `_drawRadarAxes(canvasId, axes)`: Canvas API 기반, 외부 라이브러리 없음
- 성장성(항목 1개)은 레이더 미표시, 테이블만 표시
- 요약 레이더 차트 제거, 섹션별 상세 차트로 대체

#### 다음 세션 예정 작업
- 사업자등록증 OCR 수정 (api/ocr-scan.js 확인)
- K-GAAP 중소기업 DART 조회 추가 테스트
- 인건비(판+제) XBRL 계정명 추가 발굴

---

## 최근 수정 이력 (2026-04-23)

### vercel dev 로컬 테스트 환경 구축

#### 변경 내용
- **finance-wizard.js**: localhost 분기 3곳 제거 (`location.hostname === 'localhost'` 체크 삭제)
  - DART 조회, DART 버튼, ECOS API 모두 localhost/vercel 구분 없이 실제 API 호출
  - `_mockDartData()` 함수는 코드에 남겨두되 더 이상 자동 호출되지 않음
- **vercel.json**: `api/ocr-scan.js` 함수 목록에 추가 (누락 보완)
- **.env.local** (gitignore됨, 로컬 전용): 환경변수 파일 생성
  - `DART_API_KEY` 설정 완료
  - `ECOS_API_KEY`, `NTS_SERVICE_KEY`, `GOOGLE_VISION_API_KEY` → 본인 키 입력 필요

#### 로컬 테스트 방법 (vercel dev)
```bash
# 1. 프로젝트 루트에서 Vercel 로그인 (최초 1회)
vercel login

# 2. 프로젝트 연결 (최초 1회) — biznavi 선택
vercel link

# 3. 로컬 서버 실행
vercel dev
# → http://localhost:3000 으로 접속
# → api/dart-lookup.js, api/bok-avg.js 등 serverless 함수 포함 전체 작동
```

#### 주의사항
- `.env.local`에 `ECOS_API_KEY`, `NTS_SERVICE_KEY` 미입력 시 해당 기능(ECOS 업종평균, 사업자조회) fallback 모드로 동작
- `vercel login` 및 `vercel link`는 터미널(PowerShell/CMD)에서 대화형으로 실행 필요

---

## 최근 수정 이력 (2026-04-22) — 오후 2차

### 재무분석 직접입력 + 이전 버튼 네비게이션 수정

#### 문제 및 해결
- **Step2 직접입력 필드 불가**: `.fin-input-item input`이 `.form-group` 밖에 있어 다크테마 CSS 미적용 → 흰색 기본 input처럼 보여 비활성처럼 오인
  - `style.css`에 `.fin-input-item input, .fin-input-item select` 다크테마 스타일 추가
- **DART 실패 시 수동입력 전환**: DART 조회 실패(`nextStep()` else 분기)에서 `_inputMode = 'manual'` 자동 설정 → Step2 진입 즉시 입력 가능
- **재무 대시보드 이전 버튼 추가**: 기존 "← 다시 분석"(Step1 초기화)과 분리
  - `FinWizard.backToStep2()`: 대시보드 → Step2(재무입력)로 복귀
  - `App.showFinanceWizard()`: finance-wizard 화면만 표시 (Step1 리셋 없음)
  - 대시보드 nav: **← 이전**(Step2 복귀) + **↺ 처음부터**(Step1 초기화) 분리
- **finance-wizard Step1 이전 버튼**: `App.showModeSelect()` → `App.showLanding()` 변경 (랜딩에서 직접 진입 시 뒤로가기가 서비스선택 화면으로 가던 문제 해결)

---

### 랜딩페이지 전면 리뉴얼 — 재무분석 모듈 반영

#### 변경 내용
- **Hero**: "재무상태 진단부터 경영전략 실행까지" + CTA 2개(재무분석/경영전략 분리), stat에 109,030개 기업 수치 추가
- **섹션3(Value)**: 두 서비스를 카드 형태로 나란히 소개 (재무분석/경영전략 각 기능 4가지 명시)
- **섹션4(Features)**: 재무분석 4개 카드 + 경영전략 6개 카드로 재구성
  - 재무분석: DART 자동조회, 6대 비율, 한국은행 ECOS 벤치마크, PDF 출력
  - 경영전략: 16개 업종 BARS 진단, 10대 컨설팅 유형, 규모별 맞춤 보고서, 90일 플랜, 경영서적 10권, 5대 역량 레이더 차트
- **섹션6(Demo)**: 재무분석 대시보드 목업 추가 (6대 비율 카드 양호/주의/위험 수준 표시 + SWOT 통합)
- **섹션5(Trust)**: 후기 업데이트 (경영지도사 재무진단 후기 포함), 통계 수치 현실화
- **섹션7(Pricing)**: 각 플랜별 재무분석 포함 기능 업데이트
- **섹션8(FAQ)**: DART 설명, 한국은행 업종평균 연동 방식, 16개 업종 지원 FAQ 추가 (총 6개)
- **섹션9(CTA)**: 두 서비스 버튼 분리
- **Footer**: © 2026, 이메일 dodson108@gmail.com 업데이트

---

## 다음 세션 예정 작업

### 1순위: AI 분석 정상 작동 최종 확인
- biznavi.vercel.app에서 실제 분석 1회 end-to-end 테스트
- 1차·2차 모두 정상 JSON 반환 확인, 대시보드 렌더링 확인

### 2순위: JSON 파싱 실패 근본 해결
- max_tokens 증가 방식 revert됨 — 다른 접근 필요
- 후보: 시스템 프롬프트 토큰 축소 / buildPrompt1 섹션 경량화

### 3순위: [TIMING] 타이머 로그 제거
- api/claude-analyze-1.js, claude-analyze-2.js의 console.log 제거
- ai-engine.js 클라이언트 타이머 로그 제거

### 4순위: vercel dev 로컬 실행 방법
```powershell
$env:DART_API_KEY="<DART_API_KEY 값 — .env.local 또는 Vercel 환경변수 참조>"
vercel dev
# → http://localhost:3000
```

### 5순위: PDF 표지 확인
- 실제 인쇄/PDF 저장 테스트 → 표지 1페이지 확인

### 6순위: --teal CSS 변수 정리
- 미사용 CSS 변수 정리 및 다크테마 일관성 점검

### 마지막: 통합 테스트 1회
- 전체 흐름 (위저드 → AI 분석 → 대시보드 → PDF) end-to-end 검증

---

## 최근 수정 이력 (2026-04-22) — 오전

### DART 기업목록 안정화 — corp-list.json 로컬 파일 방식으로 전환

#### 문제 원인 분석 및 해결
- **Vercel 인스턴스 간 캐시 불공유**: 각 콜드스타트 인스턴스가 corpCode.xml을 별도 다운로드 시도 → 실패 시 error 반환
- **해결**: `scripts/build-corp-list.js`로 109,030개 기업목록을 `api/corp-list.json`으로 로컬 저장
  - 로컬에서 `DART_API_KEY=... node scripts/build-corp-list.js` 실행 후 커밋
  - dart-lookup.js가 JSON 파일 우선 읽기 → 실패 시만 DART 다운로드 fallback
- **`vercel.json`**: `buildCommand` + `outputDirectory: "."` 추가 (빌드 시 스크립트 자동 실행)

#### 상태별 메시지 개선 (finance-wizard.js)
- `no_financial`: "DART에 등록된 기업이지만 공시된 재무제표가 없습니다. 직접 입력해주세요."
- `not_found`: "DART 미등록 기업입니다. 직접 입력해주세요."
- `error`: "조회 실패 — 직접 입력해주세요."

#### 삼성전자 DART 조회 결과 (IFRS 대형기업 한계)
- 반환 항목: 유동자산, 비유동자산, 자산총계, 유동부채, 비유동부채, 부채총계, 자본총계, 매출액, 영업이익, 당기순이익
- **현금, 재고자산, 유형자산, 매출총이익, 이자비용, 인건비 = DART가 미제공** (IFRS 대형기업 특성)
- 중소기업(K-GAAP)은 더 상세한 항목 반환 예상

#### 다음 세션에서 확인 필요
- 벽산건설 등 K-GAAP 중소기업 DART 조회 정상 작동 여부 테스트
- ECOS 업종별 산업평균 연동 최종 확인
- _debugAccounts 임시 필드 제거 (테스트 완료 후)

---

## 최근 수정 이력 (2026-04-21)

### 재무분석 모듈 완성 — DART + ECOS + 리포트 연동

#### DART 회사명 자동변형 검색 (api/dart-lookup.js)
- `(주)`, `㈜`, `주식회사` 등 접두어 자동 제거 후 재검색
- 원본명 → 핵심명 → `주식회사 XXX` → `㈜XXX` → `(주)XXX` 순서로 시도
- 어떤 형식으로 입력해도 DART 검색 성공률 대폭 향상

#### 한국은행 ECOS API 업종별 산업평균 동적 연동
- `api/bok-avg.js` (신규): Vercel Serverless Function
  - KSIC 대분류(A~S) → ECOS 기업경영분석 업종코드 매핑 (18개 업종)
  - 통계표 008Y003 호출 → 재무비율 30여 항목 파싱
  - 환경변수: `ECOS_API_KEY` (ecos.bok.or.kr에서 발급)
- `js/finance-wizard.js` 수정:
  - `_BOK_AVG_DEFAULT`: 제조업 기준 하드코딩 기본값 (fallback)
  - `_bokAvg`: 분석 실행 시 ECOS에서 해당 업종 실제값으로 동적 교체
  - `_fetchBokAvg()`: `/api/bok-avg` 호출, 실패 시 기본값 유지
  - `_bokAvgSource`: 대시보드·리포트에 산업평균 출처 자동 표시
  - `analyze()` 비동기화, 버튼 disabled 처리

#### 재무분석 흐름 (완성)
1. 회사명 입력 → DART 조회 (회사명 변형 자동시도)
2. DART 성공: 업종코드 + 전체 재무데이터(B/S+I/S) 자동입력
3. DART 실패: 직접 입력 모드 전환 + 업종 수동 선택
4. 분석 실행 → ECOS API로 해당 업종 산업평균 조회
5. 6대 재무비율 분석 대시보드 렌더링
6. 재무분석 리포트 생성 (PDF 인쇄 가능)

#### Vercel 환경변수 (필수)
```
DART_API_KEY  = [opendart.fss.or.kr 발급]
ECOS_API_KEY  = [ecos.bok.or.kr 발급]
```

---

## 최근 수정 이력 (2026-04-20)

### 사업자등록번호 자동조회 → 업종 자동세팅 기능 추가

#### 개요
- Step 1 상단에 사업자등록번호 조회 블록 추가 (선택사항, 건너뛰기 가능)
- 사업자번호 체크섬 검증 (클라이언트, 국세청 알고리즘)
- Vercel Serverless Function (`/api/biz-lookup.js`) → 국세청 사업자 상태 조회
- 업태/종목 텍스트 입력 → 16개 업종 키워드 매핑 → 업종 드롭다운 자동선택

#### 구현 흐름
1. 사업자번호 입력 → `###-##-#####` 자동 포맷 + 체크섬 실시간 유효성 표시
2. 대표자명 입력 → [자동조회] 버튼 → `/api/biz-lookup` 호출
3. 국세청 API 응답: 정상(active) / 휴업(suspended) / 폐업(closed)
4. 업태·종목 입력란 표시 → 키워드 매핑으로 16개 업종 자동선택
5. "✓ 업종 자동 설정: ○○" 배지 표시 + 수동 변경 항상 허용

#### 신규/수정 파일
- `api/biz-lookup.js` (신규): Vercel Serverless Function
  - `NTS_SERVICE_KEY` 환경변수 필요 (Vercel Dashboard → Environment Variables)
  - 미설정 시 `manual` 모드 fallback (업태/종목 직접 입력 유도)
  - 공공데이터포털 API: https://www.data.go.kr/data/15081808/openapi.do
- `index.html`: Step 1 상단 `.biz-lookup-block` 추가
- `js/wizard.js`: `formatBizNo`, `validateBizNo`, `lookupBiz`, `inferIndustryFromType`, `skipBizLookup` 추가
- `css/style.css`: `.biz-lookup-block`, `.biz-status-*`, `.biz-infer-*` 스타일 추가

#### 향후 계획
- 예비창업자 전용 플로우 추가 (사업자번호 없이 진행)
- DART API 연동 → 재무제표 자동 입력 (Phase 9)
- OCR 연동 → 사업자등록증 스캔으로 자동입력 (Phase 9)

#### Vercel 환경변수 설정 방법
```
Vercel Dashboard → biznavi 프로젝트 → Settings → Environment Variables
  NTS_SERVICE_KEY = [공공데이터포털에서 발급받은 서비스 키]
```

---

### 전 업종 진단 문항 BARS 5단계 앵커 + 구체적 현장 문항 전면 재작성

#### 개요
- `common.js` 구문 오류 수정 + 5개 역량 도메인 전면 재작성 (BARS 형식)
- 13개 업종 진단 파일 전면 재작성 — 모든 문항 구체적 현장 상황 묘사로 교체
- 전문용어 풀네이밍 + 쉬운 설명 삽입 (HACCP, MTBF, TMS, FDS, 공차율 등)
- `app.js`: API 키 오류(`invalid x-api-key`) 시 localStorage 초기화 + `fillSavedKey()` 함수 추가
- `wizard.js`: `bizScale` 필드 수집 + `fillSavedKey()` 연동

#### 진단 문항 형식 통일 (BARS: Behaviorally Anchored Rating Scales)
- 모든 문항: `type: "bars"` + 5단계 `anchors` (각 레벨별 구체적 현장 상황 묘사)
- 질문 텍스트 구조: "왜 중요한지 설명 — 구체적 질문 내용"
- 수치 입력 항목은 `type: "numeric"` + `scoreRanges` 구간별 점수 자동 계산

#### 재작성된 파일 목록 (13개 업종)
- `local_service.js`: 노쇼 방지·재방문율·네이버플레이스·BEP 등 생활밀착 서비스 특화
- `wholesale.js`: 채널 집중도·CCC(현금전환사이클)·ROAS·재고회전율 등 유통 특화
- `restaurant.js`: 식재료 원가율·임대료 비중·HACCP·배달 플랫폼 수익률 등 외식 특화
- `construction.js`: 기성금·흑자 도산·나라장터·중대재해처벌법 등 건설 특화
- `medical.js`: EMR·PACS·비급여·의료광고법 등 의료 특화
- `education.js`: LMS·OJT·상담 전환율·스타 강사 의존도 등 교육 특화
- `fashion.js`: SKU·OEM/ODM·ROAS·ER·D2C·QC 등 패션 특화
- `media.js`: IP·OSMU·FDS·흑자 도산 등 미디어 특화
- `logistics.js`: 공차율·TMS·WMS·DTG·km당 운송 원가 등 물류 특화
- `energy.js`: Backlog·REC·VCM·탄소크레딧·RE100·ISMS 등 에너지 특화
- `agri_food.js`: HACCP·GAP·CSA·수율·OEM 등 농림식품 특화
- `export_sme.js`: CE·FDA·HS코드·FTA·환헤지(선물환)·CAC/LTV 등 수출중소기업 특화
- `finance.js`: FDS·금소법·ISMS·BCP/DR·LTV/CAC·네팅 등 금융 특화

---

## 최근 수정 이력 (2026-04-17)

### 소상공인/소기업 이분법 대시보드 모드 분리 구현

#### 개요
- Step 1에 `bizScale` 선택 필드 추가 (소상공인 / 소기업·중소기업)
- 선택한 규모에 따라 대시보드 목차·섹션 완전히 다르게 렌더링
- **소상공인 모드**: 비즈니스 캔버스 + 도널드 밀러 6가지 시스템 + 90일 즉시 실행 플랜 중심
- **소기업·중소기업 모드**: 기존 SWOT/STP/4P/핵심전략/KPI/실행로드맵 + 6가지 시스템/90일 플랜 추가

#### index.html
- Step 1 `employees`/`revenue` 아래 `bizScale` select 추가 (소상공인 / 소기업·중소기업, 필수)
- `#reportNav` 내 정적 링크 제거 → JS 동적 생성으로 전환
- `#sec-six-systems` 섹션 추가 (도널드 밀러 6가지 비즈니스 시스템)
- `#sec-plan90` 섹션 추가 (90일 즉시 실행 플랜)

#### wizard.js
- `validate(1)`: `bizScale` 미선택 시 alert 추가
- `collect()`: `bizScale: g('bizScale')` 수집 추가

#### ai-engine.js
- SYSTEM 프롬프트: `bizScale` 기준 모드 분기 지침 추가
  - `micro` (소상공인): `sixSystems`·`plan90days` 최우선 집중 작성
  - `sme` (소기업): 기존 전략 프레임워크 풍부하게 작성
- JSON 템플릿에 `sixSystems` 6개 (리더십·마케팅·판매·제품·운영·재무) + `plan90days` 3개 (월별 액션 플랜) 구조 추가
- `buildPrompt()`: 사업 규모 항목 추가
- `fakeAnalysis()`: 두 모드 모두 풍부한 `sixSystems`·`plan90days` 데모 데이터 생성

#### dashboard.js
- `buildNav(isMicro)`: 모드별 동적 목차 생성 함수 추가
- `renderSixSystems(data)`: 6가지 시스템 카드 렌더링 (상태 배지 + issue + 액션 3개 + 추천 자원)
- `renderPlan90(data)`: 90일 플랜 타임라인 렌더링 (월별 목표·액션·기대효과·지원사업)
- `render()`: `fd.bizScale` 기반 섹션 표시/숨김 제어, 소상공인 모드 시 린 캔버스 → 비즈니스 캔버스로 타이틀 변경
- `initScrollReveal()`: 표시된 섹션만 스크롤 스파이에 포함

#### css/dashboard.css
- `.mode-badge-inline`: 모드 표시 초록 뱃지
- `.six-sys-grid`, `.sys-card`, `.sys-status-*`: 6가지 시스템 카드 2열 그리드
- `.plan90-timeline`, `.plan90-month`, `.plan90-num`: 타임라인 레이아웃 (세로 골드 라인 + 번호 원형)
- 모바일(768px): `.six-sys-grid` 1열, `.plan90-timeline` 컴팩트 축소

---

### AI API 모델 ID 수정 + 버그 수정 + 진단 문항 품질 개선

#### css/style.css
- `.gov-check-group .gov-check-item` 선택자 특이도 강화 (`display:flex !important`) — `.form-group label { display:block }` 과 충돌로 정부지원 체크박스 레이아웃 깨지던 버그 수정
- 체크박스 선택 시 골드 테두리·배경 시각 피드백 추가 (`:has(input:checked)`)

#### js/wizard.js
- `loadDiagnosisUI()` 내 `COMMON_DIAGNOSIS` 직접 참조 → `typeof` 가드로 변경 (ReferenceError 방어)

#### js/app.js
- `devJump` 함수 및 localhost 개발 플로팅 패널 제거
- `startWizard()`에 `Wizard.reset()` 추가 (재진입 시 Step1 미표시 버그 수정)
- `confirmBm()` → `Wizard.goToStep2FromBm()` 전용 함수로 교체 (BM 확인 후 빈 화면 버그 수정)

#### js/diagnosis/industry/mfg_parts.js — 전면 재작성
- COPQ (Cost of Poor Quality: 불량 손실비), MTBF (Mean Time Between Failures: 평균 고장 간격), SMED (Single Minute Exchange of Die: 신속 교체법), 치공구(Jig), 가치사슬 위치(Tier) 등 **모든 전문용어 풀네이밍 + 쉬운 설명**으로 교체
- 전 항목에 `type: "bars"` + 5단계 `anchors` (구체적 현장 상황 설명) 추가

#### js/diagnosis/industry/food_mfg.js — 전면 재작성
- HACCP (식품안전관리인증기준), CCP (핵심 관리 지점), FIFO (선입선출), 콜드체인 등 전문용어 쉬운 설명으로 교체
- 전 항목에 `type: "bars"` + 5단계 `anchors` 추가

#### js/diagnosis/industry/knowledge_it.js — 전면 재작성
- M/M (공수: 1명이 1개월 일하는 업무량), Scope Creep (계약 외 추가 업무 범위 확대), MRR (월 반복 매출: Monthly Recurring Revenue), SOP (표준 업무 절차서) 등 전문용어 풀네이밍 + 쉬운 설명
- 전 항목에 `type: "bars"` + 5단계 `anchors` 추가

---

## 최근 수정 이력 (2026-04-17)

### 16개 업종 + 12개 사업모델 자동추론 시스템

#### index.html (Step 1 재설계)
- 업종 드롭다운: 12개 → 16개 (수출중소기업·물류운송·환경에너지·농림식품원료 추가)
- 비즈니스모델 드롭다운 **제거** → 추론 결과 표시 div (`#inferredBmDisplay`) + hidden input (`#bizModel`) 로 전환
- `onchange="Wizard.onIndustryChange()"` 업종 선택 시 즉시 BM 추론·표시
- 중복 질문 4개 → 3개로 정리:
  - 삭제: `bizStrengths` (핵심 경쟁력 textarea — coreStrength와 중복)
  - 유지/재명명: `coreStrength` / `customerProblem` / `unfairAdvantage`
- script 태그 7개 추가 (신규 진단 파일)

#### js/wizard.js
- `INDUSTRY_MAP`: 16개 업종 키 매핑 (export_sme / logistics / energy / agri_food 추가)
- `BIZMODEL_MAP` **삭제** (미사용 — BM_LABELS로 대체)
- `INDUSTRY_BM_MAP`: 16개 업종 → 현실적 BM 후보 목록 (불가능한 조합 자동 제외)
- `BM_LABELS`: BM 키 → 한국어 표시 레이블
- `inferBizModel(industryKey, formData)`: 키워드 매칭 + 우선순위 기반 BM 추론
- `onIndustryChange()`: 업종 변경 시 BM 추론 실행 + UI 업데이트
- `validate(1)`: `bizModel` 필수 검사 제거, `customerProblem` 필수 추가, 이동 전 `onIndustryChange()` 실행
- `collect()`: `bizStrengths` 제거, `bizModelKey` 추가 (추론된 BM 키)
- `loadDiagnosisUI()`: `_inferredBmKey` 기반 BM 진단 로드, 4개 신규 업종 변수 추가
- 신규 BM 변수 3개 (`BIZMODEL_USAGE_BASED` / `BIZMODEL_ADVERTISING` / `BIZMODEL_DEEPTECH`) 추가
- 공개 API: `onIndustryChange` 추가

#### 신규 진단 파일 (4 업종 + 3 BM = 7개)
- `js/diagnosis/industry/export_sme.js` — 수출 중소기업 (바이어 다각화·인증·환율·수출지원)
- `js/diagnosis/industry/logistics.js` — 물류·운송 (가동률·네트워크·안전·TMS)
- `js/diagnosis/industry/energy.js` — 환경·에너지 (수주·인허가·정책금융·Backlog)
- `js/diagnosis/industry/agri_food.js` — 농림·식품원료 (원물조달·HACCP·가공·판로)
- `js/diagnosis/bizmodel/usage_based.js` — 종량제·사용량기반 (미터링·NRR·가격구조)
- `js/diagnosis/bizmodel/advertising.js` — 광고기반 (MAU·CPM·콘텐츠·수익다각화)
- `js/diagnosis/bizmodel/deeptech.js` — 딥테크·바이오 (특허·TRL·런웨이·사업화)

#### css/style.css
- `.inferred-bm-display`: 추론 결과 표시 컨테이너 (골드 테두리 배경)
- `.bm-tag` / `.bm-tag.primary`: BM 후보 태그 (1순위 골드 강조)
- `.bm-infer-hint`: 안내 텍스트

---

## 최근 수정 이력 (2026-04-14)

### B-3: 단계별 실행 가이드 구조화 — 로드맵 프레임워크 배지 + 린 캔버스 시각화

#### js/ai-engine.js
- SYSTEM 프롬프트 roadmap에 `framework` 필드 추가 (린 스타트업 / 플라이휠 / 6대 시스템)
- JSON 구조에 `leanCanvas` 필드 추가: 9블록 (problem, customerSegments, uniqueValueProposition, solution, channels, revenueStreams, costStructure, keyMetrics, unfairAdvantage)
- fakeAnalysis roadmap 각 단계에 `framework` 추가
- fakeAnalysis에 `leanCanvas` 객체 추가 (form 입력값 customerProblem·unfairAdvantage 자동 반영)

#### index.html
- 대시보드 목차에 `린 캔버스` 항목 추가 (`sec-lean-canvas`)
- 실행 로드맵 아래 `#sec-lean-canvas` 섹션 추가 (9블록 그리드)

#### js/dashboard.js
- `renderLeanCanvas(data, fd)` 함수 추가 (9블록 lean canvas 렌더링)
- 로드맵 렌더링에 `.rm-framework` 배지 표시 추가
- `render()` 함수에서 `renderLeanCanvas()` 호출 추가
- 스크롤 스파이 `secIds`에 `sec-lean-canvas` 추가

#### css/dashboard.css
- `.lc-grid`: 3열 반응형 그리드 (모바일 2열 → 1열)
- `.lc-block`: 9블록 카드 기본 스타일
- `.lc-uvp`: 핵심 가치 제안 골드 강조 (특별 border + 배경)
- `.lc-problem`: 문제 블록 붉은 계열 테두리
- `.lc-revenue`: 수익 블록 그린 계열 테두리
- `.rm-framework`: 로드맵 단계별 프레임워크 배지 스타일 (골드 배경)

---

### B-2: AI 솔루션 출력 구조 개선 — 컨설팅 유형별 특화 분석 섹션 추가

#### js/ai-engine.js
- SYSTEM 프롬프트에 컨설팅 유형별 specializedAnalysis 프레임워크 지침 추가
  - finance_strategy → BEP·현금흐름 분석 (4블록)
  - growth_strategy → 비즈니스 모델 캔버스(BMC) 9블록
  - differentiation_strategy → VRIO 경쟁우위 분석 (5블록)
  - hr_strategy / structure_strategy → 맥킨지 7S 프레임워크 (7블록)
  - digital_strategy → 디지털 전환 MVP 로드맵 (5블록)
  - 그 외 유형 → 맞춤형 특화 처방 분석 (4~5블록)
- JSON 구조에 `specializedAnalysis` 필드 추가: `{type, framework, summary, blocks[]}`
- buildPrompt에 컨설팅 유형 specializedAnalysis 작성 지침 추가
- `_fakeSpecialized(d)` 헬퍼 함수 추가 (6개 유형별 완전한 데모 데이터)
- `fakeAnalysis()` 리턴에 `specializedAnalysis: _fakeSpecialized(d)` 추가

#### index.html
- 대시보드 목차에 `유형별 특화 분석` 항목 추가 (`sec-consulting`)
- 경영 진단 섹션 바로 아래 `#sec-consulting` 섹션 추가
  - `#specFrameworkBadge`: 프레임워크명 뱃지
  - `#specSummary`: 컨설팅 유형 아이콘 + 요약 텍스트
  - `#specBlocks`: 유형별 분석 블록 그리드

#### js/dashboard.js
- `renderSpecializedSection(data, fd)` 함수 추가
  - `data.specializedAnalysis` 존재 여부 확인 후 `sec-consulting` 표시/숨김
  - 컨설팅 유형 아이콘 매핑 (10종)
  - 블록 그리드 렌더링 (번호 뱃지 + 레이블 + 내용)
- `render()` 함수에서 `renderSpecializedSection()` 호출 추가
- 스크롤 스파이 `secIds`에 `sec-consulting` 추가

#### css/dashboard.css
- `.spec-type-row`, `.spec-type-icon`, `.spec-type-label`: 상단 유형 표시
- `.spec-summary-text`: 요약 텍스트 (골드 좌측 테두리)
- `.spec-blocks`: 자동 반응형 그리드 (`auto-fit, minmax(270px, 1fr)`)
- `.spec-block`: 개별 분석 블록 카드 (hover 골드 테두리)
- `.spec-block-label`, `.spec-block-num`, `.spec-block-content`: 블록 내부 스타일
- 모바일(768px): `.spec-blocks` 1열 전환

---

## 최근 수정 이력 (2026-04-13)

### Phase 1: 진단고도화 — 5대 역량 도메인 + 10대 컨설팅 유형 + 진단유형 확인 화면

#### js/diagnosis/common.js
- 5번째 진단 영역 `differentiation` 추가: 차별화·경쟁우위 역량 (4문항)
  - 5_1: 경쟁사 대비 핵심 차별화 요소, 5_2: 고객 선택 이유, 5_3: 모방 난이도, 5_4: 비가격 경쟁 수단

#### index.html (STEP 1 + 신규 섹션)
- STEP 1에 `customerProblem` 텍스트영역 추가 (린 캔버스 Problem 블록, 필수)
- STEP 1에 `unfairAdvantage` 입력란 추가 (모방 불가 경쟁 우위, 선택)
- `#diag-reveal` 섹션 신규 추가 (loading과 dashboard 사이)
  - 레이더 차트 canvas, 5대 역량 점수 바, 진단 유형 박스, 솔루션 미리보기 목록
  - 하단 네비: "진단 수정하기" ← → "솔루션 전체 보고서 보기"

#### js/wizard.js (v3.2)
- `CONSULTING_TYPES` 상수: 10대 컨설팅 유형 정의 (label, icon, desc, preview 4항목)
  - 경영재무전략 / 사업화·성장전략 / 차별화·경쟁우위전략 / 기업구조·시스템전략 / 혁신·신사업전략
  - 마케팅·브랜드전략 / 조직·인력운영전략 / 디지털전환전략 / 사업재편·피벗전략 / 고객경험·서비스전략
- `calcDomainScores(diagScores)`: diagScores 키 패턴으로 5대 역량 도메인 점수 계산
  - finance(1_*+4_*) / hr(2_*) / bm(3_*+bizmodel) / future(industry) / differentiation(5_*)
- `classifyConsultingType(domainScores)`: 규칙 기반 분류기 → primary + secondary 컨설팅 유형 반환
  - 전체 평균 < 2.0이면 피벗전략, 최약 도메인 → 유형 매핑, 특수 케이스(finance+hr 동시 낮음)
- `showDiagReveal(data)`: diag-reveal 화면 DOM 채우기 + drawRadarChart 호출
- `drawRadarChart(canvasId, domainScores)`: Canvas API로 5각형 레이더 차트 렌더링
- `collect()`: `customerProblem`, `unfairAdvantage` 수집 추가
- 공개 API: `showDiagReveal`, `calcDomainScores`, `classifyConsultingType`, `drawRadarChart` 추가

#### css/style.css
- `#diag-reveal`, `.dr-wrap`, `.dr-header`, `.dr-body`, `.dr-radar-wrap`, `.dr-score-*`
- `.dr-type-box`, `.dr-type-primary/secondary/desc`, `.dr-preview`, `.dr-nav` 스타일 추가
- 모바일 반응형: dr-body 1열, dr-nav 세로 정렬

#### js/app.js
- `screens` 배열에 `'diag-reveal'` 추가
- `_pendingResult`, `_pendingData`, `_pendingIsDemo` 상태 변수 추가
- `runAnalysis()`: AI 호출 완료 후 dashboard 대신 diag-reveal로 이동
- `proceedToSolution()`: diag-reveal → dashboard 이동 (보관된 결과 렌더링)
- `goBackToDiag()`: diag-reveal → wizard STEP4로 복귀
- 공개 API: `proceedToSolution`, `goBackToDiag` 추가

#### js/ai-engine.js (buildPrompt)
- `customerProblem` (린 캔버스 Problem), `unfairAdvantage`, `consultingType` 프롬프트 반영

---

## 최근 수정 이력 (2026-04-10)

### 업종×사업모델 유기적 통합 진단 시스템 (js/diagnosis/cross-context.js 신규)
- `cross-context.js`: 13개 업종 × 9개 사업모델 핵심 조합 **31개** 특화 교차 진단 4문항 정의
  - 건설×B2B솔루션, IT×SaaS, 제조×유통, 식품×구독, 외식×프랜차이즈 등 핵심 조합 모두 커버
  - 미정의 조합은 IND_CTX / BIZ_CTX 컨텍스트 키워드 기반 자동 fallback 생성
  - `CrossContext.buildCrossArea(industryKey, bizModelKey, label, label)` Public API
- `wizard.js` 수정:
  - 사업모델 탭 하단에 `🔗 통합 진단: [업종] × [사업모델]` 영역 자동 추가 (4문항)
  - 탭 버튼 레이블 동적 변경: "🏭 건설/부동산 특화 진단" / "💼 B2B솔루션 × 통합 진단"
  - 진행률 카운터 DOM 실제 항목 수 기준으로 동적 계산 (기존 48 → 52항목)
  - `updateDiagTabUI()`: id 기반 선택자로 안정화
- `index.html`: 탭 버튼에 id 추가 (diagTabBtn-common/industry/bizmodel)
- `css/style.css`: `.diag-cross-area` 골드 테두리·배경 강조 스타일 추가

---

## 최근 수정 이력 (2026-04-09)

### AI 출력 품질 고도화 v3.0 (js/ai-engine.js)
- SYSTEM 프롬프트 전면 재작성
  - 10대 경영 프레임워크 → 특정 JSON 필드에 1:1 직접 매핑 (체크리스트 형태로 강제)
  - 필수 반영 원칙 6가지 추가:
    1. 5 Forces → SWOT 기회/위협 직접 문장 인용
    2. TAM/SAM/SOM → STP 세분화 + KPI 목표 수치 연계
    3. 경쟁사 약점 → SWOT 기회 + 포지셔닝 전략 직접 활용
    4. 진단 점수 등급별 우선순위 처방 (🔴위험 즉각 1순위)
    5. 업종 트렌드 → SWOT 기회 최소 2개 직접 인용
    6. 정부지원사업 → 로드맵 1단계 신청 일정 포함
  - keyStrategies: 루멜트 [진단→방침→행동] 3단 구조 강제 (희망 목록 나열 금지)
  - fourP.promotion: StoryBrand 7단계 구조 강제 ([고객이 원하는 것]→[문제]→[가이드]→...)
  - 로드맵 1단계: 린 MVP Build→Measure→Learn 사이클 명시
  - 로드맵 3단계: 6가지 시스템 취약 영역 강화 순서 구조
  - 로드맵 전체: 플라이휠 가속 구조 (초기 성공 → 다음 단계 가속)
  - 60자 문자열 제한 완전 제거 → 상세 서술 허용
- app.js: saveApiKey() 함수 추가 (STEP 4 API 박스 확인 버튼 핸들러) + public API 등록
- index.html: STEP 4 wiz-api-box를 wiz-nav 버튼 아래로 이동 + saveApiKey 확인 버튼 추가

---

## 최근 수정 이력 (2026-04-10)

### Phase 8 완료 — Vercel 배포 + 디자인·UX 대규모 개선

#### Vercel 배포 설정
- `vercel.json` 추가 (보안 헤더·캐시 설정, builds 블록 제거로 정적 파일 전체 서빙)
- `.gitignore` 추가 (hwpx·env 파일 제외)
- `index.html` SEO meta + Open Graph / Twitter Card 태그 추가

#### 랜딩페이지 디자인 — Option 2 다크+화이트 투톤
- 히어로·가치·후기·CTA: 다크 `#0A0E1A` 유지
- Pain·Features·DEMO·Pricing·FAQ: 라이트 `#F4F6FB` (밝은 배경)
- 라이트 섹션 텍스트: `#1A2340`, 카드: 흰색+그림자

#### 히어로 Canvas 배경 애니메이션 (js/hero-canvas.js 신규)
- 우상향 차트 라인, 22개 데이터 노드+연결선, 플로팅 전략 카드 8종
- 골드 파티클 상승, 바 차트 그라데이션 애니메이션
- 탭 숨김 시 RAF 자동 중지, 리사이즈 대응

#### Finnhub API 연동 (ticker.js)
- 다우(^DJI)·나스닥(^IXIC)·닛케이(^N225) 실시간 + 등락률 표시
- API 키: `d7c610hr01quh9fcl1d0d7c610hr01quh9fcl1dg` (무료, 60회/분)
- 5분마다 환율+지수 동시 갱신

#### UX 개선
- "무료로 시작하기" → "진단 시작하기"로 전체 통일
- "데모 체험" 버튼 완전 제거
- 우상단 "진단 시작하기" 버튼 제거
- API 모달 제거 → startWizard() 직접 위저드로 이동
- STEP 4 하단 API 키 입력란 추가 (선택사항, 미입력 시 샘플 데이터)
- 모든 화면의 BizNavi 로고 클릭 → 랜딩 홈으로 이동

---

## 최근 수정 이력 (2026-04-09)

### Phase 7 착수 — AI 엔진 경영 프레임워크 10권 반영 (js/ai-engine.js)
- `SYSTEM` 프롬프트에 `[경영 프레임워크 10권 적용 지침]` 섹션 추가
  - ① 블루오션 전략 (김위찬): SWOT 기회에 ERRC 관점 새 시장 포함
  - ② 경쟁우위 (포터): 5 Forces → SWOT 위협·기회 직접 연결
  - ③ 좋은 전략 나쁜 전략 (루멜트): keyStrategies '진단→방침→행동' 3요소 구조
  - ④ OKR (존 도어): KPI를 Key Result 형태 + 분기별 체크포인트
  - ⑤ 린 스타트업 (에릭 리스): 로드맵 1단계 MVP 관점 + Build-Measure-Learn
  - ⑥ 제로 투 원 (피터 틸): SWOT 강점에 독점적 우위·비밀(Secret) 반영
  - ⑦ 하이 아웃풋 매니지먼트 (앤디 그로브): 핵심전략 레버리지 우선 배치
  - ⑧ 좋은 기업을 넘어 위대한 기업으로 (짐 콜린스): 헤지호그+플라이휠 → 전략·로드맵
  - ⑨ **무기가 되는 스토리 7단계** (도널드 밀러): 4P 촉진·STP 포지셔닝에 StoryBrand 7단계 적용 (고객=주인공, 브랜드=가이드)
  - ⑩ **무기가 되는 6가지 시스템** (도널드 밀러): 로드맵 3단계를 6대 시스템(리더십·마케팅·판매·제품·운영·재무) 취약순 강화 구조로 구성
- `buildPrompt()` 분석 지침 하단에 프레임워크 자가 체크리스트 6항목 추가 (AI 응답 누락 방지)

### 다음 작업 (Phase 7 잔여)
- 7-1: 정부지원사업 자동 매칭
- 7-3: 웹서치 연동 (실시간 업종 데이터)

---

## 최근 수정 이력 (2026-03-30)

### 위저드 1단계 필드 추가 (index.html + wizard.js)
- `bizModel` 선택박스 추가 — 업종 바로 아래 위치, 9가지 옵션 (B2B SaaS, B2C 구독, 플랫폼·마켓플레이스 등), 필수 필드(`*`)
- `coreStrength` 한 줄 입력란 추가 — 주요 제품/서비스 아래 위치, `maxlength="60"`, 필수 필드(`*`)
- `wizard.js` `validate(1)` 에 `bizModel`·`coreStrength` 미입력 시 alert 추가
- `wizard.js` `collect()` 에 `bizModel`·`coreStrength` 수집 추가

### 위저드 2단계 필수 필드 변경 (index.html + wizard.js)
- `competitors`: 선택 → 필수 필드로 변경 (`*` 표시, `field-check` ✓ 아이콘 추가)
- `targetCustomer`: 이미 필수였으나 placeholder 업데이트 (제조기업 예시로 구체화)
- `wizard.js` `validate(2)` 에 `targetCustomer`·`competitors` 미입력 시 alert 추가

### AI 엔진 고도화 v2.0 (js/ai-engine.js)
- 시스템 프롬프트 강화: "맥킨지 출신 시니어 컨설턴트" 페르소나 + 5대 핵심 원칙 (일반론 금지, 업종 특화, 근거 포함 등)
- SWOT 구조 변경: `string[]` → `{item, evidence}[]` (각 항목에 근거/활용방안 포함, 6개씩)
- `keyStrategies` 구조 변경: `owner`·`timeline` 필드 추가, 5개 → 6개로 확장
- `kpi` 구조 변경: `method`·`owner` 필드 추가, 6개 → 10개로 확장
- `roadmap` 구조 변경: 각 phase에 `budget` 필드 추가, task 4개 → 6개로 확장
- `buildPrompt()`: `bizModel`·`coreStrength`·`competitors` 반영, 분석 지침 섹션 추가
- `max_tokens`: 4096 → 8000으로 증가
- `fakeAnalysis()`: `bizModel`·`comp`·`tl`·`cs` 변수 활용한 동적 데모 데이터 생성

### 대시보드 CSS 보완 (css/dashboard.css)
- `.swot-evidence`: SWOT 각 항목의 근거 텍스트 스타일 (10px, `var(--txt3)`, 좌측 indent)
- `.strat-meta`: 핵심전략 카드 하단 담당자·기간 표시 영역 (flex, 10px, `var(--txt3)`)
- `.kpi-meta`: KPI 카드 하단 측정방법·담당자 표시 영역 (flex, 10px, `cursor:help`)
- `.rm-budget`: 로드맵 phase 헤더 우측 예산 표시 (10px, `var(--txt3)`, `margin-left:auto`)

---

## 최근 수정 이력 (2026-03-27)

### Hero 섹션 텍스트 변경 (index.html)
- 배지 텍스트: `Claude AI 기반 전략 분석 엔진` → `진단을 통한 실제전략 분석엔진`
- h1 헤드라인: 두 줄 구성 — `경영전략 수립과` / `실행계획을 한번에!` (두 번째 줄 골드 강조)
- 부제목: `<br>` 제거하여 한 줄로 — `SWOT · STP · 4P 분석과 실행 로드맵을 30분 안에 자동 생성`

### 글로벌 시장 실시간 롤링 배너 추가 (index.html + landing.css + js/ticker.js)
- TradingView 위젯 제거 → 자체 제작 롤링 배너로 교체
- 위치: `position:fixed; bottom:0` — 모든 화면에서 항상 하단 고정
- 높이: `48px` / 배경: `#050810` / 상단 테두리: `2px solid rgba(245,192,48,0.35)`
- `z-index: 9999` / `body { padding-bottom: 48px }` 로 콘텐츠 가림 방지

#### 표시 항목 (10종)
| 항목 | 표시 방식 | 데이터 |
|------|----------|--------|
| 코스피·코스닥·다우·나스닥·닛케이 | `장중` (이탤릭·뮤트) | CORS 제한으로 실시간 불가 |
| 달러/원·엔/원·위안/원 | 실시간 숫자 + 5분 갱신 | `open.er-api.com` (CORS 지원, 무료) |
| WTI·금 | 고정값 (`$78.00` / `$2,300`) | 참고용 고정 |

#### 구성 요소
- 좌측: `글로벌 시장 실시간` 레이블 (골드, 0.85rem) + 실시간 시계 HH:MM:SS
- 우측: `주가: 장중 업데이트` 안내 (데스크톱만 표시)
- 롤링: CSS `@keyframes lp-ticker-move` (translateX 0 → -50%), 콘텐츠 2× 복제로 끊김 없는 루프
- hover 시 일시정지, 속도 동적 조정 (~40px/s 기준)

#### ticker.js 구조
- IIFE 패턴, DOMContentLoaded 이후 실행
- `fetchFX()`: `open.er-api.com/v6/latest/USD` → KRW/JPY/CNY 환산
  - 엔/원은 100엔 기준으로 표시 (`rates.KRW / rates.JPY × 100`)
- `buildTrack()`: DOM 최초 1회 생성 (fallback 텍스트로 즉시 표시)
- `updateInPlace()`: 데이터 갱신 시 DOM 텍스트만 교체 (애니메이션 유지)
- `adjustSpeed()`: `requestAnimationFrame`으로 실제 너비 측정 후 duration 계산
- 5분 간격 자동 갱신 (`setInterval`)

#### CSS 클래스 (ticker 전용)
| 클래스 | 역할 |
|--------|------|
| `.lp-ticker-left` | 레이블·시계 영역 (flex-shrink:0, border-right) |
| `.lp-ticker-scroll` | 롤링 영역 (overflow:hidden) |
| `.lp-ticker-track` | 애니메이션 대상 (inline-flex, 2× 복제) |
| `.lp-ticker-note` | 우측 안내 텍스트 (데스크톱만) |
| `.lp-t-item` | 개별 종목 래퍼 (`data-id` 속성으로 JS 타겟팅) |
| `.lp-t-name` | 지수명 (#9BAAC8, 0.78rem) |
| `.lp-t-val` | 실시간 값 (#E8EDF5, 0.85rem, 600) |
| `.lp-t-fallback` | 장중 텍스트 (이탤릭, 뮤트, 0.7rem) |
| `.lp-t-fixed` | WTI·금 고정값 (반투명, 0.82rem) |
| `.lp-t-chg.up/.dn` | 등락률 (#4ADE80 / #F87171) |
| `.lp-t-sep` | 구분선 `|` (rgba(42,63,117,0.6)) |

---

## 최근 작업 현황 (2026-04-08 업데이트)

### Phase 2 완료: 진단 모듈 시스템 구축
- js/diagnosis/common.js: 공통 모듈 (4영역 16항목)
- js/diagnosis/industry/: 업종 특화 7개 파일 (뿌리제조·식품·서비스·유통·외식·IT·건설)
- js/diagnosis/bizmodel/: 사업모델 특화 9개 파일 (B2B SaaS·B2C구독·솔루션·커머스·플랫폼·프랜차이즈·제조유통·서비스·기타)

### Phase 3 완료 - 4단계 위저드 구현
- index.html: 4단계 스텝 인디케이터 완성
- STEP 2 업종별 맞춤 진단 화면 추가
  - 탭 구조: [기본 경영] [업종 특화] [사업모델]
  - 5점 척도 + 메모 입력 UI
  - 탭 순서대로 진행 (기본경영→업종특화→사업모델→STEP3)
  - 이전 버튼 탭 역순 이동
  - 미체크 항목 경고 + 스크롤 기능
  - 입력값 유지 (diagScores 보존)
  - 진행률 대시보드 정상 작동
- 업종 12개 + 사업모델 9개 드롭다운 반영
- wizard.js INDUSTRY_MAP / BIZMODEL_MAP 완성

### Phase 4 완료 - ai-engine.js 진단 결과 연동
- 진단 점수 계산 함수 추가 (calcDiagScores)
- 점수 등급 판별 함수 추가 (getScoreLabel)
- 진단 요약 생성 함수 추가 (buildDiagSummary)
- buildPrompt에 진단 결과 섹션 추가
- 시스템 프롬프트 고도화 (0~8번 지침)
  - 0번: 쉬운 한국어 언어 원칙
  - 5번: 진단 점수 등급별 활용 지침
  - 6번: 취약 영역 구체적 처방
  - 7번: 실행 가능한 액션 플랜
  - 8번: 업종별 인사이트 활용
- 업종별 insights 프롬프트 자동 반영 (buildInsightsSummary)
- 새분석 버튼 → STEP 1 초기화 수정
- STEP 3 이전 버튼 → STEP 2 진단 화면으로 수정

### 5개 업종 전용 JS 파일 완성
- medical.js / finance.js / education.js / fashion.js / media.js
- wizard.js INDUSTRY_MAP 전용 파일로 교체 완료
- index.html script 태그 추가 완료
- 총 진단 파일: 22개 (common 1 + industry 12 + bizmodel 9)

### 다음 작업
- Phase 7 잔여: 솔루션 품질 강화
  - 7-1: 정부지원사업 자동 매칭
  - 7-3: 웹서치 연동 (실시간 업종 데이터)
  - ~~7-2: 경영 서적 10권 프롬프트 반영~~ ✅ 완료 (2026-04-09)
- Phase 8: Vercel 배포
- Phase 9: DART 재무분석 모듈 별도 개발 (추후)

---

## 완성 상태 (2026-03-30 기준)
- 랜딩페이지 10개 섹션 완성 (Version B 신뢰구축형, 다크네이비 테마)
- 멀티파일 구조 분리 완료 (HTML/CSS/JS 완전 분리)
- 위저드 → AI 분석 → 대시보드 전체 흐름 완성
- 위저드 1단계: `bizModel` 선택박스 + `coreStrength` 입력란 추가 (필수 필드)
- 위저드 2단계: `targetCustomer`·`competitors` 모두 필수 필드로 확정
- 위저드 3단계 입력 화면 다크테마 통일 완료 (딥네이비 배경, 골드 포인트)
- AI 엔진 v2.0: SWOT evidence 구조, KPI 10개+측정방법, 전략 owner/timeline, 로드맵 budget 포함
- 모바일 반응형 완료 (햄버거 메뉴, 2×2 통계 그리드, 1열 레이아웃)
- Hero 격자 패턴 + 골드 후광 애니메이션 완료
- 섹션 스크롤 fade-in 애니메이션 완료 (IntersectionObserver)
- 네비게이션 스크롤 blur 효과 완료
- 결과 대시보드 개선 완료
  (좌측 목차 사이드바, KPI 카드 다크테마, DEMO DATA 뱃지 위치 수정, 섹션 간격 개선)
- 글로벌 시장 실시간 롤링 배너 완료 (자체 제작, position fixed 하단 고정)
- GitHub 업로드 완료 → Vercel 배포 진행 중 (미커밋 변경 존재)

---

## 파일 구조 및 역할

```
biznavi/
├── knowledge_base/
│   ├── 12개사업모델진단.pdf          # 12개 BM 진단 설계 원본
│   ├── 16개업종진단.pdf              # 16개 업종 진단 설계 원본
│   ├── industry_full_benchmarks.csv  # 18개 업종 재무 벤치마크 (영업이익률·부채비율 등)
│   └── small_biz_cost_guide.csv      # 10개 업종 소상공인 비용 구조 (임대료·인건비·원가 비중)
├── index.html          HTML 뼈대, 인라인 CSS/JS 없음
├── css/
│   ├── style.css       공통 스타일 (위저드·로딩·모달·네비·진단 UI — 다크테마)
│   ├── landing.css     랜딩페이지 전용 (lp-* 클래스, 다크테마, 모바일 반응형)
│   └── dashboard.css   결과 대시보드 전용
└── js/
    ├── app.js          메인 코디네이터 (화면전환, 모달, 분석 실행, 햄버거 메뉴)
    ├── wizard.js       4단계 입력 위저드 로직 (v3.1)
    ├── ai-engine.js    Claude API 호출 및 데모 데이터 생성
    ├── dashboard.js    결과 렌더링 (SWOT/STP/4P/KPI/로드맵)
    ├── ticker.js       글로벌 시장 롤링 배너 (환율 실시간, 주가 장중 표시)
    └── diagnosis/
        ├── common.js               공통 경영 진단 (4영역 16항목)
        ├── industry/               업종 특화 진단 (7개)
        │   ├── mfg_parts.js        뿌리 제조 및 부품가공업
        │   ├── food_mfg.js         식품 제조 및 가공업
        │   ├── local_service.js    생활밀착형 서비스업
        │   ├── wholesale.js        전문 유통 및 도소매업
        │   ├── restaurant.js       외식 및 휴게음식업
        │   ├── knowledge_it.js     지식 서비스 및 IT개발
        │   └── construction.js     소규모 건설 및 인테리어
        └── bizmodel/               사업모델 특화 진단 (9개)
            ├── b2b_saas.js
            ├── b2c_sub.js
            ├── b2b_solution.js
            ├── b2c_commerce.js
            ├── platform.js
            ├── franchise.js
            ├── mfg_dist.js
            ├── service.js
            └── etc.js
```

### CSS 로드 순서 (index.html head)
```html
<link rel="stylesheet" href="css/style.css" />
<link rel="stylesheet" href="css/landing.css" />
<link rel="stylesheet" href="css/dashboard.css" />
```

### JS 로드 순서 (body 하단, 의존성 순)
```html
<script src="js/ai-engine.js"></script>               <!-- 의존성 없음 -->
<script src="js/dashboard.js"></script>               <!-- 의존성 없음 -->
<script src="js/wizard.js"></script>                  <!-- 의존성 없음 -->
<script src="js/diagnosis/common.js"></script>        <!-- 진단 공통 -->
<script src="js/diagnosis/industry/mfg_parts.js"></script>
<script src="js/diagnosis/industry/food_mfg.js"></script>
<script src="js/diagnosis/industry/local_service.js"></script>
<script src="js/diagnosis/industry/wholesale.js"></script>
<script src="js/diagnosis/industry/restaurant.js"></script>
<script src="js/diagnosis/industry/knowledge_it.js"></script>
<script src="js/diagnosis/industry/construction.js"></script>
<script src="js/diagnosis/bizmodel/b2b_saas.js"></script>
<script src="js/diagnosis/bizmodel/b2c_sub.js"></script>
<script src="js/diagnosis/bizmodel/b2b_solution.js"></script>
<script src="js/diagnosis/bizmodel/b2c_commerce.js"></script>
<script src="js/diagnosis/bizmodel/platform.js"></script>
<script src="js/diagnosis/bizmodel/franchise.js"></script>
<script src="js/diagnosis/bizmodel/mfg_dist.js"></script>
<script src="js/diagnosis/bizmodel/service.js"></script>
<script src="js/diagnosis/bizmodel/etc.js"></script>
<script src="js/app.js"></script>                     <!-- 위 모두 참조 -->
<script src="js/ticker.js"></script>                  <!-- 독립 실행, 의존성 없음 -->
```

---

## 랜딩페이지 10개 섹션 (완성)

| # | ID | 내용 |
|---|-----|------|
| 1 | `#lp-hero` | 풀스크린 히어로 (배지, 헤드라인, CTA 2개, 통계 바) |
| 2 | `#lp-pain` | 문제 제기 (3개 Pain 카드) |
| 3 | `#lp-value` | 가치 제안 (빅넘버 3개 임팩트 카드) |
| 4 | `#lp-features` | 6가지 기능 상세 카드 |
| 5 | `#lp-trust` | 신뢰 요소 (3개 후기 + 통계) |
| 6 | `#lp-demo` | 프로덕트 데모 (CSS 목업) |
| 7 | `#lp-pricing` | 가격표 (3플랜, PRO 골드 강조) |
| 8 | `#lp-faq` | FAQ 아코디언 (6개 항목) |
| 9 | `#lp-cta` | 2차 CTA |
| 10 | `#lp-footer` | 푸터 |
| — | `#lp-ticker` | 하단 고정 롤링 배너 (섹션 외부, fixed) |

- 네비게이션 로고 클릭 → 페이지 상단 스무스 스크롤
- 네비게이션 링크: 기능 / 후기 / 가격 / FAQ (섹션 앵커)
- `.lp-section` 스크롤 페이드인 (IntersectionObserver)
- 네비게이션 스크롤 시 `backdrop-filter: blur` 효과

---

## 디자인 기준 (전체 통일 — 다크테마)

> 위저드·로딩·모달·네비 모두 랜딩페이지와 동일한 다크테마로 통일됨

### 공통 (랜딩 + 위저드 + 네비)
- 배경: `#0A0E1A` (딥네이비)
- 카드/폼: `#0F1629`
- 입력 필드: `rgba(22,32,64,0.8)`
- 포인트: `#F5C030` (골드) / 진한: `#D4A017` / 밝은: `#FFD966`
- 텍스트: `#E8EDF5` / 보조: `rgba(255,255,255,.55)`
- 폰트: Noto Serif KR (헤딩) + Noto Sans KR (본문)

### 대시보드 (dashboard.css)
- 공통 CSS 변수(`--bg`, `--gold` 등) 그대로 사용 — 다크테마 일관성 유지
- 좌측 목차 사이드바: `flex-shrink:0; width:180px; position:sticky; top:80px`
- 레이아웃: `.dash-layout { display:flex; gap:24px }` + `.report-content { flex:1; min-width:0 }`
- 모바일(768px 이하): `.report-nav { display:none }`, `.dash-layout { display:block }`
- KPI 카드: `background:rgba(15,22,41,0.9)`, 골드 테두리 `rgba(245,192,48,.2)`
- DEMO/AI 뱃지: `.demo-badge-inline` / `.real-badge-inline` — `dSub` 단락 안에 인라인 렌더링
  - 기존 HTML의 `#demoBadge` span은 JS에서 `hidden` 처리 (레이아웃에 관여하지 않음)
- 섹션 카드 간격: `margin-bottom:32px`
- 스크롤 스파이: `.nav-link.active` 골드 강조 (dashboard.js `initScrollReveal` 내 처리)

---

## 모바일 반응형 (768px 이하)

- 햄버거 메뉴 (☰/✕ 토글): `app.js` + `.lp-mobile-menu` (landing.css)
  - 클릭 시 슬라이드 다운, 항목 클릭 시 자동 닫힘, 외부 클릭 시 닫힘
  - 배경 `#0A0E1A` 완전 불투명, `z-index:9999`, `visibility` 기반 애니메이션
- 통계 바: 4항목 2×2 그리드
- 기능 카드: 1열 레이아웃, 설명 텍스트 `0.95rem`
- 네비 버튼: 크기 축소, 로고 한 줄 고정
- 롤링 배너: 높이 40px 축소, 시계·노트 숨김, 등락률 숨김, 폰트 축소

---

## JS 모듈 공개 API

| 모듈 | 공개 함수 |
|------|----------|
| `App` | `startWizard`, `showLanding`, `showModal`, `showApiModal`, `closeModal`, `setMode`, `confirmKey`, `goStep`, `runAnalysis`, `restart` |
| `Wizard` | `goStep`, `validate`, `collect`, `animateLoading`, `reset`, `setScore`, `setMemo`, `switchDiagTab`, `prevDiagTab` |
| `AIEngine` | `callClaude`, `fakeAnalysis` |
| `Dashboard` | `render`, `initScrollReveal`, `initCountUp`, `addRipple`, `initInputChecks` |
| `lpToggleFaq` | 전역 함수 (FAQ onclick에서 직접 호출) |

- 모든 모듈은 IIFE 패턴 (`const Foo = (() => { ... })()`)
- `lpToggleFaq`는 HTML `onclick` 속성에서 호출되므로 전역 스코프 유지 필수
- `ticker.js`는 공개 API 없음 (자체 완결 IIFE, DOMContentLoaded 자동 실행)

---

## 작업 규칙

### ⚠ 반드시 지킬 것 (반복 사고 방지)
- **진단 점수는 `diagScores` 객체에만 존재한다.** DOM에서 `querySelectorAll('[id^="diag-"]')` 등으로 수집하려는 시도는 **항상 빈 객체를 반환한다** (`type="hidden"` 입력이 존재하지 않음). 점수가 필요하면 `wizard.js`의 `collectAllScores()`를 사용할 것
- **`js/*.js` 또는 `css/*.css` 수정 시 `index.html`의 `?v=` 캐시버스팅 값을 반드시 함께 갱신할 것.** 갱신하지 않으면 배포되어도 브라우저가 옛 파일을 사용해 수정이 반영되지 않는다
- **진단 컨테이너가 여러 개(common/micro/social/industry)이므로 DOM 전역 `querySelectorAll('.diag-item')`로 문항을 세면 안 된다. 활성 경로 기준으로 한정할 것.** `diagTab-common` 안에 3개가 형제로 공존하며, 미사용 컨테이너는 `hidden`일 뿐 내용이 남아 있다. 문항 수 표시(진행률 분모·탭 라벨·배너)는 전부 `_countDiagItems()` 하나를 쓰고, 분자(`_countDoneScores()`)도 같은 범위여야 100%가 성립한다
- **진단 문항을 만들 때는 그 결과가 리포트 어느 섹션에서 다뤄지는지 함께 설계할 것.** 묻고 안 쓰는 문항은 응답자의 시간을 낭비시킨다. (사회적기업 S5·S7·S8 15문항이 리포트에서 누락돼 있던 전례)
- **진단 모듈을 추가할 때는 문항뿐 아니라 결과 화면까지 함께 확인할 것** — 레이더차트·도메인 해설·진단유형 카드·정부지원사업 매칭·동종업계 비교 5곳이다. **점수 키 접두어가 다르면 결과 화면이 조용히 비어버린다**(에러가 나지 않아 발견이 늦다). 도메인 점수 함수의 반환 키와 `*_DOMAIN_EXPLAIN`의 키는 반드시 일치해야 한다 — `explainMap[key]` 조회 방식이다
- **조직 형태(사회적기업·협동조합·소셜벤처)는 업종과 다른 축이다. `industryKey`에 밀어넣지 말고 `orgType`으로 분리해서 다룰 것.** 한 기업이 동시에 컨설팅업이면서 사회적기업일 수 있다(`knowledge_it` + `social_enterprise`). 또한 `api/analyze-biz.js`는 조직 형태를 반환하지 않으므로 **AI 업종분석으로 판별하려는 시도는 항상 실패한다** — 사용자 선택(`#orgTypeSelect`)이 유일한 소스다
- **`orgType`을 `=== 'social_enterprise'` 단일 비교로 검사하지 말 것.** 협동조합·소셜벤처도 S1~S8을 사용하므로 `_isSocialOrg()`(wizard) 또는 3종 배열 포함 검사(ai-engine)를 쓴다. 단일 비교로 두면 협동조합 선택 시 화면만 사회적기업 진단이고 **점수 계산·AI 프롬프트는 micro로 빠진다**
- **진단 문항은 사용자의 주관적 해석이 개입하지 않는 형태로 물어야 한다.** "~를 하십니까"보다 "서류에 ~라고 적혀 있습니까"가 정확하다. (2026-08-06 음식점 조리를 제조업으로 오인해 오진 발생)
- **확인 필요(`conditional`)는 앱이 원리적으로 알 수 없는 항목에만 쓴다.** 사용자에게 물어보면 확정할 수 있는 항목을 `conditional`로 처리하면 진단의 실용성이 떨어진다
- **정책자금 판정은 절대 단정하지 않는다.** 앱은 쟁점과 근거 조항을 제시하고 최종 판단은 기관·컨설턴트에게 남긴다. "신청 가능합니다"/"승인됩니다" 같은 표현을 쓰지 않는다
- **예상 승인 금액을 계산하지 않는다.** 실제 승인액은 기관이 신용도 등을 반영해 개별 산정하므로 앱이 예측할 수 없다. 금액은 제도상 한도(공개 정보)만 표시한다
- **BizNavi의 `industryKey`는 표준산업분류 코드가 아니므로 제외업종 자동 판정에 사용할 수 없다.** 안내·확인 유도용으로만 쓴다
- **`collect()`의 `industry` 필드는 `#industry` select 제거(2026-04-17) 이후 항상 빈 문자열이다.** 업종 판별은 `industryKey`(영문)를 사용할 것. 한국어 라벨이 필요하면 `gov-support.js`의 `INDUSTRY_LABEL` 역매핑을 쓴다
- **정부지원사업 데이터는 `js/gov-support.js` PROGRAMS가 단일 마스터다.** 구체 금액·비율·마감일을 하드코딩하지 말 것 — 매년 바뀌므로 그 자체가 오정보가 된다. 지원 형태(`supportType`)만 유지하고 수치는 주관기관 공고로 넘긴다
- **`#revenue`(연매출)는 `type="text"` 자유 텍스트 필드다** (`"3억"`, `"비공개"` 등). 숫자 연산 전 반드시 파싱해야 하며, `Number()`를 그대로 적용하면 `NaN`이 된다
- **정책자금 진단(`fundingData`)의 미응답 표현을 임의로 바꾸지 말 것** — 라디오 미선택 `'unknown'`(≠`'none'`), 체크박스 미응답 `[]`(≠`['해당 없음']`), 숫자 미입력 `null`(≠`0`). 4단계 판정 로직이 이 구분에 의존한다

- 랜딩페이지 수정 → `landing.css` 또는 `index.html` 랜딩 섹션
- 위저드/네비/모달 스타일 수정 → `style.css`
- 모바일 반응형 수정 → `landing.css` (`@media(max-width:768px)` 블록)
- 햄버거 메뉴 동작 수정 → `app.js` 하단 햄버거 토글 IIFE
- AI 기능 수정 → `ai-engine.js`만
- 위저드 로직 수정 → `wizard.js`만
- 결과화면 수정 → `dashboard.js` + `dashboard.css`
- 롤링 배너 수정 → `ticker.js` + `landing.css` (ticker 섹션)
- `lp-` 접두사: 랜딩 전용 클래스에만 사용
- 인라인 스타일 추가 금지, 디자인 수정은 해당 CSS 파일만
- AI 진단 로직 수정 시 → `knowledge_base/` PDF 내용 우선 참조
