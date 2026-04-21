/* ================================================================
   BizNavi AI — finance-wizard.js
   재무분석 위저드: 기업정보 입력 → 재무데이터 → 6대 비율 분석 리포트
   ================================================================ */

const FinWizard = (() => {
  let _curStep = 1;
  let _inputMode = 'dart'; // 'dart' | 'manual'
  let _dartData = null;    // DART에서 가져온 원본 데이터
  let _finData = {};       // 최종 재무 데이터

  /* ── 스텝 이동 ── */
  function goStep(n) {
    if (n === 2 && !_validateStep1()) return;
    _curStep = n;
    ['finWizStep1', 'finWizStep2'].forEach((id, i) => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('hidden', i + 1 !== n);
    });
    // 스텝 인디케이터 업데이트
    [1, 2, 3].forEach(i => {
      const el = document.getElementById('finStep' + i);
      if (el) {
        el.classList.toggle('active', i === n);
        el.classList.toggle('done', i < n);
      }
    });
    window.scrollTo(0, 0);
    // DART 자동조회 모드면 Step2 진입 시 자동 조회 시도
    if (n === 2 && _inputMode === 'dart') _tryDartAutoFill();
  }

  function _validateStep1() {
    const name = document.getElementById('finCompanyName')?.value.trim();
    const code = document.getElementById('finIndustryCode')?.value.trim();
    if (!name) { alert('회사명을 입력해주세요.'); return false; }
    if (!code) { alert('업종코드를 입력해주세요.\n(예: C2830)'); return false; }
    return true;
  }

  /* ── 입력 모드 전환 ── */
  function switchInputMode(mode) {
    _inputMode = mode;
    document.getElementById('finTabDart')?.classList.toggle('active', mode === 'dart');
    document.getElementById('finTabManual')?.classList.toggle('active', mode === 'manual');
  }

  /* ── 회사명 입력 시 DART 버튼 표시 ── */
  function onCompanyInput(el) {
    const btn = document.getElementById('finDartBtn');
    if (btn) btn.style.display = el.value.trim().length >= 2 ? 'block' : 'none';
  }

  /* ── DART 조회 (Step1) ── */
  async function lookupDart() {
    const name = document.getElementById('finCompanyName')?.value.trim();
    if (!name || name.length < 2) return;
    const resultEl = document.getElementById('finDartResult');
    resultEl.classList.remove('hidden');
    resultEl.innerHTML = '<span class="dart-loading">DART 조회 중...</span>';
    try {
      const res = await fetch('/api/dart-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: name })
      });
      const data = await res.json();
      if (data.status === 'found') {
        _dartData = data;
        resultEl.innerHTML = `
          <div class="dart-result-grid">
            <div class="dart-item"><span class="dart-label">회사명</span><span class="dart-value">${data.corpName}</span></div>
            <div class="dart-item"><span class="dart-label">기준연도</span><span class="dart-value">${data.year}년</span></div>
            ${data.revenue ? `<div class="dart-item"><span class="dart-label">매출액</span><span class="dart-value">${data.revenue.eok}억원</span></div>` : ''}
            ${data.totalAssets ? `<div class="dart-item"><span class="dart-label">자산총계</span><span class="dart-value">${data.totalAssets.eok}억원</span></div>` : ''}
          </div>
          <p style="color:#4ADE80;font-size:0.85rem;margin-top:8px">✅ DART 재무데이터 확인 완료 — Step 2에서 자동입력됩니다</p>`;
      } else if (data.status === 'no_key') {
        resultEl.innerHTML = '<span style="color:var(--txt3)">DART API 키가 미설정되어 직접 입력이 필요합니다.</span>';
      } else {
        resultEl.innerHTML = '<span style="color:var(--txt3)">DART 등록 데이터가 없습니다. 직접 입력해주세요.</span>';
        _dartData = null;
      }
    } catch (e) {
      resultEl.innerHTML = '<span style="color:var(--txt3)">조회 중 오류. 직접 입력해주세요.</span>';
    }
  }

  /* ── Step2 진입 시 DART 데이터 자동입력 ── */
  function _tryDartAutoFill() {
    if (!_dartData || _dartData.status !== 'found') return;
    const d = _dartData;
    const notice = document.getElementById('finDartAutoFill');
    if (notice) notice.classList.remove('hidden');

    // 억원 → 백만원 변환 함수
    const toMil = (eok) => eok ? eok * 100 : null;
    // raw 값 (원 단위) → 백만원
    const rawToMil = (raw) => {
      if (!raw) return null;
      const n = parseInt(raw.replace(/,/g, ''), 10);
      return isNaN(n) ? null : Math.round(n / 1000000);
    };

    _setField('fin_revenue',          rawToMil(d.revenue?.raw));
    _setField('fin_operating_profit', rawToMil(d.operatingProfit?.raw));
    _setField('fin_net_income',       rawToMil(d.netIncome?.raw));
    _setField('fin_total_assets',     rawToMil(d.totalAssets?.raw));
    _setField('fin_total_liabilities',rawToMil(d.totalDebt?.raw));
    // 자기자본 = 자산총계 - 부채총계
    const ta = rawToMil(d.totalAssets?.raw);
    const td = rawToMil(d.totalDebt?.raw);
    if (ta && td) _setField('fin_equity', ta - td);
  }

  function _setField(id, val) {
    const el = document.getElementById(id);
    if (el && val !== null && val !== undefined) el.value = val;
  }

  /* ── 재무분석 실행 ── */
  function analyze() {
    const d = _collectData();
    if (!d) return;
    _finData = d;
    const ratios = _calcRatios(d);
    const industryCode = document.getElementById('finIndustryCode')?.value.trim() || '';
    _renderDashboard(ratios, d, industryCode);
    App.showFinanceDashboard();
  }

  function _collectData() {
    const g = (id) => parseFloat(document.getElementById(id)?.value) || 0;
    const revenue = g('fin_revenue');
    const totalAssets = g('fin_total_assets');
    const totalLiabilities = g('fin_total_liabilities');
    const equity = g('fin_equity');
    if (!revenue || !totalAssets || !totalLiabilities || !equity) {
      alert('필수 항목(매출액, 자산총계, 부채총계, 자기자본)을 입력해주세요.');
      return null;
    }
    return {
      companyName:         document.getElementById('finCompanyName')?.value.trim() || '',
      industryCode:        document.getElementById('finIndustryCode')?.value.trim() || '',
      year:                document.getElementById('finYear')?.value || '2024',
      current_assets:      g('fin_current_assets'),
      quick_assets:        g('fin_quick_assets'),
      cash:                g('fin_cash'),
      receivable:          g('fin_receivable'),
      inventory:           g('fin_inventory'),
      noncurrent_assets:   g('fin_noncurrent_assets'),
      tangible_assets:     g('fin_tangible_assets'),
      total_assets:        totalAssets,
      current_liabilities: g('fin_current_liabilities'),
      payable:             g('fin_payable'),
      noncurrent_liabilities: g('fin_noncurrent_liabilities'),
      borrowings:          g('fin_borrowings'),
      total_liabilities:   totalLiabilities,
      equity:              equity,
      revenue:             revenue,
      gross_profit:        g('fin_gross_profit'),
      operating_profit:    g('fin_operating_profit'),
      interest_expense:    g('fin_interest_expense'),
      net_income:          g('fin_net_income'),
      labor_cost:          g('fin_labor_cost'),
      employees:           g('fin_employees'),
      prev_revenue:        g('fin_prev_revenue')
    };
  }

  /* ── 6대 재무비율 계산 ── */
  function _calcRatios(d) {
    const pct = (n, denom) => denom ? +(n / denom * 100).toFixed(1) : null;
    const times = (n, denom) => denom ? +(n / denom).toFixed(2) : null;
    const days = (denom, n) => (denom && n) ? Math.round(365 / (n / denom)) : null;

    // 유동성
    const liquidity = {
      유동비율:   pct(d.current_assets, d.current_liabilities),
      당좌비율:   pct(d.quick_assets || (d.current_assets - d.inventory), d.current_liabilities),
      현금비율:   pct(d.cash, d.current_liabilities),
    };

    // 안전성
    const safety = {
      부채비율:         pct(d.total_liabilities, d.equity),
      자기자본비율:     pct(d.equity, d.total_assets),
      순운전자본비율:   pct(d.current_assets - d.current_liabilities, d.total_assets),
      차입금의존도:     pct(d.borrowings, d.total_assets),
      차입금평균이자율: pct(d.interest_expense, d.borrowings),
      이자보상비율:     pct(d.operating_profit, d.interest_expense),
      고정비율:         pct(d.noncurrent_assets || (d.total_assets - d.current_assets), d.equity),
      고정장기적합율:   pct(d.noncurrent_assets || (d.total_assets - d.current_assets), d.equity + d.noncurrent_liabilities),
    };

    // 수익성
    const profitability = {
      매출총이익율:         pct(d.gross_profit, d.revenue),
      매출액영업이익율:     pct(d.operating_profit, d.revenue),
      매출액순이익율:       pct(d.net_income, d.revenue),
      총자본순이익율_ROA:   pct(d.net_income, d.total_assets),
      자기자본순이익율_ROE: pct(d.net_income, d.equity),
    };

    // 활동성
    const activity = {
      총자산회전율:       times(d.revenue, d.total_assets),
      자기자본회전율:     times(d.revenue, d.equity),
      재고자산회전율:     times(d.revenue, d.inventory),
      매출채권회전율:     times(d.revenue, d.receivable),
      매출채권회수기간:   days(d.receivable, d.revenue),
      매입채무회전율:     times(d.revenue, d.payable),
      매입채무지급기간:   days(d.payable, d.revenue),
    };

    // 생산성
    const emp = d.employees || 1;
    const valueAdded = d.operating_profit + d.labor_cost; // 간이 부가가치
    const productivity = {
      부가가치율:           pct(valueAdded, d.revenue),
      노동생산성_1인당부가가치: d.employees ? Math.round(valueAdded / d.employees) : null,
      인건비대매출액:       pct(d.labor_cost, d.revenue),
      노동소득분배율:       pct(d.labor_cost, valueAdded),
    };

    // 성장성
    const growth = {
      매출액증가율: d.prev_revenue ? pct(d.revenue - d.prev_revenue, d.prev_revenue) : null,
    };

    return { liquidity, safety, profitability, activity, productivity, growth };
  }

  /* ── 한국은행 업종평균 (하드코딩 기준값, 제조업 C 기준) ── */
  const _BOK_AVG = {
    유동비율: 127, 당좌비율: 96, 현금비율: 16,
    부채비율: 142, 자기자본비율: 41, 순운전자본비율: 11,
    차입금의존도: 32, 차입금평균이자율: 6, 이자보상비율: 237,
    고정비율: 115, 고정장기적합율: 81,
    매출총이익율: 15, 매출액영업이익율: 4, 매출액순이익율: 2,
    총자본순이익율_ROA: 3, 자기자본순이익율_ROE: 7,
    총자산회전율: 1.3, 자기자본회전율: 3.2,
    재고자산회전율: 10.4, 매출채권회전율: 6.3,
    매출채권회수기간: 58, 매입채무회전율: 9.8, 매입채무지급기간: 37,
    부가가치율: 21, 인건비대매출액: 12, 노동소득분배율: 76,
    매출액증가율: 9,
  };

  /* 비율이 높을수록 좋은 것 vs 낮을수록 좋은 것 */
  const _HIGH_IS_GOOD = new Set([
    '유동비율','당좌비율','현금비율','자기자본비율','순운전자본비율',
    '이자보상비율','매출총이익율','매출액영업이익율','매출액순이익율',
    '총자본순이익율_ROA','자기자본순이익율_ROE',
    '총자산회전율','자기자본회전율','재고자산회전율','매출채권회전율',
    '매입채무회전율','부가가치율','노동생산성_1인당부가가치',
    '매출액증가율','고정장기적합율',
  ]);
  const _LOW_IS_GOOD = new Set([
    '부채비율','차입금의존도','차입금평균이자율','고정비율',
    '인건비대매출액','노동소득분배율',
    '매출채권회수기간','매입채무지급기간',
  ]);

  function _evalVsAvg(key, val) {
    const avg = _BOK_AVG[key];
    if (val === null || avg === undefined) return { label: '—', cls: '' };
    if (_HIGH_IS_GOOD.has(key)) {
      return val >= avg ? { label: '산업평균 이상', cls: 'fin-eval-good' } : { label: '산업평균 미달', cls: 'fin-eval-bad' };
    }
    if (_LOW_IS_GOOD.has(key)) {
      return val <= avg ? { label: '산업평균 양호', cls: 'fin-eval-good' } : { label: '산업평균 초과', cls: 'fin-eval-bad' };
    }
    return { label: '—', cls: '' };
  }

  /* ── 대시보드 렌더링 ── */
  function _renderDashboard(ratios, d, industryCode) {
    const wrap = document.getElementById('finDashContent');
    if (!wrap) return;

    const sections = [
      { key: 'liquidity',     title: '유동성 분석',  icon: '💧', desc: '단기 채무 상환 능력', data: ratios.liquidity },
      { key: 'safety',        title: '안전성 분석',  icon: '🛡️', desc: '장기 재무 안정성',    data: ratios.safety },
      { key: 'profitability', title: '수익성 분석',  icon: '💰', desc: '이익 창출 능력',       data: ratios.profitability },
      { key: 'activity',      title: '활동성 분석',  icon: '⚙️', desc: '자산 운용 효율성',    data: ratios.activity },
      { key: 'productivity',  title: '생산성 분석',  icon: '🏭', desc: '노동·자본 생산성',    data: ratios.productivity },
      { key: 'growth',        title: '성장성 분석',  icon: '📈', desc: '성장 추세',            data: ratios.growth },
    ];

    const goodCount = _countEvals(ratios);

    wrap.innerHTML = `
      <div class="fin-dash-header">
        <div>
          <h1 class="fin-dash-title">${d.companyName} 재무분석 리포트</h1>
          <p class="fin-dash-meta">${d.year}년 기준 · 업종코드: ${industryCode} · 한국은행 산업평균 대비</p>
        </div>
        <div class="fin-score-summary">
          <div class="fin-score-num">${goodCount.good}<span>/${goodCount.total}</span></div>
          <div class="fin-score-label">산업평균<br>이상 항목</div>
        </div>
      </div>

      <div class="fin-key-metrics">
        ${_keyMetricCard('매출액', d.revenue, '백만원')}
        ${_keyMetricCard('영업이익률', ratios.profitability.매출액영업이익율, '%')}
        ${_keyMetricCard('부채비율', ratios.safety.부채비율, '%')}
        ${_keyMetricCard('ROA', ratios.profitability.총자본순이익율_ROA, '%')}
      </div>

      ${sections.map(s => _renderSection(s)).join('')}

      <div class="fin-note">
        <p>※ 산업평균은 한국은행 기업경영분석 제조업(C) 기준입니다. 정확한 업종별 비교는 한국은행 ECOS(ecos.bok.or.kr)에서 해당 업종코드로 확인하세요.</p>
        <p>※ 일부 항목은 입력 데이터가 없는 경우 계산되지 않을 수 있습니다.</p>
      </div>
    `;
  }

  function _countEvals(ratios) {
    let good = 0, total = 0;
    Object.values(ratios).forEach(section => {
      Object.entries(section).forEach(([key, val]) => {
        if (val === null) return;
        const ev = _evalVsAvg(key, val);
        if (ev.cls) { total++; if (ev.cls === 'fin-eval-good') good++; }
      });
    });
    return { good, total };
  }

  function _keyMetricCard(label, val, unit) {
    const display = val !== null && val !== undefined ? `${val.toLocaleString()}${unit}` : '—';
    return `<div class="fin-key-card"><div class="fin-key-val">${display}</div><div class="fin-key-label">${label}</div></div>`;
  }

  function _renderSection({ title, icon, desc, data }) {
    const rows = Object.entries(data).map(([key, val]) => {
      const avg = _BOK_AVG[key];
      const ev = _evalVsAvg(key, val);
      const isTime = key.includes('회전율');
      const isDay = key.includes('기간');
      const unit = isTime ? '회' : isDay ? '일' : isKey1인당(key) ? '백만원' : '%';
      const display = val !== null ? `${val.toLocaleString()}${unit}` : '—';
      const avgDisplay = avg !== undefined ? (isTime ? `${avg}회` : isDay ? `${avg}일` : isKey1인당(key) ? `${avg}백만원` : `${avg}%`) : '—';
      const barWidth = val !== null && avg ? Math.min(Math.round(val / avg * 100), 200) : 0;
      const barColor = ev.cls === 'fin-eval-good' ? '#4ADE80' : ev.cls === 'fin-eval-bad' ? '#F87171' : '#9BAAC8';

      return `
        <tr class="fin-ratio-row">
          <td class="fin-ratio-name">${key.replace(/_/g, ' ')}</td>
          <td class="fin-ratio-val">${display}</td>
          <td class="fin-ratio-avg">${avgDisplay}</td>
          <td class="fin-ratio-bar-cell">
            <div class="fin-ratio-bar-bg">
              <div class="fin-ratio-bar" style="width:${Math.min(barWidth, 100)}%;background:${barColor}"></div>
              ${barWidth > 100 ? `<div class="fin-ratio-bar fin-ratio-bar-over" style="width:${barWidth - 100}%;background:${barColor}"></div>` : ''}
            </div>
          </td>
          <td><span class="fin-eval ${ev.cls}">${ev.label}</span></td>
        </tr>`;
    }).join('');

    return `
      <div class="fin-section-card">
        <div class="fin-section-head">
          <span class="fin-section-icon">${icon}</span>
          <div>
            <div class="fin-section-title-text">${title}</div>
            <div class="fin-section-desc">${desc}</div>
          </div>
        </div>
        <table class="fin-ratio-table">
          <thead><tr>
            <th>항목</th><th>당사</th><th>산업평균</th><th>비교</th><th>평가</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function isKey1인당(key) { return key.includes('1인당'); }

  /* ── PUBLIC API ── */
  return {
    goStep, switchInputMode, onCompanyInput, lookupDart, analyze
  };
})();
