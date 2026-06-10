"""
explanation_builder.py — PM-12 v3 explanation 빌더 (AI-17)

PM-12 v3에서 합의한 3종 explanation 필드 생성:
1. AnalysisExplanation (P0 #1 — AI 분석 결과)
2. SimilarCaseExplanation (P0 #2 — 유사 사례 카드)
3. StatsExplanation (P0 #3 — 통계 그래프, v3 추가)

응답 BE-30/31 + BE-22 통계 API에서 그대로 통과.
FE 모달은 _debug 필드 제외 + 사용자 친화 변환.

작성: 팀장(오혜림) — 2026-06-10
의존: PM-12 v3 스키마
"""

from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import Any
import uuid

KST = timezone(timedelta(hours=9))

ALLOWED_CHART_TYPES = ("top3_pattern", "pattern_ratio", "timing_distribution")
ALLOWED_CATEGORY_SLUGS = (
    "online-commerce", "content-sns", "digital-products", "platform-labor",
    "talent-freelance", "investment", "offline-sidejob", "etc",
)


def _base_meta(model: str = "claude-sonnet-4-5") -> dict[str, Any]:
    """PM-12 ExplanationBase 공통 필드."""
    return {
        "generated_at": datetime.now(KST).isoformat(timespec="seconds"),
        "explanation_id": str(uuid.uuid4()),
        "model": model,
    }


def build_analysis_explanation(
    *,
    input_used: dict[str, Any],
    matched_patterns: list[str],
    similar_cases_used: list[str],
    confidence_score: float,
    is_verified: bool = True,
    model: str = "claude-sonnet-4-5",
    debug: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """P0 #1 — AnalysisExplanation."""
    return {
        **_base_meta(model),
        "input_used": input_used,
        "matched_patterns": matched_patterns,
        "similar_cases_used": similar_cases_used,
        "confidence_score": round(float(confidence_score), 3),
        "is_verified": bool(is_verified),
        "_debug": debug or {},
    }


def build_similar_case_explanation(
    *,
    case_id: str,
    similarity_score: float,
    matched_keywords: list[str],
    category_match: bool,
    source: str,
    model: str = "sbert-faiss",
    debug: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """P0 #2 — SimilarCaseExplanation."""
    return {
        **_base_meta(model),
        "case_id": case_id,
        "similarity_score": round(float(similarity_score), 3),
        "matched_keywords": matched_keywords,
        "category_match": bool(category_match),
        "source": source,
        "_debug": debug or {},
    }


def build_stats_explanation(
    *,
    total_cases: int,
    data_sources: list[dict[str, Any]],
    last_updated: str,
    sufficient_data: bool,
    min_sample_size: int = 10,
    chart_type: str,
    category_slug: str,
    primary_source: str = "pickply_survey",
    insufficient_message: str | None = None,
    debug: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """P0 #3 — StatsExplanation (v3 추가)."""
    if chart_type not in ALLOWED_CHART_TYPES:
        raise ValueError(f"invalid chart_type: {chart_type}")
    if category_slug not in ALLOWED_CATEGORY_SLUGS:
        raise ValueError(f"invalid category_slug: {category_slug}")

    payload: dict[str, Any] = {
        **_base_meta("stats-aggregator"),
        "total_cases": int(total_cases),
        "data_source": {
            "primary": primary_source,
            "sources_breakdown": data_sources,
        },
        "last_updated": last_updated,
        "sufficient_data": bool(sufficient_data),
        "min_sample_size": int(min_sample_size),
        "chart_type": chart_type,
        "category_slug": category_slug,
        "_debug": debug or {},
    }
    if not sufficient_data:
        payload["insufficient_message"] = (
            insufficient_message
            or f"데이터 수집 중이에요 ({min_sample_size}건 이상 모이면 차트 표시)"
        )
    return payload


if __name__ == "__main__":
    import json

    print("=== AnalysisExplanation ===")
    print(json.dumps(
        build_analysis_explanation(
            input_used={"category": "content-sns", "body_excerpt": "본문 발췌..."},
            matched_patterns=["마케팅 부족", "시간 관리"],
            similar_cases_used=["case_001", "case_002"],
            confidence_score=0.87,
        ),
        ensure_ascii=False, indent=2,
    ))

    print("\n=== SimilarCaseExplanation ===")
    print(json.dumps(
        build_similar_case_explanation(
            case_id="blog_002",
            similarity_score=0.92,
            matched_keywords=["유튜브", "구독자", "꾸준한 업로드"],
            category_match=True,
            source="blog",
        ),
        ensure_ascii=False, indent=2,
    ))

    print("\n=== StatsExplanation (sufficient) ===")
    print(json.dumps(
        build_stats_explanation(
            total_cases=23,
            data_sources=[{"source": "pickply", "count": 23}],
            last_updated=datetime.now(KST).isoformat(timespec="seconds"),
            sufficient_data=True,
            chart_type="top3_pattern",
            category_slug="content-sns",
        ),
        ensure_ascii=False, indent=2,
    ))

    print("\n=== StatsExplanation (insufficient) ===")
    print(json.dumps(
        build_stats_explanation(
            total_cases=1,
            data_sources=[{"source": "pickply", "count": 1}],
            last_updated=datetime.now(KST).isoformat(timespec="seconds"),
            sufficient_data=False,
            chart_type="pattern_ratio",
            category_slug="digital-products",
        ),
        ensure_ascii=False, indent=2,
    ))
