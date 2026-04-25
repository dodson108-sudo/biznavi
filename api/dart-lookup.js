/**
 * Vercel Serverless Function: /api/dart-lookup
 * DART(금융감독원 전자공시) API로 기업 재무제표 조회
 *
 * 조회 순서:
 *  1. corp-list.json(로컬) 또는 corpCode.xml(DART) → corp_code 검색
 *  2. company.json → 업종코드·업종명
 *  3. fnlttSinglAcnt → 주요계정 (~12개)
 *  4. fnlttXbrl.xml  → XBRL로 누락 항목 보완 (현금·재고·유형자산 등)
 *
 * 환경변수: DART_API_KEY (opendart.fss.or.kr에서 발급)
 */

const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

let _corpCache = null;
let _corpCacheTime = 0;
const CACHE_TTL = 6 * 60 * 60 * 1000;

const LOCAL_CORP_JSON = path.join(__dirname, 'corp-list.json');

async function _loadCorpList(apiKey) {
  const now = Date.now();
  if (_corpCache && now - _corpCacheTime < CACHE_TTL) return _corpCache;

  if (fs.existsSync(LOCAL_CORP_JSON)) {
    try {
      console.log('[DART] 로컬 corp-list.json 읽기...');
      const raw = fs.readFileSync(LOCAL_CORP_JSON, 'utf-8');
      const obj = JSON.parse(raw);
      const map = new Map(Object.entries(obj));
      if (map.size > 0) {
        console.log('[DART] 로컬 파일 로드 완료:', map.size, '개');
        _corpCache = map;
        _corpCacheTime = now;
        return map;
      }
    } catch (e) {
      console.warn('[DART] 로컬 파일 읽기 실패:', e.message);
    }
  }

  console.log('[DART] corpCode.xml 다운로드 시작...');
  const url = `https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key=${apiKey}`;
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());

  const zip = new AdmZip(buf);
  const entries = zip.getEntries();
  const entry = entries.find(e => /corpcode/i.test(e.entryName)) || entries[0];
  if (!entry) throw new Error('ZIP 파일이 비어있습니다');

  const xml = entry.getData().toString('utf-8');
  const map = new Map();
  const codes  = [...xml.matchAll(/<corp_code>\s*(\d+)\s*<\/corp_code>/gi)].map(m => m[1]);
  const names  = [...xml.matchAll(/<corp_name>\s*([^<]+?)\s*<\/corp_name>/gi)].map(m => m[1].trim());
  const stocks = [...xml.matchAll(/<stock_code>\s*([^<]*?)\s*<\/stock_code>/gi)].map(m => m[1].trim());

  const len = Math.min(codes.length, names.length);
  for (let i = 0; i < len; i++) {
    if (!map.has(names[i])) map.set(names[i], { corpCode: codes[i], stockCode: stocks[i] || '' });
  }
  console.log('[DART] 파싱 완료:', map.size, '개');

  if (map.size > 0) { _corpCache = map; _corpCacheTime = now; }
  return map;
}

/* ── XBRL 파싱 ── */
function _parseXbrl(xml, year) {
  const instantCtxIds = [];
  const durationCtxIds = [];

  // 컨텍스트 파싱 (instant = 재무상태표, duration = 손익계산서)
  const ctxRe = /<(?:\w+:)?context\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/(?:\w+:)?context>/gi;
  let m;
  while ((m = ctxRe.exec(xml)) !== null) {
    const [, id, body] = m;
    if (/scenario/i.test(body)) continue; // 비교기간 제외

    if (new RegExp(`<(?:\\w+:)?instant>\\s*${year}-12-31\\s*<`).test(body)) {
      instantCtxIds.push(id);
    }
    if (new RegExp(`<(?:\\w+:)?startDate>\\s*${year}-01-01`).test(body) &&
        new RegExp(`<(?:\\w+:)?endDate>\\s*${year}-12-31`).test(body)) {
      durationCtxIds.push(id);
    }
  }

  // 회계연도가 1월 시작이 아닌 경우 fallback (3월/6월 결산법인)
  if (durationCtxIds.length === 0) {
    ctxRe.lastIndex = 0;
    while ((m = ctxRe.exec(xml)) !== null) {
      const [, id, body] = m;
      if (/scenario/i.test(body)) continue;
      if (new RegExp(`<(?:\\w+:)?endDate>\\s*${year}-`).test(body) &&
          /<(?:\w+:)?startDate>/.test(body)) {
        durationCtxIds.push(id);
      }
    }
  }

  console.log('[XBRL] instant contexts:', instantCtxIds.slice(0, 3).join(', '));
  console.log('[XBRL] duration contexts:', durationCtxIds.slice(0, 3).join(', '));

  function getVal(ctxIds, ...names) {
    for (const ctxId of ctxIds) {
      for (const name of names) {
        const re = new RegExp(`<[\\w-]*:${name}[^>]*contextRef="${ctxId}"[^>]*>(-?[\\d]+)<`, 'i');
        const found = xml.match(re);
        if (found && found[1] !== '0') return found[1];
      }
    }
    return null;
  }

  return {
    // 재무상태표 (instant)
    cash:           getVal(instantCtxIds, 'CashAndCashEquivalents', 'CashAndBankDeposits'),
    inventory:      getVal(instantCtxIds, 'Inventories', 'GoodsAndProducts'),
    tangibleAssets: getVal(instantCtxIds, 'PropertyPlantAndEquipment', 'PropertyPlantAndEquipmentNet'),
    receivable:     getVal(instantCtxIds, 'TradeAndOtherCurrentReceivables', 'TradeReceivablesNet', 'TradeReceivables'),
    quickAssets:    getVal(instantCtxIds, 'CurrentFinancialAssets', 'ShortTermFinancialAssets'),
    // 손익계산서 (duration)
    grossProfit:     getVal(durationCtxIds, 'GrossProfit'),
    interestExpense: getVal(durationCtxIds, 'FinanceCosts', 'InterestExpense', 'FinanceExpenses'),
    laborCost:       getVal(durationCtxIds, 'EmployeeBenefitsExpense', 'PersonnelExpenses', 'LaborCosts', 'WagesAndSalaries'),
  };
}

/* ── XBRL 보완 (fnlttSinglAcnt 누락값 채우기) ── */
async function _supplementWithXbrl(apiKey, corpCode, year, data) {
  const needKeys = ['cash', 'inventory', 'tangibleAssets', 'receivable', 'grossProfit', 'interestExpense', 'laborCost'];
  if (needKeys.every(k => data[k])) return data; // 이미 모두 있으면 스킵

  try {
    // list.json → rcept_no 취득
    // 사업보고서(11011)는 해당 사업연도 다음해 3월에 접수됨 → 날짜 범위 없이 최신순 조회
    const listRes = await fetch(
      `https://opendart.fss.or.kr/api/list.json?crtfc_key=${apiKey}&corp_code=${corpCode}&pblntf_ty=A&page_count=20`
    );
    const listData = await listRes.json();
    const filing = listData.list?.find(f => f.reprt_code === '11011');
    if (!filing) { console.log('[XBRL] 사업보고서 공시 없음'); return data; }

    console.log('[XBRL] rcept_no:', filing.rcept_no);

    // XBRL ZIP 다운로드
    const xbrlRes = await fetch(
      `https://opendart.fss.or.kr/api/fnlttXbrl.xml?crtfc_key=${apiKey}&rcept_no=${filing.rcept_no}&reprt_code=11011`
    );
    if (!xbrlRes.ok) { console.warn('[XBRL] 다운로드 실패:', xbrlRes.status); return data; }

    const buf = Buffer.from(await xbrlRes.arrayBuffer());
    const zip = new AdmZip(buf);
    const entries = zip.getEntries();

    console.log('[XBRL] ZIP 목록:', entries.map(e => e.entryName).join(', '));

    // 가장 큰 .xbrl 파일 = 재무제표 본문
    const xbrlEntry = entries
      .filter(e => e.entryName.toLowerCase().endsWith('.xbrl'))
      .sort((a, b) => b.header.size - a.header.size)[0];

    if (!xbrlEntry) { console.warn('[XBRL] .xbrl 파일 없음'); return data; }

    const xml = xbrlEntry.getData().toString('utf-8');
    console.log('[XBRL] 파싱 중:', xbrlEntry.entryName, '크기:', xml.length);

    const xbrl = _parseXbrl(xml, year);
    console.log('[XBRL] 파싱 결과:', JSON.stringify(xbrl));

    // 기존 data에 XBRL 값으로 누락 보완
    const merged = { ...data };
    const toEok = v => { const n = parseInt(v); return isNaN(n) ? null : Math.round(n / 100000000); };

    for (const key of needKeys) {
      if (!merged[key] && xbrl[key]) {
        merged[key] = { raw: parseInt(xbrl[key]).toLocaleString('ko-KR'), eok: toEok(xbrl[key]) };
        console.log(`[XBRL] ${key} 보완:`, merged[key].eok, '억');
      }
    }
    return merged;

  } catch (e) {
    console.warn('[XBRL] 보완 실패:', e.message);
    return data;
  }
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
    function getNameVariants(name) {
      const core = name
        .replace(/^\(주\)\s*/i, '').replace(/^㈜\s*/, '')
        .replace(/^주식회사\s+/i, '').replace(/\s*\(주\)$/i, '')
        .replace(/\s*㈜$/, '').trim();
      return [...new Set([core, name, `주식회사 ${core}`, `㈜${core}`, `(주)${core}`])];
    }

    // ── 1단계: corp_code 검색 ──
    const corpList = await _loadCorpList(apiKey);
    const variants = getNameVariants(companyName.trim());

    let corpCode = null, corpNameFound = null, stockCode = '';
    for (const v of variants) {
      if (corpList.has(v)) {
        const info = corpList.get(v);
        corpCode = info.corpCode; corpNameFound = v; stockCode = info.stockCode; break;
      }
    }
    if (!corpCode) {
      const core = variants[0];
      for (const [name, info] of corpList) {
        if (name.replace(/\s/g, '').includes(core.replace(/\s/g, ''))) {
          corpCode = info.corpCode; corpNameFound = name; stockCode = info.stockCode; break;
        }
      }
    }

    if (!corpCode) {
      return res.status(200).json({
        status: 'not_found',
        corpListSize: corpList.size,
        message: 'DART에 등록된 기업 정보가 없습니다.'
      });
    }

    // ── 2단계: 업종코드 조회 ──
    let indutyCode = '', indutyName = '';
    try {
      const compRes = await fetch(`https://opendart.fss.or.kr/api/company.json?crtfc_key=${apiKey}&corp_code=${corpCode}`);
      const compData = await compRes.json();
      if (compData.status === '000') {
        indutyCode = compData.induty_code || '';
        indutyName = compData.induty_nm  || '';
        if (!corpNameFound) corpNameFound = compData.corp_name;
      }
    } catch (e) { console.warn('[DART] company.json 오류:', e.message); }

    // ── 3단계: fnlttSinglAcnt 주요계정 조회 ──
    let finData = null;
    const currentYear = new Date().getFullYear();

    for (let year = currentYear - 1; year >= currentYear - 3; year--) {
      const cfsRes = await fetch(`https://opendart.fss.or.kr/api/fnlttSinglAcnt.json?crtfc_key=${apiKey}&corp_code=${corpCode}&bsns_year=${year}&reprt_code=11011&fs_div=CFS`);
      const cfs = await cfsRes.json();
      if (cfs.status === '000' && cfs.list?.length > 0) { finData = { year, list: cfs.list }; break; }

      const ofsRes = await fetch(`https://opendart.fss.or.kr/api/fnlttSinglAcnt.json?crtfc_key=${apiKey}&corp_code=${corpCode}&bsns_year=${year}&reprt_code=11011&fs_div=OFS`);
      const ofs = await ofsRes.json();
      if (ofs.status === '000' && ofs.list?.length > 0) { finData = { year, list: ofs.list }; break; }
    }

    if (!finData) {
      return res.status(200).json({ status: 'no_financial', corpName: corpNameFound, stockCode, message: '기업은 검색되었으나 재무제표 데이터가 없습니다.' });
    }

    // ── 4단계: 주요계정 추출 ──
    const items = finData.list;
    console.log('[DART] 계정명:', items.map(i => i.account_nm).join(' | '));

    const get = (...names) => {
      for (const nm of names) {
        const norm = nm.replace(/\s/g, '');
        const found = items.find(i => i.account_nm?.replace(/\s/g, '').includes(norm));
        if (found) {
          const val = found.thstrm_amount || found.thstrm_add_amount || found.frmtrm_amount || found.frmtrm_add_amount;
          if (val && val !== '0') return val;
        }
      }
      return null;
    };

    const toEok = v => { if (!v) return null; const n = parseInt(v.replace(/,/g, ''), 10); return isNaN(n) ? null : Math.round(n / 100000000); };
    const r = v => v ? { raw: v, eok: toEok(v) } : null;

    let result = {
      status: 'found',
      corpName: corpNameFound,
      stockCode,
      indutyCode,
      indutyName,
      year: finData.year,
      currentAssets:      r(get('유동자산')),
      quickAssets:        r(get('당좌자산', '당좌및단기금융')),
      cash:               r(get('현금및현금성자산', '현금및단기금융상품', '현금과예금')),
      receivable:         r(get('매출채권및기타채권', '매출채권', '받을어음및매출채권')),
      inventory:          r(get('재고자산', '상품및제품', '제품및상품')),
      nonCurrentAssets:   r(get('비유동자산')),
      tangibleAssets:     r(get('유형자산')),
      totalAssets:        r(get('자산총계')),
      currentLiabilities: r(get('유동부채')),
      payable:            r(get('매입채무및기타채무', '매입채무', '미지급금')),
      nonCurrentLiab:     r(get('비유동부채')),
      borrowings:         r(get('단기차입금', '차입금', '장단기차입금')),
      totalDebt:          r(get('부채총계')),
      equity:             r(get('자본총계', '자기자본')),
      revenue:            r(get('매출액', '영업수익', '수익(매출액)', '매출')),
      grossProfit:        r(get('매출총이익', '매출총손익', '총이익')),
      operatingProfit:    r(get('영업이익', '영업손익')),
      interestExpense:    r(get('이자비용', '금융비용')),
      netIncome:          r(get('당기순이익', '당기순손익')),
      laborCost:          r(get('인건비', '종업원급여', '급여', '급여및임원보수')),
    };

    // ── 5단계: XBRL로 누락 항목 보완 ──
    result = await _supplementWithXbrl(apiKey, corpCode, finData.year, result);

    // 부채비율 계산
    const td = result.totalDebt?.raw, ta = result.totalAssets?.raw;
    result.debtRatio = (td && ta)
      ? Math.round(parseInt(td.replace(/,/g, '')) / parseInt(ta.replace(/,/g, '')) * 100)
      : null;

    return res.status(200).json(result);

  } catch (err) {
    console.error('[DART] 오류:', err.message);
    return res.status(200).json({ status: 'error', message: `조회 오류: ${err.message}` });
  }
};
