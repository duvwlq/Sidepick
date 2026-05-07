# 03. Frontend Structure

## Scope

현재 프론트 구조와 분석 리포트 화면 연결 방식을 설명합니다.

## Main Routes

- `/create`
- `/explore`
- `/experiences/:id`
- `/analysis-result`

## Route Notes

- `/experiences/:id`
  - 현재 사례 상세 + 분석 리포트 통합 화면 기준
- `/analysis-result`
  - legacy redirect 성격
  - `experienceId` query가 있으면 상세 화면으로 연결

## Report Flow

- FE는 사례 상세 흐름에서 `getReport()`로 분석 리포트를 조회합니다.
- 현재 기준 endpoint는 `/reports/{experienceId}`입니다.

## analysisMapper Role

- 현재 BE 응답을 FE ViewModel로 바꾸는 역할
- 특히 아래 변환이 필요합니다.
  - `advice[]` -> 가이드 문구
  - `matchRate` -> similarity
  - `summary`, `keyLesson` -> 유사 사례 카드 문구

## Mock Fallback Policy

- 실제 API 실패 또는 `NOT_READY`를 mock으로 덮으면 안 됩니다.
- mock은 개발/preview 용도로만 명시적으로 사용합니다.
- 실제 상세 화면에서는:
  - `READY`: 결과 렌더
  - `NOT_READY`: 준비중 UI
  - `ERROR` 또는 API 실패: 에러 UI

## Sources

- `fe/src/App.tsx`
- `fe/src/pages/Create.tsx`
- `fe/src/pages/ExperienceDetail.tsx`
- `fe/src/pages/AiAnalysisResultPage.tsx`
- `fe/src/lib/api.ts`

## TODO

- `fe/API_INTEGRATION_GUIDE.md`는 현재 계약 기준으로 후속 최신화 필요
