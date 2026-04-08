/* ================================================================
   BizNavi AI — wizard.js (고도화 v3.1)
   4단계 입력 위저드: 탭 순서 진행, 입력값 유지, 점수 복원
   ================================================================ */

const Wizard = (() => {
  let curStep = 1;
  let curDiagTab = 'common';
  const diagScores = {};
  const diagMemos = {};

  const INDUSTRY_MAP = {
    '제조업': 'mfg_parts',
    '식품/음료': 'food_mfg',
    '서비스업': 'local_service',
    '유통/물류': 'wholesale',
    '외식 및 휴게음식업': 'restaurant',
    'IT/소프트웨어': 'knowledge_it',
    '건설/부동산': 'construction',
    '의료/헬스케어': 'local_service',
    '금융/핀테크': 'knowledge_it',
    '교육': 'knowledge_it',
    '패션/뷰티': 'local_service',
    '미디어/엔터테인먼트': 'knowledge_it',
    '기타': 'etc'
  };

  const BIZMODEL_MAP = {
    'B2B SaaS': 'b2b_saas',
    'B2C 구독': 'b2c_sub',
    'B2B 솔루션': 'b2b_solution',
    'B2C 커머스': 'b2c_commerce',
    '플랫폼·마켓플레이스': 'platform',
    '프랜차이즈': 'franchise',
    '제조·유통': 'mfg_dist',
    '서비스업': 'service',
    '기타': 'etc'
  };

  // 탭 순서 정의
  const TAB_ORDER = ['common', 'industry', 'bizmodel'];

  function goStep(n) {
    // STEP 2에서 다음 버튼 클릭 시 탭 순서대로 진행
    if (curStep === 2 && n === 3) {
      if (!validateCurrentTab()) return;
      const currentTabIndex = TAB_ORDER.indexOf(curDiagTab);
      if (currentTabIndex < TAB_ORDER.length - 1) {
        const nextTab = TAB_ORDER[currentTabIndex + 1];
        switchDiagTab(nextTab);
        window.scrollTo(0, 60);
        return;
      }
    }

    if (n > curStep && !validate(curStep)) return;
    if (n === 2) loadDiagnosisUI();

    const prevStep = curStep;
    curStep = n;
    updateStepUI(n);

    const prev = document.getElementById('step' + prevStep);
    const next = document.getElementById('step' + n);
    if (prevStep !== n) {
      prev.classList.add('slide-exit');
      setTimeout(() => {
        prev.classList.add('hidden');
        prev.classList.remove('slide-exit');
        next.classList.remove('hidden');
        next.classList.add('slide-enter');
        setTimeout(() => next.classList.remove('slide-enter'), 400);
      }, 250);
    }
    window.scrollTo(0, 60);
  }

  function updateStepUI(n) {
    for (let i = 1; i <= 4; i++) {
      const c = document.getElementById('c' + i);
      const lb = document.getElementById('l' + i);
      if (!c || !lb) continue;
      c.classList.remove('active', 'done');
      lb.classList.remove('active');
      if (i < n)        { c.classList.add('done'); c.textContent = '✓'; }
      else if (i === n) { c.classList.add('active'); c.textContent = i; lb.classList.add('active'); }
      else              { c.textContent = i; }
    }
    document.getElementById('ln1').classList.toggle('done', n > 1);
    document.getElementById('ln2').classList.toggle('done', n > 2);
    document.getElementById('ln3').classList.toggle('done', n > 3);
    const pct = n === 1 ? 25 : n === 2 ? 50 : n === 3 ? 75 : 100;
    document.getElementById('wizProgressFill').style.width = pct + '%';
  }

  function validate(step) {
    const get = id => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };
    if (step === 1) {
      if (!get('companyName'))  { alert('회사명을 입력해주세요.');           return false; }
      if (!get('industry'))     { alert('업종을 선택해주세요.');             return false; }
      if (!get('bizModel'))     { alert('비즈니스 모델을 선택해주세요.');     return false; }
      if (!get('products'))     { alert('주요 제품/서비스를 입력해주세요.');  return false; }
      if (!get('coreStrength')) { alert('핵심 강점 한 줄을 입력해주세요.');  return false; }
    }
    if (step === 2) {
      const done = Object.keys(diagScores).filter(k => diagScores[k].score > 0).length;
      if (done < 10) {
        alert('진단 항목을 최소 10개 이상 입력해주세요. (현재 ' + done + '개)');
        return false;
      }
    }
    if (step === 3) {
      if (!get('targetCustomer')) { alert('타겟 고객을 입력해주세요.');   return false; }
      if (!get('competitors'))    { alert('주요 경쟁사를 입력해주세요.'); return false; }
    }
    if (step === 4) {
      if (!get('problems')) { alert('현재 직면한 문제를 입력해주세요.'); return false; }
      if (!get('goals'))    { alert('달성 목표를 입력해주세요.');         return false; }
    }
    return true;
  }

  function loadDiagnosisUI() {
    const industry = document.getElementById('industry')?.value || '';
    const bizModel = document.getElementById('bizModel')?.value || '';
    const industryKey = INDUSTRY_MAP[industry] || 'mfg_parts';
    const bizModelKey = BIZMODEL_MAP[bizModel] || 'etc';

    // 공통 모듈 렌더링
    renderDiagModule('diag-common-container', COMMON_DIAGNOSIS);

    // 업종 특화 모듈 렌더링
    const industryVarMap = {
      'mfg_parts':     typeof INDUSTRY_MFG_PARTS    !== 'undefined' ? INDUSTRY_MFG_PARTS    : null,
      'food_mfg':      typeof INDUSTRY_FOOD_MFG     !== 'undefined' ? INDUSTRY_FOOD_MFG     : null,
      'local_service': typeof INDUSTRY_LOCAL_SERVICE !== 'undefined' ? INDUSTRY_LOCAL_SERVICE : null,
      'wholesale':     typeof INDUSTRY_WHOLESALE    !== 'undefined' ? INDUSTRY_WHOLESALE    : null,
      'restaurant':    typeof INDUSTRY_RESTAURANT   !== 'undefined' ? INDUSTRY_RESTAURANT   : null,
      'knowledge_it':  typeof INDUSTRY_KNOWLEDGE_IT !== 'undefined' ? INDUSTRY_KNOWLEDGE_IT : null,
      'construction':  typeof INDUSTRY_CONSTRUCTION !== 'undefined' ? INDUSTRY_CONSTRUCTION : null,
    };
    const industryData = industryVarMap[industryKey];
    if (industryData) renderDiagModule('diag-industry-container', industryData);

    // 사업모델 특화 모듈 렌더링
    const bizModelVarMap = {
      'b2b_saas':     typeof BIZMODEL_B2B_SAAS     !== 'undefined' ? BIZMODEL_B2B_SAAS     : null,
      'b2c_sub':      typeof BIZMODEL_B2C_SUB      !== 'undefined' ? BIZMODEL_B2C_SUB      : null,
      'b2b_solution': typeof BIZMODEL_B2B_SOLUTION !== 'undefined' ? BIZMODEL_B2B_SOLUTION : null,
      'b2c_commerce': typeof BIZMODEL_B2C_COMMERCE !== 'undefined' ? BIZMODEL_B2C_COMMERCE : null,
      'platform':     typeof BIZMODEL_PLATFORM     !== 'undefined' ? BIZMODEL_PLATFORM     : null,
      'franchise':    typeof BIZMODEL_FRANCHISE    !== 'undefined' ? BIZMODEL_FRANCHISE    : null,
      'mfg_dist':     typeof BIZMODEL_MFG_DIST     !== 'undefined' ? BIZMODEL_MFG_DIST     : null,
      'service':      typeof BIZMODEL_SERVICE      !== 'undefined' ? BIZMODEL_SERVICE      : null,
      'etc':          typeof BIZMODEL_ETC          !== 'undefined' ? BIZMODEL_ETC          : null,
    };
    const bizModelData = bizModelVarMap[bizModelKey];
    if (bizModelData) renderDiagModule('diag-bizmodel-container', bizModelData);

    // 첫 탭으로 리셋
    curDiagTab = 'common';
    updateDiagTabUI('common');

    // 저장된 점수 복원
    restoreScores();
  }

  function renderDiagModule(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container || !data) return;
    let html = '<div class="diag-module">';
    html += '<h3 class="diag-module-title">' + data.title + '</h3>';
    data.areas.forEach(area => {
      html += '<div class="diag-area">';
      html += '<div class="diag-area-header">';
      html += '<h4 class="diag-area-title">' + area.title + '</h4>';
      if (area.description) html += '<p class="diag-area-desc">' + area.description + '</p>';
      html += '</div>';
      area.items.forEach(item => {
        const scoreKey = containerId + '_' + item.id;
        html += '<div class="diag-item" id="diag-item-' + scoreKey + '">';
        html += '<div class="diag-item-text">' + item.text + '</div>';
        html += '<div class="diag-scale">';
        html += '<span class="diag-scale-label">' + item.min + '</span>';
        html += '<div class="diag-scale-buttons">';
        for (let s = 1; s <= 5; s++) {
          html += '<button class="diag-score-btn" data-key="' + scoreKey + '" data-score="' + s + '" onclick="Wizard.setScore(\'' + scoreKey + '\',' + s + ',this)">' + s + '</button>';
        }
        html += '</div>';
        html += '<span class="diag-scale-label">' + item.max + '</span>';
        html += '</div>';
        // 저장된 메모 복원
        const savedMemo = diagMemos[scoreKey] || '';
        html += '<textarea class="diag-memo" placeholder="💬 구체적 상황 메모 (선택)" onchange="Wizard.setMemo(\'' + scoreKey + '\',this.value)">' + savedMemo + '</textarea>';
        html += '</div>';
      });
      html += '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  // 저장된 점수 UI 복원
  function restoreScores() {
    Object.keys(diagScores).forEach(key => {
      const saved = diagScores[key];
      if (!saved || !saved.score) return;
      const buttons = document.querySelectorAll('[data-key="' + key + '"]');
      buttons.forEach(btn => {
        btn.classList.remove('selected');
        if (parseInt(btn.dataset.score) === saved.score) {
          btn.classList.add('selected');
        }
      });
    });
  }

  function setScore(key, score, btn) {
    diagScores[key] = { score: score, memo: diagScores[key]?.memo || '' };
    const buttons = btn.parentElement.querySelectorAll('.diag-score-btn');
    buttons.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    updateDiagProgress();
  }

  function setMemo(key, memo) {
    diagMemos[key] = memo;
    if (!diagScores[key]) diagScores[key] = { score: 0, memo: memo };
    else diagScores[key].memo = memo;
  }

  function updateDiagProgress() {
    const total = 48;
    const done = Object.keys(diagScores).filter(k => diagScores[k].score > 0).length;
    const pct = Math.round((done / total) * 100);
    const el = document.getElementById('diag-progress-text');
    const fill = document.getElementById('diag-progress-fill');
    if (el) el.textContent = done + ' / ' + total + ' 항목 완료';
    if (fill) fill.style.width = pct + '%';
  }

  function validateCurrentTab() {
    const tabContainerId = 'diagTab-' + curDiagTab;
    const tabContent = document.getElementById(tabContainerId);
    if (!tabContent) return true;

    const allItems = tabContent.querySelectorAll('.diag-item');
    let firstUnchecked = null;
    let uncheckedCount = 0;

    allItems.forEach(item => {
      const key = item.id.replace('diag-item-', '');
      const hasScore = diagScores[key] && diagScores[key].score > 0;
      if (!hasScore) {
        uncheckedCount++;
        if (!firstUnchecked) firstUnchecked = item;
        item.classList.add('diag-item-warning');
      } else {
        item.classList.remove('diag-item-warning');
      }
    });

    if (uncheckedCount > 0) {
      alert('아직 체크하지 않은 항목이 ' + uncheckedCount + '개 있습니다. 확인 후 진행해주세요.');
      if (firstUnchecked) {
        firstUnchecked.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }
    return true;
  }

  function prevDiagTab() {
    const currentIndex = TAB_ORDER.indexOf(curDiagTab);
    if (currentIndex === 0) {
      goStep(1);
    } else {
      const prevTab = TAB_ORDER[currentIndex - 1];
      switchDiagTab(prevTab);
      window.scrollTo(0, 60);
    }
  }

  function switchDiagTab(tab) {
    curDiagTab = tab;
    updateDiagTabUI(tab);
    // 탭 전환 후 저장된 점수 복원 + 첫 항목으로 스크롤
    setTimeout(() => {
      restoreScores();
      const tabContent = document.getElementById('diagTab-' + tab);
      if (tabContent) {
        const firstItem = tabContent.querySelector('.diag-item');
        if (firstItem) {
          firstItem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 100);
  }

  function updateDiagTabUI(tab) {
    // 탭 버튼 active 처리
    document.querySelectorAll('.diag-tab').forEach(t => t.classList.remove('active'));
    const activeBtn = document.querySelector('[onclick*="switchDiagTab(\'' + tab + '\')"]');
    if (activeBtn) activeBtn.classList.add('active');

    // 탭 컨텐츠 표시/숨김
    document.querySelectorAll('.diag-tab-content').forEach(c => {
      c.classList.add('hidden');
      c.classList.remove('active');
    });
    const content = document.getElementById('diagTab-' + tab);
    if (content) {
      content.classList.remove('hidden');
      content.classList.add('active');
    }

    // 다음 버튼 텍스트 변경
    const nextBtn = document.querySelector('#step2 .btn-gold');
    if (nextBtn) {
      const currentIndex = TAB_ORDER.indexOf(tab);
      nextBtn.textContent = currentIndex < TAB_ORDER.length - 1 ? '다음 진단 →' : '다음 단계 →';
    }
  }

  function collect() {
    const g = id => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };
    return {
      companyName:     g('companyName'),
      industry:        g('industry'),
      bizModel:        g('bizModel'),
      foundedYear:     g('foundedYear'),
      employees:       g('employees'),
      revenue:         g('revenue'),
      region:          g('region'),
      products:        g('products'),
      coreStrength:    g('coreStrength'),
      bizStrengths:    g('bizStrengths'),
      targetCustomer:  g('targetCustomer'),
      competitors:     g('competitors'),
      marketSize:      g('marketSize'),
      marketShare:     g('marketShare'),
      differentiation: g('differentiation'),
      problems:        g('problems'),
      goals:           g('goals'),
      timeline:        g('timeline'),
      budget:          g('budget'),
      notes:           g('notes'),
      diagScores:      diagScores,
    };
  }

  function animateLoading() {
    const ids = ['ls1', 'ls2', 'ls3', 'ls4'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove('active', 'done');
      el.querySelector('.ld-step-ico').textContent = '○';
    });
    const first = document.getElementById(ids[0]);
    if (first) {
      first.classList.add('active');
      first.querySelector('.ld-step-ico').textContent = '◌';
    }
    let i = 0;
    const iv = setInterval(() => {
      const cur = document.getElementById(ids[i]);
      if (cur) {
        cur.classList.replace('active', 'done');
        cur.querySelector('.ld-step-ico').textContent = '✓';
      }
      i++;
      if (i < ids.length) {
        const next = document.getElementById(ids[i]);
        if (next) {
          next.classList.add('active');
          next.querySelector('.ld-step-ico').textContent = '◌';
        }
      } else {
        clearInterval(iv);
      }
    }, 700);
  }

  function reset() {
    curStep = 1;
    curDiagTab = 'common';
    updateStepUI(1);
  }

  return { goStep, validate, collect, animateLoading, reset, setScore, setMemo, switchDiagTab, prevDiagTab };
})();
