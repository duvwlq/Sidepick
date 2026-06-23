import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SignupButton, SignupErrorText, SignupFieldGroup, SignupScreen } from '../../components/auth/FigmaSignupPrimitives';
import { useToast } from '../../components/common/useToast';
import { useAuthFlow } from '../../context/useAuthFlow';

function UsernameInput({
  value,
  onChange,
  checked,
  onCheck,
}: {
  value: string;
  onChange: (nextValue: string) => void;
  checked: boolean;
  onCheck: () => void;
}) {
  const hasValue = value.trim().length > 0;

  return (
    <div className="flex w-full flex-col gap-[4px]">
      <span className="font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] text-black">아이디</span>
      <div className="flex w-full gap-[4px]">
        <label className="relative block min-w-0 flex-1">
          <div className="flex h-[40px] w-full items-center rounded-[10px] bg-[#F8F8F8] px-[16px] py-[10px]">
            <span
              className={`pointer-events-none truncate font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] ${
                hasValue ? 'text-[#494949]' : 'text-[#BABABA]'
              }`}
            >
              {hasValue ? value : '아이디를 입력해주세요'}
            </span>
          </div>
          <input
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            autoComplete="username"
            className="absolute inset-0 h-full w-full border-0 bg-transparent px-[16px] py-[10px] font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] text-transparent caret-black outline-none placeholder:text-transparent"
          />
        </label>

        <button
          type="button"
          onClick={onCheck}
          className={`flex h-[40px] w-[75px] shrink-0 items-center justify-center rounded-[10px] font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] text-white ${
            checked ? 'bg-[#5A876E]' : 'bg-[#92BFA6]'
          }`}
        >
          중복확인
        </button>
      </div>
    </div>
  );
}

export default function SignupUsernamePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { form, updateField } = useAuthFlow();
  const [error, setError] = useState('');

  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('next') || '/';
  }, [location.search]);

  const normalizedUsername = form.username.trim();
  const canContinue = normalizedUsername.length >= 4 && form.usernameChecked;

  function handleUsernameCheck() {
    if (normalizedUsername.length < 4) {
      setError('아이디를 4자 이상 입력해 주세요.');
      return;
    }

    setError('');
    updateField('usernameChecked', true);
    showToast('사용 가능한 아이디예요.');
  }

  function handleNext() {
    if (normalizedUsername.length < 4) {
      setError('아이디를 4자 이상 입력해 주세요.');
      return;
    }

    if (!form.usernameChecked) {
      setError('아이디 중복확인을 먼저 진행해 주세요.');
      return;
    }

    setError('');
    navigate(`/signup/password?next=${encodeURIComponent(nextPath)}`);
  }

  return (
    <SignupScreen
      title="아이디 설정"
      headlineLines={['로그인 시 사용할', '아이디를 입력해 주세요']}
      onBack={() => navigate(`/signup/verify?next=${encodeURIComponent(nextPath)}`)}
    >
      <SignupFieldGroup>
        <UsernameInput
          value={form.username}
          onChange={(nextValue) => {
            updateField('username', nextValue);
            updateField('usernameChecked', false);
          }}
          checked={form.usernameChecked}
          onCheck={handleUsernameCheck}
        />

        {error ? <SignupErrorText>{error}</SignupErrorText> : null}

        <SignupButton onClick={handleNext} disabled={!canContinue} tone="primary">
          다음으로
        </SignupButton>
      </SignupFieldGroup>
    </SignupScreen>
  );
}
