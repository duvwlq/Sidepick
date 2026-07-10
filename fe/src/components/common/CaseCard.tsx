import type { MouseEvent } from 'react';
import {
  BookmarkReactionIcon,
  CardActionButton,
  CardMetaRow,
  CaseChip,
  CaseChipRow,
  CaseReactionCount,
  CaseSimilarityIndicator,
  CaseSurface,
} from './CaseUi';

type CaseCardTag = {
  label: string;
  tone: 'status-success' | 'status-failure' | 'category' | 'keyword';
  maxWidthClassName: string;
};

type CaseCardProps = {
  tags: CaseCardTag[];
  title: string;
  preview: string;
  nickname: string;
  createdAt: string;
  viewCount: number;
  thumbnailUrl?: string | null;
  thumbnailCount?: number;
  previewLinesWithoutThumbnail?: 1 | 2;
  showSimilarity?: boolean;
  similarityPercent?: number;
  similarityTone?: 'failure' | 'success';
  heartCount?: number;
  heartActive?: boolean;
  onHeartClick?: () => void;
  bookmarkCount?: number;
  bookmarkActive?: boolean;
  onBookmarkClick?: () => void;
  showCta?: boolean;
  ctaLabel?: string;
  ctaDisabled?: boolean;
  ctaCompact?: boolean;
  onCtaClick?: () => void;
  showThumbnailPlaceholder?: boolean;
  surfaceClassName?: string;
  hideSurfaceChrome?: boolean;
};

function stopCardEvent(event: MouseEvent<HTMLElement>) {
  event.preventDefault();
  event.stopPropagation();
}

export default function CaseCard({
  tags,
  title,
  preview,
  nickname,
  createdAt,
  viewCount,
  thumbnailUrl = null,
  thumbnailCount = 0,
  previewLinesWithoutThumbnail = 1,
  showSimilarity = false,
  similarityPercent = 99,
  similarityTone = 'failure',
  heartCount,
  heartActive = false,
  onHeartClick,
  bookmarkCount,
  bookmarkActive = false,
  onBookmarkClick,
  showCta = false,
  ctaLabel = '성공 여부 보기',
  ctaDisabled = false,
  ctaCompact = false,
  onCtaClick,
  showThumbnailPlaceholder = false,
  surfaceClassName = '',
  hideSurfaceChrome = false,
}: CaseCardProps) {
  const showThumbnail = Boolean(thumbnailUrl) || showThumbnailPlaceholder;
  const previewLineClampClass =
    showThumbnail || previewLinesWithoutThumbnail === 1 ? 'line-clamp-1' : 'line-clamp-2';

  return (
    <CaseSurface className={`${hideSurfaceChrome ? 'rounded-none border-0 shadow-none' : ''} ${surfaceClassName}`.trim()}>
      <div className="flex h-full w-full flex-col gap-[8px] rounded-[4px] bg-white px-[16px] py-[12px]">
        <div className="flex w-full items-start justify-between gap-[8px]">
          <CaseChipRow className="max-w-full flex-1 pr-[8px]">
            {tags.map((tag, index) => (
              <CaseChip
                key={`${tag.label}-${index}`}
                label={tag.label}
                tone={tag.tone}
                maxWidthClassName={tag.maxWidthClassName}
                className="h-[16px] px-[4px] py-0"
              />
            ))}
          </CaseChipRow>
          {showSimilarity ? <CaseSimilarityIndicator percent={similarityPercent} tone={similarityTone} /> : null}
        </div>

        <div className="flex h-[60px] w-full items-start gap-[8px]">
          {showThumbnail ? (
            <div className="relative h-[60px] w-[80px] shrink-0 overflow-hidden rounded-[4px] bg-[#D8D8D8]">
              {thumbnailUrl ? <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" /> : null}
              {thumbnailCount > 1 ? (
                <span className="absolute bottom-0 right-0 flex h-[16px] w-[16px] items-center justify-center rounded-[4px] bg-[rgba(0,0,0,0.25)] font-['Pretendard'] text-[12px] font-[500] leading-[16px] text-white">
                  {thumbnailCount}
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="flex h-[60px] min-w-0 flex-1 flex-col gap-[4px]">
            <h3 className="line-clamp-1 min-w-0 font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] text-[#131416]">
              {title}
            </h3>
            <p className={`${previewLineClampClass} min-w-0 font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#494949]`}>
              {preview}
            </p>
          </div>
        </div>

        <div className={`mt-auto flex w-full flex-col ${showThumbnail ? 'pt-[8px]' : 'pt-[12px]'}`}>
          <CardMetaRow
            nickname={nickname}
            createdAt={createdAt}
            viewCount={viewCount}
            trailing={
              <>
                {typeof heartCount === 'number' ? (
                  onHeartClick ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        stopCardEvent(event);
                        onHeartClick();
                      }}
                      className="flex items-center gap-[2px]"
                      aria-label={heartActive ? '공감 취소' : '공감해요'}
                    >
                      <CaseReactionCount count={heartCount} active={heartActive} />
                    </button>
                  ) : (
                    <CaseReactionCount count={heartCount} active={heartActive} />
                  )
                ) : null}
                {typeof bookmarkCount === 'number' ? (
                  onBookmarkClick ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        stopCardEvent(event);
                        onBookmarkClick();
                      }}
                      className="translate-y-[0.25px] flex shrink-0 items-center gap-[2px]"
                      aria-label={bookmarkActive ? '북마크 해제' : '북마크 저장'}
                    >
                      <BookmarkReactionIcon active={bookmarkActive} />
                      <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#8A8A8A]">
                        {bookmarkCount.toLocaleString()}
                      </span>
                    </button>
                  ) : (
                    <div className="translate-y-[0.25px] flex shrink-0 items-center gap-[2px]">
                      <BookmarkReactionIcon active={bookmarkActive} />
                      <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#8A8A8A]">
                        {bookmarkCount.toLocaleString()}
                      </span>
                    </div>
                  )
                ) : null}
              </>
            }
          />

          {showCta ? (
            <div className="flex w-full items-center justify-end pt-[8px]">
              <CardActionButton
                label={ctaLabel}
                disabled={ctaDisabled}
                className={`${ctaCompact ? '!h-[30px] min-w-[48px]' : '!h-[30px] !w-[92px] !min-w-[92px]'} rounded-[8px] px-[12px] !text-[12px] !font-[600] !leading-[14.4px] ${
                  ctaDisabled ? 'bg-[#CBE5D8] text-white opacity-100' : ''
                }`.trim()}
                onClick={(event) => {
                  stopCardEvent(event);
                  if (!ctaDisabled) {
                    onCtaClick?.();
                  }
                }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </CaseSurface>
  );
}
