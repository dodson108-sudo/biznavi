const BIZMODEL_B2C_SUB = {
  id: "b2c_sub",
  title: "B2C 구독 특화 진단",
  areas: [
    {
      id: "content",
      title: "영역 1: 콘텐츠·상품 경쟁력",
      description: "구독 가치·차별화·큐레이션 진단",
      items: [
        { id: "1_1", text: "구독 핵심 가치 차별성", min: "없음", max: "독보적 가치 제공" },
        { id: "1_2", text: "콘텐츠·상품 큐레이션 수준", min: "단순 나열", max: "개인화 추천 완비" },
        { id: "1_3", text: "신규 콘텐츠·상품 업데이트", min: "불규칙", max: "정기 업데이트 체계" },
        { id: "1_4", text: "구독자 커뮤니티·소속감", min: "없음", max: "활성 커뮤니티 운영" }
      ]
    },
    {
      id: "acquisition",
      title: "영역 2: 구독자 획득 및 전환",
      description: "무료→유료 전환·광고 효율 진단",
      items: [
        { id: "2_1", text: "무료체험→유료 전환율", min: "5% 미만", max: "30% 이상" },
        { id: "2_2", text: "광고비 대비 구독 CAC", min: "파악 안함", max: "LTV 3배 이내 관리" },
        { id: "2_3", text: "소셜·바이럴 유입 비중", min: "없음", max: "30% 이상" },
        { id: "2_4", text: "첫 결제 후 2회차 유지율", min: "50% 미만", max: "85% 이상" }
      ]
    },
    {
      id: "retention",
      title: "영역 3: 유지 및 해지 관리",
      description: "해지율·재활성화·혜택 체계 진단",
      items: [
        { id: "3_1", text: "월간 해지율(Churn Rate)", min: "10% 이상", max: "3% 이하" },
        { id: "3_2", text: "해지 이유 수집·분석 체계", min: "없음", max: "데이터 기반 개선" },
        { id: "3_3", text: "휴면·해지 고객 재활성화", min: "없음", max: "자동화 캠페인 운영" },
        { id: "3_4", text: "해지 방어(Save) 오퍼 체계", min: "없음", max: "단계별 혜택 완비" }
      ]
    },
    {
      id: "revenue",
      title: "영역 4: 수익 구조 및 확장",
      description: "ARPU·번들링·채널 다각화 진단",
      items: [
        { id: "4_1", text: "1인당 평균 결제액(ARPU) 추이", min: "감소 중", max: "지속 성장" },
        { id: "4_2", text: "번들링·티어 요금제 운영", min: "단일 플랜", max: "다단계 최적화" },
        { id: "4_3", text: "파트너십·제휴 채널 비중", min: "없음", max: "매출 20% 이상" },
        { id: "4_4", text: "구독 외 추가 수익원 확보", min: "없음", max: "다양한 수익원 확보" }
      ]
    }
  ],
  insights: [
    "Churn·LTV 연계: 해지율 높음 + CAC 높음 → 신규 유치가 의미 없는 구조, 해지 방어 우선 처방",
    "전환·콘텐츠 연계: 무료체험 많음 + 전환율 낮음 → 핵심 가치 전달 실패, 온보딩 경험 개선 처방",
    "ARPU·번들 연계: ARPU 정체 + 단일 플랜 → 티어 요금제·번들링으로 업셀 처방"
  ]
};

if (typeof module !== 'undefined') module.exports = BIZMODEL_B2C_SUB;
