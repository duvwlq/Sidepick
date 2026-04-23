import { useMemo, useState } from 'react';
import BottomSheet from './BottomSheet';
import AuthButton from './AuthButton';

interface TermsAgreementSheetProps {
  open: boolean;
  onClose: () => void;
  onAgree: () => void;
}

interface TermItem {
  id: string;
  label: string;
  required: boolean;
}

const terms: TermItem[] = [
  { id: 'all', label: '전체 동의하기', required: false },
  { id: 'service', label: '[필수] 이용약관 동의', required: true },
  { id: 'privacy', label: '[필수] 개인정보 처리방침 동의', required: true },
  {
    id: 'identity',
    label: '[필수] 본인확인 서비스 이용약관 동의',
    required: true,
  },
  {
    id: 'thirdParty',
    label: '[필수] 개인정보 제3자 제공 동의',
    required: true,
  },
  { id: 'marketing', label: '[선택] 마케팅 정보 수신 동의', required: false },
];

export default function TermsAgreementSheet({
  open,
  onClose,
  onAgree,
}: TermsAgreementSheetProps) {
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>({
    service: false,
    privacy: false,
    identity: false,
    thirdParty: false,
    marketing: false,
  });

  const requiredAgreed = useMemo(() => {
    return (
      checkedMap.service &&
      checkedMap.privacy &&
      checkedMap.identity &&
      checkedMap.thirdParty
    );
  }, [checkedMap]);

  const allChecked = useMemo(() => {
    return Object.values(checkedMap).every(Boolean);
  }, [checkedMap]);

  const toggleAll = () => {
    const next = !allChecked;
    setCheckedMap({
      service: next,
      privacy: next,
      identity: next,
      thirdParty: next,
      marketing: next,
    });
  };

  const toggleOne = (id: string) => {
    setCheckedMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="rounded-t-3xl bg-white">
        <h2 className="mb-5 text-center text-base font-semibold leading-6 text-black">
          서비스 이용에 필요한
          <br />
          약관에 동의해주세요
        </h2>

        <div className="flex flex-col gap-3">
          {terms.map((term) => {
            if (term.id === 'all') {
              return (
                <button
                  key={term.id}
                  type="button"
                  onClick={toggleAll}
                  className="flex items-center gap-3 text-left"
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${
                      allChecked
                        ? 'border-[#666] bg-[#666] text-white'
                        : 'border-[#cfcfcf] bg-white text-transparent'
                    }`}
                  >
                    ✓
                  </span>
                  <span className="text-sm text-[#555]">{term.label}</span>
                </button>
              );
            }

            return (
              <div
                key={term.id}
                className="flex items-center justify-between gap-3"
              >
                <button
                  type="button"
                  onClick={() => toggleOne(term.id)}
                  className="flex flex-1 items-center gap-3 text-left"
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${
                      checkedMap[term.id]
                        ? 'border-[#666] bg-[#666] text-white'
                        : 'border-[#cfcfcf] bg-white text-transparent'
                    }`}
                  >
                    ✓
                  </span>
                  <span className="text-sm text-[#555]">{term.label}</span>
                </button>

                {term.id !== 'marketing' && (
                  <button
                    type="button"
                    className="text-xs text-[#999] underline"
                  >
                    보기
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-5 text-xs leading-5 text-[#8a8a8a]">
          회원가입 시 서비스 이용 목적으로 개인정보 수집 및 처리에 동의합니다.
        </p>

        <div className="mt-5">
          <AuthButton onClick={onAgree} disabled={!requiredAgreed}>
            동의합니다
          </AuthButton>
        </div>
      </div>
    </BottomSheet>
  );
}
