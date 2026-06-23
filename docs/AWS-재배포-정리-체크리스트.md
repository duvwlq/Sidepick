# AWS 재배포 정리 체크리스트

## 현재 운영 구조

### 프론트엔드

- 서비스: AWS Amplify
- 운영 도메인:
  - `https://side-pick.app`
  - `https://www.side-pick.app`

### 백엔드

- 서비스: AWS EC2
- 실행 방식: Docker Compose
- 리버스 프록시: Nginx container
- 운영 API:
  - `https://api.side-pick.app/api`

### 데이터베이스

- 서비스: AWS RDS MySQL
- 애플리케이션 DB 이름: `failforward`

## 실제 운영 경로

- 프로젝트 루트: `/home/ubuntu/sidepick-docker`
- Compose 경로: `/home/ubuntu/sidepick-docker/infra`
- Compose 파일: `/home/ubuntu/sidepick-docker/infra/docker-compose.prod.yml`
- 주 env 파일: `/home/ubuntu/sidepick-docker/.env`

## 운영 배포에 필요한 핵심 값

```env
SPRING_PROFILES_ACTIVE=prod
SERVER_PORT=8081
SPRING_DATASOURCE_URL=jdbc:mysql://<RDS-ENDPOINT>:3306/failforward?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Seoul
SPRING_DATASOURCE_USERNAME=<RDS-USERNAME>
SPRING_DATASOURCE_PASSWORD=<RDS-PASSWORD>
SPRING_JPA_HIBERNATE_DDL_AUTO=validate
APP_JWT_SECRET=<LONG-RANDOM-SECRET>
APP_CORS_ALLOWED_ORIGINS=https://side-pick.app,https://www.side-pick.app
AI_SERVER_URL=http://ai-server:8001
APP_AUTH_LOCAL_ENABLED=false
APP_AUTH_KAKAO_ENABLED=true
APP_AUTH_GOOGLE_ENABLED=false
APP_MAIL_ENABLED=false
APP_DEMO_SEED_ENABLED=false
```

## 운영 배포 순서

1. EC2 접속 확인
2. `/home/ubuntu/sidepick-docker/.env` 값 점검
3. `/home/ubuntu/sidepick-docker/infra` 이동
4. `sudo docker compose --env-file ../.env -f docker-compose.prod.yml up -d --build backend`
5. `sudo docker compose --env-file ../.env -f docker-compose.prod.yml ps` 확인
6. `sudo docker compose --env-file ../.env -f docker-compose.prod.yml logs --tail 100 backend` 확인
7. `curl http://127.0.0.1:8081/api/health` 확인
8. `curl https://api.side-pick.app/api/health` 확인

## 경험 데이터 반영 체크

CSV 100건만 운영에 넣을 때:

1. 기존 경험 데이터와 연관 분석 데이터 삭제 범위 확인
2. `APP_DEMO_SEED_ENABLED=false` 확인
3. demo/local 성격 데이터 미반영 확인
4. import 후 카테고리 분포 확인
5. 외부 health check 재확인

## 운영 메모

- 과거 문서의 `~/Sidepick` 경로는 현재 운영 기준이 아님
- 과거 문서의 `~/backend.env` 단일 파일 기준도 현재 active Compose 기준과 다름
- 현재 실제 배포는 `sidepick-docker/.env`를 기준으로 돌아감
