"""
26_generate_success_analysis_full.py — AI-18 본격 분석글 생성

clean_cases.csv 32건 success_story를 대상으로 Claude Sonnet으로
PM-14 v1 스키마의 SuccessAnalysisDraft 생성.

dry-run 결과 (W3 22번 스크립트) 활용 + clean_cases.csv 32건 + 추가 18건 (필요 시)
= 약 50건 산출 목표.

작성: 팀장(오혜림) — 2026-06-10
의존: PM-14 v1 / ai/prompts/AI-14-success_analysis_v1.md / clean_cases.csv
"""

from __future__ import annotations

import csv
import json
import os
import sys
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path

from anthropic import Anthropic
from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parents[2]
ENV_PATH = REPO_ROOT / "ai" / ".env"
INPUT_PATH = REPO_ROOT / "ai" / "data" / "clean_cases.csv"
PROMPT_PATH = REPO_ROOT / "ai" / "prompts" / "AI-14-success_analysis_v1.md"
OUTPUT_PATH = REPO_ROOT / "ai" / "data" / "success_analysis_drafts.json"

load_dotenv(ENV_PATH)

MODEL = "claude-sonnet-4-5-20250929"
MAX_TOKENS = 1500
TEMPERATURE = 0.3
KST = timezone(timedelta(hours=9))

ALLOWED_SLUGS = {
    "online-commerce", "content-sns", "digital-products", "platform-labor",
    "talent-freelance", "investment", "offline-sidejob", "etc",
}
BANNED_PHRASES = ("반드시", "무조건", "100%", "절대")


def load_targets(limit: int = 50) -> list[dict]:
    with INPUT_PATH.open(encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    targets = [r for r in rows if r.get("case_type") == "success_story"]
    return targets[:limit]


def load_prompt() -> tuple[str, str]:
    text = PROMPT_PATH.read_text(encoding="utf-8")
    sys_start = text.find("## System Prompt")
    user_start = text.find("## User Prompt")
    schema_start = text.find("## 출력 JSON 스키마")

    def _extract(start: int, end: int) -> str:
        in_code = False
        lines = []
        for line in text[start:end].splitlines():
            if line.strip().startswith("```"):
                in_code = not in_code
                continue
            if in_code:
                lines.append(line)
        return "\n".join(lines).strip()

    return _extract(sys_start, user_start), _extract(user_start, schema_start)


def validate(draft: dict, full_text: str) -> list[str]:
    issues: list[str] = []
    cat = draft.get("category_inferred")
    if isinstance(cat, dict) and cat.get("slug") not in ALLOWED_SLUGS:
        issues.append(f"invalid_slug:{cat.get('slug')}")
    for factor in draft.get("success_factors", []) or []:
        if not isinstance(factor, dict):
            issues.append(f"factor_not_dict:{str(factor)[:30]}")
            continue
        qp = factor.get("quoted_phrase", "")
        if qp and qp not in full_text:
            issues.append(f"quoted_phrase_not_in_body:{qp[:30]}")
    diff = draft.get("difference_from_failures", "")
    if isinstance(diff, str):
        for ban in BANNED_PHRASES:
            if ban in diff:
                issues.append(f"banned_phrase:{ban}")
    return issues


def call_claude(client: Anthropic, system: str, user: str) -> tuple[dict, dict]:
    resp = client.messages.create(
        model=MODEL, max_tokens=MAX_TOKENS, temperature=TEMPERATURE,
        system=system, messages=[{"role": "user", "content": user}],
    )
    text = "".join(b.text for b in resp.content if hasattr(b, "text"))
    if text.strip().startswith("```"):
        text = text.strip().strip("`")
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip()), {
        "input_tokens": resp.usage.input_tokens,
        "output_tokens": resp.usage.output_tokens,
    }


def main() -> None:
    if not os.getenv("ANTHROPIC_API_KEY"):
        print("❌ ANTHROPIC_API_KEY 없음", file=sys.stderr)
        sys.exit(1)

    targets = load_targets(limit=50)
    print(f"📊 대상 {len(targets)}건 (clean_cases.csv success_story)")

    system_prompt, user_template = load_prompt()
    client = Anthropic()

    results: list[dict] = []
    total_in = total_out = issues_count = 0
    t_start = time.time()

    for i, row in enumerate(targets, 1):
        cid = row["case_id"]
        body = (row.get("full_text") or "")[:4000]
        print(f"[{i}/{len(targets)}] {cid}...", end=" ", flush=True)
        try:
            t0 = time.time()
            user = user_template.format(
                case_id=cid,
                title=row.get("title", ""),
                full_text=body,
                category_slug_raw=row.get("category_slug", "etc"),
            )
            draft, usage = call_claude(client, system_prompt, user)
            elapsed = time.time() - t0
            total_in += usage["input_tokens"]
            total_out += usage["output_tokens"]
            issues = validate(draft, row.get("full_text", ""))
            issues_count += len(issues)
            draft["_meta"] = {
                "case_id": cid,
                "model": MODEL,
                "prompt_version": "AI-14-v1",
                "elapsed_sec": round(elapsed, 2),
                "input_tokens": usage["input_tokens"],
                "output_tokens": usage["output_tokens"],
                "validation_issues": issues,
            }
            draft["_source"] = {
                "title": row.get("title", ""),
                "link": row.get("link", ""),
                "category_slug_clean": row.get("category_slug", "etc"),
                "source": row.get("source", ""),
            }
            results.append(draft)
            print(f"✅ {elapsed:.1f}s issues={len(issues)}")
        except Exception as e:
            print(f"❌ {type(e).__name__}: {e}")
            results.append({"_meta": {"case_id": cid, "error": str(e)}})

    cost = total_in * 3 / 1_000_000 + total_out * 15 / 1_000_000
    elapsed_total = time.time() - t_start

    output = {
        "version": "AI-18-v1",
        "generated_at": datetime.now(KST).isoformat(timespec="seconds"),
        "model": MODEL,
        "prompt_version": "AI-14-v1",
        "summary": {
            "total_cases": len(targets),
            "successful_drafts": sum(1 for r in results if "error" not in r.get("_meta", {})),
            "errors": sum(1 for r in results if "error" in r.get("_meta", {})),
            "total_input_tokens": total_in,
            "total_output_tokens": total_out,
            "estimated_cost_usd": round(cost, 4),
            "elapsed_sec": round(elapsed_total, 1),
            "total_validation_issues": issues_count,
        },
        "drafts": results,
    }
    OUTPUT_PATH.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n✅ {OUTPUT_PATH}")
    print(f"💰 비용: ${cost:.4f} (in={total_in}, out={total_out})")
    print(f"⏱️ 소요: {elapsed_total:.1f}초")
    print(f"⚠️ 검증 이슈: {issues_count}건")


if __name__ == "__main__":
    main()
