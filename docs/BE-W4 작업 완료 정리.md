# BE-W4 작업 완료 정리

## 목적

고도화 4주차 백엔드 중심 연결 작업과 운영 보강 결과를 피벗 데이 제출 관점에서 모아두는 문서다.

현재 문서는 티켓별 반영 범위, 검증 기준, 산출물 위치를 한 번에 확인하기 위한 용도다.

## 작업 개요

백엔드 기준으로 우선순위가 높은 연결 작업과 운영 보강을 먼저 진행했다.

이번 작업에서는 새 기능을 임의로 확장하지 않고, 작업 안내 범위 안에서 아래 항목을 중심으로 반영했다.

- 분석/공유 계약 고정
- 챗봇 운영 안정화
- 이미지 업로드/공유 연결
- 하네스 및 문서 최신화

## 현재 상태 요약

### P0

- `BE-30` 분석 API explanation 계약 반영 완료
- `BE-31` 유사 사례 API explanation 계약 반영 완료
- `BE-32` 챗봇 메시지 API 기본 라우팅 및 fallback 반영 완료
- `BE-36` 프로필 이미지 업로드 API 및 FE 연결 완료
- `BE-39` 챗봇 guardrail, queue, rate limit, token budget persistence 1차 반영 완료

### P1

- `BE-33` 분석 결과 캐시 및 hit/miss 로깅 반영 완료
- `BE-35` latency metrics 수집 및 관리자 조회 API 반영 완료
- `BE-38` 경험 공유 API, OG 페이지, 공유 이미지 다운로드 반영 완료

## 티켓별 작업 완료

## GitHub 링크

- 레포지토리: [duvwlq/Sidepick](https://github.com/duvwlq/Sidepick)
- 작업 브랜치: [`Sidepick-merge-branch`](https://github.com/duvwlq/Sidepick/tree/Sidepick-merge-branch)
- 기준 커밋:
  - [`6dd18866` - backend share ops and harness updates](https://github.com/duvwlq/Sidepick/commit/6dd18866)

### 산출물 링크

- [01_current_architecture.md](./01_current_architecture.md)
- [02_api_contract.md](./02_api_contract.md)
- [04_backend_structure.md](./04_backend_structure.md)
- [05_ai_integration_contract.md](./05_ai_integration_contract.md)
- [server/README.md](../server/README.md)
- [server/HARNESS.md](../server/HARNESS.md)

### BE-32 / BE-39 챗봇 메시지 API 및 운영 보강

- 상태: `완료`
- 작업 내용:
  - 챗봇 API fallback 흐름 반영
  - 분당 제한과 일일 토큰 사용량 persistence 반영
  - 단일 인스턴스 보호용 queue 반영
  - guardrail 검증 실패 시 fallback 처리 반영
- 추가 API:
  - `GET /api/admin/chatbot-ops`
- 관련 코드:
  - [ChatbotService.java](/D:/Codex_Folder/Sidepick/server/src/main/java/com/failforward/backend/domain/chatbot/service/ChatbotService.java)
  - [AdminChatbotOpsController.java](/D:/Codex_Folder/Sidepick/server/src/main/java/com/failforward/backend/domain/admin/api/AdminChatbotOpsController.java)
  - [ChatbotApiIntegrationTest.java](/D:/Codex_Folder/Sidepick/server/src/test/java/com/failforward/backend/domain/chatbot/api/ChatbotApiIntegrationTest.java)
  - [ChatbotGuardrailPersistenceIntegrationTest.java](/D:/Codex_Folder/Sidepick/server/src/test/java/com/failforward/backend/domain/chatbot/service/ChatbotGuardrailPersistenceIntegrationTest.java)

### BE-33 / BE-35 분석 캐시 및 latency 관측 보강

- 상태: `완료`
- 작업 내용:
  - 동일 payload 재호출 시 분석 결과 캐시 재사용
  - 캐시 TTL 24시간 반영
  - hit/miss 로그 반영
  - 요청 latency 샘플 수집 및 관리자 조회 API 반영
- 추가 API:
  - `GET /api/admin/latency-metrics`
- 관련 코드:
  - [AnalysisResultCache.java](/D:/Codex_Folder/Sidepick/server/src/main/java/com/failforward/backend/domain/analysis/service/AnalysisResultCache.java)
  - [RequestLatencyMetricsInterceptor.java](/D:/Codex_Folder/Sidepick/server/src/main/java/com/failforward/backend/common/api/RequestLatencyMetricsInterceptor.java)
  - [AdminLatencyMetricsController.java](/D:/Codex_Folder/Sidepick/server/src/main/java/com/failforward/backend/domain/admin/api/AdminLatencyMetricsController.java)

### BE-36 이미지 업로드 연결

- 상태: `완료`
- 작업 내용:
  - 프로필 이미지 업로드 API 추가
  - 업로드 파일 검증 및 공개 URL 반환 반영
  - FE 프로필 편집 화면에서 실제 업로드 API 호출 연결
- 추가 API:
  - `POST /api/users/me/profile-image`
- 메모:
  - 현재 구현은 로컬/서버 파일 스토리지 기반이다.
  - 작업 안내 범위에서 업로드 연결을 우선 충족하는 방향으로 정리했다.
- 관련 코드:
  - [UserController.java](/D:/Codex_Folder/Sidepick/server/src/main/java/com/failforward/backend/domain/user/api/UserController.java)
  - [UserProfileImageService.java](/D:/Codex_Folder/Sidepick/server/src/main/java/com/failforward/backend/domain/user/service/UserProfileImageService.java)
  - [MyPageProfileEdit.tsx](/D:/Codex_Folder/Sidepick/fe/src/pages/MyPageProfileEdit.tsx)

### BE-38 SNS 공유 연결

- 상태: `완료`
- 작업 내용:
  - 경험 상세 공유 payload API 추가
  - OG 메타 전용 HTML 페이지 추가
  - 공유 카드 PNG 다운로드 API 추가
  - FE 상세 화면 공유 버튼과 브라우저 공유/링크 복사 fallback 연결
- 추가 API:
  - `GET /api/experiences/{id}/share`
  - `GET /api/experiences/{id}/share-page`
  - `GET /api/experiences/{id}/share-image`
- 관련 코드:
  - [ExperienceController.java](/D:/Codex_Folder/Sidepick/server/src/main/java/com/failforward/backend/domain/experience/api/ExperienceController.java)
  - [ExperienceSharePageRenderer.java](/D:/Codex_Folder/Sidepick/server/src/main/java/com/failforward/backend/domain/experience/service/ExperienceSharePageRenderer.java)
  - [ExperienceShareImageService.java](/D:/Codex_Folder/Sidepick/server/src/main/java/com/failforward/backend/domain/experience/service/ExperienceShareImageService.java)
  - [DetailV1.tsx](/D:/Codex_Folder/Sidepick/fe/src/pages/DetailV1.tsx)

### BE-30 / BE-31 explanation 계약 안정화

- 상태: `완료`
- 작업 내용:
  - 분석 결과 응답의 `explanation` shape 고정
  - 유사 사례 배열 항목의 `explanation` shape 고정
  - `READY / NOT_READY` 상태별 기본 응답 shape를 문서와 테스트로 고정
- 관련 코드:
  - [AnalysisDtos.java](/D:/Codex_Folder/Sidepick/server/src/main/java/com/failforward/backend/domain/analysis/dto/AnalysisDtos.java)
  - [AnalysisApiIntegrationTest.java](/D:/Codex_Folder/Sidepick/server/src/test/java/com/failforward/backend/domain/analysis/api/AnalysisApiIntegrationTest.java)
  - [02_api_contract.md](/D:/Codex_Folder/Sidepick/docs/02_api_contract.md)
  - [05_ai_integration_contract.md](/D:/Codex_Folder/Sidepick/docs/05_ai_integration_contract.md)

### 하네스 및 문서 최신화

- 상태: `완료`
- 작업 내용:
  - 백엔드 하네스 문서 추가
  - `smoke`, `ai`, `full` 실행 기준 정리
  - 현재 구현 상태에 맞춰 아키텍처/API/백엔드 구조/AI 계약 문서 최신화
- 관련 문서:
  - [server/HARNESS.md](/D:/Codex_Folder/Sidepick/server/HARNESS.md)
  - [01_current_architecture.md](/D:/Codex_Folder/Sidepick/docs/01_current_architecture.md)
  - [02_api_contract.md](/D:/Codex_Folder/Sidepick/docs/02_api_contract.md)
  - [04_backend_structure.md](/D:/Codex_Folder/Sidepick/docs/04_backend_structure.md)
  - [05_ai_integration_contract.md](/D:/Codex_Folder/Sidepick/docs/05_ai_integration_contract.md)

## 검증 내용

- Docker Maven 기준 백엔드 통합 테스트로 주요 계약 검증
- 백엔드 하네스 `smoke`, `ai` 실행 기준 문서화

### 확인한 테스트 항목

- `ExperienceApiIntegrationTest`
- `AnalysisApiIntegrationTest`
- `AdminChatbotOpsApiIntegrationTest`
- `AdminLatencyMetricsApiIntegrationTest`
- `ChatbotApiIntegrationTest`
- `ChatbotGuardrailPersistenceIntegrationTest`
- `UserApiIntegrationTest`

## 메모

- 첨부 작업 지시서 기준 완료 보고를 저장소 문서 형태로 정리했다.
- 실제 기능 반영은 커밋 `6dd18866`과 현재 워크트리 기준 문서/테스트에서 추적 가능하다.
