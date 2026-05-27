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
    <SignupScreen
      title="휴대폰 인증"
      headlineLines={['이메일로 발송한', '인증 번호를 입력해 주세요']}
      onBack={() => navigate(`/signup/email?next=${encodeURIComponent(nextPath)}`)}
    >
      <SignupFieldGroup>
        <SignupField
          label="인증 번호"
          placeholder="인증번호 6자리를 입력해 주세요"
          value={form.verificationCode}
          onChange={(event) =>
            updateField(
              'verificationCode',
              event.target.value.replace(/\D/g, '').slice(0, 6),
            )
          }
          suffix={<span>00:00</span>}
          fieldHeight={37}
        />

        {error ? <SignupErrorText>{error}</SignupErrorText> : null}

        <SignupButton onClick={() => void handleNext()} disabled={loading}>
          {loading ? '잠시만 기다려주세요' : '다음으로'}
        </SignupButton>

        <button
          type="button"
          onClick={() => void handleResend()}
          disabled={resending}
          className="w-full"
        >
          <InlineHelperRow>
            <span className="font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#5D5D5D]">
              인증번호가 오지 않으셨나요?
            </span>
            <span className="font-['Pretendard'] text-[12px] font-[600] leading-[14.4px] tracking-[0px] text-black">
              {resending ? '잠시만 기다려주세요' : '재발송'}
            </span>
          </InlineHelperRow>
        </button>
      </SignupFieldGroup>
    </SignupScreen>
  );
}
