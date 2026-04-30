/* ================================================================
   BizNavi AI — wizard.js (고도화 v3.1)
   4단계 입력 위저드: 탭 순서 진행, 입력값 유지, 점수 복원
   ================================================================ */

const Wizard = (() => {
  let curStep = 1;
  let curDiagTab = 'common';
  const diagScores = {};
  const diagMemos = {};

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

    const result = document.getElementById('bizInferResult');
    const industrySelect = document.getElementById('industry');
    if (!result || !industrySelect) return;

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
      if ((bizType + bizItem).trim().length > 0) {
        result.className = 'biz-infer-result biz-infer-warn';
        result.textContent = '⚠ 업종을 자동 판별하지 못했습니다. 아래 업종 드롭다운에서 직접 선택해주세요.';
        result.classList.remove('hidden');
      }
      return;
    }

    const [topIndustry, topScore] = sorted[0];
    industrySelect.value = topIndustry;

    // 2위 점수가 1위의 70% 이상이면 후보 2개 표시
    let msg = '✓ 업종 자동 설정: ' + topIndustry;
    if (sorted.length > 1 && sorted[1][1] >= topScore * 0.7) {
      msg += ' (후보: ' + sorted[1][0] + ') — 아래에서 확인 후 변경 가능합니다.';
    } else {
      msg += ' — 아래에서 확인 후 변경 가능합니다.';
    }
    result.className = 'biz-infer-result biz-infer-ok';
    result.textContent = msg;
    result.classList.remove('hidden');
    onIndustryChange();
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

    // STEP 2에서 다음 버튼 클릭 시 탭 순서대로 진행 (n===3 또는 n===4 모두 처리)
    if (curStep === 2 && n > 2) {
      if (!validateCurrentTab()) return;
      const currentTabIndex = TAB_ORDER.indexOf(curDiagTab);
      if (currentTabIndex < TAB_ORDER.length - 1) {
        const nextTab = TAB_ORDER[currentTabIndex + 1];
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
    if (n === 4 && typeof App !== 'undefined') setTimeout(App.fillSavedKey, 100);
  }

  function updateStepUI(n) {
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
      const total = document.querySelectorAll('.diag-item:not([data-signal-only])').length || 13;
      const done  = Object.keys(diagScores).filter(k => !k.includes('dx_detect') && diagScores[k].score > 0).length;
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
    return true;
  }

  function loadDiagnosisUI(forceIndustryKey) {
    // AI 분석 결과 key 우선 → hidden input(aiIndustryKey) → 드롭다운(레거시) → 기본값
    const industry    = document.getElementById('industry')?.value || '';
    const aiKey       = document.getElementById('aiIndustryKey')?.value || '';
    const industryKey = forceIndustryKey || aiKey || INDUSTRY_MAP[industry] || 'local_service';
    const bizModelKey = _inferredBmKey || 'etc';

    // 공통 모듈 렌더링 — 창업 초기면 STARTUP_DIAGNOSIS로 교체
    const isStartupMode = document.getElementById('aiIsStartup')?.value === 'true';
    let commonDiag = isStartupMode && typeof STARTUP_DIAGNOSIS !== 'undefined'
      ? STARTUP_DIAGNOSIS
      : (typeof COMMON_DIAGNOSIS !== 'undefined' ? COMMON_DIAGNOSIS : null);
    // Dynamic Common Core: 업종별 문구 오버라이드 + DX 탐지 주입 (창업 초기 제외)
    if (commonDiag && !isStartupMode) {
      commonDiag = _applyIndustryWording(commonDiag, industryKey);
      commonDiag = _injectDxDetect(commonDiag);
    }
    renderDiagModule('diag-common-container', commonDiag);

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
    };
    const industryData = industryVarMap[industryKey];
    if (industryData) renderDiagModule('diag-industry-container', industryData);

    // 탭 버튼 레이블 동적 업데이트 (업종 반영)
    const aiLabel = document.getElementById('aiIndustryKey') ? (() => {
      // AI가 반환한 industry_label로 탭 레이블 설정
      const bizCtxBadge = document.querySelector('.biz-ctx-type-badge');
      return bizCtxBadge ? bizCtxBadge.textContent : null;
    })() : null;
    const indLabel  = aiLabel || document.getElementById('bizItem')?.value || industry || '업종';
    const tabIndustry = document.getElementById('diagTabBtn-industry');
    if (tabIndustry) tabIndustry.textContent = '🏭 ' + indLabel + ' 특화 진단 (5문항)';

    // 창업 초기 모드: 탭 레이블을 창업 전용으로 변경
    const tabCommon = document.getElementById('diagTabBtn-common');
    if (tabCommon) {
      tabCommon.textContent = isStartupMode
        ? '🚀 창업 초기 진단 (8문항)'
        : '📋 기본 경영 진단 (8문항)';
    }

    // 진행률 카운터 총 항목 수 동적 갱신 (signal-only 제외)
    const totalItems = document.querySelectorAll('.diag-item:not([data-signal-only])').length || 13;
    const progressText = document.getElementById('diag-progress-text');
    if (progressText) progressText.textContent = '0 / ' + totalItems + ' 항목 완료';

    // 첫 탭으로 리셋
    curDiagTab = 'common';
    updateDiagTabUI('common');

    // 저장된 점수 복원
    restoreScores();
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
    html += '<div class="diag-item-text">' + item.text + '</div>';

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

  function _renderBars(item, scoreKey, savedScore) {
    // anchors가 없으면 기본 설명으로 대체
    const anchors = item.anchors || GENERIC_ANCHORS;
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

  function renderDiagModule(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container || !data) return;
    let html = '<div class="diag-module">';
    html += '<h3 class="diag-module-title">' + data.title + '</h3>';
    data.areas.forEach(area => {
      html += '<div class="diag-area">';
      html += '<div class="diag-area-header">';
      html += '<h4 class="diag-area-title">' + area.title + '</h4>';
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
    const total = document.querySelectorAll('.diag-item:not([data-signal-only])').length || 13;
    const done = Object.keys(diagScores).filter(k => !k.includes('dx_detect') && diagScores[k].score > 0).length;
    const pct = Math.round((done / total) * 100);
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
    const currentIndex = TAB_ORDER.indexOf(curDiagTab);
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
      const prevTab = TAB_ORDER[currentIndex - 1];
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
      const currentIndex = TAB_ORDER.indexOf(tab);
      nextBtn.textContent = currentIndex < TAB_ORDER.length - 1 ? '다음 진단 →' : '다음 단계 →';
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

  /* ── 진단유형 확인 화면 렌더링 ── */
  function showDiagReveal(data, currentSnap) {
    const scores = data.diagScores || diagScores;
    const isStartup = !!(data.isStartup);
    const domainScores = calcDomainScores(scores, isStartup);
    const explainMap = isStartup ? STARTUP_DOMAIN_EXPLAIN : DOMAIN_EXPLAIN;
    const { primary, secondary } = classifyConsultingType(domainScores);
    const pType = CONSULTING_TYPES[primary]   || CONSULTING_TYPES.growth_strategy;
    const sType = CONSULTING_TYPES[secondary] || CONSULTING_TYPES.differentiation_strategy;

    const elPrimary   = document.getElementById('drTypePrimary');
    const elSecondary = document.getElementById('drTypeSecondary');
    const elDesc      = document.getElementById('drTypeDesc');
    if (elPrimary)   elPrimary.textContent   = pType.icon + ' ' + pType.label;
    if (elSecondary) elSecondary.textContent = '보조 유형: ' + sType.icon + ' ' + sType.label;
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

    drawRadarChart('radarChart', domainScores);

    // 업종 생존율 렌더링 (KOSIS — app.js에서 선행 조회)
    const industryKey = data.industry || '';
    if (industryKey) _fetchSurvival(industryKey, data);

    // 정부지원사업 렌더링 (기업마당 — app.js에서 선행 조회)
    _renderBizinfo(data);

    // 동종업계 경영 패턴 DB 렌더링
    if (typeof PatternDB !== 'undefined') {
      PatternDB.renderDiagReveal(data);
    }

    // 분기별 이력 비교 렌더링
    if (typeof HistoryTracker !== 'undefined') {
      HistoryTracker.renderCompare(data, currentSnap || window._currentSnap);
    }

    return { primary, secondary, domainScores };
  }

  /* ── KOSIS 업종 생존율 조회 + 렌더링 ── */
  function _fetchSurvival(industryKey, diagData) {
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
      content.innerHTML =
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
    .catch(function() { box.style.display = 'none'; });
  }

  /* ── 기업마당 정부지원사업 렌더링 ── */
  function _renderBizinfo(diagData) {
    const box     = document.getElementById('drBizinfoBox');
    const content = document.getElementById('drBizinfoContent');
    if (!box || !content) return;

    const programs = diagData.bizinfoPrograms ||
      (typeof window !== 'undefined' && window._bizinfoPrograms) || [];

    if (!programs.length) { box.style.display = 'none'; return; }

    box.style.display = '';
    const sourceTag = programs[0]._source === 'api'
      ? '<span class="bizinfo-live-badge">실시간</span>'
      : '<span class="bizinfo-fb-badge">주요 상시사업</span>';

    content.innerHTML =
      '<p class="bizinfo-note">귀사 업종·규모 기준 관련도 순 정렬 ' + sourceTag + '</p>' +
      '<div class="bizinfo-list">' +
      programs.map(function(p) {
        const dDayHtml = p.dDay !== null && p.dDay !== undefined
          ? '<span class="bizinfo-dday' + (p.dDay <= 7 ? ' urgent' : '') + '">D-' + p.dDay + '</span>'
          : '';
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

  function collect() {
    const g = id => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };
    return {
      companyName:     g('companyName'),
      bizType:         g('bizType'),         // 업태 (사업자등록증 — 예: 서비스)
      bizItem:         g('bizItem'),         // 종목 (사업자등록증 — 예: 미용업)
      industryKey:     g('aiIndustryKey'),   // AI 분석 업종 키
      aiBusinessDesc:  g('aiBusinessDesc'),  // AI 분석 사업 설명
      industry:        g('industry'),
      bizScale:        g('bizScale'),   // 'micro' | 'sme'
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
  }

  function animateLoading() {
    const ids = ['ls1', 'ls2', 'ls3', 'ls4'];
    // 각 스텝 대기 시간(ms): 웹검색~1차(긴 대기), 1차→2차(중간), 2차→완료(짧은 대기)
    const delays = [3000, 5000, 5000];
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
    Object.keys(diagScores).forEach(k => delete diagScores[k]);
    updateStepUI(1);
    const step1 = document.getElementById('step1');
    if (step1) step1.classList.remove('hidden');
    ['bm-confirm', 'step2', 'step3', 'step4'].forEach(id => {
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

  return { goStep, validate, collect, animateLoading, reset, setScore, setMemo, setNumeric, setMixed, switchDiagTab, prevDiagTab, showDiagReveal, calcDomainScores, classifyConsultingType, drawRadarChart, onIndustryChange, getIndustryKey, setBmKey, showBmConfirmCard, hideBmConfirmCard, populateBmConfirm, goToStep2FromBm, formatBizNo, validateBizNo, lookupBiz, inferIndustryFromType, skipBizLookup, switchAutoTab, handleOcrUpload, handleOcrDrop, onCompanyNameInput, lookupDart, applyDartRevenue, showBizContext, hideAllCards, loadDiagnosisUI, updateRiskPlaceholder };
})();
