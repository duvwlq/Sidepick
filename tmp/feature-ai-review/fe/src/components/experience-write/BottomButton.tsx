type Props = {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  showChevron?: boolean;
};

export default function BottomButton({
  label,
  disabled,
  onClick,
  showChevron = false,
}: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex h-[48px] w-full items-center justify-center gap-[4px] rounded-[8px] py-[5px] font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-[#FFFFFF] [font-feature-settings:'case'_1] ${
        disabled ? 'bg-[#BABABA]' : 'bg-[#131416]'
      }`}
    >
      <span>{label}</span>
      {showChevron ? <ChevronRight /> : null}
    </button>
  );
}

function ChevronRight() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-[16px] w-[16px] shrink-0"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 3.333L10.667 8 6 12.667"
        stroke="#FFFFFF"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
