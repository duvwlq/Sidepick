from __future__ import annotations

import csv
import re
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path


INPUT_PATH = Path(r"C:\Users\dnjs8\.codex\attachments\5263fe1c-3b15-4edb-82b6-bd3bc845b013\pasted-text.txt")
OUTPUT_PATH = Path(r"D:\Codex_Folder\Sidepick\server\import-data\success_survey_attachment_only.csv")


@dataclass
class CategoryInfo:
    label: str
    slug: str


def normalize_space(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def clean_answer_text(value: str) -> str:
    text = normalize_space(value)
    if not text or text == "-":
        return ""
    text = text.replace(";", ", ")
    text = re.sub(r"\s*,\s*", ", ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip(" ,")


def quoted(value: str) -> str:
    text = clean_answer_text(value)
    if not text:
        return ""
    text = text.strip("'").strip('"')
    return f"'{text}'"


def parse_amount(value: str) -> int | None:
    raw = normalize_space(value)
    if not raw or raw == "-":
        return None

    total = 0.0
    matched = False
    for pattern, multiplier in [
        (r"(\d+(?:\.\d+)?)\s*억", 100_000_000),
        (r"(\d+(?:\.\d+)?)\s*천만", 10_000_000),
        (r"(\d+(?:\.\d+)?)\s*백만", 1_000_000),
        (r"(\d+(?:\.\d+)?)\s*만", 10_000),
    ]:
        found = re.search(pattern, raw)
        if found:
            total += float(found.group(1)) * multiplier
            matched = True

    if matched:
        return int(total)

    digits = re.sub(r"[^0-9]", "", raw)
    return int(digits) if digits else None


def parse_duration_months(value: str) -> int | None:
    raw = normalize_space(value)
    if not raw or raw == "-":
        return None

    total = 0
    year_match = re.search(r"(\d+)\s*년", raw)
    month_match = re.search(r"(\d+)\s*개월", raw)
    if year_match:
        total += int(year_match.group(1)) * 12
    if month_match:
        total += int(month_match.group(1))
    if total:
        return total
    if "1년 이상" in raw:
        return 12
    if "미만" in raw:
        return 1
    digits = re.sub(r"[^0-9]", "", raw)
    return int(digits) if digits else None


def parse_daily_hours(value: str) -> int | None:
    raw = normalize_space(value)
    if not raw or raw == "-":
        return None
    digits = re.sub(r"[^0-9]", "", raw)
    if not digits:
        return None
    return int(digits)


def classify_category(raw: str) -> CategoryInfo:
    source = normalize_space(raw)
    bracket = re.search(r"\[([^\]]+)\]", source)
    value = normalize_space(bracket.group(1) if bracket else source)
    lowered = value.lower()

    if any(token in value for token in ["투자", "재테크", "주식", "코인", "ETF", "부동산", "P2P"]) or "investment" in lowered:
        return CategoryInfo("투자 · 재테크", "investment")
    if any(token in value for token in ["플랫폼", "설문", "배달", "앱테크", "쿠팡", "테스트 작업"]):
        return CategoryInfo("플랫폼 노동", "platform-labor")
    if any(token in value for token in ["온라인 판매", "이커머스", "스마트스토어", "전자상거래", "위탁판매", "오픈마켓"]):
        return CategoryInfo("온라인 판매·이커머스", "online-commerce")
    if any(token in value for token in ["콘텐츠", "SNS", "유튜브", "블로그", "인스타", "퍼스널 브랜딩"]):
        return CategoryInfo("콘텐츠 · SNS", "content-sns")
    if any(token in value for token in ["디지털", "전자책", "PDF", "템플릿", "강의", "자료"]):
        return CategoryInfo("디지털 상품·지식 판매", "digital-products")
    if any(token in value for token in ["프리랜서", "과외", "디자인", "번역", "개발", "촬영"]):
        return CategoryInfo("재능 판매·프리랜서", "talent-freelance")
    if any(token in value for token in ["오프라인", "대면", "행사", "카페", "알바"]):
        return CategoryInfo("오프라인 부업", "offline-sidejob")
    return CategoryInfo("기타", "etc")


def infer_risk_level(category_slug: str, invest_amount: int | None, daily_hours: int | None) -> str:
    if category_slug == "investment":
        return "HIGH"
    if invest_amount is not None and invest_amount >= 5_000_000:
        return "HIGH"
    if daily_hours is not None and daily_hours >= 6:
        return "HIGH"
    if category_slug == "platform-labor" or invest_amount == 0:
        return "LOW"
    return "MEDIUM"


def split_items(value: str) -> list[str]:
    raw = clean_answer_text(value)
    if not raw:
        return []
    return [item.strip() for item in raw.split(",") if item.strip()]


def list_text(items: list[str]) -> str:
    filtered = [normalize_space(item) for item in items if normalize_space(item)]
    if not filtered:
        return ""
    if len(filtered) == 1:
        return filtered[0]
    return ", ".join(filtered[:-1]) + f" 및 {filtered[-1]}"


def format_money(amount: int | None) -> str:
    if amount is None:
        return "금액 정보 없음"
    return f"{amount:,}원"


def compact_money(amount: int | None) -> str:
    if amount is None:
        return "수익"
    if amount >= 100_000_000 and amount % 100_000_000 == 0:
        return f"{amount // 100_000_000}억"
    if amount >= 10_000 and amount % 10_000 == 0:
        return f"{amount // 10_000}만 원"
    return f"{amount:,}원"


def title_focus(raw_category: str) -> str:
    raw = normalize_space(raw_category)
    tail = raw.split("]", 1)[-1] if "]" in raw else raw
    candidates = [normalize_space(part) for part in re.split(r"[/,]", tail) if normalize_space(part)]
    selected: list[str] = []
    for candidate in candidates:
        short = re.sub(r"\s*\(.*?\)", "", candidate).strip()
        if short and short not in selected:
            selected.append(short)
        if len(selected) == 2:
            break
    if not selected:
        return "이 부업"
    return ", ".join(selected)


def build_title(category: str, revenue_amount: int | None, answers: list[str]) -> str:
    focus = title_focus(answers[0])
    result_text = clean_answer_text(answers[5])

    if revenue_amount and revenue_amount > 0:
        return f"{focus}으로 {compact_money(revenue_amount)} 수익을 만든 사례"
    if "가능성" in result_text:
        return f"{focus}에서 부업 가능성을 확인한 사례"
    if "자신감" in result_text:
        return f"{focus}을 통해 자신감을 얻은 사례"
    return f"{focus}을 운영하며 배운 점을 정리한 사례"


def build_summary(category: str, revenue_amount: int | None, answers: list[str]) -> str:
    return build_title(category, revenue_amount, answers)


def build_free_text(
    category: str,
    duration: int | None,
    daily_hours: int | None,
    invest_amount: int | None,
    revenue_amount: int | None,
    answers: list[str],
) -> str:
    duration_text = clean_answer_text(answers[1]) or (f"{duration}개월" if duration else "일정 기간")
    daily_text = clean_answer_text(answers[2]) or (f"하루 {daily_hours}시간" if daily_hours else "시간을 들여")
    result_text = clean_answer_text(answers[5]) or "의미 있는 변화를 경험했다"
    factor_text = list_text(split_items(answers[7])) or "꾸준한 실행"
    adjustment_text = list_text(split_items(answers[8])) or "운영 방식 조정"
    change_text = clean_answer_text(answers[9]) or "생각의 변화가 있었다"
    priority_text = list_text(split_items(answers[10])) or "기본기를 먼저 챙기는 것"
    advice_text = clean_answer_text(answers[11]) or "작게 시작해 보라고"
    closing_text = clean_answer_text(answers[12])

    if revenue_amount is not None and revenue_amount > 0:
        money_sentence = f"수익은 월 평균 {format_money(revenue_amount)} 정도였다."
    else:
        money_sentence = "큰 수익으로 바로 이어지지는 않았지만 경험을 쌓는 계기가 됐다."

    first = (
        f"{category} 부업을 {duration_text} 동안 이어가며 {daily_text} 정도를 꾸준히 투입했다. "
        f"초기 투자금은 {format_money(invest_amount)} 수준이었고, {money_sentence}"
    )
    second = (
        f"진행 과정에서는 {quoted(result_text) or result_text}라는 응답이 나올 만큼 의미 있는 변화를 경험했고, "
        f"핵심 요인으로는 {factor_text} 등을 꼽았다."
    )
    third = (
        f"운영하면서는 {adjustment_text}에 특히 신경 썼고, "
        f"부업 이후의 변화로는 {quoted(change_text) or change_text}라고 답했다."
    )
    fourth = (
        f"처음 시작하는 사람에게는 초반에 {priority_text}부터 점검하고, "
        f"{quoted(advice_text) or advice_text}라는 조언을 남겼다."
    )

    parts = [first, second, third, fourth]
    if closing_text and closing_text not in {"-", "의견없음"}:
        parts.append(f"추가 메모로는 {quoted(closing_text) or closing_text}라고 적었다.")
    return " ".join(parts)


def parse_blocks(text: str) -> list[list[str]]:
    blocks: list[list[str]] = []
    for block in re.split(r"(?m)^#\s*\d+.*$", text):
        stripped = block.strip()
        if not stripped:
            continue
        answers = [normalize_space(match) for match in re.findall(r"(?m)^A\.\s*(.*)$", stripped)]
        if len(answers) >= 13:
            blocks.append(answers[:13])
    return blocks


def main() -> None:
    text = INPUT_PATH.read_text(encoding="utf-8")
    blocks = parse_blocks(text)
    today = date(2026, 6, 24)

    rows: list[dict[str, str]] = []
    for index, answers in enumerate(blocks):
        category = classify_category(answers[0])
        duration = parse_duration_months(answers[1])
        daily_hours = parse_daily_hours(answers[2])
        invest_amount = parse_amount(answers[3])
        revenue_amount = parse_amount(answers[4])
        risk_level = infer_risk_level(category.slug, invest_amount, daily_hours)
        factor_keywords = split_items(answers[7])
        priority_keywords = split_items(answers[10])
        difficulty_items = split_items(answers[8])
        keywords = factor_keywords + [item for item in priority_keywords if item not in factor_keywords]

        rows.append(
            {
                "case_id": f"survey_attachment_success_{index + 1:03d}",
                "title": build_title(category.label, revenue_amount, answers),
                "summary": build_summary(category.label, revenue_amount, answers),
                "free_text": build_free_text(category.label, duration, daily_hours, invest_amount, revenue_amount, answers),
                "category": category.label,
                "category_slug": category.slug,
                "duration": "" if duration is None else str(duration),
                "daily_hours": "" if daily_hours is None else str(daily_hours),
                "invest_amount": "" if invest_amount is None else str(invest_amount),
                "revenue_amount": "" if revenue_amount is None else str(revenue_amount),
                "has_main_job": "true",
                "failure_reasons": "SUCCESS_STORY",
                "difficulties": ";".join(difficulty_items),
                "keywords": ";".join(keywords),
                "failure_category": "SUCCESS_STORY",
                "risk_level": risk_level,
                "source": "survey_attachment",
                "link": "",
                "postdate": (today - timedelta(days=index)).isoformat(),
                "case_status": "SUCCESS",
            }
        )

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(
            file,
            fieldnames=[
                "case_id",
                "title",
                "summary",
                "free_text",
                "category",
                "category_slug",
                "duration",
                "daily_hours",
                "invest_amount",
                "revenue_amount",
                "has_main_job",
                "failure_reasons",
                "difficulties",
                "keywords",
                "failure_category",
                "risk_level",
                "source",
                "link",
                "postdate",
                "case_status",
            ],
        )
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {len(rows)} rows to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
