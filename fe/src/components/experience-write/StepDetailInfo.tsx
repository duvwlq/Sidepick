import type { Dispatch, SetStateAction } from 'react';
import type { FormState } from '../../hooks/useExperienceWrite';
import FieldLabel from './FieldLabal';

type Props = {
  form: FormState;
  setForm: Dispatch<SetStateAction<FormState>>;
};

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
  return (
    <div className="flex w-full flex-col items-start gap-[20px]">
      <SelectBox
        label="총 진행 기간"
        required
        value={form.totalPeriod}
        options={periodOptions}
        onChange={(value) =>
          setForm((previous) => ({ ...previous, totalPeriod: value }))
        }
      />

      <SelectBox
        label="평균 하루 할애 시간"
        value={form.dailyHours}
        options={hourOptions}
        onChange={(value) =>
          setForm((previous) => ({ ...previous, dailyHours: value }))
        }
      />

      <MoneyBox
        label="투자 금액"
        value={form.expense}
        onChange={(value) =>
          setForm((previous) => ({ ...previous, expense: value }))
        }
      />

      <MoneyBox
        label="수익 (월 단위로 작성해주세요)"
        value={form.revenue}
        onChange={(value) =>
          setForm((previous) => ({ ...previous, revenue: value }))
        }
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
  );
}

function SelectBox({
  label,
  required,
  value,
  options,
  onChange,
}: {
  label: string;
  required?: boolean;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex w-full flex-col gap-[10px]">
      <FieldLabel label={label} required={required} />
      <div className="relative h-[40px] w-full rounded-[8px] border border-[#E6E6E6] bg-[#FFFFFF]">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-[16px] py-[10px]">
          <span className="truncate font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] tracking-[0px] text-[#5D5D5D] [font-feature-settings:'case'_1]">
            {value || '선택 안 함'}
          </span>
          <ChevronDown />
        </div>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent text-transparent outline-none"
          aria-label={label}
        >
          <option value="">선택 안 함</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
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
      <div className="relative h-[40px] w-full rounded-[10px] bg-[#F8F8F8]">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-[16px] py-[10px] font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] tracking-[0px] [font-feature-settings:'case'_1]">
          <span className={value ? 'text-[#111111]' : 'text-[#BABABA]'}>
            {value ? Number(value).toLocaleString('ko-KR') : '예: 1,000,000'}
          </span>
          <span className="text-[#494949]">원</span>
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
      className={`flex h-[40px] w-full items-center gap-[4px] rounded-[8px] border px-[16px] py-[10px] ${
        active ? 'border-[#131416] bg-[#F8F8F8]' : 'border-[#E6E6E6] bg-[#FFFFFF]'
      }`}
    >
      <CheckIcon active={active} />
      <span className="min-w-0 flex-1 truncate text-left font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] tracking-[0px] text-[#757575] [font-feature-settings:'case'_1]">
        {label}
      </span>
    </button>
  );
}

function ChevronDown() {
  return (
    <svg viewBox="0 0 16 16" className="h-[16px] w-[16px]" fill="none" aria-hidden="true">
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
    <svg viewBox="0 0 14 14" className="h-[14px] w-[14px]" fill="none" aria-hidden="true">
      <path
        d="M3 7.1L5.7 9.8L11 4.5"
        stroke={active ? '#131416' : '#BABABA'}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
