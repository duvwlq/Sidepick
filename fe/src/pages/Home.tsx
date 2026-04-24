import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/common/SearchBar';
import Card from '../components/common/Card';
import Layout from '../components/layout/Layout';
import {
  getExperiences,
  getMe,
  type Experience,
  type UserSummary,
} from '../lib/api';
import { clearSession, getAccessToken, getStoredUser } from '../lib/session';

type SortKey = 'latest' | 'popular';

function formatDuration(months: number | null) {
  if (!months) {
    return '기간 미입력';
  }

  if (months >= 12) {
    return months === 12 ? '1년' : `${months}개월`;
  }

  return `${months}개월`;
}

function getKeywordLabels(experience: Experience) {
  const merged = [
    ...experience.failureReasons,
    ...experience.difficulties,
    experience.failureReason ?? '',
  ].filter(Boolean);

  return Array.from(new Set(merged)).slice(0, 3);
}

export default function Home() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState<SortKey>('latest');
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
      .then((payload) => {
        setUser(payload.user);
      })
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

  const previewExperiences = useMemo(
    () => experiences.slice(0, 4),
    [experiences],
  );

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

  function handleAnalysisCardClick() {
    if (!user) {
      moveToAuth('/analysis-result', 'AI 분석 결과는 로그인 후 확인할 수 있어요.');
      return;
    }

    navigate('/analysis-result');
  }

  return (
    <Layout title="사이드픽" leftType="menu" showRightIcon>
      <div className="space-y-[30px] bg-white pb-6">
        <section className="px-4">
          <SearchBar
            placeholder="원하는 실패 경험을 검색해 보세요"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </section>

        <section className="bg-black px-5 py-5 text-white">
          <div>
            <h2 className="text-[20px] font-semibold leading-6">
              실패를 좋은 경험으로
            </h2>
            <p className="mt-2 text-xs font-light leading-[1.4] text-white">
              경험을 등록하면 AI가 실패 원인을 분석해 주고
            </p>
            <p className="text-xs font-light leading-[1.4] text-white">
              비슷한 사례를 보여주며 다음 선택을 돕습니다.
            </p>
          </div>

          <button
            type="button"
            onClick={handlePrimaryAction}
            className="mt-[39px] flex h-10 w-full items-center justify-between rounded-[8px] bg-white px-3 text-xs font-semibold text-black"
          >
            <span>
              {user ? '내 경험 분석하러 가기' : '로그인하고 경험 분석하러 가기'}
            </span>
            <span className="text-base">→</span>
          </button>
        </section>

        <section className="px-4">
          <button
            type="button"
            onClick={handleAnalysisCardClick}
            className="flex w-full items-center gap-5 rounded-[10px] border border-[#E6E6E6] bg-white p-5 text-left"
          >
            <div className="flex h-[70px] w-[70px] items-center justify-center rounded-full bg-[#F4F4F5]">
              <div className="h-[54px] w-[54px] rounded-full bg-[radial-gradient(circle,_#E5E7EB_1px,_transparent_1px)] [background-size:6px_6px]" />
            </div>
            <div className="flex-1">
              <div className="text-[20px] font-semibold leading-8 text-[#0A0A0A]">
                AI 분석 결과
              </div>
              <div className="mt-2 text-sm leading-5 text-[#4A5565]">
                AI 기반 부업 경험 분석
              </div>
              <div className="text-sm leading-5 text-[#4A5565]">
                결과 확인하기
              </div>
            </div>
            <span className="text-xl text-[#6B7280]">→</span>
          </button>
        </section>

        <section className="px-4">
          <div className="rounded-[10px] border border-[#E6E6E6] bg-white px-4 py-3">
            <div className="flex h-10 items-center rounded-full bg-[#E6E6E6] p-[2px]">
              <TabButton
                active={sort === 'latest'}
                label="최근 등록된 사례"
                onClick={() => setSort('latest')}
              />
              <TabButton
                active={sort === 'popular'}
                label="인기 사례"
                onClick={() => setSort('popular')}
              />
            </div>

            <div className="mt-3 space-y-[10px]">
              {listLoading ? (
                <div className="rounded-[10px] bg-[#EEEEEE] px-4 py-8 text-center text-sm text-[#666666]">
                  사례를 불러오는 중입니다.
                </div>
              ) : listError ? (
                <div className="rounded-[10px] bg-[#FFF5F5] px-4 py-8 text-center text-sm text-[#D33B3B]">
                  {listError}
                </div>
              ) : previewExperiences.length === 0 ? (
                <div className="rounded-[10px] bg-[#EEEEEE] px-4 py-8 text-center text-sm text-[#666666]">
                  아직 등록된 사례가 없습니다.
                </div>
              ) : (
                previewExperiences.map((experience) => {
                  const keywords = getKeywordLabels(experience);

                  return (
                    <button
                      key={experience.id}
                      type="button"
                      onClick={() => navigate(`/experiences/${experience.id}`)}
                      className="w-full text-left"
                    >
                      <Card
                        title={experience.title}
                        category={keywords[0] ?? experience.category.name}
                        failureReason={keywords[1] ?? experience.category.name}
                        duration={formatDuration(experience.durationMonths)}
                        views={experience.viewCount}
                        amount={experience.investmentAmount ?? 0}
                        date={experience.createdAt.slice(0, 10)}
                        content={experience.content}
                      />
                    </button>
                  );
                })
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate('/explore')}
              className="mt-3 w-full text-center text-xs text-[#5D5D5D] underline"
            >
              모든 사례 보기
            </button>
          </div>
        </section>
      </div>
    </Layout>
  );
}

function TabButton({
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
      className={`flex h-full flex-1 items-center justify-center rounded-full text-sm font-medium leading-[1.2] ${
        active
          ? 'border-2 border-[#E6E6E6] bg-white text-black'
          : 'text-[#5D5D5D]'
      }`}
    >
      {label}
    </button>
  );
}
