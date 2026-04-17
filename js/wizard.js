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
    '제조업':           'mfg_parts',
    '식품/음료':        'food_mfg',
    '서비스업':         'local_service',
    '유통/물류':        'wholesale',
    '외식 및 휴게음식업': 'restaurant',
    'IT/소프트웨어':    'knowledge_it',
    '건설/부동산':      'construction',
    '의료/헬스케어':    'medical',
    '금융/핀테크':      'finance',
    '교육':             'education',
    '패션/뷰티':        'fashion',
    '미디어/엔터테인먼트': 'media',
    '수출중소기업':     'export_sme',
    '물류운송':         'logistics',
    '환경에너지':       'energy',
    '농림식품원료':     'agri_food',
    '기타':             'etc'
  };

  // 업종 → 현실적으로 가능한 사업모델 후보 (우선순위 순)
  const INDUSTRY_BM_MAP = {
    'mfg_parts':     ['mfg_dist', 'b2b_solution', 'service'],
    'food_mfg':      ['mfg_dist', 'b2c_commerce', 'b2c_sub', 'franchise'],
    'local_service': ['service', 'franchise', 'b2c_sub'],
    'wholesale':     ['mfg_dist', 'b2c_commerce', 'platform'],
    'restaurant':    ['service', 'franchise', 'b2c_commerce'],
    'knowledge_it':  ['b2b_saas', 'b2b_solution', 'service', 'usage_based'],
    'construction':  ['service', 'b2b_solution'],
    'medical':       ['service', 'b2c_sub', 'b2b_saas', 'deeptech'],
    'finance':       ['b2b_saas', 'platform', 'service', 'usage_based'],
    'education':     ['b2c_sub', 'b2b_saas', 'service', 'platform'],
    'fashion':       ['b2c_commerce', 'mfg_dist', 'b2c_sub'],
    'media':         ['advertising', 'b2c_sub', 'platform'],
    'export_sme':    ['mfg_dist', 'b2b_solution', 'b2c_commerce'],
    'logistics':     ['service', 'platform', 'b2b_solution', 'usage_based'],
    'energy':        ['service', 'b2b_solution', 'mfg_dist', 'usage_based'],
    'agri_food':     ['mfg_dist', 'b2c_commerce', 'b2c_sub'],
    'etc':           ['service', 'b2b_solution', 'mfg_dist']
  };

  // BM 키 → 표시 레이블
  const BM_LABELS = {
    'b2b_saas':     'B2B SaaS',
    'b2c_sub':      'B2C 구독',
    'b2b_solution': 'B2B 솔루션',
    'b2c_commerce': 'B2C 커머스',
    'platform':     '플랫폼·마켓플레이스',
    'franchise':    '프랜차이즈',
    'mfg_dist':     '제조·유통',
    'service':      '서비스업',
    'usage_based':  '종량제·사용량기반',
    'advertising':  '광고기반',
    'deeptech':     '딥테크·바이오',
    'etc':          '기타'
  };

  // 저장된 추론 결과
  let _inferredBmKey = '';

  // 탭 순서 정의
  const TAB_ORDER = ['common', 'industry', 'bizmodel'];

  /* ── 업종 기반 사업모델 추론 ── */
  function inferBizModel(industryKey, formData) {
    const candidates = INDUSTRY_BM_MAP[industryKey] || INDUSTRY_BM_MAP['etc'];
    if (!candidates || !candidates.length) return { primary: 'service', candidates: ['service'] };

    const products  = (formData.products     || '').toLowerCase();
    const strength  = (formData.coreStrength || '').toLowerCase();
    const problem   = (formData.customerProblem || '').toLowerCase();
    const advantage = (formData.unfairAdvantage || '').toLowerCase();
    const all = products + ' ' + strength + ' ' + problem + ' ' + advantage;

    // 키워드 → BM 키 점수 부여
    const signals = {
      b2b_saas:     ['saas', '구독', 'subscription', 'b2b', '월정액', '소프트웨어', '클라우드', '대시보드', 'api'],
      b2c_sub:      ['구독', 'membership', '월정액', 'b2c', '정기', '회원권', '넷플릭스'],
      b2b_solution: ['솔루션', 'erp', 'si', '시스템', 'b2b', '납품', '구축', '맞춤'],
      b2c_commerce: ['쇼핑몰', '커머스', '이커머스', '판매', '온라인', '직구', '스마트스토어', '쿠팡'],
      platform:     ['플랫폼', '마켓플레이스', '중개', '연결', '매칭', '앱', '마켓'],
      franchise:    ['프랜차이즈', '가맹', '직영', '체인', '점포', '매장'],
      mfg_dist:     ['제조', '생산', '공장', '도매', '유통', 'oem', '납품', '수출', '원자재'],
      service:      ['서비스', '컨설팅', '대행', '위탁', '용역', '운영', '관리'],
      usage_based:  ['사용량', '건당', '종량제', 'pay-as', '과금', '건별', '사용한만큼'],
      advertising:  ['광고', '미디어', '콘텐츠', 'sns', '유튜브', '인플루언서', '뷰어', '트래픽'],
      deeptech:     ['ai', '딥러닝', '바이오', '신약', '임상', '연구', '특허', '기술이전', '혁신']
    };

    const scores = {};
    candidates.forEach(bm => { scores[bm] = 0; });
    candidates.forEach(bm => {
      (signals[bm] || []).forEach(kw => {
        if (all.includes(kw)) scores[bm] += 2;
      });
    });

    // 우선순위 순서(INDUSTRY_BM_MAP 인덱스)에 기본 가중치 부여
    candidates.forEach((bm, idx) => { scores[bm] += (candidates.length - idx); });

    const sorted = candidates.slice().sort((a, b) => (scores[b] || 0) - (scores[a] || 0));
    return { primary: sorted[0], candidates: sorted.slice(0, Math.min(3, sorted.length)) };
  }

  function onIndustryChange() {
    const industry   = document.getElementById('industry')?.value || '';
    const industryKey = INDUSTRY_MAP[industry] || 'etc';
    const formData   = {
      products:        document.getElementById('products')?.value        || '',
      coreStrength:    document.getElementById('coreStrength')?.value    || '',
      customerProblem: document.getElementById('customerProblem')?.value || '',
      unfairAdvantage: document.getElementById('unfairAdvantage')?.value || ''
    };
    const result = inferBizModel(industryKey, formData);
    _inferredBmKey = result.primary;

    // hidden 필드에 표시용 레이블 저장 (buildPrompt 연동)
    const hiddenBm = document.getElementById('bizModel');
    if (hiddenBm) hiddenBm.value = BM_LABELS[_inferredBmKey] || _inferredBmKey;

    // 표시 업데이트
    const display = document.getElementById('inferredBmDisplay');
    if (!display) return;
    if (!industry) {
      display.innerHTML = '업종을 선택하면 사업모델이 자동으로 추론됩니다';
      return;
    }
    let html = '';
    result.candidates.forEach((bm, idx) => {
      const label = BM_LABELS[bm] || bm;
      html += '<span class="bm-tag' + (idx === 0 ? ' primary' : '') + '">' +
              (idx === 0 ? '★ ' : '') + label + '</span>';
    });
    html += '<span class="bm-infer-hint">★ 1순위 적용 · 진단은 자동 연동됩니다</span>';
    display.innerHTML = html;
  }

  function goStep(n, skipValidation) {
    // bm-confirm 화면은 항상 숨기고 이동
    const bmCard = document.getElementById('bm-confirm');
    if (bmCard) bmCard.classList.add('hidden');

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

    if (!skipValidation && n > curStep && !validate(curStep)) return;
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
      if (!get('companyName'))     { alert('회사명을 입력해주세요.');           return false; }
      if (!get('industry'))        { alert('업종을 선택해주세요.');            return false; }
      if (!get('products'))        { alert('주요 제품/서비스를 입력해주세요.'); return false; }
      if (!get('coreStrength'))    { alert('핵심 강점을 입력해주세요.');        return false; }
      if (!get('customerProblem')) { alert('고객이 겪는 문제를 입력해주세요.'); return false; }
    }
    if (step === 2) {
      const done = Object.keys(diagScores).filter(k => diagScores[k].score > 0).length;
      if (done < 10) {
        alert('진단 항목을 최소 10개 이상 입력해주세요. (현재 ' + done + '개)');
        return false;
      }
    }
    if (step === 3) {
      if (!get('targetCustomer')) { alert('타겟 고객을 입력해주세요.');         return false; }
      if (!get('comp1Name'))      { alert('경쟁사 1의 이름을 입력해주세요.'); return false; }
    }
    if (step === 4) {
      if (!get('problems')) { alert('현재 직면한 문제를 입력해주세요.'); return false; }
      if (!get('goals'))    { alert('달성 목표를 입력해주세요.');         return false; }
    }
    return true;
  }

  function loadDiagnosisUI() {
    const industry    = document.getElementById('industry')?.value || '';
    const industryKey = INDUSTRY_MAP[industry] || 'etc';
    // 추론된 BM 사용 (onIndustryChange가 validate(1)에서 미리 실행됨)
    const bizModelKey = _inferredBmKey || (INDUSTRY_BM_MAP[industryKey] && INDUSTRY_BM_MAP[industryKey][0]) || 'etc';
    const bizModelLabel = BM_LABELS[bizModelKey] || bizModelKey;

    // 공통 모듈 렌더링
    renderDiagModule('diag-common-container', typeof COMMON_DIAGNOSIS !== 'undefined' ? COMMON_DIAGNOSIS : null);

    // 업종 특화 모듈 렌더링
    const industryVarMap = {
      'mfg_parts':     typeof INDUSTRY_MFG_PARTS    !== 'undefined' ? INDUSTRY_MFG_PARTS    : null,
      'food_mfg':      typeof INDUSTRY_FOOD_MFG     !== 'undefined' ? INDUSTRY_FOOD_MFG     : null,
      'local_service': typeof INDUSTRY_LOCAL_SERVICE !== 'undefined' ? INDUSTRY_LOCAL_SERVICE : null,
      'wholesale':     typeof INDUSTRY_WHOLESALE    !== 'undefined' ? INDUSTRY_WHOLESALE    : null,
      'restaurant':    typeof INDUSTRY_RESTAURANT   !== 'undefined' ? INDUSTRY_RESTAURANT   : null,
      'knowledge_it':  typeof INDUSTRY_KNOWLEDGE_IT !== 'undefined' ? INDUSTRY_KNOWLEDGE_IT : null,
      'construction':  typeof INDUSTRY_CONSTRUCTION !== 'undefined' ? INDUSTRY_CONSTRUCTION : null,
      'medical':       typeof INDUSTRY_MEDICAL      !== 'undefined' ? INDUSTRY_MEDICAL      : null,
      'finance':       typeof INDUSTRY_FINANCE      !== 'undefined' ? INDUSTRY_FINANCE      : null,
      'education':     typeof INDUSTRY_EDUCATION    !== 'undefined' ? INDUSTRY_EDUCATION    : null,
      'fashion':       typeof INDUSTRY_FASHION      !== 'undefined' ? INDUSTRY_FASHION      : null,
      'media':         typeof INDUSTRY_MEDIA        !== 'undefined' ? INDUSTRY_MEDIA        : null,
      'export_sme':    typeof INDUSTRY_EXPORT_SME   !== 'undefined' ? INDUSTRY_EXPORT_SME   : null,
      'logistics':     typeof INDUSTRY_LOGISTICS    !== 'undefined' ? INDUSTRY_LOGISTICS    : null,
      'energy':        typeof INDUSTRY_ENERGY       !== 'undefined' ? INDUSTRY_ENERGY       : null,
      'agri_food':     typeof INDUSTRY_AGRI_FOOD    !== 'undefined' ? INDUSTRY_AGRI_FOOD    : null,
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
      'usage_based':  typeof BIZMODEL_USAGE_BASED  !== 'undefined' ? BIZMODEL_USAGE_BASED  : null,
      'advertising':  typeof BIZMODEL_ADVERTISING  !== 'undefined' ? BIZMODEL_ADVERTISING  : null,
      'deeptech':     typeof BIZMODEL_DEEPTECH     !== 'undefined' ? BIZMODEL_DEEPTECH     : null,
      'etc':          typeof BIZMODEL_ETC          !== 'undefined' ? BIZMODEL_ETC          : null,
    };
    const bizModelData = bizModelVarMap[bizModelKey];
    if (bizModelData) renderDiagModule('diag-bizmodel-container', bizModelData);

    // 탭 버튼 레이블 동적 업데이트 (업종·사업모델 반영)
    const indLabel  = industry     || '업종';
    const bizLabel  = bizModelLabel || '사업모델';
    const tabIndustry = document.getElementById('diagTabBtn-industry');
    const tabBizmodel = document.getElementById('diagTabBtn-bizmodel');
    if (tabIndustry) tabIndustry.textContent = '🏭 ' + indLabel + ' 특화 진단';
    if (tabBizmodel) tabBizmodel.textContent = '💼 ' + bizLabel + ' 진단';

    // 진행률 카운터 총 항목 수 동적 갱신
    const totalItems = document.querySelectorAll('.diag-item').length || 52;
    const progressText = document.getElementById('diag-progress-text');
    if (progressText) progressText.textContent = '0 / ' + totalItems + ' 항목 완료';

    // 첫 탭으로 리셋
    curDiagTab = 'common';
    updateDiagTabUI('common');

    // 저장된 점수 복원
    restoreScores();
  }

  /* ── 타입별 항목 렌더러 ── */
  function _renderItemHtml(item, scoreKey) {
    const saved        = diagScores[scoreKey] || {};
    const savedScore   = saved.score   || 0;
    const savedRaw     = (saved.rawValue !== undefined) ? saved.rawValue : '';
    const savedChoices = saved.choices || [];
    const savedMemo    = diagMemos[scoreKey] || '';

    let html = '<div class="diag-item" id="diag-item-' + scoreKey + '">';
    html += '<div class="diag-item-text">' + item.text + '</div>';

    switch (item.type) {
      case 'numeric': html += _renderNumeric(item, scoreKey, savedRaw, savedScore); break;
      case 'mixed':   html += _renderMixed(item, scoreKey, savedChoices, savedScore); break;
      default:        html += _renderBars(item, scoreKey, savedScore); break;
    }

    html += '<textarea class="diag-memo" placeholder="💬 구체적 상황 메모 (선택)" onchange="Wizard.setMemo(\'' + scoreKey + '\',this.value)">' + savedMemo + '</textarea>';
    html += '</div>';
    return html;
  }

  // 점수별 기본 설명 (anchors 없는 항목에 공통 적용)
  const GENERIC_ANCHORS = {
    1: '🔴 1점 — 매우 미흡. 즉각적인 개선이 필요한 취약 수준입니다.',
    2: '🟠 2점 — 미흡. 단기 내 보완 계획이 필요합니다.',
    3: '🟡 3점 — 보통. 업계 평균 수준이나 추가 개선 여지가 있습니다.',
    4: '🟢 4점 — 양호. 경쟁력 있는 수준으로 강점으로 활용 가능합니다.',
    5: '🟢 5점 — 우수. 업계 최상위 수준의 핵심 역량입니다.'
  };

  function _renderBars(item, scoreKey, savedScore) {
    // anchors가 없으면 기본 설명으로 대체
    const anchors = item.anchors || GENERIC_ANCHORS;
    let html = '<div class="diag-scale">';
    html += '<span class="diag-scale-label">' + (item.min || '') + '</span>';
    html += '<div class="diag-scale-buttons">';
    for (let s = 1; s <= 5; s++) {
      const sel = savedScore === s ? ' selected' : '';
      html += '<button class="diag-score-btn' + sel + '" data-key="' + scoreKey + '" data-score="' + s + '" onclick="Wizard.setScore(\'' + scoreKey + '\',' + s + ',this)">' + s + '</button>';
    }
    html += '</div>';
    html += '<span class="diag-scale-label">' + (item.max || '') + '</span>';
    html += '</div>';
    const initText = savedScore > 0 ? anchors[savedScore] : '💡 점수를 선택하면 의미가 표시됩니다';
    const anchorsEsc = JSON.stringify(anchors).replace(/\\/g, '\\\\').replace(/'/g, '&apos;');
    html += '<div class="bars-anchor-display" id="bars-anchor-' + scoreKey + '" data-anchors=\'' + anchorsEsc + '\'>' + initText + '</div>';
    return html;
  }

  function _renderNumeric(item, scoreKey, savedRaw, savedScore) {
    const SCORE_LABELS = ['', '🔴 위험', '🟠 취약', '🟡 보통', '🟢 강점', '🟢 최우수'];
    const cls      = savedScore >= 4 ? 'high' : savedScore >= 3 ? 'mid' : savedScore >= 2 ? 'low' : savedScore > 0 ? 'risk' : '';
    const scoreText = savedScore > 0
      ? '→ ' + savedScore + '점 (' + SCORE_LABELS[savedScore] + ')'
      : '값을 입력하면 점수가 자동 계산됩니다';
    const rangesEsc = JSON.stringify(item.scoreRanges || []).replace(/'/g, '&apos;');

    let html = '<div class="diag-numeric-wrap" id="num-wrap-' + scoreKey + '" data-ranges=\'' + rangesEsc + '\'>';
    html += '<label class="diag-numeric-label">' + (item.inputLabel || item.text) + '</label>';
    html += '<div class="diag-numeric-row">';
    html += '<input type="number" step="any" class="diag-numeric-input" id="num-' + scoreKey + '" value="' + savedRaw + '" placeholder="' + (item.placeholder || '') + '" oninput="Wizard.setNumeric(\'' + scoreKey + '\',this.value)" />';
    html += '<span class="diag-numeric-unit">' + (item.unit || '') + '</span>';
    html += '</div>';
    html += '<div class="diag-numeric-result ' + cls + '" id="numr-' + scoreKey + '">' + scoreText + '</div>';
    html += '<div class="diag-numeric-fallback">';
    html += '<span class="diag-fallback-label">수치가 없다면 주관적으로 선택</span>';
    html += '<span class="diag-scale-label" style="font-size:11px">' + (item.min || '') + '</span>';
    html += '<div class="diag-scale-buttons">';
    for (let s = 1; s <= 5; s++) {
      const sel = savedScore === s ? ' selected' : '';
      html += '<button class="diag-score-btn' + sel + '" data-key="' + scoreKey + '" data-score="' + s + '" onclick="Wizard.setScore(\'' + scoreKey + '\',' + s + ',this)">' + s + '</button>';
    }
    html += '</div>';
    html += '<span class="diag-scale-label" style="font-size:11px">' + (item.max || '') + '</span>';
    html += '</div>';
    html += '</div>';
    return html;
  }

  function _renderMixed(item, scoreKey, savedChoices, savedScore) {
    const noneValEsc = (item.noneValue || '').replace(/"/g, '&quot;');
    const effectiveCount = savedChoices.filter(c => c !== (item.noneValue || '')).length;
    const noneOnly = savedChoices.length === 1 && savedChoices[0] === item.noneValue;
    const scoreText = savedScore > 0
      ? (noneOnly ? '해당 없음 → 1점' : effectiveCount + '개 선택 → ' + savedScore + '점')
      : '해당하는 항목을 모두 선택하세요';

    let html = '<div class="diag-mixed-wrap">';
    html += '<div class="diag-mixed-choices" id="mix-' + scoreKey + '" data-none="' + noneValEsc + '">';
    (item.choices || []).forEach(choice => {
      const checked = savedChoices.includes(choice) ? ' checked' : '';
      const isNone  = choice === item.noneValue;
      const choiceEsc = choice.replace(/"/g, '&quot;');
      html += '<label class="diag-mixed-choice' + (isNone ? ' choice-none' : '') + '">';
      html += '<input type="checkbox" value="' + choiceEsc + '"' + checked + ' onchange="Wizard.setMixed(\'' + scoreKey + '\',this)"> ';
      html += choice + '</label>';
    });
    html += '</div>';
    html += '<div class="diag-mixed-result" id="mixr-' + scoreKey + '">' + scoreText + '</div>';
    html += '<div style="display:none"><div class="diag-scale-buttons">';
    for (let s = 1; s <= 5; s++) {
      const sel = savedScore === s ? ' selected' : '';
      html += '<button class="diag-score-btn' + sel + '" data-key="' + scoreKey + '" data-score="' + s + '">' + s + '</button>';
    }
    html += '</div></div>';
    html += '</div>';
    return html;
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
        html += _renderItemHtml(item, scoreKey);
      });
      html += '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  // 저장된 점수 UI 복원 (bars / numeric / mixed 모두 처리)
  function restoreScores() {
    const LABELS = ['', '🔴 위험', '🟠 취약', '🟡 보통', '🟢 강점', '🟢 최우수'];
    Object.keys(diagScores).forEach(key => {
      const saved = diagScores[key];
      if (!saved || !saved.score) return;

      // 공통: 숨겨진 버튼 selected 상태 복원
      document.querySelectorAll('[data-key="' + key + '"]').forEach(btn => {
        btn.classList.toggle('selected', parseInt(btn.dataset.score) === saved.score);
      });

      // numeric 복원
      if (saved.rawValue !== undefined && saved.rawValue !== '') {
        const numEl = document.getElementById('num-' + key);
        if (numEl) numEl.value = saved.rawValue;
        const cls = saved.score >= 4 ? 'high' : saved.score >= 3 ? 'mid' : saved.score >= 2 ? 'low' : 'risk';
        const resultEl = document.getElementById('numr-' + key);
        if (resultEl) {
          resultEl.className = 'diag-numeric-result ' + cls;
          resultEl.textContent = '→ ' + saved.score + '점 (' + LABELS[saved.score] + ')';
        }
      }

      // mixed 복원
      if (saved.choices && saved.choices.length) {
        const container = document.getElementById('mix-' + key);
        if (container) {
          const noneVal = container.dataset.none || '';
          const cbs = container.querySelectorAll('input[type="checkbox"]');
          cbs.forEach(cb => { cb.checked = saved.choices.includes(cb.value); });
          const noneOnly = saved.choices.length === 1 && saved.choices[0] === noneVal;
          const count    = saved.choices.filter(v => v !== noneVal).length;
          const resultEl = document.getElementById('mixr-' + key);
          if (resultEl) {
            resultEl.textContent = noneOnly
              ? '해당 없음 → 1점'
              : count + '개 선택 → ' + saved.score + '점';
          }
        }
      }

      // BARS 앵커 복원
      const anchorEl = document.getElementById('bars-anchor-' + key);
      if (anchorEl && anchorEl.dataset.anchors) {
        try { anchorEl.textContent = JSON.parse(anchorEl.dataset.anchors)[saved.score] || ''; } catch(e) {}
      }
    });
  }

  function setScore(key, score, btn) {
    diagScores[key] = { score: score, memo: diagScores[key]?.memo || '' };
    const buttons = btn.parentElement.querySelectorAll('.diag-score-btn');
    buttons.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');

    // BARS 앵커 텍스트 업데이트
    const anchorEl = document.getElementById('bars-anchor-' + key);
    if (anchorEl && anchorEl.dataset.anchors) {
      try { anchorEl.textContent = JSON.parse(anchorEl.dataset.anchors)[score] || ''; } catch(e) {}
    }

    // numeric 폴백 수동 선택 시 result 표시 업데이트
    const numResult = document.getElementById('numr-' + key);
    if (numResult) {
      const LABELS = ['', '🔴 위험', '🟠 취약', '🟡 보통', '🟢 강점', '🟢 최우수'];
      const cls = score >= 4 ? 'high' : score >= 3 ? 'mid' : score >= 2 ? 'low' : 'risk';
      numResult.className = 'diag-numeric-result ' + cls;
      numResult.textContent = '→ ' + score + '점 (' + LABELS[score] + ') · 주관 선택';
      // 숫자 입력란 초기화
      const numInput = document.getElementById('num-' + key);
      if (numInput) { numInput.value = ''; diagScores[key].rawValue = ''; }
    }

    updateDiagProgress();
  }

  /* ── numeric 핸들러 ── */
  function setNumeric(key, rawValue) {
    const wrap = document.getElementById('num-wrap-' + key);
    let score = 0;
    const val = parseFloat(rawValue);
    if (!isNaN(val) && wrap && wrap.dataset.ranges) {
      try {
        const ranges = JSON.parse(wrap.dataset.ranges);
        for (const [lo, hi, s] of ranges) {
          if (val >= lo && val < hi) { score = s; break; }
        }
        // 마지막 범위 상한값 처리
        if (score === 0 && ranges.length) {
          const last = ranges[ranges.length - 1];
          if (val >= last[0]) score = last[2];
        }
      } catch(e) {}
    }

    diagScores[key] = { score, rawValue, memo: diagScores[key]?.memo || '' };

    const LABELS = ['', '🔴 위험', '🟠 취약', '🟡 보통', '🟢 강점', '🟢 최우수'];
    const cls = score >= 4 ? 'high' : score >= 3 ? 'mid' : score >= 2 ? 'low' : score > 0 ? 'risk' : '';
    const el = document.getElementById('numr-' + key);
    if (el) {
      el.className = 'diag-numeric-result ' + cls;
      el.textContent = score > 0
        ? '→ ' + score + '점 (' + LABELS[score] + ')'
        : rawValue !== '' ? '유효 범위 밖 값입니다' : '값을 입력하면 점수가 자동 계산됩니다';
    }
    document.querySelectorAll('[data-key="' + key + '"]').forEach(btn => {
      btn.classList.toggle('selected', parseInt(btn.dataset.score) === score);
    });
    updateDiagProgress();
  }

  /* ── mixed(체크박스) 핸들러 ── */
  function setMixed(key) {
    const container = document.getElementById('mix-' + key);
    if (!container) return;
    const noneVal = container.dataset.none || '';
    const cbs = container.querySelectorAll('input[type="checkbox"]');

    const selected = Array.from(cbs).filter(cb => cb.checked).map(cb => cb.value);
    const noneOnly = selected.length === 1 && selected[0] === noneVal;
    const count = selected.filter(v => v !== noneVal).length;

    let score = 0;
    if (selected.length > 0) {
      score = noneOnly ? 1 : count === 1 ? 2 : count === 2 ? 3 : count <= 4 ? 4 : 5;
    }

    diagScores[key] = { score, choices: selected, memo: diagScores[key]?.memo || '' };

    const resultEl = document.getElementById('mixr-' + key);
    if (resultEl) {
      resultEl.textContent = selected.length === 0
        ? '해당하는 항목을 모두 선택하세요'
        : noneOnly ? '해당 없음 → 1점'
        : count + '개 선택 → ' + score + '점';
    }
    document.querySelectorAll('[data-key="' + key + '"]').forEach(btn => {
      btn.classList.toggle('selected', parseInt(btn.dataset.score) === score);
    });
    updateDiagProgress();
  }

  function setMemo(key, memo) {
    diagMemos[key] = memo;
    if (!diagScores[key]) diagScores[key] = { score: 0, memo: memo };
    else diagScores[key].memo = memo;
  }

  function updateDiagProgress() {
    const total = document.querySelectorAll('.diag-item').length || 48;
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
    const activeBtn = document.getElementById('diagTabBtn-' + tab);
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

  /* ── 10대 컨설팅 유형 정의 ── */
  const CONSULTING_TYPES = {
    finance_strategy: {
      label: '경영재무전략', icon: '💰',
      desc: '수익구조 개선, 원가 절감, 재무 건전성 확보가 최우선 과제입니다.',
      preview: ['손익분기점(BEP) 분석 및 재무 재구조화', '고정비/변동비 최적화 전략', '현금흐름 관리 체계 수립', '정부 금융지원 사업 연계']
    },
    growth_strategy: {
      label: '사업화·성장전략', icon: '🚀',
      desc: '시장 검증과 매출 성장 궤도 진입이 핵심 과제입니다.',
      preview: ['린 MVP 검증 및 시장 적합성(PMF) 확보', '핵심 고객 세그먼트 집중 공략', '수익 모델 다각화 및 단가 최적화', '성장 지표(KPI) 설계 및 트래킹']
    },
    differentiation_strategy: {
      label: '차별화·경쟁우위전략', icon: '🏆',
      desc: '경쟁사와의 명확한 차별화 포지션 확보가 시급합니다.',
      preview: ['핵심 차별화 요소 발굴 및 강화', '경쟁사 약점 분석 기반 포지셔닝', '모방 불가 핵심 역량 보호 체계', 'USP(고유 판매 제안) 메시지 정립']
    },
    structure_strategy: {
      label: '기업구조·시스템전략', icon: '🏗️',
      desc: '조직 체계와 운영 시스템 구축이 성장의 병목입니다.',
      preview: ['업무 SOP·매뉴얼화 체계 구축', '조직 역할 분산 및 위임 체계 수립', '성과 측정 및 인센티브 시스템 설계', '핵심 프로세스 표준화']
    },
    innovation_strategy: {
      label: '혁신·신사업전략', icon: '💡',
      desc: '신기술·신사업 기회 탐색과 혁신 역량 강화가 필요합니다.',
      preview: ['업종 트렌드·기술 변화 분석', '신사업 기회 영역 발굴', '기존 사업 혁신 로드맵 수립', '오픈 이노베이션·파트너십 전략']
    },
    marketing_strategy: {
      label: '마케팅·브랜드전략', icon: '📣',
      desc: '브랜드 인지도와 고객 유입 채널 확대가 핵심 과제입니다.',
      preview: ['타겟 고객 페르소나 정의 및 세분화', 'StoryBrand 기반 메시지 체계 구축', '디지털 마케팅 채널 최적화', '콘텐츠·브랜드 자산 구축']
    },
    hr_strategy: {
      label: '조직·인력운영전략', icon: '👥',
      desc: '인재 확보와 조직 역량 강화가 성장의 핵심입니다.',
      preview: ['핵심 인재 채용·유지 체계 구축', '직무별 역량 기준 및 평가 체계', '조직문화·소통 활성화 방안', '교육·훈련 체계 수립']
    },
    digital_strategy: {
      label: '디지털전환전략', icon: '🤖',
      desc: 'AI·디지털 도구 도입으로 운영 효율화와 경쟁력 확보가 필요합니다.',
      preview: ['업무 자동화·AI 도구 도입 로드맵', '데이터 기반 의사결정 체계 구축', '디지털 고객 접점 강화', 'IT 인프라 현대화 우선순위 수립']
    },
    pivot_strategy: {
      label: '사업재편·피벗전략', icon: '🔄',
      desc: '전반적 역량 개선이 필요하며, 사업 방향 재정립이 시급합니다.',
      preview: ['현재 사업 모델의 핵심 문제 진단', '사업 피벗 옵션 및 가능성 평가', '단계적 사업 재편 로드맵 수립', '리스크 최소화 전환 전략']
    },
    cx_strategy: {
      label: '고객경험·서비스전략', icon: '⭐',
      desc: '고객 만족도와 재구매율 향상으로 매출 기반 안정화가 필요합니다.',
      preview: ['고객 여정 지도(Customer Journey Map) 분석', '핵심 고객 경험 개선 포인트 발굴', '재구매·재계약률 향상 프로그램', 'NPS 기반 고객 피드백 체계 구축']
    }
  };

  /* ── 5대 역량 도메인 점수 계산 ── */
  function calcDomainScores(scores) {
    const domains = {
      finance:         { label: '경영재무역량',     scores: [], color: '#4ADE80' },
      hr:              { label: '인적자원역량',     scores: [], color: '#60A5FA' },
      bm:              { label: 'BM역량',          scores: [], color: '#A78BFA' },
      future:          { label: '미래기술대응역량', scores: [], color: '#FB923C' },
      differentiation: { label: '차별화·경쟁우위역량', scores: [], color: '#F5C030' }
    };
    Object.entries(scores || {}).forEach(([key, val]) => {
      if (!val || !val.score) return;
      const s = val.score;
      if (key.startsWith('diag-common-container_1_') || key.startsWith('diag-common-container_4_')) {
        domains.finance.scores.push(s);
      } else if (key.startsWith('diag-common-container_2_')) {
        domains.hr.scores.push(s);
      } else if (key.startsWith('diag-common-container_3_')) {
        domains.bm.scores.push(s);
      } else if (key.startsWith('diag-common-container_5_')) {
        domains.differentiation.scores.push(s);
      } else if (key.startsWith('diag-industry-container_')) {
        domains.future.scores.push(s);
      } else if (key.startsWith('diag-bizmodel-container_')) {
        domains.bm.scores.push(s);
      }
    });
    const result = {};
    Object.entries(domains).forEach(([k, d]) => {
      const avg = d.scores.length > 0
        ? d.scores.reduce((a, b) => a + b, 0) / d.scores.length : 0;
      result[k] = { label: d.label, avg: Math.round(avg * 10) / 10, color: d.color };
    });
    return result;
  }

  /* ── 컨설팅 유형 분류 (규칙 기반) ── */
  function classifyConsultingType(domainScores) {
    const vals = Object.values(domainScores).map(d => d.avg).filter(v => v > 0);
    const overallAvg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 3;

    if (overallAvg < 2.0) return { primary: 'pivot_strategy', secondary: 'finance_strategy' };

    const sorted = Object.entries(domainScores)
      .filter(([, d]) => d.avg > 0)
      .sort(([, a], [, b]) => a.avg - b.avg);

    if (!sorted.length) return { primary: 'growth_strategy', secondary: 'differentiation_strategy' };

    const [weakKey] = sorted[0];
    const secondKey = sorted[1]?.[0] || 'differentiation';
    const secondAvg = sorted[1]?.[1]?.avg || 3;

    if (weakKey === 'finance' && secondKey === 'hr' && secondAvg < 2.5) {
      return { primary: 'structure_strategy', secondary: 'finance_strategy' };
    }

    const domainToType = {
      finance:         'finance_strategy',
      hr:              secondAvg < 2.5 ? 'structure_strategy' : 'hr_strategy',
      bm:              overallAvg < 3.0 ? 'growth_strategy' : 'marketing_strategy',
      future:          secondAvg < 2.8 ? 'digital_strategy' : 'innovation_strategy',
      differentiation: 'differentiation_strategy'
    };
    const secondaryMap = {
      finance:         'structure_strategy',
      hr:              'hr_strategy',
      bm:              'cx_strategy',
      future:          'innovation_strategy',
      differentiation: 'marketing_strategy'
    };

    return {
      primary:   domainToType[weakKey]   || 'growth_strategy',
      secondary: secondaryMap[secondKey] || 'differentiation_strategy'
    };
  }

  /* ── 진단유형 확인 화면 렌더링 ── */
  function showDiagReveal(data) {
    const scores = data.diagScores || diagScores;
    const domainScores = calcDomainScores(scores);
    const { primary, secondary } = classifyConsultingType(domainScores);
    const pType = CONSULTING_TYPES[primary]   || CONSULTING_TYPES.growth_strategy;
    const sType = CONSULTING_TYPES[secondary] || CONSULTING_TYPES.differentiation_strategy;

    const elPrimary   = document.getElementById('drTypePrimary');
    const elSecondary = document.getElementById('drTypeSecondary');
    const elDesc      = document.getElementById('drTypeDesc');
    if (elPrimary)   elPrimary.textContent   = pType.icon + ' ' + pType.label;
    if (elSecondary) elSecondary.textContent = '보조 유형: ' + sType.icon + ' ' + sType.label;
    if (elDesc)      elDesc.textContent      = pType.desc;

    const elScoreList = document.getElementById('drScoreList');
    if (elScoreList) {
      elScoreList.innerHTML = Object.values(domainScores).map(d => {
        const pct   = (d.avg / 5) * 100;
        const cls   = d.avg >= 4.0 ? 'high' : d.avg >= 3.0 ? 'mid' : d.avg >= 2.0 ? 'low' : d.avg > 0 ? 'risk' : 'none';
        const lbl   = d.avg >= 4.0 ? '강점' : d.avg >= 3.0 ? '보통' : d.avg >= 2.0 ? '취약' : d.avg > 0 ? '위험' : '미입력';
        return '<div class="dr-score-item">' +
          '<span class="dr-score-label">' + d.label + '</span>' +
          '<div class="dr-score-bar-wrap"><div class="dr-score-bar ' + cls + '" style="width:' + pct + '%"></div></div>' +
          '<span class="dr-score-val ' + cls + '">' + (d.avg > 0 ? d.avg.toFixed(1) : '—') + ' <small>' + lbl + '</small></span>' +
          '</div>';
      }).join('');
    }

    const elPreview = document.getElementById('drPreviewList');
    if (elPreview) {
      elPreview.innerHTML = pType.preview.map(p => '<li>' + p + '</li>').join('');
    }

    drawRadarChart('radarChart', domainScores);
    return { primary, secondary, domainScores };
  }

  /* ── 5각형 레이더 차트 (Canvas) ── */
  function drawRadarChart(canvasId, domainScores) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const cx = w / 2, cy = h / 2;
    const R = Math.min(w, h) / 2 - 48;
    const entries = Object.values(domainScores);
    const n = entries.length;

    ctx.clearRect(0, 0, w, h);
    const angles = entries.map((_, i) => (i * 2 * Math.PI / n) - Math.PI / 2);

    function pt(angle, r) { return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }; }

    // 배경 격자
    for (let lv = 1; lv <= 5; lv++) {
      const r = (R * lv) / 5;
      ctx.beginPath();
      angles.forEach((a, i) => { const p = pt(a, r); i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); });
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    // 축선
    angles.forEach(a => {
      const p = pt(a, R);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; ctx.stroke();
    });

    // 데이터 폴리곤
    ctx.beginPath();
    entries.forEach((d, i) => {
      const r = (R * Math.max(d.avg, 0)) / 5;
      const p = pt(angles[i], r);
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(245,192,48,0.18)';
    ctx.fill();
    ctx.strokeStyle = '#F5C030';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 데이터 점
    entries.forEach((d, i) => {
      const r = (R * Math.max(d.avg, 0)) / 5;
      const p = pt(angles[i], r);
      ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#F5C030'; ctx.fill();
    });

    // 레이블
    const shortLabels = ['경영재무', '인적자원', 'BM역량', '미래기술', '차별화'];
    ctx.font = '11px Noto Sans KR, sans-serif';
    ctx.textAlign = 'center';
    entries.forEach((d, i) => {
      const p = pt(angles[i], R + 22);
      ctx.fillStyle = '#E8EDF5';
      ctx.fillText(shortLabels[i] || d.label, p.x, p.y + 4);
    });
  }

  function collect() {
    const g = id => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };
    return {
      companyName:     g('companyName'),
      industry:        g('industry'),
      bizModel:        g('bizModel'),   // 추론된 BM 레이블 (hidden input)
      bizModelKey:     _inferredBmKey,  // 추론된 BM 키
      foundedYear:     g('foundedYear'),
      employees:       g('employees'),
      revenue:         g('revenue'),
      region:          g('region'),
      products:        g('products'),
      coreStrength:    g('coreStrength'),
      customerProblem: g('customerProblem'),
      unfairAdvantage: g('unfairAdvantage'),
      // STEP 3
      targetCustomer:      g('targetCustomer'),
      customerAcquisition: g('customerAcquisition'),
      cacLtv:              g('cacLtv'),
      tam:                 g('tam'),
      sam:                 g('sam'),
      som:                 g('som'),
      marketGrowthRate:    g('marketGrowthRate'),
      marketTrend:         g('marketTrend'),
      comp1Name:           g('comp1Name'),
      comp1Price:          g('comp1Price'),
      comp1Customer:       g('comp1Customer'),
      comp1Weakness:       g('comp1Weakness'),
      comp2Name:           g('comp2Name'),
      comp2Price:          g('comp2Price'),
      comp2Customer:       g('comp2Customer'),
      comp2Weakness:       g('comp2Weakness'),
      comp3Name:           g('comp3Name'),
      comp3Price:          g('comp3Price'),
      comp3Customer:       g('comp3Customer'),
      comp3Weakness:       g('comp3Weakness'),
      differentiation:     g('differentiation'),
      forceEntry:          g('force_entry'),
      forceEntryMemo:      g('force_entry_memo'),
      forceSubstitute:     g('force_substitute'),
      forceSubstituteMemo: g('force_substitute_memo'),
      forceSupplier:       g('force_supplier'),
      forceSupplierMemo:   g('force_supplier_memo'),
      forceBuyer:          g('force_buyer'),
      forceBuyerMemo:      g('force_buyer_memo'),
      forceRivalry:        g('force_rivalry'),
      forceRivalryMemo:    g('force_rivalry_memo'),
      // STEP 4
      problems:            g('problems'),
      goals:               g('goals'),
      timeline:            g('timeline'),
      budget:              g('budget'),
      externalRisk:        g('externalRisk'),
      partnerships:        g('partnerships'),
      govSupport:          Array.from(document.querySelectorAll('input[name="govSupport"]:checked')).map(el => el.value).join(', '),
      notes:               g('notes'),
      diagScores:          diagScores,
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
    _inferredBmKey = '';
    Object.keys(diagScores).forEach(k => delete diagScores[k]);
    updateStepUI(1);
    const step1 = document.getElementById('step1');
    if (step1) step1.classList.remove('hidden');
    ['bm-confirm', 'step2', 'step3', 'step4'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.classList.add('hidden'); el.classList.remove('slide-exit', 'slide-enter'); }
    });
  }

  /* ── BM 확인 → Step2 직접 전환 ── */
  function goToStep2FromBm() {
    // bm-confirm 숨기기
    const bmCard = document.getElementById('bm-confirm');
    if (bmCard) bmCard.classList.add('hidden');

    // 진단 UI 렌더링
    try { loadDiagnosisUI(); } catch(e) { console.error('loadDiagnosisUI 오류:', e); }

    // 내부 상태 갱신
    curStep = 2;
    updateStepUI(2);

    // step2 직접 표시
    const step2 = document.getElementById('step2');
    if (step2) {
      step2.classList.remove('hidden');
      step2.classList.add('slide-enter');
      setTimeout(() => step2.classList.remove('slide-enter'), 400);
    }
    window.scrollTo(0, 60);
  }

  /* ── BM 확인 화면 관련 ── */

  // 업종 키 반환 (app.js에서 호출)
  function getIndustryKey(industry) {
    return INDUSTRY_MAP[industry] || 'etc';
  }

  // 확정된 BM 키 저장 + hidden input 동기화
  function setBmKey(key) {
    _inferredBmKey = key;
    const hiddenKey   = document.getElementById('bizModelKey');
    const hiddenLabel = document.getElementById('bizModel');
    if (hiddenKey)   hiddenKey.value   = key;
    if (hiddenLabel) hiddenLabel.value = BM_LABELS[key] || key;
  }

  // BM 확인 카드 표시 (step1 숨기고 bm-confirm 표시)
  function showBmConfirmCard() {
    const step1   = document.getElementById('step1');
    const confirm = document.getElementById('bm-confirm');
    if (step1)   { step1.classList.add('slide-exit'); setTimeout(() => { step1.classList.add('hidden'); step1.classList.remove('slide-exit'); }, 250); }
    if (confirm) { setTimeout(() => { confirm.classList.remove('hidden'); confirm.classList.add('slide-enter'); setTimeout(() => confirm.classList.remove('slide-enter'), 400); }, 260); }
    window.scrollTo(0, 60);
  }

  // BM 확인 카드 숨기고 step1 복귀
  function hideBmConfirmCard() {
    const step1   = document.getElementById('step1');
    const confirm = document.getElementById('bm-confirm');
    if (confirm) confirm.classList.add('hidden');
    if (step1)   { step1.classList.remove('hidden', 'slide-exit'); }
    window.scrollTo(0, 60);
  }

  // BM 확인 화면 내용 채우기
  function populateBmConfirm(industryKey, industryLabel, formData) {
    const result    = inferBizModel(industryKey, formData);
    _inferredBmKey  = result.primary;
    const candidates = INDUSTRY_BM_MAP[industryKey] || INDUSTRY_BM_MAP['etc'];

    const BM_FULL_DESC = {
      'b2b_saas':     { name: 'B2B SaaS (기업 대상 구독 소프트웨어)', icon: '☁️',
        desc: '기업 고객에게 클라우드 소프트웨어를 월정액으로 제공합니다. 한번 도입하면 지속적으로 과금되어 안정적인 반복 수익(MRR)이 생깁니다.',
        fit:  '지식 서비스·IT개발, 금융·핀테크, 의료·헬스케어, 교육 업종에 가장 많이 나타납니다.' },
      'b2c_sub':      { name: 'B2C 구독 (소비자 대상 정기 구독)', icon: '🔄',
        desc: '개인 소비자에게 콘텐츠·제품·서비스를 월정액으로 제공합니다. 고객이 취소하기 전까지 매달 자동 결제됩니다.',
        fit:  '교육, 미디어·엔터, 패션·뷰티, 식품 구독박스 업종에서 많이 사용됩니다.' },
      'b2b_solution': { name: 'B2B 솔루션 (기업 맞춤 시스템 공급)', icon: '🏗️',
        desc: '기업 고객의 요구에 맞는 시스템·소프트웨어를 구축하고 납품합니다. 프로젝트 단위로 수주하거나 유지보수 계약을 맺습니다.',
        fit:  '건설·인테리어, 지식 서비스·IT, 수출 중소기업, 환경·에너지 업종에 적합합니다.' },
      'b2c_commerce': { name: 'B2C 커머스 (소비자 직접 판매)', icon: '🛒',
        desc: '온라인·오프라인을 통해 소비자에게 직접 제품을 판매합니다. 스마트스토어, 쿠팡, 자사몰 등이 대표적입니다.',
        fit:  '식품 제조·가공, 패션·뷰티, 농림·식품원료, 수출 중소기업 업종에 많습니다.' },
      'platform':     { name: '플랫폼·마켓플레이스 (중개 수수료)', icon: '🔗',
        desc: '공급자와 소비자를 연결하고 거래가 발생할 때 수수료를 받습니다. 양면 시장을 키울수록 네트워크 효과로 경쟁우위가 강화됩니다.',
        fit:  '전문 유통·도소매, 금융·핀테크, 교육, 물류·운송 업종에서 나타납니다.' },
      'franchise':    { name: '프랜차이즈 (가맹 시스템)', icon: '🏪',
        desc: '검증된 브랜드와 운영 시스템을 가맹점에 제공하고 가맹비·로열티를 받습니다. 직접 운영 없이 빠른 확산이 가능합니다.',
        fit:  '외식·음식업, 생활밀착형 서비스, 식품 제조·가공 업종에 주로 나타납니다.' },
      'mfg_dist':     { name: '제조·유통 (생산 후 도·소매 판매)', icon: '🏭',
        desc: '직접 제품을 생산하거나 소싱하여 도매·소매 채널을 통해 유통합니다. 마진은 원가와 판매가 차이에서 발생합니다.',
        fit:  '뿌리 제조·부품가공, 식품 제조, 농림·식품원료, 수출 중소기업 업종의 기본 모델입니다.' },
      'service':      { name: '서비스업 (전문 용역·서비스 제공)', icon: '🤝',
        desc: '전문 지식이나 인력을 투입해 고객 문제를 해결하고 건당·시간당·월정액으로 수익을 올립니다.',
        fit:  '생활밀착형 서비스, 건설·인테리어, 외식, 물류·운송 업종의 가장 일반적인 모델입니다.' },
      'usage_based':  { name: '종량제·사용량기반 (쓴 만큼 과금)', icon: '📊',
        desc: '고객이 실제 사용한 만큼만 요금을 냅니다. 초기 진입 장벽이 낮아 고객 확보가 쉽고, 사용량이 늘수록 수익도 증가합니다.',
        fit:  '지식 서비스·IT, 금융·핀테크, 환경·에너지, 물류·운송 업종에서 나타납니다.' },
      'advertising':  { name: '광고기반 (콘텐츠·트래픽 수익화)', icon: '📣',
        desc: '사용자에게 무료로 콘텐츠를 제공하고 광고주로부터 수익을 올립니다. 트래픽(방문자)이 많을수록 광고 단가와 수익이 높아집니다.',
        fit:  '미디어·엔터테인먼트 업종의 핵심 모델입니다.' },
      'deeptech':     { name: '딥테크·바이오 (기술 사업화·라이선싱)', icon: '🔬',
        desc: '원천기술·특허를 개발한 후 라이선싱, 기술이전, 또는 직접 제품화로 수익을 올립니다. 개발 기간이 길지만 성공 시 강력한 진입장벽이 생깁니다.',
        fit:  '의료·헬스케어, 환경·에너지, 지식 서비스·IT 중 R&D 중심 기업에 해당합니다.' },
      'etc':          { name: '기타 (복합 수익 구조)', icon: '📋',
        desc: '위 유형이 명확히 해당되지 않거나, 여러 모델을 혼합한 복합적 수익 구조입니다.',
        fit:  '업종과 수익 구조를 구체적으로 설명해주시면 AI가 맞춤 분석을 제공합니다.' }
    };

    const container = document.getElementById('bm-confirm-content');
    if (!container) return;

    let html = '<div class="bmc-industry-row"><span class="bmc-ind-label">선택 업종</span><span class="bmc-ind-val">' + industryLabel + '</span></div>';
    html += '<p class="bmc-section-title">이 업종에서 가능한 사업모델을 선택해주세요</p>';
    html += '<div class="bmc-options">';

    candidates.forEach(bm => {
      const info      = BM_FULL_DESC[bm] || BM_FULL_DESC['etc'];
      const isDefault = (bm === result.primary);
      html += '<label class="bmc-option' + (isDefault ? ' bmc-recommended' : '') + '">';
      html += '<input type="radio" name="bmChoice" value="' + bm + '"' + (isDefault ? ' checked' : '') + '>';
      html += '<div class="bmc-option-body">';
      html += '<div class="bmc-option-header">';
      html += '<span class="bmc-option-icon">' + info.icon + '</span>';
      html += '<span class="bmc-option-name">' + info.name + '</span>';
      if (isDefault) html += '<span class="bmc-badge">추천</span>';
      html += '</div>';
      html += '<p class="bmc-option-desc">' + info.desc + '</p>';
      html += '<p class="bmc-option-fit">✔ ' + info.fit + '</p>';
      html += '</div>';
      html += '</label>';
    });

    html += '</div>';
    container.innerHTML = html;
  }

  return { goStep, validate, collect, animateLoading, reset, setScore, setMemo, setNumeric, setMixed, switchDiagTab, prevDiagTab, showDiagReveal, calcDomainScores, classifyConsultingType, drawRadarChart, onIndustryChange, getIndustryKey, setBmKey, showBmConfirmCard, hideBmConfirmCard, populateBmConfirm, goToStep2FromBm };
})();
