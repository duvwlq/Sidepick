import { Link } from 'react-router-dom';
import type { Experience } from '../../lib/api';
import { extractExperienceTagLabels } from '../../lib/explore-tags';
import Card from '../common/Card';

type Props = {
  experiences: Experience[];
  loading: boolean;
  error: string;
  emptyMessage: string;
};

function formatDuration(months: number | null) {
  if (!months || months <= 0) {
    return '소요 시간';
  }

  if (months < 12) {
    return `${months}개월`;
  }

  const years = Math.floor(months / 12);
  const remainMonths = months % 12;

  return remainMonths ? `${years}년 ${remainMonths}개월` : `${years}년`;
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

export default function ExploreResultList({
  experiences,
  loading,
  error,
  emptyMessage,
}: Props) {
  return (
    <section className="flex w-full flex-col gap-[2px] bg-[#EEEEEE] pb-[110px]">
      {loading ? (
        <div className="bg-[#FFFFFF] px-[20px] py-[48px] text-center text-[14px] font-[400] leading-[19.6px] tracking-[0px] text-[#666666]">
          사례 목록을 불러오는 중입니다.
        </div>
      ) : error ? (
        <div className="bg-[#FFFFFF] px-[20px] py-[48px] text-center text-[14px] font-[400] leading-[19.6px] tracking-[0px] text-[#D33B3B]">
          {error}
        </div>
      ) : experiences.length ? (
        experiences.map((experience) => (
          <Link
            key={experience.id}
            to={`/experiences/${experience.id}`}
            className="block w-full"
          >
            <Card
              title={experience.title}
              tags={extractExperienceTagLabels(experience).slice(0, 3)}
              duration={formatDuration(experience.durationMonths)}
              views={experience.viewCount}
              amount={experience.investmentAmount ?? 0}
              date={formatDate(experience.createdAt)}
            />
          </Link>
        ))
      ) : (
        <div className="bg-[#FFFFFF] px-[20px] py-[48px] text-center text-[14px] font-[400] leading-[19.6px] tracking-[0px] text-[#666666]">
          {emptyMessage}
        </div>
      )}
    </section>
  );
}
