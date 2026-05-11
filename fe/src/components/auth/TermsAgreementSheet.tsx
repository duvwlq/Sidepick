import type { ReactNode } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  onAgree: () => void;
};

function AgreementRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 text-sm text-[#444444]">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-[#8C8C8C]">☑</span>
        <span>{children}</span>
      </div>
      <button type="button" className="text-xs text-[#9C9C9C]">
        보기
      </button>
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
      <button
        type="button"
        aria-label="닫기"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="absolute bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 rounded-t-[28px] bg-white px-4 pb-8 pt-4">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#D9D9D9]" />
        <h2 className="mb-5 text-center text-base font-semibold text-black">
          서비스 이용에 필요한
          <br />
          약관에 동의해 주세요
        </h2>

        <div className="rounded-2xl bg-[#FAFAFA] px-4 py-3">
          <AgreementRow>전체 동의하기</AgreementRow>
          <AgreementRow>[필수] 이용약관 동의</AgreementRow>
          <AgreementRow>[필수] 개인정보 수집 및 이용 동의</AgreementRow>
          <AgreementRow>[필수] 만 14세 이상입니다</AgreementRow>
        </div>

        <button
          type="button"
          onClick={onAgree}
          className="mt-5 h-12 w-full rounded-xl bg-[#111111] text-sm font-medium text-white"
        >
          동의합니다
        </button>
      </div>
    </div>
  );
}
