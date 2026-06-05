import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import arrowLeftIcon from '../assets/auth-figma/arrow-left.svg';
import batteryFrameIcon from '../assets/auth-figma/battery-frame.svg';
import cellularConnectionIcon from '../assets/auth-figma/cellular-connection.svg';
import wifiIcon from '../assets/auth-figma/wifi.svg';
import bookmarkIcon from '../assets/explore-figma/bookmark.svg';
import { ErrorState, LoadingState, PageMessage } from '../components/common/Skeleton';
import {
  compareExperiences,
  getExperience,
  getRelatedSuccessCases,
  type Experience,
  type ExperienceComparePayload,
} from '../lib/api';
import { getExperienceImageMeta } from '../lib/experience-images';
import { resolveErrorMessage } from '../lib/resolve-error-message';

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

function StatusBarV1() {
  return (
    <div className="flex h-[59px] w-full items-center px-[24px] pb-[19px] pt-[21px]">
      <div className="flex h-[22px] min-w-0 flex-1 items-center">
        <span className="font-['SF_Pro'] text-[17px] font-[590] leading-[22px] tracking-[0px] text-black">
          9:41
        </span>
      </div>
      <div className="flex h-[22px] min-w-0 flex-1 items-center justify-end gap-[7px] pr-[1px] pt-[1px]">
        <img src={cellularConnectionIcon} alt="" className="h-[12.226px] w-[19.2px] shrink-0" />
        <img src={wifiIcon} alt="" className="h-[12.328px] w-[17.142px] shrink-0" />
        <img src={batteryFrameIcon} alt="" className="h-[13px] w-[27.328px] shrink-0" />
      </div>
    </div>
  );
}

function HeaderV1({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex h-[64px] items-center bg-white">
      <button
        type="button"
        onClick={onBack}
        className="ml-[16px] flex h-[24px] w-[24px] items-center justify-center"
        aria-label="뒤로가기"
      >
        <img src={arrowLeftIcon} alt="" className="h-[24px] w-[24px]" />
      </button>

      <div className="flex flex-1 items-center justify-center font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-black">
        성공 사례 비교
      </div>

      <div className="mr-[16px] h-[24px] w-[24px]" />
    </div>
  );
}

function buildTags(experience: Experience) {
  const tags = [
    experience.caseStatus === 'SUCCESS' ? '성공' : '실패',
    experience.category.name,
    ...(experience.analysis?.keywords ?? []),
    ...experience.failureReasons,
  ].filter(Boolean);

  const deduped: string[] = [];
  for (const tag of tags) {
    if (!deduped.includes(tag)) {
      deduped.push(tag);
    }
  }
  return deduped.slice(0, 4);
}

function FailureSummaryCard({ experience }: { experience: Experience }) {
  const tags = buildTags(experience);

  return (
    <section className="rounded-[24px] border border-[#F2F2F2] bg-white px-[18px] py-[18px] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="flex flex-wrap gap-[4px]">
        {tags.map((tag, index) => (
          <span
            key={`${experience.id}-${tag}-${index}`}
            className={`flex h-[18px] max-w-[80px] items-center justify-center rounded-[4px] px-[4px] py-[2px] font-['Pretendard'] text-[12px] leading-[14.4px] tracking-[0px] ${
              index === 0
                ? 'bg-[#C06D43] font-[400] text-white'
                : index === 1
                  ? 'bg-[#CBE5D8] font-[500] text-[#5A876E]'
                  : 'bg-[#D8D8D8] font-[400] text-white'
            }`}
          >
            <span className="truncate">{tag}</span>
          </span>
        ))}
      </div>

      <h1 className="mt-[16px] font-['Pretendard'] text-[22px] font-[700] leading-[28px] tracking-[0px] text-[#131416]">
        {experience.title}
      </h1>
      <p className="mt-[12px] line-clamp-4 font-['Pretendard'] text-[14px] font-[400] leading-[22px] tracking-[0px] text-[#494949]">
        {experience.content}
      </p>

      <div className="mt-[18px] flex items-center gap-[4px] font-['Pretendard'] text-[12px] font-[300] leading-[16.8px] tracking-[0px] text-[#8A8A8A]">
        <span>{experience.author.nickname || '익명'}</span>
        <span>·</span>
        <span>{formatDate(experience.createdAt)}</span>
        <span>·</span>
        <span>{`조회 ${experience.viewCount.toLocaleString()}`}</span>
      </div>
    </section>
  );
}

function CompareInsightSection({
  sourceExperience,
  comparePayload,
}: {
  sourceExperience: Experience;
  comparePayload: ExperienceComparePayload | null;
}) {
  if (!comparePayload || comparePayload.experiences.length < 2) {
    return null;
  }

  const targetExperience =
    comparePayload.experiences.find((item) => item.id !== sourceExperience.id) ??
    comparePayload.experiences[1];

  return (
    <section className="rounded-[24px] border border-[#F2F2F2] bg-white px-[18px] py-[18px] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="flex flex-col gap-[6px]">
        <span className="font-['Pretendard'] text-[12px] font-[600] leading-[14.4px] tracking-[0px] text-[#5A876E]">
          대표 성공사례 비교
        </span>
        <h2 className="font-['Pretendard'] text-[20px] font-[700] leading-[26px] tracking-[0px] text-[#131416]">
          {targetExperience.title}
        </h2>
      </div>

      <div className="mt-[18px] flex flex-col gap-[14px]">
        <div>
          <p className="font-['Pretendard'] text-[14px] font-[700] leading-[16.8px] text-[#131416]">공통 패턴</p>
          <div className="mt-[8px] flex flex-wrap gap-[6px]">
            {comparePayload.commonPatterns.length ? (
              comparePayload.commonPatterns.map((item, index) => (
                <span
                  key={`${item}-${index}`}
                  className="rounded-[999px] bg-[#EAF3EE] px-[10px] py-[6px] font-['Pretendard'] text-[12px] font-[500] leading-[14.4px] text-[#4A735D]"
                >
                  {item}
                </span>
              ))
            ) : (
              <span className="font-['Pretendard'] text-[13px] leading-[18px] text-[#7B7B7B]">공통 패턴을 정리 중입니다.</span>
            )}
          </div>
        </div>

        <div>
          <p className="font-['Pretendard'] text-[14px] font-[700] leading-[16.8px] text-[#131416]">차이점</p>
          <ul className="mt-[8px] flex list-disc flex-col gap-[6px] pl-[18px] font-['Pretendard'] text-[13px] leading-[19px] text-[#494949]">
            {comparePayload.differences.length ? (
              comparePayload.differences.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)
            ) : (
              <li>차이점을 정리 중입니다.</li>
            )}
          </ul>
        </div>

        <div className="rounded-[16px] bg-[#F7FAF8] px-[14px] py-[14px]">
          <p className="font-['Pretendard'] text-[14px] font-[700] leading-[16.8px] text-[#131416]">추천 액션</p>
          <ul className="mt-[8px] flex list-disc flex-col gap-[6px] pl-[18px] font-['Pretendard'] text-[13px] leading-[19px] text-[#494949]">
            {comparePayload.recommendations.length ? (
              comparePayload.recommendations.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)
            ) : (
              <li>추천 액션을 준비 중입니다.</li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}

function SuccessCaseCard({ experience }: { experience: Experience }) {
  const tags = buildTags(experience);
  const imageMeta = getExperienceImageMeta(experience);
  const preview =
    experience.content.replace(/!\[[^\]]*]\(([^)]+)\)/g, '').replace(/\s+/g, ' ').trim() || '본문 미리보기를 준비 중입니다.';

  return (
    <Link
      to={`/experiences/${experience.id}`}
      className="block rounded-[24px] border border-[#F2F2F2] bg-white px-[18px] py-[18px] shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
    >
      <div className="flex flex-wrap gap-[4px]">
        {tags.map((tag, index) => (
          <span
            key={`${experience.id}-${tag}-${index}`}
            className={`flex h-[18px] max-w-[80px] items-center justify-center rounded-[4px] px-[4px] py-[2px] font-['Pretendard'] text-[12px] leading-[14.4px] tracking-[0px] ${
              index === 0
                ? 'bg-[#5A876E] font-[400] text-white'
                : index === 1
                  ? 'bg-[#CBE5D8] font-[500] text-[#5A876E]'
                  : 'bg-[#D8D8D8] font-[400] text-white'
            }`}
          >
            <span className="truncate">{tag}</span>
          </span>
        ))}
      </div>

      <div className={`mt-[14px] flex items-start gap-[12px] ${imageMeta.primaryImageUrl ? '' : 'min-h-[72px]'}`}>
        {imageMeta.primaryImageUrl ? (
          <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-[8px] bg-[#A8A8A8]">
            <img src={imageMeta.primaryImageUrl} alt="" className="h-full w-full object-cover" />
            <div className="absolute bottom-[6px] right-[6px] flex h-[18px] min-w-[18px] items-center justify-center rounded-[4px] bg-[rgba(0,0,0,0.35)] px-[4px]">
              <span className="font-['Pretendard'] text-[10px] font-[600] leading-[12px] tracking-[0px] text-white">
                {Math.max(imageMeta.imageCount, 1)}
              </span>
            </div>
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-2 font-['Pretendard'] text-[20px] font-[700] leading-[26px] tracking-[0px] text-[#131416]">
            {experience.title}
          </h2>
          <p
            className={`mt-[10px] font-['Pretendard'] text-[14px] font-[400] leading-[22px] tracking-[0px] text-[#494949] ${
              imageMeta.primaryImageUrl ? 'line-clamp-3' : 'line-clamp-4'
            }`}
          >
            {preview}
          </p>
        </div>
      </div>

      <div className="mt-[18px] flex items-center justify-between">
        <div className="flex items-center gap-[4px] font-['Pretendard'] text-[12px] font-[300] leading-[16.8px] tracking-[0px] text-[#8A8A8A]">
          <span>{experience.author.nickname || '익명'}</span>
          <span>·</span>
          <span>{formatDate(experience.createdAt)}</span>
        </div>

        <div className="flex items-center gap-[1px]">
          <img src={bookmarkIcon} alt="" className="h-[14px] w-[14px]" />
          <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#8A8A8A]">
            {experience.likeCount.toLocaleString()}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function SuccessComparisonPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sourceExperience, setSourceExperience] = useState<Experience | null>(null);
  const [successCases, setSuccessCases] = useState<Experience[]>([]);
  const [comparePayload, setComparePayload] = useState<ExperienceComparePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError('사례 ID를 찾을 수 없습니다.');
      return;
    }

    void (async () => {
      setLoading(true);
      setError('');
      try {
        const [source, related] = await Promise.all([getExperience(id), getRelatedSuccessCases(id, 10)]);
        setSourceExperience(source);
        setSuccessCases(related);

        if (related.length > 0) {
          const compareResult = await compareExperiences([source.id, related[0].id]);
          setComparePayload(compareResult);
        } else {
          setComparePayload(null);
        }
      } catch (requestError) {
        setError(resolveErrorMessage(requestError, '성공 사례를 불러오지 못했습니다.'));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const successCountLabel = useMemo(() => `${successCases.length}개의 성공 사례`, [successCases.length]);

  return (
    <div className="min-h-screen bg-[#D6ECE2]">
      <div className="mx-auto min-h-screen w-full max-w-[393px] bg-white">
        <StatusBarV1 />
        <HeaderV1 onBack={() => navigate(-1)} />

        <div className="bg-white px-[16px] pb-[48px]">
          {loading ? (
            <div className="py-[32px]">
              <LoadingState message="성공 사례를 불러오는 중입니다." />
            </div>
          ) : error ? (
            <div className="py-[20px]">
              <ErrorState message={error} />
            </div>
          ) : sourceExperience ? (
            <div className="flex flex-col gap-[16px]">
              <div className="rounded-[18px] bg-[#F6F8F6] px-[16px] py-[14px]">
                <p className="font-['Pretendard'] text-[12px] font-[500] leading-[16.8px] tracking-[0px] text-[#5A876E]">
                  비슷한 실패 경험에서 출발한 성공 사례를 모아봤어요.
                </p>
              </div>

              <FailureSummaryCard experience={sourceExperience} />
              <CompareInsightSection sourceExperience={sourceExperience} comparePayload={comparePayload} />

              <section className="flex flex-col gap-[12px]">
                <div className="flex items-end justify-between">
                  <div className="flex flex-col gap-[4px]">
                    <span className="font-['Pretendard'] text-[16px] font-[700] leading-[19.2px] tracking-[0px] text-[#131416]">
                      연결된 성공 사례
                    </span>
                    <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#8A8A8A]">
                      {successCountLabel}
                    </span>
                  </div>
                </div>

                {successCases.length ? (
                  <div className="flex flex-col gap-[12px]">
                    {successCases.map((item) => (
                      <SuccessCaseCard key={item.id} experience={item} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[24px] border border-[#F2F2F2] bg-white px-[18px] py-[24px] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                    <PageMessage message="연결된 성공 사례가 아직 없어요." />
                  </div>
                )}
              </section>
            </div>
          ) : (
            <div className="py-[20px]">
              <PageMessage message="원본 실패 사례를 불러오지 못했습니다." />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
