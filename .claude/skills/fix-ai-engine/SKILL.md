---
name: fix-ai-engine
description: js/ai-engine.js의 AI 분석 로직 버그를 진단·수정한다. AI 결과가 업종 무관 일반론으로 나오거나, 2차 호출이 1차 SWOT·전략을 덮어쓰거나, fakeAnalysis가 컨설팅 유형 무관하게 동일하거나, consultingType이 '미확인'으로 나오거나, _SYSTEM_EXEC 페르소나가 어긋날 때 사용.
---

# AI 엔진 로직 버그 진단·수정

`js/ai-engine.js`에서 반복 발생한 버그 패턴과 수정법.

## 증상별 수정 방법

### AI 분석 결과가 업종과 무관한 일반론으로 나옴
- 파일: `js/ai-engine.js` `buildInsightsSummary()`
- 원인: `industryVarMap` 키가 한국어인데 호출 시 영문 industryKey 전달 → 항상 미매칭
- 확인: `industryVarMap` 키가 `'mfg_parts'`, `'food_mfg'` 등 영문인지 확인
- 수정: 한국어 키 → 16개 영문 industryKey로 전면 교체
  ```
  'mfg_parts', 'food_mfg', 'local_service', 'wholesale', 'restaurant',
  'knowledge_it', 'construction', 'medical', 'finance', 'education',
  'fashion', 'media', 'logistics', 'energy', 'agri_food', 'export_sme'
  ```

### 2차 호출 결과가 1차 SWOT·전략을 덮어씌움
- 파일: `js/ai-engine.js` `callClaude()` 병합 부분
- 원인: `Object.assign({}, result1, result2)` → 2차가 1차 핵심 키 덮어씀
- 수정: 1차 전용 키 보호 후 병합
  ```js
  const FIRST_PASS_KEYS = ['executiveSummary','swot','stp','fourP','keyStrategies','specializedAnalysis'];
  const r2Clean = Object.fromEntries(
    Object.entries(result2).filter(([k]) => !FIRST_PASS_KEYS.includes(k))
  );
  return Object.assign({}, result1, r2Clean);
  ```

### fakeAnalysis(샘플 데이터)가 컨설팅 유형 무관하게 동일하게 나옴
- 파일: `js/ai-engine.js` `_fakeByConsultingType()`
- 원인: `if (!ct || ct === 'growth_strategy') return {}` → growth_strategy를 조기 차단
- 수정: 가드를 `if (!ct) return {}` 으로 변경 후 각 유형 블록 추가

### AI 프롬프트에 consultingType이 항상 '미확인'
- 파일: `js/app.js` `runAnalysis()`
- 원인: AI 호출 후에 consultingType 계산
- 수정: `Wizard.collect()` 직후 AI 호출 전에 삽입 (→ fix-wizard 스킬 참고)

### _SYSTEM_EXEC(2차)가 1차와 다른 페르소나로 동작
- 파일: `js/ai-engine.js` `const _SYSTEM_EXEC`
- 원인: 1차 SYSTEM 프롬프트 변경 시 _SYSTEM_EXEC 미동기화
- 확인: _SYSTEM_EXEC 상단 페르소나 문구가 SYSTEM과 일치하는지 확인
- 수정: 두 상수의 페르소나·핵심 지침 동기화

## 구조 요약

```
callClaude()
  ├─ 1차: apiCall(SYSTEM, buildPrompt1())      → /api/claude-analyze-1
  │        SWOT·STP·4P·keyStrategies·specializedAnalysis
  └─ 2차: apiCall(_SYSTEM_EXEC, buildPrompt2()) → /api/claude-analyze-2
           kpi·roadmap·sixSystems·plan90days·leanCanvas

병합: Object.assign({}, result1, r2Clean)  ← 1차 핵심 키 보호
```
