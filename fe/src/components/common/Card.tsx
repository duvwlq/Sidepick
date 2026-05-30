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
  const visibleChips = chips.slice(0, 2);

  return (
    <article
      className="flex min-h-[126px] w-full flex-col items-start gap-[12px] overflow-hidden bg-[#FFFFFF] px-[16px] py-[18px]"
      translate="no"
    >
      <div className="flex w-full min-w-0 flex-col items-start gap-[8px]">
        <div className="flex w-full items-center">
          <div className="flex min-w-0 flex-wrap items-start gap-[4px] overflow-hidden">
            {visibleChips.map((chip, index) => (
              <span
                key={`${chip}-${index}`}
                className="flex max-w-full items-center justify-center rounded-[999px] bg-[#F3F3F3] px-[8px] py-[3px]"
              >
                <span className="truncate whitespace-nowrap font-['Pretendard'] text-[11px] font-[500] leading-[13px] tracking-[0px] text-[#5E5E5E]">
                  {chip}
                </span>
              </span>
            ))}
          </div>
        </div>

        <h2 className="line-clamp-2 w-full font-['Pretendard'] text-[18px] font-[600] leading-[25px] tracking-[0px] text-[#111111]">
          {title}
        </h2>
      </div>

      <div className="grid w-full grid-cols-[repeat(2,minmax(0,1fr))] gap-x-[8px] gap-y-[6px]">
        <div className="flex shrink-0 items-center gap-[4px] justify-self-start">
          <img src={durationIcon} alt="" className="h-[15.993px] w-[15.993px] shrink-0" />
          <span
            translate="no"
            className="whitespace-nowrap font-['Pretendard'] text-[13px] font-[400] leading-[18px] tracking-[0px] text-[#8A8A8A]"
          >
            {duration}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-[4px] justify-self-start">
          <img src={amountIcon} alt="" className="h-[15.993px] w-[15.993px] shrink-0" />
          <span
            translate="no"
            className="whitespace-nowrap font-['Pretendard'] text-[13px] font-[400] leading-[18px] tracking-[0px] text-[#8A8A8A]"
          >
            {amount.toLocaleString()}원
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-[4px] justify-self-start">
          <img src={viewsIcon} alt="" className="h-[15.993px] w-[15.993px] shrink-0" />
          <span
            translate="no"
            className="whitespace-nowrap font-['Pretendard'] text-[13px] font-[400] leading-[18px] tracking-[0px] text-[#8A8A8A]"
          >
            {views.toLocaleString()}
          </span>
        </div>
        <div className="flex shrink-0 items-center justify-self-start">
          <span
            translate="no"
            className="whitespace-nowrap font-['Pretendard'] text-[13px] font-[400] leading-[18px] tracking-[0px] text-[#8A8A8A]"
          >
            {date}
          </span>
        </div>
      </div>
    </article>
  );
}
