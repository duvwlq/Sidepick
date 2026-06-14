# Frontend API Integration Guide

## Scope

이 문서는 현재 MVP 기준에서 FE가 따라야 하는 API 연동 규칙을 정리합니다.
특히 사례 상세 화면의 분석 리포트 계약을 현재 BE 구현 기준으로 고정합니다.

## Official Report Contract

- Report endpoint: `GET /api/reports/{experienceId}`
- FE request path:
  - `VITE_API_BASE_URL`이 `/api`를 포함하면 `/reports/{experienceId}`
- 아래 경로는 현재 표준 endpoint가 아닙니다.
  - `/api/experiences/{id}/report`

## reportStatus

- `READY`: 분석 결과 있음
- `NOT_READY`: 분석 없음 또는 생성 중
- `ERROR`: 분석 실패

상세 화면은 `READY`일 때만 실제 분석 결과를 렌더합니다.

## AnalysisReport Response Shape

현재 FE는 아래 BE 응답을 기준으로 타입과 mapper를 맞춥니다.

```json
{
  "experienceId": 123,
  "reportStatus": "READY",
  "summary": "초기 검증과 홍보 전략이 부족했던 사례입니다.",
  "keywords": ["시장 조사 부족", "마케팅 약함"],
  "failureCategory": "시장 조사 부족",
  "riskLevel": "HIGH",
  "advice": [
    "타겟 고객 인터뷰를 먼저 진행하세요.",
    "광고비를 쓰기 전에 소규모 테스트를 하세요."
  ],
  "similarCases": [
    {
      "caseId": 18,
      "title": "스마트스토어 초기 판매 실패 사례",
      "summary": "상품 등록 후 유입이 거의 없었던 사례입니다.",
      "keyLesson": "광고보다 먼저 고객 수요 검증이 필요했습니다.",
      "matchRate": 82
    }
  ],
  "processedAt": "2026-05-07T10:00:00"
}
```

## AnalysisReport Type Guidance

FE `AnalysisReport` 타입은 현재 BE 응답 기준으로 맞춥니다.

- `experienceId`
- `reportStatus`
- `summary`
- `keywords`
- `failureCategory`
- `riskLevel`
- `advice`
- `similarCases[].caseId`
- `similarCases[].title`
- `similarCases[].summary`
- `similarCases[].keyLesson`
- `similarCases[].matchRate`
- `explanation.inputUsed`
- `explanation.matchedPatterns`
- `explanation.similarCasesUsed`
- `processedAt`

아래 필드는 현재 필수 계약이 아니며 후속 확장 후보입니다.

- `actions`
- `similarCases[].tags`
- `similarCases[].durationMonths`
- `similarCases[].monthlyRevenue`
- `structuredSummary`

## Explanation Contract

- `AnalysisReport.explanation` is available when `reportStatus === "READY"`.
- `similarCases[].explanation` is available on both report payloads and matched-case payloads.
- FE should treat explanation as optional for rendering, but the backend contract now includes:
  - `inputUsed.category`
  - `inputUsed.bodyExcerpt`
  - `matchedPatterns[]`
  - `similarCasesUsed[]`
  - `confidenceScore`
  - `debug.source`

## Matched Cases Endpoint

- Endpoint: `GET /api/analysis/{analysisId}/matched-cases`
- This is the current source of truth for detailed similar-case explanation payloads.
- FE should not depend on `/api/experiences/{id}/similar` because that endpoint is not the active backend contract.

## analysisMapper Rules

현재 FE mapper는 아래 규칙을 기준으로 작성합니다.

- `advice[]` -> AI 가이드 카드 ViewModel
- `similarCases[].matchRate` -> FE `similarity`
- `similarCases[].summary` / `keyLesson` -> 유사 사례 카드 문구
- `keywords`, `failureCategory`, `riskLevel` -> 그대로 사용 가능
- `tags`, `durationMonths`, `monthlyRevenue` -> optional / default / hidden 처리

없는 필드를 실응답처럼 가정하면 안 됩니다.

## Mock Fallback Policy

- 실제 `ExperienceDetail` 화면에서는 API 실패나 `NOT_READY`를 mock으로 덮지 않습니다.
- mock 데이터는 개발용 preview에서만 명시적으로 사용합니다.
- 실제 사용자 흐름에서는 아래처럼 분기합니다.
  - `READY`: 실제 결과 렌더
  - `NOT_READY`: 준비중 UI
  - `ERROR`: 실패 UI
  - HTTP 실패 / 404 / shape mismatch: 에러 또는 재시도 UI

## Create Flow

- 작성 완료 후 `/analysis-result` 단독 이동을 표준 흐름으로 보지 않습니다.
- 생성된 `experienceId`로 `/experiences/{id}`로 이동합니다.
- `/analysis-result?experienceId=...`는 legacy redirect로만 유지합니다.

## Related Routes

- `/create`
- `/experiences/:id`
- `/analysis-result`

## Error Handling Notes

- FE는 raw backend message를 그대로 화면에 노출하지 않습니다.
- `errorCode` 기반 사용자 메시지 매핑을 우선 사용합니다.
- 분석 리포트 상태값 `NOT_READY`는 에러가 아니라 상태로 처리합니다.

## Source Of Truth

- [docs/02_api_contract.md](D:/Codex_Folder/Sidepick/docs/02_api_contract.md)
- [server/ANALYSIS_REPORT_CONTRACT.md](D:/Codex_Folder/Sidepick/server/ANALYSIS_REPORT_CONTRACT.md)
