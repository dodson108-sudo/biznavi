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
  // foundedYear가 날짜형(20101116)으로 넘어올 경우 앞 4자리만 사용
  const yearStr = foundedYear ? String(foundedYear).substring(0, 4) : null;
  const yearsInBusiness = yearStr ? currentYear - parseInt(yearStr) : null;
  const isStartup = yearsInBusiness !== null && yearsInBusiness < 1;

  const prompt = `당신은 한국 소상공인·중소기업 경영 컨설턴트입니다.
사업자등록증의 업태와 종목을 보고 이 사업체의 본질을 정의하고 진단 방향을 설정하세요.
반드시 아래 JSON 형식으로만 응답하고, 다른 텍스트는 절대 포함하지 마세요.

[입력 정보]
- 상호명: ${companyName || '미입력'}
- 업태: ${bizType}
- 종목: ${bizItem}
- 개업연도: ${foundedYear || '미입력'} ${yearsInBusiness !== null ? `(업력 약 ${yearsInBusiness}년)` : ''}
- 직원수: ${employees || '미입력'}
- 연매출: ${revenue || '미입력'}
${isStartup ? '⚠️ 창업 초기 기업 (개업 1년 미만): diagnosis_note에 반드시 창업 초기 특성 반영' : ''}

[반환 JSON]
{
  "industry_key": "(아래 16개 중 정확히 하나 — 분류 기준 숙지 후 선택)",
  "industry_label": "(한국어 업종명 — 예: 사업시설 유지관리 서비스업)",
  "business_description": "(이 사업체가 실제로 무엇을 하는 곳인지 핵심 1~2문장. 예: 'B2B 고객사의 건물·시설을 위탁받아 청소·설비점검·보안 등 통합 유지관리 서비스 제공 — 장기계약 갱신율과 인력 운용 효율이 수익성 핵심')",
  "biz_scale": "(micro 또는 sme — 직원 5명 이하·매출 10억 미만이면 micro, 아니면 sme)",
  "years_in_business": ${yearsInBusiness ?? null},
  "is_startup": ${isStartup},
  "critical_areas": ["(핵심 경영 지표 1)", "(핵심 경영 지표 2)", "(핵심 경영 지표 3)"],
  "diagnosis_note": "(이 업체 진단 시 AI가 특별히 유의해야 할 업종·규모·창업시기 특성 1~2문장)"
}

[industry_key 분류 기준 — 반드시 이 목록에서만 선택, 아래 구체 예시 기준 엄수]

★ 분류 주의사항 (자주 혼동되는 업종):
- FM(시설관리)·사업시설유지·보안경비·청소대행·빌딩관리 → local_service  (B2B여도 서비스업)
- 실제 공사·시공·신축·리모델링·전기배선 현장작업 → construction  (용역서비스 X)
- 인력파견·아웃소싱·HR컨설팅 → knowledge_it
- 물류창고관리만(운송 없음) → wholesale

[16개 분류]
- local_service : 헤어·네일·피부샵, 세탁소, 수선집, 반려동물샵, 필라테스·요가, 주유소, 사업시설유지관리(FM)·빌딩관리·경비·청소대행·방역·소독 등 생활밀착·B2B 위탁서비스
- restaurant    : 음식점, 카페, 베이커리, 배달전문점, 분식점, 주점
- wholesale     : 도소매, 유통, 무역상사(국내 위주), 대리점, 총판
- construction  : 건설현장 시공, 인테리어 공사, 리모델링 공사, 전기·소방·설비 공사 (완공된 건물의 일상 관리는 local_service)
- knowledge_it  : IT개발, 소프트웨어, SaaS, 컨설팅·자문, 회계·법무·세무, 광고대행, 인력파견·아웃소싱, HR컨설팅
- mfg_parts     : 기계·금속·자동차·전자 부품 등 산업재 제조
- food_mfg      : 식품·음료·건강기능식품·HMR 제조
- medical       : 병원·의원·한의원·약국·헬스장·PT샵·성형외과·요양원
- finance       : 금융·보험·핀테크·대부·투자
- education     : 학원·교습소·온라인강의·직업훈련기관
- fashion       : 의류·패션잡화 디자인·제조·유통 브랜드 (미용 서비스 제외)
- media         : 미디어·콘텐츠제작·1인방송·광고·디자인스튜디오·영상제작
- logistics     : 화물운송·택배·창고·이사·포워딩·배송대행
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
