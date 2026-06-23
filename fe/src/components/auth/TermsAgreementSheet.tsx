type Props = {
  open: boolean;
  onClose: () => void;
  onAgree: () => void;
};

const AGREEMENT_ITEMS = [
  { label: '전체 동의하기', required: false },
  { label: '[필수] 서비스 이용약관 동의', required: true },
  { label: '[필수] 개인정보 수집 및 이용 동의', required: true },
  { label: '[필수] 만 14세 이상입니다', required: true },
];

function AgreementRow({
  label,
  required,
}: {
  label: string;
  required: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-[12px] py-[6px]">
      <div className="flex items-center gap-[8px]">
        <span className="font-['Pretendard'] text-[12px] leading-[14.4px] text-[#B4B4B4]">☑</span>
        <span className="font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] text-[#8A8A8A]">
          {label}
        </span>
      </div>
      {required ? (
        <button
          type="button"
          className="font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] text-[#8A8A8A]"
        >
          보기
        </button>
      ) : null}
    </div>
  );
}

export default function TermsAgreementSheet({
  open,
  onClose,
  onAgree,
}: Props) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40">
      <button type="button" aria-label="닫기" className="absolute inset-0" onClick={onClose} />
      <div className="absolute bottom-0 left-1/2 w-full max-w-[375px] -translate-x-1/2 rounded-t-[28px] bg-white px-[16px] pb-[20px] pt-[16px]">
        <div className="mb-[18px] flex justify-center">
          <div className="h-[4px] w-[56px] rounded-full bg-[#D9D9D9]" />
        </div>

        <h2 className="mb-[16px] text-center font-['Pretendard'] text-[14px] font-[600] leading-[16.8px] text-black">
          서비스 이용에 필요한
          <br />
          약관에 동의해주세요
        </h2>

        <div className="rounded-[8px] border border-[#F0F0F0] bg-white px-[12px] py-[10px]">
          {AGREEMENT_ITEMS.map((item) => (
            <AgreementRow key={item.label} label={item.label} required={item.required} />
          ))}
        </div>

        <p className="mt-[12px] font-['Pretendard'] text-[10px] font-[400] leading-[14px] text-[#8A8A8A]">
          회원가입 시 서비스 이용 목적은 계정 설정에만 사용되며 별도의 분석이나 추천에 자동 반영되지 않습니다.
        </p>

        <button
          type="button"
          onClick={onAgree}
          className="mt-[16px] h-[44px] w-full rounded-[8px] bg-[#5A876E] font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] text-white"
        >
          동의하기
        </button>
      </div>
    </div>
  );
}
