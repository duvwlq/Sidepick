# 03. Frontend Structure

## Scope

이 문서는 현재 프론트엔드의 **화면 구조와 라우팅 책임**을 정리합니다.
루트 README가 서비스 브랜딩을 담당한다면, 이 문서는 실제 화면 구성을 빠르게 파악하기 위한 문서입니다.

---

## App Routes

| Route | 역할 |
| --- | --- |
| `/` | 홈 화면 |
| `/explore` | 사례 탐색 |
| `/faq` | FAQ / 가이드 |
| `/create` | 실패 경험 등록 |
| `/experiences/:id` | 사례 상세 + 분석 리포트 |
| `/analysis-result` | 레거시 분석 결과 진입 경로 |
| `/mypage` | 마이페이지 |
| `/auth` | 로그인 진입 |
| `/auth/kakao/callback` | 카카오 OAuth 콜백 |
| `/auth/google/callback` | 구글 OAuth 콜백 |
| `/signup/email` | 회원가입 이메일 입력 |
| `/signup/verify` | 인증 코드 확인 |
| `/signup/password` | 비밀번호 설정 |
| `/signup/nickname` | 닉네임 설정 |

---

## Screen Responsibilities

### Home

- 대표 진입 화면
- 카테고리별 추천 사례 노출
- 탐색/등록/분석 흐름으로 이동 유도

### Explore

- 키워드 및 카테고리 기반 사례 탐색
- 최근 검색어, 추천 키워드, 필터 UX 제공

### Experience Detail

- 사례 본문 조회
- AI 분석 리포트 노출
- 유사 사례 및 가이드 노출

### FAQ

- 카테고리별 문답 구조
- 검색창과 태그 필터 제공
- 부업 진입자 대상 설명형 콘텐츠 제공

### Auth Flow

- 로컬/소셜 로그인 진입
- 이메일 기반 회원가입 단계 분리
- OAuth 콜백 처리

---

## Analysis Report Flow

1. 사용자가 `/experiences/:id` 상세 화면에 진입합니다.
2. 프론트는 경험 상세 데이터를 조회합니다.
3. 이어서 `getReport()`로 분석 리포트를 조회합니다.
4. `reportStatus`에 따라 `READY / NOT_READY / ERROR` 화면 상태를 분기합니다.

현재 기준 분석 리포트 엔드포인트:
- `/api/reports/{experienceId}`

---

## Frontend Mapping Layer

프론트는 백엔드 응답을 바로 UI에 꽂지 않고, 매핑 레이어를 거쳐 화면 모델로 변환합니다.

주요 역할:
- `advice[]` → 가이드 섹션 구성
- `matchRate` → 유사도 숫자 노출
- `summary`, `keyLesson` → 카드 설명 문구 변환
- 누락 필드에 대한 안전한 fallback 제공

이 구조 덕분에 백엔드 DTO 변화가 UI 전반에 직접 번지는 것을 줄일 수 있습니다.

---

## UX Notes

- `/analysis-result`는 레거시 성격의 경로이며, 현재 주 흐름은 `/experiences/:id`입니다.
- 검색창, FAQ, 유사 사례 등 사용자 노출 문구는 공통 컴포넌트 기준으로 관리합니다.
- 브라우저 자동 번역에 대응하기 위해 `notranslate` 가드가 적용되어 있습니다.

---

## Sources

- [../fe/src/App.tsx](../fe/src/App.tsx)
- [../fe/src/pages](../fe/src/pages)
- [../fe/src/lib/api.ts](../fe/src/lib/api.ts)
- [02_api_contract.md](./02_api_contract.md)
