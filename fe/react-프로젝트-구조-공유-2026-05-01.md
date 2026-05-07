# React 프로젝트 구조 공유

작성일: 2026-05-01  
대상: 결과 페이지 작업 시작 전 프론트 구조 공유

## 1. 현재 프론트엔드 스택

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- React Router DOM v7

현재 `fe/package.json` 기준으로 MUI, Ant Design 같은 외부 UI 컴포넌트 프레임워크는 사용하지 않고 있습니다.  
공통 UI는 내부 컴포넌트를 직접 만들어 재사용하는 방식입니다.

## 2. 프론트 디렉터리 구조

프론트는 `fe` 디렉터리 아래에 있습니다.

```text
fe/
  public/
  src/
    assets/
    components/
      ai-analysis/
      auth/
      common/
      experience-write/
      home/
      layout/
    constants/
    context/
    hooks/
    lib/
    pages/
      auth/
    styles/
    App.tsx
    main.tsx
  package.json
  vite.config.ts
  tailwind.config.js
```

## 3. 폴더 역할

### `src/pages`

라우트 단위 페이지를 둡니다.

- `Home.tsx`: 메인 홈
- `Explore.tsx`: 전체 탐색
- `Create.tsx`: 실패 경험 작성
- `ExperienceDetail.tsx`: 상세 화면 진입점
- `AiAnalysisResultPage.tsx`: 레거시 URL 리다이렉트용 페이지
- `MyPage.tsx`: 마이페이지
- `pages/auth/*`: 로그인/회원가입/소셜 콜백

### `src/components`

페이지 안에서 조립하는 UI 조각들입니다.

- `layout/`: 헤더, 하단 탭바, 공통 레이아웃
- `common/`: 버튼, 카드, 검색바 등 범용 UI
- `auth/`: 인증 관련 UI
- `experience-write/`: 글쓰기 플로우 전용 UI
- `ai-analysis/`: 상세 화면 안의 분석 결과 섹션 UI
- `home/`: 홈 화면 전용 UI

### `src/lib`

API 호출과 세션 관리를 둡니다.

- `api.ts`: 백엔드 API 호출 함수와 타입 정의
- `session.ts`: 토큰, 유저 정보 localStorage 관리

### `src/hooks`

- `useExperienceWrite.ts`: 작성 단계(step)와 form 상태 관리

### `src/context`

- `AuthFlowContext.tsx`: 인증 흐름 상태 관리

### `src/constants`

- 선택지, mock 데이터 등 정적 상수

## 4. 앱 진입 구조

엔트리는 단순합니다.

1. `src/main.tsx`에서 `globals.css`를 로드
2. `src/App.tsx`를 `#root`에 마운트
3. `App.tsx`에서 라우터를 구성

구조는 아래 순서입니다.

```tsx
<BrowserRouter>
  <AuthFlowProvider>
    <Routes>...</Routes>
  </AuthFlowProvider>
</BrowserRouter>
```

## 5. 라우팅 방식

현재는 `react-router-dom`의 선언형 라우팅을 사용합니다.

```text
/                       -> Home
/auth                   -> AuthEntryPage
/login                  -> AuthEntryPage
/auth/kakao/callback    -> KakaoCallbackPage
/auth/google/callback   -> GoogleCallbackPage
/signup/email           -> SignupEmailPage
/signup/verify          -> SignupVerifyPage
/signup/password        -> SignupPasswordPage
/signup/nickname        -> SignupNicknamePage
/explore                -> Explore
/create                 -> Create
/experiences/:id        -> 단일 상세 화면
/analysis-result        -> 기존 링크 호환용 리다이렉트
/mypage                 -> MyPage
```

특징:

- 중첩 라우트 구조는 아직 사용하지 않음
- `createBrowserRouter`, loader, action 패턴은 미도입
- 페이지 이동은 대부분 `useNavigate()` 사용
- 상세 화면의 기준 URL은 이제 `/experiences/:id`
- 기존 `/analysis-result?experienceId=...`는 레거시 진입점으로만 유지

## 6. 결과 페이지와 사례 상세 페이지 관계

이 부분은 이렇게 이해하면 됩니다.

- 결과 페이지와 사례 상세 페이지를 별도 화면으로 보지 않음
- 실제 사용자 기준으로는 하나의 단일 상세 화면
- 분석 결과와 사례 상세 내용을 같은 화면에서 보여주는 구조

즉, 현재 기준 용어는 아래처럼 맞추는 것이 좋습니다.

- “상세 화면”
- “경험 상세 화면”
- “분석 결과를 포함한 사례 상세 화면”

반대로 “결과 페이지”와 “사례 상세 페이지”를 분리된 두 화면처럼 표현하면 혼선이 생깁니다.

## 7. 실제 상세 화면 기준 파일

단일 상세 화면 기준으로 보면 파일 역할은 아래와 같습니다.

- `fe/src/pages/ExperienceDetail.tsx`
  - `/experiences/:id` 라우트 진입점
- `fe/src/pages/AiAnalysisResultPage.tsx`
  - 예전 `/analysis-result` 링크를 `/experiences/:id`로 넘기는 리다이렉트 역할
- `fe/src/components/ai-analysis/AiAnalysisResult.tsx`
  - 상세 화면 본문에서 분석 결과를 렌더링하는 핵심 컴포넌트

즉, 실작업 기준으로는 `ExperienceDetail.tsx`와 `components/ai-analysis/*`를 보면 됩니다.

## 8. 공통 레이아웃 방식

공통 화면은 `src/components/layout/Layout.tsx`를 감싸서 사용합니다.

`Layout`이 담당하는 것:

- 모바일 기준 최대 폭 고정(`max-w-[375px]`)
- 상단 헤더 노출 여부
- 하단 탭바 노출 여부
- 뒤로가기, 메뉴, 우측 아이콘 처리
- 본문 상단/하단 여백 확보

대표적으로 `Home.tsx`, `Create.tsx`, `Explore.tsx`가 이 구조를 사용합니다.

상세 화면은 현재 `Layout`을 직접 쓰기보다, 헤더/하단바를 화면 안에서 커스텀하게 구성하고 있습니다.  
즉, 상세 화면은 공통 레이아웃 일부 패턴을 따르되 별도 상세 UI를 직접 조립하는 구조입니다.

## 9. 컴포넌트 사용 방식

### 외부 라이브러리

- 외부 UI 컴포넌트 라이브러리는 사용하지 않음
- `lucide-react` 의존성은 있으나, 실제 화면은 SVG asset 또는 inline SVG 사용 비중이 큼

### 내부 라이브러리처럼 쓰는 방식

사실상 `src/components`가 내부 컴포넌트 라이브러리 역할을 합니다.

분류 기준:

1. 여러 화면에서 재사용하면 `common/`
2. 헤더/탭바/프레임이면 `layout/`
3. 특정 기능 전용이면 기능 폴더 하위

예시:

- `common/SearchBar.tsx`
- `common/Card.tsx`
- `layout/Layout.tsx`
- `experience-write/*`
- `ai-analysis/*`

## 10. 스타일링 방식

스타일은 Tailwind utility class 중심입니다.

- 전역 스타일: `src/styles/globals.css`
- 폰트: Pretendard CDN import
- 각 컴포넌트 내부에서 Tailwind class 직접 작성

현재 특징:

- 모바일 시안 기준 고정 폭 레이아웃이 많음
- px 단위 수치가 직접 들어가는 편
- 별도 design token/theme 확장은 아직 크지 않음

즉, 지금은 디자인 시스템 기반보다는 컴포넌트별 직접 스타일링에 가깝습니다.

## 11. 데이터 연동 방식

API 호출은 `src/lib/api.ts`에 모아두고 있습니다.

패턴:

- `API_BASE_URL` 환경변수 사용
- 공통 `request<T>()` 함수로 fetch 래핑
- 응답 envelope(`success`, `message`, `data`) 기준 처리
- 실패 시 `ApiError`로 변환

보통 화면에서는 아래 흐름으로 사용합니다.

1. `lib/api.ts`에서 함수 import
2. `useEffect`에서 비동기 호출
3. `loading`, `error`, `data`를 state로 관리

예시:

- `Home.tsx` -> `getExperiences()`, `getMe()`
- `Create.tsx` -> `getCategories()`, `createExperience()`
- 상세 화면 -> `getExperience()`, `getReport()`, 필요 시 `createAnalysis()`

## 12. 상세 화면 데이터 흐름

상세 화면 기준 흐름은 아래입니다.

1. `/experiences/:id`로 진입
2. `id`를 기준으로 경험 상세 조회
3. 같은 `id`로 분석 리포트 조회
4. 리포트가 아직 준비되지 않았고 토큰이 있으면 `createAnalysis()` 재시도
5. 사례 본문 + 분석 결과를 같은 화면에서 section 단위로 렌더링

즉, “사례 상세를 보고 나서 결과 페이지로 또 이동”하는 구조가 아니라,  
상세 화면 한 곳에서 내용과 분석을 함께 보여주는 구조로 이해하면 됩니다.

## 13. 작업 시 맞추면 좋은 기준

1. 페이지 라우트는 `src/pages`
2. 페이지 내부 섹션은 `src/components/{기능명}`
3. 공통화 가능한 UI는 `src/components/common`
4. API 함수 추가는 `src/lib/api.ts`
5. 인증 토큰 참조는 `src/lib/session.ts`
6. 상세 화면 링크는 `/experiences/:id` 기준으로 통일

## 14. 한 줄 요약

현재 프론트는 `pages + 기능별 components + lib/api + Tailwind 직접 스타일링` 구조입니다.  
그리고 결과 페이지와 사례 상세 페이지는 분리된 두 화면이 아니라, `/experiences/:id`를 기준으로 한 하나의 상세 화면으로 정리되어 있습니다.
