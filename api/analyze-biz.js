/**
 * Vercel Serverless Function: /api/analyze-biz
 * 업태+종목 → 업종분류(industry_key) + 비즈니스 맥락 정의
 * wizard Step 1 완료 후 호출 → Step 2(맥락 확인 화면) 데이터 생성
 */

const INDUSTRY_KEYS = [
  'local_service', 'restaurant', 'wholesale', 'construction',
  'knowledge_it', 'mfg_parts', 'food_mfg', 'medical',
  'finance', 'education', 'fashion', 'media',
  'logistics', 'energy', 'agri_food', 'export_sme'
];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { bizType, bizItem, companyName, foundedYear, employees, revenue } = req.body || {};
  if (!bizType || !bizItem) {
    return res.status(400).json({ error: '업태와 종목을 입력해주세요.' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ status: 'error', message: 'API 키가 설정되지 않았습니다.' });
  }

  const currentYear = new Date().getFullYear();
  const yearsInBusiness = foundedYear ? currentYear - parseInt(foundedYear) : null;

  const prompt = `당신은 한국 소상공인·중소기업 경영 컨설턴트입니다.
사업자등록증의 업태와 종목을 보고 이 사업체의 본질을 정의하고 진단 방향을 설정하세요.
반드시 아래 JSON 형식으로만 응답하고, 다른 텍스트는 절대 포함하지 마세요.

[입력 정보]
- 상호명: ${companyName || '미입력'}
- 업태: ${bizType}
- 종목: ${bizItem}
- 개업연도: ${foundedYear || '미입력'} ${yearsInBusiness ? `(업력 ${yearsInBusiness}년)` : ''}
- 직원수: ${employees || '미입력'}
- 연매출: ${revenue || '미입력'}

[반환 JSON]
{
  "industry_key": "(아래 16개 중 정확히 하나)",
  "industry_label": "(한국어 업종명 — 예: 생활밀착형 서비스업)",
  "business_description": "(이 사업체가 실제로 무엇을 하는 곳인지 핵심 1~2문장. 예: '지역 주민을 대상으로 헤어 시술을 제공하는 방문형 B2C 서비스업 — 재방문율과 단골 관리가 생존의 핵심')",
  "biz_scale": "(micro 또는 sme — 직원 5명 이하·매출 10억 미만이면 micro, 아니면 sme)",
  "years_in_business": ${yearsInBusiness ?? null},
  "critical_areas": ["(핵심 경영 지표 1)", "(핵심 경영 지표 2)", "(핵심 경영 지표 3)"],
  "diagnosis_note": "(이 업체 진단 시 AI가 특별히 유의해야 할 업종 특성 1문장)"
}

[industry_key 선택 기준 — 반드시 이 목록에서만 선택]
- local_service : 헤어·네일·피부샵, 세탁소, 수선집, 반려동물, 필라테스·요가스튜디오, 주유소 등 지역 밀착 생활서비스
- restaurant    : 음식점, 카페, 베이커리, 배달전문점, 분식점, 주점
- wholesale     : 도소매, 유통, 무역상사(국내 위주), 대리점
- construction  : 건설, 인테리어, 리모델링, 전기·설비공사
- knowledge_it  : IT개발, 소프트웨어, SaaS, 컨설팅, 회계·법무, 광고대행
- mfg_parts     : 기계·금속·자동차·전자 부품 등 산업재 제조
- food_mfg      : 식품·음료·건강기능식품·HMR 제조
- medical       : 병원·의원·한의원·약국·헬스장·PT샵·성형외과
- finance       : 금융·보험·핀테크·대부·투자
- education     : 학원·교습소·온라인강의·직업훈련기관
- fashion       : 의류·패션잡화 디자인·제조·유통 브랜드 (미용 서비스 제외)
- media         : 미디어·콘텐츠제작·1인방송·광고·디자인스튜디오
- logistics     : 화물운송·택배·창고·이사·포워딩
- energy        : 태양광·신재생에너지·환경·재활용·폐기물처리
- agri_food     : 농산물·수산물·축산물 원물 재배·가공·유통
- export_sme    : 해외 수출이 매출의 30% 이상인 제조·유통 기업`;

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
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await claudeRes.json();
    if (data.error) throw new Error(data.error.message);

    const text = data.content?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('응답 JSON 파싱 실패');

    const result = JSON.parse(jsonMatch[0]);

    // industry_key 유효성 검증
    if (!INDUSTRY_KEYS.includes(result.industry_key)) {
      result.industry_key = 'local_service';
      result.industry_label = result.industry_label || '서비스업';
    }

    return res.status(200).json({ status: 'success', ...result });

  } catch (err) {
    console.error('analyze-biz error:', err.message);
    return res.status(200).json({ status: 'error', message: '분석 중 오류가 발생했습니다.' });
  }
};
