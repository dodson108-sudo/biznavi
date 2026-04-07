const INDUSTRY_LOCAL_SERVICE = {
  id: "local_service",
  title: "생활밀착형 서비스업 특화 진단",
  areas: [
    {
      id: "standard",
      title: "영역 1: 서비스 표준 및 시스템화",
      description: "SOP·CRM·공간 가동 효율 진단",
      items: [
        { id: "1_1", text: "서비스 SOP 매뉴얼 보유", min: "전혀 없음", max: "완전 문서화" },
        { id: "1_2", text: "CRM 예약·고객 데이터 관리", min: "카톡·수기", max: "전문 솔루션 운영" },
        { id: "1_3", text: "공간·시설 가동 효율", min: "유휴 공간 50% 이상", max: "가동률 최적화" },
        { id: "1_4", text: "결제·정산 투명성", min: "수기 정산", max: "일일 자동 정산" }
      ]
    },
    {
      id: "retention",
      title: "영역 2: 고객 관계 및 재방문 로직",
      description: "단골 유지·LTV·노쇼 리스크 진단",
      items: [
        { id: "2_1", text: "3개월 내 재방문율 추적", min: "거의 없음", max: "체계적 추적·관리" },
        { id: "2_2", text: "회원권·선결제 현금흐름", min: "전혀 없음", max: "LTV 기반 운영" },
        { id: "2_3", text: "노쇼 방지 시스템", min: "대책 없음", max: "선입금·알림톡 완비" },
        { id: "2_4", text: "고객 VOC 수집·개선 루프", min: "없음", max: "즉시 반영 체계" }
      ]
    },
    {
      id: "marketing",
      title: "영역 3: 마케팅 침투 및 로컬 영향력",
      description: "네이버 플레이스·SNS·리뷰 영토 진단",
      items: [
        { id: "3_1", text: "네이버 플레이스 상위 노출", min: "검색 안됨", max: "지역 키워드 1위권" },
        { id: "3_2", text: "SNS·당근마켓 방문 전환율", min: "전혀 없음", max: "전환율 추적 관리" },
        { id: "3_3", text: "부정 리뷰 대응 속도", min: "방치", max: "전략적 즉시 대응" },
        { id: "3_4", text: "지역 오프라인 네트워크", min: "없음", max: "맘카페·단지 협약" }
      ]
    },
    {
      id: "economics",
      title: "영역 4: 인적 역량 및 수익 관리",
      description: "인건비 효율·고정비·BEP 진단",
      items: [
        { id: "4_1", text: "핵심 인력 근속·이탈 대책", min: "이탈 잦음·대책 없음", max: "장기 근속·단골 보호" },
        { id: "4_2", text: "직원 1인당 매출 기여도", min: "파악 안함", max: "인센티브 연동 관리" },
        { id: "4_3", text: "매출 대비 고정비 비중", min: "40% 이상", max: "BEP 이하 관리" },
        { id: "4_4", text: "시그니처 서비스 차별화", min: "없음", max: "독보적 경쟁력 보유" }
      ]
    }
  ],
  insights: [
    "데이터·운영 연계: 예약 시스템 활용 높음 + 재방문율 낮음 → 마케팅 성공이나 현장 서비스 품질 심각 문제",
    "LTV·현금흐름 연계: 회원권 비중 과다 → 미래 매출 선당겨쓰기 경고, 추가 객단가 상승 전략 처방",
    "플레이스·리뷰 연계: 노출 잘됨 + 평점 낮음 → 노출될수록 악명 확산, 마케팅 중단 후 내부 품질 개선 처방"
  ]
};

if (typeof module !== 'undefined') module.exports = INDUSTRY_LOCAL_SERVICE;
