import type { UserSummary } from './api';

const ACCESS_TOKEN_KEY = 'sidepick.accessToken';
const REFRESH_TOKEN_KEY = 'sidepick.refreshToken';
const USER_KEY = 'sidepick.user';

export function saveSession(
  accessToken: string,
  refreshToken: string,
  user: UserSummary,
) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as UserSummary;
  } catch {
    clearSession();
    return null;
  }
}
