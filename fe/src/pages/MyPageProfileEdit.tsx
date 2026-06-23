import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import albumActionIcon from '../assets/mypage-profile-edit-figma/album-action.svg';
import arrowLeftIcon from '../assets/auth-figma/arrow-left.svg';
import cameraActionIcon from '../assets/mypage-profile-edit-figma/camera-action.svg';
import checkIcon from '../assets/mypage-figma/check.svg';
import checkSelectedIcon from '../assets/mypage-figma/check-selected.svg';
import avatarPlaceholderIcon from '../assets/mypage-overview-figma/avatar-placeholder.svg';
import cameraIcon from '../assets/mypage-overview-figma/camera.svg';
import chevronDownIcon from '../assets/explore-figma/chevron-down.svg';
import BottomNav from '../components/layout/BottomNav';
import { useToast } from '../components/common/useToast';
import {
  ApiError,
  getMe,
  updateMyAccountSettings,
  uploadMyProfileImage,
  type UserSummary,
} from '../lib/api';
import { getProfileOverrides, mergeProfileOverrides, saveProfileOverrides } from '../lib/profile-overrides';
import { resolveErrorMessage } from '../lib/resolve-error-message';
import { clearSession, getAccessToken, getStoredUser, saveStoredUser } from '../lib/session';

const REGION_OPTIONS = ['서울', '경기', '인천', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '부산', '대구', '대전', '광주', '울산', '세종', '제주'];

function isAuthError(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <div className="font-['Pretendard'] text-[14px] font-[400] leading-[16.8px] text-black">{children}</div>;
}

function TextInput({
  value,
  placeholder,
  readOnly = false,
  trailingIcon,
  onClick,
  onChange,
}: {
  value: string;
  placeholder: string;
  readOnly?: boolean;
  trailingIcon?: ReactNode;
  onClick?: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <div
      className={`flex h-[40px] w-full items-center justify-between rounded-[10px] bg-[#F8F8F8] px-[16px] py-[10px] ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <input
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent font-['Pretendard'] text-[14px] font-[400] leading-[19.6px] text-[#131416] outline-none placeholder:text-[#BABABA] read-only:pointer-events-none read-only:text-[#BABABA]"
      />
      {trailingIcon}
    </div>
  );
}

function ChoiceButton({
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
      className={`flex h-[40px] flex-1 items-center gap-[8px] rounded-[8px] px-[16px] py-[10px] ${
        selected ? 'border-[1.5px] border-[#5A876E] bg-white' : 'border border-[#E6E6E6] bg-white'
      }`}
    >
      <img src={selected ? checkSelectedIcon : checkIcon} alt="" className="h-[14px] w-[14px]" />
      <span
        className={`font-['Pretendard'] text-[14px] leading-[16.8px] ${
          selected ? 'font-[600] text-[#5A876E]' : 'font-[400] text-[#8A8A8A]'
        }`}
      >
        {label}
      </span>
    </button>
  );
}

function PhotoActionSheet({
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(0,0,0,0.28)]">
      <button type="button" onClick={onClose} className="absolute inset-0" aria-label="닫기" />
      <div className="relative w-full max-w-[375px] rounded-tl-[24px] rounded-tr-[24px] bg-white px-[24px] pb-[48px] pt-[24px]">
        <p className="text-center font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] text-black">프로필 사진 변경</p>
        <div className="mt-[24px] flex flex-col gap-[36px]">
          <button type="button" onClick={onCameraClick} className="flex items-center gap-[8px] text-left">
            <img src={cameraActionIcon} alt="" className="h-[20px] w-[20px]" />
            <span className="font-['Pretendard'] text-[14px] font-[500] leading-[19.6px] text-[#131416]">사진 촬영</span>
          </button>
          <button type="button" onClick={onAlbumClick} className="flex items-center gap-[8px] text-left">
            <img src={albumActionIcon} alt="" className="h-[20px] w-[20px]" />
            <span className="font-['Pretendard'] text-[14px] font-[500] leading-[19.6px] text-[#131416]">앨범에서 선택</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function RegionActionSheet({
  open,
  selectedRegion,
  onClose,
  onSelect,
}: {
  open: boolean;
  selectedRegion: string;
  onClose: () => void;
  onSelect: (value: string) => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(0,0,0,0.28)]">
      <button type="button" onClick={onClose} className="absolute inset-0" aria-label="닫기" />
      <div className="relative flex w-full max-w-[375px] flex-col rounded-tl-[24px] rounded-tr-[24px] bg-white px-[24px] pb-[32px] pt-[24px]">
        <p className="text-center font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] text-black">거주지 선택</p>
        <div className="mt-[20px] grid max-h-[360px] grid-cols-2 gap-[8px] overflow-y-auto">
          {REGION_OPTIONS.map((option) => {
            const active = option === selectedRegion;
            return (
              <button
                key={option}
                type="button"
                onClick={() => onSelect(option)}
                className={`flex h-[40px] items-center justify-center rounded-[10px] border font-['Pretendard'] text-[14px] leading-[16.8px] ${
                  active ? 'border-[#5A876E] bg-[#EAF3EE] font-[600] text-[#2F4D3D]' : 'border-[#E6E6E6] bg-white font-[400] text-[#494949]'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function MyPageProfileEdit() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const token = getAccessToken();
  const storedUser = mergeProfileOverrides(getStoredUser());
  const storedOverrides = getProfileOverrides();
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const albumInputRef = useRef<HTMLInputElement | null>(null);

  const [currentUser, setCurrentUser] = useState<UserSummary | null>(storedUser);
  const [nickname, setNickname] = useState(storedUser?.nickname ?? '');
  const [experienceStatus, setExperienceStatus] = useState(storedUser?.experienceStatus ?? 'NO_EXPERIENCE');
  const [region, setRegion] = useState(storedUser?.region ?? '');
  const [email, setEmail] = useState(storedUser?.email ?? '');
  const [phone, setPhone] = useState(storedOverrides.phone);
  const [savedPhone, setSavedPhone] = useState(storedOverrides.phone);
  const [previewImage, setPreviewImage] = useState(storedUser?.profileImage ?? '');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [regionSheetOpen, setRegionSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const hasChanges =
    nickname.trim() !== (currentUser?.nickname ?? '').trim() ||
    experienceStatus !== (currentUser?.experienceStatus ?? 'NO_EXPERIENCE') ||
    region !== (currentUser?.region ?? '') ||
    previewImage !== (currentUser?.profileImage ?? '') ||
    phone.trim() !== savedPhone.trim();

  useEffect(() => {
    if (!token) {
      navigate('/auth?next=%2Fmypage%2Fprofile%2Fedit', { replace: true });
      return;
    }

    let cancelled = false;

    void getMe(token)
      .then((payload) => {
        if (cancelled) return;

        const mergedUser = mergeProfileOverrides(payload.user);
        const overrides = getProfileOverrides();
        setCurrentUser(mergedUser);
        setNickname(mergedUser?.nickname ?? '');
        setExperienceStatus(mergedUser?.experienceStatus ?? 'NO_EXPERIENCE');
        setRegion(mergedUser?.region ?? '');
        setEmail(mergedUser?.email ?? '');
        setPhone(overrides.phone);
        setSavedPhone(overrides.phone);
        setPreviewImage(mergedUser?.profileImage ?? '');
      })
      .catch((error) => {
        if (cancelled) return;
        if (isAuthError(error)) {
          clearSession();
          navigate('/auth?next=%2Fmypage%2Fprofile%2Fedit', { replace: true });
          return;
        }
        showToast(resolveErrorMessage(error, '프로필 정보를 불러오지 못했어요.'), 'error');
      });

    return () => {
      cancelled = true;
    };
  }, [navigate, showToast, token]);

  async function handleImageChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) {
      return;
    }

    try {
      const payload = await uploadMyProfileImage(token!, file);
      const mergedUser = mergeProfileOverrides(payload.user);
      setCurrentUser(mergedUser);
      setPreviewImage(payload.imageUrl);
      if (mergedUser) {
        saveStoredUser(mergedUser);
      }
      saveProfileOverrides({
        phone,
        region,
        profileImage: payload.imageUrl,
      });
      setSheetOpen(false);
      showToast('프로필 이미지를 업로드했어요.', 'success');
    } catch (error) {
      showToast(resolveErrorMessage(error, '이미지를 불러오지 못했어요.'), 'error');
    }
  }

  async function handleSave() {
    const trimmedNickname = nickname.trim();
    const normalizedPhone = phone.replace(/\D/g, '').trim();
    const accountSettingsChanged =
      trimmedNickname !== (currentUser?.nickname ?? '').trim() ||
      experienceStatus !== (currentUser?.experienceStatus ?? 'NO_EXPERIENCE');

    if (!trimmedNickname) {
      showToast('닉네임을 입력해 주세요.', 'error');
      return;
    }

    if (!token || !currentUser) {
      showToast('로그인 정보를 확인할 수 없어요.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = accountSettingsChanged
        ? await updateMyAccountSettings(token, {
            nickname: trimmedNickname,
            experienceStatus,
          })
        : null;

      saveProfileOverrides({
        phone: normalizedPhone,
        region,
        profileImage: previewImage || null,
      });

      const mergedUser = mergeProfileOverrides({
        ...currentUser,
        ...(payload?.user ?? {}),
      });

      setCurrentUser(mergedUser);
      setSavedPhone(normalizedPhone);
      if (mergedUser) {
        saveStoredUser(mergedUser);
      }
      showToast('프로필 수정이 완료됐어요.', 'success');
      navigate('/mypage');
    } catch (error) {
      if (isAuthError(error)) {
        clearSession();
        navigate('/auth?next=%2Fmypage%2Fprofile%2Fedit', { replace: true });
        return;
      }
      showToast(resolveErrorMessage(error, '프로필 수정에 실패했어요.'), 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="mx-auto min-h-screen w-full max-w-[375px] bg-white">
        <header className="bg-white">
          <div className="flex items-center justify-between px-[16px] py-[20px]">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-[24px] w-[24px] items-center justify-center"
              aria-label="뒤로 가기"
            >
              <img src={arrowLeftIcon} alt="" className="h-[24px] w-[24px]" />
            </button>
            <h1 className="font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] text-black">프로필 수정</h1>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || !hasChanges}
              className={`font-['Pretendard'] text-[14px] font-[500] leading-[16.8px] ${
                hasChanges ? 'text-[#5A876E]' : 'text-[#D9D9D9]'
              }`}
            >
              저장
            </button>
          </div>
        </header>

        <main className="flex flex-col items-center pb-[128px]">
          <button type="button" onClick={() => setSheetOpen(true)} className="mt-[20px] flex flex-col items-center justify-center">
            <div className="relative flex h-[80px] w-[80px] items-center justify-center">
              <div className="flex h-[80px] w-[80px] items-center justify-center p-[8px]">
                {previewImage ? (
                  <img src={previewImage} alt="" className="h-[64px] w-[64px] rounded-full bg-[#F8F8F8] object-contain" />
                ) : (
                  <img src={avatarPlaceholderIcon} alt="" className="h-[64px] w-[64px]" />
                )}
              </div>
              <span className="absolute left-[49.5px] top-[49px] flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[#8A8A8A]">
                <img src={cameraIcon} alt="" className="h-[14px] w-[14px]" />
              </span>
            </div>
          </button>

          <section className="mt-[20px] flex w-full max-w-[343px] flex-col gap-[16px]">
            <div className="flex flex-col gap-[6px]">
              <FieldLabel>닉네임</FieldLabel>
              <TextInput value={nickname} placeholder="닉네임" onChange={setNickname} />
            </div>

            <div className="flex flex-col gap-[6px]">
              <FieldLabel>부업 경험 여부</FieldLabel>
              <div className="flex gap-[4px]">
                <ChoiceButton selected={experienceStatus === 'HAS_EXPERIENCE'} label="경험 있음" onClick={() => setExperienceStatus('HAS_EXPERIENCE')} />
                <ChoiceButton selected={experienceStatus === 'NO_EXPERIENCE'} label="경험 없음" onClick={() => setExperienceStatus('NO_EXPERIENCE')} />
              </div>
            </div>

            <div className="flex flex-col gap-[6px]">
              <FieldLabel>거주지</FieldLabel>
              <TextInput
                value={region}
                placeholder="지역을 선택해 주세요"
                readOnly
                onClick={() => setRegionSheetOpen(true)}
                onChange={setRegion}
                trailingIcon={<img src={chevronDownIcon} alt="" className="h-[16px] w-[16px]" />}
              />
            </div>

            <div className="flex flex-col gap-[6px]">
              <FieldLabel>
                <span className="flex items-center gap-[4px]">
                  <span>이메일</span>
                  <span className="text-[10px] leading-[12px] text-[#5E5E5E]">(선택)</span>
                </span>
              </FieldLabel>
              <TextInput value={email} placeholder="이메일 주소를 입력해 주세요" readOnly onChange={setEmail} />
            </div>

            <div className="flex flex-col gap-[6px]">
              <FieldLabel>
                <span className="flex items-center gap-[4px]">
                  <span>휴대폰 번호</span>
                  <span className="text-[10px] leading-[12px] text-[#5E5E5E]">(선택)</span>
                </span>
              </FieldLabel>
              <TextInput value={phone} placeholder="- 없이 숫자만 입력해 주세요" onChange={(value) => setPhone(value.replace(/\D/g, ''))} />
            </div>
          </section>
        </main>

        <BottomNav active="mypage" />
      </div>

      <PhotoActionSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onCameraClick={() => cameraInputRef.current?.click()}
        onAlbumClick={() => albumInputRef.current?.click()}
      />
      <RegionActionSheet
        open={regionSheetOpen}
        selectedRegion={region}
        onClose={() => setRegionSheetOpen(false)}
        onSelect={(value) => {
          setRegion(value);
          setRegionSheetOpen(false);
        }}
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => void handleImageChange(event.target.files)}
      />
      <input
        ref={albumInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => void handleImageChange(event.target.files)}
      />
    </>
  );
}
