import type { UserSummary } from './api';

const CREATE_DRAFT_STORAGE_PREFIX = 'sidepick.createExperienceDraft.v1';

export type CreateExperienceDraftStep = 1 | 2 | 3 | 4;

export type CreateExperienceDraftData = {
  step: CreateExperienceDraftStep;
  selectedCategoryKey: string | null;
  duration: string | null;
  dailyTime: string | null;
  investmentAmount: string;
  monthlyRevenue: string;
  isConcurrentWithMainJob: boolean | null;
  difficulties: string[];
  difficultyEtc: string;
  content: string;
};

export type CreateExperienceDraftEnvelope = {
  version: 1;
  scope: string;
  serverDraftId: string | null;
  updatedAt: string;
  data: CreateExperienceDraftData;
};

export function resolveCreateExperienceDraftScope(user: UserSummary | null) {
  if (user?.id) {
    return `user:${user.id}`;
  }

  if (user?.email) {
    return `email:${user.email}`;
  }

  return 'guest';
}

function getCreateExperienceDraftStorageKey(scope: string) {
  return `${CREATE_DRAFT_STORAGE_PREFIX}:${scope}`;
}

function isValidStep(value: unknown): value is CreateExperienceDraftStep {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

export function readCreateExperienceDraft(scope: string): CreateExperienceDraftEnvelope | null {
  const raw = window.localStorage.getItem(getCreateExperienceDraftStorageKey(scope));
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<CreateExperienceDraftEnvelope>;
    const data = parsed.data;
    if (
      parsed.version !== 1
      || parsed.scope !== scope
      || !data
      || !isValidStep(data.step)
      || !Array.isArray(data.difficulties)
    ) {
      return null;
    }

    return {
      version: 1,
      scope,
      serverDraftId: typeof parsed.serverDraftId === 'string' ? parsed.serverDraftId : null,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
      data: {
        step: data.step,
        selectedCategoryKey: typeof data.selectedCategoryKey === 'string' ? data.selectedCategoryKey : null,
        duration: typeof data.duration === 'string' ? data.duration : null,
        dailyTime: typeof data.dailyTime === 'string' ? data.dailyTime : null,
        investmentAmount: typeof data.investmentAmount === 'string' ? data.investmentAmount : '',
        monthlyRevenue: typeof data.monthlyRevenue === 'string' ? data.monthlyRevenue : '',
        isConcurrentWithMainJob:
          typeof data.isConcurrentWithMainJob === 'boolean' ? data.isConcurrentWithMainJob : null,
        difficulties: data.difficulties.filter((item): item is string => typeof item === 'string'),
        difficultyEtc: typeof data.difficultyEtc === 'string' ? data.difficultyEtc : '',
        content: typeof data.content === 'string' ? data.content : '',
      },
    };
  } catch {
    return null;
  }
}

export function writeCreateExperienceDraft(scope: string, data: CreateExperienceDraftData, serverDraftId: string | null = null) {
  const payload: CreateExperienceDraftEnvelope = {
    version: 1,
    scope,
    serverDraftId,
    updatedAt: new Date().toISOString(),
    data,
  };

  window.localStorage.setItem(getCreateExperienceDraftStorageKey(scope), JSON.stringify(payload));
}

export function clearCreateExperienceDraft(scope: string) {
  window.localStorage.removeItem(getCreateExperienceDraftStorageKey(scope));
}
