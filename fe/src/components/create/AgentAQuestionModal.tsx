import { X } from 'lucide-react';
import type { AgentAQuestionCard } from '../../lib/api';

type AgentAQuestionModalProps = {
  open: boolean;
  questions: AgentAQuestionCard[];
  answers: Record<string, string>;
  currentIndex: number;
  onClose: () => void;
  onAnswerChange: (slot: string, value: string) => void;
  onSkip: () => void;
  onNext: () => void;
  onComplete: () => void;
};

const EXAMPLE_LABELS_BY_SLOT: Record<string, string[]> = {
  duration: ['1개월 미만', '1~3개월', '6개월 이상'],
  daily_hours: ['퇴근 후 2시간', '주말 4시간', '하루 1시간 정도'],
  invest_amount: ['0원으로 시작', '30만원 정도', '초기 광고비 포함'],
  revenue_amount: ['매출 0원', '월 10만원 수준', '첫 결제 1건'],
  failure_reasons: ['고객이 안 모였어요', '시간이 부족했어요', '경쟁이 너무 심했어요'],
  difficulties: ['마케팅이 어려웠어요', '수익 구조를 몰랐어요', '운영이 오래 안 갔어요'],
  body_richness: ['어떻게 시작했는지', '어디서 막혔는지', '왜 접게 됐는지'],
};

function ProgressBar({ current, total }: { current: number; total: number }) {
  const progress = total <= 1 ? 100 : Math.round((current / total) * 100);
  return (
    <div className="flex w-[311px] items-center justify-center gap-[4px]">
      <div className="relative h-[6px] flex-1 overflow-hidden rounded-full bg-[#D8D8D8]">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,#92BFA6_0%,#5A876E_100%)] transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-[12px] font-[400] leading-[14.4px] text-[#131416]">{current}/{total}</span>
    </div>
  );
}

function QuestionCard({ question, index, total, answer, onChange }: {
  question: AgentAQuestionCard;
  index: number;
  total: number;
  answer: string;
  onChange: (value: string) => void;
}) {
  const examples = question.options?.length ? question.options.slice(0, 4) : (EXAMPLE_LABELS_BY_SLOT[question.slot] ?? []);
  return (
    <div className="flex w-[311px] flex-col gap-[24px] rounded-[10px] bg-white p-[16px] shadow-[0_0_2px_rgba(0,0,0,0.15)]">
      <div className="flex items-center gap-[12px]">
        <div className="flex h-[24px] min-w-[24px] items-center justify-center rounded-full bg-[#CBE5D8] text-[12px] font-[600] leading-[14.4px] text-[#375E49]">
          Q{Math.min(index + 1, total)}
        </div>
        <p className="flex-1 text-[14px] font-[600] leading-[16.8px] text-[#131416]">{question.question}</p>
      </div>

      <div className="flex flex-col gap-[6px]">
        <p className="text-[12px] font-[400] leading-[14.4px] text-[#131416]">예시</p>
        <div className="flex flex-wrap gap-[6px]">
          {examples.map((example) => (
            <span key={`${question.slot}-${example}`} className="rounded-full bg-[#F8F8F8] px-[12px] py-[4px] text-[12px] font-[400] leading-[14.4px] text-[#494949]">
              {example}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-[10px] rounded-[10px] bg-[#F8F8F8] px-[12px] py-[10px]">
        <textarea
          value={answer}
          onChange={(event) => onChange(event.target.value.slice(0, 100))}
          placeholder="답변을 입력해주세요."
          className="h-[72px] w-full resize-none bg-transparent text-[12px] font-[400] leading-[16.8px] text-[#131416] outline-none placeholder:text-[#BABABA]"
        />
        <div className="flex justify-end text-[12px] leading-[16.8px]">
          <span className="text-[#8A8A8A]">{answer.length}</span>
          <span className="text-[#494949]">/100</span>
        </div>
      </div>
    </div>
  );
}

export default function AgentAQuestionModal({
  open,
  questions,
  answers,
  currentIndex,
  onClose,
  onAnswerChange,
  onSkip,
  onNext,
  onComplete,
}: AgentAQuestionModalProps) {
  if (!open || questions.length === 0) {
    return null;
  }

  const currentQuestion = questions[Math.min(currentIndex, questions.length - 1)];
  const isLast = currentIndex >= questions.length - 1;
  const currentAnswer = answers[currentQuestion.slot] ?? '';

  return (
    <div className="fixed inset-0 z-[120] bg-[rgba(19,20,22,0.32)] px-[16px] py-[24px]">
      <div className="mx-auto flex min-h-full w-full max-w-[375px] items-center justify-center">
        <div className="flex w-[343px] flex-col items-center gap-[24px] rounded-[20px] bg-white px-[16px] py-[24px]">
          <div className="flex w-full flex-col items-center gap-[10px]">
            <div className="flex w-full items-start justify-between">
              <div className="w-[24px]" />
              <div className="text-center">
                <p className="text-[16px] font-[600] leading-[19.2px] text-[#131416]">더욱 정확한 분석을 위해</p>
                <p className="text-[16px] font-[600] leading-[19.2px] text-[#131416]">몇 가지만 여쭤볼게요</p>
              </div>
              <button type="button" onClick={onClose} className="flex h-[24px] w-[24px] items-center justify-center text-[#131416]">
                <X size={18} strokeWidth={2} />
              </button>
            </div>
            <p className="w-full text-center text-[12px] font-[400] leading-[16.8px] text-[#757575]">
              작성 내용을 바탕으로, 분석에 도움이 될 만한 질문을 준비했어요.
            </p>
          </div>

          <ProgressBar current={Math.min(currentIndex + 1, questions.length)} total={questions.length} />

          <QuestionCard
            question={currentQuestion}
            index={currentIndex}
            total={questions.length}
            answer={currentAnswer}
            onChange={(value) => onAnswerChange(currentQuestion.slot, value)}
          />

          <div className="flex w-full gap-[10px]">
            <button
              type="button"
              onClick={onSkip}
              disabled={isLast}
              className={`flex-1 rounded-[8px] border px-[12px] py-[12px] text-[14px] font-[600] leading-[16.8px] ${
                isLast ? 'border-[#E6E6E6] bg-white text-[#BABABA]' : 'border-[#E6E6E6] bg-white text-[#131416]'
              }`}
            >
              건너뛰기
            </button>
            <button
              type="button"
              onClick={isLast ? onComplete : onNext}
              className={`flex-1 rounded-[8px] px-[12px] py-[12px] text-[14px] font-[600] leading-[16.8px] text-white ${
                isLast ? 'bg-[#5A876E]' : 'bg-[#CBE5D8]'
              }`}
            >
              {isLast ? '완료' : '다음 질문'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
