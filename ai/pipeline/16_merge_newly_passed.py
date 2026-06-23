"""
16_merge_newly_passed.py — newly_passed_relaxed.csv를 sample.csv에 병합 (AI-07 후속)

15번 결과로 새로 PASS된 153건을 출처별 sample에 dedup 병합.
- refined 출처 → refined_success_sample.csv (dedup by link)
- community 출처 → success_community_sample.csv (dedup by link)

주의: newly_passed는 본문(full_text) 미보유. AI-08 통합 정제 단계에서 본문 크롤링 추가 예정.

산출물:
- ai/data/refined_success_sample.csv (덮어쓰기)
- ai/data/success_community_sample.csv (덮어쓰기)
- ai/data/refined_success_sample_v1.backup.csv (원본 백업)
- ai/data/success_community_sample_v1.backup.csv (원본 백업)

작성: 팀장 (오혜림) — 2026-05-27
"""

import csv
import shutil
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def load(path: Path):
    if not path.exists():
        return [], []
    with open(path, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        cols = reader.fieldnames
        rows = list(reader)
    return cols, rows


def merge_into_sample(sample_name: str, newly_rows: list, source_filter: str):
    """sample csv에 newly_rows를 dedup 병합. source_filter로 출처 일치하는 것만."""
    sample_path = DATA_DIR / sample_name

    # 1. 원본 백업
    backup_path = DATA_DIR / f"{sample_path.stem}_v1.backup.csv"
    if sample_path.exists() and not backup_path.exists():
        shutil.copy2(sample_path, backup_path)
        print(f"  백업 생성: {backup_path.name}")

    sample_cols, sample_rows = load(sample_path)

    # 2. dedup 키 = link
    existing_links = {r.get("link", "") for r in sample_rows if r.get("link")}

    # 3. newly_rows에서 source_filter 일치 + link 중복 아닌 것만 필터
    to_add = []
    for r in newly_rows:
        link = r.get("link", "")
        src = r.get("source", "")
        if not link:
            continue
        if source_filter and source_filter not in src:
            continue
        if link in existing_links:
            continue
        to_add.append(r)
        existing_links.add(link)

    if not to_add:
        print(f"  추가할 행 없음 — {sample_name} 변경 안 함")
        return 0

    # 4. 새 컬럼 결합 (sample_cols 우선, 없으면 newly의 컬럼 추가)
    newly_cols = list(to_add[0].keys()) if to_add else []
    final_cols = list(dict.fromkeys((sample_cols or []) + newly_cols))

    merged_rows = sample_rows + to_add

    # 5. 저장 (원본 덮어쓰기)
    with open(sample_path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=final_cols)
        writer.writeheader()
        for r in merged_rows:
            writer.writerow({k: r.get(k, "") for k in final_cols})

    print(f"  {sample_name}: {len(sample_rows)}건 + {len(to_add)}건 = {len(merged_rows)}건")
    return len(to_add)


def main():
    print("=" * 70)
    print("AI-07 후속: newly_passed_relaxed.csv → sample csv 병합")
    print("=" * 70)

    newly_path = DATA_DIR / "newly_passed_relaxed.csv"
    if not newly_path.exists():
        print(f"[ERROR] {newly_path} 없음. 먼저 15번 스크립트 실행 필요.")
        return

    _, newly_rows = load(newly_path)
    print(f"\nnewly_passed: {len(newly_rows)}건")

    # source 분포 확인
    from collections import Counter
    src_count = Counter(r.get("source", "") for r in newly_rows)
    for s, c in src_count.most_common():
        print(f"  source={s}: {c}건")

    # refined 출처 (블로그/지식인) → refined_success_sample
    print("\n[1] refined_success_sample.csv 병합")
    refined_added = merge_into_sample(
        "refined_success_sample.csv",
        newly_rows,
        source_filter="",  # source 컬럼 값 미상 — 일단 모두 시도, link 중복으로 자동 dedup
    )

    # community 출처 → success_community_sample (refined에서 빠진 것만)
    # source 컬럼이 비어있을 수도 있으니 일단 같은 방식으로 시도
    # → 실제로 refined에 다 들어갔으면 community엔 추가 없음
    print("\n[2] success_community_sample.csv 병합 (가능한 경우)")
    community_added = merge_into_sample(
        "success_community_sample.csv",
        newly_rows,
        source_filter="community",
    )

    print("\n" + "=" * 70)
    print(f"병합 완료 — refined +{refined_added}건 / community +{community_added}건")
    print("=" * 70)


if __name__ == "__main__":
    main()
