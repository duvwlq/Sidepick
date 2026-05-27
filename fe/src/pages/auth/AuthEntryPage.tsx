import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SignupErrorText, SignupField } from '../../components/auth/FigmaSignupPrimitives';
import { useToast } from '../../components/common/useToast';
import arrowLeftIcon from '../../assets/auth-figma/arrow-left.svg';
import batteryFrameIcon from '../../assets/auth-figma/battery-frame.svg';
import brandMarkIcon from '../../assets/auth-figma/brand-mark.svg';
import cellularConnectionIcon from '../../assets/auth-figma/cellular-connection.svg';
import googleIcon from '../../assets/auth-figma/google-icon.svg';
import kakaoIcon from '../../assets/auth-figma/kakao-icon.svg';
import naverIcon from '../../assets/auth-figma/naver-icon.svg';
import wifiIcon from '../../assets/auth-figma/wifi.svg';
import { login } from '../../lib/api';
import { setFlashToast } from '../../lib/flash-toast';
import { resolveErrorMessage } from '../../lib/resolve-error-message';
import { saveSession } from '../../lib/session';

export default function AuthEntryPage() {
  const location = useLocation();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [kakaoError, setKakaoError] = useState('');
  const [googleError, setGoogleError] = useState('');
  const [naverError, setNaverError] = useState('');

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
      setLoginError('이메일 혹은 비밀번호를 다시 확인해주세요');
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
      setFlashToast(`환영해요, ${payload.user.nickname}님!`);
      window.location.href = nextPath;
    } catch (error) {
      const message = resolveErrorMessage(error, '이메일 혹은 비밀번호를 다시 확인해주세요');
      setLoginError(message);
      showToast(message);
    } finally {
      setLoading(false);
    }
  }

  function handleKakaoLogin() {
    const kakaoClientId = import.meta.env.VITE_KAKAO_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/kakao/callback`;

    if (!kakaoClientId) {
      setKakaoError('잠시 연결이 불안정해요. 다시 시도해주세요.');
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
      setGoogleError('잠시 연결이 불안정해요. 다시 시도해주세요.');
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

  function handleNaverLogin() {
    const naverClientId = import.meta.env.VITE_NAVER_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/naver/callback`;

    if (!naverClientId) {
      setNaverError('잠시 연결이 불안정해요. 다시 시도해주세요.');
      return;
    }

    const naverAuthUrl =
      `https://nid.naver.com/oauth2.0/authorize?response_type=code` +
      `&client_id=${encodeURIComponent(naverClientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(nextPath)}`;

    window.location.href = naverAuthUrl;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[375px] flex-col bg-white">
        <div className="flex w-full flex-col">
          <div className="flex h-[59px] w-full items-center justify-center px-[24px] pb-[19px] pt-[21px]">
            <div className="flex h-[22px] min-w-0 flex-1 items-center justify-center pt-[1.5px]">
              <span className="font-['Pretendard'] text-[17px] font-[600] leading-[22px] tracking-[0px] text-black">
                9:41
              </span>
            </div>
            <div className="flex h-[22px] min-w-0 flex-1 items-center justify-center gap-[7px] pr-[1px] pt-[1px]">
              <img src={cellularConnectionIcon} alt="" className="h-[12.226px] w-[19.2px] shrink-0" />
              <img src={wifiIcon} alt="" className="h-[12.328px] w-[17.142px] shrink-0" />
              <img src={batteryFrameIcon} alt="" className="h-[13px] w-[27.328px] shrink-0" />
            </div>
          </div>

          <div className="flex w-full items-center px-[16px] py-[20px]">
            <button
              type="button"
              aria-label="뒤로가기"
              onClick={() => window.history.back()}
              className="flex h-[24px] w-[24px] items-center justify-center"
            >
              <img src={arrowLeftIcon} alt="" className="h-[24px] w-[24px]" />
            </button>
          </div>
        </div>

        <section className="flex w-full flex-col gap-[32px] pb-[20px] pt-[20px]">
          <div className="flex w-full flex-col items-center gap-[8px]">
            <div className="flex h-[21px] items-center gap-[5.133px]">
              <img src={brandMarkIcon} alt="" className="h-[21px] w-[21px]" />
              <span className="font-['Pretendard'] text-[28px] font-[700] leading-[21px] tracking-[0px] text-black">
                sidePick
              </span>
            </div>
            <p className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#5D5D5D]">
              서비스 이용을 위해 로그인해주세요.
            </p>
          </div>

          {reason ? (
            <div className="px-[16px]">
              <div className="rounded-[10px] bg-[#F5F5F5] px-[16px] py-[10px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#5D5D5D]">
                {reason}
              </div>
            </div>
          ) : null}

          <div className="flex w-full flex-col gap-[24px] px-[16px]">
            <div className="flex w-full flex-col gap-[16px]">
              <SignupField
                label="아이디"
                type="email"
                placeholder="이메일 형식으로 입력해주세요"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                fieldHeight={43}
              />
              <SignupField
                label="비밀번호"
                type="password"
                placeholder="비밀번호를 입력해주세요"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                fieldHeight={43}
              />
              {loginError ? <SignupErrorText>{loginError}</SignupErrorText> : null}
            </div>

            <button
              type="button"
              onClick={() => void handleLogin()}
              disabled={loading}
              className="flex h-[48px] w-full items-center justify-center rounded-[8px] bg-[#CBE5D8] py-[5px] font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-white disabled:opacity-70"
            >
              {loading ? '잠시만 기다려주세요' : '로그인'}
            </button>

            <div className="flex w-full items-center justify-center gap-[8px] font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-black">
              <Link to={`/signup/email?next=${encodeURIComponent(nextPath)}&mode=local`}>회원가입</Link>
              <span>|</span>
              <button type="button" disabled>
                ID/PW 찾기
              </button>
            </div>
          </div>

          <div className="flex w-full flex-col gap-[16px] px-[16px]">
            <div className="flex w-full items-center justify-center">
              <span className="whitespace-nowrap font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#8A8A8A]">
                간편 로그인
              </span>
            </div>

            <div className="flex w-full items-center justify-center gap-[24px]">
              <button
                type="button"
                onClick={handleKakaoLogin}
                className="flex h-[48px] w-[48px] items-center justify-center rounded-[999px] bg-[#FFCD00]"
              >
                <img src={kakaoIcon} alt="" className="h-[17px] w-[18px]" />
              </button>

              <button
                type="button"
                onClick={handleNaverLogin}
                className="flex h-[48px] w-[48px] items-center justify-center rounded-[999px] bg-[#06BE34]"
              >
                <img src={naverIcon} alt="" className="h-[16px] w-[17px]" />
              </button>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex h-[48px] w-[48px] items-center justify-center rounded-[999px] border border-[#D8D8D8] bg-white"
              >
                <img src={googleIcon} alt="" className="h-[17px] w-[17px]" />
              </button>
            </div>

            {kakaoError ? <SignupErrorText>{kakaoError}</SignupErrorText> : null}
            {naverError ? <SignupErrorText>{naverError}</SignupErrorText> : null}
            {googleError ? <SignupErrorText>{googleError}</SignupErrorText> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
