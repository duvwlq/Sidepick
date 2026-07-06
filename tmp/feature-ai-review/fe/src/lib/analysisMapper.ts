import type { AnalysisReport } from './api';

export type AnalysisGuideViewModel = {
  title: string;
  scoreLabel: string;
  description: string;
};

export type AnalysisSimilarCaseViewModel = {
  caseId: string;
  title: string;
  summary: string | null;
  keyLesson: string | null;
  similarity: number;
  tags: string[];
  durationMonths?: number | null;
  monthlyRevenue?: number | null;
};

export type AnalysisReportViewModel = {
  guideSummary: string | null;
  guideLines: string[];
  guideItems: AnalysisGuideViewModel[];
  similarCaseTags: string[];
  similarCases: AnalysisSimilarCaseViewModel[];
};

function formatTag(label: string) {
  return label.replaceAll('_', ' ').trim();
}

function buildGuideItems(advice: string[]) {
  return advice.slice(0, 3).map((description, index) => ({
    title: `추천 행동 ${index + 1}`,
    scoreLabel: '우선순위 높음',
    description,
  }));
}

function buildSimilarCaseTags(report: AnalysisReport) {
  const tags = report.keywords.filter(Boolean).slice(0, 3).map(formatTag);
  return tags.length ? tags : ['실패 경험', '원인 분석', '유사 사례'];
}

export function mapAnalysisReport(report: AnalysisReport): AnalysisReportViewModel {
  const guideItems = buildGuideItems(report.advice);

  return {
    guideSummary: report.summary?.trim() || null,
    guideLines: guideItems.map((item) => item.description),
    guideItems,
    similarCaseTags: buildSimilarCaseTags(report),
    similarCases: report.similarCases.map((item) => ({
      caseId: item.caseId,
      title: item.title,
      summary: item.summary,
      keyLesson: item.keyLesson,
      similarity: item.matchRate,
      tags: buildSimilarCaseTags(report),
      durationMonths: null,
      monthlyRevenue: null,
    })),
  };
}
