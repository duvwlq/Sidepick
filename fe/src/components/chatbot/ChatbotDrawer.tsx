import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredUser } from '../../lib/session';
import { sendChatbotMessage, ChatbotApiError } from './chatbotApi';
import ExplanationModal from './ExplanationModal';
import MessageBubble from './MessageBubble';
import {
  deriveSessionTitle,
  formatSessionDate,
  loadSessions,
  saveSession,
  type StoredChatSession,
} from './chatSessionsStorage';
import type { ChatbotMessage } from './types';

type Props = {
  open: boolean;
  onClose: () => void;
};

type ViewMode = 'chat' | 'list';

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const SUGGESTIONS = [
  '스마트스토어 시작해도 괜찮을까요?',
  '초기 비용이 적은 부업은 뭐가 있나요?',
  '배달 부업은 왜 오래 하기 어려울까요?',
  '재능판매를 시작하기 전에 뭘 조심해야 하나요?',
  '부업을 시작하기 전 체크리스트를 알려줘',
];

export default function ChatbotDrawer({ open, onClose }: Props) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [sessionId, setSessionId] = useState<string>(() => makeId());
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [explainTarget, setExplainTarget] = useState<ChatbotMessage | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [sessions, setSessions] = useState<StoredChatSession[]>([]);
  const listRef = useRef<HTMLDivElement | null>(null);

  const nickname = useMemo(() => getStoredUser()?.nickname ?? '', []);

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

  useEffect(() => {
    if (!open) return;
    if (messages.length === 0) return;
    const session: StoredChatSession = {
      id: sessionId,
      title: deriveSessionTitle(messages),
      messages,
      createdAt: messages[0]?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };
    saveSession(session);
  }, [messages, open, sessionId]);

  if (!open) return null;

  function openListView() {
    setSessions(loadSessions());
    setViewMode('list');
  }

  function openSession(session: StoredChatSession) {
    setSessionId(session.id);
    setMessages(session.messages);
    setViewMode('chat');
  }

  function startNewChat() {
    setSessionId(makeId());
    setMessages([]);
    setInput('');
    setViewMode('chat');
  }

  function goGuide() {
    onClose();
    navigate('/faq');
  }

  async function handleSend(forcedText?: string) {
    const text = (forcedText ?? input).trim();
    if (!text) return;

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
      const res = await sendChatbotMessage({ message: text, categorySlug: null });
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
  const isEmpty = messages.length === 0;
  const showSuggestions = isEmpty || inputFocused;
  const greetingName = nickname ? `${nickname}님` : '';

  return (
    <div
      className="fixed inset-0 z-50 bg-white"
      role="dialog"
      aria-modal="true"
      aria-label="사이드픽 챗봇"
    >
      <div className="mx-auto flex h-full w-full max-w-[430px] flex-col bg-white">
        <header className="flex h-[64px] shrink-0 items-center justify-between bg-white px-[16px]">
          <button
            type="button"
            onClick={viewMode === 'list' ? () => setViewMode('chat') : onClose}
            aria-label={viewMode === 'list' ? '뒤로' : '홈으로'}
            className="flex h-[64px] w-[24px] shrink-0 flex-col items-center justify-center"
          >
            {viewMode === 'list' ? <BackIcon /> : <HomeIcon />}
          </button>
          <h2 className="text-[16px] font-semibold leading-[1.2] text-[#131416]">Chat</h2>
          <button
            type="button"
            onClick={viewMode === 'chat' ? openListView : startNewChat}
            aria-label={viewMode === 'chat' ? '대화 이력' : '새 대화'}
            className="flex h-[64px] w-[24px] shrink-0 flex-col items-center justify-center"
          >
            {viewMode === 'chat' ? <MenuIcon /> : <PlusIcon />}
          </button>
        </header>

        {viewMode === 'list' ? (
          <SessionsList sessions={sessions} onSelect={openSession} />
        ) : (
          <>
            <div ref={listRef} className="flex-1 overflow-y-auto">
              {isEmpty ? (
                <EmptyState greetingName={greetingName} />
              ) : (
                <div className="flex flex-col gap-[16px] px-[16px] py-[16px]">
                  {messages.map((m) => (
                    <MessageBubble
                      key={m.id}
                      message={m}
                      onShowExplanation={() => setExplainTarget(m)}
                      onOpenGuide={goGuide}
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
              )}
            </div>

            {showSuggestions ? (
              <div className="border-t border-[#EEEEEE] bg-white px-[16px] py-[12px]">
                <div className="flex flex-col gap-[8px]">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void handleSend(s)}
                      className="w-fit rounded-full border border-[#5A876E] bg-white px-[12px] py-[6px] text-left text-[12px] font-normal leading-[1.2] text-[#5A876E] hover:bg-[#F5FBF7]"
                    >
                      {s}
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
                  aria-label={isSending ? '전송 중지' : '전송'}
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
          </>
        )}
      </div>

      {explainTarget ? (
        <ExplanationModal message={explainTarget} onClose={() => setExplainTarget(null)} />
      ) : null}
    </div>
  );
}

function EmptyState({ greetingName }: { greetingName: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-[24px] pb-[80px]">
      <SidepickLogo />
      <h3 className="mt-[16px] text-center text-[18px] font-semibold leading-[1.4] text-[#131416]">
        {greetingName ? (
          <>
            안녕하세요 {greetingName}
            <br />
            부업 고민, 여기서 같이 살펴봐요
          </>
        ) : (
          <>
            안녕하세요
            <br />
            부업 고민, 여기서 같이 살펴봐요
          </>
        )}
      </h3>
      <p className="mt-[12px] whitespace-pre-line text-center text-[13px] font-normal leading-[1.5] text-[#8A8A8A]">
        {'비슷한 사례가 있는지, 시작 전에 뭘 조심해야 하는지,\n놓치기 쉬운 부분까지 같이 살펴볼게요.'}
      </p>
    </div>
  );
}

function SessionsList({
  sessions,
  onSelect,
}: {
  sessions: StoredChatSession[];
  onSelect: (session: StoredChatSession) => void;
}) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-[24px] py-[80px]">
        <p className="text-center text-[13px] leading-[1.5] text-[#8A8A8A]">
          아직 대화 이력이 없어요.
          <br />첫 질문을 남겨보세요.
        </p>
      </div>
    );
  }
  return (
    <div className="flex-1 overflow-y-auto">
      {sessions.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onSelect(s)}
          className="flex w-full items-center justify-between border-b border-[#EEEEEE] bg-white px-[16px] py-[16px] text-left hover:bg-[#F8F8F8]"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
            <p className="truncate text-[14px] font-semibold leading-[1.2] text-[#131416]">
              {s.title}
            </p>
            <p className="text-[12px] font-normal leading-[1.2] text-[#8A8A8A]">
              {formatSessionDate(s.updatedAt)}
            </p>
          </div>
          <ChevronRightIcon />
        </button>
      ))}
    </div>
  );
}

function LoadingBubble() {
  return (
    <div className="flex w-full justify-start">
      <div className="flex items-start gap-[8px]">
        <span className="inline-flex shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#BEE8CF] bg-white p-[6px]">
          <SidepickMark size={12} color="#5A876E" />
        </span>
        <div className="flex flex-col items-start gap-[4px]">
          <div className="flex h-[33px] w-[43px] items-center justify-center rounded-[10px] bg-white shadow-[0px_0px_2px_rgba(0,0,0,0.15)]">
            <span className="animate-pulse text-[12px] font-normal leading-[1.4] text-[#494949]">
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

function SidepickLogo() {
  return (
    <span className="flex h-[48px] w-[48px] items-center justify-center">
      <SidepickMark size={48} color="#5A876E" />
    </span>
  );
}

function SidepickMark({ size, color }: { size: number; color: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8.97731 4.04216C8.91691 4.11473 8.8253 4.15699 8.7284 4.15699L7.24231 4.15699C7.08253 4.15699 6.953 4.28105 6.953 4.43409C6.953 4.58712 7.08253 4.71118 7.24231 4.71118L8.5634 4.71118C8.73921 4.71118 8.88173 4.84769 8.88173 5.01607V8.56806C8.88173 8.69312 8.80199 8.8055 8.68058 8.85154L0.437369 11.9771C0.13254 12.0927 -0.133638 11.7448 0.0732894 11.5012L2.99999 8.05643C3.06044 7.98528 3.15113 7.94398 3.2469 7.94398H4.73496C4.89474 7.94398 5.02426 7.81992 5.02426 7.66688C5.02426 7.51385 4.89474 7.38979 4.73496 7.38979H3.41386C3.23805 7.38979 3.09553 7.25328 3.09553 7.0849L3.09553 3.44055C3.09553 3.31548 3.17527 3.2031 3.29668 3.15707L11.5627 0.0228384C11.8659 -0.0921479 12.1321 0.252121 11.9287 0.496382L8.97731 4.04216Z"
        fill={color}
      />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[24px] w-[24px]" fill="none" aria-hidden="true">
      <path
        d="M9 22V12H15V22M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
        stroke="#131416"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[24px] w-[24px]" fill="none" aria-hidden="true">
      <path
        d="M14 6L8 12L14 18"
        stroke="#131416"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[24px] w-[24px]" fill="none" aria-hidden="true">
      <path
        d="M3 12H21M3 6H21M3 18H21"
        stroke="#131416"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[24px] w-[24px]" fill="none" aria-hidden="true">
      <path
        d="M12 5V19M5 12H19"
        stroke="#131416"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-[16px] w-[16px]" fill="none" aria-hidden="true">
      <path
        d="M8 3V13M4 7L8 3L12 7"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
