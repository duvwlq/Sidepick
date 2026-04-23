import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthButton from '../../components/auth/AuthButton';
import TermsAgreementSheet from '../../components/auth/TermsAgreementSheet';

export default function AuthEntryPage() {
  const navigate = useNavigate();
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  return (
    <>
      <AuthLayout>
        <AuthHeader title="시작하기" />

        <section className="flex min-h-[calc(100vh-120px)] flex-col justify-center gap-4">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold leading-8">
              서비스를 이용하려면
              <br />
              로그인이 필요해요
            </h2>
            <p className="mt-2 text-sm text-[#777]">
              로그인하거나 회원가입을 진행해 주세요.
            </p>
          </div>

          <AuthButton onClick={() => navigate('/login')}>로그인</AuthButton>

          <AuthButton variant="secondary" onClick={() => setIsTermsOpen(true)}>
            회원가입
          </AuthButton>
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
