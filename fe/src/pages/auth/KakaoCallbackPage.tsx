import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthLayout from '../../components/auth/AuthLayout';
import { loginWithKakao } from '../../lib/api';
import { saveSession } from '../../lib/session';

export default function KakaoCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const oauthError = params.get('error');
    const state = params.get('state') || '/';
    const redirectUri = `${window.location.origin}/auth/kakao/callback`;

    if (oauthError) {
      setError('카카오 로그인에 실패했습니다.');
      return;
    }

    if (!code) {
      setError('카카오 인가 코드를 받지 못했습니다.');
      return;
    }

    const authorizationCode = code;
    let cancelled = false;

    async function handleCallback() {
      try {
        const payload = await loginWithKakao({
          code: authorizationCode,
          redirectUri,
        });

        if (cancelled) {
          return;
        }

        saveSession(payload.accessToken, payload.refreshToken, payload.user);
        navigate(state, { replace: true });
      } catch (callbackError) {
        if (cancelled) {
          return;
        }

        setError(
          callbackError instanceof Error
            ? callbackError.message
            : '카카오 로그인 처리에 실패했습니다.',
        );
      }
    }

    void handleCallback();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <AuthLayout>
      <AuthHeader title="카카오 로그인" onBack={() => navigate('/auth')} />

      <section className="flex min-h-[calc(100vh-150px)] flex-col justify-center">
        <div className="rounded-2xl border border-[#EAEAEA] bg-white px-5 py-6 text-center">
          {error ? (
            <>
              <p className="text-base font-medium text-black">
                로그인에 실패했어요
              </p>
              <p className="mt-3 text-sm text-red-500">{error}</p>
            </>
          ) : (
            <>
              <p className="text-base font-medium text-black">
                카카오 로그인 처리 중입니다
              </p>
              <p className="mt-3 text-sm text-[#777777]">
                잠시만 기다려 주세요.
              </p>
            </>
          )}
        </div>
      </section>
    </AuthLayout>
  );
}
