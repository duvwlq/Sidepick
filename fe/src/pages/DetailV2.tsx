import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import HeaderBookmarkIcon from '../components/common/HeaderBookmarkIcon';
import { ErrorState, LoadingState } from '../components/common/Skeleton';
import { useToast } from '../components/common/useToast';
import BottomNav from '../components/layout/BottomNav';
import batteryFrameIcon from '../assets/auth-figma/battery-frame.svg';
import cellularConnectionIcon from '../assets/auth-figma/cellular-connection.svg';
import wifiIcon from '../assets/auth-figma/wifi.svg';
import accountCircleIcon from '../assets/detail-v2-zip-icons/사례 탐색 v.2 - 검색어를 치고 들어온 경우에만 유사도 표시/Account circle.svg';
import arrowLeftIcon from '../assets/detail-v2-zip-icons/사례 탐색 v.2 - 검색어를 치고 들어온 경우에만 유사도 표시/Arrow left.svg';
import bookmarkIcon from '../assets/detail-v2-zip-icons/사례 탐색 v.2 - 검색어를 치고 들어온 경우에만 유사도 표시/Bookmark.svg';
import chevronIcon from '../assets/detail-v2-zip-icons/사례 탐색 v.2 - 검색어를 치고 들어온 경우에만 유사도 표시/Chevron.svg';
import clockIcon from '../assets/detail-v2-zip-icons/사례 탐색 v.2 - 검색어를 치고 들어온 경우에만 유사도 표시/Clock.svg';
import dollarSignIcon from '../assets/detail-v2-zip-icons/사례 탐색 v.2 - 검색어를 치고 들어온 경우에만 유사도 표시/Dollar sign.svg';
import guideSparkIcon from '../assets/detail-v2-zip-icons/사례 탐색 v.2 - 검색어를 치고 들어온 경우에만 유사도 표시/Group 2087331933.svg';
import heartIcon from '../assets/detail-v2-zip-icons/사례 탐색 v.2 - 검색어를 치고 들어온 경우에만 유사도 표시/Heart.svg';
import helpIcon from '../assets/detail-v2-zip-icons/사례 탐색 v.2 - 검색어를 치고 들어온 경우에만 유사도 표시/NavigationBar/live_help_20dp_1F1F1F_FILL0_wght400_GRAD0_opsz20 1.svg';
import moreVerticalIcon from '../assets/detail-v2-zip-icons/사례 탐색 v.2 - 검색어를 치고 들어온 경우에만 유사도 표시/More vertical.svg';
import plusIcon from '../assets/detail-v2-zip-icons/사례 탐색 v.2 - 검색어를 치고 들어온 경우에만 유사도 표시/Plus.svg';
import uploadIcon from '../assets/detail-v2-zip-icons/사례 탐색 v.2 - 검색어를 치고 들어온 경우에만 유사도 표시/upload.svg';
import type { Experience } from '../lib/api';
import { bookmarkExperience, getBookmarkStatus, getExperience, getExperienceShare, getRelatedSuccessCases, unbookmarkExperience } from '../lib/api';
import { publishBookmarkSync } from '../lib/bookmark-sync';
import { extractExperienceImageUrls } from '../lib/experience-images';
import { resolveErrorMessage } from '../lib/resolve-error-message';
import { getAccessToken } from '../lib/session';

type DetailMetric = {
  icon: 'duration' | 'money';
  label: string;
  value: string;
};

type RelatedCardModel = {
  id: number;
  statusLabel: '실패' | '성공';
  similarity: number;
  thumbnailUrl?: string | null;
  category: string;
  keywords: string[];
  title: string;
  preview: string;
  nickname: string;
  createdAt: string;
  viewCount: number;
  likeCount: number;
  bookmarkCount: number;
};

type DetailViewModel = {
  authorName: string;
  createdAt: string;
  categoryName: string;
  title: string;
  contentText: string;
  imageUrls: string[];
  topTags: string[];
  metrics: DetailMetric[];
  issueChips: string[];
  guideSummary: string;
  guideLines: string[];
  guideClosing: string;
  patternRows: Array<{ label: string; percent: number }>;
  failureCard: RelatedCardModel;
  successCards: RelatedCardModel[];
};

const DETAIL_FIXTURE_VIEW_MODEL: DetailViewModel = {
  authorName: 'qa324484',
  createdAt: '2026.06.12',
  categoryName: '온라인 판매·이커머스',
  title: '온라인 판매·이커머스 경험',
  contentText:
    '쿠팡 위탁판매를 부업으로 시작했는데 초기 고객 유입이 거의 없어서 광고와 상품 구성을 여러 번 바꿨습니다. 본업과 병행하다 보니 운영 시간이 부족했고 한 달 정도 진행한 뒤 중단했습니다.',
  imageUrls: [],
  topTags: ['온라인 판매·이커머스', '온라인 판매·이커머스', '고객 확보(마케팅)', '기타'],
  metrics: [
    { icon: 'duration', label: '진행 기간', value: '1개월' },
    { icon: 'money', label: '투자금', value: '100,000원' },
    { icon: 'money', label: '수익', value: '10,000원' },
  ],
  issueChips: ['초기유입부족', '광고전략미흡', '운영시간부족', '고객 확보(마케팅)'],
  guideSummary: '쿠팡 위탁판매 초기 고객 유입 실패로 1개월 만에 중단',
  guideLines: [
    '첫 달 목표를 매출보다 유입 30명 만들기로 좁혀 보세요. 상품 사진과 상세페이지의 첫 문장부터 먼저 다듬는 편이 낫습니다.',
    '유사 상품 리뷰를 읽으며 사람들이 불편해하는 지점을 메모하고, 그 해결 문장을 상세페이지 첫 문단에 반영해 보세요.',
    '하루 한 번이라도 광고와 검색 유입 키워드를 체크하면서 상품명과 썸네일 문구를 짧게 반복 보정하는 편이 좋습니다.',
  ],
  guideClosing: '처음에는 작은 시도들이 쌓이면서 변화가 생기기 때문에 하루에 한 가지씩만 꾸준히 시도해도 충분합니다.',
  patternRows: [
    { label: '마케팅부족', percent: 50 },
    { label: '초기유입부족', percent: 30 },
    { label: '광고전략미흡', percent: 20 },
  ],
  failureCard: {
    id: 10111,
    statusLabel: '실패',
    similarity: 99,
    thumbnailUrl: null,
    category: '온라인 판매·이커머스',
    keywords: ['고객확보', '마케팅부족'],
    title: '온라인 판매·이커머스 경험',
    preview: '쿠팡 위탁판매를 부업으로 시작했는데 초기 고객 유입이 거의 없어서 광고와 상품 구성을 계속 바꿨습니다.',
    nickname: 'qa324484',
    createdAt: '2026.06.12',
    viewCount: 36,
    likeCount: 0,
    bookmarkCount: 0,
  },
  successCards: [
    {
      id: 10001,
      statusLabel: '성공',
      similarity: 99,
      thumbnailUrl: null,
      category: '온라인 판매·이커머스',
      keywords: ['키워드', '키워드'],
      title: '직장인 부업 추천',
      preview: '40번째 답변 ej**** 지존 본인 입력 포함 정보 상세 안내를 볼 수 있습니다.',
      nickname: 'sidepick-import',
      createdAt: '2026.04.01',
      viewCount: 4,
      likeCount: 0,
      bookmarkCount: 0,
    },
  ],
};

function sanitizeText(value: string | null | undefined, fallback: string) {
  const normalized = (value ?? '').replace(/\s+/g, ' ').trim();
  return normalized || fallback;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

function formatMoney(value: number | null) {
  if (value == null) {
    return '0원';
  }
  return `${value.toLocaleString()}원`;
}

function formatDuration(months: number | null) {
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

function stripImageMarkdown(content: string) {
  return content.replace(/!\[[^\]]*]\(([^)]+)\)/g, '').replace(/\s+/g, ' ').trim();
}

function clampText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength).trimEnd()}...` : value;
}

function buildIssueChips(experience: Experience) {
  const source = [
    ...(experience.analysis?.keywords ?? []),
    ...experience.failureReasons,
    ...experience.difficulties,
  ]
    .map((item) => sanitizeText(item, ''))
    .filter(Boolean);

  return Array.from(new Set(source)).slice(0, 4);
}

function buildPatternRows(experience: Experience) {
  const labels = Array.from(
    new Set(
      [
        sanitizeText(experience.analysis?.failureCategory, ''),
        ...(experience.analysis?.extractedPatterns ?? []).map((item) => sanitizeText(item, '')),
        ...experience.failureReasons.map((item) => sanitizeText(item, '')),
      ].filter(Boolean),
    ),
  ).slice(0, 3);

  const fallback = ['마케팅부족', '초기유입부족', '광고전략미흡'];
  const safeLabels = labels.length ? labels : fallback;
  const percents = safeLabels.length === 1 ? [100] : safeLabels.length === 2 ? [60, 40] : [50, 30, 20];

  return safeLabels.map((label, index) => ({ label, percent: percents[index] ?? 0 }));
}

function buildGuideLines(experience: Experience) {
  const lines = [
    ...(experience.analysis?.successFactors ?? []),
    ...(experience.analysis?.riskFactors ?? []),
  ]
    .map((item) => sanitizeText(item, ''))
    .filter(Boolean)
    .slice(0, 3);

  return lines.length ? lines : DETAIL_FIXTURE_VIEW_MODEL.guideLines;
}

function buildTopTags(experience: Experience) {
  const tags = [
    sanitizeText(experience.businessType, '온라인 판매·이커머스'),
    sanitizeText(experience.category?.name, '카테고리'),
    sanitizeText(experience.analysis?.keywords?.[0], '키워드'),
    sanitizeText(experience.analysis?.keywords?.[1], '키워드'),
  ];

  return tags.slice(0, 4);
}

function buildRelatedCardModel(experience: Experience, statusLabel: '실패' | '성공'): RelatedCardModel {
  const imageUrls = extractExperienceImageUrls(experience);
  const keywords = [
    sanitizeText(experience.analysis?.keywords?.[0], '키워드'),
    sanitizeText(experience.analysis?.keywords?.[1], '키워드'),
  ];

  return {
    id: experience.id,
    statusLabel,
    similarity: 99,
    thumbnailUrl: imageUrls[0] ?? null,
    category: sanitizeText(experience.category?.name, '카테고리'),
    keywords,
    title: clampText(sanitizeText(experience.title, '제목'), 28),
    preview: clampText(sanitizeText(stripImageMarkdown(experience.content), '본문 텍스트 미리보기'), 60),
    nickname: sanitizeText(experience.author?.nickname, '닉네임'),
    createdAt: formatDate(experience.createdAt),
    viewCount: experience.viewCount,
    likeCount: experience.likeCount,
    bookmarkCount: experience.bookmarkCount ?? 0,
  };
}

function buildDetailViewModel(experience: Experience, successCases: Experience[]): DetailViewModel {
  const imageUrls = extractExperienceImageUrls(experience);
  const guideLines = buildGuideLines(experience);
  const summary = sanitizeText(guideLines[0], DETAIL_FIXTURE_VIEW_MODEL.guideSummary);

  return {
    authorName: sanitizeText(experience.author?.nickname, '닉네임'),
    createdAt: formatDate(experience.createdAt),
    categoryName: sanitizeText(experience.category?.name, '온라인 판매·이커머스'),
    title: sanitizeText(experience.title, '제목'),
    contentText: sanitizeText(stripImageMarkdown(experience.content), DETAIL_FIXTURE_VIEW_MODEL.contentText),
    imageUrls,
    topTags: buildTopTags(experience),
    metrics: [
      { icon: 'duration', label: '진행 기간', value: formatDuration(experience.durationMonths ?? null) },
      { icon: 'money', label: '투자금', value: formatMoney(experience.investmentAmount ?? null) },
      { icon: 'money', label: '수익', value: formatMoney(experience.monthlyRevenue ?? null) },
    ],
    issueChips: buildIssueChips(experience).length ? buildIssueChips(experience) : DETAIL_FIXTURE_VIEW_MODEL.issueChips,
    guideSummary: summary,
    guideLines,
    guideClosing: DETAIL_FIXTURE_VIEW_MODEL.guideClosing,
    patternRows: buildPatternRows(experience),
    failureCard: buildRelatedCardModel(experience, '실패'),
    successCards: successCases.slice(0, 1).map((item) => buildRelatedCardModel(item, '성공')),
  };
}

function StatusBar() {
  return (
    <div className="flex h-[44px] items-center justify-between px-[24px] pt-[6px]">
      <span className="font-['Pretendard'] text-[18px] font-[600] leading-[21.6px] text-black">9:41</span>
      <div className="flex items-center gap-[4px]">
        <img src={cellularConnectionIcon} alt="" className="h-[12px] w-[19px]" />
        <img src={wifiIcon} alt="" className="h-[12px] w-[17px]" />
        <img src={batteryFrameIcon} alt="" className="h-[13px] w-[28px]" />
      </div>
    </div>
  );
}

function MetricColumn({ metric }: { metric: DetailMetric }) {
  const iconSrc = metric.icon === 'duration' ? clockIcon : dollarSignIcon;
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-[4px]">
      <img src={iconSrc} alt="" className="h-[16px] w-[16px]" />
      <p className="font-['Pretendard'] text-[14px] font-[600] leading-[16.8px] text-[#131416]">{metric.value}</p>
      <p className="font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] text-[#8A8A8A]">{metric.label}</p>
    </div>
  );
}

function IssueChip({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center rounded-[999px] border border-[#5A876E] px-[14px] py-[8px]">
      <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#5A876E]"># {label}</span>
    </div>
  );
}

function PatternRow({ label, percent }: { label: string; percent: number }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <div className="flex items-center justify-between">
        <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#494949]">{label}</span>
        <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#5E5E5E]">{percent}%</span>
      </div>
      <div className="h-[6px] w-full rounded-[999px] bg-[#D8D8D8]">
        <div className="h-[6px] rounded-[999px] bg-gradient-to-r from-[#92BFA6] to-[#5A876E]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function SimilarCard({ card, onClick }: { card: RelatedCardModel; onClick?: () => void }) {
  const isSuccess = card.statusLabel === '성공';
  const hasThumbnail = Boolean(card.thumbnailUrl);

  return (
    <button type="button" onClick={onClick} className="flex min-h-[146px] w-full flex-col rounded-[4px] bg-[#F8F8F8] px-[16px] py-[20px] text-left">
      <div className="flex flex-col gap-[8px]">
        <div className="flex items-center justify-between gap-[8px]">
          <div className="flex min-w-0 items-start gap-[4px] overflow-hidden whitespace-nowrap">
            <span className={`inline-flex h-[16px] shrink-0 items-center rounded-[4px] px-[4px] text-[10px] font-[500] leading-[12px] text-white ${isSuccess ? 'bg-[#5A876E]' : 'bg-[#C06D43]'}`}>
              {card.statusLabel}
            </span>
            <span className="inline-flex h-[16px] max-w-[84px] shrink-0 items-center overflow-hidden text-ellipsis whitespace-nowrap rounded-[4px] bg-[#CBE5D8] px-[4px] text-[10px] font-[500] leading-[12px] text-[#5A876E]">
              {card.category}
            </span>
            {card.keywords.map((keyword, index) => (
              <span key={`${keyword}-${index}`} className="inline-flex h-[16px] max-w-[52px] shrink-0 items-center overflow-hidden text-ellipsis whitespace-nowrap rounded-[4px] bg-[#E6E6E6] px-[4px] text-[10px] font-[500] leading-[12px] text-[#8A8A8A]">
                {keyword}
              </span>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-[4px]">
            <div className="h-[4px] w-[30px] rounded-[999px] bg-[#EEEEEE]">
              <div className={`h-[4px] rounded-[999px] ${isSuccess ? 'bg-[#4CAF50]' : 'bg-[#FFC13B]'}`} style={{ width: '16px' }} />
            </div>
            <span className="font-['Pretendard'] text-[12px] font-[600] leading-[16.8px] text-[#8A8A8A]">{card.similarity}%</span>
          </div>
        </div>

        <div className="flex gap-[8px]">
          {hasThumbnail ? (
            <div className="h-[60px] w-[80px] shrink-0 overflow-hidden rounded-[4px] bg-[#D8D8D8]">
              <img src={card.thumbnailUrl ?? ''} alt="" className="h-full w-full object-cover" loading="lazy" />
            </div>
          ) : null}
          <div className="flex h-[60px] min-w-0 flex-1 flex-col gap-[4px] overflow-hidden">
            <p className="line-clamp-1 font-['Pretendard'] text-[14px] font-[600] leading-[16.8px] text-[#131416]">{card.title}</p>
            <p className="line-clamp-2 font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#494949]">{card.preview}</p>
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between pt-[8px]">
        <div className="flex items-start gap-[4px] font-['Pretendard'] text-[12px] font-[300] leading-[16.8px] text-[#8A8A8A]">
          <span>{card.nickname}</span>
          <span>•</span>
          <span>{card.createdAt}</span>
          <span>•</span>
          <div className="flex items-center gap-[2px]">
            <span>조회</span>
            <span>{card.viewCount}</span>
          </div>
        </div>
        <div className="flex items-center gap-[4px]">
          <div className="flex items-center gap-[2px]">
            <div className="flex h-[20px] w-[20px] items-center justify-center">
              <img src={heartIcon} alt="" className="block h-[14px] w-[14px] shrink-0" />
            </div>
            <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#8A8A8A]">{card.likeCount}</span>
          </div>
          <div className="flex items-center gap-[2px]">
            <div className="flex h-[24px] w-[24px] items-center justify-center">
              <img src={bookmarkIcon} alt="" className="block h-[14px] w-[14px] shrink-0 translate-y-[0.5px]" />
            </div>
            <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#8A8A8A]">{card.bookmarkCount}</span>
          </div>
        </div>
      </div>
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
  const [successCases, setSuccessCases] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fabExpanded, setFabExpanded] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    if (isFixtureMode) {
      setExperience(null);
      setSuccessCases([]);
      setLoading(false);
      setError('');
      return;
    }

    if (!experienceId || !Number.isFinite(experienceId)) {
      setLoading(false);
      setError('유효한 사례를 찾을 수 없습니다.');
      return;
    }

    const targetExperienceId = experienceId;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const detail = await getExperience(targetExperienceId);
        const related = await getRelatedSuccessCases(targetExperienceId, 2).catch(() => []);
        if (cancelled) {
          return;
        }
        setExperience(detail);
        setSuccessCases(related);

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

  async function handleBookmarkToggle() {
    if (isFixtureMode || !experience) {
      return;
    }
    if (!accessToken) {
      navigate(`/auth?next=${encodeURIComponent(`/experiences/${experience.id}`)}&reason=${encodeURIComponent('북마크는 로그인이 필요한 서비스입니다.')}`);
      return;
    }

    try {
      const payload = bookmarked ? await unbookmarkExperience(accessToken, experience.id) : await bookmarkExperience(accessToken, experience.id);
      setBookmarked(payload.bookmarked);
      setExperience((current) => (current ? { ...current, bookmarkCount: payload.bookmarkCount } : current));
      publishBookmarkSync({
        experienceId: experience.id,
        bookmarked: payload.bookmarked,
        bookmarkCount: payload.bookmarkCount,
      });
      showToast(payload.bookmarked ? '북마크에 저장했어요.' : '북마크를 해제했어요.');
    } catch (bookmarkError) {
      showToast(resolveErrorMessage(bookmarkError, '북마크 처리에 실패했습니다.'));
    }
  }

  async function handleShare() {
    if (isFixtureMode || !experience) {
      return;
    }
    try {
      const payload = await getExperienceShare(experience.id);
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ title: payload.title, text: payload.description, url: payload.shareUrl });
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
      navigate(`/auth?next=${encodeURIComponent('/create')}&reason=${encodeURIComponent('경험 작성은 로그인이 필요한 서비스입니다.')}`);
      return;
    }
    navigate('/create');
  }

  const viewModel = useMemo(() => {
    if (isFixtureMode || !experience) {
      return DETAIL_FIXTURE_VIEW_MODEL;
    }
    return buildDetailViewModel(experience, successCases);
  }, [experience, isFixtureMode, successCases]);

  if (loading && !isFixtureMode) {
    return (
      <div className="mx-auto min-h-screen w-full max-w-[375px] bg-white px-[16px] py-[40px]">
        <LoadingState message="사례 상세를 불러오는 중입니다." />
      </div>
    );
  }

  if ((error || !viewModel) && !isFixtureMode) {
    return (
      <div className="mx-auto min-h-screen w-full max-w-[375px] bg-white px-[16px] py-[40px]">
        <ErrorState message={error || '사례를 불러오지 못했습니다.'} />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-[375px] bg-white">
      <div className="relative min-h-screen bg-white">
        <div className="sticky top-0 z-30 bg-white">
          <StatusBar />
          <div className="flex h-[64px] items-center justify-between bg-white px-[16px] py-[20px]">
            <button type="button" onClick={() => navigate(-1)} className="flex h-[24px] w-[24px] items-center justify-center" aria-label="뒤로가기">
              <img src={arrowLeftIcon} alt="" className="h-[24px] w-[24px]" />
            </button>
            <p className="font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] text-black">사례 상세</p>
            <button type="button" onClick={handleBookmarkToggle} className="flex h-[24px] w-[24px] items-center justify-center" aria-label={bookmarked ? '북마크 해제' : '북마크 저장'}>
              <HeaderBookmarkIcon active={bookmarked} className="h-[24px] w-[24px]" />
            </button>
          </div>
        </div>

        <main className="flex flex-col gap-[12px] pb-[140px]">
          <section className="bg-white px-[16px] py-[12px]">
            <div className="flex flex-col gap-[24px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-[8px]">
                  <div className="flex h-[40px] w-[40px] items-center justify-center">
                    <img src={accountCircleIcon} alt="" className="h-[40px] w-[40px]" />
                  </div>
                  <div className="flex flex-col gap-[2px]">
                    <div className="flex items-center gap-[4px]">
                      <span className="font-['Pretendard'] text-[12px] font-[600] leading-[16.8px] text-[#131416]">{viewModel.authorName}</span>
                      <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#BABABA]">{viewModel.createdAt}</span>
                    </div>
                    <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#494949]">{viewModel.categoryName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-[4px]">
                  <button type="button" onClick={handleShare} className="flex h-[20px] w-[20px] items-center justify-center" aria-label="공유">
                    <img src={uploadIcon} alt="" className="h-[20px] w-[20px]" />
                  </button>
                  <button type="button" onClick={() => showToast('추가 메뉴는 준비 중입니다.')} className="flex h-[20px] w-[20px] items-center justify-center" aria-label="더보기">
                    <img src={moreVerticalIcon} alt="" className="h-[20px] w-[20px]" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-[16px] overflow-hidden">
                <h1 className="w-full font-['Pretendard'] text-[16px] font-[500] leading-[19.2px] text-[#131416]">{viewModel.title}</h1>
                <div className="line-clamp-4 w-full overflow-hidden whitespace-pre-wrap font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] text-[#494949]">
                  {viewModel.contentText}
                </div>
              </div>

              <div className="flex w-full items-center gap-[10px] overflow-hidden pr-[16px]">
                {viewModel.imageUrls.length ? (
                  viewModel.imageUrls.slice(0, 2).map((imageUrl, index) => (
                    <div key={`${imageUrl}-${index}`} className="h-[300px] w-[300px] shrink-0 overflow-hidden rounded-[4px]">
                      <img src={imageUrl} alt="" className="h-full w-full rounded-[4px] object-cover" loading="lazy" />
                    </div>
                  ))
                ) : (
                  <>
                    <div className="h-[300px] w-[300px] shrink-0 rounded-[4px] bg-[#F3F3F3]" />
                    <div className="h-[300px] w-[300px] shrink-0 rounded-[4px] bg-[#F3F3F3]" />
                  </>
                )}
              </div>

              <div className="flex w-full flex-wrap items-center gap-[6px]">
                {viewModel.topTags.map((tag, index) => (
                  <span
                    key={`${tag}-${index}`}
                    className={`inline-flex h-[16px] items-center rounded-[4px] px-[4px] text-[10px] font-[500] leading-[12px] ${
                      index === 0 ? 'bg-[#C06D43] text-white' : index === 1 ? 'bg-[#5A876E] text-white' : 'bg-[#E6E6E6] text-[#8A8A8A]'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex w-full items-center gap-[8px]">
                <MetricColumn metric={viewModel.metrics[0]} />
                <span className="font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] text-[#D8D8D8]">|</span>
                <MetricColumn metric={viewModel.metrics[1]} />
                <span className="font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] text-[#D8D8D8]">|</span>
                <MetricColumn metric={viewModel.metrics[2]} />
              </div>
            </div>
          </section>

          <section className="bg-white px-[16px] py-[12px]">
            <div className="flex flex-col gap-[4px]">
              <p className="font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] text-[#131416]">핵심 이슈</p>
              <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#494949]">해당 사례에서 찾아볼 수 있는 핵심 이슈입니다.</p>
            </div>
            <div className="pt-[12px]">
              <div className="flex w-full flex-wrap items-start gap-[6px]">
                {viewModel.issueChips.map((chip) => (
                  <IssueChip key={chip} label={chip} />
                ))}
              </div>
            </div>
          </section>

          <section className="px-[16px] py-[12px]">
            <div className="w-full rounded-[10px] border border-[#EEEEEE] border-b-[2px] border-b-[#5A876E] bg-white px-[16px] py-[16px] shadow-[0_0_5px_rgba(0,0,0,0.15)]">
              <div className="flex w-full items-center gap-[4px]">
                <div className="flex h-[20px] w-[20px] items-center justify-center rounded-[4px] bg-gradient-to-b from-[#92BFA6] to-[#5A876E] p-[4px]">
                  <img src={guideSparkIcon} alt="" className="h-[12px] w-[12px]" />
                </div>
                <p className="font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] text-[#5A876E]">AI 가이드</p>
              </div>
              <p className="pt-[12px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#5E5E5E]">{viewModel.guideSummary}</p>
              <div className="my-[12px] h-px w-full bg-[#D8D8D8]" />
              <div className="flex flex-col gap-[10px]">
                {viewModel.guideLines.map((line, index) => (
                  <p key={`${index}-${line.slice(0, 8)}`} className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#494949]">
                    {line}
                  </p>
                ))}
              </div>
              <div className="my-[12px] h-px w-full bg-[#D8D8D8]" />
              <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#5E5E5E]">{viewModel.guideClosing}</p>
            </div>
          </section>

          <section className="bg-white px-[16px] py-[12px]">
            <div className="flex flex-col gap-[4px]">
              <p className="font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] text-[#131416]">실패 패턴</p>
              <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#494949]">유사 카테고리 내 실패 원인 별 비중 그래프 데이터입니다.</p>
            </div>
            <div className="pt-[12px]">
              <div className="flex w-full flex-col gap-[16px] rounded-[4px] bg-white px-[16px] py-[16px]">
                {viewModel.patternRows.map((row) => (
                  <PatternRow key={`${row.label}-${row.percent}`} label={row.label} percent={row.percent} />
                ))}
              </div>
            </div>
          </section>

          <section className="bg-white px-[16px] py-[12px]">
            <div className="w-full rounded-[10px] border border-[#EEEEEE] bg-white px-[16px] py-[16px]">
              <div className="flex w-full flex-col gap-[4px]">
                <div className="flex items-center gap-[4px]">
                  <p className="font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] text-[#131416]">유사 사례</p>
                  <span className="inline-flex h-[14px] w-[8px] items-center justify-center" aria-hidden="true">
                    <svg width="4" height="12" viewBox="0 0 4 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="2" cy="2" r="0.75" fill="#8A8A8A" />
                      <circle cx="2" cy="6" r="0.75" fill="#8A8A8A" />
                      <circle cx="2" cy="10" r="0.75" fill="#8A8A8A" />
                    </svg>
                  </span>
                </div>
                <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#494949]">이 사례와 비슷한 경험을 가진 다른 사례들을 추천해드립니다.</p>
              </div>

              <div className="pt-[12px]">
                <p className="pb-[4px] font-['Pretendard'] text-[14px] font-[600] leading-[16.8px] text-[#5A876E]">실패 사례</p>
                <SimilarCard card={viewModel.failureCard} onClick={() => navigate(`/experiences/${viewModel.failureCard.id}`)} />
              </div>

              <div className="pt-[12px]">
                <p className="pb-[4px] font-['Pretendard'] text-[14px] font-[600] leading-[16.8px] text-[#5A876E]">성공 사례</p>
                {viewModel.successCards.length ? (
                  viewModel.successCards.map((card) => (
                    <SimilarCard key={card.id} card={card} onClick={() => navigate(`/experiences/${card.id}`)} />
                  ))
                ) : (
                  <div className="rounded-[4px] bg-[#F8F8F8] px-[16px] py-[20px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#8A8A8A]">
                    아직 등록된 성공 사례가 없습니다.
                  </div>
                )}
              </div>

              <div className="flex justify-center pt-[12px]">
                <button type="button" onClick={() => navigate('/explore')} className="font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] text-[#5D5D5D] underline underline-offset-2">
                  모든 사례 보기
                </button>
              </div>
            </div>
          </section>
        </main>

        <div className="pointer-events-none fixed bottom-0 left-1/2 z-[19] h-[152px] w-full max-w-[375px] -translate-x-1/2 bg-white" />
        <div className="pointer-events-none fixed bottom-[84px] left-1/2 z-20 flex h-[68px] w-full max-w-[375px] -translate-x-1/2 items-center justify-between px-[24px] py-[16px]">
          <button type="button" onClick={moveToGuide} className="pointer-events-auto inline-flex h-[36px] w-[208px] items-center justify-center gap-[4px] rounded-[999px] bg-[#375E49] px-[12px]">
            <img src={helpIcon} alt="" className="h-[16px] w-[16px] shrink-0 brightness-0 invert" />
            <span className="font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] text-[#F8F8F8]">해당 부업 가이드 바로가기</span>
            <img src={chevronIcon} alt="" className="h-[16px] w-[16px] shrink-0 brightness-0 invert" />
          </button>

          <div className="pointer-events-auto relative h-[36px] w-[36px]">
            <button
              type="button"
              onClick={() => setFabExpanded((current) => !current)}
              className={`absolute right-0 top-0 flex h-[36px] w-[36px] items-center justify-center rounded-full ${
                fabExpanded ? 'bg-[#A8D3BD]' : 'bg-[#5A876E]'
              }`}
              aria-label={fabExpanded ? '경험 작성 닫기' : '경험 작성'}
            >
              <img src={plusIcon} alt="" className={`h-[20px] w-[20px] ${fabExpanded ? 'brightness-0 invert' : ''}`} />
            </button>
          </div>
        </div>

        <BottomNav active="explore" showFab={false} onCreateClick={handleCreateClick} />
      </div>
    </div>
  );
}
