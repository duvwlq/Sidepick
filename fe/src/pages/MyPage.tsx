import { ChevronRight, CircleHelp, LogOut, UserRound } from 'lucide-react';
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
      return;
    }

    void getMe(token)
      .then((payload) => {
        setUser(payload.user);
      })
      .catch((loadError) => {
        clearSession();
        setUser(null);
        setError(loadError instanceof Error ? loadError.message : '사용자 정보를 불러오지 못했습니다.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  return (
    <Layout title="마이페이지" leftType="menu" showRightIcon={false}>
      <div className="space-y-4 bg-[#FAFAFA] p-4">
        {loading ? (
          <section className="rounded-[20px] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#757575]">사용자 정보를 불러오는 중입니다.</p>
          </section>
        ) : user ? (
          <section className="rounded-[24px] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#111111] text-white">
                <UserRound className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[20px] font-semibold leading-6 text-[#111111]">
                  {user.nickname}
                </p>
                <p className="mt-1 truncate text-sm text-[#757575]">{user.email}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <InfoCard label="연령대" value={user.ageGroup} />
              <InfoCard label="가입일" value={new Date(user.createdAt).toLocaleDateString('ko-KR')} />
              <InfoCard label="로그인 방식" value={user.authProvider} />
              <InfoCard label="이메일 인증" value={user.emailVerified ? '완료' : '미완료'} />
            </div>

            <button
              type="button"
              onClick={() => {
                clearSession();
                setUser(null);
                navigate('/');
              }}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-[14px] border border-[#E5E5E5] text-sm font-medium text-[#444444]"
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </button>
          </section>
        ) : (
          <section className="rounded-[24px] bg-white p-5 shadow-sm">
            <p className="text-base font-semibold text-[#111111]">로그인한 사용자가 없습니다.</p>
            <p className="mt-2 text-sm leading-5 text-[#757575]">
              마이페이지를 이용하려면 로그인 또는 회원가입이 필요합니다.
            </p>
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/auth?next=${encodeURIComponent('/mypage')}&reason=${encodeURIComponent(
                    '마이페이지는 로그인 후 이용할 수 있어요.',
                  )}`,
                )
              }
              className="mt-4 h-12 w-full rounded-[14px] bg-[#111111] text-sm font-semibold text-white"
            >
              로그인 / 회원가입
            </button>
          </section>
        )}

        <section className="rounded-[24px] bg-white p-5 shadow-sm">
          <div className="mb-4">
            <p className="text-base font-semibold text-[#111111]">FAQ</p>
            <p className="mt-1 text-sm text-[#757575]">
              부업 시작 전 가이드와 카테고리별 문답을 확인할 수 있습니다.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/mypage/faq')}
            className="flex w-full items-center justify-between rounded-[18px] bg-[#F8F8F8] px-4 py-4 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#111111]">
                <CircleHelp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#111111]">FAQ</p>
                <p className="mt-1 text-xs text-[#757575]">부업 시작 전 가이드와 카테고리별 문답</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-[#757575]" />
          </button>
        </section>

        {error ? <div className="rounded-[16px] bg-[#FFF4F2] px-4 py-3 text-sm text-[#D33B3B]">{error}</div> : null}
      </div>
    </Layout>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-[#F8F8F8] px-4 py-3">
      <p className="text-xs text-[#8A8A8A]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[#111111]">{value}</p>
    </div>
  );
}
