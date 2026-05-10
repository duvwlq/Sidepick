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
    <article className="flex h-[146px] w-full flex-col items-start gap-[10px] overflow-hidden bg-[#FFFFFF] p-[20px]">
      <div className="flex w-full min-w-0 flex-col items-start gap-[4px]">
        <div className="flex w-full items-center">
          <div className="flex min-w-0 flex-wrap items-start gap-[4px] overflow-hidden">
            {visibleChips.map((chip) => (
              <span
                key={chip}
                className="flex max-w-full items-center justify-center rounded-[8px] bg-[#EEEEEE] px-[8px] py-[2px]"
              >
                <span className="truncate whitespace-nowrap font-['Pretendard'] text-[12px] font-[300] leading-[16px] tracking-[0px] text-[#494949]">
                  {chip}
                </span>
              </span>
            ))}
          </div>
        </div>

        <h2 className="w-full overflow-hidden text-ellipsis whitespace-nowrap font-['Pretendard'] text-[18px] font-[600] leading-[28px] tracking-[0px] text-[#000000]">
          {title}
        </h2>
      </div>

      <div className="grid w-full grid-cols-[repeat(2,minmax(0,1fr))] grid-rows-[repeat(2,fit-content(100%))] gap-x-[10px] gap-y-[4px]">
        <div className="flex shrink-0 items-center gap-[4px] justify-self-start">
          <img src={durationIcon} alt="" className="h-[15.993px] w-[15.993px] shrink-0" />
          <span className="whitespace-nowrap font-['Pretendard'] text-[14px] font-[400] leading-[20px] tracking-[0px] text-[#8A8A8A]">
            {duration}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-[4px] justify-self-start">
          <img src={amountIcon} alt="" className="h-[15.993px] w-[15.993px] shrink-0" />
          <span className="whitespace-nowrap font-['Pretendard'] text-[14px] font-[400] leading-[20px] tracking-[0px] text-[#8A8A8A]">
            {amount.toLocaleString()}원
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-[4px] justify-self-start">
          <img src={viewsIcon} alt="" className="h-[15.993px] w-[15.993px] shrink-0" />
          <span className="whitespace-nowrap font-['Pretendard'] text-[14px] font-[400] leading-[20px] tracking-[0px] text-[#8A8A8A]">
            {views.toLocaleString()}
          </span>
        </div>
        <div className="flex shrink-0 items-center justify-self-start">
          <span className="whitespace-nowrap font-['Pretendard'] text-[14px] font-[400] leading-[20px] tracking-[0px] text-[#8A8A8A]">
            {date}
          </span>
        </div>
      </div>
    </article>
  );
}
