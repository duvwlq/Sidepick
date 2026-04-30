# Sidepick AI Server API 명세서

> 📌 **Status**: v0.1.0 (1차 — `/analyze` 구현 완료)
> 📌 **Last updated**: 2026-04-29
> 📌 **담당**: AI 파트 (오혜림)
>
> ⚠️ **이전 초안(`api_spec_draft.md`)은 더 이상 유효하지 않습니다.** 본 문서를 기준으로 연동해주세요.

---

## 1. 기본 정보

| 항목 | 값 |
|---|---|
| **Base URL (로컬)** | `http://localhost:8001` |
| **Base URL (배포)** | _추후 EC2 배포 시 추가_ |
| **포트** | `8001` |
| **인증** | 없음 (1차 MVP) |
| **콘텐츠 타입** | `application/json` |
| **인코딩** | UTF-8 |
| **Swagger UI (로컬)** | `http://localhost:8001/docs` |
| **OpenAPI JSON** | `http://localhost:8001/openapi.json` |

### LLM 호출 정보 (참고)
- 모델: `claude-sonnet-4-5` (Anthropic Claude API)
- 평균 응답 시간: 약 2~4초 (LLM 호출 포함)
- max_tokens: 500

---

## 2. 엔드포인트 목록

| 메서드 | 경로 | 설명 | 상태 |
|---|---|---|---|
| GET | `/health` | 서버 헬스체크 | ✅ 구현 완료 |
| POST | `/analyze` | 부업 실패 경험 분석 | ✅ 구현 완료 |
| POST | `/similar` | SBERT/FAISS 유사 사례 검색 | 🚧 4/30 추가 예정 |
| POST | `/guide` | 성공 가이드 매칭 | 🚧 5/1 추가 예정 |

---

## 3. `GET /health`

서버가 정상 작동 중인지 확인하는 헬스체크 엔드포인트.

### 요청
- 헤더, 바디 없음

### 응답 (200 OK)
```json
{
  "status": "ok",
  "service": "sidepick-ai"
}
```

### curl 예시
```bash
curl http://localhost:8001/health
```

---

## 4. `POST /analyze`

사용자의 부업 실패 경험을 LLM(Claude)으로 분석하여 키워드, 실패 카테고리, 요약, 위험도를 반환합니다.

### 요청 스키마

`POST /analyze`
`Content-Type: application/json`

#### Request Body

| 필드 | 타입 | 필수 | 제약 | 설명 |
|---|---|---|---|---|
| `category` | string | ✅ | - | 부업 카테고리 (예: `"유튜브"`, `"온라인 쇼핑몰"`, `"블로그"`) |
| `difficulties` | string[] | ❌ | 기본 `[]` | 어려웠던 점 체크 항목 배열 |
| `difficulty_etc` | string | ❌ | 기본 `""` | 어려웠던 점 — 기타 직접 서술 |
| `difficulty_extra` | string | ❌ | 기본 `""` | 보조 서술 |
| `duration_months` | integer | ✅ | `≥ 1` | 부업 진행 기간 (개월) |
| `weekly_hours` | integer | ✅ | `≥ 1` | 주당 할애 시간 |
| `free_text` | string | ✅ | 최소 10자 | 자유 서술 |

### 요청 예시
```json
{
  "category": "유튜브",
  "difficulties": ["마케팅/홍보", "타겟 분석"],
  "difficulty_etc": "",
  "difficulty_extra": "구독자가 100명에서 안 늘어남",
  "duration_months": 6,
  "weekly_hours": 10,
  "free_text": "유튜브 채널을 시작했는데 영상은 가끔 올리고 구독자도 잘 안 늘었어요."
}
```

### 응답 스키마 (200 OK)

| 필드 | 타입 | 설명 |
|---|---|---|
| `keywords` | string[] | 추출된 키워드 (정확히 3개) |
| `failure_category` | string | 실패 카테고리 (아래 7개 중 하나) |
| `summary` | string | 1줄 요약 (50자 이내) |
| `risk_level` | string | 위험도 (`high` / `medium` / `low` 중 하나) |

#### `failure_category` 가능한 값 (7개 중 하나)
- `마케팅부족`
- `자금부족`
- `시간관리`
- `타겟분석실패`
- `경쟁분석부족`
- `운영관리부족`
- `기타`

#### `risk_level` 가능한 값 (3개 중 하나)
- `high`
- `medium`
- `low`

### 응답 예시 (200 OK)
```json
{
  "keywords": ["비정기적 업로드", "구독자 정체", "지속성 부족"],
  "failure_category": "시간관리",
  "summary": "비정기적 업로드로 인한 채널 성장 정체",
  "risk_level": "medium"
}
```

### 에러 응답

#### 422 Unprocessable Entity (요청 검증 실패)
FastAPI/Pydantic이 자동 반환. 필수 필드 누락 / 타입 불일치 / 제약 위반 시.

```json
{
  "detail": [
    {
      "type": "string_too_short",
      "loc": ["body", "free_text"],
      "msg": "String should have at least 10 characters",
      "input": "짧음"
    }
  ]
}
```

#### 500 Internal Server Error (LLM 호출 실패 등)
```json
{
  "detail": "AI 분석 실패: APIError: <에러 상세>"
}
```

### curl 예시
```bash
curl -X POST http://localhost:8001/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "category": "유튜브",
    "difficulties": ["마케팅/홍보", "타겟 분석"],
    "difficulty_extra": "구독자가 100명에서 안 늘어남",
    "duration_months": 6,
    "weekly_hours": 10,
    "free_text": "유튜브 채널을 시작했는데 영상은 가끔 올리고 구독자도 잘 안 늘었어요."
  }'
```

---

## 5. BE 연동 시 주의사항

### 1) BE 측 추가 처리 가능성 있는 필드
응답 JSON은 LLM 분석 **순수 결과**만 담고 있습니다. BE에서 DB 저장 시 다음 필드를 추가로 부여하실 수 있습니다.

| BE 추가 필드 (예상) | 설명 |
|---|---|
| `analysis_id` | 분석 결과 식별자 |
| `experience_id` | 원본 경험담 FK |
| `user_id` | 작성자 FK |
| `created_at` | 분석 시각 |
| `similar_case_ids` | `/similar` 결과 (별도 호출) |
| `success_guide_key` | `/guide` 결과 (별도 호출) |

### 2) 응답 시간
LLM 호출이 동기식이라 평균 **2~4초** 걸립니다. BE에서 호출 시 타임아웃은 **최소 10초** 권장.

### 3) 동시 요청
1차 MVP는 단일 인스턴스. 동시 요청 폭주 시 큐잉 없음. 발표 시연용 트래픽 수준에서는 문제 없음.

### 4) `difficulties` 배열의 값
프론트 체크리스트 항목 그대로 전달하시면 됩니다. AI가 해당 텍스트를 그대로 LLM에 전달합니다. 정해진 enum 없음.

### 5) `free_text` 최소 10자 검증
프론트에서 1차 검증, AI 서버에서 2차 검증 (Pydantic). 10자 미만이면 422 응답.

### 6) JSON 파싱 안정성
AI 서버 내부에서 LLM 응답을 JSON 파싱합니다. 마크다운 코드 블록(\`\`\`json ... \`\`\`)으로 감싸서 오는 경우도 자동 처리됩니다. BE는 정상 JSON만 받음.

---

## 6. 향후 추가 예정 엔드포인트 (스펙 초안)

> ⚠️ 아래는 **초안**이며 구현 시 변경될 수 있습니다.

### `POST /similar` (4/30 추가 예정)
**용도**: 유사한 실패 사례 검색 (SBERT + FAISS)

**Request (예상)**:
```json
{
  "free_text": "...",
  "category": "유튜브",
  "limit": 5
}
```

**Response (예상)**:
```json
{
  "similar_cases": [
    {
      "case_id": 42,
      "similarity": 0.87,
      "summary": "..."
    }
  ],
  "match_percentage": 73
}
```

### `POST /guide` (5/1 추가 예정)
**용도**: 실패 카테고리 기반 성공 가이드 매칭

**Request (예상)**:
```json
{
  "category": "유튜브",
  "failure_category": "시간관리"
}
```

**Response (예상)**:
```json
{
  "guide_key": "youtube_time_management",
  "title": "유튜브 채널 운영 시간 관리 가이드",
  "content": "..."
}
```

---

## 7. 로컬 테스트 방법

### 서버 실행 (AI 측)
```bash
cd ~/Sidepick/ai
source venv/bin/activate
uvicorn main:app --reload --port 8001
```

### 1. 헬스체크
브라우저에서 http://localhost:8001/health 접속 → `{"status":"ok"}` 확인

### 2. Swagger UI에서 테스트
http://localhost:8001/docs → `/analyze` → "Try it out" → 예시 요청 보내기

### 3. curl로 테스트
위 4번 섹션의 curl 예시 참고.

---

## 8. 변경 이력

| 일자 | 버전 | 변경 내용 |
|---|---|---|
| 2026-04-29 | v0.1.0 | 초기 버전. `/health`, `/analyze` 명세 |
| _TBD_ | v0.2.0 | `/similar` 추가 예정 |
| _TBD_ | v0.3.0 | `/guide` 추가 예정 |

---

## 9. 문의

- 디스코드: AI 파트 (오혜림)
- 코드 위치: [`feature/ai` 브랜치 / `ai/` 폴더](https://github.com/duvwlq/Sidepick/tree/feature/ai/ai)
- 관련 파일:
  - `ai/main.py` — FastAPI 앱
  - `ai/llm_analyzer.py` — LLM 호출 로직
  - `ai/test_samples.py` — 샘플 테스트 (5/5 통과)
