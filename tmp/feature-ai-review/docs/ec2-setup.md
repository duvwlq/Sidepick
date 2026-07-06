# AWS EC2 서버 생성 가이드

## 목표

- Ubuntu 기반 EC2 생성
- Docker / Docker Compose 설치
- 보안 그룹 최소 개방
- 배포용 서버 접속 준비

## 권장 스펙

- AMI: Ubuntu 24.04 LTS
- Instance Type: `t3.small` 또는 `t3.medium`
- Storage: 30GB gp3

## 보안 그룹

- `22/tcp`: 본인 IP만 허용
- `80/tcp`: 전체 허용
- `443/tcp`: 전체 허용
- `3306/tcp`: 외부 미개방 권장

## 생성 절차

1. AWS Console에서 EC2 인스턴스 생성
2. 키 페어 생성 및 다운로드
3. 보안 그룹 설정
4. Elastic IP 연결 여부 결정

## 서버 초기 접속

```bash
ssh -i <key.pem> ubuntu@<ec2-public-ip>
```

## 필수 패키지

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg
```

## Docker 설치

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker ubuntu
```

## 점검

```bash
docker --version
docker compose version
```

## 운영 메모

- DB는 EC2 내부 Docker network로만 노출하는 구성이 안전합니다.
- 애플리케이션 배포 시 `nginx + app container + mysql container` 구조 권장입니다.
- `.env`, SSH 키, DB 비밀번호는 절대 GitHub에 올리지 않습니다.

