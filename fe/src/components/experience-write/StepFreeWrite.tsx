type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function StepFreeWrite({ value, onChange }: Props) {
  return (
    <div className="rounded-[24px] bg-white px-5 pb-6 pt-7 shadow-[0_6px_20px_rgba(15,23,42,0.06)]">
      <h2 className="text-[20px] font-semibold leading-[1.45] text-[#111111]">
        경험을 자유롭게 정리해볼까요?
      </h2>
      <p className="mt-2 text-sm leading-6 text-[#666666]">
        어떤 계기로 시작했고, 진행하면서 어떤 어려움을 겪었는지 편하게 적어주세요.
      </p>

      <div className="mt-6">
        <div className="mb-2 text-sm font-semibold text-[#111111]">
          최소 10자 이상 작성해 주세요 <span className="text-[#D33B3B]">*</span>
        </div>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-64 w-full rounded-[18px] border border-[#E4E7EC] p-4 text-sm leading-6 text-[#111111] outline-none placeholder:text-[#9CA3AF]"
          placeholder="어떤 계기로 시작했고, 진행하면서 어떤 어려움을 겪었는지 편하게 적어주세요."
        />
        <div className="mt-2 text-right text-xs text-[#9CA3AF]">
          {value.length}/2000
        </div>
      </div>
    </div>
  );
}
