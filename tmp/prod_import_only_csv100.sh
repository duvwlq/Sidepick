#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/home/ubuntu/sidepick-docker"
ENV_FILE="$ROOT_DIR/.env"

cd "$ROOT_DIR/infra"

sudo docker compose --env-file ../.env -f docker-compose.prod.yml up -d --build backend

sudo docker run --rm \
  --env-file "$ENV_FILE" \
  -e SPRING_MAIN_WEB_APPLICATION_TYPE=none \
  -e SERVER_PORT=0 \
  -e APP_DEMO_SEED_ENABLED=false \
  -e APP_EXPERIENCE_IMPORT_ENABLED=true \
  -e APP_EXPERIENCE_IMPORT_CSV_PATH=/app/import-data/failure_cases_100_for_be.csv \
  -e APP_EXPERIENCE_IMPORT_PRESERVE_IDS=true \
  -e APP_EXPERIENCE_IMPORT_OVERWRITE_EXISTING=true \
  -e APP_EXPERIENCE_IMPORT_REPLACE_MODE=UPSERT_ONLY \
  -e APP_EXPERIENCE_IMPORT_ANALYSIS=true \
  sidepick-backend:prod

sudo docker compose --env-file ../.env -f docker-compose.prod.yml restart backend
