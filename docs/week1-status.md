# Week 1 Status

## Completed

- GitHub repository setup and `develop` branch workflow
- Spring Boot backend bootstrap on Java 17
- Docker Compose local environment with MySQL 8.4
- MySQL schema SQL and JPA entity baseline
- Health endpoint and Swagger UI exposure
- API skeleton implementation based on the current OpenAPI draft
- Docker-based Maven wrapper for local compile verification
- EC2 setup guide and deployment helper scripts

## Verified

- Local Docker environment can boot backend and MySQL
- Swagger UI is exposed at `http://localhost:8081/swagger-ui.html`
- Health endpoint is exposed at `http://localhost:8081/api/health`
- `.\mvnw.cmd -DskipTests package` build succeeded

## In Progress

- Stable EC2 deployment workflow on free-tier sized instances
- Replacement of stub logic with real auth, persistence, and AI integration

## Known Limits

- Spring Security and JWT are not implemented yet
- Current auth responses use placeholder token generation
- Some API flows use stub or simplified service logic for MVP scaffolding
- EC2 external verification was unstable due to low-memory instance constraints

## Why This Differs From The Example Spec

The example spec mixed Supabase/PostgreSQL and MySQL directions.
This repository is aligned to the MySQL direction for backend consistency and simpler Docker and EC2 setup.
