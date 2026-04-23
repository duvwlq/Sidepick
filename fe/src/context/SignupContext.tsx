import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { SignupFormData } from '../types/auth';

interface SignupContextValue {
  formData: SignupFormData;
  updateFormData: (data: Partial<SignupFormData>) => void;
  resetFormData: () => void;
}

const initialFormData: SignupFormData = {
  phone: '',
  name: '',
  id: '',
  password: '',
  nickname: '',
};

const SignupContext = createContext<SignupContextValue | null>(null);

export function SignupProvider({ children }: { children: ReactNode }) {
  const [formData, setFormData] = useState<SignupFormData>(initialFormData);

  const updateFormData = (data: Partial<SignupFormData>) => {
    setFormData((prev) => ({
      ...prev,
      ...data,
    }));
  };

  const resetFormData = () => {
    setFormData(initialFormData);
  };

  const value = useMemo(
    () => ({
      formData,
      updateFormData,
      resetFormData,
    }),
    [formData],
  );

  return (
    <SignupContext.Provider value={value}>{children}</SignupContext.Provider>
  );
}

export function useSignup() {
  const context = useContext(SignupContext);

  if (!context) {
    throw new Error('useSignup must be used within SignupProvider');
  }

  return context;
}
