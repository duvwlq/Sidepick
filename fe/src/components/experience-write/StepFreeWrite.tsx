import FieldLabel from './FieldLabal';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function StepFreeWrite({ value, onChange }: Props) {
  return (
    <div className="flex w-full flex-col items-start gap-[10px]">
      <FieldLabel label="최소 10자 이상 작성해주세요" required />
      <div className="relative h-[299px] w-full overflow-hidden rounded-[10px] bg-[#F8F8F8]">
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between px-[16px] py-[10px]">
          <div className="whitespace-pre-wrap font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] tracking-[0px] text-[#111111] [font-feature-settings:'case'_1]">
            {value}
          </div>

          {!value ? (
            <p className="absolute left-[16px] top-[10px] w-[311px] font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] tracking-[0px] text-[#BABABA] [font-feature-settings:'case'_1]">
              어떤 계기로 시작했고, 진행하면서 어디서 어려움을 겪으셨는지 편하게 적어주세요.
            </p>
          ) : null}

          <div className="self-end">
            <div className="flex items-center">
              <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#8A8A8A] [font-feature-settings:'case'_1]">
                {value.length}
              </span>
              <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949] [font-feature-settings:'case'_1]">
                / 2000
              </span>
            </div>
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
