import json
import subprocess
import time
import urllib.request
import urllib.error


API_BASE = "https://api.side-pick.app/api"
STAMP = int(time.time() * 1000)
EMAIL = f"prod-bigint-{STAMP}@example.com"
PASSWORD = "Sidepick123!"
NICKNAME = f"big{str(STAMP)[-6:]}"
SSH_PEM = r"D:\다운로드\sidepick-backend.pem"
SSH_HOST = "ubuntu@13.125.243.233"


def request(method, path, payload=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        API_BASE + path,
        data=data,
        headers=headers,
        method=method,
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            body = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError({"path": path, "status": error.code, "body": detail}) from error
    if body.get("success") is False:
        raise RuntimeError(body)
    return body.get("data")


def fetch_verification_code(email):
    command = (
        "set -e; "
        "set -a; . /home/ubuntu/sidepick-docker/.env; set +a; "
        "DB_URL=\"${SPRING_DATASOURCE_URL#jdbc:mysql://}\"; "
        "HOSTPORT=\"${DB_URL%%/*}\"; "
        "DB_NAME_WITH_PARAMS=\"${DB_URL#*/}\"; "
        "DB_NAME=\"${DB_NAME_WITH_PARAMS%%\\?*}\"; "
        "DB_HOST=\"${HOSTPORT%%:*}\"; "
        "DB_PORT=\"${HOSTPORT##*:}\"; "
        f"EMAIL='{email}'; "
        "mysql --host=\"$DB_HOST\" --port=\"$DB_PORT\" "
        "--user=\"$SPRING_DATASOURCE_USERNAME\" "
        "--password=\"$SPRING_DATASOURCE_PASSWORD\" "
        "--database=\"$DB_NAME\" -Nse "
        "\"select code from email_verification_tokens where email='${EMAIL}' order by id desc limit 1;\""
    )
    result = subprocess.check_output(
        ["ssh", "-i", SSH_PEM, SSH_HOST, command],
        text=True,
    ).strip()
    if not result:
        raise RuntimeError("verification code not found in DB")
    return result


def main():
    verify = request("POST", "/auth/email-verifications", {"email": EMAIL})
    print(json.dumps({"verify": verify}, ensure_ascii=False))
    code = fetch_verification_code(EMAIL)
    request(
        "POST",
        "/auth/email-verifications/confirm",
        {"email": EMAIL, "code": code},
    )
    auth = request(
        "POST",
        "/auth/register",
        {
            "email": EMAIL,
            "password": PASSWORD,
            "fullName": "Test User",
            "birthDate": "1999-01-01",
            "gender": "MALE",
            "region": "서울",
            "signupPurposes": ["실패 이유를 찾아보고 싶어요"],
            "nickname": NICKNAME,
            "experienceStatus": "HAS_EXPERIENCE",
            "ageGroup": "20s",
        },
    )
    created = request(
        "POST",
        "/experiences",
        {
            "categoryId": 1,
            "title": "Codex bigint smoke",
            "content": "운영 bigint 생성 스모크 테스트입니다. 생성 후 바로 삭제합니다.",
            "businessType": "온라인 판매·이커머스",
            "investmentAmount": 5000000000,
            "durationMonths": 6,
            "weeklyHours": 28,
            "averageDailyHours": "THREE_TO_FIVE_HOURS",
            "isConcurrentWithMainJob": True,
            "monthlyRevenue": 7000000000,
            "failureReason": "Bigint smoke",
            "failureReasons": ["Bigint smoke"],
            "difficulties": ["Smoke"],
            "lessonsLearned": "Bigint accepted.",
            "wouldRetry": False,
            "targetMarket": "직장인",
            "marketingChannels": [],
        },
        auth["accessToken"],
    )
    request("DELETE", f"/experiences/{created['id']}", token=auth["accessToken"])
    print(
        json.dumps(
            {
                "email": EMAIL,
                "verificationCode": code,
                "nickname": NICKNAME,
                "experienceId": created["id"],
                "investmentAmount": 5000000000,
                "monthlyRevenue": 7000000000,
                "deleted": True,
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
