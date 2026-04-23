# Frontend Auth Handoff

This note is for the frontend integration step after the login UI is ready.

## Supported Backend Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/email-verifications`
- `POST /api/auth/email-verifications/confirm`
- `POST /api/auth/oauth/kakao`
- `POST /api/auth/oauth/google`

Base URL:

- production: `https://api.side-pick.app/api`
- local: backend local API base if running locally

## Kakao Login Flow

1. Redirect browser to:

```text
https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=<VITE_KAKAO_CLIENT_ID>&redirect_uri=<registered-callback-uri>
```

2. Kakao redirects back to the frontend callback URI with `?code=...`
3. Frontend extracts `code`
4. Frontend calls:

```http
POST /api/auth/oauth/kakao
Content-Type: application/json
```

```json
{
  "code": "<authorization-code>",
  "redirectUri": "http://localhost:5173/auth/kakao/callback"
}
```

5. Store:
- `accessToken`
- `refreshToken`
- `user`

## Auth Response Fields The Frontend Must Use

- `data.user.authProvider`
- `data.user.emailVerified`
- `data.user.profileCompleted`
- `data.emailVerificationRequired`

## Email Verification Policy

- Local users can log in before verification
- Unverified local users should be blocked from experience creation/edit/delete entry points
- Browsing remains available

## OAuth Redirect URI Rule

The `redirectUri` sent to the backend must exactly match the value registered in Kakao or Google.

## Current Kakao Local Callback

- `http://localhost:5173/auth/kakao/callback`
