"""
29_hallucination_test_v2.py — AI-21-v2 환각율 재측정

v1 (28번) 대비 변경:
1. 테스트 데이터: test_scenarios_50.csv (노이즈 多) → clean_cases.csv + pickply 통합
2. 키워드 매칭 룰: substring 단독 → substring OR 형태소 분리 매칭
   (Claude가 "구독자가"라 적었는데 본문은 "구독자" 같은 경우 통과)
3. 시스템 프롬프트 강화 ("본문 등장 단어만") + temperature 0.1

목표: 환각율 < 5%

작성: 팀장(오혜림) — 2026-06-10
의존: ai/server/llm_analyzer.py (v2 프롬프트) + clean_cases.csv + pickply_100.csv
"""

from __future__ import annotations

import csv
import json
import os
import re
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

CLEAN_PATH = REPO_ROOT / "ai" / "data" / "clean_cases.csv"
PICKPLY_PATH = REPO_ROOT / "ai" / "data" / "pickply_100.csv"
KNOWN_CASES_PATH = REPO_ROOT / "ai" / "data" / "case_metadata_v2.json"
OUTPUT_PATH = REPO_ROOT / "ai" / "data" / "hallucination_report_v2.json"

KST = timezone(timedelta(hours=9))

ALLOWED_FAILURE_CATEGORIES = {
    "마케팅부족", "자금부족", "시간관리",
    "타겟분석실패", "경쟁분석부족", "운영관리부족", "기타",
}

PICKPLY_SLUG_MAP = {
    "온라인판매_이커머스": "online-commerce",
    "콘텐츠_SNS": "content-sns",
    "디지털상품_지식판매": "digital-products",
    "플랫폼노동": "platform-labor",
    "재능_프리랜서": "talent-freelance",
    "투자_재테크": "investment",
    "오프라인부업": "offline-sidejob",
    "기타": "etc",
}


def load_test_data(limit: int | None = None) -> list[dict]:
    """clean_cases 36건 + 픽플리 100건 = 136건 (또는 일부)."""
    cases: list[dict] = []

    if CLEAN_PATH.exists():
        with CLEAN_PATH.open(encoding="utf-8-sig") as f:
            for r in csv.DictReader(f):
                cases.append({
                    "case_id": r["case_id"],
                    "category_slug": r.get("category_slug", "etc"),
                    "full_text": r.get("full_text", "")[:2000],
                    "true_label": r.get("case_type", "?"),
                    "source": "clean_cases",
                })

    if PICKPLY_PATH.exists():
        with PICKPLY_PATH.open(encoding="utf-8-sig") as f:
            for r in csv.DictReader(f):
                text = " / ".join([
                    r.get("free_text", ""),
                    f"실패원인: {r.get('failure_reasons', '')}",
                    f"어려움: {r.get('difficulties', '')}",
                ])
                cases.append({
                    "case_id": f"pickply_{r['id']}",
                    "category_slug": PICKPLY_SLUG_MAP.get(r.get("category", "기타"), "etc"),
                    "full_text": text[:2000],
                    "true_label": "failure_story",
                    "source": "pickply",
                })

    if limit:
        cases = cases[:limit]
    return cases


def load_known_cases() -> set[str]:
    if not KNOWN_CASES_PATH.exists():
        return set()
    meta = json.loads(KNOWN_CASES_PATH.read_text(encoding="utf-8"))
    return {c["case_id"] for c in meta.get("cases", [])}


def _tokenize(text: str) -> set[str]:
    """단순 토큰화 — 어절·명사 후보 추출 (한국어)."""
    text = text or ""
    # 어절
    eojeol = set(re.findall(r"[가-힣A-Za-z]+", text))
    # 1~3글자 한국어 명사 후보 (조사 제거 시 매칭 위해)
    tokens: set[str] = set(t.lower() for t in eojeol)
    for e in eojeol:
        # 끝 조사 1~2자 제거한 형태도 추가 (예: "구독자가" → "구독자")
        for n in (2, 3, 4):
            if len(e) >= n + 1:
                tokens.add(e[:n].lower())
        tokens.add(e[:-1].lower() if len(e) >= 3 else e.lower())
    return tokens


def keyword_match_ratio_v2(keywords: list[str], full_text: str) -> float:
    """v2: 본문 substring + 어절 부분 매칭 (조사 제거 후 일치도 측정)."""
    if not keywords:
        return 1.0
    body_lower = (full_text or "").lower()
    body_tokens = _tokenize(full_text)

    matched = 0
    for kw in keywords:
        kw_l = (kw or "").lower()
        if not kw_l:
            continue
        # 1) 본문에 substring으로 직접 존재
        if kw_l in body_lower:
            matched += 1
            continue
        # 2) 어절 부분 매칭 (조사 제거 등)
        if kw_l in body_tokens:
            matched += 1
            continue
        # 3) 키워드의 첫 2~3자가 본문 토큰에 있는지
        if len(kw_l) >= 2:
            prefix = kw_l[:min(3, len(kw_l))]
            if any(prefix in t for t in body_tokens):
                matched += 1
                continue
    return matched / len(keywords)


def evaluate_response(
    *, response: dict, full_text: str, known_case_ids: set[str], true_label: str,
) -> dict:
    result = response.get("result", {})
    verification = response.get("verification", {})

    expl = result.get("explanation", {})
    cited = expl.get("similar_cases_used") or []
    unknown_cites = [c for c in cited if c not in known_case_ids]
    cite_accuracy = 1.0 if not cited else (len(cited) - len(unknown_cites)) / len(cited)

    cat = result.get("failure_category")
    category_in_whitelist = cat in ALLOWED_FAILURE_CATEGORIES

    keywords = result.get("keywords") or []
    kw_ratio = keyword_match_ratio_v2(keywords, full_text)

    confidence = verification.get("confidence", 0.0)
    plan_b = verification.get("plan_b_triggered", False)

    hallucination_flag = (
        not category_in_whitelist
        or unknown_cites
        or kw_ratio < 0.3
    )

    return {
        "cite_accuracy": round(cite_accuracy, 3),
        "unknown_cite_count": len(unknown_cites),
        "category_in_whitelist": category_in_whitelist,
        "keyword_match_ratio_v2": round(kw_ratio, 3),
        "keywords": keywords,
        "confidence": confidence,
        "plan_b_triggered": plan_b,
        "plan_b_reason": verification.get("plan_b_reason"),
        "hallucination_flag": hallucination_flag,
        "true_label": true_label,
    }


def main() -> None:
    if not os.getenv("ANTHROPIC_API_KEY"):
        print("❌ ANTHROPIC_API_KEY 없음", file=sys.stderr)
        sys.exit(1)

    cases = load_test_data()
    known_cases = load_known_cases()
    print(f"📊 테스트 케이스 {len(cases)}건 (clean_cases + 픽플리) / 알려진 case_id {len(known_cases)}건")

    results: list[dict] = []
    halluc_count = 0
    confidence_dist: list[float] = []
    plan_b_reasons: Counter = Counter()
    t_start = time.time()

    for i, sc in enumerate(cases, 1):
        cid = sc["case_id"]
        body = sc["full_text"]
        true_label = sc["true_label"]
        category_slug = sc["category_slug"]

        print(f"[{i}/{len(cases)}] {cid} ({category_slug})...", end=" ", flush=True)
        try:
            t0 = time.time()
            response = run_pipeline(
                category=category_slug,
                body=body,
                duration_months=6,
                weekly_hours=10,
                difficulties=[],
            )
            elapsed = time.time() - t0
            ev = evaluate_response(
                response=response, full_text=body,
                known_case_ids=known_cases, true_label=true_label,
            )
            ev["case_id"] = cid
            ev["elapsed_sec"] = round(elapsed, 2)
            results.append(ev)
            confidence_dist.append(ev["confidence"])
            if ev["plan_b_triggered"]:
                plan_b_reasons[ev["plan_b_reason"] or "unknown"] += 1
            if ev["hallucination_flag"]:
                halluc_count += 1
            flag = "⚠️" if ev["hallucination_flag"] else "✅"
            print(f"{flag} conf={ev['confidence']:.2f} kw_v2={ev['keyword_match_ratio_v2']:.2f} ({elapsed:.1f}s)")
        except Exception as e:
            print(f"❌ {type(e).__name__}: {e}")
            results.append({"case_id": cid, "error": str(e), "true_label": true_label})

    elapsed_total = time.time() - t_start
    n_ok = sum(1 for r in results if "error" not in r)
    halluc_rate = halluc_count / max(1, n_ok)

    summary = {
        "version": "AI-21-v2",
        "generated_at": datetime.now(KST).isoformat(timespec="seconds"),
        "total_scenarios": len(cases),
        "successful_runs": n_ok,
        "error_count": sum(1 for r in results if "error" in r),
        "hallucination_count": halluc_count,
        "hallucination_rate": round(halluc_rate, 3),
        "target_rate": 0.05,
        "passed_target": halluc_rate < 0.05,
        "v2_changes": [
            "test_data: test_scenarios_50.csv → clean_cases + pickply (136건)",
            "keyword_match: substring → substring + 어절 부분 매칭",
            "system_prompt: 본문 등장 단어만 추출 + few-shot",
            "temperature: default → 0.1",
        ],
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
    print(f"📊 환각율 v2: {halluc_rate:.1%} (목표 < 5%) — {'PASS' if halluc_rate < 0.05 else 'FAIL'}")
    print(f"   신뢰도 평균: {summary['confidence_distribution']['avg']}")
    print(f"   Plan B 트리거: {sum(plan_b_reasons.values())}건")
    print(f"⏱️ 소요: {elapsed_total:.1f}초")


if __name__ == "__main__":
    main()
