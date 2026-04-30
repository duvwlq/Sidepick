import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/common/SearchBar';
import CardList from '../components/common/CardList';
import Layout from '../components/layout/Layout';
import { getExperiences, type Experience } from '../lib/api';

type SortKey = 'latest' | 'popular';

const RECENT_SEARCHES_KEY = 'sidepick.recentSearches';
const DEFAULT_RECOMMENDED_KEYWORDS = [
  '온라인 사업',
  '마케팅',
  '투자금',
  '브랜딩',
  '광고',
  'SNS 광고',
];
const FILTER_TAGS = ['tag', 'tag', 'tag', 'tag', 'tag', 'tag', 'tag', 'tag'];

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

function FilterIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[24px] w-[24px]"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 7H9M15 7H20M12 5V9M4 17H13M17 17H20M15 15V19"
        stroke="#1F1F1F"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FilterTag({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="flex shrink-0 appearance-none flex-col items-center justify-center rounded-[999px] border-0 bg-[#EEEEEE] px-[10px] py-[4px]"
    >
      <span className="whitespace-nowrap text-center font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#757575] [font-feature-settings:'case'_1]">
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
      className={`flex h-[33px] shrink-0 appearance-none items-center justify-center gap-[2px] rounded-[999px] px-[12px] py-[8px] ${
        onRemove
          ? 'border-[1px] border-solid border-[#D8D8D8] bg-[#FFFFFF]'
          : 'border-0 bg-[#F8F8F8]'
      }`}
    >
      <span className="whitespace-nowrap font-['Pretendard'] text-[14px] font-[400] leading-[1.2] tracking-[0px] text-[#5E5E5E] [font-feature-settings:'case'_1]">
        {label}
      </span>
      {onRemove ? (
        <span
          role="button"
          aria-label={`${label} 삭제`}
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
  const [keyword, setKeyword] = useState('');
  const [draftKeyword, setDraftKeyword] = useState('');
  const [sort] = useState<SortKey>('latest');
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

    const nextKeywords = [
      nextKeyword,
      ...recentKeywords.filter((item) => item !== nextKeyword),
    ].slice(0, 6);
    persistRecentKeywords(nextKeywords);
  }

  function removeRecentKeyword(target: string) {
    persistRecentKeywords(recentKeywords.filter((item) => item !== target));
  }

  const recommendedKeywords = useMemo(() => DEFAULT_RECOMMENDED_KEYWORDS, []);

  if (isSearchMode) {
    return (
      <Layout
        title="검색"
        leftType="back"
        rightIcon="bell"
        onBack={() => setIsSearchMode(false)}
      >
        <div className="flex w-full flex-col items-center gap-[12px] bg-[#FFFFFF]">
          <section className="flex w-full flex-col items-start bg-[#FFFFFF] px-[16px]">
            <SearchBar
              value={draftKeyword}
              onChange={(event) => setDraftKeyword(event.target.value)}
              onClick={() => undefined}
            />
          </section>

          <section className="flex w-full flex-col items-start gap-[16px] p-[16px]">
            <div className="flex w-full items-center justify-between whitespace-nowrap leading-[0]">
              <div className="flex shrink-0 flex-col justify-center overflow-hidden text-ellipsis font-['Pretendard'] text-[16px] font-[600] tracking-[0px] text-[#000000] [font-feature-settings:'case'_1]">
                <h2 className="overflow-hidden text-ellipsis leading-[1.2]">최근 검색어</h2>
              </div>
              <button
                type="button"
                onClick={() => persistRecentKeywords([])}
                className="flex shrink-0 flex-col justify-center overflow-hidden border-0 bg-transparent p-[0px] text-ellipsis font-['Pretendard'] text-[12px] font-[400] tracking-[0px] text-[#8A8A8A] [font-feature-settings:'case'_1]"
              >
                <span className="overflow-hidden text-ellipsis leading-[1.2]">전체 삭제</span>
              </button>
            </div>

            <div className="flex items-start gap-[4px]">
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
            <div className="flex w-full items-center">
              <div className="flex shrink-0 flex-col justify-center overflow-hidden text-ellipsis whitespace-nowrap font-['Pretendard'] text-[16px] font-[600] tracking-[0px] text-[#000000] [font-feature-settings:'case'_1]">
                <h2 className="overflow-hidden text-ellipsis leading-[1.2]">추천 키워드</h2>
              </div>
            </div>
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
      title="사례 탐색"
      leftType="back"
      rightIcon="search"
      onBack={() => navigate(-1)}
      onRightIconClick={() => setIsSearchMode(true)}
    >
      <div className="flex w-full flex-col gap-[2px] bg-[#EEEEEE]">
        <section className="flex h-[44px] w-full cursor-pointer items-center gap-[8px] bg-[#FFFFFF] px-[16px] py-[10px]">
          <button
            type="button"
            className="relative block h-[24px] w-[24px] shrink-0 appearance-none border-0 bg-transparent p-[0px]"
            aria-label="필터 열기"
          >
            <FilterIcon />
          </button>
          <div className="-mr-[16px] flex min-w-0 flex-1 items-center gap-[8px] overflow-x-auto pr-[16px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTER_TAGS.map((tag, index) => (
              <FilterTag key={`${tag}-${index}`} label={tag} />
            ))}
          </div>
        </section>

        <CardList experiences={experiences} loading={loading} error={error} />
      </div>
    </Layout>
  );
}
