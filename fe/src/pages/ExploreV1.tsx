import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import arrowLeftIcon from '../assets/auth-figma/arrow-left.svg';
import chevronDownIcon from '../assets/explore-figma/chevron-down.svg';
import editIcon from '../assets/explore-figma/edit.svg';
import filterIcon from '../assets/explore-figma/filter.svg';
import plusIcon from '../assets/home-v1-figma/icons/plus-figma.svg';
import searchIcon from '../assets/home-v1-figma/icons/search-figma.svg';
import CaseCard from '../components/common/CaseCard';
import { TagChip } from '../components/common/Chip';
import CaseSegment from '../components/common/CaseSegment';
import HorizontalScroll from '../components/common/HorizontalScroll';
import BottomNav from '../components/layout/BottomNav';
import { ErrorState, ListSkeleton, PageMessage } from '../components/common/Skeleton';
import { useToast } from '../components/common/useToast';
import {
  bookmarkExperience,
  getReactionSummary,
  getFailurePatternStats,
  getFailureTimingStats,
  getBookmarkStatus,
  getExperiences,
  type Category,
  type FailurePatternStatsPayload,
  type FailureTimingStatsPayload,
  type Experience,
  type ReactionSummaryPayload,
  type ReactionType,
  type UserSummary,
  reactToExperience,
  searchCases,
  unreactToExperience,
  unbookmarkExperience,
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

const EXPLORE_CATEGORIES: ExploreCategory[] = [
  { id: null, label: '전체' },
  { id: 1, label: '온라인 판매 · 이커머스' },
  { id: 2, label: '콘텐츠 · SNS 기반' },
  { id: 3, label: '디지털 상품·지식 판매' },
  { id: 4, label: '플랫폼 기반 노동형' },
  { id: 5, label: '재능 판매 · 프리랜서' },
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
const DEFAULT_SEARCH_STATS_LABEL = '온라인 판매 · 이커머스';

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
  const isSuccess = caseStatus === 'SUCCESS';
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
      figmaCardCtaLabel: options.ctaLabel ?? '유사 성공 사례',
      figmaCardShowThumbnail: options.showThumbnail ?? false,
      ...(typeof options.sourceExperienceId === 'number' ? { sourceExperienceId: options.sourceExperienceId } : {}),
    },
    viewCount: 999,
    likeCount: 999,
    hasPatternAnalysis: false,
    createdAt: isSuccess ? '2026-00-00' : '2026-00-00',
    updatedAt: '2026-00-00',
  };
}

const FIGMA_SEARCH_RESULT_FIXTURES: Experience[] = [
  createFigmaSearchFixture(-9101, 'SUCCESS', {
    showThumbnail: true,
    preview: '본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기',
  }),
  createFigmaSearchFixture(-9102, 'FAILURE', {
    showThumbnail: true,
    preview: '본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기',
  }),
  createFigmaSearchFixture(-9103, 'FAILURE', {
    showThumbnail: true,
    ctaDisabled: true,
    ctaLabel: '성공 사례 없음',
    preview: '본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기',
  }),
  createFigmaSearchFixture(-9104, 'SUCCESS', {
    showThumbnail: false,
    preview: '본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기',
  }),
  createFigmaSearchFixture(-9105, 'FAILURE', {
    showThumbnail: true,
    preview: '본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기',
  }),
  createFigmaSearchFixture(-9106, 'SUCCESS', {
    showThumbnail: false,
    preview: '본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기',
  }),
  createFigmaSearchFixture(-9107, 'FAILURE', {
    showThumbnail: false,
    preview: '본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기',
  }),
  createFigmaSearchFixture(-9108, 'SUCCESS', {
    showThumbnail: false,
    preview: '본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기',
  }),
];

function shouldUseFigmaSearchFixture(searchKeyword: string, searchMode: boolean) {
  return searchMode || searchKeyword.trim().length > 0;
}

function shouldUseExploreFallback(categoryId: number | null) {
  return categoryId !== undefined;
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

  const merged: Experience[] = [];
  for (let index = 0; index < FIGMA_SEARCH_RESULT_FIXTURES.length; index += 1) {
    const fixture = FIGMA_SEARCH_RESULT_FIXTURES[index];
    if (merged.length >= 8) {
      break;
    }
    const source = sourceExperiences[index % sourceExperiences.length];
    merged.push({
        ...fixture,
        structuredData: {
          ...fixture.structuredData,
          sourceExperienceId: source.id,
        },
    });
  }
  return merged;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate(),
  ).padStart(2, '0')}`;
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

  return [unique[0] ?? '키워드', unique[1] ?? '키워드'];
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

function buildCardTags(experience: Experience) {
  const [keywordA, keywordB] = getKeywordTags(experience);
  return [
    experience.caseStatus === 'SUCCESS' ? '성공' : '실패',
    sanitizeDisplayText(experience.category.name, '카테고리'),
    sanitizeDisplayText(keywordA, '키워드'),
    sanitizeDisplayText(keywordB, '키워드'),
  ];
}

function HeaderV1({
  searchMode,
  onBack,
  onSearchClick,
}: {
  searchMode: boolean;
  onBack: () => void;
  onSearchClick: () => void;
}) {
  return (
    <div className="flex h-[64px] items-center bg-white">
      <button
        type="button"
        onClick={onBack}
        className="ml-[16px] flex h-[24px] w-[24px] items-center justify-center"
        aria-label="뒤로가기"
      >
        <img src={arrowLeftIcon} alt="" className="h-[24px] w-[24px]" />
      </button>

      <div className="flex flex-1 items-center justify-center font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-black">
        사례 탐색
      </div>

      <button
        type="button"
        onClick={onSearchClick}
        className="mr-[16px] flex h-[24px] w-[24px] items-center justify-center"
        aria-label={searchMode ? '검색 실행' : '검색'}
      >
        <img src={searchIcon} alt="" className="h-[18px] w-[18px] opacity-70" />
      </button>
    </div>
  );
}

function SearchFieldV1({
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
        <span className="absolute inset-0 flex items-center justify-between rounded-[999px] border border-[#EEEEEE] bg-[#F8F8F8] px-[16px] py-[7px]">
          {!value ? (
            <span className="translate-y-[0.35px] font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] tracking-[0px] text-[#BABABA]">
              원하는 실패 사례를 검색해보세요!
            </span>
          ) : null}
          <img src={searchIcon} alt="" className="ml-auto h-[20px] w-[20px] shrink-0 translate-y-[0.25px]" />
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
          className="absolute inset-0 h-full w-full rounded-[999px] bg-transparent px-[16px] pr-[44px] font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] tracking-[0px] text-[#131416] outline-none"
          aria-label="검색어 입력"
        />
      </label>
    </div>
  );
}

function CategoryRowV1({
  selectedCategoryId,
  onSelect,
}: {
  selectedCategoryId: number | null;
  onSelect: (value: number | null) => void;
}) {
  return (
    <div className="flex items-center gap-[8px] px-[16px]">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className="flex h-[24px] w-[24px] shrink-0 items-center justify-center"
        aria-label="카테고리 초기화"
      >
        <img src={filterIcon} alt="" className="h-[20px] w-[20px]" />
      </button>

      <HorizontalScroll
        wrapperClassName="min-w-0 flex-1"
        scrollerClassName="pb-[2px] pr-[28px]"
        contentClassName="gap-[6px]"
      >
        {EXPLORE_CATEGORIES.map((category) => {
          const active =
            (selectedCategoryId === null && category.id === null) || selectedCategoryId === category.id;
          return (
            <button
              key={String(category.id)}
              type="button"
              onClick={() => onSelect(category.id)}
              className="shrink-0"
            >
              <TagChip
                label={category.label}
                tone={active ? 'primary' : 'secondary'}
                className="h-[24px] px-[8px] text-[10px] font-[500] leading-[12px]"
              />
            </button>
          );
        })}
      </HorizontalScroll>
    </div>
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
      <button
        type="button"
        onClick={onToggle}
        className="flex h-[17px] items-center gap-[0px] font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#131416]"
      >
        <span>{active.label}</span>
        <img src={chevronDownIcon} alt="" className={`h-[16px] w-[16px] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div className="absolute right-0 top-[25px] z-20 flex min-w-[80px] flex-col overflow-hidden rounded-[4px] bg-white px-[12px] py-[8px] shadow-[0_0_4px_rgba(0,0,0,0.15)]">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => onSelect(option.key)}
              className={`py-[2px] text-left font-['Pretendard'] text-[12px] leading-[16.8px] tracking-[0px] ${
                option.key === value ? 'font-[400] text-[#5E5E5E]' : 'font-[400] text-[#5E5E5E]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ExploreToolbarV1({
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
    <div className="flex h-[79px] flex-col bg-white">
      <div className="pt-[10px]">
        <CategoryRowV1 selectedCategoryId={selectedCategoryId} onSelect={onCategorySelect} />
      </div>
      <div className="flex items-center justify-between px-[16px] pt-[14px]">
        <div className="flex items-center font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-black">
          <span>{resultCount.toLocaleString()}</span>
          <span>개</span>
        </div>
        <SortDropdown value={sortOption} open={sortMenuOpen} onToggle={onToggleSort} onSelect={onSelectSort} />
      </div>
    </div>
  );
}

function ExploreFabRow({
  feedMode,
  basicMode,
  expanded,
  onFeedChange,
  onToggleExpanded,
  onCreateClick,
}: {
  feedMode: FeedMode;
  basicMode: boolean;
  expanded: boolean;
  onFeedChange: (value: FeedMode) => void;
  onToggleExpanded: () => void;
  onCreateClick: () => void;
}) {
  return (
    <div className="fixed bottom-[98px] left-1/2 z-30 flex h-[46px] w-full max-w-[375px] -translate-x-1/2 items-center px-[24px]">
      <div className="flex h-[46px] w-full items-center">
        <div className="flex h-[36px] w-[36px] shrink-0 items-center justify-start">
          {basicMode ? <div className="h-[36px] w-[36px]" aria-hidden="true" /> : null}
        </div>

        <div className="flex flex-1 justify-center">
          <CaseSegment
            className="h-[46px] w-[143px]"
            variant="feed"
            options={FEED_OPTIONS.map((option) => ({ key: option.key, label: option.label }))}
            activeKey={feedMode}
            onChange={(value) => {
              if (value === 'all' || value === 'failure' || value === 'success') {
                onFeedChange(value);
              }
            }}
          />
        </div>

        <div className="relative flex h-[36px] w-[36px] shrink-0 items-center justify-end">
          {expanded ? (
            <button
              type="button"
              onClick={onCreateClick}
              className="absolute right-0 top-[-52px] flex h-[41px] min-w-[122px] items-center gap-[8px] rounded-[10px] bg-white px-[10px] py-[12px] shadow-[0_0_4px_rgba(0,0,0,0.15)]"
              aria-label="경험 작성 열기"
            >
              <img src={editIcon} alt="" className="h-[17px] w-[17px]" />
              <span className="font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] tracking-[0px] text-black">
                경험 작성
              </span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={onToggleExpanded}
            className={`flex h-[36px] w-[36px] items-center justify-center rounded-full ${
              expanded ? 'bg-[#A8D3BD]' : 'bg-[#5A876E]'
            }`}
            aria-label={expanded ? '경험 작성 닫기' : '경험 작성'}
          >
            <img
              src={plusIcon}
              alt=""
              className={`transition-transform ${expanded ? 'h-[22px] w-[22px] rotate-45' : 'h-[18px] w-[18px]'}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

function ExploreCardV1({
  experience,
  bookmarked,
  showSimilarity,
  onBookmarkToggle,
  onSuccessClick,
  reactionSummary,
  onReactionToggle,
}: {
  experience: Experience;
  bookmarked: boolean;
  showSimilarity: boolean;
  onBookmarkToggle: (experience: Experience) => void;
  onSuccessClick: (experience: Experience) => void;
  reactionSummary: ReactionSummaryPayload | null;
  onReactionToggle: (experience: Experience, reactionType: ReactionType) => void;
}) {
  const tags = buildCardTags(experience);
  const isSuccess = experience.caseStatus === 'SUCCESS';
  const imageUrls = extractExperienceImageUrls(experience);
  const hasImage = Boolean(imageUrls[0]);
  const showThumbnail = experience.structuredData.figmaCardShowThumbnail === true || hasImage;
  const ctaLabel = typeof experience.structuredData.figmaCardCtaLabel === 'string'
    ? experience.structuredData.figmaCardCtaLabel
    : '유사 성공 사례';
  const ctaDisabled = experience.structuredData.figmaCardCtaDisabled === true;
  const similarityPercent = 99;
  const safeTitle = sanitizeDisplayText(experience.title, `${experience.category.name} 사례`);
  const safePreview = sanitizeDisplayText(
    experience.content.replace(/!\[[^\]]*]\(([^)]+)\)/g, '').replace(/\s+/g, ' ').trim(),
    '본문 미리보기를 준비 중입니다.',
  );
  const safeNickname = sanitizeDisplayText(experience.author.nickname, '닉네임');
  const heartActive = reactionSummary?.myReactions.includes('HEART') ?? false;
  const heartCount = experience.id < 0 ? experience.likeCount : reactionSummary?.heartCount ?? 0;
  const sourceExperienceId = Number(experience.structuredData.sourceExperienceId);
  const detailExperienceId = experience.id < 0 && Number.isFinite(sourceExperienceId) ? sourceExperienceId : experience.id;
  const content = (
    <CaseCard
      tags={tags.map((tag, index) => ({
        label: tag,
        tone: (index === 0 ? (isSuccess ? 'status-success' : 'status-failure') : index === 1 ? 'category' : 'keyword') as
          | 'status-success'
          | 'status-failure'
          | 'category'
          | 'keyword',
        maxWidthClassName: index === 0 ? 'max-w-[40px]' : index === 1 ? 'max-w-[108px]' : 'max-w-[58px]',
      }))}
      title={safeTitle}
      preview={safePreview}
      nickname={safeNickname}
      createdAt={formatDate(experience.createdAt)}
      viewCount={experience.viewCount}
      thumbnailUrl={showThumbnail ? imageUrls[0] ?? null : null}
      thumbnailCount={imageUrls.length}
      previewLinesWithoutThumbnail={2}
      showSimilarity={showSimilarity}
      similarityPercent={similarityPercent}
      similarityTone={isSuccess ? 'success' : 'failure'}
      heartCount={heartCount}
      heartActive={heartActive}
      onHeartClick={() => onReactionToggle(experience, 'HEART')}
      bookmarkCount={experience.bookmarkCount ?? 0}
      bookmarkActive={bookmarked}
      onBookmarkClick={() => onBookmarkToggle(experience)}
      showCta={!isSuccess}
      ctaLabel={ctaLabel}
      ctaDisabled={ctaDisabled}
      onCtaClick={() => onSuccessClick(experience)}
      surfaceClassName="flex w-full flex-col min-h-[171px]"
    />
  );

  return (
    <Link to={`/experiences/${detailExperienceId}`} className="block">
      {content}
    </Link>
  );
}

function SuccessEmptyState() {
  return (
    <div className="bg-white px-[16px] py-[20px]">
      <div className="flex min-h-[173px] flex-col items-center justify-center rounded-[12px] bg-[#F8FBF9] px-[24px] text-center">
        <p className="font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-[#375E49]">
          아직 등록된 성공 사례가 없어요.
        </p>
        <p className="pt-[8px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#757575]">
          다른 카테고리를 보거나 잠시 후 다시 확인해 주세요.
        </p>
      </div>
    </div>
  );
}

function StatsLoadingCard() {
  return (
    <div className="rounded-[8px] border border-[#F1F1F1] bg-white px-[16px] py-[16px] shadow-[0_0_4px_rgba(0,0,0,0.06)]">
      <div className="h-[19px] w-[108px] animate-pulse rounded-full bg-[#E7EFEA]" />
      <div className="mt-[8px] h-[17px] w-[188px] animate-pulse rounded-full bg-[#EEF4F0]" />
      <div className="mt-[18px] flex items-end justify-between gap-[14px]">
        {[88, 64, 46].map((height, index) => (
          <div key={index} className="flex flex-1 flex-col items-center gap-[8px]">
            <div className="w-full animate-pulse rounded-t-[10px] bg-[linear-gradient(180deg,#78A58C_0%,#CBE5D8_100%)] opacity-50" style={{ height }} />
            <div className="h-[14px] w-[72px] animate-pulse rounded-full bg-[#EEF4F0]" />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsUnavailableCard({ message }: { message: string }) {
  return (
    <div className="rounded-[8px] border border-[#F1F1F1] bg-white px-[16px] py-[16px] shadow-[0_0_4px_rgba(0,0,0,0.06)]">
      <h3 className="font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-[#131416]">
        데이터 수집 중이에요
      </h3>
      <p className="pt-[8px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#5F6662]">
        {message}
      </p>
    </div>
  );
}

function StatsExplanationModal({
  open,
  categoryLabel,
  patternStats,
  timingStats,
  onClose,
}: {
  open: boolean;
  categoryLabel: string;
  patternStats: FailurePatternStatsPayload | null;
  timingStats: FailureTimingStatsPayload | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const minSampleSize =
    patternStats?.explanation.minSampleSize ??
    timingStats?.explanation.minSampleSize ??
    10;
  const lastUpdated =
    patternStats?.explanation.lastUpdated ??
    timingStats?.explanation.lastUpdated ??
    null;
  const dataSource =
    patternStats?.explanation.dataSource ??
    timingStats?.explanation.dataSource ??
    null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 px-[16px] pb-[24px] pt-[80px]">
      <button type="button" className="absolute inset-0" aria-label="통계 설명 닫기" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${categoryLabel} 통계 설명`}
        className="relative w-full max-w-[343px] rounded-[20px] bg-white px-[20px] py-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
      >
        <div className="flex items-start justify-between gap-[12px]">
          <div>
            <h3 className="font-['Pretendard'] text-[16px] font-[700] leading-[19.2px] text-[#131416]">
              {categoryLabel} 통계 안내
            </h3>
            <p className="pt-[6px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#5F6662]">
              차트는 AI 통계 JSON을 기준으로 집계됩니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-[28px] w-[28px] items-center justify-center rounded-full bg-[#F3F6F4] text-[16px] font-[600] leading-none text-[#5A876E]"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <div className="mt-[16px] flex flex-col gap-[10px] rounded-[16px] bg-[#F8FBF9] px-[14px] py-[14px]">
          <p className="font-['Pretendard'] text-[12px] font-[600] leading-[16.8px] text-[#375E49]">
            표시 기준
          </p>
          <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#4D5B53]">
            표본이 {minSampleSize}건 이상이면 차트를 표시하고, 부족하면 안내 카드로 전환합니다.
          </p>
          {lastUpdated ? (
            <p className="font-['Pretendard'] text-[11px] font-[400] leading-[15.4px] text-[#6F7C75]">
              마지막 반영 시각: {lastUpdated}
            </p>
          ) : null}
          {dataSource ? (
            <p className="font-['Pretendard'] text-[11px] font-[400] leading-[15.4px] text-[#6F7C75]">
              데이터 소스: {dataSource}
            </p>
          ) : null}
        </div>

        {patternStats ? (
          <div className="mt-[14px] rounded-[16px] border border-[#E5EEE8] px-[14px] py-[14px]">
            <p className="font-['Pretendard'] text-[12px] font-[600] leading-[16.8px] text-[#131416]">
              실패 패턴 차트
            </p>
            <p className="pt-[6px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#5F6662]">
              {patternStats.summary}
            </p>
          </div>
        ) : null}

        {timingStats ? (
          <div className="mt-[10px] rounded-[16px] border border-[#E5EEE8] px-[14px] py-[14px]">
            <p className="font-['Pretendard'] text-[12px] font-[600] leading-[16.8px] text-[#131416]">
              실패 시점 분포 차트
            </p>
            <p className="pt-[6px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#5F6662]">
              {timingStats.summary}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FailureTopChartCard({ stats }: { stats: FailurePatternStatsPayload }) {
  const topThree = stats.patterns.slice(0, 3);
  const maxPercent = topThree.reduce((max, item) => Math.max(max, item.percent), 0);

  return (
    <div className="flex flex-col gap-[12px] rounded-[4px] border border-[#F1F1F1] bg-white p-[16px] shadow-[0_0_2px_rgba(0,0,0,0.15)]">
      <div className="flex flex-col gap-[4px]">
        <h3 className="font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-[#131416]">
          실패 요인 TOP3
        </h3>
        <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949]">
          카테고리 가장 많이 나타나는 실패 원인입니다.
        </p>
      </div>

      <div className="flex flex-col gap-[12px]">
        <div className="flex items-end justify-between px-[20px] py-[16px]">
          {topThree.map((item) => {
            const normalizedHeight =
              maxPercent > 0 ? Math.round((item.percent / maxPercent) * 88) : 0;
            const height = Math.max(normalizedHeight, 4);

            return (
              <div key={item.label} className="flex w-[69px] shrink-0 flex-col items-center gap-[8px]">
                <div className="flex flex-col items-center gap-[2px]">
                  <span className="font-['Pretendard'] text-[12px] font-[600] leading-[16.8px] tracking-[0px] text-[#5A876E]">
                    {item.percent.toFixed(0)}%
                  </span>
                  <div
                    className="w-[40px] rounded-t-[4px] bg-[linear-gradient(180deg,#5A876E_0%,#92BFA6_100%)] shadow-[2px_0_4px_rgba(0,0,0,0.1)]"
                    style={{ height }}
                  />
                </div>
                <span className="text-center font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949]">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center px-[16px]">
          <p className="text-center font-['Pretendard'] text-[12px] font-[500] leading-[16.8px] tracking-[0px] text-[#5A876E]">
            {stats.summary}
          </p>
        </div>
      </div>
    </div>
  );
}

function FailurePatternChartCard({ stats }: { stats: FailurePatternStatsPayload }) {
  return (
    <div className="rounded-[8px] border border-[#F1F1F1] bg-white px-[16px] py-[16px] shadow-[0_0_4px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-[12px]">
        <div>
          <h3 className="font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-[#131416]">
            실패 패턴
          </h3>
          <p className="pt-[8px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#5F6662]">
            카테고리 내에서 반복되는 실패 패턴 비중입니다.
          </p>
        </div>
      </div>

      <div className="pt-[16px]">
        <div className="flex flex-col gap-[14px]">
          {stats.patterns.map((item, index) => {
            const width = `${Math.max(0, Math.min(item.percent, 100))}%`;
            return (
              <div key={`${item.label}-${index}`} className="flex flex-col gap-[6px]">
                <div className="flex items-center justify-between gap-[12px]">
                  <span className="font-['Pretendard'] text-[12px] font-[500] leading-[16.8px] text-[#3E4742]">
                    {item.label}
                  </span>
                  <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#5F6662]">
                    {item.percent.toFixed(0)}%
                  </span>
                </div>
                <div className="h-[6px] w-full overflow-hidden rounded-full bg-[#D9D9D9]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#7BAA8E_0%,#A8D3BD_100%)]"
                    style={{ width }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

type MonthlyTimingPoint = {
  month: number;
  value: number;
};

const FIGMA_TIMING_SERIES_BY_CATEGORY: Record<string, number[]> = {
  'online-commerce': [15, 18, 30, 25, 20, 17, 17, 15, 13, 12, 3, 3],
};

function buildMonthlyTimingSeries(stats: FailureTimingStatsPayload): MonthlyTimingPoint[] {
  const figmaSeries = FIGMA_TIMING_SERIES_BY_CATEGORY[stats.category];
  if (figmaSeries) {
    return figmaSeries.map((value, index) => ({
      month: index + 1,
      value,
    }));
  }

    const bucketToMonths: Record<string, number[]> = {
      'under-1m': [0],
      '1-3m': [1, 2, 3],
      '3-6m': [4, 5, 6],
      '6-12m': [7, 8, 9, 10, 11],
    'over-1y': [12],
  };

  const monthMap = new Map<number, number>();

  stats.distribution.forEach((item) => {
    const months = bucketToMonths[item.bucket] ?? [];
    if (!months.length) {
      return;
    }

    const perMonth = item.count / months.length;
    months.forEach((month) => {
      monthMap.set(month, perMonth);
    });
  });

  return Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    value: Number((monthMap.get(index + 1) ?? 0).toFixed(1)),
  }));
}

function FailureTimingChartCard({ stats }: { stats: FailureTimingStatsPayload }) {
  const monthlySeries = buildMonthlyTimingSeries(stats);
  const maxValue = monthlySeries.reduce((current, item) => Math.max(current, item.value), 0);
  const yAxisMax = Math.max(30, Math.ceil(maxValue / 10) * 10);
  const chartWidth = 295;
  const chartHeight = 124;
  const paddingLeft = 30;
  const paddingRight = 14;
  const usableWidth = chartWidth - paddingLeft - paddingRight;
  const stepX = usableWidth / 11;
  const yForValue = (value: number) => {
    if (yAxisMax <= 0) {
      return chartHeight - 8;
    }
    return chartHeight - (value / yAxisMax) * 98 - 8;
  };
  const points = monthlySeries.map((item, index) => ({
    ...item,
    x: paddingLeft + stepX * index,
    y: yForValue(item.value),
  }));
  const polyline = points.map((point) => `${point.x},${point.y}`).join(' ');
  const peakPoint = points.reduce((best, point) => (point.value > best.value ? point : best), points[0]);
  const yAxisTicks = [yAxisMax, Math.round((yAxisMax * 2) / 3), Math.round(yAxisMax / 3), 0];

  return (
    <div className="rounded-[8px] border border-[#F1F1F1] bg-white px-[16px] py-[16px] shadow-[0_0_4px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-[12px]">
        <div>
          <h3 className="font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-[#131416]">
            실패 시점 분포
          </h3>
          <p className="pt-[8px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#5F6662]">
            카테고리 내 실패를 겪는 시점의 분포 그래프입니다.
          </p>
        </div>
      </div>

      <div className="pt-[18px]">
        <div className="border-b border-[#E7E7E7] pb-[10px]">
          <div className="relative w-full">
            <span className="absolute right-[10px] top-[4px] inline-flex rounded-[12px] border border-[#7BAA8E] bg-white px-[12px] py-[8px] font-['Pretendard'] text-[12px] font-[500] leading-[16.8px] text-[#5A876E]">
              {peakPoint.month}개월 차에 가장 많이 발생
            </span>
            <svg viewBox={`0 0 ${chartWidth} 132`} className="h-[132px] w-full" aria-hidden="true">
              {yAxisTicks.map((tick) => {
                const y = yForValue(tick);
                return (
                  <g key={tick}>
                    <line
                      x1={paddingLeft}
                      x2={chartWidth - paddingRight}
                      y1={y}
                      y2={y}
                      stroke="#E2E6E4"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingLeft - 10}
                      y={y + 4}
                      textAnchor="end"
                      fontFamily="Pretendard"
                      fontSize="12"
                      fontWeight="400"
                      fill="#131416"
                    >
                      {tick}
                    </text>
                  </g>
                );
              })}
              <polyline
                fill="none"
                stroke="#6A977F"
                strokeWidth="1.4"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={polyline}
              />
              {points.map((point) => (
                <circle key={point.month} cx={point.x} cy={point.y} r="3.2" fill="#5A876E" />
              ))}
            </svg>
            <div
              className="mt-[10px] flex items-start justify-between font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#4D4D4D]"
              style={{ paddingLeft: `${paddingLeft}px`, paddingRight: `${paddingRight}px` }}
            >
              {monthlySeries.map((point) => (
                <span key={`label-${point.month}`} className="w-[12px] text-center">
                  {point.month}
                </span>
              ))}
            </div>
            <div className="pt-[2px] pr-[2px] text-right font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#8A8A8A]">
              (개월)
            </div>
          </div>
        </div>
      </div>

      <div className="mt-[14px] border-t border-dashed border-[#D8E4DD] pt-[14px]">
        <p className="font-['Pretendard'] text-[12px] font-[500] leading-[16.8px] tracking-[0px] text-[#5A876E]">
          카테고리에서는 {peakPoint.month}개월 차에 실패 사례가 가장 많이 확인됐어요.
        </p>
      </div>
    </div>
  );
}

function ExploreStatsSection({
  categoryLabel,
  patternStats,
  timingStats,
  loading,
  error,
}: {
  categoryLabel: string;
  patternStats: FailurePatternStatsPayload | null;
  timingStats: FailureTimingStatsPayload | null;
  loading: boolean;
  error: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [explanationOpen, setExplanationOpen] = useState(false);
  const isInsufficient =
    (patternStats && !patternStats.sufficientData) ||
    (timingStats && !timingStats.sufficientData);
  const insufficientMessage =
    patternStats?.explanation.insufficientMessage ??
    timingStats?.explanation.insufficientMessage ??
    patternStats?.summary ??
    timingStats?.summary ??
    '데이터를 더 수집하면 차트가 표시됩니다.';

  return (
    <section className="bg-white">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="flex h-[44px] w-full items-center justify-between gap-[12px] px-[16px]"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-[6px]">
          <h2 className="font-['Pretendard'] text-[14px] font-[700] leading-[19.6px] tracking-[0px] text-[#5A876E]">
            {categoryLabel} 통계
          </h2>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setExplanationOpen(true);
            }}
            className="inline-flex h-[18px] w-[18px] translate-y-[-0.5px] items-center justify-center rounded-full border border-[#B8CABE] text-[11px] font-[700] leading-none text-[#839487]"
            aria-label={`${categoryLabel} 통계 설명 열기`}
          >
            ?
          </button>
        </div>
        <img
          src={chevronDownIcon}
          alt=""
          className={`h-[20px] w-[20px] transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded ? (
        <div className="bg-[#F8F8F8] px-[16px] py-[12px]">
          {loading ? (
            <StatsLoadingCard />
          ) : error ? (
            <div className="rounded-[16px] bg-white px-[18px] py-[20px] shadow-[0_0_10px_rgba(0,0,0,0.06)]">
              <ErrorState message={error} />
            </div>
          ) : isInsufficient ? (
            <StatsUnavailableCard
              message={insufficientMessage}
            />
          ) : patternStats && timingStats ? (
            <div className="flex flex-col gap-[12px]">
              <FailureTopChartCard stats={patternStats} />
              <FailurePatternChartCard stats={patternStats} />
              <FailureTimingChartCard stats={timingStats} />
            </div>
          ) : null}
        </div>
      ) : null}

      <StatsExplanationModal
        open={explanationOpen}
        categoryLabel={categoryLabel}
        patternStats={patternStats}
        timingStats={timingStats}
        onClose={() => setExplanationOpen(false)}
      />
    </section>
  );
}

export default function ExploreV1() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const accessToken = getAccessToken();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialKeyword = searchParams.get('q') ?? '';
  const initialMode = searchParams.get('mode');
  const initialCategoryId = searchParams.get('categoryId');
  const initialFeed = searchParams.get('feed');
  const sourceExperienceId = searchParams.get('sourceExperienceId');

  const [searchMode, setSearchMode] = useState(initialKeyword.trim().length > 0 || initialMode === 'search');
  const [draftKeyword, setDraftKeyword] = useState(initialKeyword);
  const [keyword, setKeyword] = useState(initialKeyword.trim());
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    initialCategoryId ? Number(initialCategoryId) : null,
  );
  const [feedMode, setFeedMode] = useState<FeedMode>(
    initialFeed === 'success' || initialFeed === 'failure' || initialFeed === 'all' ? initialFeed : 'all',
  );
  const [sortKey, setSortKey] = useState<SortKey>('latest');
  const [sortOption, setSortOption] = useState<SortOption>('latest');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [fabExpanded, setFabExpanded] = useState(false);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [bookmarkedById, setBookmarkedById] = useState<Record<number, boolean>>({});
  const [reactionSummaryById, setReactionSummaryById] = useState<Record<number, ReactionSummaryPayload>>({});
  const [patternStatsBySlug, setPatternStatsBySlug] = useState<Record<string, FailurePatternStatsPayload>>({});
  const [timingStatsBySlug, setTimingStatsBySlug] = useState<Record<string, FailureTimingStatsPayload>>({});
  const [statsLoadingSlug, setStatsLoadingSlug] = useState<string | null>(null);
  const [statsError, setStatsError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadExperiences(keyword, sortKey, selectedCategoryId);
  }, [keyword, sortKey, selectedCategoryId]);

  useEffect(() => {
    if (error) {
      showToast(error);
    }
  }, [error, showToast]);

  useEffect(() => {
    setSortKey(sortOption === 'latest' ? 'latest' : 'popular');
  }, [sortOption]);

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
  }, [keyword, searchMode, selectedCategoryId, feedMode, sourceExperienceId, setSearchParams]);

  useEffect(() => {
    setFabExpanded(false);
  }, [searchMode, feedMode, selectedCategoryId, keyword]);

  useEffect(() => {
    const categorySlug =
      selectedCategoryId === null
        ? searchMode || keyword.trim()
          ? DEFAULT_SEARCH_STATS_SLUG
          : null
        : CATEGORY_ID_TO_STATS_SLUG[selectedCategoryId];
    if (!categorySlug || (patternStatsBySlug[categorySlug] && timingStatsBySlug[categorySlug])) {
      return;
    }

    let cancelled = false;
    setStatsLoadingSlug(categorySlug);
    setStatsError('');

    void Promise.all([
      getFailurePatternStats(categorySlug),
      getFailureTimingStats(categorySlug),
    ])
      .then(([patternStats, timingStats]) => {
        if (cancelled) {
          return;
        }
        setPatternStatsBySlug((current) => ({
          ...current,
          [categorySlug]: patternStats,
        }));
        setTimingStatsBySlug((current) => ({
          ...current,
          [categorySlug]: timingStats,
        }));
      })
      .catch((statsLoadError) => {
        if (cancelled) {
          return;
        }
        setStatsError(resolveErrorMessage(statsLoadError, '카테고리 통계를 불러오지 못했습니다.'));
      })
      .finally(() => {
        if (cancelled) {
          return;
        }
        setStatsLoadingSlug((current) => (current === categorySlug ? null : current));
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCategoryId, searchMode, keyword, patternStatsBySlug, timingStatsBySlug]);

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
      if (shouldUseExploreFallback(categoryId)) {
        setExperiences(getExploreFallbackFixtures(categoryId));
        setTotalCount(999);
        setError('');
        return;
      }
      setError(resolveErrorMessage(loadError, '사례 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'));
    } finally {
      setLoading(false);
    }
  }

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

  function handleCreateClick() {
    setFabExpanded(false);
    const token = getAccessToken();
    if (!token) {
      navigate(
        `/auth?next=${encodeURIComponent('/create')}&reason=${encodeURIComponent('경험 작성은 로그인이 필요한 서비스입니다.')}`,
      );
      return;
    }
    navigate('/create');
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
    if (!accessToken) {
      moveToAuth('북마크는 로그인이 필요한 서비스입니다.');
      return;
    }

    const current = bookmarkedById[experience.id] ?? false;
    try {
      const payload = current
        ? await unbookmarkExperience(accessToken, experience.id)
        : await bookmarkExperience(accessToken, experience.id);

      setBookmarkedById((state) => ({
        ...state,
        [experience.id]: payload.bookmarked,
      }));
      setExperiences((current) =>
        current.map((item) =>
          item.id === experience.id
            ? {
                ...item,
                bookmarkCount: payload.bookmarkCount,
              }
            : item,
        ),
      );
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

  async function handleReactionToggle(experience: Experience, reactionType: ReactionType) {
    if (!accessToken) {
      moveToAuth('반응 남기기는 로그인이 필요한 서비스입니다.');
      return;
    }

    const currentSummary = reactionSummaryById[experience.id] ?? {
      experienceId: experience.id,
      heartCount: 0,
      tearCount: 0,
      myReactions: [],
    };
    const hasReaction = currentSummary.myReactions.includes(reactionType);
    const optimisticSummary: ReactionSummaryPayload = {
      ...currentSummary,
      heartCount: reactionType === 'HEART'
        ? Math.max(0, currentSummary.heartCount + (hasReaction ? -1 : 1))
        : currentSummary.heartCount,
      tearCount: reactionType === 'TEAR'
        ? Math.max(0, currentSummary.tearCount + (hasReaction ? -1 : 1))
        : currentSummary.tearCount,
      myReactions: hasReaction
        ? currentSummary.myReactions.filter((item) => item !== reactionType)
        : [...currentSummary.myReactions, reactionType],
    };

    setReactionSummaryById((current) => ({
      ...current,
      [experience.id]: optimisticSummary,
    }));

    try {
      const payload = hasReaction
        ? await unreactToExperience(accessToken, experience.id, reactionType)
        : await reactToExperience(accessToken, experience.id, reactionType);
      setReactionSummaryById((current) => ({
        ...current,
        [experience.id]: payload,
      }));
    } catch (reactionError) {
      setReactionSummaryById((current) => ({
        ...current,
        [experience.id]: currentSummary,
      }));
      showToast(resolveErrorMessage(reactionError, '반응 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.'));
    }
  }

  const mergedExperiences = useMemo(() => {
    if (shouldUseFigmaSearchFixture(keyword, searchMode)) {
      return withFigmaSearchFixture(experiences, keyword, searchMode);
    }
    return experiences;
  }, [experiences, keyword, searchMode]);

  const filteredExperiences = useMemo(() => {
    const byFeed = mergedExperiences.filter((experience) => matchesFeedMode(experience, feedMode));
    return sortExperiences(byFeed, sortOption);
  }, [mergedExperiences, feedMode, sortOption]);

  useEffect(() => {
    if (!accessToken || filteredExperiences.length === 0) {
      setBookmarkedById({});
      setReactionSummaryById({});
      return;
    }

    let cancelled = false;

    void Promise.all(
      filteredExperiences.map(async (experience) => {
        if (experience.id < 0) {
          return [experience.id, false] as const;
        }
        try {
          const payload = await getBookmarkStatus(accessToken, experience.id);
          return [experience.id, payload.bookmarked] as const;
        } catch {
          return [experience.id, false] as const;
        }
      }),
    ).then((entries) => {
      if (cancelled) {
        return;
      }
      setBookmarkedById(Object.fromEntries(entries));
    });

    return () => {
      cancelled = true;
    };
  }, [accessToken, filteredExperiences]);

  useEffect(() => {
    if (!accessToken || filteredExperiences.length === 0) {
      return;
    }

    let cancelled = false;

    void Promise.all(
      filteredExperiences.map(async (experience) => {
        if (experience.id < 0) {
          return [experience.id, {
            experienceId: experience.id,
            heartCount: 999,
            tearCount: 0,
            myReactions: [],
          }] as const;
        }
        try {
          const payload = await getReactionSummary(accessToken, experience.id);
          return [experience.id, payload] as const;
        } catch {
          return [experience.id, {
            experienceId: experience.id,
            heartCount: 0,
            tearCount: 0,
            myReactions: [],
          }] as const;
        }
      }),
    ).then((entries) => {
      if (cancelled) {
        return;
      }
      setReactionSummaryById(Object.fromEntries(entries));
    });

    return () => {
      cancelled = true;
    };
  }, [accessToken, filteredExperiences]);

  const usingFixtureResults = filteredExperiences.length > 0 && filteredExperiences.every((experience) => experience.id < 0);
  const resultCount = shouldUseFigmaSearchFixture(keyword, searchMode)
    ? 999
    : usingFixtureResults
      ? 999
    : keyword || selectedCategoryId !== null
      ? filteredExperiences.length
      : totalCount;
  const selectedStatsSlug =
    selectedCategoryId === null
      ? searchMode || keyword.trim()
        ? DEFAULT_SEARCH_STATS_SLUG
        : null
      : CATEGORY_ID_TO_STATS_SLUG[selectedCategoryId];
  const selectedStatsLabel =
    selectedCategoryId === null
      ? DEFAULT_SEARCH_STATS_LABEL
      : EXPLORE_CATEGORIES.find((category) => category.id === selectedCategoryId)?.label ?? DEFAULT_SEARCH_STATS_LABEL;
  const selectedPatternStats = selectedStatsSlug ? patternStatsBySlug[selectedStatsSlug] ?? null : null;
  const selectedTimingStats = selectedStatsSlug ? timingStatsBySlug[selectedStatsSlug] ?? null : null;
  const emptyMessage =
    keyword
        ? '검색 결과가 없어요. 다른 키워드로 다시 찾아보세요.'
        : '표시할 사례가 아직 없어요.';
  const showInitialSkeleton = loading && experiences.length === 0;

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <div className="mx-auto min-h-screen w-full max-w-[375px] bg-white">
        <HeaderV1 searchMode={searchMode} onBack={handleBack} onSearchClick={handleHeaderSearchClick} />
        {searchMode ? (
          <div className="pt-[0px]">
            <SearchFieldV1 value={draftKeyword} inputRef={inputRef} onChange={setDraftKeyword} onSubmit={submitSearch} />
          </div>
        ) : null}

        <ExploreToolbarV1
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

        <main className="bg-[#F8F8F8] pb-[170px]">
          {feedMode === 'success' && sourceExperienceId ? (
            <div className="px-[16px] py-[12px]">
              <div className="rounded-[12px] bg-[#F6F8F6] px-[12px] py-[10px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#5A876E]">
                선택한 실패 사례와 같은 카테고리의 성공 사례를 보고 있어요.
              </div>
            </div>
          ) : null}

          {selectedStatsSlug ? (
            <ExploreStatsSection
              categoryLabel={selectedStatsLabel}
              patternStats={selectedPatternStats}
              timingStats={selectedTimingStats}
              loading={statsLoadingSlug === selectedStatsSlug}
              error={statsError}
            />
          ) : null}

          {showInitialSkeleton ? (
            <ListSkeleton count={8} />
          ) : error ? (
            <div className="px-[16px] py-[12px]">
              <ErrorState message={error} />
            </div>
          ) : filteredExperiences.length ? (
            <div className={`transition-opacity duration-200 ${loading ? 'opacity-70' : 'opacity-100'}`}>
              <div className="flex flex-col gap-[10px] px-[16px] py-[12px]">
                {filteredExperiences.map((experience) => (
                  <ExploreCardV1
                    key={experience.id}
                    experience={experience}
                    bookmarked={bookmarkedById[experience.id] ?? false}
                    showSimilarity
                    onBookmarkToggle={handleBookmarkToggle}
                    onSuccessClick={moveToSuccessCases}
                    reactionSummary={reactionSummaryById[experience.id] ?? null}
                    onReactionToggle={handleReactionToggle}
                  />
                ))}
              </div>
            </div>
          ) : (
            feedMode === 'success' ? <SuccessEmptyState /> : <div className="px-[16px] py-[12px]">
              <PageMessage message={emptyMessage} />
            </div>
          )}
        </main>

        <ExploreFabRow
          basicMode={!searchMode}
          expanded={fabExpanded}
          feedMode={feedMode}
          onFeedChange={setFeedMode}
          onToggleExpanded={() => setFabExpanded((current) => !current)}
          onCreateClick={handleCreateClick}
        />
        <BottomNav active="explore" />
      </div>
    </div>
  );
}


