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
const INVALID_EMAIL_MESSAGE = '\uC62C\uBC14\uB978 \uC774\uBA54\uC77C \uD615\uC2DD\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.';
const VERIFICATION_SENT_MESSAGE = '\uC778\uC99D \uBA54\uC77C\uC774 \uBC1C\uC1A1\uB418\uC5C8\uC5B4\uC694.';

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
        ? `\uAC1C\uBC1C\uC6A9 \uC778\uC99D\uCF54\uB4DC: ${payload.verificationCode}`
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
      title="\uAC1C\uC778 \uC815\uBCF4 \uB4F1\uB85D"
      headlineLines={[
        '\uC774\uBA54\uC77C \uC8FC\uC18C\uB85C,',
        '\uBCF8\uC778 \uC778\uC99D\uC744 \uC9C4\uD589\uD560\uAC8C\uC694',
      ]}
      onBack={() =>
        navigate(`/auth?next=${encodeURIComponent(nextPath)}`, {
          replace: true,
        })
      }
    >
      <SignupFieldGroup>
        <SignupField
          label="\uC774\uBA54\uC77C"
          type="email"
          placeholder="\uC774\uBA54\uC77C\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694"
          value={form.email}
          onChange={(event) => updateField('email', event.target.value)}
          autoComplete="email"
          fieldHeight={40}
        />

        {error ? <SignupErrorText>{error}</SignupErrorText> : null}

        <SignupButton onClick={() => void handleNext()} disabled={loading || !isEmailValid} tone="soft">
          {loading
            ? '\uC778\uC99D \uC694\uCCAD \uC911...'
            : '\uBCF8\uC778 \uC778\uC99D\uD558\uAE30'}
        </SignupButton>
      </SignupFieldGroup>
    </SignupScreen>
  );
}
