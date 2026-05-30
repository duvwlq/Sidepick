# BE-22 성공사례 import 설계

작성일: 2026-05-29

## 목표

- `feature/ai`에서 만든 성공사례 자산을 현재 백엔드 구조에 안전하게 흡수한다.
- 별도 성공사례 테이블을 새로 만들지 않고, 기존 `failure_experiences` 테이블에 `case_status='SUCCESS'`로 적재한다.
- 홈, 탐색, 상세에서 `실패 사례 -> 성공 사례` 흐름을 같은 API 모델 위에서 처리한다.

## 추출한 자산

- 샘플 CSV: [D:\Codex_Folder\Sidepick\ai\data\success_cases_seed_sample.csv](D:\Codex_Folder\Sidepick\ai\data\success_cases_seed_sample.csv)
- 품질 리포트: [D:\Codex_Folder\Sidepick\ai\docs\success_cases_quality_report.md](D:\Codex_Folder\Sidepick\ai\docs\success_cases_quality_report.md)
- 원본 브랜치 참고:
  - `origin/feature/ai:ai/data/integrated_success_sample.csv`
  - `origin/feature/ai:ai/data/integrated_success_quality_report.md`
  - `origin/feature/ai:ai/pipeline/08_collect_success_cases.py`
  - `origin/feature/ai:ai/pipeline/11_refine_success_data.py`

## 현재 반영 구조

- DB 컬럼: `failure_experiences.case_status`
  - 기본값: `FAILURE`
  - 성공 사례 적재 시: `SUCCESS`
- importer 설정:
  - `app.experience-import.default-case-status`
- importer가 읽는 성공사례 CSV 컬럼:
  - `case_id`
  - `title`
  - `full_text`
  - `description`
  - `category_raw`
  - `category_slug`
  - `source`
  - `link`
  - `postdate`

## 적재 규칙

1. CSV 한 줄은 경험 사례 1건으로 취급한다.
2. `case_id`는 DB primary key로 쓰지 않고 `structured_data.externalCaseId`에 저장한다.
3. `category_slug`가 있으면 slug 우선으로 카테고리를 매핑한다.
4. `postdate`가 있으면 `created_at` 계산에 사용한다.
5. 성공 사례 적재 시:
   - `case_status='SUCCESS'`
   - `would_retry=true`
   - `failure_reason='SUCCESS_STORY'`
6. 원문 링크, source, external id는 `structured_data`에 보존한다.

## import 실행 예시

로컬 또는 서버 환경변수:

```env
APP_EXPERIENCE_IMPORT_ENABLED=true
APP_EXPERIENCE_IMPORT_CSV_PATH=D:/Codex_Folder/Sidepick/ai/data/success_cases_seed_sample.csv
APP_EXPERIENCE_IMPORT_REPLACE_MODE=UPSERT
APP_EXPERIENCE_IMPORT_DEFAULT_CASE_STATUS=SUCCESS
```

주의:

- 기존 실패 사례를 지우지 않으려면 `DELETE_IMPORTED_THEN_IMPORT` 대신 `UPSERT`를 유지한다.
- 실제 대량 적재 전에는 샘플 CSV로 먼저 검증한다.

## 연결 API

- 성공 사례 조회:
  - `GET /api/experiences/{experienceId}/success-cases`
- 동작:
  - 기준 실패 사례와 같은 카테고리의 공개 성공 사례를 최대 `limit`건 반환

## 프론트 연결 흐름

- 홈 V1
  - 실패 카드의 `성공 사례 보기` 클릭
  - `/v1/explore?feed=success&categoryId={categoryId}&sourceExperienceId={experienceId}`
- 탐색 V1
  - 실패 카드의 `성공 사례 보기` 클릭
  - 같은 성공 탭/카테고리 흐름으로 이동
- 상세
  - 분석 결과 하단 `FailureToSuccessButton`
  - `/experiences/{id}/success-comparison`

## 다음 작업

1. 실제 성공 사례 CSV 전체본 적재 전 샘플 import 검증
2. 성공 탭 empty state 문구와 비교 화면 디자인 정리
3. `SuccessComparisonPage`를 Figma 기준 V1 화면으로 교체
