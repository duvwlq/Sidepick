import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthLayout from '../../components/auth/AuthLayout';
import { ErrorState, LoadingState } from '../../components/common/Skeleton';
import { useToast } from '../../components/common/useToast';
import { loginWithNaver } from '../../lib/api';
import { setFlashToast } from '../../lib/flash-toast';
import { resolveErrorMessage } from '../../lib/resolve-error-message';
import { saveSession } from '../../lib/session';
import { clearOAuthCallbackState, readOAuthCallbackParams } from './oauth-callback';

export default function NaverCallbackPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [error, setError] = useState('');

  const callbackParams = useMemo(
    () => readOAuthCallbackParams('NAVER', '/auth/naver/callback'),
    [],
  );

  useEffect(() => {
    if (callbackParams.immediateError) {
      clearOAuthCallbackState('NAVER');
      return;
    }

    let cancelled = false;

    async function handleCallback() {
      try {
        const payload = await loginWithNaver({
          code: callbackParams.code!,
          state: callbackParams.state,
          redirectUri: callbackParams.redirectUri,
        });

        if (cancelled) {
          return;
        }

        clearOAuthCallbackState('NAVER');
        saveSession(payload.accessToken, payload.refreshToken, payload.user);
        if (!payload.user.profileCompleted) {
          navigate(`/signup/nickname?next=${encodeURIComponent(callbackParams.nextPath)}&mode=social`, {
            replace: true,
          });
          return;
        }

        setFlashToast(`환영해요, ${payload.user.nickname}님!`);
        navigate(callbackParams.nextPath, { replace: true });
      } catch (callbackError) {
        if (!cancelled) {
          clearOAuthCallbackState('NAVER');
          setError(
            resolveErrorMessage(
              callbackError,
              '네이버 로그인 처리 중 문제가 발생했어요. 다시 시도해주세요.',
            ),
          );
        }
      }
    }

    void handleCallback();

    return () => {
      cancelled = true;
    };
  }, [callbackParams, navigate]);

  useEffect(() => {
    const message = callbackParams.immediateError || error;
    if (message) {
      showToast(message);
    }
  }, [callbackParams.immediateError, error, showToast]);

  return (
    <AuthLayout>
      <AuthHeader title="네이버 로그인" onBack={() => navigate('/auth')} />

      <section className="flex min-h-[calc(100vh-150px)] flex-col justify-center">
        <div className="space-y-4 rounded-2xl border border-[#EAEAEA] bg-white px-4 py-6 text-center">
          {callbackParams.immediateError || error ? (
            <>
              <p className="text-base font-medium text-black">로그인에 실패했어요</p>
              <ErrorState message={callbackParams.immediateError || error} />
            </>
          ) : (
            <>
              <p className="text-base font-medium text-black">네이버 로그인을 처리 중입니다.</p>
              <LoadingState message="잠시만 기다려주세요." />
            </>
          )}
        </div>
      </section>
    </AuthLayout>
  );
}
