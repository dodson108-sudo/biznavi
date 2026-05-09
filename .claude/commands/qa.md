# /qa — 코드 품질 검증

변경된 코드를 qa-reviewer 에이전트로 검증한다.

## 실행

qa-reviewer 에이전트를 호출해서 다음을 검증하라:

검증 대상: $ARGUMENTS (없으면 오늘 변경된 파일 전체)

검증 항목:
1. 🔴 CRITICAL — 보안, 데이터 손실, 빌드 실패
2. 🟡 WARNING — 버그 가능성, 일관성 깨짐
3. 🟢 SUGGESTION — 성능, 가독성

검증 후 발견된 WARNING 이상 항목은 즉시 수정 여부를 학선님께 확인 후 처리한다.

## 사용법

```
/qa                          → 오늘 변경 파일 전체 검증
/qa js/ai-engine.js          → 특정 파일만 검증
/qa api/claude-analyze-1.js  → API 함수 검증
```
