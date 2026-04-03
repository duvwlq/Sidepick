# API 기본 구조 설계서

## 공통

- Base URL: `/api`
- 응답 형식: `application/json`
- 인증: 추후 JWT Bearer Token

## 시스템

- `GET /api/health`: 서버 상태 확인

## 인증/회원

- `POST /api/auth/signup`: 회원가입
- `POST /api/auth/login`: 로그인
- `GET /api/users/me`: 내 정보 조회
- `PATCH /api/users/me`: 내 정보 수정

## 실패 경험

- `POST /api/experiences`: 실패 경험 작성
- `GET /api/experiences`: 실패 경험 목록 조회
- `GET /api/experiences/{experienceId}`: 실패 경험 상세 조회
- `PATCH /api/experiences/{experienceId}`: 실패 경험 수정
- `DELETE /api/experiences/{experienceId}`: 실패 경험 삭제

## AI 분석

- `POST /api/experiences/{experienceId}/analysis`: AI 분석 요청
- `GET /api/experiences/{experienceId}/analysis`: AI 분석 결과 조회
- `GET /api/analysis/{analysisId}/matched-cases`: 유사 실패 사례 조회

## 댓글

- `POST /api/experiences/{experienceId}/comments`: 댓글 작성
- `POST /api/comments/{commentId}/replies`: 대댓글 작성
- `PATCH /api/comments/{commentId}`: 댓글 수정
- `DELETE /api/comments/{commentId}`: 댓글 삭제

