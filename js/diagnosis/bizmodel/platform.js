const BIZMODEL_PLATFORM = {
  id: "platform",
  title: "플랫폼·마켓플레이스 특화 진단",
  areas: [
    {
      id: "balance",
      title: "영역 1: 공급자·수요자 균형",
      description: "양면 시장 밸런스·유인 구조 진단",
      items: [
        { id: "1_1", text: "공급자 수·품질 충분성", min: "부족·품질 낮음", max: "충분·고품질 확보" },
        { id: "1_2", text: "수요자 유입·활성 수준", min: "부족", max: "안정적 유입" },
        { id: "1_3", text: "공급자 이탈 방지 체계", min: "없음", max: "인센티브 완비" },
        { id: "1_4", text: "수요자 재방문 유인 구조", min: "없음", max: "락인 체계 완비" }
      ]
    },
    {
      id: "trust",
      title: "영역 2: 거래 활성화 및 신뢰",
      description: "매칭 품질·리뷰·분쟁 해결 진단",
      items: [
        { id: "2_1", text: "매칭 성공률·품질", min: "낮음", max: "높은 매칭 품질" },
        { id: "2_2", text: "리뷰·평점 신뢰도", min: "조작 의심", max: "검증된 신뢰 체계" },
        { id: "2_3", text: "분쟁·환불 처리 체계", min: "없음·느림", max: "신속·공정 해결" },
        { id: "2_4", text: "사기·어뷰징 방지 체계", min: "미흡", max: "자동 탐지 완비" }
      ]
    },
    {
      id: "revenue",
      title: "영역 3: 수익 모델 최적화",
      description: "수수료 구조·광고·프리미엄 진단",
      items: [
        { id: "3_1", text: "수수료 구조 적정성", min: "공급자 불만 높음", max: "양측 수용 최적화" },
        { id: "3_2", text: "광고·프리미엄 노출 수익", min: "없음", max: "매출 30% 이상" },
        { id: "3_3", text: "구독·멤버십 수익 비중", min: "없음", max: "안정적 MRR 확보" },
        { id: "3_4", text: "데이터 기반 수익 최적화", min: "없음", max: "A/B 테스트 운영" }
      ]
    },
    {
      id: "growth",
      title: "영역 4: 성장 및 네트워크 효과",
      description: "유저 증가·바이럴·락인 진단",
      items: [
        { id: "4_1", text: "월간 활성 유저(MAU) 성장", min: "정체·감소", max: "월 10% 이상 성장" },
        { id: "4_2", text: "자연 유입(바이럴) 비중", min: "없음", max: "유입 50% 이상" },
        { id: "4_3", text: "네트워크 효과 체감 수준", min: "없음", max: "강한 락인 효과" },
        { id: "4_4", text: "플랫폼 이탈 방지(스위칭 비용)", min: "없음", max: "높은 전환 비용" }
      ]
    }
  ],
  insights: [
    "공급·수요 연계: 공급자 과잉 + 수요자 부족 → 공급자 이탈 시작, 수요 확대 마케팅 최우선 처방",
    "수수료·이탈 연계: 수수료 높음 + 공급자 이탈 → 수수료 구조 재설계·인센티브 처방",
    "MAU·바이럴 연계: MAU 정체 + 광고 의존 → 네트워크 효과 미작동, 리퍼럴 프로그램 처방"
  ]
};

if (typeof module !== 'undefined') module.exports = BIZMODEL_PLATFORM;
