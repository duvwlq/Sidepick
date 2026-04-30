import { useEffect, useMemo, useState } from 'react';
import {
  ApiError,
  type AnalysisReport,
  createAnalysis,
  getReport,
} from '../../lib/api';
import { getAccessToken } from '../../lib/session';
import ActionCard from './ActionCard';
import PatternBar from './PatternBar';
import SimilarCaseCard from './SimilarCaseCard';

type Props = {
  experienceId: number | null;
};

const riskLevelLabel: Record<string, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
};

export default function AiAnalysisResult({ experienceId }: Props) {
  const token = getAccessToken();
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!experienceId) {
      setLoading(false);
      setError('분석할 경험 ID가 없습니다.');
      return;
    }

    void loadReport(experienceId);
  }, [experienceId]);

  async function loadReport(targetExperienceId: number) {
    setLoading(true);
    setError('');

    try {
      let reportPayload = await getReport(targetExperienceId);

      if (reportPayload.reportStatus === 'NOT_READY' && token) {
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

  const tags = useMemo(() => {
    if (!report) {
      return [];
    }

    if (report.keywords?.length) {
      return report.keywords;
    }

    return report.extractedPatterns ?? [];
  }, [report]);

  const patternBars = useMemo(() => {
    if (!report) {
      return [];
    }

    const source = report.riskFactors.length
      ? report.riskFactors
      : tags.length
        ? tags
        : report.extractedPatterns ?? [];

    if (!source.length) {
      return [];
    }

    const unit = Math.max(20, Math.round(100 / source.length));
    return source.map((label, index) => ({
      label,
      percent: Math.max(20, unit - index * 5),
    }));
  }, [report, tags]);

  const actions = report?.advice ?? [];
  const riskLevel = report?.riskLevel?.toLowerCase() ?? '';
  const riskLabel = riskLevelLabel[riskLevel] ?? '미정';
  const confidenceLabel =
    report?.confidenceScore != null
      ? `위험도 점수 ${Math.round(Number(report.confidenceScore) * 100)}%`
      : `위험도 ${riskLabel}`;

  return (
    <div className="bg-[#F3F3F3] px-3 py-4">
      {loading ? (
        <div className="rounded-2xl bg-white p-6 text-sm text-gray-500">
          분석 결과를 불러오는 중입니다.
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-white p-6 text-sm text-red-600">
          {error}
        </div>
      ) : report ? (
        <div className="space-y-6">
          <section className="text-left">
            <p className="mb-2 text-sm font-semibold text-black">분석 결과</p>
            <h1 className="text-2xl font-semibold leading-8 text-neutral-950">
              경험 #{report.experienceId}
              <br />
              AI 패턴 분석
            </h1>
          </section>

          <section className="rounded-2xl bg-white p-4">
            <div className="mb-4 flex h-10 w-full items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
              {confidenceLabel}
            </div>

            <div className="space-y-4 text-left">
              <div>
                <h2 className="mb-2 text-base font-bold text-black">AI 요약</h2>
                <p className="whitespace-pre-line text-xs leading-5 text-[#7A7A7A]">
                  {report.summary || '요약 정보가 아직 없습니다.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-2xl bg-[#F8F8F8] p-3">
                <div>
                  <div className="text-[11px] font-medium text-[#8A8A8A]">
                    실패 카테고리
                  </div>
                  <div className="mt-1 text-sm font-semibold text-[#111111]">
                    {report.failureCategory || '미분류'}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-medium text-[#8A8A8A]">
                    위험 수준
                  </div>
                  <div className="mt-1 text-sm font-semibold text-[#111111]">
                    {riskLabel}
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-2 text-[11px] font-medium text-[#8A8A8A]">
                  핵심 키워드
                </div>
                <div className="flex flex-wrap gap-1">
                  {tags.length ? (
                    tags.map((tag, index) => (
                      <span
                        key={`${tag}-${index}`}
                        className="rounded-[999px] bg-[#F3F3F3] px-2 py-1 text-xs text-[#8A8A8A]"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#8A8A8A]">
                      추출된 키워드가 없습니다.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="text-left">
            <h2 className="mb-2 text-base font-semibold leading-4 text-neutral-950">
              실패 패턴
            </h2>
            <p className="pb-3 text-xs text-[#8A8A8A]">
              분석 결과에서 추출된 주요 위험 요소입니다.
            </p>

            <div className="rounded-2xl bg-white p-4">
              <div className="space-y-4">
                {patternBars.length ? (
                  patternBars.map((item, index) => (
                    <PatternBar
                      key={`${item.label}-${index}`}
                      label={item.label}
                      percent={item.percent}
                    />
                  ))
                ) : (
                  <div className="text-sm text-gray-500">
                    표시할 패턴 정보가 없습니다.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="mt-6 text-left">
            <h2 className="mb-3 text-base font-bold text-black">가이드</h2>

            <div className="space-y-2.5">
              {actions.length ? (
                actions.map((action, index) => (
                  <ActionCard
                    key={`${action}-${index}`}
                    title={`추천 액션 ${index + 1}`}
                    scoreLabel="권장"
                    description={action}
                  />
                ))
              ) : (
                <div className="rounded-2xl bg-white p-4 text-sm text-gray-500">
                  성공 가이드는 아직 연결되지 않았습니다.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[10px] bg-white p-4 text-left">
            <h2 className="mb-2 text-base font-semibold leading-4 text-neutral-950">
              유사 사례
            </h2>
            <p className="pb-3 text-xs text-[#8A8A8A]">
              리포트 응답에 포함된 유사 사례 목록입니다.
            </p>

            <div className="space-y-2.5">
              {report.similarCases.length ? (
                report.similarCases.map((item) => (
                  <SimilarCaseCard
                    key={`${item.caseId}-${item.title}`}
                    title={item.title}
                    tags={[item.caseId, item.keyLesson ?? '전달 교훈 없음']}
                    similarity={item.matchRate}
                  />
                ))
              ) : (
                <div className="rounded-2xl bg-[#F5F5F5] p-4 text-sm text-gray-500">
                  연결된 유사 사례가 없습니다.
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
