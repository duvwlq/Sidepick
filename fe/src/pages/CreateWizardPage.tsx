import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { useRef } from 'react';
import ExampleCard from '../components/create/ExampleCard';
import { useToast } from '../components/common/useToast';
import {
  ApiError,
  analyzeDraftWithAgentA,
  createExperience,
  getCategories,
  getExperience,
  getGuideWritingExamples,
  uploadExperienceImages,
  updateExperience,
  type AgentAQuestionCard,
  type Category,
  type ExperienceUpsertInput,
} from '../lib/api';
import { CATEGORY_VISUALS } from '../lib/category-visuals';
import {
  clearCreateExperienceDraft,
  readCreateExperienceDraft,
  resolveCreateExperienceDraftScope,
  writeCreateExperienceDraft,
} from '../lib/create-experience-draft';
import { extractExperienceImageUrls } from '../lib/experience-images';
import { resolveErrorMessage } from '../lib/resolve-error-message';
import { getAccessToken, getStoredUser } from '../lib/session';

const MIN_CONTENT_LENGTH = 10;
const MAX_CONTENT_LENGTH = 2000;
const MAX_JAVA_INT = 2147483647;
const DURATION_OPTIONS = ['1개월 미만', '1개월', '2개월', '3개월', '4개월', '5개월', '6개월', '7개월', '8개월', '9개월', '10개월', '11개월', '1년 이상'];
const DAILY_TIME_OPTIONS = ['1시간 미만', '1시간', '2시간', '3시간', '4시간', '5시간', '6시간', '7시간', '8시간 이상'];
const DIFFICULTY_OPTIONS = ['고객 확보(마케팅)', '수익 구조 이해', '시간 관리', '수익화 연결', '운영 지속성', '정보 부족', '경쟁 심화', '기타'];
const EXTRA_CATEGORY_CARD = { id: 8, key: 'common', label: '기타', descriptionLines: [] as string[], icon: <span className="h-[50px] w-[50px]" /> };
const CATEGORY_CARDS = [...CATEGORY_VISUALS, EXTRA_CATEGORY_CARD];

type WizardStep = 1 | 2 | 3 | 4;
type OpenSheet = 'duration' | 'dailyTime' | 'photo' | null;
type UploadStatus = 'idle' | 'uploading' | 'error';

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

function toGuideWritingTable(data: {
  categories: Array<{
    id: string;
    category: string;
    examples: Array<{
      pattern: string;
      text: string;
    }>;
  }>;
}): GuideWritingTable {
  return {
    categories: data.categories,
  };
}

type GuideExample = {
  key: string;
  categoryLabel: string;
  difficultyLabel: string;
  guide: string;
};

type AgentAAnswerMap = Record<string, string>;

const CATEGORY_KEY_BY_LABEL: Record<string, string> = {
  '온라인 판매·이커머스': 'online_sales',
  '콘텐츠·SNS 기반': 'content_sns',
  '디지털 상품·지식 판매': 'digital_knowledge',
  '플랫폼 기반 노동형': 'platform_labor',
  '재능 판매·프리랜서': 'freelance',
  '투자·재테크': 'investment',
  '오프라인 기반 부업': 'offline',
  기타: 'common',
  '부업 시작 전 공통': 'common',
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
  common: 'common',
};

function buildFallbackCategories(): Category[] {
  return CATEGORY_VISUALS.map((item) => ({
    id: item.id,
    name: item.label,
    description: item.descriptionLines.join(' '),
    icon: '',
    color: '#5A876E',
    slug: CATEGORY_SLUG_BY_KEY[item.key] ?? null,
    type: 'business_field',
  }));
}

function parseAmount(value: string) {
  const digits = value.replace(/[^\d]/g, '');
  return digits ? Number(digits) : undefined;
}

function exceedsJavaIntRange(value: string) {
  const amount = parseAmount(value);
  return amount !== undefined && amount > MAX_JAVA_INT;
}

function mapDurationToMonths(value: string | null) {
  if (!value) return undefined;
  if (value === '1개월 미만') return 0;
  if (value === '1년 이상') return 12;
  return Number(value.replace(/[^\d]/g, '')) || undefined;
}

function mapMonthsToDuration(value: number | null) {
  if (value == null) return null;
  if (value === 0) return '1개월 미만';
  if (value >= 12) return '1년 이상';
  return `${value}개월`;
}

function mapDailyTime(value: string | null) {
  switch (value) {
    case '1시간 미만':
      return { averageDailyHours: 'UNDER_1_HOUR', weeklyHours: 3 };
    case '1시간':
      return { averageDailyHours: '1_TO_3_HOURS', weeklyHours: 7 };
    case '2시간':
      return { averageDailyHours: '1_TO_3_HOURS', weeklyHours: 14 };
    case '3시간':
      return { averageDailyHours: '1_TO_3_HOURS', weeklyHours: 21 };
    case '4시간':
      return { averageDailyHours: '3_TO_5_HOURS', weeklyHours: 28 };
    case '5시간':
      return { averageDailyHours: '3_TO_5_HOURS', weeklyHours: 35 };
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
    case '1_TO_3_HOURS':
    case 'ONE_TO_THREE_HOURS':
      return '3시간';
    case '3_TO_5_HOURS':
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
  if (key === 'common') return '기타';
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
  imageUrls: string[];
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
    imageUrls: input.imageUrls,
    lessonsLearned: trimmedContent,
    wouldRetry: false,
  };
}

function buildAgentADraft(categorySlug: string, title: string, content: string) {
  return {
    draft: {
      category_slug: categorySlug,
      title,
      body: content.trim(),
    },
  };
}

function isNumericAgentAQuestion(slot: string) {
  return slot === 'timeline' || slot === 'duration' || slot === 'daily_hours';
}

function getNumericAgentAPlaceholder(slot: string) {
  if (slot === 'daily_hours') {
    return '예: 2';
  }
  return '예: 3';
}

function getNumericAgentAUnit(slot: string) {
  if (slot === 'daily_hours') {
    return '시간';
  }
  return '개월';
}

function isValidationLikeError(error: unknown) {
  return error instanceof ApiError && (error.status === 400 || error.status === 422 || error.code === 'VALIDATION_ERROR');
}

function Header({ onClose }: { onClose: () => void }) {
  return (
    <header className="flex h-[64px] w-full flex-col bg-white">
      <div className="flex h-[64px] items-center px-[16px]">
        <button type="button" onClick={onClose} className="flex h-[24px] w-[24px] items-center justify-center">
          <X size={24} strokeWidth={2.1} color="#131416" />
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
    <section className="flex w-[343px] flex-col gap-[5px]">
      <div className="flex items-center justify-between font-['Pretendard'] text-[14px] leading-[16.8px] text-[#131416]">
        <span className="font-[400]">{step}/4 단계</span>
        <span className="font-[600]">{percentage}%</span>
      </div>
      <div className="h-[6px] w-full rounded-full bg-[#D8D8D8]">
        <div className="h-full rounded-full bg-[linear-gradient(90deg,#92BFA6_0%,#5A876E_100%)] transition-all" style={{ width: `${percentage}%` }} />
      </div>
    </section>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center gap-[5px] text-center">
      <h2 className="font-['Pretendard'] text-[20px] font-[600] leading-[24px] text-[#131416]">{title}</h2>
      <p className="font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] text-[#5E5E5E]">{subtitle}</p>
    </div>
  );
}

function SelectField({ label, value, placeholder, onClick }: { label: string; value: string | null; placeholder: string; onClick: () => void }) {
  return (
    <div className="flex flex-col gap-[10px]">
      <span className="text-[14px] font-[500] leading-[16.8px] text-[#131416]">{label}</span>
      <button type="button" onClick={onClick} className="flex h-[40px] w-full items-center justify-between rounded-[10px] border border-[#E6E6E6] bg-white px-[16px] text-[14px] leading-[20px]">
        <span className={value ? 'text-[#131416]' : 'text-[#8A8A8A]'}>{value ?? placeholder}</span>
        <svg viewBox="0 0 16 16" className="h-[16px] w-[16px] text-[#8A8A8A]" aria-hidden="true">
          <path d="M4 6.5L8 10L12 6.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

function MoneyField({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (value: string) => void }) {
  return (
    <div className="flex flex-col gap-[10px]">
      <span className="text-[14px] font-[500] leading-[16.8px] text-[#131416]">{label}</span>
      <label className="flex h-[40px] w-full items-center rounded-[10px] bg-[#F8F8F8] px-[16px] text-[14px] leading-[20px] text-[#131416]">
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

export default function CreateWizardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const draftHydratedRef = useRef(false);
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
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [agentALoading, setAgentALoading] = useState(false);
  const [agentAOpen, setAgentAOpen] = useState(false);
  const [agentAQuestions, setAgentAQuestions] = useState<AgentAQuestionCard[]>([]);
  const [agentAAnswers, setAgentAAnswers] = useState<AgentAAnswerMap>({});
  const [agentAMessage, setAgentAMessage] = useState<string | null>(null);
  const [pendingCreatePayload, setPendingCreatePayload] = useState<PendingPayload | null>(null);
  const galleryImageInputRef = useRef<HTMLInputElement | null>(null);
  const cameraImageInputRef = useRef<HTMLInputElement | null>(null);

  const editingExperienceId = useMemo(() => {
    const raw = searchParams.get('experienceId') ?? searchParams.get('id') ?? searchParams.get('editId');
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }, [searchParams]);

  const isEditMode = editingExperienceId !== null;
  const draftScope = useMemo(() => resolveCreateExperienceDraftScope(getStoredUser()), []);

  useEffect(() => {
    let cancelled = false;
    setCategoryLoading(true);
    getCategories()
      .then((items) => {
        if (!cancelled) setCategories(items);
      })
      .catch((error) => {
        if (!cancelled) {
          setCategories(buildFallbackCategories());
          showToast(resolveErrorMessage(error, '카테고리를 불러오지 못했어요.'), 'error');
        }
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
    getGuideWritingExamples()
      .then((data) => {
        if (!cancelled) {
          setGuideTable(toGuideWritingTable(data));
          setGuideError(null);
        }
      })
      .catch(async () => {
        try {
          const response = await fetch('/guide-writing-examples.json');
          if (!response.ok) {
            throw new Error('guide-writing-examples.json not found');
          }
          const data = (await response.json()) as GuideWritingTable;
          if (!cancelled) {
            setGuideTable(data);
            setGuideError(null);
          }
        } catch {
          if (!cancelled) {
            setGuideError('작성 예시를 불러오지 못했어요.');
          }
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
        setUploadedImageUrls(extractExperienceImageUrls(experience));
      })
      .catch((error) => {
        if (!cancelled) showToast(resolveErrorMessage(error, '수정할 경험을 불러오지 못했어요.'), 'error');
      });

    return () => {
      cancelled = true;
    };
  }, [editingExperienceId, showToast]);

  useEffect(() => {
    if (isEditMode || draftHydratedRef.current) {
      return;
    }

    const draft = readCreateExperienceDraft(draftScope);
    draftHydratedRef.current = true;
    if (!draft) {
      return;
    }

    setStep(draft.data.step);
    setSelectedCategoryKey(draft.data.selectedCategoryKey);
    setDuration(draft.data.duration);
    setDailyTime(draft.data.dailyTime);
    setInvestmentAmount(draft.data.investmentAmount);
    setMonthlyRevenue(draft.data.monthlyRevenue);
    setIsConcurrentWithMainJob(draft.data.isConcurrentWithMainJob);
    setDifficulties(draft.data.difficulties);
    setDifficultyEtc(draft.data.difficultyEtc);
    setContent(draft.data.content);
  }, [draftScope, isEditMode]);

  useEffect(() => {
    if (isEditMode || !draftHydratedRef.current) {
      return;
    }

    writeCreateExperienceDraft(draftScope, {
      step,
      selectedCategoryKey,
      duration,
      dailyTime,
      investmentAmount,
      monthlyRevenue,
      isConcurrentWithMainJob,
      difficulties,
      difficultyEtc,
      content,
    });
  }, [
    content,
    dailyTime,
    difficulties,
    difficultyEtc,
    draftScope,
    duration,
    investmentAmount,
    isConcurrentWithMainJob,
    isEditMode,
    monthlyRevenue,
    selectedCategoryKey,
    step,
  ]);

  useEffect(() => {
    if (!openSheet) return undefined;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenSheet(null);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [openSheet]);

  const selectedCategory = useMemo(() => getCategoryLabelByKey(selectedCategoryKey), [selectedCategoryKey]);
  const uploadingImages = uploadStatus === 'uploading';
  const uploadErrorOpen = uploadStatus === 'error';

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

  function closeWizard() {
    if (!isEditMode) {
      clearCreateExperienceDraft(draftScope);
    }
    navigate(-1);
  }

  function handleStepBack() {
    if (agentAOpen || agentALoading) return;
    if (openSheet) {
      setOpenSheet(null);
      return;
    }
    if (step > 1) {
      setStep((current) => (current - 1) as WizardStep);
      return;
    }
    closeWizard();
  }

  function resetAgentAState() {
    setAgentAOpen(false);
    setAgentAQuestions([]);
    setAgentAAnswers({});
    setAgentAMessage(null);
    setPendingCreatePayload(null);
  }

  async function submitCreatedExperience(token: string, payload: PendingPayload, answers?: AgentAAnswerMap) {
    const created = await createExperience(token, {
      ...payload,
      categoryId: payload.categoryId!,
      content: payload.content,
      lessonsLearned: payload.content,
      aiSupplement: answers
        ? {
            originalContent: payload.content,
            answers: agentAQuestions
              .map((question) => {
                const answer = answers[question.slot]?.trim();
                if (!answer) {
                  return null;
                }
                return {
                  slot: question.slot,
                  question: question.question,
                  answer,
                };
              })
              .filter((item): item is { slot: string; question: string; answer: string } => item !== null),
          }
        : undefined,
    });
    clearCreateExperienceDraft(draftScope);
    resetAgentAState();
    showToast('경험을 등록했어요. AI 분석을 시작합니다.', 'success');
    navigate(`/experiences/${created.id}`);
  }

  async function handleAgentASubmit(skipAnswers = false) {
    const token = getAccessToken();
    if (!token || !pendingCreatePayload) {
      resetAgentAState();
      return;
    }

    const missingRequired = agentAQuestions.some((question) => question.required && !agentAAnswers[question.slot]?.trim());
    if (!skipAnswers && missingRequired) {
      showToast('필수 질문에 답변해 주세요.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await submitCreatedExperience(token, pendingCreatePayload, skipAnswers ? undefined : agentAAnswers);
    } catch (error) {
      if (!skipAnswers && isValidationLikeError(error)) {
        try {
          await submitCreatedExperience(token, pendingCreatePayload);
          showToast('보완 답변 반영 없이 기본 내용으로 저장했어요.', 'info');
          return;
        } catch (retryError) {
          showToast(resolveErrorMessage(retryError, '경험을 처리하지 못했어요.'), 'error');
          return;
        }
      }

      showToast(resolveErrorMessage(error, '경험을 처리하지 못했어요.'), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleImageSelection(fileList: FileList | null) {
    const token = getAccessToken();
    const selectedFiles = Array.from(fileList ?? []);
    if (!selectedFiles.length) {
      return;
    }
    if (!token) {
      showToast('로그인이 필요합니다.', 'error');
      return;
    }
    if (uploadedImageUrls.length + selectedFiles.length > 10) {
      showToast('이미지는 최대 10장까지 업로드할 수 있어요.', 'error');
      return;
    }

    try {
      setUploadStatus('uploading');
      const payload = await uploadExperienceImages(token, selectedFiles);
      setUploadedImageUrls((current) => [...current, ...payload.imageUrls].slice(0, 10));
      setUploadStatus('idle');
      showToast('사진을 업로드했어요.', 'success');
    } catch (error) {
      setUploadStatus('error');
      showToast(resolveErrorMessage(error, '사진을 업로드하지 못했어요.'), 'error');
    } finally {
      if (galleryImageInputRef.current) {
        galleryImageInputRef.current.value = '';
      }
      if (cameraImageInputRef.current) {
        cameraImageInputRef.current.value = '';
      }
    }
  }

  function handleImageInputEvent(event: { currentTarget: HTMLInputElement }) {
    const target = event.currentTarget;
    void handleImageSelection(target.files);
  }

  function openPhotoPicker(target: 'camera' | 'gallery') {
    setOpenSheet(null);
    setUploadStatus('idle');
    const inputRef = target === 'camera' ? cameraImageInputRef : galleryImageInputRef;
    inputRef.current?.click();
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

    if (exceedsJavaIntRange(investmentAmount)) {
      showToast('투자 금액은 21억 4748만 3647원 이하로 입력해 주세요.', 'error');
      return;
    }

    if (exceedsJavaIntRange(monthlyRevenue)) {
      showToast('수익 금액은 21억 4748만 3647원 이하로 입력해 주세요.', 'error');
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
      imageUrls: uploadedImageUrls,
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
        navigate(`/experiences/${editingExperienceId}`);
        return;
      }

      const categorySlug = matchedCategory.slug ?? CATEGORY_SLUG_BY_KEY[selectedCategoryKey ?? 'common'] ?? 'common';

      try {
        setAgentALoading(true);
        const agentAResult = await analyzeDraftWithAgentA(
          token,
          buildAgentADraft(categorySlug, payload.title, payload.content),
        );

        if (agentAResult.needs_questions && agentAResult.questions.length) {
          setPendingCreatePayload({
            ...payload,
            categoryId: matchedCategory.id,
          });
          setAgentAQuestions(agentAResult.questions);
          setAgentAAnswers(Object.fromEntries(agentAResult.questions.map((question) => [question.slot, ''])));
          setAgentAMessage(agentAResult.message);
          setAgentAOpen(true);
          return;
        }
      } catch (error) {
        showToast(resolveErrorMessage(error, '질문 카드 없이 저장을 진행할게요.'), 'error');
      } finally {
        setAgentALoading(false);
      }

      await submitCreatedExperience(token, {
        ...payload,
        categoryId: matchedCategory.id,
      });
    } catch (error) {
      showToast(resolveErrorMessage(error, '경험을 처리하지 못했어요.'), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="mx-auto min-h-screen w-full max-w-[375px] bg-white">
        <Header onClose={closeWizard} />

        <main className="flex flex-col items-center gap-[24px] px-[16px] pb-[128px] pt-[8px]">
          <ProgressBar step={step} />

          {step === 1 ? (
            <section className="flex w-[343px] flex-col gap-[24px]">
              <SectionTitle title="어떤 상황에서 시작하셨나요?" subtitle="경험을 이해하는 데 필요한 정보들이에요" />
              <p className="text-[14px] font-[500] leading-[16.8px] text-[#131416]">어떠한 부업을 경험했었나요? *</p>
              <div className="grid grid-cols-2 gap-[10px]">
                {CATEGORY_CARDS.map((category) => {
                  const selected = selectedCategoryKey === category.key;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setSelectedCategoryKey(category.key)}
                      className={`flex h-[151px] flex-col rounded-[16px] border bg-white px-[14px] py-[16px] text-left transition ${
                        selected ? 'border-[#5A876E] shadow-[0_0_0_1px_rgba(90,135,110,0.08)]' : 'border-[#E6E6E6]'
                      }`}
                    >
                      <div className="flex h-[50px] w-[50px] items-center justify-center">{category.icon}</div>
                      <div className="pt-[14px]">
                        <p className={`text-[14px] leading-[16.8px] ${selected ? 'font-[600] text-[#494949]' : 'font-[400] text-[#777777]'}`}>{category.label}</p>
                        <div className={`pt-[6px] text-[10px] leading-[12px] ${selected ? 'text-[#777777]' : 'text-[#B0B0B0]'}`}>
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
                  <span className="text-[14px] font-[500] leading-[16.8px] text-[#131416]">본업 병행 여부 *</span>
                  <button
                    type="button"
                    onClick={() => setIsConcurrentWithMainJob(true)}
                    className={`flex h-[40px] items-center rounded-[10px] border px-[16px] text-[14px] ${isConcurrentWithMainJob === true ? 'border-[#D9D9D9] bg-white text-[#494949]' : 'border-[#E6E6E6] text-[#8A8A8A]'}`}
                  >
                    <span className="mr-[8px] text-[#C3C3C3]">✓</span>
                    네
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConcurrentWithMainJob(false)}
                    className={`flex h-[40px] items-center rounded-[10px] border px-[16px] text-[14px] ${isConcurrentWithMainJob === false ? 'border-[#D9D9D9] bg-white text-[#494949]' : 'border-[#E6E6E6] text-[#8A8A8A]'}`}
                  >
                    <span className="mr-[8px] text-[#C3C3C3]">✓</span>
                    아니요
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section className="flex w-[343px] flex-col gap-[24px]">
              <h2 className="px-[18px] text-center font-['Pretendard'] text-[20px] font-[600] leading-[24px] text-[#131416]">
                부업을 진행하면서
                <br />
                특히 어려웠던 점은 무엇이었나요?
              </h2>
              <div className="flex flex-col gap-[8px]">
                <span className="text-[14px] font-[500] leading-[16.8px] text-[#131416]">복수 선택 가능 *</span>
                {DIFFICULTY_OPTIONS.map((item) => {
                  const selected = difficulties.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleDifficulty(item)}
                      className={`flex h-[37px] items-center rounded-[10px] border px-[12px] text-left text-[14px] ${selected ? 'border-[#D9D9D9] bg-white text-[#494949]' : 'border-[#E6E6E6] bg-white text-[#8A8A8A]'}`}
                    >
                      <span className="mr-[8px] inline-flex h-[16px] w-[16px] items-center justify-center">
                        <svg viewBox="0 0 16 16" className="h-[14px] w-[14px]" aria-hidden="true">
                          <path d="M3 8.5L6.2 11.5L13 4.5" fill="none" stroke={selected ? '#9A9A9A' : '#D9D9D9'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
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
              <h2 className="text-center font-['Pretendard'] text-[20px] font-[600] leading-[24px] text-[#131416]">경험을 자유롭게 정리해볼까요?</h2>
              <p className="font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] text-[#131416]">최소 10자 이상 작성해주세요 *</p>
              <div className="flex h-[299px] flex-col justify-between rounded-[10px] bg-[#F8F8F8] px-[16px] py-[10px]">
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value.slice(0, MAX_CONTENT_LENGTH))}
                  placeholder="어떤 계기로 시작했고, 진행하면서 어디서 어려움을 겪으셨는지 편하게 적어주세요."
                  className="h-[245px] w-full resize-none bg-transparent font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] text-[#131416] outline-none placeholder:text-[#BABABA]"
                />
                <div className="flex justify-end font-['Pretendard'] text-[12px] leading-[16.8px]">
                  <span className="font-[400] text-[#8A8A8A]">{content.length}</span>
                  <span className="font-[400] text-[#494949]">&nbsp;/ {MAX_CONTENT_LENGTH}</span>
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

              <div className="flex flex-col gap-[10px]">
                <div className="flex items-center gap-[4px] font-['Pretendard'] leading-[16.8px]">
                  <span className="text-[14px] font-[400] text-[#131416]">사진 등록</span>
                  <span className="text-[12px] font-[400] text-[#5E5E5E]">(선택)</span>
                </div>
                <div className="flex gap-[8px]">
                  <button
                    type="button"
                    onClick={() => setOpenSheet('photo')}
                    disabled={uploadingImages || uploadedImageUrls.length >= 10}
                    className={`flex h-[60px] w-[60px] flex-col items-center justify-center rounded-[4px] bg-white shadow-[0_0_2px_rgba(0,0,0,0.15)] ${
                      uploadingImages || uploadedImageUrls.length >= 10 ? 'opacity-60' : 'cursor-pointer'
                    }`}
                  >
                    <svg viewBox="0 0 24 24" className="h-[24px] w-[24px] text-[#1F1F1F]" aria-hidden="true">
                      <path d="M8 7.5L9.5 5.5H14.5L16 7.5H18C19.1 7.5 20 8.4 20 9.5V17C20 18.1 19.1 19 18 19H6C4.9 19 4 18.1 4 17V9.5C4 8.4 4.9 7.5 6 7.5H8Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                      <circle cx="12" cy="13" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                    <span className="pt-[2px] text-[12px] leading-[14px]">
                      <span className="font-[600] text-[#5A876E]">{uploadingImages ? '...' : uploadedImageUrls.length}</span>
                      {!uploadingImages ? <span className="font-[400] text-[#8A8A8A]">/10</span> : null}
                    </span>
                  </button>
                  {uploadedImageUrls.map((imageUrl, index) => (
                    <div key={`${imageUrl}-${index}`} className="relative h-[60px] w-[60px] overflow-hidden rounded-[4px] bg-[#B8B8B8]">
                      <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setUploadedImageUrls((current) => current.filter((_, currentIndex) => currentIndex !== index))}
                        className="absolute right-[2px] top-[2px] flex h-[16px] w-[16px] items-center justify-center rounded-full bg-[rgba(0,0,0,0.7)] text-[10px] leading-none text-white"
                        aria-label="업로드 이미지 제거"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : null}
        </main>

        <div className="fixed bottom-0 left-1/2 z-20 flex h-[91px] w-full max-w-[375px] -translate-x-1/2 items-start border-t border-[#F1F1F1] bg-white px-[16px] pt-[16px]">
          <div className="flex w-full items-center gap-[10px]">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleStepBack}
                className="flex h-[43px] w-[166.5px] items-center justify-center rounded-[10px] border border-[#D8D8D8] bg-white px-[16px] font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] text-[#494949]"
              >
                이전 단계
              </button>
            ) : null}
            <button
              type="button"
              disabled={stepDisabled || categoryLoading || submitting}
              onClick={() => void handleNext()}
              className={`flex h-[43px] items-center justify-center rounded-[10px] font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] text-white ${
                step > 1 ? 'w-[166.5px]' : 'w-full'
              } ${
                stepDisabled || categoryLoading || submitting ? 'bg-[#CBE5D8]' : 'bg-[#5A876E]'
              }`}
            >
              {submitting ? '처리 중...' : step === 4 ? (
                isEditMode ? '수정 완료' : '작성 완료'
              ) : (
                <span className="flex items-center gap-[6px]">
                  다음 단계
                  <svg viewBox="0 0 16 16" className="h-[16px] w-[16px]" aria-hidden="true">
                    <path d="M6 4L10 8L6 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {openSheet ? (
        <div className="fixed inset-0 z-[80] bg-[rgba(0,0,0,0.12)]">
          <button type="button" aria-label="닫기" onClick={() => setOpenSheet(null)} className="absolute inset-0" />
          <div className="absolute bottom-0 left-1/2 w-full max-w-[375px] -translate-x-1/2 rounded-t-[24px] bg-white px-[24px] pb-[32px] pt-[24px]">
            {openSheet === 'photo' ? (
              <>
                <h3 className="pb-[24px] text-center text-[16px] font-[600] text-[#131416]">사진 등록</h3>
                <div className="flex flex-col gap-[36px] pb-[16px]">
                  <button type="button" onClick={() => openPhotoPicker('camera')} className="flex items-center gap-[8px] text-left text-[14px] leading-[20px] text-[#131416]">
                    <svg viewBox="0 0 20 20" className="h-[20px] w-[20px] text-[#131416]" aria-hidden="true">
                      <path d="M6.5 5.5L7.8 4H12.2L13.5 5.5H15.5C16.3 5.5 17 6.2 17 7V13.5C17 14.3 16.3 15 15.5 15H4.5C3.7 15 3 14.3 3 13.5V7C3 6.2 3.7 5.5 4.5 5.5H6.5Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                      <circle cx="10" cy="10.3" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                    <span>사진 촬영</span>
                  </button>
                  <button type="button" onClick={() => openPhotoPicker('gallery')} className="flex items-center gap-[8px] text-left text-[14px] leading-[20px] text-[#131416]">
                    <svg viewBox="0 0 20 20" className="h-[20px] w-[20px] text-[#131416]" aria-hidden="true">
                      <rect x="3.5" y="4.5" width="13" height="11" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="7.2" cy="8.2" r="1.1" fill="currentColor" />
                      <path d="M5.5 13L8.2 10.3L10.4 12.4L12.3 10.6L14.5 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>앨범에서 선택</span>
                  </button>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      ) : null}

      {uploadErrorOpen ? (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-[rgba(0,0,0,0.28)] px-[16px]">
          <button
            type="button"
            aria-label="업로드 실패 모달 닫기"
            className="absolute inset-0"
            onClick={() => setUploadStatus('idle')}
          />
          <div className="relative flex w-full max-w-[300px] flex-col gap-[10px] rounded-[10px] border border-[#E6E6E6] bg-white px-[16px] py-[12px]">
            <div className="font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] text-[#494949]">
              <p>사진 업로드에 실패했어요.</p>
              <p>다시 시도하거나 다른 사진을 선택해주세요.</p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setUploadStatus('idle')}
                className="font-['Pretendard'] text-[14px] font-[600] leading-[16.8px] text-[#5A876E]"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <input
        ref={cameraImageInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onClick={(event) => {
          event.currentTarget.value = '';
        }}
        onChange={handleImageInputEvent}
      />
      <input
        ref={galleryImageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onClick={(event) => {
          event.currentTarget.value = '';
        }}
        onChange={handleImageInputEvent}
      />

      {agentAOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(19,20,22,0.42)] px-[16px]">
          <div className="flex max-h-[85vh] w-full max-w-[375px] flex-col overflow-hidden rounded-[24px] bg-white">
            <div className="flex items-start justify-between px-[24px] pb-[12px] pt-[24px]">
              <div className="flex flex-col gap-[6px] pr-[12px]">
                <h3 className="text-[20px] font-[600] leading-[24px] text-[#131416]">AI 보완 질문</h3>
                <p className="text-[14px] leading-[19.6px] text-[#6F6F6F]">
                  {agentAMessage ?? '분석 정확도를 높이기 위해 몇 가지를 더 알려주세요.'}
                </p>
              </div>
              <button
                type="button"
                aria-label="질문 카드 닫기"
                onClick={() => {
                  if (!submitting) resetAgentAState();
                }}
                className="rounded-full p-[4px] text-[#8A8A8A]"
              >
                <X className="h-[20px] w-[20px]" />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-[16px] overflow-y-auto px-[24px] pb-[20px]">
              {agentAQuestions.map((question, index) => (
                <div key={question.slot} className="flex flex-col gap-[8px] rounded-[16px] border border-[#EAEAEA] p-[16px]">
                  <div className="flex items-center gap-[8px]">
                    <span className="inline-flex h-[24px] min-w-[24px] items-center justify-center rounded-full bg-[#E8F3EC] px-[8px] text-[12px] font-[600] text-[#5A876E]">
                      Q{index + 1}
                    </span>
                    <p className="text-[15px] font-[600] leading-[21px] text-[#131416]">
                      {question.question}
                      {question.required ? ' *' : ''}
                    </p>
                  </div>

                  {question.hint ? (
                    <p className="text-[12px] leading-[16.8px] text-[#8A8A8A]">{question.hint}</p>
                  ) : null}

                  {isNumericAgentAQuestion(question.slot) ? (
                    <label className="flex h-[44px] items-center rounded-[12px] border border-[#E0E0E0] px-[12px]">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        value={agentAAnswers[question.slot] ?? ''}
                        onChange={(event) =>
                          setAgentAAnswers((current) => ({
                            ...current,
                            [question.slot]: event.target.value.replace(/[^\d]/g, ''),
                          }))}
                        placeholder={getNumericAgentAPlaceholder(question.slot)}
                        className="flex-1 bg-transparent text-[14px] text-[#131416] outline-none placeholder:text-[#B6B6B6]"
                      />
                      <span className="text-[13px] text-[#8A8A8A]">{getNumericAgentAUnit(question.slot)}</span>
                    </label>
                  ) : question.input_type === 'select' && question.options?.length ? (
                    <div className="flex flex-wrap gap-[8px]">
                      {question.options.map((option) => {
                        const selected = agentAAnswers[question.slot] === option;
                        return (
                          <button
                            key={`${question.slot}-${option}`}
                            type="button"
                            onClick={() => setAgentAAnswers((current) => ({ ...current, [question.slot]: option }))}
                            className={`rounded-full border px-[12px] py-[8px] text-[13px] ${
                              selected ? 'border-[#5A876E] bg-[#E8F3EC] text-[#2E5C41]' : 'border-[#E0E0E0] text-[#6F6F6F]'
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <input
                      type={question.input_type === 'number' ? 'number' : 'text'}
                      value={agentAAnswers[question.slot] ?? ''}
                      onChange={(event) => setAgentAAnswers((current) => ({ ...current, [question.slot]: event.target.value }))}
                      placeholder={question.input_type === 'tag' ? '쉼표로 구분해 입력해 주세요' : '답변을 입력해 주세요'}
                      className="h-[44px] rounded-[12px] border border-[#E0E0E0] px-[12px] text-[14px] text-[#131416] outline-none placeholder:text-[#B6B6B6]"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-[12px] border-t border-[#F1F1F1] px-[24px] py-[20px]">
              <button
                type="button"
                onClick={() => void handleAgentASubmit(true)}
                disabled={submitting}
                className="h-[48px] rounded-[12px] border border-[#D9D9D9] text-[15px] font-[600] text-[#6F6F6F] disabled:opacity-60"
              >
                그대로 저장
              </button>
              <button
                type="button"
                onClick={() => void handleAgentASubmit(false)}
                disabled={submitting}
                className="h-[48px] rounded-[12px] bg-[#5A876E] text-[15px] font-[600] text-white disabled:opacity-60"
              >
                {submitting ? '저장 중...' : '답변 저장'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
