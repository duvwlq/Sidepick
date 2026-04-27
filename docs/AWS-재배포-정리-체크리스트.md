# AWS 재배포 정리 체크리스트

## 현재 운영 구조

### 프론트엔드

- 서비스: AWS Amplify
- 배포 브랜치: `Sidepick-merge-branch`
- 운영 도메인:
  - `https://side-pick.app`
  - `https://www.side-pick.app`

### 백엔드

- 서비스: AWS EC2
- 실행 방식: Docker Compose
- 리버스 프록시: Nginx
- 운영 API 도메인:
  - `https://api.side-pick.app/api`

### 데이터베이스

- 서비스: AWS RDS MySQL
- DB 식별자: `sidepick-db`
- 애플리케이션 DB 이름: `failforward`

## 운영 배포에 필요한 핵심 값

### 프론트 환경변수

```env
VITE_API_BASE_URL=https://api.side-pick.app/api
VITE_KAKAO_CLIENT_ID=<KAKAO-REST-API-KEY>
```

### 백엔드 환경변수

```env
SPRING_PROFILES_ACTIVE='prod'
SERVER_PORT='8081'
SPRING_DATASOURCE_URL='jdbc:mysql://<RDS-ENDPOINT>:3306/failforward?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Seoul'
SPRING_DATASOURCE_USERNAME='<RDS-USERNAME>'
SPRING_DATASOURCE_PASSWORD='<RDS-PASSWORD>'
SPRING_JPA_HIBERNATE_DDL_AUTO='validate'
APP_JWT_SECRET='<LONG-RANDOM-SECRET>'
APP_CORS_ALLOWED_ORIGINS='https://side-pick.app,https://www.side-pick.app'
APP_AUTH_LOCAL_ENABLED='false'
APP_AUTH_KAKAO_ENABLED='true'
APP_AUTH_GOOGLE_ENABLED='false'
APP_OAUTH_KAKAO_CLIENT_ID='<KAKAO-REST-API-KEY>'
APP_OAUTH_KAKAO_CLIENT_SECRET='<KAKAO-CLIENT-SECRET-OPTIONAL>'
```

## 운영 배포 순서

1. EC2 생성 및 SSH 접속 확인
2. RDS 생성 및 EC2 보안 그룹에서 3306 허용
3. `~/backend.env` 작성
4. `~/Sidepick/infra`에서 Docker Compose 실행
5. Nginx에서 `api.side-pick.app -> 127.0.0.1:8081` 프록시 설정
6. Certbot으로 HTTPS 발급
7. Amplify 앱 생성 및 `Sidepick-merge-branch` 연결
8. 프론트 환경변수 설정
9. Route 53에서 아래 레코드 확인
   - `side-pick.app` -> Amplify
   - `www.side-pick.app` -> Amplify
   - `api.side-pick.app` -> EC2
10. 카카오 Redirect URI 운영값 추가

## 최종 점검

- `https://api.side-pick.app/api/health`
- `https://side-pick.app`
- `https://www.side-pick.app`
- 카카오 로그인
- 경험 작성 / 조회 / 수정 / 삭제

## 운영 메모

- 현재 운영 인증은 카카오 중심입니다.
- 이메일 로그인/회원가입은 운영에서 비활성 권장 상태입니다.
- 이메일 인증을 운영에서 다시 열려면 SMTP 또는 AWS SES 구성이 필요합니다.
