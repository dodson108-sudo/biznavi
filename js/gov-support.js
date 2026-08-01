/* ================================================================
   BizNavi AI — gov-support.js
   정부지원사업 DB + 기업 정보 기반 자동 매칭
   ================================================================ */

const GovSupport = (() => {

  // ── 정부지원사업 DB ───────────────────────────────────────────
  // purpose 태그: 'digital' | 'rd' | 'export' | 'hire' | 'marketing' | 'fund' | 'smart' | 'global'
  // industry 태그: wizard.js 업종 선택값과 동일
  // size 태그: 'micro'(<10명) | 'small'(<50명) | 'medium'(<300명) | 'large'(300+) | 'all'
  const PROGRAMS = [
    // ── 디지털·스마트화 ───────────────────────────────────────
    {
      id: 'smart_factory',
      name: '스마트공장 보급·확산사업',
      org: '중소벤처기업부',
      supportType: '설비 도입비 매칭 지원',
      summary: '제조 공정 자동화·디지털화 설비 도입 비용 지원. IoT·AI·로봇 등 스마트 기술 적용.',
      url: 'https://www.smart-factory.kr',
      purpose: ['smart', 'digital'],
      industry: ['제조업', '식품/음료'],
      bizModel: ['제조·유통'],
      size: ['small', 'medium', 'large'],
    },
    {
      id: 'digital_voucher',
      name: '중소기업 디지털 전환 바우처',
      org: '중소벤처기업부',
      supportType: '바우처 형태 지원',
      summary: 'ERP·CRM·클라우드·AI 도입 등 디지털 전환 비용의 최대 70% 지원.',
      url: 'https://www.bizinfo.go.kr',
      purpose: ['digital'],
      industry: ['all'],
      bizModel: ['all'],
      size: ['micro', 'small', 'medium'],
    },
    {
      id: 'ai_voucher',
      name: 'AI 바우처 지원사업',
      org: '과학기술정보통신부',
      supportType: 'AI 서비스 이용권(바우처) 지원',
      summary: 'AI 솔루션 도입·활용을 위한 바우처 지원. 수요기업이 공급기업의 AI 서비스를 저렴하게 이용.',
      url: 'https://www.aivoucher.kr',
      purpose: ['digital', 'rd'],
      industry: ['IT/소프트웨어', '제조업', '의료/헬스케어', '금융/핀테크'],
      bizModel: ['B2B SaaS', 'B2B 솔루션', '플랫폼·마켓플레이스'],
      size: ['micro', 'small', 'medium'],
    },
    {
      id: 'cloud_voucher',
      name: '클라우드 서비스 바우처',
      org: '과학기술정보통신부',
      supportType: '바우처 형태 지원',
      summary: 'AWS·Azure·네이버클라우드 등 클라우드 서비스 이용료 지원. SaaS·IaaS·PaaS 포함.',
      url: 'https://www.nia.or.kr',
      purpose: ['digital'],
      industry: ['IT/소프트웨어', '서비스업'],
      bizModel: ['B2B SaaS', 'B2C 구독', 'B2B 솔루션'],
      size: ['micro', 'small', 'medium'],
    },

    // ── R&D ────────────────────────────────────────────────────
    {
      id: 'smtech',
      name: '중소기업 기술개발(SMTECH) R&D',
      org: '중소벤처기업부',
      supportType: '연구개발비 지원',
      summary: '제품·공정·서비스 혁신 R&D 과제 지원. 과제 유형: 창업성장·전략·혁신형 등.',
      url: 'https://www.smtech.go.kr',
      purpose: ['rd'],
      industry: ['all'],
      bizModel: ['all'],
      size: ['micro', 'small', 'medium'],
    },
    {
      id: 'tips',
      name: 'TIPS (민간투자주도형 기술창업)',
      org: '중소벤처기업부',
      supportType: 'R&D·사업화 자금 지원',
      summary: '기술력 있는 초기 스타트업 대상. 엔젤투자 유치 후 정부 R&D·사업화 자금 매칭 지원.',
      url: 'https://www.jointips.or.kr',
      purpose: ['rd', 'fund'],
      industry: ['IT/소프트웨어', '의료/헬스케어', '제조업', '금융/핀테크'],
      bizModel: ['B2B SaaS', 'B2C 구독', '플랫폼·마켓플레이스', 'B2B 솔루션'],
      size: ['micro', 'small'],
    },

    // ── 수출 ───────────────────────────────────────────────────
    {
      id: 'export_voucher',
      name: '수출 바우처',
      org: 'KOTRA / 중소벤처기업부',
      supportType: '수출 마케팅 바우처 지원',
      summary: '해외 전시회 참가·글로벌 마케팅·인증 취득·번역 등 수출 준비 비용 지원.',
      url: 'https://www.exportvoucher.com',
      purpose: ['export', 'global'],
      industry: ['all'],
      bizModel: ['all'],
      size: ['micro', 'small', 'medium'],
    },
    {
      id: 'kotra_market',
      name: 'KOTRA 해외시장 개척단',
      org: 'KOTRA',
      supportType: '참가비 지원 + 현지 바이어 매칭',
      summary: '해외 바이어 발굴·수출 상담회·현지 조사 지원. 지역별·업종별 특화 프로그램 운영.',
      url: 'https://www.kotra.or.kr',
      purpose: ['export', 'global'],
      industry: ['제조업', '식품/음료', 'IT/소프트웨어', '패션/뷰티'],
      bizModel: ['제조·유통', 'B2B 솔루션'],
      size: ['small', 'medium'],
    },
    {
      id: 'agri_export',
      name: '농식품 수출지원사업',
      org: '농림축산식품부',
      supportType: '수출 마케팅 비용 지원',
      summary: '해외 식품 전시회·현지 홍보·인증 비용 지원. K-Food 브랜드화 특화.',
      url: 'https://www.kati.net',
      purpose: ['export'],
      industry: ['식품/음료'],
      bizModel: ['제조·유통', 'B2C 커머스'],
      size: ['micro', 'small', 'medium'],
    },

    // ── 고용 ───────────────────────────────────────────────────
    {
      id: 'youth_hire',
      name: '청년일자리도약장려금',
      org: '고용노동부',
      supportType: '청년 채용 인건비 지원',
      summary: '청년 신규 채용 시 인건비 지원. 5인 이상 중소기업 대상. 취업취약계층 우대.',
      url: 'https://www.work.go.kr',
      purpose: ['hire'],
      industry: ['all'],
      bizModel: ['all'],
      size: ['small', 'medium'],
    },
    {
      id: 'hire_subsidy',
      name: '고용촉진장려금',
      org: '고용노동부',
      supportType: '채용 인건비 지원',
      summary: '취업 취약계층(청년·장애인·고령자 등) 채용 시 인건비 일부 지원.',
      url: 'https://www.work.go.kr',
      purpose: ['hire'],
      industry: ['all'],
      bizModel: ['all'],
      size: ['micro', 'small', 'medium'],
    },

    // ── 자금·투자 ──────────────────────────────────────────────
    {
      id: 'startup_fund',
      name: '창업도약패키지',
      org: '중소벤처기업부',
      supportType: '사업화 자금 + 멘토링 지원',
      summary: '창업 3~7년차 스타트업 대상. 제품·서비스 고도화·판로 개척·글로벌 진출 지원.',
      url: 'https://www.k-startup.go.kr',
      purpose: ['fund', 'rd'],
      industry: ['all'],
      bizModel: ['B2B SaaS', 'B2C 구독', '플랫폼·마켓플레이스', 'B2C 커머스'],
      size: ['micro', 'small'],
    },
    {
      id: 'policy_loan',
      name: '중소기업 정책자금 융자',
      org: '중소벤처기업진흥공단',
      supportType: '저금리 융자',
      summary: '시설투자·운전자금·R&D 자금을 시중금리 대비 저금리로 융자 지원.',
      url: 'https://www.sbc.or.kr',
      purpose: ['fund'],
      industry: ['all'],
      bizModel: ['all'],
      size: ['small', 'medium'],
    },
    {
      id: 'soho_fund',
      name: '소상공인 정책자금',
      org: '소상공인시장진흥공단',
      supportType: '저금리 융자',
      summary: '소상공인 경영안정·성장기반 자금. 직접대출·대리대출 선택. 경영개선 자금 포함.',
      url: 'https://www.semas.or.kr',
      purpose: ['fund'],
      industry: ['외식 및 휴게음식업', '서비스업', '유통/물류'],
      bizModel: ['서비스업(기타)', '프랜차이즈'],
      size: ['micro'],
    },

    // ── 마케팅·판로 ────────────────────────────────────────────
    {
      id: 'consulting_voucher',
      name: '중소기업 컨설팅 바우처',
      org: '중소벤처기업부',
      supportType: '컨설팅 비용 바우처 지원',
      summary: '경영·마케팅·재무·HR 등 전문 컨설팅 비용 지원. 공인 컨설턴트 매칭.',
      url: 'https://www.bizinfo.go.kr',
      purpose: ['marketing'],
      industry: ['all'],
      bizModel: ['all'],
      size: ['micro', 'small', 'medium'],
    },
    {
      id: 'online_market',
      name: '온라인 판로개척 지원사업',
      org: '중소벤처기업부 / 소상공인시장진흥공단',
      supportType: '온라인몰 입점·마케팅 비용 지원',
      summary: '중소기업·소상공인 온라인 플랫폼 입점·광고·콘텐츠 제작 비용 지원.',
      url: 'https://www.semas.or.kr',
      purpose: ['marketing', 'digital'],
      industry: ['유통/물류', '외식 및 휴게음식업', '식품/음료', '패션/뷰티'],
      bizModel: ['B2C 커머스', '제조·유통', '프랜차이즈'],
      size: ['micro', 'small'],
    },
    {
      id: 'brand_korea',
      name: '브랜드K 선정·지원사업',
      org: '중소벤처기업부',
      supportType: '브랜드 인증 + 마케팅 비용 지원',
      summary: '우수 중소기업 제품 브랜드K 인증 후 국내외 마케팅 지원. 소비자 신뢰도 제고.',
      url: 'https://www.brandk.go.kr',
      purpose: ['marketing', 'export'],
      industry: ['제조업', '식품/음료', '패션/뷰티'],
      bizModel: ['제조·유통', 'B2C 커머스'],
      size: ['small', 'medium'],
    },

    // ── 업종 특화 ──────────────────────────────────────────────
    {
      id: 'haccp',
      name: '식품 HACCP 인증 지원사업',
      org: '식품의약품안전처',
      supportType: '컨설팅·시설 개선비 지원',
      summary: '식품 제조·가공업체 HACCP 인증 취득 비용 지원. 인증 후 공공기관 납품 우대.',
      url: 'https://www.foodsafetykorea.go.kr',
      purpose: ['rd', 'marketing'],
      industry: ['식품/음료'],
      bizModel: ['제조·유통', 'B2C 커머스'],
      size: ['micro', 'small', 'medium'],
    },
    {
      id: 'smart_store',
      name: '외식업 스마트화 지원사업',
      org: '농림축산식품부',
      supportType: '키오스크·POS·배달앱 연동 비용 지원',
      summary: '외식업 디지털화 (키오스크·스마트오더·배달 플랫폼 연동) 비용 지원.',
      url: 'https://www.mafra.go.kr',
      purpose: ['digital', 'smart'],
      industry: ['외식 및 휴게음식업'],
      bizModel: ['프랜차이즈', '서비스업(기타)'],
      size: ['micro', 'small'],
    },
    {
      id: 'smart_construction',
      name: '스마트 건설 기술 지원',
      org: '국토교통부',
      supportType: 'BIM·드론·IoT 도입 비용 지원',
      summary: '건설현장 디지털화(BIM·드론 측량·IoT 안전관리) 기술 도입 비용 지원.',
      url: 'https://www.molit.go.kr',
      purpose: ['smart', 'digital'],
      industry: ['건설/부동산'],
      bizModel: ['서비스업(기타)'],
      size: ['small', 'medium'],
    },
    {
      id: 'fintech_support',
      name: '핀테크 혁신펀드·지원센터',
      org: '금융위원회',
      supportType: '투자 연계 + 규제 샌드박스',
      summary: '핀테크 스타트업 혁신금융서비스 지정, 규제 샌드박스·투자 연계 지원.',
      url: 'https://www.fsc.go.kr',
      purpose: ['fund', 'rd'],
      industry: ['금융/핀테크', 'IT/소프트웨어'],
      bizModel: ['B2B SaaS', '플랫폼·마켓플레이스'],
      size: ['micro', 'small'],
    },
    {
      id: 'edu_tech',
      name: '에듀테크 소프트랩 지원',
      org: '교육부 / 한국교육학술정보원',
      supportType: '실증 환경 제공 + 사업비 지원',
      summary: '교육 분야 SW·AI 서비스 학교 현장 실증 지원. 공공기관 납품 연계 가능.',
      url: 'https://www.keris.or.kr',
      purpose: ['rd', 'marketing'],
      industry: ['교육'],
      bizModel: ['B2B SaaS', 'B2C 구독'],
      size: ['micro', 'small'],
    },
    {
      id: 'fashion_brand',
      name: '패션·뷰티 브랜드 글로벌 육성',
      org: '산업통상자원부',
      supportType: '해외 전시·팝업·마케팅 비용 지원',
      summary: 'K-패션·K-뷰티 글로벌 브랜딩 지원. 파리·뉴욕·도쿄 등 해외 전시 참가 지원.',
      url: 'https://www.motie.go.kr',
      purpose: ['export', 'marketing'],
      industry: ['패션/뷰티'],
      bizModel: ['B2C 커머스', '제조·유통'],
      size: ['small', 'medium'],
    },
    {
      id: 'media_content',
      name: '문화콘텐츠 제작 지원사업',
      org: '문화체육관광부 / 한국콘텐츠진흥원',
      supportType: '콘텐츠 제작비 지원',
      summary: '영상·게임·음악·웹툰 등 콘텐츠 제작 및 해외 유통 비용 지원.',
      url: 'https://www.kocca.kr',
      purpose: ['rd', 'export'],
      industry: ['미디어/엔터테인먼트'],
      bizModel: ['B2C 구독', '플랫폼·마켓플레이스'],
      size: ['micro', 'small', 'medium'],
    },
    {
      id: 'franchise_support',
      name: '프랜차이즈 가맹본부 경쟁력 강화',
      org: '중소벤처기업부 / 공정거래위원회',
      supportType: '컨설팅 및 교육 비용 지원',
      summary: '가맹본부 표준화·교육훈련·정보시스템 구축 지원. 가맹사업 분쟁 예방 컨설팅 포함.',
      url: 'https://www.ftc.go.kr',
      purpose: ['marketing', 'digital'],
      industry: ['외식 및 휴게음식업', '서비스업'],
      bizModel: ['프랜차이즈'],
      size: ['small', 'medium'],
    },
    {
      id: 'global_strong',
      name: '글로벌 강소기업 육성사업',
      org: '중소벤처기업부',
      supportType: '수출·R&D·마케팅 패키지 지원',
      summary: '수출 유망 중소기업 선정 후 3년간 R&D·마케팅·해외 인증 종합 지원.',
      url: 'https://www.sbc.or.kr',
      purpose: ['global', 'export', 'rd'],
      industry: ['제조업', 'IT/소프트웨어'],
      bizModel: ['제조·유통', 'B2B 솔루션'],
      size: ['small', 'medium'],
    },

    // ── api/bizinfo.js FALLBACK_PROGRAMS에서 병합 (2026-08-01) ────
    // 중복 7개는 병합하지 않음. 아래 3개만 기존 26개에 없던 고유 사업
    {
      id: 'soho_smart',
      name: '소상공인 스마트화 지원사업 (디지털 전환)',
      org: '소상공인시장진흥공단',
      supportType: '키오스크·POS·배달앱 등 디지털 기기 도입 바우처',
      period: '수시',
      summary: '키오스크·POS·배달앱·온라인 판매채널 도입 비용 지원. 디지털 전환이 필요한 소상공인 우선.',
      url: 'https://www.sbiz.or.kr',
      purpose: ['digital', 'smart'],
      industry: ['all'],
      bizModel: ['all'],
      size: ['micro'],
    },
    {
      id: 'soho_consulting',
      name: '소상공인 경영컨설팅 지원',
      org: '소상공인시장진흥공단',
      supportType: '전문가 파견 컨설팅',
      period: '수시',
      summary: '경영·세무·마케팅·법률 분야 전문가 컨설팅. 재무·운영이 취약한 소상공인에 적합.',
      url: 'https://www.sbiz.or.kr',
      purpose: ['fund', 'marketing'],
      industry: ['all'],
      bizModel: ['all'],
      size: ['micro'],
    },
    {
      id: 'untact_voucher',
      name: '비대면 서비스 바우처',
      org: '중소벤처기업부',
      supportType: '바우처 형태 지원',
      period: '정기 공고',
      summary: '화상회의·재택근무·사이버보안·클라우드 서비스 도입 비용 지원.',
      url: 'https://www.bizinfo.go.kr',
      purpose: ['digital'],
      industry: ['IT/소프트웨어', '서비스업', '외식 및 휴게음식업', '유통/물류', '교육'],
      bizModel: ['all'],
      size: ['micro', 'small', 'medium'],
    },
  ];

  /* 상시 지원사업(PROGRAMS) 전용 고지.
     ⚠ 구체 금액·비율·마감일은 매년 바뀌므로 하드코딩하지 않는다.
        앱은 '어떤 사업이 맞는지'만 판별하고 수치는 주관기관 공고로 넘긴다.
     실시간 공고(api/bizinfo)에는 이 문구를 붙이지 않는다 — 그쪽은 조회 시점의 실제 공고값이다. */
  const DISCLAIMER = '위 상시 지원사업의 지원 금액·요건·마감일은 매년 변경됩니다. 반드시 주관기관 공고를 확인하세요.';

  /* 업종 키(영문) → 라벨 역매핑 — wizard.js INDUSTRY_MAP과 값이 일치해야 함.
     ⚠ collect()의 d.industry는 #industry select 제거(2026-04-17) 이후 항상 ''이므로
        업종 판별은 industryKey(영문)를 역매핑해서 읽어야 한다. */
  const INDUSTRY_LABEL = {
    mfg_parts: '제조업',
    food_mfg: '식품/음료',
    local_service: '서비스업',
    wholesale: '유통/물류',
    restaurant: '외식 및 휴게음식업',
    knowledge_it: 'IT/소프트웨어',
    construction: '건설/부동산',
    medical: '의료/헬스케어',
    finance: '금융/핀테크',
    education: '교육',
    fashion: '패션/뷰티',
    media: '미디어/엔터테인먼트',
    export_sme: '수출중소기업',
    logistics: '물류운송',
    energy: '환경에너지',
    agri_food: '농림식품원료',
    etc: '기타',
    social_enterprise: '사회적기업',
    social_venture: '소셜벤처',
  };

  // ── 직원 수 → 기업 규모 변환 ──────────────────────────────────
  function getSizeTag(employees) {
    if (!employees) return 'all';
    const n = parseInt(employees.replace(/[^0-9]/g, '')) || 0;
    if (n < 10)  return 'micro';
    if (n < 50)  return 'small';
    if (n < 300) return 'medium';
    return 'large';
  }

  // ── govSupport 선택값 → purpose 태그 매핑 ────────────────────
  /* step4 govSupport 체크박스(복수 선택, ', ' 조인 문자열 또는 배열) → purpose 태그 누적.
     ⚠ 조기 return 금지 — 복수 선택 시 전부 반영되어야 한다.
        미선택이면 [] 반환 → match()에서 관심분야 필터를 적용하지 않는다 (빈 결과 방지) */
  function getInterestTags(govSupport) {
    if (!govSupport) return [];
    const text = Array.isArray(govSupport) ? govSupport.join(', ') : String(govSupport);
    const tags = new Set();
    if (text.includes('디지털'))   { tags.add('digital'); tags.add('smart'); }
    if (text.includes('R&D'))      { tags.add('rd'); }
    if (text.includes('수출'))     { tags.add('export'); tags.add('global'); }
    if (text.includes('고용'))     { tags.add('hire'); }
    if (text.includes('창업') || text.includes('성장')) { tags.add('fund'); tags.add('marketing'); }
    if (text.includes('정책 자금') || text.includes('정책자금') || text.includes('융자')) { tags.add('fund'); }
    return Array.from(tags);
  }

  // ── 핵심 매칭 함수 ────────────────────────────────────────────
  function match(d) {
    if (!d) return [];

    const sizeTag     = getSizeTag(d.employees);
    const interestTags = getInterestTags(d.govSupport);
    // d.industry는 항상 '' → industryKey(영문) 역매핑으로 보완. 둘 다 없으면 업종 필터 미적용
    const industry    = d.industry || INDUSTRY_LABEL[d.industryKey] || '';
    const bizModel    = d.bizModel || '';

    const scored = PROGRAMS.map(p => {
      let score = 0;

      // 관심 분야 일치: 3점 (가장 중요)
      if (interestTags.length > 0) {
        const matched = p.purpose.some(tag => interestTags.includes(tag));
        if (matched) score += 3;
      }

      // 업종 일치: 2점
      // 업종 미상(industry === '')이면 전 항목 동점 부여 → 특정 사업이 탈락하지 않게 한다
      if (!industry || p.industry.includes('all') || p.industry.includes(industry)) score += 2;

      // 사업모델 일치: 1점
      if (p.bizModel.includes('all') || p.bizModel.includes(bizModel)) score += 1;

      // 규모 일치: 1점
      if (p.size.includes('all') || p.size.includes(sizeTag)) score += 1;

      return { ...p, score };
    });

    // 점수 2점 이상, 점수 내림차순, 상위 6개
    return scored
      .filter(p => p.score >= 2)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }

  // ── 프롬프트용 텍스트 생성 ────────────────────────────────────
  function buildPromptBlock(d) {
    const matched = match(d);
    if (matched.length === 0) return '';

    let text = '\n[매칭된 정부지원사업 목록 — 로드맵 및 핵심전략에 반드시 반영할 것]\n';
    matched.forEach((p, i) => {
      text += `  ${i + 1}. [${p.org}] ${p.name}\n`;
      text += `     지원형태: ${p.supportType || '확인 필요'}\n`;
      text += `     내용: ${p.summary}\n`;
    });
    text += `\n※ ${DISCLAIMER}\n`;
    text += '구체적인 금액·비율·마감일을 지어내지 말 것. 지원 형태와 신청 필요성만 서술한다.\n';
    text += '\n위 지원사업을 로드맵 태스크·핵심전략·KPI에 구체적으로 녹여서 제시할 것.\n';
    text += '예: "1단계: ○○ 바우처 신청 (담당: 대표·재무팀, 기간: 1개월 내)" 형태로 구체화.\n';
    return text;
  }

  return { match, buildPromptBlock, DISCLAIMER };

})();
