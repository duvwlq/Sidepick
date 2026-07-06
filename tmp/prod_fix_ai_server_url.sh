#!/usr/bin/env bash
set -euo pipefail

cp ~/sidepick-docker/.env ~/sidepick-docker/.env.bak-chatbot-portfix
sed -i "s#AI_SERVER_URL='http://localhost:8000'#AI_SERVER_URL='http://localhost:8001'#" ~/sidepick-docker/.env
grep '^AI_SERVER_URL' ~/sidepick-docker/.env

cd ~/sidepick-docker/infra
sudo docker compose --env-file ../.env -f docker-compose.prod.yml up -d backend
sudo docker compose --env-file ../.env -f docker-compose.prod.yml logs --tail 80 backend
