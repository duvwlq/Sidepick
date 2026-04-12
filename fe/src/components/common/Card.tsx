import durationIcon from '../../assets/images/duration.svg';
import viewsIcon from '../../assets/images/views.svg';
import amountIcon from '../../assets/images/amount.svg';

type CardProps = {
  title: string;
  duration: string;
  views: number;
  amount: number;
  date: string;
};

export default function Card({
  title,
  duration,
  views,
  amount,
  date,
}: CardProps) {
  return (
    <div className="w-full bg-zinc-100 rounded-[10px] p-5 inline-flex flex-col justify-start items-start">
      {/* 키워드 */}
      <div className="flex gap-2 w-full justify-between pb-1">
        <div className="flex justify-start items-start gap-1">
          <span className="text-xs bg-gray-200 px-2 py-1 rounded">키워드</span>
          <span className="text-xs bg-gray-200 px-2 py-1 rounded">키워드</span>
          <span className="text-xs bg-gray-200 px-2 py-1 rounded">키워드</span>
        </div>
        <div className="text-center justify-start text-zinc-800 text-xs font-semibold font-['Pretendard'] underline leading-5">
          자세히보기
        </div>
      </div>
      {/* 제목 */}
      <h2 className="justify-start font-semibold text-neutral-950 text-lg mb-2.5">
        {title}
      </h2>

      {/* 정보 */}
      <div className="w-full flex text-sm text-gray-500">
        <div className="w-full space-y-1 gap-1">
          <div className="flex gap-1 items-center">
            <img src={durationIcon} alt="duration" className="w-4 h-4" />
            <p>{duration}</p>
          </div>
          <div className="flex gap-1  items-center">
            <img src={viewsIcon} alt="views" className="w-4 h-4" />
            <p>{views}</p>
          </div>
        </div>

        <div className="w-full space-y-1 text-right">
          <div className="flex gap-1  items-center">
            <img src={amountIcon} alt="amount" className="w-4 h-4" />
            <p>{amount}</p>
          </div>
          <p className="text-left">{date}</p>
        </div>
      </div>
    </div>
  );
}
