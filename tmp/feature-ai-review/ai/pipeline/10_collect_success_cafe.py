"""
10_collect_success_cafe.py — 네이버 카페 공개글 성공 사례 크롤링 (AI-01)

08(지식iN) / 09(블로그)와 동일 패턴을 네이버 카페 검색 API로 적용.
공개 카페의 글만 수집됨 (비공개 카페는 API 자체가 결과를 안 줌).

산출물:
- ai/data/success_cafe_candidates.csv
- ai/data/success_cafe_strict.csv
- ai/data/success_cafe_review.csv

실행:
  cd ~/Sidepick/ai
  venv/bin/python pipeline/10_collect_success_cafe.py

작성: 팀장 (오혜림) — 2026-05-19
"""

import csv
import html
import os
import re
import time
from pathlib import Path

import requests

print("네이버 카페 — 성공 사례 수집 시작")

CLIENT_ID = os.getenv("NAVER_CLIENT_ID") or "6RqzkvIKdP1wzcnQQsty"
CLIENT_SECRET = os.getenv("NAVER_CLIENT_SECRET") or "Ekz7dLvtuk"

KEYWORDS = [
    # 일반 성공
    "부업 성공 후기",
    "N잡 성공 사례",
    "투잡 성공 후기",
    "재택부업 성공",
    # 카테고리별
    "스마트스토어 성공",
    "스마트스토어 수익 인증",
    "유튜브 부업 성공",
    "쿠팡파트너스 후기",
    "블로그 부업 수익",
    "온라인 강의 수익",
    "배달 부업 후기",
    "콘텐츠 부업 성공",
    # 수익 인증
    "부업 월 100만원",
    "부업 월 300만원",
    "N잡 월 500만원",
]

DISPLAY = 100
MAX_START = 901
SLEEP_SEC = 0.2

AD_KEYWORDS = [
    "오픈채팅", "카톡", "텔레그램", "문의", "상담", "링크",
    "추천인", "제휴", "클릭", "모집", "팀원 모집",
    "수익보장", "초보가능", "당일지급", "무료",
    "bit.ly", "tinyurl", "naver.me", "open.kakao.com",
    "http", "www", "체험단", "리딩방", "전담멘토", "1:1계정",
    "강의 신청", "수강", "코치", "멘토링 신청", "컨설팅",
    "유료 클래스", "VIP", "단톡방",
    # 카페 특유의 영업/사기 키워드
    "투자금 모집", "공동투자", "수익률", "리딩", "픽 알려",
    # ----- v2 광고 보강 (2026-05-19 샘플 검토 결과) -----
    "드림투유", "윤하맘", "버숑", "연이멘토", "엘라멘토", "플랜비",
    "앱인토스", "나이스투잡", "지식맨", "애드릭스", "외도민",
    "CPA", "CPS", "CPI", "1초알바", "재택알바 모집",
    "멘티", "1:1 교육", "1:1 코칭", "노하우 가르쳐", "교육 해드",
    "본사 홈피", "본사 검색", "검색 통해", "본사 통해",
    "60대도", "70대도", "주부도 성공", "컴맹도", "초보부터 고수익",
    "한달 커피값", "하루 1시간만", "하루 30분만",
    "월 100만원 가능", "월 200만원 가능", "수익 인증", "월수익 가능",
    "ㅈㅔ발", "낯뜨거운", "거짓 마케팅", "솔직한 답변",
    # ----- v3 보강 -----
    "멜라루카", "네트워크마케팅", "네트워크 마케팅",
    "온꿈사", "헬로우드림", "뷰업", "경산부업",
    "홈페이지 방문", "검색하시면", "검색해보세요", "검색 통해서",
    "작성비 지원", "원고비", "협찬받아", "협찬 받아", "제공받아 작성",
    "공부방 창업", "공부방 부업", "사옥 짓기",
    "멘토 유니", "초보노하우", "투잡초보성공노하우",
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

SUCCESS_KEYWORDS = [
    "성공", "성공했", "수익 났", "매출 났", "월 100만", "월 200만",
    "월 300만", "월 500만", "월급보다", "본업보다", "꾸준한 수익",
    "흑자", "이익", "정착", "안정화", "꾸준히", "지속",
    "이만큼 벌", "퇴사", "전업", "안정적", "노하우",
]

CATEGORY_MAP = {
    "스마트스토어": ["스마트스토어", "쇼핑몰", "이커머스", "온라인 판매"],
    "유튜브": ["유튜브", "유튭", "구독자", "조회수"],
    "배달": ["배달", "쿠팡이츠", "배민커넥트", "라이더"],
    "블로그": ["블로그", "티스토리", "네이버블로그"],
    "강의": ["강의", "클래스101", "인프런", "온라인 강의"],
    "콘텐츠": ["콘텐츠", "인스타", "릴스", "쇼츠", "틱톡"],
}


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


def count_hashtags(text):
    """블로그/카페 마케팅 글은 해시태그 6개 이상이 거의 100% 광고."""
    return len(re.findall(r"#\S+", text))


def is_ad(text):
    return calculate_ad_score(text) >= 3 or count_hashtags(text) >= 6


def calc_side_score(text):
    return count_hits(text, SIDE_JOB_KEYWORDS) * 2


def calc_success_score(text):
    return count_hits(text, SUCCESS_KEYWORDS) * 3


def calc_noise_score(text):
    return count_hits(text, QUESTION_KEYWORDS) * 2


def tag_category(text):
    for cat, kws in CATEGORY_MAP.items():
        for kw in kws:
            if kw in text:
                return cat
    return "기타"


def search_cafe(query, start=1, display=100):
    """네이버 카페 글 검색 API"""
    url = "https://openapi.naver.com/v1/search/cafearticle.json"
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
# 수집
# -------------------------------
rows = []
seen_links = set()

for keyword in KEYWORDS:
    print(f"\n🔍 키워드: {keyword}")

    for start in range(1, MAX_START, DISPLAY):
        try:
            data = search_cafe(keyword, start=start, display=DISPLAY)
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
            cafename = item.get("cafename", "")
            cafeurl = item.get("cafeurl", "")

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
                "cafename": cafename,
                "cafeurl": cafeurl,
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
# 저장
# -------------------------------
strict_rows = []
review_rows = []

for row in rows:
    if row["is_ad"]:
        continue

    if row["side_score"] >= 2 and row["success_score"] >= 3 and row["final_score"] >= 4:
        strict_rows.append(row)
    elif row["side_score"] >= 2 and row["final_score"] >= 1:
        review_rows.append(row)
    elif row["success_score"] >= 3 and row["final_score"] >= 1:
        review_rows.append(row)

fieldnames = [
    "keyword", "category", "title", "description", "link", "cafename", "cafeurl",
    "ad_score", "side_score", "success_score", "noise_score", "final_score", "is_ad",
]

DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

out_all = DATA_DIR / "success_cafe_candidates.csv"
out_strict = DATA_DIR / "success_cafe_strict.csv"
out_review = DATA_DIR / "success_cafe_review.csv"

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
