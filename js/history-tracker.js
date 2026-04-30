/* ================================================================
   BizNavi — history-tracker.js
   분기별 진단 이력 추적 (localStorage 기반)
   Firebase 마이그레이션 시: _storage 객체만 교체하면 됨
================================================================ */
const HistoryTracker = (() => {

  const KEY     = 'biznavi_history';
  const MAX_SNAP = 20; // 최대 보관 스냅샷 수

  /* ── Storage 인터페이스 (Firebase 교체 지점) ───────────────────
     migrate to Firebase: 아래 _storage 함수만 Firestore 호출로 교체
  ──────────────────────────────────────────────────────────────*/
  const _storage = {
    load()       { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } },
    save(data)   { localStorage.setItem(KEY, JSON.stringify(data)); },
    clear()      { localStorage.removeItem(KEY); },
  };

  /* ── 분기 문자열 생성 ─────────────────────────────────────────*/
  function _quarter(date) {
    const d = date || new Date();
    const q = Math.ceil((d.getMonth() + 1) / 3);
    return `${d.getFullYear()}-Q${q}`;
  }

  /* ── 스냅샷 저장 ─────────────────────────────────────────────*/
  function save(formData, analysisResult) {
    const db    = _storage.load() || { snapshots: [] };
    const now   = new Date();

    const snap = {
      id:         now.toISOString(),
      savedAt:    now.toISOString(),
      quarter:    _quarter(now),
      company: {
        name:     formData.companyName  || '미입력',
        industry: formData.industry     || '',
        bizScale: formData.bizScale     || 'micro',
        startYear:parseInt(formData.startYear) || 0,
      },
      domainScores: _flattenDomains(formData.domainScores || {}),
      consultingType:     formData.consultingType     || '',
      consultingTypeLabel:_ctLabel(formData.consultingType),
      diagScoreSummary:   _scoreSummary(formData.domainScores || {}),
      survivalData:  formData.survivalData  ? { y3: formData.survivalData.y3, name: formData.survivalData.name } : null,
      patternArch:   window._patternMatch   ? window._patternMatch.archetype?.label : null,
      topIssues:     _extractWeakDomains(formData.domainScores || {}),
      execSummary:   (analysisResult?.executiveSummary || '').substring(0, 200),
    };

    // 같은 분기+회사명 이미 있으면 업데이트, 없으면 추가
    const idx = db.snapshots.findIndex(
      s => s.quarter === snap.quarter && s.company.name === snap.company.name
    );
    if (idx >= 0) db.snapshots[idx] = snap;
    else          db.snapshots.unshift(snap);

    // 최대 보관 수 초과 시 오래된 것 제거
    if (db.snapshots.length > MAX_SNAP) db.snapshots = db.snapshots.slice(0, MAX_SNAP);

    _storage.save(db);
    return snap;
  }

  /* ── 이전 스냅샷 로드 (같은 회사, 가장 최근 것 제외) ──────────*/
  function loadPrev(companyName, currentId) {
    const db = _storage.load();
    if (!db?.snapshots?.length) return null;
    const others = db.snapshots.filter(s => s.company.name === companyName && s.id !== currentId);
    return others.length ? others[0] : null;
  }

  /* ── 전체 이력 로드 ──────────────────────────────────────────*/
  function loadAll() {
    return (_storage.load()?.snapshots) || [];
  }

  /* ── diag-reveal 비교 섹션 렌더링 ───────────────────────────*/
  function renderCompare(formData, currentSnap) {
    const box     = document.getElementById('drHistoryBox');
    const content = document.getElementById('drHistoryContent');
    if (!box || !content) return;

    const prev = loadPrev(formData.companyName, currentSnap?.id);
    if (!prev) { box.style.display = 'none'; return; }

    box.style.display = '';

    const cur  = currentSnap?.domainScores || {};
    const prv  = prev.domainScores        || {};
    const domains = [
      { key: 'finance',         label: '재무건전성' },
      { key: 'hr',              label: '조직·인력' },
      { key: 'bm',              label: '고객·매출' },
      { key: 'differentiation', label: '차별화' },
    ];

    const daysDiff = Math.round((new Date(currentSnap?.savedAt) - new Date(prev.savedAt)) / 86400000);
    const daysTxt  = daysDiff >= 30 ? Math.round(daysDiff / 30) + '개월' : daysDiff + '일';

    content.innerHTML = `
      <div class="hist-meta">${prev.quarter} 진단 대비 (${daysTxt} 경과)</div>
      <div class="hist-compare-grid">
        ${domains.map(d => {
          const c = cur[d.key] || 0, p = prv[d.key] || 0;
          const delta = Math.round((c - p) * 10) / 10;
          const cls   = delta > 0 ? 'hist-up' : delta < 0 ? 'hist-dn' : 'hist-nc';
          const icon  = delta > 0 ? '▲' : delta < 0 ? '▼' : '━';
          return `<div class="hist-domain-row">
            <span class="hist-d-label">${d.label}</span>
            <div class="hist-d-bar-wrap">
              <div class="hist-d-bar" style="width:${(p/5)*100}%;background:rgba(255,255,255,.25)"></div>
              <div class="hist-d-bar hist-d-now" style="width:${(c/5)*100}%"></div>
            </div>
            <span class="hist-d-score">${c.toFixed(1)}</span>
            <span class="${cls}">${icon}${Math.abs(delta).toFixed(1)}</span>
          </div>`;
        }).join('')}
      </div>
      <div class="hist-ct-change">
        이전 컨설팅 유형: <strong>${prev.consultingTypeLabel || prev.consultingType || '미확인'}</strong>
        → 현재: <strong>${_ctLabel(formData.consultingType) || '미확인'}</strong>
      </div>
    `;
  }

  /* ── 이력 패널 렌더링 (전체 이력 목록) ──────────────────────*/
  function renderPanel() {
    const panel = document.getElementById('historyPanel');
    if (!panel) return;

    const all = loadAll();
    if (!all.length) {
      panel.innerHTML = '<p class="hist-empty">저장된 진단 이력이 없습니다.<br>분석을 완료하면 자동 저장됩니다.</p>';
      return;
    }

    // 회사별 그룹
    const byCompany = {};
    for (const s of all) {
      const nm = s.company.name;
      if (!byCompany[nm]) byCompany[nm] = [];
      byCompany[nm].push(s);
    }

    panel.innerHTML = Object.entries(byCompany).map(([name, snaps]) => `
      <div class="hist-company-block">
        <div class="hist-company-name">${name}
          <span class="hist-company-count">${snaps.length}회 분석</span>
        </div>
        ${snaps.map(s => `
          <div class="hist-snap-card">
            <div class="hist-snap-top">
              <span class="hist-quarter">${s.quarter}</span>
              <span class="hist-ct-badge">${s.consultingTypeLabel || s.consultingType || '—'}</span>
            </div>
            <div class="hist-snap-scores">
              ${Object.entries(s.domainScores).map(([k, v]) =>
                `<div class="hist-mini-bar-wrap" title="${_domainLabel(k)}: ${v.toFixed(1)}점">
                  <div class="hist-mini-bar" style="width:${(v/5)*100}%"></div>
                </div>`
              ).join('')}
            </div>
            ${s.topIssues?.length ? `<div class="hist-issues">${s.topIssues.map(i => `<span>${i}</span>`).join('')}</div>` : ''}
            ${s.execSummary ? `<p class="hist-summary">${s.execSummary}…</p>` : ''}
          </div>
        `).join('')}
      </div>
    `).join('');
  }

  /* ── 헬퍼 ──────────────────────────────────────────────────*/
  function _flattenDomains(ds) {
    const out = {};
    for (const [k, v] of Object.entries(ds)) {
      out[k] = typeof v === 'object' ? (v.avg || 0) : (v || 0);
    }
    return out;
  }

  function _scoreSummary(ds) {
    const vals = Object.values(ds).map(v => typeof v === 'object' ? v.avg || 0 : v || 0);
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
  }

  function _extractWeakDomains(ds) {
    const labels = { finance: '재무건전성', hr: '조직·인력', bm: '고객·매출', differentiation: '차별화' };
    return Object.entries(ds)
      .filter(([, v]) => (typeof v === 'object' ? v.avg || 0 : v || 0) < 3)
      .map(([k]) => labels[k] || k);
  }

  function _domainLabel(k) {
    return { finance: '재무', hr: '조직', bm: '고객·매출', differentiation: '차별화' }[k] || k;
  }

  function _ctLabel(ct) {
    const map = {
      finance_strategy:        '재무전략',
      growth_strategy:         '성장전략',
      differentiation_strategy:'차별화전략',
      structure_strategy:      '구조전략',
      innovation_strategy:     '혁신전략',
      marketing_strategy:      '마케팅전략',
      hr_strategy:             '인사전략',
      digital_strategy:        '디지털전환',
      pivot_strategy:          '피벗전략',
      cx_strategy:             '고객경험전략',
    };
    return map[ct] || ct || '';
  }

  return { save, loadPrev, loadAll, renderCompare, renderPanel };
})();
