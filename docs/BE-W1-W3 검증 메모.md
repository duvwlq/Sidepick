# BE-W1-W3 검증 메모

기준일: 2026-06-15

## 목적

`W1`, `W2`, `W3` 작업이 현재 저장소 기준으로 어디까지 실제 반영되어 있는지 빠르게 다시 확인하기 위한 메모다.

이번 검증은 문서, 현재 코드, 통합 테스트 파일 존재 여부를 기준으로 진행했다.
실제 Docker 실행, 실환경 OAuth, PD 최종 판정은 이번 메모 범위에 포함하지 않는다.

## 판정 기준

- `확인 완료`: 코드 또는 테스트, 문서가 현재 저장소에서 직접 확인됨
- `문서 기준 완료`: 현재 저장소에서 문서 산출물은 확인되지만 런타임 검증까지는 이번에 재실행하지 않음
- `외부 검증 필요`: 실환경/OAuth/디자인 판정처럼 저장소만으로 확정하기 어려움

## W1

W1은 구현 주차라기보다 설계/명세 산출물 주차에 가깝다.

- `BE-01` 문서 기준 완료
  - [BE-01 DB 스키마 ERD.md](/D:/Codex_Folder/Sidepick/docs/BE-01%20DB%20스키마%20ERD.md)
  - [BE-01 마이그레이션 스크립트 초안.sql](/D:/Codex_Folder/Sidepick/docs/BE-01%20마이그레이션%20스크립트%20초안.sql)
- `BE-02` 문서 기준 완료
  - [BE-02 OAuth 구조 설계.md](/D:/Codex_Folder/Sidepick/docs/BE-02%20OAuth%20구조%20설계.md)
- `BE-03` 문서 기준 완료
  - [BE-03 API 명세 문서.md](/D:/Codex_Folder/Sidepick/docs/BE-03%20API%20명세%20문서.md)
  - [BE-03 Swagger 초안.yaml](/D:/Codex_Folder/Sidepick/docs/BE-03%20Swagger%20초안.yaml)
- `BE-04` 문서 기준 완료
  - [BE-04 환경 변수 명세.md](/D:/Codex_Folder/Sidepick/docs/BE-04%20환경%20변수%20명세.md)
  - [.env.example](/D:/Codex_Folder/Sidepick/.env.example)
- `BE-05` 문서 기준 완료
  - [BE-05 큐잉 인프라 설계 문서.md](/D:/Codex_Folder/Sidepick/docs/BE-05%20큐잉%20인프라%20설계%20문서.md)
- `BE-06` 문서 기준 완료
  - [BE-06 가드레일 인프라 설계 문서.md](/D:/Codex_Folder/Sidepick/docs/BE-06%20가드레일%20인프라%20설계%20문서.md)
- `BE-07` 문서 기준 완료
  - [BE-07 토큰 모니터링 명세.md](/D:/Codex_Folder/Sidepick/docs/BE-07%20토큰%20모니터링%20명세.md)

요약:

- W1은 [BE-W1 작업 완료 정리.md](/D:/Codex_Folder/Sidepick/docs/BE-W1%20작업%20완료%20정리.md)에 적힌 문서 산출물이 현재도 저장소에 존재한다.
- 다만 이번 턴에서는 W1 문서 각각의 세부 DoD를 줄 단위로 다시 대조하지는 않았다.

## W2

### W1 후속 정합화

- `BE-08` 확인 완료
  - W2 체크리스트상 완료 처리만 확인했고, 별도 티켓 문서는 보이지 않는다.
- `BE-09` 외부 검증 필요
  - [BE-W2 작업 체크리스트.md](/D:/Codex_Folder/Sidepick/docs/BE-W2%20작업%20체크리스트.md)에 테스트 DB 적용 확인 잔여로 남아 있다.
- `BE-10` 외부 검증 필요
  - 같은 문서에 샘플 응답 검증 테스트 잔여로 남아 있다.
- `BE-11` 확인 완료
  - W2 체크리스트상 완료 처리만 확인했다.
- `BE-12` 외부 검증 필요
  - `/api` prefix 정리는 현재 [application.yml](/D:/Codex_Folder/Sidepick/server/src/main/resources/application.yml:49) 과 API 컨트롤러 경로들로 확인되지만, Swagger UI 실환경 확인은 이번에 다시 실행하지 않았다.
- `BE-21` 문서 기준 완료
  - [BE-21 성공사례 이중 적재 로직 명세.md](/D:/Codex_Folder/Sidepick/docs/BE-21%20성공사례%20이중%20적재%20로직%20명세.md)

### W2 본 작업

- `BE-13` 외부 검증 필요
  - 단계형 회원가입 라우트는 [App.tsx](/D:/Codex_Folder/Sidepick/fe/src/App.tsx:52) 에서 확인된다.
  - 회원가입 API는 [AuthController.java](/D:/Codex_Folder/Sidepick/server/src/main/java/com/failforward/backend/domain/auth/api/AuthController.java:33) 에서 확인된다.
  - 다만 카카오 첫 단계 실플로우는 브라우저 재검증이 필요하다.
- `BE-14` 외부 검증 필요
  - 카카오/구글/네이버 OAuth 엔드포인트는 [AuthController.java](/D:/Codex_Folder/Sidepick/server/src/main/java/com/failforward/backend/domain/auth/api/AuthController.java:62) 부근에서 확인된다.
  - 콜백 라우트는 [App.tsx](/D:/Codex_Folder/Sidepick/fe/src/App.tsx:49) 에서 확인된다.
  - 관련 테스트 클래스도 존재한다.
    - [KakaoAuthFeatureIntegrationTest.java](/D:/Codex_Folder/Sidepick/server/src/test/java/com/failforward/backend/domain/auth/api/KakaoAuthFeatureIntegrationTest.java)
    - [GoogleAuthFeatureIntegrationTest.java](/D:/Codex_Folder/Sidepick/server/src/test/java/com/failforward/backend/domain/auth/api/GoogleAuthFeatureIntegrationTest.java)
    - [NaverAuthFeatureIntegrationTest.java](/D:/Codex_Folder/Sidepick/server/src/test/java/com/failforward/backend/domain/auth/api/NaverAuthFeatureIntegrationTest.java)
  - 다만 실환경 provider 설정과 redirect 흐름은 이번에 재확인하지 않았다.
- `BE-15` 부분 확인
  - 마이페이지 overview에서 작성글/북마크/최근 본 글 연동은 [MyPageOverview.tsx](/D:/Codex_Folder/Sidepick/fe/src/pages/MyPageOverview.tsx:446) 에서 확인된다.
  - 백엔드 활동 API는 [UserActivityController.java](/D:/Codex_Folder/Sidepick/server/src/main/java/com/failforward/backend/domain/user/api/UserActivityController.java:21) 에서 확인된다.
  - 계정 설정 DoD와 PD 최종 판정은 여전히 외부 검증이 필요하다.
- `BE-16` 확인 완료
  - 북마크 API는 [BookmarkController.java](/D:/Codex_Folder/Sidepick/server/src/main/java/com/failforward/backend/domain/bookmark/api/BookmarkController.java:19) 에서 확인된다.
  - 북마크 카운트/중복 방지는 [BookmarkApiIntegrationTest.java](/D:/Codex_Folder/Sidepick/server/src/test/java/com/failforward/backend/domain/bookmark/api/BookmarkApiIntegrationTest.java:24) 에서 확인된다.
  - FE 동기화 이벤트는 [bookmark-sync.ts](/D:/Codex_Folder/Sidepick/fe/src/lib/bookmark-sync.ts:1) 와 [MyPageOverview.tsx](/D:/Codex_Folder/Sidepick/fe/src/pages/MyPageOverview.tsx:477) 에서 확인된다.
- `BE-17` 확인 완료
  - 반응 API 테스트는 [ReactionApiIntegrationTest.java](/D:/Codex_Folder/Sidepick/server/src/test/java/com/failforward/backend/domain/reaction/api/ReactionApiIntegrationTest.java:24) 에서 확인된다.
  - `HEART`, `TEAR` 타입은 [api.ts](/D:/Codex_Folder/Sidepick/fe/src/lib/api.ts:209) 에서 FE까지 연결되어 있다.
- `BE-18` 확인 완료
  - 경험 수정 API는 [ExperienceController.java](/D:/Codex_Folder/Sidepick/server/src/main/java/com/failforward/backend/domain/experience/api/ExperienceController.java:145) 에서 `PATCH`, `PUT` 둘 다 확인된다.
- `BE-19` 부분 확인
  - `/create` 라우트는 [App.tsx](/D:/Codex_Folder/Sidepick/fe/src/App.tsx:65) 에서 확인된다.
  - 다만 `ExampleCard` 분리 여부 같은 세부 UI 구조는 이번 턴에서 재추적하지 않았다.
- `BE-20` 부분 확인
  - W2 체크리스트에는 완료로 적혀 있지만, 이번 턴에서는 마스킹 동작을 직접 재현하지 않았다.
  - 해당 항목은 문서/기존 메모 기준 완료로 본다.

## W3

- `BE-22` 확인 완료
  - W2 체크리스트에는 `failure_pattern.json`, `failure_timing.json` 연동 잔여로 적혀 있지만 현재는 반영되어 있다.
  - 설정 경로는 [application.yml](/D:/Codex_Folder/Sidepick/server/src/main/resources/application.yml:128) 에서 확인된다.
  - 통합 테스트는 [StatsApiIntegrationTest.java](/D:/Codex_Folder/Sidepick/server/src/test/java/com/failforward/backend/domain/stats/api/StatsApiIntegrationTest.java:20) 에서 JSON 기반 응답을 검증한다.
  - PM 합의 문서도 [PM-17-통계-JSON-BE-AI-합의메모.md](/D:/Codex_Folder/Sidepick/docs/PM-17-통계-JSON-BE-AI-합의메모.md:20) 에서 `BE-22 + BE-29 W3 완료`로 정리되어 있다.
- `BE-23` 확인 완료
  - API는 [UserActivityController.java](/D:/Codex_Folder/Sidepick/server/src/main/java/com/failforward/backend/domain/user/api/UserActivityController.java:36) 에서 확인된다.
  - FE 호출은 [api.ts](/D:/Codex_Folder/Sidepick/fe/src/lib/api.ts:583) 에서 확인된다.
- `BE-24` 확인 완료
  - 검색 API는 [ExperienceController.java](/D:/Codex_Folder/Sidepick/server/src/main/java/com/failforward/backend/domain/experience/api/ExperienceController.java:73) 에서 확인된다.
  - FE 검색 호출은 [api.ts](/D:/Codex_Folder/Sidepick/fe/src/lib/api.ts:454) 에서 확인된다.
- `BE-25` 확인 완료
  - 비교 API는 [ExperienceController.java](/D:/Codex_Folder/Sidepick/server/src/main/java/com/failforward/backend/domain/experience/api/ExperienceController.java:188) 에서 확인된다.
  - 비교 화면 연결은 [SuccessComparisonPage.tsx](/D:/Codex_Folder/Sidepick/fe/src/pages/SuccessComparisonPage.tsx:293) 에서 확인된다.
- `BE-26` 확인 완료
  - 홈 피드 API는 [UserActivityController.java](/D:/Codex_Folder/Sidepick/server/src/main/java/com/failforward/backend/domain/user/api/UserActivityController.java:41) 에서 확인된다.
  - FE 호출은 [api.ts](/D:/Codex_Folder/Sidepick/fe/src/lib/api.ts:589) 에서 확인된다.
- `BE-27` 확인 완료
  - 엔드포인트는 [AgentAController.java](/D:/Codex_Folder/Sidepick/server/src/main/java/com/failforward/backend/domain/agenta/api/AgentAController.java:18) 에서 확인된다.
  - `200/400/401/429` 테스트는 [AgentAApiIntegrationTest.java](/D:/Codex_Folder/Sidepick/server/src/test/java/com/failforward/backend/domain/agenta/api/AgentAApiIntegrationTest.java:24) 에서 확인된다.
- `BE-28` 부분 확인
  - 운영 체크리스트 문서는 [BE-28 FAISS 배치 업데이트 계획 및 운영 체크리스트.md](/D:/Codex_Folder/Sidepick/docs/BE-28%20FAISS%20배치%20업데이트%20계획%20및%20운영%20체크리스트.md) 에 존재한다.
  - 다만 “인덱스 재생성 성공” 자체를 이번 턴에서 재실행해 확인하지는 않았다.
- `BE-29` 확인 완료
  - 통계 API 호출 함수는 [api.ts](/D:/Codex_Folder/Sidepick/fe/src/lib/api.ts:614) 에서 확인된다.
  - PM 합의 문서상 W3 완료 회신도 [PM-17-통계-JSON-BE-AI-합의메모.md](/D:/Codex_Folder/Sidepick/docs/PM-17-통계-JSON-BE-AI-합의메모.md:20) 에 남아 있다.

## 결론

- `W1`: 문서 산출물 주차로서 저장소 기준 확인됨
- `W2`: 대부분 코드 반영 확인됨, 다만 `BE-13`, `BE-14`, `BE-15`는 실환경/PD 검증이 남아 있는 표현이 지금도 타당함
- `W3`: 대부분 확인 가능하며, 특히 `BE-22`는 체크리스트보다 더 진행되어 현재는 완료로 보는 편이 맞다

## 이번 턴에서 다시 실행하지 않은 것

- OAuth 실환경 로그인 플로우
- Docker 기반 통합 테스트 전체 실행
- FE 브라우저 실플로우
- FAISS 인덱스 재생성/운영 로그 재현

## 2026-06-15 실행 검증 결과

### 백엔드 테스트 재실행

- Docker Maven 컨테이너에서 아래 테스트 묶음을 실제 재실행했다.
  - `StatsApiIntegrationTest`
  - `CategoryApiIntegrationTest`
  - `AuthApiIntegrationTest`
  - `BookmarkApiIntegrationTest`
  - `ReactionApiIntegrationTest`
  - `UserApiIntegrationTest`
  - `AgentAApiIntegrationTest`
- 결과:
  - 총 `29`개 테스트 통과
  - 실패 `0`, 에러 `0`

### BE-12 Swagger UI

- `http://127.0.0.1:8081/swagger-ui/index.html` 실제 접속 확인
- 페이지 제목 `Swagger UI` 확인
- `Auth`, `Experiences` 섹션 노출 확인

### BE-13 회원가입

- 백엔드 실제 API 기준 회원가입 완료 확인
  - 이메일 인증 코드 발급
  - 인증 코드 확인
  - `POST /api/auth/signup` 성공
- 프론트 단계 화면 검증:
  - 기존 하네스 `fe/scripts/harness/signup-smoke.mjs` 실행
  - 결과: `signup/email -> signup/identity -> signup/identity/details` 까지는 진행
  - `signup/verify` 전환 검증은 실패
  - 따라서 현재 기준으로는 백엔드 가입 API는 정상이나, 프론트 단계 전환 하네스 또는 화면 흐름에는 추가 점검이 필요하다

### BE-14 OAuth

- 프론트 로그인 화면에서 카카오/네이버/구글 버튼 실노출 확인
- 콜백 라우트와 OAuth 엔드포인트는 코드상 존재 확인
- 다만 실제 provider 로그인은 이번 검증 범위에서 제외
  - 외부 자격증명과 redirect 환경이 필요

### BE-15 마이페이지

- 실제 가입 계정과 세션으로 마이페이지 화면 확인
- API로 경험 글 1건 생성 후 같은 계정으로 북마크 1건 생성
- 마이페이지에서 아래 항목 실노출 확인
  - `작성한 글`
  - `북마크`
  - `최근 본 글`
  - 생성한 글 제목 표시
- 확인 당시 카운트
  - 작성한 글 `1`
  - 북마크 `1`
  - 최근 본 글 `0`

## 실행 기준 결론

- `BE-09`, `BE-10`: 관련 검증 테스트 묶음 통과
- `BE-12`: Swagger UI 실제 접속 확인
- `BE-13`: 백엔드 가입 API는 통과, 프론트 단계 전환은 추가 점검 필요
- `BE-14`: 진입 구조는 확인, 실 OAuth 로그인 자체는 미검증
- `BE-15`: 마이페이지 활동 섹션은 실제 화면 기준 확인
