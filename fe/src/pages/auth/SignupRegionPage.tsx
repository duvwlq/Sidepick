import { useLocation, useNavigate } from 'react-router-dom';
import { SignupButton, SignupFieldGroup, SignupScreen } from '../../components/auth/FigmaSignupPrimitives';
import { useAuthFlow } from '../../context/useAuthFlow';
import { parseNextPath, parseSignupMode, REGION_OPTIONS } from './signup-flow';

export default function SignupRegionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { form, updateField } = useAuthFlow();
  const nextPath = parseNextPath(location.search);
  const signupMode = parseSignupMode(location.search);

  return (
    <SignupScreen
      title="거주지 설정"
      headlineLines={[`${form.nickname || '회원'}님이 살고 계신`, '지역이 어디신가요?']}
      onBack={() => navigate(`/signup/nickname?next=${encodeURIComponent(nextPath)}&mode=${signupMode}`)}
    >
      <SignupFieldGroup>
        <div className="flex w-full flex-col gap-[4px]">
          <span className="font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] text-black">
            거주지
          </span>
          <select
            value={form.region}
            onChange={(event) => updateField('region', event.target.value)}
            className="h-[40px] w-full rounded-[10px] border-0 bg-[#F8F8F8] px-[16px] font-['Pretendard'] text-[14px] text-[#494949] outline-none"
          >
            <option value="">지역을 선택해주세요</option>
            {REGION_OPTIONS.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>

        <SignupButton
          onClick={() =>
            navigate(`/signup/employment?next=${encodeURIComponent(nextPath)}&mode=${signupMode}`)
          }
          disabled={!form.region}
          tone="primary"
        >
          다음으로
        </SignupButton>
      </SignupFieldGroup>
    </SignupScreen>
  );
}
