/**
 * Vercel Serverless Function: /api/dart-lookup
 * DART(금융감독원 전자공시) API로 기업 재무제표 조회
 *
 * DART API는 회사명 직접 검색을 지원하지 않음.
 * 정석 순서:
 *  1. corpCode.xml (ZIP) 다운로드 → 전체 기업목록에서 corp_code 검색
 *  2. company.json?corp_code=... → 업종코드·업종명 조회
 *  3. fnlttSinglAcnt.json?corp_code=... → 재무제표 조회
 *
 * 환경변수: DART_API_KEY (opendart.fss.or.kr에서 발급)
 */

const AdmZip = require('adm-zip');

// 기업목록 인메모리 캐시 (Vercel warm start 활용)
let _corpCache = null;
let _corpCacheTime = 0;
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6시간

async function _loadCorpList(apiKey) {
  const now = Date.now();
  if (_corpCache && now - _corpCacheTime < CACHE_TTL) return _corpCache;

  console.log('[DART] corpCode.xml 다운로드 시작...');
  const url = `https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key=${apiKey}`;
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());

  const zip = new AdmZip(buf);
  const entries = zip.getEntries();
  const entryNames = entries.map(e => e.entryName);
  console.log('[DART] ZIP 내 파일:', entryNames);

  const entry = entries.find(e => /corpcode/i.test(e.entryName)) || entries[0];
  if (!entry) throw new Error('ZIP 파일이 비어있습니다');

  const xml = entry.getData().toString('utf-8');
  console.log('[DART] XML 첫 300자:', xml.slice(0, 300));

  const map = new Map(); // corp_name → { corpCode, stockCode }

  // corp_code / corp_name 을 순서대로 추출 — 외부 태그 구조와 무관
  const codes  = [...xml.matchAll(/<corp_code>\s*(\d+)\s*<\/corp_code>/gi)].map(m => m[1]);
  const names  = [...xml.matchAll(/<corp_name>\s*([^<]+?)\s*<\/corp_name>/gi)].map(m => m[1].trim());
  const stocks = [...xml.matchAll(/<stock_code>\s*([^<]*?)\s*<\/stock_code>/gi)].map(m => m[1].trim());

  console.log('[DART] 추출된 corp_code 수:', codes.length, '/ corp_name 수:', names.length);

  const len = Math.min(codes.length, names.length);
  for (let i = 0; i < len; i++) {
    if (!map.has(names[i])) {
      map.set(names[i], { corpCode: codes[i], stockCode: stocks[i] || '' });
    }
  }
  console.log('[DART] 파싱 완료:', map.size, '개 / 샘플:', [...map.keys()].slice(0, 3));

  // 빈 맵은 캐시하지 않음 (오류 상황에서 6시간 고착 방지)
  if (map.size > 0) {
    _corpCache = map;
    _corpCacheTime = now;
  }
  return map;
}

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
    // 회사명 변형 목록 (핵심명 우선)
    function getNameVariants(name) {
      const core = name
        .replace(/^\(주\)\s*/i, '').replace(/^㈜\s*/, '')
        .replace(/^주식회사\s+/i, '').replace(/\s*\(주\)$/i, '')
        .replace(/\s*㈜$/, '').trim();
      return [...new Set([core, name, `주식회사 ${core}`, `㈜${core}`, `(주)${core}`])];
    }

    // ── 1단계: 전체 기업목록에서 corp_code 검색 ──
    const corpList = await _loadCorpList(apiKey);
    const variants = getNameVariants(companyName.trim());

    let corpCode = null;
    let corpNameFound = null;
    let stockCode = '';

    // 정확 매칭 우선
    for (const v of variants) {
      if (corpList.has(v)) {
        const info = corpList.get(v);
        corpCode = info.corpCode;
        corpNameFound = v;
        stockCode = info.stockCode;
        break;
      }
    }

    // 정확 매칭 실패 시 부분 매칭 (핵심명 포함 여부)
    if (!corpCode) {
      const core = variants[0]; // 핵심명
      for (const [name, info] of corpList) {
        if (name.replace(/\s/g, '').includes(core.replace(/\s/g, ''))) {
          corpCode = info.corpCode;
          corpNameFound = name;
          stockCode = info.stockCode;
          break;
        }
      }
    }

    console.log('[DART] 검색 결과:', corpCode, corpNameFound);

    if (!corpCode) {
      const sample = corpList.size > 0 ? [...corpList.keys()].slice(0, 5) : [];
      return res.status(200).json({
        status: 'not_found',
        corpListSize: corpList.size,
        sample,
        message: 'DART에 등록된 기업 정보가 없습니다.'
      });
    }

    // ── 2단계: company.json으로 업종코드·업종명 조회 ──
    let indutyCode = '';
    let indutyName = '';
    try {
      const compRes = await fetch(`https://opendart.fss.or.kr/api/company.json?crtfc_key=${apiKey}&corp_code=${corpCode}`);
      const compData = await compRes.json();
      console.log('[DART] company.json:', compData.status, compData.induty_code);
      if (compData.status === '000') {
        indutyCode = compData.induty_code || '';
        indutyName = compData.induty_nm  || '';
        if (!corpNameFound) corpNameFound = compData.corp_name;
      }
    } catch (e) {
      console.warn('[DART] company.json 오류:', e.message);
    }

    // ── 3단계: 재무제표 조회 (최근 3개년) ──
    let finData = null;
    const currentYear = new Date().getFullYear();

    for (let year = currentYear - 1; year >= currentYear - 3; year--) {
      const cfsRes = await fetch(`https://opendart.fss.or.kr/api/fnlttSinglAcnt.json?crtfc_key=${apiKey}&corp_code=${corpCode}&bsns_year=${year}&reprt_code=11011&fs_div=CFS`);
      const cfs = await cfsRes.json();
      console.log(`[DART] 재무(CFS) ${year}:`, cfs.status, cfs.list?.length ?? 0);
      if (cfs.status === '000' && cfs.list?.length > 0) { finData = { year, list: cfs.list }; break; }

      const ofsRes = await fetch(`https://opendart.fss.or.kr/api/fnlttSinglAcnt.json?crtfc_key=${apiKey}&corp_code=${corpCode}&bsns_year=${year}&reprt_code=11011&fs_div=OFS`);
      const ofs = await ofsRes.json();
      console.log(`[DART] 재무(OFS) ${year}:`, ofs.status, ofs.list?.length ?? 0);
      if (ofs.status === '000' && ofs.list?.length > 0) { finData = { year, list: ofs.list }; break; }
    }

    if (!finData) {
      return res.status(200).json({ status: 'no_financial', corpName: corpNameFound, stockCode, message: '기업은 검색되었으나 재무제표 데이터가 없습니다.' });
    }

    // ── 4단계: 재무 항목 추출 ──
    const items = finData.list;
    console.log('[DART] 재무항목 수:', items.length);

    // 계정명 매칭: 포함 검색, 여러 금액 필드 순서대로 fallback
    const get = (...names) => {
      for (const nm of names) {
        const norm = nm.replace(/\s/g, '');
        const found = items.find(i => i.account_nm?.replace(/\s/g, '').includes(norm));
        if (found) {
          const val = found.thstrm_amount || found.thstrm_add_amount
                   || found.frmtrm_amount || found.frmtrm_add_amount;
          if (val && val !== '0') return val;
        }
      }
      return null;
    };

    // 계정명 전체 목록 로그 (Vercel 로그에서 확인용)
    console.log('[DART] 계정명 목록:', items.map(i => i.account_nm).join(' | '));

    const currentAssets      = get('유동자산');
    const quickAssets        = get('당좌자산', '당좌및단기금융');
    const cash               = get('현금및현금성자산', '현금및단기금융상품', '현금과예금', '현금성자산');
    const receivable         = get('매출채권및기타채권', '매출채권', '받을어음및매출채권', '매출채권및어음');
    const inventory          = get('재고자산', '상품및제품', '제품및상품');
    const nonCurrentAssets   = get('비유동자산');
    const tangibleAssets     = get('유형자산');
    const totalAssets        = get('자산총계');
    const currentLiabilities = get('유동부채');
    const payable            = get('매입채무및기타채무', '매입채무', '미지급금', '매입채무및어음');
    const nonCurrentLiab     = get('비유동부채');
    const borrowings         = get('단기차입금', '차입금', '장단기차입금');
    const totalDebt          = get('부채총계');
    const equity             = get('자본총계', '자기자본');
    const revenue            = get('매출액', '영업수익', '수익(매출액)', '매출');
    const grossProfit        = get('매출총이익', '매출총손익', '총이익');
    const operatingProfit    = get('영업이익', '영업손익');
    const interestExpense    = get('이자비용', '금융비용', '이자및금융비용');
    const netIncome          = get('당기순이익', '당기순손익');
    const laborCost          = get('인건비', '종업원급여', '급여', '급여및임원보수', '급여비용');

    const toEok = v => { if (!v) return null; const n = parseInt(v.replace(/,/g, ''), 10); return isNaN(n) ? null : Math.round(n / 100000000); };
    const r = v => v ? { raw: v, eok: toEok(v) } : null;

    return res.status(200).json({
      status: 'found',
      corpName: corpNameFound,
      stockCode,
      indutyCode,
      indutyName,
      year: finData.year,
      _debugAccounts: items.map(i => i.account_nm),
      currentAssets: r(currentAssets), quickAssets: r(quickAssets), cash: r(cash),
      receivable: r(receivable), inventory: r(inventory), nonCurrentAssets: r(nonCurrentAssets),
      tangibleAssets: r(tangibleAssets), totalAssets: r(totalAssets),
      currentLiabilities: r(currentLiabilities), payable: r(payable),
      nonCurrentLiab: r(nonCurrentLiab), borrowings: r(borrowings),
      totalDebt: r(totalDebt), equity: r(equity),
      revenue: r(revenue), grossProfit: r(grossProfit), operatingProfit: r(operatingProfit),
      interestExpense: r(interestExpense), netIncome: r(netIncome), laborCost: r(laborCost),
      debtRatio: (totalAssets && totalDebt)
        ? Math.round(parseInt(totalDebt.replace(/,/g, '')) / parseInt(totalAssets.replace(/,/g, '')) * 100)
        : null
    });

  } catch (err) {
    console.error('[DART] 오류:', err.message);
    return res.status(200).json({ status: 'error', message: `조회 오류: ${err.message}` });
  }
};
