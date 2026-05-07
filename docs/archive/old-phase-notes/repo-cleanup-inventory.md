# Repo Cleanup Inventory

This file records which loose files are safe to keep, review later, or clean up after confirmation.

## Keep

These are active or newly useful files.

- `server/AUTH_FLOW_MVP.md`
- `server/README.md`
- `README.md`
- `infra/mysql/migrations/003_auth_and_experience_mvp_update.sql`
- `screenshots/backend_presentation/*`

## Keep For Product/UI Reference

These appear useful as reference assets while frontend work is still ongoing.

- `screenshots/home.png`
- `screenshots/detail.png`
- `screenshots/create.png`

## Review Before Deleting

These look like one-off notes, handoff drafts, or duplicated reference docs, but they may still have project value.

- `server/PR_설명_초안.md`
- `server/백엔드_단계별_개발_및_테스트_결과.md`
- `server/분석_API_재검증_체크리스트.md`
- `server/스웨거_API_테스트_결과.md`
- `server/포스트맨_요청_예시.md`
- `server/postman-examples.md`
- `server/Sidepick-MVP.postman_collection.json`
- `server/사이드픽_MVP_백엔드_포스트맨_컬렉션.json`
- `server/AI_서버_API_확정_스펙.md`
- other loose Korean markdown notes under `server/`

## Cleanup Rule

Only delete a loose document or screenshot when one of the following is true:

1. Its content is fully replaced by a current canonical document.
2. It is clearly a generated artifact or temporary export.
3. The owner confirms it is no longer needed.

## Current Recommendation

- Do not delete loose markdown notes yet.
- Do not delete screenshots yet.
- Prefer consolidating key information into canonical docs first.
