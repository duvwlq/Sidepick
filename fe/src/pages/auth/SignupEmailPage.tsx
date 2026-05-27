import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  SignupButton,
  SignupErrorText,
  SignupField,
  SignupFieldGroup,
  SignupScreen,
} from '../../components/auth/FigmaSignupPrimitives';
import { useToast } from '../../components/common/useToast';
import { useAuthFlow } from '../../context/useAuthFlow';
import { requestEmailVerification } from '../../lib/api';
import { resolveErrorMessage } from '../../lib/resolve-error-message';

export default function SignupEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { form, updateField } = useAuthFlow();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('next') || '/';
  }, [location.search]);

  async function handleNext() {
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('이메일 형식에 맞게 다시 작성해주세요');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = await requestEmailVerification({ email: form.email });
      updateField('verificationSent', true);
      updateField(
        'verificationMessage',
        payload.verificationCode
          ? `개발용 인증 코드: ${payload.verificationCode}`
          : '이메일 인증이 완료되었어요',
      );
      navigate(`/signup/verify?next=${encodeURIComponent(nextPath)}`);
    } catch (requestError) {
      const message = resolveErrorMessage(requestError, '이메일 형식에 맞게 다시 작성해주세요');
      setError(message);
      showToast(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SignupScreen
      title="비밀번호 설정"
      headlineLines={['로그인 시 사용할', '아이디를 입력해 주세요']}
      onBack={() =>
        navigate(`/auth?next=${encodeURIComponent(nextPath)}`, {
          replace: true,
        })
      }
    >
      <SignupFieldGroup>
        <SignupField
          label="이메일"
          type="email"
          placeholder="영문, 숫자를 조합하여 8자 이상 입력해 주세요"
          value={form.email}
          onChange={(event) => updateField('email', event.target.value)}
          fieldHeight={37}
        />

        {error ? <SignupErrorText>{error}</SignupErrorText> : null}

        <SignupButton onClick={() => void handleNext()} disabled={loading}>
          {loading ? '잠시만 기다려주세요' : '다음으로'}
        </SignupButton>
      </SignupFieldGroup>
    </SignupScreen>
  );
}
