import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import bookmarkIcon from '../assets/explore-figma/bookmark.svg';
import chevronDownIcon from '../assets/explore-figma/chevron-down.svg';
import filterIcon from '../assets/explore-figma/filter.svg';
import helpIcon from '../assets/explore-figma/help.svg';
import plusIcon from '../assets/explore-figma/plus.svg';
import { TagChip } from '../components/common/Chip';
import CaseSegment from '../components/common/CaseSegment';
import HorizontalScroll from '../components/common/HorizontalScroll';
import SearchBar from '../components/common/SearchBar';
import { ErrorState, ListSkeleton, PageMessage } from '../components/common/Skeleton';
import { useToast } from '../components/common/useToast';
import Layout from '../components/layout/Layout';
import { getExperiences, type Experience } from '../lib/api';
import { CATEGORY_VISUALS } from '../lib/category-visuals';
import { getExperienceImageMeta } from '../lib/experience-images';
import { resolveErrorMessage } from '../lib/resolve-error-message';
import { getAccessToken } from '../lib/session';

type SortKey = 'latest' | 'popular';
type FeedMode = 'all' | 'failure' | 'success';
type SortOption = 'latest' | 'likes' | 'views';

type FilterTagOption = {
  label: string;
  value: number | null;
};

type SimilarityTone = {
  text: string;
  bar: string;
};

const SIMILARITY_TONES = {
  high: { text: '#5A876E', bar: '#5A876E' },
  medium: { text: '#D07B48', bar: '#D07B48' },
  low: { text: '#8A8A8A', bar: '#8A8A8A' },
} satisfies Record<'high' | 'medium' | 'low', SimilarityTone>;

const FEED_OPTIONS: Array<{ key: FeedMode; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'failure', label: '실패' },
  { key: 'success', label: '성공' },
];

const SORT_OPTIONS: Array<{ key: SortOption; label: string }> = [
  { key: 'latest', label: '최신순' },
  { key: 'likes', label: '추천순' },
  { key: 'views', label: '조회수순' },
];

function formatCompactDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

function dedupeTags(experience: Experience) {
  return Array.from(
    new Set([experience.businessType, experience.category.name, ...experience.failureReasons].filter(Boolean)),
  ).slice(0, 4) as string[];
}

function matchesFeedMode(experience: Experience, mode: FeedMode) {
  if (mode === 'all') {
    return true;
  }

  const successSignal = Boolean(experience.wouldRetry) || (experience.monthlyRevenue ?? 0) > 0;
  return mode === 'success' ? successSignal : !successSignal;
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

function calculateSimilarity(experience: Experience, keyword: string) {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const tokens = normalized.split(/\s+/).filter(Boolean);
  if (!tokens.length) {
    return null;
  }

  const title = `${experience.title} ${experience.businessType ?? ''}`.toLowerCase();
  const content = `${experience.content} ${experience.lessonsLearned ?? ''}`.toLowerCase();
  let score = 0;

  for (const token of tokens) {
    if (title.includes(token)) {
      score += 2;
    }
    if (content.includes(token)) {
      score += 1;
    }
  }

  const maxScore = tokens.length * 3;
  const similarity = Math.round(55 + (score / maxScore) * 43);
  return Math.max(55, Math.min(similarity, 99));
}

function getSimilarityTone(score: number) {
  if (score >= 80) {
    return SIMILARITY_TONES.high;
  }
  if (score >= 60) {
    return SIMILARITY_TONES.medium;
  }
  return SIMILARITY_TONES.low;
}

function FilterTag({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="shrink-0"
    >
      <TagChip
        label={label}
        tone={active ? 'primary' : 'secondary'}
        className={`h-[26px] px-[10px] py-[6px] text-[12px] font-[500] leading-[14.4px] ${
          active ? '' : 'border-[#EAEAEA] text-[#6A9B7E]'
        }`}
      />
    </button>
  );
}

function HelpFab({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="도움말"
      className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#131416] text-white shadow-[0_10px_22px_rgba(0,0,0,0.18)]"
    >
      <img src={helpIcon} alt="" className="h-[18px] w-[18px]" />
    </button>
  );
}

function SimilarityBadge({ score }: { score: number }) {
  const tone = getSimilarityTone(score);

  return (
    <div className="flex shrink-0 items-center gap-[4px] pt-[1px]">
      <span className="h-[3px] w-[22px] rounded-[999px]" style={{ backgroundColor: tone.bar }} />
      <span
        className="text-right text-[16px] font-[500] leading-[19.2px] tracking-[0px]"
        style={{ color: tone.text }}
      >
        {score}%
      </span>
    </div>
  );
}

function ResultThumbnail({ count, imageUrl }: { count: number; imageUrl: string }) {
  return (
    <div className="relative h-[81px] w-[81px] shrink-0 overflow-hidden rounded-[4px] bg-[#9F9F9F]">
      <img src={imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_52%)]" />
      <div className="absolute bottom-[6px] right-[6px] flex h-[18px] min-w-[18px] items-center justify-center rounded-[4px] bg-[rgba(0,0,0,0.35)] px-[4px] text-[10px] font-[600] leading-[12px] text-white">
        {Math.max(count, 1)}
      </div>
    </div>
  );
}

function SuccessCta() {
  return (
    <span className="inline-flex h-[28px] items-center justify-center rounded-[8px] bg-[#5A876E] px-[11px] text-[12px] font-[600] leading-[14.4px] tracking-[0px] text-white">
      유사 성공 사례
    </span>
  );
}

function ExploreCard({
  experience,
  keyword,
  showSimilarity,
}: {
  experience: Experience;
  keyword: string;
  showSimilarity: boolean;
}) {
  const tags = dedupeTags(experience);
  const preview =
    experience.content.replace(/\s+/g, ' ').trim() ||
    '본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기';
  const tagPalette = ['#D07B48', '#BFE4D1', '#DDDDDD', '#DDDDDD'];
  const imageMeta = getExperienceImageMeta(experience);
  const similarity = showSimilarity ? calculateSimilarity(experience, keyword) : null;
  const hasThumbnail = Boolean(imageMeta.primaryImageUrl);

  return (
    <article className="border-b border-[#F0F0F0] bg-white px-[13px] pb-[11px] pt-[12px]">
      <div className="flex items-start gap-[10px]">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-[8px]">
            <div className="flex min-w-0 flex-wrap gap-[3px]">
              {tags.map((tag, index) => (
                <span
                  key={`${experience.id}-${tag}-${index}`}
                  className="rounded-[4px] px-[4px] py-[2px] text-[10px] font-[500] leading-[12px] tracking-[0px] text-white"
                  style={{ backgroundColor: tagPalette[Math.min(index, tagPalette.length - 1)] }}
                >
                  {tag}
                </span>
              ))}
            </div>
            {similarity !== null ? <SimilarityBadge score={similarity} /> : null}
          </div>

          <h2 className="mt-[9px] line-clamp-1 text-[14px] font-[600] leading-[16.8px] tracking-[0px] text-[#131416]">
            {experience.title}
          </h2>
          <p className="mt-[5px] line-clamp-2 text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949]">
            {preview}
          </p>

          <div className="mt-[19px] flex items-center justify-between gap-[12px]">
            <div className="flex min-w-0 flex-wrap items-center gap-[3px] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#BABABA]">
              <span className="truncate">{experience.author.nickname || '닉네임'}</span>
              <span>·</span>
              <span>{formatCompactDate(experience.createdAt)}</span>
              <span>·</span>
              <span>조회 {experience.viewCount.toLocaleString()}</span>
            </div>

            <div className="flex shrink-0 items-center gap-[2px] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#8A8A8A]">
              <img src={bookmarkIcon} alt="" className="h-[14px] w-[14px]" />
              <span>{experience.likeCount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {hasThumbnail ? (
          <div className="flex shrink-0 flex-col items-end gap-[10px] pt-[26px]">
            <ResultThumbnail count={imageMeta.imageCount} imageUrl={imageMeta.primaryImageUrl!} />
            {!showSimilarity ? <SuccessCta /> : null}
          </div>
        ) : !showSimilarity ? (
          <div className="flex shrink-0 items-end self-end pb-[1px]">
            <SuccessCta />
          </div>
        ) : null}
      </div>
    </article>
  );
}

function ExploreResultList({
  experiences,
  loading,
  error,
  keyword,
  showSimilarity,
}: {
  experiences: Experience[];
  loading: boolean;
  error: string;
  keyword: string;
  showSimilarity: boolean;
}) {
  if (loading) {
    return <ListSkeleton count={8} />;
  }

  if (error) {
    return (
      <div className="bg-white px-[16px] py-[12px]">
        <ErrorState message={error} />
      </div>
    );
  }

  if (experiences.length === 0) {
    return (
      <div className="bg-white px-[16px] py-[12px]">
        <PageMessage message="아직 등록된 사례가 없어요." />
      </div>
    );
  }

  return (
    <div className="bg-white">
      {experiences.map((experience) => (
        <Link key={experience.id} to={`/experiences/${experience.id}`} className="block">
          <ExploreCard experience={experience} keyword={keyword} showSimilarity={showSimilarity} />
        </Link>
      ))}
    </div>
  );
}

export default function Explore() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialKeyword = searchParams.get('q') ?? '';
  const initialTag = searchParams.get('tag');
  const initialCategoryId = initialTag ? Number(initialTag) : null;
  const [keyword, setKeyword] = useState(initialKeyword);
  const [draftKeyword, setDraftKeyword] = useState(initialKeyword);
  const [sort, setSort] = useState<SortKey>('latest');
  const [sortOption, setSortOption] = useState<SortOption>('latest');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<number | null>(
    Number.isFinite(initialCategoryId) ? initialCategoryId : null,
  );
  const [feedMode, setFeedMode] = useState<FeedMode>('all');
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadExperiences(keyword, sort, selectedTag);
  }, [keyword, sort, selectedTag]);

  useEffect(() => {
    if (error) {
      showToast(error);
    }
  }, [error, showToast]);

  useEffect(() => {
    setSort(sortOption === 'latest' ? 'latest' : 'popular');
  }, [sortOption]);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (keyword.trim()) {
      nextParams.set('q', keyword.trim());
    }
    if (selectedTag !== null) {
      nextParams.set('tag', String(selectedTag));
    }

    setSearchParams(nextParams, { replace: true });
  }, [keyword, selectedTag, setSearchParams]);

  async function loadExperiences(searchKeyword: string, sortKey: SortKey, categoryId: number | null) {
    setLoading(true);
    setError('');

    try {
      const payload = await getExperiences({
        page: 0,
        size: 999,
        q: searchKeyword.trim() || undefined,
        categoryId: categoryId ?? undefined,
        sort: sortKey,
      });
      setExperiences(payload.experiences);
      setTotalCount(payload.pagination.totalElements);
    } catch (loadError) {
      setError(resolveErrorMessage(loadError, '데이터를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'));
    } finally {
      setLoading(false);
    }
  }

  function submitKeyword(nextRawKeyword: string) {
    const nextKeyword = nextRawKeyword.trim();
    setKeyword(nextKeyword);
    setDraftKeyword(nextRawKeyword);
  }

  function handleDraftChange(value: string) {
    setDraftKeyword(value);
    if (!value.trim()) {
      setKeyword('');
    }
  }

  function toggleTag(tagValue: number | null) {
    setSelectedTag((current) => (current === tagValue ? null : tagValue));
  }

  function resetFilters() {
    setSelectedTag(null);
    setFeedMode('all');
    setSortOption('latest');
    setKeyword('');
    setDraftKeyword('');
    setSortMenuOpen(false);
  }

  function moveToCreate() {
    const token = getAccessToken();
    if (!token) {
      navigate(
        `/auth?next=${encodeURIComponent('/create')}&reason=${encodeURIComponent(
          '경험 작성은 로그인이 필요한 서비스입니다.',
        )}`,
      );
      return;
    }

    navigate('/create');
  }

  const filterTags = useMemo<FilterTagOption[]>(
    () => [{ label: '전체', value: null }, ...CATEGORY_VISUALS.map((item) => ({ label: item.label, value: item.id }))],
    [],
  );
  const filteredExperiences = useMemo(
    () => experiences.filter((experience) => matchesFeedMode(experience, feedMode)),
    [experiences, feedMode],
  );
  const sortedExperiences = useMemo(
    () => sortExperiences(filteredExperiences, sortOption),
    [filteredExperiences, sortOption],
  );
  const isSearching = keyword.trim().length > 0;
  const resultCountLabel = loading ? '불러오는 중' : `${selectedTag === null && !isSearching ? totalCount : sortedExperiences.length}개`;
  const sortLabel = SORT_OPTIONS.find((option) => option.key === sortOption)?.label ?? '최신순';

  return (
    <Layout
      title="사례 탐색"
      leftType="back"
      rightIcon="search"
      showStatusBar
      onBack={() => {
        if (window.history.length > 1) {
          navigate(-1);
          return;
        }
        navigate('/');
      }}
      onRightIconClick={() => {
        searchInputRef.current?.focus();
        if (draftKeyword.trim()) {
          submitKeyword(draftKeyword);
        }
      }}
    >
      <div className="bg-[#F8F8F8]">
        <section className="border-b border-[#F2F2F2] bg-white pb-[12px] pt-[12px]">
          <div className="px-[16px]">
            <SearchBar
              ref={searchInputRef}
              placeholder="검색어"
              value={draftKeyword}
              onChange={(event) => handleDraftChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  submitKeyword(draftKeyword);
                }
              }}
            />
          </div>

          <div className="mt-[12px] flex items-center gap-[8px] px-[16px]">
            <button
              type="button"
              onClick={resetFilters}
              className="flex h-[26px] w-[26px] items-center justify-center"
              aria-label="필터 초기화"
            >
              <img src={filterIcon} alt="" className="h-[22px] w-[22px]" />
            </button>

            <HorizontalScroll wrapperClassName="-mr-[16px] min-w-0 flex-1" contentClassName="gap-[5px] pr-[16px]">
              {filterTags.map((tag) => (
                <FilterTag
                  key={`${tag.value ?? 'all'}-${tag.label}`}
                  label={tag.label}
                  active={selectedTag === tag.value}
                  onClick={() => toggleTag(tag.value)}
                />
              ))}
            </HorizontalScroll>
          </div>

          <div className="mt-[10px] flex items-center justify-between px-[16px]">
            <span className="text-[12px] font-[400] leading-[17px] tracking-[0px] text-black">{resultCountLabel}</span>

            <div className="relative">
              <button
                type="button"
                onClick={() => setSortMenuOpen((current) => !current)}
                className="flex items-center gap-[2px] text-[12px] font-[400] leading-[17px] tracking-[0px] text-[#131416]"
                aria-expanded={sortMenuOpen}
              >
                <span>{sortLabel}</span>
                <img src={chevronDownIcon} alt="" className="h-[16px] w-[16px]" />
              </button>

              {sortMenuOpen ? (
                <div className="absolute right-0 top-[20px] z-20 rounded-[8px] bg-white px-[8px] py-[8px] shadow-[0_0_4px_rgba(0,0,0,0.15)]">
                  <div className="flex flex-col gap-[4px] text-[12px] leading-[17px]">
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => {
                          setSortOption(option.key);
                          setSortMenuOpen(false);
                        }}
                        className={`rounded-[6px] px-[8px] py-[6px] text-left ${
                          sortOption === option.key ? 'bg-[#F4F8F5] font-[600] text-[#375E49]' : 'text-[#5E5E5E]'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <ExploreResultList
          experiences={sortedExperiences}
          loading={loading}
          error={error}
          keyword={keyword}
          showSimilarity={isSearching}
        />

        <div className="pointer-events-none fixed bottom-[88px] left-1/2 z-40 flex w-full max-w-[430px] -translate-x-1/2 items-end justify-between px-[24px]">
          <div className="pointer-events-auto">
            <HelpFab onClick={() => navigate('/faq')} />
          </div>

          <div className="pointer-events-auto flex items-center gap-[12px]">
            <CaseSegment
              options={FEED_OPTIONS.map((option) => ({ key: option.key, label: option.label }))}
              activeKey={feedMode}
              onChange={(nextKey) => setFeedMode(nextKey as FeedMode)}
              className="bg-white p-[4px] shadow-[0_0_2px_rgba(0,0,0,0.15)]"
            />

            <button
              type="button"
              onClick={moveToCreate}
              className="flex h-[36px] w-[36px] items-center justify-center rounded-[999px] bg-[#5A876E] shadow-[0_10px_22px_rgba(90,135,110,0.3)]"
              aria-label="경험 작성"
            >
              <img src={plusIcon} alt="" className="h-[24px] w-[24px]" />
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
