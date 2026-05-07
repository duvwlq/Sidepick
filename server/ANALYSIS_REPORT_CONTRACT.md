# Analysis Report Contract v1

현재 Phase 2 기준에서 분석 리포트 계약의 source of truth는 `server` 구현입니다.

## Endpoint

- `GET /api/reports/{experienceId}`

프론트에서 `VITE_API_BASE_URL=/api`를 사용하면 request path는 아래입니다.

- `/reports/{experienceId}`

아래 경로는 현재 표준 endpoint가 아닙니다.

- `/api/experiences/{id}/report`

## reportStatus

- `READY`: 분석 결과가 존재하고 화면 표시 가능
- `NOT_READY`: 분석 결과가 아직 없거나 생성 중
- `ERROR`: 분석 실패

현재 구현상 `ERROR`는 후속 사용 예정 상태로 보고, FE는 분기만 준비합니다.

## Response Shape

```json
{
  "experienceId": 123,
  "analysisId": 456,
  "reportStatus": "READY",
  "title": "사례 분석 리포트",
  "summary": "초기 검증과 홍보 전략이 부족했던 사례입니다.",
  "extractedPatterns": ["시장 조사 부족"],
  "keywords": ["시장 조사 부족", "마케팅 약함"],
  "failureCategory": "시장 조사 부족",
  "riskLevel": "HIGH",
  "riskFactors": ["고객 검증 부족", "유입 전략 부족"],
  "advice": [
    "타겟 고객 인터뷰를 먼저 진행하세요.",
    "광고비를 쓰기 전에 소규모 테스트를 하세요."
  ],
  "confidenceScore": 0.82,
  "processedAt": "2026-05-07T10:00:00",
  "similarCases": [
    {
      "caseId": "CASE-18",
      "title": "스마트스토어 초기 판매 실패 사례",
      "summary": "상품 등록 후 유입이 거의 없었던 사례입니다.",
      "keyLesson": "광고보다 먼저 고객 수요 검증이 필요했습니다.",
      "matchRate": 82
    }
  ]
}
```

## NOT_READY Example

```json
{
  "experienceId": 123,
  "analysisId": null,
  "reportStatus": "NOT_READY",
  "title": "사례 분석 리포트",
  "summary": null,
  "extractedPatterns": [],
  "keywords": [],
  "failureCategory": null,
  "riskLevel": null,
  "riskFactors": [],
  "advice": [],
  "confidenceScore": null,
  "processedAt": null,
  "similarCases": []
}
```

## ERROR Example

```json
{
  "experienceId": 123,
  "analysisId": null,
  "reportStatus": "ERROR",
  "title": "사례 분석 리포트",
  "summary": null,
  "extractedPatterns": [],
  "keywords": [],
  "failureCategory": null,
  "riskLevel": null,
  "riskFactors": [],
  "advice": [],
  "confidenceScore": null,
  "processedAt": null,
  "similarCases": []
}
```

## FE Mapping Rules

- `advice[]` -> AI 가이드 문구
- `similarCases[].matchRate` -> FE `similarity`
- `similarCases[].summary` / `keyLesson` -> 유사 사례 카드 문구
- `keywords` / `failureCategory` / `riskLevel` / `riskFactors`는 그대로 사용 가능
- `actions`, `similarCases[].tags`, `similarCases[].durationMonths`, `similarCases[].monthlyRevenue`, `structuredSummary`는 현재 표준 응답 필드가 아닙니다.

## Non-Standard Fields

이번 라운드에서 아래 필드는 표준 응답 필드가 아닙니다.

- `actions`
- `similarCases[].tags`
- `similarCases[].durationMonths`
- `similarCases[].monthlyRevenue`
- `structuredSummary`

FE는 위 필드를 실응답처럼 가정하지 말고 optional 또는 숨김 처리합니다.

## Integration Notes

- FE 상세 화면은 `READY`일 때만 분석 결과를 실제 데이터로 렌더합니다.
- `NOT_READY`는 준비중 상태로 표시합니다.
- `ERROR`는 실패 상태로 표시합니다.
- 실제 API 실패, 404, shape mismatch를 mock data로 숨기지 않습니다.
- 작성 완료 후 이동 경로는 `/experiences/{id}`를 기준으로 합니다.
