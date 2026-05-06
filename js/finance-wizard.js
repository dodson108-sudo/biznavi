/* ================================================================
   BizNavi AI — finance-wizard.js
   재무분석 위저드: 기업정보 입력 → 재무데이터 → 6대 비율 분석 리포트
   ================================================================ */

const FinWizard = (() => {
  let _curStep = 1;
  let _inputMode = 'dart'; // 'dart' | 'manual'
  let _dartData = null;
  let _finData = {};
  let _lastRatios = null;
  let _bokAvg = null; // 초기화 전 null → analyze() 에서 _bokAvg_DEFAULT 또는 ECOS 값으로 세팅

  /* ── 업종코드 데이터 (국세청 업종코드 ↔ 표준산업분류 세분류) ── */
  const INDUSTRY_CODES = [
    // 농림어업
    { code: 'A0100', ksic: 'A011', name: '식량작물 재배업' },
    { code: 'A0110', ksic: 'A012', name: '채소·화훼작물 재배업' },
    { code: 'A0120', ksic: 'A013', name: '과실·음료용 작물 재배업' },
    { code: 'A0200', ksic: 'A021', name: '육우 사육업' },
    { code: 'A0210', ksic: 'A022', name: '양돈업' },
    { code: 'A0220', ksic: 'A023', name: '가금류 사육업' },
    { code: 'A0300', ksic: 'A031', name: '연근해 어업' },
    { code: 'A0310', ksic: 'A032', name: '내수면 어업' },
    // 음식료품 제조
    { code: 'C1010', ksic: 'C101', name: '도축·육류 가공업' },
    { code: 'C1020', ksic: 'C102', name: '수산물 가공·저장처리업' },
    { code: 'C1030', ksic: 'C103', name: '과실·채소 가공·저장처리업' },
    { code: 'C1040', ksic: 'C104', name: '동물성·식물성 유지 제조업' },
    { code: 'C1050', ksic: 'C105', name: '낙농제품 및 식용 빙과류 제조업' },
    { code: 'C1061', ksic: 'C106', name: '곡물 가공품 제조업(밀가루 등)' },
    { code: 'C1071', ksic: 'C107', name: '빵류·과자류 제조업' },
    { code: 'C1080', ksic: 'C108', name: '조미료·식품 첨가물 제조업' },
    { code: 'C1090', ksic: 'C109', name: '기타 식료품 제조업' },
    { code: 'C1101', ksic: 'C110', name: '소주·위스키 등 주류 제조업' },
    { code: 'C1102', ksic: 'C110', name: '맥주 제조업' },
    { code: 'C1120', ksic: 'C112', name: '비알코올 음료·얼음 제조업' },
    // 섬유·의복
    { code: 'C1310', ksic: 'C131', name: '방적업(면·모·화섬 등)' },
    { code: 'C1320', ksic: 'C132', name: '직물 제조업' },
    { code: 'C1411', ksic: 'C141', name: '봉제의복 제조업' },
    { code: 'C1420', ksic: 'C142', name: '모피제품 제조업' },
    { code: 'C1510', ksic: 'C151', name: '가죽·가방·지갑 제조업' },
    { code: 'C1520', ksic: 'C152', name: '신발 제조업' },
    // 목재·종이
    { code: 'C1610', ksic: 'C161', name: '제재·목재 가공업' },
    { code: 'C1620', ksic: 'C162', name: '합판·강화목재 제조업' },
    { code: 'C1630', ksic: 'C163', name: '목재 가구 제조업' },
    { code: 'C1710', ksic: 'C171', name: '펄프·종이 제조업' },
    { code: 'C1720', ksic: 'C172', name: '골판지·종이 용기 제조업' },
    { code: 'C1811', ksic: 'C181', name: '인쇄업' },
    // 석유·화학
    { code: 'C1910', ksic: 'C191', name: '석유 정제품 제조업' },
    { code: 'C2011', ksic: 'C201', name: '기초 화학물질 제조업' },
    { code: 'C2020', ksic: 'C202', name: '비료·농약 제조업' },
    { code: 'C2030', ksic: 'C203', name: '합성수지·플라스틱 제조업' },
    { code: 'C2040', ksic: 'C204', name: '의약품 원료·완제 제조업' },
    { code: 'C2051', ksic: 'C205', name: '화장품·샴푸 제조업' },
    { code: 'C2060', ksic: 'C206', name: '세제·광택제 제조업' },
    { code: 'C2090', ksic: 'C209', name: '기타 화학제품 제조업' },
    { code: 'C2100', ksic: 'C210', name: '의약품 제조업' },
    { code: 'C2211', ksic: 'C221', name: '타이어·튜브 제조업' },
    { code: 'C2219', ksic: 'C221', name: '고무제품 제조업' },
    { code: 'C2220', ksic: 'C222', name: '플라스틱 제품 제조업' },
    // 비금속·금속
    { code: 'C2310', ksic: 'C231', name: '유리·유리제품 제조업' },
    { code: 'C2320', ksic: 'C232', name: '내화요업 제품 제조업' },
    { code: 'C2330', ksic: 'C233', name: '도자기·요업제품 제조업' },
    { code: 'C2341', ksic: 'C234', name: '시멘트·석회·석고 제조업' },
    { code: 'C2390', ksic: 'C239', name: '기타 비금속광물 제조업' },
    { code: 'C2411', ksic: 'C241', name: '1차 철강 제조업' },
    { code: 'C2420', ksic: 'C242', name: '1차 비철금속 제조업' },
    { code: 'C2431', ksic: 'C243', name: '금속 주조업' },
    { code: 'C2511', ksic: 'C251', name: '구조용 금속제품 제조업' },
    { code: 'C2590', ksic: 'C259', name: '기타 금속 가공품 제조업' },
    // 기계·전기·전자
    { code: 'C2610', ksic: 'C261', name: '반도체 제조업' },
    { code: 'C2620', ksic: 'C262', name: '전자부품 제조업(PCB·LCD 등)' },
    { code: 'C2630', ksic: 'C263', name: '컴퓨터·주변기기 제조업' },
    { code: 'C2640', ksic: 'C264', name: '통신장비 제조업' },
    { code: 'C2651', ksic: 'C265', name: '계측기·센서 제조업' },
    { code: 'C2710', ksic: 'C271', name: '전동기·발전기 제조업' },
    { code: 'C2720', ksic: 'C272', name: '전지·축전지 제조업' },
    { code: 'C2730', ksic: 'C273', name: '절연선·케이블 제조업' },
    { code: 'C2740', ksic: 'C274', name: '조명장치 제조업(LED 등)' },
    { code: 'C2790', ksic: 'C279', name: '기타 전기장비 제조업' },
    { code: 'C2811', ksic: 'C281', name: '일반 목적 기계 제조업' },
    { code: 'C2812', ksic: 'C281', name: '반도체·LCD 제조용 기계 제조업' },
    { code: 'C2820', ksic: 'C282', name: '특수 목적 기계 제조업' },
    { code: 'C2830', ksic: 'C283', name: '산업용 냉동공조기계 제조업' },
    { code: 'C2910', ksic: 'C291', name: '자동차 제조업' },
    { code: 'C2920', ksic: 'C292', name: '자동차 차체·트레일러 제조업' },
    { code: 'C2930', ksic: 'C293', name: '자동차 부품 제조업' },
    { code: 'C3010', ksic: 'C301', name: '선박 건조업' },
    { code: 'C3020', ksic: 'C302', name: '철도차량 제조업' },
    { code: 'C3030', ksic: 'C303', name: '항공기 제조업' },
    { code: 'C3110', ksic: 'C311', name: '가구 제조업' },
    { code: 'C3190', ksic: 'C319', name: '기타 제품 제조업' },
    // 건설
    { code: 'F4111', ksic: 'F411', name: '건물 건설업(아파트·주택 등)' },
    { code: 'F4112', ksic: 'F411', name: '비주거용 건물 건설업' },
    { code: 'F4120', ksic: 'F412', name: '토목 건설업' },
    { code: 'F4211', ksic: 'F421', name: '전기 공사업' },
    { code: 'F4212', ksic: 'F421', name: '정보통신 공사업' },
    { code: 'F4220', ksic: 'F422', name: '기계 설비 공사업' },
    { code: 'F4230', ksic: 'F423', name: '실내 인테리어 공사업' },
    { code: 'F4290', ksic: 'F429', name: '기타 전문 공사업' },
    // 도소매
    { code: 'G4511', ksic: 'G451', name: '자동차 판매업' },
    { code: 'G4610', ksic: 'G461', name: '농축산물 도매업' },
    { code: 'G4620', ksic: 'G462', name: '식품·음료 도매업' },
    { code: 'G4630', ksic: 'G463', name: '섬유·의류·신발 도매업' },
    { code: 'G4641', ksic: 'G464', name: '전기·전자 도매업' },
    { code: 'G4649', ksic: 'G464', name: '기계·부품 도매업' },
    { code: 'G4690', ksic: 'G469', name: '기타 전문 도매업' },
    { code: 'G4710', ksic: 'G471', name: '종합소매업(대형마트 등)' },
    { code: 'G4721', ksic: 'G472', name: '식품·음료 소매업(편의점 등)' },
    { code: 'G4730', ksic: 'G473', name: '연료 소매업(주유소 등)' },
    { code: 'G4741', ksic: 'G474', name: '의약품·의료기기 소매업' },
    { code: 'G4751', ksic: 'G475', name: '섬유·의복·신발 소매업' },
    { code: 'G4761', ksic: 'G476', name: '가전·전자 소매업' },
    { code: 'G4771', ksic: 'G477', name: '스포츠·취미용품 소매업' },
    { code: 'G4791', ksic: 'G479', name: '통신판매업(온라인쇼핑 등)' },
    // 음식·숙박
    { code: 'I5611', ksic: 'I561', name: '한식 음식점업' },
    { code: 'I5612', ksic: 'I561', name: '외국식 음식점업(중식·일식·양식)' },
    { code: 'I5613', ksic: 'I561', name: '기관구내식당업' },
    { code: 'I5619', ksic: 'I561', name: '기타 음식점업(분식·포장마차 등)' },
    { code: 'I5621', ksic: 'I562', name: '제과점업(베이커리 등)' },
    { code: 'I5629', ksic: 'I562', name: '피자·치킨·햄버거 등 음식점' },
    { code: 'I5630', ksic: 'I563', name: '주점업(호프·bar 등)' },
    { code: 'I5640', ksic: 'I564', name: '비알코올 음료점업(카페 등)' },
    { code: 'I5510', ksic: 'I551', name: '호텔업' },
    { code: 'I5590', ksic: 'I559', name: '기타 숙박업(모텔·게스트하우스 등)' },
    // 운수
    { code: 'H4911', ksic: 'H491', name: '철도 운송업' },
    { code: 'H4921', ksic: 'H492', name: '시내버스 운송업' },
    { code: 'H4922', ksic: 'H492', name: '택시 운송업' },
    { code: 'H4930', ksic: 'H493', name: '화물 운송업(트럭)' },
    { code: 'H5010', ksic: 'H501', name: '해상 운송업' },
    { code: 'H5110', ksic: 'H511', name: '항공 운송업' },
    { code: 'H5210', ksic: 'H521', name: '창고·물류시설 운영업' },
    { code: 'H5220', ksic: 'H522', name: '택배·배달 서비스업' },
    // IT·통신·네트워크
    { code: 'J5811', ksic: 'J581', name: '소프트웨어 개발·공급업' },
    { code: 'J5820', ksic: 'J582', name: '게임 소프트웨어 개발·공급업' },
    { code: 'J6010', ksic: 'J601', name: '유선 통신업' },
    { code: 'J6020', ksic: 'J602', name: '무선 통신업(이동통신)' },
    { code: 'J6110', ksic: 'J611', name: '유선 방송업' },
    { code: 'J6120', ksic: 'J612', name: '위성방송업·인터넷방송' },
    { code: 'J6201', ksic: 'J620', name: '컴퓨터 프로그래밍·시스템 통합' },
    { code: 'J6202', ksic: 'J620', name: 'IT 컨설팅·SI 서비스업' },
    { code: 'J6203', ksic: 'J620', name: '네트워크 장비·인프라 공급·구축업' },
    { code: 'J6204', ksic: 'J620', name: 'IT 인프라·서버·스토리지 구축업' },
    { code: 'J6205', ksic: 'J620', name: '보안 시스템·솔루션 개발·공급업' },
    { code: 'J6206', ksic: 'J620', name: 'ERP·그룹웨어·업무용 SW 개발업' },
    { code: 'J6311', ksic: 'J631', name: '자료 처리·호스팅·웹서비스업' },
    { code: 'J6312', ksic: 'J631', name: '클라우드 컴퓨팅 서비스업' },
    { code: 'J6391', ksic: 'J639', name: '포털·검색엔진 운영업' },
    { code: 'J6399', ksic: 'J639', name: '기타 정보 서비스업' },
    // 복합업종·종합서비스 (제조+서비스+도소매+건설 등)
    { code: 'G9900', ksic: 'G999', name: '복합업종(제조+도소매+서비스+건설 겸업)' },
    { code: 'M9910', ksic: 'M999', name: '복합 IT 서비스업(SI+구축+유지보수 겸업)' },
    { code: 'G4641', ksic: 'G464', name: '전기·전자·IT 장비 도매업' },
    { code: 'G4649', ksic: 'G464', name: '네트워크·통신장비 도소매업' },
    { code: 'G4690', ksic: 'G469', name: '기타 IT·사무기기 전문 도매업' },
    // 금융·보험
    { code: 'K6411', ksic: 'K641', name: '중앙은행업' },
    { code: 'K6419', ksic: 'K641', name: '일반 은행업' },
    { code: 'K6491', ksic: 'K649', name: '신용협동조합업' },
    { code: 'K6499', ksic: 'K649', name: '기타 금융업(할부·리스 등)' },
    { code: 'K6611', ksic: 'K661', name: '생명보험업' },
    { code: 'K6621', ksic: 'K662', name: '손해보험업' },
    { code: 'K6630', ksic: 'K663', name: '연금기금업' },
    { code: 'K6641', ksic: 'K664', name: '증권중개업' },
    { code: 'K6649', ksic: 'K664', name: '기타 금융지원 서비스업' },
    // 부동산
    { code: 'L6811', ksic: 'L681', name: '부동산 임대업' },
    { code: 'L6812', ksic: 'L681', name: '주거용 건물 개발·공급업' },
    { code: 'L6820', ksic: 'L682', name: '부동산 중개·감정평가업' },
    // 전문서비스
    { code: 'M7010', ksic: 'M701', name: '법무·법률 서비스업' },
    { code: 'M7020', ksic: 'M702', name: '회계·세무 서비스업' },
    { code: 'M7031', ksic: 'M703', name: '광고업' },
    { code: 'M7032', ksic: 'M703', name: '시장조사·여론조사업' },
    { code: 'M7110', ksic: 'M711', name: '건축설계·엔지니어링 서비스업' },
    { code: 'M7120', ksic: 'M712', name: '기술 시험·검사·인증업' },
    { code: 'M7130', ksic: 'M713', name: 'R&D(연구개발업)' },
    { code: 'M7200', ksic: 'M720', name: '경영컨설팅·기업진단업' },
    // 교육
    { code: 'P8511', ksic: 'P851', name: '유치원' },
    { code: 'P8521', ksic: 'P852', name: '초·중·고등학교' },
    { code: 'P8531', ksic: 'P853', name: '대학·대학원' },
    { code: 'P8551', ksic: 'P855', name: '일반 교과 학원(입시·보습)' },
    { code: 'P8552', ksic: 'P855', name: '예능·체육 학원(음악·미술·태권도 등)' },
    { code: 'P8561', ksic: 'P856', name: '직업훈련기관·평생교육원' },
    // 보건·의료
    { code: 'Q8610', ksic: 'Q861', name: '병원(종합병원·전문병원)' },
    { code: 'Q8620', ksic: 'Q862', name: '의원(내과·치과·한의원 등)' },
    { code: 'Q8630', ksic: 'Q863', name: '요양병원·요양원' },
    { code: 'Q8690', ksic: 'Q869', name: '기타 의료기관(산후조리원 등)' },
    { code: 'Q8699', ksic: 'Q869', name: '의료기기·보건용품 판매업' },
    // 예술·스포츠
    { code: 'R9000', ksic: 'R900', name: '공연·예술·창작 서비스업' },
    { code: 'R9111', ksic: 'R911', name: '스포츠시설 운영업(헬스장 등)' },
    { code: 'R9112', ksic: 'R911', name: '골프장·스키장 운영업' },
    { code: 'R9120', ksic: 'R912', name: '오락·유원시설 운영업' },
    // 기타 서비스
    { code: 'S9511', ksic: 'S951', name: '컴퓨터·가전 수리업' },
    { code: 'S9601', ksic: 'S960', name: '세탁·세탁소업' },
    { code: 'S9602', ksic: 'S960', name: '미용·이용업(헤어살롱 등)' },
    { code: 'S9603', ksic: 'S960', name: '목욕탕·사우나업' },
    { code: 'S9699', ksic: 'S969', name: '기타 개인 서비스업' },
  ];

  /* ── 업종코드 검색 ── */
  function searchIndustryCode(query) {
    const q = query.trim();
    const resultEl = document.getElementById('industrySearchResult');
    if (!resultEl) return;
    if (q.length < 1) { resultEl.innerHTML = ''; resultEl.classList.add('hidden'); return; }
    const matches = INDUSTRY_CODES.filter(item =>
      item.name.includes(q) || item.code.toUpperCase().includes(q.toUpperCase()) || item.ksic.toUpperCase().includes(q.toUpperCase())
    ).slice(0, 10);
    const directInputRow = `
      <div class="industry-direct-input">
        <span>코드 직접 입력:</span>
        <input type="text" id="industryDirectCode" placeholder="예: J620" maxlength="10" style="width:90px;padding:4px 8px;border-radius:6px;border:1px solid var(--gold);background:#0f1629;color:#e8edf5;font-size:0.85rem">
        <input type="text" id="industryDirectName" placeholder="업종명" maxlength="30" style="flex:1;padding:4px 8px;border-radius:6px;border:1px solid rgba(255,255,255,0.2);background:#0f1629;color:#e8edf5;font-size:0.85rem">
        <button onclick="FinWizard.selectDirectCode()" style="padding:4px 12px;background:var(--gold);color:#0a0e1a;border:none;border-radius:6px;font-size:0.8rem;cursor:pointer;font-weight:700">선택</button>
      </div>`;
    if (!matches.length) {
      resultEl.innerHTML = '<div class="industry-no-result">검색 결과 없음 — 아래에서 직접 입력하세요</div>' + directInputRow;
      resultEl.classList.remove('hidden');
      return;
    }
    resultEl.innerHTML = matches.map(m => `
      <div class="industry-result-item" onclick="FinWizard.selectIndustryCode('${m.ksic}', '${m.name}')">
        <span class="industry-code-badge">${m.ksic}</span>
        <span class="industry-code-name">${m.name}</span>
      </div>`).join('') + directInputRow;
    resultEl.classList.remove('hidden');
  }

  function selectDirectCode() {
    const code = document.getElementById('industryDirectCode')?.value.trim().toUpperCase();
    const name = document.getElementById('industryDirectName')?.value.trim();
    if (!code) { alert('업종코드를 입력해주세요.'); return; }
    selectIndustryCode(code, name || code);
  }

  function selectIndustryCode(code, name) {
    const codeEl = document.getElementById('finIndustryCode');
    const nameEl = document.getElementById('finIndustryName');
    if (codeEl) codeEl.value = code;
    if (nameEl) nameEl.value = name;
    const searchEl = document.getElementById('industrySearchInput');
    if (searchEl) searchEl.value = `${name} (${code})`;
    const resultEl = document.getElementById('industrySearchResult');
    if (resultEl) { resultEl.innerHTML = ''; resultEl.classList.add('hidden'); }
    const selEl = document.getElementById('finIndustrySelected');
    if (selEl) { selEl.textContent = `✓ 선택됨: ${name} — ${code}`; selEl.style.display = 'block'; }
  }

  /* ── 스텝 이동 ── */
  function goStep(n) {
    if (n === 2 && !_validateStep1()) return;
    _curStep = n;
    ['finWizStep1', 'finWizStep2'].forEach((id, i) => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('hidden', i + 1 !== n);
    });
    // 스텝 인디케이터 업데이트
    [1, 2, 3].forEach(i => {
      const el = document.getElementById('finStep' + i);
      if (el) {
        el.classList.toggle('active', i === n);
        el.classList.toggle('done', i < n);
      }
    });
    window.scrollTo(0, 0);
  }

  function _validateStep1() {
    const name = document.getElementById('finCompanyName')?.value.trim();
    if (!name) { alert('회사명을 입력해주세요.'); return false; }
    // 업종코드는 선택사항 — DART 조회 시 자동세팅, 없으면 기본 업종평균 사용
    return true;
  }

  /* ── "다음 →" 버튼: 모드에 따라 분기 ── */
  async function nextStep() {
    if (!_validateStep1()) return;

    if (_inputMode === 'manual') {
      _clearStep2Fields();
      _showStep2('직접 입력 모드 — 재무데이터를 직접 입력해주세요.');
      return;
    }

    const name = document.getElementById('finCompanyName')?.value.trim();

    // ★ 이미 lookupDart()로 조회된 데이터가 있으면 재사용 (중복 API 호출 방지)
    if (_dartData && _dartData.status === 'found') {
      _showStep2(`✅ DART 자동입력 완료 — ${_dartData.corpName} (${_dartData.year}년 기준) · 수정 가능합니다`);
      _tryDartAutoFill();
      return;
    }

    // 조회 버튼을 누르지 않고 바로 다음을 누른 경우 — DART 호출
    const btn = document.getElementById('finNextBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'DART 조회 중...'; }

    try {
      const res = await fetch('/api/dart-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: name })
      });
      const data = await res.json();

      if (data.status === 'found') {
        _dartData = data;
        _showStep2(`✅ DART 자동입력 완료 — ${data.corpName} (${data.year}년 기준) · 수정 가능합니다`);
        _tryDartAutoFill();
      } else if (data.status === 'no_key') {
        _inputMode = 'manual';
        _clearStep2Fields();
        _showStep2('⚠️ DART API 키 미설정 — 아래 항목을 직접 입력해주세요.');
      } else {
        _inputMode = 'manual';
        _clearStep2Fields();
        _showStep2('ℹ️ DART 공시 데이터 없음 — 아래 항목을 직접 입력해주세요.');
      }
    } catch (e) {
      _inputMode = 'manual';
      _clearStep2Fields();
      _showStep2('⚠️ DART 조회 실패 — 아래 항목을 직접 입력해주세요.');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '다음 →'; }
    }
  }

  function _showStep2(noticeMsg) {
    _curStep = 2;
    document.getElementById('finWizStep1')?.classList.add('hidden');
    document.getElementById('finWizStep2')?.classList.remove('hidden');
    [1, 2, 3].forEach(i => {
      const el = document.getElementById('finStep' + i);
      if (el) { el.classList.toggle('active', i === 2); el.classList.toggle('done', i < 2); }
    });
    const notice = document.getElementById('finDartAutoFill');
    if (notice) { notice.classList.remove('hidden'); notice.innerHTML = `<span>${noticeMsg}</span>`; }
    _initFinInputFormat(); // 천단위 콤마 blur/focus 이벤트 등록
    window.scrollTo(0, 0);
  }

  function _clearStep2Fields() {
    ['fin_current_assets','fin_quick_assets','fin_cash','fin_receivable','fin_inventory',
     'fin_noncurrent_assets','fin_tangible_assets','fin_total_assets','fin_current_liabilities',
     'fin_payable','fin_noncurrent_liabilities','fin_borrowings','fin_total_liabilities',
     'fin_equity','fin_revenue','fin_gross_profit','fin_operating_profit',
     'fin_interest_expense','fin_net_income','fin_labor_cost','fin_employees','fin_prev_revenue'
    ].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  }

  /* ── 입력 모드 전환 ── */
  function switchInputMode(mode) {
    _inputMode = mode;
    document.getElementById('finTabDart')?.classList.toggle('active', mode === 'dart');
    document.getElementById('finTabManual')?.classList.toggle('active', mode === 'manual');
  }

  /* ── 회사명 입력 시 DART 버튼 표시 ── */
  function onCompanyInput(el) {
    const btn = document.getElementById('finDartBtn');
    if (btn) btn.style.display = el.value.trim().length >= 2 ? 'block' : 'none';
  }

  /* ── DART 조회 (Step1) ── */
  async function lookupDart() {
    const name = document.getElementById('finCompanyName')?.value.trim();
    if (!name || name.length < 2) return;
    const resultEl = document.getElementById('finDartResult');
    resultEl.classList.remove('hidden');
    resultEl.innerHTML = '<span class="dart-loading">DART 조회 중...</span>';
    try {
      const res = await fetch('/api/dart-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: name })
      });
      const data = await res.json();
      if (data.status === 'found') {
        _dartData = data;
        // 업종코드 자동 세팅
        if (data.indutyCode) {
          const codeEl = document.getElementById('finIndustryCode');
          const nameEl = document.getElementById('finIndustryName');
          const searchEl = document.getElementById('industrySearchInput');
          const selEl = document.getElementById('finIndustrySelected');
          if (codeEl) codeEl.value = data.indutyCode;
          if (nameEl) nameEl.value = data.indutyName || data.indutyCode;
          if (searchEl) searchEl.value = `${data.indutyName || data.indutyCode} (${data.indutyCode})`;
          if (selEl) { selEl.textContent = `✓ DART 자동세팅: ${data.indutyName || data.indutyCode}`; selEl.style.display = 'block'; }
        }
        const _fmt = (obj) => obj?.eok != null
          ? `${(+obj.eok).toLocaleString()}억원`
          : `<span style="color:rgba(200,212,232,0.25);font-style:italic">N/A</span>`;
        resultEl.innerHTML = `
          <div class="dart-result-summary">
            <span class="dart-corp-name">${data.corpName}</span>
            <span class="dart-year-badge">${data.year}년 기준</span>
            ${data.indutyName ? `<span class="dart-industry">${data.indutyName}</span>` : ''}
          </div>
          <div class="dart-accounts-grid">
            <div class="dart-accounts-section">
              <div class="dart-accounts-title">재무상태표</div>
              <div class="dart-account-row"><span>유동자산</span><span>${_fmt(data.currentAssets)}</span></div>
              <div class="dart-account-row"><span>현금및현금성자산</span><span>${_fmt(data.cash)}</span></div>
              <div class="dart-account-row"><span>매출채권</span><span>${_fmt(data.receivable)}</span></div>
              <div class="dart-account-row"><span>재고자산</span><span>${_fmt(data.inventory)}</span></div>
              <div class="dart-account-row"><span>비유동자산</span><span>${_fmt(data.nonCurrentAssets)}</span></div>
              <div class="dart-account-row"><span>유형자산</span><span>${_fmt(data.tangibleAssets)}</span></div>
              <div class="dart-account-row dart-account-total"><span>자산총계</span><span>${_fmt(data.totalAssets)}</span></div>
              <div class="dart-account-row"><span>유동부채</span><span>${_fmt(data.currentLiabilities)}</span></div>
              <div class="dart-account-row"><span>매입채무</span><span>${_fmt(data.payable)}</span></div>
              <div class="dart-account-row"><span>차입금</span><span>${_fmt(data.borrowings)}</span></div>
              <div class="dart-account-row"><span>비유동부채</span><span>${_fmt(data.nonCurrentLiab)}</span></div>
              <div class="dart-account-row dart-account-total"><span>부채총계</span><span>${_fmt(data.totalDebt)}</span></div>
              <div class="dart-account-row dart-account-total"><span>자본총계</span><span>${_fmt(data.equity)}</span></div>
            </div>
            <div class="dart-accounts-section">
              <div class="dart-accounts-title">손익계산서</div>
              <div class="dart-account-row dart-account-total"><span>매출액</span><span>${_fmt(data.revenue)}</span></div>
              <div class="dart-account-row"><span>매출원가</span><span>${_fmt(data.costOfSales)}</span></div>
              <div class="dart-account-row"><span>매출총이익</span><span>${_fmt(data.grossProfit)}</span></div>
              <div class="dart-account-row"><span>영업이익</span><span>${_fmt(data.operatingProfit)}</span></div>
              <div class="dart-account-row"><span>이자비용</span><span>${_fmt(data.interestExpense)}</span></div>
              <div class="dart-account-row dart-account-total"><span>당기순이익</span><span>${_fmt(data.netIncome)}</span></div>
              <div class="dart-account-row"><span>인건비</span><span>${_fmt(data.laborCost)}</span></div>
            </div>
          </div>
          <p style="color:#4ADE80;font-size:0.85rem;margin-top:10px">✅ DART 재무데이터 확인 완료 — Step 2에서 자동입력됩니다. N/A 항목은 직접 입력하세요.</p>`;
      } else if (data.status === 'no_key') {
        resultEl.innerHTML = '<span style="color:var(--txt3)">DART API 키가 미설정되어 직접 입력이 필요합니다.</span>';
      } else if (data.status === 'api_key_error') {
        resultEl.innerHTML = `<span style="color:#F87171">⚠️ DART API 키 오류 (${data.dartStatus}) — Vercel 환경변수 DART_API_KEY를 확인해주세요.</span>`;
        _dartData = null;
      } else if (data.status === 'no_financial') {
        let reason = '';
        if (data.corpCls === 'E') {
          reason = data.stockCode
            ? '상장폐지 기업 — DART 재무공시 의무 없음'
            : '비상장 기업 — DART 재무공시 의무 없음';
        } else {
          reason = '공시된 재무제표 없음';
        }
        resultEl.innerHTML = `<span style="color:var(--txt3)">⚠️ ${data.corpName || companyName.trim()} — ${reason}. 직접 입력해주세요.</span>`;
        _dartData = null;
      } else if (data.status === 'not_found') {
        resultEl.innerHTML = `<span style="color:var(--txt3)">DART 미등록 기업입니다. 직접 입력해주세요.</span>`;
        _dartData = null;
      } else {
        resultEl.innerHTML = `<span style="color:var(--txt3)">조회 실패 — 직접 입력해주세요.</span>`;
        _dartData = null;
      }
    } catch (e) {
      resultEl.innerHTML = '<span style="color:var(--txt3)">조회 중 오류. 직접 입력해주세요.</span>';
    }
  }

  /* ── localhost 테스트용 목업 DART 데이터 (전 항목) ── */
  function _mockDartData(name) {
    const m = (원) => ({ raw: String(원).replace(/\B(?=(\d{3})+(?!\d))/g, ','), eok: Math.round(원/100000000) });
    return {
      status: 'found',
      corpName: name || '테스트기업(주)',
      year: 2023,
      indutyCode: 'J620',
      indutyName: 'IT서비스·시스템통합',
      // B/S
      currentAssets:       m(35_000_000_000),
      quickAssets:         m(28_000_000_000),
      cash:                m(12_000_000_000),
      receivable:          m(15_000_000_000),
      inventory:           m( 7_000_000_000),
      nonCurrentAssets:    m(45_000_000_000),
      tangibleAssets:      m(30_000_000_000),
      totalAssets:         m(80_000_000_000),
      currentLiabilities:  m(20_000_000_000),
      payable:             m( 8_000_000_000),
      nonCurrentLiab:      m(25_000_000_000),
      borrowings:          m(18_000_000_000),
      totalDebt:           m(45_000_000_000),
      equity:              m(35_000_000_000),
      // I/S
      revenue:             m(50_000_000_000),
      grossProfit:         m(18_000_000_000),
      operatingProfit:     m( 3_500_000_000),
      interestExpense:     m(   500_000_000),
      netIncome:           m( 2_800_000_000),
      laborCost:           m( 9_000_000_000),
      debtRatio: 129
    };
  }

  /* ── 재무입력 필드 천단위 콤마 자동 포맷 ── */
  function _initFinInputFormat() {
    const ids = [
      'fin_current_assets','fin_quick_assets','fin_cash','fin_receivable','fin_inventory',
      'fin_noncurrent_assets','fin_tangible_assets','fin_total_assets',
      'fin_current_liabilities','fin_payable','fin_noncurrent_liabilities',
      'fin_borrowings','fin_total_liabilities','fin_equity',
      'fin_revenue','fin_gross_profit','fin_operating_profit',
      'fin_interest_expense','fin_net_income','fin_labor_cost','fin_prev_revenue'
    ];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('focus', () => {
        // 포커스 시 콤마 제거 → 숫자만 편집
        el.value = el.value.replace(/,/g, '');
      });
      el.addEventListener('blur', () => {
        // 포커스 해제 시 천단위 콤마 재적용
        const raw = el.value.replace(/,/g, '').trim();
        if (raw === '' || raw === '-') return;
        const n = parseFloat(raw);
        if (!isNaN(n)) el.value = _fmtComma(n);
      });
    });
  }

  /* ── Step2 진입 시 DART 데이터 자동입력 ── */
  function _tryDartAutoFill() {
    if (!_dartData || _dartData.status !== 'found') return;
    const d = _dartData;
    const notice = document.getElementById('finDartAutoFill');
    if (notice) notice.classList.remove('hidden');

    // DART 응답에 업종코드가 있으면 자동 세팅
    if (d.indutyCode) {
      const codeEl = document.getElementById('finIndustryCode');
      const nameEl = document.getElementById('finIndustryName');
      const searchEl = document.getElementById('industrySearchInput');
      const selEl = document.getElementById('finIndustrySelected');
      if (codeEl) codeEl.value = d.indutyCode;
      if (nameEl) nameEl.value = d.indutyName || d.indutyCode;
      if (searchEl) searchEl.value = `${d.indutyName || d.indutyCode} (${d.indutyCode})`;
      if (selEl) { selEl.textContent = `✓ DART 자동세팅: ${d.indutyName || d.indutyCode} — ${d.indutyCode}`; selEl.style.display = 'block'; }
    }

    // raw 값 (원 단위) → 백만원
    const rawToMil = (raw) => {
      if (!raw) return null;
      const n = parseInt(raw.replace(/,/g, ''), 10);
      return isNaN(n) ? null : Math.round(n / 1000000);
    };
    const f = (obj) => rawToMil(obj?.raw);

    // ── B/S 전 항목 자동입력 ──
    _setField('fin_current_assets',       f(d.currentAssets));
    _setField('fin_quick_assets',         f(d.quickAssets));
    _setField('fin_cash',                 f(d.cash));
    _setField('fin_receivable',           f(d.receivable));
    _setField('fin_inventory',            f(d.inventory));
    _setField('fin_noncurrent_assets',    f(d.nonCurrentAssets));
    _setField('fin_tangible_assets',      f(d.tangibleAssets));
    _setField('fin_total_assets',         f(d.totalAssets));
    _setField('fin_current_liabilities',  f(d.currentLiabilities));
    _setField('fin_payable',              f(d.payable));
    _setField('fin_noncurrent_liabilities',f(d.nonCurrentLiab));
    _setField('fin_borrowings',           f(d.borrowings));
    _setField('fin_total_liabilities',    f(d.totalDebt));
    // 자기자본: DART 응답 우선, 없으면 자산-부채 계산
    if (f(d.equity)) {
      _setField('fin_equity', f(d.equity));
    } else {
      const ta = f(d.totalAssets), td = f(d.totalDebt);
      if (ta && td) _setField('fin_equity', ta - td);
    }
    // ── I/S 전 항목 자동입력 ──
    _setField('fin_revenue',          f(d.revenue));
    _setField('fin_gross_profit',     f(d.grossProfit));
    _setField('fin_operating_profit', f(d.operatingProfit));
    _setField('fin_interest_expense', f(d.interestExpense));
    _setField('fin_net_income',       f(d.netIncome));
    _setField('fin_labor_cost',       f(d.laborCost));
  }

  function _fmtComma(n) {
    const abs = Math.abs(Math.round(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return n < 0 ? '-' + abs : abs;
  }

  function _setField(id, val) {
    const el = document.getElementById(id);
    if (!el) return;
    if (val !== null && val !== undefined && val !== '') {
      const n = +val;
      el.value = isNaN(n) ? '' : _fmtComma(n);
      el.placeholder = '0'; // 값 있을 때는 기본 placeholder
    } else {
      el.value = '';
      el.placeholder = 'N/A'; // 미조회 항목임을 명확히 표시
    }
  }

  /* ── 재무분석 실행 ── */
  async function analyze() {
    const d = _collectData();
    if (!d) return;
    _finData = d;

    // 버튼 비활성화
    const btn = document.querySelector('#finWizStep2 .fin-analyze-btn') || document.querySelector('[onclick*="FinWizard.analyze"]');
    if (btn) { btn.disabled = true; btn.textContent = '분석 중...'; }

    try {
      // 한국은행 업종평균 fetch (ECOS API)
      _bokAvg = { ..._BOK_AVG_DEFAULT }; // 기본값으로 초기화
      _bokAvgSource = '제조업 전체 (한국은행 기업경영분석)'; // 소스 초기화
      await _fetchBokAvg(d.industryCode);

      const ratios = _calcRatios(d);
      _lastRatios = ratios;
      const industryCode = document.getElementById('finIndustryCode')?.value.trim() || '';
      _renderDashboard(ratios, d, industryCode);
      App.showFinanceDashboard();
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '재무분석 실행'; }
    }
  }

  /* ── 한국은행 ECOS 업종평균 fetch ── */
  async function _fetchBokAvg(ksicCode) {
    if (!ksicCode) return; // 업종코드 없으면 기본값 유지

    try {
      const res = await fetch('/api/bok-avg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ksicCode })
      });
      const data = await res.json();
      if (data.status === 'found' && data.ratios && Object.keys(data.ratios).length >= 3) {
        // ECOS 값이 있는 키만 덮어쓰기 (없는 키는 기본값 유지)
        _bokAvg = { ..._BOK_AVG_DEFAULT, ...data.ratios };
        _bokAvgSource = `${data.sectorName} (${data.year}년 한국은행 기업경영분석)`;
      }
    } catch (_) {
      // 실패 시 기본값(_BOK_AVG_DEFAULT) 유지 — 사용자에게 별도 안내 없음
    }
  }

  let _bokAvgSource = '제조업 전체 (한국은행 기업경영분석)';

  function _collectData() {
    const g = (id) => parseFloat((document.getElementById(id)?.value || '').replace(/,/g, '')) || 0;
    const revenue = g('fin_revenue');
    const totalAssets = g('fin_total_assets');
    const totalLiabilities = g('fin_total_liabilities');
    const equity = g('fin_equity');
    if (!revenue || !totalAssets || !totalLiabilities || !equity) {
      alert('필수 항목(매출액, 자산총계, 부채총계, 자기자본)을 입력해주세요.');
      return null;
    }
    return {
      companyName:         document.getElementById('finCompanyName')?.value.trim() || '',
      industryCode:        document.getElementById('finIndustryCode')?.value.trim() || '',
      year:                document.getElementById('finYear')?.value || '2024',
      current_assets:      g('fin_current_assets'),
      quick_assets:        g('fin_quick_assets'),
      cash:                g('fin_cash'),
      receivable:          g('fin_receivable'),
      inventory:           g('fin_inventory'),
      noncurrent_assets:   g('fin_noncurrent_assets'),
      tangible_assets:     g('fin_tangible_assets'),
      total_assets:        totalAssets,
      current_liabilities: g('fin_current_liabilities'),
      payable:             g('fin_payable'),
      noncurrent_liabilities: g('fin_noncurrent_liabilities'),
      borrowings:          g('fin_borrowings'),
      total_liabilities:   totalLiabilities,
      equity:              equity,
      revenue:             revenue,
      gross_profit:        g('fin_gross_profit'),
      operating_profit:    g('fin_operating_profit'),
      interest_expense:    g('fin_interest_expense'),
      net_income:          g('fin_net_income'),
      labor_cost:          g('fin_labor_cost'),
      employees:           g('fin_employees'),
      prev_revenue:        g('fin_prev_revenue')
    };
  }

  /* ── 6대 재무비율 계산 ── */
  function _calcRatios(d) {
    const pct = (n, denom) => denom ? +(n / denom * 100).toFixed(1) : null;
    const times = (n, denom) => denom ? +(n / denom).toFixed(2) : null;
    const days = (denom, n) => (denom && n) ? Math.round(365 / (n / denom)) : null;

    // 유동성
    const liquidity = {
      유동비율:   pct(d.current_assets, d.current_liabilities),
      당좌비율:   pct(d.quick_assets || (d.current_assets - d.inventory), d.current_liabilities),
      현금비율:   pct(d.cash, d.current_liabilities),
    };

    // 안전성
    const safety = {
      부채비율:         pct(d.total_liabilities, d.equity),
      자기자본비율:     pct(d.equity, d.total_assets),
      순운전자본비율:   pct(d.current_assets - d.current_liabilities, d.total_assets),
      차입금의존도:     pct(d.borrowings, d.total_assets),
      차입금평균이자율: pct(d.interest_expense, d.borrowings),
      이자보상비율:     pct(d.operating_profit, d.interest_expense),
      고정비율:         pct(d.noncurrent_assets || (d.total_assets - d.current_assets), d.equity),
      고정장기적합율:   pct(d.noncurrent_assets || (d.total_assets - d.current_assets), d.equity + d.noncurrent_liabilities),
    };

    // 수익성
    const profitability = {
      매출총이익율:         pct(d.gross_profit, d.revenue),
      매출액영업이익율:     pct(d.operating_profit, d.revenue),
      매출액순이익율:       pct(d.net_income, d.revenue),
      총자본순이익율_ROA:   pct(d.net_income, d.total_assets),
      자기자본순이익율_ROE: pct(d.net_income, d.equity),
    };

    // 활동성
    const activity = {
      총자산회전율:       times(d.revenue, d.total_assets),
      자기자본회전율:     times(d.revenue, d.equity),
      재고자산회전율:     times(d.revenue, d.inventory),
      매출채권회전율:     times(d.revenue, d.receivable),
      매출채권회수기간:   days(d.receivable, d.revenue),
      매입채무회전율:     times(d.revenue, d.payable),
      매입채무지급기간:   days(d.payable, d.revenue),
    };

    // 생산성
    const emp = d.employees || 1;
    const valueAdded = d.operating_profit + d.labor_cost; // 간이 부가가치
    const productivity = {
      부가가치율:           pct(valueAdded, d.revenue),
      노동생산성_1인당부가가치: d.employees ? Math.round(valueAdded / d.employees) : null,
      인건비대매출액:       pct(d.labor_cost, d.revenue),
      노동소득분배율:       pct(d.labor_cost, valueAdded),
    };

    // 성장성
    const growth = {
      매출액증가율: d.prev_revenue ? pct(d.revenue - d.prev_revenue, d.prev_revenue) : null,
    };

    return { liquidity, safety, profitability, activity, productivity, growth };
  }

  /* ── 한국은행 업종평균 (하드코딩 기준값, 제조업 C 기준) ── */
  const _BOK_AVG_DEFAULT = {
    유동비율: 127, 당좌비율: 96, 현금비율: 16,
    부채비율: 142, 자기자본비율: 41, 순운전자본비율: 11,
    차입금의존도: 32, 차입금평균이자율: 6, 이자보상비율: 237,
    고정비율: 115, 고정장기적합율: 81,
    매출총이익율: 15, 매출액영업이익율: 4, 매출액순이익율: 2,
    총자본순이익율_ROA: 3, 자기자본순이익율_ROE: 7,
    총자산회전율: 1.3, 자기자본회전율: 3.2,
    재고자산회전율: 10.4, 매출채권회전율: 6.3,
    매출채권회수기간: 58, 매입채무회전율: 9.8, 매입채무지급기간: 37,
    부가가치율: 21, 인건비대매출액: 12, 노동소득분배율: 76,
    매출액증가율: 9,
  };

  /* 비율이 높을수록 좋은 것 vs 낮을수록 좋은 것 */
  const _HIGH_IS_GOOD = new Set([
    '유동비율','당좌비율','현금비율','자기자본비율','순운전자본비율',
    '이자보상비율','매출총이익율','매출액영업이익율','매출액순이익율',
    '총자본순이익율_ROA','자기자본순이익율_ROE',
    '총자산회전율','자기자본회전율','재고자산회전율','매출채권회전율',
    '매입채무회전율','부가가치율','노동생산성_1인당부가가치',
    '매출액증가율','고정장기적합율',
  ]);
  const _LOW_IS_GOOD = new Set([
    '부채비율','차입금의존도','차입금평균이자율','고정비율',
    '인건비대매출액','노동소득분배율',
    '매출채권회수기간','매입채무지급기간',
  ]);

  function _evalVsAvg(key, val) {
    const avg = _bokAvg[key];
    if (val === null || avg === undefined) return { label: '—', cls: '' };
    if (_HIGH_IS_GOOD.has(key)) {
      return val >= avg ? { label: '산업평균 이상', cls: 'fin-eval-good' } : { label: '산업평균 미달', cls: 'fin-eval-bad' };
    }
    if (_LOW_IS_GOOD.has(key)) {
      return val <= avg ? { label: '산업평균 양호', cls: 'fin-eval-good' } : { label: '산업평균 초과', cls: 'fin-eval-bad' };
    }
    return { label: '—', cls: '' };
  }

  /* ── 레이더 차트 점수 계산 (50 = 산업평균, 0~100 범위) ── */
  /* ── 섹션별 레이더 축 계산 (50 = 산업평균, 0~100) ── */
  const _RADAR_SHORT = {
    유동비율:'유동비율', 당좌비율:'당좌비율', 현금비율:'현금비율',
    부채비율:'부채비율', 자기자본비율:'자기자본', 순운전자본비율:'순운전자본',
    차입금의존도:'차입금의존', 차입금평균이자율:'차입이자율',
    이자보상비율:'이자보상', 고정비율:'고정비율', 고정장기적합율:'고정장기',
    매출총이익율:'매출총이익', 매출액영업이익율:'영업이익률', 매출액순이익율:'순이익률',
    총자본순이익율_ROA:'ROA', 자기자본순이익율_ROE:'ROE',
    총자산회전율:'총자산', 자기자본회전율:'자기자본', 재고자산회전율:'재고자산',
    매출채권회전율:'매출채권', 매출채권회수기간:'채권회수일',
    매입채무회전율:'매입채무', 매입채무지급기간:'채무지급일',
    부가가치율:'부가가치율', 노동생산성_1인당부가가치:'노동생산성',
    인건비대매출액:'인건비율', 노동소득분배율:'노동분배율',
    매출액증가율:'매출증가율',
  };

  function _getSectionAxes(data) {
    return Object.entries(data).map(([key, val]) => {
      const avg = _bokAvg[key];
      const isHigh = _HIGH_IS_GOOD.has(key);
      const isLow  = _LOW_IS_GOOD.has(key);
      let score = null;
      if (val !== null && val !== undefined && avg) {
        if (isHigh) {
          score = Math.min(Math.max(val / avg * 50, 0), 100);
        } else if (isLow) {
          // 낮을수록 좋은 항목: 산업평균 이하면 높은 점수
          score = val <= 0 ? 100 : Math.min(Math.max(avg / val * 50, 0), 100);
        }
      }
      return { key, label: _RADAR_SHORT[key] || key, score };
    });
  }

  /* ── 레이더 차트 그리기 (Canvas API, 범용) ── */
  function _drawRadarAxes(canvasId, axes) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !canvas.getContext) return;
    const N = axes.length;
    if (N < 3) return; // 3개 미만은 레이더 불가
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const R = Math.min(cx, cy) - 38;

    ctx.clearRect(0, 0, W, H);

    const angle = i => (i / N) * Math.PI * 2 - Math.PI / 2;
    const pt    = (i, r) => ({ x: cx + r * Math.cos(angle(i)), y: cy + r * Math.sin(angle(i)) });

    // 그리드 4단계
    for (let lv = 1; lv <= 4; lv++) {
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const p = pt(i, R * lv / 4);
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.strokeStyle = lv === 2 ? 'rgba(245,192,48,0.3)' : 'rgba(255,255,255,0.07)';
      ctx.lineWidth = lv === 2 ? 1.5 : 1;
      ctx.stroke();
    }

    // 축선
    for (let i = 0; i < N; i++) {
      const p = pt(i, R);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1; ctx.stroke();
    }

    // 산업평균 다각형 (50% = 점선)
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const p = pt(i, R * 0.5);
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(148,163,184,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(148,163,184,0.06)'; ctx.fill();

    // 당사 다각형
    const scores = axes.map(a => a.score !== null ? a.score : 50);
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const p = pt(i, R * scores[i] / 100);
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.strokeStyle = '#F5C030'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = 'rgba(245,192,48,0.16)'; ctx.fill();

    // 당사 점
    scores.forEach((s, i) => {
      const p = pt(i, R * s / 100);
      ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#F5C030'; ctx.fill();
      ctx.strokeStyle = '#0A0E1A'; ctx.lineWidth = 1.5; ctx.stroke();
    });

    // 라벨
    ctx.font = 'bold 11px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const LBL_R = R + 22;
    axes.forEach(({ label, score }, i) => {
      const p = pt(i, LBL_R);
      ctx.fillStyle = score !== null ? '#E8EDF5' : '#5A6A8A';
      ctx.fillText(label, p.x, p.y);
    });

    // '평균' 텍스트 (50% 선 위)
    ctx.font = '9px "Noto Sans KR", sans-serif';
    ctx.fillStyle = 'rgba(245,192,48,0.55)';
    const avgPt = pt(0, R * 0.5);
    ctx.fillText('평균', avgPt.x + 3, avgPt.y - 9);
  }

  /* ── 대시보드 렌더링 ── */
  function _renderDashboard(ratios, d, industryCode) {
    const wrap = document.getElementById('finDashContent');
    if (!wrap) return;

    const sections = [
      { key: 'liquidity',     title: '유동성 분석',  icon: '💧', desc: '단기 채무 상환 능력', data: ratios.liquidity },
      { key: 'safety',        title: '안전성 분석',  icon: '🛡️', desc: '장기 재무 안정성',    data: ratios.safety },
      { key: 'profitability', title: '수익성 분석',  icon: '💰', desc: '이익 창출 능력',       data: ratios.profitability },
      { key: 'activity',      title: '활동성 분석',  icon: '⚙️', desc: '자산 운용 효율성',    data: ratios.activity },
      { key: 'productivity',  title: '생산성 분석',  icon: '🏭', desc: '노동·자본 생산성',    data: ratios.productivity },
      { key: 'growth',        title: '성장성 분석',  icon: '📈', desc: '성장 추세',            data: ratios.growth },
    ];

    const goodCount = _countEvals(ratios);

    wrap.innerHTML = `
      <div class="fin-dash-header">
        <div>
          <h1 class="fin-dash-title">${d.companyName} 재무분석 리포트</h1>
          <p class="fin-dash-meta">${d.year}년 기준 · 업종코드: ${industryCode} · 한국은행 산업평균 대비</p>
        </div>
        <div class="fin-score-summary">
          <div class="fin-score-num">${goodCount.good}<span>/${goodCount.total}</span></div>
          <div class="fin-score-label">산업평균<br>이상 항목</div>
        </div>
      </div>

      <div class="fin-key-metrics">
        ${_keyMetricCard('매출액', d.revenue, '백만원')}
        ${_keyMetricCard('영업이익률', ratios.profitability.매출액영업이익율, '%')}
        ${_keyMetricCard('부채비율', ratios.safety.부채비율, '%')}
        ${_keyMetricCard('ROA', ratios.profitability.총자본순이익율_ROA, '%')}
      </div>

      ${sections.map(s => _renderSection(s)).join('')}

      <!-- BEP 시뮬레이터 (bep-simulator.js) -->
      <div id="bepSimSection" class="fin-section-card" style="display:none"></div>

      <div class="fin-note">
        <p>※ 산업평균 기준: ${_bokAvgSource}</p>
        <p>※ 일부 항목은 입력 데이터가 없는 경우 계산되지 않을 수 있습니다.</p>
      </div>
    `;

    // 각 섹션 레이더 차트 그리기
    sections.forEach(s => {
      const axes = _getSectionAxes(s.data);
      _drawRadarAxes(`finRadar-${s.key}`, axes);
    });

    // BEP 시뮬레이터 초기화
    if (typeof BepSim !== 'undefined') {
      BepSim.init(d);
    }
  }

  function _countEvals(ratios) {
    let good = 0, total = 0;
    Object.values(ratios).forEach(section => {
      Object.entries(section).forEach(([key, val]) => {
        if (val === null) return;
        const ev = _evalVsAvg(key, val);
        if (ev.cls) { total++; if (ev.cls === 'fin-eval-good') good++; }
      });
    });
    return { good, total };
  }

  function _keyMetricCard(label, val, unit) {
    const display = val !== null && val !== undefined ? `${val.toLocaleString()}${unit}` : '—';
    return `<div class="fin-key-card"><div class="fin-key-val">${display}</div><div class="fin-key-label">${label}</div></div>`;
  }

  function _renderSection({ key, title, icon, desc, data }) {
    const rows = Object.entries(data).map(([k, val]) => {
      const avg = _bokAvg[k];
      const ev = _evalVsAvg(k, val);
      const isTime = k.includes('회전율');
      const isDay  = k.includes('기간');
      const unit = isTime ? '회' : isDay ? '일' : isKey1인당(k) ? '백만원' : '%';
      const display    = val !== null ? `${val.toLocaleString()}${unit}` : '—';
      const avgDisplay = avg !== undefined ? (isTime ? `${avg}회` : isDay ? `${avg}일` : isKey1인당(k) ? `${avg}백만원` : `${avg}%`) : '—';
      const barWidth = val !== null && avg ? Math.min(Math.round(val / avg * 100), 200) : 0;
      const barColor = ev.cls === 'fin-eval-good' ? '#4ADE80' : ev.cls === 'fin-eval-bad' ? '#F87171' : '#9BAAC8';

      return `
        <tr class="fin-ratio-row">
          <td class="fin-ratio-name">${k.replace(/_/g, ' ')}</td>
          <td class="fin-ratio-val">${display}</td>
          <td class="fin-ratio-avg">${avgDisplay}</td>
          <td class="fin-ratio-bar-cell">
            <div class="fin-ratio-bar-bg">
              <div class="fin-ratio-bar" style="width:${Math.min(barWidth,100)}%;background:${barColor}"></div>
              ${barWidth > 100 ? `<div class="fin-ratio-bar fin-ratio-bar-over" style="width:${barWidth-100}%;background:${barColor}"></div>` : ''}
            </div>
          </td>
          <td><span class="fin-eval ${ev.cls}">${ev.label}</span></td>
        </tr>`;
    }).join('');

    const N = Object.keys(data).length;
    const chartHtml = N >= 3 ? `
      <div class="fin-section-chart">
        <canvas id="finRadar-${key}" width="220" height="220"></canvas>
        <div class="fin-radar-leg-row">
          <span class="fin-radar-leg-item"><span class="fin-radar-leg-dot"></span>당사</span>
          <span class="fin-radar-leg-item"><span class="fin-radar-leg-dash"></span>산업평균</span>
        </div>
      </div>` : '';

    return `
      <div class="fin-section-card">
        <div class="fin-section-head">
          <span class="fin-section-icon">${icon}</span>
          <div>
            <div class="fin-section-title-text">${title}</div>
            <div class="fin-section-desc">${desc}</div>
          </div>
        </div>
        <div class="fin-section-body${N >= 3 ? ' fin-section-body--chart' : ''}">
          ${chartHtml}
          <div class="fin-section-table-wrap">
            <table class="fin-ratio-table">
              <thead><tr>
                <th>항목</th><th>당사</th><th>산업평균</th><th>비교</th><th>평가</th>
              </tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
      </div>`;
  }

  function isKey1인당(key) { return key.includes('1인당'); }

  /* ─────────────────────────────────────────────────────────────────
     재무분석 리포트 생성 — NICE BizINFO 수준 (섹션별 정의+분석)
  ───────────────────────────────────────────────────────────────── */
  function renderReport() {
    const d = _finData;
    const r = _lastRatios;
    if (!d || !r) { alert('먼저 재무분석을 실행해주세요.'); return; }

    const today    = new Date();
    const todayStr = `${today.getFullYear()}년 ${today.getMonth()+1}월 ${today.getDate()}일`;
    const industryName = document.getElementById('finIndustryName')?.value ||
                         document.getElementById('finIndustryCode')?.value || '전체업종';
    const wrap = document.getElementById('finReportContent');
    if (!wrap) return;

    /* ── 포맷 헬퍼 ── */
    const fmtW = v => (v || v===0) ? `${(+v).toLocaleString()}백만원` : '—';
    const fmtN = v => (v || v===0) ? `${(+v).toLocaleString()}` : '—';

    function vFmt(key, val) {
      if (val === null || val === undefined) return '—';
      if (key.includes('회전율')) return `${val}회`;
      if (key.includes('기간'))   return `${val}일`;
      if (key.includes('1인당'))  return `${(+val).toLocaleString()}백만원`;
      return `${val}%`;
    }
    function aFmt(key) {
      const a = _bokAvg[key];
      if (a === undefined) return '—';
      if (key.includes('회전율')) return `${a}회`;
      if (key.includes('기간'))   return `${a}일`;
      if (key.includes('1인당'))  return `${a}백만원`;
      return `${a}%`;
    }
    function dFmt(key, val) {
      if (val === null || val === undefined) return '—';
      const a = _bokAvg[key];
      if (!a) return '—';
      const diff = +(val - a).toFixed(1);
      const sign = diff >= 0 ? '+' : '';
      if (key.includes('회전율')) return `${sign}${diff.toFixed(2)}회`;
      if (key.includes('기간'))   return `${sign}${diff.toFixed(1)}일`;
      if (key.includes('1인당'))  return `${sign}${diff.toFixed(0)}백만원`;
      return `${sign}${diff.toFixed(1)}%p`;
    }
    function eCell(key, val) {
      if (val === null || val === undefined) return `<span class="nice-grade-na">—</span>`;
      const ev = _evalVsAvg(key, val);
      if (!ev.cls) return `<span class="nice-grade-na">—</span>`;
      return ev.cls === 'fin-eval-good'
        ? `<span class="nice-grade-good">▲ 양호</span>`
        : `<span class="nice-grade-bad">▼ 주의</span>`;
    }

    /* ── 비율 행 (비교표용) ── */
    function rRow(label, key, val) {
      return `<tr>
        <td class="nice-rt-label">${label}</td>
        <td class="nice-rt-val">${vFmt(key, val)}</td>
        <td class="nice-rt-avg">${aFmt(key)}</td>
        <td class="nice-rt-diff">${dFmt(key, val)}</td>
        <td class="nice-rt-eval">${eCell(key, val)}</td>
      </tr>`;
    }

    /* ── 종합표 행 ── */
    function sRow(group, label, key, val) {
      return `<tr>
        <td style="text-align:center;font-size:0.78rem;color:#666">${group}</td>
        <td>${label}</td>
        <td>${vFmt(key, val)}</td>
        <td>${aFmt(key)}</td>
        <td>${dFmt(key, val)}</td>
        <td>${eCell(key, val)}</td>
      </tr>`;
    }

    /* ── 섹션 헤더 ── */
    function sHdr(num, title, sub) {
      return `<div class="nice-sec-hdr">
        <div class="nice-sec-num">${num}</div>
        <div><div class="nice-sec-title">${title}</div><div class="nice-sec-sub">${sub}</div></div>
      </div>`;
    }

    /* ── 분석의견 블록 ── */
    function aBlock(areaKey) {
      const op = _buildOpinionPara(areaKey, r, d);
      return `<div class="nice-analysis">
        <div class="nice-analysis-row">
          <div class="nice-analysis-label">■ 평가 (현황)</div>
          <div class="nice-analysis-text">${op.eval}</div>
        </div>
        <div class="nice-analysis-row">
          <div class="nice-analysis-label">■ 진단 (원인)</div>
          <div class="nice-analysis-text">${op.diag}</div>
        </div>
        <div class="nice-analysis-row">
          <div class="nice-analysis-label">■ 처방 (대안)</div>
          <div class="nice-analysis-text">${op.rx}</div>
        </div>
      </div>`;
    }

    /* ── 종합 점수 ── */
    const sc = _countEvals(r);
    const score = sc.total > 0 ? Math.round(sc.good / sc.total * 100) : 0;
    const grade = score >= 70 ? 'A' : score >= 55 ? 'B' : score >= 40 ? 'C' : 'D';
    const gradeLbl = score >= 70 ? '양호' : score >= 55 ? '보통' : score >= 40 ? '주의' : '취약';
    const gradeClr = score >= 70 ? '#059669' : score >= 55 ? '#D97706' : score >= 40 ? '#EA580C' : '#DC2626';

    wrap.innerHTML = `

    <!-- ══════════ 표지 ══════════ -->
    <div class="rpt-cover">
      <div class="rpt-cover-inner">
        <div style="font-size:1.6rem;font-weight:900;color:#F5C030;letter-spacing:0.1em">BizNavi</div>
        <div style="font-size:0.7rem;color:rgba(255,255,255,.4);letter-spacing:0.18em;margin-bottom:32px">AI FINANCIAL INTELLIGENCE</div>
        <div style="font-size:0.85rem;color:rgba(255,255,255,.5);letter-spacing:0.18em;margin-bottom:10px">재무분석 보고서</div>
        <div style="font-size:2.2rem;font-weight:800;color:#E8EDF5;margin-bottom:6px">${d.companyName}</div>
        <div style="font-size:0.9rem;color:rgba(255,255,255,.5);margin-bottom:36px">${industryName}</div>
        <table class="rpt-cover-table">
          <tr><td class="rpt-cover-key">분석연도</td><td class="rpt-cover-val">${d.year}년 기준</td></tr>
          <tr><td class="rpt-cover-key">업&nbsp;&nbsp;&nbsp;&nbsp;종</td><td class="rpt-cover-val">${industryName}</td></tr>
          <tr><td class="rpt-cover-key">작&nbsp;성&nbsp;일</td><td class="rpt-cover-val">${todayStr}</td></tr>
          <tr><td class="rpt-cover-key">산업평균</td><td class="rpt-cover-val">${_bokAvgSource}</td></tr>
        </table>
        <div class="rpt-cover-note">본 보고서는 입력된 재무데이터와 산업평균 기준으로 자동 생성되었습니다.</div>
      </div>
    </div>

    <!-- ══════════ 01. 재무현황 요약 ══════════ -->
    <div class="rpt-page">
      ${sHdr('01', '재무현황 요약', 'Financial Overview')}
      <div class="nice-kv-grid">
        <div class="nice-kv-card">
          <div class="nice-kv-label">자산 총계</div>
          <div class="nice-kv-value">${fmtW(d.total_assets)}</div>
          <div class="nice-kv-sub">유동 ${fmtW(d.current_assets)} / 비유동 ${fmtW(d.noncurrent_assets || (d.total_assets - d.current_assets))}</div>
        </div>
        <div class="nice-kv-card">
          <div class="nice-kv-label">부채 총계</div>
          <div class="nice-kv-value">${fmtW(d.total_liabilities)}</div>
          <div class="nice-kv-sub">유동 ${fmtW(d.current_liabilities)} / 비유동 ${fmtW(d.noncurrent_liabilities)}</div>
        </div>
        <div class="nice-kv-card">
          <div class="nice-kv-label">자기자본</div>
          <div class="nice-kv-value">${fmtW(d.equity)}</div>
          <div class="nice-kv-sub">자기자본비율 ${vFmt('자기자본비율', r.safety.자기자본비율)}</div>
        </div>
        <div class="nice-kv-card">
          <div class="nice-kv-label">매출액</div>
          <div class="nice-kv-value">${fmtW(d.revenue)}</div>
          <div class="nice-kv-sub">매출총이익률 ${vFmt('매출총이익율', r.profitability.매출총이익율)}</div>
        </div>
        <div class="nice-kv-card">
          <div class="nice-kv-label">영업이익</div>
          <div class="nice-kv-value">${fmtW(d.operating_profit)}</div>
          <div class="nice-kv-sub">영업이익률 ${vFmt('매출액영업이익율', r.profitability.매출액영업이익율)} ${eCell('매출액영업이익율', r.profitability.매출액영업이익율)}</div>
        </div>
        <div class="nice-kv-card">
          <div class="nice-kv-label">당기순이익</div>
          <div class="nice-kv-value">${fmtW(d.net_income)}</div>
          <div class="nice-kv-sub">순이익률 ${vFmt('매출액순이익율', r.profitability.매출액순이익율)}</div>
        </div>
      </div>
      <div class="nice-score-bar">
        <div class="nice-score-grade" style="color:${gradeClr}">${grade}</div>
        <div class="nice-score-info">
          <div class="nice-score-label">재무건전성 종합등급</div>
          <div class="nice-score-sub">산업평균 대비 <strong>${sc.good}/${sc.total}개</strong> 항목 양호 — <strong style="color:${gradeClr}">${gradeLbl}</strong></div>
        </div>
        <div class="nice-score-progress">
          <div class="nice-score-bar-inner" style="width:${score}%;background:${gradeClr}"></div>
        </div>
        <div class="nice-score-pct" style="color:${gradeClr}">${score}점</div>
      </div>
    </div>

    <!-- ══════════ 02. 재무비율 종합 평가 ══════════ -->
    <div class="rpt-page">
      ${sHdr('02', '재무비율 종합 평가', 'Financial Ratio Summary')}
      <table class="nice-summary-table">
        <thead><tr><th>구분</th><th>지표명</th><th>당사</th><th>산업평균</th><th>차이</th><th>평가</th></tr></thead>
        <tbody>
          <tr class="nice-group-hdr"><td colspan="6">유동성 지표 (Liquidity)</td></tr>
          ${sRow('유동성','유동비율','유동비율',r.liquidity.유동비율)}
          ${sRow('','당좌비율','당좌비율',r.liquidity.당좌비율)}
          ${sRow('','현금비율','현금비율',r.liquidity.현금비율)}
          <tr class="nice-group-hdr"><td colspan="6">안전성 지표 (Stability)</td></tr>
          ${sRow('안전성','부채비율','부채비율',r.safety.부채비율)}
          ${sRow('','자기자본비율','자기자본비율',r.safety.자기자본비율)}
          ${sRow('','차입금의존도','차입금의존도',r.safety.차입금의존도)}
          ${sRow('','이자보상비율','이자보상비율',r.safety.이자보상비율)}
          ${sRow('','고정비율','고정비율',r.safety.고정비율)}
          <tr class="nice-group-hdr"><td colspan="6">수익성 지표 (Profitability)</td></tr>
          ${sRow('수익성','매출총이익율','매출총이익율',r.profitability.매출총이익율)}
          ${sRow('','영업이익율','매출액영업이익율',r.profitability.매출액영업이익율)}
          ${sRow('','순이익율','매출액순이익율',r.profitability.매출액순이익율)}
          ${sRow('','ROA','총자본순이익율_ROA',r.profitability.총자본순이익율_ROA)}
          ${sRow('','ROE','자기자본순이익율_ROE',r.profitability.자기자본순이익율_ROE)}
          <tr class="nice-group-hdr"><td colspan="6">활동성 지표 (Activity)</td></tr>
          ${sRow('활동성','총자산회전율','총자산회전율',r.activity.총자산회전율)}
          ${sRow('','매출채권회전율','매출채권회전율',r.activity.매출채권회전율)}
          ${sRow('','매출채권회수기간','매출채권회수기간',r.activity.매출채권회수기간)}
          ${sRow('','재고자산회전율','재고자산회전율',r.activity.재고자산회전율)}
          <tr class="nice-group-hdr"><td colspan="6">성장성 지표 (Growth)</td></tr>
          ${sRow('성장성','매출액증가율','매출액증가율',r.growth.매출액증가율)}
        </tbody>
      </table>
    </div>

    <!-- ══════════ 03. 유동성 분석 ══════════ -->
    <div class="rpt-page">
      ${sHdr('03', '유동성 분석', 'Liquidity Analysis')}
      <p class="nice-section-lead">유동성은 기업이 단기 채무를 적시에 상환할 수 있는 능력으로, 기업의 단기 지급 안정성과 직결됩니다.</p>
      <table class="nice-def-table">
        <thead><tr><th>지표명</th><th>산출공식</th><th>판단기준</th></tr></thead>
        <tbody>
          <tr><td>유동비율</td><td>유동자산 ÷ 유동부채 × 100</td><td>100% 이상 권장 (업종평균 이상)</td></tr>
          <tr><td>당좌비율</td><td>(유동자산 − 재고자산) ÷ 유동부채 × 100</td><td>80% 이상 권장</td></tr>
          <tr><td>현금비율</td><td>현금및현금성자산 ÷ 유동부채 × 100</td><td>20% 이상 권장</td></tr>
        </tbody>
      </table>
      <table class="nice-ratio-table">
        <thead><tr><th>지표명</th><th>당사</th><th>산업평균</th><th>차이</th><th>평가</th></tr></thead>
        <tbody>
          ${rRow('유동비율','유동비율',r.liquidity.유동비율)}
          ${rRow('당좌비율','당좌비율',r.liquidity.당좌비율)}
          ${rRow('현금비율','현금비율',r.liquidity.현금비율)}
        </tbody>
      </table>
      ${aBlock('liquidity')}
    </div>

    <!-- ══════════ 04. 안전성 분석 ══════════ -->
    <div class="rpt-page">
      ${sHdr('04', '안전성 분석', 'Stability Analysis')}
      <p class="nice-section-lead">안전성은 기업의 장기 채무 상환 능력과 재무구조 건전성을 나타내며, 외부 충격에 대한 재무적 내성을 측정합니다.</p>
      <table class="nice-def-table">
        <thead><tr><th>지표명</th><th>산출공식</th><th>판단기준</th></tr></thead>
        <tbody>
          <tr><td>부채비율</td><td>부채총계 ÷ 자기자본 × 100</td><td>낮을수록 안정 (200% 이하 권장)</td></tr>
          <tr><td>자기자본비율</td><td>자기자본 ÷ 자산총계 × 100</td><td>높을수록 안정 (30% 이상 권장)</td></tr>
          <tr><td>차입금의존도</td><td>차입금합계 ÷ 자산총계 × 100</td><td>낮을수록 양호 (30% 이하 권장)</td></tr>
          <tr><td>이자보상비율</td><td>영업이익 ÷ 이자비용 × 100</td><td>100% 이상 (이자 감당 가능)</td></tr>
          <tr><td>고정비율</td><td>비유동자산 ÷ 자기자본 × 100</td><td>낮을수록 안정 (100% 이하)</td></tr>
          <tr><td>고정장기적합율</td><td>비유동자산 ÷ (자기자본 + 비유동부채) × 100</td><td>100% 이하 권장</td></tr>
        </tbody>
      </table>
      <table class="nice-ratio-table">
        <thead><tr><th>지표명</th><th>당사</th><th>산업평균</th><th>차이</th><th>평가</th></tr></thead>
        <tbody>
          ${rRow('부채비율','부채비율',r.safety.부채비율)}
          ${rRow('자기자본비율','자기자본비율',r.safety.자기자본비율)}
          ${rRow('차입금의존도','차입금의존도',r.safety.차입금의존도)}
          ${rRow('이자보상비율','이자보상비율',r.safety.이자보상비율)}
          ${rRow('고정비율','고정비율',r.safety.고정비율)}
          ${rRow('고정장기적합율','고정장기적합율',r.safety.고정장기적합율)}
        </tbody>
      </table>
      ${aBlock('safety')}
    </div>

    <!-- ══════════ 05. 수익성 분석 ══════════ -->
    <div class="rpt-page">
      ${sHdr('05', '수익성 분석', 'Profitability Analysis')}
      <p class="nice-section-lead">수익성은 기업의 자원 투입 대비 이익 창출 능력으로, 지속 성장 가능성과 투자 매력도를 판단하는 핵심 지표입니다.</p>
      <table class="nice-def-table">
        <thead><tr><th>지표명</th><th>산출공식</th><th>판단기준</th></tr></thead>
        <tbody>
          <tr><td>매출총이익율</td><td>매출총이익 ÷ 매출액 × 100</td><td>높을수록 원가 경쟁력 우수</td></tr>
          <tr><td>영업이익율</td><td>영업이익 ÷ 매출액 × 100</td><td>높을수록 영업 수익성 양호</td></tr>
          <tr><td>순이익율</td><td>당기순이익 ÷ 매출액 × 100</td><td>높을수록 최종 수익성 양호</td></tr>
          <tr><td>ROA</td><td>당기순이익 ÷ 자산총계 × 100</td><td>높을수록 자산 활용 효율 우수</td></tr>
          <tr><td>ROE</td><td>당기순이익 ÷ 자기자본 × 100</td><td>높을수록 자기자본 효율 우수</td></tr>
        </tbody>
      </table>
      <table class="nice-ratio-table">
        <thead><tr><th>지표명</th><th>당사</th><th>산업평균</th><th>차이</th><th>평가</th></tr></thead>
        <tbody>
          ${rRow('매출총이익율','매출총이익율',r.profitability.매출총이익율)}
          ${rRow('영업이익율','매출액영업이익율',r.profitability.매출액영업이익율)}
          ${rRow('순이익율','매출액순이익율',r.profitability.매출액순이익율)}
          ${rRow('ROA (총자본순이익율)','총자본순이익율_ROA',r.profitability.총자본순이익율_ROA)}
          ${rRow('ROE (자기자본순이익율)','자기자본순이익율_ROE',r.profitability.자기자본순이익율_ROE)}
        </tbody>
      </table>
      ${aBlock('profitability')}
    </div>

    <!-- ══════════ 06. 활동성 분석 ══════════ -->
    <div class="rpt-page">
      ${sHdr('06', '활동성 분석', 'Activity Analysis')}
      <p class="nice-section-lead">활동성은 기업이 보유 자산을 얼마나 효율적으로 활용하여 매출을 창출하는지를 측정하며, 운전자본 관리 효율성을 나타냅니다.</p>
      <table class="nice-def-table">
        <thead><tr><th>지표명</th><th>산출공식</th><th>판단기준</th></tr></thead>
        <tbody>
          <tr><td>총자산회전율</td><td>매출액 ÷ 자산총계</td><td>높을수록 자산 활용 효율 우수</td></tr>
          <tr><td>자기자본회전율</td><td>매출액 ÷ 자기자본</td><td>높을수록 자기자본 활용 효율 우수</td></tr>
          <tr><td>매출채권회전율</td><td>매출액 ÷ 매출채권</td><td>높을수록 채권 회수 빠름</td></tr>
          <tr><td>매출채권회수기간</td><td>365 ÷ 매출채권회전율</td><td>낮을수록 회수 속도 빠름</td></tr>
          <tr><td>재고자산회전율</td><td>매출액 ÷ 재고자산</td><td>높을수록 재고 관리 효율 우수</td></tr>
        </tbody>
      </table>
      <table class="nice-ratio-table">
        <thead><tr><th>지표명</th><th>당사</th><th>산업평균</th><th>차이</th><th>평가</th></tr></thead>
        <tbody>
          ${rRow('총자산회전율','총자산회전율',r.activity.총자산회전율)}
          ${rRow('자기자본회전율','자기자본회전율',r.activity.자기자본회전율)}
          ${rRow('매출채권회전율','매출채권회전율',r.activity.매출채권회전율)}
          ${rRow('매출채권회수기간','매출채권회수기간',r.activity.매출채권회수기간)}
          ${rRow('재고자산회전율','재고자산회전율',r.activity.재고자산회전율)}
        </tbody>
      </table>
      ${aBlock('activity')}
    </div>

    <!-- ══════════ 07. 성장성 분석 ══════════ -->
    <div class="rpt-page">
      ${sHdr('07', '성장성 분석', 'Growth Analysis')}
      <p class="nice-section-lead">성장성은 기업의 외형 확대 속도를 나타내며, 산업 성장률과의 비교를 통해 시장 경쟁력을 판단합니다.</p>
      <table class="nice-def-table">
        <thead><tr><th>지표명</th><th>산출공식</th><th>판단기준</th></tr></thead>
        <tbody>
          <tr><td>매출액증가율</td><td>(당기매출 − 전기매출) ÷ 전기매출 × 100</td><td>높을수록 성장성 우수 (산업평균 이상 권장)</td></tr>
        </tbody>
      </table>
      <table class="nice-ratio-table">
        <thead><tr><th>지표명</th><th>당사</th><th>산업평균</th><th>차이</th><th>평가</th></tr></thead>
        <tbody>
          ${rRow('매출액증가율','매출액증가율',r.growth.매출액증가율)}
        </tbody>
      </table>
      ${aBlock('growth')}
    </div>

    <!-- ══════════ 08. 재무상태표 ══════════ -->
    <div class="rpt-page">
      ${sHdr('08', '재무상태표 (B/S)', 'Balance Sheet')}
      <p class="rpt-unit">(단위 : 백만원)</p>
      <table class="rpt-bs-table">
        <thead><tr><th colspan="2">과목</th><th>${d.year}년</th></tr></thead>
        <tbody>
          <tr class="rpt-bs-head"><td colspan="3">〈 자 산 〉</td></tr>
          <tr class="rpt-bs-sub"><td>Ⅰ. 유동자산</td><td></td><td>${fmtN(d.current_assets)}</td></tr>
          <tr><td></td><td>(1) 당좌자산</td><td>${fmtN(d.quick_assets)}</td></tr>
          <tr><td></td><td>&nbsp;&nbsp;현금 + 금융상품</td><td>${fmtN(d.cash)}</td></tr>
          <tr><td></td><td>&nbsp;&nbsp;매출채권 + 받을어음</td><td>${fmtN(d.receivable)}</td></tr>
          <tr><td></td><td>(2) 재고자산</td><td>${fmtN(d.inventory)}</td></tr>
          <tr class="rpt-bs-sub"><td>Ⅱ. 비유동자산</td><td></td><td>${fmtN(d.noncurrent_assets || (d.total_assets - d.current_assets))}</td></tr>
          <tr><td></td><td>(1) 유형자산</td><td>${fmtN(d.tangible_assets)}</td></tr>
          <tr class="rpt-bs-total"><td colspan="2">자산총계</td><td>${fmtN(d.total_assets)}</td></tr>
          <tr class="rpt-bs-head"><td colspan="3">〈 부 채 〉</td></tr>
          <tr class="rpt-bs-sub"><td>Ⅰ. 유동부채</td><td></td><td>${fmtN(d.current_liabilities)}</td></tr>
          <tr><td></td><td>&nbsp;&nbsp;매입채무 + 지급어음</td><td>${fmtN(d.payable)}</td></tr>
          <tr class="rpt-bs-sub"><td>Ⅱ. 비유동부채</td><td></td><td>${fmtN(d.noncurrent_liabilities)}</td></tr>
          <tr><td></td><td>&nbsp;&nbsp;차입금 (장·단기)</td><td>${fmtN(d.borrowings)}</td></tr>
          <tr class="rpt-bs-total"><td colspan="2">부채총계</td><td>${fmtN(d.total_liabilities)}</td></tr>
          <tr class="rpt-bs-head"><td colspan="3">〈 자 본 〉</td></tr>
          <tr class="rpt-bs-total"><td colspan="2">자기자본(자본총계)</td><td>${fmtN(d.equity)}</td></tr>
          <tr class="rpt-bs-grand"><td colspan="2">부채와 자본 총계</td><td>${fmtN(d.total_assets)}</td></tr>
        </tbody>
      </table>
    </div>

    <!-- ══════════ 09. 포괄손익계산서 ══════════ -->
    <div class="rpt-page">
      ${sHdr('09', '포괄손익계산서 (I/S)', 'Income Statement')}
      <p class="rpt-unit">(단위 : 백만원)</p>
      <table class="rpt-bs-table">
        <thead><tr><th>과목</th><th>${d.year}년</th><th>매출대비(%)</th></tr></thead>
        <tbody>
          ${_isRow('Ⅰ. 매출액', d.revenue, d.revenue, true)}
          ${_isRow('Ⅱ. 매출원가', d.revenue - d.gross_profit, d.revenue)}
          ${_isRow('Ⅲ. 매출총이익', d.gross_profit, d.revenue, true)}
          ${_isRow('Ⅳ. 판매비와 관리비', d.gross_profit - d.operating_profit, d.revenue)}
          ${_isRow('&nbsp;&nbsp;인건비', d.labor_cost, d.revenue)}
          ${_isRow('Ⅴ. 영업이익', d.operating_profit, d.revenue, true)}
          ${_isRow('&nbsp;&nbsp;이자비용', d.interest_expense, d.revenue)}
          ${_isRow('Ⅵ. 당기순이익', d.net_income, d.revenue, true)}
        </tbody>
      </table>
    </div>

    <!-- ══════════ 10. 종합의견 및 개선안 ══════════ -->
    <div class="rpt-page">
      ${sHdr('10', '종합의견 및 개선안', 'Comprehensive Analysis & Recommendations')}
      <div class="nice-final-box">
        <div class="nice-final-grade-row">
          <div class="nice-final-grade" style="color:${gradeClr}">${grade}</div>
          <div class="nice-final-grade-info">
            <div class="nice-final-grade-label">재무건전성 종합 등급</div>
            <div class="nice-final-grade-text">${sc.good}/${sc.total}개 항목 산업평균 이상 — ${gradeLbl} (${score}점)</div>
          </div>
        </div>
        <div class="nice-final-grid">
          <div class="nice-final-item"><span class="${r.liquidity.유동비율 !== null && r.liquidity.유동비율 >= _bokAvg.유동비율 ? 'nice-grade-good' : 'nice-grade-bad'}">●</span> 유동성: ${vFmt('유동비율', r.liquidity.유동비율)} (산업평균 ${_bokAvg.유동비율}%)</div>
          <div class="nice-final-item"><span class="${r.safety.부채비율 !== null && r.safety.부채비율 <= _bokAvg.부채비율 ? 'nice-grade-good' : 'nice-grade-bad'}">●</span> 안전성: 부채비율 ${vFmt('부채비율', r.safety.부채비율)} (산업평균 ${_bokAvg.부채비율}%)</div>
          <div class="nice-final-item"><span class="${r.profitability.매출액영업이익율 !== null && r.profitability.매출액영업이익율 >= _bokAvg.매출액영업이익율 ? 'nice-grade-good' : 'nice-grade-bad'}">●</span> 수익성: 영업이익율 ${vFmt('매출액영업이익율', r.profitability.매출액영업이익율)} (산업평균 ${_bokAvg.매출액영업이익율}%)</div>
          <div class="nice-final-item"><span class="${r.activity.총자산회전율 !== null && r.activity.총자산회전율 >= _bokAvg.총자산회전율 ? 'nice-grade-good' : 'nice-grade-bad'}">●</span> 활동성: 총자산회전율 ${vFmt('총자산회전율', r.activity.총자산회전율)} (산업평균 ${_bokAvg.총자산회전율}회)</div>
        </div>
        <div class="nice-opinion-block">
          <div class="nice-opinion-title">□ 종합의견</div>
          <div class="nice-opinion-text">${_buildFinalOpinion(r, d, sc, score, gradeLbl)}</div>
        </div>
        <div class="nice-opinion-block">
          <div class="nice-opinion-title">□ 개선 권고사항</div>
          <ul class="nice-improve-list">${_buildImprovements(r, d)}</ul>
        </div>
      </div>
    </div>
    `;

    App.showFinanceReport();
  }

  /* ── 손익계산서 행 ── */
  function _isRow(label, val, revenue, bold=false) {
    const pctVal = (revenue && val !== null && val !== undefined) ? `${+(val/revenue*100).toFixed(1)}%` : '—';
    const style = bold ? ' style="font-weight:700"' : '';
    return `<tr${style}><td>${label}</td><td style="text-align:right">${(+val||0).toLocaleString()}</td><td style="text-align:right">${pctVal}</td></tr>`;
  }

  /* ── 영역별 분석의견 자동생성 ── */
  function _buildLiquidityOpinion(liq, d) {
    const cr = liq.유동비율, qr = liq.당좌비율, cashr = liq.현금비율;
    const crAvg = _bokAvg.유동비율;
    const crStatus = cr !== null ? (cr >= crAvg ? '양호' : '미달') : '미산출';
    const crTxt = cr !== null ? `${cr}%` : '—';

    return {
      eval: `1. 유동비율: ${crTxt} (산업평균 ${crAvg}%) — ${cr !== null ? (cr >= crAvg ? '산업평균 이상으로 단기 채무 상환 능력 양호' : '산업평균 미달로 단기 지급능력 취약') : '데이터 부족'}\n` +
            `2. 당좌비율: ${qr !== null ? qr+'%' : '—'} (산업평균 ${_bokAvg.당좌비율}%) — ${qr !== null ? (qr >= _bokAvg.당좌비율 ? '재고 제외 유동성 양호' : '재고 제외 즉시 지급능력 부족') : '—'}\n` +
            `3. 현금비율: ${cashr !== null ? cashr+'%' : '—'} (산업평균 ${_bokAvg.현금비율}%) — ${cashr !== null ? (cashr >= _bokAvg.현금비율 ? '현금성 자산 충분' : '현금성 자산 확보 미흡') : '—'}`,
      diag: cr !== null && cr < crAvg
        ? '1. 유동부채 증가 또는 유동자산 감소로 운전자본 관리 취약\n2. 현금성 자산 비중 낮아 외부 충격 시 즉각 대응 곤란\n3. 매출채권 회수 지연 가능성 점검 필요'
        : '1. 단기 지급능력은 산업평균 수준 유지\n2. 현금 보유 비중 및 매출채권 회수 주기 지속 모니터링 필요',
      rx: cr !== null && cr < crAvg
        ? '1. 단기 유동성 보강: 유휴자산 매각, 단기성 자금조달로 유동비율 개선\n2. 운전자본 재구성: 매출채권 회전율 개선, 불필요한 재고 정리\n3. 현금중심 경영관리 강화: 현금흐름 기준의 예산 편성'
        : '1. 현재 수준의 유동성 유지 관리\n2. 불필요한 단기 차입 최소화\n3. 매출채권 조기 회수 체계 강화'
    };
  }

  function _buildSafetyOpinion(saf, d) {
    const dr = saf.부채비율, er = saf.자기자본비율, icr = saf.이자보상비율;
    const drAvg = _bokAvg.부채비율;
    return {
      eval: `1. 부채비율: ${dr !== null ? dr+'%' : '—'} (산업평균 ${drAvg}%) — ${dr !== null ? (dr <= drAvg ? '재무구조 안정' : '부채 부담 과중') : '—'}\n` +
            `2. 자기자본비율: ${er !== null ? er+'%' : '—'} (산업평균 ${_bokAvg.자기자본비율}%)\n` +
            `3. 이자보상비율: ${icr !== null ? icr+'%' : '—'} (산업평균 ${_bokAvg.이자보상비율}%) — ${icr !== null ? (icr >= 100 ? '이자 감당 가능' : '영업이익으로 이자 미감당') : '—'}`,
      diag: dr !== null && dr > drAvg
        ? '1. 외부 차입에 대한 의존도가 높아 금리 상승 시 재무부담 가중\n2. 자기자본 기반이 약해 장기 재무 안정성 취약\n3. 이자보상비율 저하는 영업 수익성 약화의 결과'
        : '1. 전반적인 레버리지 수준은 양호\n2. 향후 사업 확장 시 과도한 부채 의존 경계 필요',
      rx: dr !== null && dr > drAvg
        ? '1. 재무구조 개선: 증자 또는 이익잉여금 축적으로 자기자본 확충\n2. 비핵심 자산 매각으로 부채 상환 재원 마련\n3. 고금리 차입금 조기 상환 및 장기 저금리 대출로 전환'
        : '1. 현재 안정적 재무구조 유지\n2. 신규 투자 시 적정 부채비율 범위(150% 이하) 관리\n3. 이자보상비율 200% 이상 목표 유지'
    };
  }

  function _buildProfitabilityOpinion(prof, d) {
    const opm = prof.매출액영업이익율, npm = prof.매출액순이익율, roa = prof.총자본순이익율_ROA;
    return {
      eval: `1. 매출총이익율: ${prof.매출총이익율 !== null ? prof.매출총이익율+'%' : '—'} (산업평균 ${_bokAvg.매출총이익율}%)\n` +
            `2. 영업이익율: ${opm !== null ? opm+'%' : '—'} (산업평균 ${_bokAvg.매출액영업이익율}%) — ${opm !== null ? (opm >= _bokAvg.매출액영업이익율 ? '수익성 양호' : '영업 수익성 개선 필요') : '—'}\n` +
            `3. ROA: ${roa !== null ? roa+'%' : '—'} (산업평균 ${_bokAvg.총자본순이익율_ROA}%) — ${roa !== null ? (roa >= _bokAvg.총자본순이익율_ROA ? '자본 효율성 양호' : '자산 대비 수익 창출 미흡') : '—'}`,
      diag: opm !== null && opm < _bokAvg.매출액영업이익율
        ? '1. 원가율 상승 또는 판관비 증가로 영업이익 압박\n2. 고정비 대비 매출 규모 미흡\n3. 수익성 낮은 사업 포트폴리오 재검토 필요'
        : '1. 전반적 수익성 양호\n2. 원가 효율화 지속 및 판관비 관리 강화 필요',
      rx: opm !== null && opm < _bokAvg.매출액영업이익율
        ? '1. 원가관리 강화: 손익분기점 분석 기반 프로젝트별 수익성 재구성\n2. 비수익 사업 정리 및 핵심역량 집중\n3. 고마진 제품·서비스 비중 확대 전략 수립'
        : '1. 현재 수익성 유지·강화 전략 지속\n2. 매출성장과 수익성 균형 있는 성장 추구\n3. 부가가치 높은 사업영역 개발'
    };
  }

  function _buildActivityOpinion(act, d) {
    const atr = act.총자산회전율, rec = act.매출채권회전율;
    return {
      eval: `1. 총자산회전율: ${atr !== null ? atr+'회' : '—'} (산업평균 ${_bokAvg.총자산회전율}회)\n` +
            `2. 매출채권 회전율: ${rec !== null ? rec+'회' : '—'} (산업평균 ${_bokAvg.매출채권회전율}회) — ${rec !== null ? (rec >= _bokAvg.매출채권회전율 ? '채권 회수 빠름' : '채권 회수 지연') : '—'}\n` +
            `3. 매출채권 회수기간: ${act.매출채권회수기간 !== null ? act.매출채권회수기간+'일' : '—'} (산업평균 ${_bokAvg.매출채권회수기간}일)`,
      diag: rec !== null && rec < _bokAvg.매출채권회전율
        ? '1. 매출채권 회수 지연으로 운영자금 압박 가능성\n2. 매입채무 회전율 저하 시 공급업체 신뢰도 하락 위험\n3. 재고 과다 보유 여부 점검 필요'
        : '1. 전반적인 자산 운용 효율성 양호\n2. 매출채권 관리 수준 지속 유지 필요',
      rx: rec !== null && rec < _bokAvg.매출채권회전율
        ? '1. 매출채권 조기 회수 체계 강화 (팩토링, 어음 할인 활용)\n2. 거래처별 신용 등급 관리 및 한도 설정\n3. 재고 수준 최적화 및 불용 재고 처분'
        : '1. 현재 수준의 자산 회전율 유지\n2. 고객별 여신 한도 관리 지속\n3. 공급망 효율화를 통한 매입채무 관리'
    };
  }

  function _buildGrowthOpinion(gro, d) {
    const mgr = gro.매출액증가율;
    const avg = _bokAvg.매출액증가율;
    return {
      eval: `1. 매출액 증가율: ${mgr !== null ? mgr+'%' : '전년도 데이터 미입력'} (산업평균 ${avg}%) — ${mgr !== null ? (mgr >= avg ? '산업평균 이상 성장' : '성장 둔화') : '전기 매출액 입력 시 산출 가능'}`,
      diag: mgr !== null && mgr < avg
        ? '1. 시장 점유율 확대 전략 미흡\n2. 주력 사업 성숙기 진입 또는 경쟁 심화\n3. 신규 고객 유치 및 제품/서비스 다양화 필요'
        : '1. 성장성 분석을 위해 전기 매출액 데이터 입력 권장\n2. 지속 성장을 위한 전략적 투자 계획 수립 필요',
      rx: mgr !== null && mgr < avg
        ? '1. 핵심사업 리빌딩: 수익성 높은 주력사업 위주 구조 재편\n2. 신규 시장 및 고객군 개척을 통한 매출기반 다각화\n3. R&D 투자 확대로 제품·서비스 경쟁력 강화'
        : '1. 전기 매출액 입력 후 성장률 재산출 권장\n2. 지속 성장을 위한 단계별 투자 로드맵 수립\n3. 핵심 역량 강화 및 시장 확대 전략 추진'
    };
  }

  /* ── 문단형 분석의견 (NICE 스타일 평가→진단→처방) ── */
  function _buildOpinionPara(areaKey, r, d) {
    const ba = _bokAvg;
    const co = d.companyName;

    if (areaKey === 'liquidity') {
      const cr = r.liquidity.유동비율, qr = r.liquidity.당좌비율, cashr = r.liquidity.현금비율;
      const crAvg = ba.유동비율, qrAvg = ba.당좌비율, cashrAvg = ba.현금비율;
      const crOk = cr !== null && cr >= crAvg;
      const diff = cr !== null ? Math.abs(cr - crAvg).toFixed(1) : null;
      return {
        eval: cr !== null
          ? `${co}의 유동비율은 ${cr}%로, 산업평균 ${crAvg}%를 ${diff}%p ${crOk ? '상회하여 단기 채무 상환 능력이 양호한 수준입니다' : '하회하여 단기 지급능력이 다소 취약한 상황입니다'}. 당좌비율은 ${qr !== null ? qr+'%' : '—'}(산업평균 ${qrAvg}%)로 재고 제외 즉시 지급능력이 ${qr !== null && qr >= qrAvg ? '충분히 확보되어 있습니다' : '개선이 필요한 수준입니다'}. 현금비율 ${cashr !== null ? cashr+'%' : '—'}(산업평균 ${cashrAvg}%)는 현금성 자산의 단기 부채 커버율을 나타냅니다.`
          : '유동성 분석에 필요한 유동자산 또는 유동부채 데이터가 입력되지 않았습니다.',
        diag: crOk
          ? '현재 유동자산이 유동부채를 충분히 커버하고 있어 운전자본 관리가 적절히 이루어지고 있습니다. 다만 유동비율이 과도하게 높을 경우 재고 과잉 또는 현금 운용 비효율이 발생할 수 있으므로 적정 수준 유지가 중요합니다.'
          : `유동부채 대비 유동자산이 부족하여 단기 자금 부족 리스크가 존재합니다. 매출채권 회수 지연 또는 재고 과잉 보유가 유동성 저하의 원인일 수 있으며, 운전자본 관리 체계의 전반적인 점검이 필요합니다.`,
        rx: crOk
          ? '현 수준의 유동성을 유지하되, 매출채권 조기 회수와 불필요한 재고 최소화로 현금전환주기(CCC)를 단축하는 것을 권장합니다. 단기 차입금 의존도를 점진적으로 낮추어 유동성 리스크를 사전 차단하시기 바랍니다.'
          : '① 단기 유동성 보강: 매출채권 조기 회수 촉진(팩토링·조기결제 할인 활용) ② 비필수 재고 처분 및 재고 회전율 개선 ③ 단기 차입금을 장기로 전환하여 유동부채 감축 ④ 현금흐름 기반의 주간·월간 예산 관리체계 도입을 권고합니다.'
      };
    }

    if (areaKey === 'safety') {
      const dr = r.safety.부채비율, er = r.safety.자기자본비율, icr = r.safety.이자보상비율;
      const drAvg = ba.부채비율, erAvg = ba.자기자본비율, icrAvg = ba.이자보상비율;
      const drOk = dr !== null && dr <= drAvg;
      return {
        eval: dr !== null
          ? `${co}의 부채비율은 ${dr}%로 산업평균 ${drAvg}%보다 ${drOk ? '낮아 재무구조가 안정적입니다' : '높아 레버리지 부담이 상대적으로 큰 상황입니다'}. 자기자본비율은 ${er !== null ? er+'%' : '—'}(산업평균 ${erAvg}%)로 ${er !== null && er >= erAvg ? '적정 수준의 자본 기반을 갖추고 있습니다' : '자기자본 확충이 필요한 수준입니다'}. 이자보상비율은 ${icr !== null ? icr+'%' : '—'}(산업평균 ${icrAvg}%)로 ${icr !== null && icr >= 100 ? '영업이익으로 이자비용을 충분히 감당할 수 있습니다' : '영업이익이 이자비용을 충당하지 못하는 수준으로 재무적 위험이 존재합니다'}.`
          : '안전성 분석에 필요한 재무상태표 데이터가 부족합니다.',
        diag: drOk
          ? '전반적인 재무 레버리지 수준이 산업평균 이하로, 외부 충격에 대한 재무적 내성이 확보되어 있습니다. 이자보상비율이 충분한 경우 금리 상승 환경에서도 안정성을 유지할 수 있습니다.'
          : `부채 의존도가 높아 금리 상승 시 이자 부담이 가중될 위험이 있으며, 신용등급 하락과 차입 비용 상승의 악순환 리스크가 있습니다. 자기자본 비중이 낮아 장기적 재무 안전성 확보를 위한 구조 개선이 요구됩니다.`,
        rx: drOk
          ? '현재의 안정적 재무구조를 유지하면서 부채비율 150% 이하·이자보상비율 200% 이상을 관리 목표로 설정하시기 바랍니다. 신규 투자 시 내부 유보 자금 활용을 우선하는 것을 권장합니다.'
          : '① 비핵심 자산 매각 또는 증자를 통한 자기자본 확충 ② 고금리 단기 차입을 저금리 장기 대출로 전환 ③ 정부 정책 금융(신보·기보 보증) 적극 활용 ④ 이익잉여금 축적을 통한 재무구조 단계적 개선을 권고합니다.'
      };
    }

    if (areaKey === 'profitability') {
      const gpm = r.profitability.매출총이익율, opm = r.profitability.매출액영업이익율;
      const roa = r.profitability.총자본순이익율_ROA, roe = r.profitability.자기자본순이익율_ROE;
      const opmAvg = ba.매출액영업이익율, roaAvg = ba.총자본순이익율_ROA;
      const opmOk = opm !== null && opm >= opmAvg;
      return {
        eval: opm !== null
          ? `${co}의 영업이익률은 ${opm}%로 산업평균 ${opmAvg}%를 ${opmOk ? '상회하여 영업 수익성이 양호합니다' : '하회하여 영업 수익성 개선이 필요한 상황입니다'}. 매출총이익율은 ${gpm !== null ? gpm+'%' : '—'}(산업평균 ${ba.매출총이익율}%)이며, ROA는 ${roa !== null ? roa+'%' : '—'}(산업평균 ${roaAvg}%)로 자산 대비 수익 창출 능력이 ${roa !== null && roa >= roaAvg ? '적절합니다' : '개선이 필요합니다'}. ROE는 ${roe !== null ? roe+'%' : '—'}(산업평균 ${ba.자기자본순이익율_ROE}%)입니다.`
          : '수익성 분석에 필요한 손익계산서 데이터가 부족합니다.',
        diag: opmOk
          ? '원가 효율성과 판관비 관리가 적절히 이루어지고 있으며, 영업 단계에서의 수익 창출 능력이 양호합니다. 비영업 손익(이자비용·세금 등)에 의해 순이익률이 영업이익률과 괴리될 경우 재무비용 구조 점검이 필요합니다.'
          : `매출 대비 원가 또는 판관비 부담이 높아 영업 수익성이 저하되고 있습니다. 고정비 대비 매출 규모가 충분치 않거나 수익성 낮은 사업 비중이 높을 가능성이 있으며, 손익분기점(BEP) 재검토가 권장됩니다.`,
        rx: opmOk
          ? '현재의 수익성 우위를 유지하면서 고마진 제품·서비스 비중을 확대하고 판관비 효율화를 지속 추구하시기 바랍니다. ROE 개선을 위한 자기자본 효율 관리도 병행 권장합니다.'
          : '① BEP 재산출 및 제품·프로젝트별 수익성 분석으로 저마진 항목 식별 ② 구매 단가 협상·공정 효율화를 통한 원가 개선 ③ 판관비 합리화(인건비·임차료·마케팅비 단계적 조정) ④ 고마진 신사업 확대를 권고합니다.'
      };
    }

    if (areaKey === 'activity') {
      const atr = r.activity.총자산회전율, recv = r.activity.매출채권회전율;
      const recvDay = r.activity.매출채권회수기간;
      const atrAvg = ba.총자산회전율, recvAvg = ba.매출채권회전율;
      const atrOk = atr !== null && atr >= atrAvg;
      const recvOk = recv !== null && recv >= recvAvg;
      return {
        eval: atr !== null
          ? `${co}의 총자산회전율은 ${atr}회로 산업평균 ${atrAvg}회와 비교해 자산 활용 효율성이 ${atrOk ? '양호합니다' : '다소 낮은 편입니다'}. 매출채권 회전율은 ${recv !== null ? recv+'회' : '—'}(산업평균 ${recvAvg}회)이며, 평균 회수기간은 ${recvDay !== null ? recvDay+'일' : '—'}(산업평균 ${ba.매출채권회수기간}일)로 채권 회수가 ${recvOk ? '비교적 원활히 이루어지고 있습니다' : '지연되어 운전자본 부담이 존재합니다'}.`
          : '활동성 분석에 필요한 데이터가 부족합니다.',
        diag: atrOk && recvOk
          ? '자산 대비 매출 창출 능력과 채권 회수 주기가 산업 수준에서 적절히 관리되고 있습니다. 재고 과잉이나 장기 미수금 발생 여부를 정기적으로 점검하여 현 수준을 유지하는 것이 중요합니다.'
          : `${!recvOk ? '매출채권 회수가 지연되면 운전자본이 채권에 묶여 현금 흐름이 악화될 수 있습니다. ' : ''}${!atrOk ? '총자산 대비 매출 창출 효율이 낮아 자산 과잉 보유 또는 유휴 자산 존재 가능성이 있습니다.' : ''}`,
        rx: atrOk && recvOk
          ? '현재의 자산 활용 효율성을 유지하면서 재고 수준 최적화와 적시 공급망 관리(JIT)를 강화하시기 바랍니다.'
          : '① 매출채권 관리 강화: 거래처별 여신 한도 설정 및 연체채권 조기 회수 체계 구축 ② 팩토링·어음 할인으로 채권의 현금화 가속 ③ 불용 재고 및 유휴 자산 처분으로 자산 효율성 개선 ④ CCC(현금전환주기) 단축 목표 수립 및 모니터링을 권고합니다.'
      };
    }

    if (areaKey === 'growth') {
      const mgr = r.growth.매출액증가율;
      const avg = ba.매출액증가율;
      const mgrOk = mgr !== null && mgr >= avg;
      return {
        eval: mgr !== null
          ? `${co}의 매출액 증가율은 ${mgr}%로 산업평균 ${avg}%를 ${mgrOk ? '상회하여 산업 성장률 이상의 외형 성장을 달성하고 있습니다' : '하회하여 성장세가 산업 평균에 미치지 못하는 상황입니다'}. ${mgrOk ? '시장에서의 경쟁력 유지와 신규 고객 확보가 이루어지고 있음을 시사합니다.' : '시장 점유율 유지 또는 확대를 위한 전략적 대응이 필요한 시점입니다.'}`
          : '성장성 분석을 위해서는 전년도(전기) 매출액 데이터가 필요합니다. 재무 입력 화면의 "전기 매출액" 항목을 입력하시면 성장률을 자동 산출합니다.',
        diag: mgr !== null && !mgrOk
          ? '매출 성장 둔화는 주요 고객 이탈, 신규 경쟁자 진입, 주력 제품·서비스의 성숙기 진입, 또는 시장 전체의 수요 감소 등이 복합적으로 작용했을 가능성이 있습니다. 매출 구성(고객·제품별)을 세분화하여 성장 저해 요인을 파악할 필요가 있습니다.'
          : mgr !== null
          ? '매출이 산업평균 이상으로 성장하고 있으나, 성장 과정에서 수익성과 현금흐름이 동반 개선되는지 모니터링이 필요합니다. 외형 성장에만 치중하면 운전자본 부족(Overtrading 리스크)이 발생할 수 있습니다.'
          : '전기 매출 데이터 미입력으로 성장성 진단이 제한적입니다.',
        rx: mgr !== null && !mgrOk
          ? '① 핵심 고객 이탈 방지를 위한 재계약·로열티 프로그램 강화 ② 신규 고객군·채널 발굴(온라인 마케팅·파트너십) ③ 신규 제품·서비스 라인 개발 또는 기존 라인 고도화 ④ 경쟁사 분석을 통한 차별화 포인트 강화를 권고합니다.'
          : mgr !== null
          ? '성장 모멘텀 유지를 위해 ① 핵심 고객 관계 강화 ② 마케팅 투자 최적화 ③ 규모의 경제 확보를 통한 수익성 동반 개선을 추진하시기 바랍니다.'
          : '전기 매출액을 입력 후 재분석하시면 정확한 성장성 진단과 처방이 가능합니다.'
      };
    }
    return { eval: '—', diag: '—', rx: '—' };
  }

  /* ── 종합의견 문단 ── */
  function _buildFinalOpinion(r, d, sc, score, gradeLbl) {
    const opm = r.profitability.매출액영업이익율;
    const dr  = r.safety.부채비율;
    const cr  = r.liquidity.유동비율;
    return `${d.companyName}의 ${d.year}년도 재무현황을 분석한 결과, 전체 ${sc.total}개 주요 재무비율 항목 중 ${sc.good}개(${score}점)가 산업평균 이상으로 나타나 종합 등급 ${gradeLbl}(Grade ${score >= 70 ? 'A' : score >= 55 ? 'B' : score >= 40 ? 'C' : 'D'})로 평가됩니다. ` +
      (score >= 70
        ? '전반적으로 재무건전성이 양호한 수준으로, 현재의 재무구조를 유지하면서 성장성 강화에 집중하는 전략이 유효합니다. 특히 수익성과 유동성 지표가 산업평균을 상회하고 있어 미래 투자 여력이 확보되어 있습니다.'
        : score >= 55
        ? `일부 취약 지표에 대한 선제적 개선이 필요합니다. ${dr !== null && dr > _bokAvg.부채비율 ? '부채비율이 산업평균을 상회하고 있어 재무구조 안정화가 우선 과제입니다. ' : ''}${opm !== null && opm < _bokAvg.매출액영업이익율 ? '영업이익률 개선을 위한 원가 및 비용 구조 재설계가 필요합니다. ' : ''}균형 잡힌 재무관리를 통해 점진적인 건전성 향상이 가능한 상태입니다.`
        : `복합적인 재무 취약성이 확인되어 즉각적인 구조 개선이 필요합니다. ${cr !== null && cr < _bokAvg.유동비율 ? '단기 유동성 확보가 시급하며, ' : ''}${dr !== null && dr > _bokAvg.부채비율 ? '부채구조 개선과 자기자본 확충이 최우선 과제입니다. ' : ''}수익성 회복과 재무구조 안정화를 동시에 추진해야 하며, 필요시 외부 전문가(경영지도사·회계사)의 진단을 권장합니다.`);
  }

  /* ── 우선순위 개선 권고사항 ── */
  function _buildImprovements(r, d) {
    const items = [];
    const ba = _bokAvg;
    if (r.safety.부채비율 !== null && r.safety.부채비율 > ba.부채비율)
      items.push(`<li><strong>재무구조 개선 (우선순위 高)</strong>: 부채비율이 산업평균(${ba.부채비율}%) 대비 ${+(r.safety.부채비율 - ba.부채비율).toFixed(1)}%p 초과. 비핵심 자산 매각 또는 증자를 통한 자기자본 확충 및 고금리 차입금 상환을 우선 추진하시기 바랍니다.</li>`);
    if (r.profitability.매출액영업이익율 !== null && r.profitability.매출액영업이익율 < ba.매출액영업이익율)
      items.push(`<li><strong>수익성 개선</strong>: 영업이익률이 산업평균(${ba.매출액영업이익율}%)에 미달. 제품·서비스별 손익 분석을 통해 저수익 항목을 정리하고, 고마진 사업 비중 확대 전략을 수립하시기 바랍니다.</li>`);
    if (r.liquidity.유동비율 !== null && r.liquidity.유동비율 < ba.유동비율)
      items.push(`<li><strong>유동성 관리 강화</strong>: 유동비율이 산업평균(${ba.유동비율}%) 미달. 매출채권 조기 회수 체계를 구축하고, 불필요한 재고를 정리하여 운전자본을 최적화하시기 바랍니다.</li>`);
    if (r.activity.매출채권회수기간 !== null && r.activity.매출채권회수기간 > ba.매출채권회수기간)
      items.push(`<li><strong>채권 회수 개선</strong>: 매출채권 회수기간이 산업평균(${ba.매출채권회수기간}일) 초과. 거래처별 여신 한도 설정 및 연체관리 시스템 도입을 권장합니다.</li>`);
    if (r.growth.매출액증가율 !== null && r.growth.매출액증가율 < ba.매출액증가율)
      items.push(`<li><strong>성장 전략 수립</strong>: 매출 성장률이 산업평균(${ba.매출액증가율}%) 미달. 신규 고객 유치 전략 수립 및 기존 고객 업셀링·크로스셀링 강화를 권장합니다.</li>`);
    if (items.length === 0)
      items.push('<li>주요 재무비율이 산업평균 수준 이상으로 유지되고 있습니다. 현재의 재무건전성을 지속 유지하면서 성장 기회를 탐색하시기 바랍니다.</li>');
    return items.join('');
  }

  function _buildSummaryOpinion(r, d) {
    const goodCount = _countEvals(r);
    const totalScore = goodCount.total > 0 ? Math.round(goodCount.good / goodCount.total * 100) : 0;
    const grade = totalScore >= 70 ? '양호' : totalScore >= 50 ? '보통' : '취약';
    const gradeColor = totalScore >= 70 ? '#4ADE80' : totalScore >= 50 ? '#F5C030' : '#F87171';

    return `
    <div class="rpt-summary-box">
      <div class="rpt-summary-score-row">
        <div class="rpt-summary-score-num" style="color:${gradeColor}">${totalScore}점</div>
        <div class="rpt-summary-score-label">재무건전성 종합점수<br><span style="color:${gradeColor};font-weight:700">${grade}</span> (산업평균 대비 ${goodCount.good}/${goodCount.total}개 항목 양호)</div>
      </div>
      <div class="rpt-summary-grid">
        <div class="rpt-summary-item"><span class="rpt-eval-${r.liquidity.유동비율 >= _bokAvg.유동비율 ? 'good' : 'bad'}">●</span> 유동성: ${r.liquidity.유동비율 !== null ? r.liquidity.유동비율+'%' : '—'} (산업평균 ${_bokAvg.유동비율}%)</div>
        <div class="rpt-summary-item"><span class="rpt-eval-${r.safety.부채비율 <= _bokAvg.부채비율 ? 'good' : 'bad'}">●</span> 안전성: 부채비율 ${r.safety.부채비율 !== null ? r.safety.부채비율+'%' : '—'} (산업평균 ${_bokAvg.부채비율}%)</div>
        <div class="rpt-summary-item"><span class="rpt-eval-${r.profitability.매출액영업이익율 >= _bokAvg.매출액영업이익율 ? 'good' : 'bad'}">●</span> 수익성: 영업이익율 ${r.profitability.매출액영업이익율 !== null ? r.profitability.매출액영업이익율+'%' : '—'} (산업평균 ${_bokAvg.매출액영업이익율}%)</div>
        <div class="rpt-summary-item"><span class="rpt-eval-${r.activity.총자산회전율 >= _bokAvg.총자산회전율 ? 'good' : 'bad'}">●</span> 활동성: 총자산회전율 ${r.activity.총자산회전율 !== null ? r.activity.총자산회전율+'회' : '—'} (산업평균 ${_bokAvg.총자산회전율}회)</div>
      </div>
      <div class="rpt-summary-text">
        <strong>□ 종합의견</strong><br>
        ${d.companyName}의 ${d.year}년도 재무현황을 분석한 결과, 전체 ${goodCount.total}개 재무비율 항목 중 ${goodCount.good}개가 산업평균 이상으로 나타났습니다.
        ${totalScore >= 70
          ? '전반적으로 재무건전성이 양호한 수준이며, 현재의 재무구조를 유지하면서 성장성 강화에 집중하는 전략이 유효합니다.'
          : totalScore >= 50
          ? '일부 취약 지표에 대한 선제적 개선이 필요하며, 수익성 및 재무구조 안정화를 우선 과제로 설정할 것을 권고합니다.'
          : '재무 취약성이 복합적으로 나타나고 있어 즉각적인 구조 개선이 필요합니다. 수익성 회복과 부채 구조 조정을 최우선 과제로 추진해야 합니다.'
        }
      </div>
      <div class="rpt-summary-text" style="margin-top:16px">
        <strong>□ 개선안</strong><br>
        1. <u>재무구조 개선</u>: 자기자본비율 제고 및 단기부채 구조 장기화 추진<br>
        2. <u>수익성 복원</u>: 원가 효율화, 고마진 사업 비중 확대, 비용구조 재설계<br>
        3. <u>활동성 강화</u>: 매출채권 조기 회수 체계 구축 및 재고 최적화<br>
        4. <u>성장 로드맵</u>: 핵심역량 기반 신시장 개척 및 매출 다변화 전략 수립
      </div>
    </div>`;
  }

  /* ── 대시보드 → Step2 뒤로가기 ── */
  function backToStep2() {
    App.showFinanceWizard();
    setTimeout(() => {
      _curStep = 2;
      document.getElementById('finWizStep1')?.classList.add('hidden');
      document.getElementById('finWizStep2')?.classList.remove('hidden');
      [1, 2, 3].forEach(i => {
        const el = document.getElementById('finStep' + i);
        if (el) { el.classList.toggle('active', i === 2); el.classList.toggle('done', i < 2); }
      });
      window.scrollTo(0, 0);
    }, 350);
  }

  /* ── PUBLIC API ── */
  /* ── PDF 저장 (재무분석 리포트) ────────────────────────────── */
  function printPdf() {
    if (!document.getElementById('finReportContent')?.innerHTML.trim()) {
      alert('먼저 재무분석 리포트를 생성해주세요.');
      return;
    }
    // 캐시 우회: 표지 넘침 방지 스타일을 JS로 직접 주입 (print.css 캐시 무력화)
    const s = document.createElement('style');
    s.id = '__print_cover_fix__';
    // A4 가용 높이 259mm. box-sizing:border-box로 padding 포함 257mm로 강제
    s.textContent = `@media print {
      .rpt-cover {
        border: none !important; border-radius: 0 !important;
        padding: 0 !important; margin: 0 !important;
        background: #ffffff !important; overflow: hidden !important;
        height: 257mm !important; max-height: 257mm !important;
        break-after: page !important; page-break-after: always !important;
        box-sizing: border-box !important;
      }
      .rpt-cover-inner {
        box-sizing: border-box !important;
        height: 257mm !important; min-height: 0 !important; max-height: 257mm !important;
        padding: 10mm 20mm !important; overflow: hidden !important;
        background: #ffffff !important; display: flex !important;
        flex-direction: column !important; align-items: center !important;
        justify-content: center !important;
      }
    }`;
    document.head.appendChild(s);
    const el = document.getElementById('finance-report');
    el.classList.add('print-target');
    window.print();
    el.classList.remove('print-target');
    document.getElementById('__print_cover_fix__')?.remove();
  }

  return {
    goStep, nextStep, switchInputMode, onCompanyInput, lookupDart, analyze,
    searchIndustryCode, selectIndustryCode, selectDirectCode, renderReport, backToStep2, printPdf
  };
})();
