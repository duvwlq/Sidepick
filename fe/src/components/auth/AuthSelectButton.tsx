interface AuthSelectButtonProps {
  label: string;
  placeholder: string;
  value?: string;
  readOnly?: boolean;
  onClick: () => void;
}

export default function AuthSelectButton({
  label,
  placeholder,
  value,
  readOnly = false,
  onClick,
}: AuthSelectButtonProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-[#555]">{label}</label>

      <button
        type="button"
        onClick={onClick}
        disabled={readOnly}
        className={`flex h-11 w-full items-center justify-between rounded-md border px-3 text-sm ${
          readOnly
            ? 'cursor-default border-[#ececec] bg-[#f2f2f2] text-[#666]'
            : 'border-[#e5e5e5] bg-[#f7f7f7] text-black'
        }`}
      >
        <span className={value ? '' : 'text-[#b8b8b8]'}>
          {value || placeholder}
        </span>
        {!readOnly && <span className="text-xs text-[#999]">▼</span>}
      </button>
    </div>
  );
}
