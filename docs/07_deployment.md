# 07. Deployment

## Current Deployment Shape

| Layer | Current Runtime |
| --- | --- |
| Frontend | AWS Amplify |
| Backend | AWS EC2 |
| Reverse Proxy | Nginx container |
| AI Server | FastAPI container |
| Database | AWS RDS MySQL |
| Runtime | Docker Compose |

---

## Production Paths

- EC2 user: `ubuntu`
- Project root: `/home/ubuntu/sidepick-docker`
- Compose directory: `/home/ubuntu/sidepick-docker/infra`
- Compose file: `/home/ubuntu/sidepick-docker/infra/docker-compose.prod.yml`
- Primary env file: `/home/ubuntu/sidepick-docker/.env`

보조 파일이 서버에 남아 있을 수 있지만, 현재 활성 Compose 배포 기준은 `../.env`입니다.

---

## Key Operational Rules

- `SPRING_PROFILES_ACTIVE=prod`
- `SPRING_JPA_HIBERNATE_DDL_AUTO=validate`
- `AI_SERVER_URL=http://ai-server:8001`
- `APP_DEMO_SEED_ENABLED=false`
- CSV import는 상시 설정이 아니라 필요 시점의 별도 작업으로 취급

---

## Deploy Commands

전체 재배포:

```bash
cd /home/ubuntu/sidepick-docker/infra
sudo docker compose --env-file ../.env -f docker-compose.prod.yml up -d --build
```

백엔드만 재배포:

```bash
cd /home/ubuntu/sidepick-docker/infra
sudo docker compose --env-file ../.env -f docker-compose.prod.yml up -d --build backend
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

중지:

```bash
cd /home/ubuntu/sidepick-docker/infra
sudo docker compose --env-file ../.env -f docker-compose.prod.yml down
```

---

## Health Checks

외부:

```bash
curl https://api.side-pick.app/api/health
```

서버 내부:

```bash
curl http://127.0.0.1:8081/api/health
```

---

## Data Notes

운영 데이터 반영 시 기본 원칙:

- 운영 DB는 RDS `failforward` 기준
- demo/local 성격 사용자 데이터는 운영에 넣지 않음
- CSV import 작업 전후로 `ai_analysis`, `comments`, `matched_cases` 정합성 확인
- import 설정은 작업 시점에만 켜고 종료 후 되돌림

---

## Nginx / HTTPS Notes

- 운영에서는 Nginx 컨테이너가 `80/443`을 수신합니다.
- 백엔드는 `127.0.0.1:8081` 기준으로 프록시됩니다.
- SSL 인증서 경로는 `NGINX_SSL_DIR` 또는 `infra/nginx/ssl` 기준으로 관리합니다.

관련 파일:
- [../infra/docker-compose.prod.yml](../infra/docker-compose.prod.yml)
- [../infra/nginx/nginx.prod.conf](../infra/nginx/nginx.prod.conf)

---

## Documentation Rule

운영 구조를 설명할 때는 다음 기준을 우선합니다.

1. 실제 EC2 경로
2. `docker-compose.prod.yml` 기준
3. `/home/ubuntu/sidepick-docker/.env` 기준

과거 문서의 `~/Sidepick`, 단독 jar 실행 메모, 오래된 env 경로는 현재 운영 기준이 아닙니다.

---

## Related Docs

- [01_current_architecture.md](./01_current_architecture.md)
- [06_demo_seed_and_scenario.md](./06_demo_seed_and_scenario.md)
- [../server/README.md](../server/README.md)
- [AWS-재배포-정리-체크리스트.md](./AWS-재배포-정리-체크리스트.md)
