import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'kakao';
}

export default function AuthButton({
  children,
  variant = 'primary',
  className = '',
  ...props
}: AuthButtonProps) {
  const baseStyle =
    'w-full h-11 rounded-md text-sm font-medium transition-opacity';

  const variantStyle = {
    primary: 'bg-black text-white hover:opacity-90',
    secondary: 'border border-[#e5e5e5] bg-white text-[#666]',
    kakao: 'bg-[#FEE500] text-black',
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
