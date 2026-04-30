"""
픽플리 노션 마크다운 → CSV 변환 스크립트
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
입력: 사용자_데이터_수합__100건__350c0ff4ce3180bb8f96e94eb4d2605f.md
출력: pickply_100.csv

추출 컬럼:
- id: 1~100
- source: "pickply"
- category: 8개 카테고리 표준화
- duration: 부업 기간 (구간)
- daily_hours: 하루 할애 시간 (구간)
- invest_amount: 투자금 (원 단위, 정수)
- revenue_amount: 수익 (원 단위, 정수)
- has_main_job: 본업 병행 여부 (예/아니오)
- failure_reasons: 실패 원인 (콤마 구분)
- difficulties: 어려웠던 점 (콤마 구분)
- free_text: 본문
"""
import re
import csv
from pathlib import Path

# ═══════════════════════════════════════════════
# 1. 카테고리 표준화 매핑
# ═══════════════════════════════════════════════
# 원본 데이터에 [카테고리명] 헤더가 있는 케이스를 우선 처리
# 헤더가 없는 케이스(예: "재능 판매 · 프리랜서 (...)")는 폴백 키워드로 처리
PRIMARY_HEADERS = [
    ("플랫폼노동", ["플랫폼 기반 노동", "플랫폼·기반"]),
    ("온라인판매_이커머스", ["온라인 판매", "온라인·판매", "이커머스"]),
    ("콘텐츠_SNS", ["콘텐츠 · SNS", "콘텐츠·SNS", "콘텐츠 SNS"]),
    ("투자_재테크", ["투자 · 재테크", "투자·재테크", "투자 재테크"]),
    ("재능_프리랜서", ["재능 판매", "재능·판매", "프리랜서"]),
    ("오프라인부업", ["오프라인 기반"]),
    ("디지털상품_지식판매", ["디지털 상품", "디지털·상품", "지식 판매"]),
]

# 폴백: 헤더가 없을 때 본문 내용으로 추정
FALLBACK_KEYWORDS = [
    ("플랫폼노동", ["배민", "쿠팡이츠", "대리운전", "쿠팡플렉스", "단기 알바", "앱테크"]),
    ("투자_재테크", ["주식", "코인", "ETF", "부동산", "P2P"]),
    ("콘텐츠_SNS", ["유튜브", "블로그", "인스타그램", "틱톡", "뉴스레터", "개인 브랜딩"]),
    ("온라인판매_이커머스", ["스마트스토어", "오픈마켓", "구매대행", "위탁판매", "드롭쉬핑"]),
    ("재능_프리랜서", ["디자인", "영상 편집", "크몽", "탈잉"]),
    ("오프라인부업", ["공방", "핸드메이드", "플리마켓", "클래스 운영"]),
    ("디지털상품_지식판매", ["전자책", "강의 제작", "템플릿", "PDF"]),
]


def classify_category(category_text: str) -> str:
    """원시 카테고리 텍스트를 표준 카테고리로 매핑 (헤더 우선, 폴백 보조)"""
    text = category_text.strip()

    # 1차: 대괄호 헤더 또는 명시적 카테고리명 매칭
    for std_key, keywords in PRIMARY_HEADERS:
        if any(kw in text for kw in keywords):
            return std_key

    # 2차: 폴백 키워드
    for std_key, keywords in FALLBACK_KEYWORDS:
        if any(kw in text for kw in keywords):
            return std_key

    return "기타"  # #76번 "배달, 주식" 같은 케이스


# ═══════════════════════════════════════════════
# 2. 부업 기간 / 할애 시간 정제
# ═══════════════════════════════════════════════
def clean_duration(text: str) -> str:
    """부업 기간을 표준 5구간으로 정제"""
    text = text.strip()
    if "1년 이상" in text:
        return "1년 이상"
    if "6개월~1년" in text or "6개월-1년" in text:
        return "6개월~1년"
    if "3~6개월" in text or "3-6개월" in text:
        return "3~6개월"
    if "1~3개월" in text or "1-3개월" in text:
        return "1~3개월"
    if "1개월 미만" in text:
        return "1개월 미만"
    return text  # 매칭 안 되면 원본


def clean_daily_hours(text: str) -> str:
    """할애 시간을 표준 4구간으로 정제"""
    text = text.strip()
    if "5시간 이상" in text:
        return "5시간 이상"
    if "3~5시간" in text or "3-5시간" in text:
        return "3~5시간"
    if "1~3시간" in text or "1-3시간" in text:
        return "1~3시간"
    if "1시간 미만" in text:
        return "1시간 미만"
    return text


# ═══════════════════════════════════════════════
# 3. 투자금/수익 단위 정제 (원 단위 통일)
# ═══════════════════════════════════════════════
def parse_amount(text: str) -> int:
    """
    "2,000,909원" → 2000909
    "2억원" → 200000000
    "1500000" → 1500000
    "30000000" → 30000000
    "0" → 0
    "없음" → 0
    "-" → -1 (미기재)
    "1억" → 100000000
    "1000만원" → 10000000
    "10000원" → 10000
    """
    text = text.strip().replace(",", "").replace(" ", "")

    if text in ("", "-", "없음", "0", "0원"):
        return 0 if text != "-" else -1

    # 음수 처리 (#77 "-300000")
    is_negative = text.startswith("-")
    if is_negative:
        text = text[1:]

    # "원" 제거
    text = text.replace("원", "")

    # 억/만 단위 처리
    multiplier = 1
    if "억" in text:
        # "2억" 또는 "2억5000만"
        parts = text.split("억")
        try:
            eok = int(re.sub(r"\D", "", parts[0])) if parts[0] else 0
        except ValueError:
            return 0
        man_part = parts[1] if len(parts) > 1 else ""
        try:
            if "만" in man_part:
                man = int(re.sub(r"\D", "", man_part.replace("만", ""))) if re.sub(r"\D", "", man_part.replace("만", "")) else 0
                result = eok * 100000000 + man * 10000
            elif man_part and re.sub(r"\D", "", man_part):
                # 억 뒤에 숫자만 (보통 만원 단위로 해석)
                result = eok * 100000000 + int(re.sub(r"\D", "", man_part)) * 10000
            else:
                result = eok * 100000000
        except ValueError:
            result = eok * 100000000
        return -result if is_negative else result

    if "만" in text:
        try:
            man = int(re.sub(r"\D", "", text.replace("만", "")))
            result = man * 10000
            return -result if is_negative else result
        except ValueError:
            return 0

    if "천" in text:
        try:
            cheon = int(re.sub(r"\D", "", text.replace("천", "")))
            result = cheon * 1000
            return -result if is_negative else result
        except ValueError:
            return 0

    # 그냥 숫자
    digits = re.sub(r"\D", "", text)
    if not digits:
        return 0
    try:
        result = int(digits)
        return -result if is_negative else result
    except ValueError:
        return 0


def parse_amount_pair(text: str) -> tuple:
    """
    "2,000,909원 → 1,500,000원" → (2000909, 1500000)
    "0 → 0" → (0, 0)
    "10000000 → -" → (10000000, -1)
    """
    text = text.strip()
    # "→" 또는 "->" 분리
    parts = re.split(r"→|->", text)
    if len(parts) != 2:
        return (0, 0)
    return (parse_amount(parts[0]), parse_amount(parts[1]))


# ═══════════════════════════════════════════════
# 4-1. 금액을 한글 + 숫자 표기로 변환
# ═══════════════════════════════════════════════
def to_korean_amount(amount: int) -> str:
    """
    100000000 → "1억(100,000,000)"
    1500000 → "150만(1,500,000)"
    150000000 → "1억 5,000만(150,000,000)"
    1000 → "1,000"   (1만원 미만은 그냥 숫자)
    0 → "0"
    -1 → "미기재"
    -300000 → "-30만(-300,000)"
    """
    if amount == -1:
        return "미기재"
    if amount == 0:
        return "0"

    is_negative = amount < 0
    abs_amount = abs(amount)
    sign = "-" if is_negative else ""

    # 1만원 미만은 그냥 숫자만 (한글 표기 어색해서)
    if abs_amount < 10_000:
        return f"{sign}{abs_amount:,}"

    eok = abs_amount // 100_000_000
    remainder = abs_amount % 100_000_000
    man = remainder // 10_000
    won = remainder % 10_000

    parts = []
    if eok > 0:
        parts.append(f"{eok:,}억")
    if man > 0:
        parts.append(f"{man:,}만")
    if won > 0:
        parts.append(f"{won:,}")

    korean = " ".join(parts)
    return f"{sign}{korean}({sign}{abs_amount:,})"


# ═══════════════════════════════════════════════
# 4-2. 데이터 수정 적용 (이상치 보정)
# ═══════════════════════════════════════════════
DATA_OVERRIDES = {
    # #21: 단위 오기재 → 사용자 직접 수정값 적용
    # 원본: 100000000 → 1000000000 (1억 → 10억, 배달로는 비현실적)
    # 수정: 1000000 → 10000000 (100만 → 1천만)
    21: {
        "invest_amount": 1_000_000,
        "revenue_amount": 10_000_000,
    },
}


def apply_overrides(record: dict) -> dict:
    """이상치/오기재 데이터 보정"""
    rid = record["id"]
    if rid in DATA_OVERRIDES:
        for k, v in DATA_OVERRIDES[rid].items():
            record[k] = v
    return record


# ═══════════════════════════════════════════════
# 4. 마크다운 파싱
# ═══════════════════════════════════════════════
def parse_pickply_markdown(md_text: str) -> list:
    """노션 마크다운에서 100건 추출"""
    # ### N 으로 분리
    blocks = re.split(r"\n### (\d+)\n", md_text)
    # blocks[0]은 헤더, 이후 (번호, 본문) 쌍

    records = []
    for i in range(1, len(blocks), 2):
        idx = blocks[i].strip()
        body = blocks[i + 1] if i + 1 < len(blocks) else ""
        record = parse_one_block(idx, body)
        if record:
            records.append(record)
    return records


def parse_one_block(idx: str, body: str) -> dict:
    """한 건의 블록 파싱"""
    lines = [line.strip() for line in body.split("\n") if line.strip()]

    record = {
        "id": int(idx),
        "source": "pickply",
        "category": "",
        "duration": "",
        "daily_hours": "",
        "invest_amount": 0,
        "revenue_amount": 0,
        "has_main_job": "",
        "failure_reasons": "",
        "difficulties": "",
        "free_text": "",
    }

    state = "category"  # 상태 머신: category → period → amount → main_job → reason → difficulty → body
    body_lines = []

    for line in lines:
        if line == "---":
            break

        # 카테고리 (첫 번째 **bold** 줄)
        if state == "category" and line.startswith("**") and line.endswith("**"):
            cat_text = line.strip("*")
            record["category"] = classify_category(cat_text)
            state = "period"
            continue

        # "1년 이상 | 하루 1~3시간" 형식
        if state == "period" and "|" in line:
            parts = [p.strip() for p in line.split("|")]
            if len(parts) >= 2:
                record["duration"] = clean_duration(parts[0])
                record["daily_hours"] = clean_daily_hours(parts[1])
                state = "amount"
                continue

        # 금액 줄 ("→" 또는 "->" 포함)
        if state == "amount" and ("→" in line or "->" in line):
            invest, revenue = parse_amount_pair(line)
            record["invest_amount"] = invest
            record["revenue_amount"] = revenue
            state = "main_job"
            continue

        # 본업 병행
        if state == "main_job" and "본업 병행" in line:
            if "예" in line:
                record["has_main_job"] = "예"
            elif "아니오" in line:
                record["has_main_job"] = "아니오"
            state = "reason"
            continue

        # 실패 원인
        if state == "reason" and "실패 원인" in line:
            value = line.split(":", 1)[1].strip() if ":" in line else ""
            record["failure_reasons"] = value
            state = "difficulty"
            continue

        # 어려웠던 점
        if state == "difficulty" and "어려웠던 점" in line:
            value = line.split(":", 1)[1].strip() if ":" in line else ""
            record["difficulties"] = value
            state = "body"
            continue

        # 본문 시작
        if state == "body":
            if line == "본문:" or line.startswith("본문"):
                continue
            body_lines.append(line)

    record["free_text"] = " ".join(body_lines).strip()
    return record


# ═══════════════════════════════════════════════
# 5. 메인 실행
# ═══════════════════════════════════════════════
def main():
    input_path = Path("사용자_데이터_수합__100건__350c0ff4ce3180bb8f96e94eb4d2605f.md")
    output_path = Path("pickply_100.csv")

    if not input_path.exists():
        print(f"❌ 입력 파일 없음: {input_path}")
        print(f"   현재 폴더에 노션 마크다운 파일을 두세요.")
        return

    md_text = input_path.read_text(encoding="utf-8")
    records = parse_pickply_markdown(md_text)

    # 이상치/오기재 데이터 보정
    records = [apply_overrides(r) for r in records]

    # 한글 표기 컬럼 추가
    for r in records:
        r["invest_display"] = to_korean_amount(r["invest_amount"])
        r["revenue_display"] = to_korean_amount(r["revenue_amount"])

    print(f"✅ 파싱 완료: {len(records)}건")
    print(f"   ↳ 데이터 보정 적용: {len(DATA_OVERRIDES)}건 (#{', #'.join(map(str, DATA_OVERRIDES.keys()))})")

    # 누락 데이터 체크
    issues = []
    for r in records:
        if not r["category"]:
            issues.append(f"  #{r['id']}: 카테고리 누락")
        if not r["duration"]:
            issues.append(f"  #{r['id']}: 기간 누락")
        if not r["free_text"]:
            issues.append(f"  #{r['id']}: 본문 누락")

    if issues:
        print(f"\n⚠️  검토 필요 ({len(issues)}건):")
        for msg in issues[:10]:
            print(msg)

    # CSV 저장 — 컬럼 순서 정리 (한글 표기를 숫자 옆에)
    fieldnames = [
        "id", "source", "category",
        "duration", "daily_hours",
        "invest_amount", "invest_display",      # 숫자 + 한글 표기
        "revenue_amount", "revenue_display",    # 숫자 + 한글 표기
        "has_main_job",
        "failure_reasons", "difficulties",
        "free_text",
    ]
    with output_path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)

    print(f"\n✅ 저장 완료: {output_path}")
    print(f"   총 {len(records)}건 / {len(fieldnames)} 컬럼")

    # 카테고리 분포 출력
    from collections import Counter
    cat_counts = Counter(r["category"] for r in records)
    print(f"\n📊 카테고리 분포:")
    for cat, cnt in cat_counts.most_common():
        print(f"   {cat}: {cnt}건")


if __name__ == "__main__":
    main()
