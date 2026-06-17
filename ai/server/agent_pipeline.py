"""
agent_pipeline.py — 에이전트 A + B 통합 파이프라인 (AI-20)

흐름:
1. 에이전트 A: 사용자 글 작성 → 부족 슬롯 감지 → 질문 카드 3~5개
2. 사용자 답변 보완 후 분석 호출 (llm_analyzer)
3. 에이전트 B: confidence 평가 (< 0.7 재생성)
4. 재생성 1회 후 미달 → Plan B fallback
5. 결과 캐싱 (analysis_id 기준)

작성: 팀장(오혜림) — 2026-06-10
의존: AI-15 agent_b / AI-16 spec / AI-17 explanation_builder / llm_analyzer
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable

from server.agent_b import (
    AgentBCache,
    VerificationResult,
    make_analysis_id,
    verify_and_regenerate,
)

# ===== 에이전트 A (글 작성 보조) =====

# AI-16 spec v1.1 — slot 8종 enum
SLOTS = {
    "category", "duration", "daily_hours", "invest_amount",
    "revenue_amount", "failure_reasons", "difficulties", "body_richness",
}

# 본문 키워드 (failure_reasons / difficulties 슬롯 감지)
FAILURE_KEYWORDS = {
    "마케팅": "마케팅 / 광고 / 홍보 / 노출 / SNS",
    "시장 조사": "조사 / 트렌드 / 시장 / 경쟁 / 수요",
    "실행력": "꾸준 / 지속 / 포기 / 미루 / 의지",
    "자본": "자본 / 자금 / 투자비 / 비용 / 예산",
    "시간": "시간 / 본업 / 병행 / 체력 / 바쁘",
    "경쟁": "경쟁 / 레드오션 / 포화",
}
DIFFICULTY_KEYWORDS = (
    "고객", "마케팅", "수익", "시간", "운영", "정보", "경쟁", "멘탈", "번아웃",
)
BODY_RICHNESS_MIN_LEN = 50


@dataclass
class DraftMeta:
    category: str | None
    duration: str | None
    daily_hours: str | None
    invest_amount: int | None
    revenue_amount: int | None
    has_main_job: bool | None
    body: str


def detect_missing_slots(draft: DraftMeta) -> list[str]:
    """초안 분석 → 부족한 슬롯 ID 리스트 반환."""
    missing: list[str] = []
    # 메타 5종
    if not draft.duration:
        missing.append("duration")
    if not draft.daily_hours:
        missing.append("daily_hours")
    if draft.invest_amount is None:
        missing.append("invest_amount")
    if draft.revenue_amount is None:
        missing.append("revenue_amount")

    # 본문 키워드 분석 (failure_reasons / difficulties)
    body_lower = (draft.body or "").lower()
    has_failure_kw = any(
        any(w in body_lower for w in kws.split(" / "))
        for kws in FAILURE_KEYWORDS.values()
    )
    if not has_failure_kw:
        missing.append("failure_reasons")
    has_diff_kw = any(w in body_lower for w in DIFFICULTY_KEYWORDS)
    if not has_diff_kw:
        missing.append("difficulties")

    # 본문 풍부도
    if len(draft.body or "") < BODY_RICHNESS_MIN_LEN:
        missing.append("body_richness")

    return missing


def needs_questions(draft: DraftMeta) -> bool:
    """질문 카드 생성 필요 여부 (부족 슬롯 2개 이상)."""
    return len(detect_missing_slots(draft)) >= 2


# ===== 통합 파이프라인 =====

_default_cache = AgentBCache()


def run_pipeline(
    *,
    category: str,
    body: str,
    duration_months: int,
    weekly_hours: int,
    difficulties: list[str],
    difficulty_etc: str = "",
    difficulty_extra: str = "",
    similar_cases_used: list[str] | None = None,
    cache: AgentBCache | None = None,
    analyzer: Callable[..., dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """에이전트 A → 분석 → 에이전트 B 통합 파이프라인.

    Args:
        analyzer: llm_analyzer.analyze_experience 또는 mock. 테스트 주입용.
    """
    if analyzer is None:
        # 지연 import (순환 방지)
        from server.llm_analyzer import analyze_experience
        analyzer = analyze_experience

    cache = cache or _default_cache
    aid = make_analysis_id(category, body)

    def _call():
        return analyzer(
            category=category,
            difficulties=difficulties,
            difficulty_etc=difficulty_etc,
            difficulty_extra=difficulty_extra,
            duration_months=duration_months,
            weekly_hours=weekly_hours,
            free_text=body,
            similar_cases_used=similar_cases_used or [],
        )

    initial = _call()
    final, verdict = verify_and_regenerate(
        result=initial,
        full_text=body,
        regenerate=_call,
        cache=cache,
        analysis_id=aid,
    )

    return {
        "result": final,
        "verification": {
            "confidence": verdict.confidence,
            "passed": verdict.passed,
            "regenerated": verdict.regenerated,
            "plan_b_triggered": verdict.plan_b_triggered,
            "plan_b_reason": verdict.plan_b_reason,
            "issues": verdict.issues,
        },
        "analysis_id": aid,
    }


if __name__ == "__main__":
    # 부족 슬롯 감지 self-test
    test_draft = DraftMeta(
        category="content-sns",
        duration=None,
        daily_hours="1~3시간",
        invest_amount=0,
        revenue_amount=None,
        has_main_job=True,
        body="유튜브 했어요",
    )
    missing = detect_missing_slots(test_draft)
    print(f"부족 슬롯: {missing}")
    print(f"질문 카드 필요: {needs_questions(test_draft)}")
