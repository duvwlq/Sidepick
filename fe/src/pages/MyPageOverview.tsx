import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import batteryFrameIcon from '../assets/auth-figma/battery-frame.svg';
import cellularConnectionIcon from '../assets/auth-figma/cellular-connection.svg';
import wifiIcon from '../assets/auth-figma/wifi.svg';
import bookmarkIcon from '../assets/explore-figma/bookmark.svg';
import chevronIcon from '../assets/mypage-figma/chevron.svg';
import eyeIcon from '../assets/mypage-figma/eye.svg';
import fileTextIcon from '../assets/mypage-figma/file-text.svg';
import heartIcon from '../assets/mypage-figma/heart.svg';
import avatarPlaceholderIcon from '../assets/mypage-overview-figma/avatar-placeholder.png';
import cameraIcon from '../assets/mypage-overview-figma/camera.svg';
import sectionDraftIcon from '../assets/mypage-overview-figma/section-draft.svg';
import settingsIcon from '../assets/mypage-overview-figma/settings.svg';
import { CaseChip } from '../components/common/CaseUi';
import BottomNav from '../components/layout/BottomNav';
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
import { getExperienceImageMeta } from '../lib/experience-images';
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
  return (experience as Experience & { bookmarkCount?: number }).bookmarkCount ?? experience.likeCount;
}

const BOOKMARK_ACCENT_FILTER =
  'invert(48%) sepia(12%) saturate(901%) hue-rotate(97deg) brightness(92%) contrast(88%)';

function IosStatusBar() {
  return (
    <div className="flex h-[59px] items-center justify-between bg-white px-[24px] pb-[19px] pt-[21px]">
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
    icon === 'bookmark' ? (
      <img src={bookmarkIcon} alt="" className="h-[16px] w-[16px]" />
    ) : icon === 'draft' ? (
      <img src={sectionDraftIcon} alt="" className="h-[16px] w-[16px]" />
    ) : icon === 'written' ? (
      <img src={fileTextIcon} alt="" className="h-[16px] w-[16px]" />
    ) : (
      <img src={eyeIcon} alt="" className="h-[16px] w-[16px]" />
    );

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-[6px]">
        {iconNode}
        <span className="font-['Pretendard'] text-[14px] font-[600] leading-[16.8px] text-[#494949]">{title}</span>
      </div>
      <button
        type="button"
        onClick={onViewAll}
        className="font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] text-[#8A8A8A]"
      >
        전체보기
      </button>
    </div>
  );
}

function Tag({
  label,
  tone,
}: {
  label: string;
  tone: 'success' | 'failure' | 'category' | 'keyword';
}) {
  return (
    <CaseChip
      label={label}
      tone={tone === 'success' ? 'status-success' : tone === 'failure' ? 'status-failure' : tone}
      compact
      maxWidthClassName={tone === 'category' ? 'max-w-[108px]' : 'max-w-[58px]'}
    />
  );
}

function MetaRow({ experience }: { experience: Experience }) {
  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex min-w-0 items-center gap-[4px] overflow-hidden font-['Pretendard'] text-[12px] font-[300] leading-[16.8px] text-[#8A8A8A]">
        <span className="truncate">{sanitizeText(experience.author.nickname, '닉네임')}</span>
        <span>•</span>
        <span>{formatDate(experience.createdAt)}</span>
        <span>•</span>
        <span>{`조회 ${experience.viewCount}`}</span>
      </div>
      <div className="ml-[8px] flex shrink-0 items-center gap-[4px]">
        <div className="flex items-center gap-[2px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#8A8A8A]">
          <img src={heartIcon} alt="" className="h-[14px] w-[14px]" />
          <span>{experience.likeCount}</span>
        </div>
        <div className="flex items-center gap-[2px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#8A8A8A]">
          <img src={bookmarkIcon} alt="" className="h-[14px] w-[14px]" />
          <span>{resolveBookmarkCount(experience)}</span>
        </div>
      </div>
    </div>
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

  const statItems = [
    { key: 'written', icon: fileTextIcon, label: '작성한 글', value: counts.written, path: '/mypage/written', iconClassName: 'h-[16px] w-[16px]' },
    { key: 'bookmark', icon: bookmarkIcon, label: '북마크', value: counts.bookmarked, path: '/mypage/bookmarks', iconClassName: 'h-[16px] w-[16px]' },
    { key: 'recent', icon: eyeIcon, label: '최근 본 글', value: counts.recent, path: '/mypage/recent', iconClassName: 'h-[16px] w-[16px]' },
  ] as const;

  return (
    <section className="w-full rounded-[4px] bg-white px-[10px] shadow-[0_0_2px_rgba(0,0,0,0.1)]">
      <button
        type="button"
        onClick={() => navigate('/mypage/profile/edit')}
        className="flex w-full items-center justify-between py-[8px] text-left"
        aria-label="프로필 수정"
      >
        <div className="flex items-center gap-[8px]">
          <div className="relative flex h-[80px] w-[80px] items-center justify-center overflow-hidden rounded-full bg-[#F1F1F1]">
            <img src={profile?.profileImage || avatarPlaceholderIcon} alt="" className="h-full w-full object-cover" />
            <span className="absolute bottom-0 right-0 flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[#8A8A8A]">
              <img src={cameraIcon} alt="" className="h-[14px] w-[14px]" />
            </span>
          </div>
          <div className="flex flex-col items-start">
            <span className="font-['Pretendard'] text-[16px] font-[400] leading-[22.4px] text-[#131416]">{nickname}</span>
            <span className="font-['Pretendard'] text-[10px] font-[400] leading-[14px] text-[#BABABA]">{email}</span>
          </div>
        </div>
        <span className="flex h-[20px] w-[20px] items-center justify-center">
          <img src={chevronIcon} alt="" className="h-[9.5px] w-[5.5px] rotate-180 opacity-[0.58]" />
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
              <img src={item.icon} alt="" className={item.iconClassName} />
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
        className="mt-[10px] block h-[95px] w-full rounded-[4px] bg-[#F8F8F8] px-[12px] py-[16px] text-left"
      >
        <p className="font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] text-[#131416]">제목입니다</p>
        <p className="mt-[4px] line-clamp-1 font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#494949]">
          본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기
        </p>
        <div className="mt-[16px] flex items-center gap-[4px] font-['Pretendard'] text-[12px] leading-[16.8px]">
          <span className="font-[400] text-[#92BFA6]">임시저장</span>
          <span className="font-[300] text-[#8A8A8A]">•</span>
          <span className="font-[300] text-[#8A8A8A]">2026.00.00</span>
        </div>
      </button>
    </section>
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
  const imageMeta = getExperienceImageMeta(experience);
  const keywords = extractKeywordTags(experience);

  return (
    <article className="h-[171px] w-full rounded-[4px] bg-[#F8F8F8]">
      <button
        type="button"
        onClick={() => navigate(`/experiences/${experience.id}`)}
        className="flex h-full w-full flex-col gap-[8px] px-[16px] py-[12px] text-left"
      >
        <div className="flex items-center gap-[4px] overflow-hidden">
          <Tag label={experience.caseStatus === 'SUCCESS' ? '성공' : '실패'} tone={experience.caseStatus === 'SUCCESS' ? 'success' : 'failure'} />
          <Tag label={sanitizeText(experience.category.name, '카테고리')} tone="category" />
          {keywords.map((keyword) => (
            <Tag key={`${experience.id}-${keyword}`} label={keyword} tone="keyword" />
          ))}
        </div>

        <div className="flex min-h-[60px] items-start gap-[8px]">
          {showThumbnail ? (
            <div className="relative h-[60px] w-[80px] shrink-0 overflow-hidden rounded-[4px] bg-[#D8D8D8]">
              {imageMeta.primaryImageUrl ? <img src={imageMeta.primaryImageUrl} alt="" className="h-full w-full object-cover" /> : null}
              {imageMeta.imageCount > 1 ? (
                <span className="absolute bottom-0 right-0 flex h-[16px] w-[16px] items-center justify-center rounded-[4px] bg-[rgba(0,0,0,0.25)] font-['Pretendard'] text-[10px] font-[500] leading-[16px] text-white">
                  {imageMeta.imageCount}
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
            <p className="line-clamp-1 font-['Pretendard'] text-[16px] font-[500] leading-[19.2px] text-[#131416]">
              {sanitizeText(experience.title, '제목')}
            </p>
            <p className="line-clamp-2 min-h-[33.6px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#494949]">
              {sanitizeText(stripImageMarkdown(experience.content), '본문 텍스트 미리보기')}
            </p>
          </div>
        </div>

        <div className="mt-auto">
          <MetaRow experience={experience} />
        </div>
      </button>
    </article>
  );
}

function EmptyBlock({ message }: { message: string }) {
  return (
    <div className="flex h-[95px] items-center justify-center rounded-[4px] bg-[#F8F8F8]">
      <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#8A8A8A]">{message}</span>
    </div>
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
          <EmptyBlock message={emptyMessage} />
        )}
      </div>
    </section>
  );
}

function BookmarkPreviewCard({
  experience,
  variant,
}: {
  experience: Experience;
  variant: 'primary' | 'secondary';
}) {
  const navigate = useNavigate();
  const imageHeight = variant === 'primary' ? 'h-[112px]' : 'h-[76px]';
  const bodyHeight = variant === 'primary' ? 'h-[56px]' : 'h-[58px]';
  const bodyPadding = variant === 'primary' ? 'px-[8px] py-[8px]' : 'px-[8px] py-[8px]';
  const titleClassName = variant === 'primary' ? 'line-clamp-2 h-[33.6px]' : 'line-clamp-1 h-[16.8px]';

  return (
    <article className={`w-[96.333px] ${variant === 'primary' ? 'h-[168px]' : 'h-[134px]'} overflow-hidden rounded-[4px] bg-white shadow-[0_0_2px_rgba(0,0,0,0.1)]`}>
      <button
        type="button"
        onClick={() => navigate(`/experiences/${experience.id}`)}
        className="flex h-full w-full flex-col text-left"
      >
        <div className={`flex ${imageHeight} items-start justify-end bg-[#D8D8D8] p-[4px]`}>
          <img src={bookmarkIcon} alt="" className="h-[20px] w-[20px]" style={{ filter: BOOKMARK_ACCENT_FILTER }} />
        </div>
        <div className={`flex ${bodyHeight} flex-col justify-between bg-white ${bodyPadding}`}>
          <span className={`${titleClassName} font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] text-[#131416]`}>
            {sanitizeText(experience.title, '제목입니다')}
          </span>
          <span className="font-['Pretendard'] text-[12px] font-[300] leading-[16.8px] text-[#8A8A8A]">{formatDate(experience.createdAt)}</span>
        </div>
      </button>
    </article>
  );
}

function BookmarkSection({ items }: { items: Experience[] }) {
  const navigate = useNavigate();

  return (
    <section className="h-[185px] w-full rounded-[4px] bg-white px-[16px] pb-[12px] pt-[12px] shadow-[0_0_2px_rgba(0,0,0,0.1)]">
      <SectionHeader icon="bookmark" title="북마크" onViewAll={() => navigate('/mypage/bookmarks')} />
      <div className="mt-[10px] h-[168px]">
        {items.length ? (
          <div className="flex h-[168px] items-start gap-[11px]">
            {items.slice(0, 3).map((experience, index) => (
              <BookmarkPreviewCard key={experience.id} experience={experience} variant={index === 0 ? 'primary' : 'secondary'} />
            ))}
          </div>
        ) : (
          <EmptyBlock message="북마크가 없어요" />
        )}
      </div>
    </section>
  );
}

export default function MyPageOverview() {
  const navigate = useNavigate();
  const token = getAccessToken();
  const storedUser = mergeProfileOverrides(getStoredUser());

  const [profile, setProfile] = useState<UserSummary | null>(storedUser);
  const [writtenExperiences, setWrittenExperiences] = useState<Experience[]>([]);
  const [bookmarkedExperiences, setBookmarkedExperiences] = useState<Experience[]>([]);
  const [recentExperiences, setRecentExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

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

  if (!token) {
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
            <img src={settingsIcon} alt="" className="h-[20px] w-[20px]" />
          </button>
        </div>
      </header>

      <main className="flex flex-col gap-[20px] px-[16px] pb-[128px]">
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

        {error ? (
          <div className="rounded-[4px] bg-[#F8F8F8] px-[12px] py-[10px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#8A8A8A]">
            {error}
          </div>
        ) : null}
      </main>

      <BottomNav active="mypage" />
    </div>
  );
}
