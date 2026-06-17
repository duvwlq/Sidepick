"""
19_label_integrated_samples.py — true_label 자동 라벨링 (AI-10, W2)

[배경]
PDF는 "수동 검수"를 명시하지만 팀장 부재 기간 처리 위해 휴리스틱 자동화.
W4 50개 시나리오 테스트에서 Sonnet으로 정확도 검증 예정.

[휴리스틱 룰]
- success: 본문 보유 + success 패턴 매칭 + 광고 의심 없음 + 부업 키워드 5+
- fail: 본문 부재 OR 광고 키워드 6+ OR 부업 키워드 1 이하
- ambiguous: 위 둘 다 아닌 경우

[입력]
- ai/data/integrated_success_sample.csv (351건)

[산출물]
- ai/data/labeled_success_sample.csv (전체 351건 + true_label 컬럼)
- ai/data/test_scenarios_50.csv (50개 시나리오 테스트셋 — W4 환각 측정용)
- ai/data/labeling_report.md (라벨 분포 + 카테고리별)

작성: 팀장 (오혜림) — 2026-05-27
"""

import csv
import random
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

# 공통 패턴 import
sys.path.insert(0, str(Path(__file__).parent))
from crawler_utils import (
    SUCCESS_EXPERIENCE_PATTERNS,
    AD_KEYWORDS,
    SIDE_JOB_KEYWORDS,
    OFFTOPIC_KEYWORDS,
    has_success_experience,
    is_ad,
    count_keywords,
)


DATA_DIR = Path(__file__).resolve().parent.parent / "data"
INPUT_CSV = DATA_DIR / "integrated_success_sample.csv"
LABELED_OUT = DATA_DIR / "labeled_success_sample.csv"
TEST_OUT = DATA_DIR / "test_scenarios_50.csv"
REPORT_OUT = DATA_DIR / "labeling_report.md"


# 추가 휴리스틱 신호
PUNG_NYUM_PATTERNS = [  # 푸념/실패 표현 (성공 키워드가 있어도 fail 가능성)
    r"포기했",
    r"그만뒀",
    r"손해",
    r"실패",
    r"적자",
    r"망했",
    r"돈만\s*날",
    r"시간만\s*날",
]


def has_pungnyum(text: str) -> bool:
    """푸념/실패 표현 매칭."""
    if not text:
        return False
    return any(re.search(p, text) for p in PUNG_NYUM_PATTERNS)


def heuristic_label(row: dict) -> tuple[str, str]:
    """
    휴리스틱 라벨링.
    Returns: (label, reason)
    label: success / fail / ambiguous
    """
    title = (row.get("title") or "").strip()
    full_text = (row.get("full_text") or "").strip()
    description = (row.get("description") or "").strip()
    combined = f"{title}\n{full_text}\n{description}"

    has_fulltext = len(full_text) >= 100
    success_match = has_success_experience(combined)
    pungnyum_match = has_pungnyum(combined)
    ad_match_strict = is_ad(combined, threshold=2)  # 광고 키워드 2+
    ad_match_severe = is_ad(combined, threshold=4)  # 광고 키워드 4+ (확실한 광고)
    sj_count = count_keywords(combined, SIDE_JOB_KEYWORDS)
    offtopic_count = count_keywords(combined, OFFTOPIC_KEYWORDS)

    # 1. fail 우선 판정
    if ad_match_severe:
        return ("fail", f"광고 키워드 다수 (≥4)")
    if offtopic_count >= 3:
        return ("fail", f"offtopic 키워드 다수 ({offtopic_count})")
    if not has_fulltext and len(description) < 80:
        return ("fail", "본문·description 모두 부족")
    if sj_count <= 1:
        return ("fail", f"부업 키워드 부족 ({sj_count})")
    if pungnyum_match and not success_match:
        return ("fail", "푸념만 있고 성공 표현 X")

    # 2. success 판정
    if success_match and has_fulltext and sj_count >= 5 and not ad_match_strict:
        return ("success", "본문+성공패턴+부업키워드5+, 광고 의심 X")
    if success_match and has_fulltext and sj_count >= 3 and not pungnyum_match:
        return ("success", "본문+성공패턴+부업키워드3+, 푸념 X")

    # 3. 나머지 → ambiguous
    reasons = []
    if not has_fulltext:
        reasons.append("본문 부족")
    if not success_match:
        reasons.append("성공패턴 약함")
    if ad_match_strict:
        reasons.append("광고 의심")
    if pungnyum_match:
        reasons.append("푸념 섞임")
    return ("ambiguous", "; ".join(reasons) or "휴리스틱 경계선")


def select_test_scenarios(labeled_rows: list, n: int = 50) -> list:
    """
    50개 시나리오 테스트셋 추출 (W4 환각 측정용).
    - 카테고리별 다양성 확보
    - success / ambiguous / fail 골고루
    - 본문 있는 글 우선
    """
    by_label = defaultdict(list)
    for r in labeled_rows:
        if r.get("full_text") and len(r["full_text"]) >= 200:
            by_label[r["true_label"]].append(r)

    # 비율: success 30 / ambiguous 15 / fail 5
    target = {"success": 30, "ambiguous": 15, "fail": 5}
    selected = []
    random.seed(42)

    for label, count in target.items():
        candidates = by_label.get(label, [])
        # 카테고리별 그룹
        by_cat = defaultdict(list)
        for c in candidates:
            by_cat[c.get("category_slug", "etc")].append(c)
        # 라운드 로빈으로 카테고리 다양성 확보
        picks = []
        cats = list(by_cat.keys())
        while len(picks) < count and any(by_cat.values()):
            for cat in cats:
                if by_cat[cat] and len(picks) < count:
                    picks.append(by_cat[cat].pop(random.randrange(len(by_cat[cat]))))
        selected.extend(picks)

    return selected


def main():
    print("=" * 70)
    print("AI-10: 통합 정제 데이터 자동 라벨링 (휴리스틱)")
    print("=" * 70)

    # 1. 입력 로드
    with open(INPUT_CSV, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
        in_fields = list(rows[0].keys()) if rows else []
    print(f"\n[1] 입력 {len(rows)}건 — {INPUT_CSV.name}")

    # 2. 라벨링
    print(f"\n[2] 휴리스틱 라벨링")
    label_dist = Counter()
    cat_label = defaultdict(Counter)

    for r in rows:
        label, reason = heuristic_label(r)
        r["true_label"] = label
        r["label_reason"] = reason
        label_dist[label] += 1
        cat_label[r.get("category_slug", "etc")][label] += 1

    for lbl, n in label_dist.most_common():
        print(f"  {lbl:10s}: {n:4d}건 ({n*100/len(rows):.1f}%)")

    # 3. 라벨링된 csv 저장
    out_fields = in_fields + ["true_label", "label_reason"]
    with open(LABELED_OUT, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=out_fields)
        writer.writeheader()
        for r in rows:
            writer.writerow({k: r.get(k, "") for k in out_fields})
    print(f"\n[3] 저장: {LABELED_OUT.name} ({len(rows)}건)")

    # 4. 50개 시나리오 테스트셋
    test_set = select_test_scenarios(rows, n=50)
    with open(TEST_OUT, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=out_fields)
        writer.writeheader()
        for r in test_set:
            writer.writerow({k: r.get(k, "") for k in out_fields})
    print(f"\n[4] 테스트셋: {TEST_OUT.name} ({len(test_set)}건)")

    test_label_dist = Counter(r["true_label"] for r in test_set)
    test_cat_dist = Counter(r.get("category_slug", "etc") for r in test_set)
    print(f"  라벨 분포: {dict(test_label_dist)}")
    print(f"  카테고리 분포: {dict(test_cat_dist)}")

    # 5. 리포트
    report = [
        "# AI-10 라벨링 리포트",
        "",
        "**작성일**: 2026-05-27",
        f"**입력**: `ai/data/integrated_success_sample.csv` ({len(rows)}건)",
        f"**산출물**: `ai/data/labeled_success_sample.csv` + `test_scenarios_50.csv`",
        f"**방식**: 휴리스틱 (W4 시나리오 테스트에서 Sonnet으로 정확도 검증 예정)",
        "",
        "## 1. 라벨 분포",
        "",
        "| 라벨 | 건수 | 비율 |",
        "|---|---|---|",
    ]
    for lbl, n in label_dist.most_common():
        report.append(f"| `{lbl}` | {n} | {n*100/len(rows):.1f}% |")

    report.extend([
        "",
        "## 2. 카테고리 × 라벨 매트릭스",
        "",
        "| category_slug | success | ambiguous | fail | total |",
        "|---|---|---|---|---|",
    ])
    for cat in sorted(cat_label.keys(), key=lambda c: -sum(cat_label[c].values())):
        s = cat_label[cat].get("success", 0)
        a = cat_label[cat].get("ambiguous", 0)
        fa = cat_label[cat].get("fail", 0)
        report.append(f"| `{cat}` | {s} | {a} | {fa} | {s+a+fa} |")

    report.extend([
        "",
        "## 3. 50개 시나리오 테스트셋 (W4 환각 측정용)",
        "",
        "**구성**: success 30 / ambiguous 15 / fail 5 (본문 200자 이상만, 카테고리 라운드 로빈)",
        "",
        f"- 실제 추출 건수: {len(test_set)}",
        f"- 라벨 분포: `{dict(test_label_dist)}`",
        f"- 카테고리 분포: `{dict(test_cat_dist)}`",
        "",
        "## 4. 휴리스틱 룰 (참고)",
        "",
        "### fail 판정",
        "- 광고 키워드 4+ (severe ad)",
        "- offtopic 키워드 3+",
        "- 본문 < 100자 AND description < 80자",
        "- 부업 키워드 ≤ 1",
        "- 푸념 표현(`포기했|그만뒀|손해|실패|적자|망했`) + 성공 표현 없음",
        "",
        "### success 판정",
        "- 본문 ≥ 100자 + 성공 패턴 + 부업 키워드 5+ + 광고 의심 없음 (광고 키워드 < 2)",
        "- 또는 본문 + 성공 패턴 + 부업 키워드 3+ + 푸념 없음",
        "",
        "### ambiguous",
        "- 위 둘 다 아닌 경계선 케이스",
        "",
        "## 5. 다음 단계 (W4 인계)",
        "",
        "- W4 50개 시나리오 테스트 시 `test_scenarios_50.csv` 활용",
        "- Sonnet으로 같은 케이스 분류 → 휴리스틱 vs LLM 정확도 비교",
        "- 정확도 차이 큰 패턴 발견 시 휴리스틱 룰 보강",
        "- PD 설문 30건 수령 시 18번 재실행 후 19번도 재실행 권장",
    ])

    with open(REPORT_OUT, "w", encoding="utf-8") as f:
        f.write("\n".join(report))
    print(f"\n[5] 리포트: {REPORT_OUT.name}")

    print("\n" + "=" * 70)
    print(f"AI-10 완료 — 351건 라벨링 + 50개 테스트셋")
    print("=" * 70)


if __name__ == "__main__":
    main()
