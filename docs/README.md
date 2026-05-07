# SidePick Docs

이 폴더는 **현재 MVP 기준으로 믿고 볼 수 있는 문서**만 모아둔 공식 문서 인덱스입니다.

최신 구현 판단은 아래 문서 기준으로만 합니다.

- [00_project_overview.md](./00_project_overview.md)
- [01_current_architecture.md](./01_current_architecture.md)
- [02_api_contract.md](./02_api_contract.md)
- [03_frontend_structure.md](./03_frontend_structure.md)
- [04_backend_structure.md](./04_backend_structure.md)
- [05_ai_integration_contract.md](./05_ai_integration_contract.md)
- [06_demo_seed_and_scenario.md](./06_demo_seed_and_scenario.md)
- [07_deployment.md](./07_deployment.md)

## Reading Order

1. 프로젝트 전체를 이해하려면 [00_project_overview.md](./00_project_overview.md)
2. 현재 시스템 구조를 보려면 [01_current_architecture.md](./01_current_architecture.md)
3. FE-BE 계약을 확인하려면 [02_api_contract.md](./02_api_contract.md)
4. 시연 기준을 보려면 [06_demo_seed_and_scenario.md](./06_demo_seed_and_scenario.md)

## Archive

- [archive/README.md](./archive/README.md)

`archive/` 아래 문서는 **과거 참고용**입니다.
현재 구현과 다를 수 있으므로, 최신 동작 판단 기준으로 사용하면 안 됩니다.

## Notes

- 현재 공식 분석 리포트 endpoint는 `GET /api/reports/{experienceId}` 기준입니다.
- `reportStatus`는 `READY`, `NOT_READY`, `ERROR`를 기준으로 문서화합니다.
- 일부 운영/시연 정보는 실제 배포 환경과 대조가 더 필요하므로 각 문서에 `TODO` 또는 `확인 필요`로 표시했습니다.
