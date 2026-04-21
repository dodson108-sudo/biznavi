/**
 * Vercel Serverless Function: /api/dart-lookup
 * DART(금융감독원 전자공시) API로 기업 재무제표 조회
 *
 * 올바른 호출 순서:
 *  1. list.json (공시목록) — corp_name으로 검색 → corp_code 획득
 *  2. company.json        — corp_code로 업종코드·업종명 조회
 *  3. fnlttSinglAcnt.json — corp_code로 재무제표 조회
 *
 * 환경변수: DART_API_KEY (opendart.fss.or.kr에서 발급)
 */

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { companyName } = req.body || {};
  if (!companyName || companyName.trim().length < 2) {
    return res.status(400).json({ error: '회사명을 2자 이상 입력해주세요.' });
  }

  const apiKey = process.env.DART_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ status: 'no_key', message: 'DART API 키가 설정되지 않았습니다.' });
  }

  try {
    // 회사명 변형 목록 생성
    function getNameVariants(name) {
      const core = name
        .replace(/^\(주\)\s*/i, '').replace(/^㈜\s*/, '')
        .replace(/^주식회사\s+/i, '').replace(/\s*\(주\)$/i, '')
        .replace(/\s*㈜$/, '').trim();
      return [...new Set([core, name, `주식회사 ${core}`, `㈜${core}`, `(주)${core}`])];
    }

    // ── 1단계: list.json으로 회사명 검색 → corp_code 획득 ──
    const variants = getNameVariants(companyName.trim());
    let corpCode = null;
    let corpNameFound = null;
    let stockCode = null;
    let lastDartStatus = null;

    for (const variant of variants) {
      const listUrl = `https://opendart.fss.or.kr/api/list.json?crtfc_key=${apiKey}&corp_name=${encodeURIComponent(variant)}&bgn_de=20220101&end_de=20251231&pblntf_ty=A&page_count=5`;
      console.log('[DART] list.json 검색:', variant);
      const listRes = await fetch(listUrl);
      const listData = await listRes.json();
      lastDartStatus = listData.status;
      console.log('[DART] list.json 응답:', listData.status, '건수:', listData.list?.length ?? 0);

      // API 키 오류이면 즉시 반환
      if (listData.status === '010' || listData.status === '011') {
        return res.status(200).json({
          status: 'api_key_error',
          dartStatus: listData.status,
          message: `DART API 키 오류 (${listData.status})`
        });
      }

      if (listData.status === '000' && listData.list && listData.list.length > 0) {
        // 정확히 일치하는 회사명 우선, 없으면 첫 번째 결과
        const exact = listData.list.find(item =>
          item.corp_name.replace(/\s/g, '') === variant.replace(/\s/g, '')
        );
        const match = exact || listData.list[0];
        corpCode = match.corp_code;
        corpNameFound = match.corp_name;
        stockCode = match.stock_code || '';
        console.log('[DART] corp_code 획득:', corpCode, corpNameFound);
        break;
      }
    }

    if (!corpCode) {
      return res.status(200).json({
        status: 'not_found',
        dartStatus: lastDartStatus,
        message: 'DART에 등록된 기업 정보가 없습니다.'
      });
    }

    // ── 2단계: company.json으로 업종코드·업종명 조회 (corp_code 사용) ──
    let indutyCode = '';
    let indutyName = '';
    try {
      const compUrl = `https://opendart.fss.or.kr/api/company.json?crtfc_key=${apiKey}&corp_code=${corpCode}`;
      const compRes = await fetch(compUrl);
      const compData = await compRes.json();
      console.log('[DART] company.json 응답:', compData.status, compData.induty_code, compData.induty_nm);
      if (compData.status === '000') {
        indutyCode = compData.induty_code || '';
        indutyName = compData.induty_nm  || '';
        if (!corpNameFound) corpNameFound = compData.corp_name;
        if (!stockCode)    stockCode     = compData.stock_code || '';
      }
    } catch (e) {
      console.warn('[DART] company.json 오류(업종 미조회):', e.message);
    }

    // ── 3단계: 재무제표 조회 (최근 3개년 시도) ──
    const currentYear = new Date().getFullYear();
    let finData = null;

    for (let year = currentYear - 1; year >= currentYear - 3; year--) {
      // 연결재무제표 우선
      const finUrl = `https://opendart.fss.or.kr/api/fnlttSinglAcnt.json?crtfc_key=${apiKey}&corp_code=${corpCode}&bsns_year=${year}&reprt_code=11011&fs_div=CFS`;
      const finRes = await fetch(finUrl);
      const fin = await finRes.json();
      console.log(`[DART] 재무(CFS) ${year}:`, fin.status, '건수:', fin.list?.length ?? 0);
      if (fin.status === '000' && fin.list && fin.list.length > 0) {
        finData = { year, list: fin.list };
        break;
      }
      // 별도재무제표 fallback
      const finUrl2 = `https://opendart.fss.or.kr/api/fnlttSinglAcnt.json?crtfc_key=${apiKey}&corp_code=${corpCode}&bsns_year=${year}&reprt_code=11011&fs_div=OFS`;
      const finRes2 = await fetch(finUrl2);
      const fin2 = await finRes2.json();
      console.log(`[DART] 재무(OFS) ${year}:`, fin2.status, '건수:', fin2.list?.length ?? 0);
      if (fin2.status === '000' && fin2.list && fin2.list.length > 0) {
        finData = { year, list: fin2.list };
        break;
      }
    }

    if (!finData) {
      return res.status(200).json({
        status: 'no_financial',
        corpName: corpNameFound,
        stockCode,
        message: '기업은 검색되었으나 재무제표 데이터가 없습니다.'
      });
    }

    // ── 4단계: 재무 항목 추출 ──
    const items = finData.list;
    console.log('[DART] 재무항목 수:', items.length, '샘플:', items.slice(0, 3).map(i => i.account_nm));

    const get = (...names) => {
      for (const nm of names) {
        const norm = nm.replace(/\s/g, '');
        const found = items.find(i => i.account_nm && i.account_nm.replace(/\s/g, '').includes(norm));
        if (found) {
          const val = found.thstrm_amount || found.frmtrm_amount;
          if (val && val !== '0') return val;
        }
      }
      return null;
    };

    // 재무상태표 (B/S)
    const currentAssets      = get('유동자산');
    const quickAssets        = get('당좌자산');
    const cash               = get('현금및현금성자산', '현금및단기금융상품', '현금과예금');
    const receivable         = get('매출채권및기타채권', '매출채권', '받을어음및매출채권');
    const inventory          = get('재고자산');
    const nonCurrentAssets   = get('비유동자산');
    const tangibleAssets     = get('유형자산');
    const totalAssets        = get('자산총계');
    const currentLiabilities = get('유동부채');
    const payable            = get('매입채무및기타채무', '매입채무', '미지급금');
    const nonCurrentLiab     = get('비유동부채');
    const borrowings         = get('차입금', '단기차입금');
    const totalDebt          = get('부채총계');
    const equity             = get('자본총계', '자기자본');

    // 손익계산서 (I/S)
    const revenue            = get('매출액', '영업수익', '수익(매출액)', '매출');
    const grossProfit        = get('매출총이익', '매출총손익');
    const operatingProfit    = get('영업이익', '영업손익');
    const interestExpense    = get('이자비용', '금융비용');
    const netIncome          = get('당기순이익', '당기순손익');
    const laborCost          = get('인건비', '급여', '종업원급여', '급여및임원보수');

    const toEok = (val) => {
      if (!val) return null;
      const n = parseInt(val.replace(/,/g, ''), 10);
      if (isNaN(n)) return null;
      return Math.round(n / 100000000);
    };
    const r = (val) => val ? { raw: val, eok: toEok(val) } : null;

    return res.status(200).json({
      status: 'found',
      corpName:   corpNameFound,
      stockCode,
      indutyCode,
      indutyName,
      year:       finData.year,
      currentAssets:      r(currentAssets),
      quickAssets:        r(quickAssets),
      cash:               r(cash),
      receivable:         r(receivable),
      inventory:          r(inventory),
      nonCurrentAssets:   r(nonCurrentAssets),
      tangibleAssets:     r(tangibleAssets),
      totalAssets:        r(totalAssets),
      currentLiabilities: r(currentLiabilities),
      payable:            r(payable),
      nonCurrentLiab:     r(nonCurrentLiab),
      borrowings:         r(borrowings),
      totalDebt:          r(totalDebt),
      equity:             r(equity),
      revenue:            r(revenue),
      grossProfit:        r(grossProfit),
      operatingProfit:    r(operatingProfit),
      interestExpense:    r(interestExpense),
      netIncome:          r(netIncome),
      laborCost:          r(laborCost),
      debtRatio: (totalAssets && totalDebt)
        ? Math.round(parseInt(totalDebt.replace(/,/g, '')) / parseInt(totalAssets.replace(/,/g, '')) * 100)
        : null
    });

  } catch (err) {
    console.error('[DART] 오류:', err);
    return res.status(200).json({ status: 'error', message: '조회 중 오류가 발생했습니다.' });
  }
};
