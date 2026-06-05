import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import arrowLeftIcon from '../assets/auth-figma/arrow-left.svg';
import guideNavIcon from '../assets/home-v1-figma/icons/guide-figma.svg';
import homeNavIcon from '../assets/home-v1-figma/icons/home-figma.svg';
import searchNavIcon from '../assets/home-v1-figma/icons/search-nav-figma.svg';
import userNavIcon from '../assets/home-v1-figma/icons/user-figma.svg';
import ExampleCard from '../components/create/ExampleCard';
import { useToast } from '../components/common/useToast';
import {
  createExperience,
  getCategories,
  getExperience,
  updateExperience,
  type Category,
  type ExperienceUpsertInput,
} from '../lib/api';
import { CATEGORY_VISUALS } from '../lib/category-visuals';
import { resolveErrorMessage } from '../lib/resolve-error-message';
import { getAccessToken, getStoredUser } from '../lib/session';

const MIN_CONTENT_LENGTH = 10;
const MAX_CONTENT_LENGTH = 2000;
const DURATION_OPTIONS = ['1개월 미만', '1개월', '2개월', '3개월', '4개월', '5개월', '6개월', '7개월', '8개월', '9개월', '10개월', '11개월', '1년 이상'];
const DAILY_TIME_OPTIONS = ['1시간 미만', '1시간', '2시간', '3시간', '4시간', '5시간', '6시간', '7시간', '8시간 이상'];
const DIFFICULTY_OPTIONS = ['고객 확보(마케팅)', '수익 구조 이해', '시간 관리', '수익화 연결', '운영 지속성', '정보 부족', '경쟁 심화', '기타'];

type WizardStep = 1 | 2 | 3 | 4;
type OpenSheet = 'duration' | 'dailyTime' | null;

type PendingPayload = Omit<ExperienceUpsertInput, 'categoryId'> & {
  title: string;
  categoryId?: number;
  businessType?: string;
  failureReason?: string;
  lessonsLearned?: string;
  wouldRetry?: boolean;
};

type GuideWritingTable = {
  categories: Array<{
    id: string;
    category: string;
    examples: Array<{
      pattern: string;
      text: string;
    }>;
  }>;
};

type GuideExample = {
  key: string;
  categoryLabel: string;
  difficultyLabel: string;
  guide: string;
};

const CATEGORY_KEY_BY_LABEL: Record<string, string> = {
  '온라인 판매·이커머스': 'online_sales',
  '콘텐츠·SNS 기반': 'content_sns',
  '디지털 상품·지식 판매': 'digital_knowledge',
  '플랫폼 기반 노동형': 'platform_labor',
  '재능 판매·프리랜서': 'freelance',
  '투자·재테크': 'investment',
  '오프라인 기반 부업': 'offline',
};

const GUIDE_PATTERN_BY_DIFFICULTY_LABEL: Record<string, string> = {
  '고객 확보(마케팅)': '마케팅 부족',
  '수익 구조 이해': '수익 구조 이해 부족',
  '시간 관리': '시간 관리',
  '수익화 연결': '수익화 연결',
  '운영 지속성': '운영 지속성',
  '정보 부족': '정보 부족',
  '경쟁 심화': '경쟁 심화',
};

const CATEGORY_SLUG_BY_KEY: Record<string, string> = {
  online_sales: 'online-commerce',
  content_sns: 'content-sns',
  digital_knowledge: 'digital-products',
  platform_labor: 'platform-labor',
  freelance: 'talent-freelance',
  investment: 'investment',
  offline: 'offline-sidejob',
};

function parseAmount(value: string) {
  const digits = value.replace(/[^\d]/g, '');
  return digits ? Number(digits) : undefined;
}

function mapDurationToMonths(value: string | null) {
  if (!value) return undefined;
  if (value === '1개월 미만') return 1;
  if (value === '1년 이상') return 12;
  return Number(value.replace(/[^\d]/g, '')) || undefined;
}

function mapMonthsToDuration(value: number | null) {
  if (!value) return null;
  if (value <= 1) return '1개월 미만';
  if (value >= 12) return '1년 이상';
  return `${value}개월`;
}

function mapDailyTime(value: string | null) {
  switch (value) {
    case '1시간 미만':
      return { averageDailyHours: 'UNDER_1_HOUR', weeklyHours: 3 };
    case '1시간':
      return { averageDailyHours: 'ONE_TO_THREE_HOURS', weeklyHours: 7 };
    case '2시간':
      return { averageDailyHours: 'ONE_TO_THREE_HOURS', weeklyHours: 14 };
    case '3시간':
      return { averageDailyHours: 'ONE_TO_THREE_HOURS', weeklyHours: 21 };
    case '4시간':
      return { averageDailyHours: 'THREE_TO_FIVE_HOURS', weeklyHours: 28 };
    case '5시간':
      return { averageDailyHours: 'THREE_TO_FIVE_HOURS', weeklyHours: 35 };
    case '6시간':
    case '7시간':
    case '8시간 이상':
      return { averageDailyHours: 'OVER_FIVE_HOURS', weeklyHours: 40 };
    default:
      return { averageDailyHours: undefined, weeklyHours: undefined };
  }
}

function mapAverageDailyHoursToLabel(value: string | null) {
  switch (value) {
    case 'UNDER_1_HOUR':
      return '1시간 미만';
    case 'ONE_TO_THREE_HOURS':
      return '3시간';
    case 'THREE_TO_FIVE_HOURS':
      return '5시간';
    case 'OVER_FIVE_HOURS':
      return '8시간 이상';
    default:
      return null;
  }
}

function normalizeCategoryName(value: string) {
  return value.replace(/\s+/g, '').replace(/[·,/()]/g, '').toLowerCase();
}

function getCategoryLabelByKey(key: string | null) {
  if (!key) return null;
  return CATEGORY_VISUALS.find((item) => item.key === key)?.label ?? null;
}

function findMatchedCategory(selectedCategoryKey: string | null, selectedCategoryLabel: string | null, categories: Category[]) {
  if (!selectedCategoryKey && !selectedCategoryLabel) return undefined;
  const selectedSlug = selectedCategoryKey ? CATEGORY_SLUG_BY_KEY[selectedCategoryKey] : undefined;
  if (selectedSlug) {
    const matchedBySlug = categories.find((category) => category.slug === selectedSlug);
    if (matchedBySlug) {
      return matchedBySlug;
    }
  }
  if (!selectedCategoryLabel) {
    return undefined;
  }
  const normalizedSelected = normalizeCategoryName(selectedCategoryLabel);
  return categories.find((category) => normalizeCategoryName(category.name) === normalizedSelected)
    ?? categories.find((category) => normalizedSelected.includes(normalizeCategoryName(category.name)));
}

function buildPendingPayload(input: {
  selectedCategory: string | null;
  duration: string | null;
  dailyTime: string | null;
  investmentAmount: string;
  monthlyRevenue: string;
  isConcurrentWithMainJob: boolean | null;
  difficulties: string[];
  difficultyEtc: string;
  content: string;
  matchedCategory?: Category;
}): PendingPayload {
  const { averageDailyHours, weeklyHours } = mapDailyTime(input.dailyTime);
  const trimmedContent = input.content.trim();
  const trimmedEtc = input.difficultyEtc.trim();

  return {
    title: `${input.selectedCategory ?? '부업'} 경험`,
    content: trimmedContent,
    categoryId: input.matchedCategory?.id,
    businessType: input.matchedCategory?.name ?? input.selectedCategory ?? undefined,
    investmentAmount: parseAmount(input.investmentAmount),
    durationMonths: mapDurationToMonths(input.duration),
    weeklyHours,
    averageDailyHours,
    isConcurrentWithMainJob: input.isConcurrentWithMainJob ?? undefined,
    monthlyRevenue: parseAmount(input.monthlyRevenue),
    failureReason: input.difficulties[0] ?? '기타',
    failureReasons: input.difficulties,
    difficulties: input.difficulties,
    difficultyEtc: trimmedEtc || undefined,
    difficultyExtra: '',
    lessonsLearned: trimmedContent,
    wouldRetry: false,
  };
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <header className="flex h-[123px] w-full flex-col border-b border-[#F2F2F2] bg-white">
      <div className="h-[59px] px-[16px] pt-[17px]">
        <div className="flex items-center justify-between text-[17px] font-[600] text-black">
          <span>9:41</span>
          <div className="flex items-center gap-[8px]">
            <span className="block h-[13px] w-[18px] rounded-[2px] border-[2px] border-black" />
          </div>
        </div>
      </div>
      <div className="flex h-[64px] items-center px-[16px]">
        <button type="button" onClick={onBack} className="flex h-[24px] w-[24px] items-center justify-center">
          <img src={arrowLeftIcon} alt="뒤로가기" className="h-[24px] w-[24px]" />
        </button>
        <div className="flex-1 text-center text-[16px] font-[600] leading-[19.2px] text-[#131416]">경험 등록</div>
        <div className="w-[24px]" />
      </div>
    </header>
  );
}

function ProgressBar({ step }: { step: WizardStep }) {
  const percentage = step * 25;
  return (
    <section className="flex w-[343px] flex-col gap-[5px] pt-[4px]">
      <div className="flex items-center justify-between text-[14px] font-[500] leading-[20px] text-[#131416]">
        <span>{step}/4 단계</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-[6px] w-full rounded-full bg-[#D8D8D8]">
        <div className="h-full rounded-full bg-[#5A876E] transition-all" style={{ width: `${percentage}%` }} />
      </div>
    </section>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center gap-[5px] text-center">
      <h2 className="text-[24px] font-[700] leading-[30px] text-[#131416]">{title}</h2>
      <p className="text-[14px] font-[400] leading-[20px] text-[#6A6A6A]">{subtitle}</p>
    </div>
  );
}

function SelectField({ label, value, placeholder, onClick }: { label: string; value: string | null; placeholder: string; onClick: () => void }) {
  return (
    <div className="flex flex-col gap-[10px]">
      <span className="text-[14px] font-[500] leading-[16.8px] text-[#131416]">{label}</span>
      <button type="button" onClick={onClick} className="flex h-[40px] w-full items-center justify-between rounded-[10px] border border-[#E6E6E6] px-[16px] text-[14px] leading-[20px] text-[#8A8A8A]">
        <span>{value ?? placeholder}</span>
        <span className="text-[16px] text-[#8A8A8A]">⌄</span>
      </button>
    </div>
  );
}

function MoneyField({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (value: string) => void }) {
  return (
    <div className="flex flex-col gap-[10px]">
      <span className="text-[14px] font-[500] leading-[16.8px] text-[#131416]">{label}</span>
      <label className="flex h-[40px] w-full items-center rounded-[10px] border border-[#E6E6E6] px-[16px] text-[14px] leading-[20px] text-[#131416]">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value.replace(/[^\d]/g, ''))}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none placeholder:text-[#BABABA]"
          inputMode="numeric"
        />
        <span className="text-[#8A8A8A]">원</span>
      </label>
    </div>
  );
}

function BottomNav() {
  const navigate = useNavigate();
  return (
    <nav className="flex h-[84px] w-full items-start justify-around rounded-t-[24px] border-t border-[#F0F0F0] bg-white px-[24px] pt-[12px] shadow-[0_-6px_24px_rgba(0,0,0,0.06)]">
      {[
        ['홈', homeNavIcon, '/'],
        ['탐색', searchNavIcon, '/explore'],
        ['가이드', guideNavIcon, '/faq'],
        ['MY', userNavIcon, '/mypage'],
      ].map(([label, icon, path]) => (
        <button key={String(path)} type="button" onClick={() => navigate(String(path))} className="flex flex-col items-center gap-[4px] opacity-30">
          <img src={String(icon)} alt="" className="h-[24px] w-[24px]" />
          <span className="text-[12px] text-[#BABABA]">{label}</span>
        </button>
      ))}
    </nav>
  );
}

export default function CreateWizardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [step, setStep] = useState<WizardStep>(1);
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [dailyTime, setDailyTime] = useState<string | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [monthlyRevenue, setMonthlyRevenue] = useState('');
  const [isConcurrentWithMainJob, setIsConcurrentWithMainJob] = useState<boolean | null>(null);
  const [difficulties, setDifficulties] = useState<string[]>([]);
  const [difficultyEtc, setDifficultyEtc] = useState('');
  const [content, setContent] = useState('');
  const [exampleVisible, setExampleVisible] = useState(false);
  const [guideTable, setGuideTable] = useState<GuideWritingTable | null>(null);
  const [guideLoading, setGuideLoading] = useState(true);
  const [guideError, setGuideError] = useState<string | null>(null);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const editingExperienceId = useMemo(() => {
    const raw = searchParams.get('experienceId') ?? searchParams.get('id') ?? searchParams.get('editId');
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }, [searchParams]);

  const isEditMode = editingExperienceId !== null;

  useEffect(() => {
    let cancelled = false;
    setCategoryLoading(true);
    getCategories()
      .then((items) => {
        if (!cancelled) setCategories(items);
      })
      .catch((error) => {
        if (!cancelled) showToast(resolveErrorMessage(error, '카테고리를 불러오지 못했어요.'), 'error');
      })
      .finally(() => {
        if (!cancelled) setCategoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  useEffect(() => {
    let cancelled = false;
    setGuideLoading(true);
    fetch('/guide-writing-examples.json')
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('guide-writing-examples.json not found');
        }
        return response.json() as Promise<GuideWritingTable>;
      })
      .then((data) => {
        if (!cancelled) {
          setGuideTable(data);
          setGuideError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setGuideError('작성 예시를 불러오지 못했어요.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setGuideLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (editingExperienceId === null) return;
    const token = getAccessToken();
    if (!token) return;

    let cancelled = false;
    getExperience(editingExperienceId)
      .then((experience) => {
        if (cancelled) return;
        setSelectedCategoryKey(CATEGORY_KEY_BY_LABEL[experience.businessType ?? experience.category.name] ?? null);
        setDuration(mapMonthsToDuration(experience.durationMonths));
        setDailyTime(mapAverageDailyHoursToLabel(experience.averageDailyHours));
        setInvestmentAmount(experience.investmentAmount ? String(experience.investmentAmount) : '');
        setMonthlyRevenue(experience.monthlyRevenue ? String(experience.monthlyRevenue) : '');
        setIsConcurrentWithMainJob(experience.isConcurrentWithMainJob ?? null);
        setDifficulties(experience.difficulties ?? []);
        setDifficultyEtc(experience.difficultyEtc ?? '');
        setContent(experience.content ?? '');
      })
      .catch((error) => {
        if (!cancelled) showToast(resolveErrorMessage(error, '수정할 경험을 불러오지 못했어요.'), 'error');
      });

    return () => {
      cancelled = true;
    };
  }, [editingExperienceId, showToast]);

  useEffect(() => {
    if (!openSheet) return undefined;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenSheet(null);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [openSheet]);

  const selectedCategory = useMemo(() => getCategoryLabelByKey(selectedCategoryKey), [selectedCategoryKey]);

  const matchedCategory = useMemo(
    () => findMatchedCategory(selectedCategoryKey, selectedCategory, categories),
    [categories, selectedCategory, selectedCategoryKey],
  );

  const guideExamples = useMemo<GuideExample[]>(() => {
    if (!guideTable || !selectedCategoryKey) {
      return [];
    }

    return difficulties
      .filter((item) => item !== '기타')
      .map((item) => {
        const category = guideTable.categories.find((entry) => entry.id === selectedCategoryKey);
        if (!category) {
          return null;
        }
        const pattern = GUIDE_PATTERN_BY_DIFFICULTY_LABEL[item];
        if (!pattern) {
          return null;
        }
        const example = category.examples.find((entry) => entry.pattern === pattern);
        if (!example) {
          return null;
        }
        return {
          key: `${category.id}__${item}`,
          categoryLabel: category.category,
          difficultyLabel: item,
          guide: example.text,
        };
      })
      .filter((item): item is GuideExample => item !== null);
  }, [difficulties, guideTable, selectedCategoryKey]);

  useEffect(() => {
    if (exampleIndex >= guideExamples.length) {
      setExampleIndex(0);
    }
  }, [exampleIndex, guideExamples.length]);

  const stepDisabled =
    (step === 1 && !selectedCategoryKey)
    || (step === 2 && (!duration || !dailyTime || isConcurrentWithMainJob === null))
    || (step === 3 && (!difficulties.length || (difficulties.includes('기타') && !difficultyEtc.trim())))
    || (step === 4 && (content.trim().length < MIN_CONTENT_LENGTH || content.trim().length > MAX_CONTENT_LENGTH));

  function toggleDifficulty(value: string) {
    setDifficulties((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  }

  function handleBack() {
    if (openSheet) {
      setOpenSheet(null);
      return;
    }
    if (step > 1) {
      setStep((current) => (current - 1) as WizardStep);
      return;
    }
    navigate(-1);
  }

  async function handleNext() {
    if (stepDisabled || categoryLoading || submitting) return;

    if (step < 4) {
      setStep((current) => (current + 1) as WizardStep);
      return;
    }

    const token = getAccessToken();
    if (!token) {
      navigate('/auth?next=%2Fcreate');
      return;
    }

    const storedUser = getStoredUser();
    if (!storedUser?.emailVerified) {
      showToast('이메일 인증 후 이용할 수 있어요.', 'error');
      return;
    }

    if (!selectedCategory || !matchedCategory || !duration || !dailyTime || isConcurrentWithMainJob === null) {
      showToast('필수 정보를 모두 입력해 주세요.', 'error');
      return;
    }

    const payload = buildPendingPayload({
      selectedCategory,
      duration,
      dailyTime,
      investmentAmount,
      monthlyRevenue,
      isConcurrentWithMainJob,
      difficulties,
      difficultyEtc,
      content,
      matchedCategory,
    });

    try {
      setSubmitting(true);

      if (isEditMode && editingExperienceId !== null) {
        await updateExperience(token, editingExperienceId, {
          ...payload,
          categoryId: matchedCategory.id,
        });
        showToast('경험을 수정했어요.', 'success');
        navigate(`/detail/${editingExperienceId}`);
        return;
      }

      const created = await createExperience(token, {
        ...payload,
        categoryId: matchedCategory.id,
      });
      showToast('경험을 등록했어요. AI 분석을 시작합니다.', 'success');
      navigate(`/analysis-result?experienceId=${created.id}`);
    } catch (error) {
      showToast(resolveErrorMessage(error, '경험을 처리하지 못했어요.'), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="mx-auto min-h-screen w-full max-w-[375px] bg-white">
        <Header onBack={handleBack} />

        <main className="flex flex-col items-center gap-[24px] px-[16px] pb-[180px] pt-[16px]">
          <ProgressBar step={step} />

          {step === 1 ? (
            <section className="flex w-[343px] flex-col gap-[24px]">
              <SectionTitle title="어떤 상황에서 시작하셨나요?" subtitle="경험을 이해하는 데 필요한 정보들이에요" />
              <p className="text-[14px] font-[500] leading-[16.8px] text-[#131416]">어떠한 부업을 경험했었나요? *</p>
              <div className="grid grid-cols-2 gap-[10px]">
                {CATEGORY_VISUALS.map((category) => {
                  const selected = selectedCategoryKey === category.key;
                  const hasSelection = Boolean(selectedCategoryKey);
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setSelectedCategoryKey(category.key)}
                      className={`flex h-[151px] flex-col rounded-[16px] border px-[14px] py-[16px] text-left transition ${selected ? 'border-[#5A876E] bg-[#F4F8F5]' : 'border-[#E6E6E6] bg-white'} ${hasSelection && !selected ? 'opacity-[0.38]' : 'opacity-100'}`}
                    >
                      <div className="flex h-[50px] w-[50px] items-center justify-center">{category.icon}</div>
                      <div className="pt-[14px]">
                        <p className={`text-[14px] leading-[16.8px] ${selected ? 'font-[600] text-[#131416]' : 'font-[400] text-[#8A8A8A]'}`}>{category.label}</p>
                        <div className={`pt-[6px] text-[10px] leading-[12px] ${selected ? 'text-[#5E5E5E]' : 'text-[#BABABA]'}`}>
                          {category.descriptionLines.slice(0, 2).map((line) => (
                            <p key={`${category.id}-${line}`}>{line}</p>
                          ))}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section className="flex w-[343px] flex-col gap-[24px]">
              <SectionTitle title="어떤 상황에서 시작하셨나요?" subtitle="경험을 이해하는 데 필요한 정보들이에요" />
              <div className="flex flex-col gap-[16px]">
                <SelectField label="총 진행 기간 *" value={duration} placeholder="선택 안 함" onClick={() => setOpenSheet('duration')} />
                <SelectField label="평균 하루 할애 시간" value={dailyTime} placeholder="선택 안 함" onClick={() => setOpenSheet('dailyTime')} />
                <MoneyField label="투자 금액" value={investmentAmount} placeholder="예: 1,000,000" onChange={setInvestmentAmount} />
                <MoneyField label="수익 (월 단위로 작성해주세요)" value={monthlyRevenue} placeholder="예: 1,000,000" onChange={setMonthlyRevenue} />
                <div className="flex flex-col gap-[8px]">
                  <span className="text-[14px] font-[600] text-[#131416]">본업 병행 여부 *</span>
                  <button
                    type="button"
                    onClick={() => setIsConcurrentWithMainJob(true)}
                    className={`flex h-[40px] items-center rounded-[10px] border px-[16px] text-[14px] ${isConcurrentWithMainJob === true ? 'border-[#5A876E] bg-[#F4F8F5] text-[#5A876E]' : 'border-[#E6E6E6] text-[#8A8A8A]'}`}
                  >
                    네
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConcurrentWithMainJob(false)}
                    className={`flex h-[40px] items-center rounded-[10px] border px-[16px] text-[14px] ${isConcurrentWithMainJob === false ? 'border-[#5A876E] bg-[#F4F8F5] text-[#5A876E]' : 'border-[#E6E6E6] text-[#8A8A8A]'}`}
                  >
                    아니요
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section className="flex w-[343px] flex-col gap-[24px]">
              <SectionTitle title="부업을 진행하면서" subtitle="특히 어려웠던 점은 무엇이었나요?" />
              <div className="flex flex-col gap-[8px]">
                <span className="text-[14px] font-[500] leading-[16.8px] text-[#131416]">복수 선택 가능 *</span>
                {DIFFICULTY_OPTIONS.map((item) => {
                  const selected = difficulties.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleDifficulty(item)}
                      className={`flex h-[40px] items-center rounded-[10px] border px-[12px] text-left text-[14px] ${selected ? 'border-[#5A876E] bg-[#F4F8F5] text-[#2F5C46]' : 'border-[#E6E6E6] bg-white text-[#8A8A8A]'}`}
                    >
                      <span className="mr-[8px] inline-flex h-[16px] w-[16px] items-center justify-center">
                        {selected ? (
                          <svg viewBox="0 0 16 16" className="h-[14px] w-[14px]" aria-hidden="true">
                            <path d="M3 8.5L6.2 11.5L13 4.5" fill="none" stroke="#5A876E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : null}
                      </span>
                      <span className={selected ? 'font-[500]' : 'font-[400]'}>{item}</span>
                    </button>
                  );
                })}
                {difficulties.includes('기타') ? (
                  <textarea
                    value={difficultyEtc}
                    onChange={(event) => setDifficultyEtc(event.target.value)}
                    placeholder="기타 어려웠던 점을 적어 주세요"
                    className="mt-[8px] h-[96px] w-full resize-none rounded-[10px] border border-[#E6E6E6] px-[12px] py-[10px] text-[14px] text-[#131416] outline-none placeholder:text-[#BABABA]"
                  />
                ) : null}
              </div>
            </section>
          ) : null}

          {step === 4 ? (
            <section className="flex w-[343px] flex-col gap-[20px]">
              <SectionTitle title="경험을 자유롭게 정리해볼까요?" subtitle="최소 10자 이상 작성해주세요 *" />
              <div className="rounded-[12px] bg-[#F8F8F8] px-[12px] py-[12px]">
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value.slice(0, MAX_CONTENT_LENGTH))}
                  placeholder="어떤 계기로 시작했고, 진행하면서 어디가 어려웠는지 편하게 적어주세요"
                  className="h-[220px] w-full resize-none bg-transparent text-[14px] leading-[20px] text-[#131416] outline-none placeholder:text-[#BABABA]"
                />
                <div className="flex justify-end pt-[8px] text-[12px] text-[#8A8A8A]">
                  {content.length} / {MAX_CONTENT_LENGTH}
                </div>
              </div>

              <ExampleCard
                visible={exampleVisible}
                loading={guideLoading}
                error={guideError}
                examples={guideExamples}
                exampleIndex={exampleIndex}
                onToggleVisible={() => setExampleVisible((current) => !current)}
                onPrevious={() => setExampleIndex((current) => (current === 0 ? guideExamples.length - 1 : current - 1))}
                onNext={() => setExampleIndex((current) => (current + 1) % guideExamples.length)}
              />

              <div className="flex flex-col gap-[8px]">
                <span className="text-[14px] font-[500] leading-[16.8px] text-[#131416]">사진 등록 (선택)</span>
                <button
                  type="button"
                  onClick={() => showToast('사진 등록 기능은 준비 중입니다.', 'error')}
                  className="flex h-[64px] w-full items-center justify-center rounded-[10px] border border-[#E9EEE9] bg-white text-[14px] text-[#6A6A6A]"
                >
                  사진을 추가해주세요
                </button>
              </div>
            </section>
          ) : null}
        </main>

        <div className="fixed bottom-[100px] left-1/2 z-20 w-full max-w-[375px] -translate-x-1/2 px-[16px]">
          <button
            type="button"
            disabled={stepDisabled || categoryLoading || submitting}
            onClick={() => void handleNext()}
            className={`flex h-[48px] w-full items-center justify-center rounded-[8px] text-[16px] font-[600] text-white ${stepDisabled || categoryLoading || submitting ? 'bg-[#CBE5D8]' : 'bg-[#5A876E]'}`}
          >
            {submitting ? '처리 중...' : step === 4 ? (isEditMode ? '수정 완료' : '작성 완료') : '다음 단계'}
          </button>
        </div>

        <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-[375px] -translate-x-1/2">
          <BottomNav />
        </div>
      </div>

      {openSheet ? (
        <div className="fixed inset-0 z-[80] bg-[rgba(0,0,0,0.12)]">
          <button type="button" aria-label="닫기" onClick={() => setOpenSheet(null)} className="absolute inset-0" />
          <div className="absolute bottom-0 left-1/2 w-full max-w-[375px] -translate-x-1/2 rounded-t-[24px] bg-white px-[24px] pb-[32px] pt-[24px]">
            <h3 className="pb-[20px] text-center text-[16px] font-[700] text-[#131416]">{openSheet === 'duration' ? '총 진행 기간' : '평균 하루 할애 시간'}</h3>
            <div className="flex flex-col gap-[16px]">
              {(openSheet === 'duration' ? DURATION_OPTIONS : DAILY_TIME_OPTIONS).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    if (openSheet === 'duration') {
                      setDuration(option);
                    } else {
                      setDailyTime(option);
                    }
                    setOpenSheet(null);
                  }}
                  className="text-left text-[14px] leading-[20px] text-[#131416]"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
