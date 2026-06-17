"""
15_refine_failed_relaxed.py — failed.csv 패턴 완화 + 재분류 (AI-07, W2)

W1 결과: refined_success_failed.csv 193건 + success_community_failed.csv 482건.
검토(2026-05-27): "성공 경험담 패턴 없음" 사유 글 다수가 실제 부업 성공 후기.

원인: 11번 스크립트의 `r"성공\s*후기"` 패턴은 "성공 후기"만 매칭.
"성공한 후기" / "성공의 후기" / "성공한 사장님" 등 변형은 못 잡음.

완화 방향:
1. "성공 후기" → `r"성공.{0,3}후기"` (변형 매칭)
2. 부업+행위 동사 (창업했/시작했/퇴사하고 등) 추가
3. 부업 키워드 3+ AND 1인칭 표현 시 PASS

산출물:
- ai/data/refined_failed_recheck.csv  (refined_success_failed 재분류 결과)
- ai/data/community_failed_recheck.csv (success_community_failed 재분류 결과)
- ai/data/newly_passed_relaxed.csv     (완화로 새로 PASS된 글 — sample 병합용)

작성: 팀장 (오혜림) — 2026-05-27
"""

import csv
import re
from pathlib import Path
from collections import Counter


DATA_DIR = Path(__file__).resolve().parent.parent / "data"


# -------------------------------
# 1) Strict 패턴 (11번 스크립트와 동일 — 통과 우선순위)
# -------------------------------
SUCCESS_PATTERNS_STRICT = [
    r"월\s*\d+\s*만원",
    r"\d+\s*개월\s*만에",
    r"\d+\s*년\s*만에",
    r"수익\s*인증",
    r"성공\s*후기",
    r"제가\s*\w+\s*(?:했|해|한)",
    r"저는\s*\w+\s*(?:했|해|한)",
    r"\d+\s*만원\s*(?:벌|수익|매출)",
    r"(?:성공|달성)\s*했(?:어|었|네|네요)",
]

# -------------------------------
# 2) Relaxed 패턴 (W2 추가)
# -------------------------------
SUCCESS_PATTERNS_RELAXED = [
    # 성공 후기 변형 — 핵심
    r"성공.{0,3}후기",         # 성공한 후기 / 성공 후기 / 성공의 후기
    r"성공.{0,3}경험",         # 성공한 경험 / 성공 경험
    r"성공.{0,3}사례",         # 성공한 사례 / 성공 사례
    r"성공.{0,3}스토리",        # 성공 스토리

    # 부업+성공/시작 조합
    r"(?:부업|투잡|재택|N잡).{0,5}성공",      # 부업 성공 / 부업으로 성공 / 부업까지 성공
    r"부업으로\s*\w+\s*(?:했|해|한|함)",       # 부업으로 ~ 했어요
    r"부업.{0,5}시작\s*(?:해|했|하고|해서)",   # 부업 시작했 / 부업으로 시작해서

    # 1인칭 + 행위 동사
    r"제가\s*.{0,10}(?:창업|개업|시작|운영|만들|벌|수익|판매).{0,5}(?:해|했|함|한)",
    r"저는\s*.{0,10}(?:창업|개업|시작|운영|만들|벌|수익|판매).{0,5}(?:해|했|함|한)",

    # 행위 동사 단독 (강한 시그널)
    r"(?:창업|개업)\s*(?:해|했|함|한)",       # 창업해서 / 창업했어요
    r"(?:퇴사|전업)\s*(?:하|했|함|해서)",      # 퇴사하고 / 전업해서

    # 정산/수입 표현 (구체)
    r"\d+\s*월\s*정산",                       # 5월 정산
    r"매출\s*\d+",                            # 매출 100
    r"부수입\s*(?:만들|생기|벌)",              # 부수입 만들기
]

# -------------------------------
# 3) 부업 키워드 카운트 (3개 이상 + 1인칭이면 PASS)
# -------------------------------
SIDE_JOB_KEYWORDS_FOR_COUNT = [
    "부업", "투잡", "재택", "N잡", "부수입", "추가수입",
    "스마트스토어", "쿠팡파트너스", "쇼핑몰", "이커머스",
    "유튜브", "블로그", "콘텐츠", "온라인 강의",
    "수익", "매출", "월급",
]

FIRST_PERSON_TOKENS = ["제가", "저는", "내가", "나는", "나의", "저도", "저희"]


# -------------------------------
# 4) 판정 함수
# -------------------------------
def matches_strict(text: str) -> bool:
    return any(re.search(p, text) for p in SUCCESS_PATTERNS_STRICT)


def matches_relaxed(text: str) -> bool:
    return any(re.search(p, text) for p in SUCCESS_PATTERNS_RELAXED)


def count_side_job(text: str) -> int:
    return sum(1 for k in SIDE_JOB_KEYWORDS_FOR_COUNT if k in text)


def has_first_person(text: str) -> bool:
    return any(t in text for t in FIRST_PERSON_TOKENS)


def reclassify(text: str) -> str:
    """
    'pass_strict' — 기존 strict 패턴 매칭 (사실 11번에서 이미 통과했어야 하지만 false negative 가능)
    'pass_relaxed_pattern' — 완화 패턴 매칭
    'pass_relaxed_keyword' — 부업 키워드 3+ AND 1인칭
    'fail' — 여전히 fail
    """
    if matches_strict(text):
        return "pass_strict"
    if matches_relaxed(text):
        return "pass_relaxed_pattern"
    if count_side_job(text) >= 3 and has_first_person(text):
        return "pass_relaxed_keyword"
    return "fail"


# -------------------------------
# 5) 메인 — 두 failed.csv 재분류
# -------------------------------
def process(failed_csv_name: str, output_csv_name: str):
    csv_path = DATA_DIR / failed_csv_name
    if not csv_path.exists():
        print(f"[SKIP] {csv_path} 없음")
        return [], Counter()

    with open(csv_path, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))

    results = []
    verdict_count = Counter()

    for row in rows:
        # 제목 + description + (있으면) full_text 통합
        title = row.get("title", "") or ""
        desc = row.get("description", "") or ""
        full_text = row.get("full_text", "") or ""  # 일부 csv엔 full_text 컬럼 있을 수도
        combined = f"{title}\n{desc}\n{full_text}".strip()

        verdict = reclassify(combined)
        verdict_count[verdict] += 1

        results.append({**row, "relaxed_verdict": verdict})

    # 저장 (원본 컬럼 + relaxed_verdict)
    out_path = DATA_DIR / output_csv_name
    if results:
        fieldnames = list(results[0].keys())
        with open(out_path, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(results)

    print(f"\n=== {failed_csv_name} ({len(rows)}건) ===")
    print(f"  → {out_path.name}")
    for verdict, cnt in verdict_count.most_common():
        print(f"    {cnt:4d}건  {verdict}")

    return results, verdict_count


def main():
    print("=" * 70)
    print("AI-07: failed.csv 패턴 완화 재분류")
    print("=" * 70)

    refined_results, refined_count = process(
        "refined_success_failed.csv",
        "refined_failed_recheck.csv",
    )
    community_results, community_count = process(
        "success_community_failed.csv",
        "community_failed_recheck.csv",
    )

    # 새로 PASS된 글만 별도 csv 저장 (sample 병합용)
    all_results = refined_results + community_results
    newly_passed = [
        r for r in all_results
        if r.get("relaxed_verdict") in ("pass_strict", "pass_relaxed_pattern", "pass_relaxed_keyword")
    ]

    if newly_passed:
        out_path = DATA_DIR / "newly_passed_relaxed.csv"
        # 공통 필드 추출 (두 csv 컬럼이 다를 수 있어서 union)
        all_fields = set()
        for r in newly_passed:
            all_fields.update(r.keys())
        fieldnames = sorted(all_fields)

        with open(out_path, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for r in newly_passed:
                # 누락 필드는 빈 문자열로
                writer.writerow({k: r.get(k, "") for k in fieldnames})

        print(f"\n=== 새로 PASS된 글 ===")
        print(f"  → {out_path.name} ({len(newly_passed)}건)")
        verdict_dist = Counter(r["relaxed_verdict"] for r in newly_passed)
        for v, c in verdict_dist.most_common():
            print(f"    {c:4d}건  {v}")

    print("\n=" * 35)
    print("AI-07 완료")
    print("=" * 70)
    total_failed = sum(refined_count.values()) + sum(community_count.values())
    total_passed = len(newly_passed)
    print(f"전체 failed: {total_failed}건")
    print(f"새로 PASS: {total_passed}건 ({total_passed*100/total_failed:.1f}%)")


if __name__ == "__main__":
    main()
