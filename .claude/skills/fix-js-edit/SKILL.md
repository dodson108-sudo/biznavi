---
name: fix-js-edit
description: Edit 툴이 "String not found" 또는 "old_string not found" 오류를 반복하며 JS 파일 수정이 안 될 때 진단·복구한다. 특히 wizard.js·ai-engine.js 같은 대형 파일(2000줄+) 편집이 막힐 때 사용.
---

# JS 파일 편집 반복 실패 진단·복구

이 프로젝트(BizNavi)에서 Edit 툴이 "String not found" / "old_string not found" 오류를 반복하며 JS 파일 수정이 막힐 때 적용한다.

## 증상별 원인과 해결

### ① "old_string not found in file" 반복

**원인 A — 파일을 읽지 않고 편집 시도**
- Edit 툴 규칙: 반드시 Read 후 편집. 세션이 길어지면 이전 Read 결과가 오래돼 내용이 달라짐
- 해결: Read 툴로 해당 파일 다시 읽고 실제 라인 내용 확인 후 재시도

**원인 B — anchor 문자열이 파일 내 실제 내용과 다름**
- 공백(스페이스 vs 탭), 줄바꿈 차이
- 한글 포함 시 인코딩 차이 (UTF-8 BOM 여부)
- 이전 편집 후 내용이 바뀐 상태에서 구버전 문자열 사용
- 해결:
  1. Read 툴로 파일 읽기 (limit/offset으로 해당 함수 근처만 읽어도 됨)
  2. 실제 표시된 라인 텍스트 그대로 복사해서 old_string 작성
  3. 한글이 포함된 경우 반드시 복사 기반으로 작성 (직접 타이핑 금지)

**원인 C — 같은 문자열이 파일 내 여러 곳에 존재**
- Edit 툴은 unique한 문자열이 아니면 실패
- 해결: old_string 앞뒤에 주변 고유 컨텍스트 2~3줄 더 포함

### ② 대형 파일 (wizard.js, ai-engine.js) 편집 실패

- `wizard.js`, `ai-engine.js` 등은 2000줄+이므로 Read 시 전체를 한 번에 읽으면 컨텍스트 낭비
- 해결 패턴:
  1. Grep 툴로 편집 대상 함수명/키워드 검색 → 라인 번호 확인
  2. Read 툴 limit/offset으로 해당 함수 ±50줄만 읽기
  3. 실제 내용 확인 후 Edit 툴 사용
- 예시: `Grep pattern="_calcMicroDomainScores" path="js/wizard.js" output_mode="content"` → 라인 번호 확인 후 `Read offset=N limit=80`으로 함수 전체만 읽기

### ③ 한글 포함 문자열 편집 실패

- 원인: 한글 문자열을 직접 타이핑하면 실제 파일의 인코딩과 미묘하게 다를 수 있음
- 해결: 반드시 Read 결과에서 해당 라인을 그대로 복사해서 old_string에 사용

## 예방 체크리스트

- 파일 편집 전 반드시 Read 한 번
- 같은 세션에서 해당 파일을 이미 편집했다면 → 다시 Read
- 한글 포함 old_string은 Read 결과에서 복사
- wizard.js / ai-engine.js 편집 시 → Grep으로 위치 먼저 확인
- unique하지 않은 문자열은 앞뒤 컨텍스트 2줄 추가 포함

## 주요 대형 파일 편집 시 권장 순서

| 파일 | 크기 | 권장 방법 |
|------|------|-----------|
| `js/wizard.js` | 2000줄+ | Grep → offset Read → Edit |
| `js/ai-engine.js` | 2000줄+ | Grep → offset Read → Edit |
| `js/dashboard.js` | 1000줄+ | Grep → offset Read → Edit |
| `css/print.css` | 500줄+ | 전체 Read 후 Edit |
| `api/claude-analyze-*.js` | 300줄 내외 | 전체 Read 후 Edit |
