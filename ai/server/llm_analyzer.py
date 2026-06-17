import os
import json
from anthropic import Anthropic
from dotenv import load_dotenv

from server.mock_llm import get_mock_analysis
from server.explanation_builder import build_analysis_explanation

load_dotenv()

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

USE_MOCK_LLM = os.getenv("USE_MOCK_LLM", "false").lower() == "true"

# Claude한테 줄 시스템 프롬프트 (역할 + 출력 형식 지시)
# v2 (2026-06-10): keywords 본문 등장 단어 강제 + temperature 0.1 + few-shot
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

[중요 규칙]
- keywords는 사용자의 자유서술 본문에 **실제 등장한 단어 3개**만 추출하세요.
  본문에 없는 단어를 만들어내지 마세요. (예: 본문에 "구독자"라 적혀있으면 "구독자" 그대로 사용)
- 가능하면 명사 위주로, 본문 어절 그대로 잘라서 사용하세요.
- failure_category는 위 7개 중 정확히 하나만 선택하세요.
- risk_level은 위 3개 중 정확히 하나만 선택하세요.

[예시 — Good]
본문: "유튜브 채널 시작했는데 마케팅 비용이 부족해서 구독자가 안 늘었어요"
→ keywords: ["유튜브", "마케팅", "구독자"]  ✅ 본문에 다 등장

[예시 — Bad]
본문: "유튜브 채널 시작했는데 마케팅 비용이 부족해서 구독자가 안 늘었어요"
→ keywords: ["콘텐츠 전략", "SNS 마케팅", "타겟층"]  ❌ 본문에 없는 단어 생성"""


def analyze_experience(
    category: str,
    difficulties: list,
    difficulty_etc: str,
    difficulty_extra: str,
    duration_months: int,
    weekly_hours: int,
    free_text: str,
    similar_cases_used: list[str] | None = None,
) -> dict:
    """부업 실패 경험을 LLM으로 분석.

    Returns:
        {
            "keywords": [...],
            "failure_category": "...",
            "summary": "...",
            "risk_level": "...",
            "explanation": AnalysisExplanation  # PM-12 v3 P0 #1
        }
    """

    similar_cases_used = similar_cases_used or []

    if USE_MOCK_LLM:
        result = get_mock_analysis(category=category, free_text=free_text)
        result["explanation"] = build_analysis_explanation(
            input_used={
                "category": category,
                "body_excerpt": (free_text or "")[:120],
                "duration_months": duration_months,
                "weekly_hours": weekly_hours,
            },
            matched_patterns=result.get("keywords", []),
            similar_cases_used=similar_cases_used,
            confidence_score=0.5,  # Mock 응답은 신뢰도 낮게
            is_verified=False,
            model="mock",
            debug={"mock": True},
        )
        return result

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
        temperature=0.1,  # v2: 환각 감소 (기존 기본값 → 0.1)
        system=SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": user_prompt}
        ]
    )
    
    response_text = response.content[0].text.strip()

    # JSON 파싱 시도
    try:
        result = json.loads(response_text)
    except json.JSONDecodeError:
        # ```json ... ``` 형식으로 감싸져 있으면 정리
        if "```json" in response_text:
            cleaned = response_text.split("```json")[1].split("```")[0].strip()
            result = json.loads(cleaned)
        elif "```" in response_text:
            cleaned = response_text.split("```")[1].split("```")[0].strip()
            result = json.loads(cleaned)
        else:
            raise

    # PM-12 v3 P0 #1 — AnalysisExplanation 필드 추가
    result["explanation"] = build_analysis_explanation(
        input_used={
            "category": category,
            "body_excerpt": (free_text or "")[:120],
            "duration_months": duration_months,
            "weekly_hours": weekly_hours,
            "difficulties": difficulties or [],
        },
        matched_patterns=result.get("keywords", []),
        similar_cases_used=similar_cases_used,
        confidence_score=_risk_to_confidence(result.get("risk_level", "medium")),
        is_verified=True,
        model="claude-sonnet-4-5",
        debug={
            "failure_category": result.get("failure_category"),
            "tokens_in": response.usage.input_tokens,
            "tokens_out": response.usage.output_tokens,
        },
    )
    return result


def _risk_to_confidence(risk: str) -> float:
    """risk_level → confidence_score 단순 매핑 (AI-15 에이전트 B에서 정밀 평가)."""
    return {"high": 0.92, "medium": 0.78, "low": 0.60}.get(risk, 0.7)


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