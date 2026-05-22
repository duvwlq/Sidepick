# BE-W1 작업 완료 정리

## 목적

고도화 1주차 백엔드 설계 산출물을 피벗 데이 제출 관점에서 모아두는 페이지다.

현재 문서는 티켓별 작업 결과, 산출물 링크, 완료 상태를 한 번에 확인하기 위한 용도다.

## 현재 상태 요약

### P0

- `BE-01` 문서 작성 완료, 팀장 확인 대기
- `BE-02` 문서 작성 완료, 팀장 확인 대기
- `BE-04` 문서 작성 완료, `.env.example` 반영 완료, 팀장 확인 대기
- `BE-07` 문서 작성 완료, 팀장 확인 대기

### P1

- `BE-03` 문서 초안 완료, Swagger 초안 포함
- `BE-05` 문서 초안 완료
- `BE-06` 문서 초안 완료, AI-05/정책 문서 반영 완료

## 티켓별 작업 완료

## GitHub 링크

- 레포지토리: [duvwlq/Sidepick](https://github.com/duvwlq/Sidepick)
- 기준 브랜치: [`main`](https://github.com/duvwlq/Sidepick/tree/main)
- 문서 반영 커밋:
  - [`31e9315` - BE-06, BE-07 문서 반영](https://github.com/duvwlq/Sidepick/commit/31e9315)
  - [`5ffb266` - BE 주차 설계 산출물 반영](https://github.com/duvwlq/Sidepick/commit/5ffb266)

### 산출물 링크

- [BE-01 DB 스키마 ERD](https://github.com/duvwlq/Sidepick/blob/main/docs/BE-01%20DB%20%EC%8A%A4%ED%82%A4%EB%A7%88%20ERD.md)
- [BE-01 마이그레이션 스크립트 초안](https://github.com/duvwlq/Sidepick/blob/main/docs/BE-01%20%EB%A7%88%EC%9D%B4%EA%B7%B8%EB%A0%88%EC%9D%B4%EC%85%98%20%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8%20%EC%B4%88%EC%95%88.sql)
- [BE-02 OAuth 구조 설계](https://github.com/duvwlq/Sidepick/blob/main/docs/BE-02%20OAuth%20%EA%B5%AC%EC%A1%B0%20%EC%84%A4%EA%B3%84.md)
- [BE-03 API 명세 문서](https://github.com/duvwlq/Sidepick/blob/main/docs/BE-03%20API%20%EB%AA%85%EC%84%B8%20%EB%AC%B8%EC%84%9C.md)
- [BE-03 Swagger 초안](https://github.com/duvwlq/Sidepick/blob/main/docs/BE-03%20Swagger%20%EC%B4%88%EC%95%88.yaml)
- [BE-04 환경 변수 명세](https://github.com/duvwlq/Sidepick/blob/main/docs/BE-04%20%ED%99%98%EA%B2%BD%20%EB%B3%80%EC%88%98%20%EB%AA%85%EC%84%B8.md)
- [BE-05 큐잉 인프라 설계 문서](https://github.com/duvwlq/Sidepick/blob/main/docs/BE-05%20%ED%81%90%EC%9E%89%20%EC%9D%B8%ED%94%84%EB%9D%BC%20%EC%84%A4%EA%B3%84%20%EB%AC%B8%EC%84%9C.md)
- [BE-06 가드레일 인프라 설계 문서](https://github.com/duvwlq/Sidepick/blob/main/docs/BE-06%20%EA%B0%80%EB%93%9C%EB%A0%88%EC%9D%BC%20%EC%9D%B8%ED%94%84%EB%9D%BC%20%EC%84%A4%EA%B3%84%20%EB%AC%B8%EC%84%9C.md)
- [BE-07 토큰 모니터링 명세](https://github.com/duvwlq/Sidepick/blob/main/docs/BE-07%20%ED%86%A0%ED%81%B0%20%EB%AA%A8%EB%8B%88%ED%84%B0%EB%A7%81%20%EB%AA%85%EC%84%B8.md)
- [BE-W1 작업 완료 정리](https://github.com/duvwlq/Sidepick/blob/main/docs/BE-W1%20%EC%9E%91%EC%97%85%20%EC%99%84%EB%A3%8C%20%EC%A0%95%EB%A6%AC.md)
- [.env.example](https://github.com/duvwlq/Sidepick/blob/main/.env.example)

### BE-01 DB 스키마 전체 설계

- 상태: `진행중`
- 산출물:
  - [BE-01 DB 스키마 ERD](./BE-01%20DB%20스키마%20ERD.md)
  - [BE-01 마이그레이션 스크립트 초안](./BE-01%20마이그레이션%20스크립트%20초안.sql)
- 작업 내용:
  - 회원가입 상세항목 확장 설계
  - 마이페이지 관련 컬럼 정리
  - 이미지 저장 구조 정리
  - 북마크/반응/알림/관심분야/성공사례/가이드/토큰 로그 테이블 설계
- 메모:
  - S3 전제는 제거했고 현재는 `image_url` 기반 구조로 정리
  - PM-03 반영으로 `guides` 테이블 선행 설계 포함
  - 팀장 확인 후 `팀장 확인 받음` 체크 예정

### BE-02 소셜 로그인 OAuth 구조 설계

- 상태: `진행중`
- 산출물:
  - [BE-02 OAuth 구조 설계](./BE-02%20OAuth%20구조%20설계.md)
- 작업 내용:
  - 카카오/구글 현재 구조 분석
  - 네이버 추가 방식 설계
  - `oauth2Login` 전환 여부 비교
  - `OAuthAuthService` 확장 방식 확정
- 메모:
  - 현재 JWT 구조와 일정 리스크를 고려해 구조 전환 대신 확장으로 정리

### BE-04 환경 변수 분리 설계

- 상태: `진행중`
- 산출물:
  - [BE-04 환경 변수 명세](./BE-04%20환경%20변수%20명세.md)
  - [.env.example](../.env.example)
- 작업 내용:
  - 모델/프롬프트/Mock/토큰/비용/큐잉/LangSmith 변수 정리
  - dev/prod 분리 전략 정리
  - PM 문서 기준 LangSmith APAC endpoint 반영
- 메모:
  - 실제 LangSmith API 키는 보안상 저장소에 저장하지 않음

### BE-07 토큰 모니터링 인프라 설계

- 상태: `진행중`
- 산출물:
  - [BE-07 토큰 모니터링 명세](./BE-07%20토큰%20모니터링%20명세.md)
- 작업 내용:
  - `user_token_usage`, `llm_request_logs` 구조 설계
  - 사용자/서비스 비용 cap 정리
  - 80% 경고, 100% Plan B 정책 정리
  - LangSmith metadata 추적 기준 정리

### BE-03 API 목록 전체 설계

- 상태: `진행중`
- 산출물:
  - [BE-03 API 명세 문서](./BE-03%20API%20명세%20문서.md)
- 작업 내용:
  - 현재 구현 API와 목표 API 분리
  - 회원/경험/통계/알림/에이전트/가이드 API 초안 정리
  - 요청/응답 예시 JSON 작성
  - Swagger 초안 YAML 작성
  - AI-02 기준 `stats` endpoint, `pre-start-warning` 반영

### BE-05 큐잉 인프라 설계

- 상태: `진행중`
- 산출물:
  - [BE-05 큐잉 인프라 설계 문서](./BE-05%20큐잉%20인프라%20설계%20문서.md)
- 작업 내용:
  - `BlockingQueue + worker pool + SSE` 구조 정리
  - 목표 동시 처리 10명 기준 정리
  - 대기 UX / timeout / fallback 흐름 정리

### BE-06 가드레일 인프라 설계

- 상태: `진행중`
- 산출물:
  - [BE-06 가드레일 인프라 설계 문서](./BE-06%20가드레일%20인프라%20설계%20문서.md)
- 작업 내용:
  - 입력/출력 금칙어 처리 구조
  - 카테고리 whitelist
  - PII 마스킹 정규식
  - `case_id` 인용 검증
  - 정책 문서 출처/안내 라벨 검증
  - 수치 검증 / case_id 존재 검증
  - 재생성 1회 규칙 정리

## 다음 액션

1. P0 문서 팀장 확인 받기
2. `BE-03` 통계 API의 `category` 입력을 한글명 vs slug 중 하나로 확정
3. 확인 결과 반영 후 해당 티켓 상태를 `완료`로 변경
