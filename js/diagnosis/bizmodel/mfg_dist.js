const BM_MFG_DIST = {
  id: 'mfg_dist',
  label: '제조·유통',
  icon: '🏭',
  description: '물리적 재화를 제조하거나 판매까지 직접 하는 비즈니스. 원가·재고 회전율·CCC·자사 브랜드 비중이 핵심.',
  keyMetrics: ['원가율', '재고 회전율', 'CCC', '자사 브랜드 비중'],
  areas: [
    {
      id: 'mfg_production',
      label: '생산 원가 및 품질',
      icon: '⚙️',
      items: [
        { id:'md_1_1', label:'제품별 제조 원가 산출', type:'bars', question:'원가가 감이 아닌 정밀 데이터로 관리되는지 여부를 갖추고 있습니까?', scale:[{score:1,desc:'원가 산출 없음. 감으로 가격 책정.'},{score:2,desc:'대략적인 원가 파악. 제품별 분리 없음.'},{score:3,desc:'제품별 원가 월 단위 산출. 기준치 비교.'},{score:4,desc:'제품별 실시간 원가 추적. 변동 요인 분석.'},{score:5,desc:'AI 기반 원가 자동 산출. 공정별 드릴다운 분석.'}], ai_trigger:{threshold:2,warning:'manufacturing_cost_unknown'} },
        { id:'md_1_2', label:'불량·반품 데이터 관리', type:'bars', question:'데이터 기반의 체계적인 품질 개선 프로세스를 갖추고 있습니까?', scale:[{score:1,desc:'불량 데이터 없음. 발생 후 수습.'},{score:2,desc:'불량률 집계. 원인 분석 없음.'},{score:3,desc:'불량 원인별 분류. 월 단위 개선.'},{score:4,desc:'불량 자동 감지. 즉각 공정 개선 루프.'},{score:5,desc:'AI 품질 예측. 불량 0% 목표 달성 체계.'}], ai_trigger:{threshold:2,warning:'defect_data_missing'} },
        { id:'md_1_3', label:'생산 유연성', type:'bars', question:'시장 요구에 부합하는 소량 다품종 생산 가능 여부를 갖추고 있습니까?', scale:[{score:1,desc:'단일 품목 대량 생산만 가능.'},{score:2,desc:'2~3개 품목. 전환 시간 과다.'},{score:3,desc:'소량 다품종 생산 가능. 전환 시간 관리.'},{score:4,desc:'유연 생산 라인 구축. 소량 주문 대응.'},{score:5,desc:'완전 유연 생산. 개인화 제품도 경제적 생산 가능.'}], ai_trigger:{threshold:2,warning:'production_flexibility_low'} },
        { id:'md_1_4', label:'신제품 개발 주기', type:'bars', question:'트렌드를 반영한 빠른 제품 런칭 역량을 갖추고 있습니까?', scale:[{score:1,desc:'신제품 개발 체계 없음. 즉흥적 출시.'},{score:2,desc:'연 1회 미만 신제품. 트렌드 미반영.'},{score:3,desc:'분기 1회 신제품 기획. 트렌드 반영.'},{score:4,desc:'월 단위 신제품 파이프라인. 출시 성공률 관리.'},{score:5,desc:'데이터 기반 신제품 기획. 트렌드 선도적 출시.'}], ai_trigger:{threshold:2,warning:'new_product_cycle_slow'} },
      ]
    },
    {
      id: 'mfg_distribution',
      label: '유통 채널 및 납품 관리',
      icon: '🚚',
      items: [
        { id:'md_2_1', label:'유통 채널 다각화', type:'bars', question:'온·오프라인을 아우르는 매출처 분산 상태를 갖추고 있습니까?', scale:[{score:1,desc:'단일 채널 100% 의존.'},{score:2,desc:'2~3개 채널. 주력 채널 70% 이상.'},{score:3,desc:'온·오프라인 균형. 주력 채널 50% 이하.'},{score:4,desc:'6개 이상 채널 균형 운영. 자사몰 20% 이상.'},{score:5,desc:'채널 완전 분산. D2C 전략 완성.'}], ai_trigger:{threshold:2,warning:'distribution_channel_single'} },
        { id:'md_2_2', label:'납품가 협상력', type:'bars', question:'거래처와의 대등한 협상을 통한 마진 확보 능력을 갖추고 있습니까?', scale:[{score:1,desc:'협상력 없음. 거래처 제시가 수용.'},{score:2,desc:'소극적 협상. 마진 확보 어려움.'},{score:3,desc:'정기 협상으로 적정 마진 확보.'},{score:4,desc:'강한 협상력. 거래처 대비 유리한 조건.'},{score:5,desc:'가격 결정력 보유. 거래처가 먼저 조건 제안.'}], ai_trigger:{threshold:2,warning:'pricing_power_weak'} },
        { id:'md_2_3', label:'물류 배송 효율', type:'bars', question:'물류비용의 최적화 및 안정적 배송 체계를 갖추고 있습니까?', scale:[{score:1,desc:'물류비 관리 없음. 단일 택배사 의존.'},{score:2,desc:'물류비 집계. 최적화 없음.'},{score:3,desc:'복수 물류사 비교. 비용 목표 관리.'},{score:4,desc:'물류비 최적화 계약. 자동 출고 시스템.'},{score:5,desc:'풀필먼트 최적화. 물류비 업계 최저 달성.'}], ai_trigger:{threshold:2,warning:'logistics_cost_unoptimized'} },
        { id:'md_2_4', label:'파트너 관리 체계', type:'bars', question:'대리점 및 도매상에 대한 체계적인 지원과 관리를 갖추고 있습니까?', scale:[{score:1,desc:'파트너 관리 없음. 납품 후 방치.'},{score:2,desc:'주요 파트너만 관리. 기준 없음.'},{score:3,desc:'파트너 등급제 운영. 정기 지원 체계.'},{score:4,desc:'파트너 성과 관리. 인센티브 체계 완비.'},{score:5,desc:'파트너 생태계 완성. 파트너가 자발적 영업사원화.'}], ai_trigger:{threshold:2,warning:'partner_management_weak'} },
      ]
    },
    {
      id: 'mfg_brand',
      label: '브랜드·마케팅 역량',
      icon: '✨',
      items: [
        { id:'md_3_1', label:'자사 브랜드 비중', type:'bars', question:'OEM(하청) 위주에서 벗어난 브랜드 보유 비중을 갖추고 있습니까?', scale:[{score:1,desc:'OEM 100%. 자사 브랜드 전무.'},{score:2,desc:'OEM 위주. 자사 브랜드 10% 미만.'},{score:3,desc:'자사 브랜드 30% 이상. 온라인 판매 시작.'},{score:4,desc:'자사 브랜드 50% 이상. 팬덤 고객 확보.'},{score:5,desc:'자사 브랜드 70% 이상. OEM 의존 탈피 완성.'}], ai_trigger:{threshold:2,warning:'oem_dependency_high'} },
        { id:'md_3_2', label:'온라인 브랜드 인지도', type:'bars', question:'시장에서 인식되는 디지털 브랜드 경쟁력을 갖추고 있습니까?', scale:[{score:1,desc:'온라인 존재감 없음. 디지털 마케팅 전무.'},{score:2,desc:'기본 온라인 채널 보유. 인지도 미미.'},{score:3,desc:'SNS 팔로워 성장 중. 검색 노출 확보.'},{score:4,desc:'업계 내 온라인 인지도 상위. ROAS 관리 중.'},{score:5,desc:'온라인 카테고리 대표 브랜드. 자연 유입 50% 이상.'}], ai_trigger:{threshold:2,warning:'online_brand_weak'} },
        { id:'md_3_3', label:'판촉 프로모션 ROI', type:'bars', question:'마케팅 비용 투입 대비 실질 매출 증대 효율을 관리하고 있습니까?', scale:[{score:1,desc:'프로모션 ROI 측정 없음.'},{score:2,desc:'매출 증가만 파악. 비용 대비 효율 미분석.'},{score:3,desc:'프로모션 ROI 집계. 효율 낮은 프로모션 조정.'},{score:4,desc:'채널별 ROI 실시간 관리. 최적 프로모션 믹스.'},{score:5,desc:'AI 기반 프로모션 자동 최적화. ROI 업계 최고.'}], ai_trigger:{threshold:2,warning:'promotion_roi_blind'} },
        { id:'md_3_4', label:'대형 유통 입점 파워', type:'bars', question:'백화점·마트 등 주요 유통사와의 협상력을 갖추고 있습니까?', scale:[{score:1,desc:'대형 유통 입점 없음. 협상력 전무.'},{score:2,desc:'소형 유통 일부 입점. 대형 유통 협상 경험 없음.'},{score:3,desc:'대형 유통 1~2곳 입점. 기본 협상력 보유.'},{score:4,desc:'주요 대형 유통 다수 입점. 우대 조건 확보.'},{score:5,desc:'대형 유통 전략적 파트너십. 유통사가 먼저 요청.'}], ai_trigger:{threshold:2,warning:'retail_entry_power_weak'} },
      ]
    },
    {
      id: 'mfg_finance',
      label: '재고·자금 흐름',
      icon: '💰',
      items: [
        { id:'md_4_1', label:'완제품 재고 회전율', type:'bars', question:'창고에 쌓인 물건이 현금화되는 속도를 관리하고 있습니까?', scale:[{score:1,desc:'재고 회전율 개념 없음. 재고 현황 파악 불가.'},{score:2,desc:'전체 재고 회전율 집계. 제품별 분석 없음.'},{score:3,desc:'제품별 재고 회전율 관리. 악성 재고 기준 설정.'},{score:4,desc:'재고 회전율 최적화. 악성 재고 즉각 처리.'},{score:5,desc:'AI 재고 최적화. 악성 재고 0% 목표 달성.'}], ai_trigger:{threshold:2,warning:'inventory_turnover_low'} },
        { id:'md_4_2', label:'현금 전환 사이클(CCC)', type:'bars', question:'자재 구매부터 판매 대금 회수까지의 기간을 관리하고 있습니까?', scale:[{score:1,desc:'CCC 개념 없음. 현금 공백 인지 불가.'},{score:2,desc:'CCC 대략 파악. 최적화 없음.'},{score:3,desc:'CCC 분기 산출. 단축 목표 설정.'},{score:4,desc:'CCC 월 단위 관리. 매입 조건 협상 연동.'},{score:5,desc:'CCC 실시간 모니터링. 자금 조달 선제 실행.'}], ai_trigger:{threshold:2,warning:'ccc_too_long'} },
        { id:'md_4_3', label:'수요 예측 정확도', type:'bars', question:'데이터에 기반한 발주 및 생산량 결정 수준을 갖추고 있습니까?', scale:[{score:1,desc:'수요 예측 없음. 감으로 생산량 결정.'},{score:2,desc:'전년 대비 단순 추산. 오차율 높음.'},{score:3,desc:'계절 트렌드 반영 예측. 오차율 20% 이하.'},{score:4,desc:'ML 기반 수요 예측. 오차율 10% 이하.'},{score:5,desc:'AI 실시간 수요 예측. 오차율 5% 이하. 자동 발주.'}], ai_trigger:{threshold:2,warning:'demand_forecast_inaccurate'} },
        { id:'md_4_4', label:'운전자본 확보 수준', type:'bars', question:'사업 확장을 견딜 수 있는 여유 자본 유무를 관리하고 있습니까?', scale:[{score:1,desc:'운전자본 없음. 항상 자금 부족.'},{score:2,desc:'최소 운전자본만 보유. 확장 불가.'},{score:3,desc:'3개월치 운전자본 보유. 기본 확장 가능.'},{score:4,desc:'6개월치 운전자본 보유. 안정적 확장.'},{score:5,desc:'1년치 운전자본 보유. 공격적 확장 가능.'}], ai_trigger:{threshold:2,warning:'working_capital_insufficient'} },
      ]
    },
  ],
  ai_analysis: [
    { trigger:'manufacturing_cost_unknown+pricing_power_weak', level:'CRITICAL', msg:'원가 파악 없이 협상력이 낮으면 팔수록 손해인 구조입니다. 원가 분석 후 채널 재편을 처방합니다.' },
    { trigger:'oem_dependency_high+online_brand_weak', level:'HIGH', msg:'OEM 100%인데 자사 브랜드가 없으면 거래처 이탈 시 생존 불가능합니다. 브랜드 육성 로드맵을 처방합니다.' },
    { trigger:'inventory_turnover_low+ccc_too_long', level:'HIGH', msg:'재고 회전이 낮고 현금 사이클이 길면 성장이 곧 자금 압박이 됩니다. 현금 흐름 관리 경고를 발령합니다.' },
  ],
};
if (typeof window !== 'undefined') window.BM_MFG_DIST = BM_MFG_DIST;
if (typeof module !== 'undefined') module.exports = BM_MFG_DIST;
