import type { Dispatch, SetStateAction } from 'react';
import type { Category } from '../../lib/api';
import { CATEGORY_VISUALS } from '../../lib/category-visuals';
import type { FormState } from '../../hooks/useExperienceWrite';
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
        <FieldLabel label="어떠한 부업을 경험했었나요?" required />
        <div className="flex h-[147px] w-full items-center justify-center rounded-[16px] border border-dashed border-[#E6E6E6] bg-[#FFFFFF] font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] tracking-[0px] text-[#757575] [font-feature-settings:'case'_1]">
          카테고리를 불러오는 중입니다.
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex w-full flex-col gap-[10px]">
        <FieldLabel label="어떠한 부업을 경험했었나요?" required />
        <div className="flex min-h-[147px] w-full items-center rounded-[16px] border border-[#F6C9C9] bg-[#FFF5F5] p-[16px] font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] tracking-[0px] text-[#D33B3B] [font-feature-settings:'case'_1]">
          {error}
        </div>
      </div>
    );
  }

  const categoryById = new Map(categories.map((item) => [item.id, item]));
  const displayCategories = CATEGORY_VISUALS.map((visual) => {
    const apiCategory = categoryById.get(visual.id);
    return {
      id: visual.id,
      visual: apiCategory
        ? {
            ...visual,
            label: apiCategory.name || visual.label,
          }
        : visual,
      disabled: false,
    };
  });

  return (
    <div className="flex w-full flex-col items-start gap-[10px]">
      <FieldLabel label="어떠한 부업을 경험했었나요?" required />

      <div className="grid w-full grid-cols-2 gap-x-[10px] gap-y-[10px]">
        {displayCategories.map(({ id, visual }) => {
          const selectedValue = String(id);
          const active = form.categories.includes(selectedValue);

          return (
            <button
              key={id}
              type="button"
              onClick={() => toggleCategory(selectedValue)}
              className={`flex h-[147px] flex-col items-start justify-between rounded-[16px] border-[1.108px] border-solid p-[16px] ${
                active ? 'border-[#131416] bg-[#F8F8F8]' : 'border-[#E6E6E6] bg-[#FFFFFF]'
              }`}
            >
              <div className="flex h-[40px] items-center shrink-0">{visual.icon}</div>
              <div className="flex w-full flex-col items-start gap-[4px] text-left">
                <p className="w-full font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] tracking-[0px] text-[#494949] [font-feature-settings:'case'_1]">
                  {visual.label}
                </p>
                <div className="w-full font-['Pretendard'] text-[10px] font-[300] leading-[12px] tracking-[0px] text-[#BABABA] [font-feature-settings:'case'_1]">
                  {visual.descriptionLines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
