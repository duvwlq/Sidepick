import { useEffect, useMemo, useRef, useState } from 'react';
import { sendChatbotMessage, ChatbotApiError } from './chatbotApi';
import ExplanationModal from './ExplanationModal';
import MessageBubble from './MessageBubble';
import { CATEGORY_OPTIONS, type CategoryOption, type ChatbotMessage } from './types';

type Props = {
  open: boolean;
  onClose: () => void;
};

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const WELCOME: ChatbotMessage = {
  id: 'welcome',
  role: 'assistant',
  text:
    '안녕하세요! 사이드픽 챗봇이에요. 부업 분야를 골라주시고 궁금한 점을 입력해주세요. 검색된 실제 사례 데이터를 인용해 답변드려요.',
  createdAt: Date.now(),
};

const SUGGESTIONS = [
  { label: '스마트스토어 시작', text: '스마트스토어 시작 어떻게 해야 해?', categorySlug: 'online-commerce' },
  { label: '배달 부업 수익', text: '배달 부업 한 달 수익 얼마나 돼?', categorySlug: 'platform-labor' },
  { label: '유튜브 vs 인스타', text: '유튜브와 인스타 부업 수익 비교해줘', categorySlug: 'content-sns' },
  { label: '세금 (가이드 안내)', text: '부업하면 세금 어떻게 내요?', categorySlug: null },
];

export default function ChatbotDrawer({ open, onClose }: Props) {
  const [messages, setMessages] = useState<ChatbotMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [categorySlug, setCategorySlug] = useState<CategoryOption['slug']>(null);
  const [isSending, setIsSending] = useState(false);
  const [explainTarget, setExplainTarget] = useState<ChatbotMessage | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const canSubmit = useMemo(
    () => input.trim().length > 0 && !isSending,
    [input, isSending],
  );

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    });
  }, [messages, open]);

  if (!open) return null;

  async function handleSend(forcedText?: string, forcedSlug?: string | null) {
    const text = (forcedText ?? input).trim();
    if (!text) return;
    const slug = forcedSlug !== undefined ? forcedSlug : categorySlug;

    const userMsg: ChatbotMessage = {
      id: makeId(),
      role: 'user',
      text,
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    try {
      const res = await sendChatbotMessage({ message: text, categorySlug: slug });
      const botMsg: ChatbotMessage = {
        id: makeId(),
        role: 'assistant',
        text: res.reply,
        status: res.status,
        citedCaseIds: res.cited_case_ids,
        confidence: res.confidence ?? null,
        toolCalls: res.tool_calls,
        planBReason: res.plan_b_reason ?? null,
        metadata: res.metadata ?? null,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errMsg: ChatbotMessage = {
        id: makeId(),
        role: 'assistant',
        text:
          err instanceof ChatbotApiError
            ? `AI 서버 응답 오류 (${err.status}). 서버가 실행 중인지 확인해주세요.`
            : 'AI 서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요.',
        status: 'fallback',
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="flex h-[90vh] w-full max-w-[430px] flex-col rounded-t-[20px] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="사이드픽 챗봇"
      >
        <header className="flex items-center justify-between border-b border-[#EDEEF0] px-[20px] py-[14px]">
          <div className="flex items-center gap-[8px]">
            <span className="flex h-[28px] w-[28px] items-center justify-center rounded-full bg-[#131416] text-[14px] text-white">
              💬
            </span>
            <div>
              <h2 className="text-[15px] font-semibold text-[#131416]">사이드픽 챗봇</h2>
              <p className="text-[11px] text-[#8A8A8A]">Claude Sonnet 4.5 · 환각율 0% 검증</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-[6px] text-[#8A8A8A] hover:bg-[#F4F5F6]"
            aria-label="닫기"
          >
            ✕
          </button>
        </header>

        <div className="border-b border-[#EDEEF0] px-[20px] py-[10px]">
          <label className="block text-[11px] font-semibold uppercase text-[#8A8A8A]">
            부업 분야
          </label>
          <select
            className="mt-[4px] w-full rounded-[8px] border border-[#D9DBDF] bg-white px-[10px] py-[6px] text-[13px] text-[#131416]"
            value={categorySlug ?? ''}
            onChange={(e) => setCategorySlug((e.target.value || null) as CategoryOption['slug'])}
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.slug ?? ''}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto px-[20px] py-[16px]">
          <div className="flex flex-col gap-[14px]">
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                onShowExplanation={() => setExplainTarget(m)}
              />
            ))}
            {isSending ? (
              <div className="flex w-full justify-start">
                <div className="rounded-[14px] bg-[#F4F5F6] px-[14px] py-[10px] text-[13px] text-[#8A8A8A]">
                  사례를 검색하고 답변을 생성하는 중...
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {messages.length <= 1 ? (
          <div className="border-t border-[#EDEEF0] px-[20px] py-[10px]">
            <p className="mb-[6px] text-[11px] font-semibold uppercase text-[#8A8A8A]">
              빠른 질문 예시
            </p>
            <div className="flex flex-wrap gap-[6px]">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => {
                    setCategorySlug(s.categorySlug as CategoryOption['slug']);
                    void handleSend(s.text, s.categorySlug);
                  }}
                  className="rounded-[14px] border border-[#D9DBDF] bg-white px-[10px] py-[5px] text-[12px] text-[#494949] hover:bg-[#F4F5F6]"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <form
          className="flex items-center gap-[8px] border-t border-[#EDEEF0] px-[16px] py-[12px]"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend();
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="궁금한 부업 질문을 입력하세요 (5~500자)"
            disabled={isSending}
            className="flex-1 rounded-[10px] border border-[#D9DBDF] bg-white px-[12px] py-[9px] text-[14px] text-[#131416] outline-none focus:border-[#131416]"
          />
          <button
            type="submit"
            disabled={!canSubmit}
            className={`rounded-[10px] px-[14px] py-[9px] text-[13px] font-semibold ${
              canSubmit
                ? 'bg-[#131416] text-white hover:bg-[#000]'
                : 'bg-[#D9DBDF] text-[#8A8A8A]'
            }`}
          >
            전송
          </button>
        </form>
      </div>

      {explainTarget ? (
        <ExplanationModal message={explainTarget} onClose={() => setExplainTarget(null)} />
      ) : null}
    </div>
  );
}
