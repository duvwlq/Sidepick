import type { Dispatch, SetStateAction } from 'react';
import type { FormState } from '../../hooks/useExperienceWrite';
import type { Category } from '../../lib/api';
import FieldLabel from './FieldLabal';

type Props = {
  categories: Category[];
  form: FormState;
  setForm: Dispatch<SetStateAction<FormState>>;
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
    setForm((previous) => ({
      ...previous,
      categories: previous.categories.includes(value) ? [] : [value],
    }));
  };

  if (loading) {
    return (
      <div className="flex w-full flex-col gap-[10px]">
        <FieldLabel label="경험 부업 카테고리" required />
        <div className="flex h-[98px] w-full items-center justify-center rounded-[16px] border border-dashed border-[#E6E6E6] bg-[#FFFFFF] font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] text-[#757575]">
          카테고리를 불러오는 중입니다.
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex w-full flex-col gap-[10px]">
        <FieldLabel label="경험 부업 카테고리" required />
        <div className="flex min-h-[98px] w-full items-center rounded-[16px] border border-[#F6C9C9] bg-[#FFF5F5] p-[16px] font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] text-[#D33B3B]">
          {error}
        </div>
      </div>
    );
  }

  const visibleCategories = categories.slice(0, 7);

  return (
    <div className="flex w-full flex-col items-start gap-[10px]">
      <FieldLabel label="경험 부업 카테고리" required />

      <div className="grid w-full grid-cols-2 gap-[10px]">
        {visibleCategories.map((item, index) => {
          const active = form.categories.includes(item.name);
          const isFull = index === 6;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleCategory(item.name)}
              className={`flex h-[98px] ${isFull ? 'col-span-2' : ''} flex-col items-center justify-center gap-[10px] rounded-[16px] border-[1.108px] p-[16px] ${
                active
                  ? 'border-[#131416] bg-[#F8F8F8]'
                  : 'border-[#E6E6E6] bg-[#FFFFFF]'
              }`}
            >
              <span
                className="flex h-[36px] w-[36px] items-center justify-center overflow-hidden rounded-[2px] text-[20px]"
                style={{ backgroundColor: `${item.color}18`, color: item.color }}
              >
                {item.icon}
              </span>
              <span className="w-full truncate text-center font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949] [font-feature-settings:'case'_1]">
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
