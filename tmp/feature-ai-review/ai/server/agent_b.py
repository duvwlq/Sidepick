"""
agent_b.py — 에이전트 B 자기검증 루프 (AI-15)

PDF 명세:
- 신뢰도 < 0.7 발동
- 재생성 1회
- 결과 캐싱 (analysis_id 기준)
- 재생성 후에도 미달 시 Plan B fallback

평가 항목:
1. case_id 인용 정확도 (응답에 인용된 case_id가 similar_cases_used 안에 있는지)
2. 카테고리 분류 정확도 (failure_category 화이트리스트)
3. 본문 매칭 (keywords가 본문에 substring으로 존재)

작성: 팀장(오혜림) — 2026-06-10
의존: AI-04 / AI-05 / AI-17 explanation 빌더
"""

from __future__ import annotations

import hashlib
import time
from dataclasses import dataclass, field
from typing import Any, Callable

CONFIDENCE_THRESHOLD = 0.7
MAX_REGENERATIONS = 1

ALLOWED_FAILURE_CATEGORIES = {
    "마케팅부족", "자금부족", "시간관리",
    "타겟분석실패", "경쟁분석부족", "운영관리부족", "기타",
}


@dataclass
class VerificationResult:
    confidence: float
    issues: list[str] = field(default_factory=list)
    passed: bool = False
    regenerated: bool = False
    plan_b_triggered: bool = False
    plan_b_reason: str | None = None


class AgentBCache:
    """analysis_id 기반 결과 캐시 (in-memory)."""

    def __init__(self, ttl_sec: int = 86400):
        self._store: dict[str, tuple[float, dict[str, Any]]] = {}
        self._ttl = ttl_sec

    def get(self, key: str) -> dict[str, Any] | None:
        item = self._store.get(key)
        if item is None:
            return None
        ts, value = item
        if time.time() - ts > self._ttl:
            self._store.pop(key, None)
            return None
        return value

    def set(self, key: str, value: dict[str, Any]) -> None:
        self._store[key] = (time.time(), value)


def make_analysis_id(category: str, body: str) -> str:
    """캐시 키 = hash(category + body)."""
    raw = f"{category}|{body}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()[:16]


def evaluate_confidence(
    *,
    result: dict[str, Any],
    full_text: str,
) -> VerificationResult:
    """분석 결과 신뢰도 평가."""
    issues: list[str] = []

    # 1) failure_category 화이트리스트
    cat = result.get("failure_category")
    if cat not in ALLOWED_FAILURE_CATEGORIES:
        issues.append(f"invalid_failure_category:{cat}")

    # 2) keywords 본문 매칭 (적어도 1개는 본문에 substring)
    keywords = result.get("keywords") or []
    body_lower = (full_text or "").lower()
    matched = sum(1 for k in keywords if k and k.lower() in body_lower)
    if keywords and matched == 0:
        issues.append("no_keyword_in_body")

    # 3) explanation 필드 존재
    expl = result.get("explanation")
    if not expl or not isinstance(expl, dict):
        issues.append("missing_explanation")
        base_conf = 0.4
    else:
        base_conf = float(expl.get("confidence_score", 0.7))

    # 페널티
    confidence = base_conf
    if "invalid_failure_category" in " ".join(issues):
        confidence -= 0.25
    if "no_keyword_in_body" in issues:
        confidence -= 0.15
    confidence = max(0.0, min(1.0, confidence))

    return VerificationResult(
        confidence=round(confidence, 3),
        issues=issues,
        passed=confidence >= CONFIDENCE_THRESHOLD and not issues,
    )


def verify_and_regenerate(
    *,
    result: dict[str, Any],
    full_text: str,
    regenerate: Callable[[], dict[str, Any]] | None = None,
    cache: AgentBCache | None = None,
    analysis_id: str | None = None,
) -> tuple[dict[str, Any], VerificationResult]:
    """자기검증 루프 진입점.

    1. confidence < 0.7 → regenerate() 호출 (1회)
    2. 재생성 후에도 미달 → Plan B fallback (analysis_id로 캐시 hit 검사)
    """
    # 캐시 hit
    if cache and analysis_id:
        cached = cache.get(analysis_id)
        if cached:
            return cached, VerificationResult(confidence=1.0, passed=True, issues=["cache_hit"])

    verdict = evaluate_confidence(result=result, full_text=full_text)

    if verdict.passed:
        if cache and analysis_id:
            cache.set(analysis_id, result)
        return result, verdict

    # 재생성 1회
    if regenerate is not None:
        new_result = regenerate()
        verdict_new = evaluate_confidence(result=new_result, full_text=full_text)
        verdict_new.regenerated = True
        if verdict_new.passed:
            if cache and analysis_id:
                cache.set(analysis_id, new_result)
            return new_result, verdict_new
        # 재생성 후에도 미달 → Plan B
        verdict_new.plan_b_triggered = True
        verdict_new.plan_b_reason = "confidence_below_threshold_after_regenerate"
        return new_result, verdict_new

    # regenerate 함수 없으면 Plan B fallback
    verdict.plan_b_triggered = True
    verdict.plan_b_reason = "confidence_below_threshold"
    return result, verdict


if __name__ == "__main__":
    # 빠른 self-test
    sample = {
        "keywords": ["마케팅", "구독자", "꾸준함"],
        "failure_category": "마케팅부족",
        "summary": "유튜브 구독자 안 늘어남",
        "risk_level": "medium",
        "explanation": {"confidence_score": 0.8},
    }
    verdict = evaluate_confidence(
        result=sample,
        full_text="유튜브 채널 마케팅이 부족해서 구독자가 100명에서 안 늘어남",
    )
    print(f"confidence={verdict.confidence} passed={verdict.passed} issues={verdict.issues}")
