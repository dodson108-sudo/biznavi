const BIZMODEL_B2C_COMMERCE = {
  id: "b2c_commerce",
  title: "B2C 커머스 특화 진단",
  areas: [
    {
      id: "product",
      title: "영역 1: 상품 경쟁력 및 소싱",
      description: "가격·품질·차별화·소싱 진단",
      items: [
        { id: "1_1", text: "상품 가격 경쟁력", min: "시장 최고가", max: "최적 가격 포지셔닝" },
        { id: "1_2", text: "상품 품질·불량률 관리", min: "불량 잦음", max: "완전 품질 관리" },
        { id: "1_3", text: "자사 브랜드·차별화", min: "없음", max: "독보적 브랜드 구축" },
        { id: "1_4", text: "소싱 채널 다변화", min: "1곳 의존", max: "다채널 직소싱" }
      ]
    },
    {
      id: "acquisition",
      title: "영역 2: 고객 획득 및 전환",
      description: "광고 효율·상세페이지·전환율 진단",
      items: [
        { id: "2_1", text: "광고 ROAS 관리", min: "파악 안함", max: "채널별 최적화" },
        { id: "2_2", text: "상세페이지 전환율", min: "1% 미만", max: "5% 이상" },
        { id: "2_3", text: "장바구니 이탈 방지 체계", min: "없음", max: "자동화 리타겟팅" },
        { id: "2_4", text: "신규 고객 획득 비용(CAC)", min: "파악 안함", max: "LTV 3배 이내" }
      ]
    },
    {
      id: "retention",
      title: "영역 3: 재구매 및 충성도",
      description: "재구매율·CRM·리뷰 관리 진단",
      items: [
        { id: "3_1", text: "3개월 내 재구매율", min: "10% 미만", max: "40% 이상" },
        { id: "3_2", text: "회원 CRM·타겟 마케팅", min: "없음", max: "세그먼트 자동화" },
        { id: "3_3", text: "리뷰·평점 관리 체계", min: "방치", max: "전략적 관리" },
        { id: "3_4", text: "VIP·충성 고객 관리", min: "없음", max: "등급제·혜택 완비" }
      ]
    },
    {
      id: "operations",
      title: "영역 4: 운영 효율 및 수익성",
      description: "채널별 마진·물류·CS 진단",
      items: [
        { id: "4_1", text: "채널별 실질 순마진율", min: "파악 안함", max: "채널별 정밀 관리" },
        { id: "4_2", text: "물류·배송 비용 최적화", min: "과다 지출", max: "협상·자동화 완비" },
        { id: "4_3", text: "CS 응대 속도·만족도", min: "느림·불만", max: "24시간 체계 완비" },
        { id: "4_4", text: "반품률·교환 처리 효율", min: "10% 이상", max: "3% 이하·신속 처리" }
      ]
    }
  ],
  insights: [
    "ROAS·마진 연계: 광고비 높음 + 순마진 낮음 → 광고만 돈 버는 구조, 자사몰 전환·재구매 강화 처방",
    "재구매·CAC 연계: CAC 높음 + 재구매율 낮음 → 밑 빠진 독, CRM 고도화 최우선 처방",
    "리뷰·전환 연계: 평점 낮음 + 전환율 낮음 → 상품·CS 품질 개선 전 광고 중단 처방"
  ]
};

if (typeof module !== 'undefined') module.exports = BIZMODEL_B2C_COMMERCE;
