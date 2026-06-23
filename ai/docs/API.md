# Sidepick AI Server API

## 상태

- 현재 구현됨: `GET /health`, `POST /analyze`
- 현재 문서는 `ai/server/main.py` 구현 기준입니다.
- `api_spec_draft.md` 는 초안 아카이브로만 취급합니다.

## 기본 정보

| 항목 | 값 |
|---|---|
| 로컬 Base URL | `http://localhost:8001` |
| 포트 | `8001` |
| 인증 | 없음 |
| Swagger UI | `http://localhost:8001/docs` |
| OpenAPI JSON | `http://localhost:8001/openapi.json` |

## 엔드포인트

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/health` | 서버 헬스 체크 |
| POST | `/analyze` | 실패 경험 분석 |

주의:

- 이 저장소에는 `/similar`, `/guide` 엔드포인트 구현이 없습니다.
- 유사 사례/가이드 조합은 현재 백엔드 쪽 로직과 `matching_table.json` 로 처리합니다.

## `GET /health`

응답 예시:

```json
{
  "status": "ok",
  "service": "sidepick-ai"
}
```

## `POST /analyze`

### Request Body

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `category` | string | 예 | 부업 카테고리 |
| `difficulties` | string[] | 아니오 | 어려웠던 점 목록 |
| `difficulty_etc` | string | 아니오 | 기타 서술 |
| `difficulty_extra` | string | 아니오 | 보조 서술 |
| `duration_months` | integer | 예 | 진행 기간, 1 이상 |
| `weekly_hours` | integer | 예 | 주당 시간, 1 이상 |
| `free_text` | string | 예 | 자유 서술, 10자 이상 |

### Request Example

```json
{
  "category": "유튜브",
  "difficulties": ["마케팅/홍보", "타겟 분석"],
  "difficulty_etc": "",
  "difficulty_extra": "구독자가 잘 늘지 않음",
  "duration_months": 6,
  "weekly_hours": 10,
  "free_text": "유튜브 채널을 시작했는데 업로드가 들쭉날쭉했고 구독자도 잘 늘지 않았어요."
}
```

### Response Fields

| 필드 | 타입 | 설명 |
|---|---|---|
| `keywords` | string[] | 추출 키워드 |
| `failure_category` | string | 실패 카테고리 |
| `summary` | string | 1줄 요약 |
| `risk_level` | string | `high`, `medium`, `low` 중 하나 |

### Response Example

```json
{
  "keywords": ["비정기 업로드", "구독자 정체", "지속성 부족"],
  "failure_category": "시간관리",
  "summary": "비정기 업로드로 채널 성장이 정체된 사례",
  "risk_level": "medium"
}
```

### 에러 응답

- `422`: 요청 검증 실패
- `500`: AI 분석 실패

## 로컬 실행

현재 저장소 기준 실행 명령:

```bash
cd ai
uvicorn server.main:app --reload --port 8001
```

가상환경을 별도로 사용 중이면 먼저 활성화한 뒤 실행하면 됩니다.

## 참고 파일

- 구현: `ai/server/main.py`
- 분석 로직: `ai/server/llm_analyzer.py`
- 서버 안내: `ai/server/README.md`
