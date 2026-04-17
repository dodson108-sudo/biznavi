const BIZMODEL_DEEPTECH = {
  id: "deeptech",
  title: "딥테크·바이오·Moonshot 모델 특화 진단",
  areas: [
    {
      id: "technology",
      title: "영역 1: 핵심 기술 독점성 및 보호",
      description: "특허·기술 장벽·IP 보호 전략 진단",
      items: [
        { id: "1_1", text: "핵심 기술 특허 등록 및 포트폴리오", min: "없음·아이디어만", max: "등록 특허 5건 이상" },
        { id: "1_2", text: "기술 모방 장벽(재현 불가 수준)", min: "1~2년 이내 모방 가능", max: "5년 이상 재현 불가" },
        { id: "1_3", text: "핵심 기술 인력 이탈 리스크", min: "1~2명 독점 의존", max: "분산·문서화·지분 묶음" },
        { id: "1_4", text: "기술 라이선싱·기술이전 가능성", min: "없음·내부만 활용", max: "라이선스 계약 진행 중" }
      ]
    },
    {
      id: "validation",
      title: "영역 2: 기술 검증 및 임상·인허가 단계",
      description: "POC·TRL·규제 승인·임상 진행 진단",
      items: [
        { id: "2_1", text: "기술 준비 수준(TRL: Technology Readiness Level)", min: "TRL 1~3 (개념·실험)", max: "TRL 7~9 (상용화 완료)" },
        { id: "2_2", text: "규제 승인·인허가 진행 단계", min: "신청 전", max: "승인 완료·판매 가능" },
        { id: "2_3", text: "실제 고객 POC·파일럿 실적", min: "없음", max: "3건 이상 성공 사례" },
        { id: "2_4", text: "임상·현장 데이터 확보 수준 (해당 시)", min: "없음·계획만", max: "충분한 데이터 확보" }
      ]
    },
    {
      id: "funding",
      title: "영역 3: 투자 유치 및 자금 관리",
      description: "런웨이·VC 투자·정부 R&D·비희석 자금 진단",
      items: [
        { id: "3_1", text: "현재 현금 런웨이(남은 운영 가능 기간)", min: "6개월 미만", max: "24개월 이상" },
        { id: "3_2", text: "VC·엔젤 투자 유치 역량 및 이력", min: "없음·IR 경험 전무", max: "시리즈 A 이상 완료" },
        { id: "3_3", text: "정부 R&D 과제 수주 및 비희석 자금", min: "없음", max: "연 5억 이상 수주" },
        { id: "3_4", text: "투자 유치 후 마일스톤 관리 역량", min: "없음·임의 운용", max: "KPI 연동·IR 보고 체계" }
      ]
    },
    {
      id: "commercialization",
      title: "영역 4: 사업화 전략 및 파트너십",
      description: "초기 고객·전략적 파트너·수익화 경로 진단",
      items: [
        { id: "4_1", text: "초기 앵커 고객(Lighthouse Customer) 확보", min: "없음", max: "대기업·공공기관 1곳 이상" },
        { id: "4_2", text: "대기업·글로벌 기업과의 전략 파트너십", min: "없음", max: "공동개발·투자 유치 중" },
        { id: "4_3", text: "기술에서 매출로의 수익화 경로 명확성", min: "불분명·기술만 있음", max: "수익 모델 검증 완료" },
        { id: "4_4", text: "글로벌 시장 진출 전략 수립", min: "없음·국내만 고려", max: "해외 파트너·임상 진행 중" }
      ]
    }
  ],
  insights: [
    "특허·모방 연계: 특허 없음 + 모방 장벽 낮음 → 기술 공개 즉시 경쟁사 추격, 특허 출원 및 영업비밀 관리 최우선",
    "런웨이·TRL 연계: 런웨이 6개월 미만 + TRL 낮음 → 사업화 전 자금 소진 위기, 정부 R&D 즉시 신청·전략투자 유치 처방",
    "앵커고객·수익화 연계: 파일럿 없음 + 수익 경로 불명확 → 기술의 시장 가치 미검증, 1개 대기업 PoC 계약이 최우선 목표"
  ]
};

if (typeof module !== 'undefined') module.exports = BIZMODEL_DEEPTECH;
