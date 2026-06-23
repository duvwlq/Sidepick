import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthButton from '../../components/auth/AuthButton';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import AuthLayout from '../../components/auth/AuthLayout';
import { ErrorState } from '../../components/common/Skeleton';
import { useToast } from '../../components/common/useToast';
import { useAuthFlow } from '../../context/useAuthFlow';
import { confirmEmailVerification, requestEmailVerification } from '../../lib/api';
import { setFlashToast } from '../../lib/flash-toast';
import { resolveErrorMessage } from '../../lib/resolve-error-message';

export default function SignupVerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
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
      setError('인증 번호가 일치하지 않습니다. 다시 확인해주세요');
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
      updateField('verificationMessage', '이메일 인증이 완료되었어요');
      setFlashToast('이메일 인증이 완료되었어요');
      navigate(`/signup/password?next=${encodeURIComponent(nextPath)}`);
    } catch (confirmError) {
      const message = resolveErrorMessage(confirmError, '인증 번호가 일치하지 않습니다. 다시 확인해주세요');
      setError(message);
      showToast(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!form.email.trim()) {
      setError('이메일 형식에 맞게 다시 작성해주세요');
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
          : '이메일 인증이 완료되었어요',
      );
    } catch (requestError) {
      const message = resolveErrorMessage(requestError, '잠시 연결이 불안정해요. 다시 시도해주세요.');
      setError(message);
      showToast(message);
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
            이메일로 발송된{'\n'}인증번호를 입력해주세요
          </h2>
          <p className="mt-3 break-words text-sm text-[#777777]">{form.email}</p>
          {form.verificationMessage ? (
            <p className="mt-2 break-words text-sm text-[#666666]">{form.verificationMessage}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          <AuthInput
            label="인증 번호"
            placeholder="인증번호 6자리를 입력해주세요"
            value={form.verificationCode}
            onChange={(event) =>
              updateField(
                'verificationCode',
                event.target.value.replace(/\D/g, '').slice(0, 6),
              )
            }
          />

          {error ? <ErrorState message={error} /> : null}

          <AuthButton onClick={() => void handleNext()} disabled={loading}>
            {loading ? '잠시만 기다려주세요' : '다음으로'}
          </AuthButton>

          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={resending}
            className="min-h-[44px] text-sm text-[#666666] disabled:opacity-60"
          >
            {resending ? '잠시만 기다려주세요' : '인증번호가 오지 않았나요? 재발송'}
          </button>
        </div>
      </section>
    </AuthLayout>
  );
}
