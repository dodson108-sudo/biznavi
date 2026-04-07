const INDUSTRY_FOOD_MFG = {
  id: "food_mfg",
  title: "식품 제조 및 가공업 특화 진단",
  areas: [
    {
      id: "food_safety",
      title: "영역 1: 생산 위생 및 품질 안전",
      description: "HACCP 실효성·클레임 대응 진단",
      items: [
        { id: "1_1", text: "HACCP CCP 실시간 기록 체계", min: "수기 기록/형식적", max: "자동화·즉각 조치" },
        { id: "1_2", text: "클레임·이력추적 대응 속도", min: "추적 불가", max: "즉시 대응 체계" },
        { id: "1_3", text: "작업장 온도/습도 자동 제어", min: "수동 관리", max: "자동 제어 완비" },
        { id: "1_4", text: "자가품질검사 및 보존 테스트", min: "미실시", max: "정기 준수" }
      ]
    },
    {
      id: "material",
      title: "영역 2: 원재료 수율 및 재고 최적화",
      description: "폐기 로스·콜드체인 관리 진단",
      items: [
        { id: "2_1", text: "원재료 투입 대비 수율 관리", min: "추적 안함", max: "구간별 데이터 관리" },
        { id: "2_2", text: "선입선출(FIFO) 디지털화", min: "수기 관리", max: "자동 알림 체계" },
        { id: "2_3", text: "콜드체인 온도 이력 관리", min: "미관리", max: "실시간 데이터 기록" },
        { id: "2_4", text: "포장재·소모품 재고 적정성", min: "과다/부족 반복", max: "MOQ 최적 관리" }
      ]
    },
    {
      id: "process",
      title: "영역 3: 인적 자원 및 공정 효율",
      description: "인당 생산성·자동화 수준 진단",
      items: [
        { id: "3_1", text: "공정별 병목 및 인당 생산성", min: "파악 안함", max: "데이터 기반 관리" },
        { id: "3_2", text: "레시피 표준화 수준", min: "담당자 의존", max: "누가 해도 동일 품질" },
        { id: "3_3", text: "외국인 인력 위생 교육 체계", min: "미실시", max: "체계적 실시" },
        { id: "3_4", text: "단순 공정 반자동화 수준", min: "전혀 없음", max: "주요 공정 자동화" }
      ]
    },
    {
      id: "brand",
      title: "영역 4: 브랜드 가치 및 유통 판로",
      description: "채널 다각화·자사브랜드 성장 진단",
      items: [
        { id: "4_1", text: "채널별 순마진율 관리", min: "파악 안함", max: "채널별 정밀 관리" },
        { id: "4_2", text: "OEM 대비 자사브랜드 비중", min: "OEM 100%", max: "자사브랜드 주도" },
        { id: "4_3", text: "SNS·상세페이지 마케팅 효율", min: "전혀 없음", max: "ROAS 기반 관리" },
        { id: "4_4", text: "신제품 기획~런칭 사이클", min: "1년 이상", max: "3개월 내 신속 대응" }
      ]
    }
  ],
  insights: [
    "위생·브랜드 연계: 위생 점수 낮음 + 자사브랜드 비중 높음 → 한 번의 사고로 도산 가능한 초고위험 상태 경고",
    "수율·마진 연계: 수율 낮음 + 플랫폼 수수료 높음 → 매출 증가가 적자로 이어지는 구조, 자동화·자사몰 전환 처방",
    "HACCP·디지털 연계: 수기 기록 HACCP → 스마트 HACCP 전환 + 정부 지원사업 매칭 처방"
  ]
};

if (typeof module !== 'undefined') module.exports = INDUSTRY_FOOD_MFG;
