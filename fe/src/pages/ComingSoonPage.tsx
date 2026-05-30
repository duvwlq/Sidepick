import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function getFeatureCopy(feature: string | null) {
  switch (feature) {
    case 'settings':
      return '설정 화면을 준비 중입니다.';
    case 'profile':
      return '프로필 화면을 준비 중입니다.';
    default:
      return '요청하신 화면을 준비 중입니다.';
  }
}

export default function ComingSoonPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const feature = useMemo(() => new URLSearchParams(location.search).get('feature'), [location.search]);
  const description = getFeatureCopy(feature);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#FFFFFF] px-[24px]">
      <div className="flex w-full max-w-[375px] flex-col items-center gap-[16px] rounded-[12px] border border-[#EEEEEE] bg-[#FFFFFF] px-[24px] py-[32px] shadow-[0px_0px_12px_rgba(0,0,0,0.08)]">
        <h1 className="text-center font-['Pretendard'] text-[20px] font-[600] leading-[24px] tracking-[0px] text-[#000000] [font-feature-settings:'case'_1]">
          준비 중인 기능입니다
        </h1>
        <p className="text-center font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] tracking-[0px] text-[#8A8A8A] [font-feature-settings:'case'_1]">
          {description}
        </p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-[44px] items-center justify-center rounded-[10px] bg-[#5A876E] px-[18px] font-['Pretendard'] text-[14px] font-[600] leading-[16.8px] tracking-[0px] text-[#FFFFFF] [font-feature-settings:'case'_1]"
        >
          이전 화면으로
        </button>
      </div>
    </div>
  );
}
