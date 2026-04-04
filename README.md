# FailForward Backend

부업 실패 경험 구조화 공유 플랫폼의 백엔드 API 서버 저장소입니다.
현재 저장소는 1주차 범위를 기준으로 MySQL, Docker, AWS EC2 환경에 맞춰 정리되어 있습니다.

## 기술 스택

- Java 17
- Spring Boot 3.2.12
- Spring Data JPA
- MySQL 8.4
- Springdoc OpenAPI
- Docker Compose

## 저장소 구조

- `docs/git-flow.md`
- `docs/ec2-setup.md`
- `docs/db-schema.md`
- `docs/api-structure.md`
- `docs/week1-status.md`
- `docs/work-summary.md`
- `infra/docker-compose.yml`
- `infra/mysql/init/001_init.sql`
- `scripts`
- `server`

## 빠른 시작

### 1. 환경 변수 파일 준비

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS / Linux:

```bash
cp .env.example .env
```

### 2. Docker로 실행

Windows PowerShell:

```powershell
.\scripts\dev-up.ps1
```

macOS / Linux:

```bash
./scripts/dev-up.sh
```

또는 Docker Compose를 직접 실행할 수 있습니다.

```bash
docker compose -f infra/docker-compose.yml up -d --build
```

### 3. 로컬 Maven 없이 컴파일

이 저장소에는 Docker 기반 Maven wrapper가 포함되어 있습니다.

Windows PowerShell:

```powershell
.\mvnw.cmd -DskipTests package
```

macOS / Linux / Git Bash:

```bash
chmod +x ./mvnw
./mvnw -DskipTests package
```

### 4. 실행 확인

- 애플리케이션: `http://localhost:8081`
- 헬스 체크: `http://localhost:8081/api/health`
- Swagger UI: `http://localhost:8081/swagger-ui.html`

## EC2 보조 스크립트

- `scripts/ec2-bootstrap.sh`
- `scripts/ec2-deploy.sh`

## 종료

Windows PowerShell:

```powershell
.\scripts\dev-down.ps1
```

macOS / Linux:

```bash
./scripts/dev-down.sh
```

## 팀 작업 규칙

- 기본 작업 브랜치는 `develop`입니다.
- 작업 시작 전 `git pull origin develop`을 실행합니다.
- `.env`는 로컬에서만 생성하고 커밋하지 않습니다.
- 개인 IDE 설정 파일은 커밋하지 않습니다.

## MySQL 사용 기준

- 로컬 개발은 `infra/docker-compose.yml`의 `mysql` 서비스를 사용합니다.
- 초기 스키마 SQL 파일은 `infra/mysql/init/001_init.sql`입니다.
- EC2 배포도 동일한 Docker Compose 파일을 기준으로 진행합니다.
- 현재 1주차 저장소 범위에는 Supabase 연동이 포함되어 있지 않습니다.

## 참고 문서

1. Git 작업 규칙: `docs/git-flow.md`
2. AWS EC2 설정: `docs/ec2-setup.md`
3. DB 스키마 및 SQL: `docs/db-schema.md`, `infra/mysql/init/001_init.sql`
4. API 구조: `docs/api-structure.md`
5. 1주차 진행 현황: `docs/week1-status.md`
6. 작업 요약: `docs/work-summary.md`

## 참고 사항

- 기본 실행 방식은 Docker 기준입니다.
- EC2 배포도 `infra/docker-compose.yml` 기준으로 동작합니다.
- Security와 JWT는 이후 단계에서 구현할 예정이며, 현재 1주차 범위에는 포함되어 있지 않습니다.
