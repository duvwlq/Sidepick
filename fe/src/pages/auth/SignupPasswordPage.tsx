import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import AuthButton from '../../components/auth/AuthButton';
import { useSignupFlow } from '../../context/SignupFlowContext';

export default function SignupPasswordPage() {
  const navigate = useNavigate();
  const { form, updateField } = useSignupFlow();
  const [errorMessage, setErrorMessage] = useState('');

  const handleNext = () => {
    if (!form.password.trim() || !form.passwordConfirm.trim()) {
      setErrorMessage('비밀번호를 모두 입력해 주세요.');
      return;
    }

    if (form.password !== form.passwordConfirm) {
      setErrorMessage('비밀번호가 일치하지 않습니다.');
      return;
    }

    setErrorMessage('');
    navigate('/signup/nickname');
  };

  return (
    <AuthLayout>
      <AuthHeader title="비밀번호 설정" onBack={() => navigate('/signup/id')} />

      <section className="pt-2">
        <div className="mb-6">
          <h2 className="whitespace-pre-line text-[22px] font-semibold leading-8 text-black">
            로그인 시 사용할{'\n'}비밀번호를 입력해 주세요
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          <AuthInput
            label="비밀번호"
            type="password"
            placeholder="영문, 숫자를 조합하여 8자 이상 입력해 주세요"
            value={form.password}
            onChange={(e) => updateField('password', e.target.value)}
          />

          <AuthInput
            label="비밀번호 확인"
            type="password"
            placeholder="비밀번호 확인을 위해 다시 한 번 입력해 주세요"
            value={form.passwordConfirm}
            onChange={(e) => updateField('passwordConfirm', e.target.value)}
          />

          {errorMessage && (
            <p className="text-sm text-red-500">{errorMessage}</p>
          )}

          <AuthButton onClick={handleNext}>다음으로</AuthButton>
        </div>
      </section>
    </AuthLayout>
  );
}
