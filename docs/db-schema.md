# DB 스키마 가이드

## 현재 기준

현재 스키마의 기준은 한 파일이 아니라 다음 조합입니다.

- 초기 스키마: `infra/mysql/init/001_init.sql`
- 애플리케이션 migration: `infra/mysql/migrations/*.sql`
- 런타임 검증: Spring JPA `ddl-auto=validate`
- 애플리케이션 migration 실행: Flyway

즉 문서를 볼 때는 `001_init.sql` 만 보지 말고 migration 까지 함께 봐야 합니다.

## 런타임 환경

- 로컬: Docker Compose MySQL 8.4
- 운영: AWS RDS MySQL
- 데이터베이스 이름 기본값: `failforward`

## 주요 테이블

### `users`

- 사용자 계정 정보
- 인증 공급자, 이메일 검증 여부, 프로필 완료 여부 포함

### `social_accounts`

- 카카오/구글 등 소셜 계정 매핑
- `users` 와 `1:N`

### `email_verification_tokens`

- 이메일 인증 코드 및 만료 시각 저장

### `business_categories`

- 서비스에서 사용하는 업종 카테고리 마스터

### `failure_experiences`

- 실패 경험 본문
- 업종, 투자 금액, 기간, 주당 시간, 실패 원인, 구조화 데이터 포함

### `ai_analysis`

- 경험 1건당 AI 분석 결과
- `fail_reason_tags`
- `summary_list`
- `structured_summary`
- `failure_category`
- `risk_level`
- `risk_factor_analysis`
- `risk_score`
- `processed_at`

### `matched_cases`

- 분석 결과와 연결되는 유사 사례 목록
- `case_summary`, `key_lesson`, `match_rate` 포함

### `comments`

- 경험 댓글 / 대댓글 구조

## 관계

- `users 1:N social_accounts`
- `users 1:N failure_experiences`
- `users 1:N comments`
- `failure_experiences 1:1 ai_analysis`
- `failure_experiences 1:N comments`
- `ai_analysis 1:N matched_cases`

## 참고 소스

- 초기 DDL: `infra/mysql/init/001_init.sql`
- 스키마 변경: `infra/mysql/migrations/004_align_ai_analysis_schema.sql`
- 스키마 변경: `infra/mysql/migrations/005_align_ai_spec_v1.sql`
- 애플리케이션 설정: `server/src/main/resources/application.yml`

## 운영 메모

- 운영과 로컬 모두 JPA는 `ddl-auto=validate` 기준입니다.
- 실제 테이블 구조는 애플리케이션 시작 시 Flyway migration 이 반영된 결과를 기준으로 봐야 합니다.
- CSV import 나 운영 데이터 정리는 애플리케이션 import 로직과 운영 스크립트 기준으로 수행합니다.
