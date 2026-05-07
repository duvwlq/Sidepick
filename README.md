# Sidepick MVP

Sidepick은 사이드 프로젝트와 부업 실패 경험을 구조화해서 기록하고, 유사 사례 탐색과 AI 분석을 통해 더 나은 판단 기준을 만드는 것을 목표로 하는 MVP 프로젝트입니다.

## 현재 작업 원칙

다음 규칙을 기본으로 사용합니다.

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
- 공개 API 기준 주소: `https://api.side-pick.app/api`

## 저장소 구조

- `fe/`: 프론트엔드 애플리케이션
- `server/`: 백엔드 API
- `ai/`: AI 관련 코드와 정리 문서
- `infra/`: 로컬 DB 및 마이그레이션 설정
- `scripts/`: 개발 및 배포 보조 스크립트
- `docs/`: 프로젝트 문서와 정리 자료
- `screenshots/`: 참고용 화면 캡처와 발표 자료

현재 공식 문서 인덱스는 [docs/README.md](D:/Codex_Folder/Sidepick/docs/README.md)에서 확인할 수 있습니다.

## 백엔드 인증 상태

현재 백엔드는 아래 기능을 지원합니다.

- 이메일/비밀번호 회원가입 및 로그인
- 이메일 인증 상태 관리
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

이 저장소는 Docker 기반 Maven wrapper 명령을 사용합니다.

```powershell
cd server
../mvnw.cmd test
```

운영 환경 관련 내용은 [server/README.md](D:/Codex_Folder/Sidepick/server/README.md)에서 확인할 수 있습니다.

## 프론트 작업 대기 중 정리 항목

프론트 작업이 진행되는 동안 우선적으로 관리할 항목은 아래와 같습니다.

- 인증 및 배포 문서를 최신 상태로 유지
- OAuth 환경 변수와 키값이 Git에 들어가지 않도록 점검
- 사용자 메모나 스크린샷은 검토 전 삭제하지 않기
- 느슨한 문서를 정리할 때는 정리 목록 문서를 먼저 확인

참고 문서:

- [공식 문서 인덱스](D:/Codex_Folder/Sidepick/docs/README.md)
- [archive 정리 문서](D:/Codex_Folder/Sidepick/docs/archive/README.md)
