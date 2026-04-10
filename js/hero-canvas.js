/* ================================================================
   BizNavi AI — hero-canvas.js
   히어로 배경 Canvas 애니메이션
   - 상승하는 차트 라인
   - 떠다니는 전략 카드
   - 데이터 노드 & 연결선
   - 파티클 흐름
   ================================================================ */
(function () {
  'use strict';

  const GOLD   = 'rgba(245,192,48,';
  const BLUE   = 'rgba(99,149,255,';
  const WHITE  = 'rgba(232,237,245,';
  const GREEN  = 'rgba(74,222,128,';

  /* ── 유틸 ──────────────────────────────────────────────────── */
  const rand  = (a, b) => Math.random() * (b - a) + a;
  const randI = (a, b) => Math.floor(rand(a, b));

  /* ── 차트 라인 ──────────────────────────────────────────────── */
  class ChartLine {
    constructor(canvas) {
      this.W = canvas.width;
      this.H = canvas.height;
      this.reset();
    }
    reset() {
      this.x      = rand(0, this.W);
      this.y      = rand(this.H * 0.4, this.H * 0.85);
      this.points = [];
      const count = randI(10, 18);
      let   cy    = this.y;
      for (let i = 0; i < count; i++) {
        cy += rand(-28, -6);                   // 전반적으로 우상향
        this.points.push({ x: this.x + i * rand(24, 38), y: cy });
      }
      this.color  = Math.random() > 0.5 ? GOLD : BLUE;
      this.alpha  = rand(0.12, 0.28);
      this.life   = 0;
      this.maxLife = rand(200, 360);
      this.drawn  = 0;                          // 현재까지 그린 점 수
    }
    update() {
      this.life++;
      if (this.life < this.maxLife * 0.5) {
        this.drawn = Math.min(this.points.length, this.drawn + 0.12);
      }
      if (this.life > this.maxLife) this.reset();
    }
    draw(ctx) {
      const pts = this.points.slice(0, Math.ceil(this.drawn));
      if (pts.length < 2) return;
      const fade = this.life > this.maxLife * 0.75
        ? 1 - (this.life - this.maxLife * 0.75) / (this.maxLife * 0.25)
        : 1;
      ctx.save();
      ctx.globalAlpha = this.alpha * fade;
      ctx.strokeStyle = this.color + '1)';
      ctx.lineWidth   = rand(1.2, 2.0);
      ctx.lineJoin    = 'round';
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        const mx = (pts[i-1].x + pts[i].x) / 2;
        const my = (pts[i-1].y + pts[i].y) / 2;
        ctx.quadraticCurveTo(pts[i-1].x, pts[i-1].y, mx, my);
      }
      ctx.stroke();

      /* 마지막 점에 빛나는 점 */
      const last = pts[pts.length - 1];
      ctx.beginPath();
      ctx.arc(last.x, last.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = this.color + '1)';
      ctx.fill();
      ctx.restore();
    }
  }

  /* ── 데이터 노드 & 연결선 ────────────────────────────────────── */
  class Node {
    constructor(W, H) {
      this.W = W; this.H = H;
      this.reset();
    }
    reset() {
      this.x     = rand(60, this.W - 60);
      this.y     = rand(60, this.H - 60);
      this.r     = rand(3, 5.5);
      this.vx    = rand(-0.25, 0.25);
      this.vy    = rand(-0.25, 0.25);
      this.alpha = rand(0.2, 0.55);
      this.color = [GOLD, BLUE, WHITE][randI(0, 3)];
      this.pulse = rand(0, Math.PI * 2);
    }
    update() {
      this.x    += this.vx;
      this.y    += this.vy;
      this.pulse += 0.04;
      if (this.x < 0 || this.x > this.W) this.vx *= -1;
      if (this.y < 0 || this.y > this.H) this.vy *= -1;
    }
    draw(ctx) {
      const pAlpha = this.alpha * (0.7 + 0.3 * Math.sin(this.pulse));
      ctx.save();
      ctx.globalAlpha = pAlpha;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color + '1)';
      ctx.fill();
      /* 글로우 */
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 2.8, 0, Math.PI * 2);
      ctx.fillStyle = this.color + '0.08)';
      ctx.fill();
      ctx.restore();
    }
  }

  /* ── 연결선 그리기 ──────────────────────────────────────────── */
  function drawConnections(ctx, nodes) {
    const MAX_DIST = 180;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx   = nodes[i].x - nodes[j].x;
        const dy   = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          const alpha = (1 - dist / MAX_DIST) * 0.12;
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = BLUE + '1)';
          ctx.lineWidth   = 0.8;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  /* ── 플로팅 카드 ─────────────────────────────────────────────── */
  const CARD_LABELS = [
    { label: 'SWOT 분석', val: '완료', color: GOLD },
    { label: '매출 성장률', val: '+34%', color: GREEN },
    { label: 'KPI 달성', val: '87%', color: BLUE },
    { label: '핵심 전략', val: '6개', color: GOLD },
    { label: '시장 점유율', val: '↑12%', color: GREEN },
    { label: '로드맵', val: '3단계', color: BLUE },
    { label: 'STP 분석', val: '완료', color: GOLD },
    { label: '고객 NPS', val: '72점', color: GREEN },
  ];

  class FloatCard {
    constructor(W, H, idx) {
      this.W = W; this.H = H;
      this.data = CARD_LABELS[idx % CARD_LABELS.length];
      this.reset();
    }
    reset() {
      this.x     = rand(40, this.W - 140);
      this.y     = rand(40, this.H - 80);
      this.vy    = rand(-0.18, -0.08);
      this.alpha = 0;
      this.life  = 0;
      this.maxLife = rand(280, 420);
      this.w     = 115;
      this.h     = 44;
    }
    update() {
      this.life++;
      this.y += this.vy;
      /* 페이드인 */
      if (this.life < 40)  this.alpha = this.life / 40 * 0.75;
      /* 페이드아웃 */
      else if (this.life > this.maxLife - 50)
        this.alpha = Math.max(0, (this.maxLife - this.life) / 50 * 0.75);
      else this.alpha = 0.75;
      if (this.life > this.maxLife) this.reset();
    }
    draw(ctx) {
      if (this.alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha = this.alpha * 0.85;
      /* 카드 배경 */
      ctx.fillStyle   = 'rgba(15,22,41,0.82)';
      ctx.strokeStyle = this.data.color + '0.45)';
      ctx.lineWidth   = 1;
      roundRect(ctx, this.x, this.y, this.w, this.h, 8);
      ctx.fill();
      ctx.stroke();
      /* 레이블 */
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle   = 'rgba(185,200,230,0.9)';
      ctx.font        = '10px "Noto Sans KR", sans-serif';
      ctx.fillText(this.data.label, this.x + 10, this.y + 16);
      /* 값 */
      ctx.fillStyle   = this.data.color + '1)';
      ctx.font        = 'bold 15px "Noto Sans KR", sans-serif';
      ctx.fillText(this.data.val, this.x + 10, this.y + 33);
      /* 좌측 컬러 바 */
      ctx.fillStyle   = this.data.color + '0.7)';
      roundRect(ctx, this.x, this.y + 10, 3, 24, 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /* ── 파티클 ─────────────────────────────────────────────────── */
  class Particle {
    constructor(W, H) {
      this.W = W; this.H = H;
      this.reset();
    }
    reset() {
      this.x     = rand(0, this.W);
      this.y     = rand(0, this.H);
      this.r     = rand(0.8, 2.2);
      this.vx    = rand(-0.15, 0.15);
      this.vy    = rand(-0.35, -0.1);
      this.alpha = rand(0.04, 0.18);
      this.life  = rand(0, 300);
      this.maxLife = rand(200, 400);
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life++;
      if (this.y < -5 || this.life > this.maxLife) this.reset();
    }
    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle   = GOLD + '1)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /* ── 바 차트 ────────────────────────────────────────────────── */
  class BarChart {
    constructor(W, H) {
      this.W = W; this.H = H;
      this.reset();
    }
    reset() {
      const count = randI(4, 7);
      this.x      = rand(30, this.W - 180);
      this.baseY  = rand(this.H * 0.5, this.H * 0.82);
      this.bars   = Array.from({ length: count }, () => ({
        targetH: rand(30, 110),
        currentH: 0,
        w: rand(14, 22),
      }));
      this.gap    = rand(8, 14);
      this.alpha  = rand(0.1, 0.2);
      this.life   = 0;
      this.maxLife = rand(250, 400);
    }
    update() {
      this.life++;
      this.bars.forEach(b => {
        if (b.currentH < b.targetH) b.currentH += (b.targetH - b.currentH) * 0.06;
      });
      if (this.life > this.maxLife) this.reset();
    }
    draw(ctx) {
      const fade = this.life > this.maxLife * 0.78
        ? 1 - (this.life - this.maxLife * 0.78) / (this.maxLife * 0.22)
        : 1;
      ctx.save();
      ctx.globalAlpha = this.alpha * fade;
      let cx = this.x;
      this.bars.forEach((b, i) => {
        const grad = ctx.createLinearGradient(cx, this.baseY - b.currentH, cx, this.baseY);
        grad.addColorStop(0, GOLD + '0.9)');
        grad.addColorStop(1, BLUE + '0.3)');
        ctx.fillStyle = grad;
        roundRect(ctx, cx, this.baseY - b.currentH, b.w, b.currentH, 3);
        ctx.fill();
        cx += b.w + this.gap;
      });
      ctx.restore();
    }
  }

  /* ── 메인 초기화 ────────────────────────────────────────────── */
  function init() {
    const section = document.getElementById('lp-hero');
    if (!section) return;

    /* 캔버스 생성 & 삽입 */
    const canvas = document.createElement('canvas');
    canvas.id    = 'heroCanvas';
    canvas.style.cssText = [
      'position:absolute', 'inset:0', 'width:100%', 'height:100%',
      'pointer-events:none', 'z-index:0',
    ].join(';');
    section.style.position = 'relative';
    section.insertBefore(canvas, section.firstChild);

    /* 콘텐츠가 캔버스 위에 표시되도록 z-index 설정 */
    Array.from(section.children).forEach(el => {
      if (el !== canvas) el.style.position = 'relative', el.style.zIndex = '1';
    });

    const ctx = canvas.getContext('2d');
    let   raf;

    function resize() {
      canvas.width  = section.offsetWidth;
      canvas.height = section.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    /* 오브젝트 풀 */
    const W = () => canvas.width;
    const H = () => canvas.height;

    const charts    = Array.from({ length: 5  }, () => new ChartLine(canvas));
    const nodes     = Array.from({ length: 22 }, () => new Node(W(), H()));
    const cards     = Array.from({ length: 6  }, (_, i) => {
      const c = new FloatCard(W(), H(), i);
      c.life  = randI(0, c.maxLife);   // 시작 시점 분산
      return c;
    });
    const particles = Array.from({ length: 55 }, () => new Particle(W(), H()));
    const bars      = Array.from({ length: 3  }, () => new BarChart(W(), H()));

    /* 크기 변경 시 노드 위치 갱신 */
    window.addEventListener('resize', () => {
      nodes.forEach(n => { n.W = W(); n.H = H(); });
      cards.forEach(c => { c.W = W(); c.H = H(); });
      particles.forEach(p => { p.W = W(); p.H = H(); });
      bars.forEach(b => { b.W = W(); b.H = H(); });
    });

    function loop() {
      ctx.clearRect(0, 0, W(), H());

      /* 파티클 */
      particles.forEach(p => { p.update(); p.draw(ctx); });

      /* 노드 & 연결선 */
      nodes.forEach(n => n.update());
      drawConnections(ctx, nodes);
      nodes.forEach(n => n.draw(ctx));

      /* 바 차트 */
      bars.forEach(b => { b.update(); b.draw(ctx); });

      /* 차트 라인 */
      charts.forEach(c => { c.update(); c.draw(ctx); });

      /* 플로팅 카드 */
      cards.forEach(c => { c.update(); c.draw(ctx); });

      raf = requestAnimationFrame(loop);
    }

    /* 탭 숨김 시 애니메이션 중지 */
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else loop();
    });

    loop();
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
