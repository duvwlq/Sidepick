export type BadgeType = 'success' | 'fail' | 'category' | 'keyword';

const TYPE_STYLES: Record<BadgeType, { bg: string; fg: string }> = {
  success: { bg: '#559A0B', fg: '#FFFFFF' },
  fail: { bg: '#F14F5A', fg: '#FFFFFF' },
  category: { bg: '#BEE8CF', fg: '#5A876E' },
  keyword: { bg: '#E6E6E6', fg: '#8A8A8A' },
};

type BadgeProps = {
  type: BadgeType;
  text: string;
};

export default function Badge({ type, text }: BadgeProps) {
  const { bg, fg } = TYPE_STYLES[type];
  return (
    <span
      className="inline-flex items-center justify-center rounded-[4px] px-[4px] py-[2px] text-[10px] font-medium leading-[1.2]"
      style={{ backgroundColor: bg, color: fg }}
    >
      {text}
    </span>
  );
}
