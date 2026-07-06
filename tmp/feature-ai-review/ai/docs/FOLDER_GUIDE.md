# 📁 Sidepick AI 폴더 가이드

각 폴더와 파일이 뭐 하는 건지, 새로 추가할 때 어디에 넣어야 하는지 정리한 레퍼런스.

> 📌 **언제 보면 좋나**: "이 파일 어디에 넣지?" / "이 폴더에 뭐가 들어있더라?" 헷갈릴 때.

---

## 🌳 전체 구조

```
ai/
├── README.md                      📝 ai/ 폴더 전체 안내
├── .env                           🔒 API 키 (gitignore — Git에 안 올라감)
│
├── server/                        🚀 운영 중인 FastAPI 서버
│   ├── README.md
│   ├── __init__.py                (Python 패키지 인식용)
│   ├── main.py                    FastAPI 앱 + 엔드포인트
│   ├── llm_analyzer.py            Claude API 호출 함수
│   └── tests/
│       ├── __init__.py
│       ├── test_api.py            Anthropic API 단순 호출 테스트
│       └── test_samples.py        5개 샘플 일관성 테스트
│
├── data/                          📊 실제 사용 데이터
│   ├── README.md
│   ├── failure_cases_49.csv       ⭐ 핵심 49건 실패 사례
│   ├── pending_review.csv         🟡 검수 필요 데이터 (~20건)
│   ├── full_cleaned.csv           📄 전체 본문 클렌징본 (280+건)
│   └── archive/                   🗄️ 중간 산출물 (참고용)
│       ├── naver_failure_only.csv      v3 1차 필터링본
│       ├── naver_kin_cleaned.csv       v2 클렌징본
│       ├── naver_kin_cleaned.json      v2 클렌징본 (JSON)
│       └── naver_kin_full_raw.csv      본문 풀 raw
│
├── pipeline/                      🔧 데이터 수집·정제 파이프라인
│   ├── README.md
│   ├── 01_collect_naver_kin.py    네이버 지식iN API 수집
│   ├── 02_clean_text.py           1차 텍스트 클렌징
│   ├── 03_select_top1000.py       상위 1,000개 선별
│   ├── 04_filter_failures.py      키워드 기반 1차 실패 필터
│   ├── 05_expand_fulltext.py      ⭐ 본문 직접 크롤링 (핵심)
│   ├── 06_clean_fulltext.py       본문 텍스트 추가 클렌징
│   └── 07_filter_failures_final.py 본문 기반 최종 필터 (49건 도출)
│
├── recommender/                   🎯 SBERT/FAISS 유사 사례 검색
│   ├── README.md
│   ├── embedding_pipeline.py      SBERT 임베딩 생성
│   ├── recommender.py             유사 사례 검색 로직
│   ├── data_cleaning.py           임베딩 입력용 클렌징
│   ├── cleaned_data.csv           클렌징된 입력 데이터
│   ├── similarity_index.index     FAISS 인덱스 (binary)
│   └── similarity_index_data.pkl  FAISS 매핑 데이터 (binary)
│
├── docs/                          📚 문서
│   ├── README.md
│   ├── API.md                     ⭐ 현재 운영 API 명세서
│   ├── FOLDER_GUIDE.md            🗂️ 이 문서
│   ├── api_spec_draft.md          🚫 구버전 (deprecated)
│   └── data_quality_report.md     데이터 품질 리포트 (현지님 작성)
│
└── archive_ai_a/                  🏷️ 현지님(AI-A) 원본 보관 (히스토리 보존, 직접 사용 X)
    ├── README.md
    ├── crawler/                   원본 크롤링 코드 (T5 폐기 전)
    └── data/                      원본 중간 산출물 (everytime 등 포함)
```

---

## 📂 폴더별 역할 + 새 파일 어디 넣어야 하나

### 1. `server/` — 🚀 운영 중인 FastAPI 서버

**역할**: 실제로 돌아가는 AI 서버. BE에서 호출하는 엔드포인트 코드.

| 새로 추가할 게 | 어디로? |
|---|---|
| 새 엔드포인트 (예: `/similar`, `/guide`) | `server/main.py` 안에 추가 |
| LLM 호출 새 함수 | `server/llm_analyzer.py` 안에 추가 (또는 새 파일 `server/sbert_searcher.py`) |
| 새 테스트 | `server/tests/test_*.py` |
| 외부 라이브러리 import | 그냥 main.py나 llm_analyzer.py 상단에 추가 |

**실행 방법**:
```bash
cd ~/Sidepick/ai
source venv/bin/activate
uvicorn server.main:app --reload --port 8001
```

---

### 2. `data/` — 📊 실제 사용 데이터

**역할**: 서버나 추천기에서 **실제로 읽어 쓰는** 데이터셋.

| 새로 추가할 게 | 어디로? |
|---|---|
| 49건 외 새 실패 사례 데이터 | `data/` 직속 (예: `failure_cases_v2.csv`) |
| 정제 중간 산출물 (참고용) | `data/archive/` |
| 임시 테스트 데이터 | `data/`에 두지 말고 별도 임시 폴더 (또는 .gitignore) |

**현재 핵심 파일**:
- ⭐ `failure_cases_49.csv` — **이게 메인**. 모든 분석의 기반
- `pending_review.csv` — 49건에 못 든 애매한 케이스 (수동 검수 후 49건에 합칠 수도)
- `full_cleaned.csv` — 49건의 모집단 (본문 280+건). 데이터 부족 시 추가 추출 가능

---

### 3. `pipeline/` — 🔧 데이터 수집·정제 파이프라인

**역할**: 데이터를 1,000건 → 49건으로 거르는 7단계 코드. **현재는 안 돌리고 있음** (이미 49건 도출됨). 추후 데이터 추가 수집 시 사용.

| 새로 추가할 게 | 어디로? |
|---|---|
| 새 정제 단계 추가 | `pipeline/08_새단계.py` (번호 이어서) |
| 다른 출처 크롤러 (예: 카페, 블로그) | `pipeline/` 직속 또는 새 서브폴더 (`pipeline/cafe/`) |
| 단발성 분석 스크립트 | `pipeline/`에 두지 말고 별도 위치 (예: `scripts/`) |

**파이프라인 흐름**:
```
01 (수집) → 02 (클렌징) → 03 (Top1000) → 04 (1차 필터) → 05 (본문 확장) → 06 (본문 클렌징) → 07 (최종 필터 → 49건)
```

---

### 4. `recommender/` — 🎯 SBERT/FAISS 유사 사례 검색

**역할**: **추후 `/similar` 엔드포인트**에 들어갈 자산. 부업 실패 사례 간 유사도 계산용. 현재는 자산만 보유, 서버 미연결.

| 새로 추가할 게 | 어디로? |
|---|---|
| FAISS 인덱스 재생성 코드 | `recommender/build_index.py` |
| 다른 검색 알고리즘 실험 | `recommender/experiments/` 만들어서 |
| 49건 기준으로 만든 새 인덱스 | 기존 `similarity_index.index` 덮어쓰기 |

**할 일 (예정)**:
- 49건 기준으로 인덱스 재생성 (현재는 1,000건+ 기반)
- `server/main.py`에 `/similar` 엔드포인트 추가하고 여기서 import

---

### 5. `docs/` — 📚 문서

**역할**: BE/PD가 참고할 명세서, 리포트.

| 새로 추가할 게 | 어디로? |
|---|---|
| 새 API 명세 변경 | `docs/API.md` 업데이트 |
| 새 데이터 분석 리포트 | `docs/<리포트명>.md` |
| 신규 의사결정 기록 (ADR) | `docs/decisions/` 만들어서 |
| 발표용 슬라이드 | `docs/`에 두지 말고 루트 `screenshots/`나 별도 폴더 |

**현재 파일**:
- ⭐ `API.md` — **BE 연동의 단일 진실**. 내용 바꾸면 BE에 디스코드 공지
- `FOLDER_GUIDE.md` — 이 문서 (폴더 구조 가이드)
- `api_spec_draft.md` — 옛날 초안. 보지 마세요 (DEPRECATED 표시됨)
- `data_quality_report.md` — 현지님 작성. 49건 어떻게 도출됐는지 컨텍스트

---

### 6. `archive_ai_a/` — 🏷️ 현지님(AI-A) 원본 보관

**역할**: 중도하차한 현지님의 원본 작업물. **건드리지 말고 그대로 두기**. 히스토리 보존이 목적.

| 새로 추가할 게 | 어디로? |
|---|---|
| 새 자료 — 절대 여기 넣지 말 것 | ❌ 이 폴더는 박제 상태 |
| 현지님 작업 참고 필요 | 읽기만 하고 사용하려면 `pipeline/`이나 `data/`로 따로 정리해서 옮김 |

**왜 이 폴더가 있냐**: 현지님이 만든 코드/데이터가 향후 디버깅 시 참조 가능. git mv로 옮겼으니 히스토리도 살아있음.

---

### 7. `.env` — 🔒 환경변수 (gitignore됨)

**역할**: API 키 등 민감 정보. **GitHub에 절대 안 올라가게** `.gitignore`에 등록됨.

```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxx
```

| 새로 추가할 게 | 어디로? |
|---|---|
| 새 API 키 (예: OpenAI, Naver) | `.env`에 추가 (예: `NAVER_CLIENT_ID=xxx`) |
| DB 접속 정보 | `.env`에 추가 |
| 절대 파일에 직접 키 쓰지 마세요 | ❌ 코드에 하드코딩 X |

---

## 🗺️ "이런 거 어디에 넣어야 하지?" 빠른 안내

| 작업 종류 | 정답 폴더 |
|---|---|
| 새 엔드포인트 추가 | `server/main.py` |
| LLM 프롬프트 수정 | `server/llm_analyzer.py` |
| LLM 분석 결과 검증 코드 | `server/tests/test_samples.py` |
| 새 실패 사례 데이터 추가 | `data/` 직속 |
| 49건 다시 도출하는 정제 단계 변경 | `pipeline/` (단계 번호 맞춰서) |
| 유사 검색 로직 변경 | `recommender/recommender.py` |
| BE에게 알릴 API 변경 | `docs/API.md` 업데이트 |
| 환경변수/API 키 | `.env` (커밋 X) |

---

## 🚦 절대 하지 말 것

| ❌ 금지 | 이유 |
|---|---|
| `archive_ai_a/` 안의 파일 수정/삭제 | 히스토리 박제용. 그대로 두기 |
| `.env` 파일을 GitHub에 push | API 키 노출 = 보안 사고 |
| `data/` 안에 임시 파일 막 추가 | 진짜 사용하는 데이터만 깔끔하게 유지 |
| `pipeline/` 번호 건너뛰기 | 흐름이 안 보임 (08, 09 식으로 이어서) |
| `server/main.py`에 직접 데이터 처리 | 무거운 로직은 별도 파일로 분리 |

---

## 📌 한 줄 요약

```
🚀 server/      → 서버 코드 (운영)
📊 data/        → 실제 쓰는 데이터
🔧 pipeline/    → 데이터 만드는 파이프라인
🎯 recommender/ → 유사 검색 자산
📚 docs/        → 명세서·리포트
🏷️ archive_ai_a/ → 현지님 원본 (박제)
🔒 .env         → 비밀 (gitignore)
```

**대부분의 새 작업은** → `server/` 또는 `data/` 둘 중 하나에 들어갑니다. 나머지는 자주 안 건드려요.
