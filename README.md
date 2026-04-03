# FailForward Backend

Backend API server bootstrap repository for the FailForward project.

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

### 3. Verify

- App: `http://localhost:8081`
- Health: `http://localhost:8081/api/health`
- Swagger UI: `http://localhost:8081/swagger-ui.html`

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

## Reference Docs

1. Git workflow: `docs/git-flow.md`
2. AWS EC2 setup: `docs/ec2-setup.md`
3. DB schema and SQL: `docs/db-schema.md`, `infra/mysql/init/001_init.sql`
4. API structure: `docs/api-structure.md`

## Notes

- The repository is ready to run with Docker as the default workflow.
- EC2 deployment also uses `infra/docker-compose.yml`.
