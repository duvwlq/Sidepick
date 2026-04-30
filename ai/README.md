# Sidepick AI

부업 실패 사례 분석 + 유사 사례 매칭 + 성공 가이드 추천 AI 서버.

## 폴더 구조

```
ai/
├── server/              운영 중인 FastAPI 서버 (LLM 분석)
├── data/                실제 사용 데이터 (49건 핵심 + archive)
├── pipeline/            데이터 수집·정제 파이프라인 (7단계)
├── recommender/         SBERT + FAISS 유사 사례 검색 자산
├── docs/                문서 (API 명세, 데이터 품질 리포트 등)
├── archive_ai_a/        중도하차한 AI-A 원본 작업물 (히스토리 보존)
└── .env                 환경변수 (gitignore)
```

각 폴더 안에 자체 `README.md`가 있어요. 자세한 건 그쪽 참조.

## 서버 실행

```bash
cd ~/Sidepick/ai
source venv/bin/activate
uvicorn server.main:app --reload --port 8001
```

- Swagger UI: http://localhost:8001/docs
- Health: http://localhost:8001/health

## 환경 설정

`.env` 파일 (gitignore됨)에 다음 키 필요:

```
ANTHROPIC_API_KEY=sk-ant-...
```

## 의존성

```
anthropic
fastapi
uvicorn
pydantic
python-dotenv
```

## 브랜치

`feature/ai` — AI 파트 작업 브랜치. `main`에 직접 push 금지.

## BE 연동 명세서

[docs/API.md](./docs/API.md) — 현재 운영 중인 엔드포인트 명세 (1차)
