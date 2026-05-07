import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthLayout from '../../components/auth/AuthLayout';
import { loginWithGoogle } from '../../lib/api';
import { resolveErrorMessage } from '../../lib/resolve-error-message';
import { saveSession } from '../../lib/session';

export default function GoogleCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const callbackParams = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      code: params.get('code'),
      oauthError: params.get('error'),
      state: params.get('state') || '/',
      redirectUri: `${window.location.origin}/auth/google/callback`,
    };
  }, []);

  const immediateError = callbackParams.oauthError
    ? '구글 로그인에 실패했어요.'
    : !callbackParams.code
      ? '구글 로그인 정보를 확인하지 못했어요.'
      : '';

  useEffect(() => {
    if (immediateError) {
      return;
    }

    let cancelled = false;

    async function handleCallback() {
      try {
        const payload = await loginWithGoogle({
          code: callbackParams.code!,
          redirectUri: callbackParams.redirectUri,
        });

        if (cancelled) {
          return;
        }

        saveSession(payload.accessToken, payload.refreshToken, payload.user);
        navigate(callbackParams.state, { replace: true });
      } catch (callbackError) {
        if (!cancelled) {
          setError(
            resolveErrorMessage(
              callbackError,
              '구글 로그인 처리 중 문제가 발생했어요. 다시 시도해주세요.',
            ),
          );
        }
      }
    }

    void handleCallback();

    return () => {
      cancelled = true;
    };
  }, [callbackParams, immediateError, navigate]);

  return (
    <AuthLayout>
      <AuthHeader title="구글 로그인" onBack={() => navigate('/auth')} />

      <section className="flex min-h-[calc(100vh-150px)] flex-col justify-center">
        <div className="rounded-2xl border border-[#EAEAEA] bg-white px-5 py-6 text-center">
          {immediateError || error ? (
            <>
              <p className="text-base font-medium text-black">로그인에 실패했어요.</p>
              <p className="mt-3 text-sm text-red-500">{immediateError || error}</p>
            </>
          ) : (
            <>
              <p className="text-base font-medium text-black">구글 로그인 처리 중입니다.</p>
              <p className="mt-3 text-sm text-[#777777]">잠시만 기다려주세요.</p>
            </>
          )}
        </div>
      </section>
    </AuthLayout>
  );
}
