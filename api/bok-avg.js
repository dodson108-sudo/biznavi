/**
 * Vercel Serverless Function: /api/bok-avg
 * 한국은행 ECOS API → 기업경영분석 업종별 재무비율 조회
 *
 * 환경변수: ECOS_API_KEY (ecos.bok.or.kr → 개발자 서비스 → API 키 발급)
 * 통계표 코드: 008Y003 (기업경영분석/업종별 재무비율)
 */

// KSIC 대분류 코드 → ECOS 기업경영분석 업종 항목코드 매핑
const KSIC_TO_ECOS = {
  A: 'AA',   // 농림어업
  B: 'BB',   // 광업
  C: 'CC',   // 제조업 (전체)
  D: 'DD',   // 전기·가스·증기
  E: 'EE',   // 수도·환경
  F: 'FF',   // 건설업
  G: 'GG',   // 도매·소매업
  H: 'HH',   // 운수·창고업
  I: 'II',   // 숙박·음식점업
  J: 'JJ',   // 정보통신업
  K: 'KK',   // 금융·보험업
  L: 'LL',   // 부동산업
  M: 'MM',   // 전문·과학·기술 서비스업
  N: 'NN',   // 사업시설 관리·지원
  P: 'PP',   // 교육 서비스업
  Q: 'QQ',   // 보건·사회복지
  R: 'RR',   // 예술·스포츠
  S: 'SS',   // 기타 개인 서비스
};

// ECOS 재무비율 항목명 → 우리 키 매핑
const NAME_TO_KEY = {
  '유동비율':           '유동비율',
  '당좌비율':           '당좌비율',
  '현금비율':           '현금비율',
  '부채비율':           '부채비율',
  '자기자본비율':       '자기자본비율',
  '순운전자본비율':     '순운전자본비율',
  '차입금의존도':       '차입금의존도',
  '이자보상비율':       '이자보상비율',
  '고정비율':           '고정비율',
  '고정장기적합율':     '고정장기적합율',
  '고정장기적합률':     '고정장기적합율',
  '매출액총이익률':     '매출총이익율',
  '매출액총이익율':     '매출총이익율',
  '매출총이익률':       '매출총이익율',
  '매출총이익율':       '매출총이익율',
  '매출액영업이익률':   '매출액영업이익율',
  '매출액영업이익율':   '매출액영업이익율',
  '영업이익률':         '매출액영업이익율',
  '매출액순이익률':     '매출액순이익율',
  '매출액순이익율':     '매출액순이익율',
  '순이익률':           '매출액순이익율',
  '총자산순이익률':     '총자본순이익율_ROA',
  '총자산순이익율':     '총자본순이익율_ROA',
  '총자본순이익률':     '총자본순이익율_ROA',
  '총자본순이익율':     '총자본순이익율_ROA',
  'ROA':                '총자본순이익율_ROA',
  '자기자본순이익률':   '자기자본순이익율_ROE',
  '자기자본순이익율':   '자기자본순이익율_ROE',
  'ROE':                '자기자본순이익율_ROE',
  '총자산회전율':       '총자산회전율',
  '총자본회전율':       '총자산회전율',
  '자기자본회전율':     '자기자본회전율',
  '재고자산회전율':     '재고자산회전율',
  '매출채권회전율':     '매출채권회전율',
  '매출채권회수기간':   '매출채권회수기간',
  '매입채무회전율':     '매입채무회전율',
  '매입채무지급기간':   '매입채무지급기간',
  '부가가치율':         '부가가치율',
  '인건비대매출액비율': '인건비대매출액',
  '인건비비율':         '인건비대매출액',
  '노동소득분배율':     '노동소득분배율',
  '매출액증가율':       '매출액증가율',
  '총자산증가율':       '총자산증가율',
};

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { ksicCode } = req.body || {};
  const apiKey = process.env.ECOS_API_KEY;

  if (!apiKey) {
    return res.status(200).json({ status: 'no_key' });
  }

  // KSIC 대분류 추출 (예: 'J620' → 'J', 'C261' → 'C')
  const major = (ksicCode || 'C').charAt(0).toUpperCase();
  const ecosSector = KSIC_TO_ECOS[major] || 'CC'; // 미매핑이면 제조업 사용

  // 최근 2년 시도 (ECOS는 전년도 데이터까지만 있음)
  const thisYear = new Date().getFullYear();

  for (let year = thisYear - 1; year >= thisYear - 3; year--) {
    try {
      const url = `https://ecos.bok.or.kr/api/StatisticSearch/${apiKey}/json/kr/1/200/008Y003/A/${year}/${year}/${ecosSector}`;
      const response = await fetch(url);
      const json = await response.json();

      const rows = json?.StatisticSearch?.row;
      if (!rows || rows.length === 0) continue;

      // 비율명 → 값 매핑
      const result = {};
      for (const row of rows) {
        const rawName = (row.ITEM_NAME2 || row.ITEM_NAME1 || '').trim();
        const key = NAME_TO_KEY[rawName];
        if (key) {
          const val = parseFloat(row.DATA_VALUE);
          if (!isNaN(val)) result[key] = val;
        }
      }

      if (Object.keys(result).length < 3) continue; // 데이터 너무 적으면 다음 연도 시도

      return res.status(200).json({
        status: 'found',
        year,
        sector: ecosSector,
        sectorName: getSectorName(major),
        ratios: result,
      });

    } catch (e) {
      console.error('bok-avg error:', e.message);
    }
  }

  return res.status(200).json({ status: 'not_found', message: '해당 업종 데이터 없음' });
};

function getSectorName(major) {
  const names = {
    A:'농림어업', B:'광업', C:'제조업', D:'전기·가스·증기', E:'수도·환경',
    F:'건설업', G:'도매·소매업', H:'운수·창고업', I:'숙박·음식점업',
    J:'정보통신업', K:'금융·보험업', L:'부동산업', M:'전문·과학기술서비스',
    N:'사업시설관리·지원', P:'교육서비스업', Q:'보건·사회복지', R:'예술·스포츠',
    S:'기타개인서비스'
  };
  return names[major] || '전체업종';
}
