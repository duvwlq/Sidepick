const DEFAULT_DEV_OAUTH_REDIRECT_ORIGIN = 'http://127.0.0.1:4173';

function normalizeOrigin(origin: string) {
  return origin.replace(/\/+$/, '');
}

export function getOAuthRedirectOrigin() {
  const configuredOrigin = import.meta.env.VITE_OAUTH_REDIRECT_ORIGIN?.trim();

  if (configuredOrigin) {
    return normalizeOrigin(configuredOrigin);
  }

  if (import.meta.env.DEV) {
    return DEFAULT_DEV_OAUTH_REDIRECT_ORIGIN;
  }

  return normalizeOrigin(window.location.origin);
}

export function buildOAuthRedirectUri(callbackPath: string) {
  const normalizedPath = callbackPath.startsWith('/') ? callbackPath : `/${callbackPath}`;
  return `${getOAuthRedirectOrigin()}${normalizedPath}`;
}
