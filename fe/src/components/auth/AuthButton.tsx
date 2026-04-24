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
    'h-12 w-full rounded-xl text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60';

  const variantStyle: Record<Variant, string> = {
    primary: 'bg-[#111111] text-white',
    secondary: 'border border-[#E5E5E5] bg-white text-[#666666]',
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
