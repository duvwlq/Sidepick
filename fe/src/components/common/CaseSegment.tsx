type CaseSegmentOption = {
  key: string;
  label: string;
};

type Props = {
  options?: CaseSegmentOption[];
  activeKey?: string;
  onChange?: (key: string) => void;
  className?: string;
  variant?: 'default' | 'feed';
};

export default function CaseSegment({
  options = [
    { key: 'latest', label: '최근 등록된 사례' },
    { key: 'popular', label: '인기 사례' },
  ],
  activeKey,
  onChange,
  className = '',
  variant = 'default',
}: Props) {
  const resolvedActiveKey = activeKey ?? options[0]?.key;
  const isFeedVariant = variant === 'feed';

  return (
    <div
      className={`rounded-full ${
        isFeedVariant
          ? 'bg-white px-[8px] py-[6px] shadow-[0_0_4px_rgba(0,0,0,0.15)]'
          : 'bg-[#E1E1E1] p-[2px]'
      } ${className}`}
    >
      <div
        className={isFeedVariant ? 'flex items-center gap-[10px]' : 'grid'}
        style={isFeedVariant ? undefined : { gridTemplateColumns: `repeat(${Math.max(options.length, 1)}, minmax(0, 1fr))` }}
      >
        {options.map((option) => {
          const active = option.key === resolvedActiveKey;

          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onChange?.(option.key)}
              className={`flex items-center justify-center rounded-full font-['Pretendard'] text-[12px] leading-[14.4px] ${
                isFeedVariant
                  ? active
                    ? 'h-[34px] bg-[#5A876E] px-[10px] font-[500] text-white'
                    : 'h-[34px] px-0 font-[400] text-black'
                  : active
                    ? 'h-[32px] bg-white font-[500] text-black shadow-[0_0_4px_rgba(0,0,0,0.15)]'
                    : 'h-[32px] bg-transparent font-[400] text-[#5D5D5D]'
              }`}
              aria-pressed={active}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
