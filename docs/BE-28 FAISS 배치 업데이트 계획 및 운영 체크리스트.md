# BE-28 FAISS 배치 업데이트 계획 및 운영 체크리스트

기준일: 2026-06-04

## 목표

FAISS 인덱스 운영 경로를 `스크립트`, `산출물 경로`, `운영 주기`, `트리거 이벤트`, `복구 절차`까지 끊김 없이 정리한다.

## 기준 자산

- 스크립트: `ai/scripts/06_build_index.py`
- 인덱스 경로: `ai/recommender/sidepick_index.index`
- 메타데이터 경로: `ai/recommender/sidepick_metadata.pkl`
- 입력 데이터 기준:
  - `ai/data/failure_cases_100_tagged.csv`
  - 이후 성공사례 import 후 통합 CSV 또는 중간 산출물

## 운영 원칙

- 실패/성공 사례는 통합 인덱스를 유지한다.
- 메타데이터에서 `type=failure|success`로 구분한다.
- `case_id` 기준 upsert/delete 정합성을 유지한다.
- 기본 운영 모드는 `5~10분 주기 재생성/동기화`로 둔다.
- 관리자 수동 재실행 초안은 후속 endpoint 대상으로 남긴다.

## 트리거 이벤트

- 성공사례 신규 등록
- 성공사례 수정
- 성공사례 삭제 또는 비공개 전환
- 카테고리 변경
- 분석 메타데이터 변경

## 관리자 수동 트리거 초안

- `POST /api/admin/index-sync`
- 목적: FAISS 인덱스 수동 재생성/동기화
- 인증: 관리자 전용
- 응답 필드 초안:
  - `jobId`
  - `status`
  - `startedAt`
  - `indexVersion`

## 로그 필드

- `job_type=index_sync`
- `case_type`
- `case_id`
- `event=create|update|delete|reclassify|rebuild`
- `embedding_version`
- `index_version`
- `duration_ms`
- `result=success|retry|failed`

## 검증 결과

- 의존성 보강:
  - `pandas`
  - `sentence-transformers`
  - `faiss-cpu`
- 실행 성공:
  - `python ai/scripts/06_build_index.py`
  - `python ai/scripts/06_build_index.py test`
- 재생성 결과:
  - 인덱스 96건 기준 재생성 성공
  - 샘플 검색 쿼리 반환 확인

## 운영 로그 개선

- 모델 캐시가 있으면 `local_files_only=True`로 먼저 로드하도록 반영했다.
- 결과적으로 캐시 이후 불필요한 Hugging Face HEAD 재시도 경고를 제거했다.

## 상태

- `완료`

## 후속 메모

- 실제 관리자 endpoint 구현 여부는 별도 결정
- 입력 데이터 통합 경로는 성공사례 import 방식 확정 후 최종 고정
