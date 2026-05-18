const INDUSTRY_FINANCE = {
  id: 'finance',
  label: '금융 및 핀테크',
  icon: '🏦',
  description: '소규모 대부업·자산관리 자문·핀테크 플랫폼 스타트업. 자본 적정성과 리스크 관리가 핵심.',
  areas: [
    {
      id: 'fin_system',
      label: '시스템 및 재무 건전성',
      icon: '💰',
      items: [
        { id:'fn_1_1', label:'자본 적정성 및 유동성', type:'bars', question:'자금 조달 원천의 안정성 및 갑작스러운 인출·상환 요구에 대응 가능한 유동 자산 비중을 관리하고 있습니까?', scale:[{score:1,desc:'자본 적정성 개념 없음. 유동성 위기 상시.'},{score:2,desc:'유동 자산 대략 파악. 관리 체계 없음.'},{score:3,desc:'유동성 비율 분기 관리. 비상 자금 일부 보유.'},{score:4,desc:'유동성 실시간 모니터링. 비상 자금 3개월치 보유.'},{score:5,desc:'자본 적정성 완전 관리. 급격한 인출 요구 즉각 대응.'}], ai_trigger:{threshold:2,warning:'liquidity_risk_high'} },
        { id:'fn_1_2', label:'부실 채권·연체 관리', type:'bars', question:'대출·자산 관리 상품의 연체 발생률 및 부실화된 자산의 매각·상각 처리 프로세스를 갖추고 있습니까?', scale:[{score:1,desc:'연체 관리 없음. 부실 채권 방치.'},{score:2,desc:'연체율 집계. 처리 프로세스 없음.'},{score:3,desc:'연체율 월 관리. 부실 처리 기준 보유.'},{score:4,desc:'연체 조기 감지 + 자동 처리 프로세스 가동.'},{score:5,desc:'AI 연체 예측. 부실 채권 0% 목표 달성 체계.'}], ai_trigger:{threshold:2,warning:'npl_unmanaged'} },
        { id:'fn_1_3', label:'고정비·시스템 유지비', type:'bars', question:'클라우드 서버 비용·망 사용료 등 고정비 비중 및 트래픽 증가에 따른 비용 민감도를 관리하고 있습니까?', scale:[{score:1,desc:'고정비 비중 파악 없음. 비용 관리 없음.'},{score:2,desc:'주요 고정비 집계. 트래픽 비용 미분석.'},{score:3,desc:'고정비 비중 월 관리. 트래픽 비용 예측.'},{score:4,desc:'고정비 최적화. 트래픽 증가 비용 선형화 관리.'},{score:5,desc:'인프라 비용 AI 자동 최적화. 고정비 업계 최저 수준.'}], ai_trigger:{threshold:2,warning:'fixed_cost_high'} },
        { id:'fn_1_4', label:'수수료·이자 구조', type:'bars', question:'주 수익원(이자 마진·수수료)의 편중도 및 시장 금리 변동에 따른 순이익 변화 폭을 관리하고 있습니까?', scale:[{score:1,desc:'수익원 편중 파악 없음. 금리 변동 무방비.'},{score:2,desc:'주요 수익원 파악. 금리 민감도 분석 없음.'},{score:3,desc:'수익원 다변화 진행 중. 금리 시나리오 분석.'},{score:4,desc:'수익원 균형 포트폴리오. 금리 변동 영향 최소화.'},{score:5,desc:'수익 구조 완전 다변화. 금리 변동 자동 헤지 체계.'}], ai_trigger:{threshold:2,warning:'revenue_concentration_risk'} },
      ]
    },
    {
      id: 'fin_compliance',
      label: '프로세스 및 품질 안정',
      icon: '🛡️',
      items: [
        { id:'fn_2_1', label:'본인인증·결제 성공률', type:'bars', question:'비대면 실명 확인 및 결제 프로세스의 이탈률(Drop-rate)과 시스템 응답 속도를 관리하고 있습니까?', scale:[{score:1,desc:'인증·결제 성공률 측정 없음. 이탈 파악 불가.'},{score:2,desc:'전체 성공률 대략 파악. 단계별 분석 없음.'},{score:3,desc:'단계별 이탈률 집계. 병목 구간 개선.'},{score:4,desc:'성공률 98% 이상. 응답 속도 1초 이내.'},{score:5,desc:'AI 기반 인증 최적화. 성공률 99.9% 달성 체계.'}], ai_trigger:{threshold:2,warning:'auth_payment_dropout'} },
        { id:'fn_2_2', label:'금소법·규제 대응', type:'bars', question:'금융소비자보호법 이행 수준 및 불완전 판매 방지 시스템 가동 여부를 갖추고 있습니까?', scale:[{score:1,desc:'금소법 이행 없음. 영업 정지 위험.'},{score:2,desc:'기본 이행 수준. 불완전 판매 관리 없음.'},{score:3,desc:'금소법 주요 조항 준수. 불완전 판매 체크리스트.'},{score:4,desc:'금소법 완전 준수. 자동화 불완전 판매 방지.'},{score:5,desc:'금소법 선도적 준수. 규제 변화 선제 대응 체계.'}], ai_trigger:{threshold:2,warning:'financial_consumer_protection_weak'} },
        { id:'fn_2_3', label:'이상거래 탐지(FDS)', type:'bars', question:'부정 결제나 자금 세탁 의심 거래를 실시간으로 탐지하고 차단하는 알고리즘의 정교함을 갖추고 있습니까?', scale:[{score:1,desc:'FDS 없음. 부정 거래 탐지 불가.'},{score:2,desc:'기본 블랙리스트만 운영. 실시간 탐지 없음.'},{score:3,desc:'규칙 기반 FDS 운영. 주요 이상 패턴 탐지.'},{score:4,desc:'ML 기반 FDS. 실시간 이상 거래 자동 차단.'},{score:5,desc:'AI FDS 완성. 탐지 정확도 99.9% + 오탐률 0%.'}], ai_trigger:{threshold:2,warning:'fds_not_operational'} },
        { id:'fn_2_4', label:'보안·데이터 무결성', type:'bars', question:'외부 해킹 방지 체계 및 데이터 전송·저장 과정에서 위변조를 막는 기술적 보호 수준을 갖추고 있습니까?', scale:[{score:1,desc:'보안 체계 없음. 해킹 위험 높음.'},{score:2,desc:'기본 SSL·방화벽만 운영.'},{score:3,desc:'정기 보안 점검 + 취약점 패치 체계.'},{score:4,desc:'보안 인증(ISMS 등) 완료. 실시간 위협 탐지.'},{score:5,desc:'제로 트러스트 보안. 데이터 무결성 완전 보장.'}], ai_trigger:{threshold:2,warning:'security_vulnerability'} },
      ]
    },
    {
      id: 'fin_hr',
      label: '인적 자원 및 조직 역량',
      icon: '👥',
      items: [
        { id:'fn_3_1', label:'리스크 관리자 전문성', type:'bars', question:'준법감시인 및 리스크 매니저의 전문 자격 보유 여부와 내부 통제 권한의 실질적 독립성을 갖추고 있습니까?', scale:[{score:1,desc:'리스크 관리 전담자 없음. 대표가 모든 결정.'},{score:2,desc:'겸직 준법감시인 운영. 전문성 부족.'},{score:3,desc:'전문 자격 준법감시인 선임. 기본 독립성.'},{score:4,desc:'리스크 관리팀 구성. 실질적 독립성 확보.'},{score:5,desc:'글로벌 수준 리스크 관리 체계. 내부 통제 완성.'}], ai_trigger:{threshold:2,warning:'risk_manager_weak'} },
        { id:'fn_3_2', label:'핵심 개발 인력 비중', type:'bars', question:'금융 도메인 지식을 갖춘 IT 개발자의 근속연수 및 외주 의존도에 따른 기술 내재화 수준을 갖추고 있습니까?', scale:[{score:1,desc:'개발 인력 없음. 100% 외주 의존.'},{score:2,desc:'소수 개발자 보유. 외주 의존도 높음.'},{score:3,desc:'핵심 개발팀 구성. 외주 의존도 50% 이하.'},{score:4,desc:'금융 도메인 전문 개발팀. 외주 30% 이하.'},{score:5,desc:'기술 내재화 완성. 외주 0% + 핵심 IP 자체 개발.'}], ai_trigger:{threshold:2,warning:'dev_talent_outsourced'} },
        { id:'fn_3_3', label:'내부 통제·윤리 경영', type:'bars', question:'권한 오남용 방지 시스템 및 금융 사고 방지를 위한 정기적인 내부 감사 시행 여부를 갖추고 있습니까?', scale:[{score:1,desc:'내부 통제 없음. 권한 오남용 위험.'},{score:2,desc:'기본 권한 분리. 감사 없음.'},{score:3,desc:'내부 감사 연 1회. 주요 통제 항목 관리.'},{score:4,desc:'분기 내부 감사. 권한 오남용 자동 탐지.'},{score:5,desc:'상시 내부 감사 체계. 윤리 경영 완전 실현.'}], ai_trigger:{threshold:2,warning:'internal_control_weak'} },
        { id:'fn_3_4', label:'핵심 인력 Key-man 리스크', type:'bars', question:'최고 경영진이나 핵심 알고리즘 설계자 유고 시 비즈니스 연속성 계획(BCP)을 보유하고 있습니까?', scale:[{score:1,desc:'BCP 없음. 핵심 인력 유고 시 사업 중단.'},{score:2,desc:'Key-man 리스크 인지. BCP 미수립.'},{score:3,desc:'주요 직무 BCP 보유. 기본 대응 체계.'},{score:4,desc:'전 직무 BCP 완비. 정기 훈련 실시.'},{score:5,desc:'BCP 완전 자동화. Key-man 리스크 0% 달성.'}], ai_trigger:{threshold:2,warning:'keyman_bcp_missing'} },
      ]
    },
    {
      id: 'fin_market',
      label: '마케팅 및 시장 지배력',
      icon: '📈',
      items: [
        { id:'fn_4_1', label:'고객 획득 비용(CAC) 추이', type:'bars', question:'신규 가입자 한 명을 얻기 위한 마케팅 지출의 적정성 및 기간별 변동 추이를 관리하고 있습니까?', scale:[{score:1,desc:'CAC 측정 없음. 마케팅 비용 효율 파악 불가.'},{score:2,desc:'전체 CAC 대략 파악. 채널별 분석 없음.'},{score:3,desc:'채널별 CAC 집계. LTV 대비 비교.'},{score:4,desc:'CAC 최적화 진행 중. LTV/CAC 3배 이상 유지.'},{score:5,desc:'CAC 실시간 최적화. AI 기반 채널 예산 자동 배분.'}], ai_trigger:{threshold:2,warning:'cac_ltv_imbalanced'} },
        { id:'fn_4_2', label:'앱 평점·고객 이탈률', type:'bars', question:'모바일 앱 서비스 만족도 및 경쟁사로의 고객 이동(Churn-rate) 관리 지표를 갖추고 있습니까?', scale:[{score:1,desc:'앱 평점·이탈률 관리 없음.'},{score:2,desc:'앱 평점 파악. 이탈 원인 분석 없음.'},{score:3,desc:'앱 평점 4.0 이상 유지. 이탈률 집계.'},{score:4,desc:'이탈 사전 감지 + 재활성화 캠페인 가동.'},{score:5,desc:'앱 평점 4.8 이상. 이탈률 업계 최저 달성.'}], ai_trigger:{threshold:2,warning:'app_churn_high'} },
        { id:'fn_4_3', label:'제휴 네트워크 파워', type:'bars', question:'협력 금융사·PG·포인트 제휴처 등 파트너십 확장의 속도와 질을 관리하고 있습니까?', scale:[{score:1,desc:'제휴 없음. 단독 서비스만 운영.'},{score:2,desc:'소수 제휴처 보유. 확장 전략 없음.'},{score:3,desc:'주요 제휴 5개 이상. 정기 제휴 확대.'},{score:4,desc:'제휴 네트워크 20개 이상. 시너지 효과 창출.'},{score:5,desc:'제휴 생태계 완성. 업계 표준 파트너십 허브.'}], ai_trigger:{threshold:2,warning:'partnership_network_weak'} },
        { id:'fn_4_4', label:'브랜드 신뢰도 지표', type:'bars', question:'금융 사고 무결성 기간 및 대외적으로 인지되는 서비스의 안전성 평판 점수를 관리하고 있습니까?', scale:[{score:1,desc:'브랜드 신뢰도 관리 없음. 사고 이력 존재.'},{score:2,desc:'기본 신뢰도 유지. 체계적 관리 없음.'},{score:3,desc:'금융 사고 0건 유지. 안전성 홍보 체계.'},{score:4,desc:'업계 신뢰도 상위. 수상 실적 보유.'},{score:5,desc:'업계 최고 신뢰도. 고객이 먼저 추천하는 브랜드.'}], ai_trigger:{threshold:2,warning:'brand_trust_weak'} },
      ]
    },
  ],
  ai_analysis: [
    { trigger:'npl_unmanaged+fds_not_operational', level:'CRITICAL', msg:'연체율이 상승하는데 FDS 탐지 알고리즘 업데이트가 지연되고 있다면 타겟 사기의 표적이 될 수 있습니다. 신용 평가 모델(CSS) 고도화 프로젝트를 긴급 제안합니다.' },
    { trigger:'cac_ltv_imbalanced+app_churn_high', level:'HIGH', msg:'마케팅 비용(CAC)은 오르는데 고객당 순수익(LTV)이 정체 중이라면 수익 모델의 한계입니다. 고관여 금융 상품 크로스셀링 전략을 처방합니다.' },
    { trigger:'financial_consumer_protection_weak+security_vulnerability', level:'CRITICAL', msg:'금소법 준수 수준은 낮으나 마케팅 확장이 공격적이라면 영업 정지 리스크가 매우 큽니다. 선 규제 준수 시스템 구축 후 마케팅 실행 로드맵을 수립합니다.' },
  ],
};
if (typeof window !== 'undefined') window.INDUSTRY_FINANCE = INDUSTRY_FINANCE;
if (typeof module !== 'undefined') module.exports = INDUSTRY_FINANCE;
