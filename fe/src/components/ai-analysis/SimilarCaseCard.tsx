type SimilarCaseCardProps = {
  title: string;
  tags: string[];
  similarity: number;
  durationMonths?: number;
  monthlyRevenue?: number;
  onClick?: () => void;
};

export default function SimilarCaseCard({
  title,
  tags,
  similarity,
  durationMonths,
  monthlyRevenue,
  onClick,
}: SimilarCaseCardProps) {
  const hasMeta = durationMonths !== undefined || monthlyRevenue !== undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl bg-white p-4 text-left shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition active:scale-[0.99]"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {tags.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="rounded-full bg-[#F3F3F3] px-2 py-0.5 text-[11px] text-[#8A8A8A]"
            >
              {tag}
            </span>
          ))}
        </div>

        <span className="shrink-0 text-xs font-semibold text-black">
          유사도 {similarity}%
        </span>
      </div>

      <p className="mb-2 text-base font-semibold leading-6 text-neutral-950">
        {title}
      </p>

      {hasMeta ? (
        <div className="flex flex-wrap gap-3 text-[11px] text-[#8A8A8A]">
          {durationMonths !== undefined ? (
            <span>진행 기간 {durationMonths}개월</span>
          ) : null}
          {monthlyRevenue !== undefined ? (
            <span>월 수익 {monthlyRevenue.toLocaleString()}원</span>
          ) : null}
        </div>
      ) : null}
    </button>
  );
}
