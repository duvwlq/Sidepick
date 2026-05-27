import type { InputHTMLAttributes, ReactNode } from 'react';
import arrowLeftIcon from '../../assets/auth-figma/arrow-left.svg';
import batteryFrameIcon from '../../assets/auth-figma/battery-frame.svg';
import cellularConnectionIcon from '../../assets/auth-figma/cellular-connection.svg';
import wifiIcon from '../../assets/auth-figma/wifi.svg';

type SignupScreenProps = {
  title: string;
  headlineLines: [string, string];
  onBack?: () => void;
  children: ReactNode;
};

type SignupFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label: string;
  placeholder: string;
  suffix?: ReactNode;
  fieldHeight?: 37 | 40 | 43;
};

type SignupButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: 'soft' | 'primary';
};

export function SignupScreen({
  title,
  headlineLines,
  onBack,
  children,
}: SignupScreenProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[375px] flex-col bg-white">
        <div className="flex w-full flex-col">
          <div className="flex h-[59px] w-full items-center justify-center px-[24px] pb-[19px] pt-[21px]">
            <div className="flex h-[22px] min-w-0 flex-1 items-center justify-center pt-[1.5px]">
              <span className="font-['Pretendard'] text-[17px] font-[600] leading-[22px] tracking-[0px] text-black">
                9:41
              </span>
            </div>
            <div className="flex h-[22px] min-w-0 flex-1 items-center justify-center gap-[7px] pr-[1px] pt-[1px]">
              <img
                src={cellularConnectionIcon}
                alt=""
                className="h-[12.226px] w-[19.2px] shrink-0"
              />
              <img src={wifiIcon} alt="" className="h-[12.328px] w-[17.142px] shrink-0" />
              <img src={batteryFrameIcon} alt="" className="h-[13px] w-[27.328px] shrink-0" />
            </div>
          </div>

          <div className="flex w-full items-center justify-between px-[16px] py-[20px]">
            <button
              type="button"
              aria-label="뒤로가기"
              onClick={onBack}
              className="flex h-[24px] w-[24px] items-center justify-center"
            >
              <img src={arrowLeftIcon} alt="" className="h-[24px] w-[24px]" />
            </button>

            <div className="flex flex-col justify-center text-center font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-black">
              <span>{title}</span>
            </div>

            <div className="h-[24px] w-[24px] shrink-0" aria-hidden="true" />
          </div>
        </div>

        <div className="flex w-full flex-col items-start gap-[48px] py-[20px]">
          <div className="flex w-full items-center justify-center px-[16px]">
            <div className="min-w-0 flex-1 font-['Pretendard'] text-[20px] font-[400] leading-[24px] tracking-[0px] text-black">
              <p>{headlineLines[0]}</p>
              <p>{headlineLines[1]}</p>
            </div>
          </div>

          <div className="flex w-full flex-col items-start px-[16px]">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function SignupField({
  label,
  placeholder,
  suffix,
  fieldHeight = 37,
  value,
  className = '',
  ...props
}: SignupFieldProps) {
  const textValue = typeof value === 'string' ? value : '';
  const hasValue = textValue.length > 0;
  const hasSuffix = Boolean(suffix);

  return (
    <div className="flex w-full flex-col items-start gap-[4px]">
      <div className="flex flex-col justify-center overflow-hidden font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] tracking-[0px] text-black">
        <span>{label}</span>
      </div>

      <label className={`relative w-full ${className}`}>
        <div
          className="flex w-full items-center justify-between rounded-[10px] bg-[#EEEEEE] px-[16px] py-[10px]"
          style={{ height: `${fieldHeight}px` }}
        >
          {!hasValue ? (
            <div className="pointer-events-none min-w-0 flex-1 overflow-hidden font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#5D5D5D]/50">
              <span className="block truncate">{placeholder}</span>
            </div>
          ) : (
            <div className="min-w-0 flex-1" aria-hidden="true" />
          )}

          {suffix ? (
            <div className="pointer-events-none ml-[8px] shrink-0 font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#5D5D5D]">
              {suffix}
            </div>
          ) : null}
        </div>

        <input
          value={value}
          className={`absolute inset-0 h-full w-full border-0 bg-transparent px-[16px] py-[10px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#5D5D5D] caret-black outline-none placeholder:text-transparent ${
            hasSuffix ? 'pr-[56px]' : ''
          }`}
          {...props}
        />
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
  const backgroundClass =
    tone === 'primary'
      ? 'bg-[#5A876E] text-white'
      : 'bg-[#CBE5D8] text-white';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-[48px] w-[343px] items-center justify-center rounded-[8px] py-[5px] font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] ${backgroundClass} disabled:opacity-70`}
    >
      {children}
    </button>
  );
}

export function SignupFieldGroup({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="flex w-full flex-col items-start gap-[16px]">{children}</div>;
}

export function InlineHelperRow({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex w-full items-center justify-center gap-[4px] font-['Pretendard'] text-[12px] leading-[14.4px] tracking-[0px]">
      {children}
    </div>
  );
}

export function SignupErrorText({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <p className="w-full font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#D33B3B]">
      {children}
    </p>
  );
}
