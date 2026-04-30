from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from server.llm_analyzer import analyze_experience

app = FastAPI(
    title="Sidepick AI Server",
    description="부업 실패 경험 분석 AI 서버",
    version="0.1.0"
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


# ===== 추후 추가될 엔드포인트 =====
# @app.post("/similar") - SBERT/FAISS 유사 사례 검색 (내일 추가)
# @app.post("/guide") - 성공 가이드 매칭 (내일 추가)