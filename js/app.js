/* ================================================================
   BizNavi AI — app.js
   메인 로직: 화면 전환, 모달, 위저드 진행, AI 분석 실행, 공개 API
   ================================================================ */

const App = (() => {
  /* ── STATE ── */
  let _pendingResult = null;
  let _pendingData   = null;
  let _pendingIsDemo = false;

  /* ── SCREEN ── */
  const screens = ['landing', 'mode-select', 'wizard', 'finance-wizard', 'finance-dashboard', 'finance-report', 'loading', 'diag-reveal', 'dashboard'];
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

  /* ── MODE SELECT ── */
  function startWizard() {
    Wizard.reset();
    show('wizard');
  }
  function showModeSelect() { show('mode-select'); }
  function startFinanceAnalysis() { show('finance-wizard'); FinWizard.goStep(1); }
  function showFinanceWizard() { show('finance-wizard'); }
  function showFinanceDashboard() { show('finance-dashboard'); }
  function showFinanceReport() { show('finance-report'); }
  function showLanding() { show('landing'); }

  /* ── AI 업종 분석 (Step 1 → biz-context) ── */
  async function analyzeBiz() {
    const companyName = document.getElementById('companyName')?.value.trim() || '';
    const bizType     = document.getElementById('bizType')?.value.trim() || '';
    const bizItem     = document.getElementById('bizItem')?.value.trim() || '';
    const foundedYear = document.getElementById('foundedYear')?.value.trim() || '';
    const employees   = document.getElementById('employees')?.value || '';
    const revenue     = document.getElementById('revenue')?.value.trim() || '';

    if (!companyName) { alert('상호명을 입력해주세요.'); return; }
    if (!bizType)     { alert('업태를 입력해주세요.\n(사업자등록증에 기재된 그대로 — 예: 서비스, 제조, 음식점)'); return; }
    if (!bizItem)     { alert('종목을 입력해주세요.\n(사업자등록증에 기재된 그대로 — 예: 미용업, 한식, 자동차부품)'); return; }

    const btn = document.getElementById('btnAnalyzeBiz');
    if (btn) { btn.disabled = true; btn.textContent = '분석 중…'; }

    try {
      const res = await fetch('/api/analyze-biz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bizType, bizItem, companyName, foundedYear, employees, revenue })
      });
      const data = await res.json();

      if (data.status !== 'success') throw new Error(data.message || '분석 실패');

      // 결과 hidden 필드에 저장
      document.getElementById('aiIndustryKey').value      = data.industry_key  || '';
      document.getElementById('aiBusinessDesc').value     = data.business_description || '';
      document.getElementById('bizScale').value           = data.biz_scale     || '';
      document.getElementById('aiIsStartup').value        = data.is_startup ? 'true' : 'false';
      document.getElementById('aiYearsInBusiness').value  = data.years_in_business ?? '';

      // biz-context 화면 렌더링
      Wizard.showBizContext(data, companyName, foundedYear);
      Wizard.hideAllCards();
      document.getElementById('biz-context').classList.remove('hidden');

    } catch (err) {
      alert('업종 분석 중 오류: ' + err.message + '\n\n잠시 후 다시 시도해주세요.');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'AI 업종 분석 시작 →'; }
    }
  }

  /* biz-context 확인 → 진단 시작 */
  function startDiagnosis() {
    const industryKey = document.getElementById('aiIndustryKey')?.value || 'local_service';
    const bizDesc     = document.getElementById('aiBusinessDesc')?.value || '';

    // 추가 진단 요청 사항 저장 (hidden input에 보존)
    const extraArea = document.getElementById('extraDiagArea')?.value?.trim() || '';
    const extraHidden = document.getElementById('extraDiagAreaHidden');
    if (extraHidden) extraHidden.value = extraArea;

    // biz-context 숨기기
    const bizCtx = document.getElementById('biz-context');
    if (bizCtx) bizCtx.classList.add('hidden');

    // 진단 UI 렌더링 후 직접 step2 전환 (goStep(2) 경유 시 step1 hidden 상태에서 animation 오류 발생)
    Wizard.loadDiagnosisUI(industryKey);
    Wizard.updateRiskPlaceholder(industryKey);
    Wizard.goToStep2FromBm();

    // Step 2 상단에 맥락 미니배너 표시
    const mini = document.getElementById('biz-context-mini');
    if (mini) {
      mini.textContent = '📋 ' + bizDesc;
      mini.classList.remove('hidden');
    }
  }

  /* Step 1으로 복귀 — reset()으로 step1 명시적 표시 (goStep(1)은 curStep===1이면 hidden 해제 안 됨) */
  function backToStep1() {
    document.getElementById('biz-context').classList.add('hidden');
    Wizard.reset();
  }

  /* 레거시 호환 — 더 이상 사용 안 함 */
  function showBmConfirm() { analyzeBiz(); }
  function confirmBm()     { startDiagnosis(); }

  function restart() {
    if (!confirm('새로 분석하시겠습니까?\n입력하신 모든 정보를 처음부터 다시 입력해야 합니다.')) return;
    Wizard.reset();
    show('wizard');
  }

  function prevFromDash() {
    show('wizard');
    Wizard.goStep(2);
  }

  function goStep(n) {
    Wizard.goStep(n);
  }

  /* ── ANALYSIS ── */
  async function runAnalysis() {
    if (!Wizard.validate(4)) return;

    const data = Wizard.collect();
    // consultingType을 AI 호출 전에 미리 계산 — 프롬프트에 반영되도록
    const _domScores = Wizard.calcDomainScores(data.diagScores || {}, data.isStartup);
    const _ctResult  = Wizard.classifyConsultingType(_domScores);
    data.consultingType          = _ctResult?.primary   || '';
    data.consultingTypeSecondary = _ctResult?.secondary || '';
    data.domainScores            = _domScores;
    show('loading');
    Wizard.animateLoading();

    // KOSIS + 기업마당 — AI 호출 전에 병렬 조회 (프롬프트 반영용)
    await Promise.allSettled([
      // ① KOSIS 업종 생존율
      // industryKey(영문) 우선 사용 — industry(한국어 레거시)는 select#industry가 없어 항상 ''
      (data.industryKey || data.industry)
        ? fetch('/api/kosis-survival', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ industryKey: data.industryKey || data.industry }),
          }).then(r => r.json()).then(sv => {
            if (sv && sv.y3) { window._kosisSurvival = sv; data.survivalData = sv; }
          })
        : Promise.resolve(),

      // ② 기업마당 정부지원사업
      fetch('/api/bizinfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industryKey:    data.industry    || '',
          bizScale:       data.bizScale    || 'micro',
          consultingType: data.consultingType || '',
        }),
      }).then(r => r.json()).then(bi => {
        if (bi && bi.programs && bi.programs.length > 0) {
          window._bizinfoPrograms = bi.programs;
          data.bizinfoPrograms = bi.programs;
        }
      }),
    ]);

    try {
      const result = await AIEngine.callClaude(data);
      _pendingResult = result;
      _pendingIsDemo = false;

      // 진단 이력 자동 저장
      let _currentSnap = null;
      if (typeof HistoryTracker !== 'undefined') {
        _currentSnap = HistoryTracker.save(data, result);
      }
      window._currentSnap = _currentSnap;

      Wizard.showDiagReveal(data, _currentSnap);
      _pendingData = data;
      show('diag-reveal');
    } catch (e) {
      alert('AI 분석 중 오류가 발생했습니다: ' + e.message + '\n\n샘플 데이터로 결과를 표시합니다.');
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

  /* 진단 수정: 위저드 STEP 2(진단)로 돌아가기 */
  function goBackToDiag() {
    show('wizard');
    Wizard.goStep(2);
  }

  // Init on load
  setTimeout(() => Dashboard.initCountUp(), 400);
  setTimeout(() => Dashboard.initInputChecks(), 100);

  /* ── 이력 패널 열기/닫기 ── */
  function openHistory() {
    const overlay = document.getElementById('historyOverlay');
    const drawer  = document.getElementById('historyDrawer');
    if (!overlay || !drawer) return;
    if (typeof HistoryTracker !== 'undefined') HistoryTracker.renderPanel();
    overlay.classList.remove('hidden');
    drawer.classList.remove('hidden');
    requestAnimationFrame(() => drawer.classList.add('open'));
  }

  function closeHistory() {
    const drawer = document.getElementById('historyDrawer');
    const overlay = document.getElementById('historyOverlay');
    if (drawer)  drawer.classList.remove('open');
    if (overlay) overlay.classList.add('hidden');
    setTimeout(() => drawer && drawer.classList.add('hidden'), 300);
  }

  return { startWizard, showLanding, showModeSelect, startFinanceAnalysis, showFinanceWizard, showFinanceDashboard, showFinanceReport, goStep, runAnalysis, restart, prevFromDash, proceedToSolution, goBackToDiag, analyzeBiz, startDiagnosis, backToStep1, showBmConfirm, confirmBm, openHistory, closeHistory };
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
