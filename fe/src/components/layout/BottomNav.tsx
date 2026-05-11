import { useLocation, useNavigate } from 'react-router-dom';
import createIcon from '../../assets/images/plus-circle.svg';
import exploreIcon from '../../assets/images/search.svg';
import homeIcon from '../../assets/images/home.svg';
import faqIcon from '../../assets/images/live-help.svg';
import userIcon from '../../assets/images/user.svg';
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
    name: 'FAQ',
    path: '/faq',
    icon: faqIcon,
    matches: (pathname) => pathname === '/faq' || pathname === '/mypage/faq',
  },
  {
    name: '등록',
    path: '/create',
    icon: createIcon,
    requiresAuth: true,
    matches: (pathname) => pathname.startsWith('/create') || pathname.startsWith('/analysis-result'),
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

  function moveWithAuthGuard(menu: NavMenu) {
    if (!token && menu.requiresAuth) {
      const reason =
        menu.path === '/create'
          ? '경험 등록은 로그인 후 이용할 수 있어요.'
          : '마이페이지는 로그인 후 이용할 수 있어요.';

      navigate(`/auth?next=${encodeURIComponent(menu.path)}&reason=${encodeURIComponent(reason)}`);
      return;
    }

    navigate(menu.path);
  }

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-[430px] -translate-x-1/2 items-center justify-between rounded-tl-[20px] rounded-tr-[20px] bg-[#FFFFFF] px-6 pb-[24px] pt-[12px] shadow-[0_0_5px_rgba(0,0,0,0.15)] sm:px-8">
      {menus.map((menu) => {
        const isActive = menu.matches(location.pathname);

        return (
          <button
            key={menu.path}
            type="button"
            onClick={() => moveWithAuthGuard(menu)}
            className={`flex min-h-[44px] min-w-[40px] flex-col items-center justify-center gap-[4px] ${
              isActive ? 'opacity-100' : 'opacity-30'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            <img src={menu.icon} alt="" className="h-[24px] w-[24px]" />
            <span className="whitespace-nowrap text-center font-['Pretendard'] text-[10px] font-[400] leading-[10px] tracking-[0px] text-[#000000]">
              {menu.name}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
