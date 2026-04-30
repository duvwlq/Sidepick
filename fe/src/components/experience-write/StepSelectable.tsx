import FieldLabel from './FieldLabal';

type Props = {
  options: string[];
  selected: string[];
  onSelect: (value: string) => void;
};

export default function StepSelectable({ options, selected, onSelect }: Props) {
  return (
    <div className="flex w-full flex-col items-start gap-[10px]">
      <FieldLabel label="복수 선택 가능" required />
      <div className="flex w-full flex-col gap-[10px]">
        {options.map((item) => {
          const active = selected.includes(item);

          return (
            <button
              key={item}
              type="button"
              onClick={() => onSelect(item)}
              className={`flex h-[40px] w-full items-center gap-[4px] rounded-[8px] border px-[16px] py-[10px] ${
                active
                  ? 'border-[#131416] bg-[#F8F8F8]'
                  : 'border-[#E6E6E6] bg-[#FFFFFF]'
              }`}
            >
              <CheckIcon active={active} />
              <span className="min-w-0 flex-1 truncate text-left font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] tracking-[0px] text-[#757575] [font-feature-settings:'case'_1]">
                {item}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CheckIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 14 14" className="h-[14px] w-[14px]" fill="none" aria-hidden="true">
      <path
        d="M3 7.1L5.7 9.8L11 4.5"
        stroke={active ? '#131416' : '#BABABA'}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
