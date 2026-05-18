const INDUSTRY_MFG_PARTS = {
  id: 'mfg_parts',
  label: '뿌리 제조 및 부품가공업',
  icon: '⚙️',
  description: '금형·주조·용접·선반 가공·플라스틱 사출 등. 대기업이나 1차 협력사의 하청 구조가 많음.',
  areas: [
    {
      id: 'mfg_cost',
      label: '원가 분석 및 수익 엔지니어링',
      icon: '💰',
      items: [
        { id:'mp_1_1', label:'가공 공임 구조 및 마진율', type:'bars', question:'시간당 표준 공임의 유무를 넘어 임가공 대비 마진율과 고정비 반영률을 확인하고 있습니까? (툴 교체 주기 대비 공구비 반영, 5개년 평균 전기료 상승분 반영 여부)', scale:[{score:1,desc:'공임 기준 없음. 감으로 견적 산출.'},{score:2,desc:'표준 공임은 있으나 마진율·고정비 미반영.'},{score:3,desc:'공임+마진율 관리. 공구비 일부 반영.'},{score:4,desc:'고정비·변동비 완전 반영 공임 체계. 분기 업데이트.'},{score:5,desc:'전기료 상승분·툴 교체 주기까지 반영한 정밀 공임 시뮬레이터 운영.'}], ai_trigger:{threshold:2,warning:'machining_rate_unclear'} },
        { id:'mp_1_2', label:'부산물(Scrap) 회수 전략', type:'bars', question:'소재 가격 대비 스크랩 판매 대금의 비율과 관리 투명성을 확보하고 있습니까?', scale:[{score:1,desc:'스크랩 별도 관리 없음. 무분별 처리.'},{score:2,desc:'스크랩 수거는 하나 단가·수량 미기록.'},{score:3,desc:'스크랩 월 단위 수량·금액 집계.'},{score:4,desc:'소재별 스크랩 단가 비교·최적 판매처 관리.'},{score:5,desc:'스크랩 수익이 원가 구조에 반영됨. 실시간 추적 체계.'}], ai_trigger:{threshold:2,warning:'scrap_unmanaged'} },
        { id:'mp_1_3', label:'원가 변동 대응력', type:'bars', question:'원자재가 10% 상승 시 납품가 조정까지 걸리는 시차(Time-lag) 및 조정 성공률을 관리하고 있습니까?', scale:[{score:1,desc:'원가 변동 시 대응 방법 없음. 손실 수용.'},{score:2,desc:'원가 급등 인지 후 수개월 후 납품가 협의 시도.'},{score:3,desc:'분기 단위 원가 점검 + 납품가 재협의 체계.'},{score:4,desc:'원자재 지수 연동 납품가 조정 조항 계약 보유.'},{score:5,desc:'원자재 상승 즉시 조정 체계. 평균 Time-lag 2주 이내.'}], ai_trigger:{threshold:2,warning:'cost_adjustment_delayed'} },
        { id:'mp_1_4', label:'불량 손실비(COPQ) 추적', type:'bars', question:'재작업에 들어가는 인건비와 물류비를 별도로 추적하는 관리 체계가 있습니까?', scale:[{score:1,desc:'불량 비용 추적 없음. 전체 손실 인지 불가.'},{score:2,desc:'불량률만 집계. 비용 환산 없음.'},{score:3,desc:'불량 건당 재작업 인건비 추산.'},{score:4,desc:'COPQ(인건비+물류비+기회비용) 월 단위 산출.'},{score:5,desc:'COPQ 실시간 대시보드. 공정별 드릴다운 분석.'}], ai_trigger:{threshold:2,warning:'copq_untracked'} },
      ]
    },
    {
      id: 'mfg_ops',
      label: '현장 운영 및 설비 지능화',
      icon: '🏭',
      items: [
        { id:'mp_2_1', label:'비가동 리스크 분석(MTBF·MTTR)', type:'bars', question:'돌발 정지 횟수뿐 아니라 MTBF(평균 고장 간격)와 MTTR(평균 수리 시간) 개념을 도입하여 관리하고 있습니까?', scale:[{score:1,desc:'고장 발생 후 수리. 예방 개념 없음.'},{score:2,desc:'정기 점검 일정 존재. MTBF·MTTR 미측정.'},{score:3,desc:'설비별 고장 이력 관리. MTBF 분기 집계.'},{score:4,desc:'MTBF·MTTR 실시간 모니터링. 예방정비 자동 알림.'},{score:5,desc:'IoT 예지보전. 고장 예측 + 부품 자동 발주 체계.'}], ai_trigger:{threshold:2,warning:'maintenance_reactive'} },
        { id:'mp_2_2', label:'셋업 고도화(SMED)', type:'bars', question:'제품 교체 시 세팅 시간의 표준화 여부 및 단일 금형 교체(SMED) 기법 적용 수준을 갖추고 있습니까?', scale:[{score:1,desc:'셋업 시간 측정 없음. 숙련공 감에 의존.'},{score:2,desc:'셋업 시간 기록. 표준화 없음.'},{score:3,desc:'셋업 표준 작업서 보유. 목표 시간 설정.'},{score:4,desc:'SMED 기법 적용. 셋업 시간 30% 이상 단축.'},{score:5,desc:'단일 자리수 셋업(SMED 완성). 내·외부 작업 완전 분리.'}], ai_trigger:{threshold:2,warning:'setup_time_high'} },
        { id:'mp_2_3', label:'치공구(Jig) 데이터화', type:'bars', question:'지그의 위치 정보 및 사용 횟수에 따른 교체 주기 자동 알림 체계를 보유하고 있습니까?', scale:[{score:1,desc:'지그 관리 없음. 분실·오사용 빈번.'},{score:2,desc:'지그 목록 보유. 위치·사용 횟수 미기록.'},{score:3,desc:'지그별 사용 이력 수기 관리.'},{score:4,desc:'지그 위치 데이터화. 교체 주기 알림 체계.'},{score:5,desc:'지그 IoT 태그. 사용 횟수 자동 집계 + 교체 자동 발주.'}], ai_trigger:{threshold:2,warning:'jig_unmanaged'} },
        { id:'mp_2_4', label:'외주 관리 정교함', type:'bars', question:'외주처의 가공 품질 데이터 피드백 루프 및 외주 단가의 객관적 산출 근거를 보유하고 있습니까?', scale:[{score:1,desc:'외주 품질 관리 없음. 불량 발생 후 수습.'},{score:2,desc:'외주 불량률 집계. 단가 근거 없음.'},{score:3,desc:'외주처별 품질 성적서 요구. 단가 비교 분석.'},{score:4,desc:'외주 품질 피드백 루프 가동. 단가 산출 기준 문서화.'},{score:5,desc:'외주처 등급제 운영. 품질+납기+단가 종합 평가 자동화.'}], ai_trigger:{threshold:2,warning:'outsourcing_uncontrolled'} },
      ]
    },
    {
      id: 'mfg_hr',
      label: '인적 자원 및 지식 자산화',
      icon: '👷',
      items: [
        { id:'mp_3_1', label:'숙련도 매트릭스(Skill Map)', type:'bars', question:'현장 인력별 Skill Map 보유 여부 및 대표자 유고 시 공장 가동 유지 가능 기간(일 단위)을 파악하고 있습니까?', scale:[{score:1,desc:'Skill Map 없음. 인력 역량 파악 불가.'},{score:2,desc:'경험적으로 누가 무엇을 하는지 알지만 문서화 없음.'},{score:3,desc:'주요 직무별 담당자·백업 지정.'},{score:4,desc:'전 직원 Skill Map 구축. 부재 시 대체 가능 기간 파악.'},{score:5,desc:'Skill Map 기반 Cross-training. 대표 유고 30일 이상 자율 가동.'}], ai_trigger:{threshold:2,warning:'skill_map_missing'} },
        { id:'mp_3_2', label:'외국인 인력 질적 관리', type:'bars', question:'단순 인원수 비중이 아닌 한국어 숙련도 및 다기능화 교육 이수율로 외국인 인력을 관리하고 있습니까?', scale:[{score:1,desc:'외국인 인력 관리 기준 없음.'},{score:2,desc:'기본 안전 교육만 실시. 다기능화 없음.'},{score:3,desc:'다국어 SOP 보유. 다기능화 교육 일부 실시.'},{score:4,desc:'한국어 숙련도 평가 + 다기능화 이수율 관리.'},{score:5,desc:'외국인 핵심 숙련공 육성 체계. 이직률 업계 최저 유지.'}], ai_trigger:{threshold:2,warning:'foreign_worker_quality'} },
        { id:'mp_3_3', label:'암묵지 디지털 레시피화', type:'bars', question:'숙련공의 손맛(암묵지)을 압력·온도·속도 값으로 기록하여 디지털 레시피화 했습니까?', scale:[{score:1,desc:'모든 노하우가 숙련공 머릿속에만 존재.'},{score:2,desc:'텍스트 매뉴얼 일부. 수치 데이터 없음.'},{score:3,desc:'주요 공정 표준값(온도·압력 등) 텍스트 기록.'},{score:4,desc:'동영상 SOP + 수치 데이터 결합. 재현 성공률 80% 이상.'},{score:5,desc:'IoT 센서 + AI 분석으로 암묵지 실시간 자동 데이터화.'}], ai_trigger:{threshold:2,warning:'tacit_knowledge_lost'} },
        { id:'mp_3_4', label:'안전·규제 대응력', type:'bars', question:'중대재해처벌법 대비 안전보건관리체계 이행 점검 리스트가 실질적으로 운영되고 있습니까?', scale:[{score:1,desc:'안전 관리 형식적. 실질 이행 없음.'},{score:2,desc:'법정 최소 교육만 실시. 체계 미비.'},{score:3,desc:'안전보건관리체계 구축. 분기 점검 실시.'},{score:4,desc:'일일 안전 점검 디지털 기록. 위반 즉각 경보.'},{score:5,desc:'중대재해법 완전 준수. 사고율 0% 달성 체계.'}], ai_trigger:{threshold:2,warning:'safety_compliance_weak'} },
      ]
    },
    {
      id: 'mfg_market',
      label: '시장 점유 및 고객 관계망',
      icon: '🤝',
      items: [
        { id:'mp_4_1', label:'매출 포트폴리오 탄력성', type:'bars', question:'주거래처 이탈 시 공장 가동률을 50% 이상 유지할 수 있는 대체 고객사 후보군 수를 파악하고 있습니까?', scale:[{score:1,desc:'단일 거래처 100% 의존. 이탈 시 공장 가동 불가.'},{score:2,desc:'상위 3사 매출 80% 이상. 대체 후보 없음.'},{score:3,desc:'대체 고객사 2~3곳 파이프라인 보유.'},{score:4,desc:'상위 고객사 의존도 50% 이하. 대체 후보 5곳 이상.'},{score:5,desc:'고객 포트폴리오 완전 분산. 단일 이탈 영향 20% 이하.'}], ai_trigger:{threshold:2,warning:'customer_concentration'} },
        { id:'mp_4_2', label:'수주 채널 다각화', type:'bars', question:'네트워크(소개) 의존도를 낮추기 위한 온라인 B2B 플랫폼 활용 및 영업 제안서 보유 수준을 갖추고 있습니까?', scale:[{score:1,desc:'소개 100% 의존. 능동적 영업 없음.'},{score:2,desc:'소개 위주. 온라인 채널 미활용.'},{score:3,desc:'B2B 플랫폼 등록. 기본 제안서 보유.'},{score:4,desc:'온라인 채널 20% 이상 수주. 전문 제안서 운영.'},{score:5,desc:'다채널 수주. 온라인 리드 자동화 파이프라인 가동.'}], ai_trigger:{threshold:2,warning:'sales_channel_single'} },
        { id:'mp_4_3', label:'샘플링·R&D 대응력', type:'bars', question:'고객사 시제품 요청 시 원가 산출→설계→가공까지의 리드타임이 표준화되어 있습니까?', scale:[{score:1,desc:'시제품 대응 체계 없음. 견적 산출에 수주 소요.'},{score:2,desc:'시제품 대응 가능하나 리드타임 불명확.'},{score:3,desc:'시제품 리드타임 표준화. 평균 소요 시간 파악.'},{score:4,desc:'원가 산출~가공 완료 리드타임 업계 평균 이하.'},{score:5,desc:'시제품 전담팀 + 빠른 리드타임으로 신규 고객 유인.'}], ai_trigger:{threshold:2,warning:'sample_response_slow'} },
        { id:'mp_4_4', label:'가치 사슬 내 위치', type:'bars', question:'단순 임가공(Tier 2~3)인지 모듈 조립 및 설계 참여(Tier 1)인지에 따른 부가가치 창출력을 진단합니까?', scale:[{score:1,desc:'Tier 3 이하. 단순 임가공 100%.'},{score:2,desc:'Tier 2 수준. 일부 공정 통합.'},{score:3,desc:'Tier 1~2 혼합. 모듈 조립 일부 수행.'},{score:4,desc:'Tier 1 비중 확대. 설계 참여 시작.'},{score:5,desc:'Tier 1 주력. 설계·모듈화로 고부가가치 창출.'}], ai_trigger:{threshold:2,warning:'value_chain_position_low'} },
      ]
    },
  ],
  ai_analysis: [
    { trigger:'customer_concentration+sales_channel_single', level:'CRITICAL', msg:'원가 협상력이 낮고 수주 채널이 소개 위주라면 현재 을의 위치에서 고사할 위기입니다. 온라인 B2B 채널 개척과 고객 다변화를 최우선 처방합니다.' },
    { trigger:'tacit_knowledge_lost+maintenance_reactive', level:'HIGH', msg:'암묵지 DX화가 안 된 상태에서 설비 효율 개선은 의미가 없습니다. 기술 전수 데이터화부터 시작하십시오.' },
    { trigger:'scrap_unmanaged+copq_untracked', level:'HIGH', msg:'스크랩 관리가 안 되고 불량 손실비 추적이 없다면 매출 증대보다 내부 비용 누수 차단이 우선입니다.' },
  ],
};

if (typeof window !== 'undefined') window.INDUSTRY_MFG_PARTS = INDUSTRY_MFG_PARTS;
if (typeof module !== 'undefined') module.exports = INDUSTRY_MFG_PARTS;
