import type { ButtonHTMLAttributes, ReactNode } from 'react';
import AppButton from '../common/Button';

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
  const toneByVariant: Record<Variant, 'primary' | 'secondary' | 'kakao'> = {
    primary: 'primary',
    secondary: 'secondary',
    kakao: 'kakao',
  };

  return (
    <AppButton tone={toneByVariant[variant]} size="auth" fullWidth className={className} {...props}>
      {children}
    </AppButton>
  );
}
