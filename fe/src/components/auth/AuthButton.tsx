import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'kakao';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
};

export default function AuthButton({
  children,
  variant = 'primary',
  className = '',
  ...props
}: Props) {
  const baseStyle =
    "flex h-[48px] w-full items-center justify-center rounded-[10px] font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] transition disabled:cursor-not-allowed disabled:opacity-60";

  const variantStyle: Record<Variant, string> = {
    primary: 'bg-[#111111] text-white',
    secondary: 'border border-[#E5E5E5] bg-white text-[#8A8A8A]',
    kakao: 'bg-[#FEE500] text-[#191600]',
  };

  return (
    <button
      type="button"
      className={`${baseStyle} ${variantStyle[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
