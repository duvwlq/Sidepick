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
      setError('이메일 형식에 맞게 다시 입력해 주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = await requestEmailVerification({ email: form.email.trim() });
      updateField('email', form.email.trim());
      updateField('verificationSent', true);
      updateField(
        'verificationMessage',
        payload.verificationCode
          ? `개발용 인증코드: ${payload.verificationCode}`
          : '인증 메일을 발송했어요.',
      );
      navigate(`/signup/verify?next=${encodeURIComponent(nextPath)}`);
    } catch (requestError) {
      const message = resolveErrorMessage(requestError, '이메일 형식에 맞게 다시 입력해 주세요.');
      setError(message);
      showToast(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SignupScreen
      title="개인 정보 등록"
      headline="이메일로 본인 확인을 진행할게요"
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
          placeholder="이메일을 입력해 주세요"
          value={form.email}
          onChange={(event) => updateField('email', event.target.value)}
          fieldHeight={40}
        />

        {error ? <SignupErrorText>{error}</SignupErrorText> : null}

        <SignupButton onClick={() => void handleNext()} disabled={loading} tone="soft">
          {loading ? '인증 메일 발송 중...' : '다음으로'}
        </SignupButton>
      </SignupFieldGroup>
    </SignupScreen>
  );
}
