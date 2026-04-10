# BizNavi AI 프로젝트

## 배포 상태 (2026-03-27)

- **GitHub**: `https://github.com/dodson108-sudo/biznavi.git` — 업로드 완료 (커밋: `e86d81c` "BizNavi AI 첫 배포")
- **Vercel**: 배포 진행 중 (GitHub 연동 후 자동 빌드 예정)
- **브랜치**: `main` (단일 브랜치 운영)

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
