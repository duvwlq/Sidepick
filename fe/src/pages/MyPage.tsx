import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types/auth';
import { getCurrentUser, logoutUser } from '../utils/authStorage';

export default function MyPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const user = getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('MyPage user load error:', error);
      setCurrentUser(null);
    }
  }, []);

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    navigate('/mypage');
  };

  return (
    <div className="px-4 py-6 text-black">
      <h1 className="mb-6 text-xl font-semibold">마이페이지</h1>

      {currentUser ? (
        <section className="flex flex-col gap-3">
          <p className="text-base font-medium">
            {currentUser.nickname}님, 반가워요.
          </p>
          <p className="text-sm text-[#666]">아이디: {currentUser.id}</p>

          <button
            type="button"
            onClick={handleLogout}
            className="w-fit bg-transparent p-0 text-sm text-black"
          >
            로그아웃
          </button>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => navigate('/auth')}
          className="w-fit bg-transparent p-0 text-sm text-black"
        >
          로그인 / 회원가입
        </button>
      )}
    </div>
  );
}
