import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  SignupButton,
  SignupErrorText,
  SignupField,
  SignupFieldGroup,
  SignupScreen,
} from '../../components/auth/FigmaSignupPrimitives';
import { useToast } from '../../components/common/useToast';
import { updateMe } from '../../lib/api';
import { resolveErrorMessage } from '../../lib/resolve-error-message';
import {
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  saveStoredUser,
} from '../../lib/session';

export default function SocialProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const storedUser = useMemo(() => getStoredUser(), []);
  const [nickname, setNickname] = useState(storedUser?.nickname ?? '');
  const [ageGroup, setAgeGroup] = useState(storedUser?.ageGroup ?? '20s');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    }
  }, [navigate, nextPath, storedUser]);

  async function handleSubmit() {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    if (!storedUser || !accessToken || !refreshToken) {
      navigate(`/auth?next=${encodeURIComponent(nextPath)}`, { replace: true });
      return;
    }

    if (nickname.trim().length < 2) {
      setError('닉네임을 2자 이상 입력해주세요.');
      return;
    }

    if (!ageGroup.trim()) {
      setError('연령대를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = await updateMe(accessToken, {
        nickname: nickname.trim(),
        ageGroup: ageGroup.trim(),
        profileImage: storedUser.profileImage,
      });
      saveStoredUser(payload.user);
      navigate(nextPath, { replace: true });
    } catch (updateError) {
      const message = resolveErrorMessage(
        updateError,
        '추가 정보를 저장하지 못했어요. 다시 시도해주세요.',
      );
      setError(message);
      showToast(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SignupScreen
      title="추가 정보"
      headlineLines={['소셜 로그인은 완료됐어요.', '서비스 이용에 필요한 정보를 채워주세요.']}
      onBack={() => navigate('/auth')}
    >
      <SignupFieldGroup>
        <SignupField
          label="닉네임"
          placeholder="2자 이상 입력해주세요"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          fieldHeight={37}
        />
        <SignupField
          label="연령대"
          placeholder="예: 20s"
          value={ageGroup}
          onChange={(event) => setAgeGroup(event.target.value)}
          fieldHeight={37}
        />

        {error ? <SignupErrorText>{error}</SignupErrorText> : null}

        <SignupButton onClick={() => void handleSubmit()} disabled={loading} tone="primary">
          {loading ? '저장 중입니다' : '완료'}
        </SignupButton>
      </SignupFieldGroup>
    </SignupScreen>
  );
}
