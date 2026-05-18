const INDUSTRY_LOCAL_SERVICE = {
  id: 'local_service',
  label: '생활밀착형 서비스업',
  icon: '✂️',
  description: '미용실·헬스장·학원·수리 서비스·세탁 서비스. 지역 기반 영업이 주를 이루며 원장(대표) 1인 역량 의존도가 매우 높음.',
  areas: [
    {
      id: 'ls_standard',
      label: '서비스 표준 및 시스템화',
      icon: '📋',
      items: [
        { id:'ls_1_1', label:'서비스 매뉴얼(SOP) 보유', type:'bars', question:'접객 응대·클레임 처리·시술/강의 프로세스가 문서화되어 있으며 신규 직원이 독립 수행 가능합니까?', scale:[{score:1,desc:'SOP 전무. 대표 구두 전달에만 의존.'},{score:2,desc:'일부 텍스트 메모 수준. 체계화 없음.'},{score:3,desc:'주요 서비스 SOP 문서화. 신규 직원 교육 활용.'},{score:4,desc:'동영상 SOP + QR코드 현장 부착. 자기 학습 가능.'},{score:5,desc:'LMS 연동 SOP. 이수율 자동 추적 + 숙련도 평가.'}], ai_trigger:{threshold:2,warning:'sop_missing'} },
        { id:'ls_1_2', label:'예약·고객 데이터 관리(CRM)', type:'bars', question:'단순 장부나 카톡 예약이 아닌 전문 CRM 솔루션을 통한 데이터 축적 여부를 갖추고 있습니까?', scale:[{score:1,desc:'수기 장부 또는 카톡 예약만 사용.'},{score:2,desc:'네이버 예약 등 기본 플랫폼 활용. 데이터 미축적.'},{score:3,desc:'CRM 솔루션 도입. 고객 기본 데이터 축적.'},{score:4,desc:'CRM 기반 재방문 유도 자동화 운영.'},{score:5,desc:'CRM + 마케팅 자동화 통합. 고객 생애 가치 최적화.'}], ai_trigger:{threshold:2,warning:'crm_not_used'} },
        { id:'ls_1_3', label:'공간·시설 가동 효율', type:'bars', question:'영업시간 내 유휴 체어/룸/장비 비중 및 평당 매출액 데이터를 파악하고 있습니까?', scale:[{score:1,desc:'가동률 개념 없음. 유휴 공간 방치.'},{score:2,desc:'피크 타임만 파악. 유휴 시간 관리 없음.'},{score:3,desc:'시간대별 가동률 집계. 유휴 구간 파악.'},{score:4,desc:'유휴 시간 활용 프로그램 운영. 가동률 80% 이상.'},{score:5,desc:'AI 기반 예약 최적화. 가동률 90% 이상 유지.'}], ai_trigger:{threshold:2,warning:'space_utilization_low'} },
        { id:'ls_1_4', label:'결제·정산 투명성', type:'bars', question:'카드/현금/포인트 결제 비중 및 일일 정산 시간 단축 정도를 관리하고 있습니까?', scale:[{score:1,desc:'현금 위주. 정산 불투명.'},{score:2,desc:'카드 단말기 보유. 정산 수기 처리.'},{score:3,desc:'결제 수단별 일 마감 정산. 데이터 보관.'},{score:4,desc:'POS 자동 정산. 결제 비중 실시간 확인.'},{score:5,desc:'클라우드 POS + 자동 세무 연동. 정산 완전 자동화.'}], ai_trigger:{threshold:2,warning:'payment_transparency_low'} },
      ]
    },
    {
      id: 'ls_relationship',
      label: '고객 관계 및 재방문 로직',
      icon: '❤️',
      items: [
        { id:'ls_2_1', label:'재방문율(Retention)', type:'bars', question:'첫 방문 고객이 3개월 내 재방문하는 비율 및 이탈 고객 추적 관리 여부를 파악하고 있습니까?', scale:[{score:1,desc:'재방문율 측정 없음. 단골 감으로만 파악.'},{score:2,desc:'대략적인 재방문 빈도 인지. 데이터 없음.'},{score:3,desc:'CRM 기반 재방문율 집계. 목표 설정.'},{score:4,desc:'이탈 고객 자동 감지 + 재활성화 캠페인 가동.'},{score:5,desc:'재방문율 실시간 대시보드. AI 이탈 예측 + 선제 대응.'}], ai_trigger:{threshold:2,warning:'retention_untracked'} },
        { id:'ls_2_2', label:'고객 생애 가치(LTV)', type:'bars', question:'1인당 객단가 및 회원권(선결제) 구매 비중을 통한 현금 흐름 확보 상태를 관리하고 있습니까?', scale:[{score:1,desc:'LTV 개념 없음. 객단가만 대략 파악.'},{score:2,desc:'평균 객단가 파악. LTV 산출 없음.'},{score:3,desc:'LTV 분기 산출. 회원권 판매 비중 관리.'},{score:4,desc:'LTV 기반 등급제 운영. 회원권 현금흐름 최적화.'},{score:5,desc:'LTV 실시간 추적. 고객별 맞춤 상품 자동 추천.'}], ai_trigger:{threshold:2,warning:'ltv_unmanaged'} },
        { id:'ls_2_3', label:'노쇼(No-Show) 리스크', type:'bars', question:'예약 부도율과 이를 방지하기 위한 선입금/알림톡 시스템 가동 여부를 관리하고 있습니까?', scale:[{score:1,desc:'노쇼 관리 없음. 피해 그대로 수용.'},{score:2,desc:'노쇼 발생 인지. 대응 체계 없음.'},{score:3,desc:'알림톡 자동 발송. 노쇼율 월 집계.'},{score:4,desc:'선입금 시스템 + 알림톡으로 노쇼율 5% 이하.'},{score:5,desc:'노쇼 예측 AI + 자동 대기자 연결 체계.'}], ai_trigger:{threshold:2,warning:'noshow_risk_high'} },
        { id:'ls_2_4', label:'고객 피드백(VOC) 대응', type:'bars', question:'현장 불만 사항을 즉시 수집하고 개선에 반영하는 루프(Loop)를 보유하고 있습니까?', scale:[{score:1,desc:'VOC 수집 없음. 불만 발생 후 수습.'},{score:2,desc:'구두 불만 청취. 기록·개선 없음.'},{score:3,desc:'VOC 수집 체계 보유. 월 단위 개선 반영.'},{score:4,desc:'VOC 실시간 수집 + 즉각 대응 프로세스.'},{score:5,desc:'VOC 자동 분류 + AI 개선안 제안 + 반영 추적.'}], ai_trigger:{threshold:2,warning:'voc_loop_missing'} },
      ]
    },
    {
      id: 'ls_marketing',
      label: '마케팅 침투 및 로컬 영향력',
      icon: '📍',
      items: [
        { id:'ls_3_1', label:'네이버 플레이스·지도 최적화', type:'bars', question:'지역 키워드 검색 시 상위 노출 여부 및 저장하기·리뷰 수의 증가세를 관리하고 있습니까?', scale:[{score:1,desc:'플레이스 등록 없음. 온라인 노출 전무.'},{score:2,desc:'기본 등록. 키워드·리뷰 관리 없음.'},{score:3,desc:'타겟 키워드 상위 노출. 리뷰 정기 관리.'},{score:4,desc:'플레이스 상위 3위 유지. 저장하기 증가세.'},{score:5,desc:'플레이스 1위 고정. 요즘뜨는 필터 상시 노출.'}], ai_trigger:{threshold:2,warning:'place_optimization_weak'} },
        { id:'ls_3_2', label:'SNS 콘텐츠·바이럴', type:'bars', question:'인스타그램·당근마켓 지역 광고 집행 효율 및 실제 방문 전환율을 추적하고 있습니까?', scale:[{score:1,desc:'SNS 없음. 온라인 마케팅 전무.'},{score:2,desc:'SNS 계정 보유. 비정기 업데이트.'},{score:3,desc:'주 1회 이상 콘텐츠 업데이트. 방문 전환 일부 추적.'},{score:4,desc:'콘텐츠 캘린더 운영. 방문 전환율 측정.'},{score:5,desc:'AI 콘텐츠 자동화. 방문 전환율 업계 최고 수준.'}], ai_trigger:{threshold:2,warning:'sns_content_weak'} },
        { id:'ls_3_3', label:'평판·리뷰 관리', type:'bars', question:'부정 리뷰에 대한 대응 속도 및 평점 관리의 전략적 접근성을 갖추고 있습니까?', scale:[{score:1,desc:'리뷰 관리 없음. 부정 리뷰 방치.'},{score:2,desc:'긍정 리뷰만 확인. 부정 리뷰 무응답.'},{score:3,desc:'전체 리뷰 48시간 내 답글. 평점 4.0 유지.'},{score:4,desc:'리뷰 실시간 모니터링. 부정 리뷰 즉각 대응.'},{score:5,desc:'NLP 감성 분석 + 평판 리스크 조기 경보 체계.'}], ai_trigger:{threshold:2,warning:'review_reputation_weak'} },
        { id:'ls_3_4', label:'지역 커뮤니티 결속력', type:'bars', question:'지역 맘카페·아파트 단지 협약 등 오프라인 네트워크 확보 수준을 갖추고 있습니까?', scale:[{score:1,desc:'지역 커뮤니티 활동 없음.'},{score:2,desc:'맘카페 가끔 활용. 체계 없음.'},{score:3,desc:'지역 커뮤니티 정기 활동. 인지도 확보.'},{score:4,desc:'아파트 단지 협약 + 지역 행사 참여.'},{score:5,desc:'지역 커뮤니티 허브 포지셔닝. 자발적 추천 네트워크.'}], ai_trigger:{threshold:2,warning:'community_network_weak'} },
      ]
    },
    {
      id: 'ls_finance',
      label: '인적 역량 및 수익 관리',
      icon: '💰',
      items: [
        { id:'ls_4_1', label:'직원 이탈률·숙련도', type:'bars', question:'핵심 인력의 평균 근속연수 및 이탈 시 단골 고객 유실 방지 대책을 보유하고 있습니까?', scale:[{score:1,desc:'이탈률 관리 없음. 핵심 직원 이탈 시 무방비.'},{score:2,desc:'이탈률 파악. 대응 체계 없음.'},{score:3,desc:'핵심 인력 인수인계 프로토콜 보유.'},{score:4,desc:'근속 인센티브 + 고객 인수인계 체계 가동.'},{score:5,desc:'이직률 0% 유지 체계. 고객 유실 방지 완성.'}], ai_trigger:{threshold:2,warning:'staff_turnover_high'} },
        { id:'ls_4_2', label:'인건비 대비 매출 기여도', type:'bars', question:'직원 1인당 월간 매출 달성률 및 성과급(인센티브) 구조의 합리성을 관리하고 있습니까?', scale:[{score:1,desc:'인당 매출 기여도 파악 없음.'},{score:2,desc:'전체 인건비 비중만 파악. 개인별 분석 없음.'},{score:3,desc:'직원별 매출 기여도 월 집계.'},{score:4,desc:'기여도 기반 성과급 체계 운영.'},{score:5,desc:'실시간 인당 매출 대시보드. 자동 인센티브 산출.'}], ai_trigger:{threshold:2,warning:'staff_productivity_untracked'} },
        { id:'ls_4_3', label:'고정비(임대료·관리비) 비중', type:'bars', question:'매출액 대비 고정비 비중과 손익분기점(BEP) 도달을 위한 최소 고객 수 파악 여부를 확인합니까?', scale:[{score:1,desc:'고정비 비중 파악 없음. BEP 모름.'},{score:2,desc:'임대료만 파악. BEP 미산출.'},{score:3,desc:'전체 고정비 집계. BEP 월 단위 산출.'},{score:4,desc:'고정비 비중 30% 이하 관리. BEP 일 단위 추적.'},{score:5,desc:'고정비 최적화 완료. BEP 자동 모니터링.'}], ai_trigger:{threshold:2,warning:'fixed_cost_unmanaged'} },
        { id:'ls_4_4', label:'서비스 차별화 포인트', type:'bars', question:'경쟁사 대비 독보적인 시그니처 메뉴·프로그램 보유 여부 및 가격 경쟁력을 갖추고 있습니까?', scale:[{score:1,desc:'차별화 없음. 가격 경쟁만 가능.'},{score:2,desc:'일부 차별화 시도. 고객 인지도 낮음.'},{score:3,desc:'시그니처 서비스 보유. 지역 내 인지도 확보.'},{score:4,desc:'독보적 시그니처 + 프리미엄 가격 적용.'},{score:5,desc:'업계 표준 시그니처로 자리매김. 가격 결정력 보유.'}], ai_trigger:{threshold:2,warning:'differentiation_weak'} },
      ]
    },
  ],
  ai_analysis: [
    { trigger:'crm_not_used+retention_untracked', level:'CRITICAL', msg:'예약 시스템 활용도는 높은데 재방문율이 낮다면 마케팅은 성공했으나 현장 서비스 품질에 심각한 문제가 있습니다.' },
    { trigger:'ltv_unmanaged+fixed_cost_unmanaged', level:'HIGH', msg:'회원권 비중이 너무 높으면 미래 매출을 미리 당겨 쓴 것입니다. 신규 유료 서비스 도입을 통한 추가 객단가 상승 전략을 제시합니다.' },
    { trigger:'place_optimization_weak+review_reputation_weak', level:'HIGH', msg:'네이버 지도 노출은 잘되는데 리뷰 평점이 낮다면 노출될수록 악명이 퍼지는 상황입니다. 마케팅을 일시 중단하고 내부 품질 개선부터 처방합니다.' },
  ],
};

if (typeof window !== 'undefined') window.INDUSTRY_LOCAL_SERVICE = INDUSTRY_LOCAL_SERVICE;
if (typeof module !== 'undefined') module.exports = INDUSTRY_LOCAL_SERVICE;
