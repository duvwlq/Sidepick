import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type AuthFlowData = {
  email: string;
  password: string;
  passwordConfirm: string;
  nickname: string;
  verificationCode: string;
  ageGroup: string;
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
  email: '',
  password: '',
  passwordConfirm: '',
  nickname: '',
  verificationCode: '',
  ageGroup: '20s',
  verificationSent: false,
  verificationConfirmed: false,
  verificationMessage: '',
};

const AuthFlowContext = createContext<AuthFlowContextValue | null>(null);

export function AuthFlowProvider({ children }: { children: ReactNode }) {
  const [form, setForm] = useState<AuthFlowData>(initialForm);

  const value = useMemo(
    () => ({
      form,
      updateField: <K extends keyof AuthFlowData>(key: K, value: AuthFlowData[K]) => {
        setForm((prev) => ({
          ...prev,
          [key]: value,
        }));
      },
      reset: () => setForm(initialForm),
    }),
    [form],
  );

  return (
    <AuthFlowContext.Provider value={value}>{children}</AuthFlowContext.Provider>
  );
}

export function useAuthFlow() {
  const context = useContext(AuthFlowContext);
  if (!context) {
    throw new Error('useAuthFlow must be used within AuthFlowProvider');
  }
  return context;
}
