import type { ChatbotMessage } from './types';

type Props = {
  message: ChatbotMessage;
  onShowExplanation?: () => void;
  onOpenGuide?: () => void;
};

function formatTime(createdAt: number) {
  const d = new Date(createdAt);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const meridiem = h < 12 ? '오전' : '오후';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${meridiem} ${h12}:${m}`;
}

export default function MessageBubble({ message, onShowExplanation, onOpenGuide }: Props) {
  const isUser = message.role === 'user';
  const isError = !isUser && message.status === 'fallback';
  const showGuideCta = !isUser && !isError && message.id !== 'welcome';
  const time = formatTime(message.createdAt);

  if (isUser) {
    return (
      <div className="flex w-full justify-end">
        <div className="flex items-end gap-[4px]">
          <span className="text-[10px] font-light leading-[1.4] text-[#494949]">
            {time}
          </span>
          <div
            className="max-w-[293px] rounded-[10px] bg-[#BEE8CF] px-[12px] py-[8px] text-[12px] font-normal leading-[1.4] text-[#315441]"
          >
            {message.text}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full justify-start">
      <div className="flex max-w-[calc(100%-32px)] items-start gap-[8px]">
        <span className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-[#5A876E] text-[12px] font-semibold text-white">
          S
        </span>
        <div className="flex flex-col items-start gap-[4px]">
          <div className="flex items-end gap-[4px]">
            <div
              className={`max-w-[293px] whitespace-pre-wrap rounded-[10px] bg-white px-[12px] py-[8px] text-[12px] font-normal leading-[1.4] shadow-[0px_0px_2px_rgba(0,0,0,0.15)] ${
                isError ? 'text-[#F14F5A]' : 'text-[#131416]'
              }`}
            >
              {message.text}
            </div>
            <span className="shrink-0 text-[10px] font-light leading-[1.4] text-[#494949]">
              {time}
            </span>
          </div>
          {showGuideCta ? (
            <button
              type="button"
              onClick={onOpenGuide ?? onShowExplanation}
              className="flex h-[32px] items-center gap-[4px] rounded-[8px] bg-[#5A876E] px-[12px] py-[8px] text-[12px] font-semibold text-white hover:bg-[#4A7059]"
            >
              부업 가이드 바로 가기
              <ChevronRightIcon />
            </button>
          ) : null}
        </div>
      </div>
    </div>
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
