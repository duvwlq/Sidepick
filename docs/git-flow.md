# Git Flow 설정

## Repository 생성

- Repository Name: `failforward-backend`
- Description: `부업 실패 경험 공유 플랫폼 - Backend API Server`
- Visibility: `Private`

## 브랜치 전략

- `main`: 배포 브랜치
- `develop`: 통합 개발 브랜치
- `feature/<topic>`: 기능 개발
- `fix/<topic>`: 버그 수정
- `docs/<topic>`: 문서 작업

## 초기 브랜치 생성 예시

```bash
git checkout -b develop
git checkout -b feature/setup-project
git checkout -b feature/database-schema
git checkout -b feature/docker-setup
```

## 운영 원칙

- `main` 직접 push 금지
- Pull Request 없이 병합 금지
- `.env`, 키 파일, 비밀번호 커밋 금지
- 스키마 변경 시 SQL과 문서를 같이 수정

