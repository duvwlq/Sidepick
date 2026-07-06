type PatternBarProps = {
  label: string;
  percent: number;
};

export default function PatternBar({ label, percent }: PatternBarProps) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-[#5E5E5E]">{label}</span>
        <span className="text-xs text-[#8A8A8A]">{percent}%</span>
      </div>

      <div className="h-2 w-full rounded-full bg-[#E2E2E2]">
        <div
          className="h-2 rounded-full bg-black transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
