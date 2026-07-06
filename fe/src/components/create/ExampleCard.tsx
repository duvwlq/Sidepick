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
  onNext: () => void;
};

export default function ExampleCard({
  visible,
  loading,
  error,
  examples,
  exampleIndex,
  onToggleVisible,
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
                <path
                  d="M6.5 8h7M6.5 10.5h5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
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

      <p className="font-['Pretendard'] text-[10px] font-[300] leading-[14px] text-[#8A8A8A]">
        * 예시를 참고하면 더 자세하게 작성할 수 있습니다.
      </p>

      {visible ? (
        <div className="rounded-[10px] border border-[#5A876E] bg-white px-[16px] py-[14px]">
          {loading ? (
            <div className="text-[12px] leading-[16.8px] text-[#8A8A8A]">작성 예시를 불러오는 중이에요.</div>
          ) : activeExample ? (
            <>
              <div className="space-y-[4px] font-['Pretendard'] text-[12px] leading-[16.8px] text-[#5E5E5E]">
                {activeExample.guide
                  .split('\n')
                  .filter(Boolean)
                  .map((line) => (
                    <p key={`${activeExample.key}-${line}`}>{line}</p>
                  ))}
              </div>

              <div className="mt-[12px] border-t border-[#EAEAEA] pt-[12px]">
                <button
                  type="button"
                  onClick={onNext}
                  className="flex w-full items-center justify-center gap-[6px] text-[12px] font-[500] leading-[14.4px] text-[#5A876E]"
                >
                  <svg viewBox="0 0 16 16" className="h-[14px] w-[14px]" aria-hidden="true">
                    <path
                      d="M8 2.5a5.5 5.5 0 1 0 4.37 8.84"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                    <path
                      d="M9.5 2.75h3v3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12.5 2.75L8.75 6.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                  </svg>
                  다른 예시 보기
                </button>
              </div>
            </>
          ) : (
            <div className="text-[12px] leading-[16.8px] text-[#8A8A8A]">
              {error ?? '선택한 카테고리와 어려움에 맞는 작성 예시를 준비 중이에요.'}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
