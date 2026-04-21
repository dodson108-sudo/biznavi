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
  const screens = ['landing', 'mode-select', 'wizard', 'finance-wizard', 'finance-dashboard', 'loading', 'diag-reveal', 'dashboard'];
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

  /* ── MODE SELECT ── */
  function startWizard() {
    mode = apiKey ? 'real' : 'demo';
    Wizard.reset();
    show('wizard');
  }
  function showModeSelect() { show('mode-select'); }
  function startFinanceAnalysis() { show('finance-wizard'); FinWizard.goStep(1); }
  function showFinanceDashboard() { show('finance-dashboard'); }
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
    Wizard.goToStep2FromBm();
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
    if (n === 4) setTimeout(fillSavedKey, 50);
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
      // invalid x-api-key: 저장된 키가 만료/잘못된 것 → 즉시 삭제 후 재입력 안내
      if (e.message && (e.message.includes('invalid x-api-key') || e.message.includes('401'))) {
        localStorage.removeItem('biznavi_key');
        apiKey = '';
        mode = 'demo';
        const _k = document.getElementById('wizApiKey');
        if (_k) _k.value = '';
        show('wizard');
        Wizard.goStep(4);
        alert(
          '⚠️ API 키가 유효하지 않습니다.\n\n' +
          '저장된 키를 자동 삭제했습니다.\n' +
          'Anthropic Console (console.anthropic.com) → API Keys 에서\n' +
          '새 키를 발급받아 다시 입력해주세요.\n\n' +
          '(키를 입력하지 않으면 샘플 데이터로 진행됩니다)'
        );
        return;
      }
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

  /* ── PUBLIC API ── */
  function showApiModal() { showModal(); }

  // Init on load
  setTimeout(() => Dashboard.initCountUp(), 400);
  setTimeout(() => Dashboard.initInputChecks(), 100);
  // 저장된 API 키가 있으면 STEP4 입력란에 자동 채우기 (유효성 체크 후)
  function fillSavedKey() {
    const wizKeyEl = document.getElementById('wizApiKey');
    if (wizKeyEl && apiKey && apiKey.startsWith('sk-ant-')) wizKeyEl.value = apiKey;
  }

  return { startWizard, showLanding, showModeSelect, startFinanceAnalysis, showFinanceDashboard, showModal, showApiModal, closeModal, setMode, confirmKey, goStep, runAnalysis, restart, prevFromDash, saveApiKey, proceedToSolution, goBackToDiag, showBmConfirm, confirmBm, backToStep1, fillSavedKey };
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
