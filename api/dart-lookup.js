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
    // 1단계: 회사명으로 corp_code 검색
    const searchUrl = `https://opendart.fss.or.kr/api/company.json?crtfc_key=${apiKey}&corp_name=${encodeURIComponent(companyName.trim())}&page_count=5`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (searchData.status !== '000' || !searchData.list || searchData.list.length === 0) {
      return res.status(200).json({ status: 'not_found', message: 'DART에 등록된 기업 정보가 없습니다.' });
    }

    // 첫 번째 결과 사용 (가장 유사한 회사명)
    const corp = searchData.list[0];
    const corpCode = corp.corp_code;

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

    // 3단계: 주요 재무 항목 추출
    const items = finData.list;
    const getAmount = (accountNm) => {
      const found = items.find(i =>
        i.account_nm && (i.account_nm.includes(accountNm) || accountNm.includes(i.account_nm))
      );
      return found ? found.thstrm_amount : null;
    };

    const revenue       = getAmount('매출액') || getAmount('영업수익') || getAmount('수익(매출액)');
    const operatingProfit = getAmount('영업이익');
    const netIncome     = getAmount('당기순이익');
    const totalAssets   = getAmount('자산총계');
    const totalDebt     = getAmount('부채총계');

    // 억원 단위 변환
    const toEok = (val) => {
      if (!val) return null;
      const n = parseInt(val.replace(/,/g, ''), 10);
      if (isNaN(n)) return null;
      return Math.round(n / 100000000);
    };

    const revenueEok = toEok(revenue);

    return res.status(200).json({
      status: 'found',
      corpName:   corp.corp_name,
      stockCode:  corp.stock_code || '',
      year:       finData.year,
      revenue:    revenue       ? { raw: revenue,        eok: revenueEok }    : null,
      operatingProfit: operatingProfit ? { raw: operatingProfit, eok: toEok(operatingProfit) } : null,
      netIncome:  netIncome     ? { raw: netIncome,      eok: toEok(netIncome) }   : null,
      totalAssets: totalAssets  ? { raw: totalAssets,    eok: toEok(totalAssets) } : null,
      totalDebt:  totalDebt     ? { raw: totalDebt,      eok: toEok(totalDebt) }   : null,
      debtRatio:  (totalAssets && totalDebt)
        ? Math.round(parseInt(totalDebt.replace(/,/g,'')) / parseInt(totalAssets.replace(/,/g,'')) * 100)
        : null
    });

  } catch (err) {
    console.error('dart-lookup error:', err);
    return res.status(200).json({ status: 'error', message: '조회 중 오류가 발생했습니다.' });
  }
};
