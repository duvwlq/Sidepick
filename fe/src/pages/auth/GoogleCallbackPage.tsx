import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthLayout from '../../components/auth/AuthLayout';
import { ErrorState, LoadingState } from '../../components/common/Skeleton';
import { useToast } from '../../components/common/useToast';
import { loginWithGoogle } from '../../lib/api';
import { setFlashToast } from '../../lib/flash-toast';
import { resolveErrorMessage } from '../../lib/resolve-error-message';
import { saveSession } from '../../lib/session';

export default function GoogleCallbackPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
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
        setFlashToast(`환영해요, ${payload.user.nickname}님!`);
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

  useEffect(() => {
    const message = immediateError || error;
    if (message) {
      showToast(message);
    }
  }, [error, immediateError, showToast]);

  return (
    <AuthLayout>
      <AuthHeader title="구글 로그인" onBack={() => navigate('/auth')} />

      <section className="flex min-h-[calc(100vh-150px)] flex-col justify-center">
        <div className="space-y-4 rounded-2xl border border-[#EAEAEA] bg-white px-4 py-6 text-center">
          {immediateError || error ? (
            <>
              <p className="text-base font-medium text-black">로그인에 실패했어요.</p>
              <ErrorState message={immediateError || error} />
            </>
          ) : (
            <>
              <p className="text-base font-medium text-black">구글 로그인 처리 중입니다.</p>
              <LoadingState message="잠시만 기다려주세요." />
            </>
          )}
        </div>
      </section>
    </AuthLayout>
  );
}
