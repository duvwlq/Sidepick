import type { FormState } from '../../hooks/useExperienceWrite';
import { categoryOptions } from '../../constants/experienceOptions';
import SelectField from './SelectField';
import MoneyField from './MoneyField';
import FieldLabel from './FieldLabal';

type Props = {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
};

export default function StepBasicInfo({ form, setForm }: Props) {
  const toggleCategory = (value: string) => {
    setForm((prev) => {
      const exists = prev.categories.includes(value);

      return {
        ...prev,
        categories: exists
          ? prev.categories.filter((v) => v !== value)
          : [...prev.categories, value],
      };
    });
  };

  return (
    <div className="space-y-5 bg-white p-5 rounded-[10px]">
      <div className="justify-center text-black text-2xl font-semibold font-['Pretendard'] leading-9">
        기본 정보
      </div>
      <div className="text-center justify-center text-black text-sm font-light font-['Pretendard'] leading-4">
        부업 경험에 대한 기본 정보를 선택해주세요!
      </div>
      <FieldLabel label="경험 부업 카테고리" required />

      <div className="grid grid-cols-2 gap-3">
        {categoryOptions.map((item) => {
          const active = form.categories.includes(item);

          return (
            <button
              key={item}
              type="button"
              onClick={() => toggleCategory(item)}
              className={`h-24 rounded-xl border ${
                active ? 'border-black' : 'border-gray-200'
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>

      <SelectField
        label="총 진행 기간"
        value={form.totalPeriod}
        placeholder="선택 안 함"
        options={['1개월', '3개월', '6개월']}
        onChange={(v) => setForm((prev) => ({ ...prev, totalPeriod: v }))}
      />

      <SelectField
        label="하루 평균 시간"
        value={form.dailyHours}
        placeholder="선택 안 함"
        options={['1시간', '2시간', '3시간']}
        onChange={(v) => setForm((prev) => ({ ...prev, dailyHours: v }))}
      />

      <MoneyField
        label="투자금"
        value={form.expense}
        onChange={(v) => setForm((prev) => ({ ...prev, expense: v }))}
      />

      <MoneyField
        label="수익"
        value={form.revenue}
        onChange={(v) => setForm((prev) => ({ ...prev, revenue: v }))}
      />

      <div>
        <FieldLabel label="본업 병행 여부" required />

        <div className="mt-2 space-y-2">
          {(['예', '아니오'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  currentStatus: item,
                }))
              }
              className={`h-11 w-full rounded-xl border ${
                form.currentStatus === item ? 'border-black' : 'border-gray-200'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
