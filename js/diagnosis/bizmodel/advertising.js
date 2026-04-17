const BIZMODEL_ADVERTISING = {
  id: "advertising",
  title: "광고기반(Ad-Supported) 모델 특화 진단",
  areas: [
    {
      id: "traffic",
      title: "영역 1: 트래픽 규모 및 체류 시간",
      description: "DAU·MAU·페이지뷰·세션 시간 진단",
      items: [
        { id: "1_1", text: "월간 순방문자(MAU) 규모 및 성장률", min: "1만 미만·정체", max: "100만 이상·월 10% 성장" },
        { id: "1_2", text: "평균 세션 시간 및 페이지뷰 깊이", min: "1분 미만·1페이지", max: "5분 이상·5페이지+" },
        { id: "1_3", text: "콘텐츠 재방문율(DAU/MAU 비율)", min: "5% 미만", max: "30% 이상" },
        { id: "1_4", text: "알고리즘·SEO 의존도 리스크 관리", min: "단일 채널 100% 의존", max: "멀티채널·자체DB 보유" }
      ]
    },
    {
      id: "monetization",
      title: "영역 2: 광고 수익화 효율",
      description: "CPM·CTR·광고주 다각화·Fill Rate 진단",
      items: [
        { id: "2_1", text: "CPM(1000회 노출당 수익) 수준", min: "500원 미만", max: "3,000원 이상" },
        { id: "2_2", text: "광고 Fill Rate(광고 채움률)", min: "50% 미만", max: "95% 이상" },
        { id: "2_3", text: "직접 광고주 유치 비중(네트워크 의존 탈피)", min: "없음·전체 네트워크", max: "직거래 30% 이상" },
        { id: "2_4", text: "네이티브·프리미엄 광고 상품 보유", min: "없음·배너만", max: "다양한 상품 운영" }
      ]
    },
    {
      id: "content",
      title: "영역 3: 콘텐츠 생산 및 품질",
      description: "콘텐츠 생산성·차별화·크리에이터 관리 진단",
      items: [
        { id: "3_1", text: "콘텐츠 정기 생산 및 업데이트 주기", min: "불규칙·월 1회 미만", max: "일 1회 이상 체계적" },
        { id: "3_2", text: "콘텐츠 차별화 및 독점성", min: "다수 대체재 존재", max: "유일·독점 콘텐츠" },
        { id: "3_3", text: "크리에이터·필자 관리 및 인센티브", min: "없음·단발 협업", max: "전속·수익 공유 체계" },
        { id: "3_4", text: "UGC(사용자 제작 콘텐츠) 활성화", min: "없음", max: "커뮤니티·투고 활발" }
      ]
    },
    {
      id: "revenue_mix",
      title: "영역 4: 수익 다각화 및 구독 전환",
      description: "광고 의존 탈피·프리미엄 전환·제휴 수익 진단",
      items: [
        { id: "4_1", text: "광고 외 수익 비중(구독·커머스·제휴)", min: "없음·광고 100%", max: "30% 이상" },
        { id: "4_2", text: "프리미엄(광고 제거) 구독 전환율", min: "없음", max: "MAU의 5% 이상 유료" },
        { id: "4_3", text: "제휴 마케팅·커머스 수익 연계", min: "없음", max: "월 정기 수익 발생" },
        { id: "4_4", text: "광고주 장기 계약(연간·반기) 비중", min: "없음·단건", max: "매출 50% 이상 장기" }
      ]
    }
  ],
  insights: [
    "트래픽·CPM 연계: MAU 낮음 + CPM 낮음 → 광고 수익 구조 자체가 성립 불가, MAU 성장 전략 또는 수익 모델 전환 처방",
    "단일 채널 의존·리스크: 구글·유튜브 알고리즘 100% 의존 → 정책 변경 시 트래픽 소멸, 이메일·앱 자체 DB 구축 처방",
    "광고 의존·다각화 연계: 광고 수익 100% + 구독 없음 → 광고 시장 침체 직격, 프리미엄 구독 도입 긴급 처방"
  ]
};

if (typeof module !== 'undefined') module.exports = BIZMODEL_ADVERTISING;
