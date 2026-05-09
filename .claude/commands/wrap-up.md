# /wrap-up — 세션 마무리

오늘 작업한 내용을 커밋·push·CLAUDE.md·memory 업데이트까지 한번에 처리한다.

## 실행 순서

1. `git status`로 변경 파일 목록 확인
2. `git diff`로 변경 내용 파악
3. CLAUDE.md 상단 "배포 상태" 날짜·커밋 업데이트
4. CLAUDE.md에 "최근 수정 이력 (오늘 날짜)" 섹션 추가 — 오늘 작업 내용 정리
5. `memory/project_next_tasks.md` 업데이트 — 오늘 완료 항목 + 다음 세션 예정 작업
6. git add · commit · push

## 커밋 메시지 규칙

```
feat:   새 기능 추가
fix:    버그 수정
docs:   CLAUDE.md 등 문서 업데이트
refactor: 코드 개선 (기능 변화 없음)
debug:  디버그 코드 추가/제거
```

## 인수 사용법

`/wrap-up fix: 오늘 수정한 내용 요약`

→ $ARGUMENTS 가 커밋 메시지로 사용됨. 없으면 Claude가 변경 내용 보고 자동 작성.
