import type { ChangeEvent, KeyboardEvent } from 'react';
import searchIcon from '../../assets/images/search.svg';

type SearchBarProps = {
  placeholder?: string;
  value?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onClick?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
  className?: string;
};

export default function SearchBar({
  placeholder = '원하는 실패 사례를 검색해보세요!',
  value,
  onChange,
  onClick,
  onKeyDown,
  readOnly = false,
  className = '',
}: SearchBarProps) {
  const visibleText = value || placeholder;
  const hasValue = Boolean(value);

  return (
    <label className={`relative block h-[40px] w-full cursor-text ${className}`} onClick={onClick}>
      <span className="absolute inset-0 flex items-center justify-between rounded-[999px] bg-[#F8F8F8] px-[16px] py-[10px]">
        <span
          className={`pointer-events-none flex min-w-0 flex-1 flex-col justify-center overflow-hidden text-left font-['Pretendard'] text-[14px] font-[400] leading-[0] tracking-[0px] ${
            hasValue ? 'text-[#131416]' : 'text-[#BABABA]'
          } [font-feature-settings:'case'_1]`}
        >
          <span className="truncate leading-[1.4]">{visibleText}</span>
        </span>
        <span
          className="pointer-events-none relative ml-[8px] h-[20px] w-[20px] shrink-0 overflow-hidden"
          aria-hidden="true"
        >
          <span className="absolute inset-[12.5%]">
            <img
              src={searchIcon}
              alt=""
              className="absolute inset-[-5%] block h-[110%] w-[110%] max-w-none"
            />
          </span>
        </span>
      </span>
      <input
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        readOnly={readOnly}
        aria-label={placeholder}
        className="absolute inset-0 h-full w-full bg-transparent px-[16px] py-[10px] font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] tracking-[0px] text-transparent caret-[#000000] outline-none [font-feature-settings:'case'_1]"
      />
    </label>
  );
}
