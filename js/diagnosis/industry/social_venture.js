const INDUSTRY_SOCIAL_VENTURE = {
  id: 'social_venture',
  label: '소셜벤처 / 소셜벤쳐',
  icon: '🌱',
  description: '임팩트 중심의 혁신적 비즈니스 모델을 가진 벤처형 기업에 대한 진단입니다.',
  areas: [
    {
      id: 'sv_product',
      label: '제품·서비스 혁신',
      icon: '🧩',
      items: [
        { id:'sv_1_1', label:'문제-해결 적합성(Problem-Solution Fit)', type:'bars', question:'제안하는 제품/서비스가 사회문제를 실질적으로 해결합니까?', scale:[{score:1,desc:'문제 정의 불명확'},{score:3,desc:'초기 검증 사례 존재'},{score:5,desc:'검증된 해결 효과와 재현성 보유'}] },
        { id:'sv_1_2', label:'혁신성·차별성', type:'bars', question:'동종 솔루션 대비 명확한 차별화 지점(기술·네트워크·콘텐츠 등)이 있습니까?', scale:[{score:1,desc:'차별점 없음'},{score:3,desc:'일부 차별화'},{score:5,desc:'기술·데이터·네트워크 우위 보유'}] }
      ]
    },
    {
      id: 'sv_growth',
      label: '성장 전략 및 자금',
      icon: '🚀',
      items: [
        { id:'sv_2_1', label:'스케일 가능성', type:'bars', question:'비즈니스 모델이 확장성과 반복가능성을 갖추고 있습니까?', scale:[{score:1,desc:'지역/단일 고객 의존'},{score:3,desc:'제한적 확장 루트'},{score:5,desc:'글로벌·플랫폼 확장 가능'}] },
        { id:'sv_2_2', label:'자금조달 준비도', type:'bars', question:'투자유치·보조금·공모 등 다양한 자금조달 경로가 준비되어 있습니까?', scale:[{score:1,desc:'자금 취약'},{score:3,desc:'단기 자금 확보 가능'},{score:5,desc:'투자사 연결·보조금 승인 이력'}] }
      ]
    },
    {
      id: 'sv_market',
      label: '시장·임팩트 검증',
      icon: '📈',
      items: [
        { id:'sv_3_1', label:'수요 검증', type:'bars', question:'타깃 수혜자·고객의 수요가 명확히 확인되었습니까?', scale:[{score:1,desc:'검증 없음'},{score:3,desc:'파일럿·파일럿 결과 일부'},{score:5,desc:'반복적 수요·계약 확보'}] },
        { id:'sv_3_2', label:'임팩트·비즈니스 균형', type:'bars', question:'임팩트 성과와 수익성 간 균형을 유지하는 전략이 있습니까?', scale:[{score:1,desc:'임팩트만 있고 수익 미약'},{score:3,desc:'균형 시도 중'},{score:5,desc:'임팩트와 수익 동시 달성 사례 보유'}] }
      ]
    }
  ],
  ai_analysis: [
    { trigger:'sv_1_1+sv_3_1', level:'HIGH', msg:'제품·수요 검증이 약하면 투자 유치와 확장이 어렵습니다. 우선 파일럿을 통한 명확한 수요 증거를 만들고 MVP 개선에 집중하세요.' }
  ]
};

if (typeof window !== 'undefined') window.INDUSTRY_SOCIAL_VENTURE = INDUSTRY_SOCIAL_VENTURE;
if (typeof module !== 'undefined') module.exports = INDUSTRY_SOCIAL_VENTURE;
