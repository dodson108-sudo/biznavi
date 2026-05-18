const INDUSTRY_MEDICAL = {
  id: 'medical',
  label: '의료 및 헬스케어',
  icon: '🏥',
  description: '병의원·디지털 헬스케어 기기 제조·건강 관리 서비스. 규제 준수와 환자 신뢰가 사업의 핵심.',
  areas: [
    {
      id: 'med_finance',
      label: '시스템 및 재무 관리',
      icon: '💰',
      items: [
        { id:'md_1_1', label:'급여·비급여 매출 구성비', type:'bars', question:'건강보험 보수(급여)와 환자 전액 부담(비급여) 항목의 매출 비중 및 수익성 기여도를 관리하고 있습니까?', scale:[{score:1,desc:'급여·비급여 구분 없음. 전체 매출만 집계.'},{score:2,desc:'비중 대략 파악. 수익성 분석 없음.'},{score:3,desc:'급여·비급여 월 단위 비중 관리. 수익성 비교.'},{score:4,desc:'항목별 수익성 분석. 비급여 포트폴리오 최적화.'},{score:5,desc:'실시간 급여·비급여 수익성 대시보드. 자동 최적화.'}], ai_trigger:{threshold:2,warning:'revenue_mix_unmanaged'} },
        { id:'md_1_2', label:'의료 소모품 원가율', type:'bars', question:'의약품·거즈 등 소모품 매입액 대비 매출 비중 및 재고 관리의 정밀성을 갖추고 있습니까?', scale:[{score:1,desc:'소모품 원가율 파악 없음. 재고 임의 관리.'},{score:2,desc:'전체 소모품 비용 집계. 원가율 미산출.'},{score:3,desc:'소모품 원가율 분기 산출. 재고 기준 설정.'},{score:4,desc:'소모품별 원가율 관리. 자동 발주 시스템 운영.'},{score:5,desc:'소모품 실시간 원가 추적. AI 기반 자동 발주 최적화.'}], ai_trigger:{threshold:2,warning:'consumable_cost_untracked'} },
        { id:'md_1_3', label:'건강보험 청구 관리', type:'bars', question:'삭감 청구 발생률 및 청구 오류로 인한 환급금 발생 등 행정적 손실 방지 체계를 갖추고 있습니까?', scale:[{score:1,desc:'청구 오류 관리 없음. 삭감 빈번.'},{score:2,desc:'삭감 발생 인지. 원인 분석 없음.'},{score:3,desc:'청구 오류 월 집계. 주요 원인 개선.'},{score:4,desc:'삭감률 1% 이하 관리. 청구 검수 체계 완비.'},{score:5,desc:'AI 청구 검수. 삭감 0% 달성 목표 체계.'}], ai_trigger:{threshold:2,warning:'insurance_claim_errors'} },
        { id:'md_1_4', label:'노후 장비 리스·렌탈 비중', type:'bars', question:'의료 장비의 내구연수 관리 및 설비 투자 대비 감가상각비·리스료 지출의 적정성을 관리합니까?', scale:[{score:1,desc:'장비 내구연수 파악 없음. 노후 장비 방치.'},{score:2,desc:'주요 장비 연수 파악. 교체 계획 없음.'},{score:3,desc:'장비별 내구연수 관리. 교체 로드맵 보유.'},{score:4,desc:'리스·렌탈 비용 최적화. 감가상각 정밀 관리.'},{score:5,desc:'장비 투자 ROI 실시간 분석. 최적 교체 시점 자동 알림.'}], ai_trigger:{threshold:2,warning:'equipment_aging_unmanaged'} },
      ]
    },
    {
      id: 'med_process',
      label: '프로세스 및 품질 안전',
      icon: '🛡️',
      items: [
        { id:'md_2_1', label:'환자 대기·체류 시간', type:'bars', question:'접수부터 진료·수납까지의 총 소요 시간 및 병목 공간 최적화 여부를 관리하고 있습니까?', scale:[{score:1,desc:'대기 시간 측정 없음. 환자 불만 빈번.'},{score:2,desc:'평균 대기 시간 대략 파악. 개선 없음.'},{score:3,desc:'단계별 대기 시간 집계. 병목 구간 파악.'},{score:4,desc:'대기 시간 목표 설정. 무인 수납기 등 도입.'},{score:5,desc:'스마트 대기 시스템. 실시간 동선 최적화.'}], ai_trigger:{threshold:2,warning:'waiting_time_high'} },
        { id:'md_2_2', label:'의료 사고·클레임 관리', type:'bars', question:'오진·부작용 등 의료 사고 이력 관리 및 환자 불만 접수 시 즉각 대응 매뉴얼 보유 수준을 갖추고 있습니까?', scale:[{score:1,desc:'사고 이력 관리 없음. 발생 시 임기응변.'},{score:2,desc:'주요 사고 기록. 대응 매뉴얼 없음.'},{score:3,desc:'사고 유형별 대응 매뉴얼 보유. 이력 관리.'},{score:4,desc:'사고 발생 즉각 대응 + 재발 방지 루프.'},{score:5,desc:'의료 사고 예측 AI. 제로 사고 목표 달성 체계.'}], ai_trigger:{threshold:2,warning:'medical_incident_unmanaged'} },
        { id:'md_2_3', label:'개인정보·보안 체계', type:'bars', question:'진료 기록(EMR·PACS)의 디지털 보안 상태 및 외부 유출 방지를 위한 권한 관리 시스템을 갖추고 있습니까?', scale:[{score:1,desc:'보안 체계 없음. EMR 접근 통제 전무.'},{score:2,desc:'기본 비밀번호만 설정. 권한 관리 없음.'},{score:3,desc:'직급별 접근 권한 설정. 로그 기록.'},{score:4,desc:'EMR 보안 인증 완료. 외부 유출 방지 체계.'},{score:5,desc:'제로 트러스트 보안. 실시간 이상 접근 탐지.'}], ai_trigger:{threshold:2,warning:'emr_security_weak'} },
        { id:'md_2_4', label:'위생·감염 관리', type:'bars', question:'원내 감염 방지 수칙 준수 여부 및 일회용 의료기기 폐기 규정 이행의 철저함을 갖추고 있습니까?', scale:[{score:1,desc:'감염 관리 최소 수준. 규정 이행 미흡.'},{score:2,desc:'기본 감염 수칙 준수. 체계 미비.'},{score:3,desc:'감염 관리 체계 구축. 정기 교육 실시.'},{score:4,desc:'원내 감염 제로 목표. 실시간 모니터링.'},{score:5,desc:'스마트 감염 관리 시스템. 자동 경보 + 즉각 조치.'}], ai_trigger:{threshold:2,warning:'infection_control_weak'} },
      ]
    },
    {
      id: 'med_hr',
      label: '인적 자원 및 조직 문화',
      icon: '👨‍⚕️',
      items: [
        { id:'md_3_1', label:'핵심 의료진 이탈 리스크', type:'bars', question:'주요 전문의 및 간호 인력의 근속연수와 퇴사 시 환자 이탈 방지 매뉴얼 유무를 갖추고 있습니까?', scale:[{score:1,desc:'의료진 이탈 리스크 관리 없음.'},{score:2,desc:'이탈 우려 인지. 대응 체계 없음.'},{score:3,desc:'핵심 의료진 인수인계 프로토콜 보유.'},{score:4,desc:'근속 인센티브 + 환자 인수인계 체계.'},{score:5,desc:'의료진 이탈 0% 체계. 환자 유실 방지 완성.'}], ai_trigger:{threshold:2,warning:'medical_staff_turnover'} },
        { id:'md_3_2', label:'직무별 CS 숙련도', type:'bars', question:'데스크·간호팀 등 접점 인력의 응대 수준 및 정기적인 고객 만족 교육 이수 현황을 갖추고 있습니까?', scale:[{score:1,desc:'CS 교육 없음. 응대 수준 편차 심각.'},{score:2,desc:'기본 응대 교육만 실시.'},{score:3,desc:'분기 CS 교육. 응대 표준 매뉴얼 보유.'},{score:4,desc:'월 CS 교육 + 미스터리 쇼퍼 평가.'},{score:5,desc:'CS 숙련도 자동 측정. 개인별 맞춤 교육 체계.'}], ai_trigger:{threshold:2,warning:'cs_skill_weak'} },
        { id:'md_3_3', label:'협진·소통 체계', type:'bars', question:'분과 간 협진 필요 시 데이터 공유 속도 및 원장과 직원 간의 피드백 채널 활성화 정도를 갖추고 있습니까?', scale:[{score:1,desc:'협진 체계 없음. 부서 간 단절.'},{score:2,desc:'구두 협진만 가능. 데이터 공유 없음.'},{score:3,desc:'EMR 기반 협진 데이터 공유.'},{score:4,desc:'실시간 협진 시스템. 원장·직원 피드백 채널.'},{score:5,desc:'통합 의료 플랫폼. 협진 자동화 + 실시간 소통.'}], ai_trigger:{threshold:2,warning:'collaboration_weak'} },
        { id:'md_3_4', label:'법정 필수 이행 관리', type:'bars', question:'의료법상 필수 교육 및 보건증·면허 갱신 관리의 체계성을 갖추고 있습니까?', scale:[{score:1,desc:'법정 교육 이행 관리 없음. 위반 위험.'},{score:2,desc:'주요 교육만 이수. 관리 체계 없음.'},{score:3,desc:'법정 교육 이수율 100%. 면허 갱신 관리.'},{score:4,desc:'법정 이행 자동 알림. 전 직원 완전 이수.'},{score:5,desc:'컴플라이언스 완전 자동화. 위반 0% 달성.'}], ai_trigger:{threshold:2,warning:'compliance_management_weak'} },
      ]
    },
    {
      id: 'med_marketing',
      label: '마케팅 및 지역 점유',
      icon: '📍',
      items: [
        { id:'md_4_1', label:'지역 내 브랜드 인지도', type:'bars', question:'상권 내 유효 환자 수 대비 점유율 및 경쟁 병원 대비 특화 진료 항목 보유 수준을 갖추고 있습니까?', scale:[{score:1,desc:'지역 인지도 없음. 특화 진료 없음.'},{score:2,desc:'기본 인지도 보유. 경쟁 병원과 차별화 없음.'},{score:3,desc:'특화 진료 1~2개 보유. 지역 인지도 확보.'},{score:4,desc:'특화 분야 지역 1위. 점유율 지속 상승.'},{score:5,desc:'지역 대표 의료기관 포지셔닝. 환자 자발적 추천.'}], ai_trigger:{threshold:2,warning:'local_brand_weak'} },
        { id:'md_4_2', label:'의료 광고 심의 준수', type:'bars', question:'의료법 위반 없는 광고 집행 여부 및 채널별 전환율 모니터링을 갖추고 있습니까?', scale:[{score:1,desc:'광고 심의 없음. 위반 위험 높음.'},{score:2,desc:'기본 심의 인지. 일부 위반 소지.'},{score:3,desc:'광고 심의 완료. 채널별 전환율 집계.'},{score:4,desc:'심의 완전 준수. ROAS 채널별 최적화.'},{score:5,desc:'의료 광고 컴플라이언스 완전 자동화.'}], ai_trigger:{threshold:2,warning:'medical_ad_compliance_weak'} },
        { id:'md_4_3', label:'커뮤니티·평판 관리', type:'bars', question:'지역 맘카페·포털 리뷰 점수 및 악성 평판 발생 시 대응 속도와 관리 체계를 갖추고 있습니까?', scale:[{score:1,desc:'온라인 평판 관리 없음. 악성 리뷰 방치.'},{score:2,desc:'주요 플랫폼 리뷰 간헐적 확인.'},{score:3,desc:'리뷰 정기 모니터링. 악성 리뷰 48시간 내 대응.'},{score:4,desc:'커뮤니티 적극 관리. 평점 4.5 이상 유지.'},{score:5,desc:'AI 평판 모니터링. 위기 발생 전 선제 대응.'}], ai_trigger:{threshold:2,warning:'reputation_management_weak'} },
        { id:'md_4_4', label:'재진·추천율', type:'bars', question:'신규 환자 유입 대비 재방문 환자 비율 및 입소문에 의한 내원 비중을 관리하고 있습니까?', scale:[{score:1,desc:'재진율 측정 없음. 단발성 진료 위주.'},{score:2,desc:'재진율 대략 파악. 유도 전략 없음.'},{score:3,desc:'재진율 집계. 정기 검진 프로그램 운영.'},{score:4,desc:'재진율 70% 이상. 환자 추천 프로그램 운영.'},{score:5,desc:'재진·추천 자동화. 환자 생애 가치 최적화.'}], ai_trigger:{threshold:2,warning:'revisit_rate_low'} },
      ]
    },
  ],
  ai_analysis: [
    { trigger:'revenue_mix_unmanaged+revisit_rate_low', level:'CRITICAL', msg:'비급여 비중은 높은데 재진율이 낮다면 단기 수익 위주의 과잉 진료가 의심됩니다. 환자 신뢰도 회복을 위한 진료 설명 강화 프로그램 도입을 처방합니다.' },
    { trigger:'waiting_time_high+cs_skill_weak', level:'HIGH', msg:'대기 시간이 긴데 CS 숙련도가 낮다면 고객 이탈 임계점에 도달합니다. 무인 수납기 도입 및 대기 시스템 시각화 솔루션을 제안합니다.' },
    { trigger:'emr_security_weak+medical_staff_turnover', level:'HIGH', msg:'EMR 보안 체계는 있으나 인력 이탈 리스크가 높다면 내부자에 의한 정보 유출 위험이 큽니다. 데이터 접근 권한 분리 및 보안 서약서 갱신을 최우선 처방합니다.' },
  ],
};
if (typeof window !== 'undefined') window.INDUSTRY_MEDICAL = INDUSTRY_MEDICAL;
if (typeof module !== 'undefined') module.exports = INDUSTRY_MEDICAL;
