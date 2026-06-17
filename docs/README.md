# Sidepick Docs

Sidepick의 공식 문서 허브입니다.  
루트 README가 프로젝트 개요와 브랜딩을 담당한다면, 이 문서는 실제 개발·운영에 필요한 세부 문서로 연결되는 인덱스 역할을 합니다.

---

## Recommended Reading Order

1. [Project Overview](./00_project_overview.md)
2. [Current Architecture](./01_current_architecture.md)
3. [API Contract](./02_api_contract.md)
4. [Frontend Structure](./03_frontend_structure.md)
5. [Backend Structure](./04_backend_structure.md)
6. [AI Integration Contract](./05_ai_integration_contract.md)
7. [Deployment Guide](./07_deployment.md)

---

## Core Documents

| 문서 | 설명 |
| --- | --- |
| [00_project_overview.md](./00_project_overview.md) | MVP 범위와 핵심 사용자 흐름 |
| [01_current_architecture.md](./01_current_architecture.md) | 현재 서비스 아키텍처와 런타임 구조 |
| [02_api_contract.md](./02_api_contract.md) | 프론트-백엔드 API 계약 |
| [03_frontend_structure.md](./03_frontend_structure.md) | 프론트엔드 구조와 화면 책임 |
| [04_backend_structure.md](./04_backend_structure.md) | 백엔드 모듈 구조와 도메인 책임 |
| [05_ai_integration_contract.md](./05_ai_integration_contract.md) | 백엔드-AI 서버 연동 방식 |
| [BE-FE-AI-연결-하네스-설계.md](./BE-FE-AI-연결-하네스-설계.md) | 현재 FE/BE 실행 범위와 하네스 우선순위 정리 |
| [BE-37 알림 MVP 계약.md](./BE-37%20알림%20MVP%20계약.md) | 알림 MVP 범위와 API/이벤트 규칙 |
| [BE-40 에이전트 A 연결 계약.md](./BE-40%20에이전트%20A%20연결%20계약.md) | 질문 카드/Plan B 연결 계약 |
| [BE-41 성공사례 MVP 계약.md](./BE-41%20성공사례%20MVP%20계약.md) | 성공사례 리스트/상세 MVP 계약 |
| [BE-42 FAB 동작 규칙.md](./BE-42%20FAB%20동작%20규칙.md) | FAB 상태/라우팅 규칙 |
| [06_demo_seed_and_scenario.md](./06_demo_seed_and_scenario.md) | 데모/시드 데이터 운영 메모 |
| [07_deployment.md](./07_deployment.md) | 실제 운영 배포 경로와 배포 절차 |
| [db-schema.md](./db-schema.md) | DB 스키마와 마이그레이션 기준 |

---

## Operation Docs

| 문서 | 설명 |
| --- | --- |
| [../server/README.md](../server/README.md) | 백엔드 실행/운영 기준 문서 |
| [../server/HARNESS.md](../server/HARNESS.md) | 백엔드 smoke/ai/full 하네스 실행 기준 |
| [AWS-재배포-정리-체크리스트.md](./AWS-재배포-정리-체크리스트.md) | 운영 서버 재배포 체크리스트 |
| [../배포_준비_전체_가이드.md](../배포_준비_전체_가이드.md) | 배포 준비 전체 가이드 |

---

## AI Asset Map

| 경로 | 설명 |
| --- | --- |
| [../ai/data/case_metadata_v2.json](../ai/data/case_metadata_v2.json) | FAISS 검색 대상 케이스 메타데이터 |
| [../ai/data/faiss_index_v2.bin](../ai/data/faiss_index_v2.bin) | SBERT 기반 유사 사례 검색 인덱스 |
| [../ai/data/success_analysis_drafts.json](../ai/data/success_analysis_drafts.json) | 성공사례 추천 설명 자산 |
| [../ai/data/failure_pattern.json](../ai/data/failure_pattern.json) | 실패 패턴 통계 집계 데이터 |
| [../ai/data/failure_timing.json](../ai/data/failure_timing.json) | 실패 시점 통계 집계 데이터 |
| [../ai/pipeline/25_rebuild_faiss_v2.py](../ai/pipeline/25_rebuild_faiss_v2.py) | v2 인덱스 재생성 파이프라인 |
| [../ai/pipeline/26_generate_success_analysis_full.py](../ai/pipeline/26_generate_success_analysis_full.py) | 성공사례 분석글 생성 파이프라인 |
| [../ai/pipeline/27_generate_explanation_samples.py](../ai/pipeline/27_generate_explanation_samples.py) | explanation 샘플 생성 파이프라인 |
| [../ai/server/explanation_builder.py](../ai/server/explanation_builder.py) | 분석/유사사례/통계 explanation 빌더 |
| [../ai/server/chatbot_api.py](../ai/server/chatbot_api.py) | 챗봇 API 진입점 |

---

## Notes

- 현재 운영 기준은 `infra/docker-compose.prod.yml`과 서버의 `/home/ubuntu/sidepick-docker/.env`를 중심으로 봅니다.
- API 계약은 현재 `share-page`, `share-image`, 프로필 이미지 업로드, admin ops API까지 반영된 상태를 기준으로 봅니다.
- 문서 간 내용이 충돌할 경우, 운영 경로와 Compose 기준이 명시된 최신 문서를 우선합니다.
- `archive/` 아래 문서는 과거 참고용이며 현재 운영 구조와 다를 수 있습니다.

---

## Archive

- [archive/README.md](./archive/README.md)

아카이브 문서는 과거 실험, 이전 운영 방식, 폐기된 설계 메모를 보관합니다.
