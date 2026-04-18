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
      { key: 'problem',               label: 'Problem',              sub: '핵심 문제',         icon: '🔴', cls: 'lc-problem' },
      { key: 'solution',              label: 'Solution',             sub: '해결책',            icon: '💡', cls: 'lc-solution' },
      { key: 'uniqueValueProposition',label: 'Unique Value Prop.',   sub: '핵심 가치 제안',    icon: '⭐', cls: 'lc-uvp' },
      { key: 'unfairAdvantage',       label: 'Unfair Advantage',     sub: '모방 불가 강점',    icon: '🛡️', cls: 'lc-advantage' },
      { key: 'customerSegments',      label: 'Customer Segments',    sub: '타겟 고객',         icon: '👥', cls: 'lc-customer' },
      { key: 'keyMetrics',            label: 'Key Metrics',          sub: '핵심 지표',         icon: '📊', cls: 'lc-metrics' },
      { key: 'channels',              label: 'Channels',             sub: '채널',              icon: '📣', cls: 'lc-channels' },
      { key: 'costStructure',         label: 'Cost Structure',       sub: '비용 구조',         icon: '💸', cls: 'lc-cost' },
      { key: 'revenueStreams',        label: 'Revenue Streams',      sub: '수익 흐름',         icon: '💰', cls: 'lc-revenue' },
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
