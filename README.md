# Sidepick Backend Infra

현재 저장소는 백엔드 1주차 범위 중 아래 항목만 정리한 상태입니다.

1. AWS EC2 서버 생성 가이드
2. Docker 환경 설정
3. MySQL DB 스키마 초안
4. GitHub Repo / Git Flow 규칙

## 구조

- `docs/ec2-setup.md`: EC2 생성 및 서버 초기 설정
- `docs/db-schema.md`: MySQL 스키마 설계 문서
- `docs/git-flow.md`: 브랜치 전략 및 Git Flow
- `infra/docker-compose.yml`: 로컬 MySQL 실행용 Docker 설정
- `infra/mysql/init/001_init.sql`: 초기 DB 스키마 SQL

## 로컬 실행

```bash
docker compose -f infra/docker-compose.yml up -d
```

## 기본 DB 정보

- DB: `sidepick`
- User: `sidepick`
- Password: `sidepick`
- Port: `3306`
