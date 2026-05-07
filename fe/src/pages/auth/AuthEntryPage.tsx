import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import AuthLayout from '../../components/auth/AuthLayout';
import { login } from '../../lib/api';
import { resolveErrorMessage } from '../../lib/resolve-error-message';
import { saveSession } from '../../lib/session';

export default function AuthEntryPage() {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [kakaoError, setKakaoError] = useState('');
  const [googleError, setGoogleError] = useState('');

  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('next') || '/';
  }, [location.search]);

  const reason = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('reason') || '';
  }, [location.search]);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setLoginError('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    setLoginError('');

    try {
      const payload = await login({
        email: email.trim(),
        password,
      });
      saveSession(payload.accessToken, payload.refreshToken, payload.user);
      window.location.href = nextPath;
    } catch (error) {
      setLoginError(resolveErrorMessage(error, '로그인에 실패했어요. 다시 시도해주세요.'));
    } finally {
      setLoading(false);
    }
  }

  function handleKakaoLogin() {
    const kakaoClientId = import.meta.env.VITE_KAKAO_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/kakao/callback`;

    if (!kakaoClientId) {
      setKakaoError('카카오 로그인 설정을 확인할 수 없어요.');
      return;
    }

    const kakaoAuthUrl =
      `https://kauth.kakao.com/oauth/authorize?response_type=code` +
      `&client_id=${encodeURIComponent(kakaoClientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(nextPath)}`;

    window.location.href = kakaoAuthUrl;
  }

  function handleGoogleLogin() {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/google/callback`;

    if (!googleClientId) {
      setGoogleError('구글 로그인 설정을 확인할 수 없어요.');
      return;
    }

    const googleAuthUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?response_type=code` +
      `&client_id=${encodeURIComponent(googleClientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent('openid email profile')}` +
      `&state=${encodeURIComponent(nextPath)}`;

    window.location.href = googleAuthUrl;
  }

  return (
    <AuthLayout>
      <AuthHeader title="로그인" />

      <section className="px-1 pb-8">
        {reason ? (
          <div className="mb-6 rounded-[18px] bg-[#F7F7F8] px-4 py-3 text-sm leading-6 text-[#555555]">
            {reason}
          </div>
        ) : null}

        <div className="space-y-5">
          <AuthInput
            label="이메일"
            type="email"
            placeholder="이메일을 입력해주세요"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <AuthInput
            label="비밀번호"
            type="password"
            placeholder="비밀번호를 입력해주세요"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {loginError ? <p className="mt-4 text-sm text-[#D33B3B]">{loginError}</p> : null}

        <button
          type="button"
          onClick={() => void handleLogin()}
          disabled={loading}
          className="mt-6 h-14 w-full rounded-[16px] bg-[#111111] text-base font-semibold text-white disabled:bg-[#D8D8D8]"
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>

        <div className="mt-4 flex items-center justify-center gap-3 text-sm text-[#7D7D7D]">
          <Link
            to={`/signup/email?next=${encodeURIComponent(nextPath)}`}
            className="underline-offset-2 hover:underline"
          >
            회원가입
          </Link>
          <span className="text-[#D4D4D4]">|</span>
          <button type="button" disabled className="cursor-not-allowed text-[#B7B7B7]">
            ID/PW 찾기
          </button>
        </div>

        <div className="mt-10">
          <p className="text-center text-sm font-medium text-[#6A6A6A]">소셜 로그인</p>

          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={handleKakaoLogin}
              className="flex h-14 w-full items-center justify-center rounded-[16px] bg-[#191919] text-base font-semibold text-[#FEE500]"
            >
              카카오 로그인
            </button>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex h-14 w-full items-center justify-center rounded-[16px] border border-[#E4E4E4] bg-white text-base font-medium text-[#202124]"
            >
              구글 로그인
            </button>
          </div>

          <p className="mt-4 text-center text-xs leading-5 text-[#8C8C8C]">
            이메일 로그인과 소셜 로그인을 모두 사용할 수 있습니다.
          </p>
          {kakaoError ? <p className="mt-3 text-center text-sm text-[#D33B3B]">{kakaoError}</p> : null}
          {googleError ? <p className="mt-3 text-center text-sm text-[#D33B3B]">{googleError}</p> : null}
        </div>
      </section>
    </AuthLayout>
  );
}
