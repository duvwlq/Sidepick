import { Menu, ChevronLeft, Bell } from 'lucide-react';

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
      return <div className="w-8" />;
    }

    if (leftType === 'back') {
      return (
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center"
          aria-label="뒤로가기"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={onMenuClick}
        className="flex h-8 w-8 items-center justify-center"
        aria-label="메뉴 열기"
      >
        <Menu className="h-6 w-6" />
      </button>
    );
  };

  return (
    <header className="fixed top-0 z-50 flex h-16 w-full max-w-md items-center justify-between border-gray-200 bg-white px-4">
      <div className="flex w-8 items-center justify-start">
        {renderLeftButton()}
      </div>

      <h1 className="text-center justify-center text-black text-base font-medium font-['Pretendard'] leading-5">
        {title}
      </h1>

      <div className="flex w-8 items-center justify-end">
        {showRightIcon ? (
          <button
            type="button"
            onClick={onRightIconClick}
            className="flex h-8 w-8 items-center justify-center"
            aria-label="알림"
          >
            <Bell className="h-6 w-6" />
          </button>
        ) : (
          <div className="w-8" />
        )}
      </div>
    </header>
  );
}
