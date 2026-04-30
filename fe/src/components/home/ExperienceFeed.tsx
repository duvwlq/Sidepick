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
    return '소요 시간';
  }

  if (months >= 12) {
    if (months % 12 === 0) {
      return `${months / 12}년`;
    }
    return `${months}개월`;
  }

  return `${months}개월`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

function getKeywordLabels(experience: Experience) {
  const merged = [
    ...experience.failureReasons,
    ...experience.difficulties,
    experience.failureReason ?? '',
    experience.category.name,
  ].filter(Boolean);

  return Array.from(new Set(merged)).slice(0, 3);
}

export default function ExperienceFeed({ experiences, loading, error }: Props) {
  return (
    <div className="flex w-full flex-col gap-[2px] bg-[#EEE] pb-[110px]">
      {loading ? (
        <div className="bg-white px-5 py-12 text-center text-sm text-[#666666]">
          사례 목록을 불러오는 중입니다.
        </div>
      ) : error ? (
        <div className="bg-white px-5 py-12 text-center text-sm text-[#D33B3B]">
          {error}
        </div>
      ) : experiences.length === 0 ? (
        <div className="bg-white px-5 py-12 text-center text-sm text-[#666666]">
          아직 등록된 사례가 없습니다.
        </div>
      ) : (
        experiences.map((item) => (
          <Link key={item.id} to={`/experiences/${item.id}`} className="block">
            <Card
              title={item.title}
              tags={getKeywordLabels(item)}
              duration={formatDuration(item.durationMonths)}
              views={item.viewCount}
              amount={item.investmentAmount ?? 0}
              date={formatDate(item.createdAt)}
            />
          </Link>
        ))
      )}
    </div>
  );
}
