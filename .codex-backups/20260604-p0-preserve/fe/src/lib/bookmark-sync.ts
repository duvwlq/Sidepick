export const BOOKMARK_SYNC_EVENT = 'sidepick:bookmark-sync';

export type BookmarkSyncDetail = {
  experienceId: number;
  bookmarked: boolean;
  bookmarkCount: number;
};

export function publishBookmarkSync(detail: BookmarkSyncDetail) {
  window.dispatchEvent(new CustomEvent<BookmarkSyncDetail>(BOOKMARK_SYNC_EVENT, { detail }));
}
