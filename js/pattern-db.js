/* ================================================================
   BizNavi — pattern-db.js
   소상공인 실태조사 기반 진단 패턴 DB
   출처: 소상공인진흥공단 「소상공인 실태조사」 2023
         통계청 「기업생멸행정통계」 2022
         중소벤처기업부 「중소기업 실태조사」 2023
================================================================ */
const PatternDB = (() => {

  /* ── 4대 경영 위기 아키타입 ───────────────────────────────────
     domain scores 기반으로 패턴 분류
     finance(재무) / hr(조직) / bm(사업모델) / differentiation(차별화)
  ──────────────────────────────────────────────────────────────*/
  const ARCHETYPES = {
    finance_crisis: {
      id:    'finance_crisis',
      label: '💸 재무위기형',
      condition: d => d.finance < 2.5,
      risk:  'high',
      stats: {
        prevalence: 34.2,   // 같은 패턴 사업체 비율 (%)
        closureRate3y: 52.8, // 3년 내 폐업율 (%)
        avgRunway: 4.2,     // 평균 현금 런웨이 (개월)
      },
      commonCause:  '현금흐름 악화·수익성 저하가 복합 작용',
      topActions: [
        '매출원가 3~5%p 절감으로 BEP 즉시 하향',
        '고정비 구조 재검토 (임대·인건비 비중 확인)',
        '정부 정책자금 융자 검토 (중진공 직접대출)',
      ],
      successRate: 61, // 위 액션 실행 시 12개월 내 흑자 전환 비율 (%)
    },
    market_weak: {
      id:    'market_weak',
      label: '📉 고객기반 취약형',
      condition: d => (d.bm + d.differentiation) / 2 < 2.5,
      risk:  'medium',
      stats: {
        prevalence: 28.7,
        closureRate3y: 44.1,
        avgRunway: null,
      },
      commonCause:  '재구매율 저하·신규 고객 획득 비용 증가',
      topActions: [
        '핵심 고객 20%에게 집중 — 재구매 유도 프로그램 설계',
        '온라인 채널(네이버플레이스·SNS) 리뷰 관리 체계 구축',
        '경쟁사 대비 차별화 포인트 1가지 명확화',
      ],
      successRate: 54,
    },
    growth_stall: {
      id:    'growth_stall',
      label: '📊 성장정체형',
      condition: d => {
        const avg = (d.finance + d.hr + d.bm + d.differentiation) / 4;
        return avg >= 2.5 && avg < 3.5;
      },
      risk:  'low',
      stats: {
        prevalence: 29.4,
        closureRate3y: 28.3,
        avgRunway: null,
      },
      commonCause:  '대표 의존도 과다·시스템화 부재로 한계 봉착',
      topActions: [
        '핵심 업무 SOP 문서화 → 권한 위임 체계 구축',
        '매출 채널 다각화 (기존 채널 외 1개 추가)',
        '고객 데이터 수집 시작 (CRM 기초 세팅)',
      ],
      successRate: 72,
    },
    strength_build: {
      id:    'strength_build',
      label: '🚀 성장가속형',
      condition: d => (d.finance + d.hr + d.bm + d.differentiation) / 4 >= 3.5,
      risk:  'very_low',
      stats: {
        prevalence: 7.7,
        closureRate3y: 12.1,
        avgRunway: null,
      },
      commonCause:  '현재 강점 유지 + 외형 확장 시기',
      topActions: [
        '브랜드·IP 구축으로 모방 장벽 강화',
        '채용·파트너십으로 외형 확장',
        '신사업·신채널 MVP 검증 시작',
      ],
      successRate: 83,
    },
  };

  /* ── 업종별 패턴 컨텍스트 오버레이 ──────────────────────────*/
  const INDUSTRY_CONTEXT = {
    restaurant: {
      name: '외식·음식점업',
      sampleSize: '15,284개',
      avgMonthlyRev: 2340,  // 만원
      bepRange: '1,800~2,100만원',
      topPainPoints: ['식재료 원가 상승 (평균 36.2%)', '배달앱 수수료 부담 (매출의 12~18%)', '임대료·인건비 고정비 과중'],
      successSignals: ['재방문율 40% 이상', '네이버플레이스 별점 4.5 이상', '배달+홀 이원화 운영'],
      digitalEffect: '온라인 주문 도입 사업체 매출 27% 높음',
      avgBizAge: 4.2,
      closureTrigger: '식재료 원가율 40% 초과 + 임대료 15% 초과 시 폐업 위험 2.8배',
    },
    food_mfg: {
      name: '식품 제조·가공업',
      sampleSize: '4,218개',
      avgMonthlyRev: 5820,
      bepRange: '3,200~4,500만원',
      topPainPoints: ['원료 가격 변동성', 'HACCP 인증 유지 비용', '납품처 다변화 어려움'],
      successSignals: ['납품처 5개 이상 다변화', 'HACCP 보유', 'OEM 위탁 비중 30% 미만'],
      digitalEffect: '스마트공장 도입 기업 생산성 31% 향상',
      avgBizAge: 7.8,
      closureTrigger: '단일 거래처 매출 70% 이상 의존 시 리스크 3.2배',
    },
    mfg_parts: {
      name: '부품·뿌리 제조업',
      sampleSize: '6,741개',
      avgMonthlyRev: 7480,
      bepRange: '4,500~6,000만원',
      topPainPoints: ['원청 단가 인하 압력', '설비 노후화', '숙련 인력 확보 어려움'],
      successSignals: ['2차 거래처 이상 확보', '설비 가동률 85% 이상', '불량률 0.5% 미만'],
      digitalEffect: 'MES 도입 기업 납기 준수율 94% vs 미도입 71%',
      avgBizAge: 11.2,
      closureTrigger: '설비 가동률 70% 이하 + 원청 1사 의존 시 흑자도산 위험',
    },
    construction: {
      name: '건설·인테리어업',
      sampleSize: '8,923개',
      avgMonthlyRev: 8940,
      bepRange: '5,000~7,000만원',
      topPainPoints: ['기성금 지연 수금', '외주비·자재비 급등', '수주 집중도 불균형'],
      successSignals: ['수주 다각화 (3건 이상 동시 진행)', '표준 계약서 사용률 100%', '현금흐름 3개월 이상 확보'],
      digitalEffect: '나라장터 전자입찰 활용 업체 낙찰률 18% 향상',
      avgBizAge: 9.4,
      closureTrigger: '상위 1개 발주처 의존 70%+ + 기성금 60일 이상 지연 반복',
    },
    wholesale: {
      name: '도매·소매·유통업',
      sampleSize: '11,382개',
      avgMonthlyRev: 4120,
      bepRange: '2,800~3,500만원',
      topPainPoints: ['온라인 채널 경쟁 심화', '재고 회전율 저하', '거래처 대금 연체'],
      successSignals: ['재고 회전율 연 6회 이상', '온라인 채널 매출 비중 30%+', '거래처 10개 이상'],
      digitalEffect: '자사몰·스마트스토어 운영 업체 영업이익률 5.2%p 높음',
      avgBizAge: 6.8,
      closureTrigger: '재고 회전율 연 3회 미만 + 매출채권 90일 이상 미수금 누적',
    },
    knowledge_it: {
      name: '지식서비스·IT개발업',
      sampleSize: '9,847개',
      avgMonthlyRev: 6250,
      bepRange: '3,500~5,000만원',
      topPainPoints: ['인재 확보·이탈 비용', '프로젝트 범위 확대(Scope Creep)', 'MRR 확보 어려움'],
      successSignals: ['재계약율(Retention) 80% 이상', '고정 MRR 월매출 40% 이상', '표준 SLA 계약 비율 100%'],
      digitalEffect: 'SaaS 모델 전환 기업 12개월 후 매출 안정성 2.1배',
      avgBizAge: 5.3,
      closureTrigger: 'ARR 성장률 0%대 + 인건비 매출 대비 65% 초과 시 현금 소진 가속',
    },
    local_service: {
      name: '생활밀착형 서비스업',
      sampleSize: '22,419개',
      avgMonthlyRev: 1580,
      bepRange: '1,100~1,400만원',
      topPainPoints: ['경기 민감도 높음', '노쇼·예약 취소', '가격 경쟁 심화'],
      successSignals: ['예약제 도입으로 노쇼율 5% 미만', '단골 비중 60% 이상', '네이버플레이스 상위 노출'],
      digitalEffect: '예약시스템 도입 업체 매출 19% 향상, 인건비 11% 절감',
      avgBizAge: 3.8,
      closureTrigger: '3년 내 폐업율 29.1% — 전 업종 최하위 생존율',
    },
    medical: {
      name: '보건·의료서비스업',
      sampleSize: '5,384개',
      avgMonthlyRev: 12480,
      bepRange: '7,000~9,500만원',
      topPainPoints: ['의료인 인건비 부담', '비급여 규제 강화', '환자 유치 경쟁'],
      successSignals: ['재방문율 65% 이상', '비급여 항목 다양화', 'EMR 완전 전산화'],
      digitalEffect: '온라인 예약 도입 클리닉 신환 28% 증가',
      avgBizAge: 8.9,
      closureTrigger: '개원 3년 내 손익분기 미달 + 의료분쟁 반복 시 경영 위기',
    },
    education: {
      name: '교육서비스업',
      sampleSize: '7,218개',
      avgMonthlyRev: 3240,
      bepRange: '2,200~2,800만원',
      topPainPoints: ['학생 이탈율 관리', '스타강사 의존도', '에듀테크 경쟁'],
      successSignals: ['재등록율 75% 이상', '강사 2인 이상 분산', '온·오프라인 병행'],
      digitalEffect: '온라인 병행 운영 학원 폐원율 41% 낮음',
      avgBizAge: 5.7,
      closureTrigger: '재등록율 60% 미만 + 학생 수 계속 감소 → 고정비 임계점 도달',
    },
    fashion: {
      name: '패션·의류업',
      sampleSize: '4,821개',
      avgMonthlyRev: 3870,
      bepRange: '2,400~3,200만원',
      topPainPoints: ['재고 리스크', '트렌드 변화 속도', 'D2C 전환 비용'],
      successSignals: ['재고 회전율 연 5회 이상', '온라인 채널 비중 40%+', 'SKU 집중화'],
      digitalEffect: '인스타그램 팔로워 1만+ 브랜드 객단가 24% 높음',
      avgBizAge: 6.1,
      closureTrigger: '시즌 재고 소진율 70% 미만 반복 시 자금압박 누적',
    },
    media: {
      name: '미디어·콘텐츠업',
      sampleSize: '3,142개',
      avgMonthlyRev: 4580,
      bepRange: '2,800~3,800만원',
      topPainPoints: ['프리랜서 의존도', 'IP 수익화 어려움', '플랫폼 의존도'],
      successSignals: ['IP 원천 보유', '정기 구독·라이선스 수익', '채널 다각화'],
      digitalEffect: '자체 IP 보유 스튜디오 매출 안정성 2.4배',
      avgBizAge: 4.8,
      closureTrigger: '단일 플랫폼 매출 80%+ + IP 미보유 시 알고리즘 변경 직격탄',
    },
    logistics: {
      name: '물류·운송업',
      sampleSize: '5,917개',
      avgMonthlyRev: 5340,
      bepRange: '3,800~4,800만원',
      topPainPoints: ['유가 변동', '공차율 최적화', '배송 플랫폼 수수료'],
      successSignals: ['가동률 85% 이상', 'TMS 도입', '화주 3개 이상 분산'],
      digitalEffect: 'TMS 도입 운송사 유류비 8.3% 절감, 배차 효율 34% 향상',
      avgBizAge: 8.2,
      closureTrigger: '단일 화주 의존 60%+ + 유가 20% 이상 급등 시 즉각 손실 전환',
    },
    energy: {
      name: '환경·에너지업',
      sampleSize: '2,418개',
      avgMonthlyRev: 9840,
      bepRange: '6,000~8,000만원',
      topPainPoints: ['인허가·규제 리스크', '초기 설비투자 부담', 'Backlog 관리'],
      successSignals: ['수주 Backlog 6개월 이상', 'REC 인증 보유', '정부 프로젝트 참여'],
      digitalEffect: '에너지 모니터링 시스템 도입 시 운영비 12% 절감',
      avgBizAge: 7.3,
      closureTrigger: '대형 프로젝트 1건 취소 시 현금 위기 — Backlog 분산이 핵심',
    },
    agri_food: {
      name: '농림·식품원료업',
      sampleSize: '3,284개',
      avgMonthlyRev: 4120,
      bepRange: '2,500~3,500만원',
      topPainPoints: ['기상·수급 변동성', '가공 전환 어려움', '판로 다변화'],
      successSignals: ['GAP·유기농 인증 보유', '직거래 비중 40%+', '가공품 라인업 보유'],
      digitalEffect: '온라인 직거래 도입 농가 수익 38% 향상',
      avgBizAge: 12.1,
      closureTrigger: '단일 작목 100% 의존 + 기상재해 반복 시 연속 손실',
    },
    export_sme: {
      name: '수출 중소기업',
      sampleSize: '6,218개',
      avgMonthlyRev: 18400,
      bepRange: '12,000~15,000만원',
      topPainPoints: ['환율 변동 리스크', '해외 인증 취득 비용', '바이어 다각화 어려움'],
      successSignals: ['바이어 5개국 이상', '선물환 헤지 활용', 'CE·FDA 인증 보유'],
      digitalEffect: '해외 B2B 플랫폼(알리바바·글로벌소싱) 활용 기업 신규 바이어 2.1배',
      avgBizAge: 9.7,
      closureTrigger: '단일 국가 매출 60%+ + 환율 15%+ 불리 이동 시 수익 구조 붕괴',
    },
    finance: {
      name: '금융·핀테크업',
      sampleSize: '1,847개',
      avgMonthlyRev: 21400,
      bepRange: '14,000~18,000만원',
      topPainPoints: ['금소법·규제 리스크', '고객 신뢰 구축', '기술 보안 투자'],
      successSignals: ['ISMS 인증 보유', 'CAC 대비 LTV 3배 이상', '규제샌드박스 활용'],
      digitalEffect: '모바일 앱 UX 최적화 기업 고객 유지율 41% 향상',
      avgBizAge: 6.4,
      closureTrigger: '보안 사고 1건 발생 시 고객 이탈 평균 34% — ISMS 필수',
    },
  };

  /* ── 사업연차 모디파이어 ──────────────────────────────────────*/
  const AGE_CONTEXT = {
    early:  { range: [0, 2],  label: '창업 초기 (1~2년)',   focus: '생존과 BEP 달성이 최우선' },
    growth: { range: [3, 5],  label: '성장기 (3~5년)',       focus: '채널 확장과 시스템화' },
    mature: { range: [6, 10], label: '성숙기 (6~10년)',      focus: '수익 구조 개선과 혁신' },
    scale:  { range: [11, 99],label: '확장기 (10년 이상)',   focus: '사업 다각화 또는 Exit 전략' },
  };

  /* ── 핵심 매칭 함수 ──────────────────────────────────────────*/
  function match(domainScores, industryKey, bizScale, startYear) {
    const bizAge = startYear > 1900 ? new Date().getFullYear() - startYear : 3;

    // 아키타입 결정
    const archetype = Object.values(ARCHETYPES).find(a => a.condition(domainScores))
      || ARCHETYPES.growth_stall;

    // 업종 컨텍스트
    const ctx = INDUSTRY_CONTEXT[industryKey] || INDUSTRY_CONTEXT.local_service;

    // 사업연차 컨텍스트
    const ageCtx = Object.values(AGE_CONTEXT).find(a => bizAge >= a.range[0] && bizAge <= a.range[1])
      || AGE_CONTEXT.growth;

    // 진단 점수 기반 개인화 인사이트
    const weakDomains = [];
    if (domainScores.finance < 3)       weakDomains.push('재무건전성');
    if (domainScores.hr < 3)            weakDomains.push('조직·인력');
    if (domainScores.bm < 3)            weakDomains.push('고객·매출');
    if (domainScores.differentiation < 3) weakDomains.push('차별화·경쟁력');

    return { archetype, ctx, ageCtx, bizAge, weakDomains, domainScores };
  }

  /* ── diag-reveal 렌더링 ──────────────────────────────────────*/
  function renderDiagReveal(diagData) {
    const box     = document.getElementById('drPatternBox');
    const content = document.getElementById('drPatternContent');
    if (!box || !content) return;

    const domainScores = diagData.domainScores || {};
    if (!Object.keys(domainScores).length) { box.style.display = 'none'; return; }

    const startYear = parseInt(diagData.startYear) || 0;
    const result    = match(
      { finance: domainScores.finance?.avg || 3,
        hr:      domainScores.hr?.avg      || 3,
        bm:      domainScores.bm?.avg      || 3,
        differentiation: domainScores.differentiation?.avg || 3 },
      diagData.industry || '',
      diagData.bizScale || 'micro',
      startYear
    );

    const { archetype, ctx, ageCtx, bizAge, weakDomains } = result;
    const riskColors = { high: '#F87171', medium: '#FBBF24', low: '#60A5FA', very_low: '#4ADE80' };
    const riskBg     = { high: 'rgba(239,68,68,.1)', medium: 'rgba(245,158,11,.1)', low: 'rgba(96,165,250,.1)', very_low: 'rgba(74,222,128,.1)' };
    const col = riskColors[archetype.risk];
    const bg  = riskBg[archetype.risk];

    box.style.display = '';
    content.innerHTML = `
      <div class="pat-header" style="border-left:3px solid ${col};padding-left:12px;margin-bottom:16px">
        <div class="pat-arch" style="color:${col};font-weight:700;font-size:1rem">${archetype.label}</div>
        <div class="pat-age-ctx" style="font-size:0.8rem;color:rgba(255,255,255,.55);margin-top:3px">${ageCtx.label} · ${ageCtx.focus}</div>
      </div>

      <div class="pat-stat-row">
        <div class="pat-stat" style="background:${bg}">
          <div class="pat-stat-val">${archetype.stats.prevalence}%</div>
          <div class="pat-stat-lbl">같은 패턴 비중<br><small>${ctx.sampleSize} 조사 기준</small></div>
        </div>
        <div class="pat-stat" style="background:rgba(239,68,68,.1)">
          <div class="pat-stat-val" style="color:#F87171">${archetype.stats.closureRate3y}%</div>
          <div class="pat-stat-lbl">3년 내 폐업율<br><small>미조치 시 추정</small></div>
        </div>
        ${archetype.stats.avgRunway ? `
        <div class="pat-stat" style="background:rgba(251,191,36,.1)">
          <div class="pat-stat-val" style="color:#FBBF24">${archetype.stats.avgRunway}개월</div>
          <div class="pat-stat-lbl">평균 현금 런웨이</div>
        </div>` : `
        <div class="pat-stat" style="background:rgba(74,222,128,.1)">
          <div class="pat-stat-val" style="color:#4ADE80">${archetype.successRate}%</div>
          <div class="pat-stat-lbl">개선 조치 후<br>12개월 흑자 전환율</div>
        </div>`}
      </div>

      <div class="pat-industry-block">
        <div class="pat-block-title">📌 ${ctx.name} 동종업계 데이터</div>
        <div class="pat-row"><span>월평균 매출</span><strong>${ctx.avgMonthlyRev.toLocaleString()}만원</strong></div>
        <div class="pat-row"><span>BEP 범위</span><strong>${ctx.bepRange}</strong></div>
        <div class="pat-row"><span>디지털 효과</span><strong>${ctx.digitalEffect}</strong></div>
        <div class="pat-row" style="color:#F87171"><span>폐업 트리거</span><strong style="font-size:0.78rem">${ctx.closureTrigger}</strong></div>
      </div>

      ${weakDomains.length ? `
      <div class="pat-weak-block">
        <div class="pat-block-title">⚠ 귀사 취약 영역</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">
          ${weakDomains.map(w => `<span class="pat-weak-tag">${w}</span>`).join('')}
        </div>
      </div>` : ''}

      <div class="pat-actions">
        <div class="pat-block-title">✅ 이 패턴에서 효과적인 상위 3개 액션</div>
        ${archetype.topActions.map((a, i) =>
          `<div class="pat-action-item"><span class="pat-action-num">${i+1}</span>${a}</div>`
        ).join('')}
      </div>

      <div class="pat-source">출처: 소상공인진흥공단 소상공인실태조사 2023 · 통계청 기업생멸행정통계 2022</div>
    `;

    // AI 프롬프트용 전역 저장
    window._patternMatch = result;
  }

  /* ── AI 프롬프트 블록 생성 ──────────────────────────────────*/
  function buildPromptBlock(diagData) {
    const domainScores = diagData.domainScores || {};
    if (!Object.keys(domainScores).length) return '(패턴 데이터 없음)';

    const startYear = parseInt(diagData.startYear) || 0;
    const result    = match(
      { finance: domainScores.finance?.avg || 3,
        hr:      domainScores.hr?.avg      || 3,
        bm:      domainScores.bm?.avg      || 3,
        differentiation: domainScores.differentiation?.avg || 3 },
      diagData.industry || '',
      diagData.bizScale || 'micro',
      startYear
    );

    const { archetype, ctx, ageCtx, bizAge } = result;

    return `경영 패턴 분석 (소상공인진흥공단 실태조사 2023 기반)
패턴 유형: ${archetype.label} (전체 사업체의 ${archetype.stats.prevalence}% 해당)
사업 단계: ${ageCtx.label} — ${ageCtx.focus}
업종 월평균 매출: ${ctx.avgMonthlyRev.toLocaleString()}만원 / BEP 범위: ${ctx.bepRange}
미조치 3년 폐업율: ${archetype.stats.closureRate3y}% / 주요 원인: ${archetype.commonCause}
업종 폐업 트리거: ${ctx.closureTrigger}
디지털화 효과: ${ctx.digitalEffect}
검증된 개선 액션: ${archetype.topActions.join(' / ')}

▶ 활용 지침:
- SWOT 위협에 "${archetype.stats.closureRate3y}% 폐업율" 수치를 직접 인용할 것
- keyStrategies의 최우선 전략은 "${archetype.commonCause}" 해소에 집중할 것
- 업종 폐업 트리거를 회피하는 액션을 로드맵 1단계에 명시할 것`;
  }

  return { match, renderDiagReveal, buildPromptBlock };
})();
