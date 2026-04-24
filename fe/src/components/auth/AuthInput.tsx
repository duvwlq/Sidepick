import type { InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export default function AuthInput({ label, className = '', ...props }: Props) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-medium text-[#555555]">{label}</span>
      <input
        className={`h-12 w-full rounded-xl border border-[#E5E5E5] bg-[#F7F7F7] px-4 text-sm text-black outline-none placeholder:text-[#B8B8B8] focus:border-black ${className}`}
        {...props}
      />
    </label>
  );
}
