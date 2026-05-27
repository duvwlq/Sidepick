# Sidepick AI 폴더 가이드

## 목적

`ai/` 아래 폴더의 역할과 현재 기준 데이터를 빠르게 확인하기 위한 문서입니다.

## 현재 구조

```text
ai/
├── server/        FastAPI 서버 코드
├── data/          현재 사용 중인 데이터와 가이드 매핑
├── docs/          AI 관련 문서
├── pipeline/      과거 수집/정제 파이프라인
├── recommender/   유사 사례 검색 자산
└── archive_ai_a/  과거 작업물 보관
```

## 폴더별 역할

### `server/`

- 현재 운영 중인 AI FastAPI 서버 코드
- 실제 구현 기준: `server/main.py`
- 현재 구현 엔드포인트: `/health`, `/analyze`

실행 예시:

```bash
cd ai
uvicorn server.main:app --reload --port 8001
```

### `data/`

- 현재 기준 데이터 위치
- 최신 메인 데이터 설명은 `ai/data/README.md` 를 따릅니다.

현재 문서 기준 핵심 파일:

- `failure_cases_100.csv`
- `failure_cases_100_tagged.csv`
- `failure_cases_100_for_be.csv`
- `matching_table.json`

주의:

- 예전 49건 네이버 기반 데이터는 여전히 남아 있지만 현재 메인 기준은 아닙니다.
- `failure_cases_49.csv` 는 과거 기준 또는 비교용 자산으로 보는 편이 맞습니다.

### `docs/`

- AI 서버 API 문서와 데이터 문서
- 현재 API 문서 기준: `ai/docs/API.md`

### `pipeline/`

- 예전 네이버 지식인 기반 수집/정제 파이프라인
- 현재 운영 경로에서 직접 실행되는 핵심 구성은 아닙니다.
- 과거 49건 데이터가 어떻게 만들어졌는지 추적할 때 참고합니다.

### `recommender/`

- 유사 사례 검색용 자산
- 현재 FastAPI 서버에 직접 연결되어 있지 않습니다.
- 실제 서비스의 가이드 매핑은 지금은 백엔드의 `matching_table.json` 로직이 더 중요합니다.

### `archive_ai_a/`

- 과거 작업물 보관
- 직접 수정하거나 현재 운영 기준으로 삼지 않습니다.

## 어디에 무엇을 넣을지

- AI 서버 엔드포인트 수정: `ai/server/`
- AI 분석 로직 수정: `ai/server/llm_analyzer.py`
- 현재 데이터셋 관련 문서 수정: `ai/data/README.md`
- 과거 데이터 파이프라인 조사: `ai/pipeline/`
- 실험성 자산 보관: 현재 구조와 분리해서 별도 폴더 사용 권장

## 참고

- API 기준: [API.md](/D:/Codex_Folder/Sidepick/ai/docs/API.md)
- 데이터 기준: [README.md](/D:/Codex_Folder/Sidepick/ai/data/README.md)
- 서버 안내: [README.md](/D:/Codex_Folder/Sidepick/ai/server/README.md)
