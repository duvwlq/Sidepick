from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Any, List, Optional
from server.llm_analyzer import analyze_experience
from server.chatbot_api import chatbot_process
from server.chatbot_llm import llm_call as chatbot_llm_call, known_case_ids

app = FastAPI(
    title="Sidepick AI Server",
    description="부업 실패 경험 분석 AI 서버",
    version="0.1.0"
)

# CORS — 로컬 FE 개발용 (localhost:5173 Vite default)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:3000", "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===== 요청 데이터 모델 =====
class AnalyzeRequest(BaseModel):
    """분석 요청 데이터"""
    category: str = Field(..., description="부업 카테고리 (예: 유튜브, 온라인 쇼핑몰)")
    difficulties: List[str] = Field(default=[], description="어려웠던 점 체크 항목")
    difficulty_etc: Optional[str] = Field(default="", description="어려웠던 점 - 기타 서술")
    difficulty_extra: Optional[str] = Field(default="", description="보조 서술")
    duration_months: int = Field(..., ge=1, description="부업 기간 (개월)")
    weekly_hours: int = Field(..., ge=1, description="주당 할애 시간")
    free_text: str = Field(..., min_length=10, description="자유서술 (최소 10자)")

    class Config:
        json_schema_extra = {
            "example": {
                "category": "유튜브",
                "difficulties": ["마케팅/홍보", "타겟 분석"],
                "difficulty_etc": "",
                "difficulty_extra": "구독자가 100명에서 안 늘어남",
                "duration_months": 6,
                "weekly_hours": 10,
                "free_text": "유튜브 채널을 시작했는데 영상은 가끔 올리고 구독자도 잘 안 늘었어요."
            }
        }


# ===== 응답 데이터 모델 =====
class AnalyzeResponse(BaseModel):
    """분석 결과 응답"""
    keywords: List[str] = Field(..., description="추출된 키워드 3개")
    failure_category: str = Field(..., description="실패 카테고리")
    summary: str = Field(..., description="1줄 요약")
    risk_level: str = Field(..., description="위험도 (high/medium/low)")

    class Config:
        json_schema_extra = {
            "example": {
                "keywords": ["비정기적 업로드", "구독자 정체", "지속성 부족"],
                "failure_category": "시간관리",
                "summary": "비정기적 업로드로 인한 채널 성장 정체",
                "risk_level": "medium"
            }
        }


# ===== API 엔드포인트 =====

@app.get("/health", summary="서버 상태 확인")
async def health_check():
    """서버가 살아있는지 확인하는 헬스체크"""
    return {"status": "ok", "service": "sidepick-ai"}


@app.post(
    "/analyze",
    response_model=AnalyzeResponse,
    summary="부업 실패 경험 분석",
    description="사용자의 부업 실패 경험을 LLM으로 분석하여 키워드, 실패 카테고리, 요약, 위험도를 반환합니다."
)
async def analyze(req: AnalyzeRequest):
    try:
        result = analyze_experience(
            category=req.category,
            difficulties=req.difficulties,
            difficulty_etc=req.difficulty_etc or "",
            difficulty_extra=req.difficulty_extra or "",
            duration_months=req.duration_months,
            weekly_hours=req.weekly_hours,
            free_text=req.free_text
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI 분석 실패: {type(e).__name__}: {str(e)}"
        )


# ===== 챗봇 엔드포인트 (Pivot Day 데모용) =====

class ChatbotRequest(BaseModel):
    """챗봇 메시지 요청."""
    message: str = Field(..., min_length=1, max_length=600, description="사용자 질문 (1~600자)")
    category_slug: Optional[str] = Field(default=None, description="부업 카테고리 슬러그 (예: online-commerce)")

    class Config:
        json_schema_extra = {
            "example": {
                "message": "스마트스토어 시작 어떻게 해야 하나요?",
                "category_slug": "online-commerce",
            }
        }


class ChatbotResponseModel(BaseModel):
    """챗봇 응답."""
    status: str = Field(..., description="ok | fallback | blocked | guide_redirect")
    reply: str
    route: Optional[str] = None
    cited_case_ids: List[str] = []
    plan_b_reason: Optional[str] = None
    confidence: Optional[float] = None
    tool_calls: List[dict] = []
    metadata: Optional[dict] = None


@app.post(
    "/api/chatbot/message",
    response_model=ChatbotResponseModel,
    summary="챗봇 메시지 처리",
    description="입력 가드레일 → 라우팅 → Claude Sonnet 호출 → 출력 가드레일.",
)
async def chatbot_message(req: ChatbotRequest):
    try:
        # chatbot_process는 reply/cited만 보관하므로 llm 응답을 별도 보관
        captured: dict[str, Any] = {}

        def _llm_wrapper(**kw):
            r = chatbot_llm_call(
                message=kw["message"], route=kw["route"],
                category_slug=req.category_slug,
            )
            captured.update(r)
            return r

        result = chatbot_process(
            message=req.message,
            category_slug=req.category_slug,
            known_case_ids=known_case_ids(),
            llm_call=_llm_wrapper,
        )
        meta: dict[str, Any] = dict(result.metadata or {})
        meta.update({
            "confidence": captured.get("confidence"),
            "tool_calls": captured.get("tool_calls", []),
            "model": captured.get("model"),
            "tokens_in": captured.get("tokens_in"),
            "tokens_out": captured.get("tokens_out"),
        })
        return ChatbotResponseModel(
            status=result.status,
            reply=result.reply,
            route=result.route,
            cited_case_ids=result.cited_case_ids or [],
            plan_b_reason=result.plan_b_reason,
            confidence=captured.get("confidence"),
            tool_calls=captured.get("tool_calls", []),
            metadata=meta,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"챗봇 처리 실패: {type(e).__name__}: {str(e)}",
        )


# ===== 추후 추가될 엔드포인트 =====
# @app.post("/similar") - SBERT/FAISS 유사 사례 검색 (내일 추가)
# @app.post("/guide") - 성공 가이드 매칭 (내일 추가)