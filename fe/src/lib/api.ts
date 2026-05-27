export { ApiError } from './api-client';
import { request } from './api-client';

export type UserSummary = {
  id: number;
  email: string;
  nickname: string;
  ageGroup: string;
  profileImage: string | null;
  authProvider: 'LOCAL' | 'KAKAO' | 'GOOGLE' | 'NAVER';
  emailVerified: boolean;
  profileCompleted: boolean;
  createdAt: string;
};

export type AuthPayload = {
  user: UserSummary;
  tokenType: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  emailVerificationRequired: boolean;
};

export type EmailVerificationPayload = {
  email: string;
  status: string;
  verificationCode?: string | null;
  expiresAt: string;
};

export type Category = {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
};

export type AnalysisSummary = {
  structuredSummary: string;
  extractedPatterns: string[];
  keywords: string[];
  failureCategory: string;
  riskLevel: string;
  riskFactors: string[];
  successFactors: string[];
  confidenceScore: number | null;
};

export type Experience = {
  id: number;
  author: UserSummary;
  category: Category;
  title: string;
  content: string;
  businessType: string | null;
  investmentAmount: number | null;
  durationMonths: number | null;
  weeklyHours: number | null;
  averageDailyHours: string | null;
  isConcurrentWithMainJob: boolean | null;
  monthlyRevenue: number | null;
  failureReason: string | null;
  failureReasons: string[];
  difficulties: string[];
  difficultyEtc: string | null;
  difficultyExtra: string | null;
  targetMarket: string | null;
  marketingChannels: string[];
  lessonsLearned: string | null;
  wouldRetry: boolean | null;
  analysis: AnalysisSummary | null;
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
  keywords: string[];
  failureCategory: string;
  riskLevel: string;
  riskFactors: string[];
  successFactors: string[];
  structuredSummary: string;
  confidenceScore: number | null;
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

export type AnalysisReportSimilarCase = {
  caseId: string;
  title: string;
  summary: string | null;
  keyLesson: string | null;
  matchRate: number;
};

export type AnalysisReport = {
  experienceId: number;
  analysisId: number | null;
  reportStatus: 'READY' | 'NOT_READY' | 'ERROR';
  title: string | null;
  summary: string | null;
  extractedPatterns: string[];
  keywords: string[];
  failureCategory?: string | null;
  riskLevel?: string | null;
  riskFactors: string[];
  advice: string[];
  confidenceScore: number | null;
  processedAt: string | null;
  similarCases: AnalysisReportSimilarCase[];
};

export type ExperienceUpsertInput = {
  title?: string;
  content: string;
  categoryId: number;
  businessType?: string;
  investmentAmount?: number;
  durationMonths?: number;
  weeklyHours?: number;
  averageDailyHours?: string;
  isConcurrentWithMainJob?: boolean;
  monthlyRevenue?: number;
  failureReason?: string;
  failureReasons?: string[];
  difficulties?: string[];
  difficultyEtc?: string;
  difficultyExtra?: string;
  targetMarket?: string;
  marketingChannels?: string[];
  lessonsLearned?: string;
  wouldRetry?: boolean;
};

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

export function requestEmailVerification(input: { email: string }) {
  return request<EmailVerificationPayload>('/auth/email-verifications', {
    method: 'POST',
    body: input,
  });
}

export function confirmEmailVerification(input: {
  email: string;
  code: string;
}) {
  return request<EmailVerificationPayload>('/auth/email-verifications/confirm', {
    method: 'POST',
    body: input,
  });
}

export function loginWithKakao(input: { code: string; redirectUri: string }) {
  return request<AuthPayload>('/auth/oauth/kakao', {
    method: 'POST',
    body: input,
  });
}

export function loginWithGoogle(input: { code: string; redirectUri: string }) {
  return request<AuthPayload>('/auth/oauth/google', {
    method: 'POST',
    body: input,
  });
}

export function loginWithNaver(input: { code: string; redirectUri: string }) {
  return request<AuthPayload>('/auth/oauth/naver', {
    method: 'POST',
    body: input,
  });
}

export function getCategories() {
  return request<Category[]>('/categories');
}

export function getExperiences(params?: {
  page?: number;
  size?: number;
  categoryId?: number;
  failureReason?: string;
  q?: string;
  sort?: 'latest' | 'popular';
}) {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) {
    searchParams.set('page', String(params.page));
  }
  if (params?.size !== undefined) {
    searchParams.set('size', String(params.size));
  }
  if (params?.categoryId !== undefined) {
    searchParams.set('categoryId', String(params.categoryId));
  }
  if (params?.failureReason) {
    searchParams.set('failureReason', params.failureReason);
  }
  if (params?.q) {
    searchParams.set('q', params.q);
  }
  if (params?.sort) {
    searchParams.set('sort', params.sort);
  }

  const query = searchParams.toString();
  return request<ExperienceListPayload>(
    `/experiences${query ? `?${query}` : ''}`,
  );
}

export function getExperience(id: number | string) {
  return request<Experience>(`/experiences/${id}`);
}

export function createExperience(token: string, input: ExperienceUpsertInput) {
  return request<Experience>('/experiences', {
    method: 'POST',
    token,
    body: input,
  });
}

export function updateExperience(
  token: string,
  id: number | string,
  input: ExperienceUpsertInput,
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

export function getReport(experienceId: number | string) {
  return request<AnalysisReport>(`/reports/${experienceId}`);
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

export function updateMe(
  token: string,
  input: { nickname: string; ageGroup: string; profileImage?: string | null },
) {
  return request<{ user: UserSummary }>('/users/me', {
    method: 'PATCH',
    token,
    body: input,
  });
}
