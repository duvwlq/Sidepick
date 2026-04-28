import os
import json
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# Claude한테 줄 시스템 프롬프트 (역할 + 출력 형식 지시)
SYSTEM_PROMPT = """당신은 부업 실패 사례를 분석하는 전문가입니다.
사용자가 작성한 부업 실패 경험을 읽고,
체크된 항목과 자유서술을 종합해서 분석한 후,
다음 JSON 형식으로만 응답하세요. 다른 설명 없이 JSON만 출력하세요.

{
  "keywords": ["키워드1", "키워드2", "키워드3"],
  "failure_category": "마케팅부족|자금부족|시간관리|타겟분석실패|경쟁분석부족|운영관리부족|기타",
  "summary": "1줄 요약 (50자 이내)",
  "risk_level": "high|medium|low"
}

failure_category는 위 7개 중 정확히 하나만 선택하세요.
risk_level은 위 3개 중 정확히 하나만 선택하세요.
keywords는 정확히 3개를 추출하세요."""


def analyze_experience(
    category: str,
    difficulties: list,
    difficulty_etc: str,
    difficulty_extra: str,
    duration_months: int,
    weekly_hours: int,
    free_text: str
) -> dict:
    """부업 실패 경험을 LLM으로 분석"""
    
    user_prompt = f"""
부업 카테고리: {category}
어려웠던 점 (체크): {', '.join(difficulties) if difficulties else '없음'}
어려웠던 점 (기타): {difficulty_etc or '없음'}
보조 서술: {difficulty_extra or '없음'}
부업 기간: {duration_months}개월
주당 할애 시간: {weekly_hours}시간
자유서술: {free_text}
"""

    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=500,
        system=SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": user_prompt}
        ]
    )
    
    response_text = response.content[0].text.strip()
    
    # JSON 파싱 시도
    try:
        result = json.loads(response_text)
        return result
    except json.JSONDecodeError:
        # ```json ... ``` 형식으로 감싸져 있으면 정리
        if "```json" in response_text:
            cleaned = response_text.split("```json")[1].split("```")[0].strip()
            return json.loads(cleaned)
        elif "```" in response_text:
            cleaned = response_text.split("```")[1].split("```")[0].strip()
            return json.loads(cleaned)
        raise


# 직접 실행하면 테스트 케이스 1개 돌림
if __name__ == "__main__":
    print("=" * 60)
    print("LLM 분석 테스트 - 유튜브 부업 실패 케이스")
    print("=" * 60)
    
    result = analyze_experience(
        category="유튜브",
        difficulties=["마케팅/홍보", "타겟 분석"],
        difficulty_etc="",
        difficulty_extra="구독자가 100명에서 안 늘어남",
        duration_months=6,
        weekly_hours=10,
        free_text="유튜브 채널을 시작했는데 영상은 가끔 올리고 구독자도 잘 안 늘었어요. 6개월 정도 해보다가 포기했습니다."
    )
    
    print("\n분석 결과 (JSON):")
    print("-" * 60)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    print("=" * 60)