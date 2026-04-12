import type { FormState } from '../../hooks/useExperienceWrite';
import type { Category } from '../../lib/api';
import FieldLabel from './FieldLabal';
import MoneyField from './MoneyField';
import SelectField from './SelectField';

type Props = {
  categories: Category[];
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  loading?: boolean;
  error?: string;
};

export default function StepBasicInfo({
  categories,
  form,
  setForm,
  loading = false,
  error = '',
}: Props) {
  const toggleCategory = (value: string) => {
    setForm((prev) => {
      const exists = prev.categories.includes(value);

      return {
        ...prev,
        categories: exists
          ? prev.categories.filter((item) => item !== value)
          : [...prev.categories, value],
      };
    });
  };

  return (
    <div className="space-y-5 rounded-[10px] bg-white p-5">
      <div className="text-2xl font-semibold text-black">기본 정보</div>
      <div className="text-sm font-light text-black">
        실패 경험의 기본 정보를 선택해 주세요.
      </div>

      <FieldLabel label="경험 분야 카테고리" required />

      {loading ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
          카테고리를 불러오는 중입니다.
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {categories.map((item) => {
            const active = form.categories.includes(item.name);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleCategory(item.name)}
                className={`rounded-xl border px-3 py-4 text-left ${
                  active ? 'border-black bg-gray-50' : 'border-gray-200'
                }`}
              >
                <div className="mb-1 text-sm font-semibold text-gray-900">
                  {item.name}
                </div>
                <div className="text-xs text-gray-500">{item.description}</div>
              </button>
            );
          })}
        </div>
      )}

      <SelectField
        label="총 진행 기간"
        value={form.totalPeriod}
        placeholder="선택해 주세요"
        options={['1개월', '3개월', '6개월']}
        onChange={(value) => setForm((prev) => ({ ...prev, totalPeriod: value }))}
      />

      <SelectField
        label="하루 평균 작업 시간"
        value={form.dailyHours}
        placeholder="선택해 주세요"
        options={['1시간', '2시간', '3시간']}
        onChange={(value) => setForm((prev) => ({ ...prev, dailyHours: value }))}
      />

      <MoneyField
        label="투자 금액"
        value={form.expense}
        onChange={(value) => setForm((prev) => ({ ...prev, expense: value }))}
      />

      <MoneyField
        label="매출"
        value={form.revenue}
        onChange={(value) => setForm((prev) => ({ ...prev, revenue: value }))}
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
