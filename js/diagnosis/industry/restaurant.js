const INDUSTRY_RESTAURANT = {
  id: 'restaurant',
  label: '외식 및 휴게음식업',
  icon: '🍽️',
  description: '일반 식당·카페·배달 전문점. 높은 임대료와 인건비 부담, 배달 플랫폼 의존도 심화.',
  areas: [
    {
      id: 'rest_cost',
      label: '원가 관리 및 메뉴 엔지니어링',
      icon: '📊',
      items: [
        { id:'rt_1_1', label:'식재료 원가율(Food Cost %)', type:'bars', question:'메뉴별 표준 레시피에 따른 원가 산출 여부 및 실제 매출 대비 식재료비 비중(기준치 30~35%)을 관리하고 있습니까?', scale:[{score:1,desc:'원가율 개념 없음. 감으로 가격 책정.'},{score:2,desc:'전체 식재료비만 파악. 메뉴별 원가율 없음.'},{score:3,desc:'주요 메뉴 원가율 산출. 기준치 비교.'},{score:4,desc:'전 메뉴 레시피 기반 원가율 주 단위 관리.'},{score:5,desc:'ACM 산식 적용. 메뉴별 실시간 마진 시뮬레이션.'}], ai_trigger:{threshold:2,warning:'food_cost_unmanaged'} },
        { id:'rt_1_2', label:'메뉴 믹스(Menu Mix) 분석', type:'bars', question:'판매량은 높으나 마진이 낮은 상품과 판매량은 낮으나 마진이 높은 상품의 비중 분석을 실시하고 있습니까?', scale:[{score:1,desc:'메뉴 분석 없음. 관성으로 메뉴 유지.'},{score:2,desc:'잘 팔리는 메뉴 파악. 마진 기준 분류 없음.'},{score:3,desc:'판매량·마진 기준 4분면 분류 분기 실시.'},{score:4,desc:'Dog 메뉴 정기 제거. Star 메뉴 전면 배치.'},{score:5,desc:'메뉴 엔지니어링 월 자동화. 실시간 최적화.'}], ai_trigger:{threshold:2,warning:'menu_mix_unanalyzed'} },
        { id:'rt_1_3', label:'폐기·로스(Loss) 관리', type:'bars', question:'당일 소진 원칙에 따른 식재료 폐기율 및 정량 배식(Portion Control) 준수 수준을 관리하고 있습니까?', scale:[{score:1,desc:'폐기 관리 없음. 식재료 낭비 심각.'},{score:2,desc:'폐기량 대략 인지. 기록 없음.'},{score:3,desc:'일일 폐기 원가 기록. 감축 목표 설정.'},{score:4,desc:'주방 저울 Portion 통제. 폐기율 3% 이하.'},{score:5,desc:'폐기율 ACM 연동 자동 계산. 제로 웨이스트 목표.'}], ai_trigger:{threshold:2,warning:'food_waste_high'} },
        { id:'rt_1_4', label:'식자재 소싱 최적화', type:'bars', question:'대형 유통망·직거래·도매시장 등 구매처 다변화를 통한 매입 단가 절감 노력이 이루어지고 있습니까?', scale:[{score:1,desc:'단일 공급처 의존. 가격 협상 없음.'},{score:2,desc:'2~3개 공급처 활용. 가격 비교 없음.'},{score:3,desc:'공급처 정기 비교. 주요 품목 직거래.'},{score:4,desc:'직거래 50% 이상. 시즌별 대량 구매로 단가 절감.'},{score:5,desc:'공급처 포트폴리오 최적화. AI 기반 발주 자동화.'}], ai_trigger:{threshold:2,warning:'sourcing_single'} },
      ]
    },
    {
      id: 'rest_ops',
      label: '운영 효율 및 생산성',
      icon: '⚡',
      items: [
        { id:'rt_2_1', label:'테이블 회전율 및 가동률', type:'bars', question:'피크 타임 시 테이블 회전 수 및 영업시간 내 유휴 좌석 비중을 데이터로 관리하고 있습니까?', scale:[{score:1,desc:'회전율 측정 없음. 유휴 좌석 방치.'},{score:2,desc:'피크 타임 회전 수 대략 파악.'},{score:3,desc:'시간대별 회전율 집계. 유휴 구간 파악.'},{score:4,desc:'회전율 목표 설정. 예약·웨이팅 시스템 연동.'},{score:5,desc:'AI 기반 좌석 최적화. 회전율 업계 최고 수준.'}], ai_trigger:{threshold:2,warning:'table_turnover_low'} },
        { id:'rt_2_2', label:'1인당 매출액(Labor Efficiency)', type:'bars', question:'총 근무 인원 대비 매출액 및 주방·홀 인력 배치의 적정성을 관리하고 있습니까?', scale:[{score:1,desc:'인당 매출 파악 없음. 인력 배치 감에 의존.'},{score:2,desc:'전체 인건비 비중 파악. 개인별 기여도 없음.'},{score:3,desc:'인당 매출 월 집계. 피크 타임 인력 조정.'},{score:4,desc:'POS 데이터 기반 인력 스케줄 최적화.'},{score:5,desc:'AI 수요 예측 기반 자동 인력 스케줄링.'}], ai_trigger:{threshold:2,warning:'labor_efficiency_low'} },
        { id:'rt_2_3', label:'배달 플랫폼 운영 효율', type:'bars', question:'배달 매출 비중과 플랫폼 수수료·광고비·배달비를 제외한 실질 수익률을 관리하고 있습니까?', scale:[{score:1,desc:'배달 수익률 파악 없음. 매출만 집계.'},{score:2,desc:'수수료만 파악. 광고비·배달비 미포함.'},{score:3,desc:'배달 실질 수익률 분기 산출.'},{score:4,desc:'채널별 실질 수익률 월 관리. 적자 채널 조정.'},{score:5,desc:'배달·홀·포장 채널별 CM 실시간 최적화.'}], ai_trigger:{threshold:2,warning:'delivery_margin_blind'} },
        { id:'rt_2_4', label:'주방 동선·조리 표준화', type:'bars', question:'조리 리드타임(주문~서빙) 단축을 위한 동선 최적화 및 키친 보드 활용도를 갖추고 있습니까?', scale:[{score:1,desc:'동선 최적화 없음. 조리 혼선 빈번.'},{score:2,desc:'기본 동선 설계. 표준 조리 시간 없음.'},{score:3,desc:'조리 표준 시간 설정. 키친 보드 운영.'},{score:4,desc:'동선 최적화 완료. 주문~서빙 목표 시간 관리.'},{score:5,desc:'스마트 키친 시스템. 조리 리드타임 자동 최적화.'}], ai_trigger:{threshold:2,warning:'kitchen_workflow_poor'} },
      ]
    },
    {
      id: 'rest_cx',
      label: '고객 경험 및 마케팅 자산',
      icon: '⭐',
      items: [
        { id:'rt_3_1', label:'재방문 및 충성도(Retention)', type:'bars', question:'포인트 적립 데이터 등을 활용한 단골 고객 비중 및 재방문 주기 관리를 하고 있습니까?', scale:[{score:1,desc:'재방문율 측정 없음. 단골 감으로 파악.'},{score:2,desc:'포인트 적립 운영. 재방문율 미집계.'},{score:3,desc:'CRM 기반 재방문율 집계. 단골 고객 세그먼트.'},{score:4,desc:'재방문 유도 자동화 캠페인 운영.'},{score:5,desc:'AI 기반 재방문 예측. 개인화 프로모션 자동 발송.'}], ai_trigger:{threshold:2,warning:'retention_not_tracked'} },
        { id:'rt_3_2', label:'플레이스·리뷰 영토권', type:'bars', question:'네이버 플레이스 순위·리뷰 평점 관리 및 고객 불만(VOC)에 대한 피드백 속도를 갖추고 있습니까?', scale:[{score:1,desc:'플레이스 관리 없음. 리뷰 방치.'},{score:2,desc:'기본 등록. 리뷰 간헐적 확인.'},{score:3,desc:'리뷰 48시간 내 답글. 평점 4.0 유지.'},{score:4,desc:'플레이스 상위 3위. 리뷰 실시간 모니터링.'},{score:5,desc:'플레이스 1위 고정. AI 감성 분석 기반 평판 관리.'}], ai_trigger:{threshold:2,warning:'place_review_weak'} },
        { id:'rt_3_3', label:'디지털 침투력', type:'bars', question:'인스타그램·당근마켓 지역 광고 활용도 및 오프라인 방문 전환 추적 여부를 관리하고 있습니까?', scale:[{score:1,desc:'SNS 없음. 디지털 마케팅 전무.'},{score:2,desc:'SNS 계정 보유. 비정기 업데이트.'},{score:3,desc:'주 1회 콘텐츠 업데이트. 방문 전환 일부 추적.'},{score:4,desc:'콘텐츠 캘린더 + 지역 광고 ROAS 관리.'},{score:5,desc:'AI 콘텐츠 자동화. 방문 전환율 실시간 최적화.'}], ai_trigger:{threshold:2,warning:'digital_penetration_low'} },
        { id:'rt_3_4', label:'매장 위생·분위기', type:'bars', question:'식약처 위생등급제 인증 여부 및 매장 청결·인테리어 노후도에 따른 고객 선호도를 관리합니까?', scale:[{score:1,desc:'위생등급 없음. 위생 관리 최소 수준.'},{score:2,desc:'기본 위생 준수. 인테리어 노후화.'},{score:3,desc:'위생등급 인증. 정기 청결 점검.'},{score:4,desc:'위생등급 우수. 인테리어 주기적 리뉴얼.'},{score:5,desc:'위생 최우수 + 브랜드 인테리어 일관성 완성.'}], ai_trigger:{threshold:2,warning:'hygiene_ambiance_poor'} },
      ]
    },
    {
      id: 'rest_finance',
      label: '재무 건전성 및 입지 전략',
      icon: '💰',
      items: [
        { id:'rt_4_1', label:'고정비(임대료) 적정성', type:'bars', question:'매출액 대비 임대료 비중(기준치 10~15% 이하 유지 여부)을 관리하고 있습니까?', scale:[{score:1,desc:'임대료 비중 파악 없음. 임대료 부담 인지 못함.'},{score:2,desc:'임대료 비중 대략 파악. 최적화 없음.'},{score:3,desc:'임대료 비중 월 관리. 15% 이하 목표.'},{score:4,desc:'임대료 비중 10% 이하 유지. 재계약 협상력 보유.'},{score:5,desc:'임대료 최적화 완료. 매출 대비 고정비 업계 최저 수준.'}], ai_trigger:{threshold:2,warning:'rent_ratio_high'} },
        { id:'rt_4_2', label:'손익분기점(BEP) 관리', type:'bars', question:'일평균 목표 매출액 인지 여부 및 일일 정산 데이터의 정교함을 갖추고 있습니까?', scale:[{score:1,desc:'BEP 모름. 흑적자 직감으로 판단.'},{score:2,desc:'월 BEP 대략 파악. 일별 관리 없음.'},{score:3,desc:'일 BEP 산출. POS 일 마감 데이터 활용.'},{score:4,desc:'일 BEP 실시간 모니터링. 목표 미달 시 즉각 조치.'},{score:5,desc:'BEP 자동 재산출 시스템. 고정비 변동 즉각 반영.'}], ai_trigger:{threshold:2,warning:'bep_unknown'} },
        { id:'rt_4_3', label:'자금 조달 및 부채 관리', type:'bars', question:'고금리 일수·사채 이용 여부 및 정부 지원 소상공인 정책 자금 활용 현황을 갖추고 있습니까?', scale:[{score:1,desc:'사채·일수 이용 중. 정책 자금 인지 없음.'},{score:2,desc:'정책 자금 인지. 신청 경험 없음.'},{score:3,desc:'소상공인 정책 자금 활용. 금리 부담 최소화.'},{score:4,desc:'정책 자금 포트폴리오 최적화. 대출 구조 건전.'},{score:5,desc:'정책 자금 최대 활용. 부채 구조 완전 건전화.'}], ai_trigger:{threshold:2,warning:'debt_structure_risky'} },
        { id:'rt_4_4', label:'상권 변화 대응력', type:'bars', question:'주변 경쟁 업체 진입 현황 및 상권 이동에 따른 메뉴 리뉴얼·업종 변경 준비 상태를 갖추고 있습니까?', scale:[{score:1,desc:'상권 변화 모니터링 없음. 경쟁 진입 무방비.'},{score:2,desc:'경쟁 업체 진입 인지. 대응 계획 없음.'},{score:3,desc:'분기 상권 분석. 메뉴 리뉴얼 계획 보유.'},{score:4,desc:'상권 변화 즉각 대응. 메뉴·마케팅 신속 조정.'},{score:5,desc:'상권 데이터 실시간 모니터링. 선제적 업종 전환 전략.'}], ai_trigger:{threshold:2,warning:'market_change_blind'} },
      ]
    },
  ],
  ai_analysis: [
    { trigger:'delivery_margin_blind+food_cost_unmanaged', level:'CRITICAL', msg:'배달 매출 비중이 70% 이상인데 영업이익률이 5% 미만이라면 플랫폼만 돈 벌어주는 구조입니다. 포장 유도 마케팅과 배달 전용 메뉴 가격 차별화를 처방합니다.' },
    { trigger:'food_waste_high+menu_mix_unanalyzed', level:'HIGH', msg:'식재료비 비중은 높은데 메뉴 가짓수가 너무 많다면 식자재 로스가 원인입니다. 메뉴를 통폐합(ABC 분석)하여 식자재 회전율을 높일 것을 제안합니다.' },
    { trigger:'table_turnover_low+labor_efficiency_low', level:'HIGH', msg:'피크 타임에 회전율이 낮은데 인건비 비중이 높다면 서빙 로봇 도입이나 키오스크 전환을 통한 고정비 절감 전략을 수립합니다.' },
  ],
};
if (typeof window !== 'undefined') window.INDUSTRY_RESTAURANT = INDUSTRY_RESTAURANT;
if (typeof module !== 'undefined') module.exports = INDUSTRY_RESTAURANT;
