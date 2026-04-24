import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthButton from '../../components/auth/AuthButton';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import AuthLayout from '../../components/auth/AuthLayout';
import { useAuthFlow } from '../../context/AuthFlowContext';
import { confirmEmailVerification, requestEmailVerification } from '../../lib/api';

export default function SignupVerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { form, updateField } = useAuthFlow();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');

  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('next') || '/';
  }, [location.search]);

  async function handleNext() {
    if (!form.verificationCode.trim()) {
      setError('인증번호를 입력해 주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await confirmEmailVerification({
        email: form.email,
        code: form.verificationCode,
      });
      updateField('verificationConfirmed', true);
      navigate(`/signup/password?next=${encodeURIComponent(nextPath)}`);
    } catch (confirmError) {
      setError(
        confirmError instanceof Error
          ? confirmError.message
          : '인증 확인에 실패했습니다.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!form.email.trim()) {
      setError('이메일을 다시 입력해 주세요.');
      return;
    }

    setResending(true);
    setError('');

    try {
      const payload = await requestEmailVerification({ email: form.email });
      updateField(
        'verificationMessage',
        payload.verificationCode
          ? `개발용 인증 코드: ${payload.verificationCode}`
          : '인증 메일을 다시 발송했습니다.',
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : '인증 메일 재발송에 실패했습니다.',
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthLayout>
      <AuthHeader
        title="이메일 인증"
        onBack={() => navigate(`/signup/email?next=${encodeURIComponent(nextPath)}`)}
      />

      <section className="pt-2">
        <div className="mb-6">
          <h2 className="whitespace-pre-line text-[22px] font-semibold leading-8 text-black">
            이메일로 발송한{'\n'}인증번호를 입력해 주세요
          </h2>
          <p className="mt-3 text-sm text-[#777777]">{form.email}</p>
          {form.verificationMessage ? (
            <p className="mt-2 text-sm text-[#666666]">{form.verificationMessage}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          <AuthInput
            label="인증 번호"
            placeholder="인증번호 6자리를 입력해 주세요"
            value={form.verificationCode}
            onChange={(event) =>
              updateField(
                'verificationCode',
                event.target.value.replace(/\D/g, '').slice(0, 6),
              )
            }
          />

          {error ? <p className="text-sm text-red-500">{error}</p> : null}

          <AuthButton onClick={() => void handleNext()}>
            {loading ? '확인 중...' : '다음으로'}
          </AuthButton>

          <button
            type="button"
            onClick={() => void handleResend()}
            className="text-sm text-[#666666]"
          >
            {resending ? '재발송 중...' : '인증번호가 오지 않았나요? 재발송'}
          </button>
        </div>
      </section>
    </AuthLayout>
  );
}
