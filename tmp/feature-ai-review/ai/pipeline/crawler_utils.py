"""
crawler_utils.py — 11~14번 크롤러/정제 스크립트 공통 모듈 (AI-06, W2)

W1에서 11/12/13/14번 4개 스크립트에 패턴 + 필터 함수가 중복됨.
공통 모듈로 추출해서 한 곳만 수정하면 모든 크롤러에 반영되도록.

사용 예:
    from crawler_utils import (
        SUCCESS_EXPERIENCE_PATTERNS,
        QUESTION_PATTERNS,
        AD_KEYWORDS,
        SIDE_JOB_KEYWORDS,
        OFFTOPIC_KEYWORDS,
        has_success_experience,
        is_question,
        is_ad,
        clean_node,
        count_keywords,
    )

작성: 팀장 (오혜림) — 2026-05-27
"""

import re


# =======================================================================
# 1) 패턴 5종
# =======================================================================

# 성공 경험담 (블로그/지식인/커뮤니티 본문에서 1개 이상 매칭 시 진짜 사례)
SUCCESS_EXPERIENCE_PATTERNS = [
    r"월\s*\d+\s*만원",                # 월 100만원 / 월 500만원
    r"\d+\s*개월\s*만에",              # 3개월 만에
    r"\d+\s*년\s*만에",                # 1년 만에
    r"수익\s*인증",
    r"성공\s*후기",
    r"제가\s*\w+\s*(?:했|해|한)",       # 1인칭 경험
    r"저는\s*\w+\s*(?:했|해|한)",       # 1인칭 경험
    r"\d+\s*만원\s*(?:벌|수익|매출)",   # 50만원 벌었어요
    r"(?:성공|달성)\s*했(?:어|었|네|네요)",
]

# 질문 글 (2개 이상 매칭 시 질문 글로 판정 — 지식인용)
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

# 광고 키워드 (커뮤니티/카페 광고 필터 — 2개 이상 매칭 시 광고로 판정)
AD_KEYWORDS = [
    "오픈채팅", "카톡", "텔레그램", "문의주세요", "상담문의",
    "추천인", "제휴", "수익보장", "초보가능", "당일지급",
    "bit.ly", "tinyurl", "naver.me", "open.kakao.com",
    "리딩방", "전담멘토", "1:1 코칭", "유료 클래스",
    "강의 신청", "VIP", "단톡방", "공동구매", "협찬",
    "DM 주세요", "디엠 주세요", "쪽지 주세요",
    "노하우 가르쳐", "비법 공유", "수강 신청", "코드 입력",
]

# 부업 양성 키워드 (본문에 N개 이상 있어야 부업 글로 인정 — 14번 offtopic 필터용)
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

# 잡담 키워드 (본문에 많이 나오면 잡담으로 간주 — 14번 offtopic 필터용)
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


# =======================================================================
# 2) 필터 함수 4종
# =======================================================================

def has_success_experience(text: str) -> bool:
    """성공 경험담 패턴 1개 이상 매칭 여부."""
    if not text:
        return False
    return any(re.search(p, text) for p in SUCCESS_EXPERIENCE_PATTERNS)


def is_question(text: str) -> bool:
    """질문 글 여부 (지식인용). 패턴 2개 이상 매칭 시 True."""
    if not text:
        return False
    return sum(1 for p in QUESTION_PATTERNS if re.search(p, text)) >= 2


def is_ad(text: str, threshold: int = 2) -> bool:
    """광고 글 여부. 광고 키워드 threshold 이상 매칭 시 True."""
    if not text:
        return False
    return sum(1 for k in AD_KEYWORDS if k in text) >= threshold


def clean_node(node) -> str:
    """BeautifulSoup 노드에서 텍스트 추출 (None 안전)."""
    if not node:
        return ""
    return node.get_text(separator="\n", strip=True)


def count_keywords(text: str, keywords: list) -> int:
    """텍스트 내 키워드 출현 횟수 카운트 (14번 offtopic 필터용)."""
    if not text:
        return 0
    return sum(1 for kw in keywords if kw in text)


# =======================================================================
# 3) 공통 HTTP 헤더
# =======================================================================

HEADERS_PC = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/126.0 Safari/537.36"
    ),
    "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
}

HEADERS_MOBILE = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) "
                  "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
    "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
}
