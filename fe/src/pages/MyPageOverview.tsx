import { Bookmark, Edit, Eye, FileText, Plus, Settings } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import batteryFrameIcon from '../assets/auth-figma/battery-frame.svg';
import cellularConnectionIcon from '../assets/auth-figma/cellular-connection.svg';
import wifiIcon from '../assets/auth-figma/wifi.svg';
import avatarPlaceholderIcon from '../assets/mypage-overview-figma/avatar-placeholder.svg';
import cameraIcon from '../assets/mypage-overview-figma/camera.svg';
import chevronIcon from '../assets/mypage-overview-figma/chevron.svg';
import BottomNav from '../components/layout/BottomNav';
import { CaseTextLink } from '../components/common/CaseUi';
import {
  ApiError,
  getMe,
  getMyBookmarks,
  getMyExperiences,
  getMyRecentViews,
  type Experience,
  type UserSummary,
} from '../lib/api';
import { BOOKMARK_SYNC_EVENT, type BookmarkSyncDetail } from '../lib/bookmark-sync';
import { extractExperienceImageUrls } from '../lib/experience-images';
import { mergeProfileOverrides } from '../lib/profile-overrides';
import { resolveErrorMessage } from '../lib/resolve-error-message';
import { clearSession, getAccessToken, getStoredUser } from '../lib/session';

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

function extractKeywordTags(experience: Experience) {
  const raw = [
    ...(experience.analysis?.keywords ?? []),
    ...experience.failureReasons,
    ...experience.difficulties,
    experience.businessType ?? '',
  ]
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => value !== experience.category.name);

  return Array.from(new Set(raw)).slice(0, 2);
}

function resolveBookmarkCount(experience: Experience) {
  return experience.bookmarkCount ?? 0;
}

function IosStatusBar() {
  return (
    <div className="flex h-[59px] items-center bg-white px-[24px] pb-[19px] pt-[21px]">
      <div className="flex min-w-0 flex-1 justify-center pt-[1.5px] font-['SF_Pro'] text-[17px] font-[590] leading-[22px] text-black">
        9:41
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-center gap-[7px] pr-[1px] pt-[1px]">
        <img src={cellularConnectionIcon} alt="" className="h-[12.226px] w-[19.2px]" />
        <img src={wifiIcon} alt="" className="h-[12.328px] w-[17.142px]" />
        <img src={batteryFrameIcon} alt="" className="h-[13px] w-[27.328px]" />
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  onViewAll,
}: {
  icon: 'draft' | 'written' | 'bookmark' | 'recent';
  title: string;
  onViewAll: () => void;
}) {
  const iconNode =
    icon === 'draft' ? (
      <Edit size={16} strokeWidth={1.9} color="#5A876E" />
    ) : icon === 'written' ? (
      <FileText size={16} strokeWidth={1.9} color="#5A876E" />
    ) : icon === 'bookmark' ? (
      <Bookmark size={16} strokeWidth={1.9} color="#5A876E" />
    ) : (
      <Eye size={16} strokeWidth={1.9} color="#5A876E" />
    );

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-[6px]">
        {iconNode}
        <span className="font-['Pretendard'] text-[14px] font-[600] leading-[16.8px] text-[#494949]">{title}</span>
      </div>
      <CaseTextLink label="전체보기" onClick={onViewAll} />
    </div>
  );
}

function Badge({
  label,
  tone,
}: {
  label: string;
  tone: 'status' | 'category' | 'keyword';
}) {
  const toneClass =
    tone === 'status'
      ? 'bg-[#C06D43] text-white'
      : tone === 'category'
        ? 'bg-[#CBE5D8] text-[#5A876E]'
        : 'bg-[#E6E6E6] text-[#8A8A8A]';

  return (
    <span className={`inline-flex h-[16px] items-center rounded-[4px] px-[4px] font-['Pretendard'] text-[10px] font-[500] leading-[12px] ${toneClass}`}>
      {label}
    </span>
  );
}

function MetaRow({ experience }: { experience: Experience }) {
  return (
    <div className="flex items-center justify-between gap-[8px]">
      <div className="min-w-0 flex items-center gap-[4px] overflow-hidden font-['Pretendard'] text-[12px] font-[300] leading-[16.8px] text-[#8A8A8A]">
        <span className="truncate">{sanitizeText(experience.author.nickname, '닉네임')}</span>
        <span>•</span>
        <span>{formatDate(experience.createdAt)}</span>
        <span>•</span>
        <span>{`조회 ${experience.viewCount}`}</span>
      </div>
      <div className="flex shrink-0 items-center gap-[4px]">
        <div className="flex items-center gap-[2px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#8A8A8A]">
          <span className="translate-y-[0.25px]">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 17.5L8.79167 16.4C4.5 12.5083 1.66667 9.94167 1.66667 6.79167C1.66667 4.225 3.675 2.21667 6.24167 2.21667C7.69167 2.21667 9.08333 2.89167 10 3.95833C10.9167 2.89167 12.3083 2.21667 13.7583 2.21667C16.325 2.21667 18.3333 4.225 18.3333 6.79167C18.3333 9.94167 15.5 12.5083 11.2083 16.4083L10 17.5Z" stroke="#8A8A8A" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span>{experience.likeCount}</span>
        </div>
        <div className="flex items-center gap-[2px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#8A8A8A]">
          <Bookmark size={14} strokeWidth={1.7} color="#8A8A8A" />
          <span>{resolveBookmarkCount(experience)}</span>
        </div>
      </div>
    </div>
  );
}

function StoryPreviewCard({
  experience,
  showThumbnail,
}: {
  experience: Experience;
  showThumbnail: boolean;
}) {
  const navigate = useNavigate();
  const imageUrls = extractExperienceImageUrls(experience);
  const keywords = extractKeywordTags(experience);
  const preview = sanitizeText(stripImageMarkdown(experience.content), '본문 텍스트 미리보기');

  return (
    <button
      type="button"
      onClick={() => navigate(`/experiences/${experience.id}`)}
      className="block w-full rounded-[4px] bg-[#F8F8F8] px-[16px] py-[12px] text-left"
    >
      <div className="flex flex-col gap-[8px]">
        <div className="flex items-center gap-[4px] overflow-hidden">
          <Badge label={experience.caseStatus === 'SUCCESS' ? '성공' : '실패'} tone="status" />
          <Badge label={sanitizeText(experience.category.name, '카테고리')} tone="category" />
          {keywords.map((keyword) => (
            <Badge key={`${experience.id}-${keyword}`} label={keyword} tone="keyword" />
          ))}
        </div>

        <div className="flex h-[60px] items-start gap-[8px]">
          {showThumbnail ? (
            <div className="relative h-[60px] w-[80px] shrink-0 rounded-[4px] bg-[#D8D8D8]">
              {imageUrls[0] ? <img src={imageUrls[0]} alt="" className="h-full w-full rounded-[4px] object-cover" /> : null}
              {imageUrls.length > 1 ? (
                <span className="absolute bottom-0 right-0 flex h-[16px] w-[16px] items-center justify-center rounded-[4px] bg-[rgba(0,0,0,0.25)] font-['Pretendard'] text-[12px] font-[500] leading-[16px] text-white">
                  {imageUrls.length}
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
            <p className="line-clamp-1 font-['Pretendard'] text-[16px] font-[500] leading-[19.2px] text-[#131416]">
              {sanitizeText(experience.title, '제목')}
            </p>
            <p className={`${showThumbnail ? 'line-clamp-2' : 'line-clamp-1'} font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#494949]`}>
              {preview}
            </p>
          </div>
        </div>

        <MetaRow experience={experience} />
      </div>
    </button>
  );
}

function ProfileCard({
  profile,
  counts,
}: {
  profile: UserSummary | null;
  counts: { written: number; bookmarked: number; recent: number };
}) {
  const navigate = useNavigate();
  const nickname = sanitizeText(profile?.nickname, '닉네임');
  const email = sanitizeText(profile?.email, '@sidepick@gmail.com');
  const profileImage = profile?.profileImage?.trim() || '';

  const statItems = [
    { key: 'written', icon: <Edit size={16} strokeWidth={1.9} color="#5A876E" />, label: '작성한 글', value: counts.written, path: '/mypage/written' },
    { key: 'bookmark', icon: <Bookmark size={16} strokeWidth={1.9} color="#5A876E" />, label: '북마크', value: counts.bookmarked, path: '/mypage/bookmarks' },
    { key: 'recent', icon: <Eye size={16} strokeWidth={1.9} color="#5A876E" />, label: '최근 본 글', value: counts.recent, path: '/mypage/recent' },
  ] as const;

  return (
    <section className="w-full rounded-[4px] bg-white px-[10px] shadow-[0_0_2px_rgba(0,0,0,0.1)]">
      <button
        type="button"
        onClick={() => navigate('/mypage/profile/edit')}
        className="flex w-full items-center justify-between py-[8px] text-left"
      >
        <div className="flex items-center gap-[8px]">
          <div className="relative flex h-[80px] w-[80px] items-center justify-center">
            <div className="flex h-[80px] w-[80px] items-center justify-center p-[8px]">
              {profileImage ? (
                <img src={profileImage} alt="" className="h-[64px] w-[64px] rounded-full bg-[#F8F8F8] object-contain" />
              ) : (
                <img src={avatarPlaceholderIcon} alt="" className="h-[64px] w-[64px]" />
              )}
            </div>
            <span className="absolute left-[49.5px] top-[49px] flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[#8A8A8A]">
              <img src={cameraIcon} alt="" className="h-[14px] w-[14px]" />
            </span>
          </div>

          <div className="min-w-0">
            <p className="font-['Pretendard'] text-[16px] font-[400] leading-[22.4px] text-[#131416]">{nickname}</p>
            <p className="truncate font-['Pretendard'] text-[10px] font-[400] leading-[14px] text-[#BABABA]">{email}</p>
          </div>
        </div>

        <span className="flex h-[20px] w-[20px] items-center justify-center">
          <img src={chevronIcon} alt="" className="h-[8px] w-[4px] rotate-180" />
        </span>
      </button>

      <div className="h-px w-full bg-[#EEEEEE]" />

      <div className="flex w-full items-center">
        {statItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => navigate(item.path)}
            className="flex flex-1 flex-col items-center gap-[10px] py-[16px]"
          >
            <div className="flex items-center gap-[4px]">
              {item.icon}
              <span className="font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] text-[#8A8A8A]">{item.label}</span>
            </div>
            <span className="font-['Pretendard'] text-[14px] font-[500] leading-[19.6px] text-[#494949]">{item.value}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function DraftSection() {
  const navigate = useNavigate();

  return (
    <section className="w-full rounded-[4px] bg-white p-[12px] shadow-[0_0_2px_rgba(0,0,0,0.1)]">
      <SectionHeader icon="draft" title="작성 중인 글" onViewAll={() => navigate('/create')} />
      <button
        type="button"
        onClick={() => navigate('/create')}
        className="mt-[10px] block w-full rounded-[4px] bg-[#F8F8F8] px-[16px] py-[12px] text-left"
      >
        <div className="flex flex-col gap-[16px]">
          <div className="flex flex-col gap-[8px]">
            <div className="flex items-center">
              <div className="min-w-0 flex-1">
                <p className="font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] text-[#131416]">제목입니다</p>
                <p className="line-clamp-1 font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#494949]">
                  본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-[4px] font-['Pretendard'] text-[12px] leading-[16.8px]">
            <span className="font-[400] text-[#5A876E]">임시저장</span>
            <span className="font-[300] text-[#8A8A8A]">•</span>
            <span className="font-[300] text-[#8A8A8A]">2026.00.00</span>
          </div>
        </div>
      </button>
    </section>
  );
}

function StorySection({
  title,
  icon,
  items,
  emptyMessage,
  onViewAll,
}: {
  title: string;
  icon: 'written' | 'recent';
  items: Experience[];
  emptyMessage: string;
  onViewAll: () => void;
}) {
  return (
    <section className="w-full rounded-[4px] bg-white p-[12px] shadow-[0_0_2px_rgba(0,0,0,0.1)]">
      <SectionHeader icon={icon} title={title} onViewAll={onViewAll} />
      <div className="mt-[10px] flex flex-col gap-[10px]">
        {items.length ? (
          items.slice(0, 2).map((experience, index) => (
            <StoryPreviewCard key={experience.id} experience={experience} showThumbnail={index > 0} />
          ))
        ) : (
          <div className="flex h-[95px] items-center justify-center rounded-[4px] bg-[#F8F8F8] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#8A8A8A]">
            {emptyMessage}
          </div>
        )}
      </div>
    </section>
  );
}

export function BookmarkPreviewCard({ experience }: { experience: Experience }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(`/experiences/${experience.id}`)}
      className="flex w-[98px] shrink-0 flex-col overflow-hidden rounded-[4px] bg-white text-left"
    >
      <div className="relative h-[92px] bg-[#D8D8D8]">
        <span className="absolute right-[6px] top-[6px]">
          <Bookmark size={14} strokeWidth={1.9} color="#A8D3BD" fill="#A8D3BD" />
        </span>
      </div>
      <div className="flex h-[56px] flex-col justify-between px-[8px] py-[6px]">
        <span className="line-clamp-2 font-['Pretendard'] text-[12px] font-[500] leading-[14.4px] text-[#131416]">
          {sanitizeText(experience.title, '제목입니다')}
        </span>
        <span className="font-['Pretendard'] text-[10px] font-[300] leading-[14px] text-[#8A8A8A]">{formatDate(experience.createdAt)}</span>
      </div>
    </button>
  );
}

function BookmarkPreviewCardFigma({ experience }: { experience: Experience }) {
  const navigate = useNavigate();
  const imageUrls = extractExperienceImageUrls(experience);

  return (
    <button
      type="button"
      onClick={() => navigate(`/experiences/${experience.id}`)}
      className="flex w-[96.333px] shrink-0 flex-col overflow-hidden rounded-[4px] bg-white text-left shadow-[0_0_2px_rgba(0,0,0,0.1)]"
    >
      <div className="relative flex h-[80px] w-full items-start justify-end bg-[#D8D8D8] p-[4px]">
        {imageUrls[0] ? <img src={imageUrls[0]} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null}
        <span className="relative z-10">
          <Bookmark size={24} strokeWidth={1.9} color="#92BFA6" fill="#92BFA6" />
        </span>
      </div>
      <div className="flex w-full flex-col gap-[4px] bg-white px-[8px] py-[8px]">
        <span className="truncate font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] text-[#131416]">
          {sanitizeText(experience.title, '제목입니다')}
        </span>
        <span className="font-['Pretendard'] text-[12px] font-[300] leading-[16.8px] text-[#8A8A8A]">{formatDate(experience.createdAt)}</span>
      </div>
    </button>
  );
}

function BookmarkSection({ items }: { items: Experience[] }) {
  const navigate = useNavigate();

  return (
    <section className="w-full rounded-[4px] bg-white p-[12px] shadow-[0_0_2px_rgba(0,0,0,0.1)]">
      <SectionHeader icon="bookmark" title="북마크" onViewAll={() => navigate('/mypage/bookmarks')} />
      <div className="mt-[10px]">
        {items.length ? (
          <div className="flex gap-[8px]">
            {items.slice(0, 3).map((experience) => (
              <BookmarkPreviewCardFigma key={experience.id} experience={experience} />
            ))}
          </div>
        ) : (
          <div className="flex h-[95px] items-center justify-center rounded-[4px] bg-[#F8F8F8] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#8A8A8A]">
            북마크가 없습니다
          </div>
        )}
      </div>
    </section>
  );
}

export default function MyPageOverview() {
  const navigate = useNavigate();
  const token = getAccessToken();
  const storedUser = mergeProfileOverrides(getStoredUser());

  const [authRequired, setAuthRequired] = useState(!token);
  const [profile, setProfile] = useState<UserSummary | null>(storedUser);
  const [writtenExperiences, setWrittenExperiences] = useState<Experience[]>([]);
  const [bookmarkedExperiences, setBookmarkedExperiences] = useState<Experience[]>([]);
  const [recentExperiences, setRecentExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    void Promise.all([getMe(token), getMyExperiences(token), getMyBookmarks(token), getMyRecentViews(token)])
      .then(([mePayload, writtenPayload, bookmarkPayload, recentPayload]) => {
        if (cancelled) return;
        setProfile(mergeProfileOverrides(mePayload.user));
        setWrittenExperiences(writtenPayload);
        setBookmarkedExperiences(bookmarkPayload);
        setRecentExperiences(recentPayload);
        setError('');
      })
      .catch((loadError) => {
        if (cancelled) return;
        if (isAuthError(loadError)) {
          setAuthRequired(true);
          setLoading(false);
          clearSession();
          navigate('/auth?next=%2Fmypage', { replace: true });
          return;
        }
        setError(resolveErrorMessage(loadError, '마이페이지 정보를 불러오지 못했어요.'));
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [navigate, token]);

  useEffect(() => {
    if (!token) return;
    const accessToken = token;
    let cancelled = false;

    async function reloadBookmarks(event: Event) {
      const detail = event instanceof CustomEvent ? (event.detail as BookmarkSyncDetail) : null;
      if (detail && !detail.bookmarked) {
        setBookmarkedExperiences((current) => current.filter((item) => item.id !== detail.experienceId));
        return;
      }

      try {
        const payload = await getMyBookmarks(accessToken);
        if (!cancelled) {
          setBookmarkedExperiences(payload);
        }
      } catch {
        // noop
      }
    }

    window.addEventListener(BOOKMARK_SYNC_EVENT, reloadBookmarks);
    return () => {
      cancelled = true;
      window.removeEventListener(BOOKMARK_SYNC_EVENT, reloadBookmarks);
    };
  }, [token]);

  const counts = useMemo(
    () => ({
      written: writtenExperiences.length,
      bookmarked: bookmarkedExperiences.length,
      recent: recentExperiences.length,
    }),
    [bookmarkedExperiences.length, recentExperiences.length, writtenExperiences.length],
  );

  if (!token || authRequired) {
    return (
      <div className="mx-auto min-h-screen w-full max-w-[375px] bg-white px-[16px] py-[48px]">
        <p className="font-['Pretendard'] text-[14px] text-[#8A8A8A]">로그인 후 마이페이지를 사용할 수 있어요.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-[375px] bg-white">
      <header className="bg-white">
        <IosStatusBar />
        <div className="flex items-center justify-between px-[16px] py-[20px]">
          <div className="h-[24px] w-[24px]" aria-hidden="true" />
          <h1 className="font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] text-black">마이페이지</h1>
          <button
            type="button"
            onClick={() => navigate('/mypage/profile/edit')}
            className="flex h-[20px] w-[20px] items-center justify-center"
            aria-label="프로필 수정"
          >
            <Settings size={20} strokeWidth={1.9} color="#131416" />
          </button>
        </div>
      </header>

      <main className="isolate flex flex-col items-start px-[16px] pb-[110px]">
        <div className="flex w-full flex-col gap-[20px]">
          <ProfileCard profile={profile} counts={counts} />
          <DraftSection />
          <StorySection
            title="작성한 글"
            icon="written"
            items={writtenExperiences}
            emptyMessage={loading ? '불러오는 중...' : '작성한 글이 없어요'}
            onViewAll={() => navigate('/mypage/written')}
          />
          <BookmarkSection items={bookmarkedExperiences} />
          <StorySection
            title="최근 본 글"
            icon="recent"
            items={recentExperiences}
            emptyMessage={loading ? '불러오는 중...' : '최근 본 글이 없어요'}
            onViewAll={() => navigate('/mypage/recent')}
          />
        </div>

        {error ? (
          <div className="mt-[12px] w-full rounded-[4px] bg-[#F8F8F8] px-[12px] py-[10px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#8A8A8A]">
            {error}
          </div>
        ) : null}
      </main>

      <div className="hidden fixed bottom-[110px] left-1/2 z-30 w-full max-w-[375px] -translate-x-1/2 justify-end px-[24px] py-[16px]">
        <button
          type="button"
          onClick={() => navigate('/create')}
          className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#5A876E]"
          aria-label="경험 작성"
        >
          <Plus size={20} strokeWidth={2.2} color="#FFFFFF" />
        </button>
      </div>

      <BottomNav
        active="mypage"
        accessoryLayout="end"
        accessory={
          <button
            type="button"
            onClick={() => navigate('/create')}
            className="pointer-events-auto flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#5A876E]"
            aria-label="경험 작성"
          >
            <Plus size={20} strokeWidth={2.2} color="#FFFFFF" />
          </button>
        }
      />
    </div>
  );
}
