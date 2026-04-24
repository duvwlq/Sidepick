import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthButton from '../../components/auth/AuthButton';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import AuthLayout from '../../components/auth/AuthLayout';
import { useAuthFlow } from '../../context/AuthFlowContext';
import { requestEmailVerification } from '../../lib/api';

export default function SignupEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { form, updateField } = useAuthFlow();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('next') || '/';
  }, [location.search]);

  async function handleNext() {
    if (!form.email.trim()) {
      setError('이메일을 입력해 주세요.');
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
          : '인증 메일을 발송했습니다.',
      );
      navigate(`/signup/verify?next=${encodeURIComponent(nextPath)}`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : '인증 메일 발송에 실패했습니다.',
      );
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
            placeholder="이메일을 입력해 주세요"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
          />

          {error ? <p className="text-sm text-red-500">{error}</p> : null}

          <AuthButton onClick={() => void handleNext()}>
            {loading ? '인증 요청 중...' : '인증번호 받기'}
          </AuthButton>
        </div>
      </section>
    </AuthLayout>
  );
}
