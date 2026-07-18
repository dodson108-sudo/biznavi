const INDUSTRY_SOCIAL_ENTERPRISE = {
  id: 'social_enterprise',
  label: '사회적기업',
  icon: '🤝',
  description: '사회적 가치를 창출하는 비즈니스 모델(취약계층 고용, 지역사회 기여, 사회문제 해결 등)에 초점을 맞춘 기업 진단입니다.',
  areas: [
    {
      id: 'se_mission',
      label: '임무·사회적 임팩트',
      icon: '🎯',
      items: [
        { id:'se_1_1', label:'사회적 목표의 명확성', type:'bars', question:'사업의 사회적 목적(취약계층 고용·사회문제 해결 등)이 명확히 정의되어 있습니까?', scale:[{score:1,desc:'목표 없음 또는 모호'},{score:3,desc:'목표 존재하나 문서화 미흡'},{score:5,desc:'구체적 KPI와 측정체계 보유'}] },
        { id:'se_1_2', label:'임팩트 측정 체계', type:'bars', question:'사회적 성과를 정량·정성적으로 측정하는 체계가 있습니까?', scale:[{score:1,desc:'측정 전무'},{score:3,desc:'부분 측정(사례 중심)'},{score:5,desc:'정기적 리포트·지표 운영'}] },
        { id:'se_1_3', label:'이해관계자 참여', type:'bars', question:'수혜자·지역사회·투자자 등 이해관계자 참여 루프가 운영되고 있습니까?', scale:[{score:1,desc:'피드백 없음'},{score:3,desc:'간헐적 의견수렴'},{score:5,desc:'정기 참여·공개 보고'}] }
      ]
    },
    {
      id: 'se_business',
      label: '비즈니스 지속가능성',
      icon: '💼',
      items: [
        { id:'se_2_1', label:'수익모델 다각화', type:'bars', question:'사회적 목적과 결합된 수익모델(제품판매·서비스·구독 등)을 보유하고 있습니까?', scale:[{score:1,desc:'수익 모델 부재'},{score:3,desc:'단일 채널 의존'},{score:5,desc:'여러 채널·매출원 확보'}] },
        { id:'se_2_2', label:'재무 건전성', type:'bars', question:'영업이익·현금흐름 추세가 안정적이며 지속가능한가요?', scale:[{score:1,desc:'재무 취약'},{score:3,desc:'계절적 변동 있음'},{score:5,desc:'안정적 흑자 또는 자금확보 루트'}] },
        { id:'se_2_3', label:'협업·네트워크', type:'bars', question:'지역사회·공공기관·NGO 등과의 협업 네트워크가 활성화되어 있습니까?', scale:[{score:1,desc:'협업 없음'},{score:3,desc:'협업 일부'},{score:5,desc:'전략적 파트너십 운영'}] }
      ]
    },
    {
      id: 'se_ops',
      label: '운영·거버넌스',
      icon: '⚙️',
      items: [
        { id:'se_3_1', label:'조직구조와 책임', type:'bars', question:'사회적 목적을 실행하기 위한 조직구조와 역할·책임이 명확합니까?', scale:[{score:1,desc:'역할 불분명'},{score:3,desc:'문서화 일부'},{score:5,desc:'명확한 책임·성과체계'}] },
        { id:'se_3_2', label:'지속가능한 고용관행', type:'bars', question:'취약계층 채용·교육·유지 전략이 체계화되어 있습니까?', scale:[{score:1,desc:'정책 없음'},{score:3,desc:'일부 프로그램 운영'},{score:5,desc:'정규직 전환·교육 루트 보유'}] },
        { id:'se_3_3', label:'공시·투명성', type:'bars', question:'활동 내역·재무·임팩트 정보를 외부에 공시하고 있습니까?', scale:[{score:1,desc:'공시 전무'},{score:3,desc:'부분 공시'},{score:5,desc:'정기 공시 및 공개 리포트'}] }
      ]
    }
  ],
  ai_analysis: [
    { trigger:'se_2_2+se_1_2', level:'HIGH', msg:'재무 취약성과 임팩트 측정 부족이 동시에 관찰됩니다. 우선 재무 건전성 확보를 위한 수익성 개선안과 임팩트 지표 간소화를 권장합니다.' }
  ]
};

if (typeof window !== 'undefined') window.INDUSTRY_SOCIAL_ENTERPRISE = INDUSTRY_SOCIAL_ENTERPRISE;
if (typeof module !== 'undefined') module.exports = INDUSTRY_SOCIAL_ENTERPRISE;
