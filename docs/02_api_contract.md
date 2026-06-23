# 02. API Contract

## Scope

이 문서는 **프론트엔드와 백엔드 사이의 현재 MVP API 계약**을 요약합니다.
분석 리포트 화면에서 의존하는 핵심 응답 구조를 중심으로 정리합니다.

---

## Base Rule

프론트는 `VITE_API_BASE_URL=/api` 기준으로 동작합니다.
따라서 브라우저 요청 경로는 `/api/...` 기준으로 이해하면 됩니다.

---

## Core Endpoints

| 목적 | Method | Path |
| --- | --- | --- |
| 경험 목록 조회 | `GET` | `/api/experiences` |
| 경험 작성 | `POST` | `/api/experiences` |
| 경험 상세 조회 | `GET` | `/api/experiences/{experienceId}` |
| 경험 공유 payload 조회 | `GET` | `/api/experiences/{experienceId}/share` |
| 경험 공유 OG 페이지 조회 | `GET` | `/api/experiences/{experienceId}/share-page` |
| 경험 공유 이미지 다운로드 | `GET` | `/api/experiences/{experienceId}/share-image` |
| 경험 수정 | `PUT` | `/api/experiences/{experienceId}` |
| 경험 삭제 | `DELETE` | `/api/experiences/{experienceId}` |
| 분석 리포트 조회 | `GET` | `/api/reports/{experienceId}` |
| 분석 조회 | `GET` | `/api/experiences/{experienceId}/analysis` |
| 분석 생성 | `POST` | `/api/experiences/{experienceId}/analysis` |
| 분석 유사 사례 조회 | `GET` | `/api/analysis/{analysisId}/matched-cases` |
| 카테고리 조회 | `GET` | `/api/categories` |
| 내 정보 조회 | `GET` | `/api/users/me` |
| 로그인 | `POST` | `/api/auth/login` |
| 회원가입 | `POST` | `/api/auth/register` or `/api/auth/signup` |
| 카카오 OAuth 로그인 | `POST` | `/api/auth/oauth/kakao` |
| 구글 OAuth 로그인 | `POST` | `/api/auth/oauth/google` |

---

## Analysis Report Contract

### Endpoint

- `GET /api/reports/{experienceId}`

### `reportStatus`

- `READY`: 분석 결과가 존재하고 화면에 즉시 노출 가능
- `NOT_READY`: 분석 결과가 아직 없거나 생성 중
- `ERROR`: 분석 처리 실패

### Status Handling Rule

- `READY`일 때만 `summary`, `keywords`, `failureCategory`, `riskLevel`, `riskFactors`, `similarCases`, `explanation`을 실제 데이터로 사용합니다.
- `NOT_READY`일 때는 `analysisId=null`, `keywords=[]`, `riskFactors=[]`, `similarCases=[]`, `explanation=null`을 기본값으로 처리합니다.
- `ERROR`는 현재 계약상 예약 상태이며, FE는 실패 UI 분기만 유지합니다.

---

## Report Response Shape

```json
{
  "experienceId": 123,
  "analysisId": 456,
  "reportStatus": "READY",
  "title": "실패 분석 리포트",
  "summary": "초기 검증과 홍보 전략이 부족했던 사례입니다.",
  "extractedPatterns": ["시장 조사 부족"],
  "keywords": ["시장 조사 부족", "마케팅 약함"],
  "failureCategory": "시장 조사 부족",
  "riskLevel": "HIGH",
  "riskFactors": ["고객 검증 부족", "유입 전략 부족"],
  "advice": [
    "타겟 고객 인터뷰를 먼저 진행하세요.",
    "광고비를 쓰기 전에 소규모 테스트를 해보세요."
  ],
  "confidenceScore": 0.82,
  "processedAt": "2026-05-07T10:00:00",
  "explanation": {
    "inputUsed": {
      "category": "온라인 판매/이커머스",
      "bodyExcerpt": "초기 시장 검증이 부족했고..."
    },
    "matchedPatterns": ["시장 조사 부족"],
    "similarCasesUsed": ["CASE-18"],
    "isVerified": true,
    "confidenceScore": 0.82,
    "debug": {
      "totalSimilarCases": 1,
      "source": "server-generated"
    }
  },
  "similarCases": [
    {
      "caseId": "CASE-18",
      "title": "스마트스토어 초기 판매 실패 사례",
      "summary": "상품 등록 후 유입이 거의 없었던 사례입니다.",
      "keyLesson": "광고보다 먼저 고객 수요 검증이 필요했습니다.",
      "matchRate": 82,
      "explanation": {
        "similarityScore": 0.82,
        "matchedKeywords": ["시장 조사 부족"],
        "source": "matched-case",
        "caseId": "CASE-18",
        "debug": {
          "source": "server-generated"
        }
      }
    }
  ]
}
```

---

## Frontend Mapping Rules

- `advice[]` → AI 가이드 문구
- `similarCases[].matchRate` → 유사도
- `similarCases[].summary`, `keyLesson` → 유사 사례 카드 설명
- `explanation.inputUsed`, `explanation.matchedPatterns`, `explanation.similarCasesUsed` → 설명 모달/디버그 근거
- `similarCases[].explanation.similarityScore`, `matchedKeywords` → 유사 사례 설명 근거
- `keywords`, `failureCategory`, `riskLevel`, `riskFactors` → 상세 화면 직접 사용

### Not Required in Current FE Contract

아래 필드는 현재 프론트 필수 계약으로 보지 않습니다.

- `actions`
- `similarCases[].tags`
- `similarCases[].durationMonths`
- `similarCases[].monthlyRevenue`
- `structuredSummary`

---

## Matched Cases Contract

### Endpoint

- `GET /api/analysis/{analysisId}/matched-cases`

### Response Shape

```json
[
  {
    "id": 1,
    "caseId": "CASE-18",
    "caseTitle": "스마트스토어 초기 판매 실패 사례",
    "caseSummary": "상품 등록 후 유입이 거의 없었던 사례입니다.",
    "keyLesson": "광고보다 먼저 고객 수요 검증이 필요했습니다.",
    "matchRate": 82,
    "createdAt": "2026-05-07T10:00:00",
    "explanation": {
      "similarityScore": 0.82,
      "matchedKeywords": ["시장 조사 부족"],
      "source": "matched-case",
      "caseId": "CASE-18",
      "debug": {
        "source": "server-generated"
      }
    }
  }
]
```

---

## Experience Share Contract

### Endpoints

- `GET /api/experiences/{experienceId}/share`
- `GET /api/experiences/{experienceId}/share-page`
- `GET /api/experiences/{experienceId}/share-image`

### Share Payload Shape

```json
{
  "experienceId": 123,
  "title": "공유 제목",
  "description": "공유 설명",
  "shareUrl": "https://api.side-pick.app/api/experiences/123/share-page",
  "imageUrl": "https://cdn.example.com/source-image.png",
  "downloadImageUrl": "https://api.side-pick.app/api/experiences/123/share-image",
  "webUrl": "https://side-pick.app/experiences/123",
  "caseStatus": "FAILURE",
  "categoryName": "온라인 판매/이커머스"
}
```

### Share Mapping Rules

- `shareUrl` → 브라우저 공유 / 링크 복사 기본 URL
- `webUrl` → 실제 사용자 상세 진입 URL
- `downloadImageUrl` → 인스타/이미지 저장용 버튼 연결 URL
- `imageUrl` → 원문 경험 본문에 포함된 대표 이미지가 있으면 사용, 없으면 `null`

### Share Page Rules

- `share-page`는 백엔드가 `text/html`로 반환하는 OG/트위터 메타 전용 페이지입니다.
- 외부 미리보기 봇은 `shareUrl`을 읽고, 사람 브라우저는 최종적으로 `webUrl`로 이동합니다.
- `og:image`는 `share-image` 엔드포인트를 가리킵니다.

### Share Image Rules

- `share-image`는 `image/png`를 반환합니다.
- `Content-Disposition: attachment` 기준으로 다운로드 가능한 응답입니다.

---

## Integration Notes

- 프론트는 `READY`일 때만 실제 분석 결과를 노출합니다.
- `NOT_READY`는 준비 중 UI로 분기합니다.
- `ERROR`는 실패 상태 UI로 분기합니다.
- API 실패를 mock 데이터로 숨기지 않고 상태를 분리해 처리합니다.
- 공유 기능은 `shareUrl`과 `webUrl`을 구분해서 사용합니다.

---

## Sources

- [../server/ANALYSIS_REPORT_CONTRACT.md](../server/ANALYSIS_REPORT_CONTRACT.md)
- `server/src/main/java/.../AnalysisController.java`
- `server/src/main/java/.../AnalysisDtos.java`
- `server/src/main/java/.../ExperienceController.java`
