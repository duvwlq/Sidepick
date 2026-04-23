@echo off
setlocal

set "ROOT_DIR=%~dp0"
set "ROOT_DIR=%ROOT_DIR:~0,-1%"

docker run --rm ^
  -v "%ROOT_DIR%:/workspace" ^
  -w /workspace/server ^
  maven:3.9.9-eclipse-temurin-17 ^
  mvn %*

endlocal
