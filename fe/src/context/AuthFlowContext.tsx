import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';

type AuthFlowData = {
  signupMode: 'local' | 'social';
  email: string;
  identityCode: string;
  username: string;
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
  usernameChecked: boolean;
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
  identityCode: '',
  username: '',
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
  usernameChecked: false,
  nicknameChecked: false,
  verificationSent: false,
  verificationConfirmed: false,
  verificationMessage: '',
};

const HARNESS_STORAGE_KEY = 'sidepick.authFlowHarnessSeed';

function readHarnessSeed(): Partial<AuthFlowData> {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(HARNESS_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(([key]) => key in initialForm),
    ) as Partial<AuthFlowData>;
  } catch {
    return {};
  }
}

function createInitialForm(): AuthFlowData {
  return {
    ...initialForm,
    ...readHarnessSeed(),
  };
}

const AuthFlowContext = createContext<AuthFlowContextValue | null>(null);

export function AuthFlowProvider({ children }: { children: ReactNode }) {
  const [form, setForm] = useState<AuthFlowData>(createInitialForm);

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
