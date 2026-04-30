/* ================================================================
   BizNavi — bep-simulator.js
   BEP(손익분기점) + 현금흐름 시뮬레이션 엔진
   재무분석 대시보드에서 호출: BepSim.init(finData)
================================================================ */
const BepSim = (() => {

  // 현재 시뮬레이션 상태
  let _s = {
    monthlyRev:  0,    // 월 매출 (백만원)
    fixedCost:   0,    // 월 고정비 (백만원)
    varRatio:    0.60, // 변동비율 (0~1)
    cash:        0,    // 현재 현금 보유 (백만원)
    growthRate:  0,    // 월 매출 성장률 (%)
  };

  // ── 핵심 계산 ──────────────────────────────────────────────
  function bep(fixedCost, varRatio) {
    const contrib = 1 - varRatio;
    return contrib > 0 ? fixedCost / contrib : Infinity;
  }

  function monthlyProfit(rev, fixedCost, varRatio) {
    return rev * (1 - varRatio) - fixedCost;
  }

  function runway(cash, profit) {
    if (profit >= 0) return null; // 흑자: 런웨이 개념 없음
    return Math.abs(cash / profit);
  }

  // 6개월 현금흐름 배열
  function cashFlow6(initCash, monthlyRev, fixedCost, varRatio, growthPct) {
    const months = [];
    let cash = initCash;
    let rev  = monthlyRev;
    for (let i = 1; i <= 6; i++) {
      const profit = monthlyProfit(rev, fixedCost, varRatio);
      cash += profit;
      months.push({ m: i, rev: Math.round(rev * 10) / 10,
        profit: Math.round(profit * 10) / 10,
        cash:   Math.round(cash * 10) / 10 });
      rev *= (1 + growthPct / 100);
    }
    return months;
  }

  // ── 초기화 (finance-wizard.js가 분석 완료 후 호출) ──────────
  function init(d) {
    if (!d) return;

    // 재무 데이터에서 초기값 추출 (단위: 백만원)
    const annualRev  = parseFloat(d.revenue)     || 0;
    const annualCOGS = parseFloat(d.costOfSales) || 0;
    const annualLab  = parseFloat(d.laborCost)   || 0;
    const cashBal    = parseFloat(d.cash)         || 0;

    _s.monthlyRev = Math.round(annualRev / 12 * 10) / 10;
    // 변동비율: 매출원가 / 매출 (최소 0.3, 최대 0.9 클램프)
    _s.varRatio   = annualRev > 0
      ? Math.min(0.9, Math.max(0.3, annualCOGS / annualRev))
      : 0.60;
    // 고정비 추정: 인건비(월) + 매출의 15% (임대·감가상각 추정)
    _s.fixedCost  = Math.round((annualLab / 12 + annualRev / 12 * 0.15) * 10) / 10;
    _s.cash       = Math.round(cashBal * 10) / 10;
    _s.growthRate = 0;

    _injectUI();
    _bindEvents();
    _render();
  }

  // ── UI 주입 ─────────────────────────────────────────────────
  function _injectUI() {
    const el = document.getElementById('bepSimSection');
    if (!el) return;
    el.style.display = '';
    el.innerHTML = `
      <h2 class="fin-section-title">💡 BEP·현금흐름 시뮬레이션</h2>
      <p class="bep-desc">슬라이더를 조정해 시나리오별 손익분기점과 6개월 현금흐름을 실시간 확인하세요.</p>

      <div class="bep-layout">
        <!-- 입력 패널 -->
        <div class="bep-inputs">
          ${_sliderRow('bepRev',    '월 매출',    _s.monthlyRev, 0, Math.max(_s.monthlyRev * 3, 500), '백만원')}
          ${_sliderRow('bepFixed',  '월 고정비',  _s.fixedCost,  0, Math.max(_s.fixedCost * 3, 300),  '백만원')}
          ${_sliderRow('bepVar',    '변동비율',   Math.round(_s.varRatio * 100), 10, 90, '%')}
          ${_sliderRow('bepGrowth', '월 성장률',  _s.growthRate, -10, 30, '%')}
          ${_sliderRow('bepCash',   '현금 보유',  _s.cash, 0, Math.max(_s.cash * 3, 1000), '백만원')}
        </div>

        <!-- 결과 패널 -->
        <div class="bep-results">
          <div class="bep-cards" id="bepCards"></div>
        </div>
      </div>

      <!-- 6개월 현금흐름 -->
      <div class="bep-cf-wrap">
        <h3 class="bep-cf-title">6개월 현금흐름 예측</h3>
        <div class="bep-cf-grid" id="bepCfGrid"></div>
        <canvas id="bepCanvas" height="140" style="width:100%;margin-top:12px"></canvas>
      </div>
    `;
  }

  function _sliderRow(id, label, val, min, max, unit) {
    const step = unit === '%' ? 1 : Math.max(1, Math.round((max - min) / 100));
    return `
      <div class="bep-slider-row">
        <div class="bep-slider-label">
          <span>${label}</span>
          <strong id="${id}Val">${val}</strong><span class="bep-unit">${unit}</span>
        </div>
        <input type="range" id="${id}Slider" class="bep-slider"
          min="${min}" max="${max}" step="${step}" value="${val}">
      </div>`;
  }

  // ── 이벤트 바인딩 ────────────────────────────────────────────
  function _bindEvents() {
    const map = {
      bepRevSlider:    v => { _s.monthlyRev = +v; },
      bepFixedSlider:  v => { _s.fixedCost  = +v; },
      bepVarSlider:    v => { _s.varRatio   = +v / 100; },
      bepGrowthSlider: v => { _s.growthRate = +v; },
      bepCashSlider:   v => { _s.cash       = +v; },
    };
    for (const [id, setter] of Object.entries(map)) {
      const el = document.getElementById(id);
      if (!el) continue;
      el.addEventListener('input', function() {
        setter(this.value);
        document.getElementById(id.replace('Slider', 'Val')).textContent = this.value;
        _render();
      });
    }
  }

  // ── 렌더링 ───────────────────────────────────────────────────
  function _render() {
    const { monthlyRev, fixedCost, varRatio, cash, growthRate } = _s;
    const bepAmt   = bep(fixedCost, varRatio);
    const profit   = monthlyProfit(monthlyRev, fixedCost, varRatio);
    const gap      = monthlyRev - bepAmt;
    const rwy      = runway(cash, profit);
    const contrib  = (1 - varRatio) * 100;
    const cf       = cashFlow6(cash, monthlyRev, fixedCost, varRatio, growthRate);

    // 결과 카드
    const cards = document.getElementById('bepCards');
    if (cards) {
      const bepFmt    = isFinite(bepAmt) ? _fmt(bepAmt) + '백만원' : '계산 불가';
      const gapCls    = gap >= 0 ? 'bep-pos' : 'bep-neg';
      const gapLbl    = gap >= 0 ? '▲ BEP 초과' : '▼ BEP 미달';
      const profitCls = profit >= 0 ? 'bep-pos' : 'bep-neg';
      const rwyTxt    = rwy === null ? '흑자 운영 중' :
                        rwy < 1     ? `약 ${Math.round(rwy * 30)}일` :
                                      `약 ${rwy.toFixed(1)}개월`;
      const rwyWarn   = rwy !== null && rwy < 3;

      cards.innerHTML = `
        <div class="bep-card">
          <div class="bep-card-label">손익분기점 (BEP)</div>
          <div class="bep-card-val">${bepFmt}</div>
          <div class="bep-card-sub">공헌이익률 ${contrib.toFixed(1)}%</div>
        </div>
        <div class="bep-card ${gapCls}">
          <div class="bep-card-label">${gapLbl}</div>
          <div class="bep-card-val">${_fmt(Math.abs(gap))}백만원</div>
          <div class="bep-card-sub">${gap >= 0 ? '현재 매출이 BEP를 초과' : 'BEP 달성까지 부족한 매출'}</div>
        </div>
        <div class="bep-card ${profitCls}">
          <div class="bep-card-label">월 순이익 (추정)</div>
          <div class="bep-card-val">${profit >= 0 ? '+' : ''}${_fmt(profit)}백만원</div>
          <div class="bep-card-sub">매출 × 공헌이익률 − 고정비</div>
        </div>
        <div class="bep-card ${rwyWarn ? 'bep-warn' : ''}">
          <div class="bep-card-label">현금 런웨이</div>
          <div class="bep-card-val">${rwyTxt}</div>
          <div class="bep-card-sub">${rwyWarn ? '⚠ 즉각적 개선 필요' : '현금 소진 예상 기간'}</div>
        </div>
      `;
    }

    // 6개월 현금흐름 그리드
    const grid = document.getElementById('bepCfGrid');
    if (grid) {
      grid.innerHTML = `
        <div class="bep-cf-header">
          <span>월</span><span>매출</span><span>순이익</span><span>누적현금</span>
        </div>
        ${cf.map(r => `
          <div class="bep-cf-row ${r.profit < 0 ? 'cf-loss' : 'cf-profit'}">
            <span>${r.m}개월</span>
            <span>${_fmt(r.rev)}</span>
            <span>${r.profit >= 0 ? '+' : ''}${_fmt(r.profit)}</span>
            <span class="${r.cash < 0 ? 'bep-neg' : ''}">${_fmt(r.cash)}</span>
          </div>`).join('')}
      `;
    }

    // 캔버스 바 차트 (누적 현금)
    _drawCfChart(cf);
  }

  // ── Canvas 현금흐름 바 차트 ──────────────────────────────────
  function _drawCfChart(cf) {
    const canvas = document.getElementById('bepCanvas');
    if (!canvas) return;
    canvas.width = canvas.offsetWidth || 600;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const vals   = cf.map(r => r.cash);
    const maxV   = Math.max(...vals, 0.1);
    const minV   = Math.min(...vals, 0);
    const range  = maxV - minV || 1;
    const pad    = { l: 50, r: 20, t: 20, b: 28 };
    const bw     = (W - pad.l - pad.r) / cf.length - 8;
    const zeroY  = pad.t + (maxV / range) * (H - pad.t - pad.b);

    // zero line
    ctx.beginPath();
    ctx.moveTo(pad.l, zeroY); ctx.lineTo(W - pad.r, zeroY);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);

    cf.forEach((r, i) => {
      const x    = pad.l + i * ((W - pad.l - pad.r) / cf.length) + 4;
      const barH = Math.abs(r.cash / range) * (H - pad.t - pad.b);
      const y    = r.cash >= 0 ? zeroY - barH : zeroY;
      const col  = r.cash >= 0 ? '#4ADE80' : '#F87171';

      ctx.fillStyle = col + '99';
      ctx.fillRect(x, y, bw, barH);
      ctx.fillStyle = col;
      ctx.fillRect(x, y, bw, 2);

      // 월 레이블
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(r.m + '월', x + bw / 2, H - 6);

      // 값 레이블
      ctx.fillStyle = col;
      ctx.font = 'bold 10px sans-serif';
      const labelY = r.cash >= 0 ? y - 4 : y + barH + 12;
      ctx.fillText(_fmt(r.cash), x + bw / 2, labelY);
    });

    // y축 레이블
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(_fmt(maxV), pad.l - 4, pad.t + 10);
    if (minV < 0) ctx.fillText(_fmt(minV), pad.l - 4, H - pad.b);
  }

  function _fmt(v) {
    if (!isFinite(v)) return '—';
    return Math.round(Math.abs(v) * 10) / 10 + (v < 0 ? '' : '');
  }

  return { init };
})();
