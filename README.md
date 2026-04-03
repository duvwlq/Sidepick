# FailForward Backend

Backend API server bootstrap repository for the FailForward project.
This repository follows the week 1 scope based on MySQL and Docker on AWS EC2.

## Stack

- Java 17
- Spring Boot 3.2.12
- Spring Data JPA
- MySQL 8.4
- Springdoc OpenAPI
- Docker Compose

## Repository Layout

- `docs/git-flow.md`
- `docs/ec2-setup.md`
- `docs/db-schema.md`
- `docs/api-structure.md`
- `infra/docker-compose.yml`
- `infra/mysql/init/001_init.sql`
- `scripts`
- `server`

## Quick Start

### 1. Prepare env file

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS / Linux:

```bash
cp .env.example .env
```

### 2. Start with Docker

Windows PowerShell:

```powershell
.\scripts\dev-up.ps1
```

macOS / Linux:

```bash
./scripts/dev-up.sh
```

Or run Docker Compose directly:

```bash
docker compose -f infra/docker-compose.yml up -d --build
```

### 2-1. Compile without local Maven

This repository includes a Docker-based Maven wrapper.

Windows PowerShell:

```powershell
.\mvnw.cmd -DskipTests package
```

macOS / Linux / Git Bash:

```bash
chmod +x ./mvnw
./mvnw -DskipTests package
```

### 3. Verify

- App: `http://localhost:8081`
- Health: `http://localhost:8081/api/health`
- Swagger UI: `http://localhost:8081/swagger-ui.html`

## EC2 Helper Scripts

- `scripts/ec2-bootstrap.sh`
- `scripts/ec2-deploy.sh`

## Stop

Windows PowerShell:

```powershell
.\scripts\dev-down.ps1
```

macOS / Linux:

```bash
./scripts/dev-down.sh
```

## Team Workflow Notes

- Base branch is `develop`.
- Run `git pull origin develop` before starting local work.
- Create `.env` locally and do not commit it.
- Do not commit personal IDE files.

## MySQL Usage Model

- Local development uses the `mysql` service from `infra/docker-compose.yml`.
- The SQL bootstrap file is `infra/mysql/init/001_init.sql`.
- EC2 deployment uses the same Docker Compose file.
- The current week 1 repository does not include Supabase integration.

## Reference Docs

1. Git workflow: `docs/git-flow.md`
2. AWS EC2 setup: `docs/ec2-setup.md`
3. DB schema and SQL: `docs/db-schema.md`, `infra/mysql/init/001_init.sql`
4. API structure: `docs/api-structure.md`
5. Week 1 delivery status: `docs/week1-status.md`
6. Work summary: `docs/work-summary.md`

## Notes

- The repository is ready to run with Docker as the default workflow.
- EC2 deployment also uses `infra/docker-compose.yml`.
- Security and JWT are planned but not implemented in the current week 1 bootstrap.
