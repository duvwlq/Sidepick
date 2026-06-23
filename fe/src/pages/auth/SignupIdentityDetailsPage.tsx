import { useMemo, useState, type ChangeEvent, type HTMLInputTypeAttribute } from 'react';
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

const EMAIL_REQUIRED_MESSAGE = '이메일 정보를 먼저 확인해 주세요.';
const IDENTITY_REQUIRED_MESSAGE = '생년월일 포함 앞 7자리를 입력해 주세요.';
const NAME_REQUIRED_MESSAGE = '이름은 2자 이상 입력해 주세요.';
const SCREEN_TITLE = '개인 정보 등록';
const HEADLINE_LINES = ['생년월일 포함', '앞 7자리를 입력해 주세요'];
const EMAIL_LABEL = '이메일';
const EMAIL_PLACEHOLDER = '이메일을 입력해주세요.';
const IDENTITY_LABEL = '생년월일 및 성별';
const NAME_LABEL = '이름';
const NAME_PLACEHOLDER = '이름을 입력해주세요';
const VERIFY_BUTTON_LABEL = '본인 인증하기';

function InlineSignupField({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  autoComplete,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  type?: HTMLInputTypeAttribute;
  autoComplete?: string;
}) {
  const hasValue = value.length > 0;

  return (
    <div className="flex w-full flex-col gap-[4px]">
      <span className="font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] text-black">{label}</span>

      <label className="relative block w-full">
        <div
          className="flex h-[40px] w-full items-center justify-between rounded-[10px] bg-[#F8F8F8] px-[16px] py-[10px]"
        >
          <span
            className={`pointer-events-none min-w-0 flex-1 truncate font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] ${
              hasValue ? 'text-[#494949]' : 'text-[#BABABA]'
            }`}
          >
            {hasValue ? value : placeholder}
          </span>
        </div>

        <input
          type={type}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className="absolute inset-0 h-full w-full border-0 bg-transparent px-[16px] py-[10px] font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] text-transparent caret-black outline-none placeholder:text-transparent"
        />
      </label>
    </div>
  );
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
      title={SCREEN_TITLE}
      headlineLines={HEADLINE_LINES}
      onBack={() => navigate(`/signup/identity?next=${encodeURIComponent(nextPath)}`)}
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

        <SignupField
          label={IDENTITY_LABEL}
          type="text"
          placeholder="000000 - 0 * * * * * *"
          value={formatIdentityPreview(form.identityCode)}
          onChange={(event) => updateField('identityCode', event.target.value.replace(/\D/g, '').slice(0, 7))}
          autoComplete="off"
          fieldHeight={40}
        />

        <InlineSignupField
          label={NAME_LABEL}
          type="text"
          placeholder={NAME_PLACEHOLDER}
          value={form.fullName}
          onChange={(event) => updateField('fullName', event.target.value)}
          autoComplete="name"
        />

        {error ? <SignupErrorText>{error}</SignupErrorText> : null}

        <SignupButton onClick={handleNext} disabled={!canContinue} tone="primary">
          {VERIFY_BUTTON_LABEL}
        </SignupButton>
      </SignupFieldGroup>
    </SignupScreen>
  );
}
