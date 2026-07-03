import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CardList from '../components/common/CardList';
import HorizontalScroll from '../components/common/HorizontalScroll';
import SearchBar from '../components/common/SearchBar';
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
    <svg aria-hidden="true" className="h-[24px] w-[24px]" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 7H9M15 7H20M12 5V9M4 17H13M17 17H20M15 15V19"
        stroke="#1F1F1F"
        strokeWidth="1.6"
        strokeLinecap="round"
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
      className={`flex shrink-0 appearance-none flex-col items-center justify-center rounded-[999px] px-[10px] py-[4px] ${
        active ? 'border border-[#1F1F1F] bg-[#1F1F1F]' : 'border-0 bg-[#EEEEEE]'
      }`}
    >
      <span
        className={`whitespace-nowrap text-center font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] ${
          active ? 'text-[#FFFFFF]' : 'text-[#757575]'
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
      className={`flex min-h-[33px] shrink-0 appearance-none items-center justify-center gap-[2px] rounded-[999px] px-[12px] py-[8px] ${
        onRemove ? 'border border-[#D8D8D8] bg-[#FFFFFF]' : 'border-0 bg-[#F8F8F8]'
      }`}
    >
      <span className="whitespace-nowrap font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] text-[#5E5E5E]">
        {label}
      </span>
      {onRemove ? (
        <span
          role="button"
          aria-label={`${label} 최근 검색어 제거`}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          className="flex h-[16px] w-[16px] items-center justify-center text-[16px] leading-[16px] text-[#BABABA]"
        >
          ×
        </span>
      ) : null}
    </button>
  );
}

export default function Explore() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialKeyword = searchParams.get('q') ?? '';
  const initialTag = searchParams.get('tag');
  const initialMode = searchParams.get('mode') === 'search';
  const initialCategoryId = initialTag ? Number(initialTag) : null;
  const [keyword, setKeyword] = useState(initialKeyword);
  const [draftKeyword, setDraftKeyword] = useState(initialKeyword);
  const [sort] = useState<SortKey>('latest');
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

    setSearchParams(nextParams, { replace: true });
  }, [keyword, selectedTag, setSearchParams]);

  async function loadExperiences(
    searchKeyword: string,
    sortKey: SortKey,
    categoryId: number | null,
  ) {
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
    () => [
      { label: '전체', value: null },
      ...CATEGORY_VISUALS.map((item) => ({ label: item.label, value: item.id })),
    ],
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
        <div className="flex w-full flex-col items-center gap-[12px] bg-[#FFFFFF]">
          <section className="flex w-full flex-col items-start bg-[#FFFFFF] px-[16px]">
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

          <section className="flex w-full flex-col items-start gap-[16px] p-[16px]">
            <div className="flex w-full items-center justify-between gap-[12px]">
              <h2 className="font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] text-[#000000]">
                최근 검색어
              </h2>
              <button
                type="button"
                onClick={() => persistRecentKeywords([])}
                className="border-0 bg-transparent p-[0px] font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] text-[#8A8A8A]"
              >
                전체 삭제
              </button>
            </div>

            <div className="flex w-full flex-wrap items-start gap-[4px]">
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

          <section className="flex w-full flex-col items-start gap-[16px] p-[16px]">
            <h2 className="font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] text-[#000000]">
              추천 키워드
            </h2>
            <div className="flex w-full flex-wrap content-start items-start gap-[4px]">
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
      title="경험 탐색"
      leftType="back"
      rightIcon="search"
      onBack={() => navigate(-1)}
      onRightIconClick={() => setIsSearchMode(true)}
    >
      <div className="flex w-full flex-col gap-[2px] bg-[#EEEEEE]">
        <section className="flex h-[44px] w-full items-center gap-[8px] bg-[#FFFFFF] px-[16px] py-[10px]">
          <button
            type="button"
            className="relative block h-[24px] w-[24px] shrink-0 appearance-none border-0 bg-transparent p-[0px]"
            aria-label="필터 열기"
          >
            <FilterIcon />
          </button>
          <HorizontalScroll
            wrapperClassName="-mr-[16px] min-w-0 flex-1"
            contentClassName="horizontal-scroll-content--tags pr-[16px]"
          >
            {filterTags.map((tag) => (
              <FilterTag
                key={tag.label}
                label={tag.label}
                active={selectedTag === tag.value}
                onClick={() => toggleTag(tag.value)}
              />
            ))}
          </HorizontalScroll>
        </section>

        <section className="flex w-full flex-col gap-[12px] bg-[#FFFFFF] px-[16px] py-[14px]">
          <div className="flex flex-wrap items-start justify-between gap-[12px]">
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="font-['Pretendard'] text-[15px] font-[600] leading-[18px] text-[#111111]">
                {loading ? '경험을 불러오는 중' : '경험 탐색'}
              </p>
              <p className="mt-[4px] break-words font-['Pretendard'] text-[12px] font-[400] leading-[16px] text-[#7A7A7A]">
                {activeFilters.length
                  ? '선택한 조건에 맞는 경험만 모아보고 있어요.'
                  : '태그와 검색어로 원하는 실패 경험을 빠르게 찾아보세요.'}
              </p>
            </div>

            {activeFilters.length ? (
              <button
                type="button"
                onClick={() => {
                  setKeyword('');
                  setDraftKeyword('');
                  setSelectedTag(null);
                }}
                className="rounded-[999px] bg-[#F3F3F3] px-[10px] py-[6px] font-['Pretendard'] text-[12px] font-[500] leading-[14px] text-[#5E5E5E]"
              >
                필터 초기화
              </button>
            ) : null}
          </div>

          {activeFilters.length ? (
            <div className="flex flex-wrap gap-[6px]">
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
            </div>
          ) : null}
        </section>

        <CardList experiences={experiences} loading={loading} error={error} />
      </div>
    </Layout>
  );
}
