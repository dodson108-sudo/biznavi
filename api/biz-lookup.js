/**
 * Vercel Serverless Function: /api/biz-lookup
 * 국세청 사업자등록정보 상태조회 API 프록시
 *
 * 환경변수 설정 필요 (Vercel Dashboard → Settings → Environment Variables):
 *   NTS_SERVICE_KEY = 공공데이터포털(data.go.kr) 발급 서비스 키
 *
 * 공공데이터포털 API 등록:
 *   https://www.data.go.kr/data/15081808/openapi.do
 *   "사업자등록정보 진위확인 및 상태조회 서비스" 활용 신청
 */

module.exports = async function handler(req, res) {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { bizNo } = req.body || {};

  if (!bizNo || !/^\d{10}$/.test(bizNo)) {
    return res.status(400).json({ error: '유효하지 않은 사업자등록번호입니다.' });
  }

  const serviceKey = process.env.NTS_SERVICE_KEY;
  if (!serviceKey) {
    // 환경변수 미설정 시 — UI에서 수동 입력 유도
    return res.status(200).json({
      status: 'manual',
      message: '자동조회 서비스 준비 중입니다. 업태·종목을 직접 입력해주세요.'
    });
  }

  try {
    const apiUrl = `https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${encodeURIComponent(serviceKey)}`;
    const apiRes = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ b_no: [bizNo] })
    });

    if (!apiRes.ok) {
      throw new Error(`국세청 API 오류: ${apiRes.status}`);
    }

    const data = await apiRes.json();
    const item = data?.data?.[0];

    if (!item) {
      return res.status(200).json({ status: 'unknown' });
    }

    // b_stt_cd: 01=계속사업자, 02=휴업, 03=폐업
    const sttCd = item.b_stt_cd;
    let status = 'unknown';
    if (sttCd === '01')      status = 'active';
    else if (sttCd === '02') status = 'suspended';
    else if (sttCd === '03') status = 'closed';

    return res.status(200).json({
      status,
      taxType: item.tax_type || '',
      message: item.b_stt    || ''
    });

  } catch (err) {
    console.error('biz-lookup error:', err);
    return res.status(200).json({
      status: 'error',
      message: '조회 중 오류가 발생했습니다.'
    });
  }
}
