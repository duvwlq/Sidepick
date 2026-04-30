# Postman Examples

## 1. Register

`POST http://localhost:8081/api/auth/register`

```json
{
  "email": "demo@sidepick.com",
  "password": "password123",
  "nickname": "demoUser",
  "ageGroup": "20s"
}
```

## 2. Login

`POST http://localhost:8081/api/auth/login`

```json
{
  "email": "demo@sidepick.com",
  "password": "password123"
}
```

Sample success data:

```json
{
  "success": true,
  "message": "Login succeeded.",
  "data": {
    "user": {
      "id": 1,
      "email": "demo@sidepick.com",
      "nickname": "demoUser",
      "ageGroup": "20s",
      "profileImage": null,
      "createdAt": "2026-04-12T16:00:00"
    },
    "tokenType": "Bearer",
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "accessTokenExpiresIn": 3600
  }
}
```

## 3. Create Experience

`POST http://localhost:8081/api/experiences`

Headers:

- `Authorization: Bearer <accessToken>`
- `Content-Type: application/json`

```json
{
  "title": "Smart store launch failure",
  "content": "I launched too early without validating demand and lost budget on ads.",
  "categoryId": 1,
  "businessType": "Online store",
  "investmentAmount": 800000,
  "durationMonths": 3,
  "weeklyHours": 12,
  "failureReason": "No product-market fit",
  "difficulties": ["광고 효율이 낮았음", "시간 분배가 어려웠음"],
  "difficultyEtc": "콘텐츠 제작 인력이 부족했음",
  "difficultyExtra": "평일 퇴근 후 작업 시간이 부족했음",
  "targetMarket": "Office workers in their 20s",
  "marketingChannels": ["Instagram", "Naver Blog"],
  "lessonsLearned": "Validate demand before scaling ads.",
  "wouldRetry": true
}
```

## 4. List Experiences

`GET http://localhost:8081/api/experiences?page=0&size=20`

## 5. Get Experience Detail

`GET http://localhost:8081/api/experiences/1`

## 6. Update Experience

`PATCH http://localhost:8081/api/experiences/1`

Headers:

- `Authorization: Bearer <accessToken>`

```json
{
  "title": "Smart store launch failure updated",
  "content": "Updated content",
  "categoryId": 1,
  "businessType": "Online store",
  "investmentAmount": 700000,
  "durationMonths": 4,
  "weeklyHours": 8,
  "failureReason": "Weak validation",
  "difficulties": ["고객 반응 파악이 늦었음"],
  "difficultyEtc": "초기 타겟 설정이 모호했음",
  "difficultyExtra": "광고 예산 배분 기준이 없었음",
  "targetMarket": "Office workers in their 20s",
  "marketingChannels": ["Instagram"],
  "lessonsLearned": "Run smaller tests first.",
  "wouldRetry": false
}
```

## 7. Get Report For FE

`GET http://localhost:8081/api/reports/1`

Sample success data when analysis is ready:

```json
{
  "success": true,
  "message": "Report loaded.",
  "data": {
    "experienceId": 1,
    "analysisId": 1,
    "reportStatus": "READY",
    "title": "Smart store launch failure",
    "summary": "시장 검증과 초기 홍보 전략이 부족해 수요 확보에 실패했습니다.",
    "extractedPatterns": ["market research gap", "validation gap"],
    "riskFactors": ["타겟분석실패"],
    "advice": [],
    "confidenceScore": 0.9,
    "processedAt": "2026-04-15T00:00:00",
    "similarCases": [
      {
        "caseId": "CASE-1",
        "title": "Online store similar case",
        "summary": "Validate demand before scaling ads.",
        "keyLesson": "시장 검증과 초기 홍보 전략이 부족해 수요 확보에 실패했습니다.",
        "matchRate": 80
      }
    ]
  }
}
```

Sample success data when analysis is not ready yet:

```json
{
  "success": true,
  "message": "Report loaded.",
  "data": {
    "experienceId": 1,
    "analysisId": null,
    "reportStatus": "NOT_READY",
    "title": "Smart store launch failure",
    "summary": null,
    "extractedPatterns": [],
    "riskFactors": [],
    "advice": [],
    "confidenceScore": null,
    "processedAt": null,
    "similarCases": []
  }
}
```
