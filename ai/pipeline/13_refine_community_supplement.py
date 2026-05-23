"""
13_refine_community_supplement.py — 클리앙/뽐뿌 부족분 보강 (AI-01)

12번 결과: 클리앙 25/115 (목표 50), 뽐뿌 18/103 (목표 50) — 미달
보강 전략:
- 키워드 확장 (7 → 14)
- 페이지 깊이 확장 (max_pages 3 → 5)
- 기존 success_community_sample.csv와 dedup
- 동일 파일에 append 저장

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
SAMPLE_CSV = DATA_DIR / "success_community_sample.csv"
FAILED_CSV = DATA_DIR / "success_community_failed.csv"

HEADERS_PC = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/126.0 Safari/537.36"
    ),
    "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
}

# 12번과 동일한 패턴 (통일성)
SUCCESS_EXPERIENCE_PATTERNS = [
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

AD_KEYWORDS = [
    "오픈채팅", "카톡", "텔레그램", "문의주세요", "상담문의",
    "추천인", "제휴", "수익보장", "초보가능", "당일지급",
    "bit.ly", "tinyurl", "naver.me", "open.kakao.com",
    "리딩방", "전담멘토", "1:1 코칭", "유료 클래스",
    "강의 신청", "VIP", "단톡방", "공동구매", "협찬",
    "DM 주세요", "디엠 주세요", "쪽지 주세요",
    "노하우 가르쳐", "비법 공유", "수강 신청",
]

# 확장된 키워드 (7 → 14)
KEYWORDS_EXTENDED = [
    "부업 성공 후기",
    "부업 월 100만원",
    "투잡 성공",
    "스마트스토어 후기",
    "쿠팡파트너스 수익",
    "블로그 부업 수익",
    "유튜브 수익화 후기",
    # 신규 추가 7개
    "투잡 후기",
    "직장인 부업 인증",
    "재택 부업 수익",
    "부업 1년 후기",
    "퇴사 후 부업",
    "온라인 부업 후기",
    "월 200만원 부업",
]


def has_success_experience(text):
    return any(re.search(p, text) for p in SUCCESS_EXPERIENCE_PATTERNS)


def is_question(text):
    return sum(1 for p in QUESTION_PATTERNS if re.search(p, text)) >= 2


def is_ad(text):
    return sum(1 for k in AD_KEYWORDS if k in text) >= 2


def clean_node(node):
    if not node:
        return ""
    return node.get_text(separator="\n", strip=True)


# -------------------------------
# 클리앙
# -------------------------------
def clien_search_posts(keyword, max_pages=5):
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
    # dedup within search results
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
# 뽐뿌
# -------------------------------
def ppomppu_search_posts(keyword, max_pages=5):
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
        for td in soup.find_all("td"):
            text = clean_node(td)
            if text and len(text) > 200 and "부업" in text:
                return text
        return ""
    except Exception as e:
        return f"ERROR: {e.__class__.__name__}"


# -------------------------------
# 보강 파이프라인
# -------------------------------
def load_existing_links(csv_path, source_filter=None):
    """기존 결과 CSV의 link 컬럼을 set으로 반환 (dedup용)"""
    if not csv_path.exists():
        return set()
    links = set()
    with open(csv_path, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if source_filter and row.get("source") != source_filter:
                continue
            link = row.get("link", "")
            if link:
                links.add(link)
    return links


def load_existing_rows(csv_path):
    """기존 CSV 모든 row를 list로 반환"""
    if not csv_path.exists():
        return []
    with open(csv_path, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        return list(reader)


def supplement_source(source, search_fn, fetch_fn, target_total, existing_count):
    """기존 count에서 target_total까지 채우기"""
    needed = target_total - existing_count
    if needed <= 0:
        print(f"\n=== {source} 이미 목표 달성 ({existing_count}건) — 스킵 ===")
        return [], []

    print(f"\n=== {source} 보강 (기존 {existing_count}건 / 목표 {target_total}건 / {needed}건 더 필요) ===")

    existing_links = load_existing_links(SAMPLE_CSV, source_filter=source)
    existing_links |= load_existing_links(FAILED_CSV, source_filter=source)
    print(f"  기존 시도한 link 총 {len(existing_links)}건 (dedup 대상)")

    # 검색
    all_posts = []
    seen_in_session = set()
    for kw in KEYWORDS_EXTENDED:
        posts = search_fn(kw, max_pages=5)
        for p in posts:
            if p["link"] in existing_links or p["link"] in seen_in_session:
                continue
            seen_in_session.add(p["link"])
            p["keyword"] = kw
            all_posts.append(p)

    print(f"  신규 후보: {len(all_posts)}건")

    if not all_posts:
        return [], []

    refined = []
    failed = []
    for i, post in enumerate(all_posts, 1):
        if len(refined) >= needed:
            print(f"  목표 {needed}건 달성. 시도 종료.")
            break

        title = post["title"]
        url = post["link"]
        full_text = fetch_fn(url)

        if full_text.startswith("ERROR") or not full_text:
            failed.append({**post, "fail_reason": "본문 크롤링 실패", "full_text_length": 0})
            print(f"  [{i:3d}] FAIL: 본문 X - {title[:30]}")
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
            print(f"  [{i:3d}] FAIL: 질문 - {title[:30]}")
            time.sleep(0.3)
            continue

        if not has_success_experience(combined):
            failed.append({**post, "fail_reason": "성공 경험담 패턴 없음", "full_text_length": len(full_text)})
            print(f"  [{i:3d}] FAIL: 경험담 X - {title[:30]}")
            time.sleep(0.3)
            continue

        refined.append({**post, "full_text": full_text[:3000], "full_text_length": len(full_text)})
        print(f"  [{i:3d}] PASS ({len(refined)}/{needed}): {title[:30]}")
        time.sleep(0.3)

    return refined, failed


def main():
    # 1) 기존 결과 로드
    existing_rows = load_existing_rows(SAMPLE_CSV)
    existing_failed = load_existing_rows(FAILED_CSV)

    by_source = {}
    for r in existing_rows:
        s = r.get("source", "")
        by_source[s] = by_source.get(s, 0) + 1
    print(f"📥 기존 sample.csv 분포: {by_source}")

    # 2) 클리앙/뽐뿌 보강 (각 50건 목표)
    new_refined = []
    new_failed = []

    refined, failed = supplement_source(
        "clien", clien_search_posts, clien_fetch_content,
        target_total=50, existing_count=by_source.get("clien", 0)
    )
    new_refined.extend([{**r, "source": "clien"} for r in refined])
    new_failed.extend([{**f, "source": "clien"} for f in failed])

    refined, failed = supplement_source(
        "ppomppu", ppomppu_search_posts, ppomppu_fetch_content,
        target_total=50, existing_count=by_source.get("ppomppu", 0)
    )
    new_refined.extend([{**r, "source": "ppomppu"} for r in refined])
    new_failed.extend([{**f, "source": "ppomppu"} for f in failed])

    # 3) 기존 + 신규 합쳐서 저장
    merged_rows = existing_rows + new_refined
    merged_failed = existing_failed + new_failed

    if merged_rows:
        keys = sorted({k for r in merged_rows for k in r.keys()})
        with open(SAMPLE_CSV, "w", encoding="utf-8-sig", newline="") as f:
            w = csv.DictWriter(f, fieldnames=keys)
            w.writeheader()
            w.writerows(merged_rows)

    if merged_failed:
        keys = sorted({k for r in merged_failed for k in r.keys()})
        with open(FAILED_CSV, "w", encoding="utf-8-sig", newline="") as f:
            w = csv.DictWriter(f, fieldnames=keys)
            w.writeheader()
            w.writerows(merged_failed)

    # 4) 통계
    print("\n" + "=" * 60)
    print("📊 보강 결과")
    print("=" * 60)
    final_by_source = {}
    for r in merged_rows:
        s = r.get("source", "")
        final_by_source[s] = final_by_source.get(s, 0) + 1

    for src, count in sorted(final_by_source.items()):
        before = by_source.get(src, 0)
        delta = count - before
        marker = "✅" if count >= 50 else "⚠️"
        print(f"  {marker} {src}: {before} → {count}건 (+{delta})")

    print(f"\n  📂 저장: ai/data/success_community_sample.csv ({len(merged_rows)}건)")
    print(f"  📂 저장: ai/data/success_community_failed.csv ({len(merged_failed)}건)")


if __name__ == "__main__":
    main()
