"""
08_collect_success_cases.py — 성공 사례 크롤링 (AI-01)

기존 01_collect_naver_kin.py의 패턴을 재사용해서 "성공" 키워드 버전으로 작성.
1주차 목표: 50건 raw 수집 (정제는 2주차).

산출물:
- ai/data/success_kin_candidates.csv     (전체 후보 raw)
- ai/data/success_kin_strict.csv         (엄격 성공 후보)
- ai/data/success_kin_review.csv         (검수 필요)

실행:
  cd ~/Sidepick/ai
  source venv/bin/activate
  python pipeline/08_collect_success_cases.py

작성: 팀장 (오혜림) — 2026-05-19
"""

import csv
import html
import os
import re
import time
from pathlib import Path

import requests

print("네이버 지식iN — 성공 사례 수집 시작")

# -------------------------------
# 1) 네이버 API 키
#    .env 우선 / 없으면 기존 하드코딩 키 폴백 (01번 스크립트와 동일)
# -------------------------------
CLIENT_ID = os.getenv("NAVER_CLIENT_ID") or "6RqzkvIKdP1wzcnQQsty"
CLIENT_SECRET = os.getenv("NAVER_CLIENT_SECRET") or "Ekz7dLvtuk"

# -------------------------------
# 2) 성공 중심 키워드 (7개 카테고리 기반)
# -------------------------------
KEYWORDS = [
    # 일반 성공
    "부업 성공",
    "N잡 성공",
    "투잡 성공",
    "재택부업 성공",
    "부업 후기 성공",
    # 카테고리별
    "스마트스토어 성공",
    "스마트스토어 월수입",
    "유튜브 부업 성공",
    "유튜브 수익화 성공",
    "쿠팡파트너스 성공",
    "블로그 수익 성공",
    "온라인 강의 성공",
    "배달 부업 성공",
    "콘텐츠 부업 성공",
    # 수익 인증
    "부업 월 100만원",
    "부업 월 300만원",
    "N잡 월 500만원",
    "투잡으로 월급",
]

DISPLAY = 100
MAX_START = 901
SLEEP_SEC = 0.2

# -------------------------------
# 3) 필터 키워드 — 광고/질문/성공
# -------------------------------
# 광고 필터 — MVP에서 학습한 패턴 그대로 적용
AD_KEYWORDS = [
    "오픈채팅", "카톡", "텔레그램", "문의", "상담", "링크",
    "추천인", "제휴", "클릭", "모집", "팀원 모집",
    "수익보장", "초보가능", "당일지급", "무료",
    "bit.ly", "tinyurl", "naver.me", "open.kakao.com",
    "http", "www", "체험단", "리딩방", "전담멘토", "1:1계정",
    # 성공 키워드라 강의/코치 광고가 많이 섞임 → 추가 필터
    "강의 신청", "수강", "코치", "멘토링 신청", "컨설팅",
    "유료 클래스", "VIP", "단톡방",
]

QUESTION_KEYWORDS = [
    "추천", "추천 좀", "어떰", "어때", "가능?", "가능함?",
    "해본 사람", "아는 사람", "궁금", "질문", "후기 있나요",
    "어떤가요", "알려주세요", "도와주세요", "뭐가 좋",
]

SIDE_JOB_KEYWORDS = [
    "부업", "투잡", "재택", "N잡", "부수입", "추가수입",
    "쿠팡파트너스", "스마트스토어", "쇼핑몰", "이커머스",
    "블로그", "온라인 판매", "제휴", "수익", "매출", "투자", "초기비용",
    "유튜브", "강의", "배달", "콘텐츠",
]

# 성공 신호 키워드
SUCCESS_KEYWORDS = [
    "성공", "성공했", "수익 났", "매출 났", "월 100만", "월 200만",
    "월 300만", "월 500만", "월급보다", "본업보다", "꾸준한 수익",
    "흑자", "이익", "정착", "안정화", "꾸준히", "지속",
    "이만큼 벌", "퇴사", "전업", "안정적", "노하우",
]

# 7개 부업 카테고리 자동 태깅 (PM-04 Tool 명세와 일관)
CATEGORY_MAP = {
    "스마트스토어": ["스마트스토어", "쇼핑몰", "이커머스", "온라인 판매"],
    "유튜브": ["유튜브", "유튭", "구독자", "조회수"],
    "배달": ["배달", "쿠팡이츠", "배민커넥트", "라이더"],
    "블로그": ["블로그", "티스토리", "네이버블로그"],
    "강의": ["강의", "클래스101", "인프런", "온라인 강의"],
    "콘텐츠": ["콘텐츠", "인스타", "릴스", "쇼츠", "틱톡"],
}


# -------------------------------
# 4) 유틸 함수
# -------------------------------
def clean_html_text(text):
    if not text:
        return ""
    text = html.unescape(text)
    text = re.sub(r"<[^>]+>", "", text)
    text = text.replace("&quot;", '"').replace("&apos;", "'")
    return text.strip()


def count_hits(text, keywords):
    return sum(1 for k in keywords if k in text)


def calculate_ad_score(text):
    return count_hits(text, AD_KEYWORDS) * 3


def is_ad(text):
    return calculate_ad_score(text) >= 3


def calc_side_score(text):
    return count_hits(text, SIDE_JOB_KEYWORDS) * 2


def calc_success_score(text):
    return count_hits(text, SUCCESS_KEYWORDS) * 3


def calc_noise_score(text):
    return count_hits(text, QUESTION_KEYWORDS) * 2


def tag_category(text):
    """텍스트를 7개 카테고리로 자동 태깅. 매칭 없으면 '기타'."""
    for cat, kws in CATEGORY_MAP.items():
        for kw in kws:
            if kw in text:
                return cat
    return "기타"


# -------------------------------
# 5) API 호출
# -------------------------------
def search_kin(query, start=1, display=100):
    url = "https://openapi.naver.com/v1/search/kin.json"
    headers = {
        "X-Naver-Client-Id": CLIENT_ID,
        "X-Naver-Client-Secret": CLIENT_SECRET,
    }
    params = {
        "query": query,
        "display": display,
        "start": start,
        "sort": "sim",
    }
    response = requests.get(url, headers=headers, params=params, timeout=20)
    response.raise_for_status()
    return response.json()


# -------------------------------
# 6) 수집
# -------------------------------
rows = []
seen_links = set()

for keyword in KEYWORDS:
    print(f"\n🔍 키워드: {keyword}")

    for start in range(1, MAX_START, DISPLAY):
        try:
            data = search_kin(keyword, start=start, display=DISPLAY)
        except Exception as e:
            print(f"API 호출 실패: {e}")
            break

        items = data.get("items", [])
        if not items:
            break

        added_this_round = 0

        for item in items:
            title = clean_html_text(item.get("title", ""))
            description = clean_html_text(item.get("description", ""))
            link = item.get("link", "")
            pubdate = item.get("pubDate", "")

            if not link or link in seen_links:
                continue

            text_all = f"{title}\n{description}"

            ad_score = calculate_ad_score(text_all)
            side_score = calc_side_score(text_all)
            success_score = calc_success_score(text_all)
            noise_score = calc_noise_score(text_all)
            final_score = side_score + success_score - noise_score
            category = tag_category(text_all)

            row = {
                "keyword": keyword,
                "category": category,
                "title": title,
                "description": description,
                "link": link,
                "pubDate": pubdate,
                "ad_score": ad_score,
                "side_score": side_score,
                "success_score": success_score,
                "noise_score": noise_score,
                "final_score": final_score,
                "is_ad": is_ad(text_all),
            }

            rows.append(row)
            seen_links.add(link)
            added_this_round += 1

        print(f"start={start} / 누적 수집={len(rows)}")

        if added_this_round == 0:
            break

        time.sleep(SLEEP_SEC)

# -------------------------------
# 7) 분리 저장
# -------------------------------
strict_rows = []
review_rows = []

for row in rows:
    if row["is_ad"]:
        continue

    # 엄격: side 2점 이상 + success 3점 이상 + 최종 4점 이상
    if row["side_score"] >= 2 and row["success_score"] >= 3 and row["final_score"] >= 4:
        strict_rows.append(row)
    # 검수: 부업 신호 있고 점수 1점 이상
    elif row["side_score"] >= 2 and row["final_score"] >= 1:
        review_rows.append(row)
    elif row["success_score"] >= 3 and row["final_score"] >= 1:
        review_rows.append(row)

fieldnames = [
    "keyword", "category", "title", "description", "link", "pubDate",
    "ad_score", "side_score", "success_score", "noise_score", "final_score", "is_ad",
]

# 출력 디렉토리
DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

out_all = DATA_DIR / "success_kin_candidates.csv"
out_strict = DATA_DIR / "success_kin_strict.csv"
out_review = DATA_DIR / "success_kin_review.csv"

with open(out_all, "w", newline="", encoding="utf-8-sig") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

with open(out_strict, "w", newline="", encoding="utf-8-sig") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(strict_rows)

with open(out_review, "w", newline="", encoding="utf-8-sig") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(review_rows)

print(f"\n✅ 전체 후보: {len(rows)}개  →  {out_all.name}")
print(f"✅ 엄격 성공 후보: {len(strict_rows)}개  →  {out_strict.name}")
print(f"✅ 검수 필요: {len(review_rows)}개  →  {out_review.name}")
print(f"\n📁 저장 위치: {DATA_DIR}")
