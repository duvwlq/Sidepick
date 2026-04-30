import { useEffect, useMemo, useState } from 'react';
import amountIcon from '../../assets/images/amount.svg';
import durationIcon from '../../assets/images/duration.svg';
import {
  ApiError,
  createAnalysis,
  getExperience,
  getReport,
  type AnalysisReport,
  type Experience,
} from '../../lib/api';
import { getAccessToken } from '../../lib/session';

type Props = {
  experienceId: number | null;
};

type PatternItem = {
  label: string;
  percent: number;
};

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
  if (!remainMonths) {
    return `${years}년`;
  }

  return `${years}년 ${remainMonths}개월`;
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

function getPatternSource(report: AnalysisReport | null) {
  if (!report) {
    return [];
  }

  if (report.failureCategory) {
    return [report.failureCategory, ...report.extractedPatterns];
  }

  if (report.extractedPatterns.length) {
    return report.extractedPatterns;
  }

  if (report.keywords?.length) {
    return report.keywords;
  }

  return report.riskFactors;
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
    <div className="flex w-full flex-col gap-2">
      <h2 className="text-base font-semibold leading-[1.2] text-[#131416]">
        {title}
      </h2>
      <p className="text-xs leading-[1.4] text-[#494949]">{description}</p>
    </div>
  );
}

function MetricItem({
  icon,
  label,
  value,
  withDivider = true,
}: {
  icon?: string;
  label: string;
  value: string;
  withDivider?: boolean;
}) {
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex h-[14px] items-center gap-1 text-xs leading-[1.2] text-[#8A8A8A]">
        {icon ? <img src={icon} alt="" className="h-[14px] w-[14px]" /> : null}
        <span>{label}</span>
      </div>
      <p
        className={[
          'text-base font-semibold leading-[1.4] text-[#131416]',
          withDivider ? 'border-b border-[#E7E7E7] pb-[10px]' : '',
        ].join(' ')}
      >
        {value}
      </p>
    </div>
  );
}

export default function AiAnalysisResult({ experienceId }: Props) {
  const [experience, setExperience] = useState<Experience | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!experienceId) {
      setLoading(false);
      setError('분석 결과를 불러올 경험 ID가 없습니다.');
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
              (requestError.status === 502 || requestError.status === 504)
            ) {
              throw requestError;
            }
          }
        }
      }

      setExperience(experiencePayload);
      setReport(reportPayload);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : '분석 결과를 불러오지 못했습니다.',
      );
    } finally {
      setLoading(false);
    }
  }

  const chips = useMemo(() => {
    if (!experience) {
      return [];
    }

    return [
      experience.category.name,
      experience.durationMonths ? '할애 기간' : null,
      experience.investmentAmount != null ? '투자금' : null,
      experience.monthlyRevenue != null ? '수익' : null,
      experience.isConcurrentWithMainJob != null ? '본업 병행 여부' : null,
    ].filter((value): value is string => Boolean(value));
  }, [experience]);

  const issueItems = useMemo(() => {
    if (!report) {
      return [];
    }

    const base = report.keywords?.length
      ? report.keywords
      : report.riskFactors.length
        ? report.riskFactors
        : report.failureCategory
          ? [report.failureCategory]
          : report.extractedPatterns;

    return base.filter(Boolean).slice(0, 3).map((item) => `# ${formatTag(item)}`);
  }, [report]);

  const patternItems = useMemo(() => buildPatternItems(report), [report]);

  if (loading) {
    return (
      <div className="bg-[#EEE] px-4 py-4">
        <div className="rounded-[10px] bg-white p-5 text-sm text-[#494949]">
          분석 결과를 불러오는 중입니다.
        </div>
      </div>
    );
  }

  if (error || !experience) {
    return (
      <div className="bg-[#EEE] px-4 py-4">
        <div className="rounded-[10px] bg-white p-5 text-sm text-[#D33B3B]">
          {error || '분석 결과를 불러오지 못했습니다.'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[2px] bg-[#EEE]">
      <section className="flex flex-col gap-8 bg-white p-4">
        <div className="flex items-center gap-2">
          {experience.author.profileImage ? (
            <img
              src={experience.author.profileImage}
              alt=""
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-[#F1F1F1]" />
          )}
          <div className="flex flex-col gap-[2px] text-xs leading-[1.4]">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-[#131416]">
                {experience.author.nickname}
              </span>
              <span className="text-[#BABABA]">
                {formatDate(experience.createdAt)}
              </span>
            </div>
            <span className="text-[#494949]">{experience.category.name}</span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-[18px] font-semibold leading-[1.2] text-[#131416]">
            {experience.title}
          </h1>
          <p className="whitespace-pre-line text-sm leading-[1.4] text-[#494949]">
            {experience.content}
          </p>
          <div className="flex flex-wrap gap-1">
            {chips.map((chip) => (
              <span
                key={chip}
                className="flex h-[18px] items-center rounded-[999px] bg-[#EEE] px-2 text-xs leading-[1.2] text-[#757575]"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-[10px] bg-white p-4">
        <MetricItem
          icon={durationIcon}
          label="진행 기간"
          value={formatDuration(experience.durationMonths)}
        />
        <MetricItem
          icon={amountIcon}
          label="투자금"
          value={formatCurrency(experience.investmentAmount)}
        />
        <MetricItem
          label="수익"
          value={formatCurrency(experience.monthlyRevenue)}
          withDivider={false}
        />
      </section>

      <section className="flex flex-col gap-3 bg-white p-4">
        <SectionTitle
          title="핵심 이슈"
          description="해당 사례에서 찾아볼 수 있는 핵심 이슈입니다."
        />
        <div className="flex flex-col gap-[10px]">
          {issueItems.length ? (
            issueItems.map((item) => (
              <div
                key={item}
                className="rounded-[10px] bg-[#EEE] px-4 py-3 text-sm leading-[1.4] text-[#131416]"
              >
                {item}
              </div>
            ))
          ) : (
            <div className="rounded-[10px] bg-[#EEE] px-4 py-3 text-sm leading-[1.4] text-[#757575]">
              아직 핵심 이슈를 추출하지 못했습니다.
            </div>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3 bg-white px-4 pb-[110px] pt-4">
        <SectionTitle
          title="실패 패턴"
          description="유사 카테고리 내 실패 원인 별 비중 그래프 데이터입니다."
        />
        <div className="flex flex-col gap-4 rounded-[10px] bg-[#EEE] p-4">
          {patternItems.length ? (
            patternItems.map((item) => (
              <div key={item.label} className="flex w-full flex-col gap-1">
                <div className="flex items-start justify-between text-xs leading-[1.4] text-[#494949]">
                  <span>{item.label}</span>
                  <span>{String(item.percent).padStart(2, '0')}%</span>
                </div>
                <div className="h-[10px] overflow-hidden rounded-[999px] bg-[#D8D8D8]">
                  <div
                    className="h-full rounded-[999px] bg-black"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm leading-[1.4] text-[#757575]">
              아직 패턴 데이터를 표시할 수 없습니다.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
