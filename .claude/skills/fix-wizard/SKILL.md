---
name: fix-wizard
description: 위저드 화면 전환·버튼·진단 흐름 버그를 진단·수정한다. "이전" 버튼 클릭 시 빈 화면, 재진입 시 Step1 미표시, BM 확인 후 빈 화면, validate 오류로 진행 안 됨, consultingType이 AI 분석에 반영 안 됨, 정부지원 체크박스 배열 깨짐 등에 사용.
---

# 위저드 흐름 버그 진단·수정

위저드 화면 전환·버튼·진단 흐름에서 반복 발생한 버그 패턴과 수정법.

## 증상별 수정 방법

### "이전" 버튼 클릭 시 빈 화면
- 파일: `js/app.js` `backToStep1()`
- 원인: `Wizard.goStep(1)` 호출 → Step1 UI 표시 안 됨
- 수정: `Wizard.reset()` 으로 교체

### 재진입 시 Step1 미표시
- 파일: `js/app.js` `startWizard()`
- 원인: `Wizard.reset()` 미호출
- 수정: `startWizard()` 안에 `Wizard.reset()` 추가

### BM 확인 후 빈 화면
- 파일: `js/app.js` `confirmBm()`
- 원인: 일반 goStep 호출로 빈 화면 표시
- 수정: `Wizard.goToStep2FromBm()` 전용 함수로 교체

### validate 오류 (진행 안 됨)
- 파일: `js/app.js` `runAnalysis()`
- 원인: `validate(3)` → Step3 없는 새 흐름에서 항상 실패
- 수정: `validate(4)` 로 변경

### Step4 "이전" 버튼이 엉뚱한 화면으로 이동
- 파일: `js/wizard.js` Step4 이전 버튼 핸들러
- 원인: `App.goStep(3)` → Step3 없음
- 수정: `App.goStep(2)` 로 변경

### consultingType이 AI 분석에 반영 안 됨
- 파일: `js/app.js` `runAnalysis()`
- 원인: `showDiagReveal()` 이후에 consultingType 계산 → AI 호출 시 항상 '미확인'
- 수정: `Wizard.collect()` 직후, AI 호출 **전**에 아래 코드 삽입
  ```js
  const _domScores = Wizard.calcDomainScores(data.diagScores || {}, data.isStartup);
  const _ctResult  = Wizard.classifyConsultingType(_domScores);
  data.consultingType          = _ctResult?.primary   || '';
  data.consultingTypeSecondary = _ctResult?.secondary || '';
  data.domainScores            = _domScores;
  ```

### 정부지원 체크박스 가로 배열 깨짐
- 파일: `css/style.css`
- 원인: `.form-group label { display:block }` 과 충돌
- 수정: `.gov-check-group .gov-check-item { display:flex !important }` 추가

## 진단 순서

버그 발생 시:
1. 어느 버튼·화면에서 발생하는지 확인
2. 위 목록에서 증상 찾기
3. 해당 파일 해당 함수 직접 수정
4. 코드 품질 검증 (qa 커맨드로 js/app.js·js/wizard.js 검증)
