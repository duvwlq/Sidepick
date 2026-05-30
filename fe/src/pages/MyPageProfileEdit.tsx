import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/common/useToast';
import arrowLeftIcon from '../assets/auth-figma/arrow-left.svg';
import batteryFrameIcon from '../assets/auth-figma/battery-frame.svg';
import cellularConnectionIcon from '../assets/auth-figma/cellular-connection.svg';
import wifiIcon from '../assets/auth-figma/wifi.svg';
import editIcon from '../assets/explore-figma/edit.svg';
import liveHelpNavIcon from '../assets/images/live-help.svg';
import homeNavIcon from '../assets/images/home.svg';
import plusFabIcon from '../assets/home-v1-figma/icons/plus-figma.svg';
import searchNavIcon from '../assets/images/search.svg';
import userNavIcon from '../assets/images/user.svg';
import avatarPlaceholderIcon from '../assets/mypage-overview-figma/avatar-placeholder.png';
import cameraIcon from '../assets/mypage-overview-figma/camera.svg';
import cameraActionIcon from '../assets/mypage-profile-edit-figma/camera-action.svg';
import albumActionIcon from '../assets/mypage-profile-edit-figma/album-action.svg';
import { ApiError, getMe, updateMe, type UserSummary } from '../lib/api';
import { resolveErrorMessage } from '../lib/resolve-error-message';
import { clearSession, getAccessToken, getStoredUser, saveStoredUser } from '../lib/session';

const ACTIVE_NAV_ICON_FILTER =
  'brightness(0) saturate(100%) invert(47%) sepia(16%) saturate(873%) hue-rotate(95deg) brightness(92%) contrast(87%)';

function isAuthError(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

function StatusBar() {
  return (
    <div className="flex h-[59px] w-[375px] items-center px-[24px] pb-[19px] pt-[21px]">
      <div className="flex min-w-0 flex-1 items-center">
        <span className="font-['SF_Pro'] text-[17px] font-[590] leading-[22px] tracking-[0px] text-[#000000]">9:41</span>
      </div>
      <div className="flex h-[22px] min-w-0 flex-1 items-center justify-end gap-[7px] pr-[1px] pt-[1px]">
        <img src={cellularConnectionIcon} alt="" className="h-[12.226px] w-[19.2px] shrink-0" />
        <img src={wifiIcon} alt="" className="h-[12.328px] w-[17.142px] shrink-0" />
        <img src={batteryFrameIcon} alt="" className="h-[13px] w-[27.328px] shrink-0" />
      </div>
    </div>
  );
}

function ProfileEditHeader({
  onSave,
  saving,
}: {
  onSave: () => void;
  saving: boolean;
}) {
  const navigate = useNavigate();

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/mypage');
  }

  return (
    <header className="flex h-[64px] w-[375px] items-center justify-between px-[16px] py-[20px]">
      <button
        type="button"
        aria-label="뒤로가기"
        onClick={handleBack}
        className="flex h-[24px] w-[24px] items-center justify-center"
      >
        <img src={arrowLeftIcon} alt="" className="h-[24px] w-[24px] shrink-0" />
      </button>

      <h1 className="flex h-[19px] items-center justify-center text-center font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-[#000000] [font-feature-settings:'case'_1]">
        프로필 수정
      </h1>

      <button
        type="button"
        aria-label="저장"
        onClick={onSave}
        disabled={saving}
        className="flex h-[19px] items-center justify-center font-['Pretendard'] text-[14px] font-[500] leading-[19.6px] tracking-[0px] text-[#5A876E] disabled:opacity-50 [font-feature-settings:'case'_1]"
      >
        {saving ? '저장 중' : '저장'}
      </button>
    </header>
  );
}

function ProfileAvatarArea({
  avatarUrl,
  onOpenBottomSheet,
}: {
  avatarUrl: string | null;
  onOpenBottomSheet: () => void;
}) {
  return (
    <div className="relative flex h-[100px] w-[375px] items-center justify-center">
      <button
        type="button"
        aria-label="프로필 사진 변경"
        onClick={onOpenBottomSheet}
        className="relative h-[100px] w-[100px]"
      >
        <div className="flex h-[100px] w-[100px] items-center justify-center overflow-hidden rounded-[999px] bg-[#F1F1F1]">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-[100px] w-[100px] shrink-0 object-cover" />
          ) : (
            <img src={avatarPlaceholderIcon} alt="" className="h-[100px] w-[100px] shrink-0" />
          )}
        </div>
      </button>
      <button
        type="button"
        aria-label="프로필 사진 변경"
        onClick={onOpenBottomSheet}
        className="absolute left-[217.5px] top-[67px] flex h-[24px] w-[24px] items-center justify-center rounded-[999px] bg-[#8A8A8A]"
      >
        <img src={cameraIcon} alt="" className="h-[14.219px] w-[14.219px] shrink-0" />
      </button>
    </div>
  );
}

function ProfilePhotoBottomSheet({
  open,
  onClose,
  onCameraClick,
  onAlbumClick,
}: {
  open: boolean;
  onClose: () => void;
  onCameraClick: () => void;
  onAlbumClick: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-[40] flex items-end">
      <button
        type="button"
        aria-label="배경 닫기"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(0,0,0,0.04)]"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-photo-bottom-sheet-title"
        className="relative flex h-[191px] w-[375px] flex-col items-center rounded-tl-[28px] rounded-tr-[28px] bg-[#FFFFFF] px-[24px] pb-[38px] pt-[31px]"
      >
        <h2
          id="profile-photo-bottom-sheet-title"
          className="flex h-[19px] w-[105px] items-center justify-center font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-[#000000] [font-feature-settings:'case'_1]"
        >
          프로필 사진 변경
        </h2>

        <div className="mt-[38px] flex h-[76px] w-[327px] flex-col gap-[36px]">
          <button type="button" onClick={onCameraClick} className="flex h-[20px] w-[327px] items-center gap-[12px] text-left">
            <img src={cameraActionIcon} alt="" className="h-[20px] w-[20px] shrink-0" />
            <span className="font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] tracking-[0px] text-[#131416] [font-feature-settings:'case'_1]">
              사진 촬영
            </span>
          </button>

          <button type="button" onClick={onAlbumClick} className="flex h-[20px] w-[327px] items-center gap-[12px] text-left">
            <img src={albumActionIcon} alt="" className="h-[20px] w-[20px] shrink-0" />
            <span className="font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] tracking-[0px] text-[#131416] [font-feature-settings:'case'_1]">
              앨범에서 선택
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}

function FieldLabel({ children }: { children: string }) {
  return (
    <span className="font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] tracking-[0px] text-[#131416] [font-feature-settings:'case'_1]">
      {children}
    </span>
  );
}

function OptionalLabel() {
  return (
    <span className="font-['Pretendard'] text-[12px] font-[400] leading-[14.4px] tracking-[0px] text-[#8A8A8A] [font-feature-settings:'case'_1]">
      (선택)
    </span>
  );
}

function FieldHelperText({ children }: { children: string }) {
  return (
    <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] tracking-[0px] text-[#8A8A8A] [font-feature-settings:'case'_1]">
      {children}
    </span>
  );
}

type FieldInputProps = {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  disabled?: boolean;
};

function FieldInput({ placeholder, value, onChange, readOnly = false, disabled = false }: FieldInputProps) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      disabled={disabled}
      className="h-[36px] w-[343px] rounded-[10px] bg-[#F8F8F8] px-[20px] font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] tracking-[0px] text-[#131416] outline-none disabled:opacity-100 disabled:text-[#D8D8D8] placeholder:font-['Pretendard'] placeholder:text-[14px] placeholder:font-[400] placeholder:leading-[16.8px] placeholder:tracking-[0px] placeholder:text-[#D8D8D8]"
    />
  );
}

type ExperienceChipProps = {
  active: boolean;
  label: string;
  onClick: () => void;
};

function ExperienceChip({ active, label, onClick }: ExperienceChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[40px] w-[169.5px] items-center gap-[8px] rounded-[10px] border px-[18px] ${
        active ? 'border-[#5A876E] bg-[#FFFFFF]' : 'border-[#E5E5E5] bg-[#FFFFFF]'
      }`}
    >
      <span
        className={`font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] tracking-[0px] ${
          active ? 'text-[#5A876E]' : 'text-[#BABABA]'
        } [font-feature-settings:'case'_1]`}
      >
        ✓
      </span>
      <span
        className={`font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] tracking-[0px] ${
          active ? 'text-[#5A876E]' : 'text-[#8A8A8A]'
        } [font-feature-settings:'case'_1]`}
      >
        {label}
      </span>
    </button>
  );
}

type ProfileFormValues = {
  nickname: string;
  experienceStatus: string;
  region: string;
  email: string;
  phone: string;
};

type ProfileFormAreaProps = {
  values: ProfileFormValues;
  onNicknameChange: (value: string) => void;
  onExperienceStatusChange: (value: string) => void;
  onRegionChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
};

function ProfileFormArea({
  values,
  onNicknameChange,
  onExperienceStatusChange,
  onRegionChange,
  onEmailChange,
  onPhoneChange,
}: ProfileFormAreaProps) {
  return (
    <div className="ml-[16px] mt-[2px] flex h-[417px] w-[343px] flex-col gap-[20px]">
      <div className="flex h-[61px] w-[343px] flex-col gap-[8px]">
        <FieldLabel>닉네임</FieldLabel>
        <FieldInput placeholder="닉네임" value={values.nickname} onChange={onNicknameChange} />
      </div>

      <div className="flex h-[61px] w-[343px] flex-col gap-[8px]">
        <FieldLabel>부업 경험 여부</FieldLabel>
        <div className="flex h-[40px] w-[343px] items-center gap-[4px]">
          <ExperienceChip
            active={values.experienceStatus === 'HAS_EXPERIENCE'}
            label="경험 있음"
            onClick={() => onExperienceStatusChange('HAS_EXPERIENCE')}
          />
          <ExperienceChip
            active={values.experienceStatus === 'NO_EXPERIENCE'}
            label="경험 없음"
            onClick={() => onExperienceStatusChange('NO_EXPERIENCE')}
          />
        </div>
      </div>

      <div className="flex h-[61px] w-[343px] flex-col gap-[8px]">
        <FieldLabel>거주지</FieldLabel>
        <FieldInput placeholder="선택해주세요" value={values.region} onChange={onRegionChange} />
      </div>

      <div className="flex h-[77px] w-[343px] flex-col gap-[8px]">
        <div className="flex items-center gap-[4px]">
          <FieldLabel>이메일</FieldLabel>
          <OptionalLabel />
        </div>
        <FieldInput placeholder="이메일 주소를 입력해주세요" value={values.email} onChange={onEmailChange} readOnly />
        <FieldHelperText>이메일은 현재 수정할 수 없습니다.</FieldHelperText>
      </div>

      <div className="flex h-[77px] w-[343px] flex-col gap-[8px]">
        <div className="flex items-center gap-[4px]">
          <FieldLabel>전화번호</FieldLabel>
          <OptionalLabel />
        </div>
        <FieldInput placeholder="- 없이 숫자만 입력하세요" value={values.phone} onChange={onPhoneChange} disabled />
        <FieldHelperText>전화번호 변경은 준비 중입니다.</FieldHelperText>
      </div>
    </div>
  );
}

type FabButtonProps = {
  variant: 'left' | 'right';
  onClick: () => void;
};

function FabButton({ variant, onClick }: FabButtonProps) {
  const isLeft = variant === 'left';

  if (isLeft) {
    return (
      <button
        type="button"
        aria-label="경험 작성"
        onClick={onClick}
        className="flex items-center gap-[8px] rounded-[10px] bg-[#FFFFFF] px-[10px] py-[12px] shadow-[0px_0px_4px_rgba(0,0,0,0.15)]"
      >
        <div className="flex h-[17px] w-[17px] items-center justify-center">
          <img src={editIcon} alt="" className="h-[17px] w-[17px] shrink-0" />
        </div>
        <span className="font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] tracking-[0px] text-[#000000] [font-feature-settings:'case'_1]">
          경험 작성
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label="작성하기"
      onClick={onClick}
      className="flex h-[36px] w-[36px] items-center justify-center rounded-[999px] bg-[#5A876E]"
    >
      <img src={plusFabIcon} alt="" className="h-[20.667px] w-[20.667px] shrink-0" />
    </button>
  );
}

type BottomNavItemProps = {
  icon: 'home' | 'explore' | 'guide' | 'mypage';
  label: string;
  active?: boolean;
  onClick: () => void;
};

function BottomNavItem({ icon, label, active = false, onClick }: BottomNavItemProps) {
  const opacityClassName = active ? 'opacity-100' : 'opacity-30';
  const iconFilter = active ? ACTIVE_NAV_ICON_FILTER : undefined;

  return (
    <button type="button" onClick={onClick} className={`flex flex-col items-center gap-[4px] ${opacityClassName}`}>
      <div className="flex h-[24px] w-[24px] items-center justify-center">
        {icon === 'home' ? (
          <img src={homeNavIcon} alt="" className="h-[24px] w-[24px] shrink-0" style={iconFilter ? { filter: iconFilter } : undefined} />
        ) : null}
        {icon === 'explore' ? (
          <img src={searchNavIcon} alt="" className="h-[24px] w-[24px] shrink-0" style={iconFilter ? { filter: iconFilter } : undefined} />
        ) : null}
        {icon === 'guide' ? (
          <img src={liveHelpNavIcon} alt="" className="h-[24px] w-[24px] shrink-0" style={iconFilter ? { filter: iconFilter } : undefined} />
        ) : null}
        {icon === 'mypage' ? (
          <img src={userNavIcon} alt="" className="h-[24px] w-[24px] shrink-0" style={iconFilter ? { filter: iconFilter } : undefined} />
        ) : null}
      </div>
      <span
        className={`font-['Pretendard'] text-[12px] leading-[12px] tracking-[0px] ${active ? 'font-[600] text-[#5A876E]' : 'font-[400] text-[#000000]'} [font-feature-settings:'case'_1]`}
      >
        {label}
      </span>
    </button>
  );
}

function FixedBottomArea() {
  const navigate = useNavigate();

  return (
    <div className="absolute bottom-0 left-0 flex h-[152px] w-[375px] flex-col items-center">
      <div className="flex h-[68px] w-[375px] items-center justify-between px-[24px] py-[16px]">
        <FabButton
          variant="left"
          onClick={() => {
            // TODO: Replace with a dedicated assisted writing route when it exists.
            navigate('/create');
          }}
        />
        <FabButton variant="right" onClick={() => navigate('/create')} />
      </div>
      <nav className="flex h-[84px] w-[375px] items-center justify-between rounded-tl-[20px] rounded-tr-[20px] bg-[#FFFFFF] px-[40px] pb-[32px] pt-[12px] shadow-[0px_0px_5px_rgba(0,0,0,0.15)]">
        <BottomNavItem icon="home" label="홈" onClick={() => navigate('/')} />
        <BottomNavItem icon="explore" label="탐색" onClick={() => navigate('/explore')} />
        <BottomNavItem icon="guide" label="가이드" onClick={() => navigate('/faq')} />
        <BottomNavItem icon="mypage" label="MY" active onClick={() => navigate('/mypage')} />
      </nav>
    </div>
  );
}

export default function MyPageProfileEdit() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const token = getAccessToken();
  const storedUser = getStoredUser();
  const [currentUser, setCurrentUser] = useState<UserSummary | null>(storedUser);
  const [nickname, setNickname] = useState(storedUser?.nickname ?? '');
  const [experienceStatus, setExperienceStatus] = useState(storedUser?.experienceStatus ?? '');
  const [region, setRegion] = useState(storedUser?.region ?? '');
  const [email, setEmail] = useState(storedUser?.email ?? '');
  const [phone, setPhone] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(storedUser?.profileImage ?? null);
  const [saving, setSaving] = useState(false);
  const [profilePhotoSheetOpen, setProfilePhotoSheetOpen] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    void getMe(token)
      .then((payload) => {
        if (cancelled) {
          return;
        }

        const user: UserSummary = payload.user;
        setCurrentUser(user);
        setNickname(user.nickname ?? '');
        setExperienceStatus(user.experienceStatus ?? '');
        setRegion(user.region ?? '');
        setEmail(user.email ?? '');
        setProfileImage(user.profileImage ?? null);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        if (isAuthError(error)) {
          clearSession();
          navigate('/auth?next=%2Fmypage%2Fprofile%2Fedit');
          return;
        }

        if (storedUser) {
          setCurrentUser(storedUser);
          setNickname(storedUser.nickname ?? '');
          setExperienceStatus(storedUser.experienceStatus ?? '');
          setRegion(storedUser.region ?? '');
          setEmail(storedUser.email ?? '');
          setProfileImage(storedUser.profileImage ?? null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [navigate, storedUser, token]);

  useEffect(() => {
    if (!profilePhotoSheetOpen) {
      return;
    }

    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setProfilePhotoSheetOpen(false);
      }
    }

    window.addEventListener('keydown', handleEscapeKey);

    return () => {
      window.removeEventListener('keydown', handleEscapeKey);
    };
  }, [profilePhotoSheetOpen]);

  async function handleSave() {
    const trimmedNickname = nickname.trim();

    if (!trimmedNickname) {
      showToast('닉네임을 입력해 주세요.');
      return;
    }

    if (!token || !currentUser) {
      showToast('로그인 정보를 확인할 수 없어요.');
      return;
    }

    setSaving(true);

    try {
      const payload = await updateMe(token, {
        nickname: trimmedNickname,
        fullName: currentUser.fullName ?? '',
        birthDate: currentUser.birthDate ?? '',
        gender: currentUser.gender ?? '',
        region: region.trim() || currentUser.region || '',
        signupPurposes: currentUser.signupPurposes ?? [],
        experienceStatus:
          experienceStatus === 'HAS_EXPERIENCE' || experienceStatus === 'NO_EXPERIENCE'
            ? experienceStatus
            : currentUser.experienceStatus || '',
        ageGroup: currentUser.ageGroup ?? '20s',
      });

      setCurrentUser(payload.user);
      saveStoredUser(payload.user);
      showToast('프로필을 저장했어요.', 'success');
      navigate('/mypage');
    } catch (error) {
      if (isAuthError(error)) {
        clearSession();
        navigate('/auth?next=%2Fmypage%2Fprofile%2Fedit');
        return;
      }

      showToast(resolveErrorMessage(error, '프로필을 저장하지 못했어요.'));
    } finally {
      setSaving(false);
    }
  }

  function handleOpenProfilePhotoSheet() {
    setProfilePhotoSheetOpen(true);
  }

  function handleCloseProfilePhotoSheet() {
    setProfilePhotoSheetOpen(false);
  }

  function handleCameraAction() {
    showToast('프로필 사진 변경 기능은 준비 중입니다.');
    handleCloseProfilePhotoSheet();
    // TODO: connect camera capture flow
  }

  function handleAlbumAction() {
    showToast('프로필 사진 변경 기능은 준비 중입니다.');
    handleCloseProfilePhotoSheet();
    // TODO: connect album picker flow
  }

  return (
    <div className="relative mx-auto min-h-[840px] w-[375px] overflow-hidden bg-[#FFFFFF]">
      <div className="h-[123px] w-[375px] bg-[#FFFFFF]">
        <StatusBar />
        <ProfileEditHeader onSave={handleSave} saving={saving} />
      </div>

      <main className="h-[calc(100dvh-123px)] min-h-[565px] w-[375px] overflow-y-auto bg-[#FFFFFF] pb-[152px]">
        <ProfileAvatarArea avatarUrl={profileImage} onOpenBottomSheet={handleOpenProfilePhotoSheet} />
        <ProfileFormArea
          values={{ nickname, experienceStatus, region, email, phone }}
          onNicknameChange={setNickname}
          onExperienceStatusChange={setExperienceStatus}
          onRegionChange={setRegion}
          onEmailChange={setEmail}
          onPhoneChange={setPhone}
        />
      </main>

      <FixedBottomArea />
      <ProfilePhotoBottomSheet
        open={profilePhotoSheetOpen}
        onClose={handleCloseProfilePhotoSheet}
        onCameraClick={handleCameraAction}
        onAlbumClick={handleAlbumAction}
      />
    </div>
  );
}
