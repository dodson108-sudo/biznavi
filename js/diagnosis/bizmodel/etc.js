const BM_ETC = {
  id: 'etc',
  label: '기타 (초기·미확정 모델)',
  icon: '🌱',
  description: '수익 모델이 아직 명확하지 않거나 기존 유형에 정확히 맞지 않는 초기 단계 비즈니스.',
  keyMetrics: ['BM 명확성', 'BEP 계획', '차별화 요소', '자금 Runway'],
  areas: [
    {
      id: 'etc_model',
      label: '비즈니스 모델 명확성',
      icon: '🎯',
      items: [
        { id:'et_1_1', label:'수익 모델 명확성', type:'bars', question:'검증된 수익 창출 경로의 확보 상태를 갖추고 있습니까?', scale:[{score:1,desc:'수익 모델 없음. 아이디어 단계.'},{score:2,desc:'수익 모델 가설 존재. 검증 없음.'},{score:3,desc:'수익 모델 검증 중. 소규모 매출 발생.'},{score:4,desc:'수익 모델 검증 완료. 안정적 매출 성장 중.'},{score:5,desc:'수익 모델 확립. 확장 가능한 구조 완성.'}], ai_trigger:{threshold:2,warning:'revenue_model_unclear'} },
        { id:'et_1_2', label:'핵심 가치 제안', type:'bars', question:'경쟁사와 구별되는 독보적 가치 제공 여부를 갖추고 있습니까?', scale:[{score:1,desc:'가치 제안 불명확. 경쟁사와 동일.'},{score:2,desc:'가치 제안 존재. 차별화 미약.'},{score:3,desc:'명확한 가치 제안. 타겟 고객 공감 확인.'},{score:4,desc:'독보적 가치 제안. 대체 불가 포지셔닝.'},{score:5,desc:'카테고리 정의 수준의 혁신적 가치 제안.'}], ai_trigger:{threshold:2,warning:'value_proposition_weak'} },
        { id:'et_1_3', label:'타겟 고객 명확성', type:'bars', question:'페르소나를 포함한 구체적인 타겟 시장 정의를 갖추고 있습니까?', scale:[{score:1,desc:'타겟 고객 없음. 모두를 위한 서비스.'},{score:2,desc:'타겟 대략 정의. 페르소나 없음.'},{score:3,desc:'타겟 세그먼트 + 기본 페르소나 완성.'},{score:4,desc:'정밀 페르소나 + 구매 여정 맵 완성.'},{score:5,desc:'타겟 완전 정의. 고객이 스스로 찾아오는 구조.'}], ai_trigger:{threshold:2,warning:'target_customer_undefined'} },
        { id:'et_1_4', label:'핵심 KPI 관리', type:'bars', question:'데이터에 기반한 성과 지표 관리 및 추적을 갖추고 있습니까?', scale:[{score:1,desc:'KPI 없음. 방향성 상실 상태.'},{score:2,desc:'KPI 설정했으나 추적 없음.'},{score:3,desc:'주요 KPI 월 단위 추적. 개선 반영.'},{score:4,desc:'KPI 실시간 대시보드. 주간 리뷰 체계.'},{score:5,desc:'KPI 자동화 완성. 데이터 기반 의사결정 완전 정착.'}], ai_trigger:{threshold:2,warning:'kpi_not_tracked'} },
      ]
    },
    {
      id: 'etc_market',
      label: '시장 진입 및 경쟁력',
      icon: '🏹',
      items: [
        { id:'et_2_1', label:'차별화 요소', type:'bars', question:'시장 내 독보적 우위를 점할 수 있는 요소를 갖추고 있습니까?', scale:[{score:1,desc:'차별화 없음. 경쟁사 모방 즉시 가능.'},{score:2,desc:'일부 차별화. 지속 가능성 낮음.'},{score:3,desc:'명확한 차별화 1~2개. 경쟁사 모방 어려움.'},{score:4,desc:'독보적 차별화. 진입 장벽 형성.'},{score:5,desc:'카테고리 창조 수준. 경쟁 자체가 무의미.'}], ai_trigger:{threshold:2,warning:'differentiation_factor_weak'} },
        { id:'et_2_2', label:'진입 장벽·모방 방지', type:'bars', question:'특허나 브랜드 등을 통한 보호 장치 유무를 갖추고 있습니까?', scale:[{score:1,desc:'보호 장치 없음. 모방에 완전 취약.'},{score:2,desc:'기본 보호 검토 중. 미실행.'},{score:3,desc:'특허 출원 중 또는 브랜드 등록 완료.'},{score:4,desc:'특허 등록 + 브랜드 자산 구축.'},{score:5,desc:'다층 진입 장벽 완성. 모방 사실상 불가.'}], ai_trigger:{threshold:2,warning:'entry_barrier_missing'} },
        { id:'et_2_3', label:'시장 성장성 확인', type:'bars', question:'객관적 데이터에 근거한 시장 확장성 인지를 갖추고 있습니까?', scale:[{score:1,desc:'시장 분석 없음. 감으로 시장성 주장.'},{score:2,desc:'시장 규모 대략 파악. 성장률 데이터 없음.'},{score:3,desc:'TAM·SAM·SOM 기초 산출. 성장률 데이터 보유.'},{score:4,desc:'정밀 시장 분석. 투자자 검증 완료.'},{score:5,desc:'시장 성장 선도 포지셔닝. 동적 시장 모델링.'}], ai_trigger:{threshold:2,warning:'market_growth_unvalidated'} },
        { id:'et_2_4', label:'파트너십 구축', type:'bars', question:'비즈니스 확장을 위한 전략적 파트너 확보 수준을 갖추고 있습니까?', scale:[{score:1,desc:'파트너십 없음. 완전 독자 운영.'},{score:2,desc:'파트너십 검토 중. 미확보.'},{score:3,desc:'핵심 파트너 1~2개 확보. 협력 진행 중.'},{score:4,desc:'전략적 파트너십 다수. 시너지 창출.'},{score:5,desc:'파트너 생태계 완성. 파트너가 성장 엔진화.'}], ai_trigger:{threshold:2,warning:'partnership_not_established'} },
      ]
    },
    {
      id: 'etc_ops',
      label: '운영 역량 및 자원',
      icon: '⚙️',
      items: [
        { id:'et_3_1', label:'핵심 인력 보유', type:'bars', question:'사업 수행에 필수적인 기술 인력의 안정성을 갖추고 있습니까?', scale:[{score:1,desc:'핵심 인력 없음. 대표 1인 전담.'},{score:2,desc:'핵심 인력 일부. 역량 부족.'},{score:3,desc:'핵심 직무 인력 완비. 안정적 팀 구성.'},{score:4,desc:'우수 인력 팀 완성. 이탈 방지 체계.'},{score:5,desc:'업계 최고 인재 보유. 팀이 곧 경쟁력.'}], ai_trigger:{threshold:2,warning:'key_talent_missing'} },
        { id:'et_3_2', label:'운영 자금 충분성', type:'bars', question:'6개월 이상의 생존 및 재투자가 가능한 여유 자금을 갖추고 있습니까?', scale:[{score:1,desc:'자금 없음. 즉각 생존 위협.'},{score:2,desc:'3개월 미만 Runway. 자금 조달 시급.'},{score:3,desc:'6개월 이상 Runway. 기본 안정.'},{score:4,desc:'12개월 이상 Runway. 여유 있는 성장.'},{score:5,desc:'24개월 이상 Runway. 공격적 투자 가능.'}], ai_trigger:{threshold:2,warning:'runway_critical'} },
        { id:'et_3_3', label:'운영 시스템 자동화', type:'bars', question:'디지털 기반의 효율적인 관리 체계를 갖추고 있습니까?', scale:[{score:1,desc:'수동 운영 100%. 시스템 전무.'},{score:2,desc:'엑셀·메신저 위주. 자동화 없음.'},{score:3,desc:'주요 업무 디지털화. 기본 자동화 적용.'},{score:4,desc:'핵심 프로세스 자동화. 운영 효율 2배.'},{score:5,desc:'전사 자동화 완성. AI 기반 운영 체계.'}], ai_trigger:{threshold:2,warning:'operations_not_automated'} },
        { id:'et_3_4', label:'실행 역량 분산', type:'bars', question:'대표자 1인 외 팀 단위의 실행력 확보를 갖추고 있습니까?', scale:[{score:1,desc:'대표 1인 전담. 팀 실행력 없음.'},{score:2,desc:'대표 의존도 80% 이상. 위임 불가.'},{score:3,desc:'핵심 업무 위임 시작. 팀 실행력 형성.'},{score:4,desc:'대표 부재 시에도 1주일 자율 운영 가능.'},{score:5,desc:'완전 분산 실행력. 대표 부재 1개월 이상 자율 가동.'}], ai_trigger:{threshold:2,warning:'execution_concentrated'} },
      ]
    },
    {
      id: 'etc_sustainability',
      label: '수익성 및 지속 가능성',
      icon: '💰',
      items: [
        { id:'et_4_1', label:'현재 매출 안정성', type:'bars', question:'일정 수준 이상의 지속적 매출 발생 여부를 갖추고 있습니까?', scale:[{score:1,desc:'매출 없음. 지출만 발생.'},{score:2,desc:'간헐적 매출. 불규칙.'},{score:3,desc:'월 단위 안정적 매출 발생.'},{score:4,desc:'매출 꾸준히 성장 중. MoM 10% 이상.'},{score:5,desc:'매출 안정화 완성. 예측 가능한 성장 궤도.'}], ai_trigger:{threshold:2,warning:'revenue_unstable'} },
        { id:'et_4_2', label:'BEP 달성 계획', type:'bars', question:'명확한 손익분기 도달 로드맵 보유 여부를 갖추고 있습니까?', scale:[{score:1,desc:'BEP 계획 없음. 적자 지속.'},{score:2,desc:'BEP 시점 대략 파악. 계획 없음.'},{score:3,desc:'BEP 로드맵 수립. 월 단위 추적.'},{score:4,desc:'BEP 달성 임박. 6개월 내 목표.'},{score:5,desc:'BEP 달성 완료. 흑자 전환 후 성장 가속화.'}], ai_trigger:{threshold:2,warning:'bep_plan_missing'} },
        { id:'et_4_3', label:'비즈니스 확장성', type:'bars', question:'모델 자체의 확장 및 스케일업 가능성을 갖추고 있습니까?', scale:[{score:1,desc:'확장성 없음. 대표 시간에 종속된 사업.'},{score:2,desc:'제한적 확장. 인력 증가 비례 성장만 가능.'},{score:3,desc:'일부 확장성. 시스템화 진행 중.'},{score:4,desc:'높은 확장성. 추가 비용 없이 매출 증대 가능.'},{score:5,desc:'완전 확장성. 플랫폼·SaaS급 스케일업 가능.'}], ai_trigger:{threshold:2,warning:'scalability_limited'} },
        { id:'et_4_4', label:'외부 자원 활용', type:'bars', question:'정부지원금 및 투자 유치 역량 보유를 갖추고 있습니까?', scale:[{score:1,desc:'외부 자원 활용 없음. 자력 운영만.'},{score:2,desc:'정부지원금 인지. 신청 경험 없음.'},{score:3,desc:'정부지원금 정기 신청. 일부 수혜.'},{score:4,desc:'정부지원금 + 엔젤 투자 유치 완료.'},{score:5,desc:'투자 포트폴리오 완성. 시리즈 A 이상 준비 완료.'}], ai_trigger:{threshold:2,warning:'external_funding_not_utilized'} },
      ]
    },
  ],
  ai_analysis: [
    { trigger:'revenue_model_unclear+kpi_not_tracked', level:'CRITICAL', msg:'수익 모델이 불명확하고 KPI가 없으면 방향성 상실 상태입니다. BM 재정의를 우선 처방합니다.' },
    { trigger:'runway_critical+bep_plan_missing', level:'CRITICAL', msg:'자금 부족 상황에서 BEP를 모르면 생존 기간 계산 불가 상태입니다. 즉각 재무 진단을 처방합니다.' },
    { trigger:'differentiation_factor_weak+entry_barrier_missing', level:'HIGH', msg:'차별화와 방어 기제가 없으면 모방에 취약합니다. IP 및 브랜드 구축을 처방합니다.' },
  ],
};
if (typeof window !== 'undefined') window.BM_ETC = BM_ETC;
if (typeof module !== 'undefined') module.exports = BM_ETC;
