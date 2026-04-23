# Supabase 프로젝트 정보

## 사용 여부

현재 프로젝트는 Supabase를 사용하지 않습니다.

## 결정 사유

- 초기 예시 문서에는 Supabase(PostgreSQL) 항목이 포함되어 있었음
- 프로젝트 진행 중 백엔드 데이터베이스 방향을 MySQL로 확정함
- Docker Compose와 AWS EC2 기반 배포 단순성을 위해 MySQL 기준으로 정리함

## 현재 대체 구성

- 데이터베이스: MySQL 8.4
- 실행 방식: Docker Compose
- 스키마 파일: `infra/mysql/init/001_init.sql`

## 정리

따라서 제출 항목의 `Supabase 프로젝트 정보`는 실제 사용하지 않음으로 기재하고,
대신 MySQL 기반 스키마 설계 및 적용으로 대체 진행한 것으로 설명하면 됩니다.
