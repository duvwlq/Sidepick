export type RecentExploreSearch = {
  id: string;
  query: string;
  tags: string[];
  searchedAt: string;
};

export const RECENT_EXPLORE_SEARCHES_KEY = 'sidepick.explore.recent-searches';
const MAX_RECENT_EXPLORE_SEARCHES = 10;

function buildRecentSearchId(query: string, tags: string[]) {
  return `${query.trim().toLowerCase()}::${[...tags].sort().join('|')}`;
}

export function readRecentExploreSearches() {
  const raw = localStorage.getItem(RECENT_EXPLORE_SEARCHES_KEY);
  if (!raw) {
    return [] as RecentExploreSearch[];
  }

  try {
    const parsed = JSON.parse(raw) as RecentExploreSearch[];
    return parsed
      .filter((item) => item && typeof item.id === 'string')
      .slice(0, MAX_RECENT_EXPLORE_SEARCHES);
  } catch {
    return [] as RecentExploreSearch[];
  }
}

export function writeRecentExploreSearches(searches: RecentExploreSearch[]) {
  localStorage.setItem(
    RECENT_EXPLORE_SEARCHES_KEY,
    JSON.stringify(searches.slice(0, MAX_RECENT_EXPLORE_SEARCHES)),
  );
}

export function saveRecentExploreSearch({
  query,
  tags,
  current,
}: {
  query: string;
  tags: string[];
  current: RecentExploreSearch[];
}) {
  const normalizedQuery = query.trim();
  const normalizedTags = [...new Set(tags)].sort();

  if (!normalizedQuery && normalizedTags.length === 0) {
    return current;
  }

  const nextItem: RecentExploreSearch = {
    id: buildRecentSearchId(normalizedQuery, normalizedTags),
    query: normalizedQuery,
    tags: normalizedTags,
    searchedAt: new Date().toISOString(),
  };

  const nextSearches = [
    nextItem,
    ...current.filter((item) => item.id !== nextItem.id),
  ].slice(0, MAX_RECENT_EXPLORE_SEARCHES);

  writeRecentExploreSearches(nextSearches);
  return nextSearches;
}

export function removeRecentExploreSearch({
  id,
  current,
}: {
  id: string;
  current: RecentExploreSearch[];
}) {
  const nextSearches = current.filter((item) => item.id !== id);
  writeRecentExploreSearches(nextSearches);
  return nextSearches;
}

export function clearRecentExploreSearches() {
  localStorage.removeItem(RECENT_EXPLORE_SEARCHES_KEY);
  return [] as RecentExploreSearch[];
}
