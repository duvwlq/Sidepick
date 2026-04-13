# Sidepick Backend MVP

## Current Scope

This backend is prepared for the MVP flow below.

1. Register
2. Login
3. Create experience as an authenticated user
4. Get experience list
5. Get experience detail

## Base URL and Ports

- Backend base URL: `http://localhost:8081`
- API base path: `http://localhost:8081/api`
- Swagger UI: `http://localhost:8081/swagger-ui.html`
- FE dev server expected origin: `http://localhost:5173`

## Required Environment

The app reads these properties from environment variables.

- `SERVER_PORT=8081`
- `SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/failforward?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Seoul`
- `SPRING_DATASOURCE_USERNAME=failforward`
- `SPRING_DATASOURCE_PASSWORD=failforward`
- `APP_JWT_SECRET=sidepick-development-jwt-secret-key-must-be-32-bytes`
- `APP_CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`

## Run

This repository does not use the standard Maven wrapper. The root `mvnw` scripts run Maven inside Docker.

Prerequisites:

- MySQL running with the schema from `infra/mysql/init/001_init.sql`
- The schema now includes the `business_categories` table and seed data
- Docker Desktop running if you use the provided wrapper scripts

Run from the repo root:

```powershell
.\mvnw.cmd -DskipTests package
docker compose up -d
```

If you have local Maven installed, you can also run from `server/`:

```powershell
mvn spring-boot:run
```

## Auth Header

Protected endpoints require this header:

```http
Authorization: Bearer <accessToken>
```

## Main Endpoints

Public:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/experiences`
- `GET /api/experiences/{id}`
- `GET /api/categories`
- `GET /api/health`

Protected:

- `GET /api/users/me`
- `PATCH /api/users/me`
- `POST /api/experiences`
- `PATCH /api/experiences/{id}`
- `DELETE /api/experiences/{id}`

## Response Shape

Success:

```json
{
  "success": true,
  "message": "Experience created.",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Authentication failed.",
  "data": {
    "code": "UNAUTHORIZED",
    "detail": "Full authentication is required to access this resource"
  }
}
```

## Experience Request Notes

For MVP, the backend accepts a flexible create payload. The minimum practical body is:

- `content`
- `categoryId`

If `title`, `businessType`, or `failureReason` are missing, the server fills defaults.

## Frontend Integration Notes

- FE should use `http://localhost:8081/api` as the API base URL.
- After login or registration, store `data.accessToken`.
- Send `Authorization: Bearer <token>` for create/update/delete requests.
- Experience list response is under `data.experiences`.
- Pagination metadata is under `data.pagination`.

## Known Gaps

- Refresh token rotation is not implemented yet.
- Logout and token invalidation are not implemented yet.
- User deactivation status is not reflected in auth decisions yet.
- Automated build verification requires Docker Desktop or a local Maven installation.
