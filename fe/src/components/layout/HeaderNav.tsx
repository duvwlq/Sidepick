import bellIcon from '../../assets/images/bell.svg';
import menuIcon from '../../assets/images/menu.svg';
import searchIcon from '../../assets/images/search.svg';

type HeaderLeftType = 'menu' | 'back' | 'none';
type RightIconType = 'bell' | 'search' | 'none';

type Props = {
  title: string;
  leftType?: HeaderLeftType;
  showRightIcon?: boolean;
  rightIcon?: RightIconType;
  onBack?: () => void;
  onMenuClick?: () => void;
  onRightIconClick?: () => void;
};

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[24px] w-[24px]" fill="none" aria-hidden="true">
      <path
        d="M15 6L9 12L15 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HeaderNav({
  title,
  leftType = 'menu',
  showRightIcon = true,
  rightIcon = 'bell',
  onBack,
  onMenuClick,
  onRightIconClick,
}: Props) {
  const renderLeftButton = () => {
    if (leftType === 'none') {
      return <div className="h-[24px] w-[24px]" />;
    }

    if (leftType === 'back') {
      return (
        <button
          type="button"
          onClick={onBack}
          className="flex h-[24px] w-[24px] items-center justify-center text-[#000000]"
          aria-label="뒤로가기"
        >
          <BackIcon />
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={onMenuClick}
        className="flex h-[24px] w-[24px] items-center justify-center"
        aria-label="메뉴 열기"
      >
        <img src={menuIcon} alt="" className="h-[24px] w-[24px]" />
      </button>
    );
  };

  const renderRightButton = () => {
    if (!showRightIcon || rightIcon === 'none') {
      return <div className="h-[24px] w-[24px]" />;
    }

    const icon = rightIcon === 'search' ? searchIcon : bellIcon;
    const label = rightIcon === 'search' ? '검색 열기' : '알림';

    return (
      <button
        type="button"
        onClick={onRightIconClick}
        className="flex h-[24px] w-[24px] items-center justify-center"
        aria-label={label}
      >
        <img src={icon} alt="" className="h-[24px] w-[24px]" />
      </button>
    );
  };

  return (
    <header className="fixed top-0 z-50 w-full max-w-[375px] bg-[#FFFFFF]">
      <div className="flex h-[64px] w-full items-center justify-between bg-[#FFFFFF] px-[16px] py-[20px]">
        <div className="flex h-[24px] w-[24px] items-center justify-start">
          {renderLeftButton()}
        </div>
        <h1 className="whitespace-nowrap text-center text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-[#000000]">
          {title}
        </h1>
        <div className="flex h-[24px] w-[24px] items-center justify-end">
          {renderRightButton()}
        </div>
      </div>
    </header>
  );
}
