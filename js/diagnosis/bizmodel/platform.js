const BM_PLATFORM = {
  id: 'platform',
  label: '플랫폼·마켓플레이스',
  icon: '🏪',
  description: '공급자와 수요자를 연결하여 거래를 발생시키는 플랫폼. GMV·매칭률·네트워크 효과가 핵심.',
  keyMetrics: ['GMV', '매칭률', 'MAU', '네트워크 효과'],
  areas: [
    {
      id: 'plt_liquidity',
      label: '공급자·수요자 균형',
      icon: '⚖️',
      items: [
        { id:'pl_1_1', label:'공급자 충분성 및 품질', type:'bars', question:'거래를 발생시킬 충분한 공급 인프라를 갖추고 있습니까?', scale:[{score:1,desc:'공급자 절대 부족. 거래 발생 불가.'},{score:2,desc:'공급자 일부 확보. 수요 대비 부족.'},{score:3,desc:'공급자 충분. 품질 기준 일부 적용.'},{score:4,desc:'공급자 풍부 + 품질 심사 체계 완비.'},{score:5,desc:'공급자 생태계 완성. 자발적 공급자 유입.'}], ai_trigger:{threshold:2,warning:'supplier_shortage'} },
        { id:'pl_1_2', label:'수요자 활성 수준', type:'bars', question:'플랫폼 내 구매·이용자들의 안정적 유입을 갖추고 있습니까?', scale:[{score:1,desc:'수요자 없음. 공급만 존재.'},{score:2,desc:'수요자 일부. 재방문율 낮음.'},{score:3,desc:'수요자 안정적 유입. MAU 성장 중.'},{score:4,desc:'수요자 급성장. 자연 유입 비중 높음.'},{score:5,desc:'수요자 생태계 완성. 네트워크 효과 가동.'}], ai_trigger:{threshold:2,warning:'demand_side_weak'} },
        { id:'pl_1_3', label:'공급자 이탈 방지', type:'bars', question:'플랫폼에 남아야 할 강력한 유인 구조를 갖추고 있습니까?', scale:[{score:1,desc:'공급자 이탈 빈번. 유인 구조 없음.'},{score:2,desc:'기본 수수료 인센티브만 운영.'},{score:3,desc:'공급자 전용 혜택 + 성과 지원 체계.'},{score:4,desc:'공급자 Lock-in 체계 완성. 이탈률 5% 이하.'},{score:5,desc:'공급자가 플랫폼 없이 사업 불가 구조 달성.'}], ai_trigger:{threshold:2,warning:'supplier_churn_high'} },
        { id:'pl_1_4', label:'수요자 락인(Lock-in) 체계', type:'bars', question:'재방문을 유도하는 서비스적 장치를 갖추고 있습니까?', scale:[{score:1,desc:'Lock-in 없음. 경쟁 플랫폼 이동 용이.'},{score:2,desc:'포인트 적립만 운영. 전환 비용 낮음.'},{score:3,desc:'구매 이력·찜 목록 등 데이터 Lock-in.'},{score:4,desc:'멤버십 + 데이터 + 습관 3중 Lock-in.'},{score:5,desc:'전환 비용 완전 형성. 이탈 사실상 불가 구조.'}], ai_trigger:{threshold:2,warning:'user_lockin_weak'} },
      ]
    },
    {
      id: 'plt_trust',
      label: '거래 활성화 및 신뢰',
      icon: '🛡️',
      items: [
        { id:'pl_2_1', label:'매칭 성공률 및 품질', type:'bars', question:'수요와 공급의 정밀한 연결 능력을 갖추고 있습니까?', scale:[{score:1,desc:'매칭 알고리즘 없음. 임의 연결.'},{score:2,desc:'기본 카테고리 매칭. 정밀도 낮음.'},{score:3,desc:'다변수 매칭 알고리즘 운영. 성공률 70% 이상.'},{score:4,desc:'AI 기반 정밀 매칭. 성공률 85% 이상.'},{score:5,desc:'초정밀 매칭 AI. 성공률 95% 이상. 만족도 최고.'}], ai_trigger:{threshold:2,warning:'matching_quality_low'} },
        { id:'pl_2_2', label:'리뷰·신뢰 검증', type:'bars', question:'리뷰 조작 차단 및 상호 신뢰 보장 시스템을 갖추고 있습니까?', scale:[{score:1,desc:'리뷰 검증 없음. 어뷰징 만연.'},{score:2,desc:'기본 신고 기능만 운영.'},{score:3,desc:'리뷰 진위 검증 체계. 어뷰징 자동 탐지.'},{score:4,desc:'AI 어뷰징 탐지. 신뢰 점수 체계 운영.'},{score:5,desc:'신뢰 생태계 완성. 플랫폼 신뢰도 업계 최고.'}], ai_trigger:{threshold:2,warning:'trust_verification_weak'} },
        { id:'pl_2_3', label:'분쟁·환불 처리 체계', type:'bars', question:'거래 사고 시 공정하고 신속한 해결 능력을 갖추고 있습니까?', scale:[{score:1,desc:'분쟁 처리 체계 없음. 당사자 해결에 방치.'},{score:2,desc:'기본 CS 대응. 기준 불명확.'},{score:3,desc:'분쟁 처리 SOP 완비. 48시간 내 해결.'},{score:4,desc:'분쟁 처리 24시간 내. 만족도 4.0 이상.'},{score:5,desc:'AI 분쟁 중재. 즉각 해결 + 만족도 4.5 이상.'}], ai_trigger:{threshold:2,warning:'dispute_resolution_weak'} },
        { id:'pl_2_4', label:'사기·어뷰징 탐지', type:'bars', question:'자동화된 탐지 시스템을 통한 생태계 보호를 갖추고 있습니까?', scale:[{score:1,desc:'사기 탐지 없음. 피해 빈번.'},{score:2,desc:'신고 기반 사후 처리만 가능.'},{score:3,desc:'규칙 기반 자동 탐지. 주요 패턴 차단.'},{score:4,desc:'ML 기반 실시간 탐지. 사기율 1% 이하.'},{score:5,desc:'AI 사기 예측. 시도 단계에서 차단 완성.'}], ai_trigger:{threshold:2,warning:'fraud_detection_weak'} },
      ]
    },
    {
      id: 'plt_monetization',
      label: '수익 모델 최적화',
      icon: '💰',
      items: [
        { id:'pl_3_1', label:'수수료 구조 적정성', type:'bars', question:'공급자의 불만을 최소화하는 수수료 설계를 갖추고 있습니까?', scale:[{score:1,desc:'수수료 기준 없음. 임의 책정.'},{score:2,desc:'단일 수수료 구조. 공급자 불만 높음.'},{score:3,desc:'거래 규모별 차등 수수료. 공급자 수용.'},{score:4,desc:'수수료 최적화 완료. 공급자 만족도 높음.'},{score:5,desc:'공급자·수요자 모두 만족하는 수수료 생태계.'}], ai_trigger:{threshold:2,warning:'commission_structure_poor'} },
        { id:'pl_3_2', label:'광고·노출 수익 비중', type:'bars', question:'수수료 외 부가적인 비즈니스 모델 확보를 갖추고 있습니까?', scale:[{score:1,desc:'수수료 수익만 존재.'},{score:2,desc:'기본 광고 상품 운영. 비중 미미.'},{score:3,desc:'광고·노출 수익 15% 이상.'},{score:4,desc:'광고·노출 수익 25% 이상. 다양한 광고 포맷.'},{score:5,desc:'광고 수익 생태계 완성. 수수료 외 수익 40% 이상.'}], ai_trigger:{threshold:2,warning:'ad_revenue_low'} },
        { id:'pl_3_3', label:'멤버십·구독 수익', type:'bars', question:'안정적인 현금 흐름을 위한 반복 매출 체계를 갖추고 있습니까?', scale:[{score:1,desc:'멤버십 없음. 거래 기반 수익만 존재.'},{score:2,desc:'기본 멤버십 운영. 가입률 낮음.'},{score:3,desc:'멤버십 수익 10% 이상. 혜택 체계 완비.'},{score:4,desc:'멤버십 수익 20% 이상. 구독 전환율 높음.'},{score:5,desc:'멤버십이 핵심 수익원. 안정적 MRR 완성.'}], ai_trigger:{threshold:2,warning:'membership_revenue_low'} },
        { id:'pl_3_4', label:'수익 최적화 테스트', type:'bars', question:'A/B 테스트 등을 통한 수익률 극대화 노력을 갖추고 있습니까?', scale:[{score:1,desc:'수익 최적화 테스트 없음.'},{score:2,desc:'간헐적 가격 테스트. 체계 없음.'},{score:3,desc:'분기 1회 이상 A/B 테스트. 결과 반영.'},{score:4,desc:'월 단위 수익 최적화 테스트. 자동화 일부.'},{score:5,desc:'AI 기반 실시간 수익 최적화. 항상 최적 구조 유지.'}], ai_trigger:{threshold:2,warning:'revenue_optimization_missing'} },
      ]
    },
    {
      id: 'plt_growth',
      label: '성장 및 네트워크 효과',
      icon: '📈',
      items: [
        { id:'pl_4_1', label:'MAU(월간 활성 유저) 성장', type:'bars', question:'유저 수의 지속적인 우상향 여부를 관리하고 있습니까?', scale:[{score:1,desc:'MAU 측정 없음. 성장 파악 불가.'},{score:2,desc:'MAU 정체 또는 감소.'},{score:3,desc:'MAU 월 5% 이상 성장.'},{score:4,desc:'MAU 월 10% 이상 성장. 성장 채널 다변화.'},{score:5,desc:'MAU 급성장. 네트워크 효과 본격 가동.'}], ai_trigger:{threshold:2,warning:'mau_growth_stagnant'} },
        { id:'pl_4_2', label:'자연 유입(바이럴) 비중', type:'bars', question:'마케팅비 없는 가입자의 비율을 관리하고 있습니까?', scale:[{score:1,desc:'바이럴 없음. 광고 100% 의존.'},{score:2,desc:'바이럴 유입 10% 미만.'},{score:3,desc:'바이럴 유입 25% 이상. 레퍼럴 프로그램 운영.'},{score:4,desc:'바이럴 유입 40% 이상. 자발적 공유 유도.'},{score:5,desc:'바이럴 유입 60% 이상. 광고 의존도 최소화.'}], ai_trigger:{threshold:2,warning:'viral_growth_weak'} },
        { id:'pl_4_3', label:'네트워크 효과 체감', type:'bars', question:'유저가 늘수록 가치가 커지는 구조인지 확인하고 있습니까?', scale:[{score:1,desc:'네트워크 효과 없음. 유저 증가가 가치 무관.'},{score:2,desc:'미약한 네트워크 효과. 체감 낮음.'},{score:3,desc:'유저 증가 시 가치 향상 체감. 데이터 확인.'},{score:4,desc:'강한 네트워크 효과. 신규 유저 유입 가속화.'},{score:5,desc:'네트워크 효과 완전 가동. 시장 지배적 위치 확립.'}], ai_trigger:{threshold:2,warning:'network_effect_not_working'} },
        { id:'pl_4_4', label:'플랫폼 이탈 장벽', type:'bars', question:'경쟁 플랫폼으로 옮기기 힘든 전환 비용 형성을 갖추고 있습니까?', scale:[{score:1,desc:'전환 비용 없음. 경쟁사 이동 즉시 가능.'},{score:2,desc:'미약한 전환 비용. 경쟁사 프로모션에 쉽게 이탈.'},{score:3,desc:'데이터·이력 기반 전환 비용 일부 형성.'},{score:4,desc:'다층 전환 비용 구조. 이탈률 5% 이하.'},{score:5,desc:'전환 비용 완전 형성. 경쟁사 이탈 사실상 불가.'}], ai_trigger:{threshold:2,warning:'switching_barrier_low'} },
      ]
    },
  ],
  ai_analysis: [
    { trigger:'supplier_shortage+demand_side_weak', level:'CRITICAL', msg:'공급자는 많으나 수요가 부족하면 공급자 이탈로 이어집니다. 수요 확대 마케팅을 최우선 처방합니다.' },
    { trigger:'commission_structure_poor+supplier_churn_high', level:'HIGH', msg:'높은 수수료로 공급자가 이탈하면 수수료 구조 재설계 및 인센티브를 처방합니다.' },
    { trigger:'mau_growth_stagnant+viral_growth_weak', level:'HIGH', msg:'MAU가 정체되고 광고 의존도가 높으면 네트워크 효과 미작동 상황입니다. 리퍼럴 프로그램을 처방합니다.' },
  ],
};
if (typeof window !== 'undefined') window.BM_PLATFORM = BM_PLATFORM;
if (typeof module !== 'undefined') module.exports = BM_PLATFORM;
