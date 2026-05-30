import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import type { FormState } from '../../hooks/useExperienceWrite';
import FieldLabel from './FieldLabel';

type Props = {
  form: FormState;
  setForm: Dispatch<SetStateAction<FormState>>;
};

type SheetKey = 'period' | 'hours' | null;

const periodOptions = [
  '1개월 미만',
  '1개월',
  '2개월',
  '3개월',
  '4개월',
  '5개월',
  '6개월',
  '7개월',
  '8개월',
  '9개월',
  '10개월',
  '11개월',
  '1년 이상',
];

const hourOptions = [
  '1시간 미만',
  '1시간',
  '2시간',
  '3시간',
  '4시간',
  '5시간',
  '6시간',
  '7시간',
  '8시간 이상',
];

export default function StepDetailInfo({ form, setForm }: Props) {
  const [openSheet, setOpenSheet] = useState<SheetKey>(null);

  useEffect(() => {
    if (!openSheet) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenSheet(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [openSheet]);

  return (
    <>
      <div className="flex w-full flex-col items-start gap-[20px]">
        <SelectTrigger
          label="총 진행 기간"
          required
          value={form.totalPeriod}
          onClick={() => setOpenSheet('period')}
        />

        <SelectTrigger
          label="평균 하루 할애 기간"
          value={form.dailyHours}
          onClick={() => setOpenSheet('hours')}
        />

        <MoneyBox
          label="투자 금액"
          value={form.expense}
          onChange={(value) => setForm((previous) => ({ ...previous, expense: value }))}
        />

        <MoneyBox
          label="수익 (월 단위로 작성해주세요)"
          value={form.revenue}
          onChange={(value) => setForm((previous) => ({ ...previous, revenue: value }))}
        />

        <div className="flex w-full flex-col gap-[10px]">
          <FieldLabel label="본업 병행 여부" required />
          <div className="flex w-full flex-col gap-[10px]">
            {(['예', '아니오'] as const).map((item) => (
              <ChoiceButton
                key={item}
                label={item}
                active={form.isConcurrentWithMainJob === item}
                onClick={() =>
                  setForm((previous) => ({
                    ...previous,
                    isConcurrentWithMainJob: item,
                  }))
                }
              />
            ))}
          </div>
        </div>
      </div>

      <OptionBottomSheet
        open={openSheet === 'period'}
        title="총 진행 기간"
        options={periodOptions}
        value={form.totalPeriod}
        sheetHeight={615}
        listHeight={500}
        onClose={() => setOpenSheet(null)}
        onSelect={(value) => {
          setForm((previous) => ({ ...previous, totalPeriod: value }));
          setOpenSheet(null);
        }}
      />

      <OptionBottomSheet
        open={openSheet === 'hours'}
        title="평균 하루 할애 기간"
        options={hourOptions}
        value={form.dailyHours}
        sheetHeight={455}
        listHeight={340}
        onClose={() => setOpenSheet(null)}
        onSelect={(value) => {
          setForm((previous) => ({ ...previous, dailyHours: value }));
          setOpenSheet(null);
        }}
      />
    </>
  );
}

function SelectTrigger({
  label,
  required,
  value,
  onClick,
}: {
  label: string;
  required?: boolean;
  value: string;
  onClick: () => void;
}) {
  return (
    <div className="flex w-full flex-col gap-[10px]">
      <FieldLabel label={label} required={required} />
      <button
        type="button"
        onClick={onClick}
        className="flex h-[36px] w-full items-center justify-between rounded-[10px] border border-[#E6E6E6] bg-[#FFFFFF] px-[16px] py-[8px]"
        aria-label={label}
        aria-haspopup="dialog"
      >
        <span
          className={`truncate font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] tracking-[0px] [font-feature-settings:'case'_1] ${
            value ? 'text-[#131416]' : 'text-[#BABABA]'
          }`}
        >
          {value || '선택해주세요'}
        </span>
        <ChevronDown />
      </button>
    </div>
  );
}

function OptionBottomSheet({
  open,
  title,
  options,
  value,
  sheetHeight,
  listHeight,
  onClose,
  onSelect,
}: {
  open: boolean;
  title: string;
  options: string[];
  value: string;
  sheetHeight: number;
  listHeight: number;
  onClose: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <div
      className={`fixed inset-0 z-[70] transition-opacity duration-300 ${
        open ? 'pointer-events-auto bg-black/40 opacity-100' : 'pointer-events-none bg-black/0 opacity-0'
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="닫기"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div
        className={`absolute bottom-0 left-1/2 flex w-full max-w-[430px] -translate-x-1/2 flex-col rounded-t-[24px] bg-[#FFFFFF] px-[24px] pb-[48px] pt-[24px] transition-transform duration-300 ease-out ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ height: `${sheetHeight}px` }}
      >
        <div className="pb-[24px] text-center font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-[#131416] [font-feature-settings:'case'_1]">
          {title}
        </div>
        <div
          className="flex w-full flex-col gap-[20px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ height: `${listHeight}px` }}
        >
          {options.map((option) => {
            const active = option === value;

            return (
              <button
                key={option}
                type="button"
                onClick={() => onSelect(option)}
                className={`flex h-[20px] items-center text-left font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] tracking-[0px] [font-feature-settings:'case'_1] ${
                  active ? 'text-[#131416]' : 'text-[#494949]'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MoneyBox({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex w-full flex-col gap-[10px]">
      <FieldLabel label={label} />
      <div className="relative h-[36px] w-full rounded-[10px] bg-[#F8F8F8]">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-[16px] py-[8px]">
          <span
            className={`font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] tracking-[0px] [font-feature-settings:'case'_1] ${
              value ? 'text-[#131416]' : 'text-[#BABABA]'
            }`}
          >
            {value ? Number(value).toLocaleString('ko-KR') : '예: 1,000,000'}
          </span>
          <span className="font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] tracking-[0px] text-[#8A8A8A] [font-feature-settings:'case'_1]">
            원
          </span>
        </div>
        <input
          value={value}
          inputMode="numeric"
          onChange={(event) => onChange(event.target.value.replace(/[^\d]/g, ''))}
          className="absolute inset-0 h-full w-full bg-transparent px-[16px] text-transparent caret-[#000000] outline-none"
          aria-label={label}
        />
      </div>
    </div>
  );
}

function ChoiceButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[36px] w-full items-center gap-[4px] rounded-[10px] border px-[16px] py-[8px] ${
        active ? 'border-[#131416] bg-[#F8F8F8]' : 'border-[#E6E6E6] bg-[#FFFFFF]'
      }`}
    >
      <CheckIcon active={active} />
      <span
        className={`min-w-0 flex-1 truncate text-left font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] tracking-[0px] [font-feature-settings:'case'_1] ${
          active ? 'text-[#131416]' : 'text-[#8A8A8A]'
        }`}
      >
        {label}
      </span>
    </button>
  );
}

function ChevronDown() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-[16px] w-[16px] shrink-0"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 6L8 10L12 6"
        stroke="#757575"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 14 14"
      className="h-[14px] w-[14px] shrink-0"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 7.1L5.7 9.8L11 4.5"
        stroke={active ? '#131416' : '#757575'}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
