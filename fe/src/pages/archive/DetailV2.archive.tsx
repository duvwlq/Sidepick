// Archived detail screen. Kept for reference only; active detail routing uses DetailV1.
import { ChevronLeft, ExternalLink, Share2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import HeaderBookmarkIcon from '../../components/common/HeaderBookmarkIcon';
import { ErrorState, LoadingState } from '../../components/common/Skeleton';
import { useToast } from '../../components/common/useToast';
import BottomNav from '../../components/layout/BottomNav';
import type { Experience, SimilarExperienceMatch } from '../../lib/api';
import {
  bookmarkExperience,
  getBookmarkStatus,
  getExperience,
  getExperienceShare,
  getSimilarExperiences,
  unbookmarkExperience,
} from '../../lib/api';
import { publishBookmarkSync } from '../../lib/bookmark-sync';
import { extractExperienceImageUrls } from '../../lib/experience-images';
import { resolveErrorMessage } from '../../lib/resolve-error-message';
import { getAccessToken } from '../../lib/session';

type SimilarCardModel = {
  id: number;
  title: string;
  summary: string;
  category: string;
  nickname: string;
  createdAt: string;
  similarity: number;
  keywords: string[];
  thumbnailUrl: string | null;
};

function sanitizeText(value: string | null | undefined, fallback = '') {
  const normalized = (value ?? '').replace(/\s+/g, ' ').trim();
  return normalized || fallback;
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

function formatMoney(value: number | null | undefined) {
  return `${(value ?? 0).toLocaleString()}원`;
}

function formatDuration(months: number | null | undefined) {
  if (!months || months <= 0) {
    return '-';
  }

  if (months < 12) {
    return `${months}개월`;
  }

  const years = Math.floor(months / 12);
  const remainMonths = months % 12;
  return remainMonths ? `${years}년 ${remainMonths}개월` : `${years}년`;
}

function normalizeSimilarityPercent(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 90;
  }

  const normalized = value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(99, Math.round(normalized)));
}

function localizeMatchingFactor(value: string) {
  const normalized = value.trim().toLowerCase();

  if (normalized === 'same business type') {
    return '업종 일치';
  }
  if (normalized === 'same failure reason') {
    return '실패 원인 일치';
  }
  if (normalized === 'similar investment amount') {
    return '투자금 유사';
  }

  return value;
}

function stripImageMarkdown(content: string) {
  return content.replace(/!\[[^\]]*]\(([^)]+)\)/g, '').replace(/\s+/g, ' ').trim();
}

function buildIssueChips(experience: Experience) {
  const source = [
    ...(experience.analysis?.keywords ?? []),
    ...(experience.analysis?.extractedPatterns ?? []),
    ...experience.failureReasons,
    ...experience.difficulties,
  ]
    .map((item) => sanitizeText(item))
    .filter(Boolean);

  return Array.from(new Set(source)).slice(0, 4);
}

function buildGuideLines(experience: Experience) {
  const lines = [
    ...(experience.analysis?.successFactors ?? []),
    ...(experience.analysis?.riskFactors ?? []),
  ]
    .map((item) => sanitizeText(item))
    .filter(Boolean);

  return lines.slice(0, 3);
}

function buildGuideSummary(experience: Experience) {
  return sanitizeText(
    experience.analysis?.structuredSummary ?? experience.analysis?.failureCategory,
    experience.title,
  );
}

function buildPatternRows(experience: Experience) {
  const labels = Array.from(
    new Set(
      [
        sanitizeText(experience.analysis?.failureCategory),
        ...(experience.analysis?.extractedPatterns ?? []).map((item) => sanitizeText(item)),
        ...experience.failureReasons.map((item) => sanitizeText(item)),
      ].filter(Boolean),
    ),
  ).slice(0, 3);

  const fallback = ['마케팅 부족', '초기 유입 부족', '운영 전략 미흡'];
  const safeLabels = labels.length ? labels : fallback;
  const percents = safeLabels.length === 1 ? [100] : safeLabels.length === 2 ? [60, 40] : [50, 30, 20];

  return safeLabels.map((label, index) => ({ label, percent: percents[index] ?? 0 }));
}

function buildTopTags(experience: Experience) {
  const source = [
    sanitizeText(experience.businessType),
    sanitizeText(experience.category.name),
    ...(experience.analysis?.keywords ?? []).map((item) => sanitizeText(item)),
  ].filter(Boolean);

  return Array.from(new Set(source)).slice(0, 4);
}

function buildSimilarCardModel(item: SimilarExperienceMatch): SimilarCardModel {
  const experience = item.similarExperience;
  const imageUrls = extractExperienceImageUrls(experience);

  return {
    id: experience.id,
    title: sanitizeText(experience.title, '제목'),
    summary: sanitizeText(
      stripImageMarkdown(experience.content) ||
        experience.lessonsLearned ||
        experience.analysis?.structuredSummary,
      '설명이 아직 없습니다.',
    ),
    category: sanitizeText(experience.category.name, '카테고리'),
    nickname: sanitizeText(experience.author.nickname, '익명'),
    createdAt: formatDate(experience.createdAt),
    similarity: normalizeSimilarityPercent(item.similarityScore),
    keywords: (item.matchingFactors ?? []).map(localizeMatchingFactor).slice(0, 2),
    thumbnailUrl: imageUrls[0] ?? null,
  };
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-[4px]">
      <p className="text-[16px] font-[600] leading-[19px] text-[#131416]">{title}</p>
      <p className="text-[12px] leading-[16.8px] text-[#494949]">{description}</p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center rounded-[10px] bg-[#F8F8F8] px-[12px] py-[14px] text-center">
      <p className="text-[15px] font-[600] leading-[18px] text-[#131416]">{value}</p>
      <p className="mt-[4px] text-[12px] leading-[14.4px] text-[#8A8A8A]">{label}</p>
    </div>
  );
}

function PatternRow({ label, percent }: { label: string; percent: number }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <div className="flex items-center justify-between">
        <span className="text-[12px] leading-[16.8px] text-[#494949]">{label}</span>
        <span className="text-[12px] leading-[16.8px] text-[#5E5E5E]">{percent}%</span>
      </div>
      <div className="h-[6px] w-full rounded-[999px] bg-[#D8D8D8]">
        <div
          className="h-[6px] rounded-[999px] bg-gradient-to-r from-[#92BFA6] to-[#5A876E]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function SimilarCard({ card, onClick }: { card: SimilarCardModel; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col gap-[10px] rounded-[10px] bg-[#F8F8F8] p-[16px] text-left"
    >
      <div className="flex items-center justify-between gap-[8px]">
        <div className="flex min-w-0 flex-wrap gap-[4px]">
          <span className="rounded-[4px] bg-[#C06D43] px-[4px] py-[2px] text-[10px] font-[500] leading-[12px] text-white">
            실패
          </span>
          <span className="rounded-[4px] bg-[#CBE5D8] px-[4px] py-[2px] text-[10px] font-[500] leading-[12px] text-[#5A876E]">
            {card.category}
          </span>
          {card.keywords.map((keyword) => (
            <span
              key={keyword}
              className="rounded-[4px] bg-[#E6E6E6] px-[4px] py-[2px] text-[10px] font-[500] leading-[12px] text-[#8A8A8A]"
            >
              {keyword}
            </span>
          ))}
        </div>
        <span className="shrink-0 text-[12px] font-[600] leading-[16.8px] text-[#8A8A8A]">
          {card.similarity}%
        </span>
      </div>

      <div className="flex gap-[8px]">
        {card.thumbnailUrl ? (
          <div className="h-[60px] w-[80px] shrink-0 overflow-hidden rounded-[4px] bg-[#D8D8D8]">
            <img src={card.thumbnailUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-[14px] font-[600] leading-[16.8px] text-[#131416]">{card.title}</p>
          <p className="mt-[4px] line-clamp-2 text-[12px] leading-[16.8px] text-[#494949]">{card.summary}</p>
        </div>
      </div>

      <p className="text-[12px] leading-[16.8px] text-[#8A8A8A]">
        {card.nickname} · {card.createdAt}
      </p>
    </button>
  );
}

export default function DetailV2() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const experienceId = id ? Number(id) : null;
  const isFixtureMode = new URLSearchParams(location.search).get('mode') === 'fixture';
  const accessToken = getAccessToken();

  const [experience, setExperience] = useState<Experience | null>(null);
  const [similarCases, setSimilarCases] = useState<SimilarExperienceMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fabExpanded, setFabExpanded] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    if (isFixtureMode) {
      setLoading(false);
      setError('');
      return;
    }

    if (!experienceId || !Number.isFinite(experienceId)) {
      setLoading(false);
      setError('유효한 사례를 찾을 수 없습니다.');
      return;
    }

    let cancelled = false;
    const targetExperienceId = experienceId;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const detail = await getExperience(targetExperienceId);
        const related = await getSimilarExperiences(targetExperienceId, 2).catch(() => []);

        if (cancelled) {
          return;
        }

        setExperience(detail);
        setSimilarCases(related);

        if (accessToken) {
          try {
            const status = await getBookmarkStatus(accessToken, detail.id);
            if (!cancelled) {
              setBookmarked(status.bookmarked);
            }
          } catch {
            if (!cancelled) {
              setBookmarked(false);
            }
          }
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(resolveErrorMessage(requestError, '사례 상세를 불러오지 못했습니다.'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [accessToken, experienceId, isFixtureMode]);

  const issueChips = useMemo(() => (experience ? buildIssueChips(experience) : []), [experience]);
  const guideSummary = useMemo(() => (experience ? buildGuideSummary(experience) : ''), [experience]);
  const guideLines = useMemo(() => (experience ? buildGuideLines(experience) : []), [experience]);
  const patternRows = useMemo(() => (experience ? buildPatternRows(experience) : []), [experience]);
  const topTags = useMemo(() => (experience ? buildTopTags(experience) : []), [experience]);
  const similarCardModels = useMemo(() => similarCases.map(buildSimilarCardModel), [similarCases]);
  const imageUrls = useMemo(() => (experience ? extractExperienceImageUrls(experience) : []), [experience]);

  async function handleBookmarkToggle() {
    if (!experience) {
      return;
    }

    if (!accessToken) {
      navigate(
        `/auth?next=${encodeURIComponent(`/experiences/${experience.id}`)}&reason=${encodeURIComponent(
          '북마크는 로그인이 필요한 서비스입니다.',
        )}`,
      );
      return;
    }

    try {
      const payload = bookmarked
        ? await unbookmarkExperience(accessToken, experience.id)
        : await bookmarkExperience(accessToken, experience.id);

      setBookmarked(payload.bookmarked);
      setExperience((current) => (current ? { ...current, bookmarkCount: payload.bookmarkCount } : current));
      publishBookmarkSync({
        experienceId: experience.id,
        bookmarked: payload.bookmarked,
        bookmarkCount: payload.bookmarkCount,
      });
      showToast(payload.bookmarked ? '북마크에 추가했어요.' : '북마크를 해제했어요.');
    } catch (bookmarkError) {
      showToast(resolveErrorMessage(bookmarkError, '북마크 처리에 실패했습니다.'));
    }
  }

  async function handleShare() {
    if (!experience) {
      return;
    }

    try {
      const payload = await getExperienceShare(experience.id);

      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({
          title: payload.title,
          text: payload.description,
          url: payload.shareUrl,
        });
        return;
      }

      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload.shareUrl);
        showToast('공유 링크를 복사했어요.');
        return;
      }

      showToast(payload.shareUrl);
    } catch (shareError) {
      showToast(resolveErrorMessage(shareError, '공유 정보를 불러오지 못했습니다.'));
    }
  }

  function moveToGuide() {
    navigate('/faq');
  }

  function handleCreateClick() {
    setFabExpanded(false);

    if (!accessToken) {
      navigate(
        `/auth?next=${encodeURIComponent('/create')}&reason=${encodeURIComponent(
          '경험 작성은 로그인이 필요한 서비스입니다.',
        )}`,
      );
      return;
    }

    navigate('/create');
  }

  if (loading && !isFixtureMode) {
    return (
      <div className="mx-auto min-h-screen w-full max-w-[375px] bg-white px-[16px] py-[40px]">
        <LoadingState message="사례 상세를 불러오는 중입니다." />
      </div>
    );
  }

  if ((error || !experience) && !isFixtureMode) {
    return (
      <div className="mx-auto min-h-screen w-full max-w-[375px] bg-white px-[16px] py-[40px]">
        <ErrorState message={error || '사례를 불러오지 못했습니다.'} />
      </div>
    );
  }

  if (!experience) {
    return null;
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-[375px] bg-white">
      <div className="sticky top-0 z-30 bg-white">
        <div className="flex h-[64px] items-center justify-between px-[16px] py-[20px]">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
                return;
              }
              navigate('/explore');
            }}
            aria-label="뒤로 가기"
            className="flex h-[24px] w-[24px] items-center justify-center"
          >
            <ChevronLeft size={24} strokeWidth={1.75} />
          </button>

          <p className="text-[16px] font-[600] leading-[19.2px] text-black">사례 상세</p>

          <button
            type="button"
            onClick={handleBookmarkToggle}
            aria-label={bookmarked ? '북마크 해제' : '북마크 추가'}
            className="flex h-[24px] w-[24px] items-center justify-center"
          >
            <HeaderBookmarkIcon active={bookmarked} className="h-[24px] w-[24px]" />
          </button>
        </div>
      </div>

      <main className="flex flex-col gap-[12px] pb-[140px]">
        <section className="bg-white px-[16px] py-[12px]">
          <div className="flex items-start justify-between gap-[12px]">
            <div>
              <p className="text-[12px] font-[600] leading-[16.8px] text-[#131416]">
                {sanitizeText(experience.author.nickname, '익명')}
              </p>
              <p className="text-[12px] leading-[16.8px] text-[#8A8A8A]">
                {formatDate(experience.createdAt)} · {experience.category.name}
              </p>
            </div>

            <button
              type="button"
              onClick={handleShare}
              aria-label="공유"
              className="flex h-[24px] w-[24px] items-center justify-center text-[#131416]"
            >
              <Share2 size={18} strokeWidth={1.9} />
            </button>
          </div>

          <h1 className="mt-[20px] text-[18px] font-[600] leading-[24px] text-[#131416]">
            {experience.title}
          </h1>
          <p className="mt-[14px] whitespace-pre-wrap text-[14px] leading-[21px] text-[#494949]">
            {experience.content}
          </p>

          {imageUrls.length ? (
            <div className="mt-[16px] flex gap-[10px] overflow-x-auto pb-[4px]">
              {imageUrls.map((imageUrl, index) => (
                <div key={`${imageUrl}-${index}`} className="h-[220px] w-[220px] shrink-0 overflow-hidden rounded-[10px]">
                  <img src={imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          ) : null}

          {topTags.length ? (
            <div className="mt-[16px] flex flex-wrap gap-[6px]">
              {topTags.map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className={`rounded-[4px] px-[4px] py-[2px] text-[10px] font-[500] leading-[12px] ${
                    index === 0
                      ? 'bg-[#C06D43] text-white'
                      : index === 1
                        ? 'bg-[#5A876E] text-white'
                        : 'bg-[#E6E6E6] text-[#8A8A8A]'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-[16px] flex gap-[8px]">
            <MetricCard label="진행 기간" value={formatDuration(experience.durationMonths)} />
            <MetricCard label="투자금" value={formatMoney(experience.investmentAmount)} />
            <MetricCard label="수익" value={formatMoney(experience.monthlyRevenue)} />
          </div>
        </section>

        <section className="bg-white px-[16px] py-[12px]">
          <SectionTitle title="핵심 이슈" description="해당 사례에서 찾아볼 수 있는 핵심 이슈입니다." />
          <div className="mt-[12px] flex flex-wrap gap-[6px]">
            {issueChips.length ? (
              issueChips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-[999px] border border-[#5A876E] px-[14px] py-[8px] text-[12px] leading-[16.8px] text-[#5A876E]"
                >
                  # {chip}
                </span>
              ))
            ) : (
              <p className="text-[12px] leading-[16.8px] text-[#8A8A8A]">아직 정리된 핵심 이슈가 없습니다.</p>
            )}
          </div>
        </section>

        <section className="px-[16px] py-[12px]">
          <div className="rounded-[10px] border border-[#E6E6E6] bg-white px-[16px] py-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-[4px]">
              <div className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-[#D8EEE1] text-[11px] font-[700] leading-none text-[#131416]">
                AI
              </div>
              <p className="text-[20px] font-[600] leading-[24px] text-[#131416]">AI 가이드</p>
            </div>

            <p className="mt-[12px] text-[12px] leading-[16.8px] text-[#494949]">{guideSummary}</p>

            <div className="my-[12px] h-px w-full bg-[#D8D8D8]" />

            <div className="flex flex-col gap-[10px]">
              {guideLines.length ? (
                guideLines.map((line, index) => (
                  <p key={`${index}-${line.slice(0, 8)}`} className="text-[14px] leading-[24px] text-[#494949]">
                    {index + 1}. {line}
                  </p>
                ))
              ) : (
                <p className="text-[12px] leading-[16.8px] text-[#8A8A8A]">아직 준비된 AI 가이드가 없습니다.</p>
              )}
            </div>

            {guideLines.length ? (
              <>
                <div className="my-[12px] h-px w-full bg-[#D8D8D8]" />
                <p className="text-[12px] leading-[16.8px] text-[#5E5E5E]">
                  처음에는 작은 시도들이 쌓이면서 변화가 생기기 때문에 하루에 한 가지씩만 꾸준히 시도해도 충분합니다.
                </p>
              </>
            ) : null}
          </div>
        </section>

        <section className="bg-white px-[16px] py-[12px]">
          <SectionTitle
            title="실패 패턴"
            description="유사 카테고리 내 실패 원인별 비중을 간단히 보여드립니다."
          />
          <div className="mt-[12px] flex flex-col gap-[16px] rounded-[10px] bg-[#F8F8F8] p-[16px]">
            {patternRows.map((row) => (
              <PatternRow key={`${row.label}-${row.percent}`} label={row.label} percent={row.percent} />
            ))}
          </div>
        </section>

        <section className="bg-white px-[16px] py-[12px]">
          <SectionTitle
            title="유사 사례"
            description="이 사례와 비슷한 실패 경험을 가진 다른 사례를 추천해드립니다."
          />
          <div className="mt-[12px] flex flex-col gap-[10px]">
            {similarCardModels.length ? (
              similarCardModels.map((card) => (
                <SimilarCard key={card.id} card={card} onClick={() => navigate(`/experiences/${card.id}`)} />
              ))
            ) : (
              <div className="rounded-[10px] bg-[#F8F8F8] px-[16px] py-[20px] text-[12px] leading-[16.8px] text-[#8A8A8A]">
                아직 유사한 사례가 없습니다.
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate('/explore')}
            className="mt-[12px] inline-flex items-center gap-[6px] text-[12px] leading-[14.4px] text-[#5D5D5D] underline underline-offset-2"
          >
            모든 사례 보기
            <ExternalLink size={12} strokeWidth={2} />
          </button>
        </section>
      </main>

      <BottomNav
        active="explore"
        showFab={false}
        onCreateClick={handleCreateClick}
        accessoryLayout="between"
        accessory={
          <>
            <button
              type="button"
              onClick={moveToGuide}
              className="pointer-events-auto inline-flex h-[36px] min-w-[208px] items-center justify-center gap-[6px] rounded-[999px] bg-[#5A876E] px-[12px] text-[14px] font-[500] text-[#F8F8F8]"
            >
              해당 부업 가이드 바로가기
              <ExternalLink size={14} strokeWidth={2} />
            </button>

            <button
              type="button"
              onClick={() => setFabExpanded((current) => !current)}
              className={`pointer-events-auto flex h-[36px] w-[36px] items-center justify-center rounded-full ${
                fabExpanded ? 'bg-[#A8D3BD]' : 'bg-[#5A876E]'
              } text-white`}
              aria-label={fabExpanded ? '경험 작성 닫기' : '경험 작성'}
            >
              <span className="text-[28px] leading-none">+</span>
            </button>
          </>
        }
      />
    </div>
  );
}
