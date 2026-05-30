import { useLocation, useNavigate } from 'react-router-dom';
import exploreIcon from '../../assets/images/search.svg';
import homeIcon from '../../assets/images/home.svg';
import faqIcon from '../../assets/images/live-help.svg';
import userIcon from '../../assets/images/user.svg';
import createIcon from '../../assets/images/plus-circle.svg';
import { getAccessToken } from '../../lib/session';

type NavMenu = {
  name: string;
  path: string;
  icon: string;
  requiresAuth?: boolean;
  matches: (pathname: string) => boolean;
};

const menus: NavMenu[] = [
  {
    name: '홈',
    path: '/',
    icon: homeIcon,
    matches: (pathname) => pathname === '/',
  },
  {
    name: '탐색',
    path: '/explore',
    icon: exploreIcon,
    matches: (pathname) => pathname.startsWith('/explore'),
  },
  {
    name: '가이드',
    path: '/faq',
    icon: faqIcon,
    matches: (pathname) => pathname === '/faq' || pathname === '/mypage/faq',
  },
  {
    name: 'MY',
    path: '/mypage',
    icon: userIcon,
    requiresAuth: true,
    matches: (pathname) => pathname.startsWith('/mypage') && pathname !== '/mypage/faq',
  },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = getAccessToken();

  function moveWithAuthGuard(path: string, requiresAuth?: boolean) {
    if (!token && requiresAuth) {
      navigate(
        `/auth?next=${encodeURIComponent(path)}&reason=${encodeURIComponent(
          '마이페이지는 로그인이 필요한 서비스입니다.',
        )}`,
      );
      return;
    }

    navigate(path);
  }

  function moveToCreate() {
    if (!token) {
      navigate(
        `/auth?next=${encodeURIComponent('/create')}&reason=${encodeURIComponent(
          '경험 작성은 로그인이 필요한 서비스입니다.',
        )}`,
      );
      return;
    }

    navigate('/create');
  }

  return (
    <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2">
      <button
        type="button"
        onClick={moveToCreate}
        className={`absolute right-[24px] top-[-53px] flex h-[36px] w-[36px] items-center justify-center rounded-[999px] bg-[#5A876E] shadow-[0_10px_22px_rgba(90,135,110,0.3)] ${
          location.pathname.startsWith('/create') || location.pathname.startsWith('/analysis-result') ? 'ring-2 ring-white' : ''
        }`}
        aria-label="경험 작성"
      >
        <img src={createIcon} alt="" className="h-[20px] w-[20px]" />
      </button>

      <nav
        className="flex items-center justify-between rounded-tl-[20px] rounded-tr-[20px] bg-white px-[40px] pb-[32px] pt-[12px] shadow-[0_0_5px_rgba(0,0,0,0.15)]"
        translate="no"
      >
        {menus.map((menu) => {
          const isActive = menu.matches(location.pathname);

          return (
            <button
              key={menu.path}
              type="button"
              onClick={() => moveWithAuthGuard(menu.path, menu.requiresAuth)}
              className="flex min-h-[40px] min-w-[40px] flex-col items-center justify-center gap-[4px]"
              aria-current={isActive ? 'page' : undefined}
            >
              <img
                src={menu.icon}
                alt=""
                className={`h-[24px] w-[24px] ${isActive ? 'opacity-100' : 'opacity-30'}`}
              />
              <span
                translate="no"
                className={`whitespace-nowrap text-center text-[12px] leading-[12px] ${
                  isActive ? 'font-[600] text-[#131416]' : 'font-[400] text-[#BABABA]'
                }`}
              >
                {menu.name}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
