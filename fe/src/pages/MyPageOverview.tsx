import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import batteryFrameIcon from '../assets/auth-figma/battery-frame.svg';
import cellularConnectionIcon from '../assets/auth-figma/cellular-connection.svg';
import wifiIcon from '../assets/auth-figma/wifi.svg';
import bookmarkIcon from '../assets/explore-figma/bookmark.svg';
import editIcon from '../assets/explore-figma/edit.svg';
import liveHelpNavIcon from '../assets/images/live-help.svg';
import homeNavIcon from '../assets/images/home.svg';
import plusFabIcon from '../assets/home-v1-figma/icons/plus-figma.svg';
import searchNavIcon from '../assets/images/search.svg';
import userNavIcon from '../assets/images/user.svg';
import avatarPlaceholderIcon from '../assets/mypage-overview-figma/avatar-placeholder.png';
import cameraIcon from '../assets/mypage-overview-figma/camera.svg';
import chevronIcon from '../assets/mypage-overview-figma/chevron.svg';
import sectionDraftIcon from '../assets/mypage-overview-figma/section-draft.svg';
import settingsIcon from '../assets/mypage-overview-figma/settings.svg';
import statRecentIcon from '../assets/mypage-overview-figma/stat-recent.svg';
import statWrittenIcon from '../assets/mypage-overview-figma/stat-written.svg';
import {
  ApiError,
  getMe,
  getMyBookmarks,
  getMyExperiences,
  getMyRecentViews,
  type Experience,
  type UserSummary,
} from '../lib/api';
import { getExperienceImageMeta } from '../lib/experience-images';
import { getRecentViewedExperienceIds } from '../lib/personal-activity';
import { resolveErrorMessage } from '../lib/resolve-error-message';
import { clearSession, getAccessToken, getStoredUser } from '../lib/session';

type OverviewCardVariant = 'with-thumbnail' | 'text-only';

type DraftPreviewViewModel = {
  id: number;
  title: string;
  description: string;
  savedAt: string;
};

type PreviewCaseViewModel = {
  id: number;
  statusLabel: '성공' | '실패';
  categoryLabel: string;
  keywords: [string, string];
  title: string;
  description: string;
  authorName: string;
  createdAtLabel: string;
  viewCountLabel: string;
  bookmarkCountLabel: string;
  variant: OverviewCardVariant;
};

type BookmarkPreviewViewModel = {
  id: number;
  title: string;
  createdAtLabel: string;
};

type MyPageOverviewViewModel = {
  profile: {
    nickname: string;
    email: string;
    avatarUrl: string | null;
  };
  counts: {
    written: number;
    bookmarked: number;
    recent: number;
  };
  draft: DraftPreviewViewModel | null;
  writtenPreview: PreviewCaseViewModel[];
  bookmarkPreview: BookmarkPreviewViewModel[];
};

const FIGMA_PREVIEW_MODE = true;
const ACTIVE_NAV_ICON_FILTER = 'brightness(0) saturate(100%) invert(47%) sepia(16%) saturate(873%) hue-rotate(95deg) brightness(92%) contrast(87%)';

const PREVIEW_DRAFT: DraftPreviewViewModel = {
  id: 90001,
  title: '제목입니다',
  description: '본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기',
  savedAt: '2026.00.00',
};

const PREVIEW_WRITTEN_CARDS: PreviewCaseViewModel[] = [
  {
    id: 10111,
    statusLabel: '실패',
    categoryLabel: '카테고리',
    keywords: ['키워드', '키워드'],
    title: '제목',
    description: '본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기',
    authorName: '닉네임',
    createdAtLabel: '2026.00.00',
    viewCountLabel: '999',
    bookmarkCountLabel: '999',
    variant: 'with-thumbnail',
  },
  {
    id: 10112,
    statusLabel: '성공',
    categoryLabel: '카테고리',
    keywords: ['키워드', '키워드'],
    title: '제목',
    description: '본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기',
    authorName: '닉네임',
    createdAtLabel: '2026.00.00',
    viewCountLabel: '999',
    bookmarkCountLabel: '999',
    variant: 'text-only',
  },
];

const PREVIEW_BOOKMARK_CARDS: BookmarkPreviewViewModel[] = [
  { id: 10121, title: '제목입니다', createdAtLabel: '2026.00.00' },
  { id: 10122, title: '제목입니다', createdAtLabel: '2026.00.00' },
  { id: 10123, title: '제목입니다', createdAtLabel: '2026.00.00' },
];

function isAuthError(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

function sanitizeText(value: string | null | undefined, fallback: string) {
  const normalized = (value ?? '').replace(/\s+/g, ' ').trim();
  return normalized || fallback;
}

function stripImageMarkdown(content: string) {
  return content.replace(/!\[[^\]]*]\(([^)]+)\)/g, '').replace(/\s+/g, ' ').trim();
}

function extractKeywordTags(experience: Experience): [string, string] {
  const raw = [
    ...(experience.analysis?.keywords ?? []),
    ...experience.failureReasons,
    ...experience.difficulties,
    experience.businessType ?? '',
  ]
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => value !== experience.category.name);

  const unique = Array.from(new Set(raw));
  return [unique[0] ?? '키워드', unique[1] ?? '키워드'];
}

function toPreviewCase(experience: Experience): PreviewCaseViewModel {
  const imageMeta = getExperienceImageMeta(experience);
  const [keywordA, keywordB] = extractKeywordTags(experience);

  return {
    id: experience.id,
    statusLabel: experience.caseStatus === 'SUCCESS' ? '성공' : '실패',
    categoryLabel: sanitizeText(experience.category.name, '카테고리'),
    keywords: [keywordA, keywordB],
    title: sanitizeText(experience.title, '제목'),
    description: sanitizeText(stripImageMarkdown(experience.content), '본문 텍스트 미리보기'),
    authorName: sanitizeText(experience.author.nickname, '닉네임'),
    createdAtLabel: formatDate(experience.createdAt),
    viewCountLabel: experience.viewCount.toLocaleString(),
    bookmarkCountLabel: experience.likeCount.toLocaleString(),
    variant: imageMeta.primaryImageUrl ? 'with-thumbnail' : 'text-only',
  };
}

function toBookmarkPreview(experience: Experience): BookmarkPreviewViewModel {
  return {
    id: experience.id,
    title: sanitizeText(experience.title, '제목입니다'),
    createdAtLabel: formatDate(experience.createdAt),
  };
}

function buildFallbackProfile(user: UserSummary | null) {
  return {
    nickname: sanitizeText(user?.nickname, '닉네임'),
    email: sanitizeText(user?.email, '@sidepick@gmail.com'),
    avatarUrl: user?.profileImage ?? null,
  };
}

function StatusBar() {
  return (
    <div className="flex h-[59px] w-[375px] items-center px-[24px] pb-[19px] pt-[21px]">
      <div className="flex min-w-0 flex-1 items-center">
        <span className="font-['SF_Pro'] text-[17px] font-[590] leading-[22px] tracking-[0px] text-[#000000]">9:41</span>
      </div>
      <div className="flex h-[22px] min-w-0 flex-1 items-center justify-end gap-[7px] pr-[1px] pt-[1px]">
        <img src={cellularConnectionIcon} alt="" className="h-[12.226px] w-[19.2px] shrink-0" />
        <img src={wifiIcon} alt="" className="h-[12.328px] w-[17.142px] shrink-0" />
        <img src={batteryFrameIcon} alt="" className="h-[13px] w-[27.328px] shrink-0" />
      </div>
    </div>
  );
}

function OverviewHeader() {
  const navigate = useNavigate();

  return (
    <header className="flex h-[64px] w-[375px] items-center justify-between px-[16px] py-[20px]">
      <div className="h-[24px] w-[24px] shrink-0" aria-hidden="true" />
      <h1 className="flex h-[19px] w-[70px] items-center justify-center text-center font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-[#000000] [font-feature-settings:'case'_1]">
        마이페이지
      </h1>
      <button
        type="button"
        aria-label="설정"
        className="flex h-[20px] w-[20px] items-center justify-center"
        onClick={() => {
          navigate('/coming-soon?feature=settings');
        }}
      >
        <img src={settingsIcon} alt="" className="h-[20px] w-[20px] shrink-0" />
      </button>
    </header>
  );
}

type StatItemProps = {
  icon: 'written' | 'bookmarked' | 'recent';
  label: string;
  value: string;
  onClick: () => void;
};

function StatItem({ icon, label, value, onClick }: StatItemProps) {
  return (
    <button type="button" onClick={onClick} className="flex h-[78px] w-[107.667px] flex-col items-center gap-[10px] py-[16px]">
      <div className="flex items-center gap-[4px]">
        {icon === 'written' ? <img src={statWrittenIcon} alt="" className="h-[14px] w-[14px] shrink-0" /> : null}
        {icon === 'bookmarked' ? <img src={bookmarkIcon} alt="" className="h-[16px] w-[16px] shrink-0" /> : null}
        {icon === 'recent' ? <img src={statRecentIcon} alt="" className="h-[16px] w-[16px] shrink-0" /> : null}
        <span className="font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#8A8A8A] [font-feature-settings:'case'_1]">
          {label}
        </span>
      </div>
      <span className="font-['Pretendard'] text-[14px] font-[500] leading-[19.6px] tracking-[0px] text-[#494949]">{value}</span>
    </button>
  );
}

function ProfileSummaryRow({ counts }: { counts: MyPageOverviewViewModel['counts'] }) {
  const navigate = useNavigate();

  return (
    <div className="flex h-[78px] w-[323px] items-center">
      <StatItem icon="written" label="작성한 글" value={counts.written.toLocaleString()} onClick={() => navigate('/mypage/written')} />
      <StatItem icon="bookmarked" label="북마크" value={counts.bookmarked.toLocaleString()} onClick={() => navigate('/mypage/bookmarks')} />
      <StatItem icon="recent" label="최근 본 글" value={counts.recent.toLocaleString()} onClick={() => navigate('/mypage/recent')} />
    </div>
  );
}

function ProfileCard({ profile, counts }: Pick<MyPageOverviewViewModel, 'profile' | 'counts'>) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="flex h-[174px] w-[343px] flex-col items-start rounded-[4px] bg-[#FFFFFF] px-[10px] shadow-[0px_0px_2px_rgba(0,0,0,0.1)]"
      onClick={() => {
        navigate('/mypage/profile/edit');
      }}
    >
      <div className="flex h-[96px] w-[323px] items-center justify-between py-[8px]">
        <div className="flex items-center gap-[8px]">
          <div className="relative h-[80px] w-[80px]">
            <div className="flex h-[80px] w-[80px] items-center justify-center overflow-hidden rounded-[999px] bg-[#F1F1F1] p-[8px]">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" className="h-[64px] w-[64px] rounded-[999px] object-cover" />
              ) : (
                <img src={avatarPlaceholderIcon} alt="" className="h-[80px] w-[80px] shrink-0" />
              )}
            </div>
            <div className="absolute left-[49.5px] top-[49px] flex h-[24px] w-[24px] items-center justify-center rounded-[999px] bg-[#8A8A8A]">
              <img src={cameraIcon} alt="" className="h-[14px] w-[14px] shrink-0" />
            </div>
          </div>
          <div className="flex flex-col items-start">
            <span className="flex min-h-[22px] min-w-[42px] items-center font-['Pretendard'] text-[16px] font-[400] leading-[22.4px] tracking-[0px] text-[#131416] [font-feature-settings:'case'_1]">
              {profile.nickname}
            </span>
            <span className="flex min-h-[14px] min-w-[101px] items-center font-['Pretendard'] text-[10px] font-[400] leading-[14px] tracking-[0px] text-[#BABABA] [font-feature-settings:'case'_1]">
              {profile.email}
            </span>
          </div>
        </div>
        <div className="flex h-[20px] w-[20px] items-center justify-center">
          <img src={chevronIcon} alt="" className="h-[8px] w-[4px] shrink-0" />
        </div>
      </div>
      <div className="h-0 w-[323px] border-t border-[#EEEEEE]" />
      <ProfileSummaryRow counts={counts} />
    </button>
  );
}

type SectionHeaderProps = {
  title: string;
  icon: 'draft' | 'written' | 'bookmarked';
  onViewAll: () => void;
  widthClassName?: string;
};

function SectionHeader({ title, icon, onViewAll, widthClassName = 'w-[319px]' }: SectionHeaderProps) {
  return (
    <div className={`flex h-[17px] items-center justify-between ${widthClassName}`}>
      <div className="flex items-center gap-[6px]">
        {icon === 'draft' ? <img src={sectionDraftIcon} alt="" className="h-[16px] w-[16px] shrink-0" /> : null}
        {icon === 'written' ? <img src={sectionDraftIcon} alt="" className="h-[16px] w-[16px] shrink-0" /> : null}
        {icon === 'bookmarked' ? <img src={bookmarkIcon} alt="" className="h-[16px] w-[16px] shrink-0" /> : null}
        <span className="font-['Pretendard'] text-[14px] font-[600] leading-[16.8px] tracking-[0px] text-[#494949] [font-feature-settings:'case'_1]">
          {title}
        </span>
      </div>
      <button
        type="button"
        onClick={onViewAll}
        className="flex h-[14px] min-w-[43px] shrink-0 items-center justify-center whitespace-nowrap font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#8A8A8A] [font-feature-settings:'case'_1]"
      >
        전체보기
      </button>
    </div>
  );
}

function DraftCard95({ draft }: { draft: DraftPreviewViewModel }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="flex h-[95px] w-[319px] flex-col items-start gap-[16px] rounded-[4px] bg-[#F8F8F8] px-[16px] py-[12px] text-left"
      onClick={() => {
        navigate('/create');
      }}
    >
      <div className="flex w-full flex-col items-start gap-[4px]">
        <span className="font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] tracking-[0px] text-[#131416] [font-feature-settings:'case'_1]">
          {draft.title}
        </span>
        <span className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949] [font-feature-settings:'case'_1]">
          {draft.description}
        </span>
      </div>
      <div className="flex items-center gap-[4px] font-['Pretendard'] text-[12px] font-[300] leading-[16.8px] tracking-[0px] text-[#8A8A8A] [font-feature-settings:'case'_1]">
        <span>임시저장</span>
        <span>•</span>
        <span>{draft.savedAt}</span>
      </div>
    </button>
  );
}

function DraftSection({
  draft,
  loading,
}: {
  draft: DraftPreviewViewModel | null;
  loading: boolean;
}) {
  const navigate = useNavigate();
  const content = FIGMA_PREVIEW_MODE ? PREVIEW_DRAFT : draft;

  return (
    <section className="flex h-[146px] w-[343px] flex-col items-start gap-[10px] rounded-[4px] bg-[#FFFFFF] p-[12px] shadow-[0px_0px_2px_rgba(0,0,0,0.1)]">
      <SectionHeader
        title="작성 중인 글"
        icon="draft"
        onViewAll={() => {
          navigate('/create');
        }}
      />
      {loading ? (
        <div className="flex h-[95px] w-[319px] items-center justify-center rounded-[4px] bg-[#F8F8F8]">
          <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#8A8A8A]">불러오는 중...</span>
        </div>
      ) : content ? (
        <DraftCard95 draft={content} />
      ) : (
        <div className="flex h-[95px] w-[319px] items-center justify-center rounded-[4px] bg-[#F8F8F8]">
          <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#8A8A8A]">작성 중인 글이 없습니다</span>
        </div>
      )}
    </section>
  );
}

function PreviewCaseCard135({ card }: { card: PreviewCaseViewModel }) {
  const navigate = useNavigate();
  const statusClassName = card.statusLabel === '성공' ? 'bg-[#5A876E] text-[#FFFFFF]' : 'bg-[#C06D43] text-[#FFFFFF]';

  return (
    <button
      type="button"
      className="flex h-[135px] w-[319px] flex-col items-start gap-[8px] rounded-[4px] bg-[#F8F8F8] px-[16px] py-[12px] text-left"
      onClick={() => navigate(`/experiences/${card.id}`)}
    >
      <div className="flex items-center gap-[4px]">
        <span
          className={`flex h-[18px] items-center justify-center rounded-[4px] px-[4px] py-[2px] font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] tracking-[0px] ${statusClassName}`}
        >
          {card.statusLabel}
        </span>
        <span className="flex h-[18px] items-center justify-center rounded-[4px] bg-[#CBE5D8] px-[4px] py-[2px] font-['Pretendard'] text-[12px] font-[500] leading-[14.4px] tracking-[0px] text-[#5A876E]">
          {card.categoryLabel}
        </span>
        {card.keywords.map((keyword, index) => (
          <span
            key={`${card.id}-${keyword}-${index}`}
            className="flex h-[18px] items-center justify-center rounded-[4px] bg-[#D8D8D8] px-[4px] py-[2px] font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#FFFFFF]"
          >
            {keyword}
          </span>
        ))}
      </div>

      <div className={`flex w-full items-start ${card.variant === 'with-thumbnail' ? 'gap-[8px]' : 'h-[60px]'}`}>
        {card.variant === 'with-thumbnail' ? <div className="h-[60px] w-[80px] shrink-0 rounded-[4px] bg-[#8A8A8A]" /> : null}
        <div className="flex h-[60px] min-w-0 flex-1 flex-col items-start">
          <div className="flex min-h-0 w-full flex-1 flex-col items-start gap-[4px]">
            <span className="w-full overflow-hidden text-ellipsis whitespace-nowrap font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] tracking-[0px] text-[#131416] [font-feature-settings:'case'_1]">
              {card.title}
            </span>
            <span className="w-full overflow-hidden text-ellipsis whitespace-nowrap font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949] [font-feature-settings:'case'_1]">
              {card.description}
            </span>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-[4px] font-['Pretendard'] text-[12px] font-[300] leading-[16.8px] tracking-[0px] text-[#8A8A8A] [font-feature-settings:'case'_1]">
          <span>{card.authorName}</span>
          <span>•</span>
          <span>{card.createdAtLabel}</span>
          <span>•</span>
          <div className="flex items-center gap-[2px]">
            <span>조회</span>
            <span>{card.viewCountLabel}</span>
          </div>
        </div>

        <button
          type="button"
          aria-label="북마크"
          className="flex items-center gap-[2px]"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <img src={bookmarkIcon} alt="" className="h-[14px] w-[14px] shrink-0" />
          <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#8A8A8A] [font-feature-settings:'case'_1]">
            {card.bookmarkCountLabel}
          </span>
        </button>
      </div>
    </button>
  );
}

function WrittenPreviewSection({
  cards,
  loading,
}: {
  cards: PreviewCaseViewModel[];
  loading: boolean;
}) {
  const navigate = useNavigate();
  const content = FIGMA_PREVIEW_MODE ? PREVIEW_WRITTEN_CARDS : cards;

  return (
    <section className="flex h-[331px] w-[343px] flex-col items-start gap-[10px] rounded-[4px] bg-[#FFFFFF] p-[12px] shadow-[0px_0px_2px_rgba(0,0,0,0.1)]">
      <SectionHeader title="작성한 글" icon="written" onViewAll={() => navigate('/mypage/written')} />
      {loading && !FIGMA_PREVIEW_MODE ? (
        <div className="flex h-[280px] w-[319px] items-center justify-center rounded-[4px] bg-[#F8F8F8]">
          <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#8A8A8A]">불러오는 중...</span>
        </div>
      ) : content.length ? (
        content.slice(0, 2).map((card) => <PreviewCaseCard135 key={card.id} card={card} />)
      ) : (
        <div className="flex h-[280px] w-[319px] items-center justify-center rounded-[4px] bg-[#F8F8F8]">
          <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#8A8A8A]">작성한 글이 없습니다</span>
        </div>
      )}
    </section>
  );
}

function BookmarkPreviewCardSm({ card }: { card: BookmarkPreviewViewModel }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="flex h-[134px] w-[96.33px] flex-col items-start overflow-hidden rounded-[4px] bg-[#FFFFFF] shadow-[0px_0px_2px_rgba(0,0,0,0.1)]"
      onClick={() => navigate(`/experiences/${card.id}`)}
    >
      <div className="flex h-[80px] w-[96.33px] items-start justify-end bg-[#8A8A8A] p-[4px]">
        <button
          type="button"
          aria-label="북마크"
          className="flex h-[20px] w-[20px] items-center justify-center"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <img src={bookmarkIcon} alt="" className="h-[20px] w-[20px] shrink-0" />
        </button>
      </div>
      <div className="flex w-full flex-col items-start justify-center gap-[4px] p-[8px]">
        <span className="w-full overflow-hidden text-ellipsis whitespace-nowrap font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] tracking-[0px] text-[#131416] [font-feature-settings:'case'_1]">
          {card.title}
        </span>
        <span className="font-['Pretendard'] text-[12px] font-[300] leading-[16.8px] tracking-[0px] text-[#8A8A8A] [font-feature-settings:'case'_1]">
          {card.createdAtLabel}
        </span>
      </div>
    </button>
  );
}

function BookmarkPreviewSection({
  cards,
  loading,
}: {
  cards: BookmarkPreviewViewModel[];
  loading: boolean;
}) {
  const navigate = useNavigate();
  const content = FIGMA_PREVIEW_MODE ? PREVIEW_BOOKMARK_CARDS : cards;

  return (
    <section className="flex h-[185px] w-[343px] flex-col items-center gap-[10px] rounded-[4px] bg-[#FFFFFF] px-[16px] py-[12px] shadow-[0px_0px_2px_rgba(0,0,0,0.1)]">
      <SectionHeader title="북마크" icon="bookmarked" widthClassName="w-[311px]" onViewAll={() => navigate('/mypage/bookmarks')} />
      <div className="flex w-[311px] items-center gap-[11px]">
        {loading && !FIGMA_PREVIEW_MODE ? (
          <div className="flex h-[134px] w-[311px] items-center justify-center rounded-[4px] bg-[#F8F8F8]">
            <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#8A8A8A]">불러오는 중...</span>
          </div>
        ) : content.length ? (
          content.slice(0, 3).map((card) => <BookmarkPreviewCardSm key={card.id} card={card} />)
        ) : (
          <div className="flex h-[134px] w-[311px] items-center justify-center rounded-[4px] bg-[#F8F8F8]">
            <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#8A8A8A]">북마크가 없습니다</span>
          </div>
        )}
      </div>
    </section>
  );
}

type FabButtonProps = {
  variant: 'left' | 'right';
  onClick: () => void;
};

function FabButton({ variant, onClick }: FabButtonProps) {
  const isLeft = variant === 'left';

  if (isLeft) {
    return (
      <button
        type="button"
        aria-label="경험 작성"
        onClick={onClick}
        className="flex items-center gap-[8px] rounded-[10px] bg-[#FFFFFF] px-[10px] py-[12px] shadow-[0px_0px_4px_rgba(0,0,0,0.15)]"
      >
        <div className="flex h-[17px] w-[17px] items-center justify-center">
          <img src={editIcon} alt="" className="h-[17px] w-[17px] shrink-0" />
        </div>
        <span className="font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] tracking-[0px] text-[#000000] [font-feature-settings:'case'_1]">
          경험 작성
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label="작성하기"
      onClick={onClick}
      className="flex h-[36px] w-[36px] items-center justify-center rounded-[999px] bg-[#5A876E]"
    >
      <img src={plusFabIcon} alt="" className="h-[20.667px] w-[20.667px] shrink-0" />
    </button>
  );
}

type BottomNavItemProps = {
  icon: 'home' | 'explore' | 'guide' | 'mypage';
  label: string;
  active?: boolean;
  onClick: () => void;
};

function BottomNavItem({ icon, label, active = false, onClick }: BottomNavItemProps) {
  const opacityClassName = active ? 'opacity-100' : 'opacity-30';
  const iconFilter = active ? ACTIVE_NAV_ICON_FILTER : undefined;

  return (
      <button type="button" onClick={onClick} className={`flex flex-col items-center gap-[4px] ${opacityClassName}`}>
        <div className="flex h-[24px] w-[24px] items-center justify-center">
        {icon === 'home' ? <img src={homeNavIcon} alt="" className="h-[24px] w-[24px] shrink-0" style={iconFilter ? { filter: iconFilter } : undefined} /> : null}
        {icon === 'explore' ? <img src={searchNavIcon} alt="" className="h-[24px] w-[24px] shrink-0" style={iconFilter ? { filter: iconFilter } : undefined} /> : null}
        {icon === 'guide' ? <img src={liveHelpNavIcon} alt="" className="h-[24px] w-[24px] shrink-0" style={iconFilter ? { filter: iconFilter } : undefined} /> : null}
        {icon === 'mypage' ? <img src={userNavIcon} alt="" className="h-[24px] w-[24px] shrink-0" style={iconFilter ? { filter: iconFilter } : undefined} /> : null}
        </div>
      <span
        className={`font-['Pretendard'] text-[12px] leading-[12px] tracking-[0px] ${active ? 'font-[600] text-[#5A876E]' : 'font-[400] text-[#000000]'} [font-feature-settings:'case'_1]`}
      >
        {label}
      </span>
    </button>
  );
}

function FixedBottomArea() {
  const navigate = useNavigate();

  return (
    <div className="absolute bottom-0 left-0 flex h-[152px] w-[375px] flex-col items-center">
      <div className="flex h-[68px] w-[375px] items-center justify-between px-[24px] py-[16px]">
        <FabButton
          variant="left"
          onClick={() => {
            // TODO: Replace with a dedicated assisted writing route when it exists.
            navigate('/create');
          }}
        />
        <FabButton variant="right" onClick={() => navigate('/create')} />
      </div>
      <nav className="flex h-[84px] w-[375px] items-center justify-between rounded-tl-[20px] rounded-tr-[20px] bg-[#FFFFFF] px-[40px] pb-[32px] pt-[12px] shadow-[0px_0px_5px_rgba(0,0,0,0.15)]">
        <BottomNavItem icon="home" label="홈" onClick={() => navigate('/')} />
        <BottomNavItem icon="explore" label="탐색" onClick={() => navigate('/explore')} />
        <BottomNavItem icon="guide" label="가이드" onClick={() => navigate('/faq')} />
        <BottomNavItem icon="mypage" label="MY" active onClick={() => navigate('/mypage')} />
      </nav>
    </div>
  );
}

export default function MyPageOverview() {
  const navigate = useNavigate();
  const token = getAccessToken();
  const storedUser = getStoredUser();
  const [profile, setProfile] = useState<UserSummary | null>(storedUser);
  const [writtenExperiences, setWrittenExperiences] = useState<Experience[]>([]);
  const [bookmarkedExperiences, setBookmarkedExperiences] = useState<Experience[]>([]);
  const [recentExperiences, setRecentExperiences] = useState<Experience[]>([]);
  const [writtenLoading, setWrittenLoading] = useState(Boolean(token));
  const [bookmarkLoading, setBookmarkLoading] = useState(Boolean(token));
  const [profileError, setProfileError] = useState('');
  const [writtenError, setWrittenError] = useState('');
  const [bookmarkError, setBookmarkError] = useState('');
  const [recentError, setRecentError] = useState('');

  useEffect(() => {
    if (!token) {
      setWrittenLoading(false);
      setBookmarkLoading(false);
      return;
    }

    let cancelled = false;

    setWrittenLoading(true);
    setBookmarkLoading(true);

    void getMe(token)
      .then((payload) => {
        if (cancelled) {
          return;
        }
        setProfile(payload.user);
        setProfileError('');
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        if (isAuthError(error)) {
          clearSession();
          navigate('/auth?next=%2Fmypage');
          return;
        }
        setProfileError(resolveErrorMessage(error, '프로필 정보를 불러오지 못했어요.'));
      })
    void getMyExperiences(token)
      .then((payload) => {
        if (cancelled) {
          return;
        }
        setWrittenExperiences(payload);
        setWrittenError('');
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setWrittenExperiences([]);
        if (isAuthError(error)) {
          clearSession();
          navigate('/auth?next=%2Fmypage');
          return;
        }
        setWrittenError(resolveErrorMessage(error, '작성한 글 목록을 불러오지 못했어요.'));
      })
      .finally(() => {
        if (!cancelled) {
          setWrittenLoading(false);
        }
      });

    void getMyBookmarks(token)
      .then((payload) => {
        if (cancelled) {
          return;
        }
        setBookmarkedExperiences(payload);
        setBookmarkError('');
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setBookmarkedExperiences([]);
        if (isAuthError(error)) {
          clearSession();
          navigate('/auth?next=%2Fmypage');
          return;
        }
        setBookmarkError(resolveErrorMessage(error, '북마크 목록을 불러오지 못했어요.'));
      })
      .finally(() => {
        if (!cancelled) {
          setBookmarkLoading(false);
        }
      });

    void getMyRecentViews(token)
      .then((payload) => {
        if (cancelled) {
          return;
        }
        setRecentExperiences(payload);
        setRecentError('');
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setRecentExperiences([]);
        if (isAuthError(error)) {
          clearSession();
          navigate('/auth?next=%2Fmypage');
          return;
        }
        setRecentError(resolveErrorMessage(error, '최근 본 글 목록을 불러오지 못했어요.'));
      })
      .finally(() => {
        if (!cancelled) {
          // No separate recent loading UI is rendered in the overview.
        }
      });

    return () => {
      cancelled = true;
    };
  }, [navigate, token]);

  const viewModel = useMemo<MyPageOverviewViewModel>(() => {
    if (FIGMA_PREVIEW_MODE) {
      return {
        profile: buildFallbackProfile(profile),
        counts: {
          written: 999,
          bookmarked: 999,
          recent: 999,
        },
        draft: PREVIEW_DRAFT,
        writtenPreview: PREVIEW_WRITTEN_CARDS,
        bookmarkPreview: PREVIEW_BOOKMARK_CARDS,
      };
    }

    const recentCount = recentError ? getRecentViewedExperienceIds().length || 0 : recentExperiences.length;

    return {
      profile: buildFallbackProfile(profile),
      counts: {
        written: writtenExperiences.length,
        bookmarked: bookmarkedExperiences.length,
        recent: recentCount,
      },
      draft: null,
      writtenPreview: writtenExperiences.slice(0, 2).map(toPreviewCase),
      bookmarkPreview: bookmarkedExperiences.slice(0, 3).map(toBookmarkPreview),
    };
  }, [bookmarkedExperiences, profile, recentExperiences, writtenExperiences]);

  const hasOverviewErrors = profileError || writtenError || bookmarkError || recentError;

  return (
    <div className="relative mx-auto h-[1131px] w-[375px] overflow-hidden bg-[#FFFFFF]">
      <div className="h-[123px] w-[375px] bg-[#FFFFFF]">
        <StatusBar />
        <OverviewHeader />
      </div>

      <main className="flex h-[1008px] w-[375px] flex-col gap-[20px] overflow-y-auto px-[16px] pb-[110px] pt-[2px]">
        <ProfileCard profile={viewModel.profile} counts={viewModel.counts} />
        <DraftSection draft={viewModel.draft} loading={false} />
        <WrittenPreviewSection cards={viewModel.writtenPreview} loading={writtenLoading} />
        <BookmarkPreviewSection cards={viewModel.bookmarkPreview} loading={bookmarkLoading} />

        {hasOverviewErrors ? (
          <div className="flex w-[343px] flex-col gap-[4px] rounded-[4px] bg-[#F8F8F8] px-[12px] py-[10px]">
            {profileError ? <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#8A8A8A]">{profileError}</span> : null}
            {writtenError ? <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#8A8A8A]">{writtenError}</span> : null}
            {bookmarkError ? <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#8A8A8A]">{bookmarkError}</span> : null}
            {recentError ? <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#8A8A8A]">{recentError}</span> : null}
          </div>
        ) : null}
      </main>

      <FixedBottomArea />
    </div>
  );
}
