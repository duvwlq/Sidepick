# Sidepick MVP

Sidepick is an MVP for collecting structured side-job failure stories, browsing similar cases, and using AI analysis to help users form better judgment criteria.

## Current Stack

- Frontend: Vite + React in `fe/`
- Backend: Spring Boot in `server/`
- Database: MySQL
- Infra: Docker Compose for local infra, EC2 + Nginx for production
- Public API base: `https://api.side-pick.app/api`

## Repository Layout

- `fe/`: frontend app
- `server/`: backend API
- `ai/`: AI-related code and notes
- `infra/`: local database and migration setup
- `scripts/`: local helper scripts
- `docs/`: project notes and cleanup inventory
- `screenshots/`: reference screenshots and presentation assets

## Backend Auth Status

The backend currently supports:

- Email/password sign-up and login
- Email verification state management
- Kakao OAuth login
- Google OAuth login
- Write restrictions for unverified local accounts

See:

- [Backend README](D:/Codex_Folder/Sidepick/server/README.md)
- [Auth Flow MVP](D:/Codex_Folder/Sidepick/server/AUTH_FLOW_MVP.md)
- [Frontend Auth Handoff](D:/Codex_Folder/Sidepick/docs/frontend-auth-handoff.md)

## Local Frontend

```powershell
cd fe
npm install
npm run dev
```

Important env:

```env
VITE_API_BASE_URL=https://api.side-pick.app/api
VITE_KAKAO_CLIENT_ID=<kakao-rest-api-key>
```

## Local Backend

The repo uses Docker-backed Maven wrapper commands through `mvnw.cmd`.

```powershell
cd server
../mvnw.cmd test
```

Production environment details live in [server/README.md](D:/Codex_Folder/Sidepick/server/README.md).

## Waiting-Period Maintenance

While frontend work is in progress, the most useful maintenance items are:

- keep auth and deployment docs current
- keep OAuth environment values out of Git
- avoid deleting user notes/screenshots without review
- use the cleanup inventory before removing loose docs

See [Cleanup Inventory](D:/Codex_Folder/Sidepick/docs/repo-cleanup-inventory.md).
