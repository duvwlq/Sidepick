/**
 * FailureToSuccessButton — 실패→성공 연결 버튼 (PM-10)
 *
 * 사용자 분석 결과 페이지에서 "성공 사례 보기" 클릭 시
 * 좌우 분할 화면(/experiences/:id/success-comparison)으로 라우팅.
 *
 * 동작:
 * - relatedSuccessCount > 0 → 활성 (진한 그린, 클릭 가능, "성공 사례 보기")
 * - relatedSuccessCount === 0 → 비활성 (회색 그린, 클릭 불가, "성공 사례 없음")
 *
 * 작성: 팀장 (오혜림) — 2026-05-29 / PD 시안 적용 2026-06-01
 * 의존성: react-router-dom v7.14
 */

import { useNavigate } from 'react-router-dom';

type FailureToSuccessButtonProps = {
  /** 사용자 실패 경험 case_id (예: "case_123") */
  caseId: string;
  /** 관련 성공 사례 건수 — 0이면 비활성 */
  relatedSuccessCount: number;
  /** 커스텀 클릭 핸들러 (라우팅 대신 콜백 사용 시) */
  onClick?: () => void;
};

export default function FailureToSuccessButton({
  caseId,
  relatedSuccessCount,
  onClick,
}: FailureToSuccessButtonProps) {
  const navigate = useNavigate();
  const isActive = relatedSuccessCount > 0;

  const handleClick = () => {
    if (!isActive) return;
    if (onClick) {
      onClick();
      return;
    }
    navigate(`/experiences/${caseId}/success-comparison`);
  };

  // 비활성 상태 — 0건일 때 (PD 시안: 회색 그린)
  if (!isActive) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        className="px-6 h-12 bg-[#C8D6CA] rounded-[20px] inline-flex justify-center items-center text-white text-sm font-semibold cursor-not-allowed"
      >
        <span>성공 사례 없음</span>
      </button>
    );
  }

  // 활성 상태 — 1건 이상 (PD 시안: 진한 그린 브랜드 컬러)
  return (
    <button
      type="button"
      onClick={handleClick}
      className="px-6 h-12 bg-[#5C8068] rounded-[20px] inline-flex justify-center items-center text-white text-sm font-semibold transition-colors hover:bg-[#4F6F5A] active:bg-[#3F5C49]"
      aria-label={`비슷한 성공 사례 ${relatedSuccessCount}건 보기`}
    >
      <span>성공 사례 보기</span>
    </button>
  );
}
