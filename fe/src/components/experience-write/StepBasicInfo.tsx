import type { Dispatch, SetStateAction } from 'react';
import type { FormState } from '../../hooks/useExperienceWrite';
import type { Category } from '../../lib/api';
import FieldLabel from './FieldLabal';
import MoneyField from './MoneyField';
import SelectField from './SelectField';

type Props = {
  categories: Category[];
  form: FormState;
  setForm: Dispatch<SetStateAction<FormState>>;
  loading?: boolean;
  error?: string;
};

const periodOptions = [
  '1개월 미만',
  '1~3개월',
  '3~6개월',
  '6개월~1년',
  '1년 이상',
];

const hourOptions = [
  '1시간 미만',
  '1~3시간',
  '3~5시간',
  '5시간 이상',
];

export default function StepBasicInfo({
  categories,
  form,
  setForm,
  loading = false,
  error = '',
}: Props) {
  const toggleCategory = (value: string) => {
    setForm((previous) => {
      const exists = previous.categories.includes(value);

      return {
        ...previous,
        categories: exists ? [] : [value],
      };
    });
  };

  return (
    <div className="rounded-[24px] bg-white px-5 pb-6 pt-7 shadow-[0_6px_20px_rgba(15,23,42,0.06)]">
      <div className="mb-7">
        <h2 className="text-[20px] font-semibold leading-[1.45] text-[#111111]">
          어떤 상황에서 시작하셨나요?
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#666666]">
          경험을 이해하는 데 필요한 기본 정보예요.
        </p>
      </div>

      <FieldLabel label="경험 분야 카테고리" required />

      {loading ? (
        <div className="mt-3 rounded-[18px] border border-dashed border-[#D9DEE8] bg-[#FBFBFC] p-4 text-sm text-[#666666]">
          카테고리를 불러오는 중입니다.
        </div>
      ) : error ? (
        <div className="mt-3 rounded-[18px] border border-[#F6C9C9] bg-[#FFF5F5] p-4 text-sm text-[#D33B3B]">
          {error}
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {categories.map((item) => {
            const active = form.categories.includes(item.name);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleCategory(item.name)}
                className={`min-h-[116px] rounded-[18px] border px-4 py-4 text-left transition ${
                  active
                    ? 'border-[#111111] bg-[#FAFAFA] shadow-[0_4px_12px_rgba(17,17,17,0.06)]'
                    : 'border-[#E4E7EC] bg-white'
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-lg"
                    style={{ backgroundColor: `${item.color}18`, color: item.color }}
                  >
                    {item.icon}
                  </span>
                  <span className="text-[15px] font-semibold text-[#111111]">
                    {item.name}
                  </span>
                </div>
                <div className="line-clamp-3 text-xs leading-5 text-[#666666]">
                  {item.description}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-6 space-y-5">
        <SelectField
          label="총 진행 기간"
          value={form.totalPeriod}
          placeholder="선택해 주세요"
          options={periodOptions}
          onChange={(value) =>
            setForm((previous) => ({ ...previous, totalPeriod: value }))
          }
        />

        <SelectField
          label="평균 하루 할애 시간"
          value={form.dailyHours}
          placeholder="선택해 주세요"
          options={hourOptions}
          onChange={(value) =>
            setForm((previous) => ({ ...previous, dailyHours: value }))
          }
        />

        <MoneyField
          label="투자 금액"
          value={form.expense}
          onChange={(value) =>
            setForm((previous) => ({ ...previous, expense: value }))
          }
        />

        <MoneyField
          label="수익"
          value={form.revenue}
          onChange={(value) =>
            setForm((previous) => ({ ...previous, revenue: value }))
          }
        />

        <div>
          <FieldLabel label="본업 병행 여부" required />
          <div className="mt-3 space-y-2.5">
            {(['예', '아니오'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() =>
                  setForm((previous) => ({
                    ...previous,
                    isConcurrentWithMainJob: item,
                  }))
                }
                className={`flex h-12 w-full items-center justify-center rounded-[16px] border text-sm font-medium transition ${
                  form.isConcurrentWithMainJob === item
                    ? 'border-[#111111] bg-[#FAFAFA] text-[#111111]'
                    : 'border-[#E4E7EC] bg-white text-[#666666]'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
