"""
매칭 테이블 생성 — 7 카테고리 × 7 어려움 = 49개

각 (카테고리, 어려움) 조합마다 Claude로 성공 가이드 텍스트를 생성해
data/matching_table.json 으로 저장한다.

특징:
- data/matching_table_progress.json 에 셀 1개 단위로 즉시 저장 (재시작 가능)
- 짧은 응답 / API 오류는 백오프 후 재시도
- tqdm 진행률 바

실행:
    python -u scripts/05_generate_matching_table.py
"""

import os
import sys
import json
import time
from datetime import datetime
from pathlib import Path

from anthropic import Anthropic
from dotenv import load_dotenv
from tqdm import tqdm

# ---------- 설정 ----------
load_dotenv()

MODEL = "claude-sonnet-4-5"
VERSION = "1.0"
MIN_GUIDE_LEN = 150  # 200~350자 권장이지만 안전 하한
MAX_GUIDE_LEN = 500  # 너무 길면 다시 시도

ROOT_DIR = Path(__file__).resolve().parent.parent  # ai/
DATA_DIR = ROOT_DIR / "data"
OUTPUT_PATH = DATA_DIR / "matching_table.json"
PROGRESS_PATH = DATA_DIR / "matching_table_progress.json"

CATEGORIES = [
    {"key": "online_sales",     "label": "온라인 판매 · 이커머스"},
    {"key": "content_sns",      "label": "콘텐츠 · SNS 기반 수익"},
    {"key": "digital_products", "label": "디지털 상품 · 지식 판매"},
    {"key": "platform_work",    "label": "플랫폼 노동"},
    {"key": "freelance",        "label": "재능 · 프리랜서"},
    {"key": "investment",       "label": "투자 · 재테크"},
    {"key": "offline_work",     "label": "오프라인 부업"},
]

DIFFICULTIES = [
    {"key": "customer_acquisition",     "label": "고객 확보 (마케팅)"},
    {"key": "revenue_structure",        "label": "수익 구조 이해"},
    {"key": "time_management",          "label": "시간 관리"},
    {"key": "monetization",             "label": "수익화 연결"},
    {"key": "sustainability",   "label": "운영 지속성"},
    {"key": "information_lack", "label": "정보 부족"},
    {"key": "competition",              "label": "경쟁 심화"},
]

# ---------- 프롬프트 ----------
SYSTEM_PROMPT = """당신은 부업 실패를 겪은 사용자에게 따뜻하면서도 실용적인 조언을 주는 선배입니다.

[구조] (반드시 이 순서)
1. 공감 1줄 — "~정말 막막하셨겠어요" 같은 톤
2. 단계별 액션 3개 — "1.", "2.", "3." 으로 번호 매김, 구체적인 행동 지시
3. 마무리 격려 1줄 — 부담 덜어주는 한 마디

[길이] 200~350자 (한국어 기준)

[금기] 다음은 절대 쓰지 마세요:
- "포기하라" / "그만두는 게 낫다"
- "당신의 잘못이다" / "준비가 부족했다"
- "쉽게 돈 벌 수 있다" / "이렇게만 하면 성공한다"
- 특정 브랜드·플랫폼 추천 (예: 쿠팡파트너스, 인스타그램 등 구체적 추천 금지)
- "전문가 도움이 필요합니다" / "변호사와 상담하세요"

[출력] 가이드 텍스트만 출력. 헤더, 라벨, 인사말, 마크다운 기호 없이 본문만.
"""

USER_TEMPLATE = """카테고리: {category_label}
어려웠던 점: {difficulty_label}

이 사용자에게 줄 성공 가이드 텍스트를 작성하세요."""


# ---------- LLM 호출 ----------
def call_llm(client: Anthropic, category_label: str, difficulty_label: str, retries: int = 2) -> str:
    """가이드 텍스트 1개 생성. 재시도 + 길이 검증 포함."""
    user_prompt = USER_TEMPLATE.format(
        category_label=category_label,
        difficulty_label=difficulty_label,
    )

    for attempt in range(retries + 1):
        try:
            response = client.messages.create(
                model=MODEL,
                max_tokens=600,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_prompt}],
            )
            text = response.content[0].text.strip()

            if len(text) < MIN_GUIDE_LEN:
                raise ValueError(f"응답 너무 짧음 ({len(text)}자)")
            if len(text) > MAX_GUIDE_LEN:
                raise ValueError(f"응답 너무 김 ({len(text)}자)")

            return text
        except Exception as e:
            if attempt < retries:
                wait = 2 ** attempt  # 1초, 2초
                tqdm.write(f"  ⚠️  재시도 {attempt + 1}/{retries} ({wait}s 후): {e}")
                time.sleep(wait)
            else:
                raise


# ---------- 진행 상황 저장/로드 ----------
def load_progress() -> dict:
    if PROGRESS_PATH.exists():
        with open(PROGRESS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_progress(progress: dict) -> None:
    with open(PROGRESS_PATH, "w", encoding="utf-8") as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)


# ---------- 메인 ----------
def main() -> int:
    if not os.getenv("ANTHROPIC_API_KEY"):
        sys.stderr.write("❌ .env에 ANTHROPIC_API_KEY가 없습니다.\n")
        return 1

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    progress = load_progress()
    if progress:
        print(f"📂 기존 진행 발견: {len(progress)}/49개 완료. 이어서 진행합니다.")

    pairs = [(c, d) for c in CATEGORIES for d in DIFFICULTIES]
    failed: list[dict] = []

    pbar = tqdm(pairs, desc="매칭 테이블 생성", unit="개")
    for cat, diff in pbar:
        key = f"{cat['key']}__{diff['key']}"
        pbar.set_postfix_str(f"{cat['label']} × {diff['label']}")

        if key in progress:
            continue

        try:
            guide = call_llm(client, cat["label"], diff["label"])
            progress[key] = {
                "category_key": cat["key"],
                "category_label": cat["label"],
                "difficulty_key": diff["key"],
                "difficulty_label": diff["label"],
                "guide": guide,
            }
            save_progress(progress)
        except Exception as e:
            tqdm.write(f"  ❌ 실패 [{key}]: {e}")
            failed.append({"key": key, "error": str(e)})

    # 최종 결과 저장
    output = {
        "meta": {
            "version": VERSION,
            "model": MODEL,
            "generated_at": datetime.now().isoformat(timespec="seconds"),
            "total": len(pairs),
            "success": len(progress),
            "failed": len(failed),
            "categories": CATEGORIES,
            "difficulties": DIFFICULTIES,
        },
        "guides": progress,
    }
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print()
    print(f"✅ 저장: {len(progress)}/{len(pairs)} → {OUTPUT_PATH}")
    if failed:
        print(f"❌ 실패 {len(failed)}개:")
        for item in failed:
            print(f"  - {item['key']}: {item['error']}")
        print("   다시 실행하면 실패한 셀만 재시도합니다.")
        return 2

    print(f"🎉 49개 모두 완료. 진행 파일({PROGRESS_PATH.name})은 백업으로 남겨둡니다.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
