import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import bellIcon from '../assets/images/bell.svg';
import SearchBar from '../components/common/SearchBar';
import { CardSkeleton, PageMessage } from '../components/common/Skeleton';
import HorizontalScroll from '../components/common/HorizontalScroll';
import { useToast } from '../components/common/useToast';
import Layout from '../components/layout/Layout';
import { getExperiences, getMe, type Experience, type UserSummary } from '../lib/api';
import { clearSession, getAccessToken, getStoredUser } from '../lib/session';
import { resolveErrorMessage } from '../lib/resolve-error-message';

type SortKey = 'latest' | 'popular';

type HomeCategory = {
  id: number;
  label: string;
  description: string[];
  theme: string;
};

const HOME_CATEGORIES: HomeCategory[] = [
  {
    id: 1,
    label: '온라인 판매 · 이커머스',
    description: ['스마트스토어, 쿠팡, 오픈마켓', '구매대행, 위탁판매, 드롭쉬핑', '해외구매, 수입판매, 재고형 쇼핑몰'],
    theme: 'bg-[linear-gradient(180deg,rgba(63,109,86,0.12)_0%,rgba(20,28,23,0.84)_100%)]',
  },
  {
    id: 2,
    label: '콘텐츠 · SNS 기반',
    description: ['유튜브, 블로그, 인스타그램', '틱톡, 뉴스레터, 숏폼 채널', '개인 브랜딩 기반 수익화'],
    theme: 'bg-[linear-gradient(180deg,rgba(145,108,56,0.10)_0%,rgba(35,26,13,0.88)_100%)]',
  },
  {
    id: 3,
    label: '디지털 상품 · 지식 판매',
    description: ['전자책, 강의, 템플릿', '노션, PDF, 디자인 리소스 판매', '지식형 상품 제작과 운영'],
    theme: 'bg-[linear-gradient(180deg,rgba(87,78,122,0.14)_0%,rgba(20,20,30,0.88)_100%)]',
  },
  {
    id: 4,
    label: '플랫폼 기반 노동형',
    description: ['배달, 대리운전, 쿠팡플렉스', '단기 알바 플랫폼, 설문 참여', '앱테크와 시간교환형 부업'],
    theme: 'bg-[linear-gradient(180deg,rgba(57,102,92,0.14)_0%,rgba(14,24,22,0.88)_100%)]',
  },
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

function extractTags(experience: Experience) {
  const raw = [
    experience.businessType ?? '',
    experience.category.name,
    ...experience.failureReasons,
    ...experience.difficulties,
  ].filter(Boolean);

  return Array.from(new Set(raw)).slice(0, 4);
}

function matchesCategory(experience: Experience, categoryId: number) {
  return experience.category.id === categoryId;
}

function HomeStoryCard({ experience, compact = false }: { experience: Experience; compact?: boolean }) {
  const tags = extractTags(experience);
  const preview = experience.content.replace(/\s+/g, ' ').trim();

  return (
    <article
      className={`rounded-[4px] bg-white px-[16px] py-[12px] shadow-[0_0_2.5px_rgba(0,0,0,0.15)] ${
        compact ? 'w-[300px] shrink-0' : 'w-full'
      }`}
    >
      <div className="flex flex-col gap-[16px]">
        <div className="flex flex-col gap-[8px]">
          <div className="flex flex-wrap gap-[4px]">
            {tags.slice(0, compact ? 3 : 4).map((tag, index) => {
              const palette = index === 0 ? 'bg-[#C06D43]' : index === 1 ? 'bg-[#5A876E]' : 'bg-[#BABABA]';
              return (
                <span
                  key={`${experience.id}-${tag}`}
                  className={`${palette} rounded-[4px] px-[4px] py-[2px] text-[12px] font-[400] leading-[14px] text-white`}
                >
                  {tag}
                </span>
              );
            })}
          </div>

          <div className="flex gap-[8px]">
            <div className="min-w-0 flex-1">
              <h3 className="text-[16px] font-[500] leading-[19px] text-[#131416]">{experience.title}</h3>
              <p className="mt-[4px] line-clamp-2 text-[14px] font-[400] leading-[19.6px] text-[#494949]">
                {preview || '아직 등록된 본문 내용이 없습니다.'}
              </p>
            </div>

            <div className="relative hidden h-[98px] w-[98px] shrink-0 rounded-[4px] bg-[#8A8A8A] sm:block">
              {experience.analysis?.keywords?.length ? (
                <span className="absolute bottom-0 right-0 flex h-[20px] w-[20px] items-center justify-center rounded-[4px] bg-[rgba(0,0,0,0.25)] text-[12px] font-[500] leading-[16px] text-white">
                  {experience.analysis.keywords.length}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-[8px] text-[12px] leading-[16.8px] text-[#8A8A8A]">
          <div className="flex min-w-0 flex-wrap items-center gap-[4px]">
            <span>{experience.author.nickname || '익명'}</span>
            <span>•</span>
            <span>{formatDate(experience.createdAt)}</span>
            <span>•</span>
            <span>조회 {experience.viewCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-[2px]">
            <span>저장</span>
            <span>{experience.likeCount.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function CategoryGridCard({ category }: { category: HomeCategory }) {
  return (
    <Link
      to={`/explore?tag=${category.id}`}
      className={`relative flex h-[160px] min-h-[160px] flex-col justify-end overflow-hidden rounded-[16px] p-[16px] text-white ${category.theme}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.20),transparent_45%)]" />
      <div className="relative">
        <h3 className="text-[14px] font-[600] leading-[16.8px]">{category.label}</h3>
        <div className="mt-[4px] space-y-[1px] text-[10px] font-[300] leading-[14px] text-white/92">
          {category.description.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
    </Link>
  );
}

function CategoryPill({
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
      className={`h-[25px] shrink-0 rounded-[999px] px-[12px] text-[13px] leading-[15.6px] ${
        active ? 'bg-[#1F1F1F] font-[600] text-white' : 'bg-[#F2F2F2] font-[400] text-[#757575]'
      }`}
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
      className={`flex h-[40px] min-w-0 flex-1 items-center justify-center rounded-[999px] text-[14px] font-[500] leading-[16.8px] ${
        active ? 'border-2 border-[#DEDEDE] bg-white text-black' : 'text-[#5D5D5D]'
      }`}
    >
      {label}
    </button>
  );
}

export default function HomeV3() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(HOME_CATEGORIES[0].id);
  const [sort, setSort] = useState<SortKey>('latest');
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
      setListError(
        resolveErrorMessage(loadError, '경험 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'),
      );
    } finally {
      setListLoading(false);
    }
  }

  const popularCategoryExperiences = useMemo(() => {
    const filtered = experiences.filter((experience) => matchesCategory(experience, selectedCategoryId));
    return (filtered.length ? filtered : experiences).slice(0, 3);
  }, [experiences, selectedCategoryId]);

  const exploreExperiences = useMemo(() => experiences.slice(0, 4), [experiences]);

  return (
    <Layout showHeader={false} title="사이드픽">
      <div className="bg-white">
        <section className="border-b border-[#F3F3F3] bg-white px-[16px] pb-[12px] pt-[20px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[6px]">
              <div className="h-[16px] w-[16px] rounded-[4px] bg-[#131416]" />
              <span className="text-[16px] font-[700] leading-[16px] text-[#131416]">sidePick</span>
            </div>

            <button type="button" className="flex h-[24px] w-[24px] items-center justify-center">
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
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-[600] leading-[19.2px] text-[#131416]">부업 카테고리</h2>
            <button
              type="button"
              onClick={() => navigate('/explore')}
              className="text-[12px] font-[400] leading-[14.4px] text-[#757575] underline"
            >
              전체 보기
            </button>
          </div>

          <div className="mt-[16px] grid grid-cols-2 gap-[10px]">
            {HOME_CATEGORIES.map((category) => (
              <CategoryGridCard key={category.id} category={category} />
            ))}
          </div>

          <div className="mt-[12px] text-center">
            <button
              type="button"
              onClick={() => navigate('/explore')}
              className="text-[12px] font-[400] leading-[14.4px] text-[#757575] underline"
            >
              펼쳐 보기
            </button>
          </div>
        </section>

        <section className="px-[16px] py-[12px]">
          <h2 className="text-[16px] font-[600] leading-[19.2px] text-[#131416]">인기 부업</h2>

          <div className="mt-[16px]">
            <HorizontalScroll wrapperClassName="w-full" contentClassName="gap-[8px] pr-[16px]">
              {HOME_CATEGORIES.map((category) => (
                <CategoryPill
                  key={category.id}
                  active={selectedCategoryId === category.id}
                  label={category.label.split(' · ')[0]}
                  onClick={() => setSelectedCategoryId(category.id)}
                />
              ))}
            </HorizontalScroll>
          </div>

          <div className="mt-[16px]">
            {listLoading ? (
              <div className="flex gap-[16px] overflow-hidden">
                <div className="w-[300px] shrink-0">
                  <CardSkeleton />
                </div>
                <div className="w-[300px] shrink-0">
                  <CardSkeleton />
                </div>
              </div>
            ) : listError ? (
              <PageMessage message={listError} tone="error" />
            ) : popularCategoryExperiences.length ? (
              <HorizontalScroll wrapperClassName="w-full" contentClassName="gap-[16px] pr-[16px]">
                {popularCategoryExperiences.map((experience) => (
                  <Link key={experience.id} to={`/experiences/${experience.id}`} className="block">
                    <HomeStoryCard compact experience={experience} />
                  </Link>
                ))}
              </HorizontalScroll>
            ) : (
              <PageMessage message="표시할 사례가 없습니다." />
            )}
          </div>
        </section>

        <section className="px-[16px] py-[12px]">
          <h2 className="text-[16px] font-[600] leading-[19.2px] text-[#131416]">탐색</h2>

          <div className="mt-[10px] rounded-[99px] bg-[#DEDEDE]">
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

          <div className="py-[12px] text-center">
            <button
              type="button"
              onClick={() => navigate('/explore')}
              className="text-[12px] font-[400] leading-[14.4px] text-[#5D5D5D] underline"
            >
              모든 사례 보기
            </button>
          </div>
        </section>
      </div>
    </Layout>
  );
}
