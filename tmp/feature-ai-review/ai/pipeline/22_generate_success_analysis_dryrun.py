"""
22_generate_success_analysis_dryrun.py — AI-14 dry-run (10건 품질 검증)

PM-14 v1 기준. ai/prompts/AI-14-success_analysis_v1.md 프롬프트 사용.
labeled_success_sample.csv에서 7개 분야 균형 샘플 10건 선정 후 Sonnet 호출.

선정 기준:
- true_label == "success"
- len(full_text) >= 500
- 7개 부업 분야 분포 (가능한 경우) + etc 1~2건

출력:
- ai/data/success_analysis_drafts_dryrun.json (10건 결과)
- 콘솔에 토큰 사용량 + 검증 issue 요약

작성: 팀장(오혜림) — 2026-06-02
"""

from __future__ import annotations

import csv
import json
import os
import random
import sys
import time
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from pathlib import Path

from anthropic import Anthropic
from dotenv import load_dotenv

# 경로 (스크립트 위치 무관하게 동작)
REPO_ROOT = Path(__file__).resolve().parents[2]
ENV_PATH = REPO_ROOT / "ai" / ".env"
INPUT_PATH = REPO_ROOT / "ai" / "data" / "labeled_success_sample.csv"
PROMPT_PATH = REPO_ROOT / "ai" / "prompts" / "AI-14-success_analysis_v1.md"
OUTPUT_PATH = REPO_ROOT / "ai" / "data" / "success_analysis_drafts_dryrun.json"

load_dotenv(ENV_PATH)

MODEL = "claude-sonnet-4-5-20250929"  # Sonnet 4.6 호환 (사용 가능한 가장 최근)
MAX_TOKENS = 1500
TEMPERATURE = 0.3
KST = timezone(timedelta(hours=9))

ALLOWED_SLUGS = {
    "online-commerce", "content-sns", "digital-products", "platform-labor",
    "talent-freelance", "investment", "offline-sidejob", "etc",
}
BANNED_PHRASES = ["반드시", "무조건", "100%", "절대"]
TARGET_CATEGORIES = [
    "online-commerce", "content-sns", "digital-products", "platform-labor",
    "talent-freelance", "investment", "offline-sidejob",
]


def load_candidates() -> list[dict]:
    with INPUT_PATH.open(encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    return [
        r for r in rows
        if r.get("true_label") == "success" and len(r.get("full_text", "")) >= 500
    ]


def pick_balanced(candidates: list[dict], n: int = 10, seed: int = 42) -> list[dict]:
    """7개 분야 각 1~2건 + etc 1~2건 = 10건 균형 샘플."""
    rng = random.Random(seed)
    by_cat: dict[str, list[dict]] = defaultdict(list)
    for c in candidates:
        slug = c.get("category_slug", "etc") or "etc"
        by_cat[slug].append(c)

    picked: list[dict] = []
    # 7개 분야 각 1건씩 우선
    for cat in TARGET_CATEGORIES:
        pool = by_cat.get(cat, [])
        if pool:
            picked.append(rng.choice(pool))
    # 남는 슬롯은 etc 또는 본문 긴 것
    remaining = n - len(picked)
    etc_pool = by_cat.get("etc", [])
    if etc_pool and remaining > 0:
        picked.extend(rng.sample(etc_pool, min(remaining, len(etc_pool))))
    return picked[:n]


def load_prompt() -> tuple[str, str]:
    """프롬프트 .md에서 System / User 템플릿 추출."""
    text = PROMPT_PATH.read_text(encoding="utf-8")
    sys_start = text.find("## System Prompt")
    user_start = text.find("## User Prompt")
    schema_start = text.find("## 출력 JSON 스키마")
    if min(sys_start, user_start, schema_start) < 0:
        raise ValueError("프롬프트 섹션을 찾지 못했어요.")

    def _extract_block(start: int, end: int) -> str:
        chunk = text[start:end]
        in_code = False
        lines = []
        for line in chunk.splitlines():
            if line.strip().startswith("```"):
                in_code = not in_code
                continue
            if in_code:
                lines.append(line)
        return "\n".join(lines).strip()

    system_prompt = _extract_block(sys_start, user_start)
    user_template = _extract_block(user_start, schema_start)
    return system_prompt, user_template


def validate(draft: dict, full_text: str) -> list[str]:
    issues: list[str] = []
    cat = draft.get("category_inferred", {})
    if cat.get("slug") not in ALLOWED_SLUGS:
        issues.append(f"invalid slug: {cat.get('slug')}")
    for factor in draft.get("success_factors", []):
        qp = factor.get("quoted_phrase", "")
        if qp and qp not in full_text:
            issues.append(f"quoted_phrase not in body: {qp[:30]}...")
    diff = draft.get("difference_from_failures", "")
    for ban in BANNED_PHRASES:
        if ban in diff:
            issues.append(f"banned phrase in diff: {ban}")
    return issues


def call_claude(client: Anthropic, system: str, user: str) -> tuple[dict, dict]:
    resp = client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        temperature=TEMPERATURE,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    text = "".join(b.text for b in resp.content if hasattr(b, "text"))
    # JSON 파싱 (markdown ```json 감싸기 허용)
    if text.strip().startswith("```"):
        text = text.strip().strip("`")
        if text.startswith("json"):
            text = text[4:]
    draft = json.loads(text.strip())
    usage = {
        "input_tokens": resp.usage.input_tokens,
        "output_tokens": resp.usage.output_tokens,
    }
    return draft, usage


def main() -> None:
    if not os.getenv("ANTHROPIC_API_KEY"):
        print("❌ ANTHROPIC_API_KEY 미설정", file=sys.stderr)
        sys.exit(1)

    candidates = load_candidates()
    print(f"📊 success + 본문 500자+ 후보: {len(candidates)}건")
    picked = pick_balanced(candidates, n=10)
    print(f"📌 dry-run 대상: {len(picked)}건")
    for p in picked:
        slug = p.get("category_slug", "etc") or "etc"
        print(f"   - {p['case_id']} ({slug}) {p['title'][:30]}...")

    system_prompt, user_template = load_prompt()
    client = Anthropic()

    results = []
    total_in = total_out = 0
    issues_count = 0

    for i, case in enumerate(picked, 1):
        print(f"\n[{i}/{len(picked)}] {case['case_id']} 호출 중...", end=" ", flush=True)
        user = user_template.format(
            case_id=case["case_id"],
            title=case.get("title", ""),
            full_text=case.get("full_text", "")[:4000],  # 본문 4K자 cap
            category_slug_raw=case.get("category_slug", "etc"),
        )
        try:
            t0 = time.time()
            draft, usage = call_claude(client, system_prompt, user)
            elapsed = time.time() - t0
            total_in += usage["input_tokens"]
            total_out += usage["output_tokens"]
            issues = validate(draft, case.get("full_text", ""))
            issues_count += len(issues)
            draft["_meta"] = {
                "case_id": case["case_id"],
                "model": MODEL,
                "prompt_version": "AI-14-v1",
                "input_tokens": usage["input_tokens"],
                "output_tokens": usage["output_tokens"],
                "elapsed_sec": round(elapsed, 2),
                "validation_issues": issues,
            }
            draft["_source"] = {
                "title": case.get("title", ""),
                "link": case.get("link", ""),
                "category_slug_raw": case.get("category_slug", "etc"),
            }
            results.append(draft)
            print(f"✅ {usage['input_tokens']}in/{usage['output_tokens']}out "
                  f"({elapsed:.1f}s) issues={len(issues)}")
        except Exception as e:
            print(f"❌ {type(e).__name__}: {e}")
            results.append({
                "_meta": {"case_id": case["case_id"], "error": str(e)},
            })

    output = {
        "version": "dryrun-v1",
        "generated_at": datetime.now(KST).isoformat(timespec="seconds"),
        "model": MODEL,
        "prompt_version": "AI-14-v1",
        "summary": {
            "total_cases": len(picked),
            "successful_drafts": sum(1 for r in results if "error" not in r.get("_meta", {})),
            "total_input_tokens": total_in,
            "total_output_tokens": total_out,
            "estimated_cost_usd": round(
                total_in * 3 / 1_000_000 + total_out * 15 / 1_000_000, 4
            ),
            "total_validation_issues": issues_count,
        },
        "drafts": results,
    }
    OUTPUT_PATH.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n✅ {OUTPUT_PATH}")
    print(f"💰 비용: ${output['summary']['estimated_cost_usd']:.4f} "
          f"(in={total_in}, out={total_out})")
    print(f"⚠️ 검증 이슈 합계: {issues_count}")


if __name__ == "__main__":
    main()
