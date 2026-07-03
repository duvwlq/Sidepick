"""
langsmith_monitor.py — LangSmith 모니터링 + 비용/지연 알림 (AI-24)

LangSmith APAC region 트레이스 활용:
- 일일 토큰/비용 추적
- 응답 지연 모니터링 (> 30초 알림)
- Plan B 트리거 빈도 추적
- 환경 변수: LANGSMITH_API_KEY / LANGSMITH_ENDPOINT / LANGSMITH_PROJECT

PM-21 / BE-39 안전장치 토큰 대시보드와 연계.

작성: 팀장(오혜림) — 2026-06-10
의존: LangSmith APAC + PM-07 환경 변수 설정
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from pathlib import Path

from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(REPO_ROOT / "ai" / ".env")

KST = timezone(timedelta(hours=9))

# 비용 임계치 (USD, BE-39 토큰 대시보드 80%/100% 룰)
DAILY_BUDGET_USD = float(os.getenv("DAILY_LLM_BUDGET_USD", "10.0"))
ALERT_THRESHOLD_80 = 0.8
ALERT_THRESHOLD_100 = 1.0

# 응답 지연 알림 (초)
LATENCY_ALERT_SEC = 30.0

# Sonnet 가격 (per 1M tokens)
PRICING = {
    "claude-sonnet-4-5": {"in": 3.0, "out": 15.0},
    "claude-sonnet-4-6": {"in": 3.0, "out": 15.0},
    "claude-haiku-4-5": {"in": 1.0, "out": 5.0},
}


@dataclass
class UsageRecord:
    """단일 호출 사용량."""
    timestamp: datetime
    model: str
    input_tokens: int
    output_tokens: int
    latency_sec: float
    plan_b_triggered: bool = False
    plan_b_reason: str | None = None

    def cost_usd(self) -> float:
        p = PRICING.get(self.model, PRICING["claude-sonnet-4-5"])
        return self.input_tokens * p["in"] / 1_000_000 + self.output_tokens * p["out"] / 1_000_000


@dataclass
class DailyAggregator:
    """일일 집계 + 알림 트리거."""
    date: str
    records: list[UsageRecord] = field(default_factory=list)
    alerts_sent: set[str] = field(default_factory=set)

    @property
    def total_cost(self) -> float:
        return sum(r.cost_usd() for r in self.records)

    @property
    def total_input_tokens(self) -> int:
        return sum(r.input_tokens for r in self.records)

    @property
    def total_output_tokens(self) -> int:
        return sum(r.output_tokens for r in self.records)

    @property
    def plan_b_count(self) -> int:
        return sum(1 for r in self.records if r.plan_b_triggered)

    @property
    def slow_count(self) -> int:
        return sum(1 for r in self.records if r.latency_sec > LATENCY_ALERT_SEC)

    def add(self, rec: UsageRecord) -> list[str]:
        """기록 추가 + 임계 도달 시 알림 reason 반환."""
        self.records.append(rec)
        new_alerts: list[str] = []

        ratio = self.total_cost / DAILY_BUDGET_USD if DAILY_BUDGET_USD > 0 else 0
        if ratio >= ALERT_THRESHOLD_100 and "budget_100" not in self.alerts_sent:
            self.alerts_sent.add("budget_100")
            new_alerts.append(f"💰 일일 한도 100% 도달 ({self.total_cost:.2f}/${DAILY_BUDGET_USD}) — Plan B 전환 권장")
        elif ratio >= ALERT_THRESHOLD_80 and "budget_80" not in self.alerts_sent:
            self.alerts_sent.add("budget_80")
            new_alerts.append(f"⚠️ 일일 한도 80% 도달 ({self.total_cost:.2f}/${DAILY_BUDGET_USD}) — 사용량 점검")

        if rec.latency_sec > LATENCY_ALERT_SEC:
            new_alerts.append(f"⏱️ 지연 {rec.latency_sec:.1f}초 ({rec.model})")

        return new_alerts


def make_report(agg: DailyAggregator) -> dict:
    """일일 리포트."""
    return {
        "date": agg.date,
        "total_calls": len(agg.records),
        "total_input_tokens": agg.total_input_tokens,
        "total_output_tokens": agg.total_output_tokens,
        "total_cost_usd": round(agg.total_cost, 4),
        "daily_budget_usd": DAILY_BUDGET_USD,
        "budget_usage_ratio": round(agg.total_cost / DAILY_BUDGET_USD, 3) if DAILY_BUDGET_USD else 0,
        "plan_b_count": agg.plan_b_count,
        "plan_b_ratio": round(agg.plan_b_count / max(1, len(agg.records)), 3),
        "slow_calls_over_30s": agg.slow_count,
        "alerts_sent": sorted(agg.alerts_sent),
    }


def check_env() -> dict:
    """LangSmith 환경 변수 점검."""
    keys = ["LANGSMITH_API_KEY", "LANGSMITH_ENDPOINT", "LANGSMITH_PROJECT", "LANGSMITH_TRACING"]
    return {k: ("✅" if os.getenv(k) else "❌") for k in keys}


if __name__ == "__main__":
    import json

    print("=== LangSmith 환경 변수 점검 ===")
    print(json.dumps(check_env(), ensure_ascii=False, indent=2))

    print("\n=== 일일 집계 self-test ===")
    today = datetime.now(KST).strftime("%Y-%m-%d")
    agg = DailyAggregator(date=today)

    # 정상 호출 5건
    for i in range(5):
        rec = UsageRecord(
            timestamp=datetime.now(KST), model="claude-sonnet-4-5",
            input_tokens=2000, output_tokens=800, latency_sec=2.5,
        )
        agg.add(rec)

    # 지연 호출 1건
    alerts = agg.add(UsageRecord(
        timestamp=datetime.now(KST), model="claude-sonnet-4-5",
        input_tokens=3000, output_tokens=1000, latency_sec=45.0,
        plan_b_triggered=True, plan_b_reason="timeout",
    ))
    print("Alerts on slow call:", alerts)

    print("\n📊 일일 리포트:")
    print(json.dumps(make_report(agg), ensure_ascii=False, indent=2))
