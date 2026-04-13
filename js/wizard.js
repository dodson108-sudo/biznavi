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
    '의료/헬스케어': 'medical',
    '금융/핀테크': 'finance',
    '교육': 'education',
    '패션/뷰티': 'fashion',
    '미디어/엔터테인먼트': 'media',
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
    const industry = document.getElementById('industry')?.value || '';
    const bizModel = document.getElementById('bizModel')?.value || '';
    const industryKey = INDUSTRY_MAP[industry] || 'etc';
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
      'medical':       typeof INDUSTRY_MEDICAL      !== 'undefined' ? INDUSTRY_MEDICAL      : null,
      'finance':       typeof INDUSTRY_FINANCE      !== 'undefined' ? INDUSTRY_FINANCE      : null,
      'education':     typeof INDUSTRY_EDUCATION    !== 'undefined' ? INDUSTRY_EDUCATION    : null,
      'fashion':       typeof INDUSTRY_FASHION      !== 'undefined' ? INDUSTRY_FASHION      : null,
      'media':         typeof INDUSTRY_MEDIA        !== 'undefined' ? INDUSTRY_MEDIA        : null,
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

    // ── 업종×사업모델 통합 교차 진단 영역 추가 ──
    if (typeof CrossContext !== 'undefined' && industry && bizModel) {
      const crossArea = CrossContext.buildCrossArea(industryKey, bizModelKey, industry, bizModel);
      renderCrossArea('diag-bizmodel-container', crossArea);
    }

    // 탭 버튼 레이블 동적 업데이트 (업종·사업모델 반영)
    const indLabel  = industry || '업종';
    const bizLabel  = bizModel || '사업모델';
    const tabIndustry = document.getElementById('diagTabBtn-industry');
    const tabBizmodel = document.getElementById('diagTabBtn-bizmodel');
    if (tabIndustry) tabIndustry.textContent = '🏭 ' + indLabel + ' 특화 진단';
    if (tabBizmodel) tabBizmodel.textContent = '💼 ' + bizLabel + ' ✕ 통합 진단';

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

  // 교차 진단 영역 추가 렌더링 (기존 컨테이너에 append)
  function renderCrossArea(containerId, area) {
    const container = document.getElementById(containerId);
    if (!container || !area) return;

    let html = '<div class="diag-cross-area">';
    html += '<div class="diag-area">';
    html += '<div class="diag-area-header diag-area-header--cross">';
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
      const savedMemo = diagMemos[scoreKey] || '';
      html += '<textarea class="diag-memo" placeholder="💬 구체적 상황 메모 (선택)" onchange="Wizard.setMemo(\'' + scoreKey + '\',this.value)">' + savedMemo + '</textarea>';
      html += '</div>';
    });
    html += '</div>';
    html += '</div>';
    container.innerHTML += html;
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
      bizModel:        g('bizModel'),
      foundedYear:     g('foundedYear'),
      employees:       g('employees'),
      revenue:         g('revenue'),
      region:          g('region'),
      products:        g('products'),
      coreStrength:    g('coreStrength'),
      bizStrengths:    g('bizStrengths'),
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
      govSupport:          g('govSupport'),
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
    Object.keys(diagScores).forEach(k => delete diagScores[k]);
    updateStepUI(1);
    // step 카드 가시성 초기화: step1 표시, step2~4 숨김
    const step1 = document.getElementById('step1');
    if (step1) step1.classList.remove('hidden');
    for (let i = 2; i <= 4; i++) {
      const el = document.getElementById('step' + i);
      if (el) { el.classList.add('hidden'); el.classList.remove('slide-exit', 'slide-enter'); }
    }
  }

  return { goStep, validate, collect, animateLoading, reset, setScore, setMemo, switchDiagTab, prevDiagTab, showDiagReveal, calcDomainScores, classifyConsultingType, drawRadarChart };
})();
