import { useEffect, useMemo, useState, type MouseEvent, type WheelEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import categoryCommerceImage from '../assets/home-v1-figma/category-commerce.webp';
import categoryContentImage from '../assets/home-v1-figma/category-content.webp';
import categoryDigitalImage from '../assets/home-v1-figma/category-digital.webp';
import categoryPlatformImage from '../assets/home-v1-figma/category-platform.webp';
import brandMarkIcon from '../assets/home-v1-figma/icons/brand-mark-figma.svg';
import bookmarkIcon from '../assets/figma-downloaded-icons/home/Bookmark.svg';
import edit3Icon from '../assets/figma-downloaded-icons/home/Edit 3.svg';
import heartIcon from '../assets/figma-downloaded-icons/home/Heart.svg';
import bellIcon from '../assets/figma-downloaded-icons/home/Notification.svg';
import plusIcon from '../assets/figma-downloaded-icons/home/Plus.svg';
import searchIcon from '../assets/figma-downloaded-icons/home/Search.svg';
import subtractIcon from '../assets/figma-downloaded-icons/home/Subtract.svg';
import BottomNav from '../components/layout/BottomNav';
import { useToast } from '../components/common/useToast';
import {
  bookmarkExperience,
  type Category,
  type Experience,
  getBookmarkStatus,
  getCategories,
  getExperiences,
  getReactionSummary,
  reactToExperience,
  type ReactionSummaryPayload,
  unbookmarkExperience,
  unreactToExperience,
} from '../lib/api';
import { publishBookmarkSync } from '../lib/bookmark-sync';
import { getExperienceImageMeta } from '../lib/experience-images';
import { resolveErrorMessage } from '../lib/resolve-error-message';
import { getAccessToken } from '../lib/session';

type PopularTopic = '유튜브' | '쇼핑몰' | '블로그' | '주식';
type ExploreSort = 'latest' | 'popular';

type CategoryCardData = {
  id: number;
  title: string;
  lines: string[];
  image: string;
};

type StoryCardData = {
  id: number;
  href: string;
  status: { label: string; tone: 'failure' | 'success' };
  category: string;
  keywords: string[];
  hiddenKeywordCount: number;
  title: string;
  preview: string;
  nickname: string;
  date: string;
  views: string;
  likes: string;
  bookmarks: string;
  imageUrl?: string | null;
  showImagePlaceholder?: boolean;
  showCta: boolean;
  ctaLabel: string;
  ctaDisabled: boolean;
  isFixture?: boolean;
  compact?: boolean;
};

type HomeCardInteraction = ReactionSummaryPayload & {
  bookmarked: boolean;
  bookmarkCountText: string;
};

const textFeatureStyle = { fontFeatureSettings: '"case" 1' } as const;
const previewClampStyle = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap' as const,
} as const;

function handleHorizontalWheelScroll(event: WheelEvent<HTMLDivElement>) {
  const container = event.currentTarget;

  if (container.scrollWidth <= container.clientWidth) {
    return;
  }

  const horizontalDelta = Math.abs(event.deltaX);
  const verticalDelta = Math.abs(event.deltaY);
  const delta = horizontalDelta > verticalDelta ? event.deltaX : event.deltaY;

  if (delta === 0) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  container.scrollBy({
    left: delta,
  });
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

function extractTags(experience: Experience) {
  const raw = [
    experience.businessType ?? '',
    experience.category.name,
    ...experience.failureReasons,
    ...experience.difficulties,
    ...(experience.analysis?.keywords ?? []),
  ].filter(Boolean);

  return Array.from(new Set(raw)).slice(0, 4);
}

function splitCategoryDescription(description: string | null | undefined, fallback: string[]) {
  if (!description) {
    return fallback;
  }

  const lines = description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.length ? lines.slice(0, 4) : fallback;
}
void splitCategoryDescription;

function matchesPopularTopic(experience: Experience, topic: PopularTopic) {
  const haystack = [
    experience.title,
    experience.content,
    experience.businessType ?? '',
    experience.category.name,
    ...experience.failureReasons,
    ...experience.difficulties,
    ...(experience.analysis?.keywords ?? []),
  ]
    .join(' ')
    .toLowerCase();

  const keywordsByTopic: Record<PopularTopic, string[]> = {
    유튜브: ['유튜브', 'youtube', '영상', '쇼츠', '크리에이터'],
    쇼핑몰: ['쇼핑몰', '스마트스토어', '이커머스', '쿠팡', '스토어'],
    블로그: ['블로그', 'blog', '브런치', '콘텐츠', '워드프레스'],
    주식: ['주식', '코인', 'etf', '투자', '재테크'],
  };

  return keywordsByTopic[topic].some((keyword) => haystack.includes(keyword));
}

function toStoryCardData(experience: Experience, compact = false): StoryCardData {
  const preview = experience.content.replace(/\s+/g, ' ').trim() || '아직 본문이 등록되지 않았습니다.';
  const imageMeta = getExperienceImageMeta(experience);
  const allKeywords = extractTags(experience);
  const keywords = allKeywords.slice(0, 2);
  const hiddenKeywordCount = Math.max(0, allKeywords.length - 2);
  const compactResolved = experience.structuredData.figmaCardCompact === true || compact;
  const showCta =
    typeof experience.structuredData.figmaCardShowCta === 'boolean'
      ? experience.structuredData.figmaCardShowCta
      : !compactResolved;
  const ctaLabel =
    typeof experience.structuredData.figmaCardCtaLabel === 'string' ? experience.structuredData.figmaCardCtaLabel : 'CTA';
  const ctaDisabled = experience.structuredData.figmaCardCtaDisabled === true;

  return {
    id: experience.id,
    href: `/experiences/${experience.id}`,
    status: {
      label: experience.caseStatus === 'FAILURE' ? '실패' : '성공',
      tone: experience.caseStatus === 'FAILURE' ? 'failure' : 'success',
    },
    category: experience.category.name,
    keywords: keywords.length ? keywords : ['키워드'],
    hiddenKeywordCount,
    title: experience.title,
    preview,
    nickname: experience.author.nickname || '익명',
    date: formatDate(experience.createdAt),
    views: experience.viewCount.toLocaleString(),
    likes: experience.likeCount.toLocaleString(),
    bookmarks: (experience.bookmarkCount ?? 0).toLocaleString(),
    imageUrl: imageMeta.primaryImageUrl,
    showImagePlaceholder: false,
    showCta,
    ctaLabel,
    ctaDisabled,
    isFixture: false,
    compact: compactResolved,
  };
}

const categoryCards: CategoryCardData[] = [];
const homeReviewCategoryCards: CategoryCardData[] = [];
void categoryCards;
void homeReviewCategoryCards;

const homeReviewCategoryCardsExact: CategoryCardData[] = [
  {
    id: 1,
    title: '온라인 판매·이커머스',
    lines: ['스마트스토어/ 쿠팡, 오픈마켓', '/구매대행, 위탁판매', '/재고 기반 쇼핑몰 등'],
    image: categoryCommerceImage,
  },
  {
    id: 2,
    title: '콘텐츠·SNS 기반',
    lines: ['유튜브, 블로그, 인스타그램, 릴스,', '/뉴스레터, 개인 브랜딩 기반 활동'],
    image: categoryContentImage,
  },
  {
    id: 3,
    title: '디지털 상품·지식 판매',
    lines: ['전자책, 강의 제작 (클래스, 인', '강) 템플릿, 디자인 판매', '/ 노션, PDF 자료 판매 등'],
    image: categoryDigitalImage,
  },
  {
    id: 4,
    title: '플랫폼 기반 노동형',
    lines: ['배달, 대리운전, 쿠팡플렉스, 설문', '참여, 테스트 작업 등 플랫폼 기반', '활동'],
    image: categoryPlatformImage,
  },
  {
    id: 5,
    title: '재능 판매·프리랜서',
    lines: ['디자인/영상 편집/글쓰기, 카메라', '이커머스 개발/ 번역 / 코딩 등 플', '랫폼 활동'],
    image: categoryDigitalImage,
  },
  {
    id: 6,
    title: '오프라인 기반 부업',
    lines: ['공방, 핸드메이드/ 플리마켓 판매/', '클래스 운영 (오프라인) 등'],
    image: categoryCommerceImage,
  },
];

const makeStoryCard = (
  id: number,
  status: StoryCardData['status'],
  keyword2: string,
  compact = false,
): StoryCardData => ({
  id,
  href: `/experiences/${id}`,
  status,
  category: '카테고리',
  keywords: ['키워드', keyword2],
  hiddenKeywordCount: 0,
  title: '제목',
  preview: '본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기',
  nickname: '닉네임',
  date: '2026.00.00',
  views: '999',
  likes: '999',
  bookmarks: '999',
  imageUrl: null,
  showImagePlaceholder: true,
  showCta: !compact,
  ctaLabel: 'CTA',
  ctaDisabled: false,
  isFixture: true,
  compact,
});

function stopCardEvent(event: MouseEvent<HTMLElement>) {
  event.preventDefault();
  event.stopPropagation();
}

const popularCardsByTopic: Record<PopularTopic, StoryCardData[]> = {
  유튜브: [
    makeStoryCard(101, { label: '실패', tone: 'failure' }, '키워드'),
    makeStoryCard(102, { label: '성공', tone: 'success' }, '키워드', true),
    makeStoryCard(103, { label: '실패', tone: 'failure' }, '키워드'),
  ],
  쇼핑몰: [
    makeStoryCard(111, { label: '실패', tone: 'failure' }, '쇼핑몰'),
    makeStoryCard(112, { label: '성공', tone: 'success' }, '쇼핑몰', true),
    makeStoryCard(113, { label: '실패', tone: 'failure' }, '쇼핑몰'),
  ],
  블로그: [
    makeStoryCard(121, { label: '실패', tone: 'failure' }, '블로그'),
    makeStoryCard(122, { label: '성공', tone: 'success' }, '블로그', true),
    makeStoryCard(123, { label: '실패', tone: 'failure' }, '블로그'),
  ],
  주식: [
    makeStoryCard(131, { label: '실패', tone: 'failure' }, '주식'),
    makeStoryCard(132, { label: '성공', tone: 'success' }, '주식', true),
    makeStoryCard(133, { label: '실패', tone: 'failure' }, '주식'),
  ],
};

const exploreCardsBySort: Record<ExploreSort, StoryCardData[]> = {
  latest: [
    makeStoryCard(201, { label: '실패', tone: 'failure' }, '키워드'),
    makeStoryCard(202, { label: '성공', tone: 'success' }, '키워드', true),
    makeStoryCard(203, { label: '실패', tone: 'failure' }, '블로그'),
  ],
  popular: [
    makeStoryCard(211, { label: '성공', tone: 'success' }, '유튜브'),
    makeStoryCard(212, { label: '실패', tone: 'failure' }, '쇼핑몰'),
    makeStoryCard(213, { label: '성공', tone: 'success' }, '블로그', true),
  ],
};

function HomeHeader({ hasUnreadNotifications = true }: { hasUnreadNotifications?: boolean }) {
  const navigate = useNavigate();

  return (
    <header className="flex h-[116px] w-full flex-col bg-white">
      <div className="relative h-[64px] w-full">
        <div className="absolute left-[16px] top-[23px] flex h-[24px] w-[145px] items-center">
          <img src={brandMarkIcon} alt="" className="mr-[-2px] h-[24px] w-[24px] shrink-0" />
          <span className="font-['Bruno_Ace_SC'] text-[25.667px] font-[400] leading-[20.533px] text-[#5A876E]">
            sidepick
          </span>
        </div>
        <button
          type="button"
          aria-label={hasUnreadNotifications ? '읽지 않은 알림' : '알림'}
          onClick={() => navigate('/coming-soon')}
          className="absolute right-[16px] top-[20px] flex h-[30px] w-[30px] items-center justify-center"
        >
          <img src={bellIcon} alt="" className="h-[30px] w-[30px]" />
          {hasUnreadNotifications ? <span className="absolute right-[5px] top-[4px] h-[6px] w-[6px] rounded-full bg-[#FF3B30]" /> : null}
        </button>
      </div>
      <div className="flex h-[52px] w-full px-[16px]">
        <button
          type="button"
          aria-label="검색 열기"
          onClick={() => navigate('/explore?mode=search')}
          className="flex h-[36px] w-[343px] items-center rounded-[999px] border border-[#EEEEEE] bg-[#F8F8F8] px-[16px] py-[8px] text-left"
        >
          <span
            className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] text-[#BABABA]"
            style={textFeatureStyle}
          >
            원하는 실패 사례를 검색해보세요!
          </span>
          <img src={searchIcon} alt="" className="h-[20px] w-[20px] shrink-0" />
        </button>
      </div>
    </header>
  );
}

function CategoryCard({ card }: { card: CategoryCardData }) {
  return (
    <Link
      to={`/explore?categoryId=${card.id}`}
      className="relative flex h-[160px] min-w-0 flex-1 flex-col justify-end overflow-hidden rounded-[10px] p-[16px]"
    >
      <img src={card.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,#000000_100%)]" />
      <div className="relative flex w-full flex-col gap-[4px] text-white">
        <p
          className="w-full whitespace-nowrap font-['Pretendard'] text-[14px] font-[600] leading-[16.8px]"
          style={textFeatureStyle}
        >
          {card.title}
        </p>
        <div
          className="relative min-w-full w-min font-['Pretendard'] text-[10px] font-[300] leading-[0]"
          style={textFeatureStyle}
        >
          {card.lines.map((line) => (
            <p key={line} className="leading-[14px]">
              {line}
            </p>
          ))}
        </div>
      </div>
    </Link>
  );
}

function CategorySection({
  cards,
  expanded,
  onToggleExpanded,
}: {
  cards: CategoryCardData[];
  expanded: boolean;
  onToggleExpanded: () => void;
}) {
  const visibleCards = expanded ? cards : cards.slice(0, 4);

  return (
    <section
      className={`flex w-full flex-col items-center bg-white px-[16px] pt-[12px] ${expanded ? 'pb-[12px]' : 'h-[415px] pb-[8px]'}`}
    >
      <div className="flex w-[343px] items-end justify-between">
        <h2 className="font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] text-[#131416]" style={textFeatureStyle}>
          부업 카테고리
        </h2>
        <Link
          to="/explore"
          className="font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] text-[#8A8A8A]"
          style={textFeatureStyle}
        >
          전체보기
        </Link>
      </div>
      <div className="mt-[16px] flex w-[343px] flex-col gap-[10px]">
        <div className="flex gap-[10px]">
          {visibleCards.slice(0, 2).map((card) => (
            <CategoryCard key={card.id} card={card} />
          ))}
        </div>
        <div className="flex gap-[10px]">
          {visibleCards.slice(2, 4).map((card) => (
            <CategoryCard key={card.id} card={card} />
          ))}
        </div>
        {expanded ? (
          <>
            <div className="flex gap-[10px]">
              {visibleCards.slice(4, 6).map((card) => (
                <CategoryCard key={card.id} card={card} />
              ))}
            </div>
            <div className="flex gap-[10px]">
              {visibleCards.slice(6, 8).map((card) => (
                <CategoryCard key={card.id} card={card} />
              ))}
            </div>
          </>
        ) : null}
      </div>
      <div className="flex w-[343px] justify-center pt-[16px]">
        <button
          type="button"
          aria-expanded={expanded}
          onClick={onToggleExpanded}
          className="font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] text-[#757575] underline underline-offset-[1px]"
          style={textFeatureStyle}
        >
          {expanded ? '접기' : '펼쳐 보기'}
        </button>
      </div>
    </section>
  );
}

function StoryBadge({
  label,
  tone = 'keyword',
}: {
  label: string;
  tone?: 'failure' | 'success' | 'category' | 'keyword';
}) {
  const toneClass =
    tone === 'failure'
      ? 'bg-[#C06D43] text-white'
      : tone === 'success'
        ? 'bg-[#5A876E] text-white'
        : tone === 'category'
          ? 'bg-[#CBE5D8] text-[#5A876E]'
          : 'bg-[#E6E6E6] text-[#8A8A8A]';

  return (
    <span
      className={`rounded-[4px] px-[4px] py-[2px] font-['Pretendard'] text-[10px] font-[500] leading-[12px] ${toneClass}`}
      style={textFeatureStyle}
    >
      <span className="block max-w-[56px] overflow-hidden text-ellipsis whitespace-nowrap">{label}</span>
    </span>
  );
}

function StoryMeta({
  card,
  bookmarkActive = false,
  heartActive = false,
  bookmarkCountText,
  heartCountText,
  onBookmarkClick,
  onHeartClick,
}: {
  card: StoryCardData;
  bookmarkActive?: boolean;
  heartActive?: boolean;
  bookmarkCountText?: string;
  heartCountText?: string;
  onBookmarkClick?: () => void;
  onHeartClick?: () => void;
}) {
  const likeText = heartCountText ?? card.likes;
  const bookmarkText = bookmarkCountText ?? card.bookmarks;

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-[4px] font-['Pretendard'] text-[12px] font-[300] leading-[16.8px] text-[#8A8A8A]">
        <span style={textFeatureStyle}>{card.nickname}</span>
        <span>•</span>
        <span style={textFeatureStyle}>{card.date}</span>
        <span>•</span>
        <span className="flex items-center gap-[2px]">
          <span style={textFeatureStyle}>조회</span>
          <span style={textFeatureStyle}>{card.views}</span>
        </span>
      </div>
      <div className="flex items-center gap-[4px]">
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={(event) => {
              stopCardEvent(event);
              onHeartClick?.();
            }}
            className="m-0 flex shrink-0 items-center border-0 bg-transparent p-0 text-inherit appearance-none disabled:opacity-100"
            aria-label={heartActive ? '공감 취소' : '공감해요'}
            disabled={!onHeartClick}
          >
            <div className="flex shrink-0 items-center gap-[2px]">
              <div className="flex h-[20px] w-[20px] shrink-0 items-center justify-center">
                <img src={heartIcon} alt="" className="h-[14px] w-[14px] shrink-0" />
              </div>
              <p
                className="shrink-0 whitespace-nowrap font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#8A8A8A]"
                style={textFeatureStyle}
              >
                {likeText}
              </p>
            </div>
          </button>
        </div>
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={(event) => {
              stopCardEvent(event);
              onBookmarkClick?.();
            }}
            className="m-0 flex shrink-0 items-center border-0 bg-transparent p-0 text-inherit appearance-none disabled:opacity-100"
            aria-label={bookmarkActive ? '북마크 해제' : '북마크 추가'}
            disabled={!onBookmarkClick}
          >
            <div className="flex shrink-0 items-center gap-[2px]">
              <div className="flex h-[24px] w-[24px] shrink-0 items-center justify-center">
                <img src={bookmarkIcon} alt="" className="h-[14px] w-[14px] shrink-0" />
              </div>
              <p
                className="shrink-0 whitespace-nowrap font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#8A8A8A]"
                style={textFeatureStyle}
              >
                {bookmarkText}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function StoryCard({
  card,
  widthClass,
  offsetTop = false,
  bookmarkActive = false,
  heartActive = false,
  bookmarkCountText,
  heartCountText,
  onBookmarkClick,
  onHeartClick,
}: {
  card: StoryCardData;
  widthClass: string;
  offsetTop?: boolean;
  bookmarkActive?: boolean;
  heartActive?: boolean;
  bookmarkCountText?: string;
  heartCountText?: string;
  onBookmarkClick?: () => void;
  onHeartClick?: () => void;
}) {
  const navigate = useNavigate();
  const heightClass = card.compact ? 'h-[149px]' : 'h-[187px]';
  const offsetClass = offsetTop ? 'mt-[19px]' : '';
  const hasCta = card.showCta;
  const showMedia = Boolean(card.imageUrl) || card.showImagePlaceholder;
  const textColumnClass = showMedia ? 'h-[60px] w-[223px] shrink-0' : 'min-h-[60px] w-full flex-1';
  const previewClass = showMedia
    ? 'w-full font-[\'Pretendard\'] text-[12px] font-[400] leading-[16.8px] text-[#494949]'
    : 'line-clamp-2 w-full font-[\'Pretendard\'] text-[12px] font-[400] leading-[16.8px] text-[#494949]';

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => navigate(card.href)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          navigate(card.href);
        }
      }}
      className={`${widthClass} ${heightClass} ${offsetClass} block overflow-hidden rounded-[4px] bg-white shadow-[0px_0px_2px_0px_rgba(0,0,0,0.1)]`}
    >
      <article className="flex h-full w-full flex-col gap-[8px] bg-white px-[16px] py-[20px]">
        <div className="flex flex-col gap-[8px]">
          <div className="flex w-full items-center gap-[4px] overflow-hidden whitespace-nowrap">
            <StoryBadge label={card.status.label} tone={card.status.tone} />
            <StoryBadge label={card.category} tone="category" />
            {card.keywords.map((keyword, index) => (
              <StoryBadge key={`${card.id}-${keyword}-${index}`} label={keyword} />
            ))}
            {card.hiddenKeywordCount > 0 ? <StoryBadge label={`+${card.hiddenKeywordCount}`} /> : null}
          </div>
          <div className={`flex items-start ${showMedia ? 'h-[60px] gap-[8px]' : 'min-h-[60px]'}`}>
            {showMedia ? (
              card.imageUrl ? (
                <img src={card.imageUrl} alt="" className="h-[60px] w-[80px] shrink-0 rounded-[4px] object-cover" loading="lazy" />
              ) : (
                <div className="h-[60px] w-[80px] shrink-0 rounded-[4px] bg-[#D8D8D8]" />
              )
            ) : null}
            <div className={`flex flex-col items-start ${textColumnClass}`}>
              <div className="flex min-h-px w-full flex-[1_0_0] flex-col gap-[4px] whitespace-nowrap">
                <h3
                  className="w-full overflow-hidden text-ellipsis font-['Pretendard'] text-[14px] font-[600] leading-[16.8px] text-[#131416]"
                  style={textFeatureStyle}
                >
                  {card.title}
                </h3>
                <p
                  className={previewClass}
                  style={showMedia ? { ...textFeatureStyle, ...previewClampStyle } : textFeatureStyle}
                >
                  {card.preview}
                </p>
              </div>
            </div>
          </div>
          <StoryMeta
            card={card}
            bookmarkActive={bookmarkActive}
            heartActive={heartActive}
            bookmarkCountText={bookmarkCountText}
            heartCountText={heartCountText}
            onBookmarkClick={onBookmarkClick}
            onHeartClick={onHeartClick}
          />
        </div>
        {hasCta ? (
          <div className="flex w-full items-center justify-end">
            <button
              type="button"
              onClick={(event) => {
                stopCardEvent(event);
                if (!card.ctaDisabled) {
                  navigate(card.href);
                }
              }}
              disabled={card.ctaDisabled}
              aria-label={`${card.ctaLabel} 이동`}
              className={`flex h-[30px] w-[48px] items-start justify-start rounded-[8px] px-[12px] py-[8px] ${
                card.ctaDisabled ? 'bg-[#CBE5D8]' : 'bg-[#5A876E]'
              }`}
            >
              <div
                className="flex flex-col justify-center font-['Pretendard'] text-[12px] font-[600] leading-[0] text-center text-white"
                style={textFeatureStyle}
              >
                <span className="leading-[14.4px]">{card.ctaLabel}</span>
              </div>
            </button>
          </div>
        ) : null}
      </article>
    </div>
  );
}

function PopularSection({
  topic,
  onChangeTopic,
  cards,
  interactionById,
  onBookmarkToggle,
  onHeartToggle,
}: {
  topic: PopularTopic;
  onChangeTopic: (value: PopularTopic) => void;
  cards: StoryCardData[];
  interactionById: Record<number, HomeCardInteraction>;
  onBookmarkToggle: (card: StoryCardData) => void;
  onHeartToggle: (card: StoryCardData) => void;
}) {
  const topics: PopularTopic[] = ['유튜브', '쇼핑몰', '블로그', '주식'];

  return (
    <section className="flex h-[287px] w-full flex-col items-center bg-white px-[16px] py-[12px]">
      <div className="flex w-[343px] flex-col gap-[16px]">
        <h2 className="font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] text-[#131416]" style={textFeatureStyle}>
          인기 부업
        </h2>
        <div className="flex h-[25px] w-[343px] items-start">
          {topics.map((item, index) => {
            const active = item === topic;
            const widthClass = index === 3 ? 'w-[41px]' : 'w-[53px]';
            return (
              <button
                key={item}
                type="button"
                aria-pressed={active}
                onClick={() => onChangeTopic(item)}
                className={`${widthClass} box-border flex h-[25px] items-start justify-center whitespace-nowrap px-[8px] pt-[4px] font-['Pretendard'] text-[14px] leading-[16.8px] ${
                  active
                    ? 'border-b-[1.5px] border-[#5A876E] font-[600] text-[#5A876E]'
                    : 'font-[400] text-[#BABABA]'
                }`}
                style={textFeatureStyle}
              >
                {item}
              </button>
            );
          })}
        </div>
        <div
          className="w-[343px] snap-x snap-mandatory overflow-x-auto overflow-y-hidden [overscroll-behavior-x:contain] [overscroll-behavior-y:contain] [scrollbar-width:none] [-ms-overflow-style:none] [touch-action:pan-x] [&::-webkit-scrollbar]:hidden"
          onWheel={handleHorizontalWheelScroll}
        >
          <div className="flex w-[953px]">
            <StoryCard
              card={cards[0]}
              widthClass="w-[311px] shrink-0 snap-start"
              heartActive={interactionById[cards[0].id]?.myReactions.includes('HEART') ?? false}
              heartCountText={(interactionById[cards[0].id]?.heartCount ?? Number(cards[0].likes.replace(/,/g, ''))).toLocaleString()}
              bookmarkActive={interactionById[cards[0].id]?.bookmarked ?? false}
              bookmarkCountText={interactionById[cards[0].id]?.bookmarkCountText ?? cards[0].bookmarks}
              onBookmarkClick={cards[0].isFixture ? undefined : () => onBookmarkToggle(cards[0])}
              onHeartClick={cards[0].isFixture ? undefined : () => onHeartToggle(cards[0])}
            />
            <StoryCard
              card={cards[1]}
              widthClass="ml-[10px] w-[311px] shrink-0 snap-start"
              offsetTop
              heartActive={interactionById[cards[1].id]?.myReactions.includes('HEART') ?? false}
              heartCountText={(interactionById[cards[1].id]?.heartCount ?? Number(cards[1].likes.replace(/,/g, ''))).toLocaleString()}
              bookmarkActive={interactionById[cards[1].id]?.bookmarked ?? false}
              bookmarkCountText={interactionById[cards[1].id]?.bookmarkCountText ?? cards[1].bookmarks}
              onBookmarkClick={cards[1].isFixture ? undefined : () => onBookmarkToggle(cards[1])}
              onHeartClick={cards[1].isFixture ? undefined : () => onHeartToggle(cards[1])}
            />
            <StoryCard
              card={cards[2]}
              widthClass="ml-[10px] w-[311px] shrink-0 snap-start"
              heartActive={interactionById[cards[2].id]?.myReactions.includes('HEART') ?? false}
              heartCountText={(interactionById[cards[2].id]?.heartCount ?? Number(cards[2].likes.replace(/,/g, ''))).toLocaleString()}
              bookmarkActive={interactionById[cards[2].id]?.bookmarked ?? false}
              bookmarkCountText={interactionById[cards[2].id]?.bookmarkCountText ?? cards[2].bookmarks}
              onBookmarkClick={cards[2].isFixture ? undefined : () => onBookmarkToggle(cards[2])}
              onHeartClick={cards[2].isFixture ? undefined : () => onHeartToggle(cards[2])}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ExploreSegmentExact({
  sort,
  onChangeSort,
}: {
  sort: ExploreSort;
  onChangeSort: (value: ExploreSort) => void;
}) {
  const latestActive = sort === 'latest';
  const popularActive = sort === 'popular';

  return (
    <div className="ml-[16px] flex h-[32px] w-[311px] items-start rounded-[99px] bg-[#DEDEDE]">
      <button
        type="button"
        aria-pressed={latestActive}
        onClick={() => onChangeSort('latest')}
        className={`box-border flex w-[155.5px] shrink-0 items-center justify-center font-['Pretendard'] text-[12px] font-[500] leading-[14.4px] ${
          latestActive
            ? 'h-[32px] rounded-[999px] border-[2px] border-[#DEDEDE] bg-white text-black'
            : 'relative top-[-4px] h-[40px] rounded-[4px] py-[6px] text-[#5D5D5D]'
        }`}
        style={textFeatureStyle}
      >
        <span className="flex shrink-0 flex-col justify-center text-center text-[12px] font-[500] leading-[0]">
          <span className="leading-[14.4px]">최근 등록된 사례</span>
        </span>
      </button>
      <button
        type="button"
        aria-pressed={popularActive}
        onClick={() => onChangeSort('popular')}
        className={`box-border flex w-[155.5px] shrink-0 items-center justify-center font-['Pretendard'] text-[12px] font-[500] leading-[14.4px] ${
          popularActive
            ? 'h-[32px] rounded-[999px] border-[2px] border-[#DEDEDE] bg-white text-black'
            : 'relative top-[-4px] h-[40px] rounded-[4px] py-[6px] text-[#5D5D5D]'
        }`}
        style={textFeatureStyle}
      >
        <span className="flex shrink-0 flex-col justify-center text-center text-[12px] font-[500] leading-[0]">
          <span className="leading-[14.4px]">인기 사례</span>
        </span>
      </button>
    </div>
  );
}

function ExploreSection({
  sort,
  onChangeSort,
  cards,
  interactionById,
  onBookmarkToggle,
  onHeartToggle,
}: {
  sort: ExploreSort;
  onChangeSort: (value: ExploreSort) => void;
  cards: StoryCardData[];
  interactionById: Record<number, HomeCardInteraction>;
  onBookmarkToggle: (card: StoryCardData) => void;
  onHeartToggle: (card: StoryCardData) => void;
}) {
  return (
    <section className="flex w-full flex-col items-center bg-white px-[16px] pb-[12px] pt-[12px]">
      <h2 className="w-[343px] font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] text-[#131416]" style={textFeatureStyle}>
        탐색
      </h2>
      <div className="mt-[10px] flex w-[343px] flex-col">
        <ExploreSegmentExact sort={sort} onChangeSort={onChangeSort} />
        <div className="mt-[12px] flex flex-col gap-[10px]">
            <StoryCard
              card={cards[0]}
              widthClass="w-[343px]"
              heartActive={interactionById[cards[0].id]?.myReactions.includes('HEART') ?? false}
              heartCountText={(interactionById[cards[0].id]?.heartCount ?? Number(cards[0].likes.replace(/,/g, ''))).toLocaleString()}
              bookmarkActive={interactionById[cards[0].id]?.bookmarked ?? false}
              bookmarkCountText={interactionById[cards[0].id]?.bookmarkCountText ?? cards[0].bookmarks}
              onBookmarkClick={cards[0].isFixture ? undefined : () => onBookmarkToggle(cards[0])}
              onHeartClick={cards[0].isFixture ? undefined : () => onHeartToggle(cards[0])}
            />
            <StoryCard
              card={cards[1]}
              widthClass="w-[343px]"
              heartActive={interactionById[cards[1].id]?.myReactions.includes('HEART') ?? false}
              heartCountText={(interactionById[cards[1].id]?.heartCount ?? Number(cards[1].likes.replace(/,/g, ''))).toLocaleString()}
              bookmarkActive={interactionById[cards[1].id]?.bookmarked ?? false}
              bookmarkCountText={interactionById[cards[1].id]?.bookmarkCountText ?? cards[1].bookmarks}
              onBookmarkClick={cards[1].isFixture ? undefined : () => onBookmarkToggle(cards[1])}
              onHeartClick={cards[1].isFixture ? undefined : () => onHeartToggle(cards[1])}
            />
            <StoryCard
              card={cards[2]}
              widthClass="w-[343px]"
              heartActive={interactionById[cards[2].id]?.myReactions.includes('HEART') ?? false}
              heartCountText={(interactionById[cards[2].id]?.heartCount ?? Number(cards[2].likes.replace(/,/g, ''))).toLocaleString()}
              bookmarkActive={interactionById[cards[2].id]?.bookmarked ?? false}
              bookmarkCountText={interactionById[cards[2].id]?.bookmarkCountText ?? cards[2].bookmarks}
              onBookmarkClick={cards[2].isFixture ? undefined : () => onBookmarkToggle(cards[2])}
              onHeartClick={cards[2].isFixture ? undefined : () => onHeartToggle(cards[2])}
            />
        </div>
        <div className="flex w-[343px] justify-center pt-[16px]">
          <Link
            to="/explore"
            className="flex flex-col justify-center whitespace-nowrap font-['Pretendard'] text-[12px] font-[400] leading-[0] text-[#5D5D5D] text-center"
            style={textFeatureStyle}
          >
            <span className="text-[12px] leading-[14.4px] underline [text-underline-position:from-font] decoration-solid">
              모든 사례 보기
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function FloatingActionsExact() {
  const navigate = useNavigate();
  const location = useLocation();
  const [fabExpanded, setFabExpanded] = useState(() => new URLSearchParams(location.search).get('fab') === 'open');

  return (
    <BottomNav
      active="home"
      accessoryLayout="end"
      accessory={
        <div className="relative flex h-[36px] w-[36px] items-center justify-center">
          <div
            className={`pointer-events-auto absolute bottom-[52px] right-[-10px] flex w-max flex-col items-start rounded-[10px] bg-white px-[10px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] transition-[max-height,opacity,padding] duration-150 ${
              fabExpanded
                ? 'max-h-[120px] gap-[12px] overflow-visible py-[12px] opacity-100'
                : 'pointer-events-none max-h-0 gap-0 overflow-hidden py-0 opacity-0'
            }`}
          >
            <button type="button" onClick={() => navigate('/coming-soon')} className="flex items-center gap-[8px] whitespace-nowrap">
              <img src={subtractIcon} alt="" className="h-[17px] w-[17px] shrink-0" />
              <span className="font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] text-black" style={textFeatureStyle}>
                AI 챗봇
              </span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/auth?next=%2Fcreate')}
              className="flex items-center gap-[8px] whitespace-nowrap"
            >
              <img src={edit3Icon} alt="" className="h-[20px] w-[20px] shrink-0" />
              <span className="font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] text-black" style={textFeatureStyle}>
                경험 작성
              </span>
            </button>
          </div>
          <button
            type="button"
            aria-label="플로팅 액션 메뉴"
            aria-expanded={fabExpanded}
            onClick={() => setFabExpanded((prev) => !prev)}
            className="pointer-events-auto flex h-[36px] w-[36px] items-center justify-center rounded-[999px] bg-[#5A876E] p-[2px]"
          >
            <img src={plusIcon} alt="" className="h-[20px] w-[20px]" />
          </button>
        </div>
      }
    />
  );
}

export default function HomeV2() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const accessToken = getAccessToken();
  const [categoryExpanded, setCategoryExpanded] = useState(false);
  const [popularTopic, setPopularTopic] = useState<PopularTopic>('유튜브');
  const [exploreSort, setExploreSort] = useState<ExploreSort>('latest');
  const [apiCategories, setApiCategories] = useState<Category[]>([]);
  const [latestExperiences, setLatestExperiences] = useState<Experience[]>([]);
  const [popularExperiences, setPopularExperiences] = useState<Experience[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [interactionById, setInteractionById] = useState<Record<number, HomeCardInteraction>>({});
  void apiCategories;

  useEffect(() => {
    let active = true;

    async function loadHomeFeeds() {
      setListLoading(true);
      setListError('');

      try {
        const [categoryPayload, latestPayload, popularPayload] = await Promise.all([
          getCategories(),
          getExperiences({ page: 0, size: 20, sort: 'latest' }),
          getExperiences({ page: 0, size: 20, sort: 'popular' }),
        ]);

        if (!active) {
          return;
        }

        setApiCategories(categoryPayload);
        setLatestExperiences(latestPayload.experiences);
        setPopularExperiences(popularPayload.experiences);
      } catch (error) {
        if (!active) {
          return;
        }
        setListError(resolveErrorMessage(error, '메인 경험 목록을 불러오지 못했습니다.'));
      } finally {
        if (active) {
          setListLoading(false);
        }
      }
    }

    void loadHomeFeeds();

    return () => {
      active = false;
    };
  }, []);

  const resolvedCategoryCards = useMemo(() => {
    return homeReviewCategoryCardsExact;
  }, []);

  const popularSectionCards = useMemo(() => {
    const matched = popularExperiences.filter((experience) => matchesPopularTopic(experience, popularTopic));
    const source = (matched.length ? matched : popularExperiences).slice(0, 3);
    const mapped = source.map((experience, index) => toStoryCardData(experience, index === 1));
    return [...mapped, ...popularCardsByTopic[popularTopic]].slice(0, 3);
  }, [popularExperiences, popularTopic]);

  const exploreSectionCards = useMemo(() => {
    const source = (exploreSort === 'latest' ? latestExperiences : popularExperiences).slice(0, 3);
    const mapped = source.map((experience, index) => toStoryCardData(experience, index === 2 && experience.caseStatus === 'SUCCESS'));
    return [...mapped, ...exploreCardsBySort[exploreSort]].slice(0, 3);
  }, [exploreSort, latestExperiences, popularExperiences]);

  const interactiveCards = useMemo(() => {
    const merged = [...popularSectionCards, ...exploreSectionCards].filter((card) => !card.isFixture);
    return Array.from(new Map(merged.map((card) => [card.id, card])).values());
  }, [exploreSectionCards, popularSectionCards]);

  useEffect(() => {
    if (!accessToken || interactiveCards.length === 0) {
      setInteractionById({});
      return;
    }

    let cancelled = false;

    void Promise.all(
      interactiveCards.map(async (card) => {
        try {
          const [bookmarkStatus, reactionSummary] = await Promise.all([
            getBookmarkStatus(accessToken, card.id),
            getReactionSummary(accessToken, card.id),
          ]);

          return [
            card.id,
            {
              ...reactionSummary,
              bookmarked: bookmarkStatus.bookmarked,
              bookmarkCountText: bookmarkStatus.bookmarkCount.toLocaleString(),
            },
          ] as const;
        } catch {
          return [
            card.id,
            {
              experienceId: card.id,
              heartCount: Number(card.likes.replace(/,/g, '')) || 0,
              tearCount: 0,
              myReactions: [],
              bookmarked: false,
              bookmarkCountText: card.bookmarks,
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
  }, [accessToken, interactiveCards]);

  function moveToAuth(reason: string) {
    navigate(`/auth?next=${encodeURIComponent('/')}&reason=${encodeURIComponent(reason)}`);
  }

  async function handleBookmarkToggle(card: StoryCardData) {
    if (!accessToken) {
      moveToAuth('북마크는 로그인이 필요한 서비스입니다.');
      return;
    }

    const current = interactionById[card.id];
    const bookmarked = current?.bookmarked ?? false;

    try {
      const payload = bookmarked
        ? await unbookmarkExperience(accessToken, card.id)
        : await bookmarkExperience(accessToken, card.id);

      setInteractionById((state) => ({
        ...state,
        [card.id]: {
          ...(state[card.id] ?? {
            experienceId: card.id,
            heartCount: Number(card.likes.replace(/,/g, '')) || 0,
            tearCount: 0,
            myReactions: [],
            bookmarked: false,
            bookmarkCountText: card.bookmarks,
          }),
          bookmarked: payload.bookmarked,
          bookmarkCountText: payload.bookmarkCount.toLocaleString(),
        },
      }));

      publishBookmarkSync({
        experienceId: card.id,
        bookmarked: payload.bookmarked,
        bookmarkCount: payload.bookmarkCount,
      });
      showToast(payload.bookmarked ? '북마크에 추가했어요.' : '북마크를 해제했어요.');
    } catch (bookmarkError) {
      showToast(resolveErrorMessage(bookmarkError, '북마크 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.'));
    }
  }

  async function handleHeartToggle(card: StoryCardData) {
    if (!accessToken) {
      moveToAuth('반응 기능은 로그인이 필요한 서비스입니다.');
      return;
    }

    const current = interactionById[card.id] ?? {
      experienceId: card.id,
      heartCount: Number(card.likes.replace(/,/g, '')) || 0,
      tearCount: 0,
      myReactions: [],
      bookmarked: false,
      bookmarkCountText: card.bookmarks,
    };
    const heartActive = current.myReactions.includes('HEART');
    const optimistic: HomeCardInteraction = {
      ...current,
      heartCount: Math.max(0, current.heartCount + (heartActive ? -1 : 1)),
      myReactions: heartActive ? current.myReactions.filter((item) => item !== 'HEART') : [...current.myReactions, 'HEART'],
    };

    setInteractionById((state) => ({
      ...state,
      [card.id]: optimistic,
    }));

    try {
      const payload = heartActive
        ? await unreactToExperience(accessToken, card.id, 'HEART')
        : await reactToExperience(accessToken, card.id, 'HEART');

      setInteractionById((state) => ({
        ...state,
        [card.id]: {
          ...payload,
          bookmarked: state[card.id]?.bookmarked ?? current.bookmarked,
          bookmarkCountText: state[card.id]?.bookmarkCountText ?? current.bookmarkCountText,
        },
      }));
    } catch (reactionError) {
      setInteractionById((state) => ({
        ...state,
        [card.id]: current,
      }));
      showToast(resolveErrorMessage(reactionError, '반응 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.'));
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <div className="relative mx-auto w-full max-w-[375px] bg-white pt-[116px]" style={textFeatureStyle}>
        <div className="absolute left-0 top-0 z-10 w-full">
          <HomeHeader />
        </div>
        <main className="flex w-full flex-col bg-white pb-[220px]">
          <CategorySection cards={resolvedCategoryCards} expanded={categoryExpanded} onToggleExpanded={() => setCategoryExpanded((prev) => !prev)} />
          <PopularSection
            topic={popularTopic}
            onChangeTopic={setPopularTopic}
            cards={popularSectionCards}
            interactionById={interactionById}
            onBookmarkToggle={handleBookmarkToggle}
            onHeartToggle={handleHeartToggle}
          />
          <ExploreSection
            sort={exploreSort}
            onChangeSort={setExploreSort}
            cards={exploreSectionCards}
            interactionById={interactionById}
            onBookmarkToggle={handleBookmarkToggle}
            onHeartToggle={handleHeartToggle}
          />
          {!listLoading && listError ? (
            <div className="px-[16px] pb-[12px] text-[12px] font-[400] leading-[16.8px] text-[#C06D43]">{listError}</div>
          ) : null}
        </main>
        <FloatingActionsExact />
      </div>
    </div>
  );
}


