/**
 * FailureToSuccessButton — 실패→성공 연결 버튼 (PM-10)
 *
 * 사용자 분석 결과 페이지에서 "비슷한 성공 사례 보기" 클릭 시
 * 좌우 분할 화면(/experiences/:id/success-comparison)으로 라우팅.
 *
 * 동작:
 * - relatedSuccessCount > 0 → 활성 (검은 배경, 클릭 가능)
 * - relatedSuccessCount === 0 → 비활성 (회색, 클릭 불가, 안내 문구)
 *
 * 작성: 팀장 (오혜림) — 2026-05-29
 * 의존성: react-router-dom (이미 fe에 설치됨, v7.14)
 *
 * TODO (PD 디자인 받은 후):
 * - 색상·아이콘·간격 PD 시안 적용
 * - 호버 / 모바일 탭 상호작용 세부 조정
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

  // 비활성 상태 — 0건일 때
  if (!isActive) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        className="w-full h-12 px-5 py-2 bg-[#E5E5E5] rounded-[999px] inline-flex justify-center items-center gap-2 text-[#9A9A9A] text-xs font-semibold cursor-not-allowed"
      >
        <span>관련 성공 사례가 아직 없어요</span>
      </button>
    );
  }

  // 활성 상태 — 1건 이상
  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full h-12 px-5 py-2 bg-black rounded-[999px] inline-flex justify-center items-center gap-2 text-white text-xs font-bold transition-colors hover:bg-[#1A1A1A] active:bg-[#2A2A2A]"
      aria-label={`비슷한 성공 사례 ${relatedSuccessCount}건 보기`}
    >
      <span>비슷한 성공 사례 보기</span>
      <span className="inline-flex items-center justify-center min-w-[20px] h-[18px] px-1.5 rounded-full bg-white text-black text-[10px] font-bold">
        {relatedSuccessCount}
      </span>
      <span aria-hidden="true">{'>'}</span>
    </button>
  );
}
