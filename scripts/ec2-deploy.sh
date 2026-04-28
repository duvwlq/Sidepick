#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

ENV_FILE="${ENV_FILE:-$HOME/backend.env}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing env file: $ENV_FILE" >&2
  exit 1
fi

sudo docker compose --env-file "$ENV_FILE" -f infra/docker-compose.prod.yml up -d --build
