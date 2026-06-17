# server/ — Sidepick AI FastAPI 서버

부업 실패 경험을 Claude API로 분석하는 운영 서버.

## 📂 구조

```
server/
├── main.py              FastAPI 앱 + 엔드포인트 정의
├── llm_analyzer.py      Claude API 호출 + 분석 로직 (Mock 모드 분기 포함)
├── mock_llm.py          Mock 응답 템플릿 (7개 카테고리 시나리오)
├── __init__.py          (패키지 인식용 빈 파일)
└── tests/
    ├── test_api.py       Anthropic API 단순 호출 테스트
    └── test_samples.py   5개 샘플 일관성 테스트
```

## 🚀 실행

```bash
# AI 폴더에서 실행 (server.main 모듈 경로)
cd ~/Sidepick/ai
source venv/bin/activate
uvicorn server.main:app --reload --port 8001
```

## 🧪 테스트

```bash
cd ~/Sidepick/ai
source venv/bin/activate

# Claude API 연결 테스트
python -m server.tests.test_api

# 5개 샘플 일관성 테스트
python -m server.tests.test_samples
```

## 📡 엔드포인트

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/health` | 서버 헬스체크 |
| POST | `/analyze` | 부업 실패 경험 분석 (LLM 호출) |

자세한 명세는 [`../docs/API.md`](../docs/API.md) 참조.

## 🔧 LLM 설정

- 모델: `claude-sonnet-4-5`
- max_tokens: 500
- 평균 응답 시간: 2~4초

## 🧪 Mock 모드 (AI-03)

실제 LLM 호출 없이 미리 정의된 가짜 응답을 반환. UI/플로우 개발 시 비용 0원.

**ON 시키기:**

`ai/.env` 파일에서:
```bash
USE_MOCK_LLM=true
```

→ `analyze_experience()` 호출 시 카테고리 기반 mock 응답 반환 (응답에 `[MOCK]` 접두사 표시).

**제공 시나리오**: 7개 카테고리 (스마트스토어 / 유튜브 / 배달 / 블로그 / 강의 / 콘텐츠 / 기타)
+ 매칭 안 되는 카테고리는 default mock 반환.

**OFF 시키기 (운영)**: `USE_MOCK_LLM=false` (또는 변수 미설정).

**단독 테스트**:
```bash
cd ~/Sidepick/ai
source venv/bin/activate
python -m server.mock_llm   # 7개 카테고리 mock 응답 확인
```

## 추후 추가 예정

- `POST /similar` — SBERT/FAISS 유사 사례 검색 (`recommender/` 자산 활용)
- `POST /guide` — 성공 가이드 매칭
