import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { getMe, type UserSummary } from '../lib/api';
import { clearSession, getAccessToken, getStoredUser } from '../lib/session';

export default function MyPage() {
  const navigate = useNavigate();
  const token = getAccessToken();
  const [user, setUser] = useState<UserSummary | null>(() => getStoredUser());
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    void getMe(token)
      .then((payload) => {
        setUser(payload.user);
      })
      .catch((loadError) => {
        clearSession();
        setUser(null);
        setError(
          loadError instanceof Error
            ? loadError.message
            : '사용자 정보를 불러오지 못했습니다.',
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  return (
    <Layout title="마이페이지" leftType="menu" showRightIcon>
      <div className="space-y-4 p-4">
        {loading ? (
          <div className="rounded-[10px] bg-white p-5 text-sm text-gray-500">
            사용자 정보를 불러오는 중입니다.
          </div>
        ) : user ? (
          <div className="rounded-[10px] bg-white p-5 shadow-sm">
            <div className="mb-1 text-lg font-semibold text-gray-900">
              {user.nickname}
            </div>
            <div className="mb-3 text-sm text-gray-500">{user.email}</div>
            <div className="space-y-2 text-sm text-gray-700">
              <div>연령대: {user.ageGroup}</div>
              <div>가입일: {user.createdAt.slice(0, 10)}</div>
              <div>로그인 방식: {user.authProvider}</div>
              <div>이메일 인증: {user.emailVerified ? '완료' : '미완료'}</div>
            </div>
            <button
              type="button"
              onClick={() => {
                clearSession();
                setUser(null);
                navigate('/');
              }}
              className="mt-4 h-11 w-full rounded-xl border border-gray-300 text-sm font-medium text-gray-700"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <div className="rounded-[10px] bg-white p-5 text-sm text-gray-600">
            로그인한 사용자가 없습니다.
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/auth?next=${encodeURIComponent('/mypage')}&reason=${encodeURIComponent(
                    '마이페이지는 로그인 후 이용할 수 있어요.',
                  )}`,
                )
              }
              className="mt-4 h-11 w-full rounded-xl bg-black text-sm font-medium text-white"
            >
              로그인 / 회원가입
            </button>
          </div>
        )}

        {error ? (
          <div className="rounded-[10px] bg-white p-4 text-sm text-red-600">
            {error}
          </div>
        ) : null}
      </div>
    </Layout>
  );
}
