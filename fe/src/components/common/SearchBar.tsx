import searchIcon from '../../assets/images/search.svg';

type SearchBarProps = {
  placeholder?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function SearchBar({
  placeholder = '현재는 목록 조회만 연결되어 있습니다.',
  value,
  onChange,
}: SearchBarProps) {
  return (
    <div className="flex h-10 items-center rounded-[999px] bg-gray-100 px-4 py-2.5">
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm outline-none"
      />
      <img src={searchIcon} alt="검색" className="h-6 w-6 text-gray-400" />
    </div>
  );
}
