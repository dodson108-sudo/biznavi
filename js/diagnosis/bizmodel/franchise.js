const BM_FRANCHISE = {
  id: 'franchise',
  label: '프랜차이즈',
  icon: '🏪',
  description: '본부가 표준화된 운영 체계를 가맹점에 제공하고 로열티를 수취하는 모델. 폐점률·갱신율·BEP가 핵심.',
  keyMetrics: ['폐점률', '갱신율', 'BEP 기간', '가맹점 만족도'],
  areas: [
    {
      id: 'frc_standard',
      label: '브랜드·표준화 체계',
      icon: '📋',
      items: [
        { id:'fr_1_1', label:'브랜드 인지도·신뢰도', type:'bars', question:'소비자에게 인식되는 브랜드의 위상을 갖추고 있습니까?', scale:[{score:1,desc:'브랜드 인지도 없음. 소비자 인식 전무.'},{score:2,desc:'지역 일부 인지도. 전국 인지도 없음.'},{score:3,desc:'주요 상권 인지도 확보. SNS 팔로워 성장 중.'},{score:4,desc:'전국 인지도 보유. 브랜드 신뢰도 높음.'},{score:5,desc:'카테고리 대표 브랜드. 소비자가 먼저 찾는 구조.'}], ai_trigger:{threshold:2,warning:'brand_awareness_low'} },
        { id:'fr_1_2', label:'운영 매뉴얼 완성도', type:'bars', question:'구두 전달이 아닌 완전한 문서·영상화 수준을 갖추고 있습니까?', scale:[{score:1,desc:'매뉴얼 없음. 구두 전달에 100% 의존.'},{score:2,desc:'기본 텍스트 매뉴얼. 영상화 없음.'},{score:3,desc:'텍스트+사진 매뉴얼 완비. 주요 공정 영상화.'},{score:4,desc:'전 공정 동영상 SOP. QR코드 현장 부착.'},{score:5,desc:'LMS 기반 매뉴얼. 이수율 자동 추적 + 갱신 체계.'}], ai_trigger:{threshold:2,warning:'manual_incomplete'} },
        { id:'fr_1_3', label:'품질 균일성 유지', type:'bars', question:'전 점포의 맛과 서비스가 일정하게 유지되는지 관리하고 있습니까?', scale:[{score:1,desc:'점포별 품질 편차 심각. 브랜드 신뢰 붕괴 위험.'},{score:2,desc:'주요 점포 품질 관리. 지방 점포 편차 존재.'},{score:3,desc:'전 점포 품질 기준 적용. 편차 허용 범위 내.'},{score:4,desc:'슈퍼바이저 정기 점검. 편차 즉각 교정.'},{score:5,desc:'미스터리 쇼퍼 + AI 품질 모니터링. 편차 0% 달성.'}], ai_trigger:{threshold:2,warning:'quality_inconsistency'} },
        { id:'fr_1_4', label:'슈퍼바이저 지원 체계', type:'bars', question:'정기 방문을 통한 피드백 및 현장 지원 역량을 갖추고 있습니까?', scale:[{score:1,desc:'슈퍼바이저 없음. 본부 지원 전무.'},{score:2,desc:'민원 발생 시에만 방문.'},{score:3,desc:'월 1회 이상 정기 방문. 피드백 보고서 제공.'},{score:4,desc:'격주 방문 + 원격 모니터링 병행.'},{score:5,desc:'전담 슈퍼바이저 + 실시간 원격 지원 완성.'}], ai_trigger:{threshold:2,warning:'supervisor_support_weak'} },
      ]
    },
    {
      id: 'frc_acquisition',
      label: '가맹점 모집 및 개설',
      icon: '🎯',
      items: [
        { id:'fr_2_1', label:'모집 채널 다양성', type:'bars', question:'지인 소개를 넘어선 전문화된 마케팅 채널 확보를 갖추고 있습니까?', scale:[{score:1,desc:'지인 소개 100% 의존. 능동 모집 없음.'},{score:2,desc:'소개 위주. 온라인 채널 미활용.'},{score:3,desc:'프랜차이즈 박람회 + 온라인 광고 병행.'},{score:4,desc:'다채널 모집. 인바운드 비중 50% 이상.'},{score:5,desc:'인바운드 자동화. 예비 창업자가 먼저 문의하는 구조.'}], ai_trigger:{threshold:2,warning:'recruitment_channel_single'} },
        { id:'fr_2_2', label:'수익성 검증 데이터', type:'bars', question:'예비 창업자에게 제공하는 데이터의 투명성을 갖추고 있습니까?', scale:[{score:1,desc:'수익성 데이터 없음. 구두 설명만 가능.'},{score:2,desc:'평균 매출만 제공. 비용·순이익 미공개.'},{score:3,desc:'평균 매출·비용·순이익 공개. 정보공개서 완비.'},{score:4,desc:'점포별 실제 데이터 제공. 독립 검증 가능.'},{score:5,desc:'완전 투명한 수익성 데이터. 공정거래위 우수 공개 인증.'}], ai_trigger:{threshold:2,warning:'profitability_data_opaque'} },
        { id:'fr_2_3', label:'입지·인테리어 지원', type:'bars', question:'상권 분석 및 점포 개설 지원의 전문성을 갖추고 있습니까?', scale:[{score:1,desc:'입지 지원 없음. 가맹점 자력 결정.'},{score:2,desc:'기본 상권 정보만 제공.'},{score:3,desc:'전문 상권 분석 + 인테리어 가이드 제공.'},{score:4,desc:'입지 선정 전담팀 + 시공 관리 완전 지원.'},{score:5,desc:'AI 상권 분석 + 인테리어 턴키 지원 완성.'}], ai_trigger:{threshold:2,warning:'location_support_weak'} },
        { id:'fr_2_4', label:'초기 안착 지원', type:'bars', question:'개설 후 3개월 이내의 집중적인 지원 시스템을 갖추고 있습니까?', scale:[{score:1,desc:'개설 후 지원 없음. 가맹점 자력 운영.'},{score:2,desc:'개설 초기 1~2회 방문만 실시.'},{score:3,desc:'개설 후 1개월 집중 지원. 매출 목표 공동 설정.'},{score:4,desc:'3개월 집중 지원 + 주간 점검 체계.'},{score:5,desc:'6개월 집중 안착 프로그램. BEP 조기 달성 지원.'}], ai_trigger:{threshold:2,warning:'initial_support_insufficient'} },
      ]
    },
    {
      id: 'frc_support',
      label: '가맹점 운영 지원',
      icon: '🤝',
      items: [
        { id:'fr_3_1', label:'정기 교육 체계', type:'bars', question:'점주 및 직원을 위한 체계적인 교육 프로그램을 갖추고 있습니까?', scale:[{score:1,desc:'교육 없음. 개설 후 방치.'},{score:2,desc:'개설 교육만 실시. 정기 교육 없음.'},{score:3,desc:'분기 1회 정기 교육. 신메뉴·운영 교육.'},{score:4,desc:'월 1회 온·오프라인 교육. LMS 병행.'},{score:5,desc:'상시 교육 플랫폼. 이수율 자동 추적 + 성과 연동.'}], ai_trigger:{threshold:2,warning:'training_system_weak'} },
        { id:'fr_3_2', label:'물류 공급 안정성', type:'bars', question:'합리적인 가격과 안정적인 식자재 공급 역량을 갖추고 있습니까?', scale:[{score:1,desc:'물류 체계 없음. 가맹점 개별 소싱.'},{score:2,desc:'기본 물류 제공. 단가 불합리 불만 존재.'},{score:3,desc:'물류 체계 완비. 단가 투명성 확보.'},{score:4,desc:'물류 단가 시장 대비 10% 이상 절감. 안정적 공급.'},{score:5,desc:'물류 최적화 완성. 가맹점이 물류 혜택에 만족.'}], ai_trigger:{threshold:2,warning:'supply_chain_unstable'} },
        { id:'fr_3_3', label:'본부 마케팅 지원', type:'bars', question:'브랜드 인지도를 높이는 전국 단위 캠페인을 갖추고 있습니까?', scale:[{score:1,desc:'본부 마케팅 없음. 가맹점 자력 홍보.'},{score:2,desc:'간헐적 SNS 홍보만 실시.'},{score:3,desc:'분기 1회 이상 전국 마케팅 캠페인.'},{score:4,desc:'월 단위 마케팅 + 지역 맞춤 지원.'},{score:5,desc:'통합 마케팅 플랫폼. 전국+지역 동시 최적화.'}], ai_trigger:{threshold:2,warning:'hq_marketing_support_weak'} },
        { id:'fr_3_4', label:'민원 처리·상생', type:'bars', question:'가맹점 불만 사항에 대한 신속한 해결 루프를 갖추고 있습니까?', scale:[{score:1,desc:'민원 처리 체계 없음. 불만 방치.'},{score:2,desc:'민원 접수만 가능. 해결 지연 빈번.'},{score:3,desc:'민원 처리 SOP. 48시간 내 해결.'},{score:4,desc:'가맹점 협의회 운영. 민원 24시간 내 해결.'},{score:5,desc:'상생 위원회 + 민원 AI 자동 분류. 만족도 최고.'}], ai_trigger:{threshold:2,warning:'franchisee_complaint_unresolved'} },
      ]
    },
    {
      id: 'frc_sustainability',
      label: '수익 구조 및 상생',
      icon: '💰',
      items: [
        { id:'fr_4_1', label:'로열티·마진 적정성', type:'bars', question:'본부와 가맹점이 공생할 수 있는 구조를 갖추고 있습니까?', scale:[{score:1,desc:'로열티 과다. 가맹점 수익 없음.'},{score:2,desc:'로열티 높음. 가맹점 불만 누적.'},{score:3,desc:'로열티 적정. 가맹점 평균 수익 확보.'},{score:4,desc:'로열티 최적화. 본부·가맹점 상호 이익.'},{score:5,desc:'공생 수익 구조 완성. 가맹점이 본부 성장에 기여.'}], ai_trigger:{threshold:2,warning:'royalty_structure_imbalanced'} },
        { id:'fr_4_2', label:'손익분기점(BEP) 기간', type:'bars', question:'가맹점이 투자비를 회수하는 기간의 적절성을 관리하고 있습니까?', scale:[{score:1,desc:'BEP 기간 파악 없음. 가맹점 손실 방치.'},{score:2,desc:'BEP 3년 이상. 가맹점 부담 과중.'},{score:3,desc:'BEP 2년 이내. 업계 평균 수준.'},{score:4,desc:'BEP 18개월 이내. 업계 최고 수준.'},{score:5,desc:'BEP 12개월 이내. 조기 수익화 달성 체계.'}], ai_trigger:{threshold:2,warning:'bep_period_too_long'} },
        { id:'fr_4_3', label:'가맹점 만족도·갱신율', type:'bars', question:'점주들의 사업 지속 의지 및 만족도 수준을 관리하고 있습니까?', scale:[{score:1,desc:'갱신율 측정 없음. 만족도 파악 불가.'},{score:2,desc:'갱신율 50% 미만. 불만 다수.'},{score:3,desc:'갱신율 70% 이상. 만족도 보통.'},{score:4,desc:'갱신율 85% 이상. 만족도 높음.'},{score:5,desc:'갱신율 95% 이상. 가맹점이 지인 추천.'}], ai_trigger:{threshold:2,warning:'renewal_rate_low'} },
        { id:'fr_4_4', label:'폐점률·분쟁 지표', type:'bars', question:'브랜드 안정성을 해치는 리스크 관리 수준을 갖추고 있습니까?', scale:[{score:1,desc:'폐점률 연 10% 이상. 분쟁 빈번.'},{score:2,desc:'폐점률 연 7% 이상. 분쟁 관리 미비.'},{score:3,desc:'폐점률 연 5% 이하. 분쟁 조기 해결.'},{score:4,desc:'폐점률 연 3% 이하. 분쟁 0건 목표.'},{score:5,desc:'폐점률 1% 이하. 업계 최고 안정성 달성.'}], ai_trigger:{threshold:2,warning:'closure_rate_high'} },
      ]
    },
  ],
  ai_analysis: [
    { trigger:'quality_inconsistency+manual_incomplete', level:'CRITICAL', msg:'매뉴얼 미흡으로 점포별 편차가 크면 브랜드 신뢰가 붕괴됩니다. 표준화를 최우선 처방합니다.' },
    { trigger:'bep_period_too_long+renewal_rate_low', level:'CRITICAL', msg:'BEP 기간이 너무 길고 갱신율이 낮으면 가맹점이 피해를 보는 구조입니다. 수익 모델 전면 재설계를 제안합니다.' },
    { trigger:'recruitment_channel_single+closure_rate_high', level:'HIGH', msg:'신규 모집은 활발하나 폐점률이 높으면 문어발식 자멸 구조입니다. 기존 점포 안정화를 우선 전략으로 처방합니다.' },
  ],
};
if (typeof window !== 'undefined') window.BM_FRANCHISE = BM_FRANCHISE;
if (typeof module !== 'undefined') module.exports = BM_FRANCHISE;
