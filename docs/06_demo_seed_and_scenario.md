# 06. Demo Seed And Scenario

## Recommended Demo Flow

현재 시연은 실시간 AI 분석 전체 흐름보다 아래 방식이 더 안전합니다.

1. `/experiences/{id}` 직접 진입
2. `READY` 상태의 분석 리포트 확인
3. 유사 사례와 가이드 확인

실시간 AI 분석은 보조 시연으로 분리합니다.

## Scenario 1: 스마트스토어

- `similar_case_ids`: `[18, 19, 100]`
- `success_guide_key`: `online_sales__revenue_structure`

## Scenario 2: 배달대행

- `similar_case_ids`: `[7, 10, 12]`
- `success_guide_key`: `platform_work__competition`

## Notes

- `success_guide_key`는 자동 매칭이 아니라 시연용 고정값으로 다루는 전제가 있습니다.
- seed 데이터 실제 삽입 여부는 **확인 필요**입니다.
- FE는 시연 시 `/analysis-result` 직접 진입보다 `/experiences/{id}` 기준 흐름을 우선 사용합니다.

## TODO

- seed SQL 또는 운영 입력 절차를 별도 문서로 보강
- 실제 시연용 experience id 목록 확정
