"""
28_hallucination_test_50.py — AI-21 50시나리오 환각율 측정

평가 항목:
1. case_id 인용 정확도 (similar_cases_used가 실제 case DB에 존재)
2. 카테고리 정확도 (failure_category 화이트리스트 + true_label 비교)
3. 본문 키워드 매칭 (keywords가 사용자 본문에 substring)
4. 에이전트 B 신뢰도 점수 분포
5. Plan B 트리거 분포 (5가지 + 추가 사유)

출력: ai/data/hallucination_report.json (PM-21 리포트 입력)

작성: 팀장(오혜림) — 2026-06-10
의존: AI-20 통합 파이프라인 + AI-17 explanation 빌더 + AI-15 agent_b
"""

from __future__ import annotations

import csv
import json
import os
import sys
import time
from collections import Counter
from datetime import datetime, timezone, timedelta
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "ai"))

from dotenv import load_dotenv  # noqa: E402
load_dotenv(REPO_ROOT / "ai" / ".env")

from server.agent_pipeline import run_pipeline  # noqa: E402

INPUT_PATH = REPO_ROOT / "ai" / "data" / "test_scenarios_50.csv"
KNOWN_CASES_PATH = REPO_ROOT / "ai" / "data" / "case_metadata_v2.json"
OUTPUT_PATH = REPO_ROOT / "ai" / "data" / "hallucination_report.json"

KST = timezone(timedelta(hours=9))

ALLOWED_FAILURE_CATEGORIES = {
    "마케팅부족", "자금부족", "시간관리",
    "타겟분석실패", "경쟁분석부족", "운영관리부족", "기타",
}

# AI-10 라벨 → 사이드픽 failure_category 매핑 (라벨링 결과 검증용)
LABEL_HINT = {
    "success": None,  # 성공글은 실패 카테고리 분류 무의미
    "ambiguous": None,
    "fail": None,
}


def load_scenarios() -> list[dict]:
    with INPUT_PATH.open(encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def load_known_cases() -> set[str]:
    if not KNOWN_CASES_PATH.exists():
        return set()
    meta = json.loads(KNOWN_CASES_PATH.read_text(encoding="utf-8"))
    return {c["case_id"] for c in meta.get("cases", [])}


def evaluate_response(
    *, response: dict, full_text: str, known_case_ids: set[str], true_label: str,
) -> dict:
    """단일 응답 평가 — 환각율 지표."""
    result = response.get("result", {})
    verification = response.get("verification", {})

    # 1. case_id 인용 정확도
    expl = result.get("explanation", {})
    cited = expl.get("similar_cases_used") or []
    unknown_cites = [c for c in cited if c not in known_case_ids]
    cite_accuracy = 1.0 if not cited else (len(cited) - len(unknown_cites)) / len(cited)

    # 2. 카테고리 정확도
    cat = result.get("failure_category")
    category_in_whitelist = cat in ALLOWED_FAILURE_CATEGORIES

    # 3. 본문 키워드 매칭
    keywords = result.get("keywords") or []
    body_lower = (full_text or "").lower()
    matched_kw = [k for k in keywords if k and k.lower() in body_lower]
    keyword_match_ratio = len(matched_kw) / max(1, len(keywords))

    # 4. 신뢰도 / Plan B
    confidence = verification.get("confidence", 0.0)
    plan_b = verification.get("plan_b_triggered", False)
    plan_b_reason = verification.get("plan_b_reason")

    # 5. 환각 의심 (3가지 중 어느 하나라도 위반)
    hallucination_flag = (
        not category_in_whitelist
        or unknown_cites
        or keyword_match_ratio < 0.3  # 키워드 30% 미만이면 환각 의심
    )

    return {
        "cite_accuracy": round(cite_accuracy, 3),
        "unknown_cite_count": len(unknown_cites),
        "category_in_whitelist": category_in_whitelist,
        "keyword_match_ratio": round(keyword_match_ratio, 3),
        "confidence": confidence,
        "plan_b_triggered": plan_b,
        "plan_b_reason": plan_b_reason,
        "hallucination_flag": hallucination_flag,
        "true_label": true_label,
    }


def main() -> None:
    if not os.getenv("ANTHROPIC_API_KEY"):
        print("❌ ANTHROPIC_API_KEY 없음", file=sys.stderr)
        sys.exit(1)

    scenarios = load_scenarios()
    known_cases = load_known_cases()
    print(f"📊 시나리오 {len(scenarios)}건 / 알려진 case_id {len(known_cases)}건")

    results: list[dict] = []
    plan_b_reasons: Counter = Counter()
    halluc_count = 0
    confidence_dist: list[float] = []
    t_start = time.time()

    for i, sc in enumerate(scenarios, 1):
        cid = sc["case_id"]
        body = sc.get("full_text", "")[:2000]
        true_label = sc.get("true_label", "")
        category_slug = sc.get("category_slug") or "etc"

        print(f"[{i}/{len(scenarios)}] {cid} ({category_slug})...", end=" ", flush=True)
        try:
            t0 = time.time()
            # 가상 사용자 글로 가정 (실제 본문 = 사용자 입력으로 처리)
            response = run_pipeline(
                category=category_slug,
                body=body,
                duration_months=6,
                weekly_hours=10,
                difficulties=[],
            )
            elapsed = time.time() - t0

            eval_result = evaluate_response(
                response=response,
                full_text=body,
                known_case_ids=known_cases,
                true_label=true_label,
            )
            eval_result["elapsed_sec"] = round(elapsed, 2)
            eval_result["case_id"] = cid
            results.append(eval_result)

            confidence_dist.append(eval_result["confidence"])
            if eval_result["plan_b_triggered"]:
                plan_b_reasons[eval_result["plan_b_reason"] or "unknown"] += 1
            if eval_result["hallucination_flag"]:
                halluc_count += 1

            flag = "⚠️" if eval_result["hallucination_flag"] else "✅"
            print(f"{flag} conf={eval_result['confidence']:.2f} cite={eval_result['cite_accuracy']:.2f} kw={eval_result['keyword_match_ratio']:.2f} ({elapsed:.1f}s)")
        except Exception as e:
            print(f"❌ {type(e).__name__}: {e}")
            results.append({"case_id": cid, "error": str(e), "true_label": true_label})

    elapsed_total = time.time() - t_start
    n_ok = sum(1 for r in results if "error" not in r)
    halluc_rate = halluc_count / max(1, n_ok)

    summary = {
        "version": "AI-21-v1",
        "generated_at": datetime.now(KST).isoformat(timespec="seconds"),
        "total_scenarios": len(scenarios),
        "successful_runs": n_ok,
        "error_count": sum(1 for r in results if "error" in r),
        "hallucination_count": halluc_count,
        "hallucination_rate": round(halluc_rate, 3),
        "target_rate": 0.05,  # PM-21 목표 < 5%
        "passed_target": halluc_rate < 0.05,
        "confidence_distribution": {
            "min": round(min(confidence_dist), 3) if confidence_dist else None,
            "p25": round(sorted(confidence_dist)[len(confidence_dist) // 4], 3) if len(confidence_dist) >= 4 else None,
            "p50": round(sorted(confidence_dist)[len(confidence_dist) // 2], 3) if confidence_dist else None,
            "p75": round(sorted(confidence_dist)[3 * len(confidence_dist) // 4], 3) if len(confidence_dist) >= 4 else None,
            "max": round(max(confidence_dist), 3) if confidence_dist else None,
            "avg": round(sum(confidence_dist) / len(confidence_dist), 3) if confidence_dist else None,
        },
        "plan_b_reasons": dict(plan_b_reasons.most_common()),
        "elapsed_sec": round(elapsed_total, 1),
    }

    output = {"summary": summary, "results": results}
    OUTPUT_PATH.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\n✅ {OUTPUT_PATH}")
    print(f"📊 환각율: {halluc_rate:.1%} (목표 < 5%) — {'PASS' if halluc_rate < 0.05 else 'FAIL'}")
    print(f"   신뢰도 평균: {summary['confidence_distribution']['avg']}")
    print(f"   Plan B 트리거: {sum(plan_b_reasons.values())}건 / {dict(plan_b_reasons.most_common())}")
    print(f"⏱️ 소요: {elapsed_total:.1f}초")


if __name__ == "__main__":
    main()
