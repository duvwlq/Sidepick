import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import AuthButton from '../../components/auth/AuthButton';
import { useSignupFlow } from '../../context/SignupFlowContext';
import { findUserById } from '../../utils/authStorage';

export default function SignupIdPage() {
  const navigate = useNavigate();
  const { form, updateField } = useSignupFlow();
  const [errorMessage, setErrorMessage] = useState('');

  const handleNext = () => {
    const trimmedId = form.id.trim();

    if (!trimmedId) {
      setErrorMessage('아이디를 입력해 주세요.');
      return;
    }

    if (findUserById(trimmedId)) {
      setErrorMessage('이미 사용 중인 아이디입니다.');
      return;
    }

    setErrorMessage('');
    navigate('/signup/password');
  };

  return (
    <AuthLayout>
      <AuthHeader
        title="아이디 설정"
        onBack={() => navigate('/signup/verify')}
      />

      <section className="pt-2">
        <div className="mb-6">
          <h2 className="whitespace-pre-line text-[22px] font-semibold leading-8 text-black">
            로그인 시 사용할{'\n'}아이디를 입력해 주세요
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          <AuthInput
            label="아이디"
            placeholder="영문, 숫자를 조합하여 8자 이상 입력해 주세요"
            value={form.id}
            onChange={(e) => updateField('id', e.target.value)}
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
