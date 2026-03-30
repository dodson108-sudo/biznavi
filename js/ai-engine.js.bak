/* ================================================================
   BizNavi AI — ai-engine.js
   Claude API 호출, 프롬프트 생성, 데모 데이터 생성
   ================================================================ */

const AIEngine = (() => {
  const SYSTEM = `당신은 20년 경력의 전문 경영 컨설턴트입니다. 제공된 기업 정보를 바탕으로 심층적이고 실용적인 경영전략 분석 보고서를 작성하세요.

반드시 다음 JSON 구조로만 응답하세요 (마크다운 코드블록 없이 순수 JSON):
{
  "executiveSummary": "경영진 요약 (3~4문장, 구체적 수치와 인사이트 포함)",
  "swot": {
    "strengths": ["강점1","강점2","강점3","강점4"],
    "weaknesses": ["약점1","약점2","약점3","약점4"],
    "opportunities": ["기회1","기회2","기회3","기회4"],
    "threats": ["위협1","위협2","위협3","위협4"]
  },
  "stp": {
    "segmentation": "시장 세분화 분석 (2~3문장)",
    "targeting": "목표 시장 선정 (2~3문장)",
    "positioning": "포지셔닝 전략 (2~3문장)"
  },
  "fourP": {
    "product": "제품 전략 (2~3문장)",
    "price": "가격 전략 (2~3문장)",
    "place": "유통 전략 (2~3문장)",
    "promotion": "촉진 전략 (2~3문장)"
  },
  "keyStrategies": [
    {"title":"전략명","description":"전략 상세 설명 (2문장)","priority":"high"},
    {"title":"전략명2","description":"설명","priority":"high"},
    {"title":"전략명3","description":"설명","priority":"medium"},
    {"title":"전략명4","description":"설명","priority":"medium"},
    {"title":"전략명5","description":"설명","priority":"low"}
  ],
  "kpi": [
    {"metric":"지표명","current":"현재값","target":"목표값","timeline":"기간","progress":30},
    {"metric":"지표2","current":"현재값","target":"목표값","timeline":"기간","progress":15},
    {"metric":"지표3","current":"현재값","target":"목표값","timeline":"기간","progress":50},
    {"metric":"지표4","current":"현재값","target":"목표값","timeline":"기간","progress":20},
    {"metric":"지표5","current":"현재값","target":"목표값","timeline":"기간","progress":10},
    {"metric":"지표6","current":"현재값","target":"목표값","timeline":"기간","progress":40}
  ],
  "roadmap": [
    {"phase":"1단계: 기반 구축","period":"1~3개월","tasks":["태스크1","태스크2","태스크3","태스크4"]},
    {"phase":"2단계: 성장 가속","period":"4~6개월","tasks":["태스크1","태스크2","태스크3","태스크4"]},
    {"phase":"3단계: 확장 최적화","period":"7~12개월","tasks":["태스크1","태스크2","태스크3","태스크4"]}
  ]
}`;

  function buildPrompt(d) {
    return `다음 기업 정보를 분석해주세요:

## 기업 기본 정보
- 회사명: ${d.companyName}
- 업종: ${d.industry}
- 설립연도: ${d.foundedYear || '미입력'}
- 직원 수: ${d.employees || '미입력'}
- 연매출: ${d.revenue || '미입력'}
- 사업 지역: ${d.region || '미입력'}
- 주요 제품/서비스: ${d.products}
- 핵심 경쟁력: ${d.bizStrengths || '미입력'}

## 시장 및 경쟁 분석
- 타겟 고객: ${d.targetCustomer || '미입력'}
- 주요 경쟁사: ${d.competitors || '미입력'}
- 시장 규모: ${d.marketSize || '미입력'}
- 시장 점유율: ${d.marketShare || '미입력'}
- 차별화 요소: ${d.differentiation || '미입력'}

## 현재 문제점 및 목표
- 현재 문제: ${d.problems}
- 목표: ${d.goals}
- 목표 기간: ${d.timeline || '미입력'}
- 예산: ${d.budget || '미입력'}
- 추가사항: ${d.notes || '없음'}`;
  }

  async function callClaude(key, formData) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 4096,
        system: SYSTEM,
        messages: [{ role: 'user', content: buildPrompt(formData) }],
      }),
    });
    if (!res.ok) {
      let msg = 'API 호출 실패 (' + res.status + ')';
      try { const e = await res.json(); msg = e.error?.message || msg; } catch(_){}
      throw new Error(msg);
    }
    const body = await res.json();
    const text = body.content[0].text;
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
    const jsonStr = match ? match[1] : text;
    try { return JSON.parse(jsonStr.trim()); }
    catch(e) { throw new Error('응답 JSON 파싱 실패: ' + e.message); }
  }

  async function fakeAnalysis(d) {
    await new Promise(r => setTimeout(r, 3200));
    const co = d.companyName || '샘플 기업';
    const ind = d.industry || 'IT/소프트웨어';
    return {
      executiveSummary: `${co}은(는) ${ind} 분야에서 독자적인 기술력과 차별화된 서비스로 높은 성장 잠재력을 보유한 기업입니다. 현재 시장 확장 초기 단계에 있으며, 핵심 역량 강화와 브랜드 인지도 제고가 최우선 과제로 분석됩니다. AI·디지털 전환 트렌드와 맞물린 시장 기회를 선점하기 위해 고객 성공 중심의 성장 전략과 채널 다각화가 시급합니다. 전략적 투자와 파트너십 확대를 병행한다면 목표 기간 내 핵심 KPI 달성이 충분히 가능한 것으로 판단됩니다.`,
      swot: {
        strengths: ['독자적 핵심 기술 및 특허 경쟁력 보유', '기존 고객 높은 만족도와 재계약률 90%+', '숙련된 전문 인력과 빠른 의사결정 조직 문화', '경쟁사 대비 명확한 제품 차별성'],
        weaknesses: ['브랜드 인지도 및 대외 마케팅 역량 부족', '영업 채널과 파트너십 네트워크 미흡', '내부 프로세스 표준화·문서화 부족', '자본력 측면에서 대형 경쟁사 대비 열위'],
        opportunities: ['AI·디지털 전환 수요 급증 및 정부 지원 확대', '중소기업 SaaS 시장 연 25% 고성장 추세', '기존 고객사 추가 모듈 구매 (Upsell) 기회', '동남아 등 신흥 시장 글로벌 진출 가능성'],
        threats: ['대기업·글로벌 플레이어의 시장 진입 가속화', '가격 경쟁 심화에 따른 수익성 압박', '핵심 개발 인력 이탈 및 채용 경쟁 심화', '경기 불확실성에 따른 고객사 IT 투자 축소'],
      },
      stp: {
        segmentation: '직원 50~500명 규모의 성장기 중견·중소기업을 1차 세그먼트로, 스타트업 및 대기업 사업부를 2차 세그먼트로 구분합니다. 업종별로는 IT서비스, 제조업, 유통업 순으로 구매 의사결정 속도와 ROI 민감도가 높습니다.',
        targeting: '의사결정이 빠르고 ROI에 민감한 50~300인 규모 기업의 C레벨 및 팀장급 실무자를 핵심 타겟으로 선정합니다. 기술 친화적이고 혁신 수용성이 높은 IT 선도 기업을 우선 공략하여 레퍼런스를 확보합니다.',
        positioning: '"가장 빠르게 ROI를 실현하는 스마트 솔루션"으로 포지셔닝합니다. 대기업 솔루션의 기능 완성도와 스타트업의 민첩성을 결합한 Best-of-both-worlds 포지션을 구축하고, 가격 대비 최고 가치를 핵심 메시지로 전달합니다.',
      },
      fourP: {
        product: '핵심 기능 중심의 모듈형 제품 구조로 고객 맞춤형 확장이 가능하도록 설계를 고도화합니다. 월간 업데이트 사이클을 유지하며 고객 피드백 기반 기능 개선을 지속하여 제품 경쟁력을 강화합니다.',
        price: '프리미엄 Freemium 모델을 도입하여 진입 장벽을 낮추고 유료 전환율을 높입니다. 연간 계약 시 20% 할인 혜택을 제공하여 장기 고객 확보와 현금 흐름 안정화를 동시에 달성합니다.',
        place: '자사 홈페이지 직접 판매와 SaaS 마켓플레이스(AWS, Azure)를 주요 채널로 활용합니다. 회계법인·컨설팅사와의 파트너 채널을 구축하여 간접 판매 비중을 30%까지 확대합니다.',
        promotion: '콘텐츠 마케팅과 SEO를 통한 인바운드 리드 생성을 강화하고, 성공 사례 케이스 스터디를 제작합니다. 업계 웨비나와 LinkedIn 광고로 B2B 의사결정자 대상 브랜드 인지도를 높입니다.',
      },
      keyStrategies: [
        { title: '고객 성공 중심 성장 엔진 구축', description: '기존 고객의 성공 사례를 체계적으로 발굴·공유하여 신규 고객 획득 비용을 50% 절감합니다. NPS 70+ 달성을 통해 자연 성장(Organic Growth) 엔진을 구축합니다.', priority: 'high' },
        { title: '디지털 마케팅 역량 집중 강화', description: '콘텐츠 마케팅과 SEO 투자를 통해 월간 유기적 리드를 300% 증대시킵니다. 데이터 기반 마케팅 자동화로 리드 전환율을 현재 대비 2배 향상시킵니다.', priority: 'high' },
        { title: '전략적 파트너십 생태계 조성', description: '전략 파트너 10개사와 공식 협약을 통해 간접 판매 채널을 다각화합니다. 파트너 수익 분배 모델을 설계하여 지속 가능한 공동 성장 생태계를 조성합니다.', priority: 'medium' },
        { title: 'AI 기능 고도화로 기술 격차 확대', description: 'AI/ML 기반 기능을 핵심 제품에 통합하여 경쟁사와의 기술 격차를 확대합니다. 분기별 주요 기능 릴리즈로 고객 이탈률을 현재 대비 50% 이하로 감소시킵니다.', priority: 'medium' },
        { title: '글로벌 시장 진출 기반 마련', description: '동남아시아 1~2개국을 테스트 마켓으로 선정하여 글로벌 확장 가능성을 검증합니다. 현지 파트너사와 협력으로 초기 투자를 최소화하고 리스크를 관리합니다.', priority: 'low' },
      ],
      kpi: [
        { metric: '월간 신규 고객', current: '5건', target: '20건', timeline: '12개월', progress: 25 },
        { metric: '월간 반복 매출(MRR)', current: '3천만원', target: '1억원', timeline: '12개월', progress: 30 },
        { metric: '고객 이탈률(Churn)', current: '5%', target: '2% 이하', timeline: '6개월', progress: 60 },
        { metric: 'NPS 고객만족도', current: '45점', target: '70점', timeline: '12개월', progress: 64 },
        { metric: '브랜드 검색량', current: '월 1천회', target: '월 1만회', timeline: '12개월', progress: 10 },
        { metric: '파트너 계약 수', current: '2개사', target: '10개사', timeline: '12개월', progress: 20 },
      ],
      roadmap: [
        { phase: '1단계: 기반 강화', period: '1~3개월', tasks: ['고객 성공팀 구성 및 온보딩 표준화', 'SEO 최적화 및 콘텐츠 마케팅 런칭', '핵심 KPI 대시보드 구축', '파트너십 후보사 발굴'] },
        { phase: '2단계: 성장 가속', period: '4~6개월', tasks: ['AI 기능 베타 출시 및 고객 테스트', '공식 파트너 5개사 계약 체결', '마케팅 자동화 시스템 도입', '성공 사례 케이스스터디 10건 발행'] },
        { phase: '3단계: 확장 최적화', period: '7~12개월', tasks: ['해외 시장 1개국 파일럿 런칭', 'Freemium 전환 및 유료화 최적화', 'Series A 투자 유치 준비', '신규 모듈 출시 및 제품 로드맵 고도화'] },
      ],
    };
  }

  return { callClaude, fakeAnalysis };
})();
