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
  const [inputFocused, setInputFocused] = useState(false);
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
            ? '답변을 준비하는 중 문제가 발생했어요.\n잠시 후 다시 시도해주세요.'
            : '답변을 준비하는 중 문제가 발생했어요.\n잠시 후 다시 시도해주세요.',
        status: 'fallback',
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsSending(false);
    }
  }

  const lastMessage = messages[messages.length - 1];
  const showRetryCta =
    !isSending && lastMessage?.role === 'assistant' && lastMessage.status === 'fallback';

  return (
    <div
      className="fixed inset-0 z-50 bg-white"
      role="dialog"
      aria-modal="true"
      aria-label="사이드픽 챗봇"
    >
      <div className="mx-auto flex h-full w-full max-w-[430px] flex-col bg-white">
        <header className="flex h-[64px] items-center justify-between bg-white px-[16px] py-[20px]">
          <button
            type="button"
            onClick={onClose}
            aria-label="홈으로"
            className="flex h-[24px] w-[24px] items-center justify-center"
          >
            <HomeIcon />
          </button>
          <h2 className="text-[16px] font-semibold leading-[1.2] text-[#131416]">Chat</h2>
          <button
            type="button"
            aria-label="대화 이력"
            className="flex h-[24px] w-[24px] items-center justify-center"
          >
            <MenuIcon />
          </button>
        </header>

        <div className="border-b border-[#EEEEEE] px-[16px] pb-[10px]">
          <select
            className="w-full rounded-[8px] border border-[#EEEEEE] bg-white px-[12px] py-[8px] text-[12px] text-[#131416]"
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

        <div ref={listRef} className="flex-1 overflow-y-auto px-[16px] py-[16px]">
          <div className="flex flex-col gap-[16px]">
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                onShowExplanation={() => setExplainTarget(m)}
              />
            ))}
            {isSending ? <LoadingBubble /> : null}
            {showRetryCta ? (
              <div className="flex justify-start pl-[32px]">
                <button
                  type="button"
                  onClick={() => void handleSend(messages[messages.length - 2]?.text)}
                  className="flex h-[32px] items-center gap-[4px] rounded-[8px] border border-[#EEEEEE] bg-white px-[12px] py-[8px] text-[12px] font-semibold text-[#131416] hover:bg-[#F8F8F8]"
                >
                  다시 시도
                  <ChevronRightIcon />
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {messages.length <= 1 ? (
          <div className="border-t border-[#EEEEEE] px-[16px] py-[10px]">
            <p className="mb-[6px] text-[11px] font-semibold text-[#8A8A8A]">
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
                  className="rounded-[999px] border border-[#EEEEEE] bg-white px-[10px] py-[5px] text-[12px] text-[#494949] hover:bg-[#F8F8F8]"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <form
          className="border-t border-[#EEEEEE] px-[16px] pb-[32px] pt-[12px]"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend();
          }}
        >
          <div
            className={`flex h-[48px] items-center gap-[8px] rounded-[999px] border border-[#EEEEEE] px-[16px] py-[12px] ${
              inputFocused ? 'bg-white' : 'bg-[#F8F8F8]'
            } ${isSending ? 'bg-[#F8F8F8]' : ''}`}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder={isSending ? '답변 작성 중입니다' : '어떤 부업이 궁금하세요?'}
              disabled={isSending}
              className="flex-1 bg-transparent text-[14px] font-normal leading-[1.4] text-[#494949] outline-none placeholder:text-[#BABABA]"
            />
            <button
              type="submit"
              disabled={!canSubmit && !isSending}
              aria-label={isSending ? '전송 중' : '전송'}
              className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-[#5A876E]"
            >
              {isSending ? (
                <span className="h-[8px] w-[8px] rounded-[1px] bg-white" />
              ) : (
                <ArrowUpIcon />
              )}
            </button>
          </div>
        </form>
      </div>

      {explainTarget ? (
        <ExplanationModal message={explainTarget} onClose={() => setExplainTarget(null)} />
      ) : null}
    </div>
  );
}

function LoadingBubble() {
  return (
    <div className="flex w-full justify-start">
      <div className="flex items-start gap-[8px]">
        <span className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-[#5A876E] text-[12px] font-semibold text-white">
          S
        </span>
        <div className="flex flex-col items-start gap-[4px]">
          <div className="flex h-[33px] w-[43px] items-center justify-center rounded-[10px] bg-white shadow-[0px_0px_2px_rgba(0,0,0,0.15)]">
            <span className="text-[12px] font-normal leading-[1.4] text-[#494949] animate-pulse">
              •••
            </span>
          </div>
          <span className="text-[12px] font-normal leading-[1.4] text-[#BABABA]">
            정보를 탐색하고 있어요.
          </span>
        </div>
      </div>
    </div>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[24px] w-[24px]" fill="none" aria-hidden="true">
      <path
        d="M4 10L12 4L20 10V20H14V14H10V20H4V10Z"
        stroke="#131416"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[24px] w-[24px]" fill="none" aria-hidden="true">
      <path d="M4 7H20M4 12H20M4 17H20" stroke="#131416" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-[16px] w-[16px]" fill="none" aria-hidden="true">
      <path d="M8 3V13M4 7L8 3L12 7" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-[16px] w-[16px]" fill="none" aria-hidden="true">
      <path
        d="M6 4L10 8L6 12"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
