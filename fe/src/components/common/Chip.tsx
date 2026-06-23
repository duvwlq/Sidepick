import type { ReactNode } from 'react';

type TagChipTone = 'primary' | 'secondary' | 'gray';
type KeywordChipTone = 'primary' | 'secondary';

const TAG_TONE_CLASS_NAME: Record<TagChipTone, string> = {
  primary: 'bg-[#5A876E] text-white',
  secondary: 'border border-[#EEEEEE] bg-white text-[#5A876E]',
  gray: 'bg-[#E6E6E6] text-[#8A8A8A]',
};

const KEYWORD_TONE_CLASS_NAME: Record<KeywordChipTone, string> = {
  primary: 'border border-[#92BFA6] bg-white text-[#5A876E]',
  secondary: 'bg-[#F8F8F8] text-[#BABABA]',
};

export function TagChip({
  label,
  tone = 'primary',
  className = '',
  leading,
  trailing,
}: {
  label: string;
  tone?: TagChipTone;
  className?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <span
      className={`inline-flex h-[26px] items-center justify-center gap-[4px] rounded-[999px] px-[10px] py-[6px] font-['Pretendard'] text-[12px] font-[500] leading-[14.4px] ${TAG_TONE_CLASS_NAME[tone]} ${className}`}
    >
      {leading}
      <span className="truncate whitespace-nowrap">{label}</span>
      {trailing}
    </span>
  );
}

export function KeywordChip({
  label,
  tone = 'primary',
  className = '',
  trailing,
}: {
  label: string;
  tone?: KeywordChipTone;
  className?: string;
  trailing?: ReactNode;
}) {
  return (
    <span
      className={`inline-flex h-[22px] items-center justify-center gap-[4px] rounded-[999px] px-[12px] py-[4px] font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] ${KEYWORD_TONE_CLASS_NAME[tone]} ${className}`}
    >
      <span className="truncate whitespace-nowrap">{label}</span>
      {trailing}
    </span>
  );
}
