# FailForward AI-BE API 규격서 (초안) (BE 확인 부탁드립니다)

## API 엔드포인트 설계

### 1. 실패 경험 분석 API
**POST /api/ai/analyze**

#### 요청(Request)
```json
{
  "experience_id": 123,
  "user_id": 456,
  "content": "온라인 쇼핑몰을 시작했는데 3개월만에 실패했습니다. 초기 투자금 300만원을 모두 잃었어요. 마케팅 경험이 없어서 고객 확보에 실패했습니다.",
  "category": "온라인사업",
  "investment_amount": 3000000,
  "duration_months": 3
}
```

#### 응답(Response)
```json
{
  "success": true,
  "data": {
    "analysis_id": "analysis_789",
    "risk_analysis": [
      "초기 투자금 300만원이 수익 구조 대비 과도했습니다",
      "마케팅 전문성 부족으로 고객 확보에 실패했습니다", 
      "시장 조사 없이 시작하여 수요 예측을 못했습니다"
    ],
    "failure_tags": ["#초기투자과다", "#마케팅부족", "#시장조사부족"],
    "confidence_score": 0.85,
    "processing_time": "2.3초"
  },
  "message": "분석 완료"
}
```

### 2. 유사 사례 검색 API
**POST /api/ai/similar**

#### 요청(Request)
```json
{
  "experience_id": 123,
  "content": "온라인 쇼핑몰 실패 경험...",
  "limit": 5,
  "min_similarity": 0.7
}
```

#### 응답(Response)
```json
{
  "success": true,
  "data": {
    "similar_cases": [
      {
        "experience_id": 456,
        "title": "온라인 의류 쇼핑몰 실패기",
        "similarity_score": 0.92,
        "summary": "비슷한 초기투자 규모와 마케팅 실패",
        "key_lessons": ["마케팅 예산 미리 확보", "SNS 마케팅 필수"]
      }
    ],
    "total_found": 12,
    "processing_time": "1.1초"
  }
}
```

### 에러 처리

#### 에러 응답 형식
```json
{
  "success": false,
  "error": {
    "code": "AI_MODEL_ERROR",
    "message": "AI 모델 처리 중 오류가 발생했습니다",
    "details": "CUDA out of memory"
  },
  "retry_after": 30
}
```

### 에러 코드 정의
**INPUT_VALIDATION_ERROR: 입력 데이터 검증 실패**

**AI_MODEL_ERROR: AI 모델 처리 오류**

**INSUFFICIENT_DATA: 분석할 데이터 부족**

**TIMEOUT_ERROR: 처리 시간 초과**

**SERVER_OVERLOAD: 서버 과부하**


## ⚡ 성능 요구사항
| 항목 | 목표 | 최대 허용 |
|------|------|----------|
| 분석 API 응답시간 | 3초 이내 | 5초 |
| 유사사례 검색 | 2초 이내 | 3초 |
| 동시 요청 처리 | 10개 | 20개 |
| 분석 정확도 | 80% 이상 | - |
