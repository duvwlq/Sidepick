# Frontend API Integration Guide

## 1. 현재 연결된 화면

현재 프론트에서 실제 API에 연결된 화면은 아래와 같습니다.

- 홈 `/`
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/experiences`
- 경험 등록 `/create`
  - `GET /api/categories`
  - `POST /api/experiences`
- 경험 상세 `/experiences/:id`
  - `GET /api/experiences/{id}`
  - `PATCH /api/experiences/{id}`
  - `DELETE /api/experiences/{id}`
  - `GET /api/users/me`
- AI 분석 결과 `/analysis-result?experienceId={id}`
  - `GET /api/experiences/{id}/analysis`
  - `POST /api/experiences/{id}/analysis`
  - `GET /api/analysis/{analysisId}/matched-cases`
- 마이페이지 `/mypage`
  - `GET /api/users/me`

## 2. 공통 설정

- 백엔드 base URL
  - `http://localhost:8081/api`
- 기본 환경변수
  - `VITE_API_BASE_URL=http://localhost:8081/api`
- 인증 헤더
  - `Authorization: Bearer <accessToken>`
- 세션 저장 위치
  - `localStorage`
  - key: `sidepick.accessToken`
  - key: `sidepick.user`

## 3. 공통 응답 형식

모든 응답은 아래 구조를 기준으로 처리합니다.

```json
{
  "success": true,
  "message": "요청이 성공했습니다.",
  "data": {}
}
```

실패 응답도 같은 껍데기를 사용합니다.

```json
{
  "success": false,
  "message": "Authentication failed.",
  "data": {
    "code": "UNAUTHORIZED",
    "detail": "Full authentication is required to access this resource"
  }
}
```

프론트에서는 `data.detail`이 있으면 그 값을 우선 노출하면 됩니다.

## 4. 현재 타입 정의 위치

- API 함수/타입: [fe/src/lib/api.ts](D:/Codex_Folder/Sidepick/fe/src/lib/api.ts)
- 세션 저장: [fe/src/lib/session.ts](D:/Codex_Folder/Sidepick/fe/src/lib/session.ts)

## 5. 이미 연결된 API 상세

### 인증

#### 회원가입

- `POST /auth/register`

요청:

```json
{
  "email": "demo1@sidepick.dev",
  "password": "password123",
  "nickname": "demo1",
  "ageGroup": "20s"
}
```

응답 핵심:

```json
{
  "data": {
    "user": {
      "id": 1,
      "email": "demo1@sidepick.dev",
      "nickname": "demo1",
      "ageGroup": "20s"
    },
    "tokenType": "Bearer",
    "accessToken": "...",
    "refreshToken": "...",
    "accessTokenExpiresIn": 3600
  }
}
```

#### 로그인

- `POST /auth/login`

요청:

```json
{
  "email": "demo1@sidepick.dev",
  "password": "password123"
}
```

동작:

- 로그인 성공 시 `accessToken`과 `user`를 저장
- 현재 프론트는 `refreshToken`을 저장하거나 재발급에 사용하지 않음

### 카테고리

#### 목록 조회

- `GET /categories`

응답:

```json
[
  {
    "id": 1,
    "name": "온라인사업",
    "description": "쇼핑몰, 블로그, 유튜브 등 온라인 기반 분야",
    "icon": "📦",
    "color": "#3B82F6"
  }
]
```

현재 연결 위치:

- [fe/src/pages/Create.tsx](D:/Codex_Folder/Sidepick/fe/src/pages/Create.tsx)
- [fe/src/components/experience-write/StepBasicInfo.tsx](D:/Codex_Folder/Sidepick/fe/src/components/experience-write/StepBasicInfo.tsx)

### 경험담

#### 목록 조회

- `GET /experiences`

응답 핵심:

```json
{
  "experiences": [
    {
      "id": 1,
      "title": "온라인사업 실패 경험",
      "content": "....",
      "category": {
        "id": 1,
        "name": "온라인사업"
      }
    }
  ],
  "pagination": {
    "page": 0,
    "size": 20,
    "totalElements": 1,
    "totalPages": 1,
    "hasNext": false
  }
}
```

#### 생성

- `POST /experiences`
- 인증 필요

요청:

```json
{
  "title": "온라인사업 실패 경험",
  "content": "실패 경험 본문",
  "categoryId": 1,
  "businessType": "온라인사업",
  "investmentAmount": 500000,
  "durationMonths": 3,
  "failureReason": "시장 조사 부족",
  "targetMarket": "예",
  "marketingChannels": ["고객 확보", "시간 관리"],
  "lessonsLearned": "초기 검증이 중요했다.",
  "wouldRetry": true
}
```

#### 상세 조회

- `GET /experiences/{id}`

#### 수정

- `PATCH /experiences/{id}`
- 인증 필요
- 작성자 본인만 가능

#### 삭제

- `DELETE /experiences/{id}`
- 인증 필요
- 작성자 본인만 가능

### 사용자

#### 내 정보 조회

- `GET /users/me`
- 인증 필요

응답:

```json
{
  "user": {
    "id": 1,
    "email": "demo1@sidepick.dev",
    "nickname": "demo1",
    "ageGroup": "20s"
  }
}
```

### AI 분석

#### 분석 조회

- `GET /experiences/{experienceId}/analysis`

응답:

```json
{
  "id": 1,
  "experienceId": 3,
  "extractedPatterns": ["시장 조사 부족", "초기 검증 미흡"],
  "riskFactors": ["위험 요인: 시장 조사 부족"],
  "successFactors": ["배운 점 기반 재시도 가능"],
  "structuredSummary": "요약 문자열",
  "confidenceScore": 0.82,
  "processedAt": "2026-04-12T11:30:00"
}
```

#### 분석 생성

- `POST /experiences/{experienceId}/analysis`
- 인증 필요
- 현재 프론트는 `GET` 결과가 404이고 토큰이 있으면 `POST`로 자동 생성 시도

#### 유사 사례 조회

- `GET /analysis/{analysisId}/matched-cases`
- 인증 필요

응답:

```json
[
  {
    "id": 1,
    "caseId": "CASE-001",
    "caseTitle": "유사 사례 제목",
    "caseSummary": "유사 사례 요약",
    "keyLesson": "핵심 교훈",
    "matchRate": 78,
    "createdAt": "2026-04-12T11:31:00"
  }
]
```

## 6. 아직 화면이 없는 API

아래 API는 백엔드 엔드포인트는 있지만, 현재 프론트에 대응 화면이 없습니다.

### 댓글 API

- `POST /api/experiences/{experienceId}/comments`
- `POST /api/comments/{commentId}/replies`
- `PATCH /api/comments/{commentId}`
- `DELETE /api/comments/{commentId}`

요청 body:

```json
{
  "content": "댓글 내용",
  "parentId": null
}
```

응답 핵심:

```json
{
  "id": 1,
  "experienceId": 3,
  "parentId": null,
  "author": {
    "id": 1,
    "nickname": "demo1"
  },
  "content": "댓글 내용",
  "isDeleted": false,
  "createdAt": "2026-04-12T12:00:00",
  "updatedAt": "2026-04-12T12:00:00"
}
```

추천 화면 위치:

- 경험담 상세 페이지 하단 댓글 섹션
- 답글은 1단 깊이까지만 먼저 구현 권장

### 결정 API

- `POST /api/decisions`
- 인증 필요

요청:

```json
{
  "viewedExperiences": [1, 2, 3],
  "comparedExperiences": [2, 3],
  "decisionType": "retry",
  "decisionReason": "시장 검증 후 재도전",
  "confidenceLevel": 7,
  "timeSpentMinutes": 20
}
```

응답:

```json
{
  "id": 1,
  "userId": 1,
  "viewedExperiences": [1, 2, 3],
  "comparedExperiences": [2, 3],
  "decisionType": "retry",
  "decisionReason": "시장 검증 후 재도전",
  "confidenceLevel": 7,
  "timeSpentMinutes": 20,
  "completedAt": "2026-04-12T12:10:00"
}
```

추천 화면 위치:

- AI 분석 결과 페이지 하단
- "이 경험을 보고 내릴 결정" 폼으로 붙이는 방식이 가장 자연스럽습니다.

## 7. 프론트 작업 시 주의사항

- 현재 `refreshToken` 재발급 흐름은 프론트에 붙이지 않았습니다.
- 토큰 만료 시에는 일단 에러 메시지를 보여주고 다시 로그인시키는 방식이 안전합니다.
- 댓글/결정 화면을 새로 만들 때는 우선 MVP 기준으로 단순 폼부터 붙이는 편이 좋습니다.
- `Explore` 페이지는 아직 실제 API와 연결된 기능이 없습니다.

## 8. 바로 이어서 작업할 추천 순서

1. 경험담 상세 하단 댓글 UI 추가
2. AI 분석 결과 페이지 하단 결정 저장 UI 추가
3. 토큰 만료 시 공통 에러 처리 추가
