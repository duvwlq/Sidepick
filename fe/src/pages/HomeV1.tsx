import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import batteryFrameIcon from '../assets/auth-figma/battery-frame.svg';
import bookmarkIcon from '../assets/explore-figma/bookmark.svg';
import cellularConnectionIcon from '../assets/auth-figma/cellular-connection.svg';
import editIcon from '../assets/explore-figma/edit.svg';
import bellIcon from '../assets/home-v1-figma/icons/bell-figma.svg';
import brandMarkIcon from '../assets/home-v1-figma/icons/brand-mark-figma.svg';
import guideIcon from '../assets/home-v1-figma/icons/guide-figma.svg';
import homeIcon from '../assets/home-v1-figma/icons/home-figma.svg';
import plusIcon from '../assets/home-v1-figma/icons/plus-figma.svg';
import searchIcon from '../assets/home-v1-figma/icons/search-figma.svg';
import searchNavIcon from '../assets/home-v1-figma/icons/search-nav-figma.svg';
import userIcon from '../assets/home-v1-figma/icons/user-figma.svg';
import wifiIcon from '../assets/auth-figma/wifi.svg';
import categoryCommerceImage from '../assets/home-v1-figma/category-commerce.webp';
import categoryContentImage from '../assets/home-v1-figma/category-content.webp';
import categoryDigitalImage from '../assets/home-v1-figma/category-digital.webp';
import categoryPlatformImage from '../assets/home-v1-figma/category-platform.webp';
import { CardSkeleton, PageMessage } from '../components/common/Skeleton';
import { useToast } from '../components/common/useToast';
import { getExperiences, type Experience } from '../lib/api';
import { getExperienceImageMeta } from '../lib/experience-images';
import { resolveErrorMessage } from '../lib/resolve-error-message';
import { getAccessToken } from '../lib/session';

type SortKey = 'latest' | 'popular';
type PopularTopic = '유튜브' | '쇼핑몰' | '블로그' | '주식';

type CategoryCardData = {
  id: number;
  title: string;
  subtitle: string[];
  image: string;
  imageClassName?: string;
};

const POPULAR_TOPICS: PopularTopic[] = ['유튜브', '쇼핑몰', '블로그', '주식'];

const CATEGORY_CARDS: CategoryCardData[] = [
  {
    id: 1,
    title: '온라인 판매 · 이커머스',
    subtitle: ['스마트스토어/ 쿠팡, 오픈마켓', '/구매대행/ 위탁판매 (드롭쉬핑)', '/해외구매, 수입판매', '/재고 기반 쇼핑몰 등'],
    image: categoryCommerceImage,
    imageClassName: 'object-center',
  },
  {
    id: 2,
    title: '콘텐츠·SNS 기반',
    subtitle: ['유튜브/ 블로그/ 인스타그램', '/틱톡/ 뉴스레터', '/개인 브랜딩 기반 등'],
    image: categoryContentImage,
    imageClassName: 'object-[54%_50%]',
  },
  {
    id: 3,
    title: '디지털 상품·지식 판매',
    subtitle: ['전자책 판매/ 강의 제작 (클래스, 인강)/ 템플릿, 디자인 판매', '/ 노션, PDF 자료 판매 등'],
    image: categoryDigitalImage,
    imageClassName: 'object-[50%_42%]',
  },
  {
    id: 4,
    title: '플랫폼 기반 노동형',
    subtitle: ['배달 (배민, 쿠팡이츠 등)/ 대리운전/ 쿠팡플렉스/ 단기 알바 플랫폼/ 설문 참여, 앱테크'],
    image: categoryPlatformImage,
    imageClassName: 'object-[56%_44%]',
  },
  {
    id: 5,
    title: '중고/재판매',
    subtitle: ['리셀, 위탁판매', '중고거래'],
    image: categoryCommerceImage,
  },
  {
    id: 6,
    title: '무자본 프리랜서',
    subtitle: ['번역, 외주집', '포트폴리오'],
    image: categoryDigitalImage,
  },
  {
    id: 7,
    title: '오프라인 부업',
    subtitle: ['이벤트, 알바', '행사 스태프'],
    image: categoryPlatformImage,
  },
  {
    id: 8,
    title: '커뮤니티 운영',
    subtitle: ['모임, 멤버십', '구독형 운영'],
    image: categoryContentImage,
  },
];

function normalizeHomeText(text: string) {
  return text;
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

function extractKeywordTags(experience: Experience) {
  const raw = [
    ...(experience.analysis?.keywords ?? []),
    ...experience.failureReasons,
    ...experience.difficulties,
    experience.businessType ?? '',
  ]
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => value !== experience.category.name);

  const unique = Array.from(new Set(raw));
  return [unique[0] ?? '키워드', unique[1] ?? '키워드'];
}

function buildStoryBadges(experience: Experience) {
  const [keywordA, keywordB] = extractKeywordTags(experience);
  const isSuccess = experience.caseStatus === 'SUCCESS';

  return [
    {
      label: isSuccess ? '성공' : '실패',
      className: isSuccess ? 'bg-[#5A876E] font-[400] text-white' : 'bg-[#C06D43] font-[400] text-white',
      widthClassName: 'max-w-[44px]',
    },
    {
      label: experience.category.name || '카테고리',
      className: 'bg-[#CBE5D8] font-[500] text-[#5A876E]',
      widthClassName: 'max-w-[116px]',
    },
    {
      label: keywordA,
      className: 'bg-[#D8D8D8] font-[400] text-white',
      widthClassName: 'max-w-[74px]',
    },
    {
      label: keywordB,
      className: 'bg-[#D8D8D8] font-[400] text-white',
      widthClassName: 'max-w-[74px]',
    },
  ];
}

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

  const keywordMap: Record<PopularTopic, string[]> = {
    유튜브: ['유튜브', 'youtube', '영상', '쇼츠', '채널'],
    쇼핑몰: ['쇼핑몰', '스마트스토어', '쿠팡', '이커머스', '스토어'],
    블로그: ['블로그', 'blog', '브런치', '워드프레스', '콘텐츠'],
    주식: ['주식', 'etf', '코인', '투자', '트레이딩'],
  };

  return keywordMap[topic].some((keyword) => haystack.includes(keyword));
}

function SearchBarV1({ onClick }: { onClick: () => void }) {
  return (
    <label className="relative block h-[36px] w-[343px] cursor-text">
      <span className="absolute inset-0 flex items-center justify-between rounded-[999px] border border-[#EEEEEE] bg-[#F8F8F8] px-[16px] py-[7px]">
        <span className="translate-y-[0.35px] font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] tracking-[0px] text-[#BABABA]">
          원하는 실패 사례를 검색해보세요!
        </span>
        <img src={searchIcon} alt="" className="h-[20px] w-[20px] shrink-0 translate-y-[0.25px]" />
      </span>
      <input
        type="text"
        readOnly
        value=""
        onFocus={onClick}
        onClick={onClick}
        className="absolute inset-0 h-full w-full cursor-text rounded-[999px] bg-transparent px-[16px] text-transparent caret-transparent outline-none focus-visible:ring-2 focus-visible:ring-[#5A876E]/30"
        aria-label="검색창 열기"
      />
    </label>
  );
}

function StatusBarV1() {
  return (
    <div className="flex h-[59px] w-full items-center px-[24px] pb-[19px] pt-[21px]">
      <div className="flex min-w-0 flex-1 items-center">
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

function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex w-full items-center justify-between">
      <h2 className="font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-black">
        {normalizeHomeText(title)}
      </h2>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="translate-y-[0.35px] font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#8A8A8A]"
        >
          {normalizeHomeText(actionLabel)}
        </button>
      ) : null}
    </div>
  );
}

function CategoryCardV1({ category }: { category: CategoryCardData }) {
  return (
    <Link
      to={`/explore?categoryId=${category.id}`}
      className="relative flex h-[160px] w-full overflow-hidden rounded-[16px] bg-[#E6ECE8] transition-transform duration-150 hover:scale-[0.995] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A876E]/35"
    >
      <img
        src={category.image}
        alt=""
        className={`absolute inset-0 h-full w-full object-cover ${category.imageClassName ?? 'object-center'}`}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,1)_100%)]" />
      <div className="relative mt-auto flex w-full flex-col gap-[3px] px-[16px] pb-[16px]">
        <h3 className="font-['Pretendard'] text-[14px] font-[600] leading-[16.8px] tracking-[0px] text-white">
          {normalizeHomeText(category.title)}
        </h3>
        <div className="flex flex-col gap-[0px]">
          {category.subtitle.map((line) => (
            <span
              key={`${category.id}-${line}`}
              className="font-['Pretendard'] text-[10px] font-[300] leading-[14px] tracking-[0px] text-white"
            >
              {normalizeHomeText(line)}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

function PopularTabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: PopularTopic;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center justify-center border-b-[1.5px] px-[8px] py-[4px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A876E]/25 ${
        active ? 'border-[#D07B48]' : 'border-transparent'
      }`}
    >
      <span
        className={`font-['Pretendard'] text-[14px] leading-[16.8px] tracking-[0px] ${
          active ? 'font-[600] text-[#5A876E]' : 'font-[400] text-[#BABABA]'
        }`}
      >
        {normalizeHomeText(label)}
      </span>
    </button>
  );
}

function StoryCardV1({
  experience,
  horizontal = false,
  onSuccessClick,
}: {
  experience: Experience;
  horizontal?: boolean;
  onSuccessClick: (experience: Experience) => void;
}) {
  const preview = experience.content.replace(/\s+/g, ' ').trim() || '아직 본문이 등록되지 않았습니다.';
  const imageMeta = getExperienceImageMeta(experience);
  const badges = buildStoryBadges(experience);
  const [fallbackKeywordA, fallbackKeywordB] = extractKeywordTags(experience);
  const hasRegisteredImage = Boolean(imageMeta.primaryImageUrl?.trim());
  const showSuccessCta = experience.caseStatus !== 'SUCCESS';
  const isCompactHorizontal = horizontal && hasRegisteredImage && !showSuccessCta;

  if (horizontal) {
    return (
      <article
        className={`w-[311px] shrink-0 rounded-[4px] bg-white shadow-[0_0_2px_rgba(0,0,0,0.10)] ${
          isCompactHorizontal ? 'h-[135px]' : 'h-[173px]'
        }`}
      >
        <div className="flex h-full w-full flex-col rounded-[4px] bg-white px-[16px] py-[12px]">
          <div className="flex w-full flex-col gap-[8px]">
            <div className="flex w-full items-center">
              <div className="flex items-start gap-[4px]">
                {badges.map((badge, index) => (
                  <span
                    key={`${experience.id}-${badge.label}-${index}`}
                    className={`inline-flex h-[18px] ${badge.widthClassName} items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap rounded-[4px] px-[4px] py-[2px] font-['Pretendard'] text-[12px] leading-[14.4px] tracking-[0px] ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                ))}
              </div>
            </div>

            {hasRegisteredImage ? (
              <div className="flex w-full items-start gap-[8px]">
                <div className="h-[60px] w-[80px] shrink-0 overflow-hidden rounded-[4px] bg-[#8A8A8A]">
                  <img src={imageMeta.primaryImageUrl} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="flex h-[60px] w-[188px] shrink-0 flex-col gap-[4px]">
                  <h3 className="line-clamp-1 w-[188px] font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] tracking-[0px] text-[#131416]">
                    {experience.title}
                  </h3>
                  <p className="w-[188px] overflow-hidden text-ellipsis whitespace-nowrap font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949]">
                    {preview}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex h-[60px] w-full items-start gap-[8px]">
                <div className="flex h-[60px] w-[276px] shrink-0 flex-col gap-[3px]">
                  <h3 className="line-clamp-1 min-h-[17px] w-[276px] font-['Pretendard'] text-[13px] font-[500] leading-[15.6px] tracking-[0px] text-[#131416]">
                    {experience.title}
                  </h3>
                  <p className="w-[276px] overflow-hidden text-ellipsis whitespace-nowrap font-['Pretendard'] text-[11px] font-[400] leading-[15.4px] tracking-[0px] text-[#494949]">
                    {preview}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex w-full items-center justify-between">
            <div className="flex items-start gap-[4px] whitespace-nowrap font-['Pretendard'] text-[11px] font-[300] leading-[15.4px] tracking-[0px] text-[#8A8A8A]">
              <span>{experience.author.nickname || '닉네임'}</span>
              <span>·</span>
              <span>{formatDate(experience.createdAt)}</span>
              <span>·</span>
              <span className="flex items-center gap-[2px]">
                <span>조회</span>
                <span>{experience.viewCount.toLocaleString()}</span>
              </span>
            </div>

            <div className="flex items-center gap-[2px]">
              <img src={bookmarkIcon} alt="" className="h-[14px] w-[14px]" />
              <span className="font-['Pretendard'] text-[11px] font-[400] leading-[15.4px] tracking-[0px] text-[#8A8A8A]">
                {experience.likeCount.toLocaleString()}
              </span>
            </div>
          </div>

          {showSuccessCta ? (
            <div className="mt-auto flex w-full flex-col items-end justify-center pt-[2px] pr-[2px]">
              <button
                type="button"
                onClick={() => onSuccessClick(experience)}
                className="inline-flex items-center justify-center rounded-[8px] bg-[#5A876E] px-[12px] py-[7px] font-['Pretendard'] text-[12px] font-[500] leading-[14.4px] tracking-[0px] text-white"
              >
                성공 사례 보기
              </button>
            </div>
          ) : null}
        </div>
      </article>
    );
  }

  if (!horizontal) {
    return (
      <article className="w-full rounded-[4px] bg-white shadow-[0_0_2px_rgba(0,0,0,0.10)]">
        <div className="flex w-full flex-col gap-[8px] rounded-[4px] bg-white px-[16px] py-[12px]">
          <div className="flex w-full flex-col">
            <div className="flex w-full items-center">
              <div className="flex items-start gap-[4px]">
                {badges.map((badge, index) => (
                  <span
                    key={`${experience.id}-${badge.label}-${index}`}
                    className={`inline-flex h-[18px] ${badge.widthClassName} items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap rounded-[4px] px-[4px] py-[2px] font-['Pretendard'] text-[12px] leading-[14.4px] tracking-[0px] ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex h-[60px] w-full items-start gap-[8px] pt-[8px]">
              {hasRegisteredImage ? (
                <div className="h-[60px] w-[80px] shrink-0 overflow-hidden rounded-[4px] bg-[#8A8A8A]">
                  <img src={imageMeta.primaryImageUrl} alt="" className="h-full w-full object-cover" />
                </div>
              ) : null}

              <div className={`flex h-[60px] shrink-0 flex-col gap-[4px] ${hasRegisteredImage ? 'w-[220px]' : 'w-full'}`}>
                <h3 className={`line-clamp-1 font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] tracking-[0px] text-[#131416] ${hasRegisteredImage ? 'w-[220px]' : 'w-full'}`}>
                  {experience.title}
                </h3>
                <p className={`${hasRegisteredImage ? 'w-[220px]' : 'w-full'} overflow-hidden text-ellipsis whitespace-nowrap font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949]`}>
                  {preview}
                </p>
              </div>
            </div>
          </div>

          <div className="flex w-full items-center justify-between">
            <div className="flex items-start gap-[4px] whitespace-nowrap font-['Pretendard'] text-[12px] font-[300] leading-[16.8px] tracking-[0px] text-[#8A8A8A]">
              <span>{experience.author.nickname || '닉네임'}</span>
              <span>·</span>
              <span>{formatDate(experience.createdAt)}</span>
              <span>·</span>
              <span className="flex items-center gap-[2px]">
                <span>조회</span>
                <span>{experience.viewCount.toLocaleString()}</span>
              </span>
            </div>

            <div className="flex items-center gap-[2px]">
              <img src={bookmarkIcon} alt="" className="h-[14px] w-[14px]" />
              <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#8A8A8A]">
                {experience.likeCount.toLocaleString()}
              </span>
            </div>
          </div>

          {showSuccessCta ? (
            <div className="flex w-full flex-col items-end justify-center pt-[2px] pr-[2px]">
              <button
                type="button"
                onClick={() => onSuccessClick(experience)}
                className="inline-flex items-center justify-center rounded-[8px] bg-[#5A876E] px-[12px] py-[7px] font-['Pretendard'] text-[12px] font-[500] leading-[14.4px] tracking-[0px] text-white"
              >
                성공 사례 보기
              </button>
            </div>
          ) : null}
        </div>
      </article>
    );
  }

  return (
    <article
      className={`overflow-hidden rounded-[12px] border border-[#F0F0F0] bg-white ${
        horizontal ? 'w-[311px] shrink-0' : 'w-full'
      }`}
    >
      <div className={`${horizontal ? 'px-[14px] py-[14px]' : 'px-[14px] py-[12px]'}`}>
        <div className="flex flex-col gap-[9px]">
          <div className="flex flex-wrap gap-[4px]">
            {[fallbackKeywordA, fallbackKeywordB].map((tag, index) => (
              <span
                key={`${experience.id}-${tag}-${index}`}
                className={`rounded-[4px] px-[4px] py-[2px] font-['Pretendard'] text-[10px] font-[400] leading-[12px] tracking-[0px] ${
                  index === 0 ? 'bg-[#D07B48]' : index === 1 ? 'bg-[#CBE5D8] text-[#5A876E]' : 'bg-[#D8D8D8]'
                }`}
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-start gap-[8px]">
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 font-['Pretendard'] text-[12px] font-[500] leading-[14.4px] tracking-[0px] text-[#131416]">
                {experience.title}
              </h3>
              <p className="mt-[3px] line-clamp-2 font-['Pretendard'] text-[8px] font-[400] leading-[11.2px] tracking-[0px] text-[#494949]">
                {preview}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-[6px]">
              {imageMeta.primaryImageUrl ? (
                <div className="relative h-[81px] w-[81px] overflow-hidden rounded-[4px] bg-[#E1E1E1]">
                  <img src={imageMeta.primaryImageUrl} alt="" className="h-full w-full object-cover" />
                  <div className="absolute bottom-[6px] right-[6px] flex h-[18px] min-w-[18px] items-center justify-center rounded-[4px] bg-[rgba(0,0,0,0.35)] px-[4px]">
                    <span className="font-['Pretendard'] text-[10px] font-[600] leading-[12px] tracking-[0px] text-white">
                      {Math.max(imageMeta.imageCount, 1)}
                    </span>
                  </div>
                </div>
              ) : null}

              {!horizontal && showSuccessCta ? (
                <button
                  type="button"
                  onClick={() => onSuccessClick(experience)}
                  className="inline-flex h-[31px] items-center justify-center rounded-[999px] bg-[#5A876E] px-[12px] font-['Pretendard'] text-[12px] font-[500] leading-[14.4px] tracking-[0px] text-white"
                >
                  성공 사례 보기
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-between pt-[1px]">
            <div className="flex flex-wrap items-center gap-[4px] font-['Pretendard'] text-[8px] font-[300] leading-[11.2px] tracking-[0px] text-[#A8A8A8]">
              <span>{experience.author.nickname || '닉네임'}</span>
              <span>쨌</span>
              <span>{formatDate(experience.createdAt)}</span>
              <span>쨌</span>
              <span>{`조회 ${experience.viewCount.toLocaleString()}`}</span>
            </div>

            <div className="flex items-center gap-[2px]">
              <img src={bookmarkIcon} alt="" className="h-[14px] w-[14px]" />
              <span className="font-['Pretendard'] text-[8px] font-[400] leading-[11.2px] tracking-[0px] text-[#A8A8A8]">
                {experience.likeCount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
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
      className={`flex h-[32px] w-[155.5px] items-center justify-center rounded-[999px] pb-[1px] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A876E]/25 ${
        active ? 'bg-white shadow-[0_0_5px_rgba(0,0,0,0.15)]' : 'bg-transparent'
      }`}
    >
      <span
        className={`translate-y-[0.5px] font-['Pretendard'] text-[14px] leading-[16.8px] tracking-[0px] ${
          active ? 'font-[500] text-black' : 'font-[400] text-[#8A8A8A]'
        }`}
      >
        {label}
      </span>
    </button>
  );
}

function TextLinkButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#757575] underline decoration-[0.5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A876E]/20 active:opacity-70"
    >
      {label}
    </button>
  );
}

function BottomNavV1() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = getAccessToken();

  function move(path: string, requiresAuth?: boolean) {
    if (!token && requiresAuth) {
      navigate(
        `/auth?next=${encodeURIComponent(path)}&reason=${encodeURIComponent(
          '마이페이지는 로그인이 필요한 서비스입니다.',
        )}`,
      );
      return;
    }

    navigate(path);
  }

  const menus = [
    { label: '홈', path: '/', icon: homeIcon, iconClassName: 'h-[22px] w-[20px]', active: location.pathname === '/' || location.pathname === '/v1/home' },
    {
      label: '탐색',
      path: '/explore',
      icon: searchNavIcon,
      iconClassName: 'h-[20px] w-[20px]',
      active: location.pathname.startsWith('/explore') || location.pathname.startsWith('/v1/explore'),
    },
    {
      label: '가이드',
      path: '/faq',
      icon: guideIcon,
      iconClassName: 'h-[22px] w-[18px]',
      active: location.pathname === '/faq' || location.pathname === '/mypage/faq',
    },
    {
      label: 'MY',
      path: '/mypage',
      icon: userIcon,
      iconClassName: 'h-[20px] w-[18px]',
      active: location.pathname.startsWith('/mypage') && location.pathname !== '/mypage/faq',
      requiresAuth: true,
    },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-[375px] -translate-x-1/2">
      <nav className="flex h-[84px] items-start justify-between rounded-t-[24px] border border-[#F3F3F3] bg-white px-[30px] pb-[22px] pt-[12px] shadow-[0_-1px_10px_rgba(0,0,0,0.08)]">
        {menus.map((menu) => (
          <button
            key={menu.path}
            type="button"
            onClick={() => move(menu.path, menu.requiresAuth)}
            className="flex h-[40px] min-w-[50px] flex-col items-center justify-start gap-[3px] rounded-[10px] transition-opacity duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A876E]/25 active:opacity-70"
            aria-current={menu.active ? 'page' : undefined}
          >
            <img src={menu.icon} alt="" className={menu.iconClassName} />
            <span
              className={`font-['Pretendard'] text-[12px] leading-[12px] tracking-[0px] ${
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

void BottomNavV1;

function BottomNavV1Clean() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = getAccessToken();

  function move(path: string, requiresAuth?: boolean) {
    if (!token && requiresAuth) {
      navigate(
        `/auth?next=${encodeURIComponent(path)}&reason=${encodeURIComponent(
          '마이페이지는 로그인이 필요한 서비스입니다.',
        )}`,
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
    <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-[375px] -translate-x-1/2">
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

export default function HomeV1() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [selectedTopic, setSelectedTopic] = useState<PopularTopic>('유튜브');
  const [sort, setSort] = useState<SortKey>('latest');
  const [expandedCategories, setExpandedCategories] = useState(false);
  const [fabExpanded, setFabExpanded] = useState(false);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadExperiences(sort);
  }, [sort]);

  useEffect(() => {
    setFabExpanded(false);
  }, [sort, selectedTopic, expandedCategories]);

  async function loadExperiences(nextSort: SortKey) {
    setLoading(true);
    setError('');
    try {
      const payload = await getExperiences({
        page: 0,
        size: 20,
        sort: nextSort,
      });
      setExperiences(payload.experiences);
    } catch (loadError) {
      setError(resolveErrorMessage(loadError, '사례 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'));
    } finally {
      setLoading(false);
    }
  }

  const visibleCategories = useMemo(
    () => (expandedCategories ? CATEGORY_CARDS : CATEGORY_CARDS.slice(0, 4)),
    [expandedCategories],
  );

  const popularExperiences = useMemo(() => {
    const topicMatched = experiences.filter((experience) => matchesPopularTopic(experience, selectedTopic));
    return (topicMatched.length ? topicMatched : experiences).slice(0, 6);
  }, [experiences, selectedTopic]);

  const exploreExperiences = useMemo(() => experiences.slice(0, 4), [experiences]);
  const isInitialLoading = loading && experiences.length === 0;
  const isRefreshing = loading && experiences.length > 0;

  function moveToSuccessCases(experience: Experience) {
    if (experience.caseStatus === 'SUCCESS') {
      navigate(`/experiences/${experience.id}`);
      return;
    }
    navigate(`/explore?feed=success&categoryId=${experience.category.id}&sourceExperienceId=${experience.id}`);
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <div className="mx-auto min-h-screen w-full max-w-[375px] bg-white">
        <StatusBarV1 />

        <header>
          <div className="flex h-[64px] items-center justify-between bg-white px-[16px] pb-[18px] pt-[22px]">
            <div className="flex w-[118px] items-center gap-[2px]">
              <img src={brandMarkIcon} alt="" className="h-[16px] w-[16px] shrink-0" />
              <span className="font-['Bruno_Ace_SC'] text-[20px] font-[400] leading-[16px] tracking-[0px] text-[#5A876E]">
                sidePick
              </span>
            </div>

            <button
              type="button"
              onClick={() => showToast('알림 기능은 아직 준비 중입니다.')}
              className="flex h-[24px] w-[24px] items-center justify-center rounded-[999px] transition-colors duration-150 hover:bg-[#F5F5F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A876E]/25 active:bg-[#EFEFEF]"
              aria-label="알림"
            >
              <img src={bellIcon} alt="" className="h-[24px] w-[24px]" />
            </button>
          </div>

          <div className="bg-white px-[16px] pb-[12px] pt-[2px]">
              <SearchBarV1 onClick={() => navigate('/explore?mode=search')} />
          </div>
        </header>

        <main className="pb-[196px]">
          <section className="px-[16px] pt-[18px]">
            <SectionHeader title="부업 카테고리" actionLabel="전체보기" onAction={() => navigate('/explore')} />

            <div className="grid grid-cols-2 gap-[10px] pt-[16px]">
              {visibleCategories.map((category) => (
                <CategoryCardV1 key={category.id} category={category} />
              ))}
            </div>

            <div className="flex justify-center pt-[12px]">
              <TextLinkButton
                label={expandedCategories ? '접어 보기' : '펼쳐 보기'}
                onClick={() => setExpandedCategories((previous) => !previous)}
              />
            </div>
          </section>

          <section className="px-[16px] pt-[12px]">
            <SectionHeader title="인기 부업" />

            <div className="flex items-center pt-[16px]">
              {POPULAR_TOPICS.map((topic) => (
                <PopularTabButton
                  key={topic}
                  active={selectedTopic === topic}
                  label={topic}
                  onClick={() => setSelectedTopic(topic)}
                />
              ))}
            </div>

            <div className="overflow-x-auto pt-[16px]">
              <div className="flex h-[173px] w-max items-center gap-[10px] pr-[16px]">
                {loading ? (
                  <>
                    <div className="w-[311px] shrink-0">
                      <CardSkeleton />
                    </div>
                    <div className="w-[311px] shrink-0">
                      <CardSkeleton />
                    </div>
                  </>
                ) : error ? (
                  <div className="w-[311px]">
                    <PageMessage message={error} tone="error" />
                  </div>
                ) : popularExperiences.length ? (
                  popularExperiences.map((experience) => (
                    <Link
                      key={experience.id}
                      to={`/experiences/${experience.id}`}
                      className="block rounded-[12px] transition-transform duration-150 hover:translate-y-[-1px] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A876E]/25"
                    >
                      <StoryCardV1 experience={experience} horizontal onSuccessClick={moveToSuccessCases} />
                    </Link>
                  ))
                ) : (
                  <div className="w-[311px]">
                    <PageMessage message="조건에 맞는 사례가 없습니다." />
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="px-[16px] pt-[12px]">
            <SectionHeader title="탐색" />

            <div className="flex justify-center pt-[16px]">
              <div className="flex h-[32px] w-[311px] items-center rounded-[999px] bg-[#E1E1E1]">
                <ExploreSegmentButton
                  active={sort === 'latest'}
                  label="최근 등록된 사례"
                  onClick={() => {
                    if (sort === 'latest') return;
                    setSort('latest');
                  }}
                />
                <ExploreSegmentButton
                  active={sort === 'popular'}
                  label="인기 사례"
                  onClick={() => {
                    if (sort === 'popular') return;
                    setSort('popular');
                  }}
                />
              </div>
            </div>

            <div
              className={`flex flex-col gap-[12px] pt-[16px] transition-opacity duration-200 ${
                isRefreshing ? 'opacity-70' : 'opacity-100'
              }`}
            >
              {isInitialLoading ? (
                <>
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                </>
              ) : error ? (
                <PageMessage message={error} tone="error" />
              ) : exploreExperiences.length ? (
                  exploreExperiences.map((experience) => (
                  <Link
                    key={experience.id}
                    to={`/experiences/${experience.id}`}
                    className="block rounded-[12px] transition-transform duration-150 hover:translate-y-[-1px] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A876E]/25"
                  >
                    <StoryCardV1 experience={experience} onSuccessClick={moveToSuccessCases} />
                  </Link>
                ))
              ) : (
                <PageMessage message="아직 등록된 사례가 없습니다." />
              )}
            </div>

            <div className="flex justify-center pt-[28px]">
              <TextLinkButton label="모든 사례 보기" onClick={() => navigate('/explore')} />
            </div>
          </section>
        </main>

        <div className="fixed bottom-[116px] left-1/2 z-40 flex w-full max-w-[375px] -translate-x-1/2 justify-end px-[30px]">
          <div className="relative h-[36px] w-[122px]">
            {fabExpanded ? (
              <button
                type="button"
                onClick={() => {
                  const token = getAccessToken();
                  setFabExpanded(false);
                  if (!token) {
                    navigate(
                      `/auth?next=${encodeURIComponent('/create')}&reason=${encodeURIComponent(
                        '경험 작성은 로그인이 필요한 서비스입니다.',
                      )}`,
                    );
                    return;
                  }

                  navigate('/create');
                }}
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
              onClick={() => setFabExpanded((current) => !current)}
              className={`absolute right-0 top-0 flex h-[36px] w-[36px] items-center justify-center rounded-full transition-transform duration-150 hover:scale-[1.03] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5A876E]/35 ${
                fabExpanded ? 'bg-[#A8D3BD]' : 'bg-[#5A876E] shadow-[0_8px_16px_rgba(90,135,110,0.24)]'
              }`}
              aria-label={fabExpanded ? '경험 작성 닫기' : '경험 작성'}
            >
              <img
                src={plusIcon}
                alt=""
                className={`transition-transform ${fabExpanded ? 'h-[22px] w-[22px] rotate-45' : 'h-[18px] w-[18px]'}`}
              />
            </button>
          </div>
        </div>

        <BottomNavV1Clean />
      </div>
    </div>
  );
}

