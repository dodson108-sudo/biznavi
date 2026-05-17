const INDUSTRY_LOGISTICS = {
  id: 'logistics',
  label: '물류·운송업',
  icon: '🚚',
  description: '택배·화물운송·3PL 풀필먼트·퀵서비스·창고임대. 차량/창고 가동률이 수익성을 좌우하며 배송 정확성과 속도가 고객 신뢰를 결정함.',
  areas: [
    {
      id: 'log_quality',
      label: '배송 품질 및 정확성',
      icon: '📦',
      items: [
        { id:'log_1_1', label:'주문 완번 이행률(Perfect Order Rate)', type:'bars', question:'정확한 상품을 정확한 수량으로 손상 없이 약속된 시간에 배송한 비율을 오배송률·파손률·지연률로 분리 추적하는 체계가 있습니까?', scale:[{score:1,desc:'추적 체계 없음. 클레임 발생 후에야 파악.'},{score:2,desc:'전체 배송 완료율만 집계. 항목별 분리 없음.'},{score:3,desc:'오배송·파손·지연을 월 단위로 분리 집계.'},{score:4,desc:'실시간 Perfect Order Rate 대시보드 운영.'},{score:5,desc:'항목별 원인 자동 분류 + 즉각 개선 루프 가동.'}], ai_trigger:{threshold:2,warning:'perfect_order_low'} },
        { id:'log_1_2', label:'배송 SLA 준수율', type:'bars', question:'고객사와 합의한 배송 기한 준수 비율 및 SLA 미달 시 페널티 발생 현황과 대응 체계가 구축되어 있습니까?', scale:[{score:1,desc:'SLA 개념 없음. 배송 기한 구두 약속만 존재.'},{score:2,desc:'SLA 계약은 있으나 준수율 미측정.'},{score:3,desc:'월 단위 SLA 준수율 집계. 미달 시 원인 파악.'},{score:4,desc:'실시간 SLA 모니터링. 미달 예측 시 선제 조치.'},{score:5,desc:'AI 기반 배송 지연 예측 + 자동 고객 알림 + 페널티 최소화 체계.'}], ai_trigger:{threshold:2,warning:'sla_breach'} },
        { id:'log_1_3', label:'반품·역물류 처리 속도', type:'bars', question:'반품 수거 요청부터 검수·재입고까지의 평균 소요 시간 및 반품 사유 분석을 통한 근본 원인 제거 노력이 있습니까?', scale:[{score:1,desc:'역물류 프로세스 없음. 반품 처리 수동·임시방편.'},{score:2,desc:'반품 수거는 하나 검수·재입고 기준 없음.'},{score:3,desc:'반품 사유 분류 체계 보유. 월 단위 원인 분석.'},{score:4,desc:'반품 수거~재입고 평균 소요 시간 측정·개선 중.'},{score:5,desc:'역물류 전용 시스템. 반품 사유 자동 분류 + 근본 원인 제거 루프.'}], ai_trigger:{threshold:2,warning:'reverse_logistics_slow'} },
        { id:'log_1_4', label:'클레임·사고 대응', type:'bars', question:'분실·파손 클레임 발생 건수 및 보상 처리 속도, 화물 추적(트래킹) 시스템의 실시간 정밀도가 확보되어 있습니까?', scale:[{score:1,desc:'클레임 대응 매뉴얼 없음. 건별 임기응변.'},{score:2,desc:'클레임 접수 대장 보유. 처리 기준 불명확.'},{score:3,desc:'클레임 처리 SOP 존재. 평균 처리 시간 측정.'},{score:4,desc:'실시간 화물 트래킹 + 24시간 내 보상 처리 체계.'},{score:5,desc:'AI 이상 탐지로 사고 예측 + 자동 보상 처리 + 재발 방지 루프.'}], ai_trigger:{threshold:2,warning:'claim_response_weak'} },
      ]
    },
    {
      id: 'log_ops',
      label: '창고·차량 운영 효율',
      icon: '🏭',
      items: [
        { id:'log_2_1', label:'창고 공간 가동률', type:'bars', question:'총 저장 용량 대비 실제 사용 비율 및 피킹·패킹 동선 최적화를 통한 인당 처리량 데이터를 관리하고 있습니까?', scale:[{score:1,desc:'창고 가동률 개념 없음. 공간 낭비 심각.'},{score:2,desc:'대략적인 적재율은 파악. 동선 최적화 없음.'},{score:3,desc:'월 단위 가동률 집계. 피킹 동선 기본 설계.'},{score:4,desc:'인당 처리량 일 단위 측정. 동선 최적화 실행 중.'},{score:5,desc:'WMS 기반 실시간 공간 최적화. 인당 처리량 자동 추적.'}], ai_trigger:{threshold:2,warning:'warehouse_utilization_low'} },
        { id:'log_2_2', label:'차량 가동률 및 공차율', type:'bars', question:'차량별 일일 가동 시간 및 빈 차로 복귀하는 공차 운행 비율을 추적하여 운송 효율을 진단하고 있습니까?', scale:[{score:1,desc:'공차율 개념 없음. 차량 가동 현황 파악 불가.'},{score:2,desc:'차량별 운행 일지 존재. 공차율 미산출.'},{score:3,desc:'공차율 월 단위 집계. 개선 목표 수립.'},{score:4,desc:'TMS로 실시간 차량 위치·공차 구간 추적.'},{score:5,desc:'화물 매칭 플랫폼 연동. 공차율 10% 이하 유지.'}], ai_trigger:{threshold:2,warning:'empty_run_high'} },
        { id:'log_2_3', label:'설비·장비 유지보수', type:'bars', question:'MTBF(평균 고장 간격)와 MTTR(평균 수리 시간) 관리 여부 및 지게차·컨베이어 등 자동화 설비의 예방정비 주기가 체계적으로 운영됩니까?', scale:[{score:1,desc:'고장 발생 후 수리. 예방정비 개념 없음.'},{score:2,desc:'정기 점검 일정은 있으나 MTBF·MTTR 미측정.'},{score:3,desc:'설비별 예방정비 주기 문서화. MTBF 분기 집계.'},{score:4,desc:'MTBF·MTTR 실시간 모니터링. 예방정비 자동 알림.'},{score:5,desc:'IoT 센서 기반 예지보전. 고장 예측 + 부품 자동 발주.'}], ai_trigger:{threshold:2,warning:'maintenance_reactive'} },
        { id:'log_2_4', label:'운송 경로 최적화', type:'bars', question:'TMS(운송관리시스템) 도입 여부 및 매일 변하는 물량에 따른 동적 경로 배정 능력을 보유하고 있습니까?', scale:[{score:1,desc:'기사 경험에만 의존. 경로 최적화 없음.'},{score:2,desc:'고정 경로 운행. 물량 변동 시 수동 조정.'},{score:3,desc:'기본 TMS 도입. 정적 경로 최적화 적용.'},{score:4,desc:'TMS 동적 경로 배정. 실시간 교통·물량 반영.'},{score:5,desc:'AI 기반 동적 경로 최적화. 연료비·시간 동시 최소화.'}], ai_trigger:{threshold:2,warning:'route_optimization_missing'} },
      ]
    },
    {
      id: 'log_hr',
      label: '인적 자원 및 안전 관리',
      icon: '👷',
      items: [
        { id:'log_3_1', label:'기사·작업자 이직률', type:'bars', question:'택배 기사 및 창고 작업자의 평균 근속연수, 이직 시 신규 채용·교육에 소요되는 비용과 시간을 정량적으로 파악하고 있습니까?', scale:[{score:1,desc:'이직률 미측정. 이직 발생 후 급하게 채용.'},{score:2,desc:'연간 이직률은 파악. 비용 산출 없음.'},{score:3,desc:'이직 비용 정량화. 핵심 인력 유지 전략 수립.'},{score:4,desc:'이직 징후 사전 감지 체계. 성과 보상 연동 운영.'},{score:5,desc:'이직률 업계 최저 수준 유지. 인재 유지 프로그램 체계화.'}], ai_trigger:{threshold:2,warning:'turnover_high'} },
        { id:'log_3_2', label:'산업재해 및 안전사고', type:'bars', question:'중대재해처벌법 대비 안전보건관리체계 이행 점검, 창고 내 낙하물 사고 및 교통사고 발생률을 관리하고 있습니까?', scale:[{score:1,desc:'안전 관리 체계 없음. 사고 발생 시 수습.'},{score:2,desc:'법정 최소 안전 교육만 실시. 체계 미비.'},{score:3,desc:'안전보건관리체계 구축. 분기 안전 점검 실시.'},{score:4,desc:'사고 발생률 실시간 추적. 위험 구간 자동 경보.'},{score:5,desc:'중대재해법 완전 준수. 사고율 0% 달성 체계.'}], ai_trigger:{threshold:2,warning:'safety_risk'} },
        { id:'log_3_3', label:'외국인 인력 관리', type:'bars', question:'창고 작업 외국인 근로자 비중 및 안전 교육 이수율, 의사소통 문제로 인한 오피킹·오배송 발생 상관관계를 추적하고 있습니까?', scale:[{score:1,desc:'외국인 인력 관리 기준 없음. 의사소통 문제 방치.'},{score:2,desc:'기본 안전 교육만 실시. 오피킹 연관성 미파악.'},{score:3,desc:'다국어 안전 교육 자료 보유. 이수율 관리.'},{score:4,desc:'오피킹·오배송과 의사소통 문제 상관관계 분석.'},{score:5,desc:'다국어 SOP + 영상 교육 + 오류율 실시간 모니터링.'}], ai_trigger:{threshold:2,warning:'foreign_worker_mgmt'} },
        { id:'log_3_4', label:'성과 보상 및 동기부여', type:'bars', question:'기사별 배송 건수·품질 점수에 따른 성과급 구조의 합리성 및 핵심 인력 유지 전략이 운영되고 있습니까?', scale:[{score:1,desc:'성과와 무관한 고정급만 지급.'},{score:2,desc:'배송 건수 기준 단순 인센티브. 품질 미반영.'},{score:3,desc:'건수 + 품질(클레임률) 복합 성과급 운영.'},{score:4,desc:'개인별 성과 대시보드 공유. 인센티브 자동 산출.'},{score:5,desc:'성과급 + 장기 근속 인센티브 + 역량 개발 지원 체계.'}], ai_trigger:{threshold:2,warning:'incentive_weak'} },
      ]
    },
    {
      id: 'log_profit',
      label: '수익성 및 디지털 전환',
      icon: '💹',
      items: [
        { id:'log_4_1', label:'건당 배송 원가(Cost Per Delivery)', type:'bars', question:'운임비·인건비·포장비·보험료를 종합한 배송 1건당 원가 및 고객사별 수익성 분석을 실시하고 있습니까?', scale:[{score:1,desc:'건당 배송 원가 개념 없음. 전체 비용만 파악.'},{score:2,desc:'대략적인 건당 비용 추산. 고객사별 분석 없음.'},{score:3,desc:'월 단위 건당 원가 산출. 주요 고객사 수익성 파악.'},{score:4,desc:'고객사별·노선별 건당 원가 실시간 분석.'},{score:5,desc:'원가 드릴다운 자동화. 적자 고객사 즉각 재협상 체계.'}], ai_trigger:{threshold:2,warning:'cpm_untracked'} },
        { id:'log_4_2', label:'고객사 집중도 리스크', type:'bars', question:'상위 3개 고객사 매출 비중이 70% 이상인지 여부 및 대체 고객사 후보군 확보 수준을 진단하고 있습니까?', scale:[{score:1,desc:'매출 집중도 파악 없음. 주요 고객사 이탈 시 무방비.'},{score:2,desc:'상위 고객사 의존도는 알지만 대체 전략 없음.'},{score:3,desc:'고객사 다변화 목표 설정. 신규 영업 진행 중.'},{score:4,desc:'상위 3사 비중 50% 이하 유지. 대체 고객사 파이프라인 보유.'},{score:5,desc:'고객사 집중도 실시간 모니터링. 자동 영업 알림 체계.'}], ai_trigger:{threshold:2,warning:'customer_concentration'} },
        { id:'log_4_3', label:'WMS·TMS 디지털 연동률', type:'bars', question:'창고관리시스템(WMS)과 운송관리시스템(TMS)의 실시간 연동 수준 및 수기·엑셀 관리에서 탈피 여부를 진단하고 있습니까?', scale:[{score:1,desc:'수기·엑셀 관리 100%. 시스템 전무.'},{score:2,desc:'WMS 또는 TMS 중 하나만 부분 도입.'},{score:3,desc:'WMS·TMS 각각 운영. 연동은 수동 처리.'},{score:4,desc:'WMS·TMS 실시간 연동. 자동 데이터 동기화.'},{score:5,desc:'WMS·TMS·ERP 완전 통합. 실시간 의사결정 가시성 확보.'}], ai_trigger:{threshold:2,warning:'system_integration_low'} },
        { id:'log_4_4', label:'환경 규제 대응(ESG)', type:'bars', question:'탄소 배출 규제 대비 친환경 차량(전기차 등) 전환 계획 및 ESG 경영 대응 수준을 갖추고 있습니까?', scale:[{score:1,desc:'환경 규제 인지 없음. ESG 대응 전무.'},{score:2,desc:'규제 존재는 알지만 대응 계획 없음.'},{score:3,desc:'친환경 차량 전환 로드맵 수립. 일부 도입.'},{score:4,desc:'탄소 배출량 측정 + 친환경 차량 20% 이상 전환.'},{score:5,desc:'탄소중립 물류 실현. RE100 대응 + ESG 인증 획득.'}], ai_trigger:{threshold:2,warning:'esg_logistics_weak'} },
      ]
    },
  ],
  ai_analysis: [
    { trigger:'empty_run_high+cpm_untracked', level:'CRITICAL', msg:'공차율이 높은데 건당 배송 원가도 모른다면 운송 네트워크 설계 자체가 비효율입니다. 화물 매칭 플랫폼 도입과 원가 분석을 동시에 처방합니다.' },
    { trigger:'perfect_order_low+system_integration_low', level:'CRITICAL', msg:'오배송률이 높은데 WMS 연동이 안 된다면 피킹 오류가 근본 원인입니다. 바코드·RFID 기반 피킹 시스템 도입을 최우선 처방합니다.' },
    { trigger:'turnover_high+safety_risk', level:'HIGH', msg:'기사 이직률이 높고 교통사고도 증가하고 있다면 과로로 인한 집중력 저하 문제입니다. 근무 체계 개선과 차량별 운행기록 분석을 통한 안전 관리 강화를 처방합니다.' },
  ],
};

if (typeof window !== 'undefined') window.INDUSTRY_LOGISTICS = INDUSTRY_LOGISTICS;
if (typeof module !== 'undefined') module.exports = INDUSTRY_LOGISTICS;
