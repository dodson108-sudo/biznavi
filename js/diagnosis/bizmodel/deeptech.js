const BM_DEEPTECH = {
  id: 'deeptech',
  label: '딥테크·바이오 (Moonshot)',
  icon: '🔬',
  description: '고도의 기술과 연구개발이 수반되며 많은 자본과 오랜 시간이 투입되는 대신 성공 시 시장 독점이 가능한 모델. 바이오·우주·핵융합·양자컴퓨팅·신소재 등.',
  keyMetrics: ['TRL', '마일스톤 달성률', 'IP 포트폴리오', '번레이트·런웨이'],
  areas: [
    {
      id: 'dt_technology',
      label: '기술 성숙도 및 IP 자산',
      icon: '⚗️',
      items: [
        { id:'dt_1_1', label:'기술 성숙도 수준(TRL)', type:'bars', question:'기초연구(TRL 1~3)인지 시작품(TRL 4~6)인지 양산 준비(TRL 7~9)인지에 따른 현재 위치를 정확히 인지하고 있습니까?', scale:[{score:1,desc:'TRL 개념 없음. 기술 단계 인지 불가.'},{score:2,desc:'TRL 인지하나 자사 위치 불명확. TRL 1~2 수준.'},{score:3,desc:'TRL 3~4 수준. PoC 일부 달성. 단계 명확 인지.'},{score:4,desc:'TRL 5~6 수준. 파일럿 검증 완료. 다음 단계 로드맵 보유.'},{score:5,desc:'TRL 7~9 수준. 양산 준비 완료. 상용화 진입 단계.'}], ai_trigger:{threshold:2,warning:'trl_too_low'} },
        { id:'dt_1_2', label:'핵심 특허·IP 포트폴리오', type:'bars', question:'독점적 기술 보호를 위한 특허 출원·등록 현황, 특허 방어 전략, 기술 라이선싱 가능성을 확보하고 있습니까?', scale:[{score:1,desc:'특허 없음. 기술 보호 장치 전무.'},{score:2,desc:'특허 출원 중. 등록 미완료.'},{score:3,desc:'핵심 특허 등록 완료. 방어 전략 기초 수립.'},{score:4,desc:'특허 포트폴리오 구축. 라이선싱 수익 일부 발생.'},{score:5,desc:'강력한 특허 방어망 완성. 라이선싱 주요 수익원화.'}], ai_trigger:{threshold:2,warning:'ip_portfolio_weak'} },
        { id:'dt_1_3', label:'기술 검증(PoC) 달성 여부', type:'bars', question:'핵심 가설이 실험실 또는 파일럿 단계에서 검증되었는지, 재현 가능한 데이터를 보유하고 있습니까?', scale:[{score:1,desc:'PoC 미착수. 가설 단계에 머물러 있음.'},{score:2,desc:'초기 실험 진행 중. 재현 가능성 미검증.'},{score:3,desc:'실험실 PoC 완료. 재현 가능 데이터 보유.'},{score:4,desc:'파일럿 규모 검증 완료. 외부 기관 확인 완료.'},{score:5,desc:'대규모 파일럿 성공. 상용화 데이터 완비.'}], ai_trigger:{threshold:2,warning:'poc_incomplete'} },
        { id:'dt_1_4', label:'규제 승인 진행 상태', type:'bars', question:'바이오의 경우 임상시험 단계, 우주·에너지의 경우 안전 인증 등 규제 기관 승인 진척도를 관리하고 있습니까?', scale:[{score:1,desc:'규제 승인 절차 인지 없음. 대응 계획 전무.'},{score:2,desc:'규제 요건 파악 중. 승인 절차 미착수.'},{score:3,desc:'규제 기관과 사전 협의 완료. 승인 신청 준비 중.'},{score:4,desc:'승인 절차 진행 중. 주요 단계 통과.'},{score:5,desc:'핵심 규제 승인 완료. 상용화 법적 장벽 제거.'}], ai_trigger:{threshold:2,warning:'regulatory_approval_delayed'} },
      ]
    },
    {
      id: 'dt_research',
      label: 'R&D 역량 및 마일스톤',
      icon: '🧪',
      items: [
        { id:'dt_2_1', label:'연구 인력 구성 및 수준', type:'bars', question:'박사급·석사급 연구원 비중 및 핵심 연구 책임자(PI)의 업계 평판과 논문·특허 실적을 갖추고 있습니까?', scale:[{score:1,desc:'전문 연구 인력 없음. 대표 1인 기술 의존.'},{score:2,desc:'석사급 연구원 일부. PI 미확보.'},{score:3,desc:'박사급 PI 확보. 연구팀 기초 구성.'},{score:4,desc:'우수 PI + 연구팀 완성. 논문·특허 실적 보유.'},{score:5,desc:'글로벌 수준 PI + 연구팀. 업계 최고 수준 실적.'}], ai_trigger:{threshold:2,warning:'research_talent_weak'} },
        { id:'dt_2_2', label:'마일스톤 달성률', type:'bars', question:'투자 유치 시 약속한 기술·사업 마일스톤의 달성 진척률과 지연 사유 관리가 체계적으로 이루어지고 있습니까?', scale:[{score:1,desc:'마일스톤 설정 없음. 투자자 보고 체계 없음.'},{score:2,desc:'마일스톤 존재하나 달성률 50% 미만. 지연 관리 없음.'},{score:3,desc:'마일스톤 달성률 70%. 지연 시 원인 분석.'},{score:4,desc:'달성률 85% 이상. 지연 예측 + 선제 대응.'},{score:5,desc:'달성률 95% 이상. 투자자 신뢰 최고 수준 유지.'}], ai_trigger:{threshold:2,warning:'milestone_delayed'} },
        { id:'dt_2_3', label:'R&D 파이프라인 관리', type:'bars', question:'단일 기술·제품에 올인하고 있는지, 복수의 파이프라인으로 리스크를 분산하고 있는지 진단합니다.', scale:[{score:1,desc:'단일 기술 100% 의존. 실패 시 사업 종료.'},{score:2,desc:'주력 기술 외 대안 검토 중. 파이프라인 미구축.'},{score:3,desc:'2개 파이프라인 병행. 기초 리스크 분산.'},{score:4,desc:'3개 이상 파이프라인 + 단계별 우선순위 관리.'},{score:5,desc:'포트폴리오 파이프라인 완성. 단계별 상용화 로드맵 가동.'}], ai_trigger:{threshold:2,warning:'pipeline_single'} },
        { id:'dt_2_4', label:'외부 연구 협력 네트워크', type:'bars', question:'대학·국책연구소·글로벌 기업과의 공동연구·기술이전 협력 현황을 갖추고 있습니까?', scale:[{score:1,desc:'외부 협력 없음. 완전 독자 연구.'},{score:2,desc:'대학 1~2곳과 비공식 협력.'},{score:3,desc:'산학 협력 MOU 체결. 공동 연구 진행 중.'},{score:4,desc:'국책연구소 + 글로벌 기업 협력 네트워크 구축.'},{score:5,desc:'글로벌 연구 생태계 허브 포지셔닝. 기술이전 수익 발생.'}], ai_trigger:{threshold:2,warning:'research_network_isolated'} },
      ]
    },
    {
      id: 'dt_funding',
      label: '자금 조달 및 번레이트',
      icon: '💰',
      items: [
        { id:'dt_3_1', label:'누적 투자 유치액 및 단계', type:'bars', question:'시드·시리즈A/B/C 등 현재 투자 라운드와 누적 유치 금액이 기술 단계에 적합한 수준입니까?', scale:[{score:1,desc:'외부 투자 없음. 자체 자금만으로 운영.'},{score:2,desc:'시드 투자 유치. 후속 투자 계획 불명확.'},{score:3,desc:'시리즈A 완료. 기술 단계와 투자 규모 적합.'},{score:4,desc:'시리즈B 이상. 글로벌 투자자 참여.'},{score:5,desc:'대형 투자 유치 완료. 상용화 자금 완비.'}], ai_trigger:{threshold:2,warning:'funding_insufficient'} },
        { id:'dt_3_2', label:'월간 번레이트(Burn Rate)', type:'bars', question:'월간 현금 소진 속도와 현재 보유 자금으로 생존 가능한 기간(Runway)을 정밀하게 파악하고 있습니까?', scale:[{score:1,desc:'번레이트 개념 없음. 잔금 확인만.'},{score:2,desc:'월간 지출 대략 파악. Runway 미계산.'},{score:3,desc:'번레이트 월 단위 계산. Runway 12개월 이상.'},{score:4,desc:'번레이트 최적화 중. Runway 18개월 이상 유지.'},{score:5,desc:'번레이트 정밀 관리. Runway 24개월 이상. 자동 경보 체계.'}], ai_trigger:{threshold:2,warning:'runway_short'} },
        { id:'dt_3_3', label:'정부 R&D 과제 수주', type:'bars', question:'국가연구개발과제·TIPS·기술개발 바우처 등 비희석성 자금 확보 현황을 갖추고 있습니까?', scale:[{score:1,desc:'정부 과제 미신청. 비희석성 자금 없음.'},{score:2,desc:'소규모 정부 과제 1~2건 수행 중.'},{score:3,desc:'TIPS 등 주요 정부 과제 수주. 연간 목표 관리.'},{score:4,desc:'대형 국책 과제 수주. 비희석성 자금 번레이트 50% 이상 커버.'},{score:5,desc:'정부 과제 포트폴리오 완성. 투자 희석 최소화 달성.'}], ai_trigger:{threshold:2,warning:'government_rd_underutilized'} },
        { id:'dt_3_4', label:'후속 투자 유치 계획', type:'bars', question:'다음 라운드 투자 유치를 위한 준비 상태와 잠재 투자자 파이프라인을 보유하고 있습니까?', scale:[{score:1,desc:'후속 투자 계획 없음. 현 자금 소진 후 대책 없음.'},{score:2,desc:'후속 투자 필요성 인지. 준비 미착수.'},{score:3,desc:'IR 자료 준비 중. 잠재 투자자 리스트 보유.'},{score:4,desc:'투자자 미팅 진행 중. 주요 VC 관심 확보.'},{score:5,desc:'후속 투자 계약 체결 완료 또는 임박. 자금 연속성 확보.'}], ai_trigger:{threshold:2,warning:'next_round_unprepared'} },
      ]
    },
    {
      id: 'dt_commercialization',
      label: '사업화 전략 및 시장 진입',
      icon: '🚀',
      items: [
        { id:'dt_4_1', label:'TAM·SAM·SOM 시장 규모', type:'bars', question:'기술 상용화 시 목표 시장의 규모와 현실적 점유 가능 범위를 데이터 기반으로 산출하고 있습니까?', scale:[{score:1,desc:'시장 규모 분석 없음. 막연한 대형 시장 언급.'},{score:2,desc:'TAM만 제시. SAM·SOM 산출 없음.'},{score:3,desc:'TAM·SAM·SOM 기초 산출. 근거 데이터 보유.'},{score:4,desc:'정밀 TAM·SAM·SOM 분석. 투자자 검증 완료.'},{score:5,desc:'동적 시장 규모 모델링. 실시간 시장 변화 반영.'}], ai_trigger:{threshold:2,warning:'market_size_unvalidated'} },
        { id:'dt_4_2', label:'기술-시장 적합성(Tech-Market Fit)', type:'bars', question:'개발 중인 기술이 실제 시장 수요와 일치하는지에 대한 검증 수준을 갖추고 있습니까?', scale:[{score:1,desc:'시장 수요 검증 없음. 기술 중심 개발.'},{score:2,desc:'고객 인터뷰 일부 진행. 수요 확인 미완.'},{score:3,desc:'목표 고객 수요 검증 완료. PMF 탐색 중.'},{score:4,desc:'Tech-Market Fit 확인. 초기 고객 피드백 반영.'},{score:5,desc:'강력한 Tech-Market Fit 입증. 고객 자발적 확산 시작.'}], ai_trigger:{threshold:2,warning:'tech_market_fit_unconfirmed'} },
        { id:'dt_4_3', label:'초기 고객·파트너 확보', type:'bars', question:'기술 완성 전이라도 LOI(구매의향서)·파일럿 계약 등 초기 시장 반응 확보 여부를 갖추고 있습니까?', scale:[{score:1,desc:'잠재 고객 접촉 없음. 기술 개발만 집중.'},{score:2,desc:'잠재 고객 미팅 진행. LOI 미확보.'},{score:3,desc:'LOI 1~3건 확보. 파일럿 협의 중.'},{score:4,desc:'파일럿 계약 체결. 레퍼런스 고객 확보.'},{score:5,desc:'파일럿 성공 사례 다수. 대형 고객 정식 계약 진행 중.'}], ai_trigger:{threshold:2,warning:'early_customer_missing'} },
        { id:'dt_4_4', label:'Exit 전략 명확성', type:'bars', question:'IPO·M&A·기술 라이선싱 등 투자자에게 제시하는 출구 전략의 구체성을 확보하고 있습니까?', scale:[{score:1,desc:'Exit 전략 없음. 투자자 설득 불가.'},{score:2,desc:'Exit 방향성만 언급. 구체성 없음.'},{score:3,desc:'IPO 또는 M&A 목표 설정. 기초 로드맵 보유.'},{score:4,desc:'Exit 전략 구체화. 잠재 인수자 리스트 보유.'},{score:5,desc:'Exit 전략 완전 설계. 투자자·인수자 관계 구축 완료.'}], ai_trigger:{threshold:2,warning:'exit_strategy_vague'} },
      ]
    },
  ],
  ai_analysis: [
    { trigger:'trl_too_low+runway_short', level:'CRITICAL', msg:'기술 성숙도가 낮은데 번레이트가 높다면 자금 소진 전 PoC 실패 위험이 큽니다. R&D 집중 영역 우선순위 재설정과 정부 과제 비희석성 자금 확보를 최우선 처방합니다.' },
    { trigger:'milestone_delayed+next_round_unprepared', level:'CRITICAL', msg:'마일스톤 달성이 지연되는데 후속 투자 계획이 불명확하다면 자금 경색이 임박한 상태입니다. 투자자 커뮤니케이션 강화와 Bridge 라운드 긴급 준비를 처방합니다.' },
    { trigger:'ip_portfolio_weak+early_customer_missing', level:'HIGH', msg:'특허는 다수 보유하나 LOI나 파일럿 계약이 전무하다면 기술은 있으나 시장성 검증이 안 된 상태입니다. 기술 시연 이벤트 및 산업 파트너십 우선 확보 전략을 제안합니다.' },
  ],
};

if (typeof window !== 'undefined') window.BM_DEEPTECH = BM_DEEPTECH;
if (typeof module !== 'undefined') module.exports = BM_DEEPTECH;
