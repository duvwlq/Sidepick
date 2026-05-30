import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SignupButton, SignupFieldGroup, SignupScreen } from '../../components/auth/FigmaSignupPrimitives';
import { getStoredUser } from '../../lib/session';

export default function SocialProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const storedUser = useMemo(() => getStoredUser(), []);

  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('next') || '/';
  }, [location.search]);

  useEffect(() => {
    if (!storedUser) {
      navigate(`/auth?next=${encodeURIComponent(nextPath)}`, { replace: true });
      return;
    }

    if (storedUser.profileCompleted) {
      navigate(nextPath, { replace: true });
      return;
    }

    navigate(`/signup/nickname?next=${encodeURIComponent(nextPath)}&mode=social`, {
      replace: true,
    });
  }, [navigate, nextPath, storedUser]);

  return (
    <SignupScreen
      title="추가 정보"
      headlineLines={['소셜 로그인이 완료되었어요', '회원가입을 이어서 진행해 주세요']}
      onBack={() => navigate('/auth')}
    >
      <SignupFieldGroup>
        <SignupButton
          onClick={() =>
            navigate(`/signup/nickname?next=${encodeURIComponent(nextPath)}&mode=social`)
          }
          tone="primary"
        >
          회원가입 이어서 하기
        </SignupButton>
      </SignupFieldGroup>
    </SignupScreen>
  );
}
