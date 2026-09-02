/* ================================================================
   BizNavi — diagnosis-venture.js
   소셜벤처 전용 진단 (orgType='social_venture')

   V1~V8 8영역 × 5문항 = 40문항, 5점 BARS.
   근거: 기술보증기금 소셜벤처 판별기준 (중소벤처기업부고시)
        사회성 판별표 12개 + 혁신성장성 판별표 12개, 각각 70점 이상 시 판별
        출처: https://sv.kibo.or.kr/Homepage/attach/guide.pdf

   ⚠ diagnosis-social.js(S1~S8)를 복사한 것이 아니다. 평가 축이 근본적으로 다르다.
      ① 소셜벤처는 사회적기업·협동조합·마을기업과 달리 자격을 정의하는 특별법이 없다.
         판별은 '지속 자격'이 아니라 지원사업 신청 기준이다 → 만료·갱신 경고를 넣지 않는다.
      ② 혁신성장성(기술 혁신성·사업 성장성·R&D 역량·대표자 기술역량)이 평가의 절반이다.
         S1~S8에는 이 축이 거의 없다 → V3(기술 혁신성)·V4(성장성)·V6(팀·R&D)로 확보한다.
      ③ 소셜벤처는 상법상 영리법인이며 벤처투자·기술보증 트랙을 탄다.
         공공조달 중심인 사회적기업과 자금 조달 경로가 다르다
         → S3(공공조달·판로) 자리에 V5(투자유치·자금조달)를 둔다.

   ⚠ 판별표 점수(사회성 70점 / 혁신성장성 70점)를 예측하거나 흉내내지 않는다.
      BizNavi는 판별 점수 예측 도구가 아니라 준비도 진단 도구다.
      실제 판별 결과와 다르면 신뢰 문제가 생긴다(SVI를 흉내내지 않기로 한 것과 동일 원칙).
      → 8영역 균등 배점(0.125). 문항 해설은 "판별 신청 전 갖춰야 할 것"을 짚는 방향으로 쓴다.

   스키마는 diagnosis-social.js와 동일하다. 점수 키는 'diag-venture-container_v1_1' 형식.
   ================================================================ */

const DiagVenture = (() => {

  const DOMAINS = [
    { id:'v1', key:'problem_def',  label:'사회문제 정의',      icon:'🎯', desc:'해결하려는 사회문제의 정관 명시·구조적 정의·수혜 대상 특정 수준을 진단합니다.', weight:0.125 },
    { id:'v2', key:'impact_proof', label:'임팩트 측정·검증',   icon:'📐', desc:'사회적 성과의 정량 측정·외부 검증·피드백 반영 체계를 진단합니다.',           weight:0.125 },
    { id:'v3', key:'tech_innov',   label:'기술·아이디어 혁신성', icon:'🔬', desc:'핵심 기술의 차별성·지식재산권·사회문제 해결과의 연결을 진단합니다.',        weight:0.125 },
    { id:'v4', key:'growth_market',label:'사업 성장성·시장',   icon:'📈', desc:'시장 규모 산출·성장 지표 추적·수익 모델 검증 수준을 진단합니다.',           weight:0.125 },
    { id:'v5', key:'funding',      label:'투자유치·자금조달',   icon:'💵', desc:'투자 이력·IR 자료·기술보증 검토·자금 소요 계획을 진단합니다.',              weight:0.125 },
    { id:'v6', key:'team_rnd',     label:'팀·R&D 역량',        icon:'👥', desc:'대표자 전문성·핵심 인력 기술역량·연구개발 조직 보유 수준을 진단합니다.',     weight:0.125 },
    { id:'v7', key:'sv_cert',      label:'판별·제도 활용',      icon:'📋', desc:'소셜벤처 판별 준비도와 지원 제도·중간지원조직 활용도를 진단합니다.',        weight:0.125 },
    { id:'v8', key:'digital_ops',  label:'디지털·AX',          icon:'🤖', desc:'데이터 축적·서비스 활용·AI 도구 실무 적용·개발 프로세스를 진단합니다.',      weight:0.125 },
  ];

  const ITEMS = {

    /* ===================== V1 사회문제 정의 ===================== */
    'v1_1': {
      label: '정관의 사회문제 명시',
      question: '해결하려는 사회문제가 정관에 구체적으로 명시되어 있는가? — 판별표에서 정관 명시가 최대 배점 항목이며, 정관 변경은 등기 절차가 필요해 미리 준비해야 합니다.',
      scale: [
        { score:1, desc:'정관에 사회적 목적 관련 조항이 전혀 없고 일반 영리법인 표준 정관 그대로임.' },
        { score:2, desc:'정관에 "사회 공헌" 수준의 관용구만 있고 어떤 문제를 다루는지는 적혀 있지 않음.' },
        { score:3, desc:'사업 목적란에 관련 문구는 있으나 해결 대상 문제가 특정되지 않아 심사에서 설명이 필요함.' },
        { score:4, desc:'정관에 해결하려는 사회문제가 문장으로 특정되어 있고 사업 목적과 연결됨.' },
        { score:5, desc:'정관에 문제·대상·해결 방식이 명시되어 있고 등기부에도 반영되어 증빙이 바로 가능함.' },
      ],
      ai_trigger: { threshold:2, warning:'articles_missing' },
    },
    'v1_2': {
      label: '구조적 문제로의 정의',
      question: '그 문제를 개인의 사정이 아니라 사회 구조에서 비롯된 문제로 정의하고 있는가?',
      scale: [
        { score:1, desc:'"어려운 사람을 돕는다" 수준이며 문제의 원인을 따져본 적이 없음.' },
        { score:2, desc:'대상의 어려움은 설명하지만 원인을 개인의 사정으로만 보고 있음.' },
        { score:3, desc:'구조적 원인을 어느 정도 인식하나 자료나 문서로 정리되어 있지 않음.' },
        { score:4, desc:'제도·시장의 어떤 공백에서 문제가 생기는지 문서로 정리해 두었음.' },
        { score:5, desc:'구조적 원인을 통계·연구자료로 뒷받침하고 사업 설계의 근거로 삼고 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'problem_shallow' },
    },
    'v1_3': {
      label: '수혜 대상·규모 특정',
      question: '누가 수혜 대상이며 그 규모가 얼마나 되는지 구체적으로 특정하고 있는가?',
      scale: [
        { score:1, desc:'수혜 대상을 "취약계층" 같은 넓은 말로만 표현하고 규모는 모름.' },
        { score:2, desc:'대상 집단은 말할 수 있으나 규모는 추정해 본 적이 없음.' },
        { score:3, desc:'대상과 대략적 규모를 말할 수 있으나 근거 자료가 없음.' },
        { score:4, desc:'공식 통계로 대상 규모를 산출했고 그중 우리가 닿는 범위를 구분함.' },
        { score:5, desc:'대상·규모·접근 경로를 수치로 관리하며 실제 수혜 인원을 매년 집계함.' },
      ],
      ai_trigger: { threshold:2, warning:'beneficiary_vague' },
    },
    'v1_4': {
      label: '기존 접근과의 차별',
      question: '문제를 푸는 방식이 기존 접근과 어떻게 다른지 설명할 수 있는가?',
      scale: [
        { score:1, desc:'기존에 어떤 방식이 있는지 조사해 본 적이 없음.' },
        { score:2, desc:'기존 방식은 알지만 우리가 무엇이 다른지는 정리되어 있지 않음.' },
        { score:3, desc:'차별점을 말로는 설명하나 제안서·IR 자료에는 담겨 있지 않음.' },
        { score:4, desc:'기존 방식의 한계와 우리 방식의 차이를 문서로 정리해 두었음.' },
        { score:5, desc:'차별점을 실제 결과(비용·도달률·재이용률 등)로 비교해 제시할 수 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'approach_undifferentiated' },
    },
    'v1_5': {
      label: '외부 파트너십',
      question: '사회적 가치 실현을 위한 외부 파트너십(MOU·협력관계)이 있는가?',
      scale: [
        { score:1, desc:'외부 기관·단체와의 협력 관계가 전혀 없음.' },
        { score:2, desc:'인적 네트워크는 있으나 문서화된 협약은 없음.' },
        { score:3, desc:'MOU를 1건 체결했으나 실제 협업으로 이어지지는 않았음.' },
        { score:4, desc:'2곳 이상과 협약을 맺고 실제 사업에서 함께 일한 이력이 있음.' },
        { score:5, desc:'협력 기관과 정기적으로 사업을 진행하며 협약서·결과 보고가 축적되어 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'no_partnership' },
    },

    /* ===================== V2 임팩트 측정·검증 ===================== */
    'v2_1': {
      label: '정량 지표 측정',
      question: '사회적 성과를 숫자로 측정하고 있는가?',
      scale: [
        { score:1, desc:'성과를 숫자로 재본 적이 없고 사례 이야기로만 설명함.' },
        { score:2, desc:'수혜 인원 정도만 세고 있으며 그 외 지표는 없음.' },
        { score:3, desc:'지표를 몇 개 정했으나 집계가 불규칙해 연도 간 비교가 어려움.' },
        { score:4, desc:'핵심 지표 3개 이상을 정해 정기적으로 집계하고 있음.' },
        { score:5, desc:'지표별 목표치를 세우고 달성도를 분기마다 점검해 사업 조정에 반영함.' },
      ],
      ai_trigger: { threshold:2, warning:'impact_unmeasured' },
    },
    'v2_2': {
      label: '외부 공개·검증',
      question: '측정 결과를 외부에 공개하거나 제3자에게 검증받은 적이 있는가?',
      scale: [
        { score:1, desc:'외부에 성과를 공개한 적이 없음.' },
        { score:2, desc:'홈페이지·SNS에 간헐적으로 소개하는 정도임.' },
        { score:3, desc:'연 1회 정도 성과를 정리해 공개하나 제3자 검증은 받지 않았음.' },
        { score:4, desc:'성과 보고서를 정기 발간하며 투자자·지원기관에 제출한 이력이 있음.' },
        { score:5, desc:'외부 기관의 검증·평가를 받은 이력이 있고 그 결과를 공개하고 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'impact_unverified' },
    },
    'v2_3': {
      label: '수혜자 피드백 루프',
      question: '수혜자 피드백을 수집해 서비스에 반영하는 절차가 있는가?',
      scale: [
        { score:1, desc:'수혜자 의견을 따로 듣는 자리가 없음.' },
        { score:2, desc:'현장에서 구두로 듣지만 기록하거나 정리하지 않음.' },
        { score:3, desc:'설문 등으로 수집하나 결과가 서비스 변경으로 이어진 사례는 드묾.' },
        { score:4, desc:'정기적으로 수집하고 개선 항목을 정해 반영한 이력이 있음.' },
        { score:5, desc:'수집→개선→재측정이 주기로 돌아가며 개선 전후 지표를 비교함.' },
      ],
      ai_trigger: { threshold:2, warning:'no_feedback_loop' },
    },
    'v2_4': {
      label: '임팩트-매출 동반 구조',
      question: '사업 규모가 커지면 사회적 임팩트도 함께 커지는 구조인가?',
      scale: [
        { score:1, desc:'매출과 임팩트가 별개이며 임팩트는 별도 봉사·기부로 만들어짐.' },
        { score:2, desc:'연결은 있으나 매출이 늘어도 임팩트는 그대로인 구조임.' },
        { score:3, desc:'구조상 연결되어 있으나 실제로 함께 늘었는지 확인한 적이 없음.' },
        { score:4, desc:'매출 증가와 임팩트 증가가 함께 나타난 것을 수치로 확인했음.' },
        { score:5, desc:'제품·서비스를 팔수록 임팩트가 비례해 커지는 구조이며 그 비율을 관리함.' },
      ],
      ai_trigger: { threshold:2, warning:'impact_decoupled' },
    },
    'v2_5': {
      label: '측정 프레임워크 적용',
      question: '임팩트 측정 프레임워크(IMP·SROI 등)를 적용해 본 적이 있는가?',
      scale: [
        { score:1, desc:'그런 프레임워크가 있다는 것을 처음 들음.' },
        { score:2, desc:'이름은 알지만 적용해 본 적은 없음.' },
        { score:3, desc:'외부 도움으로 1회 시도했으나 이후 이어지지 않았음.' },
        { score:4, desc:'하나의 프레임워크를 골라 자체적으로 측정해 본 이력이 있음.' },
        { score:5, desc:'프레임워크를 정기 적용하며 결과를 IR 자료와 성과 보고에 활용함.' },
      ],
      ai_trigger: { threshold:2, warning:'no_impact_framework' },
    },

    /* ===================== V3 기술·아이디어 혁신성 ===================== */
    'v3_1': {
      label: '기술·아이디어 차별성',
      question: '핵심 기술 또는 아이디어의 차별성을 설명할 수 있는가?',
      scale: [
        { score:1, desc:'남들과 다른 점을 딱히 설명하기 어려움.' },
        { score:2, desc:'차별점이 있다고 생각하나 말로 정리되지 않음.' },
        { score:3, desc:'구두로는 설명하나 문서·자료로 정리되어 있지 않음.' },
        { score:4, desc:'기술 개요서·소개 자료에 차별성이 정리되어 있음.' },
        { score:5, desc:'차별성을 구현 방식·성능 수치까지 포함해 제3자가 이해하도록 문서화했음.' },
      ],
      ai_trigger: { threshold:2, warning:'tech_undefined' },
    },
    'v3_2': {
      label: '지식재산권 보유·출원',
      question: '특허·실용신안·상표 등 지식재산권을 보유하거나 출원했는가?',
      scale: [
        { score:1, desc:'출원한 것이 없고 검토해 본 적도 없음.' },
        { score:2, desc:'필요성은 느끼나 비용·절차 때문에 미루고 있음.' },
        { score:3, desc:'상표 정도만 등록했고 기술 관련 권리는 없음.' },
        { score:4, desc:'특허 또는 실용신안을 1건 이상 출원했음.' },
        { score:5, desc:'등록된 권리를 보유하고 있으며 사업과의 연결을 설명할 수 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'no_ip' },
    },
    'v3_3': {
      label: '개발 이력·로드맵 문서화',
      question: '기술 개발 이력과 향후 로드맵이 문서로 남아 있는가?',
      scale: [
        { score:1, desc:'개발 기록을 따로 남기지 않음.' },
        { score:2, desc:'개인 메모 수준으로만 남아 있어 외부에 제시하기 어려움.' },
        { score:3, desc:'지난 개발 이력은 정리되어 있으나 앞으로의 계획은 없음.' },
        { score:4, desc:'개발 이력과 향후 1년 로드맵이 문서로 정리되어 있음.' },
        { score:5, desc:'단계별 목표·일정·필요 자원이 로드맵에 명시되어 있고 주기적으로 갱신함.' },
      ],
      ai_trigger: { threshold:2, warning:'no_rnd_record' },
    },
    'v3_4': {
      label: '경쟁 기술 대비 우위',
      question: '경쟁 기술과 비교한 우위를 데이터로 제시할 수 있는가?',
      scale: [
        { score:1, desc:'경쟁 기술을 조사해 본 적이 없음.' },
        { score:2, desc:'경쟁 상대는 알지만 비교해 본 적은 없음.' },
        { score:3, desc:'주관적으로 낫다고 판단할 뿐 근거 데이터가 없음.' },
        { score:4, desc:'주요 항목에서 비교표를 만들어 두었음.' },
        { score:5, desc:'시험 성적서·실증 데이터 등 객관적 자료로 우위를 제시할 수 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'no_tech_benchmark' },
    },
    'v3_5': {
      label: '기술과 사회문제의 연결',
      question: '보유 기술이 사회문제 해결에 어떻게 기여하는지 직접 연결해 설명할 수 있는가? — 소셜벤처 판별은 사회성과 혁신성 두 축의 연결을 핵심으로 봅니다.',
      scale: [
        { score:1, desc:'기술과 사회적 목적을 따로 설명하며 둘의 연결을 말한 적이 없음.' },
        { score:2, desc:'연결이 있다고 보나 설명하면 "결국 좋은 일" 수준에 머무름.' },
        { score:3, desc:'연결을 설명하나 기술이 없어도 같은 결과가 나올 수 있어 설득력이 약함.' },
        { score:4, desc:'기술이 문제 해결의 어느 지점을 어떻게 바꾸는지 구체적으로 설명함.' },
        { score:5, desc:'기술 적용 전후의 문제 해결 성과 차이를 수치로 제시할 수 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'tech_social_gap' },
    },

    /* ===================== V4 사업 성장성·시장 ===================== */
    'v4_1': {
      label: '목표 시장 규모 산출',
      question: '목표 시장 규모(전체 시장·유효 시장·수익 시장)를 산출해 본 적이 있는가?',
      scale: [
        { score:1, desc:'시장 규모를 계산해 본 적이 없음.' },
        { score:2, desc:'"크다"는 인상만 있고 숫자는 없음.' },
        { score:3, desc:'전체 시장 규모만 인용했고 우리가 닿는 범위는 구분하지 않았음.' },
        { score:4, desc:'전체·유효·수익 시장을 구분해 산출했고 근거 자료를 명시했음.' },
        { score:5, desc:'산출 결과를 IR 자료에 반영하고 가정이 바뀌면 갱신하고 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'no_market_sizing' },
    },
    'v4_2': {
      label: '성장 지표 추적',
      question: '최근 매출 또는 사용자 증가율을 추적하고 있는가?',
      scale: [
        { score:1, desc:'매출·사용자 추이를 따로 기록하지 않음.' },
        { score:2, desc:'연 단위 결산 때만 확인하며 월별 흐름은 모름.' },
        { score:3, desc:'월별로 기록하나 증가율을 계산하거나 원인을 분석하지는 않음.' },
        { score:4, desc:'월별 증가율을 계산하고 변동 원인을 확인하고 있음.' },
        { score:5, desc:'핵심 성장 지표를 정해 목표 대비로 관리하며 IR 자료에 그대로 쓸 수 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'no_growth_tracking' },
    },
    'v4_3': {
      label: '수익 모델 검증',
      question: '수익 모델이 명확하고 실제 매출로 검증되었는가?',
      scale: [
        { score:1, desc:'무엇으로 돈을 벌지 아직 정하지 못했음.' },
        { score:2, desc:'계획은 있으나 그 방식으로 매출이 발생한 적은 없음.' },
        { score:3, desc:'매출은 나오나 지원금·용역 등 일회성 비중이 높음.' },
        { score:4, desc:'주력 수익 모델에서 반복적으로 매출이 발생하고 있음.' },
        { score:5, desc:'단가·원가·재구매 흐름을 파악하고 있으며 확장 시 수익성도 검증했음.' },
      ],
      ai_trigger: { threshold:2, warning:'revenue_unproven' },
    },
    'v4_4': {
      label: '확장 계획의 구체성',
      question: '타 지역·타 분야·해외 등 확장 계획이 구체적인가?',
      scale: [
        { score:1, desc:'확장은 생각해 본 적이 없음.' },
        { score:2, desc:'막연히 넓히고 싶다는 정도이며 대상이 정해지지 않았음.' },
        { score:3, desc:'확장 대상은 정했으나 필요한 자원·일정이 계산되지 않았음.' },
        { score:4, desc:'대상·일정·필요 자원을 정리한 확장 계획이 문서로 있음.' },
        { score:5, desc:'1개 이상 확장을 실행해 결과를 확인했고 다음 단계에 반영하고 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'no_scale_plan' },
    },
    'v4_5': {
      label: '경쟁 포지션 설명력',
      question: '경쟁사 대비 우리의 위치를 설명할 수 있는가?',
      scale: [
        { score:1, desc:'경쟁사를 특정하지 못함.' },
        { score:2, desc:'경쟁사는 알지만 우리와의 차이는 정리되지 않음.' },
        { score:3, desc:'차이를 말로 설명하나 자료로 정리되어 있지 않음.' },
        { score:4, desc:'주요 경쟁사와 비교한 포지션 자료를 갖추고 있음.' },
        { score:5, desc:'가격·성능·고객군 축으로 위치를 정리하고 IR 자료에 담고 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'no_competitive_position' },
    },

    /* ===================== V5 투자유치·자금조달 ===================== */
    'v5_1': {
      label: '투자 유치 이력',
      question: '엔젤·임팩트투자·벤처캐피털 등으로부터 투자를 받은 이력이 있는가?',
      scale: [
        { score:1, desc:'투자 유치를 시도한 적이 없음.' },
        { score:2, desc:'문의해 본 적은 있으나 실제 논의로 이어지지 않았음.' },
        { score:3, desc:'투자 심사를 받아본 적이 있으나 유치에는 이르지 못했음.' },
        { score:4, desc:'엔젤 또는 초기 투자를 유치한 이력이 있음.' },
        { score:5, desc:'기관 투자를 유치했고 후속 투자 논의가 진행되고 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'no_investment' },
    },
    'v5_2': {
      label: 'IR 자료 보유',
      question: '사업계획서·피치덱 등 투자자에게 보여줄 자료를 갖추고 있는가?',
      scale: [
        { score:1, desc:'별도 자료가 없어 요청받으면 그때 만들어야 함.' },
        { score:2, desc:'예전에 만든 자료가 있으나 내용이 오래되어 쓸 수 없음.' },
        { score:3, desc:'사업계획서는 있으나 투자자용으로 구성되어 있지 않음.' },
        { score:4, desc:'문제·해결·시장·팀·재무를 담은 피치덱을 갖추고 있음.' },
        { score:5, desc:'최신 지표로 갱신되며 심사 피드백을 반영해 개선하고 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'no_ir_deck' },
    },
    'v5_3': {
      label: '기술보증·신용보증 검토',
      question: '기술보증기금·신용보증기금 보증을 검토하거나 이용한 적이 있는가?',
      scale: [
        { score:1, desc:'그런 제도가 있는지 몰랐음.' },
        { score:2, desc:'들어봤으나 우리와 관련 있는지 확인해 본 적이 없음.' },
        { score:3, desc:'상담을 받아본 적이 있으나 신청까지 가지 않았음.' },
        { score:4, desc:'보증을 신청했거나 이용 중임.' },
        { score:5, desc:'보증을 이용하며 기술평가 등급 등 심사 결과를 사업에 활용하고 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'no_guarantee_review' },
    },
    'v5_4': {
      label: '정부 프로그램 참여 이력',
      question: 'TIPS·창업지원사업 등 정부 프로그램에 참여한 이력이 있는가?',
      scale: [
        { score:1, desc:'정부 지원 프로그램에 지원해 본 적이 없음.' },
        { score:2, desc:'공고를 본 적은 있으나 요건을 확인하지 않았음.' },
        { score:3, desc:'지원했으나 선정되지 않았음.' },
        { score:4, desc:'1개 이상 프로그램에 선정되어 수행한 이력이 있음.' },
        { score:5, desc:'여러 프로그램을 단계적으로 활용했고 수행 실적이 다음 신청의 근거가 되고 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'no_gov_program' },
    },
    'v5_5': {
      label: '12개월 자금 계획',
      question: '앞으로 12개월간 필요한 자금과 조달 방법을 계획해 두었는가?',
      scale: [
        { score:1, desc:'자금 계획을 세워본 적이 없고 통장 잔액으로 판단함.' },
        { score:2, desc:'대략 언제쯤 부족해질지는 짐작하나 계산해 보지는 않았음.' },
        { score:3, desc:'월별 소요는 계산했으나 조달 방법이 정해지지 않았음.' },
        { score:4, desc:'소요와 조달 방법을 함께 정리한 계획이 있음.' },
        { score:5, desc:'시나리오별로 계획을 세우고 매월 실제와 대조해 갱신하고 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'no_runway_plan' },
    },

    /* ===================== V6 팀·R&D 역량 ===================== */
    'v6_1': {
      label: '대표자 전문성 연결',
      question: '대표자의 해당 분야 경력·전문성이 지금 하는 사업과 연결되는가?',
      scale: [
        { score:1, desc:'해당 분야 경력이 없고 관련 학습 이력도 없음.' },
        { score:2, desc:'관심에서 시작했으며 관련 경력은 짧음.' },
        { score:3, desc:'관련 경력은 있으나 증빙 자료로 정리되어 있지 않음.' },
        { score:4, desc:'해당 분야 경력·자격이 있고 이력서·경력증명으로 증빙 가능함.' },
        { score:5, desc:'전문성이 사업의 핵심 경쟁력이며 논문·특허·수상 등으로 뒷받침됨.' },
      ],
      ai_trigger: { threshold:2, warning:'ceo_expertise_gap' },
    },
    'v6_2': {
      label: '핵심 인력 기술 역량',
      question: '핵심 인력의 기술 역량이 확보되어 있는가?',
      scale: [
        { score:1, desc:'기술 인력이 없으며 전량 외주에 의존함.' },
        { score:2, desc:'외주 위주이며 내부에 기술을 이해하는 사람이 없음.' },
        { score:3, desc:'기술 인력이 1명 있으나 그 사람이 빠지면 개발이 멈춤.' },
        { score:4, desc:'2명 이상이 핵심 기술을 다룰 수 있어 업무 이관이 가능함.' },
        { score:5, desc:'역할별 기술 인력이 확보되어 있고 내부 지식 공유 체계가 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'tech_team_thin' },
    },
    'v6_3': {
      label: '연구개발 조직',
      question: '기업부설연구소 또는 연구개발전담부서를 보유했거나 설립을 검토 중인가?',
      scale: [
        { score:1, desc:'그런 제도가 있는지 몰랐음.' },
        { score:2, desc:'들어봤으나 요건을 확인해 본 적이 없음.' },
        { score:3, desc:'요건을 확인했고 설립을 검토 중임.' },
        { score:4, desc:'연구개발전담부서를 인정받았음.' },
        { score:5, desc:'기업부설연구소를 인정받아 운영 중이며 연구 실적이 축적되고 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'no_rnd_org' },
    },
    'v6_4': {
      label: '채용·유지 계획',
      question: '앞으로 필요한 인력의 채용과 유지 계획이 있는가?',
      scale: [
        { score:1, desc:'필요할 때 급하게 구하는 방식이며 계획이 없음.' },
        { score:2, desc:'필요 직무는 알지만 시기·예산이 정해지지 않았음.' },
        { score:3, desc:'채용 계획은 있으나 유지·성장에 대한 고려는 없음.' },
        { score:4, desc:'채용 시기·예산과 함께 교육·처우 계획이 정리되어 있음.' },
        { score:5, desc:'채용·온보딩·성장 경로가 체계화되어 있고 이직률을 관리하고 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'no_hiring_plan' },
    },
    'v6_5': {
      label: '의사결정·역할 분담',
      question: '조직 내 의사결정 방식과 역할 분담이 명확한가?',
      scale: [
        { score:1, desc:'모든 결정을 대표가 하며 역할 구분이 없음.' },
        { score:2, desc:'역할은 나뉘어 있으나 결정은 사실상 대표 혼자 함.' },
        { score:3, desc:'역할과 결정 권한이 어느 정도 나뉘었으나 문서화되어 있지 않음.' },
        { score:4, desc:'역할과 결정 권한이 문서로 정리되어 있고 회의록이 남음.' },
        { score:5, desc:'대표가 자리를 비워도 정해진 절차로 결정이 이루어지며 기록이 축적됨.' },
      ],
      ai_trigger: { threshold:2, warning:'ceo_dependency' },
    },

    /* ===================== V7 판별·제도 활용 =====================
       ⚠ 소셜벤처 판별은 지속 자격이 아니다. 만료·갱신 경고를 넣지 않는다.
          "판별 신청 전 갖춰야 할 것"과 활용도에 집중한다 */
    'v7_1': {
      label: '판별·자가진단 이력',
      question: '소셜벤처 판별을 받았거나 자가진단을 해 본 적이 있는가?',
      scale: [
        { score:1, desc:'소셜벤처 판별 제도를 알지 못함.' },
        { score:2, desc:'제도는 들어봤으나 요건을 확인해 본 적이 없음.' },
        { score:3, desc:'자가진단을 해봤으나 결과를 사업에 반영하지는 않았음.' },
        { score:4, desc:'판별을 신청했거나 판별받은 이력이 있음.' },
        { score:5, desc:'판별 결과를 지원사업·투자 유치 자료에 활용하고 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'no_sv_screening' },
    },
    'v7_2': {
      label: '기타 인증 보유·검토',
      question: '벤처기업·이노비즈 등 다른 인증을 보유했거나 검토하고 있는가?',
      scale: [
        { score:1, desc:'인증 제도를 검토해 본 적이 없음.' },
        { score:2, desc:'이름은 알지만 요건을 확인하지 않았음.' },
        { score:3, desc:'요건을 확인했고 준비 중임.' },
        { score:4, desc:'1개 인증을 보유하고 있음.' },
        { score:5, desc:'2개 이상 보유하며 각 인증의 혜택을 실제로 활용하고 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'no_other_cert' },
    },
    'v7_3': {
      label: '소셜벤처 지원사업 신청 이력',
      question: '소셜벤처를 대상으로 하는 지원사업에 신청한 이력이 있는가?',
      scale: [
        { score:1, desc:'그런 지원사업이 있는지 몰랐음.' },
        { score:2, desc:'공고를 본 적은 있으나 신청하지 않았음.' },
        { score:3, desc:'신청했으나 선정되지 않았음.' },
        { score:4, desc:'1건 이상 선정되어 지원을 받은 이력이 있음.' },
        { score:5, desc:'정기적으로 공고를 확인하며 단계에 맞는 사업을 골라 신청하고 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'no_sv_program' },
    },
    'v7_4': {
      label: '중간지원조직 연결',
      question: '소셜벤처스퀘어 등 중간지원조직과 연결되어 있는가?',
      scale: [
        { score:1, desc:'중간지원조직이 무엇인지 모름.' },
        { score:2, desc:'존재는 알지만 방문하거나 상담한 적이 없음.' },
        { score:3, desc:'한 번 상담을 받아본 정도임.' },
        { score:4, desc:'정기적으로 정보를 받고 프로그램에 참여한 적이 있음.' },
        { score:5, desc:'담당자와 지속 관계가 있고 컨설팅·네트워킹을 사업에 활용하고 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'no_intermediary' },
    },
    'v7_5': {
      label: '증빙자료 정리 상태',
      question: '판별 신청에 필요한 증빙자료(정관·특허·투자·MOU 등)를 정리해 두었는가?',
      scale: [
        { score:1, desc:'어떤 자료가 필요한지 모르며 정리된 것이 없음.' },
        { score:2, desc:'자료는 있으나 여기저기 흩어져 있어 모으는 데 시간이 걸림.' },
        { score:3, desc:'일부는 정리되어 있으나 빠진 항목이 무엇인지 파악되지 않음.' },
        { score:4, desc:'필요 목록을 만들어 대부분 갖춰 두었음.' },
        { score:5, desc:'항목별로 정리·보관되어 있고 갱신이 필요한 자료를 주기적으로 확인함.' },
      ],
      ai_trigger: { threshold:2, warning:'evidence_unprepared' },
    },

    /* ===================== V8 디지털·AX ===================== */
    'v8_1': {
      label: '업무·고객 데이터 축적',
      question: '업무와 고객 데이터가 디지털로 축적되고 있는가?',
      scale: [
        { score:1, desc:'수기 장부·개인 메모 위주이며 데이터가 남지 않음.' },
        { score:2, desc:'엑셀 파일이 있으나 담당자 개인 PC에 흩어져 있음.' },
        { score:3, desc:'공유 문서로 관리하나 항목이 통일되지 않아 집계가 어려움.' },
        { score:4, desc:'정해진 형식으로 한곳에 축적되어 필요할 때 집계할 수 있음.' },
        { score:5, desc:'시스템에 자동 축적되며 지표를 바로 뽑아 볼 수 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'no_data_base' },
    },
    'v8_2': {
      label: '데이터의 서비스 활용',
      question: '축적한 데이터를 제품·서비스 개선에 활용하고 있는가?',
      scale: [
        { score:1, desc:'데이터를 모으기만 하고 들여다본 적이 없음.' },
        { score:2, desc:'보고용으로만 쓰고 서비스 개선에 쓰지는 않음.' },
        { score:3, desc:'가끔 확인하나 개선으로 이어진 사례는 드묾.' },
        { score:4, desc:'데이터를 근거로 서비스를 바꾼 사례가 여러 건 있음.' },
        { score:5, desc:'데이터가 제품 기능의 일부로 쓰이며 개선 주기가 정해져 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'data_unused' },
    },
    'v8_3': {
      label: 'AI 도구 실무 활용',
      question: 'AI 도구를 실무에 활용하고 있는가?',
      scale: [
        { score:1, desc:'생성형 AI 도구를 업무에 써본 적이 전혀 없음.' },
        { score:2, desc:'개인적으로 몇 번 써본 정도이며 업무에는 쓰지 않음.' },
        { score:3, desc:'문서 작성 등 일부 업무에 간헐적으로 활용함.' },
        { score:4, desc:'정해진 업무에 정기적으로 활용해 시간이 줄어든 것을 체감함.' },
        { score:5, desc:'업무 절차에 포함되어 있고 구성원이 함께 쓰는 사용법이 정리되어 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'no_ai_usage' },
    },
    'v8_4': {
      label: '개발·운영 프로세스',
      question: '개발과 운영 절차가 체계화되어 있는가?',
      scale: [
        { score:1, desc:'그때그때 처리하며 정해진 절차가 없음.' },
        { score:2, desc:'담당자 머릿속에만 있어 사람이 바뀌면 이어지지 않음.' },
        { score:3, desc:'대략적 절차는 있으나 문서로 정리되어 있지 않음.' },
        { score:4, desc:'절차가 문서화되어 있고 기록이 남음.' },
        { score:5, desc:'버전 관리·배포·장애 대응 절차가 정착되어 있고 개선되고 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'no_dev_process' },
    },
    'v8_5': {
      label: '디지털 역량 교육·투자',
      question: '구성원의 디지털 역량 강화를 위한 교육이나 투자가 있는가?',
      scale: [
        { score:1, desc:'교육이나 도구 투자에 예산을 쓴 적이 없음.' },
        { score:2, desc:'필요는 느끼나 시간·비용 때문에 미루고 있음.' },
        { score:3, desc:'무료 교육을 간헐적으로 활용하는 정도임.' },
        { score:4, desc:'연간 교육·도구 예산을 정해 집행하고 있음.' },
        { score:5, desc:'역량 수준을 파악해 필요한 교육을 배정하며 효과를 확인하고 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'no_digital_invest' },
    },
  };

  const KEY_PREFIX = 'diag-venture-container_';

  /* ── 점수 계산 — DiagSocial/DiagMicro와 동일 스키마 ─────────── */
  function calcScores(scores) {
    const src = scores || {};
    const domainScores = {};
    DOMAINS.forEach(domain => {
      const keys = Object.keys(ITEMS).filter(k => k.indexOf(domain.id + '_') === 0);
      const vals = keys
        .map(k => src[KEY_PREFIX + k])
        .filter(v => v !== undefined && v !== null && v !== '');
      const avg = vals.length > 0 ? vals.reduce((a, b) => a + Number(b), 0) / vals.length : 0;
      domainScores[domain.key] = {
        label: domain.label,
        avg: Math.round(avg * 10) / 10,
        pct: Math.round((avg / 5) * 100),
        weight: domain.weight,
      };
    });
    const totalPct = DOMAINS.reduce((sum, d) => sum + (domainScores[d.key].pct * d.weight), 0);
    return { domains: domainScores, total: Math.round(totalPct) };
  }

  /* ── 교차 경고 — 소셜벤처 고유 위험 조합 ───────────────────────
     ⚠ 판별표 점수를 예측하지 않는다. "판별 신청 전 갖춰야 할 것"을 짚는다 */
  function detectCrossWarnings(scores) {
    const src = scores || {};
    const get = key => Number(src[KEY_PREFIX + key] || 0);
    const w = [];

    if (get('v1_1') <= 2 && get('v7_1') <= 2)
      w.push({ level:'HIGH', code:'articles_not_ready', msg:'정관에 사회적 목적이 명시되지 않았고 판별 준비도 되어 있지 않습니다. 정관의 사회문제 명시는 판별에서 배점이 큰 항목이며, 정관 변경은 총회 의결과 등기 절차가 필요해 시간이 걸립니다. 신청 일정을 잡기 전에 먼저 착수하십시오.' });

    if (get('v3_5') <= 2 && get('v3_1') >= 4)
      w.push({ level:'HIGH', code:'tech_social_disconnect', msg:'기술 차별성은 갖추었으나 그 기술이 사회문제 해결에 어떻게 기여하는지 설명하지 못하고 있습니다. 소셜벤처 판별은 사회성과 혁신성 두 축의 연결을 핵심으로 봅니다. 기술 적용 전후로 무엇이 달라지는지부터 정리하십시오.' });

    if (get('v5_5') <= 2 && get('v4_2') <= 2)
      w.push({ level:'CRITICAL', code:'runway_blind', msg:'성장 지표도 자금 계획도 없는 상태입니다. 언제 자금이 바닥나는지 알 수 없어 대응할 시간을 확보할 수 없습니다. 월별 매출·지출 기록과 12개월 소요 계산을 최우선으로 시작하십시오.' });

    if (get('v2_1') <= 2 && get('v2_4') <= 2)
      w.push({ level:'CRITICAL', code:'impact_unprovable', msg:'사회적 성과를 측정하지 않으며 사업이 커져도 임팩트가 함께 커지는 구조인지 확인되지 않았습니다. 판별·투자 심사 모두에서 사회성을 증빙할 수단이 없습니다.' });

    if (get('v4_3') <= 2 && get('v5_1') <= 2)
      w.push({ level:'HIGH', code:'unproven_and_unfunded', msg:'수익 모델이 검증되지 않았고 투자 이력도 없습니다. 외부 자금 없이 자체 매출로 버텨야 하는 상태이므로, 작은 규모라도 반복 매출이 나오는 경로를 먼저 만드십시오.' });

    if (get('v3_2') <= 2 && get('v6_3') <= 2)
      w.push({ level:'HIGH', code:'rnd_asset_missing', msg:'지식재산권과 연구개발 조직이 모두 없습니다. 혁신성장성 평가에서 기술 역량을 객관적으로 증빙할 수단이 부족합니다. 출원 검토와 연구개발전담부서 요건 확인을 병행하십시오.' });

    if (get('v6_5') <= 2 && get('v6_2') <= 2)
      w.push({ level:'HIGH', code:'team_single_point', msg:'대표에게 결정이 몰려 있고 기술 인력도 얇습니다. 핵심 인력 1명이 빠지면 개발과 의사결정이 동시에 멈춥니다. 역할 분담 문서화와 기술 지식 공유부터 시작하십시오.' });

    if (get('v7_5') <= 2 && get('v7_3') <= 2)
      w.push({ level:'MEDIUM', code:'application_unready', msg:'증빙자료가 정리되지 않았고 지원사업 신청 이력도 없습니다. 공고는 대개 준비 기간이 짧으므로 정관·특허·투자·협약 자료를 미리 한곳에 모아 두십시오.' });

    if (get('v4_1') <= 2 && get('v5_2') <= 2)
      w.push({ level:'MEDIUM', code:'ir_not_ready', msg:'시장 규모를 산출한 적이 없고 투자자용 자료도 없습니다. 투자 논의가 시작되면 가장 먼저 요구되는 항목이므로 미리 준비해 두는 편이 낫습니다.' });

    if (get('v1_3') <= 2 && get('v2_1') <= 2)
      w.push({ level:'MEDIUM', code:'target_unmeasured', msg:'수혜 대상을 특정하지 않았고 성과 측정도 없습니다. 누구의 무엇이 얼마나 나아졌는지 말할 수 없으면 사회성 항목 전반이 약해집니다.' });

    if (get('v5_3') <= 2 && get('v5_4') <= 2)
      w.push({ level:'MEDIUM', code:'public_finance_unused', msg:'기술보증·정부 프로그램을 모두 활용하지 않고 있습니다. 소셜벤처는 이 트랙에서 우대를 받는 경우가 많으므로 자격 여부부터 확인해 보십시오.' });

    if (get('v8_1') <= 2 && get('v8_3') <= 2)
      w.push({ level:'MEDIUM', code:'digital_base_missing', msg:'업무 데이터가 축적되지 않은 상태에서 AI 활용도 없습니다. 데이터 정리가 먼저이고 도구 도입은 그다음입니다.' });

    if (get('v1_4') <= 2 && get('v4_5') <= 2)
      w.push({ level:'MEDIUM', code:'no_differentiation_story', msg:'기존 접근과의 차별점도 경쟁 포지션도 정리되어 있지 않습니다. 심사에서 "왜 이 팀이어야 하는가"에 답하기 어렵습니다.' });

    return w;
  }

  function buildPromptSummary(scores) {
    const result = calcScores(scores);
    const warnings = detectCrossWarnings(scores);
    const src = scores || {};

    const domainLines = DOMAINS.map(d => {
      const ds = result.domains[d.key];
      const level = ds.pct >= 80 ? '우수' : ds.pct >= 60 ? '보통' : ds.pct >= 40 ? '취약' : '위험';
      return `  - ${ds.label}: ${ds.pct}점 (${level})`;
    }).join('\n');

    const warnLines = warnings.length > 0
      ? warnings.map(x => `  ⚠ [${x.level}] ${x.msg}`).join('\n')
      : '  - 복합 경고 없음';

    const criticalItems = [];
    Object.keys(ITEMS).forEach(key => {
      const val = Number(src[KEY_PREFIX + key] || 0);
      const th = (ITEMS[key].ai_trigger && ITEMS[key].ai_trigger.threshold) || 2;
      if (val > 0 && val <= th) criticalItems.push(`${ITEMS[key].label}(${val}점)`);
    });

    return `[소셜벤처 전용 진단 결과 — V1~V8 8영역 40문항]
종합 점수: ${result.total}점 / 100점

[영역별 점수]
${domainLines}

[복합 경고 신호]
${warnLines}

[즉각 처방 필요 항목 (2점 이하)]
${criticalItems.length ? '  ' + criticalItems.join(', ') : '  - 없음'}

[해석 지침]
- 이 점수는 8영역 균등 배점(각 12.5%)으로 산출한 준비도 지표다.
- ⚠ 기술보증기금 소셜벤처 판별표의 예상 점수(사회성 70점 / 혁신성장성 70점)를 추정하지 마라.
  BizNavi는 판별 점수를 예측하는 도구가 아니라 준비도를 진단하는 도구다.
  실제 판별 결과와 달라지면 신뢰 문제가 생긴다.
- ⚠ 판별표 배점에 맞춰 영역을 재가중하지 마라.
- 소셜벤처는 특별법상 지속 자격이 없다. 인증 만료·갱신을 전제로 조언하지 마라.
  판별은 지원사업 신청 기준이므로 "신청 전에 갖춰야 할 것" 관점으로 조언하라.
- 소셜벤처는 상법상 영리법인이며 공공조달이 아니라 투자·기술보증 트랙을 탄다.
  공공 용역 수주를 전제한 조언을 하지 마라.`;
  }

  function getSchema() {
    return { id: 'venture', label: '소셜벤처 전용 진단', version: '1.0', domains: DOMAINS, items: ITEMS };
  }

  return { getSchema, calcScores, detectCrossWarnings, buildPromptSummary, DOMAINS, ITEMS, KEY_PREFIX };

})();

if (typeof window !== 'undefined') window.DiagVenture = DiagVenture;
if (typeof module !== 'undefined') module.exports = DiagVenture;
