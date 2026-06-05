import { Heart } from 'lucide-react';
import type { MouseEvent, ReactNode } from 'react';

type ChipTone = 'type' | 'status-success' | 'status-failure' | 'category' | 'keyword';

export function CaseSurface({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <article className={`rounded-[4px] border border-[#F2F2F2] bg-white shadow-[0_0_2px_rgba(0,0,0,0.1)] ${className}`}>
      {children}
    </article>
  );
}

export function CaseChip({
  label,
  tone,
  compact = false,
  maxWidthClassName,
}: {
  label: string;
  tone: ChipTone;
  compact?: boolean;
  maxWidthClassName?: string;
}) {
  const toneClass =
    tone === 'type'
      ? 'bg-[#C06D43] font-[500] text-white'
      : tone === 'status-success'
        ? 'bg-[#5A876E] font-[500] text-white'
        : tone === 'status-failure'
          ? 'bg-[#C06D43] font-[500] text-white'
          : tone === 'category'
            ? 'bg-[#CBE5D8] font-[500] text-[#5A876E]'
            : 'bg-[#E6E6E6] font-[500] text-[#8A8A8A]';

  const widthClass =
    maxWidthClassName ??
    (tone === 'category'
      ? compact
        ? 'max-w-[96px]'
        : 'max-w-[116px]'
      : compact
        ? 'max-w-[64px]'
        : 'max-w-[74px]');

  return (
    <span className={`inline-flex h-[18px] shrink-0 items-center justify-center rounded-[4px] px-[4px] py-[2px] font-['Pretendard'] text-[10px] leading-[12px] ${toneClass}`}>
      <span className={`${widthClass} truncate whitespace-nowrap leading-[12px]`}>{label}</span>
    </span>
  );
}

export function CaseChipRow({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`flex min-w-0 flex-nowrap items-center gap-[4px] overflow-hidden whitespace-nowrap ${className}`}>{children}</div>;
}

export function CardMetaRow({
  nickname,
  createdAt,
  viewCount,
  trailing,
  className = '',
}: {
  nickname: string;
  createdAt: string;
  viewCount: number;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between gap-[8px] ${className}`}>
      <div className="min-w-0 flex-1 truncate font-['Pretendard'] text-[12px] font-[300] leading-[16.8px] text-[#8A8A8A]">
        <span>{nickname}</span>
        <span className="mx-[4px]">{'\u00b7'}</span>
        <span>{createdAt}</span>
        <span className="mx-[4px]">{'\u00b7'}</span>
        <span>{`\uC870\uD68C ${viewCount}`}</span>
      </div>
      {trailing ? <div className="flex shrink-0 items-center gap-[8px]">{trailing}</div> : null}
    </div>
  );
}

export function CaseReactionCount({
  count,
  active = false,
}: {
  count: number;
  active?: boolean;
}) {
  return (
    <div className="flex items-center gap-[2px]">
      <Heart size={14} strokeWidth={1.75} fill={active ? '#5A876E' : 'none'} color={active ? '#5A876E' : '#8A8A8A'} />
      <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#8A8A8A]">{count}</span>
    </div>
  );
}

export function CaseSimilarityIndicator({
  percent = 99,
  tone = 'failure',
}: {
  percent?: number;
  tone?: 'failure' | 'success';
}) {
  const textClass = tone === 'success' ? 'text-[#5A876E]' : 'text-[#C06D43]';

  return (
    <div className={`flex h-[18px] shrink-0 items-center gap-[4px] font-['Pretendard'] text-[12px] font-[600] leading-[16.8px] ${textClass}`}>
      <span className="h-[4px] w-[30px] rounded-[999px] bg-current" aria-hidden="true" />
      <span>{percent}%</span>
    </div>
  );
}

export function CardActionButton({
  label,
  onClick,
  tone = 'green',
  disabled = false,
  className = '',
}: {
  label: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  tone?: 'green' | 'ghost';
  disabled?: boolean;
  className?: string;
}) {
  const toneClass = tone === 'green' ? 'bg-[#5A876E] text-white' : 'bg-transparent text-[#5D5D5D] underline';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-[36px] items-center justify-center rounded-[8px] px-[12px] py-[8px] font-['Pretendard'] text-[12px] font-[600] leading-[14.4px] ${toneClass} disabled:opacity-50 ${className}`}
    >
      {label}
    </button>
  );
}

export function CaseTextLink({
  label,
  onClick,
  className = '',
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center font-['Pretendard'] text-[12px] font-[400] leading-[16px] text-[#8A8A8A] underline decoration-[0.5px] decoration-[#8A8A8A] underline-offset-[2px] ${className}`}
    >
      {label}
    </button>
  );
}
