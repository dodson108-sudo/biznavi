const INDUSTRY_KNOWLEDGE_IT = {
  id: "knowledge_it",
  title: "지식 서비스 및 IT개발 특화 진단",
  areas: [
    {
      id: "project",
      title: "영역 1: 프로젝트 수익성 및 공수 관리",
      description: "M/M 산출·가동률·Scope Creep 진단",
      items: [
        { id: "1_1", text: "프로젝트별 실질 순이익 관리", min: "파악 안함", max: "프로젝트별 정밀 관리" },
        { id: "1_2", text: "공수(M/M) 산출 vs 실투입 오차", min: "50% 이상 초과", max: "10% 이내 관리" },
        { id: "1_3", text: "수익 프로젝트 가동률", min: "50% 미만", max: "80% 이상 유지" },
        { id: "1_4", text: "추가 과업(Scope Creep) 통제", min: "무상 수용", max: "계약 기반 청구" }
      ]
    },
    {
      id: "asset",
      title: "영역 2: 지식 자산 및 기술 고도화",
      description: "코드 자산화·IP·기술 스택 진단",
      items: [
        { id: "2_1", text: "재활용 코드·디자인 자산화", min: "전혀 없음", max: "라이브러리 완비" },
        { id: "2_2", text: "자사 솔루션·IP·특허 보유", min: "없음", max: "다수 확보" },
        { id: "2_3", text: "최신 기술 스택 경쟁력", min: "구식 기술 의존", max: "시장 선도 기술 보유" },
        { id: "2_4", text: "SOP·협업툴 프로젝트 관리", min: "구두·이메일", max: "Notion·Jira 완비" }
      ]
    },
    {
      id: "human",
      title: "영역 3: 인적 역량 및 조직 문화",
      description: "Key-man 리스크·인재 유지 진단",
      items: [
        { id: "3_1", text: "Key-man 이탈 리스크", min: "1명 의존", max: "분산·문서화 완료" },
        { id: "3_2", text: "업계 대비 급여·복지 경쟁력", min: "하위권", max: "상위권 유지" },
        { id: "3_3", text: "성과 인센티브 체계", min: "없음", max: "객관적 지표 연동" },
        { id: "3_4", text: "신뢰할 외주 인력 풀(Pool)", min: "없음", max: "즉시 투입 가능" }
      ]
    },
    {
      id: "sales",
      title: "영역 4: 영업 채널 및 포트폴리오 파워",
      description: "수주 다각화·리테이너 비중 진단",
      items: [
        { id: "4_1", text: "주력 분야 전문 레퍼런스 보유", min: "없음", max: "업계 인정 수준" },
        { id: "4_2", text: "지인 의존 vs 다채널 수주", min: "지인 100%", max: "B2B·플랫폼 다각화" },
        { id: "4_3", text: "제안 성공률(Win Rate)", min: "20% 미만", max: "60% 이상" },
        { id: "4_4", text: "고정 매출(MRR·리테이너) 비중", min: "없음", max: "매출 50% 이상" }
      ]
    }
  ],
  insights: [
    "가동률·수익 연계: 인건비 고정 + 가동률 낮음 → 유휴 인력이 수익 갉아먹음, 자체 솔루션 R&D 전환 또는 공격적 영업 처방",
    "공수·마진 연계: 이익률 낮음 + Scope Creep 잦음 → 계약서 R&R 미흡 판단, 공수 트래킹 툴 도입 처방",
    "의존도·자산 연계: Key-man 의존 높음 + 자산화 낮음 → 인력 이탈 시 기업가치 0 수렴, 지식공유 시스템·IP 확보 최우선 처방"
  ]
};

if (typeof module !== 'undefined') module.exports = INDUSTRY_KNOWLEDGE_IT;
