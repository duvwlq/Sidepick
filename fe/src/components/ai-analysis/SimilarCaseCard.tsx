/**
 * SimilarCaseCard — 유사 사례 카드 (PD v3 적용 2026-06-01)
 *
 * 디자인 변경:
 * - 타입 칩 색상 분리 (성공 = 그린 / 실패 = 오렌지)
 * - 유사도 프로그레스바 추가 (오른쪽 상단)
 * - 카드 하단 작은 "성공 사례 보기" 버튼 (caseType === 'failure' AND showSuccessLink === true 시)
 * - 사진 영역 (썸네일) 옵션
 */

import { useNavigate } from 'react-router-dom';

type SimilarCaseCardProps = {
  title: string;
  tags: string[];
  similarity: number;
  /** 사례 타입 (성공 = green / 실패 = orange) */
  caseType?: 'success' | 'failure';
  /** 썸네일 이미지 URL (있을 때만 표시) */
  thumbnail?: string;
  /** 카드 하단 "성공 사례 보기" 버튼 표시 (실패 사례에서 성공으로 연결할 때) */
  showSuccessLink?: boolean;
  /** 연결 대상 case_id (실패 → 성공 라우팅용) */
  linkCaseId?: string;
  /** 본문 미리보기 */
  preview?: string;
  /** 작성자·일자·조회수·북마크 메타 (옵션) */
  meta?: {
    author?: string;
    date?: string;
    viewCount?: number;
    bookmarkCount?: number;
  };
};

export default function SimilarCaseCard({
  title,
  tags,
  similarity,
  caseType = 'failure',
  thumbnail,
  showSuccessLink = false,
  linkCaseId,
  preview,
  meta,
}: SimilarCaseCardProps) {
  const navigate = useNavigate();
  const typeChip =
    caseType === 'success'
      ? { label: '성공', bg: 'bg-[#5C8068]', text: 'text-white' }
      : { label: '실패', bg: 'bg-[#C77F4C]', text: 'text-white' };

  const handleSuccessLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (linkCaseId) {
      navigate(`/experiences/${linkCaseId}/success-comparison`);
    }
  };

  return (
    <div className="w-full rounded-2xl bg-white p-4 text-left">
      {/* 상단: 타입 칩 + 카테고리·키워드 칩 + 유사도 프로그레스바 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {/* 타입 칩 (성공 = 그린 / 실패 = 오렌지) */}
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${typeChip.bg} ${typeChip.text}`}
          >
            {typeChip.label}
          </span>
          {/* 일반 칩 (카테고리 + 키워드) */}
          {tags.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="text-[10px] text-[#9A9A9A] bg-[#F5F5F5] px-2 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* 유사도 프로그레스바 + 숫자 */}
        <div className="flex items-center gap-1.5">
          <div className="w-12 h-1 bg-[#F0F0F0] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#C77F4C]"
              style={{ width: `${Math.min(100, Math.max(0, similarity))}%` }}
            />
          </div>
          <span className="text-[11px] font-semibold text-black">{similarity}%</span>
        </div>
      </div>

      {/* 콘텐츠 + 썸네일 */}
      <div className="flex gap-3">
        <div className="flex-1">
          <p className="text-base font-semibold text-neutral-950 leading-tight">
            {title}
          </p>
          {preview && (
            <p className="mt-1 text-xs text-[#7A7A7A] line-clamp-2">{preview}</p>
          )}
        </div>
        {thumbnail && (
          <img
            src={thumbnail}
            alt=""
            className="w-[100px] h-[80px] rounded-lg object-cover bg-[#D9D9D9]"
          />
        )}
      </div>

      {/* 메타 영역 (작성자·일자·조회·북마크) */}
      {meta && (
        <div className="mt-3 flex items-center justify-between text-[11px] text-[#9A9A9A]">
          <span>
            {meta.author} · {meta.date} · 조회 {meta.viewCount}
          </span>
          {meta.bookmarkCount !== undefined && (
            <span>🔖 {meta.bookmarkCount}</span>
          )}
        </div>
      )}

      {/* 하단: 성공 사례 보기 버튼 (실패 사례 → 성공 사례로 연결) */}
      {showSuccessLink && caseType === 'failure' && linkCaseId && (
        <button
          type="button"
          onClick={handleSuccessLinkClick}
          className="mt-3 px-4 h-8 bg-[#5C8068] rounded-[14px] text-white text-xs font-semibold hover:bg-[#4F6F5A] transition-colors"
        >
          성공 사례 보기
        </button>
      )}
    </div>
  );
}
