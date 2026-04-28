import os
from anthropic import Anthropic
from dotenv import load_dotenv

# .env 파일에서 API 키 불러오기
load_dotenv()

# Anthropic 클라이언트 생성
client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# Claude한테 간단한 질문 보내기
response = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=100,
    messages=[
        {"role": "user", "content": "안녕! 한 문장으로 답해줘."}
    ]
)

# 답변 출력
print("=" * 50)
print("Claude 답변:")
print("=" * 50)
print(response.content[0].text)
print("=" * 50)