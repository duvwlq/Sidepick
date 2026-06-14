import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { buttonClassName, type AppButtonSize, type AppButtonTone } from './button-class-name';

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  tone?: AppButtonTone;
  size?: AppButtonSize;
  fullWidth?: boolean;
};

export default function AppButton({
  children,
  tone = 'primary',
  size = 'lg',
  fullWidth = false,
  className = '',
  type = 'button',
  ...props
}: AppButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName({ tone, size, fullWidth, className })}
      {...props}
    >
      {children}
    </button>
  );
}
