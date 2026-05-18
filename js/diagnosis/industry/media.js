const INDUSTRY_MEDIA = {
  id: 'media',
  label: '미디어 및 엔터테인먼트',
  icon: '🎬',
  description: '영상 제작사·MCN·이벤트 기획·독립 레이블. IP 수익화 역량이 중요.',
  areas: [
    {
      id: 'med_ip',
      label: 'IP 자산 및 재무 수익성',
      icon: '💰',
      items: [
        { id:'me_1_1', label:'저작권·IP 수익 비중', type:'bars', question:'단순 용역 매출이 아닌 자체 IP에서 발생하는 로열티 비중을 관리하고 있습니까?', scale:[{score:1,desc:'자체 IP 없음. 용역 매출 100% 의존.'},{score:2,desc:'IP 일부 보유. 수익화 미실현.'},{score:3,desc:'IP 수익 비중 10% 이상. 로열티 수입 발생.'},{score:4,desc:'IP 수익 비중 30% 이상. 라이선싱 계약 다수.'},{score:5,desc:'IP 수익 50% 이상. 오리지널 콘텐츠 주력 수익원화.'}], ai_trigger:{threshold:2,warning:'ip_revenue_low'} },
        { id:'me_1_2', label:'프로젝트별 ROI 분석', type:'bars', question:'각 콘텐츠 제작 투입비 대비 광고 수익·협찬·배급 수익의 실질 이익 관리 여부를 갖추고 있습니까?', scale:[{score:1,desc:'프로젝트 ROI 파악 없음. 매출만 집계.'},{score:2,desc:'주요 프로젝트 ROI 대략 파악.'},{score:3,desc:'전 프로젝트 ROI 집계. 손익분기 인지.'},{score:4,desc:'프로젝트별 ROI 실시간 추적. 적자 즉각 대응.'},{score:5,desc:'ROI 대시보드. AI 기반 콘텐츠 투자 최적화.'}], ai_trigger:{threshold:2,warning:'project_roi_blind'} },
        { id:'me_1_3', label:'수익 정산 투명성', type:'bars', question:'아티스트·크리에이터와의 배분 정산 시스템 자동화 및 정산 보고서 제공 주기를 갖추고 있습니까?', scale:[{score:1,desc:'정산 기준 없음. 분쟁 빈번.'},{score:2,desc:'정산 기준 존재. 수동 계산 위주.'},{score:3,desc:'정산 자동화 일부. 월 보고서 제공.'},{score:4,desc:'정산 완전 자동화. 실시간 수익 확인 가능.'},{score:5,desc:'블록체인 기반 정산. 투명성 완전 보장.'}], ai_trigger:{threshold:2,warning:'settlement_transparency_weak'} },
        { id:'me_1_4', label:'외부 투자·현금흐름', type:'bars', question:'제작비 선투입에 따른 현금 고갈 리스크 관리 및 투자 유치 역량을 갖추고 있습니까?', scale:[{score:1,desc:'현금흐름 관리 없음. 제작비 조달 즉흥적.'},{score:2,desc:'현금 잔액 확인 수준. 투자 유치 경험 없음.'},{score:3,desc:'현금흐름 예측. 기본 투자자 네트워크 보유.'},{score:4,desc:'현금흐름 실시간 관리. 투자 유치 정기 실행.'},{score:5,desc:'다양한 자금 조달 포트폴리오. 현금 고갈 리스크 0%.'}], ai_trigger:{threshold:2,warning:'cashflow_risk_high'} },
      ]
    },
    {
      id: 'med_production',
      label: '제작 프로세스 및 기술',
      icon: '🎥',
      items: [
        { id:'me_2_1', label:'제작 리드타임 관리', type:'bars', question:'기획부터 최종 편집·송출까지의 소요 시간 표준화 및 마감 준수율을 관리하고 있습니까?', scale:[{score:1,desc:'리드타임 측정 없음. 마감 지연 빈번.'},{score:2,desc:'평균 제작 시간 대략 파악. 표준화 없음.'},{score:3,desc:'콘텐츠 유형별 리드타임 표준화. 마감 준수율 집계.'},{score:4,desc:'마감 준수율 90% 이상. 제작 캘린더 자동화.'},{score:5,desc:'AI 제작 스케줄 최적화. 마감 100% 달성 체계.'}], ai_trigger:{threshold:2,warning:'production_leadtime_high'} },
        { id:'me_2_2', label:'저작권 리스크 검수', type:'bars', question:'음원·폰트·초상권 등 법적 분쟁 리스크를 사전에 필터링하는 내부 검수 시스템을 보유하고 있습니까?', scale:[{score:1,desc:'저작권 검수 없음. 분쟁 위험 높음.'},{score:2,desc:'주요 음원만 확인. 체계적 검수 없음.'},{score:3,desc:'저작권 체크리스트 운영. 주요 리스크 사전 제거.'},{score:4,desc:'법무 검토 프로세스. 저작권 분쟁 0건.'},{score:5,desc:'AI 저작권 자동 검수. 실시간 리스크 탐지.'}], ai_trigger:{threshold:2,warning:'copyright_risk_unmanaged'} },
        { id:'me_2_3', label:'디지털 에셋 자산화', type:'bars', question:'원본 소스·미사용 컷 등의 체계적 DB화를 통한 후속 프로젝트 재활용 수준을 갖추고 있습니까?', scale:[{score:1,desc:'에셋 관리 없음. 매번 처음부터 제작.'},{score:2,desc:'일부 에셋 보관. 체계적 분류 없음.'},{score:3,desc:'에셋 DB 구축. 재활용률 30% 이상.'},{score:4,desc:'에셋 재활용률 60% 이상. 제작 효율 2배.'},{score:5,desc:'에셋 자동 분류 AI. 재활용률 80% 이상.'}], ai_trigger:{threshold:2,warning:'asset_db_missing'} },
        { id:'me_2_4', label:'기술 장비·S/W 현대화', type:'bars', question:'4K/8K 촬영 장비·고사양 편집 시스템·AI 제작 툴 도입을 통한 생산성 향상을 갖추고 있습니까?', scale:[{score:1,desc:'노후 장비 사용. AI 툴 미도입.'},{score:2,desc:'기본 장비 보유. 최신 툴 미활용.'},{score:3,desc:'4K 장비 + 기본 AI 편집 툴 도입.'},{score:4,desc:'최신 제작 환경 완비. AI 툴 적극 활용.'},{score:5,desc:'업계 최고 사양 장비 + AI 자동화. 제작 효율 최고.'}], ai_trigger:{threshold:2,warning:'equipment_outdated'} },
      ]
    },
    {
      id: 'med_hr',
      label: '인적 자원 및 창작 환경',
      icon: '🎭',
      items: [
        { id:'me_3_1', label:'아티스트·PD 전속 계약률', type:'bars', question:'핵심 창작자와의 장기 계약 비중 및 이탈 방지 매니지먼트 체계를 갖추고 있습니까?', scale:[{score:1,desc:'전속 계약 없음. 프리랜서 100% 의존.'},{score:2,desc:'일부 전속 계약. 이탈 방지 체계 없음.'},{score:3,desc:'핵심 창작자 전속 계약 50% 이상.'},{score:4,desc:'전속 계약 80% 이상. 이탈 방지 인센티브 운영.'},{score:5,desc:'전속 생태계 완성. 창작자 이탈 0% 달성 체계.'}], ai_trigger:{threshold:2,warning:'exclusive_contract_low'} },
        { id:'me_3_2', label:'인력 이탈 리스크 관리', type:'bars', question:'핵심 편집자·작가 이탈 시 백업 인력 풀 확보 여부를 갖추고 있습니까?', scale:[{score:1,desc:'백업 인력 없음. 핵심 이탈 시 제작 중단.'},{score:2,desc:'이탈 리스크 인지. 대응 체계 없음.'},{score:3,desc:'핵심 직무별 백업 지정. 인수인계 프로토콜.'},{score:4,desc:'백업 인력 풀 완비. 이탈 영향 최소화.'},{score:5,desc:'인력 이탈 0% 체계. 창작 연속성 완전 보장.'}], ai_trigger:{threshold:2,warning:'backup_talent_missing'} },
        { id:'me_3_3', label:'협업 문화·소통 효율', type:'bars', question:'감독·작가·제작팀 간의 비전 공유 및 협업 툴을 통한 의사소통 속도를 갖추고 있습니까?', scale:[{score:1,desc:'소통 체계 없음. 혼선 빈번.'},{score:2,desc:'메신저 위주 소통. 협업 툴 없음.'},{score:3,desc:'협업 툴 도입. 프로젝트 히스토리 관리.'},{score:4,desc:'실시간 협업 환경. 의사결정 속도 2배.'},{score:5,desc:'AI 협업 지원. 창작 효율 업계 최고.'}], ai_trigger:{threshold:2,warning:'collaboration_inefficient'} },
        { id:'me_3_4', label:'창의적 성과 보상', type:'bars', question:'콘텐츠 흥행 시 창작자에게 주어지는 인센티브 구조의 명확성을 갖추고 있습니까?', scale:[{score:1,desc:'성과 보상 없음. 고정급만 지급.'},{score:2,desc:'대표 재량 보너스. 기준 불명확.'},{score:3,desc:'흥행 성과 기반 인센티브 기준 문서화.'},{score:4,desc:'성과 자동 산출 + 즉각 지급 체계.'},{score:5,desc:'성과 보상 완전 자동화. 창작 동기 최고 수준.'}], ai_trigger:{threshold:2,warning:'creative_reward_unclear'} },
      ]
    },
    {
      id: 'med_fandom',
      label: '채널 영향력 및 팬덤',
      icon: '⭐',
      items: [
        { id:'me_4_1', label:'팬덤 참여·충성도', type:'bars', question:'구독자 대비 시청 지속 시간·댓글 수 등 팬덤의 실질적 화력(Engagement)을 관리하고 있습니까?', scale:[{score:1,desc:'팬덤 지표 없음. 구독자 수만 집계.'},{score:2,desc:'시청 시간 대략 파악. 팬덤 분석 없음.'},{score:3,desc:'팬덤 지표 정기 집계. 참여율 목표 설정.'},{score:4,desc:'팬덤 참여율 업계 평균 이상. 충성 팬 관리 체계.'},{score:5,desc:'팬덤 커뮤니티 자산화. 팬덤이 콘텐츠 제작에 참여.'}], ai_trigger:{threshold:2,warning:'fandom_engagement_low'} },
        { id:'me_4_2', label:'글로벌 확장성', type:'bars', question:'해외 시청자 비중 및 다국어 자막·더빙·글로벌 플랫폼 진출 역량을 갖추고 있습니까?', scale:[{score:1,desc:'글로벌 진출 계획 없음. 국내 시장만 집중.'},{score:2,desc:'해외 시청자 일부. 다국어 대응 없음.'},{score:3,desc:'영문 자막 제공. 글로벌 플랫폼 일부 입점.'},{score:4,desc:'다국어 자막·더빙. 글로벌 매출 20% 이상.'},{score:5,desc:'글로벌 멀티 플랫폼 완전 진출. 해외 매출 40% 이상.'}], ai_trigger:{threshold:2,warning:'global_expansion_weak'} },
        { id:'me_4_3', label:'광고·스폰서십 유치', type:'bars', question:'채널 영향력을 기반으로 한 직접 광고(PPL) 및 브랜드 협업 수주 경쟁력을 갖추고 있습니까?', scale:[{score:1,desc:'광고 유치 없음. 플랫폼 광고 수익만 의존.'},{score:2,desc:'소규모 PPL 일부. 브랜드 협업 없음.'},{score:3,desc:'정기 PPL + 브랜드 협업 계약 보유.'},{score:4,desc:'광고 매출 비중 30% 이상. 직접 영업 체계.'},{score:5,desc:'브랜드 광고 파트너십 완성. 광고 매출 안정화.'}], ai_trigger:{threshold:2,warning:'sponsorship_revenue_low'} },
        { id:'me_4_4', label:'원 소스 멀티 유즈(OSMU)', type:'bars', question:'영상 IP를 웹툰·굿즈·오프라인 전시 등으로 확장하여 수익을 극대화하는 능력을 갖추고 있습니까?', scale:[{score:1,desc:'OSMU 개념 없음. 단일 채널 수익만 존재.'},{score:2,desc:'OSMU 검토 중. 미실행.'},{score:3,desc:'굿즈 또는 웹툰 등 1개 확장 실행.'},{score:4,desc:'OSMU 2개 이상 확장. IP 수익 다각화.'},{score:5,desc:'IP 생태계 완성. OSMU 수익 30% 이상.'}], ai_trigger:{threshold:2,warning:'osmu_not_utilized'} },
      ]
    },
  ],
  ai_analysis: [
    { trigger:'ip_revenue_low+project_roi_blind', level:'CRITICAL', msg:'매출은 크지만 자체 IP 비중이 낮다면 하청 기지로 전락합니다. 오리지널 콘텐츠 기획 비중을 연간 30% 이상 확보하는 전략적 투자를 처방합니다.' },
    { trigger:'fandom_engagement_low+global_expansion_weak', level:'HIGH', msg:'구독자는 늘지만 시청 지속 시간이 짧다면 콘텐츠 매력도 하락입니다. 숏폼 강화 및 초반 3초 후킹 전략 재설계를 제안합니다.' },
    { trigger:'production_leadtime_high+equipment_outdated', level:'HIGH', msg:'제작 리드타임이 길고 장비가 노후화되었다면 인건비 낭비입니다. AI 편집 툴 도입 및 클라우드 협업 환경 구축을 처방합니다.' },
  ],
};
if (typeof window !== 'undefined') window.INDUSTRY_MEDIA = INDUSTRY_MEDIA;
if (typeof module !== 'undefined') module.exports = INDUSTRY_MEDIA;
