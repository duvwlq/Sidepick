import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const wrapperClass = compact
    ? 'w-[240px] shrink-0 rounded-[10px] bg-[#F8F8F8] p-3'
    : 'w-full rounded-[10px] bg-[#F8F8F8] p-3';

  return (
    <button type="button" onClick={onClick} className={`${wrapperClass} text-left`}>
      <div className="mb-3 flex flex-wrap gap-1">
        {tags.length ? (
          tags.map((tag) => (
            <span
              key={`${experience.id}-${tag}`}
              className="rounded-[999px] bg-[#D9D9D9] px-2 py-[3px] text-[10px] leading-none text-white"
            >
              {tag}
            </span>
          ))
        ) : (
          <span className="rounded-[999px] bg-[#D9D9D9] px-2 py-[3px] text-[10px] leading-none text-white">
            키워드
          </span>
        )}
      </div>

      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="line-clamp-1 text-sm font-semibold leading-[1.4] text-[#131416]">
          {experience.title}
        </h3>
        {!compact ? (
          <span className="shrink-0 text-[10px] leading-[1.2] text-[#494949]">
            자세히보기
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-2 text-[10px] leading-[1.4] text-[#8A8A8A]">
        <div>
          <div>{formatDuration(experience.durationMonths)}</div>
          <div>↗↗ 조회수</div>
        </div>
        <div className="text-right">
          <div>$ 투자금</div>
          <div>{compact ? '작성 날짜' : formatDate(experience.createdAt)}</div>
        </div>
      </div>
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
      className={`flex h-[33px] flex-1 items-center justify-center rounded-full text-xs leading-[1.2] ${
        active ? 'bg-white text-[#131416]' : 'text-[#8A8A8A]'
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
      <div className="space-y-0 bg-white">
        <section className="px-4 pb-3 pt-0">
          <SearchBar
            placeholder="원하는 실패 사례를 검색해보세요!"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="h-10 rounded-full px-4"
          />
        </section>

        <section className="px-4 py-3">
          <h2 className="mb-4 text-base font-semibold leading-[1.2] text-[#131416]">
            인기 카테고리
          </h2>

          <div className="mb-4 flex items-center gap-4 text-xs leading-[1.2]">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedCategory(tab)}
                className={
                  selectedCategory === tab
                    ? 'font-semibold text-[#131416]'
                    : 'text-[#BABABA]'
                }
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="-mx-4 overflow-x-auto px-4">
            <div className="flex gap-4">
              {featuredExperiences.length ? (
                featuredExperiences.map((experience) => (
                  <HomeCard
                    key={experience.id}
                    experience={experience}
                    compact
                    onClick={() => navigate(`/experiences/${experience.id}`)}
                  />
                ))
              ) : (
                <div className="w-full rounded-[10px] bg-[#F8F8F8] px-4 py-8 text-center text-sm text-[#757575]">
                  표시할 인기 사례가 없습니다.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="px-4 py-3">
          <h2 className="mb-3 text-base font-semibold leading-[1.2] text-[#131416]">
            탐색
          </h2>

          <div className="rounded-[999px] bg-[#EEE] p-[2px]">
            <div className="flex">
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

          <div className="mt-3 space-y-[10px]">
            {listLoading ? (
              <div className="rounded-[10px] bg-[#F8F8F8] px-4 py-8 text-center text-sm text-[#757575]">
                사례를 불러오는 중입니다.
              </div>
            ) : listError ? (
              <div className="rounded-[10px] bg-[#FFF5F5] px-4 py-8 text-center text-sm text-[#D33B3B]">
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
              <div className="rounded-[10px] bg-[#F8F8F8] px-4 py-8 text-center text-sm text-[#757575]">
                아직 등록된 사례가 없습니다.
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate('/explore')}
            className="mt-3 flex w-full items-center justify-center text-xs leading-[1.2] text-[#8A8A8A]"
          >
            모든 사례 보기
          </button>
        </section>

        <section className="px-4 pb-6 pt-3">
          <div className="rounded-[10px] bg-[#6E6E6E] px-5 py-5 text-white">
            <div className="mb-10 space-y-2">
              <h2 className="text-2xl font-semibold leading-[1.2]">
                실패도 좋은 경험이예요!
              </h2>
              <p className="text-xs leading-[1.4] text-white/90">
                경험을 등록하면 AI가 나의 실패 원인을 분석해주고,
                <br />
                나와 유사한 사례를 보여주며 원하는 선택을 하도록 도와드릴게요!
              </p>
            </div>

            <button
              type="button"
              onClick={handlePrimaryAction}
              className="flex h-10 w-full items-center justify-between rounded-[8px] bg-white px-3 text-xs font-semibold text-[#131416]"
            >
              <span>내 경험 분석하러 가기</span>
              <span className="text-base">›</span>
            </button>
          </div>
        </section>
      </div>
    </Layout>
  );
}
