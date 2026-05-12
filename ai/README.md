# Sidepick AI

FastAPI 기반 AI 분석 서버와 추천 자산 관리 영역입니다.  
부업 실패 경험을 입력받아 분석 리포트를 만들고, 유사 사례 탐색에 필요한 자산을 함께 관리합니다.

---

## What This Folder Owns

| 영역 | 설명 |
| --- | --- |
| `server/` | 운영 중인 FastAPI 분석 서버 |
| `data/` | 실제 분석/추천에 쓰는 데이터 자산 |
| `pipeline/` | 데이터 정제 및 가공 파이프라인 |
| `recommender/` | SBERT + FAISS 기반 유사 사례 검색 자산 |
| `docs/` | AI 관련 내부 문서 |
| `archive_ai_a/` | 과거 AI 실험/백업 자산 |
| `scripts/` | 인덱스 구축, 태깅 등 보조 스크립트 |

---

## Runtime Overview

| 항목 | 현재 기준 |
| --- | --- |
| Framework | FastAPI |
| Language | Python |
| LLM | Anthropic Claude API |
| Public Port | `8001` |
| Backend Link | Spring Boot에서 내부 URL로 호출 |
| Similarity Assets | SBERT + FAISS |

---

## Local Run

직접 실행:

```bash
cd D:/Codex_Folder/Sidepick/ai
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn server.main:app --reload --port 8001
```

접속:
- Swagger UI: [http://localhost:8001/docs](http://localhost:8001/docs)
- Health: [http://localhost:8001/health](http://localhost:8001/health)

Docker로는 루트 `infra/docker-compose.yml`에서 함께 실행할 수 있습니다.

---

## Required Environment

`.env` 또는 실행 환경에 아래 값이 필요합니다.

```env
ANTHROPIC_API_KEY=***
```

루트 `.env.example`을 기준으로 관리하며, 민감 정보는 저장소에 포함하지 않습니다.

---

## Python Dependencies

주요 의존성:

- `fastapi`
- `uvicorn[standard]`
- `anthropic`
- `python-dotenv`

추가 추천/파이프라인 자산은 `recommender/`, `scripts/` 쪽에서 별도로 관리합니다.

---

## Design Notes

### 왜 AI 서버를 별도로 분리했는가

웹 API와 LLM 호출은 성격이 다릅니다.

- 백엔드는 인증, 저장, API 계약 안정성이 중요합니다.
- AI 서버는 프롬프트, 모델 호출, 분석 결과 생성이 핵심입니다.

이 둘을 분리하면:
- 장애 구간 추적이 쉬워지고
- AI 실험이 백엔드 안정성을 덜 건드리며
- 운영 경계가 명확해집니다.

### 유사 사례 검색 자산은 왜 별도 관리하는가

추천 자산은 코드보다 데이터/인덱스의 성격이 강합니다.

- 분석 서버와 동일 저장소에서 버전 추적 가능
- 인덱스 재생성 흐름 관리 가능
- 추천 품질 개선 작업을 독립적으로 진행 가능

---

## Relationship with Backend

기본 흐름:

1. 사용자가 실패 경험을 등록합니다.
2. Spring Boot 백엔드가 분석 요청을 준비합니다.
3. FastAPI 서버가 Claude API를 호출해 분석 결과를 생성합니다.
4. 필요 시 추천 자산을 이용해 유사 사례 탐색 정보를 보강합니다.
5. 결과는 다시 백엔드와 프론트로 전달됩니다.

관련 문서:
- [../docs/05_ai_integration_contract.md](../docs/05_ai_integration_contract.md)
- [../README.md](../README.md)

---

## Notes

- `archive_ai_a/`는 과거 실험 보관용입니다.
- 현재 운영 기준은 `server/` 아래 FastAPI 서버와 루트 `infra/` 실행 구조입니다.
- README 기준 설명과 실제 배포 방식이 다를 경우, 루트 README와 `docs/07_deployment.md`를 우선합니다.
