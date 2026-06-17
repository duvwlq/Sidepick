import {
  ChevronRight,
  X,
} from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import arrowLeftIcon from '../assets/auth-figma/arrow-left.svg';
import accountCircleZipIcon from '../assets/detail-v1-icons/account-circle.svg';
import aiGuideSymbolZipIcon from '../assets/detail-v1-icons/ai-guide-symbol.svg';
import clockZipIcon from '../assets/detail-v1-icons/clock.svg';
import dollarSignZipIcon from '../assets/detail-v1-icons/dollar-sign.svg';
import uploadZipIcon from '../assets/detail-v1-icons/upload.svg';
import editIcon from '../assets/explore-figma/edit.svg';
import HeaderBookmarkIcon from '../components/common/HeaderBookmarkIcon';
import BottomNav from '../components/layout/BottomNav';
import { CaseBookmarkCount, CaseChip, CaseChipRow, CaseReactionCount } from '../components/common/CaseUi';
import { ErrorState, LoadingState } from '../components/common/Skeleton';
import { useToast } from '../components/common/useToast';
import guideIcon from '../assets/home-v1-figma/icons/guide-figma.svg';
import plusIcon from '../assets/home-v1-figma/icons/plus-figma.svg';
import subtractIcon from '../assets/figma-downloaded-icons/home/Subtract.svg';
import {
  bookmarkExperience,
  deleteExperience,
  getBookmarkStatus,
  getExperience,
  getExperienceShare,
  getRelatedSuccessCases,
  getSimilarExperiences,
  type Experience,
  type SimilarExperienceMatch,
  unbookmarkExperience,
} from '../lib/api';
import { publishBookmarkSync } from '../lib/bookmark-sync';
import { extractExperienceImageUrls } from '../lib/experience-images';
import { resolveErrorMessage } from '../lib/resolve-error-message';
import { getAccessToken, getStoredUser } from '../lib/session';

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

function sanitizeText(value: string | null | undefined, fallback: string) {
  const normalized = (value ?? '').replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return fallback;
  }
  if (normalized.includes('�') || /\?{3,}/.test(normalized)) {
    return fallback;
  }
  return normalized;
}

function stripImageMarkdown(content: string) {
  return content.replace(/!\[[^\]]*]\(([^)]+)\)/g, '').replace(/\s+/g, ' ').trim();
}

function formatDurationValue(months: number | null) {
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

function formatMoneyValue(value: number | null) {
  if (value == null) {
    return '0원';
  }
  return `${value.toLocaleString()}원`;
}

function buildTopTags(experience: Experience) {
  const raw = [
    experience.category.name,
    ...experience.failureReasons,
    ...experience.difficulties,
    ...(experience.analysis?.keywords ?? []),
  ]
    .map((item) => sanitizeText(item, '').trim())
    .filter(Boolean);

  const deduped = Array.from(new Set(raw));
  const category = sanitizeText(experience.category.name, '카테고리');
  const type = sanitizeText(experience.businessType, '부업');
  const keywords = deduped.filter((item) => item !== category).slice(0, 2);

  return [
    type,
    category,
    keywords[0] ?? '키워드',
    keywords[1] ?? '키워드',
  ];
}

function buildIssueChips(experience: Experience) {
  const source = [
    ...(experience.analysis?.keywords ?? []),
    ...experience.failureReasons,
    ...experience.difficulties,
  ]
    .map((item) => sanitizeText(item, '').trim())
    .filter(Boolean);

  const unique = Array.from(new Set(source));
  if (unique.length) {
    return unique.slice(0, 4);
  }

  return ['시장 조사 부족', '수익 구조 점검', '초기 비용 관리'];
}

function buildGuideLines(experience: Experience) {
  const successFactors = (experience.analysis?.successFactors ?? [])
    .map((item) => sanitizeText(item, '').trim())
    .filter(Boolean);
  const riskFactors = (experience.analysis?.riskFactors ?? [])
    .map((item) => sanitizeText(item, '').trim())
    .filter(Boolean);
  const merged = [...successFactors, ...riskFactors];

  if (merged.length) {
    return Array.from(new Set(merged)).slice(0, 3);
  }

  return [
    '시장 검증을 먼저 진행해 보세요.',
    '초기 비용과 운영 시간을 작게 시작해 보세요.',
    '같은 실패 원인이 반복되지 않도록 실행 기준을 정리해 보세요.',
  ];
}

function buildPatternRows(experience: Experience) {
  const source = [
    experience.analysis?.failureCategory ?? '',
    ...(experience.analysis?.extractedPatterns ?? []),
    ...experience.failureReasons,
  ]
    .map((item) => sanitizeText(item, '').trim())
    .filter(Boolean);

  const unique = Array.from(new Set(source)).slice(0, 3);
  if (!unique.length) {
    return [{ label: '실패 원인 분석 준비 중', percent: 100 }];
  }
  if (unique.length === 1) {
    return [{ label: unique[0], percent: 100 }];
  }
  if (unique.length === 2) {
    return [
      { label: unique[0], percent: 60 },
      { label: unique[1], percent: 40 },
    ];
  }
  return [
    { label: unique[0], percent: 50 },
    { label: unique[1], percent: 30 },
    { label: unique[2], percent: 20 },
  ];
}

function MetricStatColumn({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex min-h-[72px] flex-1 flex-col items-center justify-center gap-[4px] px-[10px] py-[10px] text-center">
      <div className="flex h-[16px] w-[16px] items-center justify-center text-[#5A876E]">{icon}</div>
      <p className="whitespace-nowrap font-['Pretendard'] text-[18px] font-[600] leading-[25.2px] tracking-[0px] text-[#131416]">{value}</p>
      <p className="font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#8A8A8A]">{label}</p>
    </div>
  );
}

function SectionBlockTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-[4px]">
      <p className="font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-[#131416]">{title}</p>
      <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949]">{description}</p>
    </div>
  );
}

function AdviceChip({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-[4px] rounded-[999px] border border-[#5A876E] bg-white px-[12px] py-[10px]">
      <span className="font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#375E49]">{text}</span>
      <span className="flex h-[14px] w-[14px] items-center justify-center rounded-[10px] border border-[#BABABA] text-[10px] leading-none text-[#8A8A8A]">
        ?
      </span>
    </div>
  );
}

function PatternRow({ label, percent }: { label: string; percent: number }) {
  return (
    <div className="flex flex-col gap-[4px]">
      <div className="flex items-center justify-between font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949]">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-[4px] w-full rounded-[999px] bg-[#D8D8D8]">
        <div className="h-full rounded-[999px] bg-gradient-to-r from-[#92BFA6] to-[#5A876E]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function SimilarCaseCard({
  title,
  summary,
  tags,
  success,
  likeCount,
  bookmarkCount,
  viewCount,
  author,
  createdAt,
  similarity,
  onClick,
}: {
  title: string;
  summary: string;
  tags: string[];
  success: boolean;
  likeCount: number;
  bookmarkCount: number;
  viewCount: number;
  author: string;
  createdAt: string;
  similarity?: number | null;
  onClick: () => void;
}) {
  const similarityValue = similarity ?? 99;
  const tone = success ? { text: '#5A876E', bar: '#4CAF50' } : { text: '#8A8A8A', bar: '#FFC13B' };
  const barWidth = Math.max(8, Math.min(30, Math.round((similarityValue / 100) * 30)));

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[150px] w-[311px] flex-col gap-[8px] rounded-[4px] bg-[#F8F8F8] px-[16px] py-[20px] text-left"
    >
      <div className="flex w-full items-center justify-between gap-[8px]">
        <CaseChipRow className="min-w-0 flex-1 pr-[8px]">
          <CaseChip label={success ? '성공' : '실패'} tone={success ? 'status-success' : 'status-failure'} compact maxWidthClassName="max-w-[40px]" />
          <CaseChip label={tags[0] ?? '카테고리'} tone="category" compact maxWidthClassName="max-w-[108px]" />
          <CaseChip label={tags[1] ?? '키워드'} tone="keyword" compact maxWidthClassName="max-w-[58px]" />
          <CaseChip label={tags[2] ?? '키워드'} tone="keyword" compact maxWidthClassName="max-w-[58px]" />
        </CaseChipRow>
        <div className="flex shrink-0 items-center gap-[4px]">
          <span className="relative h-[4px] w-[30px] rounded-[999px] bg-[#EEEEEE]">
            <span
              className="absolute left-0 top-0 h-[4px] rounded-[999px]"
              style={{ width: `${barWidth}px`, backgroundColor: tone.bar }}
            />
          </span>
          <span className="font-['Pretendard'] text-[12px] font-[600] leading-[16.8px]" style={{ color: tone.text }}>
            {similarityValue}%
          </span>
        </div>
      </div>

      <div className="flex h-[60px] w-full items-start gap-[8px]">
        <div className="flex h-[60px] min-w-0 flex-1 flex-col gap-[4px]">
          <p className="overflow-hidden text-ellipsis whitespace-nowrap font-['Pretendard'] text-[14px] font-[600] leading-[16.8px] tracking-[0px] text-[#131416]">
            {title}
          </p>
          <p className="overflow-hidden text-ellipsis whitespace-nowrap font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949]">
            {summary}
          </p>
        </div>
      </div>

      <div className="flex w-full items-center justify-between">
        <div className="flex items-start gap-[4px] font-['Pretendard'] text-[12px] font-[300] leading-[16.8px] tracking-[0px] text-[#8A8A8A]">
          <span>{author}</span>
          <span>•</span>
          <span>{createdAt}</span>
          <span>•</span>
          <span>{`조회 ${viewCount.toLocaleString()}`}</span>
        </div>

        <div className="flex shrink-0 items-center gap-[4px] pt-[1px]">
          <CaseReactionCount count={likeCount} />
          <CaseBookmarkCount count={bookmarkCount} />
        </div>
      </div>
    </button>
  );
}

export default function DetailV1() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const accessToken = getAccessToken();
  const viewer = getStoredUser();
  const experienceId = id ? Number(id) : null;
  const analysisSectionRef = useRef<HTMLElement | null>(null);

  const [experience, setExperience] = useState<Experience | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookmarked, setBookmarked] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [successCases, setSuccessCases] = useState<Experience[]>([]);
  const [similarCases, setSimilarCases] = useState<SimilarExperienceMatch[]>([]);
  const [fabExpanded, setFabExpanded] = useState(false);

  const isOwner = useMemo(() => {
    if (!viewer || !experience) {
      return false;
    }
    return viewer.id === experience.author.id;
  }, [viewer, experience]);

  useEffect(() => {
    if (!experienceId || !Number.isFinite(experienceId)) {
      setLoading(false);
      setError('유효한 사례를 찾을 수 없어요.');
      return;
    }

    let cancelled = false;
    const targetExperienceId = experienceId;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const payload = await getExperience(targetExperienceId);
        if (cancelled) {
          return;
        }
        setExperience(payload);

        if (accessToken) {
          try {
            const status = await getBookmarkStatus(accessToken, payload.id);
            if (!cancelled) {
              setBookmarked(status.bookmarked);
            }
          } catch {
            if (!cancelled) {
              setBookmarked(false);
            }
          }
        } else {
          setBookmarked(false);
        }

        try {
          const similar = await getSimilarExperiences(payload.id, 2);
          if (!cancelled) {
            setSimilarCases(
              similar.filter((item) => item.similarExperience.id !== payload.id),
            );
          }
        } catch {
          if (!cancelled) {
            setSimilarCases([]);
          }
        }

        try {
          const related = await getRelatedSuccessCases(payload.id, 2);
          if (!cancelled) {
            setSuccessCases(related);
          }
        } catch {
          if (!cancelled) {
            setSuccessCases([]);
          }
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(resolveErrorMessage(requestError, '사례 상세를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'));
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
  }, [experienceId, accessToken]);

  useEffect(() => {
    if (!experience) {
      return;
    }
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('focus') !== 'analysis') {
      return;
    }
    analysisSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [experience, location.search]);

  const imageUrls = useMemo(() => (experience ? extractExperienceImageUrls(experience) : []), [experience]);
  const tags = useMemo(() => (experience ? buildTopTags(experience) : []), [experience]);
  const issueChips = useMemo(() => (experience ? buildIssueChips(experience) : []), [experience]);
  const guideLines = useMemo(() => (experience ? buildGuideLines(experience) : []), [experience]);
  const patternRows = useMemo(() => (experience ? buildPatternRows(experience) : []), [experience]);

  async function handleBookmarkToggle() {
    if (!experience) {
      return;
    }
    if (!accessToken) {
      navigate(`/auth?next=${encodeURIComponent(`/experiences/${experience.id}`)}&reason=${encodeURIComponent('북마크는 로그인이 필요한 서비스입니다.')}`);
      return;
    }
    try {
      const payload = bookmarked
        ? await unbookmarkExperience(accessToken, experience.id)
        : await bookmarkExperience(accessToken, experience.id);
      setBookmarked(payload.bookmarked);
      setExperience((current) =>
        current
          ? {
              ...current,
              bookmarkCount: payload.bookmarkCount,
            }
          : current,
      );
      publishBookmarkSync({
        experienceId: experience.id,
        bookmarked: payload.bookmarked,
        bookmarkCount: payload.bookmarkCount,
      });
      showToast(payload.bookmarked ? '북마크에 저장했어요.' : '북마크를 해제했어요.');
    } catch (bookmarkError) {
      showToast(resolveErrorMessage(bookmarkError, '북마크 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.'));
    }
  }

  async function handleDelete() {
    if (!experience || !accessToken) {
      return;
    }
    if (!window.confirm('이 사례를 삭제할까요?')) {
      return;
    }
    setDeleting(true);
    setActionMenuOpen(false);

    try {
      await deleteExperience(accessToken, experience.id);
      showToast('사례를 삭제했어요.');
      navigate('/', { replace: true });
    } catch (deleteError) {
      showToast(resolveErrorMessage(deleteError, '사례를 삭제하지 못했습니다.'));
      setDeleting(false);
    }
  }

  function moveToGuide() {
    navigate('/faq');
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

  function handleCreateClick() {
    setFabExpanded(false);

    if (!accessToken) {
      navigate(`/auth?next=${encodeURIComponent('/create')}&reason=${encodeURIComponent('경험 작성은 로그인이 필요한 서비스입니다.')}`);
      return;
    }

    navigate('/create');
  }

  if (loading) {
    return (
      <div className="mx-auto min-h-screen w-full max-w-[375px] bg-white">
        <div className="px-[16px] py-[40px]">
          <LoadingState message="사례를 불러오는 중입니다." />
        </div>
      </div>
    );
  }

  if (error || !experience) {
    return (
      <div className="mx-auto min-h-screen w-full max-w-[375px] bg-white">
        <div className="px-[16px] py-[40px]">
          <ErrorState message={error || '사례를 불러오지 못했어요.'} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-[375px] bg-white">
      {actionMenuOpen ? (
        <button
          type="button"
          aria-label="메뉴 닫기"
          onClick={() => setActionMenuOpen(false)}
          className="fixed inset-0 z-40 bg-transparent"
        />
      ) : null}

      <div className="relative min-h-screen bg-white">
        <div className="sticky top-0 z-30 bg-white">
          <div className="flex h-[64px] items-center justify-between bg-white px-[16px] py-[20px]">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                  return;
                }
                navigate('/explore');
              }}
              className="flex h-[24px] w-[24px] items-center justify-center"
              aria-label="뒤로가기"
            >
              <img src={arrowLeftIcon} alt="" className="h-[24px] w-[24px]" />
            </button>

            <p className="font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-black">사례 상세</p>

            <button
              type="button"
              onClick={handleBookmarkToggle}
              className="flex h-[24px] w-[24px] items-center justify-center"
              aria-label={bookmarked ? '북마크 해제' : '북마크 저장'}
            >
              <HeaderBookmarkIcon active={bookmarked} className="h-[24px] w-[24px]" />
            </button>
          </div>
        </div>

        <main className="flex flex-col gap-[12px] pb-[188px]">
          <section className="bg-white px-[16px] py-[12px]">
            <div className="flex flex-col gap-[24px]">
              <div className="flex items-start justify-between gap-[12px]">
                <div className="flex min-w-0 items-start gap-[8px]">
                  {experience.author.profileImage ? (
                    <img src={experience.author.profileImage} alt="" className="h-[40px] w-[40px] rounded-full object-cover" />
                  ) : (
                    <img src={accountCircleZipIcon} alt="" className="h-[40px] w-[40px] shrink-0" />
                  )}

                  <div className="flex min-w-0 flex-col gap-[2px] pt-[2px]">
                    <div className="flex items-center gap-[4px] font-['Pretendard'] text-[12px] leading-[16.8px] tracking-[0px]">
                      <span className="truncate font-[500] text-[#131416]">{sanitizeText(experience.author.nickname, '닉네임')}</span>
                      <span className="shrink-0 font-[400] text-[#BABABA]">{formatDate(experience.createdAt)}</span>
                    </div>
                    <p className="truncate font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949]">
                      {sanitizeText(experience.category.name, '카테고리')}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-start gap-[4px] pt-[2px]">
                  <button
                    type="button"
                    onClick={() => void handleShare()}
                    className="flex h-[20px] w-[20px] items-center justify-center text-[#1E1E1E]"
                    aria-label="공유"
                  >
                    <img src={uploadZipIcon} alt="" className="h-[20px] w-[20px]" />
                  </button>

                  {isOwner ? (
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setActionMenuOpen((current) => !current)}
                        className="flex h-[20px] w-[20px] items-center justify-center text-[#1E1E1E]"
                        aria-label="더보기"
                      >
                        <span className="relative h-[20px] w-[20px]">
                          <img src={moreVerticalZipIcon} alt="" className="absolute left-[8.667px] top-[2.833px] h-[14.333px] w-[2.667px]" />
                        </span>
                      </button>

                      {actionMenuOpen ? (
                        <div className="absolute right-0 top-[26px] z-50 flex w-[92px] flex-col rounded-[12px] border border-[#E6E6E6] bg-white p-[6px] shadow-[0_12px_24px_rgba(0,0,0,0.12)]">
                          <button
                            type="button"
                            onClick={() => navigate(`/create?experienceId=${experience.id}`)}
                            className="rounded-[8px] px-[10px] py-[8px] text-left font-['Pretendard'] text-[12px] font-[500] leading-[16.8px] tracking-[0px] text-[#131416]"
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete()}
                            disabled={deleting}
                            className="rounded-[8px] px-[10px] py-[8px] text-left font-['Pretendard'] text-[12px] font-[500] leading-[16.8px] tracking-[0px] text-[#D33B3B] disabled:opacity-60"
                          >
                            {deleting ? '삭제 중…' : '삭제'}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col gap-[16px]">
                <h1 className="font-['Pretendard'] text-[16px] font-[500] leading-[19.2px] tracking-[0px] text-[#131416]">
                  {sanitizeText(experience.title, `${sanitizeText(experience.category.name, '부업')} 경험 제목`)}
                </h1>
                <div className="whitespace-pre-wrap font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] tracking-[0px] text-[#494949]">
                  {sanitizeText(experience.content, '실패와 시행착오를 담은 경험입니다.')}
                </div>
              </div>

              {imageUrls.length ? (
                <div className="w-full overflow-x-auto pr-[16px]">
                  <div className="flex w-max gap-[10px]">
                  {imageUrls.slice(0, 2).map((imageUrl, index) => (
                    <div key={`${imageUrl}-${index}`} className="h-[300px] w-[300px] shrink-0 overflow-hidden rounded-[4px] bg-[#F3F3F3]">
                      <img src={imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
                </div>
              ) : null}

              <CaseChipRow>
                <CaseChip
                  label={experience.caseStatus === 'SUCCESS' ? '성공' : '실패'}
                  tone={experience.caseStatus === 'SUCCESS' ? 'status-success' : 'status-failure'}
                  maxWidthClassName="max-w-[44px]"
                />
                <CaseChip label={tags[1] ?? '카테고리'} tone="category" maxWidthClassName="max-w-[116px]" />
                <CaseChip label={tags[2] ?? '키워드'} tone="keyword" maxWidthClassName="max-w-[58px]" />
                <CaseChip label={tags[3] ?? '키워드'} tone="keyword" maxWidthClassName="max-w-[58px]" />
              </CaseChipRow>

              <div className="flex items-stretch gap-[8px] rounded-[4px] bg-white">
                <MetricStatColumn
                  icon={<img src={clockZipIcon} alt="" className="h-[16px] w-[16px]" />}
                  value={formatDurationValue(experience.durationMonths)}
                  label="진행 기간"
                />
                <p className="self-center font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] text-[#D8D8D8]">ㅣ</p>
                <MetricStatColumn
                  icon={<img src={dollarSignZipIcon} alt="" className="h-[16px] w-[16px]" />}
                  value={formatMoneyValue(experience.investmentAmount)}
                  label="투자금"
                />
                <p className="self-center font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] text-[#D8D8D8]">ㅣ</p>
                <MetricStatColumn
                  icon={<img src={dollarSignZipIcon} alt="" className="h-[16px] w-[16px]" />}
                  value={formatMoneyValue(experience.monthlyRevenue)}
                  label="수익"
                />
              </div>
            </div>
          </section>

          <section className="bg-white px-[16px] pb-[20px] pt-[10px]">
            <SectionBlockTitle title="핵심 이슈" description="해당 사례에서 찾아볼 수 있는 핵심 이슈입니다." />
            <div className="pt-[10px]">
              <div className="flex flex-wrap gap-[6px]">
                {issueChips.map((item) => (
                  <AdviceChip key={item} text={`# ${item}`} />
                ))}
              </div>
            </div>
          </section>

          <section ref={analysisSectionRef} className="bg-white px-[16px] py-[12px]">
            <div className="rounded-[10px] border border-[#EEEEEE] border-b-[2px] border-b-[#5A876E] bg-white px-[16px] py-[16px] shadow-[0_0_5px_rgba(0,0,0,0.15)]">
              <div className="flex w-[311px] items-center gap-[4px]">
                <div className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[4px] bg-gradient-to-b from-[#92BFA6] to-[#5A876E]">
                  <img src={aiGuideSymbolZipIcon} alt="" className="h-[12.201px] w-[12px]" />
                </div>
                <p className="font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-[#5A876E]">AI 가이드</p>
              </div>

              <p className="w-[311px] pt-[12px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#5E5E5E]">
                {sanitizeText(experience.analysis?.structuredSummary, '실패 원인을 정리하고 다음 행동으로 이어질 수 있도록 핵심 포인트를 추렸습니다.')}
              </p>

              <div className="mb-[14px] mt-[10px] h-px w-[311px] bg-[#D8D8D8]" />

              <div className="flex w-[311px] flex-col gap-[12px]">
                {guideLines.map((line, index) => (
                  <p
                    key={`${index}-${line}`}
                    className="font-['Pretendard'] text-[12px] font-[500] leading-[18px] tracking-[0px] text-[#494949]"
                  >
                    {index + 1}. {line}
                  </p>
                ))}
              </div>

              <div className="w-[311px] pt-[12px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#5E5E5E]">
                <p>처음에는 작은 시도들이 쌓이면서 변화가 생기기 때문에</p>
                <p>하루에 한 가지씩만 꾸준히 시도해도 충분합니다.</p>
              </div>
            </div>
          </section>

          <section className="bg-white px-[16px] pb-[20px] pt-[10px]">
            <SectionBlockTitle title="실패 패턴" description="유사 카테고리 내 실패 원인 별 비중 그래프 데이터입니다." />
            <div className="pt-[10px]">
              <div className="rounded-[10px] bg-[#F8F8F8] px-[16px] py-[16px]">
                <div className="flex flex-col gap-[16px]">
                  {patternRows.map((item) => (
                    <PatternRow key={item.label} label={item.label} percent={item.percent} />
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white px-[16px] py-[12px]">
            <div className="flex flex-col items-center">
              <div className="flex w-full flex-col items-center gap-[12px] rounded-[10px] border border-[#EEEEEE] bg-white px-[16px] py-[16px]">
              <div className="flex w-[311px] flex-col gap-[4px]">
                <p className="font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-[#131416]">유사 사례</p>
                <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949]">
                  이 사례와 비슷한 경험을 가진 다른 사례들을 추천해드립니다.
                </p>
              </div>

              <div className="flex w-[311px] flex-col gap-[4px]">
                <div className="pb-[4px]">
                  <p className="font-['Pretendard'] text-[14px] font-[600] leading-[16.8px] tracking-[0px] text-[#5A876E]">실패 사례</p>
                </div>
                {similarCases.length ? (
                  <div className="flex flex-col gap-[4px]">
                    {similarCases.slice(0, 1).map((item) => {
                      const similarExperience = item.similarExperience;

                      return (
                        <SimilarCaseCard
                          key={similarExperience.id}
                          title={sanitizeText(similarExperience.title, '제목')}
                          summary={sanitizeText(stripImageMarkdown(similarExperience.content), '본문 텍스트 미리보기')}
                          tags={buildTopTags(similarExperience).slice(1)}
                          success={false}
                          likeCount={similarExperience.likeCount}
                          bookmarkCount={similarExperience.bookmarkCount ?? 0}
                          viewCount={similarExperience.viewCount}
                          author={sanitizeText(similarExperience.author.nickname, '닉네임')}
                          createdAt={formatDate(similarExperience.createdAt)}
                          similarity={Math.round(item.similarityScore * 100)}
                          onClick={() => navigate(`/experiences/${similarExperience.id}`)}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-[4px] bg-[#F8F8F8] px-[14px] py-[10px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#8A8A8A]">
                    아직 연결된 유사 실패 사례가 없어요.
                  </div>
                )}
              </div>

              <div className="flex w-[311px] flex-col gap-[4px]">
                <div className="pb-[4px]">
                  <p className="font-['Pretendard'] text-[14px] font-[600] leading-[16.8px] tracking-[0px] text-[#5A876E]">성공 사례</p>
                </div>
                {successCases.length ? (
                  <div className="flex flex-col gap-[4px]">
                    {successCases.slice(0, 1).map((item) => (
                      <SimilarCaseCard
                        key={item.id}
                        title={sanitizeText(item.title, '제목')}
                        summary={sanitizeText(stripImageMarkdown(item.content), '본문 텍스트 미리보기')}
                        tags={buildTopTags(item).slice(1)}
                        success
                        likeCount={item.likeCount}
                        bookmarkCount={item.bookmarkCount ?? 0}
                        viewCount={item.viewCount}
                        author={sanitizeText(item.author.nickname, '닉네임')}
                        createdAt={formatDate(item.createdAt)}
                        onClick={() => navigate(`/experiences/${item.id}`)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[4px] bg-[#F8F8F8] px-[14px] py-[10px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#8A8A8A]">
                    아직 등록된 성공 사례가 없어요.
                  </div>
                )}
              </div>

              <div className="flex justify-center pt-[4px]">
                <button
                  type="button"
                  onClick={() => navigate('/explore')}
                  className="font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] tracking-[0px] text-[#5D5D5D]"
                >
                  모든 사례 보기
                </button>
              </div>
              </div>
            </div>
          </section>
        </main>

        <div className="pointer-events-none fixed bottom-0 left-1/2 z-[19] h-[152px] w-full max-w-[375px] -translate-x-1/2 bg-white" />
        <div className="pointer-events-none fixed bottom-[84px] left-1/2 z-20 flex h-[68px] w-full max-w-[375px] -translate-x-1/2 items-center justify-between px-[24px] py-[16px]">
          <div className="relative">
            <button
              type="button"
              onClick={moveToGuide}
              className="pointer-events-auto inline-flex h-[36px] w-[208px] shrink-0 items-center justify-center gap-[4px] rounded-[999px] bg-[#375E49] px-[12px] text-white"
            >
              <img
                src={guideIcon}
                alt=""
                className="h-[16px] w-[16px] shrink-0"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
              <span className="whitespace-nowrap font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] tracking-[0px]">
                해당 부업 가이드 바로가기
              </span>
              <ChevronRight size={16} strokeWidth={2.2} className="shrink-0" />
            </button>
          </div>

          <div className="pointer-events-auto relative h-[36px] w-[36px] shrink-0">
            {fabExpanded ? (
              <div className="pointer-events-auto absolute right-[-10px] top-[-96px] flex w-max flex-col items-start gap-[12px] rounded-[10px] bg-white px-[10px] py-[12px] shadow-[0_0_4px_rgba(0,0,0,0.15)]">
                <button
                  type="button"
                  onClick={() => navigate('/coming-soon')}
                  className="flex items-center gap-[8px] whitespace-nowrap"
                  aria-label="AI 챗봇 열기"
                >
                  <img src={subtractIcon} alt="" className="h-[17px] w-[17px] shrink-0" />
                  <span className="font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] text-black">AI 챗봇</span>
                </button>
                <button
                  type="button"
                  onClick={handleCreateClick}
                  className="flex items-center gap-[8px] whitespace-nowrap"
                  aria-label="경험 작성 열기"
                >
                  <img src={editIcon} alt="" className="h-[17px] w-[17px]" />
                  <span className="font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] text-black">경험 작성</span>
                </button>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setFabExpanded((current) => !current)}
              className={`pointer-events-auto absolute right-0 top-0 flex h-[36px] w-[36px] items-center justify-center rounded-full ${
                fabExpanded ? 'bg-[#A8D3BD]' : 'bg-[#5A876E]'
              }`}
              aria-label={fabExpanded ? '경험 작성 닫기' : '경험 작성'}
            >
              {fabExpanded ? (
                <X size={20} strokeWidth={2.2} color="#FFFFFF" />
              ) : (
                <img src={plusIcon} alt="" className="h-[20px] w-[20px]" />
              )}
            </button>
          </div>
        </div>

        <BottomNav showFab={false} />
      </div>
    </div>
  );
}


