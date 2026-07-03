import type { ChangeEvent, FormEvent } from 'react';
import SearchBar from '../common/SearchBar';

type Props = {
  inputValue: string;
  appliedQuery: string;
  selectedTagCount: number;
  onInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  onReset: () => void;
};

export default function ExploreSearchBar({
  inputValue,
  appliedQuery,
  selectedTagCount,
  onInputChange,
  onSubmit,
  onReset,
}: Props) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <section className="flex w-full flex-col gap-[12px] bg-[#FFFFFF] px-[16px] py-[16px]">
      <form onSubmit={handleSubmit} className="flex w-full items-center gap-[8px]">
        <SearchBar
          value={inputValue}
          onChange={onInputChange}
          className="flex-1"
          placeholder="원하는 실패 사례를 검색해보세요!"
        />
        <button
          type="submit"
          className="flex h-[40px] shrink-0 items-center justify-center rounded-[999px] bg-[#131416] px-[16px]"
          aria-label="검색 실행"
        >
          <span className="text-[12px] font-[600] leading-[14.4px] tracking-[0px] text-[#FFFFFF]">
            검색
          </span>
        </button>
      </form>

      <div className="flex w-full items-center justify-between">
        <div className="min-w-0">
          <p className="text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#8A8A8A]">
            {appliedQuery
              ? `현재 검색어: ${appliedQuery}`
              : '검색어 없이 전체 사례를 보고 있습니다.'}
          </p>
          <p className="text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#8A8A8A]">
            선택 태그 {selectedTagCount}개
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="flex h-[32px] shrink-0 items-center justify-center rounded-[999px] border border-[#D8D8D8] bg-[#FFFFFF] px-[12px]"
          aria-label="검색 조건 초기화"
        >
          <span className="text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#5E5E5E]">
            초기화
          </span>
        </button>
      </div>
    </section>
  );
}
