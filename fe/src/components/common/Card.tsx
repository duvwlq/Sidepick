import amountIcon from '../../assets/images/amount.svg';
import durationIcon from '../../assets/images/duration.svg';
import viewsIcon from '../../assets/images/views.svg';

type CardProps = {
  title: string;
  tags?: string[];
  category?: string;
  failureReason?: string;
  duration: string;
  views: number;
  amount: number;
  date: string;
  content?: string;
};

export default function Card({
  title,
  tags,
  category,
  failureReason,
  duration,
  views,
  amount,
  date,
}: CardProps) {
  const chips = (tags && tags.length > 0
    ? tags
    : [category, failureReason].filter(Boolean)) as string[];

  return (
    <article className="border-b border-[#ECECEC] bg-white px-4 py-5 last:border-b-0">
      <div className="mb-3 flex flex-wrap gap-2">
        {chips.slice(0, 3).map((chip) => (
          <span
            key={chip}
            className="rounded-full bg-[#F2F4F6] px-3 py-1 text-xs font-medium text-[#5E6772]"
          >
            {chip}
          </span>
        ))}
      </div>

      <h2 className="text-[17px] font-semibold leading-7 text-[#101010]">{title}</h2>

      <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 text-sm text-[#5F6670]">
        <div className="flex items-center gap-1.5">
          <img src={durationIcon} alt="소요 시간" className="h-4 w-4" />
          <span>{duration}</span>
        </div>
        <div className="flex items-center justify-end gap-1.5 text-right">
          <img src={amountIcon} alt="투자금" className="h-4 w-4" />
          <span>{amount.toLocaleString()}원</span>
        </div>
        <div className="flex items-center gap-1.5">
          <img src={viewsIcon} alt="조회수" className="h-4 w-4" />
          <span>{views.toLocaleString()}</span>
        </div>
        <div className="text-right text-[#8A919B]">{date}</div>
      </div>
    </article>
  );
}
