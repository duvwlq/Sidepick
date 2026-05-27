import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import HorizontalScroll from '../components/common/HorizontalScroll';
import SearchBar from '../components/common/SearchBar';
import { ErrorState, ListSkeleton, PageMessage } from '../components/common/Skeleton';
import { useToast } from '../components/common/useToast';
import Layout from '../components/layout/Layout';
import { getExperiences, type Experience } from '../lib/api';
import { CATEGORY_TAG_LABELS, CATEGORY_VISUALS } from '../lib/category-visuals';
import { resolveErrorMessage } from '../lib/resolve-error-message';

type SortKey = 'latest' | 'popular';

type FilterTagOption = {
  label: string;
  value: number | null;
};

const RECENT_SEARCHES_KEY = 'sidepick.recentSearches';
const DEFAULT_RECOMMENDED_KEYWORDS = CATEGORY_TAG_LABELS.slice(0, 6);

function readRecentSearches() {
  const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
  if (!raw) {
    return ['온라인 판매', '콘텐츠 SNS 기반', '디지털 상품'];
  }

  try {
    const parsed = JSON.parse(raw) as string[];
    return parsed.filter(Boolean).slice(0, 6);
  } catch {
    return ['온라인 판매', '콘텐츠 SNS 기반', '디지털 상품'];
  }
}

function FilterIcon() {
  return (
    <svg aria-hidden="true" className="h-[26px] w-[26px]" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 7H9M15 7H20M12 5V9M4 17H13M17 17H20M15 15V19"
        stroke="#1F1F1F"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SortIcon() {
  return (
    <svg aria-hidden="true" className="h-[16px] w-[16px]" viewBox="0 0 24 24" fill="none">
      <path d="M8 7H18M8 12H15M8 17H12" stroke="#5E5E5E" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M5 6V18M5 18L3.5 16.5M5 18L6.5 16.5"
        stroke="#5E5E5E"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
      className={`flex h-[26px] shrink-0 items-center justify-center rounded-[999px] px-[12px] ${
        active ? 'bg-[#1F1F1F]' : 'bg-[#EEEEEE]'
      }`}
    >
      <span
        className={`whitespace-nowrap text-[12px] font-[500] leading-[14px] ${
          active ? 'text-white' : 'text-[#5E5E5E]'
        }`}
      >
        {label}
      </span>
    </button>
  );
}

function Chip({
  label,
  onClick,
  onRemove,
}: {
  label: string;
  onClick: () => void;
  onRemove?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[33px] shrink-0 items-center gap-[4px] rounded-[999px] px-[12px] py-[8px] ${
        onRemove ? 'border border-[#D8D8D8] bg-white' : 'bg-[#F8F8F8]'
      }`}
    >
      <span className="text-[14px] font-[400] leading-[16.8px] text-[#5E5E5E]">{label}</span>
      {onRemove ? (
        <span
          role="button"
          aria-label={`${label} 제거`}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          className="flex h-[16px] w-[16px] items-center justify-center text-[14px] leading-[14px] text-[#BABABA]"
        >
          ×
        </span>
      ) : null}
    </button>
  );
}

function formatDuration(months: number | null) {
  if (!months) {
    return '소요 시간 미상';
  }

  if (months >= 12 && months % 12 === 0) {
    return `${months / 12}년`;
  }

  return `${months}개월`;
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

function ExploreCard({ experience }: { experience: Experience }) {
  const tags = [experience.category.name, ...experience.failureReasons].filter(Boolean).slice(0, 3);

  return (
    <article className="border-b border-[#F3F3F3] bg-white px-[16px] py-[18px]">
      <div className="flex flex-wrap gap-[4px]">
        {tags.map((tag) => (
          <span
            key={`${experience.id}-${tag}`}
            className="rounded-[999px] bg-[#F3F3F3] px-[8px] py-[3px] text-[11px] font-[500] leading-[13px] text-[#5E5E5E]"
          >
            {tag}
          </span>
        ))}
      </div>

      <h2 className="mt-[8px] line-clamp-2 text-[18px] font-[600] leading-[25px] text-[#111111]">
        {experience.title}
      </h2>

      <div className="mt-[12px] grid grid-cols-2 gap-x-[8px] gap-y-[6px] text-[13px] font-[400] leading-[18px] text-[#8A8A8A]">
        <span>{formatDuration(experience.durationMonths)}</span>
        <span>{(experience.investmentAmount ?? 0).toLocaleString()}원</span>
        <span>조회 {experience.viewCount.toLocaleString()}</span>
        <span>{formatDate(experience.createdAt)}</span>
      </div>
    </article>
  );
}

function ExploreResultList({
  experiences,
  loading,
  error,
}: {
  experiences: Experience[];
  loading: boolean;
  error: string;
}) {
  if (loading) {
    return <ListSkeleton count={6} />;
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
        <PageMessage message="아직 등록된 사례가 없습니다." />
      </div>
    );
  }

  return (
    <div className="bg-white">
      {experiences.map((experience) => (
        <Link key={experience.id} to={`/experiences/${experience.id}`} className="block">
          <ExploreCard experience={experience} />
        </Link>
      ))}
    </div>
  );
}

export default function ExploreV3() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialKeyword = searchParams.get('q') ?? '';
  const initialTag = searchParams.get('tag');
  const initialMode = searchParams.get('mode') === 'search';
  const initialCategoryId = initialTag ? Number(initialTag) : null;
  const [keyword, setKeyword] = useState(initialKeyword);
  const [draftKeyword, setDraftKeyword] = useState(initialKeyword);
  const [sort, setSort] = useState<SortKey>('latest');
  const [selectedTag, setSelectedTag] = useState<number | null>(
    Number.isFinite(initialCategoryId) ? initialCategoryId : null,
  );
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(initialMode);
  const [recentKeywords, setRecentKeywords] = useState<string[]>(() => readRecentSearches());

  useEffect(() => {
    void loadExperiences(keyword, sort, selectedTag);
  }, [keyword, sort, selectedTag]);

  useEffect(() => {
    if (error) {
      showToast(error);
    }
  }, [error, showToast]);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (keyword.trim()) {
      nextParams.set('q', keyword.trim());
    }
    if (selectedTag !== null) {
      nextParams.set('tag', String(selectedTag));
    }
    if (isSearchMode) {
      nextParams.set('mode', 'search');
    }

    setSearchParams(nextParams, { replace: true });
  }, [keyword, selectedTag, isSearchMode, setSearchParams]);

  async function loadExperiences(searchKeyword: string, sortKey: SortKey, categoryId: number | null) {
    setLoading(true);
    setError('');

    try {
      const payload = await getExperiences({
        page: 0,
        size: 50,
        q: searchKeyword.trim() || undefined,
        categoryId: categoryId ?? undefined,
        sort: sortKey,
      });
      setExperiences(payload.experiences);
    } catch (loadError) {
      setError(resolveErrorMessage(loadError, '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'));
    } finally {
      setLoading(false);
    }
  }

  function persistRecentKeywords(nextKeywords: string[]) {
    setRecentKeywords(nextKeywords);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(nextKeywords));
  }

  function submitKeyword(rawKeyword: string) {
    const nextKeyword = rawKeyword.trim();
    setKeyword(nextKeyword);
    setDraftKeyword(nextKeyword);
    setIsSearchMode(false);

    if (!nextKeyword) {
      return;
    }

    const nextKeywords = [nextKeyword, ...recentKeywords.filter((item) => item !== nextKeyword)].slice(0, 6);
    persistRecentKeywords(nextKeywords);
  }

  function removeRecentKeyword(target: string) {
    persistRecentKeywords(recentKeywords.filter((item) => item !== target));
  }

  function toggleTag(tagValue: number | null) {
    setSelectedTag((current) => (current === tagValue ? null : tagValue));
  }

  const recommendedKeywords = useMemo(() => DEFAULT_RECOMMENDED_KEYWORDS, []);
  const filterTags = useMemo<FilterTagOption[]>(
    () => [{ label: '전체', value: null }, ...CATEGORY_VISUALS.map((item) => ({ label: item.label, value: item.id }))],
    [],
  );

  const activeFilters = useMemo(() => {
    const items: Array<{ key: 'q' | 'tag'; label: string }> = [];
    if (keyword.trim()) {
      items.push({ key: 'q', label: keyword.trim() });
    }
    if (selectedTag !== null) {
      const selectedCategory = CATEGORY_VISUALS.find((item) => item.id === selectedTag);
      if (selectedCategory) {
        items.push({ key: 'tag', label: selectedCategory.label });
      }
    }
    return items;
  }, [keyword, selectedTag]);

  const resultCountLabel = loading ? '불러오는 중' : `${experiences.length.toLocaleString()}개`;
  const sortLabel = sort === 'latest' ? '최신순' : '인기순';

  if (isSearchMode) {
    return (
      <Layout
        title="검색"
        leftType="back"
        rightIcon="none"
        onBack={() => {
          if (initialMode) {
            navigate(-1);
            return;
          }
          setIsSearchMode(false);
        }}
      >
        <div className="flex w-full flex-col items-center gap-[12px] bg-white pb-[24px]">
          <section className="flex w-full flex-col items-start bg-white px-[16px] py-[8px]">
            <SearchBar
              value={draftKeyword}
              onChange={(event) => setDraftKeyword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  submitKeyword(draftKeyword);
                }
              }}
            />
          </section>

          <section className="flex w-full flex-col items-start gap-[16px] px-[16px] py-[4px]">
            <div className="flex w-full items-center justify-between gap-[12px]">
              <h2 className="text-[16px] font-[600] leading-[19px] text-black">최근 검색어</h2>
              <button
                type="button"
                onClick={() => persistRecentKeywords([])}
                className="bg-transparent p-0 text-[12px] font-[400] leading-[14px] text-[#8A8A8A]"
              >
                전체 삭제
              </button>
            </div>

            <div className="flex w-full flex-wrap items-start gap-[6px]">
              {recentKeywords.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  onClick={() => submitKeyword(item)}
                  onRemove={() => removeRecentKeyword(item)}
                />
              ))}
            </div>
          </section>

          <section className="flex w-full flex-col items-start gap-[16px] px-[16px] py-[4px]">
            <h2 className="text-[16px] font-[600] leading-[19px] text-black">추천 키워드</h2>
            <div className="flex w-full flex-wrap items-start gap-[6px]">
              {recommendedKeywords.map((item) => (
                <Chip key={item} label={item} onClick={() => submitKeyword(item)} />
              ))}
            </div>
          </section>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="사례 탐색"
      leftType="back"
      rightIcon="search"
      onBack={() => navigate(-1)}
      onRightIconClick={() => setIsSearchMode(true)}
    >
      <div className="flex w-full flex-col bg-white">
        <section className="border-b border-[#F1F1F1] bg-white px-[16px] py-[12px]">
          <div className="flex items-start gap-[8px]">
            <button type="button" className="mt-[1px] flex h-[26px] w-[26px] shrink-0 items-center justify-center" aria-label="필터">
              <FilterIcon />
            </button>
            <HorizontalScroll wrapperClassName="-mr-[16px] min-w-0 flex-1" contentClassName="gap-[6px] pr-[16px]">
              {filterTags.map((tag) => (
                <FilterTag
                  key={tag.label}
                  label={tag.label}
                  active={selectedTag === tag.value}
                  onClick={() => toggleTag(tag.value)}
                />
              ))}
            </HorizontalScroll>
          </div>

          <div className="mt-[12px] flex items-center justify-between gap-[12px]">
            <div className="flex items-baseline gap-[2px]">
              <span className="text-[15px] font-[700] leading-[18px] text-[#111111]">
                {resultCountLabel.replace('개', '')}
              </span>
              <span className="text-[15px] font-[500] leading-[18px] text-[#111111]">
                {loading ? '' : '개'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setSort((current) => (current === 'latest' ? 'popular' : 'latest'))}
              className="flex items-center gap-[4px] text-[13px] font-[500] leading-[16px] text-[#5E5E5E]"
            >
              <SortIcon />
              <span>{sortLabel}</span>
            </button>
          </div>

          {activeFilters.length ? (
            <div className="mt-[12px] flex flex-wrap gap-[6px]">
              {activeFilters.map((item) => (
                <Chip
                  key={`${item.key}-${item.label}`}
                  label={item.label}
                  onClick={() => undefined}
                  onRemove={
                    item.key === 'q'
                      ? () => {
                          setKeyword('');
                          setDraftKeyword('');
                        }
                      : () => setSelectedTag(null)
                  }
                />
              ))}
              <button
                type="button"
                onClick={() => {
                  setKeyword('');
                  setDraftKeyword('');
                  setSelectedTag(null);
                }}
                className="flex min-h-[33px] items-center justify-center rounded-[999px] bg-[#F5F5F5] px-[12px] py-[8px] text-[13px] font-[500] leading-[16px] text-[#7A7A7A]"
              >
                초기화
              </button>
            </div>
          ) : null}
        </section>

        <ExploreResultList experiences={experiences} loading={loading} error={error} />
      </div>
    </Layout>
  );
}
