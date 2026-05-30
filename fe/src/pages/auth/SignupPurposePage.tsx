import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SignupButton, SignupErrorText, SignupFieldGroup, SignupScreen } from '../../components/auth/FigmaSignupPrimitives';
import { useToast } from '../../components/common/useToast';
import { useAuthFlow } from '../../context/useAuthFlow';
import { register, updateMe } from '../../lib/api';
import { setFlashToast } from '../../lib/flash-toast';
import { resolveErrorMessage } from '../../lib/resolve-error-message';
import { getAccessToken, getRefreshToken, getStoredUser, saveSession, saveStoredUser } from '../../lib/session';
import { deriveAgeGroup, parseNextPath, parseSignupMode, PURPOSE_OPTIONS } from './signup-flow';

function PurposeButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[40px] w-full items-center rounded-[10px] border px-[16px] py-[10px] text-left font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] ${
        active ? 'border-[#5A876E] bg-[#EAF3EE] text-[#2F4D3D]' : 'border-[#E6E6E6] bg-white text-[#494949]'
      }`}
    >
      {label}
    </button>
  );
}

export default function SignupPurposePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { form, updateField, reset } = useAuthFlow();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const nextPath = parseNextPath(location.search);
  const signupMode = parseSignupMode(location.search);

  function togglePurpose(value: string) {
    const exists = form.signupPurposes.includes(value);
    if (exists) {
      updateField(
        'signupPurposes',
        form.signupPurposes.filter((purpose) => purpose !== value),
      );
      return;
    }

    if (form.signupPurposes.length >= 3) {
      setError('사용 목적은 최대 3개까지 선택할 수 있어요.');
      return;
    }

    setError('');
    updateField('signupPurposes', [...form.signupPurposes, value]);
  }

  async function handleComplete() {
    if (!form.signupPurposes.length) {
      setError('사용 목적을 하나 이상 선택해 주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (signupMode === 'social') {
        const accessToken = getAccessToken();
        const refreshToken = getRefreshToken();
        const storedUser = getStoredUser();

        if (!accessToken || !refreshToken || !storedUser) {
          navigate(`/auth?next=${encodeURIComponent(nextPath)}`, { replace: true });
          return;
        }

        const payload = await updateMe(accessToken, {
          nickname: form.nickname.trim(),
          fullName: form.fullName.trim(),
          birthDate: form.birthDate,
          gender: form.gender,
          region: form.region,
          signupPurposes: form.signupPurposes,
          experienceStatus: form.experienceStatus,
          ageGroup: deriveAgeGroup(form.birthDate),
          profileImage: storedUser.profileImage,
        });
        saveSession(accessToken, refreshToken, payload.user);
        saveStoredUser(payload.user);
      } else {
        const payload = await register({
          email: form.email,
          password: form.password,
          fullName: form.fullName.trim(),
          birthDate: form.birthDate,
          gender: form.gender,
          region: form.region,
          signupPurposes: form.signupPurposes,
          nickname: form.nickname.trim(),
          experienceStatus: form.experienceStatus,
          ageGroup: deriveAgeGroup(form.birthDate),
        });
        saveSession(payload.accessToken, payload.refreshToken, payload.user);
      }

      setFlashToast(`환영해요, ${form.nickname.trim()}님`);
      reset();
      navigate(nextPath, { replace: true });
    } catch (submitError) {
      const message = resolveErrorMessage(submitError, '회원가입을 완료하지 못했어요. 다시 시도해 주세요.');
      setError(message);
      showToast(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SignupScreen
      title="서비스 목적"
      headline="사이드픽을 방문하게 된 목적이 어떻게 되시나요?"
      onBack={() => navigate(`/signup/employment?next=${encodeURIComponent(nextPath)}&mode=${signupMode}`)}
    >
      <SignupFieldGroup>
        <p className="font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] text-[#5D5D5D]">
          최대 세 개 선택
        </p>

        {PURPOSE_OPTIONS.map((purpose) => (
          <PurposeButton
            key={purpose}
            active={form.signupPurposes.includes(purpose)}
            label={purpose}
            onClick={() => togglePurpose(purpose)}
          />
        ))}

        {error ? <SignupErrorText>{error}</SignupErrorText> : null}

        <SignupButton onClick={() => void handleComplete()} disabled={loading} tone="primary">
          {loading ? '가입을 완료하는 중이에요' : '가입 완료'}
        </SignupButton>
      </SignupFieldGroup>
    </SignupScreen>
  );
}
