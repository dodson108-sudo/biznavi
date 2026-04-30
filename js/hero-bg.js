/* ================================================================
   BizNavi — hero-bg.js
   시간대별 배경 이미지 자동 전환 + 크로스페이드 슬라이드쇼
   오전 06:00~17:59 → 밝은 비즈니스 현장
   저녁 18:00~05:59 → 다크 비즈니스 현장
================================================================ */
(function () {
  // ── 이미지 세트 (Unsplash 무료 — 상업적 사용 허용) ──
  const IMAGES = {
    day: [
      // 소규모 팀 미팅 · 밝은 자연광
      { url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1920&q=85&auto=format&fit=crop', pos: 'center center' },
      // 카페 비즈니스 미팅 · 따뜻한 조명
      { url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=85&auto=format&fit=crop', pos: 'center 35%' },
      // 스마트폰·노트북 사용 비즈니스 여성
      { url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1920&q=85&auto=format&fit=crop', pos: 'center 30%' },
    ],
    night: [
      // 다크 모던 오피스 야경
      { url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=85&auto=format&fit=crop', pos: 'center center' },
      // 저녁 화면 앞 집중 업무
      { url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&q=85&auto=format&fit=crop', pos: 'center center' },
      // 야간 비즈니스 미팅 분위기
      { url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&q=85&auto=format&fit=crop', pos: 'center center' },
    ]
  };

  // ── 오버레이 강도 (낮=밝은 사진→더 많이 어둡게 / 밤=어두운 사진→덜 어둡게) ──
  const OVERLAY = {
    day:   'linear-gradient(160deg, rgba(10,14,26,.60) 0%, rgba(10,14,26,.78) 100%)',
    night: 'linear-gradient(160deg, rgba(10,14,26,.52) 0%, rgba(10,14,26,.70) 100%)'
  };

  const SLIDE_INTERVAL = 8000; // 8초마다 이미지 교체

  let currentIdx = 0;
  let activeLayer = 'a'; // 'a' 또는 'b'
  let layerA, layerB, overlay;
  let images, overlayGrad;
  let slideTimer = null;

  // ── 초기화 ──
  function init() {
    layerA   = document.getElementById('hero-bg-a');
    layerB   = document.getElementById('hero-bg-b');
    overlay  = document.getElementById('hero-overlay');
    if (!layerA || !layerB || !overlay) return;

    const hour = new Date().getHours();
    const isDay = hour >= 6 && hour < 18;
    images      = isDay ? IMAGES.day  : IMAGES.night;
    overlayGrad = isDay ? OVERLAY.day : OVERLAY.night;

    overlay.style.background = overlayGrad;

    // 랜덤 시작 인덱스
    currentIdx = Math.floor(Math.random() * images.length);
    loadAndShow(images[currentIdx], layerA, true);

    // Canvas 숨기기 (이미지 배경으로 대체)
    const canvas = document.getElementById('heroCanvas');
    if (canvas) {
      canvas.style.transition = 'opacity 0.8s ease';
      canvas.style.opacity = '0';
      setTimeout(function () { canvas.style.display = 'none'; }, 900);
    }

    // 슬라이드 시작
    if (images.length > 1) {
      slideTimer = setInterval(nextSlide, SLIDE_INTERVAL);
    }
  }

  // ── 이미지 로드 후 레이어에 적용 ──
  function loadAndShow(imgObj, layer, instant) {
    const img = new Image();
    img.onload = function () {
      layer.style.backgroundImage  = 'url(' + imgObj.url + ')';
      layer.style.backgroundPosition = imgObj.pos;
      layer.style.opacity = instant ? '1' : '1';
    };
    img.onerror = function () {
      // 로드 실패 시 다음 이미지로 넘어감
      currentIdx = (currentIdx + 1) % images.length;
      loadAndShow(images[currentIdx], layer, instant);
    };
    img.src = imgObj.url;
  }

  // ── A/B 크로스페이드 ──
  function nextSlide() {
    currentIdx = (currentIdx + 1) % images.length;
    const nextImg = images[currentIdx];

    if (activeLayer === 'a') {
      // B를 준비 → B를 올리고 A를 내림
      layerB.style.transition = 'none';
      layerB.style.opacity = '0';
      loadAndShow(nextImg, layerB, false);
      // 다음 프레임에서 페이드인
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          layerB.style.transition = 'opacity 1.8s ease';
          layerB.style.opacity = '1';
          layerA.style.transition = 'opacity 1.8s ease';
          layerA.style.opacity = '0';
          activeLayer = 'b';
        });
      });
    } else {
      layerA.style.transition = 'none';
      layerA.style.opacity = '0';
      loadAndShow(nextImg, layerA, false);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          layerA.style.transition = 'opacity 1.8s ease';
          layerA.style.opacity = '1';
          layerB.style.transition = 'opacity 1.8s ease';
          layerB.style.opacity = '0';
          activeLayer = 'a';
        });
      });
    }
  }

  // ── 탭 숨김/표시 시 슬라이드 중단/재개 ──
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (slideTimer) clearInterval(slideTimer);
    } else {
      if (images && images.length > 1) {
        slideTimer = setInterval(nextSlide, SLIDE_INTERVAL);
      }
    }
  });

  // ── DOMContentLoaded 후 실행 ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
