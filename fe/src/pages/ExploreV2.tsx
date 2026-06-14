import { useEffect, useMemo, useRef, useState, type MouseEvent, type RefObject } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import arrowLeftIcon from '../assets/auth-figma/arrow-left.svg';
import chevronDownIcon from '../assets/explore-figma/chevron-down.svg';
import filterIcon from '../assets/explore-figma/filter.svg';
import bookmarkIcon from '../assets/figma-downloaded-icons/home/Bookmark.svg';
import edit3Icon from '../assets/figma-downloaded-icons/home/Edit 3.svg';
import guideIcon from '../assets/figma-downloaded-icons/home/NavigationBar/live_help_20dp_1F1F1F_FILL0_wght400_GRAD0_opsz20 1.svg';
import heartIcon from '../assets/figma-downloaded-icons/home/Heart.svg';
import homeIcon from '../assets/figma-downloaded-icons/home/Home.svg';
import plusIcon from '../assets/figma-downloaded-icons/home/Plus.svg';
import searchNavIcon from '../assets/figma-downloaded-icons/home/Search.svg';
import subtractIcon from '../assets/figma-downloaded-icons/home/Subtract.svg';
import userIcon from '../assets/figma-downloaded-icons/home/User.svg';
import searchIcon from '../assets/home-v1-figma/icons/search-figma.svg';
import HorizontalScroll from '../components/common/HorizontalScroll';
import BottomNav from '../components/layout/BottomNav';
import { ErrorState, ListSkeleton } from '../components/common/Skeleton';
import { useToast } from '../components/common/useToast';
import {
  bookmarkExperience,
  getBookmarkStatus,
  getExperiences,
  getFailurePatternStats,
  getReactionSummary,
  reactToExperience,
  searchCases,
  type Category,
  type Experience,
  type FailurePatternStatsPayload,
  type ReactionSummaryPayload,
  unbookmarkExperience,
  unreactToExperience,
  type UserSummary,
} from '../lib/api';
import { publishBookmarkSync } from '../lib/bookmark-sync';
import { extractExperienceImageUrls } from '../lib/experience-images';
import { readRecentExploreSearches, saveRecentExploreSearch } from '../lib/recent-explore-searches';
import { resolveErrorMessage } from '../lib/resolve-error-message';
import { getAccessToken } from '../lib/session';

type SortKey = 'latest' | 'popular';
type SortOption = 'latest' | 'likes' | 'views';
type FeedMode = 'all' | 'failure' | 'success';

type ExploreCategory = {
  id: number | null;
  label: string;
};

type FigmaFixtureOptions = {
  ctaDisabled?: boolean;
  ctaLabel?: string;
  preview?: string;
  showThumbnail?: boolean;
  sourceExperienceId?: number;
  title?: string;
};

type CardInteractionState = ReactionSummaryPayload & {
  bookmarked: boolean;
  bookmarkCount: number;
};

const textFeatureStyle = { fontFeatureSettings: '"case" 1' } as const;
const clampStyle = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap' as const,
} as const;

const EXPLORE_CATEGORIES: ExploreCategory[] = [
  { id: null, label: '전체' },
  { id: 1, label: '온라인 판매 · 이커머스' },
  { id: 2, label: '콘텐츠 · SNS 기반' },
  { id: 3, label: '디지털 상품·지식 판매' },
  { id: 4, label: '플랫폼 기반 노동형' },
  { id: 5, label: '재능 판매·프리랜서' },
  { id: 6, label: '투자·재테크' },
  { id: 7, label: '오프라인 기반 부업' },
];

const SORT_OPTIONS: Array<{ key: SortOption; label: string }> = [
  { key: 'latest', label: '최신순' },
  { key: 'likes', label: '추천순' },
  { key: 'views', label: '조회수순' },
];

const FEED_OPTIONS: Array<{ key: FeedMode; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'failure', label: '실패' },
  { key: 'success', label: '성공' },
];

const CATEGORY_ID_TO_STATS_SLUG: Record<number, string> = {
  1: 'online-commerce',
  2: 'content-sns',
  3: 'digital-products',
  4: 'platform-labor',
  5: 'talent-freelance',
  6: 'investment',
  7: 'offline-sidejob',
};

const DEFAULT_SEARCH_STATS_SLUG = 'online-commerce';

const FIGMA_SEARCH_FIXTURE_USER: UserSummary = {
  id: -9000,
  email: 'sidepick-import@sidepick.local',
  nickname: '닉네임',
  fullName: null,
  birthDate: null,
  gender: null,
  region: null,
  signupPurposes: [],
  experienceStatus: null,
  ageGroup: '',
  profileImage: null,
  authProvider: 'LOCAL',
  emailVerified: true,
  profileCompleted: true,
  createdAt: '2026-01-01T00:00:00',
};

const FIGMA_SEARCH_FIXTURE_CATEGORY: Category = {
  id: 1,
  name: '카테고리',
  description: '',
  icon: '',
  color: '#5A876E',
  slug: 'online-commerce',
  type: 'business_field',
};

function createFigmaSearchFixture(
  id: number,
  caseStatus: Experience['caseStatus'],
  options: FigmaFixtureOptions = {},
): Experience {
  return {
    id,
    author: FIGMA_SEARCH_FIXTURE_USER,
    category: FIGMA_SEARCH_FIXTURE_CATEGORY,
    caseStatus,
    title: options.title ?? '제목',
    content:
      options.preview ??
      '본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기',
    businessType: null,
    investmentAmount: null,
    durationMonths: null,
    weeklyHours: null,
    averageDailyHours: null,
    isConcurrentWithMainJob: null,
    monthlyRevenue: null,
    failureReason: null,
    failureReasons: ['키워드', '키워드'],
    difficulties: [],
    difficultyEtc: null,
    difficultyExtra: null,
    targetMarket: null,
    marketingChannels: [],
    lessonsLearned: null,
    wouldRetry: null,
    analysis: {
      structuredSummary: '',
      extractedPatterns: [],
      keywords: ['키워드', '키워드'],
      failureCategory: '',
      riskLevel: '',
      riskFactors: [],
      successFactors: [],
      confidenceScore: null,
    },
    structuredData: {
      figmaCardCtaDisabled: options.ctaDisabled ?? false,
      figmaCardCtaLabel: options.ctaLabel ?? '성공 사례 보기',
      figmaCardShowThumbnail: options.showThumbnail ?? false,
      ...(typeof options.sourceExperienceId === 'number' ? { sourceExperienceId: options.sourceExperienceId } : {}),
    },
    viewCount: 999,
    likeCount: 999,
    bookmarkCount: 999,
    hasPatternAnalysis: false,
    createdAt: '2026-06-01T00:00:00',
    updatedAt: '2026-06-01T00:00:00',
  };
}

const FIGMA_SEARCH_RESULT_FIXTURES: Experience[] = [
  createFigmaSearchFixture(-9101, 'SUCCESS', { showThumbnail: true }),
  createFigmaSearchFixture(-9102, 'FAILURE', { showThumbnail: true }),
  createFigmaSearchFixture(-9103, 'FAILURE', { showThumbnail: true, ctaDisabled: true, ctaLabel: '성공 사례 없음' }),
  createFigmaSearchFixture(-9104, 'SUCCESS', { showThumbnail: false }),
  createFigmaSearchFixture(-9105, 'FAILURE', { showThumbnail: true }),
  createFigmaSearchFixture(-9106, 'SUCCESS', { showThumbnail: false }),
  createFigmaSearchFixture(-9107, 'FAILURE', { showThumbnail: false }),
  createFigmaSearchFixture(-9108, 'SUCCESS', { showThumbnail: false }),
];

function shouldUseFigmaSearchFixture(searchKeyword: string, searchMode: boolean) {
  return searchMode || searchKeyword.trim().length > 0;
}

function getFallbackCategory(categoryId: number | null) {
  if (categoryId === null) {
    return FIGMA_SEARCH_FIXTURE_CATEGORY;
  }

  const selectedCategory = EXPLORE_CATEGORIES.find((category) => category.id === categoryId);
  if (!selectedCategory) {
    return FIGMA_SEARCH_FIXTURE_CATEGORY;
  }

  return {
    ...FIGMA_SEARCH_FIXTURE_CATEGORY,
    id: categoryId,
    name: selectedCategory.label,
    slug: CATEGORY_ID_TO_STATS_SLUG[categoryId] ?? FIGMA_SEARCH_FIXTURE_CATEGORY.slug,
  };
}

function getExploreFallbackFixtures(categoryId: number | null) {
  const fallbackCategory = getFallbackCategory(categoryId);
  return FIGMA_SEARCH_RESULT_FIXTURES.map((experience) => ({
    ...experience,
    category: fallbackCategory,
  }));
}

function withFigmaSearchFixture(experiences: Experience[], searchKeyword: string, searchMode: boolean) {
  if (!shouldUseFigmaSearchFixture(searchKeyword, searchMode)) {
    return experiences;
  }

  const sourceExperiences = experiences.filter((experience) => experience.id > 0);
  if (sourceExperiences.length === 0) {
    return FIGMA_SEARCH_RESULT_FIXTURES;
  }

  return FIGMA_SEARCH_RESULT_FIXTURES.map((fixture, index) => ({
    ...fixture,
    structuredData: {
      ...fixture.structuredData,
      sourceExperienceId: sourceExperiences[index % sourceExperiences.length]?.id,
    },
  }));
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

function matchesFeedMode(experience: Experience, mode: FeedMode) {
  if (mode === 'all') {
    return true;
  }

  const isSuccess = experience.caseStatus === 'SUCCESS';
  return mode === 'success' ? isSuccess : !isSuccess;
}

function sortExperiences(experiences: Experience[], sortOption: SortOption) {
  const sorted = [...experiences];
  if (sortOption === 'likes') {
    return sorted.sort((a, b) => b.likeCount - a.likeCount);
  }
  if (sortOption === 'views') {
    return sorted.sort((a, b) => b.viewCount - a.viewCount);
  }
  return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function sanitizeDisplayText(value: string | null | undefined, fallback: string) {
  const normalized = (value ?? '').replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return fallback;
  }
  if (normalized.includes('�') || /\?{3,}/.test(normalized)) {
    return fallback;
  }
  return normalized;
}

function getKeywordTags(experience: Experience) {
  const rawTags = [
    ...(experience.analysis?.keywords ?? []),
    ...experience.failureReasons,
    ...experience.difficulties,
    experience.businessType ?? '',
  ]
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => value !== experience.category.name);

  const unique: string[] = [];
  for (const tag of rawTags) {
    if (!unique.includes(tag)) {
      unique.push(tag);
    }
  }

  return [sanitizeDisplayText(unique[0], '키워드'), sanitizeDisplayText(unique[1], '키워드')];
}

function stopCardEvent(event: MouseEvent<HTMLElement>) {
  event.preventDefault();
  event.stopPropagation();
}

function SearchHeader({
  searchMode,
  onBack,
  onSearchClick,
}: {
  searchMode: boolean;
  onBack: () => void;
  onSearchClick: () => void;
}) {
  return (
    <header className="flex h-[64px] items-center justify-between bg-white px-[16px] py-[20px]">
      <button type="button" onClick={onBack} className="flex h-[24px] w-[24px] items-center justify-center" aria-label="뒤로가기">
        <img src={arrowLeftIcon} alt="" className="h-[24px] w-[24px]" />
      </button>
      <h1 className="font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] text-black" style={textFeatureStyle}>
        사례 탐색
      </h1>
      <button type="button" onClick={onSearchClick} className="flex h-[24px] w-[24px] items-center justify-center" aria-label={searchMode ? '검색 실행' : '검색'}>
        <img src={searchIcon} alt="" className="h-[20px] w-[20px]" />
      </button>
    </header>
  );
}

function SearchField({
  value,
  inputRef,
  onChange,
  onSubmit,
}: {
  value: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="bg-white px-[16px]">
      <label className="relative block h-[36px] w-[343px] cursor-text">
        <span className="absolute inset-0 flex items-center justify-between rounded-[999px] border border-[#EEEEEE] bg-[#F8F8F8] px-[16px] py-[8px]">
          {!value ? (
            <span className="font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] text-[#BABABA]">
              원하는 실패 사례를 검색해보세요!
            </span>
          ) : null}
          <img src={searchIcon} alt="" className="ml-auto h-[20px] w-[20px] shrink-0" />
        </span>
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onSubmit();
            }
          }}
          className="absolute inset-0 h-full w-full rounded-[999px] bg-transparent px-[16px] pr-[44px] font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] text-[#131416] outline-none"
          aria-label="검색어 입력"
        />
      </label>
    </div>
  );
}

function CategoryChip({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={`flex h-[26px] shrink-0 items-center justify-center rounded-[999px] px-[10px] py-[6px] font-['Pretendard'] text-[12px] font-[500] leading-[14.4px] ${
        active ? 'bg-[#5A876E] text-white' : 'border border-[#EEEEEE] bg-white text-[#5A876E]'
      }`}
      style={textFeatureStyle}
    >
      {label}
    </span>
  );
}

function SortDropdown({
  value,
  open,
  onToggle,
  onSelect,
}: {
  value: SortOption;
  open: boolean;
  onToggle: () => void;
  onSelect: (value: SortOption) => void;
}) {
  const active = SORT_OPTIONS.find((option) => option.key === value) ?? SORT_OPTIONS[0];

  return (
    <div className="relative">
      <button type="button" onClick={onToggle} className="flex h-[17px] items-center text-[12px] font-[400] leading-[16.8px] text-[#131416]">
        <span className="font-['Pretendard']" style={textFeatureStyle}>
          {active.label}
        </span>
        <img src={chevronDownIcon} alt="" className={`h-[20px] w-[20px] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div className="absolute right-0 top-[25px] z-20 flex flex-col gap-[12px] overflow-hidden rounded-[4px] bg-white px-[12px] py-[8px] shadow-[0_0_4px_rgba(0,0,0,0.15)]">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => onSelect(option.key)}
              className="text-left font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#5E5E5E]"
              style={textFeatureStyle}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ExploreToolbar({
  selectedCategoryId,
  onCategorySelect,
  resultCount,
  sortOption,
  sortMenuOpen,
  onToggleSort,
  onSelectSort,
}: {
  selectedCategoryId: number | null;
  onCategorySelect: (value: number | null) => void;
  resultCount: number;
  sortOption: SortOption;
  sortMenuOpen: boolean;
  onToggleSort: () => void;
  onSelectSort: (value: SortOption) => void;
}) {
  return (
    <div className="flex h-[79px] flex-col gap-[12px] bg-white py-[12px]">
      <div className="flex items-center gap-[8px] px-[16px]">
        <button type="button" onClick={() => onCategorySelect(null)} className="flex h-[26px] w-[26px] items-center justify-center" aria-label="카테고리 초기화">
          <img src={filterIcon} alt="" className="h-[26px] w-[26px]" />
        </button>
        <HorizontalScroll wrapperClassName="min-w-0 flex-1" scrollerClassName="pr-[16px]" contentClassName="gap-[6px]">
          {EXPLORE_CATEGORIES.map((category) => {
            const active = (selectedCategoryId === null && category.id === null) || selectedCategoryId === category.id;
            return (
              <button key={String(category.id)} type="button" onClick={() => onCategorySelect(category.id)} className="shrink-0">
                <CategoryChip label={category.label} active={active} />
              </button>
            );
          })}
        </HorizontalScroll>
      </div>
      <div className="flex items-center justify-between px-[16px]">
        <div className="flex items-center font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-black" style={textFeatureStyle}>
          <span>{resultCount.toLocaleString()}</span>
          <span>개</span>
        </div>
        <SortDropdown value={sortOption} open={sortMenuOpen} onToggle={onToggleSort} onSelect={onSelectSort} />
      </div>
    </div>
  );
}

function SimilarityIndicator({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div className="flex shrink-0 items-center gap-[4px]">
      <div className="flex h-[4px] w-[30px] items-start rounded-[999px] bg-[#EEEEEE]">
        <div className="h-[4px] rounded-[999px] bg-[#FFC13B]" style={{ width: `${Math.max(4, (21 / 30) * clamped)}px` }} />
      </div>
      <div className="flex items-center font-['Pretendard'] text-[12px] font-[600] leading-[16.8px] text-[#8A8A8A]" style={textFeatureStyle}>
        <span>{clamped}</span>
        <span>%</span>
      </div>
    </div>
  );
}

function StatsAccordion({
  categoryLabel,
  stats,
  loading,
  error,
}: {
  categoryLabel: string;
  stats: FailurePatternStatsPayload | null;
  loading: boolean;
  error: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="bg-white">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex h-[44px] w-full items-center justify-between px-[16px] py-[12px]"
      >
        <div className="flex items-center gap-[4px]">
          <span className="font-['Pretendard'] text-[14px] font-[600] leading-[16.8px] text-[#5A876E]" style={textFeatureStyle}>
            카테고리
          </span>
          <span className="font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] text-black" style={textFeatureStyle}>
            통계
          </span>
          <span className="flex h-[14px] w-[14px] items-center justify-center rounded-[10px] border border-[#D9D9D9] text-[10px] leading-none text-[#8A8A8A]">
            ?
          </span>
        </div>
        <img src={chevronDownIcon} alt="" className={`h-[20px] w-[20px] transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded ? (
        <div className="border-t border-[#F4F4F4] bg-[#F8F8F8] px-[16px] py-[12px]">
          {loading ? (
            <div className="rounded-[8px] border border-[#F1F1F1] bg-white px-[16px] py-[16px] shadow-[0_0_4px_rgba(0,0,0,0.06)]">
              <div className="h-[19px] w-[108px] animate-pulse rounded-full bg-[#E7EFEA]" />
              <div className="mt-[8px] h-[17px] w-[188px] animate-pulse rounded-full bg-[#EEF4F0]" />
              <div className="mt-[18px] flex flex-col gap-[14px]">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="flex items-center gap-[12px]">
                    <div className="h-[14px] w-[86px] animate-pulse rounded-full bg-[#EEF4F0]" />
                    <div className="h-[6px] flex-1 animate-pulse rounded-full bg-[#E7EFEA]" />
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="rounded-[8px] border border-[#F1F1F1] bg-white px-[16px] py-[16px] shadow-[0_0_4px_rgba(0,0,0,0.06)]">
              <ErrorState message={error} />
            </div>
          ) : !stats?.sufficientData ? (
            <div className="rounded-[8px] border border-[#F1F1F1] bg-white px-[16px] py-[16px] shadow-[0_0_4px_rgba(0,0,0,0.06)]">
              <h3 className="font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] text-[#131416]">데이터 수집 중이에요</h3>
              <p className="pt-[8px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#5F6662]">
                {stats?.explanation.insufficientMessage ?? `${categoryLabel} 카테고리의 사례가 부족해 통계를 제공하기 어려워요.`}
              </p>
            </div>
          ) : (
            <div className="rounded-[8px] border border-[#F1F1F1] bg-white px-[16px] py-[16px] shadow-[0_0_4px_rgba(0,0,0,0.06)]">
              <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#5F6662]">{stats.summary}</p>
              <div className="mt-[16px] flex flex-col gap-[16px]">
                {stats.patterns.slice(0, 3).map((pattern) => (
                  <div key={pattern.label} className="flex flex-col gap-[4px]">
                    <div className="flex items-center justify-between text-[12px] leading-[16.8px] text-[#131416]">
                      <span className="font-['Pretendard'] font-[400]" style={textFeatureStyle}>
                        {pattern.label}
                      </span>
                      <span className="font-['Pretendard'] font-[400]" style={textFeatureStyle}>
                        {pattern.percent}%
                      </span>
                    </div>
                    <div className="h-[6px] rounded-[999px] bg-[#E7EFEA]">
                      <div className="h-[6px] rounded-[999px] bg-[#5A876E]" style={{ width: `${Math.max(6, pattern.percent)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

function ExploreCard({
  experience,
  interaction,
  showSimilarity,
  onBookmarkToggle,
  onHeartToggle,
  onSuccessClick,
}: {
  experience: Experience;
  interaction: CardInteractionState | null;
  showSimilarity: boolean;
  onBookmarkToggle: (experience: Experience) => void;
  onHeartToggle: (experience: Experience) => void;
  onSuccessClick: (experience: Experience) => void;
}) {
  const tags = [
    experience.caseStatus === 'SUCCESS' ? '성공' : '실패',
    sanitizeDisplayText(experience.category.name, '카테고리'),
    ...getKeywordTags(experience),
  ];
  const imageUrls = extractExperienceImageUrls(experience);
  const thumbnailUrl = imageUrls[0] ?? null;
  const showThumbnail = experience.structuredData.figmaCardShowThumbnail === true || Boolean(thumbnailUrl);
  const isSuccess = experience.caseStatus === 'SUCCESS';
  const ctaLabel =
    typeof experience.structuredData.figmaCardCtaLabel === 'string' ? experience.structuredData.figmaCardCtaLabel : '성공 사례 보기';
  const ctaDisabled = experience.structuredData.figmaCardCtaDisabled === true;
  const safeTitle = sanitizeDisplayText(experience.title, `${experience.category.name} 사례`);
  const safePreview = sanitizeDisplayText(
    experience.content.replace(/!\[[^\]]*]\(([^)]+)\)/g, '').replace(/\s+/g, ' ').trim(),
    '본문 미리보기를 준비 중입니다.',
  );
  const safeNickname = sanitizeDisplayText(experience.author.nickname, '닉네임');
  const sourceExperienceId = Number(experience.structuredData.sourceExperienceId);
  const detailExperienceId = experience.id < 0 && Number.isFinite(sourceExperienceId) ? sourceExperienceId : experience.id;
  const heartActive = interaction?.myReactions.includes('HEART') ?? false;
  const heartCount = interaction?.heartCount ?? experience.likeCount;
  const bookmarkActive = interaction?.bookmarked ?? false;
  const bookmarkCount = interaction?.bookmarkCount ?? (experience.bookmarkCount ?? 0);

  return (
    <Link
      to={`/experiences/${detailExperienceId}`}
      className={`block w-full overflow-hidden rounded-[4px] bg-white shadow-[0px_0px_2px_0px_rgba(0,0,0,0.1)] ${isSuccess ? 'min-h-[150px]' : 'min-h-[188px]'}`}
    >
      <article className="flex h-full w-full flex-col gap-[8px] bg-white px-[16px] py-[20px]">
        <div className="flex w-full items-start justify-between">
          <div className="flex min-w-0 items-start gap-[4px] overflow-hidden">
            <span className={`flex h-[16px] shrink-0 items-center justify-center rounded-[4px] px-[4px] py-[2px] text-[10px] font-[500] leading-[12px] ${
              isSuccess ? 'bg-[#5A876E] text-white' : 'bg-[#C06D43] text-white'
            }`}>{tags[0]}</span>
            <span className="flex h-[16px] shrink-0 items-center justify-center rounded-[4px] bg-[#CBE5D8] px-[4px] py-[2px] text-[10px] font-[500] leading-[12px] text-[#5A876E]">
              {tags[1]}
            </span>
            <span className="flex h-[16px] shrink-0 items-center justify-center rounded-[4px] bg-[#E6E6E6] px-[4px] py-[2px] text-[10px] font-[500] leading-[12px] text-[#8A8A8A]">
              {tags[2]}
            </span>
            <span className="flex h-[16px] shrink-0 items-center justify-center rounded-[4px] bg-[#E6E6E6] px-[4px] py-[2px] text-[10px] font-[500] leading-[12px] text-[#8A8A8A]">
              {tags[3]}
            </span>
          </div>
          {showSimilarity ? <SimilarityIndicator percent={99} /> : null}
        </div>

        <div className="flex h-[60px] w-full items-start gap-[8px]">
          {showThumbnail ? (
            thumbnailUrl ? (
              <img src={thumbnailUrl} alt="" className="h-[60px] w-[80px] shrink-0 rounded-[4px] object-cover" />
            ) : (
              <div className="h-[60px] w-[80px] shrink-0 rounded-[4px] bg-[#D8D8D8]" />
            )
          ) : null}

          <div className={`flex h-[60px] min-w-px flex-col items-start ${showThumbnail ? 'flex-[1_0_0]' : 'w-full'}`}>
            <div className="flex min-h-px w-full flex-[1_0_0] flex-col gap-[4px] whitespace-nowrap">
              <h2 className="w-full overflow-hidden text-ellipsis font-['Pretendard'] text-[14px] font-[600] leading-[16.8px] text-[#131416]" style={textFeatureStyle}>
                {safeTitle}
              </h2>
              <p className="w-full font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#494949]" style={{ ...textFeatureStyle, ...clampStyle }}>
                {safePreview}
              </p>
            </div>
          </div>
        </div>

        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-[4px] font-['Pretendard'] text-[12px] font-[300] leading-[16.8px] text-[#8A8A8A]" style={textFeatureStyle}>
            <span>{safeNickname}</span>
            <span>•</span>
            <span>{formatDate(experience.createdAt)}</span>
            <span>•</span>
            <span className="flex items-center gap-[2px]">
              <span>조회</span>
              <span>{experience.viewCount.toLocaleString()}</span>
            </span>
          </div>

          <div className="flex items-center gap-[4px]">
            <button
              type="button"
              onClick={(event) => {
                stopCardEvent(event);
                onHeartToggle(experience);
              }}
              className="m-0 flex items-center border-0 bg-transparent p-0"
              aria-label={heartActive ? '공감 취소' : '공감해요'}
            >
              <div className="flex items-center gap-[2px]">
                <div className="flex h-[20px] w-[20px] items-center justify-center">
                  <img src={heartIcon} alt="" className="h-[14px] w-[14px]" />
                </div>
                <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#8A8A8A]" style={textFeatureStyle}>
                  {heartCount.toLocaleString()}
                </span>
              </div>
            </button>
            <button
              type="button"
              onClick={(event) => {
                stopCardEvent(event);
                onBookmarkToggle(experience);
              }}
              className="m-0 flex items-center border-0 bg-transparent p-0"
              aria-label={bookmarkActive ? '북마크 해제' : '북마크 추가'}
            >
              <div className="flex items-center gap-[2px]">
                <div className="flex h-[24px] w-[24px] items-center justify-center">
                  <img src={bookmarkIcon} alt="" className="h-[14px] w-[14px]" />
                </div>
                <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#8A8A8A]" style={textFeatureStyle}>
                  {bookmarkCount.toLocaleString()}
                </span>
              </div>
            </button>
          </div>
        </div>

        {!isSuccess ? (
          <div className="flex w-full items-end justify-end">
            <button
              type="button"
              onClick={(event) => {
                stopCardEvent(event);
                if (!ctaDisabled) {
                  onSuccessClick(experience);
                }
              }}
              disabled={ctaDisabled}
              className={`flex h-[30px] items-center justify-center rounded-[8px] px-[12px] py-[8px] font-['Pretendard'] text-[12px] font-[600] leading-[14.4px] text-white ${
                ctaDisabled ? 'bg-[#CBE5D8]' : 'bg-[#5A876E]'
              }`}
              style={textFeatureStyle}
            >
              {ctaLabel}
            </button>
          </div>
        ) : null}
      </article>
    </Link>
  );
}

function FeedSegment({
  feedMode,
  onChange,
}: {
  feedMode: FeedMode;
  onChange: (value: FeedMode) => void;
}) {
  return (
    <div className="flex h-[38px] items-center rounded-[999px] bg-white px-[8px] py-[6px] shadow-[0px_0px_2px_rgba(0,0,0,0.15)]">
      <div className="flex items-center gap-[4px]">
        {FEED_OPTIONS.map((option) => {
          const active = feedMode === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onChange(option.key)}
              className={`rounded-[999px] px-[8px] py-[6px] font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] ${
                active ? 'bg-[#375E49] text-white' : 'bg-white text-black'
              }`}
              style={textFeatureStyle}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ExploreBottomBar({
  feedMode,
  fabExpanded,
  onFeedChange,
  onToggleFab,
  onCreateClick,
}: {
  feedMode: FeedMode;
  fabExpanded: boolean;
  onFeedChange: (value: FeedMode) => void;
  onToggleFab: () => void;
  onCreateClick: () => void;
}) {
  const navigate = useNavigate();

  return (
    <div className="pointer-events-none fixed bottom-0 left-1/2 z-30 w-full max-w-[375px] -translate-x-1/2">
      <div className="pointer-events-auto flex h-[70px] items-center justify-between px-[24px] py-[16px]">
        <div className="h-[36px] w-[36px]" aria-hidden="true" />
        <FeedSegment feedMode={feedMode} onChange={onFeedChange} />
        <div className="relative flex h-[36px] w-[36px] items-center justify-end">
          {fabExpanded ? (
            <div className="absolute bottom-[52px] right-0 flex flex-col gap-[12px] rounded-[10px] bg-white px-[10px] py-[12px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)]">
              <button type="button" onClick={() => navigate('/coming-soon')} className="flex items-center gap-[8px] whitespace-nowrap">
                <img src={subtractIcon} alt="" className="h-[17px] w-[17px]" />
                <span className="font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] text-black" style={textFeatureStyle}>
                  AI 챗봇
                </span>
              </button>
              <button type="button" onClick={onCreateClick} className="flex items-center gap-[8px] whitespace-nowrap">
                <img src={edit3Icon} alt="" className="h-[20px] w-[20px]" />
                <span className="font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] text-black" style={textFeatureStyle}>
                  경험 작성
                </span>
              </button>
            </div>
          ) : null}
          <button type="button" onClick={onToggleFab} className="flex h-[36px] w-[36px] items-center justify-center rounded-[999px] bg-[#5A876E] p-[2px]" aria-label="작성 메뉴">
            <img src={plusIcon} alt="" className="h-[20px] w-[20px]" />
          </button>
        </div>
      </div>

      <nav className="pointer-events-auto flex h-[84px] items-start justify-between rounded-t-[20px] bg-white px-[40px] pb-[32px] pt-[12px] shadow-[0px_0px_5px_rgba(0,0,0,0.15)]">
        <button type="button" onClick={() => navigate('/')} className="flex flex-col items-center gap-[4px] opacity-30">
          <img src={homeIcon} alt="" className="h-[24px] w-[24px]" />
          <span className="font-['Pretendard'] text-[12px] font-[400] leading-none text-black" style={textFeatureStyle}>
            홈
          </span>
        </button>
        <button type="button" onClick={() => navigate('/explore')} className="flex flex-col items-center gap-[4px]">
          <img src={searchNavIcon} alt="" className="h-[24px] w-[24px]" />
          <span className="font-['Pretendard'] text-[12px] font-[600] leading-none text-[#5A876E]" style={textFeatureStyle}>
            탐색
          </span>
        </button>
        <button type="button" onClick={() => navigate('/coming-soon')} className="flex flex-col items-center gap-[4px] opacity-30">
          <img src={guideIcon} alt="" className="h-[24px] w-[24px]" />
          <span className="font-['Pretendard'] text-[12px] font-[400] leading-none text-black" style={textFeatureStyle}>
            가이드
          </span>
        </button>
        <button type="button" onClick={() => navigate('/mypage')} className="flex flex-col items-center gap-[4px] opacity-30">
          <img src={userIcon} alt="" className="h-[24px] w-[24px]" />
          <span className="font-['Pretendard'] text-[12px] font-[400] leading-none text-black" style={textFeatureStyle}>
            MY
          </span>
        </button>
      </nav>
    </div>
  );
}

function SharedExploreBottomBar({
  feedMode,
  fabExpanded,
  onFeedChange,
  onToggleFab,
  onCreateClick,
}: {
  feedMode: FeedMode;
  fabExpanded: boolean;
  onFeedChange: (value: FeedMode) => void;
  onToggleFab: () => void;
  onCreateClick: () => void;
}) {
  const navigate = useNavigate();

  return (
    <BottomNav
      active="explore"
      accessoryLayout="between"
      accessory={
        <>
          <div className="h-[36px] w-[36px]" aria-hidden="true" />
          <div className="pointer-events-auto">
            <FeedSegment feedMode={feedMode} onChange={onFeedChange} />
          </div>
          <div className="pointer-events-auto relative flex h-[36px] w-[36px] items-center justify-end">
            {fabExpanded ? (
              <div className="absolute bottom-[52px] right-0 flex flex-col gap-[12px] rounded-[10px] bg-white px-[10px] py-[12px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)]">
                <button type="button" onClick={() => navigate('/coming-soon')} className="flex items-center gap-[8px] whitespace-nowrap">
                  <img src={subtractIcon} alt="" className="h-[17px] w-[17px]" />
                  <span className="font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] text-black" style={textFeatureStyle}>
                    AI 梨쀫큸
                  </span>
                </button>
                <button type="button" onClick={onCreateClick} className="flex items-center gap-[8px] whitespace-nowrap">
                  <img src={edit3Icon} alt="" className="h-[20px] w-[20px]" />
                  <span className="font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] text-black" style={textFeatureStyle}>
                    寃쏀뿕 ?묒꽦
                  </span>
                </button>
              </div>
            ) : null}
            <button type="button" onClick={onToggleFab} className="flex h-[36px] w-[36px] items-center justify-center rounded-[999px] bg-[#5A876E] p-[2px]" aria-label="?묒꽦 硫붾돱">
              <img src={plusIcon} alt="" className="h-[20px] w-[20px]" />
            </button>
          </div>
        </>
      }
    />
  );
}

void ExploreBottomBar;

export default function ExploreV2() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const accessToken = getAccessToken();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const initialKeyword = searchParams.get('q') ?? '';
  const initialMode = searchParams.get('mode');
  const initialCategoryId = searchParams.get('categoryId');
  const initialFeed = searchParams.get('feed');
  const sourceExperienceId = searchParams.get('sourceExperienceId');

  const [searchMode, setSearchMode] = useState(initialKeyword.trim().length > 0 || initialMode === 'search');
  const [draftKeyword, setDraftKeyword] = useState(initialKeyword);
  const [keyword, setKeyword] = useState(initialKeyword.trim());
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(initialCategoryId ? Number(initialCategoryId) : null);
  const [feedMode, setFeedMode] = useState<FeedMode>(
    initialFeed === 'success' || initialFeed === 'failure' || initialFeed === 'all' ? initialFeed : 'all',
  );
  const [sortKey, setSortKey] = useState<SortKey>('latest');
  const [sortOption, setSortOption] = useState<SortOption>('latest');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [fabExpanded, setFabExpanded] = useState(false);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [interactionById, setInteractionById] = useState<Record<number, CardInteractionState>>({});
  const [patternStats, setPatternStats] = useState<FailurePatternStatsPayload | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');

  useEffect(() => {
    setSortKey(sortOption === 'latest' ? 'latest' : 'popular');
  }, [sortOption]);

  useEffect(() => {
    void loadExperiences(keyword, sortKey, selectedCategoryId);
  }, [keyword, sortKey, selectedCategoryId]);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (keyword.trim()) {
      nextParams.set('q', keyword.trim());
    }
    if (searchMode && !keyword.trim()) {
      nextParams.set('mode', 'search');
    }
    if (selectedCategoryId !== null) {
      nextParams.set('categoryId', String(selectedCategoryId));
    }
    if (feedMode !== 'all') {
      nextParams.set('feed', feedMode);
    }
    if (sourceExperienceId) {
      nextParams.set('sourceExperienceId', sourceExperienceId);
    }
    setSearchParams(nextParams, { replace: true });
  }, [feedMode, keyword, searchMode, selectedCategoryId, setSearchParams, sourceExperienceId]);

  useEffect(() => {
    const categorySlug =
      selectedCategoryId === null ? (searchMode || keyword.trim() ? DEFAULT_SEARCH_STATS_SLUG : null) : CATEGORY_ID_TO_STATS_SLUG[selectedCategoryId];

    if (!categorySlug) {
      setPatternStats(null);
      return;
    }

    let cancelled = false;
    setStatsLoading(true);
    setStatsError('');

    void getFailurePatternStats(categorySlug)
      .then((payload) => {
        if (!cancelled) {
          setPatternStats(payload);
        }
      })
      .catch((statsLoadError) => {
        if (!cancelled) {
          setPatternStats(null);
          setStatsError(resolveErrorMessage(statsLoadError, '카테고리 통계를 불러오지 못했습니다.'));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setStatsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [keyword, searchMode, selectedCategoryId]);

  async function loadExperiences(searchKeyword: string, nextSortKey: SortKey, categoryId: number | null) {
    setLoading(true);
    setError('');

    try {
      const loadList = searchKeyword.trim() ? searchCases : getExperiences;
      const payload = await loadList({
        page: 0,
        size: 30,
        q: searchKeyword || undefined,
        categoryId: categoryId ?? undefined,
        sort: nextSortKey,
      });
      setExperiences(payload.experiences);
      setTotalCount(payload.pagination.totalElements);
    } catch (loadError) {
      setExperiences(getExploreFallbackFixtures(categoryId));
      setTotalCount(999);
      setError(categoryId === null ? resolveErrorMessage(loadError, '사례 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.') : '');
    } finally {
      setLoading(false);
    }
  }

  const filteredExperiences = useMemo(() => {
    const seeded = withFigmaSearchFixture(experiences, keyword, searchMode);
    return sortExperiences(seeded.filter((experience) => matchesFeedMode(experience, feedMode)), sortOption);
  }, [experiences, feedMode, keyword, searchMode, sortOption]);

  useEffect(() => {
    if (!accessToken || filteredExperiences.length === 0) {
      setInteractionById({});
      return;
    }

    let cancelled = false;

    void Promise.all(
      filteredExperiences
        .filter((experience) => experience.id > 0)
        .map(async (experience) => {
          try {
            const [bookmarkStatus, reactionSummary] = await Promise.all([
              getBookmarkStatus(accessToken, experience.id),
              getReactionSummary(accessToken, experience.id),
            ]);

            return [
              experience.id,
              {
                ...reactionSummary,
                bookmarked: bookmarkStatus.bookmarked,
                bookmarkCount: bookmarkStatus.bookmarkCount,
              },
            ] as const;
          } catch {
            return [
              experience.id,
              {
                experienceId: experience.id,
                heartCount: experience.likeCount,
                tearCount: 0,
                myReactions: [],
                bookmarked: false,
                bookmarkCount: experience.bookmarkCount ?? 0,
              },
            ] as const;
          }
        }),
    ).then((entries) => {
      if (!cancelled) {
        setInteractionById(Object.fromEntries(entries));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [accessToken, filteredExperiences]);

  function submitSearch() {
    const nextKeyword = draftKeyword.trim();
    if (nextKeyword) {
      saveRecentExploreSearch({
        query: nextKeyword,
        tags: [],
        current: readRecentExploreSearches(),
      });
    }
    setKeyword(nextKeyword);
    setSearchMode(nextKeyword.length > 0);
    setSortMenuOpen(false);
  }

  function handleBack() {
    if (searchMode) {
      setSearchMode(false);
      setDraftKeyword('');
      setKeyword('');
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/');
  }

  function handleHeaderSearchClick() {
    if (!searchMode) {
      navigate('/search');
      return;
    }
    submitSearch();
  }

  function moveToSuccessCases(experience: Experience) {
    if (experience.caseStatus === 'SUCCESS') {
      navigate(`/experiences/${experience.id}`);
      return;
    }
    navigate(`/explore?feed=success&categoryId=${experience.category.id}&sourceExperienceId=${experience.id}`);
  }

  function moveToAuth(reason: string) {
    navigate(`/auth?next=${encodeURIComponent('/explore')}&reason=${encodeURIComponent(reason)}`);
  }

  async function handleBookmarkToggle(experience: Experience) {
    if (experience.id < 0) {
      return;
    }
    if (!accessToken) {
      moveToAuth('북마크는 로그인이 필요한 서비스입니다.');
      return;
    }

    const current = interactionById[experience.id];
    const bookmarked = current?.bookmarked ?? false;

    try {
      const payload = bookmarked
        ? await unbookmarkExperience(accessToken, experience.id)
        : await bookmarkExperience(accessToken, experience.id);

      setInteractionById((state) => ({
        ...state,
        [experience.id]: {
          ...(state[experience.id] ?? {
            experienceId: experience.id,
            heartCount: experience.likeCount,
            tearCount: 0,
            myReactions: [],
            bookmarked: false,
            bookmarkCount: experience.bookmarkCount ?? 0,
          }),
          bookmarked: payload.bookmarked,
          bookmarkCount: payload.bookmarkCount,
        },
      }));

      publishBookmarkSync({
        experienceId: experience.id,
        bookmarked: payload.bookmarked,
        bookmarkCount: payload.bookmarkCount,
      });
      showToast(payload.bookmarked ? '북마크에 저장했어요.' : '북마크를 해제했어요.');
    } catch (bookmarkError) {
      showToast(resolveErrorMessage(bookmarkError, '북마크 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.'));
    }
  }

  async function handleHeartToggle(experience: Experience) {
    if (experience.id < 0) {
      return;
    }
    if (!accessToken) {
      moveToAuth('반응 기능은 로그인이 필요한 서비스입니다.');
      return;
    }

    const current = interactionById[experience.id] ?? {
      experienceId: experience.id,
      heartCount: experience.likeCount,
      tearCount: 0,
      myReactions: [],
      bookmarked: false,
      bookmarkCount: experience.bookmarkCount ?? 0,
    };
    const heartActive = current.myReactions.includes('HEART');

    setInteractionById((state) => ({
      ...state,
      [experience.id]: {
        ...current,
        heartCount: Math.max(0, current.heartCount + (heartActive ? -1 : 1)),
        myReactions: heartActive ? [] : ['HEART'],
      },
    }));

    try {
      const payload = heartActive
        ? await unreactToExperience(accessToken, experience.id, 'HEART')
        : await reactToExperience(accessToken, experience.id, 'HEART');

      setInteractionById((state) => ({
        ...state,
        [experience.id]: {
          ...payload,
          bookmarked: state[experience.id]?.bookmarked ?? current.bookmarked,
          bookmarkCount: state[experience.id]?.bookmarkCount ?? current.bookmarkCount,
        },
      }));
    } catch (reactionError) {
      setInteractionById((state) => ({
        ...state,
        [experience.id]: current,
      }));
      showToast(resolveErrorMessage(reactionError, '반응 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.'));
    }
  }

  function handleCreateClick() {
    setFabExpanded(false);
    if (!accessToken) {
      navigate(`/auth?next=${encodeURIComponent('/create')}&reason=${encodeURIComponent('경험 작성은 로그인이 필요한 서비스입니다.')}`);
      return;
    }
    navigate('/create');
  }

  const usingFixtureResults = filteredExperiences.length > 0 && filteredExperiences.every((experience) => experience.id < 0);
  const resultCount = shouldUseFigmaSearchFixture(keyword, searchMode)
    ? 999
    : usingFixtureResults
      ? 999
      : keyword || selectedCategoryId !== null
        ? filteredExperiences.length
        : totalCount;
  const showInitialSkeleton = loading && experiences.length === 0;
  const showSimilarity = searchMode || keyword.trim().length > 0;
  const selectedStatsLabel =
    selectedCategoryId === null
      ? DEFAULT_SEARCH_STATS_SLUG
      : EXPLORE_CATEGORIES.find((category) => category.id === selectedCategoryId)?.label ?? '전체';

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <div className="relative mx-auto min-h-screen w-full max-w-[375px] bg-white">
        <SearchHeader searchMode={searchMode} onBack={handleBack} onSearchClick={handleHeaderSearchClick} />
        {searchMode ? <SearchField value={draftKeyword} inputRef={inputRef} onChange={setDraftKeyword} onSubmit={submitSearch} /> : null}

        <ExploreToolbar
          selectedCategoryId={selectedCategoryId}
          onCategorySelect={setSelectedCategoryId}
          resultCount={resultCount}
          sortOption={sortOption}
          sortMenuOpen={sortMenuOpen}
          onToggleSort={() => setSortMenuOpen((current) => !current)}
          onSelectSort={(value) => {
            setSortOption(value);
            setSortMenuOpen(false);
          }}
        />

        <main className="bg-white pb-[154px]">
          <StatsAccordion categoryLabel={selectedStatsLabel} stats={patternStats} loading={statsLoading} error={statsError} />

          {showInitialSkeleton ? (
            <ListSkeleton count={8} />
          ) : error ? (
            <div className="px-[16px] py-[12px]">
              <ErrorState message={error} />
            </div>
          ) : filteredExperiences.length > 0 ? (
            <div className={`flex flex-col gap-[2px] transition-opacity duration-200 ${loading ? 'opacity-70' : 'opacity-100'}`}>
              {filteredExperiences.map((experience) => (
                <ExploreCard
                  key={experience.id}
                  experience={experience}
                  interaction={interactionById[experience.id] ?? null}
                  showSimilarity={showSimilarity}
                  onBookmarkToggle={handleBookmarkToggle}
                  onHeartToggle={handleHeartToggle}
                  onSuccessClick={moveToSuccessCases}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[320px] items-start justify-center px-[16px] pt-[20px]">
              <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#5D5D5D]">
                아직 등록된 사례가 없어요.
              </p>
            </div>
          )}
        </main>

        <SharedExploreBottomBar
          feedMode={feedMode}
          fabExpanded={fabExpanded}
          onFeedChange={setFeedMode}
          onToggleFab={() => setFabExpanded((prev) => !prev)}
          onCreateClick={handleCreateClick}
        />
      </div>
    </div>
  );
}
