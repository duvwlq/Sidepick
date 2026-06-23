# 01. Current Architecture

## High Level

| Layer | Stack | Responsibility |
| --- | --- | --- |
| Frontend | React + TypeScript + Vite | 사용자 화면, 탐색 UX, 인증 진입 |
| Backend | Spring Boot | 인증, 경험/공유 API, 분석 API, 카테고리 API, 사용자 API, 운영 API |
| AI Server | FastAPI | 분석 생성, AI 응답 처리 |
| Database | MySQL | 사용자 / 경험 / 분석 데이터 저장 |
| Infra | Amplify + EC2 + Docker Compose + Nginx + RDS | 운영 배포와 네트워크 진입점 |

---

## Runtime Shape

### Frontend

- 경로: `fe/`
- AWS Amplify에 배포
- 브라우저에서 사용자 인터페이스와 API 호출을 담당

### Backend

- 경로: `server/`
- Spring Boot API 서버
- 인증, 경험, 분석, 카테고리, 사용자, 통계, 운영 관련 요청 처리
- `/uploads/**` 정적 파일 서빙
- 공유용 OG HTML / PNG 다운로드 응답 제공

### AI Server

- 경로: `ai/`
- FastAPI 서버
- 백엔드가 호출하는 별도 분석 레이어

### Infra

- 로컬: `infra/docker-compose.yml`
- 운영: `infra/docker-compose.prod.yml`
- 운영 서버 경로: `/home/ubuntu/sidepick-docker`
- 외부 진입점: Nginx container
- 운영 DB: AWS RDS MySQL

---

## Request Flow

1. 사용자가 Amplify에 배포된 프론트엔드에 접속합니다.
2. 프론트는 Spring Boot API로 요청을 보냅니다.
3. 백엔드는 MySQL(RDS)에 서비스 데이터를 저장합니다.
4. 이미지 업로드나 공유 링크 요청은 백엔드가 직접 정적 URL, OG HTML, PNG 응답으로 처리합니다.
5. 분석이 필요한 경우 FastAPI 서버에 요청을 전달합니다.
6. AI 서버는 분석 결과를 생성합니다.
7. 결과는 다시 백엔드와 프론트로 전달됩니다.

---

## Current Backend Edge Responsibilities

- FE가 직접 AI 서버를 호출하지 않도록 중간 조정
- 프로필 이미지 업로드 후 공개 URL 생성
- 공유 링크용 `share-page` HTML 생성
- 공유 카드용 `share-image` PNG 생성
- 관리자용 요청 지연시간/챗봇 운영 상태 조회 API 제공

---

## Design Notes

### 왜 FE / BE / AI를 분리했는가

- 프론트는 사용자 경험에 집중
- 백엔드는 API 안정성과 데이터 무결성에 집중
- AI 서버는 프롬프트와 분석 생성에 집중

이 분리 덕분에 변경 영향 범위를 줄일 수 있습니다.

### 왜 운영 문서 기준을 명확히 해야 하는가

이 저장소는 로컬 개발 구조와 운영 배포 구조가 모두 존재합니다.
문서는 반드시 현재 운영 경로와 Compose 기준을 따라야 합니다.

---

## Related Docs

- [00_project_overview.md](./00_project_overview.md)
- [02_api_contract.md](./02_api_contract.md)
- [07_deployment.md](./07_deployment.md)
- [../server/README.md](../server/README.md)
