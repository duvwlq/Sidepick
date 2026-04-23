#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

docker run --rm \
  -v "$ROOT_DIR:/workspace" \
  -w /workspace/server \
  maven:3.9.9-eclipse-temurin-17 \
  mvn "$@"
