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

  if (months >= 12) {
    return months === 12 ? '1년' : `${months}개월`;
  }

  return `${months}개월`;
}

function getFailureLabel(experience: Experience) {
  if (experience.failureReasons.length > 0) {
    return experience.failureReasons[0];
  }
  if (experience.difficulties.length > 0) {
    return experience.difficulties[0];
  }
  return experience.failureReason ?? '기타';
}

export default function ExperienceFeed({ experiences, loading, error }: Props) {
  return (
    <div className="px-4 pb-6">
      <div className="space-y-3">
        {loading ? (
          <div className="rounded-[22px] bg-white px-5 py-10 text-center text-sm text-[#666666] shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            경험 목록을 불러오는 중입니다.
          </div>
        ) : error ? (
          <div className="rounded-[22px] bg-white px-5 py-10 text-center text-sm text-[#D33B3B] shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            {error}
          </div>
        ) : experiences.length === 0 ? (
          <div className="rounded-[22px] bg-white px-5 py-10 text-center text-sm text-[#666666] shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            아직 등록된 경험이 없습니다.
          </div>
        ) : (
          experiences.map((item) => (
            <Link key={item.id} to={`/experiences/${item.id}`} className="block">
              <Card
                title={item.title}
                category={item.category.name}
                failureReason={getFailureLabel(item)}
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
