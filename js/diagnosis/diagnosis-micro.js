/**
 * BizNavi AI 경영진단 시스템
 * diagnosis-micro.js — 소상공인 전용 분기 진단 v1.0
 * 적용 조건: bizScale === 'micro'
 * 구조: 3영역 × 5항목 = 15항목
 *   영역A: 로컬 SEO & 디지털 평판 (PLACE 기반)
 *   영역B: 메뉴·상품 수익 엔지니어링 (ACM 기반)
 *   영역C: 위임 시스템 구축도 (OHI 기반)
 */

const DiagMicro = (() => {

  const DOMAINS = [
    { id:'A', key:'local_seo', label:'로컬 SEO & 디지털 평판', icon:'📍', desc:'소비자 여정 90% 이상이 포털 검색으로 시작됩니다.', weight:0.35 },
    { id:'B', key:'menu_engineering', label:'메뉴·상품 수익 엔지니어링', icon:'📊', desc:'메뉴별 ACM과 판매량을 교차 분석하여 수익 포트폴리오를 진단합니다.', weight:0.35 },
    { id:'C', key:'delegation', label:'위임 시스템 구축도', icon:'🏗️', desc:'사장 없이도 매장이 365일 안정 가동되는 수준을 진단합니다.', weight:0.30 },
  ];

  const ITEMS = {
    'A_1': { label:'플랫폼 프로파일링 (Profiling)', question:'네이버 스마트플레이스·카카오맵의 상호명에 거점 지명과 핵심 업종 키워드가 자연스럽게 통합되어 있으며 대표 이미지 5~7장 이상이 고화질로 등록되어 있습니까?', guide:'상호명·업종 키워드 일치성은 검색 로봇 유사도 판정의 1차 가중치', scale:[{score:1,desc:'상호명만 단순 등록. 키워드·이미지 전략 없음.'},{score:2,desc:'등록됐으나 키워드 미반영. 저화질 사진 1~2장.'},{score:3,desc:'업종 키워드 수동 매칭. 표준 품질 사진 3~4장.'},{score:4,desc:'타겟 키워드 자연 통합. 고화질 5~7장. 정기 업데이트.'},{score:5,desc:'지역별 랜딩페이지 구축. Schema 마크업. 실시간 키워드 최적화.'}], ai_trigger:{threshold:2,warning:'profiling_weak'} },
    'A_2': { label:'지역성 최적화 (Localization)', question:'구글 비즈니스 프로필에 외국인 대응 다국어 정보·인근 랜드마크 연계 안내가 구축되어 있으며 지역 커뮤니티(맘카페·당근마켓 등) 네트워크를 활용하고 있습니까?', guide:'구글 로컬 알고리즘 = 물리적 거리 + 글로벌 리뷰 신뢰도 가중', scale:[{score:1,desc:'국문 주소만 노출. 지역 커뮤니티 활동 없음.'},{score:2,desc:'영문 번역 부분 탑재. 지역 네트워크 미활용.'},{score:3,desc:'영문 기본 정보 완비. 지역 맘카페 가끔 활용.'},{score:4,desc:'다국어 메뉴판·랜드마크 안내 완비. 커뮤니티 정기 활동.'},{score:5,desc:'다국어 최적화 + 지역 오프라인 협약 + 당근 지역 광고 ROI 추적.'}], ai_trigger:{threshold:2,warning:'localization_weak'} },
    'A_3': { label:'오가닉 리뷰 축적 (Algorithm)', question:'어뷰징 없이 주간 단위로 오가닉 영수증 리뷰와 "저장하기" 트래픽이 꾸준히 축적되고 있으며 주 평균 리뷰 증가 수를 파악하고 있습니까?', guide:'플랫폼 어뷰징 적발 시 영구 노출 제외 처벌', scale:[{score:1,desc:'리뷰 누적 없음. 어뷰징 대행사 사용 중.'},{score:2,desc:'간헐적 이벤트로 월 평균 5건 미만.'},{score:3,desc:'정기 이벤트로 월 평균 10건 내외 유지.'},{score:4,desc:'결제 직후 리뷰 요청 동선 설계. 주 10~20건 축적.'},{score:5,desc:'주 평균 20건 이상 오가닉 리뷰 일관 생성.'}], ai_trigger:{threshold:2,warning:'review_stagnant'} },
    'A_4': { label:'콘텐츠 탁월성 (Content Excellence)', question:'인스타그램 릴스·네이버 플레이스 소식 탭에 최신 트렌드를 반영한 고화질 메뉴·프로모션 콘텐츠가 주간 단위로 업데이트되고 있습니까?', guide:'"요즘뜨는" 필터 = 최신성 × 시각적 매력도 × CTR', scale:[{score:1,desc:'1년 이상 방치된 저화질 사진뿐. 소식 탭 공백.'},{score:2,desc:'월 1회 미만 수동 업데이트. 트렌드 미반영.'},{score:3,desc:'월 2~3회 업데이트. 스마트폰 직접 촬영.'},{score:4,desc:'주 1회 고화질 업데이트. Canva AI 템플릿 활용.'},{score:5,desc:'ChatGPT 카피 + AI 디자인 자동화로 주 3회 예약 발행.'}], ai_trigger:{threshold:2,warning:'content_outdated'} },
    'A_5': { label:'고객 상호작용 (Engagement)', question:'플랫폼 리뷰에 48시간 내 맞춤형 답글을 제공하며 "알림 받기" 설정을 적극 유도하고 AI를 활용한 리뷰 응대 자동화가 이루어지고 있습니까?', guide:'예약·스마트콜·알림 받기 → 종합 인기도 지수 자극', scale:[{score:1,desc:'답변율 10% 미만. 리뷰 방치.'},{score:2,desc:'매크로 복사 기계적 답변.'},{score:3,desc:'주요 리뷰 수동 맞춤 답글. 답변율 50%.'},{score:4,desc:'AI 초안 생성 후 검수·발행. 답변율 90% 이상.'},{score:5,desc:'불만 유형별 감정 필터링 + n8n 자동 응대 파이프라인. 100% 즉시 처리.'}], ai_trigger:{threshold:2,warning:'engagement_low'} },

    'B_1': { label:'식재료·원가율 정밀 관리', question:'메뉴별 표준 레시피에 따른 식재료·원가율을 산출하고 있으며 인플레이션 가중 ACM 산식으로 실제 남는 마진을 추적하고 있습니까?', guide:'외식업 식재료 원가율 기준: 30~35% 이하 / 60% 이상 = 위험', scale:[{score:1,desc:'원가율 개념 없음. 감으로 가격 책정.'},{score:2,desc:'대략적 식재료 비용은 알지만 메뉴별 원가율 미산출.'},{score:3,desc:'주요 메뉴 원가율 월 단위 계산. 기준치 비교.'},{score:4,desc:'전 메뉴 레시피 기반 원가율 산출. 변동 가격 주 단위 반영.'},{score:5,desc:'ACM 산식(인플레이션·노동 변동 가중)으로 메뉴별 실시간 마진 시뮬레이션.'}], ai_trigger:{threshold:2,warning:'food_cost_blind'} },
    'B_2': { label:'메뉴 엔지니어링 4분면 분석', question:'전체 메뉴를 ACM과 판매량 기준으로 Star·Plowhorse·Puzzle·Dog 4분면으로 분류하고 각 전략을 실행하고 있습니까?', guide:'Dog 메뉴 제거 → 식재료 폐기 비용 즉시 절감 + 운영 복잡성 감소', scale:[{score:1,desc:'메뉴 분석 경험 없음. 관성으로 메뉴 유지.'},{score:2,desc:'잘 팔리는 메뉴는 알지만 마진 기준 분류 없음.'},{score:3,desc:'판매량 기준 ABC 분석 분기 1회 실시.'},{score:4,desc:'ACM + 판매량 교차 분석으로 Dog 메뉴 분기 정기 제거.'},{score:5,desc:'4분면 분석 월 단위 자동화. Star 전면 배치 + Dog 즉시 폐기 체계.'}], ai_trigger:{threshold:2,warning:'menu_mix_unmanaged'} },
    'B_3': { label:'Portion 통제 및 폐기 관리', question:'식재료 정량 배식(Portion Control)을 주방 저울로 실행하고 있으며 일일 폐기 식재료의 원가 가치를 기록하고 감축 목표를 관리하고 있습니까?', guide:'폐기율 1% 감소 = ACM 직접 개선. 주방 저울 1개로 즉시 시작', scale:[{score:1,desc:'Portion 개념 없음. 폐기 관리 전무.'},{score:2,desc:'숙련 직원 감각에만 의존. 폐기량 미기록.'},{score:3,desc:'주요 메뉴 레시피 표준화. 폐기 발생 시 기록.'},{score:4,desc:'전 메뉴 주방 저울 Portion 통제. 일일 폐기 원가 산출.'},{score:5,desc:'폐기율 목표 설정 + ACM 연동 자동 계산 + 전처리 최적화.'}], ai_trigger:{threshold:2,warning:'portion_uncontrolled'} },
    'B_4': { label:'Prime Cost 비율 관리', question:'식재료 원가(COGS)와 직접 인건비 합계(Prime Cost)가 매출 대비 60% 이하로 제어되고 있으며 피크 타임 인력 스케줄링이 POS 데이터와 연동되고 있습니까?', guide:'외식업 Prime Cost 목표: 55~60% / 65% 초과 시 위험', scale:[{score:1,desc:'Prime Cost 개념 모름. 합산 관리 없음.'},{score:2,desc:'인건비·원재료비는 알지만 합산 비율 미관리.'},{score:3,desc:'월 단위 Prime Cost 비율 산출. 기준치 초과 시 인지.'},{score:4,desc:'POS 피크 타임 데이터로 인력 스케줄 최적화.'},{score:5,desc:'Prime Cost 실시간 대시보드. 유휴 노무비 자동 감지.'}], ai_trigger:{threshold:2,warning:'prime_cost_exceeded'} },
    'B_5': { label:'현금흐름 병목 추적 (POS 마이닝)', question:'POS 거래 타임스탬프와 배달 플랫폼 정산 데이터를 매칭하여 주문→조리→배차→정산 각 단계의 시간 누수와 정산 오차를 추적하고 있습니까?', guide:'배달앱 정산 주기 D+3~7 → 현금 유동성 공백 선제 파악 필수', scale:[{score:1,desc:'통장 입금액만 확인. 단계별 추적 없음.'},{score:2,desc:'POS 일 마감과 통장 입금을 월 단위 비교.'},{score:3,desc:'배달앱 정산 주기 파악. 자금 공백 월 단위 예측.'},{score:4,desc:'POS + 배달앱 수동 매칭으로 주간 병목 파악.'},{score:5,desc:'POS·배달앱·통장 실시간 연동 대시보드. 정산 오차 자동 감지.'}], ai_trigger:{threshold:2,warning:'cashflow_bottleneck'} },

    'C_1': { label:'매출 목표 공유 (Direction)', question:'일일·주간 매출 목표가 POS 모니터·화이트보드 등에 상시 게시되며 직원이 인지하고 목표 달성을 위해 능동적으로 행동하고 있습니까?', guide:'방향성 공유 = 직원 주인의식 → 점주 개입 시간 대폭 감소', scale:[{score:1,desc:'목표 없이 단순 노동. 직원이 목표 모름.'},{score:2,desc:'구두로 대략적 목표만 통지. 게시 없음.'},{score:3,desc:'POS·화이트보드에 일 목표 상시 게시.'},{score:4,desc:'목표 달성률 직원별 추적. 주간 피드백 제공.'},{score:5,desc:'실시간 대시보드 공유 + 목표 달성 시 즉각 인센티브.'}], ai_trigger:{threshold:2,warning:'direction_missing'} },
    'C_2': { label:'역할 책임 체크리스트 (Accountability)', question:'오픈·마감·위생 검수 등 시간대별 핵심 임무에 대한 담당자 지정과 체크리스트 서명 체계가 갖춰져 있어 점주 부재 시에도 오퍼레이션이 유지됩니까?', guide:'체크리스트 서명 = 법적 책임 소재 명확화 + 노무 리스크 방어', scale:[{score:1,desc:'문제 시에만 점주 질타·개입. R&R 없음.'},{score:2,desc:'업무 분장은 됐으나 체크리스트·서명 없음.'},{score:3,desc:'오픈·마감 체크리스트 존재. 담당자 서명 수기 보관.'},{score:4,desc:'체크리스트 디지털 기록. 미이행 시 점주 자동 알림.'},{score:5,desc:'책임 달성률 인센티브 연동. 365일 무결점 가동.'}], ai_trigger:{threshold:2,warning:'accountability_none'} },
    'C_3': { label:'원격 감사·디지털 통제 (Coordination)', question:'클라우드 POS·CCTV 원격 열람 등을 통해 점주가 매장에 없을 때도 매출·재고·이상 징후를 실시간으로 파악할 수 있습니까?', guide:'클라우드 시스템 = 다점포 확장의 기술적 전제 조건', scale:[{score:1,desc:'현장 이탈 시 상황 파악 불가.'},{score:2,desc:'직원 유선 보고에만 의존.'},{score:3,desc:'CCTV 원격 열람 + POS 마감 리포트 문자 수신.'},{score:4,desc:'클라우드 POS로 실시간 매출·결제 스마트폰 확인.'},{score:5,desc:'통합 대시보드로 매출·인력·재고·이상 거래 원격 완전 감사.'}], ai_trigger:{threshold:2,warning:'remote_control_none'} },
    'C_4': { label:'동영상 SOP 교육 매뉴얼 (Capability)', question:'신입 직원이 동영상 SOP·QR코드 매뉴얼만으로 주요 공정을 독립 수행할 수 있으며 점주 교육 없이도 일정 품질이 유지됩니까?', guide:'스마트폰 60초 숏폼 + QR코드 = 비용 0원, 7일 내 구축 가능', scale:[{score:1,desc:'점주 한 달 이상 상주 교육. 매뉴얼 전무.'},{score:2,desc:'고참 직원 눈대중 전수. 문서화 없음.'},{score:3,desc:'텍스트 매뉴얼 존재. 핵심 공정 기록.'},{score:4,desc:'동영상 SOP + QR코드 현장 부착. 자기 학습 가능.'},{score:5,desc:'LMS 연동 + 이수율 자동 추적 + 숙련도 평가 체계.'}], ai_trigger:{threshold:2,warning:'sop_none'} },
    'C_5': { label:'성과 인센티브 동기 부여 (Motivation)', question:'리뷰 언급·매출 달성 등 객관적 성과 지표와 연계된 인센티브 제도가 정식 운영되어 직원이 주인의식을 가지고 오퍼레이션에 참여하고 있습니까?', guide:'성과 계약 + 보상 체계 = 직원 도덕적 해이 원천 방지', scale:[{score:1,desc:'성과 무관하게 최저 시급만 지급.'},{score:2,desc:'점주 재량으로 가끔 성의 표시. 기준 없음.'},{score:3,desc:'월 매출 목표 달성 시 소정 보상. 기준 구두 합의.'},{score:4,desc:'리뷰 보상 + 매출 보상 체계 정식 문서화 운영.'},{score:5,desc:'성과 KPI 대시보드 공유 + 인센티브 자동 산출.'}], ai_trigger:{threshold:2,warning:'motivation_weak'} },
  };

  const ACTION_PLAN_7DAY = [
    { day:1, title:'로컬 플레이스 정보 동기화 + 키워드 최적화', desc:'네이버 스마트플레이스·카카오맵 NAP 일치 확인. 상호명에 거점 지명 + 업종 키워드 통합.', tool:'스마트플레이스 관리자 / 카카오맵 사업자 센터', output:'로컬 유저 검색 랭킹 노출 1단계 진입', trigger_domains:['A'] },
    { day:2, title:'시그니처 메뉴 고화질 사진 5~7장 교체', desc:'스마트폰 최대 밝기·자연광 활용 촬영. 플레이스 소식 탭 주간 혜택 쿠폰 등록.', tool:'스마트폰 카메라 / Canva AI', output:'플레이스 CTR 상승 + "요즘뜨는" 점수 확보', trigger_domains:['A'] },
    { day:3, title:'Dog 메뉴 한시 중단 + Star 메뉴 Portion 저울 통제', desc:'ACM 기준 하위 Dog 메뉴 1~2종 판매 중지. Star 메뉴 정량 가이드 주방 저울 앞 부착.', tool:'주방 전용 정밀 저울', output:'주간 식재료 폐기 감축 + 즉각 마진율 개선', trigger_domains:['B'] },
    { day:4, title:'전 직원 근로계약서 전수 감사 + 노무 리스크 제거', desc:'일용직 포함 전 직원 계약서 체결 누락 감사. 전자 서명 플랫폼으로 당일 교부.', tool:'알밤 / 싸인나우 등 전자 계약 플랫폼', output:'노무 리스크 및 근로감독 벌금 처분율 영점화', trigger_domains:['C'] },
    { day:5, title:'AI 카피라이팅으로 주말 마케팅 예약 발행', desc:'ChatGPT에 매장 정보·타겟 페르소나 입력 → 피드 문구 5종 생성 → 인스타그램 예약 발행.', tool:'ChatGPT / Meta Business Suite', output:'주말 예약 방문 유입률 즉각 개선', trigger_domains:['A','B'] },
    { day:6, title:'핵심 역할 위임 + 마감 체크리스트 디지털 정립', desc:'홀·주방 책임 직원 지정. POS 마감 정산 로그 자동 전송 + 체크리스트 제출 규범 수립.', tool:'마감 체크리스트 1장 / 카카오워크', output:'점주 매장 상주 시간 감소 + 시스템 독립 가동 개시', trigger_domains:['C'] },
    { day:7, title:'마이크로 ESG 실천 + 지자체 상생 프로그램 신청', desc:'식재료 일 단위 전처리·폐기 기록. 안심식당 등 지자체 위생 가맹 신청 접수.', tool:'구청 위생과 신청 양식', output:'로컬 신뢰 평판 획득 + 장기 고객 신뢰 구축', trigger_domains:['B','C'] },
  ];

  function calcScores(scores) {
    const domainScores = {};
    DOMAINS.forEach(domain => {
      const keys = Object.keys(ITEMS).filter(k => k.startsWith(`${domain.id}_`));
      const vals = keys.map(k => scores[`diag-micro-container_${k}`]).filter(v => v !== undefined && v !== null && v !== '');
      const avg = vals.length > 0 ? vals.reduce((a,b) => a + Number(b), 0) / vals.length : 0;
      domainScores[domain.key] = { label:domain.label, avg:Math.round(avg*10)/10, pct:Math.round((avg/5)*100), weight:domain.weight };
    });
    const totalPct = DOMAINS.reduce((sum,d) => sum + (domainScores[d.key].pct * d.weight), 0);
    return { domains:domainScores, total:Math.round(totalPct) };
  }

  function detectCrossWarnings(scores) {
    const warnings = [];
    const get = key => Number(scores[`diag-micro-container_${key}`] || 0);
    if (get('A_1') <= 2 && get('A_4') <= 2) warnings.push({ level:'HIGH', code:'digital_invisible', msg:'온라인 검색에서 이 가게는 존재하지 않는 상태입니다. 지금 이 순간도 경쟁자가 손님을 가져가고 있습니다.' });
    if (get('B_2') <= 2 && get('B_4') <= 2) warnings.push({ level:'CRITICAL', code:'sell_more_lose_more', msg:'수익 없는 메뉴를 팔면서 인건비까지 초과하고 있습니다. 매출이 늘수록 손실이 커지는 구조입니다.' });
    if (get('C_4') <= 2 && get('C_5') <= 2) warnings.push({ level:'HIGH', code:'staff_dependency_collapse', msg:'핵심 직원이 이탈하면 즉시 운영 불가 상태입니다. 시스템화와 동기 부여 체계가 시급합니다.' });
    if (get('A_3') <= 2 && get('A_5') <= 2 && get('A_1') >= 3) warnings.push({ level:'HIGH', code:'reputation_backfire', msg:'검색 노출은 되는데 리뷰 관리가 안 되면 노출될수록 나쁜 이미지가 퍼집니다. 마케팅을 잠시 중단하고 내부 품질부터 개선해야 합니다.' });
    if (get('B_5') <= 2 && get('B_4') <= 2) warnings.push({ level:'CRITICAL', code:'profitable_bankruptcy', msg:'매출이 발생해도 현금이 없는 흑자 도산 위험 구간입니다. 배달앱 정산 주기와 현금 공백을 즉시 파악해야 합니다.' });
    return warnings;
  }

  function buildPromptSummary(scores) {
    const result = calcScores(scores);
    const warnings = detectCrossWarnings(scores);
    const domainLines = DOMAINS.map(d => { const ds = result.domains[d.key]; const level = ds.pct >= 80 ? '우수' : ds.pct >= 60 ? '보통' : ds.pct >= 40 ? '취약' : '위험'; return `  - ${ds.label}: ${ds.pct}점 (${level})`; }).join('\n');
    const warnLines = warnings.length > 0 ? warnings.map(w => `  ⚠ [${w.level}] ${w.msg}`).join('\n') : '  - 복합 경고 없음';
    const criticalItems = [];
    Object.entries(ITEMS).forEach(([key,item]) => { const val = Number(scores[`diag-micro-container_${key}`] || 0); if (val <= 2) criticalItems.push(`${item.label}(${val}점)`); });
    const weakDomains = DOMAINS.filter(d => result.domains[d.key].pct < 60).map(d => d.id);
    const recommendedActions = ACTION_PLAN_7DAY.filter(a => a.trigger_domains.some(td => weakDomains.includes(td))).map(a => `  Day${a.day}: ${a.title}`).join('\n');
    return `[소상공인 전용 진단 결과 — diagnosis-micro.js v1.0]\n종합 점수: ${result.total}점 / 100점\n\n[영역별 점수]\n${domainLines}\n\n[복합 경고 신호]\n${warnLines}\n\n[즉각 처방 필요 항목 (2점 이하)]\n${criticalItems.length > 0 ? criticalItems.map(i => `  - ${i}`).join('\n') : '  - 없음'}\n\n[권장 7일 즉시 액션]\n${recommendedActions || '  - 전 영역 양호. 고도화 단계 진입 권장.'}`.trim();
  }

  function getSchema() { return { id:'micro', label:'소상공인 전용 진단', version:'1.0', bizScale:'micro', domains:DOMAINS, items:ITEMS, actionPlan:ACTION_PLAN_7DAY }; }

  return { getSchema, calcScores, detectCrossWarnings, buildPromptSummary, ACTION_PLAN_7DAY, DOMAINS, ITEMS };
})();

if (typeof window !== 'undefined') window.DiagMicro = DiagMicro;
