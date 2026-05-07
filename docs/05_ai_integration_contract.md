# 05. AI Integration Contract

## Scope

이 문서는 `ai/` 내부 구현 상세가 아니라, **Spring Boot와 AI 서버의 연동 계약**을 설명합니다.

## Current Integration Shape

- Spring Boot가 AI 서버에 분석 요청을 보냅니다.
- AI 서버 응답은 백엔드에서 저장/조회 가능한 형태로 가공됩니다.
- FE는 AI 서버를 직접 호출하지 않고, BE의 분석/리포트 API를 사용합니다.

## Runtime Expectations

- AI 분석 요청이 실패해도 경험 저장 흐름은 유지되어야 합니다.
- 분석 결과가 아직 없으면 FE에는 `NOT_READY` 상태가 전달되어야 합니다.
- 분석 완료 시 FE는 리포트 endpoint를 통해 결과를 조회합니다.

## READY vs NOT_READY

- `READY`: 분석 결과 존재
- `NOT_READY`: 분석 없음 또는 생성 중
- `ERROR`: 분석 실패

## Fallback

- AI 서버 호출 실패가 저장 전체를 막으면 안 됩니다.
- 백엔드는 분석 실패와 저장 실패를 분리해야 합니다.

## Branch / Asset Note

- `feature/ai` 자산은 별도 브랜치/운영 동기화 이슈로 관리합니다.
- 데이터셋, matching table, 인덱스 파일은 FE PR과 직접 섞지 않습니다.

## AI Docs Note

- `ai/` 내부 문서는 별도 유지하되, 최신성 검토가 추가로 필요합니다.
- 특히 `ai/docs/API.md`는 실행 명령과 현재 코드 기준을 다시 확인해야 합니다.

## TODO

- AI 서버 request/response 예시를 2차 정리에서 보강
- 운영 동기화 상태와 실제 배포된 AI 자산 목록을 별도 운영 문서로 정리
