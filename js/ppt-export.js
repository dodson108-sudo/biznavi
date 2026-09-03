/* ================================================================
   BizNavi — ppt-export.js
   리포트 → PowerPoint(.pptx) 내보내기 (브라우저 생성)

   ⚠ 서버(api/)에서 파일을 만들지 않는다. Vercel 함수 부하와 배포 용량이 늘어난다.
      PptxGenJS를 CDN에서 defer로 불러와 클라이언트에서 생성한다.
      라이브러리가 없으면 버튼을 비활성화하고 안내만 표시한다 — 페이지가 깨지면 안 된다.

   ⚠ 화면은 다크 테마지만 PPT는 밝은 테마다. 발표·인쇄·제출용이므로 어두운 배경은 부적합하다.

   ⚠ 폰트는 '맑은 고딕' 하나만 지정한다. PptxGenJS는 폰트를 임베딩하지 않고
      폴백도 지정할 수 없다. 수신자 대부분이 Windows·PowerPoint 조합이므로 이 선택이 안전하다.
      (macOS에서는 시스템 대체 폰트로 렌더링된다 — 감수)

   ⚠ 유형 판별에 새 분기를 만들지 않는다. Dashboard.getReportContext()가
      기존 _isSocialFd() · _orgKind() · bizScale · purpose 판정 결과를 그대로 넘겨준다.
   ================================================================ */

const PptExport = (() => {

  /* ── 밝은 테마 팔레트 ── */
  const FONT   = '맑은 고딕';
  const C = {
    bg:      'FFFFFF',
    title:   '1A2340',   // 진한 남색
    body:    '333333',   // 진한 회색
    muted:   '777777',
    rule:    'D8DCE5',
    accent:  '8B6914',   // 인쇄용 골드(어둡게)
    critical:'C0392B',   // 빨강
    high:    'D35400',   // 주황
    medium:  '7F8C8D',   // 회색
    ok:      '27AE60',
    panel:   'F5F6F8',
  };
  const LEVEL_COLOR = { CRITICAL: C.critical, HIGH: C.high, MEDIUM: C.medium };

  /* 슬라이드 좌표 (16:9, 10 x 5.63 inch) */
  const M = { x: 0.55, w: 8.9, titleY: 0.42, bodyY: 1.15 };

  /* ── 텍스트 상한 ──
     ⚠ PptxGenJS는 자동 축소를 하지 않는다. 넘치면 슬라이드 밖으로 흘러 잘린다.
        글자 수 상한으로 자르고 '…'을 붙여 잘렸음을 남긴다.
        슬라이드 단위로 잘림이 있었으면 하단에 안내를 붙인다 */
  const LIMIT = { line: 110, para: 260, title: 42 };
  let _clippedInSlide = false;

  function _clip(v, max) {
    const t = String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
    if (t.length <= max) return t;
    _clippedInSlide = true;
    return t.slice(0, max - 1) + '…';
  }
  function _plain(v) { return String(v == null ? '' : v).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(); }

  /* ── PptxGenJS 로드 여부 ── */
  function isAvailable() {
    return typeof window !== 'undefined' && typeof window.PptxGenJS !== 'undefined';
  }

  /* ── 레이더차트 canvas ──
     캔버스가 둘이다: #radarChart(diag-reveal, drawRadarChart가 직접 그림) ·
     #radarChartDash(대시보드 #sec-diag, Chart.js가 그림).
     화면 진입 경로에 따라 어느 쪽이 채워졌는지 다르므로 둘 다 훑어 내용이 있는 것을 쓴다.
     (2026-09-03 id 중복 수정 전에는 둘 다 'radarChart'였다) */
  function _canvasHasContent(cv) {
    if (!cv || !cv.width || !cv.height) return false;
    try {
      const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
      for (let i = 3; i < d.length; i += 4) if (d[i] !== 0) return true;   // 알파 > 0
      return false;
    } catch (e) { return false; }   // tainted canvas 등 — 표로 대체
  }
  function _radarDataUrl() {
    try {
      const list = document.querySelectorAll('#radarChart, #radarChartDash');
      for (let i = 0; i < list.length; i++) {
        if (_canvasHasContent(list[i])) return list[i].toDataURL('image/png');
      }
    } catch (e) { /* 무시 — 표로 대체 */ }
    return null;
  }

  /* ══════════════════ 슬라이드 헬퍼 ══════════════════ */
  function _newSlide(pptx, title, badge) {
    _clippedInSlide = false;
    const s = pptx.addSlide();
    s.background = { color: C.bg };
    s.addText(_clip(title, LIMIT.title), {
      x: M.x, y: M.titleY, w: M.w, h: 0.45,
      fontFace: FONT, fontSize: 22, bold: true, color: C.title,
    });
    if (badge) {
      s.addText(_clip(badge, 30), {
        x: M.x, y: 0.9, w: M.w, h: 0.24,
        fontFace: FONT, fontSize: 10, color: C.muted,
      });
    }
    s.addShape('rect', { x: M.x, y: badge ? 1.18 : 0.92, w: M.w, h: 0.02, fill: { color: C.rule } });
    s._bodyTop = badge ? 1.36 : 1.10;
    return s;
  }

  /* 슬라이드 하단 안내 — 잘림이 있었거나 추가 안내가 필요할 때 */
  function _footNote(s, extra) {
    const parts = [];
    if (_clippedInSlide) parts.push('일부 내용이 요약·생략되었습니다');
    if (extra) parts.push(extra);
    if (!parts.length) return;
    s.addText('※ ' + parts.join(' · ') + ' — 상세는 전체 리포트를 참조하십시오', {
      x: M.x, y: 5.05, w: M.w, h: 0.28,
      fontFace: FONT, fontSize: 9, color: C.muted, italic: true,
    });
  }

  /* 불릿 목록 — items: [{ t, sub, color }] 최대 5개 */
  function _bullets(s, items, opt) {
    const o = opt || {};
    const top = o.y != null ? o.y : s._bodyTop;
    const rows = (items || []).filter(Boolean).slice(0, o.max || 5);
    if (!rows.length) return top;
    const h = o.rowH || 0.72;
    rows.forEach((it, i) => {
      const y = top + i * h;
      s.addShape('ellipse', {
        x: M.x, y: y + 0.08, w: 0.13, h: 0.13,
        fill: { color: it.color || C.accent },
      });
      s.addText(_clip(it.t, LIMIT.line), {
        x: M.x + 0.28, y: y, w: M.w - 0.28, h: 0.3,
        fontFace: FONT, fontSize: 13, bold: true, color: C.title,
      });
      if (it.sub) {
        s.addText(_clip(it.sub, LIMIT.para), {
          x: M.x + 0.28, y: y + 0.3, w: M.w - 0.28, h: 0.36,
          fontFace: FONT, fontSize: 11, color: C.body,
        });
      }
    });
    return top + rows.length * h;
  }

  /* 점수 표 — rows: [[영역, 점수, 등급]] */
  function _scoreTable(s, rows, opt) {
    const o = opt || {};
    const body = rows.slice(0, o.max || 8).map(r => ([
      { text: _clip(r[0], 34), options: { fontFace: FONT, fontSize: 11, color: C.body } },
      { text: r[1], options: { fontFace: FONT, fontSize: 11, bold: true, color: r[3] || C.title, align: 'center' } },
      { text: r[2], options: { fontFace: FONT, fontSize: 10, color: C.muted, align: 'center' } },
    ]));
    s.addTable(
      [[
        { text: '영역',  options: { fontFace: FONT, fontSize: 10, bold: true, color: C.title } },
        { text: '점수',  options: { fontFace: FONT, fontSize: 10, bold: true, color: C.title, align: 'center' } },
        { text: '수준',  options: { fontFace: FONT, fontSize: 10, bold: true, color: C.title, align: 'center' } },
      ]].concat(body),
      {
        x: o.x != null ? o.x : M.x, y: o.y != null ? o.y : s._bodyTop,
        w: o.w != null ? o.w : M.w,
        colW: o.colW || [(o.w || M.w) - 2.0, 1.0, 1.0],
        border: { pt: 0.5, color: C.rule },
        fill: { color: C.bg },
        rowH: 0.28,
      }
    );
  }

  function _levelOf(avg) {
    return avg >= 4 ? ['강점', C.ok] : avg >= 3 ? ['보통', C.title]
         : avg >= 2 ? ['취약', C.high] : avg > 0 ? ['위험', C.critical] : ['미입력', C.muted];
  }

  /* Executive Summary — [레이블] 단락 분해 */
  function _execBlocks(raw) {
    const t = _plain(raw);
    if (!t) return [];
    if (t.indexOf('[') < 0) return [{ t: '요약', sub: t }];
    return t.split(/(?=\[)/).map(p => {
      const m = p.match(/^\[([^\]]+)\]\s*([\s\S]*)/);
      return m ? { t: m[1], sub: m[2] } : null;
    }).filter(x => x && x.sub);
  }

  /* ══════════════════ 공통 슬라이드 ══════════════════ */
  function _cover(pptx, title, org, sub) {
    const s = pptx.addSlide();
    s.background = { color: C.bg };
    s.addText('BizNavi AI', {
      x: M.x, y: 1.5, w: M.w, h: 0.36,
      fontFace: FONT, fontSize: 14, bold: true, color: C.accent, charSpacing: 2,
    });
    s.addShape('rect', { x: M.x, y: 1.95, w: 2.2, h: 0.03, fill: { color: C.accent } });
    s.addText(_clip(title, 40), {
      x: M.x, y: 2.2, w: M.w, h: 0.7,
      fontFace: FONT, fontSize: 32, bold: true, color: C.title,
    });
    s.addText(_clip(org || 'BizNavi', 40), {
      x: M.x, y: 3.0, w: M.w, h: 0.45,
      fontFace: FONT, fontSize: 18, color: C.body,
    });
    s.addText(_clip(sub, 60), {
      x: M.x, y: 3.5, w: M.w, h: 0.3,
      fontFace: FONT, fontSize: 12, color: C.muted,
    });
    s.addText('본 자료는 진단 응답을 기반으로 자동 생성되었습니다. 최종 판단은 전문가 상담을 거치시기 바랍니다.', {
      x: M.x, y: 4.9, w: M.w, h: 0.3,
      fontFace: FONT, fontSize: 9, color: C.muted, italic: true,
    });
    return s;
  }

  /* 레이더차트 슬라이드 — 이미지 없으면 표로 대체 */
  function _radarSlide(pptx, title, badge, rows) {
    const s = _newSlide(pptx, title, badge);
    const img = _radarDataUrl();
    if (img) {
      s.addImage({ data: img, x: M.x, y: s._bodyTop, w: 2.9, h: 2.9 });
      _scoreTable(s, rows, { x: M.x + 3.2, y: s._bodyTop, w: M.w - 3.2, colW: [3.9, 0.9, 0.9] });
    } else {
      // ⚠ 차트 추출 실패(빈 캔버스 등) — 다운로드 전체가 실패하면 안 되므로 표로 대체한다
      _scoreTable(s, rows, { y: s._bodyTop });
    }
    _footNote(s);
    return s;
  }

  function _govSlide(pptx, fd) {
    let list = [];
    try {
      list = (fd && fd.govPrograms) || (typeof window !== 'undefined' && window._govPrograms) || [];
      if ((!list || !list.length) && typeof GovSupport !== 'undefined') list = GovSupport.match(fd) || [];
    } catch (e) { list = []; }
    if (!list.length) return null;
    const s = _newSlide(pptx, '정부지원사업', '상시 지원사업 · 공고 확인 필요');
    _bullets(s, list.slice(0, 5).map(p => ({
      t: _plain(p.name),
      sub: '[' + _plain(p.org) + '] ' + _plain(p.supportType || p.amount || ''),
    })), { max: 5, rowH: 0.66 });
    s.addText('※ 지원 규모·마감일은 매년 변경됩니다. 신청 전 주관기관 공고를 확인하십시오.', {
      x: M.x, y: 4.75, w: M.w, h: 0.3, fontFace: FONT, fontSize: 9, color: C.muted, italic: true,
    });
    return s;
  }

  /* ══════════════════ 유형별 구성 ══════════════════ */

  /* ── 소상공인 (micro) — 8장 ── */
  function _buildMicro(pptx, ctx) {
    const fd = ctx.fd, d = ctx.data || {};
    _cover(pptx, '소상공인 경영진단 보고서', fd.companyName, _dateKr() + ' · 7대 영역 진단');

    const ex = _execBlocks(d.executiveSummary);
    if (ex.length) {
      const s = _newSlide(pptx, '한눈에 보기', 'Executive Summary');
      _bullets(s, ex, { max: 4, rowH: 0.82 });
      _footNote(s, ex.length > 4 ? '요약 ' + (ex.length - 4) + '개 항목 생략' : '');
    }

    const rows = _microRows(fd);
    if (rows.length) _radarSlide(pptx, '7대 영역 진단', 'D1~D7 · 5점 만점', rows);

    if (d.lifecycleStage) {
      const s = _newSlide(pptx, '우리 가게 지금 단계', '생애주기 진단');
      s.addText(_clip(_plain(d.lifecycleStage), LIMIT.para * 2), {
        x: M.x, y: s._bodyTop, w: M.w, h: 2.0,
        fontFace: FONT, fontSize: 14, color: C.body, valign: 'top',
      });
      _footNote(s);
    }

    if (d.stp || d.tam || d.sam || d.som) {
      const s = _newSlide(pptx, '우리 동네 손님과 시장', '상권 STP · 시장규모');
      const items = [];
      if (d.stp) {
        if (d.stp.segmentation) items.push({ t: '고객 세분화', sub: _plain(d.stp.segmentation) });
        if (d.stp.targeting || d.stp.target) items.push({ t: '타겟 고객', sub: _plain(d.stp.targeting || d.stp.target) });
        if (d.stp.positioning) items.push({ t: '포지셔닝', sub: _plain(d.stp.positioning) });
      }
      const tsm = [d.tam && ('전체 시장 ' + _plain(d.tam)), d.sam && ('유효 시장 ' + _plain(d.sam)),
                   d.som && ('목표 시장 ' + _plain(d.som))].filter(Boolean).join('  ·  ');
      if (tsm) items.push({ t: '시장 규모', sub: tsm });
      _bullets(s, items, { max: 4, rowH: 0.82 });
      _footNote(s);
    }

    const sys = (d.sixSystems || []).filter(Boolean);
    if (sys.length) {
      const weak = sys.slice().sort((a, b) => _sysRank(a) - _sysRank(b)).slice(0, 4);
      const s = _newSlide(pptx, '영역별 처방', '취약 영역 우선');
      _bullets(s, weak.map(x => ({
        t: _plain(x.name || x.system || x.title || ''),
        sub: _plain((x.actions && x.actions[0]) || x.issue || x.action || ''),
      })), { max: 4, rowH: 0.82 });
      _footNote(s, sys.length > 4 ? '전체 ' + sys.length + '개 영역 중 4개만 표시' : '');
    }

    _plan90Slide(pptx, d.plan90days, '90일 실행 계획');
    _govSlide(pptx, fd);
  }

  /* 90일 실행 계획 슬라이드 — micro·공통. 데이터가 없으면 슬라이드를 만들지 않는다 */
  function _plan90Slide(pptx, plan, title) {
    const rows = (plan || []).filter(Boolean).slice(0, 3);
    if (!rows.length) return null;
    const s = _newSlide(pptx, title || '90일 실행 계획', '1·2·3개월차');
    const colW = M.w / 3;
    rows.forEach(function (m, i) {
      const x = M.x + i * colW;
      s.addShape('rect', { x: x, y: s._bodyTop, w: colW - 0.15, h: 0.44, fill: { color: C.panel } });
      s.addText(_clip((m.month || (i + 1)) + '개월차', 12), {
        x: x + 0.12, y: s._bodyTop + 0.06, w: colW - 0.35, h: 0.32,
        fontFace: FONT, fontSize: 12, bold: true, color: C.title });
      s.addText(_clip(_plain(m.focus || m.goal || ''), 44), {
        x: x, y: s._bodyTop + 0.58, w: colW - 0.15, h: 0.5,
        fontFace: FONT, fontSize: 11, bold: true, color: C.accent, valign: 'top' });
      const tasks = (m.actions || m.tasks || []).slice(0, 4)
        .map(function (t) { return '· ' + _clip(_plain(t.action || t.task || t), 36); }).join('\n');
      s.addText(tasks || '—', { x: x, y: s._bodyTop + 1.12, w: colW - 0.15, h: 2.0,
        fontFace: FONT, fontSize: 10, color: C.body, valign: 'top' });
      if (m.support || m.govSupport) {
        s.addText('지원: ' + _clip(_plain(m.support || m.govSupport), 30), {
          x: x, y: s._bodyTop + 3.2, w: colW - 0.15, h: 0.3,
          fontFace: FONT, fontSize: 9, color: C.muted });
      }
    });
    _footNote(s, (plan || []).length > 3 ? '전체 ' + plan.length + '개월 중 3개월만 표시' : '');
    return s;
  }

  /* ── 중소기업 (sme) — 12장 ── */
  function _buildSme(pptx, ctx) {
    const fd = ctx.fd, d = ctx.data || {};
    _cover(pptx, '경영전략 분석 보고서', fd.companyName, _dateKr() + ' · 소기업·중소기업');

    const ex = _execBlocks(d.executiveSummary);
    if (ex.length) {
      const s = _newSlide(pptx, '한눈에 보기', 'Executive Summary');
      _bullets(s, ex, { max: 4, rowH: 0.82 });
      _footNote(s, ex.length > 4 ? '요약 ' + (ex.length - 4) + '개 항목 생략' : '');
    }

    const rows = _smeRows(fd);
    if (rows.length) _radarSlide(pptx, '5대 역량 진단', '역량 프로파일 · 5점 만점', rows);

    if (d.swot) {
      const s = _newSlide(pptx, 'SWOT 분석', '각 3개 · 상세는 리포트 참조');
      const q = [['강점 (S)', d.swot.strengths, C.ok], ['약점 (W)', d.swot.weaknesses, C.critical],
                 ['기회 (O)', d.swot.opportunities, C.title], ['위협 (T)', d.swot.threats, C.high]];
      q.forEach((qq, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const x = M.x + col * (M.w / 2), y = s._bodyTop + row * 1.85;
        s.addText(qq[0], { x: x, y: y, w: M.w / 2 - 0.2, h: 0.28,
          fontFace: FONT, fontSize: 12, bold: true, color: qq[2] });
        const arr = (qq[1] || []).slice(0, 3).map(v => '· ' + _clip(_swotText(v), 46)).join('\n');
        s.addText(arr || '—', { x: x, y: y + 0.3, w: M.w / 2 - 0.2, h: 1.4,
          fontFace: FONT, fontSize: 10, color: C.body, valign: 'top' });
      });
      _footNote(s);
    }

    if (d.stp) {
      const s = _newSlide(pptx, 'STP 분석', '세분화 · 타겟 · 포지셔닝');
      _bullets(s, [
        d.stp.segmentation && { t: '세분화 (Segmentation)', sub: _plain(d.stp.segmentation) },
        (d.stp.targeting || d.stp.target) && { t: '타게팅 (Targeting)', sub: _plain(d.stp.targeting || d.stp.target) },
        d.stp.positioning && { t: '포지셔닝 (Positioning)', sub: _plain(d.stp.positioning) },
      ].filter(Boolean), { max: 3, rowH: 1.0 });
      _footNote(s);
    }

    if (d.fourP) {
      const s = _newSlide(pptx, '4P 마케팅 전략', 'Product · Price · Place · Promotion');
      _bullets(s, [
        d.fourP.product && { t: '제품 (Product)', sub: _plain(d.fourP.product) },
        d.fourP.price && { t: '가격 (Price)', sub: _plain(d.fourP.price) },
        d.fourP.place && { t: '유통 (Place)', sub: _plain(d.fourP.place) },
        d.fourP.promotion && { t: '촉진 (Promotion)', sub: _plain(d.fourP.promotion) },
      ].filter(Boolean), { max: 4, rowH: 0.82 });
      _footNote(s);
    }

    const ks = (d.keyStrategies || []).filter(Boolean);
    if (ks.length) {
      const s = _newSlide(pptx, '핵심 전략', '상위 4개');
      _bullets(s, ks.slice(0, 4).map((x, i) => ({
        t: (i + 1) + '. ' + _plain(x.title || x.name || x.strategy || ''),
        sub: _plain(x.detail || x.description || x.action || ''),
      })), { max: 4, rowH: 0.82 });
      _footNote(s, ks.length > 4 ? '전체 ' + ks.length + '개 중 4개만 표시' : '');
    }

    const kpi = (d.kpi || []).filter(Boolean);
    if (kpi.length) {
      const s = _newSlide(pptx, 'KPI 지표', '상위 5개');
      _scoreTable(s, kpi.slice(0, 5).map(k => [
        _plain(k.name || k.metric || k.indicator || ''),
        _plain(k.target || k.goal || '—'),
        _plain(k.current || k.owner || ''),
      ]), { y: s._bodyTop });
      _footNote(s, kpi.length > 5 ? '전체 ' + kpi.length + '개 중 5개만 표시' : '');
    }

    const rm = (d.roadmap || []).filter(Boolean);
    if (rm.length) {
      const s = _newSlide(pptx, '실행 로드맵', '단계별 과제');
      const colW = M.w / Math.min(rm.length, 3);
      rm.slice(0, 3).forEach((p, i) => {
        const x = M.x + i * colW;
        s.addShape('rect', { x: x, y: s._bodyTop, w: colW - 0.15, h: 0.42, fill: { color: C.panel } });
        s.addText(_clip(_plain(p.phase || p.title || ('' + (i + 1) + '단계')), 24), {
          x: x + 0.1, y: s._bodyTop + 0.04, w: colW - 0.35, h: 0.34,
          fontFace: FONT, fontSize: 12, bold: true, color: C.title });
        const tasks = (p.tasks || p.items || []).slice(0, 4).map(t => '· ' + _clip(_plain(t.task || t), 40)).join('\n');
        s.addText(tasks || '—', { x: x + 0.1, y: s._bodyTop + 0.55, w: colW - 0.35, h: 2.4,
          fontFace: FONT, fontSize: 10, color: C.body, valign: 'top' });
      });
      _footNote(s);
    }

    /* 6가지 시스템 + 90일 — 실행 체계와 그 일정이므로 함께 본다 */
    const sys = (d.sixSystems || []).filter(Boolean);
    const p90 = (d.plan90days || []).filter(Boolean);
    if (sys.length || p90.length) {
      const s = _newSlide(pptx, '실행 체계와 90일 계획', '6가지 시스템 · 월별 일정');
      if (sys.length) {
        const weak = sys.slice().sort((a, b) => _sysRank(a) - _sysRank(b)).slice(0, 3);
        s.addText('취약 시스템', { x: M.x, y: s._bodyTop, w: M.w, h: 0.26,
          fontFace: FONT, fontSize: 12, bold: true, color: C.accent });
        s.addText(weak.map(x => '· ' + _clip(_plain(x.name || x.system || '') + ' — ' +
          _plain((x.actions && x.actions[0]) || x.issue || ''), 92)).join('\n'), {
          x: M.x, y: s._bodyTop + 0.3, w: M.w, h: 1.1,
          fontFace: FONT, fontSize: 11, color: C.body, valign: 'top' });
      }
      if (p90.length) {
        const top = s._bodyTop + (sys.length ? 1.55 : 0);
        s.addText('90일 실행 계획', { x: M.x, y: top, w: M.w, h: 0.26,
          fontFace: FONT, fontSize: 12, bold: true, color: C.accent });
        const colW = M.w / 3;
        p90.slice(0, 3).forEach((m, i) => {
          const x = M.x + i * colW;
          s.addText(_clip((m.month || (i + 1)) + '개월차 · ' + _plain(m.focus || m.goal || ''), 28), {
            x: x, y: top + 0.32, w: colW - 0.15, h: 0.3,
            fontFace: FONT, fontSize: 11, bold: true, color: C.title });
          const tasks = (m.actions || m.tasks || []).slice(0, 3).map(t => '· ' + _clip(_plain(t), 34)).join('\n');
          s.addText(tasks || '—', { x: x, y: top + 0.62, w: colW - 0.15, h: 1.2,
            fontFace: FONT, fontSize: 10, color: C.body, valign: 'top' });
        });
      }
      _footNote(s);
    }

    _govSlide(pptx, fd);

    /* ⚠ 제외 항목 안내 — 무엇을 놓쳤는지 받는 사람이 알 수 있어야 한다.
          압축하면 의미가 사라지는 섹션은 슬라이드로 만들지 않고 여기서 명시한다 */
    const omitted = [];
    if (d.specializedAnalysis) omitted.push('유형별 특화 분석');
    if (d.leanCanvas) omitted.push('린 캔버스');
    if (omitted.length) {
      const s = _newSlide(pptx, '리포트에서 확인할 내용', '이 발표자료에 포함되지 않은 항목');
      s.addText(omitted.map(x => '· ' + x).join('\n'), {
        x: M.x, y: s._bodyTop, w: M.w, h: 1.2,
        fontFace: FONT, fontSize: 14, color: C.body, valign: 'top' });
      s.addText('위 항목은 분량이 많아 발표자료에서 제외했습니다. 전체 리포트(PDF)에서 확인하실 수 있습니다.', {
        x: M.x, y: s._bodyTop + 1.4, w: M.w, h: 0.5,
        fontFace: FONT, fontSize: 11, color: C.muted, valign: 'top' });
    }
  }

  /* ── 사회적경제 3유형 — 9장 ── */
  function _buildSocial(pptx, ctx) {
    const fd = ctx.fd;
    const ORG_TITLE = { social: '사회적기업', venture: '소셜벤처', coop: '협동조합' };
    const orgName = ORG_TITLE[ctx.kind] || '사회적경제 조직';
    _cover(pptx, orgName + ' 진단 보고서', fd.companyName, _dateKr() + ' · 8대 영역 진단');

    const doms = ctx.orgDomains || [];
    const scored = doms.filter(d => d.avg > 0);
    const weak3 = scored.slice().sort((a, b) => a.avg - b.avg).slice(0, 3);
    const urgent = (ctx.orgWarnings || []).filter(w => w.level === 'CRITICAL' || w.level === 'HIGH');

    /* 2장 — 한눈에 보기 */
    {
      const s = _newSlide(pptx, '한눈에 보기', '총점 · 취약 영역 · 즉시 확인 사항');
      s.addShape('rect', { x: M.x, y: s._bodyTop, w: 2.1, h: 1.25, fill: { color: C.panel } });
      s.addText(String(ctx.orgTotal || 0), { x: M.x, y: s._bodyTop + 0.16, w: 2.1, h: 0.6,
        fontFace: FONT, fontSize: 34, bold: true, color: C.title, align: 'center' });
      s.addText('/ 100점 (8영역 균등)', { x: M.x, y: s._bodyTop + 0.8, w: 2.1, h: 0.3,
        fontFace: FONT, fontSize: 10, color: C.muted, align: 'center' });
      s.addText('먼저 손봐야 할 영역', { x: M.x + 2.35, y: s._bodyTop, w: M.w - 2.35, h: 0.26,
        fontFace: FONT, fontSize: 12, bold: true, color: C.accent });
      s.addText(weak3.length
        ? weak3.map((d, i) => (i + 1) + '. ' + _clip(d.id.toUpperCase() + '. ' + d.label + '  (' + d.avg.toFixed(1) + '점)', 46)).join('\n')
        : '진단 점수가 입력되지 않았습니다.', {
        x: M.x + 2.35, y: s._bodyTop + 0.3, w: M.w - 2.35, h: 0.95,
        fontFace: FONT, fontSize: 12, color: C.body, valign: 'top' });

      const wy = s._bodyTop + 1.5;
      s.addText(urgent.length ? '지금 확인해야 할 사항 ' + urgent.length + '건' : '즉시 조치가 필요한 경고는 없습니다', {
        x: M.x, y: wy, w: M.w, h: 0.26,
        fontFace: FONT, fontSize: 12, bold: true, color: urgent.length ? C.critical : C.ok });
      if (urgent.length) {
        urgent.slice(0, 4).forEach((w, i) => {
          const y = wy + 0.32 + i * 0.62;
          s.addText(w.level, { x: M.x, y: y, w: 0.85, h: 0.24,
            fontFace: FONT, fontSize: 9, bold: true, color: LEVEL_COLOR[w.level] || C.medium });
          s.addText(_clip(w.msg, 150), { x: M.x + 0.9, y: y, w: M.w - 0.9, h: 0.56,
            fontFace: FONT, fontSize: 10, color: C.body, valign: 'top' });
        });
      }
      _footNote(s, urgent.length > 4 ? '경고 ' + (urgent.length - 4) + '건 생략' : '');
    }

    /* 3장 — 8대 영역 */
    const rows = doms.map(d => {
      const lv = _levelOf(d.avg);
      return [d.id.toUpperCase() + '. ' + d.label, d.avg > 0 ? d.avg.toFixed(1) : '—', lv[0], lv[1]];
    });
    if (rows.length) _radarSlide(pptx, '8대 영역 진단', ctx.kind === 'coop' ? 'C1~C8 · 5점 만점'
      : ctx.kind === 'venture' ? 'V1~V8 · 5점 만점' : 'S1~S8 · 5점 만점', rows);

    /* 4~7장 — 섹션별 (라벨·영역은 Dashboard 테이블 재사용) */
    ['mission', 'revenue', 'profit', 'org'].forEach(key => {
      const spec = ctx.secLabel(key);
      const ids = ctx.secDomainIds(key);
      const s = _newSlide(pptx, spec.t, spec.b);
      const picked = doms.filter(d => ids.indexOf(d.id) >= 0);
      _scoreTable(s, picked.map(d => {
        const lv = _levelOf(d.avg);
        return [d.id.toUpperCase() + '. ' + d.label, d.avg > 0 ? d.avg.toFixed(1) : '—', lv[0], lv[1]];
      }), { y: s._bodyTop, max: 2 });

      const weakItems = _weakItems(ctx, ids, 4);
      const ty = s._bodyTop + 0.9;
      s.addText(weakItems.length ? '우선 손볼 항목 (2점 이하)' : '2점 이하 항목이 없습니다', {
        x: M.x, y: ty, w: M.w, h: 0.26,
        fontFace: FONT, fontSize: 12, bold: true, color: weakItems.length ? C.high : C.ok });
      if (weakItems.length) {
        s.addText(weakItems.map(x => '· ' + _clip(x, 88)).join('\n'), {
          x: M.x, y: ty + 0.3, w: M.w, h: 1.1,
          fontFace: FONT, fontSize: 11, color: C.body, valign: 'top' });
      }
      const ws = (ctx.orgWarnings || []).filter(w => _warnSection(w.code) === key).slice(0, 2);
      if (ws.length) {
        const wy2 = ty + (weakItems.length ? 1.5 : 0.35);
        ws.forEach((w, i) => {
          s.addText(w.level, { x: M.x, y: wy2 + i * 0.58, w: 0.85, h: 0.24,
            fontFace: FONT, fontSize: 9, bold: true, color: LEVEL_COLOR[w.level] || C.medium });
          s.addText(_clip(w.msg, 140), { x: M.x + 0.9, y: wy2 + i * 0.58, w: M.w - 0.9, h: 0.52,
            fontFace: FONT, fontSize: 10, color: C.body, valign: 'top' });
        });
      }
      /* ⚠ AI 계획 슬라이드가 생략되면 제도(system) 영역이 출력에서 통째로 사라진다.
            수미쌍관 원칙 — 그 경우 org 슬라이드 하단에 붙인다 */
      if (key === 'org' && !ctx.socialPlan) _appendSystemNote(s, ctx);
      _footNote(s);
    });

    /* 8장 — AI 실행 계획 (+ 제도 요약). 계획이 없으면 슬라이드를 만들지 않는다 */
    if (ctx.socialPlan) {
      const p = ctx.socialPlan;
      const s = _newSlide(pptx, '먼저 해야 할 일과 90일 계획', 'AI 실행 계획');
      const pri = (p.priority || []).slice(0, 3);
      if (pri.length) {
        s.addText('먼저 해야 할 일', { x: M.x, y: s._bodyTop, w: M.w, h: 0.26,
          fontFace: FONT, fontSize: 12, bold: true, color: C.accent });
        s.addText(pri.map((x, i) => (x.order || i + 1) + '. ' + _clip(_plain(x.action), 88)).join('\n'), {
          x: M.x, y: s._bodyTop + 0.3, w: M.w, h: 1.0,
          fontFace: FONT, fontSize: 11, color: C.body, valign: 'top' });
      }
      const plan = (p.plan90 || []).slice(0, 3);
      if (plan.length) {
        const top = s._bodyTop + (pri.length ? 1.45 : 0);
        s.addText('90일 실행 계획', { x: M.x, y: top, w: M.w, h: 0.26,
          fontFace: FONT, fontSize: 12, bold: true, color: C.accent });
        const colW = M.w / 3;
        plan.forEach((m, i) => {
          const x = M.x + i * colW;
          s.addText(_clip((m.month || i + 1) + '개월차 · ' + _plain(m.focus), 28), {
            x: x, y: top + 0.32, w: colW - 0.15, h: 0.3,
            fontFace: FONT, fontSize: 11, bold: true, color: C.title });
          s.addText((m.tasks || []).slice(0, 3).map(t => '· ' + _clip(_plain(t), 34)).join('\n') || '—', {
            x: x, y: top + 0.62, w: colW - 0.15, h: 1.1,
            fontFace: FONT, fontSize: 10, color: C.body, valign: 'top' });
        });
      }
      _appendSystemNote(s, ctx, 4.35);
      _footNote(s);
    }

    _govSlide(pptx, fd);
  }

  /* 제도(system) 영역 2줄 요약 — 어느 슬라이드에 붙어도 동작한다 */
  function _appendSystemNote(s, ctx, atY) {
    const ids = ctx.secDomainIds('system');
    const dom = (ctx.orgDomains || []).filter(d => ids.indexOf(d.id) >= 0)[0];
    if (!dom) return;
    const spec = ctx.secLabel('system');
    const y = atY != null ? atY : 4.35;
    s.addText(spec.t + '  ' + (dom.avg > 0 ? dom.avg.toFixed(1) + '점' : '미입력'), {
      x: M.x, y: y, w: M.w, h: 0.24,
      fontFace: FONT, fontSize: 11, bold: true, color: C.accent });
    const weak = _weakItems(ctx, ids, 2);
    s.addText(weak.length ? weak.map(x => '· ' + _clip(x, 84)).join('   ') : '2점 이하 항목이 없습니다', {
      x: M.x, y: y + 0.26, w: M.w, h: 0.32,
      fontFace: FONT, fontSize: 10, color: C.body });
  }

  /* ── 정책자금 — 7장 (레이더차트 슬라이드 없음) ── */
  function _buildFunding(pptx, ctx) {
    const fd = ctx.fd;
    const v = (fd && fd.fundingVerdict) || {};
    const agencies = v.agencies || [];
    _cover(pptx, '정책자금 진단 보고서', fd.companyName, _dateKr() + ' · 기관 기준 자가진단');

    {
      const s = _newSlide(pptx, '판정 요약', '기관별 점검 결과');
      const VLABEL = { blocked: '결격 사유 있음', review: '확인 필요', clear: '결격 없음' };
      const VCOLOR = { blocked: C.critical, review: C.high, clear: C.ok };
      _bullets(s, agencies.map(a => {
        const fx = (a.findings || []).filter(f => f.kind !== 'reference');
        const clear = fx.filter(f => f.status === 'clear').length;
        const need = fx.length - clear;
        const vl = a.eligible === false ? '대상 아님' : (VLABEL[a.verdict] || '—');
        return {
          t: _plain(a.name || a.agency || ''),
          sub: vl + '   ·   점검 ' + fx.length + '개 · 통과 ' + clear + ' · 확인 필요 ' + need,
          color: a.eligible === false ? C.medium : (VCOLOR[a.verdict] || C.medium),
        };
      }), { max: 4, rowH: 0.86 });
      if ((v.unknownItems || []).length) {
        s.addText('확인이 필요한 항목 ' + v.unknownItems.length + '건 — 응답하지 않았거나 앱에서 판정할 수 없는 항목입니다.', {
          x: M.x, y: 4.5, w: M.w, h: 0.3, fontFace: FONT, fontSize: 10, color: C.high });
      }
      _footNote(s);
    }

    agencies.slice(0, 2).forEach(a => {
      const s = _newSlide(pptx, _plain(a.name || a.agency || '기관'), '결격 요건 점검');
      if (a.eligible === false) {
        s.addText('신청 대상이 아닙니다', { x: M.x, y: s._bodyTop, w: M.w, h: 0.3,
          fontFace: FONT, fontSize: 14, bold: true, color: C.medium });
        s.addText(_clip(_plain(a.notEligibleReason || ''), LIMIT.para * 2), {
          x: M.x, y: s._bodyTop + 0.4, w: M.w, h: 2.2,
          fontFace: FONT, fontSize: 11, color: C.body, valign: 'top' });
      } else {
        const fx = (a.findings || []).filter(f => f.kind !== 'reference' && f.status !== 'clear');
        if (a.warning) {
          s.addText('⚠ ' + _clip(_plain(a.warning), 160), { x: M.x, y: s._bodyTop, w: M.w, h: 0.5,
            fontFace: FONT, fontSize: 11, bold: true, color: C.high, valign: 'top' });
        }
        _bullets(s, fx.slice(0, 4).map(f => ({
          t: _plain(f.label || f.title || ''),
          sub: _plain(f.message || '') + (f.source ? '   [' + _plain(f.source) + ']' : ''),
          color: f.severity === 'high' ? C.critical : f.severity === 'medium' ? C.high : C.medium,
        })), { y: s._bodyTop + (a.warning ? 0.6 : 0), max: 4, rowH: 0.82 });
        if (!fx.length) {
          s.addText('확인이 필요한 항목이 없습니다.', { x: M.x, y: s._bodyTop + 0.6, w: M.w, h: 0.3,
            fontFace: FONT, fontSize: 12, color: C.ok });
        }
        _footNote(s, fx.length > 4 ? '점검 항목 ' + (fx.length - 4) + '건 생략' : '');
      }
    });

    /* AI 로드맵이 없으면 슬라이드를 만들지 않는다 */
    const rm = ctx.fundingRoadmap;
    if (rm && (rm.priority || []).length) {
      const s = _newSlide(pptx, '실행 로드맵', 'AI 우선순위 과제');
      _bullets(s, rm.priority.slice(0, 4).map((x, i) => ({
        t: (x.order || i + 1) + '. ' + _plain(x.action || x.task || ''),
        sub: _plain(x.how || x.why || ''),
      })), { max: 4, rowH: 0.86 });
      _footNote(s);
    }

    {
      const docs = _fundingDocs(fd);
      if (docs.length) {
        const s = _newSlide(pptx, '준비 서류', '신청 전 확인');
        s.addText(docs.slice(0, 10).map(x => '· ' + _clip(x, 44)).join('\n'), {
          x: M.x, y: s._bodyTop, w: M.w / 2, h: 3.2,
          fontFace: FONT, fontSize: 11, color: C.body, valign: 'top' });
        if (docs.length > 10) {
          s.addText(docs.slice(10, 20).map(x => '· ' + _clip(x, 44)).join('\n'), {
            x: M.x + M.w / 2, y: s._bodyTop, w: M.w / 2, h: 3.2,
            fontFace: FONT, fontSize: 11, color: C.body, valign: 'top' });
        }
        s.addText('※ 기관·사업별로 추가 서류가 요구될 수 있습니다. 신청 전 주관기관 공고를 확인하십시오.', {
          x: M.x, y: 4.75, w: M.w, h: 0.3, fontFace: FONT, fontSize: 9, color: C.muted, italic: true });
      }
    }

    _govSlide(pptx, fd);
  }

  /* ══════════════════ 데이터 헬퍼 ══════════════════ */
  function _dateKr() {
    const d = new Date();
    return d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일';
  }
  function _sysRank(x) {
    const st = String((x && (x.status || x.level)) || '').toLowerCase();
    if (/위험|critical|danger|weak|취약/.test(st)) return 0;
    if (/주의|warn|보통|mid/.test(st)) return 1;
    return 2;
  }
  function _swotText(v) { return _plain(typeof v === 'object' ? (v.item || v.text || '') : v); }
  function _warnSection(code) {
    try { return (typeof Dashboard !== 'undefined' && Dashboard.warnSection) ? Dashboard.warnSection(code) : ''; }
    catch (e) { return ''; }
  }
  /* 2점 이하 문항 라벨 — Dashboard가 넘겨준 ITEMS·접두어·점수를 그대로 쓴다 */
  function _weakItems(ctx, ids, max) {
    const items = ctx.orgItems || {}, flat = ctx.flatScores || {}, pre = ctx.orgKeyPrefix || '';
    const out = [];
    ids.forEach(did => {
      Object.keys(items).filter(k => k.indexOf(did + '_') === 0).forEach(k => {
        const sc = Number(flat[pre + k] || 0);
        if (sc > 0 && sc <= 2) out.push(items[k].label + ' (' + sc + '점)');
      });
    });
    return out.slice(0, max || 4);
  }
  function _microRows(fd) {
    const sc = (fd && fd.scaleScores) || {};
    const doms = sc.domains || {};
    return Object.keys(doms).map(k => {
      const d = doms[k], lv = _levelOf(d.avg || 0);
      return [_plain(d.label), (d.avg || 0) > 0 ? Number(d.avg).toFixed(1) : '—', lv[0], lv[1]];
    });
  }
  function _smeRows(fd) {
    const ds = (fd && fd.domainScores) || {};
    const KR = { finance: '재무건전성', hr: '조직·인력', bm: '사업모델', future: '미래역량', differentiation: '차별화·경쟁력' };
    return Object.keys(ds).map(k => {
      const avg = Number((ds[k] && ds[k].avg) || 0), lv = _levelOf(avg);
      return [KR[k] || k, avg > 0 ? avg.toFixed(1) : '—', lv[0], lv[1]];
    });
  }
  function _fundingDocs(fd) {
    const base = ['사업자등록증 사본', '최근 3개년 재무제표', '부가가치세 과세표준증명원',
                  '국세·지방세 납세증명서', '대표자 신분증 사본', '사업계획서'];
    const f = (fd && fd.fundingData) || {};
    if (f.taxArrears === 'yes') base.push('징수유예·분납 승인 서류');
    if ((f.certs || []).length && (f.certs || [])[0] !== '해당 없음') base.push('보유 인증서 사본');
    if (f.isManufacturing === 'yes') base.push('공장등록증 또는 제조시설 증빙');
    return base;
  }

  /* ══════════════════ 진입점 ══════════════════ */
  const KIND_LABEL = {
    micro: '소상공인진단', sme: '경영전략진단',
    social: '사회적기업진단', venture: '소셜벤처진단', coop: '협동조합진단',
    funding: '정책자금진단',
  };

  async function download() {
    if (!isAvailable()) {
      alert('PPT 생성 라이브러리를 불러오지 못했습니다.\n네트워크 상태를 확인한 뒤 페이지를 새로고침해 주세요.\n(PDF 저장은 정상 사용하실 수 있습니다.)');
      return;
    }
    let ctx;
    try {
      ctx = Dashboard.getReportContext();
    } catch (e) {
      console.error('[PPT] 리포트 컨텍스트 조회 실패:', e);
      alert('리포트 데이터를 불러오지 못했습니다.');
      return;
    }

    const pptx = new window.PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    pptx.author = 'BizNavi AI';
    pptx.company = 'BizNavi';
    pptx.title = (ctx.fd.companyName || 'BizNavi') + ' 진단 보고서';

    try {
      if (ctx.kind === 'funding')                              _buildFunding(pptx, ctx);
      else if (['social', 'venture', 'coop'].indexOf(ctx.kind) >= 0) _buildSocial(pptx, ctx);
      else if (ctx.kind === 'micro')                           _buildMicro(pptx, ctx);
      else                                                     _buildSme(pptx, ctx);
    } catch (e) {
      console.error('[PPT] 슬라이드 생성 실패:', e);
      alert('발표자료 생성 중 오류가 발생했습니다. PDF 저장을 이용해 주세요.');
      return;
    }

    const org = (ctx.fd.companyName || 'BizNavi').replace(/[\\/:*?"<>|]/g, '').trim() || 'BizNavi';
    const d = new Date();
    const ymd = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    const fileName = org + '_' + (KIND_LABEL[ctx.kind] || '진단') + '_' + ymd + '.pptx';

    try {
      await pptx.writeFile({ fileName: fileName });
    } catch (e) {
      console.error('[PPT] 파일 저장 실패:', e);
      alert('파일을 저장하지 못했습니다. 브라우저 다운로드 설정을 확인해 주세요.');
    }
  }

  /* 버튼 상태 — 라이브러리 미로드 시 비활성화 */
  function initButton() {
    const btn = document.getElementById('btnPptExport');
    if (!btn) return;
    if (isAvailable()) {
      btn.disabled = false;
      btn.removeAttribute('title');
    } else {
      btn.disabled = true;
      btn.setAttribute('title', 'PPT 생성 라이브러리를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.');
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('load', function () { setTimeout(initButton, 300); });
  }

  return { download, isAvailable, initButton };

})();

if (typeof window !== 'undefined') window.PptExport = PptExport;
if (typeof module !== 'undefined') module.exports = PptExport;
