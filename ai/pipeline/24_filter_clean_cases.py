"""
24_filter_clean_cases.py — Sonnet 재라벨링 결과로 깨끗한 데이터셋 추출

입력:
- ai/data/relabel_all_results.json (AI-19 재라벨링 결과 — 351건)
- ai/data/labeled_success_sample.csv (원본 메타 보존용)

처리:
- case_type == "advertisement" / "meta_only" / "neutral" 제거
- success_story + failure_story만 보존
- is_real_user_case == false도 제거
- confidence < 0.5는 검토 플래그 (제거 X, 별도 표시)

출력:
- ai/data/clean_cases.csv (깨끗한 데이터셋)
- ai/data/clean_cases_summary.json (요약 통계)

작성: 팀장(오혜림) — 2026-06-02
"""

from __future__ import annotations

import csv
import json
from collections import Counter, defaultdict
from datetime import datetime, timezone, timedelta
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
RELABEL_PATH = REPO_ROOT / "ai" / "data" / "relabel_all_results.json"
ORIG_CSV_PATH = REPO_ROOT / "ai" / "data" / "labeled_success_sample.csv"
OUT_CSV_PATH = REPO_ROOT / "ai" / "data" / "clean_cases.csv"
OUT_SUMMARY_PATH = REPO_ROOT / "ai" / "data" / "clean_cases_summary.json"

KEEP_TYPES = {"success_story", "failure_story"}
REMOVE_TYPES = {"advertisement", "meta_only", "neutral"}
LOW_CONFIDENCE_THRESHOLD = 0.5
KST = timezone(timedelta(hours=9))


def main() -> None:
    if not RELABEL_PATH.exists():
        print(f"❌ {RELABEL_PATH} 없음. 23번 스크립트 먼저 실행 필요.")
        return

    relabel = json.loads(RELABEL_PATH.read_text(encoding="utf-8"))
    drafts = relabel["drafts"]
    print(f"📥 재라벨링 결과 {len(drafts)}건 로드")

    # 원본 CSV 메타 (case_id → row)
    with ORIG_CSV_PATH.open(encoding="utf-8-sig") as f:
        orig_rows = {r["case_id"]: r for r in csv.DictReader(f)}

    kept = []
    removed: Counter = Counter()
    flagged_low_conf = []
    by_new_label: Counter = Counter()

    for d in drafts:
        cid = d.get("case_id") or d.get("_meta", {}).get("case_id")
        if not cid or cid not in orig_rows:
            continue
        if d.get("skipped"):
            removed["skipped_body_too_short"] += 1
            continue
        if "error" in d:
            removed["error"] += 1
            continue

        ct = d.get("case_type")
        is_real = d.get("is_real_user_case")
        confidence = d.get("confidence", 0.0)

        if ct in REMOVE_TYPES:
            removed[ct] += 1
            continue
        if ct not in KEEP_TYPES:
            removed[f"unknown_type:{ct}"] += 1
            continue
        if is_real is False:
            removed["not_real_user_case"] += 1
            continue

        orig = orig_rows[cid]
        cat_inf = d.get("category_inferred", {})

        kept_row = {
            "case_id": cid,
            "case_type": ct,
            "category_slug": cat_inf.get("slug", "etc"),
            "category_label": cat_inf.get("label_ko", "기타"),
            "category_confidence": cat_inf.get("confidence", 0.0),
            "overall_confidence": confidence,
            "low_confidence_flag": confidence < LOW_CONFIDENCE_THRESHOLD,
            "source": orig.get("source", ""),
            "title": orig.get("title", ""),
            "full_text": orig.get("full_text", ""),
            "link": orig.get("link", ""),
            "postdate": orig.get("postdate", ""),
            "original_label": orig.get("true_label", ""),
            "original_category_slug": orig.get("category_slug", ""),
            "reasoning": d.get("reasoning", ""),
        }
        kept.append(kept_row)
        by_new_label[ct] += 1
        if confidence < LOW_CONFIDENCE_THRESHOLD:
            flagged_low_conf.append(cid)

    # CSV 출력
    if kept:
        fields = list(kept[0].keys())
        with OUT_CSV_PATH.open("w", encoding="utf-8-sig", newline="") as f:
            w = csv.DictWriter(f, fieldnames=fields)
            w.writeheader()
            w.writerows(kept)
        print(f"\n✅ {OUT_CSV_PATH}: {len(kept)}건 보존")

    # 카테고리별 분포
    by_cat_type: dict = defaultdict(Counter)
    for r in kept:
        by_cat_type[r["category_slug"]][r["case_type"]] += 1

    summary = {
        "generated_at": datetime.now(KST).isoformat(timespec="seconds"),
        "source_relabel_file": RELABEL_PATH.name,
        "total_input": len(drafts),
        "total_kept": len(kept),
        "total_removed": sum(removed.values()),
        "removed_breakdown": dict(removed.most_common()),
        "kept_by_case_type": dict(by_new_label.most_common()),
        "kept_by_category_slug": {
            slug: {"total": sum(types.values()), **dict(types)}
            for slug, types in sorted(by_cat_type.items())
        },
        "low_confidence_flagged": {
            "threshold": LOW_CONFIDENCE_THRESHOLD,
            "count": len(flagged_low_conf),
            "case_ids": flagged_low_conf,
        },
    }
    OUT_SUMMARY_PATH.write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8",
    )
    print(f"✅ {OUT_SUMMARY_PATH}")

    print(f"\n📊 결과 요약")
    print(f"  입력: {len(drafts)}건")
    print(f"  보존: {len(kept)}건")
    print(f"  제거: {sum(removed.values())}건")
    for reason, cnt in removed.most_common():
        print(f"    - {reason}: {cnt}건")

    print(f"\n📊 보존 case_type 분포")
    for ct, cnt in by_new_label.most_common():
        print(f"  {ct}: {cnt}건")

    print(f"\n📊 보존 카테고리 분포 (slug별)")
    for slug, types in sorted(by_cat_type.items()):
        total = sum(types.values())
        detail = " / ".join(f"{k}={v}" for k, v in types.most_common())
        print(f"  {slug}: {total}건 ({detail})")

    if flagged_low_conf:
        print(f"\n⚠️ 낮은 신뢰도 (<{LOW_CONFIDENCE_THRESHOLD}): {len(flagged_low_conf)}건 (제거 X, 검토 권장)")


if __name__ == "__main__":
    main()
