import type { ReactNode } from 'react';
import HeaderNav from './HeaderNav';
import BottomNav from './ButtomNav';

type HeaderLeftType = 'menu' | 'back' | 'none';

type Props = {
  children: ReactNode;
  title?: string;
  leftType?: HeaderLeftType;
  showRightIcon?: boolean;
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
          onBack={onBack}
          onMenuClick={onMenuClick}
          onRightIconClick={onRightIconClick}
        />
      ) : null}

      <main className={`${showHeader ? 'pt-[123px]' : ''} ${showBottomNav ? 'pb-[110px]' : ''}`}>
        {children}
      </main>

      {showBottomNav ? <BottomNav /> : null}
    </div>
  );
}
