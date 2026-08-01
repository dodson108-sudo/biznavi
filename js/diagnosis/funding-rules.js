/* ================================================================
   BizNavi — funding-rules.js
   정책자금 기관 선별 + 기관별 결격 판정 규칙

   ⚠ 이 모듈은 판정 규칙 데이터와 판정 함수만 담는다. DOM을 건드리지 않는다.
   ⚠ 어떤 경우에도 "신청 가능합니다"/"승인됩니다" 같은 단정 표현을 쓰지 않는다.
      앱은 쟁점과 근거 조항을 제시하고 최종 판단은 기관·컨설턴트에게 남긴다.
   ⚠ 예상 승인 금액을 계산·추정하지 않는다.
   ⚠ 'unknown'을 'clear'로 처리하지 않는다 (최악의 오진).

   근거:
     소진공 — 소상공인 정책자금 융자계획 / 지원 제외업종 표 (ols.semas.or.kr)
     중진공 — 2026 융자대상 및 융자제한기업 15개 항목
              (https://www.kosmes.or.kr/nsh/SH/SBI/SHSBI002M0.do)
   ================================================================ */

const FundingRules = (() => {

  /* ── 기관 정의 (신보·기보는 범위 밖) ───────────────────────── */
  const AGENCIES = {
    semas:  { name: '소상공인시장진흥공단', short: '소진공', url: 'https://ols.semas.or.kr' },
    kosmes: { name: '중소벤처기업진흥공단', short: '중진공', url: 'https://www.kosmes.or.kr' },
  };

  const SRC_SEMAS = { source: '소상공인 정책자금 융자계획 (소진공)', sourceUrl: 'https://ols.semas.or.kr' };
  const SRC_KOSMES = {
    source: '중진공 융자대상 및 융자제한기업 (2026)',
    sourceUrl: 'https://www.kosmes.or.kr/nsh/SH/SBI/SHSBI002M0.do',
  };

  /* ── 소진공 지원 제외업종 (공식 표) ─────────────────────────
     ⚠ BizNavi의 industryKey(16종)는 표준산업분류 코드가 아니다.
        이 목록으로 자동 결격 판정을 하지 않는다.
        "업종 확인 필요" 안내와 해당 가능성 제시용으로만 사용한다.
        절대 "귀사는 제외 업종입니다"라고 단정하지 않는다. */
  const EXCLUDED_INDUSTRIES_SEMAS = [
    { code: '33409중', name: '도박·사행성·불건전 오락기구 제조업', exceptions: [] },
    { code: '46102중', name: '담배 중개업', exceptions: [] },
    { code: '46209중', name: '잎담배 도매업', exceptions: [] },
    { code: '46333',   name: '담배 도매업 (전자담배 등 담배대용물 포함)', exceptions: [] },
    { code: '46463중', name: '도박·사행성 오락기구 도매업', exceptions: [] },
    { code: '47640중', name: '도박·사행성 오락기구 소매업', exceptions: [] },
    { code: '47811중', name: '약국, 한약국', exceptions: [] },
    { code: '47859중', name: '성인용품 판매점', exceptions: [] },
    { code: '47911·47912중', name: '도박·사행성 기구, 성인용품 소매 및 중개', exceptions: [] },
    { code: '47993중', name: '다단계 방문판매',
      exceptions: ['방문판매등에관한법률 제2조6호 다단계판매자가 동조5호 다단계판매업 등록 후 영위 시 신청 가능'] },
    { code: '52991중', name: '통관업(관세사·관세법인 등)', exceptions: [] },
    { code: '56211',   name: '일반유흥주점업', exceptions: [] },
    { code: '56212',   name: '무도유흥주점업', exceptions: [] },
    { code: '5821중',  name: '도박·사행성 게임 S/W 개발 및 공급업', exceptions: [] },
    { code: '63992',   name: '가상자산 매매 및 중개업', exceptions: [] },
    { code: '63999중', name: '온라인게임 아이템 중개업', exceptions: [] },
    { code: '64',      name: '금융업', exceptions: [] },
    { code: '65',      name: '보험 및 연금업', exceptions: [] },
    { code: '66',      name: '금융 및 보험관련 서비스업', exceptions: [] },
    { code: '68',      name: '부동산업',
      exceptions: [
        '부동산관리업(6821)',
        '신청일 기준 동일장소 6개월 이상 지속 중인 부동산 중개 및 대리업(68221)',
        '부동산 분양 대행업(68224)',
        '비주거용건물임대업(68112) 중 공유오피스·공유주방',
      ] },
    { code: '711·712', name: '법무·회계·세무 등 기타법무관련 서비스업', exceptions: [] },
    { code: '731',     name: '수의업', exceptions: [] },
    { code: '73904중', name: '감정평가업', exceptions: [] },
    { code: '75330중', name: '흥신소', exceptions: [] },
    { code: '75993',   name: '신용조사 및 추심대행업', exceptions: [] },
    { code: '75999중', name: '경품용 상품권 발행·판매업', exceptions: [] },
    { code: '76390중', name: '도박·사행성 오락기구 임대업', exceptions: [] },
    { code: '86',      name: '보건업', exceptions: ['유사의료업(86902)은 신청 가능'] },
    { code: '91113',   name: '경주장 및 동물 경기장 운영업', exceptions: [] },
    { code: '91121',   name: '골프장 운영업', exceptions: ['골프연습장·스크린골프연습장(91136)은 지원 가능'] },
    { code: '9122중',  name: '성인용게임장·성인오락실·성인PC방·전화방', exceptions: [] },
    { code: '91242',   name: '카지노 운영업', exceptions: [] },
    { code: '91249',   name: '기타 사행시설 관리 및 운영업', exceptions: [] },
    { code: '91291',   name: '무도장 운영업(댄스홀·콜라텍 등)', exceptions: [] },
    { code: '9612중',  name: '증기탕 및 안마시술소',
      exceptions: ['시각장애인이 운영하는 안마원·안마시술소는 신청 가능'] },
    { code: '96992',   name: '점술 및 유사서비스업', exceptions: [] },
    { code: '96999중', name: '휴게텔·키스방·대화방', exceptions: [] },
    { code: '기타',    name: '위 업종 변경 운영 도박·향락 등 불건전 업종', exceptions: [] },
  ];

  /* industryKey → 해당 업종에서 특히 확인이 필요한 제외업종 코드 목록.
     자동 판정이 아니라 '확인 유도'용이다. */
  const INDUSTRY_WATCH = {
    local_service: ['9612중', '96992', '96999중', '75330중'],
    restaurant:    ['56211', '56212', '91291'],
    medical:       ['86', '47811중', '731'],
    finance:       ['64', '65', '66', '63992'],
    knowledge_it:  ['5821중', '63999중'],
    wholesale:     ['46333', '46209중', '46102중', '46463중', '47640중', '47859중', '47993중'],
    construction:  ['68'],
    mfg_parts:     ['33409중'],
    media:         ['9122중', '5821중'],
    etc:           [],
  };

  /* 제조·건설·운수·광업 — 소상공인 상시근로자 기준이 10인 미만인 업종군 */
  const SEMAS_10_PERSON_INDUSTRIES = ['mfg_parts', 'food_mfg', 'construction', 'logistics'];

  /* 중진공 소상공인 제외(융자제한 9호) 예외로 인정하는 인증 */
  const KOSMES_SOCIAL_CERTS = ['사회적기업(인증)', '예비사회적기업', '협동조합·마을기업', '소셜벤처 판별기업'];
  /* 제조업 영위가 명확한 업종 — 보수적으로 2개만 인정 */
  const KOSMES_MFG_INDUSTRIES = ['mfg_parts', 'food_mfg'];
  /* 제조 공정 영위 여부가 모호한 업종 — 자격 불확실로 분류 */
  const KOSMES_MAYBE_MFG_INDUSTRIES = ['fashion', 'agri_food'];

  /* 수집 데이터로 판정 불가한 예외 — 모든 not_eligible 안내에 공통으로 덧붙인다 */
  const KOSMES_UNVERIFIABLE_TAIL =
    ' 혁신성장·초격차·신산업 분야 영위 기업, 소상공인 유예기업도 예외 대상이므로 해당 여부를 중진공에 확인할 것.';

  /* employees는 구간 문자열이라 정확한 인원을 알 수 없다 (경계값 확정 불가) */
  const EMP_BRACKETS = {
    '1~5명':      { min: 1,   max: 5 },
    '6~10명':     { min: 6,   max: 10 },
    '11~50명':    { min: 11,  max: 50 },
    '51~100명':   { min: 51,  max: 100 },
    '101~300명':  { min: 101, max: 300 },
    '301~1000명': { min: 301, max: 1000 },
  };

  /* ── 내부 헬퍼 ─────────────────────────────────────────────── */

  function _yes(v) { return v === 'yes'; }
  function _unknown(v) { return v === 'unknown' || v === undefined || v === null || v === ''; }

  function _bracket(employees) {
    if (!employees) return null;
    return EMP_BRACKETS[String(employees).trim()] || null;
  }

  /* 업력(년) — foundedYear가 있을 때만 계산. 없으면 null */
  function _businessAge(ctx) {
    const y = parseInt(String(ctx?.foundedYear || '').slice(0, 4), 10);
    if (!y || y < 1900) return null;
    const age = new Date().getFullYear() - y;
    return age >= 0 ? age : null;
  }

  /* 제외업종 안내 문구 생성 — 단정하지 않고 확인을 유도한다 */
  function _watchText(industryKey) {
    const codes = INDUSTRY_WATCH[industryKey] || [];
    if (!codes.length) return '';
    const items = codes.map(code => {
      const row = EXCLUDED_INDUSTRIES_SEMAS.find(r => r.code === code);
      if (!row) return '';
      const ex = row.exceptions.length ? ' (예외: ' + row.exceptions.join(' / ') + ')' : '';
      return row.name + '[' + row.code + ']' + ex;
    }).filter(Boolean);
    return items.length ? ' 귀사 업종에서 특히 확인이 필요한 항목: ' + items.join('; ') + '.' : '';
  }

  /* ── 판정 규칙 ─────────────────────────────────────────────
     test()는 'blocked' | 'conditional' | 'clear' | 'unknown' 중 하나만 반환한다.
     동적 문구가 필요하면 detail()에서 message를 덮어쓴다. */
  const RULES = [

    /* ═══ 소진공 (semas) ═══ */
    {
      id: 'semas_scale', agency: 'semas', label: '소상공인 규모 요건', ...SRC_SEMAS,
      test: (f, ctx) => {
        const b = _bracket(ctx?.employees);
        if (!b) return 'unknown';
        if (b.max <= 5) return 'conditional';          // 1~5명 — 경계값 5인만 문제
        if (b.min >= 11) return 'blocked';
        // 6~10명
        return SEMAS_10_PERSON_INDUSTRIES.indexOf(ctx?.industryKey) >= 0 ? 'conditional' : 'blocked';
      },
      detail: (f, ctx, status) => {
        const b = _bracket(ctx?.employees);
        if (!b) return null;
        if (b.max <= 5) {
          return '상시근로자 5인 미만이면 소진공 대상입니다. 정확히 5인이면 제외되므로 직전 사업연도 평균 인원 기준으로 확인이 필요합니다.';
        }
        if (b.min >= 6 && b.max <= 10) {
          return status === 'conditional'
            ? '해당 업종(제조·건설·운수·광업)은 상시근로자 10인 미만까지 소상공인입니다. 정확히 10인이면 제외되므로 확인이 필요합니다.'
            : '상시근로자 5인 이상으로 소진공 대상이 아닙니다. 중진공 트랙 검토가 필요합니다.';
        }
        return '상시근로자 규모가 소상공인 기준(5인 미만, 제조·건설·운수·광업 10인 미만)을 초과합니다. 중진공 트랙 검토가 필요합니다.';
      },
      severity: (f, ctx, status) => {
        const b = _bracket(ctx?.employees);
        if (status === 'conditional' && b && b.max <= 5) return 'low';
        return status === 'blocked' ? 'high' : 'medium';
      },
      message: {
        blocked: '상시근로자 규모가 소상공인 기준을 초과합니다. 중진공 트랙 검토가 필요합니다.',
        conditional: '상시근로자 수 경계값 확인이 필요합니다.',
        unknown: '상시근로자 수가 입력되지 않아 소상공인 요건 충족 여부를 확인할 수 없습니다.',
      },
      remedy: '직전 사업연도 월평균 상시근로자 수를 4대보험 가입자 기준으로 확인',
    },
    {
      id: 'semas_tax_arrears', agency: 'semas', label: '국세·지방세 체납', ...SRC_SEMAS,
      test: (f) => _unknown(f?.taxArrears) ? 'unknown' : (_yes(f.taxArrears) ? 'conditional' : 'clear'),
      message: {
        blocked: '',
        conditional: '체납은 원칙적으로 신청 불가입니다. 다만 「국세징수법」 압류·매각 유예, 「조세특례제한법」 징수특례, 「지방세법」 체납처분 유예를 받은 경우 직접대출 지원이 가능할 수 있습니다. 관할 세무서·소진공 확인이 필요합니다.',
        unknown: '체납 여부가 확인되지 않았습니다. 소진공은 체납 기업을 원칙적으로 제외하므로 국세·지방세 완납증명서로 확인이 필요합니다.',
      },
      remedy: '체납액 완납 또는 징수유예·분납 승인 절차 진행',
    },
    {
      id: 'semas_closure', agency: 'semas', label: '휴업·폐업 상태', ...SRC_SEMAS,
      test: (f) => _unknown(f?.closureHist) ? 'unknown' : (_yes(f.closureHist) ? 'conditional' : 'clear'),
      message: {
        blocked: '',
        conditional: '신청일 현재 휴업·폐업 상태이면 신청할 수 없습니다. 과거 이력만 있고 현재 정상 영업 중이면 해당하지 않습니다. 현재 사업자 상태 확인이 필요합니다.',
        unknown: '휴업·폐업 이력 여부가 확인되지 않았습니다. 소진공은 신청일 현재 휴업·폐업 기업을 제외합니다.',
      },
      remedy: '사업자등록 상태(계속사업자) 확인 — 국세청 홈택스 사업자상태 조회',
    },
    {
      id: 'semas_credit', agency: 'semas', label: '신용 문제 (연체·금융질서문란)', ...SRC_SEMAS,
      test: (f) => {
        if (_yes(f?.creditIssue) || _yes(f?.overdue)) return 'blocked';
        if (_unknown(f?.creditIssue) || _unknown(f?.overdue)) return 'unknown';
        return 'clear';
      },
      message: {
        blocked: '연체·금융질서문란 등록은 소진공 정책자금 신청 불가 사유입니다. 신용회복 절차 완료 후 재신청이 필요합니다.',
        conditional: '',
        unknown: '신용 상태가 확인되지 않았습니다. 한국신용정보원 등록 정보로 확인이 필요합니다.',
      },
      remedy: '신용회복위원회 절차 이행 또는 연체 해소 후 등록 정보 말소 확인',
    },
    {
      id: 'semas_industry', agency: 'semas', label: '지원 제외업종 해당 여부', ...SRC_SEMAS,
      /* ⚠ industryKey는 표준산업분류가 아니므로 자동 판정 불가 → 항상 conditional */
      test: () => 'conditional',
      detail: (f, ctx) => {
        const base = '소진공은 도박·사행성·향락·금융·부동산·전문서비스 등을 지원 제외업종으로 정하고 있습니다. BizNavi의 업종 분류는 표준산업분류 코드가 아니므로 자동 판정할 수 없습니다.';
        const watch = _watchText(ctx?.industryKey);
        const declared = _yes(f?.restrictedBiz)
          ? ' 제한업종에 해당한다고 응답하셨습니다. 사업자등록증의 표준산업분류 코드로 제외업종 표를 대조하고, 예외 조항 적용 여부를 소진공에 확인하십시오.'
          : (_unknown(f?.restrictedBiz)
              ? ' 제한업종 해당 여부에 응답하지 않으셨습니다. 사업자등록증의 표준산업분류 코드를 확인해 주십시오.'
              : ' 제한업종에 해당하지 않는다고 응답하셨으나, 표준산업분류 코드 기준으로 재확인을 권장합니다.');
        return base + watch + declared;
      },
      severity: (f) => (_yes(f?.restrictedBiz) ? 'high' : 'medium'),
      message: {
        blocked: '',
        conditional: '지원 제외업종 해당 여부는 표준산업분류 코드로 확인이 필요합니다.',
        unknown: '',
      },
      remedy: '사업자등록증상 업태·종목의 표준산업분류 코드를 소진공 제외업종 표와 대조',
    },
    {
      id: 'semas_prior', agency: 'semas', label: '기존 정책자금 수혜', ...SRC_SEMAS,
      test: (f) => _unknown(f?.priorSupport) ? 'unknown' : (_yes(f.priorSupport) ? 'conditional' : 'clear'),
      message: {
        blocked: '',
        conditional: '최근 정책자금을 3회 이상 지원받은 경우 제한될 수 있습니다. 다만 1회에 한해 추가 지원이 가능한 경우가 있고 자금 종류에 따라 다르므로 소진공 확인이 필요합니다.',
        unknown: '기존 정책자금 수혜 이력이 확인되지 않았습니다. 지원 횟수·잔여 한도를 소진공에 확인해 주십시오.',
      },
      remedy: '소진공 정책자금 지원 이력 및 잔여 한도 조회',
    },

    /* ═══ 중진공 (kosmes) ═══ */
    {
      id: 'kosmes_tax_arrears', agency: 'kosmes', label: '국세·지방세 체납 (융자제한 3호)', ...SRC_KOSMES,
      test: (f) => _unknown(f?.taxArrears) ? 'unknown' : (_yes(f.taxArrears) ? 'blocked' : 'clear'),
      message: {
        blocked: '중진공 융자제한 3호 "세금을 체납중인 기업"에 해당합니다. 소진공과 달리 징수유예 등 예외 조항이 없습니다.',
        conditional: '',
        unknown: '체납 여부가 확인되지 않았습니다. 중진공 융자제한 3호 대상이므로 완납증명서로 확인이 필요합니다.',
      },
      remedy: '체납액 완납 후 국세·지방세 완납증명서 발급',
    },
    {
      id: 'kosmes_credit', agency: 'kosmes', label: '신용정보 등록 (융자제한 4호)', ...SRC_KOSMES,
      test: (f) => {
        if (_yes(f?.creditIssue) || _yes(f?.overdue)) return 'blocked';
        if (_unknown(f?.creditIssue) || _unknown(f?.overdue)) return 'unknown';
        return 'clear';
      },
      message: {
        blocked: '중진공 융자제한 4호에 해당합니다. 한국신용정보원 「일반신용정보관리규약」에 따라 연체, 대위변제·대지급, 부도, 관련인, 금융질서문란, 회생·파산 등의 정보가 등록되어 있는 기업은 융자 대상에서 제외됩니다.',
        conditional: '',
        unknown: '신용정보 등록 여부가 확인되지 않았습니다. 중진공 융자제한 4호 대상이므로 한국신용정보원 조회가 필요합니다.',
      },
      remedy: '연체 해소 후 등록 정보 말소 확인 또는 신용회복 절차 완료',
    },
    {
      id: 'kosmes_closure', agency: 'kosmes', label: '휴·폐업 상태 (융자제한 2호)', ...SRC_KOSMES,
      test: (f) => _unknown(f?.closureHist) ? 'unknown' : (_yes(f.closureHist) ? 'conditional' : 'clear'),
      message: {
        blocked: '',
        conditional: '중진공 융자제한 2호는 "휴·폐업중인 기업"을 제외합니다. 과거 이력만 있고 현재 정상 영업 중이면 해당하지 않으므로 현재 사업자 상태 확인이 필요합니다.',
        unknown: '휴·폐업 이력 여부가 확인되지 않았습니다. 중진공 융자제한 2호 대상입니다.',
      },
      remedy: '사업자등록 상태(계속사업자) 확인 — 국세청 홈택스 사업자상태 조회',
    },
    {
      id: 'kosmes_industry', agency: 'kosmes', label: '융자제외 업종 (융자제한 5호)', ...SRC_KOSMES,
      test: () => 'conditional',
      detail: (f) => {
        const base = '중진공 융자제한 5호는 사행산업 등 국민 정서상 부적절한 업종(도박·사치·향락, 건강유해, 부동산 투기 등), 공공부문 운영 업종, 고소득·자금조달 용이 업종(법무·세무·보건 등 전문서비스, 금융 및 보험업 등)을 융자 대상에서 제외합니다. BizNavi의 업종 분류는 표준산업분류 코드가 아니므로 자동 판정할 수 없습니다.';
        return base + (_yes(f?.restrictedBiz)
          ? ' 제한업종에 해당한다고 응답하셨으므로 표준산업분류 코드로 중진공 융자제외 업종 여부를 확인하십시오.'
          : ' 사업자등록증의 표준산업분류 코드로 확인이 필요합니다.');
      },
      severity: (f) => (_yes(f?.restrictedBiz) ? 'high' : 'medium'),
      message: {
        blocked: '',
        conditional: '융자제외 업종 해당 여부는 표준산업분류 코드로 확인이 필요합니다.',
        unknown: '',
      },
      remedy: '사업자등록증상 표준산업분류 코드를 중진공 융자제외 업종 기준과 대조',
    },
    {
      id: 'kosmes_prime', agency: 'kosmes', label: '우량기업 제외 (융자제한 1호)', ...SRC_KOSMES,
      test: (f) => {
        const eq = f?.equityTotal, at = f?.assetTotal;
        if ((eq === null || eq === undefined) && (at === null || at === undefined)) return 'unknown';
        if ((typeof eq === 'number' && eq > 20000) || (typeof at === 'number' && at > 70000)) return 'blocked';
        return 'clear';
      },
      detail: (f, ctx, status) => {
        if (status !== 'blocked') return null;
        const parts = [];
        if (typeof f?.equityTotal === 'number' && f.equityTotal > 20000) parts.push('자기자본 ' + f.equityTotal.toLocaleString() + '백만원(200억원 초과)');
        if (typeof f?.assetTotal === 'number' && f.assetTotal > 70000) parts.push('자산총계 ' + f.assetTotal.toLocaleString() + '백만원(700억원 초과)');
        return '중진공 융자제한 1호에 해당합니다. ' + parts.join(', ') + ' — 민간 금융기관 이용이 가능한 우량기업으로 정책자금 대상이 아닙니다.';
      },
      message: {
        blocked: '중진공 융자제한 1호 우량기업에 해당합니다. 민간 금융기관 이용이 가능한 기업으로 정책자금 대상이 아닙니다.',
        conditional: '',
        unknown: '자기자본·자산총계가 입력되지 않아 융자제한 1호(우량기업) 해당 여부를 확인할 수 없습니다.',
      },
      remedy: '직전 사업연도 재무제표의 자기자본·자산총계 확인',
    },
    {
      id: 'kosmes_marginal', agency: 'kosmes', label: '한계기업 (융자제한 11호)', ...SRC_KOSMES,
      /* ⚠ 현재 수집 데이터로는 '2년 연속 적자', '3년 연속 이자보상배율 1.0 미만'을 알 수 없다.
            절대 blocked로 단정하지 않는다. */
      test: (f) => {
        const impair = f?.capitalImpair;
        const loss = (typeof f?.opProfit === 'number') && f.opProfit < 0;
        if (_yes(impair) || loss) return 'conditional';
        if (_unknown(impair) && (f?.opProfit === null || f?.opProfit === undefined)) return 'unknown';
        return 'clear';
      },
      detail: (f) => {
        const impair = _yes(f?.capitalImpair);
        const loss = (typeof f?.opProfit === 'number') && f.opProfit < 0;
        const base = '중진공 융자제한 11호는 "2년 연속 적자기업 중 자기자본 전액 잠식" 또는 "3년 연속 이자보상배율 1.0 미만"을 한계기업으로 봅니다.';
        if (impair && loss) {
          return base + ' 자본잠식과 영업적자가 동시에 확인되었습니다. 연속 연도 여부와 잠식 정도(부분/전액) 확인이 필요합니다.';
        }
        if (impair) {
          return base + ' 자본잠식이 확인되었습니다. 부분잠식만으로는 결격이 아니며, 전액 잠식 여부와 적자 연속 연도 확인이 필요합니다.';
        }
        if (loss) {
          return base + ' 영업적자가 확인되었습니다. 단년도 적자만으로는 결격이 아니며, 2년 연속 여부와 자기자본 잠식 여부 확인이 필요합니다.';
        }
        return null;
      },
      message: {
        blocked: '',
        conditional: '한계기업 해당 여부는 연속 연도 정보가 필요해 확인이 필요합니다.',
        unknown: '자본잠식 여부와 영업이익이 입력되지 않아 융자제한 11호(한계기업) 해당 여부를 확인할 수 없습니다.',
      },
      remedy: '최근 3개 사업연도 재무제표로 연속 적자 여부·자기자본 잠식 정도·이자보상배율 확인',
    },
    {
      id: 'kosmes_debt_ratio', agency: 'kosmes', label: '업종별 융자제한 부채비율 (융자제한 10호)', ...SRC_KOSMES,
      /* ⚠ 별표5의 업종별 구체 수치는 앱에 없다. 임의 기준을 만들지 않는다. */
      test: (f) => (typeof f?.debtRatio === 'number' ? 'conditional' : 'unknown'),
      detail: (f, ctx) => {
        const age = _businessAge(ctx);
        const ageText = (age !== null)
          ? ' 업력 약 ' + age + '년으로 추정되며, 업력 7년 미만 기업은 부채비율 적용 예외 대상입니다. 정확한 기준일은 중진공 확인이 필요합니다.'
          : ' 업력 7년 미만 기업, 간편장부대상 사업자, 협동조합은 적용 예외입니다.';
        return '산출된 부채비율은 ' + f.debtRatio.toFixed(1) + '%입니다. 중진공 융자제한 10호는 업종별 융자제한 부채비율(별표5) 초과 기업을 제외하며, 별표5의 업종별 기준 수치는 중진공 공고에서 확인해야 합니다.' + ageText;
      },
      severity: () => 'medium',
      message: {
        blocked: '',
        conditional: '업종별 융자제한 부채비율(별표5) 대비 확인이 필요합니다.',
        unknown: '부채총계·자본총계가 입력되지 않아 부채비율을 산출할 수 없습니다. 자본총계가 0 이하이면 부채비율 산출이 불가합니다.',
      },
      remedy: '중진공 공고 별표5의 업종별 융자제한 부채비율과 대조',
    },
    {
      id: 'kosmes_prior', agency: 'kosmes', label: '기존 지원 한도 (융자제한 13·15호)', ...SRC_KOSMES,
      test: (f) => _unknown(f?.priorSupport) ? 'unknown' : (_yes(f.priorSupport) ? 'conditional' : 'clear'),
      message: {
        blocked: '',
        conditional: '중진공 융자제한 13·15호는 "최근 5년간 정책자금·보증 지원 합계 200억원 초과" 또는 "최근 5년 이내 3회 이상 지원"을 제한합니다. 자금 종류에 따라 한도 산정에서 제외되는 예외 자금이 있으므로 중진공 확인이 필요합니다.',
        unknown: '기존 정책자금·보증 지원 이력이 확인되지 않았습니다. 최근 5년간 지원 횟수·누계 금액을 중진공에 확인해 주십시오.',
      },
      remedy: '최근 5년간 정책자금·보증 지원 내역 및 누계 금액 조회',
    },
  ];

  /* ── 중진공 기관 자격 판정 (융자제한 9호 — 소상공인 원칙 제외) ──
     ⚠ 자격이 확정되지 않은 상태에서 개별 규칙 경고를 띄우는 것은 오진이므로,
        eligible=false이면 (uncertain 포함) 중진공 개별 규칙을 평가하지 않는다. */
  function _kosmesEligibility(f, ctx) {
    if ((ctx?.bizScale || '') !== 'micro') return { eligible: true, eligibilityUncertain: false };

    const certs = Array.isArray(f?.certs) ? f.certs : [];
    const hasSocialCert = certs.some(c => KOSMES_SOCIAL_CERTS.indexOf(c) >= 0);
    if (hasSocialCert) {
      return { eligible: true, eligibilityUncertain: false, exceptionBy: '(예비)사회적기업·협동조합·마을기업·소셜벤처 예외' };
    }

    const industryKey = ctx?.industryKey || '';
    if (KOSMES_MFG_INDUSTRIES.indexOf(industryKey) >= 0) {
      return { eligible: true, eligibilityUncertain: false, exceptionBy: '제조업 영위 예외' };
    }

    const uncertain = KOSMES_MAYBE_MFG_INDUSTRIES.indexOf(industryKey) >= 0;
    const reason = uncertain
      ? '소상공인은 중진공 융자제한 9호로 원칙 제외이나, 제조 공정을 직접 영위하면 예외 대상일 수 있습니다. 중진공 확인이 필요합니다.'
      : '소상공인은 중진공 융자제한 9호로 원칙 제외입니다.';
    return { eligible: false, eligibilityUncertain: uncertain, notEligibleReason: reason + KOSMES_UNVERIFIABLE_TAIL };
  }

  /* ── 판정 실행 ─────────────────────────────────────────────── */

  const DEFAULT_SEVERITY = { blocked: 'high', conditional: 'medium', unknown: 'medium', clear: 'low' };

  function _runRule(rule, f, ctx) {
    let status;
    try { status = rule.test(f, ctx); } catch (e) { status = 'unknown'; }
    if (['blocked', 'conditional', 'clear', 'unknown'].indexOf(status) < 0) status = 'unknown';
    if (status === 'clear') return null;   // clear는 findings에 담지 않는다

    let message = (rule.message && rule.message[status]) || '';
    if (typeof rule.detail === 'function') {
      try {
        const custom = rule.detail(f, ctx, status);
        if (custom) message = custom;
      } catch (e) { /* detail 실패 시 기본 message 사용 */ }
    }

    let severity = DEFAULT_SEVERITY[status] || 'medium';
    if (typeof rule.severity === 'function') {
      try { severity = rule.severity(f, ctx, status) || severity; } catch (e) { /* 기본값 유지 */ }
    }

    return {
      id: rule.id,
      label: rule.label,
      status: status,
      severity: severity,
      message: message,
      remedy: rule.remedy || '',
      source: rule.source || '',
      sourceUrl: rule.sourceUrl || '',
    };
  }

  function _verdictOf(findings) {
    if (findings.some(x => x.status === 'blocked')) return 'blocked';
    if (findings.some(x => x.status === 'conditional' || x.status === 'unknown')) return 'review';
    return 'clear';
  }

  /**
   * @param {Object} fundingData  wizard.js collect().fundingData (없을 수 있음)
   * @param {Object} context      { industryKey, bizScale, employees, foundedYear, ... }
   */
  function evaluate(fundingData, context) {
    const f = fundingData || {};
    const ctx = context || {};
    const agencies = [];
    const unknownSet = [];

    const pushUnknown = list => list.forEach(x => {
      if (x.status === 'unknown' && unknownSet.indexOf(x.label) < 0) unknownSet.push(x.label);
    });

    /* ── 소진공: 기관 자격 게이트 없음 (규모는 semas_scale 규칙으로 평가) ── */
    const semasFindings = RULES
      .filter(r => r.agency === 'semas')
      .map(r => _runRule(r, f, ctx))
      .filter(Boolean);
    pushUnknown(semasFindings);

    agencies.push({
      key: 'semas',
      name: AGENCIES.semas.name,
      short: AGENCIES.semas.short,
      url: AGENCIES.semas.url,
      eligible: true,
      eligibilityUncertain: false,
      verdict: _verdictOf(semasFindings),
      blockedCount:     semasFindings.filter(x => x.status === 'blocked').length,
      conditionalCount: semasFindings.filter(x => x.status === 'conditional').length,
      unknownCount:     semasFindings.filter(x => x.status === 'unknown').length,
      findings: semasFindings,
    });

    /* ── 중진공: 자격 게이트 통과 시에만 개별 규칙 평가 ── */
    const kEli = _kosmesEligibility(f, ctx);
    let kosmesFindings = [];
    if (kEli.eligible) {
      kosmesFindings = RULES
        .filter(r => r.agency === 'kosmes')
        .map(r => _runRule(r, f, ctx))
        .filter(Boolean);
      pushUnknown(kosmesFindings);
    }

    agencies.push({
      key: 'kosmes',
      name: AGENCIES.kosmes.name,
      short: AGENCIES.kosmes.short,
      url: AGENCIES.kosmes.url,
      eligible: !!kEli.eligible,
      eligibilityUncertain: !!kEli.eligibilityUncertain,
      notEligibleReason: kEli.eligible ? undefined : kEli.notEligibleReason,
      exceptionBy: kEli.exceptionBy,
      verdict: kEli.eligible ? _verdictOf(kosmesFindings) : 'review',
      blockedCount:     kosmesFindings.filter(x => x.status === 'blocked').length,
      conditionalCount: kosmesFindings.filter(x => x.status === 'conditional').length,
      unknownCount:     kosmesFindings.filter(x => x.status === 'unknown').length,
      findings: kosmesFindings,
    });

    /* 자격 있는 기관만, 쟁점이 적은 순 → 동점이면 규모에 맞는 기관 우선 */
    const RANK = { clear: 0, review: 1, blocked: 2 };
    const preferred = (ctx.bizScale === 'sme') ? 'kosmes' : 'semas';
    const recommendedOrder = agencies
      .filter(a => a.eligible)
      .slice()
      .sort((a, b) =>
        (RANK[a.verdict] - RANK[b.verdict]) ||
        (a.blockedCount - b.blockedCount) ||
        ((a.key === preferred ? 0 : 1) - (b.key === preferred ? 0 : 1))
      )
      .map(a => a.key);

    return { agencies, unknownItems: unknownSet, recommendedOrder };
  }

  return {
    evaluate,
    AGENCIES,
    EXCLUDED_INDUSTRIES_SEMAS,
    INDUSTRY_WATCH,
    RULES,
  };

})();

if (typeof window !== 'undefined') window.FundingRules = FundingRules;
if (typeof module !== 'undefined') module.exports = FundingRules;
