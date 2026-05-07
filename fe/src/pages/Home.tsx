import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import amountIcon from '../assets/images/amount.svg';
import durationIcon from '../assets/images/duration.svg';
import viewsIcon from '../assets/images/views.svg';
import HorizontalScroll from '../components/common/HorizontalScroll';
import SearchBar from '../components/common/SearchBar';
import Layout from '../components/layout/Layout';
import { getExperiences, getMe, type Experience, type UserSummary } from '../lib/api';
import { CATEGORY_TAG_LABELS } from '../lib/category-visuals';
import { resolveErrorMessage } from '../lib/resolve-error-message';
import { clearSession, getAccessToken, getStoredUser } from '../lib/session';

type SortKey = 'latest' | 'popular';

const CATEGORY_TABS = CATEGORY_TAG_LABELS.slice(0, 4) as string[];

function formatDuration(months: number | null) {
  if (!months || months <= 0) {
    return '기간 미정';
  }

  if (months < 12) {
    return `${months}개월`;
  }

  const years = Math.floor(months / 12);
  const remainMonths = months % 12;
  return remainMonths ? `${years}년 ${remainMonths}개월` : `${years}년`;
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

function getKeywordLabels(experience: Experience) {
  const merged = [
    ...experience.failureReasons,
    ...experience.difficulties,
    experience.failureReason ?? '',
  ].filter(Boolean);

  return Array.from(new Set(merged)).slice(0, 3);
}

function matchesCategory(experience: Experience, category: string) {
  const haystacks = [
    experience.category.name,
    experience.title,
    experience.content,
    experience.businessType ?? '',
  ].map((value) => value.toLowerCase());

  return haystacks.some((value) => value.includes(category.toLowerCase()));
}

function HomeCard({
  experience,
  compact = false,
  onClick,
}: {
  experience: Experience;
  compact?: boolean;
  onClick: () => void;
}) {
  const tags = getKeywordLabels(experience);
  const amountLabel = `${(experience.investmentAmount ?? 0).toLocaleString()}원`;
  const durationLabel = formatDuration(experience.durationMonths);
  const viewsLabel = experience.viewCount.toLocaleString();
  const dateLabel = formatDate(experience.createdAt);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[127px] appearance-none flex-col items-start gap-[10px] rounded-[10px] border-[1px] border-solid border-[#EEEEEE] bg-[#F8F8F8] p-[16px] text-left ${
        compact ? 'w-[240px] shrink-0' : 'w-full'
      }`}
    >
      <div className="flex w-full flex-col items-start gap-[8px]">
        <div className={`flex w-full items-start ${compact ? 'gap-[4px]' : 'justify-between'}`}>
          <div className="flex shrink-0 items-start gap-[4px]">
            {tags.length ? (
              tags.map((tag) => (
                <span
                  key={`${experience.id}-${tag}`}
                  className="flex h-[20px] shrink-0 items-center justify-center rounded-[999px] bg-[#BABABA] px-[8px]"
                >
                  <span className="whitespace-nowrap font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#FFFFFF] [font-feature-settings:'case'_1]">
                    {tag}
                  </span>
                </span>
              ))
            ) : (
              <span className="flex h-[20px] shrink-0 items-center justify-center rounded-[999px] bg-[#BABABA] px-[8px]">
                <span className="whitespace-nowrap font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#FFFFFF] [font-feature-settings:'case'_1]">
                  키워드 없음
                </span>
              </span>
            )}
          </div>
          {!compact ? (
            <span className="shrink-0 whitespace-nowrap text-center font-['Pretendard'] text-[12px] font-[600] leading-[14.4px] tracking-[0px] text-[#494949] underline [font-feature-settings:'case'_1]">
              자세히 보기
            </span>
          ) : null}
        </div>

        <h3 className="w-full truncate font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-[#000000] [font-feature-settings:'case'_1]">
          {experience.title}
        </h3>
      </div>

      <div className="grid w-full grid-cols-[repeat(2,minmax(0,1fr))] gap-x-[10px] gap-y-[4px]">
        <MetaItem icon={durationIcon} label={durationLabel} />
        <MetaItem icon={amountIcon} label={amountLabel} />
        <MetaItem icon={viewsIcon} label={viewsLabel} />
        <div className="flex shrink-0 items-center justify-self-start">
          <span className="truncate font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#8A8A8A] [font-feature-settings:'case'_1]">
            {dateLabel}
          </span>
        </div>
      </div>
    </button>
  );
}

function MetaItem({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex shrink-0 items-center gap-[4px] justify-self-start">
      <img src={icon} alt="" className="h-[15.993px] w-[15.993px] shrink-0" />
      <span className="truncate font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#8A8A8A] [font-feature-settings:'case'_1]">
        {label}
      </span>
    </div>
  );
}

function CategoryTab({
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
      className="flex shrink-0 appearance-none items-start border-0 bg-transparent p-[0px]"
    >
      <span
        className={`flex shrink-0 items-center justify-center px-[8px] py-[4px] ${
          active ? 'border-b-[1.5px] border-solid border-[#494949]' : ''
        }`}
      >
        <span
          className={`whitespace-nowrap text-center font-['Pretendard'] text-[14px] leading-[16.8px] tracking-[0px] [font-feature-settings:'case'_1] ${
            active ? 'font-[600] text-[#494949]' : 'font-[400] text-[#BABABA]'
          }`}
        >
          {label}
        </span>
      </span>
    </button>
  );
}

function SegmentButton({
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
      className={`flex min-w-0 flex-1 appearance-none items-center justify-center border-0 py-[10px] ${
        active
          ? 'rounded-[999px] border-[2px] border-solid border-[#E6E6E6] bg-[#FFFFFF]'
          : 'rounded-[4px] bg-transparent'
      }`}
    >
      <span
        className={`whitespace-nowrap text-center font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] tracking-[0px] [font-feature-settings:'case'_1] ${
          active ? 'text-[#131416]' : 'text-[#757575]'
        }`}
      >
        {label}
      </span>
    </button>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const keyword = '';
  const [sort, setSort] = useState<SortKey>('latest');
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORY_TABS[0]);
  const [user, setUser] = useState<UserSummary | null>(() => getStoredUser());
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');

  useEffect(() => {
    void loadExperiences(keyword, sort);
  }, [keyword, sort]);

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

  async function loadExperiences(searchKeyword: string, nextSort: SortKey) {
    setListLoading(true);
    setListError('');

    try {
      const payload = await getExperiences({
        page: 0,
        size: 20,
        q: searchKeyword.trim() || undefined,
        sort: nextSort,
      });
      setExperiences(payload.experiences);
    } catch (loadError) {
      setListError(
        resolveErrorMessage(
          loadError,
          '경험 목록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.',
        ),
      );
    } finally {
      setListLoading(false);
    }
  }

  function moveToAuth(nextPath: string, reason: string) {
    navigate(`/auth?next=${encodeURIComponent(nextPath)}&reason=${encodeURIComponent(reason)}`);
  }

  function handlePrimaryAction() {
    if (!user) {
      moveToAuth('/create', '경험 등록과 분석은 로그인 후 이용할 수 있어요.');
      return;
    }

    navigate('/create');
  }

  function handleExperienceClick(experienceId: number) {
    navigate(`/experiences/${experienceId}`);
  }

  const featuredExperiences = useMemo(() => {
    const filtered = experiences.filter((experience) =>
      matchesCategory(experience, selectedCategory),
    );
    return (filtered.length ? filtered : experiences).slice(0, 3);
  }, [experiences, selectedCategory]);

  const exploreExperiences = useMemo(() => experiences.slice(0, 4), [experiences]);

  return (
    <Layout title="사이드픽" leftType="menu" showRightIcon>
      <div className="bg-[#FFFFFF]">
        <section className="h-[52px] w-[375px] bg-[#FFFFFF] px-[16px] pb-[12px]">
          <SearchBar
            placeholder="원하는 실패 사례를 검색해보세요!"
            value={keyword}
            onClick={() => navigate('/explore')}
            readOnly
          />
        </section>

        <section className="flex w-full flex-col items-center gap-[16px] px-[16px] py-[12px]">
          <h2 className="w-full font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-[#131416] [font-feature-settings:'case'_1]">
            인기 카테고리
          </h2>

          <HorizontalScroll
            wrapperClassName="w-full"
            contentClassName="horizontal-scroll-content--tags"
          >
            {CATEGORY_TABS.map((tab) => (
              <CategoryTab
                key={tab}
                active={selectedCategory === tab}
                label={tab}
                onClick={() => setSelectedCategory(tab)}
              />
            ))}
          </HorizontalScroll>

          {featuredExperiences.length ? (
            <HorizontalScroll
              wrapperClassName="w-full"
              contentClassName="horizontal-scroll-content--cards px-[16px]"
            >
              {featuredExperiences.map((experience) => (
                <HomeCard
                  key={experience.id}
                  experience={experience}
                  compact
                  onClick={() => handleExperienceClick(experience.id)}
                />
              ))}
            </HorizontalScroll>
          ) : (
            <div className="h-[127px] w-full rounded-[10px] border-[1px] border-solid border-[#EEEEEE] bg-[#F8F8F8] px-[16px] py-[32px] text-center text-[14px] font-[400] leading-[19.6px] tracking-[0px] text-[#757575]">
              표시할 인기 사례가 없습니다.
            </div>
          )}
        </section>

        <section className="w-full bg-[#FFFFFF] p-[16px]">
          <div className="flex w-full flex-col items-start gap-[39px] rounded-[10px] bg-[#757575] p-[20px] text-[#FFFFFF]">
            <div className="flex w-full flex-col items-start gap-[8px]">
              <p className="font-['Pretendard'] text-[20px] font-[600] leading-[24px] tracking-[0px] text-[#FFFFFF] [font-feature-settings:'case'_1]">
                실패도 좋은 경험이에요
              </p>
              <div className="w-[314px] font-['Pretendard'] text-[12px] font-[300] leading-[16.8px] tracking-[0px] text-[#FFFFFF] [font-feature-settings:'case'_1]">
                <p>경험을 등록하면 AI가 실패 원인을 분석해주고</p>
                <p>비슷한 사례들을 보여주며 원하는 선택을 돕습니다.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePrimaryAction}
              className="flex h-[40px] w-full appearance-none items-center justify-between rounded-[8px] border-0 bg-[#FFFFFF] px-[12px] py-[5px] font-['Pretendard'] text-[12px] font-[600] leading-[14.4px] tracking-[0px] text-[#000000]"
            >
              <span className="whitespace-nowrap text-center font-['Pretendard'] text-[12px] font-[600] leading-[14.4px] tracking-[0px] text-[#000000] [font-feature-settings:'case'_1]">
                내 경험 분석하러 가기
              </span>
              <span className="relative h-[16px] w-[16px] shrink-0 overflow-hidden" aria-hidden="true">
                <svg
                  className="absolute inset-[20.83%_33.33%] h-[58.34%] w-[33.34%]"
                  fill="none"
                  viewBox="0 0 6 10"
                >
                  <path
                    d="M1 1L5 5L1 9"
                    stroke="#000000"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.6"
                  />
                </svg>
              </span>
            </button>
          </div>
        </section>

        <section className="flex w-full flex-col items-start justify-center gap-[10px] bg-[#FFFFFF] px-[16px] py-[12px]">
          <h2 className="w-full font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-[#131416] [font-feature-settings:'case'_1]">
            탐색
          </h2>

          <div className="flex h-[616px] w-full flex-col items-center gap-[12px]">
            <div className="w-full rounded-[999px] bg-[#E6E6E6]">
              <div className="flex w-full items-center justify-center">
                <SegmentButton
                  active={sort === 'latest'}
                  label="최신 등록 사례"
                  onClick={() => setSort('latest')}
                />
                <SegmentButton
                  active={sort === 'popular'}
                  label="인기 사례"
                  onClick={() => setSort('popular')}
                />
              </div>
            </div>

            <div className="flex w-full flex-col items-start gap-[10px]">
              {listLoading ? (
                <div className="h-[127px] w-full rounded-[10px] border-[1px] border-solid border-[#EEEEEE] bg-[#F8F8F8] px-[16px] py-[32px] text-center text-[14px] font-[400] leading-[19.6px] tracking-[0px] text-[#757575]">
                  사례를 불러오는 중입니다.
                </div>
              ) : listError ? (
                <div className="h-[127px] w-full rounded-[10px] border-[1px] border-solid border-[#F5D3D3] bg-[#FFF5F5] px-[16px] py-[32px] text-center text-[14px] font-[400] leading-[19.6px] tracking-[0px] text-[#D33B3B]">
                  {listError}
                </div>
              ) : exploreExperiences.length ? (
                exploreExperiences.map((experience) => (
                  <HomeCard
                    key={experience.id}
                    experience={experience}
                    onClick={() => handleExperienceClick(experience.id)}
                  />
                ))
              ) : (
                <div className="h-[127px] w-full rounded-[10px] border-[1px] border-solid border-[#EEEEEE] bg-[#F8F8F8] px-[16px] py-[32px] text-center text-[14px] font-[400] leading-[19.6px] tracking-[0px] text-[#757575]">
                  아직 등록된 사례가 없습니다.
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate('/explore')}
              className="appearance-none border-0 bg-transparent p-[0px]"
            >
              <span className="text-[12px] leading-[14.4px] text-[#5D5D5D] underline [font-feature-settings:'case'_1]">
                모든 사례 보기
              </span>
            </button>
          </div>
        </section>
      </div>
    </Layout>
  );
}
