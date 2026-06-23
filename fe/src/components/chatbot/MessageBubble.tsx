import type { ChatbotMessage } from './types';

type Props = {
  message: ChatbotMessage;
  onShowExplanation?: () => void;
};

const STATUS_BADGE: Record<NonNullable<ChatbotMessage['status']>, { label: string; tone: string }> = {
  ok: { label: '응답 완료', tone: 'bg-[#E6F4EA] text-[#1E7E3E]' },
  fallback: { label: '재시도 권장', tone: 'bg-[#FFF4E5] text-[#B36500]' },
  blocked: { label: '차단', tone: 'bg-[#FDECEC] text-[#B3261E]' },
  guide_redirect: { label: '가이드 페이지 안내', tone: 'bg-[#EAF1FB] text-[#1A56DB]' },
};

export default function MessageBubble({ message, onShowExplanation }: Props) {
  const isUser = message.role === 'user';
  const hasExplanation =
    !isUser &&
    ((message.citedCaseIds && message.citedCaseIds.length > 0) ||
      (message.toolCalls && message.toolCalls.length > 0));
  const badge = message.status && !isUser ? STATUS_BADGE[message.status] : null;

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[80%] flex-col gap-[6px] ${isUser ? 'items-end' : 'items-start'}`}>
        {badge ? (
          <span
            className={`rounded-[6px] px-[8px] py-[2px] text-[11px] font-medium ${badge.tone}`}
          >
            {badge.label}
            {typeof message.confidence === 'number'
              ? ` · 신뢰도 ${(message.confidence * 100).toFixed(0)}%`
              : ''}
          </span>
        ) : null}
        <div
          className={`whitespace-pre-wrap rounded-[14px] px-[14px] py-[10px] text-[14px] leading-[1.5] ${
            isUser
              ? 'bg-[#131416] text-white'
              : 'bg-[#F4F5F6] text-[#131416]'
          }`}
        >
          {message.text}
        </div>
        {hasExplanation ? (
          <button
            type="button"
            onClick={onShowExplanation}
            className="rounded-[8px] border border-[#D9DBDF] bg-white px-[10px] py-[4px] text-[12px] font-medium text-[#494949] hover:bg-[#F4F5F6]"
          >
            🔍 근거 보기
          </button>
        ) : null}
      </div>
    </div>
  );
}
