import { useEffect, useMemo, useState } from 'react';
import { Bookmark, ChevronLeft, MoreHorizontal, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import amountIcon from '../../assets/images/amount.svg';
import durationIcon from '../../assets/images/duration.svg';
import BottomNav from '../layout/ButtomNav';
import {
  ApiError,
  createAnalysis,
  deleteExperience,
  getExperience,
  getReport,
  type AnalysisReport,
  type AnalysisReportSimilarCase,
  type Experience,
} from '../../lib/api';
import { ERROR_CODES } from '../../lib/error-codes';
import { resolveErrorMessage } from '../../lib/resolve-error-message';
import { getAccessToken, getStoredUser } from '../../lib/session';

type Props = {
  experienceId: number | null;
};

type PatternItem = {
  label: string;
  percent: number;
};

const ENCOURAGEMENT_MESSAGES = [
  '이번 경험은 끝이 아니라 다음 선택을 더 단단하게 만드는 기준이 될 수 있어요.',
  '실패를 정리한 것만으로도 이미 다음 시도를 위한 중요한 데이터를 만든 거예요.',
  '지금의 기록이 다음 선택에서 더 나은 판단을 도와줄 거예요.',
];

function shouldUseDevFallback(error: unknown) {
  return (
    import.meta.env.DEV &&
    error instanceof ApiError &&
    error.code === ERROR_CODES.NETWORK_ERROR
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('.');
}

function formatDuration(months: number | null) {
  if (!months || months <= 0) {
    return '-';
  }
  if (months < 12) {
    return `${months}개월`;
  }

  const years = Math.floor(months / 12);
  const remainMonths = months % 12;
  return remainMonths ? `${years}년 ${remainMonths}개월` : `${years}년`;
}

function formatCurrency(value: number | null) {
  if (value == null) {
    return '0원';
  }

  return `${value.toLocaleString()}원`;
}

function formatTag(label: string) {
  return label.replaceAll('_', ' ').trim();
}

function formatDailyHours(value: string | null) {
  switch (value) {
    case 'UNDER_1_HOUR':
      return '1시간 미만';
    case '1_TO_3_HOURS':
    case 'ONE_TO_THREE_HOURS':
      return '1~3시간';
    case '3_TO_5_HOURS':
    case 'THREE_TO_FIVE_HOURS':
      return '3~5시간';
    case 'OVER_FIVE_HOURS':
      return '5시간 이상';
    default:
      return null;
  }
}

function formatMainJobStatus(value: boolean | null) {
  if (value == null) {
    return null;
  }

  return value ? '본업 병행 중' : '본업 병행 없음';
}

function getPatternSource(report: AnalysisReport | null) {
  if (!report) {
    return [];
  }

  const dedupe = (items: Array<string | null | undefined>) =>
    Array.from(new Set(items.filter(Boolean) as string[]));

  if (report.failureCategory) {
    return dedupe([report.failureCategory, ...report.extractedPatterns]);
  }
  if (report.extractedPatterns.length) {
    return dedupe(report.extractedPatterns);
  }
  if (report.keywords?.length) {
    return dedupe(report.keywords);
  }

  return dedupe(report.riskFactors);
}

function buildPatternItems(report: AnalysisReport | null): PatternItem[] {
  const source = getPatternSource(report).filter(Boolean).slice(0, 3);
  if (!source.length) {
    return [];
  }

  if (source.length === 1) {
    return [{ label: formatTag(source[0]), percent: 100 }];
  }

  const total = source.reduce((sum, _, index) => sum + (source.length - index), 0);
  return source.map((label, index) => ({
    label: formatTag(label),
    percent: Math.round((((source.length - index) / total) * 100) / 5) * 5,
  }));
}

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
  tags,
  onClick,
}: {
  item: AnalysisReportSimilarCase;
  tags: string[];
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col items-start rounded-[10px] border border-[#EEEEEE] bg-[#F8F8F8] p-[16px] text-left"
    >
      <div className="flex w-full flex-col gap-[8px]">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-start gap-[4px]">
            {tags.map((tag) => (
              <SecondaryBadge key={`${item.caseId}-${tag}`} text={tag} />
            ))}
          </div>

          <div className="flex items-center justify-center gap-[4px]">
            <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949]">
              유사도
            </p>
            <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949]">
              {String(item.matchRate).padStart(2, '0')}%
            </p>
          </div>
        </div>

        <p className="w-full font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-[#000000]">
          {item.title}
        </p>
      </div>
    </button>
  );
}

export default function AiAnalysisResult({ experienceId }: Props) {
  const navigate = useNavigate();
  const [experience, setExperience] = useState<Experience | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);
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
      setError('요청한 사례를 찾을 수 없어요.');
      return;
    }

    void loadPageData(experienceId);
  }, [experienceId]);

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
        setError('개발 환경에서 네트워크가 연결되지 않았어요.');
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

    const confirmed = window.confirm('이 사례를 삭제하시겠어요?');
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setActionMenuOpen(false);
    setError('');

    try {
      await deleteExperience(token, experience.id);
      navigate('/', { replace: true });
    } catch (requestError) {
      setError(
        resolveErrorMessage(
          requestError,
          '사례를 삭제하지 못했어요. 잠시 후 다시 시도해주세요.',
        ),
      );
      setDeleting(false);
    }
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

  const issueItems = useMemo(() => {
    if (!report) {
      return [];
    }

    const source = report.keywords?.length
      ? report.keywords
      : report.riskFactors.length
        ? report.riskFactors
        : report.failureCategory
          ? [report.failureCategory]
          : report.extractedPatterns;

    return source.filter(Boolean).slice(0, 3).map((item) => `# ${formatTag(item)}`);
  }, [report]);

  const patternItems = useMemo(() => buildPatternItems(report), [report]);

  const guideLines = useMemo(() => {
    if (!report?.advice?.length) {
      return ['아직 AI 가이드가 준비되지 않았습니다.'];
    }

    return report.advice.slice(0, 3);
  }, [report]);

  const guideSummary = useMemo(() => {
    if (report?.summary?.trim()) {
      return report.summary.trim();
    }

    return '이번 경험에서 드러난 흐름을 바탕으로 다음 시도에서 줄일 수 있는 위험을 정리했어요.';
  }, [report]);

  const guideClosing = useMemo(() => {
    if (!experience) {
      return ENCOURAGEMENT_MESSAGES[0];
    }

    return ENCOURAGEMENT_MESSAGES[experience.id % ENCOURAGEMENT_MESSAGES.length];
  }, [experience]);

  const similarCases = useMemo(() => report?.similarCases.slice(0, 3) ?? [], [report]);

  const similarCaseTags = useMemo(() => {
    const source = report?.keywords?.filter(Boolean).slice(0, 3) ?? [];
    return source.length ? source.map(formatTag) : ['실패 경험', '원인 분석', '재도전'];
  }, [report]);

  if (loading) {
    return (
      <div className="mx-auto min-h-screen w-[375px] bg-[#FFFFFF]">
        <div className="px-[16px] py-[40px]">
          <div className="rounded-[10px] border border-[#E6E6E6] bg-[#F8F8F8] px-[16px] py-[20px] font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] tracking-[0px] text-[#494949]">
            경험을 불러오는 중입니다.
          </div>
        </div>
      </div>
    );
  }

  if (error || !experience) {
    return (
      <div className="mx-auto min-h-screen w-[375px] bg-[#FFFFFF]">
        <div className="px-[16px] py-[40px]">
          <div className="rounded-[10px] border border-[#E6E6E6] bg-[#F8F8F8] px-[16px] py-[20px] font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] tracking-[0px] text-[#D33B3B]">
            {error || '분석 결과를 불러오지 못했어요. 잠시 후 다시 시도해주세요.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen w-[375px] bg-[#FFFFFF]">
      {actionMenuOpen ? (
        <button
          type="button"
          aria-label="레이어 닫기"
          onClick={() => setActionMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/20"
        />
      ) : null}

      {isOwner && actionMenuOpen ? (
        <div className="fixed left-1/2 top-[78px] z-50 w-[148px] translate-x-[28px] rounded-[14px] border border-[#E6E6E6] bg-white p-[6px] shadow-[0_12px_30px_rgba(0,0,0,0.14)]">
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={deleting}
            className="flex w-full items-center gap-[8px] rounded-[10px] px-[12px] py-[10px] text-left font-['Pretendard'] text-[13px] font-[500] leading-[16px] tracking-[0px] text-[#D33B3B] hover:bg-[#FFF4F2] disabled:opacity-60"
          >
            <Trash2 size={16} />
            {deleting ? '삭제 중...' : '삭제하기'}
          </button>
        </div>
      ) : null}

      <div className="relative flex w-[375px] flex-col bg-[#FFFFFF]">
        <div className="relative flex w-[375px] items-center justify-between bg-[#FFFFFF] px-[16px] py-[20px]">
          <div className="flex items-center gap-[8px]">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="뒤로가기"
              className="flex h-[24px] w-[24px] items-center justify-center text-[#000000]"
            >
              <ChevronLeft size={24} strokeWidth={1.75} />
            </button>
          </div>

          <p className="font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-[#000000]">
            사례 상세
          </p>

          <div className="flex items-center gap-[8px]">
            <button
              type="button"
              aria-label="북마크"
              className="flex h-[24px] w-[24px] items-center justify-center text-[#000000]"
            >
              <Bookmark size={24} strokeWidth={1.75} />
            </button>
            {isOwner ? (
              <button
                type="button"
                aria-label="더보기"
                onClick={() => setActionMenuOpen((current) => !current)}
                className="flex h-[24px] w-[24px] items-center justify-center text-[#000000]"
              >
                <MoreHorizontal size={24} strokeWidth={1.75} />
              </button>
            ) : (
              <div className="h-[24px] w-[24px]" />
            )}
          </div>
        </div>

        <div className="flex w-[375px] flex-col gap-[36px] px-[16px] pb-[100px]">
          {error ? (
            <div className="rounded-[10px] border border-[#F2D1CD] bg-[#FFF4F2] px-[16px] py-[12px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#D33B3B]">
              {error}
            </div>
          ) : null}

          <section className="flex w-full flex-col gap-[24px] bg-[#FFFFFF]">
            <div className="flex w-full items-center gap-[8px]">
              {experience.author.profileImage ? (
                <img
                  src={experience.author.profileImage}
                  alt=""
                  className="h-[32px] w-[32px] rounded-[999px] object-cover"
                />
              ) : (
                <div className="h-[32px] w-[32px] rounded-[999px] bg-[#EEEEEE]" />
              )}

              <div className="flex flex-col items-start gap-[2px] text-[12px] leading-[16.8px]">
                <div className="flex items-center gap-[4px] whitespace-nowrap">
                  <p className="font-['Pretendard'] text-[12px] font-[600] leading-[16.8px] tracking-[0px] text-[#131416]">
                    {experience.author.nickname}
                  </p>
                  <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#BABABA]">
                    {formatDate(experience.createdAt)}
                  </p>
                </div>
                <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949]">
                  {experience.category.name}
                </p>
              </div>
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
                label="수익"
                value={formatCurrency(experience.monthlyRevenue)}
                showDivider={false}
              />
            </div>
          </section>

          <section className="flex w-full flex-col gap-[12px]">
            <SectionTitle
              title="핵심 이슈"
              description="해당 사례에서 찾아볼 수 있는 핵심 이슈입니다."
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
                    아직 핵심 이슈를 추출하지 못했습니다.
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
                {guideLines.map((line, index) => (
                  <ol
                    key={`${index}-${line}`}
                    start={index + 1}
                    className="w-full list-decimal font-['Pretendard'] text-[12px] font-[600] leading-[0px] tracking-[0px] text-[#494949]"
                  >
                    <li className="ml-[18px]">
                      <span className="font-[400] leading-[16.8px]">{line}</span>
                    </li>
                  </ol>
                ))}
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
              description="유사 카테고리 내 실패 원인별 비중 그래프 데이터입니다."
            />

            <div className="flex w-full flex-col gap-[16px] rounded-[10px] border border-[#E6E6E6] bg-[#F8F8F8] p-[16px]">
              {patternItems.length ? (
                patternItems.map((item) => (
                  <div key={item.label} className="flex w-[311px] flex-col gap-[4px]">
                    <div className="flex w-full items-start justify-between">
                      <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949]">
                        {item.label}
                      </p>

                      <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949]">
                        {String(item.percent).padStart(2, '0')}%
                      </p>
                    </div>

                    <div className="relative h-[10px] w-[311px] overflow-hidden rounded-[999px] bg-[#D8D8D8]">
                      <div
                        className="absolute left-0 top-0 h-[10px] rounded-[999px] bg-[#000000]"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
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
                description="이 사례와 비슷한 실패 경험을 가진 다른 사례들을 추천해드립니다."
              />

              <div className="flex w-full flex-col gap-[10px]">
                {similarCases.length ? (
                  similarCases.map((item) => (
                    <SimilarCaseCard
                      key={item.caseId}
                      item={item}
                      tags={similarCaseTags}
                      onClick={() => navigate('/explore')}
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
                className="font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#5D5D5D] underline [text-decoration-skip-ink:none]"
              >
                모든 사례 보기
              </button>
            </div>
          </section>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
