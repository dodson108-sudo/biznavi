const BIZMODEL_USAGE_BASED = {
  id: "usage_based",
  title: "종량제·사용량 기반 모델 특화 진단",
  areas: [
    {
      id: "metering",
      title: "영역 1: 사용량 측정 및 과금 정확성",
      description: "미터링·청구 정확도·분쟁 대응 진단",
      items: [
        { id: "1_1", text: "사용량 측정(미터링) 정확도 및 실시간성", min: "수동·오류 잦음", max: "자동화·99.9% 정확도" },
        { id: "1_2", text: "청구서 투명성 및 고객 이해도", min: "불만·분쟁 잦음", max: "셀프 조회·완전 투명" },
        { id: "1_3", text: "사용량 급증 시 자동 알림·한도 설정", min: "없음", max: "실시간 알림·캡 설정" },
        { id: "1_4", text: "결제 실패·미납 자동 대응 체계", min: "없음", max: "자동 재시도·서비스 제한" }
      ]
    },
    {
      id: "revenue",
      title: "영역 2: 수익 예측 가능성 및 안정성",
      description: "수익 변동성·최소 약정·믹스 전략 진단",
      items: [
        { id: "2_1", text: "월간 수익 변동성(표준편차) 관리", min: "±40% 이상 변동", max: "±10% 이내 안정" },
        { id: "2_2", text: "최소 약정(Committed Use) 고객 비중", min: "없음·순수 종량제", max: "50% 이상 약정" },
        { id: "2_3", text: "고사용량 고객 유지 및 이탈 방지", min: "이탈 대응 없음", max: "전담 CS·알림 체계" },
        { id: "2_4", text: "수익 예측 모델 및 분기 목표 관리", min: "없음", max: "ML 기반 예측·검증" }
      ]
    },
    {
      id: "pricing",
      title: "영역 3: 가격 구조 최적화",
      description: "단가 경쟁력·볼륨 할인·밸류 기반 가격 진단",
      items: [
        { id: "3_1", text: "단가 경쟁력(경쟁사 대비 가격 포지션)", min: "열위·자주 이탈", max: "우위 또는 가치 차별화" },
        { id: "3_2", text: "볼륨 기반 단가 할인 구조 설계", min: "없음·단일 단가", max: "구간별 최적 구조" },
        { id: "3_3", text: "고객 ROI 기반 가치 제안 능력", min: "없음", max: "ROI 수치 제시 가능" },
        { id: "3_4", text: "신규 과금 항목 개발(Add-on·확장 기능)", min: "없음", max: "정기 신규 항목 출시" }
      ]
    },
    {
      id: "growth",
      title: "영역 4: 사용량 성장 및 고객 확장",
      description: "Net Revenue Retention·업셀·신규 고객 진단",
      items: [
        { id: "4_1", text: "NRR(Net Revenue Retention) 관리", min: "파악 안함", max: "110% 이상 유지" },
        { id: "4_2", text: "기존 고객 사용량 성장(Expansion Revenue)", min: "없음", max: "분기 10% 이상 성장" },
        { id: "4_3", text: "고사용 고객 레퍼런스·사례 확보", min: "없음", max: "5개 이상 공개 사례" },
        { id: "4_4", text: "신규 유즈케이스 발굴 및 시장 확장", min: "없음", max: "분기 1개 이상 개척" }
      ]
    }
  ],
  insights: [
    "미터링·분쟁 연계: 측정 오류 잦음 + 청구 불만 → 신뢰 손상으로 이탈 가속, 자동화 미터링 시스템 도입 처방",
    "수익 변동·약정 연계: 변동성 높음 + 최소 약정 없음 → 현금흐름 예측 불가, Committed Use 할인 구조로 전환 처방",
    "NRR·확장 연계: NRR 100% 이하 + 사용량 정체 → 기존 고객 사용 증가 전략(교육·기능 확장) 최우선 처방"
  ]
};

if (typeof module !== 'undefined') module.exports = BIZMODEL_USAGE_BASED;
