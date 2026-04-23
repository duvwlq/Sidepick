import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import AuthButton from '../../components/auth/AuthButton';
import { useSignupFlow } from '../../context/SignupFlowContext';
import { useState } from 'react';

export default function SignupVerifyPage() {
  const navigate = useNavigate();
  const { form, updateField } = useSignupFlow();
  const [errorMessage, setErrorMessage] = useState('');

  const handleNext = () => {
    if (!form.verificationCode.trim()) {
      setErrorMessage('인증번호를 입력해 주세요.');
      return;
    }

    setErrorMessage('');
    navigate('/signup/id');
  };

  return (
    <AuthLayout>
      <AuthHeader
        title="휴대폰 인증"
        onBack={() => navigate('/signup/basic')}
      />

      <section className="pt-2">
        <div className="mb-6">
          <h2 className="whitespace-pre-line text-[22px] font-semibold leading-8 text-black">
            휴대폰으로 발송한{'\n'}인증 번호를 입력해 주세요
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          <AuthInput
            label="인증 번호"
            placeholder="인증번호를 입력해 주세요"
            value={form.verificationCode}
            onChange={(e) =>
              updateField('verificationCode', e.target.value.replace(/\D/g, ''))
            }
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
