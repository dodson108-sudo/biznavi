/* ================================================================
   BizNavi AI — ai-engine.js (고도화 v2.0)
   Claude API 호출, 프롬프트 생성, 데모 데이터 생성
   ================================================================ */

const AIEngine = (() => {

  function calcDiagScores(diagScores) {
    if (!diagScores || Object.keys(diagScores).length === 0) return null;

    const tabs = {
      common: { label: '기본 경영 진단', areas: {}, total: 0, count: 0 },
      industry: { label: '업종 특화 진단', areas: {}, total: 0, count: 0 },
      bizmodel: { label: '사업모델 진단', areas: {}, total: 0, count: 0 }
    };

    Object.keys(diagScores).forEach(key => {
      const entry = diagScores[key];
      if (!entry || !entry.score || entry.score === 0) return;

      // key 형식: diag-{tab}-container_{area_id}_{item_id}
      const parts = key.split('_');
      if (parts.length < 2) return;

      // 탭 판별
      let tabKey = 'common';
      if (key.includes('diag-industry')) tabKey = 'industry';
      else if (key.includes('diag-bizmodel')) tabKey = 'bizmodel';

      // 영역 판별 (1_1 → area_1)
      const itemParts = key.split('_');
      const areaId = 'area_' + itemParts[itemParts.length - 2];

      const tab = tabs[tabKey];
      if (!tab.areas[areaId]) tab.areas[areaId] = { total: 0, count: 0 };
      tab.areas[areaId].total += entry.score;
      tab.areas[areaId].count += 1;
      tab.total += entry.score;
      tab.count += 1;
    });

    // 평균 점수 계산
    const result = {};
    Object.keys(tabs).forEach(tabKey => {
      const tab = tabs[tabKey];
      if (tab.count === 0) return;
      result[tabKey] = {
        label: tab.label,
        avg: Math.round((tab.total / tab.count) * 10) / 10,
        areas: {}
      };
      Object.keys(tab.areas).forEach(areaId => {
        const area = tab.areas[areaId];
        result[tabKey].areas[areaId] = Math.round((area.total / area.count) * 10) / 10;
      });
    });
    return result;
  }

  function getScoreLabel(score) {
    if (score >= 4.0) return '🟢 강점';
    if (score >= 3.0) return '🟡 보통';
    if (score >= 2.0) return '🟠 취약';
    return '🔴 위험';
  }

  function buildDiagSummary(diagScores) {
    const scores = calcDiagScores(diagScores);
    if (!scores) return '진단 미실시';

    let summary = '';
    Object.keys(scores).forEach(tabKey => {
      const tab = scores[tabKey];
      summary += `\n[${tab.label}] 종합 ${tab.avg}점 ${getScoreLabel(tab.avg)}\n`;
      Object.keys(tab.areas).forEach(areaId => {
        const areaScore = tab.areas[areaId];
        summary += `  · ${areaId}: ${areaScore}점 ${getScoreLabel(areaScore)}\n`;
      });
    });

    // 취약/위험 영역 추출
    const weakAreas = [];
    const strongAreas = [];
    Object.keys(scores).forEach(tabKey => {
      Object.keys(scores[tabKey].areas).forEach(areaId => {
        const s = scores[tabKey].areas[areaId];
        if (s < 2.5) weakAreas.push(`${scores[tabKey].label} - ${areaId} (${s}점)`);
        if (s >= 4.0) strongAreas.push(`${scores[tabKey].label} - ${areaId} (${s}점)`);
      });
    });

    if (weakAreas.length > 0) {
      summary += `\n⚠️ 즉각 개선 필요 영역:\n`;
      weakAreas.forEach(a => summary += `  · ${a}\n`);
    }
    if (strongAreas.length > 0) {
      summary += `\n💪 핵심 강점 영역:\n`;
      strongAreas.forEach(a => summary += `  · ${a}\n`);
    }

    return summary;
  }

  function buildInsightsSummary(industry, bizModel) {
    const industryVarMap = {
      '제조업': typeof INDUSTRY_MFG_PARTS !== 'undefined' ? INDUSTRY_MFG_PARTS : null,
      '식품/음료': typeof INDUSTRY_FOOD_MFG !== 'undefined' ? INDUSTRY_FOOD_MFG : null,
      '서비스업': typeof INDUSTRY_LOCAL_SERVICE !== 'undefined' ? INDUSTRY_LOCAL_SERVICE : null,
      '유통/물류': typeof INDUSTRY_WHOLESALE !== 'undefined' ? INDUSTRY_WHOLESALE : null,
      '외식 및 휴게음식업': typeof INDUSTRY_RESTAURANT !== 'undefined' ? INDUSTRY_RESTAURANT : null,
      'IT/소프트웨어': typeof INDUSTRY_KNOWLEDGE_IT !== 'undefined' ? INDUSTRY_KNOWLEDGE_IT : null,
      '건설/부동산': typeof INDUSTRY_CONSTRUCTION !== 'undefined' ? INDUSTRY_CONSTRUCTION : null,
      '의료/헬스케어': typeof INDUSTRY_MEDICAL !== 'undefined' ? INDUSTRY_MEDICAL : null,
      '금융/핀테크': typeof INDUSTRY_FINANCE !== 'undefined' ? INDUSTRY_FINANCE : null,
      '교육': typeof INDUSTRY_EDUCATION !== 'undefined' ? INDUSTRY_EDUCATION : null,
      '패션/뷰티': typeof INDUSTRY_FASHION !== 'undefined' ? INDUSTRY_FASHION : null,
      '미디어/엔터테인먼트': typeof INDUSTRY_MEDIA !== 'undefined' ? INDUSTRY_MEDIA : null,
    };

    const bizModelVarMap = {
      'B2B SaaS': typeof BIZMODEL_B2B_SAAS !== 'undefined' ? BIZMODEL_B2B_SAAS : null,
      'B2C 구독': typeof BIZMODEL_B2C_SUB !== 'undefined' ? BIZMODEL_B2C_SUB : null,
      'B2B 솔루션': typeof BIZMODEL_B2B_SOLUTION !== 'undefined' ? BIZMODEL_B2B_SOLUTION : null,
      'B2C 커머스': typeof BIZMODEL_B2C_COMMERCE !== 'undefined' ? BIZMODEL_B2C_COMMERCE : null,
      '플랫폼·마켓플레이스': typeof BIZMODEL_PLATFORM !== 'undefined' ? BIZMODEL_PLATFORM : null,
      '프랜차이즈': typeof BIZMODEL_FRANCHISE !== 'undefined' ? BIZMODEL_FRANCHISE : null,
      '제조·유통': typeof BIZMODEL_MFG_DIST !== 'undefined' ? BIZMODEL_MFG_DIST : null,
      '서비스업': typeof BIZMODEL_SERVICE !== 'undefined' ? BIZMODEL_SERVICE : null,
      '기타': typeof BIZMODEL_ETC !== 'undefined' ? BIZMODEL_ETC : null,
    };

    let insightText = '';

    const industryData = industryVarMap[industry];
    if (industryData && industryData.insights) {
      insightText += `\n[${industryData.title} 핵심 진단 처방 방향]\n`;
      industryData.insights.forEach((insight, i) => {
        insightText += `  ${i+1}. ${insight}\n`;
      });
    }

    const bizModelData = bizModelVarMap[bizModel];
    if (bizModelData && bizModelData.insights) {
      insightText += `\n[${bizModelData.title} 핵심 진단 처방 방향]\n`;
      bizModelData.insights.forEach((insight, i) => {
        insightText += `  ${i+1}. ${insight}\n`;
      });
    }

    return insightText;
  }

  const SYSTEM = `[절대 규칙]
- 응답은 반드시 순수 JSON만 출력한다. 코드블록(\`\`\`) 사용 금지.
- 첫 글자는 반드시 { 이어야 한다.
- JSON 외 설명 텍스트 절대 금지.
- JSON이 완성되지 않으면 각 항목 내용을 줄여서라도 반드시 완성할 것.

당신은 맥킨지·BCG 출신 20년 경력의 시니어 경영전략 컨설턴트입니다.
한국 중소기업·스타트업 전문이며, 실제 컨설팅 현장에서 사용하는 수준의 구체적 전략 보고서를 작성합니다.
단순한 방향 제시가 아닌, 대표가 내일 당장 실행에 옮길 수 있는 액션플랜을 제시하는 것이 당신의 핵심 역할입니다.

[언어 원칙]
- 중소기업 대표가 바로 이해할 수 있는 쉬운 한국어 사용.
- 영어 약어 사용 시 반드시 괄호 안에 한국어로 풀어서 설명.
  예) NPS(고객 추천 지수), MRR(월 반복 매출), CAC(고객 획득 비용)
- 일반론적 표현("디지털 전환 필요", "고객 만족 향상") 절대 금지.
  반드시 입력된 기업명·업종·수치·경쟁사를 직접 언급하며 특화된 표현 사용.

[필수 반영 원칙 — 이 항목들이 빠지면 보고서 실패]

1. 5 Forces 분석 결과 → SWOT 기회·위협에 직접 문장으로 인용할 것.
   예: "신규진입자 위협 강 → 진입장벽 구축이 시급한 위협 요인"

2. TAM/SAM/SOM → STP 세분화와 KPI 목표 수치 설정에 반드시 반영.
   예: SAM이 500억원이면 SOM 목표를 SAM의 몇 % 점유로 설정하는지 명시.

3. 경쟁사 약점 → SWOT 기회 + 포지셔닝 전략에 직접 활용.
   예: "경쟁사 A의 고객서비스 불만 → 당사 차별화 포인트로 전면 배치"

4. 진단 점수 반영:
   - 🔴위험(1~1.9점): SWOT 약점 최상단 + 핵심전략 1순위로 즉각 처방
   - 🟠취약(2~2.9점): SWOT 약점 포함 + 단기 개선 과제(3개월 이내)
   - 🟡보통(3~3.9점): 점진적 개선 방향 제시
   - 🟢강점(4~5점): SWOT 강점 + 차별화 전략의 핵심 무기로 활용

5. 업종 시장 트렌드(제공된 데이터) → SWOT 기회에 최소 2개 직접 인용.

6. 정부지원사업(매칭 결과 제공 시) → 로드맵 1단계 태스크에 구체적 신청 일정 포함.

[경영 프레임워크 10권 — 각 섹션별 적용 위치]

① 블루오션(김위찬): SWOT 기회에 "경쟁 없는 새 시장(ERRC)" 관점 1개 이상 포함.
② 포터 경쟁우위: keyStrategies에 원가우위 또는 차별화 중 하나를 명확히 선택해 방향 제시.
③ 루멜트 좋은 전략: keyStrategies 각 항목 = [진단: 왜 문제인가] + [방침: 무엇을 할 것인가] + [행동: 구체적으로 어떻게]. 희망 목록 나열 절대 금지.
④ OKR(존 도어): KPI의 target은 반드시 구체적 숫자+기간. timeline은 분기별 마일스톤 포함.
⑤ 린 스타트업: 로드맵 1단계 = MVP 최소 실행 검증. "Build→Measure→Learn" 사이클 태스크에 명시.
⑥ 제로 투 원(피터 틸): SWOT 강점에 "이 기업만이 가진 독점적 비밀(Secret)" 1개 이상 발굴해 포함.
⑦ 하이 아웃풋(앤디 그로브): keyStrategies priority 설정 시 레버리지(최소 자원×최대 산출) 가장 높은 것을 high로.
⑧ 짐 콜린스: executiveSummary에 헤지호그 컨셉(열정×최고×수익 교집합) 언급. 로드맵은 플라이휠(초기 성공→다음 성공 가속) 구조로.
⑨ StoryBrand 7단계(도널드 밀러): fourP.promotion = 고객이 주인공, 브랜드는 가이드. 메시지 구조: [고객의 문제] → [우리의 해결책] → [성공 비전] 순서로 작성.
⑩ 6가지 시스템(도널드 밀러): 로드맵 3단계를 리더십·마케팅·판매·제품·운영·재무 중 취약 시스템 우선 강화 순서로 구성.

[컨설팅 유형별 specializedAnalysis 프레임워크 — consultingType 기준으로 반드시 해당 구조 작성]

• finance_strategy (경영재무전략) → framework="BEP·현금흐름 분석" | blocks 4개: ①손익분기점(BEP) ②현금흐름 시나리오(6개월) ③재무 개선 긴급 과제 3가지 ④자금 조달 방안
• growth_strategy (사업화·성장전략) → framework="비즈니스 모델 캔버스(BMC)" | blocks: ①가치 제안(VP) ②핵심 고객(CS) ③채널(CH) ④고객 관계(CR) ⑤수익 흐름(RS) ⑥핵심 자원(KR) ⑦핵심 활동(KA) ⑧핵심 파트너(KP) ⑨비용 구조(Cost)
• differentiation_strategy (차별화전략) → framework="VRIO 경쟁우위 분석" | blocks 5개: ①V-가치(Value) ②R-희소성(Rarity) ③I-모방불가(Imitability) ④O-조직역량(Organization) ⑤경쟁우위 종합 판정
• hr_strategy 또는 structure_strategy → framework="맥킨지 7S 프레임워크" | blocks 7개: ①Strategy ②Structure ③Systems ④Staff ⑤Skills ⑥Style ⑦Shared Values
• digital_strategy (디지털전환전략) → framework="디지털 전환 MVP 로드맵" | blocks 5개: ①현재 디지털 수준 진단 ②MVP 1단계(1~3개월) ③MVP 2단계(4~6개월) ④추천 기술 스택 ⑤ROI 예측
• 그 외 유형 (innovation·marketing·pivot·cx·기타) → framework="[유형명] 특화 처방 분석" | blocks 4~5개 (핵심 처방 수치·기간 포함 필수)

[사업 규모별 모드 분기 — bizScale 값 기준으로 출력 강도 조정]

• bizScale = "micro" (소상공인):
  - SWOT·STP·4P·keyStrategies·KPI·roadmap은 간결하게 작성 (각 항목 핵심 위주)
  - **sixSystems와 plan90days를 최우선 집중 작성** — 각 시스템 issue는 반드시 2~3문장 이상, actions 3개 모두 즉시 실행 가능한 구체 액션으로 작성
  - plan90days 각 달의 actions 3개는 업종·비즈니스모델·핵심강점을 반영한 맞춤 액션 (일반론 절대 금지)
  - leanCanvas도 반드시 작성 (소상공인 비즈니스 캔버스로 활용)

• bizScale = "sme" (소기업·중소기업):
  - 기존 전략 프레임워크(SWOT·STP·4P·keyStrategies·KPI·roadmap)를 풍부하게 작성
  - sixSystems와 plan90days도 작성하되 roadmap과 연계하여 작성

반드시 다음 JSON 구조로만 응답 (마크다운 코드블록 없이 순수 JSON):
{
  "executiveSummary": "경영진 요약. 반드시 포함: ①기업명+업종+핵심강점 ②현재 가장 큰 문제와 근본 원인 ③헤지호그 컨셉(열정·최고·수익 교집합) ④TAM/SAM/SOM 기반 시장 기회 규모 ⑤12개월 핵심 목표와 우선순위 전략 3가지. 5~6문장, 수치 포함 필수.",

  "swot": {
    "strengths": [
      {"item": "강점명 (입력 데이터 기반, 독점적 우위 포함)", "evidence": "이 강점이 경쟁사 대비 왜 차별화되는지 + 전략적 활용 방안 구체 서술"},
      {"item": "강점2", "evidence": "근거와 활용방안"},
      {"item": "강점3", "evidence": "근거와 활용방안"},
      {"item": "강점4", "evidence": "근거와 활용방안"},
      {"item": "강점5", "evidence": "근거와 활용방안"},
      {"item": "강점6 (블루오션: 경쟁자 없는 독자 영역)", "evidence": "ERRC 관점 새 시장 기회"}
    ],
    "weaknesses": [
      {"item": "약점1 (진단 최저점 영역 최우선)", "evidence": "구체적 개선 액션 + 목표 기간"},
      {"item": "약점2", "evidence": "개선 액션"},
      {"item": "약점3", "evidence": "개선 액션"},
      {"item": "약점4", "evidence": "개선 액션"},
      {"item": "약점5", "evidence": "개선 액션"},
      {"item": "약점6", "evidence": "개선 액션"}
    ],
    "opportunities": [
      {"item": "기회1 (업종 시장 트렌드 직접 인용)", "evidence": "이 트렌드를 어떻게 선점할지 구체 전략"},
      {"item": "기회2 (업종 시장 트렌드 직접 인용)", "evidence": "활용 전략"},
      {"item": "기회3 (5Forces: 신규진입·대체재·공급자·구매자·경쟁 중 기회 요인)", "evidence": "5Forces 결과 직접 인용하여 기회화 방안"},
      {"item": "기회4 (경쟁사 약점 활용)", "evidence": "경쟁사 약점을 우리 기회로 전환하는 구체 방안"},
      {"item": "기회5 (TAM/SAM/SOM 기반 시장 기회)", "evidence": "시장 규모 수치 인용 + 점유 전략"},
      {"item": "기회6 (정부지원·블루오션 새 시장)", "evidence": "활용 전략"}
    ],
    "threats": [
      {"item": "위협1 (5Forces 위협 요인 직접 인용)", "evidence": "5Forces 결과 인용 + 구체 대응 전략"},
      {"item": "위협2 (5Forces 위협 요인)", "evidence": "대응 전략"},
      {"item": "위협3 (경쟁사 동향)", "evidence": "대응 전략"},
      {"item": "위협4 (업종 리스크 트렌드)", "evidence": "대응 전략"},
      {"item": "위협5", "evidence": "대응 전략"},
      {"item": "위협6", "evidence": "대응 전략"}
    ]
  },

  "stp": {
    "segmentation": "시장 세분화: TAM/SAM/SOM 수치를 직접 인용하여 전체→접근가능→목표 시장을 구체적 숫자로 제시. 인구통계(규모·업종·지역)·심리통계(구매 동기·Pain Point)·행동(구매 주기·채널) 기준으로 3~4개 세그먼트 명확히 구분. 각 세그먼트 규모 추정치 포함.",
    "targeting": "1차 타겟: 구체적 기업 유형/소비자 특성·규모·지역·구매력 명시. 2차 타겟: 중기 확장 대상 명시. 타겟 퍼소나의 핵심 Pain Point 3가지와 구매 결정 요인 서술. SAM 중 어느 세그먼트를 왜 1차로 선택했는지 근거 포함.",
    "positioning": "포터의 차별화 또는 원가우위 중 선택 명시. 경쟁사 대비 포지셔닝 맵 설명(X축·Y축 기준 제시). StoryBrand 관점: 고객의 문제→우리의 해결책→성공 비전 순서로 핵심 메시지 1문장 도출. 제로 투 원 관점: 경쟁사와 다른 차원에서 경쟁하는 독점적 포지션 서술."
  },

  "fourP": {
    "product": "제품/서비스 핵심 가치: 고객의 어떤 Pain Point를 어떻게 해결하는지 구체 서술. 경쟁사 대비 차별화 기능 3가지 명시. 업종 트렌드 반영한 단기(3개월)·중기(6개월) 개선 로드맵. 린 스타트업 관점: 가장 빠르게 검증할 MVP 기능 제시.",
    "price": "구체적 가격 구조(단가·패키지·구독료 등) 제시. 경쟁사 가격 대비 포지셔닝(프리미엄/동일/저가) 명시. 할인·번들·성과 기반 가격 정책 구체 제안. TAM/SAM/SOM과 연계한 가격 전략이 수익에 미치는 영향 서술.",
    "place": "현재 주력 채널 분석 + 채널별 매출 비중 목표(%). 온라인·오프라인·파트너 채널별 구체 전략. 업종 트렌드 반영한 신규 채널 진출 계획. 정부지원사업 활용 가능한 유통 관련 사업 포함.",
    "promotion": "StoryBrand 7단계 적용 — [고객이 원하는 것: ○○]→[고객의 문제: ○○]→[우리가 가이드: ○○]→[실행 계획: ○○]→[행동 촉구: ○○]→[실패 회피: ○○]→[성공 비전: ○○] 구조로 핵심 마케팅 메시지 작성. 채널별 예산 배분(%) 제시. 90일 내 실행 가능한 마케팅 캠페인 구체 계획."
  },

  "keyStrategies": [
    {
      "title": "전략명(8자이내)",
      "description": "[진단: 왜 이것이 이 기업의 핵심 문제인가 — 구체적 수치나 상황 제시] [방침: 어떤 방향으로 해결할 것인가] [행동: 담당자가 이번 주 월요일부터 실행할 수 있는 구체적 3가지 액션]",
      "priority": "high",
      "owner": "담당부서",
      "timeline": "X개월 (분기별 마일스톤)"
    },
    {"title": "전략2", "description": "[진단] [방침] [행동: 3가지 즉시 실행 액션]", "priority": "high", "owner": "담당", "timeline": "기간"},
    {"title": "전략3", "description": "[진단] [방침] [행동: 3가지 즉시 실행 액션]", "priority": "high", "owner": "담당", "timeline": "기간"},
    {"title": "전략4", "description": "[진단] [방침] [행동: 3가지 즉시 실행 액션]", "priority": "medium", "owner": "담당", "timeline": "기간"},
    {"title": "전략5", "description": "[진단] [방침] [행동: 3가지 즉시 실행 액션]", "priority": "medium", "owner": "담당", "timeline": "기간"},
    {"title": "전략6(6시스템 취약 보완)", "description": "[진단] [방침] [행동: 3가지 즉시 실행 액션]", "priority": "low", "owner": "담당", "timeline": "기간"}
  ],

  "kpi": [
    {"metric": "지표명 (OKR 핵심결과 형태)", "current": "현재 수치 (구체적 숫자 필수, 모르면 추정값+추정 표시)", "target": "목표 수치 (SAM/SOM 기반 현실적 목표)", "timeline": "X개월 (Q1/Q2 분기별 체크포인트)", "progress": 20, "method": "측정 도구·방법 구체 명시", "owner": "실제 담당자/팀"},
    {"metric": "지표2", "current": "현재값", "target": "목표값", "timeline": "기간", "progress": 15, "method": "측정방법", "owner": "담당"},
    {"metric": "지표3", "current": "현재값", "target": "목표값", "timeline": "기간", "progress": 35, "method": "측정방법", "owner": "담당"},
    {"metric": "지표4", "current": "현재값", "target": "목표값", "timeline": "기간", "progress": 10, "method": "측정방법", "owner": "담당"},
    {"metric": "지표5", "current": "현재값", "target": "목표값", "timeline": "기간", "progress": 50, "method": "측정방법", "owner": "담당"},
    {"metric": "지표6", "current": "현재값", "target": "목표값", "timeline": "기간", "progress": 25, "method": "측정방법", "owner": "담당"},
    {"metric": "지표7", "current": "현재값", "target": "목표값", "timeline": "기간", "progress": 40, "method": "측정방법", "owner": "담당"},
    {"metric": "지표8", "current": "현재값", "target": "목표값", "timeline": "기간", "progress": 5, "method": "측정방법", "owner": "담당"},
    {"metric": "지표9", "current": "현재값", "target": "목표값", "timeline": "기간", "progress": 30, "method": "측정방법", "owner": "담당"},
    {"metric": "지표10 (업종 벤치마크 기준)", "current": "현재값", "target": "업종 평균 대비 목표", "timeline": "기간", "progress": 20, "method": "측정방법", "owner": "담당"}
  ],

  "leanCanvas": {
    "problem": "고객이 겪는 핵심 문제 2~3가지 (customerProblem 입력값 반드시 반영, 구체적 서술)",
    "customerSegments": "타겟 고객 세그먼트: 규모·업종·지역·구매 특성 명시 (targetCustomer 반영)",
    "uniqueValueProposition": "단 1문장의 핵심 가치 제안 — 고객이 우리를 선택해야 하는 이유. [고객이 원하는 것]을 [우리만의 방법]으로 해결합니다",
    "solution": "3대 핵심 해결책 — 각 솔루션이 어떤 문제를 어떻게 해결하는지 구체 서술",
    "channels": "주력 고객 획득·전달 채널 (온라인·오프라인·파트너 비중 % 포함)",
    "revenueStreams": "수익 흐름 구조 (주수익·부수익 구분, 가격 정책 포함)",
    "costStructure": "주요 비용 항목과 비중 (인건비·마케팅·운영비 등)",
    "keyMetrics": "비즈니스 건강 지표 3가지 — 각 지표 현재값·목표값·측정 주기",
    "unfairAdvantage": "모방 불가한 경쟁 우위 (unfairAdvantage 입력값 반드시 반영 + 강화 방안)"
  },

  "roadmap": [
    {
      "phase": "1단계: MVP 검증·기반 구축",
      "period": "1~3개월",
      "budget": "예상 예산 (구체적 금액 또는 범위)",
      "framework": "🔬 린 스타트업 — Build (구축) → Measure (측정) → Learn (학습) 사이클",
      "tasks": [
        "린 스타트업 MVP: [가장 빠르게 검증할 핵심 가설과 실행 방법]",
        "6시스템 취약 보완: [진단 최저점 시스템 즉각 개선 액션]",
        "정부지원사업 신청: [매칭된 지원사업명 + 신청 기한]",
        "경쟁사 약점 공략: [경쟁사 약점 활용한 즉시 실행 차별화]",
        "OKR 설정: [팀 전체 Q1 목표와 핵심결과 수립 및 공유]",
        "플라이휠 1번 바퀴: [초기 성공 사례 1개 만들기 — 구체 방법]"
      ]
    },
    {
      "phase": "2단계: 성장 가속·채널 확장",
      "period": "4~8개월",
      "budget": "예상 예산",
      "framework": "🌀 플라이휠 가속 — 1단계 성공을 레버리지로 성장 구조 구축",
      "tasks": [
        "StoryBrand 마케팅: [핵심 메시지 기반 마케팅 캠페인 실행]",
        "SAM 점유 확대: [SOM 목표 달성을 위한 구체 영업·마케팅 전략]",
        "블루오션 시장 진입: [ERRC로 발굴한 새 시장 파일럿 실행]",
        "파트너십·채널 구축: [2단계 핵심 파트너 확보 구체 계획]",
        "6시스템 마케팅·판매 고도화: [2단계 시스템 강화 내용]",
        "플라이휠 가속: [1단계 성공을 레버리지로 2단계 확장]"
      ]
    },
    {
      "phase": "3단계: 도약·시장 지배력 확보",
      "period": "9~12개월",
      "budget": "예상 예산",
      "framework": "🏗️ 6대 시스템 완성 — 리더십·마케팅·판매·제품·운영·재무 취약순 강화",
      "tasks": [
        "SOM 목표 달성: [연말 시장점유율 목표와 달성 전략]",
        "헤지호그 완성: [열정·최고·수익 교집합 비즈니스 모델 고도화]",
        "6시스템 운영·재무 최적화: [3단계 시스템 완성]",
        "차별화 방어막 구축: [경쟁사 모방 불가한 진입장벽 완성]",
        "글로벌·확장 준비: [다음 성장 단계 준비 — 구체 방향]",
        "플라이휠 완성: [자생적 성장 구조 완성 및 다음 단계 설계]"
      ]
    }
  ],

  "specializedAnalysis": {
    "type": "consultingType 키 값 그대로 (예: finance_strategy)",
    "framework": "위 유형별 지정 프레임워크명",
    "summary": "이 기업의 핵심 문제와 특화 처방 요약 2~3문장. 구체적 수치 포함 필수.",
    "blocks": [
      {"label": "섹션명", "content": "구체적이고 실행 가능한 내용. 수치·기간 포함 필수."},
      {"label": "섹션명2", "content": "내용"}
    ]
  },

  "sixSystems": [
    {
      "name": "1. 리더십 시스템",
      "icon": "👑",
      "status": "취약|보통|강점 중 하나",
      "issue": "이 시스템에서 지금 가장 큰 문제가 무엇인지 2~3문장으로 구체 서술. 대표가 어떤 결정을 못 하고 있는지, 팀이 어떤 혼선을 겪는지 입력값 기반으로 작성.",
      "actions": ["즉시 실행 가능한 구체 액션 1 (이번 주 실행)", "구체 액션 2 (이번 달 실행)", "구체 액션 3 (3개월 내 완성)"],
      "resource": "관련 도구·자료·지원사업 추천 (예: 중소기업 리더십 교육, 노무사 상담 등)"
    },
    {
      "name": "2. 마케팅 시스템",
      "icon": "📣",
      "status": "취약|보통|강점 중 하나",
      "issue": "고객이 우리를 어떻게 알게 되는지 현재 문제점을 2~3문장 구체 서술. 어떤 채널에서 어떤 비효율이 있는지, 무엇이 작동 안 하는지.",
      "actions": ["즉시 실행 가능한 구체 액션 1", "구체 액션 2", "구체 액션 3"],
      "resource": "추천 도구·자료"
    },
    {
      "name": "3. 판매 시스템",
      "icon": "💰",
      "status": "취약|보통|강점 중 하나",
      "issue": "잠재 고객이 실제 구매로 이어지는 과정에서 어디서 막히는지 2~3문장 구체 서술.",
      "actions": ["즉시 실행 가능한 구체 액션 1", "구체 액션 2", "구체 액션 3"],
      "resource": "추천 도구·자료"
    },
    {
      "name": "4. 제품·서비스 시스템",
      "icon": "🛠️",
      "status": "취약|보통|강점 중 하나",
      "issue": "제품·서비스의 품질·일관성·개선 체계 현황과 문제점을 2~3문장 구체 서술.",
      "actions": ["즉시 실행 가능한 구체 액션 1", "구체 액션 2", "구체 액션 3"],
      "resource": "추천 도구·자료"
    },
    {
      "name": "5. 운영 시스템",
      "icon": "⚙️",
      "status": "취약|보통|강점 중 하나",
      "issue": "일상 운영에서 반복되는 비효율·낭비·병목이 무엇인지 2~3문장 구체 서술.",
      "actions": ["즉시 실행 가능한 구체 액션 1", "구체 액션 2", "구체 액션 3"],
      "resource": "추천 도구·자료"
    },
    {
      "name": "6. 재무 시스템",
      "icon": "📊",
      "status": "취약|보통|강점 중 하나",
      "issue": "현금흐름·손익 파악·비용 관리 현황과 위험 요소를 2~3문장 구체 서술.",
      "actions": ["즉시 실행 가능한 구체 액션 1", "구체 액션 2", "구체 액션 3"],
      "resource": "추천 도구·자료"
    }
  ],

  "plan90days": [
    {
      "month": "1개월차",
      "theme": "기반 다지기 — 가장 급한 취약점 즉시 해결",
      "goal": "이 달 말까지 달성해야 할 구체적이고 측정 가능한 목표 1가지 (예: 고객 5명 인터뷰 완료, 간판·SNS 프로필 정비, 재무 현황표 작성)",
      "actions": [
        "이번 주 당장 실행: 입력값 기반 구체 액션 (도구·방법 포함)",
        "2주차 실행: 구체 액션",
        "3~4주차 실행: 구체 액션"
      ],
      "expectedResult": "이 달 행동 완료 시 실제로 무엇이 달라지는지 (숫자 포함 권장)",
      "govSupport": "이 시기에 신청 가능한 정부지원사업 1가지 (사업명 + 신청 기관)"
    },
    {
      "month": "2개월차",
      "theme": "실행·검증 — 고객 반응 확인 및 매출 연결",
      "goal": "2개월차 구체 목표",
      "actions": ["구체 액션 1", "구체 액션 2", "구체 액션 3"],
      "expectedResult": "기대 효과",
      "govSupport": "관련 지원사업"
    },
    {
      "month": "3개월차",
      "theme": "성장·반복 — 성공 패턴 고정화",
      "goal": "3개월차 구체 목표",
      "actions": ["구체 액션 1", "구체 액션 2", "구체 액션 3"],
      "expectedResult": "기대 효과",
      "govSupport": "관련 지원사업"
    }
  ]
}`;

  function buildCompetitorBlock(d) {
    const comps = [];
    if (d.comp1Name) {
      let c = `  · ${d.comp1Name}`;
      if (d.comp1Price)    c += ` | 가격: ${d.comp1Price}`;
      if (d.comp1Customer) c += ` | 주요고객: ${d.comp1Customer}`;
      if (d.comp1Weakness) c += ` | 약점(우리기회): ${d.comp1Weakness}`;
      comps.push(c);
    }
    if (d.comp2Name) {
      let c = `  · ${d.comp2Name}`;
      if (d.comp2Price)    c += ` | 가격: ${d.comp2Price}`;
      if (d.comp2Customer) c += ` | 주요고객: ${d.comp2Customer}`;
      if (d.comp2Weakness) c += ` | 약점(우리기회): ${d.comp2Weakness}`;
      comps.push(c);
    }
    if (d.comp3Name) {
      let c = `  · ${d.comp3Name}`;
      if (d.comp3Price)    c += ` | 가격: ${d.comp3Price}`;
      if (d.comp3Customer) c += ` | 주요고객: ${d.comp3Customer}`;
      if (d.comp3Weakness) c += ` | 약점(우리기회): ${d.comp3Weakness}`;
      comps.push(c);
    }
    return comps.length > 0 ? comps.join('\n') : '  미입력';
  }

  function buildForcesBlock(d) {
    const forces = [
      { label: '신규진입자 위협', val: d.forceEntry,      memo: d.forceEntryMemo },
      { label: '대체재 위협',     val: d.forceSubstitute, memo: d.forceSubstituteMemo },
      { label: '공급자 협상력',   val: d.forceSupplier,   memo: d.forceSupplierMemo },
      { label: '구매자 협상력',   val: d.forceBuyer,      memo: d.forceBuyerMemo },
      { label: '경쟁자 간 경쟁', val: d.forceRivalry,    memo: d.forceRivalryMemo },
    ];
    return forces
      .filter(f => f.val)
      .map(f => `  · ${f.label}: ${f.val}${f.memo ? ' — ' + f.memo : ''}`)
      .join('\n') || '  미입력';
  }

  function buildPrompt(d) {
    return `다음 기업 정보를 바탕으로 맞춤형 경영전략 분석 보고서를 작성해주세요.
입력된 정보를 최대한 분석에 반영하고, 일반론적 표현은 피해주세요.

## 1. 기업 기본 정보
- 회사명: ${d.companyName}
- 사업 규모: ${d.bizScale === 'micro' ? '소상공인 (직원 5명 이하 / 연매출 10억 미만) — 소상공인 특화 모드' : d.bizScale === 'sme' ? '소기업·중소기업 — 성장전략 모드' : '미입력'}
- 업태 (사업자등록증): ${d.bizType || d.industry || '미입력'}
- 종목 (사업자등록증): ${d.bizItem || '미입력'}
- AI 분류 업종: ${d.industryKey || d.industry || '미입력'}
- AI 사업 정의: ${d.aiBusinessDesc || '미입력'}
- 비즈니스 모델: ${d.bizModel || '미입력'}
- 설립연도: ${d.foundedYear || '미입력'}
- 직원 수: ${d.employees || '미입력'}
- 연매출: ${d.revenue || '미입력'}
- 사업 지역: ${d.region || '미입력'}
- 주요 제품/서비스: ${d.products}
- 핵심 강점 한 줄: ${d.coreStrength || '미입력'}
- 기타 핵심 경쟁력: ${d.bizStrengths || '미입력'}
- 고객의 핵심 문제(린 캔버스 Problem): ${d.customerProblem || '미입력'}
- 모방 불가 경쟁 우위(Unfair Advantage): ${d.unfairAdvantage || '미입력'}
- 진단 컨설팅 유형: ${d.consultingType || '미확인'}

## 2. 타겟 고객 및 시장
- 타겟 고객: ${d.targetCustomer || '미입력'}
- 주요 고객 획득 경로: ${d.customerAcquisition || '미입력'}
- CAC vs LTV: ${d.cacLtv || '미파악'}
- TAM (전체 시장): ${d.tam || '미입력'}
- SAM (접근 가능 시장): ${d.sam || '미입력'}
- SOM (점유 목표): ${d.som || '미입력'}
- 시장 연 성장률: ${d.marketGrowthRate || '미입력'}
- 주요 시장 트렌드: ${d.marketTrend || '미입력'}

## 3. 경쟁사 분석
${buildCompetitorBlock(d)}
- 우리의 핵심 차별화: ${d.differentiation || '미입력'}

## 4. 5 Forces 분석
${buildForcesBlock(d)}

## 5. 현재 문제점 및 전략 목표
- 현재 가장 큰 문제: ${d.problems}
- 달성 목표: ${d.goals}
- 목표 기간: ${d.timeline || '미입력'}
- 가용 예산: ${d.budget || '미입력'}
- 외부 리스크 요인: ${d.externalRisk || '미입력'}
- 핵심 파트너십/협력사: ${d.partnerships || '미입력'}
- 정부지원사업 관심: ${d.govSupport || '미입력'}
- 추가사항: ${d.notes || '없음'}
${ d.diagScores && Object.keys(d.diagScores).length > 0 ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. 업종별 맞춤 진단 결과
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${buildDiagSummary(d.diagScores)}
` : '' }
${ (d.industryKey || d.industry || d.bizModel) ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. 업종별 전문 처방 방향 (필수 반영)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${buildInsightsSummary(d.industryKey || d.industry, d.bizModel)}
` : '' }
${ (typeof IndustryTrends !== 'undefined' && (d.industryKey || d.industry)) ? (() => {
  const block = IndustryTrends.buildPromptBlock(d.industryKey || d.industry);
  return block ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8-1. 업종 시장 트렌드 데이터 (2025~2026)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${block}
` : '';
})() : '' }
${ (typeof GovSupport !== 'undefined') ? (() => {
  const block = GovSupport.buildPromptBlock(d);
  return block ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8-2. 정부지원사업 자동 매칭 결과 (필수 반영)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${block}
` : '';
})() : '' }
[분석 지침]
- ${d.companyName}의 업종(${d.industry})과 비즈니스 모델(${d.bizModel || '미확인'})에 특화된 전략을 제시할 것
- 컨설팅 유형 "${d.consultingType || '미확인'}"에 맞는 specializedAnalysis를 반드시 작성할 것 (위 컨설팅 유형별 프레임워크 지침 준수)
- 경쟁사(${d.comp1Name || '미입력'}) 대비 차별화 포인트, 특히 경쟁사 약점을 SWOT·포지셔닝에 명확히 반영할 것
- 5 Forces 결과를 기회·위협 분석에 직접 반영할 것${d.forceEntry === '강' || d.forceRivalry === '강' ? ' (진입/경쟁 강도 강함 — 방어 전략 우선)' : ''}
- TAM/SAM/SOM 데이터를 STP 세분화와 KPI 목표 설정에 반영할 것
- KPI는 ${d.timeline || '12개월'} 내 달성 가능한 현실적 수치로, 가능하면 입력된 현재값 기준으로 설정할 것
- 로드맵 태스크는 ${d.budget ? '예산 ' + d.budget + ' 범위 내에서 ' : ''}즉시 실행 가능한 액션으로 작성할 것
${d.govSupport && d.govSupport !== '관심 없음' ? `- 정부지원사업(${d.govSupport}) 활용 방안을 로드맵 또는 핵심전략에 반드시 포함할 것` : ''}
${d.externalRisk ? `- 외부 리스크(${d.externalRisk})에 대한 대응 전략을 위협 분석 및 로드맵에 반영할 것` : ''}
[경영 서적 프레임워크 적용 체크리스트]
- 블루오션: SWOT 기회에 ERRC 관점 새 시장 1개 이상 포함했는가?
- 루멜트: keyStrategies가 '진단→방침→행동' 구조인가? (나쁜 전략 = 희망 목록 나열 금지)
- StoryBrand(⑨): 4P promotion 메시지가 고객을 주인공으로 설정하고 브랜드를 가이드로 포지셔닝했는가?
- 6가지 시스템(⑩): 로드맵 3단계가 리더십·마케팅·판매·제품·운영·재무 중 취약 시스템을 순서대로 강화하는 구조인가?
- 린 스타트업: 로드맵 1단계 태스크가 MVP 검증 액션으로 시작하는가?
- OKR: KPI의 target이 구체적 수치와 기간을 포함하는가?`;
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
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8000,
        system: SYSTEM,
        messages: [
          { role: 'user', content: buildPrompt(formData) },
        ],
      }),
    });
    if (!res.ok) {
      let msg = 'API 호출 실패 (' + res.status + ')';
      try { const e = await res.json(); msg = e.error?.message || msg; } catch(_){}
      throw new Error(msg);
    }
    const body = await res.json();
    const text = body.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    console.log('API 원본 응답 (처음 500자):', text.substring(0, 500));

    // JSON 추출 시도 1: ```json 블록 (마크다운 코드블록)
    const jsonBlock = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonBlock) {
      try { return JSON.parse(jsonBlock[1]); } catch(e) {}
    }

    // JSON 추출 시도 2: 텍스트 전체가 순수 JSON인 경우
    const trimmed = text.trim();
    if (trimmed.startsWith('{')) {
      try { return JSON.parse(trimmed); } catch(e) {}
    }

    // JSON 추출 시도 3: 텍스트 중간에 { } 블록이 있는 경우
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      const candidate = text.substring(start, end + 1);
      try { return JSON.parse(candidate); } catch(e) {}
    }

    throw new Error('JSON 파싱 실패: ' + text.substring(0, 200));
  }

  function _fakeSpecialized(d) {
    const co  = d.companyName || '샘플 기업';
    const ind = d.industry    || 'IT/소프트웨어';
    const cs  = d.coreStrength || '핵심 강점';
    const type = d.consultingType || 'growth_strategy';

    const types = {
      finance_strategy: {
        framework: 'BEP·현금흐름 분석',
        summary: `${co}의 재무 건전성 강화가 최우선입니다. 손익분기점 달성과 현금흐름 안정화를 통해 지속 성장 기반을 마련해야 합니다.`,
        blocks: [
          { label: '손익분기점(BEP) 분석', content: `${ind} 업종 평균 영업이익률 8~12% 달성을 위한 원가구조 최적화가 시급합니다. 고정비 분석 기준 BEP 달성을 위한 최소 월 매출 목표를 설정하고, 변동비 10% 절감만으로 BEP 매출을 15% 이상 낮출 수 있습니다.` },
          { label: '현금흐름 시나리오 (6개월)', content: '기본 시나리오: 현재 매출 유지 시 월별 현금 잔액 추이. 개선 시나리오: 매출 채권 회수 기간 30일 단축 + 고정비 10% 절감 병행 시 6개월 내 현금 여유 3개월치 확보 가능. 즉시 실행: 조기결제 인센티브 2~3% 제공.' },
          { label: '재무 개선 3대 긴급 과제', content: '1순위: 매출 채권 회수 기간 단축 (60일→30일 목표). 2순위: 수익성 낮은 고객·제품 정리 — 상위 20% 고객이 매출의 80% 창출. 3순위: 고정비 구조조정 검토 (임차료·구독 서비스 재협상).' },
          { label: '자금 조달 방안', content: '단기: 중소기업 정책자금 (금리 2~3%, 최대 5억). 중기: 기보·신보 보증 대출 활용. 장기: 투자 유치 IR 자료 준비 (12개월 KPI 달성 데이터 기반). 정부 R&D 지원사업 매칭으로 현금 여력 확보.' }
        ]
      },
      growth_strategy: {
        framework: '비즈니스 모델 캔버스(BMC) 9블록',
        summary: `${co}의 사업화 가속을 위해 BMC 9블록으로 비즈니스 모델을 체계화합니다. 가치 제안을 명확히 하고 수익 흐름을 다각화하는 것이 핵심입니다.`,
        blocks: [
          { label: '가치 제안 (Value Proposition)', content: `"${cs}"을 기반으로 고객의 핵심 문제를 해결합니다. 경쟁사 대비 10배 더 나은 단 1가지 포인트에 집중하고, 가치 메시지를 1문장으로 정의하여 전 채널에 일관 적용하세요.` },
          { label: '핵심 고객 (Customer Segments)', content: `1차 타겟: ${d.targetCustomer || '성장기 중소기업 (직원 50~300명)'}. 수익성 상위 20% 고객군에 집중 영업. 고객 LTV(생애가치) 기준 세그먼트별 ROI를 측정하고 자원을 집중하세요.` },
          { label: '채널 + 고객 관계 (CH / CR)', content: `주력 채널: 직접 판매 + 파트너 채널. 12개월 목표: 파트너 채널 매출 30%. 고객 관계: 신규 온보딩 30일 프로그램 + 분기별 성공 리뷰. 재계약률 90% 이상 목표.` },
          { label: '수익 흐름 (Revenue Streams)', content: '수익 다각화 방안: ①핵심 서비스 구독료(주수익) ②프리미엄 기능 업셀 ③컨설팅·교육 서비스 ④파트너 수수료. 단일 수익원 의존도 12개월 내 50% 이하로 분산.' },
          { label: '핵심 자원 + 핵심 활동 (KR / KA)', content: `핵심 자원: ${cs} 관련 IP·인력·데이터. 핵심 활동: 제품 개발(월 1~2회 업데이트) + 고객 성공 관리 + 콘텐츠 마케팅. 비효율 활동 제거 및 반복 업무 자동화 도구 도입.` },
          { label: '핵심 파트너 + 비용 구조 (KP / Cost)', content: `전략 파트너: 업종 전문 컨설팅사·협회 3~5개사 제휴 목표. 파트너 커미션: 매출의 15~20%. 비용 구조: 인건비(60~70%) + 마케팅비 최적화. CAC 대비 LTV 3배 이상 유지가 건전한 성장의 핵심입니다.` }
        ]
      },
      differentiation_strategy: {
        framework: 'VRIO 경쟁우위 분석',
        summary: `${co}의 차별화 강점을 VRIO 프레임워크로 분석합니다. 지속 가능한 경쟁우위 구축과 모방 불가한 경쟁 해자(Moat) 강화가 핵심입니다.`,
        blocks: [
          { label: 'V — 가치 (Value)', content: `"${cs}"이 고객에게 실질적 가치를 창출하는가? 평가: 비용 절감 또는 매출 증가의 직접적 가치 제공 여부. 가치 강화 방안: ROI 계산기로 가치를 숫자로 증명하고, 고객 성공 사례 3건 이상 데이터화하여 영업에 활용하세요.` },
          { label: 'R — 희소성 (Rarity)', content: `"${cs}" 역량을 보유한 경쟁사 수 분석. ${d.comp1Name ? d.comp1Name + ' 등' : '주요 경쟁사'} 중 동일 역량 보유 기업이 시장의 10% 미만이면 희소성 확보. 희소성 강화: 특허 출원·기술 인증·독점 파트너십 계약 우선 추진.` },
          { label: 'I — 모방불가 (Imitability)', content: `${d.unfairAdvantage ? '"' + d.unfairAdvantage + '" 강점의 모방 난이도 분석.' : '핵심 역량의 모방 장벽 분석.'} 모방 장벽 구축: ①특허·IP 보호 ②누적 데이터·노하우 축적 ③독점적 고객 계약. 목표: 3~5년 내 복합 해자 구축으로 사실상 모방 불가 달성.` },
          { label: 'O — 조직역량 (Organization)', content: '핵심 강점을 실제 성과로 연결하는 조직 역량 진단. 강화 방안: 핵심 역량 전담팀 구성 + 성과 연동 인센티브 + 지식관리 시스템 구축. 조직 정렬도가 낮으면 아무리 좋은 자원도 경쟁우위로 전환되지 않습니다.' },
          { label: '경쟁우위 종합 판정', content: `VRIO 분석 결과: 현재 수준 "일시적 경쟁우위" → 목표: 12개월 내 "지속적 경쟁우위" 달성. 즉시 실행 3가지: ①핵심 기술 특허 출원 착수 ②독점 고객 장기계약 3개사 확보 ③전문 인력 1명 채용으로 팀 역량 강화.` }
        ]
      },
      hr_strategy: {
        framework: '맥킨지 7S 프레임워크',
        summary: `${co}의 조직·인력 역량을 맥킨지 7S로 진단합니다. 하드 요소(전략·구조·시스템)와 소프트 요소(인력·역량·스타일·가치)의 정렬도 향상이 핵심입니다.`,
        blocks: [
          { label: 'Strategy (전략) + Structure (구조)', content: `전략 명확성: ${d.goals || '목표'} 달성 전략이 전 직원에게 공유되고 있는가? 처방: 3페이지 전략 선언문 작성 → 전 직원 공유. 구조 최적화: ${d.employees || 'N명'} 규모에 맞는 역할 R&R 문서화 + 의사결정 권한 명확화.` },
          { label: 'Systems (시스템) + Staff (인력)', content: `시스템: CRM·협업 툴·재무관리 즉시 도입 권고. 인력: 핵심 인력 리텐션 플랜 + 업무 매뉴얼화 + 채용 우선순위 설정. 목표: 이직률 현재 대비 50% 감소.` },
          { label: 'Skills (역량) + Style (스타일)', content: `핵심 역량 강화: 영업·마케팅·데이터 분석 역량 보완 (외부 교육 + 채용). 리더십 스타일: 코칭형 전환 권고 — 주 1회 1:1 미팅 + 월 1회 팀 회고. 목표: 직원 몰입도 eNPS 50점 이상.` },
          { label: 'Shared Values (핵심 가치)', content: `${co}의 핵심 가치 3가지 명문화 및 채용·평가·표창에 연동. 처방: 가치 카드 제작 + 월간 실천 사례 공유. 목표: 신입 90일 내 조직 문화 적응률 90% 이상. 가치 정렬도가 높은 조직은 이직률이 2배 낮습니다.` }
        ]
      },
      structure_strategy: {
        framework: '맥킨지 7S 프레임워크',
        summary: `${co}의 기업 구조와 시스템 역량을 맥킨지 7S로 진단합니다. 조직의 하드·소프트 요소를 정렬하여 실행력을 높이는 것이 핵심입니다.`,
        blocks: [
          { label: 'Strategy + Structure', content: `전략과 구조의 정렬도 진단. 전략이 명확히 문서화되어 전 직원이 공유하고 있는지, 조직 구조가 전략 실행을 지원하는지 점검. 처방: 전략 선언문 작성 + 역할별 KPI 배정 + 명확한 R&R 구조.` },
          { label: 'Systems + Staff', content: '핵심 업무 시스템 점검 (CRM·ERP·협업 툴). 인력 역량과 역할 매핑. 즉시 개선: 핵심 업무 80% 이상 시스템화, 인력 의존도 감소.' },
          { label: 'Skills + Style', content: '팀 핵심 역량 보유 현황 및 부족 역량 파악. 리더십 스타일이 조직 성장 단계에 맞는지 진단. 처방: 역량 개발 로드맵 + 코칭형 리더십 전환.' },
          { label: 'Shared Values', content: `핵심 가치 명문화 및 조직 문화 정렬. 가치가 채용·평가·보상에 실제로 반영되는지 점검. 목표: ${co}만의 독특한 조직 문화 구축으로 인재 유치·유지 경쟁력 강화.` }
        ]
      },
      digital_strategy: {
        framework: '디지털 전환 MVP 로드맵',
        summary: `${co}의 디지털 전환을 MVP 방식으로 단계적으로 실행합니다. 즉시 ROI가 검증되는 도구부터 도입하고 성공 사례 기반으로 확장합니다.`,
        blocks: [
          { label: '현재 디지털 수준 진단', content: `${ind} 업종 ${d.bizModel || '비즈니스 모델'} 기준 디지털화 수준 진단. 즉시 개선 영역: CRM 부재 → 영업 파이프라인 미가시화, 수작업 보고 → 주간 2~3시간 낭비. 디지털 성숙도 현재 단계: 초기(1단계)` },
          { label: 'MVP 1단계: 즉시 도입 (1~3개월)', content: 'ROI 최우선 도구: ①HubSpot CRM 무료판 (영업 파이프라인 가시화) ②Notion (지식 관리·프로세스 문서화) ③Google Analytics 4 + Looker Studio (마케팅 성과 대시보드). 예상 비용: 월 0~20만원. ROI: 영업 효율 30% 향상.' },
          { label: 'MVP 2단계: 자동화 확장 (4~6개월)', content: '성공 검증 후 확장: ①마케팅 자동화 (이메일 시퀀스·리드 육성) ②AI 업무 도구 (Claude API·회의록 자동화) ③재무 관리 시스템 도입. 투자: 월 50~150만원. ROI: 운영 비용 20% 절감 + 마케팅 리드 2배.' },
          { label: '추천 기술 스택 + ROI 예측', content: `CRM: HubSpot(무료~월5만원) / 협업: Notion+Slack(월5~10만원) / 마케팅: Mailchimp(무료~월3만원) / 분석: GA4(무료). 6개월 기대 성과: 영업 사이클 30% 단축 + 월 보고 80% 자동화. 투자 회수: 3~4개월 이내.${d.budget ? ' 예산 ' + d.budget + ' 기준 최적 도구 조합 선택 권고.' : ''}` }
        ]
      }
    };

    const info = types[type];
    if (info) return { type, ...info };

    return {
      type,
      framework: '맞춤형 특화 처방 분석',
      summary: `${co}의 핵심 과제를 집중 분석하여 즉시 실행 가능한 처방을 제시합니다.`,
      blocks: [
        { label: '핵심 문제 진단', content: `${co}의 가장 시급한 과제: ${d.problems || '매출 성장 및 경쟁력 강화'}. 근본 원인 분석 및 우선순위별 처방.` },
        { label: '즉시 실행 과제 (30일)', content: '비용 최소화·효과 최대화 관점에서 내일부터 실행 가능한 3가지 액션플랜.' },
        { label: '3개월 집중 목표', content: `${d.goals || '핵심 목표'} 달성을 위한 분기별 실행 계획과 주간 체크리스트.` },
        { label: '핵심 성과 지표', content: '처방 효과 측정 KPI 3가지. 현재값·목표값·측정 방법 포함.' }
      ]
    };
  }

  async function fakeAnalysis(d) {
    await new Promise(r => setTimeout(r, 3200));
    const co = d.companyName || '샘플 기업';
    const ind = d.industry || 'IT/소프트웨어';
    const bm = d.bizModel || 'B2B SaaS';
    const comp = d.competitors || '주요 경쟁사';
    const tl = d.timeline || '12개월';
    const cs = d.coreStrength || '독자 기술력';

    // 진단 점수 분석으로 취약 영역 추출
    const _ds = calcDiagScores(d.diagScores || {});
    const _areas = [];
    if (_ds && _ds.common) {
      const _lbl = { area_1: '재무건전성', area_2: '조직·인력', area_3: '고객·매출', area_4: '경영역량' };
      Object.entries(_ds.common.areas || {}).forEach(([k, v]) => { if (v > 0) _areas.push({ l: _lbl[k] || k, s: v }); });
    }
    if (_ds && _ds.industry && _ds.industry.avg > 0) _areas.push({ l: '업종 특화', s: _ds.industry.avg });
    const _weak = _areas.filter(a => a.s < 3.0).sort((a, b) => a.s - b.s);
    const _strong = _areas.filter(a => a.s >= 4.0);
    const _avg = _areas.length ? (_areas.reduce((s, a) => s + a.s, 0) / _areas.length).toFixed(1) : '3.0';
    const _bizDesc = d.aiBusinessDesc || (d.bizType && d.bizItem ? `${d.bizType} 분야 ${d.bizItem}` : ind);
    const _scaleLabel = d.bizScale === 'micro' ? '소상공인' : '중소기업';
    const _problemTxt = d.problems ? `"${d.problems.substring(0, 60)}"` : '고객 확보와 수익 안정화';
    const _goalTxt = d.goals ? `${d.goals.substring(0, 50)}` : '지속 성장 기반 구축';
    const _weakTxt = _weak.length > 0
      ? `진단 결과 ${_weak.slice(0, 2).map(a => a.l + '(' + a.s.toFixed(1) + '점)').join(', ')} 영역에서 집중 개선이 필요합니다.`
      : `전반적으로 균형 잡힌 역량 구조를 갖추고 있습니다(평균 ${_avg}점).`;
    const _strongTxt = _strong.length > 0 ? ` ${_strong.map(a => a.l).join('·')} 역량은 강점으로 이를 마케팅·영업에 더 적극 활용해야 합니다.` : '';
    const _riskTxt = d.externalRisk ? ` 특히 외부 위협(${d.externalRisk.substring(0, 35)}...)에 대한 선제적 대응 전략이 필요합니다.` : '';

    return {
      executiveSummary: `${co}은(는) ${_bizDesc}을(를) 운영하는 ${_scaleLabel}입니다. 현재 핵심 과제는 ${_problemTxt}이며, ${tl} 내 "${_goalTxt}" 달성이 목표입니다. ${_weakTxt}${_strongTxt}${_riskTxt} 이를 해결하기 위해 단기(0~3개월) 취약 영역 집중 개선 → 중기(4~6개월) 매출 확장 채널 구축 → 장기(7~12개월) 운영 체계 고도화로 이어지는 3단계 실행 로드맵을 제시합니다. 본 보고서의 모든 전략은 귀사가 진단·입력한 실제 현황 데이터를 근거로 분석되었습니다.`,

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

      leanCanvas: {
        problem:               d.customerProblem || `${ind} 기업이 겪는 핵심 문제: 비효율적 운영 프로세스와 시장 변화 대응 지연, 고객 유지율 저하`,
        customerSegments:      d.targetCustomer  || `${ind} 분야 성장기 중소기업 (직원 50~300명, 연 매출 10~50억원, 의사결정 속도 빠른 업체)`,
        uniqueValueProposition:`"${cs}"으로 ${d.targetCustomer || '고객'}의 핵심 문제를 가장 빠르게 해결하는 ${bm} 전문 솔루션`,
        solution:              `①${d.products || '핵심 서비스'}로 즉시 효과 체감 ②온보딩 30일 내 ROI 가시화 ③전담 고객 성공 매니저 배정으로 지속 성장 지원`,
        channels:              d.customerAcquisition || '직접 영업(60%) + 파트너 채널(25%) + 콘텐츠 마케팅·SEO(15%)',
        revenueStreams:        `${bm} 기반 구독료(주수익) + 프리미엄 기능 업셀 + 컨설팅·교육 서비스. 연간 계약 전환 시 15% 할인으로 현금흐름 안정화`,
        costStructure:         `인건비(60~70%) + 마케팅비(15~20%) + 인프라·SaaS 비용(5~10%) + 운영비(5%). 초기: 고정비 최소화·외주 활용`,
        keyMetrics:            `①MRR(월 반복 매출) 현재→목표 ②고객 이탈률(Churn) 현재→2% 이하 ③NPS(순추천지수) 현재→70+ — 주간 모니터링`,
        unfairAdvantage:       d.unfairAdvantage || `${cs} — ${comp} 등 경쟁사가 단기에 복제 불가한 독자 역량. 특허·고객 데이터·네트워크 효과로 점진적 강화`
      },

      roadmap: [
        {
          phase: '1단계: MVP 검증·기반 구축',
          period: '1~3개월',
          budget: '전체 예산의 30%',
          framework: '🔬 린 스타트업 — Build → Measure → Learn 사이클',
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
          framework: '🌀 플라이휠 가속 — 1단계 성공을 레버리지로 성장 구조 구축',
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
          phase: '3단계: 스케일업·시장 지배',
          period: '7~12개월',
          budget: '전체 예산의 30%',
          framework: '🏗️ 6대 시스템 완성 — 리더십·마케팅·판매·제품·운영·재무 취약순 강화',
          tasks: [
            '동남아 파일럿 시장 1개국 현지 파트너사 계약 체결',
            'Freemium 플랜 출시 및 유료 전환 퍼널 최적화',
            `AI 기능 v2 정식 출시 및 전체 고객 적용`,
            '시리즈 A 투자 유치 준비 (IR 자료·재무 모델 정비)',
            '신규 모듈 2종 출시 및 기존 고객 업셀 캠페인',
            '연간 성과 리뷰 및 차년도 전략 수립'
          ]
        }
      ],

      specializedAnalysis: _fakeSpecialized(d),

      sixSystems: [
        {
          name: '1. 리더십 시스템',
          icon: '👑',
          status: '취약',
          issue: `${co}의 대표가 일상 운영과 전략 수립을 동시에 맡고 있어 의사결정이 지연되고 있습니다. 명확한 역할 분장 없이 모든 결정이 대표 한 사람에게 집중되어 있어, 팀원들은 사소한 일도 지시를 기다립니다. 이로 인해 대표는 정작 중요한 사업 방향 결정에 집중하기 어려운 상태입니다.`,
          actions: [
            `[이번 주] 반복 결정 사항 10가지를 목록화하여 팀원에게 권한 위임 — 예: 재료 구매 기준금액 이하 자율 결정`,
            `[이번 달] 주간 회의 30분 루틴 만들기 — 지난 주 성과·이번 주 목표·장애물 3가지만 공유`,
            `[3개월 내] 핵심 업무 매뉴얼 5가지 작성 — 누가 맡아도 같은 품질이 나오는 운영 기준서`
          ],
          resource: '중소기업 경영 컨설팅 바우처 (중소벤처기업부), 소상공인시장진흥공단 경영개선 컨설팅'
        },
        {
          name: '2. 마케팅 시스템',
          icon: '📣',
          status: '취약',
          issue: `현재 ${co}의 신규 고객 유입이 입소문(지인 추천)에만 의존하고 있어 매출이 불안정합니다. ${ind} 업종에서 타겟 고객이 실제로 정보를 탐색하는 온라인 채널(네이버 검색, 인스타그램 등)에 대한 존재감이 없습니다. 잠재 고객에게 왜 우리를 선택해야 하는지 명확한 메시지를 전달하는 접점이 부족합니다.`,
          actions: [
            `[이번 주] 네이버 스마트플레이스·구글 비즈니스 프로필 등록 완료 — 위치·운영시간·대표 사진 3장 이상 업로드`,
            `[이번 달] "${cs}" 핵심 메시지를 담은 SNS 프로필 정비 + 고객 후기 5개 수집하여 게시`,
            `[3개월 내] 월 4회 이상 콘텐츠 발행 루틴 확립 — 작업 과정·전후 사진·고객 후기 중심`
          ],
          resource: '소상공인 온라인 마케팅 지원사업 (소진공), 네이버 스마트스토어 무료 개설'
        },
        {
          name: '3. 판매 시스템',
          icon: '💰',
          status: '보통',
          issue: `${co}의 잠재 고객이 문의를 해도 성사율이 낮거나, 성사까지 시간이 오래 걸립니다. 견적·상담 과정이 표준화되어 있지 않아 어떤 날은 3일 만에 계약하고 어떤 날은 2주가 걸리는 들쑥날쑥한 상황입니다. 재구매·재방문을 유도하는 체계적인 후속 연락 프로세스도 없습니다.`,
          actions: [
            `[이번 주] 문의 응대 → 견적 → 계약 3단계 스크립트 작성 — 자주 받는 질문 5가지에 대한 표준 답변 준비`,
            `[이번 달] 기존 고객 DB(연락처) 정리 + 재방문·재구매 안내 문자 발송`,
            `[3개월 내] 구매 결정을 앞당기는 한정 혜택 설계 — 예: 이번 달 계약 시 ○○ 서비스 무상 제공`
          ],
          resource: '카카오 채널 무료 개설 (문의 자동응답), 네이버 예약 시스템 활용'
        },
        {
          name: '4. 제품·서비스 시스템',
          icon: '🛠️',
          status: '강점',
          issue: `${co}의 핵심 강점인 "${cs}"은 분명히 존재하지만, 이를 고객이 직접 체감할 수 있는 형태로 보여주는 과정이 부족합니다. 서비스 품질이 담당자·날짜에 따라 조금씩 달라지는 문제가 있으며, 고객이 기대하는 것과 실제 제공되는 것 사이의 간극을 줄이는 작업이 필요합니다.`,
          actions: [
            `[이번 주] 가장 반응 좋은 서비스·제품 1가지를 골라 '핵심 상품'으로 명명하고 강점 3줄 정리`,
            `[이번 달] 서비스 제공 체크리스트 작성 — 매번 동일한 품질이 나오는 기준 만들기`,
            `[3개월 내] 고객 만족도 조사 루틴 (서비스 완료 후 1주일 뒤 문자 1통) 시작 + 피드백 반영`
          ],
          resource: '소상공인 서비스 품질 인증제, 업종별 협회 품질 교육 프로그램'
        },
        {
          name: '5. 운영 시스템',
          icon: '⚙️',
          status: '취약',
          issue: `매일 반복되는 업무(재고 확인, 일정 관리, 정산 등)가 대부분 대표의 머릿속에만 있어 기록과 추적이 되지 않습니다. 직원이 한 명이라도 빠지면 운영이 흔들리는 취약한 구조이며, 어디서 시간과 비용이 새고 있는지 파악하기 어렵습니다.`,
          actions: [
            `[이번 주] 하루 업무 흐름을 30분 단위로 적어 시간 낭비 구간 파악 — 줄일 수 있는 반복 업무 3가지 발견`,
            `[이번 달] 무료 일정·재고 관리 앱 1가지 도입 — 네이버 스마트 주문, 구글 스프레드시트 활용`,
            `[3개월 내] 주간 운영 체크리스트 완성 — 매주 10분으로 핵심 현황 파악 가능하게`
          ],
          resource: '소상공인 스마트상점 기술보급사업 (소진공), 클라우드 POS 무료 체험'
        },
        {
          name: '6. 재무 시스템',
          icon: '📊',
          status: '취약',
          issue: `${co}의 매출은 발생하고 있지만 정확한 이익 구조를 파악하고 있지 못합니다. 어떤 서비스·제품이 실제로 남는 장사인지, 어떤 비용이 불필요하게 나가는지 데이터가 없습니다. 세금 신고 시기에만 재무를 확인하는 수동적 구조로, 현금 부족 상황이 닥치기 전까지 인식하지 못하는 리스크가 있습니다.`,
          actions: [
            `[이번 주] 지난 달 수입·지출 내역 합산 — 월 실수익 파악 (엑셀 or 메모장 어디든 시작)`,
            `[이번 달] 서비스·제품별 원가 계산 — 인건비·재료비 포함 실제 마진율 계산`,
            `[3개월 내] 간편 장부 앱 도입 (국세청 홈텍스 간편 장부) + 월 1회 재무 현황 점검 루틴`
          ],
          resource: '국세청 간편장부 무료 교육, 소상공인 전용 세무 컨설팅 (소진공 연계)'
        }
      ],

      plan90days: (() => {
        const isMicro = d.bizScale === 'micro';
        return [
          {
            month: '1개월차',
            theme: `기반 다지기 — ${isMicro ? '가장 급한 취약점 즉각 해결' : '성장 기반 구축'}`,
            goal: `${isMicro ? '고객이 나를 찾을 수 있는 온라인 존재감 구축 완료 + 핵심 서비스 1가지 정의' : `KPI 대시보드 구축 및 ${ind} 특화 마케팅 콘텐츠 3편 발행`}`,
            actions: [
              `네이버 스마트플레이스·구글 비즈니스 등록 완료 + "${cs}" 중심 프로필 문구 업데이트`,
              `기존 고객 5명에게 연락 — 솔직한 피드백 수집 + 후기 게시 동의 요청`,
              isMicro
                ? '월 수입·지출 정리표 작성 — 실제 남는 금액 처음으로 파악'
                : `${comp || '경쟁사'} 가격·채널·고객 반응 분석 + 차별화 포인트 1가지 공략 개시`
            ],
            expectedResult: isMicro
              ? '온라인 검색 시 가게 정보 노출 시작, 기존 고객 재방문 1~2건 유도'
              : '월 유입 리드 20% 증가, 내부 KPI 추적 체계 완성',
            govSupport: '소상공인 경영개선 컨설팅 (소진공, 무료 10시간)'
          },
          {
            month: '2개월차',
            theme: '실행·검증 — 고객 반응 확인 및 매출 연결',
            goal: isMicro
              ? '신규 고객 3명 이상 SNS or 온라인 경로로 유입 + 재구매 고객 비율 파악'
              : `파트너 채널 2개사 계약 체결 + ${ind} 업종 성공 사례 케이스스터디 2편 발행`,
            actions: [
              isMicro
                ? '인스타그램·블로그 콘텐츠 주 1회 발행 루틴 시작 — 작업 과정·결과물 위주'
                : '마케팅 자동화 툴 도입 (이메일 시퀀스, 리드 육성 캠페인 설계)',
              '1개월차 행동 결과 점검 — 무엇이 반응 있었는지, 없었는지 기록',
              isMicro
                ? '서비스 완료 후 고객에게 후기 요청 문자 발송 루틴 시작'
                : '연간 계약 전환 제안 캠페인 실시 — 현금흐름 안정화'
            ],
            expectedResult: isMicro
              ? 'SNS 팔로워 50명 이상 + 온라인 문의 월 3건 이상 달성'
              : '간접 채널 매출 비중 15% 달성, 월 반복 매출(MRR) 20% 증가',
            govSupport: isMicro
              ? '소상공인 온라인 판로 지원사업 (소진공, 스마트스토어 연계)'
              : '중소기업 마케팅 바우처 (중진공, 최대 100만원)'
          },
          {
            month: '3개월차',
            theme: '성장·반복 — 성공 패턴 고정화',
            goal: isMicro
              ? `3개월 전 대비 월 매출 20% 이상 증가 + 운영·재무 시스템 2개 이상 안정화`
              : `SOM(접근 목표 시장) 점유율 목표치 달성 착수 + ${tl} 로드맵 중간 점검 완료`,
            actions: [
              isMicro
                ? '잘 작동한 것 3가지 목록화 → 이걸 다음 3개월도 계속할 수 있는 루틴으로 고정'
                : `AI·디지털 도구 도입으로 반복 업무 자동화 — 주간 운영 시간 20% 절감`,
              isMicro
                ? '잘 팔리는 서비스 1가지에 집중 → 해당 서비스 강화에 시간·비용 재투자'
                : '투자 유치 또는 정책자금 신청 준비 — IR 자료 초안 작성',
              isMicro
                ? '다음 분기 목표 1가지 설정 + 필요한 지원사업 신청 계획'
                : `${ind} 업종 협회·단체 제휴 1건 이상 성사 — 레퍼런스 확대`
            ],
            expectedResult: isMicro
              ? '매출·고객 수·운영 효율 3가지 지표 모두 3개월 전보다 개선됨을 수치로 확인'
              : `MRR 목표의 50% 달성 + 연간 계약 고객 비율 40% 이상 확보`,
            govSupport: isMicro
              ? '소상공인 성장지원패키지 (소진공, 맞춤형 컨설팅 + 마케팅 지원)'
              : '중소기업 R&D 지원사업 또는 수출 바우처 (업종별 해당 시)'
          }
        ];
      })()
    };
  }

  return { callClaude, fakeAnalysis, calcDiagScores };
})();
