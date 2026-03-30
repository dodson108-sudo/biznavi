/* ================================================================
   BizNavi AI — dashboard.js
   결과 대시보드: 렌더링, 스크롤 리빌, 카운트업, 리플 효과, 입력 체크
   ================================================================ */

const Dashboard = (() => {

  let _scrollSpyBound = null;   // 이벤트 중복 방지용 참조

  function render(data, fd, isDemo) {
    document.getElementById('dTitle').textContent = (fd.companyName || '기업') + ' 경영전략 분석 리포트';
    const dateStr = new Date().toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric' });
    const badgeCls = isDemo ? 'demo-badge-inline' : 'real-badge-inline';
    const badgeTxt = isDemo ? '📊 DEMO DATA' : '🤖 AI 분석';
    document.getElementById('dSub').innerHTML =
      '분석일: ' + dateStr + ' &nbsp;<span class="' + badgeCls + '">' + badgeTxt + '</span>';
    document.getElementById('demoBadge').classList.add('hidden');

    // Executive Summary
    document.getElementById('execSummary').innerHTML =
      data.executiveSummary.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // SWOT
    const ul = (id, arr) => {
      document.getElementById(id).innerHTML = arr.map(t =>
        typeof t === 'object'
          ? `<li><strong>${t.item}</strong>${t.evidence ? `<span class="swot-evidence">${t.evidence}</span>` : ''}</li>`
          : `<li>${t}</li>`
      ).join('');
    };
    ul('swotS', data.swot.strengths);
    ul('swotW', data.swot.weaknesses);
    ul('swotO', data.swot.opportunities);
    ul('swotT', data.swot.threats);

    // STP
    document.getElementById('stpS').textContent = data.stp.segmentation;
    document.getElementById('stpT').textContent = data.stp.targeting;
    document.getElementById('stpP').textContent = data.stp.positioning;

    // 4P
    document.getElementById('fpProduct').textContent   = data.fourP.product;
    document.getElementById('fpPrice').textContent     = data.fourP.price;
    document.getElementById('fpPlace').textContent     = data.fourP.place;
    document.getElementById('fpPromotion').textContent = data.fourP.promotion;

    // Strategies
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

    // KPI
    document.getElementById('kpiGrid').innerHTML = data.kpi.map(k => `
      <div class="kpi-card">
        <div class="kpi-metric">${k.metric}</div>
        <div class="kpi-curr">${k.current}</div>
        <div class="kpi-tgt">목표: ${k.target}</div>
        <div class="kpi-bar"><div class="kpi-fill" data-pct="${k.progress||0}"></div></div>
        <div class="kpi-time">${k.timeline}</div>
        ${(k.method || k.owner) ? `<div class="kpi-meta">${k.owner ? `<span>👤 ${k.owner}</span>` : ''}${k.method ? `<span title="${k.method}">📏 측정방법 있음</span>` : ''}</div>` : ''}
      </div>`).join('');

    // Roadmap
    document.getElementById('roadmap').innerHTML = data.roadmap.map(r => `
      <div class="rm-phase">
        <div class="rm-hdr">
          <span class="rm-name">${r.phase}</span>
          <span class="rm-period">${r.period}</span>
          ${r.budget ? `<span class="rm-budget">💰 ${r.budget}</span>` : ''}
        </div>
        <div class="rm-tasks">${r.tasks.map(t => `<span class="rm-task">${t}</span>`).join('')}</div>
      </div>`).join('');

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

    // ③ 목차 클릭 → 부드러운 스크롤 (최초 1회만 바인딩)
    document.querySelectorAll('.report-nav .nav-link').forEach(a => {
      a.onclick = (e) => {
        e.preventDefault();
        const target = document.getElementById(a.getAttribute('href').slice(1));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
    });

    // ④ 스크롤 스파이 — 이전 리스너 제거 후 재등록
    const secIds = ['sec-summary','sec-swot','sec-stp','sec-4p','sec-strategy','sec-kpi','sec-roadmap'];
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
