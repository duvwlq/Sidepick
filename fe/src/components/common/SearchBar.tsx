import searchIcon from '../../assets/images/Search.svg';

type SearchBarProps = {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function SearchBar({
  placeholder = '원하는 실패 사례를 검색해보세요!',
  value,
  onChange,
}: SearchBarProps) {
  return (
    <div className="flex items-center bg-gray-100 rounded-[999px] h-10 px-4 py-2.5">
      {/* 인풋 */}
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="bg-transparent outline-none flex-1 text-sm"
      />

      {/* 아이콘 */}
      <img src={searchIcon} alt="검색" className="w-6 h-6 text-gray-400" />
    </div>
  );
}
