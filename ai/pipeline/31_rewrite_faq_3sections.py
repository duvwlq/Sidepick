"""
31_rewrite_faq_3sections.py — faqData.ts answer 평문 → PM-03 v1.6 3섹션 구조 (Pivot Day D-1)

목적: 가이드 페이지(/faq) 답변을 횡단/부업 카테고리별 3섹션 마크다운으로 일괄 변환.

처리 흐름:
1. fe/src/pages/faqData.ts 파싱 → 247개 Q&A 추출 + 카테고리 추론
2. 카테고리별 프롬프트로 Claude Sonnet 4.5 호출
   - 부업 분야 (7 cat): 실전 Tip + 실패 요인 TOP3 + 주의사항
   - 횡단 주제 (9 cat): 절차 단계 + 답변 + 주의사항·법적 안내
3. 변환된 answer로 새 faqData.ts 생성 (원본 question·id·구조 보존)

작성: 팀장(오혜림) — 2026-06-25 (Pivot Day D-1)
"""

from __future__ import annotations

import json
import os
import re
import time
from pathlib import Path

from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

REPO_ROOT = Path(__file__).resolve().parents[2]
FAQ_TS_PATH = REPO_ROOT / "fe" / "src" / "pages" / "faqData.ts"
OUTPUT_TS_PATH = REPO_ROOT / "fe" / "src" / "pages" / "faqData.ts"
PROGRESS_PATH = REPO_ROOT / "ai" / "data" / "faq_rewrite_progress.json"

LLM_MODEL = "claude-sonnet-4-5"

BUSINESS_FIELD_CATEGORIES = {
    "online-commerce", "content-sns", "digital-products",
    "platform-labor", "talent-freelance", "investment", "offline-sidejob",
}
# CROSS_TOPIC: before-start, tax-business, work-plus-sidejob, marketing, tools,
#              mental-care, legal-contract, accounting, insight

BUSINESS_FIELD_PROMPT = """당신은 사이드픽 부업 가이드 콘텐츠 작가입니다. PM-03 v1.6 명세대로 답변을 3섹션 구조로 재구성하세요.

[원본 정보]
질문: {question}
원본 답변: {answer}
카테고리: {category}

[재구성 규칙]
- 원본 답변의 모든 정보를 보존하세요. 새로운 정보·수치를 만들지 마세요.
- 원본에 없는 내용은 일반론으로 짧게 추가 가능하되 과장 X.
- 자연스러운 한국어, 친근한 톤 ("~해요", "~해보세요").
- 마크다운 헤더로 3섹션 분리.

[출력 형식]
```
**실전 Tip**
1. [원본의 핵심 권장 행동 1]
2. [원본의 핵심 권장 행동 2]
3. [원본의 핵심 권장 행동 3]

**실패 요인 TOP3**
1. [원본/일반론에서 추론 가능한 실패 요인 1]
2. [원본/일반론에서 추론 가능한 실패 요인 2]
3. [원본/일반론에서 추론 가능한 실패 요인 3]

**주의사항**
[원본의 주의·당부 사항, 또는 일반적 위험 안내. 2~3문장 이내.]
```

마크다운 블록만 출력하고 다른 설명은 하지 마세요."""

CROSS_TOPIC_PROMPT = """당신은 사이드픽 부업 가이드 콘텐츠 작가입니다. PM-03 v1.6 명세대로 답변을 3섹션 구조로 재구성하세요.

[원본 정보]
질문: {question}
원본 답변: {answer}
카테고리: {category} (횡단 주제)

[재구성 규칙]
- 원본 답변의 모든 정보를 보존하세요. 새로운 정보·수치를 만들지 마세요.
- 자연스러운 한국어, 친근한 톤.
- 마크다운 헤더로 3섹션 분리.
- 카테고리가 세금/법률/계약/회계면 법적 안내 강조.

[출력 형식]
```
**절차 단계**
1. [원본의 첫 단계]
2. [원본의 다음 단계]
3. [원본의 마지막 단계]

**답변**
[원본의 핵심 설명을 자연스러운 한 단락으로. 수치·키워드 그대로.]

**주의사항·법적 안내**
[원본의 주의 사항 + (세금/법률/계약 카테고리면) "전문가 상담 권장" 한 줄. 2~3문장.]
```

마크다운 블록만 출력하고 다른 설명은 하지 마세요."""


def parse_faq_ts(path: Path) -> list[dict]:
    """faqData.ts 파일에서 카테고리 + Q&A 추출."""
    text = path.read_text(encoding="utf-8")

    results: list[dict] = []
    category_pattern = re.compile(
        r"\{\s*id:\s*['\"]([^'\"]+)['\"]\s*,\s*label:\s*['\"]([^'\"]+)['\"]\s*,\s*items:\s*\[(.*?)\]\s*,?\s*\}",
        re.DOTALL,
    )
    item_pattern = re.compile(
        r"\{\s*id:\s*(\d+)\s*,\s*question:\s*['\"]([^'\"]+(?:[^'\"]|\\['\"])*?)['\"]\s*,"
        r"\s*answer:\s*\n?\s*['\"]([^'\"]+(?:[^'\"]|\\['\"])*?)['\"]\s*,?\s*\}",
        re.DOTALL,
    )

    for cat_match in category_pattern.finditer(text):
        cat_id, cat_label, items_block = cat_match.groups()
        for item_match in item_pattern.finditer(items_block):
            item_id, question, answer = item_match.groups()
            answer_clean = answer.replace("\\'", "'").replace('\\"', '"').strip()
            results.append({
                "category_id": cat_id,
                "category_label": cat_label,
                "item_id": int(item_id),
                "question": question.strip(),
                "answer": answer_clean,
            })
    return results


def rewrite_answer(client: Anthropic, item: dict) -> str:
    """LLM으로 answer를 3섹션 구조로 재작성."""
    is_business = item["category_id"] in BUSINESS_FIELD_CATEGORIES
    prompt = (BUSINESS_FIELD_PROMPT if is_business else CROSS_TOPIC_PROMPT).format(
        question=item["question"],
        answer=item["answer"],
        category=item["category_label"],
    )

    response = client.messages.create(
        model=LLM_MODEL,
        max_tokens=1200,
        temperature=0.2,
        messages=[{"role": "user", "content": prompt}],
    )
    text = response.content[0].text.strip()

    # ```...```  블록만 추출
    if "```" in text:
        text = text.split("```", 1)[1]
        if text.startswith(("markdown\n", "md\n")):
            text = text.split("\n", 1)[1]
        text = text.rsplit("```", 1)[0]
    return text.strip()


def escape_for_ts(text: str) -> str:
    """TypeScript 문자열에 안전하게 들어가도록 이스케이프."""
    return text.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n")


def replace_answers_in_ts(text: str, mapping: dict[tuple[str, int], str]) -> str:
    """원본 faqData.ts 텍스트의 answer만 일괄 교체."""
    output_lines: list[str] = []
    lines = text.split("\n")
    current_cat: str | None = None
    current_id: int | None = None
    pending_answer = False

    cat_re = re.compile(r"id:\s*['\"]([^'\"]+)['\"]\s*,\s*label:")
    id_re = re.compile(r"^\s*id:\s*(\d+)\s*,")
    answer_re = re.compile(r"^(\s*answer:\s*)['\"](.+)['\"]\s*,?\s*$")

    i = 0
    while i < len(lines):
        line = lines[i]

        # 카테고리 진입
        cat_m = cat_re.search(line)
        if cat_m:
            current_cat = cat_m.group(1)

        # 아이템 id 진입
        id_m = id_re.match(line)
        if id_m:
            current_id = int(id_m.group(1))

        # answer 단일 라인
        ans_m = answer_re.match(line)
        if ans_m and current_cat is not None and current_id is not None:
            indent = ans_m.group(1)
            new_ans = mapping.get((current_cat, current_id))
            if new_ans:
                line = f"{indent}'{escape_for_ts(new_ans)}',"
            output_lines.append(line)
            i += 1
            continue

        # answer 멀티라인 (answer:\n  '...',)
        if re.match(r"^\s*answer:\s*$", line):
            # 다음 줄에 따옴표 시작
            if i + 1 < len(lines):
                next_line = lines[i + 1]
                m = re.match(r"^(\s*)['\"](.+)['\"]\s*,?\s*$", next_line)
                if m and current_cat is not None and current_id is not None:
                    indent_outer = re.match(r"^(\s*)", line).group(1)
                    new_ans = mapping.get((current_cat, current_id))
                    if new_ans:
                        output_lines.append(f"{indent_outer}answer:")
                        output_lines.append(f"{m.group(1)}'{escape_for_ts(new_ans)}',")
                        i += 2
                        continue

        output_lines.append(line)
        i += 1

    return "\n".join(output_lines)


def main() -> None:
    print("=" * 60)
    print("FAQ answer → PM-03 v1.6 3섹션 구조 일괄 변환 (Pivot Day D-1)")
    print("=" * 60)

    print(f"\n📄 faqData.ts 파싱: {FAQ_TS_PATH}")
    items = parse_faq_ts(FAQ_TS_PATH)
    print(f"   추출: {len(items)}건")

    if not items:
        print("❌ 추출 실패")
        return

    # 진행 상황 불러오기 (재시작 가능)
    progress: dict[str, str] = {}
    if PROGRESS_PATH.exists():
        progress = json.loads(PROGRESS_PATH.read_text(encoding="utf-8"))
        print(f"   기존 진행: {len(progress)}건 완료")

    client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    todo = [it for it in items if f"{it['category_id']}|{it['item_id']}" not in progress]
    print(f"\n🚀 변환 시작: {len(todo)}건")

    for n, item in enumerate(todo, 1):
        key = f"{item['category_id']}|{item['item_id']}"
        try:
            new_answer = rewrite_answer(client, item)
            progress[key] = new_answer
            ftype = "business_field" if item["category_id"] in BUSINESS_FIELD_CATEGORIES else "cross_topic"
            print(f"   [{n}/{len(todo)}] {item['category_id']}#{item['item_id']} ({ftype}) ✓")
            if n % 5 == 0:
                PROGRESS_PATH.write_text(json.dumps(progress, ensure_ascii=False, indent=2), encoding="utf-8")
        except Exception as e:
            print(f"   [{n}/{len(todo)}] {item['category_id']}#{item['item_id']} ❌ {e}")
            time.sleep(2)

    PROGRESS_PATH.write_text(json.dumps(progress, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n✅ 변환 완료: {len(progress)}건 / 진행 파일 저장: {PROGRESS_PATH.name}")

    # faqData.ts 일괄 교체
    print(f"\n📝 faqData.ts 교체 시작")
    mapping = {tuple(k.split("|", 1)): v for k, v in progress.items()}
    mapping = {(k[0], int(k[1])): v for k, v in mapping.items()}

    original_text = FAQ_TS_PATH.read_text(encoding="utf-8")
    new_text = replace_answers_in_ts(original_text, mapping)
    OUTPUT_TS_PATH.write_text(new_text, encoding="utf-8")
    print(f"   저장 완료: {OUTPUT_TS_PATH}")
    print(f"   diff 확인 권장: git diff fe/src/pages/faqData.ts | head -100")


if __name__ == "__main__":
    main()
