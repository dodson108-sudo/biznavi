const INDUSTRY_FOOD_MFG = {
  id: 'food_mfg',
  label: '식품 제조 및 가공업',
  icon: '🍱',
  description: '반찬 제조업, 소규모 밀키트 공장, 제과·제빵 소형 공장. 위생 관리(HACCP)와 유통기한 준수가 생명.',
  areas: [
    {
      id: 'food_safety',
      label: '생산 위생 및 품질 안전',
      icon: '🛡️',
      items: [
        { id:'fm_1_1', label:'HACCP 운용 실효성', type:'bars', question:'단순 인증 보유를 넘어 CCP(중요관리점) 모니터링 데이터의 실시간 기록 및 한계치 이탈 시 즉각 조치 매뉴얼이 있습니까?', scale:[{score:1,desc:'HACCP 인증 없음. 위생 관리 임의 운영.'},{score:2,desc:'HACCP 인증 보유. 수기 기록 위주. 실효성 낮음.'},{score:3,desc:'CCP 모니터링 데이터 기록. 한계치 이탈 시 조치 체계.'},{score:4,desc:'디지털 HACCP 시스템 운영. 실시간 이탈 경보.'},{score:5,desc:'스마트 HACCP 자동 기록 시스템. 이탈 즉각 차단 + 원인 추적.'}], ai_trigger:{threshold:2,warning:'haccp_ineffective'} },
        { id:'fm_1_2', label:'클레임·회수(Recall) 관리', type:'bars', question:'이물질·변질 등 고객 클레임 발생률과 사고 발생 시 이력 추적(Traceability) 소요 시간을 관리하고 있습니까?', scale:[{score:1,desc:'클레임 기록 없음. 사고 발생 시 수습 불가.'},{score:2,desc:'클레임 접수 대장 보유. 추적 체계 없음.'},{score:3,desc:'클레임 원인 분석 체계. Traceability 1일 이내.'},{score:4,desc:'Traceability 4시간 이내. 자동 회수 프로세스 가동.'},{score:5,desc:'실시간 Traceability. 회수 범위 자동 산출 + 당국 보고 체계.'}], ai_trigger:{threshold:2,warning:'recall_system_weak'} },
        { id:'fm_1_3', label:'작업장 환경 제어', type:'bars', question:'온도·습도 자동 제어 시스템 및 작업자 위생 교육(보건증 관리 등)의 체계성을 갖추고 있습니까?', scale:[{score:1,desc:'온습도 수동 확인. 위생 교육 없음.'},{score:2,desc:'온습도 계측기 보유. 자동 제어 없음.'},{score:3,desc:'온습도 자동 제어. 위생 교육 분기 실시.'},{score:4,desc:'환경 데이터 실시간 기록. 위생 교육 이수율 100%.'},{score:5,desc:'IoT 환경 센서 + AI 이상 탐지. 위생 무결점 체계.'}], ai_trigger:{threshold:2,warning:'environment_control_weak'} },
        { id:'fm_1_4', label:'유통기한·보존성 테스트', type:'bars', question:'자가품질검사 주기 준수 및 신제품 출시 전 법적 보존 기간 설정 근거를 보유하고 있습니까?', scale:[{score:1,desc:'자가품질검사 미실시. 유통기한 임의 설정.'},{score:2,desc:'자가품질검사 실시하나 주기 불규칙.'},{score:3,desc:'법정 주기 준수. 신제품 보존성 시험 완료.'},{score:4,desc:'자가검사 + 외부 공인기관 검사 병행.'},{score:5,desc:'실시간 품질 모니터링 + 유통기한 최적화 데이터 보유.'}], ai_trigger:{threshold:2,warning:'shelf_life_unvalidated'} },
      ]
    },
    {
      id: 'food_material',
      label: '원재료 수율 및 재고 최적화',
      icon: '📦',
      items: [
        { id:'fm_2_1', label:'투입 대비 산출(Yield) 관리', type:'bars', question:'원재료 투입량 대비 최종 양품 생산량의 비중 및 폐기 로스(Loss) 발생 구간 추적을 하고 있습니까?', scale:[{score:1,desc:'수율 개념 없음. 원재료 낭비 파악 불가.'},{score:2,desc:'전체 수율 대략 파악. 구간별 분석 없음.'},{score:3,desc:'공정별 수율 월 단위 집계. 로스 구간 파악.'},{score:4,desc:'수율 실시간 모니터링. 로스 구간 즉각 개선.'},{score:5,desc:'AI 기반 수율 최적화. 원재료 투입량 자동 조정.'}], ai_trigger:{threshold:2,warning:'yield_untracked'} },
        { id:'fm_2_2', label:'선입선출(FIFO) 디지털화', type:'bars', question:'원료 입고일 기준 자동 알림 체계 및 유통기한 임박 자재의 우선 소진 로직을 보유하고 있습니까?', scale:[{score:1,desc:'FIFO 개념 없음. 임의 출고.'},{score:2,desc:'수기 FIFO 운영. 누락 빈번.'},{score:3,desc:'FIFO 체크리스트 운영. 담당자 수동 관리.'},{score:4,desc:'WMS 기반 FIFO 자동 알림. 유통기한 임박 경보.'},{score:5,desc:'FIFO 완전 자동화. 유통기한 임박 자재 자동 우선 출고.'}], ai_trigger:{threshold:2,warning:'fifo_not_digital'} },
        { id:'fm_2_3', label:'콜드체인(Cold Chain) 관리', type:'bars', question:'냉장·냉동 창고의 상시 온도 이력 데이터와 이동 중 온도 이탈 리스크 관리가 이루어지고 있습니까?', scale:[{score:1,desc:'온도 이력 기록 없음. 냉장 관리 임의.'},{score:2,desc:'온도 수기 기록. 이탈 감지 없음.'},{score:3,desc:'온도 자동 기록. 이탈 시 수동 대응.'},{score:4,desc:'실시간 온도 모니터링. 이탈 즉각 경보 + 대응.'},{score:5,desc:'콜드체인 완전 디지털화. 이동 중 온도 실시간 추적.'}], ai_trigger:{threshold:2,warning:'cold_chain_unmanaged'} },
        { id:'fm_2_4', label:'포장재·소모품 재고 관리', type:'bars', question:'제품 종류(SKU) 증가에 따른 포장지 재고 과다 현상 및 최소 주문 수량(MOQ) 관리 적정성을 확인하고 있습니까?', scale:[{score:1,desc:'포장재 재고 파악 없음. 과부족 빈번.'},{score:2,desc:'포장재 재고 수기 관리. MOQ 미고려.'},{score:3,desc:'SKU별 포장재 재고 관리. MOQ 기준 발주.'},{score:4,desc:'포장재 재고 자동 알림. 적정 재고 수준 유지.'},{score:5,desc:'포장재 자동 발주 시스템. SKU별 최적 MOQ 관리.'}], ai_trigger:{threshold:2,warning:'packaging_inventory_poor'} },
      ]
    },
    {
      id: 'food_hr',
      label: '인적 자원 및 공정 효율',
      icon: '👨‍🍳',
      items: [
        { id:'fm_3_1', label:'인당 생산성(UPH)', type:'bars', question:'시간당 생산 수량 및 포장·검수 공정의 병목(Bottleneck) 현상 유무를 데이터로 파악하고 있습니까?', scale:[{score:1,desc:'UPH 측정 없음. 생산성 파악 불가.'},{score:2,desc:'일 생산량만 집계. 공정별 분석 없음.'},{score:3,desc:'공정별 UPH 집계. 병목 구간 파악.'},{score:4,desc:'UPH 실시간 모니터링. 병목 즉각 개선.'},{score:5,desc:'AI 기반 생산 스케줄 최적화. UPH 자동 극대화.'}], ai_trigger:{threshold:2,warning:'productivity_untracked'} },
        { id:'fm_3_2', label:'숙련도·레시피 표준화', type:'bars', question:'특정 소스 배합이나 정밀 가공 시 레시피 표준화 정도(누가 만들어도 같은 맛이 나는가?)를 갖추고 있습니까?', scale:[{score:1,desc:'레시피 없음. 숙련공 감에 100% 의존.'},{score:2,desc:'텍스트 레시피 보유. 수치 미표준화.'},{score:3,desc:'계량 기준 레시피 보유. 신규 인력 재현 가능.'},{score:4,desc:'동영상 레시피 + QR 부착. 재현율 95% 이상.'},{score:5,desc:'디지털 레시피 + IoT 계량 자동화. 품질 편차 제로.'}], ai_trigger:{threshold:2,warning:'recipe_not_standardized'} },
        { id:'fm_3_3', label:'외국인 인력·위생 의존도', type:'bars', question:'위생 수칙 미준수로 인한 대형 사고 가능성 및 작업자 교육 수준을 관리하고 있습니까?', scale:[{score:1,desc:'외국인 위생 교육 없음. 사고 위험 높음.'},{score:2,desc:'기본 위생 교육만 실시. 다국어 자료 없음.'},{score:3,desc:'다국어 위생 교육 자료 보유. 이수율 관리.'},{score:4,desc:'위생 교육 이수율 100%. 수시 점검 체계.'},{score:5,desc:'위생 교육 자동화 + 이해도 테스트 + 미이수자 즉각 경보.'}], ai_trigger:{threshold:2,warning:'hygiene_education_weak'} },
        { id:'fm_3_4', label:'자동화·설비 투자', type:'bars', question:'소량 충진기·포장기 등 단순 반복 공정의 반자동화 도입 수준 및 생산 확대 가능성을 갖추고 있습니까?', scale:[{score:1,desc:'수작업 100%. 자동화 설비 없음.'},{score:2,desc:'일부 반자동화. 핵심 공정은 수작업.'},{score:3,desc:'주요 공정 반자동화. 생산량 30% 확대 가능.'},{score:4,desc:'핵심 공정 자동화. 인력 절감 + 생산량 2배.'},{score:5,desc:'전공정 자동화. 소품종 대량·다품종 소량 유연 생산.'}], ai_trigger:{threshold:2,warning:'automation_insufficient'} },
      ]
    },
    {
      id: 'food_brand',
      label: '브랜드 가치 및 유통 판로',
      icon: '🏪',
      items: [
        { id:'fm_4_1', label:'판로 다각화 및 수수료율', type:'bars', question:'자사몰·오픈마켓·대형마트·급식 등 채널별 매출 비중과 실제 플랫폼 수수료 제외 순마진율을 관리하고 있습니까?', scale:[{score:1,desc:'단일 채널 100% 의존. 수수료 관리 없음.'},{score:2,desc:'2~3개 채널 운영. 순마진 미산출.'},{score:3,desc:'채널별 매출 비중 관리. 순마진 분기 산출.'},{score:4,desc:'채널별 순마진 실시간 관리. 저수익 채널 즉각 조정.'},{score:5,desc:'채널 포트폴리오 최적화. 자사몰 비중 30% 이상 유지.'}], ai_trigger:{threshold:2,warning:'channel_margin_unmanaged'} },
        { id:'fm_4_2', label:'OEM·자사 브랜드 비중', type:'bars', question:'단순 하청 제조(OEM) 위주인지, 자사 브랜드(PB/NB)를 통한 팬덤 확보가 되고 있는지 진단합니까?', scale:[{score:1,desc:'OEM 100%. 자사 브랜드 전무.'},{score:2,desc:'OEM 위주. 자사 브랜드 10% 미만.'},{score:3,desc:'자사 브랜드 30% 이상. 온라인 판매 시작.'},{score:4,desc:'자사 브랜드 50% 이상. 팬덤 고객 확보.'},{score:5,desc:'자사 브랜드 70% 이상. OEM 의존 탈피 완성.'}], ai_trigger:{threshold:2,warning:'oem_dependency_high'} },
        { id:'fm_4_3', label:'마케팅 ROAS·콘텐츠 역량', type:'bars', question:'상세 페이지 품질·SNS 마케팅 집행 효율 및 리뷰 관리(CS) 체계성을 갖추고 있습니까?', scale:[{score:1,desc:'마케팅 없음. ROAS 개념 모름.'},{score:2,desc:'광고 집행하나 ROAS 미측정.'},{score:3,desc:'채널별 ROAS 관리. 상세페이지 정기 업데이트.'},{score:4,desc:'ROAS 최적화 + 리뷰 관리 체계 운영.'},{score:5,desc:'AI 기반 콘텐츠 자동화. ROAS 업계 최고 수준.'}], ai_trigger:{threshold:2,warning:'marketing_roas_blind'} },
        { id:'fm_4_4', label:'신제품 개발(R&D) 주기', type:'bars', question:'트렌드 변화에 따른 신제품 기획부터 런칭까지의 속도 및 성공률을 관리하고 있습니까?', scale:[{score:1,desc:'신제품 개발 체계 없음. 즉흥적 출시.'},{score:2,desc:'연 1회 미만 신제품 출시. 트렌드 미반영.'},{score:3,desc:'분기 1회 신제품 기획. 트렌드 반영.'},{score:4,desc:'월 단위 신제품 파이프라인. 출시 성공률 70% 이상.'},{score:5,desc:'데이터 기반 신제품 기획. 트렌드 선도적 출시.'}], ai_trigger:{threshold:2,warning:'new_product_slow'} },
      ]
    },
  ],
  ai_analysis: [
    { trigger:'haccp_ineffective+oem_dependency_high', level:'CRITICAL', msg:'위생 점수가 낮은데 자사 브랜드 비중이 높다면 한 번의 사고로 브랜드가 도산할 수 있는 초고위험 상태입니다.' },
    { trigger:'yield_untracked+channel_margin_unmanaged', level:'CRITICAL', msg:'원재료 수율이 낮고 플랫폼 수수료율이 높다면 매출 증가가 오히려 적자로 이어지는 구조입니다. 공정 자동화와 자사몰 전환을 강력 추천합니다.' },
    { trigger:'haccp_ineffective+cold_chain_unmanaged', level:'HIGH', msg:'수기 기록 위주의 HACCP 운영은 데이터 신뢰도가 낮습니다. 스마트 HACCP 도입을 정부 지원 사업과 매치하십시오.' },
  ],
};

if (typeof window !== 'undefined') window.INDUSTRY_FOOD_MFG = INDUSTRY_FOOD_MFG;
if (typeof module !== 'undefined') module.exports = INDUSTRY_FOOD_MFG;
