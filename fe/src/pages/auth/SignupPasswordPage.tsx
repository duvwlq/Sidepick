import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  SignupButton,
  SignupErrorText,
  SignupField,
  SignupFieldGroup,
  SignupScreen,
} from '../../components/auth/FigmaSignupPrimitives';
import { useAuthFlow } from '../../context/useAuthFlow';

const PASSWORD_POLICY = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/;

export default function SignupPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { form, updateField } = useAuthFlow();
  const [error, setError] = useState('');

  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('next') || '/';
  }, [location.search]);

  const hasValidPassword = PASSWORD_POLICY.test(form.password);
  const passwordMatches = form.password.length > 0 && form.password === form.passwordConfirm;
  const canContinue = hasValidPassword && passwordMatches;

  function handleNext() {
    if (!form.password.trim() || !form.passwordConfirm.trim()) {
      setError('비밀번호를 모두 입력해 주세요.');
      return;
    }

    if (!PASSWORD_POLICY.test(form.password)) {
      setError('영문, 숫자를 조합하여 8자 이상 입력해 주세요.');
      return;
    }

    if (form.password !== form.passwordConfirm) {
      setError('비밀번호가 일치하지 않아요.');
      return;
    }

    setError('');
    navigate(`/signup/nickname?next=${encodeURIComponent(nextPath)}&mode=local`);
  }

  return (
    <SignupScreen
      title="비밀번호 설정"
      headlineLines={['로그인 시 사용할', '비밀번호를 입력해 주세요']}
      onBack={() => navigate(`/signup/username?next=${encodeURIComponent(nextPath)}`)}
    >
      <SignupFieldGroup>
        <SignupField
          label="비밀번호"
          type="password"
          placeholder="영문, 숫자를 조합하여 8자 이상 입력해 주세요"
          value={form.password}
          onChange={(event) => updateField('password', event.target.value)}
          autoComplete="new-password"
          fieldHeight={40}
        />

        <SignupField
          label="비밀번호 재입력"
          type="password"
          placeholder="비밀번호 확인을 위해 다시 한 번 입력해 주세요"
          value={form.passwordConfirm}
          onChange={(event) => updateField('passwordConfirm', event.target.value)}
          autoComplete="new-password"
          fieldHeight={40}
        />

        {error ? <SignupErrorText>{error}</SignupErrorText> : null}

        <SignupButton onClick={handleNext} disabled={!canContinue} tone="primary">
          다음으로
        </SignupButton>
      </SignupFieldGroup>
    </SignupScreen>
  );
}
