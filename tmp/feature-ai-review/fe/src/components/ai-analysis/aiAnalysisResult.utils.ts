import { ApiError, type AnalysisReport } from '../../lib/api';
import { ERROR_CODES } from '../../lib/error-codes';

export type PatternItem = {
  label: string;
  percent: number;
};

const ENCOURAGEMENT_MESSAGES = [
  '이번 경험은 실패가 아니라 다음 선택을 더 단단하게 만들어 줄 기록이에요.',
  '실패를 정리한 것만으로도 다음 시도를 위한 중요한 데이터를 만든 거예요.',
  '지금의 기록은 다음 선택에서 같은 실수를 줄이는 데 분명 도움이 될 거예요.',
];

export function shouldUseDevFallback(error: unknown) {
  return (
    import.meta.env.DEV &&
    error instanceof ApiError &&
    error.code === ERROR_CODES.NETWORK_ERROR
  );
}

export function formatDate(value: string) {
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

export function formatDuration(months: number | null) {
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

export function formatCurrency(value: number | null) {
  if (value == null) {
    return '0원';
  }

  return `${value.toLocaleString()}원`;
}

export function formatTag(label: string) {
  return label.replaceAll('_', ' ').trim();
}

export function formatDailyHours(value: string | null) {
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

export function formatMainJobStatus(value: boolean | null) {
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

export function buildPatternItems(report: AnalysisReport | null): PatternItem[] {
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

export function buildIssueItems(report: AnalysisReport | null) {
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
}

export function buildGuideLines(report: AnalysisReport | null) {
  if (!report?.advice?.length) {
    return ['아직 AI 가이드가 준비되지 않았습니다.'];
  }

  return report.advice.slice(0, 3);
}

export function buildGuideSummary(report: AnalysisReport | null) {
  if (report?.summary?.trim()) {
    return report.summary.trim();
  }

  return '이번 경험에서 드러난 흐름을 바탕으로 다음 시도에서 줄일 수 있는 위험을 정리했어요.';
}

export function buildGuideClosing(experienceId: number | null | undefined) {
  if (experienceId == null) {
    return ENCOURAGEMENT_MESSAGES[0];
  }

  return ENCOURAGEMENT_MESSAGES[experienceId % ENCOURAGEMENT_MESSAGES.length];
}

export function buildSimilarCaseTags(report: AnalysisReport | null) {
  const source = report?.keywords?.filter(Boolean).slice(0, 3) ?? [];
  return source.length ? source.map(formatTag) : ['실패 경험', '원인 분석', '유사 사례'];
}
