"""
14_filter_offtopic_samples.py — sample.csv에서 부업과 무관한 잡담 자동 제거 (AI-01 1차 정제)

문제:
- 12+13번 community_sample.csv에 dc의 잡담 글이 다수 PASS됨
  (예: "[괴문서] 너가 먼저 잊어버리면 어떡하냐고", "팬픽 딜레마 1위후기")
- 패턴 매칭만으로는 부업·잡담 구분 한계

전략:
- 본문(title + full_text)에서 부업 관련 키워드 카운트
- threshold 미만이면 잡담으로 판정 → 제외
- 단, kin(지식인)은 답변 위주라 별도 threshold 적용 (낮춤)

산출물:
- ai/data/refined_success_sample.csv (정제된 결과로 덮어쓰기)
- ai/data/success_community_sample.csv (정제된 결과로 덮어쓰기)
- ai/data/offtopic_removed.csv (제외된 글 + 사유)

작성: 팀장 (오혜림) — 2026-05-22
"""

import csv
import re
from pathlib import Path


DATA_DIR = Path(__file__).resolve().parent.parent / "data"

# 공통 키워드 + 함수 (AI-06)
from crawler_utils import (
    SIDE_JOB_KEYWORDS,
    OFFTOPIC_KEYWORDS,
    count_keywords,
)

# 14번 고유 — 카테고리별 threshold (kin은 답변 위주라 낮춤)
THRESHOLD_BY_SOURCE = {
    "blog": 5,    # 부업 전문 글 위주 → 높은 threshold OK
    "kin": 3,     # 답변 위주 → 낮춤
    "cafe": 2,    # description-only (200자) → 낮춤
    "dc": 5,      # 잡담 다수 → 엄격
    "clien": 4,
    "ppomppu": 4,
}


def is_offtopic(row, source):
    """잡담 글이면 True 반환 + 사유"""
    title = row.get("title", "")
    full_text = row.get("full_text", "")
    combined = f"{title}\n{full_text}"

    threshold = THRESHOLD_BY_SOURCE.get(source, 4)
    side_job_hits = count_keywords(combined, SIDE_JOB_KEYWORDS)
    offtopic_hits = count_keywords(combined, OFFTOPIC_KEYWORDS)

    # 부업 키워드 부족
    if side_job_hits < threshold:
        return True, f"부업 키워드 부족 ({side_job_hits}/{threshold})"

    # 잡담 키워드가 부업 키워드의 절반 이상
    if offtopic_hits >= 3 and offtopic_hits >= side_job_hits / 2:
        return True, f"잡담 키워드 다수 ({offtopic_hits}개)"

    return False, None


def process_file(csv_path):
    """CSV 읽어서 잡담 제거"""
    if not csv_path.exists():
        return [], []

    with open(csv_path, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames

    print(f"\n=== {csv_path.name} ({len(rows)}건) ===")

    kept = []
    removed = []
    for row in rows:
        source = row.get("source", "?")
        offtopic, reason = is_offtopic(row, source)
        if offtopic:
            removed.append({**row, "remove_reason": reason})
        else:
            kept.append(row)

    # source별 통계
    src_stats = {}
    for r in rows:
        s = r.get("source", "?")
        src_stats.setdefault(s, {"kept": 0, "removed": 0})
    for r in kept:
        src_stats[r.get("source", "?")]["kept"] += 1
    for r in removed:
        src_stats[r.get("source", "?")]["removed"] += 1

    for src, stats in sorted(src_stats.items()):
        total = stats["kept"] + stats["removed"]
        rate = stats["kept"] / total * 100 if total > 0 else 0
        print(f"  {src}: {stats['kept']}/{total}건 유지 ({rate:.1f}%) | 제외 {stats['removed']}건")

    # kept만 원본 파일에 덮어쓰기
    if kept:
        with open(csv_path, "w", encoding="utf-8-sig", newline="") as f:
            w = csv.DictWriter(f, fieldnames=fieldnames)
            w.writeheader()
            w.writerows(kept)

    return kept, removed


def main():
    all_removed = []

    # 1) refined_success_sample.csv 처리
    refined_csv = DATA_DIR / "refined_success_sample.csv"
    kept1, removed1 = process_file(refined_csv)
    for r in removed1:
        all_removed.append({**r, "from_file": "refined"})

    # 2) success_community_sample.csv 처리
    community_csv = DATA_DIR / "success_community_sample.csv"
    kept2, removed2 = process_file(community_csv)
    for r in removed2:
        all_removed.append({**r, "from_file": "community"})

    # 3) 제외된 글 별도 저장
    if all_removed:
        offtopic_csv = DATA_DIR / "offtopic_removed.csv"
        keys = sorted({k for r in all_removed for k in r.keys()})
        with open(offtopic_csv, "w", encoding="utf-8-sig", newline="") as f:
            w = csv.DictWriter(f, fieldnames=keys)
            w.writeheader()
            w.writerows(all_removed)
        print(f"\n  📂 제외된 글 저장: ai/data/offtopic_removed.csv ({len(all_removed)}건)")

    # 4) 최종 통계
    print("\n" + "=" * 60)
    print("📊 1차 정제 결과")
    print("=" * 60)
    print(f"  refined_success_sample.csv: {len(kept1)}건 유지 (제외 {len(removed1)})")
    print(f"  success_community_sample.csv: {len(kept2)}건 유지 (제외 {len(removed2)})")
    print(f"  총 유지: {len(kept1) + len(kept2)}건 / 제외: {len(all_removed)}건")

    # 제외된 글 샘플 출력
    if all_removed:
        print("\n  ⚠️ 제외된 글 샘플 (상위 10건):")
        for r in all_removed[:10]:
            src = r.get("source", "?")
            ttl = r.get("title", "")[:50]
            rsn = r.get("remove_reason", "")
            print(f"    [{src}] {ttl} — {rsn}")


if __name__ == "__main__":
    main()
