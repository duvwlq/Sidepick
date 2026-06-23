export { ApiError } from './api-client';
import { request } from './api-client';

export type UserSummary = {
  id: number;
  email: string;
  nickname: string;
  fullName: string | null;
  birthDate: string | null;
  gender: string | null;
  region: string | null;
  signupPurposes: string[];
  experienceStatus: string | null;
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
  slug?: string | null;
  type?: string | null;
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
  caseStatus: 'FAILURE' | 'SUCCESS';
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
  bookmarkCount?: number | null;
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
  explanation?: AnalysisExplanation | null;
};

export type MatchedCase = {
  id: number;
  caseId: string;
  caseTitle: string;
  caseSummary: string;
  keyLesson: string;
  matchRate: number;
  createdAt: string;
  explanation?: SimilarCaseExplanation | null;
};

export type SimilarExperienceMatch = {
  similarExperience: Experience;
  similarityScore: number;
  matchingFactors: string[];
  differenceFactors: string[];
};

export type AnalysisReportSimilarCase = {
  caseId: string;
  title: string;
  summary: string | null;
  keyLesson: string | null;
  matchRate: number;
  explanation?: SimilarCaseExplanation | null;
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
  explanation?: AnalysisExplanation | null;
};

export type AnalysisExplanation = {
  inputUsed: {
    category: string | null;
    bodyExcerpt: string | null;
  } | null;
  matchedPatterns: string[];
  similarCasesUsed: string[];
  isVerified: boolean;
  confidenceScore: number | null;
  debug?: {
    totalSimilarCases?: number | null;
    source?: string | null;
  } | null;
};

export type SimilarCaseExplanation = {
  similarityScore: number | null;
  matchedKeywords: string[];
  categoryMatch?: boolean | null;
  source?: string | null;
  caseId?: string | null;
  debug?: {
    totalSimilarCases?: number | null;
    source?: string | null;
  } | null;
};

export type ExperienceComparePayload = {
  experiences: Experience[];
  commonPatterns: string[];
  differences: string[];
  recommendations: string[];
};

export type OAuthStatePayload = {
  state: string;
  provider: 'KAKAO' | 'GOOGLE' | 'NAVER';
  expiresAt: string;
};

export type BookmarkStatusPayload = {
  experienceId: number;
  bookmarked: boolean;
  bookmarkCount: number;
};

export type ReactionType = 'HEART' | 'TEAR';

export type ReactionSummaryPayload = {
  experienceId: number;
  heartCount: number;
  tearCount: number;
  myReactions: ReactionType[];
};

export type NotificationItem = {
  id: number;
  type: string;
  message: string;
  isRead: boolean;
  targetType: string;
  targetId: number;
  createdAt: string;
};

export type NotificationListPayload = {
  items: NotificationItem[];
};

export type ExperienceGuidePayload = {
  experienceId: number;
  categoryId: number | null;
  categoryKey: string;
  difficultyKey: string;
  guideLines: string[];
};

export type GuideWritingExamplesPayload = {
  version: string;
  lastUpdated: string;
  author: string;
  ticket: string;
  dependsOn: string;
  description: string;
  guideline: {
    length: string;
    tone: string;
    patterns: string[];
  };
  categories: Array<{
    id: string;
    category: string;
    examples: Array<{
      pattern: string;
      text: string;
    }>;
  }>;
};

export type MyAnalysisItem = {
  experienceId: number;
  analysisId: number | null;
  reportStatus: 'READY' | 'NOT_READY' | 'ERROR';
  title: string;
  summary: string | null;
  failureCategory: string | null;
  riskLevel: string | null;
  processedAt: string | null;
  createdAt: string;
};

export type HomeFeedPayload = {
  strategy: string;
  preferredCategoryIds: number[];
  experiences: Experience[];
};

export type ProfileImageUploadPayload = {
  imageUrl: string;
  user: UserSummary;
};

export type ExperienceSharePayload = {
  experienceId: number;
  title: string;
  description: string;
  shareUrl: string;
  imageUrl: string | null;
  caseStatus: string;
  categoryName: string;
};

export type FailurePatternStatItem = {
  label: string;
  count: number;
  percent: number;
};

export type FailurePatternStatsPayload = {
  category: string;
  labelKo: string;
  total: number;
  sufficientData: boolean;
  summary: string;
  explanation: StatsExplanation;
  patterns: FailurePatternStatItem[];
};

export type FailureTimingStatItem = {
  bucket: string;
  label: string;
  order: number;
  count: number;
  percent: number;
};

export type FailureTimingStatsPayload = {
  category: string;
  total: number;
  sufficientData: boolean;
  summary: string;
  explanation: StatsExplanation;
  peakBucket: string;
  distribution: FailureTimingStatItem[];
};

export type StatsExplanation = {
  chartType: string;
  totalCases: number;
  dataSource: string | null;
  lastUpdated: string | null;
  sufficientData: boolean;
  minSampleSize: number;
  insufficientMessage?: string | null;
  debug?: {
    category?: string | null;
    source?: string | null;
  } | null;
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
  imageUrls?: string[];
  lessonsLearned?: string;
  wouldRetry?: boolean;
  aiSupplement?: {
    originalContent: string;
    answers: Array<{
      slot: string;
      question: string;
      answer: string;
    }>;
  };
};

export type ChatbotMessagePayload = {
  status: string;
  reply: string;
  type: string | null;
  sources: string[];
  explanation: Record<string, unknown> | null;
  reason: string | null;
};

export type ExperienceImageUploadPayload = {
  imageUrls: string[];
};

export type AgentAQuestionCard = {
  slot: string;
  question: string;
  input_type: 'text' | 'select' | 'number' | 'tag';
  options: string[] | null;
  required: boolean;
  hint: string | null;
};

export type AgentAAnalyzeDraftPayload = {
  status: 'ok' | 'fallback';
  needs_questions: boolean;
  questions: AgentAQuestionCard[];
  meta: {
    input_tokens: number;
    output_tokens: number;
    elapsed_ms: number;
    used_template: boolean;
    analysis_id?: string | null;
    cache_hit?: boolean | null;
    confidence?: number | null;
    plan_b_triggered?: boolean | null;
  };
  message: string | null;
};

export function register(input: {
  email: string;
  password: string;
  fullName: string;
  birthDate: string;
  gender: string;
  region: string;
  signupPurposes: string[];
  nickname: string;
  experienceStatus: string;
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

export function loginWithKakao(input: { code: string; state: string; redirectUri: string }) {
  return request<AuthPayload>('/auth/oauth/kakao', {
    method: 'POST',
    body: input,
  });
}

export function loginWithGoogle(input: { code: string; state: string; redirectUri: string }) {
  return request<AuthPayload>('/auth/oauth/google', {
    method: 'POST',
    body: input,
  });
}

export function loginWithNaver(input: { code: string; state: string; redirectUri: string }) {
  return request<AuthPayload>('/auth/oauth/naver', {
    method: 'POST',
    body: input,
  });
}

export function issueOAuthState(input: {
  provider: 'KAKAO' | 'GOOGLE' | 'NAVER';
  redirectUri: string;
}) {
  return request<OAuthStatePayload>('/auth/oauth/state', {
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

export function searchCases(params?: {
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
    `/experiences/search${query ? `?${query}` : ''}`,
  );
}

export function getExperience(id: number | string) {
  return request<Experience>(`/experiences/${id}`);
}

export function getExperienceShare(id: number | string) {
  return request<ExperienceSharePayload>(`/experiences/${id}/share`);
}

export function getRelatedSuccessCases(id: number | string, limit = 10) {
  return request<Experience[]>(`/experiences/${id}/success-cases?limit=${limit}`);
}

export function getSimilarExperiences(id: number | string, limit = 10) {
  return request<SimilarExperienceMatch[]>(`/experiences/${id}/similar?limit=${limit}`);
}

export function compareExperiences(experienceIds: number[]) {
  return request<ExperienceComparePayload>('/experiences/compare', {
    method: 'POST',
    body: { experienceIds },
  });
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
    method: 'PUT',
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
  return request<null>(`/experiences/${experienceId}/analysis`, {
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

export function getMyExperiences(token: string) {
  return request<Experience[]>('/users/me/experiences', {
    token,
  });
}

export function getMyBookmarks(token: string) {
  return request<Experience[]>('/users/me/bookmarks', {
    token,
  });
}

export function getMyRecentViews(token: string) {
  return request<Experience[]>('/users/me/recent-views', {
    token,
  });
}

export function getMyAnalysisReports(token: string) {
  return request<MyAnalysisItem[]>('/users/me/analysis-history', {
    token,
  });
}

export function getMyHomeFeed(token: string) {
  return request<HomeFeedPayload>('/users/me/home-feed', {
    token,
  });
}

export function getNotifications(token: string, read?: boolean) {
  const searchParams = new URLSearchParams();
  if (read !== undefined) {
    searchParams.set('read', String(read));
  }

  const query = searchParams.toString();
  return request<NotificationListPayload>(`/notifications${query ? `?${query}` : ''}`, {
    token,
  });
}

export function markNotificationRead(token: string, notificationId: number | string) {
  return request<NotificationItem>(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
    token,
  });
}

export function getExperienceGuide(experienceId: number | string) {
  return request<ExperienceGuidePayload>(`/guides/experiences/${experienceId}`);
}

export function getGuideWritingExamples() {
  return request<GuideWritingExamplesPayload>('/guides/writing-examples');
}

export function sendChatbotMessage(payload: {
  sessionId: string;
  message: string;
  experienceId?: number | null;
}) {
  return request<ChatbotMessagePayload>('/chatbot/message', {
    method: 'POST',
    body: {
      session_id: payload.sessionId,
      experienceId: payload.experienceId ?? null,
      message: payload.message,
    },
  });
}

export function analyzeDraftWithAgentA(
  token: string,
  input: {
    draft: {
      category_slug: string;
      body: string;
      title?: string;
      tone?: string;
      audience?: string;
    };
  },
) {
  return request<AgentAAnalyzeDraftPayload>('/agent-a/analyze-draft', {
    method: 'POST',
    token,
    body: input,
  });
}

export function uploadExperienceImages(token: string, files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  return request<ExperienceImageUploadPayload>('/experiences/images', {
    method: 'POST',
    token,
    body: formData,
  });
}

export function getFailurePatternStats(categorySlug: string) {
  return request<FailurePatternStatsPayload>(`/stats/failure-pattern?category=${encodeURIComponent(categorySlug)}`);
}

export function getFailureTimingStats(categorySlug: string) {
  return request<FailureTimingStatsPayload>(`/stats/failure-timing?category=${encodeURIComponent(categorySlug)}`);
}

export function bookmarkExperience(token: string, experienceId: number | string) {
  return request<BookmarkStatusPayload>(`/experiences/${experienceId}/bookmarks`, {
    method: 'POST',
    token,
  });
}

export function unbookmarkExperience(token: string, experienceId: number | string) {
  return request<BookmarkStatusPayload>(`/experiences/${experienceId}/bookmarks`, {
    method: 'DELETE',
    token,
  });
}

export function getBookmarkStatus(token: string, experienceId: number | string) {
  return request<BookmarkStatusPayload>(`/experiences/${experienceId}/bookmarks/me`, {
    token,
  });
}

export function reactToExperience(
  token: string,
  experienceId: number | string,
  reactionType: ReactionType,
) {
  return request<ReactionSummaryPayload>(`/experiences/${experienceId}/reactions`, {
    method: 'POST',
    token,
    body: { reactionType },
  });
}

export function unreactToExperience(
  token: string,
  experienceId: number | string,
  reactionType: ReactionType,
) {
  return request<ReactionSummaryPayload>(`/experiences/${experienceId}/reactions/${reactionType}`, {
    method: 'DELETE',
    token,
  });
}

export function getReactionSummary(token: string, experienceId: number | string) {
  return request<ReactionSummaryPayload>(`/experiences/${experienceId}/reactions/me`, {
    token,
  });
}

export function updateMe(
  token: string,
  input: {
    nickname: string;
    fullName: string;
    birthDate: string;
    gender: string;
    region: string;
    signupPurposes: string[];
    experienceStatus: string;
    ageGroup: string;
    profileImage?: string | null;
  },
) {
  return request<{ user: UserSummary }>('/users/me', {
    method: 'PATCH',
    token,
    body: input,
  });
}

export function updateMyAccountSettings(
  token: string,
  input: {
    nickname: string;
    experienceStatus: string;
  },
) {
  return request<{ user: UserSummary }>('/users/me/account-settings', {
    method: 'PATCH',
    token,
    body: input,
  });
}

export function uploadMyProfileImage(token: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return request<ProfileImageUploadPayload>('/users/me/profile-image', {
    method: 'POST',
    token,
    body: formData,
  });
}

export function changeMyPassword(
  token: string,
  input: {
    currentPassword: string;
    newPassword: string;
  },
) {
  return request<null>('/users/me/password', {
    method: 'PATCH',
    token,
    body: input,
  });
}
