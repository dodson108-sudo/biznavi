/* ================================================================
   BizNavi Reference DB — 업종별 벤치마크 준거 데이터
   출처: 한국은행 기업경영분석(2023), 소상공인진흥공단 실태조사(2023),
         통계청 기업생멸통계(2023), 중소벤처기업부 중소기업 실태조사(2023)
   ※ ECOS API 실시간 데이터로 자동 갱신 가능한 항목은 _live 표기
   ================================================================ */

const ReferenceDB = (() => {

  /* ── 업종별 핵심 재무·생존 벤치마크 ─────────────────────────── */
  const INDUSTRY_BENCH = {

    construction: {
      label: '건설·인테리어',
      // 한국은행 기업경영분석 2023 건설업 기준
      operatingMargin:  { avg: 3.8,  good: 7.0,  unit: '%',  note: '건설업 평균 영업이익률' },
      debtRatio:        { avg: 198,  good: 120,  unit: '%',  note: '건설업 평균 부채비율 (높을수록 위험)' },
      revenueGrowth:    { avg: 3.2,  good: 8.0,  unit: '%',  note: '건설업 평균 매출성장률' },
      survival3yr:      { avg: 52,   unit: '%',  note: '소규모 건설·인테리어 3년 생존율' },
      survival5yr:      { avg: 38,   unit: '%',  note: '소규모 건설·인테리어 5년 생존율' },
      digitalRate:      { avg: 28,   unit: '%',  note: '디지털 도구(ERP·BIM) 활용 기업 비율' },
      keyRisk: '흑자도산(기성금 지연), 하자보수 충당금, 인건비 급등',
      industrySpecific: {
        contractWinRate:    { avg: 25, good: 45, unit: '%', note: '평균 수주 성공률(견적 대비)' },
        costOverrunRate:    { avg: 18, good: 5,  unit: '%', note: '원가 초과 발생률' },
        subcontractRatio:   { avg: 62, unit: '%', note: '외주(하도급) 의존 비율' },
      }
    },

    knowledge_it: {
      label: 'IT·소프트웨어·지식서비스',
      // 한국은행 정보통신업 + 중소SW기업 실태조사 2023
      operatingMargin:  { avg: 8.4,  good: 15.0, unit: '%',  note: 'IT·정보통신 평균 영업이익률' },
      debtRatio:        { avg: 95,   good: 60,   unit: '%',  note: 'IT기업 평균 부채비율' },
      revenueGrowth:    { avg: 11.2, good: 25.0, unit: '%',  note: 'SW·IT서비스 평균 매출성장률' },
      survival3yr:      { avg: 62,   unit: '%',  note: 'IT·소프트웨어 스타트업 3년 생존율' },
      survival5yr:      { avg: 44,   unit: '%',  note: 'IT·소프트웨어 스타트업 5년 생존율' },
      digitalRate:      { avg: 88,   unit: '%',  note: '디지털 도구 활용률(업종 특성상 높음)' },
      keyRisk: '인력 이탈, 기술 부채, 대형 플랫폼 종속, 프리랜서 의존',
      industrySpecific: {
        churnRate:          { avg: 8,   good: 3,  unit: '%/월', note: 'SaaS 평균 월 이탈률' },
        utilizationRate:    { avg: 72,  good: 85, unit: '%',   note: '인력 가동률(M/M 기준)' },
        projectWinRate:     { avg: 32,  good: 55, unit: '%',   note: 'RFP 수주율' },
      }
    },

    restaurant: {
      label: '외식·음식점·카페',
      // 소상공인진흥공단 외식업 실태조사 2023
      operatingMargin:  { avg: 5.2,  good: 12.0, unit: '%',  note: '외식업 평균 영업이익률' },
      debtRatio:        { avg: 215,  good: 100,  unit: '%',  note: '외식업 평균 부채비율' },
      revenueGrowth:    { avg: 4.1,  good: 12.0, unit: '%',  note: '외식업 평균 매출성장률' },
      survival3yr:      { avg: 38,   unit: '%',  note: '외식업 3년 생존율 (폐업률 62%)' },
      survival5yr:      { avg: 22,   unit: '%',  note: '외식업 5년 생존율 (폐업률 78%)' },
      digitalRate:      { avg: 41,   unit: '%',  note: '배달앱·포스 외 디지털 도구 활용률' },
      keyRisk: '임대료·인건비 고정비, 배달플랫폼 수수료(15~30%), 원자재 가격 변동',
      industrySpecific: {
        foodCostRatio:      { avg: 32,  good: 25, unit: '%', note: '식재료비 비율(매출 대비)' },
        laborCostRatio:     { avg: 28,  good: 22, unit: '%', note: '인건비 비율(매출 대비)' },
        rentRatio:          { avg: 13,  good: 8,  unit: '%', note: '임대료 비율(매출 대비)' },
        tableTurnover:      { avg: 3.2, good: 5.5, unit: '회/일', note: '테이블 회전율' },
        deliveryRatio:      { avg: 38,  unit: '%', note: '배달매출 비중' },
      }
    },

    mfg_parts: {
      label: '제조·부품·가공',
      // 한국은행 제조업(기계·금속·부품) 기업경영분석 2023
      operatingMargin:  { avg: 4.8,  good: 9.0,  unit: '%',  note: '중소 제조업 평균 영업이익률' },
      debtRatio:        { avg: 112,  good: 70,   unit: '%',  note: '중소 제조업 평균 부채비율' },
      revenueGrowth:    { avg: 3.5,  good: 10.0, unit: '%',  note: '중소 제조업 평균 매출성장률' },
      survival3yr:      { avg: 58,   unit: '%',  note: '중소 제조업 3년 생존율' },
      survival5yr:      { avg: 43,   unit: '%',  note: '중소 제조업 5년 생존율' },
      digitalRate:      { avg: 35,   unit: '%',  note: '스마트공장 도입률(중소 제조)' },
      keyRisk: '원자재 가격 상승, 납품 단가 인하 압력, 숙련 인력 부족, 설비 노후화',
      industrySpecific: {
        defectRate:         { avg: 2.8, good: 0.5, unit: '%',    note: '불량률 평균' },
        capacityUtilization:{ avg: 72,  good: 90,  unit: '%',    note: '설비 가동률' },
        inventoryTurnover:  { avg: 8.2, good: 14,  unit: '회/년', note: '재고 회전율' },
        oemDependency:      { avg: 68,  unit: '%',  note: '상위 3개 거래처 매출 집중도' },
      }
    },

    food_mfg: {
      label: '식품 제조·가공',
      operatingMargin:  { avg: 4.2,  good: 8.0,  unit: '%',  note: '식품제조업 평균 영업이익률' },
      debtRatio:        { avg: 98,   good: 65,   unit: '%',  note: '식품제조업 평균 부채비율' },
      revenueGrowth:    { avg: 5.3,  good: 12.0, unit: '%',  note: '식품제조업 평균 매출성장률' },
      survival3yr:      { avg: 55,   unit: '%',  note: '식품제조 3년 생존율' },
      survival5yr:      { avg: 40,   unit: '%',  note: '식품제조 5년 생존율' },
      digitalRate:      { avg: 29,   unit: '%',  note: 'MES·ERP 도입률' },
      keyRisk: 'HACCP 유지비용, 원물 가격 변동, 유통기한 관리, 대형마트 납품 단가 압박',
      industrySpecific: {
        rawMaterialRatio:   { avg: 45,  good: 35, unit: '%', note: '원재료 비율(매출 대비)' },
        productReturn:      { avg: 3.2, good: 1.0, unit: '%', note: '반품·클레임율' },
        haccp:              { note: 'HACCP 인증 미보유 시 대형유통 납품 사실상 불가' },
      }
    },

    wholesale: {
      label: '유통·도소매',
      // 한국은행 도소매업 기업경영분석 2023
      operatingMargin:  { avg: 2.8,  good: 6.0,  unit: '%',  note: '도소매업 평균 영업이익률' },
      debtRatio:        { avg: 168,  good: 90,   unit: '%',  note: '도소매업 평균 부채비율' },
      revenueGrowth:    { avg: 4.8,  good: 12.0, unit: '%',  note: '도소매업 평균 매출성장률' },
      survival3yr:      { avg: 50,   unit: '%',  note: '소매업 3년 생존율' },
      survival5yr:      { avg: 35,   unit: '%',  note: '소매업 5년 생존율' },
      digitalRate:      { avg: 52,   unit: '%',  note: '온라인채널 병행 운영 비율' },
      keyRisk: '온라인 플랫폼 종속, 재고 리스크, 채널 집중도, 마진 압박',
      industrySpecific: {
        inventoryTurnover:  { avg: 9.5, good: 18, unit: '회/년', note: '재고 회전율' },
        channelConcentration:{ avg: 72, unit: '%', note: '상위 3개 채널 매출 집중도' },
        onlineRatio:        { avg: 35, good: 55,  unit: '%', note: '온라인 매출 비중' },
      }
    },

    local_service: {
      label: '생활밀착형 서비스',
      operatingMargin:  { avg: 6.5,  good: 15.0, unit: '%',  note: '생활서비스업 평균 영업이익률' },
      debtRatio:        { avg: 145,  good: 80,   unit: '%',  note: '생활서비스 평균 부채비율' },
      revenueGrowth:    { avg: 3.8,  good: 10.0, unit: '%',  note: '생활서비스 평균 매출성장률' },
      survival3yr:      { avg: 45,   unit: '%',  note: '생활서비스 3년 생존율' },
      survival5yr:      { avg: 31,   unit: '%',  note: '생활서비스 5년 생존율' },
      digitalRate:      { avg: 38,   unit: '%',  note: '온라인 예약·SNS 마케팅 활용률' },
      keyRisk: '노쇼(No-show), 재방문율 의존, 플랫폼 수수료, 임대료',
      industrySpecific: {
        repeatRate:         { avg: 42, good: 65, unit: '%', note: '재방문·재구매율' },
        noShowRate:         { avg: 12, good: 3,  unit: '%', note: '노쇼율' },
        naverPlaceRating:   { avg: 4.1, good: 4.5, unit: '점', note: '네이버플레이스 평균 별점' },
      }
    },

    medical: {
      label: '의료·헬스케어',
      operatingMargin:  { avg: 7.2,  good: 15.0, unit: '%',  note: '의원급 평균 영업이익률' },
      debtRatio:        { avg: 128,  good: 70,   unit: '%',  note: '의료기관 평균 부채비율' },
      revenueGrowth:    { avg: 5.8,  good: 12.0, unit: '%',  note: '의원급 평균 매출성장률' },
      survival3yr:      { avg: 72,   unit: '%',  note: '의원·한의원 3년 생존율' },
      survival5yr:      { avg: 58,   unit: '%',  note: '의원·한의원 5년 생존율' },
      digitalRate:      { avg: 65,   unit: '%',  note: 'EMR·예약시스템 도입률' },
      keyRisk: '비급여 규제, 의료광고법, 건보 수가 동결, 경쟁 심화',
      industrySpecific: {
        nonInsuranceRatio:  { avg: 38, good: 55, unit: '%', note: '비급여 매출 비중' },
        patientRetention:   { avg: 55, good: 75, unit: '%', note: '환자 재방문율(6개월)' },
        reviewCount:        { avg: 85, good: 200, unit: '건', note: '네이버·카카오 리뷰 수' },
      }
    },

    education: {
      label: '교육·학원',
      operatingMargin:  { avg: 7.8,  good: 18.0, unit: '%',  note: '교육서비스 평균 영업이익률' },
      debtRatio:        { avg: 88,   good: 50,   unit: '%',  note: '교육기관 평균 부채비율' },
      revenueGrowth:    { avg: 6.2,  good: 15.0, unit: '%',  note: '교육서비스 평균 매출성장률' },
      survival3yr:      { avg: 55,   unit: '%',  note: '교육업 3년 생존율' },
      survival5yr:      { avg: 40,   unit: '%',  note: '교육업 5년 생존율' },
      digitalRate:      { avg: 58,   unit: '%',  note: '온라인·하이브리드 강의 병행률' },
      keyRisk: '스타 강사 의존, 학령인구 감소, 플랫폼 강의 경쟁, 계절성 매출',
      industrySpecific: {
        reenrollRate:       { avg: 48, good: 72, unit: '%', note: '재등록률(수강 만료 후)' },
        referralRate:       { avg: 22, good: 40, unit: '%', note: '지인 추천 신규 등록 비율' },
        instructorDep:      { avg: 65, unit: '%', note: '특정 강사 의존 매출 비중' },
      }
    },

    fashion: {
      label: '패션·뷰티',
      operatingMargin:  { avg: 5.5,  good: 12.0, unit: '%',  note: '패션·뷰티 평균 영업이익률' },
      debtRatio:        { avg: 135,  good: 75,   unit: '%',  note: '패션·뷰티 평균 부채비율' },
      revenueGrowth:    { avg: 7.2,  good: 20.0, unit: '%',  note: '패션·뷰티 평균 매출성장률' },
      survival3yr:      { avg: 48,   unit: '%',  note: '패션·뷰티 3년 생존율' },
      survival5yr:      { avg: 33,   unit: '%',  note: '패션·뷰티 5년 생존율' },
      digitalRate:      { avg: 68,   unit: '%',  note: 'SNS·온라인몰 활용률' },
      keyRisk: '재고 리스크(시즌성), 플랫폼 수수료(무신사·에이블리 20~30%), 트렌드 사이클',
      industrySpecific: {
        inventoryWriteoff:  { avg: 12, good: 4,  unit: '%', note: '재고 폐기율' },
        onlineSalesRatio:   { avg: 55, good: 75, unit: '%', note: '온라인 매출 비중' },
        roas:               { avg: 180, good: 350, unit: '%', note: 'SNS광고 ROAS(광고 대비 매출)' },
      }
    },

    media: {
      label: '미디어·엔터테인먼트·콘텐츠',
      operatingMargin:  { avg: 6.8,  good: 18.0, unit: '%',  note: '콘텐츠·미디어 평균 영업이익률' },
      debtRatio:        { avg: 102,  good: 60,   unit: '%',  note: '미디어·콘텐츠 평균 부채비율' },
      revenueGrowth:    { avg: 9.5,  good: 25.0, unit: '%',  note: '콘텐츠업 평균 매출성장률' },
      survival3yr:      { avg: 50,   unit: '%',  note: '미디어·콘텐츠 3년 생존율' },
      survival5yr:      { avg: 35,   unit: '%',  note: '미디어·콘텐츠 5년 생존율' },
      digitalRate:      { avg: 85,   unit: '%',  note: '디지털 제작·유통 활용률' },
      keyRisk: 'IP(지식재산권) 관리, 선수금 의존(흑자도산), 플랫폼 정책 변경',
      industrySpecific: {
        ipRoyaltyRatio:     { avg: 18, good: 40, unit: '%', note: 'IP 로열티·2차저작 매출 비중' },
        projectConcentration:{ avg: 70, unit: '%', note: '상위 3개 프로젝트 매출 집중도' },
      }
    },

    logistics: {
      label: '물류·운송',
      operatingMargin:  { avg: 4.2,  good: 8.0,  unit: '%',  note: '운수·창고업 평균 영업이익률' },
      debtRatio:        { avg: 188,  good: 100,  unit: '%',  note: '운수업 평균 부채비율' },
      revenueGrowth:    { avg: 5.1,  good: 12.0, unit: '%',  note: '물류업 평균 매출성장률' },
      survival3yr:      { avg: 58,   unit: '%',  note: '물류·운송 3년 생존율' },
      survival5yr:      { avg: 42,   unit: '%',  note: '물류·운송 5년 생존율' },
      digitalRate:      { avg: 32,   unit: '%',  note: 'TMS·WMS 도입률' },
      keyRisk: '연료비 변동, 공차율, 차량 감가상각, 기사 수급 부족',
      industrySpecific: {
        emptyRunRate:       { avg: 32, good: 15, unit: '%', note: '공차율(빈 차 운행 비율)' },
        fuelCostRatio:      { avg: 28, good: 22, unit: '%', note: '연료비 비율(매출 대비)' },
        vehicleUtilization: { avg: 68, good: 85, unit: '%', note: '차량 가동률' },
      }
    },

    energy: {
      label: '환경·에너지',
      operatingMargin:  { avg: 6.5,  good: 14.0, unit: '%',  note: '에너지·환경 평균 영업이익률' },
      debtRatio:        { avg: 142,  good: 80,   unit: '%',  note: '에너지·환경 평균 부채비율' },
      revenueGrowth:    { avg: 12.8, good: 25.0, unit: '%',  note: '신재생에너지 평균 매출성장률' },
      survival3yr:      { avg: 62,   unit: '%',  note: '에너지·환경 3년 생존율' },
      survival5yr:      { avg: 48,   unit: '%',  note: '에너지·환경 5년 생존율' },
      digitalRate:      { avg: 45,   unit: '%',  note: 'IoT·모니터링 시스템 도입률' },
      keyRisk: '정책 변동 리스크, 인허가 지연, Backlog 관리, REC 가격 변동',
      industrySpecific: {
        backlogMonths:      { avg: 8,  good: 18, unit: '개월', note: '수주잔고(Backlog) 규모' },
        permissionDelay:    { avg: 6,  unit: '개월', note: '평균 인허가 소요 기간' },
      }
    },

    agri_food: {
      label: '농림·식품원료',
      operatingMargin:  { avg: 3.8,  good: 8.0,  unit: '%',  note: '농림식품 평균 영업이익률' },
      debtRatio:        { avg: 125,  good: 70,   unit: '%',  note: '농림식품 평균 부채비율' },
      revenueGrowth:    { avg: 4.5,  good: 12.0, unit: '%',  note: '농림식품 평균 매출성장률' },
      survival3yr:      { avg: 55,   unit: '%',  note: '농림식품 3년 생존율' },
      survival5yr:      { avg: 40,   unit: '%',  note: '농림식품 5년 생존율' },
      digitalRate:      { avg: 22,   unit: '%',  note: '스마트팜·디지털 유통 활용률' },
      keyRisk: '기상 리스크, 원물 가격 변동, HACCP 인증, 유통 마진 구조',
      industrySpecific: {
        weatherRisk:        { note: '기상이변 시 원가 20~40% 급등 가능' },
        yieldLoss:          { avg: 8, unit: '%', note: '평균 수율 손실률' },
      }
    },

    export_sme: {
      label: '수출 중소기업',
      operatingMargin:  { avg: 5.2,  good: 10.0, unit: '%',  note: '수출 중소기업 평균 영업이익률' },
      debtRatio:        { avg: 108,  good: 65,   unit: '%',  note: '수출 중소기업 평균 부채비율' },
      revenueGrowth:    { avg: 6.8,  good: 15.0, unit: '%',  note: '수출 중소기업 평균 매출성장률' },
      survival3yr:      { avg: 65,   unit: '%',  note: '수출 중소기업 3년 생존율' },
      survival5yr:      { avg: 50,   unit: '%',  note: '수출 중소기업 5년 생존율' },
      digitalRate:      { avg: 48,   unit: '%',  note: '디지털 수출 채널 활용률' },
      keyRisk: '환율 변동(환헤지 미비), 바이어 집중도, 인증·통관 리스크',
      industrySpecific: {
        buyerConcentration: { avg: 65, unit: '%', note: '상위 3개 바이어 매출 집중도' },
        exchangeHedge:      { avg: 28, good: 70, unit: '%', note: '환헤지(선물환) 실행률' },
        certificationCount: { avg: 2.1, good: 4, unit: '개', note: '보유 해외인증 수' },
      }
    },

    finance: {
      label: '금융·핀테크',
      operatingMargin:  { avg: 12.5, good: 22.0, unit: '%',  note: '금융·핀테크 평균 영업이익률' },
      debtRatio:        { avg: 320,  good: 200,  unit: '%',  note: '금융업 평균 부채비율(업종 특성상 높음)' },
      revenueGrowth:    { avg: 8.5,  good: 20.0, unit: '%',  note: '핀테크·금융 평균 매출성장률' },
      survival3yr:      { avg: 58,   unit: '%',  note: '핀테크 스타트업 3년 생존율' },
      survival5yr:      { avg: 42,   unit: '%',  note: '핀테크 스타트업 5년 생존율' },
      digitalRate:      { avg: 92,   unit: '%',  note: '디지털 서비스 제공률' },
      keyRisk: '금융규제(금소법), FDS 의무화, 금리 변동, 라이선스 획득 비용',
      industrySpecific: {
        npl:                { avg: 1.8, good: 0.8, unit: '%', note: '연체율(NPL)' },
        isms:               { note: 'ISMS 인증 미보유 시 일부 서비스 불가' },
      }
    }
  };

  /* ── 업종별 벤치마크 프롬프트 블록 생성 ────────────────────── */
  function buildPromptBlock(industryKey) {
    const bench = INDUSTRY_BENCH[industryKey];
    if (!bench) return '';

    const lines = [];
    lines.push(`[${bench.label} — 업종 벤치마크 준거 데이터]`);
    lines.push(`출처: 한국은행 기업경영분석·소상공인진흥공단 실태조사 2023 기준`);
    lines.push('');
    lines.push(`■ 핵심 재무 지표 (이 수치와 비교하여 귀사 현황을 평가할 것)`);
    lines.push(`  · 영업이익률: 업종 평균 ${bench.operatingMargin.avg}% / 우수기업 ${bench.operatingMargin.good}% 이상`);
    lines.push(`  · 부채비율: 업종 평균 ${bench.debtRatio.avg}% / 우수기업 ${bench.debtRatio.good}% 이하`);
    lines.push(`  · 매출성장률: 업종 평균 ${bench.revenueGrowth.avg}% / 우수기업 ${bench.revenueGrowth.good}% 이상`);
    lines.push('');
    lines.push(`■ 생존율 현실`);
    lines.push(`  · 3년 생존율: ${bench.survival3yr.avg}% → 창업 후 3년 내 ${100-bench.survival3yr.avg}%가 폐업`);
    lines.push(`  · 5년 생존율: ${bench.survival5yr.avg}% → 5년 내 ${100-bench.survival5yr.avg}%가 폐업`);
    lines.push(`  · 핵심 폐업 원인: ${bench.keyRisk}`);
    lines.push('');
    lines.push(`■ 디지털화 수준`);
    lines.push(`  · 업종 내 디지털 도구 활용 기업 비율: ${bench.digitalRate.avg}%`);

    if (bench.industrySpecific) {
      lines.push('');
      lines.push(`■ 업종 핵심 KPI 벤치마크`);
      Object.entries(bench.industrySpecific).forEach(([key, val]) => {
        if (val.avg !== undefined && val.good !== undefined) {
          const dir = val.unit?.includes('%') ? '' : '';
          lines.push(`  · ${val.note}: 현재 평균 ${val.avg}${val.unit} / 우수 ${val.good}${val.unit}`);
        } else if (val.note) {
          lines.push(`  · ${val.note}`);
        }
      });
    }

    lines.push('');
    lines.push(`[AI 벤치마킹 지침]`);
    lines.push(`위 수치를 기준으로 귀사의 현황을 반드시 비교·평가하십시오.`);
    lines.push(`"영업이익률이 업종 평균(${bench.operatingMargin.avg}%) 대비 높다/낮다" 형태로 구체적으로 언급할 것.`);
    lines.push(`KPI 목표치 설정 시 '우수기업' 수준을 12개월 목표로 설정할 것.`);

    return lines.join('\n');
  }

  /* ── 대시보드용: 업종 벤치마크 요약 객체 반환 ───────────────── */
  function getBench(industryKey) {
    return INDUSTRY_BENCH[industryKey] || null;
  }

  /* ── 벤치마크 대비 수준 판정 ────────────────────────────────── */
  function evalMargin(industryKey, actual) {
    const b = INDUSTRY_BENCH[industryKey];
    if (!b || actual === null || actual === undefined) return null;
    const avg  = b.operatingMargin.avg;
    const good = b.operatingMargin.good;
    if (actual >= good)       return { level: 'high',  label: `업종 우수기업 수준 (평균 ${avg}% 대비 +${(actual-avg).toFixed(1)}%p)` };
    if (actual >= avg)        return { level: 'ok',    label: `업종 평균 수준 (평균 ${avg}%)` };
    if (actual >= avg * 0.6)  return { level: 'warn',  label: `업종 평균(${avg}%) 이하 — 개선 필요` };
    return                           { level: 'danger', label: `업종 평균(${avg}%) 대비 심각하게 낮음 — 즉각 대응 필요` };
  }

  return { buildPromptBlock, getBench, evalMargin, INDUSTRY_BENCH };
})();
