import { useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  ChevronLeft,
  Heart,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import amountIcon from '../../assets/images/amount.svg';
import createIcon from '../../assets/images/plus-circle.svg';
import durationIcon from '../../assets/images/duration.svg';
import homeIcon from '../../assets/images/home.svg';
import exploreIcon from '../../assets/images/search.svg';
import userIcon from '../../assets/images/user.svg';
import {
  ApiError,
  createAnalysis,
  deleteExperience,
  getExperience,
  getReport,
  type AnalysisReport,
  type AnalysisReportSimilarCase,
  type Experience,
} from '../../lib/api';
import { ERROR_CODES } from '../../lib/error-codes';
import { resolveErrorMessage } from '../../lib/resolve-error-message';
import { getAccessToken, getStoredUser } from '../../lib/session';

type Props = {
  experienceId: number | null;
};

type PatternItem = {
  label: string;
  percent: number;
};

const DEV_FALLBACK_EXPERIENCE: Experience = {
  id: 1,
  author: {
    id: 1,
    email: 'goorm@sidepick.local',
    nickname: '닉네임',
    ageGroup: '30s',
    profileImage: null,
    authProvider: 'LOCAL',
    emailVerified: true,
    profileCompleted: true,
    createdAt: '2026-04-22T00:00:00',
  },
  category: {
    id: 1,
    name: '카테고리',
    description: '',
    icon: '',
    color: '#3B82F6',
  },
  title: '부업 실패 경험 제목',
  content:
    '온라인 쇼핑몰을 운영하면서 겪은 경험입니다.\n\n처음에는 틈새 시장을 공략한다는 생각으로 특정 카테고리의 제품을 판매하는 쇼핑몰을 시작했습니다. 초기 투자로 재고 구매와 마케팅 비용 등 약 300만원을 사용했습니다.\n\n하지만 막상 시작해보니 이미 해당 분야에는 많은 경쟁자들이 있었고, 대형 플랫폼들의 가격 경쟁력을 따라잡기 어려웠습니다. 마케팅 비용을 투입해도 유입은 적었고, 전환율도 낮았습니다.\n\n결국 6개월간 진행하면서 약 50만원의 매출을 올렸지만, 투자 대비 수익이 너무 낮아 중단하게 되었습니다.',
  businessType: '온라인 쇼핑몰',
  investmentAmount: 1000000,
  durationMonths: 3,
  weeklyHours: 21,
  averageDailyHours: 'ONE_TO_THREE_HOURS',
  isConcurrentWithMainJob: true,
  monthlyRevenue: 0,
  failureReason: '시장 경쟁 과다',
  failureReasons: ['시장 경쟁 과다', '마케팅', '낮은 지속성'],
  difficulties: ['시장 경쟁 과다', '마케팅', '낮은 지속성'],
  difficultyEtc: '',
  difficultyExtra: '',
  targetMarket: null,
  marketingChannels: [],
  lessonsLearned:
    '처음에는 작은 시도들이 쌓이면서 변화가 생기기 때문에 하루에 한 가지씩만 꾸준히 시도해도 충분합니다.',
  wouldRetry: false,
  analysis: null,
  structuredData: {},
  viewCount: 0,
  likeCount: 0,
  hasPatternAnalysis: true,
  createdAt: '2026-04-22T00:00:00',
  updatedAt: '2026-04-22T00:00:00',
};

const DEV_FALLBACK_REPORT: AnalysisReport = {
  experienceId: 1,
  analysisId: 1,
  reportStatus: 'READY',
  title: '부업 실패 경험 제목',
  summary:
    '처음에는 작은 시도들이 쌓이면서 변화가 생기기 때문에 하루에 한 가지씩만 꾸준히 시도해도 충분합니다.',
  extractedPatterns: ['시장 경쟁 과다', '마케팅', '낮은 지속성'],
  keywords: ['시장 경쟁 과다', '마케팅', '낮은 지속성'],
  failureCategory: '시장 경쟁 과다',
  riskLevel: 'MEDIUM',
  riskFactors: ['시장 경쟁 과다', '마케팅', '낮은 지속성'],
  advice: [
    '첫 달에는 매출보다 ‘내 상품을 본 사람 30명 만들기’를 목표로 잡아보는 것도 방법입니다.',
    'SNS에 상품 사진을 올리거나 지인에게 한 번 공유해보는 것만으로도 시작이 될 수 있습니다. 또한 경쟁 상품의 리뷰를 살펴보면서 사람들이 불편해하는 지점을 정리해보세요. 그 부분을 반영해 상세페이지의 한 줄만 바꿔도 반응이 달라질 수 있습니다.',
    '소액으로 키워드 반응을 테스트해보고 어떤 검색어로 유입되는지 확인해보는 것도 도움이 됩니다. 반응이 있는 키워드를 상품 정보에 반영하는 것만으로도 노출이 달라질 수 있습니다.',
  ],
  confidenceScore: 0.6,
  processedAt: '2026-04-22T00:00:00',
  similarCases: [
    {
      caseId: '101',
      title: '메인 제목',
      summary: null,
      keyLesson: null,
      matchRate: 0,
    },
    {
      caseId: '102',
      title: '메인 제목',
      summary: null,
      keyLesson: null,
      matchRate: 0,
    },
    {
      caseId: '103',
      title: '메인 제목',
      summary: null,
      keyLesson: null,
      matchRate: 0,
    },
  ],
};

function shouldUseDevFallback(error: unknown) {
  return (
    import.meta.env.DEV &&
    error instanceof ApiError &&
    error.code === ERROR_CODES.NETWORK_ERROR
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('.');
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

function formatCurrency(value: number | null) {
  if (value == null) {
    return '0원';
  }

  return `${value.toLocaleString()}원`;
}

function formatTag(label: string) {
  return label.replaceAll('_', ' ').trim();
}

function getPatternSource(report: AnalysisReport | null) {
  if (!report) {
    return [];
  }

  const dedupe = (items: Array<string | null | undefined>) =>
    Array.from(new Set(items.filter(Boolean) as string[]));

  if (report.failureCategory) {
    return dedupe([report.failureCategory, ...report.extractedPatterns]);
  }
  if (report.extractedPatterns.length) {
    return dedupe(report.extractedPatterns);
  }
  if (report.keywords?.length) {
    return dedupe(report.keywords);
  }

  return dedupe(report.riskFactors);
}

function buildPatternItems(report: AnalysisReport | null): PatternItem[] {
  const source = getPatternSource(report).filter(Boolean).slice(0, 3);
  if (!source.length) {
    return [];
  }

  if (source.length === 1) {
    return [{ label: formatTag(source[0]), percent: 100 }];
  }

  const total = source.reduce((sum, _, index) => sum + (source.length - index), 0);
  return source.map((label, index) => ({
    label: formatTag(label),
    percent: Math.round((((source.length - index) / total) * 100) / 5) * 5,
  }));
}

function StatusBar() {
  return (
    <div className="flex h-[59px] w-[375px] items-center justify-center gap-[154px] bg-[#FFFFFF] px-[24px] pb-[19px] pt-[21px]">
      <div className="flex h-[22px] min-w-0 flex-1 items-center justify-center pt-[1.5px]">
        <p className="text-center font-['SF_Pro'] text-[17px] font-[590] leading-[22px] tracking-[0px] text-[#000000]">
          9:41
        </p>
      </div>

      <div className="flex h-[22px] min-w-0 flex-1 items-center justify-center gap-[7px] pr-[1px] pt-[1px]">
        <div className="flex h-[12.226px] w-[19.2px] items-end gap-[1.6px]">
          <div className="h-[4px] w-[3px] rounded-[999px] bg-[#000000]" />
          <div className="h-[6px] w-[3px] rounded-[999px] bg-[#000000]" />
          <div className="h-[9px] w-[3px] rounded-[999px] bg-[#000000]" />
          <div className="h-[12.226px] w-[3px] rounded-[999px] bg-[#000000]" />
        </div>

        <div className="relative h-[12.328px] w-[17.142px]">
          <div className="absolute bottom-0 left-0 h-[8px] w-[17.142px] rounded-t-[8px] border border-[#000000] border-b-0" />
          <div className="absolute bottom-[1.5px] left-[3.2px] h-[4.8px] w-[10.7px] rounded-t-[6px] border border-[#000000] border-b-0" />
          <div className="absolute bottom-[3px] left-[6.2px] h-[2.5px] w-[4.7px] rounded-t-[4px] border border-[#000000] border-b-0" />
        </div>

        <div className="relative h-[13px] w-[27.328px]">
          <div className="absolute left-0 top-0 h-[13px] w-[24.8px] rounded-[4.3px] border border-[#000000]" />
          <div className="absolute left-[2px] top-[2px] h-[9px] w-[18px] rounded-[2.5px] bg-[#000000]" />
          <div className="absolute right-0 top-[4px] h-[5px] w-[1.9px] rounded-r-[999px] bg-[#000000]" />
        </div>
      </div>
    </div>
  );
}

function FigmaBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = getAccessToken();

  const menus = [
    { name: '홈', path: '/', icon: homeIcon },
    { name: '탐색', path: '/explore', icon: exploreIcon },
    { name: '등록', path: '/create', icon: createIcon },
    { name: 'MY', path: '/mypage', icon: userIcon },
  ];

  function moveWithAuthGuard(path: string) {
    if (!token && (path === '/create' || path === '/mypage')) {
      const reason =
        path === '/create'
          ? '경험 등록은 로그인이 필요합니다.'
          : '마이페이지는 로그인이 필요합니다.';

      navigate(
        `/auth?next=${encodeURIComponent(path)}&reason=${encodeURIComponent(reason)}`,
      );
      return;
    }

    navigate(path);
  }

  return (
    <div className="fixed bottom-[-2px] left-1/2 z-50 w-[375px] -translate-x-1/2">
      <div className="flex w-[375px] items-center justify-between rounded-tl-[20px] rounded-tr-[20px] bg-[#FFFFFF] px-[48px] pb-[24px] pt-[12px] shadow-[0_0_5px_rgba(0,0,0,0.15)]">
        {menus.map((menu) => {
          const isActive =
            menu.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(menu.path);

          return (
            <button
              key={menu.path}
              type="button"
              onClick={() => moveWithAuthGuard(menu.path)}
              className={`flex flex-col items-center gap-[4px] ${
                isActive ? 'opacity-100' : 'opacity-30'
              }`}
            >
              <img src={menu.icon} alt="" className="h-[24px] w-[24px]" />
              <span className="text-center font-['Pretendard'] text-[10px] font-[400] leading-[10px] tracking-[0px] text-[#000000]">
                {menu.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex w-full flex-col gap-[4px]">
      <p className="w-full font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-[#131416]">
        {title}
      </p>
      <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949]">
        {description}
      </p>
    </div>
  );
}

function PrimaryBadge({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center rounded-[999px] bg-[#EEEEEE] px-[8px] py-[2px]">
      <span className="font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#757575]">
        {text}
      </span>
    </div>
  );
}

function SecondaryBadge({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center rounded-[999px] bg-[#BABABA] px-[8px] py-[2px]">
      <span className="font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#FFFFFF]">
        {text}
      </span>
    </div>
  );
}

function DetailMetricRow({
  icon,
  label,
  value,
  showDivider = true,
}: {
  icon: string;
  label: string;
  value: string;
  showDivider?: boolean;
}) {
  return (
    <>
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-[4px]">
          <div className="flex h-[14px] items-center">
            <img src={icon} alt="" className="h-[14px] w-[14px]" />
          </div>
          <p className="font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#8A8A8A]">
            {label}
          </p>
        </div>
        <p className="font-['Pretendard'] text-[16px] font-[400] leading-[22.4px] tracking-[0px] text-[#131416]">
          {value}
        </p>
      </div>
      {showDivider ? <div className="h-0 w-full border-t border-[#E6E6E6]" /> : null}
    </>
  );
}

function SimilarCaseCard({
  item,
  tags,
  onClick,
}: {
  item: AnalysisReportSimilarCase;
  tags: string[];
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col items-start rounded-[10px] border border-[#EEEEEE] bg-[#F8F8F8] p-[16px] text-left"
    >
      <div className="flex w-full flex-col gap-[8px]">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-start gap-[4px]">
            {tags.map((tag) => (
              <SecondaryBadge key={`${item.caseId}-${tag}`} text={tag} />
            ))}
          </div>

          <div className="flex items-center justify-center gap-[4px]">
            <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949]">
              유사도
            </p>
            <div className="flex items-center">
              <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949]">
                {String(item.matchRate).padStart(2, '0')}
              </p>
              <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949]">
                %
              </p>
            </div>
          </div>
        </div>

        <p className="w-full font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-[#000000]">
          {item.title}
        </p>
      </div>
    </button>
  );
}

export default function AiAnalysisResult({ experienceId }: Props) {
  const navigate = useNavigate();
  const [experience, setExperience] = useState<Experience | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const viewer = getStoredUser();
  const isOwner = useMemo(() => {
    if (!viewer || !experience) {
      return false;
    }

    return viewer.id === experience.author.id;
  }, [experience, viewer]);

  useEffect(() => {
    if (!experienceId) {
      setLoading(false);
      setError('요청한 사례를 찾을 수 없어요.');
      return;
    }

    void loadPageData(experienceId);
  }, [experienceId]);

  async function loadPageData(targetExperienceId: number) {
    setLoading(true);
    setError('');

    try {
      const experiencePayload = await getExperience(targetExperienceId);
      let reportPayload = await getReport(targetExperienceId);

      if (reportPayload.reportStatus === 'NOT_READY') {
        const token = getAccessToken();
        if (token) {
          try {
            await createAnalysis(token, targetExperienceId);
            reportPayload = await getReport(targetExperienceId);
          } catch (requestError) {
            if (
              requestError instanceof ApiError &&
              (requestError.code === ERROR_CODES.ANALYSIS_TIMEOUT ||
                requestError.code === ERROR_CODES.AI_UPSTREAM_ERROR)
            ) {
              setExperience(experiencePayload);
              setReport(reportPayload);
              return;
            }
          }
        }
      }

      setExperience(experiencePayload);
      setReport(reportPayload);
    } catch (requestError) {
      if (shouldUseDevFallback(requestError)) {
        setExperience(DEV_FALLBACK_EXPERIENCE);
        setReport(DEV_FALLBACK_REPORT);
        return;
      }

      setError(
        resolveErrorMessage(
          requestError,
          '분석 결과를 불러오지 못했어요. 잠시 후 다시 시도해주세요.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!experience) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setError('삭제하려면 로그인이 필요합니다.');
      return;
    }

    const confirmed = window.confirm('이 사례를 삭제하시겠습니까?');
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setActionMenuOpen(false);
    setError('');

    try {
      await deleteExperience(token, experience.id);
      navigate('/', { replace: true });
    } catch (requestError) {
      setError(
        resolveErrorMessage(
          requestError,
          '사례를 삭제하지 못했어요. 잠시 후 다시 시도해주세요.',
        ),
      );
      setDeleting(false);
    }
  }

  const chips = useMemo(() => {
    if (!experience) {
      return [];
    }

    return [
      experience.category.name,
      experience.durationMonths ? '할애 기간' : null,
      experience.investmentAmount != null ? '투자금' : null,
      experience.monthlyRevenue != null ? '수익' : null,
      experience.isConcurrentWithMainJob != null ? '본업 병행 여부' : null,
    ].filter((value): value is string => Boolean(value));
  }, [experience]);

  const issueItems = useMemo(() => {
    if (!report) {
      return [];
    }

    const source = report.keywords?.length
      ? report.keywords
      : report.riskFactors.length
        ? report.riskFactors
        : report.failureCategory
          ? [report.failureCategory]
          : report.extractedPatterns;

    return source.filter(Boolean).slice(0, 3).map((item) => `# ${formatTag(item)}`);
  }, [report]);

  const patternItems = useMemo(() => buildPatternItems(report), [report]);

  const guideLines = useMemo(() => {
    if (!report?.advice?.length) {
      return ['아직 AI 가이드가 준비되지 않았습니다.'];
    }

    return report.advice.slice(0, 3);
  }, [report]);

  const guideClosing = useMemo(() => {
    if (report?.summary?.trim()) {
      return report.summary.trim();
    }

    return '처음에는 작은 시도들이 쌓이면서 변화가 생기기 때문에 하루에 한 가지씩만 꾸준히 시도해도 충분합니다.';
  }, [report]);

  const similarCases = useMemo(() => report?.similarCases.slice(0, 3) ?? [], [report]);

  const similarCaseTags = useMemo(() => {
    const source = report?.keywords?.filter(Boolean).slice(0, 3) ?? [];
    return source.length ? source.map(formatTag) : ['키워드', '키워드', '키워드'];
  }, [report]);

  if (loading) {
    return (
      <div className="mx-auto min-h-screen w-[375px] bg-[#FFFFFF]">
        <div className="px-[16px] py-[40px]">
          <div className="rounded-[10px] border border-[#E6E6E6] bg-[#F8F8F8] px-[16px] py-[20px] font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] tracking-[0px] text-[#494949]">
            경험을 불러오는 중입니다.
          </div>
        </div>
      </div>
    );
  }

  if (error || !experience) {
    return (
      <div className="mx-auto min-h-screen w-[375px] bg-[#FFFFFF]">
        <div className="px-[16px] py-[40px]">
          <div className="rounded-[10px] border border-[#E6E6E6] bg-[#F8F8F8] px-[16px] py-[20px] font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] tracking-[0px] text-[#D33B3B]">
            {error || '분석 결과를 불러오지 못했어요. 잠시 후 다시 시도해주세요.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen w-[375px] bg-[#FFFFFF]">
      {actionMenuOpen && (
        <button
          type="button"
          aria-label="오버레이 닫기"
          onClick={() => {
            setActionMenuOpen(false);
          }}
          className="fixed inset-0 z-40 bg-black/20"
        />
      )}

      {isOwner && actionMenuOpen ? (
        <div className="fixed left-1/2 top-[106px] z-50 w-[148px] -translate-x-[-112px] rounded-[14px] border border-[#E6E6E6] bg-white p-[6px] shadow-[0_12px_30px_rgba(0,0,0,0.14)]">
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={deleting}
            className="flex w-full items-center gap-[8px] rounded-[10px] px-[12px] py-[10px] text-left font-['Pretendard'] text-[13px] font-[500] leading-[16px] tracking-[0px] text-[#D33B3B] hover:bg-[#FFF4F2] disabled:opacity-60"
          >
            <Trash2 size={16} />
            {deleting ? '삭제 중...' : '삭제하기'}
          </button>
        </div>
      ) : null}

      <div className="relative flex w-[375px] flex-col bg-[#FFFFFF]">
        <div className="flex w-[375px] flex-col">
          <StatusBar />

          <div className="relative flex w-[375px] items-center justify-between bg-[#FFFFFF] px-[16px] py-[20px]">
            <div className="flex items-center gap-[8px]">
              <button
                type="button"
                onClick={() => navigate(-1)}
                aria-label="뒤로가기"
                className="flex h-[24px] w-[24px] items-center justify-center text-[#000000]"
              >
                <ChevronLeft size={24} strokeWidth={1.75} />
              </button>
              <div className="flex h-[24px] w-[24px] items-center justify-center">
                <Heart size={24} strokeWidth={1.75} className="text-transparent" />
              </div>
            </div>

            <p className="font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-[#000000]">
              사례 상세
            </p>

            <div className="flex items-center gap-[8px]">
              <button
                type="button"
                aria-label="북마크"
                className="flex h-[24px] w-[24px] items-center justify-center text-[#000000]"
              >
                <Bookmark size={24} strokeWidth={1.75} />
              </button>
              {isOwner ? (
                <button
                  type="button"
                  aria-label="더보기"
                  onClick={() => setActionMenuOpen((current) => !current)}
                  className="flex h-[24px] w-[24px] items-center justify-center text-[#000000]"
                >
                  <MoreHorizontal size={24} strokeWidth={1.75} />
                </button>
              ) : (
                <div className="h-[24px] w-[24px]" />
              )}
            </div>
          </div>
        </div>

        <div className="flex w-[375px] flex-col gap-[36px] px-[16px] pb-[100px]">
          {error ? (
            <div className="rounded-[10px] border border-[#F2D1CD] bg-[#FFF4F2] px-[16px] py-[12px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#D33B3B]">
              {error}
            </div>
          ) : null}

          <section className="flex w-full flex-col gap-[24px] bg-[#FFFFFF]">
            <div className="flex w-full items-center gap-[8px]">
              {experience.author.profileImage ? (
                <img
                  src={experience.author.profileImage}
                  alt=""
                  className="h-[32px] w-[32px] rounded-[999px] object-cover"
                />
              ) : (
                <div className="h-[32px] w-[32px] rounded-[999px] bg-[#EEEEEE]" />
              )}

              <div className="flex w-[92px] items-start">
                <div className="flex flex-col items-start gap-[2px] text-[12px] leading-[16.8px]">
                  <div className="flex items-center gap-[4px] whitespace-nowrap">
                    <p className="font-['Pretendard'] text-[12px] font-[600] leading-[16.8px] tracking-[0px] text-[#131416]">
                      {experience.author.nickname}
                    </p>
                    <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#BABABA]">
                      {formatDate(experience.createdAt)}
                    </p>
                  </div>
                  <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949]">
                    {experience.category.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-[16px]">
              <p className="w-full font-['Pretendard'] text-[18px] font-[600] leading-[21.6px] tracking-[0px] text-[#131416]">
                {experience.title}
              </p>
              <div className="w-full whitespace-pre-wrap font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] tracking-[0px] text-[#494949]">
                {experience.content}
              </div>
            </div>

            <div className="flex w-full flex-wrap items-center gap-[4px]">
              {chips.map((chip) => (
                <PrimaryBadge key={chip} text={chip} />
              ))}
            </div>

            <div className="flex w-full flex-col gap-[10px] rounded-[10px] border border-[#E6E6E6] bg-[#F8F8F8] p-[16px]">
              <DetailMetricRow
                icon={durationIcon}
                label="진행 기간"
                value={formatDuration(experience.durationMonths)}
              />
              <DetailMetricRow
                icon={amountIcon}
                label="투자금"
                value={formatCurrency(experience.investmentAmount)}
              />
              <DetailMetricRow
                icon={amountIcon}
                label="수익"
                value={formatCurrency(experience.monthlyRevenue)}
                showDivider={false}
              />
            </div>
          </section>

          <section className="flex w-full flex-col gap-[12px]">
            <SectionTitle
              title="핵심 이슈"
              description="해당 사례에서 찾아볼 수 있는 핵심 이슈입니다."
            />

            <div className="flex w-full flex-wrap items-start gap-[10px]">
              {issueItems.length ? (
                issueItems.map((item) => (
                  <div
                    key={item}
                    className="flex flex-wrap items-start rounded-[10px] border border-[#E6E6E6] bg-[#F8F8F8] px-[16px] py-[12px]"
                  >
                    <div className="flex flex-col items-start">
                      <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#131416]">
                        {item}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-wrap items-start rounded-[10px] border border-[#E6E6E6] bg-[#F8F8F8] px-[16px] py-[12px]">
                  <div className="flex flex-col items-start">
                    <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#757575]">
                      아직 핵심 이슈를 추출하지 못했습니다.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="flex w-full flex-col">
            <div className="flex w-full flex-col gap-[12px] rounded-[10px] border border-[#5E5E5E] bg-[#FFFFFF] p-[16px]">
              <div className="flex w-full items-center gap-[8px]">
                <div className="flex h-[20px] w-[20px] items-center justify-center rounded-[4px] bg-[#131416]">
                  <span className="font-['Pretendard'] text-[12px] font-[600] leading-[14.4px] tracking-[0px] text-[#FFFFFF]">
                    AI
                  </span>
                </div>
                <p className="font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-[#131416]">
                  AI 가이드
                </p>
              </div>

              <p className="w-full font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#5E5E5E]">
                판매는 되는데 수익으로 이어지지 않으면 정말 답답하죠.
              </p>

              <div className="h-0 w-full border-t border-[#D8D8D8]" />

              <div className="flex w-full flex-col gap-[10px]">
                {guideLines.map((line, index) => (
                  <ol
                    key={`${index}-${line}`}
                    start={index + 1}
                    className="w-full list-decimal font-['Pretendard'] text-[12px] font-[600] leading-[0px] tracking-[0px] text-[#494949]"
                  >
                    <li className="ml-[18px]">
                      <span className="font-[400] leading-[16.8px]">{line}</span>
                    </li>
                  </ol>
                ))}
              </div>

              <div className="h-0 w-full border-t border-[#D8D8D8]" />

              <div className="w-full whitespace-pre-wrap font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#5E5E5E]">
                {guideClosing}
              </div>
            </div>
          </section>

          <section className="flex w-full flex-col gap-[12px]">
            <SectionTitle
              title="실패 패턴"
              description="유사 카테고리 내 실패 원인 별 비중 그래프 데이터입니다."
            />

            <div className="flex w-full flex-col gap-[16px] rounded-[10px] border border-[#E6E6E6] bg-[#F8F8F8] p-[16px]">
              {patternItems.length ? (
                patternItems.map((item) => (
                  <div key={item.label} className="flex w-[311px] flex-col gap-[4px]">
                    <div className="flex w-full items-start justify-between">
                      <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949]">
                        {item.label}
                      </p>

                      <div className="flex items-center justify-end">
                        <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949]">
                          {String(item.percent).padStart(2, '0')}
                        </p>
                        <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949]">
                          %
                        </p>
                      </div>
                    </div>

                    <div className="relative h-[10px] w-[311px] overflow-hidden rounded-[999px] bg-[#D8D8D8]">
                      <div
                        className="absolute left-0 top-0 h-[10px] rounded-[999px] bg-[#000000]"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#757575]">
                  아직 실패 패턴 데이터가 없습니다.
                </p>
              )}
            </div>
          </section>

          <section className="flex w-full items-center">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-[12px] rounded-[10px] border border-[#E5E7EB] bg-[#FFFFFF] p-[16px]">
              <SectionTitle
                title="유사 사례"
                description="이 사례와 비슷한 실패 경험을 가진 다른 사례들을 추천해드립니다."
              />

              <div className="flex w-full flex-col gap-[10px]">
                {similarCases.length ? (
                  similarCases.map((item) => (
                    <SimilarCaseCard
                      key={item.caseId}
                      item={item}
                      tags={similarCaseTags}
                      onClick={() => navigate('/explore')}
                    />
                  ))
                ) : (
                  <div className="flex w-full flex-col items-start rounded-[10px] border border-[#EEEEEE] bg-[#F8F8F8] p-[16px]">
                    <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#757575]">
                      아직 추천할 유사 사례가 없습니다.
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => navigate('/explore')}
                className="font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#5D5D5D] underline [text-decoration-skip-ink:none]"
              >
                모든 사례 보기
              </button>
            </div>
          </section>
        </div>
      </div>

      <FigmaBottomNav />
    </div>
  );
}
