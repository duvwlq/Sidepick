# FailForward Backend

부업 실패 경험 공유 플랫폼 백엔드 API 서버 초기 구성입니다.

## 기술 스택

- Java 17
- Spring Boot 3.2
- Spring Data JPA
- MySQL 8
- Springdoc OpenAPI
- Docker Compose

## 디렉터리 구조

- `docs/git-flow.md`
- `docs/ec2-setup.md`
- `docs/db-schema.md`
- `docs/api-structure.md`
- `infra/docker-compose.yml`
- `infra/mysql/init/001_init.sql`
- `server`

## 로컬 개발 환경 설정

### 1. 환경 변수 준비

```bash
cp .env.example .env
```

Windows PowerShell에서는:

```powershell
Copy-Item .env.example .env
```

### 2. Docker 실행

```bash
docker compose -f infra/docker-compose.yml up --build
```

### 3. 애플리케이션 확인

- App: `http://localhost:8081`
- Health: `http://localhost:8081/api/health`
- Swagger UI: `http://localhost:8081/swagger-ui.html`

## 제출 산출물 연결

1. GitHub 저장소 운영 문서: `docs/git-flow.md`
2. AWS EC2 설정 문서: `docs/ec2-setup.md`
3. DB 스키마 문서 및 SQL: `docs/db-schema.md`, `infra/mysql/init/001_init.sql`
4. API 기본 구조 설계서: `docs/api-structure.md`
5. 환경 설정 문서: 현재 `README.md`

## 주의

- 현재 저장소에는 외부 서비스 계정값이 포함되어 있지 않습니다.
- GitHub 저장소 생성, EC2 생성, MySQL 서버 배포는 문서를 따라 실제로 별도 수행해야 합니다.
