const BM_ADVERTISING = {
  id: 'advertising',
  label: '광고 기반 (Advertising)',
  icon: '📢',
  description: '트래픽을 모으고 해당 트래픽에 관심 있는 광고주에게 광고 기회를 판매하는 모델. 미디어, SNS, 커뮤니티, 무료 앱 등이 해당.',
  keyMetrics: ['DAU/MAU', 'eCPM', '광고주 갱신율', '광고-콘텐츠 균형'],
  areas: [
    {
      id: 'adv_audience',
      label: '트래픽 품질 및 오디언스 자산',
      icon: '👥',
      items: [
        { id:'adv_1_1', label:'MAU/DAU 및 성장 추이', type:'bars', question:'월간/일간 활성 사용자 수의 지속적 우상향 여부 및 Stickiness(DAU/MAU 비율)를 측정하고 있습니까?', scale:[{score:1,desc:'MAU·DAU 측정 없음. 방문자 수만 대략 파악.'},{score:2,desc:'월간 방문자 집계. DAU·Stickiness 미측정.'},{score:3,desc:'MAU·DAU 월 단위 측정. Stickiness 목표 설정.'},{score:4,desc:'실시간 MAU·DAU 대시보드. Stickiness 20% 이상 유지.'},{score:5,desc:'코호트별 Stickiness 분석. AI 기반 재방문 유도 자동화.'}], ai_trigger:{threshold:2,warning:'mau_stagnant'} },
        { id:'adv_1_2', label:'오디언스 데이터 품질', type:'bars', question:'유저 행동 데이터(관심사·체류 시간·클릭 패턴)의 수집 정교함과 세그먼트화 수준을 확보하고 있습니까?', scale:[{score:1,desc:'유저 데이터 수집 없음. 타겟팅 불가.'},{score:2,desc:'기본 인구통계 데이터만 수집.'},{score:3,desc:'행동 데이터 수집. 기본 세그먼트 분류.'},{score:4,desc:'정밀 세그먼트 + 관심사 기반 타겟팅 가능.'},{score:5,desc:'AI 기반 실시간 오디언스 세그먼트. 광고주 타겟팅 정밀도 최고 수준.'}], ai_trigger:{threshold:2,warning:'audience_data_weak'} },
        { id:'adv_1_3', label:'콘텐츠·서비스 차별성', type:'bars', question:'트래픽을 지속적으로 유인하는 독보적인 콘텐츠 또는 서비스 가치를 보유하고 있습니까?', scale:[{score:1,desc:'차별화 콘텐츠 없음. 유사 서비스와 동일.'},{score:2,desc:'일부 차별화 요소 존재. 경쟁사 모방 용이.'},{score:3,desc:'특정 분야 전문성 보유. 충성 유저 일부 확보.'},{score:4,desc:'독보적 콘텐츠 자산. 타 플랫폼 대체 불가.'},{score:5,desc:'업계 표준 콘텐츠 플랫폼 포지셔닝. 강력한 네트워크 효과.'}], ai_trigger:{threshold:2,warning:'content_differentiation_weak'} },
        { id:'adv_1_4', label:'유저 체류 시간 및 깊이', type:'bars', question:'단순 방문이 아닌 깊이 있는 소비(스크롤 깊이·세션 시간·페이지뷰)를 하는지 측정하고 있습니까?', scale:[{score:1,desc:'체류 시간 측정 없음. 방문 수만 집계.'},{score:2,desc:'평균 세션 시간 집계. 깊이 분석 없음.'},{score:3,desc:'세션 시간 + 페이지뷰 + 이탈률 종합 분석.'},{score:4,desc:'콘텐츠별 체류 깊이 분석. 저성과 콘텐츠 즉각 개선.'},{score:5,desc:'AI 기반 유저 인게이지먼트 최적화. 체류 시간 자동 극대화.'}], ai_trigger:{threshold:2,warning:'engagement_depth_low'} },
      ]
    },
    {
      id: 'adv_product',
      label: '광고 상품 및 인벤토리',
      icon: '🎯',
      items: [
        { id:'adv_2_1', label:'광고 인벤토리 규모 및 다양성', type:'bars', question:'디스플레이·네이티브·동영상·스폰서십 등 다양한 광고 포맷 보유 현황을 갖추고 있습니까?', scale:[{score:1,desc:'단일 배너 광고만 존재. 인벤토리 극소.'},{score:2,desc:'2~3개 기본 포맷 보유. 다양성 부족.'},{score:3,desc:'디스플레이·네이티브 등 4개 이상 포맷 운영.'},{score:4,desc:'동영상·스폰서십 포함 풀 포맷 인벤토리.'},{score:5,desc:'프리미엄 인벤토리 패키지 설계. 광고주 맞춤 제안 가능.'}], ai_trigger:{threshold:2,warning:'inventory_limited'} },
        { id:'adv_2_2', label:'eCPM(1천 노출당 수익) 관리', type:'bars', question:'광고 노출 1,000회당 실제 수취하는 단가의 추이와 최적화 노력이 이루어지고 있습니까?', scale:[{score:1,desc:'eCPM 개념 없음. 광고 수익 총액만 파악.'},{score:2,desc:'eCPM 집계하나 최적화 없음.'},{score:3,desc:'eCPM 월 단위 추적. 업계 평균 비교.'},{score:4,desc:'포맷별·시간대별 eCPM 최적화 진행 중.'},{score:5,desc:'AI 기반 실시간 eCPM 최적화. 프리미엄 인벤토리 비중 확대.'}], ai_trigger:{threshold:2,warning:'ecpm_declining'} },
        { id:'adv_2_3', label:'광고 타겟팅 정밀도', type:'bars', question:'광고주가 원하는 오디언스에 정확히 도달할 수 있는 타겟팅 기술 수준을 보유하고 있습니까?', scale:[{score:1,desc:'타겟팅 없음. 전체 노출만 가능.'},{score:2,desc:'기본 인구통계 타겟팅만 가능.'},{score:3,desc:'관심사 + 행동 기반 타겟팅 제공.'},{score:4,desc:'정밀 타겟팅 + 리타겟팅 + 유사 타겟 확장.'},{score:5,desc:'AI 기반 초정밀 타겟팅. 광고주 ROAS 최고 수준 보장.'}], ai_trigger:{threshold:2,warning:'targeting_imprecise'} },
        { id:'adv_2_4', label:'프로그래매틱 광고 대응', type:'bars', question:'DSP·SSP 연동을 통한 자동화된 광고 거래 체계 구축 여부를 갖추고 있습니까?', scale:[{score:1,desc:'프로그래매틱 개념 없음. 직접 영업만 가능.'},{score:2,desc:'기본 광고 네트워크 일부 연동.'},{score:3,desc:'SSP 연동 완료. 자동화 거래 일부 활성화.'},{score:4,desc:'주요 DSP·SSP 완전 연동. 실시간 입찰 최적화.'},{score:5,desc:'프로그래매틱 + 직접 영업 하이브리드 최적화. 인벤토리 수익 최대화.'}], ai_trigger:{threshold:2,warning:'programmatic_not_ready'} },
      ]
    },
    {
      id: 'adv_advertiser',
      label: '광고주 관계 및 매출',
      icon: '🤝',
      items: [
        { id:'adv_3_1', label:'광고주 수 및 집중도', type:'bars', question:'전체 광고 매출 중 상위 광고주 의존도와 광고주 다변화 수준을 관리하고 있습니까?', scale:[{score:1,desc:'광고주 1~2개 집중. 이탈 시 매출 급감.'},{score:2,desc:'상위 3개 광고주 매출 70% 이상.'},{score:3,desc:'광고주 다변화 진행 중. 집중도 50% 이하.'},{score:4,desc:'광고주 20개 이상. 집중도 30% 이하.'},{score:5,desc:'광고주 포트폴리오 완전 분산. 단일 이탈 영향 최소화.'}], ai_trigger:{threshold:2,warning:'advertiser_concentration'} },
        { id:'adv_3_2', label:'광고주 갱신율(Renewal)', type:'bars', question:'광고 캠페인을 재집행하는 광고주의 비중과 만족도를 관리하고 있습니까?', scale:[{score:1,desc:'갱신율 측정 없음. 매번 신규 광고주 개척.'},{score:2,desc:'갱신율 50% 미만. 이탈 원인 파악 없음.'},{score:3,desc:'갱신율 60% 이상. 기본 성과 리포트 제공.'},{score:4,desc:'갱신율 75% 이상. 광고주 성과 최적화 지원.'},{score:5,desc:'갱신율 85% 이상. 광고주 성공 파트너십 체계 완성.'}], ai_trigger:{threshold:2,warning:'renewal_rate_low'} },
        { id:'adv_3_3', label:'셀프서브 광고 플랫폼', type:'bars', question:'중소 광고주가 직접 광고를 집행할 수 있는 자동화 시스템 보유 여부를 갖추고 있습니까?', scale:[{score:1,desc:'셀프서브 없음. 모든 광고 수동 처리.'},{score:2,desc:'기초 셀프서브 UI 존재. 기능 제한.'},{score:3,desc:'셀프서브 플랫폼 운영. 중소 광고주 자립 집행 가능.'},{score:4,desc:'셀프서브 + AI 최적화 제안 기능 탑재.'},{score:5,desc:'완전 자동화 셀프서브. 중소 광고주 매출 비중 40% 이상.'}], ai_trigger:{threshold:2,warning:'selfserve_missing'} },
        { id:'adv_3_4', label:'광고 효과 리포팅', type:'bars', question:'광고주에게 제공하는 성과 데이터(CTR·CVR·ROAS)의 투명성과 정밀도를 확보하고 있습니까?', scale:[{score:1,desc:'성과 데이터 제공 없음. 노출 수만 보고.'},{score:2,desc:'기본 CTR 리포트 제공. CVR·ROAS 미제공.'},{score:3,desc:'CTR·CVR·ROAS 표준 리포트 정기 제공.'},{score:4,desc:'실시간 성과 대시보드 광고주 직접 접근 가능.'},{score:5,desc:'AI 기반 성과 인사이트 + 자동 최적화 제안 리포트.'}], ai_trigger:{threshold:2,warning:'reporting_inadequate'} },
      ]
    },
    {
      id: 'adv_balance',
      label: '유저 경험과 수익 균형',
      icon: '⚖️',
      items: [
        { id:'adv_4_1', label:'광고-콘텐츠 균형(Ad Load)', type:'bars', question:'광고 과다 노출로 인한 유저 이탈을 방지하는 광고 밀도(Ad Load) 관리가 이루어지고 있습니까?', scale:[{score:1,desc:'Ad Load 개념 없음. 광고 최대 노출.'},{score:2,desc:'Ad Load 측정하나 유저 이탈 상관관계 미분석.'},{score:3,desc:'Ad Load 기준 설정. 유저 이탈률 모니터링.'},{score:4,desc:'Ad Load 최적 구간 A/B 테스트 운영 중.'},{score:5,desc:'AI 기반 유저별 Ad Load 개인화. 이탈 최소화 + 수익 최대화.'}], ai_trigger:{threshold:2,warning:'ad_load_excessive'} },
        { id:'adv_4_2', label:'구독·프리미엄 하이브리드', type:'bars', question:'광고 없는 유료 버전과 광고 포함 무료 버전의 병행 모델 설계가 구축되어 있습니까?', scale:[{score:1,desc:'광고 모델만 존재. 구독 옵션 없음.'},{score:2,desc:'구독 모델 검토 중. 미출시.'},{score:3,desc:'기본 구독 플랜 운영. 전환율 관리 중.'},{score:4,desc:'광고·구독 하이브리드 최적화. 전환 퍼널 설계 완료.'},{score:5,desc:'하이브리드 모델 완성. 구독 매출 비중 30% 이상.'}], ai_trigger:{threshold:2,warning:'hybrid_model_missing'} },
        { id:'adv_4_3', label:'광고 품질 관리', type:'bars', question:'저품질·사기 광고 필터링 및 유저 경험을 해치는 광고 차단 체계를 보유하고 있습니까?', scale:[{score:1,desc:'광고 품질 심사 없음. 모든 광고 무조건 게재.'},{score:2,desc:'기본 금지 광고 목록 존재. 자동화 없음.'},{score:3,desc:'광고 심사 프로세스 운영. 주요 품질 기준 적용.'},{score:4,desc:'자동 품질 필터링 + 유저 신고 시스템 가동.'},{score:5,desc:'AI 기반 실시간 광고 품질 모니터링. 사기 광고 0% 달성.'}], ai_trigger:{threshold:2,warning:'ad_quality_unmanaged'} },
        { id:'adv_4_4', label:'비광고 수익 다각화', type:'bars', question:'광고 외 커머스·데이터 라이선싱 등 추가 수익원 확보 노력이 이루어지고 있습니까?', scale:[{score:1,desc:'광고 수익 100% 의존. 다각화 없음.'},{score:2,desc:'비광고 수익 검토 중. 미실행.'},{score:3,desc:'제휴·커머스 등 비광고 수익 10% 이상.'},{score:4,desc:'데이터 라이선싱 + 커머스 + 광고 복합 수익 구조.'},{score:5,desc:'비광고 수익 30% 이상. 광고 의존도 리스크 최소화.'}], ai_trigger:{threshold:2,warning:'revenue_diversification_low'} },
      ]
    },
  ],
  ai_analysis: [
    { trigger:'mau_stagnant+ecpm_declining', level:'CRITICAL', msg:'MAU는 성장 중이나 eCPM이 하락하고 있다면 트래픽의 질이 떨어지는 것입니다. 오디언스 세그먼트 고도화와 프리미엄 인벤토리 확대를 처방합니다.' },
    { trigger:'ad_load_excessive+mau_stagnant', level:'CRITICAL', msg:'광고 매출은 오르는데 DAU가 감소한다면 광고 과다 노출이 유저를 쫓아내는 상황입니다. Ad Load 조정과 프리미엄 구독 하이브리드 모델 도입을 최우선 처방합니다.' },
    { trigger:'advertiser_concentration+renewal_rate_low', level:'HIGH', msg:'소수 광고주에 매출이 집중되어 있는데 갱신율이 낮다면 특정 광고주 이탈 시 매출 급감 위험입니다. 셀프서브 광고 플랫폼 구축으로 중소 광고주 기반을 확대하는 전략을 제안합니다.' },
  ],
};

if (typeof window !== 'undefined') window.BM_ADVERTISING = BM_ADVERTISING;
if (typeof module !== 'undefined') module.exports = BM_ADVERTISING;
