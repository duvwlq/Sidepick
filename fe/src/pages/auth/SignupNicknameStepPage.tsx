import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import avatarPlaceholderIcon from '../../assets/mypage-overview-figma/avatar-placeholder.svg';
import cameraIcon from '../../assets/mypage-overview-figma/camera.svg';
import { SignupButton, SignupErrorText, SignupFieldGroup, SignupScreen } from '../../components/auth/FigmaSignupPrimitives';
import { useToast } from '../../components/common/useToast';
import { useAuthFlow } from '../../context/useAuthFlow';
import { getStoredUser } from '../../lib/session';
import { parseNextPath, parseSignupMode } from './signup-flow';

function NicknameInput({
  value,
  checked,
  onChange,
  onCheck,
}: {
  value: string;
  checked: boolean;
  onChange: (nextValue: string) => void;
  onCheck: () => void;
}) {
  const hasValue = value.trim().length > 0;

  return (
    <div className="flex w-full flex-col gap-[4px]">
      <span className="font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] text-black">닉네임</span>
      <div className="flex w-full gap-[4px]">
        <label className="relative block min-w-0 flex-1">
          <div className="flex h-[40px] w-full items-center rounded-[10px] bg-[#F8F8F8] px-[16px] py-[10px]">
            <span
              className={`pointer-events-none truncate font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] ${
                hasValue ? 'text-[#494949]' : 'text-[#BABABA]'
              }`}
            >
              {hasValue ? value : '3자 이상 입력해주세요'}
            </span>
          </div>
          <input
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            autoComplete="nickname"
            className="absolute inset-0 h-full w-full border-0 bg-transparent px-[16px] py-[10px] font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] text-transparent caret-black outline-none placeholder:text-transparent"
          />
        </label>

        <button
          type="button"
          onClick={onCheck}
          className={`flex h-[40px] w-[75px] shrink-0 items-center justify-center rounded-[10px] font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] ${
            checked ? 'bg-[#5A876E] text-white' : 'bg-[#92BFA6] text-white'
          }`}
        >
          {checked ? '확인완료' : '중복확인'}
        </button>
      </div>
    </div>
  );
}

export default function SignupNicknameStepPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { form, updateField } = useAuthFlow();
  const [error, setError] = useState('');
  const signupMode = parseSignupMode(location.search);
  const nextPath = parseNextPath(location.search);
  const storedUser = useMemo(() => getStoredUser(), []);
  const seededSocialNicknameRef = useRef(false);

  useEffect(() => {
    updateField('signupMode', signupMode);
    if (
      signupMode === 'social' &&
      !seededSocialNicknameRef.current &&
      !form.nickname.trim() &&
      storedUser?.nickname
    ) {
      updateField('nickname', storedUser.nickname);
      updateField('nicknameChecked', true);
      seededSocialNicknameRef.current = true;
    }
  }, [form.nickname, signupMode, storedUser, updateField]);

  const profileImage = storedUser?.profileImage?.trim() || '';
  const canContinue = form.nickname.trim().length >= 3 && form.nicknameChecked;

  function handleNicknameCheck() {
    if (form.nickname.trim().length < 3) {
      setError('닉네임을 3자 이상 입력해 주세요.');
      return;
    }

    updateField('nicknameChecked', true);
    setError('');
    showToast('사용 가능한 닉네임으로 확인했어요.');
  }

  function handleNext() {
    if (form.nickname.trim().length < 3) {
      setError('닉네임을 3자 이상 입력해 주세요.');
      return;
    }

    if (!form.nicknameChecked) {
      setError('닉네임 중복 확인을 먼저 진행해 주세요.');
      return;
    }

    setError('');
    navigate(`/signup/region?next=${encodeURIComponent(nextPath)}&mode=${signupMode}`);
  }

  return (
    <SignupScreen
      title="프로필 설정"
      headlineLines={['사이드픽에서 사용할', '프로필을 등록해볼까요?']}
      onBack={() =>
        navigate(
          signupMode === 'social'
            ? `/auth?next=${encodeURIComponent(nextPath)}`
            : `/signup/password?next=${encodeURIComponent(nextPath)}&mode=local`,
        )
      }
    >
      <SignupFieldGroup>
        <div className="flex w-full justify-center pb-[12px]">
          <div className="relative flex h-[120px] w-[120px] items-center justify-center">
            <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-[#D9D9D9]">
              {profileImage ? (
                <img src={profileImage} alt="" className="h-[96px] w-[96px] rounded-full bg-[#F8F8F8] object-contain" />
              ) : (
                <img src={avatarPlaceholderIcon} alt="" className="h-[96px] w-[96px]" />
              )}
            </div>
            <span className="absolute bottom-[11px] right-[10px] flex h-[28.8px] w-[28.8px] items-center justify-center rounded-full bg-[#8A8A8A]">
              <img src={cameraIcon} alt="" className="h-[17px] w-[17px]" />
            </span>
          </div>
        </div>

        <NicknameInput
          value={form.nickname}
          checked={form.nicknameChecked}
          onChange={(nextValue) => {
            updateField('nickname', nextValue);
            updateField('nicknameChecked', false);
          }}
          onCheck={handleNicknameCheck}
        />

        {error ? <SignupErrorText>{error}</SignupErrorText> : null}

        <SignupButton onClick={handleNext} disabled={!canContinue} tone="primary">
          다음으로
        </SignupButton>
      </SignupFieldGroup>
    </SignupScreen>
  );
}
