import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/common/SearchBar';
import CardList from '../components/common/CardList';
import Layout from '../components/layout/Layout';
import { getExperiences, type Experience } from '../lib/api';

type SortKey = 'latest' | 'popular';

const RECENT_SEARCHES_KEY = 'sidepick.recentSearches';
const DEFAULT_RECOMMENDED_KEYWORDS = [
  '온라인 쇼핑몰',
  '마케팅',
  '투자금',
  '브랜딩',
  '재고',
  'SNS 광고',
];

function readRecentSearches() {
  const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
  if (!raw) {
    return ['부업', '스마트스토어', '카페 창업'];
  }

  try {
    const parsed = JSON.parse(raw) as string[];
    return parsed.filter(Boolean).slice(0, 6);
  } catch {
    return ['부업', '스마트스토어', '카페 창업'];
  }
}

export default function Explore() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [draftKeyword, setDraftKeyword] = useState('');
  const [sort, setSort] = useState<SortKey>('latest');
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [recentKeywords, setRecentKeywords] = useState<string[]>(() =>
    readRecentSearches(),
  );

  useEffect(() => {
    void loadExperiences(keyword, sort);
  }, [keyword, sort]);

  async function loadExperiences(searchKeyword: string, sortKey: SortKey) {
    setLoading(true);
    setError('');

    try {
      const payload = await getExperiences({
        page: 0,
        size: 50,
        q: searchKeyword.trim() || undefined,
        sort: sortKey,
      });
      setExperiences(payload.experiences);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : '사례 목록을 불러오지 못했습니다.',
      );
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

  const categoryChips = useMemo(
    () => ['전체', '온라인 사업', '서비스업', '요식업', 'IT·개발'],
    [],
  );

  if (isSearchMode) {
    return (
      <Layout
        title="검색"
        leftType="back"
        rightIcon="none"
        onBack={() => setIsSearchMode(false)}
      >
        <div className="space-y-7 px-4 pt-4 pb-6">
          <SearchBar
            value={draftKeyword}
            onChange={(event) => setDraftKeyword(event.target.value)}
            className="h-14 rounded-[18px]"
          />

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#222222]">최근 검색어</h2>
              <button
                type="button"
                onClick={() => persistRecentKeywords([])}
                className="text-xs text-[#8B8F96]"
              >
                전체 삭제
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {recentKeywords.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => submitKeyword(item)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#F2F3F5] px-4 py-2 text-sm text-[#4E5661]"
                >
                  <span>{item}</span>
                  <span
                    role="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      removeRecentKeyword(item);
                    }}
                    className="text-[#A0A6AF]"
                  >
                    ×
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-[#222222]">추천 키워드</h2>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_RECOMMENDED_KEYWORDS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => submitKeyword(item)}
                  className="rounded-full bg-[#F4F5F7] px-4 py-2 text-sm text-[#606873]"
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          <button
            type="button"
            onClick={() => submitKeyword(draftKeyword)}
            className="h-14 w-full rounded-[18px] bg-[#111111] text-base font-semibold text-white"
          >
            검색하기
          </button>
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
      <div className="space-y-4 bg-[#F3F4F6] pb-6">
        <section className="space-y-3 bg-white px-4 pt-4 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              className="flex h-10 min-w-10 items-center justify-center rounded-full border border-[#E3E5E8] bg-white text-[#5D6570]"
            >
              ≡
            </button>
            {categoryChips.map((item, index) => (
              <button
                key={item}
                type="button"
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${
                  index === 0
                    ? 'bg-[#111111] text-white'
                    : 'border border-[#E3E5E8] bg-white text-[#606873]'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <SearchBar
            value={keyword}
            readOnly
            onClick={() => setIsSearchMode(true)}
          />

          <div className="flex gap-2">
            <SortButton
              active={sort === 'latest'}
              onClick={() => setSort('latest')}
              label="최신순"
            />
            <SortButton
              active={sort === 'popular'}
              onClick={() => setSort('popular')}
              label="인기순"
            />
          </div>
        </section>

        <CardList experiences={experiences} loading={loading} error={error} />
      </div>
    </Layout>
  );
}

function SortButton({
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
      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
        active ? 'bg-[#111111] text-white' : 'bg-[#E7EAEE] text-[#5F6670]'
      }`}
    >
      {label}
    </button>
  );
}
