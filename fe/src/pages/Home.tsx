import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import SearchBar from '../components/common/SearchBar';
import CardList from '../components/common/CardList';
import AuthPanel from '../components/home/AuthPanel';
import Layout from '../components/layout/Layout';
import {
  getExperiences,
  getMe,
  login,
  register,
  type Experience,
  type UserSummary,
} from '../lib/api';
import {
  clearSession,
  getAccessToken,
  getStoredUser,
  saveSession,
} from '../lib/session';

export default function Home() {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [user, setUser] = useState<UserSummary | null>(() => getStoredUser());
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');

  useEffect(() => {
    void loadExperiences();
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    if (!token || user) {
      return;
    }

    void getMe(token)
      .then((payload) => {
        setUser(payload.user);
      })
      .catch(() => {
        clearSession();
        setUser(null);
      });
  }, [user]);

  async function loadExperiences() {
    setListLoading(true);
    setListError('');

    try {
      const payload = await getExperiences();
      setExperiences(payload.experiences);
    } catch (error) {
      setListError(
        error instanceof Error
          ? error.message
          : '경험담 목록을 불러오지 못했습니다.',
      );
    } finally {
      setListLoading(false);
    }
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');

    try {
      const payload =
        authMode === 'login'
          ? await login({ email, password })
          : await register({
              email,
              password,
              nickname: String(formData.get('nickname') ?? ''),
              ageGroup: String(formData.get('ageGroup') ?? '20s'),
            });

      saveSession(payload.accessToken, payload.user);
      setUser(payload.user);
      event.currentTarget.reset();
      await loadExperiences();
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : '인증 요청에 실패했습니다.',
      );
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    clearSession();
    setUser(null);
  }

  return (
    <Layout title="Sidepick" leftType="menu" showRightIcon>
      <div className="space-y-4">
        <div className="sticky top-16 z-10 space-y-3 bg-white px-4 pb-3 pt-4">
          <AuthPanel
            mode={authMode}
            onModeChange={setAuthMode}
            onSubmit={handleAuthSubmit}
            loading={authLoading}
            error={authError}
            user={user}
            onLogout={handleLogout}
          />
          <SearchBar />
        </div>
        <CardList
          experiences={experiences}
          loading={listLoading}
          error={listError}
        />
      </div>
    </Layout>
  );
}
