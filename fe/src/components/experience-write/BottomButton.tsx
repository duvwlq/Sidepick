import AppButton from '../common/Button';

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
    <AppButton
      disabled={disabled}
      onClick={onClick}
      tone="primary"
      size="write"
      fullWidth
      className="[font-feature-settings:'case'_1]"
    >
      <span>{label}</span>
      {showChevron ? <ChevronRight /> : null}
    </AppButton>
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
