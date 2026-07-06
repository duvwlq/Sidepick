#!/usr/bin/env bash
set -euo pipefail
set -a
source /home/ubuntu/sidepick-docker/.env
cat > /tmp/sidepick-mysql.cnf <<EOF
[client]
user=${SPRING_DATASOURCE_USERNAME}
password=${SPRING_DATASOURCE_PASSWORD}
host=sidepick-db.cbg6gui08xx9.ap-northeast-2.rds.amazonaws.com
port=3306
database=failforward
EOF
chmod 600 /tmp/sidepick-mysql.cnf
mysql --defaults-extra-file=/tmp/sidepick-mysql.cnf -e "SELECT installed_rank, version, description, checksum, success FROM flyway_schema_history WHERE version=6;"
mysql --defaults-extra-file=/tmp/sidepick-mysql.cnf -e "UPDATE flyway_schema_history SET checksum=589908984 WHERE version=6;"
mysql --defaults-extra-file=/tmp/sidepick-mysql.cnf -e "SELECT installed_rank, version, description, checksum, success FROM flyway_schema_history WHERE version=6;"
mysql --defaults-extra-file=/tmp/sidepick-mysql.cnf failforward < /home/ubuntu/sidepick-docker/server/src/main/resources/db/migration/V6__expand_business_categories_with_type.sql
