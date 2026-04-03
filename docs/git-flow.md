# Git Flow Guide

## Default Branches

- `main`: production-ready history
- `develop`: integration branch for team work

## Feature Branch Naming

- `feature/<topic>`
- `fix/<topic>`
- `docs/<topic>`

Examples:

- `feature/setup-project`
- `feature/database-schema`
- `feature/docker-setup`

## Daily Workflow

```bash
git checkout develop
git pull origin develop
git checkout -b feature/<topic>
```

Work on your branch, then:

```bash
git add .
git commit -m "type: short summary"
git push -u origin feature/<topic>
```

## Commit Message Style

- `feat: ...`
- `fix: ...`
- `docs: ...`
- `chore: ...`
- `refactor: ...`
- `test: ...`

## Team Rules

- Start from the latest `develop`
- Do not commit `.env`
- Do not commit local IDE settings
- Keep infrastructure and schema changes documented in `docs/`
