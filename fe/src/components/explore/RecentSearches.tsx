import type { ExploreTag } from '../../lib/explore-tags';
import type { RecentExploreSearch } from '../../lib/recent-explore-searches';

type Props = {
  items: RecentExploreSearch[];
  tags: ExploreTag[];
  onSelect: (item: RecentExploreSearch) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
};

function formatSearchedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;
}

function findTagLabel(tags: ExploreTag[], key: string) {
  return tags.find((item) => item.key === key)?.label ?? key;
}

export default function RecentSearches({
  items,
  tags,
  onSelect,
  onRemove,
  onClear,
}: Props) {
  return (
    <section className="flex w-full flex-col gap-[12px] bg-[#FFFFFF] px-[16px] py-[16px]">
      <div className="flex w-full items-center justify-between">
        <div>
          <h2 className="text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-[#131416]">
            최근 검색
          </h2>
          <p className="text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#8A8A8A]">
            검색어와 선택 태그 조합을 다시 불러올 수 있습니다.
          </p>
        </div>

        {items.length ? (
          <button
            type="button"
            onClick={onClear}
            className="text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#8A8A8A]"
            aria-label="최근 검색 전체 삭제"
          >
            전체 삭제
          </button>
        ) : null}
      </div>

      {items.length ? (
        <div className="flex w-full flex-col gap-[8px]">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex w-full items-start justify-between rounded-[10px] border border-[#E6E6E6] bg-[#F8F8F8] px-[12px] py-[12px]"
            >
              <button
                type="button"
                onClick={() => onSelect(item)}
                className="flex min-w-0 flex-1 flex-col items-start gap-[6px] text-left"
                aria-label={`${item.query || '태그 검색'} 최근 검색 다시 실행`}
              >
                <span className="text-[14px] font-[600] leading-[16.8px] tracking-[0px] text-[#131416]">
                  {item.query || '태그만 선택한 검색'}
                </span>
                <div className="flex flex-wrap gap-[4px]">
                  {item.tags.length ? (
                    item.tags.map((tagKey) => (
                      <span
                        key={`${item.id}-${tagKey}`}
                        className="rounded-[999px] bg-[#FFFFFF] px-[8px] py-[2px] text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#5E5E5E]"
                      >
                        {findTagLabel(tags, tagKey)}
                      </span>
                    ))
                  ) : (
                    <span className="text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#8A8A8A]">
                      태그 없음
                    </span>
                  )}
                </div>
                <span className="text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#8A8A8A]">
                  {formatSearchedAt(item.searchedAt)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="ml-[8px] shrink-0 text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#BABABA]"
                aria-label={`${item.query || '최근 검색'} 삭제`}
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[10px] bg-[#F8F8F8] px-[16px] py-[20px]">
          <p className="text-[14px] font-[400] leading-[19.6px] tracking-[0px] text-[#757575]">
            아직 최근 검색이 없습니다.
          </p>
        </div>
      )}
    </section>
  );
}
