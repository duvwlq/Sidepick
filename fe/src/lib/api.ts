const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081/api';

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type UserSummary = {
  id: number;
  email: string;
  nickname: string;
  ageGroup: string;
  profileImage: string | null;
  createdAt: string;
};

export type AuthPayload = {
  user: UserSummary;
  tokenType: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
};

export type Category = {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
};

export type Experience = {
  id: number;
  author: UserSummary;
  category: Category;
  title: string;
  content: string;
  businessType: string;
  investmentAmount: number | null;
  durationMonths: number | null;
  failureReason: string;
  targetMarket: string | null;
  marketingChannels: string[];
  lessonsLearned: string | null;
  wouldRetry: boolean | null;
  structuredData: Record<string, unknown>;
  viewCount: number;
  likeCount: number;
  hasPatternAnalysis: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ExperienceListPayload = {
  experiences: Experience[];
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
  };
};

export type PatternAnalysis = {
  id: number;
  experienceId: number;
  extractedPatterns: string[];
  riskFactors: string[];
  successFactors: string[];
  structuredSummary: string;
  confidenceScore: number;
  processedAt: string;
};

export type MatchedCase = {
  id: number;
  caseId: string;
  caseTitle: string;
  caseSummary: string;
  keyLesson: string;
  matchRate: number;
  createdAt: string;
};

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
};

async function request<T>(path: string, options: RequestOptions = {}) {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const json = (await response.json()) as ApiEnvelope<T | { detail?: string }>;
  if (!response.ok || !json.success) {
    const detail =
      typeof json.data === 'object' && json.data && 'detail' in json.data
        ? json.data.detail
        : undefined;
    throw new ApiError(
      detail ?? json.message ?? 'API request failed.',
      response.status,
    );
  }

  return json.data as T;
}

export function register(input: {
  email: string;
  password: string;
  nickname: string;
  ageGroup: string;
}) {
  return request<AuthPayload>('/auth/register', {
    method: 'POST',
    body: input,
  });
}

export function login(input: { email: string; password: string }) {
  return request<AuthPayload>('/auth/login', {
    method: 'POST',
    body: input,
  });
}

export function getCategories() {
  return request<Category[]>('/categories');
}

export function getExperiences() {
  return request<ExperienceListPayload>('/experiences');
}

export function getExperience(id: number | string) {
  return request<Experience>(`/experiences/${id}`);
}

export function createExperience(
  token: string,
  input: {
    title: string;
    content: string;
    categoryId: number;
    businessType: string;
    investmentAmount?: number;
    durationMonths?: number;
    failureReason: string;
    targetMarket?: string;
    marketingChannels?: string[];
    lessonsLearned?: string;
    wouldRetry?: boolean;
  },
) {
  return request<Experience>('/experiences', {
    method: 'POST',
    token,
    body: input,
  });
}

export function updateExperience(
  token: string,
  id: number | string,
  input: {
    title: string;
    content: string;
    categoryId: number;
    businessType: string;
    investmentAmount?: number;
    durationMonths?: number;
    failureReason: string;
    targetMarket?: string;
    marketingChannels?: string[];
    lessonsLearned?: string;
    wouldRetry?: boolean;
  },
) {
  return request<Experience>(`/experiences/${id}`, {
    method: 'PATCH',
    token,
    body: input,
  });
}

export function deleteExperience(token: string, id: number | string) {
  return request<null>(`/experiences/${id}`, {
    method: 'DELETE',
    token,
  });
}

export function getAnalysis(experienceId: number | string) {
  return request<PatternAnalysis>(`/experiences/${experienceId}/analysis`);
}

export function createAnalysis(token: string, experienceId: number | string) {
  return request<PatternAnalysis>(`/experiences/${experienceId}/analysis`, {
    method: 'POST',
    token,
  });
}

export function getMatchedCases(token: string, analysisId: number | string) {
  return request<MatchedCase[]>(`/analysis/${analysisId}/matched-cases`, {
    token,
  });
}

export function getMe(token: string) {
  return request<{ user: UserSummary }>('/users/me', {
    token,
  });
}
