"""
11_refine_success_data.py — 성공 사례 정제 시도 (AI-01 — 2주차 작업 미리)

발견된 문제 기반 정제:
1. 블로그: description 200자 잘림 → 모바일 URL로 본문 크롤링
2. 지식인: 질문 글 섞임 → 답변 본문 추출 + 질문 패턴 제외
3. 카페: 거의 차단 (로그인 필요) → 시도만 (실패 예상)

샘플 규모:
- 블로그 strict: 10건
- 지식인 strict: 100건
- 카페 strict: 5건 (실패 예상)

산출물:
- ai/data/refined_success_sample.csv (성공 진술 패턴 통과한 진짜 사례)
- ai/data/refined_success_failed.csv (제외된 글 + 사유)

작성: 팀장 (오혜림) — 2026-05-22
"""

import csv
import re
import time
from pathlib import Path
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup


DATA_DIR = Path(__file__).resolve().parent.parent / "data"

# -------------------------------
# 성공 경험담 패턴 (필수 — 이 중 1개 이상 매칭 시 진짜 성공 사례)
# -------------------------------
SUCCESS_EXPERIENCE_PATTERNS = [
    r"월\s*\d+\s*만원",              # 월 100만원 / 월 500만원
    r"\d+\s*개월\s*만에",             # 3개월 만에
    r"\d+\s*년\s*만에",               # 1년 만에
    r"수익\s*인증",
    r"성공\s*후기",
    r"제가\s*\w+\s*(?:했|해|한)",      # "제가 ~ 했어요" 1인칭 경험
    r"저는\s*\w+\s*(?:했|해|한)",      # "저는 ~ 했어요" 1인칭 경험
    r"\d+\s*만원\s*(?:벌|수익|매출)",  # 50만원 벌었어요
    r"(?:성공|달성)\s*했(?:어|었|네|네요)",
]

# 질문 글 패턴 (지식인) — 이거 매칭되면 제외
QUESTION_PATTERNS = [
    r"\?",
    r"궁금해요",
    r"알려주세요",
    r"어떤가요",
    r"가능한가요",
    r"어떻게\s*해야",
    r"추천해\s*주세요",
    r"방법이\s*있을까요",
]


def has_success_experience(text: str) -> bool:
    """성공 경험담 패턴 매칭 여부"""
    return any(re.search(p, text) for p in SUCCESS_EXPERIENCE_PATTERNS)


def is_question(text: str) -> bool:
    """질문 글 여부 (지식인용)"""
    return sum(1 for p in QUESTION_PATTERNS if re.search(p, text)) >= 2


def to_mobile_blog_url(url: str) -> str:
    """blog.naver.com → m.blog.naver.com 변환"""
    return url.replace("blog.naver.com", "m.blog.naver.com")


def fetch_blog_content(url: str, timeout: int = 10) -> str:
    """네이버 블로그 본문 추출 (모바일 URL 기반)"""
    mobile_url = to_mobile_blog_url(url)
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)"
        }
        r = requests.get(mobile_url, headers=headers, timeout=timeout)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "lxml")

        # 모바일 블로그 본문 selector (여러 패턴 시도)
        selectors = [
            "div.se-main-container",
            "div#viewTypeSelector",
            "div.post-view",
            "div._postView",
        ]
        for sel in selectors:
            content = soup.select_one(sel)
            if content:
                text = content.get_text(separator="\n", strip=True)
                if len(text) > 100:
                    return text
        return ""
    except Exception as e:
        return f"ERROR: {e.__class__.__name__}"


def fetch_kin_answer(url: str, timeout: int = 10) -> str:
    """네이버 지식iN 답변 본문 추출"""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        r = requests.get(url, headers=headers, timeout=timeout)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "lxml")

        # 지식인 답변 본문 selector
        selectors = [
            "div._answer",
            "div.answer-content__item",
            "div.se-main-container",
        ]
        for sel in selectors:
            answers = soup.select(sel)
            if answers:
                texts = [a.get_text(separator="\n", strip=True) for a in answers]
                combined = "\n---\n".join(t for t in texts if len(t) > 50)
                if combined:
                    return combined
        return ""
    except Exception as e:
        return f"ERROR: {e.__class__.__name__}"


def process_blog_or_kin(source: str, csv_name: str, target_pass: int, max_attempts: int):
    """블로그/지식인: 본문 크롤링 + 필터 / target_pass 만큼 통과할 때까지 (최대 max_attempts)"""
    csv_path = DATA_DIR / csv_name
    if not csv_path.exists():
        print(f"[SKIP] {csv_path} 없음")
        return [], []

    with open(csv_path, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        rows = list(reader)[:max_attempts]

    print(f"\n=== {source} 본문 크롤링 정제 (목표 {target_pass}건 / 최대 {len(rows)}건 시도) ===")

    refined = []
    failed = []

    for i, row in enumerate(rows, 1):
        if len(refined) >= target_pass:
            print(f"  목표 {target_pass}건 달성. 시도 종료.")
            break

        url = row.get("link", "")
        title = row.get("title", "")
        desc = row.get("description", "")

        # 본문 크롤링
        if source == "blog":
            full_text = fetch_blog_content(url)
        elif source == "kin":
            full_text = fetch_kin_answer(url)
        else:
            full_text = ""

        combined = f"{title}\n{desc}\n{full_text}"

        # 본문 크롤링 실패
        if full_text.startswith("ERROR") or not full_text:
            failed.append({
                **row,
                "fail_reason": "본문 크롤링 실패",
                "full_text_length": 0,
            })
            print(f"  [{i:3d}] FAIL: 본문 못 받음 - {title[:30]}")
            time.sleep(0.3)
            continue

        # 지식인: 질문 글 제외
        if source == "kin" and is_question(title + " " + desc):
            failed.append({
                **row,
                "fail_reason": "질문 글 (지식인)",
                "full_text_length": len(full_text),
            })
            print(f"  [{i:3d}] FAIL: 질문 글 - {title[:30]}")
            time.sleep(0.3)
            continue

        # 성공 경험담 패턴 매칭
        if not has_success_experience(combined):
            failed.append({
                **row,
                "fail_reason": "성공 경험담 패턴 없음",
                "full_text_length": len(full_text),
            })
            print(f"  [{i:3d}] FAIL: 경험담 X - {title[:30]}")
            time.sleep(0.3)
            continue

        # 통과
        refined.append({
            **row,
            "full_text": full_text[:3000],
            "full_text_length": len(full_text),
        })
        print(f"  [{i:3d}] PASS ({len(refined)}/{target_pass}): {title[:30]}")

        time.sleep(0.3)

    return refined, failed


def process_cafe(csv_name: str, target_pass: int, max_attempts: int):
    """카페: 본문 크롤링 차단 → description 기반 정제 (target_pass 만큼)"""
    csv_path = DATA_DIR / csv_name
    if not csv_path.exists():
        print(f"[SKIP] {csv_path} 없음")
        return [], []

    with open(csv_path, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        rows = list(reader)[:max_attempts]

    print(f"\n=== cafe description 기반 정제 (목표 {target_pass}건 / 최대 {len(rows)}건 시도) ===")
    print(f"  ⚠️ 카페는 본문 크롤링 차단 → description (200자)만 사용")

    refined = []
    failed = []

    for i, row in enumerate(rows, 1):
        if len(refined) >= target_pass:
            print(f"  목표 {target_pass}건 달성. 시도 종료.")
            break

        title = row.get("title", "")
        desc = row.get("description", "")

        # description 너무 짧으면 제외
        if len(desc) < 80:
            failed.append({
                **row,
                "fail_reason": "description 너무 짧음 (<80자)",
                "full_text_length": len(desc),
            })
            print(f"  [{i:3d}] FAIL: desc 짧음 - {title[:30]}")
            continue

        combined = f"{title}\n{desc}"

        # 성공 경험담 패턴 매칭
        if not has_success_experience(combined):
            failed.append({
                **row,
                "fail_reason": "성공 경험담 패턴 없음",
                "full_text_length": len(desc),
            })
            print(f"  [{i:3d}] FAIL: 경험담 X - {title[:30]}")
            continue

        # 통과
        refined.append({
            **row,
            "full_text": desc,  # description을 full_text로
            "full_text_length": len(desc),
            "note": "description only (cafe 본문 크롤링 차단)",
        })
        print(f"  [{i:3d}] PASS ({len(refined)}/{target_pass}): {title[:30]}")

    return refined, failed


def main():
    all_refined = []
    all_failed = []

    # 블로그: 목표 50건 / 최대 200건 시도
    refined, failed = process_blog_or_kin("blog", "success_blog_strict.csv", target_pass=50, max_attempts=200)
    all_refined.extend([{**r, "source": "blog"} for r in refined])
    all_failed.extend([{**f, "source": "blog"} for f in failed])

    # 지식인: 기존 49건 유지 (100건 시도 결과)
    refined, failed = process_blog_or_kin("kin", "success_kin_strict.csv", target_pass=100, max_attempts=100)
    all_refined.extend([{**r, "source": "kin"} for r in refined])
    all_failed.extend([{**f, "source": "kin"} for f in failed])

    # 카페: 목표 50건 (description 기반) / 최대 500건 시도
    refined, failed = process_cafe("success_cafe_strict.csv", target_pass=50, max_attempts=500)
    all_refined.extend([{**r, "source": "cafe"} for r in refined])
    all_failed.extend([{**f, "source": "cafe"} for f in failed])

    # 결과 저장
    if all_refined:
        keys = sorted({k for r in all_refined for k in r.keys()})
        with open(DATA_DIR / "refined_success_sample.csv", "w", encoding="utf-8-sig", newline="") as f:
            w = csv.DictWriter(f, fieldnames=keys)
            w.writeheader()
            w.writerows(all_refined)

    if all_failed:
        keys = sorted({k for r in all_failed for k in r.keys()})
        with open(DATA_DIR / "refined_success_failed.csv", "w", encoding="utf-8-sig", newline="") as f:
            w = csv.DictWriter(f, fieldnames=keys)
            w.writeheader()
            w.writerows(all_failed)

    # 통계 출력
    print("\n" + "=" * 60)
    print(f"📊 정제 결과")
    print("=" * 60)
    by_source = {}
    for r in all_refined:
        s = r["source"]
        by_source[s] = by_source.get(s, {"pass": 0, "fail": 0})
        by_source[s]["pass"] += 1
    for f in all_failed:
        s = f["source"]
        by_source[s] = by_source.get(s, {"pass": 0, "fail": 0})
        by_source[s]["fail"] += 1

    for source, stats in by_source.items():
        total = stats["pass"] + stats["fail"]
        pass_rate = (stats["pass"] / total * 100) if total > 0 else 0
        print(f"  {source}: {stats['pass']}/{total}건 통과 ({pass_rate:.1f}%) | 실패 {stats['fail']}건")

    print(f"\n  📂 저장: ai/data/refined_success_sample.csv ({len(all_refined)}건)")
    print(f"  📂 저장: ai/data/refined_success_failed.csv ({len(all_failed)}건)")


if __name__ == "__main__":
    main()
