/**
 * Vercel Serverless Function: /api/ocr-scan
 * 사업자등록증 이미지 → Claude Vision API → 필드 자동추출
 * Google Vision API 불필요 — ANTHROPIC_API_KEY 하나로 동작
 */

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { imageBase64, mimeType = 'image/jpeg' } = req.body || {};
  if (!imageBase64) return res.status(400).json({ error: '이미지 데이터가 없습니다.' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ status: 'error', message: 'API 키가 설정되지 않았습니다.' });
  }

  // 지원 MIME 타입 검증 (Claude Vision 지원 형식)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const safeMime = allowedTypes.includes(mimeType) ? mimeType : 'image/jpeg';

  const extractPrompt = `이 사업자등록증 이미지에서 정보를 추출하여 JSON 형식으로만 응답하세요.
찾을 수 없는 항목은 null로 표시하세요. JSON 이외의 텍스트는 절대 포함하지 마세요.

{
  "bizRegNo": "사업자등록번호 (XXX-XX-XXXXX 형식, 하이픈 포함)",
  "companyName": "상호명 (법인명 또는 상호)",
  "repName": "대표자 성명",
  "bizType": "업태 (예: 서비스, 제조, 도소매, 음식점 등 — 사업자등록증에 기재된 그대로)",
  "bizItem": "종목 (예: 미용업, 음식점업, 자동차부품, 소프트웨어개발 등 — 사업자등록증에 기재된 그대로)",
  "foundedDate": "개업연월일 문자열 (예: 2019년 3월 15일)",
  "foundedYear": "개업연도 4자리 숫자 문자열 (예: 2019)"
}`;

  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: safeMime, data: imageBase64 }
            },
            { type: 'text', text: extractPrompt }
          ]
        }]
      })
    });

    const data = await claudeRes.json();
    if (data.error) throw new Error(data.error.message);

    const text = data.content?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('응답에서 JSON을 찾지 못했습니다.');

    const parsed = JSON.parse(jsonMatch[0]);
    return res.status(200).json({ status: 'success', ...parsed });

  } catch (err) {
    console.error('ocr-scan error:', err.message);
    return res.status(200).json({
      status: 'error',
      message: 'OCR 처리 중 오류가 발생했습니다. 직접 입력을 이용해주세요.'
    });
  }
};
