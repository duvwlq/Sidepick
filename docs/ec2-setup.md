# AWS EC2 서버 생성 및 초기 설정

## 권장 인스턴스 설정

- Instance Type: `t3.medium`
- AMI: `Ubuntu 22.04 LTS`
- Storage: `20GB gp3`

## Security Group

- SSH `22`: 본인 IP만 허용
- HTTP `80`: 전체 허용
- HTTPS `443`: 전체 허용
- Custom `8080`: API 테스트용 임시 허용
- Custom `3000`: 프론트 확인용 임시 허용

## 서버 접속

```bash
ssh -i failforward-key.pem ubuntu@your-ec2-ip
```

## 초기 설정

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git vim
sudo apt install -y openjdk-17-jdk
java -version
```

## Docker 설치

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
```

## Docker Compose 플러그인 설치

```bash
sudo apt-get update
sudo apt-get install -y docker-compose-plugin
docker compose version
```

## 배포 메모

- 운영 DB는 외부 공개 포트를 열지 않는 구성을 권장합니다.
- 운영에서는 `nginx + spring boot + mysql` 구조를 권장합니다.
- `.env`는 서버 내부에만 저장합니다.

