import { useMemo, useState } from 'react';

export type Step = 1 | 2 | 3 | 4;

export interface FormState {
  categories: string[];
  totalPeriod: string;
  dailyHours: string;
  expense: string;
  revenue: string;
  currentStatus: '예' | '아니오' | '';
  causes: string[];
  difficulties: string[];
  content: string;
}

const initialState: FormState = {
  categories: [],
  totalPeriod: '',
  dailyHours: '',
  expense: '',
  revenue: '',
  currentStatus: '',
  causes: [],
  difficulties: [],
  content: '',
};

export function useExperienceWrite() {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(initialState);

  const progress = useMemo(() => (step / 4) * 100, [step]);

  const next = () => setStep((s) => Math.min(4, s + 1) as Step);
  const prev = () => setStep((s) => Math.max(1, s - 1) as Step);

  const toggleArray = (
    key: 'categories' | 'causes' | 'difficulties',
    value: string,
  ) => {
    setForm((prev) => {
      const arr = prev[key];
      const exists = arr.includes(value);

      return {
        ...prev,
        [key]: exists ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  };

  const isValid = useMemo(() => {
    switch (step) {
      case 1:
        return form.categories.length > 0;
      case 2:
        return form.causes.length > 0;
      case 3:
        return form.difficulties.length > 0;
      case 4:
        return form.content.trim().length >= 50;
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
