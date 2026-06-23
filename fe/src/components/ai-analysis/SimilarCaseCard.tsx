type SimilarCaseCardProps = {
  title: string;
  tags: string[];
  similarity: number;
};

export default function SimilarCaseCard({
  title,
  tags,
  similarity,
}: SimilarCaseCardProps) {
  return (
    <div className="w-full rounded-2xl bg-[#F5F5F5] p-4 text-left">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex flex-wrap gap-2 rounded-lg bg-gray-100 p-1">
          {tags.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="px-2 py-0.5 text-[10px] text-[#9A9A9A]"
            >
              {tag}
            </span>
          ))}
        </div>

        <span className="text-[11px] font-semibold text-black">
          유사도 {similarity}%
        </span>
      </div>

      <p className="text-lg font-semibold leading-7 text-neutral-950">
        {title}
      </p>
    </div>
  );
}
