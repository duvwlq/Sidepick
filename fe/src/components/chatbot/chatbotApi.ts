import type { ChatbotResponse } from './types';
import { resolveApiBaseUrl } from '../../lib/runtime-base-url';
import { getAccessToken } from '../../lib/session';

const API_BASE_URL = resolveApiBaseUrl();
const CHATBOT_SESSION_KEY = 'sidepick.chatbotSessionId';

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  errorCode?: string | null;
  traceId?: string | null;
  data: T;
  timestamp?: string;
};

type BackendChatbotResponse = {
  status: 'success' | 'fallback';
  reply: string;
  type?: string | null;
  sources?: string[] | null;
  explanation?: Record<string, unknown> | null;
  reason?: string | null;
};

function getChatbotSessionId() {
  if (typeof window === 'undefined') {
    return 'server-session';
  }

  const existing = window.localStorage.getItem(CHATBOT_SESSION_KEY);
  if (existing) {
    return existing;
  }

  const created = `chatbot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  window.localStorage.setItem(CHATBOT_SESSION_KEY, created);
  return created;
}

export class ChatbotApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ChatbotApiError';
    this.status = status;
  }
}

export async function sendChatbotMessage(params: {
  message: string;
  categorySlug?: string | null;
}): Promise<ChatbotResponse> {
  const url = `${API_BASE_URL}/chatbot/message`;
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      session_id: getChatbotSessionId(),
      message: params.message,
    }),
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const errBody = (await response.json()) as ApiEnvelope<null> | { detail?: string };
      if (
        typeof errBody === 'object' &&
        errBody !== null &&
        'message' in errBody &&
        typeof errBody.message === 'string'
      ) {
        detail = errBody.message;
      } else if (
        typeof errBody === 'object' &&
        errBody !== null &&
        'detail' in errBody &&
        typeof errBody.detail === 'string'
      ) {
        detail = errBody.detail;
      }
    } catch {
      // ignore
    }
    throw new ChatbotApiError(detail, response.status);
  }

  const body = (await response.json()) as ApiEnvelope<BackendChatbotResponse>;
  const data = body.data;

  return {
    status: data.status,
    reply: data.reply,
    route: data.type ?? null,
    cited_case_ids: data.sources ?? [],
    plan_b_reason: data.reason ?? null,
    confidence: null,
    tool_calls: [],
    sections: null,
    metadata: data.explanation ?? null,
  };
}
