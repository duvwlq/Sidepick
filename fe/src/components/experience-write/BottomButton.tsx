type Props = {
  label: string;
  disabled?: boolean;
  onClick: () => void;
};

export default function BottomButton({ label, disabled, onClick }: Props) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`w-full h-12 rounded-full mt-4 ${
        disabled ? 'bg-gray-300' : 'bg-black text-white'
      }`}
    >
      {label}
    </button>
  );
}
