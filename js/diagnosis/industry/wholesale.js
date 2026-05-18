const INDUSTRY_WHOLESALE = {
  id: 'wholesale',
  label: '전문 유통 및 도소매업',
  icon: '🏬',
  description: '건축자재 유통·의류 도매·생활용품 온라인 셀러. 낮은 마진율 구조이며 재고 확보를 위한 현금 흐름 압박이 큼.',
  areas: [
    {
      id: 'ws_sourcing',
      label: '매입 경쟁력 및 상품 포트폴리오',
      icon: '🛒',
      items: [
        { id:'ws_1_1', label:'공급선 다변화 및 직거래 비중', type:'bars', question:'총판·대리점을 거치지 않는 제조사 직거래 비중 및 단독 공급권(Exclusive) 보유 여부를 갖추고 있습니까?', scale:[{score:1,desc:'100% 총판·대리점 의존. 직거래 없음.'},{score:2,desc:'직거래 10% 미만. 다변화 시도 중.'},{score:3,desc:'직거래 30% 이상. 주요 공급처 다변화.'},{score:4,desc:'직거래 50% 이상. Exclusive 1개 이상 보유.'},{score:5,desc:'직거래 70% 이상. Exclusive 다수 + 대체 공급처 완비.'}], ai_trigger:{threshold:2,warning:'supplier_concentration'} },
        { id:'ws_1_2', label:'매입 단가 협상력', type:'bars', question:'결제 조건(선입금·현금 등)에 따른 추가 할인(Cash Discount) 및 물량 할인의 전략적 활용 수준을 갖추고 있습니까?', scale:[{score:1,desc:'협상 없음. 제시 단가 그대로 수용.'},{score:2,desc:'소극적 협상. Cash Discount 활용 없음.'},{score:3,desc:'정기 협상으로 3~5% 추가 할인 확보.'},{score:4,desc:'결제 조건·물량 복합 협상. 10% 이상 할인.'},{score:5,desc:'전략적 선입금 + 물량 약정으로 최저 단가 확보.'}], ai_trigger:{threshold:2,warning:'buying_power_weak'} },
        { id:'ws_1_3', label:'상품 Mix 전략', type:'bars', question:'미끼 상품(Low Margin·High Traffic)과 수익 상품(High Margin)의 매출 비중 및 전략적 배치 상태를 관리합니까?', scale:[{score:1,desc:'상품 Mix 개념 없음. 모든 상품 동일 취급.'},{score:2,desc:'잘 팔리는 상품 파악. 마진 기준 분류 없음.'},{score:3,desc:'미끼·수익 상품 분류. 기본 전략 적용.'},{score:4,desc:'ABC 분석 기반 상품 Mix 최적화. 분기 조정.'},{score:5,desc:'실시간 상품 수익성 대시보드. AI 기반 Mix 자동 최적화.'}], ai_trigger:{threshold:2,warning:'product_mix_unmanaged'} },
        { id:'ws_1_4', label:'시장 가격 모니터링', type:'bars', question:'경쟁 채널의 실시간 가격 변동에 따른 자사 판매가 자동·수동 대응 체계를 보유하고 있습니까?', scale:[{score:1,desc:'경쟁 가격 모니터링 없음. 가격 변동 무방비.'},{score:2,desc:'간헐적 수동 모니터링. 대응 지연.'},{score:3,desc:'주간 단위 가격 모니터링. 수동 조정.'},{score:4,desc:'자동 가격 모니터링 툴 활용. 즉각 대응.'},{score:5,desc:'AI 기반 동적 가격 최적화. 경쟁사 대비 항상 최적가 유지.'}], ai_trigger:{threshold:2,warning:'price_monitoring_weak'} },
      ]
    },
    {
      id: 'ws_logistics',
      label: '물류 운영 및 재고 최적화',
      icon: '📦',
      items: [
        { id:'ws_2_1', label:'재고 회전율 및 악성 재고 관리', type:'bars', question:'전체 재고가 연간 몇 번 회전하는지, 카테고리별 악성 재고(90일 이상 미판매) 비중과 처리 매뉴얼을 보유하고 있습니까?', scale:[{score:1,desc:'재고 회전율 개념 없음. 악성 재고 방치.'},{score:2,desc:'전체 재고 회전율만 집계. 카테고리 분석 없음.'},{score:3,desc:'카테고리별 회전율 관리. 악성 재고 분기 점검.'},{score:4,desc:'악성 재고 자동 감지. 즉각 처리 프로세스 가동.'},{score:5,desc:'재고 회전율 실시간 최적화. 악성 재고 0% 목표 달성.'}], ai_trigger:{threshold:2,warning:'dead_stock_unmanaged'} },
        { id:'ws_2_2', label:'주문 이행(Fulfillment) 속도', type:'bars', question:'주문 접수 후 출고까지의 평균 소요 시간 및 오배송·파손 발생률 데이터를 관리하고 있습니까?', scale:[{score:1,desc:'이행 속도 측정 없음. 오배송 사후 수습.'},{score:2,desc:'평균 출고 시간 파악. 오배송률 미집계.'},{score:3,desc:'출고 속도 목표 설정. 오배송률 월 집계.'},{score:4,desc:'당일 출고 90% 이상. 오배송률 1% 이하.'},{score:5,desc:'자동화 피킹·패킹. 오배송 0% 달성 체계.'}], ai_trigger:{threshold:2,warning:'fulfillment_slow'} },
        { id:'ws_2_3', label:'창고 공간·인건비 효율', type:'bars', question:'평당 적재 적정성 및 피킹·패킹 동선 최적화를 통한 인당 출고량 데이터를 관리하고 있습니까?', scale:[{score:1,desc:'창고 효율 파악 없음. 공간 낭비 심각.'},{score:2,desc:'적재율 대략 파악. 동선 최적화 없음.'},{score:3,desc:'피킹 동선 기본 설계. 인당 출고량 집계.'},{score:4,desc:'동선 최적화 완료. 인당 출고량 목표 관리.'},{score:5,desc:'WMS 기반 자동 동선 최적화. 인당 출고량 업계 최고.'}], ai_trigger:{threshold:2,warning:'warehouse_efficiency_low'} },
        { id:'ws_2_4', label:'반품·교환(Reverse Logistics) 제어', type:'bars', question:'단순 변심 및 불량 반품의 재검수 후 재판매(리퍼) 혹은 폐기 결정 프로세스의 속도를 관리합니까?', scale:[{score:1,desc:'역물류 프로세스 없음. 반품 처리 혼란.'},{score:2,desc:'반품 수거는 하나 재검수 기준 없음.'},{score:3,desc:'반품 사유별 처리 기준 보유. 재판매 가능 상품 분류.'},{score:4,desc:'반품 재검수 24시간 내 완료. 리퍼 판매 체계.'},{score:5,desc:'역물류 자동화. 반품~재판매 최단 사이클 달성.'}], ai_trigger:{threshold:2,warning:'reverse_logistics_weak'} },
      ]
    },
    {
      id: 'ws_channel',
      label: '채널 파워 및 마케팅 효율',
      icon: '📢',
      items: [
        { id:'ws_3_1', label:'입점 채널 의존도 리스크', type:'bars', question:'특정 플랫폼 매출 비중이 70% 이상인지 여부 및 자사몰·오프라인 채널 비중을 관리하고 있습니까?', scale:[{score:1,desc:'단일 플랫폼 100% 의존. 정책 변경 시 무방비.'},{score:2,desc:'2~3개 채널 운영. 주력 채널 70% 이상.'},{score:3,desc:'채널 다변화 진행 중. 주력 채널 50% 이하.'},{score:4,desc:'6개 이상 채널 균형 운영. 자사몰 20% 이상.'},{score:5,desc:'채널 완전 분산. 자사몰 30% 이상 + D2C 전략 완성.'}], ai_trigger:{threshold:2,warning:'channel_dependency_high'} },
        { id:'ws_3_2', label:'플랫폼 실질 수익률(Contribution Margin)', type:'bars', question:'광고비·수수료·배송비를 제외한 채널별 순이익 데이터를 분석·관리하고 있습니까?', scale:[{score:1,desc:'채널별 순이익 파악 없음. 매출만 집계.'},{score:2,desc:'수수료만 파악. 광고비·배송비 미포함.'},{score:3,desc:'채널별 Contribution Margin 분기 산출.'},{score:4,desc:'채널별 CM 실시간 모니터링. 적자 채널 즉각 조정.'},{score:5,desc:'CM 자동 대시보드. 채널별 예산 AI 자동 최적화.'}], ai_trigger:{threshold:2,warning:'channel_margin_blind'} },
        { id:'ws_3_3', label:'고객 충성도·CRM', type:'bars', question:'재구매 고객 비율 및 구매 데이터를 활용한 타겟 마케팅의 실행 빈도를 관리하고 있습니까?', scale:[{score:1,desc:'CRM 없음. 재구매 고객 식별 불가.'},{score:2,desc:'재구매율 대략 파악. 타겟 마케팅 없음.'},{score:3,desc:'CRM 기반 재구매율 집계. 기본 타겟팅 실행.'},{score:4,desc:'세그먼트별 자동화 마케팅. 재구매율 목표 관리.'},{score:5,desc:'AI CRM. 개인화 추천 + 자동 재구매 유도 완성.'}], ai_trigger:{threshold:2,warning:'crm_loyalty_weak'} },
        { id:'ws_3_4', label:'B2B 거래처 미수금 관리', type:'bars', question:'도매업의 경우 거래처별 여신 한도 설정 및 장기 미수금 회수 프로세스의 가동 상태를 확인합니까?', scale:[{score:1,desc:'여신 한도 없음. 미수금 방치.'},{score:2,desc:'주요 거래처 여신 구두 합의. 기록 없음.'},{score:3,desc:'거래처별 여신 한도 문서화. 미수금 월 집계.'},{score:4,desc:'여신 초과 자동 경보. 미수금 회수 프로세스 가동.'},{score:5,desc:'거래처 신용등급 관리. 미수금 자동 청구·추심 체계.'}], ai_trigger:{threshold:2,warning:'receivables_unmanaged'} },
      ]
    },
    {
      id: 'ws_dx',
      label: '디지털 전환 및 현금 흐름',
      icon: '💹',
      items: [
        { id:'ws_4_1', label:'재고-판매 통합 시스템(ERP·WMS)', type:'bars', question:'판매 채널별 재고가 실시간으로 연동되는지, 수기·엑셀 사후 관리 수준에서 탈피했습니까?', scale:[{score:1,desc:'수기·엑셀 100%. 재고 실시간 파악 불가.'},{score:2,desc:'채널별 개별 재고 관리. 통합 없음.'},{score:3,desc:'주요 채널 ERP 연동. 일 단위 동기화.'},{score:4,desc:'전 채널 실시간 재고 연동. 품절 자동 경보.'},{score:5,desc:'ERP·WMS 완전 통합. AI 기반 자동 발주 체계.'}], ai_trigger:{threshold:2,warning:'erp_wms_not_integrated'} },
        { id:'ws_4_2', label:'현금 전환 사이클(CCC)', type:'bars', question:'매입 대금 지급일부터 매출 채권 회수일까지 돈이 묶여 있는 기간의 적정성을 진단하고 있습니까?', scale:[{score:1,desc:'CCC 개념 없음. 현금 공백 인지 불가.'},{score:2,desc:'대략적인 CCC 파악. 최적화 없음.'},{score:3,desc:'CCC 분기 산출. 단축 목표 설정.'},{score:4,desc:'CCC 월 단위 관리. 매입 조건 협상 연동.'},{score:5,desc:'CCC 실시간 모니터링. 자금 조달 선제 실행 체계.'}], ai_trigger:{threshold:2,warning:'ccc_not_managed'} },
        { id:'ws_4_3', label:'데이터 기반 소싱(MD) 역량', type:'bars', question:'키워드 검색량·트렌드 분석 도구를 활용한 신상품 발굴 및 발주량 예측 수준을 갖추고 있습니까?', scale:[{score:1,desc:'감과 경험으로만 소싱. 데이터 없음.'},{score:2,desc:'베스트셀러 참고. 트렌드 분석 없음.'},{score:3,desc:'키워드 검색량 기반 소싱. 분기 트렌드 분석.'},{score:4,desc:'트렌드 + 수요 예측 데이터 기반 발주.'},{score:5,desc:'AI 수요 예측 + 자동 발주 최적화 완성.'}], ai_trigger:{threshold:2,warning:'data_driven_md_weak'} },
        { id:'ws_4_4', label:'마케팅 ROAS 최적화', type:'bars', question:'광고비 대비 매출액 데이터 관리 및 효율 낮은 광고를 즉시 중단할 수 있는 모니터링 체계를 보유합니까?', scale:[{score:1,desc:'ROAS 측정 없음. 광고비 낭비 인지 불가.'},{score:2,desc:'전체 ROAS만 파악. 채널별 분석 없음.'},{score:3,desc:'채널별 ROAS 월 관리. 비효율 채널 분기 조정.'},{score:4,desc:'ROAS 주 단위 모니터링. 즉각 예산 재배분.'},{score:5,desc:'AI 기반 실시간 ROAS 최적화. 자동 예산 배분.'}], ai_trigger:{threshold:2,warning:'roas_not_optimized'} },
      ]
    },
  ],
  ai_analysis: [
    { trigger:'dead_stock_unmanaged+ccc_not_managed', level:'CRITICAL', msg:'재고 회전 일수가 길고 현금 전환 사이클이 마이너스라면 매출이 늘수록 부도 위험이 커지는 상황입니다.' },
    { trigger:'channel_dependency_high+channel_margin_blind', level:'HIGH', msg:'특정 채널 매출은 높으나 실질 수익률이 낮다면 해당 채널은 마케팅용으로만 활용하고 수익 중심 채널로 고객을 유인하는 전략을 제시합니다.' },
    { trigger:'erp_wms_not_integrated+fulfillment_slow', level:'HIGH', msg:'매출은 급증하는데 ERP 연동률이 낮다면 조만간 오배송 및 품절 사고로 브랜드 신뢰도가 추락할 것을 예견하고 시스템 투자를 처방합니다.' },
  ],
};
if (typeof window !== 'undefined') window.INDUSTRY_WHOLESALE = INDUSTRY_WHOLESALE;
if (typeof module !== 'undefined') module.exports = INDUSTRY_WHOLESALE;
