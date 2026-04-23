import type { ChangeEvent } from 'react';

interface AuthInputProps {
  label: string;
  type?: string;
  placeholder?: string;
  value?: string;
  readOnly?: boolean;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

export default function AuthInput({
  label,
  type = 'text',
  placeholder,
  value,
  readOnly = false,
  onChange,
}: AuthInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-[#555]">{label}</label>

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        readOnly={readOnly}
        onChange={onChange}
        className={`h-11 w-full rounded-md border px-3 text-sm outline-none ${
          readOnly
            ? 'border-[#ececec] bg-[#f2f2f2] text-[#666]'
            : 'border-[#e5e5e5] bg-[#f7f7f7] text-black placeholder:text-[#b8b8b8] focus:border-black'
        }`}
      />
    </div>
  );
}
