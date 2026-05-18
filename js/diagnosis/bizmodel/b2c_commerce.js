const BM_B2C_COMMERCE = {
  id: 'b2c_commerce',
  label: 'B2C 커머스',
  icon: '🛒',
  description: '온라인 채널로 제품이나 서비스를 판매. ROAS·전환율·재구매율·실질 순마진이 핵심.',
  keyMetrics: ['ROAS', '전환율', '재구매율', '순마진율'],
  areas: [
    {
      id: 'com_merchandise',
      label: '상품 경쟁력 및 소싱',
      icon: '📦',
      items: [
        { id:'bc_1_1', label:'상품 가격 경쟁력', type:'bars', question:'시장 내 최적의 가격 포지셔닝 여부를 갖추고 있습니까?', scale:[{score:1,desc:'가격 경쟁력 없음. 시장 대비 고가.'},{score:2,desc:'가격 비교 간헐적. 포지셔닝 불명확.'},{score:3,desc:'주요 경쟁사 대비 가격 정기 비교.'},{score:4,desc:'동적 가격 전략 운영. 채널별 최적가 유지.'},{score:5,desc:'AI 기반 실시간 가격 최적화. 항상 최적 포지셔닝.'}], ai_trigger:{threshold:2,warning:'price_positioning_weak'} },
        { id:'bc_1_2', label:'상품 품질 관리', type:'bars', question:'불량률 통제 및 완전한 품질 관리 체계를 갖추고 있습니까?', scale:[{score:1,desc:'QC 없음. 불량 클레임 빈번.'},{score:2,desc:'입고 시 육안 검수만. 불량률 미집계.'},{score:3,desc:'QC 기준 보유. 불량률 3% 이하 관리.'},{score:4,desc:'불량률 1% 이하. 공급사 품질 평가제 운영.'},{score:5,desc:'AI 비전 검수. 불량률 0% 목표 달성 체계.'}], ai_trigger:{threshold:2,warning:'product_quality_weak'} },
        { id:'bc_1_3', label:'자사 브랜드 차별화', type:'bars', question:'단순 유통을 넘어선 독보적 브랜드 구축 수준을 갖추고 있습니까?', scale:[{score:1,desc:'브랜드 없음. 단순 유통 판매만 존재.'},{score:2,desc:'브랜드 이름만 존재. 스토리·개성 없음.'},{score:3,desc:'브랜드 컨셉 정립. 일부 팬덤 확보.'},{score:4,desc:'강력한 브랜드 자산. 재구매·추천율 높음.'},{score:5,desc:'카테고리 대표 브랜드. 고객이 먼저 찾는 구조.'}], ai_trigger:{threshold:2,warning:'brand_differentiation_weak'} },
        { id:'bc_1_4', label:'소싱 채널 다변화', type:'bars', question:'특정 공급처 의존을 탈피한 다채널 직소싱을 갖추고 있습니까?', scale:[{score:1,desc:'단일 공급처 100% 의존.'},{score:2,desc:'2~3개 공급처. 직소싱 없음.'},{score:3,desc:'직소싱 30% 이상. 공급처 다변화 중.'},{score:4,desc:'직소싱 50% 이상. Exclusive 상품 보유.'},{score:5,desc:'직소싱 70% 이상. 공급망 완전 분산.'}], ai_trigger:{threshold:2,warning:'sourcing_single_supplier'} },
      ]
    },
    {
      id: 'com_conversion',
      label: '고객 획득 및 전환',
      icon: '🎯',
      items: [
        { id:'bc_2_1', label:'광고 ROAS 관리', type:'bars', question:'광고비 대비 매출 효율의 채널별 최적화를 갖추고 있습니까?', scale:[{score:1,desc:'ROAS 측정 없음. 광고비 낭비 인지 불가.'},{score:2,desc:'전체 ROAS만 파악. 채널별 분석 없음.'},{score:3,desc:'채널별 ROAS 월 관리. 비효율 채널 조정.'},{score:4,desc:'ROAS 주 단위 최적화. 예산 자동 재배분.'},{score:5,desc:'AI 실시간 ROAS 최적화. 채널별 자동 예산 배분.'}], ai_trigger:{threshold:2,warning:'roas_unmanaged'} },
        { id:'bc_2_2', label:'상세페이지 전환율', type:'bars', question:'방문자를 구매자로 만드는 콘텐츠의 설득력을 갖추고 있습니까?', scale:[{score:1,desc:'전환율 측정 없음. 상세페이지 방치.'},{score:2,desc:'전환율 1% 미만. 개선 없음.'},{score:3,desc:'전환율 2% 이상. 정기 A/B 테스트.'},{score:4,desc:'전환율 4% 이상. 고화질 영상·리뷰 완비.'},{score:5,desc:'전환율 6% 이상. AI 개인화 상세페이지 운영.'}], ai_trigger:{threshold:2,warning:'product_page_cvr_low'} },
        { id:'bc_2_3', label:'장바구니 이탈 방지', type:'bars', question:'자동화된 리타겟팅을 통한 구매 유도 체계를 갖추고 있습니까?', scale:[{score:1,desc:'장바구니 이탈 방치.'},{score:2,desc:'이탈률 파악. 대응 없음.'},{score:3,desc:'이탈 후 이메일 1회 발송.'},{score:4,desc:'이탈 후 멀티채널 리타겟팅. 복귀율 15% 이상.'},{score:5,desc:'AI 개인화 리타겟팅. 복귀율 25% 이상.'}], ai_trigger:{threshold:2,warning:'cart_abandonment_high'} },
        { id:'bc_2_4', label:'CAC 대 LTV 관리', type:'bars', question:'획득 비용이 생애 가치 범위를 넘지 않는지 관리하고 있습니까?', scale:[{score:1,desc:'CAC·LTV 개념 없음. 측정 전무.'},{score:2,desc:'CAC만 파악. LTV 미산출.'},{score:3,desc:'LTV/CAC 비율 분기 산출. 3배 목표.'},{score:4,desc:'LTV/CAC 4배 이상 유지. 채널별 최적화.'},{score:5,desc:'LTV/CAC 5배 이상. AI 기반 자동 최적화.'}], ai_trigger:{threshold:2,warning:'ltv_cac_below_threshold'} },
      ]
    },
    {
      id: 'com_loyalty',
      label: '재구매 및 충성도',
      icon: '❤️',
      items: [
        { id:'bc_3_1', label:'3개월 내 재구매율', type:'bars', question:'단발성 구매를 넘어선 지속적 구매 비율을 관리하고 있습니까?', scale:[{score:1,desc:'재구매율 측정 없음.'},{score:2,desc:'재구매율 10% 미만. 개선 없음.'},{score:3,desc:'재구매율 20% 이상. 재구매 유도 캠페인.'},{score:4,desc:'재구매율 35% 이상. CRM 자동화 운영.'},{score:5,desc:'재구매율 50% 이상. 충성 고객 기반 완성.'}], ai_trigger:{threshold:2,warning:'repurchase_rate_low'} },
        { id:'bc_3_2', label:'CRM 타겟 마케팅', type:'bars', question:'고객 세그먼트별 맞춤형 자동화 마케팅을 갖추고 있습니까?', scale:[{score:1,desc:'CRM 없음. 전체 고객 동일 메시지.'},{score:2,desc:'기본 이메일 발송. 세그먼트 없음.'},{score:3,desc:'구매 이력 기반 세그먼트 마케팅.'},{score:4,desc:'행동 데이터 기반 개인화 자동화 마케팅.'},{score:5,desc:'AI CRM. 초개인화 + 최적 타이밍 자동 발송.'}], ai_trigger:{threshold:2,warning:'crm_not_personalized'} },
        { id:'bc_3_3', label:'리뷰·평점 관리', type:'bars', question:'전략적 관리를 통한 고객 신뢰 구축 수준을 갖추고 있습니까?', scale:[{score:1,desc:'리뷰 관리 없음. 부정 리뷰 방치.'},{score:2,desc:'긍정 리뷰만 확인. 부정 리뷰 미대응.'},{score:3,desc:'전체 리뷰 48시간 내 답글. 평점 4.0 유지.'},{score:4,desc:'리뷰 실시간 모니터링. 평점 4.5 이상 유지.'},{score:5,desc:'AI 리뷰 분석. 부정 패턴 조기 감지 + 즉각 대응.'}], ai_trigger:{threshold:2,warning:'review_management_weak'} },
        { id:'bc_3_4', label:'VIP 고객 혜택 체계', type:'bars', question:'충성 고객을 위한 차별화된 등급제 운영을 갖추고 있습니까?', scale:[{score:1,desc:'등급제 없음. 모든 고객 동일 대우.'},{score:2,desc:'기본 포인트 적립만 운영.'},{score:3,desc:'등급제 운영. VIP 전용 혜택 제공.'},{score:4,desc:'VIP 전담 CS + 단독 상품 + 얼리액세스.'},{score:5,desc:'VIP 생태계 완성. VIP가 자발적 홍보대사화.'}], ai_trigger:{threshold:2,warning:'vip_program_missing'} },
      ]
    },
    {
      id: 'com_ops',
      label: '운영 효율 및 수익성',
      icon: '💹',
      items: [
        { id:'bc_4_1', label:'채널별 실질 순마진율', type:'bars', question:'플랫폼 수수료 등을 제외한 정밀 마진 관리를 하고 있습니까?', scale:[{score:1,desc:'채널별 순마진 파악 없음. 매출만 집계.'},{score:2,desc:'수수료만 파악. 광고비·배송비 미포함.'},{score:3,desc:'채널별 Contribution Margin 분기 산출.'},{score:4,desc:'채널별 CM 실시간 모니터링. 적자 채널 즉각 조정.'},{score:5,desc:'CM 자동 대시보드. 채널별 예산 AI 자동 최적화.'}], ai_trigger:{threshold:2,warning:'channel_margin_blind'} },
        { id:'bc_4_2', label:'물류·배송 비용 최적화', type:'bars', question:'물류비용 절감을 위한 자동화 및 협상력을 갖추고 있습니까?', scale:[{score:1,desc:'물류비 관리 없음. 단일 택배사 의존.'},{score:2,desc:'물류비 집계. 협상 없음.'},{score:3,desc:'복수 택배사 비교. 물류비 목표 관리.'},{score:4,desc:'물류비 최적화 계약. 자동화 출고 시스템.'},{score:5,desc:'풀필먼트 최적화. 물류비 업계 최저 달성.'}], ai_trigger:{threshold:2,warning:'logistics_cost_high'} },
        { id:'bc_4_3', label:'CS 응대 품질', type:'bars', question:'신속하고 만족도 높은 고객 대응 체계를 갖추고 있습니까?', scale:[{score:1,desc:'CS 체계 없음. 문의 방치 빈번.'},{score:2,desc:'이메일 CS만 가능. 응답 지연.'},{score:3,desc:'24시간 내 CS 응대. 만족도 보통.'},{score:4,desc:'4시간 내 응대. CS 만족도 4.0 이상.'},{score:5,desc:'AI CS 자동화. 즉시 응대 + 만족도 4.8 이상.'}], ai_trigger:{threshold:2,warning:'cs_quality_poor'} },
        { id:'bc_4_4', label:'반품·교환 처리 효율', type:'bars', question:'반품률 통제 및 신속한 리퍼브 전환 능력을 갖추고 있습니까?', scale:[{score:1,desc:'반품 처리 체계 없음. 혼란 빈번.'},{score:2,desc:'반품률 파악. 리퍼브 없음.'},{score:3,desc:'반품 처리 SOP 보유. 리퍼브 일부 운영.'},{score:4,desc:'반품률 5% 이하. 리퍼브 전환율 80% 이상.'},{score:5,desc:'반품 자동화. 리퍼브 즉시 재판매 체계.'}], ai_trigger:{threshold:2,warning:'return_process_inefficient'} },
      ]
    },
  ],
  ai_analysis: [
    { trigger:'roas_unmanaged+channel_margin_blind', level:'CRITICAL', msg:'광고비는 높으나 순마진이 낮으면 광고 플랫폼만 돈 버는 구조입니다. 자사몰 전환 및 재구매 강화를 처방합니다.' },
    { trigger:'repurchase_rate_low+ltv_cac_below_threshold', level:'CRITICAL', msg:'CAC는 높은데 재구매율이 낮으면 성장이 불가능한 밑 빠진 독입니다. CRM 고도화를 최우선 처방합니다.' },
    { trigger:'review_management_weak+product_page_cvr_low', level:'HIGH', msg:'평점과 전환율이 동시에 낮으면 상품 자체의 문제입니다. 광고 집행 전 품질 개선을 처방합니다.' },
  ],
};
if (typeof window !== 'undefined') window.BM_B2C_COMMERCE = BM_B2C_COMMERCE;
if (typeof module !== 'undefined') module.exports = BM_B2C_COMMERCE;
