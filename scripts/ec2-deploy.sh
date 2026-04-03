#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  cp .env.example .env
fi

sudo docker compose -f infra/docker-compose.yml up -d --build
