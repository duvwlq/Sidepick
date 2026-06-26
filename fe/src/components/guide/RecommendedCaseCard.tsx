import { TagChip } from '../common/Chip';
import type { Experience } from '../../lib/api';

type RecommendedCaseCardProps = {
  categoryLabel: string;
  experience: Experience | null;
  onOpenExperience: () => void;
  onExplore: () => void;
};

function extractExperienceTags(experience: Experience) {
  return Array.from(
    new Set(
      [
        experience.businessType ?? '',
        experience.category.name,
        ...experience.failureReasons,
        ...experience.difficulties,
      ].filter(Boolean),
    ),
  ).slice(0, 4);
}

function formatGuideDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

function buildGuidePreview(content: string) {
  const normalized = content.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return '본문이 아직 등록되지 않았습니다.';
  }

  return normalized.length > 72 ? `${normalized.slice(0, 72)}...` : normalized;
}

function TagBadge({ label, tone }: { label: string; tone: 'orange' | 'green' | 'gray' }) {
  return (
    <TagChip
      label={label}
      tone={tone === 'orange' ? 'primary' : tone === 'green' ? 'secondary' : 'gray'}
      className="h-[18px] rounded-[4px] px-[4px] py-[2px] text-[10px] font-[500] leading-[12px]"
    />
  );
}

export default function RecommendedCaseCard({
  categoryLabel,
  experience,
  onOpenExperience,
  onExplore,
}: RecommendedCaseCardProps) {
  const tags = experience ? extractExperienceTags(experience) : [];
  const title = experience?.title ?? `${categoryLabel} 관련 사례`;
  const preview = experience ? buildGuidePreview(experience.content) : '관련 경험 데이터가 아직 충분하지 않습니다.';
  const author = experience?.author.nickname?.trim() || '익명';
  const createdAt = experience ? formatGuideDate(experience.createdAt) : '데이터 없음';
  const likeCount = experience?.likeCount ?? 0;
  const viewCount = experience?.viewCount ?? 0;

  return (
    <div className="flex flex-col gap-[12px]">
      <button
        type="button"
        onClick={experience ? onOpenExperience : onExplore}
        className="rounded-[4px] bg-[#F8F8F8] px-[12px] py-[8px] text-left active:opacity-80"
      >
        <div className="flex items-start justify-between gap-[12px]">
          <div className="flex flex-wrap gap-[4px]">
            <TagBadge label={experience?.caseStatus === 'SUCCESS' ? '성공' : '실패'} tone="orange" />
            <TagBadge label={categoryLabel} tone="green" />
            {tags.slice(2, 4).map((tag) => (
              <TagBadge key={`${experience?.id ?? categoryLabel}-${tag}`} label={tag} tone="gray" />
            ))}
          </div>
          <span className="font-['Pretendard'] text-[12px] font-[600] leading-[16.8px] tracking-[0px] text-[#5A876E]">
            조회 {viewCount.toLocaleString()}
          </span>
        </div>

        <div className="pt-[8px]">
          <p className="font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] tracking-[0px] text-[#131416]">
            {title}
          </p>
          <p className="pt-[4px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949]">
            {preview}
          </p>
        </div>

        <div className="flex items-center justify-between pt-[16px]">
          <p className="font-['Pretendard'] text-[12px] font-[300] leading-[16.8px] tracking-[0px] text-[#8A8A8A]">
            {author} · {createdAt} · 조회 {viewCount.toLocaleString()}
          </p>
          <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#8A8A8A]">
            {likeCount.toLocaleString()}
          </p>
        </div>
      </button>

      <button
        type="button"
        onClick={onExplore}
        className="rounded-[10px] bg-[#5A876E] px-[10px] py-[12px] text-left active:brightness-95"
      >
        <p className="font-['Pretendard'] text-[10px] font-[400] leading-[12px] tracking-[0px] text-[#CBE5D8]">
          비슷한 사례 더 보기
        </p>
        <div className="flex items-center justify-between pt-[5px]">
          <div className="flex items-center gap-[4px]">
            <span className="font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] tracking-[0px] text-[#F8F8F8]">
              ({categoryLabel}) 사례 탐색하기
            </span>
          </div>
          <span className="font-['Pretendard'] text-[18px] font-[400] leading-none text-white">{'>'}</span>
        </div>
      </button>
    </div>
  );
}
