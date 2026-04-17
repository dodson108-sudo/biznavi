/* ================================================================
   BizNavi AI — app.js
   메인 로직: 화면 전환, 모달, 위저드 진행, AI 분석 실행, 공개 API
   ================================================================ */

const App = (() => {
  /* ── STATE ── */
  let mode = 'demo';
  let apiKey = localStorage.getItem('biznavi_key') || '';
  let _pendingResult = null;
  let _pendingData   = null;
  let _pendingIsDemo = false;

  /* ── SCREEN ── */
  const screens = ['landing', 'wizard', 'loading', 'diag-reveal', 'dashboard'];
  let _confirmedBmKey = ''; // BM 확인 화면에서 최종 확정된 BM 키

  function show(id) {
    const current = screens.find(s => !document.getElementById(s).classList.contains('hidden'));
    if (current && current !== id) {
      const curEl = document.getElementById(current);
      curEl.classList.add('page-exit');
      setTimeout(() => {
        curEl.classList.add('hidden');
        curEl.classList.remove('page-exit');
        curEl.style.display = '';
        _doShow(id);
      }, 300);
    } else {
      screens.forEach(s => {
        const el = document.getElementById(s);
        el.classList.add('hidden');
        el.style.display = '';
      });
      _doShow(id);
    }
  }

  function _doShow(id) {
    const target = document.getElementById(id);
    target.classList.remove('hidden');
    target.classList.add('page-enter');
    if (id === 'loading') target.style.display = 'flex';
    setTimeout(() => target.classList.remove('page-enter'), 500);
    window.scrollTo(0, 0);
    if (id === 'landing') Dashboard.initCountUp();
    if (id === 'dashboard') Dashboard.initScrollReveal();
  }

  /* ── MODAL ── */
  function showModal() {
    document.getElementById('apiModal').classList.remove('hidden');
    if (apiKey) {
      document.getElementById('apiKeyInput').value = apiKey;
      setMode('real');
    }
  }
  function closeModal() { document.getElementById('apiModal').classList.add('hidden'); }
  function setMode(m) {
    mode = m;
    const btnDemo    = document.getElementById('btnDemo');
    const btnReal    = document.getElementById('btnReal');
    const demoContent = document.getElementById('demoContent');
    const realContent = document.getElementById('realContent');
    if (m === 'real') {
      btnDemo.classList.remove('active');
      btnReal.classList.add('active');
      demoContent.classList.add('hidden');
      realContent.classList.remove('hidden');
    } else {
      btnReal.classList.remove('active');
      btnDemo.classList.add('active');
      realContent.classList.add('hidden');
      demoContent.classList.remove('hidden');
    }
  }
  function confirmKey() {
    if (mode === 'real') {
      const k = document.getElementById('apiKeyInput').value.trim();
      if (!k) { alert('API 키를 입력해주세요.'); return; }
      if (!k.startsWith('sk-ant-')) { alert('올바른 Anthropic API 키 형식이 아닙니다.\n(sk-ant-… 형식)'); return; }
      apiKey = k;
      localStorage.setItem('biznavi_key', k);
    }
    closeModal();
    show('wizard');
  }

  /* ── WIZARD COORDINATION ── */
  function startWizard() {
    mode = apiKey ? 'real' : 'demo';
    show('wizard');
  }
  function showLanding() { show('landing'); }

  /* BM 확인 화면: Step 1 → BM confirm */
  function showBmConfirm() {
    if (!Wizard.validate(1)) return;
    const industry    = document.getElementById('industry')?.value || '';
    const industryKey = Wizard.getIndustryKey(industry);
    const formData    = {
      products:        document.getElementById('products')?.value        || '',
      coreStrength:    document.getElementById('coreStrength')?.value    || '',
      customerProblem: document.getElementById('customerProblem')?.value || '',
      unfairAdvantage: document.getElementById('unfairAdvantage')?.value || ''
    };
    Wizard.populateBmConfirm(industryKey, industry, formData);
    // bm-confirm은 wizard 카드 안의 div — step 전환 방식으로 처리
    Wizard.showBmConfirmCard();
  }

  /* BM 확인 후 Step 2 진행 */
  function confirmBm() {
    const selected = document.querySelector('input[name="bmChoice"]:checked');
    if (!selected) { alert('사업모델을 선택해주세요.'); return; }
    _confirmedBmKey = selected.value;
    Wizard.setBmKey(_confirmedBmKey);
    Wizard.goStep(2);
  }

  /* BM 확인 → Step 1 복귀 */
  function backToStep1() {
    Wizard.hideBmConfirmCard();
    Wizard.goStep(1);
  }

  function restart() {
    if (!confirm('새로 분석하시겠습니까?\n입력하신 모든 정보를 처음부터 다시 입력해야 합니다.')) return;
    Wizard.reset();
    show('wizard');
  }

  function prevFromDash() {
    show('wizard');
    Wizard.goStep(4);
  }

  function goStep(n) {
    Wizard.goStep(n);
  }

  /* ── ANALYSIS ── */
  async function runAnalysis() {
    if (!Wizard.validate(3)) return;

    // STEP 4 API 키 입력란에서 키 읽기
    const wizKeyEl = document.getElementById('wizApiKey');
    if (wizKeyEl && wizKeyEl.value.trim()) {
      const k = wizKeyEl.value.trim();
      if (k.startsWith('sk-ant-')) {
        apiKey = k;
        localStorage.setItem('biznavi_key', k);
        mode = 'real';
      } else {
        alert('API 키 형식이 올바르지 않습니다.\n(sk-ant-… 형식)\n\n샘플 데이터로 진행합니다.');
        mode = 'demo';
        apiKey = '';
      }
    } else {
      mode = apiKey ? 'real' : 'demo';
    }

    const data = Wizard.collect();
    show('loading');
    Wizard.animateLoading();
    try {
      const result = (mode === 'demo' || !apiKey)
        ? await AIEngine.fakeAnalysis(data)
        : await AIEngine.callClaude(apiKey, data);
      // 분석 결과 보관 → diag-reveal 화면으로 이동
      _pendingResult = result;
      _pendingIsDemo = (mode === 'demo' || !apiKey);
      const revealInfo = Wizard.showDiagReveal(data);
      data.consultingType = revealInfo?.primary || '';
      _pendingData = data;
      show('diag-reveal');
    } catch (e) {
      alert('오류: ' + e.message + '\n\n샘플 데이터로 대체합니다.');
      const result = await AIEngine.fakeAnalysis(data);
      _pendingResult = result;
      _pendingIsDemo = true;
      const revealInfo = Wizard.showDiagReveal(data);
      data.consultingType = revealInfo?.primary || '';
      _pendingData = data;
      show('diag-reveal');
    }
  }

  /* 진단유형 확인 후 솔루션 보고서로 이동 */
  function proceedToSolution() {
    if (!_pendingResult || !_pendingData) return;
    Dashboard.render(_pendingResult, _pendingData, _pendingIsDemo);
    show('dashboard');
  }

  /* 진단 수정: 위저드 STEP 4로 돌아가기 */
  function goBackToDiag() {
    show('wizard');
    Wizard.goStep(4);
  }

  /* API 키 저장 후 분석 시작 (API 박스 확인 버튼) */
  function saveApiKey() {
    const wizKeyEl = document.getElementById('wizApiKey');
    if (!wizKeyEl || !wizKeyEl.value.trim()) {
      alert('API 키를 입력해주세요.');
      return;
    }
    const k = wizKeyEl.value.trim();
    if (!k.startsWith('sk-ant-')) {
      alert('API 키 형식이 올바르지 않습니다.\n(sk-ant-… 형식으로 입력해주세요.)');
      return;
    }
    apiKey = k;
    localStorage.setItem('biznavi_key', k);
    mode = 'real';
    runAnalysis();
  }

  /* ── DEV SHORTCUT ── */
  async function devJump(target) {
    // Step 1 더미 데이터 채우기
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    set('company',         '테스트회사');
    set('industry',        'IT/소프트웨어');
    set('founded',         '2020');
    set('employees',       '15');
    set('revenue',         '5억');
    set('products',        'B2B SaaS 영업관리 솔루션');
    set('coreStrength',    '쉬운 UI와 빠른 도입');
    set('customerProblem', '엑셀로 영업 현황을 관리하는 비효율');
    set('unfairAdvantage', '업계 최저 도입 비용');

    // Step 2 (진단) 더미 점수
    const fillDiag = () => {
      const keys = ['common_1_1','common_1_2','common_1_3','common_1_4','common_2_1','common_2_2','common_2_3','common_2_4','common_3_1','common_3_2','common_3_4','common_4_1','common_4_2','common_4_3','common_4_4','common_5_2','common_5_3'];
      keys.forEach(k => { if (!Wizard.collect().diagScores?.[k]) { const btn = document.querySelector('[data-key="' + k + '"][data-score="3"]'); if (btn) btn.click(); } });
    };

    // Step 3 더미
    const fillStep3 = () => {
      set('targetCustomer',  '영업사원 10명 이상 중소기업 영업팀장');
      set('competitors',     'Salesforce, 파이프드라이브');
      set('tam',             '1조');
      set('sam',             '300억');
      set('som',             '30억');
      set('marketGrowth',    '15');
      set('growthChannel',   '콘텐츠 마케팅, 파트너십');
      set('cacTarget',       '150');
      set('ltvTarget',       '600');
    };

    // Step 4 더미
    const fillStep4 = () => {
      set('problems',     '영업 프로세스 표준화 부재, 마케팅-영업 연계 미흡');
      set('goals',        '12개월 내 MRR 5천만원 달성');
      set('timeline',     '12');
      set('budget',       '5000');
    };

    show('wizard');
    await new Promise(r => setTimeout(r, 100));

    if (target === 1 || target === 'step1') return;

    // BM 확정
    Wizard.setBmKey('b2b_saas');

    if (target === 'bm' || target === 'bm-confirm') {
      const bmCard = document.getElementById('bm-confirm');
      const s1 = document.getElementById('step1');
      if (s1) s1.classList.add('hidden');
      if (bmCard) { bmCard.classList.remove('hidden'); }
      return;
    }

    Wizard.goStep(2);
    await new Promise(r => setTimeout(r, 400));
    fillDiag();
    if (target === 2 || target === 'step2') return;

    Wizard.goStep(3);
    await new Promise(r => setTimeout(r, 300));
    fillStep3();
    if (target === 3 || target === 'step3') return;

    Wizard.goStep(4);
    await new Promise(r => setTimeout(r, 300));
    fillStep4();
    if (target === 4 || target === 'step4') return;

    if (target === 'dashboard' || target === 'd') {
      show('loading');
      const data = Wizard.collect();
      const result = await AIEngine.fakeAnalysis(data);
      _pendingResult = result;
      _pendingIsDemo = true;
      const revealInfo = Wizard.showDiagReveal(data);
      data.consultingType = revealInfo?.primary || '';
      _pendingData = data;
      Dashboard.render(result, data, true);
      show('dashboard');
    } else if (target === 'diag' || target === 'diag-reveal') {
      show('loading');
      const data = Wizard.collect();
      const result = await AIEngine.fakeAnalysis(data);
      _pendingResult = result;
      _pendingIsDemo = true;
      _pendingData = data;
      Wizard.showDiagReveal(data);
      show('diag-reveal');
    }
  }

  /* ── PUBLIC API ── */
  function showApiModal() { showModal(); }

  // 개발용 플로팅 패널 (localhost에서만 표시)
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    setTimeout(() => {
      const panel = document.createElement('div');
      panel.id = 'dev-panel';
      panel.style.cssText = 'position:fixed;bottom:60px;left:8px;z-index:99999;background:#1a1a2e;border:1px solid #F5C030;border-radius:8px;padding:8px;display:flex;flex-direction:column;gap:4px;font-size:12px;';
      const btns = [
        ['Step 2', 2], ['Step 3', 3], ['Step 4', 4],
        ['진단유형', 'diag'], ['대시보드', 'dashboard']
      ];
      btns.forEach(([label, target]) => {
        const b = document.createElement('button');
        b.textContent = '⚡ ' + label;
        b.style.cssText = 'background:#F5C030;color:#0a0e1a;border:none;border-radius:4px;padding:3px 8px;cursor:pointer;font-weight:700;font-size:11px;';
        b.onclick = () => devJump(target);
        panel.appendChild(b);
      });
      document.body.appendChild(panel);
    }, 600);
  }

  // Init on load
  setTimeout(() => Dashboard.initCountUp(), 400);
  setTimeout(() => Dashboard.initInputChecks(), 100);
  // 저장된 API 키가 있으면 STEP4 입력란에 자동 채우기
  setTimeout(() => {
    const wizKeyEl = document.getElementById('wizApiKey');
    if (wizKeyEl && apiKey) wizKeyEl.value = apiKey;
  }, 200);

  return { startWizard, showLanding, showModal, showApiModal, closeModal, setMode, confirmKey, goStep, runAnalysis, restart, prevFromDash, saveApiKey, proceedToSolution, goBackToDiag, showBmConfirm, confirmBm, backToStep1, devJump };
})();

/* ===== LANDING PAGE JS ===== */
// FAQ Accordion — must be global for onclick="lpToggleFaq(this)"
function lpToggleFaq(btn) {
  const item = btn.closest('.lp-faq-item');
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.lp-faq-item.open').forEach(el => el.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

// 모든 화면의 nav-logo 클릭 → 홈(랜딩) 이동
document.querySelectorAll('.nav-logo').forEach(function(logo) {
  logo.style.cursor = 'pointer';
  logo.addEventListener('click', function() {
    App.showLanding();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

// Nav scroll effect
(function() {
  const nav = document.getElementById('lpNav');
  if (!nav) return;
  window.addEventListener('scroll', function() {
    if (window.scrollY > 50) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }, { passive: true });
})();

// IntersectionObserver for section fade-in
(function() {
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
  document.querySelectorAll('.lp-section:not(.visible)').forEach(function(el) {
    observer.observe(el);
  });
})();

// Smooth scroll for nav links
document.querySelectorAll('.lp-nav-links a[href^="#"]').forEach(function(a) {
  a.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// 모바일 햄버거 메뉴 토글
(function() {
  const btn  = document.querySelector('.lp-nav-hamburger');
  const menu = document.getElementById('lpMobileMenu');
  if (!btn || !menu) return;

  function openMenu() {
    menu.classList.add('open');
    btn.textContent = '✕';
    btn.setAttribute('aria-expanded', 'true');
  }
  function closeMenu() {
    menu.classList.remove('open');
    btn.textContent = '☰';
    btn.setAttribute('aria-expanded', 'false');
  }
  function toggleMenu() {
    menu.classList.contains('open') ? closeMenu() : openMenu();
  }

  btn.addEventListener('click', toggleMenu);

  // 메뉴 링크 클릭 시 스크롤 이동 + 자동 닫기
  menu.querySelectorAll('.lp-mobile-link').forEach(function(a) {
    a.addEventListener('click', function(e) {
      e.preventDefault();
      closeMenu();
      const target = document.querySelector(a.getAttribute('href'));
      if (target) setTimeout(function() {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 180); // 닫기 애니메이션 후 스크롤
    });
  });

  // 메뉴 영역 바깥 클릭 시 닫기
  document.addEventListener('click', function(e) {
    if (!menu.contains(e.target) && !btn.contains(e.target)) closeMenu();
  });
})();
