# server/ — Sidepick AI FastAPI 서버

부업 실패 경험을 Claude API로 분석하는 운영 서버.

## 📂 구조

```
server/
├── main.py              FastAPI 앱 + 엔드포인트 정의
├── llm_analyzer.py      Claude API 호출 + 분석 로직
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

## 추후 추가 예정

- `POST /similar` — SBERT/FAISS 유사 사례 검색 (`recommender/` 자산 활용)
- `POST /guide` — 성공 가이드 매칭
