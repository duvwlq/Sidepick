from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from fastapi import FastAPI
from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    experienceId: int
    categoryId: int
    categoryName: str
    title: Optional[str] = None
    content: str
    businessType: Optional[str] = None
    investmentAmount: Optional[int] = None
    durationMonths: Optional[int] = None
    averageDailyHours: Optional[str] = None
    isConcurrentWithMainJob: Optional[bool] = None
    monthlyRevenue: Optional[int] = None
    failureReason: Optional[str] = None
    failureReasons: List[str] = Field(default_factory=list)
    difficulties: List[str] = Field(default_factory=list)
    targetMarket: Optional[str] = None
    marketingChannels: List[str] = Field(default_factory=list)
    lessonsLearned: Optional[str] = None
    wouldRetry: Optional[bool] = None


class AnalyzeResponse(BaseModel):
    id: int
    experienceId: int
    extractedPatterns: List[str]
    riskFactors: List[str]
    successFactors: List[str]
    structuredSummary: str
    confidenceScore: Decimal
    processedAt: str


app = FastAPI(title="Sidepick AI Server", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(payload: AnalyzeRequest) -> AnalyzeResponse:
    extracted_patterns = build_patterns(payload)
    risk_factors = build_risks(payload)
    success_factors = build_success_factors(payload)
    summary = build_summary(payload, extracted_patterns, risk_factors)

    return AnalyzeResponse(
        id=payload.experienceId,
        experienceId=payload.experienceId,
        extractedPatterns=extracted_patterns,
        riskFactors=risk_factors,
        successFactors=success_factors,
        structuredSummary=summary,
        confidenceScore=Decimal("0.78"),
        processedAt=datetime.utcnow().replace(microsecond=0).isoformat(),
    )


def build_patterns(payload: AnalyzeRequest) -> List[str]:
    patterns: List[str] = []
    if payload.failureReasons:
        patterns.extend(payload.failureReasons[:2])
    if payload.difficulties:
        patterns.extend(payload.difficulties[:2])
    if payload.categoryName:
        patterns.append(f"{payload.categoryName} category context")
    if not patterns:
        patterns.append("early-stage failure pattern")
    return dedupe(patterns)[:3]


def build_risks(payload: AnalyzeRequest) -> List[str]:
    risks: List[str] = []
    if payload.failureReason:
        risks.append(payload.failureReason)
    if payload.investmentAmount and payload.investmentAmount > 0:
        risks.append("budget exposure before validation")
    if payload.durationMonths and payload.durationMonths <= 3:
        risks.append("short validation window")
    if not risks:
        risks.append("insufficient structured failure data")
    return dedupe(risks)[:3]


def build_success_factors(payload: AnalyzeRequest) -> List[str]:
    factors = [
        "validate demand with a smaller launch first",
        "collect user feedback before scaling cost",
        "convert the experience into a repeatable checklist",
    ]
    if payload.lessonsLearned:
        factors[0] = payload.lessonsLearned
    return dedupe(factors)[:3]


def build_summary(
    payload: AnalyzeRequest,
    extracted_patterns: List[str],
    risk_factors: List[str],
) -> str:
    business_type = payload.businessType or payload.categoryName
    lead_pattern = extracted_patterns[0]
    lead_risk = risk_factors[0]
    return (
        f"This {business_type} experience shows {lead_pattern}. "
        f"The main risk is {lead_risk}. "
        "Start with narrower validation and a simpler execution plan."
    )


def dedupe(values: List[str]) -> List[str]:
    seen: set[str] = set()
    result: List[str] = []
    for value in values:
        normalized = value.strip()
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        result.append(normalized)
    return result
