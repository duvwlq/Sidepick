# Sidepick MVP

Sidepick은 부업 실패 경험을 구조화해 기록하고, 유사 사례 탐색과 AI 분석으로 다음 판단에 도움이 되는 기준을 주는 MVP입니다.

## 배포 링크

- 서비스: [https://side-pick.app](https://side-pick.app)
- API: [https://api.side-pick.app/api](https://api.side-pick.app/api)

## 기술 스택

- 프론트엔드: React + TypeScript + Vite
- 백엔드: Spring Boot
- AI 서버: FastAPI
- 데이터베이스: MySQL
- 인프라: 로컬 Docker Compose, 운영 Amplify + EC2 + Nginx + RDS

## 저장소 구조

- `fe/`: 프론트엔드
- `server/`: 백엔드 API
- `ai/`: AI 분석 서버 및 데이터 자산
- `infra/`: Docker Compose, nginx, mysql 초기 자산
- `docs/`: 공식 문서

## 작업 규칙

- 화면에 보이는 한국어 문구는 깨지면 안 됩니다.
- `濡쒓`, `寃쏀`, `遺꾩`, `?ㅽ`, `??` 같은 문자열은 한글 인코딩 깨짐 또는 자동번역/문자셋 오염으로 간주합니다.
- 이런 문자열을 코드, 문서, 상수, 기본 에러 메시지에서 발견하면 기능 작업과 별개로 우선 정상 한국어로 복구합니다.
- 특히 사용자에게 직접 노출되는 UI 문구, placeholder, toast, error message, 버튼 라벨은 발견 즉시 수정합니다.
- 새 작업 전에는 변경 파일 안에 깨진 한글이 없는지 같이 확인합니다.

## 실행 메모

프론트:

```powershell
cd fe
npm install
npm run dev
```

백엔드/인프라:

```powershell
cd infra
docker compose up -d --build
```

## 문서

- [문서 인덱스](/D:/Codex_Folder/Sidepick/docs/README.md)
- [배포 문서](/D:/Codex_Folder/Sidepick/docs/07_deployment.md)
- [백엔드 운영 문서](/D:/Codex_Folder/Sidepick/server/README.md)
- [운영 체크리스트](/D:/Codex_Folder/Sidepick/docs/AWS-재배포-정리-체크리스트.md)

## 참고

- 운영 기준 문서는 실제 서버 구조와 맞춰 2026-05-12에 재정리했습니다.
- `archive` 문서는 과거 참고용이며 현재 운영 기준과 다를 수 있습니다.
