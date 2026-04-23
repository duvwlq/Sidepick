import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import AuthButton from '../../components/auth/AuthButton';
import TermsAgreementSheet from '../../components/auth/TermsAgreementSheet';
import { loginUser } from '../../utils/authStorage';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const handleLogin = () => {
    if (!id.trim() || !password.trim()) {
      setErrorMessage('아이디와 비밀번호를 입력해 주세요.');
      return;
    }

    const user = loginUser(id, password);

    if (!user) {
      setErrorMessage('아이디 또는 비밀번호가 올바르지 않습니다.');
      return;
    }

    login();
    setErrorMessage('');
    navigate('/mypage');
  };

  return (
    <>
      <AuthLayout>
        <AuthHeader title="" />

        <section className="flex flex-col gap-4">
          <AuthInput
            label="아이디"
            placeholder="아이디를 입력해주세요"
            value={id}
            onChange={(e) => setId(e.target.value)}
          />

          <AuthInput
            label="비밀번호"
            type="password"
            placeholder="비밀번호를 입력해주세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {errorMessage && (
            <p className="text-sm text-red-500">{errorMessage}</p>
          )}

          <div className="mt-2 flex flex-col gap-2">
            <AuthButton onClick={handleLogin}>로그인</AuthButton>

            <AuthButton
              variant="secondary"
              onClick={() => setIsTermsOpen(true)}
            >
              회원가입
            </AuthButton>
          </div>
        </section>
      </AuthLayout>

      <TermsAgreementSheet
        open={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
        onAgree={() => {
          setIsTermsOpen(false);
          navigate('/signup/basic');
        }}
      />
    </>
  );
}
