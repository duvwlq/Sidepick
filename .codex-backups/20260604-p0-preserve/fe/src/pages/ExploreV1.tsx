import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import arrowLeftIcon from '../assets/auth-figma/arrow-left.svg';
import batteryFrameIcon from '../assets/auth-figma/battery-frame.svg';
import cellularConnectionIcon from '../assets/auth-figma/cellular-connection.svg';
import wifiIcon from '../assets/auth-figma/wifi.svg';
import chevronDownIcon from '../assets/explore-figma/chevron-down.svg';
import editIcon from '../assets/explore-figma/edit.svg';
import filterIcon from '../assets/explore-figma/filter.svg';
import guideIcon from '../assets/home-v1-figma/icons/guide-figma.svg';
import homeIcon from '../assets/home-v1-figma/icons/home-figma.svg';
import plusIcon from '../assets/home-v1-figma/icons/plus-figma.svg';
import searchIcon from '../assets/home-v1-figma/icons/search-figma.svg';
import searchNavIcon from '../assets/home-v1-figma/icons/search-nav-figma.svg';
import userIcon from '../assets/home-v1-figma/icons/user-figma.svg';
import { ErrorState, ListSkeleton, PageMessage } from '../components/common/Skeleton';
import { useToast } from '../components/common/useToast';
import {
  bookmarkExperience,
  getBookmarkStatus,
  getExperiences,
  type Experience,
  unbookmarkExperience,
} from '../lib/api';
import { publishBookmarkSync } from '../lib/bookmark-sync';
import { getExperienceImageMeta } from '../lib/experience-images';
import { resolveErrorMessage } from '../lib/resolve-error-message';
import { getAccessToken } from '../lib/session';

type SortKey = 'latest' | 'popular';
type SortOption = 'latest' | 'likes' | 'views';
type FeedMode = 'all' | 'failure' | 'success';

type ExploreCategory = {
  id: number | null;
  label: string;
};

const EXPLORE_CATEGORIES: ExploreCategory[] = [
  { id: null, label: '전체' },
  { id: 1, label: '온라인 판매·이커머스' },
  { id: 2, label: '콘텐츠·SNS 기반' },
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

function StatusBarV1() {
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
        <img src={searchIcon} alt="" className="h-[24px] w-[24px]" />
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
        className="flex h-[26px] w-[26px] shrink-0 items-center justify-center"
        aria-label="카테고리 초기화"
      >
        <img src={filterIcon} alt="" className="h-[26px] w-[26px]" />
      </button>

      <div className="horizontal-scroll-wrapper min-w-0 flex-1">
        <div className="horizontal-scroll pr-[16px] pb-[2px]">
          <div className="horizontal-scroll-content gap-[6px]">
            {EXPLORE_CATEGORIES.map((category) => {
              const active =
                (selectedCategoryId === null && category.id === null) || selectedCategoryId === category.id;
              return (
                <button
                  key={String(category.id)}
                  type="button"
                  onClick={() => onSelect(category.id)}
                  className={`flex h-[26px] shrink-0 items-center justify-center rounded-[999px] px-[10px] py-[6px] font-['Pretendard'] text-[12px] font-[500] leading-[14.4px] tracking-[0px] ${
                    active
                      ? 'bg-[#5A876E] text-white'
                      : 'border border-[#EEEEEE] bg-white text-[#5A876E]'
                  }`}
                >
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
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
        className="flex h-[17px] items-center gap-[0px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#131416]"
      >
        <span>{active.label}</span>
        <img src={chevronDownIcon} alt="" className={`h-[17px] w-[17px] transition-transform ${open ? 'rotate-180' : ''}`} />
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

function ExploreSegmentButton({
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
      className={`flex h-[38px] w-[45px] items-center justify-center rounded-[999px] transition-all duration-150 ${
        active ? 'bg-[#375E49] shadow-[0_0_2px_rgba(0,0,0,0.15)]' : 'bg-transparent'
      }`}
    >
      <span
        className={`font-['Pretendard'] text-[12px] leading-[14.4px] tracking-[0px] ${
          active ? 'font-[400] text-white' : 'font-[400] text-[#131416]'
        }`}
      >
        {label}
      </span>
    </button>
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
    <div className="fixed bottom-[84px] left-1/2 z-30 flex h-[70px] w-full max-w-[375px] -translate-x-1/2 items-start justify-center px-[24px] pt-[15px]">
      {basicMode ? <div className="absolute left-[24px] top-[15px] h-[36px] w-[36px]" aria-hidden="true" /> : null}

      <div className="flex h-[38px] w-[135px] items-center rounded-[999px] bg-white p-[2px] shadow-[0_0_2px_rgba(0,0,0,0.15)]">
        {FEED_OPTIONS.map((option) => (
          <ExploreSegmentButton
            key={option.key}
            active={feedMode === option.key}
            label={option.label}
            onClick={() => onFeedChange(option.key)}
          />
        ))}
      </div>

      <div className="absolute right-[24px] top-[15px] h-[36px] w-[122px]">
        {expanded ? (
          <button
            type="button"
            onClick={onCreateClick}
            className="absolute right-0 top-[-49px] flex h-[41px] min-w-[122px] items-center gap-[8px] rounded-[10px] bg-white px-[10px] py-[12px] shadow-[0_0_4px_rgba(0,0,0,0.15)]"
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
          className={`absolute right-0 top-0 flex h-[36px] w-[36px] items-center justify-center rounded-full ${
            expanded ? 'bg-[#A8D3BD]' : 'bg-[#5A876E] shadow-[0_8px_16px_rgba(90,135,110,0.24)]'
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
  );
}

function BottomNavV1() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = getAccessToken();

  function move(path: string, requiresAuth?: boolean) {
    if (!token && requiresAuth) {
      navigate(
        `/auth?next=${encodeURIComponent(path)}&reason=${encodeURIComponent('마이페이지는 로그인이 필요한 서비스입니다.')}`,
      );
      return;
    }
    navigate(path);
  }

  const menus = [
    {
      label: '홈',
      path: '/',
      icon: homeIcon,
      iconClassName: 'translate-y-[0.5px] h-[22px] w-[20px]',
      active: location.pathname === '/' || location.pathname === '/v1/home',
    },
    {
      label: '탐색',
      path: '/explore',
      icon: searchNavIcon,
      iconClassName: 'translate-y-[1px] h-[20px] w-[20px]',
      active: location.pathname.startsWith('/explore') || location.pathname.startsWith('/v1/explore'),
    },
    {
      label: '가이드',
      path: '/faq',
      icon: guideIcon,
      iconClassName: 'translate-y-[0.5px] h-[22px] w-[18px]',
      active: location.pathname === '/faq' || location.pathname === '/mypage/faq',
    },
    {
      label: 'MY',
      path: '/mypage',
      icon: userIcon,
      iconClassName: 'translate-y-[1px] h-[20px] w-[18px]',
      active: location.pathname.startsWith('/mypage') && location.pathname !== '/mypage/faq',
      requiresAuth: true,
    },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-[375px] -translate-x-1/2">
      <nav className="flex h-[84px] items-start justify-between rounded-t-[20px] bg-white px-[30px] pb-[22px] pt-[12px] shadow-[0_0_5px_rgba(0,0,0,0.15)]">
        {menus.map((menu) => (
          <button
            key={menu.path}
            type="button"
            onClick={() => move(menu.path, menu.requiresAuth)}
            className="flex h-[40px] min-w-[50px] flex-col items-center justify-start gap-[2px] rounded-[10px] transition-opacity duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A876E]/25 active:opacity-70"
            aria-current={menu.active ? 'page' : undefined}
          >
            <img src={menu.icon} alt="" className={menu.iconClassName} />
            <span
              className={`translate-y-[0.5px] font-['Pretendard'] text-[12px] leading-[12px] tracking-[0px] ${
                menu.active ? 'font-[600] text-[#131416]' : 'font-[400] text-[#BABABA]'
              }`}
            >
              {menu.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function ExploreCardV1({
  experience,
  bookmarked,
  onBookmarkToggle,
  onSuccessClick,
}: {
  experience: Experience;
  bookmarked: boolean;
  onBookmarkToggle: (experience: Experience) => void;
  onSuccessClick: (experience: Experience) => void;
}) {
  const imageMeta = getExperienceImageMeta(experience);
  const tags = buildCardTags(experience);
  const isSuccess = experience.caseStatus === 'SUCCESS';
  const hasImage = Boolean(imageMeta.primaryImageUrl);
  const safeTitle = sanitizeDisplayText(experience.title, `${experience.category.name} 사례`);
  const safePreview = sanitizeDisplayText(
    experience.content.replace(/!\[[^\]]*]\(([^)]+)\)/g, '').replace(/\s+/g, ' ').trim(),
    '본문 미리보기를 준비 중입니다.',
  );
  const safeNickname = sanitizeDisplayText(experience.author.nickname, '닉네임');

  const cardHeightClass = hasImage ? 'h-[135px]' : 'h-[173px]';

  const content = (
    <article
      className={`flex w-full flex-col bg-white px-[16px] py-[12px] ${cardHeightClass}`}
    >
      <div className="flex w-full items-start justify-between gap-[8px]">
        <div className="flex min-w-0 flex-wrap gap-[4px] max-w-full">
          {tags.map((tag, index) => (
            <span
              key={`${experience.id}-${tag}-${index}`}
              className={`inline-flex h-[18px] items-center justify-center rounded-[4px] px-[4px] py-[2px] font-['Pretendard'] text-[12px] leading-[14.4px] tracking-[0px] ${
                index === 0
                  ? `${isSuccess ? 'bg-[#5A876E]' : 'bg-[#C06D43]'} font-[400] text-white`
                  : index === 1
                    ? 'bg-[#CBE5D8] font-[500] text-[#5A876E]'
                    : 'bg-[#D8D8D8] font-[400] text-white'
              }`}
            >
              <span
                className={`truncate ${
                  index === 0 ? 'max-w-[40px]' : index === 1 ? 'max-w-[116px]' : 'max-w-[78px]'
                }`}
              >
                {tag}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="flex h-[60px] w-full items-start gap-[8px] pt-[8px]">
        {hasImage ? (
          <div className="h-[60px] w-[80px] shrink-0 overflow-hidden rounded-[4px] bg-[#A8A8A8]">
            <img src={imageMeta.primaryImageUrl} alt="" className="h-full w-full object-cover" />
          </div>
        ) : null}

        <div className={`flex min-w-0 flex-1 flex-col ${hasImage ? 'gap-[4px]' : 'gap-[4px]'}`}>
          <h3
            className={`font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] tracking-[0px] text-[#131416] ${
              hasImage ? 'line-clamp-2' : 'line-clamp-1'
            }`}
          >
            {safeTitle}
          </h3>
          <p
            className={`font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949] ${
              hasImage ? 'line-clamp-1' : 'line-clamp-1'
            }`}
          >
            {safePreview}
          </p>
        </div>
      </div>

      <div className={`mt-auto flex w-full flex-col ${hasImage ? 'pt-[8px]' : 'pt-[12px]'}`}>
        <div className="flex w-full items-center justify-between">
          <div className="translate-y-[0.25px] flex flex-wrap items-center gap-[4px] font-['Pretendard'] text-[12px] font-[300] leading-[16.8px] tracking-[0px] text-[#8A8A8A]">
            <span>{safeNickname}</span>
            <span>·</span>
            <span>{formatDate(experience.createdAt)}</span>
            <span>·</span>
            <span>{`조회 ${experience.viewCount.toLocaleString()}`}</span>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onBookmarkToggle(experience);
            }}
            className="translate-y-[0.25px] flex shrink-0 items-center gap-[2px] pl-[8px]"
            aria-label={bookmarked ? '북마크 해제' : '북마크 저장'}
          >
            <Bookmark
              size={14}
              strokeWidth={1.75}
              fill={bookmarked ? '#5A876E' : 'none'}
              color={bookmarked ? '#5A876E' : '#8A8A8A'}
            />
            <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#8A8A8A]">
              {experience.likeCount.toLocaleString()}
            </span>
          </button>
        </div>

        {!isSuccess ? (
          <div className="flex w-full justify-end pt-[8px]">
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onSuccessClick(experience);
              }}
              className="inline-flex min-w-[110px] items-center justify-center rounded-[8px] bg-[#5A876E] px-[12px] py-[8px] font-['Pretendard'] text-[12px] font-[600] leading-[14.4px] tracking-[0px] text-white"
            >
              성공 사례 보기
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );

  return (
    <Link to={`/experiences/${experience.id}`} className="block">
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

  async function loadExperiences(searchKeyword: string, nextSortKey: SortKey, categoryId: number | null) {
    setLoading(true);
    setError('');

    try {
      const payload = await getExperiences({
        page: 0,
        size: 30,
        q: searchKeyword || undefined,
        categoryId: categoryId ?? undefined,
        sort: nextSortKey,
      });
      setExperiences(payload.experiences);
      setTotalCount(payload.pagination.totalElements);
    } catch (loadError) {
      setError(resolveErrorMessage(loadError, '사례 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'));
    } finally {
      setLoading(false);
    }
  }

  function submitSearch() {
    const nextKeyword = draftKeyword.trim();
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
      setSearchMode(true);
      window.setTimeout(() => inputRef.current?.focus(), 0);
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
                likeCount: payload.bookmarkCount,
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

  const mergedExperiences = useMemo(() => [...experiences], [experiences]);

  const filteredExperiences = useMemo(() => {
    const byFeed = mergedExperiences.filter((experience) => matchesFeedMode(experience, feedMode));
    return sortExperiences(byFeed, sortOption);
  }, [mergedExperiences, feedMode, sortOption]);

  useEffect(() => {
    if (!accessToken || filteredExperiences.length === 0) {
      setBookmarkedById({});
      return;
    }

    let cancelled = false;

    void Promise.all(
      filteredExperiences.map(async (experience) => {
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

  const resultCount = keyword || selectedCategoryId !== null ? filteredExperiences.length : totalCount;
  const emptyMessage =
    keyword
        ? '검색 결과가 없어요. 다른 키워드로 다시 찾아보세요.'
        : '표시할 사례가 아직 없어요.';
  const showInitialSkeleton = loading && experiences.length === 0;

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <div className="mx-auto min-h-screen w-full max-w-[375px] bg-white">
        <StatusBarV1 />
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

        <main className="bg-[#F8F8F8] pb-[110px]">
          {feedMode === 'success' && sourceExperienceId ? (
            <div className="px-[16px] py-[12px]">
              <div className="rounded-[12px] bg-[#F6F8F6] px-[12px] py-[10px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#5A876E]">
                선택한 실패 사례와 같은 카테고리의 성공 사례를 보고 있어요.
              </div>
            </div>
          ) : null}

          {showInitialSkeleton ? (
            <ListSkeleton count={8} />
          ) : error ? (
            <div className="px-[16px] py-[12px]">
              <ErrorState message={error} />
            </div>
          ) : filteredExperiences.length ? (
            <div className={`transition-opacity duration-200 ${loading ? 'opacity-70' : 'opacity-100'}`}>
              <div className="flex flex-col gap-[2px] py-[2px]">
                {filteredExperiences.map((experience) => (
                  <ExploreCardV1
                    key={experience.id}
                    experience={experience}
                    bookmarked={bookmarkedById[experience.id] ?? false}
                    onBookmarkToggle={handleBookmarkToggle}
                    onSuccessClick={moveToSuccessCases}
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
        <BottomNavV1 />
      </div>
    </div>
  );
}


