import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoaderCircle, X } from 'lucide-react';
import { useRef } from 'react';
import AgentAQuestionModal from '../components/create/AgentAQuestionModal';
import ExampleCard from '../components/create/ExampleCard';
import { useToast } from '../components/common/useToast';
import {
  analyzeDraftWithAgentA,
  createExperience,
  getCategories,
  getExperience,
  updateExperience,
  type AgentAAnalyzeDraftPayload,
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
import { resolveErrorMessage } from '../lib/resolve-error-message';
import { getAccessToken, getStoredUser } from '../lib/session';

const MIN_CONTENT_LENGTH = 10;
const MAX_CONTENT_LENGTH = 2000;
const SUPPLEMENTARY_CHECK_MIN_MS = 1200;
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

function Header({ onClose }: { onClose: () => void }) {
  return (
    <header className="flex h-[123px] w-full flex-col bg-white">
      <div className="h-[59px] px-[16px] pt-[17px]">
        <div className="flex items-center justify-between text-[17px] font-[600] text-black">
          <span>9:41</span>
          <div className="flex items-center gap-[8px]">
            <span className="block h-[13px] w-[18px] rounded-[2px] border-[2px] border-black" />
          </div>
        </div>
      </div>
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
    <div className="flex flex-col items-start gap-[20px] text-left">
      <h2 className="font-['Pretendard'] text-[20px] font-[600] leading-[24px] text-[#131416]">{title}</h2>
      <p className="font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] text-[#131416]">{subtitle}</p>
    </div>
  );
}

function SelectField({ label, value, placeholder, onClick }: { label: string; value: string | null; placeholder: string; onClick: () => void }) {
  return (
    <div className="flex flex-col gap-[10px]">
      <span className="text-[14px] font-[500] leading-[16.8px] text-[#131416]">{label}</span>
      <button type="button" onClick={onClick} className="flex h-[40px] w-full items-center justify-between rounded-[10px] border border-[#E6E6E6] px-[16px] text-[14px] leading-[20px] text-[#8A8A8A]">
        <span>{value ?? placeholder}</span>
        <span className="text-[16px] text-[#8A8A8A]">?</span>
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
  const [submitting, setSubmitting] = useState(false);
  const [agentAResult, setAgentAResult] = useState<AgentAAnalyzeDraftPayload | null>(null);
  const [agentALoading, setAgentALoading] = useState(false);
  const [agentAModalOpen, setAgentAModalOpen] = useState(false);
  const [agentAQuestionIndex, setAgentAQuestionIndex] = useState(0);
  const [agentAAnswers, setAgentAAnswers] = useState<Record<string, string>>({});
  const [submitAfterAgentA, setSubmitAfterAgentA] = useState(false);
  const [checkingSupplementaryQuestions, setCheckingSupplementaryQuestions] = useState(false);
  const [savedExperienceId, setSavedExperienceId] = useState<number | null>(null);

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

  useEffect(() => {
    setAgentAResult(null);
    setAgentAModalOpen(false);
    setAgentAQuestionIndex(0);
    setAgentAAnswers({});
    setSubmitAfterAgentA(false);
    setCheckingSupplementaryQuestions(false);
  }, [content, matchedCategory?.slug, selectedCategoryKey]);

  useEffect(() => {
    setSavedExperienceId(editingExperienceId);
  }, [editingExperienceId]);

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

  async function analyzeCurrentDraft(token: string) {
    const categorySlug = matchedCategory?.slug ?? (selectedCategoryKey ? CATEGORY_SLUG_BY_KEY[selectedCategoryKey] : null);

    if (!categorySlug || content.trim().length < MIN_CONTENT_LENGTH) {
      showToast('카테고리와 본문을 먼저 입력해 주세요.', 'error');
      return null;
    }

    try {
      setAgentALoading(true);
      const result = await analyzeDraftWithAgentA(token, {
        draft: {
          category_slug: categorySlug,
          body: content.trim(),
          title: selectedCategory ? `${selectedCategory} 경험` : undefined,
        },
      });
      setAgentAResult(result);
      setAgentAQuestionIndex(0);
      setAgentAAnswers({});
      return result;
    } catch (error) {
      const fallbackResult: AgentAAnalyzeDraftPayload = {
        status: 'fallback',
        needs_questions: false,
        questions: [],
        meta: {
          input_tokens: 0,
          output_tokens: 0,
          elapsed_ms: 0,
          used_template: true,
          analysis_id: null,
          cache_hit: null,
          confidence: null,
          plan_b_triggered: false,
        },
        message: resolveErrorMessage(error, '질문 카드를 불러오지 못했어요. 지금 내용으로 계속 작성해도 됩니다.'),
      };
      setAgentAResult(fallbackResult);
      return fallbackResult;
    } finally {
      setAgentALoading(false);
    }
  }

  async function handleRecommendQuestions() {
    const token = getAccessToken();
    if (!token) {
      navigate('/auth?next=%2Fcreate');
      return;
    }

    setSubmitAfterAgentA(false);
    const result = await analyzeCurrentDraft(token);
    if (result?.status === 'ok' && result.needs_questions && result.questions.length > 0) {
      setAgentAModalOpen(true);
      return;
    }

    setAgentAModalOpen(false);
  }

  function buildContentWithAgentAAnswers(baseContent: string, answerMap = agentAAnswers) {
    const answeredEntries = Object.entries(answerMap)
      .map(([slot, value]) => [slot, value.trim()] as const)
      .filter(([, value]) => value.length > 0);

    if (answeredEntries.length === 0) {
      return baseContent.trimEnd();
    }

    const questionMap = new Map((agentAResult?.questions ?? []).map((question) => [question.slot, question.question]));
    const addition = answeredEntries
      .map(([slot, value]) => '- ' + (questionMap.get(slot) ?? slot) + ': ' + value)
      .join('\n');

    const trimmed = baseContent.trimEnd();
    const sectionTitle = '\n\n[AI 보완 답변]\n';
    if (trimmed.includes('[AI 보완 답변]')) {
      return (trimmed + '\n' + addition).slice(0, MAX_CONTENT_LENGTH);
    }
    return (trimmed + sectionTitle + addition).slice(0, MAX_CONTENT_LENGTH);
  }

  async function persistExperience(token: string, finalContent: string) {
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
      content: finalContent,
      matchedCategory,
    });

    if (isEditMode && editingExperienceId !== null) {
      const updated = await updateExperience(token, editingExperienceId, {
        ...payload,
        categoryId: matchedCategory.id,
      });
      showToast('경험을 수정했어요.', 'success');
      return updated;
    }

    const created = await createExperience(token, {
      ...payload,
      categoryId: matchedCategory.id,
    });
    clearCreateExperienceDraft(draftScope);
    showToast('경험을 등록했어요. 분석을 이어서 준비할게요.', 'success');
    return created;
  }

  async function handleAgentAComplete() {
    const token = getAccessToken();
    if (!token) {
      navigate('/auth?next=%2Fcreate');
      return;
    }

    const finalContent = buildContentWithAgentAAnswers(content);
    setContent(finalContent);
    setAgentAModalOpen(false);

    if (!submitAfterAgentA) {
      showToast('보완 답변이 본문에 반영됐어요.', 'success');
      return;
    }

    if (!savedExperienceId) {
      showToast('저장된 경험을 찾지 못했어요.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await updateExperience(token, savedExperienceId, {
        ...buildPendingPayload({
          selectedCategory,
          duration,
          dailyTime,
          investmentAmount,
          monthlyRevenue,
          isConcurrentWithMainJob,
          difficulties,
          difficultyEtc,
          content: finalContent,
          matchedCategory,
        }),
        categoryId: matchedCategory!.id,
      });
      navigate(`/experiences/${savedExperienceId}`);
    } catch (error) {
      showToast(resolveErrorMessage(error, '경험을 처리하지 못했어요.'), 'error');
    } finally {
      setSubmitting(false);
      setSubmitAfterAgentA(false);
    }
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

    try {
      setSubmitting(true);
      setCheckingSupplementaryQuestions(true);
      const saved = await persistExperience(token, content.trim());
      if (!saved?.id) {
        return;
      }
      setSavedExperienceId(saved.id);

      const startedAt = Date.now();
      const result = await analyzeCurrentDraft(token);
      if (!result) {
        navigate(`/experiences/${saved.id}`);
        return;
      }

      const elapsed = Date.now() - startedAt;
      if (elapsed < SUPPLEMENTARY_CHECK_MIN_MS) {
        await new Promise((resolve) => window.setTimeout(resolve, SUPPLEMENTARY_CHECK_MIN_MS - elapsed));
      }

      if (result.status === 'ok' && result.needs_questions && result.questions.length > 0) {
        setSubmitAfterAgentA(true);
        setAgentAModalOpen(true);
        return;
      }

      setSubmitAfterAgentA(false);
      setAgentAModalOpen(false);
      navigate(`/experiences/${saved.id}`);
    } catch (error) {
      showToast(resolveErrorMessage(error, '보완 질문 확인 중 문제가 발생했어요.'), 'error');
    } finally {
      setCheckingSupplementaryQuestions(false);
      setSubmitting(false);
    }
  }
  return (
    <>
      <div className="mx-auto min-h-screen w-full max-w-[375px] bg-white">
        <Header onClose={closeWizard} />

        <main className="flex flex-col items-center gap-[24px] px-[16px] pb-[128px] pt-[16px]">
          <ProgressBar step={step} />

          {step === 1 ? (
            <section className="flex w-[343px] flex-col gap-[24px]">
              <SectionTitle title="어떤 상황에서 시작하셨나요?" subtitle="경험을 이해하는 데 필요한 정보들이에요" />
              <p className="text-[14px] font-[500] leading-[16.8px] text-[#131416]">어떠한 부업을 경험했었나요? *</p>
              <div className="grid grid-cols-2 gap-[10px]">
                {CATEGORY_VISUALS.map((category) => {
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
                <button
                  type="button"
                  onClick={() => showToast('사진 등록 기능은 준비 중입니다.', 'error')}
                  className="flex w-full flex-col items-center gap-[4px] rounded-[10px] bg-white px-[16px] py-[12px] shadow-[0_0_2px_rgba(0,0,0,0.1)]"
                >
                  <span className="font-['Pretendard'] text-[14px] font-[500] leading-[19.6px] text-[#494949]">사진을 추가해주세요</span>
                  <span className="flex h-[36px] w-[36px] items-center justify-center rounded-full border-[1.5px] border-[#5A876E] p-[4px]">
                    <svg viewBox="0 0 20 20" className="h-[20px] w-[20px] text-[#5A876E]" aria-hidden="true">
                      <path d="M10 4v12M4 10h12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>
              </div>
            </section>
          ) : null}
        </main>

        <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-[375px] -translate-x-1/2 border-t border-[#F1F1F1] bg-white px-[16px] pb-[24px] pt-[12px]">
          <div className="flex items-center gap-[8px]">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleStepBack}
                className="flex h-[43px] flex-1 items-center justify-center rounded-[8px] border border-[#D8D8D8] bg-white px-[16px] font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] text-[#494949]"
              >
                뒤로가기
              </button>
            ) : null}
            <button
              type="button"
              disabled={stepDisabled || categoryLoading || submitting}
              onClick={() => void handleNext()}
              className={`flex h-[43px] ${step > 1 ? 'flex-1' : 'w-full'} items-center justify-center rounded-[8px] font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] text-white ${
                stepDisabled || categoryLoading || submitting ? 'bg-[#CBE5D8]' : 'bg-[#5A876E]'
              }`}
            >
              {submitting ? '처리 중...' : step === 4 ? '다음' : '다음 단계'}
            </button>
          </div>
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

      <AgentAQuestionModal
        open={agentAModalOpen && (agentAResult?.questions?.length ?? 0) > 0}
        questions={agentAResult?.questions ?? []}
        answers={agentAAnswers}
        currentIndex={agentAQuestionIndex}
        onClose={() => { setAgentAModalOpen(false); setSubmitAfterAgentA(false); }}
        onAnswerChange={(slot, value) => setAgentAAnswers((current) => ({ ...current, [slot]: value }))}
        onSkip={() => {
          setAgentAQuestionIndex((current) => Math.min(current + 1, Math.max((agentAResult?.questions.length ?? 1) - 1, 0)));
        }}
        onNext={() => {
          setAgentAQuestionIndex((current) => Math.min(current + 1, Math.max((agentAResult?.questions.length ?? 1) - 1, 0)));
        }}
        onComplete={() => { void handleAgentAComplete(); }}
      />

      {checkingSupplementaryQuestions ? (
        <SubmissionCheckingOverlay nickname={getStoredUser()?.nickname ?? '사용자'} />
      ) : null}
    </>
  );
}

function SubmissionCheckingOverlay({ nickname }: { nickname: string }) {
  return (
    <div className="fixed inset-0 z-[140] bg-white">
      <div className="mx-auto min-h-screen w-full max-w-[375px] bg-white">
        <div className="flex h-[59px] items-center justify-between px-[24px] pb-[19px] pt-[21px]">
          <div className="text-[17px] font-[600] leading-[22px] text-black">9:41</div>
          <div className="flex items-center gap-[7px]">
            <div className="flex h-[12px] items-end gap-[2px]">
              <span className="block h-[4px] w-[3px] rounded-[1px] bg-black" />
              <span className="block h-[6px] w-[3px] rounded-[1px] bg-black" />
              <span className="block h-[8px] w-[3px] rounded-[1px] bg-black" />
              <span className="block h-[10px] w-[3px] rounded-[1px] bg-black" />
            </div>
            <div className="relative h-[12px] w-[17px]">
              <div className="absolute inset-0 rounded-[2px] border border-black/90" />
              <div className="absolute left-[2px] top-[2px] h-[6px] w-[9px] rounded-[1px] bg-black" />
              <div className="absolute right-[-2px] top-[3px] h-[4px] w-[1.5px] rounded-full bg-black" />
            </div>
            <div className="relative h-[13px] w-[27px] rounded-[4px] border border-black/60 p-[1px]">
              <div className="h-full w-[70%] rounded-[3px] bg-black" />
            </div>
          </div>
        </div>

        <div className="flex min-h-[calc(100vh-59px)] flex-col items-center justify-center gap-[20px] px-[16px] pb-[120px]">
          <div className="text-center text-[24px] leading-[28.8px] text-[#131416]">
            <p>
              <span className="font-[700] text-[#5A876E]">{nickname}</span>
              <span className="font-[400]">님의</span>
            </p>
            <p className="pt-[4px] font-[400]">경험을 분석하고 있어요!</p>
          </div>

          <div className="flex flex-col items-center gap-[12px]">
            <LoaderCircle size={24} strokeWidth={2.2} className="animate-spin text-[#5E5E5E]" />
            <p className="text-[12px] leading-[16.8px] text-[#8A8A8A]">잠시만 기다려주세요.</p>
          </div>
        </div>
      </div>
    </div>
  );
}










