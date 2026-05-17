const INDUSTRY_EXPORT_SME = {
  id: 'export_sme',
  label: '수출 주도형 중소기업',
  icon: '🌏',
  description: '해외 직접·간접 수출 사업을 영위하는 기업. 바이어 인증 및 규제 이슈가 필수이며 환리스크 관리가 수익률을 결정함.',
  areas: [
    {
      id: 'exp_sales',
      label: '해외 영업 및 시장 침투',
      icon: '📊',
      items: [
        {
          id: 'exp_1_1',
          label: '수출 포트폴리오',
          type: 'bars',
          question: '특정 국가 의존도와 신규 시장 개척 진척도를 데이터로 관리하고 있습니까?',
          scale: [
            { score: 1, desc: '단일 국가 100% 의존. 신규 시장 개척 계획 없음.' },
            { score: 2, desc: '2~3개국 거래. 신규 시장 개척 미진함.' },
            { score: 3, desc: '5개국 이상 거래. 신규 시장 개척 연 1건 이상.' },
            { score: 4, desc: '10개국 이상 포트폴리오. 국가별 매출 비중 관리.' },
            { score: 5, desc: '20개국 이상 포트폴리오. 리스크 동적 모니터링.' }
          ],
          ai_trigger: { threshold: 2, warning: 'country_concentration' }
        },
        {
          id: 'exp_1_2',
          label: '글로벌 온라인 채널 접점',
          type: 'bars',
          question: '아마존·알리바바·쇼피파이 등 글로벌 플랫폼 접점 및 채널별 매출 비중을 관리하고 있습니까?',
          scale: [
            { score: 1, desc: '글로벌 온라인 채널 미입점. 오프라인 바이어만 의존.' },
            { score: 2, desc: '1~2개 플랫폼 기초 입점. 매출 미미.' },
            { score: 3, desc: '주요 플랫폼 3개 이상 입점. 채널별 매출 집계.' },
            { score: 4, desc: '플랫폼별 최적화 운영. ROAS 관리함.' },
            { score: 5, desc: '글로벌 멀티채널 전략 완성. AI 기반 채널별 예산 자동 배분.' }
          ],
          ai_trigger: { threshold: 2, warning: 'global_channel_weak' }
        },
        {
          id: 'exp_1_3',
          label: '해외 바이어 교섭력',
          type: 'bars',
          question: '직접 수출과 간접 수출의 비중, 바이어 발굴 루트와 협상력을 갖추고 있습니까?',
          scale: [
            { score: 1, desc: '100% 간접 수출 의존. 직접 바이어 없음.' },
            { score: 2, desc: '소수 바이어에 집중. 발굴 채널 단일.' },
            { score: 3, desc: '직접 수출 30% 이상. 바이어 발굴 채널 복수화.' },
            { score: 4, desc: '직접 수출 60% 이상. 전시회·B2B 플랫폼 활용.' },
            { score: 5, desc: '직접 수출 80% 이상. 글로벌 바이어 네트워크 자산화.' }
          ],
          ai_trigger: { threshold: 2, warning: 'buyer_dependency' }
        },
        {
          id: 'exp_1_4',
          label: '다국어 세일즈 콘텐츠',
          type: 'bars',
          question: '영문·현지어별 전문 카탈로그·웹사이트·영상 에셋을 보유하고 있습니까?',
          scale: [
            { score: 1, desc: '다국어 자료가 없음. 다국어 번역 전무.' },
            { score: 2, desc: '영문 기본 자료 보유. 기타 언어 미준비.' },
            { score: 3, desc: '영문 전문 카탈로그 + 웹사이트 준비.' },
            { score: 4, desc: '영어·3개국 언어 로컬라이징 자료.' },
            { score: 5, desc: '전 진출국 언어 전략 로컬라이징 + AI 번역 자동화.' }
          ],
          ai_trigger: { threshold: 2, warning: 'multilingual_content_weak' }
        }
      ]
    },
    {
      id: 'exp_compliance',
      label: '수출 프로세스 및 규제 이슈',
      icon: '📋',
      items: [
        {
          id: 'exp_2_1',
          label: '수출 전문 인력 및 조직',
          type: 'bars',
          question: '통관·인증·서류 업무를 담당하는 전담 인력 보유 여부 및 관세사·포워더 협력 체계가 구축되어 있습니까?',
          scale: [
            { score: 1, desc: '수출 담당 인력 없음. 대표가 모든 서류 처리.' },
            { score: 2, desc: '겸직 인력이 수출 업무 처리. 전문성 미흡.' },
            { score: 3, desc: '수출 담당 인력 1명 이상. 관세사 협력 체계.' },
            { score: 4, desc: '수출팀 구성. 포워더 네트워크 구비함.' },
            { score: 5, desc: '수출 전담 조직 완비. 글로벌 물류 파트너 네트워크 구축.' }
          ],
          ai_trigger: { threshold: 2, warning: 'export_personnel_weak' }
        },
        {
          id: 'exp_2_2',
          label: '해외 규격 인증 보유',
          type: 'bars',
          question: 'CE·FDA·JIS 등 주요 진출시장 필수 인증 보유 현황 및 갱신 관리 시스템이 운영되고 있습니까?',
          scale: [
            { score: 1, desc: '해외 인증 없음. 진입 불가 시장 다수.' },
            { score: 2, desc: '1~2개 기초 인증 보유. 갱신 관리 미비.' },
            { score: 3, desc: '주요 진출시장 인증 준비. 갱신 일정 관리.' },
            { score: 4, desc: '복수 시장 인증 포트폴리오. 자동 갱신 알림 운영.' },
            { score: 5, desc: '전 진출시장 인증 완비. 신규 인증 신속 취득 체계.' }
          ],
          ai_trigger: { threshold: 2, warning: 'certification_missing' }
        },
        {
          id: 'exp_2_3',
          label: '무역 규제 및 통관 리스크',
          type: 'bars',
          question: '전략물자 지정, 원산지 증명(FTA) 활용 역량 및 금지·제한 수출 품목 이슈 대응력을 갖추고 있습니까?',
          scale: [
            { score: 1, desc: '수출 규제 지식 없음. 통관 리스크 무방비.' },
            { score: 2, desc: '기본 규제에 대응. FTA 활용 경험 없음.' },
            { score: 3, desc: 'FTA 원산지 증명 활용. 주요 규제 준수.' },
            { score: 4, desc: '전략물자 이슈 사전 확인 체계. 관세 최적화 체계.' },
            { score: 5, desc: '수출 규제 전략 재정립. FTA 관세 혜택 최적 활용.' }
          ],
          ai_trigger: { threshold: 2, warning: 'export_regulation_risk' }
        },
        {
          id: 'exp_2_4',
          label: '글로벌 품질 보증(A/S)',
          type: 'bars',
          question: '해외 현지 반품·수리 요청 시 대응 프로세스 및 딜러사 교육 체계를 보유하고 있습니까?',
          scale: [
            { score: 1, desc: '해외 A/S 프로세스 없음. 클레임 시 임기응변.' },
            { score: 2, desc: '이메일·전화 원격 대응만 가능.' },
            { score: 3, desc: '현지 파트너에 위탁한 A/S 체계 구축.' },
            { score: 4, desc: '현지 파트너 교육 자료. A/S 매뉴얼 제공됨.' },
            { score: 5, desc: '글로벌 A/S 네트워크 완비. 24시간 대응 체계.' }
          ],
          ai_trigger: { threshold: 2, warning: 'global_as_weak' }
        }
      ]
    },
    {
      id: 'exp_logistics',
      label: '글로벌 물류 및 SCM',
      icon: '🚢',
      items: [
        {
          id: 'exp_3_1',
          label: '국제 물류 비용 최적화',
          type: 'bars',
          question: '매출 대비 물류비 비중 및 포워더별 견적 비교 분석을 통한 물류비 절감 역량을 갖추고 있습니까?',
          scale: [
            { score: 1, desc: '물류비 모니터링 없음. 단일 포워더에 의존.' },
            { score: 2, desc: '연간 물류비 집계. 비교 분석 없음.' },
            { score: 3, desc: '복수 포워더 비교 견적. 물류비 비중 관리.' },
            { score: 4, desc: '물류비 최적화 계약. 매출 대비 비중 목표 관리.' },
            { score: 5, desc: '글로벌 물류 최적화 플랫폼 활용. 실시간 비용 비교·자동 발주.' }
          ],
          ai_trigger: { threshold: 2, warning: 'logistics_cost_high' }
        },
        {
          id: 'exp_3_2',
          label: '수출용 포장 및 강인성',
          type: 'bars',
          question: '장거리 운송 시 파손 방지를 위한 수출 전용 포키지 설계 및 컨테이너 적재 효율을 갖추고 있습니까?',
          scale: [
            { score: 1, desc: '국내용 포장 그대로 수출. 파손 클레임 빈번.' },
            { score: 2, desc: '기본 완충재 추가. 수출 전용 포키지 없음.' },
            { score: 3, desc: '수출 전용 포키지 설계 자료. 파손율 관리.' },
            { score: 4, desc: '컨테이너 적재 최적화. 파손율 1% 이하.' },
            { score: 5, desc: 'AI 기반 적재 최적화. 물류비·파손율 실시간 최소화.' }
          ],
          ai_trigger: { threshold: 2, warning: 'export_packaging_weak' }
        },
        {
          id: 'exp_3_3',
          label: '인코텀스(Incoterms) 활용',
          type: 'bars',
          question: '거래 조건에 따른 위험 전가 시점 이해 및 물류비 분담의 유리함을 확보하고 있습니까?',
          scale: [
            { score: 1, desc: '인코텀스 개념 없음. 거래 조건 불리하게 적용.' },
            { score: 2, desc: '기본 인코텀스 이해. 협상 적용 미흡.' },
            { score: 3, desc: '주요 인코텀스 조건을 활용. 거래별 최적 조건 협상.' },
            { score: 4, desc: '인코텀스 전문 활용. 물류비·리스크 최적 배분.' },
            { score: 5, desc: '인코텀스 전략 재정립. 조건별 수익성 분석 후 최유리 조건 확보.' }
          ],
          ai_trigger: { threshold: 2, warning: 'incoterms_weak' }
        },
        {
          id: 'exp_3_4',
          label: '현지 재고·창고 전략',
          type: 'bars',
          question: '해외 현지 창고 보유 여부 및 해외 시장 수요 예측을 위한 적정 재고 운영 체계를 갖추고 있습니까?',
          scale: [
            { score: 1, desc: '현지 재고 없음. 주문 후 바로 한국 출고.' },
            { score: 2, desc: '현지 파트너 창고 임시 활용. 재고 관리 미흡.' },
            { score: 3, desc: '현지 창고 계약. 기본 재고 운영 관리.' },
            { score: 4, desc: '수요 예측 기반 현지 재고 최적화.' },
            { score: 5, desc: '글로벌 재고 실시간 관리. AI 수요 예측 + 자동 보충 발주.' }
          ],
          ai_trigger: { threshold: 2, warning: 'local_inventory_weak' }
        }
      ]
    },
    {
      id: 'exp_finance',
      label: '재무 관리 및 환리스크',
      icon: '💱',
      items: [
        {
          id: 'exp_4_1',
          label: '환리스크 관리 체계',
          type: 'bars',
          question: '환율 변동에 따른 수익 민감도 분석 및 선물환·환헤지 보험 등 위험 관리 수단 활용을 갖추고 있습니까?',
          scale: [
            { score: 1, desc: '환리스크 지식 없음. 환율 변동에 완전 무방비.' },
            { score: 2, desc: '환리스크 인지하나 대응 수단 미활용.' },
            { score: 3, desc: '선물환 보험 가입. 기본 환리스크 체계 운영.' },
            { score: 4, desc: '선물환 + 보험 복합 대응. 환율 시나리오 분석.' },
            { score: 5, desc: '환리스크 전략 관리. 헤지 비율 자동 최적화 체계.' }
          ],
          ai_trigger: { threshold: 2, warning: 'fx_risk_unmanaged' }
        },
        {
          id: 'exp_4_2',
          label: '수출 대금 결제 조건',
          type: 'bars',
          question: '결제 방식(T/T·L/C 등)에 따른 미수금 발생 위험 관리를 이루고 있습니까?',
          scale: [
            { score: 1, desc: '결제 조건 협상 없음. 선불 결제 무조건 적용.' },
            { score: 2, desc: '주요 바이어 신용 조사 없이 거래.' },
            { score: 3, desc: '신용 조사 후 결제 조건 차등 적용.' },
            { score: 4, desc: 'L/C·T/T 혼합 활용. 미수금 리스크 최소화.' },
            { score: 5, desc: '바이어별 신용 등급 관리. 결제 조건 자동 최적화.' }
          ],
          ai_trigger: { threshold: 2, warning: 'payment_risk_high' }
        },
        {
          id: 'exp_4_3',
          label: '수출 금융 및 정책 자금',
          type: 'bars',
          question: '수출입은행·무역보험공사의 수출 신용 보증 및 운전 자금 활용 현황을 갖추고 있습니까?',
          scale: [
            { score: 1, desc: '수출 정책 자금 전혀 없음. 미활용.' },
            { score: 2, desc: '무역보험 기초 가입. 추가 활용 없음.' },
            { score: 3, desc: '수출 신용 보증 + 운전 자금 활용.' },
            { score: 4, desc: '정책 자금 포트폴리오 최적화. 금리 혜택 목표 관리.' },
            { score: 5, desc: '수출 정책 자금 최대 활용. 전담 관리 체계 완비.' }
          ],
          ai_trigger: { threshold: 2, warning: 'export_finance_underutilized' }
        },
        {
          id: 'exp_4_4',
          label: '수출 원가 및 채산성 분석',
          type: 'bars',
          question: '환율·관세·운송을 반영한 실질 수출 채산성(Net Margin) 분석 및 가격 책정 전략을 보유하고 있습니까?',
          scale: [
            { score: 1, desc: '수출 채산성 계산 없음. 국내 가격 그대로 제시.' },
            { score: 2, desc: '대략적인 수출 마진 파악. 국가별 차등 없음.' },
            { score: 3, desc: '국가별 관세·운송 포함 채산성 분기 계산.' },
            { score: 4, desc: '실시간 채산성 대시보드 운영. 국가별 최적 가격 전략.' },
            { score: 5, desc: 'AI 기반 글로벌 가격 최적화. 채산성 자동 모니터링.' }
          ],
          ai_trigger: { threshold: 2, warning: 'export_margin_blind' }
        }
      ]
    }
  ],
  ai_analysis: [
    {
      trigger: 'country_concentration+fx_risk_unmanaged',
      level: 'CRITICAL',
      msg: '특정 국가 매출 비중이 높은데 환헤지 수단이 없다면 환율 변동에 무방비 상태입니다. 선물환 보험 가입과 결제 통화 분산이 최우선 처방입니다.'
    },
    {
      trigger: 'certification_missing+global_channel_weak',
      level: 'HIGH',
      msg: '필수 인증도 없고 온라인 채널 매출도 없다면 기술력이 해외 시장 진입을 막고 있습니다. 수출 바이어 개발을 위한 전시마케팅 및 인증 취득 지원을 제안합니다.'
    },
    {
      trigger: 'logistics_cost_high+incoterms_weak',
      level: 'HIGH',
      msg: '물류비 비중이 높은데 인코텀스 활용이 미흡하면 가격 협상에서 불리합니다. 전문가를 통한 물류 최적화 컨설팅 및 관세사 급도 활용을 처방합니다.'
    }
  ]
};

if (typeof window !== 'undefined') window.INDUSTRY_EXPORT_SME = INDUSTRY_EXPORT_SME;
if (typeof module !== 'undefined') module.exports = INDUSTRY_EXPORT_SME;
