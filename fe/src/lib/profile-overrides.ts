import type { UserSummary } from './api';

const PROFILE_OVERRIDES_KEY = 'sidepick.profileOverrides';

export type ProfileOverrides = {
  phone: string;
  region?: string;
  profileImage?: string | null;
};

const DEFAULT_OVERRIDES: ProfileOverrides = {
  phone: '',
};

export function getProfileOverrides(): ProfileOverrides {
  const raw = localStorage.getItem(PROFILE_OVERRIDES_KEY);
  if (!raw) {
    return DEFAULT_OVERRIDES;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ProfileOverrides>;
    return {
      ...DEFAULT_OVERRIDES,
      ...parsed,
    };
  } catch {
    localStorage.removeItem(PROFILE_OVERRIDES_KEY);
    return DEFAULT_OVERRIDES;
  }
}

export function saveProfileOverrides(input: Partial<ProfileOverrides>) {
  const next: ProfileOverrides = {
    ...getProfileOverrides(),
    ...input,
  };
  localStorage.setItem(PROFILE_OVERRIDES_KEY, JSON.stringify(next));
}

export function mergeProfileOverrides(user: UserSummary | null) {
  if (!user) {
    return null;
  }

  const overrides = getProfileOverrides();
  return {
    ...user,
    region: overrides.region ?? user.region,
    profileImage: overrides.profileImage ?? user.profileImage,
  };
}
