from __future__ import annotations

import subprocess
from pathlib import Path
from urllib.parse import urlparse


ENV_PATH = Path("/home/ubuntu/sidepick-docker/.env")


def trim(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and ((value[0] == "'" and value[-1] == "'") or (value[0] == '"' and value[-1] == '"')):
        return value[1:-1]
    return value


env: dict[str, str] = {}
for line in ENV_PATH.read_text().splitlines():
    if not line or line.strip().startswith("#") or "=" not in line:
        continue
    key, value = line.split("=", 1)
    env[key.strip()] = trim(value)

jdbc_url = env["SPRING_DATASOURCE_URL"]
if jdbc_url.startswith("jdbc:"):
    jdbc_url = jdbc_url[5:]
parsed = urlparse(jdbc_url)

base = [
    "sudo",
    "docker",
    "run",
    "--rm",
    "mysql:8.4",
    "mysql",
    "-N",
    "-h",
    parsed.hostname or "",
    "-P",
    str(parsed.port or 3306),
    "-u" + env["SPRING_DATASOURCE_USERNAME"],
    "-p" + env["SPRING_DATASOURCE_PASSWORD"],
    parsed.path.lstrip("/"),
]

for label, sql in [
    ("counts", "SELECT case_status, COUNT(*) FROM failure_experiences GROUP BY case_status ORDER BY case_status;"),
    ("recent_success", "SELECT id, title, case_status, created_at FROM failure_experiences WHERE case_status='SUCCESS' ORDER BY id DESC LIMIT 5;"),
]:
    print(f"--- {label} ---")
    output = subprocess.check_output(base + ["-e", sql], text=True)
    print(output.strip())
