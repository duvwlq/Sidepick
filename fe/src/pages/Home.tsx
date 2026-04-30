import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import amountIcon from '../assets/images/amount.svg';
import durationIcon from '../assets/images/duration.svg';
import viewsIcon from '../assets/images/views.svg';
import SearchBar from '../components/common/SearchBar';
import Layout from '../components/layout/Layout';
import {
  getExperiences,
  getMe,
  type Experience,
  type UserSummary,
} from '../lib/api';
import { clearSession, getAccessToken, getStoredUser } from '../lib/session';

type SortKey = 'latest' | 'popular';

const CATEGORY_TABS = ['유튜브', '쇼핑몰', '블로그', '주식'] as const;

function formatDuration(months: number | null) {
  if (!months || months <= 0) {
    return '소요 시간';
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
      className={`flex flex-col items-start gap-[10px] rounded-[10px] border border-[#EEE] bg-[#F8F8F8] p-4 text-left ${
        compact ? 'w-[240px] shrink-0' : 'w-full'
      }`}
    >
      <div className="flex w-full flex-col gap-2">
        <div className={`flex w-full items-start ${compact ? 'gap-1' : 'justify-between'}`}>
          <div className="flex flex-wrap gap-1">
            {tags.length ? (
              tags.map((tag) => (
                <span
                  key={`${experience.id}-${tag}`}
                  className="flex h-5 items-center justify-center rounded-[999px] bg-[#BABABA] px-2 text-[12px] font-normal leading-[1.2] text-white"
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="flex h-5 items-center justify-center rounded-[999px] bg-[#BABABA] px-2 text-[12px] font-normal leading-[1.2] text-white">
                키워드
              </span>
            )}
          </div>
          {!compact ? (
            <span className="shrink-0 text-[12px] font-semibold leading-[1.2] text-[#494949] underline">
              자세히보기
            </span>
          ) : null}
        </div>

        <h3 className="w-full text-[16px] font-semibold leading-[1.2] text-black">
          {experience.title}
        </h3>
      </div>

      <div className="grid w-full grid-cols-2 gap-x-[10px] gap-y-1">
        <div className="flex items-center gap-1 text-[12px] font-normal leading-[1.4] text-[#8A8A8A]">
          <img src={durationIcon} alt="" className="h-4 w-4 shrink-0" />
          <span>{durationLabel}</span>
        </div>
        <div className="flex items-center gap-1 text-[12px] font-normal leading-[1.4] text-[#8A8A8A]">
          <img src={amountIcon} alt="" className="h-4 w-4 shrink-0" />
          <span>{amountLabel}</span>
        </div>
        <div className="flex items-center gap-1 text-[12px] font-normal leading-[1.4] text-[#8A8A8A]">
          <img src={viewsIcon} alt="" className="h-4 w-4 shrink-0" />
          <span>{viewsLabel}</span>
        </div>
        <div className="text-[12px] font-normal leading-[1.4] text-[#8A8A8A]">{dateLabel}</div>
      </div>
    </button>
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
    <button type="button" onClick={onClick} className="shrink-0">
      <span
        className={`flex items-center justify-center px-2 py-1 text-[14px] leading-[1.2] ${
          active
            ? 'border-b-[1.5px] border-[#494949] font-semibold text-[#494949]'
            : 'font-normal text-[#BABABA]'
        }`}
      >
        {label}
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
      className={`flex h-[33px] flex-1 items-center justify-center rounded-full py-[10px] text-[14px] font-medium leading-[1.2] ${
        active ? 'border-2 border-[#E6E6E6] bg-white text-[#131416]' : 'text-[#757575]'
      }`}
    >
      {label}
    </button>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState<SortKey>('latest');
  const [selectedCategory, setSelectedCategory] = useState<(typeof CATEGORY_TABS)[number]>(
    CATEGORY_TABS[0],
  );
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
        loadError instanceof Error
          ? loadError.message
          : '경험 목록을 불러오지 못했습니다.',
      );
    } finally {
      setListLoading(false);
    }
  }

  function moveToAuth(nextPath: string, reason: string) {
    navigate(
      `/auth?next=${encodeURIComponent(nextPath)}&reason=${encodeURIComponent(reason)}`,
    );
  }

  function handlePrimaryAction() {
    if (!user) {
      moveToAuth('/create', '경험 등록과 분석은 로그인 후 이용할 수 있어요.');
      return;
    }

    navigate('/create');
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
      <div className="bg-white">
        <section className="bg-white px-4 pb-3">
          <SearchBar
            placeholder="원하는 실패 사례를 검색해보세요!"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </section>

        <section className="flex flex-col items-center gap-4 px-4 py-3">
          <h2 className="w-full text-[16px] font-semibold leading-[1.2] text-[#131416]">
            인기 카테고리
          </h2>

          <div className="flex w-full items-center">
            {CATEGORY_TABS.map((tab) => (
              <CategoryTab
                key={tab}
                active={selectedCategory === tab}
                label={tab}
                onClick={() => setSelectedCategory(tab)}
              />
            ))}
          </div>

          {featuredExperiences.length ? (
            <div className="-mx-4 w-[375px] overflow-x-auto pl-4">
              <div className="flex items-center gap-4 pr-4">
                {featuredExperiences.map((experience) => (
                  <HomeCard
                    key={experience.id}
                    experience={experience}
                    compact
                    onClick={() => navigate(`/experiences/${experience.id}`)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full rounded-[10px] bg-[#F8F8F8] px-4 py-8 text-center text-sm text-[#757575]">
              표시할 인기 사례가 없습니다.
            </div>
          )}
        </section>

        <section className="bg-white p-4">
          <div className="flex flex-col items-start gap-[39px] rounded-[10px] bg-[#757575] p-5 text-white">
            <div className="flex w-full flex-col gap-2">
              <h2 className="text-[20px] font-semibold leading-[1.2]">
                실패도 좋은 경험이예요!
              </h2>
              <div className="text-[12px] font-light leading-[1.4] text-white">
                <p>경험을 등록하면 AI가 나의 실패 원인을 분석해주고,</p>
                <p>나와 유사한 사례들을 보여주며 원하는 선택을 하도록 도와드릴게요!</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePrimaryAction}
              className="flex h-10 w-full items-center justify-between rounded-[8px] bg-white px-3 py-[5px] text-[12px] font-semibold leading-[1.2] text-black"
            >
              <span>나의 경험 분석하러 가기</span>
              <span className="text-base leading-none">→</span>
            </button>
          </div>
        </section>

        <section className="flex flex-col items-start justify-center gap-[10px] px-4 py-3">
          <h2 className="w-full text-[16px] font-semibold leading-[1.2] text-[#131416]">
            탐색
          </h2>

          <div className="flex w-full flex-col items-center gap-3">
            <div className="w-full rounded-[999px] bg-[#E6E6E6]">
              <div className="flex w-full items-center justify-center">
                <SegmentButton
                  active={sort === 'latest'}
                  label="최근 등록된 사례"
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
                <div className="w-full rounded-[10px] bg-[#F8F8F8] px-4 py-8 text-center text-sm text-[#757575]">
                  사례를 불러오는 중입니다.
                </div>
              ) : listError ? (
                <div className="w-full rounded-[10px] bg-[#FFF5F5] px-4 py-8 text-center text-sm text-[#D33B3B]">
                  {listError}
                </div>
              ) : exploreExperiences.length ? (
                exploreExperiences.map((experience) => (
                  <HomeCard
                    key={experience.id}
                    experience={experience}
                    onClick={() => navigate(`/experiences/${experience.id}`)}
                  />
                ))
              ) : (
                <div className="w-full rounded-[10px] bg-[#F8F8F8] px-4 py-8 text-center text-sm text-[#757575]">
                  아직 등록된 사례가 없습니다.
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate('/explore')}
              className="text-[12px] font-normal leading-[1.2] text-[#5D5D5D] underline"
            >
              모든 사례 보기
            </button>
          </div>
        </section>
      </div>
    </Layout>
  );
}
