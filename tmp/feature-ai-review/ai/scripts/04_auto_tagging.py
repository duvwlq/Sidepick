"""
AI-004: 100건 데이터 LLM 자동 태깅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

입력: data/failure_cases_100.csv (13개 컬럼, 픽플리 100건)
출력: data/failure_cases_100_tagged.csv (17개 컬럼)

추가되는 4개 필드:
- keywords: 키워드 3개 (배열을 ;로 join)
- failure_category: 실패 분류 6개 중 하나
- summary: 50자 이내 1줄 요약
- risk_level: high/medium/low

진행 방식:
- 100건 순차 호출
- 매번 progress 파일에 저장 (중간 실패 대비)
- tqdm 프로그레스바
- 응답이 JSON 형식 안 지키면 자동 재시도 2회

사용법:
1. .env에 ANTHROPIC_API_KEY 설정 확인
2. python scripts/04_auto_tagging.py
"""
import json
import os
import re
import sys
import time
import csv
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

# 절대경로 — 어디서 실행해도 ai/data/ 기준
ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
INPUT_PATH = DATA_DIR / "failure_cases_100.csv"
OUTPUT_PATH = DATA_DIR / "failure_cases_100_tagged.csv"
PROGRESS_PATH = DATA_DIR / "tagging_progress.json"


# ═══════════════════════════════════════════════
# 1. 분류 라벨 정의
# ═══════════════════════════════════════════════
FAILURE_CATEGORIES = [
    "마케팅부족",     # 고객 확보 실패, SNS 노출 부족 등
    "자금부족",       # 초기 자본 부족, 운영 자금 고갈
    "시간관리",       # 본업 병행 어려움, 시간 분배 실패
    "타겟분석실패",   # 잘못된 고객층 타겟팅
    "경쟁분석부족",   # 시장/경쟁사 조사 부족
    "기타",           # 위에 안 맞는 경우
]

RISK_LEVELS = ["high", "medium", "low"]


# ═══════════════════════════════════════════════
# 2. 프롬프트 설계
# ═══════════════════════════════════════════════
SYSTEM_PROMPT = f"""당신은 부업 실패 사례를 분석하는 전문가입니다.
사용자의 부업 실패 경험을 읽고 구조화된 JSON으로만 응답하세요.

[출력 JSON 형식 — 반드시 이 형식만 출력]
{{
  "keywords": ["키워드1", "키워드2", "키워드3"],
  "failure_category": "마케팅부족|자금부족|시간관리|타겟분석실패|경쟁분석부족|기타",
  "summary": "1줄 요약 (50자 이내)",
  "risk_level": "high|medium|low"
}}

[필드 가이드]
- keywords: 사례의 핵심 키워드 3개 (명사 위주, 본문에서 추출)
  예: ["마케팅부족", "초기비용", "타겟불명"]
- failure_category: 가장 큰 실패 원인 1개 ({", ".join(FAILURE_CATEGORIES)})
- summary: 50자 이내 1줄 요약. 어떤 부업을, 왜 실패했는지 간결하게
- risk_level: 손실 규모 + 회복 가능성 기준
  - high: 큰 손실, 회복 어려움 (수천만원 손실, 빚, 본업 영향 등)
  - medium: 중간 손실, 회복 가능 (수백만원 손실, 시간 낭비)
  - low: 작은 손실, 학습 기회 (소액, 단기간)

[제약]
- 응답은 오직 JSON만. 설명, 인사, 마크다운 코드블록 금지
- JSON 외 다른 텍스트가 있으면 안 됨
- 한국어 사용"""


def build_user_prompt(record: dict) -> str:
    """100건 1개를 LLM 입력 프롬프트로 변환"""
    return f"""부업 카테고리: {record.get('category', '')}
부업 기간: {record.get('duration', '')}
하루 할애 시간: {record.get('daily_hours', '')}
투자금: {record.get('invest_display', '')}
수익: {record.get('revenue_display', '')}
본업 병행: {record.get('has_main_job', '')}
사용자가 선택한 실패 원인: {record.get('failure_reasons', '')}
사용자가 선택한 어려웠던 점: {record.get('difficulties', '')}

[본문]
{record.get('free_text', '')}

위 사례를 분석해서 JSON으로 출력해주세요."""


# ═══════════════════════════════════════════════
# 3. LLM 호출 + JSON 파싱
# ═══════════════════════════════════════════════
def parse_llm_response(text: str) -> dict:
    """LLM 응답에서 JSON 추출 + 검증"""
    # 코드 블록 제거 (```json ... ``` 또는 ``` ... ```)
    text = re.sub(r"^```(?:json)?\s*\n?", "", text.strip())
    text = re.sub(r"\n?```\s*$", "", text)
    text = text.strip()

    data = json.loads(text)

    # 필수 필드 검증
    required = ["keywords", "failure_category", "summary", "risk_level"]
    for field in required:
        if field not in data:
            raise ValueError(f"필드 누락: {field}")

    # keywords가 리스트인지
    if not isinstance(data["keywords"], list):
        raise ValueError(f"keywords는 리스트여야 함: {type(data['keywords'])}")

    # failure_category 유효성
    if data["failure_category"] not in FAILURE_CATEGORIES:
        raise ValueError(f"failure_category 무효: {data['failure_category']}")

    # risk_level 유효성
    if data["risk_level"] not in RISK_LEVELS:
        raise ValueError(f"risk_level 무효: {data['risk_level']}")

    # summary 50자 이내
    if len(data["summary"]) > 70:  # 약간 여유
        data["summary"] = data["summary"][:50]

    return data


def call_llm(record: dict, retries: int = 2) -> dict:
    """1개 레코드에 대해 LLM 호출 + 파싱"""
    user_prompt = build_user_prompt(record)

    last_error = None
    for attempt in range(retries + 1):
        try:
            response = client.messages.create(
                model=MODEL,
                max_tokens=500,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_prompt}],
            )
            text = response.content[0].text
            return parse_llm_response(text)

        except json.JSONDecodeError as e:
            last_error = f"JSON 파싱 실패: {e}"
        except ValueError as e:
            last_error = str(e)
        except Exception as e:
            last_error = f"LLM 호출 실패: {e}"

        if attempt < retries:
            wait = 2 ** attempt
            tqdm.write(f"   ⚠️  #{record.get('id')} 재시도 {attempt + 1}/{retries} ({wait}s): {last_error}")
            time.sleep(wait)

    raise RuntimeError(f"LLM 태깅 실패 (재시도 {retries}회 모두 실패): {last_error}")


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
# 5. CSV 입출력
# ═══════════════════════════════════════════════
def load_records() -> list:
    """failure_cases_100.csv 읽기"""
    if not INPUT_PATH.exists():
        print(f"❌ 입력 파일 없음: {INPUT_PATH}")
        sys.exit(1)

    with INPUT_PATH.open("r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        return list(reader)


def save_tagged_csv(records: list, tagged: dict) -> None:
    """원본 + 태깅 결과 합쳐서 새 CSV 저장"""
    # 새 컬럼 추가
    new_fieldnames = list(records[0].keys()) + [
        "keywords", "failure_category", "summary", "risk_level"
    ]

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=new_fieldnames)
        writer.writeheader()

        for record in records:
            rid = str(record["id"])
            if rid in tagged:
                t = tagged[rid]
                # keywords는 ; 로 join (CSV 안전)
                record["keywords"] = ";".join(t["keywords"])
                record["failure_category"] = t["failure_category"]
                record["summary"] = t["summary"]
                record["risk_level"] = t["risk_level"]
            else:
                # 실패한 건 빈 값
                record["keywords"] = ""
                record["failure_category"] = ""
                record["summary"] = ""
                record["risk_level"] = ""

            writer.writerow(record)


# ═══════════════════════════════════════════════
# 6. 메인 실행
# ═══════════════════════════════════════════════
def main() -> int:
    records = load_records()
    total = len(records)

    print("=" * 70)
    print(f"🚀 100건 LLM 자동 태깅 시작")
    print(f"   입력: {INPUT_PATH.name} ({total}건)")
    print(f"   모델: {MODEL}")
    print(f"   예상 시간: {total * 9 // 60}~{total * 12 // 60}분")
    print(f"   예상 비용: 약 ${total * 0.02:.2f}")
    print(f"   출력: {OUTPUT_PATH}")
    print("=" * 70)

    progress = load_progress()
    if progress:
        print(f"\n📂 기존 진행률 발견: {len(progress)}/{total}개 완료. 이어서 진행합니다.\n")

    started_at = time.time()
    failures = []

    pbar = tqdm(records, total=total, desc="자동 태깅", unit="건", ncols=100)

    for record in pbar:
        rid = str(record["id"])
        category = record.get("category", "")[:10]
        pbar.set_postfix_str(f"#{rid} {category}", refresh=True)

        if rid in progress:
            continue

        try:
            tagged = call_llm(record)
            progress[rid] = tagged
            save_progress(progress)
        except Exception as e:
            failures.append({"id": rid, "error": str(e)})
            tqdm.write(f"  ✗ #{rid} 실패: {e}")
            continue

    pbar.close()
    elapsed = time.time() - started_at

    # 최종 CSV 저장
    save_tagged_csv(records, progress)

    # 결과 출력
    print("\n" + "=" * 70)
    print(f"✅ 완료")
    print(f"   성공: {len(progress)}/{total}건")
    print(f"   실패: {len(failures)}건")
    print(f"   소요 시간: {elapsed:.0f}초 ({elapsed / 60:.1f}분)")
    print(f"   저장 위치: {OUTPUT_PATH}")
    print("=" * 70)

    if failures:
        print("\n⚠️  실패 항목 (재실행 시 자동 재시도):")
        for f in failures:
            print(f"  - #{f['id']}: {f['error']}")
        return 1

    # 분류 분포 출력
    from collections import Counter
    cat_counts = Counter(t["failure_category"] for t in progress.values())
    risk_counts = Counter(t["risk_level"] for t in progress.values())

    print("\n📊 failure_category 분포:")
    for cat, cnt in cat_counts.most_common():
        print(f"   {cat}: {cnt}건")

    print("\n📊 risk_level 분포:")
    for risk, cnt in risk_counts.most_common():
        print(f"   {risk}: {cnt}건")

    # 샘플 1건
    sample_id = next(iter(progress))
    sample = progress[sample_id]
    print(f"\n📋 샘플 결과 (#{sample_id}):")
    print(f"   keywords: {sample['keywords']}")
    print(f"   failure_category: {sample['failure_category']}")
    print(f"   summary: {sample['summary']}")
    print(f"   risk_level: {sample['risk_level']}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
