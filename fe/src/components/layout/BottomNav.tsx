import { PencilLine, X } from 'lucide-react';
import type { MouseEvent, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import guideIcon from '../../assets/figma-downloaded-icons/home/NavigationBar/live_help_20dp_1F1F1F_FILL0_wght400_GRAD0_opsz20 1.svg';
import homeIcon from '../../assets/figma-downloaded-icons/home/Home.svg';
import plusIcon from '../../assets/figma-downloaded-icons/home/Plus.svg';
import searchIcon from '../../assets/figma-downloaded-icons/home/Search.svg';
import subtractIcon from '../../assets/figma-downloaded-icons/home/Subtract.svg';
import userIcon from '../../assets/figma-downloaded-icons/home/User.svg';
import { getAccessToken } from '../../lib/session';

export type BottomNavKey = 'home' | 'explore' | 'guide' | 'mypage';
type BottomNavAccessoryLayout = 'center' | 'end' | 'between';

type BottomNavProps = {
  active?: BottomNavKey;
  showFab?: boolean;
  fabExpanded?: boolean;
  onFabToggle?: () => void;
  onCreateClick?: () => void;
  accessory?: ReactNode;
  accessoryLayout?: BottomNavAccessoryLayout;
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
    matches: (pathname) =>
      pathname === '/faq' ||
      pathname.startsWith('/guide') ||
      pathname === '/mypage/faq',
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

function buildIconFilter(isActive: boolean) {
  return isActive
    ? 'brightness(0) saturate(100%) invert(47%) sepia(16%) saturate(661%) hue-rotate(96deg) brightness(92%) contrast(85%)'
    : 'brightness(0) saturate(100%) invert(0%)';
}

function DefaultFabMenu({
  expanded,
  onToggle,
  onCreateClick,
}: {
  expanded: boolean;
  onToggle: () => void;
  onCreateClick: () => void;
}) {
  const navigate = useNavigate();
  const handleChatbotClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onToggle();
    navigate('/chatbot');
  };

  return (
    <div className="relative z-50 flex h-[36px] w-[36px] items-center justify-center">
      <div
        className={`pointer-events-auto absolute bottom-[52px] right-[-10px] z-50 flex min-w-[132px] flex-col items-stretch rounded-[10px] bg-white px-[10px] shadow-[0_0_4px_rgba(0,0,0,0.15)] transition-[max-height,opacity,padding] duration-150 ${
          expanded
            ? 'max-h-[120px] gap-[12px] overflow-visible py-[12px] opacity-100'
            : 'pointer-events-none max-h-0 gap-0 overflow-hidden py-0 opacity-0'
        }`}
      >
        <button
          type="button"
          onClick={handleChatbotClick}
          className="flex w-full items-center gap-[8px] whitespace-nowrap text-left"
        >
          <img src={subtractIcon} alt="" className="h-[17px] w-[17px] shrink-0" />
          <span className="font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] text-black">AI 챗봇</span>
        </button>
        <button
          type="button"
          onClick={onCreateClick}
          className="flex w-full items-center gap-[8px] whitespace-nowrap text-left"
        >
          <PencilLine size={18} strokeWidth={2} className="shrink-0 text-black" />
          <span className="font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] text-black">경험 작성</span>
        </button>
      </div>

      <button
        type="button"
        aria-label={expanded ? '경험 작성 메뉴 닫기' : '경험 작성 메뉴 열기'}
        aria-expanded={expanded}
        onClick={onToggle}
        className={`pointer-events-auto flex h-[36px] w-[36px] items-center justify-center rounded-full ${
          expanded ? 'bg-[#A8D3BD]' : 'bg-[#5A876E]'
        }`}
      >
        {expanded ? <X size={20} strokeWidth={2.2} color="#FFFFFF" /> : <img src={plusIcon} alt="" className="h-[18px] w-[18px]" />}
      </button>
    </div>
  );
}

export default function BottomNav({
  active,
  showFab = false,
  fabExpanded = false,
  onFabToggle,
  onCreateClick,
  accessory,
  accessoryLayout = 'end',
}: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const token = getAccessToken();
  const [internalExpanded, setInternalExpanded] = useState(false);
  const expanded = onFabToggle ? fabExpanded : internalExpanded;

  const routeMatchedActive = useMemo(() => NAV_ITEMS.find((item) => item.matches(location.pathname))?.key ?? null, [location.pathname]);

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

  const resolvedAccessory =
    accessory ??
    (showFab ? (
      <DefaultFabMenu
        expanded={expanded}
        onToggle={() => {
          if (onFabToggle) {
            onFabToggle();
            return;
          }

          setInternalExpanded((current) => !current);
        }}
        onCreateClick={handleCreateClick}
      />
    ) : null);

  const hasAccessory = Boolean(resolvedAccessory);
  const accessoryLayoutClass =
    accessoryLayout === 'between'
      ? 'justify-between'
      : accessoryLayout === 'center'
        ? 'justify-center'
        : 'justify-end';

  return (
    <div
      className="pointer-events-none fixed bottom-0 left-1/2 z-40 w-full max-w-[375px] -translate-x-1/2"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {hasAccessory ? (
        <div className={`absolute inset-x-0 bottom-[84px] flex h-[68px] items-center px-[24px] py-[16px] ${accessoryLayoutClass}`}>
          {resolvedAccessory}
        </div>
      ) : null}

      <nav className="pointer-events-auto relative flex h-[84px] w-full items-start justify-between rounded-t-[20px] bg-white px-[40px] pb-[32px] pt-[12px] shadow-[0_0_5px_rgba(0,0,0,0.15)]">
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
                aria-hidden="true"
                className="block h-[24px] w-[24px]"
                style={{ filter: buildIconFilter(isActive) }}
              />
              <span
                className={`whitespace-nowrap text-center font-['Pretendard'] text-[12px] leading-[12px] tracking-[0px] ${
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


