/* ================================================================
   BizNavi AI — ai-engine.js (고도화 v2.0)
   Claude API 호출, 프롬프트 생성, 데모 데이터 생성
   ================================================================ */

const AIEngine = (() => {

  const SYSTEM = `당신은 맥킨지 & 컴퍼니 출신 20년 경력의 시니어 경영전략 컨설턴트입니다.
한국 중소기업·스타트업 전문이며, SWOT/STP/4P/KPI/로드맵 기반의 실전 컨설팅 보고서를 작성합니다.

[핵심 원칙]
1. 입력된 기업 정보에서 반드시 구체적 수치·업종 특성·경쟁 구도를 분석에 반영할 것
2. 일반론적 표현("디지털 전환", "고객 만족") 금지 — 반드시 해당 기업에 특화된 표현 사용
3. 각 전략 항목은 "왜 이 기업에 필요한가"의 근거를 포함할 것
4. KPI는 현실적으로 측정 가능한 지표만 포함할 것
5. 로드맵 태스크는 즉시 실행 가능한 액션 중심으로 작성할 것

반드시 다음 JSON 구조로만 응답하세요 (마크다운 코드블록 없이 순수 JSON):
{
  "executiveSummary": "경영진 요약 (4~5문장, 해당 기업의 업종·규모·문제·목표에 특화된 인사이트와 구체적 수치 포함)",

  "swot": {
    "strengths": [
      {"item": "강점 내용", "evidence": "근거 또는 활용 방안"},
      {"item": "강점2", "evidence": "근거"},
      {"item": "강점3", "evidence": "근거"},
      {"item": "강점4", "evidence": "근거"},
      {"item": "강점5", "evidence": "근거"},
      {"item": "강점6", "evidence": "근거"}
    ],
    "weaknesses": [
      {"item": "약점 내용", "evidence": "개선 방향"},
      {"item": "약점2", "evidence": "개선 방향"},
      {"item": "약점3", "evidence": "개선 방향"},
      {"item": "약점4", "evidence": "개선 방향"},
      {"item": "약점5", "evidence": "개선 방향"},
      {"item": "약점6", "evidence": "개선 방향"}
    ],
    "opportunities": [
      {"item": "기회 내용", "evidence": "활용 전략"},
      {"item": "기회2", "evidence": "활용 전략"},
      {"item": "기회3", "evidence": "활용 전략"},
      {"item": "기회4", "evidence": "활용 전략"},
      {"item": "기회5", "evidence": "활용 전략"},
      {"item": "기회6", "evidence": "활용 전략"}
    ],
    "threats": [
      {"item": "위협 내용", "evidence": "대응 방안"},
      {"item": "위협2", "evidence": "대응 방안"},
      {"item": "위협3", "evidence": "대응 방안"},
      {"item": "위협4", "evidence": "대응 방안"},
      {"item": "위협5", "evidence": "대응 방안"},
      {"item": "위협6", "evidence": "대응 방안"}
    ]
  },

  "stp": {
    "segmentation": "시장 세분화 (3~4문장: 인구통계·심리통계·행동 기반 세그먼트 구분, 가능하면 시장 규모 수치 포함)",
    "targeting": "목표 시장 (3~4문장: 1차·2차 타겟 명확히 구분, 타겟 퍼소나 특성 포함)",
    "positioning": "포지셔닝 전략 (3~4문장: 경쟁사 대비 차별화 포지션, 핵심 메시지 포함)"
  },

  "fourP": {
    "product": "제품 전략 (3~4문장: 핵심 기능·차별화 요소·개선 방향 포함)",
    "price": "가격 전략 (3~4문장: 구체적 가격 모델·할인 정책·경쟁사 대비 포지션 포함)",
    "place": "유통 전략 (3~4문장: 온·오프라인 채널·파트너십·채널별 비중 목표 포함)",
    "promotion": "촉진 전략 (3~4문장: 핵심 마케팅 채널·예산 배분 방향·측정 지표 포함)"
  },

  "keyStrategies": [
    {"title": "전략명 (5자 이내)", "description": "전략 상세 (3문장: 목적·실행방법·기대효과)", "priority": "high", "owner": "담당부서/역할", "timeline": "실행 기간"},
    {"title": "전략명2", "description": "설명", "priority": "high", "owner": "담당", "timeline": "기간"},
    {"title": "전략명3", "description": "설명", "priority": "high", "owner": "담당", "timeline": "기간"},
    {"title": "전략명4", "description": "설명", "priority": "medium", "owner": "담당", "timeline": "기간"},
    {"title": "전략명5", "description": "설명", "priority": "medium", "owner": "담당", "timeline": "기간"},
    {"title": "전략명6", "description": "설명", "priority": "low", "owner": "담당", "timeline": "기간"}
  ],

  "kpi": [
    {"metric": "지표명", "current": "현재값", "target": "목표값", "timeline": "기간", "progress": 30, "method": "측정 방법", "owner": "담당"},
    {"metric": "지표2", "current": "현재값", "target": "목표값", "timeline": "기간", "progress": 15, "method": "측정 방법", "owner": "담당"},
    {"metric": "지표3", "current": "현재값", "target": "목표값", "timeline": "기간", "progress": 50, "method": "측정 방법", "owner": "담당"},
    {"metric": "지표4", "current": "현재값", "target": "목표값", "timeline": "기간", "progress": 20, "method": "측정 방법", "owner": "담당"},
    {"metric": "지표5", "current": "현재값", "target": "목표값", "timeline": "기간", "progress": 10, "method": "측정 방법", "owner": "담당"},
    {"metric": "지표6", "current": "현재값", "target": "목표값", "timeline": "기간", "progress": 40, "method": "측정 방법", "owner": "담당"},
    {"metric": "지표7", "current": "현재값", "target": "목표값", "timeline": "기간", "progress": 25, "method": "측정 방법", "owner": "담당"},
    {"metric": "지표8", "current": "현재값", "target": "목표값", "timeline": "기간", "progress": 35, "method": "측정 방법", "owner": "담당"},
    {"metric": "지표9", "current": "현재값", "target": "목표값", "timeline": "기간", "progress": 60, "method": "측정 방법", "owner": "담당"},
    {"metric": "지표10", "current": "현재값", "target": "목표값", "timeline": "기간", "progress": 45, "method": "측정 방법", "owner": "담당"}
  ],

  "roadmap": [
    {
      "phase": "1단계: 기반 구축",
      "period": "1~3개월",
      "budget": "예상 예산",
      "tasks": ["즉시실행 태스크1", "태스크2", "태스크3", "태스크4", "태스크5", "태스크6"]
    },
    {
      "phase": "2단계: 성장 가속",
      "period": "4~6개월",
      "budget": "예상 예산",
      "tasks": ["태스크1", "태스크2", "태스크3", "태스크4", "태스크5", "태스크6"]
    },
    {
      "phase": "3단계: 확장 최적화",
      "period": "7~12개월",
      "budget": "예상 예산",
      "tasks": ["태스크1", "태스크2", "태스크3", "태스크4", "태스크5", "태스크6"]
    }
  ]
}`;

  function buildPrompt(d) {
    return `다음 기업 정보를 바탕으로 맞춤형 경영전략 분석 보고서를 작성해주세요.
입력된 정보를 최대한 분석에 반영하고, 일반론적 표현은 피해주세요.

## 기업 기본 정보
- 회사명: ${d.companyName}
- 업종: ${d.industry}
- 비즈니스 모델: ${d.bizModel || '미입력'}
- 설립연도: ${d.foundedYear || '미입력'}
- 직원 수: ${d.employees || '미입력'}
- 연매출: ${d.revenue || '미입력'}
- 사업 지역: ${d.region || '미입력'}
- 주요 제품/서비스: ${d.products}
- 핵심 강점 한 줄: ${d.coreStrength || '미입력'}
- 기타 핵심 경쟁력: ${d.bizStrengths || '미입력'}

## 시장 및 경쟁 분석
- 타겟 고객: ${d.targetCustomer || '미입력'}
- 주요 경쟁사 및 대비 포지션: ${d.competitors || '미입력'}
- 시장 규모: ${d.marketSize || '미입력'}
- 현재 시장 점유율: ${d.marketShare || '미입력'}
- 핵심 차별화 요소: ${d.differentiation || '미입력'}

## 현재 문제점 및 전략 목표
- 현재 가장 큰 문제: ${d.problems}
- 달성 목표: ${d.goals}
- 목표 기간: ${d.timeline || '미입력'}
- 가용 예산: ${d.budget || '미입력'}
- 추가사항: ${d.notes || '없음'}

[분석 지침]
- ${d.companyName}의 업종(${d.industry})과 비즈니스 모델(${d.bizModel || '미확인'})에 특화된 전략을 제시할 것
- 경쟁사(${d.competitors || '미입력'}) 대비 차별화 포인트를 SWOT·포지셔닝에 명확히 반영할 것
- KPI는 ${d.timeline || '12개월'} 내 달성 가능한 현실적 수치로 설정할 것
- 로드맵 태스크는 ${d.budget ? '예산 ' + d.budget + ' 범위 내에서 ' : ''}즉시 실행 가능한 액션으로 작성할 것`;
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
        max_tokens: 8000,
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
    const bm = d.bizModel || 'B2B SaaS';
    const comp = d.competitors || '주요 경쟁사';
    const tl = d.timeline || '12개월';
    const cs = d.coreStrength || '독자 기술력';

    return {
      executiveSummary: `${co}은(는) ${ind} 분야에서 "${cs}"을 핵심 경쟁력으로 보유한 ${bm} 기업입니다. 현재 ${d.problems || '시장 확장'}이 주요 과제이며, ${tl} 내 ${d.goals || '목표 달성'}을 위한 집중 전략이 필요합니다. ${comp} 대비 차별화된 포지셔닝과 고객 성공 중심의 실행 전략을 통해 시장 내 입지를 강화할 수 있습니다. 핵심 KPI 10개 기준 현재 평균 달성률 35% 수준이며, 본 전략 실행 시 ${tl} 내 목표치 달성이 가능한 것으로 분석됩니다. 우선순위 3대 전략(고객 성공 강화·채널 다각화·제품 고도화)의 병행 실행을 권고합니다.`,

      swot: {
        strengths: [
          { item: `${cs} 기반 경쟁 우위`, evidence: `${ind} 시장에서 ${comp} 대비 기술 진입장벽 구축 가능` },
          { item: '기존 고객 높은 충성도 및 재계약률', evidence: '고객 레퍼런스를 신규 영업에 적극 활용 가능' },
          { item: '빠른 의사결정과 유연한 조직 문화', evidence: '대기업 대비 고객 맞춤 대응 속도 우위' },
          { item: `${bm} 기반 안정적 수익 모델`, evidence: '반복 매출 구조로 현금 흐름 예측 가능성 높음' },
          { item: '숙련된 도메인 전문 인력 보유', evidence: `${ind} 특화 지식으로 솔루션 품질 차별화` },
          { item: '낮은 초기 고객 이탈률', evidence: '온보딩 완료 고객의 6개월 내 이탈률 5% 이하 수준' }
        ],
        weaknesses: [
          { item: '브랜드 인지도 및 마케팅 역량 부족', evidence: '콘텐츠 마케팅·SEO 투자로 6개월 내 개선 가능' },
          { item: '영업 채널 및 파트너십 네트워크 미흡', evidence: '업종별 전문 파트너사 3~5개 확보 우선 추진' },
          { item: '내부 프로세스 표준화 부족', evidence: '플레이북 작성으로 신규 인력 온보딩 속도 향상' },
          { item: `${comp} 대비 자본력 열위`, evidence: '정부지원사업·투자 유치로 격차 축소 필요' },
          { item: '고객 성공 전담 조직 부재', evidence: 'CS팀 구성 시 이탈률 50% 이상 감소 가능' },
          { item: '데이터 기반 의사결정 체계 미흡', evidence: '핵심 KPI 대시보드 구축으로 실시간 모니터링 필요' }
        ],
        opportunities: [
          { item: `${ind} 시장 연 20~30% 고성장 추세`, evidence: '시장 성장에 올라탄 공격적 확장 전략 적기' },
          { item: 'AI·디지털 전환 정부 지원 확대', evidence: '중소기업 디지털화 바우처 등 활용 가능' },
          { item: '기존 고객 업셀(Upsell) 기회', evidence: '현재 고객 대상 추가 모듈 판매로 LTV 2배 확대 가능' },
          { item: '경쟁사 고객 이탈 수요 포착', evidence: `${comp}의 가격 인상·서비스 저하 시 전환 수요 공략` },
          { item: '간접 채널(파트너십) 확장 여지', evidence: '회계법인·컨설팅사 제휴로 영업력 레버리지 가능' },
          { item: '동남아 등 해외 시장 진출 가능성', evidence: '국내 레퍼런스 기반으로 유사 시장 진입 가능' }
        ],
        threats: [
          { item: `${comp} 등 대형 플레이어의 기능 고도화`, evidence: '차별화 포인트 지속 강화 및 니치 시장 집중으로 대응' },
          { item: '가격 경쟁 심화에 따른 수익성 압박', evidence: '가치 기반 가격 정책과 ROI 가시화로 가격 저항 극복' },
          { item: '핵심 인력 이탈 및 채용 경쟁', evidence: '스톡옵션·성장 기회 제공으로 핵심 인력 리텐션 강화' },
          { item: '경기 불확실성에 따른 IT 투자 축소', evidence: '빠른 ROI 입증 사례로 예산 삭감 대상에서 제외' },
          { item: '규제 환경 변화(데이터·보안)', evidence: '선제적 컴플라이언스 대응으로 신뢰도 차별화 요소 활용' },
          { item: '오픈소스·무료 대안 확산', evidence: '전문 서비스·지원 역량 강화로 프리미엄 포지션 유지' }
        ]
      },

      stp: {
        segmentation: `${ind} 시장을 규모·성숙도·의사결정 구조 기준으로 세분화합니다. 1세그먼트는 직원 50~300명 규모의 성장기 중소기업으로 ROI 민감도가 높고 의사결정이 빠릅니다. 2세그먼트는 직원 300~1,000명 규모의 중견기업으로 도입 검토 주기가 길지만 계약 규모가 큽니다. 3세그먼트는 스타트업·벤처로 초기 비용 민감도는 높지만 기술 친화성이 뛰어나 레퍼런스 확보에 유리합니다.`,
        targeting: `1차 타겟은 직원 50~300명 규모의 ${ind} 업종 성장기 기업입니다. 의사결정권자는 대표·부서장급이며, 6개월 내 ROI를 요구하는 실용 중심 구매자입니다. 2차 타겟은 ${bm} 도입을 검토 중인 중견기업 IT·전략 담당자로, 파일럿 도입 후 전사 확산 패턴을 보입니다. ${comp} 대비 전환 비용 대비 가치를 명확히 제시하는 것이 핵심입니다.`,
        positioning: `"${cs}으로 가장 빠르게 ROI를 실현하는 ${ind} 전문 솔루션"으로 포지셔닝합니다. ${comp}가 커버하지 못하는 ${ind} 특화 기능과 빠른 온보딩 속도를 핵심 차별점으로 내세웁니다. 핵심 메시지: "도입 90일 내 ROI 가시화 보장" — 성공 사례 데이터로 이를 뒷받침합니다.`
      },

      fourP: {
        product: `${cs}를 핵심으로 한 모듈형 구조로 고객 규모·니즈에 맞게 확장 가능하도록 설계합니다. ${tl} 내 AI 자동화 기능 추가로 경쟁사와의 기술 격차를 확대합니다. 월간 업데이트 사이클을 통해 고객 피드백을 빠르게 반영하고, 온보딩 완료율 95% 이상을 KPI로 관리합니다.`,
        price: `${bm} 기반 월정액 구조를 유지하되, 연간 계약 시 15~20% 할인 혜택을 제공해 현금 흐름을 안정화합니다. 입문형 플랜(소규모 기업 대상)으로 진입 장벽을 낮추고 업셀 경로를 명확히 설계합니다. ${comp} 대비 10~15% 프리미엄 포지션을 유지하되, ROI 계산기 제공으로 가격 저항을 극복합니다.`,
        place: `자사 홈페이지 직접 판매를 1차 채널로 유지하며, 전문 파트너(회계법인·컨설팅사) 간접 채널 비중을 ${tl} 내 30%까지 확대합니다. 업종별 협회·단체와의 제휴를 통해 타겟 고객 집중 접근 효율을 높입니다. 온라인 데모·무료 체험 흐름을 최적화해 셀프서비스 전환율을 개선합니다.`,
        promotion: `콘텐츠 마케팅(블로그·케이스스터디)과 SEO에 마케팅 예산의 40%를 집중 투자합니다. LinkedIn B2B 광고로 의사결정자 대상 브랜드 인지도를 높이고, 성공 사례 웨비나로 리드를 육성합니다. ${ind} 업종 전문 미디어 기고·PR로 신뢰도를 빠르게 구축합니다.`
      },

      keyStrategies: [
        { title: '고객 성공 엔진', description: `${co}의 기존 고객 만족도를 체계화해 레퍼런스 마케팅으로 연결합니다. 고객 성공 매니저(CSM) 1인 채용 후 온보딩 표준화 및 정기 리뷰 미팅을 도입합니다. 목표: NPS 70+, 재계약률 95%, 레퍼런스 고객 10개사 확보.`, priority: 'high', owner: '고객성공팀', timeline: '1~3개월' },
        { title: '콘텐츠 마케팅', description: `${ind} 업종 특화 콘텐츠(케이스스터디·가이드)를 월 4편 발행하여 유기적 리드를 확대합니다. SEO 최적화로 핵심 키워드 상위 노출을 목표로 하며, 6개월 내 월 방문자 300% 증가를 달성합니다. 전환율 최적화를 병행하여 리드→상담 전환율 5% 이상을 목표로 합니다.`, priority: 'high', owner: '마케팅팀', timeline: '1~6개월' },
        { title: '파트너 채널 구축', description: `${ind} 관련 회계법인·컨설팅사·협회 5개사와 공식 파트너 계약을 체결합니다. 파트너 수익 분배 모델(매출의 15~20% 커미션)을 설계하고 파트너 교육 프로그램을 운영합니다. ${tl} 내 간접 채널 매출 비중 30% 달성을 목표로 합니다.`, priority: 'high', owner: '사업개발팀', timeline: '2~6개월' },
        { title: '제품 AI 고도화', description: `${cs}에 AI 자동화 기능을 추가하여 ${comp} 대비 기술 격차를 확대합니다. 분기별 주요 기능 릴리즈 로드맵을 수립하고 베타 테스터 고객군을 운영합니다. 제품 고도화로 이탈률을 현재 대비 50% 이하로 감소시키는 것을 목표로 합니다.`, priority: 'medium', owner: '개발팀', timeline: '3~9개월' },
        { title: 'KPI 대시보드', description: `핵심 지표 10개를 실시간 모니터링하는 내부 대시보드를 구축합니다. 주간 경영진 리뷰 미팅에서 KPI 달성률을 점검하고 즉각적인 전략 조정 체계를 수립합니다. 데이터 기반 의사결정 문화 정착으로 실행 속도와 정확도를 동시에 높입니다.`, priority: 'medium', owner: '경영진', timeline: '1~2개월' },
        { title: '글로벌 파일럿', description: `국내 레퍼런스를 기반으로 동남아 1개국(베트남·태국 우선 검토) 파일럿 진출을 준비합니다. 현지 파트너사와의 협업으로 초기 투자를 최소화하고 시장 검증을 완료합니다. ${tl} 후반기에 파일럿 결과 기반 본격 진출 여부를 결정합니다.`, priority: 'low', owner: '대표·사업개발', timeline: '9~12개월' }
      ],

      kpi: [
        { metric: '월간 신규 고객(MNQ)', current: '5건', target: '20건', timeline: tl, progress: 25, method: 'CRM 신규 계약 건수 집계', owner: '영업팀' },
        { metric: '월간 반복 매출(MRR)', current: '3천만원', target: '1억원', timeline: tl, progress: 30, method: '구독 매출 합산 (취소 제외)', owner: '재무팀' },
        { metric: '고객 이탈률(Churn Rate)', current: '5%', target: '2% 이하', timeline: '6개월', progress: 60, method: '월별 해지 고객 수 / 전월 말 고객 수', owner: '고객성공팀' },
        { metric: 'NPS 순추천고객지수', current: '45점', target: '70점', timeline: tl, progress: 64, method: '분기별 NPS 설문 (응답률 40% 이상)', owner: '고객성공팀' },
        { metric: '리드 → 상담 전환율', current: '2%', target: '5%', timeline: '6개월', progress: 40, method: '마케팅 자동화 툴 전환 추적', owner: '마케팅팀' },
        { metric: '파트너 계약 수', current: '2개사', target: '10개사', timeline: tl, progress: 20, method: '공식 파트너 계약서 체결 기준', owner: '사업개발팀' },
        { metric: '월간 유기적 방문자', current: '1천명', target: '5천명', timeline: '9개월', progress: 20, method: 'Google Analytics 오가닉 세션', owner: '마케팅팀' },
        { metric: '고객 LTV(생애가치)', current: '600만원', target: '1,800만원', timeline: tl, progress: 33, method: 'ARPU × 평균 계약기간', owner: '재무팀' },
        { metric: '온보딩 완료율', current: '70%', target: '95%', timeline: '3개월', progress: 74, method: '온보딩 체크리스트 완료 고객 비율', owner: '고객성공팀' },
        { metric: '영업 파이프라인 규모', current: '5억원', target: '20억원', timeline: tl, progress: 25, method: 'CRM 파이프라인 가중 합산', owner: '영업팀' }
      ],

      roadmap: [
        {
          phase: '1단계: 기반 강화',
          period: '1~3개월',
          budget: '전체 예산의 30%',
          tasks: [
            '고객 성공 매니저(CSM) 1인 채용 및 온보딩 표준화 플레이북 작성',
            'KPI 10개 실시간 모니터링 대시보드 구축 (Google Data Studio 활용)',
            'SEO 키워드 분석 및 핵심 랜딩페이지 최적화',
            `${ind} 성공 사례 케이스스터디 3건 제작 및 배포`,
            '파트너 후보사 10개 발굴 및 1차 미팅 진행',
            '주간 경영진 KPI 리뷰 미팅 체계 수립'
          ]
        },
        {
          phase: '2단계: 성장 가속',
          period: '4~6개월',
          budget: '전체 예산의 40%',
          tasks: [
            `AI 핵심 기능 v1 베타 출시 및 기존 고객 테스트 운영`,
            '공식 파트너 5개사 계약 체결 및 파트너 교육 프로그램 운영',
            '마케팅 자동화 시스템 도입 (이메일 육성 시퀀스 구축)',
            '월 4편 콘텐츠 발행 체계 확립 (블로그·LinkedIn·뉴스레터)',
            `${comp} 전환 고객 대상 특별 마이그레이션 패키지 출시`,
            '연간 계약 전환 캠페인으로 현금 흐름 안정화'
          ]
        },
        {
          phase: '3단계: 확장 최적화',
          period: '7~12개월',
          budget: '전체 예산의 30%',
          tasks: [
            '동남아 파일럿 시장 1개국 현지 파트너사 계약 체결',
            'Freemium 플랜 출시 및 유료 전환 퍼널 최적화',
            `AI 기능 v2 정식 출시 및 전체 고객 적용`,
            '시리즈 A 투자 유치 준비 (IR 자료·재무 모델 정비)',
            '신규 모듈 2종 출시 및 기존 고객 업셀 캠페인',
            '연간 성과 리뷰 및 차년도 전략 수립'
          ]
        }
      ]
    };
  }

  return { callClaude, fakeAnalysis };
})();
