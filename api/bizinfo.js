/**
 * Vercel Serverless Function: /api/bizinfo
 * 기업마당(bizinfo.go.kr) 정부지원사업 실시간 조회 + 업종·규모 매칭
 *
 * 환경변수: BIZINFO_API_KEY (data.go.kr → 기업마당 지원사업 정보 API 신청)
 *   없으면 주요 상시 지원사업 fallback 반환
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

// ── 주요 상시·정기 지원사업 fallback ──
// 실제 운영 중인 대표 사업 기준, 상세 정보는 각 기관 사이트 확인
const FALLBACK_PROGRAMS = [
  {
    id: 'sb01',
    name: '소상공인 스마트화 지원사업 (디지털전환 바우처)',
    org: '소상공인시장진흥공단',
    amount: '최대 400만원 (자부담 30%)',
    type: '바우처',
    scale: ['micro'],
    industries: ['all'],
    period: '연중 수시 (예산 소진 시 마감)',
    url: 'https://www.sbiz.or.kr',
    summary: '키오스크·POS·배달앱·온라인판매 채널 도입 비용 지원. 디지털 전환이 필요한 소상공인 우선.',
    keywords: ['디지털', '소상공인', 'IT', '스마트'],
  },
  {
    id: 'sb02',
    name: '소상공인 경영컨설팅 지원',
    org: '소상공인시장진흥공단',
    amount: '무료 (전문가 5~10회 파견)',
    type: '컨설팅',
    scale: ['micro'],
    industries: ['all'],
    period: '연중 신청',
    url: 'https://www.sbiz.or.kr',
    summary: '경영·세무·마케팅·법률 분야 전문가 컨설팅. 재무·운영 취약 소상공인 적합.',
    keywords: ['경영', '컨설팅', '세무', '마케팅'],
  },
  {
    id: 'ms01',
    name: '창업도약패키지',
    org: '중소벤처기업부 / 창업진흥원',
    amount: '최대 1억원',
    type: '사업화 지원',
    scale: ['micro', 'sme'],
    industries: ['all'],
    period: '연 2회 (상·하반기 공고)',
    url: 'https://www.k-startup.go.kr',
    summary: '창업 3~7년 기업 대상 제품개선·마케팅·멘토링. 피벗·신사업 확장 기업 적합.',
    keywords: ['창업', '성장', '도약', '사업화'],
  },
  {
    id: 'ms02',
    name: '중소기업 정책자금 (직접대출)',
    org: '중소벤처기업진흥공단',
    amount: '최대 60억원 (저금리 2~3%대)',
    type: '융자',
    scale: ['sme'],
    industries: ['all'],
    period: '연중 (분기별 한도 소진 시 마감)',
    url: 'https://www.kosmes.or.kr',
    summary: '시설·운전자금 저금리 융자. 재무구조 개선, 설비투자, 운영자금 필요 기업.',
    keywords: ['자금', '융자', '대출', '자금조달'],
  },
  {
    id: 'ms03',
    name: '비대면 서비스 바우처',
    org: '중소벤처기업부',
    amount: '최대 400만원 (자부담 10%)',
    type: '바우처',
    scale: ['micro', 'sme'],
    industries: ['knowledge_it', 'local_service', 'restaurant', 'wholesale', 'education'],
    period: '상반기 공고 (보통 3~4월)',
    url: 'https://www.bizinfo.go.kr',
    summary: '화상회의·재택근무·사이버보안·클라우드 서비스 도입 비용 지원.',
    keywords: ['비대면', '화상', '클라우드', '디지털'],
  },
  {
    id: 'ms04',
    name: '수출 바우처 (중소기업 글로벌화)',
    org: 'KOTRA / 중소벤처기업부',
    amount: '최대 5천만원',
    type: '바우처',
    scale: ['sme'],
    industries: ['export_sme', 'mfg_parts', 'food_mfg', 'fashion', 'agri_food'],
    period: '연 1회 (1~2월 공고)',
    url: 'https://www.kotra.or.kr',
    summary: '해외 마케팅·전시·통번역·인증 비용 지원. 수출 신규·기존 기업 모두 신청 가능.',
    keywords: ['수출', '해외', 'KOTRA', '글로벌'],
  },
  {
    id: 'ms05',
    name: 'R&D 과제 (중소기업 기술개발)',
    org: '중소벤처기업부 / 중소기업기술정보진흥원',
    amount: '최대 2억원',
    type: 'R&D 지원',
    scale: ['sme'],
    industries: ['knowledge_it', 'mfg_parts', 'food_mfg', 'energy', 'medical'],
    period: '연 2~3회 공고',
    url: 'https://www.smtech.go.kr',
    summary: '기술개발비 70~80% 지원. IT·제조·바이오·에너지 분야 기술력 보유 기업 적합.',
    keywords: ['기술개발', 'R&D', '연구개발', '기술'],
  },
  {
    id: 'ms06',
    name: '스마트 제조혁신 (스마트공장 구축)',
    org: '중소벤처기업부 / 스마트제조혁신센터',
    amount: '최대 1억원 (자부담 30~50%)',
    type: '스마트화 지원',
    scale: ['sme'],
    industries: ['mfg_parts', 'food_mfg', 'fashion', 'agri_food'],
    period: '연 1회 (2~3월 공고)',
    url: 'https://www.smart-factory.kr',
    summary: 'ERP·MES·설비자동화 등 스마트공장 구축 비용 지원. 생산성 향상 목적 제조기업.',
    keywords: ['스마트공장', '제조', 'ERP', 'MES', '자동화'],
  },
  {
    id: 'ms07',
    name: '소상공인 온라인 판로 지원',
    org: '소상공인시장진흥공단',
    amount: '입점 수수료·광고비 지원 (한도 200만원)',
    type: '판로 지원',
    scale: ['micro'],
    industries: ['restaurant', 'local_service', 'food_mfg', 'wholesale', 'fashion'],
    period: '연중 상시',
    url: 'https://www.sbiz.or.kr',
    summary: '네이버스마트스토어·쿠팡·배달앱 입점·광고비 지원. 온라인 채널 미활용 소상공인 우선.',
    keywords: ['온라인', '판로', '쇼핑몰', '플랫폼', '배달'],
  },
  {
    id: 'ms08',
    name: '고용창출 장려금 (청년·경력단절 채용)',
    org: '고용노동부',
    amount: '1인당 월 최대 100만원 (12개월)',
    type: '인건비 지원',
    scale: ['micro', 'sme'],
    industries: ['all'],
    period: '연중 상시',
    url: 'https://www.work.go.kr',
    summary: '청년·경력단절여성·장애인 채용 시 인건비 지원. 조직·인력 확충 계획 기업 적합.',
    keywords: ['채용', '고용', '인건비', '청년'],
  },
];

// 업종·규모 기준 관련도 점수
function scoreProgram(prog, industryKey, scale) {
  let score = 0;
  // 규모 매칭
  if (prog.scale.includes(scale)) score += 3;
  // 업종 매칭
  if (prog.industries.includes('all') || prog.industries.includes(industryKey)) score += 3;
  // 키워드 매칭
  const myKeywords = KEYWORDS[industryKey] || [];
  for (const kw of (prog.keywords || [])) {
    if (myKeywords.some(mk => kw.includes(mk) || mk.includes(kw))) score += 2;
  }
  return score;
}

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

  // 기업마당 Open API 실시간 조회
  if (apiKey) {
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
        return res.json({ status: 'api', programs: top, total: items.length });
      }
    } catch (e) {
      console.log('[BIZINFO] API fallback:', e.message);
    }
  }

  // Fallback — 큐레이션 사업 목록에서 관련도 높은 순 정렬
  const scale = bizScale === 'micro' ? 'micro' : 'sme';
  const scored = FALLBACK_PROGRAMS.map(p => {
    const s = scoreProgram(p, industryKey, scale);
    return { ...p, _score: s, _source: 'fallback',
      period_label: p.period,
      dDay: null };
  });
  const top = scored.sort((a, b) => b._score - a._score).slice(0, 5);

  return res.json({
    status:   'fallback',
    programs: top.map(p => ({
      id:      p.id,
      name:    p.name,
      org:     p.org,
      amount:  p.amount,
      type:    p.type,
      period:  p.period_label,
      dDay:    p.dDay,
      url:     p.url,
      summary: p.summary,
      _score:  p._score,
      _source: 'fallback',
    })),
  });
};
