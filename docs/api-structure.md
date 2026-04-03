# API Structure

## Base

- Base URL: `/api`
- Response format: `application/json`

## Implemented for Week 1

- `GET /api/health`

## Planned Auth API

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/users/me`
- `PATCH /api/users/me`

## Planned Failure Experience API

- `POST /api/experiences`
- `GET /api/experiences`
- `GET /api/experiences/{experienceId}`
- `PATCH /api/experiences/{experienceId}`
- `DELETE /api/experiences/{experienceId}`

## Planned AI Analysis API

- `POST /api/experiences/{experienceId}/analysis`
- `GET /api/experiences/{experienceId}/analysis`
- `GET /api/analysis/{analysisId}/matched-cases`

## Planned Comment API

- `POST /api/experiences/{experienceId}/comments`
- `POST /api/comments/{commentId}/replies`
- `PATCH /api/comments/{commentId}`
- `DELETE /api/comments/{commentId}`

## Notes

- Security and JWT are not implemented yet
- Week 1 scope currently covers schema, infrastructure, entity mapping, and health endpoint
