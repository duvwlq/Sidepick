# DB Schema Guide

## Current Decision

The week 1 backend bootstrap is built on MySQL, not Supabase/PostgreSQL.
This matches the top-level task requirement for MySQL schema design and server infrastructure.

## Tables

### `users`

- account identity
- nickname and profile info
- active flag
- created and updated timestamps

### `failure_experiences`

- main user post for a failure experience
- business type, investment, duration, failure reason
- optional market and marketing data
- lessons learned and retry intent
- public flag and counters

### `ai_analysis`

- one analysis record per failure experience
- failure reason tags
- summary list
- risk factor analysis
- risk score

### `matched_cases`

- similar failure cases linked to an AI analysis
- title, summary, lesson, match rate

### `comments`

- comments and nested replies
- soft delete flag

## Relationships

- `users 1:N failure_experiences`
- `failure_experiences 1:1 ai_analysis`
- `ai_analysis 1:N matched_cases`
- `failure_experiences 1:N comments`
- `users 1:N comments`

## SQL Source

- Schema file: `infra/mysql/init/001_init.sql`

## Notes

- JSON-shaped fields are stored with MySQL `JSON`
- JPA runs with `ddl-auto: validate`
- Schema and entity field names are aligned to the SQL file
