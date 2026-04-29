/* ================================================================
   BizNavi AI — dashboard.js
   결과 대시보드: 렌더링, 스크롤 리빌, 카운트업, 리플 효과, 입력 체크
   ================================================================ */

const Dashboard = (() => {

  let _scrollSpyBound = null;
  let _radarChart = null;

  // 공통 진단 영역 이름 매핑
  const COMMON_AREA_LABELS = {
    area_1: '재무건전성',
    area_2: '조직·인력',
    area_3: '고객·매출',
    area_4: '경영역량'
  };

  function scoreLabel(s) {
    if (s >= 4.0) return '강점';
    if (s >= 3.0) return '보통';
    if (s >= 2.0) return '취약';
    return '위험';
  }

  function renderLeanCanvas(data, fd) {
    const section = document.getElementById('sec-lean-canvas');
    if (!section) return;

    const lc = data.leanCanvas;
    if (!lc) { section.style.display = 'none'; return; }
    section.style.display = '';

    // 9블록 정의 (린 캔버스 순서)
    const blocks = [
      {
        key: 'problem', label: 'Problem', sub: '핵심 문제', icon: '🔴', cls: 'lc-problem',
        guide: '고객이 현재 겪고 있는 가장 중요한 문제 1~3가지입니다. 기존의 어떤 방법(경쟁사, 대안)으로도 해결되지 않는 pain point를 구체적으로 정의하세요. 예: "단골 고객 의존도 80% → 신규 유입 경로 없음", "월말마다 현금 부족 → 운전자금 관리 방법 없음"'
      },
      {
        key: 'solution', label: 'Solution', sub: '해결책', icon: '💡', cls: 'lc-solution',
        guide: '위 문제를 해결하는 우리만의 방법입니다. 거창하지 않아도 되며, 지금 당장 실행 가능한 구체적인 해법이어야 합니다. 각 문제에 1:1로 대응하는 솔루션을 제시하면 가장 강력합니다.'
      },
      {
        key: 'uniqueValueProposition', label: 'Unique Value Prop.', sub: '핵심 가치 제안', icon: '⭐', cls: 'lc-uvp',
        guide: '고객이 우리를 선택해야 하는 단 하나의 이유입니다. "왜 다른 곳이 아닌 우리?"에 10초 안에 답할 수 있어야 합니다. 예: "당일 출장 수리 전문 — 4시간 내 방문 보장", "30년 장인의 수제 레시피 — 방부제·조미료 無". 명확하고 검증 가능한 약속이어야 합니다.'
      },
      {
        key: 'unfairAdvantage', label: 'Unfair Advantage', sub: '모방 불가 강점', icon: '🛡️', cls: 'lc-advantage',
        guide: '경쟁사가 돈으로 사거나 쉽게 따라 할 수 없는 나만의 강점입니다. 예: 특허·자격증·독점 계약, 오랜 단골 관계, 희귀한 기술이나 네트워크, 특별한 입지 등. 비어있다면 "아직 없음 — 현재 구축 중"이라도 솔직하게 적고 전략에 반영하세요.'
      },
      {
        key: 'customerSegments', label: 'Customer Segments', sub: '타겟 고객', icon: '👥', cls: 'lc-customer',
        guide: '우리 제품·서비스에 돈을 낼 가능성이 가장 높은 핵심 고객 집단입니다. 나이·직업·지역·행동 패턴 등으로 구체화하세요. 예: "반경 1km 내 30~50대 직장인 점심 수요", "인스타그램 활용하는 20대 여성 소자본 창업자". 모두를 타겟하면 아무도 잡지 못합니다.'
      },
      {
        key: 'keyMetrics', label: 'Key Metrics', sub: '핵심 지표', icon: '📊', cls: 'lc-metrics',
        guide: '사업의 건강 상태를 나타내는 3~5개의 숫자입니다. 매출·방문자 수보다 "우리 사업의 본질"을 측정하는 지표를 선택하세요. 예: 재방문율(단골 충성도), 객단가(구매 깊이), 신규 고객 유입 수(성장성), 원가율(수익성). 이 숫자가 개선되면 매출이 자연히 따라옵니다.'
      },
      {
        key: 'channels', label: 'Channels', sub: '채널', icon: '📣', cls: 'lc-channels',
        guide: '고객이 우리를 발견하고, 구매하고, 재방문하는 경로입니다. 현재 효과를 보고 있는 채널과 앞으로 강화할 채널을 구분하여 적으세요. 예: 네이버 플레이스(현재 주력), 인스타그램(강화 예정), 단골 소개(구전). 채널마다 비용 대비 효과(ROAS)가 다르므로 집중 채널을 1~2개로 좁히는 것이 유리합니다.'
      },
      {
        key: 'costStructure', label: 'Cost Structure', sub: '비용 구조', icon: '💸', cls: 'lc-cost',
        guide: '사업을 운영하는 데 드는 주요 비용 항목입니다. 고정비(임대료·인건비·통신비 — 매출에 상관없이 발생)와 변동비(재료비·배달비·광고비 — 매출에 따라 변동)를 구분하세요. 손익분기점(BEP)을 파악하고, 가장 큰 비용부터 줄일 방법을 찾는 것이 생존 전략의 핵심입니다.'
      },
      {
        key: 'revenueStreams', label: 'Revenue Streams', sub: '수익 흐름', icon: '💰', cls: 'lc-revenue',
        guide: '고객으로부터 돈을 받는 방식입니다. 단일 수익원에 의존하면 리스크가 크므로 2~3개의 수익 흐름을 구성하는 것이 이상적입니다. 예: 주력 상품 판매(즉시 수익) + 구독·정기권(예측 가능 수익) + 교육·컨설팅(고마진 수익). 수익 흐름별 비율과 마진을 파악하고, 고마진 수익원을 늘리는 방향을 전략에 반영하세요.'
      },
    ];

    const grid = document.getElementById('leanCanvasGrid');
    if (!grid) return;
    grid.innerHTML = blocks.map(b => `
      <div class="lc-block ${b.cls}">
        <div class="lc-block-hdr">
          <span class="lc-icon">${b.icon}</span>
          <span class="lc-label">${b.label}</span>
          <span class="lc-sublabel">${b.sub}</span>
        </div>
        <div class="lc-content">${(lc[b.key] || '—').replace(/\n/g, '<br>')}</div>
        <div class="lc-guide">${b.guide}</div>
      </div>`).join('');
  }

  function renderSpecializedSection(data, fd) {
    const section = document.getElementById('sec-consulting');
    if (!section) return;

    const spec = data.specializedAnalysis;
    if (!spec || !spec.blocks || spec.blocks.length === 0) {
      section.style.display = 'none';
      return;
    }
    section.style.display = '';

    // 프레임워크 뱃지
    const badge = document.getElementById('specFrameworkBadge');
    if (badge) badge.textContent = spec.framework || '특화 분석';

    // 컨설팅 유형 아이콘 매핑
    const typeIconMap = {
      finance_strategy:        '💰',
      growth_strategy:         '🚀',
      differentiation_strategy:'⚡',
      hr_strategy:             '👥',
      structure_strategy:      '🏗️',
      digital_strategy:        '🖥️',
      innovation_strategy:     '💡',
      marketing_strategy:      '📣',
      pivot_strategy:          '🔄',
      cx_strategy:             '🤝',
    };
    const icon = typeIconMap[spec.type] || '🎯';

    // 요약
    const summaryEl = document.getElementById('specSummary');
    if (summaryEl) {
      summaryEl.innerHTML =
        `<div class="spec-type-row"><span class="spec-type-icon">${icon}</span><span class="spec-type-label">${spec.framework}</span></div>` +
        `<p class="spec-summary-text">${spec.summary || ''}</p>`;
    }

    // 블록 렌더링
    const blocksEl = document.getElementById('specBlocks');
    if (blocksEl) {
      blocksEl.innerHTML = spec.blocks.map((b, i) => `
        <div class="spec-block">
          <div class="spec-block-label"><span class="spec-block-num">${i + 1}</span>${b.label}</div>
          <div class="spec-block-content">${(b.content || '').replace(/\n/g, '<br>')}</div>
        </div>`).join('');
    }
  }

  // ── 동적 목차 네비게이션 생성 ─────────────────────────────────
  function buildNav(isMicro) {
    const nav = document.getElementById('reportNav');
    if (!nav) return;

    const links = isMicro ? [
      { href: 'sec-summary',      label: 'Executive Summary' },
      { href: 'sec-diag',         label: '경영 진단' },
      { href: 'sec-lean-canvas',  label: '비즈니스 캔버스' },
      { href: 'sec-six-systems',  label: '6가지 시스템' },
      { href: 'sec-plan90',       label: '90일 실행 플랜' },
      { href: 'sec-gov',          label: '정부지원사업' },
    ] : [
      { href: 'sec-summary',      label: 'Executive Summary' },
      { href: 'sec-diag',         label: '경영 진단' },
      { href: 'sec-consulting',   label: '유형별 특화 분석' },
      { href: 'sec-swot',         label: 'SWOT 분석' },
      { href: 'sec-stp',          label: 'STP 분석' },
      { href: 'sec-4p',           label: '4P 마케팅' },
      { href: 'sec-strategy',     label: '핵심 전략' },
      { href: 'sec-kpi',          label: 'KPI 지표' },
      { href: 'sec-roadmap',      label: '실행 로드맵' },
      { href: 'sec-lean-canvas',  label: '린 캔버스' },
      { href: 'sec-six-systems',  label: '6가지 시스템' },
      { href: 'sec-plan90',       label: '90일 플랜' },
      { href: 'sec-gov',          label: '정부지원사업' },
    ];

    nav.innerHTML = '<div class="report-nav-title">목차</div>' +
      links.map((l, i) =>
        `<a href="#${l.href}" class="nav-link${i === 0 ? ' active' : ''}"><span class="nav-dot"></span>${l.label}</a>`
      ).join('');

    // 클릭 이벤트 바인딩
    nav.querySelectorAll('.nav-link').forEach(a => {
      a.onclick = (e) => {
        e.preventDefault();
        const target = document.getElementById(a.getAttribute('href').slice(1));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
    });
  }

  // ── 6가지 시스템 섹션 렌더링 ─────────────────────────────────
  function renderSixSystems(data) {
    const section = document.getElementById('sec-six-systems');
    const grid    = document.getElementById('sixSysGrid');
    if (!section || !grid) return;

    const systems = data.sixSystems;
    if (!systems || systems.length === 0) { section.style.display = 'none'; return; }
    section.style.display = '';

    const statusCls = s =>
      s === '강점' ? 'sys-status-strong' :
      s === '보통' ? 'sys-status-ok' : 'sys-status-weak';
    const statusIcon = s =>
      s === '강점' ? '💪' : s === '보통' ? '⚡' : '⚠️';

    grid.innerHTML = systems.map(sys => `
      <div class="sys-card">
        <div class="sys-card-header">
          <span class="sys-icon">${sys.icon || ''}</span>
          <span class="sys-name">${sys.name}</span>
          <span class="sys-status ${statusCls(sys.status)}">${statusIcon(sys.status)} ${sys.status}</span>
        </div>
        <div class="sys-issue">${(sys.issue || '').replace(/\n/g, '<br>')}</div>
        <div class="sys-actions-title">즉시 실행 액션</div>
        <ol class="sys-actions">
          ${(sys.actions || []).map(a => `<li>${a}</li>`).join('')}
        </ol>
        ${sys.resource ? `<div class="sys-resource">📌 ${sys.resource}</div>` : ''}
      </div>`).join('');
  }

  // ── 90일 실행 플랜 섹션 렌더링 ───────────────────────────────
  function renderPlan90(data) {
    const section  = document.getElementById('sec-plan90');
    const timeline = document.getElementById('plan90Timeline');
    if (!section || !timeline) return;

    const plan = data.plan90days;
    if (!plan || plan.length === 0) { section.style.display = 'none'; return; }
    section.style.display = '';

    timeline.innerHTML = plan.map((month, i) => `
      <div class="plan90-month">
        <div class="plan90-num-wrap">
          <span class="plan90-num">${i + 1}</span>
        </div>
        <div class="plan90-body">
          <div class="plan90-month-top">
            <span class="plan90-month-label">${month.month}</span>
            <span class="plan90-theme">${month.theme || ''}</span>
          </div>
          <div class="plan90-goal">🎯 <strong>이달 목표:</strong> ${month.goal || ''}</div>
          <div class="plan90-actions-title">핵심 실행 과제</div>
          <ul class="plan90-actions">
            ${(month.actions || []).map(a => `<li>${a}</li>`).join('')}
          </ul>
          <div class="plan90-meta">
            ${month.expectedResult ? `<div class="plan90-result">✅ <strong>기대 효과:</strong> ${month.expectedResult}</div>` : ''}
            ${month.govSupport    ? `<div class="plan90-gov">🏛️ <strong>활용 지원사업:</strong> ${month.govSupport}</div>` : ''}
          </div>
        </div>
      </div>`).join('');
  }

  function renderGovSection(fd) {
    const section = document.getElementById('sec-gov');
    const grid    = document.getElementById('govGrid');
    if (!section || !grid) return;

    if (typeof GovSupport === 'undefined') { section.style.display = 'none'; return; }

    const matched = GovSupport.match(fd);
    if (matched.length === 0) { section.style.display = 'none'; return; }

    section.style.display = '';
    grid.innerHTML = matched.map(p => `
      <div class="gov-card">
        <div class="gov-card-header">
          <span class="gov-org">${p.org}</span>
          <span class="gov-score-badge">매칭 ${p.score}점</span>
        </div>
        <div class="gov-name">${p.name}</div>
        <div class="gov-support">💰 ${p.support}</div>
        <div class="gov-summary">${p.summary}</div>
        <a class="gov-link" href="${p.url}" target="_blank" rel="noopener">신청 정보 보기 →</a>
      </div>`).join('');
  }

  function renderDiagSection(fd) {
    const section = document.getElementById('sec-diag');
    if (!section) return;
    const diagScores = fd && fd.diagScores;
    const hasScores = diagScores && Object.keys(diagScores).filter(k => diagScores[k].score > 0).length > 0;
    if (!hasScores) { section.style.display = 'none'; return; }
    section.style.display = '';

    const scores = AIEngine.calcDiagScores(diagScores);
    if (!scores) return;
    renderRadar(scores);
    renderWeakAreas(scores);
  }

  function renderRadar(scores) {
    const ctx = document.getElementById('radarChart');
    if (!ctx || typeof Chart === 'undefined') return;
    if (_radarChart) { _radarChart.destroy(); _radarChart = null; }

    const labels = [];
    const data   = [];

    // 공통 4개 영역
    if (scores.common) {
      ['area_1','area_2','area_3','area_4'].forEach(id => {
        if (scores.common.areas[id] !== undefined) {
          labels.push(COMMON_AREA_LABELS[id]);
          data.push(scores.common.areas[id]);
        }
      });
    }
    if (scores.industry) { labels.push('업종특화'); data.push(scores.industry.avg); }
    if (scores.bizmodel) { labels.push('사업모델'); data.push(scores.bizmodel.avg); }
    if (labels.length < 3) return;

    _radarChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels,
        datasets: [{
          label: '진단 점수',
          data,
          backgroundColor: 'rgba(245,192,48,0.12)',
          borderColor:      'rgba(245,192,48,0.85)',
          borderWidth: 2,
          pointBackgroundColor: data.map(v => v < 2 ? '#F87171' : v < 3 ? '#FB923C' : v >= 4 ? '#4ADE80' : '#F5C030'),
          pointRadius: 5,
          pointHoverRadius: 7,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          r: {
            min: 0, max: 5,
            ticks: { stepSize: 1, color: 'rgba(232,237,245,0.35)', font: { size: 9 }, backdropColor: 'transparent' },
            grid:        { color: 'rgba(255,255,255,0.07)' },
            angleLines:  { color: 'rgba(255,255,255,0.07)' },
            pointLabels: { color: 'rgba(232,237,245,0.85)', font: { size: 11, weight: '600' } },
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15,22,41,0.95)',
            borderColor: 'rgba(245,192,48,0.3)',
            borderWidth: 1,
            callbacks: {
              label: ctx => ` ${ctx.raw}점 (${scoreLabel(ctx.raw)})`
            }
          }
        }
      }
    });
  }

  const AREA_INSIGHTS = {
    '재무건전성': {
      high: '매출 대비 수익률이 안정적입니다. 현재 원가 관리 수준을 유지하면서 잉여 수익을 성장 투자에 단계적으로 배분하세요.',
      ok:   '재무 구조는 안정적이나 개선 여지가 있습니다. 월간 손익 리뷰를 정례화하고 고정비 구조를 점검하면 이익률을 높일 수 있습니다.',
      low:  '매출 대비 이익이 낮거나 현금흐름이 불안정합니다. 손익분기점(BEP)을 명확히 파악하고, 비효율 지출을 정리하는 것이 최우선 과제입니다.'
    },
    '조직·인력': {
      high: '인력 구조가 안정적입니다. 핵심 직원 이탈 방지를 위한 인센티브 체계와 권한 위임으로 대표 의존도를 지속적으로 낮추세요.',
      ok:   '조직 운영은 양호하나, 대표 부재 시에도 운영이 가능한 업무 매뉴얼화가 필요합니다. 핵심 업무 3가지를 표준화하는 것부터 시작하세요.',
      low:  '대표자 1인 의존도가 높거나 인력 역량 개발이 부족합니다. 핵심 업무 매뉴얼화와 단계적 권한 위임이 사업 성장의 전제 조건입니다.'
    },
    '고객·매출': {
      high: '고객 유입과 재방문 구조가 탄탄합니다. 특정 채널 또는 단골에 대한 의존도를 확인하고, 채널 다각화로 리스크를 분산하세요.',
      ok:   '고객 획득은 되고 있으나 재구매율 향상의 여지가 있습니다. 기존 고객 관리(문자·SNS·멤버십) 체계 강화를 우선 추진하세요.',
      low:  '신규 고객 유입이 제한적이거나 특정 고객에 매출이 집중되어 있습니다. 즉각 고객 확보 채널(SNS·지역 커뮤니티·협력 네트워크)을 다각화하세요.'
    },
    '경영역량': {
      high: '의사결정과 경영 정보 관리가 잘 되고 있습니다. 데이터 기반 의사결정을 더욱 정교화하고 KPI 모니터링 체계를 갖추세요.',
      ok:   '경영 역량은 보통 수준입니다. 월간 목표를 숫자로 설정하고, 주간 점검 루틴을 도입하면 실행력이 눈에 띄게 향상됩니다.',
      low:  '경영 계획이나 의사결정 체계가 미흡합니다. 핵심 지표 3개(매출·고객수·이익률)부터 매주 기록하는 습관을 만드세요.'
    },
    '업종특화 종합': {
      high: '업종 핵심 역량이 강점입니다. 이 경쟁력을 마케팅 메시지에 더 적극적으로 담아 신규 고객에게 전달하세요.',
      ok:   '업종 역량은 평균 수준입니다. 경쟁사 대비 귀사만의 차별점을 발굴하고, 이를 고객과의 접점에서 명확히 전달하세요.',
      low:  '업종 핵심 역량에 취약점이 있습니다. 경쟁사가 갖추고 있는 기본 역량부터 체계적으로 강화해 나가는 로드맵이 필요합니다.'
    },
    '사업모델 종합': {
      high: '수익 모델이 안정적으로 작동하고 있습니다. 반복 수익(재계약·구독·단골) 비중을 높여 매출 예측 가능성을 더욱 강화하세요.',
      ok:   '수익 모델은 작동하고 있으나 다각화 여지가 있습니다. 기존 고객에게 추가 상품·서비스를 제안하는 업셀링을 검토해보세요.',
      low:  '현재 수익 모델이 단순하거나 지속성이 낮습니다. 고객 1명당 생애 가치(LTV)를 높이는 구조(재구매·패키지·멤버십)로의 전환이 필요합니다.'
    }
  };

  function _getAreaInsight(label, score) {
    const tbl = AREA_INSIGHTS[label] || {};
    if (score >= 4.0) return tbl.high || '';
    if (score >= 3.0) return tbl.ok  || '';
    return tbl.low || '';
  }

  function renderWeakAreas(scores) {
    const banner = document.getElementById('weakBanner');
    if (!banner) return;

    const allAreas = [];
    if (scores.common) {
      ['area_1','area_2','area_3','area_4'].forEach(id => {
        if (scores.common.areas[id] !== undefined)
          allAreas.push({ label: COMMON_AREA_LABELS[id], score: scores.common.areas[id] });
      });
    }
    if (scores.industry) allAreas.push({ label: '업종특화 종합', score: scores.industry.avg });
    if (scores.bizmodel) allAreas.push({ label: '사업모델 종합', score: scores.bizmodel.avg });

    const sorted = [...allAreas].sort((a, b) => a.score - b.score);
    const weakAreas   = sorted.filter(a => a.score < 3.0);
    const strongAreas = sorted.filter(a => a.score >= 4.0).reverse();

    // 전체 점수 pill
    let html = '<div class="diag-score-pills">';
    allAreas.forEach(a => {
      const cls  = a.score >= 4 ? 'pill-strong' : a.score >= 3 ? 'pill-ok' : a.score >= 2 ? 'pill-weak' : 'pill-danger';
      const icon = a.score >= 4 ? '💪' : a.score >= 3 ? '✅' : a.score >= 2 ? '⚠️' : '🔴';
      html += `<span class="diag-pill ${cls}">${icon} ${a.label}<em>${a.score}점</em></span>`;
    });
    html += '</div>';

    // 취약/위험 경고
    if (weakAreas.length > 0) {
      html += '<div class="diag-alerts">';
      html += '<div class="diag-alerts-title">⚠️ 개선 필요 영역 — AI 전략에 우선 반영됨</div>';
      weakAreas.forEach(a => {
        const isDanger = a.score < 2;
        html += `<div class="diag-alert-row ${isDanger ? 'alert-danger' : 'alert-warn'}">
          <span class="alert-icon">${isDanger ? '🔴' : '🟠'}</span>
          <span class="alert-area-name">${a.label}</span>
          <span class="alert-score-val">${a.score}점</span>
          <span class="alert-msg-txt">${isDanger ? '즉각 개선 필요' : '단기 개선 권고'}</span>
        </div>`;
      });
      html += '</div>';
    }

    // 강점 영역
    if (strongAreas.length > 0) {
      html += '<div class="diag-strong-pills"><span class="diag-strong-label">💪 핵심 강점</span>';
      strongAreas.forEach(a => {
        html += `<span class="diag-pill pill-strong">⭐ ${a.label} <em>${a.score}점</em></span>`;
      });
      html += '</div>';
    }

    // 영역별 상세 분석 카드
    html += '<div class="diag-area-cards">';
    allAreas.forEach(a => {
      const cls    = a.score >= 4 ? 'acard-high' : a.score >= 3 ? 'acard-ok' : 'acard-low';
      const bar    = Math.round((a.score / 5) * 100);
      const lbl    = a.score >= 4 ? '강점' : a.score >= 3 ? '보통' : a.score >= 2 ? '취약' : '위험';
      const clrCls = a.score >= 4 ? 'high' : a.score >= 3 ? 'mid' : a.score >= 2 ? 'low' : 'risk';
      const insight = _getAreaInsight(a.label, a.score);
      html += `<div class="diag-area-card ${cls}">
        <div class="dac-header">
          <span class="dac-label">${a.label}</span>
          <span class="dac-score dr-score-val ${clrCls}">${a.score.toFixed(1)}점 <small>${lbl}</small></span>
        </div>
        <div class="dac-bar-wrap"><div class="dac-bar ${clrCls}" style="width:${bar}%"></div></div>
        ${insight ? `<p class="dac-insight">${insight}</p>` : ''}
      </div>`;
    });
    html += '</div>';

    banner.innerHTML = html;
  }

  function render(data, fd, isDemo) {
    const isMicro = fd.bizScale === 'micro';

    // 동적 목차 생성
    buildNav(isMicro);

    // 소기업 모드 전용 섹션 표시 제어
    const smeOnly = ['sec-consulting','sec-swot','sec-stp','sec-4p','sec-strategy','sec-kpi','sec-roadmap'];
    smeOnly.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = isMicro ? 'none' : '';
    });

    // 소상공인 모드에서는 린 캔버스를 비즈니스 캔버스로 타이틀 변경
    const lcTitle = document.querySelector('#sec-lean-canvas .sec-title h3');
    if (lcTitle) lcTitle.textContent = isMicro ? '비즈니스 캔버스' : '린 캔버스 (Lean Canvas)';

    document.getElementById('dTitle').textContent = (fd.companyName || '기업') + ' 경영전략 분석 리포트';
    const dateStr = new Date().toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric' });
    const modeBadge = isMicro ? '🏪 소상공인 모드' : '🏢 소기업·중소기업 모드';
    const badgeCls = isDemo ? 'demo-badge-inline' : 'real-badge-inline';
    const badgeTxt = isDemo ? '📊 DEMO DATA' : '🤖 AI 분석';
    document.getElementById('dSub').innerHTML =
      '분석일: ' + dateStr + ' &nbsp;<span class="mode-badge-inline">' + modeBadge + '</span>&nbsp;<span class="' + badgeCls + '">' + badgeTxt + '</span>';
    document.getElementById('demoBadge').classList.add('hidden');

    // Executive Summary
    document.getElementById('execSummary').innerHTML =
      data.executiveSummary.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // SWOT (항상 렌더링 — 소상공인 모드에선 섹션 자체가 hidden)
    const renderSwotList = (id, arr) => {
      const el = document.getElementById(id);
      if (!el || !arr) return;
      el.innerHTML = arr.map(t =>
        typeof t === 'object'
          ? `<li><strong>${t.item}</strong>${t.evidence ? `<span class="swot-evidence">${t.evidence}</span>` : ''}</li>`
          : `<li>${t}</li>`
      ).join('');
    };
    renderSwotList('swotS', data.swot?.strengths);
    renderSwotList('swotW', data.swot?.weaknesses);
    renderSwotList('swotO', data.swot?.opportunities);
    renderSwotList('swotT', data.swot?.threats);

    // STP
    if (data.stp) {
      document.getElementById('stpS').textContent = data.stp.segmentation || '';
      document.getElementById('stpT').textContent = data.stp.targeting    || '';
      document.getElementById('stpP').textContent = data.stp.positioning  || '';
    }

    // 4P
    if (data.fourP) {
      document.getElementById('fpProduct').textContent   = data.fourP.product   || '';
      document.getElementById('fpPrice').textContent     = data.fourP.price     || '';
      document.getElementById('fpPlace').textContent     = data.fourP.place     || '';
      document.getElementById('fpPromotion').textContent = data.fourP.promotion || '';
    }

    // Strategies
    if (data.keyStrategies) {
      document.getElementById('strategies').innerHTML = data.keyStrategies.map((s, i) => `
        <div class="strat-item">
          <div class="strat-num">${i+1}</div>
          <div class="strat-body">
            <span class="p-badge p-${s.priority}">${s.priority==='high'?'높음':s.priority==='medium'?'보통':'낮음'} 우선순위</span>
            <h4>${s.title}</h4>
            <p>${s.description}</p>
            ${(s.owner || s.timeline) ? `<div class="strat-meta">${s.owner ? `<span>👤 ${s.owner}</span>` : ''}${s.timeline ? `<span>📅 ${s.timeline}</span>` : ''}</div>` : ''}
          </div>
        </div>`).join('');
    }

    // KPI
    if (data.kpi) {
      document.getElementById('kpiGrid').innerHTML = data.kpi.map(k => `
        <div class="kpi-card">
          <div class="kpi-metric">${k.metric}</div>
          <div class="kpi-curr">${k.current}</div>
          <div class="kpi-tgt">목표: ${k.target}</div>
          <div class="kpi-bar"><div class="kpi-fill" data-pct="${k.progress||0}"></div></div>
          <div class="kpi-time">${k.timeline}</div>
          ${(k.method || k.owner) ? `<div class="kpi-meta">${k.owner ? `<span>👤 ${k.owner}</span>` : ''}${k.method ? `<span title="${k.method}">📏 측정방법 있음</span>` : ''}</div>` : ''}
        </div>`).join('');
    }

    // Roadmap
    if (data.roadmap) {
      document.getElementById('roadmap').innerHTML = data.roadmap.map(r => `
        <div class="rm-phase">
          <div class="rm-hdr">
            <span class="rm-name">${r.phase}</span>
            <span class="rm-period">${r.period}</span>
            ${r.budget ? `<span class="rm-budget">💰 ${r.budget}</span>` : ''}
          </div>
          ${r.framework ? `<div class="rm-framework">${r.framework}</div>` : ''}
          <div class="rm-tasks">${r.tasks.map(t => `<span class="rm-task">${t}</span>`).join('')}</div>
        </div>`).join('');
    }

    // 진단 분석 섹션 (레이더 차트 + 취약 배너)
    renderDiagSection(fd);

    // 컨설팅 유형별 특화 분석 섹션 (소기업 모드)
    if (!isMicro) renderSpecializedSection(data, fd);

    // 린 캔버스 시각화 섹션 (양쪽 모드 모두)
    renderLeanCanvas(data, fd);

    // 6가지 시스템 섹션 (양쪽 모드 모두)
    renderSixSystems(data);

    // 90일 실행 플랜 섹션 (양쪽 모드 모두)
    renderPlan90(data);

    // 정부지원사업 매칭 섹션
    renderGovSection(fd);

    // Animate KPI bars after render
    requestAnimationFrame(() => {
      setTimeout(() => {
        document.querySelectorAll('.kpi-fill').forEach(el => {
          el.style.width = (el.dataset.pct || 0) + '%';
        });
      }, 300);
    });
  }

  function initScrollReveal() {
    // ① fade-in: 뷰포트 진입 시 visible
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          revealObs.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0 });
    document.querySelectorAll('#dashboard .reveal').forEach(el => {
      el.classList.remove('visible');
      revealObs.observe(el);
    });

    // ② 로드맵 라인 애니메이션
    const roadmap = document.getElementById('roadmap');
    if (roadmap) {
      roadmap.classList.remove('animated');
      const rmObs = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) { roadmap.classList.add('animated'); rmObs.unobserve(roadmap); }
      }, { threshold: 0.15 });
      rmObs.observe(roadmap);
    }

    // ③ 목차 클릭은 buildNav()에서 이미 처리됨

    // ④ 스크롤 스파이 — 이전 리스너 제거 후 재등록 (표시된 섹션만)
    const allSecIds = ['sec-summary','sec-diag','sec-consulting','sec-swot','sec-stp','sec-4p','sec-strategy','sec-kpi','sec-roadmap','sec-lean-canvas','sec-six-systems','sec-plan90','sec-gov'];
    const secIds = allSecIds.filter(id => {
      const el = document.getElementById(id);
      return el && el.style.display !== 'none';
    });
    function onScroll() {
      const offset = 100;
      let activeId = secIds[0];
      secIds.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= offset) activeId = id;
      });
      document.querySelectorAll('.report-nav .nav-link').forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === '#' + activeId);
      });
    }
    if (_scrollSpyBound) window.removeEventListener('scroll', _scrollSpyBound);
    _scrollSpyBound = onScroll;
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();   // 초기 실행
  }

  function initCountUp() {
    const items = [
      { el: document.querySelector('.hero-stats .stat-item:nth-child(1) .stat-num'), end: 6, suffix: '가지', decimals: 0 },
      { el: document.querySelector('.hero-stats .stat-item:nth-child(2) .stat-num'), end: 3, suffix: '분', decimals: 0 },
    ];
    items.forEach(({ el, end, suffix, decimals }) => {
      if (!el) return;
      let start = 0, duration = 1400, startTime = null;
      function step(ts) {
        if (!startTime) startTime = ts;
        const progress = Math.min((ts - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const val = (start + (end - start) * ease);
        el.textContent = (decimals ? val.toFixed(decimals) : Math.floor(val)) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  function addRipple(e) {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.5;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const ripple = document.createElement('span');
    ripple.className = 'ripple-circle';
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }

  function initInputChecks() {
    document.querySelectorAll('.form-group input, .form-group textarea, .form-group select').forEach(el => {
      const group = el.closest('.form-group');
      const updateCheck = () => {
        if (el.value.trim()) group.classList.add('completed');
        else group.classList.remove('completed');
      };
      el.addEventListener('input', updateCheck);
      el.addEventListener('change', updateCheck);
    });
  }

  // Register ripple on all buttons
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.btn, .btn-gold-hero, .btn-demo, .mode-btn').forEach(btn => {
      btn.addEventListener('click', addRipple);
    });
  });

  return { render, initScrollReveal, initCountUp, addRipple, initInputChecks };
})();
