import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import arrowLeftIcon from '../assets/auth-figma/arrow-left.svg';
import BottomNav from '../components/layout/BottomNav';
import { useToast } from '../components/common/useToast';
import { sendChatbotMessage, type ChatbotMessagePayload } from '../lib/api';
import { resolveErrorMessage } from '../lib/resolve-error-message';
import { getAccessToken } from '../lib/session';

const CHATBOT_SESSION_STORAGE_KEY = 'sidepick.chatbot.sessionId';
const QUICK_PROMPTS = [
  {
    label: '스마트스토어를 시작하려는데 뭐부터 해야 할까요?',
    message:
      '스마트스토어를 시작하려고 하는데 자본은 많지 않고 처음이라서요. 무엇부터 준비하면 좋을지 단계별로 알려주세요.',
  },
  {
    label: '본업이랑 병행 가능한 부업을 찾고 싶어요.',
    message:
      '지금 본업을 하면서 퇴근 후 2~3시간 정도 쓸 수 있어요. 초기 비용이 크지 않고 병행 가능한 현실적인 부업 방향을 추천해 주세요.',
  },
  {
    label: '초기 자본이 적을 때 현실적인 선택지가 있을까요?',
    message:
      '초기 자본이 많지 않은 상태에서 시작할 수 있는 부업이나 소규모 창업 선택지를 찾고 있어요. 위험을 줄이면서 시작하는 방법도 같이 알려주세요.',
  },
] as const;

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  meta?: string | null;
};

function readOrCreateSessionId() {
  if (typeof window === 'undefined') {
    return 'chatbot-session';
  }

  const existing = window.sessionStorage.getItem(CHATBOT_SESSION_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const next = `chatbot-${Date.now()}`;
  window.sessionStorage.setItem(CHATBOT_SESSION_STORAGE_KEY, next);
  return next;
}

function buildAssistantMeta(payload: ChatbotMessagePayload) {
  if (payload.status === 'fallback') {
    return 'AI 챗봇';
  }
  return null;
}

export default function ChatbotPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [sessionId] = useState(() => readOrCreateSessionId());
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: '부업 고민을 적어주시면 관련 사례를 바탕으로 다음 행동을 같이 정리해드릴게요.',
      meta: 'AI 챗봇',
    },
  ]);

  const token = getAccessToken();

  useEffect(() => {
    if (token) {
      return;
    }

    navigate(
      `/auth?next=${encodeURIComponent('/chatbot')}&reason=${encodeURIComponent('AI 챗봇은 로그인이 필요한 서비스입니다.')}`,
      { replace: true },
    );
  }, [navigate, token]);

  const canSubmit = useMemo(() => draft.trim().length > 0 && !loading, [draft, loading]);

  async function submitMessage(rawMessage: string, displayMessage?: string) {
    const message = rawMessage.trim();
    const visibleMessage = (displayMessage ?? rawMessage).trim();
    if (!message || loading) {
      return;
    }

    setLoading(true);
    setDraft('');
    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: 'user', text: visibleMessage || message }]);

    try {
      const payload = await sendChatbotMessage({ sessionId, message });
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: payload.reply,
          meta: buildAssistantMeta(payload),
        },
      ]);
    } catch (error) {
      showToast(resolveErrorMessage(error, '챗봇 답변을 불러오지 못했습니다.'));
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          text: '지금은 답변을 불러오지 못하고 있어요. 잠시 후 다시 시도해 주세요.',
          meta: '오류',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <div className="mx-auto flex min-h-screen w-full max-w-[375px] flex-col bg-[#F8F8F8] pb-[104px]">
        <header className="sticky top-0 z-10 bg-white">
          <div className="flex h-[64px] items-center justify-between px-[16px] py-[20px]">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-[24px] w-[24px] items-center justify-center"
              aria-label="이전 화면으로"
            >
              <img src={arrowLeftIcon} alt="" className="h-[24px] w-[24px]" />
            </button>
            <p className="font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] text-black">AI 챗봇</p>
            <div className="h-[24px] w-[24px]" aria-hidden="true" />
          </div>

          <div className="border-t border-[#F3F3F3] px-[16px] py-[12px]">
            <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#6B6B6B]">
              실패 사례, 시작 방법, 병행 가능성처럼 지금 고민 중인 부업 상황을 그대로 적어보세요.
            </p>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-[12px] px-[16px] py-[16px]">
          <div className="flex flex-wrap gap-[8px]">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt.label}
                type="button"
                onClick={() => {
                  void submitMessage(prompt.message, prompt.label);
                }}
                className="rounded-[999px] border border-[#D7E5DC] bg-white px-[12px] py-[8px] text-left font-['Pretendard'] text-[12px] font-[500] leading-[16.8px] text-[#375E49]"
              >
                {prompt.label}
              </button>
            ))}
          </div>

          <div className="flex flex-1 flex-col gap-[10px]">
            {messages.map((message) => {
              const isAssistant = message.role === 'assistant';
              return (
                <div key={message.id} className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
                  <div
                    className={`max-w-[287px] rounded-[16px] px-[14px] py-[12px] ${
                      isAssistant ? 'bg-white text-[#131416]' : 'bg-[#5A876E] text-white'
                    }`}
                  >
                    {message.meta ? (
                      <p
                        className={`mb-[4px] font-['Pretendard'] text-[11px] font-[600] leading-[14px] ${
                          isAssistant ? 'text-[#5A876E]' : 'text-[#DDEFE5]'
                        }`}
                      >
                        {message.meta}
                      </p>
                    ) : null}
                    <p className="whitespace-pre-wrap font-['Pretendard'] text-[14px] font-[400] leading-[20px]">
                      {message.text}
                    </p>
                  </div>
                </div>
              );
            })}

            {loading ? (
              <div className="flex justify-start">
                <div className="rounded-[16px] bg-white px-[14px] py-[12px] font-['Pretendard'] text-[14px] font-[400] leading-[20px] text-[#6B6B6B]">
                  답변을 정리하는 중입니다...
                </div>
              </div>
            ) : null}
          </div>
        </main>

        <div className="fixed bottom-[84px] left-1/2 z-20 flex w-full max-w-[375px] -translate-x-1/2 bg-[#F8F8F8] px-[16px] py-[12px]">
          <div className="flex w-full items-end gap-[8px] rounded-[20px] border border-[#DDE5E0] bg-white p-[8px]">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="예: 퇴근 후 2시간으로 시작할 수 있는 부업이 있을까요?"
              rows={1}
              className="max-h-[120px] min-h-[44px] flex-1 resize-none bg-transparent px-[8px] py-[10px] font-['Pretendard'] text-[14px] font-[400] leading-[20px] text-[#131416] outline-none placeholder:text-[#B3B3B3]"
            />
            <button
              type="button"
              onClick={() => {
                void submitMessage(draft);
              }}
              disabled={!canSubmit}
              className={`h-[44px] shrink-0 rounded-[14px] px-[14px] font-['Pretendard'] text-[14px] font-[600] leading-[16.8px] ${
                canSubmit ? 'bg-[#5A876E] text-white' : 'bg-[#E5E5E5] text-[#9A9A9A]'
              }`}
            >
              전송
            </button>
          </div>
        </div>

        <BottomNav active="guide" />
      </div>
    </div>
  );
}
