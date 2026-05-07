import {
  mockAnalysisData,
  type AnalysisMockData,
} from '../../constants/mockAnalysisData';
import ActionCard from './ActionCard';
import SimilarCaseCard from './SimilarCaseCard';

type Props = {
  data?: AnalysisMockData | null;
};

export default function AiAnalysisResult({ data }: Props = {}) {
  const resolved = data ?? mockAnalysisData;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-1 text-base font-semibold text-neutral-950">
          핵심 이슈
        </h2>
        <p className="mb-3 text-xs text-[#8A8A8A]">
          AI가 추출한 이번 사례의 핵심 키워드입니다.
        </p>
        <div className="flex flex-wrap gap-2">
          {resolved.keyIssues.map((issue, index) => (
            <span
              key={`${issue}-${index}`}
              className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#555555] shadow-[0_2px_6px_rgba(15,23,42,0.04)]"
            >
              #{issue}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-base font-semibold text-neutral-950">
          AI 가이드
        </h2>
        <p className="mb-3 text-xs text-[#8A8A8A]">
          분석 결과를 바탕으로 다음 단계에 무엇을 할 수 있는지 알려드려요.
        </p>
        <div className="space-y-2.5">
          {resolved.aiGuides.map((guide, index) => (
            <ActionCard
              key={`guide-${guide.step}-${index}`}
              step={guide.step}
              checklist={guide.checklist}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-base font-semibold text-neutral-950">
          실패 패턴
        </h2>
        <p className="mb-3 text-xs text-[#8A8A8A]">
          이번 사례에서 분석된 주요 실패 패턴입니다.
        </p>
        <div className="flex flex-wrap gap-2">
          {resolved.failurePatterns.map((pattern, index) => (
            <span
              key={`${pattern}-${index}`}
              className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#555555] shadow-[0_2px_6px_rgba(15,23,42,0.04)]"
            >
              #{pattern}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-base font-semibold text-neutral-950">
          유사 사례
        </h2>
        <p className="mb-3 text-xs text-[#8A8A8A]">
          이 사례와 비슷한 다른 사례를 추천해드려요.
        </p>
        <div className="space-y-2.5">
          {resolved.similarCases.map((c, index) => (
            <SimilarCaseCard
              key={`case-${index}`}
              title={c.title}
              tags={c.tags}
              similarity={c.similarity}
              durationMonths={c.durationMonths}
              monthlyRevenue={c.monthlyRevenue}
            />
          ))}
        </div>
        <button
          type="button"
          className="mt-4 w-full text-center text-xs text-[#8A8A8A] underline underline-offset-2"
        >
          모든 사례 보기
        </button>
      </section>
    </div>
  );
}
