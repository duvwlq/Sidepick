import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import AuthButton from '../../components/auth/AuthButton';
import { useSignupFlow } from '../../context/SignupFlowContext';
import { addUser } from '../../utils/authStorage';
import type { User } from '../../types/auth';

export default function SignupNicknamePage() {
  const navigate = useNavigate();
  const { form, updateField, resetSignupForm } = useSignupFlow();
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = () => {
    if (!form.nickname.trim()) {
      setErrorMessage('사용할 이름을 입력해 주세요.');
      return;
    }

    const newUser: User = {
      phone: form.phone.trim(),
      carrier: form.carrier.trim(),
      birth: form.birth,
      genderDigit: form.genderDigit,
      name: form.name.trim(),
      id: form.id.trim(),
      password: form.password,
      nickname: form.nickname.trim(),
    };

    addUser(newUser);
    resetSignupForm();
    navigate('/login');
  };

  return (
    <AuthLayout>
      <AuthHeader
        title="닉네임 설정"
        onBack={() => navigate('/signup/password')}
      />

      <section className="pt-2">
        <div className="mb-6">
          <h2 className="whitespace-pre-line text-[22px] font-semibold leading-8 text-black">
            사이드픽에서 사용할{'\n'}이름을 정해볼까요?
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          <AuthInput
            label="닉네임"
            placeholder="8자 이내로 입력해주세요"
            value={form.nickname}
            onChange={(e) => updateField('nickname', e.target.value)}
          />

          {errorMessage && (
            <p className="text-sm text-red-500">{errorMessage}</p>
          )}

          <AuthButton onClick={handleSubmit}>가입 완료</AuthButton>
        </div>
      </section>
    </AuthLayout>
  );
}
