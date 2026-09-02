/* ================================================================
   BizNavi AI — dashboard.js
   결과 대시보드: 렌더링, 스크롤 리빌, 카운트업, 리플 효과, 입력 체크
   ================================================================ */

const Dashboard = (() => {

  let _scrollSpyBound = null;
  let _radarChart = null;

  // 공통 진단 영역 이름 매핑
  const COMMON_AREA_LABELS = {
    area_1: '재무건전성',
    area_2: '조직·인력',
    area_3: '고객·매출',
    area_4: '경영역량'
  };

  function scoreLabel(s) {
    if (s >= 4.0) return '강점';
    if (s >= 3.0) return '보통';
    if (s >= 2.0) return '취약';
    return '위험';
  }

  function renderLeanCanvas(data, fd) {
    const section = document.getElementById('sec-lean-canvas');
    if (!section) return;

    const lc = data.leanCanvas;
    if (!lc) { section.style.display = 'none'; return; }
    section.style.display = '';

    // 9블록 정의 (린 캔버스 순서)
    const blocks = [
      {
        key: 'problem', label: 'Problem', sub: '핵심 문제', icon: '🔴', cls: 'lc-problem',
        guide: '고객이 현재 겪고 있는 가장 중요한 문제 1~3가지입니다. 기존의 어떤 방법(경쟁사, 대안)으로도 해결되지 않는 pain point를 구체적으로 정의하세요. 예: "단골 고객 의존도 80% → 신규 유입 경로 없음", "월말마다 현금 부족 → 운전자금 관리 방법 없음"'
      },
      {
        key: 'solution', label: 'Solution', sub: '해결책', icon: '💡', cls: 'lc-solution',
        guide: '위 문제를 해결하는 우리만의 방법입니다. 거창하지 않아도 되며, 지금 당장 실행 가능한 구체적인 해법이어야 합니다. 각 문제에 1:1로 대응하는 솔루션을 제시하면 가장 강력합니다.'
      },
      {
        key: 'uniqueValueProposition', label: 'Unique Value Prop.', sub: '핵심 가치 제안', icon: '⭐', cls: 'lc-uvp',
        guide: '고객이 우리를 선택해야 하는 단 하나의 이유입니다. "왜 다른 곳이 아닌 우리?"에 10초 안에 답할 수 있어야 합니다. 예: "당일 출장 수리 전문 — 4시간 내 방문 보장", "30년 장인의 수제 레시피 — 방부제·조미료 無". 명확하고 검증 가능한 약속이어야 합니다.'
      },
      {
        key: 'unfairAdvantage', label: 'Unfair Advantage', sub: '모방 불가 강점', icon: '🛡️', cls: 'lc-advantage',
        guide: '경쟁사가 돈으로 사거나 쉽게 따라 할 수 없는 나만의 강점입니다. 예: 특허·자격증·독점 계약, 오랜 단골 관계, 희귀한 기술이나 네트워크, 특별한 입지 등. 비어있다면 "아직 없음 — 현재 구축 중"이라도 솔직하게 적고 전략에 반영하세요.'
      },
      {
        key: 'customerSegments', label: 'Customer Segments', sub: '타겟 고객', icon: '👥', cls: 'lc-customer',
        guide: '우리 제품·서비스에 돈을 낼 가능성이 가장 높은 핵심 고객 집단입니다. 나이·직업·지역·행동 패턴 등으로 구체화하세요. 예: "반경 1km 내 30~50대 직장인 점심 수요", "인스타그램 활용하는 20대 여성 소자본 창업자". 모두를 타겟하면 아무도 잡지 못합니다.'
      },
      {
        key: 'keyMetrics', label: 'Key Metrics', sub: '핵심 지표', icon: '📊', cls: 'lc-metrics',
        guide: '사업의 건강 상태를 나타내는 3~5개의 숫자입니다. 매출·방문자 수보다 "우리 사업의 본질"을 측정하는 지표를 선택하세요. 예: 재방문율(단골 충성도), 객단가(구매 깊이), 신규 고객 유입 수(성장성), 원가율(수익성). 이 숫자가 개선되면 매출이 자연히 따라옵니다.'
      },
      {
        key: 'channels', label: 'Channels', sub: '채널', icon: '📣', cls: 'lc-channels',
        guide: '고객이 우리를 발견하고, 구매하고, 재방문하는 경로입니다. 현재 효과를 보고 있는 채널과 앞으로 강화할 채널을 구분하여 적으세요. 예: 네이버 플레이스(현재 주력), 인스타그램(강화 예정), 단골 소개(구전). 채널마다 비용 대비 효과(ROAS)가 다르므로 집중 채널을 1~2개로 좁히는 것이 유리합니다.'
      },
      {
        key: 'costStructure', label: 'Cost Structure', sub: '비용 구조', icon: '💸', cls: 'lc-cost',
        guide: '사업을 운영하는 데 드는 주요 비용 항목입니다. 고정비(임대료·인건비·통신비 — 매출에 상관없이 발생)와 변동비(재료비·배달비·광고비 — 매출에 따라 변동)를 구분하세요. 손익분기점(BEP)을 파악하고, 가장 큰 비용부터 줄일 방법을 찾는 것이 생존 전략의 핵심입니다.'
      },
      {
        key: 'revenueStreams', label: 'Revenue Streams', sub: '수익 흐름', icon: '💰', cls: 'lc-revenue',
        guide: '고객으로부터 돈을 받는 방식입니다. 단일 수익원에 의존하면 리스크가 크므로 2~3개의 수익 흐름을 구성하는 것이 이상적입니다. 예: 주력 상품 판매(즉시 수익) + 구독·정기권(예측 가능 수익) + 교육·컨설팅(고마진 수익). 수익 흐름별 비율과 마진을 파악하고, 고마진 수익원을 늘리는 방향을 전략에 반영하세요.'
      },
    ];

    const grid = document.getElementById('leanCanvasGrid');
    if (!grid) return;
    grid.innerHTML = blocks.map(b => `
      <div class="lc-block ${b.cls}">
        <div class="lc-block-hdr">
          <span class="lc-icon">${b.icon}</span>
          <span class="lc-label">${b.label}</span>
          <span class="lc-sublabel">${b.sub}</span>
        </div>
        <div class="lc-content">${(lc[b.key] || '—').replace(/\n/g, '<br>')}</div>
        <div class="lc-guide">${b.guide}</div>
      </div>`).join('');
  }

  function renderSpecializedSection(data, fd) {
    const section = document.getElementById('sec-consulting');
    if (!section) return;

    const spec = data.specializedAnalysis;
    if (!spec || !spec.blocks || spec.blocks.length === 0) {
      section.style.display = 'none';
      return;
    }
    section.style.display = '';

    // 프레임워크 뱃지
    const badge = document.getElementById('specFrameworkBadge');
    if (badge) badge.textContent = spec.framework || '특화 분석';

    // 컨설팅 유형 아이콘 매핑
    const typeIconMap = {
      finance_strategy:        '💰',
      growth_strategy:         '🚀',
      differentiation_strategy:'⚡',
      hr_strategy:             '👥',
      structure_strategy:      '🏗️',
      digital_strategy:        '🖥️',
      innovation_strategy:     '💡',
      marketing_strategy:      '📣',
      pivot_strategy:          '🔄',
      cx_strategy:             '🤝',
    };
    const icon = typeIconMap[spec.type] || '🎯';

    // 요약
    const summaryEl = document.getElementById('specSummary');
    if (summaryEl) {
      summaryEl.innerHTML =
        `<div class="spec-type-row"><span class="spec-type-icon">${icon}</span><span class="spec-type-label">${spec.framework}</span></div>` +
        `<p class="spec-summary-text">${spec.summary || ''}</p>`;
    }

    // 블록 렌더링
    const blocksEl = document.getElementById('specBlocks');
    if (blocksEl) {
      blocksEl.innerHTML = spec.blocks.map((b, i) => `
        <div class="spec-block">
          <div class="spec-block-label"><span class="spec-block-num">${i + 1}</span>${b.label}</div>
          <div class="spec-block-content">${(b.content || '').replace(/\n/g, '<br>')}</div>
        </div>`).join('');
    }
  }

  // ── 생애주기 진단 렌더링 (micro 전용) ────────────────────────
  function renderLifecycleMicro(data) {
    const section = document.getElementById('sec-lifecycle');
    if (!section) return;
    if (!data.lifecycleStage) { section.style.display = 'none'; return; }
    section.style.display = '';

    const el = document.getElementById('lifecycleContent');
    if (!el) return;

    const raw = data.lifecycleStage || '';
    const stageMatch = raw.match(/^(창업기|생존기|성장기|성숙기|전환기)/);
    const stageName = stageMatch ? stageMatch[1] : raw.split(/[\s—\-]/)[0].trim();
    const stageDesc = raw.replace(stageName, '').replace(/^[\s—\-:]+/, '').trim();

    const icons  = { '창업기': '🌱', '생존기': '⚡', '성장기': '🚀', '성숙기': '🌟', '전환기': '🔄' };
    const stages = ['창업기', '생존기', '성장기', '성숙기', '전환기'];
    const icon   = icons[stageName] || '📍';

    el.innerHTML = `
      <div class="lifecycle-stage-banner">
        <span class="lc-stage-icon">${icon}</span>
        <div class="lc-stage-body">
          <div class="lc-stage-name">${stageName}</div>
          ${stageDesc ? `<div class="lc-stage-desc">${stageDesc}</div>` : ''}
        </div>
      </div>
      <div class="lifecycle-steps">
        ${stages.map(s =>
          `<div class="lc-step ${s === stageName ? 'lc-step-active' : ''}">
            <div class="lc-step-icon">${icons[s] || ''}</div>
            <div class="lc-step-name">${s}</div>
          </div>
          ${s !== stages[stages.length - 1] ? '<div class="lc-step-arrow">→</div>' : ''}`
        ).join('')}
      </div>`;
  }

  // ── 상권 STP · TAM/SAM/SOM 렌더링 (micro 전용) ──────────────
  function renderMarketMicro(data) {
    const section = document.getElementById('sec-market-micro');
    if (!section) return;
    const hasStp = data.stp && (data.stp.segmentation || data.stp.targeting || data.stp.target || data.stp.positioning);
    const hasTsm = data.tam || data.sam || data.som;
    if (!hasStp && !hasTsm) { section.style.display = 'none'; return; }
    section.style.display = '';

    const el = document.getElementById('marketMicroContent');
    if (!el) return;

    let html = '';
    if (hasStp) {
      const stp = data.stp;
      html += `<div class="micro-stp-wrap">
        <h4 class="micro-sub-h4">STP 분석</h4>
        <div class="stp-grid">
          <div class="stp-card"><div class="stp-big">S</div><div class="stp-label">Segmentation · 세분화</div><div class="stp-txt">${stp.segmentation || ''}</div></div>
          <div class="stp-card"><div class="stp-big">T</div><div class="stp-label">Targeting · 타겟팅</div><div class="stp-txt">${stp.targeting || stp.target || ''}</div></div>
          <div class="stp-card"><div class="stp-big">P</div><div class="stp-label">Positioning · 포지셔닝</div><div class="stp-txt">${stp.positioning || ''}</div></div>
        </div>
      </div>`;
    }
    if (hasTsm) {
      html += `<div class="micro-tsm-wrap">
        <h4 class="micro-sub-h4">상권 시장 규모 (TAM / SAM / SOM)</h4>
        <div class="tsm-grid">
          ${data.tam ? `<div class="tsm-card tsm-tam"><div class="tsm-abbr">TAM</div><div class="tsm-full">전체 유효 시장</div><div class="tsm-val">${data.tam}</div></div>` : ''}
          ${data.sam ? `<div class="tsm-card tsm-sam"><div class="tsm-abbr">SAM</div><div class="tsm-full">서비스 제공 가능 시장</div><div class="tsm-val">${data.sam}</div></div>` : ''}
          ${data.som ? `<div class="tsm-card tsm-som"><div class="tsm-abbr">SOM</div><div class="tsm-full">획득 가능 시장</div><div class="tsm-val">${data.som}</div></div>` : ''}
        </div>
      </div>`;
    }
    el.innerHTML = html;
  }

  /* ══════════════════════════════════════════════════════════════
     정책자금 진단 전용 렌더링 (purpose='funding')
     ⚠ render()는 AI 분석 결과를 첫 인자로 기대하므로 재사용하지 않고
        별도 진입점 renderFunding(fd)을 둔다. 경영진단 경로에 영향 없음.
     ══════════════════════════════════════════════════════════════ */

  const FUNDING_ONLY_SECTIONS = ['sec-funding-summary', 'sec-funding-agency', 'sec-funding-roadmap', 'sec-funding-docs'];

  function _esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* 통과/결격 집계는 kind==='verdict' 항목만 대상 (reference는 참고 항목이므로 제외) */
  function _fundCounts(agency) {
    const v = (agency.findings || []).filter(x => x.kind !== 'reference');
    const c = s => v.filter(x => x.status === s).length;
    return { total: v.length, clear: c('clear'), conditional: c('conditional'), unknown: c('unknown'), blocked: c('blocked') };
  }

  const _FUND_VERDICT_BADGE = {
    blocked: { cls: 'fv-blocked', txt: '결격 사유 있음' },
    review:  { cls: 'fv-review',  txt: '확인 필요' },
    clear:   { cls: 'fv-clear',   txt: '결격 사유 없음' },
  };
  const _FUND_STATUS_LABEL = { blocked: '결격', conditional: '확인 필요', unknown: '모름', clear: '통과' };

  const _FUND_LIMIT_NOTE = {
    semas:  '소상공인 정책자금은 자금 종류별로 한도가 다르며, 실제 승인액은 신용도 등을 반영해 개별 산정됩니다. 최신 한도는 소진공 공고를 확인하세요.',
    kosmes: '중소기업 정책자금은 자금 종류별로 한도가 다르며, 실제 승인액은 기업평가 결과에 따라 개별 산정됩니다. 최신 한도는 중진공 공고를 확인하세요.',
  };

  // ── ① 판정 요약 ──────────────────────────────────────────────
  function renderFundingSummary(fd) {
    const section = document.getElementById('sec-funding-summary');
    const el = document.getElementById('fundingSummaryContent');
    if (!section || !el) return;

    const v = fd && fd.fundingVerdict;
    const agencies = (v && v.agencies) || [];
    if (!agencies.length) { section.style.display = 'none'; return; }
    section.style.display = '';

    // 한 줄 요약 — 사용자가 가장 먼저 읽는 문장
    const eligible = agencies.filter(a => a.eligible);
    let head;
    if (!eligible.length) {
      head = { cls: 'fh-none', txt: '해당하는 기관이 없습니다. 다른 지원 제도를 검토하세요.' };
    } else if (eligible.every(a => a.verdict === 'blocked')) {
      head = { cls: 'fh-blocked', txt: '현재 상태로는 신청이 어렵습니다. 아래 해소 과제를 먼저 확인하세요.' };
    } else {
      head = { cls: 'fh-ok', txt: '신청 가능한 기관이 있습니다. 아래 확인 사항을 점검하세요.' };
    }

    // 기관별 점검 결과 — 분모(점검 N개)를 명시해 '왜 항상 확인 필요지?' 오해를 줄인다
    const rows = agencies.map(a => {
      if (!a.eligible) {
        const uncertain = a.eligibilityUncertain ? ' <span class="fs-uncertain">확인 시 대상 가능</span>' : '';
        return `<div class="fs-row fs-row-none">
            <span class="fs-agency">${_esc(a.short || a.name)}</span>
            <span class="fs-detail">대상 아님${uncertain}</span>
          </div>`;
      }
      const c = _fundCounts(a);
      const parts = [`점검 ${c.total}개`];
      if (c.clear)       parts.push(`통과 ${c.clear}`);
      if (c.conditional) parts.push(`확인 필요 ${c.conditional}`);
      if (c.unknown)     parts.push(`모름 ${c.unknown}`);
      if (c.blocked)     parts.push(`결격 ${c.blocked}`);
      return `<div class="fs-row">
          <span class="fs-agency">${_esc(a.short || a.name)}</span>
          <span class="fs-detail">${parts.join(' · ')}</span>
        </div>`;
    }).join('');

    const unknowns = (v.unknownItems || []);
    const unknownBox = unknowns.length
      ? `<div class="fs-unknown-box">
           <div class="fs-unknown-title">확인하면 더 정확해집니다</div>
           <p>다음 항목을 '모름'으로 응답하셨습니다. 확인하시면 더 정확한 진단이 가능합니다: ${unknowns.map(_esc).join(' · ')}</p>
         </div>`
      : '';

    el.innerHTML =
      `<div class="fund-headline ${head.cls}">${head.txt}</div>` +
      `<div class="fs-rows">${rows}</div>` +
      unknownBox;
  }

  // ── ② 기관별 상세 ────────────────────────────────────────────
  function _fundFindingHtml(x) {
    const sev = x.severity || 'medium';
    const statusTxt = _FUND_STATUS_LABEL[x.status] || x.status;
    const remedy = x.remedy
      ? `<div class="ff-remedy"><strong>해소 방법:</strong> ${_esc(x.remedy)}</div>` : '';
    const src = x.source
      ? `<div class="ff-source">근거: ${x.sourceUrl
          ? `<a href="${_esc(x.sourceUrl)}" target="_blank" rel="noopener">${_esc(x.source)}</a>`
          : _esc(x.source)}</div>`
      : '';
    return `<div class="fund-finding ff-sev-${sev}">
        <div class="ff-head">
          <span class="ff-label">${_esc(x.label)}</span>
          <span class="ff-status ff-st-${x.status}">${statusTxt}</span>
        </div>
        <p class="ff-msg">${_esc(x.message)}</p>
        ${remedy}${src}
      </div>`;
  }

  function renderFundingAgency(fd) {
    const section = document.getElementById('sec-funding-agency');
    const el = document.getElementById('fundingAgencyContent');
    if (!section || !el) return;

    const v = fd && fd.fundingVerdict;
    const agencies = (v && v.agencies) || [];
    if (!agencies.length) { section.style.display = 'none'; return; }
    section.style.display = '';

    el.innerHTML = agencies.map(a => {
      // 자격 배지
      let badge;
      if (!a.eligible) {
        const extra = a.eligibilityUncertain ? '<span class="fv-badge fv-uncertain">확인 시 대상 가능</span>' : '';
        badge = `<span class="fv-badge fv-none">대상 아님</span>${extra}`;
      } else {
        const b = _FUND_VERDICT_BADGE[a.verdict] || _FUND_VERDICT_BADGE.review;
        badge = `<span class="fv-badge ${b.cls}">${b.txt}</span>`;
        // 예외 적용으로 대상에 포함된 경우 — 사유를 배지로 명시
        // 재확인이 필요한 경우(warning)는 주황 계열로 구분한다
        if (a.exceptionLabel || a.exceptionBy) {
          const short = _esc(a.exceptionLabel || a.exceptionBy);
          const full  = _esc(a.exceptionBy || '');
          const cls   = a.warning ? 'fv-exception-warn' : 'fv-exception';
          badge += `<span class="fv-badge ${cls}" title="${full}">${short}로 대상 포함</span>`;
        }
      }

      let body;
      if (!a.eligible) {
        // 자격이 없으면 findings를 렌더링하지 않는다 (자격 미확정 상태의 경고는 오진)
        body = `<p class="fa-not-eligible">${_esc(a.notEligibleReason || '')}</p>`;
      } else {
        const all = a.findings || [];
        const open = all.filter(x => x.kind !== 'reference' && x.status !== 'clear');
        const passed = all.filter(x => x.kind !== 'reference' && x.status === 'clear');
        const refs = all.filter(x => x.kind === 'reference');

        body =
          (open.length ? open.map(_fundFindingHtml).join('') : '<p class="fa-none">확인이 필요한 항목이 없습니다.</p>') +
          (passed.length
            ? `<details class="fund-clear-wrap"><summary>통과한 항목 ${passed.length}개 보기</summary>
                 ${passed.map(_fundFindingHtml).join('')}</details>`
            : '') +
          (refs.length
            ? `<div class="fund-ref-wrap"><div class="fund-ref-title">참고 사항</div>
                 ${refs.map(_fundFindingHtml).join('')}</div>`
            : '');
      }

      const note = _FUND_LIMIT_NOTE[a.key] || '';
      const link = a.url
        ? ` <a href="${_esc(a.url)}" target="_blank" rel="noopener">${_esc(a.name)} 바로가기 →</a>` : '';

      // 자격은 유지하되 응답 재확인이 필요한 경우 — 카드 상단에 경고 박스
      const warnBox = a.warning
        ? `<div class="fa-warning"><span class="fa-warning-icon">⚠</span><p>${_esc(a.warning)}</p></div>` : '';

      return `<div class="fund-agency-card">
          <div class="fa-head">
            <span class="fa-name">${_esc(a.name)}</span>
            ${badge}
          </div>
          ${warnBox}
          <div class="fa-body">${body}</div>
          ${note ? `<div class="fa-limit-note">${note}${link}</div>` : ''}
        </div>`;
    }).join('');
  }

  // ── ③ 준비 서류 ──────────────────────────────────────────────
  function renderFundingDocs(fd) {
    const section = document.getElementById('sec-funding-docs');
    const el = document.getElementById('fundingDocsContent');
    if (!section || !el) return;
    section.style.display = '';

    const f = (fd && fd.fundingData) || {};

    // 기관 공통 서류만 안내한다. 자금 종류별 서류는 매년 바뀌므로 하드코딩하지 않는다
    const common = [
      '사업자등록증명원',
      '국세·지방세 완납증명서',
      '최근 3개년 재무제표 (또는 소득금액증명원)',
      '4대보험 가입자명부',
      '부동산 등기부등본 (담보 제공 시)',
      '보유 인증서 사본 (벤처·이노비즈·사회적기업 등 해당 시)',
    ];

    const extra = [];
    if (f.taxArrears === 'yes') extra.push('체납 관련: 징수유예·분납 승인 서류');
    if (Array.isArray(f.certs) && f.certs.filter(c => c && c !== '해당 없음').length) {
      extra.push('보유 인증서 원본·사본: ' + f.certs.filter(c => c && c !== '해당 없음').map(_esc).join(' · '));
    }
    if (f.isManufacturing === 'yes') extra.push('제조 시설 관련: 공장등록증 또는 임대차계약서');

    el.innerHTML =
      `<ul class="fund-doc-list">${common.map(d => `<li>${_esc(d)}</li>`).join('')}</ul>` +
      (extra.length
        ? `<div class="fund-doc-extra"><div class="fund-doc-extra-title">귀사 응답 기준 추가 준비 서류</div>
             <ul class="fund-doc-list">${extra.map(d => `<li>${d}</li>`).join('')}</ul></div>`
        : '') +
      `<p class="fund-doc-note">실제 제출 서류는 자금 종류와 신청 시기에 따라 다릅니다. 신청 전 반드시 해당 기관 공고를 확인하세요.</p>`;
  }

  /* ── ④ AI 실행 로드맵 ────────────────────────────────────────
     state: 'loading' | 'error' | 'done'
     ⚠ AI가 실패해도 판정 섹션은 그대로 둔다. 이 섹션에만 실패 안내를 표시한다. */
  function renderFundingRoadmap(state, roadmap) {
    const section = document.getElementById('sec-funding-roadmap');
    const el = document.getElementById('fundingRoadmapContent');
    if (!section || !el) return;
    section.style.display = '';

    if (state === 'loading') {
      el.innerHTML = '<div class="fr-loading"><span class="fr-spinner"></span>' +
        'AI가 판정 결과를 바탕으로 실행 로드맵을 작성하고 있습니다…</div>';
      return;
    }

    if (state === 'error') {
      el.innerHTML =
        '<div class="fr-error">' +
          '<p>AI 실행 로드맵 생성에 실패했습니다. 위 판정 결과는 정상적으로 확인하실 수 있습니다.</p>' +
          '<button class="btn btn-gold btn-sm" onclick="App.retryFundingRoadmap()">다시 시도</button>' +
        '</div>';
      return;
    }

    const r = roadmap || {};
    const situation = r.situation
      ? `<p class="fr-situation">${_esc(r.situation)}</p>` : '';

    const priority = Array.isArray(r.priority) && r.priority.length
      ? `<div class="fr-block"><h4 class="fr-h4">우선순위 과제</h4>` +
        r.priority.map((p, i) => `
          <div class="fr-pri-card">
            <div class="fr-pri-head"><span class="fr-pri-num">${_esc(p.order || (i + 1))}</span>
              <span class="fr-pri-action">${_esc(p.action || '')}</span></div>
            ${p.why ? `<div class="fr-pri-row"><strong>이유</strong> ${_esc(p.why)}</div>` : ''}
            ${p.how ? `<div class="fr-pri-row"><strong>방법</strong> ${_esc(p.how)}</div>` : ''}
          </div>`).join('') + '</div>'
      : '';

    const prepare = Array.isArray(r.prepare90) && r.prepare90.length
      ? `<div class="fr-block"><h4 class="fr-h4">90일 준비 계획</h4><div class="fr-90-grid">` +
        r.prepare90.map(m => `
          <div class="fr-90-card">
            <div class="fr-90-month">${_esc(m.month || '')}개월차</div>
            ${m.focus ? `<div class="fr-90-focus">${_esc(m.focus)}</div>` : ''}
            <ul class="fr-90-tasks">${(Array.isArray(m.tasks) ? m.tasks : []).map(t => `<li>${_esc(t)}</li>`).join('')}</ul>
          </div>`).join('') + '</div></div>'
      : '';

    const cautions = Array.isArray(r.cautions) && r.cautions.length
      ? `<div class="fr-cautions"><div class="fr-cautions-title">주의사항</div>
           <ul>${r.cautions.map(c => `<li>${_esc(c)}</li>`).join('')}</ul></div>`
      : '';

    const html = situation + priority + prepare + cautions;
    el.innerHTML = html || '<p class="fa-none">생성된 실행 로드맵이 없습니다.</p>';
  }

  // ── 정책자금 전용 진입점 ──────────────────────────────────────
  function renderFunding(fd) {
    _lastFd = fd || {};
    buildNav(false, true);

    // 정책자금 4섹션만 표시하고 나머지 리포트 섹션은 전부 숨김
    const keep = FUNDING_ONLY_SECTIONS.concat(['sec-gov']);
    document.querySelectorAll('#dashboard .report-content .section-card').forEach(el => {
      el.style.display = keep.indexOf(el.id) >= 0 ? '' : 'none';
    });

    const title = document.getElementById('dTitle');
    if (title) title.textContent = ((fd && fd.companyName) || '기업') + ' 정책자금 진단 리포트';
    const dateStr = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    const sub = document.getElementById('dSub');
    if (sub) {
      sub.innerHTML = '진단일: ' + dateStr +
        ' &nbsp;<span class="mode-badge-inline">💰 정책자금 진단</span>' +
        '&nbsp;<span class="real-badge-inline">📋 기관 기준 자가진단</span>';
    }
    const demoBadge = document.getElementById('demoBadge');
    if (demoBadge) demoBadge.classList.add('hidden');

    try { renderFundingSummary(fd); } catch (e) { console.error('renderFundingSummary:', e); }
    try { renderFundingAgency(fd);  } catch (e) { console.error('renderFundingAgency:', e); }
    try { renderFundingRoadmap('loading'); } catch (e) { console.error('renderFundingRoadmap:', e); }
    try { renderFundingDocs(fd);    } catch (e) { console.error('renderFundingDocs:', e); }
    try { renderGovSection(fd);     } catch (e) { console.error('renderGovSection:', e); }
  }


  /* ══════════════════════════════════════════════════════════════
     사회적경제 조직 전용 리포트 (1차 — 진단 결과 직접 렌더링, AI 미연결)

     설계 원칙: 진단에서 물은 8개 영역은 리포트에서 모두 다뤄져야 한다(수미쌍관).
     S1→미션 / S2→미션 / S3→판로 / S4→수익구조 / S5→조직 / S6→판로 / S7→제도 / S8→조직
     ⚠ SWOT·STP·4P·린캔버스 등 중소기업 프레임워크는 쓰지 않는다.
        사회적경제 조직은 규모상 소기업 수준이라 그 틀이 맞지 않는다.
  ══════════════════════════════════════════════════════════════ */

  const SOCIAL_ONLY_SECTIONS = [
    'sec-social-summary', 'sec-social-status', 'sec-social-mission', 'sec-social-revenue',
    'sec-social-profit', 'sec-social-org', 'sec-social-system', 'sec-social-action',
  ];

  /* s1~s8(진단 문항 id) ↔ mission/value_biz…(calcScores 반환 키) 매핑.
     ⚠ 하드코딩하지 않고 DiagSocial.DOMAINS에서 런타임 파생한다 —
        영역이 바뀌거나 전용 모듈(DiagCoop 등)이 추가돼도 한쪽만 고쳐 조용히 깨지는 일이 없도록.
        DiagSocial 미로드 시 빈 배열을 반환해 화면이 비더라도 예외는 나지 않는다. */
  /* orgType → 진단 모듈. wizard.js의 _orgDiagModule과 같은 기준이며,
     모듈 인스턴스는 window에서 읽는다(배열·매핑 복제 금지).
     ⚠ 협동조합은 전용 모듈이 없어 DiagSocial을 빌려 쓴다 */
  function _orgModule(fd) {
    const G = (typeof window !== 'undefined') ? window : {};
    const t = (fd && fd.orgType) || (_lastFd && _lastFd.orgType) || '';
    if (t === 'social_venture') return G.DiagVenture || null;
    if (t === 'social_enterprise' || t === 'cooperative') return G.DiagSocial || null;
    // orgType이 없는 레거시 데이터 — 점수 키 접두어로 역추적
    const pre = (fd && fd.orgDiagKeyPrefix) || '';
    if (pre.indexOf('venture') >= 0) return G.DiagVenture || null;
    return G.DiagSocial || null;
  }
  /* 점수 키 접두어 — collect()가 실어 보낸 값을 쓰고, 없으면 모듈에서 파생한다.
     ⚠ 'diag-social-container_'를 하드코딩하지 않는다 (소셜벤처는 diag-venture-container_) */
  function _orgKeyPrefix(fd) {
    if (fd && fd.orgDiagKeyPrefix) return fd.orgDiagKeyPrefix;
    const m = _orgModule(fd);
    return (m && m.KEY_PREFIX) || 'diag-social-container_';
  }
  function _socialDomainList(fd) {
    const D = _orgModule(fd);
    return (D && Array.isArray(D.DOMAINS)) ? D.DOMAINS : [];
  }
  function _socialItems(fd) {
    const D = _orgModule(fd);
    return (D && D.ITEMS) ? D.ITEMS : {};
  }
  /* 소셜벤처 여부 — 섹션 라벨 분기용 */
  function _isVentureFd(fd) {
    const t = (fd && fd.orgType) || (_lastFd && _lastFd.orgType) || '';
    if (t) return t === 'social_venture';
    return String((fd && fd.orgDiagKeyPrefix) || '').indexOf('venture') >= 0;
  }
  /* 영역 해설은 wizard.js의 SOCIAL_DOMAIN_EXPLAIN(키 s1~s8)을 그대로 쓴다 — 문구 복제 금지 */
  function _socialExplain(fd) {
    const W = (typeof window !== 'undefined' && window.Wizard) ||
              (typeof Wizard !== 'undefined' ? Wizard : null);
    if (!W) return {};
    return (_isVentureFd(fd) ? W.VENTURE_DOMAIN_EXPLAIN : W.SOCIAL_DOMAIN_EXPLAIN) || {};
  }

  /* 조직 형태 판정 — collect()가 실어 보낸 파생 플래그를 쓴다(SOCIAL_ORG_TYPES 배열 복제 금지).
     ⚠ 레거시 호출·이력 스냅샷 등 플래그가 없는 데이터를 위해 fallback을 남긴다.
        fallback도 배열을 복제하지 않고 "general이 아니면 사회적경제"로 판단한다 */
  function _isSocialFd(fd) {
    if (!fd) return false;
    if (typeof fd.isSocialOrg === 'boolean') return fd.isSocialOrg;
    const t = fd.orgType || 'general';
    return t !== 'general' && t !== '';
  }

  /* 경고 code → 섹션 매핑.
     여기에 없는 code도 ⑧'무엇부터 할 것인가'에는 전부 나오므로 새 규칙이 추가돼도 화면에서 사라지지 않는다 */
  const SOCIAL_WARN_SECTION = {
    mission_drift_risk: 'mission', impact_invisible: 'mission',
    public_lock_in: 'revenue', procurement_unready: 'revenue', no_proposal_asset: 'revenue',
    subsidy_cliff: 'profit', winning_but_losing: 'profit',
    ceo_bottleneck: 'org', employment_unstable: 'org', digital_base_missing: 'org',
    svi_gap: 'system', formal_shell: 'system',

    /* 소셜벤처(DiagVenture) 경고 코드 — V1~V8 대응 */
    articles_not_ready: 'mission', impact_unprovable: 'mission',
    target_unmeasured: 'mission', no_differentiation_story: 'mission',
    tech_social_disconnect: 'profit', rnd_asset_missing: 'profit',
    runway_blind: 'revenue', unproven_and_unfunded: 'revenue',
    ir_not_ready: 'revenue', public_finance_unused: 'revenue',
    team_single_point: 'org',
    application_unready: 'system',
  };

  /* 섹션별 대응 영역 id — 조직 형태에 따라 다르다.
     ⚠ 수미쌍관: 8영역이 빠짐없이 어느 섹션엔가 배정되어야 한다.
        사회적기업 S1~S8 / 소셜벤처 V1~V8 모두 8/8이 배정된다 */
  const SEC_DOMAINS = {
    social:  { mission: ['s1', 's2'], revenue: ['s3', 's6'], profit: ['s4'], org: ['s5', 's8'], system: ['s7'] },
    venture: { mission: ['v1', 'v2'], revenue: ['v5', 'v4'], profit: ['v3'], org: ['v6', 'v8'], system: ['v7'] },
  };
  function _secDomainIds(fd, key) {
    return SEC_DOMAINS[_isVentureFd(fd) ? 'venture' : 'social'][key] || [];
  }
  const SOCIAL_LEVEL_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 };

  function _esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* 진단 점수 맵 — diagScores({score,memo})를 평면 숫자로 (collectAllScores와 동일 형식) */
  function _socialFlatScores(fd) {
    const src = (fd && fd.diagScores) || {};
    const out = {};
    Object.keys(src).forEach(k => {
      const s = Number((src[k] && src[k].score) || 0);
      if (s > 0) out[k] = s;
    });
    return out;
  }

  function _socialWarnings(fd) {
    // orgWarnings가 정본. socialWarnings는 구 필드(병행 유지 중)
    if (fd && Array.isArray(fd.orgWarnings)) return fd.orgWarnings;
    if (fd && Array.isArray(fd.socialWarnings)) return fd.socialWarnings;
    const D = _orgModule(fd);
    if (!D || !D.detectCrossWarnings) return [];
    try { return D.detectCrossWarnings(_socialFlatScores(fd)) || []; } catch (e) { return []; }
  }
  function _sortWarn(list) {
    return list.slice().sort(function (a, b) {
      var la = SOCIAL_LEVEL_ORDER[a.level]; var lb = SOCIAL_LEVEL_ORDER[b.level];
      return (la === undefined ? 9 : la) - (lb === undefined ? 9 : lb);
    });
  }
  function _warnCard(w, extraCls) {
    const cls = 'soc-warn soc-warn-' + String(w.level || 'MEDIUM').toLowerCase() + (extraCls ? ' ' + extraCls : '');
    return '<div class="' + cls + '" data-code="' + _esc(w.code) + '">' +
      '<span class="soc-warn-level">' + _esc(w.level) + '</span>' +
      '<span class="soc-warn-msg">' + _esc(w.msg) + '</span>' +
      '</div>';
  }
  function _warnsFor(fd, sectionKey) {
    return _sortWarn(_socialWarnings(fd).filter(function (w) {
      return SOCIAL_WARN_SECTION[w.code] === sectionKey;
    }));
  }

  /* 영역 점수 — DiagSocial.calcScores() 결과(fd.scaleScores)가 정본.
     없으면 diagScores에서 직접 산출한다 */
  function _socialDomains(fd) {
    let sc = (fd && fd.scaleScores) || null;
    if (!sc || !sc.domains) {
      const D = _orgModule(fd);
      if (D && D.calcScores) { try { sc = D.calcScores(_socialFlatScores(fd)); } catch (e) { sc = null; } }
    }
    const domains = (sc && sc.domains) || {};
    return _socialDomainList(fd).map(function (d) {
      const v = domains[d.key] || {};
      return {
        id: d.id, key: d.key, label: d.label, icon: d.icon, desc: d.desc,
        avg: Number(v.avg || 0), pct: Number(v.pct || 0),
      };
    });
  }
  function _socialTotal(fd) {
    const sc = (fd && fd.scaleScores) || null;
    if (sc && typeof sc.total === 'number') return sc.total;
    const list = _socialDomains(fd).filter(function (d) { return d.avg > 0; });
    if (!list.length) return 0;
    return Math.round(list.reduce(function (a, d) { return a + d.pct; }, 0) / list.length);
  }

  function _socBar(d) {
    const cls = d.avg >= 4 ? 'high' : d.avg >= 3 ? 'mid' : d.avg >= 2 ? 'low' : d.avg > 0 ? 'risk' : 'none';
    const lbl = d.avg >= 4 ? '강점' : d.avg >= 3 ? '보통' : d.avg >= 2 ? '취약' : d.avg > 0 ? '위험' : '미입력';
    return '<div class="soc-bar-row" data-domain="' + _esc(d.id) + '">' +
      '<span class="soc-bar-label">' + _esc((d.icon || '') + ' ' + d.id.toUpperCase() + '. ' + d.label) + '</span>' +
      '<div class="soc-bar-track"><div class="soc-bar-fill ' + cls + '" style="width:' + d.pct + '%"></div></div>' +
      '<span class="soc-bar-val ' + cls + '">' + (d.avg > 0 ? d.avg.toFixed(1) : '—') + ' <small>' + lbl + '</small></span>' +
      '</div>';
  }

  /* 문항별 점수표 — 지정한 영역(s1 등)의 5문항 + 2점 이하 지적 */
  function _socItemTable(fd, domainIds) {
    const flat = _socialFlatScores(fd);
    const items = _socialItems(fd);
    const doms = _socialDomains(fd);
    const PRE = _orgKeyPrefix(fd);
    let html = '';
    domainIds.forEach(function (did) {
      const dom = doms.filter(function (d) { return d.id === did; })[0];
      const keys = Object.keys(items).filter(function (k) { return k.indexOf(did + '_') === 0; });
      const rows = keys.map(function (k) {
        const sc = Number(flat[PRE + k] || 0);
        const cls = sc >= 4 ? 'high' : sc >= 3 ? 'mid' : sc >= 2 ? 'low' : sc > 0 ? 'risk' : 'none';
        return '<div class="soc-item-row' + (sc > 0 && sc <= 2 ? ' is-weak' : '') + '">' +
          '<span class="soc-item-label">' + _esc(items[k].label) + '</span>' +
          '<span class="soc-item-score ' + cls + '">' + (sc > 0 ? sc + '점' : '미입력') + '</span>' +
          '</div>';
      }).join('');
      const weak = keys.filter(function (k) {
        const s = Number(flat[PRE + k] || 0); return s > 0 && s <= 2;
      }).map(function (k) { return items[k].label; });
      html += '<div class="soc-item-group" data-domain="' + _esc(did) + '">' +
        '<div class="soc-item-head">' +
          _esc(dom ? (dom.icon + ' ' + did.toUpperCase() + '. ' + dom.label) : did.toUpperCase()) +
          (dom && dom.avg > 0 ? ' <small>평균 ' + dom.avg.toFixed(1) + '점</small>' : '') +
        '</div>' +
        '<div class="soc-item-desc">' + _esc(dom ? dom.desc : '') + '</div>' +
        rows +
        (weak.length
          ? '<div class="soc-item-weak">⚠️ 우선 손볼 항목: ' + weak.map(_esc).join(' · ') + '</div>'
          : '<div class="soc-item-ok">✅ 이 영역에 2점 이하 항목이 없습니다.</div>') +
        '</div>';
    });
    return html;
  }

  function _setSoc(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  /* ── ① 한눈에 보기 ── */
  function renderSocialSummary(fd) {
    const doms = _socialDomains(fd);
    const total = _socialTotal(fd);
    const scored = doms.filter(function (d) { return d.avg > 0; });
    const weak3 = scored.slice().sort(function (a, b) { return a.avg - b.avg; }).slice(0, 3);
    const grade = total >= 80 ? '양호' : total >= 60 ? '보통' : total >= 40 ? '주의' : '취약';
    const gcls = total >= 80 ? 'high' : total >= 60 ? 'mid' : total >= 40 ? 'low' : 'risk';
    const urgent = _sortWarn(_socialWarnings(fd).filter(function (w) {
      return w.level === 'CRITICAL' || w.level === 'HIGH';
    }));

    _setSoc('socialSummaryContent',
      '<div class="soc-total-row">' +
        '<div class="soc-total-card ' + gcls + '">' +
          '<div class="soc-total-val">' + total + '<small>/100</small></div>' +
          '<div class="soc-total-lbl">8대 영역 종합 (균등 배점)</div>' +
          '<div class="soc-total-grade ' + gcls + '">' + grade + '</div>' +
        '</div>' +
        '<div class="soc-weak-card">' +
          '<div class="soc-weak-title">먼저 손봐야 할 영역</div>' +
          (weak3.length
            ? weak3.map(function (d, i) {
                return '<div class="soc-weak-item"><span class="soc-weak-rank">' + (i + 1) + '</span>' +
                  _esc((d.icon || '') + ' ' + d.id.toUpperCase() + '. ' + d.label) +
                  '<span class="soc-weak-score">' + d.avg.toFixed(1) + '점</span></div>';
              }).join('')
            : '<div class="soc-empty">진단 점수가 입력되지 않았습니다.</div>') +
        '</div>' +
      '</div>' +
      '<div class="soc-note">※ 8개 영역은 균등 배점이며 SVI(사회적가치지표) 예상 점수가 아닙니다. ' +
        '한국사회적기업진흥원의 실제 SVI 배점과 다릅니다.</div>' +
      (urgent.length
        ? '<div class="soc-urgent"><div class="soc-urgent-title">🚨 지금 확인해야 할 사항 ' + urgent.length + '건</div>' +
          urgent.map(function (w) { return _warnCard(w); }).join('') + '</div>'
        : '<div class="soc-ok-box">✅ 즉시 조치가 필요한 CRITICAL·HIGH 경고는 없습니다.</div>'));
  }

  /* ── ② 우리 조직 현재 상태 (S1~S8 전 영역) ── */
  function renderSocialStatus(fd) {
    const doms = _socialDomains(fd);
    const explain = _socialExplain(fd);
    _setSoc('socialStatusContent',
      '<p class="soc-lead">진단한 8개 영역의 현재 점수입니다. 5점이 최고, 1점이 최저입니다.</p>' +
      '<div class="soc-bars">' + doms.map(_socBar).join('') + '</div>' +
      '<div class="soc-guide">' + doms.map(function (d) {
        if (d.avg === 0) return '';
        const info = explain[d.id] || {};
        const isLow = d.avg < 3.0;
        const cls = d.avg >= 4 ? 'guide-high' : d.avg >= 3 ? 'guide-ok' : 'guide-low';
        const icon = d.avg >= 4 ? '✅' : d.avg >= 3 ? '📊' : '⚠️';
        return '<div class="soc-guide-item ' + cls + '" data-domain="' + _esc(d.id) + '">' +
          '<div class="soc-guide-label">' + _esc((info.icon || d.icon || '') + ' ' + d.id.toUpperCase() + '. ' + d.label) +
          ' <small>' + d.avg.toFixed(1) + '점</small></div>' +
          '<div class="soc-guide-what">' + _esc(info.what || d.desc || '') + '</div>' +
          '<div class="soc-guide-msg">' + icon + ' ' + _esc(isLow ? (info.low || '') : (info.high || '')) + '</div>' +
          '</div>';
      }).join('') + '</div>');
  }

  /* ── ③ 미션과 사업이 맞물리나 (S1 + S2) ── */
  function renderSocialMission(fd) {
    const w = _warnsFor(fd, 'mission');
    _setSoc('socialMissionContent',
      '<p class="soc-lead">' +
      (_isVentureFd(fd)
        ? '해결하려는 사회문제가 정관에 명시되어 있는지, 성과를 숫자로 증빙할 수 있는지를 봅니다. 판별 심사에서 사회성 항목의 근거가 되는 영역입니다.'
        : '사회적 미션이 문서에만 있는지, 실제 사업 판단에 쓰이는지를 봅니다. 재인증 심사에서 사회적 목적 실현 여부가 쟁점이 되는 영역입니다.') + '</p>' +
      _socItemTable(fd, _secDomainIds(fd, 'mission')) +
      (w.length ? '<div class="soc-warn-group">' + w.map(function (x) { return _warnCard(x); }).join('') + '</div>' : ''));
  }

  /* ── ④ 어디서 돈이 들어오나 (S3 + S6) ── */
  function renderSocialRevenue(fd) {
    const w = _warnsFor(fd, 'revenue');
    _setSoc('socialRevenueContent',
      '<p class="soc-lead">' +
      (_isVentureFd(fd)
        ? '투자·보증·정부 프로그램 중 어떤 경로를 확보했는지, 12개월 자금 소요를 계산해 두었는지를 봅니다. 자금 계획이 없으면 언제 바닥나는지 알 수 없어 대응할 시간을 확보하지 못합니다.'
        : '매출이 어느 채널에서 나오는지, 한쪽에 쏠려 있지는 않은지를 봅니다. 공공 발주에만 의존하면 발주 기관의 예산이 삭감될 때 매출이 한 번에 끊깁니다.') + '</p>' +
      _socItemTable(fd, _secDomainIds(fd, 'revenue')) +
      (w.length ? '<div class="soc-warn-group">' + w.map(function (x) { return _warnCard(x); }).join('') + '</div>' : ''));
  }

  /* ── ⑤ 수익 구조 점검 (S4) ──
     ⚠ winning_but_losing("수주는 하는데 남는 게 없는" 구조)이 이 화면의 핵심이므로
        문항표보다 앞에 별도 강조 박스로 배치한다 */
  function renderSocialProfit(fd) {
    const w = _warnsFor(fd, 'profit');
    /* 이 섹션의 핵심 경고를 문항표보다 앞에 강조 배치한다 */
    const HEADLINE = _isVentureFd(fd) ? 'tech_social_disconnect' : 'winning_but_losing';
    const HEADLINE_TITLE = _isVentureFd(fd)
      ? '🔬 기술은 있으나 사회문제 해결과의 연결을 설명하지 못하고 있습니다'
      : '💸 수주는 하는데 남는 게 없는 구조일 수 있습니다';
    const key = w.filter(function (x) { return x.code === HEADLINE; });
    const rest = w.filter(function (x) { return x.code !== HEADLINE; });
    _setSoc('socialProfitContent',
      '<p class="soc-lead">' +
      (_isVentureFd(fd)
        ? '기술의 차별성이 문서로 뒷받침되는지, 그 기술이 사회문제 해결에 어떻게 기여하는지 설명할 수 있는지를 봅니다.'
        : '지원금 없이도 버틸 수 있는 구조인지, 사업마다 실제로 남는 게 있는지를 봅니다.') + '</p>' +
      (key.length
        ? '<div class="soc-headline-warn">' +
          '<div class="soc-headline-title">' + HEADLINE_TITLE + '</div>' +
          key.map(function (x) { return _warnCard(x, 'soc-warn-headline'); }).join('') +
          '</div>' : '') +
      _socItemTable(fd, _secDomainIds(fd, 'profit')) +
      (rest.length ? '<div class="soc-warn-group">' + rest.map(function (x) { return _warnCard(x); }).join('') + '</div>' : ''));
  }

  /* ── ⑥ 조직이 버틸 수 있나 (S5 + S8) ── */
  function renderSocialOrg(fd) {
    const w = _warnsFor(fd, 'org');
    _setSoc('socialOrgContent',
      '<p class="soc-lead">' +
      (_isVentureFd(fd)
        ? '대표와 핵심 인력의 역량이 사업과 연결되는지, 한 사람이 빠져도 개발과 의사결정이 이어지는지를 봅니다.'
        : '대표가 자리를 비워도 사업이 굴러가는지, 일한 기록이 조직에 남는지를 봅니다.') + '</p>' +
      _socItemTable(fd, _secDomainIds(fd, 'org')) +
      (w.length ? '<div class="soc-warn-group">' + w.map(function (x) { return _warnCard(x); }).join('') + '</div>' : ''));
  }

  /* ── ⑦ 제도를 제대로 쓰고 있나 (S7) ──
     ⚠ 인증 만료 경고·갱신 절차 안내는 넣지 않는다.
        실무 확인 결과 갱신을 놓쳐 자격을 잃는 사례가 거의 없어 값이 낮다.
        대신 '가지고 있는데 못 쓰고 있는 제도'(활용도)에 집중한다 */
  function renderSocialSystem(fd) {
    const flat = _socialFlatScores(fd);
    const PRE = _orgKeyPrefix(fd);
    const g = function (k) { return Number(flat[PRE + k] || 0); };
    const w = _warnsFor(fd, 'system');

    /* ── 소셜벤처: 판별 준비도 중심 ── */
    if (_isVentureFd(fd)) {
      const screening = g('v7_1');
      const evidence  = g('v7_5');
      const box = screening === 0
        ? '<div class="soc-use-item none"><div class="soc-use-head">판별 준비 — 미응답</div>' +
          '<div class="soc-use-body">소셜벤처 판별 또는 자가진단 이력을 입력하지 않으셨습니다.</div></div>'
        : screening <= 2
        ? '<div class="soc-use-item warn"><div class="soc-use-head">📋 소셜벤처 판별 준비가 되어 있지 않습니다</div>' +
          '<div class="soc-use-body">판별은 <strong>지속 자격이 아니라 지원사업 신청 기준</strong>입니다. ' +
          '기술보증기금 소셜벤처 누리집의 자가진단으로 현재 위치를 먼저 확인하십시오. ' +
          '사회성과 혁신성장성 두 축을 모두 보므로, 어느 쪽이 약한지 알아야 준비 순서를 정할 수 있습니다.</div></div>'
        : '<div class="soc-use-item ok"><div class="soc-use-head">✅ 판별 또는 자가진단 이력이 있습니다</div>' +
          '<div class="soc-use-body">판별 결과를 지원사업 신청서와 투자 자료에 그대로 활용하십시오.</div></div>';

      const gaps = [];
      if (evidence > 0 && evidence <= 2) gaps.push({ n: '증빙자료 사전 정리', d: '정관·특허·투자·협약 자료가 흩어져 있으면 공고 기간이 짧을 때 신청 자체를 못 합니다. 항목별로 한곳에 모아 두십시오.' });
      if (g('v7_3') > 0 && g('v7_3') <= 2) gaps.push({ n: '소셜벤처 지원사업', d: '소셜벤처를 대상으로 하는 지원사업에 신청한 이력이 없습니다. 단계에 맞는 공고부터 확인하십시오.' });
      if (g('v7_4') > 0 && g('v7_4') <= 2) gaps.push({ n: '중간지원조직 연결', d: '소셜벤처스퀘어 등 중간지원조직을 통해 컨설팅·네트워킹·공고 정보를 받을 수 있습니다.' });
      if (g('v7_2') > 0 && g('v7_2') <= 2) gaps.push({ n: '벤처기업·이노비즈 등 인증', d: '다른 인증을 함께 보유하면 지원사업·조달에서 활용 범위가 넓어집니다. 요건부터 확인하십시오.' });
      if (g('v5_3') > 0 && g('v5_3') <= 2) gaps.push({ n: '기술보증기금 보증 상담', d: '소셜벤처는 기술보증 트랙에서 우대를 받는 경우가 있습니다. 자격 여부를 상담으로 확인하십시오.' });

      _setSoc('socialSystemContent',
        '<p class="soc-lead">판별을 받았는지가 아니라, <strong>신청 전에 갖춰야 할 것을 갖췄는지</strong>를 봅니다. ' +
        '소셜벤처 판별은 특별법상 지속 자격이 아니므로 만료·갱신을 걱정할 필요가 없습니다.</p>' +
        '<div class="soc-use-list">' + box + '</div>' +
        '<div class="soc-sub-title">신청 전에 채워야 할 것</div>' +
        (gaps.length
          ? '<div class="soc-use-list">' + gaps.map(function (u) {
              return '<div class="soc-use-item warn"><div class="soc-use-head">🔓 ' + _esc(u.n) + '</div>' +
                '<div class="soc-use-body">' + _esc(u.d) + '</div></div>';
            }).join('') + '</div>'
          : '<div class="soc-ok-box">✅ 진단 응답 기준으로 뚜렷하게 비어 있는 항목은 확인되지 않았습니다.</div>') +
        _socItemTable(fd, _secDomainIds(fd, 'system')) +
        (w.length ? '<div class="soc-warn-group">' + w.map(function (x) { return _warnCard(x); }).join('') + '</div>' : ''));
      return;
    }

    const svi = g('s7_2');
    const sviBox = svi === 0
      ? '<div class="soc-use-item none"><div class="soc-use-head">SVI 측정 — 미응답</div>' +
        '<div class="soc-use-body">사회적가치지표(SVI) 측정 여부를 입력하지 않으셨습니다.</div></div>'
      : svi <= 2
      ? '<div class="soc-use-item warn"><div class="soc-use-head">📉 SVI 측정 이력이 없습니다</div>' +
        '<div class="soc-use-body">사회적가치지표(SVI)는 다수 지원사업의 <strong>가점 항목이자 자격요건</strong>입니다. ' +
        '측정 이력이 없으면 심사에서 불리하게 작용하며 성과를 증빙할 수단도 없습니다. ' +
        '한국사회적기업진흥원의 자가진단 도구로 1회 측정해 두는 것부터 시작하십시오.</div></div>'
      : '<div class="soc-use-item ok"><div class="soc-use-head">✅ SVI 측정 이력이 있습니다</div>' +
        '<div class="soc-use-body">측정 결과를 지원사업 신청서와 재인증 자료에 그대로 활용하십시오. ' +
        '연도별로 누적하면 성과 추이 자체가 증빙이 됩니다.</div></div>';

    // 보유 자격 대비 활용하지 못하는 제도
    const unused = [];
    if (g('s3_4') > 0 && g('s3_4') <= 2) unused.push({ n: '공공기관 우선구매', d: '사회적기업 인증이 있으면 공공기관 우선구매 대상입니다. 자격이 있는데 활용하지 못하고 있습니다.' });
    if (g('s3_3') > 0 && g('s3_3') <= 2) unused.push({ n: '조달 채널 등록 (나라장터 · e-store36.5)', d: '등록하지 않으면 우선구매 제도가 있어도 발주 기관이 찾을 수 없습니다.' });
    if (g('s7_3') > 0 && g('s7_3') <= 2) unused.push({ n: '중간지원조직 · 지원사업 연결', d: '권역별 통합지원기관을 통해 컨설팅·판로·자금 정보를 받을 수 있습니다. 연결이 약합니다.' });
    if (g('s7_5') > 0 && g('s7_5') <= 2) unused.push({ n: '지배구조 투명성 (세제·조달 심사 반영)', d: '의사결정·회계 기록이 남아 있어야 세제 감면과 조달 심사에서 소명이 가능합니다.' });

    const cert = g('s7_1');
    const nextStep = cert === 0
      ? '인증 상태를 입력하지 않으셨습니다. 현재 지위(예비 / 인증 / 미지정)를 확인해 주십시오.'
      : cert <= 2
      ? '현재 인증 관리 수준이 낮습니다. 다음 단계를 검토하기 전에 지금 지위의 요건 충족 여부부터 정리하십시오.'
      : '지금 지위가 안정적이라면 다음 단계를 검토할 시점입니다 — 예비사회적기업이면 <strong>인증사회적기업 전환</strong>, ' +
        '협동조합이면 <strong>사회적협동조합 전환</strong>을 통해 적용받는 제도의 범위가 넓어집니다.';

    _setSoc('socialSystemContent',
      '<p class="soc-lead">인증을 가지고 있는지가 아니라, <strong>가지고 있는 제도를 실제로 쓰고 있는지</strong>를 봅니다.</p>' +
      '<div class="soc-use-list">' + sviBox + '</div>' +
      '<div class="soc-sub-title">활용하지 못하고 있는 제도</div>' +
      (unused.length
        ? '<div class="soc-use-list">' + unused.map(function (u) {
            return '<div class="soc-use-item warn"><div class="soc-use-head">🔓 ' + _esc(u.n) + '</div>' +
              '<div class="soc-use-body">' + _esc(u.d) + '</div></div>';
          }).join('') + '</div>'
        : '<div class="soc-ok-box">✅ 진단 응답 기준으로 뚜렷하게 놓치고 있는 제도는 확인되지 않았습니다.</div>') +
      '<div class="soc-sub-title">다음 단계 검토</div>' +
      '<div class="soc-next-step">' + nextStep + '</div>' +
      _socItemTable(fd, _secDomainIds(fd, 'system')) +
      (w.length ? '<div class="soc-warn-group">' + w.map(function (x) { return _warnCard(x); }).join('') + '</div>' : ''));
  }

  /* ── AI 실행 계획 상태 ──
     'loading' | 'done' | 'error'. renderSocialPlan()이 갱신하고 renderSocialAction()이 읽는다.
     ⚠ 사용자가 diag-reveal에 머무는 동안 백그라운드로 AI가 돌기 때문에,
        대시보드 진입 시점의 상태가 셋 중 무엇이든 정상 렌더링되어야 한다 */
  let _socialPlanState = 'loading';
  let _socialPlan = null;

  /* AI 실행 계획 상태 갱신 — 섹션이 아직 화면에 없어도 상태만 저장하고 조용히 지나간다 */
  function renderSocialPlan(state, plan) {
    _socialPlanState = state || 'loading';
    _socialPlan = (state === 'done') ? (plan || null) : null;
    if (document.getElementById('socialActionContent')) {
      try { renderSocialAction(_lastFd); } catch (e) { console.error('renderSocialAction:', e); }
    }
  }

  /* AI 실행 계획 블록 — priority / plan90 / cautions */
  function _socialPlanHtml() {
    if (_socialPlanState === 'loading') {
      return '<div class="soc-plan-loading">' +
        '<span class="soc-spinner"></span>' +
        '<div><strong>AI가 실행 계획을 작성하고 있습니다.</strong><br>' +
        '<small>우선순위 과제와 90일 실행 계획을 준비 중입니다. 위 진단 결과는 지금 바로 확인하실 수 있습니다.</small></div>' +
        '</div>';
    }
    if (_socialPlanState === 'error') {
      return '<div class="soc-plan-error">' +
        '<div class="soc-plan-error-title">⚠️ AI 실행 계획 생성에 실패했습니다</div>' +
        '<div class="soc-plan-error-body">위 진단 결과와 다른 섹션은 정상적으로 확인하실 수 있습니다. ' +
        '실행 계획만 다시 생성할 수 있습니다.</div>' +
        '<button class="btn btn-gold btn-sm" onclick="App.retrySocialPlan()">다시 시도</button>' +
        '</div>';
    }

    const p = _socialPlan || {};
    const priority = Array.isArray(p.priority) ? p.priority : [];
    const plan90   = Array.isArray(p.plan90)   ? p.plan90   : [];
    const cautions = Array.isArray(p.cautions) ? p.cautions : [];
    if (!priority.length && !plan90.length && !cautions.length) {
      return '<div class="soc-plan-error">' +
        '<div class="soc-plan-error-title">⚠️ 실행 계획 내용이 비어 있습니다</div>' +
        '<button class="btn btn-gold btn-sm" onclick="App.retrySocialPlan()">다시 시도</button></div>';
    }

    let html = '';

    if (priority.length) {
      html += '<div class="soc-sub-title">먼저 해야 할 일</div><div class="soc-prio-list">' +
        priority.map(function (x, i) {
          const ord = x && x.order ? x.order : (i + 1);
          return '<div class="soc-prio-card">' +
            '<div class="soc-prio-num">' + _esc(ord) + '</div>' +
            '<div class="soc-prio-body">' +
              '<div class="soc-prio-action">' + _esc((x && x.action) || '') + '</div>' +
              ((x && x.why)  ? '<div class="soc-prio-why"><span>왜</span>' + _esc(x.why) + '</div>' : '') +
              ((x && x.how)  ? '<div class="soc-prio-how"><span>어떻게</span>' + _esc(x.how) + '</div>' : '') +
            '</div></div>';
        }).join('') + '</div>';
    }

    /* 90일 계획 — 사용자가 특히 기다리는 내용이므로 눈에 띄게 배치한다 */
    if (plan90.length) {
      html += '<div class="soc-sub-title soc-plan90-title">90일 실행 계획</div><div class="soc-plan90">' +
        plan90.map(function (m, i) {
          const mon = (m && m.month) ? m.month : (i + 1);
          const tasks = (m && Array.isArray(m.tasks)) ? m.tasks : [];
          return '<div class="soc-month">' +
            '<div class="soc-month-head"><span class="soc-month-num">' + _esc(mon) + '</span>개월차</div>' +
            '<div class="soc-month-focus">' + _esc((m && m.focus) || '') + '</div>' +
            (tasks.length
              ? '<ul class="soc-month-tasks">' + tasks.map(function (t) { return '<li>' + _esc(t) + '</li>'; }).join('') + '</ul>'
              : '') +
            '</div>';
        }).join('') + '</div>';
    }

    if (cautions.length) {
      html += '<div class="soc-caution-box"><div class="soc-caution-title">⚠️ 실행할 때 주의할 점</div><ul>' +
        cautions.map(function (c) { return '<li>' + _esc(c) + '</li>'; }).join('') + '</ul></div>';
    }

    return html;
  }

  /* ── ⑧ 무엇부터 할 것인가 — 진단 경고(즉시) + AI 실행 계획(비동기) ── */
  function renderSocialAction(fd) {
    const all = _sortWarn(_socialWarnings(fd));
    const LEVEL_LABEL = { CRITICAL: '지금 바로', HIGH: '이번 달 안에', MEDIUM: '분기 안에' };
    let html = '<p class="soc-lead">진단 결과에서 발견된 사항을 시급한 순서로 정리했습니다.</p>';
    if (!all.length) {
      html += '<div class="soc-ok-box">✅ 교차 진단에서 발견된 경고가 없습니다. 점수가 낮은 영역의 처방을 순서대로 진행하십시오.</div>';
    } else {
      ['CRITICAL', 'HIGH', 'MEDIUM'].forEach(function (lv) {
        const list = all.filter(function (w) { return w.level === lv; });
        if (!list.length) return;
        html += '<div class="soc-action-group soc-action-' + lv.toLowerCase() + '">' +
          '<div class="soc-action-head">' + LEVEL_LABEL[lv] + ' <small>' + lv + ' · ' + list.length + '건</small></div>' +
          list.map(function (w) { return _warnCard(w); }).join('') + '</div>';
      });
    }
    html += _socialPlanHtml();
    _setSoc('socialActionContent', html);
  }

  /* ── 사회적경제 전용 렌더 진입점 ──
     ⚠ render(data, fd, isDemo)를 재사용하지 않는다 — 그쪽은 AI 결과(executiveSummary·swot 등)를
        DOM에 직접 밀어넣으므로 AI 데이터가 없는 1차에서는 깨진다.
        renderFunding()과 동일한 keep 화이트리스트 패턴을 쓴다 */
  function renderSocial(fd) {
    _lastFd = fd || {};
    buildNav(false, false, true);

    const keep = SOCIAL_ONLY_SECTIONS.concat(['sec-gov']);
    document.querySelectorAll('#dashboard .report-content .section-card').forEach(function (el) {
      el.style.display = keep.indexOf(el.id) >= 0 ? '' : 'none';
    });

    const ORG_LABEL = { social_enterprise: '사회적기업', cooperative: '협동조합·마을기업', social_venture: '소셜벤처' };
    const orgLabel = ORG_LABEL[(fd && fd.orgType)] || '사회적경제 조직';
    const isVenture = _isVentureFd(fd);

    /* 섹션 제목·배지도 조직 형태에 맞춘다 (구조는 9섹션 그대로) */
    const SEC_TITLE = {
      'sec-social-revenue': isVenture
        ? { t: '자금을 어떻게 조달하나', b: 'V5 · V4' } : { t: '어디서 돈이 들어오나', b: 'S3 · S6' },
      'sec-social-system': isVenture
        ? { t: '판별과 제도를 활용하고 있나', b: 'V7' } : { t: '제도를 제대로 쓰고 있나', b: 'S7' },
      'sec-social-mission': isVenture
        ? { t: '사회문제를 제대로 정의했나', b: 'V1 · V2' } : { t: '미션과 사업이 맞물리나', b: 'S1 · S2' },
      'sec-social-profit': isVenture
        ? { t: '기술이 무기가 되고 있나', b: 'V3' } : { t: '수익 구조 점검', b: 'S4' },
      'sec-social-org': isVenture
        ? { t: '팀이 버틸 수 있나', b: 'V6 · V8' } : { t: '조직이 버틸 수 있나', b: 'S5 · S8' },
    };
    Object.keys(SEC_TITLE).forEach(function (id) {
      const sec = document.getElementById(id);
      if (!sec) return;
      const h = sec.querySelector('.sec-title h3');
      const bd = sec.querySelector('.sec-title .badge');
      if (h)  h.textContent  = SEC_TITLE[id].t;
      if (bd) bd.textContent = SEC_TITLE[id].b;
    });

    const title = document.getElementById('dTitle');
    if (title) title.textContent = ((fd && fd.companyName) || '조직') + ' ' + orgLabel + ' 진단 리포트';
    const dateStr = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    const sub = document.getElementById('dSub');
    if (sub) {
      sub.innerHTML = '진단일: ' + dateStr +
        ' &nbsp;<span class="mode-badge-inline">🤝 ' + _esc(orgLabel) + ' 모드</span>' +
        '&nbsp;<span class="real-badge-inline">📋 8대 영역 자가진단</span>';
    }
    const demoBadge = document.getElementById('demoBadge');
    if (demoBadge) demoBadge.classList.add('hidden');

    try { renderSocialSummary(fd); } catch (e) { console.error('renderSocialSummary:', e); }
    try { renderSocialStatus(fd);  } catch (e) { console.error('renderSocialStatus:', e); }
    try { renderSocialMission(fd); } catch (e) { console.error('renderSocialMission:', e); }
    try { renderSocialRevenue(fd); } catch (e) { console.error('renderSocialRevenue:', e); }
    try { renderSocialProfit(fd);  } catch (e) { console.error('renderSocialProfit:', e); }
    try { renderSocialOrg(fd);     } catch (e) { console.error('renderSocialOrg:', e); }
    try { renderSocialSystem(fd);  } catch (e) { console.error('renderSocialSystem:', e); }
    try { renderSocialAction(fd);  } catch (e) { console.error('renderSocialAction:', e); }
    try { renderGovSection(fd);    } catch (e) { console.error('renderGovSection:', e); }
  }

  // ── 동적 목차 네비게이션 생성 ─────────────────────────────────
  function buildNav(isMicro, isFunding, isSocial) {
    const nav = document.getElementById('reportNav');
    if (!nav) return;
    // 섹션 구조(9개)는 그대로 두고 라벨만 조직 형태에 맞춘다
    const isVenture = isSocial && _isVentureFd(_lastFd);

    /* 사회적경제 조직 — 전용 8섹션 + 기존 sec-gov 재사용.
       목차 라벨은 프레임워크 이름 대신 사장님이 읽는 말로 쓴다.
       ⚠ 기존 isFunding / isMicro / sme 분기는 건드리지 않는다 */
    const links = isSocial ? [
      { href: 'sec-social-summary', label: '한눈에 보기' },
      { href: 'sec-social-status',  label: '우리 조직 현재 상태' },
      { href: 'sec-social-mission', label: '미션과 사업이 맞물리나' },
      { href: 'sec-social-revenue', label: isVenture ? '자금을 어떻게 조달하나' : '어디서 돈이 들어오나' },
      { href: 'sec-social-profit',  label: '수익 구조 점검' },
      { href: 'sec-social-org',     label: '조직이 버틸 수 있나' },
      { href: 'sec-social-system',  label: isVenture ? '판별과 제도를 활용하고 있나' : '제도를 제대로 쓰고 있나' },
      { href: 'sec-social-action',  label: '무엇부터 할 것인가' },
      { href: 'sec-gov',            label: '정부지원사업' },
    ] : isFunding ? [
      { href: 'sec-funding-summary', label: '판정 요약' },
      { href: 'sec-funding-agency',  label: '기관별 상세' },
      { href: 'sec-funding-roadmap', label: '실행 로드맵' },
      { href: 'sec-funding-docs',    label: '준비 서류' },
      { href: 'sec-gov',             label: '지원사업 매칭' },
    ] : isMicro ? [
      /* 라벨만 쉬운 말로 교체 — href(섹션 id)·순서·내용은 미변경 */
      { href: 'sec-summary',       label: '한눈에 보기' },
      { href: 'sec-lifecycle',     label: '우리 가게 지금 단계' },
      { href: 'sec-market-micro',  label: '우리 동네 손님과 시장' },
      { href: 'sec-diag',          label: '경영 진단' },
      { href: 'sec-six-systems',   label: '영역별 처방' },
      { href: 'sec-plan90',        label: '90일 실행 계획' },
      { href: 'sec-gov',           label: '정부지원사업' },
    ] : [
      { href: 'sec-summary',      label: 'Executive Summary' },
      { href: 'sec-diag',         label: '경영 진단' },
      { href: 'sec-consulting',   label: '유형별 특화 분석' },
      { href: 'sec-swot',         label: 'SWOT 분석' },
      { href: 'sec-stp',          label: 'STP 분석' },
      { href: 'sec-4p',           label: '4P 마케팅' },
      { href: 'sec-strategy',     label: '핵심 전략' },
      { href: 'sec-kpi',          label: 'KPI 지표' },
      { href: 'sec-roadmap',      label: '실행 로드맵' },
      { href: 'sec-lean-canvas',  label: '린 캔버스' },
      { href: 'sec-six-systems',  label: '6가지 시스템' },
      { href: 'sec-plan90',       label: '90일 플랜' },
      { href: 'sec-gov',          label: '정부지원사업' },
    ];

    nav.innerHTML = '<div class="report-nav-title">목차</div>' +
      links.map((l, i) =>
        `<a href="#${l.href}" class="nav-link${i === 0 ? ' active' : ''}"><span class="nav-dot"></span>${l.label}</a>`
      ).join('');

    // 클릭 이벤트 바인딩
    nav.querySelectorAll('.nav-link').forEach(a => {
      a.onclick = (e) => {
        e.preventDefault();
        const target = document.getElementById(a.getAttribute('href').slice(1));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
    });
  }

  // ── 6가지 시스템 섹션 렌더링 ─────────────────────────────────
  function renderSixSystems(data) {
    const section = document.getElementById('sec-six-systems');
    const grid    = document.getElementById('sixSysGrid');
    if (!section || !grid) return;

    const systems = data.sixSystems;
    if (!systems || systems.length === 0) { section.style.display = 'none'; return; }
    section.style.display = '';

    const statusCls = s =>
      s === '강점' ? 'sys-status-strong' :
      s === '보통' ? 'sys-status-ok' : 'sys-status-weak';
    const statusIcon = s =>
      s === '강점' ? '💪' : s === '보통' ? '⚡' : '⚠️';

    grid.innerHTML = systems.map(sys => `
      <div class="sys-card">
        <div class="sys-card-header">
          <span class="sys-icon">${sys.icon || ''}</span>
          <span class="sys-name">${sys.name}</span>
          <span class="sys-status ${statusCls(sys.status)}">${statusIcon(sys.status)} ${sys.status}</span>
        </div>
        <div class="sys-issue">${(sys.issue || '').replace(/\n/g, '<br>')}</div>
        <div class="sys-actions-title">즉시 실행 액션</div>
        <ol class="sys-actions">
          ${(sys.actions || []).map(a => `<li>${a}</li>`).join('')}
        </ol>
        ${sys.resource ? `<div class="sys-resource">📌 ${sys.resource}</div>` : ''}
      </div>`).join('');
  }

  // ── 90일 실행 플랜 섹션 렌더링 ───────────────────────────────
  function renderPlan90(data) {
    const section  = document.getElementById('sec-plan90');
    const timeline = document.getElementById('plan90Timeline');
    if (!section || !timeline) return;

    const plan = data.plan90days;
    if (!plan || plan.length === 0) { section.style.display = 'none'; return; }
    section.style.display = '';

    timeline.innerHTML = plan.map((month, i) => `
      <div class="plan90-month">
        <div class="plan90-num-wrap">
          <span class="plan90-num">${i + 1}</span>
        </div>
        <div class="plan90-body">
          <div class="plan90-month-top">
            <span class="plan90-month-label">${month.month}</span>
            <span class="plan90-theme">${month.theme || ''}</span>
          </div>
          <div class="plan90-goal">🎯 <strong>이달 목표:</strong> ${month.goal || ''}</div>
          <div class="plan90-actions-title">핵심 실행 과제</div>
          <ul class="plan90-actions">
            ${(month.actions || []).map(a => `<li>${a}</li>`).join('')}
          </ul>
          <div class="plan90-meta">
            ${month.expectedResult ? `<div class="plan90-result">✅ <strong>기대 효과:</strong> ${month.expectedResult}</div>` : ''}
            ${month.govSupport    ? `<div class="plan90-gov">🏛️ <strong>활용 지원사업:</strong> ${month.govSupport}</div>` : ''}
          </div>
        </div>
      </div>`).join('');
  }

  function renderGovSection(fd) {
    const section = document.getElementById('sec-gov');
    const grid    = document.getElementById('govGrid');
    if (!section || !grid) return;

    if (typeof GovSupport === 'undefined') { section.style.display = 'none'; return; }

    const matched = GovSupport.match(fd);
    if (matched.length === 0) { section.style.display = 'none'; return; }

    section.style.display = '';
    // 고지 문구 — 섹션 상단 1회만 (카드마다 반복하지 않는다). 상시 지원사업 전용
    const disc = document.getElementById('govDisclaimer');
    if (disc) disc.textContent = GovSupport.DISCLAIMER || '';
    grid.innerHTML = matched.map(p => `
      <div class="gov-card">
        <div class="gov-card-header">
          <span class="gov-org">${p.org}</span>
          <span class="gov-score-badge">매칭 ${p.score}점</span>
        </div>
        <div class="gov-name">${p.name}</div>
        <div class="gov-support">🎁 ${p.supportType || '지원 형태 확인 필요'}</div>
        <div class="gov-summary">${p.summary}</div>
        <a class="gov-link" href="${p.url}" target="_blank" rel="noopener">신청 정보 보기 →</a>
      </div>`).join('');
  }

  function renderDiagSection(fd) {
    const section = document.getElementById('sec-diag');
    if (!section) return;
    const diagScores = fd && fd.diagScores;
    const hasScores = diagScores && Object.keys(diagScores).filter(k => diagScores[k].score > 0).length > 0;
    if (!hasScores) { section.style.display = 'none'; return; }
    section.style.display = '';

    const scores = AIEngine.calcDiagScores(diagScores);
    if (!scores) return;
    renderRadar(scores);
    renderWeakAreas(scores);
  }

  function renderRadar(scores) {
    const ctx = document.getElementById('radarChart');
    if (!ctx || typeof Chart === 'undefined') return;
    if (_radarChart) { _radarChart.destroy(); _radarChart = null; }

    const labels = [];
    const data   = [];

    // 공통 4개 영역
    if (scores.common) {
      ['area_1','area_2','area_3','area_4'].forEach(id => {
        if (scores.common.areas[id] !== undefined) {
          labels.push(COMMON_AREA_LABELS[id]);
          data.push(scores.common.areas[id]);
        }
      });
    }
    if (scores.industry) { labels.push('업종특화'); data.push(scores.industry.avg); }
    if (scores.bizmodel) { labels.push('사업모델'); data.push(scores.bizmodel.avg); }
    if (labels.length < 3) return;

    _radarChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels,
        datasets: [{
          label: '진단 점수',
          data,
          backgroundColor: 'rgba(245,192,48,0.12)',
          borderColor:      'rgba(245,192,48,0.85)',
          borderWidth: 2,
          pointBackgroundColor: data.map(v => v < 2 ? '#F87171' : v < 3 ? '#FB923C' : v >= 4 ? '#4ADE80' : '#F5C030'),
          pointRadius: 5,
          pointHoverRadius: 7,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          r: {
            min: 0, max: 5,
            ticks: { stepSize: 1, color: 'rgba(232,237,245,0.35)', font: { size: 9 }, backdropColor: 'transparent' },
            grid:        { color: 'rgba(255,255,255,0.07)' },
            angleLines:  { color: 'rgba(255,255,255,0.07)' },
            pointLabels: { color: 'rgba(232,237,245,0.85)', font: { size: 11, weight: '600' } },
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15,22,41,0.95)',
            borderColor: 'rgba(245,192,48,0.3)',
            borderWidth: 1,
            callbacks: {
              label: ctx => ` ${ctx.raw}점 (${scoreLabel(ctx.raw)})`
            }
          }
        }
      }
    });
  }

  const AREA_INSIGHTS = {
    '재무건전성': {
      high: '매출 대비 수익률이 안정적입니다. 현재 원가 관리 수준을 유지하면서 잉여 수익을 성장 투자에 단계적으로 배분하세요.',
      ok:   '재무 구조는 안정적이나 개선 여지가 있습니다. 월간 손익 리뷰를 정례화하고 고정비 구조를 점검하면 이익률을 높일 수 있습니다.',
      low:  '매출 대비 이익이 낮거나 현금흐름이 불안정합니다. 손익분기점(BEP)을 명확히 파악하고, 비효율 지출을 정리하는 것이 최우선 과제입니다.'
    },
    '조직·인력': {
      high: '인력 구조가 안정적입니다. 핵심 직원 이탈 방지를 위한 인센티브 체계와 권한 위임으로 대표 의존도를 지속적으로 낮추세요.',
      ok:   '조직 운영은 양호하나, 대표 부재 시에도 운영이 가능한 업무 매뉴얼화가 필요합니다. 핵심 업무 3가지를 표준화하는 것부터 시작하세요.',
      low:  '대표자 1인 의존도가 높거나 인력 역량 개발이 부족합니다. 핵심 업무 매뉴얼화와 단계적 권한 위임이 사업 성장의 전제 조건입니다.'
    },
    '고객·매출': {
      high: '고객 유입과 재방문 구조가 탄탄합니다. 특정 채널 또는 단골에 대한 의존도를 확인하고, 채널 다각화로 리스크를 분산하세요.',
      ok:   '고객 획득은 되고 있으나 재구매율 향상의 여지가 있습니다. 기존 고객 관리(문자·SNS·멤버십) 체계 강화를 우선 추진하세요.',
      low:  '신규 고객 유입이 제한적이거나 특정 고객에 매출이 집중되어 있습니다. 즉각 고객 확보 채널(SNS·지역 커뮤니티·협력 네트워크)을 다각화하세요.'
    },
    '경영역량': {
      high: '의사결정과 경영 정보 관리가 잘 되고 있습니다. 데이터 기반 의사결정을 더욱 정교화하고 KPI 모니터링 체계를 갖추세요.',
      ok:   '경영 역량은 보통 수준입니다. 월간 목표를 숫자로 설정하고, 주간 점검 루틴을 도입하면 실행력이 눈에 띄게 향상됩니다.',
      low:  '경영 계획이나 의사결정 체계가 미흡합니다. 핵심 지표 3개(매출·고객수·이익률)부터 매주 기록하는 습관을 만드세요.'
    },
    '업종특화 종합': {
      high: '업종 핵심 역량이 강점입니다. 이 경쟁력을 마케팅 메시지에 더 적극적으로 담아 신규 고객에게 전달하세요.',
      ok:   '업종 역량은 평균 수준입니다. 경쟁사 대비 귀사만의 차별점을 발굴하고, 이를 고객과의 접점에서 명확히 전달하세요.',
      low:  '업종 핵심 역량에 취약점이 있습니다. 경쟁사가 갖추고 있는 기본 역량부터 체계적으로 강화해 나가는 로드맵이 필요합니다.'
    },
    '사업모델 종합': {
      high: '수익 모델이 안정적으로 작동하고 있습니다. 반복 수익(재계약·구독·단골) 비중을 높여 매출 예측 가능성을 더욱 강화하세요.',
      ok:   '수익 모델은 작동하고 있으나 다각화 여지가 있습니다. 기존 고객에게 추가 상품·서비스를 제안하는 업셀링을 검토해보세요.',
      low:  '현재 수익 모델이 단순하거나 지속성이 낮습니다. 고객 1명당 생애 가치(LTV)를 높이는 구조(재구매·패키지·멤버십)로의 전환이 필요합니다.'
    }
  };

  function _getAreaInsight(label, score) {
    const tbl = AREA_INSIGHTS[label] || {};
    if (score >= 4.0) return tbl.high || '';
    if (score >= 3.0) return tbl.ok  || '';
    return tbl.low || '';
  }

  function renderWeakAreas(scores) {
    const banner = document.getElementById('weakBanner');
    if (!banner) return;

    const allAreas = [];
    if (scores.common) {
      ['area_1','area_2','area_3','area_4'].forEach(id => {
        if (scores.common.areas[id] !== undefined)
          allAreas.push({ label: COMMON_AREA_LABELS[id], score: scores.common.areas[id] });
      });
    }
    if (scores.industry) allAreas.push({ label: '업종특화 종합', score: scores.industry.avg });
    if (scores.bizmodel) allAreas.push({ label: '사업모델 종합', score: scores.bizmodel.avg });

    const sorted = [...allAreas].sort((a, b) => a.score - b.score);
    const weakAreas   = sorted.filter(a => a.score < 3.0);
    const strongAreas = sorted.filter(a => a.score >= 4.0).reverse();

    // 전체 점수 pill
    let html = '<div class="diag-score-pills">';
    allAreas.forEach(a => {
      const cls  = a.score >= 4 ? 'pill-strong' : a.score >= 3 ? 'pill-ok' : a.score >= 2 ? 'pill-weak' : 'pill-danger';
      const icon = a.score >= 4 ? '💪' : a.score >= 3 ? '✅' : a.score >= 2 ? '⚠️' : '🔴';
      html += `<span class="diag-pill ${cls}">${icon} ${a.label}<em>${a.score}점</em></span>`;
    });
    html += '</div>';

    // 취약/위험 경고
    if (weakAreas.length > 0) {
      html += '<div class="diag-alerts">';
      html += '<div class="diag-alerts-title">⚠️ 개선 필요 영역 — AI 전략에 우선 반영됨</div>';
      weakAreas.forEach(a => {
        const isDanger = a.score < 2;
        html += `<div class="diag-alert-row ${isDanger ? 'alert-danger' : 'alert-warn'}">
          <span class="alert-icon">${isDanger ? '🔴' : '🟠'}</span>
          <span class="alert-area-name">${a.label}</span>
          <span class="alert-score-val">${a.score}점</span>
          <span class="alert-msg-txt">${isDanger ? '즉각 개선 필요' : '단기 개선 권고'}</span>
        </div>`;
      });
      html += '</div>';
    }

    // 강점 영역
    if (strongAreas.length > 0) {
      html += '<div class="diag-strong-pills"><span class="diag-strong-label">💪 핵심 강점</span>';
      strongAreas.forEach(a => {
        html += `<span class="diag-pill pill-strong">⭐ ${a.label} <em>${a.score}점</em></span>`;
      });
      html += '</div>';
    }

    // 영역별 상세 분석 카드
    html += '<div class="diag-area-cards">';
    allAreas.forEach(a => {
      const cls    = a.score >= 4 ? 'acard-high' : a.score >= 3 ? 'acard-ok' : 'acard-low';
      const bar    = Math.round((a.score / 5) * 100);
      const lbl    = a.score >= 4 ? '강점' : a.score >= 3 ? '보통' : a.score >= 2 ? '취약' : '위험';
      const clrCls = a.score >= 4 ? 'high' : a.score >= 3 ? 'mid' : a.score >= 2 ? 'low' : 'risk';
      const insight = _getAreaInsight(a.label, a.score);
      html += `<div class="diag-area-card ${cls}">
        <div class="dac-header">
          <span class="dac-label">${a.label}</span>
          <span class="dac-score dr-score-val ${clrCls}">${a.score.toFixed(1)}점 <small>${lbl}</small></span>
        </div>
        <div class="dac-bar-wrap"><div class="dac-bar ${clrCls}" style="width:${bar}%"></div></div>
        ${insight ? `<p class="dac-insight">${insight}</p>` : ''}
      </div>`;
    });
    html += '</div>';

    banner.innerHTML = html;
  }

  let _lastFd = {};

  function render(data, fd, isDemo) {
    _lastFd = fd || {};

    /* 사회적경제 조직 — 전용 리포트로 분기하고 여기서 끝낸다.
       ⚠ 아래 코드는 AI 결과(executiveSummary·swot 등)를 DOM에 직접 밀어넣으므로
          1차(AI 미연결) 상태로 진입하면 깨진다. 기존 micro/sme 경로는 손대지 않는다 */
    if (_isSocialFd(fd)) { renderSocial(fd); return; }

    const isMicro = fd.bizScale === 'micro';

    // 동적 목차 생성
    buildNav(isMicro);

    // SME 전용 섹션 — micro 모드에서 숨김
    const smeOnly = ['sec-consulting','sec-swot','sec-stp','sec-4p','sec-strategy','sec-kpi','sec-roadmap','sec-lean-canvas'];
    smeOnly.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = isMicro ? 'none' : '';
    });

    // micro 전용 섹션 — SME 모드에서 숨김 (렌더 함수가 세부 표시 제어)
    ['sec-lifecycle', 'sec-market-micro'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = isMicro ? '' : 'none';
    });

    // 사회적경제 전용 섹션 — 일반 경영진단 모드에서는 항상 숨김 (재진입 시 잔상 방지)
    SOCIAL_ONLY_SECTIONS.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    // 정책자금 전용 섹션 — 경영진단 모드에서는 항상 숨김
    FUNDING_ONLY_SECTIONS.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    // sec-six-systems 제목 micro vs SME
    const sixSysTitle = document.querySelector('#sec-six-systems .sec-title h3');
    if (sixSysTitle) sixSysTitle.textContent = isMicro ? '7대 영역 처방 (D1~D7)' : '도널드 밀러 6가지 비즈니스 시스템';
    const sixSysBadge = document.querySelector('#sec-six-systems .badge');
    if (sixSysBadge) sixSysBadge.textContent = isMicro ? '소상공인 7대 처방' : '사업 체질 개선';
    const sixSysIntro = document.querySelector('#sec-six-systems .six-sys-intro');
    if (sixSysIntro) sixSysIntro.textContent = isMicro
      ? '소상공인 7대 영역(D1~D7) 진단 결과에 따른 맞춤 처방입니다. 각 영역별 현재 상태와 즉시 실행 가능한 개선 액션을 제시합니다.'
      : '건강한 사업체는 6가지 핵심 시스템이 유기적으로 작동합니다. 각 시스템의 현재 상태를 진단하고, 즉시 실행 가능한 개선 액션을 제시합니다.';

    document.getElementById('dTitle').textContent = (fd.companyName || '기업') + ' 경영전략 분석 리포트';
    const dateStr = new Date().toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric' });
    const modeBadge = isMicro ? '🏪 소상공인 모드' : '🏢 소기업·중소기업 모드';
    const badgeCls = isDemo ? 'demo-badge-inline' : 'real-badge-inline';
    const badgeTxt = isDemo ? '📊 DEMO DATA' : '🤖 AI 분석';
    document.getElementById('dSub').innerHTML =
      '분석일: ' + dateStr + ' &nbsp;<span class="mode-badge-inline">' + modeBadge + '</span>&nbsp;<span class="' + badgeCls + '">' + badgeTxt + '</span>';
    document.getElementById('demoBadge').classList.add('hidden');

    // Executive Summary — [소제목] 단락 구조 렌더링
    const rawSummary = (data.executiveSummary || '').trim();
    let execHtml;
    if (rawSummary.includes('[')) {
      const parts = rawSummary.split(/(?=\[)/);
      execHtml = parts.map(part => {
        if (!part.trim()) return '';
        const m = part.match(/^\[([^\]]+)\]([\s\S]*)/);
        if (m) {
          const content = m[2].trim().replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          return `<p class="es-block"><strong class="es-label">[${m[1]}]</strong> ${content}</p>`;
        }
        return '<p class="es-block">' + part.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') + '</p>';
      }).join('');
    } else {
      execHtml = rawSummary.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }
    document.getElementById('execSummary').innerHTML = execHtml;

    // SWOT (항상 렌더링 — 소상공인 모드에선 섹션 자체가 hidden)
    const renderSwotList = (id, arr) => {
      const el = document.getElementById(id);
      if (!el || !arr) return;
      el.innerHTML = arr.map(t =>
        typeof t === 'object'
          ? `<li><strong>${t.item}</strong>${t.evidence ? `<span class="swot-evidence">${t.evidence}</span>` : ''}</li>`
          : `<li>${t}</li>`
      ).join('');
    };
    renderSwotList('swotS', data.swot?.strengths);
    renderSwotList('swotW', data.swot?.weaknesses);
    renderSwotList('swotO', data.swot?.opportunities);
    renderSwotList('swotT', data.swot?.threats);

    // STP
    if (data.stp) {
      document.getElementById('stpS').textContent = data.stp.segmentation || '';
      document.getElementById('stpT').textContent = data.stp.targeting    || '';
      document.getElementById('stpP').textContent = data.stp.positioning  || '';
    }

    // 4P
    if (data.fourP) {
      document.getElementById('fpProduct').textContent   = data.fourP.product   || '';
      document.getElementById('fpPrice').textContent     = data.fourP.price     || '';
      document.getElementById('fpPlace').textContent     = data.fourP.place     || '';
      document.getElementById('fpPromotion').textContent = data.fourP.promotion || '';
    }

    // Strategies
    if (data.keyStrategies) {
      document.getElementById('strategies').innerHTML = data.keyStrategies.map((s, i) => `
        <div class="strat-item">
          <div class="strat-num">${i+1}</div>
          <div class="strat-body">
            <span class="p-badge p-${s.priority}">${s.priority==='high'?'높음':s.priority==='medium'?'보통':'낮음'} 우선순위</span>
            <h4>${s.title}</h4>
            <p>${s.description}</p>
            ${(s.owner || s.timeline) ? `<div class="strat-meta">${s.owner ? `<span>👤 ${s.owner}</span>` : ''}${s.timeline ? `<span>📅 ${s.timeline}</span>` : ''}</div>` : ''}
          </div>
        </div>`).join('');
    }

    // KPI
    if (data.kpi) {
      document.getElementById('kpiGrid').innerHTML = data.kpi.map(k => `
        <div class="kpi-card">
          <div class="kpi-metric">${k.metric}</div>
          <div class="kpi-curr">${k.current}</div>
          <div class="kpi-tgt">목표: ${k.target}</div>
          <div class="kpi-bar"><div class="kpi-fill" data-pct="${k.progress||0}"></div></div>
          <div class="kpi-time">${k.timeline}</div>
          ${(k.method || k.owner) ? `<div class="kpi-meta">${k.owner ? `<span>👤 ${k.owner}</span>` : ''}${k.method ? `<span title="${k.method}">📏 측정방법 있음</span>` : ''}</div>` : ''}
        </div>`).join('');
    }

    // Roadmap
    if (data.roadmap) {
      document.getElementById('roadmap').innerHTML = data.roadmap.map(r => `
        <div class="rm-phase">
          <div class="rm-hdr">
            <span class="rm-name">${r.phase}</span>
            <span class="rm-period">${r.period}</span>
            ${r.budget ? `<span class="rm-budget">💰 ${r.budget}</span>` : ''}
          </div>
          ${r.framework ? `<div class="rm-framework">${r.framework}</div>` : ''}
          <div class="rm-tasks">${r.tasks.map(t => `<span class="rm-task">${t}</span>`).join('')}</div>
        </div>`).join('');
    }

    // 진단 분석 섹션 (레이더 차트 + 취약 배너)
    renderDiagSection(fd);

    // micro 전용 — 생애주기 진단 + 상권 STP/TAM/SAM/SOM
    if (isMicro) {
      renderLifecycleMicro(data);
      renderMarketMicro(data);
    }

    // 컨설팅 유형별 특화 분석 섹션 (소기업 모드)
    if (!isMicro) renderSpecializedSection(data, fd);

    // 린 캔버스 시각화 섹션 (소기업 모드 — micro에서는 AI가 생성하지 않음)
    if (!isMicro) renderLeanCanvas(data, fd);

    // 6가지 시스템 섹션 (양쪽 모드 모두)
    renderSixSystems(data);

    // 90일 실행 플랜 섹션 (양쪽 모드 모두)
    renderPlan90(data);

    // 정부지원사업 매칭 섹션
    renderGovSection(fd);

    // Animate KPI bars after render
    requestAnimationFrame(() => {
      setTimeout(() => {
        document.querySelectorAll('.kpi-fill').forEach(el => {
          el.style.width = (el.dataset.pct || 0) + '%';
        });
      }, 300);
    });
  }

  function initScrollReveal() {
    // ① fade-in: 뷰포트 진입 시 visible
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          revealObs.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0 });
    document.querySelectorAll('#dashboard .reveal').forEach(el => {
      el.classList.remove('visible');
      revealObs.observe(el);
    });

    // ② 로드맵 라인 애니메이션
    const roadmap = document.getElementById('roadmap');
    if (roadmap) {
      roadmap.classList.remove('animated');
      const rmObs = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) { roadmap.classList.add('animated'); rmObs.unobserve(roadmap); }
      }, { threshold: 0.15 });
      rmObs.observe(roadmap);
    }

    // ③ 목차 클릭은 buildNav()에서 이미 처리됨

    // ④ 스크롤 스파이 — 이전 리스너 제거 후 재등록 (표시된 섹션만)
    const allSecIds = ['sec-summary','sec-lifecycle','sec-market-micro','sec-diag','sec-consulting','sec-swot','sec-stp','sec-4p','sec-strategy','sec-kpi','sec-roadmap','sec-lean-canvas','sec-six-systems','sec-plan90','sec-social-summary','sec-social-status','sec-social-mission','sec-social-revenue','sec-social-profit','sec-social-org','sec-social-system','sec-social-action','sec-gov','sec-funding-summary','sec-funding-agency','sec-funding-roadmap','sec-funding-docs'];
    const secIds = allSecIds.filter(id => {
      const el = document.getElementById(id);
      return el && el.style.display !== 'none';
    });
    function onScroll() {
      const offset = 100;
      let activeId = secIds[0];
      secIds.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= offset) activeId = id;
      });
      document.querySelectorAll('.report-nav .nav-link').forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === '#' + activeId);
      });
    }
    if (_scrollSpyBound) window.removeEventListener('scroll', _scrollSpyBound);
    _scrollSpyBound = onScroll;
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();   // 초기 실행
  }

  function initCountUp() {
    const items = [
      { el: document.querySelector('.hero-stats .stat-item:nth-child(1) .stat-num'), end: 6, suffix: '가지', decimals: 0 },
      { el: document.querySelector('.hero-stats .stat-item:nth-child(2) .stat-num'), end: 3, suffix: '분', decimals: 0 },
    ];
    items.forEach(({ el, end, suffix, decimals }) => {
      if (!el) return;
      let start = 0, duration = 1400, startTime = null;
      function step(ts) {
        if (!startTime) startTime = ts;
        const progress = Math.min((ts - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const val = (start + (end - start) * ease);
        el.textContent = (decimals ? val.toFixed(decimals) : Math.floor(val)) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  function addRipple(e) {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.5;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const ripple = document.createElement('span');
    ripple.className = 'ripple-circle';
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }

  function initInputChecks() {
    document.querySelectorAll('.form-group input, .form-group textarea, .form-group select').forEach(el => {
      const group = el.closest('.form-group');
      const updateCheck = () => {
        if (el.value.trim()) group.classList.add('completed');
        else group.classList.remove('completed');
      };
      el.addEventListener('input', updateCheck);
      el.addEventListener('change', updateCheck);
    });
  }

  // Register ripple on all buttons
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.btn, .btn-gold-hero, .btn-demo, .mode-btn').forEach(btn => {
      btn.addEventListener('click', addRipple);
    });
  });

  /* ── 업종 한글 레이블 ──────────────────────────────────────── */
  const _INDUSTRY_KR = {
    mfg_parts:'뿌리제조·부품가공', food_mfg:'식품제조·가공',
    local_service:'생활밀착형서비스', wholesale:'전문유통·도소매',
    restaurant:'외식·휴게음식', knowledge_it:'지식서비스·IT개발',
    construction:'소규모건설·인테리어', medical:'의료·보건',
    education:'교육·학원', fashion:'패션·의류',
    media:'미디어·콘텐츠', logistics:'물류·운송',
    energy:'환경·에너지', agri_food:'농림·식품원료',
    export_sme:'수출중소기업', finance:'금융·핀테크',
  };
  const _CT_KR = {
    finance_strategy:'경영재무전략', growth_strategy:'사업화·성장전략',
    differentiation_strategy:'차별화·경쟁우위전략', structure_strategy:'기업구조·시스템전략',
    innovation_strategy:'혁신·신사업전략', marketing_strategy:'마케팅·브랜드전략',
    hr_strategy:'조직·인력운영전략', digital_strategy:'디지털전환전략',
    pivot_strategy:'사업재편·피벗전략', cx_strategy:'고객경험·서비스전략',
  };

  /* ── PDF 저장 (경영전략 보고서) ────────────────────────────── */
  function print() {
    const fd = _lastFd;
    const today = new Date();
    const dateStr = `${today.getFullYear()}년 ${today.getMonth()+1}월 ${today.getDate()}일`;
    const industryKr = _INDUSTRY_KR[fd.industry] || fd.industry || '—';
    const scaleKr    = fd.bizScale === 'micro' ? '소상공인' : '소기업·중소기업';
    const ctKr       = _CT_KR[fd.consultingType] || fd.consultingType || '—';

    const cover = document.getElementById('printCover');
    if (cover) {
      cover.innerHTML = `
        <div class="pcov-logo-wrap">
          <div class="pcov-logo-name">BizNavi AI</div>
          <div class="pcov-logo-sub">경영전략 분석 플랫폼</div>
        </div>
        <hr class="pcov-rule-top">
        <p class="pcov-report-type">BUSINESS STRATEGY ANALYSIS REPORT</p>
        <h1 class="pcov-title">경영전략 분석 보고서</h1>
        <hr class="pcov-rule-bot">
        <table class="pcov-meta-table">
          <tr><td class="pcov-meta-key">기 업 명</td><td class="pcov-meta-val"><strong>${fd.companyName || '—'}</strong></td></tr>
          <tr><td class="pcov-meta-key">업 &nbsp;&nbsp;&nbsp; 종</td><td class="pcov-meta-val">${industryKr}</td></tr>
          <tr><td class="pcov-meta-key">규 &nbsp;&nbsp;&nbsp; 모</td><td class="pcov-meta-val">${scaleKr}</td></tr>
          <tr><td class="pcov-meta-key">컨설팅 유형</td><td class="pcov-meta-val">${ctKr}</td></tr>
          <tr><td class="pcov-meta-key">작 성 일</td><td class="pcov-meta-val">${dateStr}</td></tr>
        </table>
        <p class="pcov-footer">본 보고서는 BizNavi AI가 진단 데이터를 기반으로 자동 생성한 분석 보고서입니다.</p>
      `;
    }

    const el = document.getElementById('dashboard');
    el.classList.add('print-target');
    window.print();
    el.classList.remove('print-target');
  }

  return { render, renderSocial, renderSocialPlan, renderFunding, renderFundingRoadmap, initScrollReveal, initCountUp, addRipple, initInputChecks, print };
})();
