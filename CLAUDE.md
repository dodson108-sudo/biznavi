# BizNavi AI 프로젝트

## 배포 상태 (2026-04-22 최신)

- **GitHub**: `https://github.com/dodson108-sudo/biznavi.git` — 최신 커밋: no_financial/not_found 메시지 분리
- **Vercel**: GitHub 연동 자동 배포 중 (main 브랜치 push 시 자동 빌드), 서울 리전(icn1) 적용
- **브랜치**: `main` (단일 브랜치 운영)

---

## 최근 수정 이력 (2026-04-22) — 오후

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
