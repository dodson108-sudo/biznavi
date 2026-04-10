/* ===================================================================
   ticker.js — 글로벌 시장 실시간 롤링 배너

   데이터 전략:
   - 환율 (달러/원·엔/원·위안/원): open.er-api.com 실시간 (CORS 지원)
   - 주가지수 (코스피·코스닥·다우·나스닥·닛케이): "장중 업데이트" 표시
     → 브라우저 CORS 정책으로 무료 주가 API 직접 호출 불가
   - 원자재 (WTI·금): 참고용 고정값 표시
   =================================================================== */
(function () {
  'use strict';

  /* Finnhub API 키 (무료, 60회/분 제한) */
  const FINNHUB_KEY = 'd7c610hr01quh9fcl1d0d7c610hr01quh9fcl1dg';

  /* Finnhub 지수 심볼 매핑 */
  const FINNHUB_SYMBOLS = {
    dow:    '^DJI',
    nasdaq: '^IXIC',
    nikkei: '^N225',
  };

  /* ──────────────────────────────────────────
     표시 항목 정의
     fallback: 값을 가져오지 못할 때 표시할 텍스트
     fixed:    true → 고정값으로만 표시 (fetch 시도 안 함)
  ────────────────────────────────────────── */
  const ITEMS = [
    { id: 'kospi',  name: '코스피',  type: 'index', dec: 2, fallback: '장중'    },
    { id: 'kosdaq', name: '코스닥',  type: 'index', dec: 2, fallback: '장중'    },
    { id: 'dow',    name: '다우',    type: 'finnhub', dec: 0, fallback: '장중'  },
    { id: 'nasdaq', name: '나스닥',  type: 'finnhub', dec: 2, fallback: '장중'  },
    { id: 'nikkei', name: '닛케이',  type: 'finnhub', dec: 0, fallback: '장중'  },
    { id: 'usdkrw', name: '달러/원', type: 'fx',    dec: 2 },
    { id: 'jpykrw', name: '엔/원',   type: 'fx',    dec: 2 },
    { id: 'cnykrw', name: '위안/원', type: 'fx',    dec: 2 },
    { id: 'wti',    name: 'WTI',     type: 'fixed', dec: 2, fallback: '$78.00'  },
    { id: 'gold',   name: '금',      type: 'fixed', dec: 0, fallback: '$2,300'  },
  ];

  /* 실시간 데이터 저장소 */
  const state = {};

  /* ──────────────────────────────────────────
     시계
  ────────────────────────────────────────── */
  function startClock() {
    const el = document.getElementById('tickerClock');
    if (!el) return;
    const tick = () => {
      const n = new Date();
      el.textContent = [n.getHours(), n.getMinutes(), n.getSeconds()]
        .map(v => String(v).padStart(2, '0')).join(':');
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ──────────────────────────────────────────
     Finnhub 지수 API (다우·나스닥·닛케이)
     — CORS 지원, 무료 60회/분
  ────────────────────────────────────────── */
  async function fetchFinnhub() {
    const entries = Object.entries(FINNHUB_SYMBOLS); // [[id, symbol], ...]
    await Promise.allSettled(entries.map(async ([id, symbol]) => {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 8000);
        const res = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_KEY}`,
          { signal: ctrl.signal }
        );
        clearTimeout(timer);
        if (!res.ok) return;
        const data = await res.json();
        // c: 현재가, pc: 전일 종가
        if (data.c && data.c > 0) {
          const change = data.pc ? ((data.c - data.pc) / data.pc) * 100 : null;
          state[id] = { value: data.c, change };
        }
      } catch (_) { /* 오류 시 fallback 유지 */ }
    }));
  }

  /* ──────────────────────────────────────────
     환율 API (open.er-api.com)
     — CORS 지원, 무료, API 키 불필요
     — 60분 캐시 기준으로 응답
  ────────────────────────────────────────── */
  async function fetchFX() {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch('https://open.er-api.com/v6/latest/USD', {
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) return;

      const { rates } = await res.json();
      if (!rates?.KRW || !rates?.JPY || !rates?.CNY) return;

      state.usdkrw = { value: rates.KRW,                      change: null };
      state.jpykrw = { value: (rates.KRW / rates.JPY) * 100,  change: null }; // 100엔 기준
      state.cnykrw = { value:  rates.KRW / rates.CNY,          change: null };
    } catch (_) {
      /* 네트워크 오류 시 '--' 유지 */
    }
  }

  /* ──────────────────────────────────────────
     포맷 유틸
  ────────────────────────────────────────── */
  function fmtVal(val, dec) {
    if (val == null) return '--';
    return val.toLocaleString('ko-KR', {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    });
  }

  function fmtChg(pct) {
    return (pct >= 0 ? '▲' : '▼') + Math.abs(pct).toFixed(2) + '%';
  }

  /* ──────────────────────────────────────────
     단일 항목 HTML 생성
  ────────────────────────────────────────── */
  function itemHTML(item) {
    const s = state[item.id];

    /* 값 표시 결정 */
    let valHTML;
    if (s?.value != null) {
      /* 실시간 값 (환율) */
      valHTML = `<span class="lp-t-val">${fmtVal(s.value, item.dec)}</span>`;
    } else if (item.fallback) {
      /* 장중 / 고정값 */
      const cls = item.type === 'fixed' ? 'lp-t-val lp-t-fixed' : 'lp-t-val lp-t-fallback';
      valHTML = `<span class="${cls}">${item.fallback}</span>`;
    } else {
      valHTML = `<span class="lp-t-val">--</span>`;
    }

    /* 등락률 (실시간 데이터만) */
    const chgHTML = (s?.change != null)
      ? `<span class="lp-t-chg ${s.change >= 0 ? 'up' : 'dn'}">${fmtChg(s.change)}</span>`
      : '';

    return (
      `<span class="lp-t-item" data-id="${item.id}">` +
        `<span class="lp-t-name">${item.name}</span>` +
        valHTML +
        chgHTML +
      `</span>` +
      `<span class="lp-t-sep" aria-hidden="true">|</span>`
    );
  }

  /* ──────────────────────────────────────────
     트랙 빌드 (최초 1회)
     — 2× 복제로 끊김 없는 무한 루프 구현
  ────────────────────────────────────────── */
  function buildTrack() {
    const track = document.getElementById('tickerTrack');
    if (!track) return;
    const html = ITEMS.map(itemHTML).join('');
    track.innerHTML = html + html;
    adjustSpeed(track);
  }

  /** 컨텐츠 너비 기준 속도 보정 (~40px/s) */
  function adjustSpeed(track) {
    requestAnimationFrame(() => {
      const single = track.scrollWidth / 2;
      if (single > 0) {
        const secs = Math.max(15, Math.round(single / 40));
        track.style.animationDuration = secs + 's';
      }
    });
  }

  /* ──────────────────────────────────────────
     인플레이스 업데이트 (애니메이션 유지)
     — 환율 갱신 후 DOM 텍스트만 교체
  ────────────────────────────────────────── */
  function updateInPlace() {
    const track = document.getElementById('tickerTrack');
    if (!track) return;

    ITEMS.forEach(item => {
      const s = state[item.id];
      track.querySelectorAll(`[data-id="${item.id}"]`).forEach(el => {
        /* 값 업데이트 */
        const valEl = el.querySelector('.lp-t-val, .lp-t-fallback, .lp-t-fixed');
        if (valEl && s?.value != null) {
          valEl.className = 'lp-t-val';
          valEl.textContent = fmtVal(s.value, item.dec);
        }

        /* 등락률 업데이트 */
        let chgEl = el.querySelector('.lp-t-chg');
        if (s?.change != null) {
          if (!chgEl) {
            chgEl = document.createElement('span');
            valEl?.after(chgEl);
          }
          chgEl.className = 'lp-t-chg ' + (s.change >= 0 ? 'up' : 'dn');
          chgEl.textContent = fmtChg(s.change);
        }
      });
    });
  }

  /* ──────────────────────────────────────────
     초기화
  ────────────────────────────────────────── */
  async function init() {
    startClock();
    buildTrack();           // 즉시 표시 (환율 '--', 주가 '장중', WTI/금 고정값)

    await Promise.all([fetchFX(), fetchFinnhub()]);  // 환율 + 지수 동시 로드
    updateInPlace();

    /* 5분마다 갱신 */
    setInterval(async () => {
      await Promise.all([fetchFX(), fetchFinnhub()]);
      updateInPlace();
    }, 5 * 60_000);
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
