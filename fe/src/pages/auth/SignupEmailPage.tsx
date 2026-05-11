import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthButton from '../../components/auth/AuthButton';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import AuthLayout from '../../components/auth/AuthLayout';
import { ErrorState } from '../../components/common/Skeleton';
import { useToast } from '../../components/common/useToast';
import { useAuthFlow } from '../../context/useAuthFlow';
import { requestEmailVerification } from '../../lib/api';
import { resolveErrorMessage } from '../../lib/resolve-error-message';

export default function SignupEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { form, updateField } = useAuthFlow();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('next') || '/';
  }, [location.search]);

  async function handleNext() {
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('이메일 형식에 맞게 다시 작성해주세요');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = await requestEmailVerification({ email: form.email });
      updateField('verificationSent', true);
      updateField(
        'verificationMessage',
        payload.verificationCode
          ? `개발용 인증 코드: ${payload.verificationCode}`
          : '이메일 인증이 완료되었어요',
      );
      navigate(`/signup/verify?next=${encodeURIComponent(nextPath)}`);
    } catch (requestError) {
      const message = resolveErrorMessage(requestError, '이메일 형식에 맞게 다시 작성해주세요');
      setError(message);
      showToast(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <AuthHeader
        title="개인 정보 등록"
        onBack={() =>
          navigate(`/auth?next=${encodeURIComponent(nextPath)}`, {
            replace: true,
          })
        }
      />

      <section className="pt-2">
        <div className="mb-6">
          <h2 className="whitespace-pre-line text-[22px] font-semibold leading-8 text-black">
            이메일로{'\n'}본인 확인을 진행할게요
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          <AuthInput
            label="이메일"
            type="email"
            placeholder="이메일 형식에 맞게 다시 작성해주세요"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
          />

          {error ? <ErrorState message={error} /> : null}

          <AuthButton onClick={() => void handleNext()} disabled={loading}>
            {loading ? '잠시만 기다려주세요' : '인증번호 받기'}
          </AuthButton>
        </div>
      </section>
    </AuthLayout>
  );
}
