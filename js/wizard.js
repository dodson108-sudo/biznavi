/* ================================================================
   BizNavi AI — wizard.js (고도화 v3.1)
   4단계 입력 위저드: 탭 순서 진행, 입력값 유지, 점수 복원
   ================================================================ */

const Wizard = (() => {
  let curStep = 1;
  let curDiagTab = 'common';
  const diagScores = {};
  const diagMemos = {};

  /* 진단 목적 — 'general'(경영전략 진단, 기본) | 'funding'(정책자금 진단)
     진입점(App.startWizard / App.startFundingDiagnosis)에서 setPurpose()로 지정 */
  let _purpose = 'general';
  function setPurpose(p) { _purpose = p || 'general'; }
  function getPurpose()  { return _purpose; }

  const INDUSTRY_MAP = {
    '제조업':           'mfg_parts',
    '식품/음료':        'food_mfg',
    '서비스업':         'local_service',
    '유통/물류':        'wholesale',
    '외식 및 휴게음식업': 'restaurant',
    'IT/소프트웨어':    'knowledge_it',
    '건설/부동산':      'construction',
    '의료/헬스케어':    'medical',
    '금융/핀테크':      'finance',
    '교육':             'education',
    '패션/뷰티':        'fashion',
    '미디어/엔터테인먼트': 'media',
    '수출중소기업':     'export_sme',
    '물류운송':         'logistics',
    '환경에너지':       'energy',
    '농림식품원료':     'agri_food',
    '기타':             'etc'
  };

  // 추가: 사회적기업 / 소셜벤처 매핑
  INDUSTRY_MAP['사회적기업'] = 'social_enterprise';
  INDUSTRY_MAP['소셜벤처'] = 'social_venture';
  INDUSTRY_MAP['소셜벤쳐'] = 'social_venture';

  /* 영문 키 → 한국어 라벨 역매핑 (먼저 등록된 라벨 우선 — '소셜벤쳐' 오타 alias는 자동 제외) */
  const INDUSTRY_LABEL_BY_KEY = (() => {
    const m = {};
    Object.keys(INDUSTRY_MAP).forEach(label => {
      const key = INDUSTRY_MAP[label];
      if (!m[key]) m[key] = label;
    });
    return m;
  })();

  // 업종 → 현실적으로 가능한 사업모델 후보 (우선순위 순)
  const INDUSTRY_BM_MAP = {
    'mfg_parts':     ['mfg_dist', 'b2b_solution', 'service'],
    'food_mfg':      ['mfg_dist', 'b2c_commerce', 'b2c_sub', 'franchise'],
    'local_service': ['service', 'franchise', 'b2c_sub'],
    'wholesale':     ['mfg_dist', 'b2c_commerce', 'platform'],
    'restaurant':    ['service', 'franchise', 'b2c_commerce'],
    'knowledge_it':  ['b2b_saas', 'b2b_solution', 'service', 'usage_based'],
    'construction':  ['service', 'b2b_solution'],
    'medical':       ['service', 'b2c_sub', 'b2b_saas', 'deeptech'],
    'finance':       ['b2b_saas', 'platform', 'service', 'usage_based'],
    'education':     ['b2c_sub', 'b2b_saas', 'service', 'platform'],
    'fashion':       ['b2c_commerce', 'mfg_dist', 'b2c_sub'],
    'media':         ['advertising', 'b2c_sub', 'platform'],
    'export_sme':    ['mfg_dist', 'b2b_solution', 'b2c_commerce'],
    'logistics':     ['service', 'platform', 'b2b_solution', 'usage_based'],
    'energy':        ['service', 'b2b_solution', 'mfg_dist', 'usage_based'],
    'agri_food':     ['mfg_dist', 'b2c_commerce', 'b2c_sub'],
    'etc':           ['service', 'b2b_solution', 'mfg_dist']
  };

  // 사업모델 후보 추가: 사회적기업 / 소셜벤처
  INDUSTRY_BM_MAP['social_enterprise'] = ['platform', 'service', 'b2c_commerce'];
  INDUSTRY_BM_MAP['social_venture']   = ['b2b_saas', 'platform', 'service'];

  // BM 키 → 표시 레이블
  const BM_LABELS = {
    'b2b_saas':     'B2B SaaS',
    'b2c_sub':      'B2C 구독',
    'b2b_solution': 'B2B 솔루션',
    'b2c_commerce': 'B2C 커머스',
    'platform':     '플랫폼·마켓플레이스',
    'franchise':    '프랜차이즈',
    'mfg_dist':     '제조·유통',
    'service':      '서비스업',
    'usage_based':  '종량제·사용량기반',
    'advertising':  '광고기반',
    'deeptech':     '딥테크·바이오',
    'etc':          '기타'
  };

  // 저장된 추론 결과
  let _inferredBmKey = '';

  // 탭 순서 정의
  const TAB_ORDER = ['common', 'industry'];

  /* 조직 유형 — 'general' | 'social_enterprise' | 'cooperative' | 'social_venture'
     ⚠ 조직 형태는 업종(industryKey)과 다른 축이다. industryKey에 밀어넣지 않는다.
        컨설팅업 사회적기업 = industryKey:'knowledge_it' + orgType:'social_enterprise' 가 정확한 상태다.
     ⚠ bizScale('micro'|'sme')에 'social'을 추가하지 않는다.
        FundingRules가 bizScale === 'micro' 기준으로 중진공 소상공인 제외를 판정하므로
        값을 바꾸면 그 로직이 깨진다. 별도 플래그로 분리한다. */
  let _orgType = 'general';

  /* DiagSocial(S1~S8)을 적용하는 조직 형태.
     cooperative·social_venture는 전용 모듈이 없어 사회적기업 진단을 빌려 쓰지만,
     orgType 값 자체는 사용자가 선택한 값을 유지한다 (전용 모듈 신설 시 자동 전환용) */
  const SOCIAL_ORG_TYPES = ['social_enterprise', 'cooperative', 'social_venture'];
  function _isSocialOrg(orgType) { return SOCIAL_ORG_TYPES.indexOf(orgType) !== -1; }

  /* ══ orgType → 진단 모듈 단일 진입점 ══
     ⚠ orgType 분기를 여러 곳에 흩뿌리지 않는다. 모듈이 늘어나도 여기만 고친다.
        (과거 orgType === 'social_enterprise' 단일 비교가 세 곳에 흩어져 사고가 났다)
     사회적경제 3유형 모두 전용 모듈을 갖는다. 유형이 늘어나면 여기 한 줄만 추가한다.
     컨테이너 id·점수 키 접두어도 모듈의 KEY_PREFIX에서 파생시킨다 — 하드코딩 금지 */
  function _orgDiagModule(orgType) {
    const G = (typeof window !== 'undefined') ? window : {};
    if (orgType === 'social_venture')    return G.DiagVenture || (typeof DiagVenture !== 'undefined' ? DiagVenture : null);
    if (orgType === 'cooperative')       return G.DiagCoop    || (typeof DiagCoop    !== 'undefined' ? DiagCoop    : null);
    if (orgType === 'social_enterprise') return G.DiagSocial  || (typeof DiagSocial  !== 'undefined' ? DiagSocial  : null);
    return null;
  }
  /* 'diag-venture-container_' → 'diag-venture-container' */
  function _orgContainerId(mod) {
    if (!mod || !mod.KEY_PREFIX) return '';
    return mod.KEY_PREFIX.replace(/_$/, '');
  }

  /* 조직 형태 아이콘 — 탭 라벨·배너가 함께 쓴다(분기 중복 방지) */
  const ORG_ICON = {
    general: '', social_enterprise: '🤝', cooperative: '🧑‍🤝‍🧑', social_venture: '🚀',
  };
  const ORG_TYPE_LABEL = {
    general:           '일반 기업',
    social_enterprise: '사회적기업',
    cooperative:       '협동조합·마을기업',
    social_venture:    '소셜벤처',
  };

  /* 전용 진단 모듈이 아직 없는 조직 형태 — 선택 시 사회적기업 진단을 빌려 쓸지 확인받는다 */
  /* 전용 진단 모듈이 아직 없는 조직 형태만 남긴다.
     ⚠ 사회적경제 3유형(사회적기업 S1~S8 / 소셜벤처 V1~V8 / 협동조합 C1~C8)이
        모두 전용 모듈을 갖췄으므로 현재는 비어 있다.
        전용 모듈 없는 유형을 추가하면 여기에 등록해 confirm을 띄운다 */
  const ORG_TYPE_PENDING = {};
  function _onOrgTypeChange(e) {
    const sel = e?.target || document.getElementById('orgTypeSelect');
    if (!sel) return;
    const pending = ORG_TYPE_PENDING[sel.value];
    if (!pending) return;
    const ok = confirm(
      pending + ' 전용 진단은 준비 중입니다.\n' +
      '사회적기업 진단으로 진행하시겠습니까? (공통 항목이 많습니다)'
    );
    // 취소 시 일반 기업으로 되돌린다. 확인 시 선택값(cooperative 등)을 그대로 유지해
    // 전용 모듈이 생기면 자동으로 전환되게 한다
    if (!ok) sel.value = 'general';
  }

  /* 조직 형태 판별 — 사용자 선택(#orgTypeSelect) 우선.
     ⚠ AI 업종분석(api/analyze-biz.js)은 social_enterprise를 반환할 수 없으므로
        industryKey 기반 판별만으로는 사회적기업 진단이 영영 발동하지 않는다.
        아래 industryKey fallback은 레거시 호환용으로만 남긴다. */
  function _detectOrgType(industryKey) {
    const sel = document.getElementById('orgTypeSelect')?.value || '';
    if (sel) return sel;
    return industryKey === 'social_enterprise' ? 'social_enterprise' : 'general';
  }

  /* 진단 문항이 렌더링되는 컨테이너 전체 목록.
     ⚠ diagTab-common 안에 common/micro/social 3개가 형제로 공존한다.
        DOM 전역 querySelectorAll('.diag-item')로 세면 현재 경로에서 쓰지 않는
        컨테이너의 잔존 문항까지 합산된다(사회적기업 진단 후 sme 재진단 시 76개 등).
        반드시 _activeContainers 기준으로 한정할 것. */
  const DIAG_CONTAINERS = [
    'diag-common-container', 'diag-micro-container', 'diag-social-container',
    'diag-venture-container', 'diag-coop-container',
    'diag-industry-container', 'diag-bizmodel-container',
  ];
  /* 이번 경로에서 실제로 렌더링된 컨테이너 — loadDiagnosisUI()가 매번 갱신한다 */
  let _activeContainers = [];

  /* 활성 컨테이너 하위의 문항 수. signal-only(DX 탐지)는 점수에 반영되지 않으므로 제외한다.
     ⚠ 탭 라벨·진행률 분모·validate(2)가 모두 이 함수를 쓴다 — 기준을 하나로 통일한다 */
  function _countDiagItems(ids) {
    const list = (ids && ids.length) ? ids : _activeContainers;
    if (!list.length) return 0;
    const sel = list.map(id => '#' + id + ' .diag-item:not([data-signal-only])').join(', ');
    return document.querySelectorAll(sel).length;
  }
  /* 응답 완료 수 — 분모(DOM)와 같은 범위(활성 컨테이너 접두어)로 한정한다.
     범위가 어긋나면 전 문항을 채워도 100%가 되지 않는다 */
  function _countDoneScores() {
    if (!_activeContainers.length) return 0;
    return Object.keys(diagScores).filter(k => {
      if (k.indexOf('dx_detect') >= 0) return false;
      if (!(diagScores[k] && diagScores[k].score > 0)) return false;
      return _activeContainers.some(c => k.indexOf(c + '_') === 0);
    }).length;
  }
  /* 이번 경로에서 쓰지 않는 컨테이너를 비운다 (잔존 문항이 진행률·검증에 섞이지 않게) */
  function _clearInactiveContainers() {
    DIAG_CONTAINERS.forEach(id => {
      if (_activeContainers.indexOf(id) >= 0) return;
      const el = document.getElementById(id);
      if (el && el.innerHTML) el.innerHTML = '';
    });
  }
  function _clearAllDiagContainers() {
    DIAG_CONTAINERS.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '';
    });
    _activeContainers = [];
  }
  /* 라벨용 문항 수 표기 — 셀 수 없으면 숫자를 붙이지 않는다.
     잘못된 숫자를 보여주느니 빼는 편이 낫다 */
  function _cntSuffix(c) { return c > 0 ? ' (' + c + '문항)' : ''; }

  /* 탭 순서 — 조직 형태와 무관하게 공통 + 업종 특화 2탭을 유지한다.
     (사회적기업도 업종은 별개로 존재하므로 업종 특화 5문항이 유효하다.
      과거 'industryKey === social_enterprise' 시절에는 업종 탭이 S1~S8과
      내용이 중복되는 모듈을 렌더링해 숨겼으나, orgType 분리로 그 중복이 사라졌다) */
  function _tabOrder() {
    return TAB_ORDER;
  }

  /* ================================================================
     Dynamic Common Core — 업종별 공통 질문 문구 오버라이드 + 참고값
     공통 8문항 중 업종에 따라 의미가 달라지는 항목의 텍스트·앵커 교체
  ================================================================ */
  const COMMON_WORDING_MAP = {
    mfg_parts: {
      '1_3': {
        text: '주요 거래처(바이어)의 재발주율은 얼마나 됩니까? — 거래처가 이탈하면 수주 공백이 생기므로 핵심 지표입니다.',
        inputLabel: '재발주율 (%) — 모르면 아래 선택',
        placeholder: '예: 70',
        benchRef: { avg: 65, good: 80, label: '제조업 재발주율 평균', src: '소상공인진흥공단 2023' },
        anchors: {
          1: '🔴 1점 — 재발주 30% 미만. 신규 수주만 의존. 거래처 이탈 위험.',
          2: '🟠 2점 — 재발주 30~50%. 단가 협상마다 이탈 위험.',
          3: '🟡 3점 — 재발주 50~70%. 2~3개 핵심 거래처 의존.',
          4: '🟢 4점 — 재발주 70%+. 장기 단가 계약 확보.',
          5: '🟢 5점 — 재발주 85%+. VMI/캔반 연동 또는 연간 계약.'
        }
      },
      '1_2': { benchRef: { avg: 6.0, good: 10, label: '제조업 영업이익률 평균', src: '한국은행 기업경영분석 2023' } },
      '1_1': { benchRef: { avg: 4.5, good: 10, label: '제조업 매출성장률 평균', src: '한국은행 기업경영분석 2023' } },
      '3_2': { choices: [
        '자체 설계·특허·금형 보유 — 경쟁사가 접근 못하는 독점 기술',
        '불량률·품질 인증 — 동종 대비 최저 불량률·ISO/TS 인증',
        '납기 준수·긴급 대응 — 단납기 주문도 소화하는 실행력',
        '특수 소재·공법 독점 접근 — 경쟁사가 쓸 수 없는 자원',
        '장기 납품 계약·전속 공급 — 안정적 수주 잔량 확보',
        '없음 / 아직 차별화 요소가 명확하지 않음'
      ], noneValue: '없음 / 아직 차별화 요소가 명확하지 않음' }
    },
    food_mfg: {
      '1_3': {
        text: '주요 거래처(유통사·바이어)의 재발주율 또는 단골 소비자 재구매율은 어느 수준입니까?',
        inputLabel: '재발주·재구매율 (%) — 모르면 아래 선택',
        placeholder: '예: 55',
        benchRef: { avg: 55, good: 75, label: '식품제조 재주문율 평균', src: '소상공인진흥공단 2023' },
        anchors: {
          1: '🔴 1점 — 30% 미만. 일회성 납품·시식 판촉 위주.',
          2: '🟠 2점 — 30~50%. 재발주 불안정. 납품단가 압박 심함.',
          3: '🟡 3점 — 50~70%. 유통 거래처 일부 고정화.',
          4: '🟢 4점 — 70~85%. 장기 납품 계약·정기 발주 확보.',
          5: '🟢 5점 — 85%+. OEM 연간 계약 또는 전속 납품 구조.'
        }
      },
      '1_2': { benchRef: { avg: 5.5, good: 9, label: '식품제조 영업이익률 평균', src: '한국은행 기업경영분석 2023' } },
      '3_2': { choices: [
        '자체 레시피·제조 공법 독점 — 경쟁사가 그대로 복제 불가',
        'HACCP·유기농·GI 인증 — 바이어·소비자 신뢰 증거',
        '특정 원료 독점 소싱 — 타사가 구하기 어려운 원물 확보',
        '유통 채널 선점 — 대형마트·편의점 납품 계약 또는 자사몰 팬덤',
        '가격 대비 품질 — 동급 최저가 또는 프리미엄 포지셔닝',
        '없음 / 아직 차별화 요소가 명확하지 않음'
      ], noneValue: '없음 / 아직 차별화 요소가 명확하지 않음' }
    },
    restaurant: {
      '1_3': {
        text: '재방문 손님의 비율과 재방문 주기는 어느 수준입니까? — 단골 1명이 신규 1명보다 마케팅 비용이 7배 저렴합니다.',
        inputLabel: '재방문율 (%) — 모르면 아래 선택',
        placeholder: '예: 45',
        benchRef: { avg: 40, good: 60, label: '외식 단골 재방문율 평균', src: '소상공인진흥공단 2023' },
        anchors: {
          1: '🔴 1점 — 재방문 거의 없음. 매번 신규 유입에만 의존.',
          2: '🟠 2점 — 재방문 20~30%. 월 1회 이하. 기억에 남지 않는 수준.',
          3: '🟡 3점 — 재방문 30~50%. 2~3주 주기 단골층 일부 형성.',
          4: '🟢 4점 — 재방문 50~65%. 주 1회 이상 단골 보유.',
          5: '🟢 5점 — 재방문 65%+. 단골 명단 관리·포인트·예약 체계 보유.'
        }
      },
      '1_1': { benchRef: { avg: 3.2, good: 8, label: '외식업 매출성장률 평균', src: '소상공인진흥공단 2023' } },
      '1_2': { benchRef: { avg: 8.0, good: 12, label: '외식업 영업이익률 평균', src: '소상공인진흥공단 2023' } },
      '3_2': { choices: [
        '단골만 아는 시그니처 메뉴·독자 레시피 — 쉽게 따라 할 수 없는 우리만의 맛',
        '인테리어·분위기·공간감 — SNS 공유·재방문을 유도하는 차별화 공간',
        '입지 우위 — 접근성·주차·상권이 경쟁 음식점보다 유리',
        '배달 전문화·포장 특화 — 배달앱 별점 4.8 이상·재주문율 우수',
        '식재료 원산지 투명성·프리미엄 — 가격 저항 없이 단가 높임',
        '없음 / 아직 차별화 요소가 명확하지 않음'
      ], noneValue: '없음 / 아직 차별화 요소가 명확하지 않음' }
    },
    knowledge_it: {
      '1_3': {
        text: '월 구독 갱신율(Retention Rate) 또는 계약 연장율은 얼마나 됩니까? — 이탈 1명을 막는 비용이 신규 획득의 1/5 수준입니다.',
        inputLabel: '갱신율·연장율 (%) — 모르면 아래 선택',
        placeholder: '예: 85',
        benchRef: { avg: 78, good: 90, label: 'IT 서비스 고객 갱신율 평균', src: '글로벌 SaaS 벤치마크 2024' },
        anchors: {
          1: '🔴 1점 — 갱신율 60% 미만. 매달 이탈자가 신규보다 많음.',
          2: '🟠 2점 — 갱신율 60~75%. 성장이 이탈을 간신히 상쇄.',
          3: '🟡 3점 — 갱신율 75~85%. 이탈 원인 파악 필요.',
          4: '🟢 4점 — 갱신율 85~92%. 이탈 원인 추적·개선 루틴 보유.',
          5: '🟢 5점 — 갱신율 92%+. 커뮤니티·락인 기능으로 이탈 구조 해결.'
        }
      },
      '1_2': { benchRef: { avg: 14.0, good: 22, label: 'IT·SW업 영업이익률 평균', src: '한국은행 기업경영분석 2023' } },
      '1_1': { benchRef: { avg: 18, good: 35, label: 'IT·SW업 매출성장률 평균', src: '한국은행 기업경영분석 2023' } },
      '3_2': { choices: [
        '자체 개발 플랫폼·툴·특허 기술 — 경쟁사가 복제 불가한 독자 기술',
        '특정 업종 도메인 전문성 — 경쟁사보다 깊은 현장·업무 이해',
        '납품 속도·애자일 대응 — 경쟁사 대비 절반 기간 구현',
        '핵심 레퍼런스·고객사 사례 — 동종 프로젝트 성공 실적',
        '장기 유지보수·구독 계약 — 고객사 이탈이 어려운 락인 구조',
        '없음 / 아직 차별화 요소가 명확하지 않음'
      ], noneValue: '없음 / 아직 차별화 요소가 명확하지 않음' }
    },
    local_service: {
      '1_3': {
        text: '한번 이용한 고객이 다시 찾아오는 비율(재방문율)은 어느 수준입니까? — 네이버 예약·카카오채널 단골 관리를 기준으로 생각해보세요.',
        inputLabel: '재방문율 (%) — 모르면 아래 선택',
        placeholder: '예: 50',
        benchRef: { avg: 45, good: 65, label: '생활서비스 단골 재방문율 평균', src: '소상공인진흥공단 2023' },
        anchors: {
          1: '🔴 1점 — 재방문 20% 미만. 단골이 거의 없음.',
          2: '🟠 2점 — 재방문 20~40%. 연 1~2회 단골 수준.',
          3: '🟡 3점 — 재방문 40~55%. 월 1회 이상 단골 일부 형성.',
          4: '🟢 4점 — 재방문 55~70%. 예약 선점·포인트 활용 단골층 있음.',
          5: '🟢 5점 — 재방문 70%+. 단골 명단 관리·정기 예약 체계 완성.'
        }
      },
      '1_2': { benchRef: { avg: 10.5, good: 16, label: '생활서비스 영업이익률 평균', src: '소상공인진흥공단 2023' } },
      '3_2': { choices: [
        '오랜 단골·지역 구전 추천 — 지역에서 이름이 알려져 있음',
        '자격증·기술 전문성 인증 — 동급 대비 전문성이 검증됨',
        '예약·당일 대응 속도 — 경쟁자보다 훨씬 빠른 서비스',
        '개인 맞춤 서비스·AS 신뢰 — "이 분만 믿는다"는 고객 충성도',
        '가격 대비 품질 — 같은 돈에 눈에 띄게 나은 결과물',
        '없음 / 아직 차별화 요소가 명확하지 않음'
      ], noneValue: '없음 / 아직 차별화 요소가 명확하지 않음' }
    },
    medical: {
      '1_3': {
        text: '환자·고객의 재방문율 또는 재등록률은 어느 수준입니까? — 재방문율이 낮으면 마케팅 비용 대비 실제 환자 수가 늘지 않습니다.',
        inputLabel: '재방문·재등록율 (%) — 모르면 아래 선택',
        placeholder: '예: 55',
        benchRef: { avg: 55, good: 75, label: '의료 재방문율 평균', src: '보건복지부 의료기관 경영통계 2023' },
        anchors: {
          1: '🔴 1점 — 재방문 30% 미만. 신규 유입 의존. 마케팅 비용 과다.',
          2: '🟠 2점 — 재방문 30~50%. 환자 충성도 낮음.',
          3: '🟡 3점 — 재방문 50~65%. 정기 검진·관리 루틴 일부.',
          4: '🟢 4점 — 재방문 65~80%. 의료진 신뢰도·관리 프로그램 효과.',
          5: '🟢 5점 — 재방문 80%+. 검진·관리 패키지·멤버십 완성.'
        }
      },
      '3_2': { choices: [
        '특정 진료 분야 전문의·인증 — 지역 내 유일하거나 최고 수준',
        '최신 장비·특수 시술 도입 — 경쟁 기관에 없는 의료 기술',
        '환자 신뢰·지인 소개 비율 높음 — 재방문·입소문 기반 환자 유입',
        '대기 없는 예약 시스템·편의성 — 환자 경험이 경쟁 병원 대비 우위',
        '비급여 특화·프리미엄 포지셔닝 — 수가 경쟁 아닌 가치 경쟁',
        '없음 / 아직 차별화 요소가 명확하지 않음'
      ], noneValue: '없음 / 아직 차별화 요소가 명확하지 않음' }
    },
    education: {
      '1_3': {
        text: '수강생·학생의 재등록률 또는 재계약률은 어느 수준입니까? — 재등록률이 낮으면 광고비가 계속 올라갑니다.',
        inputLabel: '재등록·재계약율 (%) — 모르면 아래 선택',
        placeholder: '예: 60',
        benchRef: { avg: 58, good: 78, label: '교육업 재등록율 평균', src: '소상공인진흥공단 교육업 통계 2023' },
        anchors: {
          1: '🔴 1점 — 재등록 30% 미만. 스타 강사 1명 의존. 이탈 위험.',
          2: '🟠 2점 — 재등록 30~50%. 단기 성과 위주.',
          3: '🟡 3점 — 재등록 50~65%. 일부 단골 형성. 커리큘럼 체계화 필요.',
          4: '🟢 4점 — 재등록 65~80%. 커리큘럼·담임 관리 효과.',
          5: '🟢 5점 — 재등록 80%+. 학부모·성인 재등록 구조 완성.'
        }
      },
      '3_2': { choices: [
        '독자 개발 커리큘럼·교재 — 타 기관에서 그대로 복제 불가',
        '성과 실적·합격률·취업률 — 수치로 검증된 효과',
        '스타 강사·전문 교사 보유 — 지역에서 이름이 알려진 인재',
        '소수 정예 밀착 관리 — 대형 기관이 못 하는 개인 맞춤',
        '온·오프라인 하이브리드 — 경쟁자에 없는 수업 유연성',
        '없음 / 아직 차별화 요소가 명확하지 않음'
      ], noneValue: '없음 / 아직 차별화 요소가 명확하지 않음' }
    },
    construction: {
      '1_3': {
        text: '기존 고객·거래처의 재계약률 또는 수의계약(기존 거래처와 직접 계약) 비율은 어느 수준입니까?',
        inputLabel: '재계약·수의계약율 (%) — 모르면 아래 선택',
        placeholder: '예: 40',
        benchRef: { avg: 35, good: 55, label: '건설·인테리어 재계약율 평균', src: '건설산업연구원 2023' },
        anchors: {
          1: '🔴 1점 — 재계약 거의 없음. 매번 입찰·공개 경쟁. 수주 불안정.',
          2: '🟠 2점 — 재계약 20~35%. 일부 수의계약 있으나 단가 압박.',
          3: '🟡 3점 — 재계약 35~50%. 기존 거래처 일부 안정화.',
          4: '🟢 4점 — 재계약 50~65%. 연간 계약·A/S 계약 연동.',
          5: '🟢 5점 — 재계약 65%+. 시공 완료→A/S→추가 공사 선순환.'
        }
      },
      '1_2': { benchRef: { avg: 4.5, good: 8, label: '건설업 영업이익률 평균', src: '한국은행 기업경영분석 2023' } },
      '3_2': { choices: [
        '하자·AS 신뢰도 — 시공 후 문제 없거나 즉시 해결 실적',
        '납기 준수·공기 단축 능력 — 약속 날짜를 반드시 지키는 신뢰',
        '특수 공법·자재 전문성 — 경쟁사가 못하는 시공 기술 보유',
        '견적 정확도·투명 계약 — 추가 비용 없이 계약대로 완공',
        '우량 하도급팀 고정 보유 — 품질 일관성 유지하는 협력 파트너',
        '없음 / 아직 차별화 요소가 명확하지 않음'
      ], noneValue: '없음 / 아직 차별화 요소가 명확하지 않음' }
    },
    wholesale: {
      '1_3': {
        text: '주요 바이어·거래처의 재주문율은 어느 수준입니까? — 거래처 집중도가 높을수록 재주문율이 핵심 위험 지표입니다.',
        inputLabel: '재주문율 (%) — 모르면 아래 선택',
        placeholder: '예: 60',
        benchRef: { avg: 60, good: 78, label: '유통·도소매 재주문율 평균', src: '소상공인진흥공단 2023' },
        anchors: {
          1: '🔴 1점 — 30% 미만. 일회성 거래 위주.',
          2: '🟠 2점 — 30~50%. 일부 반복 거래 있으나 불안정.',
          3: '🟡 3점 — 50~70%. 주요 거래처 일부 고정화.',
          4: '🟢 4점 — 70~85%. 주요 바이어 정기 발주 체계 완성.',
          5: '🟢 5점 — 85%+. 연간 공급 계약 또는 VMI 구조 운영.'
        }
      },
      '3_2': { choices: [
        '독점·우선 공급권 — 경쟁사가 접근 못하는 공급처 확보',
        '납기 속도·재고 보유량 — 당일 출고 가능한 물류 인프라',
        '바이어·유통 채널 네트워크 — 타사가 뚫지 못한 거래 관계',
        '가격 경쟁력 — 대량 구매력으로 동급 최저가 제공',
        'PB 상품·자체 브랜드 — 가격 경쟁에서 독립된 마진 구조',
        '없음 / 아직 차별화 요소가 명확하지 않음'
      ], noneValue: '없음 / 아직 차별화 요소가 명확하지 않음' }
    },
    export_sme: {
      '1_3': {
        text: '해외 바이어의 재주문율(Repeat Order Rate)은 어느 수준입니까? — 신규 바이어 개발 비용이 재발주 유지 비용의 5~7배입니다.',
        inputLabel: '해외 바이어 재주문율 (%) — 모르면 아래 선택',
        placeholder: '예: 55',
        benchRef: { avg: 55, good: 75, label: '수출중소기업 바이어 재주문율', src: 'KOTRA 수출기업 실태조사 2023' },
        anchors: {
          1: '🔴 1점 — 재주문 30% 미만. 바이어 찾기→견적→협상 반복.',
          2: '🟠 2점 — 30~50%. 일부 재주문 있으나 단가 협상 반복.',
          3: '🟡 3점 — 50~70%. 주요 바이어 일부 안정화.',
          4: '🟢 4점 — 70~85%. 주요 바이어 연간 발주 계획 확보.',
          5: '🟢 5점 — 85%+. OEM 연간 계약 또는 독점 공급 계약.'
        }
      },
      '3_2': { choices: [
        '해외 인증(CE·FDA·ISO) 보유 — 경쟁사가 없는 수출 허가 자격',
        '핵심 바이어와 장기 파트너십 — 진입 장벽이 높은 신뢰 관계',
        '제품 설계·ODM 능력 — 바이어 요구 맞춤 설계·생산 가능',
        '가격·품질 경쟁력 — 중국·동남아 대비 신뢰도·품질 우위',
        '현지 물류·통관 파트너 네트워크 — 납기 신뢰성 우위',
        '없음 / 아직 차별화 요소가 명확하지 않음'
      ], noneValue: '없음 / 아직 차별화 요소가 명확하지 않음' }
    },
    logistics: {
      '1_3': {
        text: '주요 화주(물류를 맡기는 거래처)의 재계약율은 어느 수준입니까? — 공차율(빈 차로 다니는 비율)과 함께 가장 중요한 수익성 지표입니다.',
        inputLabel: '화주 재계약율 (%) — 모르면 아래 선택',
        placeholder: '예: 60',
        benchRef: { avg: 60, good: 80, label: '물류운송 화주 재계약율 평균', src: '국토교통부 화물운수업 실태조사 2023' },
        anchors: {
          1: '🔴 1점 — 재계약 30% 미만. 스팟 운송 위주. 공차율 높음.',
          2: '🟠 2점 — 30~50%. 일부 고정 거래처 있으나 단가 경쟁 심함.',
          3: '🟡 3점 — 50~70%. 주요 화주 반기 계약 일부 확보.',
          4: '🟢 4점 — 70~85%. 연간 계약 화주 보유. 노선 효율화 가능.',
          5: '🟢 5점 — 85%+. 전속 계약 화주 보유. 공차율 20% 미만 운영.'
        }
      },
      '3_2': { choices: [
        '전국 노선·거점 네트워크 — 경쟁사가 못 가는 지역까지 커버',
        '냉장·냉동·위험물 특수 운송 — 진입 장벽 높은 전문 허가 보유',
        'TMS·실시간 추적 시스템 — 투명한 배송 정보로 화주 신뢰 확보',
        '공차율 최소화·노선 최적화 — 경쟁사 대비 원가 우위',
        '화주 맞춤 SLA·전속 계약 — 이탈이 어려운 장기 파트너십',
        '없음 / 아직 차별화 요소가 명확하지 않음'
      ], noneValue: '없음 / 아직 차별화 요소가 명확하지 않음' }
    }
  };

  // 수치 항목 업종 기본 참고값 (COMMON_WORDING_MAP에 없는 업종 fallback)
  const NUMERIC_BENCH_REF_DEFAULT = {
    '1_1': { avg: 5,  good: 12, label: '중소기업 매출성장률 평균', src: '한국은행 기업경영분석 2023' },
    '1_2': { avg: 8,  good: 12, label: '중소기업 영업이익률 평균', src: '한국은행 기업경영분석 2023' },
    '1_3': { avg: 50, good: 70, label: '중소기업 재구매율 평균',  src: '소상공인진흥공단 2023' }
  };

  // DX 탐지 질문 — 점수 미반영, 전략 시그널 수집 전용
  const DX_DETECT_ITEM = {
    id: 'dx_detect',
    type: 'bars',
    _signalOnly: true,
    text: '고객관리·재고·회계·영업 업무에 디지털 도구를 얼마나 활용하고 있습니까? <span class="diag-signal-badge">점수 미반영 · AI 전략 방향 설정용</span>',
    min: '아날로그 중심',
    max: '디지털 선도',
    anchors: {
      1: '🔴 아날로그 중심 — 메모·엑셀·전화가 주요 도구. CRM·POS 전혀 없음.',
      2: '🟠 일부만 디지털 — 회계 프로그램 또는 배달앱·네이버 예약 정도.',
      3: '🟡 보통 — CRM·POS·재고 중 1개 이상 운영 중.',
      4: '🟢 적극 활용 — 2~3개 디지털 도구 연동 운영 중.',
      5: '🟢 선도적 — 자동화·데이터 대시보드·AI 도구까지 활용.'
    }
  };

  // 업종별 공통 질문 문구 오버라이드 적용
  function _applyIndustryWording(diagData, industryKey) {
    const overrides = COMMON_WORDING_MAP[industryKey] || {};
    return {
      title: diagData.title,
      description: diagData.description,
      insights: diagData.insights,
      areas: diagData.areas.map(area => ({
        id: area.id,
        title: area.title,
        description: area.description,
        items: area.items.map(item => {
          const ov = overrides[item.id];
          const base = ov ? Object.assign({}, item, ov) : item;
          // 수치 항목에 기본 참고값 주입 (override에 없는 경우)
          if (base.type === 'numeric' && !base.benchRef && NUMERIC_BENCH_REF_DEFAULT[item.id]) {
            return Object.assign({}, base, { benchRef: NUMERIC_BENCH_REF_DEFAULT[item.id] });
          }
          return base;
        })
      }))
    };
  }

  // DX 탐지 영역 주입
  function _injectDxDetect(diagData) {
    return {
      title: diagData.title,
      description: diagData.description,
      insights: diagData.insights,
      areas: diagData.areas.concat([{
        id: 'dx',
        title: '🔍 DX(디지털 전환) 현황 탐지',
        description: '이 항목은 점수에 반영되지 않습니다 — AI가 전략 방향 설정에만 활용합니다.',
        items: [DX_DETECT_ITEM]
      }])
    };
  }

  /* ── 업종 기반 사업모델 추론 ── */
  function inferBizModel(industryKey, formData) {
    const candidates = INDUSTRY_BM_MAP[industryKey] || INDUSTRY_BM_MAP['etc'];
    if (!candidates || !candidates.length) return { primary: 'service', candidates: ['service'] };

    const products  = (formData.products     || '').toLowerCase();
    const strength  = (formData.coreStrength || '').toLowerCase();
    const problem   = (formData.customerProblem || '').toLowerCase();
    const advantage = (formData.unfairAdvantage || '').toLowerCase();
    const all = products + ' ' + strength + ' ' + problem + ' ' + advantage;

    // 키워드 → BM 키 점수 부여
    const signals = {
      b2b_saas:     ['saas', '구독', 'subscription', 'b2b', '월정액', '소프트웨어', '클라우드', '대시보드', 'api'],
      b2c_sub:      ['구독', 'membership', '월정액', 'b2c', '정기', '회원권', '넷플릭스'],
      b2b_solution: ['솔루션', 'erp', 'si', '시스템', 'b2b', '납품', '구축', '맞춤'],
      b2c_commerce: ['쇼핑몰', '커머스', '이커머스', '판매', '온라인', '직구', '스마트스토어', '쿠팡'],
      platform:     ['플랫폼', '마켓플레이스', '중개', '연결', '매칭', '앱', '마켓'],
      franchise:    ['프랜차이즈', '가맹', '직영', '체인', '점포', '매장'],
      mfg_dist:     ['제조', '생산', '공장', '도매', '유통', 'oem', '납품', '수출', '원자재'],
      service:      ['서비스', '컨설팅', '대행', '위탁', '용역', '운영', '관리'],
      usage_based:  ['사용량', '건당', '종량제', 'pay-as', '과금', '건별', '사용한만큼'],
      advertising:  ['광고', '미디어', '콘텐츠', 'sns', '유튜브', '인플루언서', '뷰어', '트래픽'],
      deeptech:     ['ai', '딥러닝', '바이오', '신약', '임상', '연구', '특허', '기술이전', '혁신']
    };

    const scores = {};
    candidates.forEach(bm => { scores[bm] = 0; });
    candidates.forEach(bm => {
      (signals[bm] || []).forEach(kw => {
        if (all.includes(kw)) scores[bm] += 2;
      });
    });

    // 우선순위 순서(INDUSTRY_BM_MAP 인덱스)에 기본 가중치 부여
    candidates.forEach((bm, idx) => { scores[bm] += (candidates.length - idx); });

    const sorted = candidates.slice().sort((a, b) => (scores[b] || 0) - (scores[a] || 0));
    return { primary: sorted[0], candidates: sorted.slice(0, Math.min(3, sorted.length)) };
  }

  /* ═══════════════════════════════════════════════════════════
     사업자등록번호 자동조회 관련 함수
  ═══════════════════════════════════════════════════════════ */

  // 업태/종목 키워드 → 16개 업종 매핑 테이블
  // keywords: 업태/종목 텍스트에서 매칭할 키워드 목록
  // itemKeywords: 종목에서만 우선 매칭 (가중치 3배 — 종목이 업태보다 구체적)
  const BIZ_TYPE_MAP = [
    {
      keywords:     ['제조', '가공', '금속', '기계', '부품', '주조', '단조', '열처리', '도금', '용접', '프레스', '반도체', '전자부품', '자동차부품', '사출', '압출', '판금', '금형'],
      itemKeywords: ['부품', '금속가공', '기계부품', '전자부품', '자동차부품', '주조품', '단조품', '사출품', '반도체'],
      industry: '제조업'
    },
    {
      keywords:     ['식품', '음료', '제과', '제빵', '육가공', '수산', '농산물가공', '식료품', '음식료품', '식재료', '김치', '장류', '음료제조'],
      itemKeywords: ['식품', '음료', '과자', '빵', '육류가공', '수산가공', '김치', '소스', '음식료'],
      industry: '식품/음료'
    },
    {
      keywords:     ['외식', '음식점', '식당', '요식', '카페', '베이커리', '치킨', '피자', '패스트푸드', '분식', '한식', '중식', '일식', '호프', '주점', '커피', '휴게음식'],
      itemKeywords: ['음식점', '식당', '카페', '커피', '치킨', '피자', '분식', '한식', '중식', '일식', '호프', '주점'],
      industry: '외식 및 휴게음식업'
    },
    {
      keywords:     ['소프트웨어', 'it', '정보통신', '컴퓨터', '웹', '앱', '개발', '플랫폼', '데이터', 'ai', 'saas', '정보기술', '통신', 'ict', '시스템개발', '솔루션개발'],
      itemKeywords: ['소프트웨어', '앱개발', '웹개발', '시스템개발', '솔루션', '플랫폼개발', '데이터분석', 'ai개발'],
      industry: 'IT/소프트웨어'
    },
    {
      keywords:     ['건설', '인테리어', '시공', '토목', '철거', '리모델링', '도장', '설비', '전기공사', '소방', '조경', '건축', '실내장식', '가구', '목공', '타일', '방수', '미장', '창호'],
      itemKeywords: ['인테리어', '실내장식', '리모델링', '가구', '목공', '시공', '건축공사', '전기공사', '설비공사', '철거', '도장', '타일'],
      industry: '건설/부동산'
    },
    {
      keywords:     ['도소매', '도매', '소매', '유통', '판매', '대리점', '중간유통'],
      itemKeywords: ['도매', '소매', '유통', '판매업', '대리점'],
      industry: '유통/물류'
    },
    {
      keywords:     ['물류', '운송', '배송', '택배', '화물', '운반', '창고', '보관', '포워딩', '통관'],
      itemKeywords: ['운송', '택배', '화물', '창고보관', '포워딩'],
      industry: '물류운송'
    },
    {
      keywords:     ['의료', '병원', '의원', '약국', '보건', '한의', '치과', '정형', '피부과', '헬스케어', '의약', '재활'],
      itemKeywords: ['병원', '의원', '약국', '한의원', '치과', '의료기기', '재활'],
      industry: '의료/헬스케어'
    },
    {
      keywords:     ['교육', '학원', '학습', '훈련', '강습', '이러닝', '에듀', '직업훈련', '어학', '입시'],
      itemKeywords: ['학원', '교습', '훈련', '이러닝', '직업교육', '어학교육'],
      industry: '교육'
    },
    {
      keywords:     ['금융', '보험', '증권', '투자', '핀테크', '대출', '저축', '신용', '카드', '결제', '자산관리'],
      itemKeywords: ['보험', '대출', '투자', '핀테크', '자산관리', '증권'],
      industry: '금융/핀테크'
    },
    {
      keywords:     ['패션', '의류', '섬유', '봉제', '뷰티', '화장품', '미용', '네일', '헤어', '잡화', '액세서리'],
      itemKeywords: ['의류', '패션', '화장품', '미용', '봉제', '헤어', '네일'],
      industry: '패션/뷰티'
    },
    {
      keywords:     ['미디어', '방송', '콘텐츠', '영상', '광고', '출판', '엔터테인먼트', '음악', '영화', '게임', '웹툰', 'sns'],
      itemKeywords: ['콘텐츠', '영상제작', '광고', '음악', '게임', '출판', '웹툰'],
      industry: '미디어/엔터테인먼트'
    },
    {
      keywords:     ['수출', '해외', '글로벌', '수출제조', '해외영업', '바이어'],
      itemKeywords: ['수출', '해외판매', '수출제조'],
      industry: '수출중소기업'
    },
    {
      keywords:     ['에너지', '환경', '재생에너지', '태양광', '풍력', '폐기물', '재활용', '탄소', '친환경', '수처리', 'ess', '전기차'],
      itemKeywords: ['태양광', '풍력', '폐기물처리', '재활용', '수처리', '탄소'],
      industry: '환경에너지'
    },
    {
      keywords:     ['농업', '임업', '축산', '수산', '원물', '농산물', '농림', '식품원료', '곡물', '과일', '채소', '가축', '양식'],
      itemKeywords: ['농산물', '축산물', '수산물', '곡물', '원물', '식품원료'],
      industry: '농림식품원료'
    },
    {
      keywords:     ['서비스', '대행', '용역', '위탁', '관리', '청소', '경비', '세탁', '수선', '수리', '유지보수', '생활서비스'],
      itemKeywords: ['청소', '경비', '세탁', '수리', '대행서비스'],
      industry: '서비스업'
    }
  ];

  // BIZ_TYPE_MAP에 사회적기업 / 소셜벤처 키워드 추가
  BIZ_TYPE_MAP.push({
    keywords: ['사회적기업', '사회적 기업', '사회적기업형', '사회적'],
    itemKeywords: ['사회적기업', '사회적기업 인증', '사회적경제'],
    industry: '사회적기업'
  });
  BIZ_TYPE_MAP.push({
    keywords: ['소셜벤처', '소셜벤쳐', '사회적벤처', '소셜'],
    itemKeywords: ['소셜벤처', '임팩트 스타트업', '사회적벤처'],
    industry: '소셜벤처'
  });

  // 사업자등록번호 포맷 (###-##-#####)
  function formatBizNo(el) {
    let v = el.value.replace(/\D/g, '');
    if (v.length > 10) v = v.slice(0, 10);
    if (v.length > 5) v = v.slice(0, 3) + '-' + v.slice(3, 5) + '-' + v.slice(5);
    else if (v.length > 3) v = v.slice(0, 3) + '-' + v.slice(3);
    el.value = v;

    const status = document.getElementById('bizLookupStatus');
    if (!status) return;
    if (v.replace(/-/g, '').length === 10) {
      const valid = validateBizNo(v.replace(/-/g, ''));
      if (valid) {
        status.className = 'biz-lookup-status biz-status-ok';
        status.textContent = '✓ 올바른 사업자등록번호 형식입니다';
        status.classList.remove('hidden');
      } else {
        status.className = 'biz-lookup-status biz-status-err';
        status.textContent = '✗ 유효하지 않은 번호입니다. 다시 확인해주세요.';
        status.classList.remove('hidden');
      }
    } else {
      status.classList.add('hidden');
    }
  }

  // 사업자등록번호 체크섬 검증
  function validateBizNo(no) {
    if (!/^\d{10}$/.test(no)) return false;
    const d = no.split('').map(Number);
    const w = [1, 3, 7, 1, 3, 7, 1, 3, 5];
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += d[i] * w[i];
    sum += Math.floor(d[8] * 5 / 10);
    return (10 - (sum % 10)) % 10 === d[9];
  }

  // 국세청 API 조회 (Vercel Serverless Function 경유)
  async function lookupBiz() {
    const bizNo  = (document.getElementById('bizRegNo')?.value || '').replace(/-/g, '');
    const repNm  = (document.getElementById('repName')?.value  || '').trim();
    const status = document.getElementById('bizLookupStatus');

    if (bizNo.length !== 10) {
      alert('10자리 사업자등록번호를 입력해주세요.');
      return;
    }
    if (!validateBizNo(bizNo)) {
      alert('유효하지 않은 사업자등록번호입니다.');
      return;
    }
    if (!repNm) {
      alert('대표자명을 입력해주세요.');
      return;
    }

    if (status) {
      status.className = 'biz-lookup-status biz-status-loading';
      status.textContent = '⏳ 조회 중...';
      status.classList.remove('hidden');
    }

    try {
      const res = await fetch('/api/biz-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bizNo, repName: repNm })
      });
      const data = await res.json();

      if (data.status === 'active') {
        if (status) {
          status.className = 'biz-lookup-status biz-status-ok';
          status.textContent = '✓ 정상 사업자로 확인되었습니다. 아래 업태·종목을 입력하면 업종이 자동으로 설정됩니다.';
        }
        const typeRow = document.getElementById('bizTypeRow');
        if (typeRow) typeRow.style.display = 'flex';
      } else if (data.status === 'closed') {
        if (status) {
          status.className = 'biz-lookup-status biz-status-err';
          status.textContent = '✗ 폐업한 사업자로 조회됩니다.';
        }
      } else if (data.status === 'suspended') {
        if (status) {
          status.className = 'biz-lookup-status biz-status-warn';
          status.textContent = '⚠ 휴업 상태의 사업자로 조회됩니다.';
        }
        const typeRow = document.getElementById('bizTypeRow');
        if (typeRow) typeRow.style.display = 'flex';
      } else {
        if (status) {
          status.className = 'biz-lookup-status biz-status-err';
          status.textContent = '아래 업태·종목을 직접 입력하시면 업종이 자동 설정됩니다.';
        }
        const typeRow = document.getElementById('bizTypeRow');
        if (typeRow) typeRow.style.display = 'flex';
      }
    } catch (e) {
      if (status) {
        status.className = 'biz-lookup-status biz-status-err';
        status.textContent = '아래 업태·종목을 직접 입력하시면 업종이 자동 설정됩니다.';
      }
      const typeRow = document.getElementById('bizTypeRow');
      if (typeRow) typeRow.style.display = 'flex';
    }
  }

  // 업태/종목 텍스트 → 16개 업종 자동매핑 (종목 가중치 3배)
  function inferIndustryFromType() {
    const bizType = (document.getElementById('bizType')?.value || '').toLowerCase();
    const bizItem = (document.getElementById('bizItem')?.value || '').toLowerCase();
    if (!(bizType + bizItem).trim()) return;

    const resultEl = document.getElementById('bizInferResult'); // optional display element

    const scores = {};
    BIZ_TYPE_MAP.forEach(entry => {
      let score = 0;
      // 업태 키워드 매칭 (가중치 1)
      entry.keywords.forEach(kw => { if (bizType.includes(kw)) score += 1; });
      // 종목 일반 키워드 매칭 (가중치 2)
      entry.keywords.forEach(kw => { if (bizItem.includes(kw)) score += 2; });
      // 종목 전용 키워드 매칭 (가중치 3 — 더 정확한 매칭)
      (entry.itemKeywords || []).forEach(kw => { if (bizItem.includes(kw)) score += 3; });
      if (score > 0) scores[entry.industry] = (scores[entry.industry] || 0) + score;
    });

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

    if (sorted.length === 0) {
      if (resultEl) {
        resultEl.className = 'biz-infer-result biz-infer-warn';
        resultEl.textContent = '⚠ 업종을 자동 판별하지 못했습니다. 아래 업종 드롭다운에서 직접 선택해주세요.';
        resultEl.classList.remove('hidden');
      }
      return;
    }

    const [topIndustry, topScore] = sorted[0];
    // BIZ_TYPE_MAP.industry는 한국어 레이블 → INDUSTRY_MAP으로 영문 키 변환
    const topKey = INDUSTRY_MAP[topIndustry] || topIndustry;

    // aiIndustryKey hidden 필드에 영문 키 저장
    const aiKeyEl = document.getElementById('aiIndustryKey');
    if (aiKeyEl) aiKeyEl.value = topKey;

    // 레거시 select 지원 (존재하는 경우에만)
    const industrySelect = document.getElementById('industry');
    if (industrySelect) industrySelect.value = topIndustry;

    // 2위 점수가 1위의 70% 이상이면 후보 2개 표시
    let msg = '✓ 업종 자동 설정: ' + topIndustry;
    if (sorted.length > 1 && sorted[1][1] >= topScore * 0.7) {
      msg += ' (후보: ' + sorted[1][0] + ') — 아래에서 확인 후 변경 가능합니다.';
    } else {
      msg += ' — 아래에서 확인 후 변경 가능합니다.';
    }
    if (resultEl) {
      resultEl.className = 'biz-infer-result biz-infer-ok';
      resultEl.textContent = msg;
      resultEl.classList.remove('hidden');
    }

    // 추론된 업종(영문 키)으로 placeholder 즉시 업데이트
    updateBizPlaceholders(topKey);
    updateRiskPlaceholder(topKey);

    // BM 추론 (inferredBmDisplay가 있는 경우)
    const display = document.getElementById('inferredBmDisplay');
    if (display) {
      const formData = {
        products: document.getElementById('products')?.value || '',
        coreStrength: document.getElementById('coreStrength')?.value || '',
        customerProblem: document.getElementById('customerProblem')?.value || '',
        unfairAdvantage: document.getElementById('unfairAdvantage')?.value || ''
      };
      const bmResult = inferBizModel(topKey, formData);
      _inferredBmKey = bmResult.primary;
      const hiddenBm = document.getElementById('bizModel');
      if (hiddenBm) hiddenBm.value = BM_LABELS[_inferredBmKey] || _inferredBmKey;
      let html = '';
      bmResult.candidates.forEach((bm, idx) => {
        const label = BM_LABELS[bm] || bm;
        html += '<span class="bm-tag' + (idx === 0 ? ' primary' : '') + '">' +
                (idx === 0 ? '★ ' : '') + label + '</span>';
      });
      html += '<span class="bm-infer-hint">★ 1순위 적용 · 진단은 자동 연동됩니다</span>';
      display.innerHTML = html;
    }
  }

  // 사업자 조회 블록 건너뛰기
  function skipBizLookup() {
    const block = document.getElementById('bizLookupBlock');
    if (block) block.style.display = 'none';
    const dartBlock = document.getElementById('dartLookupBlock');
    if (dartBlock) dartBlock.classList.remove('hidden');
  }

  /* ═══════════════════════════════════════════════════════════
     자동입력 탭 전환
  ═══════════════════════════════════════════════════════════ */
  function switchAutoTab(tab) {
    const isBizno = tab === 'bizno';
    document.getElementById('autoTabBizno').style.display = isBizno ? '' : 'none';
    document.getElementById('autoTabOcr').style.display   = isBizno ? 'none' : '';
    document.getElementById('tabBizNo').classList.toggle('active',  isBizno);
    document.getElementById('tabOcr').classList.toggle('active',   !isBizno);
  }

  /* ═══════════════════════════════════════════════════════════
     OCR: 사업자등록증 이미지 → 자동입력
  ═══════════════════════════════════════════════════════════ */
  /* 이미지 → JPEG 압축 (최대 1200px, 85%) → base64 반환 */
  function _compressImage(file) {
    return new Promise(function(resolve) {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = function() {
        const MAX = 1200;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
          else        { w = Math.round(w * MAX / h); h = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        canvas.toBlob(function(blob) {
          const reader = new FileReader();
          reader.onloadend = function() { resolve(reader.result.split(',')[1]); };
          reader.readAsDataURL(blob);
        }, 'image/jpeg', 0.85);
      };
      img.onerror = function() {
        URL.revokeObjectURL(url);
        // 압축 실패 시 원본 그대로 사용
        const r = new FileReader();
        r.onloadend = function() { resolve(r.result.split(',')[1]); };
        r.readAsDataURL(file);
      };
      img.src = url;
    });
  }

  function handleOcrUpload(input) {
    const file = input.files[0];
    if (!file) return;

    const statusEl = document.getElementById('ocrStatus');
    const previewEl = document.getElementById('ocrPreview');

    statusEl.className = 'biz-lookup-status biz-status-loading';
    statusEl.textContent = '⏳ 이미지 압축 및 인식 중... (최대 40초)';
    statusEl.classList.remove('hidden');
    if (previewEl) previewEl.classList.add('hidden');

    // 비동기 처리 (압축 → OCR)
    (async function() {
      let base64;
      try {
        base64 = await _compressImage(file);
      } catch(e) {
        const r = new FileReader();
        r.onloadend = function() { base64 = r.result.split(',')[1]; };
        r.readAsDataURL(file);
        await new Promise(res => setTimeout(res, 100));
      }

      // 40초 타임아웃
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 40000);

      try {
        const res = await fetch('/api/ocr-scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mimeType: 'image/jpeg' }),
          signal: controller.signal
        });
        clearTimeout(timeout);
        let data;
        try { data = await res.json(); }
        catch(e) { throw new Error('서버 응답 파싱 오류 (status: ' + res.status + ')'); }

        if (data.status === 'no_key') {
          statusEl.className = 'biz-lookup-status biz-status-warn';
          statusEl.textContent = '⚠ OCR API 키가 설정되지 않았습니다. 직접 입력해주세요.';
          return;
        }
        if (data.status !== 'success') {
          statusEl.className = 'biz-lookup-status biz-status-err';
          statusEl.textContent = '인식 결과가 없습니다. 더 선명한 이미지를 사용해주세요.';
          return;
        }

        // 인식된 데이터를 새 폼에 자동입력
        let filled = [];
        const fill = (id, val, label) => {
          if (!val) return;
          const el = document.getElementById(id);
          if (el) { el.value = val; filled.push(label); }
        };
        // foundedYear: 날짜형(20101116) → 연도(2010)만 추출
        const rawYear = String(data.foundedYear || '');
        const yearOnly = rawYear.length >= 4 ? rawYear.substring(0, 4) : rawYear;
        fill('companyName', data.companyName, '상호명');
        fill('bizType',     data.bizType,     '업태');
        fill('bizItem',     data.bizItem,     '종목');
        fill('foundedYear', yearOnly || data.foundedYear, '개업연도');

        // OCR 자동입력 후 업종 추론 + placeholder 업데이트
        inferIndustryFromType();

        statusEl.className = 'biz-lookup-status biz-status-ok';
        statusEl.textContent = `✓ ${filled.join(', ')} 자동입력 완료 — 아래에서 확인하고 수정하세요. 이상 없으면 [AI 업종 분석 시작]을 눌러주세요.`;

      } catch (err) {
        clearTimeout(timeout);
        statusEl.className = 'biz-lookup-status biz-status-err';
        statusEl.textContent = err.name === 'AbortError'
          ? '⏱ OCR 시간 초과 (40초). 직접 입력해주세요.'
          : 'OCR 처리 중 오류가 발생했습니다. 직접 입력해주세요.';
      }
    })();
  }

  /* ═══════════════════════════════════════════════════════════
     DART: 회사명 → 재무제표 자동조회
  ═══════════════════════════════════════════════════════════ */
  function onCompanyNameInput(el) {
    const dartBlock = document.getElementById('dartLookupBlock');
    if (!dartBlock) return;
    if (el.value.trim().length >= 2) {
      dartBlock.classList.remove('hidden');
    } else {
      dartBlock.classList.add('hidden');
    }
  }

  async function lookupDart() {
    const companyName = (document.getElementById('companyName')?.value || '').trim();
    const statusEl = document.getElementById('dartStatus');
    const resultEl = document.getElementById('dartResult');

    if (companyName.length < 2) { alert('회사명을 먼저 입력해주세요.'); return; }

    statusEl.className = 'biz-lookup-status biz-status-loading';
    statusEl.textContent = '⏳ DART에서 재무정보 조회 중...';
    statusEl.classList.remove('hidden');
    resultEl.classList.add('hidden');

    try {
      const res = await fetch('/api/dart-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName })
      });
      const data = await res.json();

      if (data.status === 'no_key') {
        statusEl.className = 'biz-lookup-status biz-status-warn';
        statusEl.textContent = '⚠ DART API 키가 설정되지 않았습니다.';
        return;
      }
      if (data.status === 'not_found' || data.status === 'no_financial') {
        statusEl.className = 'biz-lookup-status biz-status-warn';
        statusEl.textContent = `⚠ ${data.corpName ? '"' + data.corpName + '" ' : ''}DART 재무데이터가 없습니다. (소상공인·개인사업자는 미등록)`;
        return;
      }
      if (data.status !== 'found') {
        statusEl.className = 'biz-lookup-status biz-status-err';
        statusEl.textContent = '조회에 실패했습니다.';
        return;
      }

      // 결과 표시
      statusEl.className = 'biz-lookup-status biz-status-ok';
      statusEl.textContent = `✓ "${data.corpName}" ${data.year}년 재무데이터 조회 완료`;

      const fmt = (v) => v !== null ? v.toLocaleString() + '억원' : '정보없음';
      const debtRatioTxt = data.debtRatio !== null ? data.debtRatio + '%' : '정보없음';

      resultEl.innerHTML = `
        <div class="dart-result-grid">
          <div class="dart-item"><span class="dart-label">매출액</span><span class="dart-value">${fmt(data.revenue?.eok)}</span></div>
          <div class="dart-item"><span class="dart-label">영업이익</span><span class="dart-value">${fmt(data.operatingProfit?.eok)}</span></div>
          <div class="dart-item"><span class="dart-label">당기순이익</span><span class="dart-value">${fmt(data.netIncome?.eok)}</span></div>
          <div class="dart-item"><span class="dart-label">부채비율</span><span class="dart-value">${debtRatioTxt}</span></div>
        </div>
        <button type="button" class="btn-apply-dart" onclick="Wizard.applyDartRevenue(${data.revenue?.eok})">
          매출액 ${fmt(data.revenue?.eok)} 적용하기
        </button>`;
      resultEl.classList.remove('hidden');

    } catch (err) {
      statusEl.className = 'biz-lookup-status biz-status-err';
      statusEl.textContent = 'DART 조회 중 오류가 발생했습니다.';
    }
  }

  function applyDartRevenue(eok) {
    if (eok === null || eok === undefined) return;
    const el = document.getElementById('revenue');
    if (el) el.value = eok + '억';
    alert(`연매출 ${eok.toLocaleString()}억원이 적용되었습니다.`);
  }

  function onIndustryChange() {
    const industry   = document.getElementById('industry')?.value || '';
    const industryKey = INDUSTRY_MAP[industry] || 'etc';
    const formData   = {
      products:        document.getElementById('products')?.value        || '',
      coreStrength:    document.getElementById('coreStrength')?.value    || '',
      customerProblem: document.getElementById('customerProblem')?.value || '',
      unfairAdvantage: document.getElementById('unfairAdvantage')?.value || ''
    };
    const result = inferBizModel(industryKey, formData);
    _inferredBmKey = result.primary;

    // hidden 필드에 표시용 레이블 저장 (buildPrompt 연동)
    const hiddenBm = document.getElementById('bizModel');
    if (hiddenBm) hiddenBm.value = BM_LABELS[_inferredBmKey] || _inferredBmKey;

    // 표시 업데이트
    const display = document.getElementById('inferredBmDisplay');
    if (!display) return;
    if (!industry) {
      display.innerHTML = '업종을 선택하면 사업모델이 자동으로 추론됩니다';
      return;
    }
    let html = '';
    result.candidates.forEach((bm, idx) => {
      const label = BM_LABELS[bm] || bm;
      html += '<span class="bm-tag' + (idx === 0 ? ' primary' : '') + '">' +
              (idx === 0 ? '★ ' : '') + label + '</span>';
    });
    html += '<span class="bm-infer-hint">★ 1순위 적용 · 진단은 자동 연동됩니다</span>';
    display.innerHTML = html;

    updateBizPlaceholders(industryKey);
    updateRiskPlaceholder(industryKey);
  }

  /* ── biz-context 화면 렌더링 ── */
  function showBizContext(data, companyName, foundedYear) {
    const currentYear = new Date().getFullYear();
    const years = foundedYear ? currentYear - parseInt(foundedYear) : null;
    const isStartup = data.is_startup === true || years === 0 || years < 1;
    const scaleLabel = data.biz_scale === 'micro' ? '소상공인' : '소기업·중소기업';

    const areasHtml = (data.critical_areas || [])
      .map(a => `<li>${a}</li>`).join('');

    const noteHtml = data.diagnosis_note
      ? `<div class="biz-ctx-note">⚠️ 진단 시 유의: ${data.diagnosis_note}</div>` : '';

    const startupBanner = isStartup ? `
      <div class="biz-ctx-startup-banner">
        🚀 <strong>창업 초기 모드</strong> — 개업 1년 미만 사업체입니다.<br>
        진단 항목 중 실제 데이터가 없는 경우 <strong>목표값·예상값·계획치</strong>로 입력해주세요.<br>
        AI가 창업 초기 특화 전략(초기 계약 확보·현금 생존·BEP 달성)을 제시합니다.
      </div>` : '';

    document.getElementById('biz-context-content').innerHTML = `
      ${startupBanner}
      <div class="biz-ctx-card">
        <div class="biz-ctx-header">
          <div class="biz-ctx-name">🏪 ${companyName || '입력하신 사업체'}</div>
          <div class="biz-ctx-type-badge">${data.industry_label || data.industry_key}</div>
        </div>
        <div class="biz-ctx-desc">"${data.business_description || ''}"</div>
        <div class="biz-ctx-meta">
          ${isStartup
            ? `<span>🚀 창업 초기 (${foundedYear}년 개업)</span>`
            : (years ? `<span>⏱ 업력 ${years}년차 (${foundedYear}년 개업)</span>` : '')}
          <span>📊 ${scaleLabel}</span>
        </div>
        <div class="biz-ctx-areas">
          <div class="biz-ctx-areas-title">🎯 이 업종의 핵심 진단 영역</div>
          <ul>${areasHtml}</ul>
        </div>
        ${noteHtml}
      </div>
    `;

    // 정책자금 경로는 step5 인증 체크박스로 사회적경제 여부를 이미 받으므로
    // 조직 형태 선택을 노출하지 않는다 (중복 질문 방지)
    const orgBlock = document.getElementById('orgTypeBlock');
    if (orgBlock) orgBlock.style.display = (_purpose === 'funding') ? 'none' : '';
  }

  /* 모든 wizard 카드 숨기기 */
  function hideAllCards() {
    ['step1', 'step1-extra', 'step2', 'step3', 'step4', 'bm-confirm', 'biz-context'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
  }

  /* 드래그&드롭 OCR 핸들러 */
  function handleOcrDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const input = document.getElementById('ocrFileInput');
    if (input) {
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      handleOcrUpload(input);
    }
  }

  function goStep(n, skipValidation) {
    // biz-context / bm-confirm 화면은 항상 숨기고 이동
    const bizCtx = document.getElementById('biz-context');
    if (bizCtx) bizCtx.classList.add('hidden');
    const bmCard = document.getElementById('bm-confirm');
    if (bmCard) bmCard.classList.add('hidden');

    // 정책자금 진단 경로 — step2·3·4를 건너뛰고 step5로 리다이렉트 (loadDiagnosisUI 미호출)
    if (_purpose === 'funding' && n === 2) n = 5;

    // STEP 2에서 다음 버튼 클릭 시 탭 순서대로 진행 (n===3 또는 n===4 모두 처리)
    if (curStep === 2 && n > 2) {
      if (!validateCurrentTab()) return;
      const _order = _tabOrder();
      const currentTabIndex = _order.indexOf(curDiagTab);
      if (currentTabIndex < _order.length - 1) {
        const nextTab = _order[currentTabIndex + 1];
        switchDiagTab(nextTab);
        window.scrollTo(0, 60);
        return;
      }
    }

    if (!skipValidation && n > curStep && !validate(curStep)) return;
    if (n === 2) loadDiagnosisUI();

    const prevStep = curStep;
    curStep = n;
    updateStepUI(n);
    if (n === 5) updateFundIndustryDisplay();

    const prev = document.getElementById('step' + prevStep);
    const next = document.getElementById('step' + n);
    if (prevStep !== n) {
      prev.classList.add('slide-exit');
      setTimeout(() => {
        prev.classList.add('hidden');
        prev.classList.remove('slide-exit');
        next.classList.remove('hidden');
        next.classList.add('slide-enter');
        setTimeout(() => next.classList.remove('slide-enter'), 400);
      }, 250);
    }
    window.scrollTo(0, 60);
  }

  /* STEP 인디케이터를 general 기준(3단계)으로 원복 — funding 잔상 제거용
     DOM에는 c1~c3 / l1~l3 / ln1~ln2만 존재 (c4·ln3 없음) */
  function _restoreStepIndicator() {
    const l2 = document.getElementById('l2');
    if (l2) l2.textContent = '맞춤 진단';
    const c3 = document.getElementById('c3');
    const ind3 = c3 ? c3.closest('.step-ind') : null;
    if (ind3) ind3.style.display = '';
    const ln2 = document.getElementById('ln2');
    if (ln2) ln2.style.display = '';
  }

  function updateStepUI(n) {
    // ① 목적과 무관하게 먼저 general 기준으로 무조건 원복
    _restoreStepIndicator();

    // ② 정책자금 진단 — 2단계(사업자 정보 → 정책자금 진단)로 축약 표시
    if (_purpose === 'funding') {
      const l2f = document.getElementById('l2');
      if (l2f) l2f.textContent = '정책자금 진단';
      const c3f = document.getElementById('c3');
      const ind3f = c3f ? c3f.closest('.step-ind') : null;
      if (ind3f) ind3f.style.display = 'none';
      const ln2f = document.getElementById('ln2');
      if (ln2f) ln2f.style.display = 'none';

      const stage = n === 1 ? 1 : 2;   // step5 → 2번째 인디케이터
      for (let i = 1; i <= 2; i++) {
        const c = document.getElementById('c' + i);
        const lb = document.getElementById('l' + i);
        if (!c || !lb) continue;
        c.classList.remove('active', 'done');
        lb.classList.remove('active');
        if (i < stage)        { c.classList.add('done'); c.textContent = '✓'; }
        else if (i === stage) { c.classList.add('active'); c.textContent = i; lb.classList.add('active'); }
        else                  { c.textContent = i; }
      }
      const ln1f = document.getElementById('ln1');
      if (ln1f) ln1f.classList.toggle('done', stage > 1);
      const fillF = document.getElementById('wizProgressFill');
      if (fillF) fillF.style.width = (n === 1 ? 50 : 100) + '%';
      return;
    }

    // ③ general — 기존 동작 그대로 유지
    for (let i = 1; i <= 4; i++) {
      const c = document.getElementById('c' + i);
      const lb = document.getElementById('l' + i);
      if (!c || !lb) continue;
      c.classList.remove('active', 'done');
      lb.classList.remove('active');
      if (i < n)        { c.classList.add('done'); c.textContent = '✓'; }
      else if (i === n) { c.classList.add('active'); c.textContent = i; lb.classList.add('active'); }
      else              { c.textContent = i; }
    }
    const ln1 = document.getElementById('ln1');
    const ln2 = document.getElementById('ln2');
    const ln3 = document.getElementById('ln3');
    if (ln1) ln1.classList.toggle('done', n > 1);
    if (ln2) ln2.classList.toggle('done', n > 2);
    if (ln3) ln3.classList.toggle('done', n > 3);
    const pct = n === 1 ? 33 : n === 2 ? 66 : 100;
    document.getElementById('wizProgressFill').style.width = pct + '%';
  }

  function validate(step) {
    const get = id => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };
    if (step === 1) {
      if (!get('companyName')) { alert('상호명을 입력해주세요.'); return false; }
      if (!get('bizType'))     { alert('업태를 입력해주세요.\n(사업자등록증의 업태 — 예: 서비스, 제조, 음식점)'); return false; }
      if (!get('bizItem'))     { alert('종목을 입력해주세요.\n(사업자등록증의 종목 — 예: 미용업, 한식, 자동차부품)'); return false; }
    }
    if (step === 2) {
      // 진행률과 동일한 기준(활성 컨테이너 · signal-only 제외)을 쓴다
      const total = _countDiagItems();
      if (!total) { alert('진단 화면이 로드되지 않았습니다. 잠시 후 다시 시도해주세요.'); return false; }
      const done  = _countDoneScores();
      if (done < total) {
        alert('진단 항목을 모두 입력해주세요. (' + done + ' / ' + total + '개 완료)');
        return false;
      }
    }
    if (step === 3) {
      if (!get('targetCustomer')) { alert('타겟 고객을 입력해주세요.');         return false; }
      if (!get('comp1Name'))      { alert('경쟁사 1의 이름을 입력해주세요.'); return false; }
    }
    if (step === 4) {
      if (!get('problems')) { alert('현재 직면한 문제를 입력해주세요.'); return false; }
      if (!get('goals'))    { alert('달성 목표를 입력해주세요.');         return false; }
    }
    // 정책자금 진단 — 결격요건 7문항만 필수 ('모름'도 정상 입력). 체크박스·재무는 선택
    if (step === 5) {
      document.querySelectorAll('.fund-invalid').forEach(el => el.classList.remove('fund-invalid'));
      const missing = FUND_ELIG_ITEMS.filter(([name]) => !document.querySelector(`input[name="${name}"]:checked`));
      if (missing.length) {
        missing.forEach(([name]) => document.getElementById(name)?.classList.add('fund-invalid'));
        document.getElementById(missing[0][0])?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        alert('결격 요건 ' + missing.length + '개 항목이 선택되지 않았습니다.\n\n'
              + missing.map(([, label]) => '· ' + label).join('\n')
              + "\n\n정확히 모르시는 항목은 '모름'을 선택해 주세요.");
        return false;
      }
    }
    return true;
  }

  function loadDiagnosisUI(forceIndustryKey) {
    // AI 분석 결과 key 우선 → hidden input(aiIndustryKey) → 드롭다운(레거시) → 기본값
    const industry    = document.getElementById('industry')?.value || '';
    const aiKey       = document.getElementById('aiIndustryKey')?.value || '';
    const industryKey = forceIndustryKey || aiKey || INDUSTRY_MAP[industry] || 'local_service';
    const bizModelKey = _inferredBmKey || 'etc';

    // bizScale 감지 — 소상공인 전용 진단 분기
    const empVal = document.getElementById('employees')?.value || '';
    const explicitScale = document.getElementById('bizScale')?.value || document.getElementById('bizScaleSelect')?.value || '';
    const currentBizScale = explicitScale || ((!empVal || empVal === '1~5명') ? 'micro' : 'sme');

    /* 창업 초기(개업 1년 미만) 여부를 먼저 구한다.
       ⚠ 과거에는 이 검사가 마지막 else 안에만 있어 micro 경로가 STARTUP을 영영 타지 못했다.
          매출 이력이 없는 창업자에게 '최근 3개월 재방문율'을 묻는 상태였다.
          isMicro에서 창업 초기를 제외하면 micro도 STARTUP 분기로 흐른다.
       ⚠ isSocial(사회적경제 3유형)은 건드리지 않는다 — 의도적 배제 여부가 확인되지 않았다. */
    const isStartupMode = document.getElementById('aiIsStartup')?.value === 'true';
    const isMicro = currentBizScale === 'micro' && !isStartupMode && typeof DiagMicro !== 'undefined';

    const microContainer  = document.getElementById('diag-micro-container');
    const commonContainer = document.getElementById('diag-common-container');
    const socialContainer  = document.getElementById('diag-social-container');
    const ventureContainer = document.getElementById('diag-venture-container');
    const coopContainer    = document.getElementById('diag-coop-container');

    /* 조직 유형 판별 — 조직 형태별 전용 진단(S1~S8 또는 V1~V8) 40문항을 렌더링한다.
       ⚠ 모듈 선택은 _orgDiagModule() 한 곳에서만 한다 */
    _orgType = _detectOrgType(industryKey);
    const orgMod = _orgDiagModule(_orgType);
    const orgContainerId = _orgContainerId(orgMod);
    const isSocial = !!orgMod && !!orgContainerId;

    // 공통 모듈 렌더링 — social: 조직형태 전용 / micro: DiagMicro 7대 분야 / startup: STARTUP / 그 외: DiagCommon
    _activeContainers = [];
    if (isSocial) {
      _activeContainers.push(orgContainerId);
      renderDiagModule(orgContainerId, _diagOrgToAreas(orgMod));
      const activeEl = document.getElementById(orgContainerId);
      if (activeEl) activeEl.classList.remove('hidden');
      [socialContainer, ventureContainer, coopContainer].forEach(el => {
        if (el && el.id !== orgContainerId) el.classList.add('hidden');
      });
      if (microContainer)  microContainer.classList.add('hidden');
      if (commonContainer) commonContainer.classList.add('hidden');
    } else if (isMicro) {
      _activeContainers.push('diag-micro-container');
      const microGroup = DiagMicro.getGroup(industryKey);
      renderDiagModule('diag-micro-container', _diagMicroToAreas(DiagMicro, microGroup));
      if (microContainer)   microContainer.classList.remove('hidden');
      if (commonContainer)  commonContainer.classList.add('hidden');
      if (socialContainer)  socialContainer.classList.add('hidden');
      if (ventureContainer) ventureContainer.classList.add('hidden');
      if (coopContainer)    coopContainer.classList.add('hidden');
    } else {
      _activeContainers.push('diag-common-container');
      if (microContainer)   microContainer.classList.add('hidden');
      if (socialContainer)  socialContainer.classList.add('hidden');
      if (ventureContainer) ventureContainer.classList.add('hidden');
      if (coopContainer)    coopContainer.classList.add('hidden');
      if (commonContainer)  commonContainer.classList.remove('hidden');
      let commonDiag;
      if (isStartupMode && typeof STARTUP_DIAGNOSIS !== 'undefined') {
        commonDiag = STARTUP_DIAGNOSIS;
      } else if (typeof DiagCommon !== 'undefined') {
        commonDiag = _diagCommonToAreas(DiagCommon);
      } else if (typeof COMMON_DIAGNOSIS !== 'undefined') {
        commonDiag = COMMON_DIAGNOSIS;
      } else {
        commonDiag = null;
      }
      if (commonDiag && !isStartupMode) {
        commonDiag = _applyIndustryWording(commonDiag, industryKey);
        commonDiag = _injectDxDetect(commonDiag);
      }
      renderDiagModule('diag-common-container', commonDiag);
    }

    // 업종 특화 모듈 렌더링
    const industryVarMap = {
      'mfg_parts':     typeof INDUSTRY_MFG_PARTS    !== 'undefined' ? INDUSTRY_MFG_PARTS    : null,
      'food_mfg':      typeof INDUSTRY_FOOD_MFG     !== 'undefined' ? INDUSTRY_FOOD_MFG     : null,
      'local_service': typeof INDUSTRY_LOCAL_SERVICE !== 'undefined' ? INDUSTRY_LOCAL_SERVICE : null,
      'wholesale':     typeof INDUSTRY_WHOLESALE    !== 'undefined' ? INDUSTRY_WHOLESALE    : null,
      'restaurant':    typeof INDUSTRY_RESTAURANT   !== 'undefined' ? INDUSTRY_RESTAURANT   : null,
      'knowledge_it':  typeof INDUSTRY_KNOWLEDGE_IT !== 'undefined' ? INDUSTRY_KNOWLEDGE_IT : null,
      'construction':  typeof INDUSTRY_CONSTRUCTION !== 'undefined' ? INDUSTRY_CONSTRUCTION : null,
      'medical':       typeof INDUSTRY_MEDICAL      !== 'undefined' ? INDUSTRY_MEDICAL      : null,
      'finance':       typeof INDUSTRY_FINANCE      !== 'undefined' ? INDUSTRY_FINANCE      : null,
      'education':     typeof INDUSTRY_EDUCATION    !== 'undefined' ? INDUSTRY_EDUCATION    : null,
      'fashion':       typeof INDUSTRY_FASHION      !== 'undefined' ? INDUSTRY_FASHION      : null,
      'media':         typeof INDUSTRY_MEDIA        !== 'undefined' ? INDUSTRY_MEDIA        : null,
      'export_sme':    typeof INDUSTRY_EXPORT_SME   !== 'undefined' ? INDUSTRY_EXPORT_SME   : null,
      'logistics':     typeof INDUSTRY_LOGISTICS    !== 'undefined' ? INDUSTRY_LOGISTICS    : null,
      'energy':        typeof INDUSTRY_ENERGY       !== 'undefined' ? INDUSTRY_ENERGY       : null,
      'agri_food':     typeof INDUSTRY_AGRI_FOOD    !== 'undefined' ? INDUSTRY_AGRI_FOOD    : null,
      'social_enterprise': typeof INDUSTRY_SOCIAL_ENTERPRISE !== 'undefined' ? INDUSTRY_SOCIAL_ENTERPRISE : null,
      // ⚠ 'social_venture'는 전용 진단 모듈(DiagVenture)로 대체되어 업종 매핑에서 제외한다.
      //    js/diagnosis/industry/social_venture.js 파일은 삭제하지 않고 남겨 둔다
    };
    // 업종 탭은 조직 형태와 무관하게 유지한다 — 사회적기업도 업종(컨설팅업 등)은 별개로 존재하며
    // S1~S8(조직 축)과 업종 특화 5문항(사업 축)은 내용이 겹치지 않는다
    const industryData = industryVarMap[industryKey];
    if (industryData) {
      renderDiagModule('diag-industry-container', industryData);
      _activeContainers.push('diag-industry-container');
    }
    // ⚠ industryData가 없으면(미지원 업종) 이전 렌더 결과가 남으므로 비운다
    //    — _clearInactiveContainers()가 활성 목록에 없는 이 컨테이너를 정리한다
    const tabIndustryBtn = document.getElementById('diagTabBtn-industry');
    if (tabIndustryBtn) tabIndustryBtn.style.display = industryData ? '' : 'none';

    // 이번 경로에서 쓰지 않는 컨테이너 정리 — 라벨·진행률 계산 전에 반드시 수행
    _clearInactiveContainers();

    const commonCount   = _countDiagItems(['diag-common-container', 'diag-micro-container',
                                           'diag-social-container', 'diag-venture-container',
                                           'diag-coop-container']);
    const industryCount = _countDiagItems(['diag-industry-container']);

    // 탭 버튼 레이블 동적 업데이트 (업종 반영)
    const aiLabel = document.getElementById('aiIndustryKey') ? (() => {
      // AI가 반환한 industry_label로 탭 레이블 설정
      const bizCtxBadge = document.querySelector('.biz-ctx-type-badge');
      return bizCtxBadge ? bizCtxBadge.textContent : null;
    })() : null;
    const indLabel  = aiLabel || document.getElementById('bizItem')?.value || industry || '업종';
    const tabIndustry = document.getElementById('diagTabBtn-industry');
    // 문항 수는 실제 렌더링 결과에서 파생한다 (과거 '(5문항)' 하드코딩은 실제 16문항과 불일치했다)
    if (tabIndustry) tabIndustry.textContent = '🏭 ' + indLabel + ' 특화 진단' + _cntSuffix(industryCount);

    // 탭 레이블 — micro / 창업 초기 / 기본 경영 분기
    const tabCommon = document.getElementById('diagTabBtn-common');
    if (tabCommon) {
      // 문항 수는 하드코딩하지 않고 실제 렌더링 결과에서 파생한다.
      // 기준은 진행률 분모와 동일(signal-only 제외) — 라벨 21 / 분모 20 같은 불일치를 막는다
      tabCommon.textContent = (isSocial
        ? ORG_ICON[_orgType] + ' ' + ORG_TYPE_LABEL[_orgType] + ' 8대 영역'
        : isMicro
        ? '🏪 소상공인 7대 분야'
        : isStartupMode
          ? '🚀 창업 초기 진단'
          : '📋 기본 경영 진단') + _cntSuffix(commonCount);
    }

    // 진단 유형 배너 — 조직 형태 전용 진단이 적용됐음을 사용자에게 명시한다
    // (일반 기업은 기존 화면 그대로 두고 배너를 표시하지 않는다)
    const typeBanner = document.getElementById('diag-type-banner');
    if (typeBanner) {
      if (isSocial) {
        const lbl = ORG_TYPE_LABEL[_orgType];
        /* 사회적경제 3유형 모두 전용 모듈을 갖췄으므로 '빌려 쓴다'는 안내가 필요 없다.
           전용 모듈이 없는 유형이 새로 추가되면 여기에 다시 조건을 넣는다 */
        const borrowed = '';
        const icon = ORG_ICON[_orgType] || '🤝';
        const areaTxt = commonCount > 0 ? ' (8대 영역 ' + commonCount + '문항)' : ' (8대 영역)';
        const indTxt  = industryCount > 0 ? ' + 업종 특화 ' + industryCount + '문항' : '';
        typeBanner.innerHTML = `${icon} <strong>${lbl} 전용 진단</strong>${areaTxt}${indTxt}${borrowed}`;
        typeBanner.classList.remove('hidden');
      } else {
        typeBanner.innerHTML = '';
        typeBanner.classList.add('hidden');
      }
    }

    // 첫 탭으로 리셋
    curDiagTab = 'common';
    updateDiagTabUI('common');

    // 저장된 점수 복원
    restoreScores();

    // 진행률 갱신 — 복원된 점수를 반영해야 하므로 restoreScores() 뒤에 호출한다
    updateDiagProgress();
  }

  /* ── 타입별 항목 렌더러 ── */
  function _renderItemHtml(item, scoreKey) {
    const saved        = diagScores[scoreKey] || {};
    const savedScore   = saved.score   || 0;
    const savedRaw     = (saved.rawValue !== undefined) ? saved.rawValue : '';
    const savedChoices = saved.choices || [];
    const savedMemo    = diagMemos[scoreKey] || '';

    const signalAttr = item._signalOnly ? ' data-signal-only="true"' : '';
    const signalCls  = item._signalOnly ? ' diag-signal-item' : '';
    let html = '<div class="diag-item' + signalCls + '" id="diag-item-' + scoreKey + '"' + signalAttr + '>';
    html += '<div class="diag-item-text">' + (item.question || item.label || item.text || '') + '</div>';

    switch (item.type) {
      case 'numeric': html += _renderNumeric(item, scoreKey, savedRaw, savedScore); break;
      case 'mixed':   html += _renderMixed(item, scoreKey, savedChoices, savedScore); break;
      default:        html += _renderBars(item, scoreKey, savedScore); break;
    }

    html += '<textarea class="diag-memo" placeholder="💬 구체적 상황 메모 (선택)" onchange="Wizard.setMemo(\'' + scoreKey + '\',this.value)">' + savedMemo + '</textarea>';
    html += '</div>';
    return html;
  }

  // 점수별 기본 설명 (anchors 없는 항목에 공통 적용)
  const GENERIC_ANCHORS = {
    1: '🔴 1점 — 매우 미흡. 즉각적인 개선이 필요한 취약 수준입니다.',
    2: '🟠 2점 — 미흡. 단기 내 보완 계획이 필요합니다.',
    3: '🟡 3점 — 보통. 업계 평균 수준이나 추가 개선 여지가 있습니다.',
    4: '🟢 4점 — 양호. 경쟁력 있는 수준으로 강점으로 활용 가능합니다.',
    5: '🟢 5점 — 우수. 업계 최상위 수준의 핵심 역량입니다.'
  };

  function _scaleToAnchors(scale) {
    if (!Array.isArray(scale) || scale.length === 0) return null;
    const anchors = {};
    scale.forEach(s => { anchors[s.score] = s.desc; });
    return anchors;
  }

  function _renderBars(item, scoreKey, savedScore) {
    // v2.0 scale 배열 → anchors 객체 변환, 없으면 기본 설명으로 대체
    const anchors = item.anchors || _scaleToAnchors(item.scale) || GENERIC_ANCHORS;
    let html = '<div class="diag-scale">';
    html += '<span class="diag-scale-label">' + (item.min || '') + '</span>';
    html += '<div class="diag-scale-buttons">';
    for (let s = 1; s <= 5; s++) {
      const sel = savedScore === s ? ' selected' : '';
      html += '<button class="diag-score-btn' + sel + '" data-key="' + scoreKey + '" data-score="' + s + '" onclick="Wizard.setScore(\'' + scoreKey + '\',' + s + ',this)">' + s + '</button>';
    }
    html += '</div>';
    html += '<span class="diag-scale-label">' + (item.max || '') + '</span>';
    html += '</div>';
    const initText = savedScore > 0 ? anchors[savedScore] : '💡 점수를 선택하면 의미가 표시됩니다';
    const anchorsEsc = JSON.stringify(anchors).replace(/\\/g, '\\\\').replace(/'/g, '&apos;');
    html += '<div class="bars-anchor-display" id="bars-anchor-' + scoreKey + '" data-anchors=\'' + anchorsEsc + '\'>' + initText + '</div>';
    return html;
  }

  function _renderNumeric(item, scoreKey, savedRaw, savedScore) {
    const SCORE_LABELS = ['', '🔴 위험', '🟠 취약', '🟡 보통', '🟢 강점', '🟢 최우수'];
    const cls      = savedScore >= 4 ? 'high' : savedScore >= 3 ? 'mid' : savedScore >= 2 ? 'low' : savedScore > 0 ? 'risk' : '';
    const scoreText = savedScore > 0
      ? '→ ' + savedScore + '점 (' + SCORE_LABELS[savedScore] + ')'
      : '값을 입력하면 점수가 자동 계산됩니다';
    const rangesEsc = JSON.stringify(item.scoreRanges || []).replace(/'/g, '&apos;');

    let html = '<div class="diag-numeric-wrap" id="num-wrap-' + scoreKey + '" data-ranges=\'' + rangesEsc + '\'>';
    html += '<label class="diag-numeric-label">' + (item.inputLabel || item.text) + '</label>';
    // 업종 평균 참고값 표시
    if (item.benchRef) {
      const br = item.benchRef;
      const brUnit = br.unit || item.unit || '%';
      html += '<div class="diag-bench-ref">📊 <strong>' + br.label + '</strong>: 평균 <span class="bench-avg">' + br.avg + brUnit + '</span> · 양호 기준 <span class="bench-good">' + br.good + brUnit + '+</span> <span class="bench-src">[' + br.src + ']</span></div>';
    }
    html += '<div class="diag-numeric-row">';
    html += '<input type="number" step="any" class="diag-numeric-input" id="num-' + scoreKey + '" value="' + savedRaw + '" placeholder="' + (item.placeholder || '') + '" oninput="Wizard.setNumeric(\'' + scoreKey + '\',this.value)" />';
    html += '<span class="diag-numeric-unit">' + (item.unit || '') + '</span>';
    html += '</div>';
    html += '<div class="diag-numeric-result ' + cls + '" id="numr-' + scoreKey + '">' + scoreText + '</div>';
    html += '<div class="diag-numeric-fallback">';
    html += '<span class="diag-fallback-label">수치가 없다면 주관적으로 선택</span>';
    html += '<span class="diag-scale-label" style="font-size:11px">' + (item.min || '') + '</span>';
    html += '<div class="diag-scale-buttons">';
    for (let s = 1; s <= 5; s++) {
      const sel = savedScore === s ? ' selected' : '';
      html += '<button class="diag-score-btn' + sel + '" data-key="' + scoreKey + '" data-score="' + s + '" onclick="Wizard.setScore(\'' + scoreKey + '\',' + s + ',this)">' + s + '</button>';
    }
    html += '</div>';
    html += '<span class="diag-scale-label" style="font-size:11px">' + (item.max || '') + '</span>';
    html += '</div>';
    html += '</div>';
    return html;
  }

  function _renderMixed(item, scoreKey, savedChoices, savedScore) {
    const noneValEsc = (item.noneValue || '').replace(/"/g, '&quot;');
    const effectiveCount = savedChoices.filter(c => c !== (item.noneValue || '')).length;
    const noneOnly = savedChoices.length === 1 && savedChoices[0] === item.noneValue;
    const scoreText = savedScore > 0
      ? (noneOnly ? '해당 없음 → 1점' : effectiveCount + '개 선택 → ' + savedScore + '점')
      : '해당하는 항목을 모두 선택하세요';

    let html = '<div class="diag-mixed-wrap">';
    html += '<div class="diag-mixed-choices" id="mix-' + scoreKey + '" data-none="' + noneValEsc + '">';
    (item.choices || []).forEach(choice => {
      const checked = savedChoices.includes(choice) ? ' checked' : '';
      const isNone  = choice === item.noneValue;
      const choiceEsc = choice.replace(/"/g, '&quot;');
      html += '<label class="diag-mixed-choice' + (isNone ? ' choice-none' : '') + '">';
      html += '<input type="checkbox" value="' + choiceEsc + '"' + checked + ' onchange="Wizard.setMixed(\'' + scoreKey + '\',this)"> ';
      html += choice + '</label>';
    });
    html += '</div>';
    html += '<div class="diag-mixed-result" id="mixr-' + scoreKey + '">' + scoreText + '</div>';
    html += '<div style="display:none"><div class="diag-scale-buttons">';
    for (let s = 1; s <= 5; s++) {
      const sel = savedScore === s ? ' selected' : '';
      html += '<button class="diag-score-btn' + sel + '" data-key="' + scoreKey + '" data-score="' + s + '">' + s + '</button>';
    }
    html += '</div></div>';
    html += '</div>';
    return html;
  }

  function _diagCommonToAreas(diagCommon) {
    const schema = diagCommon.getSchema();
    const areas = schema.domains.map(domain => {
      const items = Object.entries(schema.items)
        .filter(([key]) => key.startsWith(`${domain.id}_`))
        .map(([key, item]) => Object.assign({}, item, { id: key }));
      return { id: `common_${domain.id}`, label: domain.label, icon: domain.icon, description: domain.desc, items };
    });
    return { id: schema.id, label: schema.label, areas };
  }

  function _diagMicroToAreas(diagMicro, industryGroup) {
    const schema = diagMicro.getSchema(industryGroup);
    const areas = schema.domains.map(domain => {
      const items = Object.entries(schema.items)
        .filter(([key]) => key.startsWith(`${domain.id}_`))
        .map(([key, item]) => Object.assign({}, item, { id: key }));
      return { id: `micro_${domain.id}`, label: domain.label, icon: domain.icon, description: domain.desc, items };
    });
    return { id: schema.id, label: schema.label, areas };
  }

  /* 조직 형태 전용 진단 스키마 → renderDiagModule 호환 포맷.
     ⚠ 모듈 무관하게 동작한다 (DiagSocial: s1_1 / DiagVenture: v1_1).
        컨테이너 id는 renderDiagModule 호출부에서 KEY_PREFIX로부터 파생된다 */
  function _diagOrgToAreas(diagSocial) {
    const schema = diagSocial.getSchema();
    const areas = schema.domains.map(domain => {
      const items = Object.entries(schema.items)
        .filter(([key]) => key.indexOf(domain.id + '_') === 0)
        .map(([key, item]) => Object.assign({}, item, { id: key }));
      return { id: `social_${domain.id}`, label: domain.label, icon: domain.icon, description: domain.desc, items };
    });
    return { id: schema.id, label: schema.label, areas };
  }

  function renderDiagModule(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container || !data) return;
    let html = '<div class="diag-module">';
    html += '<h3 class="diag-module-title">' + (data.label || data.title || '') + '</h3>';
    data.areas.forEach(area => {
      html += '<div class="diag-area">';
      html += '<div class="diag-area-header">';
      html += '<h4 class="diag-area-title">' + (area.icon ? area.icon + ' ' : '') + (area.label || area.title || '') + '</h4>';
      if (area.description) html += '<p class="diag-area-desc">' + area.description + '</p>';
      html += '</div>';
      area.items.forEach(item => {
        const scoreKey = containerId + '_' + item.id;
        html += _renderItemHtml(item, scoreKey);
      });
      html += '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  // 저장된 점수 UI 복원 (bars / numeric / mixed 모두 처리)
  function restoreScores() {
    const LABELS = ['', '🔴 위험', '🟠 취약', '🟡 보통', '🟢 강점', '🟢 최우수'];
    Object.keys(diagScores).forEach(key => {
      const saved = diagScores[key];
      if (!saved || !saved.score) return;

      // 공통: 숨겨진 버튼 selected 상태 복원
      document.querySelectorAll('[data-key="' + key + '"]').forEach(btn => {
        btn.classList.toggle('selected', parseInt(btn.dataset.score) === saved.score);
      });

      // numeric 복원
      if (saved.rawValue !== undefined && saved.rawValue !== '') {
        const numEl = document.getElementById('num-' + key);
        if (numEl) numEl.value = saved.rawValue;
        const cls = saved.score >= 4 ? 'high' : saved.score >= 3 ? 'mid' : saved.score >= 2 ? 'low' : 'risk';
        const resultEl = document.getElementById('numr-' + key);
        if (resultEl) {
          resultEl.className = 'diag-numeric-result ' + cls;
          resultEl.textContent = '→ ' + saved.score + '점 (' + LABELS[saved.score] + ')';
        }
      }

      // mixed 복원
      if (saved.choices && saved.choices.length) {
        const container = document.getElementById('mix-' + key);
        if (container) {
          const noneVal = container.dataset.none || '';
          const cbs = container.querySelectorAll('input[type="checkbox"]');
          cbs.forEach(cb => { cb.checked = saved.choices.includes(cb.value); });
          const noneOnly = saved.choices.length === 1 && saved.choices[0] === noneVal;
          const count    = saved.choices.filter(v => v !== noneVal).length;
          const resultEl = document.getElementById('mixr-' + key);
          if (resultEl) {
            resultEl.textContent = noneOnly
              ? '해당 없음 → 1점'
              : count + '개 선택 → ' + saved.score + '점';
          }
        }
      }

      // BARS 앵커 복원
      const anchorEl = document.getElementById('bars-anchor-' + key);
      if (anchorEl && anchorEl.dataset.anchors) {
        try { anchorEl.textContent = JSON.parse(anchorEl.dataset.anchors)[saved.score] || ''; } catch(e) {}
      }
    });
  }

  function setScore(key, score, btn) {
    diagScores[key] = { score: score, memo: diagScores[key]?.memo || '' };
    const buttons = btn.parentElement.querySelectorAll('.diag-score-btn');
    buttons.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');

    // BARS 앵커 텍스트 업데이트
    const anchorEl = document.getElementById('bars-anchor-' + key);
    if (anchorEl && anchorEl.dataset.anchors) {
      try { anchorEl.textContent = JSON.parse(anchorEl.dataset.anchors)[score] || ''; } catch(e) {}
    }

    // numeric 폴백 수동 선택 시 result 표시 업데이트
    const numResult = document.getElementById('numr-' + key);
    if (numResult) {
      const LABELS = ['', '🔴 위험', '🟠 취약', '🟡 보통', '🟢 강점', '🟢 최우수'];
      const cls = score >= 4 ? 'high' : score >= 3 ? 'mid' : score >= 2 ? 'low' : 'risk';
      numResult.className = 'diag-numeric-result ' + cls;
      numResult.textContent = '→ ' + score + '점 (' + LABELS[score] + ') · 주관 선택';
      // 숫자 입력란 초기화
      const numInput = document.getElementById('num-' + key);
      if (numInput) { numInput.value = ''; diagScores[key].rawValue = ''; }
    }

    updateDiagProgress();
  }

  /* ── numeric 핸들러 ── */
  function setNumeric(key, rawValue) {
    const wrap = document.getElementById('num-wrap-' + key);
    let score = 0;
    const val = parseFloat(rawValue);
    if (!isNaN(val) && wrap && wrap.dataset.ranges) {
      try {
        const ranges = JSON.parse(wrap.dataset.ranges);
        for (const [lo, hi, s] of ranges) {
          if (val >= lo && val < hi) { score = s; break; }
        }
        // 마지막 범위 상한값 처리
        if (score === 0 && ranges.length) {
          const last = ranges[ranges.length - 1];
          if (val >= last[0]) score = last[2];
        }
      } catch(e) {}
    }

    diagScores[key] = { score, rawValue, memo: diagScores[key]?.memo || '' };

    const LABELS = ['', '🔴 위험', '🟠 취약', '🟡 보통', '🟢 강점', '🟢 최우수'];
    const cls = score >= 4 ? 'high' : score >= 3 ? 'mid' : score >= 2 ? 'low' : score > 0 ? 'risk' : '';
    const el = document.getElementById('numr-' + key);
    if (el) {
      el.className = 'diag-numeric-result ' + cls;
      el.textContent = score > 0
        ? '→ ' + score + '점 (' + LABELS[score] + ')'
        : rawValue !== '' ? '유효 범위 밖 값입니다' : '값을 입력하면 점수가 자동 계산됩니다';
    }
    document.querySelectorAll('[data-key="' + key + '"]').forEach(btn => {
      btn.classList.toggle('selected', parseInt(btn.dataset.score) === score);
    });
    updateDiagProgress();
  }

  /* ── mixed(체크박스) 핸들러 ── */
  function setMixed(key) {
    const container = document.getElementById('mix-' + key);
    if (!container) return;
    const noneVal = container.dataset.none || '';
    const cbs = container.querySelectorAll('input[type="checkbox"]');

    const selected = Array.from(cbs).filter(cb => cb.checked).map(cb => cb.value);
    const noneOnly = selected.length === 1 && selected[0] === noneVal;
    const count = selected.filter(v => v !== noneVal).length;

    let score = 0;
    if (selected.length > 0) {
      score = noneOnly ? 1 : count === 1 ? 2 : count === 2 ? 3 : count <= 4 ? 4 : 5;
    }

    diagScores[key] = { score, choices: selected, memo: diagScores[key]?.memo || '' };

    const resultEl = document.getElementById('mixr-' + key);
    if (resultEl) {
      resultEl.textContent = selected.length === 0
        ? '해당하는 항목을 모두 선택하세요'
        : noneOnly ? '해당 없음 → 1점'
        : count + '개 선택 → ' + score + '점';
    }
    document.querySelectorAll('[data-key="' + key + '"]').forEach(btn => {
      btn.classList.toggle('selected', parseInt(btn.dataset.score) === score);
    });
    updateDiagProgress();
  }

  function setMemo(key, memo) {
    diagMemos[key] = memo;
    if (!diagScores[key]) diagScores[key] = { score: 0, memo: memo };
    else diagScores[key].memo = memo;
  }

  function updateDiagProgress() {
    // ⚠ 분모·분자 모두 활성 컨테이너 기준. 범위가 어긋나면 100%가 되지 않는다
    const total = _countDiagItems();
    const done  = _countDoneScores();
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const el = document.getElementById('diag-progress-text');
    const fill = document.getElementById('diag-progress-fill');
    if (el) el.textContent = done + ' / ' + total + ' 항목 완료';
    if (fill) fill.style.width = pct + '%';
  }

  function validateCurrentTab() {
    const tabContainerId = 'diagTab-' + curDiagTab;
    const tabContent = document.getElementById(tabContainerId);
    if (!tabContent) return true;

    const allItems = tabContent.querySelectorAll('.diag-item');
    let firstUnchecked = null;
    let uncheckedCount = 0;

    allItems.forEach(item => {
      if (item.dataset.signalOnly === 'true') return; // DX 탐지 항목은 필수 아님
      const key = item.id.replace('diag-item-', '');
      const hasScore = diagScores[key] && diagScores[key].score > 0;
      if (!hasScore) {
        uncheckedCount++;
        if (!firstUnchecked) firstUnchecked = item;
        item.classList.add('diag-item-warning');
      } else {
        item.classList.remove('diag-item-warning');
      }
    });

    if (uncheckedCount > 0) {
      alert('아직 체크하지 않은 항목이 ' + uncheckedCount + '개 있습니다. 확인 후 진행해주세요.');
      if (firstUnchecked) {
        firstUnchecked.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }
    return true;
  }

  function prevDiagTab() {
    const currentIndex = _tabOrder().indexOf(curDiagTab);
    if (currentIndex === 0) {
      // 첫 탭에서 이전 → biz-context 확인 화면으로 복귀 (Step1 폼이 아님)
      const step2El = document.getElementById('step2');
      if (step2El) step2El.classList.add('hidden');
      const bcEl = document.getElementById('biz-context');
      if (bcEl) bcEl.classList.remove('hidden');
      const mini = document.getElementById('biz-context-mini');
      if (mini) mini.classList.add('hidden');
      window.scrollTo(0, 0);
    } else {
      const prevTab = _tabOrder()[currentIndex - 1];
      switchDiagTab(prevTab);
      window.scrollTo(0, 60);
    }
  }

  function switchDiagTab(tab) {
    curDiagTab = tab;
    updateDiagTabUI(tab);
    // 탭 전환 후 저장된 점수 복원 + 첫 항목으로 스크롤
    setTimeout(() => {
      restoreScores();
      const tabContent = document.getElementById('diagTab-' + tab);
      if (tabContent) {
        const firstItem = tabContent.querySelector('.diag-item');
        if (firstItem) {
          firstItem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 100);
  }

  function updateDiagTabUI(tab) {
    // 탭 버튼 active 처리
    document.querySelectorAll('.diag-tab').forEach(t => t.classList.remove('active'));
    const activeBtn = document.getElementById('diagTabBtn-' + tab);
    if (activeBtn) activeBtn.classList.add('active');

    // 탭 컨텐츠 표시/숨김
    document.querySelectorAll('.diag-tab-content').forEach(c => {
      c.classList.add('hidden');
      c.classList.remove('active');
    });
    const content = document.getElementById('diagTab-' + tab);
    if (content) {
      content.classList.remove('hidden');
      content.classList.add('active');
    }

    // 다음 버튼 텍스트 변경
    const nextBtn = document.querySelector('#step2 .btn-gold');
    if (nextBtn) {
      const _order = _tabOrder();
      const currentIndex = _order.indexOf(tab);
      nextBtn.textContent = currentIndex < _order.length - 1 ? '다음 진단 →' : '다음 단계 →';
    }
  }

  /* ── 10대 컨설팅 유형 정의 ── */
  const CONSULTING_TYPES = {
    finance_strategy: {
      label: '경영재무전략', icon: '💰',
      desc: '수익구조 개선, 원가 절감, 재무 건전성 확보가 최우선 과제입니다.',
      preview: ['손익분기점(BEP) 분석 및 재무 재구조화', '고정비/변동비 최적화 전략', '현금흐름 관리 체계 수립', '정부 금융지원 사업 연계']
    },
    growth_strategy: {
      label: '사업화·성장전략', icon: '🚀',
      desc: '시장 검증과 매출 성장 궤도 진입이 핵심 과제입니다.',
      preview: ['린 MVP 검증 및 시장 적합성(PMF) 확보', '핵심 고객 세그먼트 집중 공략', '수익 모델 다각화 및 단가 최적화', '성장 지표(KPI) 설계 및 트래킹']
    },
    differentiation_strategy: {
      label: '차별화·경쟁우위전략', icon: '🏆',
      desc: '경쟁사와의 명확한 차별화 포지션 확보가 시급합니다.',
      preview: ['핵심 차별화 요소 발굴 및 강화', '경쟁사 약점 분석 기반 포지셔닝', '모방 불가 핵심 역량 보호 체계', 'USP(고유 판매 제안) 메시지 정립']
    },
    structure_strategy: {
      label: '기업구조·시스템전략', icon: '🏗️',
      desc: '조직 체계와 운영 시스템 구축이 성장의 병목입니다.',
      preview: ['업무 SOP·매뉴얼화 체계 구축', '조직 역할 분산 및 위임 체계 수립', '성과 측정 및 인센티브 시스템 설계', '핵심 프로세스 표준화']
    },
    innovation_strategy: {
      label: '혁신·신사업전략', icon: '💡',
      desc: '신기술·신사업 기회 탐색과 혁신 역량 강화가 필요합니다.',
      preview: ['업종 트렌드·기술 변화 분석', '신사업 기회 영역 발굴', '기존 사업 혁신 로드맵 수립', '오픈 이노베이션·파트너십 전략']
    },
    marketing_strategy: {
      label: '마케팅·브랜드전략', icon: '📣',
      desc: '브랜드 인지도와 고객 유입 채널 확대가 핵심 과제입니다.',
      preview: ['타겟 고객 페르소나 정의 및 세분화', 'StoryBrand 기반 메시지 체계 구축', '디지털 마케팅 채널 최적화', '콘텐츠·브랜드 자산 구축']
    },
    hr_strategy: {
      label: '조직·인력운영전략', icon: '👥',
      desc: '인재 확보와 조직 역량 강화가 성장의 핵심입니다.',
      preview: ['핵심 인재 채용·유지 체계 구축', '직무별 역량 기준 및 평가 체계', '조직문화·소통 활성화 방안', '교육·훈련 체계 수립']
    },
    digital_strategy: {
      label: '디지털전환전략', icon: '🤖',
      desc: 'AI·디지털 도구 도입으로 운영 효율화와 경쟁력 확보가 필요합니다.',
      preview: ['업무 자동화·AI 도구 도입 로드맵', '데이터 기반 의사결정 체계 구축', '디지털 고객 접점 강화', 'IT 인프라 현대화 우선순위 수립']
    },
    pivot_strategy: {
      label: '사업재편·피벗전략', icon: '🔄',
      desc: '전반적 역량 개선이 필요하며, 사업 방향 재정립이 시급합니다.',
      preview: ['현재 사업 모델의 핵심 문제 진단', '사업 피벗 옵션 및 가능성 평가', '단계적 사업 재편 로드맵 수립', '리스크 최소화 전환 전략']
    },
    cx_strategy: {
      label: '고객경험·서비스전략', icon: '⭐',
      desc: '고객 만족도와 재구매율 향상으로 매출 기반 안정화가 필요합니다.',
      preview: ['고객 여정 지도(Customer Journey Map) 분석', '핵심 고객 경험 개선 포인트 발굴', '재구매·재계약률 향상 프로그램', 'NPS 기반 고객 피드백 체계 구축']
    }
  };

  /* ── 5대 역량 도메인 점수 계산 ── */
  function calcDomainScores(scores, isStartup) {
    const domains = isStartup ? {
      finance:         { label: '자금·사업계획',  scores: [], color: '#4ADE80' },
      hr:              { label: '운영 준비도',    scores: [], color: '#60A5FA' },
      bm:              { label: '고객 확보력',    scores: [], color: '#A78BFA' },
      future:          { label: '업종 대응력',    scores: [], color: '#FB923C' },
      differentiation: { label: '사업 검증도',   scores: [], color: '#F5C030' }
    } : {
      finance:         { label: '경영재무역량',     scores: [], color: '#4ADE80' },
      hr:              { label: '인적자원역량',     scores: [], color: '#60A5FA' },
      bm:              { label: 'BM역량',          scores: [], color: '#A78BFA' },
      future:          { label: '미래기술대응역량', scores: [], color: '#FB923C' },
      differentiation: { label: '차별화·경쟁우위역량', scores: [], color: '#F5C030' }
    };
    Object.entries(scores || {}).forEach(([key, val]) => {
      if (!val || !val.score) return;
      const s = val.score;
      if (isStartup) {
        if (key.includes('_s1_') || key.includes('_s2_')) {
          domains.finance.scores.push(s);
        } else if (key.includes('_s4_')) {
          domains.hr.scores.push(s);
        } else if (key.includes('_s3_')) {
          domains.bm.scores.push(s);
        } else if (key.startsWith('diag-industry-container_')) {
          domains.future.scores.push(s);
        }
      } else {
        if (key.startsWith('diag-common-container_1_') || key.startsWith('diag-common-container_4_')) {
          domains.finance.scores.push(s);
        } else if (key.startsWith('diag-common-container_2_') || key === 'diag-common-container_3_1') {
          domains.hr.scores.push(s);
        } else if (key === 'diag-common-container_3_2' || key.startsWith('diag-common-container_5_')) {
          domains.differentiation.scores.push(s);
          domains.bm.scores.push(s); // 3_2 차별화 점수를 BM역량 proxy로 공유 (bizmodel 탭 제거 보완)
        } else if (key.startsWith('diag-common-container_3_')) {
          domains.bm.scores.push(s);
        } else if (key.startsWith('diag-industry-container_')) {
          domains.future.scores.push(s);
        } else if (key.startsWith('diag-bizmodel-container_')) {
          domains.bm.scores.push(s);
        }
      }
    });
    const result = {};
    Object.entries(domains).forEach(([k, d]) => {
      const avg = d.scores.length > 0
        ? d.scores.reduce((a, b) => a + b, 0) / d.scores.length : 0;
      result[k] = { label: d.label, avg: Math.round(avg * 10) / 10, color: d.color };
    });
    return result;
  }

  /* ── 컨설팅 유형 분류 (규칙 기반) ── */
  function classifyConsultingType(domainScores) {
    const vals = Object.values(domainScores).map(d => d.avg).filter(v => v > 0);
    const overallAvg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 3;

    if (overallAvg < 2.0) return { primary: 'pivot_strategy', secondary: 'finance_strategy' };

    const sorted = Object.entries(domainScores)
      .filter(([, d]) => d.avg > 0)
      .sort(([, a], [, b]) => a.avg - b.avg);

    if (!sorted.length) return { primary: 'growth_strategy', secondary: 'differentiation_strategy' };

    const [weakKey] = sorted[0];
    const secondKey = sorted[1]?.[0] || 'differentiation';
    const secondAvg = sorted[1]?.[1]?.avg || 3;

    if (weakKey === 'finance' && secondKey === 'hr' && secondAvg < 2.5) {
      return { primary: 'structure_strategy', secondary: 'finance_strategy' };
    }

    const domainToType = {
      finance:         'finance_strategy',
      hr:              secondAvg < 2.5 ? 'structure_strategy' : 'hr_strategy',
      bm:              overallAvg < 3.0 ? 'growth_strategy' : 'marketing_strategy',
      future:          secondAvg < 2.8 ? 'digital_strategy' : 'innovation_strategy',
      differentiation: 'differentiation_strategy'
    };
    const secondaryMap = {
      finance:         'structure_strategy',
      hr:              'hr_strategy',
      bm:              'cx_strategy',
      future:          'innovation_strategy',
      differentiation: 'marketing_strategy'
    };

    return {
      primary:   domainToType[weakKey]   || 'growth_strategy',
      secondary: secondaryMap[secondKey] || 'differentiation_strategy'
    };
  }

  /* ── 5대 역량 도메인 해설 ── */
  const DOMAIN_EXPLAIN = {
    finance: {
      icon: '💰',
      what: '매출 성장성·수익률·원가 관리·현금흐름을 진단한 결과입니다.',
      high: '수익 구조가 안정적입니다. 이익을 성장 투자와 비상 자금 확보에 균형 있게 배분하세요.',
      low:  '매출 대비 이익률이 낮거나 자금 관리에 취약점이 있습니다. 손익분기점(BEP) 파악과 고정비 절감이 1순위입니다.'
    },
    hr: {
      icon: '👥',
      what: '조직 운영·직원 역량·채용·교육 훈련 수준을 측정한 결과입니다.',
      high: '인력 운영이 안정적입니다. 핵심 직원 이탈 방지 체계를 갖추고 역할 분리를 더욱 명확히 하세요.',
      low:  '대표자 혼자 모든 업무를 담당하거나 인력 역량 개발이 부족합니다. 업무 매뉴얼화와 권한 위임이 성장의 전제 조건입니다.'
    },
    bm: {
      icon: '📈',
      what: '고객 획득·재구매율·수익 모델의 다양성과 지속 가능성을 진단한 결과입니다.',
      high: '고객 확보와 수익 모델이 안정적으로 작동하고 있습니다. 채널 다각화로 매출 집중 리스크를 줄이세요.',
      low:  '신규 고객 유입이 제한적이거나 특정 고객·채널에 매출이 집중되어 있습니다. 고객 확보 채널 다각화가 시급합니다.'
    },
    future: {
      icon: '🔮',
      what: '디지털 도구 활용 수준·시장 트렌드 대응력·신사업 준비도를 측정한 결과입니다.',
      high: '변화에 민감하게 대응하고 있습니다. 현재 디지털 역량을 고객 경험 향상과 운영 효율화에 더욱 연결하세요.',
      low:  '업종 트렌드 변화에 대응이 늦거나 디지털 전환이 미흡합니다. 단계적 디지털화 계획 수립이 필요합니다.'
    },
    differentiation: {
      icon: '⚡',
      what: '경쟁사 대비 독자적 강점·모방하기 어려운 요소·고객이 반복 선택하는 이유를 진단한 결과입니다.',
      high: '명확한 차별화 요소를 보유하고 있습니다. 이를 핵심 마케팅 메시지로 일관되게 전달하면 더 효과적입니다.',
      low:  '경쟁사 대비 차별점이 불명확합니다. 고객이 우리를 반복 선택하는 진짜 이유를 발굴하고 강화하는 것이 성장 핵심입니다.'
    }
  };

  const STARTUP_DOMAIN_EXPLAIN = {
    finance: {
      icon: '💰', what: '창업 자금의 런웨이(생존 기간)와 사업계획 완성도를 진단한 결과입니다.',
      high: '자금 관리와 계획 수립이 안정적입니다. 계획대로 실행하면서 월별 성과를 꼼꼼히 추적하세요.',
      low:  '런웨이 확보와 BEP 계산이 시급합니다. 지출을 최소화하고 첫 매출을 최대한 빨리 만드세요.'
    },
    hr: {
      icon: '⚙️', what: '서비스 제공 준비 상태와 핵심 파트너·인력 확보 수준을 측정했습니다.',
      high: '운영 준비가 잘 갖춰졌습니다. 첫 고객이 와도 즉시 대응 가능한 상태입니다.',
      low:  '운영 준비가 아직 미흡합니다. 서비스 절차(SOP)와 핵심 파트너 확보를 먼저 해결하세요.'
    },
    bm: {
      icon: '📈', what: '현재 확정 고객·계약과 향후 90일 파이프라인을 진단한 결과입니다.',
      high: '고객 파이프라인이 구축되고 있습니다. 재구매·입소문 채널을 빠르게 강화하세요.',
      low:  '첫 고객 확보가 최우선 과제입니다. 지금 당장 10명에게 직접 연락하여 첫 계약을 만드세요.'
    },
    future: {
      icon: '🔮', what: '선택한 업종의 핵심 성공 요인에 대한 준비 수준을 측정했습니다.',
      high: '업종 특성에 맞는 준비가 잘 되어 있습니다. 동종 업계 선배·멘토와 연결하여 노하우를 심화하세요.',
      low:  '업종 특성에 대한 이해와 준비가 부족합니다. 현장 경험을 쌓거나 선배를 만나보세요.'
    },
    differentiation: {
      icon: '⚡', what: '아이디어가 실제 시장에서 검증되었는지, 차별화 요소가 명확한지를 진단했습니다.',
      high: '사업 아이디어가 잘 검증되고 있습니다. 고객 피드백을 계속 반영하며 강점을 강화하세요.',
      low:  '사업 아이디어 검증이 더 필요합니다. MVP로 빠르게 시장 반응을 확인하세요.'
    }
  };

  const MICRO_DOMAIN_EXPLAIN = {
    d1: {
      icon: '📊', what: '매출 현황·원가 구조·손익분기점(BEP)·현금흐름 관리 수준을 진단한 결과입니다.',
      high: '경영 수치 파악이 잘 되어 있습니다. ACM 관리와 프라임코스트 최적화를 계속 강화하세요.',
      low:  '손익 데이터 파악이 부족합니다. BEP 계산과 일별 매출·지출 기록부터 시작하세요.'
    },
    d2: {
      icon: '📍', what: '점포 환경·네이버 플레이스·로컬SEO 최적화 수준을 진단한 결과입니다.',
      high: '온·오프라인 상권 노출이 잘 되어 있습니다. 리뷰 관리와 사진 품질을 지속 유지하세요.',
      low:  '네이버 플레이스 최적화가 미흡합니다. 사진·영업시간·메뉴 업데이트가 즉시 필요합니다.'
    },
    d3: {
      icon: '🛒', what: '오프라인·배달앱·SNS 등 다채널 판로 운영 현황을 진단한 결과입니다.',
      high: '다채널 판로가 잘 구축되어 있습니다. 채널별 수익성 분석으로 집중 채널을 선택하세요.',
      low:  '단일 채널 의존도가 높습니다. 배달앱 1개라도 추가 등록하여 매출 위험을 분산하세요.'
    },
    d4: {
      icon: '💻', what: '키오스크·POS·업무 자동화 등 디지털 전환(DX) 도입 수준을 측정한 결과입니다.',
      high: '디지털 도구 활용이 앞서 있습니다. 데이터 기반 의사결정으로 경쟁 우위를 확대하세요.',
      low:  '수작업 위주의 운영이 비효율을 만들고 있습니다. 무료 POS·예약 앱부터 도입해보세요.'
    },
    d5: {
      icon: '💰', what: '운영자금 관리·정책금융 활용·ESG 보증 연계 수준을 진단한 결과입니다.',
      high: '자금 관리와 지원사업 활용이 양호합니다. ESG·녹색보증 등 추가 지원 채널을 탐색하세요.',
      low:  '자금 위기 가능성이 있습니다. 소진공 정책자금·지역신용보증재단 방문이 시급합니다.'
    },
    d6: {
      icon: '⚖️', what: '사업 지속성·폐업 세무 절차·권리금 회수 준비 수준을 진단한 결과입니다.',
      high: '사업 지속·전환 준비가 양호합니다. 임대차 계약 갱신권과 권리금 보호 규정을 미리 확인하세요.',
      low:  '사업 지속 리스크가 있습니다. 폐업 지원금·세금 감면 혜택 확인을 통해 선택지를 넓히세요.'
    },
    d7: {
      icon: '📱', what: 'SNS 운영·생성형AI 활용·콘텐츠 마케팅 수준을 진단한 결과입니다.',
      high: '디지털 마케팅을 잘 활용하고 있습니다. AI 도구로 콘텐츠 생산 속도를 더욱 높이세요.',
      low:  'SNS 활용이 미흡합니다. ChatGPT·클로바X로 주 2회 메뉴 사진+글 올리기를 시작해보세요.'
    }
  };

  /* ── micro 7대 영역 점수 계산 ── */
  function _calcMicroDomainScores(scores) {
    var MICRO_DOMAINS = [
      { key: 'd1', label: 'D1. 경영진단·손익분析', color: '#4ADE80' },
      { key: 'd2', label: 'D2. 점포환경·PLACE SEO', color: '#60A5FA' },
      { key: 'd3', label: 'D3. 다채널 판로',        color: '#C084FC' },
      { key: 'd4', label: 'D4. 스마트DX',           color: '#FB923C' },
      { key: 'd5', label: 'D5. 운영자금·ESG보증',   color: '#F5C030' },
      { key: 'd6', label: 'D6. 사업정리·폐업세무',  color: '#F87171' },
      { key: 'd7', label: 'D7. SNS·생성형AI',       color: '#34D399' },
    ];
    var buckets = {};
    MICRO_DOMAINS.forEach(function(d, i) {
      buckets[i + 1] = { key: d.key, label: d.label, color: d.color, scores: [] }; // 1-indexed: key _1_~_7_ 와 일치
    });
    Object.entries(scores || {}).forEach(function(entry) {
      var key = entry[0], val = entry[1];
      if (!val || !val.score) return;
      var m = key.match(/^diag-micro-container_(\d)_/);
      if (!m) return;
      var idx = parseInt(m[1], 10);
      if (buckets[idx]) buckets[idx].scores.push(val.score);
    });
    var result = {};
    MICRO_DOMAINS.forEach(function(_, i) {
      var b = buckets[i + 1]; // 1-indexed
      var avg = b.scores.length > 0
        ? b.scores.reduce(function(a, v) { return a + v; }, 0) / b.scores.length : 0;
      result[b.key] = { label: b.label, avg: Math.round(avg * 10) / 10, color: b.color };
    });
    return result;
  }

  /* ── 사회적기업 8대 영역 해설 (S1~S8) ──
     키는 _calcOrgDomainScores의 반환 키(s1~s8)와 반드시 일치해야 한다.
     explainMap[key] 조회로 해설 카드를 채우므로 키가 어긋나면 카드가 조용히 빈다 */
  const SOCIAL_DOMAIN_EXPLAIN = {
    s1: {
      icon: '🎯', what: '사회적 미션의 명문화·공유·측정·공개 체계를 진단한 결과입니다.',
      high: '미션 체계가 정립돼 있습니다. 성과 측정 결과를 외부에 정기 공개해 신뢰 자산으로 축적하세요.',
      low:  '미션이 문서에만 있고 판단 기준으로 작동하지 않습니다. 정관 문장을 사업계획서와 일치시키고 의사결정 근거로 인용하는 것부터 시작하세요.'
    },
    s2: {
      icon: '🤝', what: '주력 사업과 사회적 목적의 연결도, 미션 드리프트 위험을 진단한 결과입니다.',
      high: '사업과 미션이 잘 연결돼 있습니다. 신규 사업 검토 시에도 같은 기준을 적용해 일관성을 지키세요.',
      low:  '매출이 나오는 사업과 사회적 목적이 따로 놉니다(미션 드리프트). 주력 사업이 누구의 어떤 문제를 푸는지부터 다시 정의하세요.'
    },
    s3: {
      icon: '🏛️', what: '공공 수주 실적과 의존도, 민간 판로 확보 수준을 진단한 결과입니다.',
      high: '공공·민간 판로가 균형 있습니다. 공공 의존도를 지금 수준으로 관리하며 민간 거래를 늘리세요.',
      low:  '판로가 공공에 쏠려 있거나 수주 자체가 불안정합니다. e-store36.5 등록과 공공기관 우선구매 제도 확인, 민간 거래처 1곳 확보를 병행하세요.'
    },
    s4: {
      icon: '💰', what: '보조금 없는 자립 가능성과 사업별 공헌이익 산출력을 진단한 결과입니다.',
      high: '재정 구조 파악이 잘 되어 있습니다. 지원금 종료 시점을 가정한 시나리오를 미리 점검하세요.',
      low:  '지원금이 끊기면 버티기 어려운 구조입니다(지원금 절벽). 사업별 공헌이익과 BEP부터 산출해 어떤 사업이 실제로 남는지 확인하세요.'
    },
    s5: {
      icon: '🏢', what: '민주적 의사결정, 취약계층 고용 유지, 대표 의존도를 진단한 결과입니다.',
      high: '조직 운영이 안정적입니다. 의사결정 기록을 남겨 인증 심사·외부 검증에 그대로 활용하세요.',
      low:  '대표 1인에게 판단이 몰려 있거나 의사결정 기록이 없습니다. 회의록 작성과 업무 분장 문서화가 인증 유지에도 직접 필요합니다.'
    },
    s6: {
      icon: '📣', what: '사회적 가치 스토리텔링과 서비스 품질 표준화 수준을 진단한 결과입니다.',
      high: '가치 전달과 품질 관리가 양호합니다. 성과 데이터를 스토리에 결합해 구매 설득력을 높이세요.',
      low:  '좋은 일을 하고 있으나 고객에게 전달되지 않습니다. 수혜자 사례 1건을 수치와 함께 정리해 제안서·홈페이지에 싣는 것부터 시작하세요.'
    },
    s7: {
      icon: '📋', what: '인증 갱신 관리, SVI 측정 이력, 환경·지배구조 대응을 진단한 결과입니다.',
      high: '인증·제도 대응이 체계적입니다. SVI 측정 이력을 누적해 재인증과 조달 가점에 활용하세요.',
      low:  '인증 갱신 요건과 제출 서류를 놓칠 위험이 있습니다. 갱신 기한과 필수 요건을 달력에 등록하고 한국사회적기업진흥원 안내를 확인하세요.'
    },
    s8: {
      icon: '🤖', what: '업무 데이터 축적, 협업도구·AI 활용, 온라인 채널 확장력을 진단한 결과입니다.',
      high: '디지털 활용이 앞서 있습니다. 축적된 데이터를 성과 보고와 사업 판단에 연결하세요.',
      low:  '업무 기록이 개인 파일·수기에 흩어져 있습니다. 무료 협업도구 1개로 기록을 한곳에 모으는 것부터 시작하세요.'
    }
  };

  /* ── 소셜벤처 8대 영역 해설 (V1~V8) ──
     키는 _calcOrgDomainScores의 반환 키(v1~v8)와 반드시 일치해야 한다.
     ⚠ 판별 점수를 예측하는 문구를 쓰지 않는다. "신청 전에 갖출 것"을 짚는다 */
  const VENTURE_DOMAIN_EXPLAIN = {
    v1: {
      icon: '🎯', what: '해결하려는 사회문제가 정관에 명시되어 있는지, 구조적 문제로 정의되었는지를 진단한 결과입니다.',
      high: '문제 정의가 문서로 잘 잡혀 있습니다. 수혜 규모와 협력 기관 실적을 계속 축적하세요.',
      low:  '정관에 사회문제가 명시되지 않았을 가능성이 큽니다. 정관 변경은 총회 의결과 등기가 필요해 시간이 걸리므로 판별 신청 일정을 잡기 전에 먼저 착수하세요.'
    },
    v2: {
      icon: '📐', what: '사회적 성과를 숫자로 측정하고 외부에 검증받는 체계를 진단한 결과입니다.',
      high: '성과 측정이 자리 잡았습니다. 측정 결과를 IR 자료와 지원사업 신청서에 그대로 활용하세요.',
      low:  '성과를 숫자로 말할 수 없으면 사회성 항목 전반이 약해집니다. 수혜 인원 외에 지표 2개를 정해 집계부터 시작하세요.'
    },
    v3: {
      icon: '🔬', what: '핵심 기술의 차별성·지식재산권·사회문제 해결과의 연결을 진단한 결과입니다.',
      high: '기술 역량이 문서로 뒷받침됩니다. 기술과 사회문제 해결의 연결을 수치로 보이면 더 강해집니다.',
      low:  '기술 차별성이나 그 기술이 사회문제를 어떻게 푸는지가 정리되어 있지 않습니다. 판별은 두 축의 연결을 핵심으로 보므로 이 설명부터 만드세요.'
    },
    v4: {
      icon: '📈', what: '시장 규모 산출·성장 지표 추적·수익 모델 검증 수준을 진단한 결과입니다.',
      high: '성장 근거가 수치로 관리되고 있습니다. 확장 계획의 자원·일정까지 구체화하세요.',
      low:  '시장 규모도 성장 지표도 없으면 혁신성장성 평가와 투자 심사 양쪽에서 설명이 어렵습니다. 월별 매출·사용자 기록부터 시작하세요.'
    },
    v5: {
      icon: '💵', what: '투자 이력·IR 자료·기술보증 검토·12개월 자금 계획을 진단한 결과입니다.',
      high: '자금 조달 경로가 확보되어 있습니다. 다음 라운드를 가정한 지표 관리를 이어가세요.',
      low:  '자금 계획이 없으면 언제 바닥나는지 알 수 없어 대응할 시간을 확보하지 못합니다. 12개월 소요 계산과 기술보증기금 상담을 함께 진행하세요.'
    },
    v6: {
      icon: '👥', what: '대표자 전문성·핵심 인력 기술역량·연구개발 조직 보유 수준을 진단한 결과입니다.',
      high: '팀 역량이 갖춰져 있습니다. 연구개발전담부서 인정 등으로 객관적 증빙을 더하세요.',
      low:  '기술 인력이 얇거나 결정이 대표에게 몰려 있습니다. 한 사람이 빠지면 개발과 의사결정이 함께 멈추므로 역할 문서화부터 하세요.'
    },
    v7: {
      icon: '📋', what: '소셜벤처 판별 준비도와 지원 제도·중간지원조직 활용도를 진단한 결과입니다.',
      high: '제도 활용이 적극적입니다. 판별 결과와 수행 실적을 다음 신청의 근거로 쌓아가세요.',
      low:  '증빙자료가 흩어져 있으면 공고 기간이 짧을 때 신청 자체를 못 합니다. 정관·특허·투자·협약 자료를 한곳에 모아 두세요.'
    },
    v8: {
      icon: '🤖', what: '데이터 축적·서비스 활용·AI 도구 실무 적용·개발 프로세스를 진단한 결과입니다.',
      high: '데이터와 도구 활용이 앞서 있습니다. 축적된 데이터를 성과 증빙에도 연결하세요.',
      low:  '업무 기록이 개인 파일에 흩어져 있으면 지표를 뽑을 수 없습니다. 데이터 정리가 먼저이고 AI 도입은 그다음입니다.'
    }
  };

  /* ── 협동조합 8대 영역 해설 (C1~C8) ──
     키는 _calcOrgDomainScores의 반환 키(c1~c8)와 반드시 일치해야 한다.
     ⚠ 협동조합은 설립 신고로 성립하므로 인증 만료·갱신을 전제한 문구를 쓰지 않는다 */
  const COOP_DOMAIN_EXPLAIN = {
    c1: {
      icon: '👥', what: '조합원 자격·가입 절차·출자금 관리·이용고 기록 체계를 진단한 결과입니다.',
      high: '조합원 관리가 정비되어 있습니다. 이용고 기록을 배당 산정과 총회 자료에 그대로 활용하세요.',
      low:  '조합원 명부·출자금 대장·이용 실적이 정리되지 않으면 이용고 배당의 근거를 만들 수 없고 결산에서도 문제가 됩니다. 명부와 대장 대조부터 시작하세요.'
    },
    c2: {
      icon: '🗳️', what: '총회 개최, 1인 1표의 실질적 작동, 이사회·감사 기능, 조합원 교육을 진단한 결과입니다.',
      high: '민주적 운영이 자리 잡았습니다. 의사록과 교육 기록을 지원사업 신청 자료로 활용하세요.',
      low:  '총회가 형식적이거나 특정인이 결정을 좌우하면 협동조합의 실체성 자체가 문제가 됩니다. 정관에 정한 주기로 총회를 열고 의사록을 남기는 것부터 하세요.'
    },
    c3: {
      icon: '🌱', what: '주 사업과 조합원 실익의 연결, 조합원 외 거래 비중 관리 수준을 진단한 결과입니다.',
      high: '사업과 조합원 실익이 잘 연결되어 있습니다. 실익을 수치로 집계해 총회에 보고하세요.',
      low:  '조합원에게 돌아가는 실익이 불분명하면 참여와 출자 의지가 함께 떨어집니다. 사회적협동조합은 조합원 외 거래 비중에 법적 제한도 있으니 비중부터 집계하세요.'
    },
    c4: {
      icon: '💰', what: '출자금 외 자립성, 원가 구분, 공헌이익·BEP, 잉여금 처리의 적법성을 진단한 결과입니다.',
      high: '재정 구조 파악이 잘 되어 있습니다. 잉여금 처리 내역을 결산서·의사록과 일치시켜 두세요.',
      low:  '손익분기점을 모르면 지원이 끊기는 시점에 대응할 수 없습니다. 잉여금은 법정적립금이 우선이고 배당은 이용고 기준이라는 점도 함께 확인하세요.'
    },
    c5: {
      icon: '📑', what: '설립·변경 신고, 결산보고서 제출, 정관과 실제 운영의 일치를 진단한 결과입니다.',
      high: '법정 의무 이행이 안정적입니다. 점검을 정기 업무로 두어 담당자가 바뀌어도 이어지게 하세요.',
      low:  '신고·결산보고서 미이행은 지원사업 신청에서 결격 사유가 될 수 있습니다. 다른 과제보다 먼저 미제출·미신고 항목을 확인하세요.'
    },
    c6: {
      icon: '📣', what: '조합 브랜드, 공공조달·우선구매 활용, 홍보 채널, 협동조합 간 연대를 진단한 결과입니다.',
      high: '판로와 브랜드가 갖춰져 있습니다. 협동조합 간 공동사업으로 규모의 이점을 만들어 보세요.',
      low:  '협동조합에 열려 있는 조달·우선구매 채널을 쓰지 못하고 있습니다. 등록 요건부터 확인하세요.'
    },
    c7: {
      icon: '📋', what: '사회적협동조합 전환 검토, 지원사업·중간지원조직·세제 혜택 활용도를 진단한 결과입니다.',
      high: '제도 활용이 적극적입니다. 수행 실적을 다음 신청의 근거로 쌓아가세요.',
      low:  '활용할 수 있는 제도를 파악하지 못하고 있습니다. 중간지원조직·연합회 상담으로 해당 제도부터 확인하세요.'
    },
    c8: {
      icon: '🤖', what: '조합원·출자금 데이터 관리, 온라인 의사결정, AI 활용, 디지털 격차 해소를 진단한 결과입니다.',
      high: '디지털 기반이 갖춰져 있습니다. 온라인 의사결정 절차를 내규에 반영해 기록까지 남기세요.',
      low:  '조합원 데이터가 수기·개인 파일에 흩어져 있으면 집계와 대조에 시간이 걸립니다. 한곳에 모으는 것부터 시작하세요.'
    }
  };

  /* orgType → 영역 해설 맵. 분기를 여기 한 곳에 모은다 */
  const ORG_DOMAIN_EXPLAIN = {
    social_enterprise: SOCIAL_DOMAIN_EXPLAIN,
    cooperative:       COOP_DOMAIN_EXPLAIN,
    social_venture:    VENTURE_DOMAIN_EXPLAIN,
  };

  /* 레이더차트 8축 색상 — 영역 순서대로 적용 (모듈 무관) */
  var ORG_DOMAIN_COLORS = ['#4ADE80', '#60A5FA', '#C084FC', '#F5C030',
                           '#FB923C', '#34D399', '#F87171', '#A78BFA'];

  /* ── 조직 형태 전용 진단의 영역 점수 계산 (S1~S8 / V1~V8) ──
     ⚠ 점수 키 접두어와 영역 id를 모듈에서 파생시킨다. 정규식을 하드코딩하면
        모듈이 늘어날 때(DiagVenture는 diag-venture-container_v1_1) 매칭이 하나도 안 돼
        레이더차트가 조용히 비어버린다 — 사회적기업 때 겪은 것과 같은 문제.
     반환 형식은 _calcMicroDomainScores와 동일: {key:{label,avg,color}} */
  function _calcOrgDomainScores(scores, mod) {
    var result = {};
    if (!mod || !Array.isArray(mod.DOMAINS)) return result;
    var prefix = mod.KEY_PREFIX || '';
    var buckets = {};
    mod.DOMAINS.forEach(function(d, i) {
      buckets[d.id] = {
        key: d.id,
        label: d.id.toUpperCase() + '. ' + d.label,
        color: ORG_DOMAIN_COLORS[i % ORG_DOMAIN_COLORS.length],
        scores: [],
      };
    });
    Object.entries(scores || {}).forEach(function(entry) {
      var key = entry[0], val = entry[1];
      if (!val || !val.score) return;
      if (prefix && key.indexOf(prefix) !== 0) return;
      var itemId = key.slice(prefix.length);            // 's1_1' / 'v1_1'
      var domId  = itemId.split('_')[0];                // 's1'   / 'v1'
      if (buckets[domId]) buckets[domId].scores.push(val.score);
    });
    mod.DOMAINS.forEach(function(d) {
      var b = buckets[d.id];
      var avg = b.scores.length > 0
        ? b.scores.reduce(function(a, v) { return a + v; }, 0) / b.scores.length : 0;
      result[b.key] = { label: b.label, avg: Math.round(avg * 10) / 10, color: b.color };
    });
    return result;
  }

  /* ── 진단유형 확인 화면 렌더링 ── */
  function showDiagReveal(data, currentSnap) {
    const scores = data.diagScores || diagScores;
    const isStartup = !!(data.isStartup);
    /* ⚠ orgType 판정을 bizScale보다 먼저 둔다.
       사회적기업도 bizScale은 micro/sme 그대로이므로 순서가 반대면
       영원히 micro 분기로 빠져 diag-social-container_ 키를 하나도 읽지 못한다 */
    const orgMod    = _orgDiagModule(data.orgType);
    const isSocial  = !!orgMod;
    const isMicro   = !isSocial && (data.bizScale === 'micro');
    const domainScores = isSocial
      ? _calcOrgDomainScores(scores, orgMod)
      : isMicro
        ? _calcMicroDomainScores(scores)
        : calcDomainScores(scores, isStartup);
    const explainMap = isSocial
      ? (ORG_DOMAIN_EXPLAIN[data.orgType] || SOCIAL_DOMAIN_EXPLAIN)
      : isMicro ? MICRO_DOMAIN_EXPLAIN
      : (isStartup ? STARTUP_DOMAIN_EXPLAIN : DOMAIN_EXPLAIN);

    let primary, secondary, pType, sType;
    if (isSocial && data.orgType === 'cooperative') {
      primary = 'coop_diag'; secondary = '';
      pType = {
        icon: '🧑‍🤝‍🧑', label: '협동조합 8대 영역 진단',
        desc: '조합원 기반·민주적 운영·사업 지속성·재정·법규 준수·판로·제도 활용·디지털 8대 영역을 종합 진단했습니다. 법정 의무 이행이 미흡한 항목을 먼저 정리하십시오.',
        preview: [
          'C1 조합원 명부·출자금·이용고 기록 정비',
          'C2 총회 개최와 1인 1표의 실질적 작동',
          'C3 주 사업과 조합원 실익의 연결 점검',
          'C4 잉여금 처리 — 법정적립금·이용고 배당 원칙',
          'C5 설립·변경 신고와 결산보고서 제출',
          'C7 사회적협동조합 전환·지원제도 검토'
        ]
      };
      sType = { icon: '', label: '', desc: '' };
    } else if (isSocial && data.orgType === 'social_venture') {
      primary = 'venture_diag'; secondary = '';
      pType = {
        icon: '🚀', label: '소셜벤처 8대 영역 진단',
        desc: '사회문제 정의·임팩트·기술 혁신성·성장성·자금조달·팀·판별·디지털 8대 영역을 종합 진단했습니다. 취약 영역을 판별 신청 전에 보완하십시오.',
        preview: [
          'V1 정관에 해결할 사회문제 명시',
          'V2 사회적 성과를 숫자로 측정',
          'V3 기술과 사회문제 해결의 연결 정리',
          'V4 시장 규모 산출과 성장 지표 추적',
          'V5 12개월 자금 소요·조달 계획 수립',
          'V7 판별 증빙자료 사전 정리'
        ]
      };
      sType = { icon: '', label: '', desc: '' };
    } else if (isSocial) {
      primary = 'social_diag'; secondary = '';
      pType = {
        icon: '🤝', label: '사회적기업 8대 영역 진단',
        desc: '미션·사회가치·판로·재정·거버넌스·브랜딩·인증·디지털 8대 영역을 종합 진단했습니다. 취약 영역 처방을 우선 실행하세요.',
        preview: [
          'S1 미션 문장을 의사결정 기준으로 정착',
          'S3 공공 의존도 관리 + 민간 판로 확보',
          'S4 사업별 공헌이익·BEP 산출로 자립 기반 점검',
          'S5 의사결정 기록·업무 분장 문서화',
          'S6 수혜자 사례를 수치와 묶어 제안서에 반영',
          'S7 인증 갱신 요건·SVI 측정 이력 관리'
        ]
      };
      sType = { icon: '', label: '', desc: '' };
    } else if (isMicro) {
      primary = 'micro_diag'; secondary = '';
      pType = {
        icon: '🏪', label: '소상공인 7대 영역 진단',
        desc: '경영·점포·판로·DX·자금·사업정리·SNS 7대 영역을 종합 진단했습니다. 취약 영역 처방을 우선 실행하세요.',
        preview: [
          'D1 경영진단·손익 개선 — BEP·ACM 관리',
          'D2 네이버 플레이스·상권 SEO 최적화',
          'D3 배달앱·SNS 다채널 판로 확장',
          'D4 무료 DX 도구 단계적 도입',
          'D5 소진공 정책자금·보증 연계',
          'D7 생성형AI 콘텐츠 마케팅 시작'
        ]
      };
      sType = { icon: '', label: '', desc: '' };
    } else {
      const ct = classifyConsultingType(domainScores);
      primary = ct.primary; secondary = ct.secondary;
      pType = CONSULTING_TYPES[primary]   || CONSULTING_TYPES.growth_strategy;
      sType = CONSULTING_TYPES[secondary] || CONSULTING_TYPES.differentiation_strategy;
    }

    const elPrimary   = document.getElementById('drTypePrimary');
    const elSecondary = document.getElementById('drTypeSecondary');
    const elDesc      = document.getElementById('drTypeDesc');
    if (elPrimary)   elPrimary.textContent   = pType.icon + ' ' + pType.label;
    if (elSecondary) elSecondary.textContent = (isSocial || isMicro) ? '' : ('보조 유형: ' + sType.icon + ' ' + sType.label);
    if (elDesc)      elDesc.textContent      = pType.desc;

    const elScoreList = document.getElementById('drScoreList');
    if (elScoreList) {
      elScoreList.innerHTML = Object.values(domainScores).map(d => {
        const pct   = (d.avg / 5) * 100;
        const cls   = d.avg >= 4.0 ? 'high' : d.avg >= 3.0 ? 'mid' : d.avg >= 2.0 ? 'low' : d.avg > 0 ? 'risk' : 'none';
        const lbl   = d.avg >= 4.0 ? '강점' : d.avg >= 3.0 ? '보통' : d.avg >= 2.0 ? '취약' : d.avg > 0 ? '위험' : '미입력';
        return '<div class="dr-score-item">' +
          '<span class="dr-score-label">' + d.label + '</span>' +
          '<div class="dr-score-bar-wrap"><div class="dr-score-bar ' + cls + '" style="width:' + pct + '%"></div></div>' +
          '<span class="dr-score-val ' + cls + '">' + (d.avg > 0 ? d.avg.toFixed(1) : '—') + ' <small>' + lbl + '</small></span>' +
          '</div>';
      }).join('');
    }

    // 도메인별 해설 카드 채우기
    const elGuide = document.getElementById('drDomainGuide');
    if (elGuide) {
      elGuide.innerHTML = Object.entries(domainScores).map(function(pair) {
        var key = pair[0], d = pair[1];
        if (d.avg === 0) return '';
        var info = explainMap[key] || {};
        var isLow = d.avg < 3.0;
        var cls = d.avg >= 4 ? 'guide-high' : d.avg >= 3 ? 'guide-ok' : 'guide-low';
        var statusIcon = d.avg >= 4 ? '✅' : d.avg >= 3 ? '📊' : '⚠️';
        var msg = isLow ? (info.low || '') : (info.high || '');
        return '<div class="dr-guide-item ' + cls + '">' +
          '<div class="dr-guide-label">' + (info.icon || '') + ' ' + (d.label || key) + ' &nbsp;<small style="font-weight:400;opacity:.6">' + d.avg.toFixed(1) + '점</small></div>' +
          '<div class="dr-guide-what">' + (info.what || '') + '</div>' +
          '<div class="dr-guide-msg">' + statusIcon + ' ' + msg + '</div>' +
          '</div>';
      }).join('');
    }

    const elPreview = document.getElementById('drPreviewList');
    if (elPreview) {
      elPreview.innerHTML = pType.preview.map(p => '<li>' + p + '</li>').join('');
    }

    // 역량 프로파일 섹션 타이틀 동적 변경 (micro: 7대 영역 / SME: 5대 역량)
    const elProfileTitle = document.getElementById('drProfileTitle');
    const elProfileDesc  = document.getElementById('drProfileDesc');
    if (isSocial && data.orgType === 'cooperative') {
      if (elProfileTitle) elProfileTitle.textContent = '📊 협동조합 8대 영역 프로파일';
      if (elProfileDesc)  elProfileDesc.textContent  = '협동조합 8대 영역(C1~C8) 진단 결과입니다. 5점 최고·1점 최저이며, 취약 영역(2점 이하)의 처방이 AI 분석 보고서에서 우선 제시됩니다. 8개 영역은 균등 배점이며 협동조합기본법상 법정 의무 이행 여부를 함께 봅니다.';
    } else if (isSocial && data.orgType === 'social_venture') {
      if (elProfileTitle) elProfileTitle.textContent = '📊 소셜벤처 8대 영역 프로파일';
      if (elProfileDesc)  elProfileDesc.textContent  = '소셜벤처 8대 영역(V1~V8) 진단 결과입니다. 5점 최고·1점 최저이며, 취약 영역(2점 이하)의 처방이 AI 분석 보고서에서 우선 제시됩니다. 8개 영역은 균등 배점이며 기술보증기금 소셜벤처 판별표의 예상 점수가 아닙니다.';
    } else if (isSocial) {
      if (elProfileTitle) elProfileTitle.textContent = '📊 사회적기업 8대 영역 프로파일';
      if (elProfileDesc)  elProfileDesc.textContent  = '사회적기업 8대 영역(S1~S8) 진단 결과입니다. 5점 최고·1점 최저이며, 취약 영역(2점 이하)의 처방이 AI 분석 보고서에서 우선 제시됩니다. 8개 영역은 균등 배점이며 SVI(사회적가치지표) 예상 점수가 아닙니다.';
    } else if (isMicro) {
      if (elProfileTitle) elProfileTitle.textContent = '📊 7대 영역 진단 프로파일';
      if (elProfileDesc)  elProfileDesc.textContent  = '소상공인 7대 분야(D1~D7) 진단 결과입니다. 5점 최고·1점 최저이며, 취약 영역(2점 이하)의 처방이 AI 분석 보고서에서 우선 제시됩니다.';
    } else {
      if (elProfileTitle) elProfileTitle.textContent = '📊 5대 역량 프로파일';
      if (elProfileDesc)  elProfileDesc.textContent  = '진단 응답을 바탕으로 귀사의 핵심 역량을 5개 영역별로 수치화한 결과입니다. 5점이 최고, 1점이 최저이며 3점이 업종 평균 수준입니다. 점수가 낮은 영역부터 솔루션 보고서에서 우선 개선 전략이 제시됩니다.';
    }

    // micro D1 미입력 시 진행 버튼 비활성화
    const drProceedBtn = document.querySelector('.dr-proceed-btn');
    if (isMicro && drProceedBtn) {
      const d1Avg = (domainScores.d1 && domainScores.d1.avg) || 0;
      if (d1Avg === 0) {
        drProceedBtn.disabled = true;
        drProceedBtn.setAttribute('title', 'D1 경영진단·손익 항목을 먼저 입력해주세요');
        drProceedBtn.textContent = '⚠ D1 미입력 — 진단 수정 후 진행하세요';
      } else {
        drProceedBtn.disabled = false;
        drProceedBtn.removeAttribute('title');
        drProceedBtn.textContent = '솔루션 전체 보고서 보기 →';
      }
    }

    drawRadarChart('radarChart', domainScores);

    // 업종 생존율 렌더링 (KOSIS — app.js에서 선행 조회)
    // data.industryKey = aiIndustryKey hidden input 영문 키 (예: restaurant, food_mfg)
    // data.industry    = 레거시 한국어 드롭다운 값 (현재 HTML에 select#industry 없음 → 항상 '')
    // → industryKey가 없으면 박스가 호출되지 않는 버그 수정
    const industryKey = data.industryKey || data.industry || '';
    if (industryKey) _fetchSurvival(industryKey, data, isSocial);

    // 정부지원사업 렌더링 (기업마당 — app.js에서 선행 조회)
    _renderBizinfo(data);

    // 동종업계 경영 패턴 DB 렌더링
    // ⚠ 사회적기업 경로에서는 숨긴다 — PatternDB는 domainScores의 finance/hr/bm/differentiation
    //    4축을 읽는데 S1~S8은 s1~s8 키라 전부 undefined → 기본값 3점(중립) 고정이 된다.
    //    4축과 S1~S8의 매핑 설계는 별도 작업(CLAUDE.md 남은 이슈 참조)
    const patBox = document.getElementById('drPatternBox');
    if (isSocial) {
      if (patBox) patBox.style.display = 'none';
    } else if (typeof PatternDB !== 'undefined') {
      PatternDB.renderDiagReveal(data);
    }

    // 분기별 이력 비교 렌더링
    if (typeof HistoryTracker !== 'undefined') {
      HistoryTracker.renderCompare(data, currentSnap || window._currentSnap);
    }

    return { primary, secondary, domainScores };
  }

  /* ── KOSIS 업종 생존율 조회 + 렌더링 ── */
  function _fetchSurvival(industryKey, diagData, isSocial) {
    const box     = document.getElementById('drSurvivalBox');
    const content = document.getElementById('drSurvivalContent');
    if (!box || !content) return;

    content.innerHTML = '<p style="color:rgba(255,255,255,.45);font-size:13px;padding:8px 0">생존율 데이터 조회 중…</p>';
    box.style.display = '';

    // runAnalysis에서 이미 받아둔 데이터 우선 사용 (중복 호출 방지)
    const cached = diagData.survivalData || (typeof window !== 'undefined' && window._kosisSurvival);
    const p = cached
      ? Promise.resolve(cached)
      : fetch('/api/kosis-survival', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ industryKey }),
        }).then(function(r) { return r.json(); });

    p
    .then(function(d) {
      if (!d || !d.y3) { box.style.display = 'none'; return; }

      // 사업연차로 귀사 생존율 추정
      const startYear = parseInt(diagData.startYear) || 0;
      const nowYear   = new Date().getFullYear();
      const bizAge    = startYear > 1900 ? nowYear - startYear : null;

      let myRateText = '';
      if (bizAge !== null) {
        if (bizAge < 1)       myRateText = '<span class="surv-my">창업 초기 — 1년 생존율 ' + d.y1 + '% 구간 진입</span>';
        else if (bizAge < 3)  myRateText = '<span class="surv-my">1~3년차 — 3년 생존율 ' + d.y3 + '% 구간 통과 중</span>';
        else if (bizAge < 5)  myRateText = '<span class="surv-my">3~5년차 — 5년 생존율 ' + d.y5 + '% 구간 통과 중</span>';
        else                  myRateText = '<span class="surv-my surv-survived">5년 이상 생존 ✓ — 이 업종의 상위 ' + d.y5 + '% 생존 구간</span>';
      }

      const r = d.risk;
      /* 사회적기업 안내 — 업종 생존율은 통계청 기업생멸통계 실측치이므로 유지하되,
         사회적기업 특성(재정지원·공공조달 의존 등)이 반영되지 않았음을 명시한다.
         숨기면 정보가 사라지고, 그대로 두면 오해를 낳으므로 명시로 해결한다 */
      const socialNote = isSocial
        ? '<div class="surv-orgtype-note">ℹ️ 일반 ' + (d.name || '해당 업종') +
          ' 기준이며 사회적기업 특성은 반영되지 않았습니다. 참고 지표로만 보십시오.</div>'
        : '';
      content.innerHTML =
        socialNote +
        '<div class="surv-row">' +
          '<div class="surv-bar-wrap">' +
            _survBar('1년', d.y1, 100) +
            _survBar('3년', d.y3, 100) +
            _survBar('5년', d.y5, 100) +
          '</div>' +
          '<div class="surv-meta">' +
            '<div class="surv-risk-badge" style="background:' + r.bg + ';color:' + r.color + '">' + r.label + '</div>' +
            (myRateText ? '<div class="surv-my-wrap">' + myRateText + '</div>' : '') +
            '<div class="surv-src">출처: ' + d.source + '</div>' +
          '</div>' +
        '</div>';

      // AI 엔진이 참조할 수 있도록 전역 저장
      window._kosisSurvival = d;
    })
    .catch(function(err) {
      console.log('[KOSIS] 생존율 렌더링 오류:', err);
      box.style.display = 'none';
    });
  }

  /* ── 기업마당 정부지원사업 렌더링 ── */
  function _renderBizinfo(diagData) {
    const box     = document.getElementById('drBizinfoBox');
    const content = document.getElementById('drBizinfoContent');
    if (!box || !content) return;

    // ① 실시간 공고(기업마당) 우선 → ② 없으면 상시 지원사업(GovSupport) 폴백
    //    박스가 비어 사라지는 경로를 만들지 않는다
    let programs = diagData.bizinfoPrograms ||
      (typeof window !== 'undefined' && window._bizinfoPrograms) || [];
    const isLive = programs.length > 0;

    if (!isLive) {
      let gov = diagData.govPrograms ||
        (typeof window !== 'undefined' && window._govPrograms) || [];
      if (!gov.length && typeof GovSupport !== 'undefined') {
        try { gov = GovSupport.match(diagData) || []; } catch (e) { gov = []; }
      }
      // 기존 카드 마크업 재사용을 위한 필드 정규화 (amount 슬롯에 지원 '형태'가 들어감 — 금액 아님)
      programs = gov.map(function(p) {
        return {
          name:    p.name,
          org:     p.org  || '',
          type:    '상시',
          amount:  p.supportType || '',
          period:  p.period || '공고 확인 필요',
          dDay:    null,
          summary: p.summary || '',
          url:     p.url || '#',
        };
      });
    }

    if (!programs.length) { box.style.display = 'none'; return; }

    box.style.display = '';
    const sourceTag = isLive
      ? '<span class="bizinfo-live-badge">실시간</span>'
      : '<span class="bizinfo-fb-badge">상시 지원사업 · 공고 확인 필요</span>';
    // 고지 문구는 상시 지원사업에만 적용 — 실시간 공고에는 붙이지 않는다
    const disclaimer = (!isLive && typeof GovSupport !== 'undefined' && GovSupport.DISCLAIMER)
      ? '<p class="bizinfo-disclaimer">' + GovSupport.DISCLAIMER + '</p>'
      : '';

    content.innerHTML =
      '<p class="bizinfo-note">귀사 업종·규모 기준 관련도 순 정렬 ' + sourceTag + '</p>' + disclaimer +
      '<div class="bizinfo-list">' +
      programs.map(function(p) {
        const dDayHtml = (function() {
          if (p.dDay === null || p.dDay === undefined) return '';
          if (p.dDay < 0) return '<span class="bizinfo-dday expired">마감</span>';
          if (p.dDay === 0) return '<span class="bizinfo-dday urgent">D-Day</span>';
          return '<span class="bizinfo-dday' + (p.dDay <= 7 ? ' urgent' : '') + '">D-' + p.dDay + '</span>';
        })();
        return '<div class="bizinfo-card">' +
          '<div class="bizinfo-top">' +
            '<span class="bizinfo-type">' + (p.type || '지원') + '</span>' +
            '<span class="bizinfo-amount">' + (p.amount || '') + '</span>' +
          '</div>' +
          '<div class="bizinfo-name">' + p.name + '</div>' +
          '<div class="bizinfo-org">' + (p.org || '') + '</div>' +
          '<div class="bizinfo-period">' + (p.period || '') + dDayHtml + '</div>' +
          '<p class="bizinfo-summary">' + (p.summary || '') + '</p>' +
          '<a class="bizinfo-link" href="' + (p.url || '#') + '" target="_blank" rel="noopener">신청·상세 보기 →</a>' +
        '</div>';
      }).join('') +
      '</div>';

    // AI 엔진이 참조할 수 있도록 전역 저장
    window._bizinfoPrograms = programs;
  }

  function _survBar(label, val, max) {
    const pct = Math.round((val / max) * 100);
    return '<div class="surv-bar-item">' +
      '<span class="surv-bar-label">' + label + ' 생존율</span>' +
      '<div class="surv-bar-track"><div class="surv-bar-fill" style="width:' + pct + '%"></div></div>' +
      '<span class="surv-bar-val">' + val + '%</span>' +
    '</div>';
  }

  /* ── 5각형 레이더 차트 (Canvas) ── */
  function drawRadarChart(canvasId, domainScores) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const cx = w / 2, cy = h / 2;
    const R = Math.min(w, h) / 2 - 48;
    const entries = Object.values(domainScores);
    const n = entries.length;

    ctx.clearRect(0, 0, w, h);
    const angles = entries.map((_, i) => (i * 2 * Math.PI / n) - Math.PI / 2);

    function pt(angle, r) { return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }; }

    // 배경 격자
    for (let lv = 1; lv <= 5; lv++) {
      const r = (R * lv) / 5;
      ctx.beginPath();
      angles.forEach((a, i) => { const p = pt(a, r); i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); });
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    // 축선
    angles.forEach(a => {
      const p = pt(a, R);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; ctx.stroke();
    });

    // 데이터 폴리곤
    ctx.beginPath();
    entries.forEach((d, i) => {
      const r = (R * Math.max(d.avg, 0)) / 5;
      const p = pt(angles[i], r);
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(245,192,48,0.18)';
    ctx.fill();
    ctx.strokeStyle = '#F5C030';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 데이터 점
    entries.forEach((d, i) => {
      const r = (R * Math.max(d.avg, 0)) / 5;
      const p = pt(angles[i], r);
      ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#F5C030'; ctx.fill();
    });

    // 레이블
    const shortLabels = ['경영재무', '인적자원', 'BM역량', '미래기술', '차별화'];
    ctx.font = '11px Noto Sans KR, sans-serif';
    ctx.textAlign = 'center';
    entries.forEach((d, i) => {
      const p = pt(angles[i], R + 22);
      ctx.fillStyle = '#E8EDF5';
      ctx.fillText(shortLabels[i] || d.label, p.x, p.y + 4);
    });
  }

  /* 전체 진단 점수를 { 'diag-xxx-container_1_2': 3, ... } 평면 숫자 맵으로 수집.
     ⚠ 점수는 DOM이 아니라 diagScores 객체에만 존재한다.
        querySelectorAll('[id^="diag-"]') 방식은 값을 가진 요소가 없어 항상 빈 객체를 반환하므로 금지.
     DiagMicro.calcScores / DiagSme.calcScores / CrossContext.buildScoreMap 모두
     Number(val) 평면값을 기대하므로 {score, memo} 객체가 아닌 숫자만 담는다. */
  function collectAllScores() {
    const all = {};
    Object.keys(diagScores || {}).forEach(k => {
      const s = Number(diagScores[k]?.score || 0);
      if (s > 0) all[k] = s;
    });
    return all;
  }

  /* ── 정책자금 진단 (step5) 헬퍼 ────────────────────────────────
     세 진단은 서로 독립이므로 step5 DOM이 아예 없을 수 있다 → 전부 fallback 처리 */

  const _FUND_NONE = '해당 없음';

  // 결격요건 7문항 (id = 감싸는 .form-group id = 라디오 그룹 name)
  const FUND_ELIG_ITEMS = [
    ['fundTaxArrears',    '국세·지방세 체납'],
    ['fundCapitalImpair', '자본잠식 상태'],
    ['fundCreditIssue',   '금융질서문란·신용회복 절차'],
    ['fundClosureHist',   '최근 5년 내 휴업·폐업 이력'],
    ['fundRestrictedBiz', '제한업종 해당 여부'],
    ['fundPriorSupport',  '기존 정책자금 수혜·한도'],
    ['fundOverdue',       '금융기관 연체 이력'],
  ];

  /* 숫자 입력 파싱 — 미입력이면 null (0과 명확히 구분). 0으로 채우지 않는다 */
  function _fundNum(id) {
    const raw = (document.getElementById(id)?.value ?? '').trim();
    if (raw === '') return null;
    const v = Number(raw.replace(/,/g, ''));
    return Number.isFinite(v) ? v : null;
  }

  /* 부채비율 = 부채총계 / 자본총계 × 100 (소수점 1자리). 자본총계 ≤ 0이면 null */
  function _fundDebtRatio(debt, equity) {
    if (debt === null || equity === null || equity <= 0) return null;
    return Math.round((debt / equity) * 1000) / 10;
  }

  /* '해당 없음' 배타 처리 — 모순 입력(['벤처기업','해당 없음'])을 입력 단계에서 차단 */
  function _onFundCheckToggle(groupName, changed) {
    if (!changed) return;
    const boxes = Array.from(document.querySelectorAll(`input[name="${groupName}"]`));
    if (!boxes.length) return;
    if (changed.value === _FUND_NONE) {
      if (changed.checked) boxes.forEach(b => { if (b !== changed) b.checked = false; });
    } else if (changed.checked) {
      boxes.forEach(b => { if (b.value === _FUND_NONE) b.checked = false; });
    }
  }

  /* step5 상단 — AI가 판별한 업종을 한국어 라벨로 표시 (수정용 select는 별도) */
  function updateFundIndustryDisplay() {
    const el = document.getElementById('fundIndustryDetected');
    if (!el) return;
    const key = document.getElementById('aiIndustryKey')?.value || '';
    const label = INDUSTRY_LABEL_BY_KEY[key] || '';
    el.textContent = label
      ? 'AI가 판별한 업종: ' + label
      : '업종이 판별되지 않았습니다. 직접 선택해 주세요.';
  }

  /* 부채비율 실시간 표시 — 표시 전용, 판정하지 않는다 */
  function updateFundDebtRatio() {
    const box = document.getElementById('fundDebtRatio');
    if (!box) return;
    const debt = _fundNum('fundDebtTotal');
    const equity = _fundNum('fundEquityTotal');
    if (debt === null || equity === null) {
      box.classList.add('hidden');
      box.textContent = '';
      return;
    }
    box.classList.remove('hidden');
    box.textContent = equity <= 0
      ? '자본잠식 상태로 부채비율 산출 불가'
      : '부채비율 ' + _fundDebtRatio(debt, equity).toFixed(1) + '%';
  }

  function collect() {
    const g = id => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };
    const data = {
      purpose:         _purpose || 'general',   // 'general' | 'funding'
      companyName:     g('companyName'),
      bizType:         g('bizType'),         // 업태 (사업자등록증 — 예: 서비스)
      bizItem:         g('bizItem'),         // 종목 (사업자등록증 — 예: 미용업)
      // AI 분석 업종 키 — 정책자금 경로에서만 사용자 직접 선택(override)을 우선 적용.
      // ⚠ 경영진단 경로의 업종 판별에는 영향을 주지 않는다.
      industryKey: (() => {
        const ai = g('aiIndustryKey');
        if (_purpose === 'funding') {
          const override = g('fundIndustryOverride');
          if (override) return override;
        }
        return ai;
      })(),
      aiBusinessDesc:  g('aiBusinessDesc'),  // AI 분석 사업 설명
      industry:        g('industry'),
      bizScale:        (function() {
        const explicit = g('bizScale') || g('bizScaleSelect');
        if (explicit) return explicit;
        const emp = g('employees');
        return (!emp || emp === '1~5명') ? 'micro' : 'sme';
      })(),
      bizModel:        g('bizModel'),   // 추론된 BM 레이블 (hidden input)
      bizModelKey:     _inferredBmKey,  // 추론된 BM 키
      foundedYear:     g('foundedYear'),
      employees:       g('employees'),
      revenue:         g('revenue'),
      region:          g('region'),
      products:        g('products'),
      coreStrength:    g('coreStrength'),
      customerProblem: g('customerProblem'),
      unfairAdvantage: g('unfairAdvantage'),
      // STEP 3
      targetCustomer:      g('targetCustomer'),
      customerAcquisition: g('customerAcquisition'),
      cacLtv:              g('cacLtv'),
      tam:                 g('tam'),
      sam:                 g('sam'),
      som:                 g('som'),
      marketGrowthRate:    g('marketGrowthRate'),
      marketTrend:         g('marketTrend'),
      comp1Name:           g('comp1Name'),
      comp1Price:          g('comp1Price'),
      comp1Customer:       g('comp1Customer'),
      comp1Weakness:       g('comp1Weakness'),
      comp2Name:           g('comp2Name'),
      comp2Price:          g('comp2Price'),
      comp2Customer:       g('comp2Customer'),
      comp2Weakness:       g('comp2Weakness'),
      comp3Name:           g('comp3Name'),
      comp3Price:          g('comp3Price'),
      comp3Customer:       g('comp3Customer'),
      comp3Weakness:       g('comp3Weakness'),
      differentiation:     g('differentiation'),
      forceEntry:          g('force_entry'),
      forceEntryMemo:      g('force_entry_memo'),
      forceSubstitute:     g('force_substitute'),
      forceSubstituteMemo: g('force_substitute_memo'),
      forceSupplier:       g('force_supplier'),
      forceSupplierMemo:   g('force_supplier_memo'),
      forceBuyer:          g('force_buyer'),
      forceBuyerMemo:      g('force_buyer_memo'),
      forceRivalry:        g('force_rivalry'),
      forceRivalryMemo:    g('force_rivalry_memo'),
      // STEP 4
      problems:            g('problems'),
      goals:               g('goals'),
      timeline:            g('timeline'),
      budget:              g('budget'),
      externalRisk:        g('externalRisk'),
      partnerships:        g('partnerships'),
      govSupport:          Array.from(document.querySelectorAll('input[name="govSupport"]:checked')).map(el => el.value).join(', '),
      notes:               g('notes'),
      extraDiagArea:       g('extraDiagAreaHidden') || g('extraDiagArea'),
      isStartup:           g('aiIsStartup') === 'true',
      yearsInBusiness:     g('aiYearsInBusiness'),
      diagScores:          diagScores,
      // 조직 유형 — bizScale과 별개 플래그 (FundingRules의 bizScale 판정에 영향 주지 않음)
      orgType:             'general',   // 후반부에서 최종 industryKey 기준으로 확정
      // ── 정책자금 진단 (purpose='funding' / step5) ──
      // 미선택·미입력을 'none'·0·''으로 채우지 않는다:
      //   라디오 미선택 = 'unknown'(모름과 동일 취급), 체크박스 미응답 = [] (['해당 없음']과 다름),
      //   숫자 미입력 = null (0과 다름) — 판정 로직(4단계)이 이 구분에 의존한다
      fundingData: (() => {
        const radio  = n => document.querySelector(`input[name="${n}"]:checked`)?.value ?? 'unknown';
        const checks = n => Array.from(document.querySelectorAll(`input[name="${n}"]:checked`))
                              .map(el => el?.value || '').filter(Boolean);
        const debtTotal   = _fundNum('fundDebtTotal');
        const equityTotal = _fundNum('fundEquityTotal');
        return {
          // ── 기본 정보 확인 (정밀 판정용) ──
          // employeeCount: 0은 유효값(대표자 1인 사업장), 미입력은 null — 반드시 구분한다
          employeeCount:   _fundNum('fundEmployeeCount'),
          isManufacturing: radio('fundIsManufacturing'),   // 'yes'|'no'|'unknown'
          currentStatus:   radio('fundCurrentStatus'),     // 'active'|'closed'|'unknown'
          // ── 결격 요건 ──
          taxArrears:    radio('fundTaxArrears'),
          capitalImpair: radio('fundCapitalImpair'),
          creditIssue:   radio('fundCreditIssue'),
          closureHist:   radio('fundClosureHist'),
          restrictedBiz: radio('fundRestrictedBiz'),
          priorSupport:  radio('fundPriorSupport'),
          overdue:       radio('fundOverdue'),
          certs:         checks('fundCerts'),
          ip:            checks('fundIP'),
          assetTotal:    _fundNum('fundAssetTotal'),
          debtTotal:     debtTotal,
          equityTotal:   equityTotal,
          opProfit:      _fundNum('fundOpProfit'),
          debtRatio:     _fundDebtRatio(debtTotal, equityTotal),
          // STEP 1 연매출 — 자유 텍스트 원문 그대로. 파싱·정규화하지 않는다 (숫자 연산 전 파싱 필수)
          revenue:       g('revenue') || null,
        };
      })(),
      // DX 탐지 시그널 (1~2: 아날로그, 4~5: 디지털 선도)
      dxSignal: (() => {
        const s = diagScores['diag-common-container_dx_detect']?.score || 0;
        return s <= 2 && s > 0 ? 'analog' : s >= 4 ? 'digital_ready' : '';
      })(),
      // 대표자 의존도 복합 조건 (3_1 점수 ≤2 AND 직원>1)
      ceoDependencySignal: (() => {
        const depScore = diagScores['diag-common-container_3_1']?.score || 0;
        const empCount = parseInt(document.getElementById('employees')?.value || '0');
        return depScore > 0 && depScore <= 2 && empCount > 1;
      })(),
    };

    // bizScale은 리터럴에서 employees 추론까지 마친 data.bizScale을 그대로 사용한다.
    // (과거 여기서 `g('bizScale') || … || 'micro'` 로 재계산 후 덮어써서
    //  직원 6명 이상인데 micro로 오분류되던 2026-05-15 버그가 재발했음 — 재계산 금지)
    const bizScale = data.bizScale || 'micro';

    // orgType은 사용자 선택(#orgTypeSelect) 우선, 없으면 industryKey fallback
    data.orgType = _detectOrgType(data.industryKey || '');
    /* 파생 플래그 — dashboard.js 등 다른 모듈이 SOCIAL_ORG_TYPES 배열을 복제하지 않도록
       판정 결과 자체를 데이터에 실어 보낸다 (판정 기준은 이 파일 한 곳에만 둔다) */
    data.isSocialOrg = _isSocialOrg(data.orgType);

    let scaleScores = {};
    const allScores = collectAllScores();
    const _orgMod = _orgDiagModule(data.orgType);
    if (_orgMod) {
      /* 조직 형태 전용 진단 (사회적기업·협동조합 → S1~S8 / 소셜벤처 → V1~V8).
         bizScale(micro/sme)은 그대로 두고 진단 모듈만 교체한다.
         ⚠ 필드명은 orgPrompt/orgWarnings로 일반화한다. 구 필드(socialPrompt/socialWarnings)는
            회귀 방지를 위해 같은 값으로 병행 유지하며, 협동조합 작업 완료 후 제거 예정.
            새 코드에서는 orgPrompt/orgWarnings만 사용할 것 */
      scaleScores = _orgMod.calcScores(allScores);
      data.orgWarnings = data.socialWarnings = _orgMod.detectCrossWarnings(allScores);
      data.orgPrompt   = data.socialPrompt   = _orgMod.buildPromptSummary(allScores);
      // 점수 키 접두어를 실어 보낸다 — dashboard가 'diag-social-container_'를 하드코딩하지 않도록
      data.orgDiagKeyPrefix = _orgMod.KEY_PREFIX || '';
      data.orgDiagId = (_orgMod.getSchema && _orgMod.getSchema().id) || '';
    } else if (bizScale === 'micro' && window.DiagMicro) {
      const microGroup = DiagMicro.getGroup(data.industryKey || '');
      scaleScores = DiagMicro.calcScores(allScores);
      data.microWarnings = DiagMicro.detectCrossWarnings(allScores);
      data.microPrompt = DiagMicro.buildPromptSummary(allScores, microGroup);
    } else if (bizScale === 'sme' && window.DiagSme &&
               Object.keys(allScores).some(k => k.startsWith('diag-sme-container_'))) {
      // ⚠ DiagSme는 'diag-sme-container_*' 키를 기대하지만 해당 컨테이너가 렌더링되지 않아
      //    현재는 이 가드에 걸려 항상 비활성. 전 항목 0점 허위 요약 방지용 (별도 작업 필요)
      scaleScores = DiagSme.calcScores(allScores);
      data.smeWarnings = DiagSme.detectCrossWarnings(allScores);
      data.smePrompt = DiagSme.buildPromptSummary(allScores);
    }
    data.scaleScores = scaleScores;

    if (window.CrossContext) {
      const industryId = data.industryKey || data.industry || data.industryName || '';
      const bmId = data.bizModel || data.bm || data.bizModelName || '';
      const crossScores = Object.assign({}, allScores);

      // BM 탭이 제거된 경우(TAB_ORDER=['common','industry']), common 점수로 BM 프록시 주입
      const hasBmScores = Object.keys(crossScores).some(k => k.startsWith('diag-bm-container_'));
      if (!hasBmScores) {
        const domainAvg = {};
        [1, 2, 3, 4, 5].forEach(d => {
          const vals = Object.entries(crossScores)
            .filter(([k]) => k.includes(`diag-common-container_${d}_`))
            .map(([, v]) => v);
          domainAvg[d] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 3;
        });
        // BM 영역 번호 → common 도메인 매핑: 1→3(BM역량), 2→3, 3→2(인력운영), 4→4(미래)
        const BM_AREA_TO_DOMAIN = { 1: 3, 2: 3, 3: 2, 4: 4 };
        ['fr', 'bs', 'bc', 'bb', 'pl', 'ub', 'adv', 'dt', 'sv', 'md'].forEach(prefix => {
          [1, 2, 3, 4].forEach(area => {
            [1, 2, 3, 4].forEach(item => {
              const key = `diag-bm-container_${prefix}_${area}_${item}`;
              crossScores[key] = domainAvg[BM_AREA_TO_DOMAIN[area] || 3];
            });
          });
        });
      }

      data.crossWarnings = CrossContext.detectCrossWarnings(industryId, bmId, crossScores, bizScale);
      data.crossPrompt = CrossContext.buildPromptSummary(industryId, bmId, crossScores, bizScale);
    }

    // 정책자금 진단 경로에서만 기관 선별·결격 판정 수행 (경영진단·재무분석에는 영향 없음)
    if (_purpose === 'funding' && typeof FundingRules !== 'undefined') {
      try {
        data.fundingVerdict = FundingRules.evaluate(data.fundingData || {}, {
          industryKey: data.industryKey || '',
          bizScale:    data.bizScale    || '',
          employees:   data.employees   || '',
          foundedYear: data.foundedYear || '',
          yearsInBusiness: data.yearsInBusiness || '',
        });
      } catch (e) {
        console.error('FundingRules.evaluate 오류:', e);
        data.fundingVerdict = null;
      }
    }

    return data;
  }

  function animateLoading(isMicro) {
    const ids = ['ls1', 'ls2', 'ls3', 'ls4'];
    // micro: 각 call ~60~80s × 3회 → 스텝별 55000ms씩
    // standard: 웹검색+1차(긴), 2차(중간), 완료
    const delays = isMicro ? [55000, 55000, 55000] : [3000, 5000, 5000];
    // micro 모드일 때 로딩 스텝 레이블 동적 변경
    if (isMicro) {
      const labels = ['생애주기·전략 분석 (1차)', 'D1~D4 경영진단 처방 (2차)', 'D5~D7·정부지원 처방 (3차)', '보고서 통합 완성 중'];
      ids.forEach((id, idx) => {
        const el = document.getElementById(id);
        if (el) { const span = el.querySelector('span'); if (span) span.textContent = labels[idx]; }
      });
    }
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove('active', 'done');
      el.querySelector('.ld-step-ico').textContent = '○';
    });
    const first = document.getElementById(ids[0]);
    if (first) {
      first.classList.add('active');
      first.querySelector('.ld-step-ico').textContent = '◌';
    }
    let i = 0;
    function advance() {
      const cur = document.getElementById(ids[i]);
      if (cur) {
        cur.classList.replace('active', 'done');
        cur.querySelector('.ld-step-ico').textContent = '✓';
      }
      i++;
      if (i < ids.length) {
        const next = document.getElementById(ids[i]);
        if (next) {
          next.classList.add('active');
          next.querySelector('.ld-step-ico').textContent = '◌';
        }
        if (i < delays.length) setTimeout(advance, delays[i - 1]);
      }
    }
    setTimeout(advance, delays[0]);
  }

  function reset() {
    curStep = 1;
    curDiagTab = 'common';
    _inferredBmKey = '';
    _purpose = 'general';
    _orgType = 'general';
    // 진단 컨테이너 초기화 — 비우지 않으면 다음 경로의 진행률·검증에 이전 문항이 섞인다
    _clearAllDiagContainers();
    const orgSel = document.getElementById('orgTypeSelect');
    if (orgSel) orgSel.value = 'general';
    const typeBanner = document.getElementById('diag-type-banner');
    if (typeBanner) { typeBanner.innerHTML = ''; typeBanner.classList.add('hidden'); }
    Object.keys(diagScores).forEach(k => delete diagScores[k]);
    updateStepUI(1);
    const step1 = document.getElementById('step1');
    if (step1) step1.classList.remove('hidden');
    ['bm-confirm', 'step2', 'step3', 'step4', 'step5'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.classList.add('hidden'); el.classList.remove('slide-exit', 'slide-enter'); }
    });
  }

  /* ── BM 확인 → Step2 직접 전환 ── */
  function goToStep2FromBm() {
    // bm-confirm 숨기기
    const bmCard = document.getElementById('bm-confirm');
    if (bmCard) bmCard.classList.add('hidden');

    // 진단 UI 렌더링
    try { loadDiagnosisUI(); } catch(e) { console.error('loadDiagnosisUI 오류:', e); }

    // 내부 상태 갱신
    curStep = 2;
    updateStepUI(2);

    // step2 직접 표시
    const step2 = document.getElementById('step2');
    if (step2) {
      step2.classList.remove('hidden');
      step2.classList.add('slide-enter');
      setTimeout(() => step2.classList.remove('slide-enter'), 400);
    }
    window.scrollTo(0, 60);
  }

  /* ── BM 확인 화면 관련 ── */

  // 업종 키 반환 (app.js에서 호출)
  function getIndustryKey(industry) {
    return INDUSTRY_MAP[industry] || 'etc';
  }

  // 확정된 BM 키 저장 + hidden input 동기화
  function setBmKey(key) {
    _inferredBmKey = key;
    const hiddenKey   = document.getElementById('bizModelKey');
    const hiddenLabel = document.getElementById('bizModel');
    if (hiddenKey)   hiddenKey.value   = key;
    if (hiddenLabel) hiddenLabel.value = BM_LABELS[key] || key;
  }

  // BM 확인 카드 표시 (step1 숨기고 bm-confirm 표시)
  function showBmConfirmCard() {
    const step1   = document.getElementById('step1');
    const confirm = document.getElementById('bm-confirm');
    if (step1)   { step1.classList.add('slide-exit'); setTimeout(() => { step1.classList.add('hidden'); step1.classList.remove('slide-exit'); }, 250); }
    if (confirm) { setTimeout(() => { confirm.classList.remove('hidden'); confirm.classList.add('slide-enter'); setTimeout(() => confirm.classList.remove('slide-enter'), 400); }, 260); }
    window.scrollTo(0, 60);
  }

  // BM 확인 카드 숨기고 step1 복귀
  function hideBmConfirmCard() {
    const step1   = document.getElementById('step1');
    const confirm = document.getElementById('bm-confirm');
    if (confirm) confirm.classList.add('hidden');
    if (step1)   { step1.classList.remove('hidden', 'slide-exit'); }
    window.scrollTo(0, 60);
  }

  // BM 확인 화면 내용 채우기
  function populateBmConfirm(industryKey, industryLabel, formData) {
    const result    = inferBizModel(industryKey, formData);
    _inferredBmKey  = result.primary;
    const candidates = INDUSTRY_BM_MAP[industryKey] || INDUSTRY_BM_MAP['etc'];

    const BM_FULL_DESC = {
      'b2b_saas':     { name: 'B2B SaaS (기업 대상 구독 소프트웨어)', icon: '☁️',
        desc: '기업 고객에게 클라우드 소프트웨어를 월정액으로 제공합니다. 한번 도입하면 지속적으로 과금되어 안정적인 반복 수익(MRR)이 생깁니다.',
        fit:  '지식 서비스·IT개발, 금융·핀테크, 의료·헬스케어, 교육 업종에 가장 많이 나타납니다.' },
      'b2c_sub':      { name: 'B2C 구독 (소비자 대상 정기 구독)', icon: '🔄',
        desc: '개인 소비자에게 콘텐츠·제품·서비스를 월정액으로 제공합니다. 고객이 취소하기 전까지 매달 자동 결제됩니다.',
        fit:  '교육, 미디어·엔터, 패션·뷰티, 식품 구독박스 업종에서 많이 사용됩니다.' },
      'b2b_solution': { name: 'B2B 솔루션 (기업 맞춤 시스템 공급)', icon: '🏗️',
        desc: '기업 고객의 요구에 맞는 시스템·소프트웨어를 구축하고 납품합니다. 프로젝트 단위로 수주하거나 유지보수 계약을 맺습니다.',
        fit:  '건설·인테리어, 지식 서비스·IT, 수출 중소기업, 환경·에너지 업종에 적합합니다.' },
      'b2c_commerce': { name: 'B2C 커머스 (소비자 직접 판매)', icon: '🛒',
        desc: '온라인·오프라인을 통해 소비자에게 직접 제품을 판매합니다. 스마트스토어, 쿠팡, 자사몰 등이 대표적입니다.',
        fit:  '식품 제조·가공, 패션·뷰티, 농림·식품원료, 수출 중소기업 업종에 많습니다.' },
      'platform':     { name: '플랫폼·마켓플레이스 (중개 수수료)', icon: '🔗',
        desc: '공급자와 소비자를 연결하고 거래가 발생할 때 수수료를 받습니다. 양면 시장을 키울수록 네트워크 효과로 경쟁우위가 강화됩니다.',
        fit:  '전문 유통·도소매, 금융·핀테크, 교육, 물류·운송 업종에서 나타납니다.' },
      'franchise':    { name: '프랜차이즈 (가맹 시스템)', icon: '🏪',
        desc: '검증된 브랜드와 운영 시스템을 가맹점에 제공하고 가맹비·로열티를 받습니다. 직접 운영 없이 빠른 확산이 가능합니다.',
        fit:  '외식·음식업, 생활밀착형 서비스, 식품 제조·가공 업종에 주로 나타납니다.' },
      'mfg_dist':     { name: '제조·유통 (생산 후 도·소매 판매)', icon: '🏭',
        desc: '직접 제품을 생산하거나 소싱하여 도매·소매 채널을 통해 유통합니다. 마진은 원가와 판매가 차이에서 발생합니다.',
        fit:  '뿌리 제조·부품가공, 식품 제조, 농림·식품원료, 수출 중소기업 업종의 기본 모델입니다.' },
      'service':      { name: '서비스업 (전문 용역·서비스 제공)', icon: '🤝',
        desc: '전문 지식이나 인력을 투입해 고객 문제를 해결하고 건당·시간당·월정액으로 수익을 올립니다.',
        fit:  '생활밀착형 서비스, 건설·인테리어, 외식, 물류·운송 업종의 가장 일반적인 모델입니다.' },
      'usage_based':  { name: '종량제·사용량기반 (쓴 만큼 과금)', icon: '📊',
        desc: '고객이 실제 사용한 만큼만 요금을 냅니다. 초기 진입 장벽이 낮아 고객 확보가 쉽고, 사용량이 늘수록 수익도 증가합니다.',
        fit:  '지식 서비스·IT, 금융·핀테크, 환경·에너지, 물류·운송 업종에서 나타납니다.' },
      'advertising':  { name: '광고기반 (콘텐츠·트래픽 수익화)', icon: '📣',
        desc: '사용자에게 무료로 콘텐츠를 제공하고 광고주로부터 수익을 올립니다. 트래픽(방문자)이 많을수록 광고 단가와 수익이 높아집니다.',
        fit:  '미디어·엔터테인먼트 업종의 핵심 모델입니다.' },
      'deeptech':     { name: '딥테크·바이오 (기술 사업화·라이선싱)', icon: '🔬',
        desc: '원천기술·특허를 개발한 후 라이선싱, 기술이전, 또는 직접 제품화로 수익을 올립니다. 개발 기간이 길지만 성공 시 강력한 진입장벽이 생깁니다.',
        fit:  '의료·헬스케어, 환경·에너지, 지식 서비스·IT 중 R&D 중심 기업에 해당합니다.' },
      'etc':          { name: '기타 (복합 수익 구조)', icon: '📋',
        desc: '위 유형이 명확히 해당되지 않거나, 여러 모델을 혼합한 복합적 수익 구조입니다.',
        fit:  '업종과 수익 구조를 구체적으로 설명해주시면 AI가 맞춤 분석을 제공합니다.' }
    };

    const container = document.getElementById('bm-confirm-content');
    if (!container) return;

    let html = '<div class="bmc-industry-row"><span class="bmc-ind-label">선택 업종</span><span class="bmc-ind-val">' + industryLabel + '</span></div>';
    html += '<p class="bmc-section-title">이 업종에서 가능한 사업모델을 선택해주세요</p>';
    html += '<div class="bmc-options">';

    candidates.forEach(bm => {
      const info      = BM_FULL_DESC[bm] || BM_FULL_DESC['etc'];
      const isDefault = (bm === result.primary);
      html += '<label class="bmc-option' + (isDefault ? ' bmc-recommended' : '') + '">';
      html += '<input type="radio" name="bmChoice" value="' + bm + '"' + (isDefault ? ' checked' : '') + '>';
      html += '<div class="bmc-option-body">';
      html += '<div class="bmc-option-header">';
      html += '<span class="bmc-option-icon">' + info.icon + '</span>';
      html += '<span class="bmc-option-name">' + info.name + '</span>';
      if (isDefault) html += '<span class="bmc-badge">추천</span>';
      html += '</div>';
      html += '<p class="bmc-option-desc">' + info.desc + '</p>';
      html += '<p class="bmc-option-fit">✔ ' + info.fit + '</p>';
      html += '</div>';
      html += '</label>';
    });

    html += '</div>';
    container.innerHTML = html;
  }

  /* ── 업종별 외부 리스크 placeholder 동적 업데이트 ── */
  const _RISK_PLACEHOLDER = {
    local_service: '예: 임대료 계약 만료 임박 (집주인 인상 요구). 최저임금 인상으로 알바 인건비 부담. 근처에 동종 프랜차이즈 새로 입점. 매출의 대부분이 단골 3~5명에 집중',
    restaurant:    '예: 식재료 원가 급등 (채소·육류 30% 이상 상승). 배달 플랫폼 수수료 인상 (15%→20%). 주변 신규 음식점 대거 오픈. 건물 임대료 계약 만료 예정',
    wholesale:     '예: 주요 납품처 1~2곳에 매출 집중 (거래 중단 시 위기). 유통 플랫폼 수수료 인상. 중국산 저가 경쟁 제품 유입. 환율 변동으로 수입 원가 상승',
    construction:  '예: 자재비 급등 (철근·시멘트 가격 상승). 인건비 상승으로 공사 원가 압박. 중대재해처벌법 강화로 안전 관리 비용 증가. 발주처 공사 지연으로 기성금 회수 차질',
    knowledge_it:  '예: 핵심 개발자·전문인력 이직으로 유출 위험. AI 도구 확산으로 서비스 차별화 약화. 대형 IT기업의 유사 서비스 무료화. 프로젝트 수주 불규칙으로 매출 변동 심함',
    mfg_parts:     '예: 원자재(금속·수지) 가격 급등. 중국산 저가 경쟁 제품 유입. 주요 납품처 1~2곳에 의존 (단가 인하 압력). 장비 노후화로 불량률 증가 우려',
    food_mfg:      '예: 식품 원재료 가격 급등. HACCP 인증 갱신 및 위생 점검 강화. 유통기한 관리 실수로 반품·리콜 리스크. 대형마트·편의점 납품 단가 인하 압력',
    medical:       '예: 비급여 수가 인하 또는 급여화 전환. 의료광고 규제 강화로 마케팅 제한. 핵심 의료진 이직·개원으로 인력 공백. 근처 의료기관 신규 개원으로 경쟁 심화',
    finance:       '예: 금융 당국 규제 강화 (대부업법·금소법 개정). 고금리 지속으로 대출 수요 감소. 핀테크 플랫폼의 시장 잠식. 연체율 상승으로 대손 충당금 부담 증가',
    education:     '예: 학령인구 감소로 수강생 모집 어려움. 유튜브·클래스101 등 무료·저가 콘텐츠와 가격 경쟁. 스타 강사 이직 또는 독립 개원. 정부 공공 교육기관 무료 프로그램 확대',
    fashion:       '예: 시즌 재고 소진 실패로 자금 압박. 알리·테무 등 중국 직구 저가 경쟁 심화. 트렌드 변화 속도 빨라 재고 기획 미스 위험. 원단·부자재 가격 상승',
    media:         '예: SNS 알고리즘 변경으로 노출량 급감. 광고 단가 하락 (CPC·CPM 감소). AI 생성 콘텐츠 확산으로 차별화 약화. 구독자·시청자 이탈로 수익 불안정',
    logistics:     '예: 유류비 급등으로 운송 원가 상승. 화물 단가 인하 압력 (대형 물류기업 진입). 운전 인력 부족 및 인건비 상승. 차량 노후화에 따른 유지보수 비용 증가',
    energy:        '예: 정부 보조금 정책 변경 또는 축소. 계통연계 대기 기간 장기화. 태양광 패널 가격 경쟁 심화 (중국산). 인허가 지연으로 사업 일정 차질',
    agri_food:     '예: 기후변화로 원물 수급 불안정 (작황 부진). 수입 농산물 가격 경쟁 심화. GAP·HACCP 인증 유지 비용 부담. 유통채널 납품 단가 인하 압력',
    export_sme:    '예: 환율 변동 (원화 강세 시 수출 채산성 악화). 바이어 1~2곳 집중으로 납품 중단 리스크. 수출 대상국 규제·인증 변경 (CE·FDA 갱신). 중국·동남아 경쟁 업체 저가 공세'
  };

  function updateRiskPlaceholder(industryKey) {
    const hint = document.getElementById('riskExampleHint');
    const ph = _RISK_PLACEHOLDER[industryKey];
    if (hint && ph) hint.textContent = ph;
  }

  /* ── 업종별 주요제품·핵심강점·고객문제 placeholder 동적 업데이트 ── */
  const _BIZ_PLACEHOLDERS = {
    mfg_parts: {
      products:        '예: CNC 선반 정밀 가공 부품, 자동차 브라켓·샤프트, 플라스틱 사출 케이스',
      coreStrength:    '예: 정밀도 ±0.01mm 보장, ISO 9001 인증, 납기 준수율 98% — 월 최대 50만 개 생산',
      customerProblem: '예: 소량 발주 시 단가가 너무 높고, 납기 지연·품질 불량으로 라인 스톱이 반복됩니다'
    },
    food_mfg: {
      products:        '예: HMR 간편식·냉동 만두, OEM 소스·양념류, 냉장 반찬 패키지',
      coreStrength:    '예: HACCP 인증 공장, 자체 레시피 30종 보유, 대형마트·급식업체 납품 이력 5년',
      customerProblem: '예: 원물 가격 급등 시 마진이 급감하고, 유통기한 관리·반품 처리가 어렵습니다'
    },
    local_service: {
      products:        '예: 세탁·수선 당일 처리, 반려동물 미용·호텔링, 홈클리닝·이사 청소',
      coreStrength:    '예: 당일 픽업·배달, 지역 10년 단골 고객 기반, 친절한 응대와 빠른 AS',
      customerProblem: '예: 예약 없이 방문하면 대기가 길고, 서비스 가격·소요시간이 미리 안내되지 않습니다'
    },
    wholesale: {
      products:        '예: 식자재 도매 공급, 공산품·생활용품 총판, B2B 대량 납품·배송',
      coreStrength:    '예: 전국 당일 배송망, 대량 구매 가격 경쟁력, 안정적 재고 1,000SKU 보유',
      customerProblem: '예: 소량 주문 시 배송비 부담이 크고, 재고 소진 후 납품 지연이 반복됩니다'
    },
    restaurant: {
      products:        '예: 한식 정식 코스, 프리미엄 런치 도시락, 배달 전용 세트 메뉴',
      coreStrength:    '예: 직접 개발한 시그니처 소스, 산지 직계약 식재료, 주방장 20년 경력',
      customerProblem: '예: 점심 피크타임 대기가 길고, 배달 주문 시 음식이 식거나 담김이 부실합니다'
    },
    knowledge_it: {
      products:        '예: 웹·앱 개발 외주, SaaS 솔루션 구축, IT 컨설팅·유지보수',
      coreStrength:    '예: 풀스택 개발팀 5인(평균 경력 7년), 납기 준수율 95%, 레퍼런스 30건',
      customerProblem: '예: 요구사항 변경 때마다 추가 비용이 발생하고, 납기 지연·소통 누락이 잦습니다'
    },
    construction: {
      products:        '예: 상가·사무실 인테리어 시공, 주택 리모델링, 소규모 건축·증개축',
      coreStrength:    '예: 자체 시공팀 10인, 준공 후 AS 2년 보증, 견적 당일 제공',
      customerProblem: '예: 공사비 초과 청구·일정 지연이 잦고, 완공 후 하자 처리가 느립니다'
    },
    medical: {
      products:        '예: 내과·가정의학과 진료, 건강검진 패키지, 비급여 주사·피부 시술',
      coreStrength:    '예: 전문의 2인 체제, 평균 대기 15분, EMR 전자차트·예약 시스템 완비',
      customerProblem: '예: 예약 없이 방문 시 대기가 길고, 진료비·비급여 가격 안내가 불명확합니다'
    },
    finance: {
      products:        '예: 중소기업 대출 중개, 법인보험 설계, 개인 자산관리·은퇴 설계 컨설팅',
      coreStrength:    '예: 금융 경력 15년, 20개 금융사 제휴, 고객 맞춤 포트폴리오 무료 설계',
      customerProblem: '예: 상품 구조가 복잡하고, 수수료·해지 조건이 가입 전에 명확히 안내되지 않습니다'
    },
    education: {
      products:        '예: 수학·영어 입시 전문반, 1:1 맞춤 과외, 온라인 실시간 강의',
      coreStrength:    '예: 전임 강사 5인(평균 경력 8년), 반별 정원 8명 소수 정예, 매월 성적 리포트 제공',
      customerProblem: '예: 수업 후 개인 복습이 부족하고, 성적 향상이 눈에 보이지 않아 불안합니다'
    },
    fashion: {
      products:        '예: 여성 캐주얼 의류, OEM 자체 브랜드 생산, 온라인 단독 한정 컬렉션',
      coreStrength:    '예: 자체 디자인팀, 트렌드 반영 4주 기획→출시, 재구매율 45% 이상',
      customerProblem: '예: 원하는 사이즈·컬러가 품절이고, 반품·환불 절차가 번거롭습니다'
    },
    media: {
      products:        '예: 브랜드 영상 제작·편집, 유튜브 채널 운영 대행, SNS 콘텐츠 기획·발행',
      coreStrength:    '예: 조회수 10만↑ 레퍼런스 다수, 기획~배포 원스톱 처리, 평균 납기 5일',
      customerProblem: '예: 콘텐츠 발행 후 조회수·반응이 없고, 일관된 브랜드 톤 유지가 어렵습니다'
    },
    logistics: {
      products:        '예: 전국 택배·화물 대행, 냉장·냉동 특송, B2B 기업 간 정기 배송',
      coreStrength:    '예: 자차 5톤 트럭 3대·냉장 창고 보유, 당일 배송 가능, 파손율 0.1% 미만',
      customerProblem: '예: 배송 지연·파손이 발생하고, 실시간 위치 추적이 안 돼 고객 문의가 폭증합니다'
    },
    energy: {
      products:        '예: 태양광 발전 시스템 설치·AS, ESS 에너지 저장 솔루션, 탄소배출권 컨설팅',
      coreStrength:    '예: 산업부 인증 시공사, 자체 유지보수팀, 발전량 실시간 원격 모니터링',
      customerProblem: '예: 초기 설치 비용 부담이 크고, 정부 보조금 신청 절차가 복잡합니다'
    },
    agri_food: {
      products:        '예: 국내산 쌀·잡곡 산지 직거래, 냉동 농산물 가공품, 친환경 농산물 선물 세트',
      coreStrength:    '예: 직영 농장 보유, GAP 인증, 수확~배송 콜드체인 완비로 신선도 유지',
      customerProblem: '예: 기후 변화로 수확량이 불안정하고, 유통 마진이 커서 실제 농가 수익이 낮습니다'
    },
    export_sme: {
      products:        '예: OEM 완제품 수출, 자체 브랜드 해외 판매, 바이어 맞춤 주문 생산',
      coreStrength:    '예: CE·FDA 인증 보유, 7개국 바이어 네트워크, 영어·중국어 커뮤니케이션 대응',
      customerProblem: '예: 환율 변동에 채산성이 흔들리고, 해외 바이어 대금 회수가 지연됩니다'
    }
  };

  function updateBizPlaceholders(industryKey) {
    const ph = _BIZ_PLACEHOLDERS[industryKey];
    if (!ph) return;
    const elProducts = document.getElementById('products');
    const elStrength = document.getElementById('coreStrength');
    const elProblem  = document.getElementById('customerProblem');
    // 값이 있어도 placeholder는 항상 갱신 (입력값은 placeholder 위에 표시되므로 UX 영향 없음)
    if (elProducts) elProducts.placeholder = ph.products;
    if (elStrength) elStrength.placeholder = ph.coreStrength;
    if (elProblem)  elProblem.placeholder  = ph.customerProblem;
  }

  // HTML oninput 속성에만 의존하지 않도록 JS에서 직접 이벤트 리스너 등록
  document.addEventListener('DOMContentLoaded', function() {
    var btEl = document.getElementById('bizType');
    var biEl = document.getElementById('bizItem');
    if (btEl) btEl.addEventListener('input', inferIndustryFromType);
    if (biEl) biEl.addEventListener('input', inferIndustryFromType);

    // 정책자금 진단(step5) — '해당 없음' 배타 처리 + 부채비율 실시간 표시
    // (HTML oninput 속성은 캐시 문제가 있었으므로 리스너로 등록 — 2026-06-05 c317c03 참조)
    ['fundCerts', 'fundIP'].forEach(function(nm) {
      document.querySelectorAll('input[name="' + nm + '"]').forEach(function(box) {
        box.addEventListener('change', function() { _onFundCheckToggle(nm, box); });
      });
    });
    ['fundDebtTotal', 'fundEquityTotal'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', updateFundDebtRatio);
    });

    // 조직 형태 선택 — 전용 모듈이 없는 형태 선택 시 확인 (HTML onchange 속성 미사용)
    var orgSel = document.getElementById('orgTypeSelect');
    if (orgSel) orgSel.addEventListener('change', _onOrgTypeChange);
  });

  return { goStep, validate, collect, animateLoading, reset, setPurpose, getPurpose, setScore, setMemo, setNumeric, setMixed, switchDiagTab, prevDiagTab, showDiagReveal, calcDomainScores, classifyConsultingType, drawRadarChart, onIndustryChange, getIndustryKey, setBmKey, showBmConfirmCard, hideBmConfirmCard, populateBmConfirm, goToStep2FromBm, formatBizNo, validateBizNo, lookupBiz, inferIndustryFromType, skipBizLookup, switchAutoTab, handleOcrUpload, handleOcrDrop, onCompanyNameInput, lookupDart, applyDartRevenue, showBizContext, hideAllCards, loadDiagnosisUI, updateRiskPlaceholder, SOCIAL_DOMAIN_EXPLAIN, VENTURE_DOMAIN_EXPLAIN, COOP_DOMAIN_EXPLAIN, ORG_DOMAIN_EXPLAIN };
})();
