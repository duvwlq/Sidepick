import type { ChatbotMessage } from './types';

type Props = {
  message: ChatbotMessage;
  onClose: () => void;
};

export default function ExplanationModal({ message, onClose }: Props) {
  const toolCalls = message.toolCalls ?? [];
  const cited = message.citedCaseIds ?? [];
  const confidencePct =
    typeof message.confidence === 'number'
      ? `${(message.confidence * 100).toFixed(0)}%`
      : '—';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-[430px] rounded-t-[20px] bg-white p-[20px] shadow-2xl sm:rounded-[20px]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-[#EDEEF0] pb-[12px]">
          <h3 className="text-[16px] font-semibold text-[#131416]">분석 근거</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-[6px] text-[#8A8A8A] hover:bg-[#F4F5F6]"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <section className="mt-[16px] flex flex-col gap-[14px] text-[13px] leading-[1.5] text-[#131416]">
          <div>
            <p className="mb-[6px] text-[12px] font-semibold uppercase text-[#8A8A8A]">
              Tool 호출 흐름
            </p>
            {toolCalls.length === 0 ? (
              <p className="text-[#494949]">Tool 호출 정보 없음</p>
            ) : (
              <ol className="flex flex-col gap-[6px] text-[#131416]">
                {toolCalls.map((tool, idx) => (
                  <li key={`${tool.name}-${idx}`} className="rounded-[8px] bg-[#F4F5F6] px-[10px] py-[8px]">
                    <span className="font-medium">{idx + 1}. {tool.name}</span>
                    {typeof tool.result_count === 'number' ? (
                      <span className="ml-[6px] text-[#494949]">→ {tool.result_count}건 검색</span>
                    ) : null}
                    {tool.category ? (
                      <span className="ml-[6px] text-[#494949]">· {tool.category}</span>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div>
            <p className="mb-[6px] text-[12px] font-semibold uppercase text-[#8A8A8A]">
              인용된 사례 ({cited.length}건)
            </p>
            {cited.length === 0 ? (
              <p className="text-[#494949]">인용된 사례 없음</p>
            ) : (
              <ul className="flex flex-wrap gap-[6px]">
                {cited.map((id) => (
                  <li
                    key={id}
                    className="rounded-[8px] bg-[#EAF1FB] px-[10px] py-[4px] text-[12px] font-medium text-[#1A56DB]"
                  >
                    {id}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between rounded-[10px] bg-[#F4F5F6] px-[12px] py-[10px]">
            <span className="text-[12px] font-semibold uppercase text-[#8A8A8A]">신뢰도</span>
            <span className="text-[16px] font-bold text-[#131416]">{confidencePct}</span>
          </div>

          {message.planBReason ? (
            <div className="rounded-[10px] border border-[#F2C94C] bg-[#FFFBEC] px-[12px] py-[10px] text-[12px] text-[#7A5C00]">
              Plan B 사유: <code className="font-mono">{message.planBReason}</code>
            </div>
          ) : null}
        </section>

        <p className="mt-[18px] text-[11px] leading-[1.5] text-[#8A8A8A]">
          PM-12 분석 근거 모달 (Explainability Tooltip) v3 — 챗봇 응답 explanation
        </p>
      </div>
    </div>
  );
}
