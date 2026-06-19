import { X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import arrowLeftIcon from '../assets/auth-figma/arrow-left.svg';
import batteryFrameIcon from '../assets/auth-figma/battery-frame.svg';
import cellularConnectionIcon from '../assets/auth-figma/cellular-connection.svg';
import wifiIcon from '../assets/auth-figma/wifi.svg';
import searchIcon from '../assets/home-v1-figma/icons/search-figma.svg';
import { KeywordChip } from '../components/common/Chip';
import BottomNav from '../components/layout/BottomNav';
import {
  clearRecentExploreSearches,
  readRecentExploreSearches,
  removeRecentExploreSearch,
  saveRecentExploreSearch,
  type RecentExploreSearch,
} from '../lib/recent-explore-searches';

const SEARCH_PLACEHOLDER = '원하는 사례를 검색해보세요!';
const FIXTURE_RECENT_SEARCHES = ['유튜브', '쇼핑몰', '블로그'];
const FIXTURE_RECOMMENDED_KEYWORDS = [
  '온라인 판매',
  '스마트스토어',
  '유튜브',
  '블로그',
  '디자인',
  '배달',
  '주식',
  '전자책',
  '프리랜서',
];

function StatusBar() {
  return (
    <div className="flex h-[59px] w-full items-center px-[24px] pb-[19px] pt-[21px]">
      <div className="flex h-[22px] min-w-0 flex-1 items-center">
        <span className="font-['SF_Pro'] text-[17px] font-[590] leading-[22px] tracking-[0px] text-black">9:41</span>
      </div>
      <div className="flex h-[22px] min-w-0 flex-1 items-center justify-end gap-[7px] pr-[1px] pt-[1px]">
        <img src={cellularConnectionIcon} alt="" className="h-[12.226px] w-[19.2px] shrink-0" />
        <img src={wifiIcon} alt="" className="h-[12.328px] w-[17.142px] shrink-0" />
        <img src={batteryFrameIcon} alt="" className="h-[13px] w-[27.328px] shrink-0" />
      </div>
    </div>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex h-[64px] items-center bg-white px-[16px] py-[20px]">
      <button
        type="button"
        onClick={onBack}
        className="flex h-[24px] w-[24px] items-center justify-center"
        aria-label="뒤로가기"
      >
        <img src={arrowLeftIcon} alt="" className="h-[24px] w-[24px]" />
      </button>

      <div className="flex flex-1 items-center justify-center font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-black">
        검색
      </div>

      <div className="h-[24px] w-[24px]" aria-hidden="true" />
    </div>
  );
}

function SearchInput({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="bg-white px-[16px]">
      <label className="relative block h-[36px] w-full cursor-text">
        <span className="absolute inset-0 flex items-center justify-between rounded-[999px] border border-[#EEEEEE] bg-[#F8F8F8] px-[16px] py-[8px]">
          {!value ? (
            <span className="translate-y-[0.3px] font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] tracking-[0px] text-[#BABABA]">
              {SEARCH_PLACEHOLDER}
            </span>
          ) : null}
          <img src={searchIcon} alt="" className="ml-auto h-[20px] w-[20px] shrink-0 opacity-70" />
        </span>
        <input
          autoFocus
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onSubmit();
            }
          }}
          aria-label="검색어 입력"
          className="absolute inset-0 h-full w-full rounded-[999px] bg-transparent px-[16px] pr-[44px] font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] tracking-[0px] text-[#131416] outline-none"
        />
      </label>
    </div>
  );
}

function RecentSearchChip({
  label,
  onClick,
  onRemove,
}: {
  label: string;
  onClick: () => void;
  onRemove: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="inline-flex">
      <KeywordChip
        label={label}
        tone="secondary"
        className="h-[26px] px-[10px] py-[6px] text-[12px] font-[400] leading-[14.4px]"
        trailing={
          <span
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onRemove();
            }}
            className="inline-flex h-[8px] w-[8px] items-center justify-center text-[#C8C8C8]"
            aria-hidden="true"
          >
            <X size={8} strokeWidth={2} />
          </span>
        }
      />
    </button>
  );
}

function RecommendedChip({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="inline-flex">
      <KeywordChip label={label} tone="primary" className="h-[26px] px-[10px] py-[6px] text-[12px] font-[400] leading-[14.4px]" />
    </button>
  );
}

function toRecentSearchLabel(item: RecentExploreSearch) {
  if (item.query.trim()) {
    return item.query.trim();
  }
  if (item.tags.length > 0) {
    return item.tags[0];
  }
  return '검색어';
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<RecentExploreSearch[]>(() => readRecentExploreSearches());

  const recentLabels = useMemo(() => {
    if (recentSearches.length === 0) {
      return FIXTURE_RECENT_SEARCHES;
    }
    return recentSearches.slice(0, 3).map(toRecentSearchLabel);
  }, [recentSearches]);

  function submitSearch(nextQuery: string) {
    const normalized = nextQuery.trim();
    if (!normalized) {
      return;
    }

    saveRecentExploreSearch({
      query: normalized,
      tags: [],
      current: readRecentExploreSearches(),
    });
    setRecentSearches(readRecentExploreSearches());
    navigate(`/explore?q=${encodeURIComponent(normalized)}&mode=search`);
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto min-h-screen w-full max-w-[375px] bg-white pb-[136px]">
        <StatusBar />
        <Header
          onBack={() => {
            if (window.history.length > 1) {
              navigate(-1);
              return;
            }
            navigate('/explore');
          }}
        />

        <SearchInput value={query} onChange={setQuery} onSubmit={() => submitSearch(query)} />

        <main className="flex flex-col gap-[0px] pt-[16px]">
          <section className="px-[16px] py-[20px]">
            <div className="flex items-center justify-between">
              <h2 className="font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-black">
                최근 검색어
              </h2>
              <button
                type="button"
                onClick={() => {
                  setRecentSearches(clearRecentExploreSearches());
                }}
                className="translate-y-[0.25px] font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#8A8A8A]"
              >
                전체 삭제
              </button>
            </div>

            <div className="flex flex-wrap gap-[6px] pt-[14px]">
              {recentLabels.map((label, index) => {
                const recentItem = recentSearches[index];
                return (
                  <RecentSearchChip
                    key={`${label}-${index}`}
                    label={label}
                    onClick={() => submitSearch(recentItem ? toRecentSearchLabel(recentItem) : label)}
                    onRemove={() => {
                      if (!recentItem) {
                        return;
                      }
                      setRecentSearches(removeRecentExploreSearch({ id: recentItem.id, current: recentSearches }));
                    }}
                  />
                );
              })}
            </div>
          </section>

          <section className="px-[16px] py-[20px]">
            <h2 className="font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-black">
              추천 키워드
            </h2>

            <div className="flex flex-wrap gap-[6px] pt-[14px]">
              {FIXTURE_RECOMMENDED_KEYWORDS.map((keyword) => (
                <RecommendedChip key={keyword} label={keyword} onClick={() => submitSearch(keyword)} />
              ))}
            </div>
          </section>
        </main>

        <BottomNav active="explore" />
      </div>
    </div>
  );
}
