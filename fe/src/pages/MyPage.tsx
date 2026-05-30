import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ErrorState, ListSkeleton, PageMessage } from '../components/common/Skeleton';
import { useToast } from '../components/common/useToast';
import arrowLeftIcon from '../assets/auth-figma/arrow-left.svg';
import bookmarkMetaIcon from '../assets/explore-figma/bookmark.svg';
import chevronDownIcon from '../assets/explore-figma/chevron-down.svg';
import helpFabIcon from '../assets/explore-figma/help.svg';
import faqNavIcon from '../assets/images/live-help.svg';
import homeNavIcon from '../assets/images/home.svg';
import plusFabIcon from '../assets/images/plus-circle.svg';
import searchNavIcon from '../assets/images/search.svg';
import userNavIcon from '../assets/images/user.svg';
import Layout from '../components/layout/Layout';
import {
  ApiError,
  getMyBookmarks,
  getMyExperiences,
  getMyRecentViews,
  type Experience,
  unbookmarkExperience,
} from '../lib/api';
import { getExperienceImageMeta } from '../lib/experience-images';
import { resolveErrorMessage } from '../lib/resolve-error-message';
import { clearSession, getAccessToken } from '../lib/session';

type SortOption = 'latest' | 'popular';
type TopTab = 'written' | 'bookmarked' | 'recent';
type CardVariant = 'regular' | 'large';

function getTopTabFromPath(pathname: string): TopTab {
  if (pathname.startsWith('/mypage/written')) {
    return 'written';
  }
  if (pathname.startsWith('/mypage/bookmarks')) {
    return 'bookmarked';
  }
  return 'recent';
}

function isAuthError(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

type ExperienceCardViewModel = {
  id: number;
  variant: CardVariant;
  statusLabel: string;
  categoryLabel: string;
  keywords: [string, string];
  title: string;
  description: string;
  authorName: string;
  createdAtLabel: string;
  viewCountLabel: string;
  bookmarkCountLabel: string;
  imageUrl: string | null;
  actionLabel: string | null;
};

const FIGMA_PREVIEW_MODE = false;

const BOOKMARK_PREVIEW_CARDS = [
  { id: 10111, variant: 'regular' },
  { id: 10112, variant: 'large' },
  { id: 10113, variant: 'large' },
  { id: 10114, variant: 'regular' },
  { id: 10115, variant: 'large' },
  { id: 10116, variant: 'regular' },
  { id: 10117, variant: 'large' },
  { id: 10118, variant: 'regular' },
] as const satisfies ReadonlyArray<{ id: number; variant: CardVariant }>;

const PREVIEW_REGULAR_CARD: ExperienceCardViewModel = {
  id: 10111,
  variant: 'regular',
  statusLabel: '성공',
  categoryLabel: '카테고리',
  keywords: ['키워드', '키워드'],
  title: '실패 사례',
  description: '본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기',
  authorName: '닉네임',
  createdAtLabel: '2026.00.00',
  viewCountLabel: '999',
  bookmarkCountLabel: '999',
  imageUrl: null,
  actionLabel: null,
};

const PREVIEW_LARGE_CARD: ExperienceCardViewModel = {
  id: 10112,
  variant: 'large',
  statusLabel: '실패',
  categoryLabel: '카테고리',
  keywords: ['키워드', '키워드'],
  title: '실패 사례',
  description: '본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기',
  authorName: '닉네임',
  createdAtLabel: '2026.00.00',
  viewCountLabel: '999',
  bookmarkCountLabel: '999',
  imageUrl: null,
  actionLabel: '상세보기',
};

const BOTTOM_NAV_ITEMS = [
  { name: '홈', path: '/', icon: homeNavIcon, matches: (pathname: string) => pathname === '/' },
  { name: '탐색', path: '/explore', icon: searchNavIcon, matches: (pathname: string) => pathname.startsWith('/explore') },
  { name: '가이드', path: '/faq', icon: faqNavIcon, matches: (pathname: string) => pathname === '/faq' || pathname === '/mypage/faq' },
  { name: 'MY', path: '/mypage', icon: userNavIcon, matches: (pathname: string) => pathname.startsWith('/mypage') && pathname !== '/mypage/faq' },
] as const;

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

function sanitizeText(value: string | null | undefined, fallback: string) {
  const normalized = (value ?? '').replace(/\s+/g, ' ').trim();
  return normalized || fallback;
}

function stripImageMarkdown(content: string) {
  return content.replace(/!\[[^\]]*]\(([^)]+)\)/g, '').replace(/\s+/g, ' ').trim();
}

function extractKeywordTags(experience: Experience): [string, string] {
  const raw = [
    ...(experience.analysis?.keywords ?? []),
    ...experience.failureReasons,
    ...experience.difficulties,
    experience.businessType ?? '',
  ]
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => value !== experience.category.name);

  const unique = Array.from(new Set(raw));
  return [unique[0] ?? '키워드', unique[1] ?? '키워드'];
}

function getExperienceCardVariant(experience: Experience): CardVariant {
  const imageMeta = getExperienceImageMeta(experience);
  if (imageMeta.primaryImageUrl) {
    return 'large';
  }
  if (experience.caseStatus !== 'SUCCESS') {
    return 'large';
  }
  // TODO: API에 cardVariant 필드가 추가되면 이 규칙 기반 매핑을 제거하세요.
  return 'regular';
}

function buildExperienceCardViewModel(experience: Experience): ExperienceCardViewModel {
  const imageMeta = getExperienceImageMeta(experience);
  const [keywordA, keywordB] = extractKeywordTags(experience);
  const isSuccess = experience.caseStatus === 'SUCCESS';
  const variant = getExperienceCardVariant(experience);

  return {
    id: experience.id,
    variant,
    statusLabel: isSuccess ? '성공' : '실패',
    categoryLabel: sanitizeText(experience.category.name, '카테고리'),
    keywords: [keywordA, keywordB],
    title: sanitizeText(experience.title, '실패 사례'),
    description: sanitizeText(stripImageMarkdown(experience.content), '본문 텍스트 미리보기'),
    authorName: sanitizeText(experience.author.nickname, '닉네임'),
    createdAtLabel: formatDate(experience.createdAt),
    viewCountLabel: experience.viewCount.toLocaleString(),
    bookmarkCountLabel: experience.likeCount.toLocaleString(),
    imageUrl: imageMeta.primaryImageUrl,
    actionLabel: variant === 'large' && !isSuccess ? '성공 사례 보기' : null,
  };
}

function sortExperiences(experiences: Experience[], sortOption: SortOption) {
  const items = [...experiences];
  if (sortOption === 'popular') {
    return items.sort((a, b) => b.viewCount + b.likeCount - (a.viewCount + a.likeCount));
  }

  return items.sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime(),
  );
}

function MyPageTabButton({
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
      aria-pressed={active}
      className={`flex h-[25px] w-[125px] shrink-0 items-center justify-center px-[8px] py-[4px] ${
        active ? 'border-b-[1.5px] border-[#5A876E]' : ''
      }`}
    >
      <span
        className={`text-center font-['Pretendard'] text-[14px] tracking-[0px] ${
          active ? 'font-[600] leading-[16.8px] text-[#5A876E]' : 'font-[400] leading-[16.8px] text-[#BABABA]'
        }`}
      >
        {label}
      </span>
    </button>
  );
}

function RegularCard({
  card,
  onBookmarkClick,
}: {
  card: ExperienceCardViewModel;
  onBookmarkClick: (cardId: number) => void;
}) {
  return (
    <Link to={`/experiences/${card.id}`} className="block h-[135px] w-[375px] bg-[#FFFFFF] px-[16px] py-[12px]">
      <article className="flex h-[111px] flex-col gap-[8px]">
        <div className="flex flex-col gap-[8px]">
          <div className="flex w-[343px] items-center">
            <div className="flex items-start gap-[4px]">
              <span
                className={`flex items-center justify-center rounded-[4px] px-[4px] py-[2px] font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#FFFFFF] ${
                  card.statusLabel === '성공' ? 'bg-[#5A876E]' : 'bg-[#C06D43]'
                }`}
              >
                {card.statusLabel}
              </span>
              <span className="flex items-center justify-center rounded-[4px] bg-[#CBE5D8] px-[4px] py-[2px] font-['Pretendard'] text-[12px] font-[500] leading-[14.4px] tracking-[0px] text-[#5A876E]">
                {card.categoryLabel}
              </span>
              {card.keywords.map((keyword, index) => (
                <span
                  key={`${card.id}-${keyword}-${index}`}
                  className="flex items-center justify-center rounded-[4px] bg-[#D8D8D8] px-[4px] py-[2px] font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#FFFFFF]"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          <div className="flex h-[60px] w-[343px] gap-[8px]">
            <div className="flex h-[60px] min-w-0 flex-1 flex-col">
              <div className="flex min-h-0 flex-1 flex-col gap-[4px]">
                <h2 className="h-[17px] w-[343px] overflow-hidden whitespace-nowrap text-ellipsis font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] tracking-[0px] text-[#131416]">
                  {card.title}
                </h2>
                <p className="h-[17px] w-[343px] overflow-hidden whitespace-nowrap text-ellipsis font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949]">
                  {card.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-[343px] items-center justify-between">
          <div className="flex items-start gap-[4px] font-['Pretendard'] text-[12px] font-[300] leading-[16.8px] tracking-[0px] text-[#8A8A8A]">
            <span>{card.authorName}</span>
            <span>•</span>
            <span>{card.createdAtLabel}</span>
            <span>•</span>
            <div className="flex items-center gap-[2px]">
              <span>조회</span>
              <span>{card.viewCountLabel}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onBookmarkClick(card.id);
            }}
            className="flex min-h-[14px] min-w-[28px] items-center gap-[2px]"
            aria-label="북마크"
          >
            <img src={bookmarkMetaIcon} alt="" className="h-[14px] w-[14px]" />
            <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#8A8A8A]">
              {card.bookmarkCountLabel}
            </span>
          </button>
        </div>
      </article>
    </Link>
  );
}

function LargeCard({
  card,
  onBookmarkClick,
}: {
  card: ExperienceCardViewModel;
  onBookmarkClick: (cardId: number) => void;
}) {
  return (
    <Link to={`/experiences/${card.id}`} className="block h-[173px] w-[375px] bg-[#FFFFFF] px-[16px] py-[12px]">
      <article className="flex h-[149px] flex-col gap-[8px]">
        <div className="flex flex-col gap-[8px]">
          <div className="flex w-[343px] items-center">
            <div className="flex items-start gap-[4px]">
              <span
                className={`flex items-center justify-center rounded-[4px] px-[4px] py-[2px] font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#FFFFFF] ${
                  card.statusLabel === '성공' ? 'bg-[#5A876E]' : 'bg-[#C06D43]'
                }`}
              >
                {card.statusLabel}
              </span>
              <span className="flex items-center justify-center rounded-[4px] bg-[#CBE5D8] px-[4px] py-[2px] font-['Pretendard'] text-[12px] font-[500] leading-[14.4px] tracking-[0px] text-[#5A876E]">
                {card.categoryLabel}
              </span>
              {card.keywords.map((keyword, index) => (
                <span
                  key={`${card.id}-${keyword}-${index}`}
                  className="flex items-center justify-center rounded-[4px] bg-[#D8D8D8] px-[4px] py-[2px] font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#FFFFFF]"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          <div className="flex w-[343px] items-start gap-[8px]">
            <div className="h-[60px] w-[80px] shrink-0 overflow-hidden rounded-[4px] bg-[#8A8A8A]">
              {card.imageUrl ? <img src={card.imageUrl} alt="" className="h-full w-full object-cover" /> : null}
            </div>
            <div className="flex h-[60px] min-w-0 flex-1 flex-col">
              <div className="flex min-h-0 flex-1 flex-col gap-[4px]">
                <h2 className="h-[17px] w-[255px] overflow-hidden whitespace-nowrap text-ellipsis font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] tracking-[0px] text-[#131416]">
                  {card.title}
                </h2>
                <p className="h-[17px] w-[255px] overflow-hidden whitespace-nowrap text-ellipsis font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949]">
                  {card.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-[343px] items-center justify-between">
          <div className="flex items-start gap-[4px] font-['Pretendard'] text-[12px] font-[300] leading-[16.8px] tracking-[0px] text-[#8A8A8A]">
            <span>{card.authorName}</span>
            <span>•</span>
            <span>{card.createdAtLabel}</span>
            <span>•</span>
            <div className="flex items-center gap-[2px]">
              <span>조회</span>
              <span>{card.viewCountLabel}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onBookmarkClick(card.id);
            }}
            className="flex min-h-[14px] min-w-[28px] items-center gap-[2px]"
            aria-label="북마크"
          >
            <img src={bookmarkMetaIcon} alt="" className="h-[14px] w-[14px]" />
            <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#8A8A8A]">
              {card.bookmarkCountLabel}
            </span>
          </button>
        </div>

        <div className="flex w-[343px] justify-end">
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              // TODO: Connect large-card CTA action.
            }}
            className="flex items-center justify-center rounded-[8px] bg-[#5A876E] px-[12px] py-[8px]"
          >
            <span className="font-['Pretendard'] text-[12px] font-[600] leading-[14.4px] tracking-[0px] text-[#FFFFFF]">
              {card.actionLabel ?? '상세보기'}
            </span>
          </button>
        </div>
      </article>
    </Link>
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
      .then((payload) => {
        setWrittenExperiences(payload);
      })
      .catch((loadError) => {
        setWrittenExperiences([]);
        if (isAuthError(loadError)) {
          clearSession();
          return;
        }
        setWrittenError(resolveErrorMessage(loadError, '작성한 글 목록을 불러오지 못했어요.'));
      })
      .finally(() => {
        setWrittenLoading(false);
      });

    void getMyBookmarks(token)
      .then((payload) => {
        setBookmarkedExperiences(payload);
      })
      .catch((loadError) => {
        setBookmarkedExperiences([]);
        if (isAuthError(loadError)) {
          clearSession();
          return;
        }
        setBookmarkError(resolveErrorMessage(loadError, '북마크 목록을 불러오지 못했어요.'));
      })
      .finally(() => {
        setBookmarkLoading(false);
      });

    void getMyRecentViews(token)
      .then((payload) => {
        setRecentExperiences(payload);
      })
      .catch((loadError) => {
        setRecentExperiences([]);
        if (isAuthError(loadError)) {
          clearSession();
          return;
        }
        setRecentError(resolveErrorMessage(loadError, '최근 본 글 목록을 불러오지 못했어요.'));
      })
      .finally(() => {
        setRecentLoading(false);
      });
  }, [token]);

  const writtenCards = useMemo(
    () => sortExperiences(writtenExperiences, sortOption).map(buildExperienceCardViewModel),
    [writtenExperiences, sortOption],
  );

  const bookmarkCards = useMemo(
    () => sortExperiences(bookmarkedExperiences, sortOption).map(buildExperienceCardViewModel),
    [bookmarkedExperiences, sortOption],
  );

  const recentCards = useMemo(
    () => sortExperiences(recentExperiences, sortOption).map(buildExperienceCardViewModel),
    [recentExperiences, sortOption],
  );

  const bookmarkPreviewCards = useMemo(
    () =>
      BOOKMARK_PREVIEW_CARDS.map((item) =>
        item.variant === 'large'
          ? { ...PREVIEW_LARGE_CARD, id: item.id, variant: 'large' as const }
          : { ...PREVIEW_REGULAR_CARD, id: item.id, variant: 'regular' as const },
      ),
    [],
  );

  const currentCards =
    activeTab === 'bookmarked'
      ? FIGMA_PREVIEW_MODE
        ? bookmarkPreviewCards
        : bookmarkCards
      : activeTab === 'written'
        ? writtenCards
        : recentCards;

  const currentLoading =
    activeTab === 'bookmarked' ? bookmarkLoading : activeTab === 'written' ? writtenLoading : recentLoading;

  const currentError =
    activeTab === 'bookmarked' ? bookmarkError : activeTab === 'written' ? writtenError : recentError;

  const emptyMessage =
    activeTab === 'bookmarked'
      ? '북마크한 글이 없습니다'
      : activeTab === 'written'
        ? '작성한 글이 없습니다'
        : '최근 본 글이 없습니다';

  const currentScreenTitle =
    activeTab === 'bookmarked' ? '북마크' : activeTab === 'written' ? '작성한 글' : '최근 본 글';

  const displayCount = currentCards.length;

  async function handleBookmarkRemove(cardId: number) {
    if (FIGMA_PREVIEW_MODE || !token || activeTab !== 'bookmarked') {
      return;
    }

    try {
      await unbookmarkExperience(token, cardId);
      setBookmarkedExperiences((current) => current.filter((experience) => experience.id !== cardId));
      showToast('북마크를 해제했어요.');
    } catch (toggleError) {
      showToast(resolveErrorMessage(toggleError, '북마크를 변경하지 못했어요.'));
    }
  }

  if (!token) {
    return (
      <Layout title="MY" leftType="back" showRightIcon={false} onBack={() => navigate(-1)}>
        <div className="bg-[#FAFAFA] px-[16px] py-[20px]">
          <section className="rounded-[24px] bg-white p-[20px] shadow-sm">
            <p className="text-[18px] font-[600] leading-[22px] text-[#131416]">로그인이 필요해요.</p>
            <p className="mt-[8px] text-[14px] leading-[21px] text-[#6B6B6B]">
              마이페이지 화면을 보려면 로그인해 주세요.
            </p>
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/auth?next=${encodeURIComponent(location.pathname)}&reason=${encodeURIComponent(
                    '마이페이지는 로그인이 필요한 서비스입니다.',
                  )}`,
                )
              }
              className="mt-[20px] h-[48px] w-full rounded-[14px] bg-[#131416] text-[14px] font-[600] text-white"
            >
              로그인 / 회원가입
            </button>
          </section>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={currentScreenTitle} leftType="back" showRightIcon={false} showHeader={false} showBottomNav={false}>
      <div className="mx-auto w-[375px] min-h-[1559px] bg-[#F8F8F8]">
        <header className="fixed left-1/2 top-0 z-50 flex h-[64px] w-[375px] -translate-x-1/2 items-center justify-between bg-[#FFFFFF] px-[16px] py-[20px]">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
                return;
              }
              navigate('/');
            }}
            className="flex h-[24px] w-[24px] items-center justify-center"
            aria-label="뒤로가기"
          >
            <img src={arrowLeftIcon} alt="" className="h-[24px] w-[24px]" />
          </button>

          <h1
            translate="no"
            className="flex h-[19px] items-center justify-center text-center font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-[#000000]"
          >
            {currentScreenTitle}
          </h1>

          <div className="h-[24px] w-[24px]" aria-hidden="true" />
        </header>

        <div className="min-h-[1407px] w-[375px] bg-[#F8F8F8] pb-[110px] pt-[64px]">
          <section className="mt-[10px] border-b border-[#EFEFEF] bg-white pb-[12px] pt-[12px]">
            <div className="flex h-[25px] w-[375px] items-start justify-between bg-[#FFFFFF]">
              <MyPageTabButton
                active={activeTab === 'written'}
                label="작성한 글"
                onClick={() => {
                  navigate('/mypage/written');
                  setSortMenuOpen(false);
                }}
              />
              <MyPageTabButton
                active={activeTab === 'bookmarked'}
                label="북마크"
                onClick={() => {
                  navigate('/mypage/bookmarks');
                  setSortMenuOpen(false);
                }}
              />
              <MyPageTabButton
                active={activeTab === 'recent'}
                label="최근 본 글"
                onClick={() => {
                  navigate('/mypage/recent');
                  setSortMenuOpen(false);
                }}
              />
            </div>

            <div className="mt-[12px] flex h-[17px] w-[375px] items-center justify-between px-[16px]">
              <div className="flex h-[17px] min-w-[34px] items-center font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#000000]">
                <span>{currentLoading ? '...' : displayCount}</span>
                <span>개</span>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSortMenuOpen((current) => !current)}
                  className="flex h-[17px] w-[49px] items-center justify-end"
                  aria-expanded={sortMenuOpen}
                >
                  <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#131416]">
                    {sortOption === 'latest' ? '최신순' : '인기순'}
                  </span>
                  <img src={chevronDownIcon} alt="" className="h-[17px] w-[17px]" />
                </button>

                {sortMenuOpen ? (
                  <div className="absolute right-0 top-[24px] z-20 min-w-[78px] rounded-[10px] border border-[#EEEEEE] bg-white p-[6px] shadow-[0_8px_20px_rgba(0,0,0,0.08)]">
                    {(['latest', 'popular'] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setSortOption(option);
                          setSortMenuOpen(false);
                        }}
                        className={`flex w-full rounded-[8px] px-[10px] py-[8px] text-left text-[12px] ${
                          sortOption === option ? 'bg-[#F4F8F5] font-[600] text-[#375E49]' : 'text-[#5E5E5E]'
                        }`}
                      >
                        {option === 'latest' ? '최신순' : '인기순'}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="bg-white">
            {currentLoading ? (
              <ListSkeleton count={6} />
            ) : currentError ? (
              <div className="px-[16px] py-[24px]">
                <ErrorState message={currentError} />
              </div>
            ) : currentCards.length ? (
              <div className="flex w-[375px] flex-col gap-[2px] bg-[#F8F8F8] pb-[110px]">
                {currentCards.map((card) =>
                  card.variant === 'large' ? (
                    <LargeCard
                      key={`${activeTab}-${card.id}`}
                      card={card}
                      onBookmarkClick={activeTab === 'bookmarked' ? handleBookmarkRemove : () => {}}
                    />
                  ) : (
                    <RegularCard
                      key={`${activeTab}-${card.id}`}
                      card={card}
                      onBookmarkClick={activeTab === 'bookmarked' ? handleBookmarkRemove : () => {}}
                    />
                  ),
                )}
              </div>
            ) : (
              <div className="px-[16px] py-[40px]">
                <PageMessage message={emptyMessage} />
              </div>
            )}
          </section>
        </div>

        <div className="pointer-events-none fixed bottom-0 left-1/2 z-40 w-[375px] -translate-x-1/2">
          <div className="flex h-[68px] w-[375px] items-center justify-between px-[24px] py-[16px]">
            <button
              type="button"
              onClick={() => navigate('/faq')}
              className="pointer-events-auto flex h-[36px] w-[36px] items-center justify-center rounded-[999px] bg-[#FFFFFF] shadow-[0_0_4px_rgba(0,0,0,0.15)]"
              aria-label="도움말"
            >
              <img src={helpFabIcon} alt="" className="h-[17px] w-[17px]" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/create')}
              className="pointer-events-auto flex h-[36px] w-[36px] items-center justify-center rounded-[999px] bg-[#5A876E] shadow-[0_0_4px_rgba(0,0,0,0.15)]"
              aria-label="작성하기"
            >
              <img src={plusFabIcon} alt="" className="h-[20px] w-[20px]" />
            </button>
          </div>

          <nav className="flex h-[84px] w-[375px] items-center justify-between rounded-t-[20px] bg-[#FFFFFF] px-[40px] pb-[32px] pt-[12px] shadow-[0_0_5px_rgba(0,0,0,0.15)]">
            {BOTTOM_NAV_ITEMS.map((item) => {
              const isActive = item.matches(location.pathname);
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="pointer-events-auto flex min-h-[40px] min-w-[40px] flex-col items-center justify-center gap-[4px]"
                  aria-current={isActive ? 'page' : undefined}
                >
                  <img src={item.icon} alt="" className={`h-[24px] w-[24px] ${isActive ? 'opacity-100' : 'opacity-30'}`} />
                  <span
                    translate="no"
                    className={`whitespace-nowrap text-center text-[12px] leading-[12px] ${
                      isActive ? 'font-[600] text-[#5A876E]' : 'font-[400] text-[#1F1F1F]'
                    }`}
                  >
                    {item.name}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </Layout>
  );
}
