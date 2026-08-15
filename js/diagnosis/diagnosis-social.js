/* ================================================================
   BizNavi — diagnosis-social.js
   사회적기업 전용 진단 (orgType='social_enterprise')

   S1~S8 8영역 × 5문항 = 40문항, 5점 BARS.
   근거: 한국사회적기업진흥원 SVI(사회적가치지표) 14개 지표 프레임
        (사회적 성과 / 경제적 성과 / 혁신 성과)

   ⚠ SVI 실제 배점(사회적 60 / 경제적 30 / 혁신 10)을 따르지 않는다.
      BizNavi는 SVI 점수를 예측하는 도구가 아니라 준비도를 진단하는 도구다.
      SVI를 흉내내면 진흥원 실제 결과와 달라 신뢰 문제가 생긴다. → 8영역 균등 배점(0.125)
   ⚠ S3(공공조달·판로)는 SVI에 없는 축이다. 지역기반 사회적기업 매출의 실체이며
      SVI는 가치 창출은 보되 수익 구조는 보지 않기 때문에 별도로 둔다.

   스키마는 diagnosis-micro.js와 동일하다. 점수 키는 'diag-social-container_s1_1' 형식.
   ================================================================ */

const DiagSocial = (() => {

  const DOMAINS = [
    { id:'s1', key:'mission',    label:'미션·사회적 성과',       icon:'🎯', desc:'사회적 미션의 명문화·공유·측정·공개 체계를 진단합니다.',              weight:0.125 },
    { id:'s2', key:'value_biz',  label:'사업의 사회가치 지향성', icon:'🤝', desc:'주력 사업과 사회적 목적의 연결도, 미션 드리프트 위험을 진단합니다.',  weight:0.125 },
    { id:'s3', key:'public_sales', label:'공공조달·판로',        icon:'🏛️', desc:'공공 수주 실적과 의존도, 민간 판로 확보 수준을 진단합니다.',          weight:0.125 },
    { id:'s4', key:'finance',    label:'재정·원가구조',          icon:'💰', desc:'보조금 없는 자립 가능성과 사업별 공헌이익 산출력을 진단합니다.',      weight:0.125 },
    { id:'s5', key:'governance', label:'조직·거버넌스',          icon:'🏢', desc:'민주적 의사결정, 취약계층 고용 유지, 대표 의존도를 진단합니다.',      weight:0.125 },
    { id:'s6', key:'brand',      label:'마케팅·브랜딩·품질',     icon:'📣', desc:'사회적 가치 스토리텔링과 서비스 품질 표준화 수준을 진단합니다.',      weight:0.125 },
    { id:'s7', key:'cert_esg',   label:'인증·제도·ESG',          icon:'📋', desc:'인증 갱신 관리, SVI 측정 이력, 환경·지배구조 대응을 진단합니다.',     weight:0.125 },
    { id:'s8', key:'digital_ax', label:'디지털·AX',              icon:'🤖', desc:'업무 데이터 축적, 협업도구·AI 활용, 온라인 채널 확장력을 진단합니다.', weight:0.125 },
  ];

  const ITEMS = {

    /* ===================== S1 미션·사회적 성과 ===================== */
    's1_1': {
      label: '미션 명문화',
      question: '사회적 미션이 정관·내규에 문장으로 명시되어 있고, 사업 결정 시 그 문장을 근거로 삼는가?',
      scale: [
        { score:1, desc:'정관에 사회적 목적 조항이 없거나 설립 서류의 관용구를 그대로 둔 상태임.' },
        { score:2, desc:'정관에 조항은 있으나 대표 외에는 내용을 모르고 실무에서 인용된 적이 없음.' },
        { score:3, desc:'미션 문장은 정리돼 있으나 내규·사업계획서와 표현이 서로 달라 기준이 흔들림.' },
        { score:4, desc:'정관과 내규의 미션 문장이 일치하고 연간 사업계획 수립 시 근거로 인용함.' },
        { score:5, desc:'미션 문장을 기준으로 신규 사업 채택·중단을 판단하며 그 판단 기록이 남아 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'mission_undefined' },
    },
    's1_2': {
      label: '미션 공유 체계',
      question: '미션을 조직 전체가 공유하는 정기 교육·회의 체계가 운영되는가?',
      scale: [
        { score:1, desc:'입사 시에도 미션을 설명하지 않으며 공유 자리가 전혀 없음.' },
        { score:2, desc:'대표가 필요할 때 구두로 언급하는 정도이며 자료나 일정이 없음.' },
        { score:3, desc:'신규 입사자 오리엔테이션에서만 다루고 기존 구성원 대상 재공유는 없음.' },
        { score:4, desc:'분기 1회 전체회의에서 미션과 사업 연결을 함께 점검함.' },
        { score:5, desc:'월례회의 고정 안건으로 미션 대비 실행을 점검하고 논의 결과를 문서로 남김.' },
      ],
      ai_trigger: { threshold:2, warning:'mission_not_shared' },
    },
    's1_3': {
      label: '사회적 성과 측정',
      question: '사회적 성과(수혜자 수·고용 유지·지역 기여 등)를 정기적으로 측정하고 기록하는가?',
      scale: [
        { score:1, desc:'성과 수치를 세어본 적이 없어 지원사업 신청 때마다 추정치를 새로 만듦.' },
        { score:2, desc:'필요할 때만 과거 자료를 뒤져 수치를 급조하며 산출 기준이 매번 달라짐.' },
        { score:3, desc:'연 1회 결산 시점에만 집계하고 중간 추이는 파악하지 못함.' },
        { score:4, desc:'분기별로 정해진 지표를 집계해 표로 관리함.' },
        { score:5, desc:'월 단위로 지표를 집계하고 목표 대비 미달 시 사업 방식을 조정함.' },
      ],
      ai_trigger: { threshold:2, warning:'impact_unmeasured' },
    },
    's1_4': {
      label: '이해관계자 피드백 루프',
      question: '수혜자·지역사회·구성원의 피드백을 수집해 사업에 반영하는 절차가 있는가?',
      scale: [
        { score:1, desc:'피드백을 받는 통로가 없고 불만이 있어도 조직에 전달되지 않음.' },
        { score:2, desc:'현장에서 구두로 듣기는 하나 기록하지 않아 담당자가 바뀌면 사라짐.' },
        { score:3, desc:'간헐적으로 설문을 돌리지만 결과를 분석하거나 반영하지는 않음.' },
        { score:4, desc:'정기 설문·간담회를 열고 주요 의견을 회의 안건으로 올림.' },
        { score:5, desc:'피드백 수집→분석→개선→결과 회신까지 한 바퀴가 문서로 돌아감.' },
      ],
      ai_trigger: { threshold:2, warning:'no_feedback_loop' },
    },
    's1_5': {
      label: '성과 외부 공개',
      question: '사회적 성과를 외부에 공개(공시·연차 리포트·홈페이지)하는가?',
      scale: [
        { score:1, desc:'외부에 공개한 성과 자료가 전혀 없음.' },
        { score:2, desc:'공모사업 제출용으로만 자료를 만들고 외부에 게시하지 않음.' },
        { score:3, desc:'홈페이지·SNS에 사례를 간헐적으로 올리나 수치와 기간이 빠져 있음.' },
        { score:4, desc:'연 1회 성과 자료를 정리해 홈페이지에 게시함.' },
        { score:5, desc:'연차 리포트를 정해진 시기에 발간하고 지표·산출 기준까지 함께 공개함.' },
      ],
      ai_trigger: { threshold:2, warning:'no_public_report' },
    },

    /* ===================== S2 사업의 사회가치 지향성 ===================== */
    's2_1': {
      label: '주력 사업과 미션의 연결',
      question: '매출 비중이 가장 큰 사업이 사회적 목적과 직접 연결되는가?',
      scale: [
        { score:1, desc:'주력 사업과 사회적 목적이 사실상 무관하며 인증 유지용으로만 미션을 내세움.' },
        { score:2, desc:'연결점을 설명할 수는 있으나 근거가 되는 활동·수치를 제시하지 못함.' },
        { score:3, desc:'일부 사업만 미션과 연결되고 주력 매출원은 일반 상업 활동임.' },
        { score:4, desc:'주력 사업이 미션과 연결되며 그 연결을 수치로 설명할 수 있음.' },
        { score:5, desc:'주력 사업 자체가 사회문제 해결 방식이며 매출 증가가 곧 사회적 성과 증가로 이어짐.' },
      ],
      ai_trigger: { threshold:2, warning:'mission_business_gap' },
    },
    's2_2': {
      label: '미션 드리프트 관리',
      question: '사회적 목적과 무관한 매출의 비중을 파악하고 관리하는가?',
      scale: [
        { score:1, desc:'어떤 매출이 미션과 연결되는지 구분해본 적이 없음.' },
        { score:2, desc:'구분의 필요성은 알지만 회계상 나뉘어 있지 않아 계산할 수 없음.' },
        { score:3, desc:'대략의 비중은 알지만 기준이 모호하고 정기적으로 갱신하지 않음.' },
        { score:4, desc:'사업별로 미션 연계 여부를 분류해 매출 비중을 반기마다 확인함.' },
        { score:5, desc:'미션 무관 매출의 상한 기준을 두고 초과 시 사업 구성을 조정함.' },
      ],
      ai_trigger: { threshold:2, warning:'mission_drift' },
    },
    's2_3': {
      label: '공급망 사회적 기준',
      question: '거래처·공급망 선정에 사회적 기준(사회적경제조직 우선, 지역업체 등)을 적용하는가?',
      scale: [
        { score:1, desc:'가격만 보고 거래처를 정하며 사회적 기준을 고려한 적이 없음.' },
        { score:2, desc:'기준의 필요성은 인지하나 실제 선정에는 반영하지 않음.' },
        { score:3, desc:'담당자 재량으로 일부 거래에만 적용하며 문서화된 기준이 없음.' },
        { score:4, desc:'구매 기준에 사회적 항목을 넣어 일정 규모 이상 거래에 적용함.' },
        { score:5, desc:'사회적 기준을 포함한 구매 규정을 운영하고 연간 실적을 집계·공개함.' },
      ],
      ai_trigger: { threshold:2, warning:'supply_no_criteria' },
    },
    's2_4': {
      label: '이윤의 사회적 재투자',
      question: '이윤을 사회적 목적에 재투자하는 규정과 실제 집행 실적이 있는가?',
      scale: [
        { score:1, desc:'재투자 규정이 없고 잉여가 생겨도 용도를 정하지 않음.' },
        { score:2, desc:'정관에 재투자 조항은 있으나 집행한 적이 없음.' },
        { score:3, desc:'재투자를 하고는 있으나 금액·항목을 따로 집계하지 않음.' },
        { score:4, desc:'연간 재투자 금액과 사용처를 결산 자료에 구분해 기록함.' },
        { score:5, desc:'재투자 비율 목표를 정해 집행하고 그 결과를 외부에 공개함.' },
      ],
      ai_trigger: { threshold:2, warning:'no_reinvestment' },
    },
    's2_5': {
      label: '지역·사회적경제 협업',
      question: '지역사회 또는 타 사회적경제조직과 협업한 실적이 있는가?',
      scale: [
        { score:1, desc:'다른 조직과 협업한 경험이 없고 네트워크에 참여하지 않음.' },
        { score:2, desc:'행사에 참석하는 정도이며 실제 사업으로 이어진 적은 없음.' },
        { score:3, desc:'1~2회 단발성 협업 경험이 있으나 관계가 이어지지 않음.' },
        { score:4, desc:'연 단위로 협업 사업을 진행하며 협력 조직이 고정되어 있음.' },
        { score:5, desc:'공동 수주·공동 브랜드 등 구조적 협업 체계를 운영함.' },
      ],
      ai_trigger: { threshold:2, warning:'isolated_org' },
    },

    /* ===================== S3 공공조달·판로 ===================== */
    's3_1': {
      label: '공공 수주 실적',
      question: '최근 3년간 공공기관 발주 사업을 수주한 실적이 있는가?',
      scale: [
        { score:1, desc:'공공 수주 실적이 전혀 없고 입찰에 참여해본 적도 없음.' },
        { score:2, desc:'입찰에 참여한 적은 있으나 낙찰된 적이 없음.' },
        { score:3, desc:'3년간 1~2건 수주했으나 연속성이 없음.' },
        { score:4, desc:'매년 수주 실적이 있으며 반복 발주 기관이 있음.' },
        { score:5, desc:'복수 기관에서 매년 수주하며 수의계약·우선구매 실적도 함께 보유함.' },
      ],
      ai_trigger: { threshold:2, warning:'no_public_track' },
    },
    's3_2': {
      label: '공공 의존도 관리',
      question: '전체 매출에서 공공 발주가 차지하는 비중을 파악하고 관리하는가?',
      scale: [
        { score:1, desc:'공공·민간 매출을 구분하지 않아 의존도를 모름.' },
        { score:2, desc:'대략 알고는 있으나 수치로 관리하지 않음.' },
        { score:3, desc:'결산 때 비중을 확인하지만 목표치나 상한은 없음.' },
        { score:4, desc:'분기마다 비중을 확인하고 과도할 경우 민간 영업을 늘림.' },
        { score:5, desc:'공공 의존도 상한을 정해 관리하며 예산 삭감 시나리오를 미리 검토함.' },
      ],
      ai_trigger: { threshold:2, warning:'public_dependency' },
    },
    's3_3': {
      label: '조달 채널 등록',
      question: '나라장터·e-store36.5 등 조달 채널에 등록하고 정보를 최신으로 유지하는가?',
      scale: [
        { score:1, desc:'조달 채널에 등록되어 있지 않음.' },
        { score:2, desc:'등록은 했으나 상품·실적 정보가 비어 있거나 수년째 방치 상태임.' },
        { score:3, desc:'등록 정보는 있으나 갱신이 늦어 현재 제공 서비스와 다름.' },
        { score:4, desc:'주요 채널에 등록하고 연 1회 이상 정보를 갱신함.' },
        { score:5, desc:'채널별 등록 정보를 최신으로 유지하고 공고 알림을 상시 모니터링함.' },
      ],
      ai_trigger: { threshold:2, warning:'no_procurement_channel' },
    },
    's3_4': {
      label: '우선구매 자격 활용',
      question: '사회적기업 우선구매 제도의 대상 자격을 파악하고 영업에 활용하는가?',
      scale: [
        { score:1, desc:'우선구매 제도 자체를 모르거나 대상 여부를 확인해본 적이 없음.' },
        { score:2, desc:'제도는 알지만 우리 조직이 어떤 요건에 해당하는지 확인하지 않음.' },
        { score:3, desc:'자격은 확인했으나 영업 자료나 제안서에 반영하지 않음.' },
        { score:4, desc:'제안서·견적서에 우선구매 대상임을 명시해 활용함.' },
        { score:5, desc:'기관별 우선구매 목표 비율을 파악해 담당 부서를 직접 공략함.' },
      ],
      ai_trigger: { threshold:2, warning:'priority_purchase_unused' },
    },
    's3_5': {
      label: '민간·B2C 판로',
      question: '공공 외에 민간 기업·일반 소비자 대상 판로를 확보하고 있는가?',
      scale: [
        { score:1, desc:'민간 매출이 사실상 없고 판로 개척 시도도 없음.' },
        { score:2, desc:'문의가 오면 응대하는 수준이며 능동적 영업은 하지 않음.' },
        { score:3, desc:'소규모 민간 거래가 있으나 지속성이 없고 매출 비중이 미미함.' },
        { score:4, desc:'고정 민간 거래처나 온라인 판매 채널을 운영해 꾸준한 매출이 발생함.' },
        { score:5, desc:'민간 매출이 안정적 비중을 차지하며 공공 예산 변동과 무관하게 유지됨.' },
      ],
      ai_trigger: { threshold:2, warning:'no_private_channel' },
    },

    /* ===================== S4 재정·원가구조 ===================== */
    's4_1': {
      label: '보조금 없는 자립성',
      question: '보조금·인건비 지원 없이도 유지 가능한 자체 수익 구조인가?',
      scale: [
        { score:1, desc:'지원금이 끊기면 즉시 인건비를 지급할 수 없는 구조임.' },
        { score:2, desc:'지원금 의존도가 매우 높으며 자체 매출로는 고정비의 일부만 충당됨.' },
        { score:3, desc:'자체 매출로 고정비는 대략 감당하나 이익은 남지 않음.' },
        { score:4, desc:'지원금 없이도 운영이 가능하며 소폭의 이익이 발생함.' },
        { score:5, desc:'자체 수익만으로 운영·재투자가 가능하고 지원금은 신규 사업에만 활용함.' },
      ],
      ai_trigger: { threshold:2, warning:'subsidy_dependent' },
    },
    's4_2': {
      label: '변동비·고정비 구분',
      question: '매출원가를 변동비와 고정비로 구분해 파악하고 있는가?',
      scale: [
        { score:1, desc:'비용을 통장 출금 내역으로만 보며 변동비·고정비 개념을 사용하지 않음.' },
        { score:2, desc:'구분해야 한다는 것은 알지만 실제로 나눠본 적이 없음.' },
        { score:3, desc:'인건비·임대료 정도만 고정비로 인식하고 나머지는 뭉뚱그림.' },
        { score:4, desc:'계정별로 변동비·고정비를 구분해 월별로 집계함.' },
        { score:5, desc:'구분된 원가 구조를 바탕으로 단가·수주 여부를 판단함.' },
      ],
      ai_trigger: { threshold:2, warning:'cost_unsplit' },
    },
    's4_3': {
      label: '사업별 공헌이익',
      question: '공헌이익(매출 − 변동비)을 사업·서비스별로 산출하는가?',
      scale: [
        { score:1, desc:'사업별 손익을 계산하지 않아 어떤 사업이 남는지 모름.' },
        { score:2, desc:'전체 손익만 보며 개별 사업의 기여도는 감으로 판단함.' },
        { score:3, desc:'연 1회 결산 때만 사업별로 나눠보고 개별 수주 판단에는 쓰지 않음.' },
        { score:4, desc:'사업 종료 시마다 공헌이익을 산출해 기록함.' },
        { score:5, desc:'사업별 공헌이익을 상시 관리하며 낮은 사업은 단가 조정·중단을 결정함.' },
      ],
      ai_trigger: { threshold:2, warning:'no_contribution_margin' },
    },
    's4_4': {
      label: '손익분기점 활용',
      question: '손익분기점(BEP)을 알고 의사결정에 활용하는가?',
      scale: [
        { score:1, desc:'BEP를 계산해본 적이 없어 월 얼마를 팔아야 하는지 모름.' },
        { score:2, desc:'개념은 알지만 우리 조직의 수치를 산출한 적이 없음.' },
        { score:3, desc:'과거에 한 번 계산했으나 원가 구조가 바뀐 뒤 갱신하지 않음.' },
        { score:4, desc:'BEP를 현행 기준으로 산출해 월별 목표 매출로 사용함.' },
        { score:5, desc:'사업별 BEP를 관리하며 신규 사업 검토 시 도달 시점을 먼저 계산함.' },
      ],
      ai_trigger: { threshold:2, warning:'bep_unknown' },
    },
    's4_5': {
      label: '공공 용역 사후 검증',
      question: '공공 용역 종료 후 투입 공수 대비 공헌이익을 검증하는가?',
      scale: [
        { score:1, desc:'용역이 끝나면 정산만 하고 실제로 남았는지 따져보지 않음.' },
        { score:2, desc:'적자였다는 체감은 있으나 투입 공수를 기록하지 않아 확인할 수 없음.' },
        { score:3, desc:'일부 사업만 사후에 점검하며 기준이 담당자마다 다름.' },
        { score:4, desc:'용역 종료 시마다 투입 인시(人時)와 공헌이익을 계산해 기록함.' },
        { score:5, desc:'사후 검증 결과를 다음 입찰의 투찰가 산정에 반영함.' },
      ],
      ai_trigger: { threshold:2, warning:'no_project_review' },
    },

    /* ===================== S5 조직·거버넌스 ===================== */
    's5_1': {
      label: '민주적 의사결정',
      question: '이사회·총회 등 의사결정 구조가 실제로 운영되는가?',
      scale: [
        { score:1, desc:'대표가 단독 결정하며 이사회·총회는 서류상으로만 존재함.' },
        { score:2, desc:'형식적으로 회의를 열지만 안건은 사후 승인용임.' },
        { score:3, desc:'정기 회의를 열고 회의록도 남기나 주요 결정은 회의 밖에서 이뤄짐.' },
        { score:4, desc:'주요 안건을 회의에서 논의·의결하고 회의록을 보관함.' },
        { score:5, desc:'구성원·이해관계자가 참여하는 구조에서 예산·사업을 의결하고 결과를 공유함.' },
      ],
      ai_trigger: { threshold:2, warning:'governance_nominal' },
    },
    's5_2': {
      label: '취약계층 고용 관리',
      question: '취약계층 고용 비율과 유지율을 관리하는가?',
      scale: [
        { score:1, desc:'고용 비율을 집계하지 않아 인증 요건 충족 여부를 모름.' },
        { score:2, desc:'신고 시점에만 숫자를 맞추고 평소에는 관리하지 않음.' },
        { score:3, desc:'비율은 알지만 퇴사·근속 추이는 따로 보지 않음.' },
        { score:4, desc:'월별로 고용 비율과 근속 현황을 관리함.' },
        { score:5, desc:'이직 사유를 분석해 근속을 높이는 조치를 실행하고 효과를 확인함.' },
      ],
      ai_trigger: { threshold:2, warning:'vulnerable_employment_unmanaged' },
    },
    's5_3': {
      label: '근로조건 안정성',
      question: '임금 수준과 계약 형태가 안정적으로 유지되는가?',
      scale: [
        { score:1, desc:'임금 체불이 있었거나 계약서 없이 근무하는 인원이 있음.' },
        { score:2, desc:'대부분 단기 계약이며 지원금 종료와 함께 고용이 끊김.' },
        { score:3, desc:'계약은 갖췄으나 임금이 최저 수준에 머물고 인상 계획이 없음.' },
        { score:4, desc:'정규 계약 비중이 높고 연 단위 임금 조정 기준이 있음.' },
        { score:5, desc:'임금 체계와 승급 기준이 문서화돼 있고 지원금과 무관하게 유지됨.' },
      ],
      ai_trigger: { threshold:2, warning:'unstable_labor' },
    },
    's5_4': {
      label: '역량 개발 프로그램',
      question: '구성원 교육·역량개발 프로그램이 정기적으로 운영되는가?',
      scale: [
        { score:1, desc:'교육 기회가 전혀 없으며 업무는 어깨너머로 배움.' },
        { score:2, desc:'외부 무료 교육 공지를 전달하는 정도이며 참여를 관리하지 않음.' },
        { score:3, desc:'연 1~2회 교육을 진행하나 직무와 연결되지 않음.' },
        { score:4, desc:'직무별 교육 계획을 세워 연간 단위로 운영함.' },
        { score:5, desc:'교육 이수 결과를 업무 배치·승급과 연결하고 효과를 점검함.' },
      ],
      ai_trigger: { threshold:2, warning:'no_capability_program' },
    },
    's5_5': {
      label: '대표 의존도',
      question: '대표가 부재해도 조직이 정상 운영되는 구조인가?',
      scale: [
        { score:1, desc:'대표가 자리를 비우면 수주·정산·현장 대응이 모두 멈춤.' },
        { score:2, desc:'단순 업무만 위임돼 있고 외부 협상·계약은 전적으로 대표가 처리함.' },
        { score:3, desc:'담당자는 정해져 있으나 권한이 없어 결재를 기다려야 함.' },
        { score:4, desc:'업무별 책임자와 전결 권한이 정해져 있어 단기 부재는 문제되지 않음.' },
        { score:5, desc:'업무 매뉴얼과 권한 위임 규정이 문서화돼 장기 부재에도 운영이 유지됨.' },
      ],
      ai_trigger: { threshold:2, warning:'ceo_dependency' },
    },

    /* ===================== S6 마케팅·브랜딩·서비스 품질 ===================== */
    's6_1': {
      label: '사회적 가치 브랜드 스토리',
      question: '사회적 가치를 담은 브랜드 스토리가 정립되어 반복 사용되는가?',
      scale: [
        { score:1, desc:'조직을 소개하는 일관된 문장이 없어 자료마다 설명이 달라짐.' },
        { score:2, desc:'설명은 있으나 사업 내용 나열에 가깝고 사회적 가치가 드러나지 않음.' },
        { score:3, desc:'스토리는 있으나 대표 개인의 창업 동기에 머물러 조직 이야기로 확장되지 않음.' },
        { score:4, desc:'수혜자 변화 중심의 스토리를 정리해 홍보물·제안서에 공통 사용함.' },
        { score:5, desc:'스토리를 채널별로 변형해 운영하며 실제 문의·수주로 이어진 사례가 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'no_brand_story' },
    },
    's6_2': {
      label: '홍보 채널 정기 운영',
      question: '온·오프라인 홍보 채널을 정기적으로 운영하는가?',
      scale: [
        { score:1, desc:'홈페이지·SNS가 없거나 개설 후 방치 상태임.' },
        { score:2, desc:'채널은 있으나 마지막 게시물이 반년 이상 지났음.' },
        { score:3, desc:'행사가 있을 때만 비정기적으로 올림.' },
        { score:4, desc:'월 단위 게시 주기를 정해 꾸준히 운영함.' },
        { score:5, desc:'채널별 목적을 나눠 운영하고 유입·문의 지표를 확인해 내용을 조정함.' },
      ],
      ai_trigger: { threshold:2, warning:'channel_dormant' },
    },
    's6_3': {
      label: '만족도 측정·반영',
      question: '수혜자·고객 만족도를 측정하고 개선에 반영하는가?',
      scale: [
        { score:1, desc:'만족도를 물어본 적이 없음.' },
        { score:2, desc:'구두로 반응을 듣는 정도이며 기록이 없음.' },
        { score:3, desc:'설문은 하지만 결과를 집계만 하고 개선으로 이어지지 않음.' },
        { score:4, desc:'정기 만족도 조사를 실시하고 낮은 항목을 개선 과제로 등록함.' },
        { score:5, desc:'개선 후 재측정으로 변화를 확인하는 순환이 돌아감.' },
      ],
      ai_trigger: { threshold:2, warning:'no_satisfaction_loop' },
    },
    's6_4': {
      label: '서비스 표준 문서화',
      question: '서비스 제공 표준(매뉴얼·품질기준)이 문서화되어 있는가?',
      scale: [
        { score:1, desc:'매뉴얼이 없어 담당자에 따라 결과물의 수준이 크게 달라짐.' },
        { score:2, desc:'구두로 전달되는 관행만 있고 문서는 없음.' },
        { score:3, desc:'일부 업무만 문서화돼 있고 갱신이 멈춰 현행과 다름.' },
        { score:4, desc:'주요 서비스의 절차·품질기준이 문서로 정리돼 공유됨.' },
        { score:5, desc:'매뉴얼을 정기 개정하며 신규 인력이 이를 보고 바로 투입될 수 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'no_service_standard' },
    },
    's6_5': {
      label: '레퍼런스 축적',
      question: '수행 사례·레퍼런스를 축적해 제안서에 활용하는가?',
      scale: [
        { score:1, desc:'과거 사업 자료가 흩어져 있어 실적을 증빙하기 어려움.' },
        { score:2, desc:'파일은 있으나 정리되지 않아 제안서 작성 때마다 처음부터 만듦.' },
        { score:3, desc:'주요 사업만 정리했고 사진·수치 등 근거 자료가 빠져 있음.' },
        { score:4, desc:'사업별 개요·성과·이미지를 정리한 사례집을 관리함.' },
        { score:5, desc:'사례집을 발주처 유형별로 편집해 제안서에 즉시 활용함.' },
      ],
      ai_trigger: { threshold:2, warning:'no_reference' },
    },

    /* ===================== S7 인증·제도·ESG ===================== */
    's7_1': {
      label: '인증 상태·갱신 관리',
      question: '보유 인증의 상태와 갱신 시점을 파악하고 준비하는가?',
      scale: [
        { score:1, desc:'인증 만료일을 모르고 있으며 갱신 요건도 확인하지 않음.' },
        { score:2, desc:'만료가 임박해서야 통보를 받고 급하게 서류를 준비함.' },
        { score:3, desc:'시점은 알지만 요건 충족 여부는 직전에 확인함.' },
        { score:4, desc:'갱신 일정을 미리 관리하고 필요한 자료를 상시 축적함.' },
        { score:5, desc:'요건 충족 상태를 정기 점검하고 미달 항목은 사전에 보완함.' },
      ],
      ai_trigger: { threshold:2, warning:'cert_unmanaged' },
    },
    's7_2': {
      label: 'SVI 측정 이력',
      question: '사회적가치지표(SVI) 측정에 참여한 이력이 있는가?',
      scale: [
        { score:1, desc:'SVI가 무엇인지 알지 못함.' },
        { score:2, desc:'명칭은 들어봤으나 측정에 참여한 적이 없음.' },
        { score:3, desc:'과거 1회 참여했으나 결과를 활용하지 않았고 이후 갱신하지 않음.' },
        { score:4, desc:'주기적으로 측정에 참여하고 결과를 조직 내부에 공유함.' },
        { score:5, desc:'측정 결과의 취약 지표를 개선 과제로 삼아 다음 측정에서 변화를 확인함.' },
      ],
      ai_trigger: { threshold:2, warning:'no_svi' },
    },
    's7_3': {
      label: '지원사업·중간지원조직 연결',
      question: '사회적경제 지원사업 신청 이력이 있고 중간지원조직과 연결되어 있는가?',
      scale: [
        { score:1, desc:'지원사업 정보를 얻는 경로가 없고 신청해본 적도 없음.' },
        { score:2, desc:'공고를 우연히 보면 검토하는 정도이며 담당 기관과 접점이 없음.' },
        { score:3, desc:'몇 차례 신청했으나 선정 실패 후 원인을 분석하지 않음.' },
        { score:4, desc:'권역 중간지원조직과 정기적으로 소통하며 매년 신청함.' },
        { score:5, desc:'담당자와 사전 협의로 사업을 설계하고 선정 이후 사후관리까지 연결함.' },
      ],
      ai_trigger: { threshold:2, warning:'no_support_network' },
    },
    's7_4': {
      label: '환경(E) 활동',
      question: '폐기물·에너지·친환경 조달 등 환경 측면 활동이 있는가?',
      scale: [
        { score:1, desc:'환경 관련 활동을 고려한 적이 없음.' },
        { score:2, desc:'분리배출 등 기본 사항만 지키며 별도 활동은 없음.' },
        { score:3, desc:'일회성 캠페인을 한 적은 있으나 업무 방식에는 반영되지 않음.' },
        { score:4, desc:'에너지·폐기물 절감이나 친환경 조달을 업무 규칙으로 운영함.' },
        { score:5, desc:'환경 지표를 정해 측정하고 개선 실적을 성과 자료에 포함함.' },
      ],
      ai_trigger: { threshold:2, warning:'no_env_activity' },
    },
    's7_5': {
      label: '지배구조(G) 투명성',
      question: '회계 공시와 이해충돌 관리 등 지배구조 투명성이 확보되어 있는가?',
      scale: [
        { score:1, desc:'회계 자료가 정리되지 않고 공시 의무도 확인하지 않음.' },
        { score:2, desc:'세무 신고용 장부만 있으며 내부 공유나 공시는 하지 않음.' },
        { score:3, desc:'결산 자료를 만들지만 이사회 보고에 그치고 외부 공개는 없음.' },
        { score:4, desc:'회계 결산을 공시하고 이해충돌 방지 규정을 두고 있음.' },
        { score:5, desc:'외부 검증을 거친 자료를 공개하고 이해충돌 사안을 기록·관리함.' },
      ],
      ai_trigger: { threshold:2, warning:'governance_opaque' },
    },

    /* ===================== S8 디지털·AX ===================== */
    's8_1': {
      label: '업무 데이터 디지털 축적',
      question: '업무 데이터가 디지털로 축적·검색 가능한 형태로 관리되는가?',
      scale: [
        { score:1, desc:'종이 문서와 담당자 개인 PC에 흩어져 있어 찾을 수 없음.' },
        { score:2, desc:'파일로는 있으나 이름·폴더 규칙이 없어 검색이 어려움.' },
        { score:3, desc:'공유 폴더는 쓰지만 최신본과 과거본이 뒤섞여 있음.' },
        { score:4, desc:'문서 규칙과 저장 위치가 정해져 있어 담당자가 아니어도 찾을 수 있음.' },
        { score:5, desc:'데이터가 축적돼 성과 집계·제안서 작성에 바로 활용됨.' },
      ],
      ai_trigger: { threshold:2, warning:'data_scattered' },
    },
    's8_2': {
      label: '협업·프로젝트 도구',
      question: '협업·프로젝트 관리 도구를 실제로 활용하는가?',
      scale: [
        { score:1, desc:'모든 업무 공유를 전화·대면으로만 하며 진행 상황이 기록되지 않음.' },
        { score:2, desc:'메신저 단체방만 사용해 지시와 자료가 섞여 흘러감.' },
        { score:3, desc:'도구를 도입했으나 일부 인원만 쓰고 실제 업무는 메신저로 진행됨.' },
        { score:4, desc:'업무 단위로 일정·담당자를 등록해 조직 전체가 사용함.' },
        { score:5, desc:'진행 상황이 도구에 실시간 반영돼 회의 없이도 현황 파악이 가능함.' },
      ],
      ai_trigger: { threshold:2, warning:'no_collab_tool' },
    },
    's8_3': {
      label: 'AI 도구 실무 활용',
      question: 'AI 도구를 문서 작성·데이터 분석·고객 응대 등 실무에 활용하는가?',
      scale: [
        { score:1, desc:'AI 도구를 사용해본 적이 없음.' },
        { score:2, desc:'호기심으로 몇 번 써봤으나 업무에 적용하지 않음.' },
        { score:3, desc:'일부 인원이 개인적으로 활용하며 조직 차원의 공유는 없음.' },
        { score:4, desc:'제안서 초안·자료 요약 등 정해진 업무에 정기적으로 활용함.' },
        { score:5, desc:'활용 규칙과 검수 절차를 두고 여러 업무에 적용해 시간 절감을 확인함.' },
      ],
      ai_trigger: { threshold:2, warning:'no_ai_usage' },
    },
    's8_4': {
      label: '온라인 채널 확장',
      question: '온라인 채널로 서비스를 제공하거나 확장할 여지를 검토하는가?',
      scale: [
        { score:1, desc:'모든 서비스가 대면으로만 이뤄지며 온라인 전환을 검토한 적이 없음.' },
        { score:2, desc:'필요성은 느끼나 무엇부터 해야 할지 모름.' },
        { score:3, desc:'온라인 채널을 열었으나 실제 거래·이용은 거의 없음.' },
        { score:4, desc:'온라인으로 일부 서비스가 제공되며 매출 기여가 발생함.' },
        { score:5, desc:'온라인 채널이 주요 접점으로 자리 잡아 지역 밖 수요까지 확보함.' },
      ],
      ai_trigger: { threshold:2, warning:'offline_only' },
    },
    's8_5': {
      label: '디지털 역량 교육·투자',
      question: '구성원 간 디지털 역량 격차를 줄이기 위한 교육·투자가 있는가?',
      scale: [
        { score:1, desc:'디지털 업무를 특정 인원 한 명이 전담하며 교육 계획이 없음.' },
        { score:2, desc:'필요성은 인식하나 예산·시간을 배정하지 않음.' },
        { score:3, desc:'외부 무료 교육에 개별적으로 참여하는 수준임.' },
        { score:4, desc:'연간 교육 계획에 디지털 항목을 포함해 운영함.' },
        { score:5, desc:'교육 후 실제 업무 적용까지 점검하며 필요한 도구 비용을 예산에 반영함.' },
      ],
      ai_trigger: { threshold:2, warning:'digital_gap' },
    },
  };

  const KEY_PREFIX = 'diag-social-container_';

  /* ── 점수 계산 — micro와 동일 스키마 ─────────────────────────── */
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

  /* ── 교차 경고 — 낮은 점수 조합에서 발동 ─────────────────────── */
  function detectCrossWarnings(scores) {
    const src = scores || {};
    const get = key => Number(src[KEY_PREFIX + key] || 0);
    const w = [];

    if (get('s3_2') <= 2 && get('s3_5') <= 2)
      w.push({ level:'HIGH', code:'public_lock_in', msg:'공공 발주 의존도를 관리하지 않고 민간 판로도 없습니다. 발주 기관의 예산이 삭감되면 매출이 한 번에 끊기는 구조입니다. 민간·B2C 채널을 최소 1개 확보하십시오.' });

    if (get('s4_3') <= 2 && get('s3_1') >= 4)
      w.push({ level:'HIGH', code:'winning_but_losing', msg:'공공 용역을 수주하고 있으나 사업별 공헌이익을 산출하지 않습니다. "수주는 하는데 남는 게 없는" 구조일 수 있습니다. 진행 중인 사업부터 투입 인시와 변동비를 집계하십시오.' });

    if (get('s4_1') <= 2 && get('s4_4') <= 2)
      w.push({ level:'CRITICAL', code:'subsidy_cliff', msg:'지원금 없이는 유지가 어려운데 손익분기점도 모르고 있습니다. 지원 종료 시점에 대응할 시간이 없습니다. BEP 산출을 최우선 과제로 삼으십시오.' });

    if (get('s1_3') <= 2 && get('s1_5') <= 2)
      w.push({ level:'HIGH', code:'impact_invisible', msg:'사회적 성과를 측정하지도 공개하지도 않고 있습니다. 재인증·지원사업 심사에서 성과를 증빙할 수단이 없습니다.' });

    if (get('s7_2') <= 2 && get('s7_3') <= 2)
      w.push({ level:'MEDIUM', code:'svi_gap', msg:'SVI 측정 이력이 없고 중간지원조직과의 연결도 약합니다. 다수 지원사업의 가점·자격요건에서 불리하게 작용합니다.' });

    if (get('s2_1') <= 2 && get('s2_2') <= 2)
      w.push({ level:'CRITICAL', code:'mission_drift_risk', msg:'주력 사업과 사회적 목적의 연결이 약한데 미션 무관 매출 비중도 관리하지 않습니다. 재인증 심사에서 사회적 목적 실현 여부가 쟁점이 될 수 있습니다.' });

    if (get('s5_5') <= 2 && get('s5_4') <= 2)
      w.push({ level:'HIGH', code:'ceo_bottleneck', msg:'대표 의존도가 높은데 구성원 역량개발 프로그램도 없습니다. 대표의 부재가 곧 사업 중단으로 이어지며 조직이 성장할 여력이 없습니다.' });

    if (get('s5_2') <= 2 && get('s5_3') <= 2)
      w.push({ level:'HIGH', code:'employment_unstable', msg:'취약계층 고용을 수치로 관리하지 않고 근로조건도 불안정합니다. 인증 요건 미달 위험과 이직에 따른 사업 차질이 동시에 존재합니다.' });

    if (get('s6_4') <= 2 && get('s6_5') <= 2)
      w.push({ level:'MEDIUM', code:'no_proposal_asset', msg:'서비스 표준과 사례집이 모두 없습니다. 제안서를 매번 처음부터 작성하게 되어 수주 기회를 놓칩니다.' });

    if (get('s3_3') <= 2 && get('s3_4') <= 2)
      w.push({ level:'MEDIUM', code:'procurement_unready', msg:'조달 채널 등록과 우선구매 자격 활용이 모두 미흡합니다. 사회적기업에 주어지는 판로 우대를 쓰지 못하고 있습니다.' });

    if (get('s8_1') <= 2 && get('s8_3') <= 2)
      w.push({ level:'MEDIUM', code:'digital_base_missing', msg:'업무 데이터가 축적되지 않은 상태에서 AI 활용도 없습니다. 데이터 정리가 먼저이며 그 다음이 도구 도입입니다.' });

    if (get('s1_1') <= 2 && get('s5_1') <= 2)
      w.push({ level:'HIGH', code:'formal_shell', msg:'미션이 명문화되지 않았고 의사결정 구조도 형식적으로만 운영됩니다. 사회적기업의 실체성 자체가 심사에서 문제될 수 있습니다.' });

    return w;
  }

  /* ── AI 프롬프트용 요약 ──────────────────────────────────────── */
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

    return `[사회적기업 전용 진단 결과 — S1~S8 8영역 40문항]
종합 점수: ${result.total}점 / 100점

[영역별 점수]
${domainLines}

[복합 경고 신호]
${warnLines}

[즉각 처방 필요 항목 (2점 이하)]
${criticalItems.length ? '  ' + criticalItems.join(', ') : '  - 없음'}

[해석 지침]
- 이 진단은 사회적기업 준비도를 보는 도구이며 SVI(사회적가치지표) 점수를 예측하지 않는다.
  SVI 예상 점수나 등급을 추정하지 마라.
- 8영역은 균등 배점이다. 특정 영역을 SVI 배점에 맞춰 재가중하지 마라.
- 취약 영역의 처방은 사회적기업이 실제로 접근 가능한 자원(중간지원조직, 사회적경제 지원사업,
  우선구매 제도)을 우선 활용하는 방향으로 제시하라.`;
  }

  /* ── 렌더링용 스키마 ─────────────────────────────────────────── */
  function getSchema() {
    return { id: 'social', label: '사회적기업 전용 진단', version: '1.0', domains: DOMAINS, items: ITEMS };
  }

  return { getSchema, calcScores, detectCrossWarnings, buildPromptSummary, DOMAINS, ITEMS, KEY_PREFIX };

})();

if (typeof window !== 'undefined') window.DiagSocial = DiagSocial;
if (typeof module !== 'undefined') module.exports = DiagSocial;
