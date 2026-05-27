# BE-W2 작업 체크리스트

## 목적

2주차 백엔드/프론트 작업을 우선순위 기준으로 정리하고, 현재 코드 반영 상태와 남은 해야 할 일을 한 문서에서 바로 확인하기 위한 체크리스트입니다.

기준일: 2026-05-27

## 사용 규칙

- 작업 시작 시 상태를 `진행중`으로 변경
- 작업 완료 시 상태를 `완료`로 변경
- 산출물 파일명은 가능하면 `번호 + 산출물명` 형태로 저장
- 완료 후 `작업 완료` 섹션에 작업물 링크와 간단 요약을 바로 남기기
- DoD 체크가 끝난 항목만 팀장 확인 요청하기

## 현재 상태 요약

### W1 후속 정합화

- `BE-08` 코드/문서 반영 완료로 보임
- `BE-09` 마이그레이션 파일 추가 완료, 실제 row 수 검증만 재확인 필요
- `BE-10` 문서 반영 흔적은 있으나 가드레일 실제 코드/테스트 확인 필요
- `BE-11` `CategoryMapper` 및 테스트 파일 존재
- `BE-12` `/api` prefix 관련 테스트 존재, Swagger UI 확인만 남음
- `BE-21` 명세 문서 작성 완료

### W2 본 작업

- `BE-13` 회원가입 FE 플로우와 기본 API는 있음, 상세 7개 필드 확장 전
- `BE-14` 카카오/구글은 FE+BE 일부 구현, 네이버는 아직 미완료
- `BE-15` 마이페이지 기본 화면 존재, 상세 기능 미완료
- `BE-16` `BE-20` 관련 백엔드 구현 흔적은 아직 부족

## 우선순위 실행 순서

1. `BE-13` 회원가입 상세항목
2. `BE-14` 소셜 로그인 3종
3. `BE-15` 마이페이지
4. `BE-20` PII 마스킹
5. `BE-16` 북마크/저장
6. `BE-17` 공감/반응
7. `BE-18` 내 글 수정
8. `BE-19` 가이드형 글쓰기 FE

## W1 후속 체크리스트

### BE-08 AGENT_C_PROMPT_PATH 환경 변수 추가

- 상태: `완료 후보`
- 산출물:
  - [.env.example](/C:/Sidepick/.env.example)
  - [BE-04 환경 변수 명세.md](/C:/Sidepick/docs/BE-04%20환경%20변수%20명세.md)
- 체크:
  - [x] `.env.example`에 `AGENT_C_PROMPT_PATH=ai/prompts/AI-04-agent_c_v1.md` 추가
  - [x] 환경 변수 문서 반영
  - [x] `PromptLoader`에서 변수 로드 확인
- 확인 파일:
  - [PromptLoader.java](/C:/Sidepick/server/src/main/java/com/failforward/backend/domain/analysis/service/PromptLoader.java)

### BE-09 business_categories type 컬럼 + 마이그레이션 SQL

- 상태: `검증 필요`
- 산출물:
  - [V6__expand_business_categories_with_type.sql](/C:/Sidepick/server/src/main/resources/db/migration/V6__expand_business_categories_with_type.sql)
- 체크:
  - [ ] 현재 MVP DB의 기존 row 개수, 이름, slug 확인
  - [x] `type ENUM('business_field', 'cross_topic')` 추가 SQL 작성
  - [x] 16개 카테고리 upsert SQL 작성
  - [x] 기존 1~7번 `business_field` 반영 구조 포함
  - [ ] 테스트 환경 적용 후 16개 row 확인
- 메모:
  - SQL 파일은 존재하지만 DB 실제 적용 검증 기록은 별도로 남겨두는 것이 안전함

### BE-10 BE-06 가드레일 enum 동기화

- 상태: `확인 필요`
- 산출물:
  - [BE-06 가드레일 인프라 설계 문서.md](/C:/Sidepick/docs/BE-06%20가드레일%20인프라%20설계%20문서.md)
- 체크:
  - [ ] `SPECIAL_LABELS` 3종 실제 코드 반영 확인
  - [ ] `ALLOWED_CATEGORIES` 문구 변경 확인
  - [ ] `case_id` 인용 검증 정규식 갱신 확인
  - [ ] 10개 샘플 응답 기준 테스트 통과
- 메모:
  - 현재는 문서 반영 흔적이 있고, 실제 런타임 코드 위치를 먼저 찾아 확인해야 함

### BE-11 카테고리 slug 16개 매핑 + CategoryMapper util

- 상태: `완료 후보`
- 산출물:
  - [CategoryMapper.java](/C:/Sidepick/server/src/main/java/com/failforward/backend/domain/category/CategoryMapper.java)
  - [CategoryMapperTest.java](/C:/Sidepick/server/src/test/java/com/failforward/backend/domain/category/CategoryMapperTest.java)
- 체크:
  - [x] 16개 slug ↔ 한글명 매핑 정의
  - [x] `toKorean(slug)` / `toSlug(korean)` 구현
  - [ ] `BE-03` 통계 API에 slug → 한글 변환 적용 여부 확인
  - [x] 단위 테스트 파일 존재

### BE-12 Swagger /api prefix 통일

- 상태: `완료 후보`
- 산출물:
  - [OpenApiConfig.java](/C:/Sidepick/server/src/main/java/com/failforward/backend/common/config/OpenApiConfig.java)
  - [OpenApiIntegrationTest.java](/C:/Sidepick/server/src/test/java/com/failforward/backend/common/config/OpenApiIntegrationTest.java)
- 체크:
  - [x] OpenAPI path `/api/` prefix 테스트 존재
  - [ ] Swagger UI에서 실제 노출 확인

### BE-21 성공사례 이중 적재 로직 명세 확정

- 상태: `완료`
- 산출물:
  - [BE-21 성공사례 이중 적재 로직 명세.md](/C:/Sidepick/docs/BE-21%20성공사례%20이중%20적재%20로직%20명세.md)
- 체크:
  - [x] 동일 인덱스 + `type="success"` 명세
  - [x] 배치 주기 5~10분 기준 정리
  - [x] 자동 업데이트 트리거 정의
  - [x] 문서 작성 완료

## W2 본 작업 체크리스트

### BE-13 회원가입 상세항목 BE+FE

- 상태: `진행중`
- 현재 상태:
  - FE 회원가입 단계 화면 존재
  - BE `POST /api/auth/signup` 존재
  - 현재 요청 DTO는 `email`, `password`, `nickname`, `ageGroup` 수준
- 체크:
  - [ ] 필드 7종 추가: 성함 / 생년월일 / 성별 / 거주지 / 가입목적 / 닉네임 / 경험여부
  - [ ] BE 검증 로직 확장
  - [ ] FE 입력 화면 확장
  - [ ] 이메일 인증 / 비밀번호 정책 / 닉네임 중복 체크 마감 수준으로 정리
- 확인 파일:
  - [AuthDtos.java](/C:/Sidepick/server/src/main/java/com/failforward/backend/domain/auth/dto/AuthDtos.java)
  - [AuthController.java](/C:/Sidepick/server/src/main/java/com/failforward/backend/domain/auth/api/AuthController.java)
  - [SignupEmailPage.tsx](/C:/Sidepick/fe/src/pages/auth/SignupEmailPage.tsx)
  - [SignupVerifyPage.tsx](/C:/Sidepick/fe/src/pages/auth/SignupVerifyPage.tsx)
  - [SignupPasswordPage.tsx](/C:/Sidepick/fe/src/pages/auth/SignupPasswordPage.tsx)
  - [SignupNicknamePage.tsx](/C:/Sidepick/fe/src/pages/auth/SignupNicknamePage.tsx)

### BE-14 소셜 로그인 3종 BE+FE

- 상태: `진행중`
- 현재 상태:
  - 카카오/구글 로그인 BE 엔드포인트 존재
  - FE 카카오/구글 콜백 페이지 존재
  - 네이버 버튼은 보이지만 실제 연동은 미완료로 보임
- 체크:
  - [ ] 네이버 OAuth BE 연동
  - [x] 카카오 OAuth 기본 흐름 존재
  - [x] 구글 OAuth 기본 흐름 존재
  - [ ] FE 신규 사용자 → 회원가입 상세항목 화면 연결
  - [ ] FE 기존 사용자 → 메인 이동 검증
  - [ ] 팀장 테스트 요청 전 시나리오 점검
- 확인 파일:
  - [AuthEntryPage.tsx](/C:/Sidepick/fe/src/pages/auth/AuthEntryPage.tsx)
  - [KakaoCallbackPage.tsx](/C:/Sidepick/fe/src/pages/auth/KakaoCallbackPage.tsx)
  - [GoogleCallbackPage.tsx](/C:/Sidepick/fe/src/pages/auth/GoogleCallbackPage.tsx)
  - [OAuthAuthService.java](/C:/Sidepick/server/src/main/java/com/failforward/backend/domain/auth/service/OAuthAuthService.java)

### BE-15 마이페이지 BE+FE

- 상태: `진행중`
- 현재 상태:
  - 마이페이지 기본 화면과 `GET /api/users/me` 연동 존재
- 체크:
  - [ ] 계정 설정 수정 기능
  - [ ] 내 글 보기
  - [ ] AI 분석 보기
  - [ ] PD 디자인 최종 반영
- 확인 파일:
  - [MyPage.tsx](/C:/Sidepick/fe/src/pages/MyPage.tsx)

### BE-16 북마크/저장 BE+FE

- 상태: `대기`
- 체크:
  - [ ] 북마크 추가/해제 API
  - [ ] 마이페이지 북마크 목록
  - [ ] 사례 카드 북마크 토글

### BE-17 공감/반응 버튼 BE+FE

- 상태: `대기`
- 체크:
  - [ ] 하트 / 눈물 2종
  - [ ] 카드 + 상세 페이지 버튼
  - [ ] 사용자당 1회 제한 unique constraint

### BE-18 내 글 수정 BE+FE

- 상태: `대기`
- 체크:
  - [ ] `PUT /api/experiences/{id}` 엔드포인트
  - [ ] 본인 글만 수정 권한 체크
  - [ ] FE 수정 화면
- 메모:
  - 현재 프론트 API는 `PATCH` 사용 중이라 스펙 정합화가 먼저 필요

### BE-19 가이드형 글쓰기 FE 구현

- 상태: `대기`
- 체크:
  - [ ] 1단계 카테고리 선택
  - [ ] 2단계 다이얼 입력
  - [ ] 3단계 자율 서술 + 예시 카드
  - [ ] `ExampleCard` 컴포넌트

### BE-20 PII 마스킹 BE

- 상태: `대기`
- 체크:
  - [ ] 전화번호 마스킹 정규식
  - [ ] 이메일 마스킹 정규식
  - [ ] 주민번호 마스킹 정규식
  - [ ] `POST /experiences`, `PUT/PATCH /experiences` 저장 전 자동 마스킹
  - [ ] 단위 테스트

## 오늘 바로 할 일

1. `BE-13`에서 회원가입 상세 필드 7종의 DB/DTO/API/FE 입력 흐름을 먼저 확정
2. `BE-14`에서 네이버 OAuth 추가 범위와 신규/기존 사용자 분기 규칙 정리
3. `BE-15`는 마이페이지 요구 API 목록을 먼저 고정
4. `BE-20`은 저장 파이프라인에 마스킹을 넣을 위치를 선확인
5. `BE-16` `BE-17` `BE-18` `BE-19`는 스키마/API 영향도 기준으로 묶어서 후속 처리

## 작업 전 확인 포인트

- 인증 관련 기존 수정 중인 파일이 있어 충돌 주의
- `BE-13`과 `BE-14`는 사용자 프로필 완료 여부 플로우를 같이 봐야 함
- `BE-18`은 현재 FE `PATCH`와 티켓 `PUT` 중 무엇을 기준으로 갈지 정리 필요
- `BE-16` `BE-17`은 `BE-01` 스키마 초안과 실제 엔티티 반영 상태를 먼저 비교해야 함
- `BE-20`은 가드레일/분석 파이프라인과 저장 로직 양쪽 영향 확인 필요

## 작업 완료 기록 템플릿

### 작업 완료

- 티켓:
- 상태: `완료`
- 작업 내용:
- 산출물:
- 테스트/검증:
- 팀장 전달 여부:
- 비고:

