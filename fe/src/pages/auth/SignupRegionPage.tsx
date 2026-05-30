import { useLocation, useNavigate } from 'react-router-dom';
import { SignupButton, SignupFieldGroup, SignupScreen } from '../../components/auth/FigmaSignupPrimitives';
import { useAuthFlow } from '../../context/useAuthFlow';
import { parseNextPath, parseSignupMode, REGION_OPTIONS } from './signup-flow';

function RegionOption({
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

export default function SignupRegionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { form, updateField } = useAuthFlow();
  const nextPath = parseNextPath(location.search);
  const signupMode = parseSignupMode(location.search);

  return (
    <SignupScreen
      title="거주지 설정"
      headline="지금 주로 머무르는 지역을 선택해 주세요"
      onBack={() => navigate(`/signup/nickname?next=${encodeURIComponent(nextPath)}&mode=${signupMode}`)}
    >
      <SignupFieldGroup>
        <div className="flex flex-col gap-[8px]">
          {REGION_OPTIONS.map((region) => (
            <RegionOption
              key={region}
              active={form.region === region}
              label={region}
              onClick={() => updateField('region', region)}
            />
          ))}
        </div>

        <SignupButton
          onClick={() => navigate(`/signup/employment?next=${encodeURIComponent(nextPath)}&mode=${signupMode}`)}
          disabled={!form.region}
          tone="primary"
        >
          다음으로
        </SignupButton>
      </SignupFieldGroup>
    </SignupScreen>
  );
}
