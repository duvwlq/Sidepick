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
      className={`flex h-12 items-center rounded-full bg-[#F1F3F5] px-4 ${className} ${
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
        className="flex-1 bg-transparent text-sm text-[#111111] outline-none placeholder:text-[#9AA0A6]"
      />
      <img src={searchIcon} alt="검색" className="h-5 w-5 opacity-60" />
    </div>
  );
}
