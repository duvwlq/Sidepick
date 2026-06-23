#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="/home/ubuntu/sidepick-docker/.env"
DB_URL=$(grep '^SPRING_DATASOURCE_URL=' "$ENV_FILE" | cut -d= -f2-)
DB_HOST=$(echo "$DB_URL" | sed -E 's#jdbc:mysql://([^/:]+)(:([0-9]+))?/([^?]+).*#\1#')
DB_PORT=$(echo "$DB_URL" | sed -E 's#jdbc:mysql://([^/:]+)(:([0-9]+))?/([^?]+).*#\3#')
DB_NAME=$(echo "$DB_URL" | sed -E 's#jdbc:mysql://([^/:]+)(:([0-9]+))?/([^?]+).*#\4#')
DB_USER=$(grep '^SPRING_DATASOURCE_USERNAME=' "$ENV_FILE" | cut -d= -f2-)
DB_PASS=$(grep '^SPRING_DATASOURCE_PASSWORD=' "$ENV_FILE" | cut -d= -f2-)

sudo docker run --rm -i mysql:8.4 mysql \
  -h "$DB_HOST" \
  -P "$DB_PORT" \
  -u "$DB_USER" \
  -p"$DB_PASS" \
  "$DB_NAME" < /home/ubuntu/prod_verify_after_import.sql
