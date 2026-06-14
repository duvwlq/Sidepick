import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import editIcon from '../../assets/explore-v3-figma-icons/사례 탐색 v.2 - 검색어를 치고 들어온 경우에만 유사도 표시/Edit 3.svg';
import guideIcon from '../../assets/explore-v3-figma-icons/사례 탐색 v.2 - 검색어를 치고 들어온 경우에만 유사도 표시/NavigationBar/live_help_20dp_1F1F1F_FILL0_wght400_GRAD0_opsz20 1.svg';
import homeIcon from '../../assets/explore-v3-figma-icons/사례 탐색 v.2 - 검색어를 치고 들어온 경우에만 유사도 표시/Home.svg';
import plusIcon from '../../assets/explore-v3-figma-icons/사례 탐색 v.2 - 검색어를 치고 들어온 경우에만 유사도 표시/Plus.svg';
import searchIcon from '../../assets/explore-v3-figma-icons/사례 탐색 v.2 - 검색어를 치고 들어온 경우에만 유사도 표시/Search.svg';
import userIcon from '../../assets/explore-v3-figma-icons/사례 탐색 v.2 - 검색어를 치고 들어온 경우에만 유사도 표시/User.svg';
import { getAccessToken } from '../../lib/session';

type BottomNavKey = 'home' | 'explore' | 'guide' | 'mypage';

type BottomNavProps = {
  active?: BottomNavKey;
  showFab?: boolean;
  fabExpanded?: boolean;
  onFabToggle?: () => void;
  onCreateClick?: () => void;
};

type NavItem = {
  key: BottomNavKey;
  label: string;
  path: string;
  icon: string;
  requiresAuth?: boolean;
  matches: (pathname: string) => boolean;
};

const NAV_CONTEXT_STORAGE_KEY = 'sidepick.bottomNav.active';

const NAV_ITEMS: NavItem[] = [
  {
    key: 'home',
    label: '홈',
    path: '/',
    icon: homeIcon,
    matches: (pathname) => pathname === '/' || pathname === '/v1/home' || pathname === '/home-legacy',
  },
  {
    key: 'explore',
    label: '탐색',
    path: '/explore',
    icon: searchIcon,
    matches: (pathname) =>
      pathname === '/explore' ||
      pathname === '/v1/explore' ||
      pathname === '/v3/explore' ||
      pathname === '/search' ||
      pathname === '/explore-figma' ||
      pathname.startsWith('/experiences/'),
  },
  {
    key: 'guide',
    label: '가이드',
    path: '/faq',
    icon: guideIcon,
    matches: (pathname) => pathname === '/faq' || pathname.startsWith('/guide') || pathname === '/mypage/faq',
  },
  {
    key: 'mypage',
    label: 'MY',
    path: '/mypage',
    icon: userIcon,
    requiresAuth: true,
    matches: (pathname) => pathname === '/mypage' || pathname.startsWith('/mypage/'),
  },
];

const ACTIVE_ICON_FILTER =
  'brightness(0) saturate(100%) invert(45%) sepia(16%) saturate(734%) hue-rotate(94deg) brightness(92%) contrast(87%)';
const INACTIVE_ICON_FILTER = 'brightness(0) saturate(100%)';

function readStoredNavContext(): BottomNavKey | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = window.sessionStorage.getItem(NAV_CONTEXT_STORAGE_KEY);
  return stored === 'home' || stored === 'explore' || stored === 'guide' || stored === 'mypage' ? stored : null;
}

function writeStoredNavContext(value: BottomNavKey) {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(NAV_CONTEXT_STORAGE_KEY, value);
}

export default function BottomNav({
  active,
  showFab = false,
  fabExpanded = false,
  onFabToggle,
  onCreateClick,
}: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const token = getAccessToken();
  const [internalExpanded, setInternalExpanded] = useState(false);
  const expanded = onFabToggle ? fabExpanded : internalExpanded;

  const routeMatchedActive = useMemo(() => {
    return NAV_ITEMS.find((item) => item.matches(location.pathname))?.key ?? null;
  }, [location.pathname]);

  const visualActive = useMemo<BottomNavKey>(() => {
    if (active) {
      return active;
    }

    if (routeMatchedActive) {
      return routeMatchedActive;
    }

    return readStoredNavContext() ?? 'home';
  }, [active, routeMatchedActive]);

  useEffect(() => {
    if (active) {
      writeStoredNavContext(active);
      return;
    }

    if (routeMatchedActive) {
      writeStoredNavContext(routeMatchedActive);
    }
  }, [active, routeMatchedActive]);

  function move(item: NavItem) {
    writeStoredNavContext(item.key);

    if (!token && item.requiresAuth) {
      navigate(
        `/auth?next=${encodeURIComponent(item.path)}&reason=${encodeURIComponent('마이페이지는 로그인이 필요한 서비스입니다.')}`,
      );
      return;
    }

    navigate(item.path);
  }

  function handleCreateClick() {
    setInternalExpanded(false);

    if (onCreateClick) {
      onCreateClick();
      return;
    }

    if (!token) {
      navigate(
        `/auth?next=${encodeURIComponent('/create')}&reason=${encodeURIComponent('경험 작성은 로그인이 필요한 서비스입니다.')}`,
      );
      return;
    }

    navigate('/create');
  }

  return (
    <div className="fixed bottom-0 left-1/2 z-40 h-[94px] w-full max-w-[375px] -translate-x-1/2">
      {showFab ? (
        <div className="pointer-events-none absolute bottom-[98px] left-1/2 flex w-[343px] -translate-x-1/2 justify-end">
          <div className="pointer-events-auto relative h-[36px] w-[122px]">
            {expanded ? (
              <button
                type="button"
                onClick={handleCreateClick}
                className="absolute right-0 top-[-52px] flex h-[41px] min-w-[122px] items-center gap-[8px] rounded-[10px] bg-white px-[10px] py-[12px] shadow-[0_0_4px_rgba(0,0,0,0.15)]"
                aria-label="경험 작성 열기"
              >
                <img src={editIcon} alt="" className="h-[17px] w-[17px]" />
                <span className="font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] text-black">경험 작성</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => {
                if (onFabToggle) {
                  onFabToggle();
                  return;
                }

                setInternalExpanded((current) => !current);
              }}
              className={`absolute right-0 top-0 flex h-[36px] w-[36px] items-center justify-center rounded-full ${
                expanded ? 'bg-[#A8D3BD]' : 'bg-[#5A876E]'
              }`}
              aria-label={expanded ? '경험 작성 닫기' : '경험 작성'}
            >
              {expanded ? (
                <X size={20} strokeWidth={2.2} color="#FFFFFF" />
              ) : (
                <img src={plusIcon} alt="" className="h-[18px] w-[18px]" />
              )}
            </button>
          </div>
        </div>
      ) : null}

      <nav className="flex h-[84px] w-full items-start justify-between rounded-tl-[20px] rounded-tr-[20px] bg-white px-[40px] pb-[32px] pt-[12px] shadow-[0_0_5px_rgba(0,0,0,0.15)]">
        {NAV_ITEMS.map((item) => {
          const isActive = visualActive === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => move(item)}
              className={`flex w-[40px] flex-col items-center justify-start gap-[4px] ${isActive ? 'opacity-100' : 'opacity-30'}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <img
                src={item.icon}
                alt=""
                className="h-[24px] w-[24px]"
                style={{ filter: isActive ? ACTIVE_ICON_FILTER : INACTIVE_ICON_FILTER }}
              />
              <span
                className={`whitespace-nowrap text-center font-['Pretendard'] text-[12px] leading-none ${
                  isActive ? 'font-[600] text-[#5A876E]' : 'font-[400] text-black'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
