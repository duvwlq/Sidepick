import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';

type AuthFlowData = {
  signupMode: 'local' | 'social';
  email: string;
  password: string;
  passwordConfirm: string;
  fullName: string;
  birthDate: string;
  gender: string;
  nickname: string;
  verificationCode: string;
  ageGroup: string;
  region: string;
  experienceStatus: string;
  signupPurposes: string[];
  nicknameChecked: boolean;
  verificationSent: boolean;
  verificationConfirmed: boolean;
  verificationMessage: string;
};

type AuthFlowContextValue = {
  form: AuthFlowData;
  updateField: <K extends keyof AuthFlowData>(key: K, value: AuthFlowData[K]) => void;
  reset: () => void;
};

const initialForm: AuthFlowData = {
  signupMode: 'local',
  email: '',
  password: '',
  passwordConfirm: '',
  fullName: '',
  birthDate: '',
  gender: '',
  nickname: '',
  verificationCode: '',
  ageGroup: '20s',
  region: '',
  experienceStatus: '',
  signupPurposes: [],
  nicknameChecked: false,
  verificationSent: false,
  verificationConfirmed: false,
  verificationMessage: '',
};

const AuthFlowContext = createContext<AuthFlowContextValue | null>(null);

export function AuthFlowProvider({ children }: { children: ReactNode }) {
  const [form, setForm] = useState<AuthFlowData>(initialForm);

  const updateField = useCallback(<K extends keyof AuthFlowData>(key: K, value: AuthFlowData[K]) => {
    setForm((prev) => {
      if (Object.is(prev[key], value)) {
        return prev;
      }

      return {
        ...prev,
        [key]: value,
      };
    });
  }, []);

  const reset = useCallback(() => setForm(initialForm), []);

  const value = useMemo(
    () => ({
      form,
      updateField,
      reset,
    }),
    [form, reset, updateField],
  );

  return (
    <AuthFlowContext.Provider value={value}>{children}</AuthFlowContext.Provider>
  );
}

export { AuthFlowContext };
