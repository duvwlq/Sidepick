# DB 스키마 가이드

## 현재 결정 사항

1주차 백엔드 부트스트랩은 MySQL 기준으로 구성되어 있습니다.
로컬 개발은 Docker Compose 기반 MySQL 8.4를 사용하고, 배포 역시 같은 MySQL 컨테이너 구성을 기준으로 진행합니다.

## 테이블 구성

### `users`

- 사용자 계정 식별 정보
- 닉네임 및 프로필 정보
- 활성화 여부
- 생성일 및 수정일

### `failure_experiences`

- 사용자가 등록한 실패 경험 본문
- 사업 유형, 투자 금액, 기간, 실패 원인
- 선택 입력인 시장 및 마케팅 정보
- 배운 점과 재도전 의사
- 공개 여부 및 조회 수, 좋아요 수

### `ai_analysis`

- 실패 경험 하나당 하나의 AI 분석 결과
- 실패 원인 태그
- 요약 리스트
- 위험 요소 분석
- 위험 점수

### `matched_cases`

- AI 분석 결과에 연결되는 유사 실패 사례
- 제목, 요약, 배울 점, 유사도

### `comments`

- 댓글 및 대댓글 구조
- 소프트 삭제 여부 포함

## 관계

- `users 1:N failure_experiences`
- `failure_experiences 1:1 ai_analysis`
- `ai_analysis 1:N matched_cases`
- `failure_experiences 1:N comments`
- `users 1:N comments`

## SQL 원본

- 스키마 파일: `infra/mysql/init/001_init.sql`

## 참고 사항

- JSON 형태 필드는 MySQL `JSON` 타입으로 저장합니다.
- JPA는 `ddl-auto: validate` 기준으로 동작합니다.
- 엔티티 필드명과 SQL 컬럼명은 현재 스키마 기준으로 맞춰져 있습니다.
- 현재 SQL은 로컬 Docker MySQL과 EC2 Docker 배포 기준으로 정리되어 있습니다.
