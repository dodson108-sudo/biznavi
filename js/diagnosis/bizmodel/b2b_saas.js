const BIZMODEL_B2B_SAAS = {
  id: "b2b_saas",
  title: "B2B SaaS 특화 진단",
  areas: [
    {
      id: "product",
      title: "영역 1: 제품 경쟁력 및 기능 완성도",
      description: "핵심 기능·UX·업데이트 주기 진단",
      items: [
        { id: "1_1", text: "핵심 기능의 시장 차별성", min: "유사 제품과 동일", max: "독보적 차별화" },
        { id: "1_2", text: "UI/UX 사용 편의성", min: "불편·이탈 잦음", max: "직관적·높은 만족" },
        { id: "1_3", text: "기능 업데이트 주기·로드맵", min: "없음", max: "분기별 체계적 배포" },
        { id: "1_4", text: "보안·데이터 컴플라이언스", min: "미흡", max: "인증 완비" }
      ]
    },
    {
      id: "acquisition",
      title: "영역 2: 고객 획득 및 온보딩",
      description: "리드 전환율·온보딩 기간·이탈 방지 진단",
      items: [
        { id: "2_1", text: "리드→유료 전환율", min: "1% 미만", max: "20% 이상" },
        { id: "2_2", text: "온보딩 완료까지 소요 기간", min: "1개월 이상", max: "1주일 이내" },
        { id: "2_3", text: "무료→유료 전환 유도 체계", min: "없음", max: "자동화 완비" },
        { id: "2_4", text: "초기 이탈(Churn) 방지 체계", min: "없음", max: "CS·튜토리얼 완비" }
      ]
    },
    {
      id: "revenue",
      title: "영역 3: 수익 구조 및 재무 지표",
      description: "MRR·ARR·LTV·CAC 관리 진단",
      items: [
        { id: "3_1", text: "MRR/ARR 데이터 관리", min: "파악 안함", max: "실시간 대시보드" },
        { id: "3_2", text: "LTV 대비 CAC 비율", min: "파악 안함", max: "LTV 3배 이상 유지" },
        { id: "3_3", text: "요금제 구조 최적화", min: "단일 요금제", max: "다단계 플랜 운영" },
        { id: "3_4", text: "결제 실패·이탈 자동 대응", min: "없음", max: "자동 복구 체계" }
      ]
    },
    {
      id: "success",
      title: "영역 4: 고객 성공 및 확장",
      description: "갱신율·업셀링·NPS 진단",
      items: [
        { id: "4_1", text: "계약 갱신율(Renewal Rate)", min: "50% 미만", max: "90% 이상" },
        { id: "4_2", text: "업셀·크로스셀 매출 비중", min: "없음", max: "20% 이상" },
        { id: "4_3", text: "고객 성공(CS) 전담 체계", min: "없음", max: "전담팀 운영" },
        { id: "4_4", text: "NPS(순추천지수) 관리", min: "측정 안함", max: "정기 측정·개선" }
      ]
    }
  ],
  insights: [
    "전환·온보딩 연계: 리드 많음 + 전환율 낮음 → 온보딩 복잡성 원인, UX 개선·자동화 처방",
    "LTV·CAC 연계: CAC 높음 + 갱신율 낮음 → 고객 획득보다 유지가 시급, CS 강화 우선 처방",
    "MRR·Churn 연계: MRR 성장 + Churn 높음 → 밑 빠진 독에 물 붓기, 이탈 원인 분석 최우선"
  ]
};

if (typeof module !== 'undefined') module.exports = BIZMODEL_B2B_SAAS;
