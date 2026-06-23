# Backend Harness

This backend already had integration tests and AI upstream mocks, but it did not have a single harness entrypoint.

This harness adds:

- a repeatable smoke suite
- a repeatable AI suite
- automatic runtime selection between local Maven and Docker Maven
- timestamped logs and JSON reports under `%TEMP%/sidepick-harness/backend`

## Suites

- `smoke`
  - `HealthControllerTest`
  - `AuthApiIntegrationTest`
  - `AdminLatencyMetricsApiIntegrationTest`
  - `CategoryApiIntegrationTest`
  - `ExperienceApiIntegrationTest`
- `ai`
  - `AgentAApiIntegrationTest`
  - `ExperienceAiIntegrationTest`
  - `AnalysisApiIntegrationTest`
  - `StatsApiIntegrationTest`
  - `ChatbotApiIntegrationTest`
  - `ChatbotGuardrailPersistenceIntegrationTest`
- `full`
  - smoke + ai

## Commands

From repo root:

```powershell
powershell -ExecutionPolicy Bypass -File .\server\scripts\harness\run-backend-harness.ps1 -Suite smoke
powershell -ExecutionPolicy Bypass -File .\server\scripts\harness\run-backend-harness.ps1 -Suite ai
powershell -ExecutionPolicy Bypass -File .\server\scripts\harness\run-backend-harness.ps1 -Suite full
```

Force Docker:

```powershell
powershell -ExecutionPolicy Bypass -File .\server\scripts\harness\run-backend-harness.ps1 -Suite ai -Runtime docker
```

Force local Maven:

```powershell
powershell -ExecutionPolicy Bypass -File .\server\scripts\harness\run-backend-harness.ps1 -Suite smoke -Runtime maven
```

## Runtime Selection

- `auto`
  - uses local `mvn` if available
  - otherwise uses `docker run ... maven:3.9.9-eclipse-temurin-17`
- `maven`
  - requires local Maven in `PATH`
- `docker`
  - requires Docker Desktop running

## Output

Each run writes:

- `harness.log`
- `report.json`

Default output root:

- `%TEMP%/sidepick-harness/backend/<suite>-<timestamp>`

## Current Harness Components

- `server/src/test/java/com/failforward/backend/support/ApiIntegrationTestSupport.java`
  - shared auth and experience setup
- `MockRestServiceServer`
  - AI upstream mocking for analysis/chatbot/experience AI tests
- `server/src/test/resources/application-test.yml`
  - isolated H2 + test-only config

## Coverage Notes

- `ExperienceApiIntegrationTest`
  - CRUD
  - search/filter contract
  - related success cases
  - share payload contract
  - OG share page HTML contract
  - share image PNG download contract
- `AnalysisApiIntegrationTest`
  - `READY` / `NOT_READY` report contract
  - `explanation` shape
  - matched cases contract

## Recommended Verification

공유/분석 계약 회귀 확인이 목적이면 아래 둘 중 하나면 충분합니다.

```powershell
powershell -ExecutionPolicy Bypass -File .\server\scripts\harness\run-backend-harness.ps1 -Suite smoke
powershell -ExecutionPolicy Bypass -File .\server\scripts\harness\run-backend-harness.ps1 -Suite ai
```

둘 다 실행하면 아래 범위를 함께 검증합니다.

- 경험 상세/공유 계열 REST 계약
- 분석 리포트 상태 분기 계약
- AI fallback 허용 상태에서의 응답 shape
