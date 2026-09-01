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
  const screens = ['landing', 'mode-select', 'wizard', 'finance-wizard', 'finance-dashboard', 'finance-report', 'loading', 'diag-reveal', 'dashboard', 'analysis-error'];
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
  /* 정책자금 진단 진입점 — reset() 이후 purpose를 지정해야 함 (reset이 'general'로 초기화) */
  function startFundingDiagnosis() {
    Wizard.reset();
    Wizard.setPurpose('funding');
    Wizard.goStep(1);   // 인디케이터를 funding 2단계 표시로 다시 그림 (reset은 general 기준으로 그림)
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

    // 정책자금 진단 경로 — 경영진단 UI를 렌더링하지 않고 step5로 직행
    if (Wizard.getPurpose && Wizard.getPurpose() === 'funding') {
      Wizard.goStep(5);
      return;
    }

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
    _socialReqId++;   // 진행 중인 백그라운드 AI 결과가 새 화면에 꽂히지 않게 무효화
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

  /* 정책자금 진단 입력 확인용 — 판정 로직은 4단계에서 구현.
     의도적으로 runAnalysis()에 연결하지 않는다 (진단점수가 빈 상태로 Claude API를 호출하면
     토큰만 소모되고 결과는 무의미하므로) */
  function checkFundingInput() {
    if (!Wizard.validate(5)) return;
    const data = Wizard.collect() || {};
    if (!data.fundingVerdict) {
      alert('판정 결과를 생성하지 못했습니다.\n페이지를 새로고침한 뒤 다시 시도해 주세요.');
      return;
    }
    _pendingData = data;
    // ① 판정 결과를 먼저 렌더링한다 — AI 응답을 기다리지 않는다
    //    정책자금은 진단 점수·레이더차트가 없으므로 diag-reveal을 거치지 않는다
    Dashboard.renderFunding(data);
    show('dashboard');
    // ② 그 다음 AI 로드맵을 호출한다 (로드맵 섹션은 이미 로딩 상태)
    _loadFundingRoadmap(data);
  }

  /* 정책자금 AI 로드맵 — 실패해도 판정 결과는 그대로 둔다.
     가짜 데이터(fakeAnalysis 계열)를 절대 사용하지 않는다. */
  async function _loadFundingRoadmap(data) {
    try {
      const roadmap = await AIEngine.callFundingRoadmap(data);
      Dashboard.renderFundingRoadmap('done', roadmap);
    } catch (e) {
      console.error('[정책자금] 실행 로드맵 생성 실패:', e);
      Dashboard.renderFundingRoadmap('error');
    }
  }

  /* [다시 시도] — AI만 재호출한다. 판정 결과는 재계산하지 않는다 */
  function retryFundingRoadmap() {
    if (!_pendingData) return;
    Dashboard.renderFundingRoadmap('loading');
    _loadFundingRoadmap(_pendingData);
  }

  /* ══════════════════════════════════════════════════════════════
     사회적경제 조직 — AI 실행 계획 (백그라운드 호출)

     진단 결과(레이더차트·8영역·경고)는 AI 없이 이미 계산되어 있으므로
     diag-reveal을 먼저 띄우고, 사용자가 그 화면을 읽는 동안 AI를 돌린다.
     → 체감 대기 시간이 사실상 사라진다.

     ⚠ 경쟁 조건 방어: 요청마다 _socialReqId를 증가시키고, 응답이 도착했을 때
        자신의 id가 최신인지 확인한다. 사용자가 뒤로 가거나 새 분석을 시작하면
        id가 달라지므로 늦게 도착한 이전 요청 결과는 버려진다.
     ⚠ 백그라운드 실패를 diag-reveal에 띄우지 않는다. 그 시점의 사용자는
        레이더차트를 보고 있다. 에러는 대시보드의 sec-social-action에서만 표시한다.
  ══════════════════════════════════════════════════════════════ */
  let _socialReqId = 0;

  /* 조직 형태 판정 — collect()가 실어 보낸 파생 플래그를 쓴다(배열 복제 금지).
     플래그가 없는 레거시 데이터는 orgType으로 판단한다 */
  function _isSocialData(d) {
    if (!d) return false;
    if (typeof d.isSocialOrg === 'boolean') return d.isSocialOrg;
    const t = d.orgType || 'general';
    return t !== 'general' && t !== '';
  }

  async function _loadSocialPlan(data, reqId) {
    try {
      const plan = await AIEngine.callSocialPlan(data);
      if (reqId !== _socialReqId) return;            // 낡은 요청 — 결과 폐기
      Dashboard.renderSocialPlan('done', plan);
    } catch (e) {
      if (reqId !== _socialReqId) return;
      console.error('[사회적경제] AI 실행 계획 생성 실패:', e);
      Dashboard.renderSocialPlan('error');
    }
  }

  /* [다시 시도] — AI만 재호출한다. 진단 결과는 재계산하지 않는다 */
  function retrySocialPlan() {
    if (!_pendingData) return;
    const myId = ++_socialReqId;
    Dashboard.renderSocialPlan('loading');
    _loadSocialPlan(_pendingData, myId);
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
    Wizard.animateLoading(data.bizScale === 'micro');

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

      // ② 정부지원사업 — gov-support.js(상시 마스터)가 기반, 기업마당 실시간은 성공 시에만 덧붙임
      (async () => {
        // 기반 매칭: 항상 동작해야 한다 (GovSupport 미로드 시에도 빈 배열로 안전하게)
        try {
          data.govPrograms = (typeof GovSupport !== 'undefined') ? (GovSupport.match(data) || []) : [];
        } catch (e) {
          data.govPrograms = [];
        }
        window._govPrograms = data.govPrograms;

        // 실시간 공고: ok:false 이거나 예외면 조용히 생략 — 사용자에게 에러를 노출하지 않는다
        try {
          const r = await fetch('/api/bizinfo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              industryKey:    data.industryKey || data.industry || '',
              bizScale:       data.bizScale    || 'micro',
              consultingType: data.consultingType || '',
            }),
          });
          const bi = await r.json();
          if (bi && bi.ok === true && Array.isArray(bi.programs) && bi.programs.length > 0) {
            window._bizinfoPrograms = bi.programs;
            data.bizinfoPrograms = bi.programs;
          }
        } catch (e) { /* 실시간 조회 실패 — 상시 매칭 결과만 사용 */ }
      })(),
    ]);

    /* 사회적경제 조직 — 전용 단일 호출 경로.
       ⚠ callClaude()는 1/2/3차 순차 호출로 SWOT·STP·4P·D1~D7을 생성하는데,
          renderSocial()의 9섹션은 그중 무엇도 쓰지 않는다. 호출 자체를 하지 않는다. */
    if (_isSocialData(data)) {
      _pendingResult = null;
      _pendingIsDemo = false;
      _pendingData = data;

      // 진단 이력 저장 — AI 결과가 없으므로 null (executiveSummary만 참조하므로 안전)
      let _snap = null;
      if (typeof HistoryTracker !== 'undefined') {
        try { _snap = HistoryTracker.save(data, null); } catch (e) { console.error('[이력 저장]', e); }
      }
      window._currentSnap = _snap;

      // ① 진단 결과를 먼저 보여준다 — AI를 기다리지 않는다
      Wizard.showDiagReveal(data, _snap);
      show('diag-reveal');

      // ② 사용자가 레이더차트를 읽는 동안 백그라운드로 AI 호출
      const myId = ++_socialReqId;
      Dashboard.renderSocialPlan('loading');
      _loadSocialPlan(data, myId);
      return;
    }

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
      // ⚠ 가짜 데이터(fakeAnalysis)로 덮지 않는다.
      //    실제 분석이 실패했는데 그럴듯한 보고서가 나오면 사용자가 자기 회사 분석으로 오인한다.
      console.error('[AI 분석 실패]', e);   // 원본 메시지(JSON 조각 포함)는 콘솔에만
      _pendingResult = null;
      _pendingData = data;
      showAnalysisError(e);
    }
  }

  /* 실패 원인을 사용자가 이해할 수 있는 말로 변환 — 원본 메시지는 노출하지 않는다 */
  function _friendlyAnalysisError(e) {
    const raw = String((e && e.message) || '');
    if (/max_tokens|절단|이어쓰기|불완전/i.test(raw)) {
      return '분석 내용이 길어 생성이 중단되었습니다. 다시 시도하면 완성되는 경우가 많습니다.';
    }
    if (/timeout|타임아웃|network|fetch|502|504|연결|지연/i.test(raw)) {
      return '서버 응답이 지연되었습니다. 잠시 후 다시 시도해 주세요.';
    }
    return '일시적인 오류가 발생했습니다. 다시 시도해 주세요.';
  }

  function showAnalysisError(e) {
    const msgEl = document.getElementById('analysisErrorMsg');
    if (msgEl) msgEl.textContent = _friendlyAnalysisError(e);
    show('analysis-error');
  }

  /* [다시 시도] — 같은 입력으로 재분석 */
  function retryAnalysis() {
    runAnalysis();
  }

  /* [입력 수정] — 실패 화면에서 위저드 STEP 4로 복귀 (analysis-error는 wizard 밖 화면이므로 show 필요) */
  function editInputsFromError() {
    show('wizard');
    Wizard.goStep(4, true);
  }

  /* 진단유형 확인 후 솔루션 보고서로 이동 */
  function proceedToSolution() {
    if (!_pendingData) return;
    /* 사회적경제 경로는 AI 결과 없이도 진단 결과만으로 9섹션을 렌더링한다.
       AI 실행 계획은 sec-social-action에서 상태(loading/done/error)에 따라 표시된다 */
    if (_isSocialData(_pendingData)) {
      Dashboard.render(null, _pendingData, false);
      show('dashboard');
      return;
    }
    if (!_pendingResult) return;
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

  return { startWizard, startFundingDiagnosis, checkFundingInput, retryFundingRoadmap, retrySocialPlan, retryAnalysis, editInputsFromError, showLanding, showModeSelect, startFinanceAnalysis, showFinanceWizard, showFinanceDashboard, showFinanceReport, goStep, runAnalysis, restart, prevFromDash, proceedToSolution, goBackToDiag, analyzeBiz, startDiagnosis, backToStep1, showBmConfirm, confirmBm, openHistory, closeHistory };
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
