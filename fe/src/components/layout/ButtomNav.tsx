import { useLocation, useNavigate } from 'react-router-dom';
import homeIcon from '../../assets/images/home.svg';
import exploreIcon from '../../assets/images/search.svg';
import createIcon from '../../assets/images/plus-circle.svg';
import myIcon from '../../assets/images/user.svg';
import { getAccessToken } from '../../lib/session';

const menus = [
  { name: '홈', path: '/', icon: homeIcon },
  { name: '탐색', path: '/explore', icon: exploreIcon },
  { name: '등록', path: '/create', icon: createIcon },
  { name: 'MY', path: '/mypage', icon: myIcon },
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
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[375px] -translate-x-1/2 rounded-t-[20px] bg-white px-12 pb-6 pt-3 shadow-[0_0_10px_rgba(0,0,0,0.15)]">
      <ul className="flex items-center justify-between">
        {menus.map((menu) => {
          const isActive = location.pathname === menu.path;

          return (
            <li key={menu.path}>
              <button
                type="button"
                onClick={() => moveWithAuthGuard(menu.path)}
                className="flex flex-col items-center gap-1"
              >
                <div className="flex h-6 w-6 items-center justify-center">
                  <img
                    src={menu.icon}
                    alt=""
                    className={`h-6 w-6 ${isActive ? 'opacity-100' : 'opacity-30'}`}
                  />
                </div>
                <span
                  className={`text-[10px] leading-none ${
                    isActive ? 'text-black' : 'text-black/30'
                  }`}
                >
                  {menu.name}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
