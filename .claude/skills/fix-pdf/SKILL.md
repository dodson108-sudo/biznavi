---
name: fix-pdf
description: PDF 인쇄·저장 시 발생하는 출력 버그를 진단·수정한다. 표지가 2페이지로 넘침, 표지 텍스트 색상이 인쇄 시 흰색/투명으로 안 나옴, 차트·Canvas가 PDF에 안 보임 등 print.css·인쇄 레이아웃 문제에 사용.
---

# PDF 출력 오류 진단·수정

PDF 인쇄·저장 시 반복 발생한 버그 패턴.

## 증상별 수정 방법

### 표지가 2페이지로 넘침

원인 5가지를 순서대로 체크한다.

**① print.css 캐시** (가장 흔한 원인)
- 파일: `index.html`
- 확인: `<link rel="stylesheet" href="css/print.css">` 버전 파라미터 있는지
- 수정: `href="css/print.css?v=날짜"` 로 변경
- 또는: `js/finance-wizard.js` `printPdf()` 안에 `<style>` 태그 DOM 직접 주입 코드 있는지 확인

**② 높이 수학 버그**
- 파일: `css/print.css` `.rpt-cover`
- 확인: `height + padding×2 > 257mm(A4)` 인지 계산
- 수정: `box-sizing: border-box; height: 257mm;` 적용

**③ style.css 충돌**
- 파일: `css/style.css`
- 확인: `@media print .rpt-cover { background:... }` 잔재 있는지 검색
- 수정: 해당 블록 삭제

**④ 이중 페이지브레이크**
- 파일: `css/print.css`
- 확인: `.rpt-cover { break-after:page }` + `.rpt-page { break-before:page }` 동시 적용 여부
- 수정: `.rpt-cover`의 `break-after:page` → `break-after:avoid` 로 변경

**⑤ inline 스타일로 색상 오버라이드 불가**
- 파일: `js/finance-wizard.js` renderReport()
- 확인: `<div style="color:#F5C030">` 형태의 인라인 스타일 사용 여부
- 수정: `.rpt-cover-logo`, `.rpt-cover-tagline` 등 CSS 클래스로 교체
  `print.css`에 해당 클래스 인쇄용 색상 명시

### 표지 텍스트 색상이 흰색으로 안 나옴 (인쇄 시 투명)
- 파일: `css/print.css`
- 원인: 인라인 스타일은 인쇄 시 오버라이드 불가
- 수정: 모든 색상을 CSS 클래스로 변경 후 print.css에 `!important` 명시

### 차트·그래프가 PDF에 안 나옴
- 원인: Canvas 요소는 print 미지원
- 수정: `@media print { canvas { display:none } }` 추가하거나
  Canvas를 PNG로 변환 후 `<img>`로 삽입

## 진단 순서

1. Ctrl+Shift+R (강제 캐시 새로고침) 후 재테스트
2. 그래도 문제면 위 ①~⑤ 순서로 체크
3. print.css 변경 후 코드 품질 검증 (qa 커맨드 활용)
