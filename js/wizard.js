/* ================================================================
   BizNavi AI — wizard.js
   3단계 입력 위저드: 스텝 이동, 유효성 검사, 데이터 수집, 로딩 애니메이션
   ================================================================ */

const Wizard = (() => {
  let curStep = 1;

  function goStep(n) {
    if (n > curStep && !validate(curStep)) return;
    const prevStep = curStep;
    curStep = n;
    updateStepUI(n);
    // slide animation
    const prev = document.getElementById('step'+prevStep);
    const next = document.getElementById('step'+n);
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
    for (let i = 1; i <= 3; i++) {
      const c = document.getElementById('c'+i), lb = document.getElementById('l'+i);
      c.classList.remove('active','done');
      lb.classList.remove('active');
      if (i < n)      { c.classList.add('done');   c.textContent = '✓'; }
      else if (i===n) { c.classList.add('active');  c.textContent = i; lb.classList.add('active'); }
      else            { c.textContent = i; }
    }
    document.getElementById('ln1').classList.toggle('done', n > 1);
    document.getElementById('ln2').classList.toggle('done', n > 2);
    // progress bar
    const pct = n === 1 ? 33 : n === 2 ? 66 : 100;
    document.getElementById('wizProgressFill').style.width = pct + '%';
  }

  function validate(step) {
    const get = id => document.getElementById(id).value.trim();
    if (step === 1) {
      if (!get('companyName'))  { alert('회사명을 입력해주세요.');        return false; }
      if (!get('industry'))     { alert('업종을 선택해주세요.');           return false; }
      if (!get('products'))     { alert('주요 제품/서비스를 입력해주세요.'); return false; }
    }
    if (step === 3) {
      if (!get('problems')) { alert('현재 직면한 문제를 입력해주세요.'); return false; }
      if (!get('goals'))    { alert('달성 목표를 입력해주세요.');         return false; }
    }
    return true;
  }

  function collect() {
    const g = id => document.getElementById(id).value.trim();
    return {
      companyName:     g('companyName'),
      industry:        g('industry'),
      foundedYear:     g('foundedYear'),
      employees:       g('employees'),
      revenue:         g('revenue'),
      region:          g('region'),
      products:        g('products'),
      bizStrengths:    g('bizStrengths'),
      targetCustomer:  g('targetCustomer'),
      competitors:     g('competitors'),
      marketSize:      g('marketSize'),
      marketShare:     g('marketShare'),
      differentiation: g('differentiation'),
      problems:        g('problems'),
      goals:           g('goals'),
      timeline:        g('timeline'),
      budget:          g('budget'),
      notes:           g('notes'),
    };
  }

  function animateLoading() {
    const ids = ['ls1','ls2','ls3','ls4'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      el.classList.remove('active','done');
      el.querySelector('.ld-step-ico').textContent = '○';
    });
    document.getElementById('ls1').classList.add('active');
    document.getElementById('ls1').querySelector('.ld-step-ico').textContent = '◌';
    let i = 0;
    const iv = setInterval(() => {
      document.getElementById(ids[i]).classList.replace('active','done');
      document.getElementById(ids[i]).querySelector('.ld-step-ico').textContent = '✓';
      i++;
      if (i < ids.length) {
        document.getElementById(ids[i]).classList.add('active');
        document.getElementById(ids[i]).querySelector('.ld-step-ico').textContent = '◌';
      } else {
        clearInterval(iv);
      }
    }, 700);
  }

  function reset() {
    curStep = 1;
    updateStepUI(1);
  }

  return { goStep, validate, collect, animateLoading, reset };
})();
