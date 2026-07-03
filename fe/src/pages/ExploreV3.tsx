import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import BottomNav from '../components/layout/BottomNav';
import { useLocation, useNavigate } from 'react-router-dom';
import arrowLeftIcon from '../assets/explore-v3-figma-icons/사례 탐색 v.2 - 검색어를 치고 들어온 경우에만 유사도 표시/Arrow left.svg';
import chevronDownIcon from '../assets/explore-v3-figma-icons/사례 탐색 v.2 - 검색어를 치고 들어온 경우에만 유사도 표시/Chevron down.svg';
import filterIcon from '../assets/explore-v3-figma-icons/사례 탐색 v.2 - 검색어를 치고 들어온 경우에만 유사도 표시/tune_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24 1.svg';
import helpIcon from '../assets/explore-figma/help.svg';
import bookmarkIcon from '../assets/explore-v3-figma-icons/사례 탐색 v.2 - 검색어를 치고 들어온 경우에만 유사도 표시/Bookmark.svg';
import guideIcon from '../assets/explore-v3-figma-icons/사례 탐색 v.2 - 검색어를 치고 들어온 경우에만 유사도 표시/NavigationBar/live_help_20dp_1F1F1F_FILL0_wght400_GRAD0_opsz20 1.svg';
import heartIcon from '../assets/explore-v3-figma-icons/사례 탐색 v.2 - 검색어를 치고 들어온 경우에만 유사도 표시/Heart.svg';
import homeIcon from '../assets/explore-v3-figma-icons/사례 탐색 v.2 - 검색어를 치고 들어온 경우에만 유사도 표시/Home.svg';
import plusIcon from '../assets/explore-v3-figma-icons/사례 탐색 v.2 - 검색어를 치고 들어온 경우에만 유사도 표시/Plus.svg';
import searchNavIcon from '../assets/explore-v3-figma-icons/사례 탐색 v.2 - 검색어를 치고 들어온 경우에만 유사도 표시/Search.svg';
import userIcon from '../assets/explore-v3-figma-icons/사례 탐색 v.2 - 검색어를 치고 들어온 경우에만 유사도 표시/User.svg';
import searchIcon from '../assets/explore-v3-figma-icons/사례 탐색 v.2 - 검색어를 치고 들어온 경우에만 유사도 표시/Search.svg';
import { ErrorState, ListSkeleton, PageMessage } from '../components/common/Skeleton';
import HorizontalScroll from '../components/common/HorizontalScroll';
import { useToast } from '../components/common/useToast';
import {
  bookmarkExperience,
  getBookmarkStatus,
  getExperiences,
  getFailurePatternStats,
  getFailureTimingStats,
  getReactionSummary,
  getRelatedSuccessCases,
  reactToExperience,
  type Experience,
  type FailurePatternStatsPayload,
  type FailureTimingStatItem,
  type FailureTimingStatsPayload,
  type ReactionSummaryPayload,
  unbookmarkExperience,
  unreactToExperience,
} from '../lib/api';
import { publishBookmarkSync } from '../lib/bookmark-sync';
import { getCategoryVisualById } from '../lib/category-visuals';
import { extractExperienceImageUrls } from '../lib/experience-images';
import { extractExperienceTagLabels } from '../lib/explore-tags';
import { resolveErrorMessage } from '../lib/resolve-error-message';
import { getAccessToken } from '../lib/session';

type FeedMode = 'all' | 'failure' | 'success';
type SortKey = 'latest' | 'likes' | 'views';
type PrimaryTone = 'success' | 'failure';
type FilterSheetTab = 'type' | 'category';

type ExploreCategoryOption = {
  id: number | null;
  label: string;
  slug: string | null;
};

type CardInteractionState = ReactionSummaryPayload & {
  bookmarked: boolean;
  bookmarkCount: number;
};

const textFeatureStyle = { fontFeatureSettings: '"case" 1' } as const;

const CATEGORY_OPTIONS: ExploreCategoryOption[] = [
  { id: null, label: '전체', slug: null },
  { id: 1, label: '온라인 판매 · 이커머스', slug: 'online-commerce' },
  { id: 2, label: '콘텐츠 · SNS 기반', slug: 'content-sns' },
  { id: 3, label: '디지털 상품 · 지식 판매', slug: 'digital-products' },
  { id: 4, label: '플랫폼 기반 노동형', slug: 'platform-labor' },
  { id: 5, label: '재능 판매 · 프리랜서', slug: 'talent-freelance' },
  { id: 6, label: '투자 · 재테크', slug: 'investment' },
  { id: 7, label: '오프라인 기반 부업', slug: 'offline-sidejob' },
];

const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: 'latest', label: '최신순' },
  { key: 'likes', label: '추천순' },
  { key: 'views', label: '조회수순' },
];

const FEED_OPTIONS: Array<{ key: FeedMode; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'failure', label: '실패' },
  { key: 'success', label: '성공' },
];

const FEED_SEGMENT_WIDTH_CLASS: Record<FeedMode, string> = {
  all: 'w-[46px]',
  failure: 'w-[46px]',
  success: 'w-[46px]',
};

const DEFAULT_STATS_SLUG = 'online-commerce';

function buildMaskIconStyle(iconUrl: string) {
  return {
    WebkitMaskImage: `url("${iconUrl}")`,
    maskImage: `url("${iconUrl}")`,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
  } as const;
}

function formatCompactDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

function stopEvent(event: MouseEvent<HTMLElement>) {
  event.preventDefault();
  event.stopPropagation();
}

function matchesFeedMode(experience: Experience, mode: FeedMode) {
  if (mode === 'all') {
    return true;
  }

  return mode === 'success' ? experience.caseStatus === 'SUCCESS' : experience.caseStatus === 'FAILURE';
}

function sortExperiences(experiences: Experience[], sortKey: SortKey) {
  const sorted = [...experiences];

  if (sortKey === 'likes') {
    return sorted.sort((left, right) => right.likeCount - left.likeCount);
  }

  if (sortKey === 'views') {
    return sorted.sort((left, right) => right.viewCount - left.viewCount);
  }

  return sorted.sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

function resolveCategoryLabel(experience: Experience) {
  return getCategoryVisualById(experience.category.id)?.label ?? experience.category.name;
}

function buildKeywordLabels(experience: Experience) {
  const categoryLabel = resolveCategoryLabel(experience);

  return extractExperienceTagLabels(experience)
    .filter((label) => label !== categoryLabel)
    .slice(0, 4);
}

function normalizePreview(experience: Experience) {
  const value = experience.content.replace(/\s+/g, ' ').trim();
  return value || '본문 텍스트 미리보기';
}

function buildTopItems(stats: FailurePatternStatsPayload | null) {
  const source = stats?.patterns?.slice(0, 3) ?? [];
  const maxCount = Math.max(...source.map((item) => item.count), 1);

  return source.map((item) => ({
    ...item,
    height: item.count > 0 ? Math.max(37, Math.round((item.count / maxCount) * 88)) : 37,
  }));
}

function buildTimingPoints(distribution: FailureTimingStatItem[]) {
    const bucketToMonths: Record<string, number[]> = {
      'under-1m': [0],
      '1-3m': [1, 2, 3],
      '3-6m': [4, 5, 6],
      '6-12m': [7, 8, 9, 10, 11],
    'over-1y': [12],
  };
  const monthMap = new Map<number, number>();

  distribution.forEach((item) => {
    const months = bucketToMonths[item.bucket] ?? [];
    if (!months.length) {
      return;
    }

    const perMonthValue = item.count / months.length;
    months.forEach((month) => {
      monthMap.set(month, Number(perMonthValue.toFixed(1)));
    });
  });

  const monthlySeries = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    value: monthMap.get(index + 1) ?? 0,
  }));
  const maxValue = Math.max(...monthlySeries.map((item) => item.value), 1);
  const yAxisMax = Math.max(4, Math.ceil(maxValue));
  const startX = 14;
  const endX = 275;
  const baseY = 144;
  const topY = 30;
  const stepX = (endX - startX) / 11;
  const toY = (value: number) => {
    return Math.round(baseY - (value / yAxisMax) * (baseY - topY));
  };

  return {
    yAxisTicks: [yAxisMax, Math.ceil((yAxisMax * 2) / 3), Math.ceil(yAxisMax / 3), 0],
    peakMonth: monthlySeries.reduce((best, item) => (item.value > best.value ? item : best), monthlySeries[0])
      .month,
    points: monthlySeries.map((item, index) => ({
      x: Math.round(startX + stepX * index),
      y: toY(item.value),
      value: item.value,
      month: item.month,
    })),
  };
}

function PrimaryBadge({ label, tone }: { label: string; tone: PrimaryTone }) {
  return (
    <span
      className={`inline-flex h-[16px] items-center justify-center rounded-[4px] px-[4px] text-[10px] font-[500] leading-[12px] text-white ${
        tone === 'success' ? 'bg-[#5A876E]' : 'bg-[#C06D43]'
      }`}
      style={textFeatureStyle}
    >
      {label}
    </span>
  );
}

function CategoryBadge({ label }: { label: string }) {
  return (
    <span
      className="inline-flex h-[16px] items-center justify-center rounded-[4px] bg-[#CBE5D8] px-[4px] text-[10px] font-[500] leading-[12px] text-[#5A876E]"
      style={textFeatureStyle}
    >
      {label}
    </span>
  );
}

function NeutralBadge({ label }: { label: string }) {
  return (
    <span
      className="inline-flex h-[16px] items-center justify-center rounded-[4px] bg-[#E6E6E6] px-[4px] text-[10px] font-[500] leading-[12px] text-[#8A8A8A]"
      style={textFeatureStyle}
    >
      {label}
    </span>
  );
}

function OverflowBadge({ count }: { count: number }) {
  return (
    <span
      className="inline-flex h-[16px] items-center justify-center rounded-[4px] bg-[#E6E6E6] px-[4px] text-[10px] font-[500] leading-[12px] text-[#8A8A8A]"
      style={textFeatureStyle}
    >
      +{count}
    </span>
  );
}

function FilterBottomSheet({
  open,
  activeTab,
  draftFeedMode,
  draftCategoryId,
  onTabChange,
  onSelectFeedMode,
  onSelectCategory,
  onReset,
  onClose,
  onComplete,
}: {
  open: boolean;
  activeTab: FilterSheetTab;
  draftFeedMode: FeedMode;
  draftCategoryId: number | null;
  onTabChange: (tab: FilterSheetTab) => void;
  onSelectFeedMode: (mode: FeedMode) => void;
  onSelectCategory: (categoryId: number | null) => void;
  onReset: () => void;
  onClose: () => void;
  onComplete: () => void;
}) {
  if (!open) {
    return null;
  }

  const selectedChips = [
    ...(draftFeedMode !== 'all'
      ? [{ key: `type-${draftFeedMode}`, label: FEED_OPTIONS.find((option) => option.key === draftFeedMode)?.label ?? '' }]
      : []),
    ...(draftCategoryId !== null
      ? [
          {
            key: `category-${draftCategoryId}`,
            label: CATEGORY_OPTIONS.find((option) => option.id === draftCategoryId)?.label ?? '',
          },
        ]
      : []),
  ];
  const hasSelectedFilters = selectedChips.length > 0;
  const categoryOptions = CATEGORY_OPTIONS.filter((option) => option.id !== null);
  const optionTextClass = "text-[12px] font-[400] leading-[16.8px] text-[#131416]";

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[rgba(0,0,0,0.28)]">
      <button type="button" aria-label="필터 닫기" className="absolute inset-0" onClick={onClose} />
      <div className="relative flex h-[455px] w-full max-w-[375px] flex-col rounded-t-[20px] bg-white">
        <div className="flex shrink-0 justify-center px-[24px] pb-[16px] pt-[24px]">
          <h2 className="text-[16px] font-[600] leading-[19.2px] text-[#111111]" style={textFeatureStyle}>
            필터
          </h2>
        </div>

        <div className="flex shrink-0 border-b border-[#E6E6E6]">
          {[
            { key: 'type', label: '타입' },
            { key: 'category', label: '카테고리' },
          ].map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange(tab.key as FilterSheetTab)}
                className={`flex h-[28px] flex-1 items-start justify-center border-b-[1.5px] text-[16px] font-[600] leading-[19.2px] ${
                  active ? 'border-[#5A876E] text-[#5A876E]' : 'border-transparent text-[#BABABA]'
                }`}
                style={textFeatureStyle}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center justify-between px-[24px] py-[16px]">
          <div className="flex h-[22px] min-w-0 flex-1 items-center gap-[8px] overflow-hidden">
            {hasSelectedFilters ? (
              selectedChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => {
                    if (chip.key.startsWith('type-')) {
                      onSelectFeedMode('all');
                      return;
                    }
                    onSelectCategory(null);
                  }}
                  className="inline-flex h-[22px] shrink-0 items-center gap-[4px] rounded-[999px] border border-[#BEE8CF] bg-white px-[8px] py-[4px]"
                >
                  <span className="text-[12px] font-[400] leading-[14.4px] text-[#5A876E]" style={textFeatureStyle}>
                    {chip.label}
                  </span>
                  <span className="text-[12px] leading-none text-[#8A8A8A]">×</span>
                </button>
              ))
            ) : (
              <div className="h-[22px] w-[1px] opacity-0" aria-hidden="true" />
            )}
          </div>

          <button
            type="button"
            onClick={onReset}
            disabled={!hasSelectedFilters}
            className={`shrink-0 pl-[24px] text-[16px] font-[400] leading-[19.2px] ${
              hasSelectedFilters ? 'text-[#111111]' : 'text-[#D9D9D9]'
            }`}
            style={textFeatureStyle}
          >
            초기화
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-[24px]">
          {activeTab === 'type' ? (
            <div className="flex flex-col gap-[20px]">
              {FEED_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => onSelectFeedMode(option.key)}
                  className={`flex items-center text-left ${optionTextClass}`}
                  style={textFeatureStyle}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-[20px]">
              {categoryOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onSelectCategory(draftCategoryId === option.id ? null : option.id)}
                  className={`flex items-center text-left ${optionTextClass}`}
                  style={textFeatureStyle}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 px-[24px] pb-[48px] pt-[16px]">
          <button
            type="button"
            onClick={onComplete}
            className="h-[43px] w-full rounded-[8px] bg-[#5A876E] text-[16px] font-[600] leading-[19.2px] text-white"
            style={textFeatureStyle}
          >
            완료
          </button>
        </div>
      </div>
    </div>
  );
}

function HeaderBlock({
  selectedCategoryId,
  resultCount,
  sortKey,
  sortOpen,
  onSelectCategory,
  onToggleSort,
  onSelectSort,
  onOpenFilterSheet,
}: {
  selectedCategoryId: number | null;
  resultCount: number;
  sortKey: SortKey;
  sortOpen: boolean;
  onSelectCategory: (value: number | null) => void;
  onToggleSort: () => void;
  onSelectSort: (value: SortKey) => void;
  onOpenFilterSheet: () => void;
}) {
  const navigate = useNavigate();

  return (
    <header className="w-[375px] bg-white">
      <div className="flex h-[64px] items-center justify-between px-[16px] py-[20px]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-[24px] w-[24px] items-center justify-center"
        >
          <img src={arrowLeftIcon} alt="" className="h-[24px] w-[24px]" />
        </button>
        <p
          className="text-[16px] font-[600] leading-[19.2px] text-black"
          style={textFeatureStyle}
        >
          사례 탐색
        </p>
        <button
          type="button"
          onClick={() => navigate('/search')}
          className="flex h-[24px] w-[24px] items-center justify-center"
        >
          <img src={searchIcon} alt="" className="h-[20px] w-[20px]" />
        </button>
      </div>

      <div className="px-[16px]">
        <button
          type="button"
          onClick={() => navigate('/search')}
          className="flex h-[36px] w-[343px] items-center justify-between rounded-[999px] border border-[#EEEEEE] bg-[#F8F8F8] px-[16px] py-[8px]"
        >
          <span
            className="text-[14px] font-[400] leading-[19.6px] text-[#494949]"
            style={textFeatureStyle}
          >
            검색어
          </span>
          <img src={searchIcon} alt="" className="h-[24px] w-[24px]" />
        </button>
      </div>

      <div className="flex flex-col items-start gap-[12px] py-[12px]">
        <div className="flex w-full items-center gap-[8px] px-[16px]">
          <button
            type="button"
            onClick={onOpenFilterSheet}
            className="flex h-[26px] w-[26px] items-center justify-center rounded-[4px]"
          >
            <img src={filterIcon} alt="" className="h-[24px] w-[24px]" />
          </button>

          <HorizontalScroll
            wrapperClassName="min-w-0 flex-1"
            scrollerClassName="h-[26px] overflow-y-hidden pr-[16px]"
            contentClassName="h-[26px] min-w-[860px] items-center gap-[6px]"
          >
              {CATEGORY_OPTIONS.map((option) => {
                const active = option.id === selectedCategoryId;
                return (
                  <button
                    key={String(option.id)}
                    type="button"
                    onClick={() => onSelectCategory(option.id)}
                    className={`inline-flex h-[26px] shrink-0 items-center justify-center rounded-[999px] px-[10px] py-[6px] ${
                      active ? 'bg-[#5A876E]' : 'border border-[#EEEEEE] bg-white'
                    }`}
                  >
                    <span
                      className={`text-[12px] font-[500] leading-[14.4px] ${
                        active ? 'text-white' : 'text-[#5A876E]'
                      }`}
                      style={textFeatureStyle}
                    >
                      {option.label}
                    </span>
                  </button>
                );
              })}
          </HorizontalScroll>
        </div>

        <div className="flex w-full items-center justify-between px-[16px]">
          <div
            className="flex items-center text-[12px] font-[400] leading-[16.8px] text-black"
            style={textFeatureStyle}
          >
            <span>{resultCount.toLocaleString()}</span>
            <span>개</span>
          </div>

          <div className="relative">
            <button type="button" onClick={onToggleSort} className="flex items-center">
              <span
                className="text-[12px] font-[400] leading-[16.8px] text-[#131416]"
                style={textFeatureStyle}
              >
                {SORT_OPTIONS.find((option) => option.key === sortKey)?.label}
              </span>
              <img
                src={chevronDownIcon}
                alt=""
                className={`h-[20px] w-[20px] transition-transform ${
                  sortOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {sortOpen ? (
              <div className="absolute right-0 top-[25px] z-20 flex flex-col gap-[12px] rounded-[4px] bg-white px-[12px] py-[8px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)]">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => onSelectSort(option.key)}
                    className="flex items-center text-left"
                  >
                    <span
                      className="text-[12px] font-[400] leading-[16.8px] text-[#5E5E5E]"
                      style={textFeatureStyle}
                    >
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

function StatsAccordion({
  open,
  loading,
  patternStats,
  timingStats,
  error,
  onToggle,
}: {
  open: boolean;
  loading: boolean;
  patternStats: FailurePatternStatsPayload | null;
  timingStats: FailureTimingStatsPayload | null;
  error: string;
  onToggle: () => void;
}) {
  const topItems = buildTopItems(patternStats);
  const patternItems = patternStats?.patterns?.slice(0, 3) ?? [];
  const timingChart = buildTimingPoints(timingStats?.distribution ?? []);
  const polylinePoints = timingChart.points.map((point) => `${point.x},${point.y}`).join(' ');
  const axisLabels = Array.from({ length: 12 }, (_, index) => String(index + 1));

  return (
    <section className="w-[375px] bg-white pb-[4px]">
      <button
        type="button"
        onClick={onToggle}
        className="flex h-[44px] w-full items-center justify-between px-[16px]"
      >
        <div className="flex items-center gap-[4px]">
          <span
            className="text-[14px] font-[600] leading-[16.8px] text-[#5A876E]"
            style={textFeatureStyle}
          >
            카테고리
          </span>
          <span
            className="text-[14px] font-[400] leading-[16.8px] text-black"
            style={textFeatureStyle}
          >
            통계
          </span>
          <img src={helpIcon} alt="" className="h-[12.25px] w-[12.25px]" />
        </div>
        <img
          src={chevronDownIcon}
          alt=""
          className={`h-[20px] w-[20px] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <div className="flex flex-col items-start gap-[12px] px-[16px] pb-[12px] pt-[8px]">
          {loading ? <ListSkeleton count={3} /> : null}
          {!loading && error ? <ErrorState message={error} /> : null}
          {!loading && !error && !patternStats ? <PageMessage message="통계 데이터를 불러오지 못했습니다." /> : null}

          {!loading && !error && patternStats && timingStats ? (
            <>
              <article className="flex w-[343px] flex-col gap-[12px] rounded-[8px] border border-[#EEEEEE] bg-white px-[16px] py-[16px]">
                <div className="flex flex-col gap-[4px]">
                  <h2
                    className="text-[16px] font-[700] leading-[22.4px] text-[#131416]"
                    style={textFeatureStyle}
                  >
                    실패 요인 TOP3
                  </h2>
                  <p
                    className="text-[14px] font-[400] leading-[19.6px] text-[#494949]"
                    style={textFeatureStyle}
                  >
                    카테고리 내 가장 많이 나타나는 실패 원인입니다.
                  </p>
                </div>

                <div className="flex items-end justify-between px-[20px] py-[16px]">
                  {topItems.map((item) => (
                    <div
                      key={item.label}
                      className="flex w-[69px] shrink-0 flex-col items-center gap-[8px]"
                    >
                      <div className="flex flex-col items-center gap-[2px]">
                        <div className="flex items-center justify-end text-[12px] leading-[16.8px] whitespace-nowrap">
                          <span
                            className="text-[12px] font-[600] leading-[16.8px] text-[#5A876E]"
                            style={textFeatureStyle}
                          >
                            {Math.round(item.percent)}
                          </span>
                          <span
                            className="text-[12px] font-[400] leading-[16.8px] text-[#494949]"
                            style={textFeatureStyle}
                          >
                            %
                          </span>
                        </div>
                        <div
                          className="w-[40px] shrink-0 rounded-tl-[4px] rounded-tr-[4px] bg-[linear-gradient(180deg,#5A876E_0%,#92BFA6_100%)] shadow-[2px_0px_4px_0px_rgba(0,0,0,0.1)]"
                          style={{ height: `${item.height}px` }}
                        />
                      </div>
                      <p
                        className="text-center text-[12px] font-[400] leading-[16.8px] text-[#494949]"
                        style={textFeatureStyle}
                      >
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>

                <p
                  className="text-[14px] font-[500] leading-[19.6px] text-[#5A876E]"
                  style={textFeatureStyle}
                >
                  {patternStats.summary}
                </p>
              </article>

              <article className="flex w-[343px] flex-col gap-[12px] rounded-[8px] border border-[#EEEEEE] bg-white px-[16px] py-[16px]">
                <div className="flex flex-col gap-[4px]">
                  <h2
                    className="text-[16px] font-[700] leading-[22.4px] text-[#131416]"
                    style={textFeatureStyle}
                  >
                    실패 패턴
                  </h2>
                  <p
                    className="text-[14px] font-[400] leading-[19.6px] text-[#494949]"
                    style={textFeatureStyle}
                  >
                    카테고리 내 나타나는 실패 패턴 비중 그래프 데이터입니다.
                  </p>
                </div>

                <div className="flex flex-col gap-[14px]">
                  {patternItems.map((item) => (
                    <div key={item.label} className="flex flex-col gap-[4px]">
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[14px] font-[400] leading-[19.6px] text-[#494949]"
                          style={textFeatureStyle}
                        >
                          {item.label}
                        </span>
                        <span
                          className="text-[14px] font-[400] leading-[19.6px] text-[#494949]"
                          style={textFeatureStyle}
                        >
                          {Math.round(item.percent)}%
                        </span>
                      </div>
                      <div className="h-[6px] w-full rounded-[999px] bg-[#D9D9D9]">
                        <div
                          className="h-[6px] rounded-[999px] bg-[#7DA58D]"
                          style={{ width: `${Math.max(8, (item.percent / 100) * 311)}px` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <p
                  className="text-center text-[14px] font-[500] leading-[19.6px] text-[#5A876E]"
                  style={textFeatureStyle}
                >
                  {patternStats.explanation.insufficientMessage || patternStats.summary}
                </p>
              </article>

              <article className="flex w-[343px] flex-col gap-[12px] rounded-[8px] border border-[#EEEEEE] bg-white px-[16px] py-[16px]">
                <div className="flex flex-col gap-[4px]">
                  <h2
                    className="text-[16px] font-[700] leading-[22.4px] text-[#131416]"
                    style={textFeatureStyle}
                  >
                    실패 시점 분포
                  </h2>
                  <p
                    className="text-[14px] font-[400] leading-[19.6px] text-[#494949]"
                    style={textFeatureStyle}
                  >
                    카테고리 내 실패를 겪는 시점의 분포 그래프입니다.
                  </p>
                </div>

                <div className="relative h-[188px] w-[311px]">
                  <div className="absolute left-[0] top-[12px] flex h-[112px] w-[311px] flex-col justify-between">
                    {timingChart.yAxisTicks.map((value) => (
                      <div key={value} className="relative h-[1px] w-full bg-[#D9D9D9]">
                        <span
                          className="absolute left-[-22px] top-[-10px] text-[12px] font-[400] leading-[16.8px] text-[#494949]"
                          style={textFeatureStyle}
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <svg
                    className="absolute left-[0] top-[12px]"
                    width="311"
                    height="144"
                    viewBox="0 0 311 144"
                    fill="none"
                  >
                    <polyline
                      points={polylinePoints}
                      fill="none"
                      stroke="#5A876E"
                      strokeWidth="2"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    {timingChart.points.map((point) => (
                      <circle key={`${point.x}-${point.y}`} cx={point.x} cy={point.y} r="4" fill="#5A876E" />
                    ))}
                  </svg>

                  <div className="absolute left-[106px] top-[24px] flex min-h-[40px] min-w-[141px] items-center justify-center rounded-[12px] border border-[#5A876E] bg-white px-[10px]">
                    <span
                      className="text-[14px] font-[500] leading-[19.6px] text-[#5A876E]"
                      style={textFeatureStyle}
                    >
                      {`${timingChart.peakMonth}개월 차에 가장 많이 발생`}
                    </span>
                  </div>

                  <div className="absolute bottom-[18px] left-[12px] flex w-[287px] items-center justify-between">
                    {axisLabels.map((label) => (
                      <span
                        key={label}
                        className="text-[12px] font-[400] leading-[16.8px] text-[#494949]"
                        style={textFeatureStyle}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>

                <p
                  className="text-[14px] font-[500] leading-[19.6px] text-[#5A876E]"
                  style={textFeatureStyle}
                >
                  {timingStats.summary}
                </p>
              </article>
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function ReviewCardRow({
  experience,
  interaction,
  onHeartToggle,
  onBookmarkToggle,
  onCtaClick,
}: {
  experience: Experience;
  interaction?: CardInteractionState;
  onHeartToggle: (experience: Experience) => void;
  onBookmarkToggle: (experience: Experience) => void;
  onCtaClick: (experience: Experience) => void;
}) {
  const previewClampStyle = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  };
  const primaryTone: PrimaryTone = experience.caseStatus === 'SUCCESS' ? 'success' : 'failure';
  const primaryLabel = experience.caseStatus === 'SUCCESS' ? '성공' : '실패';
  const categoryLabel = resolveCategoryLabel(experience);
  const keywordLabels = buildKeywordLabels(experience);
  const visibleKeywordLabels = keywordLabels.slice(0, 2);
  const overflowKeywordCount = Math.max(0, keywordLabels.length - visibleKeywordLabels.length);
  const preview = normalizePreview(experience);
  const imageUrl = extractExperienceImageUrls(experience)[0] ?? null;
  const showImage = Boolean(imageUrl);
  const navigate = useNavigate();
  const heartCount = interaction?.heartCount ?? experience.likeCount;
  const bookmarkCount = interaction?.bookmarkCount ?? (experience.bookmarkCount ?? 0);
  const heartActive = interaction?.myReactions.includes('HEART') ?? false;
  const bookmarkActive = interaction?.bookmarked ?? false;
  const fullVariant = experience.caseStatus === 'FAILURE';
  const detailPath = `/experiences/${experience.id}`;

  return (
    <article
      className={`w-[375px] bg-white px-[16px] py-[20px] ${fullVariant ? 'h-[188px]' : 'h-[150px]'}`}
      role="link"
      tabIndex={0}
      onClick={() => navigate(detailPath)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          navigate(detailPath);
        }
      }}
    >
      <div className="flex w-full flex-col items-start gap-[8px]">
        <div className="flex w-full flex-col items-start gap-[8px]">
          <div className="flex w-full items-center justify-between">
            <div className="flex min-w-0 items-start gap-[4px] overflow-hidden whitespace-nowrap">
              <PrimaryBadge label={primaryLabel} tone={primaryTone} />
              <CategoryBadge label={categoryLabel} />
              {visibleKeywordLabels.map((label, index) => (
                <NeutralBadge key={`${experience.id}-${index}-${label}`} label={label} />
              ))}
              {overflowKeywordCount > 0 ? <OverflowBadge count={overflowKeywordCount} /> : null}
            </div>
          </div>

          <div className="flex h-[60px] w-full items-start gap-[8px]">
            {showImage ? (
              <div className="relative h-[60px] w-[80px] shrink-0 overflow-hidden rounded-[4px] bg-[#D8D8D8]">
                <img src={imageUrl!} alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
            ) : null}
            <div
              className={`flex h-[60px] min-w-0 flex-col items-start ${showImage ? 'w-[223px] shrink-0' : 'w-full flex-1'}`}
            >
              <div className="flex min-h-px w-full flex-[1_0_0] flex-col items-start gap-[4px] whitespace-nowrap">
                <p
                  className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-[600] leading-[16.8px] text-[#131416]"
                  style={textFeatureStyle}
                >
                  {experience.title}
                </p>
                <p
                  className="w-full text-[12px] font-[400] leading-[16.8px] text-[#494949]"
                  style={{ ...textFeatureStyle, ...previewClampStyle }}
                >
                  {preview}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={`flex w-full flex-col items-start ${fullVariant ? 'gap-[6px]' : 'gap-[8px]'}`}>
          <div className="flex w-full items-center justify-between">
            <div
              className="flex min-w-0 items-start gap-[4px] text-[12px] font-[300] leading-[16.8px] text-[#8A8A8A]"
              style={textFeatureStyle}
            >
              <span className="truncate">{experience.author.nickname || '닉네임'}</span>
              <span>•</span>
              <span>{formatCompactDate(experience.createdAt)}</span>
              <span>•</span>
              <span className="flex items-center gap-[2px]">
                <span>조회</span>
                <span>{experience.viewCount.toLocaleString()}</span>
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-[4px]">
              <button
                type="button"
                className="m-0 flex w-[46px] shrink-0 items-center border-0 bg-transparent p-0 text-inherit appearance-none"
                onClick={(event) => {
                  stopEvent(event);
                  onHeartToggle(experience);
                }}
              >
                <div className="flex w-full shrink-0 items-center gap-[2px]">
                  <div className="flex h-[20px] w-[20px] shrink-0 items-center justify-center">
                    <span
                      aria-hidden="true"
                      className={`block h-[14px] w-[14px] ${heartActive ? 'bg-[#5A876E]' : 'bg-[#8A8A8A]'}`}
                      style={buildMaskIconStyle(heartIcon)}
                    />
                  </div>
                  <span
                    className="min-w-[24px] shrink-0 text-[12px] font-[400] leading-[16.8px] text-[#8A8A8A] tabular-nums"
                    style={textFeatureStyle}
                  >
                    {heartCount.toLocaleString()}
                  </span>
                </div>
              </button>
              <button
                type="button"
                className="m-0 flex w-[46px] shrink-0 items-center border-0 bg-transparent p-0 text-inherit appearance-none"
                onClick={(event) => {
                  stopEvent(event);
                  onBookmarkToggle(experience);
                }}
              >
                <div className="flex w-full shrink-0 items-center gap-[2px]">
                  <div className="flex h-[24px] w-[24px] shrink-0 items-center justify-center">
                    <span
                      aria-hidden="true"
                      className={`block h-[14px] w-[14px] ${bookmarkActive ? 'bg-[#5A876E]' : 'bg-[#8A8A8A]'}`}
                      style={buildMaskIconStyle(bookmarkIcon)}
                    />
                  </div>
                  <span
                    className="min-w-[24px] shrink-0 text-[12px] font-[400] leading-[16.8px] text-[#8A8A8A] tabular-nums"
                    style={textFeatureStyle}
                  >
                    {bookmarkCount.toLocaleString()}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {fullVariant ? (
            <div className="flex w-full items-center justify-end">
              <button
                type="button"
                aria-label="CTA 이동"
                className="relative z-[1] flex h-[30px] w-[48px] shrink-0 items-start justify-start rounded-[8px] bg-[#5A876E] px-[12px] py-[8px]"
                onClick={(event) => {
                  stopEvent(event);
                  onCtaClick(experience);
                }}
              >
                <div
                  className="flex flex-col justify-center text-center text-[12px] font-[600] leading-[0] text-white"
                  style={textFeatureStyle}
                >
                  <span className="leading-[14.4px]">성공</span>
                </div>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function FooterArea({
  feedMode,
  onSelectFeedMode,
  fabOpen,
  onToggleFab,
}: {
  feedMode: FeedMode;
  onSelectFeedMode: (mode: FeedMode) => void;
  fabOpen: boolean;
  onToggleFab: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = [
    { key: 'home', label: '홈', icon: homeIcon, active: false, path: '/' },
    {
      key: 'explore',
      label: '탐색',
      icon: searchNavIcon,
      active:
        location.pathname.startsWith('/explore') ||
        location.pathname.startsWith('/v1/explore') ||
        location.pathname.startsWith('/v3/explore'),
      path: '/explore',
    },
    { key: 'guide', label: '가이드', icon: guideIcon, active: location.pathname === '/faq' || location.pathname === '/mypage/faq', path: '/faq' },
    { key: 'my', label: 'MY', icon: userIcon, active: location.pathname.startsWith('/mypage') && location.pathname !== '/mypage/faq', path: '/mypage' },
  ] as const;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center">
      <div className="pointer-events-auto flex w-[375px] flex-col items-center">
        <div className="flex w-full items-center justify-between px-[24px] py-[16px]">
          <div className="h-[36px] w-[36px] shrink-0" />
          <div className="flex h-[38px] w-[135px] items-center rounded-[999px] bg-white px-[8px] py-[6px] shadow-[0px_0px_2px_rgba(0,0,0,0.15)]">
            {FEED_OPTIONS.map((option) => {
              const active = option.key === feedMode;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => onSelectFeedMode(option.key)}
                  className={`${FEED_SEGMENT_WIDTH_CLASS[option.key]} flex h-[26px] shrink-0 items-center justify-center rounded-[999px] px-[8px] py-[6px] ${
                    active ? 'bg-[#375E49]' : 'bg-white'
                  }`}
                >
                  <span
                    className={`text-[12px] font-[400] leading-[14.4px] ${
                      active ? 'text-white' : 'text-black'
                    }`}
                    style={textFeatureStyle}
                  >
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onToggleFab}
            className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full bg-[#5A876E] shadow-[0px_4px_12px_rgba(90,135,110,0.24)]"
          >
            <img
              src={plusIcon}
              alt=""
              className={`h-[20px] w-[20px] transition-transform ${fabOpen ? 'rotate-45' : ''}`}
            />
          </button>
        </div>

        <nav className="flex h-[84px] w-[375px] items-start justify-between rounded-tl-[20px] rounded-tr-[20px] bg-white px-[40px] pb-[32px] pt-[12px] shadow-[0px_0px_5px_rgba(0,0,0,0.15)]">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-current={item.active ? 'page' : undefined}
              onClick={() => navigate(item.path)}
              className={`flex w-[40px] flex-col items-center justify-start gap-[4px] ${
                item.active ? 'opacity-100' : 'opacity-30'
              }`}
            >
              <span
                aria-hidden="true"
                className={`block h-[24px] w-[24px] ${item.active ? 'bg-[#5A876E]' : 'bg-black'}`}
                style={buildMaskIconStyle(item.icon)}
              />
              <span
                className={`text-[12px] leading-none ${
                  item.active ? 'font-[600] text-[#5A876E]' : 'font-[400] text-black'
                }`}
                style={textFeatureStyle}
              >
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

function SharedFooterArea({
  feedMode,
  onSelectFeedMode,
  fabOpen,
  onToggleFab,
  onCreateClick,
}: {
  feedMode: FeedMode;
  onSelectFeedMode: (mode: FeedMode) => void;
  fabOpen: boolean;
  onToggleFab: () => void;
  onCreateClick: () => void;
}) {
  return (
    <BottomNav
      active="explore"
      showFab
      accessoryBottom={108}
      accessoryLayout="center"
      fabExpanded={fabOpen}
      onFabToggle={onToggleFab}
      onCreateClick={onCreateClick}
      accessory={
        <div className="pointer-events-auto flex h-[38px] w-[135px] items-center rounded-[999px] bg-white px-[8px] py-[6px] shadow-[0px_0px_2px_rgba(0,0,0,0.15)]">
          <div className="flex w-full items-center gap-[4px]">
            {FEED_OPTIONS.map((option) => {
              const active = option.key === feedMode;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => onSelectFeedMode(option.key)}
                  className={`flex h-[26px] min-w-0 flex-1 items-center justify-center rounded-[999px] px-[8px] py-[6px] ${
                    active ? 'bg-[#315441]' : 'bg-white'
                  }`}
                >
                  <span
                    className={`text-[12px] font-[400] leading-[14.4px] ${
                      active ? 'text-white' : 'text-[#131416]'
                    }`}
                    style={textFeatureStyle}
                  >
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      }
    />
  );
}

void FooterArea;

export default function ExploreV3() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const accessToken = getAccessToken();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('latest');
  const [sortOpen, setSortOpen] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [feedMode, setFeedMode] = useState<FeedMode>('all');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [filterSheetTab, setFilterSheetTab] = useState<FilterSheetTab>('type');
  const [draftFeedMode, setDraftFeedMode] = useState<FeedMode>('all');
  const [draftCategoryId, setDraftCategoryId] = useState<number | null>(null);
  const [fabOpen, setFabOpen] = useState(false);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');
  const [patternStats, setPatternStats] = useState<FailurePatternStatsPayload | null>(null);
  const [timingStats, setTimingStats] = useState<FailureTimingStatsPayload | null>(null);
  const [interactionById, setInteractionById] = useState<Record<number, CardInteractionState>>({});

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const rawCategoryId = params.get('categoryId');

    if (!rawCategoryId) {
      setSelectedCategoryId(null);
      return;
    }

    const nextCategoryId = Number(rawCategoryId);
    if (!Number.isFinite(nextCategoryId)) {
      setSelectedCategoryId(null);
      return;
    }

    setSelectedCategoryId(nextCategoryId);
  }, [location.search]);

  useEffect(() => {
    let active = true;

    async function loadExperiences() {
      setListLoading(true);
      setListError('');

      try {
        const payload = await getExperiences({
          page: 0,
          size: 100,
          categoryId: selectedCategoryId ?? undefined,
          sort: sortKey === 'latest' ? 'latest' : 'popular',
        });

        if (!active) {
          return;
        }

        setExperiences(payload.experiences);
        setTotalCount(payload.pagination.totalElements);
      } catch (error) {
        if (!active) {
          return;
        }
        setListError(resolveErrorMessage(error, '사례 목록을 불러오지 못했습니다.'));
      } finally {
        if (active) {
          setListLoading(false);
        }
      }
    }

    void loadExperiences();

    return () => {
      active = false;
    };
  }, [selectedCategoryId, sortKey]);

  useEffect(() => {
    let active = true;
    const categorySlug =
      CATEGORY_OPTIONS.find((option) => option.id === selectedCategoryId)?.slug ?? DEFAULT_STATS_SLUG;

    setStatsLoading(true);
    setStatsError('');

    void Promise.all([
      getFailurePatternStats(categorySlug),
      getFailureTimingStats(categorySlug),
    ])
      .then(([nextPatternStats, nextTimingStats]) => {
        if (!active) {
          return;
        }
        setPatternStats(nextPatternStats);
        setTimingStats(nextTimingStats);
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        setStatsError(resolveErrorMessage(error, '카테고리 통계를 불러오지 못했습니다.'));
        setPatternStats(null);
        setTimingStats(null);
      })
      .finally(() => {
        if (active) {
          setStatsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedCategoryId]);

  const renderedExperiences = useMemo(() => {
    return sortExperiences(
      experiences.filter((experience) => matchesFeedMode(experience, feedMode)),
      sortKey,
    );
  }, [experiences, feedMode, sortKey]);
  const isEmptyState = !listLoading && !listError && renderedExperiences.length === 0;
  const resultCount = feedMode === 'all' ? totalCount : renderedExperiences.length;

  useEffect(() => {
    if (!accessToken || renderedExperiences.length === 0) {
      setInteractionById({});
      return;
    }

    let cancelled = false;

    void Promise.all(
      renderedExperiences.map(async (experience) => {
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
      if (cancelled) {
        return;
      }

      setInteractionById(Object.fromEntries(entries));
    });

    return () => {
      cancelled = true;
    };
  }, [accessToken, renderedExperiences]);

  async function handleBookmarkToggle(experience: Experience) {
    if (!accessToken) {
      navigate(
        `/auth?next=${encodeURIComponent('/v3/explore')}&reason=${encodeURIComponent(
          '북마크는 로그인이 필요한 서비스입니다.',
        )}`,
      );
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
      showToast(payload.bookmarked ? '북마크에 추가했어요.' : '북마크를 해제했어요.');
    } catch (error) {
      showToast(resolveErrorMessage(error, '북마크 처리에 실패했습니다.'));
    }
  }

  async function handleHeartToggle(experience: Experience) {
    if (!accessToken) {
      navigate(
        `/auth?next=${encodeURIComponent('/v3/explore')}&reason=${encodeURIComponent(
          '반응 기능은 로그인이 필요한 서비스입니다.',
        )}`,
      );
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
    const active = current.myReactions.includes('HEART');
    const optimistic: CardInteractionState = {
      ...current,
      heartCount: Math.max(0, current.heartCount + (active ? -1 : 1)),
      myReactions: active
        ? current.myReactions.filter((item) => item !== 'HEART')
        : [...current.myReactions, 'HEART'],
    };

    setInteractionById((state) => ({
      ...state,
      [experience.id]: optimistic,
    }));

    try {
      const payload = active
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
    } catch (error) {
      setInteractionById((state) => ({
        ...state,
        [experience.id]: current,
      }));
      showToast(resolveErrorMessage(error, '반응 처리에 실패했습니다.'));
    }
  }

  async function handleCardCta(experience: Experience) {
    if (experience.caseStatus !== 'FAILURE') {
      navigate(`/experiences/${experience.id}`);
      return;
    }

    try {
      const related = await getRelatedSuccessCases(experience.id, 1);
      const target = related[0];
      if (!target) {
        showToast('연결된 성공 사례가 아직 없어요.');
        return;
      }
      navigate(`/experiences/${target.id}`);
    } catch (error) {
      showToast(resolveErrorMessage(error, '성공 사례를 불러오지 못했습니다.'));
    }
  }

  function handleCreateClick() {
    setFabOpen(false);

    if (!accessToken) {
      navigate(
        `/auth?next=${encodeURIComponent('/create')}&reason=${encodeURIComponent(
          '경험 작성은 로그인이 필요한 서비스입니다.',
        )}`,
      );
      return;
    }

    navigate('/create');
  }

  function openFilterSheet() {
    setFilterSheetTab('type');
    setDraftFeedMode(feedMode);
    setDraftCategoryId(selectedCategoryId);
    setFilterSheetOpen(true);
  }

  function closeFilterSheet() {
    setFilterSheetOpen(false);
    setDraftFeedMode(feedMode);
    setDraftCategoryId(selectedCategoryId);
  }

  function handleCompleteFilterSheet() {
    setFeedMode(draftFeedMode);
    handleSelectCategory(draftCategoryId);
    setFilterSheetOpen(false);
  }

  function handleSelectCategory(categoryId: number | null) {
    const params = new URLSearchParams(location.search);

    if (categoryId === null) {
      params.delete('categoryId');
    } else {
      params.set('categoryId', String(categoryId));
    }

    const nextSearch = params.toString();
    navigate(
      {
        pathname: '/explore',
        search: nextSearch ? `?${nextSearch}` : '',
      },
      { replace: true },
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-[375px]">
        <div className="relative w-[375px] overflow-hidden bg-[#F8F8F8] pb-[184px]">
          <HeaderBlock
            selectedCategoryId={selectedCategoryId}
            resultCount={resultCount}
            sortKey={sortKey}
            sortOpen={sortOpen}
            onSelectCategory={handleSelectCategory}
            onToggleSort={() => setSortOpen((prev) => !prev)}
            onSelectSort={(value) => {
              setSortKey(value);
              setSortOpen(false);
            }}
            onOpenFilterSheet={openFilterSheet}
          />

          {!isEmptyState ? (
            <StatsAccordion
              open={accordionOpen}
              loading={statsLoading}
              patternStats={patternStats}
              timingStats={timingStats}
              error={statsError}
              onToggle={() => setAccordionOpen((prev) => !prev)}
            />
          ) : null}

          {listLoading ? (
            <div className="px-[16px] py-[12px]">
              <ListSkeleton count={6} />
            </div>
          ) : null}

          {!listLoading && listError ? (
            <div className="px-[16px] py-[12px]">
              <ErrorState message={listError} />
            </div>
          ) : null}

          {isEmptyState ? (
            <div className="flex min-h-[453px] w-[375px] items-start justify-center bg-[#F8F8F8] px-[16px] py-[20px]">
              <p
                className="text-[12px] font-[400] leading-[16.8px] text-[#757575]"
                style={textFeatureStyle}
              >
                아직 등록된 사례가 없어요.
              </p>
            </div>
          ) : null}

          {!listLoading && !listError && renderedExperiences.length > 0 ? (
            <section className="flex w-[375px] flex-col gap-[2px]">
              {renderedExperiences.map((experience) => (
                <ReviewCardRow
                  key={experience.id}
                  experience={experience}
                  interaction={interactionById[experience.id]}
                  onHeartToggle={handleHeartToggle}
                  onBookmarkToggle={handleBookmarkToggle}
                  onCtaClick={handleCardCta}
                />
              ))}
            </section>
          ) : null}
        </div>

        <SharedFooterArea
          feedMode={feedMode}
          onSelectFeedMode={setFeedMode}
          fabOpen={fabOpen}
          onToggleFab={() => setFabOpen((prev) => !prev)}
          onCreateClick={handleCreateClick}
        />

        <FilterBottomSheet
          open={filterSheetOpen}
          activeTab={filterSheetTab}
          draftFeedMode={draftFeedMode}
          draftCategoryId={draftCategoryId}
          onTabChange={setFilterSheetTab}
          onSelectFeedMode={setDraftFeedMode}
          onSelectCategory={setDraftCategoryId}
          onReset={() => {
            setDraftFeedMode('all');
            setDraftCategoryId(null);
          }}
          onClose={closeFilterSheet}
          onComplete={handleCompleteFilterSheet}
        />
      </div>
    </div>
  );
}
