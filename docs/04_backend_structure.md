# 04. Backend Structure

## Scope

이 문서는 현재 Spring Boot 백엔드의 **도메인 구조와 API 책임**을 요약합니다.
구현 세부 코드보다, 어떤 모듈이 어떤 문제를 맡는지 빠르게 이해하는 데 초점을 둡니다.

---

## Main Domains

| 도메인 | 역할 |
| --- | --- |
| `auth` | 회원가입, 로그인, 이메일 인증, OAuth |
| `experience` | 경험 목록/상세/작성/수정/삭제, 공유 payload/OG/이미지 |
| `analysis` | 분석 생성, 리포트 조회, 유사 사례 매칭 |
| `category` | 카테고리 목록 제공 |
| `user` | 내 정보 조회/수정, 비밀번호 변경, 프로필 이미지 업로드 |
| `user activity` | 내 경험/북마크/최근 조회/분석 이력/홈 피드 |
| `stats` | 실패 패턴/실패 시점 통계 JSON 제공 |
| `admin` | 요청 지연시간, 챗봇 운영 상태 조회 |
| `chatbot` | 챗봇 메시지 처리, fallback, guardrail, rate-limit |
| `comment` | 댓글 / 답글 |
| `decision` | 사용자 선택 흐름 기록 |
| `interaction` | 경험 상호작용 기록 |
| `health` | 헬스체크 |

---

## Response / Error Policy

백엔드는 공통 응답 envelope와 에러 코드 체계를 사용합니다.

주요 구성:
- `ApiResponse`
- `ErrorCode`
- `GlobalExceptionHandler`
- `SecurityExceptionHandler`

이 구조 덕분에 프론트는 성공/실패 응답 형식을 안정적으로 파싱할 수 있습니다.

---

## Main Controllers

| Controller | 핵심 책임 |
| --- | --- |
| `AuthController` | 로그인, 회원가입, 이메일 인증, OAuth |
| `ExperienceController` | 경험 CRUD, 공유 payload/OG/이미지, 유사 경험 조회, 경험 비교 |
| `AnalysisController` | 분석 리포트 조회, 분석 생성, 매칭 사례 조회 |
| `CategoryController` | 카테고리 목록 조회 |
| `UserController` | 내 정보 조회/수정, 비밀번호 변경, 프로필 이미지 업로드 |
| `UserActivityController` | 내 경험/북마크/최근 조회/분석 이력/홈 피드 조회 |
| `StatsController` | 실패 패턴/실패 시점 통계 조회 |
| `AdminLatencyMetricsController` | 운영용 요청 지연시간 샘플 조회 |
| `AdminChatbotOpsController` | 운영용 챗봇 큐/토큰/분당 제한 상태 조회 |
| `ChatbotController` | 챗봇 메시지 요청 처리 |
| `CommentController` | 댓글 생성/삭제/답글 |
| `DecisionController` | 선택 기록 저장 |
| `InteractionController` | 사용자 상호작용 기록 |
| `HealthController` | 헬스체크 |

---

## Service Layer Notes

### Experience Domain

- 경험 생성 / 수정 / 삭제
- 목록 / 상세 / 비교 흐름 처리
- 상세 화면 진입의 핵심 데이터 제공
- 공유 payload 생성
- 공유용 OG HTML / PNG 생성에 필요한 메타 조립

### Analysis Domain

- 분석 생성 요청
- 분석 리포트 조회
- AI 결과를 FE 계약에 맞는 응답으로 조립
- 유사 사례와 리포트 데이터를 함께 묶어 제공
- `READY / NOT_READY / ERROR` 상태 분기 기준 유지

### User Domain

- 내 정보 수정
- 계정 설정 / 비밀번호 변경
- 프로필 이미지 업로드 후 공개 URL 반환

### Admin / Chatbot Domain

- 최근 요청 지연시간 샘플 조회
- 챗봇 인스턴스 큐 상태 조회
- 분당 제한 상태와 일일 토큰 사용량 조회
- 단일 인스턴스 보호용 queue-capacity 운용

### Auth Domain

- JWT 기반 인증
- 카카오 / 구글 OAuth 토큰 교환
- 이메일 인증 기반 회원가입 플로우

---

## Data / Persistence Notes

- JPA 기반 도메인 저장
- Flyway로 운영 스키마 이력 관리
- 운영 DB는 AWS RDS MySQL 기준
- 데모/운영 데이터 분리 원칙 존재
- 챗봇 rate-limit 상태와 daily-token-limit 사용량은 DB에 저장되어 재시작 후 유지

---

## Integration Boundary

백엔드는 프론트와 AI 서버 사이의 조정자 역할을 합니다.

- 프론트는 AI 서버를 직접 호출하지 않습니다.
- 백엔드가 AI 요청을 생성하고 결과를 저장/가공합니다.
- FE 계약에 맞는 DTO 변환은 백엔드가 책임집니다.
- FE는 공유 랜딩 HTML이나 PNG 생성을 직접 하지 않고 백엔드 응답을 사용합니다.

---

## Related Docs

- [02_api_contract.md](./02_api_contract.md)
- [05_ai_integration_contract.md](./05_ai_integration_contract.md)
- [../server/README.md](../server/README.md)
- [../server/ANALYSIS_REPORT_CONTRACT.md](../server/ANALYSIS_REPORT_CONTRACT.md)
