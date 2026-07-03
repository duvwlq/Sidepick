import json
import urllib.request

payload = {
    "message": "초기 자본이 적을 때 현실적인 선택지가 있을까요?",
    "category_slug": "online-commerce",
}

request = urllib.request.Request(
    "http://127.0.0.1:8001/api/chatbot/message",
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"},
)

with urllib.request.urlopen(request, timeout=20) as response:
    print(response.read().decode("utf-8"))
