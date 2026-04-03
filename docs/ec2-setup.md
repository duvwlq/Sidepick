# EC2 Setup Guide

This project currently runs on Docker Compose with PostgreSQL and Spring Boot.
Supabase can replace the local PostgreSQL container later by overriding datasource values in `.env`.

## Recommended Instance

- OS: Ubuntu 22.04 LTS
- Type: `t3.micro` for free-tier style testing
- Type: `t3.small` or higher for more stable remote builds
- Storage: 8 GB or more

## Required Security Group Rules

- `SSH / 22 / Your IP`
- `Custom TCP / 8081 / 0.0.0.0/0`

Optional during troubleshooting:

- `SSH / 22 / 0.0.0.0/0`

Remove the optional SSH rule after setup.

## Elastic IP

Attach an Elastic IP if the team will keep using the same server.
This avoids public IP changes after stop/start.

## Bootstrap Commands

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git vim openjdk-17-jdk
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
sudo apt-get update
sudo apt-get install -y docker-compose-plugin
```

Reconnect once after adding the `docker` group.

## Deploy Commands

If the repository is already on the server:

```bash
cd ~/Sidepick
git pull origin develop
cp .env.example .env
sudo docker compose -f infra/docker-compose.yml up -d --build
```

If the repository is copied from a local machine:

```bash
cd ~/Sidepick
cp .env.example .env
sudo docker compose -f infra/docker-compose.yml up -d --build
```

If the team uses Supabase instead of the local `postgres` container:

```bash
cp .env.example .env
vim .env
# replace SPRING_DATASOURCE_URL / USERNAME / PASSWORD with Supabase values
sudo docker compose -f infra/docker-compose.supabase.yml up -d --build
```

## Verification

```bash
sudo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
curl http://localhost:8081/api/health
```

Public endpoints:

- `http://<EC2_IP>:8081/api/health`
- `http://<EC2_IP>:8081/swagger-ui.html`
