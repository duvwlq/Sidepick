# EC2 설정 가이드

현재 프로젝트는 MySQL과 Spring Boot를 Docker Compose로 실행하는 구조를 사용합니다.

## 권장 인스턴스

- OS: Ubuntu 22.04 LTS
- 무료 범위 테스트용: `t3.micro`
- 보다 안정적인 원격 빌드용: `t3.small` 이상
- 스토리지: 8GB 이상

## 필수 보안 그룹 규칙

- `SSH / 22 / 내 IP`
- `Custom TCP / 8081 / 0.0.0.0/0`

문제 해결용으로 일시적으로 아래 규칙을 열 수 있습니다.

- `SSH / 22 / 0.0.0.0/0`

설정이 끝나면 임시 SSH 규칙은 다시 제거하는 것을 권장합니다.

## Elastic IP

같은 서버를 계속 사용할 예정이라면 Elastic IP를 연결하는 것이 좋습니다.
이렇게 하면 인스턴스를 중지 후 다시 시작해도 공인 IP가 바뀌지 않습니다.

## 초기 설정 명령

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git vim openjdk-17-jdk
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
sudo apt-get update
sudo apt-get install -y docker-compose-plugin
```

`docker` 그룹 추가 후에는 한 번 다시 접속하는 것이 좋습니다.

## 배포 명령

저장소가 서버에 이미 있는 경우:

```bash
cd ~/Sidepick
git pull origin develop
cp .env.example .env
sudo docker compose -f infra/docker-compose.yml up -d --build
```

로컬에서 프로젝트를 복사해 둔 경우:

```bash
cd ~/Sidepick
cp .env.example .env
sudo docker compose -f infra/docker-compose.yml up -d --build
```

## 확인 명령

```bash
sudo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
curl http://localhost:8081/api/health
```

외부 확인 주소:

- `http://<EC2_IP>:8081/api/health`
- `http://<EC2_IP>:8081/swagger-ui.html`
