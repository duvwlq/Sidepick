import type { ChatbotMessage } from './types';

const STORAGE_KEY = 'sidepick.chatbot.sessions.v1';
const MAX_SESSIONS = 20;

export type StoredChatSession = {
  id: string;
  title: string;
  messages: ChatbotMessage[];
  createdAt: number;
  updatedAt: number;
};

function safeParse(raw: string | null): StoredChatSession[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function loadSessions(): StoredChatSession[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return safeParse(raw).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function saveSession(session: StoredChatSession) {
  if (typeof window === 'undefined') return;
  const sessions = safeParse(window.localStorage.getItem(STORAGE_KEY));
  const existingIndex = sessions.findIndex((s) => s.id === session.id);
  if (existingIndex >= 0) {
    sessions[existingIndex] = session;
  } else {
    sessions.push(session);
  }
  const trimmed = sessions
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_SESSIONS);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function deleteSession(id: string) {
  if (typeof window === 'undefined') return;
  const sessions = safeParse(window.localStorage.getItem(STORAGE_KEY));
  const next = sessions.filter((s) => s.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function formatSessionDate(timestamp: number): string {
  const d = new Date(timestamp);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

export function deriveSessionTitle(messages: ChatbotMessage[]): string {
  const firstUser = messages.find((m) => m.role === 'user');
  if (firstUser) {
    return firstUser.text.length > 30 ? `${firstUser.text.slice(0, 30)}…` : firstUser.text;
  }
  return '새 대화';
}
