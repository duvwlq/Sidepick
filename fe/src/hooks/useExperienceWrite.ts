import { useMemo, useState } from 'react';

export type Step = 1 | 2 | 3 | 4;

export interface FormState {
  categories: string[];
  totalPeriod: string;
  dailyHours: string;
  expense: string;
  revenue: string;
  isConcurrentWithMainJob: '예' | '아니오' | '';
  causes: string[];
  difficulties: string[];
  difficultyEtc: string;
  difficultyExtra: string;
  content: string;
}

const initialState: FormState = {
  categories: [],
  totalPeriod: '',
  dailyHours: '',
  expense: '',
  revenue: '',
  isConcurrentWithMainJob: '',
  causes: [],
  difficulties: [],
  difficultyEtc: '',
  difficultyExtra: '',
  content: '',
};

export function useExperienceWrite() {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(initialState);

  const progress = useMemo(() => (step / 4) * 100, [step]);

  const next = () => setStep((current) => Math.min(4, current + 1) as Step);
  const prev = () => setStep((current) => Math.max(1, current - 1) as Step);

  const toggleArray = (
    key: 'categories' | 'causes' | 'difficulties',
    value: string,
  ) => {
    setForm((previous) => {
      const values = previous[key];
      const exists = values.includes(value);

      return {
        ...previous,
        [key]: exists
          ? values.filter((item) => item !== value)
          : [...values, value],
      };
    });
  };

  const isValid = useMemo(() => {
    switch (step) {
      case 1:
        return (
          form.categories.length > 0 &&
          Boolean(form.totalPeriod) &&
          Boolean(form.dailyHours) &&
          Boolean(form.isConcurrentWithMainJob)
        );
      case 2:
        return form.causes.length > 0;
      case 3:
        return form.difficulties.length > 0;
      case 4:
        return form.content.trim().length >= 10;
      default:
        return false;
    }
  }, [form, step]);

  return {
    step,
    form,
    setForm,
    progress,
    next,
    prev,
    toggleArray,
    isValid,
  };
}
