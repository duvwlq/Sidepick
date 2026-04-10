type Props = {
  leftLabel?: string;
  rightLabel?: string;
};

export default function CaseSegment({
  leftLabel = '최근 등록된 사례',
  rightLabel = '인기 사례',
}: Props) {
  return (
    <div className="w-full rounded-full bg-[#E9E9E9] p-1">
      <div className="grid grid-cols-2">
        <button
          type="button"
          className="h-10 rounded-full bg-white text-sm font-medium text-black shadow-sm"
        >
          {leftLabel}
        </button>

        <button
          type="button"
          className="h-10 rounded-full bg-transparent text-sm font-medium text-black/45"
        >
          {rightLabel}
        </button>
      </div>
    </div>
  );
}
