"""
17_fetch_fulltext_for_newly_passed.py — newly_passed 153건 본문 크롤링 (AI-08, W2)

AI-07로 새로 PASS된 153건은 본문(full_text) 미보유.
11번의 fetch_blog_content / fetch_kin_answer 재사용해서 본문 수집.

대상:
- blog: 21건 — fetch_blog_content (모바일 URL)
- kin: 44건 — fetch_kin_answer
- 나머지 (cafe 84 / dc 2 / clien 1 / ppomppu 1): SKIP
  * cafe는 로그인 필요 + 12/13번 community 스크립트도 카페 미처리
  * dc/clien/ppomppu는 12/13번에서 본문 크롤링 했어야 하지만 newly_passed에 4건만 있음 — 무시

산출물:
- ai/data/refined_success_sample.csv (full_text 컬럼 보강된 행 업데이트)
- ai/data/newly_passed_fulltext_failed.csv (본문 크롤링 실패 글)

작성: 팀장 (오혜림) — 2026-05-27
"""

import csv
import sys
import time
from pathlib import Path

# 11번에 정의된 본문 크롤링 함수 재사용 (직접 import)
sys.path.insert(0, str(Path(__file__).parent))

# 11번 스크립트의 함수를 동적 로드 (파일명에 숫자 prefix라 일반 import 안 됨)
import importlib.util
spec = importlib.util.spec_from_file_location(
    "refine_success_data",
    Path(__file__).parent / "11_refine_success_data.py",
)
refine_success_data = importlib.util.module_from_spec(spec)
spec.loader.exec_module(refine_success_data)

fetch_blog_content = refine_success_data.fetch_blog_content
fetch_kin_answer = refine_success_data.fetch_kin_answer


DATA_DIR = Path(__file__).resolve().parent.parent / "data"
SAMPLE_CSV = DATA_DIR / "refined_success_sample.csv"
NEWLY_PASSED_CSV = DATA_DIR / "newly_passed_relaxed.csv"
FAILED_OUT = DATA_DIR / "newly_passed_fulltext_failed.csv"


def main():
    print("=" * 70)
    print("AI-08: newly_passed 본문 크롤링")
    print("=" * 70)

    # 1. sample.csv 전체 로드
    with open(SAMPLE_CSV, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        all_rows = list(reader)
        fieldnames = reader.fieldnames

    # 2. newly_passed link 집합 + blog/kin 출처만
    with open(NEWLY_PASSED_CSV, encoding="utf-8-sig") as f:
        newly_rows = list(csv.DictReader(f))

    targets = [r for r in newly_rows if r.get("source") in ("blog", "kin")]
    target_links = {r["link"]: r["source"] for r in targets}
    print(f"\n본문 크롤링 대상: {len(targets)}건 (blog {sum(1 for r in targets if r['source']=='blog')} + kin {sum(1 for r in targets if r['source']=='kin')})")

    # 3. sample.csv에서 대상 행 찾기 (link로 매칭)
    indexed = {r.get("link", ""): i for i, r in enumerate(all_rows)}

    success = 0
    failed = []
    skipped_already_has = 0

    for i, (link, src) in enumerate(target_links.items(), 1):
        idx = indexed.get(link)
        if idx is None:
            failed.append({"link": link, "source": src, "reason": "sample.csv 미수록"})
            continue

        row = all_rows[idx]
        # 이미 full_text 있으면 skip
        existing = (row.get("full_text") or "").strip()
        if existing and len(existing) > 100:
            skipped_already_has += 1
            continue

        title = row.get("title", "")[:40]

        if src == "blog":
            full_text = fetch_blog_content(link)
        elif src == "kin":
            full_text = fetch_kin_answer(link)
        else:
            full_text = ""

        if full_text.startswith("ERROR") or not full_text or len(full_text) < 100:
            failed.append({
                "link": link,
                "source": src,
                "title": row.get("title", ""),
                "reason": full_text if full_text.startswith("ERROR") else f"본문 짧음 ({len(full_text)}자)",
            })
            print(f"  [{i:3d}/{len(target_links)}] FAIL {src} - {title}")
        else:
            row["full_text"] = full_text
            row["full_text_length"] = len(full_text)
            success += 1
            print(f"  [{i:3d}/{len(target_links)}] OK   {src} ({len(full_text):5d}자) - {title}")

        time.sleep(0.4)

    # 4. sample.csv 저장 (full_text 업데이트된 행 포함)
    # full_text / full_text_length 컬럼이 없으면 추가
    extra_cols = ["full_text", "full_text_length"]
    for col in extra_cols:
        if col not in fieldnames:
            fieldnames = list(fieldnames) + [col]

    with open(SAMPLE_CSV, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in all_rows:
            writer.writerow({k: r.get(k, "") for k in fieldnames})

    # 5. 실패 글 저장
    if failed:
        with open(FAILED_OUT, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=["link", "source", "title", "reason"])
            writer.writeheader()
            for r in failed:
                writer.writerow({k: r.get(k, "") for k in ["link", "source", "title", "reason"]})

    print("\n" + "=" * 70)
    print(f"본문 크롤링 결과:")
    print(f"  성공: {success}건")
    print(f"  실패: {len(failed)}건")
    print(f"  이미 보유: {skipped_already_has}건")
    print(f"  대상 외 (cafe/dc/clien/ppomppu): {len(newly_rows) - len(targets)}건")
    print("=" * 70)


if __name__ == "__main__":
    main()
