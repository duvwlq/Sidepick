#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/home/ubuntu/sidepick-docker"
ENV_FILE="$ROOT_DIR/.env"
BACKUP_DIR="/home/ubuntu/backups"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

SPRING_DATASOURCE_URL="$(grep '^SPRING_DATASOURCE_URL=' "$ENV_FILE" | head -n1 | cut -d= -f2-)"
SPRING_DATASOURCE_USERNAME="$(grep '^SPRING_DATASOURCE_USERNAME=' "$ENV_FILE" | head -n1 | cut -d= -f2-)"
SPRING_DATASOURCE_PASSWORD="$(grep '^SPRING_DATASOURCE_PASSWORD=' "$ENV_FILE" | head -n1 | cut -d= -f2-)"

JDBC_NO_PREFIX="${SPRING_DATASOURCE_URL#jdbc:mysql://}"
HOST_AND_DB="${JDBC_NO_PREFIX%%\?*}"
DB_NAME="${HOST_AND_DB##*/}"
HOST_PORT="${HOST_AND_DB%/*}"
DB_HOST="${HOST_PORT%:*}"
DB_PORT="${HOST_PORT##*:}"

BACKUP_FILE="$BACKUP_DIR/failforward-experience-backup-$TIMESTAMP.sql"

sudo docker run --rm mysql:8.4 sh -lc "
  exec mysqldump \
    -h '$DB_HOST' \
    -P '$DB_PORT' \
    -u'$SPRING_DATASOURCE_USERNAME' \
    -p'$SPRING_DATASOURCE_PASSWORD' \
    '$DB_NAME' \
    users \
    failure_experiences \
    ai_analysis \
    comments \
    matched_cases \
    experiences
" > "$BACKUP_FILE"

echo "BACKUP_FILE=$BACKUP_FILE"
