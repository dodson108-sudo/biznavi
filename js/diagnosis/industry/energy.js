const INDUSTRY_ENERGY = {
  id: 'energy',
  label: '환경·에너지업',
  icon: '⚡',
  description: '태양광·풍력 설치·관리, 폐기물 처리·재활용, 탄소 크레딧 컨설팅, 에너지 효율화 서비스. 정부 정책·보조금 의존도가 높고 기술력과 인허가 관리가 사업 성패를 결정함.',
  areas: [
    {
      id: 'eng_tech',
      label: '설비 성능 및 기술 역량',
      icon: '🔋',
      items: [
        { id:'eng_1_1', label:'설비 발전·처리 효율', type:'bars', question:'태양광의 경우 모듈별 발전 효율(kWh/kWp) 및 설비 이용률, 폐기물의 경우 톤당 처리 비용과 재활용 전환율을 정량적으로 관리하고 있습니까?', scale:[{score:1,desc:'설비 효율 데이터 없음. 발전량·처리량만 대략 파악.'},{score:2,desc:'전체 발전량·처리량 집계. 설비별 효율 분석 없음.'},{score:3,desc:'설비별 효율 월 단위 집계. 업계 평균과 비교.'},{score:4,desc:'실시간 효율 모니터링. 저효율 설비 즉각 점검 체계.'},{score:5,desc:'IoT 센서 기반 실시간 효율 최적화. AI 예측 유지보수 가동.'}], ai_trigger:{threshold:2,warning:'facility_efficiency_low'} },
        { id:'eng_1_2', label:'설비 수명 및 유지보수', type:'bars', question:'설비의 예상 수명 대비 현재 노후도, 예방정비 주기 및 돌발 고장 빈도와 수리 비용을 체계적으로 추적하고 있습니까?', scale:[{score:1,desc:'고장 발생 후 수리. 예방정비 체계 없음.'},{score:2,desc:'정기 점검 일정 존재. 수리 비용 미집계.'},{score:3,desc:'설비별 예방정비 주기 문서화. 고장 이력 관리.'},{score:4,desc:'MTBF·MTTR 측정. 예방정비 자동 알림 체계.'},{score:5,desc:'IoT 예지보전. 고장 예측 + 부품 자동 발주 + 수리 비용 최소화.'}], ai_trigger:{threshold:2,warning:'maintenance_reactive'} },
        { id:'eng_1_3', label:'기술 특허·인증 보유', type:'bars', question:'환경 관련 특허, 기술 인증(ISO 14001, 환경표지 등)의 보유 및 갱신 관리 상태가 체계적으로 운영되고 있습니까?', scale:[{score:1,desc:'특허·인증 없음. 기술 보호 장치 전무.'},{score:2,desc:'기본 인증 보유하나 갱신 관리 체계 없음.'},{score:3,desc:'주요 인증 유효 관리. 갱신 일정 체계화.'},{score:4,desc:'특허 포트폴리오 보유. 인증 자동 갱신 알림 운영.'},{score:5,desc:'특허 다수 보유. 기술 라이선싱 수익 창출. 인증 완전 관리.'}], ai_trigger:{threshold:2,warning:'ip_certification_weak'} },
        { id:'eng_1_4', label:'R&D 투자 및 기술 경쟁력', type:'bars', question:'매출 대비 R&D 투자 비중 및 차세대 기술(수소 에너지, 청정기술 등) 준비 수준을 갖추고 있습니까?', scale:[{score:1,desc:'R&D 투자 없음. 현재 기술에만 의존.'},{score:2,desc:'R&D 계획은 있으나 예산 미확보.'},{score:3,desc:'매출 대비 R&D 3% 이상 투자. 기술 로드맵 보유.'},{score:4,desc:'차세대 기술 파일럿 프로젝트 진행 중.'},{score:5,desc:'차세대 기술 상용화 준비 완료. 기술 주도 시장 선점.'}], ai_trigger:{threshold:2,warning:'rd_investment_low'} },
      ]
    },
    {
      id: 'eng_reg',
      label: '규제 대응 및 인허가 관리',
      icon: '📋',
      items: [
        { id:'eng_2_1', label:'환경영향평가 이행 상태', type:'bars', question:'사업 승인 전 환경영향평가 협의 완료 여부 및 협의 조건의 지속적 이행 모니터링 체계가 구축되어 있습니까?', scale:[{score:1,desc:'환경영향평가 이행 모니터링 없음.'},{score:2,desc:'협의 완료했으나 이행 조건 관리 미비.'},{score:3,desc:'이행 조건 체크리스트 보유. 분기 점검 실시.'},{score:4,desc:'이행 조건 실시간 모니터링. 위반 즉각 경보.'},{score:5,desc:'디지털 환경 이행 관리 시스템 구축. 무결점 이행 달성.'}], ai_trigger:{threshold:2,warning:'environmental_compliance_weak'} },
        { id:'eng_2_2', label:'탄소 배출권 및 배출량 관리', type:'bars', question:'탄소 저감량(tCO2e) 실적 측정과 제3자 검증 여부, 탄소배출권 거래 수익 현황을 관리하고 있습니까?', scale:[{score:1,desc:'탄소 배출량 측정 없음. 배출권 개념 모름.'},{score:2,desc:'배출량 대략 파악. 제3자 검증 없음.'},{score:3,desc:'배출량 정기 측정 + 제3자 검증 완료.'},{score:4,desc:'배출권 거래 참여. 탄소 크레딧 수익 창출.'},{score:5,desc:'탄소 배출 실시간 모니터링. 배출권 최적 거래 자동화.'}], ai_trigger:{threshold:2,warning:'carbon_credit_unmanaged'} },
        { id:'eng_2_3', label:'폐기물 처리 허가 및 관리', type:'bars', question:'폐기물 처리업 허가 유지 조건 준수 여부 및 환경부 점검 이력·제재 이력 관리가 체계적으로 이루어지고 있습니까?', scale:[{score:1,desc:'허가 조건 관리 없음. 제재 이력 방치.'},{score:2,desc:'허가는 보유하나 조건 준수 모니터링 미비.'},{score:3,desc:'허가 조건 체크리스트 운영. 점검 이력 관리.'},{score:4,desc:'허가 조건 실시간 준수 확인. 선제적 대응 체계.'},{score:5,desc:'허가 무결점 관리. 환경부 우수 사업장 인정.'}], ai_trigger:{threshold:2,warning:'permit_management_weak'} },
        { id:'eng_2_4', label:'REC·RPS 제도 활용', type:'bars', question:'신재생에너지 공급인증서(REC) 발급 실적 및 전력 판매 계약(PPA) 체결 수준을 최적화하고 있습니까?', scale:[{score:1,desc:'REC·RPS 제도 인지 없음. 미활용.'},{score:2,desc:'REC 발급은 하나 최적화 없음.'},{score:3,desc:'REC 정기 발급 + RPS 의무 이행 완료.'},{score:4,desc:'REC 거래 최적화 + PPA 장기 계약 체결.'},{score:5,desc:'REC·PPA 포트폴리오 최적화. 안정적 고정 수익 확보.'}], ai_trigger:{threshold:2,warning:'rec_rps_underutilized'} },
      ]
    },
    {
      id: 'eng_finance',
      label: '재무 건전성 및 사업 안정성',
      icon: '💰',
      items: [
        { id:'eng_3_1', label:'정부 보조금 의존도', type:'bars', question:'총 매출 대비 정부 보조금·인센티브 비중 및 정책 변동(FIT 단가 인하 등) 시 수익성 영향 시뮬레이션을 실시하고 있습니까?', scale:[{score:1,desc:'보조금 의존도 파악 없음. 정책 변동 시 무방비.'},{score:2,desc:'보조금 비중 파악. 대응 시나리오 없음.'},{score:3,desc:'보조금 의존도 50% 이하 관리. 기본 시나리오 보유.'},{score:4,desc:'정책 변동 시뮬레이션 정기 실시. 대안 수익원 개발 중.'},{score:5,desc:'보조금 의존도 30% 이하. 민간 매출 중심 구조 전환 완료.'}], ai_trigger:{threshold:2,warning:'subsidy_dependency_high'} },
        { id:'eng_3_2', label:'투자 회수 기간(Payback Period)', type:'bars', question:'초기 설비 투자비 대비 누적 순수익으로 투자 회수까지의 예상 기간 및 실제 진행률을 파악하고 있습니까?', scale:[{score:1,desc:'투자 회수 기간 계산 없음. 재무 계획 부재.'},{score:2,desc:'대략적인 회수 기간 파악. 실제 진행률 미추적.'},{score:3,desc:'Payback Period 정밀 계산. 분기 진행률 모니터링.'},{score:4,desc:'실제 vs 계획 Payback 비교 분석. 편차 원인 관리.'},{score:5,desc:'Payback 실시간 추적 대시보드. 목표 조기 달성 전략 가동.'}], ai_trigger:{threshold:2,warning:'payback_untracked'} },
        { id:'eng_3_3', label:'장기 계약 및 고정 매출', type:'bars', question:'전력 구매 계약(PPA), 폐기물 처리 장기 계약 등 고정 매출 비중과 계약 잔여 기간을 관리하고 있습니까?', scale:[{score:1,desc:'장기 계약 없음. 매출 변동성 극심.'},{score:2,desc:'단기 계약 위주. 장기 계약 확보 노력 중.'},{score:3,desc:'고정 매출 비중 50% 이상. 주요 계약 잔여 기간 관리.'},{score:4,desc:'고정 매출 비중 70% 이상. 계약 만료 전 자동 갱신 알림.'},{score:5,desc:'고정 매출 80% 이상. 장기 파트너십 기반 안정적 현금흐름.'}], ai_trigger:{threshold:2,warning:'fixed_revenue_low'} },
        { id:'eng_3_4', label:'부채 구조 및 자금 조달', type:'bars', question:'프로젝트 파이낸싱(PF) 활용 여부 및 차입금 상환 일정의 현금흐름 적합성을 관리하고 있습니까?', scale:[{score:1,desc:'자금 조달 계획 없음. 부채 구조 불투명.'},{score:2,desc:'단순 은행 대출 위주. PF 개념 미활용.'},{score:3,desc:'PF 구조 이해. 현금흐름 대비 상환 일정 관리.'},{score:4,desc:'PF 최적 구조 설계. 상환 시뮬레이션 정기 실시.'},{score:5,desc:'PF + 정책금융 + 투자 유치 복합 구조. 재무 리스크 최소화.'}], ai_trigger:{threshold:2,warning:'debt_structure_risk'} },
      ]
    },
    {
      id: 'eng_market',
      label: '시장 확장 및 ESG 브랜딩',
      icon: '🌱',
      items: [
        { id:'eng_4_1', label:'ESG 인증 및 브랜딩 파워', type:'bars', question:'ISO 14001, 탄소중립 인증, 친환경 혁신기업 지정 등 대외 신뢰도 자산 확보 수준을 갖추고 있습니까?', scale:[{score:1,desc:'ESG 인증 없음. 브랜딩 자산 전무.'},{score:2,desc:'기본 인증 1~2개 보유. 브랜딩 활용 미흡.'},{score:3,desc:'주요 ESG 인증 보유. 마케팅 자료에 활용.'},{score:4,desc:'다수 ESG 인증 + 친환경 혁신기업 지정. 수주 활용 중.'},{score:5,desc:'ESG 인증 포트폴리오 완비. 브랜드 신뢰도 업계 최고 수준.'}], ai_trigger:{threshold:2,warning:'esg_brand_weak'} },
        { id:'eng_4_2', label:'공공 조달 및 B2G 수주', type:'bars', question:'지자체·공공기관 입찰 실적 및 공공 부문 매출 비중 대비 민간 시장 확장 전략을 보유하고 있습니까?', scale:[{score:1,desc:'공공 조달 참여 경험 없음. 입찰 역량 전무.'},{score:2,desc:'나라장터 등록. 소규모 입찰 참여 수준.'},{score:3,desc:'공공 조달 정기 수주. 레퍼런스 확보 중.'},{score:4,desc:'공공 매출 40% 이상. 민간 시장 동시 확장.'},{score:5,desc:'공공·민간 균형 포트폴리오. 대형 프로젝트 수주 역량.'}], ai_trigger:{threshold:2,warning:'b2g_capability_low'} },
        { id:'eng_4_3', label:'기업 고객 RE100 대응', type:'bars', question:'RE100 참여 기업에게 재생에너지 전력을 공급하는 B2B 계약 확보 역량을 보유하고 있습니까?', scale:[{score:1,desc:'RE100 개념 인지 없음. B2B 공급 역량 전무.'},{score:2,desc:'RE100 이해하나 계약 사례 없음.'},{score:3,desc:'RE100 기업 대상 제안 활동 중. 계약 협의 단계.'},{score:4,desc:'RE100 공급 계약 체결. B2B 레퍼런스 확보.'},{score:5,desc:'RE100 주요 공급자 포지셔닝. 대기업 장기 계약 다수 보유.'}], ai_trigger:{threshold:2,warning:'re100_supply_weak'} },
        { id:'eng_4_4', label:'해외 수출 및 글로벌 파트너십', type:'bars', question:'해외 현지 프로젝트 수주 실적 및 글로벌 파트너사와의 기술 제휴 현황을 갖추고 있습니까?', scale:[{score:1,desc:'해외 진출 계획 없음. 국내 시장에만 집중.'},{score:2,desc:'해외 진출 검토 중. 파트너십 협의 단계.'},{score:3,desc:'해외 파일럿 프로젝트 진행. 현지 파트너 확보.'},{score:4,desc:'해외 수주 실적 보유. 글로벌 파트너십 운영 중.'},{score:5,desc:'다국가 진출 완료. 글로벌 기술 제휴 네트워크 구축.'}], ai_trigger:{threshold:2,warning:'global_expansion_low'} },
      ]
    },
  ],
  ai_analysis: [
    { trigger:'subsidy_dependency_high+fixed_revenue_low', level:'CRITICAL', msg:'정부 보조금 비중이 50% 이상인데 PPA 계약이 없다면 정책 변동 시 순간적으로 수익성이 붕괴됩니다. 장기 PPA 확보와 민간 B2B 매출 비중 확대를 최우선 처방합니다.' },
    { trigger:'facility_efficiency_low+maintenance_reactive', level:'HIGH', msg:'발전 효율이 하락하는데 예방정비가 미흡하다면 설비 노후화에 의한 수익 손실이 가속화됩니다. IoT 기반 예방정비 시스템 도입과 설비 교체 로드맵 수립을 처방합니다.' },
    { trigger:'esg_brand_weak+b2g_capability_low', level:'HIGH', msg:'ESG 인증은 보유하고 있으나 공공 조달 실적이 없다면 인증을 영업 자산으로 활용하지 못하는 것입니다. 나라장터 입찰 대비 전략과 지자체 협력 사업 참여를 제안합니다.' },
  ],
};

if (typeof window !== 'undefined') window.INDUSTRY_ENERGY = INDUSTRY_ENERGY;
if (typeof module !== 'undefined') module.exports = INDUSTRY_ENERGY;
