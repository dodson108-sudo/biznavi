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
  // 컨텍스트 수집: 날짜를 파싱해서 instant/duration 분류
  const instantMap = new Map(); // ctxId → 'YYYY-MM-DD'
  const durationMap = new Map(); // ctxId → { start, end }

  const ctxRe = /<(?:\w+:)?context\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/(?:\w+:)?context>/gi;
  let m;
  while ((m = ctxRe.exec(xml)) !== null) {
    const [, id, body] = m;
    if (/scenario/i.test(body)) continue; // 비교기간·시나리오 제외

    const instM = body.match(/<(?:\w+:)?instant>\s*(\d{4}-\d{2}-\d{2})\s*</i);
    if (instM) { instantMap.set(id, instM[1]); continue; }

    const startM = body.match(/<(?:\w+:)?startDate>\s*(\d{4}-\d{2}-\d{2})\s*</i);
    const endM   = body.match(/<(?:\w+:)?endDate>\s*(\d{4}-\d{2}-\d{2})\s*</i);
    if (startM && endM) durationMap.set(id, { start: startM[1], end: endM[1] });
  }

  // 당기 연도: year 또는 year+1 허용 (3월·6월 결산법인 대응)
  const targetYears = [String(year), String(year + 1)];

  // instant: 당기 연도말 날짜 기준 최신순
  const instantCtxIds = [...instantMap.entries()]
    .filter(([, d]) => targetYears.includes(d.slice(0, 4)))
    .sort(([, a], [, b]) => b.localeCompare(a))
    .map(([id]) => id);

  // duration: 180일 이상 기간 & 당기 연도 종료 기준 최신순
  const durationCtxIds = [...durationMap.entries()]
    .filter(([, { start, end }]) => {
      const days = (new Date(end) - new Date(start)) / 86400000;
      return targetYears.includes(end.slice(0, 4)) && days > 180;
    })
    .sort(([, a], [, b]) => b.end.localeCompare(a.end))
    .map(([id]) => id);

  console.log('[XBRL] total contexts — instant:', instantMap.size, 'duration:', durationMap.size);
  console.log('[XBRL] matched instant:', instantCtxIds.slice(0, 3).join(', '));
  console.log('[XBRL] matched duration:', durationCtxIds.slice(0, 3).join(', '));

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
    cash:           getVal(instantCtxIds, 'CashAndCashEquivalents', 'CashAndBankDeposits', 'CashAndDueFromBanks'),
    inventory:      getVal(instantCtxIds, 'Inventories', 'GoodsAndProducts', 'FinishedGoodsAndGoods'),
    tangibleAssets: getVal(instantCtxIds, 'PropertyPlantAndEquipment', 'PropertyPlantAndEquipmentNet'),
    receivable:     getVal(instantCtxIds, 'TradeAndOtherCurrentReceivables', 'TradeReceivablesNet', 'TradeReceivables', 'TradeAndOtherReceivables'),
    quickAssets:    getVal(instantCtxIds, 'CurrentFinancialAssets', 'ShortTermFinancialInstruments'),
    // 손익계산서 (duration)
    grossProfit:     getVal(durationCtxIds, 'GrossProfit'),
    interestExpense: getVal(durationCtxIds, 'FinanceCosts', 'InterestExpense', 'FinanceExpenses', 'FinancialCosts'),
    laborCost:       getVal(durationCtxIds, 'EmployeeBenefitsExpense', 'PersonnelExpenses', 'LaborCosts', 'WagesAndSalaries', 'SalariesAndWages'),
  };
}

/* ── XBRL 보완 (fnlttSinglAcnt 누락값 채우기) ── */
async function _supplementWithXbrl(apiKey, corpCode, year, data) {
  const needKeys = ['cash', 'inventory', 'tangibleAssets', 'receivable', 'grossProfit', 'interestExpense', 'laborCost'];
  if (needKeys.every(k => data[k])) return data; // 이미 모두 있으면 스킵

  try {
    // list.json → rcept_no 취득 (타임아웃 15초)
    const listCtrl = new AbortController();
    const listTimer = setTimeout(() => listCtrl.abort(), 15000);
    let listData;
    try {
      const listRes = await fetch(
        `https://opendart.fss.or.kr/api/list.json?crtfc_key=${apiKey}&corp_code=${corpCode}&pblntf_ty=A&page_count=20`,
        { signal: listCtrl.signal }
      );
      listData = await listRes.json();
    } finally { clearTimeout(listTimer); }

    // year에 맞는 사업보고서 우선, 없으면 최근 것
    const filing = listData.list?.find(f => f.reprt_code === '11011' && f.bsns_year === String(year))
                || listData.list?.find(f => f.reprt_code === '11011');
    if (!filing) { console.log('[XBRL] 사업보고서 공시 없음'); return data; }

    console.log('[XBRL] rcept_no:', filing.rcept_no, '| 공시년도:', filing.bsns_year);

    // XBRL ZIP 다운로드 (타임아웃 20초)
    const xbrlCtrl = new AbortController();
    const xbrlTimer = setTimeout(() => xbrlCtrl.abort(), 20000);
    let buf;
    try {
      const xbrlRes = await fetch(
        `https://opendart.fss.or.kr/api/fnlttXbrl.xml?crtfc_key=${apiKey}&rcept_no=${filing.rcept_no}&reprt_code=11011`,
        { signal: xbrlCtrl.signal }
      );
      if (!xbrlRes.ok) { console.warn('[XBRL] 다운로드 실패:', xbrlRes.status); return data; }
      buf = Buffer.from(await xbrlRes.arrayBuffer());
    } finally { clearTimeout(xbrlTimer); }

    console.log('[XBRL] ZIP 크기:', buf.length, 'bytes');

    // 5MB 초과 시 스킵 (메모리·시간 보호)
    if (buf.length > 5 * 1024 * 1024) {
      console.warn('[XBRL] ZIP 너무 큼 → 스킵');
      return data;
    }

    const zip = new AdmZip(buf);
    const entries = zip.getEntries();

    // 가장 큰 .xbrl 파일 = 재무제표 본문
    const xbrlEntry = entries
      .filter(e => e.entryName.toLowerCase().endsWith('.xbrl'))
      .sort((a, b) => (b.header.compressedSize || b.getData().length) - (a.header.compressedSize || a.getData().length))[0];

    if (!xbrlEntry) { console.warn('[XBRL] .xbrl 파일 없음'); return data; }

    const xml = xbrlEntry.getData().toString('utf-8');
    console.log('[XBRL] 파싱 중:', xbrlEntry.entryName, '크기:', xml.length);

    const xbrl = _parseXbrl(xml, year);
    console.log('[XBRL] 파싱 결과:', JSON.stringify(xbrl));

    // 기존 data에 XBRL 값으로 누락 보완 (null만 채움, 기존값 절대 덮어쓰지 않음)
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
        message: 'DART에 등록된 기업 정보가 없습니다.',
        _debug: { triedVariants: variants }
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
    const _apiResults = [];

    for (let year = currentYear - 1; year >= currentYear - 3; year--) {
      const cfsRes = await fetch(`https://opendart.fss.or.kr/api/fnlttSinglAcnt.json?crtfc_key=${apiKey}&corp_code=${corpCode}&bsns_year=${year}&reprt_code=11011&fs_div=CFS`);
      const cfs = await cfsRes.json();
      _apiResults.push({ year, type: 'CFS', status: cfs.status, count: cfs.list?.length || 0, msg: cfs.message || '' });
      if (cfs.status === '000' && cfs.list?.length > 0) { finData = { year, list: cfs.list }; break; }

      const ofsRes = await fetch(`https://opendart.fss.or.kr/api/fnlttSinglAcnt.json?crtfc_key=${apiKey}&corp_code=${corpCode}&bsns_year=${year}&reprt_code=11011&fs_div=OFS`);
      const ofs = await ofsRes.json();
      _apiResults.push({ year, type: 'OFS', status: ofs.status, count: ofs.list?.length || 0, msg: ofs.message || '' });
      if (ofs.status === '000' && ofs.list?.length > 0) { finData = { year, list: ofs.list }; break; }
    }

    if (!finData) {
      return res.status(200).json({
        status: 'no_financial',
        corpName: corpNameFound,
        stockCode,
        message: '기업은 검색되었으나 재무제표 데이터가 없습니다.',
        _debug: { corpCode, corpNameFound, stockCode, apiResults: _apiResults }
      });
    }

    // ── 4단계: 주요계정 추출 ──
    const items = finData.list;
    console.log('[DART] 년도:', finData.year, '| 계정수:', items.length);
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
      // 금융업 fallback: 현금및예치금(은행), 상각후원가측정금융자산(카드채권)
      cash:               r(get('현금및현금성자산', '현금및단기금융상품', '현금과예금', '현금및예치금')),
      receivable:         r(get('매출채권및기타채권', '매출채권', '받을어음및매출채권', '상각후원가측정금융자산')),
      inventory:          r(get('재고자산', '상품및제품', '제품및상품')),
      nonCurrentAssets:   r(get('비유동자산')),
      tangibleAssets:     r(get('유형자산')),
      totalAssets:        r(get('자산총계')),
      currentLiabilities: r(get('유동부채')),
      payable:            r(get('매입채무및기타채무', '매입채무', '미지급금')),
      nonCurrentLiab:     r(get('비유동부채')),
      // 금융업 fallback: 차입부채(카드·캐피탈사)
      borrowings:         r(get('단기차입금', '차입금', '장단기차입금', '차입부채')),
      totalDebt:          r(get('부채총계')),
      equity:             r(get('자본총계', '자기자본')),
      // 금융업 fallback: 이자수익(카드·은행), 영업수익합계, 순이자손익+수수료 등
      revenue:            r(get('매출액', '영업수익', '수익(매출액)', '매출', '이자수익', '순영업수익', '영업수익합계')),
      grossProfit:        r(get('매출총이익', '매출총손익', '총이익', '순이자손익')),
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
