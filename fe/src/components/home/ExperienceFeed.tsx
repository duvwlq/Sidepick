import { Link } from 'react-router-dom';
import type { Experience } from '../../lib/api';
import { extractExperienceTagLabels } from '../../lib/explore-tags';
import { ErrorState, ListSkeleton, PageMessage } from '../common/Skeleton';
import Card from '../common/Card';

type Props = {
  experiences: Experience[];
  loading: boolean;
  error: string;
};

function formatDuration(months: number | null) {
  if (!months) {
    return '?뚯슂 ?쒓컙';
  }

  if (months >= 12) {
    if (months % 12 === 0) {
      return `${months / 12}??`;
    }
    return `${months}媛쒖썡`;
  }

  return `${months}媛쒖썡`;
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

export default function ExperienceFeed({ experiences, loading, error }: Props) {
  return (
    <div className="flex w-full flex-col items-start gap-[2px] bg-[#EEEEEE] pb-[110px]">
      {loading ? (
        <ListSkeleton />
      ) : error ? (
        <div className="w-full bg-[#FFFFFF] px-[16px] py-[12px]">
          <ErrorState message={error} />
        </div>
      ) : experiences.length === 0 ? (
        <div className="w-full bg-[#FFFFFF] px-[16px] py-[12px]">
          <PageMessage message="?꾩쭅 ?깅줉???щ?媛 ?놁뒿?덈떎." />
        </div>
      ) : (
        experiences.map((item) => (
          <Link key={item.id} to={`/experiences/${item.id}`} className="block w-full">
            <Card
              title={item.title}
              tags={extractExperienceTagLabels(item).slice(0, 3)}
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
