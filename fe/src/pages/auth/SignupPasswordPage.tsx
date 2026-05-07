import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthButton from '../../components/auth/AuthButton';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import AuthLayout from '../../components/auth/AuthLayout';
import { useAuthFlow } from '../../context/useAuthFlow';

export default function SignupPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { form, updateField } = useAuthFlow();
  const [error, setError] = useState('');

  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('next') || '/';
  }, [location.search]);

  function handleNext() {
    if (!form.password.trim() || !form.passwordConfirm.trim()) {
      setError('비밀번호를 모두 입력해 주세요.');
      return;
    }

    if (form.password.length < 8) {
      setError('비밀번호는 8자 이상 입력해 주세요.');
      return;
    }

    if (form.password !== form.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setError('');
    navigate(`/signup/nickname?next=${encodeURIComponent(nextPath)}`);
  }

  return (
    <AuthLayout>
      <AuthHeader
        title="비밀번호 설정"
        onBack={() => navigate(`/signup/verify?next=${encodeURIComponent(nextPath)}`)}
      />

      <section className="pt-2">
        <div className="mb-6">
          <h2 className="whitespace-pre-line text-[22px] font-semibold leading-8 text-black">
            로그인에 사용할{'\n'}비밀번호를 입력해 주세요
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          <AuthInput
            label="비밀번호"
            type="password"
            placeholder="8자 이상 입력해 주세요"
            value={form.password}
            onChange={(event) => updateField('password', event.target.value)}
          />

          <AuthInput
            label="비밀번호 재입력"
            type="password"
            placeholder="비밀번호를 다시 입력해 주세요"
            value={form.passwordConfirm}
            onChange={(event) =>
              updateField('passwordConfirm', event.target.value)
            }
          />

          {error ? <p className="text-sm text-red-500">{error}</p> : null}

          <AuthButton onClick={handleNext}>다음으로</AuthButton>
        </div>
      </section>
    </AuthLayout>
  );
}
