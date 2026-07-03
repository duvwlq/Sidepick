#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="$HOME/sidepick-docker/.env"
BACKUP_FILE="$HOME/sidepick-docker/.env.bak-ai-service"
TARGET_LINE="AI_SERVER_URL='http://ai-server:8001'"

if [[ ! -f "$BACKUP_FILE" ]]; then
  cp "$ENV_FILE" "$BACKUP_FILE"
fi

python3 - <<'PY'
from pathlib import Path

env_file = Path.home() / "sidepick-docker" / ".env"
target = "AI_SERVER_URL='http://ai-server:8001'"

lines = env_file.read_text().splitlines()
updated = []
seen = False

for line in lines:
    if line.startswith("AI_SERVER_URL="):
        updated.append(target)
        seen = True
    else:
        updated.append(line)

if not seen:
    updated.append(target)

env_file.write_text("\n".join(updated) + "\n")
print(next(line for line in updated if line.startswith("AI_SERVER_URL=")))
PY
