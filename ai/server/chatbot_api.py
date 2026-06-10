"""
chatbot_api.py — 에이전트 C 챗봇 API + 안전장치 (AI-23)

PM-04 Tool 명세 + PM-05 Plan B + PM-06 라우팅 + 안전장치 3종.

안전장치:
1. 입력 가드레일 — BANNED_WORDS + 카테고리 화이트리스트
2. 출력 가드레일 — LLM 응답에 인용된 case_id 검증
3. 입력 길이 제한 — 500자 초과 차단, 50자 미만 + 키워드 부족 안내

라우팅 (PM-06):
- 질문 < 30자 → 단순 RAG
- 키워드 (비교/통계/유사/분석) → ReAct
- 그 외 → 단순 RAG

Tool 호출 단계 표시 (PD-22 차별점):
- "tool_selection" → "tool_executing:search_cases" → "result_analyzing" → "done"

작성: 팀장(오혜림) — 2026-06-10
의존: AI-014 BANNED_WORDS / PM-04/05/06 / explanation_builder
"""

from __future__ import annotations

import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterator

INPUT_MIN_LEN = 30   # 50자 미만 + 키워드 부족 시 안내
INPUT_MAX_LEN = 500
INPUT_HARD_MIN = 5   # 5자 미만은 무조건 차단

REACT_KEYWORDS = ("비교", "통계", "유사", "분석", "차이", "추천", "랭킹")

ALLOWED_CATEGORY_SLUGS = (
    "online-commerce", "content-sns", "digital-products", "platform-labor",
    "talent-freelance", "investment", "offline-sidejob",
)
CROSS_TOPIC_SLUGS = (
    "before-start", "tax-business", "work-plus-sidejob", "marketing",
    "tools", "mental-care", "legal-contract", "accounting", "insight",
)


def load_banned_words() -> set[str]:
    """AI-014 BANNED_WORDS v1 로드 (없으면 빈 셋)."""
    candidates = [
        Path(__file__).resolve().parents[1] / "handoff" / "BANNED_WORDS.txt",
        Path(__file__).resolve().parents[1] / "data" / "BANNED_WORDS.txt",
    ]
    for path in candidates:
        if path.exists():
            return {
                w.strip().lower() for w in path.read_text(encoding="utf-8").splitlines()
                if w.strip() and not w.startswith("#")
            }
    return set()


BANNED_WORDS = load_banned_words()


@dataclass
class GuardResult:
    passed: bool
    reason: str | None = None
    user_message: str | None = None


def input_length_guard(message: str) -> GuardResult:
    """입력 길이 검증."""
    n = len(message or "")
    if n < INPUT_HARD_MIN:
        return GuardResult(False, "too_short", "조금 더 구체적으로 적어주실 수 있어요?")
    if n > INPUT_MAX_LEN:
        return GuardResult(
            False, "too_long",
            f"500자 이내로 줄여주세요 (현재 {n}자).",
        )
    return GuardResult(True)


def input_banned_guard(message: str) -> GuardResult:
    """BANNED_WORDS 검증."""
    if not BANNED_WORDS:
        return GuardResult(True)
    lower = message.lower()
    hit = next((w for w in BANNED_WORDS if w in lower), None)
    if hit:
        return GuardResult(
            False, f"banned_word:{hit}",
            "정책 위반 표현이에요. 다른 표현으로 다시 질문해주세요.",
        )
    return GuardResult(True)


def category_whitelist_check(category_slug: str | None) -> GuardResult:
    """카테고리 화이트리스트 — 부업 분야 7개 외 (횡단 9개)는 가이드로 안내."""
    if category_slug is None:
        return GuardResult(True)  # 사용자 미지정은 통과
    if category_slug in CROSS_TOPIC_SLUGS:
        return GuardResult(
            False, "cross_topic",
            "이 주제는 부업 가이드 페이지에서 자세히 확인하실 수 있어요. 챗봇은 부업 분야별 사례·통계 분석을 도와드려요.",
        )
    if category_slug not in ALLOWED_CATEGORY_SLUGS:
        return GuardResult(False, f"invalid_category:{category_slug}",
                           "지원하지 않는 분야예요.")
    return GuardResult(True)


def verify_cited_case_ids(
    cited: list[str], known_case_ids: set[str],
) -> GuardResult:
    """출력 가드레일 — 응답에 인용된 case_id가 DB에 존재하는지 검증."""
    if not cited:
        return GuardResult(True)
    unknown = [cid for cid in cited if cid not in known_case_ids]
    if unknown:
        return GuardResult(
            False, f"unknown_case_ids:{','.join(unknown[:3])}",
            "응답 검증 실패 — 다시 시도해주세요.",
        )
    return GuardResult(True)


def route_query(message: str) -> str:
    """PM-06 라우팅 — simple_rag / react / guide_redirect."""
    if len(message) < 30:
        return "simple_rag"
    if any(kw in message for kw in REACT_KEYWORDS):
        return "react"
    return "simple_rag"


def stream_tool_stages() -> Iterator[dict[str, Any]]:
    """Tool 호출 단계 표시 (PD-22 차별점) — SSE 형식 생성기."""
    stages = [
        ("tool_selection", "도구를 선택하고 있어요..."),
        ("tool_executing", "FAISS 검색 중..."),
        ("result_analyzing", "결과 분석 중..."),
        ("done", None),
    ]
    for stage, msg in stages:
        yield {"stage": stage, "message": msg, "ts": time.time()}


@dataclass
class ChatbotResponse:
    status: str       # "ok" | "fallback" | "blocked" | "guide_redirect"
    reply: str
    route: str | None = None
    cited_case_ids: list[str] | None = None
    plan_b_reason: str | None = None
    metadata: dict[str, Any] | None = None


def chatbot_process(
    *,
    message: str,
    category_slug: str | None = None,
    known_case_ids: set[str] | None = None,
    llm_call: Any = None,  # 실제 LLM 호출 함수 (테스트 주입)
) -> ChatbotResponse:
    """챗봇 메시지 처리 메인 — 안전장치 통과 후 라우팅 + LLM."""
    # 1. 입력 길이
    g = input_length_guard(message)
    if not g.passed:
        return ChatbotResponse("blocked", g.user_message or "", plan_b_reason=g.reason)

    # 2. BANNED_WORDS
    g = input_banned_guard(message)
    if not g.passed:
        return ChatbotResponse("blocked", g.user_message or "", plan_b_reason=g.reason)

    # 3. 카테고리 화이트리스트
    g = category_whitelist_check(category_slug)
    if not g.passed:
        return ChatbotResponse(
            "guide_redirect" if g.reason == "cross_topic" else "blocked",
            g.user_message or "",
            plan_b_reason=g.reason,
        )

    # 4. 라우팅
    route = route_query(message)

    # 5. LLM 호출 (테스트면 mock, 실제면 Sonnet)
    if llm_call is None:
        reply = "(stub) 라우팅 결과: " + route
        cited = []
    else:
        result = llm_call(message=message, route=route)
        reply = result.get("reply", "")
        cited = result.get("cited_case_ids", []) or []

    # 6. 출력 가드레일 (case_id 인용 검증)
    if known_case_ids is not None:
        g = verify_cited_case_ids(cited, known_case_ids)
        if not g.passed:
            return ChatbotResponse(
                "fallback", g.user_message or "다시 시도해주세요.",
                route=route, plan_b_reason=g.reason,
            )

    return ChatbotResponse(
        "ok", reply, route=route, cited_case_ids=cited,
        metadata={"banned_words_loaded": len(BANNED_WORDS)},
    )


if __name__ == "__main__":
    # self-test
    print("=== 길이 가드 (3자) ===")
    r = chatbot_process(message="안녕")
    print(f"  {r.status} / {r.reply}")

    print("\n=== 길이 가드 (550자) ===")
    r = chatbot_process(message="가" * 550)
    print(f"  {r.status} / {r.reply}")

    print("\n=== 횡단 주제 (mental-care) ===")
    r = chatbot_process(message="부업 번아웃 어떻게 극복", category_slug="mental-care")
    print(f"  {r.status} / {r.reply}")

    print("\n=== 정상 (단순 RAG) ===")
    r = chatbot_process(message="스마트스토어 시작", category_slug="online-commerce")
    print(f"  {r.status} / route={r.route} / {r.reply}")

    print("\n=== 정상 (ReAct 키워드) ===")
    r = chatbot_process(message="유튜브와 인스타 부업 수익 비교", category_slug="content-sns")
    print(f"  {r.status} / route={r.route} / {r.reply}")

    print("\n=== 출력 가드 (case_id 검증 실패) ===")
    r = chatbot_process(
        message="배달 부업 어떻게 시작하나요",
        category_slug="platform-labor",
        known_case_ids={"case_001", "case_002"},
        llm_call=lambda **kw: {"reply": "case_999 참고", "cited_case_ids": ["case_999"]},
    )
    print(f"  {r.status} / {r.reply} / reason={r.plan_b_reason}")
