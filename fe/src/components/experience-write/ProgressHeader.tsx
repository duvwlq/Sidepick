type Props = {
  step: number;
  progress: number;
};

export default function ProgressHeader({ step, progress }: Props) {
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center justify-between text-xs">
        <div className="text-[#555555]">
          <span className="font-semibold text-[#111111]">{step}</span>
          <span>/4 단계</span>
        </div>
        <span className="font-semibold text-[#555555]">{progress}%</span>
      </div>

      <div className="h-2 rounded-full bg-[#ECEFF4]">
        <div
          className="h-2 rounded-full bg-[#111111] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
