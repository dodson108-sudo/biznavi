const INDUSTRY_EDUCATION = {
  id: 'education',
  label: '교육 서비스 및 에듀테크',
  icon: '🎓',
  description: '입시·보습 학원·직무 교육 서비스·에듀테크 기업. 강사 개인 역량 의존도가 높음.',
  areas: [
    {
      id: 'edu_finance',
      label: '시스템 및 재무 관리',
      icon: '💰',
      items: [
        { id:'ed_1_1', label:'수강료 외 부가 수익 비중', type:'bars', question:'자체 교재 판매·굿즈·온라인 강의권 등 수강료 의존도를 낮추는 부가 매출 구조를 갖추고 있습니까?', scale:[{score:1,desc:'수강료 100% 의존. 부가 수익 없음.'},{score:2,desc:'교재 판매 일부. 부가 수익 5% 미만.'},{score:3,desc:'교재+온라인 강의 판매. 부가 수익 15% 이상.'},{score:4,desc:'다양한 부가 수익원. 수강료 의존도 70% 이하.'},{score:5,desc:'부가 수익 30% 이상. 수강료 의존 리스크 최소화.'}], ai_trigger:{threshold:2,warning:'revenue_single_source'} },
        { id:'ed_1_2', label:'강사료·인센티브 합리성', type:'bars', question:'매출 대비 강사 배분율의 적정성 및 성과 기반의 보상 체계 가동 여부를 갖추고 있습니까?', scale:[{score:1,desc:'강사료 기준 없음. 임의 지급.'},{score:2,desc:'고정 강사료 지급. 성과 연동 없음.'},{score:3,desc:'강사료 기준 문서화. 기본 인센티브 체계.'},{score:4,desc:'성과 기반 인센티브 + 매출 배분율 최적화.'},{score:5,desc:'강사별 수익성 분석. 자동 인센티브 산출 체계.'}], ai_trigger:{threshold:2,warning:'instructor_compensation_unclear'} },
        { id:'ed_1_3', label:'결제 자동화·미수금 관리', type:'bars', question:'수강료 자동 결제 시스템 도입 여부 및 장기 미납 원생에 대한 체계적 회수 프로세스를 갖추고 있습니까?', scale:[{score:1,desc:'수동 결제 100%. 미납 관리 없음.'},{score:2,desc:'카드 결제 가능. 자동화 없음.'},{score:3,desc:'자동 결제 시스템 도입. 미납 월 집계.'},{score:4,desc:'자동 결제 + 미납 자동 알림 체계.'},{score:5,desc:'결제 완전 자동화. 미수금 0% 달성 체계.'}], ai_trigger:{threshold:2,warning:'payment_automation_missing'} },
        { id:'ed_1_4', label:'시설 유지·고정비 비중', type:'bars', question:'임대료·관리비 등 고정 지출 대비 가동률(평당 매출) 및 노후 시설 교체 주기 관리를 하고 있습니까?', scale:[{score:1,desc:'고정비 비중 파악 없음. BEP 모름.'},{score:2,desc:'임대료만 파악. 가동률 미측정.'},{score:3,desc:'고정비 비중 관리. 평당 매출 집계.'},{score:4,desc:'고정비 30% 이하 유지. 시설 교체 로드맵 보유.'},{score:5,desc:'고정비 최적화 완료. 가동률 90% 이상 달성.'}], ai_trigger:{threshold:2,warning:'fixed_cost_high'} },
      ]
    },
    {
      id: 'edu_content',
      label: '커리큘럼 및 학습 품질',
      icon: '📚',
      items: [
        { id:'ed_2_1', label:'커리큘럼 차별화 지수', type:'bars', question:'타 학원 대비 독보적인 학습 경로 보유 여부 및 최신 교육 과정 반영 속도를 갖추고 있습니까?', scale:[{score:1,desc:'차별화 없음. 타 학원과 동일 커리큘럼.'},{score:2,desc:'일부 차별화 시도. 고객 인지도 낮음.'},{score:3,desc:'독보적 커리큘럼 보유. 학부모 인지도 확보.'},{score:4,desc:'업계 선도 커리큘럼. 정기 업데이트 체계.'},{score:5,desc:'커리큘럼 IP 자산화. 업계 표준 선도.'}], ai_trigger:{threshold:2,warning:'curriculum_undifferentiated'} },
        { id:'ed_2_2', label:'학습 성취도 추적 시스템', type:'bars', question:'학생별 성적 데이터·과제 이행률 등을 디지털로 기록하고 학부모에게 리포팅하는 체계를 갖추고 있습니까?', scale:[{score:1,desc:'성취도 추적 없음. 감으로 학생 수준 파악.'},{score:2,desc:'시험 성적만 기록. 분석 없음.'},{score:3,desc:'학생별 성취도 디지털 기록. 월 리포트 제공.'},{score:4,desc:'실시간 성취도 대시보드. 학부모 자동 리포팅.'},{score:5,desc:'AI 기반 개인화 학습 경로 추천. 성취도 자동 최적화.'}], ai_trigger:{threshold:2,warning:'achievement_tracking_missing'} },
        { id:'ed_2_3', label:'하이브리드 학습 환경', type:'bars', question:'대면 수업과 비대면(VOD·Zoom) 수업의 병행 가능 여부 및 자체 LMS 활용도를 갖추고 있습니까?', scale:[{score:1,desc:'대면 수업만 가능. 비대면 전무.'},{score:2,desc:'Zoom 기본 활용. LMS 없음.'},{score:3,desc:'대면+비대면 병행. 기본 LMS 운영.'},{score:4,desc:'자체 LMS 구축. 수강생 자기 주도 학습 가능.'},{score:5,desc:'AI 튜터 연동 LMS. 개인화 학습 완전 자동화.'}], ai_trigger:{threshold:2,warning:'hybrid_learning_missing'} },
        { id:'ed_2_4', label:'콘텐츠 업데이트 주기', type:'bars', question:'강의 교재 및 평가 문항의 최신성 유지 여부와 부진 학생을 위한 클리닉 자료 보유 수준을 갖추고 있습니까?', scale:[{score:1,desc:'교재 수년째 미업데이트. 클리닉 없음.'},{score:2,desc:'연 1회 교재 업데이트. 클리닉 자료 없음.'},{score:3,desc:'반기 1회 교재 업데이트. 기본 클리닉 자료.'},{score:4,desc:'분기 업데이트. 개인별 클리닉 자료 제공.'},{score:5,desc:'실시간 트렌드 반영 업데이트. AI 기반 클리닉 자동 생성.'}], ai_trigger:{threshold:2,warning:'content_update_slow'} },
      ]
    },
    {
      id: 'edu_hr',
      label: '인적 자원 및 조직 역량',
      icon: '👨‍🏫',
      items: [
        { id:'ed_3_1', label:'스타 강사 매출 의존도', type:'bars', question:'특정 강사에게 매출이 70% 이상 쏠려 있는지 여부와 이탈 시 대비책 유무를 갖추고 있습니까?', scale:[{score:1,desc:'단일 강사 매출 70% 이상. 이탈 시 폐업 위기.'},{score:2,desc:'스타 강사 의존도 높음. 대비책 없음.'},{score:3,desc:'강사 다변화 진행 중. 의존도 50% 이하.'},{score:4,desc:'강사별 매출 분산. 이탈 대비 체계 완비.'},{score:5,desc:'시스템 강의 체계. 강사 이탈 영향 최소화.'}], ai_trigger:{threshold:2,warning:'star_instructor_dependency'} },
        { id:'ed_3_2', label:'강사 채용·육성 매뉴얼', type:'bars', question:'신입 강사 교육(OJT) 시스템 및 강의 표준안(SOP)을 통한 서비스 품질 균일화 정도를 갖추고 있습니까?', scale:[{score:1,desc:'OJT 없음. 신입 강사 즉시 투입.'},{score:2,desc:'구두 OJT만 실시. 표준안 없음.'},{score:3,desc:'OJT 매뉴얼 보유. 기본 강의 표준안.'},{score:4,desc:'체계적 OJT + 강의 표준안 완성.'},{score:5,desc:'강사 육성 플랫폼. 품질 균일화 완전 달성.'}], ai_trigger:{threshold:2,warning:'instructor_training_missing'} },
        { id:'ed_3_3', label:'상담 실장 등록 전환율', type:'bars', question:'신규 상담 대비 실제 수강 등록으로 이어지는 비율 및 상담 스크립트 보유 수준을 갖추고 있습니까?', scale:[{score:1,desc:'전환율 측정 없음. 상담 스크립트 없음.'},{score:2,desc:'전환율 대략 파악. 스크립트 미보유.'},{score:3,desc:'전환율 집계. 기본 상담 스크립트 운영.'},{score:4,desc:'전환율 50% 이상. 고도화된 상담 스크립트.'},{score:5,desc:'전환율 70% 이상. AI 상담 보조 시스템 운영.'}], ai_trigger:{threshold:2,warning:'consultation_conversion_low'} },
        { id:'ed_3_4', label:'조직 문화·이직률', type:'bars', question:'교직원의 평균 근속연수 및 업무 과부하 방지를 위한 행정 지원 체계를 갖추고 있습니까?', scale:[{score:1,desc:'이직률 높음. 행정 지원 없음.'},{score:2,desc:'이직률 파악. 행정 지원 미비.'},{score:3,desc:'근속 인센티브 도입. 행정 지원 체계.'},{score:4,desc:'평균 근속 3년 이상. 행정 자동화 운영.'},{score:5,desc:'이직률 0% 달성 체계. 행정 완전 자동화.'}], ai_trigger:{threshold:2,warning:'staff_turnover_high'} },
      ]
    },
    {
      id: 'edu_marketing',
      label: '마케팅 및 로컬 영향력',
      icon: '📍',
      items: [
        { id:'ed_4_1', label:'로컬 플레이스 점유율', type:'bars', question:'네이버 지도 검색 시 상위 노출 여부 및 학원가 내 압도적 인지도를 위한 키워드 선점 상태를 갖추고 있습니까?', scale:[{score:1,desc:'플레이스 관리 없음. 온라인 노출 전무.'},{score:2,desc:'기본 등록. 키워드 관리 없음.'},{score:3,desc:'타겟 키워드 상위 노출. 기본 리뷰 관리.'},{score:4,desc:'플레이스 상위 3위. 학원가 인지도 확보.'},{score:5,desc:'플레이스 1위 고정. 학원가 대표 브랜드 포지셔닝.'}], ai_trigger:{threshold:2,warning:'local_place_weak'} },
        { id:'ed_4_2', label:'학부모 커뮤니티 평판', type:'bars', question:'지역 맘카페 내 평판 지수 및 부정 여론 발생 시 대응 속도를 관리하고 있습니까?', scale:[{score:1,desc:'커뮤니티 관리 없음. 부정 여론 방치.'},{score:2,desc:'간헐적 모니터링. 대응 체계 없음.'},{score:3,desc:'정기 모니터링. 부정 여론 48시간 내 대응.'},{score:4,desc:'커뮤니티 적극 관리. 긍정 여론 생성.'},{score:5,desc:'AI 커뮤니티 모니터링. 위기 전 선제 대응.'}], ai_trigger:{threshold:2,warning:'community_reputation_weak'} },
        { id:'ed_4_3', label:'성과 데이터 마케팅', type:'bars', question:'합격자 수·성적 향상 사례 등 객관적 실적을 시각화하여 홍보 자산으로 활용하는 능력을 갖추고 있습니까?', scale:[{score:1,desc:'성과 데이터 없음. 홍보 자산 전무.'},{score:2,desc:'성과 데이터 보유. 홍보 미활용.'},{score:3,desc:'주요 성과 SNS 정기 게시.'},{score:4,desc:'성과 데이터 시각화 + 다채널 배포.'},{score:5,desc:'성과 데이터 자동 업데이트. 입학 시즌 마케팅 자동화.'}], ai_trigger:{threshold:2,warning:'performance_marketing_weak'} },
        { id:'ed_4_4', label:'재등록·지인 추천율', type:'bars', question:'수강 기간 종료 후 재등록 비율 및 기존 학부모의 자발적 소개에 의한 유입 비중을 관리하고 있습니까?', scale:[{score:1,desc:'재등록율 측정 없음. 추천 없음.'},{score:2,desc:'재등록율 대략 파악. 유도 전략 없음.'},{score:3,desc:'재등록율 집계. 기본 재등록 혜택 운영.'},{score:4,desc:'재등록율 70% 이상. 추천 프로그램 운영.'},{score:5,desc:'재등록·추천 자동화. 학부모 NPS 최고 수준.'}], ai_trigger:{threshold:2,warning:'reenrollment_rate_low'} },
      ]
    },
  ],
  ai_analysis: [
    { trigger:'star_instructor_dependency+instructor_training_missing', level:'CRITICAL', msg:'특정 강사 의존도는 높은데 강의 표준안(SOP)이 없다면 강사 이탈 시 폐업 위기입니다. 콘텐츠 IP 자산화와 시스템 강의 체계 도입을 최우선 처방합니다.' },
    { trigger:'consultation_conversion_low+revenue_single_source', level:'HIGH', msg:'마케팅 비용은 많이 쓰는데 상담 전환율이 낮다면 밑 빠진 독에 물 붓기입니다. 상담 스크립트 고도화와 체험 수업 프로그램 강화를 제안합니다.' },
    { trigger:'achievement_tracking_missing+reenrollment_rate_low', level:'HIGH', msg:'성취도 데이터 관리는 잘 되는데 추천율이 낮다면 학부모와의 소통 채널 문제입니다. 월간 학습 리포트 자동 발송 및 대면 상담 정례화를 처방합니다.' },
  ],
};
if (typeof window !== 'undefined') window.INDUSTRY_EDUCATION = INDUSTRY_EDUCATION;
if (typeof module !== 'undefined') module.exports = INDUSTRY_EDUCATION;
