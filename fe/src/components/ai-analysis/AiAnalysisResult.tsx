import { useEffect, useMemo, useState } from 'react';
import {
  ApiError,
  createAnalysis,
  getAnalysis,
  getMatchedCases,
  type MatchedCase,
  type PatternAnalysis,
} from '../../lib/api';
import { getAccessToken } from '../../lib/session';
import ActionCard from './ActionCard';
import PatternBar from './PatternBar';
import SimilarCaseCard from './SimilarCaseCard';

type Props = {
  experienceId: number | null;
};

export default function AiAnalysisResult({ experienceId }: Props) {
  const token = getAccessToken();
  const [analysis, setAnalysis] = useState<PatternAnalysis | null>(null);
  const [matchedCases, setMatchedCases] = useState<MatchedCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!experienceId) {
      setLoading(false);
      setError('분석할 경험담 ID가 없습니다.');
      return;
    }

    void loadAnalysis(experienceId);
  }, [experienceId]);

  async function loadAnalysis(targetExperienceId: number) {
    setLoading(true);
    setError('');

    try {
      let analysisPayload: PatternAnalysis;

      try {
        analysisPayload = await getAnalysis(targetExperienceId);
      } catch (requestError) {
        if (
          requestError instanceof ApiError &&
          requestError.status === 404 &&
          token
        ) {
          analysisPayload = await createAnalysis(token, targetExperienceId);
        } else {
          throw requestError;
        }
      }

      setAnalysis(analysisPayload);

      if (token) {
        try {
          const matchedCasePayload = await getMatchedCases(
            token,
            analysisPayload.id,
          );
          setMatchedCases(matchedCasePayload);
        } catch {
          setMatchedCases([]);
        }
      } else {
        setMatchedCases([]);
      }
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

  const patternBars = useMemo(() => {
    const source =
      analysis?.riskFactors.length ? analysis.riskFactors : analysis?.extractedPatterns ?? [];

    if (!source.length) {
      return [];
    }

    const unit = Math.max(20, Math.round(100 / source.length));
    return source.map((label, index) => ({
      label,
      percent: Math.max(20, unit - index * 5),
    }));
  }, [analysis]);

  const actions = analysis?.successFactors ?? [];
  const tags = analysis?.extractedPatterns ?? [];

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
      ) : analysis ? (
        <div className="space-y-6">
          <section className="text-left">
            <p className="mb-2 text-sm font-semibold text-black">분석 결과</p>
            <h1 className="text-2xl font-semibold leading-8 text-neutral-950">
              경험담 #{analysis.experienceId}
              <br />
              AI 패턴 분석
            </h1>
          </section>

          <section className="rounded-2xl bg-white p-4">
            <div className="mb-4 flex h-10 w-full items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
              신뢰도 {Math.round(Number(analysis.confidenceScore ?? 0) * 100)}%
            </div>

            <div>
              <h2 className="mb-4 text-left text-base font-bold text-black">
                AI 요약
              </h2>

              <p className="whitespace-pre-line text-left text-xs leading-5 text-[#7A7A7A]">
                {analysis.structuredSummary || '요약 정보가 아직 없습니다.'}
              </p>

              <div className="my-4 h-px bg-gray-200" />

              <div className="mt-5 flex flex-wrap gap-1">
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
                    추출된 패턴이 없습니다.
                  </span>
                )}
              </div>
            </div>
          </section>

          <section className="text-left">
            <h2 className="mb-2 text-base font-semibold leading-4 text-neutral-950">
              실패 패턴
            </h2>
            <p className="pb-3 text-xs text-[#8A8A8A]">
              현재 분석 결과에서 추출된 위험 요소입니다.
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
            <h2 className="mb-3 text-base font-bold text-black">추천 액션</h2>

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
                  추천 액션이 아직 없습니다.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[10px] bg-white p-4 text-left">
            <h2 className="mb-2 text-base font-semibold leading-4 text-neutral-950">
              유사 사례
            </h2>
            <p className="pb-3 text-xs text-[#8A8A8A]">
              현재는 로그인 상태에서만 유사 사례를 함께 불러옵니다.
            </p>

            <div className="space-y-2.5">
              {matchedCases.length ? (
                matchedCases.map((item) => (
                  <SimilarCaseCard
                    key={item.id}
                    title={item.caseTitle}
                    tags={[item.caseId, item.keyLesson]}
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
