const BM_B2B_SAAS = {
  id: 'b2b_saas',
  label: 'B2B SaaS',
  icon: '☁️',
  description: '소프트웨어 및 데이터를 중앙 호스팅하고 사용자가 클라이언트를 통해 접속·이용하는 형태. MRR/ARR·LTV/CAC·Churn Rate가 핵심 지표.',
  keyMetrics: ['MRR/ARR', 'LTV/CAC', 'Churn Rate', 'NPS'],
  areas: [
    {
      id: 'saas_product',
      label: '제품 경쟁력 및 기능 완성도',
      icon: '🛠️',
      items: [
        { id:'bs_1_1', label:'핵심 기능의 시장 차별성', type:'bars', question:'유사 제품 대비 독보적 우위 및 기술적 장벽을 보유하고 있습니까?', scale:[{score:1,desc:'차별성 없음. 경쟁사 모방 용이.'},{score:2,desc:'일부 차별화 존재. 경쟁사가 빠르게 추격 중.'},{score:3,desc:'명확한 차별화 포인트 1~2개 보유.'},{score:4,desc:'독보적 기술 우위. 경쟁사 대비 6개월 이상 앞서 있음.'},{score:5,desc:'특허·독점 기술로 진입 장벽 완성. 대체 불가 포지셔닝.'}], ai_trigger:{threshold:2,warning:'product_differentiation_weak'} },
        { id:'bs_1_2', label:'UI/UX 사용 편의성', type:'bars', question:'사용자 이탈을 방지하는 직관적인 인터페이스 수준을 갖추고 있습니까?', scale:[{score:1,desc:'UI/UX 고려 없음. 사용자 이탈 빈번.'},{score:2,desc:'기본 UI 존재. 사용자 불편 다수.'},{score:3,desc:'주요 플로우 UX 개선 완료. 만족도 보통.'},{score:4,desc:'직관적 UI/UX. 온보딩 이탈률 20% 이하.'},{score:5,desc:'UX 업계 최고 수준. 온보딩 이탈률 5% 이하.'}], ai_trigger:{threshold:2,warning:'ux_friction_high'} },
        { id:'bs_1_3', label:'기능 업데이트 주기·로드맵', type:'bars', question:'시장 요구를 반영한 정기적 배포 체계를 갖추고 있습니까?', scale:[{score:1,desc:'업데이트 없음. 출시 버전 그대로 유지.'},{score:2,desc:'비정기 업데이트. 고객 요청 대응 수준.'},{score:3,desc:'월 1회 이상 정기 업데이트. 로드맵 내부 보유.'},{score:4,desc:'2주 스프린트 기반 배포. 공개 로드맵 운영.'},{score:5,desc:'CI/CD 자동 배포. 고객 피드백 48시간 내 반영 체계.'}], ai_trigger:{threshold:2,warning:'update_cycle_slow'} },
        { id:'bs_1_4', label:'보안·데이터 컴플라이언스', type:'bars', question:'B2B 거래 필수 보안 인증 및 규제 준수를 갖추고 있습니까?', scale:[{score:1,desc:'보안 인증 없음. 기업 고객 신뢰 확보 불가.'},{score:2,desc:'기본 SSL·방화벽만 적용.'},{score:3,desc:'ISO 27001 또는 동급 인증 보유.'},{score:4,desc:'ISMS·SOC2 등 복수 인증 완비.'},{score:5,desc:'엔터프라이즈급 보안 완성. 정부·금융권 납품 가능.'}], ai_trigger:{threshold:2,warning:'security_certification_missing'} },
      ]
    },
    {
      id: 'saas_sales',
      label: '고객 획득 및 온보딩',
      icon: '🎯',
      items: [
        { id:'bs_2_1', label:'리드→유료 전환율', type:'bars', question:'유료 고객으로 전환되는 퍼널의 효율성을 관리하고 있습니까?', scale:[{score:1,desc:'전환율 측정 없음. 퍼널 관리 전무.'},{score:2,desc:'전환율 대략 파악. 개선 전략 없음.'},{score:3,desc:'단계별 전환율 집계. 주요 이탈 구간 파악.'},{score:4,desc:'전환율 20% 이상. A/B 테스트 기반 최적화.'},{score:5,desc:'전환율 30% 이상. AI 기반 퍼널 자동 최적화.'}], ai_trigger:{threshold:2,warning:'conversion_rate_low'} },
        { id:'bs_2_2', label:'온보딩 완료 소요 기간', type:'bars', question:'고객이 가치를 느끼기까지 걸리는 시간(Time-to-Value) 최적화를 하고 있습니까?', scale:[{score:1,desc:'온보딩 체계 없음. 고객 자력 학습.'},{score:2,desc:'기본 매뉴얼 제공. TTV 2주 이상.'},{score:3,desc:'온보딩 가이드 완비. TTV 1주 이내.'},{score:4,desc:'인터랙티브 온보딩. TTV 3일 이내.'},{score:5,desc:'AI 온보딩 자동화. TTV 당일 달성 체계.'}], ai_trigger:{threshold:2,warning:'onboarding_too_long'} },
        { id:'bs_2_3', label:'무료→유료 전환 유도 체계', type:'bars', question:'결제를 유도하는 자동화된 가이드 시스템을 보유하고 있습니까?', scale:[{score:1,desc:'전환 유도 없음. 고객 자발적 결제만 기대.'},{score:2,desc:'이메일 1~2회 발송 수준.'},{score:3,desc:'사용량 기반 자동 넛지 메시지 운영.'},{score:4,desc:'행동 데이터 기반 개인화 전환 캠페인.'},{score:5,desc:'AI 기반 최적 전환 타이밍 자동 감지 + 개인화 오퍼.'}], ai_trigger:{threshold:2,warning:'freemium_conversion_weak'} },
        { id:'bs_2_4', label:'초기 이탈(Churn) 방지 체계', type:'bars', question:'가입 초기 이탈을 막는 튜토리얼 및 지원 체계를 갖추고 있습니까?', scale:[{score:1,desc:'초기 이탈 방치. 가입 후 연락 없음.'},{score:2,desc:'웰컴 이메일만 발송.'},{score:3,desc:'튜토리얼 + 초기 CS 지원 체계.'},{score:4,desc:'초기 30일 집중 지원. 이탈률 10% 이하.'},{score:5,desc:'AI 이탈 예측 + 선제 개입. 초기 이탈률 5% 이하.'}], ai_trigger:{threshold:2,warning:'early_churn_high'} },
      ]
    },
    {
      id: 'saas_revenue',
      label: '수익 구조 및 재무 지표',
      icon: '💰',
      items: [
        { id:'bs_3_1', label:'MRR/ARR 데이터 관리', type:'bars', question:'월간/연간 반복 매출의 실시간 추적 및 가시성을 확보하고 있습니까?', scale:[{score:1,desc:'MRR/ARR 개념 없음. 매출만 집계.'},{score:2,desc:'월 매출 집계. MRR 미산출.'},{score:3,desc:'MRR/ARR 월 단위 산출. 트렌드 파악.'},{score:4,desc:'MRR 실시간 대시보드. Churn MRR·Expansion MRR 분리.'},{score:5,desc:'MRR 자동화 완성. 코호트별 ARR 예측 AI 운영.'}], ai_trigger:{threshold:2,warning:'mrr_tracking_missing'} },
        { id:'bs_3_2', label:'LTV 대비 CAC 비율', type:'bars', question:'고객 획득 비용 대비 고객 생애 가치의 적정성(3배 이상)을 관리하고 있습니까?', scale:[{score:1,desc:'LTV·CAC 개념 없음. 측정 전무.'},{score:2,desc:'CAC만 파악. LTV 미산출.'},{score:3,desc:'LTV/CAC 분기 산출. 3배 목표 인지.'},{score:4,desc:'LTV/CAC 3배 이상 유지. 채널별 CAC 최적화.'},{score:5,desc:'LTV/CAC 5배 이상. AI 기반 채널별 자동 최적화.'}], ai_trigger:{threshold:2,warning:'ltv_cac_below_3x'} },
        { id:'bs_3_3', label:'요금제 구조 최적화', type:'bars', question:'고객 규모별 다단계 플랜 운영의 적절성을 갖추고 있습니까?', scale:[{score:1,desc:'단일 요금제만 존재.'},{score:2,desc:'2개 플랜 운영. 업셀 체계 없음.'},{score:3,desc:'3개 이상 플랜. 기본 업셀 유도.'},{score:4,desc:'사용량·기능 기반 다단계 플랜 최적화.'},{score:5,desc:'AI 기반 동적 가격 최적화. 업셀 자동 추천.'}], ai_trigger:{threshold:2,warning:'pricing_structure_weak'} },
        { id:'bs_3_4', label:'결제 실패·이탈 자동 대응', type:'bars', question:'카드 오류 등 결제 누락 방지 복구 체계를 갖추고 있습니까?', scale:[{score:1,desc:'결제 실패 방치. 자동 해지로 이어짐.'},{score:2,desc:'결제 실패 시 이메일 1회 발송.'},{score:3,desc:'결제 실패 자동 재시도 + 알림 3회.'},{score:4,desc:'Dunning 자동화. 결제 실패 복구율 70% 이상.'},{score:5,desc:'결제 실패 복구율 90% 이상. Involuntary Churn 최소화.'}], ai_trigger:{threshold:2,warning:'payment_failure_unmanaged'} },
      ]
    },
    {
      id: 'saas_growth',
      label: '고객 성공 및 확장',
      icon: '📈',
      items: [
        { id:'bs_4_1', label:'계약 갱신율(Renewal Rate)', type:'bars', question:'기존 고객의 지속적 재계약 비중을 관리하고 있습니까?', scale:[{score:1,desc:'갱신율 측정 없음.'},{score:2,desc:'갱신율 대략 파악. 개선 전략 없음.'},{score:3,desc:'갱신율 80% 이상. 만료 전 자동 알림.'},{score:4,desc:'갱신율 90% 이상. 갱신 전담 CS 운영.'},{score:5,desc:'갱신율 95% 이상. AI 이탈 예측 + 선제 갱신 유도.'}], ai_trigger:{threshold:2,warning:'renewal_rate_low'} },
        { id:'bs_4_2', label:'업셀·크로스셀 매출 비중', type:'bars', question:'상위 플랜으로의 업그레이드 매출 비중을 관리하고 있습니까?', scale:[{score:1,desc:'업셀·크로스셀 없음. 신규 획득에만 집중.'},{score:2,desc:'간헐적 업셀 시도. 체계 없음.'},{score:3,desc:'업셀 매출 비중 10% 이상. 기본 체계 운영.'},{score:4,desc:'업셀·크로스셀 매출 20% 이상. 자동화 캠페인.'},{score:5,desc:'NRR 120% 이상. 기존 고객이 성장의 주 엔진.'}], ai_trigger:{threshold:2,warning:'expansion_revenue_low'} },
        { id:'bs_4_3', label:'고객 성공(CS) 전담 체계', type:'bars', question:'고객의 성장을 돕는 전담팀 운영 여부를 갖추고 있습니까?', scale:[{score:1,desc:'CS 전담 없음. 문의 시에만 대응.'},{score:2,desc:'공통 CS팀이 SaaS 지원 병행.'},{score:3,desc:'CSM 1명 이상 전담. 주요 고객 관리.'},{score:4,desc:'세그먼트별 CSM 배정. 성공 지표 공동 관리.'},{score:5,desc:'고객 성공 플랫폼 운영. CSM + AI 자동화 하이브리드.'}], ai_trigger:{threshold:2,warning:'csm_missing'} },
        { id:'bs_4_4', label:'NPS(순추천지수) 관리', type:'bars', question:'고객의 자발적 추천을 유도하는 충성도 관리를 하고 있습니까?', scale:[{score:1,desc:'NPS 측정 없음.'},{score:2,desc:'NPS 연 1회 측정. 개선 없음.'},{score:3,desc:'NPS 분기 측정. 디트랙터 개선 활동.'},{score:4,desc:'NPS 50 이상 유지. 프로모터 레퍼럴 프로그램.'},{score:5,desc:'NPS 70 이상. 고객이 영업사원이 되는 구조 완성.'}], ai_trigger:{threshold:2,warning:'nps_unmanaged'} },
      ]
    },
  ],
  ai_analysis: [
    { trigger:'conversion_rate_low+onboarding_too_long', level:'CRITICAL', msg:'리드가 많으나 전환율이 낮을 경우 온보딩 복잡성이 원인입니다. UX 개선 및 자동화를 처방합니다.' },
    { trigger:'ltv_cac_below_3x+renewal_rate_low', level:'CRITICAL', msg:'CAC가 높고 갱신율이 낮으면 획득보다 유지가 시급한 상황입니다. CS 강화를 우선 처방합니다.' },
    { trigger:'mrr_tracking_missing+early_churn_high', level:'HIGH', msg:'MRR 성장 중이나 Churn이 높다면 밑 빠진 독에 물 붓기입니다. 이탈 원인 분석을 최우선 처방합니다.' },
  ],
};
if (typeof window !== 'undefined') window.BM_B2B_SAAS = BM_B2B_SAAS;
if (typeof module !== 'undefined') module.exports = BM_B2B_SAAS;
