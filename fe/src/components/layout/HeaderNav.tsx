import menuIcon from '../../assets/images/menu.svg';
import bellIcon from '../../assets/images/bell.svg';

type HeaderLeftType = 'menu' | 'back' | 'none';

type Props = {
  title: string;
  leftType?: HeaderLeftType;
  showRightIcon?: boolean;
  onBack?: () => void;
  onMenuClick?: () => void;
  onRightIconClick?: () => void;
};

export default function HeaderNav({
  title,
  leftType = 'menu',
  showRightIcon = true,
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
          ‹
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

  return (
    <header className="fixed top-0 z-50 w-full max-w-[375px] bg-white">
      <div className="flex h-[59px] items-center justify-between px-6 pb-[19px] pt-[21px] text-[17px] font-semibold text-black">
        <span>9:41</span>
        <div className="w-[80px]" />
      </div>

      <div className="flex h-16 items-center justify-between px-4 py-5">
        <div className="flex w-6 items-center justify-start">{renderLeftButton()}</div>

        <h1 className="text-base font-semibold leading-5 text-black">{title}</h1>

        <div className="flex w-6 items-center justify-end">
          {showRightIcon ? (
            <button
              type="button"
              onClick={onRightIconClick}
              className="flex size-6 items-center justify-center"
              aria-label="알림"
            >
              <img src={bellIcon} alt="" className="h-6 w-6" />
            </button>
          ) : (
            <div className="size-6" />
          )}
        </div>
      </div>
    </header>
  );
}
