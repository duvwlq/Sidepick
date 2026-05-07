import type { AnalysisReport } from './api';
import type { AnalysisMockData } from '../constants/mockAnalysisData';

export function mapReportToViewModel(report: AnalysisReport): AnalysisMockData {
  return {
    keyIssues: report.keywords ?? [],
    aiGuides: (report.actions ?? []).map((action) => ({
      step: action.step,
      checklist: action.checklist ?? [],
    })),
    failurePatterns: report.failureCategory ? [report.failureCategory] : [],
    similarCases: (report.similarCases ?? []).map((c) => ({
      title: c.title,
      tags: c.tags ?? [],
      similarity: c.similarity,
      durationMonths: c.durationMonths,
      monthlyRevenue: c.monthlyRevenue,
    })),
  };
}
