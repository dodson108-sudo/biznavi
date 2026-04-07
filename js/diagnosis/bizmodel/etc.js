const BIZMODEL_ETC = {
  id: "etc",
  title: "기타 사업모델 특화 진단",
  areas: [
    {
      id: "bizmodel",
      title: "영역 1: 비즈니스 모델 명확성",
      description: "수익 구조·가치 제안·타겟 진단",
      items: [
        { id: "1_1", text: "수익 모델 명확성", min: "불명확", max: "검증된 수익 구조" },
        { id: "1_2", text: "핵심 가치 제안 차별성", min: "없음", max: "독보적 가치" },
        { id: "1_3", text: "타겟 고객 명확성", min: "불명확", max: "명확한 페르소나" },
        { id: "1_4", text: "핵심 KPI 설정 및 관리", min: "없음", max: "데이터 기반 관리" }
      ]
    },
    {
      id: "competition",
      title: "영역 2: 시장 진입 및 경쟁력",
      description: "차별화·진입 장벽·성장 가능성 진단",
      items: [
        { id: "2_1", text: "경쟁사 대비 차별화 요소", min: "없음", max: "독보적 우위" },
        { id: "2_2", text: "진입 장벽·모방 방지력", min: "없음", max: "특허·계약·브랜드" },
        { id: "2_3", text: "시장 성장성 인식", min: "없음", max: "데이터 기반 확인" },
        { id: "2_4", text: "파트너십·생태계 구축", min: "없음", max: "핵심 파트너 확보" }
      ]
    },
    {
      id: "operations",
      title: "영역 3: 운영 역량 및 자원",
      description: "인력·자금·시스템 충분성 진단",
      items: [
        { id: "3_1", text: "핵심 인력 보유 수준", min: "부족·이탈 잦음", max: "안정적 확보" },
        { id: "3_2", text: "운영 자금 충분성", min: "항상 부족", max: "6개월 이상 여유" },
        { id: "3_3", text: "디지털·운영 시스템", min: "없음", max: "자동화 완비" },
        { id: "3_4", text: "대표자 외 실행 역량", min: "대표만 가능", max: "팀 역량 분산" }
      ]
    },
    {
      id: "growth",
      title: "영역 4: 수익성 및 지속 가능성",
      description: "매출 구조·BEP·확장성 진단",
      items: [
        { id: "4_1", text: "현재 매출 발생 여부", min: "없음", max: "안정적 매출" },
        { id: "4_2", text: "BEP 달성 시점 인지", min: "모름", max: "명확한 계획 보유" },
        { id: "4_3", text: "비즈니스 확장 가능성", min: "없음", max: "명확한 로드맵" },
        { id: "4_4", text: "외부 투자·지원 활용", min: "없음", max: "정부지원·투자 확보" }
      ]
    }
  ],
  insights: [
    "모델·KPI 연계: 수익 모델 불명확 + KPI 없음 → 방향 없이 운영 중, 비즈니스 모델 재정의 최우선 처방",
    "자금·BEP 연계: 운영 자금 부족 + BEP 모름 → 생존 기간 계산 불가 위기, 즉각 재무 진단 처방",
    "차별화·진입장벽 연계: 차별화 없음 + 진입장벽 없음 → 모방 즉시 도태 구조, IP·계약·브랜드 구축 처방"
  ]
};

if (typeof module !== 'undefined') module.exports = BIZMODEL_ETC;
