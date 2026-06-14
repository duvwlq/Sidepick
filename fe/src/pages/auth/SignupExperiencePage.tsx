import { useLocation, useNavigate } from 'react-router-dom';
import { SignupButton, SignupScreen } from '../../components/auth/FigmaSignupPrimitives';
import { useAuthFlow } from '../../context/useAuthFlow';
import { parseNextPath, parseSignupMode } from './signup-flow';

const EXPERIENCE_CHOICES = [
  { value: 'HAS_EXPERIENCE', label: '예' },
  { value: 'NO_EXPERIENCE', label: '아니오' },
] as const;

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
      className={`flex h-[36px] w-full items-center rounded-[8px] border px-[16px] text-left font-['Pretendard'] text-[14px] leading-[16.8px] ${
        active
          ? 'border-[1.5px] border-[#5A876E] bg-white font-[600] text-[#5A876E]'
          : 'border border-[#E6E6E6] bg-white font-[400] text-[#8A8A8A]'
      }`}
    >
      <span className="mr-[8px] text-[14px] leading-none">{active ? '✓' : '✓'}</span>
      {label}
    </button>
  );
}

export default function SignupExperiencePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { form, updateField } = useAuthFlow();
  const nextPath = parseNextPath(location.search);
  const signupMode = parseSignupMode(location.search);

  const hasSelection =
    form.experienceStatus === 'HAS_EXPERIENCE' || form.experienceStatus === 'NO_EXPERIENCE';

  return (
    <SignupScreen
      title="경험 여부"
      headlineLines={['이전에 부업을', '진행해본 경험이 있으신가요?']}
      onBack={() => navigate(`/signup/region?next=${encodeURIComponent(nextPath)}&mode=${signupMode}`)}
    >
      <div className="flex w-full flex-col gap-[16px]">
        <div className="flex flex-col gap-[10px]">
          {EXPERIENCE_CHOICES.map((option) => (
            <OptionButton
              key={option.value}
              active={form.experienceStatus === option.value}
              label={option.label}
              onClick={() => updateField('experienceStatus', option.value)}
            />
          ))}
        </div>

        <SignupButton
          onClick={() => navigate(`/signup/purpose?next=${encodeURIComponent(nextPath)}&mode=${signupMode}`)}
          disabled={!hasSelection}
          tone="primary"
        >
          다음으로
        </SignupButton>
      </div>
    </SignupScreen>
  );
}
