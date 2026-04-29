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
    if (!diagScores || Object.keys(diagScores).length === 0) return '진단 미실시';

    let summary = '';
    const weakItems  = [];
    const strongItems = [];
    const memoItems  = [];

    // 개별 항목 레벨로 출력 — 질문 텍스트를 DOM에서 추출하거나 키 기반 라벨 사용
    const tabLabels = {
      'diag-common':   '기본 경영 진단',
      'diag-industry': '업종 특화 진단',
      'diag-bizmodel': '사업모델 진단',
    };

    const byTab = {};
    Object.keys(diagScores).forEach(key => {
      const entry = diagScores[key];
      if (!entry || (!entry.score && !entry.memo)) return;

      let tabKey = 'diag-common';
      if (key.includes('diag-industry')) tabKey = 'diag-industry';
      else if (key.includes('diag-bizmodel')) tabKey = 'diag-bizmodel';

      if (!byTab[tabKey]) byTab[tabKey] = [];

      // 질문 텍스트를 DOM에서 찾기 (브라우저 환경)
      let qText = '';
      if (typeof document !== 'undefined') {
        const container = document.querySelector(`[data-score-key="${key}"]`);
        if (container) {
          const qEl = container.closest('.diag-item')?.querySelector('.diag-item-text, .diag-q-label, h4, p');
          if (qEl) qText = qEl.textContent.trim().substring(0, 80);
        }
        if (!qText) {
          // 컨테이너 라벨 대체
          const parts = key.split('_');
          qText = `진단항목 ${parts[parts.length - 2]}-${parts[parts.length - 1]}`;
        }
      }

      byTab[tabKey].push({ key, score: entry.score || 0, memo: entry.memo || '', qText });
    });

    Object.keys(byTab).forEach(tabKey => {
      const items = byTab[tabKey];
      if (items.length === 0) return;
      const avg = (items.reduce((s, i) => s + i.score, 0) / items.length).toFixed(1);
      summary += `\n[${tabLabels[tabKey] || tabKey}] 종합 ${avg}점 ${getScoreLabel(parseFloat(avg))}\n`;

      items.forEach(item => {
        if (item.score > 0) {
          const line = `  · ${item.qText} → ${item.score}점 ${getScoreLabel(item.score)}`;
          summary += line + '\n';
          if (item.score <= 2) weakItems.push(`"${item.qText}" (${item.score}점)`);
          if (item.score >= 4) strongItems.push(`"${item.qText}" (${item.score}점)`);
        }
        if (item.memo) {
          summary += `    ※ 현장 메모: "${item.memo}"\n`;
          memoItems.push({ q: item.qText, memo: item.memo });
        }
      });
    });

    if (weakItems.length > 0) {
      summary += `\n⚠️ 즉각 개선 필요 (2점 이하) — 전략의 최우선 처방 대상:\n`;
      weakItems.forEach(a => summary += `  · ${a}\n`);
    }
    if (strongItems.length > 0) {
      summary += `\n💪 핵심 강점 (4점 이상) — 마케팅·영업에 적극 활용:\n`;
      strongItems.forEach(a => summary += `  · ${a}\n`);
    }
    if (memoItems.length > 0) {
      summary += `\n📝 경영자 현장 메모 (전략에 반드시 반영할 것):\n`;
      memoItems.forEach(m => summary += `  · [${m.q}] "${m.memo}"\n`);
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

  /* ── 2차 호출 전용 시스템 프롬프트 (실행플랜: KPI·로드맵·6시스템·90일플랜·린캔버스) ── */
  const _SYSTEM_EXEC = `[절대 규칙]
- 응답은 반드시 순수 JSON만 출력한다. 코드블록(\`\`\`) 사용 금지.
- 첫 글자는 반드시 { 이어야 한다.
- JSON 외 설명 텍스트 절대 금지.
- JSON이 완성되지 않으면 각 항목 내용을 줄여서라도 반드시 완성할 것.

당신은 맥킨지·BCG 출신 20년 경력의 경영전략 실행 컨설턴트입니다.
1차 분석(진단·전략)에서 도출된 핵심전략을 바탕으로, 구체적 실행 계획(KPI·로드맵·6시스템·90일플랜)과 비즈니스 모델 캔버스(린캔버스)를 작성합니다.

[언어 원칙]
- 중소기업 대표가 바로 이해할 수 있는 쉬운 한국어.
- 영어 약어 사용 시 괄호 안에 한국어 설명.
- 일반론 절대 금지. 입력된 기업명·업종·수치 직접 언급.

[실행플랜 작성 원칙]
① KPI: OKR 형태(구체 수치+기간+측정방법+담당자), 1차 핵심전략과 직접 연결
② 로드맵: 린 스타트업(1단계 MVP) → 플라이휠 가속(2단계) → 6시스템 완성(3단계)
③ 6시스템: 각 시스템 현재 문제를 입력 기업 실제 상황으로 구체 서술 (일반론 금지)
④ 90일플랜: 이번 주 당장 실행 가능한 액션 중심, 각 달 정부지원사업 1개 포함
⑤ leanCanvas: 1차 전략과 일관된 비즈니스 모델 캔버스

반드시 다음 JSON 구조로만 응답 (kpi, roadmap, sixSystems, plan90days, leanCanvas 5개만):
{
  "kpi": [
    {"metric": "지표명 (OKR 핵심결과 형태)", "current": "현재 수치 (추정 포함)", "target": "목표 수치 (현실적)", "timeline": "X개월 (Q1/Q2 분기 마일스톤)", "progress": 20, "method": "측정 도구·방법 구체 명시", "owner": "실제 담당자/팀"},
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

  "roadmap": [
    {
      "phase": "1단계: MVP 검증·기반 구축",
      "period": "1~3개월",
      "budget": "예상 예산 (구체 금액 또는 범위)",
      "framework": "🔬 린 스타트업 — Build(구축) → Measure(측정) → Learn(학습)",
      "tasks": [
        "린 스타트업 MVP: [가장 빠르게 검증할 핵심 가설과 실행 방법]",
        "6시스템 취약 보완: [진단 최저점 시스템 즉각 개선 액션]",
        "정부지원사업 신청: [매칭 지원사업명 + 신청 기한]",
        "경쟁사 약점 공략: [즉시 실행 가능한 차별화]",
        "OKR 설정: [팀 전체 Q1 목표와 핵심결과 수립]",
        "플라이휠 1번 바퀴: [초기 성공 사례 1개 만들기 구체 방법]"
      ]
    },
    {
      "phase": "2단계: 성장 가속·채널 확장",
      "period": "4~8개월",
      "budget": "예상 예산",
      "framework": "🌀 플라이휠 가속 — 1단계 성공을 레버리지로 성장 구조 구축",
      "tasks": [
        "StoryBrand 마케팅: [핵심 메시지 기반 마케팅 캠페인 실행]",
        "SAM 점유 확대: [SOM 목표 달성 영업·마케팅 전략]",
        "블루오션 시장 파일럿: [ERRC로 발굴한 새 시장 진입]",
        "파트너십·채널 구축: [핵심 파트너 확보 계획]",
        "6시스템 마케팅·판매 고도화: [2단계 시스템 강화]",
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
        "차별화 방어막: [경쟁사 모방 불가 진입장벽 구축]",
        "글로벌·확장 준비: [다음 성장 단계 구체 방향]",
        "플라이휠 완성: [자생적 성장 구조 완성]"
      ]
    }
  ],

  "sixSystems": [
    {
      "name": "1. 리더십 시스템",
      "icon": "👑",
      "status": "취약|보통|강점 중 하나",
      "issue": "현재 리더십·의사결정에서 가장 큰 문제 2~3문장 구체 서술. 대표가 어떤 결정을 못 하고, 팀이 어떤 혼선을 겪는지 입력값 기반.",
      "actions": ["이번 주 즉시 실행 (도구·방법 포함)", "이번 달 실행 액션", "3개월 내 완성 액션"],
      "resource": "관련 도구·교육·지원사업 추천"
    },
    {
      "name": "2. 마케팅 시스템",
      "icon": "📣",
      "status": "취약|보통|강점",
      "issue": "고객이 우리를 어떻게 알게 되는지 현재 문제 2~3문장 구체 서술",
      "actions": ["즉시 실행 액션 1", "액션 2", "액션 3"],
      "resource": "추천 도구·자료"
    },
    {
      "name": "3. 판매 시스템",
      "icon": "💰",
      "status": "취약|보통|강점",
      "issue": "잠재 고객이 실제 구매로 이어지는 과정 어디서 막히는지 2~3문장 구체 서술",
      "actions": ["즉시 실행 액션 1", "액션 2", "액션 3"],
      "resource": "추천 도구·자료"
    },
    {
      "name": "4. 제품·서비스 시스템",
      "icon": "🛠️",
      "status": "취약|보통|강점",
      "issue": "제품·서비스 품질·일관성·개선 체계 현황과 문제점 2~3문장 구체 서술",
      "actions": ["즉시 실행 액션 1", "액션 2", "액션 3"],
      "resource": "추천 도구·자료"
    },
    {
      "name": "5. 운영 시스템",
      "icon": "⚙️",
      "status": "취약|보통|강점",
      "issue": "일상 운영 반복 비효율·낭비·병목 2~3문장 구체 서술",
      "actions": ["즉시 실행 액션 1", "액션 2", "액션 3"],
      "resource": "추천 도구·자료"
    },
    {
      "name": "6. 재무 시스템",
      "icon": "📊",
      "status": "취약|보통|강점",
      "issue": "현금흐름·손익 파악·비용 관리 현황과 위험 요소 2~3문장 구체 서술",
      "actions": ["즉시 실행 액션 1", "액션 2", "액션 3"],
      "resource": "추천 도구·자료"
    }
  ],

  "plan90days": [
    {
      "month": "1개월차",
      "theme": "기반 다지기 — 가장 급한 취약점 즉시 해결",
      "goal": "이 달 말까지 달성할 구체적이고 측정 가능한 목표 1가지",
      "actions": ["이번 주 당장 실행 (도구·방법 포함)", "2주차 실행", "3~4주차 실행"],
      "expectedResult": "행동 완료 시 무엇이 달라지는지 (수치 포함)",
      "govSupport": "이 시기 신청 가능한 정부지원사업 1가지 (사업명 + 신청 기관)"
    },
    {
      "month": "2개월차",
      "theme": "실행·검증 — 고객 반응 확인 및 매출 연결",
      "goal": "2개월차 구체 목표",
      "actions": ["액션 1", "액션 2", "액션 3"],
      "expectedResult": "기대 효과",
      "govSupport": "관련 지원사업"
    },
    {
      "month": "3개월차",
      "theme": "성장·반복 — 성공 패턴 고정화",
      "goal": "3개월차 구체 목표",
      "actions": ["액션 1", "액션 2", "액션 3"],
      "expectedResult": "기대 효과",
      "govSupport": "관련 지원사업"
    }
  ],

  "leanCanvas": {
    "problem": "고객 핵심 문제 2~3가지 (customerProblem 입력값 반드시 반영)",
    "customerSegments": "타겟 고객 세그먼트 (규모·업종·지역·구매 특성 명시)",
    "uniqueValueProposition": "단 1문장 핵심 가치 제안 — [고객이 원하는 것]을 [우리만의 방법]으로 해결",
    "solution": "3대 핵심 해결책 — 각각 어떤 문제를 어떻게 해결하는지",
    "channels": "주력 고객 획득·전달 채널 (온라인·오프라인·파트너 비중 % 포함)",
    "revenueStreams": "수익 흐름 구조 (주수익·부수익 구분, 가격 정책 포함)",
    "costStructure": "주요 비용 항목과 비중 (인건비·마케팅·운영비 등)",
    "keyMetrics": "비즈니스 건강 지표 3가지 — 현재값·목표값·측정 주기",
    "unfairAdvantage": "모방 불가 경쟁 우위 (unfairAdvantage 입력값 반드시 반영)"
  }
}`;

  function _ctGuidance(ct) {
    const G = {
      digital_strategy: `
[★ 핵심 지침 — 디지털전환전략이 보고서 전체의 척추입니다 ★]
이 기업의 진단 결과 분류된 컨설팅 유형은 "디지털전환전략"입니다.
specializedAnalysis 한 섹션에만 반영하는 것은 실패입니다. 보고서 전체(SWOT·STP·4P·핵심전략·KPI·로드맵·6시스템·90일플랜)가 "현재 아날로그 운영 → 디지털 전환"이라는 하나의 관점으로 일관되어야 합니다.

섹션별 필수 반영 지침:
• SWOT 약점: 디지털화 지연으로 인한 경쟁 열위, 비효율적 수작업 프로세스 반드시 포함
• SWOT 기회: 디지털 도구 도입 시 얻을 수 있는 비용 절감·리드 증가·데이터 자산 기회 구체 수치로 제시
• keyStrategies: 1~3순위 전략 모두 디지털 전환 관련 (CRM 도입, 마케팅 자동화, 업무 프로세스 디지털화, 데이터 대시보드 등)
• KPI: 디지털 전환 진척도 지표 반드시 포함 (온라인 리드 수, CRM 데이터 적재 건수, 자동화율, 온라인 매출 비중)
• 6시스템: 각 시스템(리더십·마케팅·판매·제품·운영·재무)이 현재 아날로그 방식에서 어떻게 디지털로 전환되어야 하는지 구체 도구명·비용·기간 포함
• 90일플랜: 1개월=핵심 디지털 도구 2종 도입, 2개월=자동화·온라인 채널 활성화, 3개월=데이터 기반 의사결정 체계 확립
`,
      finance_strategy: `
[★ 핵심 지침 — 경영재무전략이 보고서 전체의 척추입니다 ★]
이 기업의 진단 결과 "경영재무전략"이 최우선 과제입니다.
• SWOT 약점: 현금흐름·수익성·자금조달 취약점 최상단 배치
• keyStrategies: 1~2순위 전략 = BEP 달성·현금흐름 개선·수익성 향상
• KPI: 매출총이익률·영업이익률·현금전환주기·BEP 달성률 중심
• 6시스템 재무 시스템: 가장 상세하고 즉각적인 처방
• 90일플랜: 1개월=재무현황 정확히 파악, 2개월=고정비 절감·매출채권 회수, 3개월=수익성 구조 개선
`,
      growth_strategy: `
[★ 핵심 지침 — 사업화·성장전략이 보고서 전체의 척추입니다 ★]
이 기업의 진단 결과 "사업화·성장전략"이 최우선 과제입니다.
• keyStrategies: 신규 고객 획득·채널 확장·시장 점유율 확대 전략이 1~3순위
• KPI: 신규 고객 수·MRR 성장률·시장 점유율·파트너 수 중심
• 6시스템 마케팅·판매 시스템: 가장 상세하고 즉각적인 처방
• 90일플랜: 1개월=핵심 성장 채널 검증, 2개월=성공 채널 집중·확대, 3개월=신규 채널 추가·반복 매출 구조 확립
`,
      differentiation_strategy: `
[★ 핵심 지침 — 차별화·경쟁우위전략이 보고서 전체의 척추입니다 ★]
이 기업의 진단 결과 "차별화·경쟁우위전략"이 최우선 과제입니다.
• SWOT 강점: 경쟁사가 절대 모방할 수 없는 차별점 1~2개 발굴·구체화
• keyStrategies: VRIO 분석 기반 차별화 방어막 구축 전략이 1~3순위
• KPI: 브랜드 인지도·NPS·재구매율·프리미엄 가격 유지율 중심
• 6시스템 제품·서비스 시스템: 차별화 역량 강화 처방을 가장 상세하게
• 90일플랜: 1개월=차별점 명문화+데이터화, 2개월=IP·인증·독점파트너 확보, 3개월=브랜드 자산 구축
`,
      hr_strategy: `
[★ 핵심 지침 — 조직·인력운영전략이 보고서 전체의 척추입니다 ★]
• keyStrategies 1~3순위: 핵심 인력 채용·온보딩 체계화·성과 관리 시스템 수립
• 6시스템 리더십·운영 시스템: 가장 상세한 처방
• 90일플랜: 1개월=인력 현황 파악+R&R 문서화, 2개월=채용·교육 시스템, 3개월=성과 연동 평가 체계
`,
      marketing_strategy: `
[★ 핵심 지침 — 마케팅·브랜드전략이 보고서 전체의 척추입니다 ★]
• keyStrategies 1~3순위: 콘텐츠 마케팅·채널별 광고 최적화·리퍼럴 프로그램
• 6시스템 마케팅 시스템: 가장 상세한 처방 (채널별 예산 배분·KPI 포함)
• 90일플랜: 1개월=브랜드 아이덴티티 정립, 2개월=콘텐츠·광고 실행, 3개월=측정·최적화
`,
    };
    return G[ct] || (ct ? `
[★ 핵심 지침 — "${ct}" 유형이 보고서 전체의 척추입니다 ★]
진단 결과 분류된 컨설팅 유형의 핵심 처방 방향이 SWOT·keyStrategies·KPI·6시스템·90일플랜 전체에 일관되게 반영되어야 합니다.
해당 유형의 핵심 과제 해결에 집중하지 않으면 보고서 실패입니다.
` : '');
  }

  /* ================================================================
     buildCausalChain — Chain of Consulting 인과관계 심층 진단
     "비즈니스 모델의 수익 엔진이 업종 특수성과 어떻게 충돌하는가"
     ================================================================ */
  function buildCausalChain(d, domainScores) {
    if (!domainScores || !Object.keys(domainScores).length) return '';

    const ind = (d.industryKey || d.industry || '').toLowerCase();
    const bm  = (d.bizModelKey || d.bizModel  || '').toLowerCase();
    const co  = d.companyName || '귀사';

    const fin = domainScores.finance?.avg         || 0;
    const hr  = domainScores.hr?.avg              || 0;
    const bmS = domainScores.bm?.avg              || 0;
    const fut = domainScores.future?.avg          || 0;
    const dif = domainScores.differentiation?.avg || 0;

    const isLow  = v => v > 0 && v < 2.5;
    const isHigh = v => v >= 3.8;
    const fmt    = v => v > 0 ? v.toFixed(1) + '점' : '미진단';

    const risks = [];

    /* ── 업종 × BM 구조적 충돌 패턴 ─────────────────────────── */

    // 건설·인테리어 × 도급 계약 구조
    if (/건설|인테리어|부동산|construction/.test(ind)) {
      if (isLow(fin) && isLow(bmS)) {
        risks.push(`[구조적 위기 — 원가 붕괴 × 수주 경쟁력 상실]
건설·도급 모델의 수익 엔진은 '정확한 원가 산출 → 경쟁력 있는 견적 → 수주 → 실행 마진 확보'의 연쇄입니다.
${co}는 재무건전성(${fmt(fin)})과 고객·매출 역량(${fmt(bmS)}) 모두 취약합니다.
→ 원가 구조를 모르니 저가 견적을 써야만 수주되고, 낮은 가격에 수주하면 실행에서 적자가 납니다.
→ 적자 현장이 반복되면 현금이 고갈되고, 현금이 없으면 다음 공사 원가를 더 낮춰야 하는 악순환입니다.
이것은 단순한 '두 가지 약점'이 아닙니다 — '비즈니스 모델이 업종 원가 구조와 충돌하는 구조적 생존 위기'입니다.`);
      }
      if (isLow(hr)) {
        risks.push(`[실행 위험 — 숙련 인력 부재 × 하자 리스크 연쇄]
건설업에서 조직·인력(${fmt(hr)}) 취약은 단순 HR 문제가 아닙니다.
→ 숙련 인력 없음 → 시공 불량 발생 → 하자 보수 비용이 계획 마진을 잠식
→ 하자 클레임이 쌓이면 평판 손상 → 재입찰 기회 차단 → 신규 수주 불가
건설업에서 하자 한 건이 수개월치 이익을 지웁니다. 인력 리스크는 재무 리스크와 직결됩니다.`);
      }
    }

    // IT·소프트웨어 × SaaS·구독 모델
    if (/it|소프트웨어|테크|개발|knowledge_it/.test(ind)) {
      if (/saas|구독|b2b_saas|b2c_sub/.test(bm)) {
        if (isLow(bmS)) {
          risks.push(`[구조적 위기 — SaaS 수익 엔진 × 고객 유지 실패]
구독 모델의 수익 엔진은 'ARR(연간 반복 매출) 누적'입니다. ARR은 이탈률이 낮아야만 쌓입니다.
${co}의 고객·매출 역량(${fmt(bmS)}) 취약은 이탈률 관리가 안 된다는 구조적 신호입니다.
→ 신규 고객을 아무리 확보해도 기존 고객이 빠지면 ARR은 제자리입니다.
→ 이탈률이 5%→10%로 2배가 되면, 같은 성장률 유지에 마케팅 비용 4배가 필요합니다.
SaaS에서 고객 유지 실패는 '작동 안 되는 수익 모델'과 동의어입니다.`);
        }
        if (isLow(dif)) {
          risks.push(`[시장 위험 — SaaS × 차별화 부재 → 가격 경쟁 소용돌이]
SaaS는 고객의 전환 비용이 낮습니다. 클릭 몇 번으로 경쟁사로 이동할 수 있습니다.
차별화(${fmt(dif)}) 취약 상태에서 SaaS 운영 시 → 가격 경쟁 소용돌이에 빨려 들어갑니다.
→ 경쟁사가 가격을 낮추면 따라 낮춰야 하고 → 마진이 줄면 제품 투자가 줄고 → 차별화는 더 어려워집니다.
이 루프를 끊으려면 '다른 차원의 가치(전환 비용 높이기·네트워크 효과·독점 데이터)'를 만들어야 합니다.`);
        }
      }
      if (isLow(hr) && isLow(bmS)) {
        risks.push(`[실행 위기 — 지식서비스 × 인력·수주 동시 취약]
지식서비스업의 수익은 '인당 생산성 × 수주량'으로 결정됩니다.
${co}는 조직·인력(${fmt(hr)})과 고객·매출(${fmt(bmS)}) 모두 취약합니다.
→ 역량 낮은 인력으로 수주를 받으면 납기·품질 문제 → 재계약 실패
→ 수주 파이프라인도 약하면 빈 달이 생기고 → 인력 유지 비용이 현금을 잠식
인력과 수주는 서로를 증명해주는 선순환 구조인데, 둘 다 취약하면 시작점 자체가 없습니다.`);
      }
    }

    // 외식·음식점 × 단가·회전 구조
    if (/외식|음식|식당|카페|restaurant/.test(ind)) {
      if (isLow(fin) && isLow(fut)) {
        risks.push(`[구조적 위기 — 외식 박마진 구조 × 운영 역량 취약]
외식업 수익 공식: 매출 - 식재료비(30%) - 인건비(30%) - 임대료(10~15%) = 영업이익(10~15%)
이 구조에서 재무건전성(${fmt(fin)})과 업종 역량(${fmt(fut)}) 모두 취약하면:
→ 원가율 관리 실패 → 마진이 업종 평균(10~15%) 이하 → 임대료·인건비는 고정 → 현금 압박 가속
→ 업종 핵심역량(조리 품질·위생·회전율) 취약 → 고객 경험 저하 → 재방문율 하락 → 매출 감소
외식업은 마진이 얇아 두 가지가 동시에 무너지면 버티는 기간이 매우 짧습니다.`);
      }
      if (isLow(dif)) {
        risks.push(`[시장 위험 — 외식 × 차별화 부재 → 가격만 남음]
외식업에서 차별화(${fmt(dif)})가 없다는 것은 '가격'이 고객 선택의 유일한 이유라는 뜻입니다.
→ 가격 경쟁은 근처에 경쟁 식당 하나만 생겨도 즉시 시작됩니다.
→ 배달 플랫폼에서는 수백 개의 선택지와 동시에 경쟁합니다.
"특별한 이유 없이 오는 고객"은 더 싼 곳이 생기는 순간 바로 떠납니다.`);
      }
    }

    // 제조업 × OEM·납품 구조
    if (/제조|부품|가공|mfg/.test(ind)) {
      if (isLow(fin) && isLow(fut)) {
        risks.push(`[구조적 위기 — 제조 원가 미파악 × 생산 역량 취약]
제조·OEM 모델의 수익은 '납품 단가 - 생산 원가'의 차이입니다.
${co}의 재무건전성(${fmt(fin)})과 업종 역량(${fmt(fut)}) 모두 취약합니다.
→ 원가 관리 실패: 원자재·불량 손실 미파악 → 어떤 수주에서도 실제 마진을 모름
→ 생산 역량 취약: 납기 지연·불량률 증가 → 거래처 이탈·페널티 리스크
발주사는 지속적으로 단가 인하를 요구합니다. 원가도 모르고 역량도 약하면 버틸 수단이 없습니다.`);
      }
      if (isLow(hr)) {
        risks.push(`[실행 위험 — 제조 × 숙련 인력 이탈 연쇄]
제조 현장의 핵심 자산은 숙련 기술자입니다. 조직·인력(${fmt(hr)}) 취약은:
→ 숙련자 이탈 → 불량률 증가 → 거래처 클레임 → 납품 단가 협상력 상실
→ 신규 인력 채용 후 숙련도 회복까지 3~6개월 생산성 공백이 발생합니다.
제조업에서 인력 리스크는 설비 고장보다 회복 시간이 훨씬 깁니다.`);
      }
    }

    // 의료·교육·생활서비스 × 방문 단가 모델
    if (/의료|헬스|병원|medical|교육|학원|education|생활|local_service/.test(ind)) {
      if (isLow(bmS)) {
        risks.push(`[수익 구조 위기 — 방문 단가 모델 × 재방문율 붕괴]
방문·단가 서비스업의 수익 엔진: '고객 단가 × 재방문 빈도 × 유지 기간'
고객·매출 역량(${fmt(bmS)}) 취약은 재방문·재등록 관리가 안 된다는 신호입니다.
→ 신규 고객 유치 비용은 재방문 고객 유지 비용의 5~7배입니다.
→ 재방문율 하락 → 신규 고객을 계속 채워야 → 마케팅 비용이 매출 증가를 잠식합니다.
이 모델에서 재방문 실패는 '뒤가 뚫린 바구니에 물 붓기'와 같습니다.`);
      }
    }

    // 물류·운송 × 종량제 고정비 구조
    if (/물류|운송|logistics/.test(ind)) {
      if (isLow(fin) && isLow(fut)) {
        risks.push(`[구조적 위기 — 물류 고정비 구조 × 운영 효율 취약]
물류·운송 수익 공식: 운임 수입 - (연료비+인건비+차량감가) = 마진
고정비(연료·차량)는 적재량과 무관하게 발생합니다.
재무건전성(${fmt(fin)})과 업종 역량(${fmt(fut)}) 취약 시:
→ 공차율(빈 차 운행) 관리 실패 → 운행 비용 대비 수입 급감
→ 연료비·정비비 원가 파악 미흡 → 적정 운임 산출 불가 → 저가 수주 반복
물류업에서 원가 관리와 운영 최적화는 같은 문제의 두 면입니다.`);
      }
    }

    // 패션·뷰티 × D2C 직접 판매
    if (/패션|뷰티|패션|fashion/.test(ind)) {
      if (isLow(bmS) && isLow(dif)) {
        risks.push(`[이중 위기 — D2C 모델 × 고객 획득·차별화 동시 취약]
D2C 모델은 플랫폼 수수료 없이 마진을 확보하는 구조지만, 그 대가로 고객 획득을 스스로 해야 합니다.
${co}의 고객·매출(${fmt(bmS)})과 차별화(${fmt(dif)}) 모두 취약합니다.
→ 차별화 없으면 왜 우리 브랜드를 선택해야 하는지 설명이 안 됩니다.
→ 고객 획득 역량 없으면 SNS 광고 CAC(고객 획득 비용)가 폭등합니다.
→ 패션은 시즌성 재고 리스크까지 있어 — 팔지 못한 재고가 현금을 잠급니다.`);
      }
    }

    /* ── 범용 교차 패턴 (업종 무관 — 위에서 미탐지 시) ───────── */

    if (isLow(fin) && isLow(bmS) && !risks.length) {
      risks.push(`[이중 출혈 위기 — 수익 창출 × 비용 관리 동시 붕괴]
${co}는 고객·매출(${fmt(bmS)})과 재무건전성(${fmt(fin)}) 모두 취약합니다.
→ 매출이 안 나오면서 비용 관리도 안 됩니다.
→ 이 두 가지가 동시에 무너지면 매출 감소와 비용 증가가 동시에 진행됩니다.
다른 모든 전략보다 이 두 가지를 가장 먼저 안정화해야 합니다.`);
    }

    if (isLow(dif) && isLow(bmS) && risks.length === 0) {
      risks.push(`[시장 퇴출 위험 — 선택받을 이유 × 판매 역량 동시 부재]
차별화(${fmt(dif)})와 고객·매출(${fmt(bmS)}) 모두 취약합니다.
→ 고객이 선택해야 할 이유가 없고 → 설령 관심을 보여도 구매로 이어지지 않습니다.
이 상태가 지속되면 마케팅 투자 대비 효과가 없는 구조가 고착됩니다.`);
    }

    if (isHigh(bmS) && isLow(fin)) {
      risks.push(`[매출의 함정 — 팔기는 잘 하는데 남기지 못함]
고객·매출 역량(${fmt(bmS)})은 강점이지만 재무건전성(${fmt(fin)})이 취약합니다.
→ 매출이 늘수록 비용도 비례해서 늘어나는 구조라면 성장이 오히려 위험합니다.
→ '매출 = 손실 가속' 패턴: 더 팔수록 현금이 더 빠르게 소진됩니다.
원가·마진 구조를 먼저 고친 후 매출 확장을 해야 합니다.`);
    }

    if (isLow(hr) && isHigh(fut)) {
      risks.push(`[실행 공백 — 업종 역량은 있지만 팀이 없음 → 원맨 리스크]
업종 특화 역량(${fmt(fut)})은 강점이지만 조직·인력(${fmt(hr)})이 취약합니다.
→ 대표 혼자 핵심 역량을 보유하고 있을 가능성이 높습니다.
→ 대표가 빠지면 사업이 멈추는 '원맨 리스크' 구조입니다.
확장하려면 대표의 역량을 팀으로 이전(매뉴얼화·교육)하는 작업이 선행되어야 합니다.`);
    }

    if (!risks.length) return '';

    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[경영지도사 심층 진단 — 수익 엔진 × 업종 충돌 인과관계 분석]
단순 점수 나열이 아닌, 비즈니스 모델의 수익 구조와 업종 특수성이 어떻게 충돌하는지를 분석합니다.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${risks.map((r, i) => `◆ 구조적 발견 ${i + 1}\n${r}`).join('\n\n')}

[Chain of Consulting 지침 — 반드시 준수]
위 인과관계 분석을 보고서 전체에 관통시키십시오.
• SWOT 약점/위협: 위 충돌 패턴의 근본 원인을 직접 서술
• keyStrategies: "왜 이 구조적 문제가 발생했는가" → "어떤 방침으로 끊는가" → "이번 주 실행 액션"
• KPI: 위 충돌 패턴이 해소되고 있는지를 측정하는 지표로 설정
• 6시스템: 충돌이 가장 심한 시스템을 1순위로 상세 처방
단순한 "개선 필요" 나열은 실패입니다. 반드시 원인→결과→처방의 인과 서술로 작성하십시오.
`;
  }

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

  function buildPrompt1(d) {
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
${ (typeof ReferenceDB !== 'undefined') ? (() => {
  const block = ReferenceDB.buildPromptBlock(d.industryKey || d.industry);
  return block ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9. 업종 벤치마크 준거 데이터 (필수 비교 분석)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${block}

▶ 위 수치를 활용한 필수 작성 규칙:
① executiveSummary에 반드시 "현재 [지표명] XX% → 업종 평균 YY% (격차 ±ZZ%p)" 형식의 수치 비교를 2개 이상 포함할 것.
② SWOT 기회·위협 항목에도 업종 평균 수치를 직접 인용하여 근거로 삼을 것.
   예시: "업종 평균 영업이익률 OO% 대비 현재 OO%p 차이 — 원가·운영비 개선 여지 존재"
③ KPI 목표값은 업종 평균 기준으로 "현재값 → 업종 평균 → 목표값" 3단계로 설정할 것.
④ 수치가 없는 경우에도 "업종 통계 기준" 또는 "소상공인진흥공단 기준" 출처를 명시할 것.` : '';
})() : '' }
${buildCausalChain(d, d.domainScores || {})}
${_ctGuidance(d.consultingType)}
[분석 지침]
- ${d.companyName}의 업종(${d.industry})과 비즈니스 모델(${d.bizModel || '미확인'})에 특화된 전략을 제시할 것
- 컨설팅 유형 "${d.consultingType || '미확인'}"에 맞는 specializedAnalysis를 반드시 작성할 것 (위 컨설팅 유형별 프레임워크 지침 준수)
- 위 [★ 핵심 지침]을 반드시 전체 보고서에 일관 반영할 것 — specializedAnalysis만 컨설팅 유형에 맞추는 것은 실패
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
- OKR: KPI의 target이 구체적 수치와 기간을 포함하는가?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10. 웹 검색 활용 지침 (필수)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
web_search 도구를 반드시 사용하여 아래 항목을 검색한 뒤 분석에 직접 반영할 것.
검색 결과는 SWOT 기회·위협, 업종 트렌드, 로드맵 지원사업 섹션에 구체적으로 인용할 것.

① "${d.industryKey || d.industry || '해당 업종'} 업종 2025 2026 시장 동향 한국 중소기업"
② "${d.companyName || '해당 기업'} 업종 경쟁사 현황 ${d.bizType || ''} ${d.bizItem || ''}"
③ "${d.industryKey || d.industry || '해당 업종'} 정부지원사업 중소기업 2025 소상공인 창업지원"

검색 결과 없이 작성된 일반론적 분석은 허용되지 않음.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
★ 1차 호출 응답 범위 (반드시 준수) ★
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
이번 응답에는 executiveSummary, swot, stp, fourP, keyStrategies, specializedAnalysis 6개 필드만 포함하세요.
kpi, roadmap, sixSystems, plan90days, leanCanvas는 포함하지 마세요. (2차 호출에서 별도로 더 깊이 작성합니다)`;
  }

  /* ── 2차 호출: 실행플랜 사용자 프롬프트 ─────────────────────────────── */
  function buildPrompt2(d, r1) {
    const keyStrategiesRef = (r1.keyStrategies || [])
      .map((s, i) => `${i + 1}. [${s.priority || 'medium'}] ${s.title}: ${(s.description || '').substring(0, 160)}`)
      .join('\n');

    return `[2차 실행플랜 작성 요청]

## 기업 기본 정보
- 회사명: ${d.companyName}
- 업종: ${d.industryKey || d.industry || '미입력'}
- 규모: ${d.bizScale === 'micro' ? '소상공인 (직원 5명 이하 / 연매출 10억 미만)' : d.bizScale === 'sme' ? '소기업·중소기업' : '미입력'}
- 컨설팅 유형: ${d.consultingType || '미확인'}
- 목표 기간: ${d.timeline || '12개월'}
- 가용 예산: ${d.budget || '미입력'}
- 현재 문제: ${d.problems || '미입력'}
- 목표: ${d.goals || '미입력'}
- 정부지원 관심: ${d.govSupport || '미입력'}

## 1차 분석 핵심전략 (아래 전략과 완전히 일관된 실행플랜 작성)
${keyStrategiesRef || '(핵심전략 없음 — 업종·목표 기반으로 실행플랜 작성)'}

## 경영진 요약 (1차 참고)
${(r1.executiveSummary || '').substring(0, 300)}

${_ctGuidance(d.consultingType)}
[실행플랜 작성 지침]
- KPI 10개: 위 핵심전략 각각과 직접 연결된 OKR 형태, 현실적 목표 수치, 업종 벤치마크 기준
- 6시스템: ${d.companyName}의 실제 상황으로 각 시스템 문제 구체 서술 (일반론 절대 금지)
- 90일플랜: ${d.bizScale === 'micro' ? '소상공인 특화 — 이번 주 당장 실행 가능한 구체 액션 중심, 무료/저비용 도구 우선' : '성장 단계별 구체 실행, 팀 역할 분담 명시'}
- 로드맵: 핵심전략 실행 순서에 맞춰 1→2→3단계 일관성 유지
- leanCanvas: 1차 분석(SWOT·STP·4P)과 일관된 비즈니스 모델 캔버스
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
웹 검색 활용 지침 (실행플랜 보강)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
web_search 도구로 다음을 검색하여 90일플랜·로드맵의 govSupport에 반영할 것:
① "${d.industryKey || d.industry || ''} 정부지원사업 ${d.bizScale === 'micro' ? '소상공인' : '중소기업'} 2025 신청"
② "${d.consultingType === 'digital_strategy' ? '소상공인 디지털 전환 바우처 2025' : d.consultingType === 'finance_strategy' ? '중소기업 경영안정 자금 융자 2025' : '중소기업 컨설팅 지원사업 창업지원 2025'}"`;
  }

  async function callClaude(key, formData) {
    // JSON 파싱 헬퍼
    function extractJSON(text) {
      const jsonBlock = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonBlock) try { return JSON.parse(jsonBlock[1]); } catch (_) {}
      const trimmed = text.trim();
      if (trimmed.startsWith('{')) try { return JSON.parse(trimmed); } catch (_) {}
      const s = text.indexOf('{'), e = text.lastIndexOf('}');
      if (s !== -1 && e > s) try { return JSON.parse(text.substring(s, e + 1)); } catch (_) {}
      return null;
    }

    // /api/claude-analyze 프록시 호출 헬퍼
    async function apiCall(systemPrompt, userPrompt) {
      const res = await fetch('/api/claude-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key, systemPrompt, userPrompt }),
      });
      if (!res.ok) {
        let msg = 'API 호출 실패 (' + res.status + ')';
        try { const e = await res.json(); msg = e.error || msg; } catch (_) {}
        throw new Error(msg);
      }
      const body = await res.json();
      if (body.error) throw new Error(body.error);
      return body.text || '';
    }

    // ── 1차 호출: 진단·전략 (executiveSummary·SWOT·STP·4P·핵심전략·유형별특화분석)
    console.log('[BizNavi] 1차 분석 시작 — 진단·전략...');
    const text1 = await apiCall(SYSTEM, buildPrompt1(formData));
    console.log('1차 응답 (처음 400자):', text1.substring(0, 400));
    const result1 = extractJSON(text1);
    if (!result1) throw new Error('1차 분석 JSON 파싱 실패: ' + text1.substring(0, 200));

    // ── 2차 호출: 실행플랜 (KPI·로드맵·6시스템·90일플랜·린캔버스)
    console.log('[BizNavi] 2차 분석 시작 — 실행플랜...');
    const text2 = await apiCall(_SYSTEM_EXEC, buildPrompt2(formData, result1));
    console.log('2차 응답 (처음 400자):', text2.substring(0, 400));
    const result2 = extractJSON(text2);
    if (!result2) throw new Error('2차 실행플랜 JSON 파싱 실패: ' + text2.substring(0, 200));

    // ── 병합: 1차 전략 + 2차 실행플랜
    return Object.assign({}, result1, result2);
  }

  function _fakeByConsultingType(d, co, ind, bm, comp, tl, cs) {
    const ct = d.consultingType || '';
    if (!ct || ct === 'growth_strategy') return {};

    if (ct === 'digital_strategy') {
      return {
        keyStrategies: [
          { title: 'CRM 도입', description: `[진단] ${co}의 고객 관리가 전화·메모장에 의존해 팔로우업 기회 손실이 반복됩니다. [방침] 무료 CRM으로 영업 파이프라인을 즉시 가시화합니다. [행동] ①HubSpot CRM 무료판 설치(이번 주) ②현재 상담 고객 20명 입력(2주 이내) ③팔로우업 날짜 자동 알림 설정`, priority: 'high', owner: '대표·영업 담당', timeline: '1개월' },
          { title: '온라인 마케팅', description: `[진단] 온라인 검색 시 ${co} 정보가 없거나 구버전입니다. [방침] 검색에서 발견되는 온라인 존재감을 30일 내 구축합니다. [행동] ①네이버 스마트플레이스·구글 비즈니스 최신화(이번 주) ②Google Analytics 4 설치(2주) ③핵심 키워드 3개 선정 + 블로그 월 4회 루틴(이번 달)`, priority: 'high', owner: '마케팅 담당', timeline: '1~3개월' },
          { title: '업무 자동화', description: `[진단] 반복 업무(일정 관리·정산·재고)가 수작업으로 주 5시간 이상 낭비되고 있습니다. [방침] 디지털 도구 3가지로 반복 업무를 절반으로 줄입니다. [행동] ①구글 캘린더 + 카카오 채널 자동응답(1주) ②간편 장부 앱 도입(2주) ③핵심 업무 프로세스 5가지 문서화(3개월)`, priority: 'high', owner: '운영 담당', timeline: '1~3개월' },
          { title: '데이터 대시보드', description: `[진단] 어떤 서비스가 실제로 남는지, 어떤 채널에서 고객이 오는지 데이터가 없습니다. [방침] 핵심 지표 5개를 주 1회 확인하는 대시보드를 만듭니다. [행동] ①구글 스프레드시트로 주간 현황표 작성(이번 주) ②CRM·GA4 연동 리포트 설정(1개월) ③월간 경영 성과 리뷰 미팅 루틴(2개월)`, priority: 'medium', owner: '대표', timeline: '2~3개월' },
          { title: '디지털 판매 채널', description: `[진단] 구매 가능한 온라인 채널이 없어 오프라인 대면 영업에만 의존합니다. [방침] 고객이 24시간 주문·예약할 수 있는 온라인 채널을 구축합니다. [행동] ①네이버 예약·스마트스토어 중 1개 도입(1개월) ②카카오 쇼핑 or 크몽 등 플랫폼 입점 검토(2개월) ③온라인 결제 시스템 연동(3개월)`, priority: 'medium', owner: '영업·운영', timeline: '2~4개월' },
          { title: '디지털 역량 강화', description: `[진단] 팀 전체의 디지털 도구 활용 역량이 낮아 도입해도 실제로 사용되지 않는 패턴이 반복됩니다. [방침] 대표부터 디지털 도구를 직접 사용하며 팀 문화를 바꿉니다. [행동] ①대표 디지털 도구 교육 1회(이번 달) ②팀원 도구별 담당자 지정(2주) ③월 1회 디지털화 현황 공유 미팅(지속)`, priority: 'low', owner: '전 팀원', timeline: '3~6개월' }
        ],
        kpi: [
          { metric: '온라인 문의 건수', current: '월 1~2건', target: '월 10건 이상', timeline: '3개월', progress: 15, method: 'CRM + 카카오채널 문의 건수 합산', owner: '마케팅 담당' },
          { metric: 'CRM 데이터 적재 고객', current: '0명', target: '50명 이상', timeline: '2개월', progress: 0, method: 'HubSpot CRM 연락처 수', owner: '영업 담당' },
          { metric: '디지털 도구 도입 수', current: '1종', target: '5종', timeline: '3개월', progress: 20, method: '실제 사용 중인 디지털 도구 목록', owner: '대표' },
          { metric: '주간 반복 업무 절감 시간', current: '0시간', target: '주 5시간 이상', timeline: '2개월', progress: 0, method: '업무 일지 기록 기준', owner: '운영 담당' },
          { metric: '온라인 검색 노출 (네이버)', current: '미노출', target: '핵심 키워드 3개 1페이지', timeline: tl, progress: 0, method: '네이버 스마트플레이스 통계', owner: '마케팅 담당' },
          { metric: '온라인 매출 비중', current: '0%', target: '10% 이상', timeline: tl, progress: 0, method: '온라인 채널 매출 / 전체 매출', owner: '대표·재무' },
          { metric: '월간 홈페이지 방문자', current: '추적 없음', target: '월 500명', timeline: '6개월', progress: 0, method: 'Google Analytics 4 세션 수', owner: '마케팅' },
          { metric: '업무 매뉴얼 완성도', current: '0개', target: '핵심 업무 5개 문서화', timeline: '3개월', progress: 0, method: '작성 완료 매뉴얼 수', owner: '운영 담당' },
          { metric: '재무 가시성 (월 마감 일수)', current: '익월 15일 이후', target: '익월 3일 이내', timeline: '2개월', progress: 0, method: '월 결산 완료 일자', owner: '재무 담당' },
          { metric: '고객 후기 수집', current: '0건', target: '온라인 후기 10건 이상', timeline: '3개월', progress: 0, method: '네이버 플레이스·구글 리뷰 합산', owner: '고객 응대 담당' }
        ],
        sixSystems: [
          { name: '1. 리더십 시스템', icon: '👑', status: '취약',
            issue: `${co}의 대표와 경영진이 디지털 도구 사용에 익숙하지 않아 팀원들도 새 시스템 도입에 소극적입니다. "도구보다 사람"이라는 관행으로 엑셀·메모장·전화 의존이 굳어져 있습니다. 어떤 디지털 도구를 도입해도 실제 사용으로 이어지지 않는 근본 원인입니다.`,
            actions: [
              `[이번 주] 대표가 먼저 Notion 메모 or 카카오워크 직접 사용 시작 — "대표가 쓰면 팀이 따른다"`,
              `[이번 달] 디지털 전환 추진 담당자 1인 지정 + 월 1회 디지털화 현황 보고 미팅 설정`,
              `[3개월 내] 팀 전체 디지털 도구 교육 1회 이상 — 유튜브·소진공 무료 온라인 강의 활용`
            ],
            resource: '중소기업 스마트화 지원사업 (중진공), 소상공인 디지털 전환 컨설팅 (소진공 무료)' },
          { name: '2. 마케팅 시스템', icon: '📣', status: '취약',
            issue: `현재 신규 고객 유입이 입소문·오프라인에만 의존하고, 온라인 검색 시 ${co} 정보가 없거나 오래된 상태입니다. ${ind} 업종 잠재 고객의 70% 이상이 온라인으로 먼저 검색하는데 이 수요를 완전히 놓치고 있습니다. 마케팅 효과를 측정하는 추적 도구도 없어 무엇이 작동하는지 알 수 없습니다.`,
            actions: [
              `[이번 주] 네이버 스마트플레이스·구글 비즈니스 프로필 최신화 — 대표 사진·서비스·운영시간 업데이트`,
              `[이번 달] Google Analytics 4 홈페이지 연결 + 네이버 검색광고 소액 테스트 (월 10만원 이내)`,
              `[3개월 내] 핵심 키워드 3가지 + 블로그·SNS 월 4회 발행 루틴 — 작업 과정·전후 사진 위주`
            ],
            resource: '소상공인 온라인 마케팅 지원 (소진공), 네이버 스마트플레이스 무료 등록' },
          { name: '3. 판매 시스템', icon: '💰', status: '취약',
            issue: `문의부터 계약까지의 과정이 전화·기억에만 의존합니다. 어떤 고객이 관심을 보였는지, 언제 팔로우업을 해야 하는지 추적이 안 됩니다. "잊혀진 기회"가 반복되며, 24시간 주문 가능한 온라인 채널이 없어 오프라인 영업 시간에만 계약이 발생합니다.`,
            actions: [
              `[이번 주] HubSpot CRM 무료판 설치 + 현재 상담 고객 목록 입력 및 팔로우업 날짜 설정`,
              `[이번 달] 카카오 채널 자동응답 설정 — 문의 시간대 외 자동 응답으로 기회 손실 차단`,
              `[3개월 내] 온라인 예약·견적·결제 중 1가지 도입 — 고객이 24시간 언제든 구매 가능한 구조`
            ],
            resource: 'HubSpot CRM 무료판, 카카오 채널 무료 자동응답, 소상공인 디지털 판로 지원' },
          { name: '4. 제품·서비스 시스템', icon: '🛠️', status: '보통',
            issue: `${co}의 서비스 자체는 경쟁력이 있지만 온라인으로 보여주는 방식이 없습니다. 서비스 과정·결과를 디지털로 기록·공유하지 않아 잠재 고객이 품질을 가늠하기 어렵습니다. 온라인 디지털 포트폴리오가 없으면 검색에서 발견돼도 신뢰를 주지 못합니다.`,
            actions: [
              `[이번 주] 서비스 진행 과정·결과물을 사진·영상으로 기록 시작 — SNS 콘텐츠 및 신뢰 자산으로 활용`,
              `[이번 달] 디지털 포트폴리오 페이지 구축 — 네이버 블로그 or 인스타그램 하이라이트 5개 이상`,
              `[3개월 내] 온라인 서비스 제공 가능성 검토 — 화상 상담·디지털 파일 납품·비대면 납품`
            ],
            resource: '소상공인 디지털 전환 바우처 (소진공), 유튜브 무료 촬영·편집 강의' },
          { name: '5. 운영 시스템', icon: '⚙️', status: '취약',
            issue: `일정·재고·정산 관리가 수기 장부 또는 개인 메모에 의존합니다. 직원이 한 명만 빠져도 운영이 흔들리는 구조이며, 어디서 시간·비용이 낭비되는지 데이터가 없습니다. 이 상태에서는 개선 우선순위조차 잡을 수 없습니다.`,
            actions: [
              `[이번 주] 구글 스프레드시트로 주간 현황표 시작 — 매출·주요 업무·이슈를 매주 금요일 30분 기록`,
              `[이번 달] 반복 업무 3가지 디지털 도구 대체 — 일정:구글캘린더, 재고:네이버스마트주문, 정산:엑셀템플릿`,
              `[3개월 내] 핵심 업무 프로세스 5가지 문서화 → 신규 직원도 혼자 할 수 있는 매뉴얼 완성`
            ],
            resource: '구글 워크스페이스 무료판, 소상공인 스마트상점 기술보급사업 (소진공 무료)' },
          { name: '6. 재무 시스템', icon: '📊', status: '취약',
            issue: `매출은 있지만 실시간 수익 구조를 파악하지 못합니다. 세금 신고 시즌에만 장부를 확인하는 수동적 구조로, 문제를 인식했을 때는 이미 늦은 경우가 많습니다. 디지털 재무 관리 도구 도입만으로 월 2~3시간의 정산 시간을 절반으로 줄일 수 있습니다.`,
            actions: [
              `[이번 주] 국세청 홈택스 전자세금계산서 시스템 활성화 — 종이 계산서 즉시 중단`,
              `[이번 달] 간편 장부 앱 도입 (삼쩜삼 or 더존 이지플러스) + 카드·현금 거래 자동 연동`,
              `[3개월 내] 월별 수익성 대시보드 완성 — 어떤 서비스가 실제로 남는지 한눈에 확인`
            ],
            resource: '국세청 홈택스 전자신고 (무료), 더존 이지플러스 소상공인 무료 버전' }
        ],
        plan90days: [
          {
            month: '1개월차',
            theme: '디지털 존재감 구축 + 핵심 도구 2종 도입',
            goal: 'CRM 1종 도입·데이터 적재 완료 + 온라인 프로필 최신화로 검색 노출 시작',
            actions: [
              `[이번 주] 네이버 스마트플레이스·구글 비즈니스 프로필 최신화 완료 — 대표 사진·서비스·운영시간`,
              `HubSpot CRM 무료판 설치 + 현재 상담 고객 전부 입력 + 팔로우업 날짜 설정`,
              `Google Analytics 4 홈페이지 연결 + 카카오 채널 자동응답 설정`
            ],
            expectedResult: '온라인 검색에서 ${co} 발견 시작, CRM에 고객 20명 이상 데이터 적재, 팔로우업 놓치는 건수 0',
            govSupport: '소상공인 스마트상점 기술보급사업 (소진공, 무료 컨설팅 포함)'
          },
          {
            month: '2개월차',
            theme: '자동화 확장 + 온라인 판매 채널 활성화',
            goal: '온라인 문의 월 5건 이상 달성 + 반복 업무 3가지 디지털 도구로 대체',
            actions: [
              `온라인 예약·견적 폼 or 스마트스토어 중 1개 오픈 — 24시간 주문 가능 채널 확보`,
              `블로그·SNS 주 1회 발행 루틴 시작 — ${co}의 작업 과정·결과물 콘텐츠`,
              `1개월차 CRM 데이터 분석 — 어느 채널에서 좋은 고객이 오는지 파악 후 해당 채널 집중`
            ],
            expectedResult: '온라인 경로 신규 문의 월 5건+, 주간 반복 업무 3시간 이상 절감',
            govSupport: '소상공인 온라인 판로 지원사업 (소진공)'
          },
          {
            month: '3개월차',
            theme: '데이터 기반 의사결정 체계 확립',
            goal: '월간 디지털 성과 보고서 완성 + ROI 측정 → 다음 분기 디지털 전환 계획 수립',
            actions: [
              `1~2개월 디지털 도구 투자 대비 효과 정량 측정 — 어떤 도구가 가장 효과적이었는지 데이터로 확인`,
              `효과 없는 것 중단·효과 있는 것 예산·시간 추가 투자 결정`,
              `${co}의 디지털 성숙도 다음 단계 목표 설정 + 필요 지원사업 신청 계획`
            ],
            expectedResult: '디지털 도구 기반 운영으로 월 5시간 이상 절감 + 온라인 매출 비중 10% 달성 착수',
            govSupport: '중소기업 디지털 전환 바우처 (중진공, 최대 200만원)'
          }
        ]
      };
    }

    if (ct === 'finance_strategy') {
      return {
        keyStrategies: [
          { title: 'BEP 즉각 달성', description: `[진단] 현재 손익분기점(BEP) 이하에서 운영 중이거나 이익률이 업종 평균 이하입니다. [방침] 고정비 분석 후 BEP를 낮추고 3개월 내 흑자 전환합니다. [행동] ①전체 고정비 항목 나열 + 절감 가능 항목 파악(이번 주) ②수익성 하위 20% 서비스·고객 정리(이번 달) ③임차료·구독 서비스 재협상(2개월)`, priority: 'high', owner: '대표·재무', timeline: '1~3개월' },
          { title: '현금흐름 안정화', description: `[진단] 매출 채권 회수가 늦어 현금이 부족한 흑자 도산 위험이 있습니다. [방침] 현금전환주기(CCC)를 30일 단축해 6개월 내 현금 여유 2개월치를 확보합니다. [행동] ①매출 채권 목록 정리 + 조기결제 인센티브 2% 제안(이번 주) ②연간 계약 전환 캠페인(이번 달) ③정책자금 활용 운전자금 확보(2개월)`, priority: 'high', owner: '재무 담당', timeline: '1~3개월' },
          { title: '수익성 구조 개선', description: `[진단] 단위 서비스별 실제 마진율을 파악하지 못해 어떤 상품이 손해인지 모릅니다. [방침] 상품·고객별 수익성 분석 후 고수익 영역에 자원을 집중합니다. [행동] ①서비스별 원가 계산(인건비·재료비 포함) 완료(이번 달) ②상위 20% 고수익 고객 집중 영업(2개월) ③저수익 상품 가격 인상 or 폐기(3개월)`, priority: 'high', owner: '대표', timeline: '2~4개월' },
          { title: '비용 구조 최적화', description: `[진단] 고정비 비중이 높아 매출 감소 시 즉각적인 위기로 이어지는 취약한 구조입니다. [방침] 변동비 전환 가능한 고정비를 파악하고 운영 레버리지를 낮춥니다. [행동] ①비용 항목별 분류(필수·선택·낭비) 후 선택·낭비 즉시 삭감 ②외주 활용으로 인건비 변동비화 ③디지털 도구로 운영비 절감`, priority: 'medium', owner: '대표·운영', timeline: '1~2개월' },
          { title: '자금 조달 다각화', description: `[진단] 단일 자금 조달 경로로 위기 시 대응력이 낮습니다. [방침] 정책자금·보증 대출·투자 유치 3가지 경로를 동시에 준비합니다. [행동] ①중소기업 정책자금 신청 준비(이번 달) ②기보·신보 보증 대출 상담(2개월) ③R&D 지원사업 해당 여부 확인`, priority: 'medium', owner: '대표·재무', timeline: '2~4개월' },
          { title: 'KPI 재무 대시보드', description: `[진단] 재무 현황을 월 1회 또는 분기에 한 번만 확인해 문제 인식이 늦습니다. [방침] 핵심 재무 지표 5개를 주 1회 확인하는 대시보드를 만듭니다. [행동] ①매출·비용·현금잔액 주간 집계 루틴 시작 ②손익계산서 간소화 버전 월 마감 3일 내 완료 ③분기별 CFO 마인드 재무 리뷰`, priority: 'low', owner: '재무 담당', timeline: '1~2개월' }
        ],
        kpi: [
          { metric: '영업이익률', current: `업종 평균 미달`, target: `${ind} 업종 평균 이상`, timeline: '6개월', progress: 20, method: '월별 손익계산서 기준', owner: '재무 담당' },
          { metric: '현금 여유 (월 고정비 기준)', current: '0~0.5개월', target: '2개월치 이상', timeline: '6개월', progress: 10, method: '월말 현금잔액 / 월 고정비', owner: '대표·재무' },
          { metric: '매출채권 회수 기간 (DSO)', current: '60일 이상', target: '30일 이내', timeline: '3개월', progress: 0, method: '매출채권 잔액 / 일평균 매출', owner: '재무 담당' },
          { metric: 'BEP 달성률', current: 'BEP 미달', target: 'BEP 대비 120% 이상', timeline: '3개월', progress: 30, method: '월 매출 / BEP 매출 × 100', owner: '대표' },
          { metric: '고정비 비중', current: '70% 이상', target: '60% 이하', timeline: '4개월', progress: 0, method: '고정비 / 전체 비용 × 100', owner: '운영 담당' },
          { metric: '수익성 상위 고객 매출 비중', current: '파악 안됨', target: '상위 20% 고객이 매출 60%+', timeline: '2개월', progress: 0, method: 'CRM 고객별 매출 집계', owner: '영업 담당' },
          { metric: '월 재무 마감 일수', current: '익월 15일 이후', target: '익월 3일 이내', timeline: '2개월', progress: 0, method: '월 결산 완료 일자', owner: '재무 담당' },
          { metric: '정책자금 신청 진행률', current: '0%', target: '2건 이상 신청 완료', timeline: '4개월', progress: 0, method: '신청 완료 건수', owner: '대표·재무' },
          { metric: '순이익률', current: '업종 평균 미달', target: '업종 평균 이상', timeline: '6개월', progress: 10, method: '당기순이익 / 매출액 × 100', owner: '재무 담당' },
          { metric: '현금전환주기 (CCC)', current: '90일 이상', target: '45일 이내', timeline: '6개월', progress: 0, method: '재고일수 + DSO - 매입채무회전일수', owner: '재무·운영' }
        ],
        sixSystems: [
          { name: '1. 리더십 시스템', icon: '👑', status: '취약',
            issue: `${co}의 대표가 재무 데이터를 주기적으로 확인하지 않아 문제 인식이 항상 늦습니다. "매출이 있으면 괜찮겠지"라는 안도감이 실제 현금 위기를 가리는 경우가 많습니다. CFO적 사고방식이 없으면 성장과 동시에 현금 부족이 발생하는 흑자 도산 구조에 빠질 수 있습니다.`,
            actions: [
              `[이번 주] 대표가 직접 매주 월요일 10분 재무 리뷰 루틴 시작 — 매출·현금잔액·미수금 3가지만 확인`,
              `[이번 달] 손익계산서 간소화 버전(1페이지) 작성 → 월 마감 3일 이내 완료 체계 구축`,
              `[3개월 내] 분기별 CFO 마인드 재무 전략 리뷰 — 다음 분기 자금 계획 90일 전 수립`
            ],
            resource: '중소기업 재무관리 무료 컨설팅 (중진공), 소상공인 경영지원 프로그램 (소진공)' },
          { name: '2. 마케팅 시스템', icon: '📣', status: '보통',
            issue: `마케팅 비용이 고정비로 나가고 있지만 어떤 채널에서 수익성 높은 고객이 오는지 파악하지 못합니다. CAC(고객 획득 비용) 대비 LTV(고객 생애가치)가 측정되지 않아 마케팅 ROI가 마이너스일 가능성이 있습니다.`,
            actions: [
              `[이번 달] 채널별 마케팅 비용과 유입 고객 수 집계 — CAC 계산 시작`,
              `[2개월] CAC가 높은 채널 예산 50% 삭감 → 수익성 높은 채널 집중`,
              `[3개월] 기존 고객 레퍼럴 프로그램 도입 — 소개 1건당 서비스 할인 제공으로 CAC 제로 유입 확대`
            ],
            resource: '소상공인 마케팅 지원사업 (소진공), 구글 애널리틱스 4 무료' },
          { name: '3. 판매 시스템', icon: '💰', status: '취약',
            issue: `저수익 고객에게 시간·자원을 소비하면서 수익성 높은 고객을 놓치는 구조입니다. 가격 협상 시 원가 근거 없이 할인을 허용해 이미 얇은 마진이 더 얇아지고 있습니다.`,
            actions: [
              `[이번 주] 지난 6개월 계약별 실제 마진율 계산 — 손해 보는 계약 즉시 파악`,
              `[이번 달] 최저 마진율 기준선 설정 + 기준 이하 계약은 반드시 대표 승인 체계 도입`,
              `[3개월] 수익성 상위 20% 고객 프로파일 분석 → 유사 고객 집중 영업 전략 수립`
            ],
            resource: '중소기업 영업 컨설팅 (KOTRA), 소상공인 경영개선 지원 (소진공)' },
          { name: '4. 제품·서비스 시스템', icon: '🛠️', status: '보통',
            issue: `서비스 라인업 중 실제 이익을 내는 것과 적자인 것이 섞여 있지만 구분이 안 됩니다. "바쁜데 돈이 없는" 상태의 핵심 원인 중 하나입니다.`,
            actions: [
              `[이번 달] 서비스별 원가(인건비·재료비·간접비 포함) 계산 완료 — 마진 매트릭스 작성`,
              `[2개월] 마진 하위 30% 서비스 가격 인상(15~20%) or 단종 결정`,
              `[3개월] 마진 상위 서비스 중심으로 패키지 재구성 → 고객당 평균 단가 10% 이상 향상`
            ],
            resource: '업종별 원가 분석 교육 (중소벤처기업부 온라인 교육)' },
          { name: '5. 운영 시스템', icon: '⚙️', status: '취약',
            issue: `운영 비용 중 어디서 낭비가 발생하는지 파악되지 않습니다. 사용하지 않는 구독 서비스·회원비 등이 고정비로 누적되어 있을 가능성이 높습니다.`,
            actions: [
              `[이번 주] 전체 고정비 항목 나열 — 필수·선택·낭비 3분류 후 낭비 항목 즉시 삭감`,
              `[이번 달] 외주 활용 가능 업무 파악 → 고정 인건비 일부 변동비화`,
              `[2개월] 임차료·통신·구독 서비스 재협상 — 계약 만료 전 비교 견적으로 10% 절감 목표`
            ],
            resource: '소상공인 스마트화 지원 (소진공), 업무 자동화 도구 (구글 워크스페이스 무료)' },
          { name: '6. 재무 시스템', icon: '📊', status: '위험',
            issue: `매출이 있어도 현금이 부족한 "흑자 도산" 위험이 가장 큰 영역입니다. 매출채권(외상) 회수가 늦고 매입채무는 빨리 갚는 역방향 현금흐름이 지속되고 있습니다.`,
            actions: [
              `[이번 주] 미수금 목록 전수 확인 + 조기결제 인센티브(2%) 제안으로 현금 회수 즉시 시작`,
              `[이번 달] 중소기업 정책자금(중진공) 상담 예약 + 기보·신보 보증 대출 한도 확인`,
              `[3개월] 현금흐름 예측 스프레드시트 구축 — 3개월 앞 현금 상황 항상 가시화`
            ],
            resource: '중소기업 정책자금 (중진공, 금리 2~3%), 신용보증기금·기술보증기금 보증 대출' }
        ],
        plan90days: [
          {
            month: '1개월차',
            theme: '재무 현황 투명화 + 즉각 현금 확보',
            goal: '전체 비용 구조 파악 완료 + 미수금 회수 시작 + BEP 계산 완료',
            actions: [
              `[1주차] 전체 고정비 나열 → 필수·선택·낭비 분류 → 낭비 항목 즉시 해지·삭감`,
              `[2주차] 서비스별 원가 계산 완료 (인건비·재료비·간접비 포함) — 마진 매트릭스 완성`,
              `[3~4주차] 미수금 전수 조사 + 조기결제 인센티브 제안으로 현금 최대한 회수`
            ],
            expectedResult: '월 고정비 10% 이상 절감 + 미수금 30% 회수 + BEP 매출 정확히 파악',
            govSupport: '소상공인 경영개선 컨설팅 (소진공 무료 신청 가능)'
          },
          {
            month: '2개월차',
            theme: '수익성 개선 + 자금 조달 준비',
            goal: '저수익 서비스 정리 완료 + 정책자금 신청 착수 + 재무 대시보드 구축',
            actions: [
              `마진 하위 30% 서비스 가격 인상(15%) or 단종 결정 — 수익성 높은 서비스 집중`,
              `중진공 정책자금 상담 예약 + 기보·신보 보증 대출 한도 확인 + 신청 서류 준비`,
              `주간 재무 리뷰 루틴 정착 — 매출·현금잔액·미수금 매주 월요일 10분 대표 직접 확인`
            ],
            expectedResult: '평균 마진율 5%P 이상 향상 + 정책자금 신청 1건 완료 + 주간 재무 루틴 정착',
            govSupport: '중소기업 정책자금 (중진공, 연 2~3%), 소상공인 특별보증 (신보)'
          },
          {
            month: '3개월차',
            theme: '현금흐름 안정화 + 수익성 구조 정착',
            goal: '현금 여유 1개월치 이상 확보 + 월 손익계산서 마감 3일 이내 + BEP 달성',
            actions: [
              `현금전환주기(CCC) 단축 확인 — 매출채권 회수 기간 45일 이하 달성 여부 측정`,
              `연간 계약 전환 캠페인 — 선불 연간 결제 시 10% 할인으로 현금 일시 확보`,
              `다음 분기 자금 계획 수립 — 3개월 후 현금 흐름 예측 시나리오 3개 작성`
            ],
            expectedResult: '현금 여유 1개월치+ 확보, BEP 달성, 월 재무 마감 3일 이내 안착',
            govSupport: '중소기업 R&D 지원사업 (해당 시), 수출 바우처 (수출 기업 해당 시)'
          }
        ]
      };
    }

    if (ct === 'differentiation_strategy') {
      return {
        keyStrategies: [
          { title: 'USP(핵심 차별점) 명문화', description: `[진단] ${co}의 차별화 포인트가 내부적으로만 인식되고 고객에게 명확히 전달되지 않습니다. [방침] 경쟁사 대비 10배 나은 단 1가지를 1문장으로 정의하고 전 채널에 일관 적용합니다. [행동] ①현재 고객 5명에게 "왜 우리를 선택했나요?" 인터뷰(이번 주) ②인터뷰 기반 USP 1문장 작성(2주) ③홈페이지·영업 자료 전면 교체(이번 달)`, priority: 'high', owner: '대표·마케팅', timeline: '1개월' },
          { title: '경쟁사 약점 분석 및 포지셔닝', description: `[진단] ${comp || '경쟁사'} 대비 명확한 포지셔닝이 없어 "가격 경쟁"으로 내몰리는 상황입니다. [방침] 경쟁사가 못하는 영역에서 확실하게 이기는 포지셔닝 전략을 수립합니다. [행동] ①경쟁사 리뷰·불만 사항 수집(이번 달) ②경쟁사 약점 = ${co} 강점으로 전환하는 메시지 작성 ③영업 대화에 경쟁 비교 스크립트 도입`, priority: 'high', owner: '영업·마케팅', timeline: '1~2개월' },
          { title: '해자(Moat) 구축', description: `[진단] 현재 강점이 경쟁사에 의해 쉽게 모방될 수 있는 취약한 상태입니다. [방침] 특허·IP·독점 데이터·장기 계약으로 모방 장벽을 3~5년 내 구축합니다. [행동] ①핵심 기술 특허 출원 가능성 확인(이번 달) ②주요 고객과 장기 계약(1~2년) 전환 캠페인 ③독점 파트너십 1건 이상 확보`, priority: 'high', owner: '대표', timeline: '2~4개월' },
          { title: '니치 시장 집중 공략', description: `[진단] 넓은 시장을 공략하다 아무도 강하게 인식하지 못하는 "전방위 약체" 포지션에 있습니다. [방침] 가장 잘 이길 수 있는 좁은 시장에서 먼저 1위를 차지합니다. [행동] ①최근 6개월 수주 이력에서 가장 높은 승률의 고객 유형 파악 ②해당 세그먼트 전용 레퍼런스·사례 3개 이상 구축 ③니치 세그먼트 타겟 광고·PR 집중`, priority: 'medium', owner: '영업·마케팅', timeline: '2~3개월' },
          { title: 'ROI 증명 체계 구축', description: `[진단] 고객이 ${co}를 선택해서 얻은 효과를 숫자로 증명하는 자료가 없습니다. [방침] 고객 성공 사례 3건 이상을 ROI 수치로 데이터화해 영업 무기로 만듭니다. [행동] ①기존 고객 3곳 성과 인터뷰(이번 달) ②"도입 전·후 수치 비교" 성공 사례 작성 ③영업 자료·홈페이지에 사례 통합`, priority: 'medium', owner: '영업·마케팅', timeline: '2~3개월' },
          { title: '전문 인증·레퍼런스 강화', description: `[진단] 신뢰를 증명하는 제3자 인증·수상·레퍼런스가 부족합니다. [방침] ${ind} 업종 전문 인증 취득으로 신뢰 기반 차별화를 빠르게 구축합니다. [행동] ①취득 가능한 인증 3가지 리스트업(이번 달) ②가장 영향력 있는 인증 착수 ③기존 고객 레퍼런스 레터 3건 이상 확보`, priority: 'low', owner: '대표', timeline: '3~6개월' }
        ],
        kpi: [
          { metric: '경쟁 입찰 승률', current: '파악 안됨', target: '50% 이상', timeline: '6개월', progress: 0, method: '수주 건수 / 입찰 건수 × 100', owner: '영업 담당' },
          { metric: '고객 선택 이유 인지율', current: '불명확', target: '80% 이상 "차별화 포인트" 인지', timeline: '3개월', progress: 0, method: '신규 고객 온보딩 인터뷰', owner: '마케팅' },
          { metric: '재계약률', current: '파악 안됨', target: '85% 이상', timeline: '6개월', progress: 30, method: '재계약 건수 / 만기 도래 계약 건수', owner: '영업 담당' },
          { metric: 'NPS (순추천지수)', current: '미측정', target: '40점 이상', timeline: '6개월', progress: 0, method: '분기별 고객 NPS 설문', owner: '대표·마케팅' },
          { metric: '차별화 기능·서비스 사용률', current: '파악 안됨', target: '가입 고객 60% 이상 사용', timeline: '4개월', progress: 0, method: 'CRM 기능 사용 로그 분석', owner: '운영 담당' },
          { metric: '장기 계약(1년 이상) 비중', current: '20% 미만', target: '50% 이상', timeline: tl, progress: 20, method: '1년 이상 계약 건수 / 전체 계약', owner: '영업 담당' },
          { metric: '성공 사례(케이스스터디) 수', current: '0건', target: '3건 이상', timeline: '3개월', progress: 0, method: 'ROI 수치 포함 사례 완성 건수', owner: '마케팅' },
          { metric: '전문 인증 취득 수', current: '0건', target: '1건 이상', timeline: tl, progress: 0, method: '취득 완료 인증 건수', owner: '대표' },
          { metric: '평균 계약 단가', current: '현재 수준', target: '15% 인상', timeline: '6개월', progress: 0, method: '총 매출 / 계약 건수', owner: '영업·재무' },
          { metric: '경쟁사 대비 기능 우위 항목 수', current: '파악 안됨', target: '핵심 3가지 이상 명문화', timeline: '2개월', progress: 0, method: '경쟁 분석 매트릭스 업데이트', owner: '대표·영업' }
        ],
        sixSystems: [
          { name: '1. 리더십 시스템', icon: '👑', status: '보통',
            issue: `${co}의 차별화 전략이 대표의 머릿속에만 있고 팀 전체가 같은 방향을 가리키지 않습니다. 영업·마케팅·개발 팀이 각자 다른 차별점을 말한다면 고객은 혼란을 느끼고 선택하지 않습니다.`,
            actions: [
              `[이번 주] 대표가 팀 전체 앞에서 ${co}의 USP 1문장을 공식 선언`,
              `[이번 달] 팀별 영업·마케팅 스크립트에 USP 메시지 통일 적용`,
              `[3개월] 월간 팀 미팅에서 "차별화 성공 사례" 공유 루틴`
            ],
            resource: '중소기업 전략 컨설팅 (KOTRA), 소상공인 경영교육 (소진공)' },
          { name: '2. 마케팅 시스템', icon: '📣', status: '취약',
            issue: `마케팅 메시지가 제품·기능 나열에 머물러 "왜 당신이어야 하는가"가 전달되지 않습니다. 경쟁사와 동일한 언어를 쓰면 가격으로만 비교됩니다.`,
            actions: [
              `[이번 달] 홈페이지 히어로 섹션 — "우리의 기능"이 아닌 "고객의 문제 해결" 중심으로 재작성`,
              `[2개월] USP 기반 케이스스터디 3건 완성 → 홈페이지·제안서·SNS 전 채널 적용`,
              `[3개월] ${ind} 업종 전문 미디어·커뮤니티에 전문가 기고 1편 이상`
            ],
            resource: '네이버 비즈니스 스쿨 무료 마케팅 교육, KOTRA 수출 마케팅 지원' },
          { name: '3. 판매 시스템', icon: '💰', status: '취약',
            issue: `영업 대화에서 경쟁사와 비교당할 때 명확한 반박 스크립트가 없어 가격 협상으로 끝나는 경우가 많습니다.`,
            actions: [
              `[이번 주] 가장 많이 받는 경쟁사 비교 질문 5가지 → ROI 기반 답변 스크립트 작성`,
              `[이번 달] 성공 사례 3건을 "도입 전·후 수치 비교" 형식으로 제안서에 삽입`,
              `[3개월] 프리미엄 패키지 출시 — 차별화 서비스 번들로 단가 15~20% 인상`
            ],
            resource: 'KOTRA 영업 교육, 중소기업 영업 컨설팅 (무료 지원)' },
          { name: '4. 제품·서비스 시스템', icon: '🛠️', status: '보통',
            issue: `서비스 자체의 차별화 요소가 있지만 패키지화되지 않아 고객이 인식하기 어렵습니다. 차별화 기능을 고객이 쉽게 체험할 수 있는 형태로 포장해야 합니다.`,
            actions: [
              `[이번 달] 핵심 차별화 기능 3가지 → "무료 체험판 or 파일럿 패키지" 형태로 패키징`,
              `[2개월] 온보딩 과정에서 차별화 기능 체험 필수화`,
              `[3개월] 모방 불가 역량(특허·데이터·전문성) 1가지 이상 법적 보호 시작`
            ],
            resource: '특허청 중소기업 특허 전략 지원, 기술 개발 R&D 지원 (중소벤처부)' },
          { name: '5. 운영 시스템', icon: '⚙️', status: '보통',
            issue: `차별화 서비스를 안정적으로 제공하기 위한 품질 관리 체계가 없습니다. 바쁜 시즌에 서비스 품질이 떨어지면 차별화 포인트가 오히려 실망으로 이어집니다.`,
            actions: [
              `[이번 달] 핵심 서비스 제공 프로세스 표준화 — 체크리스트 + 품질 기준 문서화`,
              `[2개월] 고객 만족도 측정 — 서비스 완료 후 즉시 NPS 1문항 설문`,
              `[3개월] 품질 이슈 발생 시 24시간 내 해결 SLA 수립`
            ],
            resource: '중소기업 품질혁신 지원 (중진공)' },
          { name: '6. 재무 시스템', icon: '📊', status: '보통',
            issue: `프리미엄 포지셔닝을 선언했지만 가격 책정 근거가 없어 영업 현장에서 할인 압박에 무너집니다. 차별화 = 프리미엄 가격이라는 인식이 팀 내에 없으면 수익성이 개선되지 않습니다.`,
            actions: [
              `[이번 달] 경쟁사 대비 가격 비교 + 우리 서비스의 추가 가치(ROI) 계량화 완료`,
              `[2개월] 할인 승인 기준 설정 — 특정 % 이상 할인은 반드시 대표 승인`,
              `[3개월] 프리미엄 고객 전용 부가 서비스 패키지 도입 → 단가 15% 인상 기반 확보`
            ],
            resource: '가격 전략 컨설팅 (KOTRA), 소상공인 경영개선 지원 (소진공)' }
        ],
        plan90days: [
          {
            month: '1개월차',
            theme: 'USP 정의 + 포지셔닝 선언',
            goal: '고객 인터뷰 5건 완료 + USP 1문장 공식 채택 + 홈페이지·제안서 반영',
            actions: [
              `[1주차] 현재 고객 5명 인터뷰 — "왜 우리를 선택하셨나요?" + "가장 만족하는 점은?"`,
              `[2주차] 인터뷰 분석 → USP 초안 3개 작성 → 팀 투표로 1개 선정 → 대표 공식 선언`,
              `[3~4주차] 홈페이지·영업 제안서·SNS 프로필 USP 메시지 통일 적용`
            ],
            expectedResult: 'USP 1문장 완성, 전 채널 일관 메시지 적용, 팀 전체 USP 암기',
            govSupport: '소상공인 경영컨설팅 (소진공 무료)'
          },
          {
            month: '2개월차',
            theme: '경쟁우위 증명 + 영업 무기 구축',
            goal: 'ROI 성공 사례 3건 완성 + 경쟁 반박 스크립트 + 니치 세그먼트 집중 영업 착수',
            actions: [
              `성공 고객 3곳 케이스스터디 작성 — "도입 전 OO → 도입 후 OO으로 OO% 개선" 형식`,
              `경쟁사 비교 질문 5가지 ROI 기반 답변 스크립트 완성 + 영업팀 롤플레이 1회`,
              `니치 세그먼트(가장 승률 높은 고객 유형) 집중 공략 — 해당 세그먼트 전용 광고·PR 시작`
            ],
            expectedResult: '케이스스터디 3건 완성, 경쟁 입찰 승률 10%P 향상, 니치 세그먼트 신규 문의 증가',
            govSupport: 'KOTRA 마케팅 지원사업, 중소기업 브랜드 개발 지원'
          },
          {
            month: '3개월차',
            theme: '해자(Moat) 구축 착수 + 프리미엄 전환',
            goal: '장기 계약 전환 캠페인 + 특허·인증 착수 + 프리미엄 패키지 출시',
            actions: [
              `장기 계약(1~2년) 전환 캠페인 — 연간 계약 시 부가 서비스 제공으로 고객 이탈 장벽 구축`,
              `핵심 기술 특허 출원 or 업종 전문 인증 착수 — 법적 보호 및 신뢰 강화`,
              `프리미엄 서비스 패키지 출시 — 핵심 차별화 기능 번들 + 전담 CS + 단가 20% 프리미엄`
            ],
            expectedResult: '장기 계약 비중 30%+ 달성, 특허·인증 착수 완료, 평균 단가 10% 인상',
            govSupport: '특허청 중소기업 특허 전략 지원 (무료), 인증 취득 지원 (중소벤처부)'
          }
        ]
      };
    }

    if (ct === 'marketing_strategy') {
      return {
        keyStrategies: [
          { title: '타겟 고객 페르소나 정의', description: `[진단] ${co}의 마케팅이 "모두를 위한 것"이어서 실제로 누구에게도 강하게 어필하지 못합니다. [방침] 가장 수익성 높은 고객 1명의 구체적 페르소나를 정의하고 그 한 명을 향해 모든 메시지를 설계합니다. [행동] ①최근 6개월 최고 고객 3명 인터뷰(이번 주) ②페르소나 1장 문서 작성(2주) ③전 마케팅 채널 페르소나 기준으로 콘텐츠 재검토`, priority: 'high', owner: '마케팅 담당', timeline: '1개월' },
          { title: 'StoryBrand 메시지 체계 구축', description: `[진단] 현재 마케팅은 ${co}의 기능·스펙 나열에 집중해 고객이 "나와 무슨 관계인가?"를 느끼지 못합니다. [방침] 고객을 주인공, ${co}를 가이드로 포지셔닝한 StoryBrand 7단계 메시지를 작성합니다. [행동] ①홈페이지 히어로 섹션 재작성 ②1문장 엘리베이터 피치 완성 ③이메일·SNS 모든 카피에 적용`, priority: 'high', owner: '마케팅·대표', timeline: '1~2개월' },
          { title: '콘텐츠 마케팅 루틴화', description: `[진단] 마케팅이 "생각날 때" 하는 비정기 활동이어서 검색 노출이 쌓이지 않습니다. [방침] 주 1회 콘텐츠 발행을 90일간 유지해 검색 자산과 팔로워 기반을 구축합니다. [행동] ①핵심 키워드 3개 선정 + 콘텐츠 캘린더 작성(이번 주) ②블로그·SNS 주 1회 발행 루틴 시작 ③3개월 후 성과 측정 → 반응 좋은 주제 집중`, priority: 'high', owner: '마케팅 담당', timeline: '1~3개월' },
          { title: '디지털 채널 최적화', description: `[진단] 여러 채널을 운영하지만 어느 채널에서 실제 고객이 오는지 추적하지 못합니다. [방침] 성과 측정 후 상위 1~2개 채널에 집중해 CAC를 절반으로 낮춥니다. [행동] ①GA4 + UTM 파라미터로 채널별 전환 추적 시작(이번 주) ②3개월 데이터 기반 하위 채널 예산 삭감 ③상위 채널 예산 2배 집중`, priority: 'medium', owner: '마케팅 담당', timeline: '2~3개월' },
          { title: '리드 육성(Lead Nurturing) 자동화', description: `[진단] 문의가 들어와도 즉각 구매로 이어지지 않으면 그냥 놓치는 구조입니다. [방침] 이메일·카카오 채널 자동화로 구매 결정까지 지속 관계를 유지합니다. [행동] ①문의→상담→계약 단계별 이메일 시퀀스 3통 작성(이번 달) ②카카오 채널 자동응답 설정 ③리드 육성 결과 전환율 매월 측정`, priority: 'medium', owner: '마케팅 담당', timeline: '2~4개월' },
          { title: '브랜드 자산 구축', description: `[진단] ${co}에 대한 온라인 흔적(리뷰·기고·PR)이 없어 신규 고객이 신뢰하기 어렵습니다. [방침] 검색 시 신뢰를 주는 브랜드 자산 5가지를 12개월 내 구축합니다. [행동] ①고객 리뷰 10건 수집(이번 달) ②${ind} 전문 미디어 기고 1편(3개월) ③수상·인증 1건 착수(6개월)`, priority: 'low', owner: '대표·마케팅', timeline: '3~6개월' }
        ],
        kpi: [
          { metric: '월 신규 문의 건수', current: '월 1~3건', target: '월 10건 이상', timeline: '3개월', progress: 15, method: 'CRM + 홈페이지 문의폼 합산', owner: '마케팅 담당' },
          { metric: '리드 → 계약 전환율', current: '파악 안됨', target: '20% 이상', timeline: '6개월', progress: 0, method: '계약 건수 / 문의 건수 × 100', owner: '영업 담당' },
          { metric: '고객 획득 비용 (CAC)', current: '파악 안됨', target: '현재 대비 30% 절감', timeline: '6개월', progress: 0, method: '마케팅 총비용 / 신규 고객 수', owner: '마케팅 담당' },
          { metric: '콘텐츠 월 조회수', current: '0~100회', target: '월 1,000회 이상', timeline: '6개월', progress: 5, method: 'GA4 블로그 + SNS 합산 조회수', owner: '마케팅 담당' },
          { metric: 'SNS 팔로워', current: '현재 수준', target: '3개월 내 30% 증가', timeline: '3개월', progress: 0, method: '주력 SNS 채널 팔로워 수', owner: '마케팅 담당' },
          { metric: '이메일 오픈율', current: '미발송', target: '25% 이상', timeline: '2개월', progress: 0, method: '이메일 마케팅 플랫폼 통계', owner: '마케팅 담당' },
          { metric: '검색 노출 키워드 수', current: '0개', target: '핵심 키워드 3개 1페이지', timeline: tl, progress: 0, method: '네이버·구글 검색 순위 모니터링', owner: '마케팅 담당' },
          { metric: '고객 리뷰 수', current: '0~3건', target: '10건 이상', timeline: '3개월', progress: 10, method: '네이버 플레이스·구글 리뷰 합산', owner: '고객 응대' },
          { metric: '마케팅 ROI', current: '미측정', target: '200% 이상', timeline: '6개월', progress: 0, method: '마케팅 유입 매출 / 마케팅 비용 × 100', owner: '마케팅·재무' },
          { metric: '재방문율 (리타겟팅)', current: '미측정', target: '30% 이상', timeline: '4개월', progress: 0, method: 'GA4 재방문 세션 비율', owner: '마케팅 담당' }
        ],
        sixSystems: [
          { name: '1. 리더십 시스템', icon: '👑', status: '취약',
            issue: `마케팅이 "해봤는데 안 됐다"는 부정적 경험으로 대표가 마케팅 투자에 소극적인 상태입니다. 마케팅 없이는 영업력에만 의존하게 되어 성장의 천장이 낮습니다.`,
            actions: [
              `[이번 주] 마케팅 ROI 측정 시작 — "이 비용으로 몇 명의 고객이 왔는가?" 월 1회 확인 루틴`,
              `[이번 달] 마케팅 예산 최소 기준 설정 — 월 매출의 3~5%를 마케팅에 고정 배정`,
              `[3개월] 성공한 마케팅 채널 1개 발굴 → 해당 채널 예산 집중 → 성과 팀 공유`
            ],
            resource: '소상공인 온라인 마케팅 지원 (소진공), 네이버 마케팅 무료 교육' },
          { name: '2. 마케팅 시스템', icon: '📣', status: '위험',
            issue: `마케팅 채널이 산발적이고 성과 측정이 없습니다. 타겟·메시지·채널의 3가지가 정렬되지 않아 SNS·블로그·광고 모두 효과가 나오지 않는 상태입니다.`,
            actions: [
              `[이번 주] GA4 설치 + UTM 파라미터 → 어디서 실제 고객이 오는지 추적 시작`,
              `[이번 달] 타겟 페르소나 확정 → 페르소나가 사용하는 채널 1~2개에만 집중`,
              `[3개월] 주 1회 콘텐츠 발행 루틴 90일 지속 → 검색 자산 축적 시작`
            ],
            resource: '구글 애널리틱스 4 무료, 네이버 검색광고 소액 테스트 (월 10만원 이내)' },
          { name: '3. 판매 시스템', icon: '💰', status: '보통',
            issue: `마케팅으로 문의가 와도 영업 대화에서 전환이 안 됩니다. 마케팅과 영업이 서로 다른 메시지를 쓰면 고객은 불일치를 느끼고 신뢰를 잃습니다.`,
            actions: [
              `[이번 달] 마케팅 USP 메시지와 영업 스크립트 통일 — 같은 1문장으로 대화 시작`,
              `[2개월] 리드 육성 이메일 시퀀스 3통 → 문의 후 자동으로 신뢰를 쌓는 자동화 설정`,
              `[3개월] 문의→상담→계약 단계별 전환율 측정 → 가장 낮은 단계 집중 개선`
            ],
            resource: 'HubSpot CRM 무료판, 카카오 채널 자동응답 무료' },
          { name: '4. 제품·서비스 시스템', icon: '🛠️', status: '보통',
            issue: `서비스 자체는 좋지만 온라인에서 "체험"하는 방법이 없어 고객이 선택 전 확신을 갖지 못합니다.`,
            actions: [
              `[이번 달] 무료 체험·파일럿 패키지 설계 → 구매 전 효과를 직접 경험하는 경로 구축`,
              `[2개월] 서비스 과정·결과를 콘텐츠(사진·영상·케이스스터디)로 공개 → 투명성으로 신뢰 구축`,
              `[3개월] 서비스 만족도 보장 정책 명문화 — 구매 부담 제거`
            ],
            resource: '소상공인 디지털 전환 바우처 (소진공)' },
          { name: '5. 운영 시스템', icon: '⚙️', status: '보통',
            issue: `마케팅 콘텐츠를 "생각날 때" 하는 방식으로는 알고리즘에서 외면받습니다. 콘텐츠 캘린더·담당자 없이는 마케팅이 항상 우선순위에서 밀립니다.`,
            actions: [
              `[이번 주] 월간 콘텐츠 캘린더 작성 + 담당자 1명 지정`,
              `[이번 달] 콘텐츠 반응 측정 기준 설정 — 조회수·저장수·문의 전환으로 월 1회 성과 리뷰`,
              `[3개월] 반응 좋은 콘텐츠 포맷 3가지 → 템플릿화로 제작 시간 50% 절감`
            ],
            resource: '구글 드라이브 콘텐츠 캘린더 무료 템플릿, 캔바(Canva) 무료 디자인 툴' },
          { name: '6. 재무 시스템', icon: '📊', status: '보통',
            issue: `마케팅 비용이 나가는데 어떤 채널에서 실제 매출이 발생하는지 연결하지 못합니다. ROI를 모르면 마케팅 예산을 늘릴 근거가 없습니다.`,
            actions: [
              `[이번 달] 채널별 마케팅 비용 기록 + 유입 고객 매출 연결`,
              `[2개월] CAC 계산 → ROI 200% 이상 채널에만 집중 투자`,
              `[3개월] 마케팅 예산 월 매출의 5% 고정 배정 → 성과 측정 후 분기별 재조정`
            ],
            resource: '구글 스프레드시트 무료 마케팅 ROI 템플릿' }
        ],
        plan90days: [
          {
            month: '1개월차',
            theme: '타겟·채널 정비 + 성과 측정 기반 구축',
            goal: '페르소나 완성 + GA4 추적 설정 + 주 1회 콘텐츠 발행 루틴 시작',
            actions: [
              `[1주차] GA4 설치 + UTM 파라미터 → 채널별 실제 고객 유입 추적 시작`,
              `[2주차] 최고 고객 3명 인터뷰 → 페르소나 1장 완성 → 전 채널 메시지 재검토`,
              `[3~4주차] 홈페이지 히어로 섹션 재작성(StoryBrand) + 첫 콘텐츠 루틴 시작`
            ],
            expectedResult: 'GA4 추적 체계 완성, 페르소나 완성, 주 1회 콘텐츠 루틴 정착',
            govSupport: '소상공인 온라인 마케팅 지원사업 (소진공)'
          },
          {
            month: '2개월차',
            theme: '리드 육성 자동화 + 채널 집중',
            goal: '이메일 시퀀스 완성 + 성과 기반 채널 1~2개 집중 + 고객 리뷰 5건',
            actions: [
              `리드 육성 이메일 시퀀스 완성 — 문의 후 3일/7일/14일 자동 발송 설정`,
              `1개월 데이터 분석 → CAC 가장 낮은 채널 파악 → 해당 채널 예산 2배, 하위 채널 삭감`,
              `기존 고객에게 리뷰 요청 — 후기 작성 시 소정의 혜택 제공으로 10건 목표`
            ],
            expectedResult: '자동 리드 육성 체계 가동, CAC 20% 절감, 온라인 리뷰 5건+ 달성',
            govSupport: '디지털 마케팅 바우처 (중진공), 네이버 스마트플레이스 무료 등록'
          },
          {
            month: '3개월차',
            theme: '브랜드 자산 구축 + ROI 측정',
            goal: '케이스스터디 2건 + 검색 노출 1개 1페이지 + 마케팅 ROI 200% 확인',
            actions: [
              `고객 성공 사례 케이스스터디 2건 — "도입 전·후 수치 비교" 형식으로 홈페이지·SNS 게재`,
              `90일 콘텐츠 성과 총결산 — 반응 좋은 주제 3가지 → 다음 분기 집중 포맷 결정`,
              `마케팅 ROI 최종 측정 → 200% 달성 채널 예산 확대 계획 수립`
            ],
            expectedResult: '케이스스터디 2건, 핵심 키워드 1페이지 노출, 마케팅 ROI 200%+ 확인',
            govSupport: '소상공인 콘텐츠 마케팅 지원 (소진공), KOTRA 온라인 마케팅 지원'
          }
        ]
      };
    }

    if (ct === 'hr_strategy') {
      return {
        keyStrategies: [
          { title: '핵심 인력 리텐션 플랜', description: `[진단] ${co}의 핵심 역량이 1~2명에게 집중되어 이탈 시 사업이 위태로워지는 원맨 의존 구조입니다. [방침] 핵심 인력의 성장·보상·미션에 대한 동기부여 체계를 3개월 내 수립합니다. [행동] ①핵심 인력 1:1 면담 — "어떤 점에서 불만이 있나요?" 솔직한 대화(이번 주) ②급여·성과급·비금전 보상 패키지 재설계(이번 달) ③성장 경로(Career Path) 문서화 및 공유(2개월)`, priority: 'high', owner: '대표', timeline: '1~3개월' },
          { title: '역할·책임(R&R) 명확화', description: `[진단] 누가 어떤 결정을 해야 하는지 불분명해 의사결정 병목과 책임 회피가 반복됩니다. [방침] 직무기술서 + 의사결정 권한 매트릭스로 모호함을 제거합니다. [행동] ①현재 주요 업무 목록 + 담당자·권한 지정(이번 달) ②직무기술서 1인 1장 작성 ③월 1회 R&R 점검 미팅`, priority: 'high', owner: '대표·운영', timeline: '1~2개월' },
          { title: '업무 매뉴얼화·지식 이전', description: `[진단] 모든 노하우가 개인 머릿속에 있어 담당자가 빠지면 업무가 마비됩니다. [방침] 핵심 업무 5가지를 누구든 80%는 할 수 있는 매뉴얼로 문서화합니다. [행동] ①매뉴얼 작성 우선순위 5가지 선정(이번 주) ②담당자가 직접 작성 + 교차 검토(이번 달) ③신규 입사자 온보딩에 즉시 적용`, priority: 'high', owner: '운영 담당', timeline: '1~2개월' },
          { title: '성과 평가·보상 체계', description: `[진단] 성과가 좋아도 보상이 없고, 성과가 나빠도 피드백이 없는 불투명한 구조입니다. [방침] 분기별 성과 리뷰 + 명확한 평가 기준으로 동기부여·공정성을 회복합니다. [행동] ①팀 전체 핵심 KPI 3개 설정 + 개인별 목표 연동(이번 달) ②분기 성과 리뷰 루틴 시작 ③성과 달성 시 인센티브 기준 명문화`, priority: 'medium', owner: '대표', timeline: '2~4개월' },
          { title: '채용 체계 구축', description: `[진단] 급할 때만 채용하다 보니 잘못된 사람을 뽑거나 시간·비용을 낭비하는 실수가 반복됩니다. [방침] 채용 기준·프로세스를 표준화해 성공 확률을 높입니다. [행동] ①이상적인 다음 채용 1명의 직무기술서 + 채용 기준 작성 ②3단계 면접 프로세스 설계(서류→실무→컬처핏) ③채용 채널 2개 이상 구축`, priority: 'medium', owner: '대표·운영', timeline: '2~4개월' },
          { title: '조직 문화·소통 활성화', description: `[진단] 팀 내 소통이 부족하거나 "대표 눈치 보기" 문화로 문제가 조기에 발견되지 않습니다. [방침] 주간 팀 스탠드업 + 월간 1:1 미팅으로 안전한 소통 채널을 만듭니다. [행동] ①주 1회 15분 팀 스탠드업 미팅 시작 ②월 1회 대표-직원 1:1 면담 ③분기 1회 팀 빌딩 활동`, priority: 'low', owner: '대표', timeline: '1개월~지속' }
        ],
        kpi: [
          { metric: '직원 이직률 (연간)', current: '파악 안됨', target: '20% 이하', timeline: tl, progress: 0, method: '퇴직자 수 / 평균 재직자 수 × 100', owner: '대표' },
          { metric: 'eNPS (직원 추천지수)', current: '미측정', target: '30점 이상', timeline: '6개월', progress: 0, method: '분기별 직원 익명 설문', owner: '대표' },
          { metric: '업무 매뉴얼 완성도', current: '0개', target: '핵심 업무 5개 문서화', timeline: '2개월', progress: 0, method: '완성된 매뉴얼 수', owner: '운영 담당' },
          { metric: '신규 입사자 온보딩 기간', current: '파악 안됨', target: '30일 내 독립 업무 수행', timeline: '3개월', progress: 0, method: '온보딩 완료 후 독립 업무 시작일', owner: '운영 담당' },
          { metric: '1:1 면담 완료율', current: '0%', target: '매월 100% 완료', timeline: '1개월', progress: 0, method: '면담 완료 인원 / 전체 인원', owner: '대표' },
          { metric: '성과 목표 달성률', current: '측정 안됨', target: '팀 목표 80% 이상 달성', timeline: '3개월', progress: 0, method: '분기 KPI 달성 건수 / 전체 KPI', owner: '대표' },
          { metric: '교육·훈련 시간', current: '연 0시간', target: '인당 연 20시간 이상', timeline: tl, progress: 0, method: '교육 완료 시간 합산', owner: '운영 담당' },
          { metric: '핵심 인력 공백 리스크 (교차 교육)', current: '1~2명 의존', target: '모든 업무 2인 이상 이해', timeline: '4개월', progress: 0, method: '교차 교육 완료 업무 수', owner: '운영 담당' },
          { metric: '신규 채용 소요 기간', current: '파악 안됨', target: '30일 이내 적임자 채용', timeline: '다음 채용 시', progress: 0, method: '채용 공고→최종 입사일 기간', owner: '대표' },
          { metric: '팀 미팅 정기 개최율', current: '비정기', target: '주 1회 스탠드업 100% 유지', timeline: '1개월', progress: 0, method: '실제 미팅 횟수 / 계획 횟수', owner: '대표' }
        ],
        sixSystems: [
          { name: '1. 리더십 시스템', icon: '👑', status: '취약',
            issue: `${co}의 모든 결정이 대표에게 집중되어 있어 대표가 없으면 팀이 멈추는 구조입니다. 코칭형 리더십으로 전환하지 않으면 팀이 아무리 좋아도 성장 속도에 한계가 있습니다.`,
            actions: [
              `[이번 주] 즉시 결정 vs 위임 가능한 것 목록 작성 — 팀원에게 이번 달 3가지 위임 시작`,
              `[이번 달] 주 1회 팀 스탠드업 + 월 1회 1:1 면담 — 대표가 "코치"로 역할 전환`,
              `[3개월] 팀원 1명 "담당 영역 책임자"로 공식 임명 + 의사결정 권한 완전 위임`
            ],
            resource: '중소기업 리더십 코칭 (중진공), 소상공인 경영자 교육 (소진공 무료)' },
          { name: '2. 마케팅 시스템', icon: '📣', status: '보통',
            issue: `채용 브랜딩이 없어 좋은 인재가 지원하지 않습니다. 현재 인재들은 연봉만큼 "성장 기회"와 "조직 문화"를 보고 선택합니다.`,
            actions: [
              `[이번 달] 채용 공고에 "왜 우리 회사인가?" 스토리 추가`,
              `[2개월] 팀원이 직접 쓴 "우리 회사 생활" 콘텐츠 SNS 게재 — 진정성 있는 고용 브랜딩`,
              `[3개월] 직원 추천 채용 보너스 도입`
            ],
            resource: '중소기업 채용 지원 (워크넷 무료), 고용노동부 청년 채용 지원금' },
          { name: '3. 판매 시스템', icon: '💰', status: '보통',
            issue: `영업 담당자가 모든 노하우를 혼자 알고 있어 이탈 시 영업이 즉시 멈추는 구조입니다. 영업 스크립트·고객 정보가 CRM에 축적되지 않아 팀원이 바뀌면 처음부터 다시 시작해야 합니다.`,
            actions: [
              `[이번 달] CRM 도입 + 모든 고객 정보·상담 내용 입력 — "개인 기억"이 아닌 "시스템 기억"으로 전환`,
              `[2개월] 영업 성공 스크립트 문서화 → 누구든 따라할 수 있는 플레이북 완성`,
              `[3개월] 영업 담당자 교차 교육 — 다른 팀원도 기본 영업 가능한 상태 구현`
            ],
            resource: 'HubSpot CRM 무료판, 소상공인 영업 교육 (소진공)' },
          { name: '4. 제품·서비스 시스템', icon: '🛠️', status: '보통',
            issue: `서비스 품질이 담당자 개인 역량에 100% 의존합니다. 숙련자와 초보자의 품질 차이가 너무 커서 고객 경험이 일관되지 않습니다.`,
            actions: [
              `[이번 달] 최고 품질 서비스의 과정을 단계별 체크리스트로 문서화`,
              `[2개월] 서비스별 품질 기준 명문화 → 팀원이 스스로 품질 점검하는 구조`,
              `[3개월] 신규 팀원 온보딩에 서비스 품질 교육 1주 필수화`
            ],
            resource: '소상공인 품질 향상 지원 (소진공), 중소기업 QMS 컨설팅' },
          { name: '5. 운영 시스템', icon: '⚙️', status: '취약',
            issue: `${co}는 핵심 업무의 80%를 1~2명이 처리하는 단일 장애점(Single Point of Failure) 구조입니다. 담당자 병가·이탈만으로 운영이 즉각 마비되는 고위험 상태입니다.`,
            actions: [
              `[이번 주] 핵심 업무 5가지 목록 + 담당자 + 백업 담당자 지정(교차 교육 계획)`,
              `[이번 달] 핵심 업무 5가지 매뉴얼 1차 완성 — 최소 80%는 매뉴얼만으로 처리 가능하게`,
              `[3개월] 교차 교육 완료 확인 + 시뮬레이션 — "담당자 없이 3일 운영 가능한가?" 테스트`
            ],
            resource: '구글 드라이브 문서화 무료, 소상공인 경영 효율화 지원 (소진공)' },
          { name: '6. 재무 시스템', icon: '📊', status: '보통',
            issue: `인건비가 전체 비용의 50~70%를 차지하지만 직원별 생산성·ROI를 측정하지 못합니다. 성과 기반 보상이 없으면 고성과자는 떠나고 저성과자가 남는 역선택이 발생합니다.`,
            actions: [
              `[이번 달] 직원별 성과 지표 3가지 설정 (측정 가능한 숫자 기준)`,
              `[2개월] 성과 달성 시 인센티브 기준 명문화 — 분기별 성과급 or 비금전 보상`,
              `[3개월] 고용노동부 청년 채용 지원금·일자리 안정자금 등 정부 보조금 해당 여부 확인`
            ],
            resource: '고용노동부 일자리 안정자금, 청년 채용 장려금, 중소기업 직원 교육비 지원' }
        ],
        plan90days: [
          {
            month: '1개월차',
            theme: 'R&R 명확화 + 핵심 인력 면담',
            goal: '전 직원 1:1 면담 완료 + R&R 문서 완성 + 주간 스탠드업 루틴 시작',
            actions: [
              `[1주차] 전 직원 1:1 면담 — "힘든 것·하고 싶은 것·바라는 것" 솔직하게 듣기`,
              `[2주차] 면담 결과 분석 → 이직 위험 높은 핵심 인력 파악 → 즉각 보상·조건 개선 검토`,
              `[3~4주차] 직무기술서 + R&R 매트릭스 완성 + 주 1회 팀 스탠드업 미팅 시작`
            ],
            expectedResult: '전 직원 면담 완료, R&R 문서화, 이탈 위험 인력 개선 조치 착수, 주간 미팅 루틴 정착',
            govSupport: '고용노동부 일자리 안정자금 (해당 여부 확인)'
          },
          {
            month: '2개월차',
            theme: '매뉴얼화 + 성과 체계 구축',
            goal: '핵심 업무 5가지 매뉴얼 완성 + 성과 KPI 3개 설정 + 교차 교육 시작',
            actions: [
              `핵심 업무 5가지 매뉴얼 1차 완성 — 담당자가 직접 작성, 타 직원이 교차 검토`,
              `팀 전체 KPI 3가지 + 개인별 목표 연동 → 분기 성과 리뷰 루틴 설계`,
              `교차 교육 시작 — 핵심 업무별 백업 담당자가 직접 해보는 실습`
            ],
            expectedResult: '매뉴얼 5개 완성, KPI 체계 수립, 교차 교육 1라운드 완료',
            govSupport: '중소기업 직원 교육비 지원 (고용노동부), 소상공인 무료 교육 (소진공)'
          },
          {
            month: '3개월차',
            theme: '채용 체계 정비 + 조직 문화 강화',
            goal: '채용 기준 문서화 + eNPS 첫 측정 + 성과 인센티브 공식 발표',
            actions: [
              `이상적인 다음 채용자 직무기술서 완성 → 채용 채널 2개 이상 등록 준비`,
              `직원 익명 eNPS 설문 실시 — "우리 회사를 친구에게 추천할 의향 1~10점" + 자유 의견`,
              `분기 성과 리뷰 1회 → 성과 달성자 인센티브 지급 → 성과 기반 문화 첫 경험 제공`
            ],
            expectedResult: '채용 체계 완성, eNPS 30점+ 목표, 성과 기반 보상 첫 사례',
            govSupport: '청년 채용 장려금 (고용노동부), 중소기업 가족친화인증'
          }
        ]
      };
    }

    if (ct === 'pivot_strategy') {
      return {
        keyStrategies: [
          { title: '현 사업 정직한 진단', description: `[진단] 현재 사업 모델이 근본적으로 시장 수요가 없거나 경쟁에서 밀리는 구조적 문제가 있습니다. [방침] 감정을 배제하고 데이터로 "계속할 것인가 vs 바꿀 것인가"를 판단합니다. [행동] ①지난 6개월 월별 매출·비용·이익 정리(이번 주) ②고객 이탈 이유 5명에게 직접 물어보기 ③현재 상황을 외부인(멘토·경영지도사)에게 솔직하게 보여주기`, priority: 'high', owner: '대표', timeline: '1~2주' },
          { title: '잔존 역량·자산 파악', description: `[진단] 사업 방향을 바꿔도 현재 ${co}의 팀·고객·기술·네트워크는 피벗의 출발점이 됩니다. [방침] 현재 보유한 자산 중 새 방향에서 활용 가능한 것을 먼저 파악합니다. [행동] ①현재 고객 중 다른 니즈가 있는 고객 파악(이번 달) ②팀의 핵심 역량이 활용될 수 있는 다른 시장 탐색 ③재활용 가능한 기술·인프라·콘텐츠 목록화`, priority: 'high', owner: '대표·운영', timeline: '1~2개월' },
          { title: '긴급 비용 구조조정', description: `[진단] 피벗 실행 기간 동안 버틸 현금(런웨이)이 부족하면 방향을 바꿀 시간조차 없습니다. [방침] 피벗 착수 전 최소 6개월 런웨이를 확보합니다. [행동] ①고정비 전수 검토 + 비필수 항목 즉시 삭감(이번 주) ②미수금 전부 회수 시작(이번 주) ③정책자금·보증 대출 긴급 상담`, priority: 'high', owner: '대표·재무', timeline: '1개월' },
          { title: '피벗 방향 3가지 검토', description: `[진단] 피벗은 "모든 것을 버리는 것"이 아니라 현재 강점을 다른 방향에 재적용하는 것입니다. [방침] 3가지 피벗 옵션을 평가하고 가장 빠른 MVP 검증이 가능한 방향을 선택합니다. [행동] ①고객 세그먼트 피벗(같은 제품, 다른 고객) ②제품 피벗(같은 고객, 다른 제품) ③비즈니스 모델 피벗(같은 것, 다른 방식 판매) 중 1개 선택`, priority: 'high', owner: '대표', timeline: '1~2개월' },
          { title: '피벗 MVP 빠른 검증', description: `[진단] 피벗 방향을 정했다고 바로 전면 전환하면 두 번째 실패로 이어질 수 있습니다. [방침] 린 스타트업 방식으로 최소한의 자원으로 먼저 검증하고 확신이 생기면 전면 전환합니다. [행동] ①피벗 MVP를 2~4주 내 출시할 수 있는 가장 작은 형태로 설계 ②기존 고객 3~5명에게 먼저 시도 ③4주 후 반응 측정 → Go/No-go 결정`, priority: 'medium', owner: '대표·운영', timeline: '2~3개월' },
          { title: '단기 현금흐름 안정 수입원', description: `[진단] 피벗 기간 동안에도 고정비는 나갑니다. [방침] 기존 고객 대상 단기 수입원을 별도 운영하며 피벗을 병행합니다. [행동] ①기존 고객에게 "지금 당장 해결하고 싶은 문제"를 물어보고 단건 서비스 즉시 제안 ②컨설팅·강의·외주 등 전문성 기반 단기 수익 탐색 ③정부 지원사업으로 현금 지원 확보`, priority: 'medium', owner: '대표·영업', timeline: '1~3개월' }
        ],
        kpi: [
          { metric: '현금 런웨이 (개월)', current: '1~2개월', target: '6개월 이상 확보', timeline: '2개월', progress: 20, method: '현금잔액 / 월 고정비', owner: '대표·재무' },
          { metric: '피벗 MVP 고객 반응 (NPS)', current: '미검증', target: '40점 이상', timeline: '3개월', progress: 0, method: 'MVP 시도 고객 NPS 설문', owner: '대표' },
          { metric: '피벗 방향 첫 매출', current: '0원', target: '피벗 방향 첫 계약 1건', timeline: '3개월', progress: 0, method: '신규 방향 매출 건수', owner: '영업 담당' },
          { metric: '고정비 절감률', current: '0%', target: '현재 대비 20% 절감', timeline: '1개월', progress: 0, method: '절감 후 고정비 / 절감 전 고정비', owner: '재무 담당' },
          { metric: '기존 고객 유지율', current: '파악 안됨', target: '80% 이상 유지', timeline: tl, progress: 50, method: '유지 고객 수 / 이전 분기 고객 수', owner: '영업 담당' },
          { metric: '정책자금 신청 진행률', current: '0%', target: '1건 이상 신청 완료', timeline: '2개월', progress: 0, method: '신청 완료 건수', owner: '대표·재무' },
          { metric: '피벗 MVP 출시 일수', current: '미착수', target: '30일 이내', timeline: '2개월', progress: 0, method: '피벗 결정일 → MVP 출시일', owner: '대표' },
          { metric: '단기 수입원 월 매출', current: '0원', target: '고정비의 30% 이상', timeline: '2개월', progress: 0, method: '컨설팅·단건 서비스 월 매출', owner: '대표' },
          { metric: '피벗 방향 고객 인터뷰 수', current: '0건', target: '15건 이상', timeline: '2개월', progress: 0, method: '잠재 고객 인터뷰 완료 건수', owner: '대표' },
          { metric: '핵심 팀 이탈 인원', current: '0명', target: '핵심 인력 0명 이탈', timeline: tl, progress: 100, method: '피벗 기간 중 자발적 퇴사 핵심 인력 수', owner: '대표' }
        ],
        sixSystems: [
          { name: '1. 리더십 시스템', icon: '👑', status: '위험',
            issue: `위기 상황에서 대표가 팀에게 솔직하게 상황을 공유하지 않으면 팀원들은 더 큰 불안을 느낍니다. 피벗의 성패는 대표의 결단력과 팀과의 투명한 소통에 달려 있습니다.`,
            actions: [
              `[이번 주] 팀 전체 미팅 — 현 상황 솔직하게 공유 + 피벗 검토 중임을 투명하게 전달`,
              `[이번 달] 외부 멘토(경영지도사·선배 창업자)와 월 1회 만남 — 대표 혼자 결정하지 않기`,
              `[3개월] 피벗 방향 결정 후 팀 전체에 "새 출발" 선언 + 각자 역할 재정의`
            ],
            resource: '중소기업 경영위기 컨설팅 (중진공), 경영지도사 무료 상담 (소진공), TIPS 멘토링' },
          { name: '2. 마케팅 시스템', icon: '📣', status: '취약',
            issue: `현재의 마케팅이 틀린 고객에게 틀린 메시지를 보내고 있을 가능성이 높습니다. 피벗 방향이 결정되면 타겟·메시지·채널 전부를 새로 설계해야 합니다.`,
            actions: [
              `[피벗 방향 결정 전] 기존 마케팅 비용 최소화 — 효과 없는 채널 즉시 중단`,
              `[피벗 방향 결정 후] 새 타겟 페르소나 정의 → 새 USP 1문장 + 새 채널 1개 집중`,
              `[3개월] 피벗 스토리를 콘텐츠로 — "왜 방향을 바꿨는가" 솔직하게 공유 → 공감·신뢰 획득`
            ],
            resource: '소상공인 마케팅 지원 (소진공), 스타트업 피벗 스토리텔링 교육' },
          { name: '3. 판매 시스템', icon: '💰', status: '취약',
            issue: `기존 영업 채널과 스크립트가 더 이상 효과가 없는 상태입니다. 피벗 기간 동안은 기존 고객 유지(현금 확보)와 신규 방향 테스트를 병행해야 합니다.`,
            actions: [
              `[이번 주] 기존 고객 5명에게 전화 — "지금 가장 힘든 문제가 무엇인가요?" → 단건 서비스 즉시 제안`,
              `[이번 달] 피벗 방향 잠재 고객 10명 인터뷰 — 가설 검증 후 MVP 영업 시작`,
              `[3개월] 피벗 MVP 첫 계약 1건 달성 → 성공 사례 문서화 → 확장 영업 기반 구축`
            ],
            resource: '중소기업 영업 전략 컨설팅 (KOTRA)' },
          { name: '4. 제품·서비스 시스템', icon: '🛠️', status: '위험',
            issue: `현재 제품·서비스가 시장에서 충분한 수요를 만들지 못하는 것이 피벗의 근본 이유입니다. MVP로 빠르게 새 방향을 검증하고, 실패하면 빠르게 다음 가설로 이동해야 합니다.`,
            actions: [
              `[피벗 방향 결정 후 2주] 새 방향 MVP 설계 — "4주 내 만들 수 있는 가장 작은 버전"으로 확정`,
              `[4주 내] MVP 출시 → 기존 고객 or 지인 5명에게 먼저 시도 + 피드백 수집`,
              `[6~8주] 피드백 반영 → 개선 2라운드 → 잠재 고객 10명 추가 검증 → Go/No-go 결정`
            ],
            resource: '중소기업 R&D 지원사업 (중소벤처부), 창업 도약 패키지 (중진공)' },
          { name: '5. 운영 시스템', icon: '⚙️', status: '취약',
            issue: `피벗 기간은 자원이 가장 부족한 시기이므로 불필요한 운영 비용을 완전히 제거해야 합니다. 지금 당장 필요하지 않은 모든 것은 잠시 멈추고, 피벗 검증에만 집중합니다.`,
            actions: [
              `[이번 주] 전체 비용 항목 재검토 — "피벗 검증에 직접 필요한가?" 기준으로 불필요 항목 즉시 중단`,
              `[이번 달] 팀원 역할 재배치 — 피벗 MVP 개발·검증에 최대 인력 집중`,
              `[3개월] 피벗 검증 결과에 따라 운영 규모 재결정 — 확장 or 추가 축소`
            ],
            resource: '소상공인 경영위기 극복 지원 (소진공), 긴급 경영안정자금 (중진공)' },
          { name: '6. 재무 시스템', icon: '📊', status: '위험',
            issue: `현금 런웨이가 부족하면 피벗을 시도할 시간도 없습니다. 모든 재무 결정의 기준은 "런웨이를 늘리는가?"입니다.`,
            actions: [
              `[이번 주] 현금 런웨이 계산 — 현금잔액 / 월 고정비 = 몇 개월? 정확히 파악`,
              `[이번 달] 중진공 긴급 경영안정자금 + 기보·신보 보증 대출 상담 → 모든 경로 동시 진행`,
              `[3개월] 피벗 MVP 매출 발생 시점 계획 + 런웨이 vs 매출 발생 시점 갭 분석`
            ],
            resource: '중진공 긴급경영안정자금, 소상공인 특례보증 (신보·기보)' }
        ],
        plan90days: [
          {
            month: '1개월차',
            theme: '현황 직시 + 런웨이 확보 + 방향 탐색',
            goal: '6개월 런웨이 확보 계획 수립 + 피벗 방향 3가지 가설 도출 + 잠재 고객 10명 인터뷰',
            actions: [
              `[1주차] 재무 현황 투명화 — 월별 매출·비용·이익 6개월 정리 + 런웨이 계산 + 정책자금 긴급 상담`,
              `[2주차] 기존 고객 5명 인터뷰 + 이탈 고객 3명 이탈 이유 파악 → 데이터 기반 방향 가설 3가지 도출`,
              `[3~4주차] 피벗 방향 가설 중 가장 빠른 검증 가능한 1가지 선택 → MVP 범위 확정`
            ],
            expectedResult: '런웨이 확보 계획 수립, 피벗 방향 1가지 선택, 잠재 고객 10명 인터뷰 완료',
            govSupport: '중진공 긴급경영안정자금 상담, 소상공인 경영위기 컨설팅 (소진공 무료)'
          },
          {
            month: '2개월차',
            theme: '피벗 MVP 출시 + 첫 검증',
            goal: 'MVP 출시 완료 + 첫 고객 5명 반응 수집 + 단기 수입원 1개 확보',
            actions: [
              `피벗 방향 MVP 출시 — 최소 기능으로 기존 고객 or 지인 5명에게 먼저 시도 + 피드백 수집`,
              `단기 현금 확보 — 컨설팅·강의·외주 등 전문성 기반 단건 서비스로 월 고정비 30% 충당`,
              `MVP 반응 분석 → "계속 쓸 의향이 있는가?" 기준으로 Go/No-go 데이터 확보`
            ],
            expectedResult: 'MVP 출시, 5명 반응 수집, 단기 수입원 1개 가동, Go/No-go 결정 데이터 완성',
            govSupport: '창업 도약 패키지 (중진공), 소상공인 전통시장 지원사업 (소진공)'
          },
          {
            month: '3개월차',
            theme: '피벗 실행 or 재피벗 결정',
            goal: 'MVP 결과 기반 피벗 최종 결정 + 첫 매출 1건 or 재피벗 착수',
            actions: [
              `MVP 검증 결과 분석 — "최소 3명이 돈을 내고 쓰겠다는 확인"이 있으면 전면 피벗 실행`,
              `전면 피벗 시: 기존 사업 정리 계획 + 새 방향 풀타임 집중 + 추가 정책자금 신청`,
              `재피벗 필요 시: 인터뷰 데이터 기반 새 가설 선택 → 다시 MVP 사이클 시작`
            ],
            expectedResult: '피벗 방향 최종 확정, 첫 피벗 매출 1건 이상, 다음 3개월 실행 계획 수립',
            govSupport: '창업성장기술개발사업 (해당 시), 민관공동투자 지원 (해당 시)'
          }
        ]
      };
    }

    return {};
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

    const base = {
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

    // 컨설팅 유형별 특화 오버라이드 — 반드시 마지막에 적용해야 generic 버전을 덮어씀
    return Object.assign(base, _fakeByConsultingType(d, co, ind, bm, comp, tl, cs));
  }

  return { callClaude, fakeAnalysis, calcDiagScores };
})();
