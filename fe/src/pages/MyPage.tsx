import { useEffect, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import arrowLeftIcon from '../assets/auth-figma/arrow-left.svg';
import CaseCard from '../components/common/CaseCard';
import { ErrorState, ListSkeleton } from '../components/common/Skeleton';
import { CaseTextLink } from '../components/common/CaseUi';
import { useToast } from '../components/common/useToast';
import BottomNav from '../components/layout/BottomNav';
import {
  ApiError,
  getMyBookmarks,
  getMyExperiences,
  getMyRecentViews,
  type Experience,
  unbookmarkExperience,
} from '../lib/api';
import { BOOKMARK_SYNC_EVENT, publishBookmarkSync, type BookmarkSyncDetail } from '../lib/bookmark-sync';
import { extractExperienceImageUrls } from '../lib/experience-images';
import { resolveErrorMessage } from '../lib/resolve-error-message';
import { clearSession, getAccessToken } from '../lib/session';

type TopTab = 'written' | 'bookmarked' | 'recent';
type SortOption = 'latest' | 'recommended' | 'views';

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
  return experience.bookmarkCount ?? 0;
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
      className={`flex h-[52px] flex-1 items-center justify-center border-b-[1.5px] ${
        active ? 'border-[#5A876E]' : 'border-transparent'
      }`}
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

function DraftCard() {
  const navigate = useNavigate();

  return (
    <section className="border-b border-[#F1F1F1] bg-white px-[16px] py-[12px]">
      <div className="mb-[10px] flex items-center justify-between">
        <p className="font-['Pretendard'] text-[14px] font-[600] leading-[16.8px] text-[#494949]">작성 중인 글</p>
        <CaseTextLink label="전체보기" onClick={() => navigate('/create')} />
      </div>
      <button
        type="button"
        onClick={() => navigate('/create')}
        className="flex h-[95px] w-full items-center justify-center rounded-[4px] bg-[#F8F8F8] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#8A8A8A]"
      >
        작성 중인 글이 없습니다
      </button>
    </section>
  );
}

function StoryCard({
  experience,
  mode,
  onBookmarkRemove,
}: {
  experience: Experience;
  mode: TopTab;
  onBookmarkRemove?: (experienceId: number) => void;
}) {
  const navigate = useNavigate();
  const imageUrls = extractExperienceImageUrls(experience);
  const tags = [
    experience.caseStatus === 'SUCCESS' ? '성공' : '실패',
    sanitizeText(experience.category.name, '카테고리'),
    ...extractKeywordTags(experience),
  ].slice(0, 4);

  return (
    <div className="border-b border-[#F1F1F1] bg-white px-[16px] py-[12px] last:border-b-0">
      <CaseCard
        tags={tags.map((tag, index) => ({
          label: tag,
          tone: (index === 0 ? (experience.caseStatus === 'SUCCESS' ? 'status-success' : 'status-failure') : index === 1 ? 'category' : 'keyword') as
            | 'status-success'
            | 'status-failure'
            | 'category'
            | 'keyword',
          maxWidthClassName: index === 0 ? 'max-w-[40px]' : index === 1 ? 'max-w-[108px]' : 'max-w-[58px]',
        }))}
        title={sanitizeText(experience.title, '제목')}
        preview={sanitizeText(stripImageMarkdown(experience.content), '본문 텍스트 미리보기')}
        nickname={sanitizeText(experience.author.nickname, '닉네임')}
        createdAt={formatDate(experience.createdAt)}
        viewCount={experience.viewCount}
        thumbnailUrl={imageUrls[0] ?? null}
        thumbnailCount={imageUrls.length}
        heartCount={experience.likeCount}
        bookmarkCount={resolveBookmarkCount(experience)}
        bookmarkActive={mode === 'bookmarked'}
        onBookmarkClick={mode === 'bookmarked' && onBookmarkRemove ? () => onBookmarkRemove(experience.id) : undefined}
        showCta={experience.caseStatus === 'FAILURE'}
        ctaLabel="성공 사례 보기"
        ctaDisabled={!experience.hasPatternAnalysis}
        onCtaClick={() => navigate(`/experiences/${experience.id}/success-comparison`)}
        surfaceClassName="min-h-[171px]"
      />
    </div>
  );
}

export default function MyPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const token = getAccessToken();
  const activeTab = getTopTabFromPath(location.pathname);

  const [authRequired, setAuthRequired] = useState(!token);
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
    if (!token) {
      return;
    }

    void getMyExperiences(token)
      .then(setWrittenExperiences)
      .catch((error) => {
        setWrittenExperiences([]);
        if (isAuthError(error)) {
          setAuthRequired(true);
          setWrittenLoading(false);
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
          setAuthRequired(true);
          setBookmarkLoading(false);
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
          setAuthRequired(true);
          setRecentLoading(false);
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

  if (!token || authRequired) {
    return (
      <div className="mx-auto min-h-screen w-full max-w-[375px] bg-white px-[16px] py-[40px]">
        <p className="font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] text-[#131416]">로그인이 필요해요.</p>
        <p className="mt-[8px] font-['Pretendard'] text-[14px] leading-[19.6px] text-[#6B6B6B]">저장한 목록을 보려면 로그인해 주세요.</p>
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
      <header className="sticky top-0 z-20 bg-white">
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

        <div className="border-b border-[#F1F1F1]">
          <div className="flex">
            <TabButton
              active={activeTab === 'written'}
              label="작성한 글"
              onClick={() => {
                setSortMenuOpen(false);
                navigate('/mypage/written');
              }}
            />
            <TabButton
              active={activeTab === 'bookmarked'}
              label="북마크"
              onClick={() => {
                setSortMenuOpen(false);
                navigate('/mypage/bookmarks');
              }}
            />
            <TabButton
              active={activeTab === 'recent'}
              label="최근 본 글"
              onClick={() => {
                setSortMenuOpen(false);
                navigate('/mypage/recent');
              }}
            />
          </div>
          <div className="flex items-center justify-between px-[16px] py-[10px]">
            <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#131416]">{currentCount}</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setSortMenuOpen((current) => !current)}
                className="flex items-center gap-[2px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#131416]"
              >
                <span>{sortOption === 'latest' ? '최신순' : sortOption === 'recommended' ? '추천순' : '조회수순'}</span>
                <ChevronDown size={16} strokeWidth={1.8} />
              </button>

              {sortMenuOpen ? (
                <div className="absolute right-0 top-[24px] z-10 min-w-[76px] rounded-[4px] bg-white px-[12px] py-[8px] shadow-[0_0_4px_rgba(0,0,0,0.15)]">
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
                      className="block w-full py-[4px] text-left font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#5E5E5E]"
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
          <div className="bg-white">
            {activeTab === 'written' ? <DraftCard /> : null}
            {currentCards.map((experience) => (
              <StoryCard
                key={`${activeTab}-${experience.id}`}
                experience={experience}
                mode={activeTab}
                onBookmarkRemove={activeTab === 'bookmarked' ? handleBookmarkRemove : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="px-[16px] py-[12px]">
            <div className="rounded-[4px] bg-white px-[16px] py-[32px] text-center font-['Pretendard'] text-[14px] text-[#8A8A8A]">
              {activeTab === 'written' ? '작성한 글이 없어요.' : activeTab === 'bookmarked' ? '북마크한 글이 없어요.' : '최근 본 글이 없어요.'}
            </div>
          </div>
        )}
      </main>

      <BottomNav active="mypage" />
    </div>
  );
}
