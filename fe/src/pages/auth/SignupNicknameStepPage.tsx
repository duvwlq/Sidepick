import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SignupButton, SignupErrorText, SignupFieldGroup, SignupScreen } from '../../components/auth/FigmaSignupPrimitives';
import { useToast } from '../../components/common/useToast';
import { useAuthFlow } from '../../context/useAuthFlow';
import { getStoredUser } from '../../lib/session';
import { deriveAgeGroup, GENDER_OPTIONS, parseNextPath, parseSignupMode } from './signup-flow';

function OptionButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[40px] w-full items-center rounded-[10px] border px-[16px] text-left font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] ${
        active ? 'border-[#5A876E] bg-[#EAF3EE] text-[#2F4D3D]' : 'border-[#E6E6E6] bg-white text-[#494949]'
      }`}
    >
      {label}
    </button>
  );
}

function InlineInput({
  label,
  value,
  placeholder,
  type = 'text',
  onChange,
  action,
}: {
  label: string;
  value: string;
  placeholder: string;
  type?: 'text' | 'date';
  onChange: (nextValue: string) => void;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-[4px]">
      <span className="font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] text-black">{label}</span>

      <div className="flex h-[40px] w-full overflow-hidden rounded-[10px] bg-[#F8F8F8]">
        <label className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-0 flex items-center px-[16px]">
            <span
              className={`truncate font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] ${
                value ? 'text-[#494949]' : 'text-[#BABABA]'
              }`}
            >
              {value || placeholder}
            </span>
          </div>
          <input
            type={type}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="absolute inset-0 h-full w-full border-0 bg-transparent px-[16px] font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] text-transparent caret-black outline-none placeholder:text-transparent"
          />
        </label>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}

export default function SignupNicknameStepPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { form, updateField } = useAuthFlow();
  const [error, setError] = useState('');
  const signupMode = parseSignupMode(location.search);
  const nextPath = parseNextPath(location.search);
  const storedUser = useMemo(() => getStoredUser(), []);

  useEffect(() => {
    updateField('signupMode', signupMode);
    if (signupMode === 'social' && !form.nickname.trim() && storedUser?.nickname) {
      updateField('nickname', storedUser.nickname);
      updateField('nicknameChecked', true);
    }
    if (signupMode === 'social' && !form.fullName.trim() && storedUser?.fullName) {
      updateField('fullName', storedUser.fullName);
    }
    if (signupMode === 'social' && !form.gender && storedUser?.gender) {
      updateField('gender', storedUser.gender);
    }
    if (signupMode === 'social' && !form.birthDate && storedUser?.birthDate) {
      updateField('birthDate', storedUser.birthDate);
    }
  }, [
    form.birthDate,
    form.fullName,
    form.gender,
    form.nickname,
    signupMode,
    storedUser,
    updateField,
  ]);

  function handleNicknameCheck() {
    if (form.nickname.trim().length < 2) {
      setError('닉네임을 2자 이상 입력해 주세요.');
      return;
    }

    updateField('nicknameChecked', true);
    setError('');
    showToast('사용 가능한 닉네임으로 확인되었어요.');
  }

  function handleNext() {
    if (form.fullName.trim().length < 2) {
      setError('이름을 2자 이상 입력해 주세요.');
      return;
    }

    if (!form.birthDate) {
      setError('생년월일을 입력해 주세요.');
      return;
    }

    if (!form.gender) {
      setError('성별을 선택해 주세요.');
      return;
    }

    if (form.nickname.trim().length < 2) {
      setError('닉네임을 2자 이상 입력해 주세요.');
      return;
    }

    if (!form.nicknameChecked) {
      setError('닉네임 중복 확인을 먼저 진행해 주세요.');
      return;
    }

    updateField('ageGroup', deriveAgeGroup(form.birthDate));
    setError('');
    navigate(`/signup/region?next=${encodeURIComponent(nextPath)}&mode=${signupMode}`);
  }

  return (
    <SignupScreen
      title="개인 정보 등록"
      headline="이름과 닉네임 등 기본 정보를 입력해 주세요"
      onBack={() =>
        navigate(
          signupMode === 'social'
            ? `/auth?next=${encodeURIComponent(nextPath)}`
            : `/signup/password?next=${encodeURIComponent(nextPath)}&mode=local`,
        )
      }
    >
      <SignupFieldGroup>
        <InlineInput
          label="이름"
          value={form.fullName}
          placeholder="이름을 입력해 주세요"
          onChange={(nextValue) => updateField('fullName', nextValue)}
        />

        <InlineInput
          label="생년월일"
          value={form.birthDate}
          placeholder="YYYY-MM-DD"
          type="date"
          onChange={(nextValue) => updateField('birthDate', nextValue)}
        />

        <div className="flex w-full flex-col gap-[8px]">
          <span className="font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] text-black">성별</span>
          {GENDER_OPTIONS.map((option) => (
            <OptionButton
              key={option.value}
              active={form.gender === option.value}
              label={option.label}
              onClick={() => updateField('gender', option.value)}
            />
          ))}
        </div>

        <InlineInput
          label="닉네임"
          value={form.nickname}
          placeholder="3자 이상 입력해 주세요"
          onChange={(nextValue) => {
            updateField('nickname', nextValue);
            updateField('nicknameChecked', false);
          }}
          action={
            <button
              type="button"
              onClick={handleNicknameCheck}
              className={`flex h-[40px] w-[75px] items-center justify-center font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] ${
                form.nicknameChecked ? 'bg-[#EAF3EE] text-[#5A876E]' : 'bg-[#F8F8F8] text-[#494949]'
              }`}
            >
              {form.nicknameChecked ? '확인완료' : '중복확인'}
            </button>
          }
        />

        {error ? <SignupErrorText>{error}</SignupErrorText> : null}

        <SignupButton onClick={handleNext} tone="soft">
          다음으로
        </SignupButton>
      </SignupFieldGroup>
    </SignupScreen>
  );
}
