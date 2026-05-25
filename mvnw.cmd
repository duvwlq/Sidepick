@echo off
setlocal

set "ROOT_DIR=%~dp0"
set "ROOT_DIR=%ROOT_DIR:~0,-1%"
set "DOCKER_EXE=C:\Program Files\Docker\Docker\resources\bin\docker.exe"

where mvn >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  mvn %*
  exit /b %ERRORLEVEL%
)

if not exist "%DOCKER_EXE%" (
  echo [mvnw] Maven was not found on PATH and Docker Desktop is not installed.
  echo [mvnw] Install Maven locally or install Docker Desktop, then rerun this command.
  exit /b 1
)

"%DOCKER_EXE%" version >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo [mvnw] Maven was not found on PATH and Docker Desktop is not available.
  echo [mvnw] Install Maven locally or start Docker Desktop, then rerun this command.
  exit /b 1
)

"%DOCKER_EXE%" run --rm ^
  -v "%ROOT_DIR%:/workspace" ^
  -w /workspace/server ^
  maven:3.9.9-eclipse-temurin-17 ^
  mvn %*

endlocal
