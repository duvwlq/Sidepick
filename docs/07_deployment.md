# 07. Deployment

## Current Deployment Shape

- Frontend: AWS Amplify
- Backend: AWS EC2 + Nginx + Spring Boot
- AI Server: FastAPI 별도 서버
- Database: AWS RDS MySQL
- Runtime / local ops: Docker Compose 기준 문서 존재

## Environment Variables

실제 값은 문서에 기록하지 않고 이름만 관리합니다.

예시:

- `VITE_API_BASE_URL`
- `VITE_KAKAO_CLIENT_ID`
- `APP_AUTH_LOCAL_ENABLED`
- `APP_AUTH_KAKAO_ENABLED`
- `APP_AUTH_GOOGLE_ENABLED`
- DB 접속 관련 환경변수
- AI 서버 접속 관련 환경변수

## Operational Notes

- 재배포 체크리스트는 기존 문서를 참고해 후속 최신화가 필요합니다.
- 민감정보가 있을 수 있는 접속 정보 문서는 archive 쪽으로 분리했습니다.

## Sources

- `배포_준비_전체_가이드.md`
- `docs/AWS-재배포-정리-체크리스트.md`
- `docs/백엔드-운영-안정화-체크리스트.md`
- `docs/환경-설정-문서.md`

## TODO

- 실제 운영 compose / reverse proxy 흐름 상세 보강
- 배포 순서와 점검 항목을 최신 기준으로 재작성
