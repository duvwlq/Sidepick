# API 기본 구조 설계서

## 기본 정보

- 기본 URL: `/api`
- 응답 형식: `application/json`

## 현재 구현된 기본 엔드포인트

### 공통

- `GET /api/health`

### 인증

- `POST /api/auth/signup`
- `POST /api/auth/login`

### 사용자

- `GET /api/users/me`
- `PATCH /api/users/me`

### 카테고리

- `GET /api/categories`

### 실패 경험

- `GET /api/experiences`
- `POST /api/experiences`
- `GET /api/experiences/{experienceId}`
- `PATCH /api/experiences/{experienceId}`
- `DELETE /api/experiences/{experienceId}`

### AI 분석

- `GET /api/experiences/{experienceId}/analysis`
- `POST /api/experiences/{experienceId}/analysis`
- `GET /api/analysis/{analysisId}/matched-cases`
- `GET /api/experiences/{experienceId}/similar`
- `POST /api/experiences/compare`

### 의사결정 및 상호작용

- `POST /api/decisions`
- `POST /api/experiences/{experienceId}/interactions`

### 댓글

- `POST /api/experiences/{experienceId}/comments`
- `POST /api/comments/{commentId}/replies`
- `PATCH /api/comments/{commentId}`
- `DELETE /api/comments/{commentId}`

## 참고 사항

- 현재 API는 OpenAPI 초안을 기준으로 백엔드 골격을 구현한 상태입니다.
- 일부 인증 및 AI 관련 로직은 스텁 또는 임시 응답 형태로 남아 있습니다.
- 상세 설명은 기존 문서 `docs/api-structure.md`를 함께 참고하면 됩니다.
