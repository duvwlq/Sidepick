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

      <div className="h-[10px] w-full overflow-hidden rounded-[999px] bg-[#EEEEEE]">
        <div
          className="h-[10px] rounded-[999px] bg-[#09090B] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
