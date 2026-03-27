/* ================================================================
   BizNavi AI — app.js
   메인 로직: 화면 전환, 모달, 위저드 진행, AI 분석 실행, 공개 API
   ================================================================ */

const App = (() => {
  /* ── STATE ── */
  let mode = 'demo';
  let apiKey = localStorage.getItem('biznavi_key') || '';

  /* ── SCREEN ── */
  const screens = ['landing', 'wizard', 'loading', 'dashboard'];

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
    document.getElementById('btnDemo').classList.toggle('active', m === 'demo');
    document.getElementById('btnReal').classList.toggle('active', m === 'real');
    document.getElementById('demoContent').classList.toggle('hidden', m !== 'demo');
    document.getElementById('realContent').classList.toggle('hidden', m !== 'real');
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
  function startWizard() { showModal(); }
  function showLanding() { show('landing'); }

  function restart() {
    Wizard.reset();
    show('wizard');
  }

  function goStep(n) {
    Wizard.goStep(n);
  }

  /* ── ANALYSIS ── */
  async function runAnalysis() {
    if (!Wizard.validate(3)) return;
    const data = Wizard.collect();
    show('loading');
    Wizard.animateLoading();
    try {
      const result = (mode === 'demo' || !apiKey)
        ? await AIEngine.fakeAnalysis(data)
        : await AIEngine.callClaude(apiKey, data);
      Dashboard.render(result, data, mode === 'demo' || !apiKey);
      show('dashboard');
    } catch (e) {
      alert('오류: ' + e.message + '\n\n데모 데이터로 대체합니다.');
      const result = await AIEngine.fakeAnalysis(data);
      Dashboard.render(result, data, true);
      show('dashboard');
    }
  }

  /* ── PUBLIC API ── */
  function showApiModal() { showModal(); }

  // Init on load
  setTimeout(() => Dashboard.initCountUp(), 400);
  setTimeout(() => Dashboard.initInputChecks(), 100);

  return { startWizard, showLanding, showModal, showApiModal, closeModal, setMode, confirmKey, goStep, runAnalysis, restart };
})();

/* ===== LANDING PAGE JS ===== */
// FAQ Accordion — must be global for onclick="lpToggleFaq(this)"
function lpToggleFaq(btn) {
  const item = btn.closest('.lp-faq-item');
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.lp-faq-item.open').forEach(el => el.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

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
