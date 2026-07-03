#!/usr/bin/env python3
import json
import subprocess
import time
import urllib.error
import urllib.request
from pathlib import Path


BASE_URL = "https://api.side-pick.app/api"
EMAIL = f"prod-chatbot-short-{int(time.time())}@sidepick.dev"
PASSWORD = "Password123!"


def api_post(path: str, payload: dict, token: str | None = None) -> dict:
    data = json.dumps(payload).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = urllib.request.Request(f"{BASE_URL}{path}", data=data, headers=headers, method="POST")
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def load_env() -> dict[str, str]:
    env: dict[str, str] = {}
    for line in Path("/home/ubuntu/sidepick-docker/.env").read_text(encoding="utf-8").splitlines():
        if "=" not in line or line.lstrip().startswith("#"):
            continue
        key, value = line.split("=", 1)
        env[key] = value.strip().strip("'").strip('"')
    return env


def fetch_verification_code(email: str, env: dict[str, str]) -> str:
    query = (
        "select code from email_verification_tokens "
        f"where email='{email}' order by id desc limit 1;"
    )
    command = [
        "mysql",
        "-h",
        env["SPRING_DATASOURCE_URL"].split("//", 1)[1].split("/", 1)[0].split("?", 1)[0].split(":", 1)[0],
        "-u",
        env["SPRING_DATASOURCE_USERNAME"],
        f"-p{env['SPRING_DATASOURCE_PASSWORD']}",
        "failforward",
        "-Nse",
        query,
    ]
    result = subprocess.run(command, capture_output=True, text=True, check=True)
    code = result.stdout.strip()
    if len(code) != 6:
        raise RuntimeError(f"verification code lookup failed: {code!r}")
    return code


def main() -> None:
    env = load_env()

    verification_request = api_post("/auth/email-verifications", {"email": EMAIL})
    if not verification_request.get("success", False):
        raise RuntimeError(f"verification request failed: {verification_request}")

    code = fetch_verification_code(EMAIL, env)

    verification_confirm = api_post("/auth/email-verifications/confirm", {"email": EMAIL, "code": code})
    if not verification_confirm.get("success", False):
        raise RuntimeError(f"verification confirm failed: {verification_confirm}")

    signup_payload = {
        "email": EMAIL,
        "password": PASSWORD,
        "fullName": "Prod Short Smoke",
        "birthDate": "1999-01-01",
        "gender": "MALE",
        "region": "서울",
        "signupPurposes": ["실패 이유를 찾아보고 싶어요"],
        "nickname": f"short{int(time.time())}",
        "experienceStatus": "HAS_EXPERIENCE",
        "ageGroup": "20s",
    }
    signup_response = api_post("/auth/register", signup_payload)
    if not signup_response.get("success", False):
        raise RuntimeError(f"signup failed: {signup_response}")

    login_response = api_post("/auth/login", {"email": EMAIL, "password": PASSWORD})
    if not login_response.get("success", False):
        raise RuntimeError(f"login failed: {login_response}")
    token = login_response["data"]["accessToken"]

    results = {}
    for key, message in {
        "short_recommend": "부업 추천해줘?",
        "short_start": "스마트스토어 어떻게 시작해?",
    }.items():
        response = api_post(
            "/chatbot/message",
            {
                "session_id": f"{key}-{int(time.time())}",
                "message": message,
            },
            token=token,
        )
        data = response.get("data", {})
        results[key] = {
            "message": message,
            "status": data.get("status"),
            "type": data.get("type"),
            "reason": data.get("reason"),
            "reply": data.get("reply"),
        }

    print(json.dumps({"email": EMAIL, "results": results}, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        print(json.dumps({"http_error": exc.code, "body": body}, ensure_ascii=False))
        raise
