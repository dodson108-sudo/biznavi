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
      support: '최대 1억원 (정부 50% 매칭)',
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
      support: '최대 3,000만원 바우처',
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
      support: '최대 3억원 (공급기업 AI 서비스 이용권)',
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
      support: '최대 2,400만원 바우처',
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
      support: '1억~10억원 (연구비 75% 지원)',
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
      support: 'R&D 최대 5억원 + 사업화 자금',
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
      support: '최대 1억원 (수출 마케팅 비용 70% 지원)',
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
      support: '참가비 일부 지원 + 현지 바이어 매칭',
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
      support: '최대 5,000만원 (수출 마케팅 비용 80% 지원)',
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
      support: '최대 월 60만원 × 최대 12개월',
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
      support: '최대 월 80만원 × 최대 12개월',
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
      support: '최대 3억원 (사업화 자금 + 멘토링)',
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
      support: '최대 45억원 (저금리 융자, 연 2~3%대)',
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
      support: '최대 7,000만원 (저금리 융자)',
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
      support: '최대 2,000만원 (컨설팅 비용 70% 지원)',
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
      support: '쿠팡·네이버·카카오 입점 비용 및 마케팅 지원',
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
      support: '브랜드 인증 + 마케팅 비용 지원',
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
      support: '컨설팅·시설 개선비 지원 (최대 5,000만원)',
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
      support: '최대 1,000만원 (키오스크·POS·배달앱 연동 비용)',
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
      support: 'BIM·드론·IoT 도입 비용 지원',
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
      support: '최대 5억원 투자 + 규제 샌드박스',
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
      support: '실증 환경 제공 + 최대 5,000만원',
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
      support: '해외 전시·팝업·마케팅 비용 50% 지원',
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
      support: '최대 3억원 (제작비 50~70% 지원)',
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
      support: '컨설팅 및 교육 비용 지원',
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
      support: '수출·R&D·마케팅 패키지 지원 (최대 2억원)',
      summary: '수출 유망 중소기업 선정 후 3년간 R&D·마케팅·해외 인증 종합 지원.',
      url: 'https://www.sbc.or.kr',
      purpose: ['global', 'export', 'rd'],
      industry: ['제조업', 'IT/소프트웨어'],
      bizModel: ['제조·유통', 'B2B 솔루션'],
      size: ['small', 'medium'],
    },
  ];

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
  function getInterestTags(govSupport) {
    if (!govSupport) return [];
    if (govSupport.includes('디지털')) return ['digital', 'smart'];
    if (govSupport.includes('R&D'))    return ['rd'];
    if (govSupport.includes('수출'))   return ['export', 'global'];
    if (govSupport.includes('고용'))   return ['hire'];
    if (govSupport.includes('전반'))   return ['digital', 'rd', 'export', 'hire', 'marketing', 'fund'];
    return [];
  }

  // ── 핵심 매칭 함수 ────────────────────────────────────────────
  function match(d) {
    if (!d) return [];

    const sizeTag     = getSizeTag(d.employees);
    const interestTags = getInterestTags(d.govSupport);
    const industry    = d.industry || '';
    const bizModel    = d.bizModel || '';

    const scored = PROGRAMS.map(p => {
      let score = 0;

      // 관심 분야 일치: 3점 (가장 중요)
      if (interestTags.length > 0) {
        const matched = p.purpose.some(tag => interestTags.includes(tag));
        if (matched) score += 3;
      }

      // 업종 일치: 2점
      if (p.industry.includes('all') || p.industry.includes(industry)) score += 2;

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
      text += `     지원규모: ${p.support}\n`;
      text += `     내용: ${p.summary}\n`;
    });
    text += '\n위 지원사업을 로드맵 태스크·핵심전략·KPI에 구체적으로 녹여서 제시할 것.\n';
    text += '예: "1단계: ○○ 바우처 신청 (담당: 대표·재무팀, 기간: 1개월 내)" 형태로 구체화.\n';
    return text;
  }

  return { match, buildPromptBlock };

})();
