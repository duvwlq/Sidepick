import type { ChatbotResponse } from './types';

const AI_BASE_URL =
  import.meta.env.VITE_AI_BASE_URL ?? 'http://localhost:8000';

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
  const url = `${AI_BASE_URL}/api/chatbot/message`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: params.message,
      category_slug: params.categorySlug ?? null,
    }),
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const errBody = await response.json();
      if (typeof errBody?.detail === 'string') detail = errBody.detail;
    } catch {
      // ignore
    }
    throw new ChatbotApiError(detail, response.status);
  }

  return (await response.json()) as ChatbotResponse;
}
