const DiagSme = (() => {
  const DOMAINS = [
    { id:'D', key:'process_cost', label:'프로세스 마이닝 & 원가 통제', icon:'🔬', desc:'오퍼레이션 로그 데이터 기반 병목 탐지와 ACM 원가 통제력을 진단합니다.', weight:0.28 },
    { id:'E', key:'backoffice_dx', label:'백오피스 자동화 & DX', icon:'⚡', desc:'로우코드·AI API 파이프라인 내재화 수준과 시스템 연동률을 진단합니다.', weight:0.25 },
    { id:'F', key:'org_talent', label:'조직 R&R & 인재 자산화', icon:'👥', desc:'역할 명료화·숙련도 자산화·핵심 인력 이탈 리스크를 진단합니다.', weight:0.22 },
    { id:'G', key:'scaleup_radar', label:'Scale-up 6대 축 자가진단', icon:'🎯', desc:'BCG DAI 기반 소기업 스케일업 6대 핵심 축의 현재 위치를 진단합니다.', weight:0.25 },
  ];
  const ITEMS = {
    'D_1': { label:'오퍼레이션 로그 데이터 추적', question:'주문-출고-정산 전 과정의 디지털 로그에서 Case ID·Timestamp·Activity가 완벽히 추적되며 병목 지점을 정기적으로 파악하고 있습니까?', guide:'프로세스 마이닝 3요소: Case ID + Timestamp + Activity → 비효율 구간 가시화', scale:[{score:1,desc:'원천 시스템 로그 수집 없음. 전적으로 수기 서면 정산.'},{score:2,desc:'ERP 로그는 누적되나 병목 파악·시각화 이력 없음.'},{score:3,desc:'분기 1회 엑셀 수동 분석으로 리드타임·지연 구간 추론.'},{score:4,desc:'전문 마이닝 도구 연동으로 Conformance Gap 식별.'},{score:5,desc:'실시간 디지털 트윈 구현. 이탈·오류 행위 상시 사전 예측 제어.'}], ai_trigger:{threshold:2,warning:'process_mining_missing'} },
    'D_2': { label:'고도화 ACM 원가 관리', question:'원자재 인플레이션(Minf)·노동 변동성(Lvol)·물류 변동성(Slog) 가중 변수를 반영한 고도화 ACM 산식으로 제품·서비스별 실질 마진을 시뮬레이션하고 있습니까?', guide:'ACM = P - [DM(1+Minf)w1 + DL(1+Lvol)w2 + IP + SC(1+Slog)w3]', scale:[{score:1,desc:'원가 산출이 감에 의존. ACM 개념 없음.'},{score:2,desc:'단순 매출 - 원재료비로만 마진 계산.'},{score:3,desc:'제품별 원가율 월 단위 산출. 외부 변수 미반영.'},{score:4,desc:'ACM 엑셀 시뮬레이터 보유. 인플레이션·노동 변수 분기 업데이트.'},{score:5,desc:'실시간 ACM 대시보드. 외부 변수 급변 시 즉각 가격·공급처 조정.'}], ai_trigger:{threshold:2,warning:'acm_not_applied'} },
    'D_3': { label:'비인가 구매·Rework Loop 통제', question:'사전 승인 없는 구매(Maverick Buying)·불량 재작업(Rework Loop)·주문 승인 지연 구간이 데이터로 식별되며 비용 손실액을 정량화하고 있습니까?', guide:'Rework 1회 = 직접 인건비 + 물류비 + 기회비용 → COPQ로 정량화 필수', scale:[{score:1,desc:'비인가 구매·Rework 발생 인지 못함. 추적 체계 없음.'},{score:2,desc:'발생 사실은 알지만 비용 손실액 미정량화.'},{score:3,desc:'분기 단위로 Rework 건수와 비용 집계 보고.'},{score:4,desc:'프로세스 마이닝으로 Rework Loop 구간 자동 시각화. 책임자 경보.'},{score:5,desc:'Rework 발생 즉각 공정 중단 → 원인 분석 → 24시간 내 재발 방지 조치.'}], ai_trigger:{threshold:2,warning:'rework_uncontrolled'} },
    'D_4': { label:'업종별 Prime Cost 임계선 관리', question:'자사 업종의 Prime Cost 표준 제어 범위와 위험 임계선을 인지하고 있으며 월 단위로 임계선 초과 여부를 모니터링하고 초과 시 즉각 조치를 실행하고 있습니까?', guide:'업종별 위험선: 제조 85% / 유통 90% / IT 40% / F&B 65% 초과 시 긴급 조치', scale:[{score:1,desc:'Prime Cost 개념 모름. 업종별 기준치 인지 없음.'},{score:2,desc:'기준치는 알지만 실제 비율 미산출. 관리 체계 없음.'},{score:3,desc:'월 단위 Prime Cost 비율 산출. 임계선 초과 시 인지.'},{score:4,desc:'임계선 초과 즉시 자동 경보. 원인 공정 단위 분석 가능.'},{score:5,desc:'실시간 Prime Cost 대시보드. 항목별 드릴다운 + 자동 조치 처방.'}], ai_trigger:{threshold:2,warning:'prime_cost_threshold_unknown'} },
    'E_1': { label:'ERP·CRM·인사 시스템 자동화 파이프라인', question:'ERP·CRM·인사 시스템의 핵심 이벤트 발생 시 n8n 또는 Make.com과 생성형 AI API를 결합하여 데이터를 자동 정제·공유하는 파이프라인이 내재화되어 있습니까?', guide:'API Webhook 연동 → 수동 데이터 이관 시간 제거 → 인적 오류 원천 봉쇄', scale:[{score:1,desc:'완전 수동 타이핑. 메신저 일방 정보 전달에만 의존.'},{score:2,desc:'엑셀 수동 매크로 수준. 시스템 간 자동 연동 전무.'},{score:3,desc:'이메일·고객 문의 시 슬랙 알림 등 단순 알림 자동화.'},{score:4,desc:'n8n으로 ERP-CRM 간 데이터 자동 동기화. 로우코드 제어 가동.'},{score:5,desc:'AI 에이전트로 문서 요약·전사 보고서 생성 완전 자동화. 업무 30% AI 처리.'}], ai_trigger:{threshold:2,warning:'pipeline_missing'} },
    'E_2': { label:'다채널 SEO & PLACE 프레임워크 적용', question:'NAP 다채널 정합성 확보, LocalBusiness Schema 마크업, 다점포·다채널 전용 랜딩페이지가 구축되어 실시간 가시성을 관리하고 있습니까?', guide:'PLACE: Profiling→Localization→Algorithm→Content→Engagement 5단계 최적화', scale:[{score:1,desc:'로컬 플랫폼 등록 없거나 NAP 불일치율 50% 이상.'},{score:2,desc:'등록은 완료했으나 채널별 NAP 불일치. 수동 관리.'},{score:3,desc:'주요 포털 NAP 일치 유지. 기본 지역 키워드 타겟팅.'},{score:4,desc:'다채널 전용 랜딩페이지 구축. Schema 마크업 적용 완료.'},{score:5,desc:'API 기반 실시간 다채널 동기화 + 자동 크롤링 감시 체계 가동.'}], ai_trigger:{threshold:2,warning:'seo_place_weak'} },
    'E_3': { label:'AI 리터러시 조직 내재화', question:'전 직원이 자사 업무 도메인에 최적화된 맞춤형 AI 프롬프트 가이드를 보유하고 있으며 일상 업무의 30% 이상을 AI 도구와 협업하여 처리하고 있습니까?', guide:'직무별 커스텀 프롬프트 템플릿 → Notion AI 등 실무 임베딩이 핵심', scale:[{score:1,desc:'임직원 AI 사용 지식 전무. 도입 거부감 강함.'},{score:2,desc:'범용 챗봇을 개인 검색 보조로만 간헐적 활용.'},{score:3,desc:'분기 1회 이상 전사 AI 교육. 기초 가이드 보유.'},{score:4,desc:'직무별 커스텀 프롬프트 템플릿이 실무에 임베딩됨.'},{score:5,desc:'전사 업무 30% 이상 AI 협업. 프롬프트 자산 지속 확보 체계 가동.'}], ai_trigger:{threshold:2,warning:'ai_not_internalized'} },
    'E_4': { label:'데이터 통합 및 의사결정 가시성', question:'매출·재고·인사·재무 데이터가 단일 대시보드에 통합되어 경영진이 데이터 기반 의사결정을 실시간으로 내릴 수 있는 디지털 가시성을 확보하고 있습니까?', guide:'BCG DAI: 데이터 통합 가시성이 디지털 성숙 기업과의 격차를 결정함', scale:[{score:1,desc:'각 부서 데이터가 사일로. 통합 보고 불가. 경영 판단이 감에 의존.'},{score:2,desc:'엑셀로 수동 취합. 월 1회 보고서 생성에 수일 소요.'},{score:3,desc:'주요 지표를 주간 단위로 취합하여 경영진 보고.'},{score:4,desc:'핵심 KPI 대시보드 구축. 일 단위 자동 리포트 발송.'},{score:5,desc:'실시간 통합 대시보드. 이상 지표 자동 경보 + AI 원인 분석 제안.'}], ai_trigger:{threshold:2,warning:'data_silo'} },
    'F_1': { label:'전결 규정 및 R&R 디지털 통제', question:'직급별 의사결정 권한(전결 규정)이 명문화되어 있으며 대표자가 모든 결정에 관여하지 않고 조직이 자율 가동되는 위임 구조가 작동하고 있습니까?', guide:'전결 규정 디지털화 = 의사결정 속도 향상 + 대표 의존 구조 탈피', scale:[{score:1,desc:'모든 의사결정이 대표자에게 집중. 전결 규정 없음.'},{score:2,desc:'구두로 권한 위임하나 기준이 없어 매번 재확인 필요.'},{score:3,desc:'팀장급 전결 기준이 문서화됨. 실제 활용은 제한적.'},{score:4,desc:'직급별 전결 규정 디지털화. 승인 워크플로우 시스템 가동.'},{score:5,desc:'대표자 부재 시에도 조직이 72시간 이상 자율 완전 가동 가능한 구조.'}], ai_trigger:{threshold:2,warning:'delegation_not_working'} },
    'F_2': { label:'숙련도 매트릭스 및 Skill Map', question:'현장 인력별 Skill Map이 구축되어 있으며 대표자 유고 시 공장·사무 가동을 유지할 수 있는 기간을 정량적으로 파악하고 있습니까?', guide:'Skill Map 부재 → 핵심 인력 이탈 = 사업 중단 직결 (Key-man Risk)', scale:[{score:1,desc:'Skill Map 개념 없음. 인력 역량 파악 전혀 안 됨.'},{score:2,desc:'경험적으로 누가 무엇을 잘하는지 알지만 문서화 없음.'},{score:3,desc:'주요 직무별 담당자와 백업 인원이 지정되어 있음.'},{score:4,desc:'전 직원 Skill Map 구축. 부재 시 대체 가능 기간(일 단위) 파악.'},{score:5,desc:'Skill Map 기반 Cross-training 계획 가동. 대표 유고 30일 이상 자율 가동 가능.'}], ai_trigger:{threshold:2,warning:'skill_map_missing'} },
    'F_3': { label:'암묵지 디지털 레시피화', question:'숙련공·핵심 인력의 노하우(암묵지)가 압력·온도·속도 등 수치 데이터로 기록되어 디지털 레시피화 되어 있으며 신규 인력이 재현 가능합니까?', guide:'암묵지 DX화 없이 설비 효율 개선은 의미 없음 — 기술 전수 데이터화가 우선', scale:[{score:1,desc:'모든 노하우가 숙련공 머릿속에만 존재. 기록 없음.'},{score:2,desc:'텍스트 매뉴얼이 일부 있으나 실제 수치 데이터 없음.'},{score:3,desc:'주요 공정의 표준값(온도·압력 등)이 텍스트로 기록됨.'},{score:4,desc:'동영상 SOP + 수치 데이터 결합. 신규 인력 재현 성공률 80% 이상.'},{score:5,desc:'IoT 센서 + AI 분석으로 암묵지가 실시간 자동 데이터화. 노하우 유출 0 달성.'}], ai_trigger:{threshold:2,warning:'tacit_knowledge_lost'} },
    'F_4': { label:'핵심 인력 이탈 방지 체계', question:'핵심 인력의 평균 근속연수·이탈 리스크를 데이터로 관리하고 있으며 이탈 시 고객·매출 유실을 방지하는 인수인계 프로토콜·백업 인재 풀이 가동되고 있습니까?', guide:'핵심 인력 1인 이탈 복구 비용 = 연봉의 1.5~3배 (채용+교육+생산성 손실)', scale:[{score:1,desc:'이탈 리스크 관리 없음. 이탈 발생 후 수습.'},{score:2,desc:'주요 인력 이탈 우려는 알지만 대응 체계 없음.'},{score:3,desc:'핵심 인력 인수인계 프로토콜 문서화. 기본 백업 지정.'},{score:4,desc:'근속연수·이탈 징후 데이터 관리. 성과 보상으로 이탈 선제 방지.'},{score:5,desc:'핵심 인력 이탈 0건 유지 체계. 외부 인재 풀 + 내부 승진 로드맵 병행 가동.'}], ai_trigger:{threshold:2,warning:'key_person_risk'} },
    'G_1': { label:'로컬 SEO 가시성 지수 (S_SEO)', question:'다채널 로컬 인게이지먼트와 검색엔진 랭킹 인프라 수준을 종합할 때 현재 자사의 디지털 가시성 수준은 어느 단계에 해당합니까?', guide:'S_SEO = [(DX-1/5 x 0.5) + (DX-3/5 x 0.5)] x 100', scale:[{score:1,desc:'온라인 검색 시 자사가 전혀 노출되지 않음. 디지털 투명인간 상태.'},{score:2,desc:'주요 플랫폼 기본 등록 수준. 검색 상위 노출 경험 없음.'},{score:3,desc:'지역 키워드 검색 시 중간 순위 노출. 리뷰 평균 3점대.'},{score:4,desc:'타겟 키워드 상위 3위 이내. 리뷰 평균 4.0 이상. 월 오가닉 리뷰 40건 이상.'},{score:5,desc:'검색 1위 고정. AI Overview 대응 구조화 콘텐츠. 실시간 경쟁 감시 가동.'}], ai_trigger:{threshold:2,warning:'seo_visibility_critical'} },
    'G_2': { label:'AI 오퍼레이션 지수 (S_AI)', question:'로우코드 업무 파이프라인 이식률과 조직원의 일상적 AI 리터러시 수준을 종합할 때 현재 AI 오퍼레이션 성숙도는 어느 단계입니까?', guide:'S_AI = [(DX-4/5 x 0.5) + (DX-5/5 x 0.5)] x 100', scale:[{score:1,desc:'수동 업무 100%. AI·자동화 파이프라인 전무.'},{score:2,desc:'범용 AI 툴 개인 사용 수준. 업무 자동화 미적용.'},{score:3,desc:'일부 반복 업무 자동화. AI 도구 부서별 부분 도입.'},{score:4,desc:'n8n·Make.com 파이프라인 가동 + 직무별 AI 프롬프트 템플릿 운영.'},{score:5,desc:'전사 업무 30% 이상 AI 협업. 자율형 AI 에이전트 업무 처리 가동.'}], ai_trigger:{threshold:2,warning:'ai_ops_immature'} },
    'G_3': { label:'현금흐름 효율성 지수 (S_CF)', question:'재무 오퍼레이션 데이터 신뢰성과 내부 자금 투명성 및 물류 헤지율을 종합할 때 현금흐름 관리 수준은 어느 단계입니까?', guide:'S_CF = [(PC-1/5 x 0.3) + (PC-5/5 x 0.4) + (ESG-5/5 x 0.3)] x 100', scale:[{score:1,desc:'현금흐름 데이터 없음. 통장 잔액만 확인.'},{score:2,desc:'월 단위 현금 잔액 파악. 미수금·외상 관리 없음.'},{score:3,desc:'CCC 분기 산출. 미수금 회수 프로세스 기본 가동.'},{score:4,desc:'현금흐름 주간 모니터링. 물류 헤지 수단 일부 활용.'},{score:5,desc:'실시간 현금흐름 대시보드. 물류·환율 자동 헤지. 자금 조달 선제 실행.'}], ai_trigger:{threshold:2,warning:'cashflow_efficiency_low'} },
    'G_4': { label:'원가 인플레이션 내성 지수 (S_PCR)', question:'원자재·인건비·물류비 급등 시 자사의 ACM이 얼마나 빠르게 대응·복구되는지 원가 인플레이션 충격 내성 수준은 어느 단계입니까?', guide:'S_PCR = [(PC-2/5 x 0.4) + (PC-3/5 x 0.3) + (PC-4/5 x 0.3)] x 100', scale:[{score:1,desc:'원가 급등 시 아무 대책 없이 마진 손실 수용.'},{score:2,desc:'원가 급등 인지 후 수개월 후에 가격 인상 시도.'},{score:3,desc:'분기 단위 원가 점검 + 공급처 협상으로 부분 대응.'},{score:4,desc:'ACM 시뮬레이터로 충격 시뮬레이션 후 즉시 가격 조정.'},{score:5,desc:'실시간 원가 모니터링. 임계선 돌파 시 자동 대응 의사결정 체계.'}], ai_trigger:{threshold:2,warning:'cost_inflation_vulnerable'} },
    'G_5': { label:'시스템 위임성 지수 (S_SD)', question:'R&R·전결 규정·디지털 통제 정보가 일치하여 대표자가 현장을 매 순간 감시하지 않아도 조직이 오차 없이 자율 가동되는 수준은 어느 단계입니까?', guide:'S_SD = [(F-1/5 x 0.4) + (F-3/5 x 0.3) + (F-4/5 x 0.3)] x 100', scale:[{score:1,desc:'대표자가 없으면 즉시 운영 불가. 모든 결정이 대표에게 집중.'},{score:2,desc:'팀장 존재하나 권한 위임 없음. 대표 부재 48시간 이상 불가.'},{score:3,desc:'핵심 업무 위임 가능. 대표 부재 1주일 이내 자율 가동.'},{score:4,desc:'Skill Map + 전결 규정 + 디지털 통제 삼박자 가동. 1개월 자율 가동 가능.'},{score:5,desc:'대표 1년 부재에도 매출·품질 유지 가능한 완전 시스템 경영 달성.'}], ai_trigger:{threshold:2,warning:'delegation_system_weak'} },
    'G_6': { label:'마이크로 ESG 지수 (S_ESG)', question:'공급망 실사 준수 및 정책 인센티브 연동 가능 수준을 종합할 때 현재 마이크로 ESG 경영 수준은 어느 단계입니까?', guide:'S_ESG = [(ESG-1~5 평균/5)] x 100 / 동반성장지수 가점 3점 + 정책 자금 우선 선정 연동', scale:[{score:1,desc:'ESG 개념 없음. 탄소·노무·지배구조 관리 전무.'},{score:2,desc:'법정 최소 기준(근로계약 등)만 형식적 이행.'},{score:3,desc:'주요 ESG 항목 관리. 에코바디스 기초 수준 충족.'},{score:4,desc:'K-ESG 핵심 지표 달성. 동반성장지수 가점 3점 자격 확보.'},{score:5,desc:'탄소배출 인증서 + 노무 무결점 + 투명 세무 3관왕. 대기업 공급망 편입 완료.'}], ai_trigger:{threshold:2,warning:'esg_not_ready'} },
  };

  const ACTION_PLAN_7DAY = [
    { day:1, title:'ERP 이벤트 로그 추출 → 프로세스 맵 가시화', desc:'ERP·POS에서 Case ID·Timestamp·Activity 3열 추출 → 엑셀 파워쿼리로 Happy Path 분석.', tool:'Excel Power Query / Apromore Community', output:'주문-출고 리드타임 + 최대 지연 구간 식별 리포트', trigger_domains:['D'] },
    { day:2, title:'다채널 NAP 일치 + LocalBusiness Schema 마크업', desc:'주요 포털 NAP 정합성 전수 점검 + JSON-LD 스키마 코드 생성 → 웹사이트 헤더 삽입.', tool:'Google Search Console / 네이버 서치어드바이저', output:'채널별 NAP 일치 완료 + Schema 마크업 적용 확인', trigger_domains:['E'] },
    { day:3, title:'핵심 공정 QR + 동영상 SOP 부착', desc:'최다 불량 발생 공정 2곳 선정 → 스마트폰 60초 숏폼 촬영 → YouTube 일부공개 업로드 → QR 인쇄 부착.', tool:'YouTube(일부공개) / QR 코드 생성기', output:'공정별 동영상 SOP QR 현장 부착 완료', trigger_domains:['F'] },
    { day:4, title:'ACM 엑셀 시뮬레이터 구축', desc:'인플레이션 변수(Minf)·노동 변동성(Lvol)·물류비 변동성(Slog) 입력 시 ACM 자동 계산 구글 스프레드시트 제작.', tool:'Google Sheets / Excel', output:'제품·서비스별 실시간 ACM 예측 시뮬레이터', trigger_domains:['D'] },
    { day:5, title:'전자 근로계약 + 안전 일일 체크 가동', desc:'전 직원 전자 계약서 체결률 100% 감사 완료 + 안전 보건 일일 자체 모바일 점검 구글폼 배포.', tool:'알밤 / 싸인나우 / 구글폼', output:'중대재해법 대응 증빙 파일 클라우드 자동 보관', trigger_domains:['G'] },
    { day:6, title:'동반성장지수 가점 자격 검수 + 상생협력기금 신청', desc:'ESG 경영 지원 가점 3점 확보 요건 자가 체크. 동반위 중소기업 ESG 지원사업 신청서 초안 작성.', tool:'동반성장위원회 포털', output:'정책 자금 우선 선정 + 우대 금리 자격 확보', trigger_domains:['G'] },
    { day:7, title:'n8n + AI API 연동 리뷰·피드백 자동 응대 파이프라인', desc:'n8n Webhook → 로컬 지도 신규 리뷰 감지 → Claude API로 자동 응대 초안 생성 → 담당자 검수 후 발행.', tool:'n8n / Claude API', output:'리뷰 자동 응대 파이프라인 가동. 응대 시간 90% 단축.', trigger_domains:['E'] },
  ];

  function calcScores(scores) {
    const domainScores = {};
    DOMAINS.forEach(domain => {
      const keys = Object.keys(ITEMS).filter(k => k.startsWith(`${domain.id}_`));
      const vals = keys.map(k => scores[`diag-sme-container_${k}`]).filter(v => v !== undefined && v !== null && v !== '');
      const avg = vals.length > 0 ? vals.reduce((a,b) => a + Number(b), 0) / vals.length : 0;
      domainScores[domain.key] = { label:domain.label, avg:Math.round(avg*10)/10, pct:Math.round((avg/5)*100), weight:domain.weight };
    });
    const totalPct = DOMAINS.reduce((sum,d) => sum + (domainScores[d.key].pct * d.weight), 0);
    return { domains:domainScores, total:Math.round(totalPct) };
  }

  function detectCrossWarnings(scores) {
    const warnings = [];
    const get = key => Number(scores[`diag-sme-container_${key}`] || 0);
    if (get('D_1') <= 2 && get('D_2') <= 2) warnings.push({ level:'CRITICAL', code:'blackbox_mgmt', msg:'오퍼레이션이 블랙박스입니다. 어디서 돈이 새는지 알 수 없는 상태로 성장은 곧 더 큰 손실을 의미합니다.' });
    if (get('E_3') <= 2 && get('E_4') <= 2) warnings.push({ level:'HIGH', code:'digital_plateau', msg:'AI 활용도 데이터 통합도 모두 낮습니다. 경쟁사의 디지털 격차가 매월 벌어지고 있는 상태입니다.' });
    if (get('F_2') <= 2 && get('F_3') <= 2) warnings.push({ level:'CRITICAL', code:'keyman_bomb', msg:'핵심 인력 1명이 이탈하면 기업 기술력이 0에 수렴합니다. 즉각 지식 자산화가 생존 조건입니다.' });
    if (get('G_5') <= 2 && get('G_6') <= 2) warnings.push({ level:'HIGH', code:'scaleup_double_block', msg:'위임 시스템도 ESG 기준도 갖추지 못하면 대기업 공급망 진입도 추가 투자 유치도 불가능합니다.' });
    if (get('G_4') <= 2 && get('G_3') <= 2) warnings.push({ level:'CRITICAL', code:'growth_is_danger', msg:'원가와 현금흐름을 모르는 상태에서 매출이 늘면 자금 압박이 가중됩니다. 성장 전에 재무 구조 정비가 우선입니다.' });
    return warnings;
  }

  function buildPromptSummary(scores) {
    const result = calcScores(scores);
    const warnings = detectCrossWarnings(scores);
    const domainLines = DOMAINS.map(d => { const ds = result.domains[d.key]; const level = ds.pct >= 80 ? '우수' : ds.pct >= 60 ? '보통' : ds.pct >= 40 ? '취약' : '위험'; return `  - ${ds.label}: ${ds.pct}점 (${level})`; }).join('\n');
    const warnLines = warnings.length > 0 ? warnings.map(w => `  ⚠ [${w.level}] ${w.msg}`).join('\n') : '  - 복합 경고 없음';
    const criticalItems = [];
    Object.entries(ITEMS).forEach(([key,item]) => { const val = Number(scores[`diag-sme-container_${key}`] || 0); if (val <= 2) criticalItems.push(`${item.label}(${val}점)`); });
    const weakDomains = DOMAINS.filter(d => result.domains[d.key].pct < 60).map(d => d.id);
    const recommendedActions = ACTION_PLAN_7DAY.filter(a => a.trigger_domains.some(td => weakDomains.includes(td))).map(a => `  Day${a.day}: ${a.title}`).join('\n');
    const radarSummary = ['G_1','G_2','G_3','G_4','G_5','G_6'].map(key => { const item = ITEMS[key]; const val = Number(scores[`diag-sme-container_${key}`] || 0); const pct = Math.round((val/5)*100); return `  - ${item.label}: ${pct}점`; }).join('\n');
    return `[소기업 전용 진단 결과 — diagnosis-sme.js v1.0]\n종합 점수: ${result.total}점 / 100점\n\n[영역별 점수]\n${domainLines}\n\n[Scale-up 6대 축 레이더]\n${radarSummary}\n\n[복합 경고 신호]\n${warnLines}\n\n[즉각 처방 필요 항목 (2점 이하)]\n${criticalItems.length > 0 ? criticalItems.map(i => `  - ${i}`).join('\n') : '  - 없음'}\n\n[권장 7일 즉시 액션]\n${recommendedActions || '  - 전 영역 양호. Scale-up 고도화 단계 진입 권장.'}`.trim();
  }

  function getSchema() { return { id:'sme', label:'소기업 전용 진단', version:'1.0', bizScale:'sme', domains:DOMAINS, items:ITEMS, actionPlan:ACTION_PLAN_7DAY }; }

  return { getSchema, calcScores, detectCrossWarnings, buildPromptSummary, ACTION_PLAN_7DAY, DOMAINS, ITEMS };
})();

if (typeof window !== 'undefined') window.DiagSme = DiagSme;
