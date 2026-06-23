type OAuthProvider = 'KAKAO' | 'GOOGLE' | 'NAVER';

type StoredOAuthState = {
  state: string;
  nextPath: string;
  redirectUri: string;
  provider: OAuthProvider;
  expiresAt: string;
};

const KEY_PREFIX = 'sidepick.oauth.state.';

function buildKey(provider: OAuthProvider) {
  return `${KEY_PREFIX}${provider}`;
}

export function saveOAuthState(payload: StoredOAuthState) {
  sessionStorage.setItem(buildKey(payload.provider), JSON.stringify(payload));
}

export function getOAuthState(provider: OAuthProvider) {
  const raw = sessionStorage.getItem(buildKey(provider));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredOAuthState;
  } catch {
    sessionStorage.removeItem(buildKey(provider));
    return null;
  }
}

export function clearOAuthState(provider: OAuthProvider) {
  sessionStorage.removeItem(buildKey(provider));
}
