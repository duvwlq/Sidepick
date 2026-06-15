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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVALID_EMAIL_MESSAGE = '올바른 이메일 형식을 입력해 주세요.';
const VERIFICATION_SENT_MESSAGE = '인증 메일이 발송되었어요.';
const SCREEN_TITLE = '개인 정보 등록';
const HEADLINE_LINES = ['이메일 주소로,', '본인 인증을 진행할게요'];
const EMAIL_LABEL = '이메일';
const EMAIL_PLACEHOLDER = '이메일을 입력해 주세요';
const VERIFY_BUTTON_LABEL = '본인 인증하기';
const VERIFY_BUTTON_LOADING_LABEL = '인증 요청 중...';

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

  const normalizedEmail = form.email.trim();
  const isEmailValid = EMAIL_PATTERN.test(normalizedEmail);

  async function handleNext() {
    if (!isEmailValid) {
      setError(INVALID_EMAIL_MESSAGE);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = await requestEmailVerification({ email: normalizedEmail });
      const verificationMessage = payload.verificationCode
        ? `개발용 인증코드: ${payload.verificationCode}`
        : VERIFICATION_SENT_MESSAGE;

      updateField('email', normalizedEmail);
      updateField('verificationSent', true);
      updateField('verificationMessage', verificationMessage);
      showToast(verificationMessage);
      navigate(`/signup/identity?next=${encodeURIComponent(nextPath)}`);
    } catch (requestError) {
      const message = resolveErrorMessage(requestError, INVALID_EMAIL_MESSAGE);
      setError(message);
      showToast(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SignupScreen
      title={SCREEN_TITLE}
      headlineLines={HEADLINE_LINES}
      onBack={() =>
        navigate(`/auth?next=${encodeURIComponent(nextPath)}`, {
          replace: true,
        })
      }
    >
      <SignupFieldGroup>
        <SignupField
          label={EMAIL_LABEL}
          type="email"
          placeholder={EMAIL_PLACEHOLDER}
          value={form.email}
          onChange={(event) => updateField('email', event.target.value)}
          autoComplete="email"
          fieldHeight={40}
        />

        {error ? <SignupErrorText>{error}</SignupErrorText> : null}

        <SignupButton onClick={() => void handleNext()} disabled={loading || !isEmailValid} tone="soft">
          {loading ? VERIFY_BUTTON_LOADING_LABEL : VERIFY_BUTTON_LABEL}
        </SignupButton>
      </SignupFieldGroup>
    </SignupScreen>
  );
}
