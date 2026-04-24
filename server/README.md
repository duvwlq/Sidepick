# Sidepick Backend

## 현재 운영 구조

- 런타임: Java 17
- 프레임워크: Spring Boot 3.2.12
- 데이터베이스: AWS RDS MySQL
- 리버스 프록시: EC2 Nginx
- 공개 API 주소: `https://api.side-pick.app/api`
- 내부 애플리케이션 포트: `8081`

## 운영 환경 변수

`~/backend.env` 예시:

```env
SPRING_PROFILES_ACTIVE='prod'
SERVER_PORT='8081'
SPRING_DATASOURCE_URL='jdbc:mysql://<RDS-ENDPOINT>:3306/failforward?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Seoul'
SPRING_DATASOURCE_USERNAME='<RDS-USERNAME>'
SPRING_DATASOURCE_PASSWORD='<RDS-PASSWORD>'
SPRING_JPA_HIBERNATE_DDL_AUTO='validate'
APP_JWT_SECRET='<LONG-RANDOM-SECRET>'
APP_CORS_ALLOWED_ORIGINS='https://side-pick.app,https://www.side-pick.app'
AI_SERVER_URL='http://localhost:8000'
APP_EMAIL_VERIFICATION_EXPIRATION_MINUTES='10'
APP_EMAIL_VERIFICATION_EXPOSE_CODE='false'
APP_AUTH_LOCAL_ENABLED='false'
APP_AUTH_KAKAO_ENABLED='true'
APP_AUTH_GOOGLE_ENABLED='false'
APP_MAIL_ENABLED='true'
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

참고:

- `SPRING_DATASOURCE_URL`에는 `&`가 들어가므로 따옴표를 유지하는 것이 안전합니다.
- `APP_JWT_SECRET`는 최소 32바이트 이상으로 설정해야 합니다.
- `APP_CORS_ALLOWED_ORIGINS`에는 실제 프론트 도메인만 넣는 것이 좋습니다.
- `SPRING_JPA_HIBERNATE_DDL_AUTO`는 운영에서 `validate` 유지 권장입니다.
- 실제 메일 발송은 SMTP 공통 방식으로 동작하므로 AWS SES SMTP 자격 증명도 그대로 사용할 수 있습니다.

## 이메일 인증 메일 발송

운영에서 이메일 인증을 사용하려면 아래 조건이 필요합니다.

- `APP_MAIL_ENABLED='true'`
- `SPRING_MAIL_HOST`, `SPRING_MAIL_PORT`, `SPRING_MAIL_USERNAME`, `SPRING_MAIL_PASSWORD` 설정
- `APP_MAIL_FROM_ADDRESS`, `APP_MAIL_FROM_NAME` 설정

AWS SES를 사용할 경우:

- SMTP 호스트는 사용하는 SES 리전의 SMTP 엔드포인트를 사용합니다.
- SES SMTP 사용자명/비밀번호는 IAM 액세스 키가 아니라 SES SMTP 자격 증명을 사용해야 합니다.
- 발신 주소(`APP_MAIL_FROM_ADDRESS`)는 SES에서 검증된 주소 또는 도메인이어야 합니다.

## EC2 실행 명령

빌드:

```bash
cd ~/Sidepick/server
mvn -DskipTests package
```

실행:

```bash
set -a
source ~/backend.env
set +a
nohup java -jar target/failforward-backend-0.0.1-SNAPSHOT.jar > ~/backend.log 2>&1 &
```

재시작:

```bash
pkill -f failforward-backend || true
set -a
source ~/backend.env
set +a
cd ~/Sidepick/server
nohup java -jar target/failforward-backend-0.0.1-SNAPSHOT.jar > ~/backend.log 2>&1 &
```

헬스체크:

```bash
curl https://api.side-pick.app/api/health
```

로그 확인:

```bash
tail -n 100 ~/backend.log
```

## Nginx 리버스 프록시

예시 설정:

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

## 인증 관련 메모

- 일반 계정은 이메일 인증 전에도 로그인할 수 있습니다.
- 이메일 미인증 일반 계정은 경험 작성 계열 기능이 제한됩니다.
- 소셜 로그인 계정은 로그인 시점에 인증 완료 상태로 처리합니다.
- 운영 환경에서는 `APP_AUTH_LOCAL_ENABLED`, `APP_AUTH_KAKAO_ENABLED`, `APP_AUTH_GOOGLE_ENABLED`로 로그인 수단을 제어할 수 있습니다.
- 프론트 OAuth 연결 규칙은 [AUTH_FLOW_MVP.md](D:/Codex_Folder/Sidepick/server/AUTH_FLOW_MVP.md) 참고

## 운영 체크리스트

- Nginx/HTTPS 구성이 끝나면 외부 `8081` 포트는 열지 않는 것이 좋습니다.
- RDS 비밀번호가 노출되었으면 교체해야 합니다.
- 임시 JWT 시크릿을 썼다면 교체해야 합니다.
- CORS는 실제 운영 프론트 도메인만 허용해야 합니다.
- Certbot 자동 갱신 타이머 상태를 확인하는 것이 좋습니다.
