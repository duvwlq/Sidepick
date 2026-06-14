import { ChevronLeft, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorState, LoadingState, PageMessage } from '../common/Skeleton';
import { useToast } from '../common/useToast';
import HeaderBookmarkIcon from '../common/HeaderBookmarkIcon';
import BottomNav from '../layout/BottomNav';
import {
  ApiError,
  bookmarkExperience,
  createAnalysis,
  deleteExperience,
  getBookmarkStatus,
  getExperience,
  getReport,
  getRelatedSuccessCases,
  type Experience,
  unbookmarkExperience,
} from '../../lib/api';
import { mapAnalysisReport } from '../../lib/analysisMapper';
import { ERROR_CODES } from '../../lib/error-codes';
import { setFlashToast } from '../../lib/flash-toast';
import { extractExperienceImageUrls } from '../../lib/experience-images';
import { resolveErrorMessage } from '../../lib/resolve-error-message';
import { getAccessToken, getStoredUser } from '../../lib/session';
import {
  buildIssueItems,
  buildPatternItems,
  formatCurrency,
  formatDate,
  formatDuration,
  shouldUseDevFallback,
} from './aiAnalysisResult.utils';
import FailureToSuccessButton from './FailureToSuccessButton';

type Props = {
  experienceId: number | null;
};

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-[4px]">
      <p className="text-[16px] font-[600] leading-[19px] text-[#131416]">{title}</p>
      <p className="text-[12px] leading-[17px] text-[#494949]">{description}</p>
    </div>
  );
}

function FilledBadge({ text, tone = 'gray' }: { text: string; tone?: 'gray' | 'green' | 'orange' }) {
  const className =
    tone === 'orange'
      ? 'bg-[#C97945] text-white'
      : tone === 'green'
        ? 'bg-[#CBE5D8] text-[#5A876E]'
        : 'bg-[#D8D8D8] text-white';

  return <div className={`rounded-[4px] px-[4px] py-[2px] text-[12px] leading-[14px] ${className}`}>{text}</div>;
}

function MetricCard({ value, label, helper }: { value: string; label: string; helper: string }) {
  return (
    <div className="flex min-h-[83px] flex-1 flex-col items-center justify-center text-center">
      <p className="text-[20px] font-[500] leading-[25px] text-[#131416]">{value}</p>
      <p className="mt-[4px] text-[14px] font-[500] leading-[17px] text-[#131416]">{label}</p>
      <p className="mt-[4px] text-[12px] leading-[14px] text-[#8A8A8A]">{helper}</p>
    </div>
  );
}

function ProgressRow({ label, percent }: { label: string; percent: number }) {
  return (
    <div className="flex flex-col gap-[4px]">
      <div className="flex items-center justify-between">
        <span className="text-[12px] leading-[17px] text-[#131416]">{label}</span>
        <span className="text-[12px] leading-[17px] text-[#131416]">{percent}%</span>
      </div>
      <div className="h-[6px] w-full rounded-[999px] bg-[#E8ECE9]">
        <div className="h-full rounded-[999px] bg-[#5A876E]" style={{ width: `${Math.max(0, Math.min(percent, 100))}%` }} />
      </div>
    </div>
  );
}

function SimilarCaseCard({
  title,
  summary,
  similarity,
  onClick,
}: {
  title: string;
  summary: string | null;
  similarity: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col items-start gap-[8px] rounded-[10px] bg-[#F8F8F8] p-[16px] text-left"
    >
      <FilledBadge text="사례" tone="green" />
      <p className="text-[14px] font-[500] leading-[17px] text-[#131416]">{title}</p>
      {summary ? <p className="line-clamp-3 text-[12px] leading-[17px] text-[#494949]">{summary}</p> : null}
      <p className="text-[12px] leading-[17px] text-[#8A8A8A]">유사도 {similarity}%</p>
    </button>
  );
}

export default function AiAnalysisResult({ experienceId }: Props) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [experience, setExperience] = useState<Experience | null>(null);
  const [report, setReport] = useState<Awaited<ReturnType<typeof getReport>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [relatedSuccessCount, setRelatedSuccessCount] = useState(0);

  const viewer = getStoredUser();
  const isOwner = useMemo(() => {
    if (!viewer || !experience) {
      return false;
    }
    return viewer.id === experience.author.id;
  }, [experience, viewer]);

  useEffect(() => {
    if (!experienceId) {
      setLoading(false);
      setError('요청한 사례를 찾을 수 없어요.');
      return;
    }

    void loadPageData(experienceId);
  }, [experienceId]);

  useEffect(() => {
    if (error) {
      showToast(error);
    }
  }, [error, showToast]);

  useEffect(() => {
    if (!experience) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setBookmarked(false);
      return;
    }

    void getBookmarkStatus(token, experience.id)
      .then((payload) => {
        setBookmarked(payload.bookmarked);
      })
      .catch(() => {
        setBookmarked(false);
      });
  }, [experience]);

  useEffect(() => {
    if (!experience || experience.caseStatus === 'SUCCESS') {
      setRelatedSuccessCount(0);
      return;
    }

    void getRelatedSuccessCases(experience.id, 10)
      .then((payload) => {
        setRelatedSuccessCount(payload.length);
      })
      .catch(() => {
        setRelatedSuccessCount(0);
      });
  }, [experience]);

  async function loadPageData(targetExperienceId: number) {
    setLoading(true);
    setError('');

    try {
      const experiencePayload = await getExperience(targetExperienceId);
      let reportPayload = await getReport(targetExperienceId);
      const token = getAccessToken();

      if (reportPayload.reportStatus === 'NOT_READY' && token) {
        try {
          await createAnalysis(token, targetExperienceId);
          reportPayload = await getReport(targetExperienceId);
        } catch (requestError) {
          if (
            requestError instanceof ApiError &&
            (requestError.code === ERROR_CODES.ANALYSIS_TIMEOUT || requestError.code === ERROR_CODES.AI_UPSTREAM_ERROR)
          ) {
            setExperience(experiencePayload);
            setReport(reportPayload);
            return;
          }
        }
      }

      setExperience(experiencePayload);
      setReport(reportPayload);
    } catch (requestError) {
      if (shouldUseDevFallback(requestError)) {
        setError('개발 환경에서 API 서버에 연결하지 못했어요.');
        return;
      }

      setError(resolveErrorMessage(requestError, '사례 상세를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!experience) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setError('삭제하려면 로그인이 필요합니다.');
      return;
    }

    if (!window.confirm('이 사례를 삭제할까요?')) {
      return;
    }

    setDeleting(true);
    setActionMenuOpen(false);

    try {
      await deleteExperience(token, experience.id);
      setFlashToast('삭제했어요.');
      navigate('/', { replace: true });
    } catch (requestError) {
      setError(resolveErrorMessage(requestError, '사례를 삭제하지 못했어요.'));
      setDeleting(false);
    }
  }

  function handleSimilarCaseClick(caseId: string) {
    const parsed = Number(caseId.match(/(\d+)/)?.[1] ?? caseId);
    if (Number.isFinite(parsed) && parsed > 0) {
      navigate(`/experiences/${parsed}`);
      return;
    }
    navigate('/explore');
  }

  function moveToCreate() {
    const token = getAccessToken();
    if (!token) {
      navigate(
        `/auth?next=${encodeURIComponent('/create')}&reason=${encodeURIComponent('경험 등록은 로그인이 필요한 서비스입니다.')}`,
      );
      return;
    }

    navigate('/create');
  }

  const chips = useMemo(() => {
    if (!experience) {
      return [];
    }

    return [experience.businessType || '사례', experience.category.name, ...experience.failureReasons.slice(0, 2)].filter(Boolean);
  }, [experience]);

  const imageUrls = useMemo(() => (experience ? extractExperienceImageUrls(experience) : []), [experience]);
  const displayedImageUrl = imageUrls[selectedImageIndex] ?? imageUrls[0] ?? null;
  const mappedReport = useMemo(
    () => (report?.reportStatus === 'READY' ? mapAnalysisReport(report) : null),
    [report],
  );
  const issueItems = useMemo(() => (report?.reportStatus === 'READY' ? buildIssueItems(report) : []), [report]);
  const patternItems = useMemo(() => (report?.reportStatus === 'READY' ? buildPatternItems(report) : []), [report]);
  const similarCases = useMemo(() => mappedReport?.similarCases.slice(0, 2) ?? [], [mappedReport]);
  const aiSummary = useMemo(() => report?.summary?.trim() || '아직 AI 요약이 준비되지 않았어요.', [report]);
  const aiAdvice = useMemo(() => report?.advice?.slice(0, 3) ?? [], [report]);

  if (loading) {
    return (
      <div className="mx-auto min-h-screen w-full max-w-[430px] bg-white">
        <div className="px-[16px] py-[40px]">
          <LoadingState message="사례를 불러오는 중입니다." />
        </div>
      </div>
    );
  }

  if (error || !experience) {
    return (
      <div className="mx-auto min-h-screen w-full max-w-[430px] bg-white">
        <div className="px-[16px] py-[40px]">
          <ErrorState message={error || '사례를 불러오지 못했어요.'} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-[430px] bg-white">
      {actionMenuOpen ? (
        <button type="button" aria-label="메뉴 닫기" onClick={() => setActionMenuOpen(false)} className="fixed inset-0 z-40 bg-transparent" />
      ) : null}

      <div className="relative min-h-screen bg-white pb-[180px]">
        <header className="sticky top-0 z-30 bg-white">
          <div className="flex h-[64px] items-center justify-between px-[16px] py-[20px]">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                  return;
                }
                navigate('/explore');
              }}
              aria-label="뒤로가기"
              className="flex h-[24px] w-[24px] items-center justify-center text-[#000000]"
            >
              <ChevronLeft size={24} strokeWidth={1.75} />
            </button>

            <p className="text-[16px] font-[600] leading-[19px] text-[#000000]">사례 상세</p>

            <button
              type="button"
              aria-label="북마크"
              onClick={() => {
                const token = getAccessToken();
                if (!token) {
                  navigate(
                    `/auth?next=${encodeURIComponent(`/experiences/${experience.id}`)}&reason=${encodeURIComponent(
                      '북마크는 로그인이 필요한 서비스입니다.',
                    )}`,
                  );
                  return;
                }

                void (bookmarked ? unbookmarkExperience(token, experience.id) : bookmarkExperience(token, experience.id))
                  .then((payload) => {
                    setBookmarked(payload.bookmarked);
                    showToast(payload.bookmarked ? '북마크에 저장했어요.' : '북마크를 해제했어요.');
                  })
                  .catch((requestError) => {
                    setError(resolveErrorMessage(requestError, '북마크를 처리하지 못했어요.'));
                  });
              }}
              className="flex h-[24px] w-[24px] items-center justify-center text-[#000000]"
            >
              <HeaderBookmarkIcon active={bookmarked} className="h-[24px] w-[24px]" />
            </button>
          </div>
        </header>

        <main className="flex flex-col gap-[12px]">
          <section className="px-[16px] pt-[12px]">
            <div className="flex items-start justify-between gap-[12px]">
              <div className="flex min-w-0 items-center gap-[8px]">
                {experience.author.profileImage ? (
                  <img src={experience.author.profileImage} alt="" className="h-[40px] w-[40px] rounded-full object-cover" />
                ) : (
                  <div className="h-[40px] w-[40px] rounded-full bg-[#E6E6E6]" />
                )}

                <div className="min-w-0">
                  <div className="flex items-center gap-[4px] text-[12px] leading-[17px] text-[#131416]">
                    <span className="font-[500]">{experience.author.nickname}</span>
                    <span className="text-[#8A8A8A]">{formatDate(experience.createdAt)}</span>
                  </div>
                  <p className="text-[12px] leading-[17px] text-[#494949]">{experience.category.name}</p>
                </div>
              </div>

              {isOwner ? (
                <div className="relative shrink-0">
                  <button
                    type="button"
                    aria-label="더보기"
                    onClick={() => setActionMenuOpen((current) => !current)}
                    className="flex h-[20px] w-[20px] items-center justify-center text-[#1E1E1E]"
                  >
                    <MoreVertical size={20} strokeWidth={1.9} />
                  </button>

                  {actionMenuOpen ? (
                    <div className="absolute right-0 top-[26px] z-50 flex w-[92px] flex-col rounded-[12px] border border-[#E6E6E6] bg-white p-[6px] shadow-[0_12px_24px_rgba(0,0,0,0.12)]">
                      <button
                        type="button"
                        onClick={() => void handleDelete()}
                        disabled={deleting}
                        className="flex items-center gap-[6px] rounded-[8px] px-[10px] py-[8px] text-left text-[12px] font-[500] leading-[17px] text-[#D33B3B] disabled:opacity-60"
                      >
                        <Trash2 size={14} strokeWidth={1.9} />
                        <span>{deleting ? '삭제 중...' : '삭제'}</span>
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>

          <section className="px-[16px]">
            <div className="flex flex-col gap-[16px]">
              <h1 className="text-[16px] font-[600] leading-[19px] text-[#131416]">{experience.title}</h1>
              <div className="whitespace-pre-wrap text-[14px] leading-[21px] text-[#494949]">{experience.content}</div>
            </div>
          </section>

          {displayedImageUrl ? (
            <section className="px-[16px]">
              <div className="flex gap-[10px] overflow-x-auto pb-[4px]">
                {imageUrls.map((imageUrl, index) => (
                  <button
                    key={`${imageUrl}-${index}`}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={`h-[300px] w-[300px] shrink-0 overflow-hidden rounded-[10px] border ${
                      selectedImageIndex === index ? 'border-[#5A876E]' : 'border-transparent'
                    }`}
                  >
                    <img src={imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {chips.length ? (
            <section className="px-[16px]">
              <div className="flex flex-wrap gap-[4px]">
                {chips.map((chip, index) => (
                  <FilledBadge key={`${chip}-${index}`} text={chip} tone={index === 0 ? 'orange' : index === 1 ? 'green' : 'gray'} />
                ))}
              </div>
            </section>
          ) : null}

          <section className="px-[16px]">
            <div className="flex rounded-[10px] bg-white">
              <MetricCard value={formatDuration(experience.durationMonths)} label="기간" helper="진행 기간" />
              <div className="my-[14px] w-px bg-[#E6E6E6]" />
              <MetricCard value={formatCurrency(experience.investmentAmount)} label="투자금" helper="초기 비용" />
              <div className="my-[14px] w-px bg-[#E6E6E6]" />
              <MetricCard value={formatCurrency(experience.monthlyRevenue)} label="수익" helper="월 수익" />
            </div>
          </section>

          <section className="px-[16px] pt-[12px]">
            <SectionTitle title="핵심 이슈" description="이 사례에서 드러난 주요 실패 원인을 요약했어요." />
            <div className="mt-[12px] flex flex-wrap gap-[6px]">
              {issueItems.length ? (
                issueItems.map((item) => (
                  <div key={item} className="rounded-[10px] bg-[#F8F8F8] px-[16px] py-[12px]">
                    <p className="text-[12px] leading-[14px] text-[#131416]">{item}</p>
                  </div>
                ))
              ) : (
                <PageMessage message="아직 핵심 이슈를 정리하지 못했어요." />
              )}
            </div>
          </section>

          <section className="px-[16px] pt-[12px]">
            <div className="rounded-[10px] border border-[#5E5E5E] bg-white p-[16px]">
              <div className="flex items-center gap-[8px]">
                <div className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-[#131416] text-[10px] font-[700] text-white">AI</div>
                <p className="text-[16px] font-[600] leading-[19px] text-[#131416]">AI 가이드</p>
              </div>

              <p className="mt-[12px] text-[12px] leading-[17px] text-[#494949]">{aiSummary}</p>

              <div className="my-[12px] h-px bg-[#D8D8D8]" />

              {aiAdvice.length ? (
                <div className="flex flex-col gap-[8px]">
                  {aiAdvice.map((line, index) => (
                    <p key={`${index}-${line}`} className="text-[12px] leading-[17px] text-[#494949]">
                      {index + 1}. {line}
                    </p>
                  ))}
                </div>
              ) : (
                <PageMessage message="AI 조언을 준비 중입니다." />
              )}
            </div>
          </section>

          <section className="px-[16px] pt-[12px]">
            <SectionTitle title="실패 패턴" description="어떤 패턴이 반복됐는지 비율로 보여드려요." />
            <div className="mt-[12px] flex flex-col gap-[10px] rounded-[10px] bg-[#F8F8F8] p-[16px]">
              {patternItems.length ? (
                patternItems.map((item) => <ProgressRow key={item.label} label={item.label} percent={item.percent} />)
              ) : (
                <PageMessage message="패턴 분석이 아직 준비되지 않았어요." />
              )}
            </div>
          </section>

          <section className="px-[16px] pt-[12px]">
            <SectionTitle title="유사 사례" description="비슷한 실패 흐름을 가진 사례를 함께 확인해 보세요." />
            <div className="mt-[12px] flex flex-col gap-[10px]">
              {similarCases.length ? (
                similarCases.map((item) => (
                  <SimilarCaseCard
                    key={item.caseId}
                    title={item.title}
                    summary={item.summary}
                    similarity={item.similarity}
                    onClick={() => handleSimilarCaseClick(item.caseId)}
                  />
                ))
              ) : (
                <PageMessage message="유사 사례가 아직 없어요." />
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate('/explore')}
              className="mt-[12px] h-[42px] w-full rounded-[10px] bg-[#F8F8F8] text-[14px] font-[500] text-[#131416]"
            >
              모든 사례 보기
            </button>
          </section>
          {experience.caseStatus !== 'SUCCESS' ? (
            <section className="px-[16px] pt-[12px]">
              <FailureToSuccessButton caseId={experience.id} relatedSuccessCount={relatedSuccessCount} />
            </section>
          ) : null}
        </main>

        <div className="pointer-events-none fixed bottom-[88px] left-1/2 z-40 flex w-full max-w-[430px] -translate-x-1/2 items-end justify-between px-[24px]">
          <div className="pointer-events-auto">
            <button
              type="button"
              onClick={moveToCreate}
              className="flex h-[36px] min-w-[208px] items-center justify-center gap-[8px] rounded-[999px] bg-[#131416] px-[16px] text-white shadow-[0_6px_14px_rgba(0,0,0,0.16)]"
            >
              <Pencil size={16} strokeWidth={1.9} />
              <span className="text-[14px] font-[500] leading-[17px]">나의 경험 분석하러 가기</span>
            </button>
          </div>

          <div className="pointer-events-auto">
            <button
              type="button"
              onClick={moveToCreate}
              className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#5A876E] text-white shadow-[0_10px_22px_rgba(90,135,110,0.3)]"
              aria-label="경험 작성"
            >
              <span className="text-[28px] leading-none">+</span>
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
