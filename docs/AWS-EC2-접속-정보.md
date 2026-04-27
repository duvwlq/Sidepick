# AWS EC2 접속 정보

## 현재 운영 서버

- 인스턴스 이름: `sidepick-backend-prod`
- 운영체제: Ubuntu 22.04 LTS
- 인스턴스 타입: `t2.small`
- 리전: `ap-northeast-2`
- 퍼블릭 IP: `13.125.243.233`

## 접속 계정

- 사용자: `ubuntu`

## SSH 접속 예시

```bash
ssh -i <pem-파일-경로> ubuntu@13.125.243.233
```

예시:

```bash
ssh -i "D:\다운로드\sidepick-backend.pem" ubuntu@13.125.243.233
```

## 운영 경로

- 저장소 경로: `~/Sidepick`
- Docker 운영 배포 경로: `~/Sidepick/infra`
- 운영 환경변수 파일: `~/backend.env`

## 운영 실행 방식

- 백엔드: Docker Compose
- 프록시: Nginx
- 데이터베이스: AWS RDS MySQL

운영 백엔드 실행 명령:

```bash
cd ~/Sidepick/infra
docker compose --env-file ~/backend.env -f docker-compose.prod.yml up -d --build
```
