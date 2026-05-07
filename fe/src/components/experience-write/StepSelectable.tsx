import FieldLabel from './FieldLabel';

type Props = {
  options: string[];
  selected: string[];
  onSelect: (value: string) => void;
  otherValue?: string;
  onOtherChange?: (value: string) => void;
};

export default function StepSelectable({
  options,
  selected,
  onSelect,
  otherValue = '',
  onOtherChange,
}: Props) {
  return (
    <div className="flex w-full flex-col items-start gap-[10px]">
      <FieldLabel label="복수 선택 가능" required />

      <div className="flex w-full flex-col gap-[10px]">
        {options.map((item) => {
          const active = selected.includes(item);
          const isEtc = item === '기타';
          const expanded = isEtc && active;

          return (
            <div
              key={item}
              className={`flex w-full flex-col rounded-[16px] border border-solid ${
                expanded
                  ? 'border-[#131416] bg-[#FFFFFF] px-[16px] pb-[16px] pt-[14px]'
                  : active
                    ? 'border-[#131416] bg-[#F8F8F8]'
                    : 'border-[#E6E6E6] bg-[#FFFFFF]'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(item)}
                className={`flex w-full items-center gap-[4px] ${
                  expanded ? 'h-[24px] px-0 py-0' : 'h-[40px] px-[16px] py-[10px]'
                }`}
              >
                <CheckIcon active={active} />
                <div
                  className={`flex min-w-px flex-[1_0_0] flex-col justify-center overflow-hidden text-left font-['Pretendard'] tracking-[0px] [font-feature-settings:'case'_1] ${
                    expanded
                      ? 'text-[16px] font-[600] leading-[19.2px] text-[#131416]'
                      : active
                        ? 'text-[14px] font-[400] leading-[16.8px] text-[#131416]'
                        : 'text-[14px] font-[400] leading-[16.8px] text-[#757575]'
                  }`}
                >
                  <p className="overflow-hidden text-ellipsis whitespace-nowrap">{item}</p>
                </div>
              </button>

              {expanded ? <OtherDetailField value={otherValue} onChange={onOtherChange} /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OtherDetailField({
  value,
  onChange,
}: {
  value: string;
  onChange?: (value: string) => void;
}) {
  const hasValue = Boolean(value.trim());
  const visibleText = hasValue ? value : '기타 의견을 작성해주세요';

  return (
    <div className="relative mt-[12px] h-[40px] w-full rounded-[14px] bg-[#F8F8F8]">
      <div className="pointer-events-none absolute inset-0 flex items-center px-[16px]">
        <span
          className={`font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] tracking-[0px] [font-feature-settings:'case'_1] ${
            hasValue ? 'text-[#131416]' : 'text-[#D0D0D0]'
          }`}
        >
          {visibleText}
        </span>
      </div>
      <input
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        className="absolute inset-0 h-full w-full rounded-[14px] bg-transparent px-[16px] text-transparent caret-[#131416] outline-none"
        aria-label="기타 의견 입력"
      />
    </div>
  );
}

function CheckIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 14 14"
      className="h-[14px] w-[14px] shrink-0"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 7.1L5.7 9.8L11 4.5"
        stroke={active ? '#131416' : '#757575'}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
