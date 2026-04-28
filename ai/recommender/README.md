# recommender/ — SBERT + FAISS 유사 사례 검색

부업 실패 사례 간 유사도를 계산하고 검색하는 임베딩 자산.

향후 `POST /similar` 엔드포인트(추후 추가 예정)에서 활용.

## 📂 파일 목록

| 파일 | 용도 |
|---|---|
| `embedding_pipeline.py` | SBERT 임베딩 생성 파이프라인 |
| `recommender.py` | 유사 사례 검색 로직 |
| `data_cleaning.py` | 임베딩 입력용 데이터 클렌징 |
| `cleaned_data.csv` | 클렌징된 입력 데이터 |
| `similarity_index.index` | FAISS 인덱스 (binary, ~3MB) |
| `similarity_index_data.pkl` | FAISS 매핑 데이터 (binary, ~750KB) |

## 🧠 동작 방식

```
유저 입력 텍스트
    ↓ (SBERT 인코딩)
벡터 (768차원)
    ↓ (FAISS top-k 검색)
유사 사례 ID 리스트 + 유사도 점수
    ↓
원본 데이터(`../data/failure_cases_49.csv`)에서 매칭하여 반환
```

## 🚧 통합 상태

현재는 자산만 보유. **FastAPI 서버에는 아직 연결되지 않음**.

다음 작업:
1. `server/`에 `/similar` 엔드포인트 추가
2. `recommender.py`의 검색 함수를 FastAPI에서 호출
3. `failure_cases_49.csv` 기준으로 인덱스 재생성 (현재 인덱스는 더 큰 데이터셋 기반)

## ⚠️ 인덱스 재생성 필요성

`similarity_index.*` 파일은 yumenikkidiary 레포의 데이터(아마 1,000건 이상) 기준으로 만들어진 것입니다. 우리는 **49건 + 검수 20건** 정도만 사용하므로, **재생성 권장**:

```bash
cd ~/Sidepick/ai
source venv/bin/activate
python recommender/embedding_pipeline.py  # 입력 경로 수정 필요
```

## 🗂️ 원본 위치

- 원본: [yumenikkidiary/sidejob-data-collection](https://github.com/yumenikkidiary/sidejob-data-collection)
  - `ai/embedding_pipeline.py`
  - `ai/model/recommender.py`
  - `models/similarity_index.*`
- 구버전 백업: [`../archive_ai_a/data/raw/`](../archive_ai_a/data/raw/)
