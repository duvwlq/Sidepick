import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import arrowLeftIcon from '../assets/auth-figma/arrow-left.svg';
import batteryFrameIcon from '../assets/auth-figma/battery-frame.svg';
import cellularConnectionIcon from '../assets/auth-figma/cellular-connection.svg';
import wifiIcon from '../assets/auth-figma/wifi.svg';
import bookmarkIcon from '../assets/explore-figma/bookmark.svg';
import chevronDownIcon from '../assets/explore-figma/chevron-down.svg';
import heartIcon from '../assets/mypage-figma/heart.svg';
import BottomNav from '../components/layout/BottomNav';
import { ErrorState, ListSkeleton } from '../components/common/Skeleton';
import { useToast } from '../components/common/useToast';
import {
  ApiError,
  getMyBookmarks,
  getMyExperiences,
  getMyRecentViews,
  type Experience,
  unbookmarkExperience,
} from '../lib/api';
import { BOOKMARK_SYNC_EVENT, publishBookmarkSync, type BookmarkSyncDetail } from '../lib/bookmark-sync';
import { getExperienceImageMeta } from '../lib/experience-images';
import { resolveErrorMessage } from '../lib/resolve-error-message';
import { clearSession, getAccessToken } from '../lib/session';

type TopTab = 'written' | 'bookmarked' | 'recent';
type SortOption = 'latest' | 'recommended' | 'views';
type CardVariant = 'compact' | 'media';

const WRITTEN_VARIANTS: CardVariant[] = ['compact', 'media', 'media', 'compact', 'media', 'compact', 'media', 'compact'];
const BOOKMARK_VARIANTS: CardVariant[] = ['compact', 'media', 'media', 'compact', 'media', 'compact', 'media', 'compact'];
const RECENT_VARIANTS: CardVariant[] = ['compact', 'media', 'media', 'compact', 'media', 'compact', 'media', 'compact'];

function getTopTabFromPath(pathname: string): TopTab {
  if (pathname.startsWith('/mypage/written')) return 'written';
  if (pathname.startsWith('/mypage/bookmarks')) return 'bookmarked';
  return 'recent';
}

function isAuthError(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

function sanitizeText(value: string | null | undefined, fallback: string) {
  const normalized = (value ?? '').replace(/\s+/g, ' ').trim();
  return normalized || fallback;
}

function stripImageMarkdown(content: string) {
  return content.replace(/!\[[^\]]*]\(([^)]+)\)/g, '').replace(/\s+/g, ' ').trim();
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

function extractKeywordTags(experience: Experience) {
  const raw = [
    ...(experience.analysis?.keywords ?? []),
    ...experience.failureReasons,
    ...experience.difficulties,
    experience.businessType ?? '',
  ]
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => item !== experience.category.name);

  return Array.from(new Set(raw)).slice(0, 2);
}

function resolveBookmarkCount(experience: Experience) {
  return (experience as Experience & { bookmarkCount?: number }).bookmarkCount ?? experience.likeCount;
}

function sortExperiences(experiences: Experience[], sortOption: SortOption) {
  const items = [...experiences];

  if (sortOption === 'recommended') {
    return items.sort((a, b) => b.likeCount - a.likeCount);
  }

  if (sortOption === 'views') {
    return items.sort((a, b) => b.viewCount - a.viewCount);
  }

  return items.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
}

function getVariantSequence(tab: TopTab) {
  return tab === 'written' ? WRITTEN_VARIANTS : tab === 'bookmarked' ? BOOKMARK_VARIANTS : RECENT_VARIANTS;
}

function IosStatusBar() {
  return (
    <div className="flex h-[59px] items-center bg-white px-[24px] pb-[19px] pt-[21px]">
      <div className="flex min-w-0 flex-1 items-center">
        <span className="font-['SF_Pro'] text-[17px] font-[590] leading-[22px] text-black">9:41</span>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-[7px] pr-[1px] pt-[1px]">
        <img src={cellularConnectionIcon} alt="" className="h-[12.226px] w-[19.2px]" />
        <img src={wifiIcon} alt="" className="h-[12.328px] w-[17.142px]" />
        <img src={batteryFrameIcon} alt="" className="h-[13px] w-[27.328px]" />
      </div>
    </div>
  );
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center px-[8px] py-[4px] ${
        active ? 'border-b-[1.5px] border-[#5A876E]' : ''
      }`}
      aria-pressed={active}
    >
      <span
        className={`font-['Pretendard'] text-[14px] leading-[16.8px] ${
          active ? 'font-[600] text-[#5A876E]' : 'font-[400] text-[#BABABA]'
        }`}
      >
        {label}
      </span>
    </button>
  );
}

function CaseTag({
  label,
  tone,
}: {
  label: string;
  tone: 'success' | 'failure' | 'category' | 'keyword';
}) {
  const toneClass =
    tone === 'success'
      ? 'bg-[#5A876E] text-white'
      : tone === 'failure'
        ? 'bg-[#C06D43] text-white'
        : tone === 'category'
          ? 'bg-[#CBE5D8] text-[#5A876E]'
          : 'bg-[#E6E6E6] text-[#8A8A8A]';

  return (
    <span
      className={`inline-flex h-[18px] items-center justify-center rounded-[4px] px-[4px] py-[2px] font-['Pretendard'] text-[10px] font-[500] leading-[12px] ${toneClass}`}
    >
      <span className="max-w-[116px] truncate whitespace-nowrap">{label}</span>
    </span>
  );
}

function DraftCard() {
  const navigate = useNavigate();

  return (
    <article className="bg-[#F8F8F8] px-[16px] py-[12px]">
      <button type="button" onClick={() => navigate('/create')} className="flex h-[71px] w-full flex-col gap-[16px] text-left">
        <div className="flex flex-col gap-[4px]">
          <p className="font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] text-[#131416]">작성 중...</p>
          <p className="line-clamp-1 font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#494949]">
            본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기
          </p>
        </div>

        <div className="flex items-center gap-[4px] font-['Pretendard'] text-[12px] leading-[16.8px]">
          <span className="font-[400] text-[#92BFA6]">임시저장</span>
          <span className="font-[300] text-[#8A8A8A]">·</span>
          <span className="font-[300] text-[#8A8A8A]">2026.00.00</span>
        </div>
      </button>
    </article>
  );
}

function StoryCard({
  experience,
  mode,
  variant,
  onBookmarkRemove,
}: {
  experience: Experience;
  mode: TopTab;
  variant: CardVariant;
  onBookmarkRemove?: (experienceId: number) => void;
}) {
  const navigate = useNavigate();
  const imageMeta = getExperienceImageMeta(experience);
  const keywords = extractKeywordTags(experience);
  const showImage = variant === 'media';
  const showSuccessAction = experience.caseStatus === 'FAILURE';
  const cardHeightClassName = variant === 'media' ? 'min-h-[171px]' : 'min-h-[133px]';
  const preview = sanitizeText(stripImageMarkdown(experience.content), '본문 텍스트 미리보기');

  return (
    <article className={`bg-white px-[16px] py-[12px] ${cardHeightClassName}`}>
      <div className="flex h-full flex-col gap-[8px]">
        <button type="button" onClick={() => navigate(`/experiences/${experience.id}`)} className="flex flex-col gap-[8px] text-left">
          <div className="flex items-center gap-[4px] overflow-hidden">
            <CaseTag
              label={experience.caseStatus === 'SUCCESS' ? '성공' : '실패'}
              tone={experience.caseStatus === 'SUCCESS' ? 'success' : 'failure'}
            />
            <CaseTag label={sanitizeText(experience.category.name, '카테고리')} tone="category" />
            {keywords.map((keyword) => (
              <CaseTag key={`${experience.id}-${keyword}`} label={keyword} tone="keyword" />
            ))}
          </div>

          <div className="flex min-h-[60px] items-start gap-[8px]">
            {showImage ? (
              <div className="relative h-[60px] w-[80px] shrink-0 overflow-hidden rounded-[4px] bg-[#D8D8D8]">
                {imageMeta.primaryImageUrl ? (
                  <img src={imageMeta.primaryImageUrl} alt="" className="h-full w-full object-cover" />
                ) : null}
                {imageMeta.imageCount > 1 ? (
                  <span className="absolute bottom-0 right-0 flex h-[16px] w-[16px] items-center justify-center rounded-[4px] bg-[rgba(0,0,0,0.25)] font-['Pretendard'] text-[10px] font-[500] leading-[16px] text-white">
                    {imageMeta.imageCount}
                  </span>
                ) : null}
              </div>
            ) : null}

            <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
              <p className="line-clamp-1 font-['Pretendard'] text-[16px] font-[500] leading-[19.2px] text-[#131416]">
                {sanitizeText(experience.title, '제목')}
              </p>
              <p className={`${showImage ? 'line-clamp-2' : 'line-clamp-1'} font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#494949]`}>
                {preview}
              </p>
            </div>
          </div>
        </button>

        <div className="mt-auto flex flex-col gap-[8px]">
          <div className="flex items-center justify-between gap-[8px]">
            <div className="flex min-w-0 items-center gap-[4px] overflow-hidden font-['Pretendard'] text-[12px] font-[300] leading-[16.8px] text-[#8A8A8A]">
              <span className="truncate">{sanitizeText(experience.author.nickname, '닉네임')}</span>
              <span>·</span>
              <span>{formatDate(experience.createdAt)}</span>
              <span>·</span>
              <span>{`조회 ${experience.viewCount}`}</span>
            </div>

            <div className="flex shrink-0 items-center gap-[4px]">
              <div className="flex items-center gap-[2px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#8A8A8A]">
                <img src={heartIcon} alt="" className="h-[14px] w-[14px]" />
                <span>{experience.likeCount}</span>
              </div>

              {mode === 'bookmarked' ? (
                <button
                  type="button"
                  onClick={() => onBookmarkRemove?.(experience.id)}
                  className="flex items-center gap-[2px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#8A8A8A]"
                  aria-label="북마크 해제"
                >
                  <img src={bookmarkIcon} alt="" className="h-[14px] w-[14px]" />
                  <span>{resolveBookmarkCount(experience)}</span>
                </button>
              ) : (
                <div className="flex items-center gap-[2px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#8A8A8A]">
                  <img src={bookmarkIcon} alt="" className="h-[14px] w-[14px]" />
                  <span>{resolveBookmarkCount(experience)}</span>
                </div>
              )}
            </div>
          </div>

          {showSuccessAction ? (
            <div className="flex justify-end">
              <button
                type="button"
                disabled={!experience.hasPatternAnalysis}
                onClick={() => navigate(`/experiences/${experience.id}/success-comparison`)}
                className={`inline-flex h-[32px] items-center justify-center rounded-[8px] px-[12px] py-[8px] font-['Pretendard'] text-[12px] font-[600] leading-[14.4px] ${
                  experience.hasPatternAnalysis ? 'bg-[#5A876E] text-white' : 'bg-[#CBE5D8] text-[#5A876E]'
                }`}
              >
                {experience.hasPatternAnalysis ? '성공 사례 보기' : '성공 사례 없음'}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function MyPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const token = getAccessToken();

  const [activeTab, setActiveTab] = useState<TopTab>(() => getTopTabFromPath(location.pathname));
  const [writtenExperiences, setWrittenExperiences] = useState<Experience[]>([]);
  const [bookmarkedExperiences, setBookmarkedExperiences] = useState<Experience[]>([]);
  const [recentExperiences, setRecentExperiences] = useState<Experience[]>([]);
  const [writtenLoading, setWrittenLoading] = useState(Boolean(token));
  const [bookmarkLoading, setBookmarkLoading] = useState(Boolean(token));
  const [recentLoading, setRecentLoading] = useState(Boolean(token));
  const [writtenError, setWrittenError] = useState('');
  const [bookmarkError, setBookmarkError] = useState('');
  const [recentError, setRecentError] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('latest');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  useEffect(() => {
    setActiveTab(getTopTabFromPath(location.pathname));
    setSortMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!token) {
      setWrittenLoading(false);
      setBookmarkLoading(false);
      setRecentLoading(false);
      return;
    }

    setWrittenLoading(true);
    setBookmarkLoading(true);
    setRecentLoading(true);
    setWrittenError('');
    setBookmarkError('');
    setRecentError('');

    void getMyExperiences(token)
      .then(setWrittenExperiences)
      .catch((error) => {
        setWrittenExperiences([]);
        if (isAuthError(error)) {
          clearSession();
          navigate('/auth?next=%2Fmypage%2Fwritten', { replace: true });
          return;
        }
        setWrittenError(resolveErrorMessage(error, '작성한 글 목록을 불러오지 못했어요.'));
      })
      .finally(() => setWrittenLoading(false));

    void getMyBookmarks(token)
      .then(setBookmarkedExperiences)
      .catch((error) => {
        setBookmarkedExperiences([]);
        if (isAuthError(error)) {
          clearSession();
          navigate('/auth?next=%2Fmypage%2Fbookmarks', { replace: true });
          return;
        }
        setBookmarkError(resolveErrorMessage(error, '북마크 목록을 불러오지 못했어요.'));
      })
      .finally(() => setBookmarkLoading(false));

    void getMyRecentViews(token)
      .then(setRecentExperiences)
      .catch((error) => {
        setRecentExperiences([]);
        if (isAuthError(error)) {
          clearSession();
          navigate('/auth?next=%2Fmypage%2Frecent', { replace: true });
          return;
        }
        setRecentError(resolveErrorMessage(error, '최근 본 글 목록을 불러오지 못했어요.'));
      })
      .finally(() => setRecentLoading(false));
  }, [navigate, token]);

  useEffect(() => {
    if (!token) return;
    const accessToken = token;

    let cancelled = false;

    async function reloadBookmarks(event: Event) {
      const detail = event instanceof CustomEvent ? (event.detail as BookmarkSyncDetail) : null;
      if (detail && !detail.bookmarked) {
        setBookmarkedExperiences((current) => current.filter((item) => item.id !== detail.experienceId));
        return;
      }

      try {
        const payload = await getMyBookmarks(accessToken);
        if (!cancelled) {
          setBookmarkedExperiences(payload);
          setBookmarkError('');
        }
      } catch (error) {
        if (!cancelled && !isAuthError(error)) {
          setBookmarkError(resolveErrorMessage(error, '북마크 목록을 불러오지 못했어요.'));
        }
      }
    }

    window.addEventListener(BOOKMARK_SYNC_EVENT, reloadBookmarks);
    return () => {
      cancelled = true;
      window.removeEventListener(BOOKMARK_SYNC_EVENT, reloadBookmarks);
    };
  }, [token]);

  const writtenCards = useMemo(() => sortExperiences(writtenExperiences, sortOption), [writtenExperiences, sortOption]);
  const bookmarkCards = useMemo(() => sortExperiences(bookmarkedExperiences, sortOption), [bookmarkedExperiences, sortOption]);
  const recentCards = useMemo(() => sortExperiences(recentExperiences, sortOption), [recentExperiences, sortOption]);

  const currentCards = activeTab === 'written' ? writtenCards : activeTab === 'bookmarked' ? bookmarkCards : recentCards;
  const currentLoading = activeTab === 'written' ? writtenLoading : activeTab === 'bookmarked' ? bookmarkLoading : recentLoading;
  const currentError = activeTab === 'written' ? writtenError : activeTab === 'bookmarked' ? bookmarkError : recentError;
  const currentCount = currentLoading ? '...' : `${currentCards.length}개`;
  const variantSequence = getVariantSequence(activeTab);

  async function handleBookmarkRemove(experienceId: number) {
    if (!token || activeTab !== 'bookmarked') return;

    try {
      const payload = await unbookmarkExperience(token, experienceId);
      setBookmarkedExperiences((current) => current.filter((item) => item.id !== experienceId));
      publishBookmarkSync({ experienceId, bookmarked: payload.bookmarked, bookmarkCount: payload.bookmarkCount });
      showToast('북마크를 해제했어요.');
    } catch (error) {
      showToast(resolveErrorMessage(error, '북마크를 변경하지 못했어요.'));
    }
  }

  if (!token) {
    return (
      <div className="mx-auto min-h-screen w-full max-w-[375px] bg-white px-[16px] py-[40px]">
        <p className="font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] text-[#131416]">로그인이 필요해요.</p>
        <p className="mt-[8px] font-['Pretendard'] text-[14px] leading-[19.6px] text-[#6B6B6B]">저장된 목록을 보려면 로그인해 주세요.</p>
        <button
          type="button"
          onClick={() => navigate('/auth?next=%2Fmypage')}
          className="mt-[20px] h-[44px] w-full rounded-[10px] bg-[#131416] font-['Pretendard'] text-[14px] font-[600] text-white"
        >
          로그인 / 회원가입
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-[375px] bg-[#F8F8F8]">
      <header className="sticky top-0 z-10 bg-white">
        <IosStatusBar />

        <div className="flex items-center justify-between px-[16px] py-[20px]">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
                return;
              }
              navigate('/mypage');
            }}
            className="flex h-[24px] w-[24px] items-center justify-center"
            aria-label="뒤로 가기"
          >
            <img src={arrowLeftIcon} alt="" className="h-[24px] w-[24px]" />
          </button>

          <h1 className="font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] text-black">저장됨</h1>

          <div className="h-[24px] w-[24px]" aria-hidden="true" />
        </div>

        <div className="flex flex-col gap-[12px] py-[12px]">
          <div className="flex">
            <TabButton active={activeTab === 'written'} label="작성한 글" onClick={() => navigate('/mypage/written')} />
            <TabButton active={activeTab === 'bookmarked'} label="북마크" onClick={() => navigate('/mypage/bookmarks')} />
            <TabButton active={activeTab === 'recent'} label="최근 본 글" onClick={() => navigate('/mypage/recent')} />
          </div>

          <div className="flex items-center justify-between px-[16px]">
            <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#131416]">{currentCount}</span>

            <div className="relative">
              <button
                type="button"
                onClick={() => setSortMenuOpen((current) => !current)}
                className="flex items-center font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#131416]"
                aria-expanded={sortMenuOpen}
              >
                <span>
                  {sortOption === 'latest' ? '최신순' : sortOption === 'recommended' ? '추천순' : '조회수순'}
                </span>
                <img src={chevronDownIcon} alt="" className={`h-[17px] w-[17px] ${sortMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {sortMenuOpen ? (
                <div className="absolute right-0 top-[25px] z-10 grid rounded-[4px] bg-white px-[12px] py-[8px] shadow-[0_0_4px_rgba(0,0,0,0.15)]">
                  {([
                    { value: 'recommended', label: '추천순' },
                    { value: 'latest', label: '최신순' },
                    { value: 'views', label: '조회수순' },
                  ] as const).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setSortOption(option.value);
                        setSortMenuOpen(false);
                      }}
                      className="py-[6px] text-left font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#5E5E5E]"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main className="pb-[110px]">
        {currentLoading ? (
          <div className="px-[16px] py-[12px]">
            <ListSkeleton count={4} />
          </div>
        ) : currentError ? (
          <div className="px-[16px] py-[12px]">
            <ErrorState message={currentError} />
          </div>
        ) : currentCards.length ? (
          <div className="flex flex-col gap-[2px]">
            {activeTab === 'written' ? <DraftCard /> : null}
            {currentCards.map((experience, index) => (
              <StoryCard
                key={`${activeTab}-${experience.id}`}
                experience={experience}
                mode={activeTab}
                variant={variantSequence[index] ?? 'compact'}
                onBookmarkRemove={activeTab === 'bookmarked' ? handleBookmarkRemove : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="px-[16px] py-[12px]">
            <div className="rounded-[4px] bg-white px-[16px] py-[32px] text-center font-['Pretendard'] text-[14px] text-[#8A8A8A]">
              {activeTab === 'written'
                ? '작성한 글이 없어요.'
                : activeTab === 'bookmarked'
                  ? '북마크한 글이 없어요.'
                  : '최근 본 글이 없어요.'}
            </div>
          </div>
        )}
      </main>

      <BottomNav active="mypage" showFab />
    </div>
  );
}
