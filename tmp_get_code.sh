#!/bin/bash
set -euo pipefail
set -a
. /home/ubuntu/sidepick-docker/.env
set +a
DB_URL="${SPRING_DATASOURCE_URL#jdbc:mysql://}"
HOSTPORT="${DB_URL%%/*}"
DB_NAME_WITH_PARAMS="${DB_URL#*/}"
DB_NAME="${DB_NAME_WITH_PARAMS%%\?*}"
DB_HOST="${HOSTPORT%%:*}"
DB_PORT="${HOSTPORT##*:}"
EMAIL="$1"
mysql --host="$DB_HOST" --port="$DB_PORT" --user="$SPRING_DATASOURCE_USERNAME" --password="$SPRING_DATASOURCE_PASSWORD" --database="$DB_NAME" -Nse "select code from email_verification_tokens where email='${EMAIL}' order by id desc limit 1;"
