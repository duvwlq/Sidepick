"""
21_aggregate_failure_timing.py — 카테고리별 실패 시점(진행 기간) 분포 집계 (AI-13)

입력: ai/data/pickply_100.csv (duration 컬럼)
출력: ai/data/failure_timing.json (BE-22 통계 API + BE-29 시점 분포 차트 FE 입력용)

데이터 특성 주의:
- 픽플리 설문이 정확한 개월 수가 아닌 bucket으로 수집 (1개월 미만 / 1~3개월 / ...).
- 따라서 명세서 예시 (month: 1, 2, 3...) 형태가 아닌 bucket 형태로 출력.
- BE/FE에서 bucket label 그대로 노출 권장.

작성: 팀장(오혜림) — 2026-06-02
의존성: AI-08 통합 정제 (351건) + 픽플리 100건. 현재 픽플리만 사용.
"""

from __future__ import annotations

import csv
import json
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from pathlib import Path

# PM-03 v1.6 카테고리 slug 매핑
CATEGORY_SLUG_MAP: dict[str, dict[str, str]] = {
    "온라인판매_이커머스": {"slug": "online-commerce", "label": "온라인 판매·이커머스"},
    "콘텐츠_SNS": {"slug": "content-sns", "label": "콘텐츠·SNS"},
    "디지털상품_지식판매": {"slug": "digital-products", "label": "디지털·지식판매"},
    "플랫폼노동": {"slug": "platform-labor", "label": "플랫폼 노동"},
    "재능_프리랜서": {"slug": "talent-freelance", "label": "재능·프리랜서"},
    "투자_재테크": {"slug": "investment", "label": "투자·재테크"},
    "오프라인부업": {"slug": "offline-sidejob", "label": "오프라인 부업"},
    "기타": {"slug": "etc", "label": "기타"},
}

# 진행 기간 bucket (픽플리 설문 항목 그대로 사용, 정렬 순서 보존)
DURATION_BUCKETS: list[dict[str, str | int]] = [
    {"bucket": "under-1m", "label": "1개월 미만", "order": 1},
    {"bucket": "1-3m", "label": "1~3개월", "order": 2},
    {"bucket": "3-6m", "label": "3~6개월", "order": 3},
    {"bucket": "6-12m", "label": "6개월~1년", "order": 4},
    {"bucket": "over-1y", "label": "1년 이상", "order": 5},
]

BUCKET_BY_LABEL: dict[str, dict] = {b["label"]: b for b in DURATION_BUCKETS}

INPUT_PATH = Path("ai/data/pickply_100.csv")
OUTPUT_PATH = Path("ai/data/failure_timing.json")
MIN_SAMPLE_SIZE = 10  # 이 미만이면 차트 표시 X
KST = timezone(timedelta(hours=9))


def load_rows(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def aggregate(rows: list[dict[str, str]]) -> dict:
    # by_category[slug][bucket_id] = count
    by_category: dict[str, dict[str, int]] = defaultdict(
        lambda: {b["bucket"]: 0 for b in DURATION_BUCKETS}
    )
    totals: dict[str, int] = defaultdict(int)

    for row in rows:
        cat_kr = row.get("category", "").strip()
        if cat_kr not in CATEGORY_SLUG_MAP:
            cat_kr = "기타"
        slug = CATEGORY_SLUG_MAP[cat_kr]["slug"]

        duration_label = row.get("duration", "").strip()
        bucket_meta = BUCKET_BY_LABEL.get(duration_label)
        if bucket_meta is None:
            # 알 수 없는 기간은 skip + 경고
            continue
        by_category[slug][bucket_meta["bucket"]] += 1
        totals[slug] += 1

    categories_out: dict[str, dict] = {}
    for cat_kr, meta in CATEGORY_SLUG_MAP.items():
        slug = meta["slug"]
        total = totals.get(slug, 0)
        if total == 0:
            continue

        distribution = []
        peak_bucket = None
        peak_count = -1
        for bucket_meta in DURATION_BUCKETS:
            bid = bucket_meta["bucket"]
            count = by_category[slug][bid]
            distribution.append(
                {
                    "bucket": bid,
                    "label": bucket_meta["label"],
                    "order": bucket_meta["order"],
                    "count": count,
                    "percent": round(count * 100 / total, 1),
                }
            )
            if count > peak_count:
                peak_count = count
                peak_bucket = bid

        categories_out[slug] = {
            "label_ko": meta["label"],
            "total": total,
            "sufficient_data": total >= MIN_SAMPLE_SIZE,
            "display_status": "ok" if total >= MIN_SAMPLE_SIZE else "insufficient",
            "distribution": distribution,
            "peak_bucket": peak_bucket,
        }

    return {
        "version": "1.1",
        "generated_at": datetime.now(KST).isoformat(timespec="seconds"),
        "source": {
            "dataset": "pickply_100.csv",
            "total_cases": sum(totals.values()),
            "bucket_format": "픽플리 설문 5단계 bucket. month별 분포가 아닌 bucket 분포.",
            "note": "AI-08 통합 정제 351건은 W3 후속 통합 예정. 그때 month 추정값 같이 산출 검토.",
        },
        "display_policy": {
            "min_sample_size": MIN_SAMPLE_SIZE,
            "insufficient_message": "데이터 수집 중이에요 (10건 이상 모이면 차트 표시)",
            "rule": "sufficient_data=false 카테고리는 차트 대신 안내 메시지 노출 권장",
        },
        "buckets": DURATION_BUCKETS,
        "categories": categories_out,
    }


def main() -> None:
    rows = load_rows(INPUT_PATH)
    result = aggregate(rows)
    OUTPUT_PATH.write_text(
        json.dumps(result, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"✅ {OUTPUT_PATH} 생성 완료 ({len(result['categories'])}개 카테고리)")
    sufficient = [s for s, i in result["categories"].items() if i["sufficient_data"]]
    insufficient = [s for s, i in result["categories"].items() if not i["sufficient_data"]]
    print(f"📊 차트 표시 가능 (n≥{MIN_SAMPLE_SIZE}): {len(sufficient)}개")
    for slug in sufficient:
        info = result["categories"][slug]
        peak = next(d for d in info["distribution"] if d["bucket"] == info["peak_bucket"])
        print(
            f"  ✅ {slug} (n={info['total']}): peak={peak['label']} "
            f"({peak['count']}건, {peak['percent']}%)"
        )
    print(f"⚠️ 데이터 수집 중 (n<{MIN_SAMPLE_SIZE}): {len(insufficient)}개")
    for slug in insufficient:
        info = result["categories"][slug]
        print(f"  ⏳ {slug} (n={info['total']})")


if __name__ == "__main__":
    main()
