import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthButton from '../../components/auth/AuthButton';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import AuthLayout from '../../components/auth/AuthLayout';
import { login } from '../../lib/api';
import { saveSession } from '../../lib/session';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('next') || '/';
  }, [location.search]);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError('이메일과 비밀번호를 입력해 주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = await login({ email, password });
      saveSession(payload.accessToken, payload.refreshToken, payload.user);
      navigate(nextPath, { replace: true });
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : '로그인에 실패했습니다.',
      );
    } finally {
      setLoading(false);
    }
  }

  function handleKakaoLogin() {
    const kakaoClientId = import.meta.env.VITE_KAKAO_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/kakao/callback`;

    if (!kakaoClientId) {
      setError('카카오 로그인 설정이 없습니다.');
      return;
    }

    const kakaoAuthUrl =
      `https://kauth.kakao.com/oauth/authorize?response_type=code` +
      `&client_id=${encodeURIComponent(kakaoClientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(nextPath)}`;

    window.location.href = kakaoAuthUrl;
  }

  return (
    <AuthLayout>
      <AuthHeader
        title="로그인"
        onBack={() =>
          navigate(`/auth?next=${encodeURIComponent(nextPath)}`, {
            replace: true,
          })
        }
      />

      <section className="flex flex-col gap-4">
        <AuthInput
          label="이메일"
          type="email"
          placeholder="이메일을 입력해 주세요"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <AuthInput
          label="비밀번호"
          type="password"
          placeholder="비밀번호를 입력해 주세요"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {error ? <p className="text-sm text-red-500">{error}</p> : null}

        <div className="mt-2 flex flex-col gap-2">
          <AuthButton onClick={() => void handleLogin()}>
            {loading ? '로그인 중...' : '로그인'}
          </AuthButton>
          <AuthButton variant="kakao" onClick={handleKakaoLogin}>
            카카오 로그인
          </AuthButton>
          <AuthButton
            variant="secondary"
            onClick={() =>
              navigate(`/signup/email?next=${encodeURIComponent(nextPath)}`)
            }
          >
            회원가입
          </AuthButton>
        </div>
      </section>
    </AuthLayout>
  );
}
