const INDUSTRY_FASHION = {
  id: 'fashion',
  label: '패션 및 뷰티 브랜드',
  icon: '👗',
  description: '의류 브랜드(D2C)·화장품 제조 판매·소규모 뷰티 숍. 시즌별 재고 회전과 자사몰 비중이 수익성을 결정.',
  areas: [
    {
      id: 'fsh_finance',
      label: '재무 구조 및 수익성',
      icon: '💰',
      items: [
        { id:'fs_1_1', label:'시즌별 원가율·마진', type:'bars', question:'원단·부자재 매입가 대비 판매가 적정성 및 정상가 판매(Full-price) 비중을 관리하고 있습니까?', scale:[{score:1,desc:'원가율 파악 없음. 감으로 가격 책정.'},{score:2,desc:'전체 원가율 대략 파악. 시즌별 분석 없음.'},{score:3,desc:'시즌별 원가율 관리. Full-price 비중 집계.'},{score:4,desc:'SKU별 원가율 실시간 관리. Full-price 70% 이상.'},{score:5,desc:'원가율 AI 자동 최적화. Full-price 80% 이상 달성.'}], ai_trigger:{threshold:2,warning:'cost_margin_unmanaged'} },
        { id:'fs_1_2', label:'재고 회전 일수(SKU별)', type:'bars', question:'상품군별 창고 체류 기간 및 악성 재고 판정 기준과 처리 속도를 관리하고 있습니까?', scale:[{score:1,desc:'재고 회전 파악 없음. 악성 재고 방치.'},{score:2,desc:'전체 재고 회전율만 집계. SKU 분석 없음.'},{score:3,desc:'SKU별 재고 회전 분기 집계. 악성 재고 기준 설정.'},{score:4,desc:'악성 재고 자동 감지. 즉각 처리 프로세스 가동.'},{score:5,desc:'재고 회전 AI 최적화. 악성 재고 0% 목표 달성.'}], ai_trigger:{threshold:2,warning:'dead_stock_high'} },
        { id:'fs_1_3', label:'할인 판매 매출 비중', type:'bars', question:'정기·상시 세일이 전체 매출에서 차지하는 비중(마진 잠식 위험도)을 관리하고 있습니까?', scale:[{score:1,desc:'할인 의존도 파악 없음. 상시 할인 운영.'},{score:2,desc:'할인 매출 비중 대략 파악. 마진 영향 미분석.'},{score:3,desc:'할인 비중 30% 이하 목표 관리.'},{score:4,desc:'할인 비중 20% 이하. 마진 영향 실시간 모니터링.'},{score:5,desc:'할인 최소화 전략 완성. Full-price 문화 구축.'}], ai_trigger:{threshold:2,warning:'discount_dependency_high'} },
        { id:'fs_1_4', label:'자사몰(D2C) 결제 비중', type:'bars', question:'플랫폼 수수료를 제외한 자사몰 직접 결제 비중 및 회원 수를 관리하고 있습니까?', scale:[{score:1,desc:'자사몰 없음. 플랫폼 100% 의존.'},{score:2,desc:'자사몰 보유. 결제 비중 10% 미만.'},{score:3,desc:'자사몰 결제 비중 20% 이상. 회원 수 증가.'},{score:4,desc:'D2C 비중 40% 이상. 멤버십 체계 운영.'},{score:5,desc:'D2C 비중 60% 이상. 플랫폼 의존 탈피 완성.'}], ai_trigger:{threshold:2,warning:'d2c_ratio_low'} },
      ]
    },
    {
      id: 'fsh_ops',
      label: '생산 프로세스 및 물류',
      icon: '🏭',
      items: [
        { id:'fs_2_1', label:'반응 생산(QR) 체계', type:'bars', question:'시장 반응에 따라 1~2주 내 추가 생산(리오더)이 가능한 공급망 보유 수준을 갖추고 있습니까?', scale:[{score:1,desc:'리오더 불가. 시즌 초 발주 전량 생산.'},{score:2,desc:'리오더 가능하나 4주 이상 소요.'},{score:3,desc:'2주 내 리오더 가능. 주요 스타일 적용.'},{score:4,desc:'1주 내 리오더 체계. 전 스타일 적용.'},{score:5,desc:'48시간 내 리오더 완성. 실시간 수요 반응 생산.'}], ai_trigger:{threshold:2,warning:'quick_response_missing'} },
        { id:'fs_2_2', label:'품질 검수(QC) 불량률', type:'bars', question:'완제품 입고 시 불량 발생률 및 공장별 사고 이력 관리를 하고 있습니까?', scale:[{score:1,desc:'QC 없음. 불량 발생 후 수습.'},{score:2,desc:'입고 시 육안 검수만 실시. 불량률 미집계.'},{score:3,desc:'QC 기준 보유. 공장별 불량률 집계.'},{score:4,desc:'불량률 1% 이하 관리. 공장 등급제 운영.'},{score:5,desc:'AI 비전 검수. 불량률 0% 목표 달성 체계.'}], ai_trigger:{threshold:2,warning:'qc_defect_high'} },
        { id:'fs_2_3', label:'물류·반품 처리 속도', type:'bars', question:'주문 후 배송 완료까지의 시간과 반품의 재검수·재판매 전환 속도를 관리하고 있습니까?', scale:[{score:1,desc:'배송 속도 측정 없음. 반품 처리 혼란.'},{score:2,desc:'평균 배송 시간 파악. 반품 처리 기준 없음.'},{score:3,desc:'배송 목표 시간 설정. 반품 재판매 체계.'},{score:4,desc:'당일 출고 90% 이상. 반품 재검수 24시간.'},{score:5,desc:'배송·반품 완전 자동화. 업계 최고 속도.'}], ai_trigger:{threshold:2,warning:'logistics_speed_slow'} },
        { id:'fs_2_4', label:'공급망(OEM·ODM) 안정성', type:'bars', question:'핵심 제조 공장과의 결제 조건 및 비상 시 대체 공장 확보 여부를 갖추고 있습니까?', scale:[{score:1,desc:'단일 공장 100% 의존. 비상 대응 불가.'},{score:2,desc:'주력 공장 의존. 대체 공장 미확보.'},{score:3,desc:'대체 공장 1~2개 보유. 비상 대응 가능.'},{score:4,desc:'공장 포트폴리오 구축. 물량 분산 운영.'},{score:5,desc:'공급망 완전 분산. 단일 공장 의존도 30% 이하.'}], ai_trigger:{threshold:2,warning:'supply_chain_fragile'} },
      ]
    },
    {
      id: 'fsh_planning',
      label: '기획 역량 및 조직력',
      icon: '🎨',
      items: [
        { id:'fs_3_1', label:'MD·디자이너 기획 적중률', type:'bars', question:'출시 전 예측 수요 대비 실제 판매량의 오차 범위 관리를 하고 있습니까?', scale:[{score:1,desc:'기획 적중률 개념 없음. 감으로 발주.'},{score:2,desc:'기획 vs 실판매 비교. 오차 분석 없음.'},{score:3,desc:'기획 적중률 집계. 오차 원인 분석.'},{score:4,desc:'기획 적중률 80% 이상. 데이터 기반 발주.'},{score:5,desc:'AI 수요 예측. 기획 적중률 90% 이상 달성.'}], ai_trigger:{threshold:2,warning:'planning_accuracy_low'} },
        { id:'fs_3_2', label:'외주 관리·단가 협상', type:'bars', question:'공장별 공임 단가 비교 분석 및 납기 준수 제어력을 보유하고 있습니까?', scale:[{score:1,desc:'외주 단가 관리 없음. 제시가 수용.'},{score:2,desc:'주요 공장 단가 파악. 협상 없음.'},{score:3,desc:'공장별 단가 비교. 정기 협상 실시.'},{score:4,desc:'단가 DB 보유. 납기 준수율 90% 이상.'},{score:5,desc:'공장 등급제 + 단가 자동 비교. 납기 100% 달성.'}], ai_trigger:{threshold:2,warning:'outsourcing_cost_unmanaged'} },
        { id:'fs_3_3', label:'트렌드 데이터 활용도', type:'bars', question:'데이터를 활용한 디자인·컬러 선정 프로세스를 보유하고 있습니까?', scale:[{score:1,desc:'트렌드 데이터 없음. 디자이너 감에만 의존.'},{score:2,desc:'트렌드 리포트 구독. 실제 반영 미흡.'},{score:3,desc:'트렌드 데이터 기반 컬러·디자인 선정.'},{score:4,desc:'SNS 데이터 분석 + 트렌드 예측 반영.'},{score:5,desc:'AI 트렌드 분석. 시즌 6개월 전 선행 기획 완성.'}], ai_trigger:{threshold:2,warning:'trend_data_unused'} },
        { id:'fs_3_4', label:'콘텐츠 제작 팀워크', type:'bars', question:'룩북·상세페이지 제작을 위한 협업 효율과 속도를 갖추고 있습니까?', scale:[{score:1,desc:'콘텐츠 제작 체계 없음. 즉흥적 제작.'},{score:2,desc:'외주 위주 제작. 품질·속도 편차 심각.'},{score:3,desc:'내부·외주 협업 체계. 제작 캘린더 운영.'},{score:4,desc:'인하우스 제작팀 구축. 제작 속도 업계 최고.'},{score:5,desc:'AI 콘텐츠 자동화. 룩북~상세페이지 72시간 내 완성.'}], ai_trigger:{threshold:2,warning:'content_production_slow'} },
      ]
    },
    {
      id: 'fsh_marketing',
      label: '마케팅 및 브랜드 자산',
      icon: '✨',
      items: [
        { id:'fs_4_1', label:'광고 효율(ROAS)', type:'bars', question:'채널별 광고비 투입 대비 직접 매출 발생액 추적 여부를 갖추고 있습니까?', scale:[{score:1,desc:'ROAS 측정 없음. 광고비 낭비 인지 불가.'},{score:2,desc:'전체 ROAS만 파악. 채널별 분석 없음.'},{score:3,desc:'채널별 ROAS 월 관리. 비효율 채널 조정.'},{score:4,desc:'ROAS 주 단위 최적화. 예산 자동 재배분.'},{score:5,desc:'AI 기반 실시간 ROAS 최적화. 채널별 자동 예산 배분.'}], ai_trigger:{threshold:2,warning:'roas_untracked'} },
        { id:'fs_4_2', label:'SNS 팔로워 참여율(ER)', type:'bars', question:'좋아요·댓글·공유 등 고객과의 실질적 상호작용 지수(Engagement Rate)를 관리하고 있습니까?', scale:[{score:1,desc:'ER 개념 없음. 팔로워 수만 집계.'},{score:2,desc:'ER 대략 파악. 개선 전략 없음.'},{score:3,desc:'채널별 ER 집계. 목표 ER 설정.'},{score:4,desc:'ER 업계 평균 이상 유지. 콘텐츠 전략 최적화.'},{score:5,desc:'ER 업계 최고 수준. 팬덤 기반 자발적 바이럴.'}], ai_trigger:{threshold:2,warning:'engagement_rate_low'} },
        { id:'fs_4_3', label:'자사몰 전환율(CVR)', type:'bars', question:'방문자 대비 구매 완료 비중 및 리마케팅 실행 여부를 갖추고 있습니까?', scale:[{score:1,desc:'CVR 측정 없음. 리마케팅 없음.'},{score:2,desc:'CVR 대략 파악. 리마케팅 미실행.'},{score:3,desc:'CVR 집계. 기본 리마케팅 가동.'},{score:4,desc:'CVR 3% 이상. 리마케팅 자동화 운영.'},{score:5,desc:'CVR 5% 이상. AI 개인화 리마케팅 완성.'}], ai_trigger:{threshold:2,warning:'cvr_low'} },
        { id:'fs_4_4', label:'브랜드 스토리텔링', type:'bars', question:'타 브랜드와 구별되는 독보적인 컨셉 및 시각적 에셋의 통일성을 갖추고 있습니까?', scale:[{score:1,desc:'브랜드 컨셉 없음. 제품 나열만 존재.'},{score:2,desc:'기본 컨셉 존재. 시각적 일관성 없음.'},{score:3,desc:'브랜드 컨셉 정립. 시각적 에셋 일부 통일.'},{score:4,desc:'강력한 브랜드 스토리. 시각적 완전 통일.'},{score:5,desc:'브랜드 IP 구축 완성. 고객이 먼저 찾는 브랜드.'}], ai_trigger:{threshold:2,warning:'brand_storytelling_weak'} },
      ]
    },
  ],
  ai_analysis: [
    { trigger:'dead_stock_high+discount_dependency_high', level:'CRITICAL', msg:'재고 회전은 느린데 세일 비중이 높다면 상품 기획력 부재입니다. 데이터 기반 적정 발주량 예측 시스템과 시즌 오프 전략 재수립을 처방합니다.' },
    { trigger:'d2c_ratio_low+roas_untracked', level:'HIGH', msg:'매출은 높은데 자사몰 비중이 낮다면 플랫폼 수수료로 속 빈 강정입니다. 자사몰 전용 멤버십 혜택과 단독 상품 출시로 고객 유도를 제안합니다.' },
    { trigger:'quick_response_missing+planning_accuracy_low', level:'HIGH', msg:'인기 상품 품절은 잦은데 리오더 속도가 느리다면 기회 손실입니다. 초단기 반응 생산 라인 확보 및 공급망 다변화를 처방합니다.' },
  ],
};
if (typeof window !== 'undefined') window.INDUSTRY_FASHION = INDUSTRY_FASHION;
if (typeof module !== 'undefined') module.exports = INDUSTRY_FASHION;
