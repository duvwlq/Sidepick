# Work Summary

## Scope

This document summarizes the backend work completed so far for the FailForward project.
The repository is currently aligned to a MySQL-based backend using Spring Boot, Docker Compose, and AWS EC2.

## Completed Work

### Repository and Workflow

- Created and configured the GitHub repository
- Standardized team work on the `develop` branch
- Organized project structure for `server`, `infra`, `docs`, and `scripts`

### Backend Bootstrap

- Bootstrapped a Spring Boot 3.2 backend with Java 17
- Configured application settings for MySQL and Docker profile execution
- Exposed Swagger UI and health check endpoints

### Database

- Designed the initial MySQL schema based on the planning document
- Added SQL bootstrap script at `infra/mysql/init/001_init.sql`
- Reflected the schema in core JPA entities

### API Skeleton

- Added common API response and exception handling classes
- Added controller, service, repository, and DTO skeletons for:
  - authentication
  - users
  - categories
  - failure experiences
  - AI analysis
  - similar case comparison
  - decision records
  - interactions
  - comments
- Updated the API structure document to match the current endpoint set

### Local Environment

- Configured Docker Compose for backend and MySQL local execution
- Added helper scripts for local start and stop
- Added a Docker-based Maven wrapper to build without requiring local Maven installation

## Verification Status

### Local Verification

- Local Docker execution confirmed
- Backend container startup confirmed
- MySQL container startup confirmed
- Swagger UI reachable at `http://localhost:8081/swagger-ui.html`
- Health endpoint reachable at `http://localhost:8081/api/health`
- Compile and package verification completed through `.\mvnw.cmd -DskipTests package`

### EC2 Verification

- EC2 instances were created and base environment setup was attempted
- Docker-based deployment was executed on EC2
- Container startup logs were observed
- Final external API verification on low-spec free-tier instances was unstable due to memory constraints

## Current Decisions

- Database direction is MySQL
- Supabase is not used in the current backend scope
- Deployment target remains AWS EC2 with Docker
- Full authentication and AI production logic are deferred to later implementation stages

## Submission Resources

1. GitHub Repository
   - `https://github.com/duvwlq/Sidepick`
2. EC2 Access Information
   - Elastic IP used during setup: `13.209.95.216`
3. Database Direction
   - MySQL 8.4 with Docker Compose
4. API Structure
   - `docs/api-structure.md`
5. Environment Setup Document
   - `README.md`

## Next Steps

- Replace stub auth with Spring Security and JWT
- Connect controllers to real domain rules and persistence behavior
- Integrate the backend with frontend requirements after receiving frontend work
- Revisit EC2 deployment with either a lighter runtime strategy or a larger instance type
