import type { ChatbotMessage } from './types';
import { sanitizeChatbotDisplayText } from './displayText';

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
  const displayText = sanitizeChatbotDisplayText(message.text);
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
            {displayText}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full justify-start">
      <div className="flex max-w-[calc(100%-32px)] items-start gap-[8px]">
        <span className="inline-flex shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#BEE8CF] bg-white p-[6px]">
          <svg viewBox="0 0 12 12" width={12} height={12} fill="none" aria-hidden="true">
            <path
              d="M8.97731 4.04216C8.91691 4.11473 8.8253 4.15699 8.7284 4.15699L7.24231 4.15699C7.08253 4.15699 6.953 4.28105 6.953 4.43409C6.953 4.58712 7.08253 4.71118 7.24231 4.71118L8.5634 4.71118C8.73921 4.71118 8.88173 4.84769 8.88173 5.01607V8.56806C8.88173 8.69312 8.80199 8.8055 8.68058 8.85154L0.437369 11.9771C0.13254 12.0927 -0.133638 11.7448 0.0732894 11.5012L2.99999 8.05643C3.06044 7.98528 3.15113 7.94398 3.2469 7.94398H4.73496C4.89474 7.94398 5.02426 7.81992 5.02426 7.66688C5.02426 7.51385 4.89474 7.38979 4.73496 7.38979H3.41386C3.23805 7.38979 3.09553 7.25328 3.09553 7.0849L3.09553 3.44055C3.09553 3.31548 3.17527 3.2031 3.29668 3.15707L11.5627 0.0228384C11.8659 -0.0921479 12.1321 0.252121 11.9287 0.496382L8.97731 4.04216Z"
              fill="#5A876E"
            />
          </svg>
        </span>
        <div className="flex flex-col items-start gap-[4px]">
          <div className="flex items-end gap-[4px]">
            <div
              className={`max-w-[293px] whitespace-pre-wrap rounded-[10px] bg-white px-[12px] py-[8px] text-[12px] font-normal leading-[1.4] shadow-[0px_0px_2px_rgba(0,0,0,0.15)] ${
                isError ? 'text-[#F14F5A]' : 'text-[#131416]'
              }`}
            >
              {displayText}
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
