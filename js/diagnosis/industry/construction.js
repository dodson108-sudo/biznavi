const INDUSTRY_CONSTRUCTION = {
  id: 'construction',
  label: '소규모 건설 및 인테리어',
  icon: '🏗️',
  description: '실내 인테리어·냉난방 설비 공사·유지보수 업체. 수주 기반 사업이며 현장별 실행 예산 관리 부재로 매출은 발생하나 손실이 빈번함.',
  areas: [
    {
      id: 'con_budget',
      label: '실행 예산 및 원가 통제',
      icon: '💰',
      items: [
        { id:'cn_1_1', label:'실행 예산 편성 유무', type:'bars', question:'착공 전 재료비·노무비·외주비를 상세히 나눈 실행 예산서를 작성하고 있습니까?', scale:[{score:1,desc:'실행 예산 없음. 견적서만 보유.'},{score:2,desc:'대략적인 공종별 예산. 세부 항목 없음.'},{score:3,desc:'재료비·노무비·외주비 3분류 실행 예산서 보유.'},{score:4,desc:'공정별 세부 실행 예산. 변경 시 즉각 반영.'},{score:5,desc:'디지털 실행 예산 시스템. 실시간 예산 vs 실지출 비교.'}], ai_trigger:{threshold:2,warning:'execution_budget_missing'} },
        { id:'cn_1_2', label:'예산 대비 실지출 관리', type:'bars', question:'공정별 투입 비용을 실시간(또는 주 단위)으로 집계하여 예산 초과 여부를 감시하는 체계를 보유하고 있습니까?', scale:[{score:1,desc:'실지출 추적 없음. 완공 후 손익 파악.'},{score:2,desc:'월 단위 비용 집계. 공정별 분리 없음.'},{score:3,desc:'주 단위 공정별 실지출 집계. 초과 시 인지.'},{score:4,desc:'실지출 실시간 집계. 예산 초과 즉각 경보.'},{score:5,desc:'모바일 현장 정산 툴. 예산 vs 실지출 자동 비교.'}], ai_trigger:{threshold:2,warning:'cost_tracking_missing'} },
        { id:'cn_1_3', label:'자재 소싱 및 단가 관리', type:'bars', question:'주요 자재의 직거래 비중 및 단가 변동에 따른 계약 변경 협상력을 보유하고 있습니까?', scale:[{score:1,desc:'자재 단가 관리 없음. 제시가 그대로 수용.'},{score:2,desc:'주요 자재 단가 파악. 협상 없음.'},{score:3,desc:'복수 공급처 비교 견적. 주요 자재 직거래.'},{score:4,desc:'자재 단가 DB 보유. 변동 시 즉각 협상.'},{score:5,desc:'자재 공급처 포트폴리오 최적화. 단가 변동 자동 추적.'}], ai_trigger:{threshold:2,warning:'material_sourcing_weak'} },
        { id:'cn_1_4', label:'공구·장비 관리', type:'bars', question:'자사 소유 장비의 가동률 및 렌탈 장비 비용의 효율적 관리 여부를 갖추고 있습니까?', scale:[{score:1,desc:'장비 관리 없음. 렌탈 비용 파악 불가.'},{score:2,desc:'보유 장비 목록 존재. 가동률 미파악.'},{score:3,desc:'장비별 가동률 집계. 렌탈 vs 구매 비용 비교.'},{score:4,desc:'장비 가동률 최적화. 유휴 장비 렌탈 수익 전환.'},{score:5,desc:'장비 IoT 관리. 가동률·유지보수 자동 추적.'}], ai_trigger:{threshold:2,warning:'equipment_management_weak'} },
      ]
    },
    {
      id: 'con_site',
      label: '공정 관리 및 현장 운영',
      icon: '🏛️',
      items: [
        { id:'cn_2_1', label:'공기(Schedule) 준수율', type:'bars', question:'계획된 준공일 대비 실제 완공일의 오차 및 공기 지연 시 지체상금 리스크 관리 수준을 갖추고 있습니까?', scale:[{score:1,desc:'공정 계획 없음. 공기 지연 빈번.'},{score:2,desc:'대략적 공정표 보유. 지연 관리 없음.'},{score:3,desc:'상세 공정표 운영. 지연 시 원인 분석.'},{score:4,desc:'공기 준수율 90% 이상. 지체상금 리스크 최소화.'},{score:5,desc:'디지털 공정 관리. 지연 예측 + 선제 대응 체계.'}], ai_trigger:{threshold:2,warning:'schedule_overrun_frequent'} },
        { id:'cn_2_2', label:'외주·노무 파트너십', type:'bars', question:'숙련된 팀과의 전속 계약 및 협력사 기성금 지급의 투명성을 갖추고 있습니까?', scale:[{score:1,desc:'외주 관리 없음. 매번 새 인력 수배.'},{score:2,desc:'단골 외주 있으나 계약 없음. 기성 지급 임의.'},{score:3,desc:'주요 협력사 계약 체결. 기성 지급 기준 문서화.'},{score:4,desc:'협력사 등급제 운영. 기성 자동 정산 체계.'},{score:5,desc:'전속 협력사 네트워크 완성. 품질·납기 보증 체계.'}], ai_trigger:{threshold:2,warning:'subcontractor_unmanaged'} },
        { id:'cn_2_3', label:'현장 기록·데이터화', type:'bars', question:'일일 작업 일지·공정별 사진 기록·설계 변경 이력의 디지털 보관 수준을 갖추고 있습니까?', scale:[{score:1,desc:'현장 기록 없음. 분쟁 시 증빙 불가.'},{score:2,desc:'수기 일지 작성. 사진 기록 없음.'},{score:3,desc:'일지 + 공정 사진 정기 기록. 클라우드 보관.'},{score:4,desc:'현장 기록 디지털화. 설계 변경 이력 완전 보관.'},{score:5,desc:'현장 기록 자동화. AI 기반 공정 분석 + 하자 예측.'}], ai_trigger:{threshold:2,warning:'site_record_missing'} },
        { id:'cn_2_4', label:'안전·현장 리스크', type:'bars', question:'안전 관리비 집행 및 중대재해 예방을 위한 현장 점검 주기와 대응 체계를 갖추고 있습니까?', scale:[{score:1,desc:'안전 관리 형식적. 점검 없음.'},{score:2,desc:'법정 안전 교육만 실시. 현장 점검 없음.'},{score:3,desc:'주간 안전 점검 실시. 위험 요소 기록.'},{score:4,desc:'일일 안전 점검 + 즉각 조치 체계.'},{score:5,desc:'중대재해법 완전 준수. 스마트 안전 관리 시스템.'}], ai_trigger:{threshold:2,warning:'safety_risk_high'} },
      ]
    },
    {
      id: 'con_sales',
      label: '수주 경쟁력 및 고객 관리',
      icon: '🤝',
      items: [
        { id:'cn_3_1', label:'견적 산출 정교함', type:'bars', question:'과거 데이터를 기반으로 한 적정 견적 산출 능력 및 경쟁 입찰 승률(Win Rate)을 관리하고 있습니까?', scale:[{score:1,desc:'견적 감으로만 산출. Win Rate 파악 없음.'},{score:2,desc:'경험 기반 견적. Win Rate 대략 파악.'},{score:3,desc:'과거 데이터 기반 견적. Win Rate 집계.'},{score:4,desc:'견적 정확도 95% 이상. Win Rate 50% 이상.'},{score:5,desc:'AI 기반 견적 자동화. Win Rate 70% 이상 달성.'}], ai_trigger:{threshold:2,warning:'estimate_inaccurate'} },
        { id:'cn_3_2', label:'포트폴리오·브랜드력', type:'bars', question:'주력 공종의 전문성을 보여주는 시공 사례 보유 수준을 갖추고 있습니까?', scale:[{score:1,desc:'포트폴리오 없음. 레퍼런스 제시 불가.'},{score:2,desc:'소수 사례 보유. 전문성 미부각.'},{score:3,desc:'주력 공종 레퍼런스 5건 이상. 고화질 사진 보유.'},{score:4,desc:'대형 레퍼런스 + 고객 추천사. 온라인 노출 완료.'},{score:5,desc:'업계 표준 레퍼런스. 고객이 먼저 찾아오는 구조.'}], ai_trigger:{threshold:2,warning:'portfolio_weak'} },
        { id:'cn_3_3', label:'고객 만족·추천(Referral)', type:'bars', question:'준공 후 고객 만족도 및 소개를 통한 신규 수주 비중을 관리하고 있습니까?', scale:[{score:1,desc:'준공 후 고객 연락 없음. 추천 없음.'},{score:2,desc:'간헐적 사후 관리. 추천 비중 파악 없음.'},{score:3,desc:'준공 후 만족도 조사. 추천 비중 집계.'},{score:4,desc:'추천 수주 비중 40% 이상. 체계적 사후 관리.'},{score:5,desc:'추천 수주 60% 이상. 자동 레퍼럴 프로그램 운영.'}], ai_trigger:{threshold:2,warning:'referral_low'} },
        { id:'cn_3_4', label:'하자보수(AS) 관리', type:'bars', question:'하자 발생률 및 신속한 AS 대응을 통한 고객 신뢰 유지 체계를 갖추고 있습니까?', scale:[{score:1,desc:'AS 체계 없음. 하자 발생 시 회피.'},{score:2,desc:'AS 대응은 하나 기준·기록 없음.'},{score:3,desc:'하자 유형별 AS 기준 보유. 처리 이력 관리.'},{score:4,desc:'AS 24시간 내 대응. 하자율 2% 이하.'},{score:5,desc:'AS 자동화. 하자율 0% 목표 달성 체계.'}], ai_trigger:{threshold:2,warning:'as_management_weak'} },
      ]
    },
    {
      id: 'con_finance',
      label: '자금 흐름 및 계약 리스크',
      icon: '💹',
      items: [
        { id:'cn_4_1', label:'기성금·미수금 관리', type:'bars', question:'공정률에 따른 기성 청구 적정성 및 장기 미수금 회수 프로세스 가동 상태를 확인합니까?', scale:[{score:1,desc:'기성 청구 기준 없음. 미수금 방치.'},{score:2,desc:'완공 후 일괄 청구. 미수금 관리 없음.'},{score:3,desc:'공정률 기반 기성 청구. 미수금 월 집계.'},{score:4,desc:'기성 청구 자동화. 미수금 회수 프로세스 가동.'},{score:5,desc:'기성·미수금 실시간 관리. 자동 독촉 + 법적 대응 체계.'}], ai_trigger:{threshold:2,warning:'receivables_unmanaged'} },
        { id:'cn_4_2', label:'현금 회전율', type:'bars', question:'원자재·노무비 선지출과 기성금 유입 사이의 자금 공백 대응 능력을 보유하고 있습니까?', scale:[{score:1,desc:'자금 공백 인지 없음. 유동성 위기 빈번.'},{score:2,desc:'자금 공백 인지. 대응 방법 없음.'},{score:3,desc:'자금 공백 예측. 단기 대출로 대응.'},{score:4,desc:'기성 일정 최적화로 자금 공백 최소화.'},{score:5,desc:'현금흐름 시뮬레이션. 자금 공백 0 달성 체계.'}], ai_trigger:{threshold:2,warning:'cash_gap_unmanaged'} },
        { id:'cn_4_3', label:'계약서 법적 보호', type:'bars', question:'설계 변경 시 추가 비용 청구 근거 및 하자 담보 책임 기간의 명확한 정의 여부를 갖추고 있습니까?', scale:[{score:1,desc:'표준 계약서 없음. 구두 계약 위주.'},{score:2,desc:'기본 계약서 사용. 변경·하자 조항 미비.'},{score:3,desc:'표준 계약서 사용. 주요 조항 포함.'},{score:4,desc:'변경·하자·지체상금 전 조항 완비.'},{score:5,desc:'법률 검토 완료 계약서. 분쟁 발생 시 완전 보호 체계.'}], ai_trigger:{threshold:2,warning:'contract_protection_weak'} },
        { id:'cn_4_4', label:'정부·민간 수주 비중', type:'bars', question:'공공 공사와 민간 공사의 매출 균형 및 안정적 매출처 확보 수준을 갖추고 있습니까?', scale:[{score:1,desc:'단일 수주처 의존. 매출 변동성 극심.'},{score:2,desc:'민간 위주. 공공 수주 경험 없음.'},{score:3,desc:'공공·민간 균형 시도. 나라장터 등록 완료.'},{score:4,desc:'공공 매출 30% 이상. 안정적 현금흐름 확보.'},{score:5,desc:'공공·민간 최적 포트폴리오. 연간 수주 계획 완성.'}], ai_trigger:{threshold:2,warning:'revenue_source_concentrated'} },
      ]
    },
  ],
  ai_analysis: [
    { trigger:'execution_budget_missing+cost_tracking_missing', level:'CRITICAL', msg:'실행 예산서는 있으나 실지출 관리가 안 된다면 현장 소장의 재량에 따라 이익이 증발하고 있는 상황입니다. 모바일 기반 현장 정산 툴 도입을 처방합니다.' },
    { trigger:'schedule_overrun_frequent+subcontractor_unmanaged', level:'HIGH', msg:'공기 지연율은 높은데 외주 의존도가 높다면 협력사 통제력이 상실된 상태입니다. 직영팀 비중 확대나 협력사 평가제 도입을 제안합니다.' },
    { trigger:'receivables_unmanaged+contract_protection_weak', level:'HIGH', msg:'미수금 비중이 높은데 계약서에 설계 변경 조항이 미비하다면 법적 대응력을 높이는 표준 계약서 도입과 유치권 행사 등 리스크 관리를 최우선으로 수립합니다.' },
  ],
};
if (typeof window !== 'undefined') window.INDUSTRY_CONSTRUCTION = INDUSTRY_CONSTRUCTION;
if (typeof module !== 'undefined') module.exports = INDUSTRY_CONSTRUCTION;
