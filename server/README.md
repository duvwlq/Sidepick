# Sidepick Backend

## Current Production Shape

- Runtime: Java 17
- Framework: Spring Boot 3.2.12
- Database: AWS RDS MySQL
- Reverse proxy: Nginx on EC2
- Public API base URL: `https://api.side-pick.app/api`
- Internal app port: `8081`

## Production Environment Variables

`~/backend.env` example:

```env
SPRING_PROFILES_ACTIVE='prod'
SERVER_PORT='8081'
SPRING_DATASOURCE_URL='jdbc:mysql://<RDS-ENDPOINT>:3306/failforward?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Seoul'
SPRING_DATASOURCE_USERNAME='<RDS-USERNAME>'
SPRING_DATASOURCE_PASSWORD='<RDS-PASSWORD>'
SPRING_JPA_HIBERNATE_DDL_AUTO='validate'
APP_JWT_SECRET='<LONG-RANDOM-SECRET>'
APP_CORS_ALLOWED_ORIGINS='https://codex-backend-mvp-verify.d1kbzcbfbyz1zc.amplifyapp.com'
AI_SERVER_URL='http://localhost:8000'
APP_EMAIL_VERIFICATION_EXPIRATION_MINUTES='10'
APP_EMAIL_VERIFICATION_EXPOSE_CODE='false'
APP_OAUTH_KAKAO_CLIENT_ID='<KAKAO-REST-API-KEY>'
APP_OAUTH_KAKAO_CLIENT_SECRET='<KAKAO-CLIENT-SECRET-OPTIONAL>'
APP_OAUTH_GOOGLE_CLIENT_ID='<GOOGLE-OAUTH-CLIENT-ID>'
APP_OAUTH_GOOGLE_CLIENT_SECRET='<GOOGLE-OAUTH-CLIENT-SECRET>'
```

Notes:

- `SPRING_DATASOURCE_URL` must be quoted because it contains `&`
- `APP_JWT_SECRET` must be at least 32 bytes
- `APP_CORS_ALLOWED_ORIGINS` should contain only actual frontend origins
- `SPRING_JPA_HIBERNATE_DDL_AUTO` should stay `validate` in production

## EC2 Run Commands

Build:

```bash
cd ~/Sidepick/server
mvn -DskipTests package
```

Run:

```bash
set -a
source ~/backend.env
set +a
nohup java -jar target/failforward-backend-0.0.1-SNAPSHOT.jar > ~/backend.log 2>&1 &
```

Restart:

```bash
pkill -f failforward-backend || true
set -a
source ~/backend.env
set +a
cd ~/Sidepick/server
nohup java -jar target/failforward-backend-0.0.1-SNAPSHOT.jar > ~/backend.log 2>&1 &
```

Health check:

```bash
curl https://api.side-pick.app/api/health
```

Logs:

```bash
tail -n 100 ~/backend.log
```

## Nginx Reverse Proxy

Example config:

```nginx
server {
    listen 80;
    server_name api.side-pick.app;

    location / {
        proxy_pass http://127.0.0.1:8081;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

HTTPS is issued with Certbot:

```bash
sudo certbot --nginx -d api.side-pick.app
```

## Main Public Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/email-verifications`
- `POST /api/auth/email-verifications/confirm`
- `POST /api/auth/oauth/kakao`
- `POST /api/auth/oauth/google`
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

## Auth Notes

- Local accounts can log in before email verification is complete.
- Unverified local accounts are blocked from experience write actions.
- Social accounts are treated as verified at login time.
- OAuth setup details for frontend integration are documented in [AUTH_FLOW_MVP.md](D:/Codex_Folder/Sidepick/server/AUTH_FLOW_MVP.md).

## Ops Checklist

- Close public inbound `8081` after Nginx/HTTPS is ready
- Rotate RDS password if it was exposed
- Rotate JWT secret if it was temporary
- Restrict CORS to deployed frontend domains
- Renew/check certificate automatically with Certbot timer
