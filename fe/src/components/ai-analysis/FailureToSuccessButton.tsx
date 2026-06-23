import { useNavigate } from 'react-router-dom';

type Props = {
  caseId: string | number;
  relatedSuccessCount: number;
  onClick?: () => void;
};

export default function FailureToSuccessButton({ caseId, relatedSuccessCount, onClick }: Props) {
  const navigate = useNavigate();
  const isActive = relatedSuccessCount > 0;

  function handleClick() {
    if (!isActive) {
      return;
    }
    if (onClick) {
      onClick();
      return;
    }
    navigate(`/experiences/${caseId}/success-comparison`);
  }

  if (!isActive) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        className="flex h-[42px] w-full items-center justify-center rounded-[10px] bg-[#E5E5E5] px-[16px] text-[14px] font-[500] text-[#9A9A9A] cursor-not-allowed"
      >
        관련 성공 사례가 아직 없어요
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex h-[42px] w-full items-center justify-center gap-[8px] rounded-[10px] bg-[#131416] px-[16px] text-[14px] font-[600] text-white transition-colors hover:bg-[#1A1A1A] active:bg-[#2A2A2A]"
      aria-label={`관련 성공 사례 ${relatedSuccessCount}건 보기`}
    >
      <span>비슷한 성공 사례 보기</span>
      <span className="inline-flex min-w-[20px] items-center justify-center rounded-[999px] bg-white px-[6px] py-[2px] text-[10px] font-[700] text-black">
        {relatedSuccessCount}
      </span>
    </button>
  );
}
