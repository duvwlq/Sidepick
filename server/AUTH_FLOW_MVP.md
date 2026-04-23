# Sidepick Auth Flow MVP

## Overview

This document defines the frontend-to-backend auth flow for the current MVP.

Supported sign-in methods:

- Email/password sign-up and login
- Kakao OAuth login
- Google OAuth login

Deferred:

- Phone OTP verification
- Carrier / identity verification

## Email Sign-up Flow

1. Frontend calls `POST /api/auth/register`
2. Backend creates a local user and returns tokens immediately
3. Backend response contains `emailVerificationRequired=true`
4. Frontend calls `POST /api/auth/email-verifications`
5. User enters the verification code
6. Frontend calls `POST /api/auth/email-verifications/confirm`
7. After confirmation, frontend may keep the current session or re-login

## Email Login Flow

1. Frontend calls `POST /api/auth/login`
2. Backend returns tokens even if `emailVerified=false`
3. Frontend must check:
   - `data.emailVerificationRequired`
   - `data.user.emailVerified`
4. If the account is not verified, frontend should show:
   - verification prompt
   - resend verification action
   - limited access messaging

## Email Verification Policy

- Unverified users can log in
- Unverified users cannot write experiences
- Read-only actions remain available

## Kakao Login Flow

1. Frontend completes Kakao authorize step
2. Frontend receives `code`
3. Frontend calls `POST /api/auth/oauth/kakao`

Request example:

```json
{
  "code": "kakao-auth-code",
  "redirectUri": "https://your-frontend.example.com/auth/kakao/callback"
}
```

4. Backend exchanges the code for an access token with Kakao
5. Backend calls Kakao user info API
6. Backend finds or creates the Sidepick user
7. Backend returns Sidepick JWT tokens

## Google Login Flow

1. Frontend completes Google OAuth authorize step
2. Frontend receives `code`
3. Frontend calls `POST /api/auth/oauth/google`

Request example:

```json
{
  "code": "google-auth-code",
  "redirectUri": "https://your-frontend.example.com/auth/google/callback"
}
```

4. Backend exchanges the code for Google tokens
5. Backend calls Google user info API
6. Backend finds or creates the Sidepick user
7. Backend returns Sidepick JWT tokens

## Auth Payload Contract

All successful auth endpoints return the same payload shape:

```json
{
  "success": true,
  "message": "Login succeeded.",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "nickname": "sidepicker",
      "ageGroup": "20s",
      "profileImage": null,
      "authProvider": "LOCAL",
      "emailVerified": false,
      "profileCompleted": true,
      "createdAt": "2026-04-23T12:34:56"
    },
    "tokenType": "Bearer",
    "accessToken": "jwt",
    "refreshToken": "jwt",
    "accessTokenExpiresIn": 3600,
    "emailVerificationRequired": true
  }
}
```

## Frontend Rules

- Always branch on `authProvider`, `emailVerified`, and `emailVerificationRequired`
- Allow browsing even if email is not verified
- Block experience write entry points for unverified local users
- For social users, treat login as verified

## Required Server Environment Values

- `APP_OAUTH_KAKAO_CLIENT_ID`
- `APP_OAUTH_KAKAO_CLIENT_SECRET` optional depending on Kakao app configuration
- `APP_OAUTH_GOOGLE_CLIENT_ID`
- `APP_OAUTH_GOOGLE_CLIENT_SECRET`

## Notes

- The current backend exposes the email verification code in non-production configuration when `APP_EMAIL_VERIFICATION_EXPOSE_CODE=true`
- Set `APP_EMAIL_VERIFICATION_EXPOSE_CODE=false` when a real mail sender is connected
