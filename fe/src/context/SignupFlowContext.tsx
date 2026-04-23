import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

interface SignupFormData {
  phone: string;
  carrier: string;
  birth: string;
  genderDigit: string;
  name: string;
  verificationCode: string;
  id: string;
  password: string;
  passwordConfirm: string;
  nickname: string;
}

interface SignupFlowContextValue {
  form: SignupFormData;
  updateField: (key: keyof SignupFormData, value: string) => void;
  resetSignupForm: () => void;
}

const initialForm: SignupFormData = {
  phone: '',
  carrier: '',
  birth: '',
  genderDigit: '',
  name: '',
  verificationCode: '',
  id: '',
  password: '',
  passwordConfirm: '',
  nickname: '',
};

const SignupFlowContext = createContext<SignupFlowContextValue | null>(null);

export function SignupFlowProvider({ children }: { children: ReactNode }) {
  const [form, setForm] = useState<SignupFormData>(initialForm);

  const updateField = (key: keyof SignupFormData, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetSignupForm = () => {
    setForm(initialForm);
  };

  const value = useMemo(
    () => ({
      form,
      updateField,
      resetSignupForm,
    }),
    [form],
  );

  return (
    <SignupFlowContext.Provider value={value}>
      {children}
    </SignupFlowContext.Provider>
  );
}

export function useSignupFlow() {
  const context = useContext(SignupFlowContext);

  if (!context) {
    throw new Error('useSignupFlow must be used within SignupFlowProvider');
  }

  return context;
}
