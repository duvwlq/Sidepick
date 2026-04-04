# 1주차 진행 현황

## 완료된 항목

- GitHub 저장소 생성 및 `develop` 브랜치 작업 흐름 정리
- Java 17 기반 Spring Boot 백엔드 초기 구성
- MySQL 8.4 기반 Docker Compose 로컬 환경 구성
- MySQL 스키마 SQL 및 JPA 엔티티 기본 구조 반영
- 헬스 체크 엔드포인트 및 Swagger UI 노출
- 현재 OpenAPI 초안을 기준으로 API 골격 구현
- 로컬 Maven 없이 빌드할 수 있는 Docker 기반 Maven wrapper 추가
- EC2 설정 가이드 및 배포 보조 스크립트 작성

## 확인 완료

- 로컬 Docker 환경에서 백엔드와 MySQL 실행 가능
- Swagger UI가 `http://localhost:8081/swagger-ui.html` 에서 노출됨
- 헬스 체크가 `http://localhost:8081/api/health` 에서 응답함
- `.\mvnw.cmd -DskipTests package` 빌드 성공 확인

## 진행 중

- 무료 또는 저사양 인스턴스에서 안정적인 EC2 배포 절차 정리
- 임시 스텁 로직을 실제 인증, 영속성, AI 연동 로직으로 교체

## 현재 한계

- Spring Security와 JWT는 아직 구현되지 않음
- 현재 인증 응답은 임시 토큰 생성 방식으로 처리됨
- 일부 API 흐름은 MVP 골격 구현을 위해 단순화된 스텁 로직을 사용함
- EC2 외부 검증은 저사양 인스턴스의 메모리 제약으로 불안정했음

## 예시 명세와 다른 이유

예시 명세에는 Supabase/PostgreSQL과 MySQL 방향이 함께 섞여 있었습니다.
현재 저장소는 백엔드 일관성과 Docker, EC2 배포 단순화를 위해 MySQL 방향으로 정리되어 있습니다.
