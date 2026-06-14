type HeaderBookmarkIconProps = {
  active: boolean;
  className?: string;
};

export default function HeaderBookmarkIcon({
  active,
  className = 'h-[24px] w-[24px]',
}: HeaderBookmarkIconProps) {
  const color = active ? '#5A876E' : '#131416';

  return (
    <svg
      viewBox="0 0 16 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M15 19L8 14L1 19V3C1 2.46957 1.21071 1.96086 1.58579 1.58579C1.96086 1.21071 2.46957 1 3 1H13C13.5304 1 14.0391 1.21071 14.4142 1.58579C14.7893 1.96086 15 2.46957 15 3V19Z"
        fill={active ? color : 'none'}
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
