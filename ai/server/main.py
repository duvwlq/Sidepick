import time
from typing import Any, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .agent_pipeline import DraftMeta, detect_missing_slots, make_analysis_id, needs_questions
from .chatbot_api import chatbot_process
from .chatbot_llm import known_case_ids, llm_call as chatbot_llm_call
from .llm_analyzer import analyze_experience

app = FastAPI(
    title="Sidepick AI Server",
    description="Sidepick AI server",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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


class ChatbotRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=600, description="Chatbot user message")
    category_slug: Optional[str] = Field(default=None, description="Side business category slug")
    route_hint: Optional[str] = Field(default=None, description="Preferred route from backend")


class ChatbotResponseModel(BaseModel):
    status: str = Field(..., description="ok | fallback | blocked | guide_redirect")
    reply: str
    type: Optional[str] = None
    sources: List[str] = Field(default_factory=list)
    reason: Optional[str] = None
    confidence: Optional[float] = None
    tool_calls: List[dict[str, Any]] = Field(default_factory=list)
    metadata: Optional[dict[str, Any]] = None


QUESTION_CARD_BY_SLOT = {
    "duration": AgentAQuestionCard(
        slot="duration",
        question="이 경험을 얼마나 오래 시도했나요?",
        input_type="select",
        options=["1개월 이내", "1~3개월", "3~6개월", "6개월 이상"],
        required=True,
        hint="대략적인 기간만 있어도 충분합니다.",
    ),
    "daily_hours": AgentAQuestionCard(
        slot="daily_hours",
        question="하루 평균 어느 정도 시간을 썼나요?",
        input_type="select",
        options=["1시간 이내", "1~3시간", "3~5시간", "5시간 이상"],
        required=True,
        hint="본업과 병행했다면 체감 시간을 적어주세요.",
    ),
    "invest_amount": AgentAQuestionCard(
        slot="invest_amount",
        question="지금까지 총 들어간 비용은 어느 정도였나요?",
        input_type="number",
        options=None,
        required=False,
        hint="대략적인 총액이면 충분합니다.",
    ),
    "revenue_amount": AgentAQuestionCard(
        slot="revenue_amount",
        question="매출이나 수익으로 확인된 금액이 있었나요?",
        input_type="number",
        options=None,
        required=False,
        hint="없었다면 0으로 적어도 됩니다.",
    ),
    "failure_reasons": AgentAQuestionCard(
        slot="failure_reasons",
        question="결국 실패의 가장 큰 이유는 무엇이었다고 보나요?",
        input_type="tag",
        options=None,
        required=True,
        hint="정보 부족, 자금, 경쟁, 시간 같은 단어로 적어도 됩니다.",
    ),
    "difficulties": AgentAQuestionCard(
        slot="difficulties",
        question="진행 중 특히 어려웠던 점을 2~3가지 적어주세요.",
        input_type="tag",
        options=None,
        required=True,
        hint="고객 확보, 수익화, 운영 부담, 시간 관리 같은 표현이면 충분합니다.",
    ),
    "body_richness": AgentAQuestionCard(
        slot="body_richness",
        question="시도 과정, 실제 행동, 결과 흐름을 한두 문단 더 자세히 적어줄 수 있나요?",
        input_type="text",
        options=None,
        required=True,
        hint="구체적인 상황이 들어가면 분석 품질이 높아집니다.",
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
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"AI analysis failed: {type(exc).__name__}: {exc}",
        ) from exc


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
            message=None if should_ask else "초안 정보가 충분해서 추가 질문 없이 바로 분석할 수 있습니다.",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Agent A draft analysis failed: {type(exc).__name__}: {exc}",
        ) from exc


@app.post(
    "/api/chatbot/message",
    response_model=ChatbotResponseModel,
    summary="Process chatbot message",
)
async def chatbot_message(req: ChatbotRequest):
    try:
        captured: dict[str, Any] = {}

        def wrapped_llm_call(**kwargs):
            result = chatbot_llm_call(
                message=kwargs["message"],
                route=kwargs["route"],
                category_slug=req.category_slug,
            )
            captured.update(result)
            return result

        result = chatbot_process(
            message=req.message,
            category_slug=req.category_slug,
            preferred_route=req.route_hint,
            known_case_ids=known_case_ids(),
            llm_call=wrapped_llm_call,
        )

        metadata: dict[str, Any] = dict(result.metadata or {})
        metadata.update(
            {
                "model": captured.get("model"),
                "tokens_in": captured.get("tokens_in"),
                "tokens_out": captured.get("tokens_out"),
            }
        )

        return ChatbotResponseModel(
            status=result.status,
            reply=result.reply,
            type=result.route,
            sources=result.cited_case_ids or [],
            reason=result.plan_b_reason,
            confidence=captured.get("confidence"),
            tool_calls=captured.get("tool_calls", []),
            metadata=metadata,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Chatbot processing failed: {type(exc).__name__}: {exc}",
        ) from exc
