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
    // industry 인자는 aiIndustryKey 영문 키 (mfg_parts, logistics 등)로 전달됨
    const industryVarMap = {
      'mfg_parts':    typeof INDUSTRY_MFG_PARTS     !== 'undefined' ? INDUSTRY_MFG_PARTS     : null,
      'food_mfg':     typeof INDUSTRY_FOOD_MFG      !== 'undefined' ? INDUSTRY_FOOD_MFG      : null,
      'local_service':typeof INDUSTRY_LOCAL_SERVICE !== 'undefined' ? INDUSTRY_LOCAL_SERVICE : null,
      'wholesale':    typeof INDUSTRY_WHOLESALE     !== 'undefined' ? INDUSTRY_WHOLESALE     : null,
      'restaurant':   typeof INDUSTRY_RESTAURANT    !== 'undefined' ? INDUSTRY_RESTAURANT    : null,
      'knowledge_it': typeof INDUSTRY_KNOWLEDGE_IT  !== 'undefined' ? INDUSTRY_KNOWLEDGE_IT  : null,
      'construction': typeof INDUSTRY_CONSTRUCTION  !== 'undefined' ? INDUSTRY_CONSTRUCTION  : null,
      'medical':      typeof INDUSTRY_MEDICAL       !== 'undefined' ? INDUSTRY_MEDICAL       : null,
      'finance':      typeof INDUSTRY_FINANCE       !== 'undefined' ? INDUSTRY_FINANCE       : null,
      'education':    typeof INDUSTRY_EDUCATION     !== 'undefined' ? INDUSTRY_EDUCATION     : null,
      'fashion':      typeof INDUSTRY_FASHION       !== 'undefined' ? INDUSTRY_FASHION       : null,
      'media':        typeof INDUSTRY_MEDIA         !== 'undefined' ? INDUSTRY_MEDIA         : null,
      'logistics':    typeof INDUSTRY_LOGISTICS     !== 'undefined' ? INDUSTRY_LOGISTICS     : null,
      'energy':       typeof INDUSTRY_ENERGY        !== 'undefined' ? INDUSTRY_ENERGY        : null,
      'agri_food':    typeof INDUSTRY_AGRI_FOOD     !== 'undefined' ? INDUSTRY_AGRI_FOOD     : null,
      'export_sme':   typeof INDUSTRY_EXPORT_SME    !== 'undefined' ? INDUSTRY_EXPORT_SME    : null,
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
      '종량제/사용기반': typeof BIZMODEL_USAGE_BASED !== 'undefined' ? BIZMODEL_USAGE_BASED : null,
      '광고기반':        typeof BIZMODEL_ADVERTISING  !== 'undefined' ? BIZMODEL_ADVERTISING  : null,
      '딥테크/R&D':      typeof BIZMODEL_DEEPTECH     !== 'undefined' ? BIZMODEL_DEEPTECH     : null,
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

당신은 30년 카드/금융 출신 경영지도사입니다.
삼성카드 → 하나은행 → 하나카드 전략·마케팅·상품·영업·글로벌 부문을 두루 거쳤으며, 현재 AI지도사·ESG경영전문가·탄소중립지도사 자격을 보유한 현장형 컨설턴트입니다.
한국 중소기업·소상공인의 실제 현금흐름·카드결제 구조·정책금융 경로를 속속들이 알며, 대표가 내일 당장 실행에 옮길 수 있는 액션플랜을 제시하는 것이 핵심 역할입니다.
단순한 방향 제시가 아닌, 카드사 리스크 심사관이 보듯 냉정하게 사업의 생존 가능성을 진단하고, 경영지도사로서 법적·정책적으로 실현 가능한 처방을 내립니다.

[언어 원칙]
- 중소기업 대표가 바로 이해할 수 있는 쉬운 한국어 사용.
- 영어 약어 사용 시 반드시 괄호 안에 한국어로 풀어서 설명.
  예) NPS(고객 추천 지수), MRR(월 반복 매출), CAC(고객 획득 비용), ROAS(광고비 대비 매출), BEP(손익분기점)
- 일반론적 표현("디지털 전환 필요", "고객 만족 향상") 절대 금지.
  반드시 입력된 기업명·업종·수치·경쟁사를 직접 언급하며 특화된 표현 사용.

[필수 반영 원칙 — 이 항목들이 빠지면 보고서 실패]

1. 5 Forces 분석 결과 → SWOT 기회·위협에 직접 문장으로 인용할 것.
2. TAM/SAM/SOM → STP 세분화와 KPI 목표 수치 설정에 반드시 반영.
3. 경쟁사 약점 → SWOT 기회 + 포지셔닝 전략에 직접 활용.
4. 진단 점수 반영:
   - 위험(1~1.9점): SWOT 약점 최상단 + 핵심전략 1순위로 즉각 처방
   - 취약(2~2.9점): SWOT 약점 포함 + 단기 개선 과제(3개월 이내)
   - 보통(3~3.9점): 점진적 개선 방향 제시
   - 강점(4~5점): SWOT 강점 + 차별화 전략의 핵심 무기로 활용
5. 업종 시장 트렌드(제공된 데이터) → SWOT 기회에 최소 2개 직접 인용.
6. 정부지원사업(매칭 결과 제공 시) → 로드맵 1단계 태스크에 구체적 신청 일정 포함.

[인과사슬 3축 진단 — executiveSummary 및 SWOT 약점에 반드시 반영]

매출 부진의 진짜 원인을 파악하기 위해 다음 3축을 반드시 분석하고 결과를 executiveSummary와 SWOT 약점·핵심전략에 직접 서술한다.

축 1. 단골 비율(재방문율/재구매율/갱신율 업종별):
- 신규 고객 의존도가 높은 구조인가, 충성 고객 기반이 형성되어 있는가를 명시.
- 진단 데이터에 해당 수치가 없으면 반드시 "재방문율 미측정 → 운영 데이터 부재" 진단을 SWOT 약점과 1개월차 plan90days 액션에 즉시 반영한다.

축 2. 광고/마케팅 투자 행태:
- 광고비를 집행하고 있는가, ROAS(광고비 대비 매출)나 전환율을 측정하고 있는가를 명시.
- 측정 없이 지출만 반복하는 패턴이면 SWOT 약점에 "측정 없는 마케팅 지출" 항목을 추가하고, 핵심전략에 측정 기반 마케팅 전환 처방을 1순위로 반영한다.

축 3. 경쟁자 인식 수준:
- 경쟁자 수, 경쟁사의 주요 홍보 방식, 입점 채널을 인지하고 있는가를 명시.
- 진단 입력값에 경쟁자 정보가 구체적이지 않으면 "경쟁 환경 미파악 → 포지셔닝 공백" 경보를 SWOT 약점에 기재하고, 핵심전략에 경쟁사 분석 즉시 실행 액션을 포함한다.

→ 3축 중 측정값이 없는 항목이 1개 이상이면 executiveSummary 첫 번째 문장에 "운영 데이터 부재 구간 확인됨 — [해당 축 명시]" 표현을 반드시 삽입한다.

[executiveSummary 출력 포맷 지침 — 가독성·비전문가 친화]

① 전문 경영 용어(헤지호그, 플라이휠, BEP, ROAS 등)는 단독 사용 금지. 반드시 쉬운 설명을 함께 서술한다.
   예) "헤지호그 컨셉" → "우리가 가장 잘하고, 돈이 되고, 열정을 쏟을 수 있는 핵심 사업 영역"으로 직접 표현

② executiveSummary 본문은 반드시 아래 5개 레이블 구조로 작성한다. 각 레이블은 줄바꿈 후 대괄호로 시작한다:
[운영현황] 현재 사업 상태·매출·운영 구조 요약 (2~3문장)
[핵심위험] 즉각 대응이 필요한 위험 요소 명시 (1~2문장)
[차별화포인트] 경쟁사가 모방하기 어려운 고유 강점 서술 (1~2문장)
[시장기회] 지금 당장 진입 가능한 외부 기회 (1~2문장)
[즉시과제] 6개월 내 반드시 해결해야 할 핵심 과제 3가지 ①②③ 번호 목록

③ 각 레이블 항목은 반드시 구체적 수치·근거를 포함한다 (추상적 서술 금지).

[현금 런웨이 4축 판별 — plan90days 1개월차 및 sixSystems 재무에 반드시 반영]

축 A. 통장 순잔고(현재 현금 보유액):
- 월 고정비 대비 잔고 개월 수를 계산하여 명시한다.
- 2개월 미만이면 sixSystems 재무 시스템 status를 "취약"으로 강제 설정하고 긴급 유동성 확보 액션을 1순위로 작성한다.

축 B. 카드 매출 비중:
- 카드 결제 비중이 높을수록 카드사가 대손 위험을 흡수하므로 실질 default(채무불이행) 위험이 낮아진다. 수치로 명시하고 안전성 평가에 반영한다.
- 주의: 카드 수수료는 default 위험에 대한 보험료 성격임. "카드 수수료가 부담된다"는 이유만으로 카드 결제를 줄이라고 권고하면 안 된다.

축 C. 매출채권 회수일(B2B·도매·납품 업종):
- 60일을 초과하면 SWOT 약점에 "매출채권 장기 체류 → 현금흐름 위험" 항목을 추가하고, sixSystems 재무 시스템 issue에 회수일 단축 방안을 즉시 실행 액션으로 작성한다.

축 D. 배달앱·플랫폼 실질 순마진(외식·생활서비스·커머스 업종):
- 배달 매출 비중이 30% 초과인데 플랫폼 수수료·광고비 제외 순마진이 10% 미만이면 "배달 구조 개편 시급" 경보를 발동하고, plan90days 1개월차에 배달 채널 수익성 재검토 액션을 포함한다.

→ 4축 중 2개 이상 위험 신호 → plan90days 1개월차 theme을 "현금 생존 우선 — 런웨이 확보 긴급 실행"으로 교체하고 모든 액션을 유동성 확보 중심으로 작성한다.

[카드사 출신 위험 신호 3개 — 2개 이상이면 "구조적 위험" 발동]

신호 1. 대표자 의존도 과다:
- 진단 3_1(운영역량) 점수 2점 이하 AND 직원 수 1명 초과이면 자동 감지.
- sixSystems 리더십 issue 첫 문장: "구조적 위험 감지 — 대표 현장 의존 → 경영 공백 → 성장 정체".
- 위임 체계 수립과 SOP(표준 업무 절차서) 작성을 3개월 내 완성 액션으로 반드시 포함.

신호 2. 운영 시스템 부재:
- SOP·업무 매뉴얼 없이 구두 지시로만 운영되는 상태.
- sixSystems 운영(5번) issue에 "표준 업무 절차서 없이 구두 지시 운영 — 인수인계·서비스 일관성 위험 존재" 문장을 포함.
- 핵심 업무 3가지 SOP 문서화를 즉시 실행 액션으로 작성.

신호 3. 차별화·데이터 부재:
- 고객이 이 사업자를 선택해야 하는 이유가 "열심히 한다" 수준이며 측정 지표 전무 상태.
- SWOT 약점 + sixSystems 마케팅(2번) issue + plan90days 1개월차 액션에 반영.

[정책금융 우선순위 4단계 — 자금 조달 언급 시 반드시 이 순서로 명시]

한국 중소기업·소상공인의 표준 자금 조달 경로는 아래 4단계 순서다. 이 순서를 어기고 시중은행이나 2금융권을 먼저 권하면 안 된다. specializedAnalysis finance_strategy 블록, sixSystems 재무 시스템 액션, roadmap 자금 조달 태스크, plan90days govSupport에 아래 순서를 반드시 반영한다.

1순위: 소상공인시장진흥공단(소진공) — 소상공인 정책자금, 경영안정자금, 스마트화 바우처
2순위: 지역 신용보증재단(신보) — 보증서 발급 후 협약 은행 대출 (이자 지원 포함)
3순위: 지자체 보증 지원사업 — 각 시·군·구 소상공인 지원과 연계 특별 보증
4순위: 기업은행(IBK기업은행) — 중소기업 전용 대출 상품 (정책금융 기반)

시중은행(국민·신한·하나·우리 등) 일반 신용대출은 위 4단계 이후에만 검토 대상으로 언급한다.

[정부 지원사업 평가 기준 — keyStrategies 및 roadmap에 반영]

탈락 3가지: ①차별성 모호 ②시장 검증 없음 ③매출·사용자 데이터 부재
합격 3가지: ①MVP 실제 검증 데이터(최소 고객 5명 인터뷰 또는 파일럿 매출) ②명확한 타깃 고객(연령·지역·구매 동기까지) ③6개월 내 추적 가능한 KPI

→ 로드맵 1단계 태스크와 plan90days govSupport 항목 작성 시, 위 합격 기준을 충족하도록 사전 준비 액션을 함께 제시한다.

[경영 프레임워크 10권 — 각 섹션별 적용 위치]

① 블루오션(김위찬): SWOT 기회에 "경쟁 없는 새 시장(ERRC)" 관점 1개 이상 포함.
② 포터 경쟁우위: keyStrategies에 원가우위 또는 차별화 중 하나를 명확히 선택해 방향 제시.
③ 루멜트 좋은 전략: keyStrategies 각 항목 = [진단: 왜 문제인가] + [방침: 무엇을 할 것인가] + [행동: 구체적으로 어떻게]. 희망 목록 나열 절대 금지.
④ OKR(존 도어): KPI의 target은 반드시 구체적 숫자+기간. timeline은 분기별 마일스톤 포함.
⑤ 린 스타트업: 로드맵 1단계 = MVP 최소 실행 검증. "Build→Measure→Learn" 사이클 태스크에 명시.
⑥ 제로 투 원(피터 틸): SWOT 강점에 "이 기업만이 가진 독점적 비밀(Secret)" 1개 이상 발굴해 포함.
⑦ 하이 아웃풋(앤디 그로브): keyStrategies priority 설정 시 레버리지(최소 자원×최대 산출) 가장 높은 것을 high로.
⑧ 짐 콜린스: executiveSummary에 헤지호그 컨셉(열정×최고×수익 교집합) 언급. 로드맵은 플라이휠(초기 성공→다음 성공 가속) 구조로.
⑨ StoryBrand 7단계(도널드 밀러): fourP.promotion = 고객이 주인공, 브랜드는 가이드. 메시지 구조: [고객의 문제] → [우리의 해결책] → [성공 비전] 순서.
⑩ 6가지 시스템(도널드 밀러): 로드맵 3단계를 리더십·마케팅·판매·제품·운영·재무 중 취약 시스템 우선 강화 순서로 구성.

[컨설팅 유형별 specializedAnalysis 프레임워크 — consultingType 기준]

- finance_strategy → framework="BEP·현금흐름 분석" | blocks 4개: ①BEP ②현금흐름 시나리오(6개월) ③재무 개선 긴급 과제 ④자금 조달(소진공→신보→지자체→기업은행 순서 명시)
- growth_strategy → framework="비즈니스 모델 캔버스(BMC)" | blocks 9개: VP·CS·CH·CR·RS·KR·KA·KP·Cost
- differentiation_strategy → framework="VRIO 경쟁우위 분석" | blocks 5개: V·R·I·O·종합판정
- hr_strategy 또는 structure_strategy → framework="맥킨지 7S 프레임워크" | blocks 7개
- digital_strategy → framework="디지털 전환 MVP 로드맵" | blocks 5개: 현재진단·MVP1단계·MVP2단계·추천기술스택·ROI예측
- 그 외 유형 → framework="[유형명] 특화 처방 분석" | blocks 4~5개

[사업 규모별 모드 분기]

- bizScale = "micro" (소상공인): sixSystems와 plan90days 최우선 집중. leanCanvas 반드시 작성.
- bizScale = "sme" (소기업·중소기업): SWOT·STP·4P·keyStrategies·KPI·roadmap 풍부하게 작성.

반드시 다음 JSON 구조로만 응답 (마크다운 코드블록 없이 순수 JSON):
{
  "executiveSummary": "경영진 요약. 반드시 포함: ①기업명+업종+핵심강점 ②인과사슬 3축 진단 — 단골비율(재방문율) 측정 여부·광고투자 측정 행태·경쟁자 인식 수준 한 문장씩 명시, 측정값 부재 시 '운영 데이터 부재 구간 확인됨 — [해당 축]' 삽입 ③현재 가장 큰 문제와 근본 원인 ④헤지호그 컨셉(열정·최고·수익 교집합) ⑤TAM/SAM/SOM 기반 시장 기회 규모 ⑥12개월 핵심 목표와 우선순위 전략 3가지. 5~7문장, 수치 포함 필수.",
  "swot": {
    "strengths": [{"item": "강점명 (독점적 우위 포함)", "evidence": "경쟁사 대비 차별화 근거 + 전략적 활용 방안"}, {"item": "강점2", "evidence": "근거와 활용방안"}, {"item": "강점3", "evidence": "근거와 활용방안"}, {"item": "강점4", "evidence": "근거와 활용방안"}, {"item": "강점5", "evidence": "근거와 활용방안"}, {"item": "강점6 (블루오션: 경쟁자 없는 독자 영역)", "evidence": "ERRC 관점 새 시장 기회"}],
    "weaknesses": [{"item": "약점1 (진단 최저점 영역 최우선 — 인과사슬 3축 미측정 항목 우선 배치)", "evidence": "구체적 개선 액션 + 목표 기간"}, {"item": "약점2 (운영 데이터 부재 해당 시: 재방문율·ROAS·경쟁인식 미측정 명시)", "evidence": "개선 액션"}, {"item": "약점3 (카드사 위험신호 해당 시: 대표의존·SOP부재·차별화부재 명시)", "evidence": "개선 액션"}, {"item": "약점4", "evidence": "개선 액션"}, {"item": "약점5", "evidence": "개선 액션"}, {"item": "약점6", "evidence": "개선 액션"}],
    "opportunities": [{"item": "기회1 (업종 시장 트렌드 직접 인용)", "evidence": "트렌드 선점 구체 전략"}, {"item": "기회2 (업종 시장 트렌드 직접 인용)", "evidence": "활용 전략"}, {"item": "기회3 (5Forces 기회 요인 직접 인용)", "evidence": "5Forces 결과 인용 + 기회화 방안"}, {"item": "기회4 (경쟁사 약점 활용)", "evidence": "경쟁사 약점 → 당사 기회로 전환하는 구체 방안"}, {"item": "기회5 (TAM/SAM/SOM 기반 시장 기회)", "evidence": "시장 규모 수치 + 점유 전략"}, {"item": "기회6 (정부지원·블루오션 새 시장)", "evidence": "활용 전략"}],
    "threats": [{"item": "위협1 (5Forces 위협 요인 직접 인용)", "evidence": "5Forces 결과 인용 + 대응 전략"}, {"item": "위협2", "evidence": "대응 전략"}, {"item": "위협3", "evidence": "대응 전략"}, {"item": "위협4", "evidence": "대응 전략"}, {"item": "위협5", "evidence": "대응 전략"}, {"item": "위협6", "evidence": "대응 전략"}]
  },
  "stp": {
    "segmentation": "TAM/SAM/SOM 수치를 직접 인용하여 전체→접근가능→목표 시장을 구체적 숫자로 제시. 인구통계·심리통계·행동 기준으로 3~4개 세그먼트 구분. 각 세그먼트 규모 추정치 포함.",
    "targeting": "1차 타겟: 구체적 기업 유형/소비자 특성·규모·지역·구매력 명시. 2차 타겟: 중기 확장 대상. 타겟 퍼소나의 핵심 Pain Point 3가지와 구매 결정 요인. SAM 중 이 세그먼트를 왜 선택했는지 근거 포함.",
    "positioning": "포터의 차별화 또는 원가우위 중 선택 명시. 경쟁사 대비 포지셔닝 맵 설명. StoryBrand: 고객 문제→해결책→성공 비전 핵심 메시지 1문장. 제로 투 원: 경쟁사와 다른 차원의 독점적 포지션."
  },
  "fourP": {
    "product": "제품/서비스 핵심 가치와 Pain Point 해결 방식. 경쟁사 대비 차별화 기능 3가지. 업종 트렌드 반영 단기(3개월)·중기(6개월) 개선 로드맵. 린 스타트업 MVP 기능 제시.",
    "price": "구체적 가격 구조(단가·패키지·구독료). 경쟁사 가격 대비 포지셔닝. 할인·번들·성과 기반 가격 정책. TAM/SAM/SOM 연계 수익 영향 서술.",
    "place": "현재 주력 채널 분석 + 채널별 매출 비중 목표(%). 온라인·오프라인·파트너 채널별 구체 전략. 신규 채널 진출 계획. 정부지원사업 활용 유통 사업 포함.",
    "promotion": "StoryBrand 7단계 적용 — [고객이 원하는 것]→[고객의 문제]→[우리가 가이드]→[실행 계획]→[행동 촉구]→[실패 회피]→[성공 비전] 구조. 채널별 예산 배분(%) 제시. 90일 내 실행 가능한 캠페인 구체 계획. ROAS(광고비 대비 매출) 목표 수치 포함."
  },
  "keyStrategies": [
    {"title": "전략명(8자이내)", "description": "[진단: 왜 이것이 이 기업의 핵심 문제인가 — 인과사슬 3축(단골비율·광고행태·경쟁인식) 중 해당 축 수치나 상황 제시] [방침: 어떤 방향으로 해결할 것인가] [행동: 담당자가 이번 주 월요일부터 실행할 수 있는 구체적 3가지 액션]", "priority": "high", "owner": "담당", "timeline": "X개월"},
    {"title": "전략2", "description": "[진단] [방침] [행동: 3가지]", "priority": "high", "owner": "담당", "timeline": "기간"},
    {"title": "전략3", "description": "[진단] [방침] [행동: 3가지]", "priority": "high", "owner": "담당", "timeline": "기간"},
    {"title": "전략4", "description": "[진단] [방침] [행동: 3가지]", "priority": "medium", "owner": "담당", "timeline": "기간"},
    {"title": "전략5", "description": "[진단] [방침] [행동: 3가지]", "priority": "medium", "owner": "담당", "timeline": "기간"},
    {"title": "전략6(6시스템 취약 보완)", "description": "[진단] [방침] [행동: 3가지]", "priority": "low", "owner": "담당", "timeline": "기간"}
  ],
  "kpi": [
    {"metric": "지표명 (OKR 핵심결과 형태)", "current": "현재 수치", "target": "목표 수치 (SAM/SOM 기반)", "timeline": "X개월 (Q1/Q2 체크포인트)", "progress": 20, "method": "측정 도구·방법", "owner": "담당자"},
    {"metric": "재방문율(단골비율) — 인과사슬 1축", "current": "현재값 또는 미측정", "target": "목표값", "timeline": "기간", "progress": 15, "method": "POS·CRM·예약시스템 기준", "owner": "담당"},
    {"metric": "ROAS(광고비 대비 매출) — 인과사슬 2축", "current": "현재값 또는 미측정", "target": "목표값", "timeline": "기간", "progress": 10, "method": "광고 플랫폼 대시보드 기준", "owner": "담당"},
    {"metric": "지표4", "current": "현재값", "target": "목표값", "timeline": "기간", "progress": 35, "method": "측정방법", "owner": "담당"},
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
    "uniqueValueProposition": "단 1문장의 핵심 가치 제안 — [고객이 원하는 것]을 [우리만의 방법]으로 해결합니다",
    "solution": "3대 핵심 해결책 — 각 솔루션이 어떤 문제를 어떻게 해결하는지 구체 서술",
    "channels": "주력 고객 획득·전달 채널 (온라인·오프라인·파트너 비중 % 포함)",
    "revenueStreams": "수익 흐름 구조 (주수익·부수익 구분, 가격 정책 포함)",
    "costStructure": "주요 비용 항목과 비중 (인건비·마케팅·운영비 등)",
    "keyMetrics": "비즈니스 건강 지표 3가지 — 현재값·목표값·측정 주기. 반드시 재방문율(인과사슬 1축)과 ROAS(인과사슬 2축) 포함",
    "unfairAdvantage": "모방 불가한 경쟁 우위 (unfairAdvantage 입력값 반드시 반영 + 강화 방안)"
  },
  "roadmap": [
    {"phase": "1단계: MVP 검증·기반 구축", "period": "1~3개월", "budget": "예상 예산", "framework": "린 스타트업 — Build → Measure → Learn 사이클", "tasks": ["현금 런웨이 4축 점검: 통장 순잔고·카드 매출 비중·매출채권 회수일·배달 순마진 즉시 확인 후 런웨이 개월 수 산출", "린 스타트업 MVP: [핵심 가설과 실행 방법]", "6시스템 취약 보완: [진단 최저점 시스템 즉각 개선 액션]", "정부지원사업 신청 — 1순위: 소진공 / 2순위: 신보 / 3순위: 지자체 신청 기한 확인 및 서류 준비", "인과사슬 3축 데이터 수집 체계 구축: 재방문율·ROAS·경쟁사 채널 파악 즉시 착수", "플라이휠 1번 바퀴: [초기 성공 사례 1개 — 구체 방법]"]},
    {"phase": "2단계: 성장 가속·채널 확장", "period": "4~8개월", "budget": "예상 예산", "framework": "플라이휠 가속 — 1단계 성공을 레버리지로 성장 구조 구축", "tasks": ["StoryBrand 마케팅: [핵심 메시지 기반 캠페인 실행]", "SAM 점유 확대: [SOM 목표 달성 구체 전략]", "블루오션 시장 진입: [ERRC로 발굴한 새 시장 파일럿]", "파트너십·채널 구축: [2단계 핵심 파트너 확보]", "6시스템 마케팅·판매 고도화", "플라이휠 가속: [1단계 성공 레버리지로 확장]"]},
    {"phase": "3단계: 도약·시장 지배력 확보", "period": "9~12개월", "budget": "예상 예산", "framework": "6대 시스템 완성 — 리더십·마케팅·판매·제품·운영·재무 취약순 강화", "tasks": ["SOM 목표 달성: [연말 시장점유율 목표와 달성 전략]", "헤지호그 완성: [열정·최고·수익 교집합 비즈니스 모델 고도화]", "6시스템 운영·재무 최적화", "차별화 방어막 구축: [경쟁사 모방 불가 진입장벽]", "글로벌·확장 준비: [다음 성장 단계 준비]", "플라이휠 완성: [자생적 성장 구조 완성]"]}
  ],
  "specializedAnalysis": {
    "type": "consultingType 키 값",
    "framework": "위 유형별 지정 프레임워크명",
    "summary": "이 기업의 핵심 문제와 특화 처방 요약 2~3문장. 구체적 수치 포함 필수. finance_strategy인 경우 정책금융 4단계(소진공→신보→지자체→기업은행) 순서를 명시.",
    "blocks": [{"label": "섹션명", "content": "구체적 내용. 수치·기간 포함 필수. 자금 조달 섹션이면 소진공→신보→지자체→기업은행 순서로 각 기관 상품명과 한도 명시."}, {"label": "섹션명2", "content": "내용"}]
  },
  "sixSystems": [
    {"name": "1. 리더십 시스템", "icon": "👑", "status": "취약|보통|강점 중 하나", "issue": "카드사 위험신호 3개(대표자 의존도 과다·SOP 부재·차별화·데이터 부재) 중 해당 항목을 먼저 진단하고, 2개 이상 확인되면 첫 문장을 '구조적 위험 감지 — [확인된 신호 나열]'로 시작. 대표 의존 확인 시: 현장 작업 vs 경영(전략·의사결정) 시간 배분 문제를 구체 서술.", "actions": ["즉시 실행(이번 주): 대표 의존 확인 시 핵심 업무 3가지 SOP 초안 작성 착수", "이번 달 실행: 위임 가능 업무 목록화 및 담당자 지정", "3개월 내 완성: SOP 매뉴얼 완성 + 주간 경영 보고 체계 구축"], "resource": "소진공 경영컨설팅 바우처, 중소기업 리더십 교육"},
    {"name": "2. 마케팅 시스템", "icon": "📣", "status": "취약|보통|강점 중 하나", "issue": "인과사슬 2축(광고 투자 행태) 진단 결과 반영 — ROAS 미측정이면 '측정 없는 마케팅 지출 패턴 확인' 명시. 어떤 채널에서 어떤 비효율이 있는지 구체 서술.", "actions": ["즉시 실행: ROAS 측정 체계 구축(네이버·메타 광고 대시보드 설정)", "이번 달: 재방문율 추적 수단 마련(쿠폰·스탬프·CRM 중 1가지 즉시 도입)", "3개월: 경쟁사 채널·홍보 방식 벤치마킹 후 차별화 포인트 도출"], "resource": "네이버 스마트플레이스, 소진공 스마트화 바우처"},
    {"name": "3. 판매 시스템", "icon": "💰", "status": "취약|보통|강점 중 하나", "issue": "잠재 고객이 실제 구매로 이어지는 과정에서 어디서 막히는지 2~3문장 구체 서술.", "actions": ["즉시 실행 가능한 구체 액션 1", "구체 액션 2", "구체 액션 3"], "resource": "추천 도구·자료"},
    {"name": "4. 제품·서비스 시스템", "icon": "🛠️", "status": "취약|보통|강점 중 하나", "issue": "제품·서비스의 품질·일관성·개선 체계 현황과 문제점을 2~3문장 구체 서술.", "actions": ["즉시 실행 가능한 구체 액션 1", "구체 액션 2", "구체 액션 3"], "resource": "추천 도구·자료"},
    {"name": "5. 운영 시스템", "icon": "⚙️", "status": "취약|보통|강점 중 하나", "issue": "일상 운영에서 반복되는 비효율·병목 구체 서술. SOP 부재 확인 시 '표준 업무 절차서 없이 구두 지시 운영 — 인수인계·서비스 일관성 위험 존재' 문장을 포함.", "actions": ["즉시 실행: SOP 부재 확인 시 반복 업무 Top 3 선정 후 1페이지 체크리스트 즉시 작성", "구체 액션 2", "구체 액션 3"], "resource": "추천 도구·자료"},
    {"name": "6. 재무 시스템", "icon": "📊", "status": "취약|보통|강점 중 하나", "issue": "현금 런웨이 4축(통장 순잔고·카드 매출 비중·매출채권 회수일·배달 순마진) 진단 결과를 수치 기반으로 서술. 위험 축 2개 이상이면 '현금 생존 임계선 근접 — 즉각 유동성 확보 필요' 문장 포함. 자금 조달 필요 시 정책금융 4단계(소진공→신보→지자체→기업은행) 순서 명시.", "actions": ["즉시 실행: 런웨이 2개월 미만 시 소진공 긴급경영안정자금 신청 즉시 착수", "이번 달: 매출채권 60일 초과 시 주요 거래처 회수 일정표 + 조기 회수 인센티브 협의", "3개월: 월별 손익계산서·현금흐름표 셀프 작성 체계 구축"], "resource": "소진공 정책자금 / 지역 신용보증재단 / 기업은행 중소기업 전용 대출 / 세무사 월기장 계약"}
  ],
  "plan90days": [
    {"month": "1개월차", "theme": "기반 다지기 — 현금 런웨이 4축 점검 후 가장 급한 취약점 즉시 해결 (런웨이 2개월 미만 시 theme을 '현금 생존 우선 — 유동성 확보 긴급 실행'으로 교체)", "goal": "이 달 말까지 달성해야 할 구체적이고 측정 가능한 목표: 인과사슬 3축 데이터 수집 체계 구축(재방문율 측정 수단 도입 + ROAS 대시보드 설정 + 경쟁사 채널 3개 파악) + 현금 런웨이 개월 수 산출 완료", "actions": ["이번 주 당장: 현금 런웨이 4축(통장 잔고·카드 매출 비중·매출채권 회수일·배달 순마진) 수기 점검 후 런웨이 개월 수 계산. 2개월 미만이면 소진공 긴급경영안정자금 즉시 상담 예약.", "2주차: 재방문율(단골비율) 추적 수단 1가지 즉시 도입(스탬프 앱·쿠폰·예약 시스템 중 선택). 경쟁사 상위 3개 업체 채널·홍보 방식 현황 파악.", "3~4주차: ROAS 측정 대시보드 설정(네이버·메타 광고 전환추적 태그 설치). 입력값 기반 맞춤 업종 구체 액션."], "expectedResult": "최소: 재방문율·ROAS·경쟁인식 3가지 측정 기반 확보, 런웨이 현황 파악으로 자금 계획 수립 가능", "govSupport": "1순위: 소상공인시장진흥공단(소진공) 정책자금 상담 예약 / 2순위: 지역 신용보증재단 보증서 발급 상담"},
    {"month": "2개월차", "theme": "실행·검증 — 고객 반응 확인 및 매출 연결", "goal": "2개월차 구체 목표", "actions": ["구체 액션 1", "구체 액션 2", "구체 액션 3"], "expectedResult": "기대 효과", "govSupport": "소진공→신보→지자체→기업은행 순서로 해당 시기 신청 가능한 지원사업 명시"},
    {"month": "3개월차", "theme": "성장·반복 — 성공 패턴 고정화", "goal": "3개월차 구체 목표", "actions": ["구체 액션 1", "구체 액션 2", "구체 액션 3"], "expectedResult": "기대 효과", "govSupport": "지원사업 합격 기준: MVP 검증 데이터 + 명확한 타깃 + 6개월 내 추적 KPI 세 가지 갖춘 상태로 신청"}
  ]
}`;

  /* ── 2차 호출 전용 시스템 프롬프트 (실행플랜: KPI·로드맵·6시스템·90일플랜·린캔버스) ── */
  const _SYSTEM_EXEC = `[절대 규칙]
- 응답은 반드시 순수 JSON만 출력한다. 코드블록(\`\`\`) 사용 금지.
- 첫 글자는 반드시 { 이어야 한다.
- JSON 외 설명 텍스트 절대 금지.
- JSON이 완성되지 않으면 각 항목 내용을 줄여서라도 반드시 완성할 것.

당신은 30년 카드/금융 출신 경영지도사입니다. (삼성카드→하나은행→하나카드, AI지도사·ESG경영전문가·탄소중립지도사)
1차 분석(진단·전략)에서 도출된 핵심전략을 바탕으로, 구체적 실행 계획(KPI·로드맵·6시스템·90일플랜)과 비즈니스 모델 캔버스(린캔버스)를 작성합니다.
카드사 리스크 심사관이 보듯 냉정하게 — 현금 런웨이·정책금융 우선순위·인과사슬 3축이 실행플랜 전체에 반드시 녹아들어야 합니다.

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
    "keyMetrics": "비즈니스 건강 지표 3가지 — 반드시 재방문율(인과사슬 1축)과 ROAS(광고비 대비 매출, 인과사슬 2축) 포함. 현재값·목표값·측정 주기 명시",
    "unfairAdvantage": "모방 불가 경쟁 우위 (unfairAdvantage 입력값 반드시 반영)"
  }
}`;

  // 업종별 주요 폐업 원인 매핑 (도메인별 3가지)
  const INDUSTRY_CLOSURE_CAUSES = {
    restaurant:    { finance: '식재료비·임대료 현금흐름 압박', hr: '핵심 조리인력 이탈·인건비 과부하', bm: '고객 단가 하락·재방문 단절' },
    local_service: { finance: '임대료 대비 매출 마진 압박', hr: '원장 의존형 구조·핵심 직원 이탈', bm: '플랫폼 수수료 의존·신규 고객 유입 단절' },
    knowledge_it:  { finance: 'MRR 불규칙·개발비 선지출 부담', hr: '핵심 개발자 퇴사·R&R 불명확', bm: '계약 만료 후 재계약 실패·SaaS 경쟁사 대체' },
    construction:  { finance: '기성금 지연·공사대금 미수·흑자도산', hr: '안전사고·핵심 기술인력 이탈', bm: '수주 채널 1곳 집중·원가 초과 구조' },
    medical:       { finance: '비급여 수익 감소·높은 고정비', hr: '의료진 이탈·전문인력 채용 실패', bm: '재방문율 하락·입소문 단절' },
    education:     { finance: '수강료 단가 하락·시즌 매출 편중', hr: '스타 강사 의존·강사 이탈 시 수강생 유출', bm: '재등록율 하락·온라인 플랫폼 경쟁' },
    wholesale:     { finance: '재고 과잉·대금 회수 지연', hr: '영업 핵심인력 이탈', bm: '채널 집중도 과다·가격 경쟁 심화' },
    mfg_parts:     { finance: '원가 미파악·설비투자 부담', hr: '숙련 기술자 이탈·고령화', bm: '단일 거래처 의존·단가 인하 압박' },
    food_mfg:      { finance: '원재료 가격 급등·마진 압박', hr: 'HACCP 관리 인력 부족', bm: '유통 채널 편중·바이어 협상력 열위' },
    fashion:       { finance: '재고 리스크·시즌 편중 현금흐름', hr: '디자이너·MD 이탈', bm: 'D2C 전환 실패·플랫폼 수수료 부담' },
    media:         { finance: '프로젝트 단위 수익 불안정·선지출', hr: '핵심 크리에이터·PD 이탈', bm: 'IP 수익화 실패·광고 단가 하락' },
    logistics:     { finance: '고정비 과다·공차율 증가', hr: '기사 이탈·안전사고', bm: '단일 화주 의존·운임 협상력 열위' },
    energy:        { finance: '초기 투자금 회수 지연·정책 리스크', hr: '전문 엔지니어 확보 실패', bm: '인허가 지연·수주 Backlog 부족' },
    agri_food:     { finance: '원물 가격 변동·계절 현금흐름', hr: '가공 인력 수급 불안정', bm: '유통 채널 미확보·가격 경쟁' },
    export_sme:    { finance: '환율 리스크·수출 대금 회수 지연', hr: '해외 영업 전문인력 부족', bm: '바이어 채널 집중·인증 미비' },
    finance:       { finance: '금리 리스크·대손 충당금 부담', hr: '규제 전문인력 이탈', bm: 'LTV·CAC 비율 악화·고객 신뢰 하락' },
  };

  // 전체 업종 3년 평균 생존율 (통계청 기준)
  const ALL_INDUSTRY_AVG_Y3 = 39.6;

  function _buildSurvivalInsights(d, sv) {
    if (!sv) return '(생존율 데이터 없음 — 웹 검색으로 보완)';

    const lines = [];
    const industryKey = d.industryKey || d.industry || '';
    const foundedYear = parseInt(d.foundedYear, 10) || null;
    const currentYear = 2026;
    const yearsOld    = foundedYear ? currentYear - foundedYear : null;

    // 기본 수치
    lines.push(`업종: ${sv.name} / 출처: ${sv.source}`);
    lines.push(`1년 생존율: ${sv.y1}% / 3년 생존율: ${sv.y3}% / 5년 생존율: ${sv.y5}%`);
    lines.push(`업종 리스크 수준: ${sv.risk.label}`);
    lines.push('');

    // 시나리오 6: 전체 평균 대비 난이도
    const diffPct = Math.round((sv.y3 / ALL_INDUSTRY_AVG_Y3 - 1) * 100);
    if (diffPct < -5) {
      lines.push(`▶ 전체 업종 평균 대비 분석: ${sv.name} 3년 생존율(${sv.y3}%)은 전체 평균(${ALL_INDUSTRY_AVG_Y3}%) 대비 ${Math.abs(diffPct)}% 낮은 고난이도 업종임. 구조적 역풍을 안고 경쟁하는 상황이므로 SWOT 위협에 반드시 반영할 것.`);
    } else if (diffPct > 10) {
      lines.push(`▶ 전체 업종 평균 대비 분석: ${sv.name} 3년 생존율(${sv.y3}%)은 전체 평균(${ALL_INDUSTRY_AVG_Y3}%) 대비 ${diffPct}% 높은 상대적 안정 업종임. 단, 안정감이 위기 신호 둔감화로 이어지지 않도록 주의.`);
    }

    // 시나리오 1: 업력 → 생존 코호트 위치
    if (yearsOld !== null) {
      if (yearsOld >= 5) {
        lines.push(`▶ 업력 코호트 분석: ${sv.name} 5년 생존율 ${sv.y5}%인 업종에서 귀사 ${yearsOld}년 운영은 통계적으로 상위 생존 코호트에 해당함. 이 지속성 자체가 SWOT 강점 1순위 근거임.`);
      } else if (yearsOld >= 3) {
        lines.push(`▶ 업력 코호트 분석: 3년 생존 관문(${sv.y3}%)을 통과한 상태. 창업 3년차 탈락율 ${Math.round(100 - sv.y3)}%를 극복한 기업임.`);
      } else {
        lines.push(`▶ 업력 코호트 분석: 업력 ${yearsOld}년. 3년 생존 관문(${sv.y3}%)까지 ${3 - yearsOld}년 남음. 이 기간이 가장 높은 폐업 위험 구간임.`);
      }
    }

    // 시나리오 2: 생존 역설 (장기 운영 + 고위험 업종)
    if (yearsOld !== null && yearsOld >= 7 && sv.risk.level === 'high') {
      lines.push(`▶ 생존 역설 경고: 고위험 업종에서 ${yearsOld}년 운영 중. 과거 성공 패턴이 현재 시장 변화에 맞지 않을 때 7~10년차에 급격한 폐업 위험이 오히려 높아지는 구조임. 현재 운영 방식의 유효성을 재점검해야 함.`);
    }

    // 시나리오 3: 진단 점수 취약 영역 × 업종별 폐업 원인 연결
    const causes = INDUSTRY_CLOSURE_CAUSES[industryKey];
    const ds = d.domainScores || null;
    if (causes && ds) {
      const weakLinks = [];
      if (ds.finance !== undefined && ds.finance < 2.5) weakLinks.push(`재무역량(${ds.finance.toFixed(1)}점) — "${causes.finance}"`);
      if (ds.hr      !== undefined && ds.hr      < 2.5) weakLinks.push(`조직·인력역량(${ds.hr.toFixed(1)}점) — "${causes.hr}"`);
      if (ds.bm      !== undefined && ds.bm      < 2.5) weakLinks.push(`사업모델역량(${ds.bm.toFixed(1)}점) — "${causes.bm}"`);
      if (weakLinks.length > 0) {
        lines.push(`▶ 진단 점수 × 폐업 원인 연결 (즉시 처방 필요):`);
        weakLinks.forEach(function(w) { lines.push('  - ' + w); });
        lines.push(`  → 위 취약 영역은 ${sv.name} 폐업의 주요 원인과 직접 일치함. keyStrategies 최우선 전략으로 반드시 반영할 것.`);
      }
    }

    // 긴급 생존 모드 (risk.level === 'high')
    if (sv.risk.level === 'high') {
      lines.push('');
      lines.push(`⚠️ [긴급 생존 모드 강제 적용]`);
      lines.push(`3년 생존율 ${sv.y3}% — 폐업 고위험 업종 확인됨.`);
      lines.push(`→ plan90days 1개월차 theme을 "현금 생존 우선 — 런웨이 확보 긴급 실행"으로 강제할 것.`);
      lines.push(`→ sixSystems 재무 시스템 status를 "취약"으로 고정하고 긴급 유동성 확보 액션을 1순위로 배치할 것.`);
      lines.push(`→ keyStrategies 최우선 전략은 반드시 현금흐름 개선·고정비 절감·매출 즉시 회복 중 하나여야 함.`);
    }

    lines.push('');
    lines.push('▶ 활용 지침:');
    lines.push(`- SWOT 위협(Threats) 섹션에 "이 업종의 3년 생존율 ${sv.y3}%로 절반 이상이 3년 내 폐업" 문구를 구체적으로 인용할 것`);
    lines.push('- keyStrategies에서 가장 높은 우선순위 전략은 반드시 이 생존율 위협을 직접 타격하는 내용이어야 함');

    return lines.join('\n');
  }

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
    let prompt = `다음 기업 정보를 바탕으로 맞춤형 경영전략 분석 보고서를 작성해주세요.
입력된 정보를 최대한 분석에 반영하고, 일반론적 표현은 피해주세요.
${ d.isStartup ? `
⚠️ 창업 초기 기업 (개업 ${d.yearsInBusiness !== '' ? d.yearsInBusiness + '년' : '1년 미만'}) — 특별 분석 모드:
- 과거 실적 데이터가 없음을 전제. 진단 점수가 낮은 항목은 "데이터 부재"로 해석하고 위험으로 단정짓지 말 것.
- 전략의 핵심은 ①초기 계약·고객 확보 ②BEP 달성 기간 단축 ③현금 생존(Runway) 확보 ④조기 단골·레퍼런스 구축 순으로 집중.
- KPI는 '실적 기반'이 아닌 '이정표 기반'으로 설계: 첫 계약 체결일, BEP 달성 월, 초기 고객 N명 확보 등.
- 90일 플랜은 생존과 첫 매출 증명에 집중하고, 정부 창업지원사업 연계를 반드시 포함.` : '' }

## 1. 기업 기본 정보
- 회사명: ${d.companyName}
- 사업 규모: ${d.bizScale === 'micro' ? '소상공인 (직원 5명 이하 / 연매출 10억 미만) — 소상공인 특화 모드' : d.bizScale === 'sme' ? '소기업·중소기업 — 성장전략 모드' : '미입력'}
- 업태 (사업자등록증): ${d.bizType || d.industry || '미입력'}
- 종목 (사업자등록증): ${d.bizItem || '미입력'}
- AI 분류 업종: ${d.industryKey || d.industry || '미입력'}
- AI 사업 정의: ${d.aiBusinessDesc || '미입력'}
- 비즈니스 모델: ${d.bizModel || '미입력'}
- 설립연도: ${d.foundedYear || '미입력'} ${d.isStartup ? '(창업 초기)' : ''}
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
${ d.extraDiagArea ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⭐ 경영자 추가 진단 요청 (솔루션에서 반드시 구체적으로 다룰 것)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"${d.extraDiagArea}"

▶ 위 요청에 대해 keyStrategies 또는 sixSystems 중 적합한 위치에 직접 대응하는 전략·솔루션·실행 액션을 명시적으로 작성할 것. 일반론으로 넘기지 말 것.` : '' }
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
${ d.dxSignal === 'analog' ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ DX 탐지 시그널: 아날로그 중심 운영 확인 (진단에서 1~2점 선택)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→ SWOT 위협에 반드시 포함: "디지털 채널·도구 미활용으로 경쟁사 대비 운영 효율 격차 확대 위험"
→ keyStrategies 또는 sixSystems[marketing/operations]에 포함: CRM·POS·자동화 도구 도입을 3개월 내 1순위 액션으로 배치
→ plan90days 1단계: 업종 특화 디지털 도구 1개 이상 도입 액션 명시 (예: 외식→네이버 예약+배달앱 연동, 제조→MES/ERP lite, 서비스→카카오채널 CRM)` : '' }
${ d.ceoDependencySignal ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 대표자 의존도 복합 조건 감지: 직원 ${d.employees}명 있으나 의사결정이 대표에 집중
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→ sixSystems[operations] 섹션을 우선순위 1위로 배치
→ 핵심 액션: 핵심 3개 업무 SOP 1페이지 작성 + 직원별 R&R 명문화 (30일 내)
→ plan90days 1단계: 위임 체계 구축을 첫 번째 실행 항목으로 배치 (대표 부재 시 업무 지속 테스트 포함)` : '' }
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
11. 현재 신청 가능한 정부지원사업 (기업마당)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${(function() {
  const progs = d.bizinfoPrograms || (typeof window !== 'undefined' && window._bizinfoPrograms) || [];
  if (!progs.length) return '(지원사업 데이터 없음 — 웹 검색으로 보완)';
  const lines = progs.slice(0, 5).map(function(p, i) {
    const dDay = (p.dDay !== null && p.dDay !== undefined) ? p.dDay : null;
    const urgency = dDay !== null && dDay <= 14
      ? ' 🚨 마감 ' + dDay + '일 이내 — 즉시 신청 필요'
      : dDay !== null && dDay <= 30
        ? ' ⚠️ D-' + dDay
        : '';
    return (i+1) + '. [' + (p.type || '지원') + '] ' + p.name + urgency +
      '\n   기관: ' + (p.org || '') +
      '\n   지원금액: ' + (p.amount || '확인 필요') +
      '\n   신청기간: ' + (p.period || '확인 필요');
  });
  return lines.join('\n\n') +
    '\n\n▶ 활용 지침:\n' +
    '- keyStrategies 또는 roadmap 1단계에 위 지원사업 중 가장 적합한 1~2개를 구체적으로 인용할 것\n' +
    '- 예: "○○바우처 신청 → 디지털 전환 비용 자부담 최소화" 형태로 실행 액션에 포함\n' +
    '- 신청 기간이 임박한 사업은 "즉시 신청 필요" 강조';
})()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
12. 동종업계 경영 패턴 (실태조사 기반)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${(function() {
  if (typeof PatternDB !== 'undefined' && d.domainScores) {
    return PatternDB.buildPromptBlock(d);
  }
  return '(패턴 DB 데이터 없음 — 업종 일반 데이터 기반으로 작성)';
})()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
13. 업종 생존율 × 귀사 현황 교차 인사이트 (통계청 KOSIS 기반)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${_buildSurvivalInsights(d, d.survivalData || (typeof window !== 'undefined' && window._kosisSurvival) || null)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
★ 1차 호출 응답 범위 (반드시 준수) ★
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
이번 응답에는 executiveSummary, swot, stp, fourP, keyStrategies, specializedAnalysis 6개 필드만 포함하세요.
kpi, roadmap, sixSystems, plan90days, leanCanvas는 포함하지 마세요. (2차 호출에서 별도로 더 깊이 작성합니다)`;

    if (typeof window !== 'undefined' && window.DiagCommon && d.diagScores) {
      const commonSummary = DiagCommon.buildPromptSummary(d.diagScores);
      prompt += '\n\n' + commonSummary;
    }
    if (d.bizScale === 'micro' && d.microPrompt) {
      prompt += '\n\n' + d.microPrompt;
    } else if (d.bizScale === 'sme' && d.smePrompt) {
      prompt += '\n\n' + d.smePrompt;
    }

    return prompt;
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

${(function() {
  const sv = d.survivalData || (typeof window !== 'undefined' && window._kosisSurvival) || null;
  if (!sv) return '';
  return `## 업종 생존율 위험 등급 (1차 분석 인계)
${sv.name || '해당 업종'} — 3년 생존율 ${sv.y3}% (${sv.risk ? sv.risk.label : ''})
→ 실행플랜(plan90days)의 1개월차 액션과 govSupport가 이 위험 수준에 비례한 긴급도를 유지할 것.
→ sixSystems 재무 시스템 액션은 생존율 위협 해소를 최우선 과제로 다룰 것.`;
})()}

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

  async function callClaude(formData) {
    // JSON 수리: trailing comma 제거 (Claude가 자주 생성하는 비표준 패턴)
    function repairJSON(str) {
      return str.replace(/,\s*([}\]])/g, '$1');
    }

    // JSON 파싱 헬퍼 — 4단계 시도
    function extractJSON(text) {
      // 1. { 시작 ~ } 끝 추출 (코드블록 감쌈 여부 무관)
      const s = text.indexOf('{');
      const e = text.lastIndexOf('}');
      if (s === -1 || e <= s) return null;
      const raw = text.substring(s, e + 1);

      // 2. 직접 파싱
      try { return JSON.parse(raw); } catch (_) {}

      // 3. trailing comma 제거 후 재시도
      try { return JSON.parse(repairJSON(raw)); } catch (_) {}

      // 4. 코드블록 그리디 추출 후 시도 (Claude가 ```json ... ``` 으로 감쌀 때)
      const cb = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (cb) {
        const inner = cb[1].substring(cb[1].indexOf('{'), cb[1].lastIndexOf('}') + 1);
        try { return JSON.parse(inner); } catch (_) {}
        try { return JSON.parse(repairJSON(inner)); } catch (_) {}
      }

      return null;
    }

    // /api/claude-analyze-1|2 프록시 호출 헬퍼 (1차·2차 별도 함수로 분리 — 60초 타임아웃 방지)
    async function apiCall(systemPrompt, userPrompt, _callLabel) {
      const endpoint = _callLabel === '1차' ? '/api/claude-analyze-1' : '/api/claude-analyze-2';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt, userPrompt }),
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
    const _t1Start = Date.now();
    const text1 = await apiCall(SYSTEM, buildPrompt1(formData), '1차');
    console.log(`[TIMING] 클라이언트 — 1차 호출 왕복: ${Date.now() - _t1Start}ms`);
    console.log('1차 응답 (처음 400자):', text1.substring(0, 400));
    const result1 = extractJSON(text1);
    if (!result1) throw new Error('1차 분석 JSON 파싱 실패: ' + text1.substring(0, 200));

    // ── 2차 호출: 실행플랜 (KPI·로드맵·6시스템·90일플랜·린캔버스)
    console.log('[BizNavi] 2차 분석 시작 — 실행플랜...');
    const _t2Start = Date.now();
    const text2 = await apiCall(_SYSTEM_EXEC, buildPrompt2(formData, result1), '2차');
    console.log(`[TIMING] 클라이언트 — 2차 호출 왕복: ${Date.now() - _t2Start}ms`);
    console.log('2차 응답 (처음 400자):', text2.substring(0, 400));
    const result2 = extractJSON(text2);
    if (!result2) throw new Error('2차 실행플랜 JSON 파싱 실패: ' + text2.substring(0, 200));

    // ── 병합: 1차 전략 + 2차 실행플랜 (1차 키 보호 — 2차가 덮어쓰지 않도록)
    const FIRST_PASS_KEYS = ['executiveSummary', 'swot', 'stp', 'fourP', 'keyStrategies', 'specializedAnalysis'];
    const r2Clean = Object.fromEntries(
      Object.entries(result2).filter(([k]) => !FIRST_PASS_KEYS.includes(k))
    );
    return Object.assign({}, result1, r2Clean);
  }

  function _fakeByConsultingType(d, co, ind, bm, comp, tl, cs) {
    const ct = d.consultingType || '';
    if (!ct) return {};

    if (ct === 'growth_strategy') {
      return {
        keyStrategies: [
          { title: '핵심 고객 LTV 극대화', description: `[진단] ${co}의 현재 매출이 신규 고객 확보에만 의존하고 기존 고객의 재구매·업셀링 기회를 놓치고 있습니다. 신규 고객 획득 비용은 기존 고객 유지 비용의 5배입니다. [방침] 기존 고객의 생애가치(LTV)를 3개월 내 30% 높이는 것을 최우선 성장 동력으로 삼습니다. [행동] ①기존 고객 전수 연락 — 추가 니즈 파악(이번 달) ②고가 패키지 or 유지보수 계약 제안 ③재구매 루틴(정기 연락·기념일 마케팅) 설계`, priority: 'high', owner: '영업 담당', timeline: '1~3개월' },
          { title: '신규 영업 채널 1개 개척', description: `[진단] ${co}의 신규 고객 유입이 기존 채널 1~2개에 집중돼 있어 채널 리스크와 성장 한계가 동시에 존재합니다. [방침] 비용 대비 효율이 검증된 신규 채널 1개를 60일 내 활성화합니다. [행동] ①파트너십 제휴(보완 업종과 교차 추천) ②B2B 직접 영업(타겟 기업 리스트 20개 작성) ③온라인 플랫폼 입점(업종 맞춤) 중 1가지 선택·집중`, priority: 'high', owner: '영업·마케팅 담당', timeline: '2~3개월' },
          { title: '단가 상향 — 가치 기반 가격 재설계', description: `[진단] 현재 ${co}의 가격이 원가+마진 방식으로 설정되어 고객이 받는 가치 대비 저평가된 상태입니다. 가격을 20% 올리면 물량 증가 없이 동일한 매출 증대 효과를 냅니다. [방침] 프리미엄 패키지를 만들어 평균 단가를 20% 이상 높입니다. [행동] ①상위 20% 고객 인터뷰 — 진짜 가치 파악 ②프리미엄 패키지 설계(기본형+프리미엄형 분리) ③기존 고객부터 업셀링 시도`, priority: 'high', owner: '대표·영업', timeline: '2~3개월' },
          { title: '반복 매출 모델 구축', description: `[진단] ${co}의 매출이 매월 처음부터 다시 벌어야 하는 단발성 구조여서 성장이 누적되지 않고 예측도 어렵습니다. [방침] 월 고정 수입이 발생하는 구독·유지보수·정기계약 모델을 기존 사업에 추가합니다. [행동] ①기존 고객에게 "정기관리 계약" or "구독형" 패키지 시범 제안(이번 달) ②월 10~30만원 구간 소액 정기 서비스 설계 ③3개월 내 정기 고객 5명 이상 확보`, priority: 'medium', owner: '대표·영업', timeline: '2~4개월' },
          { title: '성장 타겟 세분화 — 최우선 고객 집중', description: `[진단] 현재 ${co}가 "모든 고객에게 좋은 것"을 추구하다 보니 마케팅·영업 메시지가 분산되고 자원이 희박하게 퍼져 있습니다. [방침] 성장 기여도가 가장 높은 고객 세그먼트 1개에 3개월간 집중합니다. [행동] ①기존 고객 RFM 분석(최근 거래·빈도·금액) → 상위 20% 프로파일링 ②유사 잠재 고객 타겟 리스트 30개 작성 ③해당 타겟만을 위한 맞춤 제안서·메시지 설계`, priority: 'medium', owner: '마케팅 담당', timeline: '2~4개월' },
          { title: '영업 파이프라인 시스템 구축', description: `[진단] 영업 기회가 머릿속 혹은 메모에만 존재해 팔로우업 타이밍을 놓치고, 어느 단계에서 계약이 성사되는지 모르는 상태가 지속됩니다. [방침] CRM으로 영업 파이프라인을 가시화하고 매주 진행 상황을 점검합니다. [행동] ①HubSpot CRM 무료 도입 + 현재 진행 중 영업 기회 전부 입력(이번 주) ②단계별 영업 스크립트 표준화(1개월) ③주 1회 파이프라인 리뷰 미팅 루틴(지속)`, priority: 'low', owner: '영업 담당', timeline: '1~2개월' }
        ],
        kpi: [
          { metric: '월 매출 성장률', current: '0~5%', target: '월 10% 이상', timeline: tl, progress: 30, method: '전월 대비 월 매출 변화율', owner: '대표·재무' },
          { metric: '신규 고객 월 획득 수', current: '1~2건', target: '월 5건 이상', timeline: '3개월', progress: 20, method: 'CRM 신규 계약 건수', owner: '영업 담당' },
          { metric: '고객 LTV (생애가치)', current: '파악 안됨', target: '현재 대비 30% 향상', timeline: tl, progress: 0, method: '고객 평균 계약 금액 × 평균 계약 기간', owner: '재무 담당' },
          { metric: '평균 계약 단가', current: '현재 수준', target: '20% 상향', timeline: '3개월', progress: 0, method: '총 매출 / 계약 건수', owner: '영업 담당' },
          { metric: '반복 매출(구독·유지보수) 비중', current: '0~10%', target: '전체 매출의 30% 이상', timeline: tl, progress: 10, method: '월 고정 계약 매출 / 전체 매출', owner: '대표' },
          { metric: '영업 파이프라인 금액', current: '추적 없음', target: '월 매출 목표의 3배 이상', timeline: '2개월', progress: 0, method: 'CRM 진행 중 영업 기회 합산 금액', owner: '영업 담당' },
          { metric: '신규 채널 매출 비중', current: '0%', target: '전체 매출의 15% 이상', timeline: tl, progress: 0, method: '신규 채널 매출 / 전체 매출', owner: '마케팅 담당' },
          { metric: '고객 재구매율', current: '30% 미만', target: '50% 이상', timeline: tl, progress: 30, method: '재구매 고객 수 / 전체 고객 수', owner: '영업 담당' },
          { metric: '고객 획득 비용 (CAC)', current: '파악 안됨', target: '현재 대비 30% 절감', timeline: tl, progress: 0, method: '마케팅·영업 비용 / 신규 고객 수', owner: '마케팅 담당' },
          { metric: '월 매출 목표 달성률', current: '측정 안됨', target: '월 목표의 90% 이상', timeline: '분기', progress: 0, method: '실제 매출 / 월 매출 목표', owner: '대표·재무' }
        ],
        sixSystems: [
          { name: '1. 리더십 시스템', icon: '👑', status: '보통',
            issue: `성장을 위해서는 대표가 직접 영업하는 구조에서 벗어나 팀이 자율적으로 성장을 만들어가는 체계로 전환이 필요합니다. ${co}의 성장 목표가 팀에 명확히 공유되지 않으면 각자 다른 우선순위로 움직여 성장 에너지가 분산됩니다.`,
            actions: [
              `[이번 주] 팀 전체에 3개월 성장 목표(매출·신규 고객 수) 공유 + 각자 기여 방식 토론`,
              `[이번 달] 주간 성과 리뷰 미팅 설정 — 파이프라인·매출 현황 10분 공유`,
              `[3개월] 성과 달성 시 팀 보상 체계 설계 — 목표 달성 인센티브로 성장 동기 강화`
            ],
            resource: '중소기업 성장 전략 컨설팅 (중진공), 경영지도사 성장 전략 멘토링 (소진공)' },
          { name: '2. 마케팅 시스템', icon: '📣', status: '취약',
            issue: `현재 마케팅이 일관된 타겟과 메시지 없이 운영되어 고객 획득 비용이 높고 전환율이 낮습니다. ${ind} 업종에서 성장하는 기업들은 타겟 고객 1개 세그먼트에 집중하는 채널 전략을 갖추고 있습니다.`,
            actions: [
              `[이번 달] 성장 기여 상위 고객 20% 프로파일링 → 타겟 세그먼트 1개 확정 → 맞춤 메시지 작성`,
              `[2개월] 타겟 채널 1개 집중 테스트(네이버 광고 or SNS or 파트너십) + 고객 획득 단가(CAC) 측정`,
              `[3개월] CAC가 LTV의 1/3 이하인 채널 확정 → 예산 집중 + 나머지 채널 비중 축소`
            ],
            resource: '소상공인 온라인 마케팅 지원 (소진공), 중소기업 디지털 마케팅 바우처 (중진공)' },
          { name: '3. 판매 시스템', icon: '💰', status: '취약',
            issue: `영업 기회가 파이프라인으로 관리되지 않아 팔로우업 타이밍을 놓치고, 어느 단계에서 성사·이탈이 일어나는지 파악이 안 됩니다. 체계적 영업 프로세스 없이는 매출 성장의 상한선이 대표의 시간·에너지에 묶입니다.`,
            actions: [
              `[이번 주] CRM 도입(HubSpot 무료) + 진행 중 영업 기회 전부 입력 → 파이프라인 가시화`,
              `[이번 달] 계약 성사 고객 3명 인터뷰 — 결정 요인 파악 → 영업 스크립트 개선`,
              `[3개월] 단계별 전환율 측정 → 이탈 구간 집중 개선 → 월 신규 고객 5건 달성`
            ],
            resource: 'KOTRA 수출·국내 영업 컨설팅, 소상공인 영업 역량 강화 교육 (소진공)' },
          { name: '4. 제품·서비스 시스템', icon: '🛠️', status: '보통',
            issue: `현재 제품·서비스 라인업이 단일 가격대에 집중돼 있어 고가 고객의 니즈를 충족시키지 못하고 업셀링 기회를 놓치고 있습니다. 성장하는 기업은 "기본형+프리미엄형+맞춤형" 3단계 구조로 단가 상향과 고객 세분화를 동시에 달성합니다.`,
            actions: [
              `[이번 달] 기존 서비스를 기본·표준·프리미엄 3단계로 재패키징 — 프리미엄은 현재 단가 1.5~2배`,
              `[2개월] 기존 고객 상위 20%에게 프리미엄 패키지 업셀링 시도 — 5명 이상 전환 목표`,
              `[3개월] 반복 매출형 유지보수·관리 계약 상품 추가 — 월 정기 결제 구조 설계`
            ],
            resource: '중소기업 제품 개발 지원 (중소벤처부), 소상공인 패키지 개발 컨설팅 (소진공)' },
          { name: '5. 운영 시스템', icon: '⚙️', status: '보통',
            issue: `현재 운영 체계가 현재 규모에는 적합하지만 매출이 50% 이상 증가할 때 병목이 발생할 구조입니다. 성장 준비 없이 매출만 늘면 품질 저하와 고객 이탈이 동시에 발생해 성장이 역효과가 됩니다.`,
            actions: [
              `[이번 달] 핵심 업무 프로세스 5개 문서화 — 대표 없이도 처리 가능한 수준으로 표준화`,
              `[2개월] 업무량 50% 증가 시뮬레이션 — 병목 구간 파악 + 사전 대응 계획 수립`,
              `[3개월] 성장 목표 달성 시 필요한 인력 or 자동화 도구 확보 계획 수립`
            ],
            resource: '중소기업 스마트화 지원 (중진공), 소상공인 스마트 공장 지원 (소진공)' },
          { name: '6. 재무 시스템', icon: '📊', status: '보통',
            issue: `성장 투자(마케팅·인력·시스템)가 BEP를 초과하는지, 투자 회수 기간이 얼마나 되는지 계산 없이 감으로 결정되고 있습니다. 성장 투자는 ROI가 검증된 영역에만 집중해야 효율이 납니다.`,
            actions: [
              `[이번 주] 채널별 고객 획득 비용(CAC)과 고객 LTV 계산 — "어느 채널이 진짜 남는가" 파악`,
              `[이번 달] 성장 투자 예산 책정 — 월 매출의 10~15%를 마케팅·성장 투자로 배분`,
              `[3개월] 분기별 성장 투자 ROI 리뷰 — 효과 없는 채널 즉시 중단, 효과 있는 채널 예산 2배`
            ],
            resource: '중소기업 성장사다리 펀드 (중진공), 소상공인 정책자금 성장경영자금 (소진공)' }
        ],
        plan90days: [
          {
            month: '1개월차',
            theme: '기존 고객 LTV 극대화 + 영업 시스템 구축',
            goal: '기존 고객 전수 연락 완료 + 업셀링 3건 이상 + CRM 파이프라인 구축',
            actions: [
              `[1주차] CRM 도입(HubSpot 무료) + 현재 고객·진행 중 영업 기회 전부 입력 → 파이프라인 가시화`,
              `[2주차] 기존 고객 전수 연락 — 추가 니즈 파악 + 프리미엄 패키지·유지보수 계약 제안`,
              `[3~4주차] 고객 RFM 분석 → 상위 20% 프로파일링 → 신규 채널 1개 선정 + 테스트 준비`
            ],
            expectedResult: '업셀링 3건 이상, CRM 파이프라인 구축, 신규 채널 1개 선정',
            govSupport: '소상공인 성장촉진 지원사업 (소진공), 중소기업 판로 개척 지원 (중진공)'
          },
          {
            month: '2개월차',
            theme: '신규 채널 활성화 + 단가 상향 실행',
            goal: '신규 채널 1개 가동 + 프리미엄 패키지 출시 + 월 신규 고객 3건 이상',
            actions: [
              `신규 채널 정식 가동 — 월 예산 설정 + 성과 측정 지표 확정 (파트너십 or 온라인 플랫폼)`,
              `프리미엄 패키지 런칭 — 기존 고객 상위 20%에게 업셀링 + 신규 고객 유치에 활용`,
              `주간 영업 파이프라인 리뷰 미팅 루틴 — 막힌 단계 집중 개선 + 팔로우업 자동 알림 설정`
            ],
            expectedResult: '신규 채널 매출 발생, 프리미엄 계약 5건 이상, 평균 단가 10% 상향',
            govSupport: '중소기업 수출 마케팅 지원 (KOTRA), 소상공인 온라인 판로 지원 (소진공)'
          },
          {
            month: '3개월차',
            theme: '반복 매출 모델 정착 + 성장 속도 가속',
            goal: '반복 매출 전체의 20% 달성 + 월 신규 고객 5건 + 영업 파이프라인 3배 확대',
            actions: [
              `정기 계약·구독 모델 공식 출시 — 기존 고객 대상 전환 제안 + 신규 고객 첫 가입 프로모션`,
              `3개월 성과 리뷰 — CAC·LTV·채널별 ROI 분석 → 효과 없는 채널 중단, 효과 있는 채널 2배 투자`,
              `다음 분기 성장 계획 수립 — 목표 매출 + 필요 인력·시스템 확보 계획`
            ],
            expectedResult: '월 매출 성장률 10% 이상, 반복 매출 20% 달성, 다음 분기 성장 계획 완성',
            govSupport: '창업성장기술개발사업, 중소기업 혁신바우처 (중소벤처부)'
          }
        ]
      };
    }

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
            expectedResult: `온라인 검색에서 ${co} 발견 시작, CRM에 고객 20명 이상 데이터 적재, 팔로우업 놓치는 건수 0`,
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

    if (ct === 'structure_strategy') {
      return {
        keyStrategies: [
          { title: '핵심 업무 SOP 매뉴얼화', description: `[진단] ${co}의 핵심 업무가 특정 인력의 경험과 기억에만 의존하여 담당자 이탈 시 업무 공백이 발생하고 품질 편차가 큽니다. [방침] 핵심 업무 10가지를 90일 내 표준화된 SOP(표준 업무 절차서)로 문서화합니다. [행동] ①가장 반복적인 업무 10가지 선정(이번 주) ②각 업무를 누가 봐도 따라할 수 있는 단계별 문서 작성(이번 달) ③신규 직원 온보딩 시 SOP 기반 교육 루틴 적용`, priority: 'high', owner: '대표·팀장', timeline: '1~3개월' },
          { title: 'R&R 명확화 + 권한 위임', description: `[진단] 직원들이 "이건 내 일인가 아닌가"가 불분명해 일 처리가 느리고 대표에게 모든 결정이 몰립니다. 대표 의존도가 높은 구조는 성장의 가장 큰 병목입니다. [방침] 각 직원의 역할·책임·권한 범위를 명확히 정의하고 의사결정을 위임합니다. [행동] ①직원별 R&R 정의서 작성(이번 달) ②각자 결정할 수 있는 일의 범위 명시(예: 10만원 이하 지출 담당자 결재) ③월 1회 R&R 점검·조정 미팅`, priority: 'high', owner: '대표', timeline: '1~2개월' },
          { title: '채용·온보딩 시스템 구축', description: `[진단] 현재 채용이 "필요할 때 아는 사람"에 의존하여 역량 미스매치와 이른 퇴사가 반복됩니다. 온보딩 체계도 없어 신규 직원이 자리잡는 데 3개월 이상 걸립니다. [방침] 직무별 채용 기준서 + 30일 온보딩 프로그램을 만들어 채용 성공률을 높입니다. [행동] ①주요 직무 3개 채용 기준서 작성(이번 달) ②30일 온보딩 체크리스트 제작(이번 달) ③시용 기간 평가 기준 명확화`, priority: 'high', owner: '대표·인사 담당', timeline: '2~3개월' },
          { title: '성과 측정 체계 + KPI 대시보드', description: `[진단] 직원들이 무엇을 잘하는지, 어떤 기여를 하는지 측정 기준이 없어 피드백이 주관적이고 동기부여도 어렵습니다. [방침] 팀·개인별 핵심 지표(KPI) 3~5개를 정하고 주간 현황판으로 공유합니다. [행동] ①팀별 핵심 성과 지표 3개 선정(이번 달) ②구글 스프레드시트 주간 KPI 현황판 제작 ③월 1회 성과 리뷰 + 피드백 미팅 루틴`, priority: 'medium', owner: '대표·팀장', timeline: '2~3개월' },
          { title: '대표 의존도 감소 — 권한 이양 로드맵', description: `[진단] 대표가 없으면 의사결정이 멈추고, 대표가 있어도 모든 일이 몰려 전략적 사고를 할 여유가 없습니다. 이 구조가 지속되면 대표도 지치고 조직도 성장하지 못합니다. [방침] 6개월 내 대표 업무의 50%를 팀에 위임하는 구체적 로드맵을 실행합니다. [행동] ①현재 대표 업무 전수 목록화 → "위임 가능/불가" 분류(이번 달) ②위임 가능 업무별 담당자 지정 + 교육(2개월) ③대표는 "전략·외부 관계·핵심 판단"만 집중하는 구조로 전환`, priority: 'medium', owner: '대표', timeline: '3~6개월' },
          { title: '외부 전문가 활용 — 아웃소싱 최적화', description: `[진단] ${co}에서 내부 역량이 부족한 업무(세무·법무·IT·디자인·마케팅)를 비효율적으로 직접 처리하거나 고정 인건비로 유지하고 있습니다. [방침] 핵심 역량은 내재화하고 비핵심은 전문 외부 파트너에게 맡겨 비용 효율과 품질을 동시에 높입니다. [행동] ①내부 vs 외부 처리 업무 재분류(이번 달) ②외부 전문가 파트너 3곳 계약(세무사·법무사·IT개발자) ③분기마다 파트너 성과 평가 + 교체 기준 명확화`, priority: 'low', owner: '대표·운영 담당', timeline: '2~4개월' }
        ],
        kpi: [
          { metric: 'SOP 문서화 완료 업무 수', current: '0개', target: '핵심 업무 10개 완료', timeline: '3개월', progress: 0, method: '완성된 SOP 문서 수', owner: '운영 담당' },
          { metric: '대표 의사결정 집중도', current: '전체 결정의 90%+', target: '전체 결정의 50% 이하', timeline: tl, progress: 10, method: '대표 결재 건수 / 전체 의사결정 건수', owner: '대표' },
          { metric: '신규 직원 온보딩 기간', current: '3개월 이상', target: '30일 이내 독립 업무 처리', timeline: '3개월', progress: 0, method: '온보딩 완료 체크리스트 충족 일수', owner: '인사 담당' },
          { metric: '핵심 인력 이탈률', current: '파악 안됨', target: '연간 10% 이하', timeline: tl, progress: 70, method: '연간 퇴사 인원 / 전체 인원', owner: '대표' },
          { metric: '고객 컴플레인 건수', current: '월 파악 안됨', target: '현재 대비 50% 감소', timeline: tl, progress: 20, method: '월간 고객 컴플레인 건수', owner: '운영 담당' },
          { metric: '팀 KPI 달성률', current: '측정 안됨', target: '팀 KPI 3개 중 2개 이상 달성', timeline: '분기', progress: 0, method: '설정 KPI 대비 달성 수', owner: '팀장' },
          { metric: '외주 비용 최적화율', current: '미측정', target: '비핵심 업무 외주 비용 20% 절감', timeline: tl, progress: 0, method: '외주 재계약 후 비용 변화율', owner: '재무 담당' },
          { metric: '대표 전략적 업무 시간 비중', current: '20% 미만', target: '주 20시간 이상', timeline: tl, progress: 20, method: '주간 업무 시간 기록 기준', owner: '대표' },
          { metric: '업무 표준화 적용 비율', current: '0%', target: '핵심 업무 80% 이상', timeline: tl, progress: 0, method: 'SOP 완비 업무 수 / 전체 핵심 업무 수', owner: '운영 담당' },
          { metric: '직원 만족도 (eNPS)', current: '측정 안됨', target: '30점 이상', timeline: '분기', progress: 0, method: '분기별 eNPS 설문 결과', owner: '대표' }
        ],
        sixSystems: [
          { name: '1. 리더십 시스템', icon: '👑', status: '위험',
            issue: `대표가 모든 의사결정과 문제 해결에 직접 개입해야 하는 구조로, 조직이 성장할수록 대표의 과부하와 팀의 수동성이 심화됩니다. ${co}의 대표가 전략·성장보다 일상 운영에 갇혀 있으면 조직 전체가 현재 수준에 묶입니다.`,
            actions: [
              `[이번 달] 대표 업무 전수 목록화 → "위임 가능 vs 대표만 가능" 2가지로 분류`,
              `[2개월] 위임 가능 업무 TOP 5를 팀장·담당자에게 순차적으로 이양 + 결재 권한 범위 문서화`,
              `[3개월] 대표는 주 4시간 이상을 전략·외부 파트너십·성장 기획에만 사용하는 구조 확립`
            ],
            resource: '중소기업 CEO 역량 강화 교육 (중진공), 경영지도사 조직 컨설팅 (소진공 무료)' },
          { name: '2. 마케팅 시스템', icon: '📣', status: '보통',
            issue: `마케팅이 대표 혹은 특정 담당자 개인 역량에 의존하고 있어 담당자 부재 시 마케팅이 멈춥니다. 체계적인 마케팅 캘린더와 콘텐츠 생산 루틴이 없어 일관성이 부족합니다.`,
            actions: [
              `[이번 달] 월간 마케팅 캘린더 제작 — 채널별 발행 일정·담당자·형식 명확화`,
              `[2개월] 콘텐츠 재활용 가이드라인 작성 — 1개 콘텐츠를 5가지 형식으로 변환하는 루틴`,
              `[3개월] 마케팅 성과 지표(유입·전환·CAC) 월간 리뷰 + 담당자 독립 운영 체계 확립`
            ],
            resource: '중소기업 마케팅 인력 지원 (중진공), 콘텐츠 제작 바우처 (중소벤처부)' },
          { name: '3. 판매 시스템', icon: '💰', status: '취약',
            issue: `영업 방식과 협상 노하우가 대표 혹은 특정 영업자에게만 있어 이 사람이 없으면 영업이 사실상 멈춥니다. 영업 스크립트·제안서 템플릿·가격 기준이 없어 매번 새로 만들어야 합니다.`,
            actions: [
              `[이번 달] 성공한 영업 사례 5개 분석 → 공통 성공 요인 추출 → 영업 스크립트 표준화`,
              `[2개월] 제안서 템플릿·가격 기준표·FAQ 문서화 → 어떤 직원도 사용 가능한 영업 키트 완성`,
              `[3개월] 영업 키트 기반 신규 영업 담당자 1명 독립 영업 가능 수준으로 육성`
            ],
            resource: 'KOTRA 영업 전략 컨설팅, 소상공인 영업 역량 강화 교육 (소진공)' },
          { name: '4. 제품·서비스 시스템', icon: '🛠️', status: '보통',
            issue: `서비스 품질이 담당자에 따라 편차가 크고, 표준화된 납품·완료 기준이 없어 고객 불만과 재작업이 반복됩니다. QC(품질 관리) 체계가 없으면 규모 확대 시 품질 문제가 증폭됩니다.`,
            actions: [
              `[이번 달] 서비스 납품 기준·완료 체크리스트 작성 — "이것만 하면 합격" 기준 명확화`,
              `[2개월] 고객 납품 전 내부 QC 단계 추가 — 팀장 or 시니어가 최종 확인하는 루틴`,
              `[3개월] 고객 완료 후 30일 피드백 수집 루틴 + 불만 유형별 개선 DB 구축`
            ],
            resource: '중소기업 품질 혁신 지원 (중소벤처부), ISO 인증 지원 (중진공)' },
          { name: '5. 운영 시스템', icon: '⚙️', status: '취약',
            issue: `업무가 특정 인력의 경험과 기억에만 저장되어 있어 이탈 시 업무 공백이 발생하고 신규 인력 적응이 느립니다. 프로세스가 없으면 규모가 커질수록 혼란이 기하급수적으로 증가합니다.`,
            actions: [
              `[이번 주] 가장 반복적인 업무 10가지 선정 → 각 업무의 담당자·소요 시간·의존 도구 목록화`,
              `[이번 달] SOP(표준 업무 절차서) 우선순위 순으로 5개 먼저 작성 — 사진·영상·단계별 설명 포함`,
              `[3개월] 전체 10개 SOP 완성 → 신규 직원 온보딩 교재로 즉시 활용 + 분기별 업데이트 루틴`
            ],
            resource: '중소기업 스마트 공정 지원 (중소벤처부), 소상공인 운영 효율화 컨설팅 (소진공)' },
          { name: '6. 재무 시스템', icon: '📊', status: '보통',
            issue: `재무 현황 파악이 특정 담당자(대표·경리)에게만 집중되어 있어 경영 의사결정에 필요한 재무 데이터를 적시에 얻기 어렵습니다. 월 결산·주간 현금 현황이 자동화되지 않아 재무 가시성이 낮습니다.`,
            actions: [
              `[이번 달] 주간 현금 현황표 + 월 손익 요약표 양식 표준화 → 담당자 교육 후 루틴화`,
              `[2개월] 회계 프로그램(더존·세금계산서 발행) 표준화 + 세무사 월 결산 루틴 확립`,
              `[3개월] 분기별 재무 리뷰 미팅 — 대표·팀장 모두 재무 현황 이해하는 재무 투명화 체계`
            ],
            resource: '중소기업 재무 진단 서비스 (중진공), 소상공인 세무 컨설팅 (소진공 무료)' }
        ],
        plan90days: [
          {
            month: '1개월차',
            theme: '핵심 업무 SOP 작성 + R&R 명확화',
            goal: 'SOP 5개 완성 + 직원별 R&R 정의서 작성 + 결재 권한 위임 1단계 시행',
            actions: [
              `[1주차] 대표 업무 전수 목록화 + 핵심 업무 10개 선정 + 위임 가능/불가 분류`,
              `[2주차] 직원별 R&R 정의서 초안 작성 → 팀 미팅에서 합의·확정 → 결재 권한 범위 공유`,
              `[3~4주차] 우선순위 SOP 5개 작성 완료 + 30일 온보딩 체크리스트 초안 완성`
            ],
            expectedResult: 'SOP 5개 완성, R&R 정의서 전 직원 동의, 결재 권한 1단계 위임',
            govSupport: '소상공인 경영 컨설팅 (소진공 무료), 경영지도사 조직 진단 (무료 상담)'
          },
          {
            month: '2개월차',
            theme: '시스템 현장 적용 + 대표 위임 확대',
            goal: 'SOP 10개 완성 + 위임 업무 3개 이상 완전 이관 + KPI 대시보드 가동',
            actions: [
              `SOP 나머지 5개 완성 + 전 직원 SOP 교육 → "SOP대로 했는데 문제가 생기면?" 프로세스 보완 루틴`,
              `팀별 KPI 3개 확정 + 주간 KPI 현황판(구글 스프레드시트) 가동 + 첫 번째 성과 리뷰 미팅`,
              `대표 위임 업무 3개 공식 이관 + 담당자 2주간 독립 처리 후 피드백`
            ],
            expectedResult: 'SOP 10개 완성, KPI 대시보드 가동, 위임 업무 3개 독립 운영',
            govSupport: '중소기업 경영 시스템 구축 지원 (중진공), 스마트 팩토리 바우처 (해당 시)'
          },
          {
            month: '3개월차',
            theme: '채용·온보딩 시스템 완성 + 대표 전략 집중 구조 확립',
            goal: '온보딩 프로그램 완성 + 대표 전략 업무 주 20시간 확보 + 외부 파트너 3곳 계약',
            actions: [
              `30일 온보딩 프로그램 완성 — SOP + R&R + KPI 기반 신규 직원 교육 패키지`,
              `대표 위임 완료 검토 — 현재 대표 업무 중 50% 이상 위임 달성 여부 점검 + 미이관 업무 최종 이관`,
              `외부 파트너(세무사·법무사·IT개발자) 계약 완료 → 비핵심 업무 아웃소싱 정착`
            ],
            expectedResult: '온보딩 프로그램 완성, 대표 전략 업무 주 20시간 확보, 외부 파트너 3곳 가동',
            govSupport: '중소기업 인력 채용 지원 (고용노동부), 청년 고용 장려금 (고용노동부)'
          }
        ]
      };
    }

    if (ct === 'innovation_strategy') {
      return {
        keyStrategies: [
          { title: '고객 불만 기반 혁신 기회 발굴', description: `[진단] ${co}의 현재 사업이 기존 방식에 익숙해져 고객이 불편하게 여기는 부분을 개선 기회로 보지 못하고 있습니다. 가장 확실한 혁신은 고객이 가장 불편해하는 것을 먼저 해결하는 것입니다. [방침] 고객 불만 TOP 3를 혁신 기회로 전환하는 인사이드아웃 혁신을 실행합니다. [행동] ①고객 불만·VOC 3개월 치 수집·분석(이번 달) ②빈번한 불만 TOP 3 선정 → 해결 아이디어 팀 브레인스토밍 ③가장 빠르게 해결 가능한 불만 1가지 MVP로 즉시 개선`, priority: 'high', owner: '대표·운영 담당', timeline: '1~2개월' },
          { title: '신사업 가설 검증 — 린 MVP 방식', description: `[진단] 신사업 아이디어가 있지만 검증 없이 큰 투자를 해야 한다는 두려움으로 착수하지 못하거나, 충분한 검증 없이 너무 큰 베팅을 하고 있습니다. [방침] 신사업 가설을 가장 작은 비용으로 90일 내 시장에서 검증합니다. [행동] ①신사업 핵심 가설 1가지 작성(예: "이 고객은 이 가격에 이것을 살 것이다") ②가설 검증용 랜딩페이지·단건 오퍼·인터뷰 10건으로 4주 내 검증 ③검증 결과 기반 Go/No-go 결정 → 확인된 가설만 투자 확대`, priority: 'high', owner: '대표', timeline: '2~3개월' },
          { title: '기술·트렌드 기반 차별화 기회 포착', description: `[진단] ${ind} 업종에 영향을 미치는 기술 변화(AI·디지털화·자동화)와 규제 변화가 위협이기도 하지만 먼저 도입하면 경쟁 우위가 됩니다. [방침] 업종 트렌드를 분기마다 스캔하고 경쟁사보다 6개월 앞서 새 기술·방식을 시범 도입합니다. [행동] ①분기 1회 업종 트렌드 리포트 작성(구글 트렌드·업종 협회·해외 사례 참조) ②경쟁사가 아직 안 하는 기술·서비스 1가지 파악 → 시범 도입 계획 수립 ③시범 도입 3개월 후 성과 측정 → 유지/확장/중단 결정`, priority: 'high', owner: '대표·혁신 담당', timeline: '3~6개월' },
          { title: '파트너십 혁신 — 혼자 하지 않는 성장', description: `[진단] 혼자 모든 역량을 키우려다 보니 진입 속도가 느리고 비용이 과도합니다. 내가 없는 역량을 가진 파트너와 협력하면 혁신 속도를 3배 빠르게 할 수 있습니다. [방침] 상호보완적 파트너 2~3곳과 전략적 제휴로 새 시장 또는 새 역량을 빠르게 확보합니다. [행동] ①${co}의 강점과 약점 매핑 → 약점을 강점으로 가진 보완 기업 리스트 작성(이번 달) ②파트너십 제안서 작성 + 미팅 3건 실행(2개월) ③상호 이익이 명확한 파트너 1곳과 시범 협력 계약`, priority: 'medium', owner: '대표', timeline: '2~4개월' },
          { title: '혁신 문화 조성 — 실험하는 팀 만들기', description: `[진단] 팀원들이 기존 방식에 익숙해져 새로운 시도를 하면 실패할까봐 주저합니다. 혁신은 아이디어가 아니라 "작은 실험을 빠르게 반복하는 문화"에서 나옵니다. [방침] 실패해도 괜찮은 작은 실험을 월 1회 이상 팀에서 주도적으로 실행하는 문화를 만듭니다. [행동] ①팀 아이디어 제안 채널(카카오워크 or 노션 보드) 개설(이번 주) ②월 1회 "이달의 실험" 발표 미팅 — 성공이든 실패든 공유·학습 ③혁신 실험에 참여한 직원에게 소정의 포상·인정`, priority: 'medium', owner: '대표·팀장', timeline: '1~3개월' },
          { title: '정부 R&D·혁신 지원사업 연계', description: `[진단] 혁신과 신사업 개발에 필요한 자금이 부족하여 실험과 개발 속도가 느립니다. 정부는 혁신 기업에게 상당한 자금·인력·멘토링을 지원하지만 신청하지 않으면 받을 수 없습니다. [방침] 현재 추진 중인 혁신 방향에 맞는 정부 R&D·혁신 지원사업 2건을 90일 내 신청합니다. [행동] ①K-스타트업 포털 + 중소벤처부 지원사업 공고 분기별 스캔 루틴 설정(이번 달) ②혁신 바우처·TIPS·R&D 지원사업 중 해당 항목 신청(2개월) ③경영지도사·기술사업화 전문가 무료 상담 활용 + 사업계획서 작성 지원`, priority: 'low', owner: '대표', timeline: '3~6개월' }
        ],
        kpi: [
          { metric: '신사업 가설 검증 횟수', current: '0회', target: '분기 1회 이상', timeline: '분기', progress: 0, method: '린 MVP 검증 사이클 완료 횟수', owner: '대표' },
          { metric: '고객 불만 기반 개선 건수', current: '0건', target: '분기 3건 이상 개선', timeline: '분기', progress: 0, method: 'VOC → 개선 완료 건수', owner: '운영 담당' },
          { metric: '파트너십 계약 수', current: '0건', target: '신규 파트너십 2건', timeline: tl, progress: 0, method: '체결된 파트너십 수', owner: '대표' },
          { metric: '팀 혁신 아이디어 제안 수', current: '월 0건', target: '월 3건 이상', timeline: '3개월', progress: 0, method: '팀 아이디어 제안 채널 건수', owner: '팀장' },
          { metric: '정부 R&D·혁신 지원사업 신청', current: '0건', target: '2건 이상 신청', timeline: tl, progress: 0, method: '신청 완료 건수', owner: '대표' },
          { metric: 'MVP 출시 → 첫 고객 반응 기간', current: '6개월 이상', target: '60일 이내', timeline: '3개월', progress: 0, method: '아이디어 확정 → MVP 첫 고객 반응 수집 일수', owner: '대표' },
          { metric: '신사업 매출 비중', current: '0%', target: '전체 매출의 10% 이상', timeline: tl, progress: 0, method: '신사업 매출 / 전체 매출', owner: '재무 담당' },
          { metric: '업종 트렌드 스캔 보고서 발행', current: '없음', target: '분기 1회 이상', timeline: '분기', progress: 0, method: '트렌드 보고서 발행 횟수', owner: '대표' },
          { metric: '외부 협력 파트너 수', current: '0개', target: '신규 파트너 3개 이상', timeline: tl, progress: 0, method: '활성 협력 계약 수', owner: '대표' },
          { metric: '혁신 투자 비율', current: '미책정', target: '연간 매출의 3% 이상', timeline: tl, progress: 0, method: '혁신·R&D 투자액 / 전체 매출', owner: '재무 담당' }
        ],
        sixSystems: [
          { name: '1. 리더십 시스템', icon: '👑', status: '보통',
            issue: `혁신을 추진하려면 대표가 "실패를 허용하는 문화"를 먼저 만들어야 합니다. 대표가 작은 실패에 강하게 반응하면 팀은 위험을 감수하지 않고 현상 유지만 합니다. ${co}의 혁신 속도는 대표의 혁신 허용 범위와 정비례합니다.`,
            actions: [
              `[이번 달] 팀에게 "작은 실험은 실패해도 괜찮다"는 문화를 공개 선언 + 첫 번째 팀 아이디어 실험 승인`,
              `[2개월] 월 1회 "이달의 실험" 발표 미팅 가동 — 성공·실패 모두 공유하고 학습으로 인정`,
              `[3개월] 혁신 기여도를 성과 평가에 포함 — "새로운 시도를 했는가"가 "실수 없이 했는가"와 동일 비중`
            ],
            resource: 'K-스타트업 혁신 교육 프로그램 (중소벤처부), TIPS 멘토링 네트워크' },
          { name: '2. 마케팅 시스템', icon: '📣', status: '보통',
            issue: `혁신적 제품·서비스가 있어도 고객에게 "왜 이게 다른가"를 설명하지 못하면 시장에서 외면받습니다. 특히 새로운 카테고리를 만드는 혁신일수록 고객 교육·스토리텔링이 중요합니다.`,
            actions: [
              `[이번 달] 신사업의 고객 가치 제안 1문장 작성 — "당신의 [문제]를 [방식]으로 해결합니다"`,
              `[2개월] 혁신 도입 고객 사례 1건 만들기 — 무료 or 할인 제공 + 상세 후기·사례 작성`,
              `[3개월] 사례 기반 콘텐츠 마케팅(블로그·유튜브·SNS) — "어떻게 달라졌나"를 스토리로 전달`
            ],
            resource: '중소기업 브랜드 혁신 지원 (중진공), 소상공인 디지털 콘텐츠 바우처 (중소벤처부)' },
          { name: '3. 판매 시스템', icon: '💰', status: '취약',
            issue: `혁신적 제품이 기존 영업 방식으로 팔리지 않는 경우가 많습니다. 고객이 익숙하지 않은 것을 구매하도록 설득하려면 기존과 다른 영업 접근이 필요합니다.`,
            actions: [
              `[이번 달] 혁신 제품·서비스 전용 판매 스크립트 작성 — "기존 방식 vs 새 방식 비교" 중심으로`,
              `[2개월] 무료 체험·파일럿 제안으로 구매 허들 낮추기 — 체험 후 전환율 측정`,
              `[3개월] 체험 고객 사례 기반 추천 영업 체계 — "이 고객처럼 되고 싶다면" 스토리 판매`
            ],
            resource: '소상공인 영업 전략 컨설팅 (소진공), KOTRA 해외 신사업 진출 지원' },
          { name: '4. 제품·서비스 시스템', icon: '🛠️', status: '취약',
            issue: `혁신 아이디어가 고객이 실제로 원하는 것인지 검증 전에 너무 많은 기능을 개발하거나 완성도에 집착하여 시장 출시가 늦어집니다. "충분히 좋은 MVP"가 "완벽한 제품" 1년 후 출시보다 훨씬 가치 있습니다.`,
            actions: [
              `[이번 달] 신사업 MVP 범위 확정 — "4주 내 만들 수 있는 가장 작은 형태" 기준으로 스코프 합의`,
              `[4주 내] MVP 출시 + 타겟 고객 5명 시범 사용 + 피드백 수집`,
              `[3개월] 피드백 반영 2차 버전 출시 + 유료 전환 첫 10명 달성`
            ],
            resource: '중소기업 R&D 기술개발 지원 (중소벤처부), 창업 도약 패키지 (중진공)' },
          { name: '5. 운영 시스템', icon: '⚙️', status: '보통',
            issue: `기존 사업 운영과 신사업 개발을 동시에 하다 보면 집중력이 분산되어 두 가지 모두 제대로 안 되는 상황이 발생합니다. 혁신에는 "집중할 시간·자원의 의도적인 배분"이 필요합니다.`,
            actions: [
              `[이번 달] 주간 시간 배분 명확화 — 기존 사업 60% : 혁신/신사업 40% 비율로 대표 시간 재배분`,
              `[2개월] 혁신 전담 팀원 1명 지정 or 혁신 업무를 위한 외부 협력자 확보`,
              `[3개월] 혁신 프로젝트 진행 현황 월간 리뷰 + 기존 사업에 지장 없는지 점검`
            ],
            resource: '중소기업 스마트화 지원 (중진공), 혁신 바우처 사업 (중소벤처부)' },
          { name: '6. 재무 시스템', icon: '📊', status: '보통',
            issue: `혁신 투자(R&D·신사업 개발)의 비용과 기대 수익을 계산하지 않고 진행하면 기존 사업 현금흐름을 위협할 수 있습니다. "얼마를 투자해서 언제 회수하는가"를 명확히 해야 합니다.`,
            actions: [
              `[이번 달] 혁신 프로젝트별 예산 상한선 설정 — "이 이상 쓰면 중단" 기준 명확화`,
              `[2개월] 정부 R&D·혁신 지원금 신청으로 혁신 비용의 50% 이상 외부 조달`,
              `[3개월] 혁신 투자 ROI 최초 측정 — 투자 대비 매출·고객 수 성과 비교`
            ],
            resource: 'TIPS 프로그램 (중소벤처부), 혁신형 중소기업 R&D 자금 (중소벤처부)' }
        ],
        plan90days: [
          {
            month: '1개월차',
            theme: '혁신 기회 발굴 + 신사업 가설 수립',
            goal: '고객 불만 TOP 3 분석 완료 + 신사업 가설 1개 수립 + 트렌드 스캔 1회',
            actions: [
              `[1주차] 기존 고객 VOC(불만·요청) 3개월 치 수집·분석 → 불만 TOP 3 선정 + 개선 아이디어 도출`,
              `[2주차] 업종 트렌드 스캔 — 경쟁사·해외 사례·신기술 동향 조사 → 기회 영역 2~3개 파악`,
              `[3~4주차] 신사업 핵심 가설 1개 수립 + MVP 범위 확정 + 팀 아이디어 제안 채널 개설`
            ],
            expectedResult: '고객 불만 기반 개선 계획 3건, 신사업 가설 1개, 트렌드 보고서 1회',
            govSupport: '혁신 바우처 사업 신청 준비 (중소벤처부), 창업 도약 패키지 상담 (중진공)'
          },
          {
            month: '2개월차',
            theme: 'MVP 출시 + 첫 시장 검증',
            goal: 'MVP 출시 + 잠재 고객 5명 반응 수집 + 파트너십 미팅 3건',
            actions: [
              `신사업 MVP 출시 — 가능한 가장 작은 형태로 빠르게 출시 + 타겟 고객 5명 시범 사용`,
              `파트너십 잠재 파트너 리스트 10곳 작성 + 접촉 3곳 이상 + 협력 미팅 진행`,
              `정부 지원사업 공고 스캔 + 적합한 지원사업 2건 신청 준비 착수`
            ],
            expectedResult: 'MVP 출시 및 5명 반응 수집, 파트너십 미팅 3건, 지원사업 신청 준비',
            govSupport: 'TIPS 신청 (해당 시), R&D 기술개발 지원사업 신청 (중소벤처부)'
          },
          {
            month: '3개월차',
            theme: '검증 결과 기반 방향 결정 + 다음 혁신 사이클',
            goal: 'MVP 검증 결과 기반 방향 결정 + 지원사업 1건 이상 신청 완료 + 파트너십 1건 계약',
            actions: [
              `MVP 검증 결과 분석 — 핵심 가설이 맞았는가? 고객이 돈을 낼 의향이 있는가? → Go/No-go 결정`,
              `Go 결정 시: 정식 출시 계획 + 마케팅 예산 배분 + 운영 확장 계획 수립`,
              `파트너십 1곳 최종 계약 + 정부 R&D 지원사업 1건 이상 신청 완료`
            ],
            expectedResult: '신사업 방향 확정, 파트너십 1건 계약, 지원사업 1건 신청 완료',
            govSupport: '혁신형 중소기업 확인 신청 (중소벤처부), KOTRA 해외 진출 지원 (해당 시)'
          }
        ]
      };
    }

    if (ct === 'cx_strategy') {
      return {
        keyStrategies: [
          { title: '고객 여정 맵 작성 — 불편 구간 제거', description: `[진단] ${co}의 고객이 처음 인지→문의→구매→사용→재구매하는 전체 여정에서 어느 단계에서 이탈하는지 파악이 안 됩니다. 고객 이탈의 80%는 특정 단계의 불편함에서 발생합니다. [방침] 고객 여정 맵을 작성하고 가장 많은 이탈이 발생하는 단계 1곳을 집중 개선합니다. [행동] ①최근 고객 5명 인터뷰 — 처음 알게 된 경로부터 현재까지 경험 상세 파악(이번 달) ②고객 여정 맵 작성 → 불편·이탈 구간 시각화 ③가장 심각한 이탈 구간 1곳 집중 개선`, priority: 'high', owner: '대표·서비스 담당', timeline: '1~2개월' },
          { title: 'NPS 측정 + 추천 고객 확보 체계 구축', description: `[진단] 고객이 얼마나 만족하는지, 재추천 의향이 얼마나 있는지 측정하지 않아 서비스 개선이 감에만 의존하고 있습니다. NPS(Net Promoter Score)는 가장 간단하면서 강력한 고객 충성도 지표입니다. [방침] 월 1회 NPS 측정 루틴을 만들고 추천 고객(프로모터) 활성화 체계를 구축합니다. [행동] ①NPS 설문(1문항: "친구에게 추천할 의향 0~10점") 구글 폼으로 제작 → 전 고객 발송(이번 달) ②추천 의향 9~10점 고객에게 추천 인센티브 프로그램 설계 ③월 1회 NPS 측정 + 불만 고객(0~6점) 즉시 연락 루틴`, priority: 'high', owner: '서비스 담당', timeline: '1~3개월' },
          { title: '첫 경험 혁신 — 신규 고객 온보딩 개선', description: `[진단] 신규 고객이 처음 서비스를 시작할 때 "이거 어떻게 쓰나요?"를 물어보거나 혼자 해결이 안 돼 이탈하는 케이스가 반복됩니다. 첫 경험이 좋지 않으면 아무리 좋은 서비스도 해지로 이어집니다. [방침] 신규 고객의 첫 30일 온보딩 경험을 설계하여 초기 이탈율을 50% 줄입니다. [행동] ①신규 고객 첫 연락 스크립트·환영 메시지 표준화(이번 달) ②첫 사용 7일 체크인 루틴 — 고객이 원하는 것을 얻고 있는지 능동적으로 확인 ③30일 온보딩 가이드 제작(FAQ + 사용법 + 자주 막히는 구간 해결법)`, priority: 'high', owner: '서비스·운영 담당', timeline: '1~2개월' },
          { title: '컴플레인 처리 황금 기준 수립', description: `[진단] 고객 불만이 발생했을 때 대응 방식이 일관되지 않아 어떤 경우에는 고객이 만족하고 어떤 경우에는 더 화가 나서 이탈합니다. 불만을 잘 해결한 고객이 오히려 더 충성도 높은 고객이 되는 경우가 많습니다. [방침] 컴플레인 처리 5단계 기준을 만들고 모든 직원이 일관되게 대응하는 체계를 구축합니다. [행동] ①최근 6개월 불만 사례 수집 → 유형 분류 → 최선 대응 사례 선별(이번 달) ②컴플레인 처리 5단계 표준(인정→공감→원인→해결→확인) 작성 ③전 직원 컴플레인 대응 교육 1회 + 역할극 실습`, priority: 'medium', owner: '팀장·서비스 담당', timeline: '1~2개월' },
          { title: '재방문·재구매 촉진 — 재계약 루틴 구축', description: `[진단] 기존 고객이 자연스럽게 떠나거나 경쟁사로 이탈할 때 ${co}에서는 이를 알아채지 못하고 있습니다. 재구매를 올리는 가장 쉬운 방법은 구매 주기를 파악하고 적시에 연락하는 것입니다. [방침] 고객별 재구매 주기를 파악하고 타이밍 맞춤 재계약 연락 루틴을 만듭니다. [행동] ①기존 고객 재구매 주기 분석 — 평균 몇 개월마다 재구매하는가? ②CRM에 재구매 예상 일자 + 자동 알림 설정 ③재구매 주기 1개월 전 개인화된 연락(근황 체크 + 새 오퍼) 루틴`, priority: 'medium', owner: '영업·서비스 담당', timeline: '2~3개월' },
          { title: '고객 목소리 수집 체계 — VOC 루프 구축', description: `[진단] 서비스 개선 아이디어가 고객이 아닌 내부 직원 관점에서 나오고 있어 실제 고객에게 중요한 것을 놓치는 경우가 반복됩니다. [방침] 고객 목소리를 체계적으로 수집·분류·반영하는 VOC 루프를 만들어 고객 중심 서비스 개선을 제도화합니다. [행동] ①서비스 완료 후 3일 이내 만족도 조사 자동 발송(구글 폼 or 카카오 설문) ②월 1회 VOC 분석 미팅 — 칭찬·불만·요청 분류 + 개선 과제 선정 ③분기 1회 고객에게 "개선 결과" 공유 — "여러분 의견으로 이렇게 바꿨습니다"`, priority: 'low', owner: '서비스 담당', timeline: '2~4개월' }
        ],
        kpi: [
          { metric: 'NPS (고객 순추천지수)', current: '측정 안됨', target: '40점 이상', timeline: tl, progress: 0, method: '분기별 NPS 설문 (추천 9~10점 비율 - 비추천 0~6점 비율)', owner: '서비스 담당' },
          { metric: '고객 재구매율', current: '파악 안됨', target: '60% 이상', timeline: tl, progress: 0, method: '재구매 고객 수 / 전체 고객 수', owner: '영업 담당' },
          { metric: '신규 고객 초기 이탈률 (30일)', current: '파악 안됨', target: '30% 이하', timeline: '3개월', progress: 0, method: '30일 내 해지 고객 / 신규 고객 수', owner: '서비스 담당' },
          { metric: '컴플레인 해결 시간', current: '24시간 이상', target: '4시간 이내', timeline: '2개월', progress: 20, method: '불만 접수 → 최초 응대 시간 평균', owner: '팀장' },
          { metric: '고객 만족도 (CSAT)', current: '측정 안됨', target: '4.0/5.0 이상', timeline: '3개월', progress: 0, method: '서비스 완료 후 만족도 설문 평균 점수', owner: '서비스 담당' },
          { metric: '추천(리퍼럴) 신규 고객 비중', current: '파악 안됨', target: '신규 고객의 30% 이상', timeline: tl, progress: 0, method: '추천으로 유입된 신규 고객 / 전체 신규 고객', owner: '마케팅 담당' },
          { metric: 'VOC 반영 개선 건수', current: '0건/분기', target: '분기 3건 이상', timeline: '분기', progress: 0, method: '고객 의견 기반 서비스 개선 완료 건수', owner: '운영 담당' },
          { metric: '고객 응대 응답 시간', current: '파악 안됨', target: '영업시간 내 1시간 이내', timeline: '2개월', progress: 20, method: '고객 문의 접수 → 최초 응대 시간 평균', owner: '서비스 담당' },
          { metric: '고객 온보딩 완료율', current: '측정 안됨', target: '신규 고객의 85% 이상', timeline: tl, progress: 0, method: '온보딩 완료 고객 수 / 전체 신규 고객 수', owner: '서비스 담당' },
          { metric: '평균 고객 유지 기간', current: '파악 안됨', target: '현재 대비 20% 연장', timeline: tl, progress: 0, method: '전체 고객 평균 거래 지속 기간(월) 산출', owner: '대표·서비스' }
        ],
        sixSystems: [
          { name: '1. 리더십 시스템', icon: '👑', status: '보통',
            issue: `고객경험의 품질은 대표가 "고객을 어떻게 대하는가"를 팀이 보면서 배우는 것입니다. 대표가 불만 고객 대응에서 원칙 없이 즉흥적으로 반응하면 팀도 일관성 없이 대응합니다. ${co}의 고객경험 수준은 대표의 고객 철학과 직결됩니다.`,
            actions: [
              `[이번 달] 고객 경험 원칙 3가지 작성 + 팀 공유 — "우리는 고객에게 이렇게 한다" 성문화`,
              `[2개월] 대표가 직접 불만 고객 5명에게 전화 — 현장 상황 파악 + 해결 과정 팀에 공유`,
              `[3개월] 고객 경험 우수 사례 팀 공유 미팅 — "이렇게 했더니 고객이 감동했다" 사례 학습`
            ],
            resource: '소상공인 서비스 품질 컨설팅 (소진공), 중소기업 고객 서비스 교육 (중진공)' },
          { name: '2. 마케팅 시스템', icon: '📣', status: '보통',
            issue: `기존 마케팅이 신규 고객 획득에만 집중하고 기존 고객의 재구매·추천을 마케팅으로 활용하지 않습니다. 만족한 고객의 후기·추천은 가장 효과적이고 비용 효율적인 마케팅입니다.`,
            actions: [
              `[이번 달] NPS 9~10점 고객 대상 추천 프로그램 설계 + 후기 요청 루틴 (서비스 완료 3일 후)`,
              `[2개월] 고객 성공 사례 2~3건 상세 작성 + 블로그·SNS 공유 — 실제 고객 목소리로 신규 고객 설득`,
              `[3개월] 고객 추천 비중 측정 → 추천 채널 CAC가 가장 낮음 확인 → 추천 프로그램 확대`
            ],
            resource: '소상공인 구전 마케팅 지원 (소진공), 네이버 스마트플레이스 후기 관리 무료' },
          { name: '3. 판매 시스템', icon: '💰', status: '취약',
            issue: `영업 종료 후 고객과의 관계가 단절되어 재구매·업셀링 기회를 놓치고 있습니다. 현재 영업이 "팔면 끝"이 아니라 "관계의 시작"이 되도록 전환이 필요합니다.`,
            actions: [
              `[이번 달] 영업 완료 고객 CRM 등록 의무화 + 재구매 예상 일자 입력 루틴 설정`,
              `[2개월] 재구매 주기별 자동 팔로우업 — "안부 인사 + 새 서비스 소식" 개인화 연락 루틴`,
              `[3개월] 기존 고객 업셀링 캠페인 — 현 서비스 고객에게 "다음 단계" 제안 → 추가 매출 창출`
            ],
            resource: 'KOTRA 고객 관리 컨설팅, 소상공인 CRM 활용 교육 (소진공)' },
          { name: '4. 제품·서비스 시스템', icon: '🛠️', status: '취약',
            issue: `서비스 품질이 담당자·상황에 따라 편차가 크고, 고객이 경험하는 서비스 수준이 예측 불가능합니다. 고객은 탁월한 경험보다 일관된 경험을 더 신뢰합니다.`,
            actions: [
              `[이번 달] 서비스 완료 기준 체크리스트 작성 — "이것이 완료되면 고객에게 납품 가능" 기준 명확화`,
              `[2개월] 고객 접점별 경험 표준화 — 상담→계약→제공→완료→사후 관리 각 단계 스크립트`,
              `[3개월] 서비스 품질 일관성 측정 — CSAT 설문으로 단계별 만족도 파악 + 취약 구간 집중 개선`
            ],
            resource: '중소기업 서비스 표준화 지원 (중소벤처부), ISO 9001 인증 지원 (중진공)' },
          { name: '5. 운영 시스템', icon: '⚙️', status: '보통',
            issue: `고객 대응이 느리거나 일관되지 않은 원인이 대부분 운영 프로세스 문제입니다. 빠른 응대·정확한 납품·투명한 소통이 모두 운영 시스템에서 나옵니다.`,
            actions: [
              `[이번 달] 고객 문의 유형별 FAQ + 답변 템플릿 30개 작성 → 응답 시간 단축`,
              `[2개월] 고객 일정 관리 시스템(예약·배송·납품 일정) 구글 캘린더 or CRM으로 일원화`,
              `[3개월] 납품 지연·오류 발생 시 사전 통보 루틴 — "문제가 생기면 고객이 먼저 알도록" 프로세스`
            ],
            resource: '소상공인 운영 효율화 지원 (소진공), 중소기업 스마트화 바우처 (중진공)' },
          { name: '6. 재무 시스템', icon: '📊', status: '보통',
            issue: `고객경험 개선 투자(교육·시스템·인력)가 실제로 재구매율·LTV 향상에 기여하는지 측정하지 않아 어느 개선이 진짜 효과가 있는지 모릅니다.`,
            actions: [
              `[이번 달] 고객 LTV(생애가치) 계산 — 평균 계약 금액 × 평균 계약 기간`,
              `[2개월] 고객 유지 비용 vs 신규 고객 획득 비용 비교 — "기존 고객 1명 유지"의 경제적 가치 팀과 공유`,
              `[3개월] 고객경험 투자(개선 비용) → 재구매율 변화 → 추가 매출 ROI 측정`
            ],
            resource: '소상공인 재무 컨설팅 (소진공 무료), 중소기업 경영분석 서비스 (중진공)' }
        ],
        plan90days: [
          {
            month: '1개월차',
            theme: '고객 여정 이해 + NPS 기준선 측정',
            goal: '고객 5명 심층 인터뷰 완료 + NPS 최초 측정 + 컴플레인 처리 기준 수립',
            actions: [
              `[1주차] 최근 고객 5명 인터뷰 — 처음 알게 된 순간부터 현재까지 전체 경험 파악 + 불편 구간 기록`,
              `[2주차] NPS 설문 전 고객 발송 + 결과 분석 → 불만 고객(0~6점) 즉시 개별 연락`,
              `[3~4주차] 컴플레인 처리 5단계 기준 작성 + 전 직원 교육 + 서비스 완료 기준 체크리스트 작성`
            ],
            expectedResult: 'NPS 기준선 파악, 불만 고객 연락 완료, 컴플레인 처리 기준 완성',
            govSupport: '소상공인 서비스 품질 향상 컨설팅 (소진공 무료), 중소기업 고객 만족 교육 (중진공)'
          },
          {
            month: '2개월차',
            theme: '온보딩 혁신 + 재구매 루틴 구축',
            goal: '신규 고객 온보딩 프로그램 완성 + 재구매 CRM 루틴 가동 + CSAT 4.0 달성',
            actions: [
              `신규 고객 30일 온보딩 프로그램 완성 — 첫 환영 메시지 + 7일 체크인 + 30일 만족도 확인 루틴`,
              `기존 고객 재구매 주기 분석 + CRM 재구매 예상 알림 설정 + 개인화 팔로우업 루틴 가동`,
              `서비스 완료 후 CSAT 설문 자동 발송 루틴 가동 + 첫 번째 월간 VOC 분석 미팅`
            ],
            expectedResult: '온보딩 프로그램 가동, 재구매 루틴 설정, CSAT 측정 시작',
            govSupport: '소상공인 CRM 도입 지원 (소진공), 고객 응대 서비스 교육 바우처 (고용노동부)'
          },
          {
            month: '3개월차',
            theme: '추천 체계 확립 + 고객경험 선순환 구조',
            goal: 'NPS 40점 이상 달성 + 추천 고객 프로그램 가동 + 재구매율 10% 향상',
            actions: [
              `NPS 9~10점 프로모터 고객 추천 프로그램 공식 출시 — 추천 시 혜택(할인·추가 서비스) 제공`,
              `VOC 기반 서비스 개선 3건 완료 + "여러분 의견으로 이렇게 바꿨습니다" 고객 공유 레터 발송`,
              `3개월 성과 리뷰 — NPS·CSAT·재구매율·추천 비중 측정 + 다음 분기 CX 개선 과제 선정`
            ],
            expectedResult: 'NPS 40점 이상, 재구매율 10% 향상, 추천 프로그램 가동, 다음 분기 CX 과제 확정',
            govSupport: '소상공인 서비스 혁신 바우처 (중소벤처부), 고객 만족 경영 인증 지원'
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
