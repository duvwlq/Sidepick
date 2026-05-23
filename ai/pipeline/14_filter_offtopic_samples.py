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

# 부업 관련 양성 키워드 (이게 본문에 N개 이상 있어야 부업 글로 인정)
SIDE_JOB_KEYWORDS = [
    # 부업 일반
    "부업", "투잡", "N잡", "재택", "부수입", "추가수입",
    # 부업 분야
    "스마트스토어", "쿠팡", "유튜브", "블로그", "인스타", "틱톡",
    "배달", "라이더", "쿠팡이츠", "배민", "대리운전",
    "크몽", "숨고", "탈잉", "프리랜서", "외주",
    "주식", "코인", "비트코인", "부동산", "투자",
    "스토어", "쇼핑몰", "이커머스", "위탁판매",
    "강의", "전자책", "온라인 클래스", "클래스101", "인프런",
    "사업자", "사업자등록",
    # 부업 행위·결과
    "수익", "매출", "벌었", "벌어", "벌고", "수익화",
    "월 100", "월 200", "월 300", "월 500",
    "후기", "성공", "달성", "인증",
    "퇴사", "전업", "본업",
]

# 잡담 식별 키워드 (이게 본문에 많이 나오면 잡담으로 간주)
OFFTOPIC_KEYWORDS = [
    # 게임 관련 잡담
    "메이플", "로아", "리니지", "넷카마", "갤러리", "쌀먹", "쥬얼리",
    "팬픽", "버튜버", "하꼬", "츠다이", "춘카이도", "스파링",
    # 베스트모음 / 운세
    "베스트모음", "베스트글", "운세-", "띠별 운세",
    # 기타 잡담
    "괴문서", "스압", "스포일러", "스포)", "(스포",
    "딸치기", "딸배", "ㅈㄴ", "씹덕", "ㅋㅋㅋ",
    # 캠핑/쇼핑 잡담
    "캠핑장", "이케아", "IOT 스위치", "팝업스토어",
]

# 카테고리별 threshold (kin은 답변 위주라 낮춤)
THRESHOLD_BY_SOURCE = {
    "blog": 5,    # 부업 전문 글 위주 → 높은 threshold OK
    "kin": 3,     # 답변 위주 → 낮춤
    "cafe": 2,    # description-only (200자) → 낮춤
    "dc": 5,      # 잡담 다수 → 엄격
    "clien": 4,
    "ppomppu": 4,
}


def count_keywords(text, keywords):
    if not text:
        return 0
    return sum(1 for kw in keywords if kw in text)


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
