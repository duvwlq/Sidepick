import amountIcon from '../../assets/images/amount.svg';
import durationIcon from '../../assets/images/duration.svg';
import viewsIcon from '../../assets/images/views.svg';

type CardProps = {
  title: string;
  category: string;
  failureReason: string;
  duration: string;
  views: number;
  amount: number;
  date: string;
  content: string;
};

export default function Card({
  title,
  category,
  failureReason,
  duration,
  views,
  amount,
  date,
  content,
}: CardProps) {
  return (
    <article className="rounded-[22px] border border-[#ECEFF4] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-medium text-[#555555]">
            {category}
          </span>
          <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-medium text-[#555555]">
            {failureReason}
          </span>
        </div>
        <span className="text-xs font-semibold text-[#111111]">상세보기</span>
      </div>

      <h2 className="mb-2 text-[18px] font-semibold leading-7 text-[#111111]">
        {title}
      </h2>
      <p className="mb-4 line-clamp-3 text-sm leading-6 text-[#666666]">
        {content}
      </p>

      <div className="grid grid-cols-2 gap-3 text-sm text-[#666666]">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <img src={durationIcon} alt="진행 기간" className="h-4 w-4" />
            <p>{duration}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <img src={viewsIcon} alt="조회수" className="h-4 w-4" />
            <p>{views.toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-2 text-right">
          <div className="flex items-center justify-end gap-1.5">
            <img src={amountIcon} alt="투자 금액" className="h-4 w-4" />
            <p>{amount.toLocaleString()}원</p>
          </div>
          <p>{date}</p>
        </div>
      </div>
    </article>
  );
}
