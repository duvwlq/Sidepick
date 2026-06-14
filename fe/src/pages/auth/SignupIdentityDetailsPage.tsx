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

function parseIdentityCode(identityCode: string) {
  const digits = identityCode.replace(/\D/g, '').slice(0, 7);
  if (digits.length !== 7) {
    return null;
  }

  const yy = Number(digits.slice(0, 2));
  const mm = Number(digits.slice(2, 4));
  const dd = Number(digits.slice(4, 6));
  const discriminator = digits[6];

  const discriminatorMap: Record<string, { century: number; gender: 'MALE' | 'FEMALE' }> = {
    '1': { century: 1900, gender: 'MALE' },
    '2': { century: 1900, gender: 'FEMALE' },
    '3': { century: 2000, gender: 'MALE' },
    '4': { century: 2000, gender: 'FEMALE' },
    '5': { century: 1900, gender: 'MALE' },
    '6': { century: 1900, gender: 'FEMALE' },
    '7': { century: 2000, gender: 'MALE' },
    '8': { century: 2000, gender: 'FEMALE' },
    '9': { century: 1800, gender: 'MALE' },
    '0': { century: 1800, gender: 'FEMALE' },
  };

  const metadata = discriminatorMap[discriminator];
  if (!metadata) {
    return null;
  }

  const fullYear = metadata.century + yy;
  const birthDate = `${fullYear.toString().padStart(4, '0')}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
  const date = new Date(`${birthDate}T00:00:00`);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== fullYear ||
    date.getMonth() + 1 !== mm ||
    date.getDate() !== dd
  ) {
    return null;
  }

  return {
    birthDate,
    gender: metadata.gender,
  };
}

const EMAIL_REQUIRED_MESSAGE = '\uC774\uBA54\uC77C \uC815\uBCF4\uB97C \uBA3C\uC800 \uD655\uC778\uD574 \uC8FC\uC138\uC694.';
const IDENTITY_REQUIRED_MESSAGE =
  '\uC0DD\uB144\uC6D4\uC77C \uD3EC\uD568 \uC55E 7\uC790\uB9AC\uB97C \uC785\uB825\uD574 \uC8FC\uC138\uC694.';
const NAME_REQUIRED_MESSAGE = '\uC774\uB984\uC740 2\uC790 \uC774\uC0C1 \uC785\uB825\uD574 \uC8FC\uC138\uC694.';

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
      setError(EMAIL_REQUIRED_MESSAGE);
      return;
    }

    if (identityDigits.length !== 7) {
      setError(IDENTITY_REQUIRED_MESSAGE);
      return;
    }

    if (normalizedName.length < 2) {
      setError(NAME_REQUIRED_MESSAGE);
      return;
    }

    const parsedIdentity = parseIdentityCode(form.identityCode);
    if (!parsedIdentity) {
      setError(IDENTITY_REQUIRED_MESSAGE);
      return;
    }

    updateField('fullName', normalizedName);
    updateField('birthDate', parsedIdentity.birthDate);
    updateField('gender', parsedIdentity.gender);
    setError('');
    navigate(`/signup/verify?next=${encodeURIComponent(nextPath)}`);
  }

  return (
    <SignupScreen
      title="\uAC1C\uC778 \uC815\uBCF4 \uB4F1\uB85D"
      headlineLines={[
        '\uC0DD\uB144\uC6D4\uC77C \uD3EC\uD568',
        '\uC55E 7\uC790\uB9AC\uB97C \uC785\uB825\uD574 \uC8FC\uC138\uC694',
      ]}
      onBack={() => navigate(`/signup/identity?next=${encodeURIComponent(nextPath)}`)}
    >
      <SignupFieldGroup>
        <SignupField
          label="\uC774\uBA54\uC77C"
          type="email"
          placeholder="\uC774\uBA54\uC77C\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694."
          value={form.email}
          onChange={(event) => updateField('email', event.target.value)}
          autoComplete="email"
          fieldHeight={40}
        />

        <SignupField
          label="\uC0DD\uB144\uC6D4\uC77C \uBC0F \uC131\uBCC4"
          type="text"
          placeholder="000000 - 0 * * * * * *"
          value={formatIdentityPreview(form.identityCode)}
          onChange={(event) => updateField('identityCode', event.target.value.replace(/\D/g, '').slice(0, 7))}
          autoComplete="off"
          fieldHeight={40}
        />

        <SignupField
          label="\uC774\uB984"
          type="text"
          placeholder="\uC774\uB984\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694"
          value={form.fullName}
          onChange={(event) => updateField('fullName', event.target.value)}
          autoComplete="name"
          fieldHeight={40}
        />

        {error ? <SignupErrorText>{error}</SignupErrorText> : null}

        <SignupButton onClick={handleNext} disabled={!canContinue} tone="primary">
          \uBCF8\uC778 \uC778\uC99D\uD558\uAE30
        </SignupButton>
      </SignupFieldGroup>
    </SignupScreen>
  );
}
