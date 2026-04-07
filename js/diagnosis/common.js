const COMMON_DIAGNOSIS = {
  title: "기본 경영 진단",
  description: "전 업종 공통 적용 핵심 경영 진단 항목",
  areas: [
    {
      id: "finance",
      title: "영역 1: 재무 건전성",
      items: [
        { id: "1_1", text: "최근 3년 매출 추이", min: "지속 감소", max: "지속 성장" },
        { id: "1_2", text: "영업이익률 인식 수준", min: "전혀 모름", max: "정확히 관리" },
        { id: "1_3", text: "현금흐름 안정성", min: "자금압박 심각", max: "여유 있음" },
        { id: "1_4", text: "부채/차입금 부담", min: "매우 높음", max: "거의 없음" }
      ]
    },
    {
      id: "hr",
      title: "영역 2: 조직/인력 안정성",
      items: [
        { id: "2_1", text: "핵심인력 의존도", min: "대표자 혼자", max: "역할 분산됨" },
        { id: "2_2", text: "인력 이직/채용 난이도", min: "매우 심각", max: "안정적" },
        { id: "2_3", text: "업무 매뉴얼화 수준", min: "전혀 없음", max: "완전 문서화" },
        { id: "2_4", text: "조직 내 소통/협업", min: "매우 나쁨", max: "매우 원활" }
      ]
    },
    {
      id: "customer",
      title: "영역 3: 고객/매출 기반",
      items: [
        { id: "3_1", text: "주요 고객 집중도", min: "1곳이 80% 이상", max: "골고루 분산" },
        { id: "3_2", text: "고객 재구매/재계약률", min: "거의 없음", max: "매우 높음" },
        { id: "3_3", text: "신규 고객 유입 경로", min: "소개만 의존", max: "다채널 확보" },
        { id: "3_4", text: "고객 불만/클레임 대응", min: "체계 없음", max: "체계적 관리" }
      ]
    },
    {
      id: "management",
      title: "영역 4: 대표자/경영 역량",
      items: [
        { id: "4_1", text: "경영 의사결정 위임 수준", min: "대표 독단", max: "충분히 위임" },
        { id: "4_2", text: "중장기 전략 보유 여부", min: "없음", max: "명확히 수립" },
        { id: "4_3", text: "디지털/AI 도구 활용", min: "전혀 안함", max: "적극 활용" },
        { id: "4_4", text: "외부 네트워크/정보 수집", min: "거의 없음", max: "매우 활발" }
      ]
    }
  ],
  scoreGuide: {
    high: { min: 4.0, max: 5.0, label: "강점 영역", color: "green" },
    mid:  { min: 3.0, max: 3.9, label: "보통 (개선 권고)", color: "yellow" },
    low:  { min: 2.0, max: 2.9, label: "취약 (우선 개선)", color: "orange" },
    risk: { min: 1.0, max: 1.9, label: "위험 (즉각 조치)", color: "red" }
  }
};

if (typeof module !== 'undefined') module.exports = COMMON_DIAGNOSIS;
