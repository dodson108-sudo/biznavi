const INDUSTRY_AGRI_FOOD = {
  id: 'agri_food',
  label: '농림·식품원료업',
  icon: '🌾',
  description: '스마트팜, 축산·양식, 임산물 가공, 농산물 직거래 플랫폼, 특용작물 재배업체. 자연환경 의존도가 극도로 높고 생산 주기가 길어 단기 조정이 불가능함.',
  areas: [
    {
      id: 'agri_production',
      label: '생산성 및 품질 관리',
      icon: '🌱',
      items: [
        { id:'agri_1_1', label:'단위면적당 수확량(Yield)', type:'bars', question:'작물별 평균 수확량 대비 자사 수확량 비교 및 연도별 추이 분석을 정량적으로 관리하고 있습니까?', scale:[{score:1,desc:'수확량 기록 없음. 감으로만 파악.'},{score:2,desc:'연간 총 수확량만 집계. 면적당 분석 없음.'},{score:3,desc:'작물별 면적당 수확량 집계. 업계 평균과 비교.'},{score:4,desc:'생육 단계별 수확량 예측 + 실적 비교 분석.'},{score:5,desc:'스마트팜 센서 기반 실시간 생육 모니터링 + AI 수확량 예측.'}], ai_trigger:{threshold:2,warning:'yield_untracked'} },
        { id:'agri_1_2', label:'품질 등급 비율', type:'bars', question:'출하 산물 중 특·상 등급 비율과 하·비표준 비율의 추이를 관리하며 품질 하락 원인 분석 체계를 보유하고 있습니까?', scale:[{score:1,desc:'등급 관리 없음. 전량 일괄 출하.'},{score:2,desc:'등급 분류는 하나 비율 추적 없음.'},{score:3,desc:'등급별 비율 월 단위 집계. 개선 목표 설정.'},{score:4,desc:'등급 하락 원인 분석 체계. 즉각 개선 조치.'},{score:5,desc:'AI 기반 품질 예측 + 등급 최적화 재배 환경 자동 조정.'}], ai_trigger:{threshold:2,warning:'quality_grade_low'} },
        { id:'agri_1_3', label:'스마트팜 도입 수준', type:'bars', question:'온실·축사 내 온습도·CO2·일사량 등 환경 모니터링 자동화 및 원격 제어 시스템이 가동되고 있습니까?', scale:[{score:1,desc:'수동 관리 100%. 스마트팜 도입 전무.'},{score:2,desc:'기초 센서 일부 설치. 데이터 활용 없음.'},{score:3,desc:'환경 모니터링 자동화. 원격 확인 가능.'},{score:4,desc:'원격 제어 + 자동화 관개·시비 시스템 가동.'},{score:5,desc:'AI 기반 완전 자동화 스마트팜. 최적 생육 환경 자동 유지.'}], ai_trigger:{threshold:2,warning:'smartfarm_low'} },
        { id:'agri_1_4', label:'병해충·질병 관리', type:'bars', question:'예방적 방제 체계(통합방제, IPM) 적용 수준 및 기상 이변·역병 발생 시 긴급 대응 매뉴얼을 보유하고 있습니까?', scale:[{score:1,desc:'병해충 발생 후 수동 대응. 예방 체계 없음.'},{score:2,desc:'정기 방제 실시. IPM 개념 미적용.'},{score:3,desc:'IPM 기반 예방적 방제 체계 운영.'},{score:4,desc:'기상 데이터 연동 병해충 예측. 선제 방제 실행.'},{score:5,desc:'AI 병해충 조기 탐지 + 드론 자동 방제 + 긴급 대응 SOP 완비.'}], ai_trigger:{threshold:2,warning:'pest_management_weak'} },
      ]
    },
    {
      id: 'agri_cost',
      label: '원가 구조 및 자원 효율',
      icon: '💧',
      items: [
        { id:'agri_2_1', label:'투입 대비 산출 비율', type:'bars', question:'비료·사료·물·에너지 투입량 대비 생산물 가치의 효율 및 투입 원가 변동 추이를 모니터링하고 있습니까?', scale:[{score:1,desc:'투입 원가 기록 없음. 감으로 투입량 결정.'},{score:2,desc:'주요 투입재 비용 집계. 효율 분석 없음.'},{score:3,desc:'투입 대비 산출 비율 분기 산출. 개선 목표 수립.'},{score:4,desc:'투입재별 효율 실시간 모니터링. 낭비 구간 즉각 조정.'},{score:5,desc:'정밀 농업 기술 적용. 투입 최소화·산출 최대화 AI 최적화.'}], ai_trigger:{threshold:2,warning:'input_output_inefficient'} },
        { id:'agri_2_2', label:'인건비 및 노동력 구조', type:'bars', question:'외국인 근로자 비중 및 인건비가 총비용에서 차지하는 비율, 자동화로 대체 가능한 공정을 식별하고 있습니까?', scale:[{score:1,desc:'인건비 비중 파악 없음. 인력 의존 심각.'},{score:2,desc:'인건비 총액 파악. 자동화 대체 검토 없음.'},{score:3,desc:'인건비 비중 관리. 자동화 가능 공정 식별.'},{score:4,desc:'단계적 자동화 도입. 외국인 인력 교육 체계화.'},{score:5,desc:'핵심 공정 자동화 완료. 인건비 30% 절감 달성.'}], ai_trigger:{threshold:2,warning:'labor_cost_high'} },
        { id:'agri_2_3', label:'폐기물·부산물 활용', type:'bars', question:'농업 부산물(줄기·분뇨 등)의 퇴비화·재활용 여부 및 추가 수익원으로의 전환 수준을 갖추고 있습니까?', scale:[{score:1,desc:'부산물 전량 폐기. 재활용 개념 없음.'},{score:2,desc:'일부 퇴비화. 체계적 활용 없음.'},{score:3,desc:'부산물 퇴비화 100%. 내부 활용 완료.'},{score:4,desc:'부산물 외부 판매. 추가 수익원 확보.'},{score:5,desc:'부산물 고부가가치 상품화. 순환 농업 완전 실현.'}], ai_trigger:{threshold:2,warning:'byproduct_wasted'} },
        { id:'agri_2_4', label:'에너지 비용 관리', type:'bars', question:'온실 난방·냉방, 양수기 가동 등 에너지 비용이 총 원가에서 차지하는 비중 및 절감 노력이 이루어지고 있습니까?', scale:[{score:1,desc:'에너지 비용 모니터링 없음. 고지서만 확인.'},{score:2,desc:'월별 에너지 비용 집계. 절감 노력 없음.'},{score:3,desc:'에너지 비용 비중 관리. 절감 목표 수립.'},{score:4,desc:'에너지 효율화 설비 도입. 태양광 자가발전 활용.'},{score:5,desc:'에너지 자립률 50% 이상. 탄소중립 농장 실현.'}], ai_trigger:{threshold:2,warning:'energy_cost_high'} },
      ]
    },
    {
      id: 'agri_channel',
      label: '유통 판로 및 브랜드',
      icon: '🏪',
      items: [
        { id:'agri_3_1', label:'직거래 비중 및 유통 단계', type:'bars', question:'도매상·중간 유통업체를 거치지 않는 직거래 비중 및 채널별 순마진율을 관리하고 있습니까?', scale:[{score:1,desc:'100% 도매 출하. 직거래 경험 없음.'},{score:2,desc:'직거래 시도 중. 비중 10% 미만.'},{score:3,desc:'직거래 비중 30% 이상. 채널별 마진 파악.'},{score:4,desc:'직거래 50% 이상. 온라인 직판 채널 운영.'},{score:5,desc:'직거래 70% 이상. 다채널 직판 + 구독 모델 운영.'}], ai_trigger:{threshold:2,warning:'direct_trade_low'} },
        { id:'agri_3_2', label:'친환경·유기농 인증 활용', type:'bars', question:'GAP, 유기농, 친환경 인증 보유 여부 및 이를 프리미엄 가격 책정에 실제로 활용하고 있습니까?', scale:[{score:1,desc:'인증 없음. 일반 농산물로만 판매.'},{score:2,desc:'인증 보유하나 가격 차별화 미활용.'},{score:3,desc:'인증 기반 프리미엄 가격 책정. 일부 채널 적용.'},{score:4,desc:'인증 마케팅 적극 활용. 프리미엄 채널 전용 상품 운영.'},{score:5,desc:'인증 포트폴리오 완비. 프리미엄 브랜드 구축 완료.'}], ai_trigger:{threshold:2,warning:'certification_unused'} },
        { id:'agri_3_3', label:'계절 수급 변동 대응', type:'bars', question:'비수기 매출 확보 전략(저장·가공·수출) 및 수확기 집중 출하로 인한 가격 하락 방어 방안을 보유하고 있습니까?', scale:[{score:1,desc:'수확기 전량 출하. 가격 하락 무방비.'},{score:2,desc:'일부 저장 후 출하. 가격 방어 전략 없음.'},{score:3,desc:'저장·가공을 통한 출하 시기 분산.'},{score:4,desc:'비수기 가공 상품 판매 + 수출로 가격 방어.'},{score:5,desc:'연중 안정 출하 체계. 계절성 영향 최소화.'}], ai_trigger:{threshold:2,warning:'seasonal_risk_high'} },
        { id:'agri_3_4', label:'상품화·브랜딩 역량', type:'bars', question:'원물 출하를 넘어 상품으로의 전환 역량(패키지 디자인·스토리텔링·상세페이지 품질)을 보유하고 있습니까?', scale:[{score:1,desc:'원물 그대로 출하. 브랜딩 개념 없음.'},{score:2,desc:'기본 포장재 사용. 브랜드 스토리 없음.'},{score:3,desc:'자체 브랜드 보유. 기본 상세페이지 운영.'},{score:4,desc:'스토리텔링 브랜딩 + SNS 마케팅 적극 활용.'},{score:5,desc:'프리미엄 브랜드 구축 완료. 팬덤 기반 반복 구매 체계.'}], ai_trigger:{threshold:2,warning:'branding_weak'} },
      ]
    },
    {
      id: 'agri_mgmt',
      label: '경영 시스템 및 정책 활용',
      icon: '📊',
      items: [
        { id:'agri_4_1', label:'영농 일지·경영 기록 디지털화', type:'bars', question:'수입·지출·작물 생육 기록·재고 데이터를 디지털 툴로 관리하고 있습니까?', scale:[{score:1,desc:'수기·기억 의존 100%. 디지털 기록 전무.'},{score:2,desc:'엑셀 일부 활용. 비정기 입력.'},{score:3,desc:'주요 경영 지표 디지털 기록. 정기 입력 체계.'},{score:4,desc:'영농 관리 앱 활용. 생육·재무 데이터 통합 관리.'},{score:5,desc:'스마트팜 + ERP 연동. 전 경영 데이터 자동 수집·분석.'}], ai_trigger:{threshold:2,warning:'record_digitalization_low'} },
        { id:'agri_4_2', label:'정부 지원 사업 활용', type:'bars', question:'스마트팜 보급 사업, 청년농 창업 지원, 농업 융자 등 정책 자금 활용 현황과 신청 역량을 보유하고 있습니까?', scale:[{score:1,desc:'정부 지원 사업 인지 없음. 미활용.'},{score:2,desc:'일부 지원 사업 인지. 신청 경험 없음.'},{score:3,desc:'주요 지원 사업 정기 신청. 일부 수혜.'},{score:4,desc:'지원 사업 적극 활용. 연간 수혜액 목표 관리.'},{score:5,desc:'지원 사업 전담 관리. 최대 수혜 달성. 컨설팅 역량 보유.'}], ai_trigger:{threshold:2,warning:'policy_support_underutilized'} },
        { id:'agri_4_3', label:'협동조합·공동브랜드 활용', type:'bars', question:'농협·작목반 등 협동조직을 통한 공동 출하·브랜딩의 수혜 활용도 및 고립 농가 탈피 노력이 이루어지고 있습니까?', scale:[{score:1,desc:'협동조직 미가입. 완전 고립 경영.'},{score:2,desc:'농협 가입. 공동 출하 일부 활용.'},{score:3,desc:'작목반 활동. 공동 브랜딩 참여.'},{score:4,desc:'협동조합 핵심 역할. 공동 마케팅 주도.'},{score:5,desc:'협동조합 리더십 + 공동브랜드 구축 완료. 규모의 경제 실현.'}], ai_trigger:{threshold:2,warning:'cooperative_unused'} },
        { id:'agri_4_4', label:'승계 및 후계자 육성', type:'bars', question:'고령 영농인의 은퇴 대비 후계자 유무, 농장 경영 매뉴얼화 및 기술 전수 체계 구축 여부를 갖추고 있습니까?', scale:[{score:1,desc:'후계자 없음. 승계 계획 전무.'},{score:2,desc:'후계자 후보 있으나 교육 체계 없음.'},{score:3,desc:'후계자 지정 + 기본 교육 진행 중.'},{score:4,desc:'농장 경영 매뉴얼화 완료. 단계적 권한 이양 중.'},{score:5,desc:'후계자 독립 경영 역량 완비. 기술 전수 체계 완성.'}], ai_trigger:{threshold:2,warning:'succession_plan_missing'} },
      ]
    },
  ],
  ai_analysis: [
    { trigger:'yield_untracked+quality_grade_low', level:'CRITICAL', msg:'수확량은 평균 이상인데 특·상 등급 비율이 낮다면 재배 환경 제어가 미흡한 것입니다. 스마트팜 환경 모니터링 고도화와 생육 데이터 기반 의사결정 체계 구축을 처방합니다.' },
    { trigger:'direct_trade_low+branding_weak', level:'HIGH', msg:'품질은 좋은데 직거래 비중이 낮다면 중간 유통 마진에 수익을 빼앗기고 있는 것입니다. 자체 온라인 직판 카테고리 구축과 로컬 마켓 직매장 활성화를 제안합니다.' },
    { trigger:'labor_cost_high+smartfarm_low', level:'HIGH', msg:'외국인 인력 비중이 높고 스마트팜 도입이 미흡하다면 인력난 심화 시 생산 중단 위험이 큽니다. 자동화 설비 투자와 정부 스마트팜 보급 사업 연계를 최우선 처방합니다.' },
  ],
};

if (typeof window !== 'undefined') window.INDUSTRY_AGRI_FOOD = INDUSTRY_AGRI_FOOD;
if (typeof module !== 'undefined') module.exports = INDUSTRY_AGRI_FOOD;
