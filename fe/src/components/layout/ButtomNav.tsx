import { useLocation, useNavigate } from 'react-router-dom';
import createIcon from '../../assets/images/plus-circle.svg';
import homeIcon from '../../assets/images/home.svg';
import exploreIcon from '../../assets/images/search.svg';
import userIcon from '../../assets/images/user.svg';
import { getAccessToken } from '../../lib/session';

const menus = [
  { name: '홈', path: '/', icon: homeIcon },
  { name: '탐색', path: '/explore', icon: exploreIcon },
  { name: '등록', path: '/create', icon: createIcon },
  { name: 'MY', path: '/mypage', icon: userIcon },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = getAccessToken();

  function moveWithAuthGuard(path: string) {
    if (!token && (path === '/create' || path === '/mypage')) {
      const reason =
        path === '/create'
          ? '경험 등록은 로그인 후 이용할 수 있어요.'
          : '마이페이지는 로그인 후 이용할 수 있어요.';

      navigate(
        `/auth?next=${encodeURIComponent(path)}&reason=${encodeURIComponent(reason)}`,
      );
      return;
    }

    navigate(path);
  }

  return (
    <nav className="fixed bottom-[-2px] left-1/2 z-50 flex w-[375px] max-w-[375px] -translate-x-1/2 items-center justify-between rounded-tl-[20px] rounded-tr-[20px] bg-[#FFFFFF] px-[48px] pb-[24px] pt-[12px] shadow-[0_0_5px_rgba(0,0,0,0.15)]">
      {menus.map((menu) => {
        const isActive =
          menu.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(menu.path);

        return (
          <button
            key={menu.path}
            type="button"
            onClick={() => moveWithAuthGuard(menu.path)}
            className={`flex flex-col items-center gap-[4px] ${
              isActive ? 'opacity-100' : 'opacity-30'
            }`}
          >
            <img src={menu.icon} alt="" className="h-[24px] w-[24px]" />
            <span className="whitespace-nowrap text-center text-[10px] font-[400] leading-[10px] tracking-[0px] text-[#000000]">
              {menu.name}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
