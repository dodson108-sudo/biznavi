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

  /* ══════════════════ 색 체계 ══════════════════
     ⚠ 색은 팔레트 객체에만 정의한다. 슬라이드 코드에 16진 색상을 직접 쓰지 마라.
        팔레트를 바꿨는데 일부 슬라이드만 옛 색으로 남는 것을 막기 위한 것이다.

     ⚠ 팔레트가 둘인 이유 — 유형별 전환 중이기 때문이다.
        `LEGACY`는 micro·사회적경제·정책자금이 쓰던 기존 색이고 출력이 바뀌면 안 된다.
        `THEME`은 새 색 체계이며 **현재 sme 경로만** 쓴다(2026-09-21, 1단계).
        2·3단계에서 나머지 유형을 THEME으로 옮기면 LEGACY는 삭제한다.

     ⚠ 슬라이드 헬퍼는 전부 활성 팔레트 `TH`만 참조한다 — `LEGACY`/`THEME`을
        직접 참조하지 마라. 헬퍼가 한쪽을 직접 붙잡으면 유형 전환이 그 헬퍼에서만
        일어나지 않아 한 장만 색이 다른 슬라이드가 나온다. */
  const FONT = '맑은 고딕';

  /* 기존 팔레트 — micro·사회적경제·정책자금 (출력 불변) */
  const LEGACY = {
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
    band:    false,      // 본문 슬라이드 상단 남색 띠 사용 여부
    /* 신호색 옅은 면 — THEME과 키를 맞추기 위한 것. LEGACY 빌더는 참조하지 않는다 */
    okBg:      'EEF7F1',
    criticalBg:'FBEFED',
    highBg:    'FCF4EA',
    titleBg:   'EEF1F7',
  };

  /* 새 색 체계 — 주색(남색) · 보조색(금색) · 신호색(빨강·주황·초록) · 흰 배경
     ⚠ 신뢰감이 목적이다. 채도 높은 원색을 쓰지 않는다 —
        빨강은 벽돌색, 주황은 황토색, 초록은 짙은 녹색으로 낮춰 잡았다.
     ⚠ 금색이 둘이다. 흰 배경 위(`accent`)와 남색 위(`gold`)는 같은 색을 쓸 수 없다 —
        하나로 통일하면 한쪽에서 반드시 읽히지 않는다. */
  const THEME = {
    /* 주색 — 제목·표지 배경·상단 띠 */
    navy:      '16233F',
    navyMid:   '24365C',   // 표지 점수 패널 등 남색 위의 한 단계 밝은 면
    onNavy:    'FFFFFF',   // 남색 위 본문
    onNavyDim: 'AEB9D2',   // 남색 위 보조 텍스트
    gold:      'E0BC5E',   // 남색 위 금색 — 핵심 숫자·강조

    /* 공통 키 — LEGACY와 키 이름이 같아야 헬퍼가 그대로 동작한다 */
    bg:      'FFFFFF',
    title:   '16233F',   // 주색(남색)
    body:    '2E3440',
    muted:   '6B7280',
    rule:    'D9DEE8',
    accent:  'A8801F',   // 흰 배경 위 금색 — 핵심 숫자·강조
    critical:'B03A2E',   // 신호 — 위험(빨강)
    high:    'C0781F',   // 신호 — 취약(주황)
    medium:  '7A8290',   // 신호 — 중립(회색)
    ok:      '1E8449',   // 신호 — 양호(초록)
    panel:   'F4F6FA',
    band:    true,
    /* 신호색 옅은 면 — SWOT 매트릭스 칸 배경. 글자는 올리되 신호색 머리띠와 구분되게 연하게 잡았다 */
    okBg:      'EAF4EE',
    criticalBg:'F8ECEA',
    highBg:    'FAF1E6',
    titleBg:   'EAEEF5',
  };

  /* 활성 팔레트 — download()가 유형에 따라 갈아끼운다 */
  let TH = LEGACY;
  function _useTheme(p) { TH = p; }

  /* ⚠ 상수가 아니라 함수다. 상수로 두면 모듈 로드 시점의 팔레트가 박혀
        나중에 팔레트를 바꿔도 경고 배지만 옛 색으로 남는다 */
  function _levelColor(lv) {
    return lv === 'CRITICAL' ? TH.critical
         : lv === 'HIGH'     ? TH.high
         : lv === 'MEDIUM'   ? TH.medium : TH.medium;
  }

  /* 슬라이드 좌표 (16:9, 10 x 5.63 inch) */
  const M = { x: 0.55, w: 8.9, titleY: 0.42, bodyY: 1.15 };

  /* ── 텍스트 상한 — **LEGACY 유형(micro·사회적경제·정책자금) 전용** ──
     ⚠ PptxGenJS는 자동 축소를 하지 않는다. 넘치면 슬라이드 밖으로 흘러 잘린다.
        LEGACY는 글자 수 상한으로 자르고 '…'을 붙여 잘렸음을 남긴다.
        슬라이드 단위로 잘림이 있었으면 하단에 안내를 붙인다.
     ⚠ sme는 3단계(2026-09-22)부터 자르지 않는다 — 아래 'sme 3단계' 블록의 넘침 처리를 쓴다.
        LEGACY 출력을 바꾸지 않으려고 이 상한은 그대로 두었다(유형을 옮길 때 함께 정리할 것) */
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

  /* ══════════════════ 슬라이드 헬퍼 ══════════════════
     ⚠ 본문 상단 처리는 팔레트의 `band` 하나로만 갈린다. 빌더에서 유형을 보고
        띠를 그리지 마라 — 새 슬라이드를 추가할 때 띠를 빠뜨린 장이 섞인다. */
  function _newSlide(pptx, title, badge) {
    _clippedInSlide = false;
    const s = pptx.addSlide();
    s.background = { color: TH.bg };

    if (TH.band) {
      /* 상단 남색 띠 + 금색 밑줄. 띠는 슬라이드 폭을 꽉 채운다(여백 M.x를 무시).
         ⚠ 좌표는 슬라이드 원점 기준이다 — LAYOUT_16x9는 10 x 5.63 inch */
      const bh = badge ? 0.94 : 0.80;
      s.addShape('rect', { x: 0, y: 0, w: 10, h: bh, fill: { color: TH.navy } });
      s.addShape('rect', { x: 0, y: bh, w: 10, h: 0.05, fill: { color: TH.gold } });
      s.addText(_clip(title, LIMIT.title), {
        x: M.x, y: badge ? 0.14 : 0.19, w: M.w, h: 0.44,
        fontFace: FONT, fontSize: 21, bold: true, color: TH.onNavy,
      });
      if (badge) {
        s.addText(_clip(badge, 30), {
          x: M.x, y: 0.58, w: M.w, h: 0.26,
          fontFace: FONT, fontSize: 10, color: TH.onNavyDim,
        });
      }
      s._bodyTop = bh + 0.30;
      return s;
    }

    s.addText(_clip(title, LIMIT.title), {
      x: M.x, y: M.titleY, w: M.w, h: 0.45,
      fontFace: FONT, fontSize: 22, bold: true, color: TH.title,
    });
    if (badge) {
      s.addText(_clip(badge, 30), {
        x: M.x, y: 0.9, w: M.w, h: 0.24,
        fontFace: FONT, fontSize: 10, color: TH.muted,
      });
    }
    s.addShape('rect', { x: M.x, y: badge ? 1.18 : 0.92, w: M.w, h: 0.02, fill: { color: TH.rule } });
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
      fontFace: FONT, fontSize: 9, color: TH.muted, italic: true,
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
        fill: { color: it.color || TH.accent },
      });
      s.addText(_clip(it.t, LIMIT.line), {
        x: M.x + 0.28, y: y, w: M.w - 0.28, h: 0.3,
        fontFace: FONT, fontSize: 13, bold: true, color: TH.title,
      });
      if (it.sub) {
        s.addText(_clip(it.sub, LIMIT.para), {
          x: M.x + 0.28, y: y + 0.3, w: M.w - 0.28, h: 0.36,
          fontFace: FONT, fontSize: 11, color: TH.body,
        });
      }
    });
    return top + rows.length * h;
  }

  /* 점수 표 — rows: [[영역, 점수, 등급]] */
  function _scoreTable(s, rows, opt) {
    const o = opt || {};
    const body = rows.slice(0, o.max || 8).map(r => ([
      { text: _clip(r[0], 34), options: { fontFace: FONT, fontSize: 11, color: TH.body } },
      { text: r[1], options: { fontFace: FONT, fontSize: 11, bold: true, color: r[3] || TH.title, align: 'center' } },
      { text: r[2], options: { fontFace: FONT, fontSize: 10, color: TH.muted, align: 'center' } },
    ]));
    s.addTable(
      [[
        { text: '영역',  options: { fontFace: FONT, fontSize: 10, bold: true, color: TH.title } },
        { text: '점수',  options: { fontFace: FONT, fontSize: 10, bold: true, color: TH.title, align: 'center' } },
        { text: '수준',  options: { fontFace: FONT, fontSize: 10, bold: true, color: TH.title, align: 'center' } },
      ]].concat(body),
      {
        x: o.x != null ? o.x : M.x, y: o.y != null ? o.y : s._bodyTop,
        w: o.w != null ? o.w : M.w,
        colW: o.colW || [(o.w || M.w) - 2.0, 1.0, 1.0],
        border: { pt: 0.5, color: TH.rule },
        fill: { color: TH.bg },
        rowH: 0.28,
      }
    );
  }

  function _levelOf(avg) {
    return avg >= 4 ? ['강점', TH.ok] : avg >= 3 ? ['보통', TH.title]
         : avg >= 2 ? ['취약', TH.high] : avg > 0 ? ['위험', TH.critical] : ['미입력', TH.muted];
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

  /* 표지 종합 점수 — sme
     ⚠ 새로 계산하지 않는다. 화면이 쓰는 값(`fd.domainScores`의 5대 역량 avg)을
        그대로 평균한다. 이 값은 진단 결과 화면의 막대(#drScoreList)·레이더차트·
        대시보드 점수 pill이 표시하는 것과 같은 숫자다.
     ⚠ **5점 만점으로 표시한다.** sme 화면에는 100점 만점 종합 점수가 없다 —
        `fd.scaleScores`는 sme에서 항상 비어 있다(DiagSme가 렌더링되지 않아
        wizard의 접두어 가드에 걸린다). 100점으로 환산하면 화면 어디에도 없는
        숫자가 표지에 대문짝만하게 실린다.
     ⚠ 0점(미응답) 영역은 평균에서 뺀다 — `classifyConsultingType`이 쓰는 규칙과
        같게 맞춘 것이다. 다르게 잡으면 표지 점수와 컨설팅 유형이 서로 다른
        모집단을 근거로 하게 된다. */
  function _smeOverall(fd) {
    const ds = (fd && fd.domainScores) || {};
    const vals = Object.keys(ds)
      .map(k => Number((ds[k] && ds[k].avg) || 0))
      .filter(v => v > 0);
    if (!vals.length) return null;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
  }

  /* ── sme 표지 ──
     남색 블록(상단 3.85in) 안에 회사명·유형·진단일·종합 점수·핵심 결론을 모두 담고,
     아래 흰 영역에는 면책 문구만 둔다. */
  function _smeCover(pptx, ctx) {
    const fd = ctx.fd || {}, d = ctx.data || {};
    _clippedInSlide = false;
    const s = pptx.addSlide();
    s.background = { color: TH.bg };

    const BH = 3.85;
    s.addShape('rect', { x: 0, y: 0, w: 10, h: BH, fill: { color: TH.navy } });
    s.addShape('rect', { x: 0, y: BH, w: 10, h: 0.06, fill: { color: TH.gold } });

    s.addText('BizNavi AI', {
      x: M.x, y: 0.42, w: 4.5, h: 0.3,
      fontFace: FONT, fontSize: 12, bold: true, color: TH.gold, charSpacing: 3,
    });
    /* ⚠ 회사명은 자르지 않는다 — 한 줄에 안 들어가면 글자를 줄이고 두 줄까지 쓴다 */
    const name = _txt(fd.companyName || 'BizNavi').replace(/\n/g, ' ');
    const nf = [[36, 1], [28, 1], [20, 2], [16, 2]].find(o => _wrap(name, 5.6, o[0], true).length <= o[1]) || [14, 3];
    s.addText(name, {
      x: M.x, y: 0.84, w: 5.6, h: 0.84, margin: PAD,
      fontFace: FONT, fontSize: nf[0], bold: true, color: TH.onNavy, valign: nf[1] > 1 ? 'middle' : 'top',
    });
    s.addText('경영전략 분석 보고서   ·   소기업·중소기업', {
      x: M.x, y: 1.72, w: 5.6, h: 0.3,
      fontFace: FONT, fontSize: 13, color: TH.onNavyDim,
    });
    s.addText('진단일  ' + _dateKr(), {
      x: M.x, y: 2.04, w: 5.6, h: 0.28,
      fontFace: FONT, fontSize: 11, color: TH.onNavyDim,
    });

    /* 종합 점수 패널 — 점수가 없으면 숫자 대신 미입력 안내를 둔다.
       ⚠ 0.0을 크게 띄우면 '진단 결과가 0점'으로 읽힌다 */
    const score = _smeOverall(fd);
    const PX = 6.35, PW = 3.1;
    s.addShape('rect', { x: PX, y: 0.72, w: PW, h: 1.95, fill: { color: TH.navyMid } });
    if (score != null) {
      s.addText(score.toFixed(1), {
        x: PX, y: 0.92, w: PW, h: 0.9,
        fontFace: FONT, fontSize: 52, bold: true, color: TH.gold, align: 'center',
      });
      s.addText('/ 5.0', {
        x: PX, y: 1.85, w: PW, h: 0.3,
        fontFace: FONT, fontSize: 14, color: TH.onNavyDim, align: 'center',
      });
      s.addText('5대 역량 종합 (5점 만점)', {
        x: PX, y: 2.22, w: PW, h: 0.3,
        fontFace: FONT, fontSize: 10, color: TH.onNavyDim, align: 'center',
      });
    } else {
      s.addText('진단 점수\n미입력', {
        x: PX, y: 1.25, w: PW, h: 0.9,
        fontFace: FONT, fontSize: 18, bold: true, color: TH.onNavyDim, align: 'center',
      });
    }

    /* 핵심 결론 한 줄 — 없으면 영역 자체를 비운다(빈 따옴표만 남기지 않는다) */
    /* ⚠ 자르지 않는다. 0.9in 안에 들어가는 글자 크기를 고르고, 11pt로도 안 들어가면
          표지에서는 빼고 다음 장(한눈에 보기) 제목·본문에 맡긴다 — 거기에 같은 문장이 전부 있다 */
    const lead = _sentence1(d.executiveSummary);
    const lf = lead && [14, 12, 11].find(pt => _textH(lead, M.w - 0.22, pt) <= 0.9);
    if (lf) {
      s.addShape('rect', { x: M.x, y: 2.86, w: 0.05, h: 0.62, fill: { color: TH.gold } });
      s.addText(lead, {
        x: M.x + 0.22, y: 2.84, w: M.w - 0.22, h: 0.9, margin: PAD,
        fontFace: FONT, fontSize: lf, color: TH.onNavy, valign: 'top',
      });
    }

    s.addText('본 자료는 진단 응답을 기반으로 자동 생성되었습니다. 최종 판단은 전문가 상담을 거치시기 바랍니다.', {
      x: M.x, y: 4.95, w: M.w, h: 0.3,
      fontFace: FONT, fontSize: 9, color: TH.muted, italic: true,
    });
    return s;
  }

  /* ══════════════════ sme 시각화 (2단계) ══════════════════
     ⚠ 아래 함수는 sme 경로(THEME)에서만 호출된다. `navy`·`onNavy` 등 THEME 전용 키를 쓴다. */

  /* ── 5대 역량 — 네이티브 레이더 + 막대 ──
     ⚠ 캔버스 이미지(_radarDataUrl)를 쓰지 않는다. 흐리고, 받은 사람이 숫자·색을 고칠 수 없다.
        PptxGenJS addChart는 PowerPoint 차트 객체(chart XML)로 들어가 '데이터 편집'이 된다.
     ⚠ 값은 fd.domainScores의 avg 그대로다 — 화면 막대·레이더·표지 점수와 같은 숫자.
        새로 계산하거나 반올림을 다시 하지 마라.
     ⚠ 미입력(0) 영역은 차트에서 뺀다. 0을 그리면 '0점'으로 읽힌다. 빠진 영역은 하단에 명시한다.
     ⚠ 레이더는 축이 3개 미만이면 모양이 성립하지 않는다 — 그때는 막대만 그린다.
        점수가 하나도 없으면 슬라이드를 만들지 않는다(표지가 이미 '미입력'을 보여 준다). */
  function _smeCompetencySlide(pptx, fd) {
    const doms = _smeDomains(fd);
    const scored = doms.filter(d => d.avg > 0);
    if (!scored.length) return null;

    const s = _newSlide(pptx, '5대 역량 진단', '역량 프로파일 · 5점 만점');
    const top = s._bodyTop, chartH = 4.62 - top - 0.3;
    const CT = pptx.ChartType || {};
    const axisBase = {
      valAxisMinVal: 0, valAxisMaxVal: 5, valAxisMajorUnit: 1,
      valAxisLabelFontFace: FONT, valAxisLabelFontSize: 8, valAxisLabelColor: TH.muted,
      catAxisLabelFontFace: FONT, catAxisLabelFontSize: 10, catAxisLabelColor: TH.body,
      valGridLine: { color: TH.rule, size: 0.5 },
      showLegend: false, showTitle: false,
    };

    const withRadar = scored.length >= 3;
    const barX = withRadar ? M.x + 4.55 : M.x;
    const barW = withRadar ? M.w - 4.55 : M.w;

    if (withRadar) {
      s.addText('역량 프로파일', { x: M.x, y: top, w: 4.3, h: 0.26,
        fontFace: FONT, fontSize: 11, bold: true, color: TH.title });
      /* ⚠ 레이더 축 라벨은 PowerPoint가 폭을 좁게 잡아 긴 이름을 낱말 중간에서 자른다
            ('차별화·경쟁우 / 위역량'). 가운뎃점이 있으면 그 뒤에서, 없으면 7자 이상일 때
            '역량' 앞에서 직접 줄을 바꾼다.
            플롯 영역(layout)을 줄이는 방법은 맨 위 라벨이 잘려 버렸고, 9pt로 줄여도 한 글자가 넘어갔다.
            막대 차트는 라벨 폭이 충분하므로 원래 이름을 그대로 쓴다 */
      const radarLabel = t => t.indexOf('·') > 0 ? t.replace('·', '·\n')
        : (t.length >= 7 && /역량$/.test(t)) ? t.slice(0, -2) + '\n역량' : t;
      s.addChart(CT.radar || 'radar', [{
        name: '역량 점수', labels: scored.map(d => radarLabel(d.label)), values: scored.map(d => d.avg),
      }], Object.assign({}, axisBase, {
        x: M.x, y: top + 0.3, w: 4.3, h: chartH,
        radarStyle: 'marker', chartColors: [TH.navy],
        lineSize: 2, lineDataSymbol: 'circle', lineDataSymbolSize: 7,
      }));
    }

    /* 가로 막대는 첫 항목을 맨 아래에 그린다 — 화면 순서(위→아래)와 맞추려고 뒤집는다 */
    const rev = scored.slice().reverse();
    s.addText('역량별 점수', { x: barX, y: top, w: barW, h: 0.26,
      fontFace: FONT, fontSize: 11, bold: true, color: TH.title });
    s.addChart(CT.bar || 'bar', [{
      name: '역량 점수', labels: rev.map(d => d.label), values: rev.map(d => d.avg),
    }], Object.assign({}, axisBase, {
      x: barX, y: top + 0.3, w: barW, h: chartH,
      barDir: 'bar', barGapWidthPct: 70,
      chartColors: rev.map(d => _levelOf(d.avg)[1]),   // 막대마다 수준 신호색
      showValue: true, dataLabelFormatCode: '0.0', dataLabelPosition: 'outEnd',
      dataLabelFontFace: FONT, dataLabelFontSize: 10, dataLabelColor: TH.body,
    }));

    /* 수준 범례 — 막대 색의 의미 (_levelOf 기준과 동일) */
    s.addText([
      { text: '■ 강점 4.0 이상   ', options: { color: TH.ok } },
      { text: '■ 보통 3.0 이상   ', options: { color: TH.title } },
      { text: '■ 취약 2.0 이상   ', options: { color: TH.high } },
      { text: '■ 위험 2.0 미만',     options: { color: TH.critical } },
    ], { x: barX, y: 4.66, w: barW, h: 0.26, fontFace: FONT, fontSize: 9, align: 'right' });

    const missing = doms.filter(d => !(d.avg > 0)).map(d => d.label);
    _footNote(s, missing.length ? '미입력 영역(차트 제외): ' + missing.join(', ') : '');
    return s;
  }

  /* ══════════════════ sme 3단계 — 분량 확대 · 넘침 처리 · 배치 ══════════════════
     ⚠ sme는 글자를 자르지 않는다(_clip·LIMIT 미사용 — 둘은 LEGACY 유형 전용으로 남았다).
        사용자 요구가 "글자는 많을수록 좋다 — PDF 수준"이다. 칸을 넘는 내용은 다음 장에
        이어 싣고 제목에 '(계속)'을 붙인다. 글자를 줄이거나 '…'로 끊는 방식으로 되돌리지 마라.
     ⚠ PptxGenJS는 글자 크기를 재지 않고 자동 축소도 하지 않는다. 그래서 _wrap이
        맑은 고딕 글자 폭을 **넉넉하게** 추정해 줄 수를 센다. 추정이 실제보다 크면 칸 아래에
        여백이 남을 뿐이지만, 작으면 글자가 칸 밖으로 넘친다 — 계수를 줄이지 마라.
        검증은 PowerPoint가 실제로 배치한 높이(TextRange.BoundHeight)로 했다(2026-09-22).
     ⚠ 배치 엔진은 둘이다.
        _smeCards — 카드 흐름. 카드를 행 단위로 쌓고, 행이 남은 높이에 안 들어가면
                    행의 카드 전부를 그 높이에서 쪼개 나머지를 다음 장 같은 칸에 '(계속)'으로 잇는다.
        _smeGrid  — 병렬 칸. SWOT·STP·4P·90일처럼 **칸의 위치가 의미**인 것. 칸 배치를 모든
                    장에서 유지하고 칸마다 남은 내용을 다음 장 같은 자리에 잇는다. */
  const PT = 1 / 72;       // 1pt = 1/72 inch
  const LH = 1.2;          // 줄 높이 배수 — PowerPoint 실측과 정확히 같다(BoundHeight = 1.2 × pt × 줄 수). 줄이지 마라
  const PAD = 4;           // 텍스트 상자 안쪽 여백(pt) — PptxGenJS margin은 pt 단위다
  const BUL = 12;          // 글머리 들여쓰기(pt)
  const BOTTOM = 5.08;     // 본문 하한(inch). 그 아래 5.16~5.44는 하단 안내 줄
  const GAP = 0.16;

  /* 글자 폭(em) — 한글 0.95(맑은 고딕 실제 약 0.93), 전각 기호 1.0, 영숫자 0.56~0.66, 공백 0.32.
     ⚠ 여유는 폭 쪽에만 있다(줄 높이 LH는 실측과 같다). 폭 계수를 더 줄이면 한 줄이 밀려 넘친다 */
  function _em(ch, bold) {
    const c = ch.charCodeAt(0);
    if (c === 0x20) return 0.32;
    if ((c >= 0x1100 && c <= 0x11FF) || (c >= 0x2E80 && c <= 0xD7AF) ||
        (c >= 0xF900 && c <= 0xFAFF) || (c >= 0xFF00 && c <= 0xFFEF)) return bold ? 1.0 : 0.95;   // Bold는 한글이 더 넓다(실측 넘침)
    if (c >= 0x2000 && c <= 0x2E7F) return 1.0;     // 화살표·원문자·말줄임표 등 기호
    if (c >= 0xD800 && c <= 0xDFFF) return 1.2;     // 이모지(서로게이트)
    if (/[A-Z0-9#%&@]/.test(ch)) return bold ? 0.7 : 0.66;
    if (/[a-z]/.test(ch)) return bold ? 0.6 : 0.56;
    return 0.45;                                    // 구두점·가운뎃점
  }
  function _wEm(s, bold) { let w = 0; for (const ch of s) w += _em(ch, bold); return w; }

  /* 줄 나누기 — PowerPoint 한글 기본값(어절 단위 줄바꿈)을 따른다.
     한 어절이 한 줄보다 길면 글자 단위로 끊고 hard 표시를 남긴다(다시 이을 때 공백을 넣지 않는다) */
  function _wrap(text, wIn, pt, bold) {
    const max = Math.max(1, (wIn - 2 * PAD * PT) / (pt * PT) * 0.97);
    const out = [];
    String(text).split('\n').forEach(para => {
      const words = para.split(' ').filter(Boolean);
      if (!words.length) { out.push({ s: '', hard: false }); return; }
      let line = '', lw = 0;
      words.forEach(w => {
        let ww = _wEm(w, bold);
        if (line && lw + 0.32 + ww <= max) { line += ' ' + w; lw += 0.32 + ww; return; }
        if (!line && ww <= max) { line = w; lw = ww; return; }
        if (line) { out.push({ s: line, hard: false }); line = ''; lw = 0; }
        while (ww > max) {
          let cut = '', cw = 0;
          for (const ch of w) { const e = _em(ch, bold); if (cw + e > max && cut) break; cut += ch; cw += e; }
          out.push({ s: cut, hard: true });
          w = w.slice(cut.length); ww = _wEm(w, bold);
        }
        line = w; lw = ww;
      });
      out.push({ s: line, hard: false });
    });
    return out;
  }
  function _joinLines(lines) {
    return lines.map((l, i) => (i && !lines[i - 1].hard ? ' ' : '') + l.s).join('');
  }
  function _textH(t, wIn, pt, bold) { return _wrap(t, wIn, pt, bold).length * pt * LH * PT + 2 * PAD * PT; }

  /* AI 텍스트 정리 — 태그·마크다운 굵게(**)를 지우되 줄바꿈은 문단으로 살린다 */
  function _txt(v) {
    if (Array.isArray(v)) v = v.map(_txt).join('\n');
    return String(v == null ? '' : v)
      .replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').replace(/\*\*/g, '')
      .replace(/[ \t ]+/g, ' ')
      .split('\n').map(s => s.trim()).filter(Boolean).join('\n');
  }
  /* 문단 — { t, pt, bold, italic, color, bullet, gap(앞 간격 pt), link } */
  function _P(t, o) { return Object.assign({ t: t, pt: 10.5 }, o || {}); }
  function _paras(v, o) { return _txt(v).split('\n').filter(Boolean).map(t => _P(t, o)); }
  function _label(t) { return _P(t, { pt: 9.5, bold: true, color: TH.accent, gap: 5, keep: true }); }

  function _parasH(paras, wIn) {
    if (!paras.length) return 0;
    return paras.reduce((h, p) => h + (p.gap || 0) * PT +
      _wrap(p.t, wIn - (p.bullet ? BUL * PT : 0), p.pt, p.bold).length * p.pt * LH * PT, 2 * PAD * PT);
  }

  /* 문단 목록을 높이 cap에 들어가는 앞부분과 나머지로 가른다. 글자는 한 자도 버리지 않는다.
     ⚠ 문단 중간에서 끊는 것은 4줄 이상인 문단뿐이고, 양쪽에 2줄 이상을 남긴다 —
        짧은 항목을 끊으면 마지막 낱말 하나만 다음 장으로 넘어가는 고아 줄이 생긴다(실제로 봤다).
        나머지 조각은 글머리 없이 이어 쓴다(새 항목처럼 보이지 않게).
     ⚠ keep(소제목·SWOT 항목명)은 다음 문단과 붙인다 — 칸 맨 아래에 제목만 남지 않게.
     force = 빈 칸인데도 아무것도 못 넣는 경우 — 규칙을 풀고 들어가는 만큼 끊는다(무한 반복 방지) */
  function _splitParas(paras, wIn, cap, force) {
    let used = 2 * PAD * PT;
    const fit = [];
    for (let i = 0; i < paras.length; i++) {
      const p = paras[i];
      const lines = _wrap(p.t, wIn - (p.bullet ? BUL * PT : 0), p.pt, p.bold);
      const lh = p.pt * LH * PT, g = (p.gap || 0) * PT;
      if (used + g + lines.length * lh <= cap) { fit.push(p); used += g + lines.length * lh; continue; }
      const k = Math.floor((cap - used - g) / lh);
      const rest = paras.slice(i + 1);
      const minK = (force && !fit.length) ? 1 : 2;
      if (k >= minK && k < lines.length && (lines.length - k >= minK) && (lines.length >= 4 || (force && !fit.length))) {
        fit.push(Object.assign({}, p, { t: _joinLines(lines.slice(0, k)) }));
        rest.unshift(Object.assign({}, p, { t: _joinLines(lines.slice(k)), bullet: false, gap: 0, keep: false }));
      } else {
        rest.unshift(Object.assign({}, p, { gap: 0 }));
        while (fit.length > 1 && fit[fit.length - 1].keep) rest.unshift(Object.assign({}, fit.pop(), { gap: 0 }));
      }
      return [fit, rest];
    }
    return [fit, []];
  }

  function _drawParas(s, paras, x, y, w) {
    if (!paras.length) return;
    s.addText(paras.map((p, i) => ({ text: p.t, options: Object.assign({
      fontSize: p.pt, bold: !!p.bold, italic: !!p.italic, color: p.color || TH.body,
      bullet: p.bullet ? { indent: BUL } : false,
      paraSpaceBefore: p.gap || 0,
      breakLine: i < paras.length - 1,
    }, p.link ? { hyperlink: { url: p.link } } : {}) })), {
      x: x, y: y, w: w, h: _parasH(paras, w), fontFace: FONT, margin: PAD, valign: 'top',
    });
  }

  /* 첫 문장 — 슬라이드 제목(결론)과 표지 한 줄에 쓴다. `[레이블]` 머리표는 지운다.
     ⚠ 마침표 뒤에 공백·끝을 전방탐색으로 요구한다 — 소수점(3.4)에서 끊기지 않게.
        한글 뒤에서는 `\b`가 절대 매치되지 않는다(주의사항 ①) */
  function _sentence1(raw) {
    const t = _txt(raw).replace(/\[[^\]]*\]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!t) return '';
    const m = t.match(/^[\s\S]*?[.!?](?=\s|$)/);
    return (m ? m[0] : t).trim();
  }

  /* ── 슬라이드 머리 — 제목은 그 섹션의 결론 한 문장 ──
     ⚠ 결론은 AI 결과 필드에서만 가져온다. 해당 필드가 없거나 두 줄에 안 들어가면
        섹션 이름을 그대로 쓴다(제목을 자르거나 지어내지 않는다). 결론 문장은 본문에도 그대로 있다.
     ⚠ 글자 크기는 '(계속)'이 붙은 긴 쪽으로 정한다 — 첫 장과 이어지는 장의 띠 높이가 같아야 한다 */
  function _titleFit(title) {
    const t = title + ' (계속)';
    const opt = [[20, 1], [18, 1], [17, 2], [15, 2]];
    for (let i = 0; i < opt.length; i++) {
      const n = _wrap(t, M.w, opt[i][0], true).length;
      if (n <= opt[i][1]) return { fs: opt[i][0], lines: n };
    }
    return null;
  }
  function _smeHead(conclusion, section, badge) { return _headOf(_sentence1(conclusion), section, badge); }
  /* 여러 필드를 이어 만든 제목(전략명·시스템명 + 진단 첫 문장)용 — 문장 추출 없이 그대로 판정 */
  function _headOf(t, section, badge) {
    return { title: (t && _titleFit(t)) ? t : section, badge: badge || '' };
  }
  function _smeSlide(pptx, head, cont) {
    const fit = _titleFit(head.title) || { fs: 15, lines: 2 };
    const s = pptx.addSlide();
    s.background = { color: TH.bg };
    const th = fit.lines * fit.fs * LH * PT + 2 * PAD * PT;
    const bh = 0.14 + th + (head.badge ? 0.3 : 0) + 0.1;
    s.addShape('rect', { x: 0, y: 0, w: 10, h: bh, fill: { color: TH.navy } });
    s.addShape('rect', { x: 0, y: bh, w: 10, h: 0.05, fill: { color: TH.gold } });
    s.addText(head.title + (cont ? ' (계속)' : ''), {
      x: M.x, y: 0.14, w: M.w, h: th, margin: PAD, valign: 'top',
      fontFace: FONT, fontSize: fit.fs, bold: true, color: TH.onNavy,
    });
    if (head.badge) {
      s.addText(head.badge, { x: M.x, y: 0.14 + th, w: M.w, h: 0.3, margin: PAD, valign: 'top',
        fontFace: FONT, fontSize: 10, color: TH.onNavyDim });
    }
    s._bodyTop = bh + 0.05 + 0.2;
    return s;
  }
  /* 하단 줄 — 왼쪽 안내(선택) · 오른쪽 '다음 장에 계속' */
  function _smeFoot(s, note, more) {
    if (note) {
      const w = M.w - 2.2;
      s.addText('※ ' + note, { x: M.x, y: 5.16, w: w, h: _textH('※ ' + note, w, 9), margin: PAD, valign: 'top',
        fontFace: FONT, fontSize: 9, color: TH.muted, italic: true });
    }
    if (more) {
      s.addText('다음 장에 계속 →', { x: M.x + M.w - 2.1, y: 5.16, w: 2.1, h: 0.28, margin: PAD, align: 'right',
        fontFace: FONT, fontSize: 9, bold: true, color: TH.accent });
    }
  }

  /* ── 큰 숫자 띠 — 숫자를 본문에서 떼어 크게 보인다 ──
     tiles: [{ num, unit, label, color }]. 값은 화면이 쓰는 값을 그대로 받는다(새로 계산하지 않는다) */
  function _smeStrip(s, y, tiles) {
    const n = tiles.length, w = (M.w - GAP * (n - 1)) / n, iw = w - 0.2;
    const lh = Math.max.apply(null, tiles.map(t => _textH(t.label, iw, 9.5)));
    const h = 0.5 + lh + 0.06;
    tiles.forEach((t, i) => {
      const x = M.x + i * (w + GAP);
      s.addShape('rect', { x: x, y: y, w: w, h: h, fill: { color: TH.titleBg } });
      s.addShape('rect', { x: x, y: y, w: w, h: 0.04, fill: { color: t.color || TH.accent } });
      s.addText([{ text: String(t.num), options: { fontSize: 22, bold: true, color: t.color || TH.accent } }]
        .concat(t.unit ? [{ text: ' ' + t.unit, options: { fontSize: 11, color: TH.muted } }] : []), {
        x: x + 0.1, y: y + 0.06, w: iw, h: 0.46, margin: PAD, valign: 'middle', fontFace: FONT });
      s.addText(t.label, { x: x + 0.1, y: y + 0.5, w: iw, h: lh, margin: PAD, valign: 'top',
        fontFace: FONT, fontSize: 9.5, color: TH.body });
    });
    return y + h + 0.18;
  }

  /* ── 카드 ── { tag:{t,color}, title, big:[{t,pt,color,bold}], progress, paras, accent, bg, full } */
  function _cardH(c, w) {
    const iw = w - 0.24;
    let h = 0.2;
    if (c.tag) h += _textH(c.tag.t, iw, 9, true);
    if (c.title) h += _textH(c.title, iw, 12, true);
    if (c.big) h += _bigH(c.big, iw);
    if (c.progress != null) h += 0.16;
    return h + _parasH(c.paras || [], iw);
  }
  /* 큰 숫자 줄 — 런 { t, pt, color, bold, br(뒤에서 줄바꿈) } */
  function _bigH(big, iw) {
    const lines = [[]];
    big.forEach(r => { lines[lines.length - 1].push(r); if (r.br) lines.push([]); });
    return lines.filter(l => l.length).reduce((h, l) => {
      const pt = Math.max.apply(null, l.map(r => r.pt || 17));
      return h + _wrap(l.map(r => r.t).join(''), iw, pt, true).length * pt * LH * PT;
    }, 2 * PAD * PT);
  }
  function _drawCard(s, c, x, y, w, h) {
    s.addShape('rect', { x: x, y: y, w: w, h: h, fill: { color: c.bg || TH.panel } });
    s.addShape('rect', { x: x, y: y, w: 0.06, h: h, fill: { color: c.accent || TH.accent } });
    const ix = x + 0.14, iw = w - 0.24;
    let cy = y + 0.1;
    if (c.tag) {
      const th = _textH(c.tag.t, iw, 9, true);
      s.addText(c.tag.t, { x: ix, y: cy, w: iw, h: th, margin: PAD, valign: 'top',
        fontFace: FONT, fontSize: 9, bold: true, color: c.tag.color || TH.muted });
      cy += th;
    }
    if (c.title) {
      const th = _textH(c.title, iw, 12, true);
      s.addText(c.title, { x: ix, y: cy, w: iw, h: th, margin: PAD, valign: 'top',
        fontFace: FONT, fontSize: 12, bold: true, color: TH.title });
      cy += th;
    }
    if (c.big) {
      const bh = _bigH(c.big, iw);
      s.addText(c.big.map(r => ({ text: r.t, options: {
        fontSize: r.pt || 17, bold: r.bold !== false, color: r.color || TH.accent, breakLine: !!r.br } })), {
        x: ix, y: cy, w: iw, h: bh, margin: PAD, valign: 'top', fontFace: FONT });
      cy += bh;
    }
    if (c.progress != null) {
      const bw = iw - 2 * PAD * PT, pct = Math.max(0, Math.min(100, c.progress));
      s.addShape('rect', { x: ix + PAD * PT, y: cy + 0.04, w: bw, h: 0.07, fill: { color: TH.rule } });
      if (pct > 0) s.addShape('rect', { x: ix + PAD * PT, y: cy + 0.04, w: bw * pct / 100, h: 0.07, fill: { color: TH.accent } });
      cy += 0.16;
    }
    _drawParas(s, c.paras || [], ix, cy, iw);
  }

  /* 한 행을 높이 avail에 맞춰 쪼갠다 — [들어가는 행, 다음 장에 이을 행] 또는 null(통째로 넘김).
     이을 카드는 제목에 '(계속)'만 달고 태그·큰 숫자는 반복하지 않는다(같은 숫자가 두 번 보이지 않게).
     force = 새 장 맨 위 — 여기서도 안 쪼개면 영영 못 싣는다 */
  function _splitRow(row, w, avail, force, pageH) {
    const iw = w - 0.24, minLines = 2 * 10.5 * LH * PT + 2 * PAD * PT;
    /* ⚠ 새 장 절반 이하 높이의 행은 쪼개지 않고 통째로 넘긴다 — 진단 문장만 이 장에, 실행 액션은
          다음 장에 가는 식으로 짧은 카드가 갈라지는 것을 실제로 봤다. 쪼개는 것은 긴 카드뿐이다 */
    if (!force && Math.max.apply(null, row.map(c => c ? _cardH(c, w) : 0)) <= pageH * 0.5) return null;
    const fitRow = [], restRow = [];
    for (let i = 0; i < row.length; i++) {
      const c = row[i];
      if (!c) { fitRow.push(null); restRow.push(null); continue; }
      const fixed = _cardH(Object.assign({}, c, { paras: [] }), w);
      const cap = avail - fixed;
      if (_cardH(c, w) <= avail) { fitRow.push(c); restRow.push(null); continue; }
      if (cap < minLines && !force) return null;
      const sp = _splitParas(c.paras || [], iw, cap, force);
      if (!sp[0].length && !force) return null;
      fitRow.push(Object.assign({}, c, { paras: sp[0] }));
      restRow.push(sp[1].length ? { title: (c.baseTitle || c.title || '') + ' (계속)', baseTitle: c.baseTitle || c.title,
        paras: sp[1], accent: c.accent, bg: c.bg, full: c.full } : null);
    }
    return [fitRow, restRow.some(Boolean) ? restRow : null];
  }

  /* ── 카드 흐름 엔진 ── opt: { cols, strip, note }. 만든 장 수를 돌려준다 */
  function _smeCards(pptx, head, cards, opt) {
    cards = (cards || []).filter(Boolean);
    if (!cards.length) return 0;
    const o = opt || {}, cols = o.cols || 2;
    const colW = (M.w - GAP * (cols - 1)) / cols;
    const rows = [];
    let cur = [];
    cards.forEach(c => {
      if (c.full) { if (cur.length) rows.push(cur); rows.push([c]); cur = []; return; }
      cur.push(c);
      if (cur.length === cols) { rows.push(cur); cur = []; }
    });
    if (cur.length) rows.push(cur);
    const wOf = row => (row.length === 1 && row[0] && row[0].full) ? M.w : colW;
    const hOf = (row, w) => Math.max.apply(null, row.map(c => c ? _cardH(c, w) : 0));
    const draw = (s, row, y, w, h) => row.forEach((c, i) => { if (c) _drawCard(s, c, M.x + i * (w + GAP), y, w, h); });

    const pages = [];
    let s = null, y = 0, placed = 0;
    const open = () => {
      s = _smeSlide(pptx, head, pages.length > 0);
      pages.push(s);
      y = s._bodyTop; placed = 0;
      if (pages.length === 1 && o.strip && o.strip.length) y = _smeStrip(s, y, o.strip);
    };
    open();
    const queue = rows.slice();
    let guard = 0;
    while (queue.length && guard++ < 300) {
      const row = queue.shift(), w = wOf(row), h = hOf(row, w);
      if (y + h <= BOTTOM) { draw(s, row, y, w, h); y += h + GAP; placed++; continue; }
      const sp = _splitRow(row, w, BOTTOM - y, placed === 0, BOTTOM - s._bodyTop);
      if (sp) {
        draw(s, sp[0], y, w, hOf(sp[0], w)); placed++;
        if (sp[1]) queue.unshift(sp[1]);
        if (queue.length) open();
        continue;
      }
      queue.unshift(row);
      open();
    }
    pages.forEach((p, i) => _smeFoot(p, o.note, i < pages.length - 1));
    return pages.length;
  }

  /* ── 병렬 칸 엔진 ── cells: [{ label, color, bg, paras }]
     opt: { perRow, headH, drawHead(s, cell, i, x, y, w, hh, contCell) , note } */
  function _smeGrid(pptx, head, cells, opt) {
    if (!cells.some(c => c.paras.length)) return 0;
    const o = opt || {}, per = o.perRow || cells.length;
    const nRows = Math.ceil(cells.length / per);
    const w = (M.w - GAP * (per - 1)) / per, iw = w - 0.24, hh = o.headH || 0.36;
    const rem = cells.map(c => c.paras.slice());
    const started = cells.map(() => false);
    const pages = [];
    let guard = 0;
    while (guard++ < 40) {
      const cont = pages.length > 0;
      const s = _smeSlide(pptx, head, cont);
      pages.push(s);
      const top = s._bodyTop, ch = (BOTTOM - top - GAP * (nRows - 1)) / nRows;
      cells.forEach((c, i) => {
        const x = M.x + (i % per) * (w + GAP), y = top + Math.floor(i / per) * (ch + GAP);
        s.addShape('rect', { x: x, y: y, w: w, h: ch, fill: { color: c.bg || TH.panel } });
        (o.drawHead || _gridHeadBar)(s, c, i, x, y, w, hh, started[i] && rem[i].length > 0);
        if (!rem[i].length) {
          s.addText(c.paras.length ? '앞 장에 모두 표시했습니다' : '분석 결과에 항목이 없습니다', {
            x: x + 0.12, y: y + hh + 0.08, w: iw, h: 0.3, margin: PAD,
            fontFace: FONT, fontSize: 9.5, color: TH.muted, italic: true });
          return;
        }
        const sp = _splitParas(rem[i], iw, ch - hh - 0.14, true);   // 칸은 매 장 비어 있다
        _drawParas(s, sp[0], x + 0.12, y + hh + 0.08, iw);
        if (sp[0].length) started[i] = true;
        rem[i] = sp[1];
      });
      if (!rem.some(r => r.length)) break;
    }
    pages.forEach((p, i) => _smeFoot(p, o.note, i < pages.length - 1));
    return pages.length;
  }
  function _gridHeadBar(s, c, i, x, y, w, hh, contCell) {
    s.addShape('rect', { x: x, y: y, w: w, h: hh, fill: { color: c.color || TH.navy } });
    s.addText(c.label + (contCell ? ' (계속)' : ''), { x: x + 0.1, y: y, w: w - 0.2, h: hh, margin: PAD,
      fontFace: FONT, fontSize: 12, bold: true, color: TH.bg, valign: 'middle' });
  }

  /* ══════════════════ sme 섹션 — 화면 8섹션 순서 ══════════════════
     필드는 화면(dashboard.js render·render* 함수)이 읽는 것과 같다. 화면에 있는 필드를 빼지 마라 */

  /* ① 한눈에 보기 — [레이블] 단락을 카드로 */
  function _smeExec(pptx, fd, d) {
    const raw = _txt(d.executiveSummary);
    if (!raw) return;
    const cards = raw.split(/(?=\[)/).map(part => {
      const m = part.match(/^\[([^\]]+)\]([\s\S]*)/);
      const body = m ? m[2] : part;
      if (!_txt(body)) return null;
      return { title: m ? m[1].trim() : '요약', paras: _paras(body) };
    }).filter(Boolean);
    if (!cards.length) return;
    if (cards.length === 1) cards[0].full = true;

    /* 숫자 띠 — 표지 종합 점수와 5대 역량 차트가 쓰는 fd.domainScores 그대로 */
    const doms = _smeDomains(fd).filter(x => x.avg > 0);
    const strip = [];
    const overall = _smeOverall(fd);
    if (overall != null) strip.push({ num: overall.toFixed(1), unit: '/ 5.0', label: '5대 역량 종합' });
    if (doms.length >= 2) {
      const sorted = doms.slice().sort((a, b) => b.avg - a.avg);
      const hi = sorted[0], lo = sorted[sorted.length - 1];
      strip.push({ num: hi.avg.toFixed(1), unit: '/ 5.0', label: '가장 높은 역량 · ' + hi.label, color: _levelOf(hi.avg)[1] });
      strip.push({ num: lo.avg.toFixed(1), unit: '/ 5.0', label: '가장 낮은 역량 · ' + lo.label, color: _levelOf(lo.avg)[1] });
    }
    _smeCards(pptx, _smeHead(d.executiveSummary, '한눈에 보기', '한눈에 보기 · Executive Summary'),
      cards, { cols: 2, strip: strip });
  }

  /* ② 우리 회사 지금 상태 — 유형별 특화 분석(요약 + 블록) */
  function _smeSpec(pptx, spec) {
    if (!spec || !spec.blocks || !spec.blocks.length) return;
    const fw = _txt(spec.framework) || '특화 분석';
    const cards = [];
    if (_txt(spec.summary)) cards.push({ full: true, tag: { t: fw, color: TH.accent }, title: '요약',
      paras: _paras(spec.summary), accent: TH.navy, bg: TH.titleBg });
    spec.blocks.forEach((b, i) => {
      if (!b) return;
      cards.push({ title: (i + 1) + '. ' + _txt(b.label).replace(/\n/g, ' '), paras: _paras(b.content || '—') });
    });
    _smeCards(pptx, _smeHead(spec.summary, '유형별 특화 분석', '우리 회사 지금 상태 · ' + fw), cards, { cols: 2 });
  }

  /* ③ 강점과 약점 — SWOT 2×2. 항목과 근거(evidence)를 모두 싣는다 */
  function _smeSwot(pptx, swot) {
    if (!swot) return;
    const items = arr => (arr || []).reduce((out, v) => {
      const item = _txt(typeof v === 'object' && v ? (v.item || v.text || '') : v).replace(/\n/g, ' ');
      const ev = typeof v === 'object' && v ? _txt(v.evidence).replace(/\n/g, ' ') : '';
      if (item) out.push(_P(item, { bullet: true, bold: true, gap: out.length ? 5 : 0, keep: !!ev }));
      if (ev) out.push(_P('근거: ' + ev, { pt: 9.5, color: TH.muted, gap: 1 }));
      return out;
    }, []);
    const cells = [
      { label: '강점 (S)', paras: items(swot.strengths),     color: TH.ok,       bg: TH.okBg },
      { label: '약점 (W)', paras: items(swot.weaknesses),    color: TH.critical, bg: TH.criticalBg },
      { label: '기회 (O)', paras: items(swot.opportunities), color: TH.title,    bg: TH.titleBg },
      { label: '위협 (T)', paras: items(swot.threats),       color: TH.high,     bg: TH.highBg },
    ];
    _smeGrid(pptx, { title: '강점과 약점', badge: '전략 환경 · SWOT 매트릭스' }, cells, { perRow: 2 });
  }

  /* ④ 누구에게 무엇을 팔 것인가 — STP 3칸 (결론 = 포지셔닝) */
  function _smeStp(pptx, stp) {
    if (!stp) return;
    const cells = [
      { label: '세분화 · Segmentation', letter: 'S', paras: _paras(stp.segmentation) },
      { label: '타겟팅 · Targeting',   letter: 'T', paras: _paras(stp.targeting || stp.target) },
      { label: '포지셔닝 · Positioning', letter: 'P', paras: _paras(stp.positioning) },
    ];
    _smeGrid(pptx, _smeHead(stp.positioning, '고객 세분화 · 타겟 · 포지셔닝', '누구에게 무엇을 팔 것인가 · STP'),
      cells, { perRow: 3, headH: 0.5, drawHead: function (s, c, i, x, y, w, hh, contCell) {
        s.addShape('rect', { x: x, y: y, w: w, h: hh, fill: { color: TH.navy } });
        s.addText(c.letter, { x: x + 0.08, y: y, w: 0.45, h: hh, margin: 0, align: 'center', valign: 'middle',
          fontFace: FONT, fontSize: 22, bold: true, color: TH.gold });
        s.addText(c.label + (contCell ? ' (계속)' : ''), { x: x + 0.55, y: y, w: w - 0.65, h: hh, margin: PAD,
          valign: 'middle', fontFace: FONT, fontSize: 10.5, bold: true, color: TH.onNavy });
      } });
  }

  /* ④ 사업 모델 한 장 요약 — 린 캔버스 9블록 (결론 = 핵심 가치 제안) */
  const LEAN_BLOCKS = [
    ['problem', '핵심 문제 · Problem'], ['solution', '해결책 · Solution'],
    ['uniqueValueProposition', '핵심 가치 제안 · Unique Value Prop.'], ['unfairAdvantage', '모방 불가 강점 · Unfair Advantage'],
    ['customerSegments', '타겟 고객 · Customer Segments'], ['keyMetrics', '핵심 지표 · Key Metrics'],
    ['channels', '채널 · Channels'], ['costStructure', '비용 구조 · Cost Structure'],
    ['revenueStreams', '수익 흐름 · Revenue Streams'],
  ];
  function _smeLean(pptx, lc) {
    if (!lc || !LEAN_BLOCKS.some(b => _txt(lc[b[0]]))) return;
    /* 화면은 빈 블록을 '—'로 두고 9칸을 모두 그린다 — 칸 구성을 유지한다 */
    const cards = LEAN_BLOCKS.map(b => ({ title: b[1], paras: _txt(lc[b[0]]) ? _paras(lc[b[0]])
      : [_P('—', { color: TH.muted })], accent: b[0] === 'uniqueValueProposition' ? TH.navy : TH.accent }));
    _smeCards(pptx, _smeHead(lc.uniqueValueProposition, '사업 모델 한 장 요약 (린 캔버스)',
      '누구에게 무엇을 팔 것인가 · 린 캔버스'), cards, { cols: 3 });
  }

  /* ⑤ 어떻게 알릴 것인가 — 4P 2×2 (AI 결과에 4P 전체 결론 필드가 없어 섹션 이름을 쓴다) */
  function _smeFourP(pptx, fp) {
    if (!fp) return;
    _smeGrid(pptx, { title: '어떻게 알릴 것인가', badge: '마케팅 전략 · 4P' }, [
      { label: '제품 전략 · Product',   paras: _paras(fp.product),   color: TH.navy },
      { label: '가격 전략 · Price',     paras: _paras(fp.price),     color: TH.navyMid },
      { label: '유통 전략 · Place',     paras: _paras(fp.place),     color: TH.navyMid },
      { label: '촉진 전략 · Promotion', paras: _paras(fp.promotion), color: TH.navy },
    ], { perRow: 2 });
  }

  /* ⑥ 무엇부터 할 것인가 — 핵심 전략 (결론 = 우선순위 '높음' 첫 전략의 제목) */
  const PRIORITY = { high: ['높음', 'critical'], medium: ['보통', 'high'], low: ['낮음', 'medium'] };
  function _smeStrategies(pptx, list) {
    const ks = (list || []).filter(Boolean);
    if (!ks.length) return;
    const cards = ks.map((x, i) => {
      const pr = PRIORITY[x.priority];
      const paras = _paras(x.description || x.detail || x.action);
      const meta = [x.owner && ('담당: ' + _txt(x.owner)), x.timeline && ('기간: ' + _txt(x.timeline))].filter(Boolean);
      if (meta.length) paras.push(_P(meta.join('  ·  ').replace(/\n/g, ' '), { pt: 9.5, color: TH.muted, gap: 5 }));
      return { tag: pr ? { t: '우선순위 ' + pr[0], color: TH[pr[1]] } : null,
        title: (i + 1) + '. ' + _txt(x.title || x.name || x.strategy).replace(/\n/g, ' '), paras: paras };
    });
    const top = ks.find(x => x.priority === 'high');
    const concl = top && _txt(top.title) ? '최우선 전략: ' + _txt(top.title).replace(/\n/g, ' ') : '';
    _smeCards(pptx, _headOf(concl, '핵심 전략', '무엇부터 할 것인가 · 핵심 전략 ' + ks.length + '가지'), cards, { cols: 2 });
  }

  /* ⑥ 사업 체질 — 6가지 비즈니스 시스템 (결론 = 첫 취약 시스템의 이름 — 진단 첫 문장)
     ⚠ 상태 판정은 화면(renderSixSystems)과 같다: '강점'·'보통' 외에는 전부 취약으로 칠한다 */
  function _sysColor(st) { return st === '강점' ? TH.ok : st === '보통' ? TH.title : TH.high; }
  function _smeSystems(pptx, list) {
    const sys = (list || []).filter(Boolean);
    if (!sys.length) return;
    const cards = sys.map(x => {
      const st = _txt(x.status);
      const paras = _paras(x.issue);
      const acts = (x.actions || []).map(a => _txt(a && typeof a === 'object' ? (a.action || a.task || '') : a).replace(/\n/g, ' ')).filter(Boolean);
      if (acts.length) {
        paras.push(_label('즉시 실행 액션'));
        acts.forEach((a, i) => paras.push(_P((i + 1) + ') ' + a, { pt: 10 })));
      }
      if (_txt(x.resource)) paras.push(_P('참고: ' + _txt(x.resource).replace(/\n/g, ' '), { pt: 9.5, color: TH.muted, gap: 5 }));
      return { tag: st ? { t: st, color: _sysColor(st) } : null, title: _txt(x.name || x.system).replace(/\n/g, ' '),
        paras: paras, accent: _sysColor(st) };
    });
    /* 숫자 띠 — 상태별 개수 (AI가 붙인 상태값 그대로, 등장 순서대로) */
    const count = {};
    sys.forEach(x => { const st = _txt(x.status) || '상태 미표기'; count[st] = (count[st] || 0) + 1; });
    const strip = Object.keys(count).slice(0, 4).map(k => ({ num: count[k], unit: '개', label: k, color: _sysColor(k) }));
    const weak = sys.find(x => { const st = _txt(x.status); return st && st !== '강점' && st !== '보통'; });
    const concl = weak && _sentence1(weak.issue) ? _txt(weak.name || weak.system).replace(/\n/g, ' ') + ' — ' + _sentence1(weak.issue) : '';
    _smeCards(pptx, _headOf(concl, '사업 체질 — 6가지 비즈니스 시스템', '무엇부터 할 것인가 · 비즈니스 시스템 ' + sys.length + '가지'),
      cards, { cols: 3, strip: strip });
  }

  /* ⑦ KPI — 현재값·목표값을 큰 숫자로
     ⚠ 지표명이 없거나 현재·목표가 둘 다 없는 항목은 카드를 만들지 않는다(2단계 규칙 유지) */
  function _smeKpi(pptx, list) {
    const all = (list || []).filter(k => k && _txt(k.metric || k.name || k.indicator) && (_txt(k.current) || _txt(k.target)));
    if (!all.length) return;
    const cards = all.map(k => {
      const cur = _txt(k.current).replace(/\n/g, ' '), tgt = _txt(k.target).replace(/\n/g, ' ');
      const big = [];
      /* ⚠ 현재·목표를 한 줄에 이어 쓰면 '4,000만 / 원'처럼 낱말 중간에서 꺾인다(실제로 봤다) — 줄을 나눈다 */
      if (cur) big.push({ t: '현재 ', pt: 10, bold: false, color: TH.muted }, { t: cur, pt: 15, color: TH.body, br: !!tgt });
      if (tgt) big.push({ t: '목표 ', pt: 10, bold: false, color: TH.muted }, { t: tgt, pt: 17, color: TH.accent });
      const paras = [];
      const meta = [_txt(k.timeline) && ('기간 ' + _txt(k.timeline)), _txt(k.owner) && ('담당 ' + _txt(k.owner))].filter(Boolean);
      if (meta.length) paras.push(_P(meta.join('  ·  ').replace(/\n/g, ' '), { pt: 9.5 }));
      if (_txt(k.method)) paras.push(_P('측정 방법: ' + _txt(k.method).replace(/\n/g, ' '), { pt: 9.5, color: TH.muted }));
      const pg = Number(k.progress);
      return { title: _txt(k.metric || k.name || k.indicator).replace(/\n/g, ' '), big: big,
        progress: (k.progress != null && k.progress !== '' && isFinite(pg)) ? pg : null, paras: paras };
    });
    _smeCards(pptx, { title: '무엇을 숫자로 볼 것인가 (KPI)', badge: '90일 실행 계획 · 현재 → 목표 ' + all.length + '개 지표' },
      cards, { cols: 3 });
  }

  /* ⑦ 단계별 실행 로드맵 — 단계마다 카드 (기간·예산·프레임워크·과제) */
  function _smeRoadmap(pptx, list) {
    const rm = (list || []).filter(Boolean);
    if (!rm.length) return;
    const cards = rm.map((p, i) => {
      const paras = [];
      if (_txt(p.framework)) paras.push(_P(_txt(p.framework).replace(/\n/g, ' '), { pt: 9.5, italic: true, color: TH.muted }));
      (p.tasks || p.items || []).forEach(t => {
        const s = _txt(t && typeof t === 'object' ? (t.task || t.action || '') : t).replace(/\n/g, ' ');
        if (s) paras.push(_P(s, { bullet: true, pt: 10, gap: 2 }));
      });
      return { tag: _txt(p.period) ? { t: _txt(p.period).replace(/\n/g, ' '), color: TH.accent } : null,
        title: _txt(p.phase || p.title).replace(/\n/g, ' ') || ((i + 1) + '단계'),
        big: _txt(p.budget) ? [{ t: '예산 ', pt: 11, bold: false, color: TH.muted }, { t: _txt(p.budget).replace(/\n/g, ' '), pt: 15 }] : null,
        paras: paras, accent: TH.navy };
    });
    _smeCards(pptx, { title: '단계별 실행 로드맵', badge: '90일 실행 계획 · ' + rm.length + '단계' }, cards,
      { cols: Math.min(rm.length, 3) });
  }

  /* ⑦ 90일 즉시 실행 플랜 — 월별 칸 (화살표 머리) */
  function _monthLabel(m, i) {
    const v = m && m.month;
    if (v == null || v === '') return (i + 1) + '개월차';
    const t = _txt(v).replace(/\n/g, ' ');
    return /^\d+$/.test(t) ? t + '개월차' : t;
  }
  function _smePlan90(pptx, list) {
    const p90 = (list || []).filter(Boolean);
    if (!p90.length) return;
    const cells = p90.map((m, i) => {
      const paras = [];
      const theme = _txt(m.theme || m.focus).replace(/\n/g, ' ');
      if (theme) paras.push(_P(theme, { pt: 11.5, bold: true, color: TH.title }));
      if (_txt(m.goal)) { paras.push(_label('이달 목표')); paras.push.apply(paras, _paras(m.goal, { pt: 10 })); }
      const acts = (m.actions || m.tasks || []).map(t => _txt(t && typeof t === 'object' ? (t.action || t.task || '') : t).replace(/\n/g, ' ')).filter(Boolean);
      if (acts.length) { paras.push(_label('핵심 실행 과제')); acts.forEach(a => paras.push(_P(a, { bullet: true, pt: 10, gap: 2 }))); }
      if (_txt(m.expectedResult)) { paras.push(_label('기대 효과')); paras.push.apply(paras, _paras(m.expectedResult, { pt: 10 })); }
      const gov = _txt(m.govSupport || m.support);
      if (gov) { paras.push(_label('활용 지원사업')); paras.push.apply(paras, _paras(gov, { pt: 10 })); }
      return { label: _monthLabel(m, i), paras: paras };
    });
    _smeGrid(pptx, { title: '90일 즉시 실행 플랜', badge: '90일 실행 계획 · 월별 과제' }, cells, {
      perRow: Math.min(cells.length, 3), headH: 0.42,
      drawHead: function (s, c, i, x, y, w, hh, contCell) {
        s.addShape((i % 3) === 0 ? 'homePlate' : 'chevron', { x: x, y: y, w: w, h: hh,
          fill: { color: (i % 3) === 1 ? TH.navyMid : TH.navy } });
        s.addText(c.label + (contCell ? ' (계속)' : ''), { x: x + ((i % 3) === 0 ? 0.1 : 0.3), y: y, w: w - 0.6, h: hh,
          margin: PAD, valign: 'middle', fontFace: FONT, fontSize: 12, bold: true, color: TH.onNavy });
      } });
  }

  /* ⑧ 정부지원사업 — 화면(renderGovSection)과 같은 목록 전부 */
  function _smeGov(pptx, fd) {
    const list = _govList(fd);
    if (!list.length) return;
    const cards = list.map(p => {
      const paras = [_P('지원 형태: ' + (_txt(p.supportType || p.amount).replace(/\n/g, ' ') || '지원 형태 확인 필요'), { pt: 10, bold: true, color: TH.title })];
      paras.push.apply(paras, _paras(p.summary, { pt: 10, gap: 3 }));
      if (p.url) paras.push(_P('신청 정보: ' + p.url, { pt: 9, color: TH.muted, gap: 4, link: p.url }));
      const tag = [_txt(p.org).replace(/\n/g, ' '), p.score != null ? '매칭 ' + p.score + '점' : ''].filter(Boolean).join('  ·  ');
      return { tag: tag ? { t: tag, color: TH.accent } : null, title: _txt(p.name).replace(/\n/g, ' '), paras: paras, accent: TH.navy };
    });
    _smeCards(pptx, { title: '정부지원사업', badge: '상시 지원사업 · 매칭 ' + list.length + '건' }, cards,
      { cols: 2, note: '지원 규모·마감일은 매년 변경됩니다. 신청 전 주관기관 공고를 확인하십시오.' });
  }

  /* ══════════════════ 공통 슬라이드 ══════════════════ */
  function _cover(pptx, title, org, sub) {
    const s = pptx.addSlide();
    s.background = { color: TH.bg };
    s.addText('BizNavi AI', {
      x: M.x, y: 1.5, w: M.w, h: 0.36,
      fontFace: FONT, fontSize: 14, bold: true, color: TH.accent, charSpacing: 2,
    });
    s.addShape('rect', { x: M.x, y: 1.95, w: 2.2, h: 0.03, fill: { color: TH.accent } });
    s.addText(_clip(title, 40), {
      x: M.x, y: 2.2, w: M.w, h: 0.7,
      fontFace: FONT, fontSize: 32, bold: true, color: TH.title,
    });
    s.addText(_clip(org || 'BizNavi', 40), {
      x: M.x, y: 3.0, w: M.w, h: 0.45,
      fontFace: FONT, fontSize: 18, color: TH.body,
    });
    s.addText(_clip(sub, 60), {
      x: M.x, y: 3.5, w: M.w, h: 0.3,
      fontFace: FONT, fontSize: 12, color: TH.muted,
    });
    s.addText('본 자료는 진단 응답을 기반으로 자동 생성되었습니다. 최종 판단은 전문가 상담을 거치시기 바랍니다.', {
      x: M.x, y: 4.9, w: M.w, h: 0.3,
      fontFace: FONT, fontSize: 9, color: TH.muted, italic: true,
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

  function _govList(fd) {
    let list = [];
    try {
      list = (fd && fd.govPrograms) || (typeof window !== 'undefined' && window._govPrograms) || [];
      if ((!list || !list.length) && typeof GovSupport !== 'undefined') list = GovSupport.match(fd) || [];
    } catch (e) { list = []; }
    return list || [];
  }
  function _govSlide(pptx, fd) {
    const list = _govList(fd);
    if (!list.length) return null;
    const s = _newSlide(pptx, '정부지원사업', '상시 지원사업 · 공고 확인 필요');
    _bullets(s, list.slice(0, 5).map(p => ({
      t: _plain(p.name),
      sub: '[' + _plain(p.org) + '] ' + _plain(p.supportType || p.amount || ''),
    })), { max: 5, rowH: 0.66 });
    s.addText('※ 지원 규모·마감일은 매년 변경됩니다. 신청 전 주관기관 공고를 확인하십시오.', {
      x: M.x, y: 4.75, w: M.w, h: 0.3, fontFace: FONT, fontSize: 9, color: TH.muted, italic: true,
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
        fontFace: FONT, fontSize: 14, color: TH.body, valign: 'top',
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
      s.addShape('rect', { x: x, y: s._bodyTop, w: colW - 0.15, h: 0.44, fill: { color: TH.panel } });
      s.addText(_clip((m.month || (i + 1)) + '개월차', 12), {
        x: x + 0.12, y: s._bodyTop + 0.06, w: colW - 0.35, h: 0.32,
        fontFace: FONT, fontSize: 12, bold: true, color: TH.title });
      s.addText(_clip(_plain(m.focus || m.goal || ''), 44), {
        x: x, y: s._bodyTop + 0.58, w: colW - 0.15, h: 0.5,
        fontFace: FONT, fontSize: 11, bold: true, color: TH.accent, valign: 'top' });
      const tasks = (m.actions || m.tasks || []).slice(0, 4)
        .map(function (t) { return '· ' + _clip(_plain(t.action || t.task || t), 36); }).join('\n');
      s.addText(tasks || '—', { x: x, y: s._bodyTop + 1.12, w: colW - 0.15, h: 2.0,
        fontFace: FONT, fontSize: 10, color: TH.body, valign: 'top' });
      if (m.support || m.govSupport) {
        s.addText('지원: ' + _clip(_plain(m.support || m.govSupport), 30), {
          x: x, y: s._bodyTop + 3.2, w: colW - 0.15, h: 0.3,
          fontFace: FONT, fontSize: 9, color: TH.muted });
      }
    });
    _footNote(s, (plan || []).length > 3 ? '전체 ' + plan.length + '개월 중 3개월만 표시' : '');
    return s;
  }

  /* ── 중소기업 (sme) — 화면 8섹션 순서, 분량에 따라 15~20장 ──
     ⚠ 2단계까지 있던 '리포트에서 확인할 내용'(유형별 특화 분석·린 캔버스 제외 안내) 장은 없앴다 —
        두 섹션을 이제 전부 싣는다 */
  function _buildSme(pptx, ctx) {
    const fd = ctx.fd, d = ctx.data || {};
    _smeCover(pptx, ctx);
    _smeExec(pptx, fd, d);                       // ① 한눈에 보기
    _smeCompetencySlide(pptx, fd);               // ② 지금 상태 — 5대 역량(2단계 차트, 불변)
    _smeSpec(pptx, d.specializedAnalysis);       // ② 지금 상태 — 유형별 특화 분석
    _smeSwot(pptx, d.swot);                      // ③ 강점과 약점
    _smeStp(pptx, d.stp);                        // ④ STP
    _smeLean(pptx, d.leanCanvas);                // ④ 린 캔버스
    _smeFourP(pptx, d.fourP);                    // ⑤ 4P
    _smeStrategies(pptx, d.keyStrategies);       // ⑥ 핵심 전략
    _smeSystems(pptx, d.sixSystems);             // ⑥ 6가지 시스템
    _smeKpi(pptx, d.kpi);                        // ⑦ KPI
    _smeRoadmap(pptx, d.roadmap);                // ⑦ 로드맵
    _smePlan90(pptx, d.plan90days);              // ⑦ 90일 플랜
    _smeGov(pptx, fd);                           // ⑧ 정부지원사업
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
      s.addShape('rect', { x: M.x, y: s._bodyTop, w: 2.1, h: 1.25, fill: { color: TH.panel } });
      s.addText(String(ctx.orgTotal || 0), { x: M.x, y: s._bodyTop + 0.16, w: 2.1, h: 0.6,
        fontFace: FONT, fontSize: 34, bold: true, color: TH.title, align: 'center' });
      s.addText('/ 100점 (8영역 균등)', { x: M.x, y: s._bodyTop + 0.8, w: 2.1, h: 0.3,
        fontFace: FONT, fontSize: 10, color: TH.muted, align: 'center' });
      s.addText('먼저 손봐야 할 영역', { x: M.x + 2.35, y: s._bodyTop, w: M.w - 2.35, h: 0.26,
        fontFace: FONT, fontSize: 12, bold: true, color: TH.accent });
      s.addText(weak3.length
        ? weak3.map((d, i) => (i + 1) + '. ' + _clip(d.id.toUpperCase() + '. ' + d.label + '  (' + d.avg.toFixed(1) + '점)', 46)).join('\n')
        : '진단 점수가 입력되지 않았습니다.', {
        x: M.x + 2.35, y: s._bodyTop + 0.3, w: M.w - 2.35, h: 0.95,
        fontFace: FONT, fontSize: 12, color: TH.body, valign: 'top' });

      const wy = s._bodyTop + 1.5;
      s.addText(urgent.length ? '지금 확인해야 할 사항 ' + urgent.length + '건' : '즉시 조치가 필요한 경고는 없습니다', {
        x: M.x, y: wy, w: M.w, h: 0.26,
        fontFace: FONT, fontSize: 12, bold: true, color: urgent.length ? TH.critical : TH.ok });
      if (urgent.length) {
        urgent.slice(0, 4).forEach((w, i) => {
          const y = wy + 0.32 + i * 0.62;
          s.addText(w.level, { x: M.x, y: y, w: 0.85, h: 0.24,
            fontFace: FONT, fontSize: 9, bold: true, color: _levelColor(w.level) });
          s.addText(_clip(w.msg, 150), { x: M.x + 0.9, y: y, w: M.w - 0.9, h: 0.56,
            fontFace: FONT, fontSize: 10, color: TH.body, valign: 'top' });
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
        fontFace: FONT, fontSize: 12, bold: true, color: weakItems.length ? TH.high : TH.ok });
      if (weakItems.length) {
        s.addText(weakItems.map(x => '· ' + _clip(x, 88)).join('\n'), {
          x: M.x, y: ty + 0.3, w: M.w, h: 1.1,
          fontFace: FONT, fontSize: 11, color: TH.body, valign: 'top' });
      }
      const ws = (ctx.orgWarnings || []).filter(w => _warnSection(w.code) === key).slice(0, 2);
      if (ws.length) {
        const wy2 = ty + (weakItems.length ? 1.5 : 0.35);
        ws.forEach((w, i) => {
          s.addText(w.level, { x: M.x, y: wy2 + i * 0.58, w: 0.85, h: 0.24,
            fontFace: FONT, fontSize: 9, bold: true, color: _levelColor(w.level) });
          s.addText(_clip(w.msg, 140), { x: M.x + 0.9, y: wy2 + i * 0.58, w: M.w - 0.9, h: 0.52,
            fontFace: FONT, fontSize: 10, color: TH.body, valign: 'top' });
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
          fontFace: FONT, fontSize: 12, bold: true, color: TH.accent });
        s.addText(pri.map((x, i) => (x.order || i + 1) + '. ' + _clip(_plain(x.action), 88)).join('\n'), {
          x: M.x, y: s._bodyTop + 0.3, w: M.w, h: 1.0,
          fontFace: FONT, fontSize: 11, color: TH.body, valign: 'top' });
      }
      const plan = (p.plan90 || []).slice(0, 3);
      if (plan.length) {
        const top = s._bodyTop + (pri.length ? 1.45 : 0);
        s.addText('90일 실행 계획', { x: M.x, y: top, w: M.w, h: 0.26,
          fontFace: FONT, fontSize: 12, bold: true, color: TH.accent });
        const colW = M.w / 3;
        plan.forEach((m, i) => {
          const x = M.x + i * colW;
          s.addText(_clip((m.month || i + 1) + '개월차 · ' + _plain(m.focus), 28), {
            x: x, y: top + 0.32, w: colW - 0.15, h: 0.3,
            fontFace: FONT, fontSize: 11, bold: true, color: TH.title });
          s.addText((m.tasks || []).slice(0, 3).map(t => '· ' + _clip(_plain(t), 34)).join('\n') || '—', {
            x: x, y: top + 0.62, w: colW - 0.15, h: 1.1,
            fontFace: FONT, fontSize: 10, color: TH.body, valign: 'top' });
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
      fontFace: FONT, fontSize: 11, bold: true, color: TH.accent });
    const weak = _weakItems(ctx, ids, 2);
    s.addText(weak.length ? weak.map(x => '· ' + _clip(x, 84)).join('   ') : '2점 이하 항목이 없습니다', {
      x: M.x, y: y + 0.26, w: M.w, h: 0.32,
      fontFace: FONT, fontSize: 10, color: TH.body });
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
      const VCOLOR = { blocked: TH.critical, review: TH.high, clear: TH.ok };
      _bullets(s, agencies.map(a => {
        const fx = (a.findings || []).filter(f => f.kind !== 'reference');
        const clear = fx.filter(f => f.status === 'clear').length;
        const need = fx.length - clear;
        const vl = a.eligible === false ? '대상 아님' : (VLABEL[a.verdict] || '—');
        return {
          t: _plain(a.name || a.agency || ''),
          sub: vl + '   ·   점검 ' + fx.length + '개 · 통과 ' + clear + ' · 확인 필요 ' + need,
          color: a.eligible === false ? TH.medium : (VCOLOR[a.verdict] || TH.medium),
        };
      }), { max: 4, rowH: 0.86 });
      if ((v.unknownItems || []).length) {
        s.addText('확인이 필요한 항목 ' + v.unknownItems.length + '건 — 응답하지 않았거나 앱에서 판정할 수 없는 항목입니다.', {
          x: M.x, y: 4.5, w: M.w, h: 0.3, fontFace: FONT, fontSize: 10, color: TH.high });
      }
      _footNote(s);
    }

    agencies.slice(0, 2).forEach(a => {
      const s = _newSlide(pptx, _plain(a.name || a.agency || '기관'), '결격 요건 점검');
      if (a.eligible === false) {
        s.addText('신청 대상이 아닙니다', { x: M.x, y: s._bodyTop, w: M.w, h: 0.3,
          fontFace: FONT, fontSize: 14, bold: true, color: TH.medium });
        s.addText(_clip(_plain(a.notEligibleReason || ''), LIMIT.para * 2), {
          x: M.x, y: s._bodyTop + 0.4, w: M.w, h: 2.2,
          fontFace: FONT, fontSize: 11, color: TH.body, valign: 'top' });
      } else {
        const fx = (a.findings || []).filter(f => f.kind !== 'reference' && f.status !== 'clear');
        if (a.warning) {
          s.addText('⚠ ' + _clip(_plain(a.warning), 160), { x: M.x, y: s._bodyTop, w: M.w, h: 0.5,
            fontFace: FONT, fontSize: 11, bold: true, color: TH.high, valign: 'top' });
        }
        _bullets(s, fx.slice(0, 4).map(f => ({
          t: _plain(f.label || f.title || ''),
          sub: _plain(f.message || '') + (f.source ? '   [' + _plain(f.source) + ']' : ''),
          color: f.severity === 'high' ? TH.critical : f.severity === 'medium' ? TH.high : TH.medium,
        })), { y: s._bodyTop + (a.warning ? 0.6 : 0), max: 4, rowH: 0.82 });
        if (!fx.length) {
          s.addText('확인이 필요한 항목이 없습니다.', { x: M.x, y: s._bodyTop + 0.6, w: M.w, h: 0.3,
            fontFace: FONT, fontSize: 12, color: TH.ok });
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
          fontFace: FONT, fontSize: 11, color: TH.body, valign: 'top' });
        if (docs.length > 10) {
          s.addText(docs.slice(10, 20).map(x => '· ' + _clip(x, 44)).join('\n'), {
            x: M.x + M.w / 2, y: s._bodyTop, w: M.w / 2, h: 3.2,
            fontFace: FONT, fontSize: 11, color: TH.body, valign: 'top' });
        }
        s.addText('※ 기관·사업별로 추가 서류가 요구될 수 있습니다. 신청 전 주관기관 공고를 확인하십시오.', {
          x: M.x, y: 4.75, w: M.w, h: 0.3, fontFace: FONT, fontSize: 9, color: TH.muted, italic: true });
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
  /* sme 5대 역량 — 라벨은 화면(wizard calcDomainScores)이 fd.domainScores에 실어 보낸 것을 쓴다.
     ⚠ 1단계까지는 PPT가 '재무건전성'·'조직·인력'을 하드코딩해 화면('경영재무역량'·'인적자원역량')과
        이름이 달랐다. 창업초기 라벨('자금·사업계획' 등)도 여기서 자동으로 따라간다.
        KR은 label이 빠진 과거 데이터용 폴백일 뿐이다 */
  function _smeDomains(fd) {
    const ds = (fd && fd.domainScores) || {};
    const KR = { finance: '경영재무역량', hr: '인적자원역량', bm: 'BM역량', future: '미래기술대응역량', differentiation: '차별화·경쟁우위역량' };
    return Object.keys(ds).map(k => ({
      key: k,
      label: _plain((ds[k] && ds[k].label) || KR[k] || k),
      avg: Number((ds[k] && ds[k].avg) || 0),
    }));
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

    /* ⚠ 팔레트는 유형 분기 **직전에** 한 곳에서 정한다. 빌더 안에서 갈아끼우면
          모듈 변수라 다음 다운로드에 이전 유형의 팔레트가 그대로 남는다.
       ⚠ 조건을 `kind === 'sme'`로 쓰지 않는다 — _buildSme는 else 폴백이라
          예상 못한 kind도 받는다. 팔레트와 빌더가 갈라지면 남색 띠가 있는
          표지에 흰 배경 본문이 붙는 식으로 한 문서 안에서 색 체계가 섞인다.
          현재 THEME을 쓰는 것은 sme 경로뿐이고 나머지는 LEGACY로 출력이 불변이다. */
    const _legacyKind = ctx.kind === 'funding' || ctx.kind === 'micro'
      || ['social', 'venture', 'coop'].indexOf(ctx.kind) >= 0;
    _useTheme(_legacyKind ? LEGACY : THEME);

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
