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
import { issueOAuthState, login } from '../../lib/api';
import { setFlashToast } from '../../lib/flash-toast';
import { saveOAuthState } from '../../lib/oauth-state';
import { resolveErrorMessage } from '../../lib/resolve-error-message';
import { saveSession } from '../../lib/session';

type OAuthProvider = 'KAKAO' | 'GOOGLE' | 'NAVER';

export default function AuthEntryPage() {
  const location = useLocation();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const [loginError, setLoginError] = useState('');
  const [oauthError, setOauthError] = useState('');

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
      setLoginError('이메일과 비밀번호를 다시 확인해 주세요.');
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
      setFlashToast(`환영해요, ${payload.user.nickname}님`);
      window.location.href = nextPath;
    } catch (error) {
      const message = resolveErrorMessage(error, '이메일과 비밀번호를 다시 확인해 주세요.');
      setLoginError(message);
      showToast(message);
    } finally {
      setLoading(false);
    }
  }

  async function startOAuthLogin(provider: OAuthProvider) {
    const clientId = import.meta.env[`VITE_${provider}_CLIENT_ID`];
    const providerPath = provider.toLowerCase();
    const redirectUri = `${window.location.origin}/auth/${providerPath}/callback`;

    if (!clientId) {
      const message = '소셜 로그인 설정을 찾을 수 없어요. 잠시 후 다시 시도해 주세요.';
      setOauthError(message);
      showToast(message);
      return;
    }

    setOauthLoading(provider);
    setOauthError('');

    try {
      const payload = await issueOAuthState({
        provider,
        redirectUri,
      });

      saveOAuthState({
        state: payload.state,
        nextPath,
        redirectUri,
        provider,
        expiresAt: payload.expiresAt,
      });

      const authUrl = buildOAuthAuthorizeUrl(provider, clientId, redirectUri, payload.state);
      window.location.href = authUrl;
    } catch (error) {
      const message = resolveErrorMessage(error, '소셜 로그인을 준비하는 중 문제가 발생했어요. 다시 시도해 주세요.');
      setOauthError(message);
      setOauthLoading(null);
      showToast(message);
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[375px] flex-col bg-white">
        <div className="flex w-full flex-col">
          <div className="flex h-[59px] w-full items-center justify-center px-[24px] pb-[19px] pt-[21px]">
            <div className="flex h-[22px] min-w-0 flex-1 items-center justify-center pt-[1.5px]">
              <span className="font-['SF_Pro'] text-[17px] font-[590] leading-[22px] text-black">9:41</span>
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

        <section className="flex w-full flex-col gap-[56px] py-[48px]">
          <div className="flex w-full flex-col gap-[8px]">
            <div className="flex w-full items-center justify-center gap-[2px]">
              <img src={brandMarkIcon} alt="" className="h-[30px] w-[30px]" />
              <span className="font-['Bruno_Ace_SC'] text-[25.667px] font-[400] leading-[20.533px] text-[#5A876E]">
                sidePick
              </span>
            </div>
            <div className="flex w-full items-center justify-center px-[16px]">
              <p className="font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] text-[#494949]">
                서비스 이용을 위해 로그인해 주세요
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-[24px]">
            {reason ? (
              <div className="px-[16px]">
                <div className="rounded-[10px] bg-[#F8F8F8] px-[16px] py-[10px] font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#5D5D5D]">
                  {reason}
                </div>
              </div>
            ) : null}

            <div className="flex w-full flex-col gap-[16px] px-[16px]">
              <SignupField
                label="아이디"
                type="email"
                placeholder="이메일을 입력해 주세요"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                fieldHeight={43}
              />

              <SignupField
                label="비밀번호"
                type="password"
                placeholder="비밀번호를 입력해 주세요"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                fieldHeight={43}
              />

              {loginError ? <SignupErrorText>{loginError}</SignupErrorText> : null}

              <button
                type="button"
                onClick={() => void handleLogin()}
                disabled={loading}
                className="flex h-[48px] w-full items-center justify-center rounded-[10px] bg-[#CBE5D8] font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] text-white disabled:opacity-60"
              >
                {loading ? '로그인 중...' : '로그인'}
              </button>

              <div className="flex w-full items-center justify-center gap-[8px] font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] text-[#494949]">
                <Link to={`/signup/email?next=${encodeURIComponent(nextPath)}&mode=local`}>회원가입</Link>
                <span>|</span>
                <button
                  type="button"
                  onClick={() => showToast('ID/PW 찾기 기능은 준비 중입니다.')}
                >
                  ID/PW 찾기
                </button>
              </div>
            </div>

            <div className="flex w-full flex-col gap-[16px] px-[16px]">
              <div className="flex w-full items-center justify-center">
                <span className="font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] text-[#8A8A8A]">
                  간편 로그인
                </span>
              </div>

              <div className="flex w-full items-center justify-center gap-[24px]">
                <button
                  type="button"
                  onClick={() => void startOAuthLogin('KAKAO')}
                  disabled={oauthLoading !== null}
                  className="flex h-[48px] w-[48px] items-center justify-center rounded-[999px] bg-[#FFCD00] disabled:opacity-60"
                  aria-label="카카오 로그인"
                >
                  <img src={kakaoIcon} alt="" className="h-[17px] w-[18px]" />
                </button>

                <button
                  type="button"
                  onClick={() => void startOAuthLogin('NAVER')}
                  disabled={oauthLoading !== null}
                  className="flex h-[48px] w-[48px] items-center justify-center rounded-[999px] bg-[#06BE34] disabled:opacity-60"
                  aria-label="네이버 로그인"
                >
                  <img src={naverIcon} alt="" className="h-[16px] w-[17px]" />
                </button>

                <button
                  type="button"
                  onClick={() => void startOAuthLogin('GOOGLE')}
                  disabled={oauthLoading !== null}
                  className="flex h-[48px] w-[48px] items-center justify-center rounded-[999px] border border-[#D8D8D8] bg-white disabled:opacity-60"
                  aria-label="구글 로그인"
                >
                  <img src={googleIcon} alt="" className="h-[17px] w-[17px]" />
                </button>
              </div>

              {oauthError ? <SignupErrorText>{oauthError}</SignupErrorText> : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function buildOAuthAuthorizeUrl(
  provider: OAuthProvider,
  clientId: string,
  redirectUri: string,
  state: string,
) {
  if (provider === 'KAKAO') {
    return (
      `https://kauth.kakao.com/oauth/authorize?response_type=code` +
      `&client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(state)}`
    );
  }

  if (provider === 'GOOGLE') {
    return (
      `https://accounts.google.com/o/oauth2/v2/auth?response_type=code` +
      `&client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent('openid email profile')}` +
      `&state=${encodeURIComponent(state)}`
    );
  }

  return (
    `https://nid.naver.com/oauth2.0/authorize?response_type=code` +
    `&client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${encodeURIComponent(state)}`
  );
}
