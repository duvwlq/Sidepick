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
    <div className="inline-flex w-full flex-col items-start justify-start rounded-[10px] bg-zinc-100 p-5">
      <div className="flex w-full justify-between gap-2 pb-1">
        <div className="flex items-start justify-start gap-1">
          <span className="rounded bg-gray-200 px-2 py-1 text-xs">
            {category}
          </span>
          <span className="rounded bg-gray-200 px-2 py-1 text-xs">
            {failureReason}
          </span>
        </div>
        <div className="text-center text-xs font-semibold leading-5 text-zinc-800 underline">
          상세보기
        </div>
      </div>

      <h2 className="mb-2.5 text-lg font-semibold text-neutral-950">{title}</h2>
      <p className="mb-3 line-clamp-3 text-sm text-gray-600">{content}</p>

      <div className="flex w-full text-sm text-gray-500">
        <div className="w-full space-y-1">
          <div className="flex items-center gap-1">
            <img src={durationIcon} alt="duration" className="h-4 w-4" />
            <p>{duration}</p>
          </div>
          <div className="flex items-center gap-1">
            <img src={viewsIcon} alt="views" className="h-4 w-4" />
            <p>{views}</p>
          </div>
        </div>

        <div className="w-full space-y-1 text-right">
          <div className="flex items-center justify-end gap-1">
            <img src={amountIcon} alt="amount" className="h-4 w-4" />
            <p>{amount.toLocaleString()}원</p>
          </div>
          <p>{date}</p>
        </div>
      </div>
    </div>
  );
}
