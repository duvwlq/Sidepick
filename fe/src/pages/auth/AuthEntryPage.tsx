import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthLayout from '../../components/auth/AuthLayout';

function DisabledInput({
  label,
  type = 'text',
}: {
  label: string;
  type?: 'text' | 'password';
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#7D7D7D]">{label}</span>
      <input
        type={type}
        disabled
        className="h-14 w-full rounded-[16px] border border-[#E8E8E8] bg-[#F5F5F5] px-4 text-sm text-[#B4B4B4]"
      />
    </label>
  );
}

export default function AuthEntryPage() {
  const location = useLocation();
  const [kakaoError, setKakaoError] = useState('');

  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('next') || '/';
  }, [location.search]);

  const reason = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('reason') || '';
  }, [location.search]);

  function handleKakaoLogin() {
    const kakaoClientId = import.meta.env.VITE_KAKAO_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/kakao/callback`;

    if (!kakaoClientId) {
      setKakaoError('카카오 로그인 설정을 확인할 수 없습니다.');
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
      <AuthHeader title="로그인" />

      <section className="px-1 pb-8">
        {reason ? (
          <div className="mb-6 rounded-[18px] bg-[#F7F7F8] px-4 py-3 text-sm leading-6 text-[#555555]">
            {reason}
          </div>
        ) : null}

        <div className="space-y-5">
          <DisabledInput label="아이디" />
          <DisabledInput label="비밀번호" type="password" />
        </div>

        <button
          type="button"
          disabled
          className="mt-6 h-14 w-full rounded-[16px] bg-[#D8D8D8] text-base font-semibold text-white"
        >
          로그인
        </button>

        <div className="mt-4 flex items-center justify-center gap-3 text-sm text-[#7D7D7D]">
          <Link
            to={`/signup/email?next=${encodeURIComponent(nextPath)}`}
            className="underline-offset-2 hover:underline"
          >
            회원가입
          </Link>
          <span className="text-[#D4D4D4]">|</span>
          <button
            type="button"
            disabled
            className="cursor-not-allowed text-[#B7B7B7]"
          >
            ID/PW 찾기
          </button>
        </div>

        <div className="mt-10">
          <p className="text-center text-sm font-medium text-[#6A6A6A]">간편 로그인</p>

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
              disabled
              className="flex h-14 w-full items-center justify-center rounded-[16px] border border-[#E4E4E4] bg-white text-base font-medium text-[#C0C0C0]"
            >
              구글 로그인
            </button>
          </div>

          <p className="mt-4 text-center text-xs leading-5 text-[#8C8C8C]">
            현재 운영 환경에서는 카카오 로그인만 지원하고 있습니다.
          </p>
          {kakaoError ? (
            <p className="mt-3 text-center text-sm text-[#D33B3B]">{kakaoError}</p>
          ) : null}
        </div>
      </section>
    </AuthLayout>
  );
}
