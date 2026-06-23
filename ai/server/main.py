from typing import Any, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from server.chatbot_api import chatbot_process
from server.chatbot_llm import known_case_ids, llm_call as chatbot_llm_call
from server.llm_analyzer import analyze_experience

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


class ChatbotRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=600, description="Chatbot user message")
    category_slug: Optional[str] = Field(default=None, description="Side business category slug")


class ChatbotResponseModel(BaseModel):
    status: str = Field(..., description="ok | fallback | blocked | guide_redirect")
    reply: str
    route: Optional[str] = None
    cited_case_ids: List[str] = Field(default_factory=list)
    plan_b_reason: Optional[str] = None
    confidence: Optional[float] = None
    tool_calls: List[dict[str, Any]] = Field(default_factory=list)
    metadata: Optional[dict[str, Any]] = None


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
            route=result.route,
            cited_case_ids=result.cited_case_ids or [],
            plan_b_reason=result.plan_b_reason,
            confidence=captured.get("confidence"),
            tool_calls=captured.get("tool_calls", []),
            metadata=metadata,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Chatbot processing failed: {type(exc).__name__}: {exc}",
        ) from exc
