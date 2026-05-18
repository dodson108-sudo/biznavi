const INDUSTRY_KNOWLEDGE_IT = {
  id: 'knowledge_it',
  label: '지식 서비스 및 IT 개발',
  icon: '💻',
  description: '소규모 디자인 에이전시·앱 개발 외주사·마케팅 대행사. 물적 자산은 적으나 사람의 시간(인건비)이 곧 직접 비용임.',
  areas: [
    {
      id: 'kit_project',
      label: '프로젝트 수익성 및 공수 관리',
      icon: '📊',
      items: [
        { id:'ki_1_1', label:'프로젝트별 이익률', type:'bars', question:'매출액에서 투입 인건비(M/M)와 외주비를 제외한 실질 순이익을 프로젝트별로 관리하고 있습니까?', scale:[{score:1,desc:'프로젝트별 이익률 파악 없음. 전체 매출만 집계.'},{score:2,desc:'주요 프로젝트 이익률 대략 파악. 체계 없음.'},{score:3,desc:'전 프로젝트 이익률 월 집계. 목표 마진 설정.'},{score:4,desc:'프로젝트별 실시간 이익률 추적. 적자 프로젝트 즉각 경보.'},{score:5,desc:'프로젝트 수익성 대시보드. AI 기반 공수 최적화 제안.'}], ai_trigger:{threshold:2,warning:'project_margin_blind'} },
        { id:'ki_1_2', label:'맨먼스(M/M) 산출 적정성', type:'bars', question:'제안 시 산출한 공수와 실제 투입된 시간의 오차 범위(Overrun) 관리를 하고 있습니까?', scale:[{score:1,desc:'M/M 산출 없음. 감으로 견적 제시.'},{score:2,desc:'M/M 산출하나 실제 투입 추적 없음.'},{score:3,desc:'프로젝트별 M/M 오차율 집계. 개선 목표 설정.'},{score:4,desc:'Overrun 10% 이하 관리. 원인 분석 체계.'},{score:5,desc:'M/M 실시간 추적. Overrun 자동 경보 + 즉각 조정.'}], ai_trigger:{threshold:2,warning:'manmonth_overrun'} },
        { id:'ki_1_3', label:'가동률(Utilization Rate)', type:'bars', question:'전체 근무 시간 중 수익 프로젝트에 투입되는 시간의 비중(유휴 인력 리스크)을 관리하고 있습니까?', scale:[{score:1,desc:'가동률 개념 없음. 유휴 인력 파악 불가.'},{score:2,desc:'전체 가동률 대략 파악. 개인별 분석 없음.'},{score:3,desc:'개인별 가동률 월 집계. 목표 80% 설정.'},{score:4,desc:'가동률 실시간 모니터링. 유휴 인력 즉각 투입.'},{score:5,desc:'가동률 최적화 완성. 유휴 시간 자체 솔루션 개발 투자.'}], ai_trigger:{threshold:2,warning:'utilization_low'} },
        { id:'ki_1_4', label:'추가 과업(Scope Creep) 통제', type:'bars', question:'고객사의 잦은 수정 요청에 대한 추가 비용 청구 체계 및 계약 관리력을 보유하고 있습니까?', scale:[{score:1,desc:'Scope Creep 무조건 수용. 추가 청구 없음.'},{score:2,desc:'과도한 요청 시 구두 항의. 청구 체계 없음.'},{score:3,desc:'계약서에 범위 명시. 초과 시 협의 요청.'},{score:4,desc:'변경 요청 공식 프로세스. 추가 견적 자동 발행.'},{score:5,desc:'Scope 통제 완전 자동화. Scope Creep 0% 달성.'}], ai_trigger:{threshold:2,warning:'scope_creep_uncontrolled'} },
      ]
    },
    {
      id: 'kit_knowledge',
      label: '지식 자산 및 기술 고도화',
      icon: '🧠',
      items: [
        { id:'ki_2_1', label:'코드·디자인 라이브러리(Asset)', type:'bars', question:'유사 프로젝트 시 재활용 가능한 소스 코드나 디자인 템플릿의 자산화 수준을 갖추고 있습니까?', scale:[{score:1,desc:'자산화 없음. 매 프로젝트 처음부터 시작.'},{score:2,desc:'일부 코드 재활용. 체계적 관리 없음.'},{score:3,desc:'주요 컴포넌트 라이브러리 구축. 팀 공유.'},{score:4,desc:'코드·디자인 자산 체계화. 재활용률 50% 이상.'},{score:5,desc:'자산 재활용으로 개발 속도 2배. 품질 일관성 확보.'}], ai_trigger:{threshold:2,warning:'asset_library_missing'} },
        { id:'ki_2_2', label:'지식재산권(IP)·솔루션 보유', type:'bars', question:'단순 외주(SI)를 넘어 자사 소유의 솔루션·특허·저작권 확보 여부를 갖추고 있습니까?', scale:[{score:1,desc:'자사 IP 전무. 100% 외주 수익 의존.'},{score:2,desc:'자사 솔루션 검토 중. 미출시.'},{score:3,desc:'자사 솔루션 1개 이상 보유. 매출 일부 기여.'},{score:4,desc:'자사 IP 포트폴리오 구축. 매출 30% 이상 기여.'},{score:5,desc:'자사 IP가 주력 매출원. 외주 의존도 50% 이하.'}], ai_trigger:{threshold:2,warning:'ip_not_owned'} },
        { id:'ki_2_3', label:'기술 스택(Tech Stack) 경쟁력', type:'bars', question:'시장 수요가 높은 최신 기술 도입 수준 및 내부 교육(R&D) 투자 비중을 갖추고 있습니까?', scale:[{score:1,desc:'레거시 기술만 보유. 최신 기술 미도입.'},{score:2,desc:'일부 최신 기술 도입. 교육 투자 없음.'},{score:3,desc:'주요 최신 기술 스택 보유. 분기 교육 실시.'},{score:4,desc:'AI·클라우드 등 첨단 기술 내재화. 월 교육 투자.'},{score:5,desc:'업계 최신 기술 선도. 기술 블로그·오픈소스 기여.'}], ai_trigger:{threshold:2,warning:'tech_stack_outdated'} },
        { id:'ki_2_4', label:'업무 매뉴얼(SOP)·협업 툴', type:'bars', question:'노션·지라 등을 활용한 프로젝트 히스토리 관리 및 인수인계 체계를 갖추고 있습니까?', scale:[{score:1,desc:'협업 툴 없음. 구두·메신저 위주.'},{score:2,desc:'기본 툴 사용. 히스토리 관리 없음.'},{score:3,desc:'노션·지라 등 협업 툴 체계화. 프로젝트 히스토리 보관.'},{score:4,desc:'SOP 문서화 완료. 인수인계 1일 내 완료.'},{score:5,desc:'협업 툴 완전 자동화. 신규 인력 온보딩 3일 이내.'}], ai_trigger:{threshold:2,warning:'collaboration_tool_weak'} },
      ]
    },
    {
      id: 'kit_hr',
      label: '인적 역량 및 조직 문화',
      icon: '👥',
      items: [
        { id:'ki_3_1', label:'핵심 인력 의존도', type:'bars', question:'특정 개발자나 디자이너 이탈 시 프로젝트가 중단될 위험도(Key-man Risk)를 관리하고 있습니까?', scale:[{score:1,desc:'핵심 인력 1인 이탈 시 즉시 프로젝트 중단.'},{score:2,desc:'Key-man Risk 인지. 대응 체계 없음.'},{score:3,desc:'백업 인력 지정. 인수인계 프로토콜 보유.'},{score:4,desc:'Cross-training 완료. 핵심 인력 이탈 영향 최소화.'},{score:5,desc:'Key-man Risk 0% 달성. 완전 분산 역량 구조.'}], ai_trigger:{threshold:2,warning:'keyman_risk_high'} },
        { id:'ki_3_2', label:'인재 영입·유지(Retention)', type:'bars', question:'업계 평균 대비 급여 수준·복지·성장 가능성 등 인재 유인 경쟁력을 갖추고 있습니까?', scale:[{score:1,desc:'급여 업계 최하위. 복지 없음. 이직률 높음.'},{score:2,desc:'급여 평균 이하. 기본 복지만 제공.'},{score:3,desc:'급여 평균 수준. 성장 기회 일부 제공.'},{score:4,desc:'급여 평균 이상. 복지·성장 패키지 완비.'},{score:5,desc:'업계 최고 수준 처우. 인재 이탈률 0% 달성.'}], ai_trigger:{threshold:2,warning:'talent_retention_weak'} },
        { id:'ki_3_3', label:'성과 보상 체계', type:'bars', question:'프로젝트 성공에 따른 인센티브 구조 및 개인별 성과 측정의 객관성을 갖추고 있습니까?', scale:[{score:1,desc:'성과 보상 없음. 고정급만 지급.'},{score:2,desc:'대표 재량 보너스. 기준 불명확.'},{score:3,desc:'프로젝트 성과 기반 인센티브 체계.'},{score:4,desc:'개인·팀 성과 KPI 연동 보상 구조.'},{score:5,desc:'성과 보상 완전 자동화. 공정성 최고 수준.'}], ai_trigger:{threshold:2,warning:'performance_reward_unclear'} },
        { id:'ki_3_4', label:'외부 파트너(Freelancer) 네트워크', type:'bars', question:'긴급 프로젝트 대응을 위한 신뢰할 수 있는 외주 인력 풀(Pool) 보유 현황을 갖추고 있습니까?', scale:[{score:1,desc:'외주 풀 없음. 긴급 수주 시 대응 불가.'},{score:2,desc:'지인 소개 위주. 검증된 외주 없음.'},{score:3,desc:'검증된 외주 5명 이상. 즉시 투입 가능.'},{score:4,desc:'외주 풀 10명 이상. 분야별 전문가 보유.'},{score:5,desc:'외주 생태계 구축. 대형 프로젝트 즉각 대응 가능.'}], ai_trigger:{threshold:2,warning:'freelancer_pool_missing'} },
      ]
    },
    {
      id: 'kit_sales',
      label: '영업 채널 및 포트폴리오 파워',
      icon: '💼',
      items: [
        { id:'ki_4_1', label:'포트폴리오의 질과 양', type:'bars', question:'주력 분야의 전문성을 보여주는 대표 레퍼런스 보유 수준을 갖추고 있습니까?', scale:[{score:1,desc:'포트폴리오 없음. 레퍼런스 제시 불가.'},{score:2,desc:'소수 레퍼런스 보유. 전문성 미부각.'},{score:3,desc:'주력 분야 레퍼런스 5개 이상. 전문성 입증.'},{score:4,desc:'대형 레퍼런스 보유. 업계 인지도 확보.'},{score:5,desc:'업계 표준 레퍼런스. 고객이 먼저 찾아오는 구조.'}], ai_trigger:{threshold:2,warning:'portfolio_weak'} },
        { id:'ki_4_2', label:'수주 경로 다각화', type:'bars', question:'지인 소개 의존도와 온라인 제안 및 직접 영업(B2B) 채널 비중을 관리하고 있습니까?', scale:[{score:1,desc:'지인 소개 100% 의존. 능동 영업 없음.'},{score:2,desc:'소개 위주. 온라인 채널 미활용.'},{score:3,desc:'온라인 채널 20% 이상 수주. 직접 영업 시작.'},{score:4,desc:'다채널 수주. 소개 의존도 50% 이하.'},{score:5,desc:'인바운드 리드 자동화. 소개 의존도 30% 이하.'}], ai_trigger:{threshold:2,warning:'sales_channel_single'} },
        { id:'ki_4_3', label:'제안 성공률(Win Rate)', type:'bars', question:'투찰·제안 대비 실제 계약 체결 비율 및 탈락 사유 분석 체계를 갖추고 있습니까?', scale:[{score:1,desc:'Win Rate 측정 없음. 탈락 사유 파악 불가.'},{score:2,desc:'Win Rate 대략 파악. 개선 노력 없음.'},{score:3,desc:'Win Rate 집계. 탈락 사유 분석 체계.'},{score:4,desc:'Win Rate 50% 이상 달성. 제안서 지속 개선.'},{score:5,desc:'Win Rate 70% 이상. 업계 최고 제안 경쟁력.'}], ai_trigger:{threshold:2,warning:'win_rate_low'} },
        { id:'ki_4_4', label:'리테이너(Retainer) 비중', type:'bars', question:'유지보수나 장기 자문 등 정기적으로 발생하는 고정 매출(MRR)의 비중을 관리하고 있습니까?', scale:[{score:1,desc:'리테이너 없음. 프로젝트 종료 후 매출 0.'},{score:2,desc:'일부 유지보수 계약. 비중 10% 미만.'},{score:3,desc:'리테이너 비중 20% 이상. 안정적 현금흐름 일부.'},{score:4,desc:'리테이너 비중 40% 이상. 매출 변동성 감소.'},{score:5,desc:'리테이너 비중 60% 이상. 안정적 MRR 기반 확립.'}], ai_trigger:{threshold:2,warning:'retainer_revenue_low'} },
      ]
    },
  ],
  ai_analysis: [
    { trigger:'utilization_low+project_margin_blind', level:'CRITICAL', msg:'인건비는 고정 지출인데 가동률이 낮다면 유휴 인력이 수익을 갉아먹는 상황입니다. 자체 솔루션 개발로 인력을 전환하거나 공격적인 영업 확장을 제안합니다.' },
    { trigger:'manmonth_overrun+scope_creep_uncontrolled', level:'HIGH', msg:'프로젝트당 이익률이 낮은데 과업 변경이 잦다면 계약서상의 R&R 정의가 미흡한 것입니다. 계약 체계 고도화와 공수 트래킹 툴 도입을 처방합니다.' },
    { trigger:'keyman_risk_high+asset_library_missing', level:'HIGH', msg:'특정 인력 의존도는 높은데 자산화 수준이 낮다면 인력 이탈 시 기업 가치가 0에 수렴합니다. 지식 공유 시스템 구축과 IP 확보를 최우선 전략으로 수립합니다.' },
  ],
};
if (typeof window !== 'undefined') window.INDUSTRY_KNOWLEDGE_IT = INDUSTRY_KNOWLEDGE_IT;
if (typeof module !== 'undefined') module.exports = INDUSTRY_KNOWLEDGE_IT;
