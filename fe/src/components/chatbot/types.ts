export type ChatbotToolCall = {
  name: string;
  result_count?: number;
  category?: string;
};

export type ChatbotSections =
  | {
      type: 'cross_topic';
      procedure_steps?: string[];
      answer?: string;
      warnings?: string;
    }
  | {
      type: 'business_field';
      tips?: string[];
      failure_factors?: string[];
      warnings?: string;
    };

export type ChatbotResponse = {
  status: 'ok' | 'fallback' | 'blocked' | 'guide_redirect';
  reply: string;
  route?: string | null;
  cited_case_ids: string[];
  plan_b_reason?: string | null;
  confidence?: number | null;
  tool_calls: ChatbotToolCall[];
  sections?: ChatbotSections | null;
  metadata?: Record<string, unknown> | null;
};

export type ChatbotMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  status?: ChatbotResponse['status'];
  citedCaseIds?: string[];
  confidence?: number | null;
  toolCalls?: ChatbotToolCall[];
  planBReason?: string | null;
  sections?: ChatbotSections | null;
  metadata?: Record<string, unknown> | null;
  createdAt: number;
};

export const CATEGORY_OPTIONS = [
  { slug: null, label: '전체' },
  { slug: 'online-commerce', label: '온라인 판매' },
  { slug: 'content-sns', label: '콘텐츠·SNS' },
  { slug: 'digital-products', label: '디지털 상품' },
  { slug: 'platform-labor', label: '플랫폼 노동' },
  { slug: 'talent-freelance', label: '재능·프리랜스' },
  { slug: 'investment', label: '투자' },
  { slug: 'offline-sidejob', label: '오프라인 부업' },
] as const;

export type CategoryOption = (typeof CATEGORY_OPTIONS)[number];
