#!/usr/bin/env bash
set -euo pipefail

sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git vim openjdk-17-jdk
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
sudo apt-get update
sudo apt-get install -y docker-compose-plugin

echo "Bootstrap complete. Reconnect once before running docker without sudo."
