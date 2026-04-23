import { mockAnalysisData } from '../../constants/mockAnalysisData';
import PatternBar from './PatternBar';
import ActionCard from './ActionCard';
import SimilarCaseCard from './SimilarCaseCard';

type SummaryData = {
  nickname: string;
  title: string;
  summaryTitle: string;
  summaryText: string;
  tags: string[];
  patterns: { label: string; percent: number }[];
  actions: {
    title: string;
    scoreLabel: string;
    description: string;
  }[];
  similarCases: {
    title: string;
    tags: string[];
    similarity: number;
  }[];
};

export default function AiAnalysisResult() {
  const data = mockAnalysisData;

  return (
    <div className="bg-[#F3F3F3] px-3 py-4">
      <div className="space-y-6">
        <section className="text-left">
          <p className="mb-2 text-sm font-semibold text-black">분석 결과</p>
          <h1 className="self-stretch justify-start">
            <span className="text-neutral-950 text-2xl font-normal font-['Pretendard'] leading-7">
              {data.nickname}
            </span>
            님의
            <br />
            {data.title}
          </h1>
        </section>

        <section className="rounded-2xl bg-white p-4">
          <button
            type="button"
            className="mb-4 flex h-10 w-full items-center justify-center rounded-full bg-black text-xs font-semibold text-white"
          >
            △ 실패 확률이 높은 결과입니다
          </button>

          <div>
            <h2 className="mb-4 text-base font-bold text-black text-left">
              {data.summaryTitle}
            </h2>

            <p className="whitespace-pre-line text-xs leading-5 text-[#7A7A7A] text-left">
              {data.summaryText}
            </p>

            <div className="h-px bg-gray-200 my-4" />

            <div className="mt-5 flex flex-wrap gap-1">
              {data.tags.map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="rounded-[999px] bg-[#F3F3F3] px-2 py-1/2 text-xs text-[#8A8A8A]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="text-left">
          <h2 className="mb-2 self-stretch justify-start text-neutral-950 text-base font-semibold font-['Pretendard'] leading-4">
            실패 패턴
          </h2>
          <p className="pb-3 text-xs text-[#8A8A8A]">
            같은 업종 실제 원인 별 비교 그래프 데이터입니다.
          </p>

          <div className="rounded-2xl bg-white p-4">
            <div className="space-y-4">
              {data.patterns.map((item, index) => (
                <PatternBar
                  key={`${item.label}-${index}`}
                  label={item.label}
                  percent={item.percent}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="text-left mt-6">
          <h2 className="mb-3 text-base font-bold text-black">추천 행동</h2>

          <div className="space-y-2.5">
            {data.actions.map((action, index) => (
              <ActionCard
                key={`${action.title}-${index}`}
                title={action.title}
                scoreLabel={action.scoreLabel}
                description={action.description}
              />
            ))}
          </div>
        </section>

        <section className="rounded-[10px] bg-white p-4 text-left">
          <h2 className="mb-2 self-stretch justify-start text-neutral-950 text-base font-semibold font-['Pretendard'] leading-4">
            유사 사례
          </h2>
          <p className="pb-3 text-xs text-[#8A8A8A]">
            이 사례와 비슷한 실제 경험을 가진 다른 사례들을 추천해드립니다.
          </p>

          <div className="space-y-2.5">
            {data.similarCases.map((item, index) => (
              <SimilarCaseCard
                key={`${item.title}-${index}`}
                title={item.title}
                tags={item.tags}
                similarity={item.similarity}
              />
            ))}
          </div>

          <button
            type="button"
            className="mt-4 w-full text-center text-xs text-[#8A8A8A] underline underline-offset-2"
          >
            모두 사례 보기
          </button>
        </section>

        <button
          type="button"
          className="w-full self-stretch h-10 px-5 py-[5px] bg-black rounded-[999px] inline-flex justify-center items-center gap-1 text-white text-xs font-bold"
        >
          원문 보러 가기
          <span className="ml-2">{'>'}</span>
        </button>
      </div>
    </div>
  );
}
