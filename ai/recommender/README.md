# AI Recommender Assets

## 개요

`ai/recommender/` 는 유사 사례 검색용 SBERT/FAISS 자산 보관 폴더입니다.
현재 FastAPI 서버에 직접 연결되어 있지는 않습니다.

## 현재 상태

- 서버 미연결
- 실험/자산 보관 성격
- 현재 서비스에서 더 직접적으로 쓰이는 가이드 매핑은 `matching_table.json` 과 백엔드 로직입니다

## 주의

기존 README 에 있던 49건 기준 설명은 현재 메인 데이터 기준과 다를 수 있습니다.
현재 데이터 기준은 `ai/data/README.md` 를 우선 확인해야 합니다.

## 파일

- `embedding_pipeline.py`
- `recommender.py`
- `data_cleaning.py`
- `cleaned_data.csv`
- `similarity_index.index`
- `similarity_index_data.pkl`

## 참고

- 현재 데이터 기준: [ai/data/README.md](/D:/Codex_Folder/Sidepick/ai/data/README.md)
- AI 서버 구현: [ai/server/main.py](/D:/Codex_Folder/Sidepick/ai/server/main.py)
