type Props = {
  value: string;
  onChange: (v: string) => void;
};

export default function StepFreeWrite({ value, onChange }: Props) {
  return (
    <div className="space-y-5 bg-white p-5 rounded-[10px]">
      <h2 className="text-xl font-bold mb-4">자유 서술</h2>
      <div className="inline-flex justify-start items-start gap-1 mb-2.5">
        <div className="justify-start text-neutral-950 text-base font-semibold font-['Pretendard'] leading-7">
          최소 50자 이상 작성해주세요
        </div>
        <div className="justify-start text-neutral-950 text-base font-normal font-['Pretendard'] leading-7">
          *
        </div>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-60 border rounded-xl p-3"
        placeholder="내용을 작성해주세요"
      />

      <div className="text-right text-xs text-gray-400 mt-1">
        {value.length}/2000
      </div>
    </div>
  );
}
