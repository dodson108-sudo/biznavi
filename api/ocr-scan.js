/**
 * Vercel Serverless Function: /api/ocr-scan
 * 사업자등록증 이미지 → Google Vision API OCR → 필드 자동추출
 *
 * 환경변수 설정 필요:
 *   GOOGLE_VISION_API_KEY = Google Cloud Console에서 발급한 API 키
 *
 * Google Vision API 키 발급:
 *   1. https://console.cloud.google.com/ → 프로젝트 생성
 *   2. Cloud Vision API 활성화
 *   3. API 및 서비스 → 사용자 인증 정보 → API 키 생성
 *   (월 1,000건 무료, 초과 시 $1.50/1000건)
 */

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { imageBase64 } = req.body || {};
  if (!imageBase64) return res.status(400).json({ error: '이미지 데이터가 없습니다.' });

  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ status: 'no_key', message: 'Google Vision API 키가 설정되지 않았습니다.' });
  }

  try {
    // Google Vision API TEXT_DETECTION 호출
    const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
    const visionRes = await fetch(visionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { content: imageBase64 },
          features: [{ type: 'TEXT_DETECTION', maxResults: 1 }]
        }]
      })
    });

    const visionData = await visionRes.json();
    if (visionData.error) throw new Error(visionData.error.message);

    const fullText = visionData.responses?.[0]?.fullTextAnnotation?.text || '';
    if (!fullText) {
      return res.status(200).json({ status: 'no_text', message: '텍스트를 인식하지 못했습니다. 더 선명한 이미지를 사용해주세요.' });
    }

    // 사업자등록증 파싱
    const parsed = parseBizRegistration(fullText);

    return res.status(200).json({
      status: 'success',
      ...parsed,
      rawText: fullText.substring(0, 500) // 디버깅용 (앞 500자만)
    });

  } catch (err) {
    console.error('ocr-scan error:', err);
    return res.status(200).json({ status: 'error', message: 'OCR 처리 중 오류가 발생했습니다.' });
  }
};

/**
 * OCR 텍스트에서 사업자등록증 필드 추출
 * 사업자등록증 레이아웃:
 *   등록번호: XXX-XX-XXXXX
 *   법인명(단체명) 또는 상호: ...
 *   대표자: ...
 *   개업연월일: YYYY년 MM월 DD일
 *   사업장 소재지: ...
 *   업태: ... 종목: ...
 */
function parseBizRegistration(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const result = {
    bizRegNo:    null,  // 사업자등록번호
    companyName: null,  // 상호
    repName:     null,  // 대표자명
    bizType:     null,  // 업태
    bizItem:     null,  // 종목
    foundedDate: null,  // 개업연월일
    foundedYear: null   // 개업연도 (4자리)
  };

  const fullText = text.replace(/\n/g, ' ');

  // 사업자등록번호 (XXX-XX-XXXXX 패턴)
  const bizNoMatch = fullText.match(/(\d{3}[-\s]\d{2}[-\s]\d{5})/);
  if (bizNoMatch) {
    result.bizRegNo = bizNoMatch[1].replace(/\s/g, '-');
  }

  // 상호 추출
  const corpPatterns = [
    /(?:법인명|단체명|상\s*호)[^\S\n]*[:\s：]+\s*([^\n,（(]{2,30})/,
    /상\s*호\s*[:\s：]*\s*([^\n]{2,30})/
  ];
  for (const pat of corpPatterns) {
    const m = fullText.match(pat);
    if (m) { result.companyName = m[1].trim().replace(/\s+/g, ' '); break; }
  }

  // 대표자명 추출
  const repPatterns = [
    /(?:성\s*명|대\s*표\s*자)[^\S\n]*[:\s：]+\s*([가-힣a-zA-Z]{2,10})/,
    /대표[:\s：]*([가-힣]{2,5})/
  ];
  for (const pat of repPatterns) {
    const m = fullText.match(pat);
    if (m) { result.repName = m[1].trim(); break; }
  }

  // 개업연월일 추출
  const datePatterns = [
    /개업\s*연월일[:\s：]*(\d{4})[년\s\.]+(\d{1,2})[월\s\.]+(\d{1,2})/,
    /개업[:\s：]*(\d{4})[.\-년](\d{1,2})[.\-월](\d{1,2})/,
    /(\d{4})[년\s]+(\d{1,2})[월\s]+(\d{1,2})[일]?\s*개업/
  ];
  for (const pat of datePatterns) {
    const m = fullText.match(pat);
    if (m) {
      result.foundedDate = `${m[1]}년 ${m[2]}월 ${m[3]}일`;
      result.foundedYear = m[1];
      break;
    }
  }

  // 업태 추출
  const bizTypePatterns = [
    /업\s*태[:\s：]+([^종\n,]+)/,
    /업태\s*([^\n,종목]{2,20})/
  ];
  for (const pat of bizTypePatterns) {
    const m = fullText.match(pat);
    if (m) {
      result.bizType = m[1].trim().replace(/\s+/g, ' ').substring(0, 30);
      break;
    }
  }

  // 종목 추출
  const bizItemPatterns = [
    /종\s*목[:\s：]+([^\n,]{2,30})/,
    /종목\s*([^\n,]{2,30})/
  ];
  for (const pat of bizItemPatterns) {
    const m = fullText.match(pat);
    if (m) {
      result.bizItem = m[1].trim().replace(/\s+/g, ' ').substring(0, 30);
      break;
    }
  }

  return result;
}
