from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import time

from server.agent_pipeline import DraftMeta, detect_missing_slots, make_analysis_id, needs_questions
from server.llm_analyzer import analyze_experience

app = FastAPI(
    title="Sidepick AI Server",
    description="Sidepick AI server",
    version="0.1.0",
)


class AnalyzeRequest(BaseModel):
    category: str = Field(..., description="Side business category")
    difficulties: List[str] = Field(default_factory=list, description="Selected difficulties")
    difficulty_etc: Optional[str] = Field(default="", description="Difficulty etc field")
    difficulty_extra: Optional[str] = Field(default="", description="Extra difficulty detail")
    duration_months: int = Field(..., ge=1, description="Duration in months")
    weekly_hours: int = Field(..., ge=1, description="Weekly hours")
    free_text: str = Field(..., min_length=10, description="Free text body")


class AnalyzeResponse(BaseModel):
    keywords: List[str] = Field(..., description="Extracted keywords")
    failure_category: str = Field(..., description="Failure category")
    summary: str = Field(..., description="One-line summary")
    risk_level: str = Field(..., description="Risk level")


class AgentADraftRequest(BaseModel):
    category_slug: str = Field(..., description="Category slug")
    body: str = Field(..., min_length=1, description="Draft body")
    title: Optional[str] = None
    tone: Optional[str] = None
    audience: Optional[str] = None
    duration_months: Optional[int] = Field(default=None, ge=1)
    weekly_hours: Optional[int] = Field(default=None, ge=1)
    invest_amount: Optional[int] = Field(default=None, ge=0)
    revenue_amount: Optional[int] = Field(default=None, ge=0)
    has_main_job: Optional[bool] = None
    difficulties: List[str] = Field(default_factory=list)
    failure_reasons: List[str] = Field(default_factory=list)


class AgentAAnalyzeDraftRequest(BaseModel):
    draft: AgentADraftRequest


class AgentAQuestionCard(BaseModel):
    slot: str
    question: str
    input_type: str
    options: Optional[List[str]] = None
    required: bool
    hint: Optional[str] = None


class AgentAMeta(BaseModel):
    input_tokens: int
    output_tokens: int
    elapsed_ms: int
    used_template: bool
    analysis_id: Optional[str] = None
    cache_hit: Optional[bool] = None
    confidence: Optional[float] = None
    plan_b_triggered: Optional[bool] = None


class AgentAAnalyzeDraftResponse(BaseModel):
    status: str
    needs_questions: bool
    questions: List[AgentAQuestionCard]
    meta: AgentAMeta
    message: Optional[str] = None


QUESTION_CARD_BY_SLOT = {
    "duration": AgentAQuestionCard(
        slot="duration",
        question="이 부업을 얼마나 오래 시도했나요?",
        input_type="select",
        options=["1개월 미만", "1~3개월", "3~6개월", "6개월 이상"],
        required=True,
        hint="대략적인 기간만 있어도 괜찮습니다.",
    ),
    "daily_hours": AgentAQuestionCard(
        slot="daily_hours",
        question="하루 평균 어느 정도 시간을 썼나요?",
        input_type="select",
        options=["1시간 미만", "1~3시간", "3~5시간", "5시간 이상"],
        required=True,
        hint="본업과 병행했다면 체감 기준으로 적어주세요.",
    ),
    "invest_amount": AgentAQuestionCard(
        slot="invest_amount",
        question="시작할 때 들어간 비용은 어느 정도였나요?",
        input_type="number",
        options=None,
        required=False,
        hint="대략적인 총액이면 충분합니다.",
    ),
    "revenue_amount": AgentAQuestionCard(
        slot="revenue_amount",
        question="월 수익이나 실제로 벌어들인 금액이 있었나요?",
        input_type="number",
        options=None,
        required=False,
        hint="없었다면 0으로 생각해도 됩니다.",
    ),
    "failure_reasons": AgentAQuestionCard(
        slot="failure_reasons",
        question="결국 가장 크게 실패했다고 느낀 이유는 무엇이었나요?",
        input_type="tag",
        options=None,
        required=True,
        hint="마케팅, 자금, 실행력, 경쟁, 시간 같은 단어로 적어도 됩니다.",
    ),
    "difficulties": AgentAQuestionCard(
        slot="difficulties",
        question="진행 중 특히 어려웠던 점을 2~3개만 더 적어주세요.",
        input_type="tag",
        options=None,
        required=True,
        hint="고객 확보, 수익화, 정보 부족, 운영 지속성 같은 표현이면 충분합니다.",
    ),
    "body_richness": AgentAQuestionCard(
        slot="body_richness",
        question="시작 계기, 진행 방식, 막힌 지점을 한두 문장만 더 자세히 적어줄 수 있나요?",
        input_type="text",
        options=None,
        required=True,
        hint="구체적인 상황이 들어가면 분석 품질이 좋아집니다.",
    ),
}


def _estimate_tokens(text_length: int) -> int:
    return max(1, (text_length + 3) // 4)


def _estimate_output_tokens(questions: List[AgentAQuestionCard]) -> int:
    total_characters = sum(
        len(question.question) + (len(question.hint) if question.hint else 0)
        for question in questions
    )
    return 0 if not questions else max(1, (total_characters + 3) // 4)


def _build_agent_a_questions(missing_slots: List[str]) -> List[AgentAQuestionCard]:
    prioritized = [
        "failure_reasons",
        "difficulties",
        "body_richness",
        "duration",
        "daily_hours",
        "invest_amount",
        "revenue_amount",
    ]
    ordered_slots = [slot for slot in prioritized if slot in missing_slots]
    return [QUESTION_CARD_BY_SLOT[slot] for slot in ordered_slots[:5] if slot in QUESTION_CARD_BY_SLOT]


@app.get("/health", summary="Health check")
async def health_check():
    return {"status": "ok", "service": "sidepick-ai"}


@app.post("/analyze", response_model=AnalyzeResponse, summary="Analyze experience")
async def analyze(req: AnalyzeRequest):
    try:
        result = analyze_experience(
            category=req.category,
            difficulties=req.difficulties,
            difficulty_etc=req.difficulty_etc or "",
            difficulty_extra=req.difficulty_extra or "",
            duration_months=req.duration_months,
            weekly_hours=req.weekly_hours,
            free_text=req.free_text,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {type(e).__name__}: {str(e)}")


@app.post(
    "/agent-a/analyze-draft",
    response_model=AgentAAnalyzeDraftResponse,
    summary="Generate Agent A follow-up questions",
)
async def analyze_draft_with_agent_a(req: AgentAAnalyzeDraftRequest):
    started_at = time.time()
    try:
        draft = req.draft
        analysis_id = make_analysis_id(draft.category_slug, draft.body)
        draft_meta = DraftMeta(
            category=draft.category_slug,
            duration=str(draft.duration_months) if draft.duration_months is not None else None,
            daily_hours=str(draft.weekly_hours) if draft.weekly_hours is not None else None,
            invest_amount=draft.invest_amount,
            revenue_amount=draft.revenue_amount,
            has_main_job=draft.has_main_job,
            body=draft.body,
        )
        missing_slots = detect_missing_slots(draft_meta)
        should_ask = needs_questions(draft_meta)
        questions = _build_agent_a_questions(missing_slots) if should_ask else []
        elapsed_ms = int((time.time() - started_at) * 1000)
        return AgentAAnalyzeDraftResponse(
            status="ok",
            needs_questions=should_ask,
            questions=questions,
            meta=AgentAMeta(
                input_tokens=_estimate_tokens(len(draft.body)),
                output_tokens=_estimate_output_tokens(questions),
                elapsed_ms=elapsed_ms,
                used_template=False,
                analysis_id=analysis_id,
                cache_hit=False,
                confidence=None,
                plan_b_triggered=False,
            ),
            message=None if should_ask else "초안 정보가 충분해서 추가 질문 없이 진행할 수 있습니다.",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent A draft analysis failed: {type(e).__name__}: {str(e)}")
