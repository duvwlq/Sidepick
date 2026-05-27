import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  SignupButton,
  SignupErrorText,
  SignupField,
  SignupFieldGroup,
  SignupScreen,
} from '../../components/auth/FigmaSignupPrimitives';
import { useAuthFlow } from '../../context/useAuthFlow';
import { getStoredUser } from '../../lib/session';
import { parseNextPath, parseSignupMode } from './signup-flow';

export default function SignupNicknameStepPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { form, updateField } = useAuthFlow();
  const [error, setError] = useState('');
  const signupMode = parseSignupMode(location.search);
  const nextPath = parseNextPath(location.search);
  const storedUser = useMemo(() => getStoredUser(), []);

  useEffect(() => {
    updateField('signupMode', signupMode);
    if (signupMode === 'social' && !form.nickname.trim() && storedUser?.nickname) {
      updateField('nickname', storedUser.nickname);
    }
  }, [form.nickname, signupMode, storedUser, updateField]);

  function handleNext() {
    if (form.nickname.trim().length < 2) {
      setError('닉네임을 2자 이상 입력해주세요.');
      return;
    }

    setError('');
    navigate(`/signup/region?next=${encodeURIComponent(nextPath)}&mode=${signupMode}`);
  }

  return (
    <SignupScreen
      title="닉네임 설정"
      headlineLines={['사이드픽에서 사용할 이름을', '정해볼까요?']}
      onBack={() =>
        navigate(
          signupMode === 'social'
            ? `/auth?next=${encodeURIComponent(nextPath)}`
            : `/signup/password?next=${encodeURIComponent(nextPath)}&mode=local`,
        )
      }
    >
      <SignupFieldGroup>
        <SignupField
          label="닉네임"
          placeholder="3자 이상 입력해주세요"
          value={form.nickname}
          onChange={(event) => updateField('nickname', event.target.value)}
          fieldHeight={40}
        />

        {error ? <SignupErrorText>{error}</SignupErrorText> : null}

        <SignupButton onClick={handleNext} tone="primary">
          다음으로
        </SignupButton>
      </SignupFieldGroup>
    </SignupScreen>
  );
}
