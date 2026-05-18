/**
 * BizNavi AI 경영진단 시스템
 * cross-context.js — 업종 × BM 교차 트리거 로직 (v2.0)
 *
 * 설계 기준:
 *   - 16개 업종 × 12개 BM 주요 조합에서 발생하는 복합 경고 패턴
 *   - 단일 진단 파일로는 포착 불가능한 구조적 모순 탐지
 *   - AI 프롬프트에 교차 경고 자동 삽입
 *
 * 작동 방식:
 *   1. 업종 진단 점수 + BM 진단 점수를 동시에 입력받음
 *   2. 업종×BM 조합 매트릭스에서 위험 패턴 탐지
 *   3. CRITICAL·HIGH·MEDIUM 3단계 경고 생성
 *   4. AI 프롬프트에 교차 경고 텍스트 자동 삽입
 */

const CrossContext = (() => {

  /* ============================================================
   * 교차 트리거 규칙 정의
   * 형식: { industry, bm, triggers[], level, msg }
   * ============================================================ */
  const CROSS_RULES = [

    /* ----------------------------------------------------------
     * 외식업 × 프랜차이즈 — 이중 자멸 구조
     * ---------------------------------------------------------- */
    {
      id: 'rest_frc_double_collapse',
      industry: 'restaurant',
      bm: 'franchise',
      level: 'CRITICAL',
      triggers: [
        { file: 'industry', key: 'rt_2_3', threshold: 2 }, // 배달 플랫폼 수익률
        { file: 'bm', key: 'fr_4_4', threshold: 2 },       // 폐점률
      ],
      msg: '배달 플랫폼에 종속된 외식 프랜차이즈 구조입니다. 본부도 배달 수수료 압박, 가맹점도 폐점 위기인 이중 자멸 구조입니다. 배달 전용 메뉴 가격 차별화와 가맹점 수익 구조 전면 재설계가 동시에 필요합니다.',
    },
    {
      id: 'rest_frc_quality_collapse',
      industry: 'restaurant',
      bm: 'franchise',
      level: 'CRITICAL',
      triggers: [
        { file: 'industry', key: 'rt_1_1', threshold: 2 }, // 식재료 원가율
        { file: 'bm', key: 'fr_1_3', threshold: 2 },       // 품질 균일성
      ],
      msg: '식재료 원가 관리가 안 되는데 전국 품질 균일성도 무너지고 있습니다. 브랜드 신뢰 붕괴까지 이어지는 3단계 위기 구조입니다. 원가 표준화와 슈퍼바이저 현장 점검을 즉각 강화해야 합니다.',
    },

    /* ----------------------------------------------------------
     * 지식IT × B2B SaaS — 가동률·Churn 이중 위험
     * ---------------------------------------------------------- */
    {
      id: 'kit_saas_utilization_churn',
      industry: 'knowledge_it',
      bm: 'b2b_saas',
      level: 'CRITICAL',
      triggers: [
        { file: 'industry', key: 'ki_3_1', threshold: 2 }, // 가동률
        { file: 'bm', key: 'bs_4_1', threshold: 2 },       // 갱신율
      ],
      msg: '개발 인력 가동률이 낮은데 SaaS 갱신율까지 떨어지고 있습니다. 인건비는 고정 지출인데 매출은 줄어드는 이중 압박 구조입니다. 유휴 인력을 제품 고도화에 즉각 투입하고 고객 성공(CSM) 체계를 강화하십시오.',
    },
    {
      id: 'kit_saas_keyman_churn',
      industry: 'knowledge_it',
      bm: 'b2b_saas',
      level: 'HIGH',
      triggers: [
        { file: 'industry', key: 'ki_3_1', threshold: 2 }, // 핵심 인력 의존도
        { file: 'bm', key: 'bs_1_1', threshold: 2 },       // 제품 차별성
      ],
      msg: '특정 개발자 의존도가 높은데 제품 차별성도 낮습니다. 핵심 인력 이탈 시 제품 경쟁력이 동시에 무너지는 위험한 구조입니다. 코드 자산화와 제품 로드맵 다변화가 시급합니다.',
    },

    /* ----------------------------------------------------------
     * 수출중소기업 × 종량제(Usage-Based) — 환리스크+번레이트 복합
     * ---------------------------------------------------------- */
    {
      id: 'export_usage_fx_burn',
      industry: 'export_sme',
      bm: 'usage_based',
      level: 'CRITICAL',
      triggers: [
        { file: 'industry', key: 'exp_4_1', threshold: 2 }, // 환리스크 관리
        { file: 'bm', key: 'ub_3_1', threshold: 2 },        // Gross Margin
      ],
      msg: '해외 매출 기반 종량제 서비스인데 환리스크 관리도 마진 관리도 안 되고 있습니다. 환율 급변 시 매출은 있어도 실질 마진이 마이너스가 될 수 있는 구조입니다. 환변동 보험 가입과 과금 단가 외화 기준 재설계를 최우선 처방합니다.',
    },

    /* ----------------------------------------------------------
     * 제조유통 × B2C 커머스 — OEM+플랫폼 이중 종속
     * ---------------------------------------------------------- */
    {
      id: 'mfg_commerce_double_dependency',
      industry: 'mfg_parts',
      bm: 'b2c_commerce',
      level: 'CRITICAL',
      triggers: [
        { file: 'industry', key: 'mp_4_4', threshold: 2 }, // 가치사슬 위치
        { file: 'bm', key: 'bc_4_1', threshold: 2 },       // 채널별 순마진
      ],
      msg: '하청 Tier 2~3 제조사가 B2C 커머스까지 진출했는데 채널 마진도 관리 안 되고 있습니다. 제조 원가 압박과 플랫폼 수수료 압박을 동시에 받는 이중 종속 구조입니다. 자사 브랜드 구축과 D2C 전환을 장기 전략으로 수립해야 합니다.',
    },
    {
      id: 'food_commerce_margin_collapse',
      industry: 'food_mfg',
      bm: 'b2c_commerce',
      level: 'CRITICAL',
      triggers: [
        { file: 'industry', key: 'fm_2_1', threshold: 2 }, // 수율 관리
        { file: 'bm', key: 'bc_4_1', threshold: 2 },       // 채널 순마진
      ],
      msg: '식품 제조 수율이 낮은데 플랫폼 채널 순마진도 관리 안 됩니다. 원재료 손실 + 수수료 손실이 겹쳐 매출이 늘수록 적자가 커지는 구조입니다. 공정 자동화와 자사몰 전환을 동시에 처방합니다.',
    },

    /* ----------------------------------------------------------
     * 의료헬스케어 × 광고기반 — 의료광고법+신뢰도 충돌
     * ---------------------------------------------------------- */
    {
      id: 'medical_advertising_compliance',
      industry: 'medical',
      bm: 'advertising',
      level: 'CRITICAL',
      triggers: [
        { file: 'industry', key: 'md_4_2', threshold: 2 }, // 의료광고 심의
        { file: 'bm', key: 'adv_2_1', threshold: 2 },      // 광고 인벤토리
      ],
      msg: '의료 서비스가 광고 기반 수익 모델을 운영 중인데 의료법 광고 심의 준수가 미흡합니다. 영업 정지 리스크와 브랜드 신뢰도 붕괴가 동시에 발생할 수 있는 최고 위험 조합입니다. 광고 집행 전 의료광고 심의 완전 준수 체계 구축이 최우선입니다.',
    },

    /* ----------------------------------------------------------
     * 금융핀테크 × 플랫폼 — FDS+신뢰 이중 위험
     * ---------------------------------------------------------- */
    {
      id: 'finance_platform_trust_fds',
      industry: 'finance',
      bm: 'platform',
      level: 'CRITICAL',
      triggers: [
        { file: 'industry', key: 'fn_2_3', threshold: 2 }, // FDS
        { file: 'bm', key: 'pl_2_4', threshold: 2 },       // 사기·어뷰징 탐지
      ],
      msg: '금융 플랫폼인데 FDS(이상거래탐지)와 어뷰징 탐지 모두 미흡합니다. 금융 사기와 플랫폼 어뷰징이 동시에 발생할 수 있는 최고 위험 구조입니다. 즉각적인 AI 기반 이중 탐지 시스템 구축이 필요합니다.',
    },
    {
      id: 'finance_platform_regulation',
      industry: 'finance',
      bm: 'platform',
      level: 'HIGH',
      triggers: [
        { file: 'industry', key: 'fn_2_2', threshold: 2 }, // 금소법 대응
        { file: 'bm', key: 'pl_3_1', threshold: 2 },       // 수수료 구조
      ],
      msg: '금융소비자보호법 준수가 미흡한데 플랫폼 수수료 구조도 불합리합니다. 규제 위반과 공급자 이탈이 동시에 발생하면 플랫폼 생태계가 한 번에 무너집니다. 선 규제 준수 후 수수료 재설계 순서로 접근하십시오.',
    },

    /* ----------------------------------------------------------
     * 교육에듀테크 × B2C 구독 — 스타강사+Churn 이중 위험
     * ---------------------------------------------------------- */
    {
      id: 'edu_sub_instructor_churn',
      industry: 'education',
      bm: 'b2c_sub',
      level: 'CRITICAL',
      triggers: [
        { file: 'industry', key: 'ed_3_1', threshold: 2 }, // 스타강사 의존도
        { file: 'bm', key: 'bc_3_1', threshold: 2 },       // 월간 해지율
      ],
      msg: '특정 스타 강사에 매출이 집중된 구독 서비스인데 해지율까지 높습니다. 강사 이탈 시 구독자 대량 이탈로 이어지는 도미노 붕괴 위험이 있습니다. 커리큘럼 IP 자산화와 해지 방어 오퍼를 동시에 강화하십시오.',
    },

    /* ----------------------------------------------------------
     * 패션뷰티 × B2C 커머스 — 재고+플랫폼 이중 압박
     * ---------------------------------------------------------- */
    {
      id: 'fashion_commerce_inventory_margin',
      industry: 'fashion',
      bm: 'b2c_commerce',
      level: 'HIGH',
      triggers: [
        { file: 'industry', key: 'fs_1_2', threshold: 2 }, // 재고 회전
        { file: 'bm', key: 'bc_4_1', threshold: 2 },       // 채널 순마진
      ],
      msg: '패션 재고 회전이 느린데 플랫폼 채널 순마진도 낮습니다. 재고 부담과 수수료 부담이 겹쳐 할인 세일에 의존하는 악순환이 됩니다. SKU 축소와 D2C 전환을 동시에 추진하십시오.',
    },
    {
      id: 'fashion_sub_seasonal_lock',
      industry: 'fashion',
      bm: 'b2c_sub',
      level: 'HIGH',
      triggers: [
        { file: 'industry', key: 'fs_2_1', threshold: 2 }, // 반응 생산 체계
        { file: 'bm', key: 'bc_3_1', threshold: 2 },       // 해지율
      ],
      msg: '패션 구독 서비스인데 반응 생산이 안 되고 해지율도 높습니다. 시즌 상품이 구독자 취향과 맞지 않아 이탈이 가속화되는 구조입니다. 개인화 큐레이션과 반응 생산 체계를 동시에 구축해야 합니다.',
    },

    /* ----------------------------------------------------------
     * 미디어엔터 × 광고기반 — IP부재+eCPM 하락
     * ---------------------------------------------------------- */
    {
      id: 'media_advertising_ip_ecpm',
      industry: 'media',
      bm: 'advertising',
      level: 'HIGH',
      triggers: [
        { file: 'industry', key: 'me_1_1', threshold: 2 }, // IP 수익 비중
        { file: 'bm', key: 'adv_2_2', threshold: 2 },      // eCPM
      ],
      msg: '자체 IP 없이 광고 수익만 의존하는데 eCPM까지 하락 중입니다. 트래픽의 질과 양 모두 하락하면 광고 매출 급락이 불가피합니다. 오리지널 콘텐츠 기획 비중 확대와 프리미엄 인벤토리 구축을 처방합니다.',
    },

    /* ----------------------------------------------------------
     * 물류운송 × 플랫폼 — 공차+수수료 이중 비효율
     * ---------------------------------------------------------- */
    {
      id: 'logistics_platform_empty_fee',
      industry: 'logistics',
      bm: 'platform',
      level: 'HIGH',
      triggers: [
        { file: 'industry', key: 'log_2_2', threshold: 2 }, // 차량 공차율
        { file: 'bm', key: 'pl_3_1', threshold: 2 },        // 수수료 구조
      ],
      msg: '물류 플랫폼인데 공차율이 높고 수수료 구조도 불합리합니다. 화주는 비싸고 기사는 빈 차로 다니는 양쪽이 모두 손해인 구조입니다. 화물 매칭 알고리즘 고도화와 수수료 인센티브 재설계를 동시에 처방합니다.',
    },

    /* ----------------------------------------------------------
     * 환경에너지 × 딥테크바이오 — 보조금+번레이트 복합
     * ---------------------------------------------------------- */
    {
      id: 'energy_deeptech_subsidy_burn',
      industry: 'energy',
      bm: 'deeptech',
      level: 'CRITICAL',
      triggers: [
        { file: 'industry', key: 'eng_3_1', threshold: 2 }, // 정부 보조금 의존
        { file: 'bm', key: 'dt_3_2', threshold: 2 },        // 번레이트
      ],
      msg: '에너지 딥테크 기업인데 정부 보조금 의존도가 높고 번레이트도 빠릅니다. 정책 변동 시 자금 경색과 사업 중단이 동시에 발생할 수 있습니다. 비희석성 정부 R&D 과제 확보와 민간 PPA 계약 병행이 최우선 과제입니다.',
    },

    /* ----------------------------------------------------------
     * 농림식품 × 프랜차이즈 — 계절성+표준화 충돌
     * ---------------------------------------------------------- */
    {
      id: 'agri_franchise_seasonal_standard',
      industry: 'agri_food',
      bm: 'franchise',
      level: 'HIGH',
      triggers: [
        { file: 'industry', key: 'agri_3_3', threshold: 2 }, // 계절 수급 변동
        { file: 'bm', key: 'fr_1_3', threshold: 2 },          // 품질 균일성
      ],
      msg: '농산물 기반 프랜차이즈인데 계절 수급 변동 대응이 안 되고 품질 균일성도 무너지고 있습니다. 제철 재료 의존 브랜드는 비수기에 품질 편차가 심해져 브랜드 신뢰도가 급락합니다. 연중 공급 가능한 대체 식재료 확보와 레시피 표준화가 시급합니다.',
    },

    /* ----------------------------------------------------------
     * 소규모건설 × 서비스업 — 미수금+가동률 이중 위험
     * ---------------------------------------------------------- */
    {
      id: 'construction_service_receivable_util',
      industry: 'construction',
      bm: 'service',
      level: 'HIGH',
      triggers: [
        { file: 'industry', key: 'cn_4_1', threshold: 2 }, // 기성금·미수금
        { file: 'bm', key: 'sv_3_1', threshold: 2 },       // 인력 가동률
      ],
      msg: '건설 서비스업인데 미수금 회수가 안 되고 인력 가동률도 낮습니다. 현금이 들어오지 않는데 인력 비용은 계속 나가는 자금 출혈 구조입니다. 기성금 청구 주기 단축과 인력 가동률 최적화를 동시에 처방합니다.',
    },

    /* ----------------------------------------------------------
     * 생활밀착서비스 × B2C 구독 — 재방문+해지 이중 위험
     * ---------------------------------------------------------- */
    {
      id: 'local_service_sub_retention',
      industry: 'local_service',
      bm: 'b2c_sub',
      level: 'HIGH',
      triggers: [
        { file: 'industry', key: 'ls_2_1', threshold: 2 }, // 재방문율
        { file: 'bm', key: 'bc_3_1', threshold: 2 },       // 해지율
      ],
      msg: '로컬 서비스 구독 모델인데 재방문율과 구독 유지율이 동시에 낮습니다. 오프라인 고객도 온라인 구독자도 모두 이탈하는 이중 손실 구조입니다. 첫 방문 경험 최적화와 구독 혜택 차별화를 동시에 강화하십시오.',
    },

    /* ----------------------------------------------------------
     * 도소매유통 × 제조유통BM — 재고+CCC 복합 위기
     * ---------------------------------------------------------- */
    {
      id: 'wholesale_mfgdist_inventory_ccc',
      industry: 'wholesale',
      bm: 'mfg_dist',
      level: 'CRITICAL',
      triggers: [
        { file: 'industry', key: 'ws_2_1', threshold: 2 }, // 악성 재고
        { file: 'bm', key: 'md_4_2', threshold: 2 },       // CCC
      ],
      msg: '유통·제조 겸업 구조인데 악성 재고도 쌓이고 현금 전환 사이클도 깁니다. 재고에 현금이 묶인 채 매출이 늘수록 자금 압박이 심해지는 성장이 독이 되는 구조입니다. 재고 회전율 개선과 매입 조건 재협상을 최우선으로 처방합니다.',
    },

    /* ----------------------------------------------------------
     * 뿌리제조 × B2B 솔루션 — 하청종속+수주채널 단일화
     * ---------------------------------------------------------- */
    {
      id: 'mfgparts_solution_single_channel',
      industry: 'mfg_parts',
      bm: 'b2b_solution',
      level: 'HIGH',
      triggers: [
        { file: 'industry', key: 'mp_4_1', threshold: 2 }, // 매출 포트폴리오
        { file: 'bm', key: 'bb_2_1', threshold: 2 },       // 리드 발굴 채널
      ],
      msg: '하청 제조 기반 B2B 솔루션 기업인데 주거래처 의존도가 높고 리드 발굴 채널도 소개에만 의존합니다. 주요 거래처 이탈 시 솔루션 매출까지 동시에 끊기는 이중 리스크 구조입니다. 고객 다변화와 콘텐츠 마케팅 기반 인바운드 체계 구축이 시급합니다.',
    },
  ];

  /* ============================================================
   * 교차 트리거 점수 맵 생성
   * ============================================================ */
  function buildScoreMap(diagScores) {
    const map = {};
    if (!diagScores) return map;
    Object.entries(diagScores).forEach(([key, val]) => {
      const score = Number(val);
      if (!isNaN(score)) map[key] = score;
    });
    return map;
  }

  /* ============================================================
   * 교차 경고 탐지 메인 함수
   * @param {string} industryId — 선택된 업종 ID (예: 'restaurant')
   * @param {string} bmId — 선택된 BM ID (예: 'franchise')
   * @param {Object} diagScores — 전체 진단 점수 객체
   * @returns {Array} 발동된 교차 경고 목록
   * ============================================================ */
  function detectCrossWarnings(industryId, bmId, diagScores) {
    const BM_ID_MAP = {
      '프랜차이즈': 'franchise',
      'B2B SaaS': 'b2b_saas',
      'B2C 구독': 'b2c_sub',
      'B2B 솔루션': 'b2b_solution',
      'B2C 커머스': 'b2c_commerce',
      '플랫폼·마켓플레이스': 'platform',
      '제조·유통': 'mfg_dist',
      '서비스업 (일반)': 'service',
      '기타': 'etc',
      '종량제': 'usage_based',
      '광고 기반': 'advertising',
      '딥테크·바이오': 'deeptech',
    };
    const INDUSTRY_ID_MAP = {
      '외식 및 휴게음식업': 'restaurant',
      '지식 서비스 및 IT 개발': 'knowledge_it',
      '수출 주도형 중소기업': 'export_sme',
      '뿌리 제조 및 부품가공업': 'mfg_parts',
      '식품 제조 및 가공업': 'food_mfg',
      '생활밀착형 서비스업': 'local_service',
      '전문 유통 및 도소매업': 'wholesale',
      '소규모 건설 및 인테리어': 'construction',
      '의료 및 헬스케어': 'medical',
      '금융 및 핀테크': 'finance',
      '교육 서비스 및 에듀테크': 'education',
      '패션 및 뷰티 브랜드': 'fashion',
      '미디어 및 엔터테인먼트': 'media',
      '물류 및 운송업': 'logistics',
      '환경 및 에너지업': 'energy',
      '농림 및 식품원료업': 'agri_food',
    };
    industryId = INDUSTRY_ID_MAP[industryId] || industryId;
    bmId = BM_ID_MAP[bmId] || bmId;
    if (!industryId || !bmId || !diagScores) return [];

    const scoreMap = buildScoreMap(diagScores);
    const warnings = [];

    CROSS_RULES.forEach(rule => {
      if (rule.industry !== industryId && rule.industry !== '*') return;
      if (rule.bm !== bmId && rule.bm !== '*') return;

      const triggered = rule.triggers.every(trigger => {
        const keyPatterns = [
          `diag-industry-container_${trigger.key}`,
          `diag-bm-container_${trigger.key}`,
          `diag-common-container_${trigger.key}`,
          trigger.key,
        ];
        const score = keyPatterns.reduce((found, pattern) => {
          return found !== null ? found : (scoreMap[pattern] !== undefined ? scoreMap[pattern] : null);
        }, null);

        return score !== null && score <= trigger.threshold;
      });

      if (triggered) {
        warnings.push({
          id: rule.id,
          level: rule.level,
          industry: rule.industry,
          bm: rule.bm,
          msg: rule.msg,
        });
      }
    });

    return warnings.sort((a, b) => {
      const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 };
      return (order[a.level] || 2) - (order[b.level] || 2);
    });
  }

  /* ============================================================
   * AI 프롬프트용 교차 경고 요약 텍스트 생성
   * ============================================================ */
  function buildPromptSummary(industryId, bmId, diagScores) {
    const warnings = detectCrossWarnings(industryId, bmId, diagScores);
    if (warnings.length === 0) {
      return '[업종×BM 교차 진단]\n복합 경고 없음. 업종과 BM 조합이 안정적입니다.';
    }

    const lines = warnings.map(w =>
      `  ⚠ [${w.level}] ${w.msg}`
    ).join('\n');

    return `[업종×BM 교차 진단 — ${warnings.length}개 복합 경고 발견]\n${lines}`;
  }

  /* ============================================================
   * 특정 업종·BM 조합에 해당하는 규칙 목록 반환
   * ============================================================ */
  function getRulesFor(industryId, bmId) {
    return CROSS_RULES.filter(r =>
      (r.industry === industryId || r.industry === '*') &&
      (r.bm === bmId || r.bm === '*')
    );
  }

  /* ============================================================
   * 전체 규칙 통계 반환
   * ============================================================ */
  function getStats() {
    const byLevel = { CRITICAL: 0, HIGH: 0, MEDIUM: 0 };
    CROSS_RULES.forEach(r => { if (byLevel[r.level] !== undefined) byLevel[r.level]++; });
    return {
      total: CROSS_RULES.length,
      byLevel,
      industries: [...new Set(CROSS_RULES.map(r => r.industry))],
      bms: [...new Set(CROSS_RULES.map(r => r.bm))],
    };
  }

  /* ============================================================
   * Public API
   * ============================================================ */
  return {
    detectCrossWarnings,
    buildPromptSummary,
    getRulesFor,
    getStats,
    CROSS_RULES,
  };

})();

if (typeof window !== 'undefined') window.CrossContext = CrossContext;
if (typeof module !== 'undefined') module.exports = CrossContext;
