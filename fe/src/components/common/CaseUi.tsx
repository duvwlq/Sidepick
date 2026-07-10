import type { MouseEvent, ReactNode } from 'react';
import { buttonClassName } from './button-class-name';

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
      ? 'bg-[#F14F5A] font-[500] text-white'
      : tone === 'status-success'
        ? 'bg-[#559A0B] font-[500] text-white'
        : tone === 'status-failure'
          ? 'bg-[#F14F5A] font-[500] text-white'
          : tone === 'category'
            ? 'bg-[#BEE8CF] font-[500] text-[#5A876E]'
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
      <HeartReactionIcon active={active} />
      <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#8A8A8A]">{count}</span>
    </div>
  );
}

export function HeartReactionIcon({
  active = false,
}: {
  active?: boolean;
}) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M12.1566 2.68926C11.8586 2.39117 11.5049 2.15472 11.1155 1.99339C10.7262 1.83206 10.3089 1.74902 9.88741 1.74902C9.46596 1.74902 9.04863 1.83206 8.65928 1.99339C8.26993 2.15472 7.91618 2.39117 7.61824 2.68926L6.99991 3.30759L6.38157 2.68926C5.77975 2.08743 4.96351 1.74934 4.11241 1.74934C3.2613 1.74934 2.44506 2.08743 1.84324 2.68926C1.24142 3.29108 0.90332 4.10732 0.90332 4.95842C0.90332 5.80952 1.24142 6.62577 1.84324 7.22759L6.99991 12.3843L12.1566 7.22759C12.4547 6.92965 12.6911 6.5759 12.8524 6.18655C13.0138 5.79719 13.0968 5.37987 13.0968 4.95842C13.0968 4.53697 13.0138 4.11965 12.8524 3.7303C12.6911 3.34095 12.4547 2.9872 12.1566 2.68926Z"
        fill={active ? '#F14F5A' : 'none'}
        stroke="#8A8A8A"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BookmarkReactionIcon({
  active = false,
}: {
  active?: boolean;
}) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M11.0837 12.25L7.00033 9.33333L2.91699 12.25V2.91667C2.91699 2.60725 3.03991 2.3105 3.2587 2.09171C3.47749 1.87292 3.77424 1.75 4.08366 1.75H9.91699C10.2264 1.75 10.5232 1.87292 10.742 2.09171C10.9607 2.3105 11.0837 2.60725 11.0837 2.91667V12.25Z"
        fill={active ? '#5A876E' : 'none'}
        stroke="#8A8A8A"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
