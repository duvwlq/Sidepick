# Sidepick Frontend

## 개요

`fe/`는 Sidepick 프론트엔드 애플리케이션입니다.
현재 React 19, TypeScript, Vite 기반으로 동작하며 백엔드 API와 연동되어 있습니다.

주요 화면:

- 홈 `/`
- 로그인/회원가입 `/auth`, `/signup/*`
- 탐색 `/explore`
- 경험 작성 `/create`
- 분석 결과 `/analysis-result`
- 경험 상세 `/experiences/:id`
- 마이페이지 `/mypage`

## 기술 스택

- React 19
- TypeScript
- Vite
- React Router 7

## 실행 방법

```bash
npm install
npm run dev
```

기본 개발 서버는 Vite 기본값을 따릅니다.

## 프론트 작업 규칙

- 사용자에게 보이는 한국어 문구는 절대 깨진 상태로 두지 않습니다.
- `濡쒓`, `寃쏀`, `遺꾩`, `?ㅽ`, `??` 같은 문자열은 한글 인코딩 깨짐으로 보고 바로 수정합니다.
- 화면 작업 중 이런 문자열이 발견되면 해당 기능 범위 밖이어도 함께 복구합니다.
- 검색 placeholder, 탭 라벨, CTA 버튼, 에러/토스트 문구, 빈 상태 문구는 우선 점검 대상입니다.
- 공통 컴포넌트(`SearchBar`, `Layout`, `BottomNav`, `api-client`, `error-messages`)의 문구도 항상 같이 확인합니다.

## API 연동

프론트는 백엔드 API를 직접 호출합니다.

- 기본 API base URL: `http://localhost:8081/api`
- 환경변수 우선순위: `VITE_API_BASE_URL`
- API 클라이언트: `fe/src/lib/api-client.ts`
- 주요 API 정의: `fe/src/lib/api.ts`

분석 리포트 엔드포인트 기준:

- `GET /api/reports/{experienceId}`

상세 계약은 [API_INTEGRATION_GUIDE.md](/D:/Codex_Folder/Sidepick/fe/API_INTEGRATION_GUIDE.md) 와 [02_api_contract.md](/D:/Codex_Folder/Sidepick/docs/02_api_contract.md) 를 따릅니다.

## 참고

- 로컬 백엔드 기본 주소: `http://localhost:8081`
- 로컬 AI 서버 기본 주소: `http://localhost:8001`
- 레이아웃은 모바일 우선으로 구성되어 있습니다.
