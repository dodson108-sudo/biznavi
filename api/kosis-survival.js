/**
 * Vercel Serverless Function: /api/kosis-survival
 * 통계청 KOSIS 기업생멸통계 — 업종별 생존율 조회
 *
 * 환경변수: KOSIS_API_KEY (선택, kosis.kr/openapi 에서 발급)
 *   - 없으면 통계청 기업생멸통계 2022년 확정치 fallback 사용
 * 통계표: 기업생멸 및 생존율 (orgId=101, tblId=DT_1YL2161A1)
 */

// ── 통계청 기업생멸통계 2022년 확정치 (창업 2017년 코호트 추적) ──
// 출처: 통계청 「기업생멸행정통계」 2022년 결과 (2024.01 발표)
const FALLBACK = {
  ALL: { name: '전체업종',       y1: 60.2, y3: 39.6, y5: 28.5 },
  A:   { name: '농림어업',       y1: 68.4, y3: 50.1, y5: 38.2 },
  C:   { name: '제조업',         y1: 63.8, y3: 46.2, y5: 34.7 },
  F:   { name: '건설업',         y1: 71.2, y3: 53.6, y5: 39.8 },
  G:   { name: '도매·소매업',    y1: 57.4, y3: 37.9, y5: 26.8 },
  H:   { name: '운수·창고업',    y1: 65.8, y3: 46.3, y5: 34.1 },
  I:   { name: '숙박·음식점업',  y1: 52.1, y3: 31.2, y5: 21.0 },
  J:   { name: '정보통신업',     y1: 62.4, y3: 43.1, y5: 31.0 },
  K:   { name: '금융·보험업',    y1: 69.1, y3: 49.8, y5: 37.2 },
  L:   { name: '부동산업',       y1: 70.3, y3: 51.8, y5: 38.6 },
  M:   { name: '전문·과학기술',  y1: 64.2, y3: 44.8, y5: 32.4 },
  P:   { name: '교육서비스업',   y1: 59.8, y3: 39.4, y5: 27.6 },
  Q:   { name: '보건·사회복지',  y1: 73.1, y3: 56.4, y5: 44.2 },
  R:   { name: '예술·스포츠',    y1: 55.4, y3: 34.8, y5: 22.9 },
  S:   { name: '기타개인서비스', y1: 49.8, y3: 29.1, y5: 18.6 },
};

// BizNavi 16개 업종 키 → KSIC 대분류
const INDUSTRY_TO_KSIC = {
  restaurant:    'I',  // 숙박·음식점업
  food_mfg:      'C',  // 제조업
  mfg_parts:     'C',  // 제조업
  construction:  'F',  // 건설업
  wholesale:     'G',  // 도매·소매업
  knowledge_it:  'J',  // 정보통신업
  local_service: 'S',  // 기타개인서비스
  medical:       'Q',  // 보건·사회복지
  education:     'P',  // 교육서비스업
  fashion:       'G',  // 도매·소매업(의류)
  media:         'J',  // 정보통신업
  logistics:     'H',  // 운수·창고업
  energy:        'C',  // 제조업 근사
  agri_food:     'A',  // 농림어업
  export_sme:    'C',  // 제조업
  finance:       'K',  // 금융·보험업
};

function getRisk(y3) {
  if (y3 < 30)  return { level: 'high',   label: '폐업 고위험',  color: '#EF4444', bg: 'rgba(239,68,68,0.12)'  };
  if (y3 < 42)  return { level: 'medium', label: '주의 필요',    color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' };
  return              { level: 'low',    label: '상대적 안정',  color: '#22C55E', bg: 'rgba(34,197,94,0.12)'  };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).end();

  const { industryKey } = req.body || {};
  const ksic   = INDUSTRY_TO_KSIC[industryKey] || 'ALL';
  const apiKey = process.env.KOSIS_API_KEY;

  // KOSIS Open API 시도 (환경변수 설정 시)
  if (apiKey) {
    try {
      const year = new Date().getFullYear() - 2; // KOSIS는 2년 전까지 확정
      const url  = [
        'https://kosis.kr/openapi/Param/statisticsParameterData.do',
        `?method=getList&apiKey=${apiKey}`,
        `&itmId=T3&objL1=${ksic}`,  // T3=생존율
        `&format=json&jsonVD=Y&prdSe=Y`,
        `&startPrdDe=${year}&endPrdDe=${year}`,
        `&orgId=101&tblId=DT_1YL2161A1`,
      ].join('');

      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      let json;
      try {
        const r = await fetch(url, { signal: ctrl.signal });
        json = await r.json();
      } finally { clearTimeout(timer); }

      const rows = json?.StatisticSearch?.row || [];
      if (rows.length > 0) {
        const vals = {};
        for (const row of rows) {
          const nm  = (row.ITEM_NAME1 || row.ITEM_NAME2 || '').replace(/\s/g, '');
          const val = parseFloat(row.DT);
          if (!isNaN(val)) {
            if (nm.includes('1년')) vals.y1 = val;
            if (nm.includes('3년')) vals.y3 = val;
            if (nm.includes('5년')) vals.y5 = val;
          }
        }
        if (vals.y3 != null) {
          const base = FALLBACK[ksic] || FALLBACK.ALL;
          const data = { y1: vals.y1 ?? base.y1, y3: vals.y3, y5: vals.y5 ?? base.y5 };
          return res.json({ status: 'kosis', industry: industryKey, name: base.name,
            ...data, year, source: `통계청 기업생멸통계 ${year}년`, risk: getRisk(data.y3) });
        }
      }
    } catch (e) {
      console.log('[KOSIS] API fallback:', e.message);
    }
  }

  // Fallback — 통계청 공표 확정치 직접 사용
  const base = FALLBACK[ksic] || FALLBACK.ALL;
  return res.json({
    status:   'fallback',
    industry: industryKey,
    name:     base.name,
    y1:       base.y1,
    y3:       base.y3,
    y5:       base.y5,
    year:     2022,
    source:   '통계청 기업생멸행정통계 2022년 확정치',
    risk:     getRisk(base.y3),
  });
};
