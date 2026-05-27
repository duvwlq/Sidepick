import { Bookmark, ChevronLeft, LoaderCircle, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import amountIcon from '../../assets/images/amount.svg';
import durationIcon from '../../assets/images/duration.svg';
import { ErrorState, LoadingState } from '../common/Skeleton';
import { useToast } from '../common/useToast';
import {
  ApiError,
  createAnalysis,
  deleteExperience,
  getExperience,
  getReport,
  type Experience,
} from '../../lib/api';
import { mapAnalysisReport } from '../../lib/analysisMapper';
import { ERROR_CODES } from '../../lib/error-codes';
import { setFlashToast } from '../../lib/flash-toast';
import { resolveErrorMessage } from '../../lib/resolve-error-message';
import { getAccessToken, getStoredUser } from '../../lib/session';
import {
  buildIssueItems,
  buildPatternItems,
  formatCurrency,
  formatDailyHours,
  formatDate,
  formatDuration,
  formatMainJobStatus,
  shouldUseDevFallback,
} from './aiAnalysisResult.utils';
import BottomNav from '../layout/BottomNav';

type Props = {
  experienceId: number | null;
};

const ENCOURAGEMENT_MESSAGES = [
  '이번 경험은 실패가 아니라 다음 선택을 더 단단하게 만들어 줄 기록이에요.',
  '실패를 정리한 것만으로도 다음 시도를 위한 중요한 데이터를 만든 거예요.',
  '지금의 기록은 다음 선택에서 같은 실수를 줄이는 데 분명 도움이 될 거예요.',
];

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex w-full flex-col gap-[4px]">
      <p className="w-full font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-[#131416]">
        {title}
      </p>
      <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949]">
        {description}
      </p>
    </div>
  );
}

function PrimaryBadge({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center rounded-[999px] bg-[#EEEEEE] px-[8px] py-[2px]">
      <span className="font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#757575]">
        {text}
      </span>
    </div>
  );
}

function SecondaryBadge({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center rounded-[999px] bg-[#BABABA] px-[8px] py-[2px]">
      <span className="font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#FFFFFF]">
        {text}
      </span>
    </div>
  );
}

function MoreVerticalIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10.0001 10.8335C10.4603 10.8335 10.8334 10.4604 10.8334 10.0002C10.8334 9.53993 10.4603 9.16683 10.0001 9.16683C9.53984 9.16683 9.16675 9.53993 9.16675 10.0002C9.16675 10.4604 9.53984 10.8335 10.0001 10.8335Z"
        stroke="#1E1E1E"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.0001 5.00016C10.4603 5.00016 10.8334 4.62707 10.8334 4.16683C10.8334 3.70659 10.4603 3.3335C10.0001 3.3335C9.53984 3.3335 9.16675 3.70659 9.16675 4.16683C9.16675 4.62707 9.53984 5.00016 10.0001 5.00016Z"
        stroke="#1E1E1E"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.0001 16.6668C10.4603 16.6668 10.8334 16.2937 10.8334 15.8335C10.8334 15.3733 10.4603 15.0002 10.0001 15.0002C9.53984 15.0002 9.16675 15.3733 9.16675 15.8335C9.16675 16.2937 9.53984 16.6668 10.0001 16.6668Z"
        stroke="#1E1E1E"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DetailMetricRow({
  icon,
  label,
  value,
  showDivider = true,
}: {
  icon: string;
  label: string;
  value: string;
  showDivider?: boolean;
}) {
  return (
    <>
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-[4px]">
          <img src={icon} alt="" className="h-[14px] w-[14px]" />
          <p className="font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#8A8A8A]">
            {label}
          </p>
        </div>
        <p className="font-['Pretendard'] text-[16px] font-[400] leading-[22.4px] tracking-[0px] text-[#131416]">
          {value}
        </p>
      </div>
      {showDivider ? <div className="h-0 w-full border-t border-[#E6E6E6]" /> : null}
    </>
  );
}

function SimilarCaseCard({
  item,
  onClick,
}: {
  item: ReturnType<typeof mapAnalysisReport>['similarCases'][number];
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col items-start rounded-[10px] border border-[#EEEEEE] bg-[#F8F8F8] p-[16px] text-left"
    >
        <div className="flex w-full flex-col gap-[8px]">
          <div className="flex w-full items-start justify-between gap-[8px]">
            <div className="flex min-w-0 flex-1 flex-wrap items-start gap-[4px]">
            {item.tags.map((tag) => (
              <SecondaryBadge key={`${item.caseId}-${tag}`} text={tag} />
            ))}
          </div>

          <div className="flex shrink-0 items-center justify-end gap-[4px] whitespace-nowrap text-right">
            <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949]">
              유사도
            </p>
            <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949]">
              {String(item.similarity).padStart(2, '0')}%
            </p>
          </div>
        </div>

        <p className="w-full font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-[#000000]">
          {item.title}
        </p>

        {item.summary ? (
          <p className="w-full font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949]">
            {item.summary}
          </p>
        ) : null}

        {item.keyLesson ? (
          <p className="w-full font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#757575]">
            {item.keyLesson}
          </p>
        ) : null}
      </div>
    </button>
  );
}

function FaqShortcutCard({ onClick }: { onClick: () => void }) {
  return (
    <section className="flex w-full flex-col gap-[10px]">
      <div className="flex items-center gap-[4px]">
        <div className="flex h-[16px] w-[16px] items-center justify-center rounded-[999px] border border-[#E1E4E6]">
          <span className="text-[10px] leading-none text-[#E5E8EB]">i</span>
        </div>
        <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949]">
          비슷한 상황의 사람들은 어떤 질문을 가장 많이 했을까요?
        </p>
      </div>

      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between rounded-[10px] bg-[#131416] px-[16px] py-[12px] text-left"
      >
        <div className="flex items-center gap-[4px]">
          <div className="flex items-center justify-center rounded-[999px] bg-white px-[8px] py-[2px]">
            <span className="font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-black">
              FAQ
            </span>
          </div>
          <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#F8F8F8]">
            사용자 가이드 게시판 바로 가기
          </span>
        </div>

        <svg
          viewBox="0 0 16 16"
          className="h-[16px] w-[16px] shrink-0"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M6 4L10 8L6 12"
            stroke="#FFFFFF"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </section>
  );
}

export default function AiAnalysisResult({ experienceId }: Props) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [experience, setExperience] = useState<Experience | null>(null);
  const [report, setReport] = useState<Awaited<ReturnType<typeof getReport>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      setError('요청한 경험을 찾을 수 없습니다.');
      return;
    }

    void loadPageData(experienceId);
  }, [experienceId]);

  useEffect(() => {
    if (error) {
      showToast(error);
    }
  }, [error, showToast]);

  async function loadPageData(targetExperienceId: number) {
    setLoading(true);
    setError('');

    try {
      const experiencePayload = await getExperience(targetExperienceId);
      let reportPayload = await getReport(targetExperienceId);

      if (reportPayload.reportStatus === 'NOT_READY') {
        const token = getAccessToken();
        if (token) {
          try {
            await createAnalysis(token, targetExperienceId);
            reportPayload = await getReport(targetExperienceId);
          } catch (requestError) {
            if (
              requestError instanceof ApiError &&
              (requestError.code === ERROR_CODES.ANALYSIS_TIMEOUT ||
                requestError.code === ERROR_CODES.AI_UPSTREAM_ERROR)
            ) {
              setExperience(experiencePayload);
              setReport(reportPayload);
              return;
            }
          }
        }
      }

      setExperience(experiencePayload);
      setReport(reportPayload);
    } catch (requestError) {
      if (shouldUseDevFallback(requestError)) {
        setError('개발 환경에서 API 서버에 연결하지 못했습니다.');
        return;
      }

      setError(
        resolveErrorMessage(
          requestError,
          '분석 결과를 불러오지 못했어요. 잠시 후 다시 시도해주세요.',
        ),
      );
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

    const confirmed = window.confirm('이 경험을 삭제하시겠어요?');
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setActionMenuOpen(false);
    setError('');

    try {
      await deleteExperience(token, experience.id);
      setFlashToast('삭제했어요');
      navigate('/', { replace: true });
    } catch (requestError) {
      setError(
        resolveErrorMessage(
          requestError,
          '경험을 삭제하지 못했어요. 잠시 후 다시 시도해주세요.',
        ),
      );
      setDeleting(false);
    }
  }

  function handleSimilarCaseClick(caseId: string) {
    const directNumericId = Number(caseId);
    if (Number.isFinite(directNumericId) && directNumericId > 0) {
      navigate(`/experiences/${directNumericId}`);
      return;
    }

    const extractedId = caseId.match(/(\d+)/)?.[1];
    const numericId = extractedId ? Number(extractedId) : Number.NaN;
    if (Number.isFinite(numericId) && numericId > 0) {
      navigate(`/experiences/${numericId}`);
      return;
    }

    navigate('/explore');
  }

  const chips = useMemo(() => {
    if (!experience) {
      return [];
    }

    return [
      experience.category.name,
      formatDuration(experience.durationMonths),
      formatDailyHours(experience.averageDailyHours),
      formatMainJobStatus(experience.isConcurrentWithMainJob),
    ].filter((value): value is string => Boolean(value));
  }, [experience]);

  const isReportReady = report?.reportStatus === 'READY';
  const isReportNotReady = report?.reportStatus === 'NOT_READY';
  const isReportError = report?.reportStatus === 'ERROR';

  const mappedReport = useMemo(
    () => (report?.reportStatus === 'READY' ? mapAnalysisReport(report) : null),
    [report],
  );

  const issueItems = useMemo(
    () => (isReportReady ? buildIssueItems(report) : []),
    [isReportReady, report],
  );
  const patternItems = useMemo(
    () => (isReportReady ? buildPatternItems(report) : []),
    [isReportReady, report],
  );
  const guideLines = useMemo(() => mappedReport?.guideLines ?? [], [mappedReport]);
  const guideSummary = useMemo(
    () =>
      mappedReport?.guideSummary ??
      '이번 경험에서 드러난 흐름을 바탕으로 다음 시도에서 줄일 수 있는 위험을 정리했어요.',
    [mappedReport],
  );
  const guideClosing = useMemo(() => {
    if (!experience) {
      return ENCOURAGEMENT_MESSAGES[0];
    }

    return ENCOURAGEMENT_MESSAGES[experience.id % ENCOURAGEMENT_MESSAGES.length];
  }, [experience]);
  const similarCases = useMemo(() => mappedReport?.similarCases.slice(0, 3) ?? [], [mappedReport]);
  const similarCaseTags = useMemo(
    () => mappedReport?.similarCaseTags ?? ['실패 경험', '원인 분석', '유사 사례'],
    [mappedReport],
  );

  if (loading) {
    return (
      <div className="mx-auto min-h-screen w-full max-w-[430px] bg-[#FFFFFF]">
        <div className="px-[16px] py-[40px]">
          <LoadingState message="경험을 불러오는 중입니다." />
        </div>
      </div>
    );
  }

  if (error || !experience) {
    return (
      <div className="mx-auto min-h-screen w-full max-w-[430px] bg-[#FFFFFF]">
        <div className="px-[16px] py-[40px]">
          <ErrorState message={error || '분석 결과를 불러오지 못했어요. 잠시 후 다시 시도해주세요.'} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-[430px] bg-[#FFFFFF]">
      {actionMenuOpen ? (
        <button
          type="button"
          aria-label="액션 메뉴 닫기"
          onClick={() => setActionMenuOpen(false)}
          className="fixed inset-0 z-40 bg-transparent"
        />
      ) : null}

      <div className="relative flex w-full flex-col bg-[#FFFFFF]">
        <div className="relative flex w-full items-center justify-between bg-[#FFFFFF] px-[16px] py-[20px]">
          <div className="flex min-w-[24px] items-center gap-[8px]">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="뒤로가기"
              className="flex h-[24px] w-[24px] items-center justify-center text-[#000000]"
            >
              <ChevronLeft size={24} strokeWidth={1.75} />
            </button>
          </div>

          <p className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-[#000000]">
            사례 상세
          </p>

          <div className="flex min-w-[24px] items-center justify-end">
            <button
              type="button"
              aria-label="북마크"
              className="flex h-[24px] w-[24px] items-center justify-center text-[#000000]"
            >
              <Bookmark size={24} strokeWidth={1.75} />
            </button>
          </div>
        </div>

        <div className="flex w-full flex-col gap-[36px] px-[16px] pb-[100px]">
          <section className="flex w-full flex-col gap-[24px] bg-[#FFFFFF]">
            <div className="flex w-full items-center justify-between gap-[12px]">
              <div className="flex min-w-0 items-center gap-[8px]">
                {experience.author.profileImage ? (
                  <img
                    src={experience.author.profileImage}
                    alt=""
                    className="h-[32px] w-[32px] rounded-[999px] object-cover"
                  />
                ) : (
                  <div className="h-[32px] w-[32px] rounded-[999px] bg-[#EEEEEE]" />
                )}

                <div className="flex min-w-0 flex-col items-start gap-[2px] text-[12px] leading-[16.8px]">
                  <div className="flex items-center gap-[4px] whitespace-nowrap">
                    <p className="font-['Pretendard'] text-[12px] font-[600] leading-[16.8px] tracking-[0px] text-[#131416]">
                      {experience.author.nickname}
                    </p>
                    <p
                      translate="no"
                      className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#BABABA]"
                    >
                      {formatDate(experience.createdAt)}
                    </p>
                  </div>
                  <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949]">
                    {experience.category.name}
                  </p>
                </div>
              </div>

              {isOwner ? (
                <div className="relative z-50 shrink-0">
                  <button
                    type="button"
                    aria-label="더보기"
                    onClick={() => setActionMenuOpen((current) => !current)}
                    className="flex h-[24px] w-[24px] items-center justify-center"
                  >
                    <MoreVerticalIcon />
                  </button>

                  {actionMenuOpen ? (
                    <div className="absolute right-0 top-[28px] flex w-[92px] flex-col rounded-[12px] border border-[#E6E6E6] bg-[#FFFFFF] p-[6px] shadow-[0_12px_24px_rgba(0,0,0,0.12)]">
                      <button
                        type="button"
                        onClick={() => void handleDelete()}
                        disabled={deleting}
                        aria-label="삭제하기"
                        className="flex w-full items-center gap-[6px] rounded-[8px] px-[10px] py-[8px] text-left font-['Pretendard'] text-[12px] font-[500] leading-[16.8px] tracking-[0px] text-[#D33B3B] hover:bg-[#FFF4F2] disabled:opacity-60"
                      >
                        <Trash2 size={14} strokeWidth={1.9} />
                        <span>{deleting ? '삭제 중...' : '삭제'}</span>
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="flex w-full flex-col gap-[16px]">
              <p className="w-full font-['Pretendard'] text-[18px] font-[600] leading-[21.6px] tracking-[0px] text-[#131416]">
                {experience.title}
              </p>
              <div className="w-full whitespace-pre-wrap font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] tracking-[0px] text-[#494949]">
                {experience.content}
              </div>
            </div>

            <div className="flex w-full flex-wrap items-center gap-[4px]">
              {chips.map((chip) => (
                <PrimaryBadge key={chip} text={chip} />
              ))}
            </div>

            <div className="flex w-full flex-col gap-[10px] rounded-[10px] border border-[#E6E6E6] bg-[#F8F8F8] p-[16px]">
              <DetailMetricRow icon={durationIcon} label="진행 기간" value={formatDuration(experience.durationMonths)} />
              <DetailMetricRow icon={amountIcon} label="투자금" value={formatCurrency(experience.investmentAmount)} />
              <DetailMetricRow
                icon={amountIcon}
                label="월 수익"
                value={formatCurrency(experience.monthlyRevenue)}
                showDivider={false}
              />
            </div>
          </section>

          {isReportNotReady ? (
            <section className="flex w-full flex-col gap-[12px]">
              <SectionTitle
                title="분석 준비 중"
                description="AI가 이 경험을 분석하고 있습니다. 잠시 후 다시 확인해주세요."
              />
              <div className="flex w-full items-center gap-[12px]">
                <LoaderCircle size={18} strokeWidth={2.2} className="animate-spin text-[#5E5E5E]" />
                <LoadingState
                  message="분석이 완료되면 이 화면에서 바로 결과를 볼 수 있습니다."
                  showSpinner={false}
                  className="text-left"
                />
              </div>
            </section>
          ) : null}

          {isReportError ? (
            <section className="flex w-full flex-col gap-[12px]">
              <SectionTitle
                title="분석 실패"
                description="분석 결과를 준비하지 못했습니다."
              />
              <ErrorState message="잠시 후 다시 시도해주세요." />
            </section>
          ) : null}

          {isReportReady ? (
            <>
              <section className="flex w-full flex-col gap-[12px]">
                <SectionTitle
                  title="문제 인식"
                  description="이 경험에서 확인된 핵심 문제 인식입니다."
                />

                <div className="flex w-full flex-wrap items-start gap-[10px]">
                  {issueItems.length ? (
                    issueItems.map((item) => (
                      <div
                        key={item}
                        className="flex flex-wrap items-start rounded-[10px] border border-[#E6E6E6] bg-[#F8F8F8] px-[16px] py-[12px]"
                      >
                        <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#131416]">
                          {item}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-wrap items-start rounded-[10px] border border-[#E6E6E6] bg-[#F8F8F8] px-[16px] py-[12px]">
                      <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#757575]">
                        아직 문제 인식을 추출하지 못했어요.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              <section className="flex w-full flex-col">
                <div className="flex w-full flex-col gap-[12px] rounded-[10px] border border-[#5E5E5E] bg-[#FFFFFF] p-[16px]">
                  <div className="flex w-full items-center gap-[8px]">
                    <div className="flex h-[20px] w-[20px] items-center justify-center rounded-[4px] bg-[#131416]">
                      <span className="font-['Pretendard'] text-[12px] font-[600] leading-[14.4px] tracking-[0px] text-[#FFFFFF]">
                        AI
                      </span>
                    </div>
                    <p className="font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-[#131416]">
                      AI 가이드
                    </p>
                  </div>

                  <p className="w-full font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#5E5E5E]">
                    {guideSummary}
                  </p>

                  <div className="h-0 w-full border-t border-[#D8D8D8]" />

                  <div className="flex w-full flex-col gap-[10px]">
                    {guideLines.length ? (
                      guideLines.map((line, index) => (
                        <ol
                          key={`${index}-${line}`}
                          start={index + 1}
                          className="w-full list-decimal font-['Pretendard'] text-[12px] font-[600] leading-[0px] tracking-[0px] text-[#494949]"
                        >
                          <li className="ml-[18px]">
                            <span className="font-[400] leading-[16.8px]">{line}</span>
                          </li>
                        </ol>
                      ))
                    ) : (
                      <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#757575]">
                        아직 AI 가이드가 준비되지 않았어요.
                      </p>
                    )}
                  </div>

                  <div className="h-0 w-full border-t border-[#D8D8D8]" />

                  <div className="w-full whitespace-pre-wrap font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#5E5E5E]">
                    {guideClosing}
                  </div>
                </div>
              </section>

              <section className="flex w-full flex-col gap-[12px]">
                <SectionTitle
                  title="실패 패턴"
                  description="이번 사례에서 분석된 주요 실패 패턴입니다."
                />

                <div className="flex w-full flex-wrap gap-[8px]">
                  {patternItems.length ? (
                    patternItems.map((item) => (
                      <div
                        key={item.label}
                        className="flex min-h-[41px] items-center rounded-[10px] border border-[#E6E6E6] bg-[#F8F8F8] px-[16px] py-[12px]"
                      >
                        <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#131416]">
                          {item.label}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#757575]">
                      아직 실패 패턴 데이터가 없습니다.
                    </p>
                  )}
                </div>
              </section>

              <section className="flex w-full items-center">
                <div className="flex min-w-0 flex-1 flex-col items-center gap-[12px] rounded-[10px] border border-[#E5E7EB] bg-[#FFFFFF] p-[16px]">
                  <SectionTitle
                    title="유사 사례"
                    description="이 경험과 비슷한 실패 경험을 추천해드려요."
                  />

                  {similarCaseTags.length ? (
                    <div className="flex w-full flex-wrap items-center gap-[4px]">
                      {similarCaseTags.map((tag) => (
                        <PrimaryBadge key={tag} text={tag} />
                      ))}
                    </div>
                  ) : null}

                  <div className="flex w-full flex-col gap-[10px]">
                    {similarCases.length ? (
                      similarCases.map((item) => (
                        <SimilarCaseCard
                          key={item.caseId}
                          item={item}
                          onClick={() => handleSimilarCaseClick(item.caseId)}
                        />
                      ))
                    ) : (
                      <div className="flex w-full flex-col items-start rounded-[10px] border border-[#EEEEEE] bg-[#F8F8F8] p-[16px]">
                        <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#757575]">
                          아직 추천할 유사 사례가 없습니다.
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/explore')}
                    className="appearance-none border-0 bg-transparent p-[0px]"
                  >
                    <span className="font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#5D5D5D] underline [text-decoration-skip-ink:none]">
                      모든 사례 보기
                    </span>
                  </button>
                </div>
              </section>

              <FaqShortcutCard onClick={() => navigate('/faq')} />
            </>
          ) : null}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
