# BE-03 API 명세 문서

## 전달 산출물

- API 명세 문서
- Swagger 초안: [BE-03 Swagger 초안](./BE-03%20Swagger%20초안.yaml)

## 최종 결정 요약

1. 이 문서는 현재 구현 API와 고도화 목표 API를 함께 관리하는 SSOT로 사용한다.
2. 현재 구현 API는 그대로 표시하고, 신규 고도화 API는 `목표 추가`로 분리한다.
3. 경험 수정 메서드는 현재 코드 기준으로 `PUT`이 아니라 `PATCH`를 기준으로 쓴다.
4. 에이전트 C API는 `chat`, `quota`, `stream` 기준으로 잡는다.
5. AI/PD/FE가 바로 참고할 수 있도록 요청/응답 초안을 함께 둔다.
6. Swagger 기준 공유를 위해 OpenAPI 3 초안 YAML을 별도 산출물로 둔다.
7. AI-02 데이터 항목 명세를 반영해 통계/그래프 외부 API는 `/api/stats/...` 기준으로 정리한다.

## 공유 대상별 우선 확인 영역

### AI

- 에이전트 A 요청/응답
- 에이전트 C 요청/응답
- 통계 응답 구조

### PD

- 회원가입 / 마이페이지 응답 구조
- 경험 / 성공사례 / 알림 응답 구조
- 에이전트 A 질문 카드 구조

### FE / BE

- 현재 구현 API와 목표 API 차이
- 인증 필요 여부
- 응답 래퍼와 필드 네이밍

## 팀장 확인 필요 항목

1. 성공사례 등록 API를 일반 API로 둘지, 관리자성 API로 제한할지
2. 에이전트 C SSE를 별도 stream endpoint로 둘지, 단일 endpoint streaming으로 단순화할지
3. 4주차 구현 시 실제 LLM 호출 주체를 `server`가 아니라 `ai-server`로 고정할지
4. 통계 API의 `category` 입력은 slug(`commerce`, `content-sns`, `digital-product`, `platform-labor`, `talent`, `investment`, `offline`)로 고정한다.

## 목적

고도화 범위 전체의 API를 한 문서에서 관리한다.

이 문서는 두 레이어를 함께 다룬다.

1. 현재 구현된 API
2. 2~5주차까지 추가할 목표 API

문서 목적은 AI, PD, FE, BE가 같은 요청/응답 기준을 보도록 하는 것이다.

## 공통 규칙

- Base path: `/api`
- 인증 방식: `Authorization: Bearer <accessToken>`
- 시간 저장: UTC
- 사용자 노출 시간: KST
- 모든 응답은 기존 `ApiResponse` 래퍼 기준
- 응답 래퍼:

```json
{
  "success": true,
  "message": "ok",
  "data": {}
}
```

## 1. 인증 / 회원

### 현재 구현

| Method | Path | 설명 |
| --- | --- | --- |
| `POST` | `/auth/register` | 회원가입 |
| `POST` | `/auth/signup` | 회원가입 alias |
| `POST` | `/auth/login` | 로그인 |
| `POST` | `/auth/email-verifications` | 이메일 인증 코드 발급 |
| `POST` | `/auth/email-verifications/confirm` | 이메일 인증 코드 확인 |
| `POST` | `/auth/oauth/kakao` | 카카오 로그인 |
| `POST` | `/auth/oauth/google` | 구글 로그인 |
| `GET` | `/users/me` | 내 정보 조회 |
| `PATCH` | `/users/me` | 내 정보 수정 |

### 목표 추가

| Method | Path | 설명 |
| --- | --- | --- |
| `POST` | `/auth/oauth/naver` | 네이버 로그인 |
| `GET` | `/auth/providers` | 활성화된 소셜 로그인 목록 |
| `PATCH` | `/users/me/password` | 비밀번호 변경 |
| `GET` | `/users/me/experiences` | 내 글 목록 |
| `GET` | `/users/me/analysis-history` | 내 AI 분석 히스토리 |

### 회원가입 요청 초안

```json
{
  "email": "user@example.com",
  "password": "password123!",
  "nickname": "sidepicker",
  "fullName": "홍길동",
  "birthDate": "1998-03-01",
  "gender": "FEMALE",
  "region": "SEOUL",
  "signupPurpose": "LEARN_FAILURE_CASES",
  "sideHustleExperienceStatus": "PLANNING",
  "interestCategoryIds": [1, 2]
}
```

### 내 정보 응답 초안

```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "nickname": "sidepicker",
    "fullName": "홍길동",
    "birthDate": "1998-03-01",
    "gender": "FEMALE",
    "region": "SEOUL",
    "signupPurpose": "LEARN_FAILURE_CASES",
    "sideHustleExperienceStatus": "PLANNING",
    "profileImage": "https://cdn.side-pick.app/profile/1.jpg",
    "authProvider": "KAKAO",
    "emailVerified": true,
    "profileCompleted": true,
    "interestCategories": [
      { "id": 1, "name": "온라인 판매" }
    ]
  }
}
```

## 2. 경험 / 사례

### 현재 구현

| Method | Path | 설명 |
| --- | --- | --- |
| `GET` | `/experiences` | 경험 목록 조회 |
| `POST` | `/experiences` | 경험 작성 |
| `GET` | `/experiences/{experienceId}` | 경험 상세 조회 |
| `PATCH` | `/experiences/{experienceId}` | 경험 수정 |
| `DELETE` | `/experiences/{experienceId}` | 경험 삭제 |
| `GET` | `/experiences/{experienceId}/similar` | 유사 경험 조회 |
| `POST` | `/experiences/compare` | 경험 비교 |

### 목표 추가

| Method | Path | 설명 |
| --- | --- | --- |
| `GET` | `/experiences` | `q`, `categoryId`, 정렬/필터 확장 기반 사례 검색 |
| `POST` | `/experiences/{experienceId}/images` | 경험 사진 업로드 |
| `DELETE` | `/experiences/{experienceId}/images/{imageId}` | 경험 사진 삭제 |
| `GET` | `/success-cases` | 성공사례 목록 |
| `GET` | `/success-cases/{successCaseId}` | 성공사례 상세 |
| `POST` | `/success-cases` | 성공사례 저장/등록 |

메모:

- 사례 검색은 별도 `/experiences/search`를 만들지 않고 기존 `GET /experiences` 필터 확장으로 통일한다.

### 경험 작성 요청 초안

```json
{
  "title": "스마트스토어 도전 실패담",
  "content": "초반에 감으로 상품을 골랐어요.",
  "categoryId": 1,
  "businessType": "스마트스토어",
  "investmentAmount": 300000,
  "durationMonths": 3,
  "weeklyHours": 12,
  "averageDailyHours": "2h",
  "isConcurrentWithMainJob": true,
  "monthlyRevenue": 50000,
  "failureReason": "시장 조사 부족",
  "failureReasons": ["시장 조사 부족", "광고 전략 부족"],
  "difficulties": ["유입 부족", "재고 부담"],
  "difficultyEtc": null,
  "difficultyExtra": null,
  "targetMarket": "20대 여성",
  "marketingChannels": ["인스타그램"],
  "lessonsLearned": "수요 검증이 먼저였다.",
  "wouldRetry": true,
  "imageIds": [101, 102]
}
```

## 3. 분석 / 통계 / 히스토리

### 현재 구현

| Method | Path | 설명 |
| --- | --- | --- |
| `GET` | `/reports/{experienceId}` | 리포트 조회 |
| `GET` | `/experiences/{experienceId}/analysis` | 분석 조회 |
| `POST` | `/experiences/{experienceId}/analysis` | 분석 생성 |
| `GET` | `/analysis/{analysisId}/matched-cases` | 연결 사례 조회 |

### 목표 추가

| Method | Path | 설명 |
| --- | --- | --- |
| `GET` | `/stats/failure-pattern?caseId={userCaseId}` | 개인 실패패턴 그래프 |
| `GET` | `/stats/failure-timeline?category={category}` | 실패 시점 분포 |
| `GET` | `/stats/category-stats?category={category}` | 업종별 통계 + 실패/성공 요인 |
| `GET` | `/stats/all-categories` | 7개 카테고리 통계 요약 |
| `GET` | `/users/me/analysis-history` | 내 분석 결과 히스토리 |
| `GET` | `/reports/{experienceId}/success-comparison` | 실패→성공 비교 데이터 |

메모:

- 내 분석 히스토리 API는 `GET /users/me/analysis-history`로 고정한다.

메모:

- AI-02 기준으로 통계/그래프 외부 API는 `/api/stats/...` 네임스페이스로 통일한다.
- 내부 구현에서 `categoryId`를 쓰더라도 외부 계약은 `category` query 기준으로 둔다.
- `category` query 값은 한글명이 아니라 slug(`commerce`, `content-sns`, `digital-product`, `platform-labor`, `talent`, `investment`, `offline`)로 고정한다.

### 업종별 통계 응답 초안

```json
{
  "category": "온라인 판매·이커머스",
  "totalCases": 132,
  "failureRate": 73.0,
  "successRate": 27.0,
  "failureTop3": [
    { "label": "시장 조사 부족", "count": 48, "ratio": 0.36 },
    { "label": "광고 전략 부족", "count": 31, "ratio": 0.23 },
    { "label": "재고 운영 미숙", "count": 17, "ratio": 0.13 }
  ],
  "successTop3": [
    { "label": "타깃 분석", "count": 21, "ratio": 0.31 },
    { "label": "꾸준한 업로드", "count": 18, "ratio": 0.27 },
    { "label": "광고 예산 관리", "count": 12, "ratio": 0.18 }
  ],
  "averageInvestment": 500000,
  "averageDuration": 4.2,
  "dropoffDistribution": [
    { "month": 1, "ratio": 0.12 },
    { "month": 2, "ratio": 0.28 },
    { "month": 3, "ratio": 0.41 },
    { "month": 4, "ratio": 0.19 }
  ]
}
```

### 실패패턴 그래프 응답 초안

```json
{
  "userCaseId": "case_142",
  "userFailurePattern": "마케팅 부족",
  "userCategory": "콘텐츠·SNS",
  "similarFailureCount": 42,
  "totalCasesInCategory": 100,
  "similarityPercentage": 42.0,
  "comparisonText": "나와 같은 실수를 한 사람 42%",
  "top3Patterns": [
    { "rank": 1, "pattern": "마케팅 부족", "percentage": 42.0, "isUserPattern": true },
    { "rank": 2, "pattern": "수익 구조 이해 부족", "percentage": 27.0, "isUserPattern": false },
    { "rank": 3, "pattern": "시간 관리", "percentage": 19.0, "isUserPattern": false }
  ]
}
```

## 4. 댓글 / 반응 / 북마크 / 알림

### 현재 구현

| Method | Path | 설명 |
| --- | --- | --- |
| `POST` | `/experiences/{experienceId}/comments` | 댓글 작성 |
| `POST` | `/comments/{commentId}/replies` | 답글 작성 |
| `PATCH` | `/comments/{commentId}` | 댓글 수정 |
| `DELETE` | `/comments/{commentId}` | 댓글 삭제 |
| `POST` | `/experiences/{experienceId}/interactions` | 상호작용 기록 placeholder |

### 목표 추가

| Method | Path | 설명 |
| --- | --- | --- |
| `POST` | `/experiences/{experienceId}/bookmarks` | 북마크 저장 |
| `DELETE` | `/experiences/{experienceId}/bookmarks` | 북마크 해제 |
| `POST` | `/experiences/{experienceId}/reactions` | 공감/좋아요 |
| `DELETE` | `/experiences/{experienceId}/reactions/{reactionType}` | 반응 취소 |
| `GET` | `/users/me/bookmarks` | 북마크 목록 |
| `GET` | `/notifications` | 알림 목록 |
| `PATCH` | `/notifications/{notificationId}/read` | 알림 읽음 처리 |

### 반응 요청 초안

```json
{
  "reactionType": "EMPATHY"
}
```

### 알림 응답 초안

```json
{
  "items": [
    {
      "id": 1,
      "type": "COMMENT_CREATED",
      "message": "내 글에 댓글이 달렸어요.",
      "isRead": false,
      "targetType": "EXPERIENCE",
      "targetId": 45,
      "createdAt": "2026-05-21T12:30:00Z"
    }
  ]
}
```

## 5. AI 에이전트

### 목표 추가

| Method | Path | 설명 |
| --- | --- | --- |
| `POST` | `/agents/a/questions` | 에이전트 A 질문 생성 |
| `POST` | `/agents/a/refine` | 에이전트 A 보완 입력 반영 |
| `POST` | `/agents/pre-start-warning` | 부업 시작 전 실패 조심 안내 |
| `POST` | `/agents/c/chat` | 에이전트 C 단일턴 상담 |
| `GET` | `/agents/c/stream/{chatId}` | SSE 스트리밍 채널 |
| `GET` | `/agents/c/quota` | 오늘 사용량/한도 조회 |

메모:

- PM 문서 기준 Tool은 `search_cases`, `query_stats` 2개로 고정
- 라우팅은 `길이 < 30자 우선 -> 키워드 -> 기본 Plan B` 규칙을 전제로 함

### 에이전트 A 요청 초안

```json
{
  "draftTitle": "스마트스토어 후기",
  "draftContent": "광고를 돌렸는데 팔리지 않았어요.",
  "categoryId": 1
}
```

### 에이전트 A 응답 초안

```json
{
  "questions": [
    {
      "id": "q1",
      "label": "타깃 고객",
      "question": "주요 고객층을 어떻게 생각하고 계셨나요?",
      "required": true
    }
  ]
}
```

### 에이전트 C 요청 초안

```json
{
  "question": "스마트스토어를 지금 시작해도 괜찮을까요?",
  "categoryHint": "commerce",
  "experienceId": 45
}
```

### 에이전트 C 응답 초안

```json
{
  "routeType": "REACT",
  "answer": "현재 사례 기준으로는 수요 검증과 광고 예산 관리가 핵심이에요.",
  "citations": ["case_42", "case_77"],
  "usedTools": ["search_cases", "query_stats"],
  "iterations": 3,
  "latencyMs": 8420,
  "tokenUsage": {
    "todayUsed": 3200,
    "todayLimit": 10000
  },
  "validation": {
    "citationChecked": true,
    "numericEvidenceChecked": true,
    "policyDocUsed": false
  },
  "fallbackReason": null
}
```

메모:

- `ai-server`는 `routeType`, `usedTools`, `iterations`, `latencyMs`, `fallbackReason`, `tokenUsage`를 함께 반환해야 한다.
- 그래야 `server`가 `user_token_usage`, `llm_request_logs`를 손실 없이 저장할 수 있다.

### 실패 조심 안내 응답 초안

```json
{
  "userInputKeywords": ["유튜브", "1주일 1시간", "썸네일 미신경"],
  "missingSuccessFactors": [
    "꾸준한 업로드 (성공 사례 평균: 주 3회)",
    "타깃 분석",
    "썸네일 신경"
  ],
  "similarFailureCases": [
    { "caseId": "case_042", "summary": "...", "category": "콘텐츠·SNS" },
    { "caseId": "case_077", "summary": "...", "category": "콘텐츠·SNS" },
    { "caseId": "case_108", "summary": "...", "category": "콘텐츠·SNS" }
  ],
  "warningLevel": "high",
  "warningText": "비슷한 조건으로 시도한 분들 중 73%가 어려움을 겪었어요. 시작 전 한 번 더 확인해보시는 것도 좋을 것 같아요."
}
```

## 6. 가이드 / 개인화 / 의사결정

### 현재 구현

| Method | Path | 설명 |
| --- | --- | --- |
| `POST` | `/decisions` | 의사결정 기록 |
| `GET` | `/categories` | 카테고리 목록 |

### 목표 추가

| Method | Path | 설명 |
| --- | --- | --- |
| `GET` | `/guides` | 부업 가이드 목록 |
| `GET` | `/guides/{categoryId}` | 업종별 가이드 상세 |
| `GET` | `/guides/search?q={query}&category={category}&sort={sort}` | 부업 가이드 검색 |
| `GET` | `/guides/categories` | 부업 가이드 카테고리 목록 |
| `GET` | `/users/me/home-feed` | 관심분야 기반 개인화 홈 |

## API 우선순위

### P0

- 회원 확장
- OAuth provider 확장
- 에이전트 C quota 관련 필드
- 토큰/비용 정책 노출값

### P1

- 북마크
- 반응
- 알림
- 통계
- 히스토리

### P2

- 성공사례 저장용 관리자성 API
- 세부 운영자 대시보드 API

## 전달 메모

- 이 문서는 “현재 코드”와 “고도화 목표”를 섞지 않기 위해 섹션을 분리했다.
- 히스토리 API는 `GET /users/me/analysis-history`, 사례 검색은 `GET /experiences` 필터 확장으로 단일화했다.
- 개인화 홈 API는 `GET /users/me/home-feed`를 기준으로 유지한다.
- 에이전트 C는 `server -> ai-server` 호출 구조를 전제로 API를 정리했다.
- 통계/그래프 외부 API는 AI-02 기준으로 `/api/stats/...` 네임스페이스를 사용한다.
- 통계/그래프/가이드 검색의 `category` 입력은 `CategoryMapper` 기준 slug로 통일한다.
- FAISS 수동 재동기화용 관리자 endpoint 초안은 공용 API가 아니라 운영용 설계 문서(`BE-28`)에서 별도로 관리한다.
- Swagger 자동화 이전 단계로, 현재는 `BE-03 Swagger 초안.yaml`을 기준 초안으로 둔다.

## 작업 완료 현황

- [x] 회원/마이페이지 API 목록
- [x] 사례 검색·조회·등록·수정 API
- [x] 통계 API
- [x] AI 분석·에이전트 API
- [x] 북마크/좋아요/댓글 API
- [x] 알림 API
- [x] Request/Response 포맷 초안 (JSON)
- [x] API 명세 문서 작성
