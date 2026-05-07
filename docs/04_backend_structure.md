# 04. Backend Structure

## Main Domains

- `auth`
- `experience`
- `analysis`
- `category`

## Common Response / Error Rules

- `ApiResponse`
- `ErrorCode`
- `GlobalExceptionHandler`
- `SecurityExceptionHandler`

현재 BE는 공통 envelope와 error code 기반 응답을 사용하는 방향입니다.

## Main Service Roles

### ExperienceService

- 경험 생성/수정/조회
- 경험 관련 목록/상세 흐름 처리

### AnalysisService

- 분석 조회/생성 API의 application entry 역할
- 실제 분석 리포트/분석 데이터 조회를 `AIAnalysisService`에 위임

### AIAnalysisService

- 분석 생성
- 분석 결과 조회
- 분석 리포트 구성
- AI 실패 시 fallback 흐름 유지

## Current Report Contract

- endpoint: `GET /api/reports/{experienceId}`
- report DTO 기준 문서는 [02_api_contract.md](./02_api_contract.md)와 `server/ANALYSIS_REPORT_CONTRACT.md`

## Sources

- `server/README.md`
- `server/AUTH_FLOW_MVP.md`
- `server/postman-examples.md`
- `server/ANALYSIS_REPORT_CONTRACT.md`

## TODO

- 세부 패키지 구조 설명은 2차 문서 정리에서 추가
- `auth` 흐름 상세는 현재 `server/AUTH_FLOW_MVP.md` 기준으로 유지
