#!/usr/bin/env bash
set -euo pipefail

STAGE="/home/ubuntu/deploy-20260626-guide-chatbot"
BACKUP="/home/ubuntu/backups/deploy-20260626-guide-chatbot"
ARCHIVE="/home/ubuntu/sidepick-merge-branch-server-20260626.tgz"
TARGET="/home/ubuntu/sidepick-docker"

mkdir -p "$STAGE" "$BACKUP"
rm -rf "$STAGE/ai" "$STAGE/server" "$STAGE/infra"
tar -xzf "$ARCHIVE" -C "$STAGE"

cp -a "$TARGET/ai" "$BACKUP/"
cp -a "$TARGET/server" "$BACKUP/"
cp -a "$TARGET/infra" "$BACKUP/"

rm -rf "$TARGET/ai" "$TARGET/server" "$TARGET/infra"
cp -a "$STAGE/ai" "$TARGET/"
cp -a "$STAGE/server" "$TARGET/"
cp -a "$STAGE/infra" "$TARGET/"

echo "DEPLOY_STAGE=$STAGE"
echo "DEPLOY_BACKUP=$BACKUP"
