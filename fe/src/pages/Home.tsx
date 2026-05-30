import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import bellIcon from '../assets/images/bell.svg';
import brandMarkIcon from '../assets/auth-figma/brand-mark.svg';
import SearchBar from '../components/common/SearchBar';
import { CardSkeleton, PageMessage } from '../components/common/Skeleton';
import HorizontalScroll from '../components/common/HorizontalScroll';
import { useToast } from '../components/common/useToast';
import Layout from '../components/layout/Layout';
import { getExperiences, getMe, type Experience, type UserSummary } from '../lib/api';
import { CATEGORY_VISUALS } from '../lib/category-visuals';
import { getExperienceImageMeta } from '../lib/experience-images';
import { resolveErrorMessage } from '../lib/resolve-error-message';
import { clearSession, getAccessToken, getStoredUser } from '../lib/session';

type SortKey = 'latest' | 'popular';
type PopularTopic = '유튜브' | '쇼핑몰' | '블로그' | '주식';

type HomeCategoryCard = {
  id: number;
  label: string;
  description: string[];
  theme: string;
  accent: string;
};

const CATEGORY_CARD_THEMES: Array<{ theme: string; accent: string }> = [
  {
    theme: 'bg-[linear-gradient(180deg,rgba(40,46,50,0.08)_0%,rgba(15,18,20,0.88)_100%)]',
    accent: 'from-[rgba(111,160,132,0.5)]',
  },
  {
    theme: 'bg-[linear-gradient(180deg,rgba(51,46,41,0.08)_0%,rgba(22,18,15,0.9)_100%)]',
    accent: 'from-[rgba(167,118,77,0.48)]',
  },
  {
    theme: 'bg-[linear-gradient(180deg,rgba(49,49,55,0.08)_0%,rgba(17,17,22,0.9)_100%)]',
    accent: 'from-[rgba(143,140,167,0.46)]',
  },
  {
    theme: 'bg-[linear-gradient(180deg,rgba(40,46,44,0.08)_0%,rgba(14,19,17,0.9)_100%)]',
    accent: 'from-[rgba(105,138,117,0.44)]',
  },
];

const POPULAR_TOPICS: PopularTopic[] = ['유튜브', '쇼핑몰', '블로그', '주식'];
const DEFAULT_CATEGORY_COUNT = 4;

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
  ].filter(Boolean);

  return Array.from(new Set(raw)).slice(0, 4);
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

  const keywordsByTopic: Record<PopularTopic, string[]> = {
    유튜브: ['유튜브', 'youtube', '영상', '쇼츠', '크리에이터'],
    쇼핑몰: ['쇼핑몰', '스마트스토어', '이커머스', '쿠팡', '스토어'],
    블로그: ['블로그', 'blog', '브런치', '콘텐츠', '워드프레스'],
    주식: ['주식', '코인', 'etf', '투자', '재테크'],
  };

  return keywordsByTopic[topic].some((keyword) => haystack.includes(keyword));
}

function BookmarkIcon() {
  return (
    <svg aria-hidden="true" className="h-[14px] w-[14px]" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 5.5C7 4.67 7.67 4 8.5 4H15.5C16.33 4 17 4.67 17 5.5V19L12 15.7L7 19V5.5Z"
        stroke="#A8A8A8"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HomeStoryCard({ experience, compact = false }: { experience: Experience; compact?: boolean }) {
  const tags = extractTags(experience);
  const preview = experience.content.replace(/\s+/g, ' ').trim() || '아직 본문이 등록되지 않았습니다.';
  const imageMeta = getExperienceImageMeta(experience);

  return (
    <article
      className={`rounded-[8px] border border-[#ECECEC] bg-white px-[12px] py-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] ${
        compact ? 'w-[296px] shrink-0' : 'w-full'
      }`}
    >
      <div className="flex flex-col gap-[10px]">
        <div className="flex flex-wrap gap-[4px]">
          {tags.slice(0, 4).map((tag, index) => {
            const palette = index === 0 ? 'bg-[#D07B48]' : index === 1 ? 'bg-[#7DA884]' : 'bg-[#BABABA]';
            return (
              <span
                key={`${experience.id}-${tag}-${index}`}
                className={`${palette} rounded-[4px] px-[4px] py-[2px] text-[10px] font-[500] leading-[12px] text-white`}
              >
                {tag}
              </span>
            );
          })}
        </div>

        <div className="flex gap-[10px]">
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-[15px] font-[600] leading-[20px] text-[#131416]">{experience.title}</h3>
            <p className="mt-[4px] line-clamp-2 text-[12px] font-[400] leading-[16px] text-[#5D5D5D]">{preview}</p>
          </div>

          {imageMeta.primaryImageUrl ? (
            <div className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-[4px] bg-[#9F9F9F]">
              <img src={imageMeta.primaryImageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.2),transparent_52%)]" />
              <span className="absolute bottom-[6px] right-[6px] flex h-[18px] min-w-[18px] items-center justify-center rounded-[4px] bg-[rgba(0,0,0,0.3)] px-[4px] text-[10px] font-[600] leading-[12px] text-white">
                {imageMeta.imageCount}
              </span>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-[8px] text-[11px] leading-[13px] text-[#A8A8A8]">
          <div className="flex min-w-0 flex-wrap items-center gap-[4px]">
            <span className="truncate">{experience.author.nickname || '익명'}</span>
            <span>·</span>
            <span>{formatDate(experience.createdAt)}</span>
            <span>·</span>
            <span>조회 {experience.viewCount.toLocaleString()}</span>
          </div>
          <div className="flex shrink-0 items-center gap-[2px]">
            <BookmarkIcon />
            <span>{experience.likeCount.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function CategoryGridCard({ category }: { category: HomeCategoryCard }) {
  return (
    <Link
      to={`/explore?tag=${category.id}`}
      className={`relative flex h-[160px] min-h-[160px] flex-col justify-end overflow-hidden rounded-[16px] p-[16px] text-white ${category.theme}`}
    >
      <div
        className={`absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--tw-gradient-stops),transparent_48%)] ${category.accent} to-transparent`}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.18)_55%,rgba(0,0,0,0.74)_100%)]" />
      <div className="relative">
        <h3 className="text-[14px] font-[600] leading-[17px]">{category.label}</h3>
        <div className="mt-[6px] space-y-[1px] text-[10px] font-[300] leading-[14px] text-white/92">
          {category.description.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
    </Link>
  );
}

function TopicPill({
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
      className={`shrink-0 border-b-[1.5px] px-[8px] pb-[7px] pt-[3px] text-[14px] leading-[17px] ${
        active ? 'border-[#5A876E] font-[600] text-[#5A876E]' : 'border-transparent font-[400] text-[#BABABA]'
      }`}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

function SortSegment({
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
      className={`flex h-[32px] min-w-0 flex-1 items-center justify-center rounded-[999px] px-[12px] text-[12px] leading-[14px] ${
        active ? 'bg-white font-[500] text-[#141414] shadow-[0_2px_8px_rgba(0,0,0,0.08)]' : 'font-[400] text-[#8A8A8A]'
      }`}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [selectedTopic, setSelectedTopic] = useState<PopularTopic>('유튜브');
  const [sort, setSort] = useState<SortKey>('latest');
  const [expandedCategories, setExpandedCategories] = useState(false);
  const [user, setUser] = useState<UserSummary | null>(() => getStoredUser());
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');

  useEffect(() => {
    void loadExperiences(sort);
  }, [sort]);

  useEffect(() => {
    if (listError) {
      showToast(listError);
    }
  }, [listError, showToast]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token || user) {
      return;
    }

    void getMe(token)
      .then((payload) => setUser(payload.user))
      .catch(() => {
        clearSession();
        setUser(null);
      });
  }, [user]);

  async function loadExperiences(nextSort: SortKey) {
    setListLoading(true);
    setListError('');

    try {
      const payload = await getExperiences({
        page: 0,
        size: 20,
        sort: nextSort,
      });
      setExperiences(payload.experiences);
    } catch (loadError) {
      setListError(resolveErrorMessage(loadError, '경험 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'));
    } finally {
      setListLoading(false);
    }
  }

  const homeCategories = useMemo<HomeCategoryCard[]>(
    () =>
      CATEGORY_VISUALS.map((item, index) => ({
        id: item.id,
        label: item.label,
        description: item.descriptionLines,
        theme: CATEGORY_CARD_THEMES[index % CATEGORY_CARD_THEMES.length].theme,
        accent: CATEGORY_CARD_THEMES[index % CATEGORY_CARD_THEMES.length].accent,
      })),
    [],
  );

  const visibleCategories = useMemo(
    () => (expandedCategories ? homeCategories : homeCategories.slice(0, DEFAULT_CATEGORY_COUNT)),
    [expandedCategories, homeCategories],
  );

  const popularExperiences = useMemo(() => {
    const topicMatched = experiences.filter((experience) => matchesPopularTopic(experience, selectedTopic));
    return (topicMatched.length ? topicMatched : experiences).slice(0, 6);
  }, [experiences, selectedTopic]);

  const exploreExperiences = useMemo(() => experiences.slice(0, 4), [experiences]);

  return (
    <Layout showHeader={false} title="사이드픽">
      <div className="bg-white">
        <section className="bg-white px-[16px] pb-[12px] pt-[20px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[2px]">
              <img src={brandMarkIcon} alt="" className="h-[16px] w-[16px]" />
              <span className="text-[20px] font-[400] uppercase leading-[16px] tracking-[0.02em] text-[#5A876E]">
                SidePick
              </span>
            </div>

            <button
              type="button"
              className="flex h-[24px] w-[24px] items-center justify-center"
              aria-label="알림"
              onClick={() => showToast('알림 기능은 아직 준비 중입니다.')}
            >
              <img src={bellIcon} alt="" className="h-[24px] w-[24px]" />
            </button>
          </div>

          <div className="mt-[20px]">
            <SearchBar
              placeholder="원하는 실패 경험을 검색해보세요"
              value=""
              readOnly
              onClick={() => navigate('/explore?mode=search')}
            />
          </div>
        </section>

        <section className="px-[16px] py-[12px]">
          <div className="flex items-end justify-between">
            <h2 className="text-[16px] font-[600] leading-[19px] text-[#131416]">부업 카테고리</h2>
            <button
              type="button"
              onClick={() => navigate('/explore')}
              className="text-[12px] font-[400] leading-[14px] text-[#8A8A8A]"
            >
              전체보기
            </button>
          </div>

          <div className="mt-[16px] grid grid-cols-2 gap-[10px]">
            {visibleCategories.map((category) => (
              <CategoryGridCard key={category.id} category={category} />
            ))}
          </div>

          <div className="mt-[12px] text-center">
            <button
              type="button"
              onClick={() => setExpandedCategories((prev) => !prev)}
              className="text-[12px] font-[400] leading-[14px] text-[#757575] underline"
              aria-expanded={expandedCategories}
            >
              {expandedCategories ? '접어 보기' : '펼쳐 보기'}
            </button>
          </div>
        </section>

        <section className="px-[16px] py-[12px]">
          <h2 className="text-[16px] font-[600] leading-[19px] text-[#131416]">인기 부업</h2>

          <div className="mt-[16px] flex items-center gap-[2px]">
            {POPULAR_TOPICS.map((topic) => (
              <TopicPill key={topic} active={selectedTopic === topic} label={topic} onClick={() => setSelectedTopic(topic)} />
            ))}
          </div>

          <div className="mt-[16px]">
            {listLoading ? (
              <div className="flex gap-[14px] overflow-hidden">
                <div className="w-[296px] shrink-0">
                  <CardSkeleton />
                </div>
                <div className="w-[296px] shrink-0">
                  <CardSkeleton />
                </div>
              </div>
            ) : listError ? (
              <PageMessage message={listError} tone="error" />
            ) : popularExperiences.length ? (
              <HorizontalScroll wrapperClassName="w-full" contentClassName="gap-[10px] pr-[16px]">
                {popularExperiences.map((experience) => (
                  <Link key={experience.id} to={`/experiences/${experience.id}`} className="block">
                    <HomeStoryCard compact experience={experience} />
                  </Link>
                ))}
              </HorizontalScroll>
            ) : (
              <PageMessage message="조건에 맞는 사례가 없습니다." />
            )}
          </div>
        </section>

        <section className="px-[16px] py-[12px]">
          <h2 className="text-[16px] font-[600] leading-[19px] text-[#131416]">탐색</h2>

          <div className="mt-[10px] w-full rounded-[999px] bg-[#E1E1E1] p-[3px]">
            <div className="flex items-center">
              <SortSegment active={sort === 'latest'} label="최근 등록된 사례" onClick={() => setSort('latest')} />
              <SortSegment active={sort === 'popular'} label="인기 사례" onClick={() => setSort('popular')} />
            </div>
          </div>

          <div className="mt-[12px] flex flex-col gap-[10px]">
            {listLoading ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : listError ? (
              <PageMessage message={listError} tone="error" />
            ) : exploreExperiences.length ? (
              exploreExperiences.map((experience) => (
                <Link key={experience.id} to={`/experiences/${experience.id}`} className="block">
                  <HomeStoryCard experience={experience} />
                </Link>
              ))
            ) : (
              <PageMessage message="아직 등록된 사례가 없습니다." />
            )}
          </div>

          <div className="pt-[12px] text-center">
            <button
              type="button"
              onClick={() => navigate('/explore')}
              className="text-[12px] font-[400] leading-[14px] text-[#5D5D5D] underline"
            >
              모든 사례 보기
            </button>
          </div>
        </section>
      </div>
    </Layout>
  );
}
