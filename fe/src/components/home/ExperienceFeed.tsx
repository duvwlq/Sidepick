import { Link } from 'react-router-dom';
import type { Experience } from '../../lib/api';
import Card from '../common/Card';

type Props = {
  experiences: Experience[];
  loading: boolean;
  error: string;
};

function formatDuration(months: number | null) {
  if (!months) {
    return '기간 미입력';
  }
  return `${months}개월`;
}

export default function ExperienceFeed({ experiences, loading, error }: Props) {
  return (
    <div className="px-4">
      <div className="space-y-4 rounded-[10px] bg-white px-4 py-3">
        {loading ? (
          <div className="py-10 text-center text-sm text-gray-500">
            경험담을 불러오는 중입니다.
          </div>
        ) : error ? (
          <div className="py-10 text-center text-sm text-red-600">{error}</div>
        ) : experiences.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-500">
            등록된 경험담이 아직 없습니다.
          </div>
        ) : (
          experiences.map((item) => (
            <Link key={item.id} to={`/experiences/${item.id}`} className="block">
              <Card
                title={item.title}
                category={item.category.name}
                failureReason={item.failureReason}
                duration={formatDuration(item.durationMonths)}
                views={item.viewCount}
                amount={item.investmentAmount ?? 0}
                date={item.createdAt.slice(0, 10)}
                content={item.content}
              />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
