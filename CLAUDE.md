# BizNavi AI 프로젝트

> **과거 작업 이력은 [HISTORY.md](HISTORY.md)에 있다.**
> 특정 결정의 배경을 확인해야 할 때만 열어보라.
> 기본 작업에는 이 파일만으로 충분해야 한다.

## 배포 상태

- **GitHub**: `https://github.com/dodson108-sudo/biznavi.git`
- **Vercel**: GitHub 연동 자동 배포 (main 브랜치 push 시 자동 빌드), 서울 리전(icn1), **Hobby 플랜**
  ⚠ **함수 실행 상한 60초다.** 2026-09-18에 대시보드 배지로 확인해 정정했다(그 전까지 Pro로
  잘못 적혀 있었다). **"300초까지 여유 있다"고 오판하지 마라** — AI 호출 소요 시간을 늘리는
  변경은 전부 이 60초에 걸린다. 과거 92초·141초 초과 사고가 모두 이 상한이었다.
- **브랜치**: `main` (단일 브랜치 운영)
- **캐시버스팅**: `index.html`의 로컬 `?v=` **53곳**(외부 CDN 제외). 현재 `20260922b`

---

## 현재 진단 체계

### 진입 경로 3종
| 경로 | 시작 | 진단 모듈 |
|---|---|---|
| 경영전략 진단 | `App.startWizard()` | 규모·조직형태에 따라 분기 (아래) |
| 재무분석 | `App.showFinanceWizard()` | `finance-wizard.js` (DART·ECOS 연동) |
| 정책자금 진단 | `App.startFundingDiagnosis()` | `funding-rules.js` (step5 결격 판정) |

### 경로 판정 — `wizard.js _diagPathOf()` 단일 진입점
우선순위 **조직형태 → 창업초기 → 규모**. 판정 결과에 따라 컨테이너·점수 키 접두어가 정해진다.

| 판정 | 모듈 | 컨테이너 / 점수 키 접두어 | 문항 수 |
|---|---|---|---|
| `isSocial` (사회적기업) | `DiagSocial` S1~S8 | `diag-social-container_` | 40 + 업종 16 = **56** |
| `isSocial` (소셜벤처) | `DiagVenture` V1~V8 | `diag-venture-container_` | 40 + 16 = **56** |
| `isSocial` (협동조합) | `DiagCoop` C1~C8 | `diag-coop-container_` | 40 + 16 = **56** |
| `isStartup` (개업 1년 미만) | `startup.js` S1~S4 | `diag-common-container_` | 8 + 16 = **24** |
| `isMicro` (소상공인) | `DiagMicro` D1~D7 | `diag-micro-container_` | 35 + 16 = **51** |
| 그 외 (sme) | `DiagCommon` | `diag-common-container_` | 20 + 16 = **36** |

⚠ `DiagSme`(18문항)는 `diag-sme-container`가 `index.html`에 없어 **어떤 경로에서도 렌더링되지 않는다.**

### DiagMicro — 17업종 → 10그룹 매핑
| 그룹 | 소속 업종 키 | 문항 오버라이드 | ACTION_PLAN |
|---|---|---|---|
| `food` | `restaurant` | 29 | base 폴백(설계대로) |
| `beauty` | `local_service` (헤어·네일·피부·세탁·수선·펫샵·필라테스) | 26 | 35 |
| `retail` | `wholesale`, `fashion` | 25 | 35 |
| `edu_service` | `education` | 27 | 35 |
| `pro_service` | `medical`, `knowledge_it`, `finance`, `media` | 27 | 35 |
| `manufacturing` | `mfg_parts`, `food_mfg`, `agri_food` | 31 | 35 |
| `construction` | `construction`, `energy` | 26 | 35 |
| `trade_logistics` | `logistics`, `export_sme` | 26 | 35 |
| `facility_service` | `facility_service` (FM·빌딩관리·경비·청소·방역) | 26 | 35 |
| `etc` | `etc` + **모든 미판별 폴백** | 5 | 35 |

⚠ **폴백은 `food`가 아니라 `etc`다** — `analyze-biz.js` · `wizard.js` · `app.js` 세 곳 모두.
⚠ `industryVarMap`에 `facility_service`는 있으나 **`etc`는 없다.** `etc` 사용자는 업종 탭 자체가
숨겨져 `0 / 35`를 본다(설계대로이며 결함이 아니다 — 업종을 모르는데 특정 업종 문항을 주는 것보다 낫다).

### DiagMicro 7대 영역 (D1~D7)
`1` 경영진단·손익분석 / `2` **D2만 그룹별로 label 분기** / `3` 다채널 판로 / `4` 스마트DX /
`5` 운영자금·ESG보증 / `6` 사업정리·폐업세무 / `7` 온라인 홍보·AI 활용

D2 label: food·beauty `점포환경·온라인 노출` / retail `매장·온라인 노출` / edu_service `강의 환경·온라인 노출` /
pro_service `전문성 노출` / manufacturing `기업 신뢰도 노출` / construction `시공 실적·발주처 신뢰` /
trade_logistics `거래처 신뢰도 노출` / facility_service `관리 실적·현장 운영` / etc `온라인 노출`

### 진단 모듈 목록
| 경로 | 파일 |
|---|---|
| 규모·조직형태별 | `common.js` · `diagnosis-micro.js` · `diagnosis-sme.js` · `diagnosis-social.js` · `diagnosis-venture.js` · `diagnosis-coop.js` · `startup.js` |
| 교차·판정 | `cross-context.js` (CROSS_RULES 34개) · `funding-rules.js` |
| 업종 특화 (19개) | `agri_food` `construction` `education` `energy` `export_sme` `facility_service` `fashion` `finance` `food_mfg` `knowledge_it` `local_service` `logistics` `media` `medical` `mfg_parts` `restaurant` `wholesale` `social_enterprise` `social_venture` |
| 사업모델 (12개) | `advertising` `b2b_saas` `b2b_solution` `b2c_commerce` `b2c_sub` `deeptech` `etc` `franchise` `mfg_dist` `platform` `service` `usage_based` |

⚠ **`bizmodel/` 12개 모듈 192문항은 전혀 렌더링되지 않는다** (`TAB_ORDER`에 bizmodel 없음).
그 결과 CROSS_RULES 34개 중 21개가 `collect()`의 BM 프록시(공통 진단 도메인 평균 복사)로 발동한다.

### AI 호출 구조
| 경로 | 엔드포인트 | 특징 |
|---|---|---|
| 경영진단 micro | `claude-analyze-1/2/3` | 3회 순차, 1차는 `_SYSTEM_MICRO_1`, web_search 없음 |
| 경영진단 sme | `claude-analyze-1/2` | 1차에 web_search 포함 |
| 사회적경제 | `claude-analyze-social` | **단일 호출**, `max_tokens 6000` |
| 정책자금 | `claude-analyze-funding` | **단일 호출**, `max_tokens 6000` |

---
## 파일 구조 및 역할

```
biznavi/
├── CLAUDE.md           이 파일 — 개요·구조·규칙·남은 이슈
├── HISTORY.md          날짜별 작업 이력 (최신이 위)
├── knowledge_base/
│   ├── 12개사업모델진단.pdf          # 12개 BM 진단 설계 원본
│   ├── 16개업종진단.pdf              # 16개 업종 진단 설계 원본
│   ├── industry_full_benchmarks.csv  # 18개 업종 재무 벤치마크 (영업이익률·부채비율 등)
│   └── small_biz_cost_guide.csv      # 10개 업종 소상공인 비용 구조 (임대료·인건비·원가 비중)
├── index.html          HTML 뼈대, 인라인 CSS/JS 없음
├── api/                Vercel Serverless Functions
│   ├── claude-analyze-1/2/3.js  경영진단 AI (3분할)
│   ├── claude-analyze-social.js 사회적경제 AI (단일)
│   ├── claude-analyze-funding.js 정책자금 AI (단일)
│   ├── analyze-biz.js  AI 업종 판별 (18개 분류)
│   ├── dart-lookup.js · bok-avg.js · kosis-survival.js · bizinfo.js
│   ├── biz-lookup.js · ocr-scan.js
│   └── corp-list.json  DART 기업목록 109,030개 (빌드 시 생성)
├── lib/
│   └── claude-stream.js  SSE 스트리밍 + continuation (⚠ api/ 밖에 둘 것)
├── css/
│   ├── style.css       공통 스타일 (위저드·로딩·모달·네비·진단 UI — 다크테마)
│   ├── landing.css     랜딩페이지 전용 (lp-* 클래스, 다크테마, 모바일 반응형)
│   ├── dashboard.css   결과 대시보드 전용
│   └── print.css       PDF 인쇄 전용
└── js/
    ├── app.js          메인 코디네이터 (화면전환, 분석 실행, 햄버거 메뉴)
    ├── wizard.js       입력 위저드 + 진단 렌더링 + 경로 판정(_diagPathOf)
    ├── ai-engine.js    Claude API 호출 및 프롬프트 생성
    ├── dashboard.js    결과 렌더링 (경영진단·사회적경제·정책자금 3종)
    ├── finance-wizard.js  재무분석 (DART·ECOS)
    ├── ppt-export.js · bep-simulator.js · history-tracker.js
    ├── gov-support.js · pattern-db.js · reference-db.js · industry-trends.js
    ├── hero-bg.js · hero-canvas.js · ticker.js
    └── diagnosis/
        ├── common.js · diagnosis-micro.js · diagnosis-sme.js
        ├── diagnosis-social.js · diagnosis-venture.js · diagnosis-coop.js
        ├── startup.js · cross-context.js · funding-rules.js
        ├── industry/    업종 특화 진단 (19개 파일)
        └── bizmodel/    사업모델 특화 진단 (12개 파일 — 현재 미렌더링)
```

### CSS 로드 순서 (index.html head)
```html
<link rel="stylesheet" href="css/style.css" />
<link rel="stylesheet" href="css/landing.css" />
<link rel="stylesheet" href="css/dashboard.css" />
```

### JS 로드 순서 (body 하단, 의존성 순)
`ai-engine` → `dashboard` → `wizard` → `diagnosis/*`(common → industry 19 → bizmodel 12 →
diagnosis-micro/sme/social/venture/coop → cross-context → funding-rules) → `app.js` → `ticker.js`

⚠ **`app.js`는 반드시 마지막**(위 모듈 전부 참조). `ticker.js`는 독립 실행.
⚠ **새 스크립트를 추가하면 `index.html`의 `?v=` 개수가 늘어난다** — 캐시버스팅 일괄 치환 시 확인할 것.

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

---

## 작업 규칙

### ⚠ 반드시 지킬 것 (반복 사고 방지)
- **진단 경로 판정은 `wizard.js`의 `_diagPathOf()` 한 곳에서만 한다.** `{ isSocial, isMicro, isStartup, orgMod, containerId, keyPrefix }`를 반환하며 판정 우선순위는 **조직형태 → 창업초기 → 규모**다.
  **왜**: 점수를 저장하는 키 접두어는 *어느 컨테이너에 그렸는가*로 정해지고(`loadDiagnosisUI`), 읽는 정규식은 *어느 경로라고 판정했는가*로 정해진다(`showDiagReveal`·`collect`). **두 곳이 각자 판정하면 조건이 하나만 어긋나도 A 접두어로 저장하고 B 접두어로 읽어 전 영역이 0이 된다.** 예외가 나지 않아 화면이 조용히 비고 발견이 매우 늦다.
  **언제 터졌나 — 같은 패턴으로 세 번**:
  ① 2026-08-16 사회적기업 — `bizScale`만 보고 `orgType`을 몰라 `diag-social-container_s1_1`을 하나도 못 읽음(전 영역 0)
  ② 2026-09-02 소셜벤처 — 접두어 정규식을 하드코딩해 모듈이 늘자 매칭 실패(레이더 빔·진행률 오류)
  ③ 2026-09-03 `e7c4056` — `loadDiagnosisUI`의 `isMicro`에만 `!isStartupMode`를 넣고 `showDiagReveal`은 그대로 둠. 개업 1년 미만 소상공인이 STARTUP을 다 풀고도 D1~D7로 읽혀 전 영역 0 → **"D1 미입력"으로 최종 보고서 진입 자체가 막혔다.** 그 커밋의 검증 항목은 문항 수·진행률·탭 라벨·활성 컨테이너뿐이고 **결과 화면이 빠져 있었다**
  ⚠ `isSocial`이 맨 앞이어야 한다 — 사회적경제도 `bizScale`은 `micro`라 순서가 바뀌면 영원히 micro로 빠진다. `isStartup`은 `isMicro`보다 앞이다 — 개업 1년 미만은 실적 기반 35문항을 답할 수 없다.
  ⚠ **`dashboard.js`·`ppt-export.js`는 아직 이 함수를 쓰지 않는다**(각자 `fd.bizScale`로 판정). 네 번째 사고를 막으려면 결국 전부 거쳐야 한다.
- **AI 프롬프트의 출력 명세(JSON 구조)를 두 곳에 두지 않는다.** 시스템 프롬프트에 두든 유저 프롬프트에 두든 **한 곳만** 둔다.
  **왜**: 한 요청 안에 상반된 두 명세가 들어가면 **모델은 큰 쪽을 따라간다.** 작은 쪽을 적어 둬도 소용이 없다.
  **언제 터졌나**: 2026-09-08 — micro 1차가 sme용 `SYSTEM`(7,464토큰, 그중 sme JSON 템플릿 4,453토큰)을 그대로 받고 있었다. 그 템플릿은 SWOT 4분면 × 6개 `{item,evidence}` 24객체 + `kpi` 10개 + `roadmap` + `keyStrategies` + `leanCanvas` + `specializedAnalysis` + `fourP`를 요구하는데, `buildPrompt1`의 micro 분기는 "7개 필드만, 각 1개"라고 말했다. 결과는 output **8,964토큰 / 92초** — **Vercel Hobby 60초 상한 초과의 직접 원인**이었다. `_SYSTEM_MICRO_1`로 명세를 한 곳에 모아 47초가 됐다.
  ⚠ 규모·유형별로 출력이 다르면 **시스템 프롬프트를 분기**하라(`_SYSTEM_MICRO_1` / `SYSTEM`). 공용 상수를 그대로 보내고 유저 프롬프트에서 "이번엔 이것만"이라고 덧붙이는 방식은 **작동하지 않는다.**
  ⚠ **소비처가 하나뿐인 상수는 "공용"이 아니다.** `SYSTEM`은 sme 1차 **한 곳**만 쓴다
  (`_isMicro ? _SYSTEM_MICRO_1 : SYSTEM`). 2026-09-08 주석의 "SYSTEM은 건드리지 마라"는
  micro 작업 중 회귀를 막으려던 것이었지 그 내용이 옳다는 뜻이 아니었고, 실제로 **같은
  자기모순이 sme에 그대로 남아 2026-09-18까지 갔다**(1차가 만들고 2차가 덮어 버리는
  `kpi`·`roadmap`·`leanCanvas` 템플릿 1,964토큰). **주석의 금지 범위를 그 주석이 쓰인
  맥락과 함께 읽어라.**
  ⚠ 여러 호출이 실제로 공유하는 상수를 줄여서 해결하지는 마라 — 다른 경로 품질이 깎인다.
  ⚠ 필드를 빼기 전에 **소비처를 전수 확인**하라. 화면에 없어도 다른 호출의 입력일 수 있다 — micro의 `swot`은 `sec-swot`이 숨겨져 있어도 `_buildPrompt2Micro`가 `strengths[0]`을 읽고, `roadmap`은 `_buildPrompt3Micro`가 `[0].tasks[0]`을 읽는다. 반대로 `sec-stp` 섹션이 없다고 `stp`를 버려진 것으로 판단하면 틀린다 — `sec-market-micro`가 실제로 쓴다.
- **진단 점수는 `diagScores` 객체에만 존재한다.** DOM에서 `querySelectorAll('[id^="diag-"]')` 등으로 수집하려는 시도는 **항상 빈 객체를 반환한다** (`type="hidden"` 입력이 존재하지 않음). 점수가 필요하면 `wizard.js`의 `collectAllScores()`를 사용할 것
- **`js/*.js` 또는 `css/*.css` 수정 시 `index.html`의 `?v=` 캐시버스팅 값을 반드시 함께 갱신할 것.** 갱신하지 않으면 배포되어도 브라우저가 옛 파일을 사용해 수정이 반영되지 않는다
- **진단 컨테이너가 여러 개(common/micro/social/industry)이므로 DOM 전역 `querySelectorAll('.diag-item')`로 문항을 세면 안 된다. 활성 경로 기준으로 한정할 것.** `diagTab-common` 안에 3개가 형제로 공존하며, 미사용 컨테이너는 `hidden`일 뿐 내용이 남아 있다. 문항 수 표시(진행률 분모·탭 라벨·배너)는 전부 `_countDiagItems()` 하나를 쓰고, 분자(`_countDoneScores()`)도 같은 범위여야 100%가 성립한다
- **모든 커밋에 `HISTORY.md` 이력 기록을 포함한다.** 지시에 명시되지 않아도 기록한다. **"무엇을 했다"가 아니라 "왜 그렇게 했는지"를 남긴다** — 근거가 없으면 나중에 되돌려진다. 검토해서 채택하지 않은 대안과 그 이유도 함께 적는다. 새 섹션은 **맨 위**에 추가한다(최신이 위).
  **`CLAUDE.md`는 현재 구조·규칙·남은 이슈가 바뀔 때만 수정한다.**
  ⚠ **이력을 `CLAUDE.md`에 쌓지 마라** — 파일이 커지면 매 세션 읽는 비용이 늘어난다(6,410줄 / 456KB까지 커져 2026-09-16에 분리했다).
  ⚠ 이력 중에도 **재발 방지 근거**("이 패턴은 세 번 터졌다")와 **설계 판단 근거**는 `CLAUDE.md`의 작업 규칙·주의사항으로 **요약해 흡수**시킨다.
- **`HISTORY.md`는 통째로 읽지 마라. 파일이 크다(6,298줄).** 특정 결정의 배경을 확인할 때는 **grep이나 검색으로 해당 섹션만 찾아** 읽어라. 전체를 읽으면 분리한 의미가 없어진다.
- **`collectAllScores()`는 평면 숫자 맵이다 — 메모는 담기지 않는다.** `DiagMicro.calcScores`·`CrossContext.buildScoreMap`이 이 계약에 의존하므로 바꾸지 말 것. 메모가 필요하면 `buildPromptSummary(scores, group, memos)`처럼 **별도 인자**로 넘긴다
  ⚠ 메모를 평면 맵에 섞으면 `Number()` 소비처에서 **전 항목 `NaN`**이 된다(2026-09-17 실제 사고).
  ⚠ 현재 메모 인자를 받는 모듈: `DiagMicro`(3번째) · `DiagSocial`·`DiagVenture`·`DiagCoop`(2번째) ·
    `DiagCommon`(3번째, 2번째는 **업종 키**다 — 그룹이 아니다).
  ⚠ **`collectAllScores()`는 `_activeContainers` 접두어로 한정된다**(2026-09-21). `reset()`을 거치지
    않는 재진단 흐름의 잔존 점수를 막기 위한 것이며, **주 진단 + `diag-industry-container_` 두
    컨테이너가 활성**이다 — `keyPrefix` 하나로 좁히면 업종 특화 16문항이 AI에 가지 않는다.
    판정은 `_isActiveScoreKey()` 한 곳이고 메모 수집도 같은 판정을 쓴다.
    활성 목록이 비면 좁히지 않는다(전부 통과) — `{}`를 반환하면 점수가 통째로 사라진다.
- **AI에 넘기는 요약에서 응답자 메모는 맨 앞에 둔다.** 요약 앞부분만 잘라 쓰는 후속 호출 경로가 있어
  (`microPrompt.substring(0, 500)`) 뒤에 두면 통째로 사라진다. **"메모를 우선하라"는 지시문도
  메모 블록 안에 둔다** — 밖에 두면 메모가 없는 사용자에게도 나가 모델이 없는 메모를 근거로 서술한다
- **증상을 그룹에서 찾기 전에 어느 진단 모듈이 렌더링되는지부터 확인할 것.** micro는 `DiagMicro`, sme는 `DiagCommon`이 나온다. 2026-09-07에 "제조업에 플랫폼 리뷰가 나온다"는 보고를 `manufacturing` 그룹에서 찾다가, 실제 출처가 `DiagCommon`(sme 경로)임을 렌더링으로 확인한 전례가 있다
- **`DiagCommon`의 업종 분기는 `getSchema(industryKey)` 한 곳에서만 한다 — 그룹을 계산해 넘기지 마라.**
  **왜**: DiagCommon은 **17업종 → 4그룹**(`manufacturing`·`field_service`·`trade_retail`·`service`)이고
  DiagMicro는 **17업종 → 10그룹**이라 **같은 업종이 다른 그룹으로 간다** — `logistics`는 DiagCommon에서
  `field_service`, DiagMicro에서 `trade_logistics`다. 호출부가 구분하는 순간 실수가 난다.
  업종→그룹 변환은 `INDUSTRY_GROUP_MAP`·`getGroup()`으로 모듈 안에 가둔다. 미전달·빈 문자열·`null`·미등록
  오타는 전부 기준 그룹 `service`로 폴백한다(예외를 내지 않는다).
  ⚠ **`DiagCommon.INDUSTRY_GROUP_MAP`과 `DiagMicro.INDUSTRY_GROUP_MAP`은 이름만 같고 내용이 다르다.**
  그래서 공개 API(`getSchema`·`getDomains`·`detectCrossWarnings`·`buildPromptSummary`)는 전부
  **업종 키**만 받는다 — 그룹을 받는 인자는 두지 않는다. `DiagCommon.getDomains(industryKey)`와
  `DiagMicro.getDomains(group)`은 **인자 의미가 다르니** 복사해 쓰지 말 것.
  ⚠ 영역 설명은 `DOMAIN_DESC_BY_GROUP`(D1·D2 × 3그룹, `service`는 기본값)이 `desc`만 덮는다.
  `label`·`key`·`weight`·`id`·`icon`은 분기 금지 — `calcScores`가 `label`을 레이더차트·PPT로 흘려보낸다.
  ⚠ 교차 경고 문구는 `WARN_WORDING`(5규칙 × 4그룹)이 **완성된 문장 통째로** 관리한다.
  DiagMicro식 어절 토큰을 쓰지 마라 — 받침이 바뀌며 조사가 파손된다(주의사항 ②).
  `level`·`code`는 분기 금지, `msg`만 덮는다.
  ⚠ 문항 오버라이드(`INDUSTRY_WORDING`)는 **"네 필드 전부 or 아예 없음"**이다.
  본문을 고치는 문항은 `label`·`question`·`guide`·`scale`을 전부 다시 쓰고, 고칠 이유가 없으면
  **오버라이드를 만들지 않는다**(기본과 같은 값을 넣으면 죽은 오버라이드다 — 주의사항 ⑧).
  일부만 덮으면 나머지가 기본 `ITEMS`에서 상속돼 **질문과 척도가 서로 다른 것을 말한다**.
  예외는 `guide` 하나만 다른 `3_1`·`3_4`·`4_3`뿐이며, 그 경우에도 **상속되는 본문이 업종 중립인지
  확인**해야 한다 — 상속 필드를 안 보는 것이 주의사항 ③의 실제 사고다.
  ⚠ 현재 3그룹 × 14건 = **42개 오버라이드가 집필돼 있다**(2026-09-18). `service`는 기준 그룹이라
  비어 있고, `1_3`·`1_4`·`4_1`·`4_2`·`4_4`·`5_3` 6문항은 기본이 이미 중립이라 어느 그룹도 덮지 않는다.
  ⚠ `key`·`weight`·`id`·`ai_trigger`는 분기 금지 — 점수 계산과 교차 경고가 의존한다.
  ⚠ `guide`에는 `POS`·`식재료` 같은 업종어가 의도적으로 들어가므로 **전용어 검사는 `label`·`question`·`scale`만 대상으로 할 것**
  ⚠ 본문(`label`·`question`·`scale`)에 **영어 약자를 쓰지 않는다.** 풀네임과 정의는 `guide`에 둔다
  (`생산관리시스템(MES, …)`·`창고관리시스템(WMS, …)`). `AI`만 예외로 본문에 쓴다.
- **진단 데이터 객체를 가공할 때 키를 골라 담지(화이트리스트) 마라. `Object.assign({}, data, {바꿀 것})`으로 통과시켜라.**
  **왜**: 구 `COMMON_DIAGNOSIS`는 `{title, description, insights}`, 현 `DiagCommon`은 `{id, label, icon}`이다.
  화이트리스트로 다시 담으면 **스키마가 바뀐 순간 새 키가 조용히 탈락**한다. `renderDiagModule`의
  `data.label || data.title`이 빈 문자열이 되어 **영역 제목이 통째로 사라지는데 예외가 나지 않는다.**
  `_applyIndustryWording`과 `_injectDxDetect`가 둘 다 이 패턴이었다(2026-09-17 제거·수정)
- **DiagMicro는 "기본 ITEMS는 업종 중립 · INDUSTRY_WORDING이 그룹별로 덮어쓰기" 구조다.** 새 문항을 기본 ITEMS에 외식업 기준으로 쓰지 말 것 — 오버라이드가 없는 그룹은 그 문구를 그대로 받는다. 그리고 **label/question만 덮고 scale을 빠뜨리면 5단계 서술이 외식 문구로 남는다**(D1·D2에서 실제로 그랬다). `guide`(업종별 예시)까지 5그룹 전부 채울 것
- **DiagMicro에서 `ITEMS`를 직접 참조하면 그룹 오버라이드가 무시된다.** 화면은 미용실인데 AI 프롬프트·경고 문구는 외식으로 나가는 사고가 `buildPromptSummary`·`detectCrossWarnings` 두 곳에서 실제로 있었다. 문항 내용(label·question·scale)이 필요하면 반드시 **`getSchema(group).items`**를 쓸 것. 키만 필요한 경우(`calcScores`)는 `ITEMS`로 충분하다.
- **`DiagMicro`의 `DOMAINS.label`은 표시 전용이며 키로 쓰이지 않는다(2026-09-16 전수 추적 확인). 따라서 그룹별 분기가 가능하다.**
  `HistoryTracker`는 5대 역량(`finance`·`hr`·`bm`·`future`·`differentiation`)을 쓰며 D1~D7과 무관하다.
  ⚠ 단 **label 소스가 4곳**이므로 한 곳만 고치면 화면·레이더차트·PPT·AI 프롬프트가 서로 다른 이름을 표시한다:
  ① `getSchema`(진단 화면) ② `calcScores`(PPT·대시보드) ③ `wizard.js _calcMicroDomainScores`(레이더차트)
  ④ `wizard.js MICRO_DOMAIN_EXPLAIN`(해설 카드).
  **②③은 `DiagMicro.getDomains(group)` 한 곳에서 파생시켰고 ④는 `MICRO_D2_EXPLAIN_BY_GROUP`이 따로 관리한다** —
  새 분기를 추가할 때 네 곳이 전부 같은 값을 내는지 반드시 확인할 것.
  ⚠ `calcScores(scores, group)`에 group을 넘기지 않으면 **공통 label로 폴백**한다(undefined가 아니다).
  ⚠ **`key`·`weight`·`id`는 여전히 절대 분기 금지.** 점수 계산과 렌더링이 이 값에 의존한다.
- **`DOMAINS.desc`·해설 카드(`*_DOMAIN_EXPLAIN`)에는 약자를 쓰지 않는다.** 둘 다 `guide`가 없는 자리이고 점수 바로 아래 첫 화면에 보인다. 2026-09-07 전문용어 정리 당시 **`wizard.js`가 검사 범위에 없어** `ACM`·`프라임코스트`·`로컬SEO`·`D2C`가 해설에 그대로 남아 있었다(2026-09-16 정리). 검사 대상에 `wizard.js`를 반드시 포함할 것
- **진단 문항을 만들 때는 그 결과가 리포트 어느 섹션에서 다뤄지는지 함께 설계할 것.** 묻고 안 쓰는 문항은 응답자의 시간을 낭비시킨다. (사회적기업 S5·S7·S8 15문항이 리포트에서 누락돼 있던 전례)
- **진단 모듈을 추가할 때는 문항뿐 아니라 결과 화면까지 함께 확인할 것** — 레이더차트·도메인 해설·진단유형 카드·정부지원사업 매칭·동종업계 비교 5곳이다. **점수 키 접두어가 다르면 결과 화면이 조용히 비어버린다**(에러가 나지 않아 발견이 늦다). 도메인 점수 함수의 반환 키와 `*_DOMAIN_EXPLAIN`의 키는 반드시 일치해야 한다 — `explainMap[key]` 조회 방식이다
- **`gov-support`의 `orgType`과 `orgAffinity`는 역할이 다르다.** `orgType` = **자격 제한**(해당 조직 형태만 신청 가능, `match()` 게이트에서 제외 판정) / `orgAffinity` = **적합도 가점**(자격은 열려 있으나 특정 형태에 더 적합, 게이트에 관여하지 않음). TIPS는 기술창업 전반이 대상이므로 `orgType`이 아니라 `orgAffinity`가 맞다 — `orgType:'venture'`를 붙이면 **일반 기업 결과에서 사라진다**
- **통합 카드 안의 하위 블록(`.sub-block`) 렌더 함수는 카드를 숨기면 안 된다 — 자기 블록만 토글하고 내용 유무를 반환한다.** 카드 표시 여부는 `render()`가 블록 결과를 OR로 합쳐 **한 곳에서** 정한다.
  **왜**: sme 8섹션(2026-09-18)에서 한 카드가 여러 블록을 담는다 — `sec-diag`(진단+유형별특화) · `sec-stp`(STP+린캔버스) · `sec-six-systems`(핵심전략+6시스템) · `sec-plan90`(KPI+로드맵+90일). 블록 함수가 카드를 숨기면 **옆 블록의 내용까지 통째로 사라지는데 예외가 나지 않는다.**
  ⚠ 흡수된 5개(`sec-consulting`·`sec-lean-canvas`·`sec-strategy`·`sec-kpi`·`sec-roadmap`)는 **최상위 섹션이 아니라 하위 블록**이다. 목차 href·스크롤 스파이(`allSecIds`)·`print.css`의 `break-before: page`에 넣지 말 것 — 통합 카드가 한가운데서 쪼개진다.
  ⚠ **카드 id는 micro가 목차 href로 쓰는 쪽을 남겼다**(`sec-six-systems`·`sec-plan90`). 반대로 합치면 micro 목차 링크가 죽는다.
- **`ppt-export.js`의 색은 활성 팔레트 `TH` 하나만 참조한다.** 슬라이드 코드에 16진 색상을
  직접 쓰거나 `LEGACY`·`THEME`을 직접 참조하지 마라. 팔레트 선택은 `download()`의
  유형 분기 **직전 한 곳**(`_useTheme`)에서만 한다.
  **왜**: `TH`는 모듈 변수다. 빌더 안에서 갈아끼우면 다음 다운로드에 이전 유형의 팔레트가 남고,
  헬퍼가 한쪽 팔레트를 직접 붙잡으면 **그 헬퍼가 그린 슬라이드만 옛 색으로 남는다** —
  한 문서 안에서 색이 섞이는데 예외가 나지 않는다.
  ⚠ 현재 `THEME`(남색·금색·신호색, 본문 상단 띠)을 쓰는 것은 **sme 경로뿐**이고
    micro·사회적경제·정책자금은 `LEGACY`로 출력이 불변이다(2026-09-21 1단계).
    두 팔레트는 **키 이름이 같아야 한다** — 그래야 헬퍼가 분기 없이 양쪽을 그린다.
  ⚠ 팔레트 선택 조건을 `kind === 'sme'`로 쓰지 마라. `_buildSme`는 `else` 폴백이라
    더 넓다 — 조건이 갈리면 표지와 본문의 색 체계가 서로 달라진다.
  ⚠ 색에 의존하는 값은 **상수가 아니라 함수**로 둔다(`_levelColor()`). 상수는 모듈 로드
    시점의 팔레트를 박아버린다.
  ⚠ 본문 상단 띠는 팔레트의 `band` 플래그로만 갈린다 — 빌더에서 유형을 보고 그리지 마라.
- **리포트 출력물(PDF·PPT)을 만들 때 유형 판별 분기를 새로 만들지 말 것.** `Dashboard.reportKind()`·`getReportContext()`가 기존 `_isSocialFd()`·`_orgKind()`·`bizScale`·`purpose` 판정과 섹션 라벨·영역 매핑을 그대로 넘겨준다. **AI 결과는 `render()`가 DOM에 밀어넣고 버리므로** `_lastData`에 보관된 것을 쓰고, 유형 전환 시 초기화되는지 반드시 확인할 것 — 이전 회사 데이터가 출력물에 섞이는 것이 최악이다
- **조직 형태별 진단 모듈은 `_orgDiagModule(orgType)` 한 곳에서만 고른다.** 컨테이너 id·점수 키 접두어·영역 목록은 전부 모듈의 `KEY_PREFIX`·`DOMAINS`에서 파생시킨다 — 정규식이나 문자열을 하드코딩하면 모듈이 늘어날 때 매칭이 하나도 안 돼 **레이더차트가 조용히 비고 진행률이 틀린다**(사회적기업·소셜벤처 때 각각 겪음). dashboard는 `fd.orgDiagKeyPrefix`를 쓴다
- **진단 결과 필드는 `orgPrompt`/`orgWarnings`를 쓴다.** `socialPrompt`/`socialWarnings`는 구 필드로 병행 유지 중이며 협동조합 작업 후 제거 예정 — 새 코드에서 쓰지 말 것
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

### 사용량 관리 — 매 작업에서 반드시 지킬 것

> **왜**: 이 파일과 대화 이력은 매 요청에 통째로 다시 실린다. 읽은 양이 곧 비용이며,
> 한 번 부풀린 컨텍스트는 그 세션 내내 반복해서 청구된다.

1. **`CLAUDE.md`는 항상 최소로 유지한다.** 현재 작업에 필요 없는 내용은 `HISTORY.md`로 옮긴다.
   매 세션 읽히므로 **크기가 곧 비용**이다.
2. **push·검증이 끝나면 사용자에게 `/clear`를 권한다.** 쌓인 대화가 매번 함께 전달돼 비용이 누적된다.
   ⚠ **작업 중간이나, 조사 결과를 보고 사용자가 판단해야 할 때는 권하지 않는다** — 맥락이 사라진다.
3. ⚠ **대량 파일 읽기는 반드시 사전 허락을 받는다.** "전수 조사"·"전수 확인"·"전체를 훑어" 같은
   지시를 받아도 **대상 파일이 크면 먼저 알리고 허락을 받는다.**

   | 파일 | 크기 | |
   |---|---|---|
   | `js/diagnosis/diagnosis-micro.js` | 386KB | 가장 큼 |
   | `js/ai-engine.js` | 303KB | |
   | `js/wizard.js` | 206KB | |
   | `HISTORY.md` | 438KB | **통째로 읽지 말 것** — grep으로 해당 섹션만 |
   | `js/dashboard.js` | 107KB | |
   | `js/diagnosis/common.js` | 30KB | |

   ⚠ **`diagnosis-micro.js`를 건드리는 작업은 그룹 단위로 나눈다.** 10그룹을 한 커밋에 넣지 않는다.
   ⚠ **작업과 무관한 파일을 "참고용"으로 열지 않는다.** 다른 모듈의 구현 방식이 궁금해도
     지시에 없으면 열지 않는다.
4. **답변 첫 줄에 이번 작업에서 읽을 파일과 크기를 명시한다.**
   예: `읽는 파일: common.js(30KB) / 안 읽는 파일: diagnosis-micro.js`
5. **검증 스크립트는 줄 번호를 하드코딩하지 않는다 — 앵커로 블록을 찾는다.**
   커밋 하나만 들어가도 어긋나 재작성 비용이 발생한다(근거는 주의사항 ②-2).

---

## 주의사항 — 실제로 반복된 사고 패턴

> 전부 이 저장소에서 **두 번 이상 일어난 일**이다. 근거 기록은 HISTORY.md에 있다.

### ① 부분 문자열 오탐 — 용어 검사기는 단어 경계를 본다 (5회)
| 검사어 | 오탐 | 시점 |
|---|---|---|
| `포스` | `포스터` | 2026-09-04 |
| `네일` | `썸네일` | 2026-09-11 |
| `환율` | `전환율` | 2026-09-10 |
| `자문` | `전자문서` | 2026-09-15 |
| `수율` | `이수율` | 2026-09-18 |

**실제 위반과 오탐을 분리해서 세지 않으면 "0건"이라는 결론 자체가 틀린다.**
→ **한 낱말이 다른 낱말의 꼬리가 될 수 있으면 앞말을 붙여 늘려 잡아라** (`수율`→`공정 수율`).
→ 한국어에는 단어 경계가 없다. `\b`로 해결하려는 시도는 **한글 뒤에서 절대 매치되지 않는다** —
   JS의 `\b`는 ASCII `\w` 기준이라 `/\d+\s*배\b/` 같은 패턴은 조용히 죽는다(2026-09-18 실제 발견).
   뒤에 올 수 있는 글자를 전방탐색으로 직접 제한할 것: `/\d+\s*배(?=[\s,.·)]|$)/`

### ②-1 조사 파손 검사기를 받침 코드포인트만으로 만들면 안 된다 — 전부 오탐이 난다
2026-09-17에 받침 코드포인트로 조사 일치를 전수 검사했더니 **28건이 전부 오탐**이었다.
- **용언 관형형**이 조사로 잡힌다 — `없는`·`있는`·`찾는`·`남는`·`묶여 있는`
- **명사 일부**가 조사로 잡힌다 — `평가`·`단가`·`불가`·`상가`·`원가`
**형태소 분석 없이 조사와 어미는 구분되지 않는다.** 대신:
1. **실제 파손 패턴을 직접 나열**하라 — `서비스을`·`상품를`·`작업를`·`자리이` 류
2. **변경한 문자열은 전부 육안 확인**하라 (파일로 덤프해 읽는다)
3. 조사 파손은 *받침이 바뀌는 단어 치환*에서만 생긴다. 문장을 통째로 새로 썼다면
   그 경로 자체가 없으므로 검사 결과보다 그 사실이 더 강한 근거다
⚠ **검사 결과가 이상하면 코드가 아니라 검사기를 먼저 의심하라.** 주의사항 ①과 같은 교훈이다.

### ②-2 검증 하네스에 줄 번호를 하드코딩하지 마라 — 커밋 하나에 깨진다
`verify.js`가 `wizard.js`를 `slice(268, 580)`으로 잘라 썼다가 바로 다음 커밋에서 깨졌다.
**앵커 방식으로 작성하라** — `findIndex(l => l.includes('DX 탐지 질문'))`로 블록 경계를 찾는다.
파일을 줄 범위로 수정할 때도 **삭제 전 앵커 assert**를 걸어라. 실제로 2회 불일치해
오삭제를 사전 차단했다(줄이 한 칸 밀려 있었다).

### ② 한국어 조사 파손 — 받침이 바뀌는 치환은 조사까지 본다 (2회)
`시술`(받침 ㄹ) → `서비스`(받침 없음) 치환이 `저수익 서비스을`·`주요 서비스은`을 만들었다.
- **받침은 코드포인트로 판정하라** — `(charCode - 0xAC00) % 28`
- ⚠ **ㄹ 받침(`% 28 === 8`)은 `으로`가 아니라 `로`**를 쓴다(서울로, 채널로). 수동 분류하면 오탐이 난다
- 치환 후 `서비스을`·`상품를`·`작업를`·`자리이` 류 패턴을 **반드시 재검사**할 것

### ③ 오버라이드는 `label`·`question`·`scale`·`guide` **네 필드를 전부** 본다 (3회)
`question`·`scale`만 중립화하고 `label`을 기본 ITEMS에서 상속받아 전용어가 그대로 나간 사고가
6-3(`2_1`) · 6-6(`2_2`·`7_4`·`7_5`) · 그 전 D1~D2에서 반복됐다.
**오버라이드 블록만 훑는 검사는 상속 필드에 닿지 않는다.**

### ④ 긴 패턴 우선 — 치환 순서를 어기면 조용히 누락된다
`계산 대기 지연율`(짧은 것)을 먼저 적용해 `피크타임 … 계산대 병목이나…`(긴 것)가 미적용됐다.

### ⑤ 같은 이름의 테이블이 둘 이상이면 패치에 앵커를 명시한다
`DOMAIN_DESC_BY_GROUP`과 `INDUSTRY_WORDING`에 같은 그룹명 키가 있어, 텍스트 패치가
앞의 것을 잡고 그룹 경계를 넘어 다른 그룹 문항을 덮은 사고가 있었다(2026-09-04).
→ **앵커 이후에서만 탐색 + 그룹 경계 assert**를 걸 것.

### ⑥ 셸 경유 패치에서 이스케이프는 층을 하나 잃는다
`\b`를 쓰려다 백슬래시가 소실돼 **실제 백스페이스 문자(0x08)가 파일에 기록된** 사고가 있었다.
→ 커밋 전 **제어문자 검사(0x00~0x1F, 개행·탭 제외)** 를 돌릴 것.

### ⑦ 회귀 기준선은 "직전 커밋"이다 — 그리고 단정문의 수명을 구분하라
여러 커밋에 걸친 작업에서 기준선을 작업 시작 이전 스냅샷으로 잡아 "불변" 검사가 거짓 실패했다.
→ `git show HEAD:<path>` 기준으로 잡을 것.

⚠ **기준선만 맞춰도 부족하다. 단정문이 "이 커밋에서만 참"인지 "언제나 참"인지 구분해 써라.**
2026-09-18에 하네스 전제 4개가 한꺼번에 무너져 거짓 실패를 냈다:

| 박아 둔 단정 | 실제 수명 | 영구 불변식 |
|---|---|---|
| `INDUSTRY_WORDING = {}` | 2-1 골격 커밋 한정 | 오버라이드 **없는 그룹**에서만 원본 참조 검사 |
| `기본 ITEMS == HEAD` | 문구를 안 고치는 커밋 한정 | **키 구성·`ai_trigger`·scale 단계 수** 불변 |
| `getSchema == HEAD` | 같음 | 기준선을 HEAD가 아니라 **같은 모듈의 `ITEMS`**로 |
| `오버라이드에 백분율 0건` | 근거 수치가 없던 시절 한정 | **본문에 수치 0건 + guide 수치는 출처와 함께** |

마지막 줄이 핵심이다 — 진짜 규칙은 "수치 금지"가 아니라 **"출처 없는 수치 금지"**였다.
규칙을 실제보다 좁게 적어 두면 정당한 변경이 회귀로 잡힌다.

### ⑧ 죽은 오버라이드 — 기본과 글자까지 같으면 실효가 0이다
`manufacturing 5_1` · `retail 5_1`에서 실제로 발생했다.
→ **"실효 오버라이드 개수"를 세어** 기대치와 맞는지 확인할 것.

### ⑨ 화면에서 사라졌다고 버려지는 것이 아니다
micro의 `swot`은 `sec-swot`이 숨겨져 있어도 `_buildPrompt2Micro`가 `strengths[0]`을 읽고,
`roadmap`은 `_buildPrompt3Micro`가 `[0].tasks[0]`을 읽는다. 반대로 `sec-stp` 섹션이 없다고
`stp`를 버려진 것으로 판단하면 틀린다 — `sec-market-micro`가 실제로 쓴다.
→ **필드를 빼기 전에 소비처를 전수 확인**할 것.

### ⑩ 렌더링 오류를 AI 실패로 분류하지 마라
`_renderSolution()`을 `try` 안에 두면 AI 성공 → 렌더 실패 시 결과를 지우고
**무한 "다시 시도" 루프**가 된다. `try` 밖으로 빼고 자체 오류 처리를 붙일 것.

### ⑪ 실패 시 가짜 데이터를 보여주지 마라
`fakeAnalysis` 계열은 사용자가 자기 회사 분석으로 오인한다. 실패한 섹션만 에러 표시하고
나머지는 정상 렌더링한다(정책자금·사회적경제가 이미 이 방식).

### ⑫ 법령 수치는 확신한 것만 쓴다
과태료 금액·최저임금액·업종별 부채비율 기준처럼 매년 바뀌거나 조건이 갈리는 것은 쓰지 않고
`관할 기관에 확인할 것`으로 남긴다. 확인된 요건(주 15시간 → 주휴수당, 1년 → 퇴직금,
3개월 미만 → 해고 예고 의무 없음, 서면 작성·교부 의무)만 명시한다.

### ⑬ 확인되지 않은 것은 넣지 않는다
`reference-db`·`pattern-db`에 `sampleSize`·`avgMonthlyRev` 같은 수치를 **지어내지 마라.**
`gov-support`에 구체 금액·비율·마감일을 하드코딩하지 마라 — 매년 바뀌므로 그 자체가 오정보다.

**원가 비율의 유일한 근거는 `knowledge_base/small_biz_cost_guide.csv`다.**
프라임코스트 = `인건비비중(%)` + `재료비/원가(%)`. 출처는 `소상공인 업종별 비용구조 기준`으로 표기한다.
업종별 참고 범위(2026-09-18 적용): 외식 50~60 / 미용 35~50 / 소매 60~75 / 교육 30~45 /
제조 60~80 / 건설 70~90 / 수출 75~90.
⚠ **범위로 쓰고 단정하지 마라** — `60% 이하가 목표` 같은 표현은 금지다.
⚠ **수치는 `guide`에만 둔다.** `question`·`scale`에 넣으면 guide를 고쳐도 화면에 옛 기준이 남는다.
⚠ **CSV 분류와 구조가 다른 그룹에는 수치를 주지 마라** — 물류(재료비 없음)·시설관리(인건비가 전부)·
   `pro_service`(의원은 재료비 있고 IT·금융은 없어 정반대)·`etc`(업종 미판별)는 **수치 제외 + 확인 안내**다.
⚠ **두 모듈이 같은 업종에 다른 수치를 말하면 사고다.** `DiagMicro.1_3`과 `DiagCommon.1_1`이
   같은 CSV를 근거로 해야 한다 — 2026-09-18까지 `전 그룹 60%` vs `외식 60/제조 75/IT 30/유통 80`이
   공존해 **직원 수만 넘어가면 기준이 두 배로 바뀌었다.**

---

## 남은 이슈

### 진단 문항·표시
- ⚠ **`service`(기준 그룹)에 영어 약자가 남아 있다.** 3그룹은 오버라이드가 덮었으므로
  이제 이것들을 보는 것은 `service` 경로뿐이다: 기본 `2_1` scale의
  `API 기반`·`구조화 데이터(Schema)`, `1_3` label의 `BEP`.
  (기본 `1_1` guide의 출처 없는 백분율은 2026-09-18에 제거했다.)
- ⚠ **`DOMAIN_TO_ACTION_KEY`에 D5·D6이 없어** 모든 그룹이 그 두 도메인은 base를 쓴다.
  두 title이 중립이라 지금 문제는 없다
- ⚠ **업종 수동 정정 UI가 경영진단 경로에 없다.** `loadDiagnosisUI(forceIndustryKey)` 인자는 있으나
  사용자가 고를 UI는 정책자금 경로(`fundIndustryOverride`)에만 있다. AI가 실패하면 바로잡을 방법이 없다
- ⚠ **주유소가 실제로 어떤 키로 분류되는지 미확인.** 5-1에서 분류 기준 문구를 `local_service` →
  `wholesale`로 옮겼으나 **AI가 반환하는 키를 실측하지 않았다.** `local_service`를 반환하면
  `beauty` 그룹(시술·예약) 문구를 그대로 받는다

### sme 리포트 8섹션 — A·B단계 완료 (2026-09-18)
- ⚠ **필드는 11개 그대로다.** 8섹션은 *화면 구성*이고 AI 출력 필드 수와 무관하다.
  `leanCanvas`·`keyStrategies`·`kpi`·`roadmap`은 하위 블록으로 내려갔을 뿐 **여전히 렌더링된다.**
  **필드를 빼기 전에 소비처를 전수 확인할 것**(주의사항 ⑨).
- ⚠ **출력 토큰 절감은 실측하지 않았다.** 입력은 −1,660토큰 실측됐으나, 이번 변경의
  핵심 이득인 **1차의 중복 생성 제거(추정 1,900~2,500 출력토큰)는 실제 호출로 확인해야 한다.**
  Hobby 60초 상한에 얼마나 여유가 생겼는지가 그 수치에 달려 있다.

### 미연결·무효 코드
- ⚠ **`bizmodel/` 12개 모듈 192문항이 전혀 렌더링되지 않는다.** CROSS_RULES 34개 중 21개가
  BM 프록시(공통 진단 도메인 평균 복사)로 발동한다 — 사용자가 답한 적 없는 값이다.
  **"BM 진단을 되살릴 것인가, CROSS_RULES에서 BM 축을 걷어낼 것인가" 방향 결정이 선행**되어야 한다
- ⚠ **`ai-engine`의 `industryVarMap`은 전 업종에서 무효다.** `buildInsightsSummary()`가
  `industryData.insights`를 읽는데 **19개 업종 모듈 중 `insights` 필드를 가진 것이 하나도 없다**
  (v2.0 재작성 때 `ai_analysis`로 바뀌면서 사라진 것으로 보인다)
- ⚠ **`DiagSme` 18문항이 어떤 경로에서도 렌더링되지 않는다.** `diag-sme-container`는
  git 전체 이력에서 `index.html`에 존재한 적이 없다. 살리려면 문항 재작성이 선행되어야 한다
- ⚠ **`fakeAnalysis` 계열 약 1,530줄이 호출 경로 차단 후 죽은 코드다.** `isDemo`가
  `render(data, fd, isDemo)` 시그니처에 남아 있어 함께 정리 필요

### 데이터 품질
- ⚠ **`pattern-db`는 전 업종이 `local_service` 통계로 폴백 중이다.** 호출부가
  `diagData.industry`(항상 `''`)를 넘기고, 도메인 키도 micro `d1~d7`·사회적경제 `s1~s8`과
  맞지 않아 전부 기본값 3점이 된다. **PatternDB 4축 ↔ D1~D7 매핑 설계가 선행**되어야 한다
- ⚠ **`reference-db`에 `facility_service`·`etc` 벤치마크가 없다.** 블록이 생략되므로
  깨지지는 않으나 AI 프롬프트에서 업종 준거 수치가 빠진다. **확인된 통계 확보 후 추가 — 지어내지 말 것**
- ⚠ **KOSIS `facility_service: 'S'`는 근사값이다.** 실제 KSIC는 N(사업시설관리·사업지원)이나
  `FALLBACK`에 N이 없다. **N 통계를 확보하면 교체할 것**
- ⚠ **`gov-support`의 `social_economy` 태그가 사회적기업과 협동조합을 함께 묶는다.**
  사회적기업 전용 사업이 협동조합에도 상위 매칭된다. 태그 세분화가 정확하나 회귀 위험이 있다
- ⚠ **`gov-support match()`의 동점 처리가 이름 순(`localeCompare`)이다.** 관심분야 미선택 시
  3점 축이 죽어 동점 그룹이 커진다. 2차 정렬 기준(기관 신뢰도·지원 규모·신청 난이도) 설계 필요

### sme PPT (1단계 색 체계·표지·띠 2026-09-21 / 2단계 차트·시각화 · 3단계 분량·넘침 2026-09-22 완료)
- **sme는 글자를 자르지 않는다(`_clip`·`LIMIT`은 LEGACY 전용).** 넘치면 `_smeCards`(카드 흐름)·`_smeGrid`
  (병렬 칸)가 다음 장에 잇고 제목에 `(계속)`을 붙인다. 줄 수는 `_wrap`이 추정한다 —
  **`LH = 1.2`는 PowerPoint 실측과 정확히 같다(여유 0). 여유는 글자 폭(한글 0.95em·Bold 1.0em)에만 있다.**
  계수를 건드렸으면 PowerPoint COM `TextRange.BoundHeight`로 넘침을 실측할 것(추정끼리 비교하면 순환 검증이다).
- **슬라이드 제목은 AI 필드의 결론 문장이다** — 출처 목록은 HISTORY 2026-09-22 3단계. 결론 필드가 없는
  섹션(SWOT·4P·KPI·로드맵·90일·정부지원)은 섹션 이름 그대로다. **제목 문장을 지어내지 마라.**
- **sme 5대 역량은 네이티브 차트(`addChart`)다 — 캔버스 이미지로 되돌리지 마라.** 값·라벨은
  `fd.domainScores[k].avg`·`.label` 그대로다(재계산 금지). 레이더 라벨의 `\n`은 PowerPoint가
  낱말 중간에서 자르는 것을 막기 위한 것이다 — `layout` 축소·9pt는 시도 후 기각됐다.
- **빈 필드는 슬라이드·카드를 만들지 않는다**: 점수 전무 → 역량 슬라이드 생략, 0점 영역은 차트 제외 후
  하단 명시, 현재·목표 둘 다 없는 KPI는 카드 없음, SWOT 네 칸 전부 비면 생략(한 칸만 비면 칸 유지).
- ⚠ `_radarSlide`·`_radarDataUrl`은 이제 **micro·사회적경제만** 쓴다(LEGACY). 옮길 때 같이 정리할 것.
- ⚠ **sme 화면에 100점 만점 종합 점수가 없다.** `fd.scaleScores`는 sme에서 항상 `{}`이고
  (`DiagSme` 미렌더링 → 접두어 가드), 화면이 쓰는 유일한 점수는 `fd.domainScores`의
  5대 역량 `avg`(5점 만점)다. 그래서 **PPT 표지도 `3.2 / 5.0`으로 표시한다.**
  100점 표기가 필요하면 **화면에 먼저 만들고 PPT가 그것을 읽는 순서**여야 한다 —
  PPT에서 환산하면 화면 어디에도 없는 숫자가 표지에 실린다.
- ⚠ **sme 화면 `#sec-diag`의 취약 영역 배너는 PPT에 없다** — 배너는 `AIEngine.calcDiagScores`(공통 4영역+업종),
  PPT 역량 슬라이드는 `fd.domainScores`(5대 역량)라 점수 체계가 다르다. 어느 쪽을 기준으로 할지 결정이 선행된다.

### 구조·일관성
- ⚠ **`dashboard.js`·`ppt-export.js`가 `_diagPathOf`를 쓰지 않는다.** 각자 `fd.bizScale`로
  판정하므로 **micro+창업초기 대시보드가 micro 7섹션 구성으로 뜬다**(진단은 4영역, 처방은 7영역).
  네 번째 경로 판정 사고를 막으려면 결국 전부 이 함수를 거쳐야 한다
- ⚠ **2·3차 호출이 `microPrompt`를 `substring(0, 500)`으로 자른다.** 도입은 `ab0dbb3`이며
  **왜 500인지 근거 기록이 없다.** 현재 1,300~1,600자 중 대부분이 버려진다
- ⚠ **`buildPromptSummary`가 5벌로 복제돼 있다**(Micro/Social/Venture/Coop/**Common**).
  `_memoBlock`·`_scoreDistBlock`까지 5벌이다(2026-09-18 Common 추가). 공용 모듈 신설 +
  로드 순서 조정이 필요하다. ⚠ 통합 시 **label 소스가 모듈마다 다른 것**에 주의 —
  `DiagCommon`·`DiagMicro`는 `getSchema(...).items`(그룹 오버라이드), 나머지 3개는 `ITEMS`다
- ⚠ **sme 2차 호출(`buildPrompt2`)은 진단 요약을 아예 싣지 않는다.** micro처럼 500자로
  자르는 것이 아니라 없다 — `DiagCommon` 요약은 1차 호출에만 들어간다. 2차의 KPI·6시스템·
  90일플랜이 진단 점수와 무관하게 작성될 수 있다. **넣을지 여부 판단이 선행되어야 한다**
- ⚠ **구 필드 `socialPrompt`/`socialWarnings` 제거 대기.** `orgPrompt`/`orgWarnings`로 대체됐고
  회귀 방지를 위해 병행 유지 중이다. **새 코드에서는 `orgPrompt`/`orgWarnings`만 쓸 것**
- ⚠ **`dashboard.js`가 `diagScores`를 자체적으로 평면 맵으로 만든다** — `collectAllScores()`를
  쓰지 않으므로 **잔존 키 노출 경로가 여기에 남아 있다**(2026-09-21에 wizard 쪽만 좁혔다).
  `_isActiveScoreKey`는 wizard 내부 상태(`_activeContainers`)에 의존하므로, 공유하려면
  `collect()`가 활성 컨테이너 목록을 `data`에 실어 보내는 편이 맞다
- ⚠ **PDF 빈 페이지 재현 조건 미확보.** `#sec-six-systems`의 `break-before: page`,
  `.print-cover`의 `break-after`와 연속 페이지 나눔이 후보다. **어느 리포트 유형의 몇 번째 페이지가
  비는지 확인한 뒤 진행할 것** — 추정으로 고치면 오진이 기록에 남는다
- ⚠ **사회적경제 AI 결과가 이력 스냅샷에 저장되지 않는다.** `priority`·`plan90`이 스냅샷에 없다.
  현재 깨지는 것은 없으나 "지난 진단 다시 보기"를 만들면 사회적경제만 AI 부분이 빈다
- ⚠ **HistoryTracker 스키마 버전 부재.** 창업 초기 도메인 매핑을 고쳐 과거 스냅샷과 어긋난다
  (`differentiation` 과거 0 → 현재 실제값 = 허위 급상승). `schemaVersion` 추가 후
  버전이 다르면 델타 비교를 건너뛰는 방식이 안전하다. **과거 데이터 소급 변환은 원본 훼손이라 권하지 않는다**
- ⚠ **죽은 필드 3종**: `ai_trigger.warning_msg`(소비처 0건) / base `ACTION_PLAN_7DAY`의
  `desc`·`tool`·`output`(`title`만 소비). 살리려면 그룹 계획 175항목에 `desc`를 새로 써야 한다
- ⚠ **`getSchema()`가 오버라이드 없는 그룹에 기본 `ITEMS` 객체 참조를 그대로 반환한다.**
  현재 호출부가 변형하지 않아 문제없으나 방어적으로 사본을 반환하는 편이 안전하다

---
