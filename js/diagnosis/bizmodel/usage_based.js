const BM_USAGE_BASED = {
  id: 'usage_based',
  label: '종량제 (Usage-Based)',
  icon: '📊',
  description: '제품이나 서비스를 사용한 만큼 비용을 지불하는 모델. API 호출, 클라우드 사용량, 건당 과금 등. 2025년 기준 AI Wrapper 제품 대부분이 이 유형에 해당.',
  keyMetrics: ['Monthly Revenue', 'Gross Margin', 'Dollar-based Net Expansion', 'CAC/LTV'],
  areas: [
    {
      id: 'usage_value',
      label: '사용량 기반 가치 설계',
      icon: '⚙️',
      items: [
        { id:'ub_1_1', label:'과금 단위(Unit) 설계 명확성', type:'bars', question:'API 호출 수·데이터 처리량·건당 등 고객이 직관적으로 이해 가능한 과금 기준이 설정되어 있습니까?', scale:[{score:1,desc:'과금 단위 불명확. 고객 혼란 빈번.'},{score:2,desc:'과금 기준 존재하나 고객 이해도 낮음.'},{score:3,desc:'명확한 과금 단위 설정. 고객 FAQ 제공.'},{score:4,desc:'직관적 과금 단위 + 사용량 계산기 제공.'},{score:5,desc:'가치 기반 과금 설계 완성. 고객 스스로 비용 예측 가능.'}], ai_trigger:{threshold:2,warning:'unit_unclear'} },
        { id:'ub_1_2', label:'사용량-가치 상관관계', type:'bars', question:'고객이 많이 쓸수록 실제로 더 큰 가치를 체감하는 구조(가치 기반 과금 vs 단순 종량)가 설계되어 있습니까?', scale:[{score:1,desc:'단순 종량제. 사용량 증가 시 가치 체감 없음.'},{score:2,desc:'사용량-가치 연관성 낮음. 고객 이탈 빈번.'},{score:3,desc:'일부 구간에서 가치-사용량 상관관계 존재.'},{score:4,desc:'사용량 증가 시 명확한 가치 증대 설계 완료.'},{score:5,desc:'사용량-가치 완전 연동. 고객 자발적 사용량 확대 유도.'}], ai_trigger:{threshold:2,warning:'value_correlation_weak'} },
        { id:'ub_1_3', label:'무료 티어·크레딧 설계', type:'bars', question:'초기 진입 장벽을 낮추는 무료 사용량(Free Tier) 또는 크레딧 시스템의 전략적 적정 수준이 설계되어 있습니까?', scale:[{score:1,desc:'무료 티어 없음. 진입 장벽 높음.'},{score:2,desc:'무료 티어 있으나 전환 유도 설계 없음.'},{score:3,desc:'무료 티어 + 기본 전환 유도 메시지.'},{score:4,desc:'무료→유료 전환 최적화 퍼널 설계 완료.'},{score:5,desc:'크레딧 시스템 + 자동 전환 유도 + 전환율 A/B 테스트 가동.'}], ai_trigger:{threshold:2,warning:'free_tier_unconverted'} },
        { id:'ub_1_4', label:'사용량 예측 가능성', type:'bars', question:'고객이 월 청구액을 예측할 수 있도록 사용량 대시보드·알림 등을 제공하는 투명성 수준을 확보하고 있습니까?', scale:[{score:1,desc:'사용량 확인 방법 없음. 청구 후 고객 충격.'},{score:2,desc:'월 청구서만 제공. 실시간 확인 불가.'},{score:3,desc:'사용량 대시보드 제공. 월 기준 확인 가능.'},{score:4,desc:'실시간 사용량 + 예상 청구액 알림 서비스.'},{score:5,desc:'AI 기반 사용량 예측 + 초과 임박 자동 경보 + 플랜 추천.'}], ai_trigger:{threshold:2,warning:'billing_unpredictable'} },
      ]
    },
    {
      id: 'usage_expansion',
      label: '사용자 확장 및 활성화',
      icon: '📈',
      items: [
        { id:'ub_2_1', label:'Dollar-based Net Expansion', type:'bars', question:'기존 고객의 사용량 증가에 따른 매출 확장률(120% 이상 권장)을 측정하고 있습니까?', scale:[{score:1,desc:'Net Expansion 개념 없음. 측정 전무.'},{score:2,desc:'기존 고객 매출 집계하나 확장률 미산출.'},{score:3,desc:'분기 단위 Net Expansion 측정. 100% 수준.'},{score:4,desc:'월 단위 측정. 110~120% 수준 유지.'},{score:5,desc:'Net Expansion 120% 이상 지속. 자동 확장 유도 체계 가동.'}], ai_trigger:{threshold:2,warning:'net_expansion_low'} },
        { id:'ub_2_2', label:'활성 사용자 증가세', type:'bars', question:'월간 유료 사용자(Paid Active User) 수의 성장 추이를 정기적으로 추적하고 있습니까?', scale:[{score:1,desc:'활성 사용자 측정 없음.'},{score:2,desc:'전체 가입자만 집계. 활성 여부 구분 없음.'},{score:3,desc:'월간 활성 사용자 집계. 추이 모니터링.'},{score:4,desc:'활성 사용자 성장률 목표 관리. 이탈 예측 체계.'},{score:5,desc:'실시간 활성 사용자 대시보드. AI 이탈 예측 + 선제 CS 개입.'}], ai_trigger:{threshold:2,warning:'active_user_stagnant'} },
        { id:'ub_2_3', label:'사용량 증가 유도 체계', type:'bars', question:'고객의 사용량을 자연스럽게 늘리는 기능·콘텐츠·통합 전략이 구축되어 있습니까?', scale:[{score:1,desc:'사용량 증가 유도 전략 없음.'},{score:2,desc:'뉴스레터 기반 단순 기능 소개.'},{score:3,desc:'인앱 가이드 + 사용 팁 콘텐츠 제공.'},{score:4,desc:'사용량 마일스톤 달성 시 보상 + 심화 기능 유도.'},{score:5,desc:'AI 기반 개인화 사용량 증가 추천 + 자동 온보딩 심화.'}], ai_trigger:{threshold:2,warning:'usage_growth_passive'} },
        { id:'ub_2_4', label:'대량 사용 고객 전용 플랜', type:'bars', question:'엔터프라이즈급 고객을 위한 볼륨 디스카운트 또는 커밋 플랜 설계가 완료되어 있습니까?', scale:[{score:1,desc:'단일 요금제만 존재. 대량 고객 이탈 빈번.'},{score:2,desc:'볼륨 디스카운트 구두 협의. 표준화 없음.'},{score:3,desc:'볼륨 디스카운트 공식 정책 보유.'},{score:4,desc:'커밋 플랜 + 전용 지원 체계 구축.'},{score:5,desc:'엔터프라이즈 전용 플랜 + 맞춤 계약 + 전담 CSM 운영.'}], ai_trigger:{threshold:2,warning:'enterprise_plan_missing'} },
      ]
    },
    {
      id: 'usage_margin',
      label: '비용 구조 및 수익성',
      icon: '💰',
      items: [
        { id:'ub_3_1', label:'Gross Margin 관리', type:'bars', question:'사용량 증가에 따른 서버·인프라 비용이 매출 대비 적정한지(목표 60% 이상) 관리하고 있습니까?', scale:[{score:1,desc:'Gross Margin 개념 없음. 인프라 비용 미추적.'},{score:2,desc:'전체 인프라 비용 집계. Margin 산출 없음.'},{score:3,desc:'Gross Margin 분기 산출. 업계 기준 비교.'},{score:4,desc:'Gross Margin 월 단위 관리. 60% 이상 유지.'},{score:5,desc:'실시간 Margin 대시보드. 인프라 비용 자동 최적화.'}], ai_trigger:{threshold:2,warning:'gross_margin_low'} },
        { id:'ub_3_2', label:'인프라 비용 탄력성', type:'bars', question:'트래픽 급증 시 자동 스케일링과 비용 선형화 관리 능력을 보유하고 있습니까?', scale:[{score:1,desc:'트래픽 급증 시 서버 다운. 비용 폭등.'},{score:2,desc:'수동 스케일링. 급증 대응 지연.'},{score:3,desc:'기본 자동 스케일링 설정. 비용 모니터링.'},{score:4,desc:'자동 스케일링 + 비용 상한선 알림 체계.'},{score:5,desc:'트래픽 예측 기반 선제 스케일링. 비용 선형화 완성.'}], ai_trigger:{threshold:2,warning:'infra_cost_inelastic'} },
        { id:'ub_3_3', label:'고객별 수익성 분석', type:'bars', question:'대량 사용 고객 중 실제로 적자인 고객이 있는지 세그먼트별 분석을 실시하고 있습니까?', scale:[{score:1,desc:'고객별 수익성 분석 없음. 매출만 집계.'},{score:2,desc:'상위 고객 매출 파악. 원가 배분 없음.'},{score:3,desc:'고객 세그먼트별 Gross Margin 분기 분석.'},{score:4,desc:'고객별 수익성 월 단위 분석. 적자 고객 즉각 대응.'},{score:5,desc:'실시간 고객별 수익성 대시보드. 자동 요금 재설계 제안.'}], ai_trigger:{threshold:2,warning:'customer_profitability_blind'} },
        { id:'ub_3_4', label:'매출 예측 정확도', type:'bars', question:'사용량 기반 모델 특유의 매출 변동성을 예측하는 데이터 정밀도를 확보하고 있습니까?', scale:[{score:1,desc:'매출 예측 없음. 월말 결산 후 파악.'},{score:2,desc:'전월 대비 단순 추산. 오차율 30% 이상.'},{score:3,desc:'사용량 트렌드 기반 월 예측. 오차율 15% 내외.'},{score:4,desc:'ML 모델 기반 예측. 오차율 10% 이하.'},{score:5,desc:'실시간 매출 예측 대시보드. 오차율 5% 이하. 자동 경영 계획 연동.'}], ai_trigger:{threshold:2,warning:'revenue_prediction_inaccurate'} },
      ]
    },
    {
      id: 'usage_retention',
      label: '이탈 관리 및 장기 가치',
      icon: '🔒',
      items: [
        { id:'ub_4_1', label:'사용량 감소 조기 감지', type:'bars', question:'고객의 사용량이 줄기 시작하는 시점을 자동 탐지하고 CS가 개입하는 체계가 구축되어 있습니까?', scale:[{score:1,desc:'사용량 감소 감지 없음. 해지 후 파악.'},{score:2,desc:'월 단위 사용량 리포트로 사후 확인.'},{score:3,desc:'사용량 감소 감지 후 이메일 자동 발송.'},{score:4,desc:'사용량 감소 임계값 설정. CSM 자동 알림 + 즉각 개입.'},{score:5,desc:'AI 이탈 예측 모델. 감소 조짐 탐지 즉시 개인화 개입 실행.'}], ai_trigger:{threshold:2,warning:'churn_signal_missed'} },
        { id:'ub_4_2', label:'LTV 대비 CAC 비율', type:'bars', question:'사용량 기반 LTV 산출의 정교함과 CAC와의 적정 비율(3배 이상)을 관리하고 있습니까?', scale:[{score:1,desc:'LTV·CAC 개념 없음. 측정 전무.'},{score:2,desc:'단순 평균 매출로 LTV 추산. CAC 미비교.'},{score:3,desc:'LTV/CAC 분기 산출. 3배 목표 인지.'},{score:4,desc:'코호트별 LTV 정밀 산출. CAC 채널별 관리.'},{score:5,desc:'실시간 LTV/CAC 대시보드. 자동 채널 예산 최적화.'}], ai_trigger:{threshold:2,warning:'ltv_cac_imbalanced'} },
        { id:'ub_4_3', label:'장기 계약(Commit) 전환율', type:'bars', question:'종량제에서 연간 약정(Committed Use)으로 전환하는 고객 비중을 관리하고 있습니까?', scale:[{score:1,desc:'연간 약정 플랜 없음. 전환 유도 없음.'},{score:2,desc:'연간 약정 있으나 전환 유도 전략 없음.'},{score:3,desc:'연간 약정 전환율 측정. 기본 할인 제공.'},{score:4,desc:'전환 캠페인 정기 운영. 전환율 목표 관리.'},{score:5,desc:'종량제→약정 자동 전환 유도 퍼널. 전환율 30% 이상 달성.'}], ai_trigger:{threshold:2,warning:'commit_conversion_low'} },
        { id:'ub_4_4', label:'경쟁사 전환 장벽', type:'bars', question:'데이터 이전·API 통합 등 고객이 경쟁사로 이탈하기 어려운 구조적 장벽을 구축하고 있습니까?', scale:[{score:1,desc:'전환 장벽 없음. 경쟁사로 이탈 용이.'},{score:2,desc:'일부 데이터 종속성 존재. 의도적 설계 없음.'},{score:3,desc:'API 통합 깊이 증가로 자연적 전환 비용 형성.'},{score:4,desc:'고객 데이터 자산화 + 전환 비용 의도적 설계.'},{score:5,desc:'생태계 Lock-in 완성. 경쟁사 전환율 1% 미만 달성.'}], ai_trigger:{threshold:2,warning:'switching_barrier_low'} },
      ]
    },
  ],
  ai_analysis: [
    { trigger:'churn_signal_missed+active_user_stagnant', level:'CRITICAL', msg:'사용량이 줄고 있는데 CS가 감지하지 못하면 해지 직전 상태입니다. 사용량 감소 자동 알림 시스템과 고객 성공 매니저(CSM) 개입을 최우선 처방합니다.' },
    { trigger:'gross_margin_low+infra_cost_inelastic', level:'CRITICAL', msg:'매출은 급증하는데 Gross Margin이 하락 중이라면 사용량 증가가 오히려 적자를 키우는 구조입니다. 인프라 비용 최적화와 과금 단가 재설계를 처방합니다.' },
    { trigger:'net_expansion_low+commit_conversion_low', level:'HIGH', msg:'Net Expansion은 높은데 장기 약정 전환율이 낮다면 매출 변동성이 큰 불안정 구조입니다. 연간 커밋 디스카운트와 예측 가능한 청구 플랜 도입을 제안합니다.' },
  ],
};

if (typeof window !== 'undefined') window.BM_USAGE_BASED = BM_USAGE_BASED;
if (typeof module !== 'undefined') module.exports = BM_USAGE_BASED;
