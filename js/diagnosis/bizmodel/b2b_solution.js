const BIZMODEL_B2B_SOLUTION = {
  id: "b2b_solution",
  title: "B2B 솔루션 특화 진단",
  areas: [
    {
      id: "solution",
      title: "영역 1: 솔루션 경쟁력 및 기술력",
      description: "기능 완성도·커스터마이징·유지보수 진단",
      items: [
        { id: "1_1", text: "솔루션 핵심 기능 완성도", min: "미완성·버그 잦음", max: "안정적·완전 구현" },
        { id: "1_2", text: "고객사별 커스터마이징 대응", min: "불가", max: "신속 대응 완비" },
        { id: "1_3", text: "경쟁사 대비 기술 차별성", min: "없음", max: "독보적 우위" },
        { id: "1_4", text: "솔루션 유지보수 체계", min: "없음", max: "SLA 기반 운영" }
      ]
    },
    {
      id: "sales",
      title: "영역 2: 영업 파이프라인 관리",
      description: "리드 발굴·제안 성공률·계약 주기 진단",
      items: [
        { id: "2_1", text: "신규 리드 발굴 채널", min: "소개만 의존", max: "다채널 확보" },
        { id: "2_2", text: "제안서 품질·Win Rate", min: "20% 미만", max: "60% 이상" },
        { id: "2_3", text: "영업 사이클(Lead→계약) 기간", min: "6개월 이상", max: "2개월 이내" },
        { id: "2_4", text: "의사결정자 접근 및 설득력", min: "실무자만 접촉", max: "C레벨 직접 소통" }
      ]
    },
    {
      id: "delivery",
      title: "영역 3: 납품 및 구현 역량",
      description: "납기 준수·PM 역량·고객 만족 진단",
      items: [
        { id: "3_1", text: "프로젝트 납기 준수율", min: "자주 지연", max: "항상 준수" },
        { id: "3_2", text: "PM 역량 및 커뮤니케이션", min: "미흡", max: "전문 PM 운영" },
        { id: "3_3", text: "구현 후 고객 만족도", min: "낮음", max: "높은 만족·추천" },
        { id: "3_4", text: "범위 변경(Scope) 통제력", min: "무상 수용", max: "계약 기반 관리" }
      ]
    },
    {
      id: "relationship",
      title: "영역 4: 유지보수 및 장기 관계",
      description: "AS 체계·추가 수주·레퍼런스 진단",
      items: [
        { id: "4_1", text: "납품 후 AS·유지보수 체계", min: "없음", max: "전담 체계 완비" },
        { id: "4_2", text: "기존 고객 추가 수주 비중", min: "없음", max: "매출 40% 이상" },
        { id: "4_3", text: "공개 레퍼런스·사례 보유", min: "없음", max: "업계 인정 수준" },
        { id: "4_4", text: "장기 유지보수 계약 비중", min: "없음", max: "MRR 50% 이상" }
      ]
    }
  ],
  insights: [
    "영업·납품 연계: Win Rate 낮음 + 납기 지연 잦음 → 수주도 납품도 실패, 제안 역량과 PM 체계 동시 처방",
    "레퍼런스·영업 연계: 공개 레퍼런스 없음 + 소개 의존 → 사례 공개·콘텐츠 마케팅 우선 처방",
    "AS·추가수주 연계: AS 체계 없음 + 추가 수주 낮음 → 납품 후 관계 단절, 고객 성공 프로그램 처방"
  ]
};

if (typeof module !== 'undefined') module.exports = BIZMODEL_B2B_SOLUTION;
