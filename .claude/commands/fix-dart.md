# /fix-dart — DART·재무분석 오류 진단·수정

DART 조회, 재무분석 화면, XBRL 파싱에서 반복 발생한 버그 패턴.

---

## 증상별 수정 방법

### DART 기업 검색 실패 (회사명 입력해도 못 찾음)
- 파일: `api/dart-lookup.js`
- 원인: `corp-list.json` 파일이 최신 기업 목록을 반영 안 함
- 수정:
```powershell
$env:DART_API_KEY="fe33283e3bacd8d0bc0e060b9e224ddce18ac10d"
node scripts/build-corp-list.js
git add api/corp-list.json
git commit -m "fix: corp-list.json 최신화"
git push origin main
```

---

### XBRL 전체 null — 분기보고서 year 불일치
- 파일: `api/dart-lookup.js` `_supplementWithXbrl()`
- 증상: Vercel 로그에 `[XBRL] 파싱 결과: {"cash":null,...}` 전부 null
- 원인 A: 분기보고서(11013/11012/11014) 조회 시 `_supplementWithXbrl`이 항상 `사업보고서` rcept_no를 사용
  → `fnlttXbrl.xml` URL에 연간 rcept_no + 분기 reprtCode 조합 → XBRL 파일은 2025년도인데 `_parseXbrl(xml, 2026)` 으로 호출 → 전부 null
- 원인 B: 위 fallback 발생 시에도 XBRL 파일명(`entity_2025-12-31.xbrl`)에서 실제 연도를 추출하지 않음
- 수정 A — `_supplementWithXbrl` 분기 파일 탐색:
```js
const REPRT_KEYWORD = { '11011': '사업보고서', '11012': '반기보고서', '11013': '분기보고서', '11014': '분기보고서' };
const keyword = REPRT_KEYWORD[reprtCode] || '사업보고서';
const isAnnual = reprtCode === '11011';
let filing;
if (isAnnual) {
  filing = listData.list.find(f => f.report_nm?.includes(keyword) && f.rcept_dt?.startsWith(nextYear)) || ...;
} else {
  filing =
    listData.list.find(f => f.report_nm?.includes(keyword) && f.rcept_dt?.startsWith(yearStr)) ||
    listData.list.find(f => f.report_nm?.includes(keyword)) ||
    listData.list.find(f => f.report_nm?.includes('사업보고서')); // fallback
}
```
- 수정 B — XBRL 파일명에서 연도 추출:
```js
// xbrlEntry 선택 후
const fnYearMatch = xbrlEntry.entryName.match(/(\d{4})-\d{2}-\d{2}/);
const xbrlYear = fnYearMatch ? parseInt(fnYearMatch[1]) : year;
if (xbrlYear !== year) console.log('[XBRL] 연도 보정:', year, '→', xbrlYear);
const xbrl = _parseXbrl(xml, xbrlYear); // year 대신 xbrlYear 사용
```

---

### XBRL 재무 데이터 추출 실패 (현금·재고 null) — 계정명 미매칭
- 파일: `api/dart-lookup.js` `_parseXbrl()`
- 원인: K-GAAP/IFRS 계정명 후보 부족
- 수정: `_parseXbrl()` result 객체 계정명 후보 추가
```js
cash:           getVal('CashAndCashEquivalents', 'Cash', 'CashAndBankDeposits',
                       'ShortTermFinancialInstruments', 'CurrentFinancialAssets', ...),
inventory:      getVal('Inventories', 'FinishedGoods', 'Merchandise', 'GoodsAndProducts', ...),
borrowings:     getVal('Borrowings', 'BorrowingsFromFinancialInstitutions', 'LongTermBorrowings',
                       'ShortTermBorrowings', ...),
costOfSales:    getVal('CostOfSales', 'CostOfGoodsSold', 'CostOfRevenues', 'CostOfRevenue', ...),
```

---

### XBRL contextRef 분기보고서 매칭 원리
- 파일: `api/dart-lookup.js` `_parseXbrl()`
- 패턴: `const patterns = [cfyPat, cfyPat2, String(year), String(year + 1)]`
  - IFRS 연간: `CFY2024` → cfyPat 매칭
  - K-GAAP 연간: `D20240101T20241231` → `String(year)='2024'` 매칭
  - 분기: `D20240101T20240331` → `String(year)='2024'` 매칭 ✓
- 분기보고서 contextRef는 `String(year)` 패턴으로 이미 커버됨
- 연도 불일치가 발생하면 파일명 기준 연도 보정(위 참조)이 핵심

---

### 당좌자산 N/A (IFRS 대기업)
- 파일: `api/dart-lookup.js`
- 원인: IFRS 기업은 당좌자산을 별도 항목으로 공시 안 함 (K-GAAP 개념)
- 수정: result 초기 build 직후 파생 계산 추가
```js
// 당좌자산 파생: 유동자산 - 재고자산
if (!result.quickAssets && result.currentAssets && result.inventory) {
  const ca  = parseInt(result.currentAssets.raw.replace(/,/g, ''));
  const inv = parseInt(result.inventory.raw.replace(/,/g, ''));
  if (!isNaN(ca) && !isNaN(inv) && ca > inv) {
    const qa = ca - inv;
    result.quickAssets = { raw: qa.toLocaleString('ko-KR'), eok: Math.round(qa / 100000000) };
  }
}
```

---

### 전년도 매출액 자동입력 안 됨 (성장률 계산 불가)
- 파일: `api/dart-lookup.js` + `js/finance-wizard.js`
- 원인: `get()` 함수가 `thstrm_amount`(당기) 우선 → 전기값 누락. `_setField` 연결도 없음
- 수정 A — dart-lookup.js에 `getPrev()` + `prevRevenue` 추가:
```js
const getPrev = (...names) => {
  for (const nm of names) {
    const norm = nm.replace(/\s/g, '');
    const found = items.find(i => i.account_nm?.replace(/\s/g, '').includes(norm));
    if (found) {
      const val = found.frmtrm_amount || found.frmtrm_add_amount;
      if (val && val !== '0') return val;
    }
  }
  return null;
};
// result 객체에 추가:
prevRevenue: r(getPrev('매출액', '영업수익', '수익(매출액)', '매출', ...)),
```
- 수정 B — finance-wizard.js `_setField` 블록에 추가:
```js
_setField('fin_prev_revenue', f(d.prevRevenue));
```

---

### 인건비 N/A (IFRS 대기업)
- 원인: IFRS 기능별 표시 기업은 손익계산서에 인건비 단독 항목 없음 (주석에만 기재)
- `fnlttSinglAcnt` + XBRL 모두 N/A → 구조적 한계, 수동 입력 필요
- K-GAAP 중소기업은 `get('인건비', '급여', '종업원급여', ...)` 로 정상 추출됨

---

### XBRL 재무 데이터 추출 실패 (정규식 버그) — 레거시
- 파일: `api/dart-lookup.js` `_parseXbrl()`
- 원인: `new RegExp('[\\w-]*')` → `[\w-]*` 백슬래시 손실로 네임스페이스 prefix 매칭 실패
- 수정: `new RegExp()` 사용 부분을 `indexOf()` 기반 문자열 탐색으로 완전 교체 (현재 코드에 적용 완료)

---

### Step2 직접입력 필드가 비활성처럼 보임 (흰색 배경)
- 파일: `css/style.css`
- 원인: `.fin-input-item input`이 `.form-group` 밖에 있어 다크테마 CSS 미적용
- 수정: `style.css`에 아래 추가
```css
.fin-input-item input,
.fin-input-item select {
  background: rgba(22,32,64,0.8);
  color: #E8EDF5;
  border: 1px solid rgba(245,192,48,0.3);
}
```

---

### DART 조회 실패 후 수동입력 안 됨
- 파일: `js/finance-wizard.js` `nextStep()` else 분기
- 수정: else 분기에 `_inputMode = 'manual'` 추가

---

## DART 조회 상태 메시지 기준

| 상태 | 메시지 |
|------|--------|
| `no_financial` | DART 등록됐으나 재무제표 없음 → 직접 입력 |
| `not_found` | DART 미등록 → 직접 입력 |
| `error` | 조회 실패 → 직접 입력 |

## Vercel 로그 디버깅 순서

1. vercel.com → biznavi → Logs 탭
2. `/api/dart-lookup` 요청 클릭
3. `[DART]` 로그: 년도·계정수·계정명 확인
4. `[XBRL]` 로그: rcept_no·ZIP 크기·파싱 결과 확인
5. 파싱 결과 전부 null → 연도 불일치 의심 → 파일명 기준 연도 보정 적용
