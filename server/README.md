# Sidepick Backend

Spring Boot 기반 API 서버입니다.  
인증, 실패 경험 등록/조회, 분석 결과 조회, 카테고리 API를 담당합니다.

---

## Runtime Overview

| 항목 | 현재 기준 |
| --- | --- |
| Language | Java 17 |
| Framework | Spring Boot 3.2.12 |
| Database | AWS RDS MySQL |
| Migration | Flyway |
| Runtime | Docker Compose |
| Reverse Proxy | Nginx container |
| Public API | [https://api.side-pick.app/api](https://api.side-pick.app/api) |

---

## Local Run

로컬에서는 루트 `.env`와 [infra/docker-compose.yml](../infra/docker-compose.yml)을 기준으로 실행합니다.

```powershell
cd D:\Codex_Folder\Sidepick\infra
docker compose up -d --build
```

기본 포트:
- Backend: `http://localhost:8081`
- AI Server: `http://localhost:8001`
- MySQL: `3306`

개별 Maven 실행이 필요하다면:

```powershell
cd D:\Codex_Folder\Sidepick\server
..\mvnw.cmd spring-boot:run
```

---

## Production Run

### Current Production Paths

- Project root: `/home/ubuntu/sidepick-docker`
- Compose directory: `/home/ubuntu/sidepick-docker/infra`
- Compose file: `/home/ubuntu/sidepick-docker/infra/docker-compose.prod.yml`
- Primary env file: `/home/ubuntu/sidepick-docker/.env`

보조 env 파일이 남아 있을 수 있지만, 현재 활성 배포 기준은 `../.env`입니다.

### Key Production Rules

```env
SPRING_PROFILES_ACTIVE=prod
SERVER_PORT=8081
SPRING_JPA_HIBERNATE_DDL_AUTO=validate
AI_SERVER_URL=http://ai-server:8001
APP_DEMO_SEED_ENABLED=false
```

주의:
- 운영 기준 `AI_SERVER_URL`은 내부 네트워크 주소 `http://ai-server:8001`입니다.
- 운영 데이터에는 demo/local 시드를 섞지 않습니다.
- CSV import는 상시 설정이 아니라 필요 시점에만 켭니다.

### Deploy Commands

전체 배포:

```bash
cd /home/ubuntu/sidepick-docker/infra
sudo docker compose --env-file ../.env -f docker-compose.prod.yml up -d --build
```

백엔드만 재배포:

```bash
cd /home/ubuntu/sidepick-docker/infra
sudo docker compose --env-file ../.env -f docker-compose.prod.yml up -d --build backend
```

중지:

```bash
cd /home/ubuntu/sidepick-docker/infra
sudo docker compose --env-file ../.env -f docker-compose.prod.yml down
```

상태 확인:

```bash
cd /home/ubuntu/sidepick-docker/infra
sudo docker compose --env-file ../.env -f docker-compose.prod.yml ps
```

로그 확인:

```bash
cd /home/ubuntu/sidepick-docker/infra
sudo docker compose --env-file ../.env -f docker-compose.prod.yml logs -f backend
```

---

## Health Check

외부:

```bash
curl https://api.side-pick.app/api/health
```

서버 내부:

```bash
curl http://127.0.0.1:8081/api/health
```

---

## Admin Ops Checks

관리자 계정으로 아래 운영 확인 API를 사용할 수 있습니다.

- `GET /api/admin/latency-metrics`
  - 최근 요청 지연 시간 샘플 확인
- `GET /api/admin/chatbot-ops`
  - 챗봇 분당 제한, 일일 토큰 사용량, 현재 인스턴스 큐 상태 확인
- `GET /api/experiences/{id}/share-page`
  - OG/트위터 메타 태그가 포함된 공유용 HTML
- `GET /api/experiences/{id}/share-image`
  - 공유 카드 PNG 다운로드

챗봇 운영 주의:

- `queue-capacity`는 단일 앱 인스턴스 보호용입니다.
- `rate-limit` 상태와 `daily-token-limit` 사용량은 DB에 저장되어 재시작 후에도 유지됩니다.
- 다중 인스턴스 전역 동시성 제어가 필요하면 별도 분산 큐/락 계층이 추가되어야 합니다.

---

## Infra Notes

- 운영 환경에서는 Nginx 컨테이너가 `80/443`을 수신합니다.
- 백엔드 컨테이너는 `127.0.0.1:8081` 기준으로 프록시됩니다.
- SSL 경로는 `NGINX_SSL_DIR` 또는 `infra/nginx/ssl` 기준으로 관리합니다.

관련 파일:
- [../infra/docker-compose.prod.yml](../infra/docker-compose.prod.yml)
- [../infra/nginx/nginx.prod.conf](../infra/nginx/nginx.prod.conf)

---

## Authentication Notes

운영 권장값:

```env
APP_AUTH_LOCAL_ENABLED=false
APP_AUTH_KAKAO_ENABLED=true
APP_AUTH_GOOGLE_ENABLED=false
```

현재 구조상 카카오/구글 OAuth를 지원하며, 로컬 로그인은 운영에서 비활성화하는 구성을 권장합니다.

---

## Data Import Notes

운영 DB에 CSV 100건을 반영할 때는 아래 원칙을 따릅니다.

- `APP_DEMO_SEED_ENABLED=false` 유지
- `APP_EXPERIENCE_IMPORT_ENABLED=true`는 import 작업 시점에만 사용
- demo/local 사용자 데이터는 운영에 반영하지 않음
- 필요 시 `failure_experiences`, `ai_analysis`, `comments`, `matched_cases` 정합성을 함께 확인

---

## Related Docs

- [Root README](../README.md)
- [Deployment Guide](../docs/07_deployment.md)
- [DB Schema](../docs/db-schema.md)
- [AI Integration Contract](../docs/05_ai_integration_contract.md)
