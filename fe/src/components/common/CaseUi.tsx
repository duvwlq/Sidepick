import { Heart } from 'lucide-react';
import type { MouseEvent, ReactNode } from 'react';
import { buttonClassName } from './Button';

type ChipTone = 'type' | 'status-success' | 'status-failure' | 'category' | 'keyword';

export function CaseSurface({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <article className={`rounded-[4px] border border-[#F4F4F4] bg-white shadow-[0_0_2px_rgba(0,0,0,0.1)] ${className}`}>
      {children}
    </article>
  );
}

export function CaseChip({
  label,
  tone,
  compact = false,
  maxWidthClassName,
  className = '',
}: {
  label: string;
  tone: ChipTone;
  compact?: boolean;
  maxWidthClassName?: string;
  className?: string;
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
        ? 'max-w-[92px]'
        : 'max-w-[116px]'
      : compact
        ? 'max-w-[58px]'
        : 'max-w-[68px]');

  return (
    <span className={`inline-flex h-[18px] shrink-0 items-center justify-center rounded-[4px] px-[4px] py-[2px] font-['Pretendard'] text-[10px] leading-[12px] ${toneClass} ${className}`}>
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
  const fillClass = tone === 'success' ? 'bg-[#5A876E]' : 'bg-[#AF633D]';
  const fillWidth = Math.max(4, Math.min(30, Math.round((percent / 100) * 30)));

  return (
    <div className={`flex h-[18px] shrink-0 items-center gap-[4px] font-['Pretendard'] text-[12px] font-[600] leading-[16.8px] ${textClass}`}>
      <span className="h-[4px] w-[30px] rounded-[999px] bg-[#EEEEEE]" aria-hidden="true">
        <span className={`block h-[4px] rounded-[999px] ${fillClass}`} style={{ width: `${fillWidth}px` }} />
      </span>
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
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={buttonClassName({
        tone: tone === 'green' ? 'case' : 'ghost',
        size: 'sm',
        className: `min-w-[106px] ${className}`.trim(),
      })}
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
      className={`inline-flex h-[14px] shrink-0 items-center justify-center font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#8A8A8A] ${className}`}
      style={{ fontFeatureSettings: '"case" on' }}
    >
      {label}
    </button>
  );
}
