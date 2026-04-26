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
        if (!isNaN(n)) el.value = Math.round(n).toLocaleString('ko-KR');
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

  function _setField(id, val) {
    const el = document.getElementById(id);
    if (!el) return;
    if (val !== null && val !== undefined) {
      // 천단위 콤마 포맷 (음수 포함)
      const n = Math.round(Number(val));
      el.value = isNaN(n) ? '' : n.toLocaleString('ko-KR');
    } else {
      el.value = ''; // 미조회 항목은 빈칸 (0 아님)
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
     재무분석 리포트 생성 (PDF 형식)
  ───────────────────────────────────────────────────────────────── */
  function renderReport() {
    const d = _finData;
    const r = _lastRatios;
    if (!d || !r) { alert('먼저 재무분석을 실행해주세요.'); return; }

    const today = new Date();
    const todayStr = `${today.getFullYear()}년 ${today.getMonth()+1}월 ${today.getDate()}일`;
    const industryName = document.getElementById('finIndustryName')?.value || document.getElementById('finIndustryCode')?.value || '전체업종';

    const wrap = document.getElementById('finReportContent');
    if (!wrap) return;

    /* ── 숫자 포맷 ── */
    const n = (v, unit='') => (v || v===0) ? `${(+v).toLocaleString()}${unit}` : '—';
    const pct = (v) => v !== null && v !== undefined ? `${v}%` : '—';
    const tim = (v) => v !== null && v !== undefined ? `${v}회` : '—';
    const day = (v) => v !== null && v !== undefined ? `${v}일` : '—';

    /* ── 평가 텍스트 생성 ── */
    function evalTag(key, val) {
      const ev = _evalVsAvg(key, val);
      if (!ev.cls) return `<span class="rpt-neutral">—</span>`;
      const txt = ev.cls === 'fin-eval-good' ? '양호' : '불량';
      return `<span class="rpt-eval-${ev.cls === 'fin-eval-good' ? 'good' : 'bad'}">${txt}</span>`;
    }
    function avgStr(key) {
      const avg = _bokAvg[key];
      if (avg === undefined) return '—';
      if (key.includes('회전율')) return `${avg}회`;
      if (key.includes('기간')) return `${avg}일`;
      if (key.includes('1인당')) return `${avg}백만원`;
      return `${avg}%`;
    }
    function valStr(key, val) {
      if (val === null || val === undefined) return '—';
      if (key.includes('회전율')) return `${val}회`;
      if (key.includes('기간')) return `${val}일`;
      if (key.includes('1인당')) return `${(+val).toLocaleString()}백만원`;
      return `${val}%`;
    }

    /* ── 재무비율 행 렌더 ── */
    function ratioRow(label, key, val) {
      return `<tr>
        <td class="rpt-td-label">${label}</td>
        <td class="rpt-td-num">${valStr(key, val)}</td>
        <td class="rpt-td-num">${avgStr(key)}</td>
        <td class="rpt-td-eval">${evalTag(key, val)}</td>
      </tr>`;
    }

    /* ── 분석의견 자동생성 (평가→진단→처방) ── */
    function buildOpinion(areaKey) {
      const opinions = {
        liquidity: _buildLiquidityOpinion(r.liquidity, d),
        safety:    _buildSafetyOpinion(r.safety, d),
        profitability: _buildProfitabilityOpinion(r.profitability, d),
        activity:  _buildActivityOpinion(r.activity, d),
        growth:    _buildGrowthOpinion(r.growth, d),
      };
      return opinions[areaKey] || { eval: '분석 데이터 부족', diag: '—', rx: '—' };
    }

    function opinionBlock(num, title, areaKey) {
      const op = buildOpinion(areaKey);
      return `
      <div class="rpt-opinion-block">
        <div class="rpt-opinion-title">${num}. ${title}</div>
        <div class="rpt-opinion-section">
          <div class="rpt-opinion-label">□ 평가 (현황)</div>
          <div class="rpt-opinion-text">${op.eval}</div>
        </div>
        <div class="rpt-opinion-section">
          <div class="rpt-opinion-label">□ 진단 (원인)</div>
          <div class="rpt-opinion-text">${op.diag}</div>
        </div>
        <div class="rpt-opinion-section">
          <div class="rpt-opinion-label">□ 처방 (대안)</div>
          <div class="rpt-opinion-text">${op.rx}</div>
        </div>
      </div>`;
    }

    wrap.innerHTML = `
    <!-- ══ 표지 ══ -->
    <div class="rpt-cover">
      <div class="rpt-cover-inner">
        <div class="rpt-cover-badge">재무분석 보고서</div>
        <table class="rpt-cover-table">
          <tr><td class="rpt-cover-key">업 체 명</td><td class="rpt-cover-val">${d.companyName}</td></tr>
          <tr><td class="rpt-cover-key">분석연도</td><td class="rpt-cover-val">${d.year}년 기준</td></tr>
          <tr><td class="rpt-cover-key">업    종</td><td class="rpt-cover-val">${industryName}</td></tr>
          <tr><td class="rpt-cover-key">작 성 일</td><td class="rpt-cover-val">${todayStr}</td></tr>
        </table>
        <div class="rpt-cover-note">※ 산업평균 : ${_bokAvgSource}</div>
      </div>
    </div>

    <!-- ══ 재무상태표 ══ -->
    <div class="rpt-page">
      <div class="rpt-page-title">□ 재무상태표 (B/S)</div>
      <p class="rpt-unit">(단위 : 백만원)</p>
      <table class="rpt-bs-table">
        <thead><tr><th colspan="2">과목</th><th>${d.year}년</th></tr></thead>
        <tbody>
          <tr class="rpt-bs-head"><td colspan="3">〈 자 산 〉</td></tr>
          <tr class="rpt-bs-sub"><td>Ⅰ. 유동자산</td><td></td><td>${n(d.current_assets)}</td></tr>
          <tr><td></td><td>(1) 당좌자산</td><td>${n(d.quick_assets)}</td></tr>
          <tr><td></td><td>&nbsp;&nbsp;현금 + 금융상품</td><td>${n(d.cash)}</td></tr>
          <tr><td></td><td>&nbsp;&nbsp;매출채권 + 받을어음</td><td>${n(d.receivable)}</td></tr>
          <tr><td></td><td>(2) 재고자산</td><td>${n(d.inventory)}</td></tr>
          <tr class="rpt-bs-sub"><td>Ⅱ. 비유동자산</td><td></td><td>${n(d.noncurrent_assets || (d.total_assets - d.current_assets))}</td></tr>
          <tr><td></td><td>(1) 유형자산</td><td>${n(d.tangible_assets)}</td></tr>
          <tr class="rpt-bs-total"><td colspan="2">자산총계</td><td>${n(d.total_assets)}</td></tr>
          <tr class="rpt-bs-head"><td colspan="3">〈 부 채 〉</td></tr>
          <tr class="rpt-bs-sub"><td>Ⅰ. 유동부채</td><td></td><td>${n(d.current_liabilities)}</td></tr>
          <tr><td></td><td>&nbsp;&nbsp;매입채무 + 지급어음</td><td>${n(d.payable)}</td></tr>
          <tr class="rpt-bs-sub"><td>Ⅱ. 비유동부채</td><td></td><td>${n(d.noncurrent_liabilities)}</td></tr>
          <tr><td></td><td>&nbsp;&nbsp;차입금 (장·단기)</td><td>${n(d.borrowings)}</td></tr>
          <tr class="rpt-bs-total"><td colspan="2">부채총계</td><td>${n(d.total_liabilities)}</td></tr>
          <tr class="rpt-bs-head"><td colspan="3">〈 자 본 〉</td></tr>
          <tr class="rpt-bs-total"><td colspan="2">자기자본(자본총계)</td><td>${n(d.equity)}</td></tr>
          <tr class="rpt-bs-total rpt-bs-grand"><td colspan="2">부채와 자본 총계</td><td>${n(d.total_assets)}</td></tr>
        </tbody>
      </table>
    </div>

    <!-- ══ 손익계산서 ══ -->
    <div class="rpt-page">
      <div class="rpt-page-title">□ 포괄손익계산서 (I/S)</div>
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

    <!-- ══ 재무비율 분석 ══ -->
    <div class="rpt-page">
      <div class="rpt-page-title">○ 유동성 지표 (indicators concerning liquidity)</div>
      <table class="rpt-ratio-table">
        <thead><tr><th>항목</th><th>당사</th><th>산업평균</th><th>평가</th></tr></thead>
        <tbody>
          ${ratioRow('유동비율', '유동비율', r.liquidity.유동비율)}
          ${ratioRow('당좌비율', '당좌비율', r.liquidity.당좌비율)}
          ${ratioRow('현금비율', '현금비율', r.liquidity.현금비율)}
        </tbody>
      </table>

      <div class="rpt-page-title" style="margin-top:28px">○ 안전성 지표 (indicators concerning stability)</div>
      <table class="rpt-ratio-table">
        <thead><tr><th>항목</th><th>당사</th><th>산업평균</th><th>평가</th></tr></thead>
        <tbody>
          ${ratioRow('부채비율', '부채비율', r.safety.부채비율)}
          ${ratioRow('자기자본비율', '자기자본비율', r.safety.자기자본비율)}
          ${ratioRow('순운전자본비율', '순운전자본비율', r.safety.순운전자본비율)}
          ${ratioRow('차입금의존도', '차입금의존도', r.safety.차입금의존도)}
          ${ratioRow('이자보상비율', '이자보상비율', r.safety.이자보상비율)}
          ${ratioRow('고정비율', '고정비율', r.safety.고정비율)}
          ${ratioRow('고정장기적합율', '고정장기적합율', r.safety.고정장기적합율)}
        </tbody>
      </table>

      <div class="rpt-page-title" style="margin-top:28px">○ 수익성 지표 (indicators concerning profitability)</div>
      <table class="rpt-ratio-table">
        <thead><tr><th>항목</th><th>당사</th><th>산업평균</th><th>평가</th></tr></thead>
        <tbody>
          ${ratioRow('매출총이익율', '매출총이익율', r.profitability.매출총이익율)}
          ${ratioRow('매출액 영업이익율', '매출액영업이익율', r.profitability.매출액영업이익율)}
          ${ratioRow('매출액 순이익율', '매출액순이익율', r.profitability.매출액순이익율)}
          ${ratioRow('총자본 순이익율 (ROA)', '총자본순이익율_ROA', r.profitability.총자본순이익율_ROA)}
          ${ratioRow('자기자본 순이익율 (ROE)', '자기자본순이익율_ROE', r.profitability.자기자본순이익율_ROE)}
        </tbody>
      </table>

      <div class="rpt-page-title" style="margin-top:28px">○ 활동성 지표 (indicators concerning activity)</div>
      <table class="rpt-ratio-table">
        <thead><tr><th>항목</th><th>당사</th><th>산업평균</th><th>평가</th></tr></thead>
        <tbody>
          ${ratioRow('총자산 회전율', '총자산회전율', r.activity.총자산회전율)}
          ${ratioRow('자기자본 회전율', '자기자본회전율', r.activity.자기자본회전율)}
          ${ratioRow('매출채권 회전율', '매출채권회전율', r.activity.매출채권회전율)}
          ${ratioRow('매출채권 회수기간', '매출채권회수기간', r.activity.매출채권회수기간)}
          ${ratioRow('매입채무 회전율', '매입채무회전율', r.activity.매입채무회전율)}
          ${ratioRow('매입채무 지급기간', '매입채무지급기간', r.activity.매입채무지급기간)}
          ${ratioRow('재고자산 회전율', '재고자산회전율', r.activity.재고자산회전율)}
        </tbody>
      </table>

      <div class="rpt-page-title" style="margin-top:28px">○ 성장성 지표 (indicators concerning growth)</div>
      <table class="rpt-ratio-table">
        <thead><tr><th>항목</th><th>당사</th><th>산업평균</th><th>평가</th></tr></thead>
        <tbody>
          ${ratioRow('매출액 증가율', '매출액증가율', r.growth.매출액증가율)}
        </tbody>
      </table>
    </div>

    <!-- ══ 분석의견 ══ -->
    <div class="rpt-page">
      <div class="rpt-page-title rpt-opinion-main-title">분 석 의 견&nbsp;<span style="font-size:0.85rem;font-weight:400">[ 평가 → 진단(원인) → 처방(대안) 順 ]</span></div>
      ${opinionBlock(1, '유동성 분석', 'liquidity')}
      ${opinionBlock(2, '안전성 분석', 'safety')}
      ${opinionBlock(3, '수익성 분석', 'profitability')}
      ${opinionBlock(4, '활동성 분석', 'activity')}
      ${opinionBlock(5, '성장성 분석', 'growth')}
    </div>

    <!-- ══ 종합의견 ══ -->
    <div class="rpt-page">
      <div class="rpt-page-title">6. 종합의견 및 개선안</div>
      ${_buildSummaryOpinion(r, d)}
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
  return {
    goStep, nextStep, switchInputMode, onCompanyInput, lookupDart, analyze,
    searchIndustryCode, selectIndustryCode, selectDirectCode, renderReport, backToStep2
  };
})();
