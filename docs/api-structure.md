# API 구조 문서

## 기본 정보

- 기본 URL: `/api`
- 응답 형식: `application/json`

## 현재 구현된 API 골격

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

## 다음 단계 구현 예정 항목

- Spring Security와 JWT 기반 실제 인증 인가 적용
- 현재 임시 사용자 판별 로직 제거
- DB 기반 의사결정 기록 및 상호작용 기록 정식 반영
- Python AI 파이프라인과 분석 결과 연동

## 참고 사항

- Security와 JWT 검증은 아직 구현되지 않았습니다.
- 현재 인증 엔드포인트는 API 연동 테스트용 임시 토큰을 반환합니다.
- AI 분석 엔드포인트는 Python AI 파이프라인 연결 전까지 스텁 분석 결과를 반환합니다.
- 일부 도메인 서비스는 MVP 골격 구현 단계이므로 인메모리 또는 단순 CRUD 형태로 동작합니다.
