# Git 작업 가이드

## 기본 브랜치

- `main`: 배포 기준 이력
- `develop`: 팀 통합 작업 브랜치

## 기능 브랜치 이름 규칙

- `feature/<topic>`
- `fix/<topic>`
- `docs/<topic>`

예시:

- `feature/setup-project`
- `feature/database-schema`
- `feature/docker-setup`

## 일일 작업 흐름

```bash
git checkout develop
git pull origin develop
git checkout -b feature/<topic>
```

작업 후에는 아래 순서로 진행합니다.

```bash
git add .
git commit -m "type: short summary"
git push -u origin feature/<topic>
```

## 커밋 메시지 규칙

- `feat: ...`
- `fix: ...`
- `docs: ...`
- `chore: ...`
- `refactor: ...`
- `test: ...`

## 팀 작업 규칙

- 항상 최신 `develop`에서 작업을 시작합니다.
- `.env`는 커밋하지 않습니다.
- 개인 IDE 설정 파일은 커밋하지 않습니다.
- 인프라와 스키마 변경 사항은 `docs/`에 함께 문서화합니다.
