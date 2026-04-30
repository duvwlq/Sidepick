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
    <div
      className={`flex h-10 items-center justify-between rounded-full bg-[#F8F8F8] px-4 py-[10px] ${className} ${
        onClick ? 'cursor-text' : ''
      }`}
      onClick={onClick}
    >
      <input
        type="text"
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-[14px] font-normal leading-[1.4] text-[#131416] outline-none placeholder:text-[#BABABA]"
      />
      <img src={searchIcon} alt="검색" className="h-5 w-5 shrink-0" />
    </div>
  );
}
