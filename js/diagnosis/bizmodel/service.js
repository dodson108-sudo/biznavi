const BM_SERVICE = {
  id: 'service',
  label: '서비스업',
  icon: '🤝',
  description: '노동·전문성 기반으로 서비스를 제공하는 비즈니스. 인력 가동률·재수주율·고정비 비중·BEP가 핵심.',
  keyMetrics: ['인력 가동률', '재수주율', '고정비 비중', 'BEP'],
  areas: [
    {
      id: 'svc_quality',
      label: '서비스 품질 및 표준화',
      icon: '⭐',
      items: [
        { id:'sv_1_1', label:'서비스 품질 일관성', type:'bars', question:'담당자가 바뀌어도 동일한 서비스 품질이 유지되는지 갖추고 있습니까?', scale:[{score:1,desc:'품질 편차 심각. 담당자에 따라 결과물이 완전히 다름.'},{score:2,desc:'품질 기준 일부 존재. 주요 담당자 의존도 높음.'},{score:3,desc:'서비스 기준 문서화. 품질 편차 허용 범위 내.'},{score:4,desc:'전 직원 품질 기준 적용. 정기 점검 체계 완비.'},{score:5,desc:'품질 완전 표준화. 누가 담당해도 동일 결과 보장.'}], ai_trigger:{threshold:2,warning:'service_quality_inconsistent'} },
        { id:'sv_1_2', label:'SOP 매뉴얼 완성도', type:'bars', question:'서비스 전 과정이 문서화·영상화된 표준 절차를 갖추고 있습니까?', scale:[{score:1,desc:'SOP 없음. 구두 전달 100% 의존.'},{score:2,desc:'기본 텍스트 절차서 일부. 핵심 누락.'},{score:3,desc:'주요 서비스 SOP 완비. 신규 직원 독립 수행 가능.'},{score:4,desc:'전 서비스 SOP + 체크리스트 완비. 영상 SOP 일부.'},{score:5,desc:'LMS 기반 SOP. 이수율 자동 추적 + 정기 갱신 체계.'}], ai_trigger:{threshold:2,warning:'sop_not_documented'} },
        { id:'sv_1_3', label:'고객 만족도 측정', type:'bars', question:'서비스 완료 후 고객 만족을 정기적으로 수집·반영하고 있습니까?', scale:[{score:1,desc:'만족도 조사 없음. 불만 발생 시에만 인지.'},{score:2,desc:'간헐적 구두 피드백만 수집.'},{score:3,desc:'서비스 완료 후 정기 만족도 조사. 평균 4.0 이상 유지.'},{score:4,desc:'NPS 측정. 불만 즉각 개선 루프.'},{score:5,desc:'실시간 만족도 모니터링. NPS 70 이상 달성.'}], ai_trigger:{threshold:2,warning:'customer_satisfaction_unmeasured'} },
        { id:'sv_1_4', label:'서비스 실수·클레임 처리', type:'bars', question:'서비스 오류 발생 시 신속하고 체계적인 해결 능력을 갖추고 있습니까?', scale:[{score:1,desc:'클레임 처리 기준 없음. 담당자 임의 대응.'},{score:2,desc:'기본 사과·보상만 가능. 재발 방지 없음.'},{score:3,desc:'클레임 처리 SOP. 원인 분석 후 개선 반영.'},{score:4,desc:'클레임 24시간 내 해결. 재발률 지속 감소.'},{score:5,desc:'클레임 AI 분류. 패턴 분석 + 선제적 품질 개선.'}], ai_trigger:{threshold:2,warning:'claim_handling_weak'} },
      ]
    },
    {
      id: 'svc_sales',
      label: '영업 및 수주 역량',
      icon: '📋',
      items: [
        { id:'sv_2_1', label:'신규 수주 채널 다양성', type:'bars', question:'지인 소개 의존도를 벗어난 다채널 영업 체계를 갖추고 있습니까?', scale:[{score:1,desc:'지인 소개 100% 의존. 능동 영업 없음.'},{score:2,desc:'소개 위주. 온라인·마케팅 채널 없음.'},{score:3,desc:'콘텐츠 마케팅 + 플랫폼 등록. 인바운드 일부.'},{score:4,desc:'다채널 리드 발굴. 소개 의존도 50% 이하.'},{score:5,desc:'인바운드 자동화. 고객이 먼저 문의하는 구조 완성.'}], ai_trigger:{threshold:2,warning:'new_business_channel_single'} },
        { id:'sv_2_2', label:'재수주·재계약율', type:'bars', question:'기존 고객의 반복 구매 및 계약 연장 비율을 관리하고 있습니까?', scale:[{score:1,desc:'재수주율 측정 없음. 완료 후 관계 단절.'},{score:2,desc:'재수주율 30% 미만. 이탈 원인 파악 없음.'},{score:3,desc:'재수주율 50% 이상. 고객 정기 미팅 체계.'},{score:4,desc:'재수주율 70% 이상. 고객 성공 프로그램 운영.'},{score:5,desc:'재수주율 85% 이상. 고객이 자발적 레퍼런스 제공.'}], ai_trigger:{threshold:2,warning:'repeat_business_low'} },
        { id:'sv_2_3', label:'계약 조건 협상력', type:'bars', question:'납기·범위·가격에 대한 대등한 협상력을 갖추고 있습니까?', scale:[{score:1,desc:'협상력 없음. 고객 요구 무조건 수용.'},{score:2,desc:'소극적 협상. 범위 확대·단가 하락 빈번.'},{score:3,desc:'계약서 기반 협상. 범위 초과 시 추가 청구 가능.'},{score:4,desc:'강한 협상력. 레퍼런스 기반 단가 우상향.'},{score:5,desc:'가격 결정력 보유. 고객이 먼저 조건을 제안.'}], ai_trigger:{threshold:2,warning:'contract_terms_vague'} },
        { id:'sv_2_4', label:'제안서·포트폴리오 경쟁력', type:'bars', question:'수주 성공률을 높이는 차별화된 제안 역량을 갖추고 있습니까?', scale:[{score:1,desc:'제안서 없음. 구두 설명만 가능.'},{score:2,desc:'기본 제안서 보유. 차별성 없음.'},{score:3,desc:'케이스 스터디 포함 제안서. 수주율 30% 이상.'},{score:4,desc:'맞춤형 제안서 + 수치 기반 ROI 증명. 수주율 50% 이상.'},{score:5,desc:'업계 표준 제안서. 레퍼런스가 영업 도구화. 수주율 70% 이상.'}], ai_trigger:{threshold:2,warning:'proposal_quality_weak'} },
      ]
    },
    {
      id: 'svc_hr',
      label: '인력 운영 및 역량',
      icon: '👥',
      items: [
        { id:'sv_3_1', label:'인력 가동률 관리', type:'bars', question:'유휴 인력 없이 최적의 업무 배분 상태를 관리하고 있습니까?', scale:[{score:1,desc:'가동률 측정 없음. 유휴 인력 인지 불가.'},{score:2,desc:'전체 가동률만 파악. 개인별 분석 없음.'},{score:3,desc:'개인별 가동률 주 단위 관리. 목표 75% 이상.'},{score:4,desc:'가동률 85% 이상 유지. 과부하·유휴 동시 방지.'},{score:5,desc:'AI 기반 스케줄 최적화. 가동률 90% 이상 달성.'}], ai_trigger:{threshold:2,warning:'utilization_rate_low'} },
        { id:'sv_3_2', label:'핵심 인력 의존도', type:'bars', question:'특정 인물 이탈 시 사업 지속 가능한 구조를 갖추고 있습니까?', scale:[{score:1,desc:'대표자 1인 의존 100%. 이탈 시 사업 불가.'},{score:2,desc:'핵심 인력 2~3명 의존. 대안 없음.'},{score:3,desc:'핵심 업무 이중화. 대체 가능 인력 양성 중.'},{score:4,desc:'전 업무 이중화 완성. 핵심 인력 이탈 시 2주 내 복구.'},{score:5,desc:'완전 팀 기반 운영. 누구 이탈해도 서비스 지속 가능.'}], ai_trigger:{threshold:2,warning:'key_person_dependency_high'} },
        { id:'sv_3_3', label:'직원 교육·역량 개발', type:'bars', question:'서비스 품질 향상을 위한 체계적 교육 투자를 갖추고 있습니까?', scale:[{score:1,desc:'교육 없음. OJT도 체계 없음.'},{score:2,desc:'입사 시 기본 교육만. 이후 자기학습.'},{score:3,desc:'분기 1회 교육. 외부 전문 교육 일부 지원.'},{score:4,desc:'개인별 역량 개발 계획. 교육비 회사 전액 지원.'},{score:5,desc:'상시 역량 개발 체계. 자격증·전문화 지원 완성.'}], ai_trigger:{threshold:2,warning:'staff_training_weak'} },
        { id:'sv_3_4', label:'이직률·인력 안정성', type:'bars', question:'높은 인력 유지율을 통한 서비스 연속성을 갖추고 있습니까?', scale:[{score:1,desc:'연 이직률 30% 이상. 채용·교육 비용 과다.'},{score:2,desc:'연 이직률 20% 이상. 핵심 인력 이탈 빈번.'},{score:3,desc:'연 이직률 15% 이하. 인력 안정성 양호.'},{score:4,desc:'연 이직률 10% 이하. 만족도 조사 정기 실시.'},{score:5,desc:'연 이직률 5% 이하. 직원이 장기 근속을 선택.'}], ai_trigger:{threshold:2,warning:'staff_turnover_high'} },
      ]
    },
    {
      id: 'svc_finance',
      label: '수익 구조 및 재무',
      icon: '💰',
      items: [
        { id:'sv_4_1', label:'고정비 비중 관리', type:'bars', question:'매출 대비 고정비 부담이 적절하게 통제되고 있습니까?', scale:[{score:1,desc:'고정비 비중 파악 없음. BEP 인지 불가.'},{score:2,desc:'고정비 집계. 최적화 없음.'},{score:3,desc:'고정비/매출 비율 분기 관리. 목표 기준 설정.'},{score:4,desc:'고정비 비중 60% 이하 유지. 변동비화 전략 실행 중.'},{score:5,desc:'고정비 최소화 달성. 매출 감소 시에도 BEP 유지 가능.'}], ai_trigger:{threshold:2,warning:'fixed_cost_ratio_high'} },
        { id:'sv_4_2', label:'BEP(손익분기점) 인지', type:'bars', question:'월 최소 매출 목표 및 BEP를 명확히 알고 관리하고 있습니까?', scale:[{score:1,desc:'BEP 개념 없음. 자금 부족 시에만 위기 인지.'},{score:2,desc:'대략적인 BEP 파악. 근거 데이터 없음.'},{score:3,desc:'BEP 분기 산출. 월 매출 목표에 반영.'},{score:4,desc:'BEP 월 단위 추적. 조기 경보 체계 구축.'},{score:5,desc:'BEP 실시간 모니터링. 자동 경보 + 즉각 대응 체계.'}], ai_trigger:{threshold:2,warning:'bep_unknown'} },
        { id:'sv_4_3', label:'매출채권 회수 관리', type:'bars', question:'서비스 완료 후 대금 회수까지의 기간을 관리하고 있습니까?', scale:[{score:1,desc:'매출채권 관리 없음. 미수금 방치 빈번.'},{score:2,desc:'미수금 인지. 독촉 체계 없음.'},{score:3,desc:'지급 조건 계약 명시. 30일 초과 시 독촉 SOP.'},{score:4,desc:'평균 회수 기간 30일 이하. 자동 알림 체계.'},{score:5,desc:'선금·중도금·잔금 구조화. 미수금 0% 목표 달성.'}], ai_trigger:{threshold:2,warning:'receivables_collection_weak'} },
        { id:'sv_4_4', label:'반복 매출(MRR) 비중', type:'bars', question:'프로젝트 단발성을 넘어선 정기 계약·구독 매출 비중을 갖추고 있습니까?', scale:[{score:1,desc:'반복 매출 없음. 프로젝트 완료 후 매출 0.'},{score:2,desc:'반복 매출 비중 10% 미만. 매출 불안정.'},{score:3,desc:'반복 매출 비중 20% 이상. 유지보수·구독 계약 일부.'},{score:4,desc:'반복 매출 비중 40% 이상. 안정적 현금흐름 기반.'},{score:5,desc:'반복 매출 비중 60% 이상. 사업 안정성 완성.'}], ai_trigger:{threshold:2,warning:'recurring_revenue_low'} },
      ]
    },
  ],
  ai_analysis: [
    { trigger:'sop_not_documented+repeat_business_low', level:'CRITICAL', msg:'표준화 없이 재수주가 낮으면 담당자에 따라 품질이 달라 신뢰 구축이 불가능합니다. SOP 완성을 최우선 처방합니다.' },
    { trigger:'utilization_rate_low+fixed_cost_ratio_high', level:'CRITICAL', msg:'인력이 놀고 있으나 고정비는 높으면 구조적 적자입니다. 인력 재배치와 고정비 감축을 동시 처방합니다.' },
    { trigger:'contract_terms_vague+receivables_collection_weak', level:'HIGH', msg:'계약 조건이 불명확하고 대금 회수가 느리면 흑자 도산 위험입니다. 계약서 표준화와 선금 구조를 처방합니다.' },
  ],
};
if (typeof window !== 'undefined') window.BM_SERVICE = BM_SERVICE;
if (typeof module !== 'undefined') module.exports = BM_SERVICE;
