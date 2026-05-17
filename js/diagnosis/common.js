/**
 * BizNavi AI 경영진단 시스템
 * common.js — 공통 경영 진단 (개편 v2.0)
 *
 * 구조: 5영역 × 4항목 = 20항목
 *   영역1: 재무·원가 건전성   (Prime Cost + ACM 기반)
 *   영역2: 디지털 가시성      (PLACE 프레임워크 기반)
 *   영역3: 시스템화·위임 지수 (OHI 기반)
 *   영역4: AI 리터러시 + DX 성숙도
 *   영역5: 마이크로 ESG
 *
 * 키 네이밍: diag-common-container_{영역}_{항목}
 */

const DiagCommon = (() => {

  const DOMAINS = [
    { id: 1, key: 'finance', label: '재무·원가 건전성', icon: '💰', desc: 'Prime Cost 통제력과 현금흐름 투명성을 진단합니다.', weight: 0.25 },
    { id: 2, key: 'digital', label: '디지털 가시성', icon: '🔍', desc: '로컬 SEO·다채널 최적화·온라인 평판 수준을 진단합니다.', weight: 0.20 },
    { id: 3, key: 'system', label: '시스템화·위임 지수', icon: '⚙️', desc: '대표 부재 시 조직이 자율 가동되는 수준을 진단합니다.', weight: 0.20 },
    { id: 4, key: 'ai_dx', label: 'AI 리터러시 & DX 성숙도', icon: '🤖', desc: 'AI 도구 내재화 수준과 디지털 전환 성숙도를 진단합니다.', weight: 0.20 },
    { id: 5, key: 'esg', label: '마이크로 ESG', icon: '🌱', desc: '노무·환경·지배구조 리스크 방어력을 진단합니다.', weight: 0.15 },
  ];

  const ITEMS = {
    '1_1': { label: '매출 대비 Prime Cost 통제력', question: '직접 재료비와 직접 인건비의 합계(Prime Cost)가 매출 대비 적정 비율로 관리되고 있습니까?', guide: '업종 기준치: 외식 60% / 제조 75% / IT 30% / 유통 80% 이하', scale: [{ score:1, desc:'Prime Cost 개념 없음. 원가율 데이터 전무.' },{ score:2, desc:'대략적 원가 감만 있고 데이터 관리 없음.' },{ score:3, desc:'월 단위 원가율 집계. 업종 기준치 인지.' },{ score:4, desc:'항목별 원가율 주 단위 추적. 초과 시 즉각 조치.' },{ score:5, desc:'ACM 산식(Minf·Lvol 가중)으로 실시간 시뮬레이션.' }], ai_trigger:{ threshold:2, warning:'prime_cost_critical' } },
    '1_2': { label: '현금 전환 사이클(CCC) 관리', question: '원재료 매입 대금 지급일부터 매출 채권 회수일까지 현금이 묶여 있는 기간(CCC)을 정량적으로 파악하고 있습니까?', guide: '재고일수 + 매출채권일수 − 매입채무일수 = CCC', scale: [{ score:1, desc:'CCC 개념 모름. 현금흐름 데이터 없음.' },{ score:2, desc:'통장 잔액만 확인. CCC 산출 경험 없음.' },{ score:3, desc:'분기 단위 어림 계산으로 자금 계획 반영.' },{ score:4, desc:'월 단위 CCC 산출로 매입 조건 능동 조정.' },{ score:5, desc:'ERP·회계 API 연동 실시간 CCC 모니터링.' }], ai_trigger:{ threshold:2, warning:'cash_cycle_risk' } },
    '1_3': { label: '손익분기점(BEP) 인지 및 관리', question: '일평균·월간 손익분기 매출액을 정확히 알고 있으며 실시간 매출 데이터와 비교하여 경영에 활용하고 있습니까?', guide: 'BEP = 고정비 ÷ (1 − 변동비율)', scale: [{ score:1, desc:'BEP 모름. 흑적자를 직감으로만 판단.' },{ score:2, desc:'대략적 BEP는 알지만 일별 관리 미활용.' },{ score:3, desc:'월 BEP 산출. 월말 달성 여부 확인.' },{ score:4, desc:'일 단위 BEP를 POS·ERP와 연동하여 매일 확인.' },{ score:5, desc:'고정비 변동 시 BEP 자동 재산출. 전략 즉각 반영.' }], ai_trigger:{ threshold:2, warning:'bep_unknown' } },
    '1_4': { label: '자금 투명성 및 증빙 관리', question: '사업 자금과 대표 개인 자금이 완전히 분리되어 있으며 전 지출에 적격 증빙이 100% 확보됩니까?', guide: '가지급금 비율 목표: 1% 미만', scale: [{ score:1, desc:'개인 계좌로 사업 수납. 무증빙 인출 빈번.' },{ score:2, desc:'계좌 분리했으나 가지급금 10% 이상.' },{ score:3, desc:'적격 증빙 90% 이상 확보. 세무 오류 거의 없음.' },{ score:4, desc:'회계 API 자동 대조. 무증빙 즉시 경고 체계.' },{ score:5, desc:'세무 무결점. 가지급금 1% 미만. 불공정 대응 증빙 완비.' }], ai_trigger:{ threshold:2, warning:'finance_transparency' } },
    '2_1': { label: '로컬 플랫폼 NAP 정합성', question: '네이버 스마트플레이스·카카오맵·구글 비즈니스 등 주요 플랫폼에 상호·주소·전화번호(NAP)가 일치하며 타겟 키워드가 포함되어 있습니까?', guide: 'NAP 불일치 채널은 검색 알고리즘 패널티 유발', scale: [{ score:1, desc:'플랫폼 등록 없거나 NAP 불일치율 50% 이상.' },{ score:2, desc:'등록 완료했으나 채널별 NAP 불일치.' },{ score:3, desc:'주요 포털 NAP 일치. 기본 키워드 타겟팅.' },{ score:4, desc:'다채널 NAP 동기화 + Schema 마크업 적용.' },{ score:5, desc:'API 기반 실시간 동기화 + 자동 크롤링 감시.' }], ai_trigger:{ threshold:2, warning:'nap_mismatch' } },
    '2_2': { label: '콘텐츠 최신성 및 알고리즘 대응', question: '검색엔진 최신 알고리즘에 대응하며 고화질 이미지(5장 이상)·FAQ·소식이 주간 단위로 업데이트되고 있습니까?', guide: '"요즘뜨는" 필터 노출 = 최신성 가중치 핵심', scale: [{ score:1, desc:'1년 이상 방치된 저화질 사진뿐.' },{ score:2, desc:'정기 업데이트 없음. 단순 서비스 나열.' },{ score:3, desc:'월 1회 수동 소식 업데이트.' },{ score:4, desc:'주 1회 고화질 업데이트. SEO 키워드 조정.' },{ score:5, desc:'AI 콘텐츠 자동화. SGE 대응 구조화 문서.' }], ai_trigger:{ threshold:2, warning:'content_stale' } },
    '2_3': { label: '고객 리뷰·평판 관리', question: '플랫폼 리뷰를 실시간 모니터링하며 48시간 내 맞춤형 답글을 제공하고 오가닉 리뷰 유도 시스템이 작동하고 있습니까?', guide: '평점 4.0 이상 + 주 20건 오가닉 리뷰 = 상위 노출 조건', scale: [{ score:1, desc:'리뷰 모니터링 없음. 평점 방치.' },{ score:2, desc:'부정 리뷰 시에만 비정기 답글.' },{ score:3, desc:'브랜드 가이드에 따라 실시간 답글. 4.0 유지.' },{ score:4, desc:'영수증·예약 연동 자동 리뷰 수집 가동.' },{ score:5, desc:'NLP 감성 분석 + 평판 리스크 조기 경보.' }], ai_trigger:{ threshold:2, warning:'reputation_risk' } },
    '2_4': { label: '다채널 광고·마케팅 ROAS', question: '채널별 광고비 투입 대비 실질 매출(ROAS)을 추적하고 효율 낮은 채널을 즉시 조정하고 있습니까?', guide: '채널별 순이익 = 매출 − 광고비 − 수수료 − 배송비', scale: [{ score:1, desc:'광고 없거나 ROAS 개념 모름.' },{ score:2, desc:'광고비 지출하지만 ROAS 미측정.' },{ score:3, desc:'월 단위 ROAS 확인. 분기 채널 조정.' },{ score:4, desc:'주 단위 ROAS 모니터링. 즉각 예산 재배분.' },{ score:5, desc:'실시간 ROAS 대시보드. AI 최적 배분 자동 제안.' }], ai_trigger:{ threshold:2, warning:'roas_blind' } },
    '3_1': { label: '목표·방향성 공유 (Direction)', question: '월간·주간 매출 목표가 전 직원과 공유되며 구성원이 당일 목표를 인지하고 능동적으로 행동하고 있습니까?', guide: '방향성 합의 = 구성원 능동 참여 유도', scale: [{ score:1, desc:'목표 없이 단순 노동. 직원이 목표 모름.' },{ score:2, desc:'구두로 대략적 목표만 통지.' },{ score:3, desc:'POS·화이트보드에 일 목표 상시 게시.' },{ score:4, desc:'목표 달성률 직원별 데이터화. 주간 피드백.' },{ score:5, desc:'실시간 대시보드 공유. 성과 인센티브 자동 연동.' }], ai_trigger:{ threshold:2, warning:'no_direction' } },
    '3_2': { label: '역할·책임 명료화 (Accountability)', question: '오픈·마감·위생 검수 등 시간대별 핵심 임무의 담당자와 책임 한계가 체크리스트로 문서화되어 있습니까?', guide: '책임 서면화 → 점주 부재 시 오퍼레이션 누수 예방', scale: [{ score:1, desc:'문제 시에만 대표 개입. R&R 문서화 없음.' },{ score:2, desc:'업무 분장은 됐으나 체크리스트·서명 없음.' },{ score:3, desc:'오픈·마감 체크리스트 존재. 담당자 서명.' },{ score:4, desc:'체크리스트 디지털 기록. 미이행 시 자동 알림.' },{ score:5, desc:'역할 달성률 성과급 연동. 365일 무결점 가동.' }], ai_trigger:{ threshold:2, warning:'accountability_gap' } },
    '3_3': { label: '원격 조율·디지털 통제 (Coordination)', question: '대표가 매장·현장에 장시간 부재해도 클라우드 POS·CCTV·대시보드로 매출과 이상 징후를 원격 파악할 수 있습니까?', guide: '클라우드 시스템 = 심리적 해방 + 다점포 확장 기반', scale: [{ score:1, desc:'현장 이탈 시 상황 파악 불가.' },{ score:2, desc:'직원 유선 보고에만 의존.' },{ score:3, desc:'CCTV 원격 + POS 마감 리포트 문자 수신.' },{ score:4, desc:'클라우드 POS로 실시간 매출·재고 원격 확인.' },{ score:5, desc:'통합 대시보드로 매출·인력·재고 원격 완전 감사.' }], ai_trigger:{ threshold:2, warning:'no_remote_control' } },
    '3_4': { label: 'SOP·교육 매뉴얼 체계 (Capability)', question: '신입 직원이 기존 매뉴얼과 동영상 SOP만으로 일정 품질을 유지할 수 있으며 핵심 기술이 문서화·영상화되어 있습니까?', guide: '동영상 QR SOP → 대표 교육 시간 90% 절감', scale: [{ score:1, desc:'대표 1개월 이상 상주 교육. 매뉴얼 전무.' },{ score:2, desc:'고참 눈대중 전수. 문서화 없음.' },{ score:3, desc:'핵심 업무 텍스트 매뉴얼 존재.' },{ score:4, desc:'동영상 SOP + QR코드 현장 부착.' },{ score:5, desc:'LMS 연동. 이수율 자동 추적. 숙련도 매트릭스.' }], ai_trigger:{ threshold:2, warning:'sop_missing' } },
    '4_1': { label: 'AI 마케팅·카피라이팅 활용', question: 'ChatGPT·Claude 등 생성형 AI를 활용하여 인스타그램 피드·소식·홍보문구를 정기적으로 자동 생성하고 있습니까?', guide: 'AI 카피라이팅 → 마케팅 실행 주기 70% 단축', scale: [{ score:1, desc:'AI 사용 경험 없음. 거부감 강함.' },{ score:2, desc:'AI 존재는 알지만 업무 미적용.' },{ score:3, desc:'검색 보조 용도로 간헐적 사용.' },{ score:4, desc:'페르소나 지정 프롬프트로 주기적 초안 생성.' },{ score:5, desc:'맞춤형 프롬프트 자산 보유. 마케팅 80% 자동 생성.' }], ai_trigger:{ threshold:2, warning:'ai_literacy_low' } },
    '4_2': { label: '백오피스 자동화 파이프라인', question: 'n8n·Make.com 등 로우코드 툴과 AI API를 결합하여 ERP·CRM·인사 관리의 반복 업무를 자동화 파이프라인으로 처리하고 있습니까?', guide: 'API Webhook 연동 → 수동 데이터 이관 시간 제거', scale: [{ score:1, desc:'완전 수동 타이핑. 메신저 일방 전달.' },{ score:2, desc:'엑셀 수동 매크로. 시스템 간 연동 없음.' },{ score:3, desc:'이메일 접수 시 슬랙 단순 알림 수준.' },{ score:4, desc:'n8n으로 ERP-CRM 자동 동기화.' },{ score:5, desc:'AI 에이전트 보고서 자동 생성. 업무 30% AI 처리.' }], ai_trigger:{ threshold:2, warning:'automation_missing' } },
    '4_3': { label: 'DX 성숙도 단계', question: 'POS·배달 플랫폼·ERP 등 핵심 시스템 데이터가 실시간으로 통합되어 데이터 기반 의사결정이 이루어지고 있습니까?', guide: '5단계: 초기수동→탐색노출→구축관리→최적화적용→지능연결', scale: [{ score:1, desc:'1단계: 수기 장부 중심. 디지털 전무.' },{ score:2, desc:'2단계: 주요 플랫폼 기본 등록.' },{ score:3, desc:'3단계: 리뷰 대응·예약 플랫폼 운영.' },{ score:4, desc:'4단계: AI 도구 마케팅·CS 상시 가동.' },{ score:5, desc:'5단계: 전 채널 실시간 통합. AI 마진 최적화.' }], ai_trigger:{ threshold:2, warning:'dx_stage_low' } },
    '4_4': { label: '전사 AI 리터러시 수준', question: '전 직원이 자사 업무에 최적화된 AI 프롬프트 가이드를 보유하고 있으며 일상 업무의 30% 이상을 AI로 처리하고 있습니까?', guide: '목표: 전사 업무 30% 이상 AI 협업', scale: [{ score:1, desc:'임직원 AI 지식 전무. 거부감 강함.' },{ score:2, desc:'범용 챗봇 개인 검색 보조만 활용.' },{ score:3, desc:'분기 1회 전사 AI 교육. 기초 가이드 보유.' },{ score:4, desc:'직무별 커스텀 프롬프트 템플릿 실무 임베딩.' },{ score:5, desc:'전사 30% AI 협업. 프롬프트 자산 확보 체계.' }], ai_trigger:{ threshold:2, warning:'org_ai_literacy_low' } },
    '5_1': { label: '탄소 배출 인벤토리 (E)', question: '월별 전기·가스·유류 사용량을 추적하여 Scope 1·2 탄소 배출 인벤토리를 보유하고 있으며 데이터로 입증 가능합니까?', guide: '공급망 ESG 실사는 탄소 배출 정량 데이터 품질 강력 요구', scale: [{ score:1, desc:'에너지 고지서 관리 없음. 탄소 파악 불가.' },{ score:2, desc:'고지서 보관하나 탄소 변환 불가.' },{ score:3, desc:'엑셀 수동 연산으로 분기별 탄소 기록.' },{ score:4, desc:'전문 탄소 회계 툴로 매월 자동 보관.' },{ score:5, desc:'대기업 공급망 실사 요건 탄소 인증서 확보.' }], ai_trigger:{ threshold:2, warning:'carbon_untracked' } },
    '5_2': { label: '폐기물·자원 순환 관리 (E)', question: '공정·영업 과정의 폐기물·식재료 로스 단가 가치를 계산하고 감축 목표를 설정·추적하고 있습니까?', guide: '폐기물 증가 = 공정 효율 저하 + 마진 축소 직접 신호', scale: [{ score:1, desc:'폐기물 관리 기준 없음. 무단 배출.' },{ score:2, desc:'폐기 비용 사후 정산. 원인 공정 식별 불가.' },{ score:3, desc:'원재료 손실 추적 분석. 개선 목표 정의.' },{ score:4, desc:'폐기물 1kg 감축당 ACM 개선 현업 적용.' },{ score:5, desc:'제로 웨이스트 순환 공정. 폐기 90% 차단.' }], ai_trigger:{ threshold:2, warning:'waste_unmanaged' } },
    '5_3': { label: '표준근로계약 및 노무 리스크 (S)', question: '일용직·아르바이트 포함 전 직원의 표준근로계약서를 근무 개시 전 당일 전자 체결·교부하고 노무 위반 리스크를 모니터링하고 있습니까?', guide: '근로기준법 위반 = 즉각적 사법 처리 요인', scale: [{ score:1, desc:'사후 계약서 소급 작성. 미체결 인력 상존.' },{ score:2, desc:'계약서 작성하나 교부 이력 미증빙.' },{ score:3, desc:'당일 전자 계약 100%. 원본 자동 교부.' },{ score:4, desc:'디지털 타임카드로 연장·야간 근로 자동 감시.' },{ score:5, desc:'전 직종 노무 위반 리스크 상시 감지 0%.' }], ai_trigger:{ threshold:2, warning:'labor_risk' } },
    '5_4': { label: '지배구조 및 공정 거래 방어 (G)', question: '원청·플랫폼과의 거래에서 구두 발주·단가 삭감·기술 탈취 등 불공정 행위에 대응하는 증빙 체계와 계약서 보호 장치가 가동되고 있습니까?', guide: '하도급법 준수 증빙 = 동반성장지수 가점 + 정책 자금 우선 선정', scale: [{ score:1, desc:'원청 구두 발주 수용. 대응 역량 없음.' },{ score:2, desc:'계약서는 있으나 변경·추가 증빙 체계 없음.' },{ score:3, desc:'전 거래 증빙 보관. 공문 대응 가능.' },{ score:4, desc:'상생협력 가점 기준 확보. 동반위 활동 연동.' },{ score:5, desc:'세무 무결점 + 부당 하도급 단가 회수 이력 보유.' }], ai_trigger:{ threshold:2, warning:'governance_weak' } },
  };

  function calcScores(scores) {
    const domainScores = {};
    DOMAINS.forEach(domain => {
      const keys = Object.keys(ITEMS).filter(k => k.startsWith(`${domain.id}_`));
      const vals = keys.map(k => scores[`diag-common-container_${k}`]).filter(v => v !== undefined && v !== null && v !== '');
      const avg = vals.length > 0 ? vals.reduce((a, b) => a + Number(b), 0) / vals.length : 0;
      domainScores[domain.key] = { label: domain.label, avg: Math.round(avg*10)/10, pct: Math.round((avg/5)*100), weight: domain.weight, items: keys.length, answered: vals.length };
    });
    const totalPct = DOMAINS.reduce((sum, d) => sum + (domainScores[d.key].pct * d.weight), 0);
    return { domains: domainScores, total: Math.round(totalPct) };
  }

  function detectCrossWarnings(scores) {
    const warnings = [];
    const get = key => Number(scores[`diag-common-container_${key}`] || 0);
    if (get('1_1') <= 2 && get('1_3') <= 2 && get('3_1') <= 2) warnings.push({ level:'CRITICAL', code:'intuition_mgmt', msg:'원가·BEP·목표 모두 감에만 의존하는 직감 경영 상태입니다. 데이터 기반 경영 체계 구축이 생존 조건입니다.' });
    if (get('2_1') <= 2 && get('4_1') <= 2 && get('4_3') <= 2) warnings.push({ level:'HIGH', code:'digital_blind', msg:'로컬 검색 노출도 AI 활용도 모두 최하위입니다. 경쟁사에 디지털 시장을 빼앗기고 있는 상태입니다.' });
    if (get('3_2') <= 2 && get('3_3') <= 2 && get('3_4') <= 2) warnings.push({ level:'HIGH', code:'owner_dependency', msg:'대표가 없으면 사업이 멈추는 구조입니다. 시스템화 없이는 확장도 승계도 불가능합니다.' });
    if (get('5_3') <= 2 && get('5_4') <= 2) warnings.push({ level:'CRITICAL', code:'legal_risk', msg:'근로기준법·하도급법 위반 리스크가 동시에 높습니다. 즉각 법적 점검이 필요합니다.' });
    if (get('1_4') <= 2 && get('5_3') <= 2 && get('5_4') <= 2) warnings.push({ level:'MEDIUM', code:'policy_fund_blocked', msg:'자금 투명성과 ESG 기준 미달로 정부 지원사업 우대 수혜 자격이 차단된 상태입니다.' });
    return warnings;
  }

  function buildPromptSummary(scores) {
    const result = calcScores(scores);
    const warnings = detectCrossWarnings(scores);
    const domainLines = DOMAINS.map(d => { const ds = result.domains[d.key]; const level = ds.pct >= 80 ? '우수' : ds.pct >= 60 ? '보통' : ds.pct >= 40 ? '취약' : '위험'; return `  - ${ds.label}: ${ds.pct}점 (${level})`; }).join('\n');
    const warnLines = warnings.length > 0 ? warnings.map(w => `  ⚠ [${w.level}] ${w.msg}`).join('\n') : '  - 복합 경고 없음';
    const criticalItems = [];
    Object.entries(ITEMS).forEach(([key, item]) => { const val = Number(scores[`diag-common-container_${key}`] || 0); if (val <= 2) criticalItems.push(`${item.label}(${val}점)`); });
    return `[공통 경영 진단 결과 — common.js v2.0]\n종합 점수: ${result.total}점 / 100점\n\n[영역별 점수]\n${domainLines}\n\n[복합 경고 신호]\n${warnLines}\n\n[즉각 처방 필요 항목 (2점 이하)]\n${criticalItems.length > 0 ? criticalItems.map(i => `  - ${i}`).join('\n') : '  - 없음'}`.trim();
  }

  function getSchema() { return { id:'common', label:'공통 경영 진단', version:'2.0', domains:DOMAINS, items:ITEMS }; }

  return { getSchema, calcScores, detectCrossWarnings, buildPromptSummary, DOMAINS, ITEMS };
})();

if (typeof window !== 'undefined') window.DiagCommon = DiagCommon;
