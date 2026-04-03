# API Structure

## Base

- Base URL: `/api`
- Response format: `application/json`

## Implemented API Skeleton

- `GET /api/health`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/users/me`
- `PATCH /api/users/me`
- `GET /api/categories`
- `GET /api/experiences`
- `POST /api/experiences`
- `GET /api/experiences/{experienceId}`
- `PATCH /api/experiences/{experienceId}`
- `DELETE /api/experiences/{experienceId}`
- `GET /api/experiences/{experienceId}/analysis`
- `POST /api/experiences/{experienceId}/analysis`
- `GET /api/analysis/{analysisId}/matched-cases`
- `GET /api/experiences/{experienceId}/similar`
- `POST /api/experiences/compare`
- `POST /api/decisions`
- `POST /api/experiences/{experienceId}/interactions`
- `POST /api/experiences/{experienceId}/comments`
- `POST /api/comments/{commentId}/replies`
- `PATCH /api/comments/{commentId}`
- `DELETE /api/comments/{commentId}`

## Planned Next API

- Spring Security / JWT 기반 실제 인증 인가
- 현재 사용자 식별 로직 대체
- DB 기반 의사결정 기록 저장
- 상호작용 기록 영속화
- AI Python 파이프라인과 분석 결과 연동

## Notes

- Security and JWT validation are not implemented yet
- Current auth endpoints return placeholder tokens for API integration testing
- AI analysis endpoints return generated stub analysis until the Python AI pipeline is connected
- 일부 엔드포인트는 MVP 단계의 인메모리 또는 단순 CRUD 형태로만 동작
