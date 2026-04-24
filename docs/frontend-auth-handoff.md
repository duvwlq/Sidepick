# 프론트 인증 연동 메모

이 문서는 로그인 UI가 준비된 뒤 프론트엔드와 백엔드를 연결할 때 참고하는 연동 메모입니다.

## 지원하는 백엔드 엔드포인트

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/email-verifications`
- `POST /api/auth/email-verifications/confirm`
- `POST /api/auth/oauth/kakao`
- `POST /api/auth/oauth/google`

기준 주소:

- 운영: `https://api.side-pick.app/api`
- 로컬: 로컬에서 실행 중인 백엔드 API 주소

## 카카오 로그인 흐름

1. 프론트엔드에서 아래 주소로 브라우저를 이동시킵니다.

```text
https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=<VITE_KAKAO_CLIENT_ID>&redirect_uri=<등록된_콜백_URI>
```

2. 카카오 로그인 완료 후 프론트 콜백 URI로 `?code=...`가 전달됩니다.
3. 프론트엔드가 `code` 값을 추출합니다.
4. 프론트엔드가 아래 엔드포인트를 호출합니다.

```http
POST /api/auth/oauth/kakao
Content-Type: application/json
```

```json
{
  "code": "<인가 코드>",
  "redirectUri": "http://localhost:5173/auth/kakao/callback"
}
```

5. 응답으로 받은 아래 값을 저장합니다.

- `accessToken`
- `refreshToken`
- `user`

## 구글 로그인 흐름

1. 프론트엔드에서 구글 OAuth 인가 과정을 수행합니다.
2. 구글 로그인 완료 후 프론트 콜백 URI로 `code`를 전달받습니다.
3. 프론트엔드가 아래 엔드포인트를 호출합니다.

```http
POST /api/auth/oauth/google
Content-Type: application/json
```

```json
{
  "code": "<인가 코드>",
  "redirectUri": "http://localhost:5173/auth/google/callback"
}
```

4. 응답으로 받은 `accessToken`, `refreshToken`, `user`를 저장합니다.

## 프론트엔드가 반드시 확인해야 하는 응답 필드

- `data.user.authProvider`
- `data.user.emailVerified`
- `data.user.profileCompleted`
- `data.emailVerificationRequired`

## 이메일 인증 정책

- 로컬 회원은 이메일 인증 전에도 로그인할 수 있습니다.
- 이메일 미인증 로컬 회원은 경험 등록, 수정, 삭제 진입을 막아야 합니다.
- 조회 중심 기능은 그대로 사용할 수 있습니다.

## OAuth Redirect URI 규칙

프론트엔드가 백엔드에 전달하는 `redirectUri` 값은 카카오 또는 구글 콘솔에 등록한 값과 정확히 같아야 합니다.

## 현재 카카오 로컬 콜백 주소

- `http://localhost:5173/auth/kakao/callback`
