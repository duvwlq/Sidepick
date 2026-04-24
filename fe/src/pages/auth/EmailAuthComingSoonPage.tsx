import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthButton from '../../components/auth/AuthButton';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthLayout from '../../components/auth/AuthLayout';

export default function EmailAuthComingSoonPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [kakaoError, setKakaoError] = useState('');

  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('next') || '/';
  }, [location.search]);

  function handleKakaoLogin() {
    const kakaoClientId = import.meta.env.VITE_KAKAO_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/kakao/callback`;

    if (!kakaoClientId) {
      setKakaoError('카카오 로그인 설정이 누락되었습니다.');
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
        title="이메일 로그인"
        onBack={() =>
          navigate(`/auth?next=${encodeURIComponent(nextPath)}`, {
            replace: true,
          })
        }
      />

      <section className="flex min-h-[calc(100vh-150px)] flex-col justify-center gap-4">
        <div className="rounded-[28px] border border-[#E8E8E8] bg-white px-6 py-7">
          <h2 className="whitespace-pre-line text-[24px] font-semibold leading-8 text-black">
            이메일 로그인은{'\n'}준비 중입니다
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#666666]">
            운영 환경 안정화를 위해 현재는 카카오 로그인만 제공하고 있습니다.
            이메일 로그인과 회원가입은 준비가 끝나는 대로 다시 열 예정입니다.
          </p>
        </div>

        <AuthButton variant="kakao" onClick={handleKakaoLogin}>
          카카오로 계속하기
        </AuthButton>
        <AuthButton
          variant="secondary"
          onClick={() =>
            navigate(`/auth?next=${encodeURIComponent(nextPath)}`, {
              replace: true,
            })
          }
        >
          이전 화면으로 돌아가기
        </AuthButton>

        {kakaoError ? <p className="text-sm text-red-500">{kakaoError}</p> : null}
      </section>
    </AuthLayout>
  );
}
