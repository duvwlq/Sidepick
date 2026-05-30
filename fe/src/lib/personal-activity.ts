import { getStoredUser } from './session';

const BOOKMARK_KEY = 'sidepick.personal.bookmarks';
const RECENT_VIEWED_KEY = 'sidepick.personal.recentViewed';
const MAX_RECENT_ITEMS = 30;

export const PERSONAL_ACTIVITY_UPDATED_EVENT = 'sidepick:personal-activity-updated';

function getScopedKey(baseKey: string) {
  const viewer = getStoredUser();
  const scope = viewer ? `user:${viewer.id}` : 'guest';
  return `${baseKey}:${scope}`;
}

function readIds(baseKey: string) {
  const storageKey = getScopedKey(baseKey);
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as number[];
    return parsed.filter((value) => Number.isFinite(value) && value > 0);
  } catch {
    localStorage.removeItem(storageKey);
    return [];
  }
}

function writeIds(baseKey: string, ids: number[]) {
  localStorage.setItem(getScopedKey(baseKey), JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent(PERSONAL_ACTIVITY_UPDATED_EVENT));
}

export function getBookmarkedExperienceIds() {
  return readIds(BOOKMARK_KEY);
}

export function isExperienceBookmarked(experienceId: number) {
  return getBookmarkedExperienceIds().includes(experienceId);
}

export function toggleBookmarkedExperience(experienceId: number) {
  const current = getBookmarkedExperienceIds();
  const exists = current.includes(experienceId);
  const next = exists
    ? current.filter((id) => id !== experienceId)
    : [experienceId, ...current.filter((id) => id !== experienceId)];

  writeIds(BOOKMARK_KEY, next);
  return !exists;
}

export function getRecentViewedExperienceIds() {
  return readIds(RECENT_VIEWED_KEY);
}

export function recordRecentViewedExperience(experienceId: number) {
  const next = [experienceId, ...getRecentViewedExperienceIds().filter((id) => id !== experienceId)].slice(
    0,
    MAX_RECENT_ITEMS,
  );
  writeIds(RECENT_VIEWED_KEY, next);
}
