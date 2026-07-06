import type { ExploreTag } from '../../lib/explore-tags';

type Props = {
  tags: ExploreTag[];
  selectedTags: string[];
  onToggleTag: (tagKey: string) => void;
};

export default function ExploreTagFilter({
  tags,
  selectedTags,
  onToggleTag,
}: Props) {
  return (
    <section className="flex w-full flex-col gap-[12px] bg-[#FFFFFF] px-[16px] py-[16px]">
      <div className="flex w-full items-center justify-between">
        <div>
          <h2 className="text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-[#131416]">
            실제 태그 필터
          </h2>
          <p className="text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#8A8A8A]">
            선택한 태그는 AND 조건으로 함께 적용됩니다.
          </p>
        </div>
      </div>

      {tags.length ? (
        <div className="flex w-full flex-wrap gap-[6px]">
          {tags.map((tag) => {
            const active = selectedTags.includes(tag.key);

            return (
              <button
                key={tag.key}
                type="button"
                onClick={() => onToggleTag(tag.key)}
                aria-pressed={active}
                aria-label={`${tag.label} 태그 ${active ? '해제' : '선택'}`}
                className={`flex items-center justify-center gap-[4px] rounded-[999px] px-[10px] py-[6px] ${
                  active
                    ? 'bg-[#131416]'
                    : 'border border-[#E6E6E6] bg-[#F8F8F8]'
                }`}
              >
                <span
                  className={`text-[12px] font-[400] leading-[14.4px] tracking-[0px] ${
                    active ? 'text-[#FFFFFF]' : 'text-[#5E5E5E]'
                  }`}
                >
                  {tag.label}
                </span>
                <span
                  className={`text-[12px] font-[400] leading-[14.4px] tracking-[0px] ${
                    active ? 'text-[#FFFFFF]' : 'text-[#8A8A8A]'
                  }`}
                >
                  {tag.count}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[10px] bg-[#F8F8F8] px-[16px] py-[20px]">
          <p className="text-[14px] font-[400] leading-[19.6px] tracking-[0px] text-[#757575]">
            아직 추출된 태그가 없습니다.
          </p>
        </div>
      )}
    </section>
  );
}
