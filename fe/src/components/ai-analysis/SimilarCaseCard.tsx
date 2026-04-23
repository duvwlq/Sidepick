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
    <button
      type="button"
      className="w-full rounded-2xl bg-[#F5F5F5] p-4 text-left"
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex gap-2  bg-gray-100 rounded-lg">
          {tags.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="text-[10px] text-[#9A9A9A] px-2 py-0.5"
            >
              {tag}
            </span>
          ))}
        </div>

        <span className="text-[11px] font-semibold text-black">
          유사도 {similarity}%
        </span>
      </div>

      <p className="self-stretch justify-start text-neutral-950 text-lg font-semibold font-['Pretendard'] leading-7">
        {title}
      </p>
    </button>
  );
}
