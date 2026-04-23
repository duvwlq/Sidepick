import Card from './Card';
import CaseSegment from './CaseSegment';

const mockData = [
  {
    id: 1,
    title: '메인 제목',
    duration: '2시간',
    views: 120,
    amount: 50000,
    date: '2026-04-09',
  },
  {
    id: 2,
    title: '메인 제목',
    duration: '3시간',
    views: 200,
    amount: 70000,
    date: '2026-04-08',
  },
  {
    id: 3,
    title: '메인 제목',
    duration: '1시간',
    views: 80,
    amount: 30000,
    date: '2026-04-07',
  },
];

export default function CardList() {
  return (
    <div className="px-4">
      <div className="space-y-4 bg-white px-4 py-3 rounded-[10px]">
        <div className="mb-4 flex justify-center">
          <CaseSegment />
        </div>
        {mockData.map((item) => (
          <Card
            key={item.id}
            title={item.title}
            duration={item.duration}
            views={item.views}
            amount={item.amount}
            date={item.date}
          />
        ))}

        <button className="w-full py-2 text-sm text-gray-500 underline">
          모든 사례 보기
        </button>
      </div>
    </div>
  );
}
