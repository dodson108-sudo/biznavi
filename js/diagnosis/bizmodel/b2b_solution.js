const BM_B2B_SOLUTION = {
  id: 'b2b_solution',
  label: 'B2B 솔루션',
  icon: '🔧',
  description: '기업고객 대상 맞춤형 솔루션 납품. Win Rate·납기 준수·추가 수주 비중이 핵심.',
  keyMetrics: ['Win Rate', '납기 준수율', '추가 수주 비중', '레퍼런스'],
  areas: [
    {
      id: 'sol_tech',
      label: '솔루션 경쟁력 및 기술력',
      icon: '⚙️',
      items: [
        { id:'bb_1_1', label:'솔루션 핵심 기능 완성도', type:'bars', question:'안정적인 구현 및 버그 통제 수준을 갖추고 있습니까?', scale:[{score:1,desc:'버그 다수. 납품 후 클레임 빈번.'},{score:2,desc:'주요 기능 작동. 부가 기능 불안정.'},{score:3,desc:'전 기능 안정 작동. 버그 대응 체계 보유.'},{score:4,desc:'버그 발생 24시간 내 패치. SLA 준수율 98%.'},{score:5,desc:'무결점 납품 체계. 버그 0건 목표 달성.'}], ai_trigger:{threshold:2,warning:'solution_stability_low'} },
        { id:'bb_1_2', label:'고객사별 커스터마이징', type:'bars', question:'요구 사항에 대한 신속하고 유연한 대응력을 갖추고 있습니까?', scale:[{score:1,desc:'커스터마이징 불가. 표준 솔루션만 납품.'},{score:2,desc:'소규모 커스터마이징 가능. 대형 요청 거절.'},{score:3,desc:'중규모 커스터마이징 대응. 리드타임 명확.'},{score:4,desc:'복잡한 요구 신속 대응. 모듈화 아키텍처 보유.'},{score:5,desc:'완전 맞춤형 납품 역량. 어떤 요구도 구현 가능.'}], ai_trigger:{threshold:2,warning:'customization_limited'} },
        { id:'bb_1_3', label:'기술적 차별성', type:'bars', question:'경쟁사 대비 독보적인 기술적 우위 요소를 갖추고 있습니까?', scale:[{score:1,desc:'기술 차별성 없음. 가격 경쟁만 가능.'},{score:2,desc:'일부 차별화 기술. 경쟁사 모방 용이.'},{score:3,desc:'명확한 기술 우위 1~2개. 특허 출원 중.'},{score:4,desc:'독보적 기술 특허 보유. 경쟁사 대비 1년 이상 앞섬.'},{score:5,desc:'기술 독점 포지셔닝. 대체 불가 솔루션.'}], ai_trigger:{threshold:2,warning:'tech_differentiation_weak'} },
        { id:'bb_1_4', label:'유지보수 체계(SLA)', type:'bars', question:'서비스 수준 협약 기반의 안정적 운영 역량을 갖추고 있습니까?', scale:[{score:1,desc:'SLA 개념 없음. 유지보수 임의 대응.'},{score:2,desc:'기본 유지보수 계약. SLA 기준 없음.'},{score:3,desc:'SLA 기준 문서화. 준수율 90% 이상.'},{score:4,desc:'SLA 준수율 98% 이상. 전담 유지보수팀 운영.'},{score:5,desc:'SLA 100% 달성 체계. 선제적 장애 예방.'}], ai_trigger:{threshold:2,warning:'sla_not_established'} },
      ]
    },
    {
      id: 'sol_pipeline',
      label: '영업 파이프라인 관리',
      icon: '📊',
      items: [
        { id:'bb_2_1', label:'신규 리드 발굴 채널', type:'bars', question:'소개 의존도를 벗어난 다채널 리드 발굴 능력을 갖추고 있습니까?', scale:[{score:1,desc:'소개 100% 의존. 능동 영업 없음.'},{score:2,desc:'소개 위주. 온라인 채널 미활용.'},{score:3,desc:'콘텐츠 마케팅 + 전시회 참가. 인바운드 일부.'},{score:4,desc:'다채널 리드 발굴. 소개 의존도 50% 이하.'},{score:5,desc:'인바운드 리드 자동화. 소개 의존도 30% 이하.'}], ai_trigger:{threshold:2,warning:'lead_channel_single'} },
        { id:'bb_2_2', label:'제안서 품질·Win Rate', type:'bars', question:'제안 대비 실제 계약 성공 비율을 관리하고 있습니까?', scale:[{score:1,desc:'Win Rate 측정 없음. 탈락 사유 파악 불가.'},{score:2,desc:'Win Rate 20% 미만. 제안서 품질 낮음.'},{score:3,desc:'Win Rate 30% 이상. 탈락 사유 분석 체계.'},{score:4,desc:'Win Rate 50% 이상. 제안서 템플릿 최적화.'},{score:5,desc:'Win Rate 70% 이상. AI 기반 제안서 자동화.'}], ai_trigger:{threshold:2,warning:'win_rate_low'} },
        { id:'bb_2_3', label:'영업 사이클 관리', type:'bars', question:'리드 확보부터 계약까지의 소요 기간 단축 능력을 갖추고 있습니까?', scale:[{score:1,desc:'영업 사이클 파악 없음. 무기한 대기.'},{score:2,desc:'평균 사이클 파악. 단축 전략 없음.'},{score:3,desc:'영업 사이클 목표 설정. CRM 기반 관리.'},{score:4,desc:'영업 사이클 30% 단축 달성. 자동 Follow-up.'},{score:5,desc:'영업 사이클 최적화 완성. AI 기반 최적 접촉 타이밍.'}], ai_trigger:{threshold:2,warning:'sales_cycle_too_long'} },
        { id:'bb_2_4', label:'의사결정자 설득력', type:'bars', question:'실무자를 넘어 C-레벨과 직접 소통 및 설득력을 갖추고 있습니까?', scale:[{score:1,desc:'실무자 레벨 소통만 가능. C-레벨 접근 불가.'},{score:2,desc:'C-레벨 미팅 경험 일부. 설득력 부족.'},{score:3,desc:'C-레벨 미팅 정기 진행. 비즈니스 언어 구사.'},{score:4,desc:'C-레벨 신뢰 관계 구축. 전략적 파트너십 논의.'},{score:5,desc:'C-레벨 어드바이저 포지셔닝. 고객사 내부 옹호자 확보.'}], ai_trigger:{threshold:2,warning:'c_level_access_weak'} },
      ]
    },
    {
      id: 'sol_delivery',
      label: '납품 및 구현 역량',
      icon: '🚀',
      items: [
        { id:'bb_3_1', label:'프로젝트 납기 준수율', type:'bars', question:'약속된 기한 내 완벽한 솔루션 구축 능력을 갖추고 있습니까?', scale:[{score:1,desc:'납기 지연 빈번. 지체상금 발생.'},{score:2,desc:'납기 준수율 70% 미만.'},{score:3,desc:'납기 준수율 85% 이상. 지연 시 선제 고지.'},{score:4,desc:'납기 준수율 95% 이상. 리스크 관리 체계 완비.'},{score:5,desc:'납기 100% 달성. 조기 납품 비중 30% 이상.'}], ai_trigger:{threshold:2,warning:'delivery_delay_frequent'} },
        { id:'bb_3_2', label:'PM 역량·커뮤니케이션', type:'bars', question:'프로젝트 관리의 전문성 및 소통 원활성을 갖추고 있습니까?', scale:[{score:1,desc:'PM 없음. 개발자가 직접 고객 소통.'},{score:2,desc:'PM 역할 겸직. 전문성 부족.'},{score:3,desc:'전담 PM 보유. 기본 프로젝트 관리.'},{score:4,desc:'PMP 자격 PM. 체계적 관리 + 원활한 소통.'},{score:5,desc:'PM 전문팀 운영. 고객 만족도 최고 수준.'}], ai_trigger:{threshold:2,warning:'pm_capability_weak'} },
        { id:'bb_3_3', label:'구현 후 고객 만족도', type:'bars', question:'실제 사용자의 만족 및 타사 추천 의향을 관리하고 있습니까?', scale:[{score:1,desc:'납품 후 만족도 조사 없음.'},{score:2,desc:'간단한 만족도 조사. 개선 없음.'},{score:3,desc:'납품 후 만족도 체계적 수집. 개선 반영.'},{score:4,desc:'만족도 4.0/5.0 이상 유지. 추천 비중 높음.'},{score:5,desc:'만족도 4.5 이상. 고객이 자발적 레퍼런스 제공.'}], ai_trigger:{threshold:2,warning:'post_delivery_satisfaction_low'} },
        { id:'bb_3_4', label:'범위 변경(Scope) 통제', type:'bars', question:'계약 범위를 벗어난 과업에 대한 관리 체계를 갖추고 있습니까?', scale:[{score:1,desc:'Scope 무조건 수용. 손실 빈번.'},{score:2,desc:'과도한 요청 시 구두 항의. 청구 없음.'},{score:3,desc:'계약서 범위 명시. 초과 시 추가 견적.'},{score:4,desc:'변경 요청 공식 프로세스. 추가 비용 청구 체계.'},{score:5,desc:'Scope 통제 완전 자동화. 수익성 100% 보호.'}], ai_trigger:{threshold:2,warning:'scope_creep_uncontrolled'} },
      ]
    },
    {
      id: 'sol_ltv',
      label: '유지보수 및 장기 관계',
      icon: '🤝',
      items: [
        { id:'bb_4_1', label:'납품 후 AS 체계', type:'bars', question:'전담 지원팀을 통한 신속한 문제 해결 능력을 갖추고 있습니까?', scale:[{score:1,desc:'납품 후 AS 없음. 고객 자력 해결.'},{score:2,desc:'이메일 AS만 가능. 응답 지연 빈번.'},{score:3,desc:'전담 AS 담당자. 24시간 내 응답.'},{score:4,desc:'AS 전담팀. 4시간 내 1차 대응.'},{score:5,desc:'24/7 AS 체계. 원격 모니터링 + 선제 조치.'}], ai_trigger:{threshold:2,warning:'after_service_weak'} },
        { id:'bb_4_2', label:'기존 고객 추가 수주', type:'bars', question:'납품 완료된 고객사로부터의 후속 매출 비중을 관리하고 있습니까?', scale:[{score:1,desc:'추가 수주 없음. 납품 후 관계 단절.'},{score:2,desc:'간헐적 추가 수주. 체계 없음.'},{score:3,desc:'추가 수주 비중 20% 이상. 정기 고객 미팅.'},{score:4,desc:'추가 수주 비중 40% 이상. 고객 성공 프로그램.'},{score:5,desc:'추가 수주 비중 60% 이상. 고객이 영업사원화.'}], ai_trigger:{threshold:2,warning:'upsell_from_existing_low'} },
        { id:'bb_4_3', label:'공개 레퍼런스 보유', type:'bars', question:'업계에서 인정받는 성공 사례 데이터를 갖추고 있습니까?', scale:[{score:1,desc:'레퍼런스 없음. 신규 수주 어려움.'},{score:2,desc:'비공개 레퍼런스만 보유.'},{score:3,desc:'공개 레퍼런스 3건 이상. 케이스 스터디 보유.'},{score:4,desc:'대형 레퍼런스 보유. 업계 인지도 확보.'},{score:5,desc:'업계 표준 레퍼런스. 레퍼런스가 영업 도구화.'}], ai_trigger:{threshold:2,warning:'reference_missing'} },
        { id:'bb_4_4', label:'장기 유지보수 매출(MRR)', type:'bars', question:'정기적인 유지보수 계약을 통한 수익 비중을 관리하고 있습니까?', scale:[{score:1,desc:'유지보수 계약 없음. 프로젝트 종료 후 매출 0.'},{score:2,desc:'일부 유지보수 계약. 비중 10% 미만.'},{score:3,desc:'유지보수 MRR 비중 20% 이상.'},{score:4,desc:'유지보수 MRR 40% 이상. 안정적 현금흐름.'},{score:5,desc:'유지보수 MRR 60% 이상. 사업 안정성 완성.'}], ai_trigger:{threshold:2,warning:'maintenance_mrr_low'} },
      ]
    },
  ],
  ai_analysis: [
    { trigger:'win_rate_low+delivery_delay_frequent', level:'CRITICAL', msg:'Win Rate가 낮고 납기가 자주 지연되면 수주와 납품 모두 실패한 것입니다. 제안·PM 체계를 동시 처방합니다.' },
    { trigger:'reference_missing+lead_channel_single', level:'HIGH', msg:'공개 사례 없이 소개에만 의존하면 성장에 한계가 있습니다. 콘텐츠 마케팅을 우선 처방합니다.' },
    { trigger:'after_service_weak+upsell_from_existing_low', level:'HIGH', msg:'추가 수주 비중이 낮으면 납품 후 관계 단절로 판단합니다. 고객 성공 프로그램 도입을 제안합니다.' },
  ],
};
if (typeof window !== 'undefined') window.BM_B2B_SOLUTION = BM_B2B_SOLUTION;
if (typeof module !== 'undefined') module.exports = BM_B2B_SOLUTION;
