const INDUSTRY_FINANCE = {
  id: "finance",
  title: "금융 및 핀테크 특화 진단",
  areas: [
    {
      id: "system",
      title: "영역 1: 시스템 및 재무 건전성",
      description: "자본 적정성·부실채권·수수료 구조 진단",
      items: [
        { id: "1_1", text: "자본 적정성 및 유동성 관리", min: "파악 안함", max: "정밀 관리" },
        { id: "1_2", text: "부실 채권·연체 관리 체계", min: "체계 없음", max: "완전 관리" },
        { id: "1_3", text: "고정비·시스템 유지비 적정성", min: "파악 안함", max: "정밀 관리" },
        { id: "1_4", text: "수수료·이자 수익 구조 안정성", min: "편중·불안정", max: "다각화·안정" }
      ]
    },
    {
      id: "compliance",
      title: "영역 2: 프로세스 및 규제 대응",
      description: "인증 성공률·금소법·FDS·보안 진단",
      items: [
        { id: "2_1", text: "본인인증·결제 성공률 및 응답 속도", min: "이탈률 높음", max: "완전 최적화" },
        { id: "2_2", text: "금소법·불완전 판매 방지 체계", min: "미흡", max: "완전 이행" },
        { id: "2_3", text: "이상거래 탐지(FDS) 정교함", min: "없음", max: "실시간 자동 탐지" },
        { id: "2_4", text: "보안·데이터 무결성 체계", min: "미흡", max: "완전 보안 완비" }
      ]
    },
    {
      id: "hr",
      title: "영역 3: 인적 자원 및 조직 역량",
      description: "리스크 관리자·개발 인력·내부 통제 진단",
      items: [
        { id: "3_1", text: "리스크 관리자 전문성·독립성", min: "없음·형식적", max: "전문 자격·실질 권한" },
        { id: "3_2", text: "금융 도메인 개발 인력 내재화", min: "외주 100% 의존", max: "핵심 기술 내재화" },
        { id: "3_3", text: "내부 통제·윤리 경영 체계", min: "없음", max: "정기 감사 완비" },
        { id: "3_4", text: "Key-man 리스크·BCP 보유", min: "없음", max: "완전 대비" }
      ]
    },
    {
      id: "marketing",
      title: "영역 4: 마케팅 및 시장 지배력",
      description: "CAC·앱 평점·제휴 네트워크·브랜드 신뢰 진단",
      items: [
        { id: "4_1", text: "고객 획득 비용(CAC) 적정성", min: "파악 안함", max: "LTV 대비 최적 관리" },
        { id: "4_2", text: "앱 평점·고객 이탈률 관리", min: "방치", max: "실시간 모니터링" },
        { id: "4_3", text: "제휴 네트워크·파트너십 확장", min: "없음", max: "다수 핵심 파트너 확보" },
        { id: "4_4", text: "브랜드 신뢰도·금융 사고 무결성", min: "낮음", max: "업계 최고 신뢰" }
      ]
    }
  ],
  insights: [
    "연체율·FDS 연계: 연체율 상승 + FDS 업데이트 지연 → 사기 표적 위험, 신용 평가 모델 고도화 긴급 제안",
    "CAC·LTV 연계: CAC 상승 + LTV 정체 → 수익 모델 한계, 고관여 금융 상품 크로스셀링 전략 처방",
    "규제·시스템 연계: 금소법 준수 낮음 + 마케팅 공격적 → 영업 정지 리스크, 규제 준수 후 마케팅 실행 로드맵 수립"
  ]
};

if (typeof module !== 'undefined') module.exports = INDUSTRY_FINANCE;
