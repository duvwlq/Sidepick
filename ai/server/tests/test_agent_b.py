"""AI-15 단위 테스트 5종 — 정상 / 신뢰도 미달 / 재생성 / 캐시 hit / Plan B."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from server.agent_b import (  # noqa: E402
    AgentBCache,
    evaluate_confidence,
    make_analysis_id,
    verify_and_regenerate,
)


def _make_result(*, confidence: float = 0.85, failure_category: str = "마케팅부족",
                 keywords: list[str] | None = None):
    return {
        "keywords": keywords or ["마케팅", "구독자", "꾸준함"],
        "failure_category": failure_category,
        "summary": "유튜브 구독자 안 늘어남",
        "risk_level": "medium",
        "explanation": {"confidence_score": confidence},
    }


FULL_TEXT_GOOD = "유튜브 채널 마케팅이 부족해서 구독자가 100명에서 안 늘어남. 꾸준함도 부족"
FULL_TEXT_BAD = "그냥 부업했어요"


def test_1_normal_pass():
    """정상 — confidence 0.85, 키워드 본문 매칭 OK → passed=True"""
    result = _make_result(confidence=0.85)
    verdict = evaluate_confidence(result=result, full_text=FULL_TEXT_GOOD)
    assert verdict.passed is True, f"expected passed=True, got {verdict}"
    assert verdict.confidence >= 0.7
    assert verdict.issues == []
    print("✅ test_1_normal_pass")


def test_2_low_confidence():
    """신뢰도 미달 — confidence 0.4 → passed=False"""
    result = _make_result(confidence=0.4)
    verdict = evaluate_confidence(result=result, full_text=FULL_TEXT_GOOD)
    assert verdict.passed is False
    assert verdict.confidence < 0.7
    print("✅ test_2_low_confidence")


def test_3_regenerate_pass():
    """재생성 시 통과 — 첫 호출은 미달, 재생성은 통과"""
    bad = _make_result(confidence=0.4)
    good = _make_result(confidence=0.88)

    final, verdict = verify_and_regenerate(
        result=bad,
        full_text=FULL_TEXT_GOOD,
        regenerate=lambda: good,
    )
    assert verdict.regenerated is True
    assert verdict.passed is True
    assert final["explanation"]["confidence_score"] == 0.88
    print("✅ test_3_regenerate_pass")


def test_4_cache_hit():
    """캐시 hit — 두 번째 호출은 캐시 반환"""
    cache = AgentBCache()
    result = _make_result(confidence=0.9)
    aid = make_analysis_id("content-sns", FULL_TEXT_GOOD)

    final1, verdict1 = verify_and_regenerate(
        result=result, full_text=FULL_TEXT_GOOD, cache=cache, analysis_id=aid,
    )
    assert verdict1.passed is True
    assert "cache_hit" not in verdict1.issues

    final2, verdict2 = verify_and_regenerate(
        result=_make_result(confidence=0.1),  # 일부러 미달 데이터
        full_text=FULL_TEXT_GOOD, cache=cache, analysis_id=aid,
    )
    assert "cache_hit" in verdict2.issues
    assert final2 is final1
    print("✅ test_4_cache_hit")


def test_5_plan_b_fallback():
    """재생성 후에도 미달 → Plan B trigger"""
    bad1 = _make_result(confidence=0.3, keywords=["존재하지않는단어"])
    bad2 = _make_result(confidence=0.4, keywords=["없는단어"])

    final, verdict = verify_and_regenerate(
        result=bad1,
        full_text=FULL_TEXT_BAD,
        regenerate=lambda: bad2,
    )
    assert verdict.plan_b_triggered is True
    assert verdict.plan_b_reason == "confidence_below_threshold_after_regenerate"
    assert verdict.regenerated is True
    print("✅ test_5_plan_b_fallback")


if __name__ == "__main__":
    test_1_normal_pass()
    test_2_low_confidence()
    test_3_regenerate_pass()
    test_4_cache_hit()
    test_5_plan_b_fallback()
    print("\n🎉 모든 단위 테스트 5종 통과")
