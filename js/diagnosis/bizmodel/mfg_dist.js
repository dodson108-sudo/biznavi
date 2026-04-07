const BIZMODEL_MFG_DIST = {
  id: "mfg_dist",
  title: "제조·유통 특화 진단",
  areas: [
    {
      id: "production",
      title: "영역 1: 생산 원가 및 품질",
      description: "제조 원가·불량률·생산 유연성 진단",
      items: [
        { id: "1_1", text: "제품별 제조 원가 산출", min: "파악 안함", max: "정밀 관리" },
        { id: "1_2", text: "불량률·반품률 관리", min: "추적 안함", max: "데이터 기반 관리" },
        { id: "1_3", text: "소량·다품종 생산 유연성", min: "불가", max: "신속 대응 완비" },
        { id: "1_4", text: "신제품 개발 주기", min: "2년 이상", max: "6개월 이내" }
      ]
    },
    {
      id: "distribution",
      title: "영역 2: 유통 채널 및 납품 관리",
      description: "채널 다각화·납품가 협상·물류 진단",
      items: [
        { id: "2_1", text: "유통 채널 다각화", min: "1채널 의존", max: "온·오프 다채널" },
        { id: "2_2", text: "납품가 협상력·마진율", min: "을의 위치", max: "대등한 협상" },
        { id: "2_3", text: "물류·배송 비용 효율", min: "과다 지출", max: "최적화 완비" },
        { id: "2_4", text: "대리점·도매상 관리 체계", min: "없음", max: "체계적 관리" }
      ]
    },
    {
      id: "brand",
      title: "영역 3: 브랜드·마케팅 역량",
      description: "자사브랜드·OEM 비중·판촉 진단",
      items: [
        { id: "3_1", text: "자사브랜드 vs OEM 비중", min: "OEM 100%", max: "자사브랜드 주도" },
        { id: "3_2", text: "온라인 브랜드 인지도", min: "없음", max: "업계 인정 수준" },
        { id: "3_3", text: "판촉·프로모션 효율", min: "파악 안함", max: "ROI 기반 관리" },
        { id: "3_4", text: "대형 유통 입점 협상력", min: "없음·불리", max: "다수 입점·대등" }
      ]
    },
    {
      id: "cashflow",
      title: "영역 4: 재고·자금 흐름",
      description: "재고 회전·현금 사이클·운전자본 진단",
      items: [
        { id: "4_1", text: "완제품 재고 회전율", min: "연 2회 미만", max: "연 6회 이상" },
        { id: "4_2", text: "원자재→판매 현금 사이클", min: "90일 이상", max: "30일 이내" },
        { id: "4_3", text: "계절성·수요 예측 정확도", min: "감으로 발주", max: "데이터 기반 예측" },
        { id: "4_4", text: "운전자본 확보 수준", min: "항상 부족", max: "여유 있음" }
      ]
    }
  ],
  insights: [
    "원가·채널 연계: 원가 파악 없음 + 납품가 협상력 낮음 → 팔수록 손해 구조, 원가 분석 후 채널 재편 처방",
    "OEM·브랜드 연계: OEM 100% + 자사 브랜드 없음 → 거래처 이탈 시 매출 0, 자사 브랜드 육성 로드맵 처방",
    "재고·자금 연계: 재고 회전 낮음 + 현금 사이클 길음 → 매출 성장이 자금 압박으로 이어지는 구조 경고"
  ]
};

if (typeof module !== 'undefined') module.exports = BIZMODEL_MFG_DIST;
