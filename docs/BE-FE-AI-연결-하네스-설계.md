# BE-FE-AI 연결 실행 정리

## 목적

이 문서는 팀 전체 계획을 그대로 재진술하는 문서가 아니다.
현재 저장소와 브랜치 상태를 기준으로, FE와 BE가 지금 어디까지 진행해야 하는지와
AI 계약 확정 전까지 무엇을 분리해서 봐야 하는지를 정리하는 실행 문서다.

핵심 원칙은 아래 4가지다.

1. 계약 고정
2. 하네스 우선
3. FE/BE 연결 완료
4. AI 대기 기능 분리

## 이 문서를 읽는 기준

현재 계획 문서들은 하나의 마스터 일정표라기보다 BE, FE, AI, PM 관점의 작업 목록이 겹쳐 있는 상태다.
따라서 지금 단계에서는 "전체 티켓 완료"보다 아래 질문에 답할 수 있어야 한다.

- FE가 지금 바로 붙일 수 있는 API 계약은 무엇인가
- BE가 지금 바로 안정화할 수 있는 응답 shape는 무엇인가
- 하네스로 먼저 고정해야 하는 연결 지점은 무엇인가
- AI 확정 전까지 임시 연결로만 취급해야 하는 기능은 무엇인가

## 현재 기준 문서

- [docs/02_api_contract.md](/D:/Codex_Folder/Sidepick/docs/02_api_contract.md)
- [docs/05_ai_integration_contract.md](/D:/Codex_Folder/Sidepick/docs/05_ai_integration_contract.md)
- [docs/PM-17-통계-JSON-BE-AI-합의메모.md](/D:/Codex_Folder/Sidepick/docs/PM-17-통계-JSON-BE-AI-합의메모.md)
- [ai/docs/API.md](/D:/Codex_Folder/Sidepick/ai/docs/API.md)
- [ai/server/main.py](/D:/Codex_Folder/Sidepick/ai/server/main.py)
- [server/HARNESS.md](/D:/Codex_Folder/Sidepick/server/HARNESS.md)
- [fe/HARNESS.md](/D:/Codex_Folder/Sidepick/fe/HARNESS.md)

## 현재 확정해서 믿을 수 있는 계약

### 1. 분석 연동

AI 메인 앱 기준으로 현재 확실하게 확인된 엔드포인트는 아래 2개다.

- `GET /health`
- `POST /analyze`

따라서 FE/BE는 우선 `analyze` 연동을 중심으로 계약을 고정한다.
챗봇은 문서와 브랜치 흔적은 있지만, 메인 앱 기준 최종 확정 계약으로 보지 않는다.

### 2. 통계 JSON

아래 파일은 FE/BE가 바로 연결 대상으로 삼아도 되는 현재 기준 데이터다.

- `ai/data/failure_pattern.json`
- `ai/data/failure_timing.json`

검증 포인트는 아래 필드들이다.

- `version`
- `display_policy.min_sample_size`
- `categories[slug].total`
- `categories[slug].sufficient_data`
- `categories[slug].patterns[]`
- `buckets[]`
- `categories[slug].distribution[]`
- `peak_bucket`

### 3. 분석 결과 상태값

FE는 아래 상태값만 기준으로 화면을 분기한다.

- `READY`
- `NOT_READY`
- `ERROR`

### 4. explanation 계열 응답

현재 FE/BE가 고정해야 하는 설명형 응답은 아래다.

- 분석 결과 explanation
- 유사사례 explanation
- 통계/차트 설명 문구

이 영역은 AI 내부 로직 완성 여부와 분리해서, BE 응답 shape와 FE 렌더링 방식부터 고정한다.

## 실행 보드

## 진행 전

아직 착수는 가능하지만, 완료 판정을 내리기 전에 조건을 다시 써야 하는 항목들이다.

- AI 챗봇 최종 계약 확정
  - 이유: 현재 메인 앱 기준 authoritative contract가 불명확하다.
- FAISS hot-swap 운영 시나리오
  - 이유: 메모리 기준, health check, 실패 롤백 조건이 문서화되어 있지 않다.
- 다중 인스턴스 기준 rate limit/token budget/LangSmith 운영 기준
  - 이유: 단일 인스턴스 구현과 운영 확장 기준이 분리되어야 한다.
- SNS 공유, 성공사례, 알림류의 최종 완료 기준
  - 이유: API 완료, UI 완료, 디자인 반영 완료가 서로 다른데 하나의 티켓으로 묶여 있다.

## 진행 중

현재 FE/BE 관점에서 가장 현실적인 주 작업 영역이다.

- 통계 계약 고정
  - BE는 실제 `failure_pattern.json`, `failure_timing.json` 기준으로 DTO와 fixture loader를 검증한다.
  - FE는 차트 렌더링을 `sufficient_data`와 bucket shape 중심으로 고정한다.
- 분석 결과 계약 고정
  - BE는 `reportStatus`, `summary`, `keywords`, `failureCategory`, `riskLevel`, explanation 계열 필드를 안정화한다.
  - FE는 `READY`, `NOT_READY`, `ERROR` 세 상태를 기준으로만 분기한다.
- 하네스 보강
  - BE는 실제 통계 JSON과 분석 응답 shape에 대한 계약 테스트를 강화한다.
  - FE는 분석 상세와 통계 화면을 대상으로 스모크 하네스를 추가한다.
  - 마지막에 BE+FE 연결 스모크를 묶는다.
- 챗봇 백엔드 연결 준비
  - FE 완성 목표가 아니라, BE fallback/guardrail/persistence 보강까지를 현재 범위로 본다.

## 진행 완료

현재 브랜치 기준으로 이미 반영되었거나, 최소 기반이 갖춰진 항목들이다.

- 백엔드 하네스 엔트리포인트 구축
  - `server/scripts/harness/run-backend-harness.ps1`
  - `smoke`, `ai`, `full` 스위트 실행 가능
- 분석 explanation 응답 반영
  - 분석 결과와 유사사례 설명 필드 전달 기반 반영
- 통계 fixture 연동 기반 반영
  - AI 통계 JSON 파일을 저장소 기준 데이터로 포함
- 챗봇 운영 보강 1차
  - fallback, guardrail, rate limit/token budget persistence 기반 반영
- 운영 관측 기반 1차
  - 요청 지연 시간 측정용 admin API 및 관련 테스트 기반 반영

## AI 대기

FE/BE에서 준비는 가능하지만, 최종 완료로 잡으면 안 되는 항목들이다.

- 챗봇 FE 정식 연결
  - AI 메인 앱의 최종 계약과 응답 shape 확정 전까지는 임시 연결 또는 feature flag 수준으로 유지
- AI 핫스왑 운영 자동화
  - 인덱스 산출물의 소유권, 배포 경로, 롤백 기준 확정 필요
- LangSmith 기반 운영 판정
  - 수집 기준, 저장 주체, 경보 기준이 먼저 정리되어야 함
- hallucination 관련 완료 판정
  - 지표 계산 기준과 BE/FE 노출 범위가 합의되어야 함

## FE가 지금 해야 하는 일

- 분석 상세 화면에서 `READY`, `NOT_READY`, `ERROR` 분기 고정
- explanation 필드 렌더링 방식 정리
- 통계 차트에서 `sufficient_data=false` 안내 UI 정리
- 통계 bucket/pattern shape를 기준으로 차트 컴포넌트 안정화
- mock fallback이 아니라 실제 계약 shape 기준으로 mapper 정리
- FE 하네스에 분석 상세, 통계 화면 스모크 추가

## BE가 지금 해야 하는 일

- 분석 결과 응답 shape와 explanation 필드 안정화
- 유사사례 explanation 전달 shape 안정화
- 통계 JSON 로더와 DTO 검증 강화
- `READY/NOT_READY/ERROR` 상태 분기 일관성 유지
- 챗봇 fallback/guardrail/persistence를 운영 기준으로 보강
- 하네스에서 분석/통계/챗봇 계약 테스트를 재현 가능하게 유지

## 권장 개발 순서

1. 통계 JSON 계약 테스트 강화
2. 분석 결과 API shape 고정
3. FE 분석 상세 상태 분기 정리
4. FE 통계 화면 연결 정리
5. FE 하네스 추가
6. BE + FE 스모크 하네스 묶기
7. 그 다음에만 챗봇 FE 연결 여부 판단

## 완료 기준

아래 4가지를 만족하면, 현재 단계의 FE/BE 연결 작업은 완료로 본다.

- 통계 JSON 변경 시 BE 테스트가 즉시 깨진다.
- 분석 결과 shape 변경 시 FE 또는 BE 하네스가 즉시 깨진다.
- FE 상세 화면이 `READY/NOT_READY/ERROR`를 모두 안정적으로 처리한다.
- AI 미확정 기능이 별도 대기 항목으로 분리되어, 완료 판정에 섞이지 않는다.
