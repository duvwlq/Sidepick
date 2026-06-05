import { X } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import editIcon from '../../assets/explore-figma/edit.svg';
import guideIcon from '../../assets/home-v1-figma/icons/guide-figma.svg';
import homeIcon from '../../assets/home-v1-figma/icons/home-figma.svg';
import plusIcon from '../../assets/home-v1-figma/icons/plus-figma.svg';
import searchIcon from '../../assets/home-v1-figma/icons/search-nav-figma.svg';
import userIcon from '../../assets/home-v1-figma/icons/user-figma.svg';
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
  iconClassName: string;
  requiresAuth?: boolean;
  matches: (pathname: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    key: 'home',
    label: '홈',
    path: '/',
    icon: homeIcon,
    iconClassName: 'h-[22px] w-[20px]',
    matches: (pathname) => pathname === '/' || pathname === '/v1/home',
  },
  {
    key: 'explore',
    label: '탐색',
    path: '/explore',
    icon: searchIcon,
    iconClassName: 'h-[20px] w-[20px]',
    matches: (pathname) => pathname.startsWith('/explore') || pathname === '/search' || pathname === '/v1/explore',
  },
  {
    key: 'guide',
    label: '가이드',
    path: '/faq',
    icon: guideIcon,
    iconClassName: 'h-[22px] w-[18px]',
    matches: (pathname) => pathname === '/faq' || pathname === '/mypage/faq',
  },
  {
    key: 'mypage',
    label: 'MY',
    path: '/mypage',
    icon: userIcon,
    iconClassName: 'h-[20px] w-[18px]',
    requiresAuth: true,
    matches: (pathname) => pathname.startsWith('/mypage') && pathname !== '/mypage/faq',
  },
];

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

  function resolveActive(item: NavItem) {
    if (active) {
      return item.key === active;
    }
    return item.matches(location.pathname);
  }

  function move(path: string, requiresAuth?: boolean) {
    if (!token && requiresAuth) {
      navigate(`/auth?next=${encodeURIComponent(path)}&reason=${encodeURIComponent('마이페이지는 로그인이 필요한 서비스입니다.')}`);
      return;
    }
    navigate(path);
  }

  function handleCreateClick() {
    setInternalExpanded(false);
    if (onCreateClick) {
      onCreateClick();
      return;
    }

    if (!token) {
      navigate(`/auth?next=${encodeURIComponent('/create')}&reason=${encodeURIComponent('경험 작성은 로그인이 필요한 서비스입니다.')}`);
      return;
    }

    navigate('/create');
  }

  return (
    <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-[412px] -translate-x-1/2">
      {showFab ? (
        <div className="pointer-events-none absolute bottom-[52px] left-0 flex w-full justify-end px-[24px] py-[16px]">
          <div className="pointer-events-auto relative h-[36px] w-[122px]">
            {expanded ? (
              <button
                type="button"
                onClick={handleCreateClick}
                className="absolute right-0 top-[-49px] flex h-[41px] min-w-[122px] items-center gap-[8px] rounded-[10px] bg-white px-[10px] py-[12px] shadow-[0_0_4px_rgba(0,0,0,0.15)]"
                aria-label="경험 작성 열기"
              >
                <img src={editIcon} alt="" className="h-[17px] w-[17px]" />
                <span className="font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] tracking-[0px] text-black">
                  경험 작성
                </span>
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
                expanded ? 'bg-[#A8D3BD]' : 'bg-[#5A876E] shadow-[0_8px_16px_rgba(90,135,110,0.24)]'
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

      <nav className="flex h-[84px] items-start justify-between rounded-tl-[20px] rounded-tr-[20px] bg-white px-[40px] pb-[32px] pt-[12px] shadow-[0_0_5px_rgba(0,0,0,0.15)]">
        {NAV_ITEMS.map((item) => {
          const isActive = resolveActive(item);

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => move(item.path, item.requiresAuth)}
              className="flex min-h-[40px] min-w-[40px] flex-col items-center justify-start gap-[4px]"
              aria-current={isActive ? 'page' : undefined}
            >
              <img
                src={item.icon}
                alt=""
                className={`${item.iconClassName} ${isActive ? 'opacity-100' : 'opacity-30'}`}
              />
              <span
                className={`whitespace-nowrap font-['Pretendard'] text-center text-[12px] leading-[12px] tracking-[0px] ${
                  isActive ? 'font-[600] text-[#5A876E]' : 'font-[400] text-[rgba(0,0,0,0.3)]'
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
