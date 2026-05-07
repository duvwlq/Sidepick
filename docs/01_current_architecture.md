# 01. Current Architecture

## High Level

- Frontend: React + TypeScript + Vite
- Backend: Spring Boot
- AI Server: FastAPI 별도 서버
- Database: MySQL / RDS
- Deployment: AWS Amplify + EC2 + Nginx + Docker Compose

## Current Runtime Shape

### Frontend

- `fe/`
- 브라우저에서 사용자 화면과 API 호출을 담당

### Backend

- `server/`
- 인증, 경험, 분석, 카테고리 API 제공
- 분석 리포트 endpoint는 현재 `GET /api/reports/{experienceId}`

### AI Server

- `ai/`
- 백엔드가 별도 분석 요청을 보내는 외부 서비스 역할
- 내부 구현 상세는 이 문서보다 [05_ai_integration_contract.md](./05_ai_integration_contract.md)에서 연동 관점으로 설명

### Data / Infra

- DB는 MySQL 계열 기준
- 운영 환경은 EC2 + Nginx + Spring Boot + FastAPI 조합
- 로컬/운영 실행은 Docker Compose 기반 메모가 존재함

## Notes

- 이 문서는 과거 계획이 아니라 현재 저장소 구조 기준으로만 작성합니다.
- `ai/` 내부의 데이터셋/인덱스/실험 자산은 별도 운영 동기화 이슈가 있을 수 있습니다.

## TODO

- 실제 운영 compose 구성과 최신 인프라 다이어그램은 배포 문서 정리 2차에서 보강 필요
