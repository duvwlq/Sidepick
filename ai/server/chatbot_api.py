from __future__ import annotations

import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterator

INPUT_MAX_LEN = 500
INPUT_HARD_MIN = 5

REACT_KEYWORDS = ("비교", "통계", "유사", "분석", "차이", "추천", "계산")

ALLOWED_CATEGORY_SLUGS = (
    "online-commerce",
    "content-sns",
    "digital-products",
    "platform-labor",
    "talent-freelance",
    "investment",
    "offline-sidejob",
)

GUIDE_CATEGORY_SLUGS = ALLOWED_CATEGORY_SLUGS + (
    "before-start",
    "tax-business",
    "work-plus-sidejob",
    "marketing",
    "tools",
    "mental-care",
    "legal-contract",
    "accounting",
    "insight",
)


def load_banned_words() -> set[str]:
    candidates = [
        Path(__file__).resolve().parents[1] / "handoff" / "BANNED_WORDS.txt",
        Path(__file__).resolve().parents[1] / "data" / "BANNED_WORDS.txt",
    ]
    for path in candidates:
        if path.exists():
            return {
                word.strip().lower()
                for word in path.read_text(encoding="utf-8").splitlines()
                if word.strip() and not word.startswith("#")
            }
    return set()


BANNED_WORDS = load_banned_words()


@dataclass
class GuardResult:
    passed: bool
    reason: str | None = None
    user_message: str | None = None


@dataclass
class ChatbotResponse:
    status: str
    reply: str
    route: str | None = None
    cited_case_ids: list[str] | None = None
    plan_b_reason: str | None = None
    metadata: dict[str, Any] | None = None


def input_length_guard(message: str) -> GuardResult:
    length = len(message or "")
    if length < INPUT_HARD_MIN:
        return GuardResult(False, "too_short", "조금 더 구체적으로 적어주실 수 있을까요?")
    if length > INPUT_MAX_LEN:
        return GuardResult(False, "too_long", f"500자 이내로 줄여주세요. 현재 {length}자예요.")
    return GuardResult(True)


def input_banned_guard(message: str) -> GuardResult:
    if not BANNED_WORDS:
        return GuardResult(True)
    lowered = message.lower()
    hit = next((word for word in BANNED_WORDS if word in lowered), None)
    if hit:
        return GuardResult(
            False,
            f"banned_word:{hit}",
            "정책상 제한된 표현이 있어요. 다른 표현으로 다시 질문해주세요.",
        )
    return GuardResult(True)


def category_whitelist_check(category_slug: str | None) -> GuardResult:
    if category_slug is None:
        return GuardResult(True)
    if category_slug not in GUIDE_CATEGORY_SLUGS:
        return GuardResult(False, f"invalid_category:{category_slug}", "지원하지 않는 분야예요.")
    return GuardResult(True)


def verify_cited_case_ids(cited: list[str], allowed_case_ids: set[str]) -> GuardResult:
    if not cited:
        return GuardResult(True)
    unknown = [case_id for case_id in cited if case_id not in allowed_case_ids]
    if unknown:
        return GuardResult(
            False,
            f"unknown_case_ids:{','.join(unknown[:3])}",
            "응답 검증에 실패해서 일반 안내로 전환됐어요. 다시 질문해주세요.",
        )
    return GuardResult(True)


def route_query(message: str) -> str:
    if len(message) < 30:
        return "simple_rag"
    if any(keyword in message for keyword in REACT_KEYWORDS):
        return "react"
    return "simple_rag"


def stream_tool_stages() -> Iterator[dict[str, Any]]:
    stages = [
        ("tool_selection", "도구를 선택하고 있어요."),
        ("tool_executing", "검색 중이에요."),
        ("result_analyzing", "결과를 정리하고 있어요."),
        ("done", None),
    ]
    for stage, message in stages:
        yield {"stage": stage, "message": message, "ts": time.time()}


def chatbot_process(
    *,
    message: str,
    category_slug: str | None = None,
    preferred_route: str | None = None,
    known_case_ids: set[str] | None = None,
    llm_call: Any = None,
) -> ChatbotResponse:
    for guard in (
        input_length_guard(message),
        input_banned_guard(message),
        category_whitelist_check(category_slug),
    ):
        if not guard.passed:
            return ChatbotResponse("blocked", guard.user_message or "", plan_b_reason=guard.reason)

    route = preferred_route or route_query(message)

    if llm_call is None:
        return ChatbotResponse(
            "fallback",
            "지금은 챗봇 연결이 준비되지 않았어요. 잠시 후 다시 시도해주세요.",
            route=route,
            plan_b_reason="missing_llm_call",
        )

    llm_result = llm_call(message=message, route=route)
    reply = llm_result.get("reply", "")
    cited_case_ids = llm_result.get("cited_case_ids", []) or []
    upstream_status = llm_result.get("status")
    if upstream_status is None:
        upstream_status = "fallback" if llm_result.get("error") else "ok"

    if upstream_status != "ok":
        return ChatbotResponse(
            "fallback",
            reply or "지금은 답변을 만들지 못했어요. 잠시 후 다시 시도해주세요.",
            route=route,
            cited_case_ids=cited_case_ids,
            plan_b_reason=llm_result.get("error") or f"llm_{upstream_status}",
            metadata={"banned_words_loaded": len(BANNED_WORDS)},
        )

    if known_case_ids is not None:
        validation = verify_cited_case_ids(cited_case_ids, known_case_ids)
        if not validation.passed:
            return ChatbotResponse(
                "fallback",
                validation.user_message or "다시 시도해주세요.",
                route=route,
                plan_b_reason=validation.reason,
                metadata={"banned_words_loaded": len(BANNED_WORDS)},
            )

    return ChatbotResponse(
        "ok",
        reply,
        route=route,
        cited_case_ids=cited_case_ids,
        metadata={"banned_words_loaded": len(BANNED_WORDS)},
    )
