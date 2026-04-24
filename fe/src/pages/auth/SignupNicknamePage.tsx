import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthButton from '../../components/auth/AuthButton';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import AuthLayout from '../../components/auth/AuthLayout';
import { useAuthFlow } from '../../context/AuthFlowContext';
import { register } from '../../lib/api';
import { saveSession } from '../../lib/session';

export default function SignupNicknamePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { form, updateField, reset } = useAuthFlow();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('next') || '/';
  }, [location.search]);

  async function handleSubmit() {
    if (!form.nickname.trim()) {
      setError('닉네임을 입력해 주세요.');
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
      reset();
      navigate(nextPath, { replace: true });
    } catch (registerError) {
      setError(
        registerError instanceof Error
          ? registerError.message
          : '회원가입에 실패했습니다.',
      );
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
            placeholder="2자 이상 20자 이하로 입력해 주세요"
            value={form.nickname}
            onChange={(event) => updateField('nickname', event.target.value)}
          />

          {error ? <p className="text-sm text-red-500">{error}</p> : null}

          <AuthButton onClick={() => void handleSubmit()}>
            {loading ? '가입 중...' : '가입 완료'}
          </AuthButton>
        </div>
      </section>
    </AuthLayout>
  );
}
