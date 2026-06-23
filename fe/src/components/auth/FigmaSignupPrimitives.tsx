import type { InputHTMLAttributes, ReactNode } from 'react';
import arrowLeftIcon from '../../assets/auth-figma/arrow-left.svg';
import AppButton from '../common/Button';

type SignupScreenProps = {
  title: string;
  headline?: string;
  headlineLines?: string[];
  caption?: string;
  onBack?: () => void;
  children: ReactNode;
};

type SignupFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label: string;
  placeholder: string;
  suffix?: ReactNode;
  fieldHeight?: 40 | 43;
};

type SignupButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: 'soft' | 'primary';
};

export function SignupScreen({
  title,
  headline,
  headlineLines,
  caption,
  onBack,
  children,
}: SignupScreenProps) {
  const resolvedHeadlineLines = headlineLines?.length ? headlineLines : headline ? [headline] : [];

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[375px] flex-col bg-white">
        <div className="flex w-full flex-col">
          <div className="flex h-[64px] w-full items-center px-[16px] py-[20px]">
            <button
              type="button"
              aria-label="뒤로가기"
              onClick={onBack}
              className="flex h-[24px] w-[24px] items-center justify-center"
            >
              <img src={arrowLeftIcon} alt="" className="h-[24px] w-[24px]" />
            </button>

            <div className="flex-1 text-center font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] text-black">
              {title}
            </div>

            <div className="h-[24px] w-[24px] shrink-0" aria-hidden="true" />
          </div>
        </div>

        <div className="flex w-full flex-col gap-[48px] py-[20px]">
          <div className="flex w-full flex-col gap-[8px] px-[16px]">
            <div className="font-['Pretendard'] text-[20px] font-[400] leading-[24px] text-black">
              {resolvedHeadlineLines.map((line, index) => (
                <p key={`${line}-${index}`}>{line}</p>
              ))}
            </div>
            {caption ? (
              <p className="font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] text-[#8A8A8A]">
                {caption}
              </p>
            ) : null}
          </div>

          <div className="flex w-full flex-col gap-[16px] px-[16px]">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function SignupField({
  label,
  placeholder,
  suffix,
  fieldHeight = 40,
  className = '',
  ...props
}: SignupFieldProps) {
  return (
    <div className="flex w-full flex-col gap-[4px]">
      <span className="font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] text-black">{label}</span>

      <label className={`relative block w-full ${className}`}>
        <input
          className={`h-full w-full rounded-[10px] border-0 bg-[#F8F8F8] px-[16px] py-[10px] font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] text-[#494949] caret-black outline-none placeholder:text-[#BABABA] ${
            suffix ? 'pr-[64px]' : ''
          }`}
          style={{ height: `${fieldHeight}px` }}
          placeholder={placeholder}
          {...props}
        />

        {suffix ? (
          <span className="pointer-events-none absolute right-[16px] top-1/2 -translate-y-1/2 font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#8A8A8A]">
            {suffix}
          </span>
        ) : null}
      </label>
    </div>
  );
}

export function SignupButton({
  children,
  onClick,
  disabled = false,
  tone = 'soft',
}: SignupButtonProps) {
  return (
    <AppButton
      onClick={onClick}
      disabled={disabled}
      tone={tone === 'primary' ? 'primary' : 'soft'}
      size="auth"
      fullWidth
    >
      {children}
    </AppButton>
  );
}

export function SignupFieldGroup({ children }: { children: ReactNode }) {
  return <div className="flex w-full flex-col gap-[16px]">{children}</div>;
}

export function InlineHelperRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full items-center justify-center gap-[4px] font-['Pretendard'] text-[12px] leading-[14.4px]">
      {children}
    </div>
  );
}

export function SignupErrorText({ children }: { children: ReactNode }) {
  return (
    <p className="w-full font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#D33B3B]">
      {children}
    </p>
  );
}
