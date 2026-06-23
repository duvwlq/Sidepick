#!/usr/bin/env bash
set -euo pipefail

sed -i 's/\r$//' /home/ubuntu/config/backend.env
set -a
. /home/ubuntu/config/backend.env
set +a

sudo docker run --rm \
  -v /home/ubuntu/sidepick-docker/server/src/main/resources/db/migration:/flyway/sql \
  flyway/flyway:9.22.3 \
  -url="$SPRING_DATASOURCE_URL" \
  -user="$SPRING_DATASOURCE_USERNAME" \
  -password="$SPRING_DATASOURCE_PASSWORD" \
  -locations=filesystem:/flyway/sql \
  repair

cd /home/ubuntu/sidepick-docker/infra
sudo docker compose --env-file ../.env -f docker-compose.prod.yml up -d backend
sleep 15
sudo docker compose --env-file ../.env -f docker-compose.prod.yml logs --tail 80 backend
echo "--- HEALTH ---"
curl -s http://127.0.0.1:8081/api/health || true
