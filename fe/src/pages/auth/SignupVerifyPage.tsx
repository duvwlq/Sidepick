import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  InlineHelperRow,
  SignupButton,
  SignupErrorText,
  SignupField,
  SignupFieldGroup,
  SignupScreen,
} from '../../components/auth/FigmaSignupPrimitives';
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
      setError('인증번호 6자리를 입력해 주세요.');
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
      updateField('verificationMessage', '이메일 인증이 완료되었어요.');
      setFlashToast('이메일 인증이 완료되었어요.');
      navigate(`/signup/username?next=${encodeURIComponent(nextPath)}`);
    } catch (confirmError) {
      const message = resolveErrorMessage(confirmError, '인증번호가 일치하지 않아요. 다시 확인해 주세요.');
      setError(message);
      showToast(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!form.email.trim()) {
      setError('이메일을 먼저 입력해 주세요.');
      return;
    }

    setResending(true);
    setError('');

    try {
      const payload = await requestEmailVerification({ email: form.email });
      updateField(
        'verificationMessage',
        payload.verificationCode
          ? `개발용 인증코드: ${payload.verificationCode}`
          : '인증 메일이 다시 발송되었어요.',
      );
      showToast('인증번호를 다시 발송했어요.');
    } catch (requestError) {
      const message = resolveErrorMessage(requestError, '잠시 후 다시 시도해 주세요.');
      setError(message);
      showToast(message);
    } finally {
      setResending(false);
    }
  }

  return (
    <SignupScreen
      title="이메일 인증"
      headline="이메일로 발송한 인증 번호를 입력해 주세요"
      onBack={() => navigate(`/signup/identity/details?next=${encodeURIComponent(nextPath)}`)}
    >
      <SignupFieldGroup>
        <SignupField
          label="인증 번호"
          placeholder="인증번호 6자리를 입력해 주세요"
          value={form.verificationCode}
          onChange={(event) =>
            updateField('verificationCode', event.target.value.replace(/\D/g, '').slice(0, 6))
          }
          suffix={<span>00:00</span>}
          inputMode="numeric"
          autoComplete="one-time-code"
          fieldHeight={40}
        />

        {error ? <SignupErrorText>{error}</SignupErrorText> : null}

        <SignupButton onClick={() => void handleNext()} disabled={loading} tone="soft">
          {loading ? '인증 확인 중...' : '다음으로'}
        </SignupButton>

        <button type="button" onClick={() => void handleResend()} disabled={resending} className="w-full">
          <InlineHelperRow>
            <span className="font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] text-[#5D5D5D]">
              인증번호가 오지 않으셨나요?
            </span>
            <span className="font-['Pretendard'] text-[12px] font-[600] leading-[14.4px] text-black">
              {resending ? '재발송 중' : '재발송'}
            </span>
          </InlineHelperRow>
        </button>
      </SignupFieldGroup>
    </SignupScreen>
  );
}
