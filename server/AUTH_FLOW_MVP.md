# Sidepick 인증 흐름 MVP

## 개요

이 문서는 현재 MVP 기준의 프론트엔드-백엔드 인증 흐름을 정의합니다.

현재 지원하는 로그인 방식:

- 이메일/비밀번호 회원가입 및 로그인
- 카카오 OAuth 로그인
- 구글 OAuth 로그인

현재 제외된 항목:

- 휴대폰 OTP 인증
- 통신사/실명 기반 본인확인

## 이메일 회원가입 흐름

1. 프론트엔드가 `POST /api/auth/register`를 호출합니다.
2. 백엔드가 로컬 사용자를 생성하고 즉시 토큰을 반환합니다.
3. 응답에는 `emailVerificationRequired=true`가 포함됩니다.
4. 프론트엔드가 `POST /api/auth/email-verifications`를 호출합니다.
5. 사용자가 인증 코드를 입력합니다.
6. 프론트엔드가 `POST /api/auth/email-verifications/confirm`를 호출합니다.
7. 인증 완료 후 현재 세션을 유지하거나 필요 시 다시 로그인시킵니다.

## 이메일 로그인 흐름

1. 프론트엔드가 `POST /api/auth/login`을 호출합니다.
2. `emailVerified=false`여도 백엔드는 토큰을 반환합니다.
3. 프론트엔드는 아래 값을 반드시 확인해야 합니다.

- `data.emailVerificationRequired`
- `data.user.emailVerified`

4. 계정이 미인증 상태면 아래 UI가 필요합니다.

- 인증 필요 안내
- 인증 메일 재전송 동작
- 쓰기 기능 제한 안내

## 이메일 인증 정책

- 미인증 사용자도 로그인은 가능
- 미인증 사용자는 경험 등록/수정/삭제 불가
- 읽기 중심 기능은 사용 가능

## 카카오 로그인 흐름

1. 프론트엔드가 카카오 인가 단계를 완료합니다.
2. 프론트엔드가 `code`를 전달받습니다.
3. 프론트엔드가 `POST /api/auth/oauth/kakao`를 호출합니다.

요청 예시:

```json
{
  "code": "kakao-auth-code",
  "redirectUri": "https://your-frontend.example.com/auth/kakao/callback"
}
```

4. 백엔드가 카카오 토큰 교환 API를 호출합니다.
5. 백엔드가 카카오 사용자 정보 API를 호출합니다.
6. 백엔드가 Sidepick 사용자 계정을 조회하거나 생성합니다.
7. 백엔드가 Sidepick JWT 토큰을 반환합니다.

## 구글 로그인 흐름

1. 프론트엔드가 구글 OAuth 인가 단계를 완료합니다.
2. 프론트엔드가 `code`를 전달받습니다.
3. 프론트엔드가 `POST /api/auth/oauth/google`를 호출합니다.

요청 예시:

```json
{
  "code": "google-auth-code",
  "redirectUri": "https://your-frontend.example.com/auth/google/callback"
}
```

4. 백엔드가 구글 토큰 교환 API를 호출합니다.
5. 백엔드가 구글 사용자 정보 API를 호출합니다.
6. 백엔드가 Sidepick 사용자 계정을 조회하거나 생성합니다.
7. 백엔드가 Sidepick JWT 토큰을 반환합니다.

## 인증 응답 규격

모든 인증 성공 응답은 동일한 구조를 반환합니다.

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

## 프론트엔드 적용 규칙

- 항상 `authProvider`, `emailVerified`, `emailVerificationRequired`를 기준으로 분기합니다.
- 이메일 미인증 상태여도 탐색과 조회는 허용합니다.
- 경험 등록, 수정, 삭제 진입은 이메일 미인증 로컬 계정에서 막아야 합니다.
- 소셜 로그인 사용자는 인증된 계정처럼 처리합니다.

## 필수 서버 환경 변수

- `APP_OAUTH_KAKAO_CLIENT_ID`
- `APP_OAUTH_KAKAO_CLIENT_SECRET`
- `APP_OAUTH_GOOGLE_CLIENT_ID`
- `APP_OAUTH_GOOGLE_CLIENT_SECRET`

## 참고 사항

- 현재 백엔드는 `APP_EMAIL_VERIFICATION_EXPOSE_CODE=true`인 비운영 환경에서 인증 코드를 응답에 노출할 수 있습니다.
- 실제 메일 발송을 붙인 뒤에는 `APP_EMAIL_VERIFICATION_EXPOSE_CODE=false`로 전환해야 합니다.
