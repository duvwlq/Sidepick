from __future__ import annotations

import subprocess
from pathlib import Path
from urllib.parse import urlparse


ENV_PATH = Path("/home/ubuntu/sidepick-docker/.env")
BACKUP_DIR = Path("/home/ubuntu/backups")
BACKUP_DIR.mkdir(parents=True, exist_ok=True)


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
]
mysql_base = base + [
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
dump_base = base + [
    "mysqldump",
    "-h",
    parsed.hostname or "",
    "-P",
    str(parsed.port or 3306),
    "-u" + env["SPRING_DATASOURCE_USERNAME"],
    "-p" + env["SPRING_DATASOURCE_PASSWORD"],
    "--no-create-info",
    "--skip-triggers",
    parsed.path.lstrip("/"),
]


def mysql_query(sql: str) -> str:
    result = subprocess.check_output(mysql_base + ["-e", sql], text=True)
    return result.strip()


def mysql_exec(sql: str) -> None:
    subprocess.check_call(mysql_base + ["-e", sql])


count_before = mysql_query("SELECT COUNT(*) FROM failure_experiences WHERE case_status='SUCCESS';")
print(f"success_count_before={count_before}")

backup_path = BACKUP_DIR / "failforward-success-only-backup-20260624.sql"
dump_sql = subprocess.check_output(
    dump_base + ["failure_experiences", "--where=case_status='SUCCESS'"],
    text=True,
)
backup_path.write_text(dump_sql, encoding="utf-8")
print(f"backup_written={backup_path}")

delete_sql = """
DELETE FROM ai_analysis WHERE experience_id IN (SELECT id FROM (SELECT id FROM failure_experiences WHERE case_status='SUCCESS') ids);
DELETE FROM comments WHERE experience_id IN (SELECT id FROM (SELECT id FROM failure_experiences WHERE case_status='SUCCESS') ids);
DELETE FROM experience_bookmarks WHERE experience_id IN (SELECT id FROM (SELECT id FROM failure_experiences WHERE case_status='SUCCESS') ids);
DELETE FROM experience_reactions WHERE experience_id IN (SELECT id FROM (SELECT id FROM failure_experiences WHERE case_status='SUCCESS') ids);
DELETE FROM user_experience_views WHERE experience_id IN (SELECT id FROM (SELECT id FROM failure_experiences WHERE case_status='SUCCESS') ids);
DELETE FROM failure_experiences WHERE case_status='SUCCESS';
"""
mysql_exec(delete_sql)

count_after = mysql_query("SELECT COUNT(*) FROM failure_experiences WHERE case_status='SUCCESS';")
print(f"success_count_after={count_after}")
