# BE-W2 작업 체크리스트

기준일: 2026-06-04

## 상태 기준

- `완료`: 코드 반영 + 빌드/테스트 또는 실사용 플로우 검증 완료
- `부분 완료`: 코드/화면은 있으나 남은 실플로우 또는 외부 확인이 있음
- `검증 대기`: 기능 구현은 끝났고 외부 환경 확인만 남음
- `미완료`: 본격 구현이 아직 남아 있음

## W1 후속 정합화

- `BE-08` 완료
- `BE-09` 검증 대기
  - SQL 반영 완료
  - 테스트 DB 적용 확인만 남음
- `BE-10` 검증 대기
  - enum/정규식 반영 완료
  - 샘플 응답 검증 테스트만 남음
- `BE-11` 완료
- `BE-12` 검증 대기
  - `/api` prefix 정리 완료
  - Swagger UI 확인만 남음
- `BE-21` 완료 후보
  - 명세 문서 정리 완료
  - 팀장 최종 확인만 남음

## W2 본 작업

- `BE-13` 부분 완료
  - 단계형 회원가입 화면과 `/api/auth/signup` 구현
  - 카카오 첫 단계 진입 마찰 완화 반영
  - 전체 실환경 분기 재검증은 별도 확인 필요
- `BE-14` 부분 완료
  - 카카오/구글/네이버 OAuth 구현
  - 신규/기존 사용자 분기 구현
  - 실환경 최종 검증만 남음
- `BE-15` 부분 완료
  - 마이페이지 작성글/북마크/최근 본 글/AI 분석 연결
  - 계정 설정 DoD와 PD 최종 판정은 남음
- `BE-16` 완료
  - 북마크 토글 API
  - 북마크 카운트 즉시 반영
  - 마이페이지/overview 동기화
- `BE-17` 완료
  - `HEART`, `TEAR` 반응 API
  - 사용자당 1회 제한
  - Explore 카드와 Detail 상세 반응 버튼 연결
- `BE-18` 완료
  - `PUT /api/experiences/{id}` 사용
  - `/create?experienceId={id}` 수정 진입
  - 수정 완료 후 상세 복귀
- `BE-19` 완료
  - `/create` 가이드형 글쓰기 화면 유지
  - 예시 카드를 `ExampleCard` 컴포넌트로 분리
  - 카테고리/조건/어려움+자율서술 흐름 정리
- `BE-20` 완료
  - 전화번호/이메일/주민번호 마스킹
  - 저장/수정 경로 적용
  - 테스트 반영

## W3 후속

- `BE-22` 부분 완료
  - stats API 2개 구현
  - Explore lazy load/세션 캐시/안내 카드 구현
  - 실제 `failure_pattern.json`, `failure_timing.json` 연동만 남음
- `BE-23` 완료
  - `GET /api/users/me/analysis-history`
  - 마이페이지 preview/full list 연결
  - `READY` 항목 클릭 시 분석 섹션 실사용 진입
- `BE-24` 완료
  - `/api/experiences/search`
  - `/api/experiences/cases/search`
  - Explore 검색 연결
- `BE-25` 완료
  - compare endpoint 연결
  - 성공사례 비교 인사이트 섹션 반영
- `BE-26` 완료
  - `/api/users/me/home-feed`
  - 개인화 추천 + fallback
- `BE-27` 완료
  - `/api/agent-a/analyze-draft`
  - 임시 slot 8종
  - `200/400/401/429` 테스트
- `BE-28` 완료
  - 인덱스 재생성 성공
  - 검색 테스트 성공
  - 캐시 우선 로딩으로 운영 로그 개선 반영
- `BE-29` 완료
  - Explore 통계 섹션에 실패 패턴/시점 그래프 연결
  - `peak_bucket` 강조

## 남은 핵심 잔여

- `BE-09`, `BE-10`, `BE-12`, `BE-21`: 외부 확인성 잔여
- `BE-13`, `BE-14`, `BE-15`: 실환경/PD 검증 잔여
- `BE-22`: 실제 AI JSON 입력 파일 반영 잔여
