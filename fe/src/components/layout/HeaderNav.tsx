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
      return <div className="size-6" />;
    }

    if (leftType === 'back') {
      return (
        <button
          type="button"
          onClick={onBack}
          className="flex size-6 items-center justify-center text-[24px] leading-none text-black"
          aria-label="뒤로가기"
        >
          ←
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={onMenuClick}
        className="flex size-6 items-center justify-center"
        aria-label="메뉴 열기"
      >
        <img src={menuIcon} alt="" className="h-6 w-6" />
      </button>
    );
  };

  const renderRightButton = () => {
    if (!showRightIcon || rightIcon === 'none') {
      return <div className="size-6" />;
    }

    const icon = rightIcon === 'search' ? searchIcon : bellIcon;
    const label = rightIcon === 'search' ? '검색 열기' : '알림';

    return (
      <button
        type="button"
        onClick={onRightIconClick}
        className="flex size-6 items-center justify-center"
        aria-label={label}
      >
        <img src={icon} alt="" className="h-6 w-6" />
      </button>
    );
  };

  return (
    <header className="fixed top-0 z-50 w-full max-w-[375px] bg-white">
      <div className="flex h-[59px] items-center justify-between px-6 pb-[19px] pt-[21px]">
        <span className="text-[17px] font-semibold leading-[22px] text-black">9:41</span>
        <div className="w-[80px]" />
      </div>

      <div className="flex items-center justify-between px-4 py-5">
        <div className="flex w-6 items-center justify-start">{renderLeftButton()}</div>
        <h1 className="text-[16px] font-semibold leading-[1.2] text-black">{title}</h1>
        <div className="flex w-6 items-center justify-end">{renderRightButton()}</div>
      </div>
    </header>
  );
}
