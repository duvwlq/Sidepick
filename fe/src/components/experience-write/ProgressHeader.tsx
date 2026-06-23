type Props = {
  step: number;
  progress: number;
};

export default function ProgressHeader({ step, progress }: Props) {
  return (
    <div className="flex w-full flex-col items-start gap-[5px]">
      <div className="flex h-[20px] w-full items-center justify-between font-['Pretendard'] text-[14px] leading-[19.6px] tracking-[0px] text-[#000000] [font-feature-settings:'case'_1]">
        <div className="flex items-center whitespace-nowrap">
          <span className="font-[400]">{step}</span>
          <span className="font-[300]">/4 단계</span>
        </div>
        <div className="flex items-center whitespace-nowrap font-[600]">
          <span>{progress}</span>
          <span>%</span>
        </div>
      </div>

      <div className="h-[6px] w-full overflow-hidden rounded-[999px] bg-[#D8D8D8]">
        <div
          className="h-[6px] rounded-[999px] bg-[linear-gradient(90deg,#92BFA6_0%,#5A876E_100%)] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
