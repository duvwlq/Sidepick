import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthButton from '../../components/auth/AuthButton';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthLayout from '../../components/auth/AuthLayout';
import TermsAgreementSheet from '../../components/auth/TermsAgreementSheet';

export default function AuthEntryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [termsOpen, setTermsOpen] = useState(false);
  const [kakaoError, setKakaoError] = useState('');

  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('next') || '/';
  }, [location.search]);

  const reason = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('reason') || '';
  }, [location.search]);

  function buildPath(path: string) {
    return `${path}?next=${encodeURIComponent(nextPath)}`;
  }

  function handleKakaoLogin() {
    const kakaoClientId = import.meta.env.VITE_KAKAO_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/kakao/callback`;

    if (!kakaoClientId) {
      setKakaoError('카카오 로그인 설정이 없습니다.');
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
    <>
      <AuthLayout>
        <AuthHeader title="로그인 / 회원가입" />

        <section className="flex min-h-[calc(100vh-150px)] flex-col justify-center gap-4">
          <div className="mb-8">
            <h2 className="whitespace-pre-line text-[28px] font-semibold leading-9 text-black">
              서비스를 이용하려면{'\n'}로그인이 필요해요
            </h2>
            <p className="mt-3 text-sm text-[#777777]">
              이메일 로그인 또는 카카오 로그인으로 이어서 진행해 주세요.
            </p>
            {reason ? (
              <div className="mt-4 rounded-2xl bg-[#F6F7F9] px-4 py-3 text-sm text-[#555555]">
                {reason}
              </div>
            ) : null}
          </div>

          <AuthButton onClick={() => navigate(buildPath('/login'))}>
            이메일 로그인
          </AuthButton>
          <AuthButton variant="kakao" onClick={handleKakaoLogin}>
            카카오 로그인
          </AuthButton>
          <AuthButton variant="secondary" onClick={() => setTermsOpen(true)}>
            회원가입
          </AuthButton>

          {kakaoError ? <p className="text-sm text-red-500">{kakaoError}</p> : null}
        </section>
      </AuthLayout>

      <TermsAgreementSheet
        open={termsOpen}
        onClose={() => setTermsOpen(false)}
        onAgree={() => {
          setTermsOpen(false);
          navigate(buildPath('/signup/email'));
        }}
      />
    </>
  );
}
