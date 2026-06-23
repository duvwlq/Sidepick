# 08. Functional Specification

## Purpose

이 문서는 **발표 준비 기준으로 Sidepick의 기능 명세를 한 곳에서 관리하기 위한 중앙 문서**입니다.

기존에는 프로젝트 개요, API 계약, 화면 구조, 기능별 계약 문서가 분산되어 있었고, 이 문서는 그 내용을 발표 관점에서 다시 묶어 현재 구현 범위를 빠르게 설명할 수 있도록 정리합니다.

---

## Current Conclusion

- 현재 저장소에는 `기능명세서`라는 이름의 단일 중앙 문서는 없었습니다.
- 대신 아래 문서들이 기능 명세 역할을 나눠서 담당하고 있었습니다.
  - `docs/00_project_overview.md`: MVP 범위와 핵심 흐름
  - `docs/02_api_contract.md`: 프론트-백엔드 API 계약
  - `docs/03_frontend_structure.md`: 화면/라우트 책임
  - `docs/04_backend_structure.md`: 백엔드 도메인 책임
  - `docs/BE-37 알림 MVP 계약.md`
  - `docs/BE-40 에이전트 A 연결 계약.md`
  - `docs/BE-41 성공사례 MVP 계약.md`
  - `docs/BE-42 FAB 동작 규칙.md`

---

## Service Summary

Sidepick은 **부업 실패 경험을 기록하고, 유사 사례와 AI 분석을 통해 다음 행동 기준을 제공하는 서비스**입니다.

핵심 사용자 가치는 아래 3가지입니다.

1. 실패 경험을 구조화된 데이터로 남길 수 있다.
2. 비슷한 사례를 다시 탐색할 수 있다.
3. AI 분석과 가이드를 통해 다음 판단에 도움을 받을 수 있다.

---

## Core User Flows

### 1. 탐색 중심 흐름

1. 사용자가 홈 또는 탐색 화면에 진입합니다.
2. 사례 목록, 카테고리, 검색어를 통해 관심 사례를 찾습니다.
3. 상세 화면에서 실패 내용, AI 분석, 유사 사례를 확인합니다.

### 2. 작성 중심 흐름

1. 사용자가 로그인 후 실패 경험 작성 화면에 진입합니다.
2. 기본 정보, 세부 정보, 자유 서술, 이미지 등을 입력합니다.
3. 작성 완료 후 상세 화면에서 등록 결과와 분석 상태를 확인합니다.

### 3. 학습 중심 흐름

1. 사용자가 사례 상세에서 AI 분석 리포트를 확인합니다.
2. 유사 사례, 성공사례 비교, FAQ/가이드를 통해 추가 학습을 진행합니다.
3. 북마크, 마이페이지, 최근 조회를 통해 다시 접근합니다.

---

## Functional Scope

| 기능 영역 | 사용자 기능 | 현재 상태 | 주요 화면/경로 | 주요 API |
| --- | --- | --- | --- | --- |
| 홈 | 추천 진입, 주요 카테고리 노출 | 구현됨 | `/` | `/api/users/me/home-feed` |
| 사례 탐색 | 목록 조회, 검색, 필터 탐색 | 구현됨 | `/explore`, `/search` | `/api/experiences`, `/api/experiences/search`, `/api/categories` |
| 사례 상세 | 본문 조회, 분석 리포트 확인 | 구현됨 | `/experiences/:id` | `/api/experiences/{id}`, `/api/reports/{id}` |
| 실패 경험 작성 | 경험 등록, 이미지 업로드 | 구현됨 | `/create` | `POST /api/experiences`, `POST /api/experiences/images` |
| AI 분석 | 분석 조회, 생성, 유사 사례 확인 | 구현됨 | 상세 화면 내부 | `GET /api/reports/{id}`, `POST /api/experiences/{id}/analysis`, `GET /api/analysis/{analysisId}/matched-cases` |
| 성공사례 비교 | 연관 성공사례 비교 조회 | 구현됨 | `/experiences/:id/success-comparison` | `/api/experiences/{id}/success-cases`, `/api/success-cases/{successCaseId}`, `/api/experiences/compare` |
| FAQ / 가이드 | 카테고리형 FAQ, 작성 예시/가이드 | 구현됨 | `/faq` | `/api/guides/experiences/{experienceId}`, `/api/guides/writing-examples` |
| 인증 | 로그인, 회원가입, 이메일 인증, 소셜 로그인 | 구현됨 | `/auth`, `/signup/*` | `/api/auth/login`, `/api/auth/signup`, `/api/auth/email-verifications`, `/api/auth/oauth/*` |
| 마이페이지 | 내 작성글, 북마크, 최근 조회 | 구현됨 | `/mypage`, `/mypage/written`, `/mypage/bookmarks`, `/mypage/recent` | `/api/users/me`, `/api/users/me/experiences`, `/api/users/me/bookmarks`, `/api/users/me/recent-views` |
| 프로필 관리 | 내 정보 수정, 프로필 이미지 변경 | 구현됨 | `/mypage/profile/edit` | `PATCH /api/users/me`, `POST /api/users/me/profile-image` |
| 북마크/반응 | 북마크 추가/해제, 리액션 | 구현됨 | 상세 화면 내부 | `/api/experiences/{id}/bookmarks`, `/api/experiences/{id}/reactions` |
| 알림 | 알림 목록 조회 | 구현됨 | `/notifications` | `/api/notifications` |
| 댓글 | 댓글/답글 작성, 삭제 | 백엔드 구현 | 상세 화면 연동 여부 확인 필요 | `/api/experiences/{id}/comments`, `/api/comments/{commentId}/replies` |
| 챗봇 | 메시지 기반 보조 응답 | 백엔드 구현 | 별도 사용자 화면 확인 필요 | `/api/chatbot/message` |
| 운영 통계 | 실패 패턴, 실패 시점 통계 | 백엔드 구현 | 내부/발표 자료용 활용 가능 | `/api/stats/failure-pattern`, `/api/stats/failure-timing` |
| 운영 관리자 | 지연시간, 챗봇 운영 상태 조회 | 운영 기능 | 별도 운영 경로 | `/api/admin/latency-metrics`, `/api/admin/chatbot-ops` |

---

## Screen Specification

### Home

- 목적: 첫 진입 사용자에게 서비스 가치와 주요 탐색 경로를 보여줍니다.
- 핵심 요소:
  - 대표 카테고리 진입
  - 추천/피드 노출
  - 탐색, 작성, 로그인 이동

### Explore / Search

- 목적: 사용자가 실패 사례를 빠르게 찾도록 돕습니다.
- 핵심 요소:
  - 검색어 입력
  - 최근 검색어
  - 카테고리 필터
  - 사례 리스트

### Experience Detail

- 목적: 사례 원문과 AI 분석을 한 화면에서 보여줍니다.
- 핵심 요소:
  - 경험 본문
  - 분석 리포트 상태 분기
  - 유사 사례
  - 성공사례 비교
  - 북마크/반응/공유

### Create Wizard

- 목적: 실패 경험을 구조화된 입력으로 수집합니다.
- 핵심 요소:
  - 기본 정보 입력
  - 세부 상황 입력
  - 자유 서술
  - 이미지 업로드
  - 단계형 진행 UI

### FAQ

- 목적: 초보 사용자의 진입 장벽을 낮추는 설명형 콘텐츠를 제공합니다.
- 핵심 요소:
  - 검색
  - 태그/카테고리 필터
  - 질문-답변 리스트

### Auth / Signup

- 목적: 로그인과 회원가입 전환을 매끄럽게 처리합니다.
- 핵심 요소:
  - 이메일 회원가입
  - 이메일 인증
  - 닉네임/지역/경험/목적 단계 입력
  - 카카오/구글/네이버 OAuth

### My Page

- 목적: 사용자의 개인 활동을 다시 접근 가능한 형태로 제공합니다.
- 핵심 요소:
  - 프로필 요약
  - 내가 쓴 글
  - 북마크
  - 최근 조회
  - 프로필 수정

---

## Analysis Specification

### Analysis Status

- `READY`: 분석 결과 표시 가능
- `NOT_READY`: 분석 대기 또는 생성 중
- `ERROR`: 분석 실패

### Analysis Output

- 실패 요약
- 핵심 패턴
- 위험 요인
- 가이드 문구
- 유사 사례
- 설명 근거 데이터

### Presentation Message

발표에서는 아래 메시지로 설명하는 것이 적절합니다.

- “사용자 경험 등록에서 끝나지 않고 AI가 실패 원인과 유사 사례를 함께 정리해준다.”
- “분석 결과가 아직 없을 때도 `NOT_READY` 상태로 분리해 사용자 경험이 끊기지 않도록 설계했다.”

---

## Auth Specification

### Supported Methods

- 이메일 회원가입/로그인
- 카카오 OAuth
- 구글 OAuth
- 네이버 OAuth

### Signup Steps

1. 이메일 입력
2. 본인 정보 입력
3. 세부 정보 입력
4. 인증 코드 확인
5. 비밀번호 설정
6. 닉네임 설정
7. 지역 설정
8. 경험 수준 설정
9. 사용 목적 설정

---

## Data and Integration Boundaries

- 프론트는 백엔드 API만 호출합니다.
- 백엔드는 AI 서버 호출과 결과 저장/가공을 담당합니다.
- AI 서버는 분석 생성과 유사 사례 로직을 담당합니다.
- 운영 데이터와 데모 데이터는 분리 원칙을 유지합니다.

---

## Presentation Checklist

수요일 발표 전 이 문서를 기준으로 아래만 추가 확인하면 됩니다.

1. 실제 시연에 사용할 기능 범위를 확정했는지
2. `구현됨`과 `백엔드 구현` 항목을 발표 슬라이드와 동일하게 맞췄는지
3. 댓글/챗봇처럼 백엔드는 있으나 프론트 노출이 약한 기능을 시연 범위에 넣을지 결정했는지
4. 로그인, 작성, 상세, AI 분석, FAQ, 마이페이지까지 데모 동선이 끊기지 않는지

---

## Source Documents

- [00_project_overview.md](./00_project_overview.md)
- [02_api_contract.md](./02_api_contract.md)
- [03_frontend_structure.md](./03_frontend_structure.md)
- [04_backend_structure.md](./04_backend_structure.md)
- [05_ai_integration_contract.md](./05_ai_integration_contract.md)
- [BE-37 알림 MVP 계약.md](./BE-37%20알림%20MVP%20계약.md)
- [BE-40 에이전트 A 연결 계약.md](./BE-40%20에이전트%20A%20연결%20계약.md)
- [BE-41 성공사례 MVP 계약.md](./BE-41%20성공사례%20MVP%20계약.md)
- [BE-42 FAB 동작 규칙.md](./BE-42%20FAB%20동작%20규칙.md)
- [../fe/src/App.tsx](../fe/src/App.tsx)
