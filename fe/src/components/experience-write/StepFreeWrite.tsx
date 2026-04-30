import FieldLabel from './FieldLabal';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function StepFreeWrite({ value, onChange }: Props) {
  return (
    <div className="flex w-full flex-col items-start gap-[10px]">
      <FieldLabel label="최소 10자 이상 작성해주세요" required />
      <div className="relative h-[299px] w-full rounded-[10px] bg-[#F8F8F8]">
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between px-[16px] py-[10px] font-['Pretendard'] tracking-[0px] [font-feature-settings:'case'_1]">
          <div className="whitespace-pre-wrap text-[14px] font-[400] leading-[19.6px] text-[#111111]">
            {value}
          </div>
          {!value ? (
            <p className="absolute left-[16px] top-[10px] text-[14px] font-[400] leading-[19.6px] text-[#BABABA]">
              어떤 계기로 시작했고, 진행하면서 어디서 어려움을 겪으셨는지 편하게 적어주세요.
            </p>
          ) : null}
          <div className="self-end text-[12px] font-[400] leading-[16.8px]">
            <span className="text-[#8A8A8A]">{value.length}</span>
            <span className="text-[#494949]">/ 2000</span>
          </div>
        </div>
        <textarea
          value={value}
          maxLength={2000}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-0 h-full w-full resize-none bg-transparent px-[16px] py-[10px] text-transparent caret-[#000000] outline-none"
          aria-label="자유 서술"
        />
      </div>
    </div>
  );
}
