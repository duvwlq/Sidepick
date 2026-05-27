import bellIcon from '../../assets/images/bell.svg';
import menuIcon from '../../assets/images/menu.svg';
import searchIcon from '../../assets/images/search.svg';

type HeaderLeftType = 'menu' | 'back' | 'none';
type RightIconType = 'bell' | 'search' | 'menu' | 'none';

type Props = {
  title: string;
  leftType?: HeaderLeftType;
  showRightIcon?: boolean;
  rightIcon?: RightIconType;
  showStatusBar?: boolean;
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
  showStatusBar = false,
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

    const icon = rightIcon === 'search' ? searchIcon : rightIcon === 'menu' ? menuIcon : bellIcon;
    const label =
      rightIcon === 'search' ? '검색 열기' : rightIcon === 'menu' ? '메뉴 열기' : '알림';

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
    <header
      className="fixed top-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 bg-[#FFFFFF] notranslate"
      translate="no"
    >
      {showStatusBar ? <StatusBar /> : null}
      <div className="flex h-[64px] w-full items-center bg-[#FFFFFF] px-[16px] py-[20px]">
        <div className="flex h-[24px] w-[24px] shrink-0 items-center justify-start">{renderLeftButton()}</div>
        <h1
          translate="no"
          className="min-w-0 flex-1 px-[12px] text-center font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] tracking-[0px] text-[#000000] [font-feature-settings:'case'_1]"
        >
          {title}
        </h1>
        <div className="flex h-[24px] w-[24px] shrink-0 items-center justify-end">{renderRightButton()}</div>
      </div>
    </header>
  );
}

function StatusBar() {
  return (
    <div className="flex h-[59px] w-full items-center justify-between bg-[#FFFFFF] px-[24px] pb-[19px] pt-[21px]">
      <div className="flex h-[22px] min-w-0 flex-1 items-center justify-center pt-[1.5px]">
        <p
          translate="no"
          className="text-center font-['SF_Pro'] text-[17px] font-[600] leading-[22px] tracking-[0px] text-[#000000]"
        >
          9:41
        </p>
      </div>
      <div className="flex h-[22px] min-w-0 flex-1 items-center justify-center gap-[7px] pr-[1px] pt-[1px]">
        <div className="flex h-[12.226px] w-[19.2px] items-end gap-[1.6px]">
          <div className="h-[4px] w-[3px] rounded-[999px] bg-[#000000]" />
          <div className="h-[6px] w-[3px] rounded-[999px] bg-[#000000]" />
          <div className="h-[9px] w-[3px] rounded-[999px] bg-[#000000]" />
          <div className="h-[12.226px] w-[3px] rounded-[999px] bg-[#000000]" />
        </div>
        <div className="relative h-[12.328px] w-[17.142px]">
          <div className="absolute bottom-0 left-0 h-[8px] w-[17.142px] rounded-t-[8px] border border-[#000000] border-b-0" />
          <div className="absolute bottom-[1.5px] left-[3.2px] h-[4.8px] w-[10.7px] rounded-t-[6px] border border-[#000000] border-b-0" />
          <div className="absolute bottom-[3px] left-[6.2px] h-[2.5px] w-[4.7px] rounded-t-[4px] border border-[#000000] border-b-0" />
        </div>
        <div className="relative h-[13px] w-[27.328px]">
          <div className="absolute left-0 top-0 h-[13px] w-[24.8px] rounded-[4.3px] border border-[#000000]" />
          <div className="absolute left-[2px] top-[2px] h-[9px] w-[18px] rounded-[2.5px] bg-[#000000]" />
          <div className="absolute right-0 top-[4px] h-[5px] w-[1.9px] rounded-r-[999px] bg-[#000000]" />
        </div>
      </div>
    </div>
  );
}
