/**
 * Vercel Serverless Function: /api/dart-lookup
 * DART(금융감독원 전자공시) API로 기업 재무제표 조회
 *
 * 환경변수 설정 필요 (Vercel Dashboard → Settings → Environment Variables):
 *   DART_API_KEY = opendart.fss.or.kr 에서 발급받은 API 키
 *
 * DART API 키 발급:
 *   https://opendart.fss.or.kr/ → 인증키 신청/관리 → 개발계정 신청
 *
 * 주의: 상장사 및 외부감사 대상 법인만 데이터 존재.
 *       소상공인/개인사업자는 조회 결과 없을 수 있음.
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
    // 회사명 변형 목록 생성 (주), ㈜, 주식회사 등 자동 처리
    function getNameVariants(name) {
      const core = name
        .replace(/^\(주\)\s*/i, '').replace(/^㈜\s*/, '')
        .replace(/^주식회사\s+/i, '').replace(/\s*\(주\)$/i, '')
        .replace(/\s*㈜$/, '').trim();
      return [...new Set([name, core, `주식회사 ${core}`, `㈜${core}`, `(주)${core}`])];
    }

    // 1단계: 회사명 변형 순서대로 시도
    const variants = getNameVariants(companyName.trim());
    let searchData = null;
    for (const variant of variants) {
      const searchUrl = `https://opendart.fss.or.kr/api/company.json?crtfc_key=${apiKey}&corp_name=${encodeURIComponent(variant)}&page_no=1&page_count=10`;
      console.log('[DART] searching variant:', variant);
      const searchRes = await fetch(searchUrl);
      const data = await searchRes.json();
      console.log('[DART] response status:', data.status, '/ total_count:', data.total_count, '/ list length:', data.list?.length ?? 'no list', '/ keys:', Object.keys(data).join(','));
      if (data.status === '000' && data.list && data.list.length > 0) {
        searchData = data; break;
      }
      // list 없이 단일 객체로 응답하는 경우 처리
      if (data.status === '000' && data.corp_code) {
        searchData = { list: [data] }; break;
      }
    }

    if (!searchData) {
      return res.status(200).json({ status: 'not_found', message: 'DART에 등록된 기업 정보가 없습니다.' });
    }

    // 첫 번째 결과 사용 (가장 유사한 회사명)
    const corp = searchData.list[0];
    const corpCode = corp.corp_code;
    // DART company 검색 결과에 업종코드·업종명 포함됨
    const indutyCode = corp.induty_code || '';
    const indutyName = corp.induty_nm  || '';

    // 2단계: 최근 사업보고서 재무제표 조회 (전년도부터 최대 2년 시도)
    const currentYear = new Date().getFullYear();
    let finData = null;

    for (let year = currentYear - 1; year >= currentYear - 3; year--) {
      const finUrl = `https://opendart.fss.or.kr/api/fnlttSinglAcnt.json?crtfc_key=${apiKey}&corp_code=${corpCode}&bsns_year=${year}&reprt_code=11011&fs_div=CFS`;
      const finRes = await fetch(finUrl);
      const fin = await finRes.json();

      if (fin.status === '000' && fin.list && fin.list.length > 0) {
        finData = { year, list: fin.list };
        break;
      }

      // 연결재무제표 없으면 별도재무제표 시도
      const finUrl2 = `https://opendart.fss.or.kr/api/fnlttSinglAcnt.json?crtfc_key=${apiKey}&corp_code=${corpCode}&bsns_year=${year}&reprt_code=11011&fs_div=OFS`;
      const finRes2 = await fetch(finUrl2);
      const fin2 = await finRes2.json();
      if (fin2.status === '000' && fin2.list && fin2.list.length > 0) {
        finData = { year, list: fin2.list };
        break;
      }
    }

    if (!finData) {
      return res.status(200).json({
        status: 'no_financial',
        corpName: corp.corp_name,
        stockCode: corp.stock_code,
        message: '기업은 검색되었으나 재무제표 데이터가 없습니다.'
      });
    }

    // 3단계: 재무 항목 추출 (복수 계정과목명 매칭)
    const items = finData.list;
    console.log('DART items count:', items.length, '/ sample:', items.slice(0,3).map(i=>i.account_nm));

    // 여러 후보명 중 첫 번째 매칭 값 반환 (당기 없으면 전기 fallback)
    const get = (...names) => {
      for (const nm of names) {
        const norm = nm.replace(/\s/g,'');
        const found = items.find(i => i.account_nm && i.account_nm.replace(/\s/g,'').includes(norm));
        if (found) {
          const val = found.thstrm_amount || found.frmtrm_amount;
          if (val && val !== '0') return val;
        }
      }
      return null;
    };

    // ── 재무상태표 (B/S) ──
    const currentAssets      = get('유동자산');
    const quickAssets        = get('당좌자산');
    const cash               = get('현금및현금성자산','현금및단기금융상품','현금과예금');
    const receivable         = get('매출채권및기타채권','매출채권','받을어음및매출채권');
    const inventory          = get('재고자산');
    const nonCurrentAssets   = get('비유동자산');
    const tangibleAssets     = get('유형자산');
    const totalAssets        = get('자산총계');
    const currentLiabilities = get('유동부채');
    const payable            = get('매입채무및기타채무','매입채무','미지급금');
    const nonCurrentLiab     = get('비유동부채');
    const borrowings         = get('차입금','단기차입금'); // 장단기 합산은 아래서 처리
    const totalDebt          = get('부채총계');
    const equity             = get('자본총계','자기자본');

    // ── 손익계산서 (I/S) ──
    const revenue            = get('매출액','영업수익','수익(매출액)','매출');
    const grossProfit        = get('매출총이익','매출총손익');
    const operatingProfit    = get('영업이익','영업손익');
    const interestExpense    = get('이자비용','금융비용');
    const netIncome          = get('당기순이익','당기순손익');
    const laborCost          = get('인건비','급여','종업원급여','급여및임원보수');

    // 억원 단위 변환
    const toEok = (val) => {
      if (!val) return null;
      const n = parseInt(val.replace(/,/g, ''), 10);
      if (isNaN(n)) return null;
      return Math.round(n / 100000000);
    };

    const r = (val) => val ? { raw: val, eok: toEok(val) } : null;

    return res.status(200).json({
      status: 'found',
      corpName:   corp.corp_name,
      stockCode:  corp.stock_code || '',
      indutyCode,
      indutyName,
      year:       finData.year,
      // B/S
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
      // I/S
      revenue:            r(revenue),
      grossProfit:        r(grossProfit),
      operatingProfit:    r(operatingProfit),
      interestExpense:    r(interestExpense),
      netIncome:          r(netIncome),
      laborCost:          r(laborCost),
      debtRatio: (totalAssets && totalDebt)
        ? Math.round(parseInt(totalDebt.replace(/,/g,'')) / parseInt(totalAssets.replace(/,/g,'')) * 100)
        : null
    });

  } catch (err) {
    console.error('dart-lookup error:', err);
    return res.status(200).json({ status: 'error', message: '조회 중 오류가 발생했습니다.' });
  }
};
