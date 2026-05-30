import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import arrowLeftIcon from '../assets/auth-figma/arrow-left.svg';
import avatarPlaceholderIcon from '../assets/mypage-overview-figma/avatar-placeholder.png';
import cameraIcon from '../assets/mypage-overview-figma/camera.svg';
import { useToast } from '../components/common/useToast';
import {
  ApiError,
  changeMyPassword,
  getMe,
  updateMyAccountSettings,
  type UserSummary,
} from '../lib/api';
import { resolveErrorMessage } from '../lib/resolve-error-message';
import { clearSession, getAccessToken, getStoredUser, saveStoredUser } from '../lib/session';

function isAuthError(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

function FieldLabel({ children }: { children: string }) {
  return <p className="text-[14px] font-[600] leading-[17px] text-[#131416]">{children}</p>;
}

function FieldHint({ children }: { children: string }) {
  return <p className="text-[12px] leading-[17px] text-[#8A8A8A]">{children}</p>;
}

function InputField({
  value,
  placeholder,
  readOnly = false,
  type = 'text',
  onChange,
}: {
  value: string;
  placeholder: string;
  readOnly?: boolean;
  type?: 'text' | 'password';
  onChange: (value: string) => void;
}) {
  return (
    <input
      type={type}
      value={value}
      readOnly={readOnly}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-[44px] w-full rounded-[12px] border border-[#ECECEC] bg-[#F8F8F8] px-[16px] text-[14px] text-[#131416] outline-none placeholder:text-[#BABABA] read-only:text-[#8A8A8A]"
    />
  );
}

function ExperienceToggle({
  selected,
  label,
  onClick,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[44px] flex-1 items-center justify-center rounded-[12px] border text-[14px] ${
        selected ? 'border-[#5A876E] bg-[#F4F8F5] font-[600] text-[#5A876E]' : 'border-[#E5E5E5] bg-white text-[#8A8A8A]'
      }`}
    >
      {label}
    </button>
  );
}

export default function MyPageProfileEdit() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const token = getAccessToken();
  const storedUser = getStoredUser();

  const [currentUser, setCurrentUser] = useState<UserSummary | null>(storedUser);
  const [nickname, setNickname] = useState(storedUser?.nickname ?? '');
  const [experienceStatus, setExperienceStatus] = useState(storedUser?.experienceStatus ?? 'NO_EXPERIENCE');
  const [email, setEmail] = useState(storedUser?.email ?? '');
  const [region, setRegion] = useState(storedUser?.region ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/auth?next=%2Fmypage%2Fprofile%2Fedit', { replace: true });
      return;
    }

    let cancelled = false;

    void getMe(token)
      .then((payload) => {
        if (cancelled) {
          return;
        }

        setCurrentUser(payload.user);
        setNickname(payload.user.nickname ?? '');
        setExperienceStatus(payload.user.experienceStatus ?? 'NO_EXPERIENCE');
        setEmail(payload.user.email ?? '');
        setRegion(payload.user.region ?? '');
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        if (isAuthError(error)) {
          clearSession();
          navigate('/auth?next=%2Fmypage%2Fprofile%2Fedit', { replace: true });
          return;
        }

        showToast(resolveErrorMessage(error, '프로필 정보를 불러오지 못했습니다.'), 'error');
      });

    return () => {
      cancelled = true;
    };
  }, [navigate, showToast, token]);

  async function handleSave() {
    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) {
      showToast('닉네임을 입력해 주세요.', 'error');
      return;
    }

    const wantsPasswordChange = currentPassword || newPassword || confirmPassword;
    if (wantsPasswordChange) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('비밀번호 변경 항목을 모두 입력해 주세요.', 'error');
        return;
      }
      if (newPassword !== confirmPassword) {
        showToast('새 비밀번호 확인이 일치하지 않습니다.', 'error');
        return;
      }
    }

    if (!token || !currentUser) {
      showToast('로그인 정보를 확인할 수 없습니다.', 'error');
      return;
    }

    setSaving(true);

    try {
      const profilePayload = await updateMyAccountSettings(token, {
        nickname: trimmedNickname,
        experienceStatus,
      });

      if (wantsPasswordChange) {
        await changeMyPassword(token, {
          currentPassword,
          newPassword,
        });
      }

      const mergedUser = {
        ...currentUser,
        ...profilePayload.user,
        region,
        email,
      };

      setCurrentUser(mergedUser);
      saveStoredUser(mergedUser);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('계정 설정을 저장했어요.', 'success');
      navigate('/mypage');
    } catch (error) {
      if (isAuthError(error)) {
        clearSession();
        navigate('/auth?next=%2Fmypage%2Fprofile%2Fedit', { replace: true });
        return;
      }

      showToast(resolveErrorMessage(error, '계정 설정 저장에 실패했습니다.'), 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-[375px] bg-white">
      <header className="flex h-[64px] items-center justify-between px-[16px]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-[24px] w-[24px] items-center justify-center"
          aria-label="뒤로가기"
        >
          <img src={arrowLeftIcon} alt="" className="h-[24px] w-[24px]" />
        </button>
        <h1 className="text-[16px] font-[600] text-[#000000]">계정 설정</h1>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="text-[14px] font-[600] text-[#5A876E] disabled:opacity-50"
        >
          {saving ? '저장 중' : '저장'}
        </button>
      </header>

      <main className="flex flex-col gap-[24px] px-[16px] pb-[40px] pt-[12px]">
        <section className="flex flex-col items-center gap-[12px] rounded-[20px] bg-[#FAFAFA] px-[20px] py-[24px]">
          <div className="relative h-[96px] w-[96px] overflow-hidden rounded-full bg-[#F1F1F1]">
            <img
              src={currentUser?.profileImage ?? avatarPlaceholderIcon}
              alt=""
              className="h-full w-full object-cover"
            />
            <span className="absolute bottom-[2px] right-[2px] flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#8A8A8A]">
              <img src={cameraIcon} alt="" className="h-[14px] w-[14px]" />
            </span>
          </div>
          <FieldHint>프로필 사진 변경은 아직 준비 중입니다.</FieldHint>
        </section>

        <section className="flex flex-col gap-[20px]">
          <div className="flex flex-col gap-[8px]">
            <FieldLabel>닉네임</FieldLabel>
            <InputField value={nickname} placeholder="닉네임을 입력해 주세요" onChange={setNickname} />
          </div>

          <div className="flex flex-col gap-[8px]">
            <FieldLabel>부업 경험 여부</FieldLabel>
            <div className="flex gap-[8px]">
              <ExperienceToggle
                selected={experienceStatus === 'HAS_EXPERIENCE'}
                label="경험 있음"
                onClick={() => setExperienceStatus('HAS_EXPERIENCE')}
              />
              <ExperienceToggle
                selected={experienceStatus === 'NO_EXPERIENCE'}
                label="경험 없음"
                onClick={() => setExperienceStatus('NO_EXPERIENCE')}
              />
            </div>
          </div>

          <div className="flex flex-col gap-[8px]">
            <FieldLabel>이메일</FieldLabel>
            <InputField value={email} placeholder="이메일" readOnly onChange={setEmail} />
            <FieldHint>이메일은 현재 수정할 수 없습니다.</FieldHint>
          </div>

          <div className="flex flex-col gap-[8px]">
            <FieldLabel>지역</FieldLabel>
            <InputField value={region} placeholder="지역" readOnly onChange={setRegion} />
            <FieldHint>지역 수정은 다음 단계에서 지원할 예정입니다.</FieldHint>
          </div>
        </section>

        <section className="flex flex-col gap-[12px] rounded-[20px] bg-[#FAFAFA] px-[16px] py-[16px]">
          <FieldLabel>비밀번호 변경</FieldLabel>
          <InputField value={currentPassword} type="password" placeholder="현재 비밀번호" onChange={setCurrentPassword} />
          <InputField value={newPassword} type="password" placeholder="새 비밀번호 (영문+숫자 8자 이상)" onChange={setNewPassword} />
          <InputField value={confirmPassword} type="password" placeholder="새 비밀번호 확인" onChange={setConfirmPassword} />
          <FieldHint>변경하지 않으려면 비워두세요.</FieldHint>
        </section>
      </main>
    </div>
  );
}
