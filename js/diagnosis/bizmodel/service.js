const BIZMODEL_SERVICE = {
  id: "service",
  title: "서비스업 특화 진단",
  areas: [
    {
      id: "quality",
      title: "영역 1: 서비스 품질 및 표준화",
      description: "품질 균일성·SOP·고객 만족 진단",
      items: [
        { id: "1_1", text: "서비스 품질 균일성", min: "담당자마다 다름", max: "완전 표준화" },
        { id: "1_2", text: "SOP·체크리스트 보유", min: "전혀 없음", max: "완전 문서화" },
        { id: "1_3", text: "고객 만족도 측정 체계", min: "없음", max: "정기 측정·개선" },
        { id: "1_4", text: "클레임·불만 대응 체계", min: "없음·느림", max: "신속·체계적" }
      ]
    },
    {
      id: "sales",
      title: "영역 2: 영업 및 수주 역량",
      description: "제안 경쟁력·계약 구조·수주 채널 진단",
      items: [
        { id: "2_1", text: "신규 수주 채널 다양성", min: "소개만 의존", max: "다채널 확보" },
        { id: "2_2", text: "제안서 품질·경쟁력", min: "미흡", max: "업계 상위 수준" },
        { id: "2_3", text: "계약 조건·범위 명확성", min: "구두·불명확", max: "표준 계약 완비" },
        { id: "2_4", text: "기존 고객 추가 수주", min: "없음", max: "매출 40% 이상" }
      ]
    },
    {
      id: "human",
      title: "영역 3: 인력 운영 및 생산성",
      description: "가동률·이탈률·성과 체계 진단",
      items: [
        { id: "3_1", text: "인력 가동률", min: "50% 미만", max: "80% 이상 유지" },
        { id: "3_2", text: "핵심 인력 이탈률", min: "연 30% 이상", max: "연 5% 이하" },
        { id: "3_3", text: "성과 측정·인센티브 체계", min: "없음", max: "객관적 지표 연동" },
        { id: "3_4", text: "외부 파트너 네트워크", min: "없음", max: "즉시 투입 가능" }
      ]
    },
    {
      id: "finance",
      title: "영역 4: 수익 구조 및 재무",
      description: "고정비·BEP·장기계약 비중 진단",
      items: [
        { id: "4_1", text: "매출 대비 고정비 비중", min: "60% 이상", max: "40% 이하" },
        { id: "4_2", text: "BEP 인지 및 관리", min: "모름", max: "정밀 관리" },
        { id: "4_3", text: "장기·정기 계약 비중", min: "없음", max: "매출 50% 이상" },
        { id: "4_4", text: "미수금 회수 체계", min: "없음", max: "여신 한도·자동 관리" }
      ]
    }
  ],
  insights: [
    "품질·수주 연계: SOP 없음 + 재수주 낮음 → 품질 불균일이 재계약 실패 원인, 표준화 우선 처방",
    "가동률·고정비 연계: 가동률 낮음 + 고정비 높음 → 인건비 출혈, 외부 파트너 활용·변동비 전환 처방",
    "계약·미수금 연계: 계약 불명확 + 미수금 높음 → 표준 계약서 도입 최우선 처방"
  ]
};

if (typeof module !== 'undefined') module.exports = BIZMODEL_SERVICE;
