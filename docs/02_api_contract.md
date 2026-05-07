# 02. API Contract

## Scope

이 문서는 현재 MVP 기준 **FE-BE 계약**을 설명합니다.
특히 사례 상세 화면에서 사용하는 분석 리포트 계약을 고정합니다.

## Official Report Endpoint

- `GET /api/reports/{experienceId}`

FE에서 `VITE_API_BASE_URL=/api`를 사용할 때 request path는 아래입니다.

- `/reports/{experienceId}`

## reportStatus

- `READY`: 분석 결과가 존재하고 화면에 표시 가능
- `NOT_READY`: 분석 결과가 없거나 생성 중
- `ERROR`: 분석 실패

## READY Example

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

## Current Standard Fields

- `reportStatus`
- `summary`
- `keywords`
- `failureCategory`
- `riskLevel`
- `advice`
- `similarCases[].summary`
- `similarCases[].keyLesson`
- `similarCases[].matchRate`

## Not in Current Required Contract

아래 필드는 현재 필수 계약으로 보지 않습니다.

- `actions`
- `similarCases[].tags`
- `similarCases[].durationMonths`
- `similarCases[].monthlyRevenue`

위 필드는 후속 확장 후보입니다.

## Notes

- 현재 FE는 `advice`와 `matchRate`를 기준으로 mapper를 구성해야 합니다.
- 상세 화면은 `READY`일 때만 실제 분석 결과를 렌더하고, `NOT_READY`와 `ERROR`는 상태로 분리해야 합니다.

## Sources

- `server/ANALYSIS_REPORT_CONTRACT.md`
- `server/postman-examples.md`
- `server/src/main/java/.../AnalysisController.java`
- `server/src/main/java/.../AnalysisDtos.java`
