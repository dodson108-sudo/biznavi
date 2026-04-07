const INDUSTRY_MFG_PARTS = {
  id: "mfg_parts",
  title: "뿌리 제조 및 부품가공업 특화 진단",
  areas: [
    {
      id: "cost",
      title: "영역 1: 원가 분석 및 수익 엔지니어링",
      description: "임가공 마진율·고정비 반영 구조 진단",
      items: [
        { id: "1_1", text: "임가공 마진율·고정비 반영 수준", min: "공임 기준 없음", max: "정밀 원가 관리" },
        { id: "1_2", text: "부산물(Scrap) 회수 관리", min: "관리 전혀 없음", max: "투명하게 수익화" },
        { id: "1_3", text: "원자재가 변동 대응력", min: "납품가 조정 불가", max: "즉시 반영 체계" },
        { id: "1_4", text: "불량 손실비(COPQ) 추적", min: "추적 전혀 없음", max: "데이터로 관리" }
      ]
    },
    {
      id: "operations",
      title: "영역 2: 현장 운영 및 설비 지능화",
      description: "비가동 리스크·셋업 효율 진단",
      items: [
        { id: "2_1", text: "설비 고장 간격(MTBF) 관리", min: "사후 대응만", max: "예방 체계 완비" },
        { id: "2_2", text: "제품 교체 셋업 표준화(SMED)", min: "표준 없음", max: "SMED 적용 완료" },
        { id: "2_3", text: "치공구(Jig) 데이터화", min: "관리 전혀 없음", max: "자동 알림 체계" },
        { id: "2_4", text: "외주 품질 피드백 루프", min: "전혀 없음", max: "체계적 관리" }
      ]
    },
    {
      id: "knowledge",
      title: "영역 3: 인적 자원 및 지식 자산화",
      description: "숙련 기술 의존도·DX 전환 수준 진단",
      items: [
        { id: "3_1", text: "현장 인력 Skill Map 보유", min: "없음", max: "완전 문서화" },
        { id: "3_2", text: "외국인 인력 다기능화 교육", min: "단순 인원 파악", max: "교육 이수율 관리" },
        { id: "3_3", text: "숙련 노하우 디지털화(DX)", min: "장인 머릿속", max: "디지털 레시피화" },
        { id: "3_4", text: "중대재해법 대응 체계", min: "미흡", max: "완전 이행" }
      ]
    },
    {
      id: "market",
      title: "영역 4: 시장 점유 및 고객 관계망",
      description: "수주 채널·가치사슬 위치 진단",
      items: [
        { id: "4_1", text: "대체 고객사 후보군 확보", min: "1곳 의존", max: "다수 확보" },
        { id: "4_2", text: "온라인 B2B 수주 채널", min: "소개만 의존", max: "다채널 운영" },
        { id: "4_3", text: "시제품 대응 리드타임 표준화", min: "표준 없음", max: "완전 표준화" },
        { id: "4_4", text: "가치사슬 내 위치(Tier)", min: "Tier 3 임가공", max: "Tier 1 설계 참여" }
      ]
    }
  ],
  insights: [
    "원가·영업 연계: 협상력 낮음 + 소개 수주 의존 → 을의 위치 고사 위기 경고",
    "지능형 처방: 노하우 DX 미흡 시 → 설비 효율 개선보다 기술 데이터화 우선",
    "수익 모델: Scrap 미관리 + COPQ 미추적 → 매출 확대보다 내부 누수 차단 우선"
  ]
};

if (typeof module !== 'undefined') module.exports = INDUSTRY_MFG_PARTS;
