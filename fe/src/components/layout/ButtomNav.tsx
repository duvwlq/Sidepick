import { Link, useLocation } from 'react-router-dom';
import homeIcon from '../../assets/images/Home.svg';
import exploreIcon from '../../assets/images/Search.svg';
import createIcon from '../../assets/images/plus-circle.svg';
import myIcon from '../../assets/images/User.svg';

const menus = [
  { name: '홈', path: '/', icon: homeIcon },
  { name: '탐색', path: '/explore', icon: exploreIcon },
  { name: '등록', path: '/create', icon: createIcon },
  { name: 'MY', path: '/mypage', icon: myIcon },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white rounded-tl-[20px] rounded-tr-[20px] shadow-[0px_0px_10px_0px_rgba(0,0,0,0.15)]">
      <ul className="flex justify-around px-8 py-4">
        {menus.map((menu) => {
          const isActive = location.pathname === menu.path;

          return (
            <li
              key={menu.path}
              className="w-10 h-14 justify-center items-center"
            >
              <Link to={menu.path} className="flex flex-col items-center">
                <div className="h-10 flex flex-col items-center justify-center">
                  <img
                    src={menu.icon}
                    alt={menu.name}
                    className={`w-6 h-6 ${
                      isActive ? 'opacity-100' : 'opacity-40'
                    }`}
                  />
                </div>

                <span
                  className={`text-xs ${
                    isActive ? 'text-black' : 'text-gray-400'
                  }`}
                >
                  {menu.name}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
