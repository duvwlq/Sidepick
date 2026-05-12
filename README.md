# Sidepick MVP

Sidepick은 사이드 프로젝트와 부업 실패 경험을 구조화해서 기록하고, 유사 사례 탐색과 AI 분석을 통해 더 나은 판단 기준을 만드는 것을 목표로 하는 MVP 프로젝트입니다.

## 배포 링크

- 서비스: `https://side-pick.app`
- API: `https://api.side-pick.app/api`

## 현재 작업 원칙

- `main` 브랜치에는 직접 작업하거나 직접 push하지 않습니다.
- 모든 작업은 별도 브랜치에서 진행한 뒤 병합합니다.
- 문서와 커밋 메시지는 한국어 기준으로 작성합니다.
- 환경 변수, OAuth 키, 배포용 민감 정보는 Git에 올리지 않습니다.

## 브랜치 안내

현재 사용하는 주요 브랜치 용도는 아래와 같습니다.

- `main`
  - 기본 기준 브랜치
  - 직접 개발하거나 직접 push하지 않는 브랜치
- `main-backup-20260423`
  - 현재 `main` 상태를 백업해 둔 브랜치
- `Sidepick-merge-branch`
  - 프론트, 백엔드, AI 작업을 순차적으로 통합해 배포 기준으로 맞추는 브랜치
- `feature/backend`
  - 백엔드 인증, OAuth, 경험 등록, API 관련 작업을 진행하는 브랜치
- `feature/ai`
  - AI 모델, 데이터, 분석 로직, AI 관련 문서 작업을 진행하는 브랜치
- `feature/fe-setup`
  - 프론트엔드 세팅 및 화면 작업을 진행하는 브랜치

주의:

- `main`에 바로 push하지 말고, 작업 목적에 맞는 브랜치에서 작업한 뒤 `Sidepick-merge-branch` 또는 팀에서 정한 대상 브랜치로 병합합니다.
- AI 작업도 `main`에서 직접 하지 말고 `feature/ai`에서 진행한 뒤 통합 브랜치로 병합합니다.
- 백엔드 작업도 `main`에서 직접 하지 말고 `feature/backend`에서 진행한 뒤 통합 브랜치로 병합합니다.

## 기술 스택

- 프론트엔드: `fe/`의 Vite + React
- 백엔드: `server/`의 Spring Boot
- 데이터베이스: MySQL
- 인프라: 로컬 Docker Compose, 운영 EC2 + Nginx

## 저장소 구조

- `fe/`: 프론트엔드 애플리케이션
- `server/`: 백엔드 API
- `ai/`: AI 관련 코드와 정리 문서
- `infra/`: 로컬 DB 및 마이그레이션 설정
- `scripts/`: 개발 및 배포 보조 스크립트
- `docs/`: 프로젝트 문서와 정리 자료
- `screenshots/`: 참고용 화면 캡처와 발표 자료

공식 문서 인덱스는 [docs/README.md](D:/Codex_Folder/Sidepick/docs/README.md)에서 확인할 수 있습니다.

## 주요 기능 상태

현재 기준으로 아래 기능이 포함되어 있습니다.

- 실패 경험 작성 및 탐색
- AI 분석 결과 조회 및 유사 사례 확인
- 이메일/비밀번호 회원가입 및 로그인
- 카카오 OAuth 로그인
- 구글 OAuth 로그인
- 이메일 미인증 로컬 계정의 쓰기 기능 제한

관련 문서:

- [백엔드 README](D:/Codex_Folder/Sidepick/server/README.md)
- [인증 흐름 문서](D:/Codex_Folder/Sidepick/server/AUTH_FLOW_MVP.md)
- [공식 문서 인덱스](D:/Codex_Folder/Sidepick/docs/README.md)

## 로컬 프론트 실행

```powershell
cd fe
npm install
npm run dev
```

주요 환경 변수:

```env
VITE_API_BASE_URL=https://api.side-pick.app/api
VITE_KAKAO_CLIENT_ID=<카카오 REST API 키>
```

## 로컬 백엔드 실행

```powershell
cd server
../mvnw.cmd test
```

운영 환경 관련 내용은 [server/README.md](D:/Codex_Folder/Sidepick/server/README.md)에서 확인할 수 있습니다.

## 참고 문서

- [공식 문서 인덱스](D:/Codex_Folder/Sidepick/docs/README.md)
- [배포 문서](D:/Codex_Folder/Sidepick/docs/07_deployment.md)
- [시연 시나리오 문서](D:/Codex_Folder/Sidepick/docs/06_demo_seed_and_scenario.md)
- [archive 정리 문서](D:/Codex_Folder/Sidepick/docs/archive/README.md)
