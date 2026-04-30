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
    <article className="flex w-full flex-col items-start gap-[10px] bg-white p-5">
      <div className="flex w-full flex-col items-start gap-1">
        <div className="flex w-full items-center">
          <div className="flex flex-wrap items-start gap-1">
            {chips.slice(0, 3).map((chip) => (
              <span
                key={chip}
                className="flex items-center justify-center rounded-[8px] bg-[#EEE] px-2 py-[2px] text-[12px] font-light leading-4 text-[#494949]"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        <h2 className="w-full text-[18px] font-semibold leading-7 text-black">{title}</h2>
      </div>

      <div className="grid w-full grid-cols-2 gap-x-[10px] gap-y-1">
        <div className="flex items-center gap-1 text-[14px] font-normal leading-5 text-[#8A8A8A]">
          <img src={durationIcon} alt="" className="h-4 w-4 shrink-0" />
          <span>{duration}</span>
        </div>
        <div className="flex items-center gap-1 text-[14px] font-normal leading-5 text-[#8A8A8A]">
          <img src={amountIcon} alt="" className="h-4 w-4 shrink-0" />
          <span>{amount.toLocaleString()}원</span>
        </div>
        <div className="flex items-center gap-1 text-[14px] font-normal leading-5 text-[#8A8A8A]">
          <img src={viewsIcon} alt="" className="h-4 w-4 shrink-0" />
          <span>{views.toLocaleString()}</span>
        </div>
        <div className="text-[14px] font-normal leading-5 text-[#8A8A8A]">{date}</div>
      </div>
    </article>
  );
}
