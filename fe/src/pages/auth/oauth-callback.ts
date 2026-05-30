import { clearOAuthState, getOAuthState } from '../../lib/oauth-state';

type Provider = 'KAKAO' | 'GOOGLE' | 'NAVER';

export function readOAuthCallbackParams(provider: Provider, callbackPath: string) {
  const params = new URLSearchParams(window.location.search);
  const state = params.get('state') || '';
  const storedState = getOAuthState(provider);
  const immediateError = params.get('error')
    ? '소셜 로그인에 실패했어요.'
    : !params.get('code')
      ? '소셜 로그인 정보를 확인하지 못했어요.'
      : !state
        ? 'OAuth state가 누락되었어요.'
        : !storedState
          ? '로그인 세션이 만료되었어요. 다시 시도해주세요.'
          : storedState.state !== state
            ? 'OAuth state 검증에 실패했어요. 다시 시도해주세요.'
            : storedState.redirectUri !== `${window.location.origin}${callbackPath}`
              ? 'OAuth redirect 검증에 실패했어요.'
              : '';

  return {
    code: params.get('code'),
    state,
    oauthError: params.get('error'),
    nextPath: storedState?.nextPath || '/',
    redirectUri: `${window.location.origin}${callbackPath}`,
    immediateError,
  };
}

export function clearOAuthCallbackState(provider: Provider) {
  clearOAuthState(provider);
}
