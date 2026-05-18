const BM_B2C_SUB = {
  id: 'b2c_sub',
  label: 'B2C 구독',
  icon: '🔄',
  description: '제품이나 서비스를 가입자에게 정기적으로 제공. 해지율·ARPU·Trial Conversion이 핵심.',
  keyMetrics: ['Churn Rate', 'ARPU', 'Trial Conversion', 'LTV'],
  areas: [
    {
      id: 'sub_value',
      label: '콘텐츠·상품 경쟁력',
      icon: '⭐',
      items: [
        { id:'bc_1_1', label:'구독 핵심 가치 차별성', type:'bars', question:'정기 구독을 지속할 만한 독보적 가치 제공 여부를 갖추고 있습니까?', scale:[{score:1,desc:'차별화 없음. 타 구독 서비스와 동일.'},{score:2,desc:'일부 차별화. 고객 이탈 빈번.'},{score:3,desc:'명확한 가치 제안. 재구독 의향 높음.'},{score:4,desc:'독보적 가치. 대체 불가 포지셔닝.'},{score:5,desc:'구독 없이는 불편한 생활 필수재 수준 달성.'}], ai_trigger:{threshold:2,warning:'subscription_value_weak'} },
        { id:'bc_1_2', label:'콘텐츠·상품 큐레이션 수준', type:'bars', question:'개인화된 추천을 통한 사용자 경험 고도화를 갖추고 있습니까?', scale:[{score:1,desc:'큐레이션 없음. 동일 상품 반복 발송.'},{score:2,desc:'기본 카테고리 분류. 개인화 없음.'},{score:3,desc:'구매 이력 기반 기본 개인화.'},{score:4,desc:'AI 기반 개인화 큐레이션. 만족도 80% 이상.'},{score:5,desc:'초개인화 AI 큐레이션. 이탈율 업계 최저 달성.'}], ai_trigger:{threshold:2,warning:'curation_not_personalized'} },
        { id:'bc_1_3', label:'신규 콘텐츠·상품 업데이트', type:'bars', question:'정기적이고 규칙적인 업데이트 체계를 갖추고 있습니까?', scale:[{score:1,desc:'업데이트 없음. 출시 콘텐츠 그대로.'},{score:2,desc:'비정기 업데이트. 예측 불가.'},{score:3,desc:'월 1회 이상 정기 업데이트.'},{score:4,desc:'주 1회 이상 업데이트. 예고 캘린더 운영.'},{score:5,desc:'실시간 콘텐츠 추가. 구독자 기대감 극대화.'}], ai_trigger:{threshold:2,warning:'content_update_irregular'} },
        { id:'bc_1_4', label:'구독자 커뮤니티 활성도', type:'bars', question:'구독자 간 결속력 및 소속감 유도 체계를 갖추고 있습니까?', scale:[{score:1,desc:'커뮤니티 없음. 구독자 간 연결 전무.'},{score:2,desc:'SNS 채널 보유. 활성화 없음.'},{score:3,desc:'구독자 전용 커뮤니티 운영. 월 1회 이벤트.'},{score:4,desc:'커뮤니티 DAU 높음. 구독자 간 자발적 소통.'},{score:5,desc:'팬덤 커뮤니티 완성. 커뮤니티가 이탈 방어 주요 수단.'}], ai_trigger:{threshold:2,warning:'community_inactive'} },
      ]
    },
    {
      id: 'sub_acquisition',
      label: '구독자 획득 및 전환',
      icon: '🎯',
      items: [
        { id:'bc_2_1', label:'무료체험→유료 전환율', type:'bars', question:'체험 고객이 결제 고객으로 이어지는 효율을 관리하고 있습니까?', scale:[{score:1,desc:'전환율 측정 없음.'},{score:2,desc:'전환율 10% 미만. 개선 전략 없음.'},{score:3,desc:'전환율 15% 이상. 전환 유도 캠페인 운영.'},{score:4,desc:'전환율 25% 이상. A/B 테스트 기반 최적화.'},{score:5,desc:'전환율 35% 이상. AI 기반 개인화 전환 유도.'}], ai_trigger:{threshold:2,warning:'trial_conversion_low'} },
        { id:'bc_2_2', label:'광고비 대비 구독 CAC', type:'bars', question:'획득 비용을 LTV 범위 내에서 관리하는 능력을 갖추고 있습니까?', scale:[{score:1,desc:'CAC 측정 없음. 광고비 효율 파악 불가.'},{score:2,desc:'전체 CAC 파악. LTV 대비 미관리.'},{score:3,desc:'채널별 CAC 집계. LTV 3배 목표 관리.'},{score:4,desc:'CAC 최적화. LTV/CAC 4배 이상 유지.'},{score:5,desc:'CAC 실시간 최적화. LTV/CAC 5배 이상 달성.'}], ai_trigger:{threshold:2,warning:'cac_ltv_imbalanced'} },
        { id:'bc_2_3', label:'소셜·바이럴 유입 비중', type:'bars', question:'마케팅 비용 없는 자발적 유입의 비율을 관리하고 있습니까?', scale:[{score:1,desc:'바이럴 없음. 광고 100% 의존.'},{score:2,desc:'바이럴 유입 10% 미만.'},{score:3,desc:'바이럴 유입 20% 이상. 레퍼럴 프로그램 운영.'},{score:4,desc:'바이럴 유입 35% 이상. 자발적 공유 유도 체계.'},{score:5,desc:'바이럴 유입 50% 이상. 광고 의존도 최소화 달성.'}], ai_trigger:{threshold:2,warning:'viral_growth_low'} },
        { id:'bc_2_4', label:'첫 결제 후 2회차 유지율', type:'bars', question:'첫 결제 이후의 즉각적인 이탈 방지 수준을 갖추고 있습니까?', scale:[{score:1,desc:'2회차 유지율 측정 없음.'},{score:2,desc:'2회차 유지율 50% 미만.'},{score:3,desc:'2회차 유지율 70% 이상. 첫 경험 최적화.'},{score:4,desc:'2회차 유지율 80% 이상. 개인화 첫 경험.'},{score:5,desc:'2회차 유지율 90% 이상. 즉각 가치 전달 완성.'}], ai_trigger:{threshold:2,warning:'second_month_churn_high'} },
      ]
    },
    {
      id: 'sub_retention',
      label: '유지 및 해지 관리',
      icon: '🔒',
      items: [
        { id:'bc_3_1', label:'월간 해지율(Churn Rate)', type:'bars', question:'구독을 중단하는 유저의 비율 통제력을 갖추고 있습니까?', scale:[{score:1,desc:'Churn 측정 없음.'},{score:2,desc:'Churn 월 5% 이상. 관리 없음.'},{score:3,desc:'Churn 3% 이하 목표 관리.'},{score:4,desc:'Churn 2% 이하 유지. 이탈 원인 자동 분석.'},{score:5,desc:'Churn 1% 이하 달성. AI 이탈 예측 완성.'}], ai_trigger:{threshold:2,warning:'churn_rate_high'} },
        { id:'bc_3_2', label:'해지 이유 분석 체계', type:'bars', question:'데이터에 기반한 해지 원인 파악 및 개선 루프를 갖추고 있습니까?', scale:[{score:1,desc:'해지 이유 파악 없음.'},{score:2,desc:'해지 시 간단한 설문. 분석 없음.'},{score:3,desc:'해지 사유 분류 체계. 월 단위 개선.'},{score:4,desc:'해지 패턴 AI 분석. 제품 개선 자동 연결.'},{score:5,desc:'해지 예측 모델. 사전 개입으로 해지 차단.'}], ai_trigger:{threshold:2,warning:'churn_analysis_missing'} },
        { id:'bc_3_3', label:'해지 고객 재활성화', type:'bars', question:'휴면·해지 고객을 다시 불러오는 자동 캠페인을 갖추고 있습니까?', scale:[{score:1,desc:'재활성화 캠페인 없음.'},{score:2,desc:'일반 뉴스레터만 발송. 개인화 없음.'},{score:3,desc:'해지 후 30일 재활성화 자동 이메일.'},{score:4,desc:'세그먼트별 맞춤 재활성화 캠페인. 복귀율 10% 이상.'},{score:5,desc:'AI 기반 개인화 재활성화. 복귀율 20% 이상.'}], ai_trigger:{threshold:2,warning:'win_back_missing'} },
        { id:'bc_3_4', label:'해지 방어(Save) 오퍼', type:'bars', question:'해지 클릭 시 제시하는 단계별 혜택 체계를 갖추고 있습니까?', scale:[{score:1,desc:'Save 오퍼 없음. 해지 즉시 처리.'},{score:2,desc:'단순 할인 1회 제안.'},{score:3,desc:'단계별 Save 오퍼. 구독 일시정지 옵션.'},{score:4,desc:'개인화 Save 오퍼. 해지 방어율 30% 이상.'},{score:5,desc:'AI 기반 최적 Save 오퍼. 해지 방어율 50% 이상.'}], ai_trigger:{threshold:2,warning:'save_offer_missing'} },
      ]
    },
    {
      id: 'sub_scale',
      label: '수익 구조 및 확장',
      icon: '💰',
      items: [
        { id:'bc_4_1', label:'ARPU(인당 평균 결제액)', type:'bars', question:'구독자당 창출되는 매출의 지속 성장 여부를 관리하고 있습니까?', scale:[{score:1,desc:'ARPU 측정 없음.'},{score:2,desc:'ARPU 정체. 성장 전략 없음.'},{score:3,desc:'ARPU 분기 성장. 업셀 기본 운영.'},{score:4,desc:'ARPU 연 10% 이상 성장. 다단계 플랜 최적화.'},{score:5,desc:'ARPU 연 20% 이상 성장. 번들링·업셀 자동화.'}], ai_trigger:{threshold:2,warning:'arpu_stagnant'} },
        { id:'bc_4_2', label:'번들링·티어 요금제', type:'bars', question:'상품 묶음 판매 및 다단계 요금 최적화를 갖추고 있습니까?', scale:[{score:1,desc:'단일 플랜만 존재.'},{score:2,desc:'2개 플랜 운영. 번들링 없음.'},{score:3,desc:'3개 이상 티어 플랜. 기본 번들링.'},{score:4,desc:'다단계 번들링 최적화. 업셀 자동 추천.'},{score:5,desc:'AI 기반 동적 번들링. ARPU 최적화 자동화.'}], ai_trigger:{threshold:2,warning:'bundling_not_optimized'} },
        { id:'bc_4_3', label:'파트너십·제휴 매출', type:'bars', question:'외부 제휴를 통한 추가 매출 확보 능력을 갖추고 있습니까?', scale:[{score:1,desc:'제휴 없음. 구독 매출만 존재.'},{score:2,desc:'소수 제휴 시도. 매출 기여 미미.'},{score:3,desc:'제휴 매출 10% 이상. 정기 파트너십 운영.'},{score:4,desc:'제휴 매출 20% 이상. 전략적 파트너십 완성.'},{score:5,desc:'제휴 생태계 구축. 파트너 매출 30% 이상.'}], ai_trigger:{threshold:2,warning:'partnership_revenue_low'} },
        { id:'bc_4_4', label:'구독 외 추가 수익', type:'bars', question:'굿즈 판매 등 구독 서비스 기반 파생 매출을 갖추고 있습니까?', scale:[{score:1,desc:'구독 외 수익 없음.'},{score:2,desc:'부가 수익 검토 중. 미실행.'},{score:3,desc:'굿즈·이벤트 등 부가 수익 10% 이상.'},{score:4,desc:'부가 수익 다각화. 전체 매출 20% 이상.'},{score:5,desc:'구독 기반 수익 생태계 완성. 부가 수익 30% 이상.'}], ai_trigger:{threshold:2,warning:'additional_revenue_missing'} },
      ]
    },
  ],
  ai_analysis: [
    { trigger:'churn_rate_high+cac_ltv_imbalanced', level:'CRITICAL', msg:'해지율과 CAC가 동시에 높으면 신규 유치가 무의미합니다. 해지 방어를 우선 처방합니다.' },
    { trigger:'trial_conversion_low+subscription_value_weak', level:'HIGH', msg:'체험은 많으나 전환이 낮으면 가치 전달 실패입니다. 온보딩 경험 개선을 처방합니다.' },
    { trigger:'arpu_stagnant+bundling_not_optimized', level:'HIGH', msg:'ARPU가 정체된 경우 단일 플랜에서 벗어나 티어 요금제 및 번들링 업셀을 제안합니다.' },
  ],
};
if (typeof window !== 'undefined') window.BM_B2C_SUB = BM_B2C_SUB;
if (typeof module !== 'undefined') module.exports = BM_B2C_SUB;
