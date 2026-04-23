import { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import { getMe, type UserSummary } from '../lib/api';
import { clearSession, getAccessToken, getStoredUser } from '../lib/session';

export default function MyPage() {
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
            : '내 정보를 불러오지 못했습니다.',
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
            </div>
          </div>
        ) : (
          <div className="rounded-[10px] bg-white p-5 text-sm text-gray-600">
            로그인된 사용자가 없습니다.
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
