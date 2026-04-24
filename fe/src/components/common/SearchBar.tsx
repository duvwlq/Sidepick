import type { ChangeEvent } from 'react';
import searchIcon from '../../assets/images/search.svg';

type SearchBarProps = {
  placeholder?: string;
  value?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
};

export default function SearchBar({
  placeholder = '키워드로 경험을 찾아보세요',
  value,
  onChange,
}: SearchBarProps) {
  return (
    <div className="flex h-12 items-center rounded-full border border-[#ECEFF4] bg-[#F8F9FB] px-4">
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm text-[#111111] outline-none placeholder:text-[#9CA3AF]"
      />
      <img src={searchIcon} alt="검색" className="h-5 w-5 opacity-60" />
    </div>
  );
}
