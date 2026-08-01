/**
 * Vercel Serverless Function: /api/bizinfo
 * 기업마당(bizinfo.go.kr) 정부지원사업 실시간 조회 + 업종·규모 매칭
 *
 * 환경변수: BIZINFO_API_KEY (data.go.kr → 기업마당 지원사업 정보 API 신청)
 *
 * ⚠ 이 엔드포인트는 실시간 조회 전용이다. 키가 없거나 조회에 실패하면
 *   { ok: false, reason, programs: [] } 로 명시적 실패를 반환한다.
 *   오래된 하드코딩 목록을 실시간인 것처럼 반환하지 않는다 (2026-08-01 fallback 제거).
 *   상시 지원사업 마스터는 js/gov-support.js PROGRAMS 단일 소스로 통합됨.
 */

// ── 업종별 매칭 키워드 ──
const KEYWORDS = {
  restaurant:    ['외식', '음식점', '식품', '요식업', '카페'],
  food_mfg:      ['식품', '제조', '가공', 'HACCP', '식품제조'],
  mfg_parts:     ['제조', '부품', '생산', '스마트공장', '제조업'],
  construction:  ['건설', '건축', '인테리어', '시공', '건설업'],
  wholesale:     ['유통', '도매', '소매', '물류', '온라인쇼핑'],
  knowledge_it:  ['IT', '소프트웨어', '디지털', '정보통신', 'AI', '데이터', 'SaaS'],
  local_service: ['서비스', '소상공인', '자영업', '생활서비스'],
  medical:       ['의료', '보건', '헬스케어', '의약', '바이오'],
  education:     ['교육', '학원', '이러닝', '에듀테크', '직업훈련'],
  fashion:       ['패션', '의류', '섬유', '봉제', '뷰티'],
  media:         ['콘텐츠', '미디어', '방송', '문화', 'K-콘텐츠'],
  logistics:     ['물류', '운송', '배송', '창고', '택배'],
  energy:        ['에너지', '환경', '신재생', '탄소', '친환경', 'ESG'],
  agri_food:     ['농업', '농식품', '농촌', '축산', '농산물'],
  export_sme:    ['수출', '해외', '글로벌', '무역', '수출기업'],
  finance:       ['금융', '핀테크', '보험', 'P2P'],
};

// 기업마당 API 응답 프로그램 → 내부 포맷 변환
function normalizeApiResult(item) {
  const endDate = (item.reqstEndDe || '').replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
  let dDay = null;
  if (endDate) {
    const diff = Math.ceil((new Date(endDate) - new Date()) / 86400000);
    if (diff >= 0) dDay = diff;
  }
  return {
    id:       item.pblancId,
    name:     item.pblancNm || '',
    org:      item.jrsdInsttNm || '',
    amount:   item.sprtLmt || '',
    type:     item.sprtBizClsfcNm || '지원',
    period:   endDate ? `마감 ${endDate}${dDay !== null ? ' (D-' + dDay + ')' : ''}` : '신청기간 확인 필요',
    dDay,
    url:      item.mnofUrlAddr || 'https://www.bizinfo.go.kr',
    summary:  (item.sprtCn || '').substring(0, 120),
    _score:   0,
    _source:  'api',
  };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).end();

  const { industryKey = '', bizScale = 'micro', consultingType = '' } = req.body || {};
  const apiKey = process.env.BIZINFO_API_KEY;

  if (!apiKey) {
    return res.json({ ok: false, reason: 'no_api_key', programs: [] });
  }

  // 기업마당 Open API 실시간 조회
  {
    try {
      const scaleParam = bizScale === 'micro' ? '소상공인' : '소기업,중기업';
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const url = [
        'https://www.bizinfo.go.kr/uss/prm/biz/bizInfoList.do',
        `?crtfcKey=${apiKey}`,
        `&pageUnit=20&pageIndex=1`,
        `&reqstGbleSttsList=접수중`,
        `&prdTo=${today}`,        // 마감일이 오늘 이후
      ].join('');

      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 10000);
      let json;
      try {
        const r = await fetch(url, { signal: ctrl.signal });
        json = await r.json();
      } finally { clearTimeout(timer); }

      const items = json?.bizPblanc || json?.data || json?.result || [];
      if (Array.isArray(items) && items.length > 0) {
        const myKeywords = KEYWORDS[industryKey] || [];
        const scored = items.map(item => {
          const norm = normalizeApiResult(item);
          const text = [norm.name, norm.summary, norm.org].join(' ');
          let score = 0;
          for (const kw of myKeywords) { if (text.includes(kw)) score += 2; }
          if (bizScale === 'micro' && text.includes('소상공인')) score += 3;
          if (bizScale === 'sme' && (text.includes('중소기업') || text.includes('중기'))) score += 3;
          norm._score = score;
          return norm;
        });
        const top = scored.sort((a, b) => b._score - a._score).slice(0, 5);
        return res.json({ ok: true, status: 'api', programs: top, total: items.length });
      }
    } catch (e) {
      console.log('[BIZINFO] 실시간 조회 실패:', e.message);
      return res.json({ ok: false, reason: 'api_error', programs: [] });
    }
  }

  // 키는 있으나 접수 중인 공고가 0건인 경우 — 가짜 데이터를 만들지 않고 명시적 실패 반환
  return res.json({ ok: false, reason: 'api_error', programs: [] });
};
