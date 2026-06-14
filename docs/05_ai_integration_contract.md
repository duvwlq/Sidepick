# 05. AI Integration Contract

## Scope

이 문서는 **Spring Boot 백엔드와 FastAPI AI 서버 사이의 연동 계약**을 설명합니다.  
AI 구현 전체를 설명하는 문서가 아니라, 서비스 런타임에서 두 서버가 어떤 역할 분리를 가지는지 정리합니다.

---

## Current Integration Shape

- 프론트는 AI 서버를 직접 호출하지 않습니다.
- 백엔드가 분석 요청을 만들어 AI 서버에 전달합니다.
- AI 서버는 분석 결과를 생성합니다.
- 백엔드는 이를 서비스 응답 형태로 재가공해 프론트에 전달합니다.

---

## Runtime Expectations

### 분석 요청 실패

AI 호출이 실패해도 경험 등록 자체가 반드시 함께 실패할 필요는 없습니다.  
서비스는 경험 데이터 저장과 분석 상태를 분리해서 다룹니다.

### 분석 결과 캐시

동일 payload 기준 분석 요청은 백엔드 캐시를 재사용할 수 있습니다.
즉, AI 서버 호출 횟수와 FE 응답 계약은 분리되어 있습니다.

### 분석 준비 중 상태

분석 결과가 아직 없으면 프론트는 `NOT_READY` 상태를 받습니다.
이 상태를 통해 준비 중 UI를 노출할 수 있습니다.

### 분석 완료 상태

분석 완료 후 프론트는 리포트 API를 통해 결과를 조회합니다.

### 챗봇 요청 실패

챗봇은 분석 리포트와 별도 흐름으로 동작합니다.
AI upstream 실패나 guardrail 차단이 있어도 백엔드는 fallback 응답 shape를 유지합니다.

---

## Status Contract

- `READY`: 분석 결과 존재
- `NOT_READY`: 분석 결과 미생성 또는 생성 중
- `ERROR`: 분석 실패

이 상태 모델은 프론트 상세 화면 분기의 기준이 됩니다.

---

## Responsibility Split

| 레이어 | 책임 |
| --- | --- |
| Frontend | 상태에 맞는 화면 분기와 결과 렌더링 |
| Backend | 요청 조정, 저장, DTO 조립, 상태 관리, fallback/guardrail/persistence |
| AI Server | 분석 생성, 챗봇 upstream 응답 생성 |

---

## Failure Handling Principles

- AI 서버 실패를 전체 서비스 실패와 동일시하지 않습니다.
- 경험 저장과 분석 생성을 분리해 생각합니다.
- 프론트는 `READY / NOT_READY / ERROR`를 기준으로 안정적으로 분기합니다.
- API shape mismatch를 mock으로 숨기지 않습니다.

### Current Backend Guarantees

- 분석 리포트는 `READY / NOT_READY / ERROR` 상태 모델을 유지합니다.
- `NOT_READY`일 때는 `analysisId=null`, `keywords=[]`, `riskFactors=[]`, `similarCases=[]`, `explanation=null` shape를 유지합니다.
- 챗봇의 분당 제한 상태와 일일 토큰 사용량은 DB persistence를 사용합니다.
- 챗봇 queue-capacity는 단일 앱 인스턴스 보호용이며, 다중 인스턴스 전역 동시성 제어는 별도 계층이 필요합니다.

---

## Asset Note

AI 관련 추천 자산은 `ai/recommender/`와 `ai/scripts/` 영역에서 관리합니다.
이 자산은 프론트 PR과 직접 결합되지 않으며, 별도 품질 관리 대상입니다.

---

## Related Docs

- [02_api_contract.md](./02_api_contract.md)
- [04_backend_structure.md](./04_backend_structure.md)
- [../ai/README.md](../ai/README.md)
- [../server/ANALYSIS_REPORT_CONTRACT.md](../server/ANALYSIS_REPORT_CONTRACT.md)
