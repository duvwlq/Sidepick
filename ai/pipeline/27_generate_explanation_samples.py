"""
27_generate_explanation_samples.py — AI-22 PM-12 v3 explanation 응답 샘플 7종 생성

PM-12 v3 P0 3곳에 대한 BE-30/31 + BE-22 통계 API 검수용 응답 샘플.

샘플 구성 (7종):
- 분석: 2종 (정상 / Plan B fallback)
- 유사사례: 2종 (정상 / 카테고리 불일치)
- 통계: 3종 (sufficient / insufficient / 다른 chart_type)

작성: 팀장(오혜림) — 2026-06-10
의존: ai/server/explanation_builder.py / PM-12 v3
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "ai"))

from server.explanation_builder import (  # noqa: E402
    build_analysis_explanation,
    build_similar_case_explanation,
    build_stats_explanation,
)

OUTPUT_PATH = REPO_ROOT / "ai" / "data" / "explanation_samples.json"
KST = timezone(timedelta(hours=9))
NOW = datetime.now(KST).isoformat(timespec="seconds")


def main() -> None:
    samples = {
        "version": "PM-12-v3",
        "generated_at": NOW,
        "purpose": "BE-30/31 + BE-22 통계 API explanation 필드 검수용",
        "p0_1_analysis": [
            {
                "case": "정상 응답 — content-sns 분석",
                "explanation": build_analysis_explanation(
                    input_used={
                        "category": "content-sns",
                        "body_excerpt": "유튜브 채널 시작했는데 6개월 만에 구독자 50명",
                        "duration_months": 6,
                        "weekly_hours": 10,
                        "difficulties": ["마케팅/홍보", "타겟 분석"],
                    },
                    matched_patterns=["마케팅 부족", "꾸준한 업로드"],
                    similar_cases_used=["blog_002", "pickply_4", "blog_064"],
                    confidence_score=0.87,
                    debug={"failure_category": "마케팅부족", "tokens_in": 850, "tokens_out": 320},
                ),
            },
            {
                "case": "Plan B fallback — 신뢰도 미달 후 재생성도 실패",
                "explanation": build_analysis_explanation(
                    input_used={"category": "etc", "body_excerpt": "그냥 부업했어요"},
                    matched_patterns=[],
                    similar_cases_used=[],
                    confidence_score=0.42,
                    is_verified=False,
                    debug={"plan_b_triggered": True, "plan_b_reason": "confidence_below_threshold_after_regenerate"},
                ),
            },
        ],
        "p0_2_similar_cases": [
            {
                "case": "정상 — 카테고리 일치 + 높은 유사도",
                "explanation": build_similar_case_explanation(
                    case_id="blog_002",
                    similarity_score=0.92,
                    matched_keywords=["유튜브", "구독자", "꾸준한 업로드", "마케팅"],
                    category_match=True,
                    source="blog",
                    debug={"vector_index": 14, "rank": 1},
                ),
            },
            {
                "case": "카테고리 불일치 경고",
                "explanation": build_similar_case_explanation(
                    case_id="pickply_27",
                    similarity_score=0.71,
                    matched_keywords=["배달", "수익"],
                    category_match=False,
                    source="pickply",
                    debug={"vector_index": 89, "rank": 3, "category_mismatch": "platform-labor vs content-sns"},
                ),
            },
        ],
        "p0_3_stats": [
            {
                "case": "sufficient — content-sns TOP3 패턴",
                "explanation": build_stats_explanation(
                    total_cases=23,
                    data_sources=[{"source": "pickply", "count": 23}],
                    last_updated=NOW,
                    sufficient_data=True,
                    chart_type="top3_pattern",
                    category_slug="content-sns",
                ),
            },
            {
                "case": "insufficient — digital-products (n=1)",
                "explanation": build_stats_explanation(
                    total_cases=1,
                    data_sources=[{"source": "pickply", "count": 1}],
                    last_updated=NOW,
                    sufficient_data=False,
                    chart_type="pattern_ratio",
                    category_slug="digital-products",
                ),
            },
            {
                "case": "sufficient — investment 시점 분포",
                "explanation": build_stats_explanation(
                    total_cases=25,
                    data_sources=[{"source": "pickply", "count": 25}],
                    last_updated=NOW,
                    sufficient_data=True,
                    chart_type="timing_distribution",
                    category_slug="investment",
                ),
            },
        ],
    }

    samples["counts"] = {
        "p0_1_analysis": len(samples["p0_1_analysis"]),
        "p0_2_similar_cases": len(samples["p0_2_similar_cases"]),
        "p0_3_stats": len(samples["p0_3_stats"]),
        "total": (
            len(samples["p0_1_analysis"])
            + len(samples["p0_2_similar_cases"])
            + len(samples["p0_3_stats"])
        ),
    }

    OUTPUT_PATH.write_text(json.dumps(samples, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✅ {OUTPUT_PATH}")
    print(f"📊 샘플 수: P0 #1 {samples['counts']['p0_1_analysis']} / "
          f"P0 #2 {samples['counts']['p0_2_similar_cases']} / "
          f"P0 #3 {samples['counts']['p0_3_stats']} = 총 {samples['counts']['total']}종")


if __name__ == "__main__":
    main()
