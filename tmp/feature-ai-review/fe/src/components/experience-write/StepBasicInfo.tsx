import type { Dispatch, SetStateAction } from 'react';
import type { FormState } from '../../hooks/useExperienceWrite';
import type { Category } from '../../lib/api';
import { CATEGORY_VISUALS } from '../../lib/category-visuals';
import { ErrorState, LoadingState } from '../common/Skeleton';
import FieldLabel from './FieldLabel';

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
        <FieldLabel label="어떤 부업을 경험했나요?" required />
        <LoadingState message="카테고리를 불러오는 중입니다." className="min-h-[147px] content-center" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex w-full flex-col gap-[10px]">
        <FieldLabel label="어떤 부업을 경험했나요?" required />
        <div className="min-h-[147px]">
          <ErrorState message={error} />
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
    };
  });

  return (
    <div className="flex w-full flex-col items-start gap-[10px]">
      <FieldLabel label="어떤 부업을 경험했나요?" required />

      <div className="grid w-full grid-cols-2 gap-x-[10px] gap-y-[10px]">
        {displayCategories.map(({ id, visual }) => {
          const selectedValue = String(id);
          const active = form.categories.includes(selectedValue);

          return (
            <button
              key={id}
              type="button"
              onClick={() => toggleCategory(selectedValue)}
              className={`flex min-h-[147px] flex-col items-start justify-between rounded-[16px] border p-[16px] ${
                active ? 'border-[#131416] bg-[#F8F8F8]' : 'border-[#E6E6E6] bg-[#FFFFFF]'
              }`}
            >
              <div className="flex h-[40px] shrink-0 items-center">{visual.icon}</div>
              <div className="flex w-full min-w-0 flex-col items-start gap-[4px] text-left">
                <p
                  className={`w-full break-words text-[14px] leading-[16.8px] ${
                    active ? 'font-semibold text-[#131416]' : 'font-medium text-[#494949]'
                  }`}
                >
                  {visual.label}
                </p>
                <div
                  className={`w-full break-words text-[10px] leading-[12px] ${
                    active ? 'font-medium text-[#494949]' : 'font-normal text-[#757575]'
                  }`}
                >
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
