/* ================================================================
   BizNavi — diagnosis-coop.js
   협동조합 전용 진단 (orgType='cooperative')

   C1~C8 8영역 × 5문항 = 40문항, 5점 BARS.
   근거: 협동조합기본법
        조합원 자격·출자 / 1인 1표 의결권(출자액 무관) / 총회·이사회 운영 의무 /
        임원 선출·임기 규정 / 잉여금 배당 제한(법정적립금 우선·이용고 배당 원칙) /
        조합원 교육 의무 / 조합원 외 거래 비중 제한(사회적협동조합) / 결산보고서 제출 의무

   ⚠ diagnosis-social.js(S1~S8)를 복사한 것이 아니다.
      사회적기업은 '인증'을 통해 얻는 지위이고, 협동조합은 '설립 신고'로 성립하는 법인 형태다.
      → C1(조합원 기반)·C2(민주적 운영)·C3(사업 지속가능성)·C5(회계·법규)·C7(제도 활용)이
        협동조합기본법 고유 축이다.
      → C4(재정·원가구조)·C6(판로·마케팅)은 S4·S3+S6과 항목이 겹치지만 이는 정상이다.
        재무 구조는 법인 형태와 무관하게 같은 것을 봐야 한다(협동조합이라고 BEP를 다르게 계산하지 않는다).
        다만 문항 서술은 협동조합 맥락으로 쓴다 — 예: c4_5 잉여금 처리는 법정적립금·이용고 배당 원칙.

   ⚠ C7에 인증 만료·갱신 경고를 넣지 않는다.
      협동조합은 설립 신고로 성립하므로 만료·갱신 개념이 없다.
      (사회적기업 S7·소셜벤처 V7과 동일한 원칙 — 활용도에 집중한다)

   스키마는 diagnosis-social.js·diagnosis-venture.js와 동일하다.
   점수 키는 'diag-coop-container_c1_1' 형식.
   ================================================================ */

const DiagCoop = (() => {

  const DOMAINS = [
    { id:'c1', key:'members',       label:'조합원 기반',        icon:'👥', desc:'조합원 자격·가입 절차·출자금 관리·이용고 기록 체계를 진단합니다.',        weight:0.125 },
    { id:'c2', key:'governance',    label:'민주적 운영·거버넌스', icon:'🗳️', desc:'총회 개최, 1인 1표의 실질적 작동, 이사회·감사 기능, 조합원 교육을 진단합니다.', weight:0.125 },
    { id:'c3', key:'biz_sustain',   label:'사업 지속가능성',     icon:'🌱', desc:'주 사업과 조합원 실익의 연결, 조합원 외 거래 비중 관리 수준을 진단합니다.',  weight:0.125 },
    { id:'c4', key:'finance_coop',  label:'재정·원가구조',       icon:'💰', desc:'출자금 외 자립성, 원가 구분, 공헌이익·BEP, 잉여금 처리의 적법성을 진단합니다.', weight:0.125 },
    { id:'c5', key:'compliance',    label:'회계·법규 준수',      icon:'📑', desc:'설립·변경 신고, 결산보고서 제출, 정관과 실제 운영의 일치를 진단합니다.',    weight:0.125 },
    { id:'c6', key:'market_coop',   label:'판로·마케팅',        icon:'📣', desc:'조합 브랜드, 공공조달·우선구매 활용, 홍보 채널, 협동조합 간 연대를 진단합니다.', weight:0.125 },
    { id:'c7', key:'coop_system',   label:'제도 활용',          icon:'📋', desc:'사회적협동조합 전환 검토, 지원사업·중간지원조직·세제 혜택 활용도를 진단합니다.', weight:0.125 },
    { id:'c8', key:'digital_coop',  label:'디지털·AX',          icon:'🤖', desc:'조합원·출자금 데이터 관리, 온라인 의사결정, AI 활용, 디지털 격차 해소를 진단합니다.', weight:0.125 },
  ];

  const ITEMS = {

    /* ===================== C1 조합원 기반 ===================== */
    'c1_1': {
      label: '조합원 자격 규정',
      question: '조합원이 될 수 있는 자격 요건이 정관에 명확히 규정되어 있는가?',
      scale: [
        { score:1, desc:'정관의 조합원 자격 조항이 설립 당시 표준 문안 그대로이며 실제 기준과 다름.' },
        { score:2, desc:'조항은 있으나 범위가 모호해 가입 문의가 오면 그때그때 판단함.' },
        { score:3, desc:'자격 요건은 정해져 있으나 예외 처리 기준이 없어 사례마다 결정이 달라짐.' },
        { score:4, desc:'자격 요건과 예외 기준이 정관·내규에 정리되어 있고 실제로 그대로 적용함.' },
        { score:5, desc:'자격 요건이 사업 목적과 연결되어 있고 정기적으로 적정성을 검토·개정함.' },
      ],
      ai_trigger: { threshold:2, warning:'member_eligibility_vague' },
    },
    'c1_2': {
      label: '가입 절차 운영',
      question: '신규 조합원 가입 절차가 문서화되어 있고 실제로 그 절차대로 운영되는가?',
      scale: [
        { score:1, desc:'가입 절차가 문서로 없고 대표가 구두로 승인함.' },
        { score:2, desc:'신청서 양식은 있으나 승인 주체·기한이 정해져 있지 않음.' },
        { score:3, desc:'절차는 정해져 있으나 이사회 승인 등 일부 단계를 생략하는 경우가 있음.' },
        { score:4, desc:'신청·심사·승인·출자금 납입까지 절차대로 진행하고 기록을 남김.' },
        { score:5, desc:'절차가 정착되어 있고 가입 이력이 조합원 명부와 자동으로 연결됨.' },
      ],
      ai_trigger: { threshold:2, warning:'join_process_missing' },
    },
    'c1_3': {
      label: '조합원 수·출자금 관리',
      question: '조합원 수와 출자금 변동을 정기적으로 파악하고 관리하는가?',
      scale: [
        { score:1, desc:'현재 조합원 수와 출자금 총액을 바로 답하기 어려움.' },
        { score:2, desc:'설립 당시 수치는 알지만 이후 변동은 반영되지 않았음.' },
        { score:3, desc:'결산 때만 집계하며 연중 변동은 따로 관리하지 않음.' },
        { score:4, desc:'분기 단위로 조합원 수·출자금 변동을 집계해 이사회에 보고함.' },
        { score:5, desc:'변동이 생길 때마다 대장에 반영되며 추이를 사업 계획에 활용함.' },
      ],
      ai_trigger: { threshold:2, warning:'member_data_stale' },
    },
    'c1_4': {
      label: '탈퇴·제명·환급 규정',
      question: '조합원 탈퇴·제명 절차와 출자금 환급 규정이 정비되어 있는가?',
      scale: [
        { score:1, desc:'탈퇴·환급 규정이 없어 실제 사례가 생기면 분쟁 소지가 큼.' },
        { score:2, desc:'정관에 조항은 있으나 환급 시기·금액 산정 방식이 정해져 있지 않음.' },
        { score:3, desc:'규정은 있으나 실제 처리해 본 적이 없어 적용 가능한지 확인되지 않았음.' },
        { score:4, desc:'규정에 따라 탈퇴·환급을 처리한 이력이 있고 기록이 남아 있음.' },
        { score:5, desc:'환급 시기·산정 방식이 명확하고 재정 계획에 환급 소요를 반영하고 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'withdrawal_rule_missing' },
    },
    'c1_5': {
      label: '조합원 이용고 기록',
      question: '조합원이 조합 사업을 얼마나 이용했는지(이용고)를 기록·관리하는가?',
      scale: [
        { score:1, desc:'조합원별 이용 실적을 따로 기록하지 않음.' },
        { score:2, desc:'거래 기록은 있으나 조합원과 비조합원이 구분되지 않음.' },
        { score:3, desc:'조합원별로 구분은 되나 집계에 시간이 걸려 활용하지 못함.' },
        { score:4, desc:'조합원별 연간 이용 실적을 집계해 총회 자료로 활용함.' },
        { score:5, desc:'이용고를 상시 집계하며 이용고 배당 산정의 근거로 바로 쓸 수 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'patronage_unrecorded' },
    },

    /* ===================== C2 민주적 운영·거버넌스 ===================== */
    'c2_1': {
      label: '총회 개최·의사록',
      question: '총회가 정관에 정한 주기로 개최되고 의사록이 보관되는가?',
      scale: [
        { score:1, desc:'총회를 연 적이 없거나 서면으로 형식만 갖춤.' },
        { score:2, desc:'개최는 하나 의사록을 남기지 않아 결의 내용을 증빙할 수 없음.' },
        { score:3, desc:'정기총회는 열지만 소집 통지·정족수 확인 등 절차가 느슨함.' },
        { score:4, desc:'정관에 정한 주기로 개최하고 소집 통지·의사록을 갖춰 보관함.' },
        { score:5, desc:'총회 의사록이 결산·사업계획과 연결되어 있고 조합원에게 공개됨.' },
      ],
      ai_trigger: { threshold:2, warning:'assembly_not_held' },
    },
    'c2_2': {
      label: '1인 1표의 실질적 작동',
      question: '출자액과 무관하게 1인 1표 의결권이 실질적으로 작동하는가? — 출자를 많이 한 조합원이 결정을 좌우하고 있지는 않은지 봅니다.',
      scale: [
        { score:1, desc:'사실상 출자를 많이 한 1~2인이 모든 결정을 내리며 표결이 형식적임.' },
        { score:2, desc:'표결은 하지만 반대 의견이 나온 적이 없고 사전에 결론이 정해져 있음.' },
        { score:3, desc:'표결은 이루어지나 안건 자료가 사전에 공유되지 않아 판단 근거가 부족함.' },
        { score:4, desc:'안건을 사전 공유하고 조합원이 실제로 다른 의견을 내며 표결이 이루어짐.' },
        { score:5, desc:'주요 안건에서 부결·수정 사례가 있고 그 과정이 의사록에 남아 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'one_member_one_vote_broken' },
    },
    'c2_3': {
      label: '이사회·감사 기능',
      question: '이사회와 감사가 실질적으로 기능하는가?',
      scale: [
        { score:1, desc:'이사·감사가 이름만 올라 있고 회의가 열린 적이 없음.' },
        { score:2, desc:'이사회는 가끔 열리나 감사는 결산 서명만 함.' },
        { score:3, desc:'이사회가 정기적으로 열리나 안건이 사후 보고 위주임.' },
        { score:4, desc:'이사회가 사전 심의 기능을 하고 감사가 회계·업무를 실제로 점검함.' },
        { score:5, desc:'감사 의견이 개선으로 이어진 사례가 있고 그 과정이 기록되어 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'board_dysfunctional' },
    },
    'c2_4': {
      label: '임원 선출·임기 준수',
      question: '임원 선출 방식과 임기·연임 규정이 지켜지고 있는가?',
      scale: [
        { score:1, desc:'설립 이후 임원이 바뀐 적이 없고 임기 만료 여부도 확인하지 않았음.' },
        { score:2, desc:'임기는 알고 있으나 만료 후에도 재선출 절차 없이 유지되고 있음.' },
        { score:3, desc:'선출은 하나 후보 공고·선거 절차가 정관과 다르게 운영됨.' },
        { score:4, desc:'임기에 맞춰 총회에서 선출하고 변경 등기까지 처리함.' },
        { score:5, desc:'임원 임기·연임 현황을 관리표로 두고 만료 전에 미리 절차를 시작함.' },
      ],
      ai_trigger: { threshold:2, warning:'officer_term_lapsed' },
    },
    'c2_5': {
      label: '조합원 교육·소통',
      question: '조합원 교육·소통 프로그램이 정기적으로 운영되는가? — 협동조합기본법은 조합원 교육을 의무로 두고 있습니다.',
      scale: [
        { score:1, desc:'조합원 교육을 한 적이 없고 계획도 없음.' },
        { score:2, desc:'가입 시 안내 외에 별도 교육이 없음.' },
        { score:3, desc:'외부 교육 정보를 전달하는 정도이며 자체 프로그램은 없음.' },
        { score:4, desc:'연 1회 이상 자체 교육을 열고 참석 기록을 남김.' },
        { score:5, desc:'교육과 정기 소통 창구가 함께 운영되며 조합원 의견이 사업에 반영됨.' },
      ],
      ai_trigger: { threshold:2, warning:'member_education_absent' },
    },

    /* ===================== C3 사업 지속가능성 ===================== */
    'c3_1': {
      label: '조합원 실익과의 연결',
      question: '주 사업이 조합원의 실익(공동구매·판로·일자리 등)과 연결되는가?',
      scale: [
        { score:1, desc:'사업이 조합원에게 어떤 이익을 주는지 설명하기 어려움.' },
        { score:2, desc:'연결은 있으나 일부 조합원에게만 해당되고 나머지는 무관함.' },
        { score:3, desc:'대부분 조합원과 연결되나 실익의 크기를 확인해 본 적이 없음.' },
        { score:4, desc:'조합원이 얻는 실익(단가 절감·판로·소득 등)을 수치로 제시할 수 있음.' },
        { score:5, desc:'실익을 매년 집계해 총회에 보고하고 사업 방향 결정에 활용함.' },
      ],
      ai_trigger: { threshold:2, warning:'member_benefit_unclear' },
    },
    'c3_2': {
      label: '조합원 외 거래 관리',
      question: '조합원이 아닌 상대와의 거래 비중을 파악하고 관리하는가? — 사회적협동조합은 이 비중에 법적 제한이 있습니다.',
      scale: [
        { score:1, desc:'조합원 거래와 비조합원 거래를 구분하지 않아 비중을 알 수 없음.' },
        { score:2, desc:'대략 짐작은 하나 집계해 본 적이 없음.' },
        { score:3, desc:'결산 때 한 번 확인하는 정도이며 관리 기준은 없음.' },
        { score:4, desc:'비중을 정기적으로 집계하고 기준선을 정해 관리함.' },
        { score:5, desc:'비중을 상시 확인하며 기준을 넘기 전에 사업 구성을 조정함.' },
      ],
      ai_trigger: { threshold:2, warning:'nonmember_ratio_unmanaged' },
    },
    'c3_3': {
      label: '사업계획·실적 총회 의결',
      question: '사업 계획과 실적을 총회에서 검토·의결하는가?',
      scale: [
        { score:1, desc:'사업 계획을 문서로 만들지 않고 총회 안건으로 올린 적도 없음.' },
        { score:2, desc:'계획은 있으나 총회 보고 없이 집행부가 결정함.' },
        { score:3, desc:'총회에 보고는 하나 실적과 대조하는 절차는 없음.' },
        { score:4, desc:'계획과 실적을 함께 상정해 의결하고 차이를 설명함.' },
        { score:5, desc:'전년 실적 검토 결과가 다음 해 계획에 반영되는 흐름이 정착되어 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'plan_not_resolved' },
    },
    'c3_4': {
      label: '매출 의존도 관리',
      question: '특정 거래처나 특정 조합원에 대한 매출 의존도를 관리하는가?',
      scale: [
        { score:1, desc:'거래처별 매출 비중을 집계하지 않아 의존도를 알 수 없음.' },
        { score:2, desc:'한 곳에 크게 의존하는 것은 아나 대안을 찾은 적이 없음.' },
        { score:3, desc:'비중은 집계하나 위험 기준선을 정해두지 않았음.' },
        { score:4, desc:'상위 거래처 비중을 관리하고 기준을 넘으면 분산을 시도함.' },
        { score:5, desc:'의존도를 낮추기 위한 신규 거래처 확보가 실제 실적으로 나타남.' },
      ],
      ai_trigger: { threshold:2, warning:'revenue_concentration' },
    },
    'c3_5': {
      label: '신규 사업 의견 수렴',
      question: '신규 사업에 진출할 때 조합원 의견을 수렴하는 절차가 있는가?',
      scale: [
        { score:1, desc:'집행부가 결정하고 사후에 알리는 방식임.' },
        { score:2, desc:'일부 조합원과 상의하지만 공식 절차는 없음.' },
        { score:3, desc:'설명회는 열지만 의견이 결정에 반영되는지 확인되지 않음.' },
        { score:4, desc:'의견 수렴 후 이사회·총회 안건으로 올려 결정함.' },
        { score:5, desc:'수렴 결과와 결정 사유를 조합원에게 회신하는 절차까지 정착되어 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'no_member_consultation' },
    },

    /* ===================== C4 재정·원가구조 =====================
       ⚠ S4와 항목이 겹치나 이는 정상이다. 서술은 협동조합 맥락으로 쓴다 */
    'c4_1': {
      label: '출자금 외 자립성',
      question: '출자금이나 지원금이 아니라 자체 사업 수익으로 운영이 유지되는가?',
      scale: [
        { score:1, desc:'출자금과 지원금으로 운영비를 충당하고 있어 그것이 끊기면 유지가 어려움.' },
        { score:2, desc:'사업 수익이 있으나 운영비의 절반에 못 미침.' },
        { score:3, desc:'운영비의 상당 부분을 사업 수익으로 충당하나 해마다 편차가 큼.' },
        { score:4, desc:'사업 수익만으로 운영비를 충당하고 있음.' },
        { score:5, desc:'운영비를 충당하고 잉여가 남아 적립과 재투자가 가능함.' },
      ],
      ai_trigger: { threshold:2, warning:'coop_not_self_sustaining' },
    },
    'c4_2': {
      label: '변동비·고정비 구분',
      question: '매출을 변동비와 고정비로 구분해 파악하고 있는가?',
      scale: [
        { score:1, desc:'비용을 통장 출금 기준으로만 보고 성격별로 나눠본 적이 없음.' },
        { score:2, desc:'큰 항목만 아는 정도이며 매출과 함께 늘어나는 비용을 구분하지 못함.' },
        { score:3, desc:'구분은 하나 항목 분류가 매번 달라 비교가 어려움.' },
        { score:4, desc:'매월 변동비와 고정비를 나눠 집계하고 있음.' },
        { score:5, desc:'구분한 수치로 단가·수주 여부를 판단하는 데 실제로 활용함.' },
      ],
      ai_trigger: { threshold:2, warning:'cost_structure_unknown' },
    },
    'c4_3': {
      label: '사업별 공헌이익',
      question: '사업별로 얼마가 남는지(공헌이익)를 산출하는가?',
      scale: [
        { score:1, desc:'전체 손익만 보며 사업별로 남는지 여부는 모름.' },
        { score:2, desc:'감으로 판단하며 계산해 본 적은 없음.' },
        { score:3, desc:'연 1회 결산 때만 나눠보고 개별 수주 판단에는 쓰지 않음.' },
        { score:4, desc:'사업별로 투입 비용을 집계해 공헌이익을 산출함.' },
        { score:5, desc:'공헌이익을 근거로 계속·중단을 판단하며 그 기록이 남아 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'no_contribution_margin' },
    },
    'c4_4': {
      label: '손익분기점 활용',
      question: '손익분기점(BEP)을 알고 의사결정에 활용하는가?',
      scale: [
        { score:1, desc:'손익분기점을 계산해 본 적이 없음.' },
        { score:2, desc:'개념은 알지만 우리 조합의 수치는 모름.' },
        { score:3, desc:'과거에 계산했으나 비용 구조가 바뀐 뒤 갱신하지 않았음.' },
        { score:4, desc:'현재 기준의 손익분기점을 알고 월 실적과 대조함.' },
        { score:5, desc:'손익분기점을 기준으로 단가·인력·사업 규모를 조정하고 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'bep_unknown' },
    },
    'c4_5': {
      label: '잉여금 처리의 적법성',
      question: '잉여금 처리(법정적립금 적립·이용고 배당 등)가 협동조합기본법과 정관에 맞게 이루어지는가? — 출자액 기준 배당이 아니라 법정적립금이 우선이며 이용고 배당이 원칙입니다.',
      scale: [
        { score:1, desc:'법정적립금 의무를 모르며 잉여가 나면 임의로 처리해 왔음.' },
        { score:2, desc:'적립 의무는 알지만 실제로 적립한 적이 없음.' },
        { score:3, desc:'법정적립금은 적립하나 배당 방식이 정관과 다르게 이루어진 적이 있음.' },
        { score:4, desc:'법정적립금을 먼저 적립하고 배당은 이용고 기준으로 총회 의결을 거침.' },
        { score:5, desc:'적립·배당 내역이 결산서와 총회 의사록에 일관되게 기록되어 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'surplus_distribution_illegal' },
    },

    /* ===================== C5 회계·법규 준수 ===================== */
    'c5_1': {
      label: '설립·변경 신고 최신화',
      question: '협동조합기본법상 설립·변경 신고 사항이 최신 상태인가?',
      scale: [
        { score:1, desc:'설립 이후 신고 사항을 확인해 본 적이 없음.' },
        { score:2, desc:'임원·주소 등이 바뀌었으나 신고·등기를 하지 않았음.' },
        { score:3, desc:'대부분 반영했으나 일부 변경 사항이 누락된 것을 알고 있음.' },
        { score:4, desc:'변경이 생기면 기한 내에 신고·등기를 처리함.' },
        { score:5, desc:'변경 사항 점검을 정기 업무로 두고 담당자가 지정되어 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'registration_outdated' },
    },
    'c5_2': {
      label: '결산보고서 제출',
      question: '결산보고서를 기한 내에 제출하고 있는가?',
      scale: [
        { score:1, desc:'제출 의무가 있는지 몰랐거나 제출한 적이 없음.' },
        { score:2, desc:'의무는 알지만 기한을 넘겨 제출한 해가 있음.' },
        { score:3, desc:'제출은 하나 매년 마감에 임박해 급히 준비함.' },
        { score:4, desc:'매년 기한 내에 제출하고 제출 이력이 정리되어 있음.' },
        { score:5, desc:'결산 일정을 미리 잡아 총회 의결까지 여유 있게 마치고 제출함.' },
      ],
      ai_trigger: { threshold:2, warning:'annual_report_missing' },
    },
    'c5_3': {
      label: '회계 처리의 검증 가능성',
      question: '회계 처리가 외부에서 검증할 수 있는 수준으로 이루어지는가?',
      scale: [
        { score:1, desc:'개인 통장과 조합 계좌가 섞여 있고 증빙이 정리되지 않음.' },
        { score:2, desc:'계좌는 분리했으나 장부가 없어 통장 내역으로만 확인함.' },
        { score:3, desc:'장부는 있으나 증빙 보관이 일부 누락되어 소명이 어려운 항목이 있음.' },
        { score:4, desc:'회계 프로그램이나 정해진 양식으로 기록하고 증빙을 함께 보관함.' },
        { score:5, desc:'외부 기관 제출·감사 요구에 바로 대응할 수 있는 상태를 유지함.' },
      ],
      ai_trigger: { threshold:2, warning:'accounting_unverifiable' },
    },
    'c5_4': {
      label: '정관과 실제 운영의 일치',
      question: '정관에 적힌 내용과 실제 운영 사이에 괴리가 없는가?',
      scale: [
        { score:1, desc:'정관 내용을 대표 외에는 모르며 실제 운영과 다른 부분이 많음.' },
        { score:2, desc:'정관을 참고하지 않고 운영하며 어긋나는 부분을 인지하지 못함.' },
        { score:3, desc:'차이가 있다는 것은 알지만 개정하지 못하고 있음.' },
        { score:4, desc:'운영과 다른 조항은 총회 의결로 개정해 맞춰 왔음.' },
        { score:5, desc:'정관을 정기적으로 점검하고 사업 변화에 맞춰 개정 이력을 남김.' },
      ],
      ai_trigger: { threshold:2, warning:'articles_operation_gap' },
    },
    'c5_5': {
      label: '조합원 명부·출자금 대장',
      question: '조합원 명부와 출자금 대장이 정확하게 관리되는가?',
      scale: [
        { score:1, desc:'명부·대장이 없거나 최신 상태가 아니어서 현황 파악이 안 됨.' },
        { score:2, desc:'명부는 있으나 출자금 납입·환급 내역과 맞지 않는 부분이 있음.' },
        { score:3, desc:'대체로 맞으나 확인하는 데 시간이 걸리고 담당자만 파악하고 있음.' },
        { score:4, desc:'명부와 출자금 대장이 일치하며 변동 시 즉시 반영됨.' },
        { score:5, desc:'회계 장부와 대장이 연결되어 있어 결산 시 자동으로 대조됨.' },
      ],
      ai_trigger: { threshold:2, warning:'member_ledger_inaccurate' },
    },

    /* ===================== C6 판로·마케팅 ===================== */
    'c6_1': {
      label: '조합 브랜드·정체성',
      question: '조합의 브랜드와 정체성이 정립되어 있는가?',
      scale: [
        { score:1, desc:'조합 이름 외에 내세울 정체성이 정리되어 있지 않음.' },
        { score:2, desc:'무엇을 하는 조합인지 설명은 하나 사람마다 표현이 다름.' },
        { score:3, desc:'소개 문구는 있으나 협동조합이라는 점이 강점으로 전달되지 않음.' },
        { score:4, desc:'조합의 정체성과 강점이 정리되어 홍보물·제안서에 일관되게 쓰임.' },
        { score:5, desc:'조합원이 함께 만든 브랜드 기준이 있고 대외 자료에 일관되게 적용됨.' },
      ],
      ai_trigger: { threshold:2, warning:'coop_brand_weak' },
    },
    'c6_2': {
      label: '공공조달·우선구매 활용',
      question: '공공조달이나 우선구매 채널을 활용하고 있는가?',
      scale: [
        { score:1, desc:'공공조달 참여를 검토해 본 적이 없음.' },
        { score:2, desc:'제도는 들어봤으나 등록 절차를 확인하지 않았음.' },
        { score:3, desc:'조달 채널에 등록했으나 실제 수주 실적은 없음.' },
        { score:4, desc:'공공 부문 수주 실적이 있고 신청 절차에 익숙함.' },
        { score:5, desc:'공공·민간 판로를 함께 운영하며 비중을 관리하고 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'procurement_unused' },
    },
    'c6_3': {
      label: '홍보 채널 정기 운영',
      question: '온·오프라인 홍보 채널을 정기적으로 운영하는가?',
      scale: [
        { score:1, desc:'홍보 채널이 없고 소개할 자료도 없음.' },
        { score:2, desc:'홈페이지나 SNS 계정은 있으나 오랫동안 갱신되지 않았음.' },
        { score:3, desc:'행사가 있을 때만 비정기적으로 올림.' },
        { score:4, desc:'정해진 주기로 소식을 올리고 담당자가 지정되어 있음.' },
        { score:5, desc:'채널별 반응을 확인해 내용을 조정하며 문의·거래로 이어짐.' },
      ],
      ai_trigger: { threshold:2, warning:'promotion_inactive' },
    },
    'c6_4': {
      label: '만족도 측정·반영',
      question: '고객과 조합원의 만족도를 측정하고 개선에 반영하는가?',
      scale: [
        { score:1, desc:'만족도를 따로 확인하지 않음.' },
        { score:2, desc:'현장에서 듣는 정도이며 기록하지 않음.' },
        { score:3, desc:'설문을 하지만 결과가 개선으로 이어진 사례는 드묾.' },
        { score:4, desc:'정기적으로 측정하고 개선 항목을 정해 반영함.' },
        { score:5, desc:'개선 전후 지표를 비교하며 결과를 조합원에게 공유함.' },
      ],
      ai_trigger: { threshold:2, warning:'satisfaction_unmeasured' },
    },
    'c6_5': {
      label: '협동조합 간 연대',
      question: '다른 협동조합과의 연대·공동사업 실적이 있는가? — 협동조합 간 협동은 국제 협동조합 원칙의 하나입니다.',
      scale: [
        { score:1, desc:'다른 협동조합과 교류가 전혀 없음.' },
        { score:2, desc:'행사에서 만나는 정도이며 함께한 사업은 없음.' },
        { score:3, desc:'공동사업을 논의한 적은 있으나 실행되지 않았음.' },
        { score:4, desc:'공동 구매·공동 판매 등 함께한 사업 실적이 있음.' },
        { score:5, desc:'연합회·네트워크에 참여하며 공동사업이 정기적으로 이루어짐.' },
      ],
      ai_trigger: { threshold:2, warning:'no_coop_solidarity' },
    },

    /* ===================== C7 제도 활용 =====================
       ⚠ 협동조합은 설립 신고로 성립하므로 만료·갱신 개념이 없다.
          갱신 경고를 넣지 않고 활용도에 집중한다 */
    'c7_1': {
      label: '사회적협동조합 전환 검토',
      question: '사회적협동조합 인가 또는 전환을 검토해 본 적이 있는가?',
      scale: [
        { score:1, desc:'일반 협동조합과 사회적협동조합의 차이를 알지 못함.' },
        { score:2, desc:'차이는 알지만 우리에게 해당되는지 확인해 본 적이 없음.' },
        { score:3, desc:'요건을 확인했고 검토 중이나 결론을 내지 못했음.' },
        { score:4, desc:'검토 결과 현재 형태가 적합하다고 판단했거나 전환을 준비하고 있음.' },
        { score:5, desc:'사회적협동조합으로 인가받았거나 전환 절차를 진행 중임.' },
      ],
      ai_trigger: { threshold:2, warning:'social_coop_unreviewed' },
    },
    'c7_2': {
      label: '지원사업 신청 이력',
      question: '협동조합 대상 지원사업에 신청한 이력이 있는가?',
      scale: [
        { score:1, desc:'그런 지원사업이 있는지 몰랐음.' },
        { score:2, desc:'공고를 본 적은 있으나 신청하지 않았음.' },
        { score:3, desc:'신청했으나 선정되지 않았음.' },
        { score:4, desc:'1건 이상 선정되어 지원을 받은 이력이 있음.' },
        { score:5, desc:'단계에 맞는 사업을 골라 지속적으로 활용하고 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'no_coop_program' },
    },
    'c7_3': {
      label: '중간지원조직·연합회 연결',
      question: '중간지원조직이나 협동조합연합회와 연결되어 있는가?',
      scale: [
        { score:1, desc:'어떤 기관이 협동조합을 지원하는지 모름.' },
        { score:2, desc:'존재는 알지만 상담하거나 방문한 적이 없음.' },
        { score:3, desc:'한 번 상담을 받아본 정도임.' },
        { score:4, desc:'정기적으로 정보를 받고 프로그램에 참여한 적이 있음.' },
        { score:5, desc:'담당자와 지속 관계가 있고 컨설팅·네트워킹을 실제로 활용함.' },
      ],
      ai_trigger: { threshold:2, warning:'no_coop_intermediary' },
    },
    'c7_4': {
      label: '활용 가능한 제도 파악',
      question: '우선구매·세제 혜택 등 활용할 수 있는 제도를 파악하고 있는가?',
      scale: [
        { score:1, desc:'어떤 제도를 쓸 수 있는지 확인해 본 적이 없음.' },
        { score:2, desc:'몇 가지는 들어봤으나 요건을 모름.' },
        { score:3, desc:'요건은 확인했으나 실제로 신청해 본 적이 없음.' },
        { score:4, desc:'해당되는 제도를 정리해 두고 일부를 활용하고 있음.' },
        { score:5, desc:'제도 목록을 관리하며 변경 사항을 정기적으로 확인해 반영함.' },
      ],
      ai_trigger: { threshold:2, warning:'benefits_unknown' },
    },
    'c7_5': {
      label: '교육·컨설팅 지원 활용',
      question: '조합원 대상 교육·컨설팅 지원 제도를 활용하고 있는가?',
      scale: [
        { score:1, desc:'교육·컨설팅 지원 제도를 활용해 본 적이 없음.' },
        { score:2, desc:'정보는 받지만 참여로 이어지지 않음.' },
        { score:3, desc:'일부 조합원이 개별적으로 참여하는 정도임.' },
        { score:4, desc:'조합 차원에서 교육·컨설팅을 신청해 받은 이력이 있음.' },
        { score:5, desc:'교육·컨설팅 결과가 운영 개선으로 이어진 사례가 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'no_coop_education_support' },
    },

    /* ===================== C8 디지털·AX ===================== */
    'c8_1': {
      label: '조합원·출자금 데이터 관리',
      question: '조합원 정보와 출자금 데이터가 디지털로 관리되는가?',
      scale: [
        { score:1, desc:'종이 명부나 수기 장부로만 관리하고 있음.' },
        { score:2, desc:'엑셀 파일이 있으나 담당자 개인 PC에만 있고 백업이 없음.' },
        { score:3, desc:'공유 문서로 관리하나 항목이 통일되지 않아 집계가 어려움.' },
        { score:4, desc:'정해진 형식으로 한곳에 축적되어 필요할 때 바로 집계할 수 있음.' },
        { score:5, desc:'출자·탈퇴 처리와 회계가 연결되어 있어 대조가 자동으로 이루어짐.' },
      ],
      ai_trigger: { threshold:2, warning:'member_data_analog' },
    },
    'c8_2': {
      label: '온라인 의사결정 도구',
      question: '총회·이사회 등 의사결정에 온라인 도구를 활용하는가?',
      scale: [
        { score:1, desc:'모든 회의를 대면으로만 진행하며 참석률이 낮아도 대안이 없음.' },
        { score:2, desc:'단체 대화방으로 공지하는 정도이며 의결에는 쓰지 않음.' },
        { score:3, desc:'온라인 회의를 시도했으나 정착되지 않았음.' },
        { score:4, desc:'온라인 회의·전자 투표 등을 활용해 참여율이 높아졌음.' },
        { score:5, desc:'온라인 절차가 정관·내규에 반영되어 있고 기록이 함께 남음.' },
      ],
      ai_trigger: { threshold:2, warning:'no_online_governance' },
    },
    'c8_3': {
      label: 'AI 도구 실무 활용',
      question: 'AI 도구를 실무에 활용하고 있는가?',
      scale: [
        { score:1, desc:'생성형 AI 도구를 업무에 써본 적이 전혀 없음.' },
        { score:2, desc:'개인적으로 몇 번 써본 정도이며 조합 업무에는 쓰지 않음.' },
        { score:3, desc:'문서 작성 등 일부 업무에 간헐적으로 활용함.' },
        { score:4, desc:'정해진 업무에 정기적으로 활용해 시간이 줄어든 것을 체감함.' },
        { score:5, desc:'업무 절차에 포함되어 있고 조합원이 함께 쓰는 사용법이 정리되어 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'no_ai_usage_coop' },
    },
    'c8_4': {
      label: '온라인 채널 확장 여지',
      question: '온라인 채널로 사업을 확장할 여지를 검토하고 있는가?',
      scale: [
        { score:1, desc:'온라인 판매·홍보를 검토해 본 적이 없음.' },
        { score:2, desc:'필요성은 느끼나 어디서 시작할지 모름.' },
        { score:3, desc:'계정은 만들었으나 운영되지 않고 있음.' },
        { score:4, desc:'온라인 채널에서 실제 거래나 문의가 발생하고 있음.' },
        { score:5, desc:'온라인 채널이 주요 판로의 하나로 자리 잡고 실적을 관리함.' },
      ],
      ai_trigger: { threshold:2, warning:'no_online_channel' },
    },
    'c8_5': {
      label: '조합원 디지털 격차 해소',
      question: '조합원 간 디지털 역량 격차를 줄이기 위한 교육이 있는가?',
      scale: [
        { score:1, desc:'디지털에 익숙하지 않은 조합원이 소외되고 있으나 대응이 없음.' },
        { score:2, desc:'문제는 알지만 별도 지원을 하지 못하고 있음.' },
        { score:3, desc:'필요할 때 개별적으로 도와주는 정도임.' },
        { score:4, desc:'기초 교육을 열어 참여를 도왔고 참석 기록이 있음.' },
        { score:5, desc:'수준별 교육을 정기적으로 운영하며 참여율이 올라가고 있음.' },
      ],
      ai_trigger: { threshold:2, warning:'digital_divide_ignored' },
    },
  };

  const KEY_PREFIX = 'diag-coop-container_';

  /* ── 점수 계산 — DiagSocial/DiagVenture와 동일 스키마 ───────── */
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

  /* ── 교차 경고 — 협동조합기본법 관련 고유 위험 ───────────────── */
  function detectCrossWarnings(scores) {
    const src = scores || {};
    const get = key => Number(src[KEY_PREFIX + key] || 0);
    const w = [];

    if (get('c2_2') <= 2 && get('c2_1') <= 2)
      w.push({ level:'CRITICAL', code:'coop_in_name_only', msg:'총회가 제대로 열리지 않고 1인 1표 의결권도 실질적으로 작동하지 않습니다. 형식만 협동조합이고 실제로는 특정인이 좌우하는 구조이며, 법인격 유지와 지원사업 심사 양쪽에서 문제가 될 수 있습니다. 정관에 정한 주기로 총회를 열고 의사록을 남기는 것부터 시작하십시오.' });

    if (get('c5_2') <= 2 && get('c5_1') <= 2)
      w.push({ level:'CRITICAL', code:'legal_duty_unmet', msg:'설립·변경 신고와 결산보고서 제출이라는 법정 의무 이행이 미흡합니다. 지원사업 신청 시 결격 사유가 될 수 있으므로 미제출·미신고 항목부터 확인해 정리하십시오.' });

    if (get('c1_5') <= 2 && get('c4_5') <= 2)
      w.push({ level:'HIGH', code:'patronage_dividend_impossible', msg:'조합원별 이용 실적을 관리하지 않아 이용고 배당의 법적 근거를 만들 수 없습니다. 협동조합기본법은 법정적립금을 먼저 적립하고 배당은 이용고 기준으로 하도록 정하고 있습니다. 조합원별 거래 기록부터 남기십시오.' });

    if (get('c3_2') <= 2 && get('c3_1') <= 2)
      w.push({ level:'HIGH', code:'coop_identity_diluted', msg:'주 사업이 조합원 실익과 연결되지 않고 조합원 외 거래 비중도 관리하지 않습니다. 협동조합의 정체성이 희석되며, 사회적협동조합의 경우 조합원 외 거래 비중에 법적 제한이 있어 위반 소지도 생깁니다.' });

    if (get('c2_3') <= 2 && get('c2_4') <= 2)
      w.push({ level:'HIGH', code:'board_and_term_lapsed', msg:'이사회·감사가 실질적으로 기능하지 않고 임원 임기 관리도 되지 않습니다. 임기 만료 임원의 행위는 효력 다툼의 소지가 있으므로 현재 임원의 임기부터 확인하십시오.' });

    if (get('c4_1') <= 2 && get('c4_4') <= 2)
      w.push({ level:'HIGH', code:'coop_subsidy_cliff', msg:'출자금·지원금 없이는 운영이 어려운데 손익분기점도 모르고 있습니다. 지원이 끊기는 시점에 대응할 시간을 확보할 수 없습니다. 손익분기점 산출을 최우선 과제로 삼으십시오.' });

    if (get('c5_3') <= 2 && get('c5_5') <= 2)
      w.push({ level:'HIGH', code:'books_unauditable', msg:'회계 처리와 조합원 명부·출자금 대장이 모두 검증 가능한 상태가 아닙니다. 결산보고서 작성과 외부 제출에서 소명이 어려워집니다.' });

    if (get('c2_5') <= 2 && get('c7_5') <= 2)
      w.push({ level:'MEDIUM', code:'education_duty_ignored', msg:'조합원 교육을 자체적으로도 하지 않고 외부 지원 제도도 활용하지 않고 있습니다. 협동조합기본법은 조합원 교육을 의무로 두고 있으므로 지원 제도부터 확인해 활용하십시오.' });

    if (get('c1_1') <= 2 && get('c1_2') <= 2)
      w.push({ level:'MEDIUM', code:'membership_process_weak', msg:'조합원 자격 요건과 가입 절차가 모두 정비되어 있지 않습니다. 신규 가입이 늘어날 때 분쟁의 소지가 되며 명부 정확성도 무너집니다.' });

    if (get('c1_4') <= 2 && get('c1_3') <= 2)
      w.push({ level:'MEDIUM', code:'withdrawal_risk', msg:'탈퇴·환급 규정이 정비되지 않았고 출자금 변동 관리도 되지 않습니다. 탈퇴 요청이 몰리면 환급 자금을 감당하지 못할 수 있습니다.' });

    if (get('c6_2') <= 2 && get('c7_4') <= 2)
      w.push({ level:'MEDIUM', code:'coop_benefits_unused', msg:'공공조달·우선구매 채널을 쓰지 않고 활용 가능한 제도도 파악하지 않았습니다. 협동조합에 열려 있는 판로와 혜택을 놓치고 있습니다.' });

    if (get('c3_4') <= 2 && get('c6_1') <= 2)
      w.push({ level:'MEDIUM', code:'concentration_and_weak_brand', msg:'매출 의존도를 관리하지 않고 조합 브랜드도 정립되어 있지 않습니다. 주요 거래처가 이탈하면 대체 판로를 만들기 어렵습니다.' });

    if (get('c8_1') <= 2 && get('c8_3') <= 2)
      w.push({ level:'MEDIUM', code:'digital_base_missing_coop', msg:'조합원 데이터가 디지털로 축적되지 않은 상태에서 AI 활용도 없습니다. 데이터 정리가 먼저이고 도구 도입은 그다음입니다.' });

    if (get('c3_5') <= 2 && get('c3_3') <= 2)
      w.push({ level:'MEDIUM', code:'decision_without_members', msg:'사업 계획을 총회에서 의결하지 않고 신규 사업 의견 수렴 절차도 없습니다. 조합원이 결정 과정에서 배제되면 참여와 출자 의지가 함께 떨어집니다.' });

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

    return `[협동조합 전용 진단 결과 — C1~C8 8영역 40문항]
종합 점수: ${result.total}점 / 100점

[영역별 점수]
${domainLines}

[복합 경고 신호]
${warnLines}

[즉각 처방 필요 항목 (2점 이하)]
${criticalItems.length ? '  ' + criticalItems.join(', ') : '  - 없음'}

[해석 지침]
- 이 점수는 8영역 균등 배점(각 12.5%)으로 산출한 준비도 지표다.
- 협동조합은 협동조합기본법에 근거해 **설립 신고로 성립하는 법인 형태**다.
  사회적기업처럼 '인증'을 받고 유지하는 지위가 아니므로,
  ⚠ 인증 만료·갱신을 전제로 조언하지 마라.
- 1인 1표 의결권(출자액과 무관), 잉여금 배당 제한(법정적립금 우선·이용고 배당 원칙),
  총회·이사회 운영 의무, 조합원 교육 의무, 결산보고서 제출 의무가 이 법인 형태의 핵심이다.
  출자액에 비례한 배당이나 주주총회식 의사결정을 전제한 조언을 하지 마라.
- 법정 의무(신고·결산보고서 제출) 미이행은 지원사업 결격 사유가 될 수 있으므로
  다른 과제보다 앞에 배치하라.
- 사회적협동조합은 조합원 외 거래 비중에 법적 제한이 있다. 이를 무시한 판로 확대 조언을 하지 마라.`;
  }

  function getSchema() {
    return { id: 'coop', label: '협동조합 전용 진단', version: '1.0', domains: DOMAINS, items: ITEMS };
  }

  return { getSchema, calcScores, detectCrossWarnings, buildPromptSummary, DOMAINS, ITEMS, KEY_PREFIX };

})();

if (typeof window !== 'undefined') window.DiagCoop = DiagCoop;
if (typeof module !== 'undefined') module.exports = DiagCoop;
