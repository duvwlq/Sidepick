import type { Experience } from './api';

type MatchingTableGuideEntry = {
  guide?: string;
};

type MatchingTablePayload = {
  guides?: Record<string, MatchingTableGuideEntry>;
};

const DEFAULT_CATEGORY_KEY = 'freelance';
const DEFAULT_DIFFICULTY_KEY = 'information_lack';
const DEFAULT_GUIDE_KEY = `${DEFAULT_CATEGORY_KEY}__${DEFAULT_DIFFICULTY_KEY}`;

const DIFFICULTY_ALIASES: Record<string, string[]> = {
  customer_acquisition: [
    '고객확보',
    '마케팅',
    '홍보',
    '타깃고객',
    '고객유입',
    '유입',
    'customer',
    'acquisition',
    'promotion',
    'marketinglack',
  ],
  revenue_structure: [
    '수익구조',
    '마진',
    '수수료',
    '자금부족',
    'revenue',
    'profit',
    'margin',
    'pricing',
  ],
  time_management: [
    '시간관리',
    '시간부족',
    '일정',
    'time',
    'schedule',
    'executionoverload',
  ],
  monetization: [
    '수익화',
    '매출',
    'monetization',
  ],
  sustainability: [
    '운영지속성',
    '지속',
    '번아웃',
    '운영',
    'sustain',
    'operation',
    'operations',
  ],
  information_lack: [
    '정보부족',
    '시장조사',
    '검증부족',
    '타깃분석실패',
    'validation',
    'research',
    'information',
    'marketvalidationgap',
    'targetanalysisfailure',
  ],
  competition: [
    '경쟁',
    '포화',
    '경쟁심화',
    '경쟁분석부족',
    'competition',
    'competitionanalysisfailure',
  ],
};

let guideIndexPromise: Promise<Map<string, string[]>> | null = null;

function normalize(value: string | null | undefined) {
  if (!value) {
    return '';
  }

  return value
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replaceAll(' ', '')
    .replaceAll('_', '')
    .replaceAll('-', '')
    .replaceAll('(', '')
    .replaceAll(')', '')
    .replaceAll('/', '')
    .replaceAll(',', '')
    .replaceAll('.', '')
    .replaceAll(/[^\p{L}\p{N}]+/gu, '');
}

function extractGuideActions(guide: string) {
  if (!guide.trim()) {
    return [];
  }

  return guide
    .replaceAll('\r\n', '\n')
    .split('\n\n')
    .map((part) => part.trim())
    .filter((part) => /^[123]\..+/.test(part))
    .map((part) => part.replace(/^[123]\.\s*/, '').replaceAll('\n', ' ').trim())
    .filter(Boolean)
    .slice(0, 3);
}

function mapCategoryKey(experience: Experience) {
  switch (experience.category.id) {
    case 1:
      return 'online_sales';
    case 2:
      return 'content_sns';
    case 3:
      return 'digital_products';
    case 4:
      return 'platform_work';
    case 5:
      return 'freelance';
    case 6:
      return 'investment';
    case 7:
      return 'offline_work';
    default:
      return DEFAULT_CATEGORY_KEY;
  }
}

function mapDifficultyLabel(raw: string | null | undefined) {
  const normalized = normalize(raw);
  if (!normalized) {
    return null;
  }

  for (const [difficultyKey, aliases] of Object.entries(DIFFICULTY_ALIASES)) {
    if (aliases.some((alias) => normalized.includes(normalize(alias)))) {
      return difficultyKey;
    }
  }

  return null;
}

function mapDifficultyKey(experience: Experience) {
  for (const difficulty of experience.difficulties) {
    const mapped = mapDifficultyLabel(difficulty);
    if (mapped) {
      return mapped;
    }
  }

  const mappedFailureReason = mapDifficultyLabel(experience.failureReason);
  if (mappedFailureReason) {
    return mappedFailureReason;
  }

  const mappedAnalysisCategory = mapDifficultyLabel(experience.analysis?.failureCategory);
  if (mappedAnalysisCategory) {
    return mappedAnalysisCategory;
  }

  const mappedSummary = mapDifficultyLabel(experience.analysis?.structuredSummary);
  if (mappedSummary) {
    return mappedSummary;
  }

  return DEFAULT_DIFFICULTY_KEY;
}

async function loadGuideIndex() {
  if (!guideIndexPromise) {
    guideIndexPromise = fetch('/matching-table.json')
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('matching-table.json not found');
        }
        return response.json() as Promise<MatchingTablePayload>;
      })
      .then((payload) => {
        const entries = Object.entries(payload.guides ?? {}).flatMap(([key, value]) => {
          const actions = extractGuideActions(value.guide ?? '');
          return actions.length === 3 ? [[key, actions] as const] : [];
        });
        return new Map(entries);
      });
  }

  return guideIndexPromise;
}

export async function resolveExperienceGuideLines(experience: Experience) {
  const guideIndex = await loadGuideIndex();
  const guideKey = `${mapCategoryKey(experience)}__${mapDifficultyKey(experience)}`;
  return guideIndex.get(guideKey) ?? guideIndex.get(DEFAULT_GUIDE_KEY) ?? [];
}
