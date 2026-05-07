"""
AI-005: 성공 가이드 매칭 테이블 49개 LLM 1차 생성 (v2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

매트릭스: 카테고리 7개 × 어려웠던 점 7개 = 49개 매칭
출력: ai/data/matching_table.json (영문 슬러그 키 + 한글 라벨 분리)
모델: claude-sonnet-4-5

가이드 톤 (v2 변경 사항):
- 화자: 경험 많은 부업 선배
- 형식: 공감 1줄 + 단계별 액션 1·2·3 + 마무리 격려 1줄
- 길이: 200~350자
- 금기: 포기 권유, 자존감 깎기, 과장, 특정 브랜드 추천, 책임 회피

JSON 구조 (v2 변경 사항):
- key: 영문 슬러그 (예: "online_sales__customer_acquisition")
- label: 한글 라벨 (사용자 표시용)
- 두 정보 모두 보관 → BE 조회는 key, 화면 표시는 label

진행 방식:
- 49개를 순차 호출 (rate limit 안전)
- 매번 progress 파일에 즉시 저장 (중간 실패 대비)
- tqdm 프로그레스바

사용법:
1. .env에 ANTHROPIC_API_KEY=sk-ant-... 설정
2. pip install anthropic python-dotenv tqdm
3. python scripts/05_generate_matching_table.py
"""
import json
import os
import sys
import time
from pathlib import Path

from anthropic import Anthropic
from dotenv import load_dotenv
from tqdm import tqdm

# ═══════════════════════════════════════════════
# 0. 환경 설정
# ═══════════════════════════════════════════════
load_dotenv()

API_KEY = os.getenv("ANTHROPIC_API_KEY")
if not API_KEY:
    print("❌ ANTHROPIC_API_KEY가 .env에 없습니다.")
    sys.exit(1)

client = Anthropic(api_key=API_KEY)
MODEL = "claude-sonnet-4-5"

ROOT_DIR = Path(__file__).resolve().parent.parent  # ai/
DATA_DIR = ROOT_DIR / "data"
OUTPUT_PATH = DATA_DIR / "matching_table.json"
PROGRESS_PATH = DATA_DIR / "matching_table_progress.json"


# ═══════════════════════════════════════════════
# 1. 매트릭스 정의 (영문 슬러그 + 한글 라벨)
# ═══════════════════════════════════════════════
CATEGORIES = [
    {
        "key": "online_sales",
        "label": "온라인 판매 · 이커머스",
        "examples": "스마트스토어, 쿠팡·오픈마켓, 구매대행, 위탁판매(드롭쉬핑), 해외구매 수입판매, 재고 기반 쇼핑몰 등",
    },
    {
        "key": "content_sns",
        "label": "콘텐츠 · SNS 기반 수익",
        "examples": "유튜브, 블로그, 인스타그램, 틱톡, 뉴스레터, 개인 브랜딩 기반 등",
    },
    {
        "key": "digital_products",
        "label": "디지털 상품 · 지식 판매",
        "examples": "전자책 판매, 강의 제작(클래스/인강), 템플릿·디자인 판매, 노션·자료 판매, PDF 자료 판매 등",
    },
    {
        "key": "platform_work",
        "label": "플랫폼 노동",
        "examples": "배달(배민, 쿠팡이츠 등), 대리운전, 쿠팡플렉스, 단기 알바 플랫폼, 설문 참여·앱테크 등",
    },
    {
        "key": "freelance",
        "label": "재능 · 프리랜서",
        "examples": "디자인, 영상 편집, 글쓰기·카피라이팅, 개발, 번역, 크몽·탈잉 등 플랫폼 활동",
    },
    {
        "key": "investment",
        "label": "투자 · 재테크",
        "examples": "주식, 코인, ETF, 부동산 소액 투자, P2P 투자 등",
    },
    {
        "key": "offline_work",
        "label": "오프라인 부업",
        "examples": "공방·핸드메이드, 플리마켓 판매, 클래스 운영(오프라인) 등",
    },
]

DIFFICULTIES = [
    {"key": "customer_acquisition", "label": "고객 확보 (마케팅)"},
    {"key": "revenue_structure", "label": "수익 구조 이해"},
    {"key": "time_management", "label": "시간 관리"},
    {"key": "monetization", "label": "수익화 연결"},
    {"key": "sustainability", "label": "운영 지속성"},
    {"key": "information_lack", "label": "정보 부족"},
    {"key": "competition", "label": "경쟁 심화"},
]


# ═══════════════════════════════════════════════
# 2. 프롬프트 설계 (옵션 B: 부업 선배 + 단계별)
# ═══════════════════════════════════════════════
SYSTEM_PROMPT = """당신은 부업을 여러 번 시도해본 경험 많은 선배입니다.
한 번 실패한 후배에게 따뜻하게, 그러나 실용적으로 다음 시도를 위한 가이드를 줍니다.

[화자 정체성]
- 경험 많은 부업 선배 (멘토보다는 친근한 선배 톤)
- 본인도 비슷한 실패를 겪어봤다는 공감 베이스
- 답을 알려주기보다 "이렇게 해보면 어땠을까" 식으로 제안

[가이드 형식 — 반드시 이 구조 지킬 것]
1. 공감 1줄: 후배의 어려움에 공감하는 한 줄로 시작
2. 단계별 액션 3개: "1." "2." "3." 번호 매겨서 구체적인 행동 제시
3. 마무리 1줄: 격려하는 한 줄로 끝

[원칙]
- 길이: 전체 200~350자
- 단계별 액션은 추상적이지 않게, 실제 손에 잡히는 행동으로
- "~하세요" 명령형보다 "~해보면 좋아요" 권유형
- 처음부터 완벽하지 않아도 된다는 메시지를 자연스럽게 녹여낼 것

[금기 — 절대 하지 말 것]
- "포기하세요", "그만두는 게 낫다" 같은 단념 권유
- "당신의 잘못", "준비가 부족했다" 같이 자존감 깎는 표현
- "쉽게 돈 벌 수 있다", "이렇게만 하면 성공" 같은 과장
- 특정 브랜드/플랫폼 강력 추천 ("쿠팡파트너스 하세요" 등)
- "전문가 도움 받으세요", "변호사 상담하세요" 같은 책임 회피
- 헤더, 마크다운, 이모지 사용 금지 (평문만)"""


def build_user_prompt(category: dict, difficulty: dict) -> str:
    return f"""부업 카테고리: {category['label']}
({category['examples']})

이 분이 가장 어려웠던 점: {difficulty['label']}

이 분에게 다음 시도에서 활용할 수 있는 가이드를 작성해주세요.

형식:
- 공감 1줄
- 1. (구체적 액션)
- 2. (구체적 액션)
- 3. (구체적 액션)
- 마무리 격려 1줄

가이드 본문만 출력해주세요."""


# ═══════════════════════════════════════════════
# 3. LLM 호출 (재시도 + 짧은 응답 거르기)
# ═══════════════════════════════════════════════
def call_llm(category: dict, difficulty: dict, retries: int = 2) -> str:
    user_prompt = build_user_prompt(category, difficulty)

    last_error = None
    for attempt in range(retries + 1):
        try:
            response = client.messages.create(
                model=MODEL,
                max_tokens=600,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_prompt}],
            )
            text = response.content[0].text.strip()

            # 너무 짧거나 단계별 형식 안 지키면 재시도
            if len(text) < 100:
                raise ValueError(f"응답이 너무 짧음 ({len(text)}자): {text[:50]}")
            # "1." 이 본문에 없으면 단계별 형식 안 지킨 것
            if "1." not in text:
                raise ValueError(f"단계별 형식 누락: {text[:80]}")

            return text
        except Exception as e:
            last_error = e
            if attempt < retries:
                wait = 2 ** attempt
                tqdm.write(f"   ⚠️  재시도 {attempt + 1}/{retries} ({wait}s): {e}")
                time.sleep(wait)
            continue

    raise RuntimeError(f"LLM 호출 실패 (재시도 {retries}회 모두 실패): {last_error}")


# ═══════════════════════════════════════════════
# 4. 진행 상황 저장/복원
# ═══════════════════════════════════════════════
def load_progress() -> dict:
    if PROGRESS_PATH.exists():
        return json.loads(PROGRESS_PATH.read_text(encoding="utf-8"))
    return {}


def save_progress(progress: dict) -> None:
    PROGRESS_PATH.parent.mkdir(parents=True, exist_ok=True)
    PROGRESS_PATH.write_text(
        json.dumps(progress, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


# ═══════════════════════════════════════════════
# 5. 메인 실행
# ═══════════════════════════════════════════════
def main() -> int:
    total = len(CATEGORIES) * len(DIFFICULTIES)

    print("=" * 70)
    print(f"🚀 매칭 테이블 생성 시작 (v2: 부업 선배 톤 + 영문 슬러그)")
    print(f"   매트릭스: {len(CATEGORIES)} × {len(DIFFICULTIES)} = {total}개")
    print(f"   모델: {MODEL}")
    print(f"   예상 시간: {total * 6 // 60}~{total * 9 // 60}분")
    print(f"   예상 비용: 약 ${total * 0.025:.2f}")
    print(f"   출력: {OUTPUT_PATH}")
    print("=" * 70)

    progress = load_progress()
    if progress:
        print(f"\n📂 기존 진행률 발견: {len(progress)}/{total}개 완료. 이어서 진행합니다.\n")

    started_at = time.time()
    failures = []

    # 모든 (카테고리, 어려움) 조합 평탄화
    all_pairs = [
        (category, difficulty)
        for category in CATEGORIES
        for difficulty in DIFFICULTIES
    ]

    pbar = tqdm(
        all_pairs,
        total=total,
        desc="매칭 테이블 생성",
        unit="개",
        ncols=100,
    )

    for category, difficulty in pbar:
        key = f"{category['key']}__{difficulty['key']}"

        pbar.set_postfix_str(
            f"{category['key'][:12]} × {difficulty['key'][:18]}",
            refresh=True,
        )

        if key in progress:
            continue

        try:
            guide = call_llm(category, difficulty)
            progress[key] = {
                "category_key": category["key"],
                "category_label": category["label"],
                "difficulty_key": difficulty["key"],
                "difficulty_label": difficulty["label"],
                "guide": guide,
            }
            save_progress(progress)
        except Exception as e:
            failures.append({"key": key, "error": str(e)})
            tqdm.write(f"  ✗ {key} 실패: {e}")
            continue

    pbar.close()

    elapsed = time.time() - started_at
    success_count = len(progress)

    # 최종 결과 저장 (BE/FE 사용용 — 메타 + 매트릭스 정의 + 가이드)
    final_output = {
        "meta": {
            "version": "2.0",
            "model": MODEL,
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "total": total,
            "success": success_count,
            "failed": len(failures),
            "tone": "experienced_senior_with_step_actions",
        },
        "matrix": {
            "categories": [
                {"key": c["key"], "label": c["label"]} for c in CATEGORIES
            ],
            "difficulties": [
                {"key": d["key"], "label": d["label"]} for d in DIFFICULTIES
            ],
        },
        "guides": progress,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(final_output, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    # 결과 출력
    print("\n" + "=" * 70)
    print(f"✅ 완료")
    print(f"   성공: {success_count}/{total}건")
    print(f"   실패: {len(failures)}건")
    print(f"   소요 시간: {elapsed:.0f}초 ({elapsed / 60:.1f}분)")
    print(f"   저장 위치: {OUTPUT_PATH}")
    print("=" * 70)

    if failures:
        print("\n⚠️  실패 항목 (스크립트 재실행 시 자동 재시도):")
        for f in failures:
            print(f"  - {f['key']}: {f['error']}")
        return 1

    # 샘플 1건 출력 (검수 참고용)
    if progress:
        sample_key = next(iter(progress))
        sample = progress[sample_key]
        print("\n📋 샘플 결과 (1건 — 검수 참고용):")
        print(f"  [{sample['category_label']} × {sample['difficulty_label']}]")
        print()
        print("  " + sample['guide'].replace("\n", "\n  "))

    return 0


if __name__ == "__main__":
    sys.exit(main())
