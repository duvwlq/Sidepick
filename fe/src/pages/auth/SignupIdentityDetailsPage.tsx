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

function formatIdentityPreview(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 7);
  const front = digits.slice(0, 6);
  const back = digits.slice(6, 7);

  if (!front && !back) {
    return '';
  }

  return `${front.padEnd(6, '0')} - ${back || '0'} * * * * * *`;
}

export default function SignupIdentityDetailsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { form, updateField } = useAuthFlow();
  const [error, setError] = useState('');

  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('next') || '/';
  }, [location.search]);

  const normalizedEmail = form.email.trim();
  const identityDigits = form.identityCode.replace(/\D/g, '');
  const normalizedName = form.fullName.trim();
  const canContinue = normalizedEmail.length > 0 && identityDigits.length === 7 && normalizedName.length >= 2;

  function handleNext() {
    if (!normalizedEmail) {
      setError('이메일 정보를 먼저 확인해 주세요.');
      return;
    }

    if (identityDigits.length !== 7) {
      setError('생년월일 포함 앞 7자리를 입력해 주세요.');
      return;
    }

    if (normalizedName.length < 2) {
      setError('이름은 2자 이상 입력해 주세요.');
      return;
    }

    setError('');
    navigate(`/signup/verify?next=${encodeURIComponent(nextPath)}`);
  }

  return (
    <SignupScreen
      title="개인 정보 등록"
      headlineLines={['생년월일 포함', '앞 7자리를 입력해 주세요']}
      onBack={() => navigate(`/signup/identity?next=${encodeURIComponent(nextPath)}`)}
    >
      <SignupFieldGroup>
        <SignupField
          label="이메일"
          type="email"
          placeholder="이메일을 입력해주세요."
          value={form.email}
          onChange={(event) => updateField('email', event.target.value)}
          autoComplete="email"
          fieldHeight={40}
        />

        <SignupField
          label="생년월일 및 성별"
          type="text"
          placeholder="000000 - 0 * * * * * *"
          value={formatIdentityPreview(form.identityCode)}
          onChange={(event) => updateField('identityCode', event.target.value.replace(/\D/g, '').slice(0, 7))}
          autoComplete="off"
          fieldHeight={40}
        />

        <SignupField
          label="이름"
          type="text"
          placeholder="이름을 입력해주세요"
          value={form.fullName}
          onChange={(event) => updateField('fullName', event.target.value)}
          autoComplete="name"
          fieldHeight={40}
        />

        {error ? <SignupErrorText>{error}</SignupErrorText> : null}

        <SignupButton onClick={handleNext} disabled={!canContinue} tone="primary">
          본인 인증하기
        </SignupButton>
      </SignupFieldGroup>
    </SignupScreen>
  );
}
