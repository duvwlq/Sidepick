"""
12_collect_success_community.py — 디시/클리앙/뽐뿌 성공 사례 크롤링 (AI-01 보강)

카페 description 200자 잘림 문제 회피 → 본문 크롤링 가능한 공개 커뮤니티로 보강.

전략:
- DC: 통합 검색 (search.dcinside.com)
- 클리앙: 검색 (clien.net/service/search)
- 뽐뿌: 검색 (ppomppu.co.kr/search_bbs.php, EUC-KR)

본문 크롤링 후 11_refine_success_data.py와 동일한 필터 적용:
- 성공 경험담 패턴 매칭
- 광고/질문 글 제외
- 사이트당 50건 목표

산출물:
- ai/data/success_community_sample.csv
- ai/data/success_community_failed.csv

작성: 팀장 (오혜림) — 2026-05-22
"""

import csv
import re
import time
from pathlib import Path
from urllib.parse import quote, urljoin

import requests
from bs4 import BeautifulSoup


DATA_DIR = Path(__file__).resolve().parent.parent / "data"

# 공통 패턴 + 필터 함수 + HTTP 헤더 (AI-06)
from crawler_utils import (
    HEADERS_PC,
    SUCCESS_EXPERIENCE_PATTERNS,
    QUESTION_PATTERNS,
    AD_KEYWORDS,
    has_success_experience,
    is_question,
    is_ad,
    clean_node,
)

# 스크립트별 고유 검색 키워드 (공통 모듈 X)
KEYWORDS = [
    "부업 성공 후기",
    "부업 월 100만원",
    "투잡 성공",
    "스마트스토어 후기",
    "쿠팡파트너스 수익",
    "블로그 부업 수익",
    "유튜브 수익화 후기",
]


# -------------------------------
# 디시인사이드 통합 검색
# -------------------------------
def dc_search_posts(keyword, max_pages=3):
    posts = []
    for page in range(1, max_pages + 1):
        url = f"https://search.dcinside.com/post/p/{page}/q/{quote(keyword)}"
        try:
            r = requests.get(url, headers=HEADERS_PC, timeout=10)
            if r.status_code != 200:
                continue
            soup = BeautifulSoup(r.text, "lxml")
            for a in soup.select("a.tit_txt"):
                title = a.get_text(strip=True)
                href = a.get("href", "")
                if href.startswith("http") and "dcinside" in href:
                    posts.append({"title": title, "link": href, "description": ""})
            time.sleep(0.4)
        except Exception as e:
            print(f"  [DC search] {e.__class__.__name__}")
    return posts


def dc_fetch_content(url):
    try:
        r = requests.get(url, headers=HEADERS_PC, timeout=10)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "lxml")
        selectors = [
            "div.write_div",
            "div.writing_view_box",
            "div.gallview_contents",
            "div.view_content_wrap",
            "div.thum-txtin",
        ]
        for sel in selectors:
            node = soup.select_one(sel)
            text = clean_node(node)
            if text and len(text) > 80:
                return text
        return ""
    except Exception as e:
        return f"ERROR: {e.__class__.__name__}"


# -------------------------------
# 클리앙 검색
# -------------------------------
def clien_search_posts(keyword, max_pages=3):
    posts = []
    for page in range(0, max_pages):
        url = f"https://www.clien.net/service/search?q={quote(keyword)}&po={page}"
        try:
            r = requests.get(url, headers=HEADERS_PC, timeout=10)
            if r.status_code != 200:
                continue
            soup = BeautifulSoup(r.text, "lxml")
            for item in soup.select("div.list_item"):
                link_a = (
                    item.select_one("a.subject_fixed")
                    or item.select_one("a.list_subject")
                    or item.find("a", href=re.compile(r"/service/board/.+/\d+"))
                )
                if not link_a:
                    continue
                href = link_a.get("href", "")
                title = link_a.get_text(separator=" ", strip=True)
                if not href or len(title) < 5:
                    continue
                if href.startswith("/"):
                    href = urljoin("https://www.clien.net", href)
                posts.append({"title": title[:200], "link": href.split("?")[0], "description": ""})
            time.sleep(0.4)
        except Exception as e:
            print(f"  [Clien search] {e.__class__.__name__}")
    # dedup
    seen = set()
    deduped = []
    for p in posts:
        if p["link"] in seen:
            continue
        seen.add(p["link"])
        deduped.append(p)
    return deduped


def clien_fetch_content(url):
    try:
        r = requests.get(url, headers=HEADERS_PC, timeout=10)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "lxml")
        selectors = [
            "div.post_view",
            "div.post_content",
            "div.fr-view",
            "article div.post_article",
        ]
        for sel in selectors:
            node = soup.select_one(sel)
            text = clean_node(node)
            if text and len(text) > 80:
                return text
        return ""
    except Exception as e:
        return f"ERROR: {e.__class__.__name__}"


# -------------------------------
# 뽐뿌 검색 (EUC-KR)
# -------------------------------
def ppomppu_search_posts(keyword, max_pages=3):
    posts = []
    seen = set()
    for page in range(1, max_pages + 1):
        url = (
            f"https://www.ppomppu.co.kr/search_bbs.php?"
            f"page_size=20&bbs_cate=2&keyword={quote(keyword, encoding='euc-kr')}&page={page}"
        )
        try:
            r = requests.get(url, headers=HEADERS_PC, timeout=10)
            r.encoding = r.apparent_encoding or "euc-kr"
            if r.status_code != 200:
                continue
            soup = BeautifulSoup(r.text, "lxml")
            for a in soup.find_all("a", href=True):
                href = a["href"]
                if "view.php" not in href:
                    continue
                title = a.get_text(strip=True)
                if not title or len(title) < 5:
                    continue
                if href.startswith("/"):
                    href = urljoin("https://www.ppomppu.co.kr", href)
                elif not href.startswith("http"):
                    href = urljoin("https://www.ppomppu.co.kr/zboard/", href)
                key = href.split("&keyword")[0]
                if key in seen:
                    continue
                seen.add(key)
                posts.append({"title": title[:200], "link": key, "description": ""})
            time.sleep(0.4)
        except Exception as e:
            print(f"  [Ppomppu search] {e.__class__.__name__}")
    return posts


def ppomppu_fetch_content(url):
    try:
        r = requests.get(url, headers=HEADERS_PC, timeout=10)
        r.encoding = r.apparent_encoding or "euc-kr"
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "lxml")
        selectors = [
            "td.han",
            "div.han",
            "td.board-contents",
            "div.board-contents",
        ]
        for sel in selectors:
            node = soup.select_one(sel)
            text = clean_node(node)
            if text and len(text) > 80:
                return text
        # 최후 수단: 본문 영역에 자주 쓰이는 div.han 부재 시 큰 td 탐색
        for td in soup.find_all("td"):
            text = clean_node(td)
            if text and len(text) > 200 and "부업" in text:
                return text
        return ""
    except Exception as e:
        return f"ERROR: {e.__class__.__name__}"


# -------------------------------
# 통합 파이프라인
# -------------------------------
def process_source(source, search_fn, fetch_fn, target_pass=50, max_attempts=200):
    print(f"\n=== {source} 통합 크롤링 (목표 {target_pass}건 / 최대 {max_attempts}건 시도) ===")

    all_posts = []
    seen_links = set()
    for kw in KEYWORDS:
        posts = search_fn(kw)
        for p in posts:
            if p["link"] in seen_links:
                continue
            seen_links.add(p["link"])
            p["keyword"] = kw
            all_posts.append(p)
        if len(all_posts) >= max_attempts:
            break

    all_posts = all_posts[:max_attempts]
    print(f"  검색 결과 수집: {len(all_posts)}건")

    if not all_posts:
        return [], []

    refined = []
    failed = []
    for i, post in enumerate(all_posts, 1):
        if len(refined) >= target_pass:
            print(f"  목표 {target_pass}건 달성. 시도 종료.")
            break

        title = post["title"]
        url = post["link"]
        full_text = fetch_fn(url)

        if full_text.startswith("ERROR") or not full_text:
            failed.append({**post, "fail_reason": "본문 크롤링 실패", "full_text_length": 0})
            print(f"  [{i:3d}] FAIL: 본문 못 받음 - {title[:30]}")
            time.sleep(0.3)
            continue

        combined = f"{title}\n{full_text}"

        if is_ad(combined):
            failed.append({**post, "fail_reason": "광고 의심", "full_text_length": len(full_text)})
            print(f"  [{i:3d}] FAIL: 광고 - {title[:30]}")
            time.sleep(0.3)
            continue

        if is_question(title):
            failed.append({**post, "fail_reason": "질문 글", "full_text_length": len(full_text)})
            print(f"  [{i:3d}] FAIL: 질문 글 - {title[:30]}")
            time.sleep(0.3)
            continue

        if not has_success_experience(combined):
            failed.append({**post, "fail_reason": "성공 경험담 패턴 없음", "full_text_length": len(full_text)})
            print(f"  [{i:3d}] FAIL: 경험담 X - {title[:30]}")
            time.sleep(0.3)
            continue

        refined.append({**post, "full_text": full_text[:3000], "full_text_length": len(full_text)})
        print(f"  [{i:3d}] PASS ({len(refined)}/{target_pass}): {title[:30]}")
        time.sleep(0.3)

    return refined, failed


def main():
    all_refined = []
    all_failed = []

    sources = [
        ("dc", dc_search_posts, dc_fetch_content),
        ("clien", clien_search_posts, clien_fetch_content),
        ("ppomppu", ppomppu_search_posts, ppomppu_fetch_content),
    ]

    for name, search_fn, fetch_fn in sources:
        refined, failed = process_source(name, search_fn, fetch_fn, target_pass=50, max_attempts=200)
        all_refined.extend([{**r, "source": name} for r in refined])
        all_failed.extend([{**f, "source": name} for f in failed])

    # 저장
    if all_refined:
        keys = sorted({k for r in all_refined for k in r.keys()})
        with open(DATA_DIR / "success_community_sample.csv", "w", encoding="utf-8-sig", newline="") as f:
            w = csv.DictWriter(f, fieldnames=keys)
            w.writeheader()
            w.writerows(all_refined)

    if all_failed:
        keys = sorted({k for r in all_failed for k in r.keys()})
        with open(DATA_DIR / "success_community_failed.csv", "w", encoding="utf-8-sig", newline="") as f:
            w = csv.DictWriter(f, fieldnames=keys)
            w.writeheader()
            w.writerows(all_failed)

    print("\n" + "=" * 60)
    print("📊 통합 크롤링 결과")
    print("=" * 60)
    by_source = {}
    for r in all_refined:
        s = r["source"]
        by_source.setdefault(s, {"pass": 0, "fail": 0})
        by_source[s]["pass"] += 1
    for fl in all_failed:
        s = fl["source"]
        by_source.setdefault(s, {"pass": 0, "fail": 0})
        by_source[s]["fail"] += 1
    for src, stats in by_source.items():
        total = stats["pass"] + stats["fail"]
        rate = (stats["pass"] / total * 100) if total > 0 else 0
        print(f"  {src}: {stats['pass']}/{total}건 통과 ({rate:.1f}%) | 실패 {stats['fail']}건")

    print(f"\n  📂 저장: ai/data/success_community_sample.csv ({len(all_refined)}건)")
    print(f"  📂 저장: ai/data/success_community_failed.csv ({len(all_failed)}건)")


if __name__ == "__main__":
    main()
