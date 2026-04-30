# Sidepick Backend

## 현재 운영 구조

- 런타임: Java 17
- 프레임워크: Spring Boot 3.2.12
- 데이터베이스: AWS RDS MySQL
- 운영 서버: AWS EC2
- 리버스 프록시: Nginx
- 백엔드 실행 방식: Docker Compose
- 공개 API 주소: `https://api.side-pick.app/api`

## 로컬 실행

로컬에서는 [D:\Codex_Folder\Sidepick\infra\docker-compose.yml](D:/Codex_Folder/Sidepick/infra/docker-compose.yml)을 사용합니다.

```powershell
cd D:\Codex_Folder\Sidepick\infra
docker compose up -d --build
```

로컬 기본 포트:

- MySQL: 컨테이너 내부 `3306`
- Backend: `http://localhost:8081`

## 운영 실행

운영 서버에서는 [D:\Codex_Folder\Sidepick\infra\docker-compose.prod.yml](D:/Codex_Folder/Sidepick/infra/docker-compose.prod.yml)을 사용합니다.

### 1. 운영 환경변수 파일 준비

EC2 서버에 `~/backend.env` 파일을 만듭니다.

예시:

```env
SPRING_PROFILES_ACTIVE='prod'
SERVER_PORT='8081'
SPRING_DATASOURCE_URL='jdbc:mysql://<RDS-ENDPOINT>:3306/failforward?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Seoul'
SPRING_DATASOURCE_USERNAME='<RDS-USERNAME>'
SPRING_DATASOURCE_PASSWORD='<RDS-PASSWORD>'
SPRING_JPA_HIBERNATE_DDL_AUTO='validate'
APP_JWT_SECRET='<LONG-RANDOM-SECRET>'
APP_CORS_ALLOWED_ORIGINS='https://side-pick.app,https://www.side-pick.app'
AI_SERVER_URL='http://localhost:8001'
APP_EMAIL_VERIFICATION_EXPIRATION_MINUTES='10'
APP_EMAIL_VERIFICATION_EXPOSE_CODE='false'
APP_AUTH_LOCAL_ENABLED='false'
APP_AUTH_KAKAO_ENABLED='true'
APP_AUTH_GOOGLE_ENABLED='false'
APP_MAIL_ENABLED='false'
APP_MAIL_FROM_ADDRESS='no-reply@side-pick.app'
APP_MAIL_FROM_NAME='Sidepick'
SPRING_MAIL_HOST='<SMTP-HOST>'
SPRING_MAIL_PORT='587'
SPRING_MAIL_USERNAME='<SMTP-USERNAME>'
SPRING_MAIL_PASSWORD='<SMTP-PASSWORD>'
SPRING_MAIL_SMTP_AUTH='true'
SPRING_MAIL_SMTP_STARTTLS_ENABLE='true'
SPRING_MAIL_SMTP_STARTTLS_REQUIRED='false'
SPRING_MAIL_SMTP_CONNECTION_TIMEOUT='5000'
SPRING_MAIL_SMTP_TIMEOUT='5000'
SPRING_MAIL_SMTP_WRITE_TIMEOUT='5000'
APP_OAUTH_KAKAO_CLIENT_ID='<KAKAO-REST-API-KEY>'
APP_OAUTH_KAKAO_CLIENT_SECRET='<KAKAO-CLIENT-SECRET-OPTIONAL>'
APP_OAUTH_GOOGLE_CLIENT_ID='<GOOGLE-OAUTH-CLIENT-ID>'
APP_OAUTH_GOOGLE_CLIENT_SECRET='<GOOGLE-OAUTH-CLIENT-SECRET>'
```

### 2. 운영 서버에서 Docker 배포

```bash
cd ~/Sidepick/infra
docker compose --env-file ~/backend.env -f docker-compose.prod.yml up -d --build
```

재배포:

```bash
cd ~/Sidepick/infra
docker compose --env-file ~/backend.env -f docker-compose.prod.yml up -d --build backend
```

중지:

```bash
cd ~/Sidepick/infra
docker compose --env-file ~/backend.env -f docker-compose.prod.yml down
```

로그 확인:

```bash
cd ~/Sidepick/infra
docker compose --env-file ~/backend.env -f docker-compose.prod.yml logs -f backend
```

## 헬스체크

```bash
curl https://api.side-pick.app/api/health
```

## Nginx 프록시 예시

운영 서버에서는 Nginx가 호스트에서 실행되고, Docker 컨테이너의 `127.0.0.1:8081`로 프록시합니다.

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

HTTPS 발급:

```bash
sudo certbot --nginx -d api.side-pick.app
```

## 주요 공개 엔드포인트

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

인증 필요:

- `GET /api/users/me`
- `PATCH /api/users/me`
- `POST /api/experiences`
- `PATCH /api/experiences/{id}`
- `DELETE /api/experiences/{id}`

## 인증 정책 메모

- 운영 기준 로그인은 카카오 중심입니다.
- 운영 환경에서는 `APP_AUTH_LOCAL_ENABLED`, `APP_AUTH_KAKAO_ENABLED`, `APP_AUTH_GOOGLE_ENABLED`로 인증 수단을 제어합니다.
- 현재 운영 권장값:
  - `APP_AUTH_LOCAL_ENABLED='false'`
  - `APP_AUTH_KAKAO_ENABLED='true'`
  - `APP_AUTH_GOOGLE_ENABLED='false'`

## 메일 발송 메모

- 실제 이메일 인증을 운영에서 열려면 SMTP 또는 AWS SES 자격증명이 필요합니다.
- SMTP 설정이 없는데 `APP_MAIL_ENABLED='true'`이면 메일 발송이 실패합니다.
- 운영에서 메일을 다시 열기 전까지는 카카오 로그인만 노출하는 구조를 권장합니다.
