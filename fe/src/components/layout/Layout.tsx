import type { ReactNode } from 'react';
import BottomNav from './ButtomNav';
import HeaderNav from './HeaderNav';

type HeaderLeftType = 'menu' | 'back' | 'none';

type Props = {
  children: ReactNode;
  title?: string;
  leftType?: HeaderLeftType;
  showRightIcon?: boolean;
  rightIcon?: 'bell' | 'search' | 'none';
  showHeader?: boolean;
  showBottomNav?: boolean;
  onBack?: () => void;
  onMenuClick?: () => void;
  onRightIconClick?: () => void;
};

export default function Layout({
  children,
  title = '사이드픽',
  leftType = 'menu',
  showRightIcon = true,
  rightIcon = 'bell',
  showHeader = true,
  showBottomNav = true,
  onBack,
  onMenuClick,
  onRightIconClick,
}: Props) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-[375px] bg-white">
      {showHeader ? (
        <HeaderNav
          title={title}
          leftType={leftType}
          showRightIcon={showRightIcon}
          rightIcon={rightIcon}
          onBack={onBack}
          onMenuClick={onMenuClick}
          onRightIconClick={onRightIconClick}
        />
      ) : null}

      <main
        className={`${showHeader ? 'pt-[64px]' : ''} ${
          showBottomNav ? 'pb-[110px]' : ''
        }`}
      >
        {children}
      </main>

      {showBottomNav ? <BottomNav /> : null}
    </div>
  );
}
