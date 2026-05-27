import { useLocation, useNavigate } from 'react-router-dom';
import { SignupButton, SignupFieldGroup, SignupScreen } from '../../components/auth/FigmaSignupPrimitives';
import { useAuthFlow } from '../../context/useAuthFlow';
import { EMPLOYMENT_OPTIONS, parseNextPath, parseSignupMode } from './signup-flow';

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
      className={`flex h-[40px] w-full items-center rounded-[10px] border px-[16px] text-left font-['Pretendard'] text-[14px] leading-[16.8px] ${
        active ? 'border-[#5A876E] bg-[#EAF3EE] text-[#2F4D3D]' : 'border-[#E6E6E6] bg-white text-[#494949]'
      }`}
    >
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

  return (
    <SignupScreen
      title="본업 여부"
      headlineLines={['현재 본업을 하고 계신지', '알려주세요']}
      onBack={() => navigate(`/signup/region?next=${encodeURIComponent(nextPath)}&mode=${signupMode}`)}
    >
      <SignupFieldGroup>
        {EMPLOYMENT_OPTIONS.map((option) => (
          <OptionButton
            key={option}
            active={form.employmentStatus === option}
            label={option}
            onClick={() => updateField('employmentStatus', option)}
          />
        ))}

        <SignupButton
          onClick={() =>
            navigate(`/signup/purpose?next=${encodeURIComponent(nextPath)}&mode=${signupMode}`)
          }
          disabled={!form.employmentStatus}
          tone="primary"
        >
          다음으로
        </SignupButton>
      </SignupFieldGroup>
    </SignupScreen>
  );
}
