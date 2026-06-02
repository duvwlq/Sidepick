"""
20_aggregate_failure_pattern.py — 카테고리별 실패 패턴 빈도 집계 (AI-12)

입력: ai/data/pickply_100.csv (100건 실패 데이터, failure_reasons 콤마 분리)
출력: ai/data/failure_pattern.json (카테고리별 실패 패턴 TOP 5, BE-22/BE-29 입력용)

집계 규칙:
- 카테고리 한글 → PM-03 v1.6 slug 매핑
- failure_reasons 콤마 분리 후 카테고리별 빈도 카운트
- 카테고리별 TOP 5 + percent (소수 1자리)
- '기타' 카테고리는 별도 슬롯 보존

작성: 팀장(오혜림) — 2026-06-02
의존성: AI-08 통합 정제 (351건) + 픽플리 100건. 현재 픽플리만 사용.
"""

from __future__ import annotations

import csv
import json
from collections import Counter, defaultdict
from datetime import datetime, timezone, timedelta
from pathlib import Path

# PM-03 v1.6 카테고리 slug 매핑 (부업 분야 7개)
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

INPUT_PATH = Path("ai/data/pickply_100.csv")
OUTPUT_PATH = Path("ai/data/failure_pattern.json")
TOP_N = 5
KST = timezone(timedelta(hours=9))


def load_rows(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def split_reasons(raw: str) -> list[str]:
    if not raw:
        return []
    return [r.strip() for r in raw.split(",") if r.strip()]


def aggregate(rows: list[dict[str, str]]) -> dict:
    by_category: dict[str, Counter] = defaultdict(Counter)
    totals: Counter = Counter()

    for row in rows:
        cat_kr = row.get("category", "").strip()
        if cat_kr not in CATEGORY_SLUG_MAP:
            cat_kr = "기타"
        slug = CATEGORY_SLUG_MAP[cat_kr]["slug"]
        totals[slug] += 1
        for reason in split_reasons(row.get("failure_reasons", "")):
            by_category[slug][reason] += 1

    categories_out: dict[str, dict] = {}
    for slug, meta in CATEGORY_SLUG_MAP.items():
        slug_key = meta["slug"]
        total = totals.get(slug_key, 0)
        if total == 0:
            continue
        top = by_category[slug_key].most_common(TOP_N)
        patterns = [
            {
                "label": label,
                "count": count,
                "percent": round(count * 100 / total, 1),
            }
            for label, count in top
        ]
        categories_out[slug_key] = {
            "label_ko": meta["label"],
            "total": total,
            "patterns": patterns,
        }

    return {
        "version": "1.0",
        "generated_at": datetime.now(KST).isoformat(timespec="seconds"),
        "source": {
            "dataset": "pickply_100.csv",
            "total_cases": sum(totals.values()),
            "note": "픽플리 설문 100건 실패 데이터. AI-08 통합 정제 351건은 W3 후속 통합 예정.",
        },
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
    for slug, info in result["categories"].items():
        top1 = info["patterns"][0] if info["patterns"] else None
        if top1:
            print(f"  - {slug} (n={info['total']}): TOP1 {top1['label']} {top1['percent']}%")


if __name__ == "__main__":
    main()
