# MySQL DB 스키마 설계

## 설계 범위

- 사용자
- 실패 경험 게시글
- AI 분석 결과
- 유사 실패 사례
- 댓글

## 테이블 구성

### `users`

- 사용자 기본 정보
- 이메일, 닉네임 유니크 제약
- 연령대, 프로필 이미지, 활성 상태 저장

### `failure_experiences`

- 사용자가 작성한 실패 경험 게시글
- 투자금, 기간, 실패 원인, 시장, 마케팅 채널 등 저장
- 공개 여부와 카운트 컬럼 포함

### `ai_analysis`

- 게시글별 AI 분석 결과
- 실패 원인 태그, 3줄 요약, 리스크 점수 저장

### `matched_cases`

- 분석 결과와 연결되는 유사 실패 사례
- 유사도와 핵심 교훈 저장

### `comments`

- 게시글 댓글 및 대댓글
- 삭제 여부 플래그 저장

## 관계

- `users 1:N failure_experiences`
- `failure_experiences 1:1 ai_analysis`
- `ai_analysis 1:N matched_cases`
- `failure_experiences 1:N comments`
- `users 1:N comments`

## 인덱스

- `failure_experiences.user_id`
- `failure_experiences.business_type`
- `failure_experiences.created_at`
- `ai_analysis.experience_id`
- `comments.experience_id`

