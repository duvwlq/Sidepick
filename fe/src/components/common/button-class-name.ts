export type AppButtonTone = 'primary' | 'secondary' | 'soft' | 'kakao' | 'case' | 'ghost';
export type AppButtonSize = 'lg' | 'md' | 'sm' | 'auth' | 'write';

const BASE_CLASS_NAME =
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap font-['Pretendard'] transition disabled:cursor-not-allowed disabled:opacity-60";

const TONE_CLASS_NAME: Record<AppButtonTone, string> = {
  primary: 'bg-[#5A876E] text-white',
  secondary: 'border border-[#E5E5E5] bg-white text-[#8A8A8A]',
  soft: 'bg-[#CBE5D8] text-white',
  kakao: 'bg-[#FEE500] text-[#191600]',
  case: 'bg-[#5A876E] text-white',
  ghost: 'bg-transparent text-[#5D5D5D] underline decoration-[0.5px] underline-offset-[2px]',
};

const SIZE_CLASS_NAME: Record<AppButtonSize, string> = {
  lg: "h-[43px] rounded-[10px] px-[16px] text-[16px] font-[600] leading-[19.2px]",
  md: "h-[41px] rounded-[10px] px-[16px] text-[16px] font-[600] leading-[19.2px]",
  sm: "h-[36px] rounded-[8px] px-[12px] text-[12px] font-[600] leading-[14.4px]",
  auth: "h-[48px] rounded-[10px] px-[16px] text-[16px] font-[600] leading-[19.2px]",
  write: "h-[40px] rounded-[10px] px-[16px] text-[14px] font-[600] leading-[16.8px]",
};

export function buttonClassName({
  tone = 'primary',
  size = 'lg',
  fullWidth = false,
  className = '',
}: {
  tone?: AppButtonTone;
  size?: AppButtonSize;
  fullWidth?: boolean;
  className?: string;
}) {
  return [BASE_CLASS_NAME, TONE_CLASS_NAME[tone], SIZE_CLASS_NAME[size], fullWidth ? 'w-full' : '', className]
    .filter(Boolean)
    .join(' ');
}
