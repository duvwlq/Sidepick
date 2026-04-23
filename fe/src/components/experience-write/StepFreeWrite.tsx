type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function StepFreeWrite({ value, onChange }: Props) {
  return (
    <div className="space-y-5 rounded-[10px] bg-white p-5">
      <h2 className="mb-4 text-xl font-bold">자유 서술</h2>
      <div className="mb-2.5 inline-flex items-start gap-1">
        <div className="text-base font-semibold text-neutral-950">
          최소 50자 이상 작성해 주세요
        </div>
        <div className="text-base text-neutral-950">*</div>
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-60 w-full rounded-xl border p-3"
        placeholder="실패 경험 내용을 작성해 주세요"
      />

      <div className="mt-1 text-right text-xs text-gray-400">
        {value.length}/2000
      </div>
    </div>
  );
}
