# Sidepick MVP

Sidepick MVP 배포 기준 저장소입니다.

현재 운영 구조는 아래와 같습니다.

- Frontend: AWS Amplify
- Backend: AWS EC2 + Nginx + Spring Boot
- Database: AWS RDS MySQL
- Backend API: `https://api.side-pick.app/api`

## Services

- Frontend URL:
  - `https://codex-backend-mvp-verify.d1kbzcbfbyz1zc.amplifyapp.com`
- Backend health:
  - `https://api.side-pick.app/api/health`

## Repository Structure

- `fe`: Vite + React frontend
- `server`: Spring Boot backend
- `ai`: AI service code
- `infra`: local/docker infra files
- `scripts`: local helper scripts
- `docs`: project notes
- `배포_준비_전체_가이드.md`: AWS 배포/운영 가이드

## Frontend

Frontend is built on Amplify.

Important env:

```env
VITE_API_BASE_URL=https://api.side-pick.app/api
```

Local run:

```powershell
cd fe
npm install
npm run dev
```

Local build:

```powershell
cd fe
npm run build
```

## Backend

Backend runs on EC2 and is proxied by Nginx.

Production flow:

- Nginx: `80/443`
- Spring Boot: `127.0.0.1:8081`
- Public API domain: `api.side-pick.app`

See full backend setup in [server/README.md](/D:/Codex_Folder/Sidepick/server/README.md).

## Deployment Notes

- Amplify uses root `amplify.yml`
- Frontend build is executed from `fe/`
- EC2 public `8081` inbound is not required after Nginx/HTTPS is configured
- Production CORS must allow the actual frontend origin only

## Immediate Ops Checklist

- Confirm `APP_CORS_ALLOWED_ORIGINS` contains the actual frontend domain
- Keep `SPRING_JPA_HIBERNATE_DDL_AUTO=validate`
- Keep `APP_JWT_SECRET` as a strong production secret
- Rotate RDS password if it was exposed during setup
- Restrict EC2 inbound rules to `22`, `80`, `443`

## Useful Links

- [Backend README](/D:/Codex_Folder/Sidepick/server/README.md)
- [Deployment Guide](/D:/Codex_Folder/Sidepick/배포_준비_전체_가이드.md)
