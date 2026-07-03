# MySQL DB 스키마 설계

## 설계 범위

- 회원
- 소셜 로그인 연동
- 게시글
- AI 분석 결과

## 테이블

### `users`

- 사용자 기본 정보
- 로그인 ID 기준 회원가입 지원
- 닉네임, 이메일, 전화번호 관리

### `social_accounts`

- 네이버 / 카카오 / 구글 계정 연동 정보
- 한 유저가 여러 소셜 계정을 연결할 수 있는 구조

### `posts`

- 부업 경험 게시글
- 실패 경험 / 계획 / 카테고리 / 상태 저장

### `analysis_results`

- 게시글별 AI 분석 결과
- 실패 요인 TOP3, 주의 문구, 위험 점수 저장

## 관계

- `users 1:N posts`
- `users 1:N social_accounts`
- `posts 1:1 analysis_results`

## 인덱스 기준

- `users.login_id`: unique
- `users.email`: unique
- `users.nickname`: unique
- `social_accounts(provider, provider_user_id)`: unique
- `posts.user_id`, `posts.category`, `posts.created_at`
- `analysis_results.post_id`: unique

## 비고

- `gender`, `birth_date`, `has_side_hustle_experience`는 통계 및 개인화 분석용 필드입니다.
- 분석 결과는 재생성될 수 있으므로 `analysis_version`, `generated_at` 추적이 필요합니다.

