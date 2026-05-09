# /fix-dart — DART·재무분석 오류 진단·수정

DART 조회, 재무분석 화면, XBRL 파싱에서 반복 발생한 버그 패턴.

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

### XBRL 재무 데이터 추출 실패 (현금·재고 null)
- 파일: `api/dart-lookup.js` `_parseXbrl()`
- 원인: 정규식 백슬래시 손실로 네임스페이스 매칭 실패
- 수정: `new RegExp()` 사용 부분을 `indexOf()` 기반 문자열 탐색으로 교체

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

### DART 조회 실패 후 수동입력 안 됨
- 파일: `js/finance-wizard.js` `nextStep()` else 분기
- 원인: DART 실패 시 `_inputMode` 변경 안 함
- 수정: else 분기에 `_inputMode = 'manual'` 추가

### 재무 대시보드에서 "이전" 버튼이 Step1로 초기화
- 파일: `js/finance-wizard.js`, `js/app.js`
- 원인: 버튼 하나에 두 역할(Step2 복귀 + Step1 초기화) 미분리
- 수정:
  - "← 이전": `FinWizard.backToStep2()` → `App.showFinanceWizard()`
  - "↺ 처음부터": `FinWizard.goStep(1)` 초기화

### finance-wizard "이전" 버튼이 서비스 선택 화면으로 이동
- 파일: `js/finance-wizard.js` Step1 이전 버튼
- 원인: `App.showModeSelect()` 호출
- 수정: `App.showLanding()` 으로 교체

## DART 조회 상태 메시지 기준

| 상태 | 메시지 |
|------|--------|
| `no_financial` | DART 등록됐으나 재무제표 없음 → 직접 입력 |
| `not_found` | DART 미등록 → 직접 입력 |
| `error` | 조회 실패 → 직접 입력 |
