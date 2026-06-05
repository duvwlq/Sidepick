type GuideExample = {
  key: string;
  categoryLabel: string;
  difficultyLabel: string;
  guide: string;
};

type ExampleCardProps = {
  visible: boolean;
  loading: boolean;
  error: string | null;
  examples: GuideExample[];
  exampleIndex: number;
  onToggleVisible: () => void;
  onPrevious: () => void;
  onNext: () => void;
};

export default function ExampleCard({
  visible,
  loading,
  error,
  examples,
  exampleIndex,
  onToggleVisible,
  onPrevious,
  onNext,
}: ExampleCardProps) {
  const activeExample = examples[exampleIndex] ?? null;

  return (
    <div className="rounded-[10px] border border-[#5A876E] bg-white px-[12px] py-[12px]">
      <button type="button" onClick={onToggleVisible} className="flex w-full items-center justify-between text-left">
        <span className="text-[14px] font-[500] text-[#131416]">작성 예시</span>
        <span className="text-[#5A876E]">{visible ? '−' : '+'}</span>
      </button>
      <p className="pt-[6px] text-[10px] leading-[12px] text-[#8A8A8A]">예시를 참고하면 더 자세하게 작성할 수 있어요</p>

      {visible ? (
        <div className="pt-[10px]">
          {loading ? (
            <div className="rounded-[10px] bg-[#F8F8F8] px-[12px] py-[14px] text-[12px] leading-[18px] text-[#8A8A8A]">
              작성 예시를 불러오는 중이에요.
            </div>
          ) : activeExample ? (
            <div className="rounded-[10px] bg-[#F8F8F8] px-[12px] py-[14px]">
              <div className="flex items-center justify-between gap-[8px] pb-[10px]">
                <div className="flex flex-wrap items-center gap-[6px]">
                  <span className="rounded-full bg-[#E9F1EC] px-[8px] py-[3px] text-[10px] font-[500] leading-[12px] text-[#5A876E]">
                    {activeExample.categoryLabel}
                  </span>
                  <span className="rounded-full bg-white px-[8px] py-[3px] text-[10px] font-[500] leading-[12px] text-[#6A6A6A]">
                    {activeExample.difficultyLabel}
                  </span>
                </div>
                {examples.length > 1 ? (
                  <span className="text-[10px] leading-[12px] text-[#8A8A8A]">
                    {exampleIndex + 1} / {examples.length}
                  </span>
                ) : null}
              </div>
              <div className="space-y-[8px] text-[12px] leading-[18px] text-[#5E5E5E]">
                {activeExample.guide.split('\n').filter(Boolean).map((line) => (
                  <p key={`${activeExample.key}-${line}`}>{line}</p>
                ))}
              </div>
              {examples.length > 1 ? (
                <div className="flex justify-end gap-[8px] pt-[12px]">
                  <button
                    type="button"
                    onClick={onPrevious}
                    className="rounded-[8px] border border-[#D9E6DE] px-[10px] py-[6px] text-[11px] font-[500] text-[#5A876E]"
                  >
                    이전 예시
                  </button>
                  <button
                    type="button"
                    onClick={onNext}
                    className="rounded-[8px] border border-[#D9E6DE] px-[10px] py-[6px] text-[11px] font-[500] text-[#5A876E]"
                  >
                    다음 예시
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-[10px] bg-[#F8F8F8] px-[12px] py-[14px] text-[12px] leading-[18px] text-[#8A8A8A]">
              {error ?? '선택한 카테고리와 어려움 조합에 맞는 작성 예시를 준비 중이에요.'}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
