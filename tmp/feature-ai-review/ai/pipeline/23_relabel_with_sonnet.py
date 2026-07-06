"""
23_relabel_with_sonnet.py — 네이버 크롤링 데이터 Sonnet 재라벨링

배경: AI-10 휴리스틱 라벨링이 fail=광고/메타정보 다수, ambiguous=빈 글 다수.
Sonnet으로 정밀 재라벨링 + 광고/메타정보 식별 + 카테고리 재추론.

기본 대상: fail + ambiguous 168건 (success는 보존 권장)
옵션: --full로 success까지 351건 전체 재라벨링

사용:
- dry-run 10건:  ai/venv/bin/python ai/pipeline/23_relabel_with_sonnet.py --dryrun
- 168건 전체:    ai/venv/bin/python ai/pipeline/23_relabel_with_sonnet.py --target fail_ambiguous
- 351건 전체:    ai/venv/bin/python ai/pipeline/23_relabel_with_sonnet.py --target all

작성: 팀장(오혜림) — 2026-06-02
의존: ai/prompts/AI-19-relabel_v1.md
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import time
from collections import Counter
from datetime import datetime, timezone, timedelta
from pathlib import Path

from anthropic import Anthropic
from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parents[2]
ENV_PATH = REPO_ROOT / "ai" / ".env"
INPUT_PATH = REPO_ROOT / "ai" / "data" / "labeled_success_sample.csv"
PROMPT_PATH = REPO_ROOT / "ai" / "prompts" / "AI-19-relabel_v1.md"

load_dotenv(ENV_PATH)

MODEL = "claude-sonnet-4-5-20250929"
MAX_TOKENS = 800
TEMPERATURE = 0.2
KST = timezone(timedelta(hours=9))

ALLOWED_CASE_TYPES = {
    "success_story", "failure_story", "advertisement", "meta_only", "neutral",
}
ALLOWED_SLUGS = {
    "online-commerce", "content-sns", "digital-products", "platform-labor",
    "talent-freelance", "investment", "offline-sidejob", "etc",
}


def load_rows(target: str) -> list[dict]:
    with INPUT_PATH.open(encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    if target == "all":
        return rows
    if target == "fail_ambiguous":
        return [r for r in rows if r.get("true_label") in ("fail", "ambiguous")]
    raise ValueError(f"unknown target: {target}")


def pick_dryrun_sample(rows: list[dict], n: int = 10) -> list[dict]:
    """라벨 균형 샘플 — fail 4 / ambiguous 4 / success 2"""
    import random
    rng = random.Random(42)
    by_label = {"fail": [], "ambiguous": [], "success": []}
    for r in rows:
        lbl = r.get("true_label")
        if lbl in by_label:
            by_label[lbl].append(r)
    picked: list[dict] = []
    picked.extend(rng.sample(by_label["fail"], min(4, len(by_label["fail"]))))
    picked.extend(rng.sample(by_label["ambiguous"], min(4, len(by_label["ambiguous"]))))
    picked.extend(rng.sample(by_label["success"], min(2, len(by_label["success"]))))
    return picked[:n]


def load_prompt() -> tuple[str, str]:
    text = PROMPT_PATH.read_text(encoding="utf-8")
    sys_start = text.find("## System Prompt")
    user_start = text.find("## User Prompt")
    out_start = text.find("## 출력 JSON")
    if min(sys_start, user_start, out_start) < 0:
        raise ValueError("프롬프트 섹션 못 찾음")

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

    return _extract(sys_start, user_start), _extract(user_start, out_start)


def validate(draft: dict) -> list[str]:
    issues: list[str] = []
    ct = draft.get("case_type")
    if ct not in ALLOWED_CASE_TYPES:
        issues.append(f"invalid case_type: {ct}")
    cat = draft.get("category_inferred", {})
    if cat.get("slug") not in ALLOWED_SLUGS:
        issues.append(f"invalid slug: {cat.get('slug')}")
    is_real = draft.get("is_real_user_case")
    if is_real is False and ct in ("success_story", "failure_story"):
        issues.append(f"contradiction: is_real_user_case=false but case_type={ct}")
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
    if text.strip().startswith("```"):
        text = text.strip().strip("`")
        if text.startswith("json"):
            text = text[4:]
    draft = json.loads(text.strip())
    return draft, {
        "input_tokens": resp.usage.input_tokens,
        "output_tokens": resp.usage.output_tokens,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dryrun", action="store_true", help="10건만 호출 (균형 샘플)")
    parser.add_argument(
        "--target", choices=["fail_ambiguous", "all"], default="fail_ambiguous",
        help="재라벨링 대상 (기본: fail+ambiguous 168건)",
    )
    args = parser.parse_args()

    if not os.getenv("ANTHROPIC_API_KEY"):
        print("❌ ANTHROPIC_API_KEY 없음", file=sys.stderr)
        sys.exit(1)

    rows = load_rows(args.target)
    if args.dryrun:
        rows = pick_dryrun_sample(rows, n=10)
        out_path = REPO_ROOT / "ai" / "data" / "relabel_dryrun_results.json"
    else:
        out_path = REPO_ROOT / "ai" / "data" / f"relabel_{args.target}_results.json"

    print(f"📊 대상 {len(rows)}건 (mode={'dryrun' if args.dryrun else args.target})")
    for r in rows[:5]:
        print(f"   - {r['case_id']} [{r['true_label']}] {r['title'][:40]}")
    if len(rows) > 5:
        print(f"   ... 외 {len(rows) - 5}건")

    system_prompt, user_template = load_prompt()
    client = Anthropic()

    results = []
    label_change: Counter = Counter()  # (original, new) 분포
    total_in = total_out = 0
    issues_count = 0
    t_start = time.time()

    for i, row in enumerate(rows, 1):
        cid = row["case_id"]
        body = (row.get("full_text") or "")[:4000]
        if len(body) < 30:
            # 본문 너무 짧으면 자동 meta_only/neutral 처리
            results.append({
                "case_id": cid,
                "original_label": row.get("true_label"),
                "skipped": True,
                "reason": "body < 30자 (호출 생략)",
            })
            continue

        user = user_template.format(
            case_id=cid,
            original_label=row.get("true_label", ""),
            title=row.get("title", ""),
            full_text=body,
        )
        print(f"[{i}/{len(rows)}] {cid}...", end=" ", flush=True)
        try:
            t0 = time.time()
            draft, usage = call_claude(client, system_prompt, user)
            elapsed = time.time() - t0
            total_in += usage["input_tokens"]
            total_out += usage["output_tokens"]
            issues = validate(draft)
            issues_count += len(issues)
            draft["_meta"] = {
                "case_id": cid,
                "original_label": row.get("true_label"),
                "original_category_slug": row.get("category_slug"),
                "source": row.get("source"),
                "title": row.get("title", ""),
                "elapsed_sec": round(elapsed, 2),
                "input_tokens": usage["input_tokens"],
                "output_tokens": usage["output_tokens"],
                "validation_issues": issues,
            }
            results.append(draft)
            label_change[(row.get("true_label"), draft.get("case_type"))] += 1
            print(
                f"✅ {row.get('true_label')} → {draft.get('case_type')} "
                f"({usage['input_tokens']}in/{usage['output_tokens']}out, {elapsed:.1f}s)"
                + (f" ⚠️{len(issues)}" if issues else "")
            )
        except Exception as e:
            print(f"❌ {type(e).__name__}: {e}")
            results.append({
                "case_id": cid,
                "original_label": row.get("true_label"),
                "error": str(e),
            })

    elapsed_total = time.time() - t_start
    cost = total_in * 3 / 1_000_000 + total_out * 15 / 1_000_000

    output = {
        "version": "AI-19-v1",
        "generated_at": datetime.now(KST).isoformat(timespec="seconds"),
        "model": MODEL,
        "prompt_version": "AI-19-v1",
        "summary": {
            "total_cases": len(rows),
            "successful_relabels": sum(
                1 for r in results if "error" not in r and not r.get("skipped")
            ),
            "skipped": sum(1 for r in results if r.get("skipped")),
            "errors": sum(1 for r in results if "error" in r),
            "total_input_tokens": total_in,
            "total_output_tokens": total_out,
            "estimated_cost_usd": round(cost, 4),
            "elapsed_sec": round(elapsed_total, 1),
            "total_validation_issues": issues_count,
            "label_change_distribution": {
                f"{k[0]} → {k[1]}": v for k, v in label_change.most_common()
            },
        },
        "drafts": results,
    }
    out_path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\n✅ 저장: {out_path}")
    print(f"💰 비용: ${cost:.4f} (in={total_in}, out={total_out})")
    print(f"⏱️ 소요: {elapsed_total:.1f}초")
    print(f"⚠️ 검증 이슈: {issues_count}건")
    print(f"\n📊 라벨 변화 (original → new):")
    for k, v in label_change.most_common():
        print(f"  {k[0]:10} → {k[1]:18} : {v}건")


if __name__ == "__main__":
    main()
