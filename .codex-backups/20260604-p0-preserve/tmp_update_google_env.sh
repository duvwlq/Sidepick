#!/usr/bin/env bash
set -euo pipefail
ENV_FILE=/home/ubuntu/sidepick-docker/.env
sed -i "s|^APP_AUTH_GOOGLE_ENABLED=.*|APP_AUTH_GOOGLE_ENABLED='true'|" "$ENV_FILE"
sed -i "s|^APP_OAUTH_GOOGLE_CLIENT_ID=.*|APP_OAUTH_GOOGLE_CLIENT_ID='__SET_GOOGLE_CLIENT_ID__'|" "$ENV_FILE"
sed -i "s|^APP_OAUTH_GOOGLE_CLIENT_SECRET=.*|APP_OAUTH_GOOGLE_CLIENT_SECRET='__SET_GOOGLE_CLIENT_SECRET__'|" "$ENV_FILE"
grep -E 'APP_AUTH_GOOGLE_ENABLED|APP_OAUTH_GOOGLE_CLIENT_ID|APP_OAUTH_GOOGLE_CLIENT_SECRET' "$ENV_FILE"
cd /home/ubuntu/sidepick-docker/infra
sudo docker compose --env-file ../.env -f docker-compose.prod.yml up -d backend
sleep 15
sudo docker compose --env-file ../.env -f docker-compose.prod.yml logs --tail 80 backend | grep -i -E 'Google|oauth|Started|error|Exception' || true
