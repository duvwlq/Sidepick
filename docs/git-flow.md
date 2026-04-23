# GitHub Repo / Git Flow

## 기본 브랜치

- `main`: 배포 가능한 안정 브랜치
- `develop`: 통합 개발 브랜치

## 작업 브랜치 규칙

- `feature/<topic>`
- `fix/<topic>`
- `refactor/<topic>`
- `docs/<topic>`

예시:

- `feature/auth-login`
- `feature/mysql-schema`
- `docs/api-spec`

## 작업 흐름

1. `develop`에서 작업 브랜치 생성
2. 기능 단위 커밋
3. Pull Request 생성
4. 리뷰 후 `develop` 병합
5. 배포 시점에 `develop -> main` 병합

## 커밋 메시지 예시

- `feat: add initial mysql schema`
- `feat: add docker compose for local mysql`
- `docs: add ec2 setup guide`
- `fix: correct users table index`

## 최소 규칙

- 직접 `main` push 금지
- PR 없이 병합 금지
- 환경변수, 키 파일, 인증정보 커밋 금지
- 인프라 변경은 문서와 함께 반영

