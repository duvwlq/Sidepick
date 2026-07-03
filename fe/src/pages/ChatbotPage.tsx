import { ArrowLeft, Menu, MoveUp, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ExplanationModal from '../components/chatbot/ExplanationModal';
import { sendChatbotMessage, ChatbotApiError } from '../components/chatbot/chatbotApi';
import {
  CATEGORY_OPTIONS,
  type CategoryOption,
  type ChatbotMessage,
  type ChatbotSections,
} from '../components/chatbot/types';
import { getFailurePatternStats, type FailurePatternStatsPayload } from '../lib/api';
import { resolveErrorMessage } from '../lib/resolve-error-message';

type Suggestion = {
  label: string;
  text: string;
  categorySlug: CategoryOption['slug'];
};

const CATEGORY_TO_ID: Record<Exclude<CategoryOption['slug'], null>, number> = {
  'online-commerce': 1,
  'content-sns': 2,
  'digital-products': 3,
  'platform-labor': 4,
  'talent-freelance': 5,
  investment: 6,
  'offline-sidejob': 7,
};

const WELCOME: ChatbotMessage = {
  id: 'welcome',
  role: 'assistant',
  text:
    '질문 내용을 남겨주시면 실제 실패 사례와 통계를 바탕으로 핵심 리스크를 바로 정리해드릴게요.',
  createdAt: Date.now(),
};

const SUGGESTIONS: Suggestion[] = [
  {
    label: '스마트스토어 시작',
    text: '스마트스토어를 처음 시작할 때 가장 많이 하는 실수와 먼저 점검할 순서를 알려줘.',
    categorySlug: 'online-commerce',
  },
  {
    label: '배달 부업 수익성',
    text: '배달 부업을 시작할 때 수익보다 먼저 확인해야 할 리스크를 알려줘.',
    categorySlug: 'platform-labor',
  },
  {
    label: 'SNS 판매 전략',
    text: '인스타그램으로 판매를 시작할 때 준비 부족으로 망하는 패턴을 알려줘.',
    categorySlug: 'content-sns',
  },
  {
    label: '디지털 상품 검증',
    text: '전자책이나 템플릿 판매 전에 수요 검증을 어떻게 해야 하는지 알려줘.',
    categorySlug: 'digital-products',
  },
];

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatTime(createdAt: number) {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(createdAt);
}

function extractSections(message: ChatbotMessage) {
  if (message.sections) {
    return message.sections;
  }

  return null;
}

function splitMessageText(text: string) {
  return text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function buildSectionRows(sections: ChatbotSections | null) {
  if (!sections) {
    return [];
  }

  if (sections.type === 'business_field') {
    return [
      { title: '실전 팁', items: sections.tips ?? [] },
      { title: '실패 요인 TOP3', items: sections.failure_factors ?? [] },
      { title: '주의사항', items: sections.warnings ? [sections.warnings] : [] },
    ].filter((section) => section.items.length > 0);
  }

  return [
    { title: '이렇게 확인하세요', items: sections.procedure_steps ?? [] },
    { title: '답변', items: sections.answer ? [sections.answer] : [] },
    { title: '주의사항', items: sections.warnings ? [sections.warnings] : [] },
  ].filter((section) => section.items.length > 0);
}

function CategoryChips({
  value,
  onChange,
}: {
  value: CategoryOption['slug'];
  onChange: (next: CategoryOption['slug']) => void;
}) {
  return (
    <div className="overflow-x-auto px-[16px] pb-[8px] pt-[6px]">
      <div className="flex w-max gap-[8px] pr-[16px]">
        {CATEGORY_OPTIONS.map((option) => {
          const active = option.slug === value;
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => onChange(option.slug)}
              className={`shrink-0 rounded-full border px-[12px] py-[8px] text-[12px] font-[600] transition ${
                active
                  ? 'border-[#5A876E] bg-[#E2F0E7] text-[#375E49]'
                  : 'border-[#E5E7EB] bg-white text-[#6B7280]'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AssistantCard({ message }: { message: ChatbotMessage }) {
  const sections = buildSectionRows(extractSections(message));
  const paragraphs = splitMessageText(message.text);

  return (
    <div className="w-full rounded-[18px] border border-[#E6E8EB] bg-white px-[16px] py-[14px] shadow-[0_8px_24px_rgba(17,24,39,0.05)]">
      {sections.length > 0 ? (
        <div className="flex flex-col gap-[14px]">
          {sections.map((section) => (
            <section key={section.title} className="flex flex-col gap-[8px]">
              <h3 className="text-[15px] font-[700] leading-[1.35] text-[#2F6B4F]">{section.title}</h3>
              <div className="flex flex-col gap-[8px] text-[14px] leading-[1.65] text-[#1F2937]">
                {section.items.map((item, index) => (
                  <p key={`${section.title}-${index}`}>{item}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-[12px] text-[14px] leading-[1.7] text-[#1F2937]">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function FailurePatternCard({
  stats,
  loading,
  error,
}: {
  stats: FailurePatternStatsPayload | null;
  loading: boolean;
  error: string;
}) {
  const items = stats?.patterns?.slice(0, 3) ?? [];

  return (
    <div className="w-full rounded-[18px] border border-[#E6E8EB] bg-white px-[16px] py-[14px] shadow-[0_8px_24px_rgba(17,24,39,0.05)]">
      <div className="flex items-center gap-[8px]">
        <span className="text-[24px] font-[700] leading-none text-[#8DB69A]">!</span>
        <div>
          <h3 className="text-[18px] font-[700] leading-[1.2] text-[#8DB69A]">실패 패턴</h3>
          <p className="mt-[4px] text-[13px] leading-[1.5] text-[#6B7280]">
            카테고리에서 자주 보이는 실패 요인 비중입니다.
          </p>
        </div>
      </div>

      {loading ? <p className="mt-[18px] text-[13px] text-[#9CA3AF]">통계를 불러오는 중입니다.</p> : null}
      {!loading && error ? <p className="mt-[18px] text-[13px] text-[#B3261E]">{error}</p> : null}
      {!loading && !error && items.length === 0 ? (
        <p className="mt-[18px] text-[13px] text-[#9CA3AF]">표시할 통계가 아직 없습니다.</p>
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <>
          <div className="mt-[18px] flex flex-col gap-[16px]">
            {items.map((item) => (
              <div key={item.label} className="flex flex-col gap-[6px]">
                <div className="flex items-center justify-between text-[14px] text-[#4B5563]">
                  <span>{item.label}</span>
                  <span>{Math.round(item.percent)}%</span>
                </div>
                <div className="h-[6px] overflow-hidden rounded-full bg-[#E5E7EB]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#7EB291_0%,#CFE4D6_100%)]"
                    style={{ width: `${Math.max(item.percent, 6)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="mt-[18px] text-center text-[13px] font-[600] text-[#6A977A]">
            {stats?.summary ?? ''}
          </p>
        </>
      ) : null}
    </div>
  );
}

function ChatInput({
  value,
  disabled,
  canSubmit,
  onChange,
  onSubmit,
}: {
  value: string;
  disabled: boolean;
  canSubmit: boolean;
  onChange: (next: string) => void;
  onSubmit: () => void;
}) {
  return (
    <form
      className="border-t border-[#F0F2F4] bg-white px-[16px] pb-[18px] pt-[12px]"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex items-center gap-[10px] rounded-full border border-[#E7E9EC] bg-[#F8F8F8] px-[16px] py-[10px] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="어떤 부업이 궁금하세요?"
          disabled={disabled}
          className="h-[24px] flex-1 border-none bg-transparent text-[15px] text-[#111827] outline-none placeholder:text-[#B6BBC4]"
        />
        <button
          type="submit"
          disabled={!canSubmit}
          aria-label="메시지 전송"
          className={`flex h-[32px] w-[32px] items-center justify-center rounded-full transition ${
            canSubmit ? 'bg-[#5A876E] text-white' : 'bg-[#D1D5DB] text-white'
          }`}
        >
          <MoveUp size={18} strokeWidth={2.3} />
        </button>
      </div>
    </form>
  );
}

export default function ChatbotPage() {
  const navigate = useNavigate();
  const listRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<ChatbotMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [categorySlug, setCategorySlug] = useState<CategoryOption['slug']>('online-commerce');
  const [isSending, setIsSending] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');
  const [patternStats, setPatternStats] = useState<FailurePatternStatsPayload | null>(null);
  const [explainTarget, setExplainTarget] = useState<ChatbotMessage | null>(null);

  const latestAssistantMessage = useMemo(() => {
    return [...messages].reverse().find((message) => message.role === 'assistant' && message.id !== 'welcome') ?? null;
  }, [messages]);

  const canSubmit = input.trim().length > 0 && !isSending;

  useEffect(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: 'smooth',
      });
    });
  }, [messages, statsLoading, patternStats]);

  useEffect(() => {
    if (!categorySlug || messages.length <= 1) {
      setPatternStats(null);
      setStatsError('');
      setStatsLoading(false);
      return;
    }

    let active = true;
    setStatsLoading(true);
    setStatsError('');

    void getFailurePatternStats(categorySlug)
      .then((payload) => {
        if (!active) {
          return;
        }
        setPatternStats(payload);
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        setPatternStats(null);
        setStatsError(resolveErrorMessage(error, '실패 패턴 통계를 불러오지 못했습니다.'));
      })
      .finally(() => {
        if (active) {
          setStatsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [categorySlug, messages.length]);

  async function handleSend(forcedText?: string, forcedCategory?: CategoryOption['slug']) {
    const text = (forcedText ?? input).trim();
    if (!text) {
      return;
    }

    const nextCategory = forcedCategory !== undefined ? forcedCategory : categorySlug;
    const userMessage: ChatbotMessage = {
      id: makeId(),
      role: 'user',
      text,
      createdAt: Date.now(),
    };

    setMessages((current) => [...current, userMessage]);
    setInput('');
    setIsSending(true);
    setCategorySlug(nextCategory);

    try {
      const response = await sendChatbotMessage({
        message: text,
        categorySlug: nextCategory,
      });

      const assistantMessage: ChatbotMessage = {
        id: makeId(),
        role: 'assistant',
        text: response.reply,
        status: response.status,
        citedCaseIds: response.cited_case_ids,
        confidence: response.confidence ?? null,
        toolCalls: response.tool_calls,
        planBReason: response.plan_b_reason ?? null,
        sections: response.sections ?? null,
        metadata: response.metadata ?? null,
        createdAt: Date.now(),
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (error) {
      const fallbackText =
        error instanceof ChatbotApiError
          ? `AI 응답을 불러오지 못했습니다. (${error.status}) 잠시 후 다시 시도해주세요.`
          : 'AI 서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.';

      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: 'assistant',
          text: fallbackText,
          status: 'fallback',
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FCFCFB]">
      <div className="mx-auto flex min-h-screen w-full max-w-[375px] flex-col bg-[#FCFCFB]">
        <header className="sticky top-0 z-20 border-b border-[#F1F3F5] bg-[#FCFCFB]/95 backdrop-blur">
          <div className="flex h-[64px] items-center justify-between px-[16px]">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-[32px] w-[32px] items-center justify-center rounded-full text-[#111827]"
              aria-label="뒤로 가기"
            >
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-[17px] font-[700] leading-none text-[#111827]">Chat</h1>
            <button
              type="button"
              disabled
              className="flex h-[32px] w-[32px] items-center justify-center rounded-full text-[#111827]"
              aria-label="메뉴"
            >
              <Menu size={22} />
            </button>
          </div>
          <CategoryChips value={categorySlug} onChange={setCategorySlug} />
        </header>

        <div ref={listRef} className="flex-1 overflow-y-auto px-[16px] pb-[24px] pt-[18px]">
          <div className="flex flex-col gap-[14px]">
            {messages.map((message) => {
              const isUser = message.role === 'user';
              const isLatestAssistant = latestAssistantMessage?.id === message.id;
              const hasExplanation =
                message.role === 'assistant' &&
                ((message.citedCaseIds?.length ?? 0) > 0 || (message.toolCalls?.length ?? 0) > 0);

              return (
                <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex w-full max-w-[327px] flex-col gap-[8px] ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`flex items-end gap-[8px] ${isUser ? 'flex-row-reverse' : ''}`}>
                      {!isUser ? (
                        <div className="flex h-[28px] w-[28px] items-center justify-center rounded-full border border-[#B7D3C1] bg-[#EFF7F2] text-[#5A876E]">
                          <Sparkles size={15} strokeWidth={2.1} />
                        </div>
                      ) : null}

                      {isUser ? (
                        <div className="rounded-[16px] bg-[#CDEBD6] px-[14px] py-[10px] text-[15px] leading-[1.45] text-[#375E49]">
                          {message.text}
                        </div>
                      ) : (
                        <AssistantCard message={message} />
                      )}
                    </div>

                    <div className="px-[4px] text-[12px] text-[#9CA3AF]">{formatTime(message.createdAt)}</div>

                    {hasExplanation ? (
                      <button
                        type="button"
                        onClick={() => setExplainTarget(message)}
                        className="rounded-full border border-[#D8DFDA] bg-white px-[10px] py-[5px] text-[12px] font-[600] text-[#587D67]"
                      >
                        응답 근거 보기
                      </button>
                    ) : null}

                    {!isUser && isLatestAssistant ? (
                      <>
                        <FailurePatternCard stats={patternStats} loading={statsLoading} error={statsError} />

                        <div className="flex w-full gap-[8px]">
                          <button
                            type="button"
                            onClick={() => {
                              const categoryId = categorySlug ? CATEGORY_TO_ID[categorySlug] : null;
                              navigate(categoryId ? `/explore?categoryId=${categoryId}` : '/explore');
                            }}
                            className="flex-1 rounded-[12px] bg-[#5A876E] px-[14px] py-[12px] text-[14px] font-[700] text-white"
                          >
                            사례 탐색 바로 가기
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate('/faq')}
                            className="flex-1 rounded-[12px] bg-[#5A876E] px-[14px] py-[12px] text-[14px] font-[700] text-white"
                          >
                            부업 가이드 바로 가기
                          </button>
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {messages.length === 1 ? (
              <div className="rounded-[18px] border border-dashed border-[#D7DDD8] bg-[#F7FAF8] px-[14px] py-[14px]">
                <p className="text-[13px] font-[700] text-[#587D67]">빠르게 시작해보세요</p>
                <div className="mt-[10px] flex flex-wrap gap-[8px]">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion.label}
                      type="button"
                      onClick={() => {
                        void handleSend(suggestion.text, suggestion.categorySlug);
                      }}
                      className="rounded-full border border-[#D3DED7] bg-white px-[12px] py-[8px] text-[12px] font-[600] text-[#476754]"
                    >
                      {suggestion.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {isSending ? (
              <div className="flex justify-start">
                <div className="rounded-[16px] bg-[#F1F4F2] px-[14px] py-[10px] text-[14px] text-[#6B7280]">
                  사례와 통계를 확인하고 있습니다...
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <ChatInput
          value={input}
          disabled={isSending}
          canSubmit={canSubmit}
          onChange={setInput}
          onSubmit={() => {
            void handleSend();
          }}
        />
      </div>

      {explainTarget ? (
        <ExplanationModal message={explainTarget} onClose={() => setExplainTarget(null)} />
      ) : null}
    </div>
  );
}
