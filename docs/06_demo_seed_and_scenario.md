# 06. Demo Seed and Scenario

## Purpose

이 문서는 MVP 시연과 QA 확인에 사용할 **데모 진입 시나리오**를 정리합니다.
실시간 분석 전체를 매번 보여주기보다, 검증된 사례 상세 화면 중심으로 시연하는 것을 기본 전략으로 둡니다.

---

## Recommended Demo Flow

1. `/experiences/{id}`로 직접 진입합니다.
2. `READY` 상태의 분석 리포트를 확인합니다.
3. 유사 사례와 가이드를 함께 확인합니다.
4. 필요하면 탐색 / FAQ 화면으로 확장합니다.

이 방식은 네트워크나 AI 응답 시간 변동에 덜 민감합니다.

---

## Demo Strategy

### Primary Demo

- 이미 분석이 준비된 사례 상세 화면 사용
- 사례 본문 → AI 리포트 → 유사 사례 → CTA 흐름 설명

### Secondary Demo

- 실패 경험 작성 흐름 소개
- 분석 생성은 보조 시연으로 처리
- 실시간 생성은 네트워크 상황에 따라 가변 요소로 봄

---

## Example Scenarios

### Scenario 1: 온라인 판매 / 이커머스

- 사례 상세 진입
- 유사 사례 비교
- FAQ 연결

### Scenario 2: 플랫폼 노동 / 배달

- 다른 카테고리 사례 비교
- 분석 결과의 패턴 차이 설명

---

## Notes

- `/analysis-result` 직접 진입보다 `/experiences/{id}` 기준 흐름을 우선 사용합니다.
- demo/local 시드와 운영 데이터는 분리해 관리합니다.
- 시연용 ID 목록은 실제 배포 데이터 상태에 맞춰 별도로 점검해야 합니다.

---

## Operational Caution

- 운영 DB 반영 전후로 사례 ID가 달라질 수 있습니다.
- CSV import 직후에는 실제 시연 ID를 다시 확인해야 합니다.
- 데모 시에는 `READY` 상태 사례를 먼저 검증한 후 사용합니다.

---

## Related Docs

- [07_deployment.md](./07_deployment.md)
- [../server/README.md](../server/README.md)
- [README.md](./README.md)
