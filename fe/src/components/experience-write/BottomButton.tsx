type Props = {
  label: string;
  disabled?: boolean;
  onClick: () => void;
};

export default function BottomButton({ label, disabled, onClick }: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex h-[48px] w-full items-center justify-center rounded-[8px] py-[5px] font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-[#FFFFFF] [font-feature-settings:'case'_1] ${
        disabled ? 'bg-[#BABABA]' : 'bg-[#131416]'
      }`}
    >
      {label}
    </button>
  );
}
