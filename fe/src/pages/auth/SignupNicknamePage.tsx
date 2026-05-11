import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthButton from '../../components/auth/AuthButton';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import AuthLayout from '../../components/auth/AuthLayout';
import { ErrorState } from '../../components/common/Skeleton';
import { useToast } from '../../components/common/useToast';
import { useAuthFlow } from '../../context/useAuthFlow';
import { register } from '../../lib/api';
import { setFlashToast } from '../../lib/flash-toast';
import { resolveErrorMessage } from '../../lib/resolve-error-message';
import { saveSession } from '../../lib/session';

export default function SignupNicknamePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { form, updateField, reset } = useAuthFlow();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('next') || '/';
  }, [location.search]);

  async function handleSubmit() {
    if (form.nickname.trim().length < 2) {
      setError('2자 이상 입력해주세요');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = await register({
        email: form.email,
        password: form.password,
        nickname: form.nickname,
        ageGroup: form.ageGroup,
      });
      saveSession(payload.accessToken, payload.refreshToken, payload.user);
      setFlashToast(`사이드픽의 가족이 되신 걸 환영해요, ${payload.user.nickname}님!`);
      reset();
      navigate(nextPath, { replace: true });
    } catch (registerError) {
      const message = resolveErrorMessage(registerError, '이미 존재하고있는 닉네임입니다. 다시 작성해주세요');
      setError(message);
      showToast(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <AuthHeader
        title="닉네임 설정"
        onBack={() => navigate(`/signup/password?next=${encodeURIComponent(nextPath)}`)}
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
            placeholder="2자 이상 입력해주세요"
            value={form.nickname}
            onChange={(event) => updateField('nickname', event.target.value)}
          />

          {error ? <ErrorState message={error} /> : null}

          <AuthButton onClick={() => void handleSubmit()} disabled={loading}>
            {loading ? '잠시만 기다려주세요' : '가입 완료'}
          </AuthButton>
        </div>
      </section>
    </AuthLayout>
  );
}
