# 작업 요약

## 범위

이 문서는 현재까지 진행된 FailForward 백엔드 작업을 정리한 문서입니다.
현재 저장소는 Spring Boot, Docker Compose, AWS EC2, MySQL 기반 백엔드 구조로 정리되어 있습니다.

## 완료한 작업

### 저장소 및 협업 구조

- GitHub 저장소 생성 및 초기 설정 완료
- 팀 작업 기준 브랜치를 `develop`으로 통일
- `server`, `infra`, `docs`, `scripts` 중심으로 프로젝트 구조 정리

### 백엔드 초기 구성

- Spring Boot 3.2와 Java 17 기준 백엔드 부트스트랩 구성
- MySQL 및 Docker 프로필 기준 애플리케이션 설정 정리
- Swagger UI 및 헬스 체크 엔드포인트 노출

### 데이터베이스

- 기획 문서를 바탕으로 초기 MySQL 스키마 설계
- `infra/mysql/init/001_init.sql` 초기 SQL 작성
- 주요 테이블 구조를 JPA 엔티티에 반영

### API 골격 구현

- 공통 API 응답 및 예외 처리 클래스 추가
- 아래 도메인에 대한 컨트롤러, 서비스, 리포지토리, DTO 골격 추가
  - 인증
  - 사용자
  - 카테고리
  - 실패 경험
  - AI 분석
  - 유사 사례 비교
  - 의사결정 기록
  - 상호작용 기록
  - 댓글
- 현재 구현 상태에 맞게 API 구조 문서 갱신

### 로컬 실행 환경

- 백엔드와 MySQL을 함께 띄우는 Docker Compose 구성 완료
- 로컬 실행 및 종료 보조 스크립트 추가
- 로컬에 Maven이 없어도 빌드할 수 있도록 Docker 기반 Maven wrapper 추가

## 검증 현황

### 로컬 검증

- 로컬 Docker 실행 확인 완료
- 백엔드 컨테이너 기동 확인 완료
- MySQL 컨테이너 기동 확인 완료
- Swagger UI `http://localhost:8081/swagger-ui.html` 확인 완료
- 헬스 체크 `http://localhost:8081/api/health` 확인 완료
- `.\mvnw.cmd -DskipTests package` 빌드 및 패키징 성공 확인 완료

### EC2 검증

- EC2 인스턴스 생성 및 기본 환경 설정 시도 완료
- Docker 기반 배포 실행 시도 완료
- 컨테이너 시작 로그까지는 확인 완료
- 다만 저사양 무료 인스턴스에서는 메모리 제약으로 외부 API 최종 검증이 불안정했음

## 현재 결정 사항

- 데이터베이스는 MySQL 방향으로 확정
- Supabase는 현재 백엔드 범위에서 사용하지 않음
- 배포 대상은 AWS EC2 + Docker 유지
- 인증과 AI 실제 운영 로직은 다음 단계에서 구현 예정

## 제출용 리소스

1. GitHub 저장소
   - `https://github.com/duvwlq/Sidepick`
2. EC2 접속 정보
   - 설정 과정에서 사용한 Elastic IP: `13.209.95.216`
3. 데이터베이스 방향
   - Docker Compose 기반 MySQL 8.4
4. API 구조 문서
   - `docs/api-structure.md`
5. 환경 설정 문서
   - `README.md`

## 다음 작업

- Spring Security와 JWT 기반 인증 구현
- 컨트롤러를 실제 도메인 로직과 영속성 처리로 연결
- 프론트엔드 작업 수령 후 API 연동 범위 조정
- EC2 배포는 더 가벼운 실행 전략 또는 상위 인스턴스 타입 기준으로 재검토
