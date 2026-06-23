import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SignupButton, SignupFieldGroup, SignupScreen } from '../../components/auth/FigmaSignupPrimitives';
import { useAuthFlow } from '../../context/useAuthFlow';
import { parseNextPath, parseSignupMode, REGION_OPTIONS } from './signup-flow';

function RegionBottomSheet({
  open,
  selectedRegion,
  onClose,
  onSelect,
}: {
  open: boolean;
  selectedRegion: string;
  onClose: () => void;
  onSelect: (region: string) => void;
}) {
  if (!open) {
    return null;
  }

  const midpoint = Math.ceil(REGION_OPTIONS.length / 2);
  const leftColumn = REGION_OPTIONS.slice(0, midpoint);
  const rightColumn = REGION_OPTIONS.slice(midpoint);

  return (
    <div className="fixed inset-0 z-50 bg-black/40">
      <button type="button" aria-label="닫기" className="absolute inset-0" onClick={onClose} />
      <div className="absolute bottom-0 left-1/2 w-full max-w-[375px] -translate-x-1/2 rounded-t-[28px] bg-white px-[16px] pb-[48px] pt-[24px]">
        <h2 className="pb-[20px] text-center font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] text-black">
          거주지 선택
        </h2>

        <div className="flex h-[394px] overflow-hidden">
          <div className="flex-1">
            {leftColumn.map((region) => (
              <button
                key={region}
                type="button"
                onClick={() => onSelect(region)}
                className={`flex h-[40px] w-full items-center px-[16px] text-left font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] ${
                  selectedRegion === region ? 'bg-[#F8F8F8] text-[#131416]' : 'text-[#5D5D5D]'
                }`}
              >
                {region}
              </button>
            ))}
          </div>

          <div className="flex-1">
            {rightColumn.map((region) => (
              <button
                key={region}
                type="button"
                onClick={() => onSelect(region)}
                className="flex h-[40px] w-full items-center justify-between px-[16px] text-left font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] text-[#5D5D5D]"
              >
                <span>{region}</span>
                {selectedRegion === region ? <span className="text-[#5A876E]">✓</span> : null}
              </button>
            ))}
          </div>
        </div>

        <SignupButton onClick={onClose} disabled={!selectedRegion} tone="primary">
          선택 완료
        </SignupButton>
      </div>
    </div>
  );
}

export default function SignupRegionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { form, updateField } = useAuthFlow();
  const nextPath = parseNextPath(location.search);
  const signupMode = parseSignupMode(location.search);
  const [sheetOpen, setSheetOpen] = useState(false);

  const nickname = form.nickname.trim() || '닉네임';

  return (
    <>
      <SignupScreen
        title="거주지 설정"
        headlineLines={[`${nickname}님이`, '살고계신 지역이 어디신가요?']}
        onBack={() => navigate(`/signup/nickname?next=${encodeURIComponent(nextPath)}&mode=${signupMode}`)}
      >
        <SignupFieldGroup>
          <div className="flex w-full flex-col gap-[4px]">
            <span className="font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] text-black">거주지</span>
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="flex h-[40px] w-full items-center justify-between rounded-[10px] bg-[#F8F8F8] px-[16px] py-[10px]"
            >
              <span className={`font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] ${form.region ? 'text-[#494949]' : 'text-[#BABABA]'}`}>
                {form.region || '지역을 선택해주세요'}
              </span>
              <span className="text-[#BABABA]">⌄</span>
            </button>
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

      <RegionBottomSheet
        open={sheetOpen}
        selectedRegion={form.region}
        onClose={() => setSheetOpen(false)}
        onSelect={(region) => updateField('region', region)}
      />
    </>
  );
}
