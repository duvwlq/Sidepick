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
    <div className="flex flex-col gap-[4px]">
      <button
        type="button"
        onClick={onToggleVisible}
        className="flex h-[44px] w-full items-center rounded-[8px] border border-[#5A876E] bg-[#F8F8F8] px-[16px] py-[12px]"
      >
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-[4px]">
            <span className="flex h-[18px] w-[18px] items-center justify-center text-[#5A876E]">
              <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" aria-hidden="true">
                <path
                  d="M4.5 4.5h11a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5H8l-3.5 2.5V14.5H4.5A1.5 1.5 0 0 1 3 13V6A1.5 1.5 0 0 1 4.5 4.5Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path d="M6.5 8h7M6.5 10.5h5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </span>
            <span className="font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] text-[#131416]">작성 예시</span>
          </div>
          <span className="text-[#5A876E]">
            <svg
              viewBox="0 0 20 20"
              className={`h-[20px] w-[20px] transition-transform ${visible ? 'rotate-180' : ''}`}
              aria-hidden="true"
            >
              <path
                d="M5 7.5L10 12.5L15 7.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </button>

      <p className="font-['Pretendard'] text-[10px] font-[300] leading-[14px] text-[#8A8A8A]">* 예시를 참고하면 더 자세하게 작성할 수 있습니다.</p>

      {visible ? (
        <div className="rounded-[10px] bg-[#F8F8F8] px-[12px] py-[14px]">
          {loading ? (
            <div className="text-[12px] leading-[16.8px] text-[#8A8A8A]">작성 예시를 불러오는 중이에요.</div>
          ) : activeExample ? (
            <>
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

              <div className="space-y-[8px] font-['Pretendard'] text-[12px] leading-[16.8px] text-[#5E5E5E]">
                {activeExample.guide
                  .split('\n')
                  .filter(Boolean)
                  .map((line) => (
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
            </>
          ) : (
            <div className="text-[12px] leading-[16.8px] text-[#8A8A8A]">{error ?? '선택한 카테고리와 어려운 조합에 맞는 작성 예시를 준비 중이에요.'}</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
