import type { ChangeEvent } from 'react';
import searchIcon from '../../assets/images/search.svg';

type SearchBarProps = {
  placeholder?: string;
  value?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onClick?: () => void;
  readOnly?: boolean;
  className?: string;
};

export default function SearchBar({
  placeholder = '원하는 실패 사례를 검색해보세요!',
  value,
  onChange,
  onClick,
  readOnly = false,
  className = '',
}: SearchBarProps) {
  return (
    <label
      className={`flex h-[40px] w-full cursor-text items-center justify-between rounded-[999px] bg-[#F8F8F8] px-[16px] py-[10px] ${className}`}
      onClick={onClick}
    >
      <input
        type="text"
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        placeholder={placeholder}
        className="h-[20px] min-w-0 shrink bg-transparent p-[0px] text-left font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] tracking-[0px] text-[#131416] outline-none placeholder:text-[#BABABA] [font-feature-settings:'case'_1]"
      />
      <span className="relative h-[20px] w-[20px] shrink-0 overflow-hidden" aria-hidden="true">
        <span className="absolute inset-[12.5%]">
          <img
            src={searchIcon}
            alt=""
            className="absolute inset-[-5%] block h-[110%] w-[110%] max-w-none"
          />
        </span>
      </span>
    </label>
  );
}
